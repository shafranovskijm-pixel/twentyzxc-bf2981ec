import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PortfolioProject {
  id: string;
  title: string;
  location: string | null;
  description: string;
  tags: string[];
  price: string | null;
  price_alt: string | null;
  url: string;
  featured: boolean;
  is_internal: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface PortfolioSettings {
  id: string;
  featured_title: string;
  all_title: string;
  updated_at: string;
}

// Helper to make requests to tables not in generated types
const fetchFromTable = async <T>(
  table: string,
  options?: {
    select?: string;
    order?: { column: string; ascending?: boolean };
    eq?: { column: string; value: string };
    single?: boolean;
  }
): Promise<T> => {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/${table}`;
  const params = new URLSearchParams();
  
  params.append("select", options?.select || "*");
  
  if (options?.eq) {
    params.append(options.eq.column, `eq.${options.eq.value}`);
  }
  
  if (options?.order) {
    params.append("order", `${options.order.column}.${options.order.ascending !== false ? "asc" : "desc"}`);
  }

  const headers: HeadersInit = {
    "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    "Content-Type": "application/json",
  };

  if (options?.single) {
    headers["Accept"] = "application/vnd.pgrst.object+json";
  }

  const response = await fetch(`${url}?${params.toString()}`, { headers });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Database error");
  }
  
  return response.json();
};

const mutateTable = async (
  table: string,
  method: "POST" | "PATCH" | "DELETE",
  data?: Record<string, unknown>,
  eq?: { column: string; value: string }
): Promise<unknown> => {
  let url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/${table}`;
  
  if (eq) {
    url += `?${eq.column}=eq.${eq.value}`;
  }

  const { data: session } = await supabase.auth.getSession();
  const token = session?.session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  const headers: HeadersInit = {
    "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json",
    "Prefer": "return=representation",
  };

  const response = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Database error");
  }
  
  if (method === "DELETE") return null;
  return response.json();
};

export const usePortfolioProjects = () => {
  return useQuery({
    queryKey: ["portfolio-projects"],
    queryFn: async () => {
      console.log("Fetching portfolio projects via REST...");
      const data = await fetchFromTable<PortfolioProject[]>("portfolio_projects", {
        order: { column: "sort_order", ascending: true },
      });
      console.log("Portfolio projects loaded:", data?.length);
      return data || [];
    },
  });
};

export const usePortfolioSettings = () => {
  return useQuery({
    queryKey: ["portfolio-settings"],
    queryFn: async () => {
      console.log("Fetching portfolio settings via REST...");
      try {
        const data = await fetchFromTable<PortfolioSettings>("portfolio_settings", {
          eq: { column: "id", value: "main" },
          single: true,
        });
        console.log("Portfolio settings loaded:", data);
        return data;
      } catch {
        console.log("No settings found, using defaults");
        return null;
      }
    },
  });
};

export const useUpdateSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<PortfolioSettings>) => {
      return mutateTable("portfolio_settings", "PATCH", updates as Record<string, unknown>, { column: "id", value: "main" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolio-settings"] });
    },
  });
};

export const useUpdateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PortfolioProject> & { id: string }) => {
      return mutateTable("portfolio_projects", "PATCH", updates as Record<string, unknown>, { column: "id", value: id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolio-projects"] });
    },
  });
};

export const useReorderProjects = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projects: { id: string; sort_order: number }[]) => {
      const promises = projects.map(({ id, sort_order }) =>
        mutateTable("portfolio_projects", "PATCH", { sort_order }, { column: "id", value: id })
      );
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolio-projects"] });
    },
  });
};

export const useCreateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (project: Omit<PortfolioProject, "id" | "created_at" | "updated_at">) => {
      return mutateTable("portfolio_projects", "POST", project as Record<string, unknown>);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolio-projects"] });
    },
  });
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return mutateTable("portfolio_projects", "DELETE", undefined, { column: "id", value: id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolio-projects"] });
    },
  });
};

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

export const usePortfolioProjects = () => {
  return useQuery({
    queryKey: ["portfolio-projects"],
    queryFn: async () => {
      console.log("Fetching portfolio projects...");
      const { data, error } = await (supabase as any)
        .from("portfolio_projects")
        .select("*")
        .order("sort_order", { ascending: true });

      console.log("Portfolio projects result:", { data, error });
      if (error) {
        console.error("Portfolio projects error:", error);
        throw error;
      }
      return (data || []) as PortfolioProject[];
    },
  });
};

export const usePortfolioSettings = () => {
  return useQuery({
    queryKey: ["portfolio-settings"],
    queryFn: async () => {
      console.log("Fetching portfolio settings...");
      const { data, error } = await (supabase as any)
        .from("portfolio_settings")
        .select("*")
        .eq("id", "main")
        .maybeSingle();

      console.log("Portfolio settings result:", { data, error });
      if (error) {
        console.error("Portfolio settings error:", error);
        throw error;
      }
      return data as PortfolioSettings | null;
    },
  });
};

export const useUpdateSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<PortfolioSettings>) => {
      const { data, error } = await (supabase as any)
        .from("portfolio_settings")
        .update(updates)
        .eq("id", "main")
        .select()
        .single();

      if (error) throw error;
      return data;
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
      const { data, error } = await (supabase as any)
        .from("portfolio_projects")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
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
        (supabase as any)
          .from("portfolio_projects")
          .update({ sort_order })
          .eq("id", id)
      );
      
      const results = await Promise.all(promises);
      const errors = results.filter((r: any) => r.error);
      if (errors.length > 0) throw errors[0].error;
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
      const { data, error } = await (supabase as any)
        .from("portfolio_projects")
        .insert(project)
        .select()
        .single();

      if (error) throw error;
      return data;
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
      const { error } = await (supabase as any)
        .from("portfolio_projects")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolio-projects"] });
    },
  });
};

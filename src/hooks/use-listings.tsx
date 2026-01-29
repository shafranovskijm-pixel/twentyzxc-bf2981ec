import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Listing {
  id: string;
  user_id: string;
  category_id: string;
  title: string;
  slug: string | null;
  description: string | null;
  price: number | null;
  price_type: "fixed" | "negotiable" | "free";
  location: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  contact_telegram: string | null;
  images: string[];
  status: "pending" | "active" | "rejected" | "archived";
  views_count: number;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
  // Joined data
  category?: {
    id: string;
    name: string;
    slug: string;
    icon: string;
  };
  profile?: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

interface ListingsParams {
  categorySlug?: string;
  search?: string;
  location?: string;
  priceMin?: number;
  priceMax?: number;
  sortBy?: "created_at" | "price" | "views_count";
  sortOrder?: "asc" | "desc";
  limit?: number;
  offset?: number;
  userId?: string;
  status?: "pending" | "active" | "rejected" | "archived";
}

export function useListings(params: ListingsParams = {}) {
  const {
    categorySlug,
    search,
    location,
    priceMin,
    priceMax,
    sortBy = "created_at",
    sortOrder = "desc",
    limit = 20,
    offset = 0,
    userId,
    status,
  } = params;

  return useQuery({
    queryKey: ["listings", params],
    queryFn: async () => {
      let query = supabase
        .from("listings")
        .select(`
          *,
          category:categories(id, name, slug, icon)
        `)
        .order(sortBy, { ascending: sortOrder === "asc" })
        .range(offset, offset + limit - 1);

      // Apply filters
      if (categorySlug) {
        const { data: cat } = await supabase
          .from("categories")
          .select("id")
          .eq("slug", categorySlug)
          .maybeSingle();
        
        if (cat) {
          query = query.eq("category_id", cat.id);
        }
      }

      if (search) {
        query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
      }

      if (location) {
        query = query.ilike("location", `%${location}%`);
      }

      if (priceMin !== undefined) {
        query = query.gte("price", priceMin);
      }

      if (priceMax !== undefined) {
        query = query.lte("price", priceMax);
      }

      if (userId) {
        query = query.eq("user_id", userId);
      }

      if (status) {
        query = query.eq("status", status);
      } else if (!userId) {
        // Only show active listings by default (unless viewing own listings)
        query = query.eq("status", "active");
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Listing[];
    },
  });
}

export function useListing(id: string | undefined) {
  return useQuery({
    queryKey: ["listing", id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from("listings")
        .select(`
          *,
          category:categories(id, name, slug, icon)
        `)
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      
      // Increment view count
      if (data) {
        await supabase
          .from("listings")
          .update({ views_count: (data.views_count || 0) + 1 })
          .eq("id", id);
      }

      return data as Listing | null;
    },
    enabled: !!id,
  });
}

export interface CreateListingData {
  category_id: string;
  title: string;
  description?: string;
  price?: number;
  price_type: "fixed" | "negotiable" | "free";
  location?: string;
  contact_phone?: string;
  contact_email?: string;
  contact_telegram?: string;
  images?: string[];
}

export function useCreateListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateListingData) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Необходимо войти в систему");

      const { data: listing, error } = await supabase
        .from("listings")
        .insert({
          ...data,
          user_id: user.user.id,
          status: "active",
        })
        .select()
        .single();

      if (error) throw error;
      return listing;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
    },
  });
}

export function useUpdateListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Listing> & { id: string }) => {
      const { data: listing, error } = await supabase
        .from("listings")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return listing;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      queryClient.invalidateQueries({ queryKey: ["listing", variables.id] });
    },
  });
}

export function useDeleteListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("listings")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
    },
  });
}

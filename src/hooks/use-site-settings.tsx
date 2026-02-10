import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type SiteSettings = Record<string, string>;

export const useSiteSettings = () => {
  const queryClient = useQueryClient();

  const { data: settings = {}, isLoading } = useQuery<SiteSettings>({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings" as any)
        .select("key, value");
      if (error) throw error;
      const result: SiteSettings = {};
      (data as any[])?.forEach((row: { key: string; value: any }) => {
        result[row.key] = typeof row.value === "string" ? row.value : JSON.stringify(row.value);
      });
      return result;
    },
  });

  const updateSetting = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { error } = await supabase
        .from("site_settings" as any)
        .upsert({ key, value: JSON.stringify(value), updated_at: new Date().toISOString() } as any, { onConflict: "key" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
    },
  });

  const updateMultiple = useMutation({
    mutationFn: async (entries: { key: string; value: string }[]) => {
      for (const entry of entries) {
        const { error } = await supabase
          .from("site_settings" as any)
          .upsert({ key: entry.key, value: JSON.stringify(entry.value), updated_at: new Date().toISOString() } as any, { onConflict: "key" });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
    },
  });

  return { settings, isLoading, updateSetting, updateMultiple };
};

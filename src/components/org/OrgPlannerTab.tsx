import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Loader2, Trash2, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const OrgPlannerTab = ({ organizationId }: { organizationId: string }) => {
  const queryClient = useQueryClient();
  const [newTitle, setNewTitle] = useState("");

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["org-tasks", organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("org_tasks" as any)
        .select("*")
        .eq("organization_id", organizationId)
        .order("sort_order")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!organizationId,
  });

  const addTask = async () => {
    if (!newTitle.trim()) return;
    const { error } = await supabase.from("org_tasks" as any).insert({
      organization_id: organizationId,
      title: newTitle.trim(),
    } as any);
    if (error) { toast.error("Ошибка"); return; }
    setNewTitle("");
    queryClient.invalidateQueries({ queryKey: ["org-tasks", organizationId] });
  };

  const toggleTask = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const newStatus = status === "done" ? "todo" : "done";
      const { error } = await supabase.from("org_tasks" as any).update({ status: newStatus } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["org-tasks", organizationId] }),
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("org_tasks" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org-tasks", organizationId] });
      toast.success("Задача удалена");
    },
  });

  return (
    <div className="space-y-6 pb-20">
      <h2 className="text-lg font-semibold">Планер</h2>

      <div className="flex gap-2">
        <Input
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          placeholder="Новая задача..."
          onKeyDown={e => e.key === "Enter" && addTask()}
        />
        <Button onClick={addTask} size="icon"><Plus className="h-4 w-4" /></Button>
      </div>

      <Card>
        <CardContent className="p-4 space-y-2">
          {isLoading ? (
            <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">Нет задач</div>
          ) : (
            tasks.map((t: any) => (
              <div key={t.id} className="flex items-center gap-3 p-3 border rounded-lg group">
                <button
                  onClick={() => toggleTask.mutate({ id: t.id, status: t.status })}
                  className={cn(
                    "w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors",
                    t.status === "done" ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground hover:border-primary"
                  )}
                >
                  {t.status === "done" && <Check className="h-3 w-3" />}
                </button>
                <span className={cn("flex-1 text-sm", t.status === "done" && "line-through text-muted-foreground")}>{t.title}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 text-destructive h-8 w-8"
                  onClick={() => deleteTask.mutate(t.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OrgPlannerTab;

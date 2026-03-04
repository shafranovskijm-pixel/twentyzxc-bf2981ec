import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { UserPlus, MessageSquare, Trash2, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface Lead {
  id: string;
  source: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  message: string | null;
  telegram_chat_id: number | null;
  status: string;
  converted_client_id: string | null;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-500/20 text-blue-700 dark:text-blue-400",
  contacted: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400",
  converted: "bg-green-500/20 text-green-700 dark:text-green-400",
  rejected: "bg-red-500/20 text-red-700 dark:text-red-400",
};

const STATUS_LABELS: Record<string, string> = {
  new: "Новый",
  contacted: "Связались",
  converted: "Конвертирован",
  rejected: "Отклонён",
};

const LeadsPanel = () => {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState("all");

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["leads", filterStatus],
    queryFn: async () => {
      let query = supabase.from("leads").select("*").order("created_at", { ascending: false });
      if (filterStatus !== "all") query = query.eq("status", filterStatus);
      const { data, error } = await query;
      if (error) throw error;
      return data as Lead[];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("leads").update({ status } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leads"] }),
  });

  const deleteLead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("leads").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Лид удалён");
    },
  });

  const convertToClient = useMutation({
    mutationFn: async (lead: Lead) => {
      const { data, error } = await supabase.from("clients").insert({
        name: lead.name || `Лид от ${format(new Date(lead.created_at), "dd.MM.yyyy")}`,
        phone: lead.phone,
        email: lead.email,
        telegram: lead.telegram_chat_id ? String(lead.telegram_chat_id) : null,
        notes: lead.message ? `Из лида: ${lead.message}` : null,
      }).select("id").single();
      if (error) throw error;

      await supabase.from("leads").update({
        status: "converted",
        converted_client_id: data.id,
      } as any).eq("id", lead.id);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["planner-clients"] });
      toast.success("Лид конвертирован в клиента");
    },
    onError: () => toast.error("Ошибка конвертации"),
  });

  const newCount = leads.filter(l => l.status === "new").length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Лиды
            {newCount > 0 && (
              <Badge variant="destructive" className="text-xs px-1.5 py-0">{newCount}</Badge>
            )}
          </CardTitle>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-32 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все</SelectItem>
              <SelectItem value="new">Новые</SelectItem>
              <SelectItem value="contacted">Связались</SelectItem>
              <SelectItem value="converted">Конвертированы</SelectItem>
              <SelectItem value="rejected">Отклонены</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 max-h-[300px] overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : leads.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Нет лидов</p>
        ) : (
          leads.map((lead) => (
            <div key={lead.id} className="flex items-start gap-3 p-3 rounded-md border bg-card group">
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">{lead.name || "Аноним"}</span>
                  <Badge className={`text-[10px] px-1.5 py-0 ${STATUS_COLORS[lead.status] || ""}`}>
                    {STATUS_LABELS[lead.status] || lead.status}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground ml-auto shrink-0">
                    {format(new Date(lead.created_at), "dd.MM HH:mm", { locale: ru })}
                  </span>
                </div>
                {lead.message && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{lead.message}</p>
                )}
                {(lead.phone || lead.email) && (
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    {lead.phone && <span>📞 {lead.phone}</span>}
                    {lead.email && <span>✉️ {lead.email}</span>}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {lead.status === "new" && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      title="Конвертировать в клиента"
                      onClick={() => convertToClient.mutate(lead)}
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => updateStatus.mutate({ id: lead.id, status: "contacted" })}
                      title="Отметить как связались"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                    </Button>
                  </>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-60 hover:!opacity-100 text-destructive"
                  onClick={() => deleteLead.mutate(lead.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default LeadsPanel;

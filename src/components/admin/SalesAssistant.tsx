import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { TrendingUp, AlertTriangle, DollarSign, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, addMonths, isWithinInterval, isBefore } from "date-fns";
import LeadsPanel from "./LeadsPanel";

interface Contract {
  id: string;
  client_name: string;
  contract_number: string | null;
  contract_date: string | null;
  amount: number | null;
  amount_extra: number | null;
  payment_status: string | null;
  paid_until: string | null;
  is_archived: boolean;
  created_at: string;
}

function ForecastCards({ contracts }: { contracts: Contract[] }) {
  const queryClient = useQueryClient();
  const now = new Date();
  const active = contracts.filter(c => !c.is_archived);
  const [drilldown, setDrilldown] = useState<{ label: string; start: Date; end: Date } | null>(null);

  const getContractsForPeriod = (start: Date, end: Date) => {
    return active.filter(c => {
      const amount = (c.amount || 0) + (c.amount_extra || 0);
      if (!amount) return false;
      if (c.payment_status === "оплачено") return false;
      if (!c.paid_until && c.payment_status === "не оплачено") {
        const contractDate = c.contract_date ? new Date(c.contract_date) : new Date(c.created_at || now);
        return isWithinInterval(contractDate, { start, end }) || isWithinInterval(now, { start, end });
      }
      if (!c.paid_until) return false;
      const paidUntil = new Date(c.paid_until);
      return isWithinInterval(paidUntil, { start, end }) || isBefore(paidUntil, start);
    });
  };

  const calcForecast = (start: Date, end: Date) => {
    return getContractsForPeriod(start, end).reduce((sum, c) => sum + (c.amount || 0) + (c.amount_extra || 0), 0);
  };

  const periods = [
    { label: "Эта неделя", start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }), icon: DollarSign, color: "text-green-600" },
    { label: "Этот месяц", start: startOfMonth(now), end: endOfMonth(now), icon: TrendingUp, color: "text-blue-600" },
    { label: "След. месяц", start: startOfMonth(addMonths(now, 1)), end: endOfMonth(addMonths(now, 1)), icon: TrendingUp, color: "text-purple-600" },
  ];

  const overdue = active.filter(c => c.paid_until && isBefore(new Date(c.paid_until), now)).length;

  const updatePaymentStatus = async (contractId: string, status: string) => {
    const { error } = await supabase.from("contracts").update({ payment_status: status }).eq("id", contractId);
    if (error) { toast.error("Ошибка обновления"); return; }
    queryClient.invalidateQueries({ queryKey: ["sales-contracts"] });
    queryClient.invalidateQueries({ queryKey: ["admin-contracts"] });
    toast.success("Статус обновлён");
  };

  const updatePaidUntil = async (contractId: string, date: string) => {
    const { error } = await supabase.from("contracts").update({ paid_until: date || null }).eq("id", contractId);
    if (error) { toast.error("Ошибка обновления"); return; }
    queryClient.invalidateQueries({ queryKey: ["sales-contracts"] });
    queryClient.invalidateQueries({ queryKey: ["admin-contracts"] });
    toast.success("Дата обновлена");
  };

  const drilldownContracts = drilldown ? getContractsForPeriod(drilldown.start, drilldown.end) : [];
  const drilldownTotal = drilldownContracts.reduce((s, c) => s + (c.amount || 0) + (c.amount_extra || 0), 0);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {periods.map(({ label, start, end, icon: Icon, color }) => (
          <Card
            key={label}
            className="bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => setDrilldown({ label, start, end })}
          >
            <CardContent className="p-3 text-center">
              <Icon className={`w-4 h-4 mx-auto mb-1 ${color}`} />
              <p className="text-[11px] text-muted-foreground">{label}</p>
              <p className="text-xl font-bold tracking-tight">{calcForecast(start, end).toLocaleString("ru-RU")}₽</p>
              <ChevronRight className="w-3 h-3 mx-auto mt-1 text-muted-foreground/40" />
            </CardContent>
          </Card>
        ))}
      </div>
      {overdue > 0 && (
        <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-500/10 rounded-md px-3 py-2">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          Просроченных договоров: {overdue}
        </div>
      )}

      <Dialog open={!!drilldown} onOpenChange={(open) => !open && setDrilldown(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              {drilldown?.label} — {drilldownTotal.toLocaleString("ru-RU")}₽
            </DialogTitle>
          </DialogHeader>
          {drilldownContracts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Нет договоров в этом периоде</p>
          ) : (
            <div className="space-y-2">
              {drilldownContracts.map(c => {
                const amount = (c.amount || 0) + (c.amount_extra || 0);
                return (
                  <div key={c.id} className="rounded-lg border p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{c.client_name}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          №{c.contract_number || "—"}
                          {c.contract_date && ` от ${new Date(c.contract_date).toLocaleDateString("ru-RU")}`}
                        </p>
                      </div>
                      <p className="text-sm font-bold">{amount.toLocaleString("ru-RU")}₽</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[11px] text-muted-foreground">Статус оплаты</label>
                        <Select value={c.payment_status || "не оплачено"} onValueChange={(v) => updatePaymentStatus(c.id, v)}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="не оплачено">Не оплачено</SelectItem>
                            <SelectItem value="частично">Частично</SelectItem>
                            <SelectItem value="оплачено">Оплачено</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] text-muted-foreground">Оплачено до</label>
                        <Input
                          type="date"
                          className="h-8 text-xs"
                          value={c.paid_until || ""}
                          onChange={(e) => updatePaidUntil(c.id, e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

const SalesAssistant = () => {
  const { data: contracts = [] } = useQuery({
    queryKey: ["sales-contracts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("contracts")
        .select("id, client_name, contract_number, contract_date, amount, amount_extra, payment_status, paid_until, is_archived, created_at")
        .order("contract_number", { ascending: false });
      if (error) throw error;
      return data as Contract[];
    },
  });

  return (
    <div className="space-y-4 mt-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Прогноз поступлений
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ForecastCards contracts={contracts} />
        </CardContent>
      </Card>
      <LeadsPanel />
    </div>
  );
};

export default SalesAssistant;

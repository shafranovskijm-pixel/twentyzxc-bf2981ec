import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Loader2, Trash2, Save } from "lucide-react";
import { toast } from "sonner";

const OrgContractsTab = ({ organizationId }: { organizationId: string }) => {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [clientName, setClientName] = useState("");
  const [contractNumber, setContractNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ["org-contracts", organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("org_contracts" as any)
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!organizationId,
  });

  const handleCreate = async () => {
    if (!clientName.trim()) return toast.error("Укажите клиента");
    setSaving(true);
    try {
      const { error } = await supabase.from("org_contracts" as any).insert({
        organization_id: organizationId,
        client_name: clientName,
        contract_number: contractNumber || null,
        amount: amount ? parseFloat(amount) : null,
      } as any);
      if (error) throw error;
      toast.success("Договор создан");
      queryClient.invalidateQueries({ queryKey: ["org-contracts", organizationId] });
      setShowCreate(false);
      setClientName("");
      setContractNumber("");
      setAmount("");
    } catch { toast.error("Ошибка создания"); }
    setSaving(false);
  };

  const deleteContract = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("org_contracts" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org-contracts", organizationId] });
      toast.success("Договор удалён");
    },
  });

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Договоры</h2>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" />Добавить</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Новый договор</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Клиент *</Label><Input value={clientName} onChange={e => setClientName(e.target.value)} /></div>
              <div className="space-y-2"><Label>Номер договора</Label><Input value={contractNumber} onChange={e => setContractNumber(e.target.value)} /></div>
              <div className="space-y-2"><Label>Сумма</Label><Input type="number" value={amount} onChange={e => setAmount(e.target.value)} /></div>
              <Button onClick={handleCreate} disabled={saving} className="w-full">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}Создать
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : contracts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Нет договоров</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Клиент</TableHead>
                  <TableHead>Номер</TableHead>
                  <TableHead>Сумма</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="text-right sticky right-0 bg-card">⋮</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.client_name}</TableCell>
                    <TableCell>{c.contract_number || "—"}</TableCell>
                    <TableCell>{c.amount ? `${c.amount.toLocaleString()} ₽` : "—"}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{c.payment_status}</Badge></TableCell>
                    <TableCell className="text-right sticky right-0 bg-card">
                      <Button variant="ghost" size="icon" onClick={() => deleteContract.mutate(c.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OrgContractsTab;

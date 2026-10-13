import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type PaymentStatus = "unpaid" | "partial" | "paid";
type PaymentHistory = {
  requestId: string;
  changedAt: string;
  actorId: string;
  paidAmount: number | null;
  previousPaidAmount: number | null;
  paymentStatus: PaymentStatus;
  paidOn: string | null;
  confirmationSource: string | null;
  reason: string | null;
  invoiceId: string | null;
};
type InvoicePayment = {
  invoiceId: string;
  number: string | null;
  date: string | null;
  amountDue: number | null;
  paidAmount: number | null;
  remainingAmount: number | null;
  paymentStatus: PaymentStatus | null;
};
export type PaymentSnapshot = {
  clientId: string;
  contractId: string | null;
  invoiceId: string | null;
  amountDue: number | null;
  paidAmount: number | null;
  remainingAmount: number | null;
  paymentStatus: PaymentStatus | null;
  paymentRevision: number;
  knownPaidAmount?: number;
  legacyStatus: string | null;
  amountKnown: boolean;
  requiresInvoiceSelection?: boolean;
  paidOn?: string | null;
  confirmationSource?: string | null;
  linkedInvoices: InvoicePayment[];
  history: PaymentHistory[];
};

export type PaymentStateRow = {
  target_type: "contract" | "invoice";
  target_id: string;
  contract_id: string | null;
  amount_due: number | null;
  paid_amount: number | null;
  revision: number;
};

// The payment table is read-only for CRM users; all changes go through the
// revision-checked RPC used by the ChatGPT connection.
export function usePaymentStateRows() {
  return useQuery({
    queryKey: ["crm-payment-states"],
    queryFn: async () => {
      const rows: PaymentStateRow[] = [];
      for (let offset = 0; ; offset += 1000) {
        const { data, error } = await (supabase as any).from("crm_payment_states")
          .select("target_type,target_id,contract_id,amount_due,paid_amount,revision")
          .order("target_type").order("target_id").range(offset, offset + 999);
        if (error) throw error;
        rows.push(...data);
        if (data.length < 1000) return rows;
      }
    },
    staleTime: 30_000,
    retry: false,
  });
}

export const paymentStatusLabel = (status: PaymentStatus | null) => ({
  unpaid: "Не оплачен",
  partial: "Частично оплачен",
  paid: "Оплачен",
}[status || ""] || "Нет подтверждённых данных");

const money = (value: number | null | undefined) => value == null
  ? "Не подтверждено"
  : `${Number(value).toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽`;
const date = (value: string | null | undefined) => {
  if (!value) return "Не указана";
  // Payment dates are calendar dates, not UTC instants: preserve the day in
  // browsers west of UTC as well as in the client's local timezone.
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return `${value.slice(8, 10)}.${value.slice(5, 7)}.${value.slice(0, 4)}`;
  return new Date(value).toLocaleDateString("ru-RU");
};
const source = (value: string | null | undefined) => value === "bank_document"
  ? "Банковский документ"
  : value === "user_report" ? "Сообщение пользователя" : "Не указан";

interface PaymentDetailsButtonProps {
  clientId?: string | null;
  clientName: string;
  contractId?: string | null;
  invoiceId?: string | null;
  legacyStatus?: string | null;
  documentLabel?: string;
}

export default function PaymentDetailsButton({ clientId, clientName, contractId, invoiceId, legacyStatus, documentLabel }: PaymentDetailsButtonProps) {
  const [open, setOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const needsOwnerLookup = !clientId && !!invoiceId;
  // A legacy invoice may preserve an old legal name after its client card is
  // renamed. Once payment is managed, use its saved UUID before name lookup.
  const invoiceOwner = useQuery({
    queryKey: ["payment-invoice-owner", invoiceId],
    queryFn: async (): Promise<{ client_id: string } | null> => {
      const { data, error } = await (supabase as any).from("crm_payment_states")
        .select("client_id").eq("target_type", "invoice").eq("target_id", invoiceId).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: needsOwnerLookup,
    staleTime: 15_000,
    retry: false,
  });
  const ownerPending = needsOwnerLookup && invoiceOwner.isLoading;
  const ownerError = needsOwnerLookup ? invoiceOwner.error : null;
  const savedClientId = clientId || invoiceOwner.data?.client_id;
  const clients = useQuery({
    queryKey: ["payment-client-candidates", clientName],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("id,name,inn").eq("name", clientName).order("id");
      if (error) throw error;
      return data;
    },
    enabled: !savedClientId && !ownerPending && !ownerError && !!clientName,
    staleTime: 30_000,
  });
  const candidates = clients.data || [];
  const selectedCandidate = candidates.find(candidate => candidate.id === selectedClientId);
  const resolvedClientId = savedClientId || (!ownerPending && !ownerError
    ? selectedCandidate?.id || (candidates.length === 1 ? candidates[0].id : null)
    : null);
  const activeInvoiceId = invoiceId || (open ? selectedInvoiceId : null);
  const payment = useQuery({
    queryKey: ["crm-payment", resolvedClientId, contractId || null, activeInvoiceId || null],
    queryFn: async (): Promise<PaymentSnapshot> => {
      const { data, error } = await (supabase as any).rpc("crm_get_payment_status", {
        p_client_id: resolvedClientId,
        p_contract_id: contractId || null,
        p_invoice_id: activeInvoiceId || null,
      });
      if (error) throw error;
      return data as PaymentSnapshot;
    },
    enabled: !!resolvedClientId && !!(contractId || activeInvoiceId),
    staleTime: 15_000,
    retry: false,
  });
  const { refetch } = payment;
  useEffect(() => {
    if (open && resolvedClientId) void refetch();
  }, [open, resolvedClientId, activeInvoiceId, refetch]);
  const snapshot = payment.data;
  const legacy = snapshot?.legacyStatus || legacyStatus;
  const error = ownerError || (!savedClientId && clients.error) || payment.error;
  const loading = ownerPending || (!savedClientId && clients.isLoading) || (!!resolvedClientId && payment.isLoading);
  const label = error ? "Оплата: ошибка загрузки"
    : loading ? "Загрузка оплаты…"
      : !resolvedClientId ? "Оплата: уточнить клиента"
        : paymentStatusLabel(snapshot?.paymentStatus || null);

  return (
    <span className="inline-flex max-w-full flex-col items-start gap-1" onClick={event => event.stopPropagation()} onKeyDown={event => event.stopPropagation()}>
      <button type="button" className="rounded text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => { setSelectedInvoiceId(null); setOpen(true); }} aria-label={`Оплата: ${documentLabel || (invoiceId ? "счёт" : "договор")}. Подробнее`}>
        <Badge variant={!error && snapshot?.paymentStatus === "paid" ? "default" : "outline"} className="cursor-pointer whitespace-normal text-left">
          {loading && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}{label}
        </Badge>
      </button>
      {!open && snapshot && snapshot.paidAmount != null && (
        <span className="text-[11px] text-muted-foreground">Поступило {money(snapshot.paidAmount)} · остаток {money(snapshot.remainingAmount)}</span>
      )}
      {!open && legacy && !snapshot?.paymentRevision && <span className="text-[10px] text-muted-foreground">Прежняя отметка: {legacy}</span>}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Оплата — {documentLabel || (invoiceId ? "счёт" : "договор")}</DialogTitle>
            <DialogDescription>{clientName}. Сохранённые сведения об оплате и история изменений.</DialogDescription>
          </DialogHeader>
          {resolvedClientId && <p className="text-xs text-muted-foreground break-all">Карточка клиента: {resolvedClientId}{!clientId && invoiceOwner.data?.client_id ? " · сохранённая связь оплаты с клиентом" : !clientId && candidates.length === 1 ? " · единственное точное совпадение по имени" : ""}</p>}
          {snapshot?.invoiceId && <p className="text-xs text-muted-foreground break-all">Идентификатор счёта: {snapshot.invoiceId}</p>}
          {!resolvedClientId && !loading && !error && (
            <div className="space-y-2">
              <p className="text-sm">{candidates.length ? "Найдено несколько клиентов с таким именем. Выберите карточку по ИНН и идентификатору." : "Не найдена карточка с точным именем клиента. Откройте оплату из нужной карточки клиента."}</p>
              {candidates.length > 1 && <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger aria-label="Выберите клиента для проверки оплаты"><SelectValue placeholder="Выберите клиента" /></SelectTrigger>
                <SelectContent>{candidates.map(candidate => <SelectItem key={candidate.id} value={candidate.id}>{candidate.name} · ИНН {candidate.inn || "не указан"} · {candidate.id}</SelectItem>)}</SelectContent>
              </Select>}
            </div>
          )}
          {loading && <p className="text-sm flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Проверяем сохранённые данные…</p>}
          {error && <p role="alert" className="text-sm text-destructive">Не удалось проверить оплату: {error.message}. Статус не изменён.</p>}
          {snapshot && !error && (
            <div className="space-y-4">
              {selectedInvoiceId && <Button size="sm" variant="outline" onClick={() => setSelectedInvoiceId(null)}>Все счета договора</Button>}
              <p className="font-semibold">{paymentStatusLabel(snapshot.paymentStatus)}</p>
              <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-lg bg-muted/40 p-3 text-sm">
                <div><dt className="text-muted-foreground">К оплате с учётом скидки</dt><dd className="font-medium">{money(snapshot.amountDue)}</dd></div>
                <div><dt className="text-muted-foreground">Всего поступило</dt><dd className="font-medium">{money(snapshot.paidAmount)}</dd></div>
                <div><dt className="text-muted-foreground">Остаток</dt><dd className="font-medium">{money(snapshot.remainingAmount)}</dd></div>
              </dl>
              {snapshot.paidAmount == null && Number(snapshot.knownPaidAmount) > 0 && <p className="text-sm">Подтверждено не менее {money(snapshot.knownPaidAmount)}. Общая сумма поступлений и остаток пока не подтверждены по всем счетам.</p>}
              {snapshot.paymentRevision > 0 && <p className="text-xs text-muted-foreground">Версия оплаты: {snapshot.paymentRevision} · дата платежа: {date(snapshot.paidOn)} · источник: {source(snapshot.confirmationSource)}</p>}
              {legacy && <p className="text-xs text-muted-foreground">Прежняя отметка: «{legacy}». Сама по себе она не подтверждает сумму поступлений.</p>}
              {snapshot.requiresInvoiceSelection && <p className="text-sm">У договора несколько счетов. Для изменения оплаты нужно указать конкретный счёт.</p>}
              {!activeInvoiceId && snapshot.linkedInvoices?.length > 0 && <div className="space-y-2">
                <h4 className="text-sm font-semibold">Счета договора</h4>
                {snapshot.linkedInvoices.map(invoice => <button key={invoice.invoiceId} type="button" className="w-full rounded-md border p-3 text-left text-sm hover:bg-muted/50" onClick={() => setSelectedInvoiceId(invoice.invoiceId)}>
                  <span className="block font-medium">Счёт №{invoice.number || "без номера"} от {date(invoice.date)} · {paymentStatusLabel(invoice.paymentStatus)}</span>
                  <span className="text-xs text-muted-foreground">К оплате {money(invoice.amountDue)} · поступило {money(invoice.paidAmount)} · остаток {money(invoice.remainingAmount)}</span>
                </button>)}
              </div>}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">История изменений оплаты</h4>
                {!snapshot.history?.length ? <p className="text-xs text-muted-foreground">Подтверждённых изменений пока нет.</p> : snapshot.history.map(entry => <div key={entry.requestId} className="rounded-md border p-3 text-xs space-y-1">
                  <p className="font-medium">{new Date(entry.changedAt).toLocaleString("ru-RU")} · {paymentStatusLabel(entry.paymentStatus)}</p>
                  <p className="text-muted-foreground break-all">Кто внёс (ID администратора): {entry.actorId}</p>
                  <p>Всего поступило: {money(entry.previousPaidAmount)} → {money(entry.paidAmount)}</p>
                  <p className="text-muted-foreground">Дата платежа: {date(entry.paidOn)} · {source(entry.confirmationSource)}</p>
                  {entry.invoiceId && <p className="text-muted-foreground break-all">Счёт: {entry.invoiceId}</p>}
                  {entry.reason && <p>{entry.reason}</p>}
                </div>)}
              </div>
              <p className="text-xs text-muted-foreground">Для изменения оплаты напишите в подключённом ChatGPT имя клиента, номер договора или счёта и общую поступившую сумму. История сохранится здесь.</p>
            </div>
          )}
          <Button variant="outline" size="sm" disabled={loading} onClick={() => { if (!clientId && invoiceId) void invoiceOwner.refetch(); if (!savedClientId) void clients.refetch(); if (resolvedClientId) void payment.refetch(); }}><RefreshCw className="mr-2 h-3.5 w-3.5" />Обновить данные оплаты</Button>
        </DialogContent>
      </Dialog>
    </span>
  );
}

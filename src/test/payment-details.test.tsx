import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PaymentDetailsButton, { type PaymentSnapshot } from "@/components/admin/payments/PaymentDetailsButton";

const db = vi.hoisted(() => ({ rpc: vi.fn(), from: vi.fn(), owner: null as { client_id: string } | null, candidates: [] as { id: string; name: string; inn: string }[] }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: db }));

const snapshot = (patch: Partial<PaymentSnapshot> = {}): PaymentSnapshot => ({
  clientId: "client-1", contractId: "contract-1", invoiceId: null,
  amountDue: 8000, paidAmount: 3000, remainingAmount: 5000,
  paymentStatus: "partial", paymentRevision: 1, legacyStatus: "частично",
  amountKnown: true, linkedInvoices: [], history: [], ...patch,
});

function show(props: Partial<React.ComponentProps<typeof PaymentDetailsButton>> = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(<QueryClientProvider client={client}><PaymentDetailsButton clientName="Тестовая организация" contractId="contract-1" documentLabel="Договор №20" {...props} /></QueryClientProvider>);
}

beforeEach(() => {
  db.rpc.mockReset();
  db.from.mockReset();
  db.owner = null;
  db.candidates = [{ id: "client-1", name: "Тестовая организация", inn: "1234567890" }];
  db.from.mockImplementation(table => table === "crm_payment_states"
    ? { select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: db.owner, error: null }) }) }) }) }
    : { select: () => ({ eq: () => ({ order: () => Promise.resolve({ data: db.candidates, error: null }) }) }) });
  db.rpc.mockResolvedValue({ data: snapshot(), error: null });
});
afterEach(cleanup);

describe("payment details CRM", () => {
  it("uses the exact saved client ID and displays saved discounted remaining amounts", async () => {
    show({ clientId: "client-1", invoiceId: "invoice-1" });
    await screen.findByText("Частично оплачен");
    expect(db.from).not.toHaveBeenCalled();
    expect(db.rpc).toHaveBeenCalledWith("crm_get_payment_status", { p_client_id: "client-1", p_contract_id: "contract-1", p_invoice_id: "invoice-1" });
    expect(screen.getByText(/Поступило.*3.*000.*остаток.*5.*000/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Оплата: Договор №20/ }));
    await screen.findByText("К оплате с учётом скидки");
    expect(screen.getByText(/8\s000,00 ₽/)).toBeInTheDocument();
    expect(db.rpc.mock.calls.every(call => call[0] === "crm_get_payment_status")).toBe(true);
  });

  it("does not pick one of several clients sharing the same name", async () => {
    db.candidates.push({ id: "client-2", name: "Тестовая организация", inn: "9876543210" });
    show();
    await screen.findByText("Оплата: уточнить клиента");
    expect(db.rpc).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /Оплата: Договор №20/ }));
    expect(await screen.findByText(/Найдено несколько клиентов/)).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Выберите клиента для проверки оплаты" })).toBeInTheDocument();
    expect(db.rpc).not.toHaveBeenCalled();
  });

  it("uses the saved payment owner of a legacy invoice after the client is renamed", async () => {
    db.candidates = [];
    db.owner = { client_id: "renamed-client-id" };
    show({ clientName: "Историческое название", invoiceId: "legacy-invoice", contractId: null });
    await screen.findByText("Частично оплачен");
    expect(db.from).toHaveBeenCalledWith("crm_payment_states");
    expect(db.from).not.toHaveBeenCalledWith("clients");
    expect(db.rpc).toHaveBeenCalledWith("crm_get_payment_status", { p_client_id: "renamed-client-id", p_contract_id: null, p_invoice_id: "legacy-invoice" });
  });

  it("keeps legacy paid flags distinct from unknown receipt amounts", async () => {
    db.rpc.mockResolvedValue({ data: snapshot({ paidAmount: null, remainingAmount: null, paymentStatus: null, paymentRevision: 0, legacyStatus: "оплачено" }), error: null });
    show({ clientId: "client-1", legacyStatus: "оплачено" });
    await screen.findByText("Нет подтверждённых данных");
    expect(screen.getByText("Прежняя отметка: оплачено")).toBeInTheDocument();
    expect(screen.queryByText(/Поступило/)).not.toBeInTheDocument();
  });

  it("selects a specific invoice for details and displays auditable source and date", async () => {
    const invoice = { invoiceId: "invoice-2", number: "22", date: "2026-10-13", amountDue: 8000, paidAmount: 3000, remainingAmount: 5000, paymentStatus: "partial" as const };
    db.rpc.mockImplementation((_name, args) => Promise.resolve({ data: args.p_invoice_id ? snapshot({ invoiceId: "invoice-2", history: [{ requestId: "request-1", actorId: "admin-1", changedAt: "2026-10-13T10:00:00Z", paidAmount: 3000, previousPaidAmount: null, paymentStatus: "partial", paidOn: "2026-10-12", confirmationSource: "user_report", reason: "Со слов клиента", invoiceId: "invoice-2" }] }) : snapshot({ linkedInvoices: [invoice], requiresInvoiceSelection: true }), error: null }));
    show({ clientId: "client-1" });
    await screen.findByText("Частично оплачен");
    fireEvent.click(screen.getByRole("button", { name: /Оплата: Договор №20/ }));
    fireEvent.click(await screen.findByRole("button", { name: /Счёт №22/ }));
    await waitFor(() => expect(db.rpc).toHaveBeenCalledWith("crm_get_payment_status", { p_client_id: "client-1", p_contract_id: "contract-1", p_invoice_id: "invoice-2" }));
    expect(await screen.findByText(/12.10.2026 · Сообщение пользователя/)).toBeInTheDocument();
    expect(screen.getByText("Со слов клиента")).toBeInTheDocument();
    expect(screen.getByText("Кто внёс (ID администратора): admin-1")).toBeInTheDocument();
  });

  it("does not present a legacy paid flag as a verified status on read failure", async () => {
    db.rpc.mockResolvedValue({ data: null, error: { message: "Нет доступа" } });
    show({ clientId: "client-1", legacyStatus: "оплачено" });
    await screen.findByText("Оплата: ошибка загрузки");
    fireEvent.click(screen.getByRole("button", { name: /Оплата: Договор №20/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Не удалось проверить оплату: Нет доступа");
    expect(screen.queryByText("Оплачен")).not.toBeInTheDocument();
  });
});

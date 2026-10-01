import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Database } from "@/integrations/supabase/types";

const data = vi.hoisted(() => ({
  contracts: [] as Database["public"]["Tables"]["contracts"]["Row"][],
  dismissed: {} as Record<string, string>,
  dismiss: vi.fn(async () => {}),
}));
vi.mock("@tanstack/react-query", () => ({
  useQuery: ({ queryKey }: { queryKey: string[] }) => ({ data: queryKey[0] === "notif-tab-contracts" ? data.contracts : [] }),
}));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/hooks/use-notification-settings", () => ({
  useNotificationSettings: () => ({ settings: { renewals: true }, update: vi.fn() }),
  useDismissedNotifications: () => ({ dismissed: data.dismissed, dismiss: data.dismiss, restoreAll: vi.fn() }),
  notificationTypeLabels: {},
}));
import NotificationsTab from "@/components/admin/NotificationsTab";
import { selectRenewalReminders } from "../../supabase/functions/_shared/renewal-reminders";
import { isDismissed } from "../../supabase/functions/_shared/notification-settings";

function contract(id: string, changes: Partial<Database["public"]["Tables"]["contracts"]["Row"]> = {}) {
  return {
    id, client_name: id, contract_number: id, contract_date: "2026-12-31", contract_type: "ФРДО",
    service_end: "2027-01-01", paid_until: null, payment_status: "не оплачено",
    is_archived: false, is_one_time: false, service_no_deadline: false, ...changes,
  } as Database["public"]["Tables"]["contracts"]["Row"];
}

describe("notification UI and Telegram renewal parity", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-12-31T13:30:00Z"));
    data.contracts = [];
    data.dismissed = {};
    data.dismiss.mockClear();
  });
  afterEach(() => { cleanup(); vi.useRealTimers(); });

  it("shows explicit upcoming service terms, excluding anniversary-only, one-off and indefinite rows", () => {
    data.contracts = [contract("Actual term"), contract("New document", { service_end: "2027-12-30" }),
      contract("Unknown term", { service_end: null }), contract("One-off", { is_one_time: true }),
      contract("Indefinite", { service_no_deadline: true }), contract("Archived", { is_archived: true })];
    render(<NotificationsTab onOpenContracts={vi.fn()} />);
    expect(screen.getByText("Проверить продление: Actual term")).toBeInTheDocument();
    expect(screen.getByText("ФРДО · услуги до 01.01.2027, через 1 дн.")).toBeInTheDocument();
    for (const name of ["New document", "Unknown term", "One-off", "Indefinite", "Archived"]) {
      expect(screen.queryByText(`Проверить продление: ${name}`)).not.toBeInTheDocument();
    }
  });

  it("labels paid_until as an unverified CRM period, not proof of receipt", () => {
    data.contracts = [contract("CRM period", { service_end: null, paid_until: "2026-12-31" })];
    render(<NotificationsTab onOpenContracts={vi.fn()} />);
    expect(screen.getByText("ФРДО · период по CRM до 31.12.2026, сегодня; факт оплаты не проверен")).toBeInTheDocument();
  });

  it("dismisses against the actual end year, which the Telegram helper and filter also use", () => {
    data.contracts = [contract("Next year")];
    render(<NotificationsTab onOpenContracts={vi.fn()} />);
    fireEvent.click(screen.getByTitle("Скрыть напоминание"));
    expect(data.dismiss).toHaveBeenCalledWith("renewals:Next year", "2027");
    const reminder = selectRenewalReminders(data.contracts, "2026-12-31")[0];
    expect(isDismissed({ "renewals:Next year": "2027" }, `renewals:${reminder.contract.id}`, reminder.expiryDate.slice(0, 4))).toBe(true);
  });

  it("honors a saved real-term year and ignores a different document-year dismissal", () => {
    data.contracts = [contract("Hidden"), contract("Still visible")];
    data.dismissed = { "renewals:Hidden": "2027", "renewals:Still visible": "2026" };
    render(<NotificationsTab onOpenContracts={vi.fn()} />);
    expect(screen.queryByText("Проверить продление: Hidden")).not.toBeInTheDocument();
    expect(screen.getByText("Проверить продление: Still visible")).toBeInTheDocument();
  });
});

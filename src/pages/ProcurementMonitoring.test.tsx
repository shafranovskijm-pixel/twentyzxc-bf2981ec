import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  auth: { user: null as null | { id: string }, isAdmin: false, isLoading: false },
  controls: {} as Record<string, unknown>, query: vi.fn(), save: vi.fn(), refetch: vi.fn(),
}));
vi.mock("@/components/Header", () => ({ default: () => <header>24ZXC</header> }));
vi.mock("@/components/Footer", () => ({ default: () => <footer>24ZXC</footer> }));
vi.mock("@/hooks/use-admin-auth", () => ({ useAdminAuth: () => state.auth }));
vi.mock("@/hooks/use-procurement-control", () => ({ useProcurementControl: (options: unknown) => {
  state.query(options);
  return { controls: state.controls, conflicts: [], isLoading: false, isRefreshing: false, isSaving: false, error: null, save: state.save, refetch: state.refetch };
} }));
vi.mock("@/data/procurement-monitoring", () => ({
  monitoringUpdatedAt: "21 сентября 2026, 10:00 Владивосток",
  currentCandidates: [
    { number: "RT-1", title: "Учебные материалы A", status: "clarify", statusLabel: "Уточняем документы", platform: "Росэлторг", price: "100 ₽", deadline: "23 сентября", confirmed: "Есть извещение", blocker: "Нужно ТЗ", nextStep: "Прочитать ТЗ", href: "https://rt.roseltorg.ru/1" },
    { number: "RT-2", title: "Сайт школы B", status: "waiting", statusLabel: "Ждём ответа", platform: "Мой бизнес", price: "200 ₽", deadline: "24 сентября", confirmed: "Есть письмо", blocker: "Ждём заказчика", nextStep: "Проверить почту", href: "https://msp03.ru/2" },
  ],
  deferredCandidates: [{ number: "RT-3", title: "Приложение C", price: "300 ₽", reason: "Нужен партнёр", unlock: "Найти партнёра", href: "https://rt.roseltorg.ru/3" }],
  platformAccess: [{ name: "Росэлторг", state: "open", stateLabel: "Доступен", visible: "Документы", blocked: "Кабинет не проверен", action: "Проверить кабинет", href: "https://rt.roseltorg.ru/" }],
  futurePlans: [{ customer: "Заказчик", month: "октябрь", subject: "План курса", price: "400 ₽", verdict: "Нужна проверка" }],
  growthRoadmap: [{ title: "Партнёры", text: "Найти исполнителя" }],
}));
import ProcurementMonitoring, { snapshotAgeDays } from "./ProcurementMonitoring";

const renderPage = () => render(<MemoryRouter><HelmetProvider><ProcurementMonitoring /></HelmetProvider></MemoryRouter>);
beforeEach(() => { vi.clearAllMocks(); state.auth = { user: null, isAdmin: false, isLoading: false }; state.controls = {}; });

describe("procurement monitoring working interface", () => {
  it("preserves public sections, filters by number/status, and reports snapshot freshness honestly", () => {
    renderPage();
    for (const id of ["current", "platforms", "plans", "deferred", "growth"]) expect(document.getElementById(id)).not.toBeNull();
    expect(screen.getByRole("note")).toHaveTextContent("без фонового автопоиска");
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "RT-2" } });
    expect(screen.getByText("Сайт школы B")).toBeInTheDocument();
    expect(screen.queryByText("Учебные материалы A")).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "" } });
    fireEvent.change(screen.getByRole("combobox", { name: "Статус закупки" }), { target: { value: "clarify" } });
    expect(screen.getByText("Учебные материалы A")).toBeInTheDocument();
    expect(screen.queryByText("Сайт школы B")).not.toBeInTheDocument();
    expect(snapshotAgeDays("21 сентября 2026", new Date("2026-09-21T15:00:00Z"))).toBe(1);
    expect(snapshotAgeDays("Дата неизвестна")).toBeNull();
  });

  it("does not mount private notes or controls for a visitor even if stale hook data exists", () => {
    state.controls = { "RT-1": { id: "secret-id", note: "Приватная цена 123", decision: "work", priority: "high", updatedAt: "2026-09-22T00:00:00Z" } };
    renderPage();
    expect(state.query).toHaveBeenCalledWith(expect.objectContaining({ enabled: false, userId: undefined }));
    expect(screen.queryByDisplayValue("Приватная цена 123")).not.toBeInTheDocument();
    expect(screen.queryByText("Сохранить поручение")).not.toBeInTheDocument();
  });

  it("offers real CRM refresh to administrators, not a synthetic updated timestamp", () => {
    state.auth = { user: { id: "admin" }, isAdmin: true, isLoading: false };
    renderPage();
    expect(state.query).toHaveBeenCalledWith(expect.objectContaining({ enabled: true, userId: "admin" }));
    fireEvent.click(screen.getByRole("button", { name: "Обновить поручения" }));
    expect(state.refetch).toHaveBeenCalledTimes(1);
    expect(screen.getByText("21 сентября 2026, 10:00 Владивосток")).toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });

  it("keeps a draft and shows an error when CRM refuses the save", async () => {
    state.auth = { user: { id: "admin" }, isAdmin: true, isLoading: false };
    state.save.mockRejectedValueOnce(new Error("CRM не подтвердила сохранение"));
    renderPage();
    const textarea = screen.getAllByLabelText("Комментарий")[0];
    fireEvent.change(textarea, { target: { value: "Проверить смету" } });
    fireEvent.submit(textarea.closest("form")!);
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("CRM не подтвердила"));
    expect(textarea).toHaveValue("Проверить смету");
    expect(screen.queryByText(/Поручение сохранено в CRM/)).not.toBeInTheDocument();
  });
});

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const notices = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn() }));
vi.mock("sonner", () => ({ toast: notices }));
import { AdminLoginDialog } from "./AdminLoginDialog";

beforeEach(() => { window.history.replaceState({}, "", "/"); notices.error.mockClear(); });
afterEach(cleanup);

function submitLogin() {
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "admin@example.test" } });
  fireEvent.change(screen.getByLabelText("Пароль"), { target: { value: "test-password" } });
  fireEvent.click(screen.getByRole("button", { name: "Войти" }));
}

describe("CRM login feedback", () => {
  it("shows a persistent error and reenables the form if the login callback rejects", async () => {
    render(<AdminLoginDialog open onLogin={async () => { throw new Error("storage denied"); }} />);
    submitLogin();
    expect(await screen.findByRole("alert")).toHaveTextContent("Не удалось выполнить вход");
    await waitFor(() => expect(screen.getByRole("button", { name: "Войти" })).toBeEnabled());
    expect(notices.error).toHaveBeenCalled();
  });

  it("distinguishes a timed-out server from invalid credentials", async () => {
    render(<AdminLoginDialog open onLogin={async () => ({ error: new Error("timeout"), reason: "request_timeout" })} />);
    submitLogin();
    expect(await screen.findByRole("alert")).toHaveTextContent("Результат входа пока не подтверждён");
    expect(screen.queryByText(/Email или пароль не подошли/)).not.toBeInTheDocument();
  });

  it("explains a service outage without asking the user to change a correct password", async () => {
    render(<AdminLoginDialog open onLogin={async () => ({ error: new Error("503"), reason: "service_unavailable" })} />);
    submitLogin();
    expect(await screen.findByRole("alert")).toHaveTextContent("Сервис входа временно недоступен");
    expect(screen.queryByText(/Email или пароль не подошли/)).not.toBeInTheDocument();
  });
});


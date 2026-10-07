import { describe, expect, it, vi } from "vitest";
import { acknowledgeSiteLead, siteSalesAcknowledgement } from "../../supabase/functions/_shared/site-sales";
import { SmtpDeliveryError, validateSmtpEmail } from "../../supabase/functions/_shared/crm-email/smtp";

const id = "11111111-1111-4111-8111-111111111111";
describe("site subscription acknowledgement", () => {
  it("uses the existing reply channel and approved package; rejects header injection", () => {
    const mail = siteSalesAcknowledgement(id, "qa@example.org");
    expect(mail.replyTo).toBe("shafranovskij.m+sites@gmail.com");
    expect(mail.html).toContain("3 000 ₽");
    expect(mail.html).toContain("3 рабочих дня после получения материалов");
    expect(mail.html).toContain("со следующего месяца");
    expect(() => validateSmtpEmail({ ...mail, replyTo: "test@example.org\r\nBcc: other@example.org" })).toThrow();
  });
  it("persists a claim before sending and records SMTP acceptance", async () => {
    const order: string[] = [];
    const deps = { claim: vi.fn(async () => { order.push("claim"); return true; }), send: vi.fn(async () => { order.push("send"); return { receipt: "250 accepted" }; }), finish: vi.fn(async () => { order.push("finish"); }) };
    expect(await acknowledgeSiteLead(id, "qa@example.org", deps)).toBe("accepted");
    expect(order).toEqual(["claim", "send", "finish"]);
    expect(deps.finish).toHaveBeenCalledWith(expect.objectContaining({ state: "accepted", receipt: "250 accepted" }));
  });
  it("never sends when another execution has claimed the lead", async () => {
    const deps = { claim: vi.fn(async () => false), send: vi.fn(), finish: vi.fn() };
    expect(await acknowledgeSiteLead(id, "qa@example.org", deps)).toBe("not_claimed");
    expect(deps.send).not.toHaveBeenCalled();
  });
  it("does not send if persistence is unavailable", async () => {
    const deps = { claim: vi.fn(async () => { throw new Error("database offline"); }), send: vi.fn(), finish: vi.fn() };
    await expect(acknowledgeSiteLead(id, "qa@example.org", deps)).rejects.toThrow("database offline");
    expect(deps.send).not.toHaveBeenCalled();
  });
  it("records uncertain SMTP outcome without retrying", async () => {
    const deps = { claim: vi.fn(async () => true), send: vi.fn(async () => { throw new SmtpDeliveryError("unknown", "SMTP_TIMEOUT_DATA"); }), finish: vi.fn(async () => {}) };
    expect(await acknowledgeSiteLead(id, "qa@example.org", deps)).toBe("unknown");
    expect(deps.send).toHaveBeenCalledTimes(1);
    expect(deps.finish).toHaveBeenCalledWith(expect.objectContaining({ state: "unknown" }));
  });
  it("leaves the durable claim for reconciliation when acceptance cannot be saved", async () => {
    const deps = { claim: vi.fn(async () => true), send: vi.fn(async () => ({ receipt: "250 accepted" })), finish: vi.fn(async () => { throw new Error("database offline"); }) };
    expect(await acknowledgeSiteLead(id, "qa@example.org", deps)).toBe("unknown");
    expect(deps.send).toHaveBeenCalledTimes(1);
  });
});

import { describe, expect, it } from "vitest";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { documentEmailErrorMessage } from "../lib/document-email-error";

describe("email refusal messages", () => {
  it("reads a real FunctionsHttpError while leaving its original response available", async () => {
    const body = { code: "CRM_COMPANY_BANK_ACCOUNT_RETIRED", error: "Документ содержит старый расчётный счёт. Создайте новую версию." };
    const response = new Response(JSON.stringify(body), { status: 409 });
    const error = new FunctionsHttpError(response);
    expect(await documentEmailErrorMessage(error)).toBe(body.error);
    expect(await response.json()).toEqual(body);
  });

  it("shows the actual unverified-attachment reason", async () => {
    const error = new FunctionsHttpError(new Response(JSON.stringify({ code: "CRM_PAYMENT_REQUISITES_UNVERIFIED", error: "Не удалось проверить реквизиты в фактическом вложении." }), { status: 409 }));
    expect(await documentEmailErrorMessage(error)).toBe("Не удалось проверить реквизиты в фактическом вложении.");
  });

  it("retains original errors and tolerates malformed or unrelated provider responses", async () => {
    for (const body of ["not JSON", JSON.stringify({ error: "Provider internals", code: "SMTP_FAILED" }), JSON.stringify({ error: {}, code: "CRM_INVALID" })]) {
      const error = new FunctionsHttpError(new Response(body, { status: 502 }));
      expect(await documentEmailErrorMessage(error)).toBe(error.message);
    }
    expect(await documentEmailErrorMessage(new Error("Не удалось сгенерировать PDF"))).toBe("Не удалось сгенерировать PDF");
    expect(await documentEmailErrorMessage(null, "Не удалось отправить файл")).toBe("Не удалось отправить файл");
  });
});

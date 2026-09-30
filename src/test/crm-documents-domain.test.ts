import { afterEach, describe, expect, it, vi } from "vitest";
import {
  calculateTotals,
  DocumentValidationError,
  validateDocumentInput,
  type DocumentInput,
  type InvoiceBasis,
} from "../../supabase/functions/_shared/crm-documents/domain.ts";
import {
  formatDocumentDate,
  renderDocument,
  type RenderContext,
} from "../../supabase/functions/_shared/crm-documents/render.ts";

const CLIENT_ID = "aaaaaaaa-1111-4111-8111-111111111111";
const CONTRACT_ID = "bbbbbbbb-2222-4222-8222-222222222222";
const invoiceBasis: InvoiceBasis = {
  source: "sintagma", sourceKind: "subscription_invoice",
  sourceId: "cccccccc-3333-4333-8333-333333333333",
  organizationId: "dddddddd-4444-4444-8444-444444444444",
  number: "СЧ-ТЕСТ/2026", date: "2026-09-23", amount: 100, currency: "RUB",
  payerName: 'ООО "Тестовый заказчик"', payerInn: "0000000000",
};

function invoice(patch: Partial<DocumentInput> = {}): DocumentInput {
  return {
    type: "invoice",
    clientId: CLIENT_ID,
    date: "2026-09-28",
    number: "ТЕСТ-1/2026",
    services: [{ name: "Тестовая услуга", qty: 1, price: 100 }],
    ...patch,
  };
}

function context(): RenderContext {
  return {
    assetOrigin: "https://24zxc.ru",
    client: {
      name: 'ООО "Тестовый заказчик"',
      inn: "0000000000",
      kpp: "000000000",
      ogrn: "0000000000000",
      address: "Тестовый адрес заказчика",
      director_name: "Иванов Иван Иванович",
      director_post: "Директор",
    },
    company: {
      company_name: "Тестовый исполнитель",
      company_short_name: "Тестовый исполнитель",
      company_inn: "000000000000",
      company_kpp: "",
      company_ogrn: "000000000000000",
      company_legal_address: "Тестовый адрес исполнителя",
      company_actual_address: "Тестовый адрес исполнителя",
      company_bank_account: "00000000000000000000",
      company_bank_bik: "000000000",
      company_bank_corr: "00000000000000000000",
      company_bank_name: "Тестовый банк",
      company_director_name: "Петров Пётр Петрович",
      company_director_post: "Директор",
      company_phone: "+70000000000",
      company_email: "test@example.invalid",
    },
  };
}

afterEach(() => vi.unstubAllGlobals());

describe("document monetary arithmetic", () => {
  it("rounds each fractional quantity line to kopecks before summing", () => {
    const totals = calculateTotals([
      { name: "Первая", qty: 0.5, price: 0.01 },
      { name: "Вторая", qty: 0.5, price: 0.01 },
      { name: "Третья", qty: 0.1, price: 0.2 },
    ]);
    expect(totals.lineTotalsMinor).toEqual([1, 1, 2]);
    expect(totals.grossMinor).toBe(4);
    expect(totals.totalAmount).toBe(0.04);
  });

  it("calculates percentage discount on the rounded gross and rounds half up", () => {
    const totals = calculateTotals([{ name: "Услуга", qty: 1, price: 0.05 }], { kind: "percent", value: 10 });
    expect(totals).toMatchObject({ grossMinor: 5, discountMinor: 1, netMinor: 4, totalAmount: 0.04 });
    expect(calculateTotals([{ name: "Услуга", qty: 1, price: 199.99 }], { kind: "percent", value: 12.5 }))
      .toMatchObject({ discountMinor: 2500, netMinor: 17499 });
  });

  it("supports an explicit amount and a 100% discount without negative totals", () => {
    expect(calculateTotals(invoice().services, { kind: "amount", value: 10.01 }).totalAmount).toBe(89.99);
    expect(calculateTotals(invoice().services, { kind: "percent", value: 100 }).totalAmount).toBe(0);
  });

  it("rejects unsafe totals before converting integers to JS numbers", () => {
    expect(() => calculateTotals([{ name: "Слишком много", qty: 1_000_000, price: 100_000_000 }]))
      .toThrow(DocumentValidationError);
  });
});

describe("document input validation", () => {
  it("accepts only complete explicit contract representatives for supported templates", () => {
    const contract = invoice({ type: "contract", template: "frdo", subject: "Услуга", deadline: "12 месяцев", paymentTerms: "авансом 100%" });
    const representative = { name: "  Сидоров Сергей Александрович  ", post: "Сотрудник управляющей организации", basis: "доверенности № TEST от 03.02.2025" };
    expect(validateDocumentInput({ ...contract, clientRepresentative: representative }).clientRepresentative)
      .toEqual({ ...representative, name: representative.name.trim() });
    for (const invalid of [null, {}, { ...representative, basis: " " }, { ...representative, post: undefined }, { ...representative, name: 1 }, { ...representative, extra: true }, { ...representative, basis: "x\u0000y" }]) {
      expect(() => validateDocumentInput({ ...contract, clientRepresentative: invalid })).toThrow(DocumentValidationError);
    }
    for (const wrongType of [invoice(), invoice({ type: "act", contractId: CONTRACT_ID }), { ...contract, template: "nmo" }]) {
      expect(() => validateDocumentInput({ ...wrongType, clientRepresentative: representative })).toThrow(/представитель поддерживается/);
    }
  });
  it.each(["2026-02-29", "2026-04-31", "2026-00-01", "2026-13-01", "0000-01-01", "2026-09-28T00:00:00Z", "28.09.2026"])("rejects invalid date %s", (date) => {
    expect(() => validateDocumentInput(invoice({ date }))).toThrow(DocumentValidationError);
  });

  it("accepts leap dates and does not shift dates across timezones", () => {
    expect(validateDocumentInput(invoice({ date: "2024-02-29" })).date).toBe("2024-02-29");
    expect(formatDocumentDate("2026-01-01")).toBe("01.01.2026");
  });

  it.each([
    { qty: 0, price: 1 }, { qty: -1, price: 1 }, { qty: 1.0001, price: 1 },
    { qty: 1, price: -1 }, { qty: 1, price: 1.001 }, { qty: 1, price: Infinity },
    { qty: NaN, price: 1 }, { qty: 1_000_001, price: 1 }, { qty: 1, price: 100_000_001 },
  ])("rejects invalid service precision/bounds: %j", (service) => {
    expect(() => validateDocumentInput(invoice({ services: [{ name: "Услуга", ...service }] }))).toThrow(DocumentValidationError);
  });

  it.each([
    { kind: "percent", value: 100.01 }, { kind: "amount", value: 100.01 },
    { kind: "amount", value: -1 }, { kind: "percent", value: 1.001 },
    { kind: "amount", value: 1, deadline: "2026-02-30" },
    { kind: "amount", value: 1, deadline: "2026-09-27" },
    { kind: "both", value: 1 }, { kind: "amount", value: 1, percent: 10 },
  ])("rejects ambiguous or invalid discounts: %j", (discount) => {
    expect(() => validateDocumentInput({ ...invoice(), discount })).toThrow(DocumentValidationError);
  });

  it("rejects model-generated fields and invalid customer identifiers", () => {
    expect(() => validateDocumentInput({ ...invoice(), html: "<script>bad()</script>" })).toThrow(/неизвестное поле/);
    expect(() => validateDocumentInput(invoice({ clientId: "ООО Клиент" }))).toThrow(/UUID/);
    expect(() => validateDocumentInput({ ...invoice(), services: [{ name: "Услуга", qty: 1, price: "100" }] })).toThrow(DocumentValidationError);
  });

  it("requires actual contract terms and an act's linked contract", () => {
    expect(() => validateDocumentInput(invoice({ type: "contract" }))).toThrow(/subject/);
    expect(() => validateDocumentInput(invoice({ type: "contract", subject: "Услуга", deadline: "2026-10-01" }))).toThrow(/paymentTerms/);
    expect(() => validateDocumentInput(invoice({ type: "act" }))).toThrow(/contractId/);
    expect(() => validateDocumentInput(invoice({ type: "act", contractId: CONTRACT_ID, discount: { kind: "amount", value: 1 } })))
      .toThrow(/только для счёта/);
    expect(() => validateDocumentInput(invoice({ template: "frdo" }))).toThrow(/только для договора/);
  });

  it("validates explicit structural contract periods without deriving them from deadline text", () => {
    const contract = invoice({ type: "contract", subject: "Услуги", deadline: "Срок по соглашению", paymentTerms: "100% аванс" });
    expect(validateDocumentInput(contract).servicePeriod).toBeUndefined();
    const servicePeriod = { start: "2026-10-01", end: "2027-10-01", noDeadline: false };
    expect(validateDocumentInput({ ...contract, servicePeriod }).servicePeriod).toEqual(servicePeriod);
    expect(validateDocumentInput({ ...contract, servicePeriod: { noDeadline: true } }).servicePeriod).toEqual({ noDeadline: true });
    for (const invalidPeriod of [
      { start: "2026-02-30", noDeadline: false },
      { start: "2026-10-02", end: "2026-10-01", noDeadline: false },
      { end: "2026-10-01", noDeadline: true },
      { start: "2026-10-01" },
      { noDeadline: false, inferred: true },
    ]) {
      expect(() => validateDocumentInput({ ...contract, servicePeriod: invalidPeriod })).toThrow(DocumentValidationError);
    }
    expect(() => validateDocumentInput({ ...invoice(), servicePeriod })).toThrow(/только для договора/);
  });

  it("accepts an exact invoice basis for an act without fabricating a contract", () => {
    const result = validateDocumentInput(invoice({ type: "act", invoiceBasis }));
    expect(result.invoiceBasis).toEqual(invoiceBasis);
    expect(result.contractId).toBeUndefined();
    expect(() => validateDocumentInput(invoice({ type: "act", invoiceBasis, contractId: CONTRACT_ID }))).toThrow(/одно основание/);
    expect(() => validateDocumentInput(invoice({ invoiceBasis }))).toThrow(/только для акта/);
  });

  it.each([
    { source: "manual" }, { sourceKind: "company_document" }, { sourceId: "unknown" },
    { organizationId: "unknown" }, { number: "" }, { number: "two\nlines" },
    { date: "2026-02-30" }, { date: "2026-09-29" }, { amount: 0 }, { amount: 99 },
    { amount: 101 }, { amount: 100.001 }, { currency: "USD" }, { payerInn: "123" },
    { payerName: "" }, { extra: "untrusted" },
  ])("rejects conflicting or incomplete invoice basis: %j", (patch) => {
    expect(() => validateDocumentInput({ ...invoice({ type: "act" }), invoiceBasis: { ...invoiceBasis, ...patch } }))
      .toThrow(DocumentValidationError);
  });
});

describe("server document renderer", () => {
  it("retains the proprietor's OGRNIP when an authorized representative signs the FRDO contract", () => {
    const ctx = context();
    ctx.client = { ...ctx.client, name: "ИП Иванов Иван Иванович", inn: "000000000000", ogrn: "000000000000000" };
    const representative = { name: "Сидоров Сергей Александрович", post: "Представитель", basis: "доверенности № TEST" };
    const rendered = renderDocument(invoice({ type: "contract", template: "frdo", subject: "Услуга", deadline: "12 месяцев", paymentTerms: "авансом 100%", clientRepresentative: representative }), ctx);
    expect(rendered.html).toContain("ИНН 000000000000 ОГРНИП 000000000000000");
    expect(rendered.html).not.toContain(" ОГРН 000000000000000");
    expect(rendered.html).toContain("Представитель __________ / Сидоров Сергей Александрович /");
    expect(rendered.html).toContain("на основании доверенности № TEST");
  });
  it.each(["standard", "frdo"] as const)("renders the explicit representative and authority in %s without changing director snapshots", template => {
    const ctx = context();
    const representative = { name: "Сидоров Сергей Александрович", post: 'Сотрудник ООО "Управляющая компания"', basis: "доверенности № TEST от 03.02.2025" };
    const contract = invoice({ type: "contract", template, subject: "Услуги", deadline: "12 месяцев", paymentTerms: "авансом 100%", clientRepresentative: representative });
    const rendered = renderDocument(contract, ctx);
    expect(rendered.html).toContain("в лице представителя Сидорова Сергея Александровича");
    expect(rendered.html).toContain("на основании доверенности № TEST от 03.02.2025");
    expect(rendered.html).not.toContain("на основании Устава");
    expect(rendered.html).not.toContain(ctx.client.director_name);
    expect(rendered.html.match(/\/ Сидоров Сергей Александрович \//g)).toHaveLength(template === "frdo" ? 3 : 1);
    expect(rendered.metadata.clientSnapshot).toEqual(ctx.client);
    expect(rendered.metadata.clientRepresentative).toEqual(representative);
    expect(rendered.metadata.documentInput).toMatchObject({ clientRepresentative: representative });
    const baseline = renderDocument({ ...contract, clientRepresentative: undefined }, ctx);
    expect(baseline.html).toContain("на основании Устава");
    const attack = '<img src=x onerror="bad()">';
    const escaped = renderDocument({ ...contract, clientRepresentative: { name: attack, post: attack, basis: attack } }, ctx);
    expect(escaped.html).not.toContain("<img src=x");
    expect(escaped.html).toContain("&lt;img src=x onerror=&quot;bad()&quot;&gt;");
    expect(escaped.metadata.clientRepresentative).toEqual({ name: attack, post: attack, basis: attack });
  });
  const cases: [string, Partial<DocumentInput>][] = [
    ["invoice", {}],
    ["act", { type: "act", contractId: CONTRACT_ID }],
    ...(["standard", "frdo", "nmo"] as const).map((template): [string, Partial<DocumentInput>] => [
      `contract/${template}`,
      { type: "contract", template, subject: "Явно заданная услуга", deadline: "2026-10-01", paymentTerms: "авансом 100%" },
    ]),
  ];

  it.each(cases)("renders %s without browser globals and with exact row totals", (_name, patch) => {
    vi.stubGlobal("window", undefined);
    const ctx = context();
    ctx.linkedContract = { id: CONTRACT_ID, number: "Д-1/2026", date: "2026-09-01" };
    const rendered = renderDocument(invoice({
      ...patch,
      services: [{ name: "Первая", qty: 0.5, price: 0.01 }, { name: "Вторая", qty: 0.5, price: 0.01 }],
    }), ctx);
    expect(rendered.html).toContain("<!DOCTYPE html>");
    expect(rendered.html).toContain("28.09.2026");
    expect(rendered.html).toContain('src="https://24zxc.ru/images/signature.png"');
    expect(rendered.html).toContain("0,02");
    expect(rendered.totalAmount).toBe(0.02);
    expect(rendered.metadata).toMatchObject({ schemaVersion: 1, grossMinor: 2, netMinor: 2 });
    if (patch.type === "act") expect(rendered.html).toContain("Д-1/2026 от 01.09.2026");
    if (patch.type === "contract") expect(rendered.html).toContain("01.10.2026");
  });

  it("escapes all external strings while retaining originals in snapshots", () => {
    const payload = '</td><script>alert("x")</script><img src=x onerror=alert(1)>';
    const ctx = context();
    ctx.client.name = payload;
    ctx.company.company_name = payload;
    ctx.company.company_director_name = payload;
    const input = invoice({ number: payload, services: [{ name: payload, qty: 1, price: 100 }] });
    const rendered = renderDocument(input, ctx);
    expect(rendered.html).not.toContain("<script>");
    expect(rendered.html).not.toContain("<img src=x");
    expect(rendered.html).toContain("&lt;script&gt;");
    expect(rendered.html).toContain("&quot;x&quot;");
    expect(rendered.services[0].name).toBe(payload);
    expect(rendered.metadata.clientSnapshot).toMatchObject({ name: payload });
    expect(rendered.metadata.documentInput).toEqual(validateDocumentInput(input));
  });

  it("escapes explicit contract terms and linked contract numbers", () => {
    const payload = "<script>bad()</script>";
    const contract = renderDocument(invoice({ type: "contract", subject: payload, deadline: payload, paymentTerms: payload }), context());
    expect(contract.html).not.toContain("<script>");
    const ctx = { ...context(), linkedContract: { id: CONTRACT_ID, number: payload, date: "2026-09-01" } };
    expect(renderDocument(invoice({ type: "act", contractId: CONTRACT_ID }), ctx).html).not.toContain("<script>");
  });

  it("renders one amount due, stores net total, and keeps CRM discount metadata", () => {
    const rendered = renderDocument(invoice({ discount: { kind: "percent", value: 12.5, deadline: "2026-10-01" } }), context());
    expect(rendered.totalAmount).toBe(87.5);
    expect(rendered.html.match(/К оплате со скидкой/g)).toHaveLength(1);
    expect(rendered.html).toContain("100,00");
    expect(rendered.html).toContain("87,50");
    expect(rendered.html).toContain("01.10.2026");
    expect(rendered.metadata).toMatchObject({ contractSubType: "site", grossAmount: 100, discountAmount: 12.5, netAmount: 87.5, discountDeadline: "2026-10-01" });
    expect(JSON.parse(JSON.stringify(rendered.metadata))).toEqual(rendered.metadata);
  });

  it("takes independent snapshots for later revisions", () => {
    const ctx = context();
    const input = invoice();
    const rendered = renderDocument(input, ctx);
    ctx.client.name = "Изменённые реквизиты";
    ctx.company.company_bank_account = "Другой счёт";
    input.services[0].price = 1000;
    expect(rendered.metadata.clientSnapshot).toMatchObject({ name: 'ООО "Тестовый заказчик"' });
    expect(rendered.metadata.companySnapshot).toMatchObject({ company_bank_account: "00000000000000000000" });
    expect(rendered.metadata.documentInput).toMatchObject({ services: [{ price: 100 }] });
  });

  it("rejects a missing linked contract and untrusted asset URLs", () => {
    expect(() => renderDocument(invoice({ type: "act", contractId: CONTRACT_ID }), context())).toThrow(/подтверждённые реквизиты/);
    expect(() => renderDocument(invoice(), { ...context(), assetOrigin: 'javascript:alert("x")' })).toThrow(/HTTPS origin/);
    expect(() => renderDocument(invoice(), { ...context(), assetOrigin: 'https://24zxc.ru/path' })).toThrow(/HTTPS origin/);
  });

  it("renders invoice acts with exact source provenance and no invented client signatory or acceptance", () => {
    const ctx = context();
    ctx.client.director_name = "";
    ctx.client.director_post = "";
    ctx.client.address = "";
    const rendered = renderDocument(invoice({ type: "act", invoiceBasis }), ctx);
    expect(rendered.html).toContain("К счёту №СЧ-ТЕСТ/2026 от 23.09.2026");
    expect(rendered.html).not.toContain("К Договору");
    expect(rendered.html).not.toContain("на основании Устава");
    expect(rendered.html).not.toContain("Заказчик принял");
    expect(rendered.html).not.toContain("претензий по объёму");
    expect(rendered.html).toContain("Уполномоченный представитель __________ / ________________ /");
    expect(rendered.metadata.invoiceBasisSnapshot).toEqual(invoiceBasis);
    expect(rendered.metadata.invoiceBasisProvenance).toBe("explicit-source-export");
    expect(() => renderDocument(invoice({ type: "act", invoiceBasis: { ...invoiceBasis, payerInn: "1111111111" } }), ctx))
      .toThrow(/ИНН плательщика/);
  });

  it("escapes source invoice strings while retaining the original snapshot", () => {
    const basis = { ...invoiceBasis, number: "<script>invoice</script>" };
    const rendered = renderDocument(invoice({ type: "act", invoiceBasis: basis }), context());
    expect(rendered.html).not.toContain("<script>");
    expect(rendered.html).toContain("&lt;script&gt;invoice&lt;/script&gt;");
    expect(rendered.metadata.invoiceBasisSnapshot).toEqual(basis);
  });
});

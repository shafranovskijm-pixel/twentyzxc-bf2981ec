import { describe, expect, it } from "vitest";
import { calculateDocumentMoney, documentStoredAmount } from "../lib/document-money";
import { generateInvoiceHtml, type DocumentData } from "../lib/document-templates";
import { calculateTotals } from "../../supabase/functions/_shared/crm-documents/domain";

function editorInvoiceData(services: DocumentData["services"], discountAmount: number, discountDeadline?: string): DocumentData {
  const money = calculateDocumentMoney(services, { kind: "amount", value: discountAmount });
  return {
    type: "invoice", number: "ТЕСТ-1", date: "28.09.2026", assetOrigin: "https://24zxc.ru",
    client: { name: "Тестовый клиент", inn: "", kpp: "", ogrn: "", address: "", director_name: "", director_post: "" },
    company: {
      company_name: "Тестовый исполнитель", company_short_name: "", company_inn: "", company_kpp: "", company_ogrn: "",
      company_legal_address: "", company_actual_address: "", company_bank_account: "", company_bank_bik: "",
      company_bank_corr: "", company_bank_name: "", company_director_name: "", company_director_post: "", company_phone: "", company_email: "",
    },
    services: services.map((service, index) => ({ ...service, computedLineTotal: money.lineTotalsMinor[index] / 100 })),
    computedGrossTotal: money.grossAmount, discountAmount: money.discountAmount, discountDeadline,
  };
}

describe("shared API/editor monetary calculation", () => {
  it("preserves an API invoice's net amount after CRM metadata/service serialization", () => {
    const services = [{ name: "Услуга", qty: 1, price: 100 }];
    const api = calculateTotals(services, { kind: "percent", value: 10 });
    const persisted = JSON.parse(JSON.stringify({ services, metadata: { discountAmount: api.discountAmount } }));
    const editor = calculateDocumentMoney(persisted.services, { kind: "amount", value: persisted.metadata.discountAmount });
    expect(documentStoredAmount("invoice", editor)).toBe(90);
    expect(documentStoredAmount("invoice", editor)).toBe(api.totalAmount);
    expect(generateInvoiceHtml(editorInvoiceData(persisted.services, persisted.metadata.discountAmount))).toContain("90,00");
  });

  it("keeps fractional rows and invoice HTML consistent with the API", () => {
    const services = [{ name: "Первая", qty: 0.5, price: 0.01 }, { name: "Вторая", qty: 0.5, price: 0.01 }];
    const api = calculateTotals(services);
    const editor = calculateDocumentMoney(services);
    expect(editor).toEqual(api);
    expect(documentStoredAmount("invoice", editor)).toBe(0.02);
    const html = generateInvoiceHtml(editorInvoiceData(services, 0));
    expect(html).toContain("0,02");
    expect(editor.lineTotalsMinor).toEqual([1, 1]);
  });

  it("stores net for companion invoices and keeps contract/act gross", () => {
    const money = calculateDocumentMoney([{ qty: 1, price: 100 }], { kind: "amount", value: 10 });
    expect(documentStoredAmount("invoice", money)).toBe(90);
    expect(documentStoredAmount("contract", money)).toBe(100);
    expect(documentStoredAmount("act", money)).toBe(100);
  });

  it("keeps a discount deadline as document text, independent of current time", () => {
    const services = [{ name: "Услуга", qty: 1, price: 100 }];
    const html = generateInvoiceHtml(editorInvoiceData(services, 10, "01.01.2020"));
    expect(html).toContain("При оплате до 01.01.2020");
    expect(html).toContain("90,00");
    expect(calculateDocumentMoney(services, { kind: "amount", value: 10 }).totalAmount).toBe(90);
  });

  it("allows an empty editor but rejects invalid numeric input and excessive discounts", () => {
    expect(calculateDocumentMoney([]).grossAmount).toBe(0);
    expect(() => calculateDocumentMoney([{ qty: 1, price: 1.001 }])).toThrow(RangeError);
    expect(() => calculateDocumentMoney([{ qty: 1.0001, price: 1 }])).toThrow(RangeError);
    expect(() => calculateDocumentMoney([{ qty: 0, price: 1 }])).toThrow(RangeError);
    expect(() => calculateDocumentMoney([{ qty: 1, price: 1 }], { kind: "amount", value: 2 })).toThrow(RangeError);
  });
});

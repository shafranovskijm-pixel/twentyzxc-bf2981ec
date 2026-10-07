import type { DocumentData } from "../../lib/document-templates.ts";

// Synthetic reproduction of a contract with supplier blanks in its main body
// and first appendix, plus the renderer's final requisites for appendix two.
export const signatureFixture: DocumentData = {
  type: "contract", number: "TEST-SIGNATURES", date: "2026-10-07", assetOrigin: "https://24zxc.ru",
  company: {
    company_name: "ТЕСТОВЫЙ ОБРАЗЕЦ — НЕ ДОКУМЕНТ", company_short_name: "Тест",
    company_inn: "", company_kpp: "", company_ogrn: "", company_legal_address: "Тестовый адрес", company_actual_address: "",
    company_bank_account: "", company_bank_bik: "", company_bank_corr: "", company_bank_name: "",
    company_director_name: "Иванов Иван Иванович", company_director_post: "Директор", company_phone: "", company_email: "",
  },
  client: { name: "Тестовый заказчик", inn: "", kpp: "", ogrn: "", address: "Тестовый адрес", director_name: "Петров Пётр Петрович", director_post: "Директор" },
  services: [{ name: "Тестовая услуга", qty: 1, price: 12000 }],
};

export const signatureBody = `## Основной договор
ТЕСТОВЫЙ ОБРАЗЕЦ — НЕ ДОКУМЕНТ. Условия основного договора.
УЦ:
{{company.signature}}
Заказчик:
____________________ / Петров П.П. /
М.П.

## Приложение № 1 — спецификация
{{services.table}}
УЦ:

{{company.signature}}

Заказчик:
____________________ / Петров П.П. /
М.П.

## Приложение № 2 — условия обслуживания
ТЕСТОВЫЙ ОБРАЗЕЦ — НЕ ДОКУМЕНТ. Условия второго приложения.`;

export const unsignedSignatureBody = signatureBody.replace(/\{\{company\.signature\}\}/g, "____________________ / Иванов И.И. /");

import { describe, expect, it } from "vitest";
import type { CompanyRequisites } from "../lib/document-templates";
import { normalizeCompanyRequisites } from "../lib/mcp/company-requisites";

const source = { company_name: "ИП Иванов Иван Иванович", company_director_name: "", company_director_post: "" } as CompanyRequisites;

describe("configured sole proprietor signature", () => {
  it.each(["ИП Иванов Иван Иванович", "  Индивидуальный предприниматель Иванов Иван Иванович  "])("uses the explicit legal name %s", company_name => {
    expect(normalizeCompanyRequisites({ ...source, company_name })).toMatchObject({ company_director_name: "Иванов Иван Иванович", company_director_post: "ИП" });
  });
  it("does not mutate stored settings or replace explicitly configured signatures", () => {
    expect(normalizeCompanyRequisites({ ...source, company_director_name: "Петров Пётр Петрович", company_director_post: "Представитель" })).toMatchObject({ company_director_name: "Петров Пётр Петрович", company_director_post: "Представитель" });
    normalizeCompanyRequisites(source);
    expect(source.company_director_name).toBe("");
  });
  it("does not label a different representative as the sole proprietor", () => {
    expect(normalizeCompanyRequisites({ ...source, company_director_name: "Петров Пётр Петрович" }).company_director_post).toBe("");
  });
  it.each(["ООО Тест", "ИП", "ИПТест", "Тестовый исполнитель"])("does not invent a signature for %s", company_name => {
    expect(normalizeCompanyRequisites({ ...source, company_name })).toMatchObject({ company_director_name: "", company_director_post: "" });
  });
});

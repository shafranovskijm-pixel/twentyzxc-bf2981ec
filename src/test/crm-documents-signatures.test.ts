import { describe, expect, it } from "vitest";
import { JSDOM } from "jsdom";
import { generateCustomContractHtml, getCustomContractTokens } from "../lib/custom-contract-template";
import { signatureBody, signatureFixture, unsignedSignatureBody } from "./fixtures/custom-contract-signatures";

const content = { title: "ТЕСТОВЫЙ ОБРАЗЕЦ", body: signatureBody };
const generate = (body: string) => generateCustomContractHtml(signatureFixture, { ...content, body });

describe("custom contract supplier signatures", () => {
  it("renders the supplier signature and stamp in the main body, appendix and final block; never stamps the customer", () => {
    const doc = new JSDOM(generate(signatureBody)).window.document;
    expect(doc.querySelectorAll(".signature-img")).toHaveLength(3);
    expect(doc.querySelectorAll(".stamp-img")).toHaveLength(3);
    expect(doc.querySelectorAll(".custom-body .custom-company-signature")).toHaveLength(2);
    for (const block of doc.querySelectorAll(".custom-company-signature")) {
      expect(block.querySelectorAll("img")).toHaveLength(2);
      expect(block.textContent).toContain("Иванов Иван Иванович");
      expect(block.textContent).not.toContain("Петров");
    }
    const finalCustomer = doc.querySelector("body > .signatures .signature-block:last-child")!;
    expect(finalCustomer.textContent).toContain("Петров Пётр Петрович");
    expect(finalCustomer.querySelectorAll("img")).toHaveLength(0);
    expect(doc.querySelector(".custom-body")!.textContent!.match(/____________________ \/ Петров П.П. \//g)).toHaveLength(2);
  });

  it("rejects the original failure: supplier blank lines even if a signed block is appended automatically", () => {
    expect(() => generate(unsignedSignatureBody)).toThrow("{{company.signature}}");
    for (const name of ["Иванов Иван Иванович", "Иванов И.И.", "Иванов И. И.", "ИВАНОВ И.И."]) {
      expect(() => generate(`УЦ:\n________ / ${name} /`)).toThrow("пустая подпись исполнителя");
    }
  });

  it("also catches unresolved supplier blanks in literal variables", () => {
    expect(() => generateCustomContractHtml(signatureFixture, { title: content.title, body: "{{custom.signer}}", variables: { signer: "________ / Иванов И.И. /" } })).toThrow("пустая подпись исполнителя");
  });

  it("requires structural signature tokens to be standalone body lines", () => {
    expect(getCustomContractTokens(content).tokens).toContain("company.signature");
    for (const body of ["Подпись: {{company.signature}}", "| {{company.signature}} |", "# {{company.signature}}", "- {{company.signature}}", "{{company.signature}}{{company.signature}}", "{{\ncompany.signature}}"])
      expect(() => getCustomContractTokens({ ...content, body })).toThrow("отдельную строку");
    expect(() => getCustomContractTokens({ ...content, title: "{{company.signature}}" })).toThrow("только отдельной строкой");
    expect(generate("Текст\n{{ company.signature }}\nПродолжение").match(/class="signature-img"/g)).toHaveLength(2);
  });

  it("preserves the default final signature for existing contracts without embedded supplier blanks", () => {
    expect(generate("Текст договора.\nЗаказчик: ________ / Петров П.П. /").match(/class="signature-img"/g)).toHaveLength(1);
  });

  it("does not turn variable contents or client values into signature instructions or HTML", () => {
    const html = generateCustomContractHtml({ ...signatureFixture, client: { ...signatureFixture.client, name: "<img src=x> {{company.signature}}" } }, {
      title: content.title, body: "{{client.name}}\n{{custom.text}}", variables: { text: "{{company.signature}}\n<script>alert(1)</script>" },
    });
    expect(html.match(/class="signature-img"/g)).toHaveLength(1);
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("&lt;img src=x&gt;");
  });

  it("refuses explicit signatures without an asset origin instead of silently omitting both images", () => {
    expect(() => generateCustomContractHtml({ ...signatureFixture, assetOrigin: "" }, content)).toThrow("origin изображений подписи и печати");
  });
});

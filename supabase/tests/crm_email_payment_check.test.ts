import { strict as assert } from "node:assert";
import { PDFDocument, StandardFonts, PDFName, PDFString } from "npm:pdf-lib@1.17.1";
import JSZip from "npm:jszip@3.10.1";
import { assertLegacyEmailCurrentBankRequisites, extractPdfPaymentText, PaymentRequisitesUnverifiedError } from "../functions/_shared/crm-email/payment-check.ts";
import { CurrentBankRequisitesError, type CurrentBankPolicy } from "../functions/_shared/current-bank-requisites.ts";
import { renderDocumentPdf } from "../functions/_shared/crm-email/pdf.ts";

// Synthetic fixtures do not represent a real company or a bank account.
const policy: CurrentBankPolicy = {
  issuer_inn: "000000000001", company_bank_account: "48000000000000000001", company_bank_bik: "000000001",
  company_bank_corr: "30000000000000000001", company_bank_name: "TEST BANK", revision: 1, retired_accounts: ["40900000000000000001"],
};
const current = `${policy.issuer_inn} account ${policy.company_bank_account} BIK ${policy.company_bank_bik} correspondent ${policy.company_bank_corr} ${policy.company_bank_name}`;
const base64 = (bytes: Uint8Array) => btoa(Array.from(bytes, value => String.fromCharCode(value)).join(""));
const pdf = (bytes = new TextEncoder().encode("%PDF-test")) => ({ filename: "TEST.pdf", base64: base64(bytes), contentType: "application/pdf" });
const email = (text = "Document attached", attachments = [pdf()]) => ({ subject: "TEST", html: `<p>${text}</p>`, attachments });
const rejectCode = (action: () => Promise<unknown>, code: string) => assert.rejects(action, (error: unknown) =>
  (error instanceof CurrentBankRequisitesError || error instanceof PaymentRequisitesUnverifiedError) && error.code === code);

Deno.test("legacy guard verifies actual PDF text rather than claimed source HTML", async () => {
  let calls = 0;
  await rejectCode(() => assertLegacyEmailCurrentBankRequisites(email(current), policy, { extractPdf: async bytes => {
    calls++; assert.equal(new TextDecoder().decode(bytes), "%PDF-test");
    return { text: `Invoice ${policy.issuer_inn}, account ${policy.retired_accounts[0]}` };
  } }), "CRM_COMPANY_BANK_ACCOUNT_RETIRED");
  assert.equal(calls, 1);
  await assertLegacyEmailCurrentBankRequisites(email(), policy, { extractPdf: async () => ({ text: current }) });
});

Deno.test("legacy guard rejects incomplete own bank tuple but leaves another issuer unchanged", async () => {
  await rejectCode(() => assertLegacyEmailCurrentBankRequisites(email(), policy, { extractPdf: async () => ({ text: `${policy.issuer_inn} ${policy.company_bank_account}` }) }), "CRM_COMPANY_BANK_REQUISITES_NOT_CURRENT");
  await assertLegacyEmailCurrentBankRequisites(email(), policy, { extractPdf: async () => ({ text: "ANO 3900024056 account 40700000000000000002 BIK 000000002" }) });
  await assertLegacyEmailCurrentBankRequisites(email(), policy, { extractPdf: async () => ({ text: `Исполнитель: Институт ИНН 3900024056. Р/с 40700000000000000002. Заказчик: ИП ИНН ${policy.issuer_inn}` }) });
  await assertLegacyEmailCurrentBankRequisites(email(), null, { extractPdf: async () => { throw new Error("Unpinned policy must not parse files"); } });
});

Deno.test("legacy guard rejects old account in body, subject and decoded hyperlink before extraction", async () => {
  const never = { extractPdf: async () => { throw new Error("Must not reach attachment extraction"); } };
  await rejectCode(() => assertLegacyEmailCurrentBankRequisites(email(policy.retired_accounts[0].split("").join(" ")), policy, never), "CRM_COMPANY_BANK_ACCOUNT_RETIRED");
  await rejectCode(() => assertLegacyEmailCurrentBankRequisites({ ...email(), subject: policy.retired_accounts[0] }, policy, never), "CRM_COMPANY_BANK_ACCOUNT_RETIRED");
  const encoded = policy.retired_accounts[0].split("").map(char => `%${char.charCodeAt(0).toString(16)}`).join("");
  await rejectCode(() => assertLegacyEmailCurrentBankRequisites({ ...email(), html: `<a href="https://bank.invalid/pay?account=${encoded}">Pay</a>` }, policy, never), "CRM_COMPANY_BANK_ACCOUNT_RETIRED");
  await rejectCode(() => assertLegacyEmailCurrentBankRequisites(email(), policy, { extractPdf: async () => ({ text: current, links: [`https://bank.invalid/pay?account=${encoded}`] }) }), "CRM_COMPANY_BANK_ACCOUNT_RETIRED");
});

Deno.test("legacy guard fails closed for unreadable files, unsupported Word, timeouts and empty extracted text", async () => {
  for (const extractPdf of [async () => { throw new Error("Encrypted/corrupt PDF"); }, async () => ({ text: "" })]) {
    await rejectCode(() => assertLegacyEmailCurrentBankRequisites(email(), policy, { extractPdf }), "CRM_PAYMENT_REQUISITES_UNVERIFIED");
  }
  await rejectCode(() => assertLegacyEmailCurrentBankRequisites(email(), policy, { extractPdf: () => new Promise(() => {}), timeoutMs: 5 }), "CRM_PAYMENT_REQUISITES_UNVERIFIED");
  await rejectCode(() => assertLegacyEmailCurrentBankRequisites(email("Word", [{ filename: "TEST.doc", base64: base64(new Uint8Array([1, 2, 3])), contentType: "application/msword" }]), policy), "CRM_PAYMENT_REQUISITES_UNVERIFIED");
});

async function textPdf(text: string, link?: string): Promise<Uint8Array> {
  const document = await PDFDocument.create();
  const page = document.addPage();
  const font = await document.embedFont(StandardFonts.Helvetica);
  const lines = text.split("\n").flatMap(line => line.match(/.{1,65}(?:\s|$)/g) || [line]);
  for (const [index, line] of lines.entries()) page.drawText(line.trim(), { font, size: 12, x: 30, y: 750 - index * 20 });
  if (link) page.node.set(PDFName.of("Annots"), document.context.obj([document.context.register(document.context.obj({
    Type: "Annot", Subtype: "Link", Rect: [30, 730, 300, 750], Border: [0, 0, 0], A: { Type: "Action", S: "URI", URI: PDFString.of(link) },
  }))]));
  return await document.save();
}

Deno.test("real PDF parser extracts actual compressed PDF text and hidden links", async () => {
  const bytes = await textPdf(`TEST ONLY\n${current}`);
  const extracted = await extractPdfPaymentText(bytes);
  assert(extracted.text.includes(policy.company_bank_account));
  await assertLegacyEmailCurrentBankRequisites(email("TEST", [pdf(bytes)]), policy);
  await rejectCode(() => assertLegacyEmailCurrentBankRequisites(email("TEST", [pdf(bytes)]), { ...policy, retired_accounts: [policy.company_bank_account] }), "CRM_COMPANY_BANK_ACCOUNT_RETIRED");
  const linked = await textPdf(`TEST ONLY\n${current}`, `https://bank.invalid/pay?account=${policy.retired_accounts[0]}`);
  await rejectCode(() => assertLegacyEmailCurrentBankRequisites(email("TEST", [pdf(linked)]), policy), "CRM_COMPANY_BANK_ACCOUNT_RETIRED");
});

Deno.test("real parser rejects corrupt PDF, blank scan page and excessive page count", async () => {
  await rejectCode(() => assertLegacyEmailCurrentBankRequisites(email(), policy), "CRM_PAYMENT_REQUISITES_UNVERIFIED");
  const blank = await PDFDocument.create(); blank.addPage();
  await rejectCode(async () => assertLegacyEmailCurrentBankRequisites(email("TEST", [pdf(await blank.save())]), policy), "CRM_PAYMENT_REQUISITES_UNVERIFIED");
  const long = await PDFDocument.create(); for (let index = 0; index < 41; index++) long.addPage();
  await rejectCode(async () => assertLegacyEmailCurrentBankRequisites(email("TEST", [pdf(await long.save())]), policy), "CRM_PAYMENT_REQUISITES_UNVERIFIED");
});

Deno.test("actual CRM renderer produces verifiable Cyrillic payment details", async () => {
  const russianPolicy = { ...policy, company_bank_name: "ТЕСТОВЫЙ БАНК" };
  const bytes = await renderDocumentPdf(`<html><body><h1>ТЕСТОВЫЙ ОБРАЗЕЦ — НЕ ДОКУМЕНТ</h1>
    <p>Исполнитель: Тестовый ИП, ИНН ${policy.issuer_inn}</p>
    <p>Р/с ${policy.company_bank_account}</p><p>БИК ${policy.company_bank_bik}</p>
    <p>К/с ${policy.company_bank_corr}, ${russianPolicy.company_bank_name}</p>
    <p>Заказчик: Тестовая организация, ИНН 3900024056</p></body></html>`, "ТЕСТОВЫЙ ОБРАЗЕЦ — НЕ ДОКУМЕНТ", { fetch: () => { throw new Error("No network"); } });
  await assertLegacyEmailCurrentBankRequisites(email("TEST", [pdf(bytes)]), russianPolicy);
});

async function docxAttachment(text: string, header = "", link = "") {
  const zip = new JSZip();
  zip.file("[Content_Types].xml", '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
  const xml = (value: string) => `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p>${value.split(" ").map(token => `<w:r><w:t>${token}</w:t></w:r>`).join("")}</w:p></w:body></w:document>`;
  zip.file("word/document.xml", xml(text));
  if (header) zip.file("word/header1.xml", xml(header));
  if (link) zip.file("word/_rels/document.xml.rels", `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="r1" Type="hyperlink" Target="${link}" TargetMode="External"/></Relationships>`);
  return { filename: "TEST.docx", contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", base64: base64(await zip.generateAsync({ type: "uint8array", compression: "DEFLATE" })) };
}

Deno.test("actual DOCX text including split runs, headers and links is checked", async () => {
  await assertLegacyEmailCurrentBankRequisites(email("TEST", [await docxAttachment(current)]), policy);
  await rejectCode(async () => assertLegacyEmailCurrentBankRequisites(email("TEST", [await docxAttachment(current, policy.retired_accounts[0].split("").join(" "))]), policy), "CRM_COMPANY_BANK_ACCOUNT_RETIRED");
  await rejectCode(async () => assertLegacyEmailCurrentBankRequisites(email("TEST", [await docxAttachment(current, "", `https://bank.invalid/${policy.retired_accounts[0]}`)]), policy), "CRM_COMPANY_BANK_ACCOUNT_RETIRED");
});

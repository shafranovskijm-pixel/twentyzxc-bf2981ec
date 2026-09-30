/// <reference lib="dom" />
import { strict as assert } from "node:assert";
import { DOMParser } from "npm:linkedom@0.18.12";
import { PdfRenderError, renderDocumentPdf, resolveDocumentImages } from "../functions/_shared/crm-email/pdf.ts";
import { generateActHtml, generateContractHtml, generateInvoiceHtml, type DocumentData } from "../../src/lib/document-templates.ts";
import { generateCustomContractHtml } from "../../src/lib/custom-contract-template.ts";

const parse = (body: string): Document => new DOMParser().parseFromString(`<!doctype html><html><head></head><body>${body}</body></html>`, "text/html") as unknown as Document;
const asset = (name: string) => Deno.readFile(new URL(`../../public/images/${name}.png`, import.meta.url));
const data = (bytes: Uint8Array, mime = "image/png") => `data:${mime};base64,${btoa(Array.from(bytes, b => String.fromCharCode(b)).join(""))}`;
const rejects = (action: () => Promise<unknown>, code: string) => assert.rejects(action, (error: unknown) => error instanceof PdfRenderError && error.code === code);
const noFetch: typeof fetch = () => { throw new Error("Network must not be used"); };

Deno.test("PDF images allow only exact branded assets; deny SSRF before fetch", async () => {
  for (const src of ["http://24zxc.ru/images/stamp.png", "https://example.invalid/images/stamp.png", "https://127.0.0.1/images/stamp.png", "http://169.254.169.254/latest/meta-data", "//24zxc.ru/images/stamp.png", "https://24zxc.ru/other.png", "https://24zxc.ru/images/stamp.png?token=x", "https://24zxc.ru/images/stamp.png#x", "https://user:pass@24zxc.ru/images/stamp.png", "file:///secret.png", "data:image/svg+xml;base64,PHN2Zy8+"]) {
    await assert.rejects(() => resolveDocumentImages(parse(`<img src="${src}">`), noFetch), PdfRenderError);
  }
  const bytes = await asset("signature");
  for (const src of ["/images/signature.png", "https://24zxc.ru/images/signature.png", "https://twentyzxc.lovable.app/images/signature.png"]) {
    let calls = 0;
    const result = await resolveDocumentImages(parse(`<img src="${src}"><img src="${src}">`), ((url, init) => {
      calls++;
      assert.equal(url, src.startsWith("/") ? `https://24zxc.ru${src}` : src);
      assert.equal(init?.redirect, "manual"); assert.equal(init?.credentials, "omit");
      return Promise.resolve(new Response(bytes, { headers: { "content-type": "image/png" } }));
    }) as typeof fetch);
    assert.equal(calls, 1); assert.equal(result[src], data(bytes));
  }
});

Deno.test("PDF required images fail on redirect, missing asset, malformed bytes and excess size", async () => {
  const doc = parse('<img class="signature-img" src="https://24zxc.ru/images/signature.png">');
  for (const response of [new Response(null, { status: 302, headers: { location: "http://127.0.0.1/secret" } }), new Response(null, { status: 404 })]) {
    await rejects(() => resolveDocumentImages(doc, (() => Promise.resolve(response)) as typeof fetch), "PDF_IMAGE_FETCH_FAILED");
  }
  await rejects(() => resolveDocumentImages(doc, (() => Promise.resolve(new Response("<svg/>", { headers: { "content-type": "image/svg+xml" } }))) as typeof fetch), "PDF_IMAGE_FORMAT_INVALID");
  await rejects(() => resolveDocumentImages(doc, (() => Promise.resolve(new Response("bad PNG", { headers: { "content-type": "image/png" } }))) as typeof fetch), "PDF_IMAGE_FORMAT_INVALID");
  await rejects(() => resolveDocumentImages(doc, (() => Promise.resolve(new Response(new Uint8Array(1024 * 1024 + 1), { headers: { "content-type": "image/png" } }))) as typeof fetch), "PDF_IMAGE_SIZE_INVALID");
  const png = await asset("signature");
  await rejects(() => resolveDocumentImages(parse(`<img src="${data(png, "image/jpeg")}">`), noFetch), "PDF_IMAGE_FORMAT_INVALID");
  const enormous = png.slice(); const view = new DataView(enormous.buffer); view.setUint32(16, 99999);
  await rejects(() => resolveDocumentImages(parse(`<img src="${data(enormous)}">`), noFetch), "PDF_IMAGE_DIMENSIONS_INVALID");
});

Deno.test("PDF rejects empty or active saved HTML without network", async () => {
  await rejects(() => renderDocumentPdf("", "Тест", { fetch: noFetch }), "PDF_HTML_SIZE_INVALID");
  await rejects(() => renderDocumentPdf("<html><body><p>Тест</p><script>alert(1)</script></body></html>", "Тест", { fetch: noFetch }), "PDF_ACTIVE_CONTENT_NOT_ALLOWED");
  await rejects(() => renderDocumentPdf("<html><body><p>Тест</p></body></html>", "bad\nheader", { fetch: noFetch }), "PDF_TITLE_INVALID");
});

export async function syntheticPdfFixture(): Promise<string> {
  const signature = data(await asset("signature"));
  const stamp = data(await asset("stamp"));
  return `<!doctype html><html lang="ru"><head><meta charset="UTF-8"><title>ТЕСТОВЫЙ ОБРАЗЕЦ</title></head><body>
  <p class="kicker">ТЕСТОВЫЙ ОБРАЗЕЦ — НЕ ДОКУМЕНТ</p>
  <h1>Акт № ТЕСТ</h1><div class="header-row"><span>29 сентября 2026 г.</span><span>Тестовый город</span></div>
  <p>Заказчик: <strong>Тестовая организация</strong>. ИНН: </p>
  <p>Основание: счёт № ТЕСТ. Все реквизиты этого образца синтетические.</p>
  <table class="services-table act-items-table"><thead><tr><th>Услуга</th><th class="qty">Кол-во</th><th>Ед.</th><th class="price">Цена</th><th class="sum">Сумма</th></tr></thead>
  <tbody><tr><td>Тестовая услуга, кириллица: ёж, счёт</td><td class="num">1</td><td>шт.</td><td class="money">3 000,99</td><td class="money">3 000,99</td></tr></tbody>
  <tfoot><tr class="grand"><td colspan="4">Итого к оплате</td><td class="money">3 000,99</td></tr></tfoot></table>
  <p>Всего: три тысячи рублей 99 копеек. ТЕСТОВЫЙ ОБРАЗЕЦ — НЕ ДОКУМЕНТ.</p>
  <div class="signatures act-signatures"><div class="signature-block"><p><strong>Тестовый исполнитель</strong></p><p>ИНН: </p>
  <div class="signature-line">Тестовый представитель</div><img class="signature-img" src="${signature}"><img class="stamp-img" src="${stamp}"></div>
  <div class="signature-block"><p><strong>Тестовый заказчик</strong></p><p>ИНН: </p><div class="signature-line">________________</div></div></div>
  </body></html>`;
}

Deno.test("actual Deno PDF renders Cyrillic, money table and original signature/stamp without global DOM", async () => {
  const before = [globalThis.document, globalThis.DOMParser, globalThis.Node];
  const html = await syntheticPdfFixture();
  const bytes = await renderDocumentPdf(html, "ТЕСТОВЫЙ ОБРАЗЕЦ — НЕ ДОКУМЕНТ", { fetch: noFetch });
  assert.equal(new TextDecoder().decode(bytes.subarray(0, 5)), "%PDF-");
  assert(bytes.length > 20_000 && bytes.length < 1_000_000);
  const pdfSource = new TextDecoder("latin1").decode(bytes);
  assert((pdfSource.match(/\/Subtype \/Image/g) || []).length >= 2, "Both facsimile image objects must be embedded");
  assert.deepEqual([globalThis.document, globalThis.DOMParser, globalThis.Node], before);
  const outputDir = Deno.env.get("CRM_PDF_QA_DIR");
  if (outputDir) {
    await Deno.mkdir(outputDir, { recursive: true });
    await Deno.writeFile(`${outputDir}/24zxc-server-pdf-preview.pdf`, bytes);
    await Deno.writeTextFile(`${outputDir}/24zxc-server-pdf-preview.html`, html);
  }
});

Deno.test("concurrent server renders do not share mutable document or font state", async () => {
  const results = await Promise.all(["Первый", "Второй"].map(title => renderDocumentPdf(`<html><body><h1>${title} тестовый документ</h1><p>Сумма: 3 000,99</p></body></html>`, title, { fetch: noFetch })));
  assert(results.every(bytes => new TextDecoder().decode(bytes.subarray(0, 5)) === "%PDF-"));
  assert.notDeepEqual(results[0], results[1]);
});

Deno.test("current CRM contract, invoice and act templates render with exact original asset paths", async () => {
  const fixture: DocumentData = {
    type: "act", number: "ТЕСТ", date: "29.09.2026", assetOrigin: "https://24zxc.ru",
    company: {
      company_name: "ТЕСТОВЫЙ ОБРАЗЕЦ — НЕ ДОКУМЕНТ", company_short_name: "Тестовый исполнитель",
      company_inn: "", company_kpp: "", company_ogrn: "", company_legal_address: "Тестовый адрес", company_actual_address: "",
      company_bank_account: "", company_bank_bik: "", company_bank_corr: "", company_bank_name: "",
      company_director_name: "Тестовый представитель", company_director_post: "", company_phone: "", company_email: "",
    },
    client: { name: "Тестовая организация", inn: "", kpp: "", ogrn: "", address: "Тестовый адрес", director_name: "Тестовый представитель", director_post: "" },
    services: [{ name: "Тестовая услуга, кириллица: ёж, счёт", qty: 1, price: 3000.99 }], contractNumber: "ТЕСТ",
  };
  const bytesByUrl = new Map([
    ["https://24zxc.ru/images/signature.png", await asset("signature")],
    ["https://24zxc.ru/images/stamp.png", await asset("stamp")],
  ]);
  const fetchAsset: typeof fetch = (url) => {
    const bytes = bytesByUrl.get(String(url)); assert(bytes, "Unexpected image request");
    return Promise.resolve(new Response(bytes, { headers: { "content-type": "image/png" } }));
  };
  for (const [name, generate] of [["contract", generateContractHtml], ["invoice", generateInvoiceHtml], ["act", generateActHtml]] as const) {
    const html = generate(fixture);
    const bytes = await renderDocumentPdf(html, `ТЕСТОВЫЙ ОБРАЗЕЦ — НЕ ДОКУМЕНТ (${name})`, { fetch: fetchAsset });
    assert.equal(new TextDecoder().decode(bytes.subarray(0, 5)), "%PDF-");
    assert((new TextDecoder("latin1").decode(bytes).match(/\/Subtype \/Image/g) || []).length >= 2);
    const outputDir = Deno.env.get("CRM_PDF_QA_DIR");
    if (outputDir) {
      await Deno.mkdir(outputDir, { recursive: true });
      await Deno.writeFile(`${outputDir}/24zxc-current-${name}-template.pdf`, bytes);
      await Deno.writeTextFile(`${outputDir}/24zxc-current-${name}-template.html`, html);
    }
  }
});

Deno.test("multi-page custom service contract renders to PDF with its pinned text and branded images", async () => {
  const fixture: DocumentData = {
    type: "contract", number: "TEST-CUSTOM/2026", date: "2026-09-30", assetOrigin: "https://24zxc.ru",
    company: { company_name: "ТЕСТОВЫЙ ИСПОЛНИТЕЛЬ", company_short_name: "Тест", company_inn: "000000000000", company_kpp: "", company_ogrn: "",
      company_legal_address: "Тестовый адрес", company_actual_address: "", company_bank_account: "00000000000000000000", company_bank_bik: "000000000",
      company_bank_corr: "00000000000000000000", company_bank_name: "Тестовый банк", company_director_name: "Тестовый исполнитель", company_director_post: "Директор", company_phone: "", company_email: "" },
    client: { name: "Тестовый заказчик", inn: "0000000000", kpp: "", ogrn: "", address: "Тестовый адрес", director_name: "Тестовый руководитель", director_post: "Директор" },
    services: [{ name: "Тестовая услуга", qty: 1, price: 1200 }], subject: "Тестовая услуга", deadline: "30 дней", paymentTerms: "100% предоплата",
  };
  const body = `## Предмет договора\nИсполнитель оказывает {{subject}}.\n\n{{services.table}}\n\n${Array.from({ length: 90 }, (_, i) => `${i + 1}. Тестовый пункт ${i + 1}: {{custom.scope}}.`).join("\n")}\n\n| Этап | Результат |\n| --- | --- |\n| Один | Тестовый результат |`;
  const html = generateCustomContractHtml(fixture, { title: "Тестовый договор № {{contract.number}}", body, variables: { scope: "не является офертой" } });
  const bytesByUrl = new Map([ ["https://24zxc.ru/images/signature.png", await asset("signature")], ["https://24zxc.ru/images/stamp.png", await asset("stamp")] ]);
  const fetchAsset: typeof fetch = (url) => {
    const bytes = bytesByUrl.get(String(url)); assert(bytes, "Unexpected image request");
    return Promise.resolve(new Response(bytes, { headers: { "content-type": "image/png" } }));
  };
  const bytes = await renderDocumentPdf(html, "ТЕСТОВЫЙ ОБРАЗЕЦ — НЕ ДОКУМЕНТ (custom)", { fetch: fetchAsset });
  assert.equal(new TextDecoder().decode(bytes.subarray(0, 5)), "%PDF-");
  assert((new TextDecoder("latin1").decode(bytes).match(/\/Subtype \/Image/g) || []).length >= 2);
  const outputDir = Deno.env.get("CRM_PDF_QA_DIR");
  if (outputDir) {
    await Deno.mkdir(outputDir, { recursive: true });
    await Deno.writeFile(`${outputDir}/24zxc-custom-service-contract.pdf`, bytes);
    await Deno.writeTextFile(`${outputDir}/24zxc-custom-service-contract.html`, html);
  }
});

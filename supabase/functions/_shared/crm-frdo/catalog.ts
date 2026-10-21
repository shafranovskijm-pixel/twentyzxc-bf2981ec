/** Fixed originals from the existing CRM FRDO package; never accepts caller URLs. */
export interface FrdoTemplate {
  readonly id: string; readonly revision: number; readonly label: string; readonly fileName: string;
  readonly contentType: string; readonly size: number; readonly sha256: string; readonly url: string;
}
export const MAX_FRDO_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_FRDO_TOTAL_BYTES = 15 * 1024 * 1024;
export const FRDO_TEMPLATES: readonly FrdoTemplate[] = Object.freeze(
  [
  {
    "id": "instruktsiya",
    "revision": 1,
    "label": "Инструкция",
    "fileName": "instruktsiya.docx",
    "contentType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "size": 11050,
    "sha256": "5afe855a645afd8d3ea54a6d09eb8d34dc11eb7035a277f0392cee0ef100c57f",
    "url": "https://veedztdijmscebgadzyx.supabase.co/storage/v1/object/public/document-assets/frdo/instruktsiya.docx"
  },
  {
    "id": "prikaz",
    "revision": 1,
    "label": "Приказ ФРДО №1",
    "fileName": "Prikaz_FRDO_1.docx",
    "contentType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "size": 19144,
    "sha256": "d3e08ca4f65e6212efb0a3603a209988661e523d36ac74262d71e4af6494eb50",
    "url": "https://veedztdijmscebgadzyx.supabase.co/storage/v1/object/public/document-assets/frdo/Prikaz_FRDO_1.docx"
  },
  {
    "id": "prikaz-pdf",
    "revision": 1,
    "label": "Приказ ФРДО (PDF, с подписью и печатью)",
    "fileName": "Prikaz_FRDO_podpisan.pdf",
    "contentType": "application/pdf",
    "size": 468328,
    "sha256": "dda7906c56d5fd5f1cdb873438c4a86ce4bfce4fcec30b3d53f605dc76513832",
    "url": "https://twentyzxc.lovable.app/__l5e/assets-v1/7c6be8ce-d17c-4d7a-b04c-63c0f37500a4/Prikaz_FRDO_podpisan.pdf"
  },
  {
    "id": "terms",
    "revision": 1,
    "label": "Пользовательское соглашение (Terms of Use)",
    "fileName": "terms-of-use.pdf",
    "contentType": "application/pdf",
    "size": 136163,
    "sha256": "1fa118709cb02cb4a5b0a2a58dbf7870cf3ca44b29c495691d3f2898377e5715",
    "url": "https://veedztdijmscebgadzyx.supabase.co/storage/v1/object/public/document-assets/frdo/terms-of-use.pdf"
  },
  {
    "id": "dpo-template",
    "revision": 1,
    "label": "ДПО — шаблон-образец",
    "fileName": "DPO-shablon-obrazets.xlsx",
    "contentType": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "size": 180702,
    "sha256": "11f2581e99b2a37458855cfa9a874179c95239df7bee0c8f22b50dbc2fc23b54",
    "url": "https://veedztdijmscebgadzyx.supabase.co/storage/v1/object/public/document-assets/frdo/DPO-shablon-obrazets.xlsx"
  },
  {
    "id": "dpo-dated",
    "revision": 1,
    "label": "ДПО — 06.11.2023",
    "fileName": "DPO-06.11.2023.xlsx",
    "contentType": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "size": 156367,
    "sha256": "3824efc21a11a3d57ea946684d4cd97d55f7b3c10b7d66dae7041248f3135fcd",
    "url": "https://veedztdijmscebgadzyx.supabase.co/storage/v1/object/public/document-assets/frdo/DPO-06.11.2023.xlsx"
  },
  {
    "id": "po-template",
    "revision": 1,
    "label": "ПО — образец",
    "fileName": "PO_obrazets.xlsx",
    "contentType": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "size": 254065,
    "sha256": "b4bbda45fdb04bd271cf2741db114c49d4ca9a1be54feb2cb1343837312b8348",
    "url": "https://veedztdijmscebgadzyx.supabase.co/storage/v1/object/public/document-assets/frdo/PO_obrazets.xlsx"
  },
  {
    "id": "po-dated",
    "revision": 1,
    "label": "ПО — 06.11.2023",
    "fileName": "PO-06.11.2023.xlsx",
    "contentType": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "size": 265250,
    "sha256": "6a0e12b71883095be2ea1f99855a6b30194df016043bbf781d12c70de14a43aa",
    "url": "https://veedztdijmscebgadzyx.supabase.co/storage/v1/object/public/document-assets/frdo/PO-06.11.2023.xlsx"
  }
].map(item => Object.freeze(item)),
);
export class FrdoCatalogError extends Error {
  constructor(readonly code: string) { super(code); this.name = "FrdoCatalogError"; }
}
function fail(code: string): never { throw new FrdoCatalogError(code); }
export function getFrdoTemplate(id: string, revision = 1): FrdoTemplate {
  const item = FRDO_TEMPLATES.find(item => item.id === id && item.revision === revision);
  if (!item) return fail("CRM_FRDO_TEMPLATE_NOT_FOUND");
  return item;
}
export function publicFrdoTemplate(item: FrdoTemplate): FrdoTemplate {
  return { id: item.id, revision: item.revision, label: item.label, fileName: item.fileName,
    contentType: item.contentType, size: item.size, sha256: item.sha256, url: item.url };
}
export async function frdoSha256(bytes: Uint8Array): Promise<string> {
  return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", Uint8Array.from(bytes).buffer)),
    value => value.toString(16).padStart(2, "0")).join("");
}
/** Pure validation also used by synthetic local tests; downloads always resolve the fixed registry. */
export async function validateFrdoTemplateBytes(item: FrdoTemplate, bytes: Uint8Array): Promise<void> {
  const isPdf = item.contentType === "application/pdf";
  const magic = isPdf ? new TextDecoder().decode(bytes.subarray(0, 5)) === "%PDF-"
    : bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 3 && bytes[3] === 4;
  if (bytes.length > MAX_FRDO_FILE_BYTES) return fail("CRM_FRDO_TEMPLATE_TOO_LARGE");
  if (!magic || bytes.length !== item.size || await frdoSha256(bytes) !== item.sha256)
    return fail("CRM_FRDO_TEMPLATE_CONTENT_MISMATCH");
}
export async function downloadFrdoTemplate(ref: { id: string; revision: number }, fetcher: typeof fetch = fetch): Promise<Uint8Array> {
  const item = getFrdoTemplate(ref.id, ref.revision);
  let response: Response;
  try { response = await fetcher(item.url, { redirect: "manual", credentials: "omit", signal: AbortSignal.timeout(20_000) }); }
  catch { return fail("CRM_FRDO_TEMPLATE_UNAVAILABLE"); }
  if (!response.ok || response.redirected || response.status >= 300 || !response.body
    || (response.url && response.url !== item.url)) return fail("CRM_FRDO_TEMPLATE_UNAVAILABLE");
  const mime = response.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
  // Legacy Storage labels the existing DOCX/XLSX originals as octet-stream.
  // Exact registered bytes, ZIP/PDF magic and the canonical attachment MIME remain mandatory.
  if (mime !== item.contentType && !(item.contentType !== "application/pdf" && mime === "application/octet-stream"))
    return fail("CRM_FRDO_TEMPLATE_MIME_MISMATCH");
  const declared = response.headers.get("content-length");
  if (declared && (!/^\d+$/.test(declared) || Number(declared) > MAX_FRDO_FILE_BYTES))
    return fail("CRM_FRDO_TEMPLATE_TOO_LARGE");
  const chunks: Uint8Array[] = []; let total = 0;
  const reader = response.body.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      total += value.length;
      if (total > MAX_FRDO_FILE_BYTES) { await reader.cancel(); return fail("CRM_FRDO_TEMPLATE_TOO_LARGE"); }
      chunks.push(value);
    }
  } catch (error) {
    if (error instanceof FrdoCatalogError) throw error;
    return fail("CRM_FRDO_TEMPLATE_UNAVAILABLE");
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(total); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  await validateFrdoTemplateBytes(item, bytes);
  return bytes;
}
export async function downloadFrdoTemplates(refs: readonly { id: string; revision: number }[], fetcher: typeof fetch = fetch) {
  if (!refs.length || refs.length > FRDO_TEMPLATES.length) return fail("CRM_FRDO_INVALID_TEMPLATE_SET");
  const result: { template: FrdoTemplate; bytes: Uint8Array }[] = []; let total = 0;
  const seen = new Set<string>();
  for (const ref of refs) {
    const template = getFrdoTemplate(ref.id, ref.revision);
    if (seen.has(template.id)) return fail("CRM_FRDO_INVALID_TEMPLATE_SET");
    seen.add(template.id);
    total += template.size;
    if (total > MAX_FRDO_TOTAL_BYTES) return fail("CRM_FRDO_PACKAGE_TOO_LARGE");
    result.push({ template, bytes: await downloadFrdoTemplate(ref, fetcher) });
  }
  return result;
}


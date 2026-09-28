// The only route from a frozen CRM document to SMTP. Dependencies are injected
// so uncertain delivery and retries can be tested without sending real mail.
export interface FrozenDocument {
  documentId: string; revision: number; filename: string; html: string;
  type: string; number: string;
}
export interface Attachment {
  documentId: string; revision: number; filename: string; path: string;
  sha256: string; size: number; contentType: "application/pdf";
}
export interface Delivery {
  id: string; actor_id: string; client_id: string; recipient: string;
  subject: string; body: string; state: string; message_id: string;
  documents: FrozenDocument[]; attachments: Attachment[];
  receipt?: string | { smtpResponse: string } | null; error?: string | null;
}
export interface DeliveryDependencies {
  render(html: string, title: string): Promise<Uint8Array>;
  upload(path: string, bytes: Uint8Array): Promise<void>;
  download(path: string): Promise<Uint8Array>;
  finalize(id: string, actor: string, attachments: Attachment[]): Promise<Delivery>;
  claim(id: string, actor: string): Promise<{ claimed: boolean; delivery: Delivery }>;
  finish(id: string, actor: string, state: string, receipt: string | null, error: string | null): Promise<Delivery>;
  send(input: { to: string; subject: string; html: string; messageId: string;
    attachments: { filename: string; base64: string; contentType: string }[] }): Promise<{ receipt: string }>;
}
export const MAX_PDF_BYTES = 10 * 1024 * 1024;
export const MAX_TOTAL_BYTES = 15 * 1024 * 1024;
export async function sha256(bytes: Uint8Array): Promise<string> {
  return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", Uint8Array.from(bytes).buffer)), x => x.toString(16).padStart(2, "0")).join("");
}
export function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(binary);
}
function isPdf(bytes: Uint8Array) {
  return bytes.length >= 8 && new TextDecoder().decode(bytes.subarray(0, 5)) === "%PDF-";
}
export function publicDelivery(row: Delivery) {
  return { deliveryId: row.id, clientId: row.client_id, recipient: row.recipient,
    subject: row.subject, body: row.body, state: row.state, messageId: row.message_id,
    documents: row.documents.map(d => ({ documentId: d.documentId, revision: d.revision, filename: d.filename, type: d.type, number: d.number })),
    attachments: (row.attachments || []).map(a => ({ documentId: a.documentId, revision: a.revision, filename: a.filename, sha256: a.sha256, size: a.size })),
    smtpAccepted: row.state === "smtp_accepted", recipientDeliveryConfirmed: false,
    retryAllowed: false,
    ...(row.state === "sending" || row.state === "unknown" ? { warning: "Результат отправки ещё не установлен. Не повторяйте письмо с новым ID: проверьте почтовый журнал." } : {}),
    ...(row.error ? { error: row.error } : {}),
  };
}
export async function preparePdfAttachments(row: Delivery, deps: DeliveryDependencies): Promise<Delivery> {
  if (row.state !== "preparing") return row;
  const attachments: Attachment[] = [];
  let total = 0;
  for (const document of row.documents) {
    const bytes = await deps.render(document.html, document.filename.replace(/\.pdf$/i, ""));
    total += bytes.length;
    if (!isPdf(bytes) || bytes.length > MAX_PDF_BYTES || total > MAX_TOTAL_BYTES) throw new Error("CRM_PDF_INVALID_OR_TOO_LARGE");
    const hash = await sha256(bytes);
    const path = `crm-email/${row.id}/${document.documentId}-r${document.revision}-${hash}.pdf`;
    await deps.upload(path, bytes);
    attachments.push({ documentId: document.documentId, revision: document.revision,
      filename: document.filename, path, sha256: hash, size: bytes.length, contentType: "application/pdf" });
  }
  return await deps.finalize(row.id, row.actor_id, attachments);
}
export function escapeEmailText(text: string) {
  return text.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
export async function dispatchDelivery(id: string, actor: string, deps: DeliveryDependencies): Promise<Delivery> {
  const result = await deps.claim(id, actor);
  if (!result.claimed) return result.delivery;
  const row = result.delivery;
  let enteredSmtp = false;
  let acceptedReceipt: string | null = null;
  try {
    if (!row.attachments?.length || row.attachments.length !== row.documents.length) throw new Error("CRM_ATTACHMENTS_MISSING");
    const attachments = [];
    let total = 0;
    for (const file of row.attachments) {
      const bytes = await deps.download(file.path);
      total += bytes.length;
      if (!isPdf(bytes) || bytes.length !== file.size || total > MAX_TOTAL_BYTES || await sha256(bytes) !== file.sha256) throw new Error("CRM_ATTACHMENT_INTEGRITY_FAILED");
      attachments.push({ filename: file.filename, base64: toBase64(bytes), contentType: file.contentType });
    }
    enteredSmtp = true;
    const sent = await deps.send({ to: row.recipient, subject: row.subject,
      html: `<div style="white-space:pre-wrap;font-family:Arial,sans-serif">${escapeEmailText(row.body)}</div>`,
      messageId: row.message_id, attachments });
    acceptedReceipt = sent.receipt;
    return await deps.finish(id, actor, "smtp_accepted", sent.receipt, null);
  } catch (error) {
    // A failed journal write after SMTP acceptance must never become retryable.
    const outcome = (error as { outcome?: string })?.outcome;
    const state = acceptedReceipt || (enteredSmtp && outcome !== "failed") ? "unknown" : "failed";
    const code = acceptedReceipt ? "CRM_SMTP_ACCEPTED_JOURNAL_FAILED" : state === "unknown" ? "CRM_SMTP_RESULT_UNKNOWN" : "CRM_EMAIL_NOT_SENT";
    try { return await deps.finish(id, actor, state, acceptedReceipt, code); }
    catch { return { ...row, state: "unknown", error: "CRM_DELIVERY_JOURNAL_UNAVAILABLE" }; }
  }
}

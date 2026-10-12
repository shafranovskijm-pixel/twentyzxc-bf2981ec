import { supabase } from "@/integrations/supabase/client";
import { generatePdfBlob, blobToBase64 } from "./document-pdf";
import { documentEmailErrorMessage } from "./document-email-error";

export interface ResendOptions {
  contractId: string;
  contractNumber: string | null;
  clientName: string;
  email: string;
  cc?: string;
  includeInvoice: boolean;
}

interface DocRow {
  id: string;
  doc_type: string;
  doc_number: string;
  doc_date: string;
  html_content: string;
  client_name: string;
  contract_id: string | null;
  created_at: string;
}

/**
 * Find latest generated doc of a given type for a contract.
 * Тries: contract_id match → doc_number == contract_number → latest by client_name.
 */
async function findLatestDoc(
  docType: "contract" | "invoice",
  opts: { contractId: string; contractNumber: string | null; clientName: string }
): Promise<DocRow | null> {
  // 1) by contract_id
  let { data } = await supabase
    .from("generated_documents")
    .select("id,doc_type,doc_number,doc_date,html_content,client_name,contract_id,created_at")
    .eq("contract_id", opts.contractId)
    .eq("doc_type", docType)
    .order("created_at", { ascending: false })
    .limit(1);
  if (data && data.length) return data[0] as DocRow;

  // 2) by doc_number == contract_number
  if (opts.contractNumber) {
    const r = await supabase
      .from("generated_documents")
      .select("id,doc_type,doc_number,doc_date,html_content,client_name,contract_id,created_at")
      .eq("doc_number", opts.contractNumber)
      .eq("doc_type", docType)
      .order("created_at", { ascending: false })
      .limit(1);
    if (r.data && r.data.length) return r.data[0] as DocRow;
  }

  // 3) latest by client_name
  const r2 = await supabase
    .from("generated_documents")
    .select("id,doc_type,doc_number,doc_date,html_content,client_name,contract_id,created_at")
    .eq("client_name", opts.clientName)
    .eq("doc_type", docType)
    .order("created_at", { ascending: false })
    .limit(1);
  return (r2.data?.[0] as DocRow) ?? null;
}

function safeFilename(s: string) {
  return s.replace(/[\\/:*?"<>|]/g, "_");
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("ru-RU");
}

/** Find latest stored PDF in contract_files for a contract by name pattern. */
async function findStoredPdf(
  contractId: string,
  kind: "contract" | "invoice"
): Promise<{ file_path: string; file_name: string } | null> {
  const patterns =
    kind === "contract"
      ? ["Договор%", "Dogovor%"]
      : ["Счёт%", "Счет%", "Schet%"];

  for (const p of patterns) {
    const { data } = await supabase
      .from("contract_files")
      .select("file_path,file_name,created_at")
      .eq("contract_id", contractId)
      .ilike("file_name", `${p}%.pdf`)
      .order("created_at", { ascending: false })
      .limit(1);
    if (data && data.length) return data[0] as any;
  }
  return null;
}

/**
 * Build from the latest saved document HTML; an older PDF may contain retired bank details.
 * An uploaded PDF is a fallback only when there is no saved editable document.
 * Returns { base64, filename, label } or null if neither stored file nor source HTML exist.
 */
async function getOrBuildPdfAttachment(
  kind: "contract" | "invoice",
  opts: ResendOptions
): Promise<{ base64: string; filename: string; label: string } | null> {
  const doc = await findLatestDoc(kind, opts);
  const labelPrefix = kind === "contract" ? "Договор" : "Счёт";

  if (doc?.html_content?.trim()) {
    const blob = await generatePdfBlob(doc.html_content);
    const base64 = await blobToBase64(blob);
    const filename = `${labelPrefix}_${safeFilename(doc.doc_number)}_${doc.doc_date}.pdf`;
    // Rendering for resend must not overwrite an archived (possibly signed) PDF.
    return { base64, filename, label: `${labelPrefix} №${doc.doc_number} от ${formatDate(doc.doc_date)}` };
  }

  // A legacy uploaded PDF is inspected by the server before SMTP submission.
  const stored = await findStoredPdf(opts.contractId, kind);
  if (stored) {
    try {
      const { data, error } = await supabase.storage.from("contracts").download(stored.file_path);
      if (!error && data) {
        const base64 = await blobToBase64(data);
        const filename = doc
          ? `${labelPrefix}_${safeFilename(doc.doc_number)}_${doc.doc_date}.pdf`
          : stored.file_name;
        const label = doc
          ? `${labelPrefix} №${doc.doc_number} от ${formatDate(doc.doc_date)}`
          : stored.file_name;
        return { base64, filename, label };
      }
    } catch {
      // fall through to regenerate
    }
  }

  return null;
}

/** Resend an existing contract (and optionally invoice) PDF by email. */
export async function resendContractEmail(opts: ResendOptions): Promise<void> {
  const contractRes = await getOrBuildPdfAttachment("contract", opts);
  if (!contractRes) {
    throw new Error("Договор не найден ни в файлах, ни в Конструкторе. Сначала создайте документ.");
  }

  const invoiceRes = opts.includeInvoice ? await getOrBuildPdfAttachment("invoice", opts) : null;

  const hasInvoice = !!invoiceRes;
  const docLabel = contractRes.label;

  const attachments: { filename: string; base64: string; contentType: string }[] = [
    { filename: contractRes.filename, base64: contractRes.base64, contentType: "application/pdf" },
  ];
  if (invoiceRes) {
    attachments.push({ filename: invoiceRes.filename, base64: invoiceRes.base64, contentType: "application/pdf" });
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <p>Добрый день!</p>
      <p>Направляем Вам документ${hasInvoice ? "ы" : ""}: <strong>${docLabel}</strong>${hasInvoice ? " (договор и счёт)" : ""} во вложении.</p>
      <p style="color:#6b7280;font-size:13px;">Если файл${hasInvoice ? "ы" : ""} не открыва${hasInvoice ? "ются" : "ется"}, ответьте на это письмо — пришлём повторно.</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
      <p style="color:#9ca3af;font-size:12px;">Синтагма — автоматизированная система документооборота</p>
    </div>
  `;

  const recipients = [opts.email.trim(), ...(opts.cc?.trim() ? [opts.cc.trim()] : [])].filter(Boolean);
  const { data, error } = await supabase.functions.invoke("send-document-email", {
    body: { to: recipients.join(","), subject: docLabel, html, attachments, async: true },
  });
  if (error) {
    // Supabase wraps non-2xx responses. Preserve the server's actionable bank warning.
    throw new Error(await documentEmailErrorMessage(error));
  }
  if (!data?.success) throw new Error(data?.error || "Ошибка отправки");

  // Save email back to client if changed
  const { data: clientRow } = await supabase
    .from("clients")
    .select("id,email")
    .eq("name", opts.clientName)
    .maybeSingle();
  if (clientRow && clientRow.email !== opts.email.trim()) {
    await supabase.from("clients").update({ email: opts.email.trim() }).eq("id", clientRow.id);
  }
}

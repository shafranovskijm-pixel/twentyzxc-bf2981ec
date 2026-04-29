import { supabase } from "@/integrations/supabase/client";

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

/** Generate PDF from HTML using html2canvas + jsPDF (same as DocumentsTab). */
async function generatePdfBlob(htmlContent: string): Promise<Blob> {
  const html2canvas = (await import("html2canvas")).default;
  const { jsPDF } = await import("jspdf");

  const iframe = document.createElement("iframe");
  iframe.style.position = "absolute";
  iframe.style.left = "-9999px";
  iframe.style.width = "794px";
  iframe.style.border = "none";
  document.body.appendChild(iframe);

  iframe.srcdoc = htmlContent;
  await new Promise<void>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("iframe timeout")), 10000);
    iframe.onload = () => { clearTimeout(t); resolve(); };
  });
  await new Promise(r => setTimeout(r, 200));

  const body = iframe.contentDocument!.body;
  iframe.style.height = body.scrollHeight + "px";

  const canvas = await html2canvas(body, {
    scale: 1.2, useCORS: true, width: 794, height: body.scrollHeight,
    windowWidth: 794, windowHeight: body.scrollHeight, logging: false, imageTimeout: 5000,
  });
  document.body.removeChild(iframe);

  const imgData = canvas.toDataURL("image/jpeg", 0.65);
  const pdf = new jsPDF("p", "mm", "a4");
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const imgHeight = (canvas.height * pdfWidth) / canvas.width;
  const margin = 10;
  const usable = pdfHeight - margin * 2;
  let heightLeft = imgHeight;
  let page = 0;
  while (heightLeft > 0) {
    if (page > 0) pdf.addPage();
    const yOffset = margin - page * usable;
    pdf.addImage(imgData, "JPEG", 0, yOffset, pdfWidth, imgHeight, undefined, "FAST");
    heightLeft -= usable;
    page++;
  }
  return pdf.output("blob");
}

async function uploadAndSign(blob: Blob, filename: string, contractId: string): Promise<string> {
  const path = `${contractId}/resend-${Date.now()}-${safeFilename(filename)}`;
  const { error: upErr } = await supabase.storage
    .from("contracts")
    .upload(path, blob, { contentType: "application/pdf", upsert: false });
  if (upErr) throw new Error(`Upload: ${upErr.message}`);

  // Register in contract_files
  await supabase.from("contract_files").insert({
    contract_id: contractId,
    file_name: filename,
    file_path: path,
    file_size: blob.size,
  });

  const { data, error } = await supabase.storage
    .from("contracts")
    .createSignedUrl(path, 60 * 60 * 24 * 7);
  if (error || !data?.signedUrl) throw new Error("Не удалось создать ссылку");
  return data.signedUrl;
}

/** Resend an existing contract (and optionally invoice) PDF by email. */
export async function resendContractEmail(opts: ResendOptions): Promise<void> {
  const contractDoc = await findLatestDoc("contract", opts);
  if (!contractDoc) {
    throw new Error("Договор не найден в Конструкторе. Сначала сгенерируйте его.");
  }

  const invoiceDoc = opts.includeInvoice
    ? await findLatestDoc("invoice", opts)
    : null;

  // Generate PDFs from stored HTML and upload
  const contractFilename = `Договор_${safeFilename(contractDoc.doc_number)}_${contractDoc.doc_date}.pdf`;
  const contractBlob = await generatePdfBlob(contractDoc.html_content);
  const contractUrl = await uploadAndSign(contractBlob, contractFilename, opts.contractId);

  let invoiceUrl: string | null = null;
  if (invoiceDoc) {
    const invoiceFilename = `Счет_${safeFilename(invoiceDoc.doc_number)}_${invoiceDoc.doc_date}.pdf`;
    const invoiceBlob = await generatePdfBlob(invoiceDoc.html_content);
    invoiceUrl = await uploadAndSign(invoiceBlob, invoiceFilename, opts.contractId);
  }

  const docLabel = `Договор №${contractDoc.doc_number} от ${formatDate(contractDoc.doc_date)}`;
  const invoiceBtn = invoiceUrl
    ? `<p style="margin: 24px 0;"><a href="${invoiceUrl}" style="display:inline-block;padding:12px 24px;background:#16a34a;color:#fff;text-decoration:none;border-radius:6px;font-weight:500;">📎 Скачать Счёт (PDF)</a></p>`
    : "";

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <p>Добрый день!</p>
      <p>Повторно направляем Вам документ${invoiceUrl ? "ы" : ""}: <strong>${docLabel}</strong>.</p>
      <p style="margin: 24px 0;">
        <a href="${contractUrl}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;font-weight:500;">📎 Скачать Договор (PDF)</a>
      </p>
      ${invoiceBtn}
      <p style="color:#6b7280;font-size:13px;">Ссылки действительны 7 дней.</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
      <p style="color:#9ca3af;font-size:12px;">Синтагма — автоматизированная система документооборота</p>
    </div>
  `;

  const recipients = [opts.email.trim(), ...(opts.cc?.trim() ? [opts.cc.trim()] : [])].filter(Boolean);
  const { data, error } = await supabase.functions.invoke("send-document-email", {
    body: { to: recipients.join(","), subject: docLabel, html },
  });
  if (error) throw error;
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
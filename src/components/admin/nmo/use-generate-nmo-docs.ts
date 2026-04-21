import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { generateNmoApplicationHtml } from "@/lib/nmo-application-template";
import { generateNmoObligationHtml } from "@/lib/nmo-obligation-template";
import type { NmoRegistrationFull } from "./types";

function transliterate(s: string): string {
  const map: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh", з: "z", и: "i",
    й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t",
    у: "u", ф: "f", х: "h", ц: "c", ч: "ch", ш: "sh", щ: "sch", ы: "y", э: "e",
    ю: "yu", я: "ya", ь: "", ъ: "",
  };
  return s
    .toLowerCase()
    .split("")
    .map((c) => (map[c] ?? (/[a-z0-9_-]/.test(c) ? c : "_")))
    .join("")
    .replace(/_+/g, "_")
    .slice(0, 60);
}

async function htmlToPdfBlob(html: string): Promise<Blob> {
  const { default: jsPDF } = await import("jspdf");
  const { default: html2canvas } = await import("html2canvas");

  const container = document.createElement("div");
  container.style.cssText = "position:fixed;left:-9999px;top:0;width:794px;background:white;";
  container.innerHTML = html;
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 1.5,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
    });
    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const pdf = new jsPDF("p", "mm", "a4");
    let heightLeft = imgHeight;
    let position = 0;
    pdf.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    while (heightLeft > 0) {
      position -= pageHeight;
      pdf.addPage();
      pdf.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    return pdf.output("blob");
  } finally {
    document.body.removeChild(container);
  }
}

export function useGenerateNmoDocs(onDone?: () => void) {
  const [generating, setGenerating] = useState(false);

  const generate = async (reg: NmoRegistrationFull) => {
    setGenerating(true);
    try {
      const safeName = transliterate(reg.organization_name || "org");
      const dateStr = new Date().toISOString().slice(0, 10);
      const pairs: Array<{ type: "application" | "obligation"; html: string; label: string }> = [
        {
          type: "application",
          html: generateNmoApplicationHtml(reg),
          label: "Zayavlenie_NMO",
        },
        {
          type: "obligation",
          html: generateNmoObligationHtml(reg),
          label: "Obyazatelstvo_NMO",
        },
      ];

      for (const p of pairs) {
        const blob = await htmlToPdfBlob(p.html);
        const fileName = `${p.label}_${safeName}_${dateStr}.pdf`;
        const filePath = `${reg.id}/${Date.now()}_${fileName}`;

        const { error: upErr } = await supabase.storage
          .from("nmo-documents")
          .upload(filePath, blob, { contentType: "application/pdf", upsert: false });
        if (upErr) throw upErr;

        const { error: insErr } = await supabase.from("nmo_documents").insert({
          registration_id: reg.id,
          doc_type: p.type,
          file_path: filePath,
          file_name: fileName,
          file_size: blob.size,
        });
        if (insErr) throw insErr;
      }

      toast.success("Документы сгенерированы (Заявление + Обязательство)");
      onDone?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка генерации документов");
    } finally {
      setGenerating(false);
    }
  };

  return { generate, generating };
}
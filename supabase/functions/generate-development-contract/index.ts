import "https://deno.land/x/xhr@0.1.0/mod.ts";
import {
  generateDevelopmentContractDocxBytes,
  generateDevelopmentContractDocBytes,
} from "./word.ts";
import type { DevelopmentContractInput } from "./template.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Expose-Headers": "content-disposition, content-length, x-document-mime-type",
};

const docMimeTypes = {
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  doc: "application/msword;charset=utf-8",
} as const;

function downloadHeaders(format: "docx" | "doc", length: number) {
  return {
    ...corsHeaders,
    // supabase-js returns Blob only for octet-stream/pdf. With the native Word MIME
    // it decodes the ZIP as text and the downloaded .docx becomes unreadable.
    "Content-Type": "application/octet-stream",
    "X-Document-Mime-Type": docMimeTypes[format],
    "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(`contract.${format}`)}`,
    "Content-Length": String(length),
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json() as { format: "docx" | "doc"; data: DevelopmentContractInput };
    if (!body?.data || !body?.format) {
      return new Response(JSON.stringify({ error: "format и data обязательны" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (body.format === "docx") {
      const bytes = await generateDevelopmentContractDocxBytes(body.data);
      return new Response(bytes, {
        headers: downloadHeaders("docx", bytes.length),
      });
    }

    if (body.format === "doc") {
      const bytes = generateDevelopmentContractDocBytes(body.data);
      return new Response(bytes, {
        headers: downloadHeaders("doc", bytes.length),
      });
    }

    return new Response(JSON.stringify({ error: "неизвестный format" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-development-contract error", e);
    return new Response(JSON.stringify({ error: (e as Error)?.message || "ошибка генерации" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
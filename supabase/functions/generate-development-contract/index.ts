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
};

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
        headers: {
          ...corsHeaders,
          "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Length": String(bytes.length),
        },
      });
    }

    if (body.format === "doc") {
      const bytes = generateDevelopmentContractDocBytes(body.data);
      return new Response(bytes, {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/msword;charset=utf-8",
          "Content-Length": String(bytes.length),
        },
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
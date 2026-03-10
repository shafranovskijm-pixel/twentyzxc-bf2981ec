import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: docs, error: docsErr } = await admin
      .from("generated_documents")
      .select("*")
      .order("created_at", { ascending: false });

    if (docsErr) throw docsErr;

    const results: string[] = [];

    for (const doc of docs || []) {
      let contractId = doc.contract_id;

      if (!contractId) {
        const { data: contract } = await admin
          .from("contracts")
          .select("id")
          .eq("client_name", doc.client_name)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (contract) {
          contractId = contract.id;
          await admin.from("generated_documents").update({ contract_id: contractId }).eq("id", doc.id);
        }
      }

      if (!contractId) {
        results.push(`SKIP: ${doc.doc_type} #${doc.doc_number} for ${doc.client_name} - no contract found`);
        continue;
      }

      const docLabel = doc.doc_type === "contract" ? "Dogovor" : doc.doc_type === "invoice" ? "Schet" : "Akt";
      const displayName = doc.doc_type === "contract" ? "Договор" : doc.doc_type === "invoice" ? "Счёт" : "Акт";
      const fileName = `${displayName}_${doc.doc_number}_${doc.doc_date}.html`;
      const storageFileName = `${docLabel}_${doc.doc_number}_${doc.doc_date}.html`;

      const { data: existing } = await admin
        .from("contract_files")
        .select("id")
        .eq("contract_id", contractId)
        .eq("file_name", fileName)
        .maybeSingle();

      if (existing) {
        results.push(`EXISTS: ${fileName} for ${doc.client_name}`);
        continue;
      }

      const encoder = new TextEncoder();
      const htmlBytes = encoder.encode(doc.html_content);
      const storagePath = `${contractId}/${Date.now()}-${storageFileName}`;

      const { error: uploadErr } = await admin.storage
        .from("contracts")
        .upload(storagePath, htmlBytes, { contentType: "text/html" });

      if (uploadErr) {
        results.push(`UPLOAD_ERR: ${fileName} - ${uploadErr.message}`);
        continue;
      }

      const { error: insertErr } = await admin.from("contract_files").insert({
        contract_id: contractId,
        file_name: fileName,
        file_path: storagePath,
        file_size: htmlBytes.length,
      });

      if (insertErr) {
        results.push(`INSERT_ERR: ${fileName} - ${insertErr.message}`);
        continue;
      }

      results.push(`OK: ${fileName} → ${doc.client_name}`);
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

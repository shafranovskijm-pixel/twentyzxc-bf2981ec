import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const migration = file => readFile(path.join(root, "supabase/migrations", file), "utf8");
const db = new PGlite();
try {
  const base = await migration("20260129125612_9aaf7006-366c-4b0c-b37c-f70a38d2977e.sql");
  const roleType = base.match(/CREATE TYPE public\.app_role[\s\S]*?;/)?.[0];
  const roleTable = base.match(/CREATE TABLE public\.user_roles[\s\S]*?\n\);/)?.[0];
  const roleFunction = base.match(/CREATE OR REPLACE FUNCTION public\.has_role[\s\S]*?\$\$;/)?.[0];
  const emailSource = await migration("20260929010000_crm_email_delivery.sql");
  const emailHelper = emailSource.match(/CREATE FUNCTION public\.crm_email_address_valid[\s\S]*?\$\$;/)?.[0];
  if (!roleType || !roleTable || !roleFunction || !emailHelper) throw new Error("Actual role/email fixtures unavailable");
  await db.exec(`
    CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
    CREATE SCHEMA auth; CREATE SCHEMA storage;
    CREATE TABLE auth.users(id uuid PRIMARY KEY,email text,raw_user_meta_data jsonb);
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
      SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid
    $$;
    CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $$
      SELECT nullif(current_setting('request.jwt.claim.role',true),'')
    $$;
    GRANT USAGE ON SCHEMA public,auth TO authenticated,anon,service_role;
    ${roleType}
    ${roleTable}
    ${roleFunction}
    ${emailHelper}
    REVOKE ALL ON FUNCTION public.crm_email_address_valid(text) FROM PUBLIC,anon,authenticated,service_role;
    CREATE TABLE public.clients(
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),name text NOT NULL,inn text,email text,
      notes text,frdo_login text,frdo_password text,frdo_password_po text,
      updated_at timestamptz NOT NULL DEFAULT now()
    );
    ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Fixture admin clients" ON public.clients FOR ALL TO authenticated
      USING(public.has_role(auth.uid(),'admin'::public.app_role))
      WITH CHECK(public.has_role(auth.uid(),'admin'::public.app_role));
    GRANT SELECT,UPDATE ON public.clients TO authenticated;
    CREATE TABLE public.client_interactions(
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
      interaction_type text NOT NULL DEFAULT 'note',content text NOT NULL,created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE TABLE storage.buckets(id text PRIMARY KEY,public boolean NOT NULL);
    INSERT INTO storage.buckets VALUES('contracts',false);
  `);
  const revisionMigration = await migration("20260929154614_fc0f953c-2472-4bb7-9567-ebfab952ac63.sql");
  const boundary = revisionMigration.indexOf("CREATE TABLE public.crm_client_commands");
  if (boundary < 0) throw new Error("Actual all-writer revision fixture unavailable");
  await db.exec(revisionMigration.slice(0, boundary));
  await db.exec(await migration("20261021010000_crm_frdo_documents.sql"));

  // Independent exact registry comparison against the verified public source manifest.
  const expected = JSON.parse(await readFile(path.join(root, "src/test/fixtures/frdo-originals.json"), "utf8"));
  const actual = (await db.query("SELECT * FROM public.crm_frdo_template_catalog ORDER BY id")).rows;
  if (actual.length !== 8 || expected.length !== 8) throw new Error("Registry must contain exactly eight originals");
  for (const template of expected) {
    const row = actual.find(item => item.id === template.id);
    if (!row || row.revision !== template.revision || row.label !== template.label || row.filename !== template.fileName ||
      row.content_type !== template.contentType || Number(row.size) !== template.size || row.sha256 !== template.sha256 ||
      row.source_url !== template.url) throw new Error("Registry differs from verified original metadata");
  }
  const pins = JSON.parse(await readFile(path.join(root, "src/test/fixtures/company-document-assets.json"), "utf8"));
  const assetRows = (await db.query("SELECT * FROM public.crm_pdf_asset_catalog ORDER BY id")).rows;
  const assetList = pins;
  if (assetList.length !== 2 || assetRows.length !== 2) throw new Error("Own PNG registry must have exactly two assets");
  for (const asset of assetList) {
    const row = assetRows.find(item => item.id === asset.id);
    if (!row || row.sha256 !== asset.sha256 || Number(row.size) !== asset.size || row.content_type !== asset.contentType ||
      row.source_url !== asset.url) throw new Error("Own PNG registry differs from verified source metadata");
  }
  await db.exec(await readFile(path.join(root, "supabase/tests/crm_frdo_documents.sql"), "utf8"));
  for (const table of ["public.clients","public.user_roles","auth.users","public.crm_frdo_email_deliveries","public.crm_signed_pdfs","public.client_interactions"]) {
    if ((await db.query(`SELECT count(*)::int AS count FROM ${table}`)).rows[0]?.count !== 0)
      throw new Error("Synthetic transaction did not roll back completely");
  }
  if ((await db.query("SELECT count(*)::int AS count FROM public.crm_frdo_template_catalog")).rows[0]?.count !== 8)
    throw new Error("Pinned registry changed during tests");
  console.log("FRDO documents SQL assertions passed; exact eight-file/two-PNG registry verified; synthetic transaction rolled back. No network, credentials, email or production access.");
} catch (error) {
  console.error("FRDO documents SQL test failed:", {code:error?.code ?? "LOCAL_TEST_FAILURE",message:error instanceof Error ? error.message : "Unknown local error"});
  process.exitCode = 1;
} finally {
  await db.close();
}


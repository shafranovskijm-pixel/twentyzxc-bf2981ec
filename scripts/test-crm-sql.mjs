import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";

// Real PostgreSQL in WASM, held in memory. No network or production credentials.
// Auth/storage infrastructure is deliberately not emulated as a production system.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const migration = name => readFile(path.join(root, "supabase/migrations", name), "utf8");
const db = new PGlite();
try {
  const base = await migration("20260129125612_9aaf7006-366c-4b0c-b37c-f70a38d2977e.sql");
  const roleType = base.match(/CREATE TYPE public\.app_role[\s\S]*?;/)[0];
  const roleTable = base.match(/CREATE TABLE public\.user_roles[\s\S]*?\n\);/)[0];
  const roleFunction = base.match(/CREATE OR REPLACE FUNCTION public\.has_role[\s\S]*?\$\$;/)[0];
  await db.exec(`
    CREATE ROLE anon;
    CREATE ROLE authenticated;
    CREATE ROLE service_role BYPASSRLS;
    CREATE SCHEMA auth;
    CREATE TABLE auth.users (id uuid PRIMARY KEY, email text, raw_user_meta_data jsonb);
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
      SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
    $$;
    GRANT USAGE ON SCHEMA auth, public TO authenticated, anon, service_role;
    ${roleType}
    ${roleTable}
    ${roleFunction}
    CREATE FUNCTION public.update_updated_at_column() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN NEW.updated_at := now(); RETURN NEW; END;
    $$;
  `);
  const crm = await migration("20260304023931_cbf864df-beb7-4e1e-9239-4ddad4fb4c6e.sql");
  await db.exec(crm.slice(0, crm.indexOf("-- Create private storage bucket")));
  for (const name of [
    "20260304031500_bec51ad7-34bf-4fef-b1b8-78a1b54873eb.sql",
    "20260304032511_cfa5a074-7620-458d-a5fc-4b361dff8f53.sql",
    "20260304040743_e781f6aa-b264-4499-96cc-62494de64b58.sql",
    "20260304041444_4b8c7df3-f7cf-44b2-9da0-a6f9f9e5d803.sql",
    "20260304051050_f979a971-6878-4d27-99f2-4d7b4850de82.sql",
    "20260304062937_b6cd289f-9613-446f-aa8d-0fee152f8467.sql",
    "20260304141232_d981bf53-b496-4410-be7a-291c4534e877.sql",
    "20260415052028_7891b34a-e9db-4ad2-8700-dc2abef11a97.sql",
    "20260415073223_ed0a95bb-d16b-4b33-83d1-f375a238177a.sql",
    "20260515044813_97d64d33-80ca-4bdd-8149-778c947de77c.sql",
    "20260816065728_43c86bc4-ad79-4055-a8b5-f6b88f04e0d8.sql",
    "20260914045634_26d4f833-c73d-4808-96ae-844b6ec7531a.sql",
  ]) await db.exec(await migration(name));
  // The same source migration also alters the unrelated TZ subsystem. Execute
  // its actual contracts statement without inventing a placeholder TZ table.
  const appendixMigration = await migration("20260515060201_ef72074c-d016-427f-96df-0f1e91fefdc4.sql");
  const appendixStatement = appendixMigration.match(/ALTER TABLE public\.contracts[\s\S]*?;/)?.[0];
  if (!appendixStatement) throw new Error("Expected contracts appendix migration statement was not found");
  await db.exec(appendixStatement);
  await db.exec("GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;");
  await db.exec(await migration("20260928054127_91324a2c-bb9e-472c-8726-d33c2468bd32.sql"));
  await db.exec(await migration("20260928173203_d76379a3-d7b9-4234-b5d2-3d3aac03d008.sql"));
  await db.exec(await migration("20260929010000_crm_email_delivery.sql"));
  await db.exec(await readFile(path.join(root, "supabase/tests/crm_document_api.sql"), "utf8"));
  await db.exec(await readFile(path.join(root, "supabase/tests/crm_email_delivery.sql"), "utf8"));
  await db.exec(await readFile(path.join(root, "supabase/tests/crm_invoice_acts.sql"), "utf8"));
  console.log("PASS: CRM migration executed and all SQL integration assertions passed in PGlite.");
  console.log("Not tested here: live Supabase Auth, deployed RLS, storage, multi-session concurrency, PDF, SMTP.");
} catch (error) {
  console.error("CRM SQL test failed:", error.code || "", error.message);
  if (error.where) console.error(error.where);
  process.exitCode = 1;
} finally {
  await db.close();
}

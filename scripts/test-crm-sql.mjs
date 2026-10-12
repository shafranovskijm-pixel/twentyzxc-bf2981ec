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
  await db.exec(await migration("20260210072200_29bc3257-460c-4852-be8a-174cd06a6895.sql"));
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
  await db.exec(await migration("20260929154614_fc0f953c-2472-4bb7-9567-ebfab952ac63.sql"));
  await db.exec(await migration("20260929154814_e2df41be-2506-41a3-ac4b-a05e6da7fcca.sql"));
  await db.exec(await migration("20260930060000_crm_service_templates.sql"));
  await db.exec(await migration("20261012010000_crm_current_bank_requisites.sql"));
  await db.exec(await readFile(path.join(root, "supabase/tests/crm_document_api.sql"), "utf8"));
  await db.exec(await readFile(path.join(root, "supabase/tests/crm_email_delivery.sql"), "utf8"));
  await db.exec(await readFile(path.join(root, "supabase/tests/crm_invoice_acts.sql"), "utf8"));
  await db.exec(await readFile(path.join(root, "supabase/tests/crm_client_commands.sql"), "utf8"));
  await db.exec(await readFile(path.join(root, "supabase/tests/crm_client_rename_documents.sql"), "utf8"));
  await db.exec(await readFile(path.join(root, "supabase/tests/crm_service_templates.sql"), "utf8"));
  await db.exec(await readFile(path.join(root, "supabase/tests/crm_current_bank_requisites.sql"), "utf8"));
  const activationSource = await readFile(path.join(root, "supabase/tests/crm_confirmed_bank_activation.sql"), "utf8");
  const activationParts = activationSource.split("-- APPLY CONFIRMED MIGRATION HERE");
  if (activationParts.length !== 2) throw new Error("Expected confirmed bank activation test boundary");
  const activation = await migration("20261012020000_pin_confirmed_company_bank.sql");
  await db.exec(activationParts[0]);
  for (const [key, value] of [
    ["company_inn", "999999999999"],
    ["company_bank_account", "40914810200040551529"],
    ["company_bank_bik", "044525000"],
    ["company_bank_corr", "30101810645374525000"],
    ["company_bank_name", "Другой банк"],
  ]) {
    await db.exec("SAVEPOINT invalid_activation_settings");
    await db.query("UPDATE public.site_settings SET value=$1::jsonb WHERE key=$2", [JSON.stringify(value), key]);
    let rejection;
    try { await db.exec(activation); } catch (error) { rejection = error; }
    await db.exec("ROLLBACK TO SAVEPOINT invalid_activation_settings");
    if (rejection?.message !== "CRM_CONFIRMED_BANK_SETTINGS_MISMATCH") throw new Error(`Confirmed bank migration did not reject differing ${key}`);
    await db.exec("RELEASE SAVEPOINT invalid_activation_settings");
  }
  await db.exec("SAVEPOINT missing_activation_setting");
  await db.exec("DELETE FROM public.site_settings WHERE key='company_bank_bik'");
  let missingRejection;
  try { await db.exec(activation); } catch (error) { missingRejection = error; }
  await db.exec("ROLLBACK TO SAVEPOINT missing_activation_setting");
  if (missingRejection?.message !== "CRM_CONFIRMED_BANK_SETTINGS_MISMATCH") throw new Error("Confirmed bank migration did not reject missing bank setting");
  await db.exec("RELEASE SAVEPOINT missing_activation_setting");
  await db.exec("SAVEPOINT conflicting_activation_policy");
  await db.exec(`INSERT INTO public.crm_company_bank_policy(singleton,issuer_inn,company_bank_account,company_bank_bik,company_bank_corr,company_bank_name,revision,retired_accounts)
    VALUES(true,'253615392404','40802810200000522079','044525068','30101810645374525068','ООО «ОЗОН Банк»',7,ARRAY['40914810200040551529'])`);
  let policyRejection;
  try { await db.exec(activation); } catch (error) { policyRejection = error; }
  await db.exec("ROLLBACK TO SAVEPOINT conflicting_activation_policy");
  if (policyRejection?.message !== "CRM_CONFIRMED_BANK_POLICY_CONFLICT") throw new Error("Confirmed bank migration did not reject incomplete pre-existing policy");
  await db.exec("RELEASE SAVEPOINT conflicting_activation_policy");
  await db.exec("SAVEPOINT differing_activation_policy");
  await db.exec(`INSERT INTO public.crm_company_bank_policy(singleton,issuer_inn,company_bank_account,company_bank_bik,company_bank_corr,company_bank_name,revision,retired_accounts)
    VALUES(true,'253615392404','40802810200000522000','044525068','30101810645374525068','ООО «ОЗОН Банк»',7,ARRAY['40914810200040551529','40914810200003058331'])`);
  let differingPolicyRejection;
  try { await db.exec(activation); } catch (error) { differingPolicyRejection = error; }
  await db.exec("ROLLBACK TO SAVEPOINT differing_activation_policy");
  if (differingPolicyRejection?.message !== "CRM_CONFIRMED_BANK_POLICY_CONFLICT") throw new Error("Confirmed bank migration did not reject differing pre-existing account");
  await db.exec("RELEASE SAVEPOINT differing_activation_policy");
  await db.exec("SAVEPOINT equivalent_activation_bank_name");
  await db.exec(`UPDATE public.site_settings SET value='"ооо \\"озон банк\\""'::jsonb WHERE key='company_bank_name'`);
  await db.exec(activation);
  await db.exec("SELECT pg_temp.activation_assert((SELECT p.company_bank_name=s.value#>>'{}' FROM public.crm_company_bank_policy p JOIN public.site_settings s ON s.key='company_bank_name'),'equivalent bank name pins existing exact string without settings rewrite')");
  await db.exec("ROLLBACK TO SAVEPOINT equivalent_activation_bank_name");
  await db.exec("RELEASE SAVEPOINT equivalent_activation_bank_name");
  await db.exec(activation);
  const policyBeforeReplay = (await db.query("SELECT to_jsonb(p) AS policy FROM public.crm_company_bank_policy p")).rows[0].policy;
  await db.exec(activation);
  const policyAfterReplay = (await db.query("SELECT to_jsonb(p) AS policy FROM public.crm_company_bank_policy p")).rows[0].policy;
  if (JSON.stringify(policyAfterReplay) !== JSON.stringify(policyBeforeReplay)) throw new Error("Confirmed bank activation replay rewrote the policy");
  await db.exec(activationParts[1]);
  console.log("PASS: CRM migration executed and all SQL integration assertions passed in PGlite.");
  console.log("Not tested here: live Supabase Auth, deployed RLS, storage, multi-session concurrency, PDF, SMTP.");
} catch (error) {
  console.error("CRM SQL test failed:", error.code || "", error.message);
  if (error.where) console.error(error.where);
  process.exitCode = 1;
} finally {
  await db.close();
}

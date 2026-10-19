import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";

// Real PostgreSQL/WASM with the actual pgcrypto extension, entirely in memory.
// No production connection, network request, credential or environment file.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const migration = file => readFile(path.join(root, "supabase/migrations", file), "utf8");
const db = new PGlite({ extensions: { pgcrypto } });
try {
  const base = await migration("20260129125612_9aaf7006-366c-4b0c-b37c-f70a38d2977e.sql");
  const roleType = base.match(/CREATE TYPE public\.app_role[\s\S]*?;/)?.[0];
  const roleTable = base.match(/CREATE TABLE public\.user_roles[\s\S]*?\n\);/)?.[0];
  const roleFunction = base.match(/CREATE OR REPLACE FUNCTION public\.has_role[\s\S]*?\$\$;/)?.[0];
  if (!roleType || !roleTable || !roleFunction) throw new Error("The actual role-schema fixture could not be located");
  await db.exec(`
    CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
    CREATE SCHEMA auth;
    CREATE TABLE auth.users(id uuid PRIMARY KEY, email text, raw_user_meta_data jsonb);
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
      SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid
    $$;
    GRANT USAGE ON SCHEMA public,auth TO authenticated,anon,service_role;
    ${roleType}
    ${roleTable}
    ${roleFunction}
    CREATE TABLE public.clients(
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, inn text,
      email text, notes text, frdo_login text, frdo_password text, frdo_password_po text,
      updated_at timestamptz NOT NULL DEFAULT now()
    );
    ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Fixture admin clients" ON public.clients FOR ALL TO authenticated
      USING(public.has_role(auth.uid(),'admin'::public.app_role))
      WITH CHECK(public.has_role(auth.uid(),'admin'::public.app_role));
    GRANT SELECT,UPDATE ON public.clients TO authenticated;
  `);
  // Exercise the actual existing all-writer revision trigger, not a test imitation.
  const revisionMigration = await migration("20260929154614_fc0f953c-2472-4bb7-9567-ebfab952ac63.sql");
  const revisionBoundary = revisionMigration.indexOf("CREATE TABLE public.crm_client_commands");
  if (revisionBoundary < 0) throw new Error("The real client revision trigger boundary was not found");
  await db.exec(revisionMigration.slice(0, revisionBoundary));

  const source = await migration("20261019010000_crm_frdo_credentials.sql");
  // Production hosting already provides pgcrypto. Missing infrastructure must
  // fail closed; the migration must not silently provision a different setup.
  let missingCryptoDenied = false;
  try { await db.exec(`BEGIN;\n${source}\nCOMMIT;`); }
  catch (error) {
    await db.exec("ROLLBACK");
    missingCryptoDenied = error.code === "55000" && error.message === "CRM_FRDO_CRYPTO_UNAVAILABLE";
    if (!missingCryptoDenied) throw error;
  }
  if (!missingCryptoDenied) throw new Error("Migration accepted an absent pgcrypto extension");
  await db.exec("CREATE SCHEMA extensions; CREATE EXTENSION pgcrypto WITH SCHEMA extensions;");
  const installed = await db.query("SELECT n.nspname FROM pg_extension e JOIN pg_namespace n ON n.oid=e.extnamespace WHERE e.extname='pgcrypto'");
  if (installed.rows[0]?.nspname !== "extensions") throw new Error("Local crypto fixture does not match the hosting schema");
  await db.exec(source);
  await db.exec(await readFile(path.join(root, "supabase/tests/crm_frdo_credentials.sql"), "utf8"));
  for (const table of ["public.clients", "public.user_roles", "auth.users", "public.crm_frdo_access_commands"]) {
    const result = await db.query(`SELECT count(*)::int AS count FROM ${table}`);
    if (result.rows[0]?.count !== 0) throw new Error("Synthetic FRDO transaction did not roll back completely");
  }
  console.log("FRDO SQL assertions passed with real pgcrypto; synthetic transaction fully rolled back. No network or production access.");
} catch (error) {
  // Never dump SQL bodies or parameter values from driver diagnostics.
  console.error("FRDO SQL test failed:", { code: error?.code ?? "LOCAL_TEST_FAILURE", message: error instanceof Error ? error.message : "Unknown local error" });
  process.exitCode = 1;
} finally {
  await db.close();
}


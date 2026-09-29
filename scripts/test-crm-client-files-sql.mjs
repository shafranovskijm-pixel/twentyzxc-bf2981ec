import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const db = new PGlite();
try {
  // Deliberately minimal local fixtures. This tests the real attachment migration,
  // privileges and RPC, not live Supabase Storage bytes or network authentication.
  await db.exec(`
    CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
    CREATE SCHEMA auth; CREATE SCHEMA storage;
    CREATE TYPE public.app_role AS ENUM ('admin','user');
    CREATE TABLE public.user_roles(user_id uuid, role public.app_role);
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
      SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid
    $$;
    CREATE FUNCTION public.has_role(_user_id uuid,_role public.app_role) RETURNS boolean
      LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
      SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role=_role)
    $$;
    CREATE TABLE public.clients(id uuid PRIMARY KEY,name text);
    CREATE TABLE storage.buckets(id text PRIMARY KEY,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    CREATE TABLE storage.objects(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),bucket_id text,name text,metadata jsonb);
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
    GRANT USAGE ON SCHEMA public,auth,storage TO authenticated,anon,service_role;
    GRANT SELECT,INSERT,UPDATE,DELETE ON storage.objects TO authenticated;
  `);
  const migration = await readFile(path.join(root, "supabase/migrations/20260930020000_crm_client_files.sql"), "utf8");
  // Bucket provisioning is a separate hosting operation. Test its prerequisite
  // guard against local infrastructure fixtures before applying the migration.
  for (const invalid of [null, [true, 10485760, ["application/pdf"]], [false, 20971520, ["application/pdf"]], [false, 10485760, ["application/pdf", "text/html"]]]) {
    await db.exec("DELETE FROM storage.buckets WHERE id='crm-client-files'");
    if (invalid) await db.query("INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types) VALUES('crm-client-files','crm-client-files',$1,$2,$3)", invalid);
    let failed = false;
    try { await db.exec(`BEGIN;\n${migration}\nCOMMIT;`); }
    catch (error) {
      failed = error.code === "55000" && error.message.includes("CRM_CLIENT_FILE_BUCKET_NOT_CONFIGURED");
      await db.exec("ROLLBACK;");
      if (!failed) throw error;
    }
    if (!failed) throw new Error("Migration accepted an absent or unsafe Storage bucket");
  }
  await db.exec("DELETE FROM storage.buckets WHERE id='crm-client-files'");
  await db.exec("INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types) VALUES('crm-client-files','crm-client-files',false,10485760,ARRAY['application/pdf'])");
  await db.exec(`BEGIN;\n${migration}\nROLLBACK;`);
  // Current hosting tool cannot set a bucket MIME list. Exercise the actual
  // NULL-list deployment shape; upload policy must still reject non-PDF objects.
  await db.exec("UPDATE storage.buckets SET allowed_mime_types=NULL WHERE id='crm-client-files'");
  await db.exec(migration);
  await db.exec(await readFile(path.join(root, "supabase/tests/crm_client_files.sql"), "utf8"));
  console.log("PASS: separate Storage prerequisite guard including NULL MIME list, PDF-only/path-restricted admin upload, original client file migration, admin/privilege boundaries, missing file/client, immutable idempotent registration, safe results and cross-actor conflict.");
  console.log("Not tested here: real Storage bytes, deployed auth, actual ChatGPT file transfer, concurrent sessions.");
} catch (error) {
  console.error("Client files SQL test failed:", error.code || "", error.message);
  if (error.where) console.error(error.where);
  process.exitCode = 1;
} finally { await db.close(); }

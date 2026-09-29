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
    CREATE TABLE storage.objects(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),bucket_id text,name text);
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
    GRANT USAGE ON SCHEMA public,auth,storage TO authenticated,anon,service_role;
    GRANT SELECT,INSERT,UPDATE,DELETE ON storage.objects TO authenticated;
  `);
  await db.exec(await readFile(path.join(root, "supabase/migrations/20260930020000_crm_client_files.sql"), "utf8"));
  await db.exec(await readFile(path.join(root, "supabase/tests/crm_client_files.sql"), "utf8"));
  console.log("PASS: original client file migration, admin/privilege boundaries, missing file/client, immutable idempotent registration, safe results and cross-actor conflict.");
  console.log("Not tested here: real Storage bytes, deployed auth, actual ChatGPT file transfer, concurrent sessions.");
} catch (error) {
  console.error("Client files SQL test failed:", error.code || "", error.message);
  if (error.where) console.error(error.where);
  process.exitCode = 1;
} finally { await db.close(); }

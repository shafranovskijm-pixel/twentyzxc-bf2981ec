-- Original client attachments are separate from generated documents and contracts.
CREATE TABLE public.client_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL UNIQUE,
  actor_id uuid NOT NULL,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  source_file_id text NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL UNIQUE,
  file_size bigint NOT NULL CHECK (file_size BETWEEN 1 AND 10485760),
  sha256 text NOT NULL CHECK (sha256 ~ '^[0-9a-f]{64}$'),
  description text,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX client_files_client_created ON public.client_files(client_id, created_at DESC);
ALTER TABLE public.client_files ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.client_files FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT ON public.client_files TO authenticated;
CREATE POLICY "Admins read original client files" ON public.client_files FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Provision crm-client-files with the hosting Storage tool before this migration:
-- private bucket, 10 MiB limit. The hosting tool may leave allowed_mime_types NULL;
-- in that case the INSERT policy below enforces application/pdf and the exact path
-- shape. The MCP service additionally checks original PDF bytes. Do not mutate
-- storage.buckets through migrations; fail closed on missing/unsafe provisioning.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'crm-client-files' AND public = false
      AND file_size_limit = 10485760
      AND (allowed_mime_types IS NULL OR allowed_mime_types = ARRAY['application/pdf']::text[])
  ) THEN
    RAISE EXCEPTION 'CRM_CLIENT_FILE_BUCKET_NOT_CONFIGURED' USING ERRCODE = '55000';
  END IF;
END;
$$;
CREATE POLICY "Admins read original client PDFs" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'crm-client-files' AND public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins upload original client PDFs" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'crm-client-files' AND public.has_role(auth.uid(), 'admin'::public.app_role)
    AND metadata->>'mimetype' = 'application/pdf'
    AND name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.pdf$');
-- No UPDATE/DELETE policy: imports never overwrite an original attachment.

CREATE FUNCTION public.crm_register_client_file(p_request_id uuid, p_client_id uuid, p_source_file_id text,
  p_file_name text, p_file_size bigint, p_sha256 text, p_description text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE actor uuid := auth.uid(); previous public.client_files%ROWTYPE; saved public.client_files%ROWTYPE; target_path text;
BEGIN
  IF actor IS NULL OR NOT public.has_role(actor, 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'CRM_ADMIN_REQUIRED' USING ERRCODE = '42501';
  END IF;
  IF p_request_id IS NULL OR p_client_id IS NULL OR p_source_file_id IS NULL OR length(btrim(p_source_file_id)) NOT BETWEEN 1 AND 200
    OR p_file_name IS NULL OR length(p_file_name) NOT BETWEEN 5 AND 200 OR p_file_name <> btrim(p_file_name)
    OR p_file_name ~ '[[:cntrl:]\\/]' OR p_file_name !~* '\.pdf$'
    OR p_file_size IS NULL OR p_file_size NOT BETWEEN 1 AND 10485760
    OR p_sha256 IS NULL OR p_sha256 !~ '^[0-9a-f]{64}$' OR length(p_description) > 2000 THEN
    RAISE EXCEPTION 'CRM_INVALID_FILE' USING ERRCODE = '22023';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(p_request_id::text, 81321));
  SELECT * INTO previous FROM public.client_files WHERE request_id = p_request_id;
  IF FOUND THEN
    IF previous.actor_id <> actor OR previous.client_id <> p_client_id OR previous.source_file_id <> p_source_file_id
      OR previous.file_name <> p_file_name OR previous.file_size <> p_file_size OR previous.sha256 <> p_sha256
      OR previous.description IS DISTINCT FROM p_description THEN
      RAISE EXCEPTION 'CRM_REQUEST_CONFLICT' USING ERRCODE = '22023';
    END IF;
    saved := previous;
  ELSE
    PERFORM 1 FROM public.clients WHERE id = p_client_id FOR KEY SHARE;
    IF NOT FOUND THEN RAISE EXCEPTION 'CRM_CLIENT_NOT_FOUND' USING ERRCODE = '22023'; END IF;
    target_path := p_client_id::text || '/' || p_request_id::text || '.pdf';
    PERFORM 1 FROM storage.objects WHERE bucket_id = 'crm-client-files' AND name = target_path;
    IF NOT FOUND THEN RAISE EXCEPTION 'CRM_FILE_NOT_UPLOADED' USING ERRCODE = '22023'; END IF;
    INSERT INTO public.client_files(request_id,actor_id,client_id,source_file_id,file_name,file_path,file_size,sha256,description)
    VALUES (p_request_id,actor,p_client_id,p_source_file_id,p_file_name,target_path,p_file_size,p_sha256,p_description)
    RETURNING * INTO saved;
  END IF;
  RETURN jsonb_build_object('file',jsonb_build_object('id',saved.id,'client_id',saved.client_id,'file_name',saved.file_name,
    'file_size',saved.file_size,'sha256',saved.sha256,'description',saved.description,'created_at',saved.created_at),
    'replayed',previous.id IS NOT NULL);
END;
$$;
REVOKE ALL ON FUNCTION public.crm_register_client_file(uuid,uuid,text,text,bigint,text,text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.crm_register_client_file(uuid,uuid,text,text,bigint,text,text) TO authenticated;

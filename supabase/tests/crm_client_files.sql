-- Local fixture test, always rolled back. Storage rows are metadata fixtures only.
BEGIN;
CREATE FUNCTION pg_temp.file_assert(ok boolean, description text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN IF ok IS DISTINCT FROM true THEN RAISE EXCEPTION 'ASSERTION FAILED: %',description; END IF; END;
$$;
CREATE FUNCTION pg_temp.file_expect_error(statement text, expected text, expected_state text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE actual text; code text;
BEGIN
  BEGIN EXECUTE statement; EXCEPTION WHEN OTHERS THEN GET STACKED DIAGNOSTICS actual=MESSAGE_TEXT,code=RETURNED_SQLSTATE; END;
  IF actual IS NULL OR (expected<>'' AND strpos(actual,expected)=0) OR (expected_state IS NOT NULL AND code<>expected_state) THEN
    RAISE EXCEPTION 'EXPECTED ERROR % (%), GOT % (%)',expected,expected_state,actual,code;
  END IF;
END;
$$;
INSERT INTO public.user_roles(user_id,role) VALUES
('f1c00000-0000-4000-8000-000000000001','admin'),('f1c00000-0000-4000-8000-000000000002','admin');
INSERT INTO public.clients(id,name) VALUES ('f1c00000-0000-4000-8000-000000000010','Synthetic original file test');
INSERT INTO storage.objects(bucket_id,name,metadata) VALUES ('crm-client-files','f1c00000-0000-4000-8000-000000000010/f1c00000-0000-4000-8000-000000000020.pdf','{"mimetype":"application/pdf"}');
SELECT set_config('request.jwt.claim.sub','f1c00000-0000-4000-8000-000000000001',true);
SET LOCAL ROLE authenticated;
DO $$
DECLARE answer jsonb; replay jsonb;
  operation text := 'SELECT public.crm_register_client_file(''f1c00000-0000-4000-8000-000000000020'',''f1c00000-0000-4000-8000-000000000010'',''file-synthetic'',''Исходник.pdf'',250,repeat(''a'',64),NULL)';
  upload_operation text := 'INSERT INTO storage.objects(bucket_id,name,metadata) VALUES(''crm-client-files'',''f1c00000-0000-4000-8000-000000000010/f1c00000-0000-4000-8000-000000000022.pdf'',''{"mimetype":"application/pdf"}'')';
BEGIN
  EXECUTE upload_operation;
  PERFORM pg_temp.file_assert((SELECT count(*)=1 FROM storage.objects WHERE name='f1c00000-0000-4000-8000-000000000010/f1c00000-0000-4000-8000-000000000022.pdf'),'admin may upload PDF with exact path');
  PERFORM pg_temp.file_expect_error(replace(upload_operation,'application/pdf','text/html'),'','42501');
  PERFORM pg_temp.file_expect_error(replace(upload_operation,'{"mimetype":"application/pdf"}','{}'),'','42501');
  PERFORM pg_temp.file_expect_error(replace(upload_operation,'.pdf','.html'),'','42501');
  PERFORM pg_temp.file_expect_error(replace(upload_operation,'f1c00000-0000-4000-8000-000000000010/','other/'),'','42501');
  EXECUTE operation INTO answer;
  PERFORM pg_temp.file_assert(answer->>'replayed'='false' AND answer#>>'{file,client_id}'='f1c00000-0000-4000-8000-000000000010','registered exact client');
  PERFORM pg_temp.file_assert(NOT (answer->'file' ?| ARRAY['file_path','actor_id','source_file_id']),'result excludes internal values');
  EXECUTE operation INTO replay;
  PERFORM pg_temp.file_assert(replay->>'replayed'='true' AND replay#>>'{file,id}'=answer#>>'{file,id}','same request replay');
  PERFORM pg_temp.file_assert((SELECT count(*)=1 FROM public.client_files),'no duplicate row');
  PERFORM pg_temp.file_expect_error(replace(operation,'''file-synthetic''','''file-other'''),'CRM_REQUEST_CONFLICT');
  PERFORM pg_temp.file_expect_error(replace(operation,'''Исходник.pdf''','''Другое.pdf'''),'CRM_REQUEST_CONFLICT');
  PERFORM pg_temp.file_expect_error(replace(operation,'''Исходник.pdf''','''../bad.pdf'''),'CRM_INVALID_FILE');
  PERFORM pg_temp.file_expect_error(replace(operation,'250,','10485761,'),'CRM_INVALID_FILE');
  PERFORM pg_temp.file_expect_error(replace(operation,'000000000020','000000000021'),'CRM_FILE_NOT_UPLOADED');
  PERFORM pg_temp.file_expect_error(replace(replace(operation,'000000000020','000000000021'),'000000000010','000000000011'),'CRM_CLIENT_NOT_FOUND');
  PERFORM pg_temp.file_expect_error('DELETE FROM public.client_files','','42501');
  PERFORM pg_temp.file_expect_error('UPDATE public.client_files SET description=''changed''','','42501');
  -- Even other admins cannot claim another actor's request ID.
  PERFORM set_config('request.jwt.claim.sub','f1c00000-0000-4000-8000-000000000002',true);
  PERFORM pg_temp.file_expect_error(operation,'CRM_REQUEST_CONFLICT');
  PERFORM set_config('request.jwt.claim.sub','f1c00000-0000-4000-8000-000000000003',true);
  PERFORM pg_temp.file_expect_error(operation,'CRM_ADMIN_REQUIRED','42501');
  PERFORM pg_temp.file_assert((SELECT count(*)=0 FROM public.client_files),'non-admin cannot read attachments');
  PERFORM pg_temp.file_expect_error(upload_operation,'','42501');
END;
$$;
RESET ROLE;
SELECT pg_temp.file_assert((SELECT public=false FROM storage.buckets WHERE id='crm-client-files'),'bucket private');
ROLLBACK;

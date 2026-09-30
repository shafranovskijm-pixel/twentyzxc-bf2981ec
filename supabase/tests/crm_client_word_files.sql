-- Local metadata-only test of the Word extension. Original bytes are tested in
-- Vitest; this transaction always rolls back all synthetic rows.
BEGIN;
CREATE FUNCTION pg_temp.word_assert(ok boolean,description text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN IF ok IS DISTINCT FROM true THEN RAISE EXCEPTION 'ASSERTION FAILED: %',description; END IF; END;
$$;
CREATE FUNCTION pg_temp.word_expect_error(statement text,expected text,expected_state text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE actual text; code text;
BEGIN
  BEGIN EXECUTE statement; EXCEPTION WHEN OTHERS THEN GET STACKED DIAGNOSTICS actual=MESSAGE_TEXT,code=RETURNED_SQLSTATE; END;
  IF actual IS NULL OR (expected<>'' AND strpos(actual,expected)=0) OR (expected_state IS NOT NULL AND code<>expected_state) THEN
    RAISE EXCEPTION 'EXPECTED ERROR % (%), GOT % (%)',expected,expected_state,actual,code;
  END IF;
END;
$$;
INSERT INTO public.user_roles(user_id,role) VALUES ('f1d00000-0000-4000-8000-000000000001','admin');
INSERT INTO public.clients(id,name) VALUES ('f1d00000-0000-4000-8000-000000000010','Synthetic Word test');
SELECT set_config('request.jwt.claim.sub','f1d00000-0000-4000-8000-000000000001',true);
SET LOCAL ROLE authenticated;
DO $$
DECLARE extension text; mime text; word_request_id uuid; answer jsonb; replay jsonb; operation text; upload_operation text;
BEGIN
  FOREACH extension IN ARRAY ARRAY['doc','docx'] LOOP
    word_request_id:=CASE WHEN extension='doc' THEN 'f1d00000-0000-4000-8000-000000000020'::uuid ELSE 'f1d00000-0000-4000-8000-000000000021'::uuid END;
    mime:=CASE WHEN extension='doc' THEN 'application/msword' ELSE 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' END;
    upload_operation:=format('INSERT INTO storage.objects(bucket_id,name,metadata) VALUES(''crm-client-files'',%L,%L::jsonb)',
      'f1d00000-0000-4000-8000-000000000010/'||word_request_id::text||'.'||extension,jsonb_build_object('mimetype',mime)::text);
    EXECUTE upload_operation;
    operation:=format('SELECT public.crm_register_client_file(%L,''f1d00000-0000-4000-8000-000000000010'',''word-original'',%L,250,repeat(''b'',64),NULL)',word_request_id,'Договор.'||upper(extension));
    EXECUTE operation INTO answer;
    PERFORM pg_temp.word_assert(answer#>>'{file,content_type}'=mime AND answer->>'replayed'='false','Word stored with canonical MIME');
    PERFORM pg_temp.word_assert((SELECT file_path='f1d00000-0000-4000-8000-000000000010/'||word_request_id::text||'.'||extension FROM public.client_files WHERE id=(answer#>>'{file,id}')::uuid),'Word canonical path');
    EXECUTE operation INTO replay;
    PERFORM pg_temp.word_assert(replay->>'replayed'='true' AND replay#>>'{file,id}'=answer#>>'{file,id}','Word request replay');
    PERFORM pg_temp.word_expect_error(replace(operation,'''word-original''','''another-file'''),'CRM_REQUEST_CONFLICT');
    PERFORM pg_temp.word_expect_error(replace(operation,'repeat(''b'',64)','repeat(''c'',64)'),'CRM_REQUEST_CONFLICT');
    PERFORM pg_temp.word_expect_error(replace(operation,'Договор.'||upper(extension),'Договор.pdf'),'CRM_REQUEST_CONFLICT');
    PERFORM pg_temp.word_expect_error(replace(operation,'Договор.'||upper(extension),'Договор.docm'),'CRM_INVALID_FILE');
    PERFORM pg_temp.word_expect_error(replace(upload_operation,mime,'text/html'),'','42501');
    PERFORM pg_temp.word_expect_error(replace(upload_operation,mime,'application/octet-stream'),'','42501');
    PERFORM pg_temp.word_expect_error(replace(upload_operation,'.'||extension,'.html'),'','42501');
  END LOOP;
  PERFORM pg_temp.word_assert((SELECT count(*)=2 FROM public.client_files),'exactly two originals');
  PERFORM pg_temp.word_expect_error('UPDATE public.client_files SET content_type=''application/pdf''','','42501');
  PERFORM set_config('request.jwt.claim.sub','f1d00000-0000-4000-8000-000000000003',true);
  PERFORM pg_temp.word_expect_error(operation,'CRM_ADMIN_REQUIRED','42501');
  PERFORM pg_temp.word_assert((SELECT count(*)=0 FROM public.client_files),'non-admin cannot read Word originals');
  PERFORM pg_temp.word_expect_error(upload_operation,'','42501');
END;
$$;
RESET ROLE;
ROLLBACK;

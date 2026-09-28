-- Database-owner integration smoke: synthetic rows only, always rolled back.
-- Does not create Storage bytes, invoke Edge functions, or send SMTP.
BEGIN;
CREATE FUNCTION pg_temp.email_assert(ok boolean, description text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN IF ok IS DISTINCT FROM true THEN RAISE EXCEPTION 'ASSERTION FAILED: %',description; END IF; END;
$$;
CREATE FUNCTION pg_temp.email_expect_error(statement text, expected text, expected_state text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE actual text; code text;
BEGIN
  BEGIN EXECUTE statement; EXCEPTION WHEN OTHERS THEN GET STACKED DIAGNOSTICS actual=MESSAGE_TEXT,code=RETURNED_SQLSTATE; END;
  IF actual IS NULL OR (expected<>'' AND strpos(actual,expected)=0) OR (expected_state IS NOT NULL AND code<>expected_state) THEN
    RAISE EXCEPTION 'EXPECTED ERROR % (%), GOT % (%)',expected,expected_state,actual,code;
  END IF;
END;
$$;
-- Test-only owner helper assembles file metadata, never an actual PDF or upload.
CREATE FUNCTION pg_temp.email_attachments(delivery_id uuid, fake_hash text DEFAULT repeat('a',64))
RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
  SELECT jsonb_agg(jsonb_build_object('documentId',d->'documentId','revision',d->'revision',
    'filename',d->'filename','contentType','application/pdf','size',1024,'sha256',fake_hash,
    'path','crm-email/' || delivery_id || '/' || (d->>'documentId') || '-r' || (d->>'revision') || '-' || fake_hash || '.pdf'))
  FROM public.crm_email_deliveries e, jsonb_array_elements(e.documents) d WHERE e.id=delivery_id
$$;

INSERT INTO auth.users(id,email,raw_user_meta_data) VALUES
 ('e0c00000-0000-4000-8000-000000000001','email-sql-admin@example.invalid','{}'),
 ('e0c00000-0000-4000-8000-000000000002','email-sql-user@example.invalid','{}');
INSERT INTO public.user_roles(user_id,role) VALUES('e0c00000-0000-4000-8000-000000000001','admin');
INSERT INTO public.clients(id,name,email,frdo_password) VALUES
 ('e0c00000-0000-4000-8000-000000000010','EMAIL SQL CLIENT',NULL,'synthetic-private-password'),
 ('e0c00000-0000-4000-8000-000000000011','EMAIL SQL OTHER','other@example.invalid',NULL);
INSERT INTO public.generated_documents(id,client_id,client_name,doc_type,doc_number,doc_date,html_content,services) VALUES
 ('e0c00000-0000-4000-8000-000000000020','e0c00000-0000-4000-8000-000000000010','EMAIL SQL CLIENT','invoice','EMAIL-SQL-1','2026-09-29','<html><body>Original invoice fixture</body></html>','[]'),
 ('e0c00000-0000-4000-8000-000000000021','e0c00000-0000-4000-8000-000000000010','EMAIL SQL CLIENT','act','EMAIL-SQL-2','2026-09-29','<html><body>Original act fixture</body></html>','[]'),
 ('e0c00000-0000-4000-8000-000000000022',NULL,'EMAIL SQL CLIENT','act','EMAIL-SQL-UNLINKED','2026-09-29','<html><body>Unlinked fixture</body></html>','[]');
SELECT set_config('request.jwt.claim.sub','e0c00000-0000-4000-8000-000000000001',true);
SET LOCAL ROLE authenticated;
DO $$
DECLARE client uuid:='e0c00000-0000-4000-8000-000000000010'; request uuid:='e0c00000-0000-4000-8000-000000000100';
  documents jsonb:='[{"documentId":"e0c00000-0000-4000-8000-000000000020","revision":1}]';
  answer jsonb; replay jsonb; delivery jsonb;
BEGIN
  answer:=public.crm_save_client_email(request,client,' User@Example.invalid ',NULL);
  PERFORM pg_temp.email_assert(answer->>'email'='User@Example.invalid' AND answer->'previousEmail'='null'::jsonb,'null CAS saves trimmed email');
  PERFORM pg_temp.email_assert((SELECT frdo_password='synthetic-private-password' FROM public.clients WHERE id=client),'unrelated credentials unchanged');
  PERFORM pg_temp.email_assert((SELECT count(*)=1 FROM public.crm_client_email_changes WHERE client_id=client),'contact audit retained');
  replay:=public.crm_save_client_email(request,client,'user@example.invalid',NULL);
  PERFORM pg_temp.email_assert(replay->>'email'='User@Example.invalid' AND replay->'replayed'='true'::jsonb,'case-normalized identity replay keeps original result');
  PERFORM pg_temp.email_expect_error(format('SELECT public.crm_save_client_email(%L,%L,%L,NULL)',request,client,'changed@example.invalid'),'CRM_REQUEST_ID_CONFLICT');
  PERFORM pg_temp.email_expect_error(format('SELECT public.crm_save_client_email(%L,%L,%L,NULL)',gen_random_uuid(),client,'changed@example.invalid'),'CRM_EMAIL_CONFLICT');
  PERFORM pg_temp.email_expect_error(format('SELECT public.crm_save_client_email(%L,%L,%L,%L)',gen_random_uuid(),client,E'a@example.invalid\r\nBcc:bad@example.invalid','user@example.invalid'),'CRM_INVALID_EMAIL');
  PERFORM pg_temp.email_expect_error(format('SELECT public.crm_save_client_email(%L,%L,%L,%L)',gen_random_uuid(),client,'a@example.invalid,b@example.invalid','user@example.invalid'),'CRM_INVALID_EMAIL');
  PERFORM pg_temp.email_expect_error(format('SELECT public.crm_save_client_email(%L,%L,%L,%L)',gen_random_uuid(),client,'почта@example.invalid','user@example.invalid'),'CRM_INVALID_EMAIL');
  PERFORM pg_temp.email_expect_error(format('SELECT public.crm_save_client_email(%L,%L,%L,%L)',gen_random_uuid(),client,'a..b@example.invalid','user@example.invalid'),'CRM_INVALID_EMAIL');
  PERFORM pg_temp.email_expect_error(format('SELECT public.crm_save_client_email(%L,%L,%L,%L)',gen_random_uuid(),client,'a@bad-.example.invalid','user@example.invalid'),'CRM_INVALID_EMAIL');

  delivery:=public.crm_prepare_document_email('e0c00000-0000-4000-8000-000000000200',client,documents,NULL,'Invoice','Plain text body');
  PERFORM pg_temp.email_assert(delivery->>'state'='preparing' AND delivery->>'recipient'='User@Example.invalid','preparation freezes card recipient');
  PERFORM pg_temp.email_assert(delivery->>'message_id'='<crm-e0c00000-0000-4000-8000-000000000200@24zxc.ru>','stable message id');
  PERFORM pg_temp.email_assert(delivery->'documents'->0->>'html'='<html><body>Original invoice fixture</body></html>','saved HTML frozen');
  PERFORM pg_temp.email_assert(delivery->'documents'->0->>'htmlSha256'=encode(sha256(convert_to('<html><body>Original invoice fixture</body></html>','UTF8')),'hex'),'HTML checksum correct');
  PERFORM pg_temp.email_expect_error(format('SELECT public.crm_prepare_document_email(%L,%L,%L::jsonb,NULL,%L,%L)',gen_random_uuid(),'e0c00000-0000-4000-8000-000000000011',documents,'Wrong client','Body'),'CRM_DOCUMENT_CLIENT_MISMATCH');
  PERFORM pg_temp.email_expect_error(format('SELECT public.crm_prepare_document_email(%L,%L,%L::jsonb,NULL,%L,%L)',gen_random_uuid(),client,'[{"documentId":"e0c00000-0000-4000-8000-000000000022","revision":1}]','Unlinked','Body'),'CRM_DOCUMENT_CLIENT_MISMATCH');
  PERFORM pg_temp.email_expect_error(format('SELECT public.crm_prepare_document_email(%L,%L,%L::jsonb,NULL,%L,%L)',gen_random_uuid(),client,documents || documents,'Duplicate','Body'),'CRM_DUPLICATE_DOCUMENT');
  PERFORM pg_temp.email_expect_error(format('SELECT public.crm_prepare_document_email(%L,%L,%L::jsonb,NULL,%L,%L)',gen_random_uuid(),client,'[]','No files','Body'),'CRM_INVALID_EMAIL_REQUEST');
  PERFORM pg_temp.email_expect_error(format('SELECT public.crm_prepare_document_email(%L,%L,%L::jsonb,NULL,%L,%L)',gen_random_uuid(),client,documents,repeat('x',201),'Body'),'CRM_INVALID_EMAIL_REQUEST');
  PERFORM pg_temp.email_expect_error(format('SELECT public.crm_prepare_document_email(%L,%L,%L::jsonb,NULL,%L,%L)',gen_random_uuid(),client,documents,'Subject',repeat('x',12001)),'CRM_INVALID_EMAIL_REQUEST');
  PERFORM pg_temp.email_expect_error(format('SELECT public.crm_prepare_document_email(%L,%L,%L::jsonb,NULL,%L,%L)',gen_random_uuid(),client,documents,'Subject',E' \t\n '),'CRM_INVALID_EMAIL_REQUEST');

  PERFORM public.crm_save_client_email('e0c00000-0000-4000-8000-000000000101',client,'changed@example.invalid','USER@EXAMPLE.INVALID');
  UPDATE public.generated_documents SET html_content='<html><body>Edited after prepare</body></html>' WHERE id='e0c00000-0000-4000-8000-000000000020';
  replay:=public.crm_prepare_document_email('e0c00000-0000-4000-8000-000000000200',client,documents,NULL,'Invoice','Plain text body');
  PERFORM pg_temp.email_assert(replay=delivery,'retry does not follow changed contact or HTML');
  PERFORM pg_temp.email_expect_error(format('SELECT public.crm_prepare_document_email(%L,%L,%L::jsonb,NULL,%L,%L)',gen_random_uuid(),client,documents,'Stale revision','Body'),'CRM_REVISION_CONFLICT');
  PERFORM pg_temp.email_expect_error(format('SELECT public.crm_prepare_document_email(%L,%L,%L::jsonb,%L,%L,%L)','e0c00000-0000-4000-8000-000000000200',client,documents,'changed@example.invalid','Invoice','Plain text body'),'CRM_REQUEST_ID_CONFLICT');
  documents:='[{"documentId":"e0c00000-0000-4000-8000-000000000021","revision":1}]';
  PERFORM public.crm_prepare_document_email('e0c00000-0000-4000-8000-000000000201',client,documents,'explicit@example.invalid','Act','Body');
  PERFORM public.crm_prepare_document_email('e0c00000-0000-4000-8000-000000000202',client,documents,NULL,'Act second request','Body');
  PERFORM pg_temp.email_assert((SELECT email='changed@example.invalid' FROM public.clients WHERE id=client),'explicit send recipient never rewrites contact');
END;
$$;
SELECT pg_temp.email_expect_error($q$UPDATE public.crm_email_deliveries SET state='smtp_accepted' WHERE id='e0c00000-0000-4000-8000-000000000200'$q$,'','42501');
SELECT pg_temp.email_expect_error($q$UPDATE public.crm_client_email_changes SET email='bad@example.invalid' WHERE client_id='e0c00000-0000-4000-8000-000000000010'$q$,'','42501');
SELECT pg_temp.email_expect_error($q$SELECT public.crm_claim_document_email('e0c00000-0000-4000-8000-000000000200','e0c00000-0000-4000-8000-000000000001')$q$,'','42501');
SELECT pg_temp.email_expect_error($q$SELECT public.crm_finalize_document_email('e0c00000-0000-4000-8000-000000000200','e0c00000-0000-4000-8000-000000000001','[]')$q$,'','42501');
SELECT pg_temp.email_expect_error($q$SELECT public.crm_finish_document_email('e0c00000-0000-4000-8000-000000000200','e0c00000-0000-4000-8000-000000000001','smtp_accepted','{"smtpResponse":"250 accepted"}',NULL)$q$,'','42501');
RESET ROLE;

SET LOCAL ROLE service_role;
DO $$
DECLARE actor uuid:='e0c00000-0000-4000-8000-000000000001'; id uuid:='e0c00000-0000-4000-8000-000000000200';
  attachments jsonb; answer jsonb; prepared jsonb; accepted jsonb;
BEGIN
  answer:=public.crm_claim_document_email(id,actor);
  PERFORM pg_temp.email_assert(answer->'claimed'='false'::jsonb AND answer->'delivery'->>'state'='preparing','preparing is not claimable');
  PERFORM pg_temp.email_expect_error(format('SELECT public.crm_finish_document_email(%L,%L,%L,NULL,NULL)',id,actor,'failed'),'CRM_DELIVERY_NOT_CLAIMED');
  attachments:=pg_temp.email_attachments(id);
  PERFORM pg_temp.email_expect_error(format('SELECT public.crm_finalize_document_email(%L,%L,%L::jsonb)',id,'e0c00000-0000-4000-8000-000000000002',attachments),'CRM_ADMIN_REQUIRED');
  PERFORM pg_temp.email_expect_error(format('SELECT public.crm_finalize_document_email(%L,%L,%L::jsonb)',id,actor,jsonb_set(attachments,'{0,path}','"other/path.pdf"')),'CRM_ATTACHMENT_SOURCE_MISMATCH');
  PERFORM pg_temp.email_expect_error(format('SELECT public.crm_finalize_document_email(%L,%L,%L::jsonb)',id,actor,jsonb_set(attachments,'{0,revision}','2')),'CRM_ATTACHMENT_SOURCE_MISMATCH');
  PERFORM pg_temp.email_expect_error(format('SELECT public.crm_finalize_document_email(%L,%L,%L::jsonb)',id,actor,jsonb_set(attachments,'{0,size}','10485761')),'CRM_EMAIL_SIZE_LIMIT');
  PERFORM pg_temp.email_expect_error(format('SELECT public.crm_finalize_document_email(%L,%L,%L::jsonb)',id,actor,'[]'),'CRM_INVALID_ATTACHMENTS');
  prepared:=public.crm_finalize_document_email(id,actor,attachments);
  PERFORM pg_temp.email_assert(prepared->>'state'='prepared','valid exact attachments finalize');
  answer:=public.crm_finalize_document_email(id,actor,pg_temp.email_attachments(id,repeat('b',64)));
  PERFORM pg_temp.email_assert(answer=prepared,'concurrent rendered PDF cannot replace first finalized attachment');
  answer:=public.crm_claim_document_email(id,actor);
  PERFORM pg_temp.email_assert(answer->'claimed'='true'::jsonb AND answer->'delivery'->>'state'='sending','first claim wins');
  answer:=public.crm_claim_document_email(id,actor);
  PERFORM pg_temp.email_assert(answer->'claimed'='false'::jsonb,'sequential competing claim does not send twice');
  accepted:=public.crm_finish_document_email(id,actor,'smtp_accepted','{"smtpResponse":"250 queued as SQL-FAKE"}',NULL);
  PERFORM pg_temp.email_assert(accepted->>'state'='smtp_accepted' AND accepted->>'interaction_id' IS NOT NULL,'receipt and card interaction recorded together');
  answer:=public.crm_finish_document_email(id,actor,'smtp_accepted','{"smtpResponse":"250 queued as SQL-FAKE"}',NULL);
  PERFORM pg_temp.email_assert(answer=accepted,'finish receipt idempotent');
  PERFORM pg_temp.email_expect_error(format('SELECT public.crm_finish_document_email(%L,%L,%L,NULL,%L)',id,actor,'failed','changed result'),'CRM_DELIVERY_RESULT_CONFLICT');
  answer:=public.crm_claim_document_email(id,actor);
  PERFORM pg_temp.email_assert(answer->'claimed'='false'::jsonb,'accepted is never claimable again');
  FOREACH id IN ARRAY ARRAY['e0c00000-0000-4000-8000-000000000201'::uuid,'e0c00000-0000-4000-8000-000000000202'::uuid] LOOP
    PERFORM public.crm_finalize_document_email(id,actor,pg_temp.email_attachments(id));
    PERFORM public.crm_claim_document_email(id,actor);
    PERFORM public.crm_finish_document_email(id,actor,CASE WHEN id::text LIKE '%201' THEN 'unknown' ELSE 'failed' END,NULL,'Synthetic transport outcome');
    answer:=public.crm_claim_document_email(id,actor);
    PERFORM pg_temp.email_assert(answer->'claimed'='false'::jsonb,'failed and unknown never automatically resend');
  END LOOP;
END;
$$;
SELECT pg_temp.email_expect_error($q$UPDATE public.crm_email_deliveries SET state='prepared' WHERE id='e0c00000-0000-4000-8000-000000000200'$q$,'','42501');
RESET ROLE;
SELECT pg_temp.email_assert((SELECT count(*) FROM public.client_interactions WHERE client_id='e0c00000-0000-4000-8000-000000000010')=1,'exactly one accepted interaction');

SELECT set_config('request.jwt.claim.sub','e0c00000-0000-4000-8000-000000000002',true);
SET LOCAL ROLE authenticated;
SELECT pg_temp.email_assert((SELECT count(*) FROM public.crm_email_deliveries WHERE client_id='e0c00000-0000-4000-8000-000000000010')=0,'nonadmin cannot read delivery snapshots');
SELECT pg_temp.email_expect_error($q$SELECT public.crm_save_client_email(gen_random_uuid(),'e0c00000-0000-4000-8000-000000000010','a@example.invalid',NULL)$q$,'CRM_ADMIN_REQUIRED');
SELECT pg_temp.email_expect_error($q$SELECT public.crm_prepare_document_email(gen_random_uuid(),'e0c00000-0000-4000-8000-000000000010','[]',NULL,'Subject','Body')$q$,'CRM_ADMIN_REQUIRED');
RESET ROLE;
SET LOCAL ROLE anon;
SELECT pg_temp.email_expect_error($q$SELECT public.crm_save_client_email(gen_random_uuid(),'e0c00000-0000-4000-8000-000000000010','a@example.invalid',NULL)$q$,'','42501');
SELECT pg_temp.email_expect_error($q$SELECT public.crm_prepare_document_email(gen_random_uuid(),'e0c00000-0000-4000-8000-000000000010','[]',NULL,'Subject','Body')$q$,'','42501');
RESET ROLE;
SELECT 'crm_email_delivery assertions passed; all synthetic data rolling back' AS test_result;
ROLLBACK;

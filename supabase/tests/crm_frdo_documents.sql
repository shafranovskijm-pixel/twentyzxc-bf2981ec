-- Entirely synthetic local PostgreSQL transaction. Registry/source snapshots contain no real clients.
BEGIN;
CREATE FUNCTION pg_temp.docs_assert(ok boolean,description text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN IF ok IS DISTINCT FROM true THEN RAISE EXCEPTION 'FRDO DOCS ASSERTION FAILED: %',description; END IF; END;
$$;
CREATE FUNCTION pg_temp.docs_error(statement text,expected text,expected_state text DEFAULT NULL) RETURNS void LANGUAGE plpgsql AS $$
DECLARE actual text; state text;
BEGIN
  BEGIN EXECUTE statement; EXCEPTION WHEN OTHERS THEN GET STACKED DIAGNOSTICS actual=MESSAGE_TEXT,state=RETURNED_SQLSTATE; END;
  IF actual IS NULL OR (expected LIKE 'CRM_%' AND actual<>expected) OR strpos(actual,expected)=0
    OR (expected_state IS NOT NULL AND state<>expected_state) OR actual LIKE '%CANARY_CREDENTIAL%' THEN
    RAISE EXCEPTION 'FRDO DOCS EXPECTED SAFE ERROR % (%), GOT % (%)',expected,expected_state,actual,state;
  END IF;
END;
$$;
CREATE FUNCTION pg_temp.refs() RETURNS jsonb LANGUAGE sql IMMUTABLE AS $$
 SELECT '[{"templateId":"prikaz","revision":1,"sha256":"d3e08ca4f65e6212efb0a3603a209988661e523d36ac74262d71e4af6494eb50"}]'::jsonb
$$;
CREATE FUNCTION pg_temp.pdf_request() RETURNS jsonb LANGUAGE sql IMMUTABLE AS $$
 SELECT '{"sourceFileId":"file_synthetic_1","sourceSha256":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","filename":"Результат.pdf","placements":[{"assetId":"signature","pageNumber":1,"x":10,"y":20,"width":100,"height":40}],"assetHashes":{"signature":"e18804c80605fe11ca29e93613ddd360f4a81252d4f5c705227c999aff75f787"}}'::jsonb
$$;
CREATE FUNCTION pg_temp.pdf_artifact(p_id uuid,p_actor uuid DEFAULT auth.uid()) RETURNS jsonb LANGUAGE sql STABLE AS $$
 SELECT jsonb_build_object('path','crm-signed-pdfs/'||p_actor::text||'/'||p_id::text||'/'||repeat('b',64)||'.pdf','sha256',repeat('b',64),'size',1234,'pageCount',1)
$$;
CREATE FUNCTION pg_temp.prepare(
 p_id uuid,p_client uuid DEFAULT 'f2d00000-0000-4000-8000-000000000010',
 p_revision bigint DEFAULT 1,p_inn text DEFAULT '0000000001',p_templates jsonb DEFAULT pg_temp.refs(),
 p_recipient text DEFAULT NULL,p_subject text DEFAULT NULL,p_body text DEFAULT 'Synthetic plain body')
RETURNS jsonb LANGUAGE sql AS $$
 SELECT public.crm_prepare_frdo_email(p_id,p_client,p_revision,p_inn,p_templates,p_recipient,p_subject,p_body)
$$;
CREATE FUNCTION pg_temp.attachments(p_id uuid) RETURNS jsonb LANGUAGE sql STABLE AS $$
 SELECT jsonb_agg(jsonb_build_object('templateId',t->>'templateId','revision',t->'revision','filename',t->>'filename',
  'sha256',t->>'sha256','size',t->'size','contentType',t->>'contentType',
  'path','crm-frdo-email/'||p_id::text||'/'||(t->>'templateId')||'-r'||(t->>'revision')||'-'||(t->>'sha256')||'.'||(t->>'ext')) ORDER BY n)
 FROM public.crm_frdo_email_deliveries d CROSS JOIN LATERAL jsonb_array_elements(d.templates) WITH ORDINALITY t(t,n) WHERE d.id=p_id
$$;
INSERT INTO auth.users(id,email) VALUES
 ('f2d00000-0000-4000-8000-000000000001','admin-one@example.invalid'),
 ('f2d00000-0000-4000-8000-000000000002','normal@example.invalid'),
 ('f2d00000-0000-4000-8000-000000000003','admin-two@example.invalid');
INSERT INTO public.user_roles(user_id,role) VALUES
 ('f2d00000-0000-4000-8000-000000000001','admin'),('f2d00000-0000-4000-8000-000000000003','admin');
INSERT INTO public.clients(id,name,inn,email,notes,frdo_login,frdo_password,frdo_password_po) VALUES
 ('f2d00000-0000-4000-8000-000000000010','Synthetic Academy',' 0000000001 ','Card@Example.invalid','CANARY_CREDENTIAL_note','CANARY_CREDENTIAL_login','CANARY_CREDENTIAL_password','CANARY_CREDENTIAL_po'),
 ('f2d00000-0000-4000-8000-000000000011','No INN',NULL,'noinn@example.invalid',NULL,NULL,NULL,NULL);

-- Least-privilege grants and RLS: no direct mutation, no anonymous registry, no worker user-RPC bypass.
SELECT pg_temp.docs_assert(NOT has_table_privilege('anon','public.crm_frdo_template_catalog','SELECT'),'anonymous registry denied');
SELECT pg_temp.docs_assert(NOT has_table_privilege('authenticated','public.crm_frdo_template_catalog','UPDATE'),'registry immutable to admin');
SELECT pg_temp.docs_assert(NOT has_table_privilege('service_role','public.crm_frdo_template_catalog','INSERT'),'registry immutable to worker');
SELECT pg_temp.docs_assert(NOT has_table_privilege('authenticated','public.crm_signed_pdfs','INSERT'),'signed artifact direct insert denied');
SELECT pg_temp.docs_assert(NOT has_table_privilege('authenticated','public.crm_frdo_email_deliveries','UPDATE'),'outbox direct mutation denied');
SELECT pg_temp.docs_assert(NOT has_function_privilege('anon','public.crm_prepare_frdo_email(uuid,uuid,bigint,text,jsonb,text,text,text)','EXECUTE'),'anon prepare denied');
SELECT pg_temp.docs_assert(NOT has_function_privilege('service_role','public.crm_register_signed_pdf(uuid,jsonb,jsonb)','EXECUTE'),'worker registration bypass denied');
SELECT pg_temp.docs_assert(NOT has_function_privilege('authenticated','public.crm_claim_frdo_email(uuid,uuid)','EXECUTE'),'authenticated cannot claim');
SELECT pg_temp.docs_assert(NOT has_function_privilege('service_role','public.crm_frdo_require_worker(uuid)','EXECUTE'),'worker helper private');
SELECT pg_temp.docs_assert(NOT has_function_privilege('service_role','public.crm_check_signed_pdf_storage()','EXECUTE'),'preflight is user-JWT only');
SET LOCAL ROLE anon;
SELECT pg_temp.docs_error($q$SELECT pg_temp.prepare('f2d00000-0000-4000-8000-000000000100')$q$,'permission denied','42501');
RESET ROLE;
SELECT set_config('request.jwt.claim.sub','',true);
SET LOCAL ROLE authenticated;
SELECT pg_temp.docs_error($q$SELECT pg_temp.prepare('f2d00000-0000-4000-8000-000000000100')$q$,'CRM_AUTH_REQUIRED','42501');
SELECT pg_temp.docs_error('SELECT public.crm_check_signed_pdf_storage()','CRM_AUTH_REQUIRED','42501');
SELECT pg_temp.docs_error($q$SELECT public.crm_register_signed_pdf('f2d00000-0000-4000-8000-000000000200',pg_temp.pdf_request(),pg_temp.pdf_artifact('f2d00000-0000-4000-8000-000000000200'))$q$,'CRM_AUTH_REQUIRED','42501');
RESET ROLE;
SELECT set_config('request.jwt.claim.sub','f2d00000-0000-4000-8000-000000000002',true);
SET LOCAL ROLE authenticated;
SELECT pg_temp.docs_assert((SELECT count(*) FROM public.crm_frdo_template_catalog)=0,'nonadmin cannot read catalog');
SELECT pg_temp.docs_error($q$SELECT pg_temp.prepare('f2d00000-0000-4000-8000-000000000100')$q$,'CRM_FORBIDDEN','42501');
SELECT pg_temp.docs_error('SELECT public.crm_check_signed_pdf_storage()','CRM_FORBIDDEN','42501');
SELECT pg_temp.docs_error($q$SELECT public.crm_register_signed_pdf('f2d00000-0000-4000-8000-000000000200',pg_temp.pdf_request(),pg_temp.pdf_artifact('f2d00000-0000-4000-8000-000000000200'))$q$,'CRM_FORBIDDEN','42501');
RESET ROLE;

-- NULL role answers fail closed.
SAVEPOINT role_null;
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid,_role public.app_role) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT NULL::boolean $$;
SELECT set_config('request.jwt.claim.sub','f2d00000-0000-4000-8000-000000000001',true);
SET LOCAL ROLE authenticated;
SELECT pg_temp.docs_error($q$SELECT pg_temp.prepare('f2d00000-0000-4000-8000-000000000100')$q$,'CRM_FORBIDDEN');
SELECT pg_temp.docs_error('SELECT public.crm_check_signed_pdf_storage()','CRM_FORBIDDEN');
SELECT pg_temp.docs_error($q$SELECT public.crm_register_signed_pdf('f2d00000-0000-4000-8000-000000000200',pg_temp.pdf_request(),NULL)$q$,'CRM_FORBIDDEN');
RESET ROLE;
ROLLBACK TO role_null;
SELECT set_config('request.jwt.claim.sub','f2d00000-0000-4000-8000-000000000001',true);
SELECT set_config('request.jwt.claim.role','authenticated',true);
SET LOCAL ROLE authenticated;
SELECT pg_temp.docs_assert((SELECT count(*) FROM public.crm_frdo_template_catalog)=8,'admin sees pinned eight files');
SELECT pg_temp.docs_assert((SELECT count(*) FROM public.crm_pdf_asset_catalog)=2,'admin sees exactly own two PNG pins');
SELECT pg_temp.docs_assert(public.crm_check_signed_pdf_storage(),'admin private-storage preflight succeeds');

-- Strict request validation and client CAS; NULL expected INN is an explicit identity expectation.
SELECT pg_temp.docs_error($q$SELECT pg_temp.prepare(NULL)$q$,'CRM_INVALID_ARGUMENT');
SELECT pg_temp.docs_error($q$SELECT pg_temp.prepare('f2d00000-0000-4000-8000-000000000100',p_revision=>0)$q$,'CRM_INVALID_ARGUMENT');
SELECT pg_temp.docs_error($q$SELECT pg_temp.prepare('f2d00000-0000-4000-8000-000000000100',p_inn=>'bad')$q$,'CRM_INVALID_ARGUMENT');
SELECT pg_temp.docs_error($q$SELECT pg_temp.prepare('f2d00000-0000-4000-8000-000000000100',p_inn=>'  ')$q$,'CRM_INVALID_ARGUMENT');
SELECT pg_temp.docs_error($q$SELECT pg_temp.prepare('f2d00000-0000-4000-8000-000000000100',p_inn=>NULL)$q$,'CRM_CLIENT_INN_CONFLICT');
SELECT pg_temp.docs_error($q$SELECT pg_temp.prepare('f2d00000-0000-4000-8000-000000000100',p_inn=>'0000000002')$q$,'CRM_CLIENT_INN_CONFLICT');
SELECT pg_temp.docs_error($q$SELECT pg_temp.prepare('f2d00000-0000-4000-8000-000000000100',p_revision=>2)$q$,'CRM_CLIENT_REVISION_CONFLICT');
SELECT pg_temp.docs_error($q$SELECT pg_temp.prepare('f2d00000-0000-4000-8000-000000000100',p_client=>'f2d00000-0000-4000-8000-000000000099')$q$,'CRM_CLIENT_NOT_FOUND');
SELECT pg_temp.docs_error($q$SELECT pg_temp.prepare('f2d00000-0000-4000-8000-000000000100',p_recipient=>E'a@example.invalid\r\nBcc:x@example.invalid')$q$,'CRM_INVALID_ARGUMENT');
SELECT pg_temp.docs_error($q$SELECT pg_temp.prepare('f2d00000-0000-4000-8000-000000000100',p_subject=>E'x\nbad')$q$,'CRM_INVALID_ARGUMENT');
SELECT pg_temp.docs_error($q$SELECT pg_temp.prepare('f2d00000-0000-4000-8000-000000000100',p_body=>chr(1))$q$,'CRM_INVALID_ARGUMENT');
SELECT pg_temp.docs_error($q$SELECT pg_temp.prepare('f2d00000-0000-4000-8000-000000000100',p_body=>repeat('x',12001))$q$,'CRM_INVALID_ARGUMENT');
SELECT pg_temp.docs_error($q$SELECT pg_temp.prepare('f2d00000-0000-4000-8000-000000000100',p_body=>E' \n\t ' )$q$,'CRM_INVALID_ARGUMENT');
SELECT pg_temp.docs_error($q$SELECT pg_temp.prepare('f2d00000-0000-4000-8000-000000000100',p_templates=>'{}')$q$,'CRM_INVALID_ARGUMENT');
SELECT pg_temp.docs_error($q$SELECT pg_temp.prepare('f2d00000-0000-4000-8000-000000000100',p_templates=>'[]')$q$,'CRM_INVALID_ARGUMENT');
SELECT pg_temp.docs_error($q$SELECT pg_temp.prepare('f2d00000-0000-4000-8000-000000000100',p_templates=>pg_temp.refs()||pg_temp.refs())$q$,'CRM_INVALID_ARGUMENT');
SELECT pg_temp.docs_error($q$SELECT pg_temp.prepare('f2d00000-0000-4000-8000-000000000100',p_templates=>jsonb_set(pg_temp.refs(),'{0,secret}','"x"'))$q$,'CRM_INVALID_ARGUMENT');
SELECT pg_temp.docs_error($q$SELECT pg_temp.prepare('f2d00000-0000-4000-8000-000000000100',p_templates=>jsonb_set(pg_temp.refs(),'{0,templateId}','"unknown"'))$q$,'CRM_TEMPLATE_NOT_FOUND');
SELECT pg_temp.docs_error($q$SELECT pg_temp.prepare('f2d00000-0000-4000-8000-000000000100',p_templates=>jsonb_set(pg_temp.refs(),'{0,revision}','2'))$q$,'CRM_TEMPLATE_NOT_FOUND');
SELECT pg_temp.docs_error($q$SELECT pg_temp.prepare('f2d00000-0000-4000-8000-000000000100',p_templates=>jsonb_set(pg_temp.refs(),'{0,sha256}',to_jsonb(repeat('a',64))))$q$,'CRM_TEMPLATE_REVISION_CONFLICT');
SELECT pg_temp.docs_assert((pg_temp.prepare('f2d00000-0000-4000-8000-000000000101','f2d00000-0000-4000-8000-000000000011',1,NULL)->>'replayed')='false','nullable INN can match exactly');

-- Fresh frozen metadata, stable ID, normalized recipient, explicit control-safe body.
SELECT pg_temp.docs_assert((pg_temp.prepare('f2d00000-0000-4000-8000-000000000100')->>'replayed')='false','fresh prepare');
SELECT pg_temp.docs_assert((SELECT recipient='card@example.invalid' AND subject='Приказ ФИС ФРДО — Synthetic Academy'
 AND message_id='<crm-frdo-f2d00000-0000-4000-8000-000000000100@24zxc.ru>' AND state='preparing'
 AND id=request_id AND client_snapshot->>'inn'='0000000001'
 AND (SELECT count(*) FROM jsonb_object_keys(client_snapshot))=5 AND to_jsonb(d)::text NOT LIKE '%CANARY_CREDENTIAL%'
 FROM public.crm_frdo_email_deliveries d WHERE id='f2d00000-0000-4000-8000-000000000100'),'safe exact snapshot and stable ID');
SELECT pg_temp.docs_assert((pg_temp.prepare('f2d00000-0000-4000-8000-000000000100')->>'replayed')='true','exact prepare replay');
SELECT pg_temp.docs_error($q$SELECT pg_temp.prepare('f2d00000-0000-4000-8000-000000000100',p_body=>'changed')$q$,'CRM_REQUEST_CONFLICT');
UPDATE public.clients SET name='Renamed after prepare',email='changed@example.invalid' WHERE id='f2d00000-0000-4000-8000-000000000010';
SELECT pg_temp.docs_assert((SELECT crm_revision=2 FROM public.clients WHERE id='f2d00000-0000-4000-8000-000000000010'),'real all-writer revision increments');
SELECT pg_temp.docs_assert((pg_temp.prepare('f2d00000-0000-4000-8000-000000000100')->'delivery'->>'subject')='Приказ ФИС ФРДО — Synthetic Academy','replay does not re-read changed client/default subject');
SELECT pg_temp.docs_error($q$SELECT pg_temp.prepare('f2d00000-0000-4000-8000-000000000102')$q$,'CRM_CLIENT_REVISION_CONFLICT');
RESET ROLE;
SELECT set_config('request.jwt.claim.sub','f2d00000-0000-4000-8000-000000000003',true);
SET LOCAL ROLE authenticated;
SELECT pg_temp.docs_assert((SELECT count(*) FROM public.crm_frdo_email_deliveries)=0,'another admin cannot read actor outbox');
SELECT pg_temp.docs_error($q$SELECT pg_temp.prepare('f2d00000-0000-4000-8000-000000000100')$q$,'CRM_REQUEST_CONFLICT');
RESET ROLE;

-- Private bucket is mandatory, never silently made public/private by the migration.
UPDATE storage.buckets SET public=true WHERE id='contracts';
SELECT set_config('request.jwt.claim.sub','f2d00000-0000-4000-8000-000000000001',true);
SET LOCAL ROLE authenticated;
SELECT pg_temp.docs_error($q$SELECT pg_temp.prepare('f2d00000-0000-4000-8000-000000000102',p_revision=>2)$q$,'CRM_PRIVATE_STORAGE_REQUIRED');
SELECT pg_temp.docs_error($q$SELECT pg_temp.prepare('f2d00000-0000-4000-8000-000000000100')$q$,'CRM_PRIVATE_STORAGE_REQUIRED');
SELECT pg_temp.docs_error('SELECT public.crm_check_signed_pdf_storage()','CRM_PRIVATE_STORAGE_REQUIRED');
SELECT pg_temp.docs_error($q$SELECT public.crm_register_signed_pdf('f2d00000-0000-4000-8000-000000000200',pg_temp.pdf_request(),pg_temp.pdf_artifact('f2d00000-0000-4000-8000-000000000200'))$q$,'CRM_PRIVATE_STORAGE_REQUIRED');
RESET ROLE;
UPDATE storage.buckets SET public=false WHERE id='contracts';

-- Worker must hold both DB EXECUTE privilege and verified service_role JWT claim.
SELECT set_config('request.jwt.claim.role','authenticated',true);
SET LOCAL ROLE service_role;
SELECT pg_temp.docs_error($q$SELECT public.crm_claim_frdo_email('f2d00000-0000-4000-8000-000000000100','f2d00000-0000-4000-8000-000000000001')$q$,'CRM_FORBIDDEN');
RESET ROLE;
SELECT set_config('request.jwt.claim.role','service_role',true);
SET LOCAL ROLE service_role;
SELECT pg_temp.docs_error($q$SELECT public.crm_claim_frdo_email('f2d00000-0000-4000-8000-000000000100','f2d00000-0000-4000-8000-000000000002')$q$,'CRM_FORBIDDEN');
SELECT pg_temp.docs_error($q$SELECT public.crm_claim_frdo_email('f2d00000-0000-4000-8000-000000000100','f2d00000-0000-4000-8000-000000000003')$q$,'CRM_FORBIDDEN');
SELECT pg_temp.docs_assert((public.crm_claim_frdo_email('f2d00000-0000-4000-8000-000000000100','f2d00000-0000-4000-8000-000000000001')->>'claimed')='false','preparing cannot send');
SELECT pg_temp.docs_error($q$SELECT public.crm_finish_frdo_email('f2d00000-0000-4000-8000-000000000100','f2d00000-0000-4000-8000-000000000001','smtp_accepted','250 accepted',NULL)$q$,'CRM_DELIVERY_NOT_CLAIMED');
SELECT pg_temp.docs_error($q$SELECT public.crm_finalize_frdo_email('f2d00000-0000-4000-8000-000000000100','f2d00000-0000-4000-8000-000000000001','[]')$q$,'CRM_DELIVERY_ATTACHMENT_MISMATCH');
SELECT pg_temp.docs_error($q$SELECT public.crm_finalize_frdo_email('f2d00000-0000-4000-8000-000000000100','f2d00000-0000-4000-8000-000000000001',jsonb_set(pg_temp.attachments('f2d00000-0000-4000-8000-000000000100'),'{0,path}','"https://outside.invalid/file.docx"'))$q$,'CRM_DELIVERY_ATTACHMENT_MISMATCH');
SELECT pg_temp.docs_error($q$SELECT public.crm_finalize_frdo_email('f2d00000-0000-4000-8000-000000000100','f2d00000-0000-4000-8000-000000000001',jsonb_set(pg_temp.attachments('f2d00000-0000-4000-8000-000000000100'),'{0,size}','2'))$q$,'CRM_DELIVERY_ATTACHMENT_MISMATCH');
SELECT pg_temp.docs_error($q$SELECT public.crm_finalize_frdo_email('f2d00000-0000-4000-8000-000000000100','f2d00000-0000-4000-8000-000000000001',jsonb_set(pg_temp.attachments('f2d00000-0000-4000-8000-000000000100'),'{0,sha256}',to_jsonb(repeat('b',64))))$q$,'CRM_DELIVERY_ATTACHMENT_MISMATCH');
SELECT pg_temp.docs_assert((public.crm_finalize_frdo_email('f2d00000-0000-4000-8000-000000000100','f2d00000-0000-4000-8000-000000000001',pg_temp.attachments('f2d00000-0000-4000-8000-000000000100'))->>'state')='prepared','valid exact originals finalized');
SELECT pg_temp.docs_assert((public.crm_finalize_frdo_email('f2d00000-0000-4000-8000-000000000100','f2d00000-0000-4000-8000-000000000001',pg_temp.attachments('f2d00000-0000-4000-8000-000000000100'))->>'state')='prepared','finalize exact replay');
SELECT pg_temp.docs_assert((public.crm_claim_frdo_email('f2d00000-0000-4000-8000-000000000100','f2d00000-0000-4000-8000-000000000001')->>'claimed')='true','first claimant allowed');
SELECT pg_temp.docs_assert((public.crm_claim_frdo_email('f2d00000-0000-4000-8000-000000000100','f2d00000-0000-4000-8000-000000000001')->>'claimed')='false','second claimant prevented');
SELECT pg_temp.docs_error($q$SELECT public.crm_finish_frdo_email('f2d00000-0000-4000-8000-000000000100','f2d00000-0000-4000-8000-000000000001','smtp_accepted','550 rejected',NULL)$q$,'CRM_INVALID_ARGUMENT');
SELECT pg_temp.docs_error($q$SELECT public.crm_finish_frdo_email('f2d00000-0000-4000-8000-000000000100','f2d00000-0000-4000-8000-000000000001','unknown',NULL,'CANARY_CREDENTIAL_RAW_ERROR')$q$,'CRM_INVALID_ARGUMENT');
SELECT pg_temp.docs_assert((public.crm_finish_frdo_email('f2d00000-0000-4000-8000-000000000100','f2d00000-0000-4000-8000-000000000001','smtp_accepted','250 accepted synthetic',NULL)->>'state')='smtp_accepted','SMTP acceptance recorded');
SELECT pg_temp.docs_assert((public.crm_finish_frdo_email('f2d00000-0000-4000-8000-000000000100','f2d00000-0000-4000-8000-000000000001','smtp_accepted','250 accepted synthetic',NULL)->>'state')='smtp_accepted','identical terminal replay');
SELECT pg_temp.docs_error($q$SELECT public.crm_finish_frdo_email('f2d00000-0000-4000-8000-000000000100','f2d00000-0000-4000-8000-000000000001','unknown',NULL,'FRDO_SMTP_UNKNOWN')$q$,'CRM_DELIVERY_RESULT_CONFLICT');
SELECT pg_temp.docs_assert((public.crm_claim_frdo_email('f2d00000-0000-4000-8000-000000000100','f2d00000-0000-4000-8000-000000000001')->>'claimed')='false','terminal receipt never resends');
RESET ROLE;
SELECT pg_temp.docs_assert((SELECT count(*) FROM public.client_interactions)=1,'one accepted send creates exactly one history entry');
SELECT pg_temp.docs_assert((SELECT content LIKE '%принято SMTP%' AND content NOT LIKE '%CANARY_CREDENTIAL%' FROM public.client_interactions),'history says acceptance and has no credential bytes');

-- Terminal failure/uncertainty are also immutable and never autonomously retried.
SELECT set_config('request.jwt.claim.role','authenticated',true);
SET LOCAL ROLE authenticated;
SELECT pg_temp.prepare('f2d00000-0000-4000-8000-000000000102',p_revision=>2);
SELECT pg_temp.prepare('f2d00000-0000-4000-8000-000000000103',p_revision=>2);
RESET ROLE;
SELECT set_config('request.jwt.claim.role','service_role',true);
SET LOCAL ROLE service_role;
SELECT public.crm_finalize_frdo_email('f2d00000-0000-4000-8000-000000000102','f2d00000-0000-4000-8000-000000000001',pg_temp.attachments('f2d00000-0000-4000-8000-000000000102'));
SELECT public.crm_claim_frdo_email('f2d00000-0000-4000-8000-000000000102','f2d00000-0000-4000-8000-000000000001');
SELECT pg_temp.docs_assert((public.crm_finish_frdo_email('f2d00000-0000-4000-8000-000000000102','f2d00000-0000-4000-8000-000000000001','unknown',NULL,'FRDO_SMTP_UNKNOWN')->>'state')='unknown','uncertain send is terminal');
SELECT pg_temp.docs_assert((public.crm_claim_frdo_email('f2d00000-0000-4000-8000-000000000102','f2d00000-0000-4000-8000-000000000001')->>'claimed')='false','uncertain send never resends');
SELECT public.crm_finalize_frdo_email('f2d00000-0000-4000-8000-000000000103','f2d00000-0000-4000-8000-000000000001',pg_temp.attachments('f2d00000-0000-4000-8000-000000000103'));
SELECT public.crm_claim_frdo_email('f2d00000-0000-4000-8000-000000000103','f2d00000-0000-4000-8000-000000000001');
SELECT pg_temp.docs_assert((public.crm_finish_frdo_email('f2d00000-0000-4000-8000-000000000103','f2d00000-0000-4000-8000-000000000001','failed',NULL,'FRDO_SMTP_REJECTED')->>'state')='failed','SMTP rejection recorded');
SELECT pg_temp.docs_assert((public.crm_claim_frdo_email('f2d00000-0000-4000-8000-000000000103','f2d00000-0000-4000-8000-000000000001')->>'claimed')='false','failed send never auto-retries');
RESET ROLE;
SELECT pg_temp.docs_assert((SELECT count(*) FROM public.client_interactions)=1,'failed/unknown do not create accepted history');
UPDATE storage.buckets SET public=true WHERE id='contracts';
SELECT set_config('request.jwt.claim.role','authenticated',true);
SET LOCAL ROLE authenticated;
SELECT pg_temp.docs_assert((pg_temp.prepare('f2d00000-0000-4000-8000-000000000100')->>'replayed')='true','historical acceptance replay requires no upload');
RESET ROLE;
UPDATE storage.buckets SET public=false WHERE id='contracts';

-- Explicit PDF artifact: pinned used PNGs only, source hash bound, no URLs/tokens, bounded placements.
SELECT set_config('request.jwt.claim.role','authenticated',true);
SET LOCAL ROLE authenticated;
SELECT pg_temp.docs_error($q$SELECT public.crm_register_signed_pdf('f2d00000-0000-4000-8000-000000000200',pg_temp.pdf_request()||'{"downloadUrl":"https://outside.invalid"}',pg_temp.pdf_artifact('f2d00000-0000-4000-8000-000000000200'))$q$,'CRM_INVALID_ARGUMENT');
SELECT pg_temp.docs_error($q$SELECT public.crm_register_signed_pdf('f2d00000-0000-4000-8000-000000000200',jsonb_set(pg_temp.pdf_request(),'{sourceFileId}','"https://outside.invalid/file"'),pg_temp.pdf_artifact('f2d00000-0000-4000-8000-000000000200'))$q$,'CRM_INVALID_ARGUMENT');
SELECT pg_temp.docs_error($q$SELECT public.crm_register_signed_pdf('f2d00000-0000-4000-8000-000000000200',jsonb_set(pg_temp.pdf_request(),'{sourceSha256}','"invalid"'),pg_temp.pdf_artifact('f2d00000-0000-4000-8000-000000000200'))$q$,'CRM_INVALID_ARGUMENT');
SELECT pg_temp.docs_error($q$SELECT public.crm_register_signed_pdf('f2d00000-0000-4000-8000-000000000200',jsonb_set(pg_temp.pdf_request(),'{filename}','"../result.pdf"'),pg_temp.pdf_artifact('f2d00000-0000-4000-8000-000000000200'))$q$,'CRM_INVALID_ARGUMENT');
SELECT pg_temp.docs_error($q$SELECT public.crm_register_signed_pdf('f2d00000-0000-4000-8000-000000000200',jsonb_set(pg_temp.pdf_request(),'{placements}','[]'),pg_temp.pdf_artifact('f2d00000-0000-4000-8000-000000000200'))$q$,'CRM_INVALID_ARGUMENT');
SELECT pg_temp.docs_error($q$SELECT public.crm_register_signed_pdf('f2d00000-0000-4000-8000-000000000200',jsonb_set(pg_temp.pdf_request(),'{placements,0,assetId}','" чужая "'),pg_temp.pdf_artifact('f2d00000-0000-4000-8000-000000000200'))$q$,'CRM_INVALID_ARGUMENT');
SELECT pg_temp.docs_error($q$SELECT public.crm_register_signed_pdf('f2d00000-0000-4000-8000-000000000200',jsonb_set(pg_temp.pdf_request(),'{placements,0,pageNumber}','0'),pg_temp.pdf_artifact('f2d00000-0000-4000-8000-000000000200'))$q$,'CRM_INVALID_ARGUMENT');
SELECT pg_temp.docs_error($q$SELECT public.crm_register_signed_pdf('f2d00000-0000-4000-8000-000000000200',jsonb_set(pg_temp.pdf_request(),'{placements,0,x}','-1'),pg_temp.pdf_artifact('f2d00000-0000-4000-8000-000000000200'))$q$,'CRM_INVALID_ARGUMENT');
SELECT pg_temp.docs_error($q$SELECT public.crm_register_signed_pdf('f2d00000-0000-4000-8000-000000000200',jsonb_set(pg_temp.pdf_request(),'{placements,0,width}','0'),pg_temp.pdf_artifact('f2d00000-0000-4000-8000-000000000200'))$q$,'CRM_INVALID_ARGUMENT');
SELECT pg_temp.docs_error($q$SELECT public.crm_register_signed_pdf('f2d00000-0000-4000-8000-000000000200',jsonb_set(pg_temp.pdf_request(),'{placements,0,y}','14401'),pg_temp.pdf_artifact('f2d00000-0000-4000-8000-000000000200'))$q$,'CRM_INVALID_ARGUMENT');
SELECT pg_temp.docs_error($q$SELECT public.crm_register_signed_pdf('f2d00000-0000-4000-8000-000000000200',jsonb_set(pg_temp.pdf_request(),'{assetHashes,signature}',to_jsonb(repeat('c',64))),pg_temp.pdf_artifact('f2d00000-0000-4000-8000-000000000200'))$q$,'CRM_INVALID_ARGUMENT');
SELECT pg_temp.docs_error($q$SELECT public.crm_register_signed_pdf('f2d00000-0000-4000-8000-000000000200',jsonb_set(pg_temp.pdf_request(),'{assetHashes,stamp}',to_jsonb(repeat('c',64))),pg_temp.pdf_artifact('f2d00000-0000-4000-8000-000000000200'))$q$,'CRM_INVALID_ARGUMENT');
SELECT pg_temp.docs_error($q$SELECT public.crm_register_signed_pdf('f2d00000-0000-4000-8000-000000000200',pg_temp.pdf_request(),jsonb_set(pg_temp.pdf_artifact('f2d00000-0000-4000-8000-000000000200'),'{size}','10485761'))$q$,'CRM_INVALID_ARGUMENT');
SELECT pg_temp.docs_error($q$SELECT public.crm_register_signed_pdf('f2d00000-0000-4000-8000-000000000200',pg_temp.pdf_request(),jsonb_set(pg_temp.pdf_artifact('f2d00000-0000-4000-8000-000000000200'),'{path}','"contracts/elsewhere.pdf"'))$q$,'CRM_INVALID_ARGUMENT');
SELECT pg_temp.docs_error($q$SELECT public.crm_register_signed_pdf('f2d00000-0000-4000-8000-000000000200',jsonb_set(pg_temp.pdf_request(),'{placements,0,pageNumber}','2'),pg_temp.pdf_artifact('f2d00000-0000-4000-8000-000000000200'))$q$,'CRM_INVALID_ARGUMENT');
SELECT pg_temp.docs_assert((public.crm_register_signed_pdf('f2d00000-0000-4000-8000-000000000200',pg_temp.pdf_request(),pg_temp.pdf_artifact('f2d00000-0000-4000-8000-000000000200'))->>'replayed')='false','fresh artifact registered');
SELECT pg_temp.docs_assert((SELECT count(*) FROM public.crm_signed_pdfs)=1,'actor admin can read own artifact');
SELECT pg_temp.docs_assert((public.crm_register_signed_pdf('f2d00000-0000-4000-8000-000000000200',pg_temp.pdf_request(),NULL)->>'replayed')='true','replay reuses first artifact without rendering again');
SELECT pg_temp.docs_error($q$SELECT public.crm_register_signed_pdf('f2d00000-0000-4000-8000-000000000200',jsonb_set(pg_temp.pdf_request(),'{sourceSha256}',to_jsonb(repeat('c',64))),NULL)$q$,'CRM_REQUEST_CONFLICT');
SELECT pg_temp.docs_error($q$SELECT public.crm_register_signed_pdf('f2d00000-0000-4000-8000-000000000200',jsonb_set(pg_temp.pdf_request(),'{placements,0,x}','11'),NULL)$q$,'CRM_REQUEST_CONFLICT');
SELECT pg_temp.docs_assert((SELECT source_sha256=repeat('a',64) AND output_sha256=repeat('b',64) AND page_count=1
 AND request->>'sourceSha256'=source_sha256 AND asset_hashes=pg_temp.pdf_request()->'assetHashes'
 AND to_jsonb(p)::text NOT LIKE '%https://%' AND to_jsonb(p)::text NOT LIKE '%CANARY_CREDENTIAL%'
 FROM public.crm_signed_pdfs p),'artifact contains only bounded metadata');
RESET ROLE;
SELECT set_config('request.jwt.claim.sub','f2d00000-0000-4000-8000-000000000003',true);
SET LOCAL ROLE authenticated;
SELECT pg_temp.docs_assert((SELECT count(*) FROM public.crm_signed_pdfs)=0,'other admin cannot read actor PDF');
SELECT pg_temp.docs_error($q$SELECT public.crm_register_signed_pdf('f2d00000-0000-4000-8000-000000000200',pg_temp.pdf_request(),NULL)$q$,'CRM_REQUEST_CONFLICT');
RESET ROLE;
ROLLBACK;


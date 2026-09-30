-- Synthetic, rolled-back SQL integration check for versioned service texts.
BEGIN;
CREATE FUNCTION pg_temp.template_assert(ok boolean, label text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN IF ok IS DISTINCT FROM true THEN RAISE EXCEPTION 'ASSERTION FAILED: %', label; END IF; END;
$$;
CREATE FUNCTION pg_temp.template_error(statement text, expected text) RETURNS void LANGUAGE plpgsql AS $$
DECLARE got text;
BEGIN
  BEGIN EXECUTE statement; EXCEPTION WHEN OTHERS THEN GET STACKED DIAGNOSTICS got = MESSAGE_TEXT; END;
  IF got IS NULL OR position(expected IN got) = 0 THEN RAISE EXCEPTION 'EXPECTED %, GOT %', expected, got; END IF;
END;
$$;
INSERT INTO auth.users(id,email,raw_user_meta_data) VALUES
  ('a0c00000-0000-4000-8000-000000000001','template-admin@example.invalid','{}'),
  ('a0c00000-0000-4000-8000-000000000002','template-user@example.invalid','{}');
INSERT INTO public.user_roles(user_id,role) VALUES('a0c00000-0000-4000-8000-000000000001','admin');
INSERT INTO public.clients(id,name,inn) VALUES('a0c00000-0000-4000-8000-000000000010','Template SQL client','0000000000');
SELECT set_config('request.jwt.claim.sub','a0c00000-0000-4000-8000-000000000001',true);
SET LOCAL ROLE authenticated;
DO $$
DECLARE created jsonb; replay jsonb; updated jsonb; archived jsonb; v_template_id uuid; source jsonb;
  document_input jsonb; document_payload jsonb; document_result jsonb;
  request_id uuid := 'a0c00000-0000-4000-8000-000000000100';
BEGIN
  source := '{"title":"Тестовый договор {{client.name}}","body":"Услуга: {{subject}}. Цена: {{total.amount}}. {{custom.scope}}"}'::jsonb;
  created := public.crm_save_service_template(request_id,NULL,NULL,'SQL test service','Synthetic',source,false);
  v_template_id := (created->>'templateId')::uuid;
  PERFORM pg_temp.template_assert(created->>'revision'='1' AND created->>'isArchived'='false','create version one');
  replay := public.crm_save_service_template(request_id,NULL,NULL,'SQL test service','Synthetic',source,false);
  PERFORM pg_temp.template_assert(replay->>'templateId'=v_template_id::text AND replay->>'replayed'='true','idempotent replay');
  PERFORM pg_temp.template_error(format('SELECT public.crm_save_service_template(%L,NULL,NULL,%L,%L,%L::jsonb,false)',request_id,'Different','Synthetic',source),'CRM_REQUEST_ID_CONFLICT');
  PERFORM pg_temp.template_error(format('SELECT public.crm_save_service_template(%L,%L,2,%L,%L,%L::jsonb,false)',gen_random_uuid(),v_template_id,'Changed','Synthetic',source),'CRM_SERVICE_TEMPLATE_REVISION_CONFLICT');
  PERFORM pg_temp.template_error(format('UPDATE public.crm_service_template_versions SET name=%L WHERE template_id=%L','Changed',v_template_id),'permission denied');

  document_input := jsonb_build_object('type','contract','clientId','a0c00000-0000-4000-8000-000000000010',
    'date','2026-09-30','number','SQL-CUSTOM-1','template','custom',
    'services',jsonb_build_array(jsonb_build_object('name','Synthetic service','qty',1,'price',100)),
    'subject','Synthetic subject','deadline','Synthetic period','paymentTerms','Synthetic payment',
    'serviceTemplate',jsonb_build_object('id',v_template_id,'revision',1),
    'customContract',source || '{"variables":{"scope":"synthetic"}}'::jsonb);
  document_payload := jsonb_build_object('doc_type','contract','doc_number','SQL-CUSTOM-1','doc_date','2026-09-30',
    'client_id','a0c00000-0000-4000-8000-000000000010','client_name','Template SQL client','client_inn','0000000000',
    'contract_id',NULL,'total_amount',100,
    'services',document_input->'services','html_content','<html><body>Synthetic custom contract</body></html>',
    'metadata',jsonb_build_object('documentInput',document_input,'discountAmount',0));
  document_result := public.crm_save_document(gen_random_uuid(),NULL,NULL,document_payload,document_input);
  PERFORM pg_temp.template_assert(document_result->>'revision'='1','custom contract saved');
  PERFORM pg_temp.template_assert((SELECT contract_type='Другая услуга' FROM public.contracts WHERE id=(document_result->>'contractId')::uuid),'custom contract CRM label');
  PERFORM pg_temp.template_assert((SELECT metadata->'documentInput'->'customContract'->>'body'=source->>'body' FROM public.generated_documents WHERE id=(document_result->>'documentId')::uuid),'source text frozen in document');
  PERFORM pg_temp.template_error(format('SELECT public.crm_save_document(%L,NULL,NULL,%L::jsonb,%L::jsonb)',gen_random_uuid(),
    jsonb_set(document_payload,'{metadata,documentInput,customContract,body}','"Changed"'::jsonb),
    jsonb_set(document_input,'{customContract,body}','"Changed"'::jsonb)), 'CRM_SERVICE_TEMPLATE_SNAPSHOT_MISMATCH');
  PERFORM pg_temp.template_error(format('SELECT public.crm_save_document(%L,NULL,NULL,%L::jsonb,%L::jsonb)',gen_random_uuid(),
    jsonb_set(document_payload,'{metadata,documentInput,customContract,variables}','{"scope":["not text"]}'::jsonb),
    jsonb_set(document_input,'{customContract,variables}','{"scope":["not text"]}'::jsonb)), 'CRM_INVALID_CUSTOM_CONTRACT');

  updated := public.crm_save_service_template(gen_random_uuid(),v_template_id,1,'SQL test service','Version 2',
    '{"title":"New version","body":"New service text"}'::jsonb,false);
  PERFORM pg_temp.template_assert(updated->>'revision'='2','new version saved');
  PERFORM pg_temp.template_assert((SELECT content=source FROM public.crm_service_template_versions WHERE template_id=v_template_id AND revision=1),'old version immutable');
  archived := public.crm_save_service_template(gen_random_uuid(),v_template_id,2,'SQL test service','Archived',
    '{"title":"New version","body":"New service text"}'::jsonb,true);
  PERFORM pg_temp.template_assert(archived->>'isArchived'='true','archive version saved');
  PERFORM pg_temp.template_error(format('SELECT public.crm_save_document(%L,NULL,NULL,%L::jsonb,%L::jsonb)',gen_random_uuid(),document_payload,document_input),'CRM_SERVICE_TEMPLATE_ARCHIVED');
END;
$$;
SELECT set_config('request.jwt.claim.sub','a0c00000-0000-4000-8000-000000000002',true);
SELECT pg_temp.template_error(format('SELECT public.crm_save_service_template(%L,NULL,NULL,%L,%L,%L::jsonb,false)',
  gen_random_uuid(),'Unauthorized','Synthetic','{"title":"T","body":"B"}'),'CRM_ADMIN_REQUIRED');
ROLLBACK;

-- Synthetic transaction only; never creates live clients or sends messages.
BEGIN;
CREATE FUNCTION pg_temp.client_assert(ok boolean, description text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN IF ok IS DISTINCT FROM true THEN RAISE EXCEPTION 'ASSERTION FAILED: %',description; END IF; END;
$$;
CREATE FUNCTION pg_temp.client_expect_error(statement text, expected text, expected_state text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE actual text; code text;
BEGIN
  BEGIN EXECUTE statement; EXCEPTION WHEN OTHERS THEN GET STACKED DIAGNOSTICS actual=MESSAGE_TEXT,code=RETURNED_SQLSTATE; END;
  IF actual IS NULL OR (expected<>'' AND strpos(actual,expected)=0) OR (expected_state IS NOT NULL AND code<>expected_state) THEN
    RAISE EXCEPTION 'EXPECTED ERROR % (%), GOT % (%)',expected,expected_state,actual,code;
  END IF;
END;
$$;
INSERT INTO auth.users(id,email,raw_user_meta_data) VALUES
 ('c0c00000-0000-4000-8000-000000000001','client-sql-admin@example.invalid','{}'),
 ('c0c00000-0000-4000-8000-000000000002','client-sql-user@example.invalid','{}');
INSERT INTO public.user_roles(user_id,role) VALUES('c0c00000-0000-4000-8000-000000000001','admin');
INSERT INTO public.clients(id,name,email,inn,frdo_password,notes) VALUES
 ('c0c00000-0000-4000-8000-000000000010','CLIENT SQL EXISTING','existing@example.invalid','0000000001','do-not-expose','private-note'),
 ('c0c00000-0000-4000-8000-000000000011','CLIENT SQL DUPLICATE',NULL,NULL,NULL,NULL),
 ('c0c00000-0000-4000-8000-000000000012','CLIENT SQL DUPLICATE',NULL,NULL,NULL,NULL);
INSERT INTO public.contracts(id,client_name,contract_number) VALUES
 ('c0c00000-0000-4000-8000-000000000020','CLIENT SQL EXISTING','CLIENT-SQL-1');
INSERT INTO public.generated_documents(id,client_id,client_name,doc_type,doc_number,doc_date,html_content,services) VALUES
 ('c0c00000-0000-4000-8000-000000000030','c0c00000-0000-4000-8000-000000000010','CLIENT SQL EXISTING',
  'invoice','CLIENT-SQL-DOC','2026-09-30','<html><body>Historical client name</body></html>','[]');
SELECT set_config('request.jwt.claim.sub','c0c00000-0000-4000-8000-000000000001',true);
SET LOCAL ROLE authenticated;
DO $$
DECLARE answer jsonb; replay jsonb; created_id uuid; request uuid := 'c0c00000-0000-4000-8000-000000000100';
  existing_id uuid := 'c0c00000-0000-4000-8000-000000000010'; revision bigint; key text; bad jsonb;
BEGIN
  answer := public.crm_save_client(request,NULL,NULL,
    '{"name":"  CLIENT SQL NEW  ","contact_person":"Ирина","email":"New@Example.invalid","inn":"0000000002","phone":"+7 000 000-00-00"}');
  created_id := (answer->'client'->>'id')::uuid;
  PERFORM pg_temp.client_assert(answer->'created'='true'::jsonb AND answer->'sent'='false'::jsonb,'new client saved without send');
  PERFORM pg_temp.client_assert(answer->'client'->>'name'='CLIENT SQL NEW' AND answer->'client'->>'crm_revision'='1','creation trims and starts revision');
  PERFORM pg_temp.client_assert(NOT (answer->'client' ?| ARRAY['frdo_password','frdo_login','notes']),'response allowlist');
  replay := public.crm_save_client(request,NULL,NULL,
    '{"name":"CLIENT SQL NEW","contact_person":"Ирина","email":"New@Example.invalid","inn":"0000000002","phone":"+7 000 000-00-00"}');
  PERFORM pg_temp.client_assert(replay->'client'->>'id'=created_id::text AND replay->'replayed'='true'::jsonb,'create replay returns same client');
  PERFORM pg_temp.client_assert((SELECT count(*)=1 FROM public.clients WHERE name='CLIENT SQL NEW'),'replay never duplicates');
  PERFORM pg_temp.client_expect_error(format('SELECT public.crm_save_client(%L,NULL,NULL,%L::jsonb)',request,'{"name":"DIFFERENT"}'),'CRM_REQUEST_ID_CONFLICT');
  PERFORM pg_temp.client_expect_error(format('SELECT public.crm_save_client(%L,NULL,NULL,%L::jsonb)',gen_random_uuid(),'{"name":"client sql NEW!"}'),'CRM_CLIENT_NAME_EXISTS');
  PERFORM pg_temp.client_expect_error(format('SELECT public.crm_save_client(%L,NULL,NULL,%L::jsonb)',gen_random_uuid(),'{"name":"OTHER A","inn":"0000000002"}'),'CRM_CLIENT_INN_EXISTS');
  PERFORM pg_temp.client_expect_error(format('SELECT public.crm_save_client(%L,NULL,NULL,%L::jsonb)',gen_random_uuid(),'{"name":"OTHER B","email":"new@example.invalid"}'),'CRM_CLIENT_EMAIL_EXISTS');
  answer := public.crm_save_client(gen_random_uuid(),NULL,NULL,'{"name":"CLIENT SQL SHARED","email":"new@example.invalid"}',true);
  PERFORM pg_temp.client_assert(answer->'created'='true'::jsonb,'explicit shared email allowed');

  answer := public.crm_save_client('c0c00000-0000-4000-8000-000000000101',existing_id,1,
    '{"name":"CLIENT SQL RENAMED","contact_person":"Анна","kpp":"000000001","ogrn":"0000000000001","legal_address":"Тестовый адрес","director_name":"Иванов И. И.","director_post":"Директор"}');
  PERFORM pg_temp.client_assert(answer->'client'->>'crm_revision'='2' AND answer->>'renamedContracts'='1','rename carries unique exact legacy contract');
  PERFORM pg_temp.client_assert((SELECT client_name='CLIENT SQL RENAMED' FROM public.contracts WHERE id='c0c00000-0000-4000-8000-000000000020'),'contract linked after rename');
  PERFORM pg_temp.client_assert((SELECT count(*)=1 FROM public.clients WHERE name='CLIENT SQL RENAMED'),'contract trigger never creates duplicate client');
  PERFORM pg_temp.client_assert((SELECT d.client_name='CLIENT SQL EXISTING' AND d.html_content='<html><body>Historical client name</body></html>' AND d.revision=1 FROM public.generated_documents d WHERE d.id='c0c00000-0000-4000-8000-000000000030'),'historical document stays immutable');
  PERFORM pg_temp.client_assert((SELECT frdo_password='do-not-expose' AND notes='private-note' AND email='existing@example.invalid' FROM public.clients WHERE id=existing_id),'unspecified and private fields preserved');
  PERFORM pg_temp.client_assert((SELECT NOT (previous_snapshot ?| ARRAY['notes','frdo_password']) AND result::text NOT LIKE '%do-not-expose%' FROM public.crm_client_commands WHERE request_id='c0c00000-0000-4000-8000-000000000101'),'audit allowlist');
  PERFORM pg_temp.client_expect_error(format('SELECT public.crm_save_client(%L,%L,1,%L::jsonb)',gen_random_uuid(),existing_id,'{"contact_person":"Stale"}'),'CRM_CLIENT_REVISION_CONFLICT');

  -- Direct UI and the pre-existing save-email RPC participate in revision checks.
  UPDATE public.clients SET phone='updated-directly' WHERE id=existing_id;
  PERFORM pg_temp.client_expect_error(format('SELECT public.crm_save_client(%L,%L,2,%L::jsonb)',gen_random_uuid(),existing_id,'{"email":"lost@example.invalid"}'),'CRM_CLIENT_REVISION_CONFLICT');
  PERFORM public.crm_save_client_email(gen_random_uuid(),existing_id,'fresh@example.invalid','existing@example.invalid');
  SELECT crm_revision INTO revision FROM public.clients WHERE id=existing_id;
  PERFORM pg_temp.client_assert(revision=4,'legacy email and UI both bump revision');
  answer := public.crm_save_client('c0c00000-0000-4000-8000-000000000102',existing_id,revision,'{"contact_person":null,"telegram":"@client"}');
  PERFORM pg_temp.client_assert(answer->'client'->'contact_person'='null'::jsonb AND answer->'client'->>'email'='fresh@example.invalid','null clears only requested field');
  revision := (answer->'client'->>'crm_revision')::bigint;
  answer := public.crm_save_client(gen_random_uuid(),existing_id,revision,'{"telegram":"@client"}');
  PERFORM pg_temp.client_assert(answer->'changed'='false'::jsonb AND (answer->'client'->>'crm_revision')::bigint=revision,'no-op keeps revision');
  replay := public.crm_save_client('c0c00000-0000-4000-8000-000000000101',existing_id,1,
    '{"name":"CLIENT SQL RENAMED","contact_person":"Анна","kpp":"000000001","ogrn":"0000000000001","legal_address":"Тестовый адрес","director_name":"Иванов И. И.","director_post":"Директор"}');
  PERFORM pg_temp.client_assert(replay->'replayed'='true'::jsonb AND replay->'client'->>'crm_revision'='2','successful retry returns original snapshot after later changes');

  PERFORM pg_temp.client_expect_error(format('SELECT public.crm_save_client(%L,%L,1,%L::jsonb)',gen_random_uuid(),'c0c00000-0000-4000-8000-000000000011','{"name":"Unambiguous new name"}'),'CRM_CLIENT_RENAME_AMBIGUOUS');
  PERFORM pg_temp.client_expect_error(format('SELECT public.crm_save_client(%L,%L,%s,%L::jsonb)',gen_random_uuid(),existing_id,revision,'{"name":"CLIENT SQL DUPLICATE"}'),'CRM_CLIENT_NAME_EXISTS');
  PERFORM pg_temp.client_expect_error(format('SELECT public.crm_save_client(%L,%L,%s,%L::jsonb)',gen_random_uuid(),existing_id,revision,'{"inn":"0000000002"}'),'CRM_CLIENT_INN_EXISTS');
  PERFORM pg_temp.client_expect_error(format('SELECT public.crm_save_client(%L,%L,%s,%L::jsonb)',gen_random_uuid(),existing_id,revision,'{"email":"NEW@EXAMPLE.INVALID"}'),'CRM_CLIENT_EMAIL_EXISTS');
  -- Existing variants are not silently assigned during a rename, even when the
  -- ensure_contract_client trigger considers the punctuation equivalent.
  INSERT INTO public.contracts(client_name,contract_number) VALUES('CLIENT-SQL-RENAMED','CLIENT-SQL-VARIANT');
  PERFORM pg_temp.client_expect_error(format('SELECT public.crm_save_client(%L,%L,%s,%L::jsonb)',gen_random_uuid(),existing_id,revision,'{"name":"CLIENT SQL FINAL"}'),'CRM_CLIENT_RENAME_AMBIGUOUS');
  DELETE FROM public.contracts WHERE contract_number='CLIENT-SQL-VARIANT';
  INSERT INTO public.contracts(client_name,contract_number) VALUES('CLIENT SQL ORPHAN','CLIENT-SQL-ORPHAN');
  DELETE FROM public.clients WHERE name='CLIENT SQL ORPHAN';
  PERFORM pg_temp.client_expect_error(format('SELECT public.crm_save_client(%L,%L,%s,%L::jsonb)',gen_random_uuid(),existing_id,revision,'{"name":"CLIENT SQL ORPHAN"}'),'CRM_CLIENT_NAME_HAS_CONTRACTS');
  PERFORM pg_temp.client_expect_error(format('SELECT public.crm_save_client(%L,NULL,NULL,%L::jsonb)',gen_random_uuid(),'{"name":"CLIENT SQL ORPHAN"}'),'CRM_CLIENT_NAME_HAS_CONTRACTS');
  PERFORM pg_temp.client_assert((SELECT client_name='CLIENT SQL RENAMED' FROM public.contracts WHERE id='c0c00000-0000-4000-8000-000000000020'),'failed renames leave original link intact');
  FOREACH key IN ARRAY ARRAY['frdo_password','notes','id','crm_revision','service_type','unknown'] LOOP
    bad := jsonb_build_object('name','Forbidden payload',key,'forbidden');
    PERFORM pg_temp.client_expect_error(format('SELECT public.crm_save_client(%L,NULL,NULL,%L::jsonb)',gen_random_uuid(),bad),'CRM_INVALID_CLIENT_FIELDS');
  END LOOP;
  FOREACH bad IN ARRAY ARRAY['{}'::jsonb,'[]'::jsonb,'null'::jsonb,'{"name":null}'::jsonb,'{"name":" "}'::jsonb,
    '{"name":"Bad field","email":"a@example.invalid,b@example.invalid"}'::jsonb,
    '{"name":"Bad field","inn":"123"}'::jsonb,'{"name":"Bad field","kpp":"123"}'::jsonb,
    '{"name":"Bad field","ogrn":"123"}'::jsonb,'{"name":"Bad field","phone":5}'::jsonb,
    '{"name":"Bad field","contact_person":""}'::jsonb] LOOP
    PERFORM pg_temp.client_expect_error(format('SELECT public.crm_save_client(%L,NULL,NULL,%L::jsonb)',gen_random_uuid(),bad),'CRM_INVALID_CLIENT_FIELDS');
  END LOOP;
  PERFORM pg_temp.client_expect_error(format('SELECT public.crm_save_client(%L,NULL,1,%L::jsonb)',gen_random_uuid(),'{"name":"Bad create revision"}'),'CRM_INVALID_CLIENT_REQUEST');
  PERFORM pg_temp.client_expect_error(format('SELECT public.crm_save_client(%L,%L,NULL,%L::jsonb)',gen_random_uuid(),existing_id,'{"name":"Missing revision"}'),'CRM_INVALID_CLIENT_REQUEST');
  PERFORM pg_temp.client_expect_error(format('SELECT public.crm_save_client(%L,%L,1,%L::jsonb)',gen_random_uuid(),gen_random_uuid(),'{"name":"Missing client"}'),'CRM_CLIENT_NOT_FOUND');
END;
$$;
SELECT pg_temp.client_expect_error($q$UPDATE public.crm_client_commands SET result='{}'$q$,'','42501');
SELECT set_config('request.jwt.claim.sub','c0c00000-0000-4000-8000-000000000002',true);
SELECT pg_temp.client_expect_error($q$SELECT public.crm_save_client(gen_random_uuid(),NULL,NULL,'{"name":"Unauthorized"}')$q$,'CRM_ADMIN_REQUIRED','42501');
SELECT pg_temp.client_assert((SELECT count(*)=0 FROM public.crm_client_commands),'non-admin cannot read audit');
SELECT pg_temp.client_assert((SELECT count(*)=0 FROM public.clients),'non-admin cannot read client cards');
RESET ROLE;
SET LOCAL ROLE anon;
SELECT pg_temp.client_expect_error($q$SELECT public.crm_save_client(gen_random_uuid(),NULL,NULL,'{"name":"Anonymous"}')$q$,'','42501');
RESET ROLE;
ROLLBACK;

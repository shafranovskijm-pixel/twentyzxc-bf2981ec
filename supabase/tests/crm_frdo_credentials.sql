-- Synthetic, local transaction only. No production data or external authentication.
BEGIN;
CREATE FUNCTION pg_temp.frdo_assert(ok boolean, description text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF ok IS DISTINCT FROM true THEN RAISE EXCEPTION 'FRDO ASSERTION FAILED: %', description; END IF;
END;
$$;
CREATE FUNCTION pg_temp.frdo_expect_error(statement text, expected text, expected_state text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE actual text; state text;
BEGIN
  BEGIN EXECUTE statement;
  EXCEPTION WHEN OTHERS THEN GET STACKED DIAGNOSTICS actual = MESSAGE_TEXT, state = RETURNED_SQLSTATE; END;
  IF actual IS NULL OR strpos(actual, expected) = 0
    OR (expected_state IS NOT NULL AND state <> expected_state)
    OR (expected LIKE 'CRM_%' AND actual <> expected)
    OR actual LIKE '%zzTEST_CREDENTIAL%' THEN
    RAISE EXCEPTION 'FRDO EXPECTED SAFE ERROR % (%), GOT % (%)', expected, expected_state, actual, state;
  END IF;
END;
$$;
INSERT INTO auth.users(id,email) VALUES
 ('f1d00000-0000-4000-8000-000000000001','frdo-admin@example.invalid'),
 ('f1d00000-0000-4000-8000-000000000002','frdo-user@example.invalid'),
 ('f1d00000-0000-4000-8000-000000000003','frdo-admin-two@example.invalid');
INSERT INTO public.user_roles(user_id,role) VALUES
 ('f1d00000-0000-4000-8000-000000000001','admin'),
 ('f1d00000-0000-4000-8000-000000000003','admin');
INSERT INTO public.clients(id,name,inn,email,notes,frdo_login,frdo_password,frdo_password_po) VALUES
 ('f1d00000-0000-4000-8000-000000000010','FRDO SQL ONE',' 0000000001 ',
  'frdo-card@example.invalid','private-fixture-note','  zzTEST_CREDENTIAL_login  ','  zzTEST_CREDENTIAL_DPO  ','zzTEST_CREDENTIAL_PO'),
 ('f1d00000-0000-4000-8000-000000000011','FRDO SQL NO INN',NULL,NULL,NULL,NULL,NULL,NULL),
 ('f1d00000-0000-4000-8000-000000000012','FRDO SQL BAD INN','invalid-inn',NULL,NULL,NULL,NULL,NULL),
 ('f1d00000-0000-4000-8000-000000000013','FRDO SQL EMPTY INN','  ',NULL,NULL,NULL,NULL,NULL);

SELECT pg_temp.frdo_assert(NOT has_table_privilege('authenticated','public.crm_frdo_access_commands','SELECT'),'audit not readable by an authenticated caller');
SELECT pg_temp.frdo_assert(NOT has_table_privilege('service_role','public.crm_frdo_access_commands','SELECT'),'audit not readable by service_role');
SELECT pg_temp.frdo_assert(NOT has_function_privilege('authenticated','public.crm_frdo_command_fingerprint(jsonb,text)','EXECUTE'),'fingerprint helper is private');
SELECT pg_temp.frdo_assert(NOT has_function_privilege('anon','public.crm_get_frdo_access_status(uuid)','EXECUTE'),'anon has no status execute');
SELECT pg_temp.frdo_assert(NOT has_function_privilege('service_role','public.crm_save_frdo_access(uuid,uuid,bigint,text,jsonb)','EXECUTE'),'service_role is not an alternate entry point');

SET LOCAL ROLE anon;
SELECT pg_temp.frdo_expect_error(
  'SELECT public.crm_get_frdo_access_status(''f1d00000-0000-4000-8000-000000000010'')',
  'permission denied','42501');
RESET ROLE;
SELECT set_config('request.jwt.claim.sub','',true);
SET LOCAL ROLE authenticated;
SELECT pg_temp.frdo_expect_error(
  'SELECT public.crm_get_frdo_access_status(''f1d00000-0000-4000-8000-000000000010'')',
  'CRM_ADMIN_REQUIRED','42501');
RESET ROLE;
SELECT set_config('request.jwt.claim.sub','f1d00000-0000-4000-8000-000000000002',true);
SET LOCAL ROLE authenticated;
SELECT pg_temp.frdo_expect_error(
  'SELECT public.crm_get_frdo_access_status(''f1d00000-0000-4000-8000-000000000010'')',
  'CRM_ADMIN_REQUIRED','42501');
SELECT pg_temp.frdo_expect_error(
  'SELECT public.crm_compare_frdo_access(''f1d00000-0000-4000-8000-000000000010'',''0000000001'',''{"login":"zzTEST_CREDENTIAL_no-role"}'')',
  'CRM_ADMIN_REQUIRED','42501');
SELECT pg_temp.frdo_expect_error(
  'SELECT public.crm_save_frdo_access(gen_random_uuid(),''f1d00000-0000-4000-8000-000000000010'',1,''0000000001'',''{"login":"zzTEST_CREDENTIAL_no-role"}'')',
  'CRM_ADMIN_REQUIRED','42501');
RESET ROLE;
SELECT set_config('request.jwt.claim.sub','f1d00000-0000-4000-8000-000000000001',true);
SET LOCAL ROLE authenticated;

DO $$
DECLARE card uuid := 'f1d00000-0000-4000-8000-000000000010';
  no_inn uuid := 'f1d00000-0000-4000-8000-000000000011';
  empty_inn uuid := 'f1d00000-0000-4000-8000-000000000013';
  request uuid := 'f1d00000-0000-4000-8000-000000000100';
  answer jsonb; replay jsonb; revision bigint; original_revision bigint; bad jsonb;
  changes jsonb := '{"login":"  zzTEST_CREDENTIAL_Логин  ","passwordDpo":"  zzTEST_CREDENTIAL_ПарОль🔐漢字  "}'::jsonb;
  long_value text := 'zzTEST_CREDENTIAL_' || repeat('x',4080);
BEGIN
  answer := public.crm_get_frdo_access_status(card);
  PERFORM pg_temp.frdo_assert(answer->'client'->>'id'=card::text AND answer->'client'->>'inn'='0000000001','status binds exact id and normalized INN');
  PERFORM pg_temp.frdo_assert(answer->'presence'='{"loginSet":true,"passwordDpoSet":true,"passwordPoSet":true}'::jsonb,'status exposes presence only');
  PERFORM pg_temp.frdo_assert(answer->>'status'='read' AND answer->>'saved'='false' AND answer->>'sent'='false','read does not claim a save or send');
  PERFORM pg_temp.frdo_assert(answer::text NOT LIKE '%zzTEST_CREDENTIAL%' AND NOT(answer ? 'comparison'),'status contains no existing value');
  revision := (answer->'client'->>'crm_revision')::bigint;
  original_revision := revision;
  answer := public.crm_compare_frdo_access(card,'0000000001',
    '{"login":"  zzTEST_CREDENTIAL_login  ","passwordDpo":"zzTEST_CREDENTIAL_DPO"}');
  PERFORM pg_temp.frdo_assert(answer->'comparison'='{"login":"match","passwordDpo":"different"}'::jsonb,'literal whitespace is significant and only supplied fields are compared');
  PERFORM pg_temp.frdo_assert((answer->'client'->>'crm_revision')::bigint=revision,'comparison does not update the card');
  PERFORM pg_temp.frdo_expect_error(format('SELECT public.crm_compare_frdo_access(%L,NULL,%L::jsonb)',card,'{"login":"x"}'),'CRM_FRDO_IDENTITY_MISMATCH');
  PERFORM pg_temp.frdo_expect_error(format('SELECT public.crm_compare_frdo_access(%L,%L,%L::jsonb)',no_inn,'0000000001','{"login":"x"}'),'CRM_FRDO_IDENTITY_MISMATCH');
  PERFORM pg_temp.frdo_expect_error(format('SELECT public.crm_compare_frdo_access(%L,%L,%L::jsonb)',card,'123','{"login":"x"}'),'CRM_INVALID_FRDO_REQUEST');
  PERFORM pg_temp.frdo_expect_error('SELECT public.crm_get_frdo_access_status(''f1d00000-0000-4000-8000-000000000012'')','CRM_FRDO_IDENTITY_MISMATCH');
  PERFORM pg_temp.frdo_expect_error('SELECT public.crm_get_frdo_access_status(NULL)','CRM_INVALID_FRDO_REQUEST');
  PERFORM pg_temp.frdo_expect_error('SELECT public.crm_get_frdo_access_status(''f1d00000-0000-4000-8000-999999999999'')','CRM_CLIENT_NOT_FOUND');

  FOR bad IN SELECT value FROM jsonb_array_elements(
    '[{},[],null,{"id":"replacement"},{"passwordDpo":7},{"passwordDpo":""},{"login":"   "},{"login":true}]'::jsonb) LOOP
    PERFORM pg_temp.frdo_expect_error(format('SELECT public.crm_compare_frdo_access(%L,%L,%L::jsonb)',card,'0000000001',bad),'CRM_INVALID_FRDO_CREDENTIALS');
    PERFORM pg_temp.frdo_expect_error(format('SELECT public.crm_save_frdo_access(gen_random_uuid(),%L,%s,%L,%L::jsonb)',card,revision,'0000000001',bad),'CRM_INVALID_FRDO_CREDENTIALS');
  END LOOP;
  PERFORM pg_temp.frdo_expect_error(format('SELECT public.crm_compare_frdo_access(%L,%L,%L::jsonb)',card,'0000000001','{"passwordDpo":null}'),'CRM_INVALID_FRDO_CREDENTIALS');
  PERFORM pg_temp.frdo_expect_error(format('SELECT public.crm_save_frdo_access(gen_random_uuid(),%L,%s,%L,%L::jsonb)',card,revision,'0000000001',jsonb_build_object('login',chr(160)||chr(12288))),'CRM_INVALID_FRDO_CREDENTIALS');
  PERFORM pg_temp.frdo_expect_error(format('SELECT public.crm_save_frdo_access(gen_random_uuid(),%L,%s,%L,%L::jsonb)',card,revision,'0000000001',jsonb_build_object('passwordPo','zzTEST_CREDENTIAL_'||chr(10)||'line')),'CRM_INVALID_FRDO_CREDENTIALS');
  PERFORM pg_temp.frdo_expect_error(format('SELECT public.crm_save_frdo_access(gen_random_uuid(),%L,%s,%L,%L::jsonb)',card,revision,'0000000001',jsonb_build_object('passwordPo','zzTEST_CREDENTIAL_'||chr(128)||'control')),'CRM_INVALID_FRDO_CREDENTIALS');
  PERFORM pg_temp.frdo_expect_error(format('SELECT public.crm_save_frdo_access(gen_random_uuid(),%L,%s,%L,%L::jsonb)',card,revision,'0000000001',jsonb_build_object('login',repeat('x',501))),'CRM_INVALID_FRDO_CREDENTIALS');
  PERFORM pg_temp.frdo_expect_error(format('SELECT public.crm_save_frdo_access(gen_random_uuid(),%L,%s,%L,%L::jsonb)',card,revision,'0000000001',jsonb_build_object('passwordDpo',repeat('x',4097))),'CRM_INVALID_FRDO_CREDENTIALS');
  PERFORM pg_temp.frdo_expect_error(format('SELECT public.crm_save_frdo_access(gen_random_uuid(),%L,%s,%L,%L::jsonb)',card,revision,'0000000001',jsonb_build_object('login',repeat('🔐',251))),'CRM_INVALID_FRDO_CREDENTIALS');
  PERFORM pg_temp.frdo_expect_error(format('SELECT public.crm_save_frdo_access(gen_random_uuid(),%L,%s,%L,%L::jsonb)',card,revision,'0000000001',jsonb_build_object('passwordPo',repeat('🔐',2049))),'CRM_INVALID_FRDO_CREDENTIALS');
  PERFORM pg_temp.frdo_expect_error(format('SELECT public.crm_save_frdo_access(gen_random_uuid(),%L,0,%L,%L::jsonb)',card,'0000000001',changes),'CRM_INVALID_FRDO_REQUEST');
  PERFORM pg_temp.frdo_expect_error(format('SELECT public.crm_save_frdo_access(NULL,%L,%s,%L,%L::jsonb)',card,revision,'0000000001',changes),'CRM_INVALID_FRDO_REQUEST');
  PERFORM pg_temp.frdo_expect_error(format('SELECT public.crm_save_frdo_access(gen_random_uuid(),%L,%s,NULL,%L::jsonb)',card,revision,changes),'CRM_FRDO_IDENTITY_MISMATCH');
  PERFORM pg_temp.frdo_expect_error(format('SELECT public.crm_save_frdo_access(gen_random_uuid(),%L,%s,%L,%L::jsonb)',card,revision+1,'0000000001',changes),'CRM_CLIENT_REVISION_CONFLICT','40001');

  answer := public.crm_save_frdo_access(request,card,revision,'0000000001',changes);
  PERFORM pg_temp.frdo_assert(answer->>'saved'='true' AND answer->>'sent'='false' AND answer->>'replayed'='false','save receipt is explicit and does not claim an external action');
  PERFORM pg_temp.frdo_assert(answer->'changedFields'='["login","passwordDpo"]'::jsonb,'only changed supplied fields are recorded');
  PERFORM pg_temp.frdo_assert((answer->'client'->>'crm_revision')::bigint=revision+1,'real revision trigger increments once');
  PERFORM pg_temp.frdo_assert(answer::text NOT LIKE '%zzTEST_CREDENTIAL%','save receipt never returns supplied credentials');
  PERFORM pg_temp.frdo_assert((SELECT frdo_login=changes->>'login' AND frdo_password=changes->>'passwordDpo'
    AND frdo_password_po='zzTEST_CREDENTIAL_PO' AND email='frdo-card@example.invalid' AND notes='private-fixture-note'
    FROM public.clients WHERE id=card),'literal Unicode/spaces preserved, omitted PO and unrelated fields untouched');
  replay := public.crm_save_frdo_access(request,card,revision,'0000000001',
    jsonb_build_object('passwordDpo',changes->>'passwordDpo','login',changes->>'login'));
  PERFORM pg_temp.frdo_assert(replay=answer||'{"replayed":true}'::jsonb,'canonical replay ignores JSON key order and returns original masked receipt');
  PERFORM pg_temp.frdo_expect_error(format('SELECT public.crm_save_frdo_access(%L,%L,%s,%L,%L::jsonb)',request,card,revision,'0000000001',changes||'{"passwordPo":null}'),'CRM_REQUEST_ID_CONFLICT','23505');
  PERFORM pg_temp.frdo_expect_error(format('SELECT public.crm_save_frdo_access(%L,%L,%s,%L,%L::jsonb)',request,card,revision,'0000000001',changes||'{"login":"zzTEST_CREDENTIAL_other"}'),'CRM_REQUEST_ID_CONFLICT','23505');
  revision := revision+1;
  answer := public.crm_compare_frdo_access(card,'0000000001',changes||'{"passwordPo":"  zzTEST_CREDENTIAL_ПарОль🔐漢字  "}'::jsonb);
  PERFORM pg_temp.frdo_assert(answer->'comparison'='{"login":"match","passwordDpo":"match","passwordPo":"different"}'::jsonb,'DPO and PO values remain separate');

  -- Same-value writes do not bump revision; salts differ even for the same command.
  answer := public.crm_save_frdo_access('f1d00000-0000-4000-8000-000000000101',card,revision,'0000000001',changes);
  PERFORM pg_temp.frdo_assert(answer->'changedFields'='[]'::jsonb AND (answer->'client'->>'crm_revision')::bigint=revision,'no-op retains revision');
  answer := public.crm_save_frdo_access('f1d00000-0000-4000-8000-000000000102',card,revision,'0000000001',changes);
  PERFORM pg_temp.frdo_assert(answer->'changedFields'='[]'::jsonb,'second no-op is a separate receipt');

  answer := public.crm_save_frdo_access('f1d00000-0000-4000-8000-000000000103',card,revision,'0000000001','{"login":null}');
  revision := revision+1;
  PERFORM pg_temp.frdo_assert(answer->'changedFields'='["login"]'::jsonb AND answer->'presence'->>'loginSet'='false','explicit null clears only the supplied field');
  PERFORM pg_temp.frdo_assert((SELECT frdo_login IS NULL AND frdo_password=changes->>'passwordDpo' AND frdo_password_po='zzTEST_CREDENTIAL_PO' FROM public.clients WHERE id=card),'clear preserves other credentials');
  answer := public.crm_compare_frdo_access(card,'0000000001','{"login":"zzTEST_CREDENTIAL_absent"}');
  PERFORM pg_temp.frdo_assert(answer->'comparison'='{"login":"not_set"}'::jsonb,'missing stored value is not disclosed and has its own status');

  -- Long passwords differing after byte 72 must never collide at bcrypt input.
  long_value := left(long_value,4096);
  answer := public.crm_save_frdo_access('f1d00000-0000-4000-8000-000000000104',card,revision,'0000000001',jsonb_build_object('passwordPo',long_value));
  PERFORM pg_temp.frdo_assert((SELECT frdo_password_po=long_value FROM public.clients WHERE id=card),'long password preserved literally');
  PERFORM pg_temp.frdo_expect_error(format('SELECT public.crm_save_frdo_access(%L,%L,%s,%L,%L::jsonb)',
    'f1d00000-0000-4000-8000-000000000104',card,revision,'0000000001',jsonb_build_object('passwordPo',left(long_value,length(long_value)-1)||'Y')),'CRM_REQUEST_ID_CONFLICT','23505');
  revision := revision+1;

  answer := public.crm_save_frdo_access('f1d00000-0000-4000-8000-000000000105',no_inn,1,NULL,'{"passwordPo":" zzTEST_CREDENTIAL_null-inn "}');
  PERFORM pg_temp.frdo_assert(answer->'client'->'inn'='null'::jsonb AND answer->'presence'->>'passwordPoSet'='true','explicit null INN works only on the selected no-INN card');
  answer := public.crm_save_frdo_access('f1d00000-0000-4000-8000-000000000106',empty_inn,1,NULL,'{"login":"zzTEST_CREDENTIAL_empty-inn"}');
  PERFORM pg_temp.frdo_assert(answer->'client'->'inn'='null'::jsonb,'legacy blank INN normalizes to null, never a guessed identifier');
  -- A replay after later edits is still the original receipt, never a new write.
  replay := public.crm_save_frdo_access(request,card,original_revision,'0000000001',changes);
  PERFORM pg_temp.frdo_assert((replay->'client'->>'crm_revision')::bigint=original_revision+1
    AND (SELECT crm_revision=revision FROM public.clients WHERE id=card),'historical replay does not overwrite later edits');
END;
$$;

-- Even another administrator cannot reuse the original actor's request identity.
RESET ROLE;
SELECT set_config('request.jwt.claim.sub','f1d00000-0000-4000-8000-000000000003',true);
SET LOCAL ROLE authenticated;
SELECT pg_temp.frdo_expect_error(
 'SELECT public.crm_save_frdo_access(''f1d00000-0000-4000-8000-000000000100'',''f1d00000-0000-4000-8000-000000000010'',1,''0000000001'',''{"login":"  zzTEST_CREDENTIAL_Логин  ","passwordDpo":"  zzTEST_CREDENTIAL_ПарОль🔐漢字  "}'')',
 'CRM_REQUEST_ID_CONFLICT','23505');
SELECT pg_temp.frdo_expect_error('SELECT * FROM public.crm_frdo_access_commands','permission denied','42501');
RESET ROLE;
DO $$
DECLARE audit_text text; left_hash text; right_hash text;
BEGIN
  SELECT string_agg(row_to_json(c)::text,'') INTO audit_text FROM public.crm_frdo_access_commands c;
  PERFORM pg_temp.frdo_assert(audit_text NOT LIKE '%zzTEST_CREDENTIAL%'
    AND audit_text NOT LIKE '%private-fixture-note%','audit contains no raw credentials, command changes or unrelated private notes');
  PERFORM pg_temp.frdo_assert(NOT EXISTS(SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='crm_frdo_access_commands'
      AND column_name IN ('request','changes','credentials','previous_snapshot')),'no plaintext payload audit columns exist');
  SELECT request_fingerprint INTO left_hash FROM public.crm_frdo_access_commands WHERE request_id='f1d00000-0000-4000-8000-000000000101';
  SELECT request_fingerprint INTO right_hash FROM public.crm_frdo_access_commands WHERE request_id='f1d00000-0000-4000-8000-000000000102';
  PERFORM pg_temp.frdo_assert(length(left_hash)=60 AND left_hash<>right_hash AND left_hash LIKE '$2a$10$%','real salted bcrypt fingerprints are used');
END;
$$;
ROLLBACK;


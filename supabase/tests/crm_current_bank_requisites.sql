-- Synthetic data only; no production accounts, network or email submission.
BEGIN;
CREATE FUNCTION pg_temp.bank_assert(ok boolean, description text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN IF ok IS DISTINCT FROM true THEN RAISE EXCEPTION 'ASSERTION FAILED: %',description; END IF; END;
$$;
CREATE FUNCTION pg_temp.bank_expect_error(statement text, expected text, expected_state text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE actual text; code text;
BEGIN
  BEGIN EXECUTE statement; EXCEPTION WHEN OTHERS THEN GET STACKED DIAGNOSTICS actual=MESSAGE_TEXT,code=RETURNED_SQLSTATE; END;
  IF actual IS NULL OR (expected<>'' AND strpos(actual,expected)=0) OR (expected_state IS NOT NULL AND code<>expected_state) THEN
    RAISE EXCEPTION 'EXPECTED ERROR % (%), GOT % (%)',expected,expected_state,actual,code;
  END IF;
END;
$$;
CREATE FUNCTION pg_temp.bank_profile(account text DEFAULT '40800000000000000002')
RETURNS jsonb LANGUAGE sql AS $$
 SELECT jsonb_build_object('issuer_inn','123456789012','company_bank_account',account,
   'company_bank_bik','044000001','company_bank_corr','30100000000000000001','company_bank_name','Банк Тест');
$$;
CREATE FUNCTION pg_temp.bank_company(account text DEFAULT '40800000000000000002')
RETURNS jsonb LANGUAGE sql AS $$
 SELECT (pg_temp.bank_profile(account)-'issuer_inn') || '{"company_inn":"123456789012","company_name":"ИП Тест"}';
$$;
CREATE FUNCTION pg_temp.bank_html(account text DEFAULT '40800000000000000002')
RETURNS text LANGUAGE sql AS $$
 SELECT '<html><body>Исполнитель: ИП Тест ИНН 123456789012 р/с ' || account || ' БИК 044000001 к/с 30100000000000000001 Банк Тест</body></html>';
$$;
INSERT INTO auth.users(id,email,raw_user_meta_data) VALUES
 ('ba000000-0000-4000-8000-000000000001','bank-admin@example.invalid','{}'),
 ('ba000000-0000-4000-8000-000000000002','bank-user@example.invalid','{}');
INSERT INTO public.user_roles(user_id,role) VALUES('ba000000-0000-4000-8000-000000000001','admin');
INSERT INTO public.site_settings(key,value) VALUES
 ('company_inn','"123456789012"'),('company_bank_account','"40900000000000000001"'),
 ('company_bank_bik','"044000002"'),('company_bank_corr','"30100000000000000002"'),('company_bank_name','"Старый банк"');
INSERT INTO public.clients(id,name,email) VALUES('ba000000-0000-4000-8000-000000000010','BANK SQL CLIENT','bank-client@example.invalid');
INSERT INTO public.generated_documents(id,client_id,client_name,doc_type,doc_number,doc_date,html_content,services,metadata)
 VALUES('ba000000-0000-4000-8000-000000000020','ba000000-0000-4000-8000-000000000010','BANK SQL CLIENT','invoice','BANK-OLD','2026-10-12',
   pg_temp.bank_html('40900000000000000001'),'[]',jsonb_build_object('companySnapshot',pg_temp.bank_company('40900000000000000001')));
INSERT INTO public.generated_documents(id,client_id,client_name,doc_type,doc_number,doc_date,html_content,services,metadata)
 VALUES('ba000000-0000-4000-8000-000000000021','ba000000-0000-4000-8000-000000000010','BANK SQL CLIENT','invoice','BANK-ARCHIVE','2026-10-12',
   pg_temp.bank_html('40900000000000000001'),'[]',NULL);
-- Two old immutable deliveries already exist before activation: one prepared,
-- one previously sent. Pinning must not rewrite either row or any old document.
INSERT INTO public.crm_email_deliveries(id,actor_id,client_id,recipient,subject,body,request,documents,state,message_id)
 SELECT id,'ba000000-0000-4000-8000-000000000001','ba000000-0000-4000-8000-000000000010','bank-client@example.invalid','Old invoice','Body','{}',
   jsonb_build_array(jsonb_build_object('documentId','ba000000-0000-4000-8000-000000000020','revision',1,'html',pg_temp.bank_html('40900000000000000001'))),state,id::text||'@example.invalid'
 FROM (VALUES ('ba000000-0000-4000-8000-000000000030'::uuid,'prepared'),('ba000000-0000-4000-8000-000000000031'::uuid,'smtp_accepted')) fixture(id,state);
SELECT set_config('request.jwt.claim.sub','ba000000-0000-4000-8000-000000000001',true);
SET LOCAL ROLE authenticated;
SELECT pg_temp.bank_assert(public.crm_get_company_bank_policy() IS NULL,'migration never guesses or pins an account');
SELECT pg_temp.bank_expect_error($q$SELECT public.crm_pin_company_bank_requisites(gen_random_uuid(),NULL,pg_temp.bank_profile('480'))$q$,'CRM_INVALID_COMPANY_BANK_PROFILE');
SELECT pg_temp.bank_expect_error($q$SELECT public.crm_pin_company_bank_requisites(gen_random_uuid(),NULL,jsonb_set(pg_temp.bank_profile(),'{issuer_inn}','"999999999999"'))$q$,'CRM_COMPANY_BANK_ISSUER_MISMATCH');
SELECT pg_temp.bank_expect_error($q$SELECT public.crm_pin_company_bank_requisites(gen_random_uuid(),1,pg_temp.bank_profile())$q$,'CRM_COMPANY_BANK_REVISION_CONFLICT');
DO $$
DECLARE result jsonb; replay jsonb;
BEGIN
 result:=public.crm_pin_company_bank_requisites('ba000000-0000-4000-8000-000000000100',NULL,
   pg_temp.bank_profile() || '{"retired_accounts":["40900000000000000003"]}');
 PERFORM pg_temp.bank_assert(result->>'revision'='1' AND result->>'company_bank_account'='40800000000000000002','complete profile pinned');
 PERFORM pg_temp.bank_assert(result->'retired_accounts' @> '["40900000000000000001","40900000000000000003"]','configured old and explicit obsolete accounts retired');
 PERFORM pg_temp.bank_assert((SELECT value='"40800000000000000002"'::jsonb FROM public.site_settings WHERE key='company_bank_account'),'settings switched atomically');
 replay:=public.crm_pin_company_bank_requisites('ba000000-0000-4000-8000-000000000100',NULL,
   pg_temp.bank_profile() || '{"retired_accounts":["40900000000000000003"]}');
 PERFORM pg_temp.bank_assert(replay->>'replayed'='true' AND replay->>'revision'='1','request replay remains idempotent');
END;
$$;
SELECT pg_temp.bank_expect_error($q$SELECT public.crm_pin_company_bank_requisites('ba000000-0000-4000-8000-000000000100',NULL,pg_temp.bank_profile())$q$,'CRM_REQUEST_ID_CONFLICT');
SELECT pg_temp.bank_expect_error($q$SELECT public.crm_pin_company_bank_requisites(gen_random_uuid(),NULL,pg_temp.bank_profile())$q$,'CRM_COMPANY_BANK_REVISION_CONFLICT');
SELECT pg_temp.bank_expect_error($q$SELECT public.crm_pin_company_bank_requisites(gen_random_uuid(),1,pg_temp.bank_profile('40900000000000000001'))$q$,'CRM_COMPANY_BANK_ACCOUNT_RETIRED');
SELECT pg_temp.bank_expect_error($q$UPDATE public.site_settings SET value='"40900000000000000001"' WHERE key='company_bank_account'$q$,'CRM_COMPANY_BANK_PIN_CONFLICT');
SELECT pg_temp.bank_expect_error($q$UPDATE public.site_settings SET value='"044000002"' WHERE key='company_bank_bik'$q$,'CRM_COMPANY_BANK_PIN_CONFLICT');
SELECT pg_temp.bank_expect_error($q$UPDATE public.site_settings SET value='"999999999999"' WHERE key='company_inn'$q$,'CRM_COMPANY_BANK_PIN_CONFLICT');
SELECT pg_temp.bank_expect_error($q$UPDATE public.site_settings SET key='retired_bank_account' WHERE key='company_bank_account'$q$,'CRM_COMPANY_BANK_PIN_CONFLICT');
SELECT pg_temp.bank_expect_error($q$DELETE FROM public.site_settings WHERE key='company_bank_corr'$q$,'CRM_COMPANY_BANK_PIN_CONFLICT');
UPDATE public.site_settings SET updated_at=clock_timestamp() WHERE key='company_bank_account';
INSERT INTO public.site_settings(key,value) VALUES('unrelated_test_setting','"Allowed"');
SELECT pg_temp.bank_assert((SELECT html_content=pg_temp.bank_html('40900000000000000001') AND revision=1 FROM public.generated_documents WHERE id='ba000000-0000-4000-8000-000000000020'),'pin preserves old source and revision');
SELECT pg_temp.bank_assert((SELECT state='smtp_accepted' FROM public.crm_email_deliveries WHERE id='ba000000-0000-4000-8000-000000000031'),'pin preserves sent evidence');
SELECT pg_temp.bank_expect_error($q$SELECT public.crm_prepare_document_email(gen_random_uuid(),'ba000000-0000-4000-8000-000000000010','[{"documentId":"ba000000-0000-4000-8000-000000000021","revision":1}]',NULL,'Old archive','Body')$q$,'CRM_COMPANY_BANK_ACCOUNT_RETIRED');
SELECT pg_temp.bank_expect_error($q$UPDATE public.generated_documents SET doc_date='2026-10-13' WHERE id='ba000000-0000-4000-8000-000000000021'$q$,'CRM_COMPANY_BANK_ACCOUNT_RETIRED');
SELECT pg_temp.bank_expect_error($q$UPDATE public.generated_documents SET html_content=pg_temp.bank_html('409 00000 000000000001') WHERE id='ba000000-0000-4000-8000-000000000020'$q$,'CRM_COMPANY_BANK_ACCOUNT_RETIRED');
SELECT pg_temp.bank_expect_error($q$UPDATE public.generated_documents SET html_content=pg_temp.bank_html('40800000000000000099'),metadata=jsonb_build_object('companySnapshot',pg_temp.bank_company('40800000000000000099')) WHERE id='ba000000-0000-4000-8000-000000000020'$q$,'CRM_COMPANY_BANK_REQUISITES_NOT_CURRENT');
SELECT pg_temp.bank_expect_error($q$UPDATE public.generated_documents SET html_content=pg_temp.bank_html(),metadata=jsonb_build_object('companySnapshot',jsonb_set(pg_temp.bank_company(),'{company_bank_corr}','"30100000000000000099"')) WHERE id='ba000000-0000-4000-8000-000000000020'$q$,'CRM_COMPANY_BANK_REQUISITES_NOT_CURRENT');
-- Valid current source gains a new revision. Frozen old delivery must still fail.
UPDATE public.generated_documents SET html_content=pg_temp.bank_html(),metadata=jsonb_build_object('companySnapshot',pg_temp.bank_company()) WHERE id='ba000000-0000-4000-8000-000000000020';
SELECT pg_temp.bank_assert((SELECT revision=2 FROM public.generated_documents WHERE id='ba000000-0000-4000-8000-000000000020'),'refresh saves a new immutable version');
SELECT pg_temp.bank_expect_error($q$SELECT public.crm_prepare_document_email(gen_random_uuid(),'ba000000-0000-4000-8000-000000000010','[{"documentId":"ba000000-0000-4000-8000-000000000020","revision":1}]',NULL,'Stale','Body')$q$,'CRM_REVISION_CONFLICT');
SELECT public.crm_prepare_document_email('ba000000-0000-4000-8000-000000000032','ba000000-0000-4000-8000-000000000010','[{"documentId":"ba000000-0000-4000-8000-000000000020","revision":2}]',NULL,'Current','Body');
SELECT pg_temp.bank_expect_error($q$UPDATE public.crm_company_bank_policy SET revision=99$q$,'','42501');
RESET ROLE;
SET LOCAL ROLE service_role;
SELECT pg_temp.bank_assert(public.crm_get_company_bank_policy()->>'revision'='1','trusted email worker can read policy');
SELECT pg_temp.bank_expect_error($q$SELECT public.crm_claim_document_email('ba000000-0000-4000-8000-000000000030','ba000000-0000-4000-8000-000000000001')$q$,'CRM_COMPANY_BANK_ACCOUNT_RETIRED');
SELECT pg_temp.bank_assert((SELECT (public.crm_claim_document_email('ba000000-0000-4000-8000-000000000031','ba000000-0000-4000-8000-000000000001'))->>'claimed'='false'),'already accepted delivery remains nonretryable');
SELECT pg_temp.bank_expect_error($q$SELECT public.crm_assert_current_bank_document(pg_temp.bank_html('40900<span>000</span>000000000001'),NULL)$q$,'CRM_COMPANY_BANK_ACCOUNT_RETIRED');
SELECT pg_temp.bank_expect_error($q$SELECT public.crm_assert_current_bank_document(pg_temp.bank_html() || '<p>Оплатить: &#52;0900000000000000001</p>',pg_temp.bank_company())$q$,'CRM_COMPANY_BANK_ACCOUNT_RETIRED');
SELECT pg_temp.bank_expect_error($q$SELECT public.crm_assert_current_bank_document(pg_temp.bank_html() || '<p>Оплатить: &#x34;0900000000000000001</p>',pg_temp.bank_company())$q$,'CRM_COMPANY_BANK_ACCOUNT_RETIRED');
SELECT pg_temp.bank_expect_error($q$SELECT public.crm_assert_current_bank_document(pg_temp.bank_html('&#0000052;0900000000000000001'),NULL)$q$,'CRM_COMPANY_BANK_ACCOUNT_RETIRED');
SELECT pg_temp.bank_assert(public.crm_bank_html_text('<p>&#0; &#xD800; &#x110000; &#99999999999999999999999;</p>') = ' ' || chr(65533) || ' ' || chr(65533) || ' ' || chr(65533) || ' ' || chr(65533) || ' ', 'invalid Unicode references are rendered as replacement characters without aborting');
SELECT pg_temp.bank_assert(public.crm_bank_html_text('<p>&amp;#52;</p>') = ' &#52; ', 'escaped entity remains literal visible text');
SELECT pg_temp.bank_expect_error($q$SELECT public.crm_assert_current_bank_document('<p>Получатель: ООО Иной ИНН 9876543210</p>' || pg_temp.bank_html('40900000000000000001'),pg_temp.bank_company('40900000000000000001'))$q$,'CRM_COMPANY_BANK_ACCOUNT_RETIRED');
SELECT pg_temp.bank_expect_error($q$SELECT public.crm_assert_current_bank_document('<p>Получатель: ООО Иной ИНН 9876543210</p>' || pg_temp.bank_html('40900000000000000001'),NULL)$q$,'CRM_COMPANY_BANK_ACCOUNT_RETIRED');
SELECT pg_temp.bank_expect_error($q$SELECT public.crm_assert_current_bank_document('<p>Получатель: ООО Иной ИНН 9876543210</p>' || pg_temp.bank_html('40800000000000000099'),pg_temp.bank_company('40800000000000000099'))$q$,'CRM_COMPANY_BANK_REQUISITES_NOT_CURRENT');
SELECT pg_temp.bank_expect_error($q$SELECT public.crm_assert_current_bank_document('<p>Получатель: ООО Иной ИНН 9876543210</p>' || pg_temp.bank_html('40800000000000000099'),NULL)$q$,'CRM_COMPANY_BANK_REQUISITES_NOT_CURRENT');
SELECT public.crm_assert_current_bank_document('<p>Получатель: ООО Иной ИНН 9876543210</p>' || pg_temp.bank_html(),pg_temp.bank_company());
SELECT pg_temp.bank_expect_error($q$SELECT public.crm_assert_current_bank_document('<p>ИНН 123456789012</p><script>'||pg_temp.bank_html()||'</script>',pg_temp.bank_company())$q$,'CRM_COMPANY_BANK_REQUISITES_NOT_CURRENT');
SELECT public.crm_assert_current_bank_document(pg_temp.bank_html(),jsonb_set(pg_temp.bank_company(),'{company_bank_name}','"  БАНК   ТЕСТ "'));
SELECT public.crm_assert_current_bank_document('<p>АНО Институт развития ИНН 3900024056 ВТБ р/с 40703810226435000001</p>',
  '{"company_inn":"3900024056","company_bank_account":"40703810226435000001"}');
SELECT public.crm_assert_current_bank_document('<p>Исполнитель: АНО Институт развития ИНН / КПП 3900024056 / 390001001 ВТБ р/с 40703810226435000001</p><p>Заказчик: ИП Тест ИНН 123456789012</p>',NULL);
SELECT pg_temp.bank_expect_error($q$SELECT public.crm_assert_current_bank_document(pg_temp.bank_html(),'{"company_inn":"3900024056"}')$q$,'CRM_COMPANY_BANK_REQUISITES_NOT_CURRENT');
RESET ROLE;
-- Owner simulates a finalized PDF; no binary artifact/SMTP is involved.
UPDATE public.crm_email_deliveries SET state='prepared' WHERE id='ba000000-0000-4000-8000-000000000032';
SET LOCAL ROLE service_role;
SELECT pg_temp.bank_assert((SELECT public.crm_claim_document_email('ba000000-0000-4000-8000-000000000032','ba000000-0000-4000-8000-000000000001')->>'claimed'='true'),'current frozen revision passes claim');
RESET ROLE;
SELECT set_config('request.jwt.claim.sub','ba000000-0000-4000-8000-000000000001',true);
SET LOCAL ROLE authenticated;
SELECT public.crm_pin_company_bank_requisites('ba000000-0000-4000-8000-000000000101',1,pg_temp.bank_profile('40800000000000000004'));
SELECT pg_temp.bank_assert(public.crm_get_company_bank_policy()->'retired_accounts' @> '["40800000000000000002","40900000000000000001","40900000000000000003"]','later replacement retains all retired accounts');
SELECT pg_temp.bank_assert(public.crm_pin_company_bank_requisites('ba000000-0000-4000-8000-000000000100',NULL,
   pg_temp.bank_profile() || '{"retired_accounts":["40900000000000000003"]}')->>'revision'='1','replay reports historical operation without repinning old profile');
SELECT pg_temp.bank_assert(public.crm_get_company_bank_policy()->>'revision'='2','replay leaves latest policy active');
RESET ROLE;
SELECT set_config('request.jwt.claim.sub','ba000000-0000-4000-8000-000000000002',true);
SET LOCAL ROLE authenticated;
SELECT pg_temp.bank_expect_error($q$SELECT public.crm_get_company_bank_policy()$q$,'CRM_ADMIN_REQUIRED');
SELECT pg_temp.bank_expect_error($q$SELECT public.crm_pin_company_bank_requisites(gen_random_uuid(),2,pg_temp.bank_profile())$q$,'CRM_ADMIN_REQUIRED');
SELECT pg_temp.bank_assert((SELECT count(*)=0 FROM public.crm_company_bank_policy),'nonadmin RLS reveals no policy');
RESET ROLE;
ROLLBACK;

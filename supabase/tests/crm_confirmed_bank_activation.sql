-- Isolated integration fixture using the confirmed profile, never production.
-- The runner executes the actual activation migration between these sections.
BEGIN;
SELECT set_config('request.jwt.claim.sub','',true);
CREATE FUNCTION pg_temp.activation_assert(ok boolean, description text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN IF ok IS DISTINCT FROM true THEN RAISE EXCEPTION 'ASSERTION FAILED: %',description; END IF; END;
$$;
CREATE FUNCTION pg_temp.activation_expect_error(statement text, expected text)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE actual text;
BEGIN
  BEGIN EXECUTE statement; EXCEPTION WHEN OTHERS THEN GET STACKED DIAGNOSTICS actual=MESSAGE_TEXT; END;
  IF actual IS NULL OR strpos(actual,expected)=0 THEN RAISE EXCEPTION 'EXPECTED ERROR %, GOT %',expected,actual; END IF;
END;
$$;
SELECT pg_temp.activation_assert(auth.uid() IS NULL,'trusted migration has no fabricated user');
SELECT pg_temp.activation_assert((SELECT count(*)=0 FROM public.crm_company_bank_policy),'synthetic policy test rolled back before confirmed profile test');
INSERT INTO public.site_settings(key,value,updated_at) VALUES
 ('company_inn','"253615392404"','2026-10-11 00:00:00+00'),
 ('company_bank_account','"40802810200000522079"','2026-10-11 00:00:00+00'),
 ('company_bank_bik','"044525068"','2026-10-11 00:00:00+00'),
 ('company_bank_corr','"30101810645374525068"','2026-10-11 00:00:00+00'),
 ('company_bank_name','"ООО «ОЗОН Банк»"','2026-10-11 00:00:00+00');
CREATE TEMP TABLE activation_settings_before AS SELECT * FROM public.site_settings;

-- APPLY CONFIRMED MIGRATION HERE

SELECT pg_temp.activation_assert((SELECT issuer_inn='253615392404' AND company_bank_account='40802810200000522079'
 AND company_bank_bik='044525068' AND company_bank_corr='30101810645374525068' AND company_bank_name='ООО «ОЗОН Банк»'
 AND revision=1 AND retired_accounts @> ARRAY['40914810200040551529','40914810200003058331']
 AND cardinality(retired_accounts)=2 FROM public.crm_company_bank_policy WHERE singleton),'confirmed initial complete profile active');
SELECT pg_temp.activation_assert(NOT EXISTS(
 (SELECT * FROM public.site_settings EXCEPT SELECT * FROM activation_settings_before)
 UNION ALL (SELECT * FROM activation_settings_before EXCEPT SELECT * FROM public.site_settings)),'activation did not rewrite any settings or their timestamps');
SELECT pg_temp.activation_assert((SELECT count(*)=0 FROM public.crm_company_bank_pin_requests),'migration creates no invented admin operation');
SELECT pg_temp.activation_assert(obj_description('public.crm_company_bank_policy'::regclass,'pg_class') LIKE '%2026-10-12%20261012020000%', 'migration confirmation provenance retained');
SELECT public.crm_assert_current_bank_document('<p>Получатель: ИП Шафрановский Максим Михайлович ИНН 253615392404 р/с 40802810200000522079 БИК 044525068 к/с 30101810645374525068 ООО «ОЗОН Банк»</p>',NULL);
SELECT pg_temp.activation_expect_error($q$SELECT public.crm_assert_current_bank_document('<p>Получатель: ИП Шафрановский Максим Михайлович ИНН 253615392404 р/с 40914810200040551529</p>',NULL)$q$,'CRM_COMPANY_BANK_ACCOUNT_RETIRED');
SELECT pg_temp.activation_expect_error($q$SELECT public.crm_assert_current_bank_document('<p>Исполнитель: ИП Шафрановский Максим Михайлович ИНН 253615392404 р/с 40914 8102 0000 3058 331</p>',NULL)$q$,'CRM_COMPANY_BANK_ACCOUNT_RETIRED');
SELECT pg_temp.activation_expect_error($q$UPDATE public.site_settings SET value='"40914810200040551529"' WHERE key='company_bank_account'$q$,'CRM_COMPANY_BANK_PIN_CONFLICT');
ROLLBACK;

-- Owner-confirmed current payment profile, 2026-10-12:
-- issuer 253615392404; account 40802810200000522079 is current;
-- accounts 40914810200040551529 and 40914810200003058331 are retired.
-- Execute only as a trusted schema migration. No auth.uid() is impersonated and
-- no customer document, delivery or existing settings value is rewritten.
DO $$
DECLARE configured jsonb; existing public.crm_company_bank_policy%ROWTYPE;
  retired text[]:=ARRAY['40914810200040551529','40914810200003058331'];
  field text;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('crm-current-company-bank',0));
  PERFORM 1 FROM public.site_settings
    WHERE key IN ('company_inn','company_bank_account','company_bank_bik','company_bank_corr','company_bank_name')
    ORDER BY key FOR UPDATE;
  SELECT jsonb_object_agg(key,value) INTO configured FROM public.site_settings
    WHERE key IN ('company_inn','company_bank_account','company_bank_bik','company_bank_corr','company_bank_name');
  IF configured IS NULL OR NOT configured ?& ARRAY['company_inn','company_bank_account','company_bank_bik','company_bank_corr','company_bank_name'] THEN
    RAISE EXCEPTION 'CRM_CONFIRMED_BANK_SETTINGS_MISMATCH' USING ERRCODE='55000';
  END IF;
  FOREACH field IN ARRAY ARRAY['company_inn','company_bank_account','company_bank_bik','company_bank_corr','company_bank_name'] LOOP
    IF jsonb_typeof(configured->field) IS DISTINCT FROM 'string' THEN
      RAISE EXCEPTION 'CRM_CONFIRMED_BANK_SETTINGS_MISMATCH' USING ERRCODE='55000';
    END IF;
  END LOOP;
  IF configured->>'company_inn' IS DISTINCT FROM '253615392404'
    OR configured->>'company_bank_account' IS DISTINCT FROM '40802810200000522079'
    OR configured->>'company_bank_bik' IS DISTINCT FROM '044525068'
    OR configured->>'company_bank_corr' IS DISTINCT FROM '30101810645374525068'
    OR public.crm_bank_name_normalized(configured->>'company_bank_name') IS DISTINCT FROM public.crm_bank_name_normalized('ООО «ОЗОН Банк»') THEN
    RAISE EXCEPTION 'CRM_CONFIRMED_BANK_SETTINGS_MISMATCH' USING ERRCODE='55000';
  END IF;
  SELECT * INTO existing FROM public.crm_company_bank_policy WHERE singleton FOR UPDATE;
  IF FOUND THEN
    -- A compatible earlier activation is a no-op. Additional retired accounts
    -- remain retained; an incomplete or differing policy is never overwritten.
    IF existing.issuer_inn IS DISTINCT FROM '253615392404'
      OR existing.company_bank_account IS DISTINCT FROM '40802810200000522079'
      OR existing.company_bank_bik IS DISTINCT FROM '044525068'
      OR existing.company_bank_corr IS DISTINCT FROM '30101810645374525068'
      OR existing.company_bank_name IS DISTINCT FROM configured->>'company_bank_name'
      OR NOT retired <@ existing.retired_accounts THEN
      RAISE EXCEPTION 'CRM_CONFIRMED_BANK_POLICY_CONFLICT' USING ERRCODE='55000';
    END IF;
  ELSE
    INSERT INTO public.crm_company_bank_policy(singleton,issuer_inn,company_bank_account,company_bank_bik,
      company_bank_corr,company_bank_name,revision,retired_accounts)
    VALUES(true,'253615392404','40802810200000522079','044525068','30101810645374525068',
      configured->>'company_bank_name',1,retired);
  END IF;
END;
$$;
COMMENT ON TABLE public.crm_company_bank_policy IS
  'Initial profile confirmed by owner 2026-10-12, activated by migration 20261012020000_pin_confirmed_company_bank; no user identity impersonated. Later changes use audited admin CAS RPC.';

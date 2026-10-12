-- No bank profile is inferred or activated by this migration. An administrator
-- pins a complete, confirmed issuer profile through the compare-and-set RPC.
CREATE TABLE public.crm_company_bank_policy (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  issuer_inn text NOT NULL CHECK (issuer_inn ~ '^([0-9]{10}|[0-9]{12})$'),
  company_bank_account text NOT NULL CHECK (company_bank_account ~ '^[0-9]{20}$'),
  company_bank_bik text NOT NULL CHECK (company_bank_bik ~ '^[0-9]{9}$'),
  company_bank_corr text NOT NULL CHECK (company_bank_corr ~ '^[0-9]{20}$'),
  company_bank_name text NOT NULL CHECK (length(btrim(company_bank_name)) BETWEEN 1 AND 300),
  revision integer NOT NULL CHECK (revision > 0),
  retired_accounts text[] NOT NULL DEFAULT ARRAY[]::text[],
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  CHECK (NOT company_bank_account = ANY(retired_accounts))
);
CREATE TABLE public.crm_company_bank_pin_requests (
  request_id uuid PRIMARY KEY,
  actor_id uuid NOT NULL,
  request jsonb NOT NULL,
  result jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
ALTER TABLE public.crm_company_bank_policy ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_company_bank_pin_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.crm_company_bank_policy, public.crm_company_bank_pin_requests FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT ON public.crm_company_bank_policy, public.crm_company_bank_pin_requests TO authenticated;
CREATE POLICY "Admins read pinned issuer bank policy" ON public.crm_company_bank_policy
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins read bank pin requests" ON public.crm_company_bank_pin_requests
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE TRIGGER crm_bank_pin_requests_immutable BEFORE UPDATE OR DELETE ON public.crm_company_bank_pin_requests
  FOR EACH ROW EXECUTE FUNCTION public.crm_reject_revision_mutation();

CREATE FUNCTION public.crm_bank_name_normalized(p_value text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path=pg_catalog AS $$
  SELECT regexp_replace(lower(coalesce(p_value,'')), '[^[:alnum:]]', '', 'g')
$$;
CREATE FUNCTION public.crm_bank_decode_numeric_entities(p_text text)
RETURNS text LANGUAGE plpgsql IMMUTABLE SET search_path=pg_catalog AS $$
DECLARE result text:=coalesce(p_text,''); entity text[]; code text; point integer; position integer; decoded text;
BEGIN
  FOR entity IN SELECT DISTINCT match FROM regexp_matches(result,'(&#(x[0-9a-f]+|[0-9]+);)','gi') match LOOP
    code:=lower(entity[2]); point:=0;
    IF left(code,1)='x' THEN
      code:=ltrim(substr(code,2),'0');
      IF length(code)>6 THEN point:=1114112;
      ELSE
        FOR position IN 1..length(code) LOOP
          point:=point*16+strpos('0123456789abcdef',substr(code,position,1))-1;
        END LOOP;
      END IF;
    ELSE
      code:=ltrim(code,'0');
      IF length(code)>7 THEN point:=1114112;
      ELSIF code<>'' THEN point:=code::integer; END IF;
    END IF;
    -- Match browser text for invalid Unicode references without calling chr(0)
    -- or allowing a huge reference to overflow an integer and abort checking.
    decoded:=CASE WHEN point=0 OR point>1114111 OR point BETWEEN 55296 AND 57343 THEN chr(65533) ELSE chr(point) END;
    result:=replace(result,entity[1],decoded);
  END LOOP;
  RETURN result;
END;
$$;
CREATE FUNCTION public.crm_bank_html_text(p_html text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path=pg_catalog AS $$
  SELECT replace(replace(replace(replace(replace(replace(replace(
    public.crm_bank_decode_numeric_entities(regexp_replace(regexp_replace(coalesce(p_html,''), '<(script|style)\y[^>]*>.*?</\1\s*>', '', 'gi'), '<[^>]*>', ' ', 'g')),
    '&nbsp;', ' '), '&#160;', ' '), '&quot;', '"'), '&laquo;', '«'), '&raquo;', '»'), '&amp;', '&'), chr(160), ' ')
$$;
CREATE FUNCTION public.crm_bank_html_issuer_inns(p_plain text)
RETURNS text[] LANGUAGE plpgsql IMMUTABLE SET search_path=pg_catalog AS $$
DECLARE section_start integer; next_role integer; start_at integer:=1; section text; match text[];
  issuers text[]:=ARRAY[]::text[];
BEGIN
  LOOP
    section_start:=regexp_instr(p_plain,'\m(исполнитель|получатель|поставщик)[[:space:]]*:',start_at,1,1,'i');
    IF section_start=0 THEN EXIT; END IF;
    next_role:=regexp_instr(p_plain,'\m(заказчик|покупатель|исполнитель|получатель|поставщик)[[:space:]]*:',section_start,1,0,'i');
    section:=substr(p_plain,section_start,CASE WHEN next_role=0 THEN 3000 ELSE least(next_role-section_start,3000) END);
    match:=regexp_match(section,'ИНН[^0-9]{0,15}([0-9]{10,12})(?![0-9])','i');
    IF match[1] IS NOT NULL THEN issuers:=array_append(issuers,match[1]); END IF;
    start_at:=section_start;
  END LOOP;
  RETURN issuers;
END;
$$;

CREATE FUNCTION public.crm_get_company_bank_policy()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE result jsonb;
BEGIN
  IF current_setting('role',true) IS DISTINCT FROM 'service_role'
    AND coalesce(current_setting('request.jwt.claim.role',true),nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'role') IS DISTINCT FROM 'service_role'
    AND (auth.uid() IS NULL OR NOT public.has_role(auth.uid(),'admin'::public.app_role)) THEN
    RAISE EXCEPTION 'CRM_ADMIN_REQUIRED' USING ERRCODE='42501';
  END IF;
  SELECT to_jsonb(p)-'singleton' INTO result FROM public.crm_company_bank_policy p WHERE singleton;
  RETURN result;
END;
$$;

CREATE FUNCTION public.crm_guard_pinned_company_setting()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE policy public.crm_company_bank_policy%ROWTYPE; field text; expected text;
BEGIN
  field := CASE WHEN TG_OP='DELETE' THEN OLD.key ELSE NEW.key END;
  IF field NOT IN ('company_inn','company_bank_account','company_bank_bik','company_bank_corr','company_bank_name')
    AND (TG_OP <> 'UPDATE' OR OLD.key NOT IN ('company_inn','company_bank_account','company_bank_bik','company_bank_corr','company_bank_name')) THEN
    RETURN CASE WHEN TG_OP='DELETE' THEN OLD ELSE NEW END;
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('crm-current-company-bank',0));
  SELECT * INTO policy FROM public.crm_company_bank_policy WHERE singleton FOR SHARE;
  IF NOT FOUND THEN RETURN CASE WHEN TG_OP='DELETE' THEN OLD ELSE NEW END; END IF;
  IF TG_OP='DELETE' OR (TG_OP='UPDATE' AND NEW.key IS DISTINCT FROM OLD.key) THEN
    RAISE EXCEPTION 'CRM_COMPANY_BANK_PIN_CONFLICT' USING ERRCODE='55000';
  END IF;
  expected := CASE field WHEN 'company_inn' THEN policy.issuer_inn ELSE to_jsonb(policy)->>field END;
  IF jsonb_typeof(NEW.value) IS DISTINCT FROM 'string' OR NEW.value #>> '{}' IS DISTINCT FROM expected THEN
    RAISE EXCEPTION 'CRM_COMPANY_BANK_PIN_CONFLICT' USING ERRCODE='55000';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER crm_company_settings_keep_pinned_bank BEFORE INSERT OR UPDATE OR DELETE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.crm_guard_pinned_company_setting();
-- Acquire before any settings row lock, matching pin's lock order. This avoids
-- a concurrent browser edit taking a row lock while pin holds the policy lock.
CREATE FUNCTION public.crm_lock_company_settings_write()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('crm-current-company-bank',0));
  RETURN NULL;
END;
$$;
CREATE TRIGGER crm_company_settings_lock_before_write BEFORE INSERT OR UPDATE OR DELETE ON public.site_settings
  FOR EACH STATEMENT EXECUTE FUNCTION public.crm_lock_company_settings_write();

CREATE FUNCTION public.crm_pin_company_bank_requisites(p_request_id uuid, p_expected_revision integer, p_profile jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE actor uuid:=auth.uid(); existing public.crm_company_bank_policy%ROWTYPE;
  previous public.crm_company_bank_pin_requests%ROWTYPE; profile jsonb; operation jsonb;
  retired text[]:=ARRAY[]::text[]; old_account text; configured_inn text; result jsonb; field text;
BEGIN
  IF actor IS NULL OR NOT public.has_role(actor,'admin'::public.app_role) THEN
    RAISE EXCEPTION 'CRM_ADMIN_REQUIRED' USING ERRCODE='42501';
  END IF;
  IF p_request_id IS NULL OR jsonb_typeof(p_profile) IS DISTINCT FROM 'object'
    OR NOT p_profile ?& ARRAY['issuer_inn','company_bank_account','company_bank_bik','company_bank_corr','company_bank_name']
    OR p_profile - ARRAY['issuer_inn','company_bank_account','company_bank_bik','company_bank_corr','company_bank_name','retired_accounts'] <> '{}'::jsonb THEN
    RAISE EXCEPTION 'CRM_INVALID_COMPANY_BANK_PROFILE' USING ERRCODE='22023';
  END IF;
  FOREACH field IN ARRAY ARRAY['issuer_inn','company_bank_account','company_bank_bik','company_bank_corr','company_bank_name'] LOOP
    IF jsonb_typeof(p_profile->field) IS DISTINCT FROM 'string' THEN
      RAISE EXCEPTION 'CRM_INVALID_COMPANY_BANK_PROFILE' USING ERRCODE='22023';
    END IF;
  END LOOP;
  profile := p_profile-'retired_accounts';
  IF profile->>'issuer_inn' !~ '^([0-9]{10}|[0-9]{12})$'
    OR profile->>'company_bank_account' !~ '^[0-9]{20}$'
    OR profile->>'company_bank_bik' !~ '^[0-9]{9}$'
    OR profile->>'company_bank_corr' !~ '^[0-9]{20}$'
    OR length(btrim(profile->>'company_bank_name')) NOT BETWEEN 1 AND 300
    OR profile->>'company_bank_name' ~ '[[:cntrl:]]' THEN
    RAISE EXCEPTION 'CRM_INVALID_COMPANY_BANK_PROFILE' USING ERRCODE='22023';
  END IF;
  profile := jsonb_set(profile,'{company_bank_name}',to_jsonb(regexp_replace(btrim(profile->>'company_bank_name'),'[[:space:]]+',' ','g')));
  IF p_profile ? 'retired_accounts' THEN
    IF jsonb_typeof(p_profile->'retired_accounts') IS DISTINCT FROM 'array' THEN
      RAISE EXCEPTION 'CRM_INVALID_COMPANY_BANK_PROFILE' USING ERRCODE='22023';
    END IF;
    IF jsonb_array_length(p_profile->'retired_accounts') > 100 OR EXISTS (
      SELECT 1 FROM jsonb_array_elements(p_profile->'retired_accounts') value
      WHERE jsonb_typeof(value) IS DISTINCT FROM 'string' OR value #>> '{}' !~ '^[0-9]{20}$') THEN
      RAISE EXCEPTION 'CRM_INVALID_COMPANY_BANK_PROFILE' USING ERRCODE='22023';
    END IF;
    SELECT coalesce(array_agg(DISTINCT value ORDER BY value),ARRAY[]::text[]) INTO retired FROM jsonb_array_elements_text(p_profile->'retired_accounts') value;
  END IF;
  operation := jsonb_build_object('actorId',actor,'expectedRevision',p_expected_revision,'profile',profile,'retiredAccounts',to_jsonb(retired));
  PERFORM pg_advisory_xact_lock(hashtextextended('crm-current-company-bank',0));
  SELECT * INTO previous FROM public.crm_company_bank_pin_requests WHERE request_id=p_request_id;
  IF FOUND THEN
    IF previous.request IS DISTINCT FROM operation THEN RAISE EXCEPTION 'CRM_REQUEST_ID_CONFLICT' USING ERRCODE='23505'; END IF;
    RETURN previous.result || '{"replayed":true}'::jsonb;
  END IF;
  SELECT * INTO existing FROM public.crm_company_bank_policy WHERE singleton FOR UPDATE;
  IF (existing.revision IS NULL AND p_expected_revision IS NOT NULL) OR
    (existing.revision IS NOT NULL AND p_expected_revision IS DISTINCT FROM existing.revision) THEN
    RAISE EXCEPTION 'CRM_COMPANY_BANK_REVISION_CONFLICT' USING ERRCODE='40001';
  END IF;
  SELECT value #>> '{}' INTO configured_inn FROM public.site_settings WHERE key='company_inn' FOR SHARE;
  IF configured_inn IS DISTINCT FROM profile->>'issuer_inn' OR (existing.issuer_inn IS NOT NULL AND existing.issuer_inn IS DISTINCT FROM configured_inn) THEN
    RAISE EXCEPTION 'CRM_COMPANY_BANK_ISSUER_MISMATCH' USING ERRCODE='22023';
  END IF;
  SELECT value #>> '{}' INTO old_account FROM public.site_settings WHERE key='company_bank_account';
  retired := retired || coalesce(existing.retired_accounts,ARRAY[]::text[]);
  IF existing.company_bank_account IS NOT NULL AND existing.company_bank_account <> profile->>'company_bank_account' THEN retired:=array_append(retired,existing.company_bank_account); END IF;
  IF old_account ~ '^[0-9]{20}$' AND old_account <> profile->>'company_bank_account' THEN retired:=array_append(retired,old_account); END IF;
  SELECT coalesce(array_agg(DISTINCT value ORDER BY value),ARRAY[]::text[]) INTO retired FROM unnest(retired) value;
  IF profile->>'company_bank_account'=ANY(retired) THEN RAISE EXCEPTION 'CRM_COMPANY_BANK_ACCOUNT_RETIRED' USING ERRCODE='22023'; END IF;
  INSERT INTO public.crm_company_bank_policy(singleton,issuer_inn,company_bank_account,company_bank_bik,company_bank_corr,company_bank_name,revision,retired_accounts)
  VALUES(true,profile->>'issuer_inn',profile->>'company_bank_account',profile->>'company_bank_bik',profile->>'company_bank_corr',profile->>'company_bank_name',coalesce(existing.revision,0)+1,retired)
  ON CONFLICT(singleton) DO UPDATE SET issuer_inn=EXCLUDED.issuer_inn,company_bank_account=EXCLUDED.company_bank_account,
    company_bank_bik=EXCLUDED.company_bank_bik,company_bank_corr=EXCLUDED.company_bank_corr,company_bank_name=EXCLUDED.company_bank_name,
    revision=EXCLUDED.revision,retired_accounts=EXCLUDED.retired_accounts,updated_at=clock_timestamp();
  INSERT INTO public.site_settings(key,value,updated_at)
    SELECT key,value,clock_timestamp() FROM jsonb_each(profile-'issuer_inn')
    ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=EXCLUDED.updated_at;
  SELECT to_jsonb(p)-'singleton' INTO result FROM public.crm_company_bank_policy p WHERE singleton;
  INSERT INTO public.crm_company_bank_pin_requests(request_id,actor_id,request,result) VALUES(p_request_id,actor,operation,result);
  RETURN result || '{"replayed":false}'::jsonb;
END;
$$;

-- Compare actual visible source as well as structured issuer metadata. Known
-- retired accounts match even when digits are separated by spaces or tags.
CREATE FUNCTION public.crm_assert_current_bank_document(p_html text, p_company jsonb DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE policy public.crm_company_bank_policy%ROWTYPE; plain text; digits text; words text;
  own_issuer boolean; retired text; field text; snapshot_inn text; visible_issuer_inns text[];
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('crm-current-company-bank',0));
  SELECT * INTO policy FROM public.crm_company_bank_policy WHERE singleton FOR SHARE;
  IF NOT FOUND THEN RETURN; END IF;
  plain:=public.crm_bank_html_text(p_html); digits:=regexp_replace(plain,'[^0-9]','','g');
  words:=public.crm_bank_name_normalized(plain);
  snapshot_inn:=p_company->>'company_inn';
  -- A known retired account must never be hidden behind a foreign party label.
  FOREACH retired IN ARRAY policy.retired_accounts LOOP
    IF strpos(digits,retired)>0 OR p_company->>'company_bank_account'=retired THEN
      RAISE EXCEPTION 'CRM_COMPANY_BANK_ACCOUNT_RETIRED' USING ERRCODE='55000';
    END IF;
  END LOOP;
  visible_issuer_inns:=public.crm_bank_html_issuer_inns(plain);
  own_issuer:=snapshot_inn=policy.issuer_inn OR policy.issuer_inn=ANY(visible_issuer_inns);
  IF own_issuer IS DISTINCT FROM true THEN
    -- The owner can be a customer of a foreign issuer; an incidental customer
    -- INN does not replace that issuer's bank details with the owner's tuple.
    IF cardinality(visible_issuer_inns)>0 OR (snapshot_inn IS NOT NULL AND snapshot_inn<>policy.issuer_inn) THEN RETURN; END IF;
    own_issuer:=strpos(digits,policy.issuer_inn)>0;
  END IF;
  IF own_issuer IS DISTINCT FROM true THEN RETURN; END IF;
  IF snapshot_inn IS NOT NULL THEN
    IF snapshot_inn IS DISTINCT FROM policy.issuer_inn THEN
      RAISE EXCEPTION 'CRM_COMPANY_BANK_REQUISITES_NOT_CURRENT' USING ERRCODE='55000';
    END IF;
    FOREACH field IN ARRAY ARRAY['company_bank_account','company_bank_bik','company_bank_corr'] LOOP
      IF p_company->>field IS DISTINCT FROM to_jsonb(policy)->>field THEN
        RAISE EXCEPTION 'CRM_COMPANY_BANK_REQUISITES_NOT_CURRENT' USING ERRCODE='55000';
      END IF;
    END LOOP;
    IF public.crm_bank_name_normalized(p_company->>'company_bank_name') IS DISTINCT FROM public.crm_bank_name_normalized(policy.company_bank_name) THEN
      RAISE EXCEPTION 'CRM_COMPANY_BANK_REQUISITES_NOT_CURRENT' USING ERRCODE='55000';
    END IF;
  END IF;
  IF strpos(digits,policy.company_bank_account)=0 OR strpos(digits,policy.company_bank_bik)=0
    OR strpos(digits,policy.company_bank_corr)=0 OR strpos(words,public.crm_bank_name_normalized(policy.company_bank_name))=0 THEN
    RAISE EXCEPTION 'CRM_COMPANY_BANK_REQUISITES_NOT_CURRENT' USING ERRCODE='55000';
  END IF;
END;
$$;
CREATE FUNCTION public.crm_guard_document_current_bank()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
  IF NEW.doc_type IN ('contract','invoice','act') THEN
    PERFORM public.crm_assert_current_bank_document(NEW.html_content,NEW.metadata->'companySnapshot');
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER crm_documents_keep_current_bank BEFORE INSERT OR UPDATE ON public.generated_documents
  FOR EACH ROW EXECUTE FUNCTION public.crm_guard_document_current_bank();

CREATE FUNCTION public.crm_guard_delivery_current_bank()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE document jsonb; company jsonb;
BEGIN
  IF TG_OP='INSERT' OR (OLD.state='prepared' AND NEW.state='sending') THEN
    FOR document IN SELECT value FROM jsonb_array_elements(NEW.documents) LOOP
      -- Use the original immutable revision, not the mutable latest document.
      SELECT snapshot->'metadata'->'companySnapshot' INTO company FROM public.crm_document_revisions
        WHERE document_id=(document->>'documentId')::uuid AND revision=(document->>'revision')::integer;
      PERFORM public.crm_assert_current_bank_document(document->>'html',company);
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER crm_email_deliveries_keep_current_bank BEFORE INSERT OR UPDATE ON public.crm_email_deliveries
  FOR EACH ROW EXECUTE FUNCTION public.crm_guard_delivery_current_bank();

REVOKE ALL ON FUNCTION public.crm_get_company_bank_policy(),public.crm_pin_company_bank_requisites(uuid,integer,jsonb),
  public.crm_assert_current_bank_document(text,jsonb) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.crm_get_company_bank_policy(),public.crm_pin_company_bank_requisites(uuid,integer,jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.crm_get_company_bank_policy() TO service_role;
GRANT EXECUTE ON FUNCTION public.crm_assert_current_bank_document(text,jsonb) TO service_role;

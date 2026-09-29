-- Chat client commands: explicit fields, audit, idempotency, and all-writer revision checks.
ALTER TABLE public.clients ADD COLUMN crm_revision bigint NOT NULL DEFAULT 1 CHECK (crm_revision > 0);

CREATE FUNCTION public.crm_client_revision() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN NEW.crm_revision := 1;
  ELSE NEW.crm_revision := OLD.crm_revision + 1; END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.crm_client_revision() FROM PUBLIC, anon, authenticated, service_role;
CREATE TRIGGER crm_client_revision BEFORE INSERT OR UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.crm_client_revision();

CREATE TABLE public.crm_client_commands (
  request_id uuid PRIMARY KEY,
  actor_id uuid NOT NULL,
  client_id uuid NOT NULL,
  operation text NOT NULL CHECK (operation IN ('create','update')),
  request jsonb NOT NULL,
  previous_snapshot jsonb,
  result jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
ALTER TABLE public.crm_client_commands ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.crm_client_commands FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT ON public.crm_client_commands TO authenticated;
CREATE POLICY "Admins read client commands" ON public.crm_client_commands
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE FUNCTION public.crm_client_card_json(p_client public.clients)
RETURNS jsonb LANGUAGE sql IMMUTABLE SET search_path = pg_catalog AS $$
  SELECT jsonb_build_object('id',p_client.id,'name',p_client.name,'contact_person',p_client.contact_person,
    'email',p_client.email,'phone',p_client.phone,'telegram',p_client.telegram,
    'inn',p_client.inn,'kpp',p_client.kpp,'ogrn',p_client.ogrn,'legal_address',p_client.legal_address,
    'director_name',p_client.director_name,'director_post',p_client.director_post,
    'crm_revision',p_client.crm_revision,'updated_at',p_client.updated_at)
$$;
REVOKE ALL ON FUNCTION public.crm_client_card_json(public.clients) FROM PUBLIC, anon, authenticated, service_role;

CREATE FUNCTION public.crm_save_client(p_request_id uuid, p_client_id uuid, p_expected_revision bigint,
  p_changes jsonb, p_allow_shared_email boolean DEFAULT false)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE
  actor uuid := auth.uid(); target public.clients%ROWTYPE; saved public.clients%ROWTYPE;
  previous public.crm_client_commands%ROWTYPE; operation jsonb; answer jsonb;
  normalized jsonb := '{}'::jsonb; item record; text_value text; max_length integer;
  old_snapshot jsonb; next_snapshot jsonb; next_name text; next_inn text; next_email text;
  old_key text; next_key text; changed boolean; renamed integer := 0;
BEGIN
  IF actor IS NULL OR NOT public.has_role(actor, 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'CRM_ADMIN_REQUIRED' USING ERRCODE = '42501';
  END IF;
  IF p_request_id IS NULL OR p_allow_shared_email IS NULL
    OR (p_client_id IS NULL AND p_expected_revision IS NOT NULL)
    OR (p_client_id IS NOT NULL AND (p_expected_revision IS NULL OR p_expected_revision < 1)) THEN
    RAISE EXCEPTION 'CRM_INVALID_CLIENT_REQUEST' USING ERRCODE = '22023';
  END IF;
  IF jsonb_typeof(p_changes) IS DISTINCT FROM 'object' OR p_changes = '{}'::jsonb THEN
    RAISE EXCEPTION 'CRM_INVALID_CLIENT_FIELDS' USING ERRCODE = '22023';
  END IF;
  FOR item IN SELECT key, value FROM jsonb_each(p_changes) LOOP
    max_length := CASE item.key WHEN 'name' THEN 500 WHEN 'contact_person' THEN 500
      WHEN 'email' THEN 254 WHEN 'phone' THEN 100 WHEN 'telegram' THEN 200 WHEN 'inn' THEN 12
      WHEN 'kpp' THEN 9 WHEN 'ogrn' THEN 15 WHEN 'legal_address' THEN 2000
      WHEN 'director_name' THEN 500 WHEN 'director_post' THEN 250 ELSE NULL END;
    IF max_length IS NULL OR (jsonb_typeof(item.value) NOT IN ('string','null'))
      OR (item.key='name' AND item.value='null'::jsonb) THEN
      RAISE EXCEPTION 'CRM_INVALID_CLIENT_FIELDS' USING ERRCODE = '22023';
    END IF;
    text_value := btrim(item.value #>> '{}');
    IF text_value IS NOT NULL AND (length(text_value) NOT BETWEEN 1 AND max_length
      OR text_value ~ '[[:cntrl:]]'
      OR (item.key='inn' AND text_value !~ '^([0-9]{10}|[0-9]{12})$')
      OR (item.key='kpp' AND text_value !~ '^[0-9]{9}$')
      OR (item.key='ogrn' AND text_value !~ '^([0-9]{13}|[0-9]{15})$')
      OR (item.key='email' AND NOT public.crm_email_address_valid(text_value))) THEN
      RAISE EXCEPTION 'CRM_INVALID_CLIENT_FIELDS' USING ERRCODE = '22023';
    END IF;
    normalized := normalized || jsonb_build_object(item.key,text_value);
  END LOOP;
  IF p_client_id IS NULL AND nullif(normalized->>'name','') IS NULL THEN
    RAISE EXCEPTION 'CRM_INVALID_CLIENT_FIELDS' USING ERRCODE = '22023';
  END IF;
  operation := jsonb_build_object('actorId',actor,'clientId',p_client_id,'expectedRevision',p_expected_revision,
    'changes',normalized,'allowSharedEmail',p_allow_shared_email);
  PERFORM pg_advisory_xact_lock(hashtextextended('crm-client-command:' || p_request_id::text,0));
  SELECT * INTO previous FROM public.crm_client_commands WHERE request_id=p_request_id;
  IF FOUND THEN
    IF previous.request IS DISTINCT FROM operation THEN
      RAISE EXCEPTION 'CRM_REQUEST_ID_CONFLICT' USING ERRCODE = '23505';
    END IF;
    RETURN previous.result || jsonb_build_object('replayed',true);
  END IF;

  -- Brief CRM writes are serialized with direct UI writes too. Contract trigger may
  -- create a client; lock that table first, then clients, before identity checks.
  -- EXCLUSIVE also waits for earlier FOR UPDATE/SHARE readers before acquisition,
  -- so legacy email's row lock cannot deadlock while upgrading to a table write.
  LOCK TABLE public.contracts, public.clients IN EXCLUSIVE MODE;
  IF p_client_id IS NOT NULL THEN
    SELECT * INTO target FROM public.clients WHERE id=p_client_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'CRM_CLIENT_NOT_FOUND' USING ERRCODE = 'P0002'; END IF;
    IF target.crm_revision IS DISTINCT FROM p_expected_revision THEN
      RAISE EXCEPTION 'CRM_CLIENT_REVISION_CONFLICT' USING ERRCODE = '40001';
    END IF;
    old_snapshot := public.crm_client_card_json(target);
  ELSE old_snapshot := '{}'::jsonb; END IF;
  next_snapshot := old_snapshot || normalized;
  next_name := next_snapshot->>'name'; next_inn := next_snapshot->>'inn'; next_email := next_snapshot->>'email';
  next_key := regexp_replace(lower(next_name),'[^a-zа-яё0-9]','','g');
  old_key := regexp_replace(lower(target.name),'[^a-zа-яё0-9]','','g');
  IF nullif(next_key,'') IS NULL THEN RAISE EXCEPTION 'CRM_INVALID_CLIENT_FIELDS' USING ERRCODE='22023'; END IF;

  IF p_client_id IS NULL OR next_name IS DISTINCT FROM target.name THEN
    IF EXISTS (SELECT 1 FROM public.clients c WHERE c.id IS DISTINCT FROM p_client_id
      AND regexp_replace(lower(c.name),'[^a-zа-яё0-9]','','g')=next_key) THEN
      RAISE EXCEPTION 'CRM_CLIENT_NAME_EXISTS' USING ERRCODE='23505';
    END IF;
    IF p_client_id IS NOT NULL AND (
      EXISTS (SELECT 1 FROM public.clients c WHERE c.id<>p_client_id
        AND regexp_replace(lower(c.name),'[^a-zа-яё0-9]','','g')=old_key)
      OR EXISTS (SELECT 1 FROM public.contracts c WHERE c.client_name<>target.name
        AND regexp_replace(lower(c.client_name),'[^a-zа-яё0-9]','','g')=old_key)
    ) THEN RAISE EXCEPTION 'CRM_CLIENT_RENAME_AMBIGUOUS' USING ERRCODE='23505'; END IF;
    IF EXISTS (SELECT 1 FROM public.contracts c
      WHERE regexp_replace(lower(c.client_name),'[^a-zа-яё0-9]','','g')=next_key
      AND (p_client_id IS NULL OR c.client_name<>target.name)) THEN
      RAISE EXCEPTION 'CRM_CLIENT_NAME_HAS_CONTRACTS' USING ERRCODE='23505';
    END IF;
  END IF;
  IF next_inn IS NOT NULL AND (p_client_id IS NULL OR next_inn IS DISTINCT FROM target.inn)
    AND EXISTS (SELECT 1 FROM public.clients c WHERE c.id IS DISTINCT FROM p_client_id AND btrim(c.inn)=next_inn) THEN
    RAISE EXCEPTION 'CRM_CLIENT_INN_EXISTS' USING ERRCODE='23505';
  END IF;
  IF next_email IS NOT NULL AND NOT p_allow_shared_email
    AND (p_client_id IS NULL OR lower(next_email) IS DISTINCT FROM lower(btrim(target.email)))
    AND EXISTS (SELECT 1 FROM public.clients c WHERE c.id IS DISTINCT FROM p_client_id AND lower(btrim(c.email))=lower(next_email)) THEN
    RAISE EXCEPTION 'CRM_CLIENT_EMAIL_EXISTS' USING ERRCODE='23505';
  END IF;

  changed := p_client_id IS NULL OR EXISTS (
    SELECT 1 FROM jsonb_each(normalized) n WHERE n.value IS DISTINCT FROM old_snapshot->n.key);
  IF p_client_id IS NULL THEN
    INSERT INTO public.clients(name,contact_person,email,phone,telegram,inn,kpp,ogrn,legal_address,director_name,director_post)
    VALUES(next_name,next_snapshot->>'contact_person',next_email,next_snapshot->>'phone',next_snapshot->>'telegram',
      next_inn,next_snapshot->>'kpp',next_snapshot->>'ogrn',next_snapshot->>'legal_address',
      next_snapshot->>'director_name',next_snapshot->>'director_post') RETURNING * INTO saved;
  ELSIF changed THEN
    UPDATE public.clients SET name=next_name,contact_person=next_snapshot->>'contact_person',email=next_email,
      phone=next_snapshot->>'phone',telegram=next_snapshot->>'telegram',inn=next_inn,kpp=next_snapshot->>'kpp',
      ogrn=next_snapshot->>'ogrn',legal_address=next_snapshot->>'legal_address',
      director_name=next_snapshot->>'director_name',director_post=next_snapshot->>'director_post'
    WHERE id=target.id RETURNING * INTO saved;
    IF saved.name IS DISTINCT FROM target.name THEN
      -- Update after the client so ensure_contract_client sees the renamed card.
      UPDATE public.contracts SET client_name=saved.name WHERE client_name=target.name;
      GET DIAGNOSTICS renamed = ROW_COUNT;
    END IF;
  ELSE saved := target; END IF;
  answer := jsonb_build_object('client',public.crm_client_card_json(saved),'status','saved','saved',true,'sent',false,
    'created',p_client_id IS NULL,'changed',changed,'renamedContracts',renamed,'historicalDocumentsChanged',false,'replayed',false);
  INSERT INTO public.crm_client_commands(request_id,actor_id,client_id,operation,request,previous_snapshot,result)
  VALUES(p_request_id,actor,saved.id,CASE WHEN p_client_id IS NULL THEN 'create' ELSE 'update' END,
    operation,CASE WHEN p_client_id IS NULL THEN NULL ELSE old_snapshot END,answer);
  RETURN answer;
END;
$$;
REVOKE ALL ON FUNCTION public.crm_save_client(uuid,uuid,bigint,jsonb,boolean) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.crm_save_client(uuid,uuid,bigint,jsonb,boolean) TO authenticated;
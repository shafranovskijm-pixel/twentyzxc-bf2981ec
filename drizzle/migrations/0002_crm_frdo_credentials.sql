-- Write-only FIS FRDO access operations. Credential values stay in the existing
-- clients columns; no credential value or plaintext command is copied to audit.
-- Hosting already supplies pgcrypto. Do not move or install extensions here.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto') THEN
    RAISE EXCEPTION 'CRM_FRDO_CRYPTO_UNAVAILABLE' USING ERRCODE = '55000';
  END IF;
END;
$$;

CREATE TABLE public.crm_frdo_access_commands (
  request_id uuid PRIMARY KEY,
  actor_id uuid NOT NULL,
  client_id uuid NOT NULL,
  expected_revision bigint NOT NULL CHECK (expected_revision > 0),
  expected_inn text,
  requested_fields text[] NOT NULL,
  changed_fields text[] NOT NULL,
  request_fingerprint text NOT NULL CHECK (length(request_fingerprint) = 60),
  result jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
ALTER TABLE public.crm_frdo_access_commands ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.crm_frdo_access_commands FROM PUBLIC, anon, authenticated, service_role;
COMMENT ON TABLE public.crm_frdo_access_commands IS
  'Private FRDO command receipts: masked metadata and salted slow command fingerprints only; never raw credentials.';

CREATE FUNCTION public.crm_frdo_client_json(p_client public.clients)
RETURNS jsonb LANGUAGE plpgsql IMMUTABLE SET search_path = pg_catalog AS $$
DECLARE normalized_inn text := nullif(btrim(p_client.inn), '');
BEGIN
  IF normalized_inn IS NOT NULL AND normalized_inn !~ '^([0-9]{10}|[0-9]{12})$' THEN
    RAISE EXCEPTION 'CRM_FRDO_IDENTITY_MISMATCH' USING ERRCODE = '22023';
  END IF;
  RETURN jsonb_build_object('id', p_client.id, 'name', p_client.name,
    'inn', normalized_inn, 'crm_revision', p_client.crm_revision);
END;
$$;

CREATE FUNCTION public.crm_frdo_presence_json(p_client public.clients)
RETURNS jsonb LANGUAGE sql IMMUTABLE SET search_path = pg_catalog AS $$
  SELECT jsonb_build_object(
    'loginSet', p_client.frdo_login IS NOT NULL AND p_client.frdo_login <> '',
    'passwordDpoSet', p_client.frdo_password IS NOT NULL AND p_client.frdo_password <> '',
    'passwordPoSet', p_client.frdo_password_po IS NOT NULL AND p_client.frdo_password_po <> '')
$$;

CREATE FUNCTION public.crm_validate_frdo_values(p_values jsonb, p_allow_null boolean)
RETURNS void LANGUAGE plpgsql IMMUTABLE SET search_path = pg_catalog AS $$
DECLARE item record; value_text text; maximum integer; input_length integer;
BEGIN
  IF p_allow_null IS NULL OR jsonb_typeof(p_values) IS DISTINCT FROM 'object' OR p_values = '{}'::jsonb THEN
    RAISE EXCEPTION 'CRM_INVALID_FRDO_CREDENTIALS' USING ERRCODE = '22023';
  END IF;
  FOR item IN SELECT key, value FROM jsonb_each(p_values) LOOP
    maximum := CASE item.key WHEN 'login' THEN 500 WHEN 'passwordDpo' THEN 4096 WHEN 'passwordPo' THEN 4096 ELSE NULL END;
    IF maximum IS NULL THEN
      RAISE EXCEPTION 'CRM_INVALID_FRDO_CREDENTIALS' USING ERRCODE = '22023';
    END IF;
    IF item.value = 'null'::jsonb THEN
      IF NOT p_allow_null THEN
        RAISE EXCEPTION 'CRM_INVALID_FRDO_CREDENTIALS' USING ERRCODE = '22023';
      END IF;
      CONTINUE;
    END IF;
    IF jsonb_typeof(item.value) IS DISTINCT FROM 'string' THEN
      RAISE EXCEPTION 'CRM_INVALID_FRDO_CREDENTIALS' USING ERRCODE = '22023';
    END IF;
    value_text := item.value #>> '{}';
    -- Match JavaScript/Zod string.length: a non-BMP character occupies two
    -- UTF-16 units. No Unicode normalization or credential trimming occurs.
    input_length := 2 * length(value_text) - length(regexp_replace(value_text, U&'[\+010000-\+10FFFF]', '', 'g'));
    -- Preserve literal spaces and Unicode, but reject empty/whitespace-only
    -- input and C0/C1 control characters. Never trim a credential.
    IF input_length NOT BETWEEN 1 AND maximum
      OR value_text ~ U&'[\0001-\001F\007F-\009F]'
      OR value_text ~ U&'^[\0009-\000D\0020\0085\00A0\1680\2000-\200A\2028\2029\202F\205F\3000\FEFF]*$' THEN
      RAISE EXCEPTION 'CRM_INVALID_FRDO_CREDENTIALS' USING ERRCODE = '22023';
    END IF;
  END LOOP;
END;
$$;

CREATE FUNCTION public.crm_assert_frdo_identity(p_client public.clients, p_expected_inn text)
RETURNS void LANGUAGE plpgsql IMMUTABLE SET search_path = pg_catalog AS $$
DECLARE normalized_inn text := nullif(btrim(p_client.inn), '');
BEGIN
  IF p_expected_inn IS NOT NULL AND p_expected_inn !~ '^([0-9]{10}|[0-9]{12})$' THEN
    RAISE EXCEPTION 'CRM_INVALID_FRDO_REQUEST' USING ERRCODE = '22023';
  END IF;
  IF (normalized_inn IS NOT NULL AND normalized_inn !~ '^([0-9]{10}|[0-9]{12})$')
    OR normalized_inn IS DISTINCT FROM p_expected_inn THEN
    RAISE EXCEPTION 'CRM_FRDO_IDENTITY_MISMATCH' USING ERRCODE = '22023';
  END IF;
END;
$$;

CREATE FUNCTION public.crm_frdo_command_fingerprint(p_command jsonb, p_existing text DEFAULT NULL)
RETURNS text LANGUAGE plpgsql VOLATILE SET search_path = pg_catalog AS $$
DECLARE crypto_schema name; fingerprint text;
BEGIN
  SELECT n.nspname INTO crypto_schema
    FROM pg_extension e JOIN pg_namespace n ON n.oid = e.extnamespace
    WHERE e.extname = 'pgcrypto';
  IF crypto_schema IS NULL THEN
    RAISE EXCEPTION 'CRM_FRDO_CRYPTO_UNAVAILABLE' USING ERRCODE = '55000';
  END IF;
  -- SHA-256 produces 64 ASCII hex bytes before bcrypt, avoiding its 72-byte
  -- truncation even when the supplied command contains long Unicode passwords.
  -- Only the trusted extension schema is interpolated; command data is bound.
  EXECUTE format(
    'SELECT %1$I.crypt(encode(%1$I.digest($1, ''sha256''), ''hex''), coalesce($2, %1$I.gen_salt(''bf'', 10)))',
    crypto_schema)
    INTO fingerprint USING p_command::text, p_existing;
  RETURN fingerprint;
END;
$$;

REVOKE ALL ON FUNCTION public.crm_frdo_client_json(public.clients) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.crm_frdo_presence_json(public.clients) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.crm_validate_frdo_values(jsonb,boolean) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.crm_assert_frdo_identity(public.clients,text) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.crm_frdo_command_fingerprint(jsonb,text) FROM PUBLIC, anon, authenticated, service_role;

CREATE FUNCTION public.crm_get_frdo_access_status(p_client_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE actor uuid := auth.uid(); target public.clients%ROWTYPE;
BEGIN
  IF actor IS NULL OR public.has_role(actor, 'admin'::public.app_role) IS NOT TRUE THEN
    RAISE EXCEPTION 'CRM_ADMIN_REQUIRED' USING ERRCODE = '42501';
  END IF;
  IF p_client_id IS NULL THEN
    RAISE EXCEPTION 'CRM_INVALID_FRDO_REQUEST' USING ERRCODE = '22023';
  END IF;
  SELECT * INTO target FROM public.clients WHERE id = p_client_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'CRM_CLIENT_NOT_FOUND' USING ERRCODE = 'P0002'; END IF;
  RETURN jsonb_build_object('client', public.crm_frdo_client_json(target),
    'presence', public.crm_frdo_presence_json(target), 'status', 'read',
    'saved', false, 'sent', false, 'replayed', false);
END;
$$;

CREATE FUNCTION public.crm_compare_frdo_access(p_client_id uuid, p_expected_inn text, p_credentials jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE actor uuid := auth.uid(); target public.clients%ROWTYPE; item record;
  stored_value text; comparison jsonb := '{}'::jsonb;
BEGIN
  IF actor IS NULL OR public.has_role(actor, 'admin'::public.app_role) IS NOT TRUE THEN
    RAISE EXCEPTION 'CRM_ADMIN_REQUIRED' USING ERRCODE = '42501';
  END IF;
  IF p_client_id IS NULL THEN
    RAISE EXCEPTION 'CRM_INVALID_FRDO_REQUEST' USING ERRCODE = '22023';
  END IF;
  PERFORM public.crm_validate_frdo_values(p_credentials, false);
  SELECT * INTO target FROM public.clients WHERE id = p_client_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'CRM_CLIENT_NOT_FOUND' USING ERRCODE = 'P0002'; END IF;
  PERFORM public.crm_assert_frdo_identity(target, p_expected_inn);
  FOR item IN SELECT key, value FROM jsonb_each(p_credentials) LOOP
    stored_value := CASE item.key WHEN 'login' THEN target.frdo_login
      WHEN 'passwordDpo' THEN target.frdo_password WHEN 'passwordPo' THEN target.frdo_password_po END;
    comparison := comparison || jsonb_build_object(item.key,
      CASE WHEN stored_value IS NULL OR stored_value = '' THEN 'not_set'
        WHEN stored_value = item.value #>> '{}' THEN 'match' ELSE 'different' END);
  END LOOP;
  RETURN jsonb_build_object('client', public.crm_frdo_client_json(target),
    'presence', public.crm_frdo_presence_json(target), 'comparison', comparison,
    'status', 'read', 'saved', false, 'sent', false, 'replayed', false);
END;
$$;

CREATE FUNCTION public.crm_save_frdo_access(p_request_id uuid, p_client_id uuid, p_expected_revision bigint,
  p_expected_inn text, p_changes jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE actor uuid := auth.uid(); target public.clients%ROWTYPE; saved_client public.clients%ROWTYPE;
  previous public.crm_frdo_access_commands%ROWTYPE; operation jsonb; answer jsonb;
  item record; old_value text; new_value text; requested text[]; changed text[] := ARRAY[]::text[];
BEGIN
  IF actor IS NULL OR public.has_role(actor, 'admin'::public.app_role) IS NOT TRUE THEN
    RAISE EXCEPTION 'CRM_ADMIN_REQUIRED' USING ERRCODE = '42501';
  END IF;
  IF p_request_id IS NULL OR p_client_id IS NULL OR p_expected_revision IS NULL OR p_expected_revision < 1
    OR (p_expected_inn IS NOT NULL AND p_expected_inn !~ '^([0-9]{10}|[0-9]{12})$') THEN
    RAISE EXCEPTION 'CRM_INVALID_FRDO_REQUEST' USING ERRCODE = '22023';
  END IF;
  PERFORM public.crm_validate_frdo_values(p_changes, true);
  SELECT array_agg(key ORDER BY key) INTO requested FROM jsonb_object_keys(p_changes) AS fields(key);
  operation := jsonb_build_object('actorId', actor, 'clientId', p_client_id,
    'expectedRevision', p_expected_revision, 'expectedInn', p_expected_inn, 'changes', p_changes);
  PERFORM pg_advisory_xact_lock(hashtextextended('crm-frdo-command:' || p_request_id::text, 0));
  SELECT * INTO previous FROM public.crm_frdo_access_commands WHERE request_id = p_request_id;
  IF FOUND THEN
    IF previous.actor_id IS DISTINCT FROM actor OR previous.client_id IS DISTINCT FROM p_client_id
      OR public.crm_frdo_command_fingerprint(operation, previous.request_fingerprint)
        IS DISTINCT FROM previous.request_fingerprint THEN
      RAISE EXCEPTION 'CRM_REQUEST_ID_CONFLICT' USING ERRCODE = '23505';
    END IF;
    -- This is the original operation's receipt, not a claim that a later edit
    -- left the credentials unchanged. Use compare for the current state.
    RETURN previous.result || jsonb_build_object('replayed', true);
  END IF;

  -- Acquire the eventual write-table lock before the row lock. The generic
  -- crm_save_client command takes EXCLUSIVE; this avoids upgrading a ROW SHARE
  -- lock behind a queued generic writer. FRDO never needs a contracts lock.
  LOCK TABLE public.clients IN ROW EXCLUSIVE MODE;
  SELECT * INTO target FROM public.clients WHERE id = p_client_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'CRM_CLIENT_NOT_FOUND' USING ERRCODE = 'P0002'; END IF;
  PERFORM public.crm_assert_frdo_identity(target, p_expected_inn);
  IF target.crm_revision IS DISTINCT FROM p_expected_revision THEN
    RAISE EXCEPTION 'CRM_CLIENT_REVISION_CONFLICT' USING ERRCODE = '40001';
  END IF;
  FOR item IN SELECT key, value FROM jsonb_each(p_changes) ORDER BY key LOOP
    old_value := CASE item.key WHEN 'login' THEN target.frdo_login
      WHEN 'passwordDpo' THEN target.frdo_password WHEN 'passwordPo' THEN target.frdo_password_po END;
    new_value := item.value #>> '{}';
    IF old_value IS DISTINCT FROM new_value THEN changed := array_append(changed, item.key); END IF;
  END LOOP;
  IF cardinality(changed) > 0 THEN
    UPDATE public.clients SET
      frdo_login = CASE WHEN p_changes ? 'login' THEN p_changes->>'login' ELSE frdo_login END,
      frdo_password = CASE WHEN p_changes ? 'passwordDpo' THEN p_changes->>'passwordDpo' ELSE frdo_password END,
      frdo_password_po = CASE WHEN p_changes ? 'passwordPo' THEN p_changes->>'passwordPo' ELSE frdo_password_po END
      WHERE id = p_client_id AND crm_revision = p_expected_revision RETURNING * INTO saved_client;
    IF NOT FOUND THEN RAISE EXCEPTION 'CRM_CLIENT_REVISION_CONFLICT' USING ERRCODE = '40001'; END IF;
  ELSE saved_client := target; END IF;
  answer := jsonb_build_object('client', public.crm_frdo_client_json(saved_client),
    'presence', public.crm_frdo_presence_json(saved_client), 'changedFields', to_jsonb(changed),
    'status', 'saved', 'saved', true, 'sent', false, 'replayed', false);
  INSERT INTO public.crm_frdo_access_commands(request_id, actor_id, client_id, expected_revision,
    expected_inn, requested_fields, changed_fields, request_fingerprint, result)
  VALUES (p_request_id, actor, p_client_id, p_expected_revision, p_expected_inn, requested, changed,
    public.crm_frdo_command_fingerprint(operation), answer);
  RETURN answer;
END;
$$;

REVOKE ALL ON FUNCTION public.crm_get_frdo_access_status(uuid) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.crm_compare_frdo_access(uuid,text,jsonb) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.crm_save_frdo_access(uuid,uuid,bigint,text,jsonb) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.crm_get_frdo_access_status(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.crm_compare_frdo_access(uuid,text,jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.crm_save_frdo_access(uuid,uuid,bigint,text,jsonb) TO authenticated;

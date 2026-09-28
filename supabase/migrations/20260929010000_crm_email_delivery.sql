-- Contact CAS/audit and document-bound email outbox. No existing rows are changed.
CREATE TABLE public.crm_client_email_changes (
  request_id uuid PRIMARY KEY,
  actor_id uuid NOT NULL,
  client_id uuid NOT NULL,
  previous_email text,
  email text NOT NULL,
  request jsonb NOT NULL,
  result jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE public.crm_email_deliveries (
  id uuid PRIMARY KEY,
  actor_id uuid NOT NULL,
  client_id uuid NOT NULL,
  recipient text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  request jsonb NOT NULL,
  documents jsonb NOT NULL CHECK (jsonb_typeof(documents) = 'array'),
  state text NOT NULL DEFAULT 'preparing' CHECK (state IN ('preparing','prepared','sending','smtp_accepted','failed','unknown')),
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(attachments) = 'array'),
  message_id text NOT NULL UNIQUE,
  receipt jsonb,
  error text,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  prepared_at timestamptz,
  sending_at timestamptz,
  finished_at timestamptz,
  interaction_id uuid
);

ALTER TABLE public.crm_client_email_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_email_deliveries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.crm_client_email_changes, public.crm_email_deliveries FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT ON public.crm_client_email_changes, public.crm_email_deliveries TO authenticated;
CREATE POLICY "Admins read client email changes" ON public.crm_client_email_changes
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins read CRM email deliveries" ON public.crm_email_deliveries
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE FUNCTION public.crm_email_address_valid(p_email text)
RETURNS boolean LANGUAGE plpgsql IMMUTABLE SET search_path = pg_catalog AS $$
DECLARE mailbox text; domain text; label text;
BEGIN
  IF p_email IS NULL OR length(p_email) NOT BETWEEN 3 AND 254 OR p_email <> btrim(p_email)
    OR p_email ~ '[[:cntrl:]]'
    OR p_email !~ '^[A-Za-z0-9.!#$%&''*+/=?^_`{|}~-]+@[A-Za-z0-9]([A-Za-z0-9.-]*[A-Za-z0-9])?$' THEN RETURN false; END IF;
  mailbox := split_part(p_email,'@',1); domain := split_part(p_email,'@',2);
  IF length(mailbox)>64 OR left(mailbox,1)='.' OR right(mailbox,1)='.' OR strpos(mailbox,'..')>0
    OR strpos(domain,'.')=0 THEN RETURN false; END IF;
  FOREACH label IN ARRAY string_to_array(domain,'.') LOOP
    IF length(label) NOT BETWEEN 1 AND 63 OR left(label,1)='-' OR right(label,1)='-' THEN RETURN false; END IF;
  END LOOP;
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.crm_email_address_valid(text) FROM PUBLIC, anon, authenticated, service_role;

CREATE FUNCTION public.crm_save_client_email(p_request_id uuid, p_client_id uuid, p_email text, p_expected_email text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE
  actor uuid := auth.uid(); target public.clients%ROWTYPE;
  previous public.crm_client_email_changes%ROWTYPE; operation jsonb; answer jsonb;
  address text := btrim(p_email);
BEGIN
  IF actor IS NULL OR NOT public.has_role(actor, 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'CRM_ADMIN_REQUIRED' USING ERRCODE = '42501';
  END IF;
  IF p_request_id IS NULL OR p_client_id IS NULL OR NOT public.crm_email_address_valid(address) THEN
    RAISE EXCEPTION 'CRM_INVALID_EMAIL' USING ERRCODE = '22023';
  END IF;
  operation := jsonb_build_object('actorId',actor,'clientId',p_client_id,
    'email',lower(address),'expectedEmail',lower(btrim(p_expected_email)));
  PERFORM pg_advisory_xact_lock(hashtextextended('crm-client-email:' || p_request_id::text, 0));
  SELECT * INTO previous FROM public.crm_client_email_changes WHERE request_id = p_request_id;
  IF FOUND THEN
    IF previous.request IS DISTINCT FROM operation THEN
      RAISE EXCEPTION 'CRM_REQUEST_ID_CONFLICT' USING ERRCODE = '23505';
    END IF;
    RETURN previous.result || jsonb_build_object('replayed',true);
  END IF;
  SELECT * INTO target FROM public.clients WHERE id = p_client_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'CRM_CLIENT_NOT_FOUND' USING ERRCODE = 'P0002'; END IF;
  IF lower(btrim(target.email)) IS DISTINCT FROM lower(btrim(p_expected_email)) THEN
    RAISE EXCEPTION 'CRM_EMAIL_CONFLICT' USING ERRCODE = '40001';
  END IF;
  IF target.email IS DISTINCT FROM address THEN
    UPDATE public.clients SET email = address WHERE id = target.id;
  END IF;
  answer := jsonb_build_object('clientId',target.id,'previousEmail',target.email,'email',address,
    'changed',target.email IS DISTINCT FROM address,'replayed',false);
  INSERT INTO public.crm_client_email_changes(request_id,actor_id,client_id,previous_email,email,request,result)
    VALUES(p_request_id,actor,target.id,target.email,address,operation,answer);
  RETURN answer;
END;
$$;

CREATE FUNCTION public.crm_prepare_document_email(p_request_id uuid, p_client_id uuid, p_documents jsonb,
  p_recipient text, p_subject text, p_body text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE
  actor uuid := auth.uid(); target public.clients%ROWTYPE;
  delivery public.crm_email_deliveries%ROWTYPE; source public.generated_documents%ROWTYPE;
  operation jsonb; item jsonb; frozen jsonb := '[]'::jsonb; seen uuid[] := ARRAY[]::uuid[];
  document_id uuid; expected_revision integer; recipient text; filename text; html_bytes bigint := 0;
BEGIN
  IF actor IS NULL OR NOT public.has_role(actor, 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'CRM_ADMIN_REQUIRED' USING ERRCODE = '42501';
  END IF;
  IF p_request_id IS NULL OR p_client_id IS NULL OR jsonb_typeof(p_documents) IS DISTINCT FROM 'array'
    OR p_subject IS NULL OR length(btrim(p_subject)) NOT BETWEEN 1 AND 200 OR p_subject ~ '[[:cntrl:]]'
    OR p_body IS NULL OR length(p_body) NOT BETWEEN 1 AND 12000 OR p_body !~ '[^[:space:]]' THEN
    RAISE EXCEPTION 'CRM_INVALID_EMAIL_REQUEST' USING ERRCODE = '22023';
  END IF;
  IF jsonb_array_length(p_documents) NOT BETWEEN 1 AND 10
    OR (p_recipient IS NOT NULL AND NOT public.crm_email_address_valid(btrim(p_recipient))) THEN
    RAISE EXCEPTION 'CRM_INVALID_EMAIL_REQUEST' USING ERRCODE = '22023';
  END IF;
  operation := jsonb_build_object('actorId',actor,'clientId',p_client_id,'documents',p_documents,
    'recipient',lower(btrim(p_recipient)),'subject',btrim(p_subject),'body',p_body);
  PERFORM pg_advisory_xact_lock(hashtextextended('crm-document-email:' || p_request_id::text, 0));
  SELECT * INTO delivery FROM public.crm_email_deliveries WHERE id = p_request_id;
  IF FOUND THEN
    IF delivery.request IS DISTINCT FROM operation THEN
      RAISE EXCEPTION 'CRM_REQUEST_ID_CONFLICT' USING ERRCODE = '23505';
    END IF;
    RETURN to_jsonb(delivery);
  END IF;
  SELECT * INTO target FROM public.clients WHERE id = p_client_id FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'CRM_CLIENT_NOT_FOUND' USING ERRCODE = 'P0002'; END IF;
  recipient := coalesce(btrim(p_recipient), btrim(target.email));
  IF NOT public.crm_email_address_valid(recipient) THEN
    RAISE EXCEPTION 'CRM_RECIPIENT_REQUIRED' USING ERRCODE = '22023';
  END IF;
  -- Stable lock order for batches; array order is retained in the frozen output.
  FOR item IN SELECT value FROM jsonb_array_elements(p_documents) ORDER BY value->>'documentId' LOOP
    IF jsonb_typeof(item) IS DISTINCT FROM 'object' THEN
      RAISE EXCEPTION 'CRM_INVALID_EMAIL_DOCUMENTS' USING ERRCODE = '22023';
    END IF;
    IF (SELECT count(*) FROM jsonb_object_keys(item)) <> 2
      OR jsonb_typeof(item->'documentId') IS DISTINCT FROM 'string'
      OR (item->>'documentId') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      OR jsonb_typeof(item->'revision') IS DISTINCT FROM 'number'
      OR (item->>'revision') !~ '^[1-9][0-9]{0,8}$' THEN
      RAISE EXCEPTION 'CRM_INVALID_EMAIL_DOCUMENTS' USING ERRCODE = '22023';
    END IF;
    document_id := (item->>'documentId')::uuid;
    expected_revision := (item->>'revision')::integer;
    IF document_id = ANY(seen) THEN RAISE EXCEPTION 'CRM_DUPLICATE_DOCUMENT' USING ERRCODE = '22023'; END IF;
    seen := array_append(seen, document_id);
    SELECT * INTO source FROM public.generated_documents WHERE id = document_id FOR SHARE;
    IF NOT FOUND THEN RAISE EXCEPTION 'CRM_DOCUMENT_NOT_FOUND' USING ERRCODE = 'P0002'; END IF;
    IF source.client_id IS DISTINCT FROM p_client_id THEN
      RAISE EXCEPTION 'CRM_DOCUMENT_CLIENT_MISMATCH' USING ERRCODE = '22023';
    END IF;
    IF source.revision <> expected_revision THEN
      RAISE EXCEPTION 'CRM_REVISION_CONFLICT' USING ERRCODE = '40001';
    END IF;
    IF source.doc_type NOT IN ('contract','invoice','act') OR coalesce(length(btrim(source.html_content)),0) = 0
      OR octet_length(source.html_content) > 2097152 THEN
      RAISE EXCEPTION 'CRM_DOCUMENT_CONTENT_REQUIRED' USING ERRCODE = '22023';
    END IF;
    html_bytes := html_bytes + octet_length(source.html_content);
    IF html_bytes > 8388608 THEN RAISE EXCEPTION 'CRM_EMAIL_SIZE_LIMIT' USING ERRCODE = '22023'; END IF;
  END LOOP;
  FOR item IN SELECT value FROM jsonb_array_elements(p_documents) LOOP
    SELECT * INTO source FROM public.generated_documents WHERE id = (item->>'documentId')::uuid;
    filename := CASE source.doc_type WHEN 'contract' THEN 'Договор' WHEN 'invoice' THEN 'Счёт' ELSE 'Акт' END
      || '_' || left(regexp_replace(source.doc_number, '[[:cntrl:]\\/:*?"<>|]', '_', 'g'),100)
      || '_' || to_char(source.doc_date,'YYYY-MM-DD') || '.pdf';
    frozen := frozen || jsonb_build_array(jsonb_build_object('documentId',source.id,'revision',source.revision,
      'clientId',source.client_id,'type',source.doc_type,'number',source.doc_number,'date',source.doc_date,
      'filename',filename,'html',source.html_content,
      'htmlSha256',encode(sha256(convert_to(source.html_content,'UTF8')),'hex')));
  END LOOP;
  INSERT INTO public.crm_email_deliveries(id,actor_id,client_id,recipient,subject,body,request,documents,message_id)
    VALUES(p_request_id,actor,p_client_id,recipient,btrim(p_subject),p_body,operation,frozen,
      '<crm-' || p_request_id::text || '@24zxc.ru>') RETURNING * INTO delivery;
  RETURN to_jsonb(delivery);
END;
$$;

CREATE FUNCTION public.crm_finalize_document_email(p_delivery_id uuid, p_actor_id uuid, p_attachments jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE delivery public.crm_email_deliveries%ROWTYPE; item jsonb; document jsonb;
  seen uuid[] := ARRAY[]::uuid[]; document_id uuid; total_bytes bigint := 0;
BEGIN
  SELECT * INTO delivery FROM public.crm_email_deliveries WHERE id = p_delivery_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'CRM_DELIVERY_NOT_FOUND' USING ERRCODE = 'P0002'; END IF;
  IF p_actor_id IS DISTINCT FROM delivery.actor_id OR NOT public.has_role(p_actor_id,'admin'::public.app_role) THEN
    RAISE EXCEPTION 'CRM_ADMIN_REQUIRED' USING ERRCODE = '42501';
  END IF;
  IF jsonb_typeof(p_attachments) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'CRM_INVALID_ATTACHMENTS' USING ERRCODE = '22023';
  END IF;
  IF jsonb_array_length(p_attachments) <> jsonb_array_length(delivery.documents) THEN
    RAISE EXCEPTION 'CRM_INVALID_ATTACHMENTS' USING ERRCODE = '22023';
  END IF;
  FOR item IN SELECT value FROM jsonb_array_elements(p_attachments) LOOP
    IF jsonb_typeof(item) IS DISTINCT FROM 'object'
      OR jsonb_typeof(item->'documentId') IS DISTINCT FROM 'string'
      OR (item->>'documentId') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      OR jsonb_typeof(item->'sha256') IS DISTINCT FROM 'string' OR (item->>'sha256') !~ '^[0-9a-f]{64}$'
      OR jsonb_typeof(item->'size') IS DISTINCT FROM 'number' OR (item->>'size') !~ '^[1-9][0-9]{0,8}$'
      OR item->>'contentType' IS DISTINCT FROM 'application/pdf' THEN
      RAISE EXCEPTION 'CRM_INVALID_ATTACHMENTS' USING ERRCODE = '22023';
    END IF;
    document_id := (item->>'documentId')::uuid;
    IF document_id = ANY(seen) THEN RAISE EXCEPTION 'CRM_INVALID_ATTACHMENTS' USING ERRCODE = '22023'; END IF;
    seen := array_append(seen,document_id);
    SELECT value INTO document FROM jsonb_array_elements(delivery.documents) WHERE value->>'documentId' = document_id::text;
    IF NOT FOUND OR item->'revision' IS DISTINCT FROM document->'revision'
      OR item->>'filename' IS DISTINCT FROM document->>'filename'
      OR item->>'path' IS DISTINCT FROM ('crm-email/' || delivery.id::text || '/' || document_id::text
        || '-r' || (document->>'revision') || '-' || (item->>'sha256') || '.pdf') THEN
      RAISE EXCEPTION 'CRM_ATTACHMENT_SOURCE_MISMATCH' USING ERRCODE = '22023';
    END IF;
    IF (item->>'size')::bigint > 10485760 THEN RAISE EXCEPTION 'CRM_EMAIL_SIZE_LIMIT' USING ERRCODE = '22023'; END IF;
    total_bytes := total_bytes + (item->>'size')::bigint;
  END LOOP;
  IF total_bytes > 15728640 THEN RAISE EXCEPTION 'CRM_EMAIL_SIZE_LIMIT' USING ERRCODE = '22023'; END IF;
  IF delivery.state <> 'preparing' THEN
    -- Concurrent renderers can produce distinct PDF bytes for the same frozen
    -- HTML. The first finalized artifact wins; callers must use this result.
    RETURN to_jsonb(delivery);
  END IF;
  UPDATE public.crm_email_deliveries SET attachments=p_attachments,state='prepared',
    prepared_at=clock_timestamp(),updated_at=clock_timestamp() WHERE id=delivery.id RETURNING * INTO delivery;
  RETURN to_jsonb(delivery);
END;
$$;

CREATE FUNCTION public.crm_claim_document_email(p_delivery_id uuid, p_actor_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE delivery public.crm_email_deliveries%ROWTYPE; claimed boolean := false;
BEGIN
  SELECT * INTO delivery FROM public.crm_email_deliveries WHERE id=p_delivery_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'CRM_DELIVERY_NOT_FOUND' USING ERRCODE = 'P0002'; END IF;
  IF p_actor_id IS DISTINCT FROM delivery.actor_id OR NOT public.has_role(p_actor_id,'admin'::public.app_role) THEN
    RAISE EXCEPTION 'CRM_ADMIN_REQUIRED' USING ERRCODE = '42501';
  END IF;
  IF delivery.state='prepared' THEN
    UPDATE public.crm_email_deliveries SET state='sending',sending_at=clock_timestamp(),updated_at=clock_timestamp()
      WHERE id=delivery.id RETURNING * INTO delivery;
    claimed := true;
  END IF;
  RETURN jsonb_build_object('claimed',claimed,'delivery',to_jsonb(delivery));
END;
$$;

CREATE FUNCTION public.crm_finish_document_email(p_delivery_id uuid, p_actor_id uuid, p_state text,
  p_receipt jsonb, p_error text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE delivery public.crm_email_deliveries%ROWTYPE; interaction uuid;
BEGIN
  SELECT * INTO delivery FROM public.crm_email_deliveries WHERE id=p_delivery_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'CRM_DELIVERY_NOT_FOUND' USING ERRCODE = 'P0002'; END IF;
  IF p_actor_id IS DISTINCT FROM delivery.actor_id THEN
    RAISE EXCEPTION 'CRM_DELIVERY_ACTOR_MISMATCH' USING ERRCODE = '42501';
  END IF;
  IF p_state IS NULL OR p_state NOT IN ('smtp_accepted','failed','unknown')
    OR (p_receipt IS NOT NULL AND (jsonb_typeof(p_receipt) <> 'object' OR octet_length(p_receipt::text)>16000))
    OR (p_error IS NOT NULL AND length(p_error)>2000)
    OR (p_state='smtp_accepted' AND (p_receipt IS NULL
      OR jsonb_typeof(p_receipt->'smtpResponse') IS DISTINCT FROM 'string'
      OR p_receipt->>'smtpResponse' !~ '^250[ -]' OR p_error IS NOT NULL)) THEN
    RAISE EXCEPTION 'CRM_INVALID_DELIVERY_RESULT' USING ERRCODE = '22023';
  END IF;
  IF delivery.state IN ('smtp_accepted','failed','unknown') THEN
    IF delivery.state IS DISTINCT FROM p_state OR delivery.receipt IS DISTINCT FROM p_receipt OR delivery.error IS DISTINCT FROM p_error THEN
      RAISE EXCEPTION 'CRM_DELIVERY_RESULT_CONFLICT' USING ERRCODE = '40001';
    END IF;
    RETURN to_jsonb(delivery);
  END IF;
  IF delivery.state <> 'sending' THEN RAISE EXCEPTION 'CRM_DELIVERY_NOT_CLAIMED' USING ERRCODE = '55000'; END IF;
  -- SMTP acceptance is not proof of delivery to the mailbox or client reading it.
  IF p_state='smtp_accepted' AND EXISTS(SELECT 1 FROM public.clients WHERE id=delivery.client_id) THEN
    BEGIN
      INSERT INTO public.client_interactions(client_id,interaction_type,content)
        VALUES(delivery.client_id,'email','Письмо с документами принято SMTP-сервером для ' || delivery.recipient
          || E'\nТема: ' || delivery.subject || E'\nMessage-ID: ' || delivery.message_id
          || E'\nОперация: ' || delivery.id::text) RETURNING id INTO interaction;
    EXCEPTION WHEN foreign_key_violation THEN
      -- A concurrently deleted card must not erase the accepted SMTP receipt.
      interaction := NULL;
    END;
  END IF;
  UPDATE public.crm_email_deliveries SET state=p_state,receipt=p_receipt,error=p_error,
    finished_at=clock_timestamp(),updated_at=clock_timestamp(),interaction_id=interaction
    WHERE id=delivery.id RETURNING * INTO delivery;
  RETURN to_jsonb(delivery);
END;
$$;

REVOKE ALL ON FUNCTION public.crm_save_client_email(uuid,uuid,text,text) FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.crm_prepare_document_email(uuid,uuid,jsonb,text,text,text) FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.crm_finalize_document_email(uuid,uuid,jsonb) FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.crm_claim_document_email(uuid,uuid) FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.crm_finish_document_email(uuid,uuid,text,jsonb,text) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.crm_save_client_email(uuid,uuid,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.crm_prepare_document_email(uuid,uuid,jsonb,text,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.crm_finalize_document_email(uuid,uuid,jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.crm_claim_document_email(uuid,uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.crm_finish_document_email(uuid,uuid,text,jsonb,text) TO service_role;

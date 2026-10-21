-- FRDO originals outbox and explicit own-PNG PDF artifacts. No existing financial workflow is changed.
-- Registry metadata is public source material, never client credentials.
CREATE TABLE public.crm_frdo_template_catalog (
  id text NOT NULL, revision integer NOT NULL CHECK (revision > 0),
  label text NOT NULL, filename text NOT NULL, content_type text NOT NULL,
  size bigint NOT NULL CHECK (size > 0), sha256 text NOT NULL CHECK (sha256 ~ '^[0-9a-f]{64}$'),
  source_url text NOT NULL, PRIMARY KEY (id,revision)
);

CREATE TABLE public.crm_pdf_asset_catalog (
  id text PRIMARY KEY CHECK(id IN ('signature','stamp')),
  sha256 text NOT NULL CHECK(sha256 ~ '^[0-9a-f]{64}$'), size bigint NOT NULL,
  content_type text NOT NULL CHECK(content_type='image/png'), source_url text NOT NULL
);

CREATE TABLE public.crm_frdo_email_deliveries (
  id uuid PRIMARY KEY, request_id uuid NOT NULL UNIQUE CHECK(request_id=id),
  actor_id uuid NOT NULL, client_id uuid NOT NULL,
  recipient text NOT NULL, subject text NOT NULL, body text NOT NULL,
  request jsonb NOT NULL, client_snapshot jsonb NOT NULL,
  templates jsonb NOT NULL CHECK(jsonb_typeof(templates)='array'),
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb CHECK(jsonb_typeof(attachments)='array'),
  state text NOT NULL DEFAULT 'preparing' CHECK(state IN ('preparing','prepared','sending','smtp_accepted','failed','unknown')),
  message_id text NOT NULL UNIQUE, receipt jsonb, error text,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(), updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  prepared_at timestamptz, sending_at timestamptz, finished_at timestamptz, interaction_id uuid
);
CREATE INDEX crm_frdo_email_deliveries_actor ON public.crm_frdo_email_deliveries(actor_id,created_at DESC);
CREATE TABLE public.crm_signed_pdfs (
  id uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(), request_id uuid PRIMARY KEY,
  actor_id uuid NOT NULL, request jsonb NOT NULL,
  source_file_id text NOT NULL, source_sha256 text NOT NULL CHECK(source_sha256 ~ '^[0-9a-f]{64}$'),
  output_sha256 text NOT NULL CHECK(output_sha256 ~ '^[0-9a-f]{64}$'),
  output_size bigint NOT NULL CHECK(output_size BETWEEN 1 AND 10485760),
  storage_path text NOT NULL UNIQUE, file_name text NOT NULL,
  page_count integer NOT NULL CHECK(page_count BETWEEN 1 AND 500),
  placements jsonb NOT NULL, asset_hashes jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
REVOKE ALL ON public.crm_frdo_template_catalog,public.crm_pdf_asset_catalog,public.crm_frdo_email_deliveries,public.crm_signed_pdfs FROM PUBLIC,anon,authenticated,service_role;
GRANT SELECT ON public.crm_frdo_template_catalog,public.crm_pdf_asset_catalog,public.crm_frdo_email_deliveries,public.crm_signed_pdfs TO authenticated;
GRANT SELECT ON public.crm_frdo_template_catalog,public.crm_pdf_asset_catalog,public.crm_frdo_email_deliveries TO service_role;
ALTER TABLE public.crm_frdo_template_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_pdf_asset_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_frdo_email_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_signed_pdfs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read pinned FRDO templates" ON public.crm_frdo_template_catalog FOR SELECT TO authenticated
  USING(public.has_role(auth.uid(),'admin'::public.app_role) IS TRUE);
CREATE POLICY "Admins read own PDF asset pins" ON public.crm_pdf_asset_catalog FOR SELECT TO authenticated
  USING(public.has_role(auth.uid(),'admin'::public.app_role) IS TRUE);
CREATE POLICY "Actor admins read FRDO deliveries" ON public.crm_frdo_email_deliveries FOR SELECT TO authenticated
  USING(actor_id=auth.uid() AND public.has_role(auth.uid(),'admin'::public.app_role) IS TRUE);
CREATE POLICY "Actor admins read signed PDFs" ON public.crm_signed_pdfs FOR SELECT TO authenticated
  USING(actor_id=auth.uid() AND public.has_role(auth.uid(),'admin'::public.app_role) IS TRUE);

-- Private helpers are callable only by the SECURITY DEFINER entry points.
CREATE FUNCTION public.crm_frdo_require_private_storage() RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM storage.buckets WHERE id='contracts' AND public IS FALSE) THEN
    RAISE EXCEPTION 'CRM_PRIVATE_STORAGE_REQUIRED' USING ERRCODE='55000';
  END IF;
END;
$$;
-- A read-only preflight must run before a user-JWT uploader writes bytes.
-- Register checks again to catch an intervening infrastructure change.
CREATE FUNCTION public.crm_check_signed_pdf_storage() RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE actor uuid:=auth.uid();
BEGIN
  IF actor IS NULL THEN RAISE EXCEPTION 'CRM_AUTH_REQUIRED' USING ERRCODE='42501'; END IF;
  IF public.has_role(actor,'admin'::public.app_role) IS NOT TRUE THEN RAISE EXCEPTION 'CRM_FORBIDDEN' USING ERRCODE='42501'; END IF;
  PERFORM public.crm_frdo_require_private_storage();
  RETURN true;
END;
$$;
CREATE FUNCTION public.crm_frdo_require_worker(p_actor_id uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' OR p_actor_id IS NULL
    OR public.has_role(p_actor_id,'admin'::public.app_role) IS NOT TRUE THEN
    RAISE EXCEPTION 'CRM_FORBIDDEN' USING ERRCODE='42501';
  END IF;
END;
$$;

CREATE FUNCTION public.crm_prepare_frdo_email(
 p_request_id uuid,p_client_id uuid,p_expected_client_revision bigint,p_expected_inn text,
 p_templates jsonb,p_recipient text,p_subject text,p_body text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE actor uuid:=auth.uid(); target record; delivery public.crm_frdo_email_deliveries%ROWTYPE;
  source public.crm_frdo_template_catalog%ROWTYPE; item jsonb; frozen jsonb:='[]'; seen text[]:='{}';
  operation jsonb; recipient text; subject text; expected_inn text:=btrim(p_expected_inn);
BEGIN
  IF actor IS NULL THEN RAISE EXCEPTION 'CRM_AUTH_REQUIRED' USING ERRCODE='42501'; END IF;
  IF public.has_role(actor,'admin'::public.app_role) IS NOT TRUE THEN RAISE EXCEPTION 'CRM_FORBIDDEN' USING ERRCODE='42501'; END IF;
  IF p_request_id IS NULL OR p_client_id IS NULL OR p_expected_client_revision IS NULL OR p_expected_client_revision<1
    OR (expected_inn IS NOT NULL AND expected_inn !~ '^([0-9]{10}|[0-9]{12})$')
    OR (p_recipient IS NOT NULL AND NOT public.crm_email_address_valid(lower(btrim(p_recipient))))
    OR (p_subject IS NOT NULL AND (length(btrim(p_subject)) NOT BETWEEN 1 AND 500 OR p_subject ~ '[[:cntrl:]\x7f-\x9f]'))
    OR p_body IS NULL OR length(p_body) NOT BETWEEN 1 AND 12000 OR length(btrim(p_body,E' \n\r\t'))=0
    OR translate(p_body,E'\n\r\t','') ~ '[[:cntrl:]\x7f-\x9f]'
    OR jsonb_typeof(p_templates) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'CRM_INVALID_ARGUMENT' USING ERRCODE='22023';
  END IF;
  IF jsonb_array_length(p_templates) NOT BETWEEN 1 AND 8 THEN RAISE EXCEPTION 'CRM_INVALID_ARGUMENT' USING ERRCODE='22023'; END IF;
  FOR item IN SELECT value FROM jsonb_array_elements(p_templates) LOOP
    IF jsonb_typeof(item) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'CRM_INVALID_ARGUMENT' USING ERRCODE='22023'; END IF;
    IF (SELECT count(*) FROM jsonb_object_keys(item))<>3
      OR jsonb_typeof(item->'templateId') IS DISTINCT FROM 'string' OR item->>'templateId' !~ '^[a-z][a-z0-9-]{0,50}$'
      OR jsonb_typeof(item->'revision') IS DISTINCT FROM 'number' OR item->>'revision' !~ '^[1-9][0-9]{0,8}$'
      OR jsonb_typeof(item->'sha256') IS DISTINCT FROM 'string' OR item->>'sha256' !~ '^[0-9a-f]{64}$'
      OR item->>'templateId'=ANY(seen) THEN RAISE EXCEPTION 'CRM_INVALID_ARGUMENT' USING ERRCODE='22023'; END IF;
    seen:=array_append(seen,item->>'templateId');
  END LOOP;
  operation:=jsonb_build_object('clientId',p_client_id,'expectedClientRevision',p_expected_client_revision,
    'expectedInn',expected_inn,'templates',p_templates,'recipient',lower(btrim(p_recipient)),'subject',p_subject,'body',p_body);
  PERFORM pg_advisory_xact_lock(hashtextextended('crm-frdo-email:'||p_request_id::text,0));
  SELECT * INTO delivery FROM public.crm_frdo_email_deliveries WHERE request_id=p_request_id FOR UPDATE;
  IF FOUND THEN
    IF delivery.actor_id IS DISTINCT FROM actor OR delivery.request IS DISTINCT FROM operation THEN
      RAISE EXCEPTION 'CRM_REQUEST_CONFLICT' USING ERRCODE='40001';
    END IF;
    -- Only unfinished preparation can upload again. Historical terminal receipts
    -- remain readable even when storage infrastructure is unavailable later.
    IF delivery.state='preparing' THEN PERFORM public.crm_frdo_require_private_storage(); END IF;
    RETURN jsonb_build_object('delivery',to_jsonb(delivery),'replayed',true);
  END IF;
  PERFORM public.crm_frdo_require_private_storage();
  -- Explicit safe projection: credentials and arbitrary notes are never read or snapshotted.
  SELECT id,name,inn,email,crm_revision INTO target FROM public.clients WHERE id=p_client_id FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'CRM_CLIENT_NOT_FOUND' USING ERRCODE='P0002'; END IF;
  IF target.crm_revision IS DISTINCT FROM p_expected_client_revision THEN
    RAISE EXCEPTION 'CRM_CLIENT_REVISION_CONFLICT' USING ERRCODE='40001';
  END IF;
  IF nullif(btrim(target.inn),'') IS DISTINCT FROM expected_inn THEN
    RAISE EXCEPTION 'CRM_CLIENT_INN_CONFLICT' USING ERRCODE='40001';
  END IF;
  recipient:=lower(btrim(coalesce(p_recipient,target.email)));
  IF NOT public.crm_email_address_valid(recipient) THEN RAISE EXCEPTION 'CRM_INVALID_ARGUMENT' USING ERRCODE='22023'; END IF;
  subject:=coalesce(btrim(p_subject),left(CASE WHEN jsonb_array_length(p_templates)=1 AND p_templates->0->>'templateId' IN ('prikaz','prikaz-pdf')
    THEN 'Приказ ФИС ФРДО — ' ELSE 'Документы ФИС ФРДО — ' END||target.name,500));
  IF length(subject)>500 OR subject ~ '[[:cntrl:]\x7f-\x9f]' THEN RAISE EXCEPTION 'CRM_INVALID_ARGUMENT' USING ERRCODE='22023'; END IF;
  FOR item IN SELECT value FROM jsonb_array_elements(p_templates) LOOP
    SELECT * INTO source FROM public.crm_frdo_template_catalog WHERE id=item->>'templateId' AND revision=(item->>'revision')::integer;
    IF NOT FOUND THEN RAISE EXCEPTION 'CRM_TEMPLATE_NOT_FOUND' USING ERRCODE='22023'; END IF;
    IF source.sha256 IS DISTINCT FROM item->>'sha256' THEN RAISE EXCEPTION 'CRM_TEMPLATE_REVISION_CONFLICT' USING ERRCODE='40001'; END IF;
    frozen:=frozen||jsonb_build_array(jsonb_build_object('templateId',source.id,'revision',source.revision,
      'label',source.label,'filename',source.filename,'sha256',source.sha256,'size',source.size,'contentType',source.content_type,
      'ext',substring(source.filename FROM '\.([a-z0-9]+)$'),'sourceUrl',source.source_url));
  END LOOP;
  INSERT INTO public.crm_frdo_email_deliveries(id,request_id,actor_id,client_id,recipient,subject,body,request,client_snapshot,templates,message_id)
    VALUES(p_request_id,p_request_id,actor,p_client_id,recipient,subject,p_body,operation,
      jsonb_build_object('id',target.id,'name',target.name,'inn',nullif(btrim(target.inn),''),'email',target.email,'crm_revision',target.crm_revision),
      frozen,'<crm-frdo-'||p_request_id::text||'@24zxc.ru>') RETURNING * INTO delivery;
  RETURN jsonb_build_object('delivery',to_jsonb(delivery),'replayed',false);
END;
$$;

CREATE FUNCTION public.crm_finalize_frdo_email(p_delivery_id uuid,p_actor_id uuid,p_attachments jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE delivery public.crm_frdo_email_deliveries%ROWTYPE; item jsonb; template jsonb; seen text[]:='{}';
BEGIN
  PERFORM public.crm_frdo_require_worker(p_actor_id);
  PERFORM public.crm_frdo_require_private_storage();
  SELECT * INTO delivery FROM public.crm_frdo_email_deliveries WHERE id=p_delivery_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'CRM_DELIVERY_NOT_FOUND' USING ERRCODE='P0002'; END IF;
  IF delivery.actor_id IS DISTINCT FROM p_actor_id THEN RAISE EXCEPTION 'CRM_FORBIDDEN' USING ERRCODE='42501'; END IF;
  IF jsonb_typeof(p_attachments) IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'CRM_DELIVERY_ATTACHMENT_MISMATCH' USING ERRCODE='22023'; END IF;
  IF jsonb_array_length(p_attachments)<>jsonb_array_length(delivery.templates) THEN RAISE EXCEPTION 'CRM_DELIVERY_ATTACHMENT_MISMATCH' USING ERRCODE='22023'; END IF;
  FOR item IN SELECT value FROM jsonb_array_elements(p_attachments) LOOP
    IF jsonb_typeof(item) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'CRM_DELIVERY_ATTACHMENT_MISMATCH' USING ERRCODE='22023'; END IF;
    IF (SELECT count(*) FROM jsonb_object_keys(item))<>7 OR jsonb_typeof(item->'templateId') IS DISTINCT FROM 'string'
      OR item->>'templateId'=ANY(seen) THEN RAISE EXCEPTION 'CRM_DELIVERY_ATTACHMENT_MISMATCH' USING ERRCODE='22023'; END IF;
    seen:=array_append(seen,item->>'templateId');
    SELECT value INTO template FROM jsonb_array_elements(delivery.templates) WHERE value->>'templateId'=item->>'templateId';
    IF NOT FOUND OR item->'revision' IS DISTINCT FROM template->'revision' OR item->'filename' IS DISTINCT FROM template->'filename'
      OR item->'sha256' IS DISTINCT FROM template->'sha256' OR item->'size' IS DISTINCT FROM template->'size'
      OR item->'contentType' IS DISTINCT FROM template->'contentType'
      OR item->>'path' IS DISTINCT FROM ('crm-frdo-email/'||delivery.id::text||'/'||(template->>'templateId')
        ||'-r'||(template->>'revision')||'-'||(template->>'sha256')||'.'||(template->>'ext')) THEN
      RAISE EXCEPTION 'CRM_DELIVERY_ATTACHMENT_MISMATCH' USING ERRCODE='22023';
    END IF;
  END LOOP;
  IF delivery.state<>'preparing' THEN
    IF delivery.attachments IS DISTINCT FROM p_attachments THEN RAISE EXCEPTION 'CRM_DELIVERY_ATTACHMENT_MISMATCH' USING ERRCODE='40001'; END IF;
    RETURN to_jsonb(delivery);
  END IF;
  UPDATE public.crm_frdo_email_deliveries SET attachments=p_attachments,state='prepared',prepared_at=clock_timestamp(),updated_at=clock_timestamp()
    WHERE id=delivery.id RETURNING * INTO delivery;
  RETURN to_jsonb(delivery);
END;
$$;
CREATE FUNCTION public.crm_claim_frdo_email(p_delivery_id uuid,p_actor_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE delivery public.crm_frdo_email_deliveries%ROWTYPE; claimed boolean:=false;
BEGIN
  PERFORM public.crm_frdo_require_worker(p_actor_id);
  PERFORM public.crm_frdo_require_private_storage();
  SELECT * INTO delivery FROM public.crm_frdo_email_deliveries WHERE id=p_delivery_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'CRM_DELIVERY_NOT_FOUND' USING ERRCODE='P0002'; END IF;
  IF delivery.actor_id IS DISTINCT FROM p_actor_id THEN RAISE EXCEPTION 'CRM_FORBIDDEN' USING ERRCODE='42501'; END IF;
  IF delivery.state='prepared' THEN
    UPDATE public.crm_frdo_email_deliveries SET state='sending',sending_at=clock_timestamp(),updated_at=clock_timestamp()
      WHERE id=delivery.id RETURNING * INTO delivery;
    claimed:=true;
  END IF;
  RETURN jsonb_build_object('claimed',claimed,'delivery',to_jsonb(delivery));
END;
$$;
CREATE FUNCTION public.crm_finish_frdo_email(p_delivery_id uuid,p_actor_id uuid,p_state text,p_receipt text,p_error text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE delivery public.crm_frdo_email_deliveries%ROWTYPE; interaction uuid; saved_receipt jsonb;
BEGIN
  PERFORM public.crm_frdo_require_worker(p_actor_id);
  SELECT * INTO delivery FROM public.crm_frdo_email_deliveries WHERE id=p_delivery_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'CRM_DELIVERY_NOT_FOUND' USING ERRCODE='P0002'; END IF;
  IF delivery.actor_id IS DISTINCT FROM p_actor_id THEN RAISE EXCEPTION 'CRM_FORBIDDEN' USING ERRCODE='42501'; END IF;
  IF p_state IS NULL OR p_state NOT IN ('smtp_accepted','failed','unknown')
    OR (p_receipt IS NOT NULL AND (length(p_receipt)>2000 OR p_receipt !~ '^250[ -]' OR p_receipt ~ '[[:cntrl:]\x7f-\x9f]'))
    OR (p_error IS NOT NULL AND p_error NOT IN ('FRDO_TEMPLATE_FETCH_FAILED','FRDO_TEMPLATE_INTEGRITY_FAILED','FRDO_STORAGE_FAILED',
      'FRDO_SMTP_REJECTED','FRDO_SMTP_UNAVAILABLE','FRDO_SMTP_UNKNOWN','FRDO_DELIVERY_FAILED'))
    OR (p_state='smtp_accepted' AND (p_receipt IS NULL OR p_error IS NOT NULL))
    OR (p_state<>'smtp_accepted' AND (p_receipt IS NOT NULL OR p_error IS NULL)) THEN
    RAISE EXCEPTION 'CRM_INVALID_ARGUMENT' USING ERRCODE='22023';
  END IF;
  saved_receipt:=CASE WHEN p_receipt IS NULL THEN NULL ELSE jsonb_build_object('smtpResponse',p_receipt) END;
  IF delivery.state IN ('smtp_accepted','failed','unknown') THEN
    IF delivery.state IS DISTINCT FROM p_state OR delivery.receipt IS DISTINCT FROM saved_receipt OR delivery.error IS DISTINCT FROM p_error THEN
      RAISE EXCEPTION 'CRM_DELIVERY_RESULT_CONFLICT' USING ERRCODE='40001';
    END IF;
    RETURN to_jsonb(delivery);
  END IF;
  IF delivery.state<>'sending' THEN RAISE EXCEPTION 'CRM_DELIVERY_NOT_CLAIMED' USING ERRCODE='55000'; END IF;
  -- Record SMTP acceptance exactly once; this does not assert mailbox delivery or reading.
  IF p_state='smtp_accepted' AND EXISTS(SELECT 1 FROM public.clients WHERE id=delivery.client_id) THEN
    BEGIN
      INSERT INTO public.client_interactions(client_id,interaction_type,content)
        VALUES(delivery.client_id,'email','Письмо с документами ФИС ФРДО принято SMTP-сервером для '||delivery.recipient
          ||E'\nТема: '||delivery.subject||E'\nMessage-ID: '||delivery.message_id||E'\nОперация: '||delivery.id::text)
        RETURNING id INTO interaction;
    EXCEPTION WHEN foreign_key_violation THEN interaction:=NULL;
    END;
  END IF;
  UPDATE public.crm_frdo_email_deliveries SET state=p_state,receipt=saved_receipt,error=p_error,finished_at=clock_timestamp(),
    updated_at=clock_timestamp(),interaction_id=interaction WHERE id=delivery.id RETURNING * INTO delivery;
  RETURN to_jsonb(delivery);
END;
$$;

CREATE FUNCTION public.crm_register_signed_pdf(p_request_id uuid,p_request jsonb,p_artifact jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE actor uuid:=auth.uid(); artifact public.crm_signed_pdfs%ROWTYPE; item jsonb; asset text;
  used text[]:='{}'; key text; pin text; coordinate text; page_count integer;
BEGIN
  IF actor IS NULL THEN RAISE EXCEPTION 'CRM_AUTH_REQUIRED' USING ERRCODE='42501'; END IF;
  IF public.has_role(actor,'admin'::public.app_role) IS NOT TRUE THEN RAISE EXCEPTION 'CRM_FORBIDDEN' USING ERRCODE='42501'; END IF;
  IF p_request_id IS NULL OR jsonb_typeof(p_request) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'CRM_INVALID_ARGUMENT' USING ERRCODE='22023'; END IF;
  IF (SELECT count(*) FROM jsonb_object_keys(p_request))<>5
    OR jsonb_typeof(p_request->'sourceFileId') IS DISTINCT FROM 'string' OR p_request->>'sourceFileId' !~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$'
    OR jsonb_typeof(p_request->'sourceSha256') IS DISTINCT FROM 'string' OR p_request->>'sourceSha256' !~ '^[0-9a-f]{64}$'
    OR jsonb_typeof(p_request->'filename') IS DISTINCT FROM 'string' OR length(p_request->>'filename') NOT BETWEEN 5 AND 200
    OR p_request->>'filename' ~ '[[:cntrl:]\x7f-\x9f\\/:*?"<>|]' OR p_request->>'filename' !~* '\.pdf$'
    OR jsonb_typeof(p_request->'placements') IS DISTINCT FROM 'array'
    OR jsonb_typeof(p_request->'assetHashes') IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'CRM_INVALID_ARGUMENT' USING ERRCODE='22023';
  END IF;
  IF jsonb_array_length(p_request->'placements') NOT BETWEEN 1 AND 100 THEN RAISE EXCEPTION 'CRM_INVALID_ARGUMENT' USING ERRCODE='22023'; END IF;
  FOR item IN SELECT value FROM jsonb_array_elements(p_request->'placements') LOOP
    IF jsonb_typeof(item) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'CRM_INVALID_ARGUMENT' USING ERRCODE='22023'; END IF;
    IF (SELECT count(*) FROM jsonb_object_keys(item))<>6 OR jsonb_typeof(item->'assetId') IS DISTINCT FROM 'string'
      OR item->>'assetId' NOT IN ('signature','stamp') OR jsonb_typeof(item->'pageNumber') IS DISTINCT FROM 'number'
      OR item->>'pageNumber' !~ '^[1-9][0-9]{0,2}$' OR (item->>'pageNumber')::integer>500 THEN
      RAISE EXCEPTION 'CRM_INVALID_ARGUMENT' USING ERRCODE='22023';
    END IF;
    FOREACH coordinate IN ARRAY ARRAY['x','y','width','height'] LOOP
      IF jsonb_typeof(item->coordinate) IS DISTINCT FROM 'number' THEN RAISE EXCEPTION 'CRM_INVALID_ARGUMENT' USING ERRCODE='22023'; END IF;
      IF (item->>coordinate)::numeric<0 OR (item->>coordinate)::numeric>14400
        OR (coordinate IN ('width','height') AND (item->>coordinate)::numeric=0) THEN
        RAISE EXCEPTION 'CRM_INVALID_ARGUMENT' USING ERRCODE='22023';
      END IF;
    END LOOP;
    asset:=item->>'assetId'; IF NOT asset=ANY(used) THEN used:=array_append(used,asset); END IF;
  END LOOP;
  IF (SELECT count(*) FROM jsonb_object_keys(p_request->'assetHashes'))<>cardinality(used) THEN RAISE EXCEPTION 'CRM_INVALID_ARGUMENT' USING ERRCODE='22023'; END IF;
  FOREACH asset IN ARRAY used LOOP
    SELECT sha256 INTO pin FROM public.crm_pdf_asset_catalog WHERE id=asset;
    IF jsonb_typeof(p_request->'assetHashes'->asset) IS DISTINCT FROM 'string'
      OR p_request->'assetHashes'->>asset IS DISTINCT FROM pin THEN RAISE EXCEPTION 'CRM_INVALID_ARGUMENT' USING ERRCODE='22023'; END IF;
  END LOOP;
  PERFORM pg_advisory_xact_lock(hashtextextended('crm-signed-pdf:'||p_request_id::text,0));
  SELECT * INTO artifact FROM public.crm_signed_pdfs WHERE request_id=p_request_id FOR UPDATE;
  IF FOUND THEN
    IF artifact.actor_id IS DISTINCT FROM actor OR artifact.request IS DISTINCT FROM p_request THEN
      RAISE EXCEPTION 'CRM_REQUEST_CONFLICT' USING ERRCODE='40001';
    END IF;
    -- Output bytes are not command intent. The first registered result wins.
    RETURN jsonb_build_object('artifact',to_jsonb(artifact),'replayed',true);
  END IF;
  PERFORM public.crm_frdo_require_private_storage();
  IF jsonb_typeof(p_artifact) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'CRM_INVALID_ARGUMENT' USING ERRCODE='22023'; END IF;
  IF (SELECT count(*) FROM jsonb_object_keys(p_artifact))<>4 OR jsonb_typeof(p_artifact->'sha256') IS DISTINCT FROM 'string'
    OR p_artifact->>'sha256' !~ '^[0-9a-f]{64}$' OR jsonb_typeof(p_artifact->'size') IS DISTINCT FROM 'number'
    OR p_artifact->>'size' !~ '^[1-9][0-9]{0,8}$' OR (p_artifact->>'size')::bigint>10485760
    OR jsonb_typeof(p_artifact->'pageCount') IS DISTINCT FROM 'number' OR p_artifact->>'pageCount' !~ '^[1-9][0-9]{0,2}$'
    OR (p_artifact->>'pageCount')::integer>500 OR jsonb_typeof(p_artifact->'path') IS DISTINCT FROM 'string'
    OR p_artifact->>'path' IS DISTINCT FROM ('crm-signed-pdfs/'||actor::text||'/'||p_request_id::text||'/'||(p_artifact->>'sha256')||'.pdf') THEN
    RAISE EXCEPTION 'CRM_INVALID_ARGUMENT' USING ERRCODE='22023';
  END IF;
  page_count:=(p_artifact->>'pageCount')::integer;
  IF EXISTS(SELECT 1 FROM jsonb_array_elements(p_request->'placements') x WHERE (x->>'pageNumber')::integer>page_count) THEN
    RAISE EXCEPTION 'CRM_INVALID_ARGUMENT' USING ERRCODE='22023';
  END IF;
  INSERT INTO public.crm_signed_pdfs(request_id,actor_id,request,source_file_id,source_sha256,output_sha256,output_size,storage_path,file_name,page_count,placements,asset_hashes)
    VALUES(p_request_id,actor,p_request,p_request->>'sourceFileId',p_request->>'sourceSha256',p_artifact->>'sha256',
      (p_artifact->>'size')::bigint,p_artifact->>'path',p_request->>'filename',page_count,p_request->'placements',p_request->'assetHashes')
    RETURNING * INTO artifact;
  RETURN jsonb_build_object('artifact',to_jsonb(artifact),'replayed',false);
END;
$$;

REVOKE ALL ON FUNCTION public.crm_frdo_require_private_storage(),public.crm_frdo_require_worker(uuid) FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.crm_check_signed_pdf_storage(),public.crm_prepare_frdo_email(uuid,uuid,bigint,text,jsonb,text,text,text),
 public.crm_finalize_frdo_email(uuid,uuid,jsonb),public.crm_claim_frdo_email(uuid,uuid),
 public.crm_finish_frdo_email(uuid,uuid,text,text,text),public.crm_register_signed_pdf(uuid,jsonb,jsonb) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.crm_check_signed_pdf_storage(),public.crm_prepare_frdo_email(uuid,uuid,bigint,text,jsonb,text,text,text),
 public.crm_register_signed_pdf(uuid,jsonb,jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.crm_finalize_frdo_email(uuid,uuid,jsonb),public.crm_claim_frdo_email(uuid,uuid),
 public.crm_finish_frdo_email(uuid,uuid,text,text,text) TO service_role;

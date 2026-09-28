-- An act can refer to an explicit SINTAGMA invoice export instead of a fabricated
-- contract. No cross-project authorization is implied by this snapshot.
-- Existing documents and contracts are unchanged; revisions preserve the basis.
CREATE OR REPLACE FUNCTION public.crm_save_document(
  p_request_id uuid,
  p_document_id uuid,
  p_expected_revision integer,
  p_payload jsonb,
  p_input jsonb
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public AS $$
DECLARE
  actor uuid := auth.uid();
  operation jsonb;
  operation_hash text;
  previous_request public.crm_document_api_requests%ROWTYPE;
  previous_document public.generated_documents%ROWTYPE;
  saved_document public.generated_documents%ROWTYPE;
  target_client public.clients%ROWTYPE;
  target_contract public.contracts%ROWTYPE;
  document_id uuid;
  contract_id uuid;
  target_revision integer;
  document_type text;
  document_number text;
  document_date date;
  v_amount numeric;
  service jsonb;
  subtotal numeric := 0;
  discount_amount numeric := 0;
  discount_value numeric;
  party_name text;
  has_service_period boolean := p_input ? 'servicePeriod';
  service_period jsonb;
  service_start_date date;
  service_end_date date;
  service_without_deadline boolean := false;
  previous_input jsonb;
  contract_type_label text;
  v_result jsonb;
  invoice_basis jsonb := p_input -> 'invoiceBasis';
  basis_field text;
  required_fields text[] := ARRAY[
    'doc_type', 'doc_number', 'doc_date', 'client_id', 'client_name',
    'client_inn', 'contract_id', 'total_amount', 'services', 'html_content', 'metadata'
  ];
BEGIN
  IF actor IS NULL OR NOT public.has_role(actor, 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'CRM_ADMIN_REQUIRED' USING ERRCODE = '42501';
  END IF;
  IF p_request_id IS NULL OR jsonb_typeof(p_input) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'CRM_INVALID_REQUEST' USING ERRCODE = '22023';
  END IF;
  IF (p_document_id IS NULL AND p_expected_revision IS NOT NULL)
    OR (p_document_id IS NOT NULL AND
      (p_expected_revision IS NULL OR p_expected_revision < 1)) THEN
    RAISE EXCEPTION 'CRM_EXPECTED_REVISION_REQUIRED' USING ERRCODE = '22023';
  END IF;

  -- Hash the command, not rendered HTML or mutable company/client settings.
  -- Retrying a previously successful command returns its original result.
  operation := jsonb_build_object('actorId', actor, 'documentId', p_document_id,
    'expectedRevision', p_expected_revision, 'input', p_input);
  operation_hash := md5(operation::text);
  PERFORM pg_advisory_xact_lock(hashtextextended('crm-request:' || p_request_id::text, 0));
  SELECT r.* INTO previous_request FROM public.crm_document_api_requests AS r
    WHERE r.request_id = p_request_id;
  IF FOUND THEN
    IF previous_request.actor_id <> actor
      OR previous_request.operation_hash <> operation_hash
      OR jsonb_build_object('actorId', previous_request.actor_id,
        'documentId', previous_request.request -> 'documentId',
        'expectedRevision', previous_request.request -> 'expectedRevision',
        'input', previous_request.request -> 'input') IS DISTINCT FROM operation THEN
      RAISE EXCEPTION 'CRM_REQUEST_ID_CONFLICT' USING ERRCODE = '23505';
    END IF;
    IF previous_request.result IS NULL THEN
      RAISE EXCEPTION 'CRM_REQUEST_INCOMPLETE' USING ERRCODE = '55000';
    END IF;
    RETURN previous_request.result || jsonb_build_object('replayed', true);
  END IF;

  IF jsonb_typeof(p_payload) IS DISTINCT FROM 'object'
    OR NOT (p_payload ?& required_fields)
    OR (p_payload - required_fields) <> '{}'::jsonb THEN
    RAISE EXCEPTION 'CRM_INVALID_PAYLOAD_FIELDS' USING ERRCODE = '22023';
  END IF;
  IF jsonb_typeof(p_payload -> 'doc_type') IS DISTINCT FROM 'string'
    OR jsonb_typeof(p_payload -> 'doc_number') IS DISTINCT FROM 'string'
    OR jsonb_typeof(p_payload -> 'doc_date') IS DISTINCT FROM 'string'
    OR jsonb_typeof(p_payload -> 'client_id') IS DISTINCT FROM 'string'
    OR jsonb_typeof(p_payload -> 'client_name') IS DISTINCT FROM 'string'
    OR jsonb_typeof(p_payload -> 'client_inn') NOT IN ('string', 'null')
    OR jsonb_typeof(p_payload -> 'contract_id') NOT IN ('string', 'null')
    OR jsonb_typeof(p_payload -> 'total_amount') IS DISTINCT FROM 'number'
    OR jsonb_typeof(p_payload -> 'services') IS DISTINCT FROM 'array'
    OR jsonb_typeof(p_payload -> 'html_content') IS DISTINCT FROM 'string'
    OR jsonb_typeof(p_payload -> 'metadata') IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'CRM_INVALID_PAYLOAD_TYPES' USING ERRCODE = '22023';
  END IF;
  document_type := p_payload ->> 'doc_type';
  document_number := p_payload ->> 'doc_number';
  IF document_type = 'contract' THEN
    contract_type_label := CASE coalesce(p_input ->> 'template', 'standard')
      WHEN 'standard' THEN 'Сайт' WHEN 'frdo' THEN 'ФРДО' WHEN 'nmo' THEN 'НМО' END;
    IF contract_type_label IS NULL THEN
      RAISE EXCEPTION 'CRM_INVALID_CONTRACT_TEMPLATE' USING ERRCODE = '22023';
    END IF;
  END IF;
  IF document_type NOT IN ('contract', 'invoice', 'act')
    OR length(btrim(document_number)) = 0 OR length(document_number) > 100
    OR document_number <> btrim(document_number)
    OR (p_payload ->> 'doc_date') !~ '^\d{4}-\d{2}-\d{2}$'
    OR length(btrim(p_payload ->> 'html_content')) = 0
    OR jsonb_array_length(p_payload -> 'services') = 0 THEN
    RAISE EXCEPTION 'CRM_INVALID_DOCUMENT' USING ERRCODE = '22023';
  END IF;
  document_date := (p_payload ->> 'doc_date')::date;
  IF (p_input ->> 'type') IS DISTINCT FROM document_type
    OR (p_input ->> 'clientId') IS DISTINCT FROM (p_payload ->> 'client_id')
    OR (p_input ->> 'date') IS DISTINCT FROM (p_payload ->> 'doc_date')
    OR (p_input ->> 'number') IS DISTINCT FROM document_number
    OR (p_input -> 'services') IS DISTINCT FROM (p_payload -> 'services')
    OR (p_payload -> 'metadata' -> 'documentInput') IS DISTINCT FROM p_input
    OR (document_type <> 'contract' AND
      (p_input ->> 'contractId') IS DISTINCT FROM (p_payload ->> 'contract_id'))
    OR (document_type = 'contract' AND p_input ? 'contractId') THEN
    RAISE EXCEPTION 'CRM_INPUT_PAYLOAD_MISMATCH' USING ERRCODE = '22023';
  END IF;
  v_amount := (p_payload ->> 'total_amount')::numeric;
  IF v_amount < 0 OR v_amount > 999999999999.99 OR v_amount <> round(v_amount, 2) THEN
    RAISE EXCEPTION 'CRM_INVALID_AMOUNT' USING ERRCODE = '22023';
  END IF;
  FOR service IN SELECT value FROM jsonb_array_elements(p_payload -> 'services') LOOP
    IF jsonb_typeof(service) IS DISTINCT FROM 'object'
      OR jsonb_typeof(service -> 'name') IS DISTINCT FROM 'string'
      OR length(btrim(service ->> 'name')) = 0
      OR jsonb_typeof(service -> 'qty') IS DISTINCT FROM 'number'
      OR jsonb_typeof(service -> 'price') IS DISTINCT FROM 'number' THEN
      RAISE EXCEPTION 'CRM_INVALID_SERVICE' USING ERRCODE = '22023';
    END IF;
    IF (service ->> 'qty')::numeric <= 0 OR (service ->> 'price')::numeric < 0
      OR (service ->> 'price')::numeric <> round((service ->> 'price')::numeric, 2) THEN
      RAISE EXCEPTION 'CRM_INVALID_SERVICE' USING ERRCODE = '22023';
    END IF;
    subtotal := subtotal + round((service ->> 'qty')::numeric * (service ->> 'price')::numeric, 2);
  END LOOP;
  IF p_input ? 'discount' THEN
    IF document_type <> 'invoice' OR jsonb_typeof(p_input -> 'discount') IS DISTINCT FROM 'object'
      OR coalesce(p_input -> 'discount' ->> 'kind', '') NOT IN ('amount', 'percent')
      OR jsonb_typeof(p_input -> 'discount' -> 'value') IS DISTINCT FROM 'number' THEN
      RAISE EXCEPTION 'CRM_INVALID_DISCOUNT' USING ERRCODE = '22023';
    END IF;
    discount_value := (p_input -> 'discount' ->> 'value')::numeric;
    IF discount_value < 0 OR discount_value <> round(discount_value, 2)
      OR ((p_input -> 'discount' ->> 'kind') = 'percent' AND discount_value > 100) THEN
      RAISE EXCEPTION 'CRM_INVALID_DISCOUNT' USING ERRCODE = '22023';
    END IF;
    discount_amount := CASE WHEN (p_input -> 'discount' ->> 'kind') = 'amount'
      THEN discount_value ELSE round(subtotal * discount_value / 100, 2) END;
  END IF;
  IF discount_amount > subtotal OR v_amount <> subtotal - discount_amount
    OR jsonb_typeof(p_payload -> 'metadata' -> 'discountAmount') IS DISTINCT FROM 'number'
    OR (p_payload -> 'metadata' ->> 'discountAmount')::numeric <> discount_amount THEN
    RAISE EXCEPTION 'CRM_TOTAL_MISMATCH' USING ERRCODE = '22023';
  END IF;
  IF has_service_period THEN
    service_period := p_input -> 'servicePeriod';
    IF document_type <> 'contract' OR jsonb_typeof(service_period) IS DISTINCT FROM 'object'
      OR (service_period - ARRAY['start','end','noDeadline']) <> '{}'::jsonb
      OR jsonb_typeof(service_period -> 'noDeadline') IS DISTINCT FROM 'boolean' THEN
      RAISE EXCEPTION 'CRM_INVALID_SERVICE_PERIOD' USING ERRCODE = '22023';
    END IF;
    service_without_deadline := (service_period ->> 'noDeadline')::boolean;
    IF service_period ? 'start' THEN
      IF jsonb_typeof(service_period -> 'start') IS DISTINCT FROM 'string'
        OR (service_period ->> 'start') !~ '^\d{4}-\d{2}-\d{2}$' THEN
        RAISE EXCEPTION 'CRM_INVALID_SERVICE_PERIOD' USING ERRCODE = '22023';
      END IF;
      service_start_date := (service_period ->> 'start')::date;
    END IF;
    IF service_period ? 'end' THEN
      IF jsonb_typeof(service_period -> 'end') IS DISTINCT FROM 'string'
        OR (service_period ->> 'end') !~ '^\d{4}-\d{2}-\d{2}$' THEN
        RAISE EXCEPTION 'CRM_INVALID_SERVICE_PERIOD' USING ERRCODE = '22023';
      END IF;
      service_end_date := (service_period ->> 'end')::date;
    END IF;
    IF (service_without_deadline AND service_end_date IS NOT NULL)
      OR (service_start_date IS NOT NULL AND service_end_date IS NOT NULL
        AND service_end_date < service_start_date) THEN
      RAISE EXCEPTION 'CRM_INVALID_SERVICE_PERIOD' USING ERRCODE = '22023';
    END IF;
  END IF;

  SELECT c.* INTO target_client FROM public.clients AS c
    WHERE c.id = (p_payload ->> 'client_id')::uuid FOR SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'CRM_CLIENT_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;
  IF p_document_id IS NULL AND ((p_payload ->> 'client_name') IS DISTINCT FROM target_client.name
    OR nullif(p_payload ->> 'client_inn', '') IS DISTINCT FROM nullif(target_client.inn, '')) THEN
    RAISE EXCEPTION 'CRM_CLIENT_SNAPSHOT_MISMATCH' USING ERRCODE = '22023';
  END IF;

  -- The authenticated caller supplies this snapshot after reading the source
  -- export. Validate its shape, payer, full amount and immutable provenance;
  -- this is deliberately not represented as a server-verified SINTAGMA record.
  IF p_input ? 'invoiceBasis' THEN
    IF document_type <> 'act' OR p_payload ->> 'contract_id' IS NOT NULL
      OR jsonb_typeof(invoice_basis) IS DISTINCT FROM 'object'
      OR NOT (invoice_basis ?& ARRAY['source','sourceKind','sourceId','organizationId','number','date','amount','currency','payerName','payerInn'])
      OR (invoice_basis - ARRAY['source','sourceKind','sourceId','organizationId','number','date','amount','currency','payerName','payerInn']) <> '{}'::jsonb THEN
      RAISE EXCEPTION 'CRM_INVALID_INVOICE_BASIS' USING ERRCODE = '22023';
    END IF;
    FOREACH basis_field IN ARRAY ARRAY['source','sourceKind','sourceId','organizationId','number','date','currency','payerName','payerInn'] LOOP
      IF jsonb_typeof(invoice_basis -> basis_field) IS DISTINCT FROM 'string' THEN
        RAISE EXCEPTION 'CRM_INVALID_INVOICE_BASIS' USING ERRCODE = '22023';
      END IF;
    END LOOP;
    IF invoice_basis ->> 'source' <> 'sintagma'
      OR invoice_basis ->> 'sourceKind' <> 'subscription_invoice'
      OR invoice_basis ->> 'currency' <> 'RUB'
      OR (invoice_basis ->> 'sourceId') !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      OR (invoice_basis ->> 'organizationId') !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      OR (invoice_basis ->> 'date') !~ '^\d{4}-\d{2}-\d{2}$'
      OR (invoice_basis ->> 'payerInn') !~ '^(\d{10}|\d{12})$'
      OR length(btrim(invoice_basis ->> 'number')) NOT BETWEEN 1 AND 100
      OR (invoice_basis ->> 'number') <> btrim(invoice_basis ->> 'number')
      OR (invoice_basis ->> 'number') ~ '[\r\n\t]'
      OR length(btrim(invoice_basis ->> 'payerName')) NOT BETWEEN 1 AND 1000
      OR jsonb_typeof(invoice_basis -> 'amount') IS DISTINCT FROM 'number' THEN
      RAISE EXCEPTION 'CRM_INVALID_INVOICE_BASIS' USING ERRCODE = '22023';
    END IF;
    IF (invoice_basis ->> 'payerInn') IS DISTINCT FROM btrim(p_payload ->> 'client_inn') THEN
      RAISE EXCEPTION 'CRM_INVOICE_PAYER_MISMATCH' USING ERRCODE = '22023';
    END IF;
    IF (invoice_basis ->> 'amount')::numeric <= 0
      OR (invoice_basis ->> 'amount')::numeric IS DISTINCT FROM v_amount THEN
      RAISE EXCEPTION 'CRM_INVOICE_AMOUNT_MISMATCH' USING ERRCODE = '22023';
    END IF;
    IF (invoice_basis ->> 'date')::date > document_date THEN
      RAISE EXCEPTION 'CRM_ACT_BEFORE_INVOICE' USING ERRCODE = '22023';
    END IF;
    IF p_payload -> 'metadata' -> 'invoiceBasisSnapshot' IS DISTINCT FROM invoice_basis
      OR p_payload -> 'metadata' ->> 'invoiceBasisProvenance' IS DISTINCT FROM 'explicit-source-export' THEN
      RAISE EXCEPTION 'CRM_INVOICE_SNAPSHOT_MISMATCH' USING ERRCODE = '22023';
    END IF;
  ELSIF document_type = 'act' AND p_payload ->> 'contract_id' IS NULL THEN
    RAISE EXCEPTION 'CRM_ACT_CONTRACT_REQUIRED' USING ERRCODE = '22023';
  END IF;

  contract_id := (p_payload ->> 'contract_id')::uuid;
  party_name := p_payload ->> 'client_name';
  IF p_document_id IS NULL THEN
    document_id := gen_random_uuid();
    target_revision := 1;
    IF document_type = 'contract' AND contract_id IS NOT NULL THEN
      RAISE EXCEPTION 'CRM_NEW_CONTRACT_MUST_BE_UNLINKED' USING ERRCODE = '22023';
    END IF;

  ELSE
    SELECT d.* INTO previous_document FROM public.generated_documents AS d
      WHERE d.id = p_document_id FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'CRM_DOCUMENT_NOT_FOUND' USING ERRCODE = 'P0002';
    END IF;
    IF previous_document.revision <> p_expected_revision THEN
      RAISE EXCEPTION 'CRM_REVISION_CONFLICT' USING ERRCODE = '40001';
    END IF;
    IF previous_document.client_id IS NULL OR NOT EXISTS (
      SELECT 1 FROM public.crm_document_revisions AS r
      WHERE r.document_id = previous_document.id AND r.revision = previous_document.revision
        AND r.source = 'api' AND r.input IS NOT NULL
    ) THEN
      RAISE EXCEPTION 'CRM_DOCUMENT_LEGACY_REQUIRES_ADOPTION' USING ERRCODE = '55000';
    END IF;
    SELECT r.input INTO previous_input FROM public.crm_document_revisions AS r
      WHERE r.document_id = previous_document.id AND r.revision = previous_document.revision;
    IF p_input -> 'invoiceBasis' IS DISTINCT FROM previous_input -> 'invoiceBasis' THEN
      RAISE EXCEPTION 'CRM_INVOICE_BASIS_IMMUTABLE' USING ERRCODE = '22023';
    END IF;
    IF document_type = 'contract' AND coalesce(p_input ->> 'template', 'standard')
      IS DISTINCT FROM coalesce(previous_input ->> 'template', 'standard') THEN
      RAISE EXCEPTION 'CRM_CONTRACT_TEMPLATE_IMMUTABLE' USING ERRCODE = '22023';
    END IF;
    IF previous_document.client_id IS DISTINCT FROM target_client.id
      OR previous_document.doc_type IS DISTINCT FROM document_type
      OR previous_document.doc_number IS DISTINCT FROM document_number
      OR previous_document.contract_id IS DISTINCT FROM contract_id THEN
      RAISE EXCEPTION 'CRM_DOCUMENT_IDENTITY_IMMUTABLE' USING ERRCODE = '22023';
    END IF;
    IF (p_payload ->> 'client_name') IS DISTINCT FROM previous_document.client_name
      OR nullif(p_payload ->> 'client_inn', '') IS DISTINCT FROM nullif(previous_document.client_inn, '') THEN
      RAISE EXCEPTION 'CRM_CLIENT_SNAPSHOT_MISMATCH' USING ERRCODE = '22023';
    END IF;
    document_id := previous_document.id;
    target_revision := previous_document.revision + 1;
  END IF;

  IF contract_id IS NOT NULL THEN
    SELECT c.* INTO target_contract FROM public.contracts AS c
      WHERE c.id = contract_id FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'CRM_CONTRACT_NOT_FOUND' USING ERRCODE = 'P0002';
    END IF;
    IF target_contract.is_archived THEN
      RAISE EXCEPTION 'CRM_CONTRACT_ARCHIVED' USING ERRCODE = '55000';
    END IF;
    -- The Contracts tab can edit this row without incrementing the generated
    -- document revision. Do not silently overwrite those independent changes.
    -- Matching the already-current value is safe; unrelated card fields and an
    -- omitted servicePeriod are deliberately outside this guard.
    IF p_document_id IS NOT NULL AND document_type = 'contract' AND (
      target_contract.contract_type IS DISTINCT FROM contract_type_label
      OR
      (target_contract.contract_date IS DISTINCT FROM previous_document.doc_date
        AND target_contract.contract_date IS DISTINCT FROM document_date)
      OR (target_contract.amount IS DISTINCT FROM previous_document.total_amount
        AND target_contract.amount IS DISTINCT FROM v_amount)
      OR (has_service_period AND previous_input ? 'servicePeriod' AND (
        (target_contract.service_start IS DISTINCT FROM (previous_input -> 'servicePeriod' ->> 'start')::date
          AND target_contract.service_start IS DISTINCT FROM service_start_date)
        OR (target_contract.service_end IS DISTINCT FROM (previous_input -> 'servicePeriod' ->> 'end')::date
          AND target_contract.service_end IS DISTINCT FROM service_end_date)
        OR (target_contract.service_no_deadline IS DISTINCT FROM (previous_input -> 'servicePeriod' ->> 'noDeadline')::boolean
          AND target_contract.service_no_deadline IS DISTINCT FROM service_without_deadline)
      ))
    ) THEN
      RAISE EXCEPTION 'CRM_LINKED_CONTRACT_CHANGED' USING ERRCODE = '40001';
    END IF;
    IF p_document_id IS NOT NULL AND document_type = 'contract' AND NOT has_service_period
      AND (p_input ->> 'deadline') IS DISTINCT FROM (previous_input ->> 'deadline')
      AND (previous_input ? 'servicePeriod' OR target_contract.service_start IS NOT NULL
        OR target_contract.service_end IS NOT NULL OR target_contract.service_no_deadline) THEN
      RAISE EXCEPTION 'CRM_SERVICE_PERIOD_REQUIRED' USING ERRCODE = '22023';
    END IF;
    IF target_contract.client_name IS DISTINCT FROM party_name THEN
      RAISE EXCEPTION 'CRM_CONTRACT_CLIENT_MISMATCH' USING ERRCODE = '22023';
    END IF;
    -- The existing contracts schema has no client_id. Fail instead of guessing
    -- which identically named client owns a legacy text-only contract relation.
    IF (SELECT count(*) FROM public.clients AS c WHERE c.name = party_name) > 1 THEN
      RAISE EXCEPTION 'CRM_CONTRACT_CLIENT_AMBIGUOUS' USING ERRCODE = '22023';
    END IF;
  END IF;

  IF invoice_basis IS NOT NULL THEN
    PERFORM pg_advisory_xact_lock(hashtextextended(
      'crm-invoice-act:' || (invoice_basis ->> 'source') || ':' ||
      (invoice_basis ->> 'sourceKind') || ':' || (invoice_basis ->> 'sourceId'), 0));
    IF EXISTS (
      SELECT 1 FROM public.generated_documents AS d
      WHERE d.doc_type = 'act' AND d.id IS DISTINCT FROM p_document_id
        AND d.metadata -> 'invoiceBasisSnapshot' ->> 'source' = invoice_basis ->> 'source'
        AND d.metadata -> 'invoiceBasisSnapshot' ->> 'sourceKind' = invoice_basis ->> 'sourceKind'
        AND d.metadata -> 'invoiceBasisSnapshot' ->> 'sourceId' = invoice_basis ->> 'sourceId'
    ) THEN
      RAISE EXCEPTION 'CRM_INVOICE_ACT_ALREADY_EXISTS' USING ERRCODE = '23505';
    END IF;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(
    'crm-document-number:' || document_type || ':' || document_number, 0));
  IF p_document_id IS NULL AND EXISTS (
    SELECT 1 FROM public.generated_documents AS d
    WHERE d.doc_type = document_type AND d.doc_number = document_number
  ) THEN
    RAISE EXCEPTION 'CRM_DOCUMENT_NUMBER_CONFLICT' USING ERRCODE = '23505';
  END IF;

  INSERT INTO public.crm_document_api_requests
    (request_id, actor_id, operation_hash, request, document_id, target_revision)
  VALUES (p_request_id, actor, operation_hash,
    jsonb_build_object('documentId', p_document_id, 'expectedRevision', p_expected_revision,
      'input', p_input, 'payload', p_payload), document_id, target_revision);

  IF document_type = 'contract' THEN
    IF p_document_id IS NULL THEN
      IF EXISTS (SELECT 1 FROM public.contracts AS c WHERE c.contract_number = document_number) THEN
        RAISE EXCEPTION 'CRM_CONTRACT_NUMBER_CONFLICT' USING ERRCODE = '23505';
      END IF;
      INSERT INTO public.contracts (client_name, contract_number, contract_date, amount, contract_type, payment_status,
        service_start, service_end, service_no_deadline)
      VALUES (party_name, document_number, document_date, v_amount, contract_type_label, 'не оплачено',
        service_start_date, service_end_date, service_without_deadline)
      RETURNING id INTO contract_id;
    ELSE
      IF contract_id IS NULL THEN
        RAISE EXCEPTION 'CRM_CONTRACT_LINK_REQUIRED' USING ERRCODE = '22023';
      END IF;
      UPDATE public.contracts AS c SET contract_date = document_date, amount = v_amount, contract_type = contract_type_label
        , service_start = CASE WHEN has_service_period THEN service_start_date ELSE c.service_start END
        , service_end = CASE WHEN has_service_period THEN service_end_date ELSE c.service_end END
        , service_no_deadline = CASE WHEN has_service_period THEN service_without_deadline ELSE c.service_no_deadline END
        WHERE c.id = contract_id;
    END IF;
  END IF;

  IF p_document_id IS NULL THEN
    INSERT INTO public.generated_documents (
      id, doc_type, doc_number, doc_date, client_id, client_name, client_inn,
      contract_id, total_amount, services, html_content, metadata
    ) VALUES (
      document_id, document_type, document_number, document_date,
      target_client.id, party_name, p_payload ->> 'client_inn',
      contract_id, v_amount, p_payload -> 'services', p_payload ->> 'html_content', p_payload -> 'metadata'
    ) RETURNING * INTO saved_document;
  ELSE
    UPDATE public.generated_documents AS d SET
      doc_date = document_date, client_name = party_name,
      client_inn = p_payload ->> 'client_inn', total_amount = v_amount,
      services = p_payload -> 'services', html_content = p_payload ->> 'html_content',
      metadata = p_payload -> 'metadata'
    WHERE d.id = document_id RETURNING d.* INTO saved_document;
  END IF;

  v_result := jsonb_build_object('documentId', saved_document.id,
    'revision', saved_document.revision, 'contractId', saved_document.contract_id, 'replayed', false);
  UPDATE public.crm_document_api_requests AS r SET result = v_result
    WHERE r.request_id = p_request_id;
  RETURN v_result;
END;
$$;

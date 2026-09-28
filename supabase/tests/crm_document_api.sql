-- Integration test, for an isolated local database after all migrations.
-- Run with a database-owner connection. Synthetic records are rolled back.
-- No HTTP, storage writes, SMTP or production data are required.
BEGIN;

CREATE FUNCTION pg_temp.crm_assert(ok boolean, description text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF ok IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'ASSERTION FAILED: %', description;
  END IF;
END;
$$;

CREATE FUNCTION pg_temp.crm_expect_error(statement text, expected_message text, expected_state text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  actual_message text;
  actual_state text;
BEGIN
  BEGIN
    EXECUTE statement;
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS actual_message = MESSAGE_TEXT, actual_state = RETURNED_SQLSTATE;
  END;
  IF actual_message IS NULL THEN
    RAISE EXCEPTION 'EXPECTED ERROR: %', expected_message;
  END IF;
  IF expected_message <> '' AND position(expected_message IN actual_message) = 0 THEN
    RAISE EXCEPTION 'EXPECTED ERROR %, GOT %', expected_message, actual_message;
  END IF;
  IF expected_state IS NOT NULL AND actual_state <> expected_state THEN
    RAISE EXCEPTION 'EXPECTED SQLSTATE %, GOT % (%)', expected_state, actual_state, actual_message;
  END IF;
END;
$$;

CREATE FUNCTION pg_temp.crm_test_payload(kind text, number text, client uuid,
  client_name text DEFAULT 'API SQL test client', contract uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE sql AS $$
  SELECT jsonb_build_object(
    'doc_type', kind, 'doc_number', number, 'doc_date', '2026-09-28',
    'client_id', client, 'client_name', client_name, 'client_inn', NULL,
    'contract_id', contract, 'total_amount', CASE WHEN kind = 'invoice' THEN 900 ELSE 1000 END,
    'services', jsonb_build_array(jsonb_build_object('name', 'Synthetic test service', 'qty', 1, 'price', 1000)),
    'html_content', '<html><body>SQL test fixture only</body></html>',
    'metadata', jsonb_build_object('discountAmount', CASE WHEN kind = 'invoice' THEN 100 ELSE 0 END, 'companySnapshot', jsonb_build_object('name', 'Synthetic test company'))
  );
$$;

-- Builds a canonical command and metadata like the server renderer, keeping the
-- fixtures concise. Explicit overrides permit testing changed-command retries.
CREATE FUNCTION pg_temp.crm_save_fixture(request_id uuid, document_id uuid, expected_revision integer,
  payload jsonb, overrides jsonb DEFAULT '{}')
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE
  command jsonb;
BEGIN
  command := jsonb_build_object('type', payload -> 'doc_type', 'clientId', payload -> 'client_id',
    'date', payload -> 'doc_date', 'number', payload -> 'doc_number', 'services', payload -> 'services');
  IF payload ->> 'doc_type' = 'contract' THEN
    command := command || '{"template":"standard","subject":"Explicit test subject","deadline":"Explicit test period","paymentTerms":"Explicit test payment terms"}';
  ELSIF payload ->> 'contract_id' IS NOT NULL THEN
    command := command || jsonb_build_object('contractId', payload -> 'contract_id');
  END IF;
  IF payload ->> 'doc_type' = 'invoice' AND (payload -> 'metadata' ->> 'discountAmount')::numeric > 0 THEN
    command := command || jsonb_build_object('discount', jsonb_build_object('kind','amount','value',payload -> 'metadata' -> 'discountAmount'));
  END IF;
  command := command || overrides;
  RETURN public.crm_save_document(request_id, document_id, expected_revision,
    jsonb_set(payload, '{metadata,documentInput}', command), command);
END;
$$;

INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES
  ('d0c00000-0000-4000-8000-000000000001', 'crm-sql-admin@example.invalid', '{}'),
  ('d0c00000-0000-4000-8000-000000000002', 'crm-sql-user@example.invalid', '{}');
INSERT INTO public.user_roles (user_id, role)
  VALUES ('d0c00000-0000-4000-8000-000000000001', 'admin');
INSERT INTO public.clients (id, name) VALUES
  ('d0c00000-0000-4000-8000-000000000010', 'API SQL test client'),
  ('d0c00000-0000-4000-8000-000000000011', 'Another API SQL test client');
INSERT INTO public.contracts (id, client_name, contract_number, contract_date, amount, is_archived) VALUES
  ('d0c00000-0000-4000-8000-000000000020', 'API SQL test client', 'SQL-ARCHIVED/2026', '2026-09-28', 1000, true),
  ('d0c00000-0000-4000-8000-000000000021', 'Another API SQL test client', 'SQL-OTHER/2026', '2026-09-28', 1000, false);

-- Emulate two rows that predate this migration without imposing a global unique
-- index or rewriting historic documents. All trigger changes are transaction-local.
ALTER TABLE public.generated_documents DISABLE TRIGGER crm_document_before_write;
ALTER TABLE public.generated_documents DISABLE TRIGGER crm_document_after_write;
INSERT INTO public.generated_documents
  (id, doc_type, doc_number, client_name, html_content, services) VALUES
  ('d0c00000-0000-4000-8000-000000000030', 'invoice', 'SQL-LEGACY-DUP/2026', 'API SQL test client', '<p>Historic original A</p>', '[]'),
  ('d0c00000-0000-4000-8000-000000000031', 'invoice', 'SQL-LEGACY-DUP/2026', 'API SQL test client', '<p>Historic original B</p>', '[]');
ALTER TABLE public.generated_documents ENABLE TRIGGER crm_document_before_write;
ALTER TABLE public.generated_documents ENABLE TRIGGER crm_document_after_write;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', 'd0c00000-0000-4000-8000-000000000002', true);
SELECT pg_temp.crm_expect_error($q$
  SELECT pg_temp.crm_save_fixture('d0c00000-0000-4000-8000-000000000101', NULL, NULL,
    pg_temp.crm_test_payload('invoice', 'SQL-NONADMIN/2026', 'd0c00000-0000-4000-8000-000000000010'), '{}')
$q$, 'CRM_ADMIN_REQUIRED', '42501');
SELECT pg_temp.crm_assert((SELECT count(*) = 0 FROM public.crm_document_revisions), 'non-admin cannot read revisions');
SELECT pg_temp.crm_assert((SELECT count(*) = 0 FROM public.crm_document_api_requests), 'non-admin cannot read requests');
SELECT pg_temp.crm_expect_error($q$
  SELECT public.crm_suggest_document_number('invoice', '2026-09-28')
$q$, 'CRM_ADMIN_REQUIRED', '42501');

SELECT set_config('request.jwt.claim.sub', 'd0c00000-0000-4000-8000-000000000001', true);
DO $$
DECLARE
  base_payload jsonb := pg_temp.crm_test_payload('contract', 'SQL-CONTRACT/2026', 'd0c00000-0000-4000-8000-000000000010');
  command jsonb := '{}';
  first_result jsonb;
  replay_result jsonb;
  revision_result jsonb;
  linked_payload jsonb;
  doc_id uuid;
  linked_contract_id uuid;
  input_count integer;
BEGIN
  first_result := pg_temp.crm_save_fixture('d0c00000-0000-4000-8000-000000000102', NULL, NULL, base_payload, command);
  doc_id := (first_result ->> 'documentId')::uuid;
  linked_contract_id := (first_result ->> 'contractId')::uuid;
  PERFORM pg_temp.crm_assert((first_result - ARRAY['documentId','revision','contractId','replayed']) = '{}'::jsonb,
    'RPC output has only the agreed keys');
  PERFORM pg_temp.crm_assert(first_result ->> 'revision' = '1' AND first_result ->> 'replayed' = 'false', 'create returns revision one');
  PERFORM pg_temp.crm_assert(linked_contract_id IS NOT NULL, 'contract record created atomically');
  UPDATE public.contracts SET service_start = '2026-09-01', service_end = '2026-12-31',
    paid_until = '2027-02-01', appendix_ref = 'Synthetic appendix reference'
    WHERE id = linked_contract_id;
  PERFORM pg_temp.crm_assert((SELECT c.amount = 1000 AND c.contract_date = '2026-09-28'::date
    FROM public.contracts AS c WHERE c.id = linked_contract_id), 'contract stores net amount and date');
  PERFORM pg_temp.crm_assert((SELECT d.contract_id = linked_contract_id AND d.client_id = 'd0c00000-0000-4000-8000-000000000010'
    FROM public.generated_documents AS d WHERE d.id = doc_id), 'generated document links exact client and contract');
  PERFORM pg_temp.crm_assert((SELECT r.input ->> 'type' = 'contract' AND r.source = 'api'
    AND r.snapshot -> 'metadata' -> 'companySnapshot' ->> 'name' = 'Synthetic test company'
    FROM public.crm_document_revisions AS r WHERE r.document_id = doc_id AND r.revision = 1), 'revision preserves command and resolved snapshot');

  -- A command retry does not depend on the current company settings/rendering.
  replay_result := pg_temp.crm_save_fixture('d0c00000-0000-4000-8000-000000000102', NULL, NULL,
    base_payload || '{"html_content":"<p>Changed rendering after settings update</p>"}', command);
  PERFORM pg_temp.crm_assert(replay_result = first_result || '{"replayed":true}'::jsonb, 'same command replays original success');
  PERFORM pg_temp.crm_assert((SELECT count(*) = 1 FROM public.crm_document_revisions AS r WHERE r.document_id = doc_id), 'replay does not create revision');
  PERFORM pg_temp.crm_assert((SELECT html_content = '<html><body>SQL test fixture only</body></html>'
    FROM public.generated_documents WHERE id = doc_id), 'replay never replaces rendered content');

  PERFORM pg_temp.crm_expect_error(format('SELECT pg_temp.crm_save_fixture(%L,NULL,NULL,%L::jsonb,%L::jsonb)',
    'd0c00000-0000-4000-8000-000000000102', base_payload, command || '{"date":"2026-10-01"}'::jsonb), 'CRM_REQUEST_ID_CONFLICT', '23505');
  PERFORM pg_temp.crm_expect_error(format('SELECT pg_temp.crm_save_fixture(%L,NULL,NULL,%L::jsonb,%L::jsonb)',
    'd0c00000-0000-4000-8000-000000000103', base_payload, command), 'CRM_DOCUMENT_NUMBER_CONFLICT', '23505');

  linked_payload := base_payload || jsonb_build_object('contract_id', linked_contract_id,
    'doc_date', '2026-10-01', 'total_amount', 800, 'html_content', '<p>Updated date and amount</p>',
    'services', jsonb_build_array(jsonb_build_object('name','Synthetic test service','qty',1,'price',800)));
  UPDATE public.clients SET name = 'Renamed current CRM card', inn = '7700000000'
    WHERE id = 'd0c00000-0000-4000-8000-000000000010';
  revision_result := pg_temp.crm_save_fixture('d0c00000-0000-4000-8000-000000000104', doc_id, 1,
    linked_payload, command);
  PERFORM pg_temp.crm_assert(revision_result ->> 'revision' = '2', 'revision increments');
  PERFORM pg_temp.crm_assert((SELECT client_name = 'API SQL test client' AND client_inn IS NULL
    FROM public.generated_documents WHERE id = doc_id), 'revision retains original party after CRM card rename');
  UPDATE public.clients SET name = 'API SQL test client', inn = NULL
    WHERE id = 'd0c00000-0000-4000-8000-000000000010';
  PERFORM pg_temp.crm_assert((SELECT c.amount = 800 AND c.contract_date = '2026-10-01'::date
    FROM public.contracts AS c WHERE c.id = linked_contract_id), 'contract revision synchronizes amount and date');
  PERFORM pg_temp.crm_assert((SELECT c.service_start = '2026-09-01'::date AND c.service_end = '2026-12-31'::date
    AND c.paid_until = '2027-02-01'::date AND c.appendix_ref = 'Synthetic appendix reference'
    FROM public.contracts AS c WHERE c.id = linked_contract_id), 'revision without explicit period preserves current period, payment date and appendix');
  PERFORM pg_temp.crm_assert((SELECT r.snapshot ->> 'html_content' = '<html><body>SQL test fixture only</body></html>'
    FROM public.crm_document_revisions AS r WHERE r.document_id = doc_id AND r.revision = 1), 'old rendered version preserved');

  PERFORM pg_temp.crm_expect_error(format('SELECT pg_temp.crm_save_fixture(%L,%L,1,%L::jsonb,%L::jsonb)',
    'd0c00000-0000-4000-8000-000000000105', doc_id, linked_payload, command), 'CRM_REVISION_CONFLICT', '40001');
  PERFORM pg_temp.crm_expect_error(format('SELECT pg_temp.crm_save_fixture(%L,%L,2,%L::jsonb,%L::jsonb)',
    'd0c00000-0000-4000-8000-000000000106', doc_id,
    linked_payload || '{"doc_number":"SQL-RENAMED/2026"}'::jsonb, command), 'CRM_DOCUMENT_IDENTITY_IMMUTABLE', '22023');
  PERFORM pg_temp.crm_expect_error(format('SELECT pg_temp.crm_save_fixture(%L,%L,2,%L::jsonb,%L::jsonb)',
    'd0c00000-0000-4000-8000-000000000107', doc_id,
    linked_payload || '{"client_id":"d0c00000-0000-4000-8000-000000000011","client_name":"Another API SQL test client"}'::jsonb,
    command), 'CRM_DOCUMENT_IDENTITY_IMMUTABLE', '22023');
  PERFORM pg_temp.crm_expect_error(format('SELECT pg_temp.crm_save_fixture(%L,%L,2,%L::jsonb,%L::jsonb)',
    'd0c00000-0000-4000-8000-000000000108', doc_id,
    linked_payload || '{"contract_id":null}'::jsonb, command), 'CRM_DOCUMENT_IDENTITY_IMMUTABLE', '22023');

  -- API must not reuse old input after a human has changed the document in UI.
  UPDATE public.generated_documents SET html_content = '<p>Manual UI correction</p>' WHERE id = doc_id;
  PERFORM pg_temp.crm_assert((SELECT r.input IS NULL AND r.source = 'legacy'
    FROM public.crm_document_revisions AS r WHERE r.document_id = doc_id AND r.revision = 3), 'UI snapshot does not inherit stale API input');
  PERFORM pg_temp.crm_expect_error(format('SELECT pg_temp.crm_save_fixture(%L,%L,3,%L::jsonb,%L::jsonb)',
    'd0c00000-0000-4000-8000-000000000109', doc_id, linked_payload, command), 'CRM_DOCUMENT_LEGACY_REQUIRES_ADOPTION', '55000');
  UPDATE public.generated_documents SET client_name = 'Different browser-selected legal party' WHERE id = doc_id;
  PERFORM pg_temp.crm_assert((SELECT client_id IS NULL FROM public.generated_documents WHERE id = doc_id),
    'browser party edit clears previous API client UUID');
END;
$$;

DO $$
DECLARE
  payload jsonb := pg_temp.crm_test_payload('invoice', 'SQL-VALIDATION/2026', 'd0c00000-0000-4000-8000-000000000010');
  req uuid := 'd0c00000-0000-4000-8000-000000000110';
  linked_contract uuid;
  act_payload jsonb;
BEGIN
  PERFORM pg_temp.crm_expect_error(format('SELECT pg_temp.crm_save_fixture(%L,NULL,NULL,%L::jsonb,''{}'')', req,
    payload || '{"actor_id":"d0c00000-0000-4000-8000-000000000001"}'::jsonb), 'CRM_INVALID_PAYLOAD_FIELDS', '22023');
  PERFORM pg_temp.crm_expect_error(format('SELECT pg_temp.crm_save_fixture(%L,NULL,NULL,%L::jsonb,''{}'')', req,
    payload || '{"client_name":"Wrong client"}'::jsonb), 'CRM_CLIENT_SNAPSHOT_MISMATCH', '22023');
  PERFORM pg_temp.crm_expect_error(format('SELECT pg_temp.crm_save_fixture(%L,NULL,NULL,%L::jsonb,''{}'')', req,
    payload || '{"total_amount":-1}'::jsonb), 'CRM_INVALID_AMOUNT', '22023');
  PERFORM pg_temp.crm_expect_error(format('SELECT pg_temp.crm_save_fixture(%L,NULL,NULL,%L::jsonb,''{}'')', req,
    payload || '{"total_amount":1001}'::jsonb), 'CRM_TOTAL_MISMATCH', '22023');
  PERFORM pg_temp.crm_expect_error(format('SELECT pg_temp.crm_save_fixture(%L,NULL,NULL,%L::jsonb,''{}'')', req,
    pg_temp.crm_test_payload('act', 'SQL-ACT-MISSING/2026', 'd0c00000-0000-4000-8000-000000000010')), 'CRM_ACT_CONTRACT_REQUIRED', '22023');
  PERFORM pg_temp.crm_expect_error(format('SELECT pg_temp.crm_save_fixture(%L,NULL,NULL,%L::jsonb,''{}'')', req,
    payload || '{"contract_id":"d0c00000-0000-4000-8000-000000000020"}'::jsonb), 'CRM_CONTRACT_ARCHIVED', '55000');
  PERFORM pg_temp.crm_expect_error(format('SELECT pg_temp.crm_save_fixture(%L,NULL,NULL,%L::jsonb,''{}'')', req,
    payload || '{"contract_id":"d0c00000-0000-4000-8000-000000000021"}'::jsonb), 'CRM_CONTRACT_CLIENT_MISMATCH', '22023');
  PERFORM pg_temp.crm_assert(NOT EXISTS (SELECT 1 FROM public.crm_document_api_requests WHERE request_id = req), 'failed validation leaves no ledger');

  -- Standalone invoices are supported; acts require an explicit contract.
  PERFORM pg_temp.crm_save_fixture(req, NULL, NULL, payload, '{"type":"invoice","number":"SQL-VALIDATION/2026"}');
  PERFORM pg_temp.crm_assert((SELECT count(*) = 1 FROM public.generated_documents WHERE doc_number = 'SQL-VALIDATION/2026'), 'standalone invoice persists');
  SELECT id INTO linked_contract FROM public.contracts WHERE contract_number = 'SQL-CONTRACT/2026';
  act_payload := pg_temp.crm_test_payload('act', 'SQL-ACT/2026',
    'd0c00000-0000-4000-8000-000000000010', 'API SQL test client', linked_contract);
  PERFORM pg_temp.crm_save_fixture('d0c00000-0000-4000-8000-000000000113', NULL, NULL,
    act_payload, '{"type":"act","number":"SQL-ACT/2026"}');
  PERFORM pg_temp.crm_assert((SELECT contract_id = linked_contract FROM public.generated_documents
    WHERE doc_type = 'act' AND doc_number = 'SQL-ACT/2026'), 'act links the explicit contract');

  INSERT INTO public.clients (id, name)
    VALUES ('d0c00000-0000-4000-8000-000000000012', 'API SQL test client');
  PERFORM pg_temp.crm_expect_error(format('SELECT pg_temp.crm_save_fixture(%L,NULL,NULL,%L::jsonb,''{}'')',
    'd0c00000-0000-4000-8000-000000000114', act_payload || '{"doc_number":"SQL-AMBIGUOUS/2026"}'::jsonb),
    'CRM_CONTRACT_CLIENT_AMBIGUOUS', '22023');
  DELETE FROM public.clients WHERE id = 'd0c00000-0000-4000-8000-000000000012';

  -- This conflict happens after the pending ledger has been inserted. It must
  -- roll back that ledger as well as any partial document/contract changes.
  PERFORM pg_temp.crm_expect_error(format('SELECT pg_temp.crm_save_fixture(%L,NULL,NULL,%L::jsonb,''{}'')',
    'd0c00000-0000-4000-8000-000000000115', pg_temp.crm_test_payload('contract', 'SQL-OTHER/2026',
      'd0c00000-0000-4000-8000-000000000010')), 'CRM_CONTRACT_NUMBER_CONFLICT', '23505');
  PERFORM pg_temp.crm_assert(NOT EXISTS (SELECT 1 FROM public.crm_document_api_requests
    WHERE request_id = 'd0c00000-0000-4000-8000-000000000115'), 'late contract error rolls back pending ledger');
  PERFORM pg_temp.crm_assert(NOT EXISTS (SELECT 1 FROM public.generated_documents
    WHERE doc_type = 'contract' AND doc_number = 'SQL-OTHER/2026'), 'late contract error leaves no generated document');

  UPDATE public.generated_documents SET html_content = '<p>Historic corrected A</p>'
    WHERE id = 'd0c00000-0000-4000-8000-000000000030';
  PERFORM pg_temp.crm_assert((SELECT snapshot ->> 'html_content' = '<p>Historic original A</p>'
    FROM public.crm_document_revisions WHERE document_id = 'd0c00000-0000-4000-8000-000000000030' AND revision = 1), 'first legacy update preserves original');
  PERFORM pg_temp.crm_assert((SELECT snapshot ->> 'html_content' = '<p>Historic corrected A</p>'
    FROM public.crm_document_revisions WHERE document_id = 'd0c00000-0000-4000-8000-000000000030' AND revision = 2), 'legacy duplicate may receive unrelated update');
  PERFORM pg_temp.crm_expect_error($q$
    INSERT INTO public.generated_documents (doc_type, doc_number, client_name, html_content)
    VALUES ('invoice', 'SQL-LEGACY-DUP/2026', 'API SQL test client', '<p>New collision</p>')
  $q$, 'CRM_DOCUMENT_NUMBER_CONFLICT', '23505');
  PERFORM pg_temp.crm_expect_error(format('SELECT pg_temp.crm_save_fixture(%L,NULL,NULL,%L::jsonb,''{}'')',
    'd0c00000-0000-4000-8000-000000000111', payload || '{"doc_number":"SQL-LEGACY-DUP/2026"}'::jsonb), 'CRM_DOCUMENT_NUMBER_CONFLICT', '23505');
END;
$$;

DO $$
DECLARE
  original_payload jsonb;
  original_input jsonb;
  altered_payload jsonb;
  saved_result jsonb;
  req uuid := 'd0c00000-0000-4000-8000-000000000120';
BEGIN
  SELECT request -> 'payload', request -> 'input' INTO original_payload, original_input
    FROM public.crm_document_api_requests WHERE request_id = 'd0c00000-0000-4000-8000-000000000110';
  PERFORM pg_temp.crm_expect_error(format('SELECT public.crm_save_document(%L,NULL,NULL,%L::jsonb,%L::jsonb)',
    req, original_payload, original_input || '{"date":"2026-10-09"}'::jsonb), 'CRM_INPUT_PAYLOAD_MISMATCH', '22023');
  PERFORM pg_temp.crm_expect_error(format('SELECT public.crm_save_document(%L,NULL,NULL,%L::jsonb,%L::jsonb)',
    req, jsonb_set(original_payload, '{metadata,documentInput}', '{}'::jsonb), original_input), 'CRM_INPUT_PAYLOAD_MISMATCH', '22023');
  PERFORM pg_temp.crm_expect_error(format('SELECT public.crm_save_document(%L,NULL,NULL,%L::jsonb,%L::jsonb)',
    req, original_payload || '{"total_amount":800}'::jsonb, original_input), 'CRM_TOTAL_MISMATCH', '22023');

  altered_payload := pg_temp.crm_test_payload('invoice', 'SQL-PERCENT/2026', 'd0c00000-0000-4000-8000-000000000010');
  saved_result := pg_temp.crm_save_fixture(req, NULL, NULL, altered_payload,
    '{"discount":{"kind":"percent","value":10}}');
  PERFORM pg_temp.crm_assert((SELECT total_amount = 900 FROM public.generated_documents
    WHERE id = (saved_result ->> 'documentId')::uuid), 'percentage discount agrees with metadata and total');
  altered_payload := pg_temp.crm_test_payload('contract', 'SQL-CONTRACT-DISCOUNT/2026', 'd0c00000-0000-4000-8000-000000000010');
  PERFORM pg_temp.crm_expect_error(format('SELECT pg_temp.crm_save_fixture(%L,NULL,NULL,%L::jsonb,%L::jsonb)',
    'd0c00000-0000-4000-8000-000000000121', altered_payload,
    '{"discount":{"kind":"amount","value":10}}'::jsonb), 'CRM_INVALID_DISCOUNT', '22023');

  -- Per-line half-up calculation is shared with the TypeScript domain.
  altered_payload := pg_temp.crm_test_payload('invoice', 'SQL-ROUNDING/2026', 'd0c00000-0000-4000-8000-000000000010')
    || '{"total_amount":0.01,"services":[{"name":"Fractional synthetic service","qty":0.005,"price":1}]}';
  altered_payload := jsonb_set(altered_payload, '{metadata,discountAmount}', '0');
  PERFORM pg_temp.crm_save_fixture('d0c00000-0000-4000-8000-000000000122', NULL, NULL, altered_payload);

  PERFORM pg_temp.crm_expect_error($q$
    INSERT INTO public.contracts (client_name, contract_number) VALUES ('API SQL test client', 'SQL-CONTRACT/2026')
  $q$, 'CRM_CONTRACT_NUMBER_CONFLICT', '23505');
  PERFORM pg_temp.crm_expect_error($q$
    UPDATE public.contracts SET contract_number = 'SQL-CONTRACT/2026'
    WHERE id = 'd0c00000-0000-4000-8000-000000000021'
  $q$, 'CRM_CONTRACT_NUMBER_CONFLICT', '23505');

  -- A legacy document can be deleted before it was ever updated after migration.
  DELETE FROM public.generated_documents WHERE id = 'd0c00000-0000-4000-8000-000000000031';
  PERFORM pg_temp.crm_assert((SELECT snapshot ->> 'html_content' = '<p>Historic original B</p>'
    FROM public.crm_document_revisions WHERE document_id = 'd0c00000-0000-4000-8000-000000000031' AND revision = 1),
    'deletion preserves previously unsnapshotted legacy document');
END;
$$;

DO $$
DECLARE
  payload jsonb := pg_temp.crm_test_payload('contract', 'SQL-SERVICE-PERIOD/2026', 'd0c00000-0000-4000-8000-000000000010');
  saved jsonb;
  doc_id uuid;
  linked_contract uuid;
BEGIN
  saved := pg_temp.crm_save_fixture('d0c00000-0000-4000-8000-000000000130', NULL, NULL, payload,
    '{"servicePeriod":{"start":"2026-09-28","end":"2026-12-31","noDeadline":false}}');
  doc_id := (saved ->> 'documentId')::uuid;
  linked_contract := (saved ->> 'contractId')::uuid;
  PERFORM pg_temp.crm_assert((SELECT service_start = '2026-09-28'::date AND service_end = '2026-12-31'::date
    AND NOT service_no_deadline AND paid_until IS NULL FROM public.contracts WHERE id = linked_contract),
    'explicit service period saves separately from payment date');
  payload := payload || jsonb_build_object('contract_id', linked_contract);
  -- A date-only API revision carries its old period while a human may have
  -- independently edited the Contracts tab since the generated revision.
  UPDATE public.contracts SET service_end = '2027-03-31' WHERE id = linked_contract;
  PERFORM pg_temp.crm_expect_error(format('SELECT pg_temp.crm_save_fixture(%L,%L,1,%L::jsonb,%L::jsonb)',
    'd0c00000-0000-4000-8000-000000000136', doc_id, payload || '{"doc_date":"2026-10-05"}'::jsonb,
    '{"servicePeriod":{"start":"2026-09-28","end":"2026-12-31","noDeadline":false}}'::jsonb),
    'CRM_LINKED_CONTRACT_CHANGED', '40001');
  PERFORM pg_temp.crm_assert((SELECT service_end = '2027-03-31'::date FROM public.contracts WHERE id = linked_contract),
    'stale API date change must not revert manually updated CRM service period');
  PERFORM pg_temp.crm_assert((SELECT revision = 1 FROM public.generated_documents WHERE id = doc_id),
    'contract drift failure does not advance generated revision');
  PERFORM pg_temp.crm_assert(NOT EXISTS (SELECT 1 FROM public.crm_document_api_requests
    WHERE request_id = 'd0c00000-0000-4000-8000-000000000136'), 'contract drift failure leaves no completed operation');
  UPDATE public.contracts SET service_end = '2026-12-31', amount = 1200 WHERE id = linked_contract;
  PERFORM pg_temp.crm_expect_error(format('SELECT pg_temp.crm_save_fixture(%L,%L,1,%L::jsonb)',
    'd0c00000-0000-4000-8000-000000000137', doc_id, payload), 'CRM_LINKED_CONTRACT_CHANGED', '40001');
  PERFORM pg_temp.crm_assert((SELECT amount = 1200 FROM public.contracts WHERE id = linked_contract), 'manual contract amount is retained');
  UPDATE public.contracts SET amount = 1000, contract_date = '2026-11-01' WHERE id = linked_contract;
  PERFORM pg_temp.crm_expect_error(format('SELECT pg_temp.crm_save_fixture(%L,%L,1,%L::jsonb)',
    'd0c00000-0000-4000-8000-000000000138', doc_id, payload || '{"doc_date":"2026-10-05"}'::jsonb),
    'CRM_LINKED_CONTRACT_CHANGED', '40001');
  PERFORM pg_temp.crm_assert((SELECT contract_date = '2026-11-01'::date FROM public.contracts WHERE id = linked_contract), 'manual contract date is retained');
  UPDATE public.contracts SET contract_date = '2026-09-28', notes = 'Independent manual note',
    payment_status = 'оплачено', appendix_ref = 'Independent manual appendix' WHERE id = linked_contract;
  PERFORM pg_temp.crm_expect_error(format('SELECT pg_temp.crm_save_fixture(%L,%L,1,%L::jsonb,%L::jsonb)',
    'd0c00000-0000-4000-8000-000000000131', doc_id, payload, '{"deadline":"Changed textual service period"}'::jsonb),
    'CRM_SERVICE_PERIOD_REQUIRED', '22023');
  saved := pg_temp.crm_save_fixture('d0c00000-0000-4000-8000-000000000132', doc_id, 1, payload,
    '{"deadline":"Changed textual service period","servicePeriod":{"start":"2026-10-01","noDeadline":true}}');
  PERFORM pg_temp.crm_assert((SELECT service_start = '2026-10-01'::date AND service_end IS NULL AND service_no_deadline
    AND paid_until IS NULL FROM public.contracts WHERE id = linked_contract), 'explicit no-deadline clears service end only');
  PERFORM pg_temp.crm_assert((SELECT notes = 'Independent manual note' AND payment_status = 'оплачено'
    AND appendix_ref = 'Independent manual appendix' FROM public.contracts WHERE id = linked_contract),
    'unrelated manual notes, payment status and appendix neither conflict nor change');
  PERFORM pg_temp.crm_expect_error(format('SELECT pg_temp.crm_save_fixture(%L,%L,2,%L::jsonb,%L::jsonb)',
    'd0c00000-0000-4000-8000-000000000133', doc_id, payload,
    '{"servicePeriod":{"start":"2026-12-31","end":"2026-09-28","noDeadline":false}}'::jsonb),
    'CRM_INVALID_SERVICE_PERIOD', '22023');
  PERFORM pg_temp.crm_expect_error(format('SELECT pg_temp.crm_save_fixture(%L,%L,2,%L::jsonb,%L::jsonb)',
    'd0c00000-0000-4000-8000-000000000134', doc_id, payload,
    '{"servicePeriod":{"end":"2026-12-31","noDeadline":true}}'::jsonb), 'CRM_INVALID_SERVICE_PERIOD', '22023');
  PERFORM pg_temp.crm_expect_error(format('SELECT pg_temp.crm_save_fixture(%L,%L,2,%L::jsonb,%L::jsonb)',
    'd0c00000-0000-4000-8000-000000000135', doc_id, payload,
    '{"servicePeriod":{"start":"2026-09-28","noDeadline":"false"}}'::jsonb), 'CRM_INVALID_SERVICE_PERIOD', '22023');

  -- The September schema's original ensure_contract_client trigger still works.
  INSERT INTO public.contracts (client_name, contract_number)
    VALUES ('Brand new synthetic UI client', 'SQL-UI-AUTOCREATE/2026');
  PERFORM pg_temp.crm_assert((SELECT count(*) = 1 FROM public.clients WHERE name = 'Brand new synthetic UI client'),
    'actual ensure_contract_client trigger remains compatible');
END;
$$;

SELECT pg_temp.crm_expect_error($q$
  UPDATE public.crm_document_revisions SET snapshot = '{}' WHERE document_id = 'd0c00000-0000-4000-8000-000000000030'
$q$, '', '42501');
SELECT pg_temp.crm_expect_error($q$
  DELETE FROM public.crm_document_revisions WHERE document_id = 'd0c00000-0000-4000-8000-000000000030'
$q$, '', '42501');
SELECT pg_temp.crm_expect_error($q$
  UPDATE public.crm_document_api_requests SET result = '{}' WHERE request_id = 'd0c00000-0000-4000-8000-000000000102'
$q$, '', '42501');

DO $$
DECLARE
  before_documents bigint;
  before_requests bigint;
  candidate jsonb;
  template_name text;
  type_label text;
  payload jsonb;
  saved jsonb;
  next_saved jsonb;
BEGIN
  PERFORM pg_temp.crm_assert(public.crm_suggest_document_number('invoice', '2038-01-01') ->> 'number' = '001/2038',
    'empty year starts at 001');
  INSERT INTO public.generated_documents (doc_type, doc_number, client_name, html_content, services) VALUES
    ('invoice', '009/2038', 'API SQL test client', '<p>Number fixture</p>', '[]'),
    ('invoice', ' 042-2038 ', 'Another API SQL test client', '<p>Number fixture</p>', '[]'),
    ('invoice', '999/2037', 'API SQL test client', '<p>Number fixture</p>', '[]'),
    ('act', '900/2038', 'API SQL test client', '<p>Number fixture</p>', '[]'),
    ('invoice', 'TEST-9999/2038', 'API SQL test client', '<p>Number fixture</p>', '[]'),
    ('invoice', '9999/2038-extra', 'API SQL test client', '<p>Number fixture</p>', '[]'),
    ('contract', '100/2038', 'API SQL test client', '<p>Number fixture</p>', '[]');
  INSERT INTO public.contracts (client_name, contract_number) VALUES
    ('API SQL test client', '999-2038'), ('API SQL test client', '9999/2037');
  SELECT count(*) INTO before_documents FROM public.generated_documents;
  SELECT count(*) INTO before_requests FROM public.crm_document_api_requests;
  candidate := public.crm_suggest_document_number('invoice', '2038-09-28');
  PERFORM pg_temp.crm_assert(candidate ->> 'number' = '043/2038' AND candidate -> 'reserved' = 'false'::jsonb,
    'global candidate includes other clients and trimmed legacy hyphens, ignores type/year and malformed numbers');
  PERFORM pg_temp.crm_assert(public.crm_suggest_document_number('invoice', '2038-09-28') = candidate,
    'suggestion is not a reservation');
  PERFORM pg_temp.crm_assert(public.crm_suggest_document_number('contract', '2038-09-28') ->> 'number' = '1000/2038',
    'contract numbering includes card records and does not truncate beyond three digits');
  PERFORM pg_temp.crm_assert(public.crm_suggest_document_number('act', '2038-09-28') ->> 'number' = '901/2038',
    'act sequence is independent');
  PERFORM pg_temp.crm_assert((SELECT count(*) = before_documents FROM public.generated_documents)
    AND (SELECT count(*) = before_requests FROM public.crm_document_api_requests), 'suggestions write no document or request');
  INSERT INTO public.generated_documents (doc_type, doc_number, client_name, html_content, services)
    VALUES ('invoice', '043/2038', 'Another API SQL test client', '<p>Competing writer fixture</p>', '[]');
  payload := pg_temp.crm_test_payload('invoice', '043/2038', 'd0c00000-0000-4000-8000-000000000010')
    || '{"doc_date":"2038-09-28"}'::jsonb;
  PERFORM pg_temp.crm_expect_error(format('SELECT pg_temp.crm_save_fixture(%L,NULL,NULL,%L::jsonb)',
    'd0c00000-0000-4000-8000-000000000139', payload), 'CRM_DOCUMENT_NUMBER_CONFLICT', '23505');
  PERFORM pg_temp.crm_assert(public.crm_suggest_document_number('invoice', '2038-09-28') ->> 'number' = '044/2038'
    AND NOT EXISTS (SELECT 1 FROM public.crm_document_api_requests WHERE request_id = 'd0c00000-0000-4000-8000-000000000139'),
    'collision permits fresh suggestion and leaves failed request unpersisted');
  PERFORM pg_temp.crm_expect_error($q$ SELECT public.crm_suggest_document_number('unknown','2038-09-28') $q$,
    'CRM_INVALID_DOCUMENT', '22023');
  PERFORM pg_temp.crm_expect_error($q$ SELECT public.crm_suggest_document_number('invoice',NULL) $q$,
    'CRM_INVALID_DOCUMENT', '22023');

  FOREACH template_name IN ARRAY ARRAY['standard', 'frdo', 'nmo'] LOOP
    type_label := CASE template_name WHEN 'standard' THEN 'Сайт' WHEN 'frdo' THEN 'ФРДО' ELSE 'НМО' END;
    payload := pg_temp.crm_test_payload('contract', 'SQL-TEMPLATE-' || template_name || '/2026', 'd0c00000-0000-4000-8000-000000000010');
    saved := pg_temp.crm_save_fixture(gen_random_uuid(), NULL, NULL, payload, jsonb_build_object('template',template_name));
    PERFORM pg_temp.crm_assert((SELECT contract_type = type_label FROM public.contracts WHERE id = (saved ->> 'contractId')::uuid),
      'new contract card has exact existing UI type label ' || template_name);
    payload := payload || jsonb_build_object('contract_id',saved -> 'contractId','doc_date','2026-10-01');
    next_saved := pg_temp.crm_save_fixture(gen_random_uuid(), (saved ->> 'documentId')::uuid, 1, payload, jsonb_build_object('template',template_name));
    PERFORM pg_temp.crm_assert((next_saved ->> 'revision')::int = 2 AND
      (SELECT contract_type = type_label FROM public.contracts WHERE id = (saved ->> 'contractId')::uuid), 'revision retains contract type');
    PERFORM pg_temp.crm_expect_error(format('SELECT pg_temp.crm_save_fixture(%L,%L,2,%L::jsonb,%L::jsonb)',
      gen_random_uuid(), saved ->> 'documentId', payload, jsonb_build_object('template',CASE template_name WHEN 'standard' THEN 'frdo' ELSE 'standard' END)),
      'CRM_CONTRACT_TEMPLATE_IMMUTABLE', '22023');
    UPDATE public.contracts SET contract_type = 'Прочее' WHERE id = (saved ->> 'contractId')::uuid;
    PERFORM pg_temp.crm_expect_error(format('SELECT pg_temp.crm_save_fixture(%L,%L,2,%L::jsonb,%L::jsonb)',
      gen_random_uuid(), saved ->> 'documentId', payload, jsonb_build_object('template',template_name)),
      'CRM_LINKED_CONTRACT_CHANGED', '40001');
  END LOOP;
END;
$$;

RESET ROLE;
-- Even a database-owner UPDATE cannot accidentally rewrite retained evidence.
SELECT pg_temp.crm_expect_error($q$
  UPDATE public.crm_document_revisions SET snapshot = '{}' WHERE document_id = 'd0c00000-0000-4000-8000-000000000030'
$q$, 'CRM_REVISION_IMMUTABLE', '55000');
SELECT pg_temp.crm_expect_error($q$
  DELETE FROM public.crm_document_api_requests WHERE request_id = 'd0c00000-0000-4000-8000-000000000102'
$q$, 'CRM_REQUEST_IMMUTABLE', '55000');

SET LOCAL ROLE anon;
SELECT pg_temp.crm_expect_error($q$
  SELECT public.crm_suggest_document_number('invoice', '2026-09-28')
$q$, '', '42501');
SELECT pg_temp.crm_expect_error($q$
  SELECT pg_temp.crm_save_fixture('d0c00000-0000-4000-8000-000000000112', NULL, NULL, '{}', '{}')
$q$, '', '42501');
RESET ROLE;

SELECT 'crm_document_api SQL integration assertions passed; rolling back all fixtures' AS test_result;
ROLLBACK;

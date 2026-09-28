-- Invoice acts are exact, versioned drafts. Synthetic records are rolled back.
BEGIN;
CREATE FUNCTION pg_temp.invoice_act_assert(ok boolean, description text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF ok IS DISTINCT FROM true THEN RAISE EXCEPTION 'ASSERTION FAILED: %', description; END IF;
END;
$$;
CREATE FUNCTION pg_temp.invoice_act_error(statement text, expected text)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE actual text;
BEGIN
  BEGIN EXECUTE statement;
  EXCEPTION WHEN OTHERS THEN GET STACKED DIAGNOSTICS actual = MESSAGE_TEXT;
  END;
  IF actual IS NULL OR position(expected IN actual) = 0 THEN
    RAISE EXCEPTION 'EXPECTED ERROR %, GOT %', expected, actual;
  END IF;
END;
$$;
CREATE FUNCTION pg_temp.invoice_act_save(request_id uuid, document_id uuid DEFAULT NULL,
  revision integer DEFAULT NULL, patch jsonb DEFAULT '{}', metadata_patch jsonb DEFAULT '{}')
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE
  command jsonb := '{"type":"act","clientId":"d0c10000-0000-4000-8000-000000000010","date":"2026-09-29","number":"INVOICE-ACT-TEST","services":[{"name":"Synthetic service only","qty":1,"price":3000}],"invoiceBasis":{"source":"sintagma","sourceKind":"subscription_invoice","sourceId":"d0c10000-0000-4000-8000-000000000020","organizationId":"d0c10000-0000-4000-8000-000000000021","number":"SYNTHETIC-INVOICE-1","date":"2026-09-23","amount":3000,"currency":"RUB","payerName":"Synthetic invoice act client","payerInn":"0000000000"}}'::jsonb || patch;
  payload jsonb;
BEGIN
  payload := jsonb_build_object('doc_type', command -> 'type', 'doc_number', command -> 'number',
    'doc_date', command -> 'date', 'client_id', command -> 'clientId',
    'client_name', 'Synthetic invoice act client', 'client_inn', '0000000000',
    'contract_id', command -> 'contractId', 'total_amount', (command -> 'services' -> 0 ->> 'price')::numeric,
    'services', command -> 'services', 'html_content', '<p>Synthetic invoice act test</p>',
    'metadata', jsonb_build_object('documentInput', command, 'discountAmount', 0,
      'invoiceBasisSnapshot', command -> 'invoiceBasis', 'invoiceBasisProvenance', 'explicit-source-export') || metadata_patch);
  RETURN public.crm_save_document(request_id, document_id, revision, payload, command);
END;
$$;

INSERT INTO auth.users(id,email,raw_user_meta_data) VALUES
  ('d0c10000-0000-4000-8000-000000000001','invoice-act-test@example.invalid','{}');
INSERT INTO public.user_roles(user_id,role) VALUES ('d0c10000-0000-4000-8000-000000000001','admin');
INSERT INTO public.clients(id,name,inn) VALUES
  ('d0c10000-0000-4000-8000-000000000010','Synthetic invoice act client','0000000000');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','d0c10000-0000-4000-8000-000000000001',true);

DO $$
DECLARE
  result jsonb;
  doc_id uuid;
  basis jsonb := '{"source":"sintagma","sourceKind":"subscription_invoice","sourceId":"d0c10000-0000-4000-8000-000000000020","organizationId":"d0c10000-0000-4000-8000-000000000021","number":"SYNTHETIC-INVOICE-1","date":"2026-09-23","amount":3000,"currency":"RUB","payerName":"Synthetic invoice act client","payerInn":"0000000000"}';
  invalid_patch jsonb;
BEGIN
  PERFORM pg_temp.invoice_act_error(format('SELECT pg_temp.invoice_act_save(%L,NULL,NULL,%L::jsonb)',
    gen_random_uuid(), jsonb_build_object('invoiceBasis', basis || '{"payerInn":"1111111111"}')), 'CRM_INVOICE_PAYER_MISMATCH');
  PERFORM pg_temp.invoice_act_error(format('SELECT pg_temp.invoice_act_save(%L,NULL,NULL,%L::jsonb)',
    gen_random_uuid(), jsonb_build_object('invoiceBasis', basis || '{"amount":3100}')), 'CRM_INVOICE_AMOUNT_MISMATCH');
  PERFORM pg_temp.invoice_act_error(format('SELECT pg_temp.invoice_act_save(%L,NULL,NULL,%L::jsonb)',
    gen_random_uuid(), '{"date":"2026-09-22"}'), 'CRM_ACT_BEFORE_INVOICE');
  PERFORM pg_temp.invoice_act_error(format('SELECT pg_temp.invoice_act_save(%L,NULL,NULL,%L::jsonb)',
    gen_random_uuid(), '{"contractId":"d0c10000-0000-4000-8000-000000000099"}'), 'CRM_INVALID_INVOICE_BASIS');
  PERFORM pg_temp.invoice_act_error(format('SELECT pg_temp.invoice_act_save(%L,NULL,NULL,%L::jsonb,%L::jsonb)',
    gen_random_uuid(), '{}', '{"invoiceBasisProvenance":"server-verified"}'), 'CRM_INVOICE_SNAPSHOT_MISMATCH');
  PERFORM pg_temp.invoice_act_error(format('SELECT pg_temp.invoice_act_save(%L,NULL,NULL,%L::jsonb,%L::jsonb)',
    gen_random_uuid(), '{}', '{"invoiceBasisSnapshot":{}}'), 'CRM_INVOICE_SNAPSHOT_MISMATCH');
  FOREACH invalid_patch IN ARRAY ARRAY[
    '{"sourceKind":"company_document"}'::jsonb, '{"source":"manual"}', '{"currency":"USD"}',
    '{"sourceId":"not-a-uuid"}', '{"organizationId":null}', '{"payerName":null}',
    '{"number":""}', '{"date":"2026-02-30"}', '{"amount":"3000"}', '{"extra":true}'
  ] LOOP
    PERFORM pg_temp.invoice_act_error(format('SELECT pg_temp.invoice_act_save(%L,NULL,NULL,%L::jsonb)',
      gen_random_uuid(), jsonb_build_object('invoiceBasis', basis || invalid_patch)), '');
  END LOOP;

  result := pg_temp.invoice_act_save('d0c10000-0000-4000-8000-000000000101');
  doc_id := (result ->> 'documentId')::uuid;
  PERFORM pg_temp.invoice_act_assert(result ->> 'revision' = '1' AND result ->> 'contractId' IS NULL,
    'invoice act is saved without creating a contract');
  PERFORM pg_temp.invoice_act_assert((SELECT d.client_id = 'd0c10000-0000-4000-8000-000000000010'
    AND d.total_amount = 3000 AND d.metadata -> 'invoiceBasisSnapshot' = basis
    FROM public.generated_documents AS d WHERE d.id = doc_id), 'stored act retains exact payer and source basis');
  PERFORM pg_temp.invoice_act_assert((SELECT count(*) = 0 FROM public.contracts
    WHERE client_name = 'Synthetic invoice act client'), 'no invented contract row');
  PERFORM pg_temp.invoice_act_assert(pg_temp.invoice_act_save('d0c10000-0000-4000-8000-000000000101')
    = result || '{"replayed":true}'::jsonb, 'retry returns same saved act');
  PERFORM pg_temp.invoice_act_error(format('SELECT pg_temp.invoice_act_save(%L,NULL,NULL,%L::jsonb)',
    gen_random_uuid(), '{"number":"ANOTHER-ACT-SAME-INVOICE"}'), 'CRM_INVOICE_ACT_ALREADY_EXISTS');
  PERFORM pg_temp.invoice_act_error(format('SELECT pg_temp.invoice_act_save(%L,%L,1,%L::jsonb)',
    gen_random_uuid(), doc_id, jsonb_build_object('invoiceBasis', basis || '{"sourceId":"d0c10000-0000-4000-8000-000000000022"}')),
    'CRM_INVOICE_BASIS_IMMUTABLE');
  result := pg_temp.invoice_act_save(gen_random_uuid(), doc_id, 1, '{"date":"2026-09-30"}');
  PERFORM pg_temp.invoice_act_assert(result ->> 'revision' = '2', 'explicit date change creates revision two');
  PERFORM pg_temp.invoice_act_assert((SELECT count(*) = 2 FROM public.crm_document_revisions AS r WHERE r.document_id = doc_id),
    'both original and amended act are retained');
  PERFORM pg_temp.invoice_act_assert((SELECT r.input -> 'invoiceBasis' = basis
    FROM public.crm_document_revisions AS r WHERE r.document_id = doc_id AND r.revision = 1), 'original basis preserved');
END;
$$;
ROLLBACK;

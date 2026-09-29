-- Synthetic API contract + invoice survive a client-card rename; rollback only.
BEGIN;
CREATE FUNCTION pg_temp.rename_assert(ok boolean, description text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF ok IS DISTINCT FROM true THEN RAISE EXCEPTION 'ASSERTION FAILED: %', description; END IF;
END;
$$;
CREATE FUNCTION pg_temp.rename_error(statement text, expected text)
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
CREATE FUNCTION pg_temp.rename_save(document_id uuid, revision integer, kind text, number text,
  contract uuid DEFAULT NULL, party text DEFAULT 'Rename SQL original client',
  client uuid DEFAULT 'd0c50000-0000-4000-8000-000000000010')
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE command jsonb; payload jsonb;
BEGIN
  command := jsonb_build_object('type',kind,'number',number,'date','2026-09-30','clientId',client,
    'services',jsonb_build_array(jsonb_build_object('name','Synthetic rename fixture','qty',1,'price',1000)));
  IF kind = 'contract' THEN
    command := command || '{"template":"standard","subject":"Synthetic subject","deadline":"Synthetic period","paymentTerms":"Synthetic payment terms"}'::jsonb;
  ELSIF contract IS NOT NULL THEN command := command || jsonb_build_object('contractId',contract); END IF;
  payload := jsonb_build_object('doc_type',kind,'doc_number',number,'doc_date','2026-09-30',
    'client_id',client,'client_name',party,'client_inn',NULL,'contract_id',contract,'total_amount',1000,
    'services',command->'services','html_content','<p>Immutable synthetic original party</p>',
    'metadata',jsonb_build_object('documentInput',command,'discountAmount',0,
      'clientSnapshot',jsonb_build_object('name',party),'companySnapshot',jsonb_build_object('name','Synthetic executor')));
  RETURN public.crm_save_document(gen_random_uuid(),document_id,revision,payload,command);
END;
$$;
INSERT INTO auth.users(id,email,raw_user_meta_data) VALUES
  ('d0c50000-0000-4000-8000-000000000001','rename-sql@example.invalid','{}');
INSERT INTO public.user_roles(user_id,role) VALUES ('d0c50000-0000-4000-8000-000000000001','admin');
INSERT INTO public.clients(id,name) VALUES
  ('d0c50000-0000-4000-8000-000000000010','Rename SQL original client'),
  ('d0c50000-0000-4000-8000-000000000011','Rename SQL unrelated client');
INSERT INTO public.contracts(id,client_name,contract_number,contract_date,amount) VALUES
  ('d0c50000-0000-4000-8000-000000000020','Rename SQL unrelated client','RENAME-UNRELATED','2026-09-30',1000);
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','d0c50000-0000-4000-8000-000000000001',true);
DO $$
DECLARE contract_doc uuid; invoice_doc uuid; contract_id uuid; result jsonb;
BEGIN
  result := pg_temp.rename_save(NULL,NULL,'contract','RENAME-CONTRACT');
  contract_doc := (result->>'documentId')::uuid; contract_id := (result->>'contractId')::uuid;
  result := pg_temp.rename_save(NULL,NULL,'invoice','RENAME-INVOICE',contract_id);
  invoice_doc := (result->>'documentId')::uuid;
  result := public.crm_save_client(gen_random_uuid(),'d0c50000-0000-4000-8000-000000000010',1,
    '{"name":"Rename SQL current client"}',false);
  PERFORM pg_temp.rename_assert(result->>'renamedContracts'='1','rename preserves exactly one legacy contract association');
  PERFORM pg_temp.rename_assert((SELECT count(*)=2 FROM public.generated_documents d
    WHERE d.id IN (contract_doc,invoice_doc) AND d.revision=1 AND d.client_name='Rename SQL original client'
      AND d.client_id='d0c50000-0000-4000-8000-000000000010'), 'rename retains client UUIDs and original legal snapshots');
  result := pg_temp.rename_save(contract_doc,1,'contract','RENAME-CONTRACT',contract_id);
  PERFORM pg_temp.rename_assert(result->>'revision'='2','contract amendment works after card rename');
  result := pg_temp.rename_save(invoice_doc,1,'invoice','RENAME-INVOICE',contract_id);
  PERFORM pg_temp.rename_assert(result->>'revision'='2','linked invoice amendment works after card rename');
  PERFORM pg_temp.rename_assert((SELECT count(*)=2 FROM public.generated_documents d
    WHERE d.id IN (contract_doc,invoice_doc) AND d.client_name='Rename SQL original client'
      AND d.metadata->'clientSnapshot'->>'name'='Rename SQL original client'), 'amendment never substitutes renamed legal party');

  PERFORM pg_temp.rename_error(format('SELECT pg_temp.rename_save(%L,2,%L,%L,%L)',
    invoice_doc,'invoice','RENAME-INVOICE','d0c50000-0000-4000-8000-000000000020'), 'CRM_DOCUMENT_IDENTITY_IMMUTABLE');
  PERFORM pg_temp.rename_error(format('SELECT pg_temp.rename_save(%L,2,%L,%L,%L,%L,%L)',
    invoice_doc,'invoice','RENAME-INVOICE',contract_id,'Rename SQL original client',
    'd0c50000-0000-4000-8000-000000000011'), 'CRM_DOCUMENT_IDENTITY_IMMUTABLE');
  PERFORM pg_temp.rename_error(format('SELECT pg_temp.rename_save(NULL,NULL,%L,%L,%L)',
    'invoice','RENAME-OLD-NAME-NEW-DOCUMENT',contract_id), 'CRM_CLIENT_SNAPSHOT_MISMATCH');
  result := pg_temp.rename_save(NULL,NULL,'invoice','RENAME-CURRENT-NEW-DOCUMENT',contract_id,'Rename SQL current client');
  PERFORM pg_temp.rename_assert(result->>'revision'='1','new documents use current card identity');

  UPDATE public.contracts SET client_name='Rename SQL unrelated client' WHERE id=contract_id;
  PERFORM pg_temp.rename_error(format('SELECT pg_temp.rename_save(%L,2,%L,%L,%L)',
    invoice_doc,'invoice','RENAME-INVOICE',contract_id), 'CRM_CONTRACT_CLIENT_MISMATCH');
  INSERT INTO public.clients(name) VALUES ('Rename SQL original client');
  UPDATE public.contracts SET client_name='Rename SQL original client' WHERE id=contract_id;
  PERFORM pg_temp.rename_error(format('SELECT pg_temp.rename_save(%L,2,%L,%L,%L)',
    invoice_doc,'invoice','RENAME-INVOICE',contract_id), 'CRM_CONTRACT_CLIENT_MISMATCH');
  UPDATE public.contracts SET client_name='Rename SQL current client' WHERE id=contract_id;
  INSERT INTO public.clients(name) VALUES ('Rename SQL current client');
  PERFORM pg_temp.rename_error(format('SELECT pg_temp.rename_save(%L,2,%L,%L,%L)',
    invoice_doc,'invoice','RENAME-INVOICE',contract_id), 'CRM_CONTRACT_CLIENT_AMBIGUOUS');
END;
$$;
ROLLBACK;

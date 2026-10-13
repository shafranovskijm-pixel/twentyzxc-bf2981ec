-- Isolated synthetic fixtures; all changes roll back. No bank/SMTP/network calls.
BEGIN;
CREATE FUNCTION pg_temp.payment_assert(ok boolean,description text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN IF ok IS DISTINCT FROM true THEN RAISE EXCEPTION 'ASSERTION FAILED: %',description; END IF; END;
$$;
CREATE FUNCTION pg_temp.payment_error(statement text,expected text,expected_state text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE actual text; code text;
BEGIN
  BEGIN EXECUTE statement; EXCEPTION WHEN OTHERS THEN GET STACKED DIAGNOSTICS actual=MESSAGE_TEXT,code=RETURNED_SQLSTATE; END;
  IF actual IS NULL OR (expected<>'' AND strpos(actual,expected)=0) OR (expected_state IS NOT NULL AND code<>expected_state) THEN
    RAISE EXCEPTION 'EXPECTED ERROR % (%), GOT % (%)',expected,expected_state,actual,code; END IF;
END;
$$;
INSERT INTO auth.users(id,email,raw_user_meta_data) VALUES
 ('fa200000-0000-4000-8000-000000000001','payment-admin@example.invalid','{}'),
 ('fa200000-0000-4000-8000-000000000002','payment-user@example.invalid','{}');
INSERT INTO public.user_roles(user_id,role) VALUES('fa200000-0000-4000-8000-000000000001','admin');
INSERT INTO public.clients(id,name,inn,payment_date) VALUES
 ('fa200000-0000-4000-8000-000000000010','PAYMENT SQL CLIENT','0000000020','2025-01-15'),
 ('fa200000-0000-4000-8000-000000000011','PAYMENT SQL OTHER','0000000021',NULL);
INSERT INTO public.contracts(id,client_name,contract_number,contract_date,amount,amount_extra,payment_status,paid_until,service_start,service_end,appendix_ref) VALUES
 ('fa200000-0000-4000-8000-000000000020','PAYMENT SQL CLIENT','PAYMENT-ONE','2026-09-01',1000,200,'оплачено','2027-01-01','2026-01-01','2026-12-31','Appendix untouched'),
 ('fa200000-0000-4000-8000-000000000021','PAYMENT SQL CLIENT','PAYMENT-TWO','2026-09-01',5000,0,'частично','2027-01-01','2026-01-01','2026-12-31',NULL),
 ('fa200000-0000-4000-8000-000000000022','PAYMENT SQL CLIENT','PAYMENT-DIRECT','2026-09-01',1000,200,'не оплачено','2027-01-01','2026-01-01','2026-12-31',NULL),
 ('fa200000-0000-4000-8000-000000000023','PAYMENT SQL OTHER','PAYMENT-OTHER','2026-09-01',1000,0,'не оплачено',NULL,NULL,NULL,NULL),
 ('fa200000-0000-4000-8000-000000000024','PAYMENT SQL CLIENT','PAYMENT-BADLINK','2026-09-01',1000,0,'не оплачено',NULL,NULL,NULL,NULL),
 ('fa200000-0000-4000-8000-000000000025','PAYMENT SQL CLIENT','PAYMENT-DRIFT','2026-09-01',1000,0,'не оплачено',NULL,NULL,NULL,NULL);
INSERT INTO public.generated_documents(id,doc_type,doc_number,doc_date,client_id,client_name,client_inn,contract_id,total_amount,services,html_content,metadata) VALUES
 ('fa200000-0000-4000-8000-000000000030','invoice','PAYMENT-INV-ONE','2026-09-01','fa200000-0000-4000-8000-000000000010','PAYMENT SQL CLIENT','0000000020','fa200000-0000-4000-8000-000000000020',900,'[{"name":"Test","qty":1,"price":1000}]','<p>Original invoice and signatures</p>','{"discountAmount":100,"discount":{"kind":"amount","value":100}}'),
 ('fa200000-0000-4000-8000-000000000031','invoice','PAYMENT-INV-TWO-A','2026-09-01','fa200000-0000-4000-8000-000000000010','PAYMENT SQL CLIENT','0000000020','fa200000-0000-4000-8000-000000000021',1000,'[]','<p>Invoice A</p>','{}'),
 ('fa200000-0000-4000-8000-000000000032','invoice','PAYMENT-INV-TWO-B','2026-09-01','fa200000-0000-4000-8000-000000000010','PAYMENT SQL CLIENT','0000000020','fa200000-0000-4000-8000-000000000021',2000,'[]','<p>Invoice B</p>','{}'),
 ('fa200000-0000-4000-8000-000000000033','invoice','PAYMENT-INV-STANDALONE','2026-09-01','fa200000-0000-4000-8000-000000000010','PAYMENT SQL CLIENT','0000000020',NULL,100,'[]','<p>Standalone</p>','{}'),
 ('fa200000-0000-4000-8000-000000000034','invoice','PAYMENT-INV-BADLINK','2026-09-01',NULL,'PAYMENT SQL OTHER','0000000021','fa200000-0000-4000-8000-000000000024',100,'[]','<p>Wrong legacy party</p>','{}');
SELECT set_config('request.jwt.claim.sub','fa200000-0000-4000-8000-000000000001',true);
SET LOCAL ROLE authenticated;
DO $$
DECLARE client uuid:='fa200000-0000-4000-8000-000000000010'; root uuid:='fa200000-0000-4000-8000-000000000020';
  req uuid:='fa200000-0000-4000-8000-000000000100'; s jsonb; answer jsonb; original jsonb; replay jsonb;
  doc_before jsonb; card_before jsonb; other_before jsonb; old_token text;
BEGIN
  SELECT to_jsonb(d) INTO doc_before FROM public.generated_documents d WHERE id='fa200000-0000-4000-8000-000000000030';
  SELECT to_jsonb(c)-'payment_status'-'updated_at' INTO card_before FROM public.contracts c WHERE id=root;
  SELECT to_jsonb(c) INTO other_before FROM public.contracts c WHERE id='fa200000-0000-4000-8000-000000000021';
  s:=public.crm_get_payment_status(client,root);
  PERFORM pg_temp.payment_assert(s->>'scope'='invoice' AND s->>'amountDue'='900','one linked invoice uses net discounted total, not gross contract or double discount');
  PERFORM pg_temp.payment_assert(s->'paidAmount'='null' AND s->'paymentStatus'='null' AND s->>'legacyStatus'='оплачено','legacy paid flag does not fabricate amount');
  original:=s;
  answer:=public.crm_set_payment_status(req,client,root,NULL,0,s->>'sourceRevision','partial',300,NULL,'user_report','Client confirmed cumulative 300');
  PERFORM pg_temp.payment_assert(answer->'payment'->>'paidAmount'='300' AND answer->'payment'->>'remainingAmount'='600'
    AND answer->'payment'->>'paymentRevision'='1' AND answer->'payment'->'paidOn'='null','partial cumulative and no inferred date');
  s:=public.crm_get_payment_status(client,root);
  PERFORM pg_temp.payment_assert(jsonb_array_length(s->'history')=1 AND s->>'confirmationSource'='user_report' AND s->>'bankVerified'='false','reread confirms immutable history, does not assert bank verification');
  replay:=public.crm_set_payment_status(req,client,root,NULL,0,original->>'sourceRevision','partial',300,NULL,'user_report','Client confirmed cumulative 300');
  PERFORM pg_temp.payment_assert(replay->>'replayed'='true' AND replay->'payment'->>'paymentRevision'='1','same UUID replays once before optimistic check');
  PERFORM pg_temp.payment_assert((SELECT count(*)=1 FROM public.crm_payment_commands WHERE contract_id=root),'retry creates no second receipt/audit');
  PERFORM pg_temp.payment_error(format('SELECT public.crm_set_payment_status(%L,%L,%L,NULL,0,%L,''partial'',400,NULL,''user_report'',''Client confirmed cumulative 300'')',req,client,root,original->>'sourceRevision'),'CRM_REQUEST_ID_CONFLICT');
  PERFORM pg_temp.payment_error(format('SELECT public.crm_set_payment_status(%L,%L,%L,NULL,0,%L,''paid'')',gen_random_uuid(),client,root,s->>'sourceRevision'),'CRM_PAYMENT_REVISION_CONFLICT');
  answer:=public.crm_set_payment_status(gen_random_uuid(),client,root,NULL,1,s->>'sourceRevision','paid');
  PERFORM pg_temp.payment_assert(answer->'payment'->>'paidAmount'='900' AND answer->'payment'->>'remainingAmount'='0','paid means absolute net900, not prior300 plus900');
  PERFORM pg_temp.payment_assert((SELECT payment_status='оплачено' FROM public.contracts WHERE id=root),'legacy display synchronized');
  PERFORM pg_temp.payment_assert((SELECT to_jsonb(d)=doc_before FROM public.generated_documents d WHERE id='fa200000-0000-4000-8000-000000000030'),'HTML, signature, metadata, dates, document revision unchanged');
  PERFORM pg_temp.payment_assert((SELECT to_jsonb(c)-'payment_status'-'updated_at'=card_before FROM public.contracts c WHERE id=root),'service periods, price, dates, appendix unchanged');
  PERFORM pg_temp.payment_assert((SELECT to_jsonb(c)=other_before FROM public.contracts c WHERE id='fa200000-0000-4000-8000-000000000021'),'other contract same client unchanged');
  PERFORM pg_temp.payment_assert((SELECT payment_date='2025-01-15' FROM public.clients WHERE id=client),'client payment date unchanged');
  PERFORM pg_temp.payment_error(format('UPDATE public.contracts SET payment_status=''не оплачено'' WHERE id=%L',root),'CRM_PAYMENT_USE_COMMAND');
  PERFORM pg_temp.payment_error('UPDATE public.generated_documents SET total_amount=800 WHERE id=''fa200000-0000-4000-8000-000000000030''','CRM_PAYMENT_RECONCILIATION_REQUIRED');
  PERFORM pg_temp.payment_error('UPDATE public.generated_documents SET id=gen_random_uuid() WHERE id=''fa200000-0000-4000-8000-000000000030''','CRM_PAYMENT_RECONCILIATION_REQUIRED');
  PERFORM pg_temp.payment_error(format('UPDATE public.contracts SET client_name=''PAYMENT SQL OTHER'' WHERE id=%L',root),'CRM_PAYMENT_RECONCILIATION_REQUIRED');
  PERFORM pg_temp.payment_error(format('DELETE FROM public.contracts WHERE id=%L',root),'CRM_PAYMENT_RECONCILIATION_REQUIRED');
  PERFORM pg_temp.payment_error('DELETE FROM public.generated_documents WHERE id=''fa200000-0000-4000-8000-000000000030''','CRM_PAYMENT_RECONCILIATION_REQUIRED');
  PERFORM pg_temp.payment_error('UPDATE public.crm_payment_states SET paid_amount=0','permission denied','42501');
  PERFORM pg_temp.payment_error('DELETE FROM public.crm_payment_commands','permission denied','42501');
  PERFORM pg_temp.payment_error(format('SELECT public.crm_get_payment_status(%L,%L)',client,'fa200000-0000-4000-8000-000000000023'),'CRM_PAYMENT_CLIENT_MISMATCH');
  PERFORM pg_temp.payment_error(format('SELECT public.crm_get_payment_status(%L,%L)',client,'fa200000-0000-4000-8000-000000000024'),'CRM_PAYMENT_CLIENT_MISMATCH');
END;
$$;
DO $$
DECLARE client uuid:='fa200000-0000-4000-8000-000000000010'; root uuid:='fa200000-0000-4000-8000-000000000021'; s jsonb; answer jsonb; old_token text;
BEGIN
  s:=public.crm_get_payment_status(client,root);
  PERFORM pg_temp.payment_assert(s->>'requiresInvoiceSelection'='true' AND s->>'amountDue'='3000' AND s->'paidAmount'='null','multiple invoices aggregate net totals and preserve unknowns');
  PERFORM pg_temp.payment_error(format('SELECT public.crm_set_payment_status(%L,%L,%L,NULL,0,%L,''paid'')',gen_random_uuid(),client,root,s->>'sourceRevision'),'CRM_PAYMENT_INVOICE_REQUIRED');
  s:=public.crm_get_payment_status(client,root,'fa200000-0000-4000-8000-000000000031');
  answer:=public.crm_set_payment_status(gen_random_uuid(),client,root,'fa200000-0000-4000-8000-000000000031',0,s->>'sourceRevision','paid',NULL,'2026-10-12','bank_document','Receipt reference ABC');
  PERFORM pg_temp.payment_assert(answer->'payment'->>'paidOn'='2026-10-12' AND answer->'payment'->>'confirmationSource'='bank_document' AND answer->'payment'->>'bankVerified'='false','bank document is stated source not verified bank integration');
  s:=public.crm_get_payment_status(client,root);
  PERFORM pg_temp.payment_assert(s->'paidAmount'='null' AND s->>'knownPaidAmount'='1000' AND s->'remainingAmount'='null','unconfirmed sibling never silently becomes zero');
  PERFORM pg_temp.payment_assert((SELECT payment_status IS NULL FROM public.contracts WHERE id=root),'unknown aggregate does not claim paid/unpaid');
  s:=public.crm_get_payment_status(client,root,'fa200000-0000-4000-8000-000000000032');
  PERFORM pg_temp.payment_assert(s->'paidAmount'='null' AND s->>'paymentRevision'='0','sibling baseline unknown');
  answer:=public.crm_set_payment_status(gen_random_uuid(),client,root,'fa200000-0000-4000-8000-000000000032',0,s->>'sourceRevision','unpaid');
  s:=public.crm_get_payment_status(client,root);
  PERFORM pg_temp.payment_assert(s->>'paymentStatus'='partial' AND s->>'paidAmount'='1000' AND s->>'remainingAmount'='2000','all known invoice states aggregate without counting contract5000');
  PERFORM pg_temp.payment_assert((SELECT payment_status='частично' FROM public.contracts WHERE id=root),'known partial contract projection');
  PERFORM pg_temp.payment_error(format('INSERT INTO public.generated_documents(doc_type,doc_number,client_name,contract_id,total_amount,html_content) VALUES(''invoice'',''PAYMENT-LATE'',''PAYMENT SQL CLIENT'',%L,99,''<p>late</p>'')',root),'CRM_PAYMENT_RECONCILIATION_REQUIRED');
  root:='fa200000-0000-4000-8000-000000000022';
  s:=public.crm_get_payment_status(client,root);
  PERFORM pg_temp.payment_assert(s->>'scope'='contract' AND s->>'amountDue'='1200' AND s->'paidAmount'='null','unmanaged contract includes extra but default unpaid is not receipt evidence');
  answer:=public.crm_set_payment_status(gen_random_uuid(),client,root,NULL,0,s->>'sourceRevision','paid');
  PERFORM pg_temp.payment_error(format('UPDATE public.contracts SET amount=900 WHERE id=%L',root),'CRM_PAYMENT_RECONCILIATION_REQUIRED');
  PERFORM pg_temp.payment_error(format('UPDATE public.contracts SET id=gen_random_uuid() WHERE id=%L',root),'CRM_PAYMENT_RECONCILIATION_REQUIRED');
  PERFORM pg_temp.payment_error(format('INSERT INTO public.generated_documents(doc_type,doc_number,client_name,contract_id,total_amount,html_content) VALUES(''invoice'',''PAYMENT-DOUBLE'',''PAYMENT SQL CLIENT'',%L,1200,''<p>double</p>'')',root),'CRM_PAYMENT_RECONCILIATION_REQUIRED');
  PERFORM pg_temp.payment_assert((SELECT count(*)=1 FROM public.crm_payment_states WHERE contract_id=root),'no competing contract and invoice ledger');
  root:='fa200000-0000-4000-8000-000000000025'; s:=public.crm_get_payment_status(client,root); old_token:=s->>'sourceRevision';
  UPDATE public.contracts SET amount=900 WHERE id=root;
  PERFORM pg_temp.payment_error(format('SELECT public.crm_set_payment_status(%L,%L,%L,NULL,0,%L,''paid'')',gen_random_uuid(),client,root,old_token),'CRM_PAYMENT_SOURCE_CHANGED');
  INSERT INTO public.generated_documents(doc_type,doc_number,client_id,client_name,contract_id,total_amount,html_content)
    VALUES('invoice','PAYMENT-NAN',client,'PAYMENT SQL CLIENT',root,'NaN'::numeric,'<p>Invalid amount</p>');
  PERFORM pg_temp.payment_error(format('SELECT public.crm_get_payment_status(%L,%L)',client,root),'CRM_PAYMENT_AMOUNT_INVALID');
  UPDATE public.generated_documents SET total_amount='Infinity'::numeric WHERE doc_number='PAYMENT-NAN';
  PERFORM pg_temp.payment_error(format('SELECT public.crm_get_payment_status(%L,%L)',client,root),'CRM_PAYMENT_AMOUNT_INVALID');
  DELETE FROM public.generated_documents WHERE doc_number='PAYMENT-NAN';
  s:=public.crm_get_payment_status(client,NULL,'fa200000-0000-4000-8000-000000000033');
  PERFORM pg_temp.payment_error(format('SELECT public.crm_set_payment_status(%L,%L,NULL,%L,0,%L,''partial'',100)',gen_random_uuid(),client,'fa200000-0000-4000-8000-000000000033',s->>'sourceRevision'),'CRM_PAYMENT_STATUS_AMOUNT_MISMATCH');
  PERFORM pg_temp.payment_error(format('SELECT public.crm_set_payment_status(%L,%L,NULL,%L,0,%L,''paid'',101)',gen_random_uuid(),client,'fa200000-0000-4000-8000-000000000033',s->>'sourceRevision'),'CRM_PAYMENT_STATUS_AMOUNT_MISMATCH');
  PERFORM pg_temp.payment_error(format('SELECT public.crm_set_payment_status(%L,%L,NULL,%L,0,%L,''partial'',''NaN''::numeric)',gen_random_uuid(),client,'fa200000-0000-4000-8000-000000000033',s->>'sourceRevision'),'CRM_PAYMENT_INVALID_REQUEST');
  PERFORM pg_temp.payment_error(format('SELECT public.crm_set_payment_status(%L,%L,NULL,%L,0,%L,''paid'',NULL,NULL,''bank_document'')',gen_random_uuid(),client,'fa200000-0000-4000-8000-000000000033',s->>'sourceRevision'),'CRM_PAYMENT_INVALID_REQUEST');
  PERFORM pg_temp.payment_error(format('SELECT public.crm_set_payment_status(%L,%L,NULL,%L,0,%L,''paid'',NULL,''infinity''::date)',gen_random_uuid(),client,'fa200000-0000-4000-8000-000000000033',s->>'sourceRevision'),'CRM_PAYMENT_INVALID_REQUEST');
  answer:=public.crm_set_payment_status(gen_random_uuid(),client,NULL,'fa200000-0000-4000-8000-000000000033',0,s->>'sourceRevision','partial',25.50);
  PERFORM pg_temp.payment_assert(answer->'payment'->>'paidAmount'='25.50' AND answer->'payment'->'contractId'='null','standalone invoices and kopecks supported');
  PERFORM pg_temp.payment_error(format('UPDATE public.clients SET id=gen_random_uuid() WHERE id=%L',client),'','23503');
  PERFORM pg_temp.payment_error(format('DELETE FROM public.clients WHERE id=%L',client),'');
  INSERT INTO public.contracts(id,client_name,contract_number,amount)
    VALUES('fa200000-0000-4000-8000-000000000026','PAYMENT SQL CLIENT','PAYMENT-LEGACY-RENAME',250);
  INSERT INTO public.generated_documents(id,doc_type,doc_number,client_name,client_inn,contract_id,total_amount,html_content)
    VALUES('fa200000-0000-4000-8000-000000000036','invoice','PAYMENT-LEGACY-RENAME','PAYMENT SQL CLIENT','0000000020',
      'fa200000-0000-4000-8000-000000000026',250,'<p>Historic name and no client UUID</p>');
  s:=public.crm_get_payment_status(client,'fa200000-0000-4000-8000-000000000026');
  PERFORM public.crm_set_payment_status(gen_random_uuid(),client,'fa200000-0000-4000-8000-000000000026',NULL,0,s->>'sourceRevision','paid');
  PERFORM public.crm_save_client(gen_random_uuid(),client,(SELECT crm_revision FROM public.clients WHERE id=client),'{"name":"PAYMENT SQL RENAMED"}');
  s:=public.crm_get_payment_status(client,'fa200000-0000-4000-8000-000000000020');
  PERFORM pg_temp.payment_assert(s->>'paidAmount'='900','supported client rename preserves payment identity and historical invoice name');
  s:=public.crm_get_payment_status(client,'fa200000-0000-4000-8000-000000000026');
  PERFORM pg_temp.payment_assert(s->>'paidAmount'='250','managed payment UUID preserves renamed legacy invoice contract auto-resolution');
  s:=public.crm_get_payment_status(client,NULL,'fa200000-0000-4000-8000-000000000036');
  PERFORM pg_temp.payment_assert(s->>'paidAmount'='250','managed payment UUID preserves renamed legacy invoice explicit resolution');
END;
$$;
RESET ROLE;
-- Audit is append-only even to its table owner; rollback restores fixtures.
SELECT pg_temp.payment_error('DELETE FROM public.crm_payment_commands','CRM_REQUEST_IMMUTABLE');
SELECT pg_temp.payment_error('UPDATE public.crm_payment_commands SET request=''{}''','CRM_REQUEST_IMMUTABLE');
SELECT set_config('request.jwt.claim.sub','fa200000-0000-4000-8000-000000000002',true);
SET LOCAL ROLE authenticated;
SELECT pg_temp.payment_assert((SELECT count(*)=0 FROM public.crm_payment_states),'non-admin RLS hides payment state');
SELECT pg_temp.payment_assert((SELECT count(*)=0 FROM public.crm_payment_commands),'non-admin RLS hides audit');
SELECT pg_temp.payment_error('SELECT public.crm_get_payment_status(''fa200000-0000-4000-8000-000000000010'',''fa200000-0000-4000-8000-000000000020'')','CRM_ADMIN_REQUIRED','42501');
SELECT pg_temp.payment_error('SELECT public.crm_set_payment_status(gen_random_uuid(),''fa200000-0000-4000-8000-000000000010'',''fa200000-0000-4000-8000-000000000020'',NULL,0,''token'',''paid'')','CRM_ADMIN_REQUIRED','42501');
RESET ROLE;
SET LOCAL ROLE anon;
SELECT pg_temp.payment_error('SELECT public.crm_get_payment_status(''fa200000-0000-4000-8000-000000000010'',''fa200000-0000-4000-8000-000000000020'')','permission denied','42501');
RESET ROLE;
ROLLBACK;

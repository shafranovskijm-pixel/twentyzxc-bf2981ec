-- Payments are separate from legal document versions. No historic receipts are
-- invented: a legacy paid/partial flag has an unknown amount until confirmed.
CREATE TABLE public.crm_payment_states (
  target_type text NOT NULL CHECK (target_type IN ('contract','invoice')),
  target_id uuid NOT NULL,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  contract_id uuid,
  amount_due numeric NOT NULL CHECK (amount_due >= 0 AND amount_due = round(amount_due,2)),
  paid_amount numeric CHECK (paid_amount >= 0 AND paid_amount <= amount_due AND paid_amount = round(paid_amount,2)),
  revision bigint NOT NULL DEFAULT 0 CHECK (revision >= 0),
  paid_on date,
  confirmation_source text CHECK (confirmation_source IN ('user_report','bank_document')),
  reason text,
  legacy_status text,
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  PRIMARY KEY (target_type,target_id)
);
CREATE INDEX crm_payment_states_contract_idx ON public.crm_payment_states(contract_id);

CREATE TABLE public.crm_payment_commands (
  request_id uuid PRIMARY KEY,
  actor_id uuid NOT NULL,
  client_id uuid NOT NULL,
  contract_id uuid,
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  request jsonb NOT NULL,
  previous_snapshot jsonb NOT NULL,
  result jsonb,
  transaction_id bigint NOT NULL DEFAULT txid_current(),
  backend_pid integer NOT NULL DEFAULT pg_backend_pid(),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX crm_payment_commands_target_idx ON public.crm_payment_commands(target_type,target_id,created_at DESC);
ALTER TABLE public.crm_payment_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_payment_commands ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.crm_payment_states,public.crm_payment_commands FROM PUBLIC,anon,authenticated,service_role;
GRANT SELECT ON public.crm_payment_states,public.crm_payment_commands TO authenticated;
CREATE POLICY "Admins read payment states" ON public.crm_payment_states FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'::public.app_role));
CREATE POLICY "Admins read payment commands" ON public.crm_payment_commands FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'::public.app_role));
CREATE TRIGGER crm_payment_commands_complete_once BEFORE UPDATE OR DELETE ON public.crm_payment_commands
  FOR EACH ROW EXECUTE FUNCTION public.crm_guard_request_completion();

CREATE FUNCTION public.crm_payment_status(p_due numeric,p_paid numeric)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path=pg_catalog AS $$
  SELECT CASE WHEN p_paid IS NULL THEN NULL WHEN p_paid >= p_due THEN 'paid'
    WHEN p_paid > 0 THEN 'partial' ELSE 'unpaid' END
$$;
REVOKE ALL ON FUNCTION public.crm_payment_status(numeric,numeric) FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION public.crm_payment_snapshot(p_client_id uuid,p_contract_id uuid,p_invoice_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE
  client public.clients%ROWTYPE; contract public.contracts%ROWTYPE; invoice public.generated_documents%ROWTYPE;
  state public.crm_payment_states%ROWTYPE; item record; leaf jsonb; invoices jsonb:='[]';
  source_invoices jsonb:='[]'; history jsonb; source_token text;
  scope text; target uuid; due numeric; paid numeric; known boolean:=true;
  total_due numeric:=0; total_paid numeric:=0; invoice_count integer:=0;
  revision bigint:=0; legacy text; selection boolean:=false;
BEGIN
  IF p_client_id IS NULL OR (p_contract_id IS NULL AND p_invoice_id IS NULL) THEN
    RAISE EXCEPTION 'CRM_PAYMENT_TARGET_REQUIRED' USING ERRCODE='22023';
  END IF;
  SELECT * INTO client FROM public.clients WHERE id=p_client_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'CRM_CLIENT_NOT_FOUND' USING ERRCODE='P0002'; END IF;
  IF p_invoice_id IS NOT NULL THEN
    SELECT * INTO invoice FROM public.generated_documents WHERE id=p_invoice_id AND doc_type='invoice';
    IF NOT FOUND THEN RAISE EXCEPTION 'CRM_PAYMENT_INVOICE_NOT_FOUND' USING ERRCODE='P0002'; END IF;
    IF (invoice.client_id IS NOT NULL AND invoice.client_id<>p_client_id)
      OR EXISTS(SELECT 1 FROM public.crm_payment_states s WHERE s.target_type='invoice' AND s.target_id=invoice.id AND s.client_id<>p_client_id)
      OR (invoice.client_id IS NULL AND NOT EXISTS(SELECT 1 FROM public.crm_payment_states s
          WHERE s.target_type='invoice' AND s.target_id=invoice.id AND s.client_id=p_client_id)
        AND (invoice.client_name<>client.name
        OR (SELECT count(*) FROM public.clients WHERE name=client.name)<>1
        OR (nullif(invoice.client_inn,'') IS NOT NULL AND invoice.client_inn IS DISTINCT FROM client.inn)))
      OR (p_contract_id IS NOT NULL AND invoice.contract_id IS DISTINCT FROM p_contract_id) THEN
      RAISE EXCEPTION 'CRM_PAYMENT_CLIENT_MISMATCH' USING ERRCODE='22023';
    END IF;
    p_contract_id:=invoice.contract_id;
  END IF;
  IF p_contract_id IS NOT NULL THEN
    SELECT * INTO contract FROM public.contracts WHERE id=p_contract_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'CRM_PAYMENT_CONTRACT_NOT_FOUND' USING ERRCODE='P0002'; END IF;
    IF contract.client_name<>client.name OR (SELECT count(*) FROM public.clients WHERE name=client.name)<>1 THEN
      RAISE EXCEPTION 'CRM_PAYMENT_CLIENT_MISMATCH' USING ERRCODE='22023';
    END IF;
    legacy:=contract.payment_status;
    FOR item IN SELECT d.*,s.paid_amount AS state_paid,s.revision AS state_revision,s.legacy_status AS state_legacy,
        s.target_id AS state_id,s.client_id AS state_client FROM public.generated_documents d
      LEFT JOIN public.crm_payment_states s ON s.target_type='invoice' AND s.target_id=d.id
      WHERE d.contract_id=p_contract_id AND d.doc_type='invoice' ORDER BY d.id LOOP
      IF item.total_amount IS NULL OR item.total_amount<0 OR item.total_amount>10000000000 OR item.total_amount<>round(item.total_amount,2) THEN
        RAISE EXCEPTION 'CRM_PAYMENT_AMOUNT_INVALID' USING ERRCODE='22023';
      END IF;
      IF (item.client_id IS NOT NULL AND item.client_id<>p_client_id)
        OR (item.state_id IS NOT NULL AND item.state_client<>p_client_id)
        OR (item.client_id IS NULL AND item.state_id IS NULL AND (item.client_name<>client.name
          OR (SELECT count(*) FROM public.clients WHERE name=client.name)<>1
          OR (nullif(item.client_inn,'') IS NOT NULL AND item.client_inn IS DISTINCT FROM client.inn))) THEN
        RAISE EXCEPTION 'CRM_PAYMENT_CLIENT_MISMATCH' USING ERRCODE='22023';
      END IF;
      due:=item.total_amount;
      paid:=CASE WHEN item.state_id IS NOT NULL THEN item.state_paid ELSE NULL END;
      invoice_count:=invoice_count+1; total_due:=total_due+due;
      total_paid:=total_paid+coalesce(paid,0); known:=known AND paid IS NOT NULL;
      leaf:=jsonb_build_object('invoiceId',item.id,'number',item.doc_number,'date',item.doc_date,
        'amountDue',due,'paidAmount',paid,'remainingAmount',CASE WHEN paid IS NOT NULL THEN due-paid END,
        'paymentStatus',public.crm_payment_status(due,paid),'paymentRevision',coalesce(item.state_revision,0),
        'amountKnown',paid IS NOT NULL);
      invoices:=invoices||jsonb_build_array(leaf);
      source_invoices:=source_invoices||jsonb_build_array(jsonb_build_object('id',item.id,'revision',item.revision,
        'amount',due,'clientId',item.client_id,'clientName',item.client_name,'clientInn',item.client_inn));
    END LOOP;
  END IF;
  IF p_invoice_id IS NULL AND invoice_count=1 THEN
    p_invoice_id:=(invoices->0->>'invoiceId')::uuid;
    SELECT * INTO invoice FROM public.generated_documents WHERE id=p_invoice_id;
  END IF;
  selection:=p_invoice_id IS NULL AND invoice_count>1;
  IF selection THEN
    scope:='contract'; target:=p_contract_id; due:=total_due;
    paid:=CASE WHEN known THEN total_paid END;
    SELECT coalesce(max(s.revision),0) INTO revision FROM public.crm_payment_states s WHERE s.contract_id=p_contract_id;
  ELSE
    scope:=CASE WHEN p_invoice_id IS NOT NULL THEN 'invoice' ELSE 'contract' END;
    target:=coalesce(p_invoice_id,p_contract_id);
    due:=CASE WHEN scope='invoice' THEN invoice.total_amount
      ELSE coalesce(contract.amount,0)+coalesce(contract.amount_extra,0) END;
    IF due IS NULL OR due<0 OR due<>round(due,2) OR due>10000000000
      OR (scope='contract' AND contract.amount IS NULL AND contract.amount_extra IS NULL) THEN
      RAISE EXCEPTION 'CRM_PAYMENT_AMOUNT_INVALID' USING ERRCODE='22023';
    END IF;
    SELECT * INTO state FROM public.crm_payment_states WHERE target_type=scope AND target_id=target;
    IF FOUND THEN
      IF state.client_id<>p_client_id OR state.contract_id IS DISTINCT FROM p_contract_id OR state.amount_due<>due THEN
        RAISE EXCEPTION 'CRM_PAYMENT_SOURCE_CHANGED' USING ERRCODE='40001';
      END IF;
      paid:=state.paid_amount; revision:=state.revision; legacy:=state.legacy_status;
    ELSE paid:=NULL; END IF;
  END IF;
  source_token:=md5(jsonb_build_object('clientId',client.id,'clientName',client.name,'contractId',p_contract_id,
    'contractAmount',contract.amount,'contractExtra',contract.amount_extra,'contractArchived',contract.is_archived,
    'invoices',source_invoices,'invoiceId',p_invoice_id,'invoiceRevision',invoice.revision,'amountDue',due,
    'legacyStatus',CASE WHEN revision=0 AND state.target_id IS NULL THEN legacy END)::text);
  SELECT coalesce(jsonb_agg(h.item ORDER BY h.created_at DESC,h.request_id),'[]') INTO history FROM (
    SELECT c.created_at,c.request_id,jsonb_build_object('requestId',c.request_id,'changedAt',c.created_at,'actorId',c.actor_id,
      'paidAmount',c.result->'payment'->'paidAmount','previousPaidAmount',c.previous_snapshot->'paidAmount',
      'paymentStatus',c.result->'payment'->'paymentStatus','paidOn',c.result->'payment'->'paidOn',
      'confirmationSource',c.result->'payment'->'confirmationSource','reason',c.result->'payment'->'reason',
      'paymentRevision',c.result->'payment'->'paymentRevision','invoiceId',c.result->'payment'->'invoiceId',
      'contractId',c.contract_id) AS item
    FROM public.crm_payment_commands c WHERE c.result IS NOT NULL AND c.client_id=p_client_id
      AND (CASE WHEN selection THEN c.contract_id=p_contract_id ELSE c.target_type=scope AND c.target_id=target END)
    ORDER BY c.created_at DESC,c.request_id LIMIT 50) h;
  RETURN jsonb_build_object('clientId',p_client_id,'contractId',p_contract_id,'invoiceId',p_invoice_id,
    'scope',scope,'targetId',target,'amountDue',due,'paidAmount',paid,
    'knownPaidAmount',CASE WHEN selection THEN total_paid ELSE coalesce(paid,0) END,
    'remainingAmount',CASE WHEN paid IS NOT NULL THEN due-paid END,'paymentStatus',public.crm_payment_status(due,paid),
    'paymentRevision',revision,'sourceRevision',source_token,'legacyStatus',legacy,'amountKnown',paid IS NOT NULL,
    'paidOn',state.paid_on,'confirmationSource',state.confirmation_source,'reason',state.reason,
    'requiresInvoiceSelection',selection,'linkedInvoices',invoices,'history',history,
    'sourceChanged',false,'bankVerified',false);
END;
$$;
REVOKE ALL ON FUNCTION public.crm_payment_snapshot(uuid,uuid,uuid) FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION public.crm_get_payment_status(p_client_id uuid,p_contract_id uuid DEFAULT NULL,p_invoice_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(),'admin'::public.app_role) THEN
    RAISE EXCEPTION 'CRM_ADMIN_REQUIRED' USING ERRCODE='42501'; END IF;
  RETURN public.crm_payment_snapshot(p_client_id,p_contract_id,p_invoice_id);
END;
$$;
REVOKE ALL ON FUNCTION public.crm_get_payment_status(uuid,uuid,uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.crm_get_payment_status(uuid,uuid,uuid) TO authenticated;

CREATE FUNCTION public.crm_set_payment_status(p_request_id uuid,p_client_id uuid,p_contract_id uuid,p_invoice_id uuid,
  p_expected_revision bigint,p_expected_source_revision text,p_status text,p_paid_amount numeric DEFAULT NULL,
  p_paid_on date DEFAULT NULL,p_confirmation_source text DEFAULT 'user_report',p_reason text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE
  actor uuid:=auth.uid(); operation jsonb; previous public.crm_payment_commands%ROWTYPE;
  before_snapshot jsonb; after_snapshot jsonb; answer jsonb; target uuid; scope text; root_id uuid;
  due numeric; paid numeric; total_due numeric; total_paid numeric; unknown_count bigint; old_legacy text;
BEGIN
  IF actor IS NULL OR NOT public.has_role(actor,'admin'::public.app_role) THEN
    RAISE EXCEPTION 'CRM_ADMIN_REQUIRED' USING ERRCODE='42501'; END IF;
  IF p_request_id IS NULL OR p_expected_revision IS NULL OR p_expected_revision<0
    OR nullif(p_expected_source_revision,'') IS NULL OR p_status IS NULL OR p_status NOT IN ('unpaid','partial','paid')
    OR p_confirmation_source IS NULL OR p_confirmation_source NOT IN ('user_report','bank_document')
    OR (p_confirmation_source='bank_document' AND nullif(btrim(p_reason),'') IS NULL)
    OR (p_paid_on IS NOT NULL AND NOT isfinite(p_paid_on))
    OR length(p_reason)>2000 OR p_reason ~ '[[:cntrl:]]'
    OR (p_paid_amount IS NOT NULL AND (p_paid_amount<0 OR p_paid_amount<>round(p_paid_amount,2) OR p_paid_amount>10000000000)) THEN
    RAISE EXCEPTION 'CRM_PAYMENT_INVALID_REQUEST' USING ERRCODE='22023'; END IF;
  operation:=jsonb_build_object('actorId',actor,'clientId',p_client_id,'contractId',p_contract_id,'invoiceId',p_invoice_id,
    'expectedRevision',p_expected_revision,'expectedSourceRevision',p_expected_source_revision,'status',p_status,
    'paidAmount',p_paid_amount,'paidOn',p_paid_on,'confirmationSource',p_confirmation_source,'reason',p_reason);
  PERFORM pg_advisory_xact_lock(hashtextextended('crm-payment-request:'||p_request_id::text,0));
  SELECT * INTO previous FROM public.crm_payment_commands WHERE request_id=p_request_id;
  IF FOUND THEN
    IF previous.request IS DISTINCT FROM operation THEN RAISE EXCEPTION 'CRM_REQUEST_ID_CONFLICT' USING ERRCODE='23505'; END IF;
    RETURN previous.result||jsonb_build_object('replayed',true);
  END IF;
  -- Same order as the client command's identity locks. This also serializes old
  -- browser writes and invoice insertion with first-time payment initialization.
  LOCK TABLE public.contracts,public.clients,public.generated_documents IN EXCLUSIVE MODE;
  before_snapshot:=public.crm_payment_snapshot(p_client_id,p_contract_id,p_invoice_id);
  IF (before_snapshot->>'requiresInvoiceSelection')::boolean THEN
    RAISE EXCEPTION 'CRM_PAYMENT_INVOICE_REQUIRED' USING ERRCODE='22023'; END IF;
  IF (before_snapshot->>'paymentRevision')::bigint<>p_expected_revision THEN
    RAISE EXCEPTION 'CRM_PAYMENT_REVISION_CONFLICT' USING ERRCODE='40001'; END IF;
  IF before_snapshot->>'sourceRevision' IS DISTINCT FROM p_expected_source_revision THEN
    RAISE EXCEPTION 'CRM_PAYMENT_SOURCE_CHANGED' USING ERRCODE='40001'; END IF;
  scope:=before_snapshot->>'scope'; target:=(before_snapshot->>'targetId')::uuid;
  root_id:=(before_snapshot->>'contractId')::uuid; due:=(before_snapshot->>'amountDue')::numeric;
  paid:=CASE p_status WHEN 'paid' THEN coalesce(p_paid_amount,due) WHEN 'unpaid' THEN coalesce(p_paid_amount,0) ELSE p_paid_amount END;
  IF paid IS NULL OR (p_status='paid' AND paid<>due) OR (p_status='unpaid' AND paid<>0)
    OR (p_status='partial' AND (paid<=0 OR paid>=due)) OR public.crm_payment_status(due,paid)<>p_status THEN
    RAISE EXCEPTION 'CRM_PAYMENT_STATUS_AMOUNT_MISMATCH' USING ERRCODE='22023'; END IF;
  INSERT INTO public.crm_payment_commands(request_id,actor_id,client_id,contract_id,target_type,target_id,request,previous_snapshot)
    VALUES(p_request_id,actor,p_client_id,root_id,scope,target,operation,before_snapshot);
  SELECT payment_status INTO old_legacy FROM public.contracts WHERE id=root_id;
  IF scope='invoice' AND root_id IS NOT NULL THEN
    INSERT INTO public.crm_payment_states(target_type,target_id,client_id,contract_id,amount_due,paid_amount,legacy_status)
      SELECT 'invoice',d.id,p_client_id,root_id,d.total_amount,NULL,old_legacy
      FROM public.generated_documents d WHERE d.contract_id=root_id AND d.doc_type='invoice'
      ON CONFLICT(target_type,target_id) DO NOTHING;
  END IF;
  INSERT INTO public.crm_payment_states(target_type,target_id,client_id,contract_id,amount_due,paid_amount,revision,paid_on,confirmation_source,reason,legacy_status)
    VALUES(scope,target,p_client_id,root_id,due,paid,1,p_paid_on,p_confirmation_source,p_reason,old_legacy)
    ON CONFLICT(target_type,target_id) DO UPDATE SET paid_amount=EXCLUDED.paid_amount,
      revision=public.crm_payment_states.revision+1,paid_on=EXCLUDED.paid_on,
      confirmation_source=EXCLUDED.confirmation_source,reason=EXCLUDED.reason,updated_at=clock_timestamp();
  IF root_id IS NOT NULL THEN
    SELECT sum(amount_due),sum(paid_amount),count(*) FILTER(WHERE paid_amount IS NULL)
      INTO total_due,total_paid,unknown_count FROM public.crm_payment_states WHERE contract_id=root_id;
    UPDATE public.contracts SET payment_status=CASE WHEN unknown_count>0 THEN NULL
      WHEN total_paid>=total_due THEN 'оплачено' WHEN total_paid>0 THEN 'частично' ELSE 'не оплачено' END
      WHERE id=root_id;
  END IF;
  after_snapshot:=public.crm_payment_snapshot(p_client_id,p_contract_id,p_invoice_id);
  answer:=jsonb_build_object('saved',true,'replayed',false,'payment',after_snapshot);
  UPDATE public.crm_payment_commands SET result=answer WHERE request_id=p_request_id;
  RETURN answer;
END;
$$;
REVOKE ALL ON FUNCTION public.crm_set_payment_status(uuid,uuid,uuid,uuid,bigint,text,text,numeric,date,text,text)
  FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.crm_set_payment_status(uuid,uuid,uuid,uuid,bigint,text,text,numeric,date,text,text) TO authenticated;

CREATE FUNCTION public.crm_guard_managed_contract_payment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
  IF EXISTS(SELECT 1 FROM public.crm_payment_states s WHERE s.contract_id=OLD.id) THEN
    IF TG_OP='DELETE' THEN RAISE EXCEPTION 'CRM_PAYMENT_RECONCILIATION_REQUIRED' USING ERRCODE='55000'; END IF;
    IF NEW.id IS DISTINCT FROM OLD.id OR (NEW.client_name IS DISTINCT FROM OLD.client_name AND EXISTS(
      SELECT 1 FROM public.crm_payment_states s LEFT JOIN public.clients c ON c.id=s.client_id
      WHERE s.contract_id=OLD.id AND (c.name IS DISTINCT FROM NEW.client_name
        OR (SELECT count(*) FROM public.clients WHERE name=NEW.client_name)<>1))) THEN
      RAISE EXCEPTION 'CRM_PAYMENT_RECONCILIATION_REQUIRED' USING ERRCODE='55000'; END IF;
    IF (NEW.amount IS DISTINCT FROM OLD.amount OR NEW.amount_extra IS DISTINCT FROM OLD.amount_extra)
      AND EXISTS(SELECT 1 FROM public.crm_payment_states WHERE target_type='contract' AND target_id=OLD.id) THEN
      RAISE EXCEPTION 'CRM_PAYMENT_RECONCILIATION_REQUIRED' USING ERRCODE='55000'; END IF;
    IF NEW.payment_status IS DISTINCT FROM OLD.payment_status AND NOT EXISTS(
      SELECT 1 FROM public.crm_payment_commands c WHERE c.contract_id=OLD.id AND c.result IS NULL
        AND c.actor_id=auth.uid() AND c.transaction_id=txid_current() AND c.backend_pid=pg_backend_pid()) THEN
      RAISE EXCEPTION 'CRM_PAYMENT_USE_COMMAND' USING ERRCODE='55000'; END IF;
  END IF;
  IF TG_OP='DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.crm_guard_managed_contract_payment() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER crm_guard_managed_contract_payment BEFORE UPDATE OR DELETE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.crm_guard_managed_contract_payment();

CREATE FUNCTION public.crm_guard_managed_invoice_payment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE old_managed boolean:=false; root_managed boolean:=false;
BEGIN
  IF TG_OP<>'INSERT' THEN
    SELECT EXISTS(SELECT 1 FROM public.crm_payment_states WHERE target_type='invoice' AND target_id=OLD.id) INTO old_managed;
    IF old_managed AND (TG_OP='DELETE' OR NEW.id IS DISTINCT FROM OLD.id OR NEW.doc_type IS DISTINCT FROM OLD.doc_type
      OR NEW.contract_id IS DISTINCT FROM OLD.contract_id OR NEW.total_amount IS DISTINCT FROM OLD.total_amount
      OR NEW.client_id IS DISTINCT FROM OLD.client_id OR NEW.client_name IS DISTINCT FROM OLD.client_name
      OR NEW.client_inn IS DISTINCT FROM OLD.client_inn) THEN
      RAISE EXCEPTION 'CRM_PAYMENT_RECONCILIATION_REQUIRED' USING ERRCODE='55000'; END IF;
  END IF;
  IF TG_OP<>'DELETE' AND NEW.doc_type='invoice' AND NEW.contract_id IS NOT NULL THEN
    SELECT EXISTS(SELECT 1 FROM public.crm_payment_states WHERE contract_id=NEW.contract_id) INTO root_managed;
    IF root_managed AND (TG_OP='INSERT' OR OLD.doc_type<>'invoice' OR NEW.contract_id IS DISTINCT FROM OLD.contract_id) THEN
      RAISE EXCEPTION 'CRM_PAYMENT_RECONCILIATION_REQUIRED' USING ERRCODE='55000'; END IF;
  END IF;
  IF TG_OP='DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.crm_guard_managed_invoice_payment() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER crm_guard_managed_invoice_payment BEFORE INSERT OR UPDATE OR DELETE ON public.generated_documents
  FOR EACH ROW EXECUTE FUNCTION public.crm_guard_managed_invoice_payment();

-- Delivery evidence belongs to the existing lead, not to a second sales registry.
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS sales_response jsonb NOT NULL DEFAULT '{}'::jsonb;
COMMENT ON COLUMN public.leads.sales_response IS 'Site subscription acknowledgement: SMTP acceptance is not customer delivery or payment. Sending/unknown states must not be retried automatically.';

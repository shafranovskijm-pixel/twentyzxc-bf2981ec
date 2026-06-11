
ALTER TABLE public.sales_leads
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS region text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS license_number text,
  ADD COLUMN IF NOT EXISTS license_date date,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS dedup_hash text;

CREATE INDEX IF NOT EXISTS sales_leads_inn_idx ON public.sales_leads(inn) WHERE inn IS NOT NULL;
CREATE INDEX IF NOT EXISTS sales_leads_email_idx ON public.sales_leads(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS sales_leads_phone_idx ON public.sales_leads(phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS sales_leads_dedup_idx ON public.sales_leads(dedup_hash) WHERE dedup_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS sales_leads_category_idx ON public.sales_leads(category);

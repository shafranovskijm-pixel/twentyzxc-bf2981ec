-- sales_leads table
CREATE TABLE public.sales_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  inn text,
  website text,
  email text,
  phone text,
  contact_person text,
  source text,
  status text NOT NULL DEFAULT 'new',
  next_step text,
  notes text,
  license_cache jsonb,
  last_email_sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales_leads TO authenticated;
GRANT ALL ON public.sales_leads TO service_role;

ALTER TABLE public.sales_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all sales leads" ON public.sales_leads
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_sales_leads_updated
  BEFORE UPDATE ON public.sales_leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_sales_leads_inn ON public.sales_leads(inn);
CREATE INDEX idx_sales_leads_status ON public.sales_leads(status);

-- rosobrnadzor licenses cache
CREATE TABLE public.rosobrnadzor_licenses (
  inn text PRIMARY KEY,
  org_name text,
  license_number text,
  license_date date,
  license_status text,
  address text,
  registry_url text,
  raw_json jsonb,
  fetched_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.rosobrnadzor_licenses TO authenticated;
GRANT ALL ON public.rosobrnadzor_licenses TO service_role;

ALTER TABLE public.rosobrnadzor_licenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage rosobrnadzor cache" ON public.rosobrnadzor_licenses
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.org_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  website text,
  email text,
  phone text,
  source text,
  status text NOT NULL DEFAULT 'new',
  next_step text,
  notes text,
  last_email_sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_org_leads_org ON public.org_leads(organization_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.org_leads TO authenticated;
GRANT ALL ON public.org_leads TO service_role;

ALTER TABLE public.org_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org owner can view leads" ON public.org_leads FOR SELECT TO authenticated USING (public.is_org_owner(auth.uid(), organization_id) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Org owner can insert leads" ON public.org_leads FOR INSERT TO authenticated WITH CHECK (public.is_org_owner(auth.uid(), organization_id) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Org owner can update leads" ON public.org_leads FOR UPDATE TO authenticated USING (public.is_org_owner(auth.uid(), organization_id) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Org owner can delete leads" ON public.org_leads FOR DELETE TO authenticated USING (public.is_org_owner(auth.uid(), organization_id) OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER set_org_leads_updated_at BEFORE UPDATE ON public.org_leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
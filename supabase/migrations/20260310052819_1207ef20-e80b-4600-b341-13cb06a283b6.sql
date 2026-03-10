
CREATE TABLE public.nmo_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  organization_name TEXT NOT NULL,
  inn TEXT,
  kpp TEXT,
  license_number TEXT,
  license_date DATE,
  responsible_name TEXT,
  responsible_email TEXT,
  responsible_phone TEXT,
  responsible_snils TEXT,
  responsible_position TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  checklist JSONB NOT NULL DEFAULT '{"docs_collected":false,"employee_registered":false,"application_submitted":false,"originals_sent":false,"cabinet_opened":false,"dpp_passports_filled":false}'::jsonb,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.nmo_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage nmo_registrations"
  ON public.nmo_registrations
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

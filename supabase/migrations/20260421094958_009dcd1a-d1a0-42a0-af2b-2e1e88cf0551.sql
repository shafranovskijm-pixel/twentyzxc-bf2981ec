
-- 1. Расширяем таблицу nmo_registrations
ALTER TABLE public.nmo_registrations
  ADD COLUMN IF NOT EXISTS ogrn text,
  ADD COLUMN IF NOT EXISTS legal_address text,
  ADD COLUMN IF NOT EXISTS actual_address text,
  ADD COLUMN IF NOT EXISTS organization_abbr text,
  ADD COLUMN IF NOT EXISTS organization_phone text,
  ADD COLUMN IF NOT EXISTS organization_email text,
  ADD COLUMN IF NOT EXISTS organization_website text,
  ADD COLUMN IF NOT EXISTS region text,
  ADD COLUMN IF NOT EXISTS has_dpo_appendix boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS application_number text,
  ADD COLUMN IF NOT EXISTS application_date date,
  ADD COLUMN IF NOT EXISTS mail_track_number text,
  ADD COLUMN IF NOT EXISTS mail_sent_date date,
  ADD COLUMN IF NOT EXISTS responsible_birth_date date,
  ADD COLUMN IF NOT EXISTS responsible_gender text,
  ADD COLUMN IF NOT EXISTS responsible_mobile text,
  ADD COLUMN IF NOT EXISTS responsible_work_phone text,
  ADD COLUMN IF NOT EXISTS responsible_main_workplace text,
  ADD COLUMN IF NOT EXISTS responsible_region text,
  ADD COLUMN IF NOT EXISTS responsible_login text,
  ADD COLUMN IF NOT EXISTS responsible_password text;

-- 2. Обновляем default checklist
ALTER TABLE public.nmo_registrations
  ALTER COLUMN checklist SET DEFAULT '{
    "employee_registered": false,
    "email_confirmed": false,
    "credentials_received": false,
    "lk_org_request_started": false,
    "org_data_filled": false,
    "responsible_added": false,
    "docs_generated": false,
    "docs_uploaded": false,
    "originals_sent": false,
    "cabinet_opened": false,
    "dpp_passports_filled": false
  }'::jsonb;

-- 3. Новая таблица для документов
CREATE TABLE IF NOT EXISTS public.nmo_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id uuid NOT NULL REFERENCES public.nmo_registrations(id) ON DELETE CASCADE,
  doc_type text NOT NULL,
  file_path text NOT NULL,
  file_name text NOT NULL,
  file_size bigint,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nmo_documents_registration ON public.nmo_documents(registration_id);

ALTER TABLE public.nmo_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage nmo_documents"
  ON public.nmo_documents
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 4. Приватный bucket для PDF
INSERT INTO storage.buckets (id, name, public)
VALUES ('nmo-documents', 'nmo-documents', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Admins can view nmo documents"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'nmo-documents' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can upload nmo documents"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'nmo-documents' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update nmo documents"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'nmo-documents' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete nmo documents"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'nmo-documents' AND has_role(auth.uid(), 'admin'::app_role));

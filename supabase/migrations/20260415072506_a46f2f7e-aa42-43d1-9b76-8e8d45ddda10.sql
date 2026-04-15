
-- 1. Add 'organization' to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'organization';

-- 2. Organizations table
CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL DEFAULT '',
  inn text,
  logo_url text,
  landing_slug text UNIQUE,
  landing_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org owners can view own org" ON public.organizations
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Org owners can update own org" ON public.organizations
  FOR UPDATE USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert organizations" ON public.organizations
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete organizations" ON public.organizations
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Public can read by landing_slug (for public landing pages)
CREATE POLICY "Public can read org by slug" ON public.organizations
  FOR SELECT USING (landing_slug IS NOT NULL);

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Helper function to check org ownership
CREATE OR REPLACE FUNCTION public.is_org_owner(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organizations
    WHERE id = _org_id AND user_id = _user_id
  )
$$;

-- 4. org_contracts
CREATE TABLE public.org_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_name text NOT NULL,
  contract_number text,
  contract_date date,
  contract_type text,
  amount numeric,
  payment_status text DEFAULT 'не оплачено',
  paid_until date,
  notes text,
  is_archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.org_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org owner manages own contracts" ON public.org_contracts
  FOR ALL USING (public.is_org_owner(auth.uid(), organization_id) OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.is_org_owner(auth.uid(), organization_id) OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_org_contracts_updated_at
  BEFORE UPDATE ON public.org_contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. org_clients
CREATE TABLE public.org_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  contact_person text,
  phone text,
  email text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.org_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org owner manages own clients" ON public.org_clients
  FOR ALL USING (public.is_org_owner(auth.uid(), organization_id) OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.is_org_owner(auth.uid(), organization_id) OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_org_clients_updated_at
  BEFORE UPDATE ON public.org_clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. org_tasks
CREATE TABLE public.org_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'todo',
  task_date date NOT NULL DEFAULT CURRENT_DATE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.org_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org owner manages own tasks" ON public.org_tasks
  FOR ALL USING (public.is_org_owner(auth.uid(), organization_id) OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.is_org_owner(auth.uid(), organization_id) OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_org_tasks_updated_at
  BEFORE UPDATE ON public.org_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. org_files
CREATE TABLE public.org_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.org_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org owner manages own files" ON public.org_files
  FOR ALL USING (public.is_org_owner(auth.uid(), organization_id) OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.is_org_owner(auth.uid(), organization_id) OR public.has_role(auth.uid(), 'admin'));

-- 8. Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('org-files', 'org-files', false);

CREATE POLICY "Org owners can upload files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'org-files' AND
    (public.has_role(auth.uid(), 'admin') OR
     EXISTS (SELECT 1 FROM public.organizations WHERE user_id = auth.uid() AND id::text = (storage.foldername(name))[1]))
  );

CREATE POLICY "Org owners can view own files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'org-files' AND
    (public.has_role(auth.uid(), 'admin') OR
     EXISTS (SELECT 1 FROM public.organizations WHERE user_id = auth.uid() AND id::text = (storage.foldername(name))[1]))
  );

CREATE POLICY "Org owners can delete own files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'org-files' AND
    (public.has_role(auth.uid(), 'admin') OR
     EXISTS (SELECT 1 FROM public.organizations WHERE user_id = auth.uid() AND id::text = (storage.foldername(name))[1]))
  );


-- Create clients table
CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact_person text,
  phone text,
  email text,
  telegram text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage clients" ON public.clients
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create contracts table
CREATE TABLE public.contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name text NOT NULL,
  contract_number text,
  contract_date date,
  payment_status text DEFAULT 'не оплачено',
  amount numeric,
  amount_extra numeric,
  contract_type text,
  responsible text,
  file_path text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage contracts" ON public.contracts
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Triggers for updated_at
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contracts_updated_at
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create private storage bucket for contract files
INSERT INTO storage.buckets (id, name, public) VALUES ('contracts', 'contracts', false);

-- Storage policies: only admins can upload/read/delete
CREATE POLICY "Admins can upload contract files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'contracts' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can read contract files" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'contracts' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete contract files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'contracts' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update contract files" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'contracts' AND public.has_role(auth.uid(), 'admin'));

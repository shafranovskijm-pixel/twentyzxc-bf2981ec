
-- Table: sales_notes
CREATE TABLE public.sales_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  content text NOT NULL,
  note_type text DEFAULT 'general',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.sales_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage sales notes" ON public.sales_notes FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Table: leads
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text DEFAULT 'telegram',
  name text,
  phone text,
  email text,
  message text,
  telegram_chat_id bigint,
  status text DEFAULT 'new',
  converted_client_id uuid REFERENCES public.clients(id),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage leads" ON public.leads FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

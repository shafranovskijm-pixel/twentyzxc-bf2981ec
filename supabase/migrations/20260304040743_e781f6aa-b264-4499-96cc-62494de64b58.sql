
CREATE TABLE public.contract_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.contract_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage contract files"
  ON public.contract_files
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

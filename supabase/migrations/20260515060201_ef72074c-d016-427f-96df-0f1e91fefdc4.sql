ALTER TABLE public.tz_documents ADD COLUMN IF NOT EXISTS appendix_number text;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS appendix_ref text;
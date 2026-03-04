
ALTER TABLE public.clients
  ADD COLUMN service_type text DEFAULT NULL,
  ADD COLUMN frdo_login text DEFAULT NULL,
  ADD COLUMN frdo_password text DEFAULT NULL,
  ADD COLUMN payment_date date DEFAULT NULL;

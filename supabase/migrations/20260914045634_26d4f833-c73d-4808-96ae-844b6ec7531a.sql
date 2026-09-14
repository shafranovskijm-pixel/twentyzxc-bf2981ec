ALTER TABLE public.contracts ADD COLUMN service_start date, ADD COLUMN service_end date, ADD COLUMN service_no_deadline boolean NOT NULL DEFAULT false;
CREATE OR REPLACE FUNCTION public.ensure_contract_client() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE normalized_name text;
BEGIN
  IF nullif(btrim(NEW.client_name), '') IS NULL THEN RAISE EXCEPTION 'Укажите организацию'; END IF;
  normalized_name := regexp_replace(lower(NEW.client_name), '[^a-zа-яё0-9]', '', 'g');
  PERFORM pg_advisory_xact_lock(hashtextextended(normalized_name, 0));
  IF NOT EXISTS (SELECT 1 FROM public.clients WHERE regexp_replace(lower(name), '[^a-zа-яё0-9]', '', 'g') = normalized_name) THEN
    INSERT INTO public.clients(name) VALUES(btrim(NEW.client_name));
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER ensure_contract_client BEFORE INSERT OR UPDATE OF client_name ON public.contracts FOR EACH ROW EXECUTE FUNCTION public.ensure_contract_client();
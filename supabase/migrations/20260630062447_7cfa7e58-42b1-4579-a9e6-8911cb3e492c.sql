
-- 1. Counters
CREATE TABLE public.proposal_counters (
  year int PRIMARY KEY,
  last_number int NOT NULL DEFAULT 0
);
GRANT SELECT ON public.proposal_counters TO authenticated;
GRANT ALL ON public.proposal_counters TO service_role;
ALTER TABLE public.proposal_counters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view counters" ON public.proposal_counters FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.next_proposal_number()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  cur_year int := EXTRACT(YEAR FROM now())::int;
  next_num int;
BEGIN
  INSERT INTO public.proposal_counters(year, last_number)
  VALUES (cur_year, 1)
  ON CONFLICT (year) DO UPDATE SET last_number = proposal_counters.last_number + 1
  RETURNING last_number INTO next_num;
  RETURN lpad(next_num::text, 3, '0') || '/' || cur_year::text;
END;
$$;

-- 2. Services catalog
CREATE TABLE public.proposal_services_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  default_price numeric NOT NULL DEFAULT 0,
  category text,
  sort_order int NOT NULL DEFAULT 0,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.proposal_services_catalog TO authenticated;
GRANT ALL ON public.proposal_services_catalog TO service_role;
ALTER TABLE public.proposal_services_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage catalog" ON public.proposal_services_catalog FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER tr_proposal_catalog_updated BEFORE UPDATE ON public.proposal_services_catalog
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Proposals
CREATE TABLE public.proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  number text,
  client_name text,
  client_org text,
  client_email text,
  client_phone text,
  intro_text text,
  footer_text text,
  discount_percent numeric NOT NULL DEFAULT 0,
  valid_until date,
  status text NOT NULL DEFAULT 'draft',
  total_amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.proposals TO authenticated;
GRANT ALL ON public.proposals TO service_role;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage proposals" ON public.proposals FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER tr_proposals_updated BEFORE UPDATE ON public.proposals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Proposal items
CREATE TABLE public.proposal_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  service_key text,
  title text NOT NULL,
  description text,
  price numeric NOT NULL DEFAULT 0,
  qty numeric NOT NULL DEFAULT 1,
  sort_order int NOT NULL DEFAULT 0,
  included boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.proposal_items TO authenticated;
GRANT ALL ON public.proposal_items TO service_role;
ALTER TABLE public.proposal_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage proposal items" ON public.proposal_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_proposal_items_proposal ON public.proposal_items(proposal_id);

-- 5. Seed catalog
INSERT INTO public.proposal_services_catalog (key, title, description, default_price, category, sort_order, is_default) VALUES
  ('license_turnkey', 'Лицензия на образовательную деятельность под ключ', 'Полный цикл: подготовка пакета документов, подача в Рособрнадзор, сопровождение до получения лицензии', 35000, 'Образование', 10, true),
  ('edu_site_dev', 'Разработка сайта для образовательной организации', 'Современный сайт под требования Рособрнадзора: раздел «Сведения об образовательной организации», адаптив, SSL', 35000, 'Образование', 20, true),
  ('edu_site_docs', 'Комплект документов для сайта образовательной организации', 'Политики, положения, локальные акты — всё необходимое для соответствия требованиям проверяющих органов', 25000, 'Образование', 30, true),
  ('license_docs', 'Комплект документов для подачи на лицензию', 'Полный пакет учредительных и образовательных документов для лицензирования', 35000, 'Образование', 40, true),
  ('nmo_registration', 'Регистрация на портале НМО', 'Полный цикл регистрации медицинского специалиста на портале непрерывного медицинского образования', 35000, 'Медицина', 50, false),
  ('frdo_support', 'Сопровождение ФРДО', 'Внесение сведений о выданных документах об образовании в Федеральный реестр', 15000, 'Образование', 60, false),
  ('landing', 'Лендинг под ключ', 'Одностраничный продающий сайт: дизайн, верстка, форма заявки, интеграция с CRM/Telegram', 60000, 'Сайты', 70, false),
  ('corporate', 'Корпоративный сайт', 'Многостраничный сайт компании с CMS, каталогом услуг и блогом', 120000, 'Сайты', 80, false),
  ('ecommerce', 'Интернет-магазин', 'Каталог, корзина, оплата, личный кабинет, интеграция с 1С и службами доставки', 250000, 'Сайты', 90, false),
  ('webapp', 'Веб-приложение', 'Кастомное SaaS-решение под задачи бизнеса: авторизация, роли, дашборды, API', 350000, 'Сайты', 100, false),
  ('advertising', 'Настройка контекстной рекламы', 'Яндекс.Директ: аудит, семантическое ядро, креативы, ведение первый месяц', 40000, 'Маркетинг', 110, false);

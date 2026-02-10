
CREATE TABLE public.site_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Site settings readable by everyone"
  ON public.site_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins can update site settings"
  ON public.site_settings FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert site settings"
  ON public.site_settings FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete site settings"
  ON public.site_settings FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

INSERT INTO public.site_settings (key, value) VALUES
  ('seo_keywords', '"веб-разработка, создание сайтов, реклама яндекс директ, таргетированная реклама, 24zxc, конструктор сайтов, шаблоны сайтов, лендинг под ключ, сайт для бизнеса, фис фрдо, лицензия на образовательную деятельность, сайт для образовательной организации"'),
  ('seo_title', '"24ZXC — Веб-разработка, реклама и услуги для бизнеса"'),
  ('seo_description', '"Создаём современные сайты, настраиваем рекламу в Яндекс Директ и соцсетях. Полный спектр цифровых услуг для вашего бизнеса."'),
  ('contact_email', '"info@24zxc.ru"'),
  ('contact_telegram', '"@24zxc"');

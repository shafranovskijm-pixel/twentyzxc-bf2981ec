
-- =========================================
-- TZ TEMPLATES
-- =========================================
CREATE TABLE IF NOT EXISTS public.tz_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  template_type text NOT NULL DEFAULT 'custom',
  sections jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_default boolean NOT NULL DEFAULT false,
  is_archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tz_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage tz_templates"
  ON public.tz_templates FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_tz_templates_updated_at
  BEFORE UPDATE ON public.tz_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- TZ DOCUMENTS
-- =========================================
CREATE TABLE IF NOT EXISTS public.tz_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid,
  client_name text NOT NULL,
  client_inn text,
  contract_id uuid,
  template_id uuid REFERENCES public.tz_templates(id) ON DELETE SET NULL,
  title text NOT NULL,
  tz_number text,
  tz_date date NOT NULL DEFAULT CURRENT_DATE,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  html_content text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tz_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage tz_documents"
  ON public.tz_documents FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_tz_documents_updated_at
  BEFORE UPDATE ON public.tz_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_tz_documents_client ON public.tz_documents(client_id);
CREATE INDEX IF NOT EXISTS idx_tz_documents_contract ON public.tz_documents(contract_id);

-- =========================================
-- TZ COUNTERS (NNN/YYYY)
-- =========================================
CREATE TABLE IF NOT EXISTS public.tz_doc_counters (
  year int PRIMARY KEY,
  last_number int NOT NULL DEFAULT 0
);

ALTER TABLE public.tz_doc_counters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read tz_doc_counters"
  ON public.tz_doc_counters FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.next_tz_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cur_year int := EXTRACT(YEAR FROM now())::int;
  next_num int;
BEGIN
  INSERT INTO public.tz_doc_counters(year, last_number)
  VALUES (cur_year, 1)
  ON CONFLICT (year) DO UPDATE SET last_number = tz_doc_counters.last_number + 1
  RETURNING last_number INTO next_num;

  RETURN lpad(next_num::text, 3, '0') || '/' || cur_year::text;
END;
$$;

-- =========================================
-- SEED DEFAULT TEMPLATES
-- =========================================
INSERT INTO public.tz_templates (name, description, template_type, is_default, sections) VALUES
('Сайт + CRM (импорт авто/товаров)',
 'Стартовый шаблон для проектов с интернет-витриной и CRM-модулем (импорт автомобилей, товаров)',
 'site_crm',
 true,
 '[
   {"id":"goals","title":"1. Цели и задачи проекта","items":[
     {"id":"g1","label":"Создать имиджевый сайт-каталог с фильтрами","checked":true},
     {"id":"g2","label":"Принимать заявки и обрабатывать их в CRM","checked":true},
     {"id":"g3","label":"Запустить рекламу Яндекс.Директ","checked":true},
     {"id":"g4","label":"Автоматизировать расчёт маржи по сделкам","checked":true}
   ]},
   {"id":"structure","title":"2. Структура сайта","items":[
     {"id":"s1","label":"Главная страница","checked":true},
     {"id":"s2","label":"Каталог автомобилей с фильтрами (Япония/Корея/Китай)","checked":true},
     {"id":"s3","label":"Карточка автомобиля с фото-галереей","checked":true},
     {"id":"s4","label":"Страница «Товары из Китая» (лендинг)","checked":true},
     {"id":"s5","label":"О компании","checked":true},
     {"id":"s6","label":"Контакты с картой","checked":true},
     {"id":"s7","label":"Калькулятор стоимости с растаможкой","checked":false}
   ]},
   {"id":"forms","title":"3. Формы и точки захвата","items":[
     {"id":"f1","label":"Форма «Подобрать авто»","checked":true},
     {"id":"f2","label":"Форма «Заказать товар»","checked":true},
     {"id":"f3","label":"Форма обратной связи","checked":true},
     {"id":"f4","label":"Чат WhatsApp/Telegram","checked":true},
     {"id":"f5","label":"Заявки уходят в Telegram + CRM","checked":true}
   ]},
   {"id":"crm","title":"4. CRM-модуль (импорт)","items":[
     {"id":"c1","label":"Стадии сделки: Аукцион → Оплата → Доставка → Таможня → Выдача","checked":true},
     {"id":"c2","label":"Расчёт маржи и итоговой цены","checked":true},
     {"id":"c3","label":"Загрузка фото с аукциона","checked":true},
     {"id":"c4","label":"История клиентов","checked":true},
     {"id":"c5","label":"Финансовая отчётность","checked":false}
   ]},
   {"id":"ads","title":"5. Реклама / Яндекс.Директ","items":[
     {"id":"a1","label":"Подбор до 300 ключевых слов","checked":true},
     {"id":"a2","label":"Создание рекламных кампаний","checked":true},
     {"id":"a3","label":"Настройка ретаргетинга","checked":true},
     {"id":"a4","label":"Ведение и оптимизация (1 мес.)","checked":true}
   ]},
   {"id":"hosting","title":"6. Администрирование, домен, хостинг","items":[
     {"id":"h1","label":"Регистрация домена","checked":true},
     {"id":"h2","label":"Хостинг и SSL (6 мес.)","checked":true},
     {"id":"h3","label":"Резервное копирование","checked":true},
     {"id":"h4","label":"Техподдержка и обновления","checked":true}
   ]},
   {"id":"stages","title":"7. Этапы и сроки","items":[
     {"id":"st1","label":"Прототип и согласование (2 дня)","checked":true},
     {"id":"st2","label":"Дизайн (2 дня)","checked":true},
     {"id":"st3","label":"Вёрстка и разработка (4 дня)","checked":true},
     {"id":"st4","label":"Тестирование (1 день)","checked":true},
     {"id":"st5","label":"Запуск (1 день)","checked":true}
   ]},
   {"id":"client","title":"8. Обязанности заказчика","items":[
     {"id":"cl1","label":"Предоставить тексты и контент","checked":true},
     {"id":"cl2","label":"Передать фото и логотип","checked":true},
     {"id":"cl3","label":"Своевременно согласовывать этапы","checked":true},
     {"id":"cl4","label":"Оплатить услугу по графику","checked":true}
   ]},
   {"id":"exclude","title":"9. Что не входит в стоимость","items":[
     {"id":"e1","label":"Закупка стоковых фотографий","checked":true},
     {"id":"e2","label":"Создание видео-контента","checked":true},
     {"id":"e3","label":"Профессиональный копирайтинг","checked":true},
     {"id":"e4","label":"SMM и контент-маркетинг","checked":true}
   ]},
   {"id":"accept","title":"10. Приёмка и гарантии","items":[
     {"id":"ac1","label":"Демо на тестовом домене перед запуском","checked":true},
     {"id":"ac2","label":"Подписание акта выполненных работ","checked":true},
     {"id":"ac3","label":"Гарантия на исправление ошибок 30 дней","checked":true}
   ]}
 ]'::jsonb),
('Универсальный',
 'Все возможные блоки. По умолчанию большинство галочек выключено — отмечайте только нужное.',
 'universal',
 true,
 '[
   {"id":"goals","title":"1. Цели и задачи","items":[
     {"id":"g1","label":"Создание имиджевого сайта","checked":false},
     {"id":"g2","label":"Привлечение заявок","checked":false},
     {"id":"g3","label":"Продажа товаров онлайн","checked":false},
     {"id":"g4","label":"Автоматизация бизнес-процессов","checked":false}
   ]},
   {"id":"structure","title":"2. Структура сайта","items":[
     {"id":"s1","label":"Главная страница","checked":false},
     {"id":"s2","label":"О компании","checked":false},
     {"id":"s3","label":"Услуги / Каталог","checked":false},
     {"id":"s4","label":"Портфолио / Кейсы","checked":false},
     {"id":"s5","label":"Блог / Новости","checked":false},
     {"id":"s6","label":"Контакты","checked":false},
     {"id":"s7","label":"Личный кабинет","checked":false}
   ]},
   {"id":"forms","title":"3. Формы и точки захвата","items":[
     {"id":"f1","label":"Форма обратной связи","checked":false},
     {"id":"f2","label":"Заявка на услугу","checked":false},
     {"id":"f3","label":"Подписка на рассылку","checked":false},
     {"id":"f4","label":"Онлайн-чат","checked":false}
   ]},
   {"id":"crm","title":"4. CRM-модуль","items":[
     {"id":"c1","label":"База клиентов","checked":false},
     {"id":"c2","label":"Воронка сделок","checked":false},
     {"id":"c3","label":"Задачи и напоминания","checked":false},
     {"id":"c4","label":"Отчёты и аналитика","checked":false}
   ]},
   {"id":"ads","title":"5. Реклама и продвижение","items":[
     {"id":"a1","label":"Яндекс.Директ","checked":false},
     {"id":"a2","label":"SEO-продвижение","checked":false},
     {"id":"a3","label":"Таргет в соцсетях","checked":false}
   ]},
   {"id":"hosting","title":"6. Хостинг и домен","items":[
     {"id":"h1","label":"Регистрация домена","checked":false},
     {"id":"h2","label":"Хостинг и SSL","checked":false},
     {"id":"h3","label":"Техподдержка","checked":false}
   ]},
   {"id":"stages","title":"7. Этапы и сроки","items":[
     {"id":"st1","label":"Прототип","checked":false},
     {"id":"st2","label":"Дизайн","checked":false},
     {"id":"st3","label":"Разработка","checked":false},
     {"id":"st4","label":"Тестирование","checked":false},
     {"id":"st5","label":"Запуск","checked":false}
   ]},
   {"id":"client","title":"8. Обязанности заказчика","items":[
     {"id":"cl1","label":"Предоставить контент","checked":false},
     {"id":"cl2","label":"Согласовывать этапы","checked":false},
     {"id":"cl3","label":"Соблюдать график оплат","checked":false}
   ]},
   {"id":"exclude","title":"9. Что не входит","items":[
     {"id":"e1","label":"Закупка фото/видео","checked":false},
     {"id":"e2","label":"Копирайтинг","checked":false},
     {"id":"e3","label":"SMM","checked":false}
   ]},
   {"id":"accept","title":"10. Приёмка и гарантии","items":[
     {"id":"ac1","label":"Демо перед запуском","checked":false},
     {"id":"ac2","label":"Подписание акта","checked":false},
     {"id":"ac3","label":"Гарантия 30 дней","checked":false}
   ]}
 ]'::jsonb);

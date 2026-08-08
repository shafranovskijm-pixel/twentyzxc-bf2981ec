-- Active client workspaces: service stage, next action, risks and reusable scripts.
CREATE TABLE public.client_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  service_type text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  stage text NOT NULL DEFAULT 'Новый запрос',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'done', 'paused')),
  progress_completed integer NOT NULL DEFAULT 0 CHECK (progress_completed >= 0),
  progress_total integer NOT NULL DEFAULT 7 CHECK (progress_total > 0),
  next_step text,
  next_step_at timestamptz,
  risk_level text NOT NULL DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high')),
  risk_note text,
  scope_summary text,
  call_script text,
  email_subject text,
  email_body text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX client_projects_one_active_per_client
  ON public.client_projects (client_id)
  WHERE status = 'active';

CREATE INDEX client_projects_next_step_at_idx
  ON public.client_projects (status, next_step_at);

ALTER TABLE public.client_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage client projects" ON public.client_projects
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_projects TO authenticated;
GRANT ALL ON public.client_projects TO service_role;

CREATE TRIGGER update_client_projects_updated_at
  BEFORE UPDATE ON public.client_projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Prepare the known client card without overwriting already filled values.
UPDATE public.clients
SET
  contact_person = COALESCE(NULLIF(contact_person, ''), 'Борис Царьков'),
  phone = COALESCE(NULLIF(phone, ''), '+7 927 611-19-55'),
  email = COALESCE(NULLIF(email, ''), 'technoservice69@mail.ru'),
  inn = COALESCE(NULLIF(inn, ''), '6382090879'),
  kpp = COALESCE(NULLIF(kpp, ''), '638201001'),
  ogrn = COALESCE(NULLIF(ogrn, ''), '1226300019494'),
  legal_address = COALESCE(NULLIF(legal_address, ''), '445021, Самарская область, г. Тольятти, ул. Ленинградская, д. 49, помещ. 1005, ком. 49'),
  director_name = COALESCE(NULLIF(director_name, ''), 'Царьков Борис Игоревич'),
  director_post = COALESCE(NULLIF(director_post, ''), 'Директор'),
  service_type = 'ЛИЦЕНЗИЯ 28-ФЗ',
  service_deadline = '2026-08-31'
WHERE inn = '6382090879'
   OR lower(name) LIKE '%техносервис%';

INSERT INTO public.client_projects (
  client_id,
  service_type,
  price,
  stage,
  status,
  progress_completed,
  progress_total,
  next_step,
  next_step_at,
  risk_level,
  risk_note,
  scope_summary,
  call_script,
  email_subject,
  email_body
)
SELECT
  c.id,
  'Лицензионный комплаенс 28-ФЗ',
  35000,
  'Запрошены документы',
  'active',
  2,
  7,
  'Позвонить в ЦПО Самарской области и согласовать мэппинг и порядок подачи',
  '2026-08-10 06:00:00+00',
  'high',
  'Нет официального мэппинга по части программ. Не заполнять области и виды деятельности по аналогии без согласования.',
  'Аудит 26 программ; сопоставление до 18 кандидатов; одно согласование с Самарой; один пакет заявления; одна подача; одна отработка формального замечания. Разработка программ не входит.',
  'Добрый день. Меня зовут Максим Шафрановский. Сопровождаю ООО УЦ «ТЕХНОСЕРВИС», лицензия Л035-01213-63/00617723. Готовим заявление до 1 сентября по 28-ФЗ. Подскажите, пожалуйста: можно ли включить все программы в одно заявление; какие области и виды профессиональной деятельности указывать по приказам Ростехнадзора № 155, Минприроды № 755 и МЧС № 596; какие приложения нужны; как подавать программы, если в типовой ДПП нет прямого мэппинга? У нас готова таблица, можем направить на предварительную проверку.',
  'ООО УЦ «ТЕХНОСЕРВИС» — уточнение порядка внесения изменений в реестр лицензий по 28-ФЗ',
  'Добрый день! Сопровождаем ООО УЦ «ТЕХНОСЕРВИС» (ИНН 6382090879, лицензия Л035-01213-63/00617723) при подготовке заявления о внесении в реестр лицензий областей и видов профессиональной деятельности по ДПП, разработанным на основании типовых программ. Просим сообщить: 1) допустимо ли подать одно заявление по нескольким программам; 2) какие области и виды указывать по приказам № 155, № 755 и № 596; 3) какие документы приложить; 4) как действовать при отсутствии прямого мэппинга в типовой программе; 5) можно ли направить таблицу на предварительную проверку. С уважением, Максим Шафрановский, +7 (914) 721-34-24, support@sintagma.com.ru.'
FROM public.clients c
WHERE c.inn = '6382090879'
   OR lower(c.name) LIKE '%техносервис%'
ON CONFLICT DO NOTHING;

-- Enrich the task that may already have been created manually in the planner.
UPDATE public.tasks t
SET description = COALESCE(
  NULLIF(t.description, ''),
  '10:00 по Самаре / 16:00 по Владивостоку. Телефон: (846) 332-49-03. Уточнить одно заявление по нескольким программам, области и виды по приказам № 155, № 755 и № 596, приложения и порядок действий при отсутствии прямого мэппинга. Результат звонка зафиксировать в активности клиента.'
)
FROM public.clients c
WHERE t.client_id = c.id
  AND (c.inn = '6382090879' OR lower(c.name) LIKE '%техносервис%')
  AND t.title = 'Позвонить в ЦПО Самарской области по 28-ФЗ — ООО УЦ ТЕХНОСЕРВИС'
  AND t.task_date = '2026-08-10';

INSERT INTO public.tasks (title, description, task_date, status, sort_order, client_id)
SELECT
  'Позвонить в ЦПО Самарской области по 28-ФЗ — ООО УЦ ТЕХНОСЕРВИС',
  '10:00 по Самаре / 16:00 по Владивостоку. Телефон: (846) 332-49-03. Уточнить одно заявление по нескольким программам, области и виды по приказам № 155, № 755 и № 596, приложения и порядок действий при отсутствии прямого мэппинга. Результат звонка зафиксировать в активности клиента.',
  '2026-08-10',
  'todo',
  0,
  c.id
FROM public.clients c
WHERE (c.inn = '6382090879' OR lower(c.name) LIKE '%техносервис%')
  AND NOT EXISTS (
    SELECT 1 FROM public.tasks t
    WHERE t.client_id = c.id
      AND t.title = 'Позвонить в ЦПО Самарской области по 28-ФЗ — ООО УЦ ТЕХНОСЕРВИС'
      AND t.task_date = '2026-08-10'
  );



## План: Организации с отдельными аккаунтами + шаблон лендинга для товаров

### Обзор

Три больших блока:
1. **Роль «organization»** — новый тип пользователя в системе
2. **Панель организации** — замена «Файлы» на «Организации» в сайдбаре админа, + собственная панель для пользователей с ролью organization
3. **Шаблон лендинга** — атмосферный лендинг для продажи товаров (стиль «ЛЕС»), доступный организациям из их профиля

---

### 1. База данных

**Миграция:**
- Добавить `'organization'` в enum `app_role` (`ALTER TYPE public.app_role ADD VALUE 'organization'`)
- Создать таблицу `organizations`:
  - `id uuid PK`, `user_id uuid NOT NULL` (владелец аккаунта), `name text`, `inn text`, `logo_url text`, `landing_slug text UNIQUE`, `landing_config jsonb DEFAULT '{}'`, `created_at`, `updated_at`
  - RLS: organization видит только свои записи (`auth.uid() = user_id`), admin видит все
- Создать таблицу `org_contracts` (зеркало contracts, но с `organization_id` FK → organizations)
- Создать таблицу `org_clients` (зеркало clients, но с `organization_id`)
- Создать таблицу `org_tasks` (зеркало tasks, но с `organization_id`)
- Создать таблицу `org_files` (файлы организации: `organization_id`, `file_name`, `file_path`, `file_size`)
- RLS на все org_* таблицы: `auth.uid() = (SELECT user_id FROM organizations WHERE id = organization_id)` + admin full access
- Создать storage bucket `org-files` (private)
- Обновить `handle_new_user()` — оставить как есть (роль user по умолчанию), organization назначается через админку

**Функция `has_role`** — уже поддерживает любые значения `app_role`, будет работать с `'organization'` после расширения enum.

---

### 2. Админ-панель (ваша, admin role)

**Сайдбар (`AdminSidebar.tsx`):**
- Убрать `files` из `defaultMenuItems`
- Добавить `{ id: "organizations", label: "Организации", icon: Building2 }`

**Вкладка «Организации» (`OrganizationsTab.tsx`):**
- Список всех организаций (таблица: название, ИНН, владелец, дата создания)
- Кнопка «Создать организацию» — создаёт аккаунт (email + пароль), присваивает роль `organization`, создаёт запись в `organizations`
- Карточка организации: редактирование, просмотр её договоров/клиентов/задач
- Кнопка для управления лендингом организации

**Admin.tsx:**
- Убрать `{activeSection === "files" && <FilesTab />}`
- Добавить `{activeSection === "organizations" && <OrganizationsTab />}`
- Обновить `sectionTitles`

---

### 3. Панель организации (organization role)

**Новая страница `/org` (`src/pages/OrgPanel.tsx`):**
- Роутинг: проверка `has_role(uid, 'organization')`, если нет — редирект на логин
- Такой же layout, как админка (сайдбар + хедер + баннер + темы)
- Сайдбар с пунктами: Договоры, Планер, Клиенты, Файлы, AI Ассистент, Профиль
- В Профиле: оформление (темы), данные организации, **кнопка «Создать лендинг»**

**Компоненты организации:**
- `OrgContractsTab` — CRUD по `org_contracts` (фильтр по organization_id)
- `OrgClientsTab` — CRUD по `org_clients`
- `OrgPlannerTab` — задачи в `org_tasks`
- `OrgFilesTab` — загрузка/скачивание файлов в bucket `org-files`
- `OrgAIChat` — тот же InlineAIChat

**Auth flow:**
- Организация логинится на `/org` (email + пароль)
- Hook `useOrgAuth` — аналог `useAdminAuth`, но проверяет роль `organization`
- После логина загружает данные организации из `organizations` WHERE `user_id = auth.uid()`

---

### 4. Лендинг-шаблон для товаров (стиль «ЛЕС»)

**Страница `/shop/:slug` (`src/pages/OrgLanding.tsx`):**
- Загружает `landing_config` из таблицы `organizations` по `slug`
- Атмосферный fullscreen дизайн в стиле «ЛЕС»:
  - Hero на весь экран с parallax-фоновым изображением, большой заголовок с тенью/свечением
  - Плавные scroll-reveal секции (Framer Motion)
  - Секция товаров (карточки с hover-эффектами, цена, описание)
  - Бегущая строка с тегами (как «тишина✦мох✦свет» в ЛЕС)
  - Счётчики (AnimatedCounter)
  - FAQ аккордеон
  - Контакты + форма заявки (→ org_clients или leads)
  - Footer с соцсетями
- Палитра настраивается через `landing_config`: цвета, фон, логотип, товары, тексты

**Конструктор лендинга в профиле организации:**
- Подтаб «Мой лендинг» в профиле организации
- Форма: название, подзаголовок, фоновое изображение (upload в `org-files`), цветовая схема
- Список товаров: название, описание, цена, изображение
- Предпросмотр + публикация (генерация slug)

---

### Файлы (новые)

| Файл | Описание |
|------|----------|
| `src/pages/OrgPanel.tsx` | Панель организации |
| `src/pages/OrgLanding.tsx` | Публичный лендинг организации |
| `src/hooks/use-org-auth.tsx` | Auth hook для роли organization |
| `src/components/org/OrgSidebar.tsx` | Сайдбар панели организации |
| `src/components/org/OrgContractsTab.tsx` | Договоры организации |
| `src/components/org/OrgClientsTab.tsx` | Клиенты организации |
| `src/components/org/OrgPlannerTab.tsx` | Планер организации |
| `src/components/org/OrgFilesTab.tsx` | Файлы организации |
| `src/components/org/OrgLandingEditor.tsx` | Конструктор лендинга |
| `src/components/admin/OrganizationsTab.tsx` | Управление организациями в админке |

### Файлы (изменяемые)

| Файл | Изменение |
|------|-----------|
| `src/components/admin/AdminSidebar.tsx` | Убрать files, добавить organizations |
| `src/pages/Admin.tsx` | Убрать FilesTab, добавить OrganizationsTab |
| `src/App.tsx` | Добавить роуты `/org` и `/shop/:slug` |

### Миграции

1. `ALTER TYPE app_role ADD VALUE 'organization'`
2. Создание таблиц `organizations`, `org_contracts`, `org_clients`, `org_tasks`, `org_files`
3. RLS-политики для всех новых таблиц
4. Storage bucket `org-files`

---

### Порядок реализации

Из-за объёма задачи разобью на этапы:
1. **Миграция БД** — enum, таблицы, RLS, bucket
2. **Админка** — сайдбар + OrganizationsTab (создание организаций)
3. **Панель организации** — auth, layout, базовые вкладки
4. **Лендинг** — шаблон + редактор в профиле организации


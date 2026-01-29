
# План реализации: Маркетплейс услуг с личным кабинетом и админ-панелью

## Обзор проекта

Создание полноценной доски объявлений на базе раздела "Все услуги в одном месте" с возможностью для любого пользователя размещать объявления, управлять ими через личный кабинет, а также SEO-оптимизация для максимального охвата в поисковых системах.

---

## Архитектура системы

```text
┌─────────────────────────────────────────────────────────────────┐
│                        ФРОНТЕНД (React)                         │
├─────────────┬─────────────┬─────────────┬─────────────┬─────────┤
│  Каталог    │   Личный    │   Админ-    │  Страницы   │  SEO    │
│  услуг      │   кабинет   │   панель    │  объявлений │  meta   │
└──────┬──────┴──────┬──────┴──────┬──────┴──────┬──────┴────┬────┘
       │             │             │             │           │
       └─────────────┴──────┬──────┴─────────────┴───────────┘
                            │
┌───────────────────────────┴───────────────────────────────────┐
│                      SUPABASE                                  │
├────────────┬────────────┬────────────┬────────────────────────┤
│   Auth     │   Database │   Storage  │      Edge Functions    │
│            │   (RLS)    │  (images)  │      (sitemap)         │
└────────────┴────────────┴────────────┴────────────────────────┘
```

---

## Этап 1: Подключение Supabase и база данных

### 1.1 Подключение Supabase к проекту
- Интеграция Supabase через встроенный механизм Lovable
- Настройка клиента в `src/integrations/supabase`

### 1.2 Схема базы данных

**Таблица `categories` (категории услуг)**
| Поле | Тип | Описание |
|------|-----|----------|
| id | uuid | Первичный ключ |
| name | text | Название (Недвижимость, Авто...) |
| slug | text | URL-slug (nedvizhimost, avto...) |
| icon | text | Название иконки Lucide |
| description | text | Краткое описание |
| sort_order | int | Порядок сортировки |
| created_at | timestamp | Дата создания |

**Таблица `listings` (объявления)**
| Поле | Тип | Описание |
|------|-----|----------|
| id | uuid | Первичный ключ |
| user_id | uuid | FK на auth.users |
| category_id | uuid | FK на categories |
| title | text | Заголовок объявления |
| description | text | Описание |
| price | numeric | Цена (опционально) |
| price_type | enum | Тип цены (fixed, negotiable, free) |
| location | text | Город/регион |
| contact_phone | text | Телефон |
| contact_email | text | Email |
| contact_telegram | text | Telegram |
| images | text[] | Массив URL изображений |
| status | enum | pending, active, rejected, archived |
| views_count | int | Счетчик просмотров |
| created_at | timestamp | Дата создания |
| updated_at | timestamp | Дата обновления |
| expires_at | timestamp | Срок действия |

**Таблица `user_roles` (роли пользователей)**
| Поле | Тип | Описание |
|------|-----|----------|
| id | uuid | Первичный ключ |
| user_id | uuid | FK на auth.users |
| role | enum | admin, moderator, user |

**Таблица `profiles` (профили пользователей)**
| Поле | Тип | Описание |
|------|-----|----------|
| id | uuid | PK = auth.users.id |
| display_name | text | Отображаемое имя |
| phone | text | Телефон |
| avatar_url | text | Аватар |
| created_at | timestamp | Дата регистрации |

### 1.3 RLS-политики (безопасность на уровне строк)

```text
listings:
├── SELECT: Все могут читать активные объявления
├── INSERT: Авторизованные пользователи
├── UPDATE: Только владелец или admin
└── DELETE: Только владелец или admin

categories:
├── SELECT: Все могут читать
└── INSERT/UPDATE/DELETE: Только admin

profiles:
├── SELECT: Все могут читать
└── UPDATE: Только владелец

user_roles:
└── Только через security definer функции
```

---

## Этап 2: Аутентификация

### 2.1 Страницы авторизации
- `/auth` — страница входа/регистрации
- Компоненты: LoginForm, RegisterForm
- Поддержка email + пароль
- Опционально: OAuth (Google, VK)

### 2.2 Защищенные маршруты
- HOC `ProtectedRoute` для личного кабинета
- HOC `AdminRoute` для админ-панели
- Редирект неавторизованных на `/auth`

---

## Этап 3: Каталог объявлений (публичная часть)

### 3.1 Новые страницы
- `/services` — каталог всех категорий с фильтрами
- `/services/[category-slug]` — объявления категории
- `/listing/[id]` — страница объявления

### 3.2 Компоненты каталога
- `CategoryGrid` — сетка категорий
- `ListingCard` — карточка объявления
- `ListingFilters` — фильтры (цена, город, сортировка)
- `ListingSearch` — поиск по названию
- `ListingDetail` — полная страница объявления
- `ContactButtons` — кнопки связи (телефон, Telegram, WhatsApp)

### 3.3 Расширенные категории
Добавляем к существующим:
- IT и Digital
- Красота и стиль
- Транспорт и логистика
- Мероприятия
- Домашний персонал
- Финансовые услуги

---

## Этап 4: Личный кабинет

### 4.1 Структура маршрутов
```text
/dashboard
├── /dashboard              — Обзор (статистика)
├── /dashboard/listings     — Мои объявления
├── /dashboard/listings/new — Создать объявление
├── /dashboard/listings/[id]/edit — Редактировать
├── /dashboard/profile      — Настройки профиля
└── /dashboard/messages     — Сообщения (будущее)
```

### 4.2 Компоненты личного кабинета
- `DashboardLayout` — макет с боковым меню
- `DashboardSidebar` — навигация ЛК
- `MyListings` — список моих объявлений
- `ListingForm` — форма создания/редактирования
- `ProfileForm` — редактирование профиля
- `DashboardStats` — статистика (просмотры, активные)

### 4.3 Функционал
- Создание объявления с загрузкой до 5 фото
- Редактирование и архивирование
- Просмотр статистики просмотров
- Продление срока действия

---

## Этап 5: Админ-панель

### 5.1 Структура маршрутов
```text
/admin
├── /admin                  — Дашборд статистики
├── /admin/listings         — Все объявления
├── /admin/categories       — Управление категориями
├── /admin/users            — Пользователи
└── /admin/settings         — Настройки сайта
```

### 5.2 Компоненты админки
- `AdminLayout` — макет админ-панели
- `AdminSidebar` — навигация
- `ListingsTable` — таблица объявлений с модерацией
- `CategoriesManager` — CRUD категорий
- `UsersTable` — список пользователей
- `AdminStats` — статистика системы

### 5.3 Функционал администратора
- Просмотр всех объявлений
- Удаление/блокировка нарушителей
- Управление категориями (добавление, редактирование)
- Назначение модераторов
- Просмотр статистики сайта

---

## Этап 6: SEO-оптимизация

### 6.1 Динамические мета-теги
- Компонент `SEOHead` для каждой страницы
- Уникальные title, description для каждого объявления
- Open Graph теги для соцсетей
- JSON-LD разметка (Schema.org)

### 6.2 Структурированные данные
```json
{
  "@type": "Service",
  "name": "Название услуги",
  "description": "Описание",
  "provider": { "@type": "Person", "name": "Имя" },
  "areaServed": "Москва",
  "offers": { "@type": "Offer", "price": "1000" }
}
```

### 6.3 Технические улучшения
- Канонические URL
- Хлебные крошки (Breadcrumbs)
- Sitemap.xml (динамический через Edge Function)
- robots.txt с правилами для категорий

### 6.4 URL-структура
```text
/services                        — Все категории
/services/nedvizhimost           — Категория
/services/nedvizhimost?city=msk  — С фильтром
/listing/abc123                  — Объявление
/listing/abc123-krasivaya-kvartira — SEO-friendly slug
```

---

## Этап 7: Хранение изображений

### 7.1 Supabase Storage
- Bucket `listing-images` для фото объявлений
- Bucket `avatars` для аватаров пользователей
- Политики доступа: публичное чтение, запись авторизованным

### 7.2 Компонент загрузки
- `ImageUploader` с drag-and-drop
- Ограничение 5 изображений на объявление
- Сжатие перед загрузкой
- Превью загруженных фото

---

## Структура файлов (новые)

```text
src/
├── pages/
│   ├── Auth.tsx
│   ├── Services.tsx
│   ├── ServiceCategory.tsx
│   ├── ListingDetail.tsx
│   ├── dashboard/
│   │   ├── Dashboard.tsx
│   │   ├── MyListings.tsx
│   │   ├── NewListing.tsx
│   │   ├── EditListing.tsx
│   │   └── Profile.tsx
│   └── admin/
│       ├── AdminDashboard.tsx
│       ├── AdminListings.tsx
│       ├── AdminCategories.tsx
│       └── AdminUsers.tsx
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   └── ProtectedRoute.tsx
│   ├── listings/
│   │   ├── ListingCard.tsx
│   │   ├── ListingForm.tsx
│   │   ├── ListingFilters.tsx
│   │   ├── ListingSearch.tsx
│   │   └── ImageUploader.tsx
│   ├── dashboard/
│   │   ├── DashboardLayout.tsx
│   │   ├── DashboardSidebar.tsx
│   │   └── DashboardStats.tsx
│   ├── admin/
│   │   ├── AdminLayout.tsx
│   │   ├── AdminSidebar.tsx
│   │   └── ListingsTable.tsx
│   └── seo/
│       ├── SEOHead.tsx
│       └── JsonLd.tsx
├── hooks/
│   ├── use-listings.tsx
│   ├── use-categories.tsx
│   ├── use-auth.tsx
│   └── use-admin.tsx
└── lib/
    └── seo.ts
```

---

## Порядок реализации

| Шаг | Задача | Приоритет |
|-----|--------|-----------|
| 1 | Подключение Supabase | Высокий |
| 2 | Создание таблиц и RLS | Высокий |
| 3 | Аутентификация | Высокий |
| 4 | Страница каталога услуг | Высокий |
| 5 | Страница объявления | Высокий |
| 6 | Личный кабинет (базовый) | Высокий |
| 7 | Форма создания объявления | Высокий |
| 8 | Загрузка изображений | Средний |
| 9 | Админ-панель (базовая) | Средний |
| 10 | SEO-оптимизация | Средний |
| 11 | Расширенная статистика | Низкий |

---

## Технические детали

### Используемые технологии
- **База данных**: Supabase PostgreSQL
- **Аутентификация**: Supabase Auth
- **Хранение файлов**: Supabase Storage
- **Фронтенд**: React + TypeScript + Tailwind
- **Состояние**: TanStack Query для кеширования
- **Формы**: react-hook-form + zod
- **SEO**: react-helmet-async для мета-тегов

### Безопасность
- RLS-политики для всех таблиц
- Роли через отдельную таблицу user_roles
- Security definer функции для проверки ролей
- Валидация всех форм на клиенте и сервере

---

## Ожидаемый результат

После реализации сайт будет:
1. Позволять любому зарегистрироваться и разместить объявление
2. Показывать объявления в красивом каталоге с фильтрами
3. Индексироваться поисковиками благодаря SEO
4. Иметь удобный личный кабинет для управления объявлениями
5. Предоставлять администратору полный контроль над контентом

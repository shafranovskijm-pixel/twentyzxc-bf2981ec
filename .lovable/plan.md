
# План добавления AI-сгенерированных изображений для шаблонов

## Обзор проблемы

Во всех превью шаблонов на страницах `/templates/:id/preview` отображаются пустые заглушки вместо реальных изображений:
- **Marble & Gold**: пустые карточки портфолио (6 шт), аватарки команды (4 шт)
- **Noir Elegance**: нет изображений проектов
- **Golden Prestige**: видео-плейсхолдер, сервисы
- **Luxe Boutique**: карточки товаров (6 шт), hero-изображение
- **Artisan Market**: товары (6 шт), аватарки мастеров (3 шт)
- **Executive Suite**: аватарки команды (4 шт), сервисные карточки
- **CRM Elite / Dashboard Pro**: аватарки пользователей (интерфейсные)
- **Crystal Vision**: hero-изображение, проекты
- **Tech Horizon**: проекты, команда
- **Premium Gallery**: галерея товаров

## Решение

Создать сервис генерации изображений через Lovable AI (google/gemini-2.5-flash-image) и интегрировать его в превью шаблонов.

## Техническая реализация

### Фаза 1: Создание edge function для генерации изображений

Создать edge function `generate-template-images/index.ts`:
- Принимает параметры: тип шаблона, категория изображения, стиль
- Генерирует изображение через Lovable AI API
- Сохраняет в Supabase Storage bucket `template-images`
- Возвращает публичный URL

### Фаза 2: Создание хука для работы с изображениями

Создать `src/hooks/use-template-images.tsx`:
- Получает/кешитрует изображения для конкретного шаблона
- Fallback на placeholder при ошибке
- Ленивая загрузка для производительности

### Фаза 3: Обновление превью компонентов

Обновить каждый Preview компонент для использования реальных изображений:

**Marble & Gold (6 портфолио + 4 команды = 10 изображений):**
- Penthouse Azure — интерьер пентхауса с мраморными текстурами
- Villa Serenity — вилла с золотыми акцентами
- Boutique Hotel — отель в стиле люкс
- Private Yacht — яхта премиум-класса
- Corporate HQ — корпоративный офис
- Art Gallery — галерея искусств
- 4 портретных фото команды

**Luxe Boutique (6 товаров + hero):**
- Silk Essence Dress
- Velvet Evening Gown
- Cashmere Coat
- Leather Handbag
- Pearl Necklace
- Silk Blouse
- Hero: fashion модель

**Artisan Market (6 товаров + 3 мастера):**
- Керамическая ваза
- Кожаная сумка
- Деревянная шкатулка
- Льняной плед
- Серебряные серьги
- Глиняный горшок
- 3 портрета мастеров

### Фаза 4: Storage и миграции

```sql
-- Создать bucket для изображений шаблонов
insert into storage.buckets (id, name, public)
values ('template-images', 'template-images', true);

-- RLS политика для публичного чтения
create policy "Public read access"
on storage.objects for select
using (bucket_id = 'template-images');
```

### Фаза 5: Создание ImageWithFallback компонента

Создать переиспользуемый компонент:
- Показывает loading skeleton при загрузке
- Fade-in анимация при появлении
- Fallback на градиент при ошибке
- Поддержка lazy loading

## Промпты для генерации изображений

| Категория | Пример промпта |
|-----------|----------------|
| Интерьер | "Luxury penthouse interior with marble textures and gold accents, minimalist modern design, 4k, photorealistic" |
| Fashion | "Elegant silk evening dress on mannequin, rose gold tones, studio photography, high-end fashion" |
| Handcraft | "Artisan ceramic vase with natural glaze, warm lighting, product photography on neutral background" |
| Portrait | "Professional headshot of business woman, neutral background, soft lighting, corporate style" |

## Структура файлов

```text
src/
├── hooks/
│   └── use-template-images.tsx
├── components/
│   └── templates/
│       └── ImageWithFallback.tsx
supabase/
└── functions/
    └── generate-template-images/
        └── index.ts
```

## Альтернативный подход (рекомендуемый)

Вместо динамической генерации при просмотре, можно:
1. Сгенерировать все изображения один раз через edge function
2. Сохранить в Storage
3. Использовать статические URL в компонентах

Это быстрее для пользователей и экономит API-вызовы.

## Оценка объема

- **~40-50 уникальных изображений** для всех 12 шаблонов
- **Время генерации**: ~2-3 минуты на все изображения
- **Storage**: ~50-100 MB (в зависимости от разрешения)

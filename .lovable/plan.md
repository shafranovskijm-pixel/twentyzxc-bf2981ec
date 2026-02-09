
# План реализации: Отзывы и Конструктор "Веб-разработчик"

## Обзор задачи

Замена раздела "Услуги" в футере на два новых раздела:
1. **Отзывы** - страница с авторизацией через Google для оставления отзывов
2. **Игра "Веб-разработчик"** - интерактивный конструктор с эффектами и анимациями

---

## Часть 1: Страница Отзывов (`/reviews`)

### 1.1. Настройка Google OAuth

Используем Lovable Cloud для авторизации через Google:
- Настройка социальной авторизации через `configure-social-auth` tool
- Генерация модуля `@lovable.dev/cloud-auth-js`

### 1.2. Создание таблицы отзывов

```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  user_avatar TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  is_approved BOOLEAN DEFAULT true
);

-- RLS политики
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Все могут читать одобренные отзывы
CREATE POLICY "Anyone can read approved reviews"
  ON reviews FOR SELECT
  USING (is_approved = true);

-- Авторизованные пользователи могут создавать отзывы
CREATE POLICY "Authenticated users can insert reviews"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Пользователи могут удалять свои отзывы
CREATE POLICY "Users can delete own reviews"
  ON reviews FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
```

### 1.3. Структура страницы Reviews

```text
+-----------------------------------------------------------+
|                      HEADER                               |
+-----------------------------------------------------------+
|                                                           |
|              ★ ОТЗЫВЫ НАШИХ КЛИЕНТОВ ★                   |
|                                                           |
|  [Кнопка: Войти через Google] (если не авторизован)       |
|  [Форма отзыва] (если авторизован)                        |
|                                                           |
|  +-------+  +-------+  +-------+                          |
|  | Отзыв |  | Отзыв |  | Отзыв |  ... (masonry grid)      |
|  +-------+  +-------+  +-------+                          |
|                                                           |
+-----------------------------------------------------------+
|                      FOOTER                               |
+-----------------------------------------------------------+
```

### 1.4. Компоненты

| Файл | Описание |
|------|----------|
| `src/pages/Reviews.tsx` | Основная страница |
| `src/components/reviews/ReviewCard.tsx` | Карточка отзыва |
| `src/components/reviews/ReviewForm.tsx` | Форма добавления |
| `src/components/reviews/GoogleAuthButton.tsx` | Кнопка входа через Google |
| `src/components/reviews/StarRating.tsx` | Компонент рейтинга (1-5 звёзд) |

---

## Часть 2: Игра "Веб-разработчик" (`/playground`)

### 2.1. Концепция

Интерактивный конструктор где пользователи могут:
- Добавлять/удалять блоки
- Выбирать эффекты и анимации
- Настраивать цвета и фоны
- Сохранять результат на уникальную страницу

### 2.2. Таблица для сохранённых проектов

```sql
CREATE TABLE playground_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  blocks JSONB NOT NULL DEFAULT '[]',
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Публичный доступ для чтения
ALTER TABLE playground_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read projects"
  ON playground_projects FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert projects"
  ON playground_projects FOR INSERT
  WITH CHECK (true);
```

### 2.3. Доступные эффекты и анимации

| Категория | Эффекты |
|-----------|---------|
| **Fade** | fade-in, fade-out, fade-in-left, fade-in-right |
| **Scale** | scale-in, scale-out, pulse, bounce |
| **Slide** | slide-up, slide-down, slide-left, slide-right |
| **Rotate** | rotate-in, rotate-slow, spin |
| **Hover** | hover-scale, hover-glow, hover-lift, tilt-3d |
| **Particles** | floating-particles, sparkle, shimmer |
| **Glow** | glow-gold, glow-subtle, neon-glow |
| **Parallax** | parallax-slow, parallax-fast |

### 2.4. Структура страницы Playground

```text
+-----------------------------------------------------------+
|  [Название проекта]  [Сохранить]  [Поделиться]  [Сбросить] |
+-----------------------------------------------------------+
|                    |                                       |
|   ПАНЕЛЬ БЛОКОВ    |         CANVAS (Preview)             |
|                    |                                       |
|   [+ Заголовок]    |   +-------------------------------+  |
|   [+ Текст]        |   |                               |  |
|   [+ Кнопка]       |   |      Добавленные блоки        |  |
|   [+ Изображение]  |   |      с эффектами              |  |
|   [+ Разделитель]  |   |                               |  |
|   [+ Карточка]     |   +-------------------------------+  |
|                    |                                       |
+--------------------+---------------------------------------+
|                                                           |
|  ПАНЕЛЬ НАСТРОЕК ВЫБРАННОГО БЛОКА                         |
|  [Анимация: dropdown]  [Цвет: picker]  [Размер: slider]   |
|  [Фон: picker]  [Отступы: inputs]  [Удалить]              |
|                                                           |
+-----------------------------------------------------------+
```

### 2.5. Компоненты конструктора

| Файл | Описание |
|------|----------|
| `src/pages/Playground.tsx` | Основная страница конструктора |
| `src/pages/PlaygroundView.tsx` | Страница просмотра сохранённого проекта |
| `src/components/playground/BlockPalette.tsx` | Панель доступных блоков |
| `src/components/playground/Canvas.tsx` | Область предпросмотра |
| `src/components/playground/BlockEditor.tsx` | Редактор свойств блока |
| `src/components/playground/EffectSelector.tsx` | Выбор эффекта/анимации |
| `src/components/playground/ColorPicker.tsx` | Выбор цвета |
| `src/components/playground/AnimationPreview.tsx` | Превью анимации |
| `src/hooks/use-playground.tsx` | Хук управления состоянием |
| `src/data/playground-effects.ts` | Каталог эффектов с описаниями |

### 2.6. Типы данных

```typescript
interface PlaygroundBlock {
  id: string;
  type: 'heading' | 'text' | 'button' | 'image' | 'divider' | 'card';
  content: string;
  animation?: AnimationEffect;
  hoverEffect?: HoverEffect;
  styles: BlockStyles;
}

interface BlockStyles {
  backgroundColor?: string;
  textColor?: string;
  padding?: string;
  fontSize?: string;
  borderRadius?: string;
}

interface AnimationEffect {
  name: string;
  description: string;
  duration?: number;
  delay?: number;
}
```

---

## Часть 3: Обновление Footer

Замена раздела "Услуги":

```tsx
// До
<h4>Услуги</h4>
<li>Веб-разработка</li>
<li>Реклама</li>
<li>Каталог услуг</li>
<li>Синтагма</li>

// После
<h4>Сообщество</h4>
<li><Link to="/reviews">Отзывы</Link></li>
<li><Link to="/playground">Игра "Веб-разработчик"</Link></li>
<li><Link to="/templates">Каталог шаблонов</Link></li>
<li><a href="#">Синтагма</a></li>
```

---

## Часть 4: Маршрутизация

Добавление в `App.tsx`:

```tsx
import Reviews from "./pages/Reviews";
import Playground from "./pages/Playground";
import PlaygroundView from "./pages/PlaygroundView";

<Route path="/reviews" element={<Reviews />} />
<Route path="/playground" element={<Playground />} />
<Route path="/p/:slug" element={<PlaygroundView />} />
```

---

## Порядок реализации

1. **Настройка Google OAuth** через Lovable Cloud
2. **Миграция базы данных** - создание таблиц `reviews` и `playground_projects`
3. **Страница отзывов** - компоненты авторизации, форма, список
4. **Конструктор** - блоки, эффекты, canvas, сохранение
5. **Обновление Footer** - новые ссылки
6. **Тестирование** - проверка потоков авторизации и сохранения

---

## Технические детали

### Зависимости
- `@dnd-kit` - уже установлен для drag-and-drop блоков
- `framer-motion` - уже установлен для анимаций
- `@lovable.dev/cloud-auth-js` - будет установлен для Google OAuth

### Стилизация
- Использование существующей дизайн-системы (`luxury-card`, `gradient-gold-text`)
- Декоративные элементы как на других страницах (`FloatingParticles`, `GeometricShapes`)
- Анимации из `tailwind.config.ts` и `index.css`

### Безопасность
- RLS политики для защиты данных
- Google OAuth через Lovable Cloud (управляемое решение)
- Валидация контента отзывов

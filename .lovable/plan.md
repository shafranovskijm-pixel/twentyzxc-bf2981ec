

# Галерея проектов с админ-управлением и форум обратной связи

## 1. Галерея всех проектов внизу страницы /playground

Сейчас `PublishedProjectsGallery` показывает только проекты с `is_featured = true`. Изменим на показ **всех** проектов, а для админа добавим кнопку удаления.

### Что изменится:
- **Убрать фильтр `is_featured`** -- показывать все сохранённые проекты
- **Добавить админ-кнопку удаления** на каждой карточке (красный крестик с подтверждением)
- **Добавить RLS-политику DELETE** для admin на таблицу `playground_projects` (сейчас удаление заблокировано)
- **Добавить RLS-политику UPDATE** для admin (для управления `is_featured`)
- Использовать существующий хук `useAdminAuth` для проверки роли

### Файлы:
- `src/components/playground/PublishedProjectsGallery.tsx` -- добавить проп isAdmin, кнопку удаления, убрать фильтр по featured
- `src/pages/Playground.tsx` -- подключить `useAdminAuth`, передать isAdmin в галерею
- **Миграция БД** -- добавить DELETE и UPDATE политики для admin на `playground_projects`

---

## 2. Форум предложений (Feedback)

Новая секция под галереей проектов -- "Предложения и идеи". Пользователи входят через **Google** и оставляют предложения по улучшению конструктора.

### Структура:
- Новая таблица `playground_feedback` (id, user_id, user_name, user_avatar, content, created_at, status)
- Google-авторизация через `lovable.auth.signInWithOAuth("google")`
- Форма: текстовое поле + кнопка "Отправить"
- Список предложений с аватаром автора и датой
- Админ может удалять предложения

### Файлы:
- **Миграция БД** -- создать таблицу `playground_feedback` с RLS
- `src/components/playground/FeedbackSection.tsx` -- новый компонент с формой и списком
- `src/pages/Playground.tsx` -- добавить секцию под галереей

---

## 3. Доступные способы авторизации

На данный момент поддерживаются:
- **Google** -- полностью работает, уже настроено
- **Apple** -- поддерживается, но не настроено

Других OAuth-провайдеров (GitHub, Discord, Facebook и т.д.) платформа пока не поддерживает.

---

## Техническая часть

### Миграция БД

```sql
-- Разрешить админам удалять проекты из playground
CREATE POLICY "Admins can delete playground projects"
ON public.playground_projects FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Разрешить админам обновлять проекты
CREATE POLICY "Admins can update playground projects"
ON public.playground_projects FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Таблица предложений
CREATE TABLE public.playground_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_name text NOT NULL,
  user_avatar text,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.playground_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read feedback"
ON public.playground_feedback FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert feedback"
ON public.playground_feedback FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own feedback"
ON public.playground_feedback FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete any feedback"
ON public.playground_feedback FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));
```

### Изменения в файлах

1. **`src/components/playground/PublishedProjectsGallery.tsx`**
   - Убрать `.eq("is_featured", true)` -- показывать все проекты
   - Принимать проп `isAdmin: boolean`
   - Добавить кнопку удаления с AlertDialog на каждой карточке (видна только админу)
   - Функция `handleDelete` -- удаление из `playground_projects`

2. **`src/components/playground/FeedbackSection.tsx`** (новый файл)
   - Google-авторизация через `lovable.auth.signInWithOAuth("google")`
   - Форма ввода предложения
   - Список предложений с аватарами
   - Кнопка удаления для автора и админа

3. **`src/pages/Playground.tsx`**
   - Импортировать `useAdminAuth`
   - Передать `isAdmin` в `PublishedProjectsGallery`
   - Добавить `FeedbackSection` после галереи

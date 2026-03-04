

## План: Золотое свечение букв + Промо-блок вместо рекламы

### 1. Добавить золотое свечение к заголовкам

**Файл: `src/index.css`**:
- Добавить `text-shadow` с золотым свечением к `.gradient-gold-text`:
  ```css
  filter: drop-shadow(0 0 20px hsl(42 75% 42% / 0.3));
  ```
- Создать класс `.gold-glow-text` с выраженным золотым text-shadow для заголовков:
  ```css
  text-shadow: 0 0 30px hsl(42 75% 50% / 0.4), 0 0 60px hsl(42 75% 50% / 0.2);
  ```

**Файл: `src/components/HeroSection.tsx`**:
- Добавить золотое свечение к "24ZXC" через дополнительный blur-слой за текстом
- Усилить центральный glow (bg-primary/3 → bg-primary/8)

### 2. Добавить больше декоративных элементов

**Файл: `src/components/decorations/GeometricShapes.tsx`**:
- Добавить золотые точки-акценты (4-5 штук) в разных местах
- Добавить пару тонких горизонтальных золотых линий
- Добавить декоративную рамку-уголок (corner ornament) слева внизу

**Файл: `src/components/HeroSection.tsx`**:
- Добавить больше декоративных линий и ромбов по углам
- Усилить floating orbs (добавить ещё 1-2 с золотым fill)

### 3. Заменить секцию "Реклама" на промо-блок с управлением из админки

**Миграция БД**: Создать таблицу `promotions`:
```sql
CREATE TABLE public.promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  price text,
  old_price text,
  badge text,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
-- Public read
CREATE POLICY "Public can read active promotions" ON public.promotions FOR SELECT USING (is_active = true);
-- Admin write via has_role
CREATE POLICY "Admins can manage promotions" ON public.promotions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
```

Вставить начальную акцию:
```sql
INSERT INTO public.promotions (title, description, price, old_price, badge) 
VALUES ('Сайт + настройка рекламы', 'Разработка сайта под ключ и полная настройка рекламной кампании в Яндекс.Директ', '10 000 ₽', '', 'Акция');
```

**Файл: `src/components/AdvertisingSection.tsx`** → переименовать в `src/components/PromotionSection.tsx`**:
- Вместо платформ и статистики — красивый промо-блок
- Загружает активные акции из таблицы `promotions`
- Отображает: заголовок акции, описание, цена крупно, бейдж "Акция"
- Золотая рамка, свечение, CTA "Оставить заявку" → скролл к контактам
- Декоративные элементы (ромбы, линии) вокруг промо-карточки

**Файл: `src/pages/Index.tsx`**: заменить импорт AdvertisingSection на PromotionSection.

### 4. Добавить вкладку "Акции" в админ-панель

**Файл: `src/pages/Admin.tsx`**:
- Новая вкладка "Акции" в TabsList (grid-cols-2 → grid-cols-3)
- CRUD для акций: список с переключателем активности, форма добавления/редактирования (title, description, price, old_price, badge)
- Возможность менять порядок, включать/выключать

### Итого файлы:
1. `src/index.css` — золотое свечение
2. `src/components/HeroSection.tsx` — усиленные декорации и glow
3. `src/components/decorations/GeometricShapes.tsx` — больше декоративных элементов
4. `src/components/PromotionSection.tsx` — новый промо-блок (замена AdvertisingSection)
5. `src/pages/Index.tsx` — обновить импорт
6. `src/pages/Admin.tsx` — вкладка управления акциями
7. Миграция: таблица `promotions` + RLS + начальные данные




## План: Улучшить карточки акций с иконками + добавить вторую акцию

### 1. Добавить поле `icon` в таблицу `promotions`

Миграция: `ALTER TABLE public.promotions ADD COLUMN icon text;`

Обновить существующую акцию и добавить новую:
```sql
UPDATE public.promotions SET icon = 'Monitor' WHERE title = 'Сайт + настройка рекламы';
INSERT INTO public.promotions (title, description, price, badge, icon, sort_order)
VALUES ('Сайты для образовательных организаций', 'Разработка и поддержка сайта для школ, колледжей и учебных центров с учётом требований Рособрнадзора', '10 000 ₽/год', 'Акция', 'GraduationCap', 1);
```

### 2. Переделать layout карточки акции

**Файл: `src/components/PromotionSection.tsx`**:

- Горизонтальный layout: слева — крупная иконка Lucide в золотом круге (w-20 h-20), справа — текст, цена, CTA
- Иконка рендерится динамически из lucide-react по имени из поля `icon`
- На мобильных — вертикальный layout (иконка сверху по центру)
- Добавить мягкий золотой фоновый gradient за иконкой
- Сетка `grid md:grid-cols-2` если акций 2+, одна карточка — полная ширина

### 3. Обновить админку

**Файл: `src/pages/Admin.tsx`**: добавить поле `icon` (text input с подсказкой "Имя иконки Lucide") в форму создания/редактирования акций.

### Файлы:
1. Миграция SQL — новое поле + вторая акция
2. `src/components/PromotionSection.tsx` — новый layout с иконками
3. `src/pages/Admin.tsx` — поле icon в форме


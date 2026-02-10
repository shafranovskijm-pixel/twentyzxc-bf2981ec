

# Исправление SEO-проблем + дополнительные ключевые слова

## Все изменения

### 1. Обновить keywords в index.html (строка 9)

Заменить текущие ключевые слова на:
```
веб-разработка, создание сайтов, реклама яндекс директ, таргетированная реклама, 24zxc, конструктор сайтов, шаблоны сайтов, лендинг под ключ, сайт для бизнеса, фис фрдо, лицензия на образовательную деятельность, сайт для образовательной организации
```

### 2. Добавить Helmet в TemplatePreview.tsx

Динамические мета-теги:
- title: "{template.name} -- Превью шаблона | 24ZXC"
- description: "{template.description}"
- canonical: "https://24zxc.ru/templates/{id}/preview"

### 3. Добавить canonical в три страницы

- **Playground.tsx**: `<link rel="canonical" href="https://24zxc.ru/playground" />`
- **Reviews.tsx**: `<link rel="canonical" href="https://24zxc.ru/reviews" />`
- **PlaygroundView.tsx**: `<link rel="canonical" href="https://24zxc.ru/p/{slug}" />`

### 4. NotFound.tsx -- уже содержит description, не требует изменений

---

## Технические детали

| Файл | Изменение |
|---|---|
| `index.html` (строка 9) | Заменить keywords |
| `src/pages/TemplatePreview.tsx` | Добавить Helmet с title/description/canonical |
| `src/pages/Playground.tsx` | Добавить canonical в Helmet |
| `src/pages/Reviews.tsx` | Добавить canonical в Helmet |
| `src/pages/PlaygroundView.tsx` | Добавить canonical в Helmet |

Все правки минимальные -- 1-3 строки в каждом файле. Новых зависимостей не требуется.


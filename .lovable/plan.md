

## План: Настройки баннера (режимы отображения) + файл-инструкция для переноса дизайна

### Часть 1: Настройки пользовательского баннера

В секцию «Свой баннер» (строки 600-616 в Admin.tsx) добавить выбор режима отображения баннера.

**Новый стейт:**
```typescript
const [bannerFit, setBannerFit] = useState<'cover' | 'contain' | 'tile' | 'stretch'>(() => 
  (localStorage.getItem("admin-banner-fit") as any) || "cover"
);
```

**Режимы:**
- **Замостить** (`tile`) — `background-size: auto; background-repeat: repeat`
- **Растянуть** (`stretch`) — `object-fit: fill` / `background-size: 100% 100%`
- **Вписать** (`contain`) — `object-fit: contain; background-color: black`
- **Заполнить** (`cover`) — текущий `object-fit: cover` (по умолчанию)

**UI:** 4 кнопки-переключателя под кнопкой «Загрузить», видны только когда `bannerUrl` загружен. Значение сохраняется в `localStorage("admin-banner-fit")`.

**Применение:** В декоративном баннере (строка 486-488) и в атмосферных фрагментах использовать `bannerFit` для задания стилей пользовательского баннера.

### Часть 2: Файл-инструкция для переноса дизайна

Создать файл `ADMIN_THEME_PROMPT.md` в корне проекта. В него включить:

1. **Промпт для AI** — описание всей системы тем: структура `AdminTheme`, как работают CSS-переменные `--primary`/`--theme-accent`, inline style override
2. **Список компонентов** — `admin-themes.ts` (данные тем), `ThemeAnimations.tsx` (все 7 анимаций: leaves, fade, lights, gradient, glow, particles, sand), Footer с локальным blur
3. **Как кнопки меняют цвет** — объяснение `--primary: activeTheme.accent` через inline style на корневом div
4. **Атмосферные фрагменты** — как баннер проступает в углах с blur/sharp масками
5. **Код для копирования** — ключевые сниппеты из Admin.tsx (style block, atmospheric bleed section)

### Файлы

| Файл | Изменение |
|------|-----------|
| `src/pages/Admin.tsx` | Стейт `bannerFit`, UI переключатели, применение fit к баннеру |
| `ADMIN_THEME_PROMPT.md` | Полный промпт + сниппеты для переноса дизайн-системы в другой проект |


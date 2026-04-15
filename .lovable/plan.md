

## План: Hover-подсветка кнопок в цвет активной темы

### Проблема
Кнопки при hover всегда подсвечиваются золотым, потому что `hover:bg-primary/15` ссылается на CSS-переменную `--primary`, которая захардкожена как золотой (`45 65% 45%`). Тема записывает акцент в `--theme-accent`, но `--primary` не переопределяется.

### Решение
В `Admin.tsx` при активной теме переопределить `--primary` и `--primary-foreground` через inline style, используя значения `accent` / `accentForeground` из темы. Это автоматически заставит все `hover:bg-primary/*`, `hover:text-primary`, `bg-primary`, `text-primary` и т.д. работать в цвете активной темы — без изменения отдельных компонентов.

### Файл

| Файл | Изменение |
|------|-----------|
| `src/pages/Admin.tsx` | Добавить `"--primary": activeTheme.accent` и `"--primary-foreground": activeTheme.accentForeground` в inline style на корневом div |

### Код (суть изменения)
```typescript
style={activeTheme ? {
  "--theme-accent": activeTheme.accent,
  "--theme-accent-foreground": activeTheme.accentForeground,
  "--primary": activeTheme.accent,                    // <-- добавить
  "--primary-foreground": activeTheme.accentForeground, // <-- добавить
  ...
} as React.CSSProperties : undefined}
```

Это одна строка — мгновенно переключает все кнопки, сайдбар, hover-эффекты на палитру текущей темы.


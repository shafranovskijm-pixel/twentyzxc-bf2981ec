

## План: Тёмный премиум дизайн + интерактивные золотые частицы

### 1. Интерактивные золотые частицы (курсор)

**Новый файл: `src/components/decorations/InteractiveParticles.tsx`**:
- Canvas-компонент на весь экран (fixed, pointer-events-none)
- 40-60 золотых точек разного размера (1-4px)
- При движении мыши частицы плавно отталкиваются/притягиваются в радиусе ~150px
- Частицы медленно дрейфуют сами по себе
- Используем requestAnimationFrame, без внешних библиотек
- На мобильных — просто плавающие точки без взаимодействия

**Файл: `src/pages/Index.tsx`**: заменить `FloatingParticles` на `InteractiveParticles`.

### 2. Тёмная премиум цветовая схема

**Файл: `src/index.css`** — полная замена CSS-переменных:
- `--background`: `20 14% 4%` (почти чёрный, чуть тёплый ≈ #0A0908)
- `--foreground`: `40 20% 90%` (светлый кремовый текст)
- `--card`: `20 12% 8%` (тёмно-серый с теплотой)
- `--card-foreground`: `40 20% 90%`
- `--secondary`: `20 10% 12%`
- `--muted`: `20 8% 18%`
- `--muted-foreground`: `30 10% 55%`
- `--border`: `30 10% 15%`
- `--primary`: `42 80% 50%` (яркое золото на тёмном)
- Обновить `--gradient-gold`, `--glow-gold` — более яркие свечения для тёмного фона
- Скроллбар: тёмный трек, золотой thumb
- `::selection`: золотой
- `.luxury-card`: тёмный градиент с золотой окантовкой, свечение
- `.gradient-gold-text`: яркий drop-shadow для тёмного фона
- `.gold-glow-text`: усиленный text-shadow

### 3. Обновить декорации под тёмную тему

**Файл: `src/components/decorations/GradientGlows.tsx`**: усилить opacity свечений (0.06 → 0.12), более насыщенный золотой цвет.

**Файл: `src/components/decorations/GeometricShapes.tsx`**: увеличить opacity элементов (primary/5 → primary/15), ярче линии и точки.

### 4. Адаптировать компоненты

**Файл: `src/components/HeroSection.tsx`**: усилить glows за текстом (primary/8 → primary/15), ярче декоративные элементы.

**Файл: `src/components/Header.tsx`**: `bg-background/90` при скролле — на тёмном это работает, проверить контраст.

**Файл: `src/components/Footer.tsx`**: border-border остаётся, проверить читаемость.

**Файл: `src/components/WebDevSection.tsx`**: dot grid opacity увеличить, усилить gold glows.

**Файл: `src/components/PromotionSection.tsx`**: `bg-secondary/30` на тёмном — проверить, усилить свечение карточек.

**Файл: `src/components/ContactSection.tsx`**: `bg-secondary/30` — будет работать на тёмном.

### Итого файлы:
1. `src/components/decorations/InteractiveParticles.tsx` — новый (Canvas + курсор)
2. `src/index.css` — тёмная палитра
3. `src/pages/Index.tsx` — замена FloatingParticles
4. `src/components/decorations/GradientGlows.tsx` — ярче
5. `src/components/decorations/GeometricShapes.tsx` — ярче
6. `src/components/HeroSection.tsx` — усилить glows
7. `src/components/WebDevSection.tsx` — адаптация
8. `src/components/PromotionSection.tsx` — адаптация
9. `src/components/decorations/index.ts` — экспорт InteractiveParticles


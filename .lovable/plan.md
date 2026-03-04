

## План: Кремовая тёплая тема + замена ворот на fade-in

### 1. Обновить цветовую схему на кремовую тёплую

**Файл: `src/index.css`** — полная замена CSS-переменных:

- `--background`: чёрный (#080808) → тёплый крем (`40 30% 96%` ≈ #F5F0E8)
- `--foreground`: золотистый белый → тёмно-коричневый (`30 10% 15%`)
- `--card`: тёмно-серый → белый/слоновая кость (`40 25% 98%`)
- `--card-foreground`: → тёмный (`30 10% 15%`)
- `--secondary`: → светло-бежевый (`35 20% 92%`)
- `--muted`: → бежево-серый (`35 15% 88%`)
- `--muted-foreground`: → средне-серый (`30 5% 45%`)
- `--border`: → тёплый серый (`35 15% 85%`)
- `--primary` (золото): оставить, но чуть темнее для контраста на светлом (`42 75% 42%`)
- Обновить `--gradient-gold`, `--glow-gold` под светлый фон (менее яркое свечение, более мягкие тени)
- Скроллбар: светлый трек, золотой thumb
- `::selection`: более мягкий золотой

Обновить `.luxury-card`: светлый фон с мягкой тенью вместо тёмного градиента. Обновить `.gradient-gold-text` для контраста на светлом.

### 2. Заменить ворота Синтагмы на fade-in

**Файл: `src/components/WebDevSection.tsx`**:

- Удалить компонент `Spark` и все sparks
- В `SyntagmaCard` убрать анимированные створки (left gate, right gate, center ornament, closed gates text)
- Контент карточки показывать сразу, с плавным hover-эффектом:
  - При наведении — мягкий подъём карточки (translateY, тень)
  - Контент всегда видимый, без opacity: 0
  - Ачивка `syntagma_gates` — срабатывает при первом наведении (без задержки 3.5с)
- Удалить `@keyframes animate-spark` из CSS если есть

### 3. Адаптировать декорации под светлую тему

**Файл: `src/components/decorations/GradientGlows.tsx`** — уменьшить интенсивность свечений, использовать тёплые мягкие тона вместо ярких gold glows.

**Файл: `src/components/decorations/FloatingParticles.tsx`** — изменить `bg-primary/30` на более мягкий для светлого фона.

**Файл: `src/components/decorations/GeometricShapes.tsx`** — уменьшить opacity элементов.

**Файл: `src/components/HeroSection.tsx`** — убрать `bg-background` у фонового div, адаптировать декоративные линии и glow под светлый фон.

### 4. Обновить Header и Footer

Убедиться, что Header и Footer корректно работают на светлом фоне — проверить контрастность текста и border-цвета.

### Итого файлы для изменения:
1. `src/index.css` — цветовая схема
2. `src/components/WebDevSection.tsx` — убрать ворота/искры, fade-in
3. `src/components/decorations/GradientGlows.tsx` — мягче
4. `src/components/decorations/FloatingParticles.tsx` — мягче
5. `src/components/decorations/GeometricShapes.tsx` — мягче
6. `src/components/HeroSection.tsx` — адаптация


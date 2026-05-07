## Что не так сейчас

1. **24ZXC мигает.** В `HeroSection.tsx` поверх основной надписи лежат три слоя одинакового текста: `blur-2xl` подложка, основной `gradient-gold-text gold-glow-text` и сверху `absolute inset-0 gradient-gold-text shimmer`. Верхний слой повторно делает текст прозрачным и пытается прокрасить его движущимся шиммер-градиентом — из-за двух конкурирующих background-clip и большой длительности (`6s`) на iOS/Android получается «дёрганый» переход. Нужен один слитный «золотой блеск», как было раньше.

2. **3D-ключи не крутятся на телефоне.** `ServiceKey3D` оживает только когда `isHovered=true`, а на мобильном события `mouseenter` не срабатывают. Плюс `KeyModel` под `<Float>` почти неподвижен в idle-режиме. Ключи технически грузятся (IntersectionObserver работает), но визуально кажутся статичными.

3. **Декор «пропал» на мобильном.** По прошлой оптимизации:
   - пальмы `hidden md:block` в `HeroSection`,
   - SVG-сетки `hidden md:block` в `GeometricShapes`,
   - частицы Canvas рендерятся, но `count=50` + соединения линий — норм, оставляем.
   
   Пользователь просит вернуть «всю красоту», даже ценой долгой загрузки.

## Что делаю

### A. Hero «24ZXC» — мягкий золотой блеск без мигания (`src/components/HeroSection.tsx` + `src/index.css`)
- Убираю двойной слой `shimmer`-надписи поверх основного текста.
- Оставляю один `<span class="gradient-gold-text gold-glow-text shine-text">24ZXC</span>` с псевдо-элементом `::after`, который рисует движущийся световой блик (linear-gradient white→transparent) поверх букв через `mix-blend-mode: overlay` и `mask: text`. Анимация `shine 4s linear infinite`, без скачков прозрачности — текст не моргает.
- Подложку blur-2xl оставляю как мягкое золотое свечение.

### B. 3D-ключи: вращаются всегда на мобильном (`src/components/WebDevSection.tsx` + `src/components/game/ServiceKey3D.tsx`)
- В `WebDevSection` определяю `isCoarsePointer = matchMedia('(hover: none)').matches` и для таких устройств всегда передаю `isHovered={true}` (либо новое поле `autoAnimate`).
- В `KeyModel` в idle-режиме добавляю лёгкое постоянное вращение по Y (`rotation.y += delta * 0.4`) — ключик красиво крутится и без курсора, как было до оптимизации.
- В `ServiceKey3DLazy` увеличиваю `rootMargin` до `400px`, чтобы на мобильном WebGL стартовал заранее и пользователь видел уже крутящийся ключ.

### C. Возвращаем декор на мобильный
- `HeroSection`: убираю `hidden md:block` у пальм (оставляю `opacity-20` на `<md`, чтобы не мешали тексту).
- `GeometricShapes`: убираю `hidden md:block` у диагональных линий; уменьшаю `opacity` мобильных декораций до 60% от десктопных, но сами элементы рендерятся.
- `InteractiveParticles`: на мобильном уменьшаю `count` до 30 (вместо полного отключения) — сохраняем «звёздочки», но не сажаем FPS.
- Обновляю запись `mem://style/mobile-decoration-logic`: декор виден на мобильном, лишь слегка приглушён.

### D. Плавная загрузка вместо мигающей заставки
- В `index.html` boot-fallback: `transition: opacity .4s` на `#__boot` и `__clearBoot` сначала ставит `opacity:0`, потом удаляет узел через 400 мс. Сейчас узел удаляется мгновенно после `requestAnimationFrame` → виден резкий скачок между «золотым ZXC» бутстрапа и React-Hero. Делаем мягкий кросс-фейд.
- В `main.tsx` соответственно вызываю `__clearBoot` после первого кадра React.

## Технические детали

- Не меняю `.env`, `client.ts`, `types.ts`.
- Проверю, что `gradient-gold-text` сохраняет `-webkit-background-clip: text` (iOS Safari) — fallback уже есть в `index.css`.
- Новый `useFrame` в `KeyModel`: вращение и для `isHovered=false` — амплитуда меньше, но непрерывная.
- Память обновлю: правило «скрывать сложный декор на мобильном» заменяю на «декор виден везде, на мобильном с приглушённой непрозрачностью».

## Файлы

- `src/components/HeroSection.tsx`
- `src/index.css` (новый класс `.shine-text` + keyframes `shine`)
- `src/components/game/ServiceKey3D.tsx`
- `src/components/game/ServiceKey3DLazy.tsx`
- `src/components/WebDevSection.tsx`
- `src/components/decorations/GeometricShapes.tsx`
- `src/components/decorations/InteractiveParticles.tsx`
- `index.html` + `src/main.tsx` (плавное скрытие boot-заставки)
- `mem://style/mobile-decoration-logic` + `mem://index.md` (обновляем правило)

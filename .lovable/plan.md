
## План: Оптимизация загрузки изображений и добавление недостающих

### Анализ текущей ситуации

Изучив кодовую базу, я обнаружил следующие проблемы:

**1. Шаблоны с отсутствующими изображениями (используют placeholder-градиенты):**
- `GoldenPrestigePreview` — изображения сервисов (`service-1.png`, `service-2.png`, `service-3.png`)
- `ExecutiveSuitePreview` — изображения команды (`team-1.png` до `team-4.png`) 
- `TechHorizonPreview` — изображения проектов и команды
- `LuxeBoutiquePreview` — изображения товаров (`product-1.png` до `product-6.png`)
- `ArtisanMarketPreview` — изображения товаров и аватары мастеров
- `MarbleGoldPreview` — изображения портфолио (`portfolio-1.png` до `portfolio-6.png`) и команды (`team-1.png` до `team-4.png`)

**2. Проблемы с загрузкой:**
- Изображения загружаются без `loading="lazy"` в некоторых местах
- Нет предзагрузки критических изображений (hero)
- Отсутствует оптимизация размеров для разных viewport
- Компонент `ImageWithFallback` уже существует, но не везде используется

**3. Существующие локальные изображения:**
```
src/assets/templates/
├── premium-gallery/          # 28+ изображений
│   ├── hero.jpg, hero-pseudo3d.jpg
│   ├── gallery-1.jpg до gallery-6.jpg
│   └── spin/ (24 кадра)
├── crystal-vision-hero.jpg
├── crystal-vision-project-1.jpg  
├── noir-elegance-hero.jpg
└── noir-elegance-project-1.jpg
```

---

### План реализации

#### Этап 1: Улучшение компонента ImageWithFallback

Добавить:
- Поддержку `srcSet` для responsive изображений
- Приоритетную загрузку (`fetchpriority="high"`) для hero-изображений
- `decoding="async"` для неблокирующей декодировки
- Blur-up эффект при загрузке (low-quality placeholder)
- Intersection Observer для отложенной загрузки вне viewport

```typescript
// Новые пропсы для ImageWithFallback
interface ImageWithFallbackProps {
  priority?: boolean;      // Для hero-изображений
  blur?: boolean;          // Blur-up эффект
  sizes?: string;          // Для responsive
}
```

---

#### Этап 2: Генерация недостающих изображений

Использовать AI-генерацию через Edge Function для создания:

| Шаблон | Изображения | Тематика |
|--------|-------------|----------|
| GoldenPrestige | 3 сервисных | VIP-консьерж, премиум-сервис, элитные услуги |
| ExecutiveSuite | 4 команды | Бизнес-портреты руководителей |
| TechHorizon | 3 проекта + 3 команды | Технические проекты, разработчики |
| LuxeBoutique | 6 товаров | Платья, пальто, сумки, украшения |
| ArtisanMarket | 6 товаров + 3 мастера | Керамика, изделия ручной работы |
| MarbleGold | 6 портфолио + 4 команды | Люксовые интерьеры, дизайнеры |

**Всего: ~35 изображений**

---

#### Этап 3: Оптимизация существующих изображений

**3.1. Критические (hero) изображения:**
```typescript
// Предзагрузка в <head> через react-helmet-async
<link rel="preload" as="image" href={heroImage} fetchpriority="high" />
```

**3.2. Галерея Premium Gallery:**
- Использовать ленивую загрузку для изображений вне viewport
- Добавить skeleton при загрузке (уже есть в ImageWithFallback)

**3.3. Карточки товаров/проектов:**
- Использовать `sizes` атрибут для responsive
- Загружать только видимые в viewport

---

#### Этап 4: Рефакторинг шаблонов

Заменить все прямые `<img>` теги на `<ImageWithFallback>`:

```typescript
// Было
<img src={url} className="..." />

// Станет
<ImageWithFallback 
  src={url} 
  alt="Описание"
  priority={isHero}
  aspectRatio="video"
/>
```

---

### Файлы для изменения

1. `src/components/templates/ImageWithFallback.tsx` — расширение функционала
2. `src/components/templates/previews/unique/*.tsx` — 10+ файлов шаблонов
3. `supabase/functions/generate-template-images/index.ts` — Edge Function для генерации
4. Создание новых изображений в storage

---

### Техническая реализация

**Улучшенный ImageWithFallback:**
```typescript
export const ImageWithFallback = ({
  src,
  alt,
  priority = false,
  blur = true,
  sizes = "(max-width: 768px) 100vw, 50vw",
  aspectRatio = "video",
  ...props
}: ImageWithFallbackProps) => {
  return (
    <div className={cn("relative overflow-hidden", aspectRatioClasses[aspectRatio])}>
      {/* Skeleton при загрузке */}
      {isLoading && <Skeleton className="absolute inset-0" />}
      
      {/* Blur placeholder */}
      {blur && isLoading && (
        <div className="absolute inset-0 backdrop-blur-xl bg-muted/50" />
      )}
      
      <img
        src={src}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding={priority ? "sync" : "async"}
        fetchpriority={priority ? "high" : "auto"}
        sizes={sizes}
        onLoad={() => setIsLoading(false)}
        onError={() => setHasError(true)}
        className={cn("w-full h-full object-cover", isLoading && "opacity-0")}
      />
    </div>
  );
};
```

---

### Ожидаемый результат

1. **Ускорение загрузки** — hero-изображения загружаются приоритетно
2. **Экономия трафика** — ленивая загрузка для изображений вне viewport  
3. **Улучшенный UX** — плавный blur-up эффект вместо резкого появления
4. **Консистентность** — все шаблоны имеют реальные изображения вместо градиентных заглушек
5. **Responsive** — оптимальные размеры для разных устройств

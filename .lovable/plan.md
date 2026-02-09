

## План: Настоящий 360° Product Spin Viewer

### Проблема
Сейчас изображения отображаются как **отдельные плоскости** вокруг центра в 3D пространстве. Это не выглядит как единый товар — пользователь видит несколько "карточек" вокруг пустоты.

### Решение
Создать классический **360° spin viewer** — когда одно изображение плавно сменяет другое при вращении, создавая иллюзию кругового обзора товара.

### Как это работает

```text
Текущий вариант (неправильно):          Нужный вариант (правильно):
                                        
    [img2]                                  ┌─────────────┐
       \                                    │             │
        \                                   │   [img N]   │  ← одно изображение
   [img1]─●─[img3]  ← 3D карусель          │             │     в центре экрана
        /                                   └─────────────┘
       /                                           │
    [img4]                                  при вращении → 
                                            сменяется на [img N+1]
```

### Подход: Fast Image Sequence

Вместо Three.js использовать **последовательную смену изображений** с плавными переходами:

1. Все изображения (12-24 кадра для плавности) загружены заранее
2. При перетаскивании мышью — расчет какой кадр показать
3. Интерполяция между соседними кадрами для плавности
4. Автовращение с requestAnimationFrame

### Технические шаги

**Шаг 1: Создать компонент `Product360Spin`**
- Canvas-based рендеринг для максимальной плавности
- Предзагрузка всех изображений в память
- Интерполяция между кадрами

**Шаг 2: Сгенерировать достаточно изображений**
- Для плавного вращения нужно **24-36 кадров** (по 10-15° на кадр)
- Начнём с одного товара (hero или первый продукт)

**Шаг 3: Интегрировать в PremiumGalleryPreview**
- Заменить текущий `Product3DViewer` на новый `Product360Spin`
- Добавить инерцию при отпускании мыши
- Добавить автовращение

### Преимущества нового подхода
- Выглядит как настоящий 3D объект
- Работает быстрее (нет Three.js overhead)
- Мобильно-дружелюбный
- Стандарт индустрии для e-commerce (используется Apple, Nike, IKEA)

---

### Техническая реализация

**Новый компонент: `src/components/templates/previews/shared/Product360Spin.tsx`**

```typescript
// Ключевая логика:
function Product360Spin({ images, autoPlay = true }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [loadedImages, setLoadedImages] = useState<HTMLImageElement[]>([]);
  
  // Предзагрузка всех изображений
  useEffect(() => {
    Promise.all(
      images.map(src => {
        return new Promise<HTMLImageElement>((resolve) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.src = src;
        });
      })
    ).then(setLoadedImages);
  }, [images]);
  
  // Drag handling
  const handleDrag = (deltaX: number) => {
    // Каждые N пикселей = следующий кадр
    const sensitivity = 3; // пикселей на кадр
    const frameDelta = Math.round(deltaX / sensitivity);
    const newFrame = (currentFrame + frameDelta + images.length) % images.length;
    setCurrentFrame(newFrame);
  };
  
  // Рендер на canvas
  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx && loadedImages[currentFrame]) {
      ctx.drawImage(loadedImages[currentFrame], 0, 0);
    }
  }, [currentFrame, loadedImages]);
}
```

**Генерация изображений**
Для первого товара (hero) нужно сгенерировать ~24 изображения с шагом 15°:
- `hero-spin-00.jpg` (0°)
- `hero-spin-01.jpg` (15°)
- ...
- `hero-spin-23.jpg` (345°)

### Альтернатива: WebGL Sprite Sheet
Если производительность критична, можно объединить все кадры в один спрайт и менять UV-координаты в шейдере — но это сложнее в реализации.


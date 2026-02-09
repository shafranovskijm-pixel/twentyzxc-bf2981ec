export interface PlaygroundBlock {
  id: string;
  type: 'heading' | 'text' | 'button' | 'image' | 'divider' | 'card' | 'spacer';
  content: string;
  animation?: string;
  hoverEffect?: string;
  styles: BlockStyles;
}

export interface BlockStyles {
  backgroundColor?: string;
  textColor?: string;
  padding?: string;
  fontSize?: string;
  borderRadius?: string;
  textAlign?: 'left' | 'center' | 'right';
}

export interface PlaygroundSettings {
  backgroundColor: string;
  backgroundPattern?: string;
}

export interface AnimationEffect {
  id: string;
  name: string;
  description: string;
  category: 'fade' | 'scale' | 'slide' | 'rotate' | 'special';
  cssClass?: string;
  framerProps?: object;
}

export interface HoverEffect {
  id: string;
  name: string;
  description: string;
  cssClass: string;
}

export const ANIMATION_EFFECTS: AnimationEffect[] = [
  // Fade
  { id: 'fade-in', name: 'Fade In', description: 'Плавное появление', category: 'fade', framerProps: { initial: { opacity: 0 }, animate: { opacity: 1 } } },
  { id: 'fade-in-up', name: 'Fade In Up', description: 'Появление снизу', category: 'fade', framerProps: { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } } },
  { id: 'fade-in-down', name: 'Fade In Down', description: 'Появление сверху', category: 'fade', framerProps: { initial: { opacity: 0, y: -20 }, animate: { opacity: 1, y: 0 } } },
  { id: 'fade-in-left', name: 'Fade In Left', description: 'Появление слева', category: 'fade', framerProps: { initial: { opacity: 0, x: -20 }, animate: { opacity: 1, x: 0 } } },
  { id: 'fade-in-right', name: 'Fade In Right', description: 'Появление справа', category: 'fade', framerProps: { initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 } } },
  
  // Scale
  { id: 'scale-in', name: 'Scale In', description: 'Появление с увеличением', category: 'scale', framerProps: { initial: { opacity: 0, scale: 0.8 }, animate: { opacity: 1, scale: 1 } } },
  { id: 'scale-bounce', name: 'Scale Bounce', description: 'Прыгающее появление', category: 'scale', framerProps: { initial: { opacity: 0, scale: 0 }, animate: { opacity: 1, scale: 1 }, transition: { type: 'spring', stiffness: 200 } } },
  { id: 'pulse', name: 'Pulse', description: 'Пульсация', category: 'scale', framerProps: { animate: { scale: [1, 1.05, 1] }, transition: { duration: 2, repeat: Infinity } } },
  
  // Slide
  { id: 'slide-up', name: 'Slide Up', description: 'Выезд снизу', category: 'slide', framerProps: { initial: { y: 50 }, animate: { y: 0 } } },
  { id: 'slide-down', name: 'Slide Down', description: 'Выезд сверху', category: 'slide', framerProps: { initial: { y: -50 }, animate: { y: 0 } } },
  { id: 'slide-left', name: 'Slide Left', description: 'Выезд слева', category: 'slide', framerProps: { initial: { x: -50 }, animate: { x: 0 } } },
  { id: 'slide-right', name: 'Slide Right', description: 'Выезд справа', category: 'slide', framerProps: { initial: { x: 50 }, animate: { x: 0 } } },
  
  // Rotate
  { id: 'rotate-in', name: 'Rotate In', description: 'Появление с вращением', category: 'rotate', framerProps: { initial: { opacity: 0, rotate: -180 }, animate: { opacity: 1, rotate: 0 } } },
  { id: 'spin-slow', name: 'Spin Slow', description: 'Медленное вращение', category: 'rotate', framerProps: { animate: { rotate: 360 }, transition: { duration: 8, repeat: Infinity, ease: 'linear' } } },
  
  // Special
  { id: 'blur-in', name: 'Blur In', description: 'Появление из размытия', category: 'special', framerProps: { initial: { opacity: 0, filter: 'blur(10px)' }, animate: { opacity: 1, filter: 'blur(0px)' } } },
  { id: 'flip-x', name: 'Flip X', description: 'Переворот по X', category: 'special', framerProps: { initial: { rotateX: 90, opacity: 0 }, animate: { rotateX: 0, opacity: 1 } } },
  { id: 'flip-y', name: 'Flip Y', description: 'Переворот по Y', category: 'special', framerProps: { initial: { rotateY: 90, opacity: 0 }, animate: { rotateY: 0, opacity: 1 } } },
];

export const HOVER_EFFECTS: HoverEffect[] = [
  { id: 'hover-scale', name: 'Scale', description: 'Увеличение при наведении', cssClass: 'hover:scale-105 transition-transform duration-300' },
  { id: 'hover-lift', name: 'Lift', description: 'Поднятие с тенью', cssClass: 'hover:-translate-y-1 hover:shadow-xl transition-all duration-300' },
  { id: 'hover-glow', name: 'Glow', description: 'Золотое свечение', cssClass: 'hover:shadow-[0_0_20px_hsl(45_80%_55%/0.3)] transition-shadow duration-300' },
  { id: 'hover-brightness', name: 'Brightness', description: 'Осветление', cssClass: 'hover:brightness-110 transition-all duration-300' },
  { id: 'hover-rotate', name: 'Rotate', description: 'Небольшой поворот', cssClass: 'hover:rotate-1 transition-transform duration-300' },
];

export const BLOCK_TYPES = [
  { type: 'heading' as const, name: 'Заголовок', icon: 'Type', defaultContent: 'Заголовок' },
  { type: 'text' as const, name: 'Текст', icon: 'AlignLeft', defaultContent: 'Текстовый блок с содержимым' },
  { type: 'button' as const, name: 'Кнопка', icon: 'MousePointer', defaultContent: 'Кнопка' },
  { type: 'image' as const, name: 'Изображение', icon: 'Image', defaultContent: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=300&fit=crop' },
  { type: 'divider' as const, name: 'Разделитель', icon: 'Minus', defaultContent: '' },
  { type: 'card' as const, name: 'Карточка', icon: 'Square', defaultContent: 'Содержимое карточки' },
  { type: 'spacer' as const, name: 'Отступ', icon: 'ArrowUpDown', defaultContent: '' },
];

export const COLOR_PRESETS = [
  { name: 'Прозрачный', value: 'transparent' },
  { name: 'Белый', value: '#ffffff' },
  { name: 'Чёрный', value: '#0a0a0a' },
  { name: 'Золотой', value: '#d4a855' },
  { name: 'Тёмный', value: '#1a1a1a' },
  { name: 'Серый', value: '#333333' },
  { name: 'Синий', value: '#3b82f6' },
  { name: 'Зелёный', value: '#22c55e' },
  { name: 'Красный', value: '#ef4444' },
  { name: 'Фиолетовый', value: '#a855f7' },
];

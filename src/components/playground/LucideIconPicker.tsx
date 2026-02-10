import { useState, useMemo } from "react";
import {
  Rocket, Lock, Shield, Globe, Star, Heart, Zap, Target,
  Users, Mail, Phone, MapPin, Clock, Calendar, Search,
  Home, Building2, Briefcase, Code2, Camera, Image,
  ShoppingCart, CreditCard, BarChart3, TrendingUp, Award,
  CheckCircle, AlertCircle, Info, HelpCircle, Settings,
  Send, MessageCircle, Share2, Link, Download, Upload,
  Play, Pause, Music, Headphones, Mic, Video,
  Sun, Moon, Cloud, Droplets, Wind, Flame,
  Cpu, Database, Server, Wifi, Monitor, Smartphone,
  Palette, Pen, Layers, Layout, Grid3x3, Box,
  GraduationCap, BookOpen, FileText, Newspaper,
  Dumbbell, UtensilsCrossed, Plane, Car, Bike,
  type LucideIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// Curated icon set with Russian search labels
export const LUCIDE_ICON_MAP: Record<string, { icon: LucideIcon; label: string }> = {
  rocket: { icon: Rocket, label: "Ракета" },
  lock: { icon: Lock, label: "Замок" },
  shield: { icon: Shield, label: "Щит" },
  globe: { icon: Globe, label: "Глобус" },
  star: { icon: Star, label: "Звезда" },
  heart: { icon: Heart, label: "Сердце" },
  zap: { icon: Zap, label: "Молния" },
  target: { icon: Target, label: "Цель" },
  users: { icon: Users, label: "Люди" },
  mail: { icon: Mail, label: "Почта" },
  phone: { icon: Phone, label: "Телефон" },
  "map-pin": { icon: MapPin, label: "Метка" },
  clock: { icon: Clock, label: "Часы" },
  calendar: { icon: Calendar, label: "Календарь" },
  search: { icon: Search, label: "Поиск" },
  home: { icon: Home, label: "Дом" },
  building: { icon: Building2, label: "Здание" },
  briefcase: { icon: Briefcase, label: "Портфель" },
  code: { icon: Code2, label: "Код" },
  camera: { icon: Camera, label: "Камера" },
  image: { icon: Image, label: "Фото" },
  cart: { icon: ShoppingCart, label: "Корзина" },
  "credit-card": { icon: CreditCard, label: "Карта" },
  chart: { icon: BarChart3, label: "График" },
  trending: { icon: TrendingUp, label: "Рост" },
  award: { icon: Award, label: "Награда" },
  check: { icon: CheckCircle, label: "Галочка" },
  alert: { icon: AlertCircle, label: "Внимание" },
  info: { icon: Info, label: "Инфо" },
  help: { icon: HelpCircle, label: "Помощь" },
  settings: { icon: Settings, label: "Настройки" },
  send: { icon: Send, label: "Отправить" },
  message: { icon: MessageCircle, label: "Сообщение" },
  share: { icon: Share2, label: "Поделиться" },
  link: { icon: Link, label: "Ссылка" },
  download: { icon: Download, label: "Скачать" },
  upload: { icon: Upload, label: "Загрузить" },
  play: { icon: Play, label: "Воспроизвести" },
  pause: { icon: Pause, label: "Пауза" },
  music: { icon: Music, label: "Музыка" },
  headphones: { icon: Headphones, label: "Наушники" },
  mic: { icon: Mic, label: "Микрофон" },
  video: { icon: Video, label: "Видео" },
  sun: { icon: Sun, label: "Солнце" },
  moon: { icon: Moon, label: "Луна" },
  cloud: { icon: Cloud, label: "Облако" },
  droplets: { icon: Droplets, label: "Капли" },
  wind: { icon: Wind, label: "Ветер" },
  flame: { icon: Flame, label: "Огонь" },
  cpu: { icon: Cpu, label: "Процессор" },
  database: { icon: Database, label: "База данных" },
  server: { icon: Server, label: "Сервер" },
  wifi: { icon: Wifi, label: "Wi-Fi" },
  monitor: { icon: Monitor, label: "Монитор" },
  smartphone: { icon: Smartphone, label: "Телефон" },
  palette: { icon: Palette, label: "Палитра" },
  pen: { icon: Pen, label: "Перо" },
  layers: { icon: Layers, label: "Слои" },
  layout: { icon: Layout, label: "Макет" },
  grid: { icon: Grid3x3, label: "Сетка" },
  box: { icon: Box, label: "Коробка" },
  graduation: { icon: GraduationCap, label: "Образование" },
  book: { icon: BookOpen, label: "Книга" },
  file: { icon: FileText, label: "Файл" },
  newspaper: { icon: Newspaper, label: "Новости" },
  dumbbell: { icon: Dumbbell, label: "Гантели" },
  utensils: { icon: UtensilsCrossed, label: "Еда" },
  plane: { icon: Plane, label: "Самолёт" },
  car: { icon: Car, label: "Авто" },
  bike: { icon: Bike, label: "Велосипед" },
};

// Render a Lucide icon by name, returns null if not found
export const LucideIconByName = ({ name, size = 24, className }: { name: string; size?: number; className?: string }) => {
  const entry = LUCIDE_ICON_MAP[name];
  if (!entry) return null;
  const IconComp = entry.icon;
  return <IconComp size={size} className={className} />;
};

// Check if a string is a lucide icon reference
export const isLucideIcon = (str: string): boolean => str.startsWith('lucide:');
export const getLucideIconName = (str: string): string => str.replace('lucide:', '');

// Get SVG path data for HTML export
export const getLucideIconSVG = (name: string, size = 24, color = 'currentColor'): string => {
  // We'll render a simple placeholder SVG for export since we can't easily serialize React components to HTML
  // Using a circle+text fallback approach for HTML export
  const entry = LUCIDE_ICON_MAP[name];
  if (!entry) return `<span style="font-size: ${size}px;">●</span>`;
  
  // Return an SVG placeholder with the icon initial
  const initial = entry.label.charAt(0).toUpperCase();
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" stroke-opacity="0.3"/><text x="12" y="16" text-anchor="middle" fill="${color}" stroke="none" font-size="12" font-family="sans-serif">${initial}</text></svg>`;
};

interface LucideIconPickerProps {
  value?: string; // current lucide icon name or empty
  onChange: (iconName: string) => void;
}

export const LucideIconPicker = ({ value, onChange }: LucideIconPickerProps) => {
  const [search, setSearch] = useState("");
  
  const filteredIcons = useMemo(() => {
    const q = search.toLowerCase();
    return Object.entries(LUCIDE_ICON_MAP).filter(([key, { label }]) => 
      !q || key.includes(q) || label.toLowerCase().includes(q)
    );
  }, [search]);

  return (
    <div className="space-y-2">
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Поиск иконки..."
        className="bg-secondary/50 border-border h-8 text-xs"
      />
      <div className="grid grid-cols-8 gap-1 max-h-[160px] overflow-y-auto">
        {filteredIcons.map(([key, { icon: Icon, label }]) => (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={cn(
              "p-1.5 rounded border transition-all hover:bg-secondary/60",
              value === key 
                ? "border-primary bg-primary/10 text-primary" 
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
            title={label}
          >
            <Icon size={16} />
          </button>
        ))}
      </div>
      {value && (
        <button
          onClick={() => onChange('')}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          ✕ Убрать иконку
        </button>
      )}
    </div>
  );
};

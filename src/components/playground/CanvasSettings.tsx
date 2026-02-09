import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlaygroundSettings, COLOR_PRESETS } from "@/data/playground-effects";
import { cn } from "@/lib/utils";

const FONT_OPTIONS = [
  { value: 'default', label: 'По умолчанию' },
  { value: "'Playfair Display', serif", label: 'Playfair Display' },
  { value: "'Inter', sans-serif", label: 'Inter' },
  { value: "'Montserrat', sans-serif", label: 'Montserrat' },
  { value: "'Roboto', sans-serif", label: 'Roboto' },
  { value: "'Open Sans', sans-serif", label: 'Open Sans' },
  { value: "'Raleway', sans-serif", label: 'Raleway' },
  { value: "'Oswald', sans-serif", label: 'Oswald' },
  { value: "'Merriweather', serif", label: 'Merriweather' },
  { value: "'Lora', serif", label: 'Lora' },
  { value: "'Nunito', sans-serif", label: 'Nunito' },
  { value: "'PT Sans', sans-serif", label: 'PT Sans' },
  { value: "'Rubik', sans-serif", label: 'Rubik' },
  { value: "'Comfortaa', cursive", label: 'Comfortaa' },
  { value: "'Caveat', cursive", label: 'Caveat' },
  { value: "'Pacifico', cursive", label: 'Pacifico' },
  { value: "'Bebas Neue', sans-serif", label: 'Bebas Neue' },
  { value: "'Jost', sans-serif", label: 'Jost' },
];

const GRADIENT_PRESETS = [
  { name: 'Золотой', value: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a0a 50%, #2a1f0a 100%)' },
  { name: 'Ночной', value: 'linear-gradient(135deg, #0a0a1a 0%, #1a0a2a 50%, #0a1a2a 100%)' },
  { name: 'Неон', value: 'linear-gradient(135deg, #0a0a0a 0%, #1a0a1a 50%, #0a1a1a 100%)' },
  { name: 'Закат', value: 'linear-gradient(135deg, #1a0a0a 0%, #2a1a0a 50%, #1a0a1a 100%)' },
  { name: 'Океан', value: 'linear-gradient(135deg, #0a1a2a 0%, #0a2a2a 50%, #0a1a1a 100%)' },
  { name: 'Лес', value: 'linear-gradient(135deg, #0a1a0a 0%, #0a2a1a 50%, #1a2a0a 100%)' },
];

const PATTERN_OPTIONS = [
  { id: 'none', name: 'Нет' },
  { id: 'dots', name: 'Точки' },
  { id: 'grid', name: 'Сетка' },
  { id: 'diagonal', name: 'Диагональ' },
  { id: 'cross', name: 'Крестики' },
];

interface CanvasSettingsProps {
  settings: PlaygroundSettings;
  onSettingsChange: (settings: PlaygroundSettings) => void;
}

export const CanvasSettings = ({ settings, onSettingsChange }: CanvasSettingsProps) => {
  const isGradient = settings.backgroundColor.startsWith('linear-gradient');

  return (
    <div className="space-y-4 p-4 rounded-lg border border-border bg-secondary/20">
      <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
        <Settings className="w-4 h-4" />
        Настройки холста
      </h3>

      {/* Quick Color Themes */}
      <div className="space-y-2">
        <Label className="text-xs">Быстрая тема</Label>
        <div className="grid grid-cols-1 gap-1.5">
          {[
            { name: 'Тёмный минимализм', bg: '#0a0a0a', pattern: 'dots' },
            { name: 'Ночное небо', bg: '#0f172a', pattern: 'cross' },
            { name: 'Тёплый уголь', bg: '#1c1917', pattern: 'grid' },
            { name: 'Глубокий космос', bg: '#020617', pattern: 'diagonal' },
            { name: 'Золото-чёрный', bg: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a0a 50%, #2a1f0a 100%)', pattern: 'dots' },
          ].map((theme) => (
            <button
              key={theme.name}
              onClick={() => onSettingsChange({ ...settings, backgroundColor: theme.bg, backgroundPattern: theme.pattern })}
              className={cn(
                "flex items-center gap-2 px-2.5 py-1.5 rounded border text-xs text-left hover:border-primary/50 transition-colors",
                settings.backgroundColor === theme.bg && (settings.backgroundPattern || 'none') === theme.pattern
                  ? "border-primary bg-primary/10"
                  : "border-border"
              )}
            >
              <span
                className="w-5 h-5 rounded shrink-0 border border-border/50"
                style={{ background: theme.bg }}
              />
              {theme.name}
            </button>
          ))}
        </div>
      </div>

      {/* Solid colors */}
      <div className="space-y-2">
        <Label className="text-xs">Цвет фона</Label>
        <div className="flex gap-2 flex-wrap">
          {COLOR_PRESETS.map((color) => (
            <button
              key={color.value}
              onClick={() => onSettingsChange({ ...settings, backgroundColor: color.value })}
              className={cn(
                "w-7 h-7 rounded border hover:scale-110 transition-transform",
                !isGradient && settings.backgroundColor === color.value
                  ? "border-primary ring-1 ring-primary"
                  : "border-border"
              )}
              style={{ backgroundColor: color.value === 'transparent' ? '#000' : color.value }}
              title={color.name}
            >
              {color.value === 'transparent' && (
                <span className="text-xs text-muted-foreground">∅</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Custom color */}
      <div className="space-y-2">
        <Label className="text-xs">Свой цвет</Label>
        <div className="flex gap-2">
          <input
            type="color"
            value={isGradient ? '#0a0a0a' : (settings.backgroundColor === 'transparent' ? '#000000' : settings.backgroundColor)}
            onChange={(e) => onSettingsChange({ ...settings, backgroundColor: e.target.value })}
            className="w-8 h-8 rounded border border-border cursor-pointer bg-transparent"
          />
          <Input
            value={isGradient ? '' : settings.backgroundColor}
            onChange={(e) => onSettingsChange({ ...settings, backgroundColor: e.target.value })}
            placeholder="#0a0a0a"
            className="bg-secondary/50 border-border text-xs h-8"
          />
        </div>
      </div>

      {/* Gradients */}
      <div className="space-y-2">
        <Label className="text-xs">Градиенты</Label>
        <div className="grid grid-cols-3 gap-2">
          {GRADIENT_PRESETS.map((gradient) => (
            <button
              key={gradient.name}
              onClick={() => onSettingsChange({ ...settings, backgroundColor: gradient.value })}
              className={cn(
                "h-8 rounded border hover:scale-105 transition-transform",
                settings.backgroundColor === gradient.value
                  ? "border-primary ring-1 ring-primary"
                  : "border-border"
              )}
              style={{ background: gradient.value }}
              title={gradient.name}
            />
          ))}
        </div>
      </div>

      {/* Patterns */}
      <div className="space-y-2">
        <Label className="text-xs">Паттерн</Label>
        <div className="flex gap-1.5 flex-wrap">
          {PATTERN_OPTIONS.map((pattern) => (
            <Button
              key={pattern.id}
              size="sm"
              variant={(settings.backgroundPattern || 'none') === pattern.id ? 'default' : 'outline'}
              onClick={() => onSettingsChange({ ...settings, backgroundPattern: pattern.id })}
              className="text-xs h-7 px-2.5"
            >
              {pattern.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Global Font */}
      <div className="space-y-2">
        <Label className="text-xs">Глобальный шрифт</Label>
        <Select
          value={settings.globalFontFamily || 'default'}
          onValueChange={(value) => onSettingsChange({ ...settings, globalFontFamily: value === 'default' ? undefined : value })}
        >
          <SelectTrigger className="bg-secondary/50 border-border text-xs h-8">
            <SelectValue placeholder="По умолчанию" />
          </SelectTrigger>
          <SelectContent>
            {FONT_OPTIONS.map((font) => (
              <SelectItem key={font.value} value={font.value} style={{ fontFamily: font.value !== 'default' ? font.value : undefined }}>
                {font.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-[10px] text-muted-foreground">Применяется ко всем блокам без индивидуального шрифта</p>
      </div>
    </div>
  );
};

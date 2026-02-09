import { Type } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlaygroundSettings } from "@/data/playground-effects";

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

interface FontSettingsProps {
  settings: PlaygroundSettings;
  onSettingsChange: (settings: PlaygroundSettings) => void;
}

export const FontSettings = ({ settings, onSettingsChange }: FontSettingsProps) => {
  return (
    <div className="space-y-3 p-4 rounded-lg border border-border bg-secondary/20">
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
  );
};

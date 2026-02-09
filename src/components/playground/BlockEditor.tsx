import { useState, useEffect } from "react";
import { Trash2, Copy, ChevronUp, ChevronDown, AlignLeft, AlignCenter, AlignRight, Link, Clipboard, ClipboardPaste, Plus, X } from "lucide-react";
import { PlaygroundBlock, ANIMATION_EFFECTS, HOVER_EFFECTS, COLOR_PRESETS, BlockStyles } from "@/data/playground-effects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const FONT_SIZE_PRESETS = [
  { label: 'XS', value: '12px' },
  { label: 'S', value: '14px' },
  { label: 'M', value: '16px' },
  { label: 'L', value: '20px' },
  { label: 'XL', value: '28px' },
  { label: '2XL', value: '36px' },
  { label: '3XL', value: '48px' },
  { label: '4XL', value: '64px' },
];

interface BlockEditorProps {
  block: PlaygroundBlock;
  onUpdate: (updates: Partial<PlaygroundBlock>) => void;
  onUpdateStyles: (styles: Partial<PlaygroundBlock['styles']>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMove: (direction: 'up' | 'down') => void;
  copiedStyles: BlockStyles | null;
  onCopyStyles: () => void;
  onPasteStyles: () => void;
}

export const BlockEditor = ({
  block,
  onUpdate,
  onUpdateStyles,
  onDelete,
  onDuplicate,
  onMove,
  copiedStyles,
  onCopyStyles,
  onPasteStyles
}: BlockEditorProps) => {
  const [customColors, setCustomColors] = useState<string[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('playground-custom-colors');
      if (saved) setCustomColors(JSON.parse(saved));
    } catch {}
  }, []);

  const addCustomColor = (color: string) => {
    if (!color || customColors.includes(color)) return;
    const updated = [...customColors, color];
    setCustomColors(updated);
    localStorage.setItem('playground-custom-colors', JSON.stringify(updated));
  };

  const removeCustomColor = (color: string) => {
    const updated = customColors.filter(c => c !== color);
    setCustomColors(updated);
    localStorage.setItem('playground-custom-colors', JSON.stringify(updated));
  };
  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        <Button variant="outline" size="icon" onClick={() => onMove('up')}>
          <ChevronUp className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={() => onMove('down')}>
          <ChevronDown className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={onDuplicate}>
          <Copy className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={onCopyStyles} title="Копировать стиль">
          <Clipboard className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={onPasteStyles} disabled={!copiedStyles} title="Вставить стиль">
          <ClipboardPaste className="w-4 h-4" />
        </Button>
        <Button variant="destructive" size="icon" onClick={onDelete}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      {block.type !== 'divider' && block.type !== 'spacer' && block.type !== 'form' && (
        <div className="space-y-2">
          <Label>
            {block.type === 'list' ? 'Пункты (по одному на строку)' :
             block.type === 'quote' ? 'Цитата | Автор' :
             block.type === 'counter' ? 'Число | Подпись' :
             block.type === 'video' ? 'Ссылка для embed (YouTube/Vimeo)' :
             block.type === 'navbar' ? 'Пункты меню: Текст|#якорь или URL' :
             block.type === 'footer' ? 'Копирайт | Email | Телефон' :
             'Содержимое'}
          </Label>
          {block.type === 'text' || block.type === 'card' || block.type === 'list' || block.type === 'navbar' ? (
            <Textarea
              value={block.content}
              onChange={(e) => onUpdate({ content: e.target.value })}
              className="bg-secondary/50 border-border"
              rows={block.type === 'list' || block.type === 'navbar' ? 5 : 3}
              placeholder={block.type === 'navbar' ? 'Главная|#hero\nО нас|#about\nУслуги|https://example.com' : ''}
            />
          ) : (
            <Input
              value={block.content}
              onChange={(e) => onUpdate({ content: e.target.value })}
              className="bg-secondary/50 border-border"
              placeholder={block.type === 'video' ? 'https://www.youtube.com/embed/...' : block.type === 'footer' ? '© 2026 Компания|email@test.com|+7...' : ''}
            />
          )}
          {block.type === 'navbar' && (
            <p className="text-xs text-muted-foreground">
              Формат: <code className="bg-secondary px-1 rounded">Текст|#якорь</code> для прокрутки к блоку или <code className="bg-secondary px-1 rounded">Текст|https://...</code> для внешней ссылки. Без <code className="bg-secondary px-1 rounded">|</code> — просто текст.
            </p>
          )}
        </div>
      )}

      {/* Form Settings */}
      {block.type === 'form' && (() => {
        const parts = block.content.split('|');
        const [title = 'Оставьте заявку', namePh = 'Имя', contactPh = 'Телефон или Email', messagePh = 'Сообщение', btnText = 'Отправить'] = parts;
        const showMessage = parts.length < 6 || parts[5] !== 'hide-message';
        const updateFormContent = (index: number, value: string) => {
          const p = [...parts];
          while (p.length < 6) p.push('');
          p[index] = value;
          onUpdate({ content: p.join('|') });
        };
        const toggleMessage = (show: boolean) => {
          const p = [...parts];
          while (p.length < 6) p.push('');
          p[5] = show ? '' : 'hide-message';
          onUpdate({ content: p.join('|') });
        };
        return (
          <div className="space-y-3">
            <Label>Настройки формы</Label>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Заголовок формы</Label>
              <Input value={title} onChange={(e) => updateFormContent(0, e.target.value)} className="bg-secondary/50 border-border" placeholder="Оставьте заявку" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Плейсхолдер «Имя»</Label>
              <Input value={namePh} onChange={(e) => updateFormContent(1, e.target.value)} className="bg-secondary/50 border-border" placeholder="Имя" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Плейсхолдер «Контакт»</Label>
              <Input value={contactPh} onChange={(e) => updateFormContent(2, e.target.value)} className="bg-secondary/50 border-border" placeholder="Телефон или Email" />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Поле «Сообщение»</Label>
              <Switch checked={showMessage} onCheckedChange={toggleMessage} />
            </div>
            {showMessage && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Плейсхолдер «Сообщение»</Label>
                <Input value={messagePh} onChange={(e) => updateFormContent(3, e.target.value)} className="bg-secondary/50 border-border" placeholder="Сообщение" />
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Текст кнопки</Label>
              <Input value={btnText} onChange={(e) => updateFormContent(4, e.target.value)} className="bg-secondary/50 border-border" placeholder="Отправить" />
            </div>
          </div>
        );
      })()}

      {/* Anchor ID */}
      {block.type !== 'navbar' && (
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5">
            <span className="text-xs">⚓</span>
            ID якоря
          </Label>
          <Input
            value={block.anchorId || ''}
            onChange={(e) => onUpdate({ anchorId: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') || undefined })}
            className="bg-secondary/50 border-border"
            placeholder="например: about, services"
          />
          <p className="text-xs text-muted-foreground">
            Используйте в навигации как <code className="bg-secondary px-1 rounded">#якорь</code>
          </p>
        </div>
      )}

      {/* Button Style */}
      {block.type === 'button' && (
        <div className="space-y-2">
          <Label>Стиль кнопки</Label>
          <Select
            value={block.buttonStyle || 'filled'}
            onValueChange={(value) => onUpdate({ buttonStyle: value as 'filled' | 'outline' | 'gradient' })}
          >
            <SelectTrigger className="bg-secondary/50 border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="filled">Заполненная</SelectItem>
              <SelectItem value="outline">Контурная</SelectItem>
              <SelectItem value="gradient">Градиентная</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Gradient Text (for headings) */}
      {block.type === 'heading' && (
        <div className="space-y-2">
          <Label>Градиентный текст</Label>
          <Select
            value={block.styles.gradientText || 'none'}
            onValueChange={(value) => onUpdateStyles({ gradientText: value === 'none' ? undefined : value })}
          >
            <SelectTrigger className="bg-secondary/50 border-border">
              <SelectValue placeholder="Без градиента" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Без градиента</SelectItem>
              <SelectItem value="linear-gradient(135deg, #d4a855, #f5d799)">Золотой</SelectItem>
              <SelectItem value="linear-gradient(135deg, #3b82f6, #8b5cf6)">Синий-фиолетовый</SelectItem>
              <SelectItem value="linear-gradient(135deg, #ec4899, #f97316)">Розовый-оранжевый</SelectItem>
              <SelectItem value="linear-gradient(135deg, #22c55e, #3b82f6)">Зелёный-синий</SelectItem>
              <SelectItem value="linear-gradient(135deg, #f43f5e, #a855f7)">Красный-фиолетовый</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Link */}
      <div className="space-y-2">
        <Label className="flex items-center gap-1.5">
          <Link className="w-3.5 h-3.5" />
          Ссылка
        </Label>
        {block.type === 'button' && (
          <div className="flex gap-1.5 flex-wrap">
            {[
              { label: 'Telegram', prefix: 'https://t.me/', placeholder: 'username' },
              { label: 'WhatsApp', prefix: 'https://wa.me/', placeholder: '79001234567' },
              { label: 'Звонок', prefix: 'tel:', placeholder: '+79001234567' },
              { label: 'Email', prefix: 'mailto:', placeholder: 'you@mail.com' },
            ].map((preset) => {
              const isActive = block.link?.startsWith(preset.prefix);
              return (
                <Button
                  key={preset.prefix}
                  size="sm"
                  variant={isActive ? 'default' : 'outline'}
                  className="text-xs h-7 px-2.5"
                  onClick={() => {
                    if (isActive) return;
                    onUpdate({ link: preset.prefix });
                  }}
                >
                  {preset.label}
                </Button>
              );
            })}
          </div>
        )}
        <Input
          value={block.link || ''}
          onChange={(e) => onUpdate({ link: e.target.value || undefined })}
          className="bg-secondary/50 border-border"
          placeholder={
            block.type === 'button'
              ? block.link?.startsWith('https://t.me/') ? 'https://t.me/username'
              : block.link?.startsWith('https://wa.me/') ? 'https://wa.me/79001234567'
              : block.link?.startsWith('tel:') ? 'tel:+79001234567'
              : block.link?.startsWith('mailto:') ? 'mailto:you@mail.com'
              : 'https://example.com'
              : 'https://example.com'
          }
        />
      </div>

      {/* Animation */}
      <div className="space-y-2">
        <Label>Анимация появления</Label>
        <Select
          value={block.animation || 'none'}
          onValueChange={(value) => onUpdate({ animation: value === 'none' ? undefined : value })}
        >
          <SelectTrigger className="bg-secondary/50 border-border">
            <SelectValue placeholder="Без анимации" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Без анимации</SelectItem>
            {ANIMATION_EFFECTS.map((effect) => (
              <SelectItem key={effect.id} value={effect.id}>
                {effect.name} — {effect.description}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Hover Effect */}
      <div className="space-y-2">
        <Label>Эффект при наведении</Label>
        <Select
          value={block.hoverEffect || 'none'}
          onValueChange={(value) => onUpdate({ hoverEffect: value === 'none' ? undefined : value })}
        >
          <SelectTrigger className="bg-secondary/50 border-border">
            <SelectValue placeholder="Без эффекта" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Без эффекта</SelectItem>
            {HOVER_EFFECTS.map((effect) => (
              <SelectItem key={effect.id} value={effect.cssClass}>
                {effect.name} — {effect.description}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Text Color */}
      <div className="space-y-2">
        <Label>Цвет текста</Label>
        <div className="flex gap-2 flex-wrap">
          {COLOR_PRESETS.slice(1).map((color) => (
            <button
              key={color.value}
              onClick={() => onUpdateStyles({ textColor: color.value })}
              className="w-8 h-8 rounded border border-border hover:scale-110 transition-transform"
              style={{ backgroundColor: color.value }}
              title={color.name}
            />
          ))}
        </div>
        {customColors.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {customColors.map((color) => (
              <div key={color} className="relative group/cc">
                <button
                  onClick={() => onUpdateStyles({ textColor: color })}
                  className="w-8 h-8 rounded border border-primary/30 hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  title={color}
                />
                <button
                  onClick={() => removeCustomColor(color)}
                  className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover/cc:opacity-100 transition-opacity flex items-center justify-center"
                >
                  <X className="w-2 h-2" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <Input
            type="text"
            value={block.styles.textColor || '#ffffff'}
            onChange={(e) => onUpdateStyles({ textColor: e.target.value })}
            className="bg-secondary/50 border-border flex-1"
            placeholder="#ffffff"
          />
          <Button variant="outline" size="icon" className="shrink-0 h-10 w-10" onClick={() => addCustomColor(block.styles.textColor || '#ffffff')} title="Сохранить цвет">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Background Color */}
      <div className="space-y-2">
        <Label>Цвет фона</Label>
        <div className="flex gap-2 flex-wrap">
          {COLOR_PRESETS.map((color) => (
            <button
              key={color.value}
              onClick={() => onUpdateStyles({ backgroundColor: color.value })}
              className="w-8 h-8 rounded border border-border hover:scale-110 transition-transform"
              style={{ backgroundColor: color.value === 'transparent' ? 'transparent' : color.value }}
              title={color.name}
            >
              {color.value === 'transparent' && (
                <span className="text-xs text-muted-foreground">∅</span>
              )}
            </button>
          ))}
        </div>
        {customColors.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {customColors.map((color) => (
              <button
                key={color}
                onClick={() => onUpdateStyles({ backgroundColor: color })}
                className="w-8 h-8 rounded border border-primary/30 hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        )}
      </div>

      {/* Text Align */}
      <div className="space-y-2">
        <Label>Выравнивание</Label>
        <div className="flex gap-2">
          <Button
            variant={block.styles.textAlign === 'left' ? 'default' : 'outline'}
            size="icon"
            onClick={() => onUpdateStyles({ textAlign: 'left' })}
          >
            <AlignLeft className="w-4 h-4" />
          </Button>
          <Button
            variant={block.styles.textAlign === 'center' ? 'default' : 'outline'}
            size="icon"
            onClick={() => onUpdateStyles({ textAlign: 'center' })}
          >
            <AlignCenter className="w-4 h-4" />
          </Button>
          <Button
            variant={block.styles.textAlign === 'right' ? 'default' : 'outline'}
            size="icon"
            onClick={() => onUpdateStyles({ textAlign: 'right' })}
          >
            <AlignRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Font Family */}
      <div className="space-y-2">
        <Label>Шрифт</Label>
        <Select
          value={block.styles.fontFamily || 'default'}
          onValueChange={(value) => onUpdateStyles({ fontFamily: value === 'default' ? undefined : value })}
        >
          <SelectTrigger className="bg-secondary/50 border-border">
            <SelectValue placeholder="По умолчанию" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">По умолчанию</SelectItem>
            <SelectItem value="'Playfair Display', serif">Playfair Display</SelectItem>
            <SelectItem value="'Inter', sans-serif">Inter</SelectItem>
            <SelectItem value="'Montserrat', sans-serif">Montserrat</SelectItem>
            <SelectItem value="'Roboto', sans-serif">Roboto</SelectItem>
            <SelectItem value="'Open Sans', sans-serif">Open Sans</SelectItem>
            <SelectItem value="'Raleway', sans-serif">Raleway</SelectItem>
            <SelectItem value="'Oswald', sans-serif">Oswald</SelectItem>
            <SelectItem value="'Merriweather', serif">Merriweather</SelectItem>
            <SelectItem value="'Lora', serif">Lora</SelectItem>
            <SelectItem value="'Nunito', sans-serif">Nunito</SelectItem>
            <SelectItem value="'PT Sans', sans-serif">PT Sans</SelectItem>
            <SelectItem value="'Rubik', sans-serif">Rubik</SelectItem>
            <SelectItem value="'Comfortaa', cursive">Comfortaa</SelectItem>
            <SelectItem value="'Caveat', cursive">Caveat</SelectItem>
            <SelectItem value="'Pacifico', cursive">Pacifico</SelectItem>
            <SelectItem value="'Bebas Neue', sans-serif">Bebas Neue</SelectItem>
            <SelectItem value="'Jost', sans-serif">Jost</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Font Size */}
      <div className="space-y-2">
        <Label>Размер шрифта</Label>
        <div className="flex gap-1 flex-wrap">
          {FONT_SIZE_PRESETS.map((preset) => (
            <Button
              key={preset.value}
              size="sm"
              variant={block.styles.fontSize === preset.value ? 'default' : 'outline'}
              onClick={() => onUpdateStyles({ fontSize: preset.value })}
              className="text-[10px] h-7 px-2 min-w-0"
            >
              {preset.label}
            </Button>
          ))}
        </div>
        <Input
          value={block.styles.fontSize || '16px'}
          onChange={(e) => onUpdateStyles({ fontSize: e.target.value })}
          className="bg-secondary/50 border-border text-xs h-8"
          placeholder="Свой размер, напр. 24px"
        />
      </div>

      {/* Padding */}
      <div className="space-y-2">
        <Label>Отступы</Label>
        <Input
          value={block.styles.padding || '16px'}
          onChange={(e) => onUpdateStyles({ padding: e.target.value })}
          className="bg-secondary/50 border-border"
          placeholder="16px"
        />
      </div>

      {/* Border Radius */}
      <div className="space-y-2">
        <Label>Скругление углов</Label>
        <Input
          value={block.styles.borderRadius || '8px'}
          onChange={(e) => onUpdateStyles({ borderRadius: e.target.value })}
          className="bg-secondary/50 border-border"
          placeholder="8px"
        />
      </div>
      {/* Box Shadow */}
      <div className="space-y-2">
        <Label>Тень</Label>
        <Select
          value={block.styles.boxShadow || 'none'}
          onValueChange={(value) => onUpdateStyles({ boxShadow: value === 'none' ? undefined : value })}
        >
          <SelectTrigger className="bg-secondary/50 border-border">
            <SelectValue placeholder="Без тени" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Без тени</SelectItem>
            <SelectItem value="0 4px 6px -1px rgba(0,0,0,0.3)">Лёгкая</SelectItem>
            <SelectItem value="0 10px 25px -5px rgba(0,0,0,0.4)">Средняя</SelectItem>
            <SelectItem value="0 20px 50px -10px rgba(0,0,0,0.5)">Сильная</SelectItem>
            <SelectItem value="0 0 20px rgba(212,168,85,0.3)">Золотое свечение</SelectItem>
            <SelectItem value="0 0 20px rgba(59,130,246,0.3)">Синее свечение</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

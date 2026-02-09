import { Trash2, Copy, ChevronUp, ChevronDown, AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import { PlaygroundBlock, ANIMATION_EFFECTS, HOVER_EFFECTS, COLOR_PRESETS } from "@/data/playground-effects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface BlockEditorProps {
  block: PlaygroundBlock;
  onUpdate: (updates: Partial<PlaygroundBlock>) => void;
  onUpdateStyles: (styles: Partial<PlaygroundBlock['styles']>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMove: (direction: 'up' | 'down') => void;
}

export const BlockEditor = ({
  block,
  onUpdate,
  onUpdateStyles,
  onDelete,
  onDuplicate,
  onMove
}: BlockEditorProps) => {
  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex gap-2">
        <Button variant="outline" size="icon" onClick={() => onMove('up')}>
          <ChevronUp className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={() => onMove('down')}>
          <ChevronDown className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={onDuplicate}>
          <Copy className="w-4 h-4" />
        </Button>
        <Button variant="destructive" size="icon" onClick={onDelete}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      {block.type !== 'divider' && block.type !== 'spacer' && (
        <div className="space-y-2">
          <Label>Содержимое</Label>
          {block.type === 'text' || block.type === 'card' ? (
            <Textarea
              value={block.content}
              onChange={(e) => onUpdate({ content: e.target.value })}
              className="bg-secondary/50 border-border"
              rows={3}
            />
          ) : (
            <Input
              value={block.content}
              onChange={(e) => onUpdate({ content: e.target.value })}
              className="bg-secondary/50 border-border"
            />
          )}
        </div>
      )}

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
        <Input
          type="text"
          value={block.styles.textColor || '#ffffff'}
          onChange={(e) => onUpdateStyles({ textColor: e.target.value })}
          className="bg-secondary/50 border-border mt-2"
          placeholder="#ffffff"
        />
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

      {/* Font Size */}
      <div className="space-y-2">
        <Label>Размер шрифта</Label>
        <Input
          value={block.styles.fontSize || '16px'}
          onChange={(e) => onUpdateStyles({ fontSize: e.target.value })}
          className="bg-secondary/50 border-border"
          placeholder="16px"
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
    </div>
  );
};

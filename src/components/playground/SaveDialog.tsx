import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Globe } from "lucide-react";

interface SaveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (slug: string) => void;
  isSaving: boolean;
  existingSlug?: string | null;
}

const SLUG_REGEX = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]{1,2}$/;

export const SaveDialog = ({ open, onOpenChange, onSave, isSaving, existingSlug }: SaveDialogProps) => {
  const [slug, setSlug] = useState(existingSlug || "");
  const [error, setError] = useState<string | null>(null);

  const generateSlug = () => Math.random().toString(36).substring(2, 10);

  const validate = (value: string): string | null => {
    if (!value) return null; // empty = auto-generate
    if (value.length < 3) return "Минимум 3 символа";
    if (value.length > 50) return "Максимум 50 символов";
    if (!/^[a-z0-9-]+$/.test(value)) return "Только латиница (a-z), цифры и дефис";
    if (value.startsWith("-") || value.endsWith("-")) return "Не может начинаться/заканчиваться дефисом";
    if (value.includes("--")) return "Нельзя использовать два дефиса подряд";
    return null;
  };

  const handleSlugChange = (value: string) => {
    const clean = value.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setSlug(clean);
    setError(validate(clean));
  };

  const handleSave = () => {
    const finalSlug = slug || generateSlug();
    const err = slug ? validate(slug) : null;
    if (err) {
      setError(err);
      return;
    }
    onSave(finalSlug);
  };

  const previewUrl = `24zxc.ru/p/${slug || "..."}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="w-5 h-5 text-primary" />
            Сохранение проекта
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {existingSlug ? (
            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">Ссылка на проект</Label>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50 border border-border">
                <Globe className="w-4 h-4 text-primary shrink-0" />
                <span className="text-sm font-mono">24zxc.ru/p/{existingSlug}</span>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="slug">Адрес страницы</Label>
              <div className="flex items-center gap-0 rounded-lg border border-border overflow-hidden bg-secondary/30">
                <span className="px-3 py-2 text-sm text-muted-foreground bg-secondary/50 border-r border-border whitespace-nowrap">
                  24zxc.ru/p/
                </span>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="my-site"
                  className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none"
                />
              </div>
              {error && <p className="text-xs text-destructive">{error}</p>}
              <p className="text-xs text-muted-foreground">
                Оставьте пустым для автоматической генерации. Допустимы: латиница, цифры, дефис.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button variant="hero" onClick={handleSave} disabled={isSaving || !!error}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "Сохранение..." : "Сохранить"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

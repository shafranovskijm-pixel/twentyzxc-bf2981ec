import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Loader2 } from "lucide-react";
import { PortfolioProject } from "@/hooks/use-portfolio-projects";

interface AddProjectDialogProps {
  onCreate: (project: Omit<PortfolioProject, "id" | "created_at" | "updated_at">) => void;
  isCreating: boolean;
  projectCount: number;
}

export const AddProjectDialog = ({ onCreate, isCreating, projectCount }: AddProjectDialogProps) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    location: "",
    description: "",
    tags: "",
    price: "",
    url: "",
    featured: false,
    is_internal: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({
      title: formData.title,
      location: formData.location || null,
      description: formData.description,
      tags: formData.tags.split(",").map((t) => t.trim()).filter(Boolean),
      price: formData.price || null,
      price_alt: null,
      url: formData.url,
      featured: formData.featured,
      is_internal: formData.is_internal,
      sort_order: projectCount + 1,
    });
    setOpen(false);
    setFormData({
      title: "",
      location: "",
      description: "",
      tags: "",
      price: "",
      url: "",
      featured: false,
      is_internal: false,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Добавить проект
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Новый проект</DialogTitle>
          <DialogDescription>
            Заполните информацию о проекте для портфолио
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Название *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Название проекта"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Локация</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Город"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Описание *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Описание проекта"
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tags">Теги (через запятую)</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="web, SEO, ads"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Цена</Label>
              <Input
                id="price"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="5 000 ₽/мес"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">URL *</Label>
            <Input
              id="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="/projects/name или https://..."
              required
            />
          </div>

          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <Switch
                id="featured"
                checked={formData.featured}
                onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
              />
              <Label htmlFor="featured">Избранный</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="is_internal"
                checked={formData.is_internal}
                onCheckedChange={(checked) => setFormData({ ...formData, is_internal: checked })}
              />
              <Label htmlFor="is_internal">Внутренняя ссылка</Label>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isCreating}>
            {isCreating && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Создать проект
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

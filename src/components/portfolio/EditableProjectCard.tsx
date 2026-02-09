import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  ExternalLink, 
  ArrowRight, 
  Pencil, 
  Save, 
  X, 
  Trash2,
  Globe,
  Megaphone,
  GraduationCap,
  Headphones,
  FileCheck,
  Bot,
  BarChart3
} from "lucide-react";
import { Link } from "react-router-dom";
import { useInView } from "@/hooks/use-in-view";
import { PortfolioProject } from "@/hooks/use-portfolio-projects";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const tagIcons: Record<string, React.ReactNode> = {
  web: <Globe className="w-3 h-3" />,
  ads: <Megaphone className="w-3 h-3" />,
  LMS: <GraduationCap className="w-3 h-3" />,
  support: <Headphones className="w-3 h-3" />,
  license: <FileCheck className="w-3 h-3" />,
  AI: <Bot className="w-3 h-3" />,
  CRM: <BarChart3 className="w-3 h-3" />,
};

interface EditableProjectCardProps {
  project: PortfolioProject;
  index: number;
  isAdmin: boolean;
  isFeatured?: boolean;
  onUpdate: (updates: Partial<PortfolioProject> & { id: string }) => void;
  onDelete: (id: string) => void;
  isUpdating: boolean;
}

export const EditableProjectCard = ({
  project,
  index,
  isAdmin,
  isFeatured = false,
  onUpdate,
  onDelete,
  isUpdating,
}: EditableProjectCardProps) => {
  const [ref, isInView] = useInView<HTMLDivElement>({ threshold: 0.1 });
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(project);

  const handleSave = () => {
    onUpdate({
      id: project.id,
      title: editData.title,
      location: editData.location,
      description: editData.description,
      tags: editData.tags,
      price: editData.price,
      url: editData.url,
      featured: editData.featured,
      is_internal: editData.is_internal,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData(project);
    setIsEditing(false);
  };

  const handleTagsChange = (value: string) => {
    setEditData({
      ...editData,
      tags: value.split(",").map((t) => t.trim()).filter(Boolean),
    });
  };

  if (isEditing) {
    return (
      <div ref={ref} className="luxury-card p-6 rounded-sm space-y-4">
        <div className="flex justify-between items-start">
          <h3 className="font-semibold text-primary">Редактирование</h3>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={handleCancel}>
              <X className="w-4 h-4" />
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isUpdating}>
              <Save className="w-4 h-4 mr-1" />
              Сохранить
            </Button>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Название</Label>
              <Input
                value={editData.title}
                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
              />
            </div>
            <div>
              <Label>Локация</Label>
              <Input
                value={editData.location || ""}
                onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                placeholder="Город"
              />
            </div>
          </div>

          <div>
            <Label>Описание</Label>
            <Textarea
              value={editData.description}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Теги (через запятую)</Label>
              <Input
                value={editData.tags.join(", ")}
                onChange={(e) => handleTagsChange(e.target.value)}
                placeholder="web, SEO, ads"
              />
            </div>
            <div>
              <Label>Цена</Label>
              <Input
                value={editData.price || ""}
                onChange={(e) => setEditData({ ...editData, price: e.target.value })}
                placeholder="5 000 ₽/мес"
              />
            </div>
          </div>

          <div>
            <Label>URL</Label>
            <Input
              value={editData.url}
              onChange={(e) => setEditData({ ...editData, url: e.target.value })}
              placeholder="/projects/name или https://..."
            />
          </div>

          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <Switch
                checked={editData.featured}
                onCheckedChange={(checked) => setEditData({ ...editData, featured: checked })}
              />
              <Label>Избранный</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={editData.is_internal}
                onCheckedChange={(checked) => setEditData({ ...editData, is_internal: checked })}
              />
              <Label>Внутренняя ссылка</Label>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="w-4 h-4 mr-1" />
                Удалить проект
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Удалить проект?</AlertDialogTitle>
                <AlertDialogDescription>
                  Это действие нельзя отменить. Проект «{project.title}» будет удалён навсегда.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Отмена</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(project.id)}>
                  Удалить
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    );
  }

  const CardContent = (
    <>
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className={`font-semibold group-hover:text-primary transition-colors ${isFeatured ? 'text-xl mb-1' : 'text-sm mb-0.5'}`}>
            {project.title}
          </h3>
          {project.location && (
            <p className={`text-muted-foreground ${isFeatured ? 'text-sm' : 'text-xs'}`}>
              {project.location}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsEditing(true);
              }}
            >
              <Pencil className="w-4 h-4" />
            </Button>
          )}
          {project.is_internal ? (
            <ArrowRight className={`${isFeatured ? 'w-5 h-5' : 'w-4 h-4'} text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0`} />
          ) : (
            <ExternalLink className={`${isFeatured ? 'w-5 h-5' : 'w-4 h-4'} text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0`} />
          )}
        </div>
      </div>

      <p className={`text-muted-foreground leading-relaxed ${isFeatured ? 'mb-6' : 'mb-4 text-sm line-clamp-3'}`}>
        {project.description}
      </p>

      <div className={`flex flex-wrap gap-${isFeatured ? '2' : '1.5'} mb-${isFeatured ? '6' : '4'}`}>
        {(isFeatured ? project.tags : project.tags.slice(0, 3)).map((tag, i) => (
          <Badge
            key={i}
            variant="outline"
            className={`border-border ${isFeatured ? 'text-xs flex items-center gap-1' : 'text-[10px] px-2 py-0'}`}
          >
            {isFeatured && tagIcons[tag]}
            {tag}
          </Badge>
        ))}
      </div>

      {project.price && (
        <div className={`${isFeatured ? 'flex gap-3 pt-4 border-t border-border' : ''}`}>
          <span className={`font-medium text-primary ${isFeatured ? 'text-sm' : 'text-xs'}`}>
            {project.price}
          </span>
        </div>
      )}
    </>
  );

  const cardClassName = isFeatured
    ? `group block luxury-card p-8 rounded-sm transition-all duration-500 hover:glow-subtle
       ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`
    : `group block luxury-card p-6 rounded-sm transition-all duration-500 hover:border-primary/40
       ${isInView ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-6 scale-95'}`;

  const delay = isFeatured ? index * 150 : (index % 3) * 100;

  return (
    <div ref={ref} style={{ transitionDelay: `${delay}ms` }}>
      {project.is_internal ? (
        <Link to={project.url} className={cardClassName}>
          {CardContent}
        </Link>
      ) : (
        <a
          href={project.url}
          target="_blank"
          rel="noopener noreferrer"
          className={cardClassName}
        >
          {CardContent}
        </a>
      )}
    </div>
  );
};

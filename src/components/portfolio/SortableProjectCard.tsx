import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { EditableProjectCard } from "./EditableProjectCard";
import { PortfolioProject } from "@/hooks/use-portfolio-projects";

interface SortableProjectCardProps {
  project: PortfolioProject;
  index: number;
  isAdmin: boolean;
  isFeatured?: boolean;
  onUpdate: (updates: Partial<PortfolioProject> & { id: string }) => void;
  onDelete: (id: string) => void;
  isUpdating: boolean;
}

export const SortableProjectCard = ({
  project,
  index,
  isAdmin,
  isFeatured = false,
  onUpdate,
  onDelete,
  isUpdating,
}: SortableProjectCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : "auto",
  };

  if (!isAdmin) {
    return (
      <EditableProjectCard
        project={project}
        index={index}
        isAdmin={isAdmin}
        isFeatured={isFeatured}
        onUpdate={onUpdate}
        onDelete={onDelete}
        isUpdating={isUpdating}
      />
    );
  }

  return (
    <div ref={setNodeRef} style={style} className="relative group/drag">
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute -left-3 top-1/2 -translate-y-1/2 opacity-0 group-hover/drag:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-10 bg-card border border-border rounded p-1"
      >
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>
      
      <EditableProjectCard
        project={project}
        index={index}
        isAdmin={isAdmin}
        isFeatured={isFeatured}
        onUpdate={onUpdate}
        onDelete={onDelete}
        isUpdating={isUpdating}
      />
    </div>
  );
};

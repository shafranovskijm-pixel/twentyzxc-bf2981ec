import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { LogOut, CalendarDays, FileText, Users, Building2, FileOutput, GripVertical, MessageSquare } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";

const defaultMenuItems = [
  { id: "planner", label: "Планер", icon: CalendarDays },
  { id: "contracts", label: "Договоры", icon: FileText },
  { id: "clients", label: "Клиенты", icon: Users },
  { id: "organizations", label: "Организации", icon: Building2 },
  { id: "documents", label: "Документы", icon: FileOutput },
  { id: "ai-chat", label: "AI Ассистент", icon: MessageSquare },
];

const STORAGE_KEY = "admin-sidebar-order-v2";

interface AdminSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  onSignOut: () => void;
  themeClass?: string;
}

function SortableIconButton({
  item,
  isActive,
  onClick,
}: {
  item: (typeof defaultMenuItems)[0];
  isActive: boolean;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  const Icon = item.icon;

  return (
    <div ref={setNodeRef} style={style} className="group/item relative">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200",
              isActive
                ? "bg-primary/20 text-primary shadow-[0_0_12px_hsl(var(--primary)/0.3)]"
                : "text-muted-foreground hover:text-primary hover:bg-primary/15"
            )}
          >
            <Icon className="h-5 w-5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          {item.label}
        </TooltipContent>
      </Tooltip>
      <span
        {...attributes}
        {...listeners}
        className="absolute -left-1 top-1/2 -translate-y-1/2 cursor-grab opacity-0 group-hover/item:opacity-40 transition-opacity p-0.5"
      >
        <GripVertical className="h-3 w-3" />
      </span>
    </div>
  );
}

const AdminSidebar = ({ activeSection, onSectionChange, onSignOut, themeClass }: AdminSidebarProps) => {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const order: string[] = JSON.parse(saved);
        const sorted = order
          .map(id => defaultMenuItems.find(m => m.id === id))
          .filter(Boolean) as typeof defaultMenuItems;
        const missing = defaultMenuItems.filter(m => !order.includes(m.id));
        return [...sorted, ...missing];
      }
    } catch {}
    return defaultMenuItems;
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setItems(prev => {
        const oldIdx = prev.findIndex(i => i.id === active.id);
        const newIdx = prev.findIndex(i => i.id === over.id);
        const next = arrayMove(prev, oldIdx, newIdx);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next.map(i => i.id)));
        return next;
      });
    }
  };

  return (
    <TooltipProvider delayDuration={200}>
      <aside className={cn("w-16 shrink-0 border-r flex flex-col items-center py-4 gap-1.5 sticky top-0 h-screen z-30 transition-colors duration-500", themeClass || "border-border bg-card")}>
        {/* Logo */}
        <a href="/" className="mb-4 text-xs font-bold text-primary tracking-widest select-none hover:opacity-80 transition-opacity" title="На главную">24</a>

        {/* Primary nav */}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
            <nav className="flex flex-col items-center gap-1.5 justify-center flex-1">
              {items.map((item) => (
                <SortableIconButton
                  key={item.id}
                  item={item}
                  isActive={activeSection === item.id}
                  onClick={() => onSectionChange(item.id)}
                />
              ))}
            </nav>
          </SortableContext>
        </DndContext>

        {/* Logout at bottom */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onSignOut}
              className="w-10 h-10 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200 mt-auto"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            Выйти
          </TooltipContent>
        </Tooltip>
      </aside>
    </TooltipProvider>
  );
};

export default AdminSidebar;

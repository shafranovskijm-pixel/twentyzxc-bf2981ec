import { useState, useEffect } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { LogOut, CalendarDays, FileText, Users, Building2, FileOutput, GripVertical, MessageSquare, FileSpreadsheet, ClipboardList, TrendingUp, FileSignature, Bell } from "lucide-react";
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

export const defaultMenuItems = [
  { id: "sales", label: "Продажи", icon: TrendingUp },
  { id: "proposals", label: "Коммерческие предложения", icon: FileSignature },
  { id: "planner", label: "Планер", icon: CalendarDays },
  { id: "contracts", label: "Договоры", icon: FileText },
  { id: "clients", label: "Клиенты", icon: Users },
  { id: "organizations", label: "Организации", icon: Building2 },
  { id: "documents", label: "Документы", icon: FileOutput },
  { id: "tz", label: "ТЗ", icon: ClipboardList },
  { id: "reconciliation", label: "Акты сверки", icon: FileSpreadsheet },
  { id: "notifications", label: "Уведомления", icon: Bell },
  { id: "ai-chat", label: "AI Ассистент", icon: MessageSquare },
];

export const SIDEBAR_ORDER_STORAGE_KEY = "admin-sidebar-order-v2";
export const HIDDEN_STORAGE_KEY = "admin-sidebar-hidden-v1";
export const SIDEBAR_VISIBILITY_EVENT = "admin-sidebar-visibility-changed";

/** Sections that are core to the CRM and can never be hidden from the menu. */
export const PINNED_MENU_IDS = ["proposals"];

function readHidden(): string[] {
  try {
    const raw = localStorage.getItem(HIDDEN_STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr)
      ? arr.filter((x) => typeof x === "string" && !PINNED_MENU_IDS.includes(x))
      : [];
  } catch {
    return [];
  }
}

function readOrderedItems(): typeof defaultMenuItems {
  try {
    const saved = localStorage.getItem(SIDEBAR_ORDER_STORAGE_KEY);
    if (saved) {
      const order: string[] = JSON.parse(saved);
      const sorted = order
        .map(id => defaultMenuItems.find(m => m.id === id))
        .filter(Boolean) as typeof defaultMenuItems;
      const missing = defaultMenuItems.filter(m => !order.includes(m.id));
      return [...sorted, ...missing] as typeof defaultMenuItems;
    }
  } catch {}
  return defaultMenuItems;
}

interface AdminSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  onSignOut: () => void;
  themeClass?: string;
  inSheet?: boolean;
  className?: string;
}

function SortableNavButton({
  item,
  isActive,
  onClick,
  expanded,
}: {
  item: (typeof defaultMenuItems)[0];
  isActive: boolean;
  onClick: () => void;
  /** Always-expanded variant (mobile sheet). Otherwise labels appear from lg up. */
  expanded: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  const Icon = item.icon;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("group/item relative", expanded ? "w-full" : "lg:w-full")}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            title={item.label}
            aria-label={item.label}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "h-10 rounded-lg flex items-center transition-colors duration-200 text-sm",
              expanded
                ? "w-full justify-start gap-3 pl-3 pr-8 text-left"
                : "w-10 justify-center lg:w-full lg:justify-start lg:gap-3 lg:pl-3 lg:pr-8 lg:text-left",
              isActive
                ? "bg-primary/15 text-primary font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            )}
          >
            <Icon className={cn("shrink-0", expanded ? "h-4 w-4" : "h-5 w-5 lg:h-4 lg:w-4")} />
            <span className={cn("truncate", expanded ? "inline" : "hidden lg:inline")}>{item.label}</span>
          </button>
        </TooltipTrigger>
        {!expanded && (
          <TooltipContent side="right" sideOffset={8} className="lg:hidden">
            {item.label}
          </TooltipContent>
        )}
      </Tooltip>
      <span
        {...attributes}
        {...listeners}
        aria-label={`Переместить «${item.label}»`}
        className={cn(
          "absolute top-1/2 -translate-y-1/2 cursor-grab opacity-0 group-hover/item:opacity-40 transition-opacity",
          expanded ? "right-1 p-1" : "-left-1 p-0.5 lg:left-auto lg:right-1 lg:p-1"
        )}
      >
        <GripVertical className={cn(expanded ? "h-3.5 w-3.5" : "h-3 w-3 lg:h-3.5 lg:w-3.5")} />
      </span>
    </div>
  );
}

const AdminSidebar = ({ activeSection, onSectionChange, onSignOut, themeClass, inSheet, className }: AdminSidebarProps) => {
  const [items, setItems] = useState(readOrderedItems);
  const [hidden, setHidden] = useState<string[]>(() => readHidden());

  useEffect(() => {
    const update = () => {
      setHidden(readHidden());
      setItems(readOrderedItems());
    };
    window.addEventListener(SIDEBAR_VISIBILITY_EVENT, update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener(SIDEBAR_VISIBILITY_EVENT, update);
      window.removeEventListener("storage", update);
    };
  }, []);

  const visibleItems = items.filter((i) => !hidden.includes(i.id));
  // Expanded (labelled) layout: wide desktop and inside the mobile sheet.
  const expanded = !!inSheet;

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
        localStorage.setItem(SIDEBAR_ORDER_STORAGE_KEY, JSON.stringify(next.map(i => i.id)));
        window.dispatchEvent(new Event(SIDEBAR_VISIBILITY_EVENT));
        return next;
      });
    }
  };

  return (
    <TooltipProvider delayDuration={200}>
      <aside className={cn(
        "shrink-0 border-r flex flex-col py-4 gap-1 z-30 transition-colors duration-500",
        expanded ? "w-72 px-3 items-stretch" : "w-16 items-center lg:w-60 lg:px-3 lg:items-stretch",
        inSheet ? "h-full" : "sticky top-0 h-screen",
        themeClass || "border-border bg-card",
        className
      )}>
        {/* Logo */}
        <a
          href="/"
          title="На главную"
          className={cn(
            "mb-4 select-none hover:opacity-80 transition-opacity text-primary font-bold tracking-widest",
            expanded ? "px-3 text-sm" : "text-xs self-center lg:self-start lg:px-3 lg:text-sm"
          )}
        >
          24<span className={cn("text-foreground", expanded ? "" : "hidden lg:inline")}>ZXC CRM</span>
        </a>

        {/* Primary nav */}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={visibleItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
            <nav className={cn(
              "flex flex-col gap-1 flex-1 overflow-y-auto",
              expanded ? "items-stretch" : "items-center justify-center lg:items-stretch lg:justify-start"
            )}>
              {visibleItems.map((item) => (
                <SortableNavButton
                  key={item.id}
                  item={item}
                  isActive={activeSection === item.id}
                  expanded={expanded}
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
              title="Выйти"
              aria-label="Выйти"
              className={cn(
                "h-10 rounded-lg flex items-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200 mt-auto",
                expanded ? "w-full gap-3 pl-3 text-sm" : "w-10 justify-center self-center lg:w-full lg:gap-3 lg:pl-3 lg:justify-start lg:self-stretch lg:text-sm"
              )}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span className={cn(expanded ? "" : "hidden lg:inline")}>Выйти</span>
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

import { useState, useEffect } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Search, Mail, Sparkles, Users, FileText, FolderArchive, LogOut, GripVertical, CalendarDays, Building2, FileOutput, LayoutDashboard, History, GraduationCap } from "lucide-react";
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

const defaultMenuItems = [
  { id: "dashboard", label: "Дашборд", icon: "LayoutDashboard" },
  { id: "seo", label: "SEO", icon: "Search" },
  { id: "contacts", label: "Контакты", icon: "Mail" },
  { id: "promotions", label: "Акции", icon: "Sparkles" },
  { id: "clients", label: "Клиенты", icon: "Users" },
  { id: "contracts", label: "Договоры", icon: "FileText" },
  { id: "files", label: "Файлы", icon: "FolderArchive" },
  { id: "planner", label: "Планер", icon: "CalendarDays" },
  { id: "documents", label: "Документы", icon: "FileOutput" },
  { id: "requisites", label: "Реквизиты", icon: "Building2" },
  { id: "history", label: "История", icon: "History" },
  { id: "nmo", label: "НМО Портал", icon: "GraduationCap" },
  { id: "frdo", label: "ФИС ФРДО", icon: "FileCheck" },
];

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Search, Mail, Sparkles, Users, FileText, FolderArchive, CalendarDays, FileOutput, Building2, LayoutDashboard, History, GraduationCap,
};

const STORAGE_KEY = "admin-sidebar-order";

interface AdminSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  onSignOut: () => void;
}

function SortableMenuItem({
  item,
  isActive,
  collapsed,
  onClick,
}: {
  item: { id: string; label: string; icon: string };
  isActive: boolean;
  collapsed: boolean;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  const Icon = iconMap[item.icon];

  return (
    <SidebarMenuItem ref={setNodeRef} style={style}>
      <div className="flex items-center group/item">
        {!collapsed && (
          <span
            {...attributes}
            {...listeners}
            className="cursor-grab opacity-0 group-hover/item:opacity-60 transition-opacity p-1 shrink-0"
          >
            <GripVertical className="h-3 w-3" />
          </span>
        )}
        <SidebarMenuButton
          onClick={onClick}
          isActive={isActive}
          tooltip={item.label}
          className="flex-1"
        >
          {Icon && <Icon className="h-4 w-4" />}
          {!collapsed && <span>{item.label}</span>}
        </SidebarMenuButton>
      </div>
    </SidebarMenuItem>
  );
}

const AdminSidebar = ({ activeSection, onSectionChange, onSignOut }: AdminSidebarProps) => {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

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
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
                <SidebarMenu>
                  {items.map((item) => (
                    <SortableMenuItem
                      key={item.id}
                      item={item}
                      isActive={activeSection === item.id}
                      collapsed={collapsed}
                      onClick={() => onSectionChange(item.id)}
                    />
                  ))}
                </SidebarMenu>
              </SortableContext>
            </DndContext>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <Button variant="ghost" size={collapsed ? "icon" : "sm"} onClick={onSignOut} className="w-full justify-start">
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-2">Выйти</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AdminSidebar;

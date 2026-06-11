import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { LogOut, CalendarDays, FileText, Users, FolderArchive, MessageSquare, User, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { id: "sales", label: "Продажи", icon: TrendingUp },
  { id: "contracts", label: "Договоры", icon: FileText },
  { id: "planner", label: "Планер", icon: CalendarDays },
  { id: "clients", label: "Клиенты", icon: Users },
  { id: "files", label: "Файлы", icon: FolderArchive },
  { id: "ai-chat", label: "AI Ассистент", icon: MessageSquare },
  { id: "profile", label: "Профиль", icon: User },
];

interface OrgSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  onSignOut: () => void;
  themeClass?: string;
}

const OrgSidebar = ({ activeSection, onSectionChange, onSignOut, themeClass }: OrgSidebarProps) => {
  return (
    <TooltipProvider delayDuration={200}>
      <aside className={cn("w-16 shrink-0 border-r flex flex-col items-center py-4 gap-1.5 sticky top-0 h-screen z-30 transition-colors duration-500", themeClass || "border-border bg-card")}>
        <div className="mb-4 text-xs font-bold text-primary tracking-widest select-none">ORG</div>

        <nav className="flex flex-col items-center gap-1.5 justify-center flex-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Tooltip key={item.id}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onSectionChange(item.id)}
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200",
                      activeSection === item.id
                        ? "bg-primary/20 text-primary shadow-[0_0_12px_hsl(var(--primary)/0.3)]"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>{item.label}</TooltipContent>
              </Tooltip>
            );
          })}
        </nav>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onSignOut}
              className="w-10 h-10 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200 mt-auto"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>Выйти</TooltipContent>
        </Tooltip>
      </aside>
    </TooltipProvider>
  );
};

export default OrgSidebar;

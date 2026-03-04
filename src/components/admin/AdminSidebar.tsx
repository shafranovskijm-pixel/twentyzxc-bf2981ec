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
import { Search, Mail, Sparkles, Users, FileText, FolderArchive, LogOut } from "lucide-react";

const menuItems = [
  { id: "seo", label: "SEO", icon: Search },
  { id: "contacts", label: "Контакты", icon: Mail },
  { id: "promotions", label: "Акции", icon: Sparkles },
  { id: "clients", label: "Клиенты", icon: Users },
  { id: "contracts", label: "Договоры", icon: FileText },
  { id: "files", label: "Файлы", icon: FolderArchive },
];

interface AdminSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  onSignOut: () => void;
}

const AdminSidebar = ({ activeSection, onSectionChange, onSignOut }: AdminSidebarProps) => {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => onSectionChange(item.id)}
                    isActive={activeSection === item.id}
                    tooltip={item.label}
                  >
                    <item.icon className="h-4 w-4" />
                    {!collapsed && <span>{item.label}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
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

import { useState, useEffect, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useOrgAuth } from "@/hooks/use-org-auth";
import { AdminLoginDialog } from "@/components/portfolio/AdminLoginDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sun, Moon, User, Building2 } from "lucide-react";
import OrgSidebar from "@/components/org/OrgSidebar";
import OrgContractsTab from "@/components/org/OrgContractsTab";
import OrgClientsTab from "@/components/org/OrgClientsTab";
import OrgPlannerTab from "@/components/org/OrgPlannerTab";
import OrgFilesTab from "@/components/org/OrgFilesTab";
import OrgLandingEditor from "@/components/org/OrgLandingEditor";
import InlineAIChat from "@/components/admin/InlineAIChat";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

const OrgPanel = () => {
  const { user, isOrg, isLoading: authLoading, signIn, signOut } = useOrgAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [activeSection, setActiveSection] = useState("contracts");
  const [isDark, setIsDark] = useState(() => localStorage.getItem("org-theme") !== "light");
  const queryClient = useQueryClient();

  const { data: organization } = useQuery({
    queryKey: ["my-organization", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user && isOrg,
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("org-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("org-theme", "light");
    }
  }, [isDark]);

  useEffect(() => {
    if (!authLoading && !isOrg) setShowLogin(true);
  }, [authLoading, isOrg]);

  if (authLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
  }

  if (!isOrg) {
    return (
      <>
        <Helmet><title>Панель организации | 24ZXC</title><meta name="robots" content="noindex, nofollow" /></Helmet>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <AdminLoginDialog onLogin={signIn} open={showLogin} onOpenChange={setShowLogin} />
          {!showLogin && <Button onClick={() => setShowLogin(true)}>Войти как организация</Button>}
        </div>
      </>
    );
  }

  const sectionTitles: Record<string, string> = {
    contracts: "Договоры",
    planner: "Планер",
    clients: "Клиенты",
    files: "Файлы",
    "ai-chat": "AI Ассистент",
    profile: "Профиль",
  };

  const orgId = organization?.id || "";

  return (
    <>
      <Helmet><title>{organization?.name || "Организация"} | 24ZXC</title><meta name="robots" content="noindex, nofollow" /></Helmet>
      <div className="min-h-screen flex w-full bg-background">
        <OrgSidebar activeSection={activeSection} onSectionChange={setActiveSection} onSignOut={signOut} />
        <div className="flex-1 flex flex-col min-h-screen">
          <header className="h-14 flex items-center border-b px-4 gap-3 sticky top-0 backdrop-blur-sm z-20 border-border bg-background/95">
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <Building2 className="h-5 w-5 text-primary" />
              <div className="min-w-0">
                <div className="text-sm font-semibold text-foreground leading-tight truncate">{organization?.name || "Организация"}</div>
                <div className="text-[10px] text-muted-foreground leading-tight">Панель управления</div>
              </div>
            </div>
            <h1 className="text-base font-medium text-muted-foreground hidden md:block">{sectionTitles[activeSection]}</h1>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setIsDark(!isDark)}>
                {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="sm" className="h-9 gap-1.5 text-xs" onClick={() => setActiveSection("profile")}>
                <User className="h-4 w-4" /><span className="hidden sm:inline">Профиль</span>
              </Button>
            </div>
          </header>

          <div className="h-20 relative overflow-hidden shrink-0">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/10 to-accent/10" />
          </div>

          <main className="flex-1 p-3 sm:p-6 max-w-5xl pb-24">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {activeSection === "contracts" && orgId && <OrgContractsTab organizationId={orgId} />}
                {activeSection === "planner" && orgId && <OrgPlannerTab organizationId={orgId} />}
                {activeSection === "clients" && orgId && <OrgClientsTab organizationId={orgId} />}
                {activeSection === "files" && orgId && <OrgFilesTab organizationId={orgId} />}
                {activeSection === "ai-chat" && <InlineAIChat />}
                {activeSection === "profile" && organization && (
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" />Данные организации</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Название:</span>
                          <span className="font-medium">{organization.name}</span>
                        </div>
                        {organization.inn && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">ИНН:</span>
                            <span>{organization.inn}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <OrgLandingEditor
                      organizationId={orgId}
                      orgName={organization.name || ""}
                      landingSlug={organization.landing_slug}
                      landingConfig={(organization.landing_config as any) || {}}
                      onUpdate={() => queryClient.invalidateQueries({ queryKey: ["my-organization", user?.id] })}
                    />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </main>
          <Footer />
        </div>
      </div>
    </>
  );
};

export default OrgPanel;

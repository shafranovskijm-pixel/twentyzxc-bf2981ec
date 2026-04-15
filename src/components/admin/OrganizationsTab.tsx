import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Loader2, Building2, Trash2, ExternalLink, Eye, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import OrgContractsTab from "@/components/org/OrgContractsTab";
import OrgClientsTab from "@/components/org/OrgClientsTab";
import OrgPlannerTab from "@/components/org/OrgPlannerTab";
import OrgFilesTab from "@/components/org/OrgFilesTab";
import OrgLandingEditor from "@/components/org/OrgLandingEditor";
import InlineAIChat from "@/components/admin/InlineAIChat";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Organization {
  id: string;
  user_id: string;
  name: string;
  inn: string | null;
  logo_url: string | null;
  landing_slug: string | null;
  landing_config: any;
  created_at: string;
  updated_at: string;
}

const orgSections = [
  { id: "contracts", label: "Договоры" },
  { id: "clients", label: "Клиенты" },
  { id: "planner", label: "Планер" },
  { id: "files", label: "Файлы" },
  { id: "landing", label: "Лендинг" },
  { id: "ai-chat", label: "AI" },
];

const OrgInlineView = ({ org, onBack }: { org: Organization; onBack: () => void }) => {
  const [tab, setTab] = useState("contracts");
  const queryClient = useQueryClient();

  return (
    <div className="space-y-4 pb-20">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Building2 className="h-5 w-5 text-primary" />
        <div>
          <div className="font-semibold text-sm">{org.name}</div>
          {org.inn && <div className="text-xs text-muted-foreground">ИНН: {org.inn}</div>}
        </div>
      </div>

      <div className="flex gap-1 flex-wrap">
        {orgSections.map((s) => (
          <Button
            key={s.id}
            variant={tab === s.id ? "default" : "outline"}
            size="sm"
            className="text-xs h-7"
            onClick={() => setTab(s.id)}
          >
            {s.label}
          </Button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15 }}
        >
          {tab === "contracts" && <OrgContractsTab organizationId={org.id} />}
          {tab === "clients" && <OrgClientsTab organizationId={org.id} />}
          {tab === "planner" && <OrgPlannerTab organizationId={org.id} />}
          {tab === "files" && <OrgFilesTab organizationId={org.id} />}
          {tab === "landing" && (
            <OrgLandingEditor
              organizationId={org.id}
              orgName={org.name || ""}
              landingSlug={org.landing_slug}
              landingConfig={(org.landing_config as any) || {}}
              onUpdate={() => queryClient.invalidateQueries({ queryKey: ["admin-organizations"] })}
            />
          )}
          {tab === "ai-chat" && <InlineAIChat />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

const OrganizationsTab = () => {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [orgInn, setOrgInn] = useState("");
  const [orgEmail, setOrgEmail] = useState("");
  const [orgPassword, setOrgPassword] = useState("");
  const [creating, setCreating] = useState(false);
  const [viewingOrg, setViewingOrg] = useState<Organization | null>(null);

  const { data: organizations = [], isLoading } = useQuery({
    queryKey: ["admin-organizations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Organization[];
    },
  });

  const deleteOrg = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("organizations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-organizations"] });
      toast.success("Организация удалена");
    },
    onError: () => toast.error("Ошибка удаления"),
  });

  const handleCreate = async () => {
    if (!orgName.trim() || !orgEmail.trim() || !orgPassword.trim()) {
      toast.error("Заполните все обязательные поля");
      return;
    }
    setCreating(true);
    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: orgEmail,
        password: orgPassword,
        options: { data: { display_name: orgName } },
      });
      if (signUpError) throw signUpError;
      if (!signUpData.user) throw new Error("Не удалось создать пользователя");

      const userId = signUpData.user.id;

      const { error: roleError } = await supabase.from("user_roles").insert({
        user_id: userId,
        role: "organization" as any,
      });
      if (roleError) throw roleError;

      const { error: orgError } = await supabase.from("organizations").insert({
        user_id: userId,
        name: orgName,
        inn: orgInn || null,
      } as any);
      if (orgError) throw orgError;

      toast.success(`Организация «${orgName}» создана`);
      queryClient.invalidateQueries({ queryKey: ["admin-organizations"] });
      setShowCreate(false);
      setOrgName("");
      setOrgInn("");
      setOrgEmail("");
      setOrgPassword("");
    } catch (e: any) {
      toast.error(e.message || "Ошибка создания");
    }
    setCreating(false);
  };

  if (viewingOrg) {
    return <OrgInlineView org={viewingOrg} onBack={() => setViewingOrg(null)} />;
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Организации
          </h2>
          <p className="text-sm text-muted-foreground">Управление аккаунтами организаций</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />Создать
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Новая организация</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Название *</Label>
                <Input value={orgName} onChange={e => setOrgName(e.target.value)} placeholder="ООО «Компания»" />
              </div>
              <div className="space-y-2">
                <Label>ИНН</Label>
                <Input value={orgInn} onChange={e => setOrgInn(e.target.value)} placeholder="1234567890" />
              </div>
              <div className="space-y-2">
                <Label>Email для входа *</Label>
                <Input type="email" value={orgEmail} onChange={e => setOrgEmail(e.target.value)} placeholder="org@example.com" />
              </div>
              <div className="space-y-2">
                <Label>Пароль *</Label>
                <Input type="password" value={orgPassword} onChange={e => setOrgPassword(e.target.value)} placeholder="Минимум 6 символов" />
              </div>
              <Button onClick={handleCreate} disabled={creating} className="w-full">
                {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                Создать организацию
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : organizations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Нет организаций</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Название</TableHead>
                  <TableHead>ИНН</TableHead>
                  <TableHead>Лендинг</TableHead>
                  <TableHead>Дата</TableHead>
                  <TableHead className="text-right sticky right-0 bg-card">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {organizations.map(org => (
                  <TableRow key={org.id}>
                    <TableCell className="font-medium">{org.name || "—"}</TableCell>
                    <TableCell>{org.inn || "—"}</TableCell>
                    <TableCell>
                      {org.landing_slug ? (
                        <a href={`/shop/${org.landing_slug}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline text-sm">
                          <ExternalLink className="h-3 w-3" />{org.landing_slug}
                        </a>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(org.created_at).toLocaleDateString("ru-RU")}
                    </TableCell>
                    <TableCell className="text-right sticky right-0 bg-card">
                      <Button variant="ghost" size="icon" onClick={() => setViewingOrg(org)} title="Войти как организация">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteOrg.mutate(org.id)} className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OrganizationsTab;

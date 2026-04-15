import { useState, useEffect, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { AnimatePresence, motion } from "framer-motion";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { AdminLoginDialog } from "@/components/portfolio/AdminLoginDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import AdminSidebar from "@/components/admin/AdminSidebar";
import Footer from "@/components/Footer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import ClientsTab from "@/components/admin/ClientsTab";
import ContractsTab from "@/components/admin/ContractsTab";
import FilesTab from "@/components/admin/FilesTab";
import PlannerTab from "@/components/admin/PlannerTab";
import DocumentsTab from "@/components/admin/DocumentsTab";
import RequisitesTab from "@/components/admin/RequisitesTab";

import HistoryTab from "@/components/admin/HistoryTab";
import NmoTab from "@/components/admin/NmoTab";
import FrdoTab from "@/components/admin/FrdoTab";
import NotificationsPanel from "@/components/admin/NotificationsPanel";
import InlineAIChat from "@/components/admin/InlineAIChat";
import { Save, X, Plus, Loader2, Search, Share2, Mail, Sparkles, Trash2, Building2, History, GraduationCap, FileCheck, Sun, Moon, Camera, RotateCcw, Palette, User, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
interface Promotion {
  id: string;
  title: string;
  description: string | null;
  price: string | null;
  old_price: string | null;
  badge: string | null;
  icon: string | null;
  is_active: boolean;
  sort_order: number;
}

const BG_PRESETS = [
  { id: "default", label: "По умолчанию", style: "bg-background" },
  { id: "dark-grid", label: "Тёмная сетка", style: "bg-[#0f0f14] bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:24px_24px]" },
  { id: "warm", label: "Тёплый", style: "bg-gradient-to-br from-[#1a1510] to-[#15171e]" },
  { id: "ocean", label: "Океан", style: "bg-gradient-to-br from-[#0f1923] to-[#15171e]" },
];

const Admin = () => {
  const { user, isAdmin, isLoading: authLoading, signIn, signOut } = useAdminAuth();
  const { settings, isLoading: settingsLoading, isError: settingsError, updateMultiple } = useSiteSettings();
  const [showLogin, setShowLogin] = useState(false);
  const [activeSection, setActiveSection] = useState("contracts");
  const [docInitialClientName, setDocInitialClientName] = useState("");
  const [docInitialContractId, setDocInitialContractId] = useState("");
  const [docInitialDocType, setDocInitialDocType] = useState<string>("");
  const queryClient = useQueryClient();
  const [siteSettingsSubTab, setSiteSettingsSubTab] = useState("seo");

  // Theme state
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("admin-theme");
    return saved !== "light";
  });

  // Banner state
  const [bannerUrl, setBannerUrl] = useState(() => localStorage.getItem("admin-banner-url") || "");
  const [bannerUploading, setBannerUploading] = useState(false);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Background state
  const [bgPreset, setBgPreset] = useState(() => localStorage.getItem("admin-bg-preset") || "default");

  // SEO state
  const [keywords, setKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [ogTitle, setOgTitle] = useState("");
  const [ogDescription, setOgDescription] = useState("");

  // Contact state
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactTelegram, setContactTelegram] = useState("");

  // Promo state
  const [promoTitle, setPromoTitle] = useState("");
  const [promoDesc, setPromoDesc] = useState("");
  const [promoPrice, setPromoPrice] = useState("");
  const [promoOldPrice, setPromoOldPrice] = useState("");
  const [promoBadge, setPromoBadge] = useState("Акция");
  const [promoIcon, setPromoIcon] = useState("");
  const [editingPromo, setEditingPromo] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Banner upload handler
  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `banner-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("admin-assets").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("admin-assets").getPublicUrl(path);
      setBannerUrl(publicUrl);
      localStorage.setItem("admin-banner-url", publicUrl);
      toast.success("Баннер обновлён");
    } catch {
      toast.error("Ошибка загрузки баннера");
    }
    setBannerUploading(false);
    if (bannerInputRef.current) bannerInputRef.current.value = "";
  };

  const resetBanner = () => {
    setBannerUrl("");
    localStorage.removeItem("admin-banner-url");
    toast.success("Баннер сброшен");
  };

  const handleBgChange = (presetId: string) => {
    setBgPreset(presetId);
    localStorage.setItem("admin-bg-preset", presetId);
  };

  const { data: promotions = [], isLoading: promosLoading } = useQuery({
    queryKey: ["admin-promotions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("promotions").select("*").order("sort_order");
      if (error) throw error;
      return data as Promotion[];
    },
    enabled: isAdmin,
  });

  const togglePromoActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("promotions").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-promotions"] }),
  });

  const deletePromo = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("promotions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-promotions"] }); toast.success("Акция удалена"); },
  });

  const savePromo = async () => {
    if (!promoTitle.trim()) return toast.error("Укажите заголовок");
    setSaving(true);
    try {
      if (editingPromo) {
        const { error } = await supabase.from("promotions").update({
          title: promoTitle, description: promoDesc || null, price: promoPrice || null,
          old_price: promoOldPrice || null, badge: promoBadge || null, icon: promoIcon || null, updated_at: new Date().toISOString(),
        }).eq("id", editingPromo);
        if (error) throw error;
        toast.success("Акция обновлена");
      } else {
        const { error } = await supabase.from("promotions").insert({
          title: promoTitle, description: promoDesc || null, price: promoPrice || null,
          old_price: promoOldPrice || null, badge: promoBadge || null, icon: promoIcon || null,
        });
        if (error) throw error;
        toast.success("Акция добавлена");
      }
      queryClient.invalidateQueries({ queryKey: ["admin-promotions"] });
      resetPromoForm();
    } catch { toast.error("Ошибка сохранения"); }
    setSaving(false);
  };

  const resetPromoForm = () => {
    setPromoTitle(""); setPromoDesc(""); setPromoPrice(""); setPromoOldPrice(""); setPromoBadge("Акция"); setPromoIcon(""); setEditingPromo(null);
  };

  const startEditPromo = (p: Promotion) => {
    setEditingPromo(p.id); setPromoTitle(p.title); setPromoDesc(p.description || "");
    setPromoPrice(p.price || ""); setPromoOldPrice(p.old_price || ""); setPromoBadge(p.badge || ""); setPromoIcon(p.icon || "");
  };

  useEffect(() => { if (!authLoading && !isAdmin) setShowLogin(true); }, [authLoading, isAdmin]);

  // Theme sync
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("admin-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("admin-theme", "light");
    }
  }, [isDark]);

  useEffect(() => {
    if (settings.seo_keywords !== undefined) setKeywords(settings.seo_keywords.split(",").map((k: string) => k.trim()).filter(Boolean));
    if (settings.seo_title !== undefined) setSeoTitle(settings.seo_title);
    if (settings.seo_description !== undefined) setSeoDescription(settings.seo_description);
    if (settings.og_title !== undefined) setOgTitle(settings.og_title);
    if (settings.og_description !== undefined) setOgDescription(settings.og_description);
    if (settings.contact_email !== undefined) setContactEmail(settings.contact_email);
    if (settings.contact_phone !== undefined) setContactPhone(settings.contact_phone);
    if (settings.contact_telegram !== undefined) setContactTelegram(settings.contact_telegram);
  }, [settings]);

  const addKeyword = () => { const w = newKeyword.trim(); if (w && !keywords.includes(w)) { setKeywords([...keywords, w]); setNewKeyword(""); } };
  const removeKeyword = (keyword: string) => setKeywords(keywords.filter((k) => k !== keyword));
  const handleKeywordKeyDown = (e: React.KeyboardEvent) => { if (e.key === "Enter") { e.preventDefault(); addKeyword(); } };

  const saveSeo = async () => {
    setSaving(true);
    try {
      await updateMultiple.mutateAsync([
        { key: "seo_keywords", value: keywords.join(", ") },
        { key: "seo_title", value: seoTitle },
        { key: "seo_description", value: seoDescription },
        { key: "og_title", value: ogTitle },
        { key: "og_description", value: ogDescription },
      ]);
      toast.success("SEO-настройки сохранены");
    } catch { toast.error("Ошибка сохранения"); }
    setSaving(false);
  };

  const saveContacts = async () => {
    setSaving(true);
    try {
      await updateMultiple.mutateAsync([
        { key: "contact_email", value: contactEmail },
        { key: "contact_phone", value: contactPhone },
        { key: "contact_telegram", value: contactTelegram },
      ]);
      toast.success("Контакты сохранены");
    } catch { toast.error("Ошибка сохранения"); }
    setSaving(false);
  };

  if (authLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
  }

  if (!isAdmin) {
    return (
      <>
        <Helmet><title>Админ-панель | 24ZXC</title><meta name="robots" content="noindex, nofollow" /></Helmet>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <AdminLoginDialog onLogin={signIn} open={showLogin} onOpenChange={setShowLogin} />
          {!showLogin && <Button onClick={() => setShowLogin(true)}>Войти как администратор</Button>}
        </div>
      </>
    );
  }

  const sectionTitles: Record<string, string> = {
    seo: "SEO-настройки",
    contacts: "Контакты",
    promotions: "Акции",
    clients: "Клиенты",
    contracts: "Договоры",
    files: "Файлы договоров",
    planner: "Планер",
    documents: "Конструктор документов",
    requisites: "Реквизиты компании",
    history: "История документов",
    nmo: "НМО Портал",
    frdo: "ФИС ФРДО",
    "ai-chat": "AI Ассистент",
    "site-settings": "Настройки сайта",
    "profile": "Профиль",
  };

  const siteSettingsTabs = [
    { id: "seo", label: "SEO", icon: Search },
    { id: "contacts", label: "Контакты", icon: Mail },
    { id: "promotions", label: "Акции", icon: Sparkles },
    { id: "requisites", label: "Реквизиты", icon: Building2 },
    { id: "history", label: "История", icon: History },
    { id: "nmo", label: "НМО Портал", icon: GraduationCap },
    { id: "frdo", label: "ФИС ФРДО", icon: FileCheck },
  ];

  const [siteSettingsSubTab, setSiteSettingsSubTab] = useState("seo");

  return (
    <>
      <Helmet><title>Админ-панель | 24ZXC</title><meta name="robots" content="noindex, nofollow" /></Helmet>
      <div className={cn("min-h-screen flex w-full", BG_PRESETS.find(p => p.id === bgPreset)?.style || "bg-background")}>
        <AdminSidebar activeSection={activeSection} onSectionChange={setActiveSection} onSignOut={signOut} />
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Header ABOVE banner */}
          <header className="h-14 flex items-center border-b border-border px-4 gap-3 sticky top-0 bg-background/95 backdrop-blur-sm z-20">
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <span className="text-xl font-bold text-primary select-none">Σ</span>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-foreground leading-tight truncate">СИНТАГМА</div>
                <div className="text-[10px] text-muted-foreground leading-tight">Администратор</div>
              </div>
              <Badge variant="outline" className="ml-2 text-[10px] px-1.5 py-0 h-5 border-primary/30 text-primary cursor-pointer hover:bg-primary/10 transition-colors hidden sm:inline-flex">
                <CreditCard className="h-3 w-3 mr-1" />Тариф
              </Badge>
            </div>
            <h1 className="text-base font-medium text-muted-foreground hidden md:block">{sectionTitles[activeSection] || activeSection}</h1>
            <div className="flex items-center gap-1">
              <NotificationsPanel onNavigate={setActiveSection} />
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => setIsDark(!isDark)}
              >
                {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 gap-1.5 text-xs"
                onClick={() => setActiveSection("profile")}
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Профиль</span>
              </Button>
            </div>
          </header>

          {/* Decorative banner */}
          <div className="h-32 relative overflow-hidden shrink-0 group">
            {bannerUrl ? (
              <img src={bannerUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <>
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/10 to-accent/10" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(var(--primary)/0.15),transparent_70%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_30%,hsl(var(--accent)/0.1),transparent_60%)]" />
              </>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
              <Button variant="secondary" size="sm" className="gap-1.5" onClick={() => bannerInputRef.current?.click()} disabled={bannerUploading}>
                {bannerUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                Изменить
              </Button>
              {bannerUrl && (
                <Button variant="secondary" size="sm" className="gap-1.5" onClick={resetBanner}>
                  <RotateCcw className="h-4 w-4" />Сбросить
                </Button>
              )}
            </div>
            <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
          </div>

          <main className="flex-1 p-3 sm:p-6 max-w-5xl pb-24">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSection}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
              
              {activeSection === "seo" && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2"><Search className="w-5 h-5" />SEO-настройки</CardTitle>
                      <CardDescription>Ключевые слова, заголовок и описание для поисковиков</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Ключевые слова</Label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {keywords.map((keyword) => (
                            <Badge key={keyword} variant="secondary" className="gap-1 pr-1">
                              {keyword}
                              <button onClick={() => removeKeyword(keyword)} className="ml-1 hover:text-destructive transition-colors"><X className="w-3 h-3" /></button>
                            </Badge>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Input value={newKeyword} onChange={(e) => setNewKeyword(e.target.value)} onKeyDown={handleKeywordKeyDown} placeholder="Добавить ключевое слово..." />
                          <Button variant="outline" size="icon" onClick={addKeyword} disabled={!newKeyword.trim()}><Plus className="w-4 h-4" /></Button>
                        </div>
                      </div>
                      <div className="space-y-2"><Label htmlFor="seo-title">Title</Label><Input id="seo-title" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} placeholder="Заголовок страницы" /></div>
                      <div className="space-y-2"><Label htmlFor="seo-desc">Description</Label><Textarea id="seo-desc" value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} placeholder="Описание для поисковиков" rows={3} /></div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2"><Share2 className="w-5 h-5" />Open Graph</CardTitle>
                      <CardDescription>Заголовок и описание для ссылок в соцсетях</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2"><Label htmlFor="og-title">OG Title</Label><Input id="og-title" value={ogTitle} onChange={(e) => setOgTitle(e.target.value)} placeholder="Заголовок для соцсетей" /></div>
                      <div className="space-y-2"><Label htmlFor="og-desc">OG Description</Label><Textarea id="og-desc" value={ogDescription} onChange={(e) => setOgDescription(e.target.value)} placeholder="Описание для соцсетей" rows={3} /></div>
                    </CardContent>
                  </Card>
                  <Button onClick={saveSeo} disabled={saving} className="w-full">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}Сохранить SEO-настройки
                  </Button>
                </div>
              )}

              {activeSection === "contacts" && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2"><Mail className="w-5 h-5" />Контактные данные</CardTitle>
                      <CardDescription>Email, телефон и Telegram</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2"><Label htmlFor="contact-email">Email</Label><Input id="contact-email" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="info@24zxc.ru" /></div>
                      <div className="space-y-2"><Label htmlFor="contact-phone">Телефон</Label><Input id="contact-phone" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+7 (999) 123-45-67" /></div>
                      <div className="space-y-2"><Label htmlFor="contact-tg">Telegram</Label><Input id="contact-tg" value={contactTelegram} onChange={(e) => setContactTelegram(e.target.value)} placeholder="@24zxc" /></div>
                    </CardContent>
                  </Card>
                  <Button onClick={saveContacts} disabled={saving} className="w-full">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}Сохранить контакты
                  </Button>
                </div>
              )}

              {activeSection === "promotions" && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader><CardTitle>{editingPromo ? "Редактировать акцию" : "Новая акция"}</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2"><Label>Заголовок</Label><Input value={promoTitle} onChange={(e) => setPromoTitle(e.target.value)} placeholder="Сайт + настройка рекламы" /></div>
                      <div className="space-y-2"><Label>Описание</Label><Textarea value={promoDesc} onChange={(e) => setPromoDesc(e.target.value)} placeholder="Описание акции..." rows={2} /></div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Цена</Label><Input value={promoPrice} onChange={(e) => setPromoPrice(e.target.value)} placeholder="10 000 ₽" /></div>
                        <div className="space-y-2"><Label>Старая цена</Label><Input value={promoOldPrice} onChange={(e) => setPromoOldPrice(e.target.value)} placeholder="15 000 ₽" /></div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Бейдж</Label><Input value={promoBadge} onChange={(e) => setPromoBadge(e.target.value)} placeholder="Акция" /></div>
                        <div className="space-y-2"><Label>Иконка (Lucide)</Label><Input value={promoIcon} onChange={(e) => setPromoIcon(e.target.value)} placeholder="Monitor, GraduationCap..." /></div>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={savePromo} disabled={saving} className="flex-1">
                          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                          {editingPromo ? "Обновить" : "Добавить"}
                        </Button>
                        {editingPromo && <Button variant="outline" onClick={resetPromoForm}>Отмена</Button>}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader><CardTitle>Текущие акции</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                      {promosLoading ? (
                        <div className="flex justify-center py-4"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
                      ) : promotions.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">Нет акций</p>
                      ) : (
                        promotions.map((p) => (
                          <div key={p.id} className="flex items-center justify-between p-3 border rounded-sm">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{p.title}</div>
                              <div className="text-sm text-muted-foreground">{p.price}</div>
                            </div>
                            <div className="flex items-center gap-3 ml-4">
                              <Switch checked={p.is_active} onCheckedChange={(v) => togglePromoActive.mutate({ id: p.id, is_active: v })} />
                              <Button variant="ghost" size="icon" onClick={() => startEditPromo(p)}><Save className="w-4 h-4" /></Button>
                              <Button variant="ghost" size="icon" onClick={() => deletePromo.mutate(p.id)} className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                            </div>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeSection === "clients" && <ClientsTab onNavigate={(section, params) => {
                setDocInitialClientName(params?.clientName || "");
                setDocInitialDocType(params?.docType || "");
                setActiveSection(section);
              }} />}
              {activeSection === "contracts" && <ContractsTab />}
              {activeSection === "files" && <FilesTab />}
              {activeSection === "planner" && <PlannerTab onCreateDocument={(task: any, docType?: string) => {
                setDocInitialContractId(task.contract_id || "");
                setDocInitialDocType(docType || "");
                setActiveSection("documents");
              }} />}
              {activeSection === "documents" && <DocumentsTab initialContractId={docInitialContractId} initialDocType={docInitialDocType} initialClientName={docInitialClientName} onMounted={() => { setDocInitialContractId(""); setDocInitialDocType(""); setDocInitialClientName(""); }} />}
              {activeSection === "requisites" && <RequisitesTab />}
              {activeSection === "history" && <HistoryTab />}
              {activeSection === "nmo" && <NmoTab />}
              {activeSection === "frdo" && <FrdoTab />}
              {activeSection === "ai-chat" && <InlineAIChat />}
                </motion.div>
              </AnimatePresence>
            </main>
            <Footer />
          </div>
        </div>
      
    </>
  );
};

export default Admin;

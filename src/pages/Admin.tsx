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
// dropdown removed — settings moved to dedicated sections
import ClientsTab from "@/components/admin/ClientsTab";
import ContractsTab from "@/components/admin/ContractsTab";
import OrganizationsTab from "@/components/admin/OrganizationsTab";
import PlannerTab from "@/components/admin/PlannerTab";
import DocumentsTab from "@/components/admin/DocumentsTab";
import RequisitesTab from "@/components/admin/RequisitesTab";

import HistoryTab from "@/components/admin/HistoryTab";
import TzTab from "@/components/admin/TzTab";
import NmoTab from "@/components/admin/NmoTab";
import FrdoTab from "@/components/admin/FrdoTab";
import SalesTab from "@/components/admin/SalesTab";
import NotificationsPanel from "@/components/admin/NotificationsPanel";
import InlineAIChat from "@/components/admin/InlineAIChat";
import { Save, X, Plus, Loader2, Search, Share2, Mail, Sparkles, Trash2, Building2, History, GraduationCap, FileCheck, Sun, Moon, Camera, RotateCcw, Palette, User, CreditCard, Check, Settings, ChevronLeft, ChevronRight, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { adminThemes, THEME_STORAGE_KEY, type AdminTheme } from "@/data/admin-themes";
import { ThemeAnimation } from "@/components/admin/ThemeAnimations";
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

const getInitialTheme = (): AdminTheme | null => {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved) return adminThemes.find(t => t.id === saved) || null;
  } catch {}
  return null;
};

const Admin = () => {
  const { user, isAdmin, isLoading: authLoading, signIn, signOut } = useAdminAuth();
  const { settings, isLoading: settingsLoading, isError: settingsError, updateMultiple } = useSiteSettings();
  const [showLogin, setShowLogin] = useState(false);
  const [activeSection, setActiveSection] = useState("sales");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sectionNonce, setSectionNonce] = useState(0);
  const handleSectionChange = (s: string) => {
    // Bump nonce to force remount even when clicking the already-active section,
    // so any open inline forms / modals reset (e.g. "Back to list").
    setSectionNonce((n) => n + 1);
    setActiveSection(s);
  };
  const [docInitialClientName, setDocInitialClientName] = useState("");
  const [docInitialContractId, setDocInitialContractId] = useState("");
  const [docInitialDocType, setDocInitialDocType] = useState<string>("");
  const [docInitialAutoSend, setDocInitialAutoSend] = useState(false);
  const [clientsInitialName, setClientsInitialName] = useState("");
  const queryClient = useQueryClient();
  const [profileSubTab, setProfileSubTab] = useState("appearance");

  // Theme state
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("admin-theme");
    return saved !== "light";
  });

  // Active theme
  const [activeTheme, setActiveTheme] = useState<AdminTheme | null>(getInitialTheme);

  // Banner state (custom override)
  const [bannerUrl, setBannerUrl] = useState(() => localStorage.getItem("admin-banner-url") || "");
  const [bannerUploading, setBannerUploading] = useState(false);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [bannerFit, setBannerFit] = useState<'cover' | 'contain' | 'tile' | 'stretch'>(() =>
    (localStorage.getItem("admin-banner-fit") as any) || "cover"
  );

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

  const handleThemeChange = (theme: AdminTheme | null) => {
    setActiveTheme(theme);
    if (theme) {
      localStorage.setItem(THEME_STORAGE_KEY, theme.id);
      // Clear custom banner when switching to theme
      setBannerUrl("");
      localStorage.removeItem("admin-banner-url");
    } else {
      localStorage.removeItem(THEME_STORAGE_KEY);
    }
    toast.success(theme ? `Тема «${theme.label}» установлена` : "Тема сброшена");
  };

  // Theme cycling via swipe / arrows on the banner
  const [themePillVisible, setThemePillVisible] = useState(false);
  const pillTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const cycleTheme = (direction: 1 | -1) => {
    const themesList: (AdminTheme | null)[] = [null, ...adminThemes];
    const currentIdx = activeTheme
      ? themesList.findIndex((t) => t?.id === activeTheme.id)
      : 0;
    const nextIdx = (currentIdx + direction + themesList.length) % themesList.length;
    handleThemeChange(themesList[nextIdx]);
    setThemePillVisible(true);
    if (pillTimeoutRef.current) clearTimeout(pillTimeoutRef.current);
    pillTimeoutRef.current = setTimeout(() => setThemePillVisible(false), 1500);
  };

  const handleBannerTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  };

  const handleBannerTouchEnd = (e: React.TouchEvent) => {
    const start = touchStartRef.current;
    if (!start) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    touchStartRef.current = null;
    if (Math.abs(dx) < 50 || Math.abs(dy) > Math.abs(dx)) return;
    cycleTheme(dx < 0 ? 1 : -1);
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

  // Listen for cross-tab navigation (e.g., "Сделать акт" from contracts)
  useEffect(() => {
    const consumePendingAct = () => {
      const raw = sessionStorage.getItem("pending_act");
      if (!raw) return false;
      try {
        const data = JSON.parse(raw);
        setDocInitialContractId(data.contractId || "");
        setDocInitialClientName(data.clientName || "");
        setDocInitialDocType("act");
        setDocInitialAutoSend(!!data.autoSend);
        setActiveSection("documents");
        sessionStorage.removeItem("pending_act");
        return true;
      } catch {
        sessionStorage.removeItem("pending_act");
        return false;
      }
    };
    consumePendingAct();
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail || {};
      if (detail.section === "documents") {
        consumePendingAct() || setActiveSection("documents");
      } else if (detail.section) {
        setActiveSection(detail.section);
      }
    };
    window.addEventListener("admin:navigate", handler);
    return () => window.removeEventListener("admin:navigate", handler);
  }, []);


   // Theme sync — forceLight themes override dark mode
  useEffect(() => {
    const forcedLight = activeTheme?.forceLight;
    if (forcedLight) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("admin-theme", "light");
    } else if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("admin-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("admin-theme", "light");
    }
  }, [isDark, activeTheme]);

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
    sales: "Продажи",
    seo: "SEO-настройки",
    contacts: "Контакты",
    promotions: "Акции",
    clients: "Клиенты",
    contracts: "Договоры",
    organizations: "Организации",
    planner: "Планер",
    documents: "Конструктор документов",
    reconciliation: "Акты сверки",
    tz: "Технические задания",
    requisites: "Реквизиты компании",
    history: "История документов",
    nmo: "НМО Портал",
    frdo: "ФИС ФРДО",
    "ai-chat": "AI Ассистент",
    "site-settings": "Настройки сайта",
    "profile": "Профиль",
  };

  const profileTabs = [
    { id: "appearance", label: "Оформление", icon: Palette },
    { id: "site-settings", label: "Настройки сайта", icon: Settings },
    { id: "history", label: "История", icon: History },
    { id: "nmo", label: "НМО Портал", icon: GraduationCap },
    { id: "frdo", label: "ФИС ФРДО", icon: FileCheck },
    { id: "tariff", label: "Тариф", icon: CreditCard },
  ];



  return (
    <>
      <Helmet><title>Админ-панель | 24ZXC</title><meta name="robots" content="noindex, nofollow" /></Helmet>
      <div
        className={cn("min-h-screen flex w-full transition-colors duration-500", activeTheme?.id !== 'turquoise' ? (activeTheme?.bgClass || "bg-background") : '')}
        style={activeTheme ? {
          "--theme-accent": activeTheme.accent,
          "--theme-accent-foreground": activeTheme.accentForeground,
          "--primary": activeTheme.accent,
          "--primary-foreground": activeTheme.accentForeground,
          ...(activeTheme.id === 'turquoise' ? {
            background: 'linear-gradient(to bottom, #d4f5ef 0%, #8fd8ca 12%, #4db8a8 25%, #2a8a80 40%, #1a5a58 55%, #0f3a3e 70%, #0c2a30 85%, #050e12 100%)',
            "--foreground": "180 10% 10%",
            "--muted-foreground": "180 8% 25%",
          } : {}),
        } as React.CSSProperties : undefined}
      >
        {activeTheme && <ThemeAnimation animation={activeTheme.animation} />}
        
        {/* Atmospheric banner bleed — decorative fragments from banner image */}
        {activeTheme && (
          <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            {/* Bottom-right corner — main bleed (blurred layer) */}
            <img
              src={bannerUrl || activeTheme.bannerUrl}
              alt=""
              className="absolute -bottom-8 -right-8 w-[55%] h-[50%] object-cover"
              style={{
                opacity: activeTheme.atmosphereOpacity ?? 0.18,
                filter: `blur(${activeTheme.atmosphereBlur || '20px'}) saturate(1.4)`,
                maskImage: 'radial-gradient(ellipse at 100% 100%, black 20%, transparent 75%)',
                WebkitMaskImage: 'radial-gradient(ellipse at 100% 100%, black 20%, transparent 75%)',
                objectPosition: activeTheme.bannerPosition || 'center',
              }}
            />
            {/* Bottom-right corner — sharp layer (clear in corner, fading out) */}
            {activeTheme.atmosphereSharp && (() => {
              const tid = activeTheme.id;
              const useLinearMask = tid === 'minimalism' || tid === 'sunset';
              const isFreshness = tid === 'freshness';
              const isTurquoise = tid === 'turquoise';
              let sharpMask: string;
              let sharpSize: string;
              let sharpPos: string;
              let sharpOpacity: number;

              if (isFreshness) {
                sharpMask = 'linear-gradient(to top, black 10%, transparent 35%)';
                sharpSize = 'w-full h-[50%]';
                sharpPos = 'absolute bottom-0 left-0';
                sharpOpacity = 0.4;
              } else if (isTurquoise) {
                sharpMask = 'linear-gradient(to top, black 20%, transparent 55%)';
                sharpSize = 'w-full h-[60%]';
                sharpPos = 'absolute bottom-0 left-0';
                sharpOpacity = 0.35;
              } else if (useLinearMask) {
                sharpMask = 'linear-gradient(to top, black 30%, transparent 60%)';
                sharpSize = 'w-full h-[70%]';
                sharpPos = 'absolute bottom-0 left-0';
                sharpOpacity = 0.35;
              } else {
                sharpMask = 'radial-gradient(ellipse at 100% 100%, black 15%, transparent 55%)';
                sharpSize = 'w-[55%] h-[50%]';
                sharpPos = 'absolute -bottom-8 -right-8';
                sharpOpacity = 0.3;
              }
              return (
                <img
                  src={bannerUrl || activeTheme.bannerUrl}
                  alt=""
                  className={`${sharpPos} ${sharpSize} object-cover`}
                  style={{
                    opacity: sharpOpacity,
                    filter: 'blur(0px) saturate(1.6)',
                    maskImage: sharpMask,
                    WebkitMaskImage: sharpMask,
                    objectPosition: activeTheme.bannerPosition || 'center',
                  }}
                />
              );
            })()}
            {/* Turquoise — extra teal glow overlay */}
            {activeTheme.id === 'turquoise' && (
              <>
                <div className="absolute inset-0" style={{
                  background: 'radial-gradient(ellipse at 50% 80%, rgba(45,212,191,0.12) 0%, transparent 60%)',
                }} />
                <div className="absolute bottom-0 left-0 w-full h-[40%]" style={{
                  background: 'linear-gradient(to top, rgba(20,184,166,0.08) 0%, transparent 100%)',
                }} />
              </>
            )}
            {/* Bottom-left corner — secondary bleed */}
            <img
              src={bannerUrl || activeTheme.bannerUrl}
              alt=""
              className="absolute -bottom-10 -left-10 w-[45%] h-[45%] object-cover opacity-[0.14]"
              style={{
                filter: 'blur(25px) saturate(1.3)',
                maskImage: 'radial-gradient(ellipse at 0% 100%, black 15%, transparent 70%)',
                WebkitMaskImage: 'radial-gradient(ellipse at 0% 100%, black 15%, transparent 70%)',
                objectPosition: activeTheme.bannerPosition || 'center',
              }}
            />
            {/* Right edge mid — side glow */}
            <img
              src={bannerUrl || activeTheme.bannerUrl}
              alt=""
              className="absolute top-1/4 -right-4 w-[30%] h-[40%] object-cover"
              style={{
                opacity: activeTheme.id === 'newyork' ? 0.42 : 0.10,
                filter: activeTheme.id === 'newyork' ? 'saturate(1.5)' : 'blur(30px) saturate(1.2)',
                maskImage: activeTheme.id === 'newyork'
                  ? 'linear-gradient(to right, transparent 0%, black 30%, black 100%), radial-gradient(ellipse at 100% 50%, black 30%, transparent 80%)'
                  : 'radial-gradient(ellipse at 100% 50%, black 10%, transparent 65%)',
                maskComposite: 'intersect' as any,
                WebkitMaskImage: activeTheme.id === 'newyork'
                  ? 'linear-gradient(to right, transparent 0%, black 30%, black 100%), radial-gradient(ellipse at 100% 50%, black 30%, transparent 80%)'
                  : 'radial-gradient(ellipse at 100% 50%, black 10%, transparent 65%)',
                WebkitMaskComposite: 'source-in' as any,
                objectPosition: activeTheme.bannerPosition || 'center',
              }}
            />
            {/* Footer zone — wide horizontal strip */}
            <img
              src={bannerUrl || activeTheme.bannerUrl}
              alt=""
              className="absolute -bottom-4 left-[10%] w-[80%] h-[25%] object-cover opacity-[0.15]"
              style={{
                filter: 'blur(20px) saturate(1.3)',
                maskImage: 'linear-gradient(to top, black 10%, transparent 85%)',
                WebkitMaskImage: 'linear-gradient(to top, black 10%, transparent 85%)',
                objectPosition: activeTheme.bannerPosition || 'center',
              }}
            />
          </div>
        )}

        {/* Desktop sidebar (hidden on mobile) */}
        <div className="hidden md:block">
          <AdminSidebar activeSection={activeSection} onSectionChange={handleSectionChange} onSignOut={signOut} themeClass={activeTheme?.sidebarClass} />
        </div>

        {/* Mobile sidebar inside Sheet */}
        <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
          <SheetContent side="left" className="p-0 w-16 border-r-0 [&>button]:hidden">
            <AdminSidebar
              activeSection={activeSection}
              onSectionChange={(s) => { handleSectionChange(s); setMobileSidebarOpen(false); }}
              onSignOut={() => { signOut(); setMobileSidebarOpen(false); }}
              themeClass={activeTheme?.sidebarClass}
              inSheet
            />
          </SheetContent>
        </Sheet>
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Header ABOVE banner */}
          <header className={cn("h-14 flex items-center border-b px-3 sm:px-4 gap-2 sm:gap-3 sticky top-0 backdrop-blur-sm z-20 transition-colors duration-500", activeTheme?.headerClass || "border-border bg-background/95")}>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 md:hidden -ml-1 hover:text-primary hover:bg-primary/10"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Открыть меню"
            >
              <Menu className="h-5 w-5" />
            </Button>
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
                className="h-9 w-9 hover:text-primary hover:bg-primary/10"
                onClick={() => setIsDark(!isDark)}
              >
                {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 gap-1.5 text-xs hover:text-primary hover:bg-primary/10"
                onClick={() => setActiveSection("profile")}
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Профиль</span>
              </Button>
            </div>
          </header>

          {/* Decorative banner */}
          <div
            className="h-24 sm:h-32 relative overflow-hidden shrink-0 group select-none"
            onTouchStart={handleBannerTouchStart}
            onTouchEnd={handleBannerTouchEnd}
          >
            {bannerUrl ? (
              bannerFit === 'tile' ? (
                <div className="absolute inset-0" style={{ backgroundImage: `url(${bannerUrl})`, backgroundRepeat: 'repeat', backgroundSize: 'auto' }} />
              ) : (
                <img src={bannerUrl} alt="" className="absolute inset-0 w-full h-full" style={{ objectFit: bannerFit === 'stretch' ? 'fill' : bannerFit, backgroundColor: bannerFit === 'contain' ? '#000' : undefined }} />
              )
            ) : activeTheme ? (
              <img src={activeTheme.bannerUrl} alt="" className="absolute inset-0 w-full h-full object-cover" style={{ objectPosition: activeTheme.bannerPosition || 'center' }} />
            ) : (
              <>
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/10 to-accent/10" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(var(--primary)/0.15),transparent_70%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_30%,hsl(var(--accent)/0.1),transparent_60%)]" />
              </>
            )}

            {/* Theme cycle arrows — always visible, above hover overlay */}
            <button
              type="button"
              aria-label="Предыдущая тема"
              onClick={(e) => { e.stopPropagation(); cycleTheme(-1); }}
              className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 z-30 h-10 w-10 sm:h-11 sm:w-11 flex items-center justify-center rounded-full bg-black/55 hover:bg-black/75 text-white backdrop-blur-md ring-1 ring-white/30 shadow-lg transition-colors active:scale-95"
            >
              <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.5} />
            </button>
            <button
              type="button"
              aria-label="Следующая тема"
              onClick={(e) => { e.stopPropagation(); cycleTheme(1); }}
              className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 z-30 h-10 w-10 sm:h-11 sm:w-11 flex items-center justify-center rounded-full bg-black/55 hover:bg-black/75 text-white backdrop-blur-md ring-1 ring-white/30 shadow-lg transition-colors active:scale-95"
            >
              <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.5} />
            </button>

            {/* Theme name pill (transient feedback) */}
            <div
              className={cn(
                "absolute bottom-2 left-1/2 -translate-x-1/2 z-30 bg-black/65 backdrop-blur text-white text-xs px-3 py-1 rounded-full pointer-events-none transition-opacity duration-300 ring-1 ring-white/20",
                themePillVisible ? "opacity-100" : "opacity-0"
              )}
            >
              {activeTheme ? `${activeTheme.emoji} ${activeTheme.label}` : "✨ По умолчанию"}
            </div>

            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 z-20">
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
                  key={`${activeSection}-${sectionNonce}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >

              {activeSection === "profile" && (
                <div className="flex gap-6">
                  {/* Vertical tabs */}
                  <nav className="w-44 shrink-0 space-y-1">
                    {profileTabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setProfileSubTab(tab.id)}
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left",
                          profileSubTab === tab.id
                            ? "bg-primary/15 text-primary font-medium"
                            : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                        )}
                      >
                        <tab.icon className="h-4 w-4 shrink-0" />
                        {tab.label}
                      </button>
                    ))}
                  </nav>

                  {/* Content */}
                  <div className="flex-1 min-w-0 space-y-6">
                    {profileSubTab === "appearance" && (
                      <>
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5" />Оформление</CardTitle>
                            <CardDescription>Выберите тему — она изменит фон, баннер, акценты и анимации</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-6">
                            {/* Light/Dark toggle — hidden when theme forces light */}
                            {!activeTheme?.forceLight && (
                            <div className="space-y-3">
                              <Label className="flex items-center gap-2">{isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}Режим</Label>
                              <div className="flex items-center gap-3">
                                <Button variant={isDark ? "outline" : "default"} size="sm" onClick={() => setIsDark(false)}><Sun className="h-4 w-4 mr-1.5" />Светлая</Button>
                                <Button variant={isDark ? "default" : "outline"} size="sm" onClick={() => setIsDark(true)}><Moon className="h-4 w-4 mr-1.5" />Тёмная</Button>
                              </div>
                            </div>
                            )}

                            {/* Theme grid */}
                            <div className="space-y-3">
                              <Label className="flex items-center gap-2"><Sparkles className="h-4 w-4" />Готовые темы</Label>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {/* Reset to default */}
                                <button
                                  onClick={() => handleThemeChange(null)}
                                  className={cn(
                                    "relative h-24 rounded-xl border-2 overflow-hidden transition-all group/theme",
                                    !activeTheme ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/50"
                                  )}
                                >
                                  <div className="absolute inset-0 bg-gradient-to-br from-background via-muted/30 to-background" />
                                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                                    {!activeTheme && <Check className="h-5 w-5 text-primary" />}
                                    <span className="text-xs font-medium text-foreground">По умолчанию</span>
                                  </div>
                                </button>
                                {adminThemes.map(theme => (
                                  <button
                                    key={theme.id}
                                    onClick={() => handleThemeChange(theme)}
                                    className={cn(
                                      "relative h-24 rounded-xl border-2 overflow-hidden transition-all group/theme",
                                      activeTheme?.id === theme.id ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/50"
                                    )}
                                  >
                                    <img src={theme.bannerUrl} alt={theme.label} className="absolute inset-0 w-full h-full object-cover" style={{ objectPosition: theme.previewPosition || 'center' }} loading="lazy" />
                                    <div className="absolute inset-0 bg-black/40 group-hover/theme:bg-black/50 transition-colors flex flex-col items-center justify-center gap-1">
                                      {activeTheme?.id === theme.id && <Check className="h-5 w-5 text-white" />}
                                      <span className="text-xs font-medium text-white">{theme.emoji} {theme.label}</span>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Custom banner upload */}
                            <div className="space-y-3">
                              <Label className="flex items-center gap-2"><Camera className="h-4 w-4" />Свой баннер</Label>
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => bannerInputRef.current?.click()} disabled={bannerUploading}>
                                  {bannerUploading ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Camera className="h-4 w-4 mr-1.5" />}
                                  Загрузить
                                </Button>
                                {bannerUrl && (
                                  <Button variant="outline" size="sm" onClick={resetBanner}>
                                    <RotateCcw className="h-4 w-4 mr-1.5" />Сбросить
                                  </Button>
                                )}
                              </div>
                              {bannerUrl && (
                                <>
                                  <img src={bannerUrl} alt="Текущий баннер" className="h-20 w-full object-cover rounded-md border" />
                                  <div className="flex gap-1.5 flex-wrap">
                                    {([
                                      { value: 'cover' as const, label: 'Заполнить' },
                                      { value: 'contain' as const, label: 'Вписать' },
                                      { value: 'tile' as const, label: 'Замостить' },
                                      { value: 'stretch' as const, label: 'Растянуть' },
                                    ]).map(opt => (
                                      <Button
                                        key={opt.value}
                                        variant={bannerFit === opt.value ? "default" : "outline"}
                                        size="sm"
                                        className="text-xs h-7"
                                        onClick={() => {
                                          setBannerFit(opt.value);
                                          localStorage.setItem("admin-banner-fit", opt.value);
                                        }}
                                      >
                                        {opt.label}
                                      </Button>
                                    ))}
                                  </div>
                                </>
                              )}
                              <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
                            </div>
                          </CardContent>
                        </Card>
                      </>
                    )}

                    {profileSubTab === "site-settings" && (
                      <div className="space-y-8">
                        {/* SEO */}
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

                        {/* Контакты */}
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

                        {/* Акции */}
                        <Card>
                          <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5" />{editingPromo ? "Редактировать акцию" : "Новая акция"}</CardTitle></CardHeader>
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

                        {/* Реквизиты */}
                        <RequisitesTab />
                      </div>
                    )}

                    {profileSubTab === "history" && <HistoryTab />}
                    {profileSubTab === "nmo" && <NmoTab />}
                    {profileSubTab === "frdo" && <FrdoTab />}

                    {profileSubTab === "tariff" && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" />Тариф</CardTitle>
                          <CardDescription>Текущий план и возможности</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border">
                            <Badge variant="outline" className="text-sm px-3 py-1 border-primary/30 text-primary">Бесплатный</Badge>
                            <span className="text-sm text-muted-foreground">Базовый функционал CRM</span>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              )}

              {activeSection === "clients" && <ClientsTab
                initialClientName={clientsInitialName}
                onConsumed={() => setClientsInitialName("")}
                onNavigate={(section, params) => {
                  setDocInitialClientName(params?.clientName || "");
                  setDocInitialDocType(params?.docType || "");
                  setActiveSection(section);
                }}
              />}
              {activeSection === "sales" && <SalesTab />}
              {activeSection === "contracts" && <ContractsTab onOpenClient={(name) => {
                setClientsInitialName(name);
                handleSectionChange("clients");
              }} />}
              {activeSection === "organizations" && <OrganizationsTab />}
              {activeSection === "planner" && <PlannerTab onCreateDocument={(task: any, docType?: string) => {
                setDocInitialContractId(task.contract_id || "");
                setDocInitialDocType(docType || "");
                setActiveSection("documents");
              }} />}
              {activeSection === "documents" && <DocumentsTab initialContractId={docInitialContractId} initialDocType={docInitialDocType} initialClientName={docInitialClientName} initialAutoSend={docInitialAutoSend} onMounted={() => { setDocInitialContractId(""); setDocInitialDocType(""); setDocInitialClientName(""); setDocInitialAutoSend(false); }} />}
              {activeSection === "reconciliation" && <DocumentsTab key="reconciliation" forceDocType="reconciliation" hideTypeSelector initialClientName={docInitialClientName} onMounted={() => { setDocInitialClientName(""); }} />}
              {activeSection === "tz" && <TzTab />}
              {activeSection === "ai-chat" && <InlineAIChat />}
                </motion.div>
              </AnimatePresence>
            </main>
            <div className={activeTheme ? "relative z-10" : ""}>
              <Footer />
            </div>
          </div>
        </div>
      
    </>
  );
};

export default Admin;

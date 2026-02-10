import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { AdminLoginDialog } from "@/components/portfolio/AdminLoginDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Save, X, Plus, LogOut, Loader2, Search, Share2, Mail } from "lucide-react";

const Admin = () => {
  const { user, isAdmin, isLoading: authLoading, signIn, signOut } = useAdminAuth();
  const { settings, isLoading: settingsLoading, updateMultiple } = useSiteSettings();
  const [showLogin, setShowLogin] = useState(false);

  // SEO state
  const [keywords, setKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");

  // OG state
  const [ogTitle, setOgTitle] = useState("");
  const [ogDescription, setOgDescription] = useState("");

  // Contact state
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactTelegram, setContactTelegram] = useState("");

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      setShowLogin(true);
    }
  }, [authLoading, isAdmin]);

  useEffect(() => {
    if (settings.seo_keywords) {
      setKeywords(settings.seo_keywords.split(",").map((k: string) => k.trim()).filter(Boolean));
    }
    if (settings.seo_title) setSeoTitle(settings.seo_title);
    if (settings.seo_description) setSeoDescription(settings.seo_description);
    if (settings.og_title) setOgTitle(settings.og_title);
    if (settings.og_description) setOgDescription(settings.og_description);
    if (settings.contact_email) setContactEmail(settings.contact_email);
    if (settings.contact_phone) setContactPhone(settings.contact_phone);
    if (settings.contact_telegram) setContactTelegram(settings.contact_telegram);
  }, [settings]);

  const addKeyword = () => {
    const word = newKeyword.trim();
    if (word && !keywords.includes(word)) {
      setKeywords([...keywords, word]);
      setNewKeyword("");
    }
  };

  const removeKeyword = (keyword: string) => {
    setKeywords(keywords.filter((k) => k !== keyword));
  };

  const handleKeywordKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addKeyword();
    }
  };

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
    } catch {
      toast.error("Ошибка сохранения");
    }
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
    } catch {
      toast.error("Ошибка сохранения");
    }
    setSaving(false);
  };

  if (authLoading || settingsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <>
        <Helmet>
          <title>Админ-панель | 24ZXC</title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <AdminLoginDialog
            onLogin={signIn}
            open={showLogin}
            onOpenChange={setShowLogin}
          />
          {!showLogin && (
            <Button onClick={() => setShowLogin(true)}>Войти как администратор</Button>
          )}
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Админ-панель | 24ZXC</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-foreground">Настройки сайта</h1>
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Выйти
            </Button>
          </div>

          <Tabs defaultValue="seo" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="seo" className="gap-2">
                <Search className="w-4 h-4" />
                SEO и OG
              </TabsTrigger>
              <TabsTrigger value="contacts" className="gap-2">
                <Mail className="w-4 h-4" />
                Контакты
              </TabsTrigger>
            </TabsList>

            <TabsContent value="seo" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="w-5 h-5" />
                    SEO-настройки
                  </CardTitle>
                  <CardDescription>Ключевые слова, заголовок и описание для поисковиков</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Ключевые слова</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {keywords.map((keyword) => (
                        <Badge key={keyword} variant="secondary" className="gap-1 pr-1">
                          {keyword}
                          <button
                            onClick={() => removeKeyword(keyword)}
                            className="ml-1 hover:text-destructive transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={newKeyword}
                        onChange={(e) => setNewKeyword(e.target.value)}
                        onKeyDown={handleKeywordKeyDown}
                        placeholder="Добавить ключевое слово..."
                      />
                      <Button variant="outline" size="icon" onClick={addKeyword} disabled={!newKeyword.trim()}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="seo-title">Title</Label>
                    <Input id="seo-title" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} placeholder="Заголовок страницы" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="seo-desc">Description</Label>
                    <Textarea id="seo-desc" value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} placeholder="Описание для поисковиков" rows={3} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Share2 className="w-5 h-5" />
                    Open Graph
                  </CardTitle>
                  <CardDescription>Заголовок и описание для ссылок в соцсетях</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="og-title">OG Title</Label>
                    <Input id="og-title" value={ogTitle} onChange={(e) => setOgTitle(e.target.value)} placeholder="Заголовок для соцсетей" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="og-desc">OG Description</Label>
                    <Textarea id="og-desc" value={ogDescription} onChange={(e) => setOgDescription(e.target.value)} placeholder="Описание для соцсетей" rows={3} />
                  </div>
                </CardContent>
              </Card>

              <Button onClick={saveSeo} disabled={saving} className="w-full">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Сохранить SEO-настройки
              </Button>
            </TabsContent>

            <TabsContent value="contacts">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Контактные данные
                  </CardTitle>
                  <CardDescription>Email, телефон и Telegram — используются в футере и на странице контактов</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact-email">Email</Label>
                    <Input id="contact-email" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="info@24zxc.ru" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-phone">Телефон</Label>
                    <Input id="contact-phone" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+7 (999) 123-45-67" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-tg">Telegram</Label>
                    <Input id="contact-tg" value={contactTelegram} onChange={(e) => setContactTelegram(e.target.value)} placeholder="@24zxc" />
                  </div>
                </CardContent>
              </Card>

              <Button onClick={saveContacts} disabled={saving} className="w-full mt-6">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Сохранить контакты
              </Button>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default Admin;

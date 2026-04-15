import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Save, Plus, Trash2, Loader2, ExternalLink, Image } from "lucide-react";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  image: string;
}

interface LandingConfig {
  heroTitle?: string;
  heroSubtitle?: string;
  heroImage?: string;
  marqueeText?: string;
  accentColor?: string;
  products?: Product[];
  contactPhone?: string;
  contactEmail?: string;
  contactTelegram?: string;
}

interface Props {
  organizationId: string;
  orgName: string;
  landingSlug: string | null;
  landingConfig: LandingConfig;
  onUpdate: () => void;
}

const OrgLandingEditor = ({ organizationId, orgName, landingSlug, landingConfig, onUpdate }: Props) => {
  const [config, setConfig] = useState<LandingConfig>(landingConfig || {});
  const [slug, setSlug] = useState(landingSlug || "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const heroInputRef = useRef<HTMLInputElement>(null);

  const updateField = (key: keyof LandingConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const addProduct = () => {
    const products = config.products || [];
    updateField("products", [...products, { id: crypto.randomUUID(), name: "", description: "", price: "", image: "" }]);
  };

  const updateProduct = (id: string, field: keyof Product, value: string) => {
    const products = (config.products || []).map(p => p.id === id ? { ...p, [field]: value } : p);
    updateField("products", products);
  };

  const removeProduct = (id: string) => {
    updateField("products", (config.products || []).filter(p => p.id !== id));
  };

  const handleHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${organizationId}/landing_${Date.now()}_${safeName}`;
      const { error } = await supabase.storage.from("org-files").upload(path, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("org-files").getPublicUrl(path);
      updateField("heroImage", publicUrl);
      toast.success("Изображение загружено");
    } catch { toast.error("Ошибка загрузки"); }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!slug.trim()) return toast.error("Укажите адрес лендинга");
    setSaving(true);
    try {
      const { error } = await supabase
        .from("organizations")
        .update({ landing_slug: slug.trim().toLowerCase(), landing_config: config as any })
        .eq("id", organizationId);
      if (error) throw error;
      toast.success("Лендинг сохранён");
      onUpdate();
    } catch (e: any) {
      toast.error(e.message?.includes("unique") ? "Этот адрес уже занят" : "Ошибка сохранения");
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6 pb-20">
      <h2 className="text-lg font-semibold">Мой лендинг</h2>

      <Card>
        <CardHeader>
          <CardTitle>Основные настройки</CardTitle>
          <CardDescription>Адрес и hero-секция вашего лендинга</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Адрес лендинга</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">/shop/</span>
              <Input value={slug} onChange={e => setSlug(e.target.value)} placeholder="my-company" className="flex-1" />
            </div>
            {slug && (
              <a href={`/shop/${slug}`} target="_blank" rel="noopener noreferrer" className="text-xs text-primary flex items-center gap-1 hover:underline">
                <ExternalLink className="h-3 w-3" />Предпросмотр
              </a>
            )}
          </div>

          <div className="space-y-2">
            <Label>Заголовок</Label>
            <Input value={config.heroTitle || ""} onChange={e => updateField("heroTitle", e.target.value)} placeholder={orgName} />
          </div>

          <div className="space-y-2">
            <Label>Подзаголовок</Label>
            <Textarea value={config.heroSubtitle || ""} onChange={e => updateField("heroSubtitle", e.target.value)} placeholder="Описание вашего бизнеса..." rows={2} />
          </div>

          <div className="space-y-2">
            <Label>Бегущая строка</Label>
            <Input value={config.marqueeText || ""} onChange={e => updateField("marqueeText", e.target.value)} placeholder="качество ✦ стиль ✦ надёжность" />
          </div>

          <div className="space-y-2">
            <Label>Фоновое изображение</Label>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => heroInputRef.current?.click()} disabled={uploading}>
                {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Image className="h-4 w-4 mr-1.5" />}Загрузить
              </Button>
            </div>
            {config.heroImage && <img src={config.heroImage} alt="" className="h-24 w-full object-cover rounded-md border" />}
            <input ref={heroInputRef} type="file" accept="image/*" className="hidden" onChange={handleHeroUpload} />
          </div>

          <div className="space-y-2">
            <Label>Акцентный цвет (HEX)</Label>
            <div className="flex gap-2 items-center">
              <input type="color" value={config.accentColor || "#d4be37"} onChange={e => updateField("accentColor", e.target.value)} className="w-10 h-10 rounded border cursor-pointer" />
              <Input value={config.accentColor || "#d4be37"} onChange={e => updateField("accentColor", e.target.value)} className="w-32" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Товары</CardTitle>
          <CardDescription>Карточки товаров для лендинга</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(config.products || []).map((product, idx) => (
            <div key={product.id} className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Товар {idx + 1}</span>
                <Button variant="ghost" size="icon" onClick={() => removeProduct(product.id)} className="text-destructive h-8 w-8"><Trash2 className="h-4 w-4" /></Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-xs">Название</Label><Input value={product.name} onChange={e => updateProduct(product.id, "name", e.target.value)} /></div>
                <div className="space-y-1"><Label className="text-xs">Цена</Label><Input value={product.price} onChange={e => updateProduct(product.id, "price", e.target.value)} /></div>
              </div>
              <div className="space-y-1"><Label className="text-xs">Описание</Label><Input value={product.description} onChange={e => updateProduct(product.id, "description", e.target.value)} /></div>
              <div className="space-y-1"><Label className="text-xs">URL изображения</Label><Input value={product.image} onChange={e => updateProduct(product.id, "image", e.target.value)} placeholder="https://..." /></div>
            </div>
          ))}
          <Button variant="outline" className="w-full gap-1.5" onClick={addProduct}><Plus className="h-4 w-4" />Добавить товар</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Контакты</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><Label>Телефон</Label><Input value={config.contactPhone || ""} onChange={e => updateField("contactPhone", e.target.value)} /></div>
          <div className="space-y-2"><Label>Email</Label><Input value={config.contactEmail || ""} onChange={e => updateField("contactEmail", e.target.value)} /></div>
          <div className="space-y-2"><Label>Telegram</Label><Input value={config.contactTelegram || ""} onChange={e => updateField("contactTelegram", e.target.value)} /></div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full" size="lg">
        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
        Сохранить и опубликовать
      </Button>
    </div>
  );
};

export default OrgLandingEditor;

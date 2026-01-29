import { useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCategories } from "@/hooks/use-categories";
import { useCreateListing } from "@/hooks/use-listings";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Upload, X, Image as ImageIcon } from "lucide-react";

const listingSchema = z.object({
  title: z.string().min(5, "Минимум 5 символов").max(100, "Максимум 100 символов"),
  description: z.string().max(5000, "Максимум 5000 символов").optional(),
  category_id: z.string().min(1, "Выберите категорию"),
  price: z.string().optional(),
  price_type: z.enum(["fixed", "negotiable", "free"]),
  location: z.string().max(100).optional(),
  contact_phone: z.string().max(20).optional(),
  contact_email: z.string().email("Введите корректный email").optional().or(z.literal("")),
  contact_telegram: z.string().max(50).optional(),
});

type ListingFormData = z.infer<typeof listingSchema>;

export default function NewListing() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: categories } = useCategories();
  const createListing = useCreateListing();
  const { toast } = useToast();
  
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const defaultCategoryId = searchParams.get("category") || "";

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ListingFormData>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      price_type: "negotiable",
      category_id: defaultCategoryId,
    },
  });

  const priceType = watch("price_type");

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > 5) {
      toast({
        title: "Ограничение",
        description: "Максимум 5 изображений",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Необходимо войти в систему");

      const newImages: string[] = [];

      for (const file of Array.from(files)) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${userData.user.id}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("listing-images")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("listing-images")
          .getPublicUrl(fileName);

        newImages.push(urlData.publicUrl);
      }

      setImages((prev) => [...prev, ...newImages]);
    } catch (error: any) {
      toast({
        title: "Ошибка загрузки",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  }, [images.length, toast]);

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ListingFormData) => {
    try {
      const listingData = {
        title: data.title,
        category_id: data.category_id,
        description: data.description,
        price: data.price ? parseFloat(data.price) : undefined,
        price_type: data.price_type,
        location: data.location,
        contact_phone: data.contact_phone,
        contact_email: data.contact_email || undefined,
        contact_telegram: data.contact_telegram,
        images,
      };

      await createListing.mutateAsync(listingData);
      
      toast({
        title: "Объявление создано!",
        description: "Ваше объявление успешно опубликовано",
      });
      
      navigate("/dashboard/listings");
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Новое объявление</h1>
        <p className="text-muted-foreground mt-1">
          Заполните информацию о вашей услуге или товаре
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Category */}
        <Card>
          <CardHeader>
            <CardTitle>Категория</CardTitle>
          </CardHeader>
          <CardContent>
            <Select 
              value={watch("category_id")} 
              onValueChange={(val) => setValue("category_id", val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите категорию" />
              </SelectTrigger>
              <SelectContent>
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category_id && (
              <p className="text-sm text-destructive mt-1">{errors.category_id.message}</p>
            )}
          </CardContent>
        </Card>

        {/* Basic info */}
        <Card>
          <CardHeader>
            <CardTitle>Основная информация</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Заголовок *</Label>
              <Input
                id="title"
                placeholder="Например: Разработка сайта под ключ"
                {...register("title")}
              />
              {errors.title && (
                <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description"
                placeholder="Подробное описание вашего предложения..."
                rows={6}
                {...register("description")}
              />
              {errors.description && (
                <p className="text-sm text-destructive mt-1">{errors.description.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Price */}
        <Card>
          <CardHeader>
            <CardTitle>Цена</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Тип цены</Label>
              <Select 
                value={priceType} 
                onValueChange={(val: any) => setValue("price_type", val)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Фиксированная</SelectItem>
                  <SelectItem value="negotiable">Договорная</SelectItem>
                  <SelectItem value="free">Бесплатно</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {priceType !== "free" && (
              <div>
                <Label htmlFor="price">Цена (₽)</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="0"
                  {...register("price")}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Images */}
        <Card>
          <CardHeader>
            <CardTitle>Фотографии</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {images.map((img, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              
              {images.length < 5 && (
                <label className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                  {uploading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                      <span className="text-xs text-muted-foreground">Загрузить</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Максимум 5 изображений. Поддерживаются форматы JPG, PNG, WebP.
            </p>
          </CardContent>
        </Card>

        {/* Location & Contacts */}
        <Card>
          <CardHeader>
            <CardTitle>Местоположение и контакты</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="location">Город / Регион</Label>
              <Input
                id="location"
                placeholder="Москва"
                {...register("location")}
              />
            </div>

            <div>
              <Label htmlFor="contact_phone">Телефон</Label>
              <Input
                id="contact_phone"
                type="tel"
                placeholder="+7 (999) 123-45-67"
                {...register("contact_phone")}
              />
            </div>

            <div>
              <Label htmlFor="contact_email">Email</Label>
              <Input
                id="contact_email"
                type="email"
                placeholder="your@email.com"
                {...register("contact_email")}
              />
              {errors.contact_email && (
                <p className="text-sm text-destructive mt-1">{errors.contact_email.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="contact_telegram">Telegram</Label>
              <Input
                id="contact_telegram"
                placeholder="@username"
                {...register("contact_telegram")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex gap-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => navigate(-1)}
          >
            Отмена
          </Button>
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Публикация...
              </>
            ) : (
              "Опубликовать объявление"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

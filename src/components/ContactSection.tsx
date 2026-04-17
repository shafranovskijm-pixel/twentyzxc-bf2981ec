import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Clock, Send, MapPin, Diamond, Loader2, CheckCircle, KeyRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useInView } from "@/hooks/use-in-view";
import { useInventory } from "@/contexts/InventoryContext";
import { useAchievements } from "@/contexts/AchievementsContext";
import { TreasureChest3D } from "@/components/game/TreasureChest3D";
import { sendToTelegram } from "@/lib/telegram";
import { motion, AnimatePresence } from "framer-motion";
import pirateBeachBg from "@/assets/pirate-beach-bg.jpg";

const contactSchema = z.object({
  name: z.string().trim().min(1, "Введите ваше имя").max(100, "Имя слишком длинное"),
  email: z.string().trim().email("Введите корректный email").max(255, "Email слишком длинный"),
  phone: z.string().trim().optional(),
  message: z.string().trim().min(1, "Введите сообщение").max(2000, "Сообщение слишком длинное"),
  service: z.string().optional(),
});

type ContactFormData = z.infer<typeof contactSchema>;

const serviceKeys: Record<string, { label: string; message: string }> = {
  landing: { label: "Лендинг", message: "Интересует разработка лендинга. " },
  corporate: { label: "Корпоративный сайт", message: "Интересует разработка корпоративного сайта. " },
  ecommerce: { label: "Интернет-магазин", message: "Интересует разработка интернет-магазина. " },
  webapp: { label: "Веб-приложение", message: "Интересует разработка веб-приложения. " },
  ads: { label: "Реклама", message: "Интересует настройка рекламы. " },
  license: { label: "Лицензирование", message: "Интересует получение образовательной лицензии. " },
  frdo: { label: "ФРДО", message: "Интересует ведение реестра ФИС ФРДО. " },
};

const ContactSection = () => {
  const { toast } = useToast();
  const { keys, activeKeyForChest, chestUnlocked, setChestUnlocked } = useInventory();
  const { unlockAchievement } = useAchievements();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isChestOpen, setIsChestOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    email: "",
    phone: "",
    message: "",
    service: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ContactFormData, string>>>({});
  
  // Animation states
  const [sectionRef, isSectionInView] = useInView<HTMLDivElement>({ threshold: 0.2, triggerOnce: true });
  const [animationStep, setAnimationStep] = useState(0);

  // Animated entrance sequence
  useEffect(() => {
    if (isSectionInView) {
      const steps = [1, 2, 3, 4];
      steps.forEach((step, index) => {
        setTimeout(() => setAnimationStep(step), (index + 1) * 300);
      });
    }
  }, [isSectionInView]);

  // Handle key selection (from URL or custom event)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const keyParam = params.get('key');
    if (keyParam && serviceKeys[keyParam]) {
      setSelectedKey(keyParam);
      setFormData(prev => ({
        ...prev,
        service: serviceKeys[keyParam].label,
        message: serviceKeys[keyParam].message,
      }));
      setIsChestOpen(true);
    }

    // Listen for custom key selection events
    const handleSelectKey = (e: CustomEvent<{ keyId: string }>) => {
      const { keyId } = e.detail;
      if (serviceKeys[keyId]) {
        handleKeySelect(keyId);
      }
    };

    window.addEventListener('selectKey', handleSelectKey as EventListener);
    return () => window.removeEventListener('selectKey', handleSelectKey as EventListener);
  }, []);

  // Sync with inventory chest unlock state
  useEffect(() => {
    if (chestUnlocked && !isChestOpen) {
      setIsChestOpen(true);
    }
  }, [chestUnlocked, isChestOpen]);

  const handleChestOpen = () => {
    setIsChestOpen(true);
    setChestUnlocked(true);
    unlockAchievement('treasure_hunter');
  };

  const handleLockedChestClick = () => {
    // Scroll to service keys grid
    const keysSection = document.getElementById('service-keys');
    if (keysSection) {
      keysSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    // Show toast hint
    toast({
      title: "Возьмите ключ! 🔑",
      description: "Нажмите на ключ в карточке услуги, чтобы забрать его",
    });
  };

  const handleKeySelect = (keyId: string) => {
    setSelectedKey(keyId);
    setFormData(prev => ({
      ...prev,
      service: serviceKeys[keyId].label,
      message: serviceKeys[keyId].message,
    }));
    setIsChestOpen(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof ContactFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = contactSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof ContactFormData, string>> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as keyof ContactFormData] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    
    const telegramResult = await sendToTelegram({
      type: 'contact',
      service: formData.service,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      message: formData.message,
    });
    
    setIsSubmitting(false);
    
    if (telegramResult.success) {
      setIsSubmitted(true);
      unlockAchievement('connected');
      toast({
        title: "Заявка отправлена!",
        description: "Мы свяжемся с вами в ближайшее время.",
      });

      setTimeout(() => {
        setFormData({ name: "", email: "", phone: "", message: "", service: "" });
        setIsSubmitted(false);
        setSelectedKey(null);
      }, 3000);
    } else {
      toast({
        title: "Ошибка отправки",
        description: "Попробуйте ещё раз или свяжитесь с нами другим способом.",
        variant: "destructive",
      });
    }
  };

  return (
    <section id="contact" ref={sectionRef} className="py-16 relative overflow-hidden bg-secondary/30">
      {/* Pirate beach background */}
      <div className="absolute inset-0 z-0">
        <img
          src={pirateBeachBg}
          alt=""
          aria-hidden="true"
          loading="lazy"
          className="w-full h-full object-cover opacity-75"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/55 via-background/35 to-background/70" />
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse at center, transparent 25%, hsl(var(--background) / 0.65) 100%)",
          }}
        />
      </div>
      <div className="container relative z-10 px-4">
        <div className="max-w-4xl mx-auto">

          {/* Treasure Chest & Form */}
          <div 
            className={`transition-all duration-700 delay-300 ${
              animationStep >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <AnimatePresence mode="wait">
              {!isChestOpen ? (
                <motion.div
                  key="chest"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="rounded-sm p-8 md:p-12 relative overflow-hidden"
                >
                  {/* Chest decoration - subtle lines only */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
                  
                  <div className="relative z-10">
                    <h3 className="text-2xl md:text-3xl font-display font-bold mb-4 text-center">
                      Сундук <span className="gradient-gold-text">сотрудничества</span>
                    </h3>
                    <p className="text-muted-foreground mb-8 max-w-md mx-auto text-center">
                      {keys.length > 0 
                        ? "Перетащите ключ из инвентаря внизу экрана к сундуку"
                        : "Соберите ключи от услуг в разделе выше"}
                    </p>
                    
                    {/* 3D Treasure Chest */}
                    <TreasureChest3D onOpen={handleChestOpen} isOpen={isChestOpen} onLockedClick={handleLockedChestClick} />
                    
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="luxury-card rounded-sm p-8 md:p-12"
                >
                  {/* Open chest decoration */}
                  <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                  
                  <div className="grid lg:grid-cols-2 gap-12">
                    {/* Left side - info */}
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        {selectedKey && (
                          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30">
                            <KeyRound className="w-3 h-3 text-primary" />
                            <span className="text-xs text-primary font-medium">{serviceKeys[selectedKey].label}</span>
                          </div>
                        )}
                      </div>
                      
                      <h3 className="text-2xl md:text-3xl font-display font-bold mb-4">
                        Обсудим ваш проект
                      </h3>
                      <p className="text-muted-foreground mb-8">
                        Расскажите о задаче, и мы предложим оптимальное решение. Ответ в течение 24 часов.
                      </p>
                      
                      <div className="space-y-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-3">
                          <Clock className="w-4 h-4 text-primary" />
                          <span>Ответ в течение 24 часов</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <MapPin className="w-4 h-4 text-primary" />
                          <span>Работаем по всей России</span>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => {
                          setIsChestOpen(false);
                          setChestUnlocked(false);
                          setSelectedKey(null);
                          setFormData(prev => ({ ...prev, service: "", message: "" }));
                        }}
                        className="mt-8 text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                      >
                        ← Закрыть сундук
                      </button>
                    </div>

                    {/* Right side - form */}
                    <div>
                      {isSubmitted ? (
                        <div className="flex flex-col items-center justify-center h-full text-center py-8">
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4"
                          >
                            <CheckCircle className="w-8 h-8 text-primary" />
                          </motion.div>
                          <h4 className="text-xl font-semibold mb-2">Спасибо за заявку!</h4>
                          <p className="text-muted-foreground">Мы свяжемся с вами в ближайшее время</p>
                        </div>
                      ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                          {selectedKey && (
                            <div className="p-3 rounded-sm bg-primary/5 border border-primary/20 text-sm">
                              <span className="text-muted-foreground">Выбранная услуга: </span>
                              <span className="text-primary font-medium">{serviceKeys[selectedKey].label}</span>
                            </div>
                          )}
                          
                          <div className="space-y-2">
                            <Label htmlFor="name">Имя *</Label>
                            <Input
                              id="name"
                              name="name"
                              placeholder="Как к вам обращаться"
                              value={formData.name}
                              onChange={handleChange}
                              className={errors.name ? "border-destructive" : ""}
                            />
                            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                          </div>

                          <div className="grid sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="email">Email *</Label>
                              <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="email@example.com"
                                value={formData.email}
                                onChange={handleChange}
                                className={errors.email ? "border-destructive" : ""}
                              />
                              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="phone">Телефон</Label>
                              <Input
                                id="phone"
                                name="phone"
                                type="tel"
                                placeholder="+7 (___) ___-__-__"
                                value={formData.phone}
                                onChange={handleChange}
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="message">Сообщение *</Label>
                            <Textarea
                              id="message"
                              name="message"
                              placeholder="Опишите вашу задачу или проект"
                              rows={4}
                              value={formData.message}
                              onChange={handleChange}
                              className={errors.message ? "border-destructive" : ""}
                            />
                            {errors.message && <p className="text-sm text-destructive">{errors.message}</p>}
                          </div>

                          <Button 
                            type="submit" 
                            variant="hero" 
                            size="lg" 
                            className="w-full"
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Отправка...
                              </>
                            ) : (
                              <>
                                <Send className="w-4 h-4" />
                                Отправить заявку
                              </>
                            )}
                          </Button>
                        </form>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
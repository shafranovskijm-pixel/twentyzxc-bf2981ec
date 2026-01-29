import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AnimatedSection from "@/components/AnimatedSection";
import { Building2, GraduationCap, FileCheck, Bot, Users, Briefcase, Mail, Phone, MapPin } from "lucide-react";

const About = () => {
  const features = [
    {
      icon: GraduationCap,
      title: "Система дистанционного обучения",
      description: "Современный редактор курсов с ИИ-ассистентом, автоматическое тестирование и отслеживание прогресса учеников."
    },
    {
      icon: Users,
      title: "Управление учениками",
      description: "Удобный импорт, автоматическая рассылка учётных данных и сбор документов через платформу."
    },
    {
      icon: FileCheck,
      title: "Документооборот",
      description: "Автоматическое создание договоров, счетов, актов, приказов и журналов учёта."
    },
    {
      icon: Briefcase,
      title: "Работа с компаниями",
      description: "Привязка групп учеников к организациям, хранение договоров, счетов и актов."
    },
    {
      icon: Building2,
      title: "Интеграция с ФРДО",
      description: "Автоматическое заполнение данных для передачи в Федеральный реестр документов об образовании."
    },
    {
      icon: Bot,
      title: "ИИ-ассистент",
      description: "Консультирование учеников, озвучивание лекций и помощь в создании учебного контента."
    }
  ];

  const values = [
    {
      title: "Наша миссия",
      description: "Сделать качественное образование доступным для каждого, предоставляя современные инструменты для обучения и управления образовательным процессом."
    },
    {
      title: "Инновации",
      description: "Используем передовые технологии, включая искусственный интеллект, для создания интерактивного и эффективного образовательного контента."
    },
    {
      title: "Соответствие",
      description: "Наша платформа полностью соответствует требованиям 273-ФЗ «Об образовании» и готова к интеграции с ФРДО и государственными системами."
    }
  ];

  const requisites = [
    { label: "Наименование", value: "ИП Шафрановский Максим Михайлович" },
    { label: "ОГРНИП", value: "324253600042754" },
    { label: "ИНН", value: "253615392404" },
    { label: "Дата регистрации", value: "08 мая 2024 г." },
    { label: "Основной вид деятельности", value: "63.11 — Деятельность по обработке данных, предоставление услуг по размещению информации" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(45_80%_55%/0.08),transparent_60%)]" />
        
        <div className="container px-4 relative z-10">
          <AnimatedSection className="text-center max-w-4xl mx-auto">
            <span className="text-primary text-sm tracking-[0.3em] uppercase mb-4 block">О компании</span>
            <h1 className="text-4xl md:text-6xl font-display font-bold mb-6">
              <span className="gradient-gold-text">СИНТАГМА</span> — современная платформа для образования
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Мы создаём инновационные решения для дистанционного обучения и автоматизации документооборота образовательных организаций
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 relative">
        <div className="container px-4">
          <div className="grid md:grid-cols-3 gap-8">
            {values.map((item, index) => (
              <AnimatedSection key={item.title} delay={index * 0.1}>
                <div className="luxury-card p-8 rounded-lg h-full">
                  <h3 className="text-xl font-display font-semibold text-primary mb-4">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 relative">
        <div className="absolute inset-0 bg-secondary/30" />
        
        <div className="container px-4 relative z-10">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Что мы делаем</h2>
            <div className="divider-gold w-24 mx-auto" />
          </AnimatedSection>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <AnimatedSection key={feature.title} delay={index * 0.1}>
                <div className="luxury-card p-8 rounded-lg h-full group hover:border-primary/40 transition-colors">
                  <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-display font-semibold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Requisites Section */}
      <section className="py-20 relative">
        <div className="container px-4">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Реквизиты</h2>
            <div className="divider-gold w-24 mx-auto" />
          </AnimatedSection>
          
          <div className="max-w-3xl mx-auto">
            <AnimatedSection>
              <div className="luxury-card p-8 rounded-lg">
                <div className="space-y-6">
                  {requisites.map((item) => (
                    <div key={item.label} className="flex flex-col sm:flex-row sm:items-start gap-2 pb-4 border-b border-border last:border-0 last:pb-0">
                      <span className="text-muted-foreground text-sm min-w-[200px]">{item.label}</span>
                      <span className="font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
                
                <div className="divider-gold my-8" />
                
                {/* Contact Info */}
                <div className="grid sm:grid-cols-3 gap-6">
                  <a href="mailto:shafranovskij.m@gmail.com" className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors">
                    <Mail className="w-5 h-5 text-primary" />
                    <span className="text-sm">shafranovskij.m@gmail.com</span>
                  </a>
                  <a href="tel:89147213424" className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors">
                    <Phone className="w-5 h-5 text-primary" />
                    <span className="text-sm">+7 (914) 721-34-24</span>
                  </a>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <MapPin className="w-5 h-5 text-primary" />
                    <span className="text-sm">Приморский край, г. Владивосток</span>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;

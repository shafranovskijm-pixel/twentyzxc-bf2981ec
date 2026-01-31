import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AnimatedSection from "@/components/AnimatedSection";
import TitleParticles from "@/components/TitleParticles";
import TechCard from "@/components/TechCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  ExternalLink, 
  FileCheck,
  Settings,
  Database,
  FileText,
  Eye,
  CheckCircle2
} from "lucide-react";
import { Link } from "react-router-dom";

const services = [
  {
    icon: Settings,
    title: "Настройка и доработка сайта",
    description: "Адаптация действующего сайта под требования Рособрнадзора для получения образовательной лицензии"
  },
  {
    icon: FileText,
    title: "Раздел «Сведения об образовательной организации»",
    description: "Создание и наполнение обязательного раздела с документами и информацией согласно законодательству"
  },
  {
    icon: Eye,
    title: "Версия для слабовидящих",
    description: "Разработка специальной версии сайта с увеличенным шрифтом и контрастными цветами для людей с ограниченными возможностями"
  },
  {
    icon: Database,
    title: "Ведение реестра ФИС ФРДО",
    description: "Подключение к защищённому каналу, настройка ЭЦП и регулярная выгрузка данных о выданных документах об образовании"
  },
  {
    icon: FileCheck,
    title: "Подготовка документов",
    description: "Формирование полного пакета документов для размещения на сайте и подачи в контролирующие органы"
  },
];

const requirements = [
  "Информация о руководстве и педагогическом составе",
  "Сведения о материально-техническом обеспечении",
  "Образовательные программы и учебные планы",
  "Лицензия и аккредитация",
  "Платные образовательные услуги",
  "Финансово-хозяйственная деятельность",
  "Вакантные места для приёма",
  "Стипендии и меры поддержки"
];

const PrNutrition = () => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/8 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px]" />
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: 'radial-gradient(hsl(45 80% 55%) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />
        {/* Decorative corner lines */}
        <svg className="absolute top-24 left-8 w-32 h-32 opacity-20" viewBox="0 0 100 100">
          <path d="M 0 30 L 0 0 L 30 0" fill="none" stroke="hsl(45 80% 55%)" strokeWidth="1" />
        </svg>
        <svg className="absolute bottom-24 right-8 w-32 h-32 opacity-20" viewBox="0 0 100 100">
          <path d="M 100 70 L 100 100 L 70 100" fill="none" stroke="hsl(45 80% 55%)" strokeWidth="1" />
        </svg>
        {/* Floating particles */}
        <div className="absolute top-1/4 right-1/4 w-2 h-2 bg-primary/40 rounded-full animate-pulse" />
        <div className="absolute top-2/3 left-1/4 w-1.5 h-1.5 bg-primary/30 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 right-1/3 w-1 h-1 bg-primary/50 rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <Header />
      
      <main className="pt-32 pb-24 relative z-10">
        <div className="container px-4">
          {/* Back button */}
          <Link 
            to="/portfolio" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Назад к портфолио
          </Link>

          {/* Hero */}
          <AnimatedSection className="mb-20">
            <div className="max-w-4xl">
              <Badge variant="outline" className="mb-4 border-primary/30 text-primary">
                Образование
              </Badge>
              
              {/* Title with particles */}
              <div className="relative inline-block mb-4">
                <TitleParticles />
                <h1 className="text-4xl md:text-5xl font-display font-bold relative z-10 py-4 px-2">
                  <span className="gradient-gold-text">PR Nutrition</span>
                </h1>
              </div>
              
              <p className="text-lg text-muted-foreground mb-2">
                Доработка сайта и лицензирование
              </p>
              
              <p className="text-muted-foreground mb-8 leading-relaxed max-w-2xl">
                Комплексная настройка и доработка действующего сайта для получения образовательной лицензии: 
                создание раздела «Сведения об образовательной организации», версия для слабовидящих, 
                подготовка документов и ведение реестра ФИС ФРДО.
              </p>

              <div className="flex flex-wrap gap-2 mb-8">
                {["web", "license", "support", "ФРДО"].map((tag) => (
                  <Badge key={tag} variant="outline" className="border-border">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="flex flex-wrap gap-4 items-center">
                <Button variant="ghost" size="sm" asChild>
                  <a href="https://pr-nutrition.ru/" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Открыть сайт
                  </a>
                </Button>
              </div>
            </div>
          </AnimatedSection>

          {/* Services Grid */}
          <AnimatedSection className="mb-20" delay={100}>
            <h2 className="text-2xl font-display font-semibold mb-8 flex items-center gap-3">
              <span className="w-8 h-[1px] bg-primary" />
              Что было сделано
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service, i) => (
                <AnimatedSection key={i} delay={150 + i * 100} direction="up">
                  <TechCard
                    icon={service.icon}
                    title={service.title}
                    description={service.description}
                    index={i}
                  />
                </AnimatedSection>
              ))}
            </div>
          </AnimatedSection>

          {/* Requirements Section */}
          <AnimatedSection className="mb-20" delay={100} direction="scale">
            <div className="luxury-card p-8 md:p-12 rounded-sm">
              <div className="grid md:grid-cols-2 gap-8 items-start">
                <div>
                  <Badge variant="outline" className="mb-4 border-primary/30 text-primary">
                    Требования
                  </Badge>
                  <h2 className="text-2xl md:text-3xl font-display font-semibold mb-4">
                    Раздел <span className="gradient-gold-text">«Сведения»</span>
                  </h2>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    Согласно законодательству, образовательные организации обязаны размещать 
                    на сайте определённый перечень информации в специальном разделе.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Мы подготовили и разместили всю необходимую информацию в соответствии с 
                    требованиями Рособрнадзора.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-4">Обязательные подразделы:</h3>
                  <ul className="space-y-2">
                    {requirements.map((req, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </AnimatedSection>

          {/* Accessibility Section */}
          <AnimatedSection className="mb-20" delay={100} direction="left">
            <div className="luxury-card p-8 md:p-12 rounded-sm">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <Badge variant="outline" className="mb-4 border-primary/30 text-primary">
                    Доступность
                  </Badge>
                  <h2 className="text-2xl md:text-3xl font-display font-semibold mb-4">
                    Версия для <span className="gradient-gold-text">слабовидящих</span>
                  </h2>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    Разработана специальная версия сайта для людей с ограниченными возможностями 
                    зрения в соответствии с ГОСТ Р 52872-2019.
                  </p>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      Увеличенный размер шрифта
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      Контрастные цветовые схемы
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      Упрощённая навигация
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      Совместимость с программами экранного доступа
                    </li>
                  </ul>
                </div>
                <AnimatedSection delay={300} direction="right">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg blur-xl" />
                    <div className="relative bg-card border border-border rounded-sm p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <Eye className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">Версия для слабовидящих</div>
                          <div className="text-xs text-muted-foreground">ГОСТ Р 52872-2019</div>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between py-2 border-b border-border">
                          <span className="text-muted-foreground">Размер шрифта</span>
                          <span className="font-medium">A A A</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-border">
                          <span className="text-muted-foreground">Цветовая схема</span>
                          <div className="flex gap-1">
                            <div className="w-5 h-5 rounded bg-background border border-border" />
                            <div className="w-5 h-5 rounded bg-foreground" />
                            <div className="w-5 h-5 rounded bg-primary" />
                          </div>
                        </div>
                        <div className="flex justify-between py-2">
                          <span className="text-muted-foreground">Изображения</span>
                          <span className="font-medium">Вкл / Выкл</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </AnimatedSection>
              </div>
            </div>
          </AnimatedSection>

          {/* CTA */}
          <AnimatedSection className="text-center" delay={100} direction="up">
            <div className="luxury-card p-12 rounded-sm max-w-3xl mx-auto">
              <h3 className="text-2xl md:text-3xl font-display font-semibold mb-4">
                Нужна <span className="gradient-gold-text">доработка сайта</span>?
              </h3>
              <p className="text-muted-foreground mb-8">
                Приведём ваш сайт в соответствие требованиям Рособрнадзора
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="hero" size="lg" asChild>
                  <a href="/#contact">Обсудить проект</a>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link to="/licensing">
                    Подробнее о лицензировании
                  </Link>
                </Button>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PrNutrition;

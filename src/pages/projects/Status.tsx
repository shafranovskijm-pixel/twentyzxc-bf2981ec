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
  Globe,
  Database,
  Shield,
  HeartHandshake,
  FileWarning,
  ArrowRightLeft,
  GraduationCap,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { Link } from "react-router-dom";

const services = [
  {
    icon: Globe,
    title: "Разработка и поддержка сайта",
    description: "Создание современного сайта для учебного центра с разделом «Сведения об образовательной организации» и версией для слабовидящих"
  },
  {
    icon: Database,
    title: "Ведение реестра ФИС ФРДО",
    description: "Настройка защищённого канала, ЭЦП и регулярная выгрузка данных о выданных документах об образовании"
  },
  {
    icon: GraduationCap,
    title: "Доступ к платформе Синтагма",
    description: "Подключение к образовательной LMS-платформе с готовыми курсами, тестированием и выдачей документов"
  },
  {
    icon: ArrowRightLeft,
    title: "Перенос домена",
    description: "Полное сопровождение переноса домена от предыдущего подрядчика: переговоры, техническая миграция, настройка DNS"
  },
  {
    icon: FileWarning,
    title: "Претензия на возврат средств",
    description: "Составление и подача претензии хостинг-провайдеру Beget для возврата денежных средств за неоказанные услуги"
  },
  {
    icon: HeartHandshake,
    title: "Индивидуальный подход",
    description: "Решение нестандартных задач и оперативная поддержка по всем вопросам, связанным с образовательной деятельностью"
  },
];

const challenges = [
  {
    problem: "Предыдущий подрядчик не отдавал домен",
    solution: "Провели переговоры, подготовили документы и добились передачи домена"
  },
  {
    problem: "Хостинг списал деньги за неиспользуемые услуги",
    solution: "Составили претензию в Beget, добились возврата средств"
  },
  {
    problem: "Сайт не соответствовал требованиям Рособрнадзора",
    solution: "Создали новый сайт с обязательным разделом и версией для слабовидящих"
  },
  {
    problem: "Не было системы учёта выданных документов",
    solution: "Подключили к ФИС ФРДО с регулярной выгрузкой данных"
  },
];

const Status = () => {
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
                  Учебный центр <span className="gradient-gold-text">«Статус»</span>
                </h1>
              </div>
              
              <p className="text-lg text-muted-foreground mb-2">
                Комплексное сопровождение образовательной организации
              </p>
              <p className="text-muted-foreground mb-6">
                Ангарск, Иркутская область
              </p>
              
              <p className="text-muted-foreground mb-8 leading-relaxed max-w-2xl">
                Полный цикл услуг для учебного центра: от решения юридических споров с предыдущим подрядчиком 
                до создания сайта, ведения ФРДО и подключения к образовательной платформе. 
                Особый акцент на индивидуальный подход и решение нестандартных задач.
              </p>

              <div className="flex flex-wrap gap-2 mb-8">
                {["web", "LMS", "ФРДО", "support", "индивидуальный подход"].map((tag) => (
                  <Badge key={tag} variant="outline" className="border-border">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="flex flex-wrap gap-4 items-center">
                <div className="luxury-card px-6 py-3 rounded-sm">
                  <span className="text-sm text-muted-foreground mr-2">Стоимость:</span>
                  <span className="text-xl font-display font-bold gradient-gold-text">65 000 ₽/год</span>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <a href="https://uc-status38.ru/" target="_blank" rel="noopener noreferrer">
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
              Что входит в обслуживание
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

          {/* Challenges & Solutions */}
          <AnimatedSection className="mb-20" delay={100}>
            <h2 className="text-2xl font-display font-semibold mb-8 flex items-center gap-3">
              <span className="w-8 h-[1px] bg-primary" />
              Решённые задачи
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {challenges.map((item, i) => (
                <AnimatedSection key={i} delay={150 + i * 100} direction="left">
                  <div className="luxury-card p-6 rounded-sm h-full">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-10 h-10 rounded-sm bg-destructive/10 border border-destructive/20 flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="w-5 h-5 text-destructive" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-destructive/80 mb-1">Проблема</p>
                        <p className="text-sm text-muted-foreground">{item.problem}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-sm bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-primary/80 mb-1">Решение</p>
                        <p className="text-sm text-muted-foreground">{item.solution}</p>
                      </div>
                    </div>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </AnimatedSection>

          {/* Individual Approach Section */}
          <AnimatedSection className="mb-20" delay={100} direction="scale">
            <div className="luxury-card p-8 md:p-12 rounded-sm">
              <div className="grid md:grid-cols-2 gap-8 items-start">
                <div>
                  <Badge variant="outline" className="mb-4 border-primary/30 text-primary">
                    Подход
                  </Badge>
                  <h2 className="text-2xl md:text-3xl font-display font-semibold mb-4">
                    Почему <span className="gradient-gold-text">индивидуально</span>?
                  </h2>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    Каждый клиент приходит с уникальным набором задач. Мы не предлагаем шаблонных решений — 
                    разбираемся в ситуации и находим оптимальный путь, даже если он выходит за рамки типовых услуг.
                  </p>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      Разрешение споров с предыдущими подрядчиками
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      Юридическое сопровождение и составление претензий
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      Оперативная поддержка по любым вопросам
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      Гибкость в расширении услуг по мере роста
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-4">Что входит в годовое обслуживание:</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-3 border-b border-border">
                      <span className="text-sm text-muted-foreground">Сайт + хостинг + домен</span>
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-border">
                      <span className="text-sm text-muted-foreground">Ведение ФИС ФРДО</span>
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-border">
                      <span className="text-sm text-muted-foreground">Доступ к платформе Синтагма</span>
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-border">
                      <span className="text-sm text-muted-foreground">Техническая поддержка</span>
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex justify-between items-center py-3">
                      <span className="text-sm font-medium">Итого</span>
                      <span className="font-semibold text-primary">65 000 ₽/год</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>

          {/* CTA */}
          <AnimatedSection className="text-center" delay={100} direction="up">
            <div className="luxury-card p-12 rounded-sm max-w-3xl mx-auto">
              <h3 className="text-2xl md:text-3xl font-display font-semibold mb-4">
                Нужен <span className="gradient-gold-text">индивидуальный подход</span>?
              </h3>
              <p className="text-muted-foreground mb-8">
                Обсудим ваши задачи и найдём оптимальное решение
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

export default Status;

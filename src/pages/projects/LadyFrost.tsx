import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AnimatedSection from "@/components/AnimatedSection";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  ExternalLink, 
  FileCheck,
  Scale,
  Database,
  FileText,
  Shield,
  Clock,
  CheckCircle2
} from "lucide-react";
import { Link } from "react-router-dom";
import TitleParticles from "@/components/TitleParticles";

const services = [
  {
    icon: Scale,
    title: "Получение лицензии под ключ",
    description: "Полный цикл подготовки документов для Рособрнадзора: от консультации до получения лицензии на образовательную деятельность"
  },
  {
    icon: FileText,
    title: "Раздел «Сведения об образовательной организации»",
    description: "Добавление обязательного раздела на существующий сайт в соответствии с требованиями законодательства"
  },
  {
    icon: Database,
    title: "Ведение реестра ФИС ФРДО",
    description: "Подключение к защищённому каналу, настройка ЭЦП и регулярная выгрузка данных о выданных документах"
  },
  {
    icon: Shield,
    title: "Соответствие ФЗ-273 и ФЗ-152",
    description: "Проверка и приведение сайта в соответствие федеральному законодательству об образовании и персональных данных"
  },
  {
    icon: Clock,
    title: "Сроки 10–15 рабочих дней",
    description: "Подготовка полного пакета документов для лицензирования в кратчайшие сроки"
  },
  {
    icon: FileCheck,
    title: "Поддержка после получения",
    description: "Консультации по ведению документации и изменениям в законодательстве после получения лицензии"
  },
];

const processSteps = [
  {
    step: "01",
    title: "Консультация",
    description: "Анализируем текущее состояние документов и сайта, определяем объём работ"
  },
  {
    step: "02",
    title: "Подготовка документов",
    description: "Формируем полный пакет документов для подачи в Рособрнадзор"
  },
  {
    step: "03",
    title: "Доработка сайта",
    description: "Добавляем раздел «Сведения об образовательной организации» с необходимой информацией"
  },
  {
    step: "04",
    title: "Подача и сопровождение",
    description: "Подаём документы и сопровождаем до получения лицензии"
  },
];

const LadyFrost = () => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/8 rounded-full blur-[100px]" />
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: 'radial-gradient(hsl(45 80% 55%) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />
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
                  Учебный центр <span className="gradient-gold-text">«Lady Frost»</span>
                </h1>
              </div>
              
              <p className="text-lg text-muted-foreground mb-2">
                Лицензирование и ФРДО
              </p>
              <p className="text-muted-foreground mb-6">
                Самара
              </p>
              
              <p className="text-muted-foreground mb-8 leading-relaxed max-w-2xl">
                Добавление раздела «Сведения об образовательной организации» на существующий сайт, 
                подготовка полного пакета документов для получения образовательной лицензии и 
                настройка работы с реестром ФИС ФРДО.
              </p>

              <div className="flex flex-wrap gap-2 mb-8">
                {["license", "support", "ФРДО"].map((tag) => (
                  <Badge key={tag} variant="outline" className="border-border">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="flex flex-wrap gap-4 items-center">
                <div className="luxury-card px-6 py-3 rounded-sm">
                  <span className="text-sm text-muted-foreground mr-2">Стоимость:</span>
                  <span className="text-xl font-display font-bold gradient-gold-text">50 000 ₽</span>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <a href="https://lady-frost.ru/" target="_blank" rel="noopener noreferrer">
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
                  <div className="luxury-card p-6 rounded-sm group hover:border-primary/40 transition-colors h-full">
                    <div className="w-12 h-12 rounded-sm border border-border group-hover:border-primary/40 flex items-center justify-center mb-4 transition-colors">
                      <service.icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">
                      {service.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {service.description}
                    </p>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </AnimatedSection>

          {/* Process */}
          <AnimatedSection className="mb-20" delay={100}>
            <h2 className="text-2xl font-display font-semibold mb-8 flex items-center gap-3">
              <span className="w-8 h-[1px] bg-primary" />
              Процесс работы
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {processSteps.map((item, i) => (
                <AnimatedSection key={i} delay={150 + i * 150} direction="left">
                  <div className="relative">
                    <div className="luxury-card p-6 rounded-sm h-full">
                      <div className="text-4xl font-display font-bold gradient-gold-text opacity-50 mb-4">
                        {item.step}
                      </div>
                      <h3 className="font-semibold mb-2">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    {i < processSteps.length - 1 && (
                      <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-[1px] bg-border" />
                    )}
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </AnimatedSection>

          {/* Info Section */}
          <AnimatedSection className="mb-20" delay={100} direction="scale">
            <div className="luxury-card p-8 md:p-12 rounded-sm">
              <div className="grid md:grid-cols-2 gap-8 items-start">
                <div>
                  <Badge variant="outline" className="mb-4 border-primary/30 text-primary">
                    Важно знать
                  </Badge>
                  <h2 className="text-2xl md:text-3xl font-display font-semibold mb-4">
                    Зачем нужна <span className="gradient-gold-text">лицензия</span>?
                  </h2>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    Образовательная лицензия обязательна для всех организаций, которые выдают документы 
                    об образовании. Без неё деятельность считается незаконной и влечёт административную 
                    ответственность.
                  </p>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      Выдача дипломов и удостоверений государственного образца
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      Законная образовательная деятельность
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      Доверие клиентов и партнёров
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-4">Что такое ФИС ФРДО?</h3>
                  <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                    Федеральный реестр сведений о документах об образовании — обязательная база данных, 
                    куда все лицензированные организации должны вносить информацию о выданных документах.
                  </p>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-3 border-b border-border">
                      <span className="text-sm text-muted-foreground">Разовая выгрузка</span>
                      <span className="font-semibold">3 500 ₽</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-border">
                      <span className="text-sm text-muted-foreground">Ежегодная поддержка</span>
                      <span className="font-semibold">24 000 ₽/год</span>
                    </div>
                    <div className="flex justify-between items-center py-3">
                      <span className="text-sm text-muted-foreground">Лицензирование под ключ</span>
                      <span className="font-semibold text-primary">от 50 000 ₽</span>
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
                Нужна <span className="gradient-gold-text">лицензия</span>?
              </h3>
              <p className="text-muted-foreground mb-8">
                Поможем получить образовательную лицензию и настроить работу с ФРДО
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

export default LadyFrost;

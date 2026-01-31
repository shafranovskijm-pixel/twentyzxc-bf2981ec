import Header from "@/components/Header";
import Footer from "@/components/Footer";
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
          <div className="max-w-4xl mb-20">
            <Badge variant="outline" className="mb-4 border-primary/30 text-primary">
              Образование
            </Badge>
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
              <span className="gradient-gold-text">PR Nutrition</span>
            </h1>
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

          {/* Services Grid */}
          <div className="mb-20">
            <h2 className="text-2xl font-display font-semibold mb-8 flex items-center gap-3">
              <span className="w-8 h-[1px] bg-primary" />
              Что было сделано
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service, i) => (
                <div 
                  key={i} 
                  className="luxury-card p-6 rounded-sm group hover:border-primary/40 transition-colors"
                >
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
              ))}
            </div>
          </div>

          {/* Requirements Section */}
          <div className="mb-20">
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
          </div>

          {/* Accessibility Section */}
          <div className="mb-20">
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
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
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
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PrNutrition;

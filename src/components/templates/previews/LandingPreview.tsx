import { Template } from "@/data/templates";
import { Button } from "@/components/ui/button";
import { ArrowRight, Star, CheckCircle, Play, ChevronDown } from "lucide-react";

interface LandingPreviewProps {
  template: Template;
}

export const LandingPreview = ({ template }: LandingPreviewProps) => {
  const accentClass = template.accentColor.replace('bg-', '');
  
  return (
    <div className={`min-h-screen bg-gradient-to-b ${template.gradient}`}>
      {/* Hero Section */}
      <header className="border-b border-white/10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded ${template.accentColor}`} />
            <span className="font-bold text-lg text-white">Brand</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            {["Главная", "О нас", "Услуги", "Контакты"].map((item) => (
              <a key={item} href="#" className="text-white/70 hover:text-white transition-colors text-sm">
                {item}
              </a>
            ))}
          </nav>
          <Button size="sm" className={`${template.accentColor} text-black hover:opacity-90`}>
            Связаться
          </Button>
        </div>
      </header>

      <section className="py-24 md:py-32">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8`}>
              <Star className={`w-4 h-4 text-${accentClass}`} />
              <span className="text-sm text-white/70">Премиальный сервис</span>
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Создаём <span className={`text-${accentClass}`}>будущее</span> вместе с вами
            </h1>
            <p className="text-xl text-white/60 mb-10 max-w-2xl">
              Мы помогаем компаниям достигать новых высот с помощью инновационных решений и экспертного подхода
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" className={`${template.accentColor} text-black hover:opacity-90`}>
                Начать сейчас
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10">
                <Play className="w-4 h-4 mr-2" />
                Смотреть видео
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 border-y border-white/10 bg-white/5">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "500+", label: "Проектов" },
              { value: "98%", label: "Довольных клиентов" },
              { value: "15", label: "Лет опыта" },
              { value: "24/7", label: "Поддержка" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className={`text-3xl md:text-4xl font-bold text-${accentClass} mb-2`}>{stat.value}</div>
                <div className="text-white/50 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Почему выбирают нас</h2>
            <p className="text-white/50 max-w-2xl mx-auto">
              Мы предлагаем комплексные решения для вашего бизнеса
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "Инновации", desc: "Используем передовые технологии и методологии" },
              { title: "Качество", desc: "Гарантируем высокий стандарт на каждом этапе" },
              { title: "Скорость", desc: "Быстрая реализация без потери качества" },
            ].map((feature, i) => (
              <div key={i} className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors">
                <div className={`w-12 h-12 rounded-xl ${template.accentColor} flex items-center justify-center mb-6`}>
                  <CheckCircle className="w-6 h-6 text-black" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-white/50">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className={`rounded-3xl bg-gradient-to-r ${template.gradient} p-12 md:p-16 text-center border border-white/10`}>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Готовы начать?
            </h2>
            <p className="text-white/60 mb-8 max-w-xl mx-auto">
              Оставьте заявку и мы свяжемся с вами в течение 24 часов
            </p>
            <Button size="lg" className={`${template.accentColor} text-black hover:opacity-90`}>
              Оставить заявку
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/10">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded ${template.accentColor}`} />
              <span className="font-semibold text-white">Brand</span>
            </div>
            <div className="text-white/40 text-sm">© 2024 Brand. Все права защищены.</div>
          </div>
        </div>
      </footer>
    </div>
  );
};

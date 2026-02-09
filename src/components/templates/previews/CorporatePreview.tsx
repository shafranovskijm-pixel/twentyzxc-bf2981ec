import { Template } from "@/data/templates";
import { Button } from "@/components/ui/button";
import { ArrowRight, Building2, Users, Globe, Award, ChevronRight, Mail, Phone, MapPin } from "lucide-react";

interface CorporatePreviewProps {
  template: Template;
}

export const CorporatePreview = ({ template }: CorporatePreviewProps) => {
  const accentClass = template.accentColor.replace('bg-', '');
  
  return (
    <div className={`min-h-screen bg-gradient-to-b ${template.gradient}`}>
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${template.accentColor} flex items-center justify-center`}>
              <Building2 className="w-5 h-5 text-black" />
            </div>
            <div>
              <span className="font-bold text-lg text-white block leading-tight">Corporation</span>
              <span className="text-xs text-white/40">Since 2010</span>
            </div>
          </div>
          <nav className="hidden lg:flex items-center gap-8">
            {["О компании", "Услуги", "Проекты", "Команда", "Карьера", "Контакты"].map((item) => (
              <a key={item} href="#" className="text-white/70 hover:text-white transition-colors text-sm font-medium">
                {item}
              </a>
            ))}
          </nav>
          <Button className={`${template.accentColor} text-black hover:opacity-90`}>
            Связаться
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="py-24 md:py-32">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="text-white/40 uppercase tracking-widest text-sm mb-4">
                Лидер отрасли
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Строим <span className={`text-${accentClass}`}>надёжное</span> будущее
              </h1>
              <p className="text-lg text-white/60 mb-8">
                Мы помогаем бизнесу расти и развиваться, предоставляя комплексные решения 
                для достижения стратегических целей
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" className={`${template.accentColor} text-black hover:opacity-90`}>
                  Узнать больше
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10">
                  Наши проекты
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-[4/3] rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <div className={`w-16 h-16 rounded-xl ${template.accentColor} mb-4`} />
                  <div className="h-4 w-3/4 bg-white/20 rounded mb-2" />
                  <div className="h-3 w-1/2 bg-white/10 rounded" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-white/5">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-4 gap-8">
            {[
              { icon: Building2, value: "15+", label: "Лет на рынке" },
              { icon: Users, value: "500+", label: "Сотрудников" },
              { icon: Globe, value: "30+", label: "Стран присутствия" },
              { icon: Award, value: "100+", label: "Наград и премий" },
            ].map(({ icon: Icon, value, label }) => (
              <div key={label} className="text-center p-6">
                <Icon className={`w-8 h-8 text-${accentClass} mx-auto mb-4`} />
                <div className="text-3xl font-bold text-white mb-2">{value}</div>
                <div className="text-white/50">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <div className="text-white/40 uppercase tracking-widest text-sm mb-2">Наши услуги</div>
              <h2 className="text-3xl md:text-4xl font-bold text-white">Что мы предлагаем</h2>
            </div>
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 self-start md:self-auto">
              Все услуги
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              "Консалтинг",
              "Стратегическое планирование",
              "Цифровая трансформация",
              "Управление проектами",
              "Финансовый анализ",
              "Маркетинг и PR",
            ].map((service, i) => (
              <div key={i} className="p-6 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all group cursor-pointer">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">{service}</h3>
                  <ChevronRight className={`w-5 h-5 text-${accentClass} group-hover:translate-x-1 transition-transform`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Preview */}
      <section className="py-24 bg-white/5">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <div className="text-white/40 uppercase tracking-widest text-sm mb-2">Наша команда</div>
            <h2 className="text-3xl md:text-4xl font-bold text-white">Эксперты своего дела</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: "Александр Петров", role: "CEO" },
              { name: "Мария Иванова", role: "CFO" },
              { name: "Дмитрий Сидоров", role: "CTO" },
              { name: "Елена Козлова", role: "CMO" },
            ].map((member) => (
              <div key={member.name} className="text-center">
                <div className="aspect-square rounded-2xl bg-white/10 mb-4" />
                <h4 className="font-semibold text-white">{member.name}</h4>
                <p className={`text-${accentClass} text-sm`}>{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <div className="text-white/40 uppercase tracking-widest text-sm mb-2">Контакты</div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Свяжитесь с нами</h2>
              <div className="space-y-6">
                {[
                  { icon: Mail, text: "info@corporation.com" },
                  { icon: Phone, text: "+7 (495) 123-45-67" },
                  { icon: MapPin, text: "Москва, ул. Примерная, 123" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg ${template.accentColor} flex items-center justify-center`}>
                      <Icon className="w-5 h-5 text-black" />
                    </div>
                    <span className="text-white/70">{text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-8 rounded-2xl bg-white/5 border border-white/10">
              <h3 className="text-xl font-semibold text-white mb-6">Напишите нам</h3>
              <div className="space-y-4">
                <input 
                  type="text" 
                  placeholder="Ваше имя" 
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/10 text-white placeholder:text-white/40 focus:border-white/30 outline-none"
                />
                <input 
                  type="email" 
                  placeholder="Email" 
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/10 text-white placeholder:text-white/40 focus:border-white/30 outline-none"
                />
                <textarea 
                  placeholder="Сообщение" 
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/10 text-white placeholder:text-white/40 focus:border-white/30 outline-none resize-none"
                />
                <Button className={`w-full ${template.accentColor} text-black hover:opacity-90`}>
                  Отправить
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-white/10">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg ${template.accentColor} flex items-center justify-center`}>
                <Building2 className="w-4 h-4 text-black" />
              </div>
              <span className="font-semibold text-white">Corporation</span>
            </div>
            <div className="text-white/40 text-sm">© 2024 Corporation. Все права защищены.</div>
          </div>
        </div>
      </footer>
    </div>
  );
};

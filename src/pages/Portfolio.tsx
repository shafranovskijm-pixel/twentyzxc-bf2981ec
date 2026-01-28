import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Globe, Megaphone, GraduationCap, Headphones, FileCheck } from "lucide-react";
import { useCountUp } from "@/hooks/use-count-up";
import { useInView } from "@/hooks/use-in-view";

interface Project {
  title: string;
  location?: string;
  description: string;
  tags: string[];
  price?: string;
  priceAlt?: string;
  url: string;
  featured?: boolean;
}

const projects: Project[] = [
  {
    title: "Анна Чмулева — Риелтор",
    location: "Дальний Восток",
    description: "Персональный сайт эксперта по недвижимости. 8+ лет опыта, 1000+ сделок. Полный спектр услуг от поиска до заселения.",
    tags: ["web", "дизайн", "SEO"],
    url: "https://xn----7sbfldrqgb2aseye2d.xn--p1ai/",
    featured: true,
  },
  {
    title: "Lanmei — экспорт из Китая",
    description: "Логотип, фирменный стиль, контент сайта, реклама и продвижение.",
    tags: ["web", "ads", "SEO", "SMM"],
    price: "30 000 ₽",
    url: "https://lanmei.ru/",
    featured: true,
  },
  {
    title: "ООО «ВАЙБ» — сайт + LMS",
    location: "шафрановский.рф",
    description: "Разработка сайта и образовательной платформы, лицензия под ключ, поддержка и контент курсов.",
    tags: ["web", "LMS", "support", "license"],
    price: "24 000 ₽/год",
    priceAlt: "35 000 ₽ разово",
    url: "https://xn--80aagyfetipo1a0c.xn--p1ai/",
  },
  {
    title: "База отдыха «Июль»",
    location: "Приморский край",
    description: "Создание и управление сайтом, Telegram, реклама, подбор персонала.",
    tags: ["web", "ads", "SMM"],
    price: "24 000 ₽/год",
    url: "https://xn--h1abhbk1gm.xn--p1ai/",
  },
  {
    title: "Учебный центр «Lady Frost»",
    location: "Самара",
    description: "Раздел «Информация», пакет лицензий, поддержка ФРДО.",
    tags: ["web", "license", "support"],
    price: "24 000 ₽/год (ФРДО)",
    priceAlt: "35 000 ₽ лицензия",
    url: "https://lady-frost.ru/",
  },
  {
    title: "Учебный центр «Статус»",
    location: "Ангарск",
    description: "Сайт, поддержка ФРДО, LMS под ключ (в разработке).",
    tags: ["web", "LMS", "support"],
    price: "24 000 ₽/год (ФРДО)",
    url: "https://uc-status38.ru/",
  },
  {
    title: "Магазин «Flowrish»",
    location: "Уссурийск",
    description: "Сайт и реклама в Яндекс Директ.",
    tags: ["web", "ads"],
    price: "24 000 ₽/год",
    url: "https://flowrish.ru/",
  },
  {
    title: "SpinRide — велосипеды и самокаты",
    description: "Сайт и рекламные кампании.",
    tags: ["web", "ads"],
    price: "20 000 ₽/год",
    url: "https://spinride.ru/",
  },
  {
    title: "Учебный центр «ОНИКС»",
    location: "Новобурейский",
    description: "Сайт, реклама, поддержка ФРДО.",
    tags: ["web", "ads", "support"],
    price: "24 000 ₽/год (ФРДО)",
    url: "https://xn----7sbfldrqgb2aseye2d.xn--p1ai/",
  },
  {
    title: "Магазин «Алфавит дверей»",
    location: "Уссурийск",
    description: "Создание и управление сайтом, Яндекс Директ, SEO. Топ позиции в Уссурийске.",
    tags: ["web", "ads", "SEO"],
    price: "20 000 ₽/год",
    url: "https://xn--80adjfbdjdcnhpifgi3a.xn--p1ai/",
  },
];

const tagIcons: Record<string, React.ReactNode> = {
  web: <Globe className="w-3 h-3" />,
  ads: <Megaphone className="w-3 h-3" />,
  LMS: <GraduationCap className="w-3 h-3" />,
  support: <Headphones className="w-3 h-3" />,
  license: <FileCheck className="w-3 h-3" />,
};

const Portfolio = () => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Top-right glow */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-[120px]" />
        
        {/* Bottom-left glow */}
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/8 rounded-full blur-[100px]" />
        
        {/* Floating geometric shapes */}
        <div className="absolute top-1/4 right-10 w-32 h-32 border border-primary/10 rotate-45 animate-float" />
        <div className="absolute top-1/3 left-5 w-20 h-20 border border-primary/5 rotate-12 animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-16 h-16 border border-primary/10 -rotate-12 animate-float" style={{ animationDelay: '4s' }} />
        
        {/* Decorative lines */}
        <div className="absolute top-40 left-0 w-64 h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        <div className="absolute bottom-60 right-0 w-48 h-[1px] bg-gradient-to-l from-transparent via-primary/20 to-transparent" />
        
        {/* Dot grid pattern */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: 'radial-gradient(hsl(45 80% 55%) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />
        
        {/* Diagonal lines */}
        <svg className="absolute top-20 right-20 w-40 h-40 text-primary/5" viewBox="0 0 100 100">
          <line x1="0" y1="100" x2="100" y2="0" stroke="currentColor" strokeWidth="0.5" />
          <line x1="20" y1="100" x2="100" y2="20" stroke="currentColor" strokeWidth="0.5" />
          <line x1="40" y1="100" x2="100" y2="40" stroke="currentColor" strokeWidth="0.5" />
        </svg>
        
        {/* Corner ornament top-left */}
        <svg className="absolute top-32 left-8 w-16 h-16 text-primary/20" viewBox="0 0 50 50">
          <path d="M0 25 L25 0 L25 10 L10 25 L25 25 L25 50 L0 25" fill="none" stroke="currentColor" strokeWidth="0.5" />
        </svg>
        
        {/* Small diamonds */}
        <div className="absolute top-1/2 left-20 w-3 h-3 bg-primary/20 rotate-45" />
        <div className="absolute top-[60%] right-32 w-2 h-2 bg-primary/15 rotate-45" />
        <div className="absolute top-[80%] left-1/3 w-2 h-2 bg-primary/10 rotate-45" />
      </div>

      <Header />
      
      <main className="pt-32 pb-24 relative z-10">
        <div className="container px-4">
          {/* Hero */}
          <div className="text-center mb-20 relative">
            {/* Hero decorative elements */}
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-40 h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary/40 rotate-45" />
            
            <Badge variant="outline" className="mb-6 border-primary/30 text-primary">
              Наши проекты
            </Badge>
            <h1 className="text-4xl md:text-6xl font-display font-bold mb-6">
              <span className="gradient-gold-text">Портфолио</span> работ
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Более 50 успешных проектов по всей России — от веб-разработки до комплексного маркетинга
            </p>
            
            {/* Bottom decorative line */}
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-3">
              <div className="w-16 h-[1px] bg-gradient-to-r from-transparent to-primary/30" />
              <div className="w-1.5 h-1.5 bg-primary/40 rotate-45" />
              <div className="w-16 h-[1px] bg-gradient-to-l from-transparent to-primary/30" />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
            <StatCard value={50} suffix="+" label="Проектов" />
            <StatCard value={30} suffix="+" label="Клиентов" />
            <StatCard value={5} suffix="" label="Лет опыта" />
            <StatCard value={98} suffix="%" label="Довольных" />
          </div>

          {/* Featured Projects */}
          <div className="mb-16">
            <h2 className="text-2xl font-display font-semibold mb-8 flex items-center gap-3">
              <span className="w-8 h-[1px] bg-primary" />
              Избранные проекты
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              {projects.filter(p => p.featured).map((project, i) => (
                <FeaturedProjectCard key={i} project={project} index={i} />
              ))}
            </div>
          </div>

          {/* All Projects Grid */}
          <div>
            <h2 className="text-2xl font-display font-semibold mb-8 flex items-center gap-3">
              <span className="w-8 h-[1px] bg-primary" />
              Все проекты
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.filter(p => !p.featured).map((project, i) => (
                <ProjectCard key={i} project={project} index={i} />
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="mt-24 text-center">
            <div className="luxury-card p-12 rounded-sm max-w-3xl mx-auto">
              <h3 className="text-2xl md:text-3xl font-display font-semibold mb-4">
                Хотите стать <span className="gradient-gold-text">следующим</span>?
              </h3>
              <p className="text-muted-foreground mb-8">
                Обсудим ваш проект и создадим решение, которое работает
              </p>
              <Button variant="hero" size="lg" asChild>
                <a href="/#contact">Обсудить проект</a>
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

const FeaturedProjectCard = ({ project, index }: { project: Project; index: number }) => {
  const [ref, isInView] = useInView<HTMLAnchorElement>({ threshold: 0.1 });
  
  return (
    <a 
      ref={ref}
      href={project.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`group block luxury-card p-8 rounded-sm transition-all duration-500 hover:glow-subtle
        ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      style={{ transitionDelay: `${index * 150}ms` }}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-display font-semibold group-hover:text-primary transition-colors mb-1">
            {project.title}
          </h3>
          {project.location && (
            <p className="text-sm text-muted-foreground">{project.location}</p>
          )}
        </div>
        <ExternalLink className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
      
      <p className="text-muted-foreground mb-6 leading-relaxed">
        {project.description}
      </p>
      
      <div className="flex flex-wrap gap-2 mb-6">
        {project.tags.map((tag, i) => (
          <Badge 
            key={i} 
            variant="outline" 
            className="border-border text-xs flex items-center gap-1"
          >
            {tagIcons[tag]}
            {tag}
          </Badge>
        ))}
      </div>
      
      {(project.price || project.priceAlt) && (
        <div className="flex gap-3 pt-4 border-t border-border">
          {project.price && (
            <span className="text-sm font-medium text-primary">{project.price}</span>
          )}
          {project.priceAlt && (
            <span className="text-sm text-muted-foreground">{project.priceAlt}</span>
          )}
        </div>
      )}
    </a>
  );
};

const ProjectCard = ({ project, index }: { project: Project; index: number }) => {
  const [ref, isInView] = useInView<HTMLAnchorElement>({ threshold: 0.1 });
  
  return (
    <a 
      ref={ref}
      href={project.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`group block luxury-card p-6 rounded-sm transition-all duration-500 hover:border-primary/40
        ${isInView ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-6 scale-95'}`}
      style={{ transitionDelay: `${(index % 3) * 100}ms` }}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold group-hover:text-primary transition-colors text-sm mb-0.5">
            {project.title}
          </h3>
          {project.location && (
            <p className="text-xs text-muted-foreground">{project.location}</p>
          )}
        </div>
        <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
      </div>
      
      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
        {project.description}
      </p>
      
      <div className="flex flex-wrap gap-1.5 mb-4">
        {project.tags.slice(0, 3).map((tag, i) => (
          <Badge 
            key={i} 
            variant="outline" 
            className="border-border text-[10px] px-2 py-0"
          >
            {tag}
          </Badge>
        ))}
      </div>
      
      {project.price && (
        <div className="text-xs font-medium text-primary">
          {project.price}
        </div>
      )}
    </a>
  );
};

const StatCard = ({ value, suffix, label }: { value: number; suffix: string; label: string }) => {
  const { ref, displayValue } = useCountUp({ end: value, suffix, duration: 2000 });
  
  return (
    <div ref={ref} className="text-center p-6 luxury-card rounded-sm">
      <div className="text-3xl md:text-4xl font-display font-bold gradient-gold-text mb-2">
        {displayValue}
      </div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
};

export default Portfolio;

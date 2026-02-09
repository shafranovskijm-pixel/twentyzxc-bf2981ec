import { useInView } from "@/hooks/use-in-view";
import { cn } from "@/lib/utils";

interface TimelineItem {
  year: string;
  title: string;
  description: string;
}

const timelineData: TimelineItem[] = [
  {
    year: "2018",
    title: "Основание ООО «ЦКЭ»",
    description: "Регистрация компании ООО «Центр квалификации и экспертиз». Работа в роли генерального директора, создание первого сайта ckevl.ru."
  },
  {
    year: "2020",
    title: "Образовательный фокус",
    description: "Улучшение платформы Moodle, большой упор на образовательную деятельность. Автоматизация бизнес-процессов."
  },
  {
    year: "2024",
    title: "Запуск 24ZXC",
    description: "Регистрация ИП. Запуск бренда 24ZXC, добавление рекламных услуг и комплексного продвижения в digital."
  },
  {
    year: "2025",
    title: "Премиальный сегмент",
    description: "Фокус на luxury-проектах. Разработка дизайн-системы, лицензирование образовательной деятельности."
  }
];

const TimelineItem = ({ item, index }: { item: TimelineItem; index: number }) => {
  const [ref, isInView] = useInView<HTMLDivElement>({ threshold: 0.3 });
  const isLeft = index % 2 === 0;
  
  return (
    <div 
      ref={ref}
      className={cn(
        "relative flex items-center gap-8 md:gap-16",
        isLeft ? "md:flex-row" : "md:flex-row-reverse",
        "flex-col md:text-left text-center"
      )}
    >
      {/* Content Card */}
      <div 
        className={cn(
          "flex-1 transition-all duration-700",
          isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
          isLeft ? "md:text-right" : "md:text-left"
        )}
        style={{ transitionDelay: `${index * 150}ms` }}
      >
        <div className={cn(
          "luxury-card p-6 md:p-8 rounded-lg inline-block",
          isLeft ? "md:ml-auto" : "md:mr-auto"
        )}>
          <div className="text-3xl md:text-4xl font-display font-bold gradient-gold-text mb-2">
            {item.year}
          </div>
          <h3 className="text-xl font-display font-semibold mb-2">{item.title}</h3>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
            {item.description}
          </p>
        </div>
      </div>
      
      {/* Center Line & Dot */}
      <div className="relative flex flex-col items-center">
        <div 
          className={cn(
            "w-4 h-4 rounded-full bg-primary border-4 border-background shadow-[0_0_20px_hsl(45_80%_55%/0.5)] z-10 transition-all duration-500",
            isInView ? "scale-100" : "scale-0"
          )}
          style={{ transitionDelay: `${index * 150 + 200}ms` }}
        />
        {/* Pulse effect */}
        <div 
          className={cn(
            "absolute w-8 h-8 rounded-full bg-primary/30 animate-ping",
            isInView ? "opacity-100" : "opacity-0"
          )}
          style={{ animationDuration: '2s' }}
        />
      </div>
      
      {/* Spacer for alignment */}
      <div className="flex-1 hidden md:block" />
    </div>
  );
};

const TimelineSection = () => {
  const [headerRef, headerInView] = useInView<HTMLDivElement>({ threshold: 0.3 });
  
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-secondary/20" />
      
      <div className="container px-4 relative z-10">
        {/* Header */}
        <div 
          ref={headerRef}
          className={cn(
            "text-center mb-16 transition-all duration-700",
            headerInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}
        >
          <span className="text-primary text-sm tracking-[0.3em] uppercase mb-4 block">История</span>
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">
            Путь к <span className="gradient-gold-text">совершенству</span>
          </h2>
          <div className="divider-gold w-24 mx-auto mt-6" />
        </div>
        
        {/* Timeline */}
        <div className="relative max-w-4xl mx-auto">
          {/* Central Line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-primary/50 via-primary/30 to-transparent hidden md:block -translate-x-1/2" />
          
          {/* Items */}
          <div className="space-y-12 md:space-y-0">
            {timelineData.map((item, index) => (
              <div key={item.year} className="md:py-8">
                <TimelineItem item={item} index={index} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TimelineSection;

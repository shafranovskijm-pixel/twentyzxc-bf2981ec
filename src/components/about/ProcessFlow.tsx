import { useState } from "react";
import { Search, Lightbulb, Palette, Code, Rocket, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useInView } from "@/hooks/use-in-view";

interface ProcessStep {
  icon: typeof Search;
  title: string;
  shortDesc: string;
  fullDesc: string;
}

const processSteps: ProcessStep[] = [
  {
    icon: Search,
    title: "Анализ",
    shortDesc: "Исследование рынка",
    fullDesc: "Глубокий анализ вашего бизнеса, конкурентов и целевой аудитории. Определение целей и KPI проекта."
  },
  {
    icon: Lightbulb,
    title: "Концепция",
    shortDesc: "Стратегия и идея",
    fullDesc: "Разработка уникальной концепции, структуры проекта и пользовательских сценариев."
  },
  {
    icon: Palette,
    title: "Дизайн",
    shortDesc: "Визуальное решение",
    fullDesc: "Создание премиального дизайна, UI-кита и интерактивных прототипов с учётом бренда."
  },
  {
    icon: Code,
    title: "Разработка",
    shortDesc: "Реализация",
    fullDesc: "Чистый код, современные технологии, адаптивность и высокая производительность."
  },
  {
    icon: Rocket,
    title: "Запуск",
    shortDesc: "Выход в свет",
    fullDesc: "Тестирование, оптимизация, запуск и передача проекта с полной документацией."
  }
];

const ProcessFlow = () => {
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [sectionRef, isInView] = useInView<HTMLDivElement>({ threshold: 0.2 });

  const handleStepClick = (index: number) => {
    setActiveStep(activeStep === index ? null : index);
  };

  return (
    <section className="py-24 relative" ref={sectionRef}>
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/3 rounded-full blur-3xl" />
      
      <div className="container px-4 relative z-10">
        {/* Header */}
        <div 
          className={cn(
            "text-center mb-16 transition-all duration-700",
            isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}
        >
          <span className="text-primary text-sm tracking-[0.3em] uppercase mb-4 block">Процесс</span>
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">
            Как мы <span className="gradient-gold-text">работаем</span>
          </h2>
          <div className="divider-gold w-24 mx-auto mt-6" />
        </div>
        
        {/* Process Steps */}
        <div className="max-w-5xl mx-auto">
          {/* Desktop: Horizontal Flow */}
          <div className="hidden md:block">
            <div className="flex items-start justify-between relative">
              {/* Connection Line */}
              <div className="absolute top-10 left-0 right-0 h-px bg-gradient-to-r from-primary/30 via-primary/50 to-primary/30" />
              
              {processSteps.map((step, index) => (
                <div 
                  key={step.title}
                  className={cn(
                    "relative flex flex-col items-center text-center flex-1 px-2 transition-all duration-700",
                    isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                  )}
                  style={{ transitionDelay: `${index * 100 + 200}ms` }}
                >
                  {/* Step Number & Icon */}
                  <button 
                    onClick={() => handleStepClick(index)}
                    className={cn(
                      "relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500 cursor-pointer",
                      activeStep === index 
                        ? "bg-primary/20 scale-110 shadow-[0_0_40px_hsl(45_80%_55%/0.4)]" 
                        : "bg-card border border-primary/20 hover:border-primary/40 hover:bg-primary/5"
                    )}
                  >
                    <step.icon className={cn(
                      "w-8 h-8 transition-all duration-300",
                      activeStep === index ? "text-primary scale-110" : "text-primary/70"
                    )} />
                    
                    {/* Step number badge */}
                    <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                      {index + 1}
                    </div>
                  </button>
                  
                  {/* Title */}
                  <h3 className="text-lg font-display font-semibold mt-4 mb-1">{step.title}</h3>
                  <p className="text-muted-foreground text-sm">{step.shortDesc}</p>
                  
                  {/* Expand indicator */}
                  <ChevronDown className={cn(
                    "w-4 h-4 text-primary/50 mt-2 transition-transform duration-300",
                    activeStep === index && "rotate-180"
                  )} />
                </div>
              ))}
            </div>
            
            {/* Expanded Description Panel */}
            <div 
              className={cn(
                "mt-8 transition-all duration-500 overflow-hidden",
                activeStep !== null ? "opacity-100 max-h-40" : "opacity-0 max-h-0"
              )}
            >
              {activeStep !== null && (
                <div className="luxury-card p-6 rounded-lg relative">
                  <button 
                    onClick={() => setActiveStep(null)}
                    className="absolute top-4 right-4 text-muted-foreground hover:text-primary transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      {(() => {
                        const Step = processSteps[activeStep];
                        return <Step.icon className="w-6 h-6 text-primary" />;
                      })()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-primary text-xs font-bold">ЭТАП {activeStep + 1}</span>
                        <h4 className="text-lg font-display font-semibold">{processSteps[activeStep].title}</h4>
                      </div>
                      <p className="text-muted-foreground leading-relaxed">{processSteps[activeStep].fullDesc}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Mobile: Vertical Flow */}
          <div className="md:hidden space-y-6">
            {processSteps.map((step, index) => (
              <div 
                key={step.title}
                className={cn(
                  "relative flex gap-4 transition-all duration-700",
                  isInView ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
                )}
                style={{ transitionDelay: `${index * 100 + 200}ms` }}
              >
                {/* Left: Line & Dot */}
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center flex-shrink-0">
                    <step.icon className="w-6 h-6 text-primary" />
                  </div>
                  {index < processSteps.length - 1 && (
                    <div className="w-px h-full bg-gradient-to-b from-primary/50 to-transparent min-h-[40px]" />
                  )}
                </div>
                
                {/* Right: Content */}
                <div className="flex-1 pb-6">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-primary text-xs font-bold">0{index + 1}</span>
                    <h3 className="text-lg font-display font-semibold">{step.title}</h3>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed">{step.fullDesc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProcessFlow;

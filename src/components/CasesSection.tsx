import { ArrowUpRight, TrendingUp, Target, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AnimatedSection from "@/components/AnimatedSection";

// Tiny palm leaf accent
const PalmAccent = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M12 2c-1 3-3 5-6 6 2 1 4 3 5 5-1-1-3-2-5-2 1 2 2 5 2 8 1-3 2-5 4-7 0 2-1 4-2 5 2-1 4-3 5-5-1 0-2 0-3 1 1-2 2-4 2-7-2 1-3 3-4 5 0-3 1-6 2-9z" />
  </svg>
);

interface Case {
  title: string;
  location?: string;
  metric: string;
  metricLabel: string;
  tags: string[];
  problem: string;
  solution: string;
  result: string;
  url: string;
  external?: boolean;
}

const CASES: Case[] = [
  {
    title: "Синтагма",
    location: "Учебный центр • LMS",
    metric: "−80%",
    metricLabel: "ручной работы",
    tags: ["LMS", "ФРДО", "Облако"],
    problem: "Учебный центр тонул в ручной выдаче удостоверений и отчётности.",
    solution: "Облачная LMS с автоматизацией обучения и интеграцией с ФИС ФРДО.",
    result: "1000+ слушателей в месяц, отчётность в один клик, нулевые потери данных.",
    url: "https://синтагма.рф",
    external: true,
  },
  {
    title: "SpinRide",
    location: "Велосипеды и самокаты",
    metric: "×2",
    metricLabel: "месяца до окупаемости",
    tags: ["E-commerce", "Яндекс Директ", "800+ SKU"],
    problem: "Магазин велоспорта без онлайн-продаж и трафика.",
    solution: "Каталог на 800+ позиций, сезонные темы, настройка Яндекс Директ под сегменты.",
    result: "Окупаемость рекламы за 2 месяца, поддержка 5 000 ₽/мес.",
    url: "/projects/spinride",
  },
  {
    title: "Анна Чмулева",
    location: "Риелтор • Личный бренд",
    metric: "24/7",
    metricLabel: "автоблог + CRM",
    tags: ["Сайт", "ИИ-помощник", "CRM"],
    problem: "Эксперту по недвижимости нужен бренд и постоянный поток заявок.",
    solution: "Премиальный сайт + ИИ-генератор статей + CRM входящих обращений.",
    result: "Блог пишется автоматически, рост входящих заявок и узнаваемости.",
    url: "/projects/chmuleva",
  },
  {
    title: "Flowrish",
    location: "Цветочный магазин",
    metric: "7",
    metricLabel: "сезонных тем без участия",
    tags: ["E-commerce", "Админка", "Авто-темы"],
    problem: "Сезонный магазин нуждался в гибком оформлении под праздники.",
    solution: "E-commerce с админкой и 7 праздничными темами на авто-таймере.",
    result: "Продажи 24/7, переоформление витрины без участия владельца.",
    url: "/projects/flowrish",
  },
  {
    title: "УЦ «Статус»",
    location: "Образование • Под ключ",
    metric: "65k",
    metricLabel: "₽/год за всё сопровождение",
    tags: ["LMS", "ФРДО", "Лицензирование"],
    problem: "Сложный переезд учебного центра с ФРДО, LMS и лицензированием.",
    solution: "Полное сопровождение под ключ: миграция, документы, обучение.",
    result: "Запуск без простоев и потерь, фиксированная цена 65 000 ₽/год.",
    url: "/projects/status",
  },
];

const CaseCard = ({ data }: { data: Case }) => {
  const Wrapper = data.external ? "a" : ("a" as const);
  const linkProps = data.external
    ? { href: data.url, target: "_blank", rel: "noopener noreferrer" }
    : { href: data.url };

  return (
    <div className="relative tropical-card warm-card-glow p-6 md:p-8 group overflow-hidden">
      {/* Soft palm decoration */}
      <PalmAccent className="absolute -top-4 -right-4 w-24 h-24 text-amber-500/[0.07] rotate-12 pointer-events-none" />

      <div className="relative grid md:grid-cols-[auto_1fr] gap-6 md:gap-8 items-start">
        {/* Metric block */}
        <div className="flex md:flex-col items-center md:items-start gap-3 md:min-w-[140px]">
          <div className="text-5xl md:text-6xl font-display font-bold gradient-gold-text gold-glow-text leading-none">
            {data.metric}
          </div>
          <div className="text-xs md:text-sm text-muted-foreground uppercase tracking-wider md:max-w-[140px]">
            {data.metricLabel}
          </div>
        </div>

        {/* Content */}
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-2">
            <h3 className="text-xl md:text-2xl font-display font-bold">{data.title}</h3>
            {data.location && (
              <span className="text-sm text-muted-foreground italic">{data.location}</span>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 mb-5">
            {data.tags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="text-xs bg-amber-500/5 border-amber-500/25 text-primary/90"
              >
                {tag}
              </Badge>
            ))}
          </div>

          <div className="space-y-2.5 mb-5 text-sm">
            <CaseRow icon={<Target className="w-4 h-4" />} label="Задача" text={data.problem} />
            <CaseRow icon={<Sparkles className="w-4 h-4" />} label="Решение" text={data.solution} />
            <CaseRow icon={<TrendingUp className="w-4 h-4" />} label="Результат" text={data.result} highlight />
          </div>

          <Button variant="heroOutline" size="sm" asChild>
            <a {...linkProps}>
              Открыть кейс
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
};

const CaseRow = ({
  icon,
  label,
  text,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  text: string;
  highlight?: boolean;
}) => (
  <div className="flex items-start gap-3">
    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30 flex items-center justify-center text-primary shrink-0 mt-0.5">
      {icon}
    </div>
    <div className="min-w-0">
      <div className="text-[11px] uppercase tracking-wider text-primary/80 font-medium mb-0.5">
        {label}
      </div>
      <p className={`leading-relaxed ${highlight ? "text-foreground font-medium" : "text-muted-foreground"}`}>
        {text}
      </p>
    </div>
  </div>
);

const CasesSection = () => {
  return (
    <section id="cases" className="py-32 relative overflow-hidden">
      {/* Soft warm sunset wash */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-950/10 to-transparent pointer-events-none" />
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
      </div>

      <div className="container relative z-10 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-4 mb-6">
              <PalmAccent className="w-5 h-5 text-amber-500/70" />
              <span className="text-sm tracking-[0.3em] uppercase text-primary italic font-display">
                Реальные результаты
              </span>
              <PalmAccent className="w-5 h-5 text-amber-500/70 scale-x-[-1]" />
            </div>
            <h2 className="text-4xl md:text-6xl font-display font-bold mb-6 gold-glow-text">
              <span className="gradient-gold-text">Кейсы</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Реальные проекты — реальные метрики. Каждый кейс — это задача, найденное решение и измеримый результат.
            </p>
          </div>

          <div className="flex flex-col gap-6">
            {CASES.map((c, index) => (
              <AnimatedSection key={c.title} delay={index * 120} direction="up">
                <CaseCard data={c} />
              </AnimatedSection>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CasesSection;

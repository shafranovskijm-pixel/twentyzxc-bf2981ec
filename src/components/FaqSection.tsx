import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Diamond, HelpCircle } from "lucide-react";

const faqs = [
  {
    question: "Сколько стоит разработка сайта?",
    answer: "Стоимость зависит от типа проекта. Лендинг — от 30 000 ₽, корпоративный сайт — от 50 000 ₽, интернет-магазин — от 80 000 ₽. Точную стоимость рассчитаем после обсуждения задачи."
  },
  {
    question: "Какие сроки разработки?",
    answer: "Лендинг — 5-7 дней, корпоративный сайт — 2-3 недели, интернет-магазин — от 1 месяца. Сроки зависят от сложности проекта и оперативности согласования."
  },
  {
    question: "Что входит в стоимость?",
    answer: "Дизайн, адаптивная вёрстка, базовая SEO-оптимизация, подключение аналитики, обучение работе с сайтом и 30 дней бесплатной поддержки после запуска."
  },
  {
    question: "Работаете ли вы по договору?",
    answer: "Да, мы работаем официально как ИП. Заключаем договор, выставляем счёт и предоставляем закрывающие документы. Возможна оплата в рассрочку."
  },
  {
    question: "Можете ли доработать существующий сайт?",
    answer: "Да, берёмся за доработку и поддержку действующих сайтов. Проведём аудит, предложим улучшения и реализуем необходимый функционал."
  },
  {
    question: "Что такое ФРДО и зачем он нужен?",
    answer: "ФИС ФРДО — федеральный реестр документов об образовании. Все лицензированные учебные центры обязаны вносить туда данные о выданных дипломах и удостоверениях. Мы помогаем с настройкой и ведением реестра."
  },
];

const FaqSection = () => {
  return (
    <section id="faq" className="py-32 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,hsl(45_80%_55%/0.08),transparent_50%)]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-32 bg-gradient-to-b from-primary/30 to-transparent" />
      
      {/* Decorative corner lines */}
      <svg className="absolute top-20 right-10 w-24 h-24 opacity-20" viewBox="0 0 100 100">
        <path d="M 70 0 L 100 0 L 100 30" fill="none" stroke="hsl(45 80% 55%)" strokeWidth="1" />
      </svg>
      <svg className="absolute bottom-20 left-10 w-24 h-24 opacity-20" viewBox="0 0 100 100">
        <path d="M 0 70 L 0 100 L 30 100" fill="none" stroke="hsl(45 80% 55%)" strokeWidth="1" />
      </svg>

      <div className="container relative z-10 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-4 mb-6">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-primary/50" />
              <HelpCircle className="w-5 h-5 text-primary" />
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-primary/50" />
            </div>
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
              Частые <span className="gradient-gold-text">вопросы</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Ответы на популярные вопросы о наших услугах
            </p>
          </div>

          {/* FAQ Accordion */}
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="luxury-card rounded-sm border-none px-6 data-[state=open]:border-primary/30 transition-all duration-300"
              >
                <AccordionTrigger className="text-left py-6 hover:no-underline group">
                  <div className="flex items-start gap-4">
                    <span className="text-primary/40 font-display font-bold text-lg group-hover:text-primary transition-colors">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="font-semibold group-hover:text-primary transition-colors">
                      {faq.question}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-6 pl-12 text-muted-foreground leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {/* Bottom CTA */}
          <div className="mt-12 text-center">
            <p className="text-muted-foreground mb-4">
              Не нашли ответ на свой вопрос?
            </p>
            <a 
              href="#contact" 
              className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-medium"
            >
              <Diamond className="w-4 h-4" />
              Напишите нам — ответим лично
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FaqSection;

import { useState } from "react";
import { Mail, Phone, Send, Diamond, HelpCircle, ChevronDown } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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

const Footer = () => {
  const [isFaqExpanded, setIsFaqExpanded] = useState(false);

  return (
    <footer className="border-t border-border">
      {/* FAQ Section */}
      <div className="py-12 border-b border-border/50">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto">
            {/* Collapsible Header */}
            <button 
              onClick={() => setIsFaqExpanded(!isFaqExpanded)}
              className="w-full text-center group cursor-pointer"
            >
              <div className="inline-flex items-center gap-4 mb-4">
                <div className="h-px w-12 bg-gradient-to-r from-transparent to-primary/50" />
                <HelpCircle className="w-5 h-5 text-primary" />
                <div className="h-px w-12 bg-gradient-to-l from-transparent to-primary/50" />
              </div>
              <h2 className="text-2xl md:text-3xl font-display font-bold mb-3 group-hover:text-primary/90 transition-colors">
                Частые <span className="gradient-gold-text">вопросы</span>
              </h2>
              <p className="text-muted-foreground text-sm mb-4">
                Ответы на популярные вопросы о наших услугах
              </p>
              <ChevronDown 
                className={`w-5 h-5 text-primary mx-auto transition-transform duration-300 ${isFaqExpanded ? 'rotate-180' : ''}`} 
              />
            </button>

            {/* Collapsible Content */}
            <div 
              className={`overflow-hidden transition-all duration-500 ease-in-out ${
                isFaqExpanded ? 'max-h-[2000px] opacity-100 mt-8' : 'max-h-0 opacity-0 mt-0'
              }`}
            >
              <Accordion type="single" collapsible className="space-y-3">
                {faqs.map((faq, index) => (
                  <AccordionItem
                    key={index}
                    value={`item-${index}`}
                    className="bg-card/50 rounded-sm border border-border/30 px-5 data-[state=open]:border-primary/30 transition-all duration-300"
                  >
                    <AccordionTrigger className="text-left py-4 hover:no-underline group text-sm">
                      <div className="flex items-start gap-3">
                        <span className="text-primary/40 font-display font-bold group-hover:text-primary transition-colors">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <span className="font-medium group-hover:text-primary transition-colors">
                          {faq.question}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4 pl-9 text-muted-foreground text-sm leading-relaxed">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="py-16">
        <div className="container px-4">
          <div className="max-w-6xl mx-auto">
            {/* Top section */}
            <div className="grid md:grid-cols-2 gap-12 mb-16">
              {/* Brand */}
              <div>
                <a href="#" className="text-3xl font-display font-bold gradient-gold-text mb-6 inline-block">
                  24ZXC
                </a>
                <p className="text-muted-foreground max-w-sm mb-6 leading-relaxed">
                  Премиальные цифровые решения для бизнеса. Веб-разработка, реклама и полный спектр услуг.
                </p>
                <div className="flex gap-3">
                  <SocialLink href="https://t.me/your_telegram" icon={<Send className="w-4 h-4" />} />
                  <SocialLink href="mailto:info@24zxc.ru" icon={<Mail className="w-4 h-4" />} />
                  <SocialLink href="tel:+7XXXXXXXXXX" icon={<Phone className="w-4 h-4" />} />
                </div>
              </div>

              {/* Links grid */}
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h4 className="text-sm font-semibold tracking-widest uppercase text-primary mb-6">Услуги</h4>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li><a href="#webdev" className="hover:text-foreground transition-colors">Веб-разработка</a></li>
                    <li><a href="#advertising" className="hover:text-foreground transition-colors">Реклама</a></li>
                    <li><a href="#services" className="hover:text-foreground transition-colors">Каталог услуг</a></li>
                    <li><a href="#" className="hover:text-foreground transition-colors">Синтагма</a></li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-sm font-semibold tracking-widest uppercase text-primary mb-6">Компания</h4>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li><a href="#" className="hover:text-foreground transition-colors">О нас</a></li>
                    <li><a href="#" className="hover:text-foreground transition-colors">Портфолио</a></li>
                    <li><a href="#contact" className="hover:text-foreground transition-colors">Контакты</a></li>
                    <li><a href="#" className="hover:text-foreground transition-colors">Политика</a></li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="divider-gold mb-8" />

            {/* Bottom */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Diamond className="w-3 h-3 text-primary" />
                <span>© 2024 24ZXC. Все права защищены.</span>
              </div>
              <div>Премиум решения по всей России</div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

const SocialLink = ({ href, icon }: { href: string; icon: React.ReactNode }) => (
  <a 
    href={href} 
    className="w-10 h-10 rounded-sm border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-all"
  >
    {icon}
  </a>
);

export default Footer;

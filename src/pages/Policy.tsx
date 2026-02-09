import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AnimatedSection from "@/components/AnimatedSection";
import { motion } from "framer-motion";
import { Shield, FileText, Lock, Eye, Database, Mail } from "lucide-react";

const Policy = () => {
  const sections = [
    {
      icon: Database,
      title: "Сбор информации",
      content: `Мы собираем информацию, которую вы предоставляете нам напрямую, включая:
        • Контактные данные (имя, email, телефон)
        • Информацию о проекте при заполнении форм
        • Данные для выставления счетов
        
        Автоматически собираемые данные включают IP-адрес, тип браузера и устройства для улучшения работы сайта.`
    },
    {
      icon: Eye,
      title: "Использование данных",
      content: `Собранная информация используется для:
        • Предоставления запрошенных услуг
        • Связи с вами по вопросам проекта
        • Улучшения качества обслуживания
        • Отправки важных уведомлений
        
        Мы не продаём и не передаём ваши данные третьим лицам без вашего согласия.`
    },
    {
      icon: Lock,
      title: "Защита данных",
      content: `Мы применяем современные меры безопасности:
        • Шифрование данных при передаче (SSL/TLS)
        • Защищённое хранение на серверах
        • Ограниченный доступ к персональным данным
        • Регулярные проверки безопасности
        
        Ваши данные защищены в соответствии с ФЗ-152 «О персональных данных».`
    },
    {
      icon: FileText,
      title: "Cookies и аналитика",
      content: `Сайт использует cookies для:
        • Запоминания ваших предпочтений
        • Анализа посещаемости (Яндекс.Метрика)
        • Улучшения пользовательского опыта
        
        Вы можете отключить cookies в настройках браузера, однако это может повлиять на функциональность сайта.`
    },
    {
      icon: Shield,
      title: "Ваши права",
      content: `Вы имеете право:
        • Запросить информацию о хранимых данных
        • Потребовать исправления неточных данных
        • Отозвать согласие на обработку
        • Потребовать удаления данных
        
        Для реализации прав свяжитесь с нами по контактам ниже.`
    },
    {
      icon: Mail,
      title: "Контакты",
      content: `По вопросам политики конфиденциальности:
        • Email: 24@24zxc.ru
        • Telegram: @Aliencorso
        
        Мы ответим на ваш запрос в течение 30 дней.`
    }
  ];

  return (
    <>
      <Helmet>
        <title>Политика конфиденциальности | 24ZXC</title>
        <meta name="description" content="Политика конфиденциальности 24ZXC. Узнайте, как мы собираем, используем и защищаем ваши персональные данные." />
        <link rel="canonical" href="https://24zxc.ru/policy" />
      </Helmet>
      <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Dot grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--primary)) 1px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
        />
        
        {/* Floating gradient orbs */}
        <motion.div
          className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full"
          style={{
            background: "radial-gradient(circle, hsl(45 80% 55% / 0.08) 0%, transparent 70%)",
          }}
          animate={{
            x: [0, 30, 0],
            y: [0, -20, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute top-1/2 -left-40 w-[400px] h-[400px] rounded-full"
          style={{
            background: "radial-gradient(circle, hsl(45 80% 55% / 0.05) 0%, transparent 70%)",
          }}
          animate={{
            x: [0, 20, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        
        {/* Corner decorative lines */}
        <div className="absolute top-32 left-8 w-px h-32 bg-gradient-to-b from-primary/20 to-transparent" />
        <div className="absolute top-32 left-8 h-px w-32 bg-gradient-to-r from-primary/20 to-transparent" />
        <div className="absolute bottom-32 right-8 w-px h-32 bg-gradient-to-t from-primary/20 to-transparent" />
        <div className="absolute bottom-32 right-8 h-px w-32 bg-gradient-to-l from-primary/20 to-transparent" />
      </div>
      
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(45_80%_55%/0.08),transparent_60%)]" />
        
        <div className="container px-4 relative z-10">
          <AnimatedSection className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-4 mb-6">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-primary/50" />
              <Shield className="w-6 h-6 text-primary" />
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-primary/50" />
            </div>
            <h1 className="text-4xl md:text-6xl font-display font-bold mb-6">
              Политика <span className="gradient-gold-text">конфиденциальности</span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              Мы заботимся о защите ваших персональных данных и прозрачности их использования
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              Последнее обновление: {new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16 relative z-10">
        <div className="container px-4">
          <div className="max-w-4xl mx-auto space-y-8">
            {sections.map((section, index) => (
              <AnimatedSection key={section.title} delay={index * 100}>
                <div className="luxury-card rounded-lg p-6 md:p-8 hover:border-primary/30 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-primary/10 shrink-0">
                      <section.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl md:text-2xl font-display font-semibold mb-4">
                        {section.title}
                      </h2>
                      <div className="text-muted-foreground whitespace-pre-line leading-relaxed">
                        {section.content}
                      </div>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
          
          {/* Legal disclaimer */}
          <AnimatedSection delay={600} className="max-w-4xl mx-auto mt-12">
            <div className="p-6 rounded-lg border border-primary/20 bg-primary/5 text-center">
              <p className="text-sm text-muted-foreground">
                Используя наш сайт, вы соглашаетесь с данной политикой конфиденциальности. 
                Мы оставляем за собой право вносить изменения в политику с уведомлением на этой странице.
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <Footer />
    </div>
    </>
  );
};

export default Policy;

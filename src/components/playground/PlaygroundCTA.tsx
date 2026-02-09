import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PlaygroundCTAProps {
  onStartCreating: () => void;
}

export const PlaygroundCTA = ({ onStartCreating }: PlaygroundCTAProps) => {
  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-primary/5 rounded-full blur-2xl" />
      </div>
      
      <div className="container px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-6"
          >
            <Sparkles className="w-4 h-4" />
            Бесплатно
          </motion.div>
          
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">
            Попробуй себя разработчиком —{" "}
            <span className="gradient-gold-text">сделай свой первый сайт</span>
          </h2>
          
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            Создай уникальный дизайн в нашем конструкторе с анимациями и эффектами.
            И размести свой сайт на 24zxc.ru/твой-сайт
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="hero"
              size="lg"
              onClick={onStartCreating}
              className="group"
            >
              Начать создание
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="outline" size="lg" asChild>
              <a href="#gallery">Смотреть примеры</a>
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground mt-6">
            Без регистрации • Сохранение по ссылке • Публикация за 24 часа
          </p>
        </motion.div>
      </div>
    </section>
  );
};

import { useState } from "react";
import { Mail, Phone, MapPin, ChevronDown, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useInView } from "@/hooks/use-in-view";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const requisites = [
  { label: "Наименование", value: "ИП Шафрановский Максим Михайлович" },
  { label: "ОГРНИП", value: "324253600042754" },
  { label: "ИНН", value: "253615392404" },
  { label: "Дата регистрации", value: "08 мая 2024 г." },
  { label: "Основной вид деятельности", value: "63.11 — Деятельность по обработке данных, предоставление услуг по размещению информации" }
];

const CollapsibleRequisites = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [sectionRef, isInView] = useInView<HTMLDivElement>({ threshold: 0.2 });

  return (
    <section ref={sectionRef} className="py-20 relative">
      <div className="container px-4">
        <div 
          className={cn(
            "text-center mb-8 transition-all duration-700",
            isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}
        >
          <span className="text-primary text-sm tracking-[0.3em] uppercase mb-4 block">Юридическая информация</span>
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Реквизиты</h2>
          <div className="divider-gold w-24 mx-auto" />
        </div>
        
        <div 
          className={cn(
            "max-w-3xl mx-auto transition-all duration-700",
            isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}
          style={{ transitionDelay: '200ms' }}
        >
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <div className="luxury-card rounded-lg overflow-hidden">
              {/* Collapsed Preview - Contact Info */}
              <div className="p-6 md:p-8">
                <div className="grid sm:grid-cols-3 gap-6">
                  <a 
                    href="mailto:shafranovskij.m@gmail.com" 
                    className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Mail className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-sm break-all">shafranovskij.m@gmail.com</span>
                  </a>
                  <a 
                    href="tel:89147213424" 
                    className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Phone className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-sm">+7 (914) 721-34-24</span>
                  </a>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-sm">Приморский край, г. Владивосток</span>
                  </div>
                </div>
              </div>
              
              {/* Toggle Button */}
              <CollapsibleTrigger asChild>
                <button className="w-full py-4 px-6 border-t border-border/50 flex items-center justify-center gap-2 text-muted-foreground hover:text-primary transition-colors group">
                  <FileText className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {isOpen ? "Скрыть реквизиты" : "Показать реквизиты"}
                  </span>
                  <ChevronDown className={cn(
                    "w-4 h-4 transition-transform duration-300",
                    isOpen && "rotate-180"
                  )} />
                </button>
              </CollapsibleTrigger>
              
              {/* Collapsible Content */}
              <CollapsibleContent>
                <div className="px-6 md:px-8 pb-8">
                  <div className="divider-gold mb-6" />
                  <div className="space-y-4">
                    {requisites.map((item) => (
                      <div 
                        key={item.label} 
                        className="flex flex-col sm:flex-row sm:items-start gap-2 pb-4 border-b border-border/50 last:border-0 last:pb-0"
                      >
                        <span className="text-muted-foreground text-sm min-w-[200px] uppercase tracking-wider">
                          {item.label}
                        </span>
                        <span className="font-medium">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        </div>
      </div>
    </section>
  );
};

export default CollapsibleRequisites;

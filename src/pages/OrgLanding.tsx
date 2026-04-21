import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Helmet } from "react-helmet-async";
import { Loader2, Phone, Mail, Send } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const OrgLanding = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: org, isLoading, error } = useQuery({
    queryKey: ["org-landing", slug],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_org_by_slug", { _slug: slug! });
      if (error) throw error;
      return (data && data[0]) || null;
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-white/50" /></div>;
  }

  if (!org) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Страница не найдена</h1>
          <p className="text-white/60">Лендинг не существует или ещё не опубликован</p>
        </div>
      </div>
    );
  }

  const config = (org.landing_config as any) || {};
  const accent = config.accentColor || "#d4be37";
  const products = config.products || [];

  return (
    <>
      <Helmet>
        <title>{config.heroTitle || org.name}</title>
        <meta name="description" content={config.heroSubtitle || ""} />
      </Helmet>
      <div className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden" style={{ "--accent": accent } as React.CSSProperties}>
        {/* Hero */}
        <HeroSection config={config} orgName={org.name || ""} accent={accent} />

        {/* Marquee */}
        {config.marqueeText && <MarqueeStrip text={config.marqueeText} accent={accent} />}

        {/* Products */}
        {products.length > 0 && <ProductsSection products={products} accent={accent} />}

        {/* Contact */}
        <ContactSection config={config} accent={accent} orgId={org.id} />

        {/* Footer */}
        <footer className="py-8 border-t border-white/10 text-center text-white/40 text-sm">
          © {new Date().getFullYear()} {org.name}. Powered by 24ZXC
        </footer>
      </div>
    </>
  );
};

const HeroSection = ({ config, orgName, accent }: { config: any; orgName: string; accent: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section ref={ref} className="relative h-screen flex items-center justify-center overflow-hidden">
      {config.heroImage && (
        <motion.div className="absolute inset-0 z-0" style={{ y }}>
          <img src={config.heroImage} alt="" className="w-full h-[120%] object-cover" />
          <div className="absolute inset-0 bg-black/60" />
        </motion.div>
      )}
      {!config.heroImage && (
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-[#111] to-[#0a0a0a]" />
          <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 50% 50%, ${accent}15, transparent 70%)` }} />
        </div>
      )}
      <motion.div className="relative z-10 text-center px-6 max-w-4xl" style={{ opacity }}>
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tight mb-6"
          style={{ textShadow: `0 0 60px ${accent}40` }}
        >
          {config.heroTitle || orgName}
        </motion.h1>
        {config.heroSubtitle && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed"
          >
            {config.heroSubtitle}
          </motion.p>
        )}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-10"
        >
          <Button
            size="lg"
            className="text-base px-8 py-6 rounded-full"
            style={{ background: accent, color: "#000" }}
            onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
          >
            Связаться
          </Button>
        </motion.div>
      </motion.div>
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-2"
        >
          <div className="w-1 h-2 rounded-full bg-white/50" />
        </motion.div>
      </div>
    </section>
  );
};

const MarqueeStrip = ({ text, accent }: { text: string; accent: string }) => {
  const items = text.split("✦").map(s => s.trim()).filter(Boolean);
  const repeated = [...items, ...items, ...items, ...items];

  return (
    <div className="py-6 overflow-hidden border-y border-white/10" style={{ background: `${accent}08` }}>
      <motion.div
        className="flex gap-8 whitespace-nowrap"
        animate={{ x: [0, -50 * items.length] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        {repeated.map((item, i) => (
          <span key={i} className="text-sm tracking-[0.3em] uppercase text-white/40 flex items-center gap-8">
            {item}
            <span style={{ color: accent }}>✦</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
};

const ProductsSection = ({ products, accent }: { products: any[]; accent: string }) => {
  return (
    <section className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl sm:text-4xl font-bold text-center mb-16"
        >
          Каталог
        </motion.h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product: any, idx: number) => (
            <motion.div
              key={product.id || idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="group relative rounded-2xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-sm hover:border-white/20 transition-all duration-500"
            >
              {product.image && (
                <div className="aspect-square overflow-hidden">
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                </div>
              )}
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-2">{product.name}</h3>
                {product.description && <p className="text-sm text-white/50 mb-3">{product.description}</p>}
                {product.price && (
                  <span className="text-xl font-bold" style={{ color: accent }}>{product.price}</span>
                )}
              </div>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ background: `radial-gradient(circle at 50% 100%, ${accent}10, transparent 70%)` }} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const ContactSection = ({ config, accent, orgId }: { config: any; accent: string; orgId: string }) => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) return toast.error("Укажите имя");
    setSending(true);
    try {
      await supabase.from("org_clients" as any).insert({
        organization_id: orgId,
        name: name.trim(),
        phone: phone || null,
        notes: message || null,
      } as any);
      toast.success("Заявка отправлена!");
      setName("");
      setPhone("");
      setMessage("");
    } catch {
      toast.error("Ошибка отправки");
    }
    setSending(false);
  };

  return (
    <section id="contact" className="py-20 px-6">
      <div className="max-w-xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl sm:text-4xl font-bold text-center mb-4"
        >
          Свяжитесь с нами
        </motion.h2>

        {(config.contactPhone || config.contactEmail || config.contactTelegram) && (
          <div className="flex flex-wrap justify-center gap-4 mb-10 text-white/50">
            {config.contactPhone && <a href={`tel:${config.contactPhone}`} className="flex items-center gap-1.5 hover:text-white transition-colors"><Phone className="h-4 w-4" />{config.contactPhone}</a>}
            {config.contactEmail && <a href={`mailto:${config.contactEmail}`} className="flex items-center gap-1.5 hover:text-white transition-colors"><Mail className="h-4 w-4" />{config.contactEmail}</a>}
            {config.contactTelegram && <a href={`https://t.me/${config.contactTelegram.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-white transition-colors"><Send className="h-4 w-4" />{config.contactTelegram}</a>}
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-4 p-6 rounded-2xl border border-white/10 bg-white/5"
        >
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ваше имя" className="bg-white/10 border-white/10 text-white placeholder:text-white/30" />
          <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Телефон" className="bg-white/10 border-white/10 text-white placeholder:text-white/30" />
          <Textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Сообщение" rows={3} className="bg-white/10 border-white/10 text-white placeholder:text-white/30" />
          <Button
            onClick={handleSubmit}
            disabled={sending}
            className="w-full rounded-full py-6 text-base font-semibold"
            style={{ background: accent, color: "#000" }}
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Отправить заявку
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default OrgLanding;

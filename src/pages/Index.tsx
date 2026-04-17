import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import WebDevSection from "@/components/WebDevSection";
import PromotionSection from "@/components/PromotionSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";
import { InteractiveParticles, GeometricShapes, TropicalGlows, SectionDivider } from "@/components/decorations";
import { useSiteSettings } from "@/hooks/use-site-settings";

const Index = () => {
  const { settings } = useSiteSettings();

  return (
    <>
      <Helmet>
        <title>{settings.seo_title || "24ZXC — Под ключ. Под пальмами. Сайты, реклама, приложения"}</title>
        <meta name="description" content={settings.seo_description || "Доверьте сайт, рекламу в Яндекс Директ и веб-приложения нам — а сами отдыхайте. Полный цикл премиум-разработки от идеи до запуска."} />
        {settings.seo_keywords && <meta name="keywords" content={settings.seo_keywords} />}
        <link rel="canonical" href="https://24zxc.ru/" />
      </Helmet>
      <div className="tropical-vibe min-h-screen bg-background relative">
        {/* Background decorations */}
        <InteractiveParticles count={50} />
        <TropicalGlows />
        <GeometricShapes />

        <Header />
        <main className="relative z-10">
          <HeroSection />
          <SectionDivider variant="palm" />
          <WebDevSection />
          <SectionDivider variant="palm" />
          <PromotionSection />
          <SectionDivider variant="simple" />
          <ContactSection />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Index;

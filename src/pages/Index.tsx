import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import WebDevSection from "@/components/WebDevSection";
import PromotionSection from "@/components/PromotionSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";
import { FloatingParticles, GeometricShapes, GradientGlows, SectionDivider } from "@/components/decorations";
import { useSiteSettings } from "@/hooks/use-site-settings";

const Index = () => {
  const { settings } = useSiteSettings();

  return (
    <>
      <Helmet>
        <title>{settings.seo_title || "24ZXC — Веб-разработка, реклама и услуги для бизнеса"}</title>
        <meta name="description" content={settings.seo_description || "Создаём современные сайты, настраиваем рекламу в Яндекс Директ и соцсетях. Полный спектр цифровых услуг для вашего бизнеса."} />
        {settings.seo_keywords && <meta name="keywords" content={settings.seo_keywords} />}
        <link rel="canonical" href="https://24zxc.ru/" />
      </Helmet>
      <div className="min-h-screen bg-background relative">
      {/* Background decorations */}
      <GradientGlows />
      <GeometricShapes />
      <FloatingParticles count={25} />
      
      <Header />
      <main className="relative z-10">
        <HeroSection />
        <SectionDivider variant="ornate" />
        <WebDevSection />
        <SectionDivider variant="diamond" />
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

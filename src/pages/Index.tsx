import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import WebDevSection from "@/components/WebDevSection";
import CasesSection from "@/components/CasesSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";
import { InteractiveParticles, GeometricShapes, TropicalGlows, SectionDivider } from "@/components/decorations";

const DEFAULT_SEO_TITLE =
  "24ZXC — Под ключ. Сайты, реклама, веб-приложения";
const DEFAULT_SEO_DESCRIPTION =
  "Доверьте сайт, рекламу в Яндекс Директ и веб-приложения нам — а сами отдыхайте. Полный цикл премиум-разработки от идеи до запуска.";

const Index = () => {
  // SEO comes from static defaults so the home page never waits on a backend
  // call. The dynamic site_settings table is still used in the admin panel,
  // but blocking the first paint on a network round-trip was causing
  // "infinite loading" symptoms in Yandex Browser without VPN.
  return (
    <>
      <Helmet>
        <title>{DEFAULT_SEO_TITLE}</title>
        <meta name="description" content={DEFAULT_SEO_DESCRIPTION} />
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
          <CasesSection />
          <SectionDivider variant="simple" />
          <ContactSection />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Index;

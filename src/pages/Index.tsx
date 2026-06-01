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
        <meta property="og:title" content={DEFAULT_SEO_TITLE} />
        <meta property="og:description" content={DEFAULT_SEO_DESCRIPTION} />
        <meta property="og:url" content="https://24zxc.ru/" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "24ZXC",
          url: "https://24zxc.ru/",
          logo: "https://24zxc.ru/favicon.png",
          description: DEFAULT_SEO_DESCRIPTION,
          sameAs: ["https://t.me/Aliencorso"],
          contactPoint: [{
            "@type": "ContactPoint",
            telephone: "+7-914-721-34-24",
            email: "24@24zxc.ru",
            contactType: "customer service",
            areaServed: "RU",
            availableLanguage: ["Russian"],
          }],
        })}</script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "24ZXC",
          url: "https://24zxc.ru/",
        })}</script>
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

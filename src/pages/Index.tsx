import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import WebDevSection from "@/components/WebDevSection";
import AdvertisingSection from "@/components/AdvertisingSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";
import { FloatingParticles, GeometricShapes, GradientGlows, SectionDivider } from "@/components/decorations";

const Index = () => {
  return (
    <>
      <Helmet>
        <title>24ZXC — Веб-разработка, реклама и услуги для бизнеса</title>
        <meta name="description" content="Создаём современные сайты, настраиваем рекламу в Яндекс Директ и соцсетях. Полный спектр цифровых услуг для вашего бизнеса." />
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
        <AdvertisingSection />
        <SectionDivider variant="simple" />
        <ContactSection />
      </main>
      <Footer />
    </div>
    </>
  );
};

export default Index;

import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import WebDevSection from "@/components/WebDevSection";
import AdvertisingSection from "@/components/AdvertisingSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";
import { FloatingParticles, GeometricShapes, GradientGlows, SectionDivider } from "@/components/decorations";

const Index = () => {
  return (
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
  );
};

export default Index;

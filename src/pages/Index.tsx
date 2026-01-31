import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import WebDevSection from "@/components/WebDevSection";
import AdvertisingSection from "@/components/AdvertisingSection";
import ServicesSection from "@/components/ServicesSection";
import FaqSection from "@/components/FaqSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <WebDevSection />
        <AdvertisingSection />
        <ServicesSection />
        <FaqSection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;

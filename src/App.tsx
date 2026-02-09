import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { ScrollToHash } from "@/hooks/use-scroll-to-hash";
import { InventoryProvider } from "@/contexts/InventoryContext";
import { AchievementsProvider } from "@/contexts/AchievementsContext";
import { InventoryBar } from "@/components/game/InventoryBar";
import { FlyingKey } from "@/components/game/FlyingKey";
import Index from "./pages/Index";
import Portfolio from "./pages/Portfolio";
import Frdo from "./pages/Frdo";
import Licensing from "./pages/Licensing";
import About from "./pages/About";
import Policy from "./pages/Policy";
import Templates from "./pages/Templates";
import TemplateDetail from "./pages/TemplateDetail";
import TemplatePreview from "./pages/TemplatePreview";
import Landing from "./pages/services/Landing";
import Corporate from "./pages/services/Corporate";
import Ecommerce from "./pages/services/Ecommerce";
import WebApp from "./pages/services/WebApp";
import Flowrish from "./pages/projects/Flowrish";
import Chmuleva from "./pages/projects/Chmuleva";
import Lanmei from "./pages/projects/Lanmei";
import LadyFrost from "./pages/projects/LadyFrost";
import PrNutrition from "./pages/projects/PrNutrition";
import Status from "./pages/projects/Status";
import SpinRide from "./pages/projects/SpinRide";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AchievementsProvider>
          <InventoryProvider>
            <Toaster />
            <Sonner />
            <FlyingKey />
            <InventoryBar />
            <BrowserRouter>
              <ScrollToHash />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/portfolio" element={<Portfolio />} />
                <Route path="/frdo" element={<Frdo />} />
                <Route path="/licensing" element={<Licensing />} />
                <Route path="/about" element={<About />} />
                <Route path="/policy" element={<Policy />} />
                <Route path="/templates" element={<Templates />} />
                <Route path="/templates/:id" element={<TemplateDetail />} />
                <Route path="/templates/:id/preview" element={<TemplatePreview />} />
                <Route path="/services/landing" element={<Landing />} />
                <Route path="/services/corporate" element={<Corporate />} />
                <Route path="/services/ecommerce" element={<Ecommerce />} />
                <Route path="/services/webapp" element={<WebApp />} />
                <Route path="/projects/flowrish" element={<Flowrish />} />
                <Route path="/projects/chmuleva" element={<Chmuleva />} />
                <Route path="/projects/lanmei" element={<Lanmei />} />
                <Route path="/projects/lady-frost" element={<LadyFrost />} />
                <Route path="/projects/pr-nutrition" element={<PrNutrition />} />
                <Route path="/projects/status" element={<Status />} />
                <Route path="/projects/spinride" element={<SpinRide />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </InventoryProvider>
        </AchievementsProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;

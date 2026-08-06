import { lazy, Suspense } from "react";
import { lazyWithRetry } from "@/lib/lazy-with-retry";
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

// Lazy-load every non-home route so the initial JS bundle is small enough
// to start fast even on slow / region-throttled connections (Yandex Browser
// without VPN). This keeps Three.js, dnd-kit, recharts, jspdf, html2canvas
// and admin code out of the home-page chunk.
const Portfolio = lazyWithRetry(() => import("./pages/Portfolio"));
const Frdo = lazyWithRetry(() => import("./pages/Frdo"));
const Licensing = lazyWithRetry(() => import("./pages/Licensing"));
const About = lazyWithRetry(() => import("./pages/About"));
const Policy = lazyWithRetry(() => import("./pages/Policy"));
const Templates = lazyWithRetry(() => import("./pages/Templates"));
const TemplateDetail = lazyWithRetry(() => import("./pages/TemplateDetail"));
const TemplatePreview = lazyWithRetry(() => import("./pages/TemplatePreview"));
const Landing = lazyWithRetry(() => import("./pages/services/Landing"));
const Corporate = lazyWithRetry(() => import("./pages/services/Corporate"));
const Ecommerce = lazyWithRetry(() => import("./pages/services/Ecommerce"));
const WebApp = lazyWithRetry(() => import("./pages/services/WebApp"));
const Nmo = lazyWithRetry(() => import("./pages/services/Nmo"));
const Flowrish = lazyWithRetry(() => import("./pages/projects/Flowrish"));
const Chmuleva = lazyWithRetry(() => import("./pages/projects/Chmuleva"));
const Lanmei = lazyWithRetry(() => import("./pages/projects/Lanmei"));
const LadyFrost = lazyWithRetry(() => import("./pages/projects/LadyFrost"));
const PrNutrition = lazyWithRetry(() => import("./pages/projects/PrNutrition"));
const Status = lazyWithRetry(() => import("./pages/projects/Status"));
const SpinRide = lazyWithRetry(() => import("./pages/projects/SpinRide"));
const Reviews = lazyWithRetry(() => import("./pages/Reviews"));
const Playground = lazyWithRetry(() => import("./pages/Playground"));
const PlaygroundView = lazyWithRetry(() => import("./pages/PlaygroundView"));
const Admin = lazyWithRetry(() => import("./pages/Admin"));
const OrgPanel = lazyWithRetry(() => import("./pages/OrgPanel"));
const OrgLanding = lazyWithRetry(() => import("./pages/OrgLanding"));
const NotFound = lazyWithRetry(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const RouteFallback = () => (
  <div className="min-h-screen w-full bg-background" aria-hidden="true" />
);

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
              <Suspense fallback={<RouteFallback />}>
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
                  <Route path="/services/nmo" element={<Nmo />} />
                  <Route path="/projects/flowrish" element={<Flowrish />} />
                  <Route path="/projects/chmuleva" element={<Chmuleva />} />
                  <Route path="/projects/lanmei" element={<Lanmei />} />
                  <Route path="/projects/lady-frost" element={<LadyFrost />} />
                  <Route path="/projects/pr-nutrition" element={<PrNutrition />} />
                  <Route path="/projects/status" element={<Status />} />
                  <Route path="/projects/spinride" element={<SpinRide />} />
                  <Route path="/reviews" element={<Reviews />} />
                  <Route path="/playground" element={<Playground />} />
                  <Route path="/p/:slug" element={<PlaygroundView />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/org" element={<OrgPanel />} />
                  <Route path="/shop/:slug" element={<OrgLanding />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </InventoryProvider>
        </AchievementsProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;

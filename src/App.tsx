import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ScrollToHash } from "@/hooks/use-scroll-to-hash";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Portfolio from "./pages/Portfolio";
import Frdo from "./pages/Frdo";
import Licensing from "./pages/Licensing";
import Landing from "./pages/services/Landing";
import Corporate from "./pages/services/Corporate";
import Ecommerce from "./pages/services/Ecommerce";
import WebApp from "./pages/services/WebApp";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Services from "./pages/Services";
import ServiceCategory from "./pages/ServiceCategory";
import ListingDetail from "./pages/ListingDetail";
import { DashboardLayout } from "./components/dashboard/DashboardLayout";
import Dashboard from "./pages/dashboard/Dashboard";
import MyListings from "./pages/dashboard/MyListings";
import NewListing from "./pages/dashboard/NewListing";
import Profile from "./pages/dashboard/Profile";
import { AdminLayout } from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminListings from "./pages/admin/AdminListings";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminUsers from "./pages/admin/AdminUsers";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToHash />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/frdo" element={<Frdo />} />
            <Route path="/licensing" element={<Licensing />} />
            <Route path="/services/landing" element={<Landing />} />
            <Route path="/services/corporate" element={<Corporate />} />
            <Route path="/services/ecommerce" element={<Ecommerce />} />
            <Route path="/services/webapp" element={<WebApp />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/services" element={<Services />} />
            <Route path="/services/:slug" element={<ServiceCategory />} />
            <Route path="/listing/:id" element={<ListingDetail />} />
            
            {/* Dashboard routes */}
            <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="listings" element={<MyListings />} />
              <Route path="listings/new" element={<NewListing />} />
              <Route path="profile" element={<Profile />} />
            </Route>

            {/* Admin routes */}
            <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminLayout /></ProtectedRoute>}>
              <Route index element={<AdminDashboard />} />
              <Route path="listings" element={<AdminListings />} />
              <Route path="categories" element={<AdminCategories />} />
              <Route path="users" element={<AdminUsers />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";
import { Toaster } from "./components/ui/toaster";
import { useEffect } from "react";

// ScrollToTop component - scrolls to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  
  return null;
}

// Components
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import CartSidebar from "./components/CartSidebar";
import MiraAI from "./components/MiraAI";

// Pages
import Home from "./pages/Home";
import ProductListing from "./pages/ProductListing";
import CustomCakeDesigner from "./pages/CustomCakeDesigner";
import MiraConcierge from "./pages/MiraConcierge";
import Checkout from "./pages/Checkout";
import About from "./pages/About";
import Membership from "./pages/Membership";
import Admin from "./pages/Admin";
import Policies from "./pages/Policies";
import FAQs from "./pages/FAQs";
import Insights from "./pages/Insights";
import Streaties from "./pages/Streaties";
import Franchise from "./pages/Franchise";
import Contact from "./pages/Contact";
import PetProfile from "./pages/PetProfile";
import MyPets from "./pages/MyPets";
import PetSoulPage from "./pages/PetSoulPage";
import PetVault from "./pages/PetVault";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MemberDashboard from "./pages/MemberDashboard";
import MiraEmbed from "./pages/MiraEmbed";
import MiraLandingEmbed from "./pages/MiraLandingEmbed";
import MiraPage from "./pages/MiraPage";
import MiraConciergeEmbed from "./pages/MiraConciergeEmbed";
import AuthCallback from "./pages/AuthCallback";
import Autoship from "./pages/Autoship";
import SearchResults from "./pages/SearchResults";
import PillarPage from "./pages/PillarPage";
import DinePage from "./pages/DinePage";
import CollectionPage from "./pages/CollectionPage";
import PartnerOnboarding from "./pages/PartnerOnboarding";
import StayPage from "./pages/StayPage";
import TravelPage from "./pages/TravelPage";
import CarePage from "./pages/CarePage";
import EnjoyPage from "./pages/EnjoyPage";
import FitPage from "./pages/FitPage";
import AdvisoryPage from "./pages/AdvisoryPage";
import PaperworkPage from "./pages/PaperworkPage";
import EmergencyPage from "./pages/EmergencyPage";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VoiceOrder from "./pages/VoiceOrder";
import AgentPortal from "./pages/AgentPortal";
import ServiceDeskPage from "./pages/ServiceDeskPage";
import MembershipPage from "./pages/MembershipPage";
import AboutPage from "./pages/AboutPage";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <AppRouter />
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </HelmetProvider>
  );
}

/**
 * AppRouter - Handles session_id detection for Google OAuth
 * CRITICAL: Check URL fragment synchronously during render, NOT in useEffect
 * This prevents race conditions with protected routes
 */
function AppRouter() {
  const location = useLocation();
  
  // Check URL fragment (not query params) for session_id - SYNCHRONOUS CHECK
  // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }
  
  return (
    <Routes>
      {/* Embed routes - NO navbar/footer for Shopify integration */}
      <Route path="/pet-soul" element={<PetProfile isEmbed={true} />} />
      <Route path="/pet-soul-embed" element={<PetProfile isEmbed={true} />} />
      <Route path="/mira-embed" element={<MiraEmbed />} />
      <Route path="/mira-landing-embed" element={<MiraLandingEmbed />} />
      <Route path="/concierge-embed" element={<MiraConciergeEmbed />} />
      
      {/* Agent Portal - Standalone Service Desk for agents */}
      <Route path="/agent" element={<AgentPortal />} />
      
      {/* Full-Screen Service Desk - NO navbar/footer */}
      <Route path="/admin/service-desk" element={<ServiceDeskPage />} />
      
      {/* Membership Landing Page - NO navbar/footer for clean entry */}
      <Route path="/membership" element={<MembershipPage />} />
      
      {/* Main app routes - WITH navbar */}
      <Route path="/*" element={<MainLayout />} />
    </Routes>
  );
}

// Main layout with navbar, footer, cart, etc.
function MainLayout() {
  return (
    <div className="App">
      <ScrollToTop />
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<MemberDashboard />} />
        
        {/* Main Categories */}
        <Route path="/cakes" element={<ProductListing category="cakes" />} />
        <Route path="/mini-cakes" element={<ProductListing category="mini-cakes" />} />
        <Route path="/treats" element={<ProductListing category="treats" />} />
        <Route path="/meals" element={<ProductListing category="fresh-meals" />} />
        <Route path="/pan-india" element={<ProductListing category="pan-india" />} />
        
        {/* More Categories */}
        <Route path="/breed-cakes" element={<ProductListing category="breed-cakes" />} />
        <Route path="/custom" element={<ProductListing category="breed-cakes" />} />
        <Route path="/pupcakes-dognuts" element={<ProductListing category="dognuts" />} />
        <Route path="/desi" element={<ProductListing category="desi-treats" />} />
        <Route path="/frozen" element={<ProductListing category="frozen-treats" />} />
        <Route path="/nut-butters" element={<ProductListing category="nut-butters" />} />
        <Route path="/cat-treats" element={<ProductListing category="cat-treats" />} />
        <Route path="/accessories" element={<ProductListing category="accessories" />} />
        <Route path="/merchandise" element={<ProductListing category="merchandise" />} />
        <Route path="/hampers" element={<ProductListing category="hampers" />} />
        <Route path="/gift-hampers" element={<ProductListing category="hampers" />} />
        
        {/* All Products */}
        <Route path="/all" element={<ProductListing category="all" />} />
        
        {/* Search Results */}
        <Route path="/search" element={<SearchResults />} />
        
        {/* Special Pages */}
        <Route path="/custom-cake" element={<CustomCakeDesigner />} />
        <Route path="/concierge" element={<MiraConcierge />} />
        <Route path="/mira" element={<MiraPage />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/membership" element={<Membership />} />
        <Route path="/autoship" element={<Autoship />} />
        <Route path="/autoship-products" element={<ProductListing category="autoship" />} />
        <Route path="/admin/forgot-password" element={<ForgotPassword />} />
        <Route path="/admin/reset-password" element={<ResetPassword />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/voice-order" element={<VoiceOrder />} />
        
        {/* Pet Profile - Protected */}
        <Route path="/pet-profile" element={<ProtectedRoute><PetProfile /></ProtectedRoute>} />
        <Route path="/my-pets" element={<ProtectedRoute><MyPets /></ProtectedRoute>} />
        <Route path="/pets" element={<ProtectedRoute><MyPets /></ProtectedRoute>} />
        <Route path="/pet-soul/:petId" element={<ProtectedRoute><PetSoulPage /></ProtectedRoute>} />
        <Route path="/pet-soul" element={<ProtectedRoute><PetSoulPage /></ProtectedRoute>} />
        <Route path="/pet-vault/:petId" element={<ProtectedRoute><PetVault /></ProtectedRoute>} />
        
        {/* Policy Pages */}
        <Route path="/policies" element={<Policies />} />
        <Route path="/refund-policy" element={<Policies />} />
        <Route path="/privacy-policy" element={<Policies />} />
        <Route path="/terms-of-service" element={<Policies />} />
        <Route path="/shipping-policy" element={<Policies />} />
        
        {/* Content Pages */}
        <Route path="/faqs" element={<FAQs />} />
        <Route path="/insights" element={<Insights />} />
        <Route path="/streaties" element={<Streaties />} />
        <Route path="/franchise" element={<Franchise />} />
        <Route path="/contact" element={<Contact />} />
        
        {/* ALL Life Pillars - Protected (require login/membership to access) */}
        {/* Celebrate Pillar - Products from The Doggy Bakery (supplier) */}
        <Route path="/celebrate" element={<ProtectedRoute><ProductListing category="cakes" /></ProtectedRoute>} />
        <Route path="/celebrate/cakes" element={<ProtectedRoute><ProductListing category="cakes" /></ProtectedRoute>} />
        <Route path="/celebrate/birthday-cakes" element={<ProtectedRoute><ProductListing category="Birthdays" /></ProtectedRoute>} />
        <Route path="/celebrate/breed-cakes" element={<ProtectedRoute><ProductListing category="breed" /></ProtectedRoute>} />
        <Route path="/celebrate/pupcakes" element={<ProtectedRoute><ProductListing category="Pupcakes" /></ProtectedRoute>} />
        <Route path="/celebrate/treats" element={<ProtectedRoute><ProductListing category="Treats" /></ProtectedRoute>} />
        <Route path="/celebrate/valentine" element={<ProtectedRoute><ProductListing category="valentine" /></ProtectedRoute>} />
        <Route path="/celebrate/desi" element={<ProtectedRoute><ProductListing category="desi" /></ProtectedRoute>} />
        <Route path="/celebrate/hampers" element={<ProtectedRoute><ProductListing category="hampers" /></ProtectedRoute>} />
        <Route path="/celebrate/cat" element={<ProtectedRoute><ProductListing category="cat" /></ProtectedRoute>} />
        <Route path="/celebrate/accessories" element={<ProtectedRoute><ProductListing category="Accessories" /></ProtectedRoute>} />
        <Route path="/celebrate/:category" element={<ProtectedRoute><ProductListing /></ProtectedRoute>} />
        
        {/* Other Product Routes - Also Protected */}
        <Route path="/cakes" element={<ProtectedRoute><ProductListing category="cakes" /></ProtectedRoute>} />
        <Route path="/mini-cakes" element={<ProtectedRoute><ProductListing category="mini-cakes" /></ProtectedRoute>} />
        <Route path="/treats" element={<ProtectedRoute><ProductListing category="treats" /></ProtectedRoute>} />
        <Route path="/meals" element={<ProtectedRoute><ProductListing category="fresh-meals" /></ProtectedRoute>} />
        <Route path="/pan-india" element={<ProtectedRoute><ProductListing category="pan-india" /></ProtectedRoute>} />
        <Route path="/breed-cakes" element={<ProtectedRoute><ProductListing category="breed-cakes" /></ProtectedRoute>} />
        <Route path="/custom" element={<ProtectedRoute><ProductListing category="breed-cakes" /></ProtectedRoute>} />
        <Route path="/pupcakes-dognuts" element={<ProtectedRoute><ProductListing category="dognuts" /></ProtectedRoute>} />
        <Route path="/desi" element={<ProtectedRoute><ProductListing category="desi-treats" /></ProtectedRoute>} />
        <Route path="/frozen" element={<ProtectedRoute><ProductListing category="frozen-treats" /></ProtectedRoute>} />
        <Route path="/nut-butters" element={<ProtectedRoute><ProductListing category="nut-butters" /></ProtectedRoute>} />
        <Route path="/cat-treats" element={<ProtectedRoute><ProductListing category="cat-treats" /></ProtectedRoute>} />
        <Route path="/accessories" element={<ProtectedRoute><ProductListing category="accessories" /></ProtectedRoute>} />
        <Route path="/merchandise" element={<ProtectedRoute><ProductListing category="merchandise" /></ProtectedRoute>} />
        <Route path="/hampers" element={<ProtectedRoute><ProductListing category="hampers" /></ProtectedRoute>} />
        <Route path="/gift-hampers" element={<ProtectedRoute><ProductListing category="hampers" /></ProtectedRoute>} />
        <Route path="/all" element={<ProtectedRoute><ProductListing category="all" /></ProtectedRoute>} />
        
        {/* Service Pillars - Protected (require login to request services) */}
        <Route path="/dine" element={<ProtectedRoute><DinePage /></ProtectedRoute>} />
        <Route path="/stay" element={<ProtectedRoute><StayPage /></ProtectedRoute>} />
        <Route path="/travel" element={<ProtectedRoute><TravelPage /></ProtectedRoute>} />
        <Route path="/care" element={<ProtectedRoute><CarePage /></ProtectedRoute>} />
        <Route path="/enjoy" element={<ProtectedRoute><EnjoyPage /></ProtectedRoute>} />
        <Route path="/fit" element={<ProtectedRoute><FitPage /></ProtectedRoute>} />
        <Route path="/advisory" element={<ProtectedRoute><AdvisoryPage /></ProtectedRoute>} />
        <Route path="/paperwork" element={<ProtectedRoute><PaperworkPage /></ProtectedRoute>} />
        <Route path="/emergency" element={<ProtectedRoute><EmergencyPage /></ProtectedRoute>} />
        <Route path="/pillar/:pillarId" element={<ProtectedRoute><PillarPage /></ProtectedRoute>} />
        
        {/* Campaign Collections */}
        <Route path="/collections/:slug" element={<CollectionPage />} />
        
        {/* Partner Onboarding */}
        <Route path="/partner" element={<PartnerOnboarding />} />
        <Route path="/become-a-partner" element={<PartnerOnboarding />} />
      </Routes>
      <Footer />
      <CartSidebar />
      <MiraAI />
      <Toaster />
    </div>
  );
}

export default App;

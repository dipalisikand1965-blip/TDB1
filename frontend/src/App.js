import { BrowserRouter, Routes, Route, useLocation, Navigate, useParams } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";
import { Toaster } from "./components/ui/toaster";
import { useEffect } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import FloatingContactButton from "./components/FloatingContactButton";

// ScrollToTop component - scrolls to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  
  return null;
}

// ConditionalFloatingButton - Hide on Mira page to prevent overlap
function ConditionalFloatingButton() {
  const { pathname } = useLocation();
  // Don't show on /mira or /admin pages
  if (pathname === '/mira' || pathname.startsWith('/admin')) {
    return null;
  }
  return <FloatingContactButton />;
}

// Redirect component for deprecated pet-soul-journey route
function PetSoulJourneyRedirect() {
  const { petId } = useParams();
  return <Navigate to={`/pet/${petId}`} replace />;
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
// About and Membership use the doctrine-aligned *Page versions
import AboutPage from "./pages/AboutPage";
import MembershipPage from "./pages/MembershipPage";
import MembershipOnboarding from "./pages/MembershipOnboarding";
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
// PetSoulJourneyPage removed - deprecated, all routes redirect to UnifiedPetPage
import PetSoulDemo from "./pages/PetSoulDemo";
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
import LearnPage from "./pages/LearnPage";
import AdvisoryPage from "./pages/AdvisoryPage";
import PaperworkPage from "./pages/PaperworkPage";
import EmergencyPage from "./pages/EmergencyPage";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import MemberForgotPassword from "./pages/MemberForgotPassword";
import MemberResetPassword from "./pages/MemberResetPassword";
import VoiceOrder from "./pages/VoiceOrder";
import AgentPortal from "./pages/AgentPortal";
import ServiceDeskPage from "./pages/ServiceDeskPage";
import MyTickets from "./pages/MyTickets";
import AdminDocs from "./pages/AdminDocs";
import NPSFeedbackPage from "./pages/NPSFeedbackPage";
import UnifiedPetPage from "./pages/UnifiedPetPage";
import FarewellPage from "./pages/FarewellPage";
import ShopPage from "./pages/ShopPage";
import AdoptPage from "./pages/AdoptPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import MealPlanPage from "./pages/MealPlanPage";
import ProtectedRoute from "./components/ProtectedRoute";
import ConciergeRequestsDashboard from "./components/admin/ConciergeRequestsDashboard";

function App() {
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <AuthProvider>
          <CartProvider>
            <BrowserRouter>
              <AppRouter />
            </BrowserRouter>
          </CartProvider>
        </AuthProvider>
      </HelmetProvider>
    </ErrorBoundary>
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
      <Route path="/pet-soul-embed" element={<PetProfile isEmbed={true} />} />
      <Route path="/mira-embed" element={<MiraEmbed />} />
      <Route path="/mira-landing-embed" element={<MiraLandingEmbed />} />
      <Route path="/concierge-embed" element={<MiraConciergeEmbed />} />
      
      {/* Agent Portal - Standalone Service Desk for agents */}
      <Route path="/agent" element={<AgentPortal />} />
      
      {/* Full-Screen Service Desk - NO navbar/footer */}
      <Route path="/admin/service-desk" element={<ServiceDeskPage />} />
      
      {/* Full-Screen Concierge® Dashboard - NO navbar/footer */}
      <Route path="/admin/concierge" element={<ConciergeRequestsDashboard />} />
      
      {/* Full-Screen Ask Mira Page - NO navbar/footer for immersive experience */}
      <Route path="/ask-mira" element={<MiraPage />} />
      
      {/* Membership Landing Page - NO navbar/footer for clean entry */}
      <Route path="/membership" element={<MembershipPage />} />
      
      {/* Membership Onboarding Form - NO navbar/footer for focused flow */}
      <Route path="/pet-soul-onboard" element={<MembershipOnboarding />} />
      
      {/* Main app routes - WITH navbar */}
      <Route path="/*" element={<MainLayout />} />
    </Routes>
  );
}

// Main layout with navbar, footer, cart, etc.
function MainLayout() {
  return (
    <div className="App overflow-x-hidden">
      <ScrollToTop />
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<MemberDashboard />} />
        
        {/* Member Password Reset - New Pages */}
        <Route path="/member/forgot-password" element={<MemberForgotPassword />} />
        <Route path="/reset-password" element={<MemberResetPassword />} />
        
        {/* Search Results */}
        <Route path="/search" element={<SearchResults />} />
        
        {/* Special Pages */}
        <Route path="/custom-cake" element={<ProtectedRoute><CustomCakeDesigner /></ProtectedRoute>} />
        <Route path="/concierge" element={<MiraConcierge />} />
        <Route path="/mira" element={<MiraPage />} />
        <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
        <Route path="/about" element={<AboutPage />} />
        {/* Membership route is defined outside MainLayout for clean entry */}
        <Route path="/autoship" element={<Autoship />} />
        <Route path="/autoship-products" element={<ProductListing category="autoship" />} />
        <Route path="/meal-plan" element={<MealPlanPage />} />
        <Route path="/admin/forgot-password" element={<ForgotPassword />} />
        <Route path="/admin/reset-password" element={<ResetPassword />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/docs" element={<AdminDocs />} />
        <Route path="/voice-order" element={<ProtectedRoute><VoiceOrder /></ProtectedRoute>} />
        
        {/* NPS Feedback - Public access */}
        <Route path="/feedback" element={<NPSFeedbackPage />} />
        
        {/* Pet Profile - Accessible without login */}
        <Route path="/pet-profile" element={<PetProfile />} />
        <Route path="/my-pets" element={<ProtectedRoute><MyPets /></ProtectedRoute>} />
        <Route path="/pets" element={<ProtectedRoute><MyPets /></ProtectedRoute>} />
        <Route path="/my-tickets" element={<ProtectedRoute><MyTickets /></ProtectedRoute>} />
        <Route path="/pet-soul/:petId" element={<PetSoulPage />} />
        <Route path="/pet-soul" element={<PetSoulPage />} />
        <Route path="/pet-profile" element={<ProtectedRoute><PetProfile /></ProtectedRoute>} />
        {/* Redirect old pet-soul-journey URL to unified pet page */}
        <Route path="/pet-soul-journey/:petId" element={<PetSoulJourneyRedirect />} />
        <Route path="/pet/:petId" element={<UnifiedPetPage />} />
        <Route path="/pet-soul-demo" element={<PetSoulDemo />} />
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
        
        {/* ALL Life Pillars - Open for browsing (login required only at checkout) */}
        {/* Celebrate Pillar - Products from The Doggy Bakery (supplier) */}
        <Route path="/celebrate" element={<ProductListing category="cakes" />} />
        <Route path="/celebrate/cakes" element={<ProductListing category="cakes" />} />
        <Route path="/celebrate/birthday-cakes" element={<ProductListing category="Birthdays" />} />
        <Route path="/celebrate/breed-cakes" element={<ProductListing category="breed-cakes" />} />
        <Route path="/celebrate/pupcakes" element={<ProductListing category="dognuts" />} />
        <Route path="/celebrate/treats" element={<ProductListing category="Treats" />} />
        <Route path="/celebrate/valentine" element={<ProductListing category="valentine" />} />
        <Route path="/celebrate/desi" element={<ProductListing category="desi-treats" />} />
        <Route path="/celebrate/hampers" element={<ProductListing category="hampers" />} />
        <Route path="/celebrate/cat" element={<ProductListing category="cat" />} />
        <Route path="/celebrate/accessories" element={<ProductListing category="Accessories" />} />
        <Route path="/celebrate/:category" element={<ProductListing />} />
        
        {/* Other Product Routes - Open for browsing */}
        <Route path="/cakes" element={<ProductListing category="cakes" />} />
        <Route path="/mini-cakes" element={<ProductListing category="mini-cakes" />} />
        <Route path="/treats" element={<ProductListing category="treats" />} />
        <Route path="/meals" element={<ProductListing category="fresh-meals" />} />
        <Route path="/pan-india" element={<ProductListing category="pan-india" />} />
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
        <Route path="/all" element={<ProductListing category="all" />} />
        
        {/* Service Pillars - Open for browsing */}
        <Route path="/dine" element={<DinePage />} />
        <Route path="/stay" element={<StayPage />} />
        <Route path="/travel" element={<TravelPage />} />
        <Route path="/care" element={<CarePage />} />
        <Route path="/enjoy" element={<EnjoyPage />} />
        <Route path="/fit" element={<FitPage />} />
        <Route path="/learn" element={<LearnPage />} />
        <Route path="/advisory" element={<AdvisoryPage />} />
        <Route path="/paperwork" element={<PaperworkPage />} />
        <Route path="/emergency" element={<EmergencyPage />} />
        <Route path="/pillar/:pillarId" element={<PillarPage />} />
        
        {/* Additional Pillars - Coming Soon pages */}
        <Route path="/feed" element={<PillarPage />} />
        <Route path="/groom" element={<PillarPage />} />
        <Route path="/play" element={<PillarPage />} />
        <Route path="/train" element={<PillarPage />} />
        <Route path="/insure" element={<PillarPage />} />
        <Route path="/adopt" element={<AdoptPage />} />
        <Route path="/farewell" element={<FarewellPage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/product/:productId" element={<ProductDetailPage />} />
        <Route path="/community" element={<PillarPage />} />
        
        {/* Campaign Collections */}
        <Route path="/collections/:slug" element={<CollectionPage />} />
        
        {/* Partner Onboarding */}
        <Route path="/partner" element={<PartnerOnboarding />} />
        <Route path="/become-a-partner" element={<PartnerOnboarding />} />
      </Routes>
      <Footer />
      <CartSidebar />
      <MiraAI />
      <ConditionalFloatingButton />
      <Toaster />
    </div>
  );
}

export default App;

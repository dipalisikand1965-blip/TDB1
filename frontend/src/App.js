import { BrowserRouter, Routes, Route, useLocation, Navigate, useParams } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { CartProvider } from "./context/CartContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { PillarProvider } from "./context/PillarContext";
import { LayerProvider } from "./context/LayerContext";
import { GlobalNotificationProvider } from "./context/GlobalNotificationContext";
import { Toaster } from "./components/ui/toaster";
import { Toaster as SonnerToaster } from "./components/ui/sonner";
import { useEffect, useCallback, Suspense, lazy } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import FloatingContactButton from "./components/FloatingContactButton";
import MiraFloatingButton from "./components/MiraFloatingButton";
import MobileNavBar from "./components/MobileNavBar";
import MemberMobileNav from "./components/MemberMobileNav";
import UniversalServiceButton from "./components/UniversalServiceButton";
import { useAppBadge } from "./hooks/useAppBadge";
import { API_URL } from "./utils/api";

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

// ScrollToTop component - scrolls to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();
  
  useEffect(() => {
    // Scroll immediately with multiple methods for maximum compatibility
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0; // For Safari
    
    // Also scroll after delays for dynamic content loading
    const timer1 = setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 50);
    
    const timer2 = setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 150);
    
    const timer3 = setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 300);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [pathname]);
  
  return null;
}

// ConditionalFloatingButton - Hide on pages that have their own contact buttons
function ConditionalFloatingButton() {
  const { pathname } = useLocation();
  const { user, isAuthenticated } = useAuth();
  
  // Hide on /mira, /admin, and ALL pillar pages (they have their own Ask Concierge buttons)
  const hiddenPaths = [
    '/mira', '/admin', '/demo',
    '/care', '/celebrate', '/celebrate-soul', '/advisory', '/dine', '/stay', '/travel', 
    '/emergency', '/enjoy', '/fit', '/learn', '/farewell', '/adopt', 
    '/paperwork', '/shop', '/cakes', '/breed-cakes', '/mini-cakes'
  ];
  
  if (hiddenPaths.some(path => pathname === path || pathname.startsWith(path + '/'))) {
    return null;
  }
  
  // UNIVERSAL SERVICE COMMAND - Accessible from EVERYWHERE
  // User Intent → Service Desk Ticket → Admin Notification → Member Notification
  // Shows on BOTH mobile and desktop
  return (
    <UniversalServiceButton 
      variant="floating"
      position="bottom-left"
      label="Need Help?"
      showLabel={false}
      pillar="general"
      requireIntakeModal={true}
      navigateToInbox={true}
    />
  );
}

// ConditionalMobileNav - Show mobile nav bar only on appropriate pages
function ConditionalMobileNav() {
  const { pathname } = useLocation();
  // Don't show on admin, login, register, or demo pages
  const hiddenPaths = ['/admin', '/login', '/register', '/forgot-password', '/demo'];
  if (hiddenPaths.some(path => pathname.startsWith(path))) {
    return null;
  }
  return <MobileNavBar />;
}

// Redirect component for deprecated pet-soul-journey route
function PetSoulJourneyRedirect() {
  const { petId } = useParams();
  return <Navigate to={`/pets/${petId}/soul`} replace />;
}

// Redirect from old /mira-demo to new /mira-os
function MiraDemoRedirect() {
  return <Navigate to="/mira-os" replace />;
}

// Redirect component for celebrate sub-categories to main celebrate page
function CelebrateRedirect() {
  const { category } = useParams();
  return <Navigate to={`/celebrate?category=${category}`} replace />;
}

// App Badge Manager - Updates PWA icon badge with unread notification count
function AppBadgeManager() {
  const { user, isAuthenticated } = useAuth();
  const { setBadge, clearBadge } = useAppBadge();
  
  // Fetch unread notification count and update badge
  const updateBadgeCount = useCallback(async () => {
    if (!isAuthenticated || !user) {
      clearBadge();
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      // Fetch unread notifications count for the member
      const res = await fetch(`${API_URL}/api/notifications/unread-count`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        const count = data.unread_count || 0;
        setBadge(count);
      }
    } catch (err) {
      // Silently fail - badge is not critical
      console.debug('Badge update failed:', err);
    }
  }, [isAuthenticated, user, setBadge, clearBadge]);
  
  // Update badge on mount and when auth changes
  useEffect(() => {
    updateBadgeCount();
    
    // Poll every 60 seconds
    const interval = setInterval(updateBadgeCount, 60000);
    
    // Listen for push notification events from service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'NOTIFICATION_RECEIVED') {
          updateBadgeCount();
        }
      });
    }
    
    return () => clearInterval(interval);
  }, [updateBadgeCount]);
  
  // Clear badge on logout
  useEffect(() => {
    if (!isAuthenticated) {
      clearBadge();
    }
  }, [isAuthenticated, clearBadge]);
  
  return null; // This is a side-effect only component
}

// Components (always loaded - core UI)
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import CartSidebar from "./components/CartSidebar";
import MiraAI from "./components/MiraAI";

// Critical Pages (loaded immediately - main user journey)
import Home from "./pages/Home";
// AboutPage already imported via lazy loading below
// Login - Lazy loaded to reduce initial bundle size
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
import ShopPage from "./pages/ShopPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import SearchResults from "./pages/SearchResults";

// Occasion Box Builder - Standalone page
const OccasionBoxPage = lazy(() => import("./pages/OccasionBoxPage"));
const Checkout = lazy(() => import("./pages/Checkout"));
import ProtectedRoute from "./components/ProtectedRoute";
import AdminProtectedRoute from "./components/AdminProtectedRoute";

// =====================================================
// LAZY LOADED PAGES (code-split for smaller initial bundle)
// =====================================================

// Admin Pages (only loaded when admin accesses)
const Admin = lazy(() => import("./pages/Admin"));
const AdminDocs = lazy(() => import("./pages/AdminDocs"));
const AgentPortal = lazy(() => import("./pages/AgentPortal"));
const ServiceDeskPage = lazy(() => import("./pages/ServiceDeskPage"));
const ServiceCRUDAdmin = lazy(() => import("./pages/ServiceCRUDAdmin"));
const ConciergeRequestsDashboard = lazy(() => import("./components/admin/ConciergeRequestsDashboard"));
const AdminConciergeDashboard = lazy(() => import("./components/admin/AdminConciergeDashboard"));

// Member Dashboard (only loaded when member logs in)
const MemberDashboard = lazy(() => import("./pages/MemberDashboard"));
const MyPets = lazy(() => import("./pages/MyPets"));
const MyTickets = lazy(() => import("./pages/MyTickets"));
const PetVault = lazy(() => import("./pages/PetVault"));
const Autoship = lazy(() => import("./pages/Autoship"));

// Pillar Pages (lazy load - user navigates to these)
const DinePage = lazy(() => import("./pages/DinePage"));
const StayPage = lazy(() => import("./pages/StayPage"));
const TravelPage = lazy(() => import("./pages/TravelPage"));
const CarePage = lazy(() => import("./pages/CarePage"));
const EnjoyPage = lazy(() => import("./pages/EnjoyPage"));
const FitPage = lazy(() => import("./pages/FitPage"));
const LearnPage = lazy(() => import("./pages/LearnPage"));
const LearnTopicPage = lazy(() => import("./pages/LearnTopicPage"));
const AdvisoryPage = lazy(() => import("./pages/AdvisoryPage"));
const PaperworkPage = lazy(() => import("./pages/PaperworkPage"));
const EmergencyPage = lazy(() => import("./pages/EmergencyPage"));
const CelebratePage = lazy(() => import("./pages/CelebratePage"));
const CelebrateNewPage = lazy(() => import("./pages/CelebrateNewPage"));
const CelebrateSoulPage = lazy(() => import("./pages/CelebratePageNew")); // Soul-First Architecture
const FarewellPage = lazy(() => import("./pages/FarewellPage"));
const AdoptPage = lazy(() => import("./pages/AdoptPage"));
const PillarPage = lazy(() => import("./pages/PillarPage"));
const MealsPage = lazy(() => import("./pages/MealsPage"));

// Other Pages (lazy load)
const ProductListing = lazy(() => import("./pages/ProductListing"));
const CustomCakeDesigner = lazy(() => import("./pages/CustomCakeDesigner"));
const MiraConcierge = lazy(() => import("./pages/MiraConcierge"));
const UnifiedCheckout = lazy(() => import("./components/UnifiedCheckout"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const MembershipPage = lazy(() => import("./pages/MembershipPage"));
const MembershipOnboarding = lazy(() => import("./pages/MembershipOnboarding"));
const MiraMeetsYourPet = lazy(() => import("./pages/MiraMeetsYourPet")); // New world-class onboarding
const PetHomePage = lazy(() => import("./pages/PetHomePage")); // Pet-first landing page after onboarding
const AddPetPage = lazy(() => import("./pages/AddPetPage")); // Add pet flow for existing users
// Soul Builder - 8-chapter onboarding (lazy loaded)
import SoulBuilder from "./pages/SoulBuilder"; // Direct import for debugging
const Policies = lazy(() => import("./pages/Policies"));
const FAQs = lazy(() => import("./pages/FAQs"));
const Insights = lazy(() => import("./pages/Insights"));
const Streaties = lazy(() => import("./pages/Streaties"));
const Franchise = lazy(() => import("./pages/Franchise"));
const Contact = lazy(() => import("./pages/Contact"));
const PetProfile = lazy(() => import("./pages/PetProfile"));
const PetSoulPage = lazy(() => import("./pages/PetSoulPage"));
const PetSoulDemo = lazy(() => import("./pages/PetSoulDemo"));
const MiraEmbed = lazy(() => import("./pages/MiraEmbed"));
const MiraLandingEmbed = lazy(() => import("./pages/MiraLandingEmbed"));
const MiraPage = lazy(() => import("./pages/MiraPage"));
const MiraConciergeEmbed = lazy(() => import("./pages/MiraConciergeEmbed"));
// MiraDemoPage - Lazy loaded to prevent browser crash (142KB file)
const MiraDemoPage = lazy(() => import("./pages/MiraDemoPage"));
const MiraDemoOriginalPage = lazy(() => import("./pages/MiraDemoOriginalPage"));
// MiraDemoBackupPage - UNTOUCHED BACKUP for comparison during refactoring
const MiraDemoBackupPage = lazy(() => import("./pages/MiraDemoBackupPage"));
// MiraPurePage - Clean soulful AI without hardcoded logic
const MiraPurePage = lazy(() => import("./pages/MiraPurePage"));
// MiraPureOSPage - Full OS with tabs and pet selector
const MiraPureOSPage = lazy(() => import("./pages/MiraPureOSPage"));
// MiraOSPage - New Header Shell navigation page
const MiraOSPage = lazy(() => import("./pages/MiraOSPage"));
// MiraPillarSandbox - Test page for unified Mira on pillar pages
const MiraPillarSandbox = lazy(() => import("./pages/MiraPillarSandbox"));
const ConciergeDashboard = lazy(() => import("./pages/ConciergeDashboard"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const CollectionPage = lazy(() => import("./pages/CollectionPage"));
const PartnerOnboarding = lazy(() => import("./pages/PartnerOnboarding"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const MemberForgotPassword = lazy(() => import("./pages/MemberForgotPassword"));
const MemberResetPassword = lazy(() => import("./pages/MemberResetPassword"));
const VoiceOrder = lazy(() => import("./pages/VoiceOrder"));
const NPSFeedbackPage = lazy(() => import("./pages/NPSFeedbackPage"));
const UnifiedPetPage = lazy(() => import("./pages/UnifiedPetPage"));
const ServicesPage = lazy(() => import("./pages/ServicesPage"));
const ServiceDetailPage = lazy(() => import("./pages/ServiceDetailPage"));
const MealPlanPage = lazy(() => import("./pages/MealPlanPage"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const MembershipPayment = lazy(() => import("./pages/MembershipPayment"));
const DreamfolksDemo = lazy(() => import("./pages/DreamfolksDemo"));

// Pet Wrapped
const PetWrappedViewer = lazy(() => import("./pages/PetWrappedViewer"));
const WrappedWelcomePage = lazy(() => import("./pages/WrappedWelcomePage"));

// Notifications Inbox + Ticket Thread (iOS Mail-style)
const NotificationsInbox = lazy(() => import("./pages/NotificationsInbox"));
const TicketThread = lazy(() => import("./pages/TicketThread"));

function App() {
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <AuthProvider>
          <GlobalNotificationProvider>
            <CartProvider>
              <PillarProvider>
                <LayerProvider>
                  <BrowserRouter>
                    <AppRouter />
                  </BrowserRouter>
                </LayerProvider>
              </PillarProvider>
            </CartProvider>
          </GlobalNotificationProvider>
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
    return <Suspense fallback={<PageLoader />}><AuthCallback /></Suspense>;
  }
  
  return (
    <Suspense fallback={<PageLoader />}>
      {/* MemberMobileNav at App level - Available on all routes for logged-in users */}
      <MemberMobileNav />
      <Routes>
        {/* Embed routes - NO navbar/footer for Shopify integration */}
        <Route path="/pet-soul-embed" element={<PetProfile isEmbed={true} />} />
        <Route path="/mira-embed" element={<MiraEmbed />} />
        <Route path="/mira-landing-embed" element={<MiraLandingEmbed />} />
        <Route path="/concierge-embed" element={<MiraConciergeEmbed />} />
        
        {/* B2B Demo Pages - Standalone, no auth required */}
        <Route path="/demo/dreamfolks" element={<DreamfolksDemo />} />
        
        {/* Agent Portal - Standalone Service Desk for agents */}
        <Route path="/agent" element={<AdminProtectedRoute><AgentPortal /></AdminProtectedRoute>} />
        
        {/* Full-Screen Service Desk - NO navbar/footer */}
        <Route path="/admin/service-desk" element={<AdminProtectedRoute><ServiceDeskPage /></AdminProtectedRoute>} />
        <Route path="/admin/services" element={<AdminProtectedRoute><ServiceCRUDAdmin /></AdminProtectedRoute>} />
        
        {/* Full-Screen Concierge® Dashboard - NO navbar/footer */}
        <Route path="/admin/concierge" element={<AdminProtectedRoute><ConciergeRequestsDashboard /></AdminProtectedRoute>} />
        
        {/* Real-time Concierge Dashboard - WebSocket-powered Golden Standard */}
        <Route path="/admin/concierge-realtime" element={<AdminProtectedRoute><AdminConciergeDashboard /></AdminProtectedRoute>} />
        
        {/* NEW: Mira Concierge Dashboard - Handoff tickets management */}
        <Route path="/admin/mira-concierge" element={<AdminProtectedRoute><ConciergeDashboard /></AdminProtectedRoute>} />
        <Route path="/concierge-dashboard" element={<AdminProtectedRoute><ConciergeDashboard /></AdminProtectedRoute>} />
        
        {/* Full-Screen Mira Pages - NO navbar/footer for immersive experience */}
        <Route path="/mira" element={<MiraPage />} />
        <Route path="/ask-mira" element={<MiraPage />} />
        
        {/* MIRA OS - Protected behind login + membership */}
        <Route path="/mira-os" element={<ProtectedRoute requireMembership={true}><MiraDemoPage /></ProtectedRoute>} />
        
        {/* Redirect old /mira-demo to /mira-os */}
        <Route path="/mira-demo" element={<MiraDemoRedirect />} />
        
        {/* MIRA OS ORIGINAL - Day 1 clean version for comparison */}
        <Route path="/mira-os-original" element={<ProtectedRoute requireMembership={true}><MiraDemoOriginalPage /></ProtectedRoute>} />
        
        {/* MIRA OS BACKUP - UNTOUCHED version for comparison during refactoring */}
        <Route path="/mira-os-backup" element={<ProtectedRoute requireMembership={true}><MiraDemoBackupPage /></ProtectedRoute>} />
        
        {/* MIRA PURE - Clean soulful AI test page (no hardcoded logic) */}
        <Route path="/mira-pure" element={<MiraPurePage />} />
        
        {/* MIRA PURE OS - Full OS with tabs, pet selector (no hardcoded logic) */}
        <Route path="/mira-pure-os" element={<MiraPureOSPage />} />
        
        {/* MIRA OS - New Header Shell Navigation Page */}
        <Route path="/mira-os" element={<ProtectedRoute requireMembership={true}><MiraDemoPage /></ProtectedRoute>} />
        
        {/* Mira Pillar Sandbox - Test page for unified Mira experience */}
        <Route path="/mira-pillar-sandbox" element={<MiraPillarSandbox />} />
        
        {/* Membership Landing Page - NO navbar/footer for clean entry */}
        <Route path="/membership" element={<MembershipPage />} />
        
        {/* Pet Soul Onboarding - Full 4-step flow with celebrations */}
        <Route path="/pet-soul-onboard" element={<MiraMeetsYourPet />} />
        <Route path="/join" element={<MiraMeetsYourPet />} />
        <Route path="/join-old" element={<MembershipOnboarding />} />
        
        {/* NEW: Magical Soul Builder - 8-chapter onboarding */}
        <Route path="/soul-builder" element={<SoulBuilder />} />
        
        {/* Pet Home - Default landing page after onboarding */}
        <Route path="/pet-home" element={<ProtectedRoute><PetHomePage /></ProtectedRoute>} />
        
        {/* Add Pet - For existing logged-in users */}
        <Route path="/add-pet" element={<ProtectedRoute><AddPetPage /></ProtectedRoute>} />
        
        {/* Membership Payment Page - Cart/Checkout with Razorpay */}
        <Route path="/membership/payment" element={<MembershipPayment />} />
        
        {/* Payment Success Page - NO navbar for celebration feel */}
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/welcome" element={<PaymentSuccess />} />
        
        {/* ═══════════════════════════════════════════════════════════════════
            NOTIFICATIONS INBOX + TICKET THREAD (iOS Mail-style)
            Full-screen pages - NO MainLayout wrapper
            ═══════════════════════════════════════════════════════════════════ */}
        <Route path="/notifications" element={<ProtectedRoute><NotificationsInbox /></ProtectedRoute>} />
        <Route path="/tickets/:ticketId" element={<ProtectedRoute><TicketThread /></ProtectedRoute>} />
        
        {/* Landing Page - Clean, no navbar for immersive experience */}
        <Route path="/" element={<Home />} />
        
        {/* About Page - Clean, same premium aesthetic */}
        <Route path="/about" element={<AboutPage />} />
      
        {/* Main app routes - WITH navbar */}
        <Route path="/*" element={<MainLayout />} />
      </Routes>
    </Suspense>
  );
}

// Main layout with navbar, footer, cart, etc.
function MainLayout() {
  const location = useLocation();
  
  // Hide navbar on auth pages for cleaner login/signup experience
  const authPages = ['/login', '/register', '/member/forgot-password', '/reset-password', '/admin/forgot-password', '/admin/reset-password'];
  const hideNavbar = authPages.some(path => location.pathname === path || location.pathname.startsWith(path));
  
  return (
    <div className="App overflow-x-hidden">
      <ScrollToTop />
      <AppBadgeManager />
      {!hideNavbar && <Navbar />}
      {/* MemberMobileNav moved to AppRouter level for global availability */}
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Home is now outside MainLayout for clean landing experience */}
          
          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<ProtectedRoute><MemberDashboard /></ProtectedRoute>} />
          
          {/* Member Password Reset - New Pages */}
          <Route path="/member/forgot-password" element={<MemberForgotPassword />} />
          <Route path="/reset-password" element={<MemberResetPassword />} />
          
          {/* Search Results */}
          <Route path="/search" element={<SearchResults />} />
          
          {/* Special Pages */}
          <Route path="/custom-cake" element={<ProtectedRoute><CustomCakeDesigner /></ProtectedRoute>} />
          <Route path="/concierge" element={<MiraConcierge />} />
          <Route path="/checkout" element={<ProtectedRoute><UnifiedCheckout /></ProtectedRoute>} />
          <Route path="/checkout-old" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
          {/* About page moved outside MainLayout for clean experience */}
          {/* Membership route is defined outside MainLayout for clean entry */}
          <Route path="/autoship" element={<Autoship />} />
          <Route path="/autoship-products" element={<ProductListing category="autoship" />} />
          <Route path="/meal-plan" element={<MealPlanPage />} />
          <Route path="/admin/forgot-password" element={<ForgotPassword />} />
          <Route path="/admin/reset-password" element={<ResetPassword />} />
          <Route path="/admin" element={<AdminProtectedRoute><Admin /></AdminProtectedRoute>} />
          <Route path="/admin/docs" element={<AdminProtectedRoute><AdminDocs /></AdminProtectedRoute>} />
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
        <Route path="/terms" element={<Policies />} />
        <Route path="/shipping-policy" element={<Policies />} />
        <Route path="/ai-disclaimer" element={<Policies />} />
        
        {/* Content Pages */}
        <Route path="/faqs" element={<FAQs />} />
        <Route path="/insights" element={<Insights />} />
        <Route path="/streaties" element={<Streaties />} />
        <Route path="/franchise" element={<Franchise />} />
        <Route path="/contact" element={<Contact />} />
        
        {/* ALL Life Pillars - Open for browsing (login required only at checkout) */}
        {/* Celebrate Pillar - Single consolidated page */}
        <Route path="/celebrate" element={<Navigate to="/celebrate-soul" replace />} />
        {/* GOLD STANDARD Celebrate - Sandbox for new design */}
        <Route path="/celebrate-new" element={<CelebrateNewPage />} />
        {/* SOUL-FIRST Celebrate - New Architecture March 2026 */}
        <Route path="/celebrate-soul" element={<CelebrateSoulPage />} />
        <Route path="/occasion-box/:type" element={<OccasionBoxPage />} />
        <Route path="/occasion-box" element={<OccasionBoxPage />} />
        <Route path="/build-box" element={<OccasionBoxPage />} />
        
        {/* Redirect all celebrate sub-pages to main celebrate page with category */}
        <Route path="/celebrate/cakes" element={<Navigate to="/celebrate?category=cakes" replace />} />
        <Route path="/celebrate/birthday-cakes" element={<Navigate to="/celebrate?category=cakes" replace />} />
        <Route path="/celebrate/breed-cakes" element={<Navigate to="/celebrate?category=breed-cakes" replace />} />
        <Route path="/celebrate/pupcakes" element={<Navigate to="/celebrate?category=pupcakes" replace />} />
        <Route path="/celebrate/treats" element={<Navigate to="/celebrate?category=treats" replace />} />
        <Route path="/celebrate/valentine" element={<Navigate to="/celebrate?category=valentine" replace />} />
        <Route path="/celebrate/desi" element={<Navigate to="/celebrate?category=desi-treats" replace />} />
        <Route path="/celebrate/hampers" element={<Navigate to="/celebrate?category=hampers" replace />} />
        <Route path="/celebrate/cat" element={<Navigate to="/celebrate?category=cat-treats" replace />} />
        <Route path="/celebrate/accessories" element={<Navigate to="/celebrate?category=accessories" replace />} />
        <Route path="/celebrate/:category" element={<CelebrateRedirect />} />
        
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
        <Route path="/dine/meals" element={<MealsPage />} />
        <Route path="/dine/fresh-meals" element={<ProductListing category="fresh-meals" pillar="dine" />} />
        <Route path="/dine/treats" element={<ProductListing category="treats" pillar="dine" />} />
        <Route path="/dine/desi-treats" element={<ProductListing category="desi-treats" pillar="dine" />} />
        <Route path="/dine/frozen" element={<ProductListing category="frozen" pillar="dine" />} />
        <Route path="/dine/supplements" element={<ProductListing category="supplements" pillar="dine" />} />
        <Route path="/dine/:category" element={<ProductListing pillar="dine" />} />
        
        <Route path="/stay" element={<StayPage />} />
        <Route path="/stay/beds" element={<ProductListing category="beds" pillar="stay" />} />
        <Route path="/stay/mats" element={<ProductListing category="mats" pillar="stay" />} />
        <Route path="/stay/kennels" element={<ProductListing category="kennels" pillar="stay" />} />
        <Route path="/stay/bowls" element={<ProductListing category="bowls" pillar="stay" />} />
        <Route path="/stay/:category" element={<ProductListing pillar="stay" />} />
        
        <Route path="/travel" element={<TravelPage />} />
        <Route path="/travel/carriers" element={<ProductListing category="carriers" pillar="travel" />} />
        <Route path="/travel/car" element={<ProductListing category="car-accessories" pillar="travel" />} />
        <Route path="/travel/outdoor" element={<ProductListing category="outdoor" pillar="travel" />} />
        <Route path="/travel/:category" element={<ProductListing pillar="travel" />} />
        
        <Route path="/care" element={<CarePage />} />
        <Route path="/care/grooming" element={<ProductListing category="grooming" pillar="care" />} />
        <Route path="/care/health" element={<ProductListing category="health" pillar="care" />} />
        <Route path="/care/supplements" element={<ProductListing category="supplements" pillar="care" />} />
        <Route path="/care/spa" element={<ProductListing category="spa" pillar="care" />} />
        <Route path="/care/:category" element={<ProductListing pillar="care" />} />
        
        <Route path="/enjoy" element={<EnjoyPage />} />
        <Route path="/enjoy/toys" element={<ProductListing category="toys" pillar="enjoy" />} />
        <Route path="/enjoy/chews" element={<ProductListing category="chews" pillar="enjoy" />} />
        <Route path="/enjoy/games" element={<ProductListing category="games" pillar="enjoy" />} />
        <Route path="/enjoy/puzzles" element={<ProductListing category="puzzles" pillar="enjoy" />} />
        <Route path="/enjoy/:category" element={<ProductListing pillar="enjoy" />} />
        
        <Route path="/fit" element={<FitPage />} />
        <Route path="/fit/leashes" element={<ProductListing category="leashes" pillar="fit" />} />
        <Route path="/fit/harnesses" element={<ProductListing category="harnesses" pillar="fit" />} />
        <Route path="/fit/collars" element={<ProductListing category="collars" pillar="fit" />} />
        <Route path="/fit/apparel" element={<ProductListing category="apparel" pillar="fit" />} />
        <Route path="/fit/:category" element={<ProductListing pillar="fit" />} />
        
        <Route path="/learn" element={<LearnPage />} />
        <Route path="/learn/topic/:topicSlug" element={<LearnTopicPage />} />
        <Route path="/learn/training" element={<ProductListing category="training" pillar="learn" />} />
        <Route path="/learn/puzzles" element={<ProductListing category="puzzles" pillar="learn" />} />
        <Route path="/learn/books" element={<ProductListing category="books" pillar="learn" />} />
        <Route path="/learn/:topicSlug" element={<LearnTopicPage />} />
        
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
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/services/:pillar/:serviceId" element={<ServiceDetailPage />} />
        <Route path="/product/:productId" element={<ProductDetailPage />} />
        <Route path="/community" element={<PillarPage />} />
        
        {/* Campaign Collections */}
        <Route path="/collections/:slug" element={<CollectionPage />} />
        
        {/* Pet Wrapped - The viral acquisition engine */}
        <Route path="/wrapped/:petId" element={<PetWrappedViewer />} />
        <Route path="/wrapped-welcome" element={<WrappedWelcomePage />} />
        
        {/* Partner Onboarding */}
        <Route path="/partner" element={<PartnerOnboarding />} />
        <Route path="/become-a-partner" element={<PartnerOnboarding />} />
        </Routes>
      </Suspense>
      <Footer />
      <CartSidebar />
      <MiraAI />
      {/* Pulse removed - voice capabilities now inside MiraAI */}
      <ConditionalFloatingButton />
      {/* Mobile Bottom Navigation - Only shows on mobile */}
      <ConditionalMobileNav />
      <Toaster />
      <SonnerToaster 
        richColors 
        position="bottom-right"
        style={{"--z-index": "999999"}}
        toastOptions={{
          style: { zIndex: 999999 },
        }}
      />
    </div>
  );
}

export default App;

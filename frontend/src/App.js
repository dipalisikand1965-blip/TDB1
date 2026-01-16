import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";
import { Toaster } from "./components/ui/toaster";

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
      
      {/* Main app routes - WITH navbar */}
      <Route path="/*" element={<MainLayout />} />
    </Routes>
  );
}

// Main layout with navbar, footer, cart, etc.
function MainLayout() {
  return (
    <div className="App">
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
        <Route path="/about" element={<About />} />
        <Route path="/membership" element={<Membership />} />
        <Route path="/autoship" element={<Autoship />} />
        <Route path="/autoship-products" element={<ProductListing category="autoship" />} />
        <Route path="/admin" element={<Admin />} />
        
        {/* Pet Profile */}
        <Route path="/pet-profile" element={<PetProfile />} />
        <Route path="/my-pets" element={<MyPets />} />
        <Route path="/pets" element={<MyPets />} />
        
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
        
        {/* Life Pillars */}
        <Route path="/celebrate" element={<ProductListing category="cakes" />} />
        <Route path="/dine" element={<PillarPage />} />
        <Route path="/stay" element={<PillarPage />} />
        <Route path="/travel" element={<PillarPage />} />
        <Route path="/care" element={<PillarPage />} />
        <Route path="/pillar/:pillarId" element={<PillarPage />} />
      </Routes>
      <Footer />
      <CartSidebar />
      <MiraAI />
      <Toaster />
    </div>
  );
}

export default App;

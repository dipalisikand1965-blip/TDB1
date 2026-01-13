import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import CartSidebar from "./components/CartSidebar";
import MiraAI from "./components/MiraAI";
import { Toaster } from "./components/ui/toaster";
import Home from "./pages/Home";
import ProductListing from "./pages/ProductListing";
import CustomCakeDesigner from "./pages/CustomCakeDesigner";
import MiraConcierge from "./pages/MiraConcierge";
import Checkout from "./pages/Checkout";
import About from "./pages/About";
import Membership from "./pages/Membership";
import Admin from "./pages/Admin";

function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <div className="App">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/cakes" element={<ProductListing category="cakes" />} />
            <Route path="/treats" element={<ProductListing category="treats" />} />
            <Route path="/meals" element={<ProductListing category="meals" />} />
            <Route path="/custom" element={<ProductListing category="custom" />} />
            <Route path="/desi" element={<ProductListing category="desi" />} />
            <Route path="/concierge" element={<MiraConcierge />} />
            <Route path="/pan-india" element={<ProductListing category="pan-india" />} />
            <Route path="/merchandise" element={<ProductListing category="merchandise" />} />
            <Route path="/mini-cakes" element={<ProductListing category="mini-cakes" />} />
            <Route path="/frozen" element={<ProductListing category="frozen" />} />
            <Route path="/accessories" element={<ProductListing category="accessories" />} />
            <Route path="/all" element={<ProductListing category="all" />} />
            <Route path="/custom-cake" element={<CustomCakeDesigner />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/about" element={<About />} />
            <Route path="/membership" element={<Membership />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
          <Footer />
          <CartSidebar />
          <MiraAI />
          <Toaster />
        </div>
      </BrowserRouter>
    </CartProvider>
  );
}

export default App;

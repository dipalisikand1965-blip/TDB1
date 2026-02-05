import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Facebook, Instagram, Youtube, Mail, Phone, MapPin, 
  MessageCircle, PawPrint, Sparkles, Brain, Heart, ChevronDown, ChevronUp
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const WHATSAPP_NUMBER = '919663185747';
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hi! I'd like to know more about The Doggy Company 🐕")}`;

const Footer = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [expandedSection, setExpandedSection] = useState(null);
  
  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };
  
  return (
    <footer className="bg-gray-900 text-gray-300 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        
        {/* ==================== MOBILE LAYOUT ==================== */}
        <div className="lg:hidden">
          
          {/* LOGO & SOCIAL ICONS - Always visible at top */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="h-10 w-10 bg-white rounded-lg p-1 flex items-center justify-center">
                <img src="/logo-new.png" alt="The Doggy Company" className="h-8 w-8 object-contain" />
              </div>
              <div>
                <div className="text-base font-bold leading-none">
                  <span className="text-teal-400">the</span>
                  <span className="text-purple-400">doggy</span>
                  <span className="text-pink-400">company</span>
                </div>
                <div className="text-[10px] text-teal-400 tracking-wider">PET CONCIERGE®</div>
              </div>
            </div>
            <p className="text-sm text-gray-400 mb-6">
              Your Pet&apos;s Life, Thoughtfully Orchestrated.
            </p>
            
            {/* Social Icons - Row of circles */}
            <div className="flex justify-center gap-4 mb-6">
              <a href="https://www.facebook.com/thedoggybakery" target="_blank" rel="noopener noreferrer" 
                className="w-10 h-10 rounded-full bg-gray-800 hover:bg-blue-600 flex items-center justify-center transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="https://www.instagram.com/the_doggy_bakery/" target="_blank" rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gray-800 hover:bg-pink-600 flex items-center justify-center transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="https://www.youtube.com/@TheDoggyBakery" target="_blank" rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gray-800 hover:bg-red-600 flex items-center justify-center transition-colors">
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>
          
          {/* Divider */}
          <div className="border-t border-gray-800 my-6" />
          
          {/* COLLAPSIBLE SECTIONS */}
          <div className="space-y-2">
            
            {/* Pillars Section */}
            <div className="border border-gray-800 rounded-lg overflow-hidden">
              <button 
                onClick={() => toggleSection('pillars')}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-800/50 hover:bg-gray-800 transition-colors"
              >
                <span className="font-semibold text-white text-sm">Explore Pillars</span>
                {expandedSection === 'pillars' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {expandedSection === 'pillars' && (
                <div className="grid grid-cols-2 gap-2 p-4">
                  <Link to="/celebrate" className="text-sm py-2 hover:text-pink-400 transition-colors">🎂 Celebrate</Link>
                  <Link to="/dine" className="text-sm py-2 hover:text-pink-400 transition-colors">🍽️ Dine</Link>
                  <Link to="/stay" className="text-sm py-2 hover:text-pink-400 transition-colors">🏨 Stay</Link>
                  <Link to="/travel" className="text-sm py-2 hover:text-pink-400 transition-colors">✈️ Travel</Link>
                  <Link to="/care" className="text-sm py-2 hover:text-pink-400 transition-colors">💊 Care</Link>
                  <Link to="/enjoy" className="text-sm py-2 hover:text-pink-400 transition-colors">🎾 Enjoy</Link>
                  <Link to="/fit" className="text-sm py-2 hover:text-pink-400 transition-colors">🏃 Fit</Link>
                  <Link to="/learn" className="text-sm py-2 hover:text-pink-400 transition-colors">🎓 Learn</Link>
                  <Link to="/paperwork" className="text-sm py-2 hover:text-pink-400 transition-colors">📄 Paperwork</Link>
                  <Link to="/advisory" className="text-sm py-2 hover:text-pink-400 transition-colors">📋 Advisory</Link>
                  <Link to="/emergency" className="text-sm py-2 hover:text-pink-400 transition-colors">🚨 Emergency</Link>
                  <Link to="/farewell" className="text-sm py-2 hover:text-pink-400 transition-colors">🌈 Farewell</Link>
                  <Link to="/adopt" className="text-sm py-2 hover:text-pink-400 transition-colors">🐾 Adopt</Link>
                  <Link to="/shop" className="text-sm py-2 hover:text-pink-400 transition-colors">🛒 Shop</Link>
                </div>
              )}
            </div>
            
            {/* Intelligence Section */}
            <div className="border border-gray-800 rounded-lg overflow-hidden">
              <button 
                onClick={() => toggleSection('intelligence')}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-800/50 hover:bg-gray-800 transition-colors"
              >
                <span className="font-semibold text-white text-sm">Intelligence</span>
                {expandedSection === 'intelligence' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {expandedSection === 'intelligence' && (
                <div className="p-4 space-y-3">
                  <Link to="/membership" className="flex items-center gap-2 text-sm py-2 hover:text-purple-400 transition-colors">
                    <PawPrint className="w-4 h-4" /> Pet Soul™
                  </Link>
                  <button 
                    onClick={() => window.dispatchEvent(new CustomEvent('openMiraAI'))}
                    className="flex items-center gap-2 text-sm py-2 hover:text-purple-400 transition-colors w-full text-left"
                  >
                    <Sparkles className="w-4 h-4" /> Mira AI
                  </button>
                  <Link to="/autoship" className="flex items-center gap-2 text-sm py-2 hover:text-blue-400 transition-colors">
                    🔄 Autoship &amp; Save
                  </Link>
                  <Link to="/about" className="text-sm py-2 block hover:text-pink-400 transition-colors">About Us</Link>
                  <Link to="/faqs" className="text-sm py-2 block hover:text-pink-400 transition-colors">FAQs</Link>
                </div>
              )}
            </div>
            
            {/* Contact Section */}
            <div className="border border-gray-800 rounded-lg overflow-hidden">
              <button 
                onClick={() => toggleSection('contact')}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-800/50 hover:bg-gray-800 transition-colors"
              >
                <span className="font-semibold text-white text-sm">Contact Us</span>
                {expandedSection === 'contact' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {expandedSection === 'contact' && (
                <div className="p-4 space-y-3">
                  <a href="tel:+919739982582" className="flex items-center gap-3 text-sm py-2 hover:text-white transition-colors">
                    <Phone className="w-4 h-4 text-gray-500" />
                    +91 9739982582
                  </a>
                  <a href="mailto:woof@thedoggycompany.in" className="flex items-center gap-3 text-sm py-2 hover:text-white transition-colors">
                    <Mail className="w-4 h-4 text-gray-500" />
                    woof@thedoggycompany.in
                  </a>
                  <div className="flex items-start gap-3 text-sm py-2 text-gray-500">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    Koramangala, Bangalore
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Divider */}
          <div className="border-t border-gray-800 my-6" />
          
          {/* Pet Soul CTA */}
          <div className="text-center mb-6">
            {user ? (
              <Link 
                to="/membership" 
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-semibold hover:opacity-90 transition-opacity shadow-lg text-sm"
              >
                <Brain className="w-4 h-4" />
                Your Pet Soul Journey
              </Link>
            ) : (
              <Link 
                to="/membership" 
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-semibold hover:opacity-90 transition-opacity shadow-lg text-sm"
              >
                <Heart className="w-4 h-4" />
                Start Your Pet Soul Journey
              </Link>
            )}
          </div>
          
          {/* Policies - Compact rows */}
          <div className="flex flex-wrap justify-center gap-x-3 gap-y-2 text-xs text-gray-500 mb-3">
            <Link to="/shipping-policy" className="hover:text-pink-400">Shipping</Link>
            <span className="text-gray-700">•</span>
            <Link to="/refund-policy" className="hover:text-pink-400">Refunds</Link>
            <span className="text-gray-700">•</span>
            <Link to="/privacy-policy" className="hover:text-pink-400">Privacy</Link>
            <span className="text-gray-700">•</span>
            <Link to="/terms" className="hover:text-pink-400">Terms</Link>
          </div>
          <div className="flex flex-wrap justify-center gap-x-3 gap-y-2 text-xs text-gray-500 mb-4">
            <Link to="/franchise" className="hover:text-pink-400">Own A Bakery</Link>
            <span className="text-gray-700">•</span>
            <Link to="/partner" className="hover:text-pink-400">Partner With Us</Link>
          </div>
          
          {/* AI Disclaimer - Mobile */}
          <div className="text-center text-xs text-gray-500 mb-4 px-2">
            <p className="flex items-center justify-center gap-1.5 flex-wrap">
              <Sparkles className="w-3 h-3 text-purple-400" />
              <span>Mira is powered by AI and can make mistakes.</span>
              <Link to="/ai-disclaimer" className="text-purple-400 hover:text-purple-300 underline">Learn more</Link>
            </p>
          </div>
          
          {/* Copyright */}
          <div className="text-center text-xs text-gray-500 space-y-2">
            <p className="text-gray-400">© 2026 The Doggy Company®. All rights reserved.</p>
            <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
              <span>Les Concierges® (1998)</span>
              <span className="text-gray-700">•</span>
              <span>Club Concierge®</span>
              <span className="text-gray-700">•</span>
              <span>The Doggy Bakery® (2020)</span>
              <span className="text-gray-700">•</span>
              <span>Mira®</span>
            </p>
          </div>
        </div>
        
        {/* ==================== DESKTOP LAYOUT (unchanged) ==================== */}
        <div className="hidden lg:block">
          <div className="grid grid-cols-5 gap-8">
            
            {/* COLUMN 1 — THE SYSTEM */}
            <div className="col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 bg-white rounded-lg p-1 flex items-center justify-center">
                  <img src="/logo-new.png" alt="The Doggy Company" className="h-6 w-6 object-contain" />
                </div>
                <div>
                  <div className="text-sm font-bold leading-none">
                    <span className="text-teal-400">the</span>
                    <span className="text-purple-400">doggy</span>
                    <span className="text-pink-400">company</span>
                  </div>
                  <div className="text-[10px] text-teal-400 tracking-wider">PET CONCIERGE®</div>
                </div>
              </div>
              <p className="text-sm text-gray-400 mb-4 leading-relaxed">
                Your Pet&apos;s Life, Thoughtfully Orchestrated.
              </p>
              <div className="flex space-x-4">
                <a href="https://www.facebook.com/thedoggybakery" target="_blank" rel="noopener noreferrer" className="hover:text-pink-400 transition-colors p-1">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="https://www.instagram.com/the_doggy_bakery/" target="_blank" rel="noopener noreferrer" className="hover:text-pink-400 transition-colors p-1">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="https://www.youtube.com/@TheDoggyBakery" target="_blank" rel="noopener noreferrer" className="hover:text-red-400 transition-colors p-1">
                  <Youtube className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* COLUMN 2 — PILLARS */}
            <div>
              <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Pillars</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/celebrate" className="hover:text-pink-400 transition-colors">🎂 Celebrate</Link></li>
                <li><Link to="/dine" className="hover:text-pink-400 transition-colors">🍽️ Dine</Link></li>
                <li><Link to="/stay" className="hover:text-pink-400 transition-colors">🏨 Stay</Link></li>
                <li><Link to="/travel" className="hover:text-pink-400 transition-colors">✈️ Travel</Link></li>
                <li><Link to="/care" className="hover:text-pink-400 transition-colors">💊 Care</Link></li>
                <li><Link to="/enjoy" className="hover:text-pink-400 transition-colors">🎾 Enjoy</Link></li>
                <li><Link to="/fit" className="hover:text-pink-400 transition-colors">🏃 Fit</Link></li>
                <li><Link to="/learn" className="hover:text-pink-400 transition-colors">🎓 Learn</Link></li>
              </ul>
            </div>

            {/* COLUMN 3 — SERVICES (NEW) */}
            <div>
              <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Services</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/services/grooming" className="hover:text-pink-400 transition-colors">✂️ Grooming</Link></li>
                <li><Link to="/services/training" className="hover:text-pink-400 transition-colors">🎓 Training</Link></li>
                <li><Link to="/services/boarding" className="hover:text-pink-400 transition-colors">🏠 Boarding</Link></li>
                <li><Link to="/services/daycare" className="hover:text-pink-400 transition-colors">🌞 Daycare</Link></li>
                <li><Link to="/services/vet" className="hover:text-pink-400 transition-colors">🏥 Vet Care</Link></li>
                <li><Link to="/services/walking" className="hover:text-pink-400 transition-colors">🐕 Dog Walking</Link></li>
                <li><Link to="/services/photography" className="hover:text-pink-400 transition-colors">📸 Pet Photography</Link></li>
              </ul>
            </div>

            {/* COLUMN 4 — INTELLIGENCE */}
            <div>
              <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Intelligence</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/membership" className="hover:text-purple-400 transition-colors flex items-center gap-1">
                    <PawPrint className="w-3 h-3" /> Pet Soul™
                  </Link>
                </li>
                <li>
                  <button 
                    onClick={() => window.dispatchEvent(new CustomEvent('openMiraAI'))}
                    className="hover:text-purple-400 transition-colors flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" /> Mira AI
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => window.dispatchEvent(new CustomEvent('openSoulExplainer'))}
                    className="hover:text-teal-400 transition-colors flex items-center gap-1"
                  >
                    ▶️ How Pet Soul™ Works
                  </button>
                </li>
                <li><Link to="/autoship" className="hover:text-blue-400 transition-colors">🔄 Autoship &amp; Save</Link></li>
                <li><Link to="/about" className="hover:text-pink-400 transition-colors">About Us</Link></li>
                <li><Link to="/faqs" className="hover:text-pink-400 transition-colors">FAQs</Link></li>
                <li><Link to="/insights" className="hover:text-pink-400 transition-colors">TDC Insights</Link></li>
              </ul>
            </div>

            {/* COLUMN 5 — CONTACT */}
            <div>
              <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Connect</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span>+91 9739982582</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span>woof@thedoggycompany.in</span>
                </li>
                <li className="flex items-start gap-2 mt-4">
                  <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                  <span className="text-xs text-gray-500">
                    Koramangala, Bangalore
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Pet Soul CTA */}
          <div className="border-t border-gray-800 mt-10 pt-8">
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-6">
              {user ? (
                <>
                  <Link 
                    to="/membership" 
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-semibold hover:opacity-90 transition-opacity shadow-lg"
                  >
                    <Brain className="w-5 h-5" />
                    Your Pet Soul Journey
                  </Link>
                  {/* Hide on mobile - floating Mira widget always visible */}
                  <button 
                    onClick={() => window.dispatchEvent(new CustomEvent('openMiraAI'))}
                    className="hidden md:inline-flex items-center gap-2 px-6 py-3 border border-purple-500 text-purple-400 rounded-full font-semibold hover:bg-purple-500/10 transition-all"
                  >
                    <Sparkles className="w-5 h-5" />
                    Ask Mira
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    to="/membership" 
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-semibold hover:opacity-90 transition-opacity shadow-lg"
                  >
                    <Heart className="w-5 h-5" />
                    Start Your Pet Soul Journey
                  </Link>
                  {/* Hide on mobile - floating Mira widget always visible */}
                  <button 
                    onClick={() => window.dispatchEvent(new CustomEvent('openMiraAI'))}
                    className="hidden md:inline-flex items-center gap-2 px-6 py-3 border border-purple-500 text-purple-400 rounded-full font-semibold hover:bg-purple-500/10 transition-all"
                  >
                    <Sparkles className="w-5 h-5" />
                    Meet Mira AI
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Policies & Copyright */}
          <div className="border-t border-gray-800 pt-6">
            <div className="flex flex-wrap justify-center gap-4 mb-4 text-xs text-gray-500">
              <Link to="/shipping-policy" className="hover:text-pink-400 transition-colors">Shipping</Link>
              <span>•</span>
              <Link to="/refund-policy" className="hover:text-pink-400 transition-colors">Refunds</Link>
              <span>•</span>
              <Link to="/privacy-policy" className="hover:text-pink-400 transition-colors">Privacy</Link>
              <span>•</span>
              <Link to="/terms" className="hover:text-pink-400 transition-colors">Terms</Link>
              <span>•</span>
              <Link to="/franchise" className="hover:text-pink-400 transition-colors">Own A Bakery</Link>
              <span>•</span>
              <Link to="/partner" className="hover:text-pink-400 transition-colors">Partner With Us</Link>
            </div>
            
            {/* AI Disclaimer */}
            <div className="text-center text-xs text-gray-500 mb-4 px-4">
              <p className="flex items-center justify-center gap-1.5 flex-wrap">
                <Sparkles className="w-3 h-3 text-purple-400" />
                <span>Mira is powered by AI and can make mistakes. Check important info.</span>
                <Link to="/ai-disclaimer" className="text-purple-400 hover:text-purple-300 underline">Learn more</Link>
              </p>
            </div>
            
            <div className="text-center text-xs text-gray-500 space-y-2">
              <p className="text-gray-400">© 2026 The Doggy Company®. All rights reserved.</p>
              <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
                <span>Les Concierges® (1998)</span>
                <span className="text-gray-600">•</span>
                <span>Club Concierge®</span>
                <span className="text-gray-600">•</span>
                <span>The Doggy Bakery® (2020)</span>
                <span className="text-gray-600">•</span>
                <span>Mira®</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

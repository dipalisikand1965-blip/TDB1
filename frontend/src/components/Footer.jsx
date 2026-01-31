import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Facebook, Instagram, Youtube, Mail, Phone, MapPin, 
  MessageCircle, PawPrint, Sparkles, Brain, Heart
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Logo, { LogoCompact } from './Logo';

const WHATSAPP_NUMBER = '919663185747';
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hi! I'd like to know more about The Doggy Company 🐕")}`;

const Footer = () => {
  const location = useLocation();
  const { user } = useAuth();
  
  return (
    <footer className="bg-gray-900 text-gray-300 relative z-10">
      {/* WhatsApp floating button moved to FloatingContactButton.jsx stack */}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Mobile: 1 column stacked, Tablet: 2-3 columns, Desktop: 5 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 sm:gap-8">
          
          {/* COLUMN 1 — THE SYSTEM (CORE IDENTITY) */}
          <div className="col-span-2 md:col-span-1">
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
            <div className="flex space-x-3">
              <a href="https://www.facebook.com/thedoggybakery" target="_blank" rel="noopener noreferrer" className="hover:text-pink-400 transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="https://www.instagram.com/the_doggy_bakery/" target="_blank" rel="noopener noreferrer" className="hover:text-pink-400 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="https://www.youtube.com/@TheDoggyBakery" target="_blank" rel="noopener noreferrer" className="hover:text-red-400 transition-colors">
                <Youtube className="w-5 h-5" />
              </a>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="hover:text-green-400 transition-colors">
                <MessageCircle className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* COLUMN 2 — THE PILLARS */}
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
            </ul>
          </div>

          {/* COLUMN 3 — MORE PILLARS */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider opacity-0">More</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/learn" className="hover:text-pink-400 transition-colors">🎓 Learn</Link></li>
              <li><Link to="/paperwork" className="hover:text-pink-400 transition-colors">📄 Paperwork</Link></li>
              <li><Link to="/advisory" className="hover:text-pink-400 transition-colors">📋 Advisory</Link></li>
              <li><Link to="/emergency" className="hover:text-pink-400 transition-colors">🚨 Emergency</Link></li>
              <li><Link to="/farewell" className="hover:text-pink-400 transition-colors">🌈 Farewell</Link></li>
              <li><Link to="/adopt" className="hover:text-pink-400 transition-colors">🐾 Adopt</Link></li>
              <li><Link to="/shop" className="hover:text-pink-400 transition-colors">🛒 Shop</Link></li>
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
              <li className="mt-3">
                <a 
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full text-sm transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Pet Soul CTA - Context-aware */}
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
                <button 
                  onClick={() => window.dispatchEvent(new CustomEvent('openMiraAI'))}
                  className="inline-flex items-center gap-2 px-6 py-3 border border-purple-500 text-purple-400 rounded-full font-semibold hover:bg-purple-500/10 transition-all"
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
                <button 
                  onClick={() => window.dispatchEvent(new CustomEvent('openMiraAI'))}
                  className="inline-flex items-center gap-2 px-6 py-3 border border-purple-500 text-purple-400 rounded-full font-semibold hover:bg-purple-500/10 transition-all"
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
    </footer>
  );
};

export default Footer;

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Facebook, Instagram, Youtube, Mail, Phone, 
  MessageCircle, MapPin
} from 'lucide-react';

const WHATSAPP_NUMBER = '919663185747';
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hi! I'd like to know more about The Doggy Company")}`;

const Footer = () => {
  const location = useLocation();
  
  // Hide floating button on admin pages
  const hiddenPaths = ['/admin', '/agent', '/login'];
  const shouldHideFloat = hiddenPaths.some(path => location.pathname.startsWith(path));
  
  return (
    <footer className="bg-slate-900 text-gray-400">
      {/* Floating WhatsApp Button */}
      {!shouldHideFloat && (
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 left-6 z-40 bg-green-500 hover:bg-green-600 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all"
          data-testid="whatsapp-float-btn"
          aria-label="Contact on WhatsApp"
        >
          <MessageCircle className="w-6 h-6" />
        </a>
      )}

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 bg-white rounded-lg p-1">
                <img src="/logo-new.png" alt="Logo" className="h-full w-full object-contain" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">
                  <span className="text-teal-400">the</span>
                  <span className="text-purple-400">doggy</span>
                  <span className="text-pink-400">company</span>
                </div>
              </div>
            </div>
            <p className="text-sm mb-4 leading-relaxed">
              India's First Pet Life Operating System. Where every pet is remembered.
            </p>
            <div className="flex gap-4">
              <a href="https://www.facebook.com/thedoggybakery" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="https://www.instagram.com/the_doggy_bakery/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="https://www.youtube.com/@TheDoggyBakery" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm">Shop</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/cakes" className="hover:text-white transition-colors">Birthday Cakes</Link></li>
              <li><Link to="/treats" className="hover:text-white transition-colors">Treats</Link></li>
              <li><Link to="/shop?category=food" className="hover:text-white transition-colors">Food</Link></li>
              <li><Link to="/shop?category=toys" className="hover:text-white transition-colors">Toys</Link></li>
              <li><Link to="/shop?category=grooming" className="hover:text-white transition-colors">Grooming</Link></li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm">Services</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/stay" className="hover:text-white transition-colors">Pet Hotels</Link></li>
              <li><Link to="/travel" className="hover:text-white transition-colors">Pet Travel</Link></li>
              <li><Link to="/care?type=grooming" className="hover:text-white transition-colors">Grooming</Link></li>
              <li><Link to="/learn" className="hover:text-white transition-colors">Training</Link></li>
              <li><Link to="/advisory" className="hover:text-white transition-colors">Advisory</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm">Company</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              <li><Link to="/faqs" className="hover:text-white transition-colors">FAQs</Link></li>
              <li><Link to="/policies" className="hover:text-white transition-colors">Policies</Link></li>
              <li><Link to="/franchise" className="hover:text-white transition-colors">Franchise</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm">Contact</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <Phone className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <a href="tel:+919663185747" className="hover:text-white transition-colors">+91 96631 85747</a>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <a href="mailto:hello@thedoggycompany.in" className="hover:text-white transition-colors">hello@thedoggycompany.in</a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Bangalore, India</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-10 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
            <p>© {new Date().getFullYear()} The Doggy Company. All rights reserved.</p>
            <div className="flex gap-6">
              <Link to="/policies?tab=privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link to="/policies?tab=terms" className="hover:text-white transition-colors">Terms</Link>
              <Link to="/policies?tab=refund" className="hover:text-white transition-colors">Refunds</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

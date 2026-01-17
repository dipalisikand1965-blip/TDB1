import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Youtube, Mail, Phone, MapPin, MessageCircle, Store, Truck } from 'lucide-react';

const WHATSAPP_NUMBER = '919663185747';
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hi! I'm interested in ordering from The Doggy Company 🐕")}`;

// Store Locations
const STORES = [
  {
    city: 'Mumbai',
    address: 'Shop 9, off Yari Road, Jeet Nagar, Versova, Andheri West, Mumbai, Maharashtra 400061',
    shortAddress: 'Versova, Andheri West',
    mapUrl: 'https://maps.google.com/?q=Shop+9+off+Yari+Road+Versova+Andheri+West+Mumbai'
  },
  {
    city: 'Gurugram',
    address: 'Ground Floor, Wazirabad Rd, Wazirabad, Sector 52, Gurugram, Haryana 122003',
    shortAddress: 'Sector 52, Gurugram',
    mapUrl: 'https://maps.google.com/?q=Wazirabad+Rd+Sector+52+Gurugram'
  },
  {
    city: 'Bangalore',
    address: '147, 8th Main Rd, 3rd Block, Koramangala 3 Block, Koramangala, Bengaluru, Karnataka 560034',
    shortAddress: 'Koramangala, Bengaluru',
    mapUrl: 'https://maps.google.com/?q=147+8th+Main+Rd+Koramangala+Bengaluru'
  }
];

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Floating WhatsApp Button */}
      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 left-6 z-50 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 group"
        data-testid="whatsapp-float-btn"
        aria-label="Contact on WhatsApp"
      >
        <MessageCircle className="w-6 h-6" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap">
          Chat with us
        </span>
      </a>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <img 
                src="https://thedoggybakery.com/cdn/shop/files/TDB_Logo_1.3.5-1.png?v=1718969706" 
                alt="The Doggy Company Logo"
                className="h-10 w-auto"
              />
              <h3 className="text-white font-bold text-lg">The Doggy Company</h3>
            </div>
            <p className="text-sm mb-4">
              Your Pet Life Operating System. Celebrate, Dine, Travel, Stay & Care - all under one roof since 2020.
            </p>
            <div className="flex space-x-4">
              <a href="https://www.facebook.com/thedoggybakery" target="_blank" rel="noopener noreferrer" className="hover:text-pink-500 transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="https://www.instagram.com/the_doggy_bakery/" target="_blank" rel="noopener noreferrer" className="hover:text-pink-500 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="https://www.youtube.com/@TheDoggyBakery" target="_blank" rel="noopener noreferrer" className="hover:text-red-500 transition-colors">
                <Youtube className="w-5 h-5" />
              </a>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="hover:text-green-500 transition-colors">
                <MessageCircle className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/about" className="hover:text-pink-500 transition-colors">About Us</Link></li>
              <li><Link to="/faqs" className="hover:text-pink-500 transition-colors">FAQs</Link></li>
              <li><Link to="/insights" className="hover:text-pink-500 transition-colors">TDC Insights</Link></li>
              <li><Link to="/dine" className="hover:text-pink-500 transition-colors">Dine with Pets</Link></li>
              <li><Link to="/franchise" className="hover:text-pink-500 transition-colors">Own A Bakery</Link></li>
              <li><Link to="/partner" className="hover:text-pink-500 transition-colors">Become a Partner</Link></li>
              <li><Link to="/contact" className="hover:text-pink-500 transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          {/* Store Locations */}
          <div>
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Store className="w-4 h-4" /> Store Pickup Locations
            </h3>
            <ul className="space-y-3 text-sm">
              {STORES.map((store, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-0.5 text-pink-500 flex-shrink-0" />
                  <div>
                    <a 
                      href={store.mapUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:text-pink-500 transition-colors"
                    >
                      <strong>{store.city}:</strong> {store.shortAddress}
                    </a>
                  </div>
                </li>
              ))}
              <li className="flex items-start gap-2 mt-4 bg-purple-900/30 p-2 rounded">
                <Truck className="w-4 h-4 mt-0.5 text-purple-400 flex-shrink-0" />
                <span className="text-purple-300">
                  <strong>Pan-India Delivery:</strong> We deliver cakes & treats across India!
                </span>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start space-x-2">
                <Phone className="w-4 h-4 mt-1 flex-shrink-0" />
                <div>
                  <p>+91 9739982582</p>
                  <p>+91 9663185747</p>
                </div>
              </li>
              <li className="flex items-start space-x-2">
                <Mail className="w-4 h-4 mt-1 flex-shrink-0" />
                <p>woof@thedoggycompany.in</p>
              </li>
              <li>
                <a 
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 mt-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full text-sm transition-colors inline-flex"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp Us</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Policies Row */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-wrap justify-center gap-4 mb-6 text-sm">
            <Link to="/membership" className="hover:text-pink-500 transition-colors font-medium text-pink-400">✨ Membership</Link>
            <span className="text-gray-600">|</span>
            <Link to="/shipping-policy" className="hover:text-pink-500 transition-colors">Shipping Policy</Link>
            <span className="text-gray-600">|</span>
            <Link to="/refund-policy" className="hover:text-pink-500 transition-colors">Refund Policy</Link>
            <span className="text-gray-600">|</span>
            <Link to="/privacy-policy" className="hover:text-pink-500 transition-colors">Privacy Policy</Link>
            <span className="text-gray-600">|</span>
            <Link to="/terms-of-service" className="hover:text-pink-500 transition-colors">Terms of Service</Link>
          </div>
        </div>

        {/* Payment & Delivery Info */}
        <div className="border-t border-gray-800 pt-6">
          <div className="flex flex-wrap justify-center gap-6 mb-6 text-sm text-gray-400">
            <span>💳 Secure Payments</span>
            <span>🚚 Same Day Delivery</span>
            <span>📦 Pan-India Shipping</span>
            <span>🐕 45,000+ Happy Pets</span>
            <span>⭐ 4.9 Rating</span>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 text-sm text-center">
          <p>&copy; 2025 The Doggy Company. All rights reserved. Made with ❤️ for pets and their parents.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

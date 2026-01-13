import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin, MessageCircle, Youtube } from 'lucide-react';

const WHATSAPP_NUMBER = '919663185747';
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hi! I'm interested in ordering from The Doggy Bakery 🐕")}`;

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
                alt="The Doggy Bakery Logo"
                className="h-10 w-auto"
              />
              <h3 className="text-white font-bold text-lg">The Doggy Bakery</h3>
            </div>
            <p className="text-sm mb-4">
              Celebrating your furry friends with fresh, healthy, and delicious treats since 2020.
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
              <li><Link to="/insights" className="hover:text-pink-500 transition-colors">TDB Insights</Link></li>
              <li><Link to="/streaties" className="hover:text-pink-500 transition-colors">Streaties</Link></li>
              <li><Link to="/franchise" className="hover:text-pink-500 transition-colors">Own A Bakery</Link></li>
              <li><Link to="/contact" className="hover:text-pink-500 transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          {/* Policies */}
          <div>
            <h3 className="text-white font-semibold mb-4">Policies</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/shipping-policy" className="hover:text-pink-500 transition-colors">Shipping Policy</Link></li>
              <li><Link to="/refund-policy" className="hover:text-pink-500 transition-colors">Refund Policy</Link></li>
              <li><Link to="/privacy-policy" className="hover:text-pink-500 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms-of-service" className="hover:text-pink-500 transition-colors">Terms of Service</Link></li>
              <li><Link to="/membership" className="hover:text-pink-500 transition-colors">Membership</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start space-x-2">
                <Phone className="w-4 h-4 mt-1 flex-shrink-0" />
                <div>
                  <p>9739982582</p>
                  <p>9663185747</p>
                </div>
              </li>
              <li className="flex items-start space-x-2">
                <Mail className="w-4 h-4 mt-1 flex-shrink-0" />
                <p>woof@thedoggybakery.com</p>
              </li>
              <li className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 mt-1 flex-shrink-0" />
                <p>Bengaluru | Mumbai | Gurgaon</p>
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

        {/* Payment & Delivery Info */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-wrap justify-center gap-6 mb-6 text-sm text-gray-400">
            <span>💳 Secure Payments</span>
            <span>🚚 Same Day Delivery</span>
            <span>🐕 45,000+ Happy Pets</span>
            <span>⭐ 4.9 Rating</span>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 text-sm text-center">
          <p>&copy; 2025 The Doggy Bakery. All rights reserved. Made with ❤️ for pets and their parents.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

/**
 * ServiceQuickViewModal.jsx
 * 
 * Beautiful popup modal for service details - matching product card experience
 * Shows service info with "Book Now" / "Ask Mira" actions
 * Dark theme design for Mira pages, light theme for Services page
 */

import React, { useState } from 'react';
import { bookViaConcierge } from '../../utils/MiraCardActions';
import { tdc } from '../../utils/tdc_intent';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Clock, MapPin, Star, Check, Shield, Award, Users,
  Sparkles, Heart, Calendar, ChevronRight, PawPrint, Crown,
  MessageCircle, Phone, Info
} from 'lucide-react';
import hapticFeedback from '../../utils/haptic';

/**
 * ServiceQuickViewModal
 * @param {Object} service - Service data
 * @param {Object} pet - Current pet info (name, breed)
 * @param {boolean} isOpen - Modal visibility
 * @param {Function} onClose - Close handler
 * @param {Function} onBook - Book/Request handler
 * @param {Function} onAskMira - Ask Mira handler
 * @param {string} variant - 'dark' (for Mira pages) or 'light' (for Services page)
 */
const ServiceQuickViewModal = ({
  service,
  pet,
  isOpen,
  onClose,
  onBook,
  onAskMira,
  variant = 'dark'
}) => {
  const [isLoading, setIsLoading] = useState(false);
  
  if (!isOpen || !service) return null;
  
  const isDark = variant === 'dark';
  const petName = pet?.name || 'your pet';
  const breed = pet?.breed || '';
  
  // Get service visuals
  const getServiceImage = () => {
    if (service.image_url || service.image) {
      return service.image_url || service.image;
    }
    // Default image based on category
    return '';
  };
  
  // What's included items
  const whatsIncluded = service.whats_included || service.features || [
    'Professional service by trained staff',
    'Pet-safe products & equipment',
    'Personalized attention',
    'Post-service care tips'
  ];
  
  const handleBook = async () => {
    hapticFeedback.success();
    setIsLoading(true);
    // ── tdc.book ──
    tdc.book({ service: service?.name, pillar: service?.pillar || "platform", channel: "service_quick_view_modal" });

    try {
      await onBook?.(service);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAskMira = () => {
    hapticFeedback.buttonTap();
    onAskMira?.(service);
  };
  
  const handleClose = () => {
    hapticFeedback.modalClose();
    onClose();
  };
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 ${
          isDark ? 'bg-black/80 backdrop-blur-sm' : 'bg-black/50 backdrop-blur-sm'
        }`}
        onClick={handleClose}
      >
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className={`w-full sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col ${
            isDark 
              ? 'bg-gray-900 border-t border-purple-500/30 sm:border sm:rounded-2xl' 
              : 'bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl'
          }`}
          onClick={e => e.stopPropagation()}
        >
          {/* Header Image */}
          <div className="relative h-48 sm:h-56 overflow-hidden">
            <img
              src={getServiceImage()}
              alt={service.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            
            {/* Close button */}
            <button
              onClick={handleClose}
              className={`absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 ${
                isDark 
                  ? 'bg-gray-900/80 text-white hover:bg-gray-800' 
                  : 'bg-white/90 text-gray-800 hover:bg-white'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
            
            {/* Service name on image */}
            <div className="absolute bottom-4 left-4 right-4">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">
                {service.name}
              </h2>
              {service.base_price && (
                <p className="text-lg font-semibold text-white/90">
                  ₹{service.base_price.toLocaleString()}
                </p>
              )}
            </div>
          </div>
          
          {/* Content */}
          <div className={`p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            
            {/* Mira's Insight */}
            <div className={`p-3 rounded-xl ${
              isDark 
                ? 'bg-purple-900/30 border border-purple-500/30' 
                : 'bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100'
            }`}>
              <div className="flex items-start gap-2">
                <Sparkles className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                  isDark ? 'text-purple-400' : 'text-purple-500'
                }`} />
                <div>
                  <p className={`text-xs font-semibold mb-1 ${
                    isDark ? 'text-purple-300' : 'text-purple-600'
                  }`}>
                    Mira's insight
                  </p>
                  <p className={`text-sm ${
                    isDark ? 'text-purple-200' : 'text-purple-700'
                  }`}>
                    {service.mira_insight || `Every dog is unique. This service can be tailored to ${petName}'s specific needs.`}
                  </p>
                </div>
              </div>
            </div>
            
            {/* About */}
            {service.description && (
              <div>
                <h3 className={`text-sm font-semibold mb-2 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  About this service
                </h3>
                <p className={`text-sm leading-relaxed ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {service.description}
                </p>
              </div>
            )}
            
            {/* What's Included */}
            <div>
              <h3 className={`text-sm font-semibold mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                What's included
              </h3>
              <div className="space-y-2">
                {(Array.isArray(whatsIncluded) ? whatsIncluded : [whatsIncluded]).map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                      isDark ? 'text-green-400' : 'text-green-500'
                    }`} />
                    <span className={`text-sm ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Trust badges */}
            <div className="flex flex-wrap gap-2">
              <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs ${
                isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'
              }`}>
                <Shield className="w-3.5 h-3.5" />
                Verified Provider
              </div>
              <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs ${
                isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'
              }`}>
                <Award className="w-3.5 h-3.5" />
                Quality Assured
              </div>
              <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs ${
                isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'
              }`}>
                <Users className="w-3.5 h-3.5" />
                500+ happy pets
              </div>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className={`p-4 border-t flex gap-3 ${
            isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-100 bg-white'
          }`} style={{ 
            paddingBottom: 'max(1rem, calc(env(safe-area-inset-bottom, 0px) + 1rem))',
            position: 'sticky',
            bottom: 0
          }}>
            <button
              onClick={handleBook}
              disabled={isLoading}
              className={`flex-1 py-4 rounded-xl font-semibold text-sm transition-all active:scale-95 ${
                isDark
                  ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:opacity-90'
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90'
              } ${isLoading ? 'opacity-50' : ''}`}
            >
              {isLoading ? 'Requesting...' : service.base_price ? `Book for ₹${service.base_price.toLocaleString()}` : 'Book Now'}
            </button>
            <button
              onClick={handleAskMira}
              className={`px-5 py-4 rounded-xl font-semibold text-sm transition-all active:scale-95 ${
                isDark
                  ? 'bg-gray-800 text-purple-400 hover:bg-gray-700'
                  : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
              }`}
            >
              Ask Mira
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ServiceQuickViewModal;

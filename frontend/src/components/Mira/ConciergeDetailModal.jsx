/**
 * ConciergeDetailModal.jsx
 * 
 * Beautiful modal for concierge service details
 * Matches ProductDetailModal design for consistency
 * 
 * Shows:
 * - Service image with gradient overlay
 * - Mira's insight (why this for pet)
 * - What's included
 * - What we source
 * - Request button
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Sparkles, Heart, Check, Star, Shield, Award, Users,
  MessageCircle, Send, Clock, Calendar, ChevronRight
} from 'lucide-react';
import hapticFeedback from '../../utils/haptic';

const ConciergeDetailModal = ({ 
  service, 
  pet, 
  onClose, 
  onRequest 
}) => {
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);
  
  if (!service) return null;
  
  const petName = pet?.name || 'your pet';
  const whyText = service.why_it_fits || service.why_reason || service.description;
  
  // Get service image or use default based on category
  const getServiceImage = () => {
    if (service.image_url || service.image) {
      return service.image_url || service.image;
    }
    // Default images by category
    const defaults = {
      celebrate: 'https://images.unsplash.com/photo-1527443154391-507e9dc6c5cc?w=600&q=80',
      dine: 'https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?w=600&q=80',
      care: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&q=80',
      travel: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=600&q=80',
      default: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&q=80'
    };
    return defaults[service.pillar] || defaults.default;
  };
  
  const handleRequest = async () => {
    hapticFeedback.success();
    setIsRequesting(true);
    try {
      await onRequest?.({
        ...service,
        additionalNotes,
        requestedAt: new Date().toISOString()
      });
      onClose();
    } catch (err) {
      console.error('Error requesting service:', err);
    } finally {
      setIsRequesting(false);
    }
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
        className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-lg max-h-[90vh] overflow-hidden bg-gray-900 rounded-2xl border border-purple-500/30 shadow-2xl flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* Header Image */}
          <div className="relative h-48 flex-shrink-0 overflow-hidden">
            <img
              src={getServiceImage()}
              alt={service.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent" />
            
            {/* Concierge® Pick badge */}
            <div className="absolute top-4 left-4">
              <span className="px-3 py-1.5 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs font-semibold rounded-full shadow-lg">
                {service.seasonal ? '☆ Seasonal' : 'Concierge® Pick'}
              </span>
            </div>
            
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 w-11 h-11 rounded-full bg-gray-900/80 text-white flex items-center justify-center hover:bg-gray-800 transition-all active:scale-90"
            >
              <X className="w-5 h-5" />
            </button>
            
            {/* Title on image */}
            <div className="absolute bottom-4 left-4 right-4">
              <h2 className="text-xl font-bold text-white mb-1">
                {service.name}
              </h2>
              <p className="text-purple-300 text-sm flex items-center gap-1">
                <Sparkles className="w-4 h-4" />
                Arranged for {petName}
              </p>
            </div>
          </div>
          
          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            
            {/* Mira's Insight - Why this pick */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-purple-900/40 to-pink-900/20 border border-purple-500/30">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                  <Heart className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-purple-300 uppercase tracking-wide mb-1">
                    Why for {petName}
                  </p>
                  <p className="text-sm text-white leading-relaxed">
                    {whyText || `Handpicked service tailored specifically for ${petName}'s needs and preferences.`}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Spec Chip */}
            {service.spec_chip && (
              <div className="flex items-center gap-2">
                <span className="px-4 py-2 bg-pink-500/20 text-pink-300 text-sm font-medium rounded-full border border-pink-500/30">
                  {service.spec_chip}
                </span>
              </div>
            )}
            
            {/* What We Source */}
            {service.what_we_source && (
              <div>
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-2 flex items-center gap-2">
                  <Star className="w-4 h-4 text-purple-400" />
                  What We Source
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {service.what_we_source}
                </p>
              </div>
            )}
            
            {/* What's Included */}
            {service.selection_rules && service.selection_rules.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  What's Included
                </h3>
                <div className="space-y-2">
                  {service.selection_rules.map((rule, i) => (
                    <div key={i} className="flex items-start gap-3 p-2 rounded-lg bg-gray-800/50">
                      <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-300">{rule}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Safety Note */}
            {service.safety_note && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <p className="text-sm text-amber-300 flex items-start gap-2">
                  <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  {service.safety_note}
                </p>
              </div>
            )}
            
            {/* Trust Badges */}
            <div className="flex flex-wrap gap-2">
              <span className="flex items-center gap-1 px-3 py-1.5 bg-gray-800 text-gray-300 text-xs rounded-full">
                <Shield className="w-3.5 h-3.5" />
                Verified Partners
              </span>
              <span className="flex items-center gap-1 px-3 py-1.5 bg-gray-800 text-gray-300 text-xs rounded-full">
                <Award className="w-3.5 h-3.5" />
                Quality Assured
              </span>
              <span className="flex items-center gap-1 px-3 py-1.5 bg-gray-800 text-gray-300 text-xs rounded-full">
                <Users className="w-3.5 h-3.5" />
                Trusted by 500+ pets
              </span>
            </div>
            
            {/* Additional Notes */}
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-2">
                Any special requests? (optional)
              </h3>
              <textarea
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder={`E.g., ${petName} prefers quiet environments...`}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-purple-500 resize-none"
                rows={2}
              />
            </div>
          </div>
          
          {/* Action Button - Fixed at bottom */}
          <div className="p-4 border-t border-gray-800 flex-shrink-0" style={{ 
            paddingBottom: 'max(1rem, calc(env(safe-area-inset-bottom, 0px) + 1rem))'
          }}>
            <button
              onClick={handleRequest}
              disabled={isRequesting}
              className={`w-full py-4 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                isRequesting 
                  ? 'bg-gray-700 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-pink-500 to-purple-500 hover:opacity-90'
              }`}
            >
              <Send className="w-5 h-5" />
              {isRequesting ? 'Adding...' : 'Add to Picks'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ConciergeDetailModal;

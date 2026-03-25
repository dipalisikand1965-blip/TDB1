/**
 * TopPicksPanel.jsx
 * 
 * "Top Picks for [Pet]" - Personalized recommendations across all pillars
 * Intelligent, pet-aware picks based on soul parameters
 * 
 * Features:
 * - Grid layout with pillar sections
 * - Horizontal scroll within each pillar
 * - Pet switcher at top
 * - Catalogue vs Concierge® Suggestion distinction
 * - "Why this pick?" enhanced tooltips
 * - Full haptic feedback
 * - iOS safe area support
 * - 44px touch targets
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, ChevronRight, ChevronDown, Sparkles, Gift, ShoppingBag,
  RefreshCw, Info, Heart, Send, Check, AlertCircle, Flame, Star
} from 'lucide-react';
import { API_URL } from '../../utils/api';
import hapticFeedback from '../../utils/haptic';

// Smart badge configurations
const SMART_BADGES = {
  trending: { icon: Flame, label: 'Trending', color: 'bg-orange-100 text-orange-600' },
  new: { icon: Sparkles, label: 'New', color: 'bg-blue-100 text-blue-600' },
  reorder: { icon: RefreshCw, label: 'Reorder', color: 'bg-green-100 text-green-600' },
  birthday: { icon: Gift, label: 'Birthday!', color: 'bg-pink-100 text-pink-600' },
  seasonal: { icon: Star, label: 'Seasonal', color: 'bg-purple-100 text-purple-600' },
};

// Pillar emoji mapping
const PILLAR_EMOJIS = {
  celebrate: '🎂',
  dine: '🍽️',
  care: '🛁',
  stay: '🏨',
  travel: '✈️',
  learn: '📚',
  fit: '🏋️',
  enjoy: '🎉',
  advisory: '💬',
  paperwork: '📋',
  shop: '🛒',
};

// Product/Service Card Component with Haptic & Touch Improvements
const PickCard = ({ pick, petName, onAddToPicks, onSendToConcierge }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const isConcierge = pick.pick_type === 'concierge';
  const badges = pick.badges || [];
  
  // Build intelligent reasons for tooltip
  const getReasons = () => {
    const reasons = [];
    if (badges.includes('trending')) reasons.push({ icon: '🔥', text: 'Popular with pet parents' });
    if (badges.includes('new')) reasons.push({ icon: '✨', text: 'Just added' });
    if (badges.includes('reorder')) reasons.push({ icon: '🔄', text: `${petName} loved this before` });
    if (badges.includes('birthday')) reasons.push({ icon: '🎂', text: 'Perfect for birthday!' });
    if (badges.includes('seasonal')) reasons.push({ icon: '⭐', text: 'Great for the season' });
    if (pick.why_reason) reasons.push({ icon: '💡', text: pick.why_reason });
    return reasons.length > 0 ? reasons : [{ icon: '🐕', text: `Curated for ${petName}` }];
  };
  
  return (
    <motion.div
      className={`relative flex-shrink-0 w-40 rounded-xl overflow-hidden shadow-md ${
        isConcierge 
          ? 'bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-dashed border-purple-300' 
          : 'bg-white border border-gray-100'
      }`}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => hapticFeedback.buttonTap()}
    >
      {/* Image */}
      <div className="relative h-28 bg-gray-100">
        {pick.image ? (
          <img 
            src={pick.image} 
            alt={pick.name}
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {isConcierge ? (
              <div className="text-center p-2">
                <Sparkles className="w-8 h-8 mx-auto text-purple-400 mb-1" />
                <span className="text-xs text-purple-600">Concierge® Pick</span>
              </div>
            ) : (
              <ShoppingBag className="w-8 h-8 text-gray-300" />
            )}
          </div>
        )}
        
        {/* Smart Badges */}
        {badges.length > 0 && (
          <div className="absolute top-2 left-2 flex flex-wrap gap-1">
            {badges.slice(0, 2).map((badge, i) => {
              const config = SMART_BADGES[badge];
              if (!config) return null;
              const Icon = config.icon;
              return (
                <motion.span 
                  key={i}
                  className={`px-1.5 py-0.5 text-[9px] font-medium rounded-full flex items-center gap-0.5 ${config.color}`}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Icon className="w-2.5 h-2.5" />
                  {config.label}
                </motion.span>
              );
            })}
          </div>
        )}
        
        {/* Type badge */}
        {pick.type === 'service' && (
          <span className="absolute bottom-2 left-2 px-2 py-0.5 text-[10px] font-medium bg-blue-500 text-white rounded-full">
            Service
          </span>
        )}
        
        {/* Info tooltip trigger - 44px touch target */}
        <button
          className="absolute top-2 right-2 w-11 h-11 rounded-full bg-white/80 flex items-center justify-center hover:bg-white touch-manipulation"
          onClick={(e) => {
            e.stopPropagation();
            hapticFeedback.buttonTap();
            setShowTooltip(!showTooltip);
          }}
        >
          <Info className="w-4 h-4 text-gray-600" />
        </button>
        
        {/* Enhanced "Why this pick?" Tooltip */}
        <AnimatePresence>
          {showTooltip && (
            <motion.div
              initial={{ opacity: 0, y: -5, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -5, scale: 0.95 }}
              className="absolute top-12 right-2 left-2 bg-gray-900 text-white text-xs p-3 rounded-xl z-20 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-amber-400">Why this pick?</span>
                <button 
                  onClick={() => setShowTooltip(false)}
                  className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <div className="space-y-1.5">
                {getReasons().map((reason, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span>{reason.icon}</span>
                    <span className="text-gray-200">{reason.text}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Content */}
      <div className="p-2">
        <h4 className="text-sm font-medium text-gray-900 line-clamp-2 leading-tight mb-1">
          {pick.name}
        </h4>
        
        {/* Concierge® items show "Handpicked for [Pet]" */}
        {isConcierge ? (
          <>
            <p className="text-xs text-purple-600 font-medium">Handpicked for {petName}</p>
            {pick.why_it_fits && (
              <p className="text-[10px] text-gray-500 mt-1 line-clamp-2">{pick.why_it_fits}</p>
            )}
            {pick.spec_chip && (
              <span className="inline-block mt-1.5 px-2 py-0.5 text-[9px] font-medium text-purple-600 bg-purple-50 rounded-full border border-purple-200">
                {pick.spec_chip}
              </span>
            )}
          </>
        ) : pick.price ? (
          <p className="text-sm font-semibold text-pink-600">₹{pick.price}</p>
        ) : (
          <p className="text-xs text-gray-400">Price on request</p>
        )}
      </div>
      
      {/* Action button - 44px min height */}
      <div className="px-2 pb-2">
        {isConcierge ? (
          <button
            onClick={() => {
              hapticFeedback.toggle();
              onSendToConcierge?.(pick);
            }}
            className="w-full py-2.5 text-xs font-medium text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg hover:opacity-90 active:opacity-80 min-h-[44px] touch-manipulation"
          >
            Request
          </button>
        ) : (
          <button
            onClick={() => {
              hapticFeedback.toggle();
              onAddToPicks?.(pick);
            }}
            className="w-full py-2.5 text-xs font-medium text-pink-600 bg-pink-50 rounded-lg hover:bg-pink-100 active:bg-pink-200 flex items-center justify-center gap-1 min-h-[44px] touch-manipulation"
          >
            <Gift className="w-3 h-3" />
            Add to Picks
          </button>
        )}
      </div>
    </motion.div>
  );
};

// Pillar Section Component with scroll snap
const PillarSection = ({ pillar, picks, petName, onAddToPicks, onSendToConcierge, onSeeMore }) => {
  if (!picks || picks.length === 0) return null;
  
  return (
    <div className="mb-6">
      {/* Pillar header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{pillar.emoji}</span>
          <h3 
            className="text-base font-semibold"
            style={{ color: pillar.color }}
          >
            {pillar.name}
          </h3>
          <span className="text-xs text-gray-400">({picks.length} picks)</span>
        </div>
        <button
          onClick={() => {
            hapticFeedback.buttonTap();
            onSeeMore?.(pillar.id);
          }}
          className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 min-h-[44px] touch-manipulation"
        >
          See all <ChevronRight className="w-3 h-3" />
        </button>
      </div>
      
      {/* Horizontal scroll container with snap */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        {picks.map((pick, index) => (
          <PickCard
            key={pick.id || index}
            pick={pick}
            petName={petName}
            onAddToPicks={onAddToPicks}
            onSendToConcierge={onSendToConcierge}
          />
        ))}
      </div>
    </div>
  );
};

// Main Component with Keyboard & Haptic Support
const TopPicksPanel = ({
  isOpen,
  onClose,
  pets = [],
  selectedPet,
  onPetChange,
  token,
  onAddToPicks,
  onSendToConcierge,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [picksData, setPicksData] = useState(null);
  const [showPetDropdown, setShowPetDropdown] = useState(false);
  
  const currentPet = selectedPet || pets[0];
  
  // Keyboard handler (Escape to close)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        hapticFeedback.modalClose();
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);
  
  // Fetch picks for current pet
  const fetchPicks = useCallback(async () => {
    if (!currentPet?.name && !currentPet?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const petIdentifier = currentPet.id || currentPet.name;
      const response = await fetch(`${API_URL}/api/mira/top-picks/${encodeURIComponent(petIdentifier)}`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch picks');
      }
      
      const data = await response.json();
      setPicksData(data);
      hapticFeedback.success();
    } catch (err) {
      console.error('[TOP PICKS] Error:', err);
      setError('Unable to load personalized picks. Please try again.');
      hapticFeedback.error();
    } finally {
      setLoading(false);
    }
  }, [currentPet, token]);
  
  // Fetch on open or pet change
  useEffect(() => {
    if (isOpen && currentPet) {
      fetchPicks();
    }
  }, [isOpen, currentPet, fetchPicks]);
  
  // Handle pet switch with haptic
  const handlePetSwitch = (pet) => {
    hapticFeedback.toggle();
    onPetChange?.(pet);
    setShowPetDropdown(false);
  };
  
  if (!isOpen) return null;
  
  const pillars = picksData?.pillars || {};
  const petInfo = picksData?.pet || currentPet;
  
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => {
          hapticFeedback.modalClose();
          onClose();
        }}
      >
        <motion.div
          className="absolute bottom-0 left-0 right-0 max-h-[85vh] bg-white rounded-t-3xl overflow-hidden"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 20px)' }}
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white z-10 px-4 pt-4 pb-3 border-b border-gray-100">
            {/* Drag handle */}
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-3 cursor-grab" />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center shadow-lg">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Top Picks for {petInfo?.name || 'Your Pet'}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {petInfo?.breed} • {petInfo?.size} • Soul Score: {petInfo?.soul_score || 0}%
                  </p>
                </div>
              </div>
              
              {/* Close button - 44px touch target */}
              <button
                onClick={() => {
                  hapticFeedback.modalClose();
                  onClose();
                }}
                className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 active:bg-gray-300 touch-manipulation"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            
            {/* Pet Switcher */}
            {pets.length > 1 && (
              <div className="mt-3 relative">
                <button
                  onClick={() => {
                    hapticFeedback.buttonTap();
                    setShowPetDropdown(!showPetDropdown);
                  }}
                  className="w-full px-3 py-2.5 bg-gray-50 rounded-lg flex items-center justify-between hover:bg-gray-100 active:bg-gray-200 min-h-[44px] touch-manipulation"
                >
                  <span className="text-sm text-gray-700">
                    Viewing picks for: <strong>{currentPet?.name}</strong>
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showPetDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {showPetDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-100 z-20"
                  >
                    {pets.map((pet) => (
                      <button
                        key={pet.id || pet.name}
                        onClick={() => handlePetSwitch(pet)}
                        className={`w-full px-4 py-3 text-left hover:bg-gray-50 active:bg-gray-100 flex items-center gap-3 min-h-[48px] touch-manipulation ${
                          pet.name === currentPet?.name ? 'bg-pink-50' : ''
                        }`}
                      >
                        {pet.photo_url ? (
                          <img src={pet.photo_url} alt={pet.name} className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-400 to-purple-400 flex items-center justify-center text-white text-sm font-bold">
                            {pet.name?.[0]}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">{pet.name}</p>
                          <p className="text-xs text-gray-500">{pet.breed}</p>
                        </div>
                        {pet.name === currentPet?.name && (
                          <Check className="w-4 h-4 text-pink-500 ml-auto" />
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>
            )}
            
            {/* Intelligence summary */}
            {picksData?.filters_applied && (
              <div className="mt-3 flex flex-wrap gap-2">
                {picksData.filters_applied.allergies?.length > 0 && (
                  <span className="px-2 py-1 bg-red-50 text-red-600 text-xs rounded-full flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Avoiding: {picksData.filters_applied.allergies.join(', ')}
                  </span>
                )}
                <span className="px-2 py-1 bg-purple-50 text-purple-600 text-xs rounded-full">
                  🐕 {picksData.filters_applied.breed || 'All breeds'}
                </span>
                <span className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-full">
                  📏 {picksData.filters_applied.size || 'All sizes'}
                </span>
              </div>
            )}
          </div>
          
          {/* Content */}
          <div className="overflow-y-auto px-4 py-4" style={{ maxHeight: 'calc(85vh - 200px)' }}>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <RefreshCw className="w-8 h-8 text-pink-500 animate-spin mb-3" />
                <p className="text-gray-500">Loading personalized picks...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
                <p className="text-gray-600">{error}</p>
                <button
                  onClick={fetchPicks}
                  className="mt-4 px-4 py-2 bg-pink-100 text-pink-600 rounded-lg hover:bg-pink-200"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <div>
                {Object.entries(pillars).map(([pillarId, data]) => (
                  <PillarSection
                    key={pillarId}
                    pillar={data.pillar}
                    picks={data.picks}
                    petName={petInfo?.name}
                    onAddToPicks={onAddToPicks}
                    onSendToConcierge={onSendToConcierge}
                    onSeeMore={(id) => console.log('See more:', id)}
                  />
                ))}
              </div>
            )}
          </div>
          
          {/* Footer CTA */}
          <div className="sticky bottom-0 bg-white border-t border-gray-100 px-4 py-3">
            <button
              onClick={() => onSendToConcierge?.({ type: 'all_picks', pet: petInfo })}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-xl flex items-center justify-center gap-2 hover:opacity-90"
            >
              <Send className="w-4 h-4" />
              Send All to Concierge®
            </button>
            <p className="text-center text-xs text-gray-400 mt-2">
              {picksData?.total_picks || 0} picks curated for {petInfo?.name}
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TopPicksPanel;

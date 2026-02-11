/**
 * PersonalizedPicksPanel.jsx
 * 
 * "Personalized picks for [Pet]" - A soulful experience
 * Mira knows your pet. No dropdowns. No e-commerce feel.
 * 
 * Features:
 * - Dark theme matching the site design
 * - Pillar-wise navigation (Celebrate, Dine, Care, etc.)
 * - Catalogue products + Concierge services per pillar
 * - Expandable cards for details
 * - Mini-cart with selection summary
 * - "Send to My Concierge" flow
 * - Full haptic feedback on mobile
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Sparkles, ChevronRight, Send, Heart, Check,
  ShoppingBag, RefreshCw, Info, Package, ChevronDown, ChevronUp,
  Gift, Cake, Utensils, Stethoscope, Plane, Scissors, GraduationCap,
  Hotel, HeartPulse, Star, AlertCircle, MessageSquare
} from 'lucide-react';
import { API_URL } from '../../utils/api';
import hapticFeedback from '../../utils/haptic';
import ConciergeServiceStrip from './ConciergeServiceStrip';

// Pillar configuration with emojis and gradients
const PILLARS = [
  { id: 'celebrate', name: 'Celebrate', emoji: '🎂', icon: Cake, gradient: 'from-pink-500 to-purple-500' },
  { id: 'dine', name: 'Dine', emoji: '🍖', icon: Utensils, gradient: 'from-amber-500 to-orange-500' },
  { id: 'care', name: 'Care', emoji: '💊', icon: Stethoscope, gradient: 'from-rose-400 to-pink-500' },
  { id: 'travel', name: 'Travel', emoji: '✈️', icon: Plane, gradient: 'from-teal-400 to-blue-500' },
  { id: 'stay', name: 'Stay', emoji: '🏨', icon: Hotel, gradient: 'from-green-400 to-emerald-500' },
  { id: 'enjoy', name: 'Enjoy', emoji: '🎾', icon: Heart, gradient: 'from-blue-400 to-cyan-500' },
  { id: 'fit', name: 'Fit', emoji: '🏃', icon: HeartPulse, gradient: 'from-orange-400 to-red-500' },
  { id: 'learn', name: 'Learn', emoji: '📚', icon: GraduationCap, gradient: 'from-indigo-400 to-purple-500' },
  { id: 'advisory', name: 'Advisory', emoji: '🧠', icon: Info, gradient: 'from-violet-400 to-purple-500' },
  { id: 'services', name: 'Services', emoji: '✂️', icon: Scissors, gradient: 'from-cyan-400 to-blue-500' },
];

/**
 * ExpandablePickCard - Product/Service card that expands for details
 */
const ExpandablePickCard = ({ 
  pick, 
  isSelected, 
  onSelect, 
  petName,
  type = 'catalogue' // 'catalogue' or 'concierge'
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const handleToggle = () => {
    hapticFeedback.buttonTap();
    setIsExpanded(!isExpanded);
  };
  
  const handleSelect = (e) => {
    e.stopPropagation();
    hapticFeedback.success();
    onSelect(pick);
  };

  const isConcierge = type === 'concierge';
  
  // Get the "why" text - different field names for catalogue vs concierge
  const whyText = pick.why_it_fits || pick.why_reason || pick.why_this_pick;
  
  return (
    <motion.div
      layout
      className={`rounded-2xl overflow-hidden transition-all ${
        isConcierge 
          ? 'bg-gradient-to-br from-purple-900/60 to-pink-900/40 border border-purple-500/30' 
          : 'bg-gray-800/60 border border-gray-700/50'
      } ${isSelected ? 'ring-2 ring-pink-500' : ''}`}
    >
      {/* Main Card */}
      <div 
        className="p-4 cursor-pointer"
        onClick={handleToggle}
      >
        <div className="flex items-start gap-3">
          {/* Image/Icon */}
          <div className={`w-16 h-16 rounded-xl flex-shrink-0 overflow-hidden ${
            isConcierge ? 'bg-gradient-to-br from-purple-500 to-pink-500' : 'bg-gray-700'
          }`}>
            {pick.image_url || pick.image ? (
              <img 
                src={pick.image_url || pick.image} 
                alt={pick.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                {isConcierge ? (
                  <Sparkles className="w-6 h-6 text-white" />
                ) : (
                  <Package className="w-6 h-6 text-gray-400" />
                )}
              </div>
            )}
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h4 className="font-semibold text-white text-sm leading-tight">
                  {pick.name}
                </h4>
                
                {/* Spec chip for concierge */}
                {isConcierge && pick.spec_chip && (
                  <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-purple-500/30 text-purple-300 text-xs rounded-full">
                    <Star className="w-3 h-3" /> {pick.spec_chip}
                  </span>
                )}
                
                {/* Category for catalogue */}
                {!isConcierge && pick.category && (
                  <span className="inline-block mt-1 px-2 py-0.5 bg-gray-700/50 text-gray-400 text-xs rounded-full">
                    {pick.category}
                  </span>
                )}
              </div>
              
              {/* Select Button */}
              <button
                onClick={handleSelect}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
                  isSelected 
                    ? 'bg-pink-500 text-white' 
                    : 'bg-gray-700/50 text-gray-400 hover:bg-gray-600'
                }`}
              >
                {isSelected ? <Check className="w-4 h-4" /> : <span className="text-lg">+</span>}
              </button>
            </div>
            
            {/* Why this pick - always visible */}
            {whyText && (
              <p className="mt-2 text-xs text-amber-400/90 flex items-start gap-1">
                <Heart className="w-3 h-3 flex-shrink-0 mt-0.5" />
                <span>{whyText}</span>
              </p>
            )}
          </div>
        </div>
        
        {/* Expand indicator */}
        <div className="flex items-center justify-center mt-3 text-gray-500">
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </div>
      </div>
      
      {/* Expanded Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-gray-700/50 overflow-hidden"
          >
            <div className="p-4 space-y-4">
              {/* For Concierge: What we source */}
              {isConcierge && pick.what_we_source && (
                <div>
                  <h5 className="text-xs font-semibold text-purple-400 uppercase tracking-wide mb-1">
                    What We Source
                  </h5>
                  <p className="text-sm text-gray-300">{pick.what_we_source}</p>
                </div>
              )}
              
              {/* For Concierge: Selection Rules */}
              {isConcierge && pick.selection_rules && pick.selection_rules.length > 0 && (
                <div>
                  <h5 className="text-xs font-semibold text-purple-400 uppercase tracking-wide mb-2">
                    What's Included
                  </h5>
                  <ul className="space-y-1">
                    {pick.selection_rules.slice(0, 4).map((rule, i) => (
                      <li key={i} className="text-xs text-gray-400 flex items-start gap-2">
                        <Check className="w-3 h-3 text-green-400 flex-shrink-0 mt-0.5" />
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* For Concierge: Safety Note */}
              {isConcierge && pick.safety_note && (
                <div className="flex items-start gap-2 p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                  <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-300">{pick.safety_note}</p>
                </div>
              )}
              
              {/* For Catalogue: Description */}
              {!isConcierge && pick.description && (
                <p className="text-sm text-gray-300">{pick.description}</p>
              )}
              
              {/* For Catalogue: Product details */}
              {!isConcierge && (
                <div className="flex flex-wrap gap-2">
                  {pick.brand && (
                    <span className="px-2 py-1 bg-gray-700/50 text-gray-300 text-xs rounded-lg">
                      {pick.brand}
                    </span>
                  )}
                  {pick.size && (
                    <span className="px-2 py-1 bg-gray-700/50 text-gray-300 text-xs rounded-lg">
                      {pick.size}
                    </span>
                  )}
                  {pick.badges && pick.badges.length > 0 && pick.badges.map((badge, i) => (
                    <span key={i} className="px-2 py-1 bg-pink-500/20 text-pink-300 text-xs rounded-lg">
                      {badge}
                    </span>
                  ))}
                </div>
              )}
              
              {/* Handpicked for */}
              {pick.handpicked_for && (
                <p className="text-xs text-purple-400 italic">
                  Handpicked for {pick.handpicked_for}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/**
 * CollapsibleSection - Clean section with header and expandable content
 */
const CollapsibleSection = ({ 
  title, 
  subtitle, 
  icon, 
  count, 
  defaultExpanded = true, 
  variant = 'catalogue',
  children 
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  
  const variantStyles = {
    catalogue: {
      headerBg: 'bg-gray-800/50',
      headerBorder: 'border-gray-700/50',
      titleColor: 'text-gray-300',
      subtitleColor: 'text-gray-500',
      countBg: 'bg-gray-700',
      countColor: 'text-gray-300'
    },
    concierge: {
      headerBg: 'bg-purple-900/30',
      headerBorder: 'border-purple-500/30',
      titleColor: 'text-purple-300',
      subtitleColor: 'text-purple-400/70',
      countBg: 'bg-purple-500/30',
      countColor: 'text-purple-300'
    }
  };
  
  const styles = variantStyles[variant];
  
  return (
    <div className="rounded-2xl overflow-hidden">
      {/* Section Header */}
      <button
        onClick={() => {
          hapticFeedback.buttonTap();
          setIsExpanded(!isExpanded);
        }}
        className={`w-full flex items-center justify-between p-3 ${styles.headerBg} border ${styles.headerBorder} rounded-t-2xl ${!isExpanded ? 'rounded-b-2xl' : ''}`}
      >
        <div className="flex items-center gap-3">
          <div className={`${styles.titleColor}`}>
            {icon}
          </div>
          <div className="text-left">
            <h3 className={`text-sm font-semibold ${styles.titleColor}`}>
              {title}
            </h3>
            {subtitle && (
              <p className={`text-xs ${styles.subtitleColor}`}>{subtitle}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 ${styles.countBg} ${styles.countColor} text-xs rounded-full`}>
            {count}
          </span>
          <ChevronDown 
            className={`w-4 h-4 ${styles.titleColor} transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
          />
        </div>
      </button>
      
      {/* Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 pt-2">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * MiniCart - Selection summary at bottom
 */
const MiniCart = ({ 
  selectedItems, 
  onRemove, 
  onSendToConcierge,
  onClear,
  petName 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (selectedItems.length === 0) return null;
  
  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-purple-500/30 z-[110]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}
    >
      {/* Expanded view */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-2 max-h-48 overflow-y-auto">
              {selectedItems.map((item) => (
                <div 
                  key={item.id || item.name}
                  className="flex items-center justify-between bg-gray-800/50 rounded-lg p-2"
                >
                  <span className="text-sm text-white truncate flex-1">{item.name}</span>
                  <button
                    onClick={() => {
                      hapticFeedback.buttonTap();
                      onRemove(item);
                    }}
                    className="ml-2 w-6 h-6 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              
              <button
                onClick={() => {
                  hapticFeedback.buttonTap();
                  onClear();
                }}
                className="w-full py-2 text-xs text-gray-400 hover:text-white"
              >
                Clear all
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Main bar */}
      <div className="px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => {
            hapticFeedback.buttonTap();
            setIsExpanded(!isExpanded);
          }}
          className="flex items-center gap-2 bg-purple-600/30 px-3 py-2 rounded-full"
        >
          <ShoppingBag className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-medium text-white">{selectedItems.length}</span>
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          )}
        </button>
        
        <button
          onClick={() => {
            hapticFeedback.success();
            onSendToConcierge();
          }}
          className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold py-3 px-4 rounded-full flex items-center justify-center gap-2 shadow-lg"
        >
          <Send className="w-4 h-4" />
          Send to My Concierge
        </button>
      </div>
    </motion.div>
  );
};

/**
 * ConfirmationModal - Before sending to concierge
 */
const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  selectedItems, 
  petName,
  customRequest 
}) => {
  const [additionalNotes, setAdditionalNotes] = useState('');
  
  if (!isOpen) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-gray-900 rounded-2xl w-full max-w-md overflow-hidden border border-purple-500/30"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-purple-900/60 to-pink-900/40 border-b border-purple-500/30">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white">Send to Concierge</h3>
              <p className="text-sm text-purple-300">For {petName}</p>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-4 space-y-4">
          <div>
            <p className="text-sm text-gray-300 mb-3">
              Your concierge will receive these {selectedItems.length} picks and reach out to help you:
            </p>
            
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {selectedItems.map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-gray-400">
                  <Check className="w-4 h-4 text-green-400" />
                  <span>{item.name}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Additional notes */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Anything else? (optional)
            </label>
            <textarea
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="Add any specific requests or details..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-purple-500"
              rows={3}
            />
          </div>
        </div>
        
        {/* Actions */}
        <div className="p-4 border-t border-gray-800 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-gray-800 text-gray-300 rounded-full font-medium"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              hapticFeedback.success();
              onConfirm(additionalNotes);
            }}
            className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full font-medium flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            Confirm
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

/**
 * Main PersonalizedPicksPanel Component
 */
const PersonalizedPicksPanel = ({
  isOpen,
  onClose,
  pet,
  token
}) => {
  const [activePillar, setActivePillar] = useState('celebrate');
  const [picksData, setPicksData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showAllCatalogue, setShowAllCatalogue] = useState(false);
  const [showAllConcierge, setShowAllConcierge] = useState(false);
  const scrollRef = useRef(null);
  
  // Fetch picks data
  const fetchPicks = useCallback(async () => {
    if (!pet?.name) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/api/mira/top-picks/${encodeURIComponent(pet.name)}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch picks');
      
      const data = await response.json();
      setPicksData(data);
    } catch (err) {
      console.error('Error fetching picks:', err);
      setError('Could not load personalized picks');
    } finally {
      setLoading(false);
    }
  }, [pet?.name, token]);
  
  useEffect(() => {
    if (isOpen && pet?.name) {
      fetchPicks();
    }
  }, [isOpen, pet?.name, fetchPicks]);
  
  // Toggle item selection
  const toggleSelection = (item) => {
    setSelectedItems(prev => {
      const exists = prev.find(i => i.id === item.id || i.name === item.name);
      if (exists) {
        return prev.filter(i => i.id !== item.id && i.name !== item.name);
      }
      return [...prev, item];
    });
  };
  
  const isSelected = (item) => {
    return selectedItems.some(i => i.id === item.id || i.name === item.name);
  };
  
  // Send to concierge
  const handleSendToConcierge = async (additionalNotes) => {
    try {
      await fetch(`${API_URL}/api/concierge/picks-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({
          pet_name: pet?.name,
          selected_items: selectedItems,
          additional_notes: additionalNotes,
          timestamp: new Date().toISOString()
        })
      });
      
      hapticFeedback.success();
      setShowConfirmation(false);
      setSelectedItems([]);
      onClose();
    } catch (err) {
      console.error('Error sending to concierge:', err);
    }
  };
  
  // Get current pillar data
  const currentPillarData = picksData?.pillars?.[activePillar] || { picks: [], concierge_picks: [] };
  const cataloguePicks = currentPillarData.picks || [];
  const conciergePicks = currentPillarData.concierge_picks || [];
  
  if (!isOpen) return null;
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm"
        onClick={() => {
          hapticFeedback.modalClose();
          onClose();
        }}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="absolute inset-x-0 bottom-0 top-0 bg-gray-900 rounded-t-3xl overflow-hidden mt-3"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-gray-900 border-b border-gray-800">
            {/* Drag handle */}
            <div className="w-12 h-1.5 bg-gray-700 rounded-full mx-auto mt-3 mb-2" />
            
            {/* Title */}
            <div className="px-4 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    Personalized for {pet?.name || 'Your Pet'}
                  </h2>
                  <p className="text-xs text-purple-400 flex items-center gap-1">
                    <Heart className="w-3 h-3" />
                    Mira knows {pet?.name}
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => {
                  hapticFeedback.modalClose();
                  onClose();
                }}
                className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Pillar tabs */}
            <div 
              ref={scrollRef}
              className="flex overflow-x-auto gap-2 px-4 pb-3 scrollbar-hide"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {PILLARS.map((pillar) => (
                <button
                  key={pillar.id}
                  onClick={() => {
                    hapticFeedback.buttonTap();
                    setActivePillar(pillar.id);
                    // Reset "show all" when changing pillars
                    setShowAllCatalogue(false);
                    setShowAllConcierge(false);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                    activePillar === pillar.id
                      ? `bg-gradient-to-r ${pillar.gradient} text-white shadow-lg`
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  <span className="text-base">{pillar.emoji}</span>
                  <span className="text-sm font-medium">{pillar.name}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Content */}
          <div 
            className="overflow-y-auto px-4 py-4"
            style={{ 
              maxHeight: selectedItems.length > 0 ? 'calc(100vh - 280px)' : 'calc(100vh - 200px)',
              paddingBottom: selectedItems.length > 0 ? '100px' : '20px'
            }}
          >
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <RefreshCw className="w-8 h-8 text-purple-500 animate-spin mb-3" />
                <p className="text-gray-400">Finding the perfect picks for {pet?.name}...</p>
              </div>
            ) : error ? (
              <div className="text-center py-16">
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <p className="text-gray-400 mb-4">{error}</p>
                <button
                  onClick={fetchPicks}
                  className="px-6 py-2 bg-purple-600 text-white rounded-full"
                >
                  Try Again
                </button>
              </div>
            ) : activePillar === 'services' ? (
              /* Services Pillar - Show expandable service categories */
              <div className="space-y-4">
                <p className="text-sm text-gray-400 mb-4">
                  Select a service category to request for {pet?.name}. Your concierge will handle everything.
                </p>
                <ConciergeServiceStrip
                  petName={pet?.name}
                  onServiceSelect={(selection) => {
                    // Add selected service to cart
                    const serviceItem = {
                      id: `service-${selection.service.id}`,
                      name: `${selection.service.emoji} ${selection.service.name}`,
                      category: selection.category.name,
                      type: 'concierge_service',
                      pick_type: 'concierge'
                    };
                    toggleSelection(serviceItem);
                  }}
                />
              </div>
            ) : (
              <div className="space-y-8">
                {/* ═══════════════════════════════════════════════════ */}
                {/* FROM OUR CATALOGUE - Products ready to go */}
                {/* ═══════════════════════════════════════════════════ */}
                {cataloguePicks.length > 0 && (
                  <CollapsibleSection
                    title="From Our Catalogue"
                    subtitle="Ready to fulfill"
                    icon={<Package className="w-4 h-4" />}
                    count={cataloguePicks.length}
                    defaultExpanded={true}
                    variant="catalogue"
                  >
                    <div className="space-y-3">
                      {cataloguePicks.slice(0, showAllCatalogue ? 10 : 3).map((pick, index) => (
                        <ExpandablePickCard
                          key={pick.id || index}
                          pick={pick}
                          isSelected={isSelected(pick)}
                          onSelect={toggleSelection}
                          petName={pet?.name}
                          type="catalogue"
                        />
                      ))}
                      {cataloguePicks.length > 3 && !showAllCatalogue && (
                        <button
                          onClick={() => {
                            hapticFeedback.buttonTap();
                            setShowAllCatalogue(true);
                          }}
                          className="w-full py-2 text-sm text-purple-400 hover:text-purple-300 transition-colors"
                        >
                          Show {cataloguePicks.length - 3} more →
                        </button>
                      )}
                    </div>
                  </CollapsibleSection>
                )}
                
                {/* Divider */}
                {cataloguePicks.length > 0 && conciergePicks.length > 0 && (
                  <div className="flex items-center gap-4 py-2">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
                    <Sparkles className="w-4 h-4 text-purple-500/50" />
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
                  </div>
                )}
                
                {/* ═══════════════════════════════════════════════════ */}
                {/* CONCIERGE CURATES - Personalized services */}
                {/* ═══════════════════════════════════════════════════ */}
                {conciergePicks.length > 0 && (
                  <CollapsibleSection
                    title={`Concierge Curates for ${pet?.name || 'Your Pet'}`}
                    subtitle="Personalized services"
                    icon={<Star className="w-4 h-4" />}
                    count={conciergePicks.length}
                    defaultExpanded={true}
                    variant="concierge"
                  >
                    <div className="space-y-3">
                      {conciergePicks.slice(0, showAllConcierge ? 10 : 3).map((pick, index) => (
                        <ExpandablePickCard
                          key={pick.id || index}
                          pick={pick}
                          isSelected={isSelected(pick)}
                          onSelect={toggleSelection}
                          petName={pet?.name}
                          type="concierge"
                        />
                      ))}
                      {conciergePicks.length > 3 && !showAllConcierge && (
                        <button
                          onClick={() => {
                            hapticFeedback.buttonTap();
                            setShowAllConcierge(true);
                          }}
                          className="w-full py-2 text-sm text-purple-400 hover:text-purple-300 transition-colors"
                        >
                          Show {conciergePicks.length - 3} more →
                        </button>
                      )}
                    </div>
                  </CollapsibleSection>
                )}
                
                {/* Empty state */}
                {cataloguePicks.length === 0 && conciergePicks.length === 0 && (
                  <div className="text-center py-16">
                    <Gift className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">
                      No picks available for {PILLARS.find(p => p.id === activePillar)?.name || 'this category'} yet.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Mini Cart */}
          <MiniCart
            selectedItems={selectedItems}
            onRemove={toggleSelection}
            onSendToConcierge={() => setShowConfirmation(true)}
            onClear={() => setSelectedItems([])}
            petName={pet?.name}
          />
          
          {/* Confirmation Modal */}
          <ConfirmationModal
            isOpen={showConfirmation}
            onClose={() => setShowConfirmation(false)}
            onConfirm={handleSendToConcierge}
            selectedItems={selectedItems}
            petName={pet?.name}
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PersonalizedPicksPanel;

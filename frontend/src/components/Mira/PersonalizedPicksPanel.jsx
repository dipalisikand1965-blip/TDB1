/**
 * PersonalizedPicksPanel.jsx
 * 
 * "Personalized picks for [Pet]" - A soulful experience
 * Mira knows your pet. No dropdowns. No e-commerce feel.
 * 
 * Features:
 * - Dark theme matching the site design
 * - Pillar-wise navigation (Celebrate, Dine, Care, etc.)
 * - Catalogue products + Concierge® services per pillar
 * - Expandable cards for details
 * - Mini-cart with selection summary
 * - "Send to My Concierge®" flow
 * - Full haptic feedback on mobile
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Sparkles, ChevronRight, Send, Heart, Check,
  ShoppingBag, RefreshCw, Info, Package, ChevronDown, ChevronUp,
  Gift, Cake, Utensils, Stethoscope, Plane, Scissors, GraduationCap,
  Hotel, HeartPulse, Star, AlertCircle, MessageSquare, Shield, Thermometer,
  Leaf, Zap, Clock, CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { API_URL } from '../../utils/api';
import hapticFeedback from '../../utils/haptic';
import { onPickSelect } from '../../utils/picksDelights';
import ConciergeServiceStrip from './ConciergeServiceStrip';
import ConciergeDetailModal from './ConciergeDetailModal';
import CuratedConciergeSection from './CuratedConciergeSection';
import { ProductDetailModal } from '../ProductCard';
import { createPortal } from 'react-dom';
import useUniversalServiceCommand from '../../hooks/useUniversalServiceCommand';

/**
 * FitBadges - Subtle safety/fit indicators for picks
 * Shows badges like: Allergy-aware, Small-mouth safe, Heat-safe, Anxiety-friendly
 */
const FitBadges = ({ pick, pet }) => {
  const badges = [];
  
  // Determine applicable badges based on pick properties and pet context
  if (pick.safety_level === 'safe' || pick.allergy_safe) {
    badges.push({ 
      id: 'allergy', 
      label: 'Allergy-aware', 
      icon: Shield, 
      color: 'text-green-400 bg-green-500/10 border-green-500/20' 
    });
  }
  
  if (pick.small_mouth_safe || (pet?.size === 'small' && pick.size_safe)) {
    badges.push({ 
      id: 'small-mouth', 
      label: 'Small-mouth safe', 
      icon: Check, 
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' 
    });
  }
  
  if (pick.heat_safe || pick.seasonal === 'summer') {
    badges.push({ 
      id: 'heat', 
      label: 'Heat-safe', 
      icon: Thermometer, 
      color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' 
    });
  }
  
  if (pick.anxiety_friendly || pick.calming) {
    badges.push({ 
      id: 'anxiety', 
      label: 'Anxiety-friendly', 
      icon: Heart, 
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' 
    });
  }
  
  if (pick.eco_friendly || pick.sustainable) {
    badges.push({ 
      id: 'eco', 
      label: 'Eco-friendly', 
      icon: Leaf, 
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
    });
  }
  
  if (pick.quick_delivery || pick.express) {
    badges.push({ 
      id: 'quick', 
      label: 'Quick delivery', 
      icon: Zap, 
      color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' 
    });
  }
  
  if (badges.length === 0) return null;
  
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {badges.slice(0, 3).map(badge => {
        const Icon = badge.icon;
        return (
          <span 
            key={badge.id}
            className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full border ${badge.color}`}
          >
            <Icon className="w-2.5 h-2.5" />
            {badge.label}
          </span>
        );
      })}
    </div>
  );
};

// Pillar configuration with emojis and gradients
const PILLARS = [
  { id: 'celebrate', name: 'Celebrate', emoji: '🎂', icon: Cake, gradient: 'from-pink-500 to-purple-500' },
  { id: 'dine', name: 'Dine', emoji: '🍖', icon: Utensils, gradient: 'from-amber-500 to-orange-500' },
  { id: 'care', name: 'Care', emoji: '💊', icon: Stethoscope, gradient: 'from-rose-400 to-pink-500' },
  { id: 'go', name: 'Go', emoji: '✈️', icon: Plane, gradient: 'from-teal-400 to-blue-500' },
  { id: 'play', name: 'Play', emoji: '🎾', icon: Heart, gradient: 'from-blue-400 to-cyan-500' },
  { id: 'learn', name: 'Learn', emoji: '📚', icon: GraduationCap, gradient: 'from-indigo-400 to-purple-500' },
  { id: 'paperwork', name: 'Paperwork', emoji: '📋', icon: Info, gradient: 'from-violet-400 to-purple-500' },
  { id: 'shop', name: 'Shop', emoji: '🛍️', icon: Scissors, gradient: 'from-cyan-400 to-blue-500' },
  { id: 'services', name: 'Services', emoji: '✂️', icon: Scissors, gradient: 'from-emerald-400 to-green-500' },
  { id: 'emergency', name: 'Emergency', emoji: '🚨', icon: HeartPulse, gradient: 'from-red-500 to-orange-500' },
];

/**
 * ExpandablePickCard - Product/Service card that expands for details
 */
const ExpandablePickCard = ({ 
  pick, 
  isSelected, 
  onSelect, 
  onViewDetails, // Open product detail modal for catalogue items
  onChatClick,   // NEW: Flow this pick to chat conversation
  onSaveToFavorites, // NEW: Save to pet's favorites
  petName,
  petId, // NEW: For favorites
  isFavorited = false, // NEW: Is this already in favorites
  type = 'catalogue' // 'catalogue' or 'concierge'
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [savingFavorite, setSavingFavorite] = useState(false);
  const [localFavorited, setLocalFavorited] = useState(isFavorited);
  
  const handleToggle = () => {
    hapticFeedback.buttonTap();
    setIsExpanded(!isExpanded);
  };
  
  const handleSelect = (e) => {
    e.stopPropagation();
    hapticFeedback.success();
    onSelect(pick);
  };
  
  const handleChatClick = (e) => {
    e.stopPropagation();
    hapticFeedback.buttonTap();
    if (onChatClick) onChatClick(pick);
  };
  
  const handleSaveToFavorites = async (e) => {
    e.stopPropagation();
    if (savingFavorite || !petId) return;
    
    setSavingFavorite(true);
    hapticFeedback.buttonTap();
    
    try {
      if (onSaveToFavorites) {
        await onSaveToFavorites(pick);
        setLocalFavorited(!localFavorited);
        hapticFeedback.success();
      }
    } catch (err) {
      console.error('Error saving to favorites:', err);
    } finally {
      setSavingFavorite(false);
    }
  };

  const isConcierge = type === 'concierge';
  
  // Get the "why" text - different field names for catalogue vs concierge
  const whyText = pick.why_it_fits || pick.why_reason || pick.why_this_pick;
  
  // For CONCIERGE cards - beautiful design with guaranteed visible button
  if (isConcierge) {
    return (
      <div className={`rounded-2xl bg-gradient-to-br from-pink-50/10 to-purple-50/5 border border-pink-200/20 ${
        isSelected ? 'ring-2 ring-pink-500' : ''
      }`}>
        {/* Card Content */}
        <div className="p-4">
          {/* Badge row */}
          <div className="flex items-center justify-between mb-3">
            <span className="px-3 py-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs font-medium rounded-full">
              {pick.seasonal ? '☆ Seasonal' : 'Concierge® Pick'}
            </span>
            <button 
              onClick={handleToggle}
              className="w-6 h-6 rounded-full bg-gray-800/50 flex items-center justify-center text-gray-400 hover:text-white"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          </div>
          
          {/* Icon */}
          <div className="flex justify-center my-3">
            <Sparkles className="w-7 h-7 text-gray-600" strokeWidth={1.5} />
          </div>
          
          {/* Title */}
          <h4 className="font-semibold text-white text-center text-sm mb-1">
            {pick.name}
          </h4>
          
          {/* Arranged for */}
          <p className="text-xs text-purple-400 text-center mb-2">
            Arranged for {petName}
          </p>
          
          {/* Description */}
          <p className="text-xs text-gray-400 text-center mb-3 leading-relaxed line-clamp-2">
            {whyText || pick.description || `Handpicked for ${petName}.`}
          </p>
          
          {/* Spec Chip */}
          {pick.spec_chip && (
            <div className="flex justify-center mb-3">
              <span className="px-3 py-1 bg-pink-500/20 text-pink-300 text-xs rounded-full border border-pink-500/30">
                {pick.spec_chip}
              </span>
            </div>
          )}
          
          {/* Fit Badges - Subtle safety indicators */}
          <div className="flex justify-center">
            <FitBadges pick={pick} pet={{ name: petName }} />
          </div>
        </div>
        
        {/* Buttons - ALWAYS visible, separate from scrollable content */}
        <div className="px-4 pb-4 space-y-2">
          {/* Primary: Add to Request */}
          <button
            onClick={handleSelect}
            className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all active:scale-[0.98] ${
              isSelected 
                ? 'bg-green-500 text-white' 
                : 'bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:opacity-90'
            }`}
          >
            {isSelected ? '✓ Added' : (pick.cta || 'Request')}
          </button>
          
          {/* Secondary: Chat with Mira about this */}
          {onChatClick && (
            <button
              onClick={handleChatClick}
              className="w-full py-2.5 rounded-xl font-medium text-xs text-purple-300 bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Ask Mira about this
            </button>
          )}
          
          {/* Save to Favorites */}
          {petId && (
            <button
              onClick={handleSaveToFavorites}
              disabled={savingFavorite}
              className={`w-full py-2 rounded-xl font-medium text-xs transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 ${
                localFavorited 
                  ? 'text-pink-400 bg-pink-500/10 border border-pink-500/30' 
                  : 'text-gray-400 hover:text-pink-400 bg-gray-800/50 border border-gray-700 hover:border-pink-500/30 hover:bg-pink-500/10'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${localFavorited ? 'fill-pink-400' : ''} ${savingFavorite ? 'animate-pulse' : ''}`} />
              {localFavorited ? 'Saved ♥' : 'Save to Favorites'}
            </button>
          )}
        </div>
        
        {/* Expanded Details */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-pink-200/20 overflow-hidden"
            >
              <div className="p-4 space-y-3 bg-gray-900/50">
                {/* What We'll Arrange - NEW */}
                {pick.what_we_arrange && (
                  <div>
                    <h5 className="text-xs font-semibold text-purple-400 uppercase tracking-wide mb-1">
                      What We'll Arrange
                    </h5>
                    <p className="text-sm text-gray-300">{pick.what_we_arrange}</p>
                  </div>
                )}
                
                {/* Legacy: What We Source */}
                {!pick.what_we_arrange && pick.what_we_source && (
                  <div>
                    <h5 className="text-xs font-semibold text-purple-400 uppercase tracking-wide mb-1">
                      What We Source
                    </h5>
                    <p className="text-sm text-gray-300">{pick.what_we_source}</p>
                  </div>
                )}
                
                {/* What's Included - NEW format */}
                {pick.includes && pick.includes.length > 0 && (
                  <div>
                    <h5 className="text-xs font-semibold text-purple-400 uppercase tracking-wide mb-2">
                      What's Included
                    </h5>
                    <ul className="space-y-1">
                      {pick.includes.slice(0, 6).map((item, i) => (
                        <li key={i} className="text-xs text-gray-400 flex items-start gap-2">
                          <Check className="w-3 h-3 text-green-400 flex-shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Legacy: Selection Rules */}
                {!pick.includes && pick.selection_rules && pick.selection_rules.length > 0 && (
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
                
                {/* What We Need - NEW */}
                {pick.what_we_need && pick.what_we_need.length > 0 && (
                  <div>
                    <h5 className="text-xs font-semibold text-amber-400 uppercase tracking-wide mb-2">
                      What We Need From You
                    </h5>
                    <ul className="space-y-1">
                      {pick.what_we_need.map((item, i) => (
                        <li key={i} className="text-xs text-amber-300/80 flex items-start gap-2">
                          <span className="w-3 h-3 flex-shrink-0 mt-0.5 text-amber-400">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {pick.safety_note && (
                  <div className="flex items-start gap-2 p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                    <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-300">{pick.safety_note}</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
  
  // For CATALOGUE cards - existing expandable design
  return (
    <motion.div
      layout
      className={`rounded-2xl overflow-hidden transition-all bg-gray-800/60 border border-gray-700/50 ${
        isSelected ? 'ring-2 ring-pink-500' : ''
      }`}
    >
      {/* Main Card */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Image */}
          <div 
            className="w-20 h-20 rounded-xl flex-shrink-0 overflow-hidden bg-gray-700 cursor-pointer"
            onClick={() => onViewDetails?.(pick)}
          >
            {pick.image_url || pick.image ? (
              <img 
                src={pick.image_url || pick.image} 
                alt={pick.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-6 h-6 text-gray-400" />
              </div>
            )}
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-white text-sm leading-tight mb-1">
              {pick.name}
            </h4>
            
            {/* Category + Brand */}
            <div className="flex flex-wrap gap-1 mb-2">
              {pick.category && (
                <span className="px-2 py-0.5 bg-gray-700/50 text-gray-400 text-xs rounded-full">
                  {pick.category}
                </span>
              )}
              {pick.brand && (
                <span className="px-2 py-0.5 bg-gray-700/50 text-gray-400 text-xs rounded-full">
                  {pick.brand}
                </span>
              )}
            </div>
            
            {/* Why this pick */}
            {whyText && (
              <p className="text-xs text-amber-400/90 flex items-start gap-1 line-clamp-2">
                <Heart className="w-3 h-3 flex-shrink-0 mt-0.5" />
                <span>{whyText}</span>
              </p>
            )}
          </div>
        </div>
        
        {/* Action Buttons Row */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => onViewDetails?.(pick)}
            className="flex-1 py-2.5 bg-gray-700/50 text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors active:scale-95"
          >
            View Details
          </button>
          <button
            onClick={handleSelect}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all active:scale-95 ${
              isSelected 
                ? 'bg-green-500 text-white' 
                : 'bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:opacity-90'
            }`}
          >
            {isSelected ? '✓ Added' : 'Add to Picks'}
          </button>
        </div>
      </div>
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
  onAskMira,      // NEW: Flow to chat
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
      style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))' }}
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
                  <div className="flex items-center gap-2">
                    {/* Ask Mira about this pick */}
                    {onAskMira && (
                      <button
                        onClick={() => {
                          hapticFeedback.buttonTap();
                          onAskMira(item);
                        }}
                        className="px-2 py-1 text-xs bg-purple-500/20 text-purple-300 rounded-lg flex items-center gap-1 hover:bg-purple-500/30"
                      >
                        <MessageSquare className="w-3 h-3" />
                        Ask
                      </button>
                    )}
                    <button
                      onClick={() => {
                        hapticFeedback.buttonTap();
                        onRemove(item);
                      }}
                      className="w-6 h-6 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
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
          className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold py-4 px-4 rounded-full flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform"
        >
          <Send className="w-4 h-4" />
          Send to My Concierge®
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
              <h3 className="font-bold text-white">Send to Concierge®</h3>
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
        <div className="p-4 border-t border-gray-800 flex gap-3" style={{ paddingBottom: 'max(1rem, calc(env(safe-area-inset-bottom, 0px) + 1rem))' }}>
          <button
            onClick={() => {
              hapticFeedback.buttonTap();
              onClose();
            }}
            className="flex-1 py-4 bg-gray-800 text-gray-300 rounded-full font-medium active:scale-95 transition-transform"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              hapticFeedback.success();
              onConfirm(additionalNotes);
            }}
            className="flex-1 py-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full font-medium flex items-center justify-center gap-2 active:scale-95 transition-transform"
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
 * 
 * Now supports:
 * - Engine picks from B6 Picks Engine (auto-refreshed every turn)
 * - Auto pillar switching based on conversation classification
 * - "Updated just now" timestamp
 * - Safety override handling
 */
const PersonalizedPicksPanel = ({
  isOpen,
  onClose,
  pet,
  token,
  userEmail,
  onSendSuccess, // Callback when picks are sent successfully - adds message to chat
  onPickClick,   // NEW: Callback when a pick is clicked - flows into chat conversation
  // NEW: Engine picks props (B6)
  enginePicks = [],        // Pre-computed picks from picks engine
  enginePillar = null,     // Auto-detected pillar from classification
  conciergeDecision = null, // Concierge® prominence decision
  safetyOverride = null,   // Emergency/caution state
  lastUpdated = null,      // For "Updated just now"
  // NEW: Mira's conversation suggestions (🎂, 🎈, etc.)
  conversationSuggestions = [], // Dynamic suggestions from chat
  // NEW: Conversation context for context-aware picks
  conversationContext = null, // { topic: "goa trip", destination: "Goa" }
  // NEW: Single pillar mode - when on a pillar page, show ONLY that pillar (no tabs for others)
  pillar = null            // If set, locks to this pillar and hides other pillar tabs
}) => {
  // UNIFIED SERVICE FLOW: Hook to create service tickets from picks
  const { submitRequest, isSubmitting: isServiceSubmitting } = useUniversalServiceCommand();
  
  // Determine initial pillar: locked pillar > engine pillar > celebrate
  const initialPillar = pillar || enginePillar || 'celebrate';
  const [activePillar, setActivePillar] = useState(initialPillar);
  
  // If pillar is locked, always use it
  const isPillarLocked = Boolean(pillar);
  const [picksData, setPicksData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [sentItems, setSentItems] = useState([]); // Track items sent to concierge
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showAllCatalogue, setShowAllCatalogue] = useState(false);
  const [showAllConcierge, setShowAllConcierge] = useState(false);
  const [showAllTimely, setShowAllTimely] = useState(false);
  const [showWhyPicks, setShowWhyPicks] = useState(false);
  const [customRequest, setCustomRequest] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null); // For product detail modal (fallback)
  const [selectedConcierge, setSelectedConcierge] = useState(null); // For concierge detail modal (fallback)
  const [isSending, setIsSending] = useState(false); // Prevent double submission
  const [undoToast, setUndoToast] = useState(null); // { item, timeout } for 5-second undo
  const [taskStatuses, setTaskStatuses] = useState({}); // { pickId: 'scheduled' | 'in_progress' | 'requested' }
  const [favorites, setFavorites] = useState([]); // Pet's saved favorites
  const [savingFavorite, setSavingFavorite] = useState({}); // Track which item is being saved
  const scrollRef = useRef(null);
  const undoTimeoutRef = useRef(null);
  
  // Check if an item was sent to concierge
  const isSentToConcierge = (item) => {
    return sentItems.some(i => i.id === item.id || i.name === item.name);
  };
  
  // Load pet's favorites on mount
  useEffect(() => {
    const loadFavorites = async () => {
      if (!pet?.id) return;
      try {
        const res = await fetch(`${API_URL}/api/favorites/${pet.id}`);
        if (res.ok) {
          const data = await res.json();
          setFavorites(data.favorites || []);
        }
      } catch (err) {
        console.log('Could not load favorites:', err);
      }
    };
    loadFavorites();
  }, [pet?.id]);
  
  // Check if a pick is favorited
  const isFavorited = useCallback((pick) => {
    const pickId = pick.id || pick.pick_id || pick.product_id;
    return favorites.some(f => f.item_id === pickId);
  }, [favorites]);
  
  // Save/unsave to favorites
  const toggleFavorite = useCallback(async (pick) => {
    if (!pet?.id) return;
    
    const pickId = pick.id || pick.pick_id || pick.product_id;
    setSavingFavorite(prev => ({ ...prev, [pickId]: true }));
    
    try {
      const isCurrentlyFavorited = isFavorited(pick);
      
      if (isCurrentlyFavorited) {
        // Remove from favorites
        const res = await fetch(`${API_URL}/api/favorites/remove`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pet_id: pet.id, item_id: pickId })
        });
        if (res.ok) {
          setFavorites(prev => prev.filter(f => f.item_id !== pickId));
          hapticFeedback.success();
        }
      } else {
        // Add to favorites
        const res = await fetch(`${API_URL}/api/favorites/add`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pet_id: pet.id,
            item: {
              id: pickId,
              title: pick.name || pick.title,
              type: pick.type || 'product',
              category: pick.category,
              service_type: pick.service_type,
              pillar: activePillar,
              icon: pick.icon
            }
          })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.item_added) {
            setFavorites(prev => [...prev, data.item_added]);
          }
          hapticFeedback.success();
        }
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
    } finally {
      setSavingFavorite(prev => ({ ...prev, [pickId]: false }));
    }
  }, [pet?.id, isFavorited, activePillar]);
  
  // Get pillar info - either locked pillar or all pillars
  const displayPillars = isPillarLocked 
    ? PILLARS.filter(p => p.id === pillar)
    : PILLARS;
  
  // ══════════════════════════════════════════════════════════════════════════════
  // PILLAR STATE MANAGEMENT (CRITICAL - DO NOT MODIFY WITHOUT READING BIBLE)
  // 
  // The user's tab click MUST ALWAYS take precedence over the engine pillar.
  // Use a ref to track user selection - refs persist across re-renders and don't 
  // cause stale closure issues like useState can in effects.
  // ══════════════════════════════════════════════════════════════════════════════
  const userSelectedPillarRef = useRef(false);
  
  // Reset user selection tracking when panel closes
  useEffect(() => {
    if (!isOpen) {
      userSelectedPillarRef.current = false;
    }
  }, [isOpen]);
  
  // AUTO PILLAR SWITCH: When enginePillar changes, switch ONLY if user hasn't selected a tab
  // EXCEPTION: If pillar is locked (single pillar mode), never auto-switch
  useEffect(() => {
    // If pillar is locked, always use it
    if (isPillarLocked) {
      setActivePillar(pillar);
      return;
    }
    
    // Only auto-switch if:
    // 1. Panel is open
    // 2. User hasn't manually selected a pillar in this session
    // 3. Engine pillar is valid
    if (isOpen && !userSelectedPillarRef.current && enginePillar && enginePillar !== 'general') {
      console.log(`[PICKS PANEL] Auto-switching to engine pillar: ${enginePillar}`);
      setActivePillar(enginePillar);
    }
  }, [isOpen, enginePillar, isPillarLocked, pillar]);
  
  // Track when user manually selects a pillar - this LOCKS the pillar for this session
  const handlePillarSelect = (pillarId) => {
    console.log(`[PICKS PANEL] User clicked pillar tab: ${pillarId} (locking)`);
    userSelectedPillarRef.current = true; // Use ref for immediate effect
    setActivePillar(pillarId);
    setShowAllCatalogue(false);
    setShowAllConcierge(false);
  };
  
  // Get "Updated just now" text
  const getUpdatedText = () => {
    if (!lastUpdated) return null;
    const diff = Date.now() - new Date(lastUpdated).getTime();
    if (diff < 60000) return 'Updated just now';
    if (diff < 300000) return 'Updated a few minutes ago';
    return null;
  };
  
  // Fetch picks data - now context-aware
  const fetchPicks = useCallback(async () => {
    if (!pet?.name) return;
    
    setLoading(true);
    setError(null);
    
    try {
      let response;
      
      // If we have conversation context, use context-aware endpoint
      if (conversationContext?.topic) {
        console.log(`[PICKS] Fetching context-aware picks for: ${conversationContext.topic}`);
        response = await fetch(`${API_URL}/api/mira/top-picks/context-aware`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` })
          },
          body: JSON.stringify({
            pet_id: pet.id || pet.name,
            context: conversationContext.topic,
            destination: conversationContext.destination,
            limit: 12
          })
        });
        
        if (response.ok) {
          const contextData = await response.json();
          // Transform context-aware response to match existing format
          const contextPillar = contextData.context?.matched_pillar || 'travel';
          setPicksData({
            pillars: {
              [contextPillar]: {
                picks: contextData.picks || [],
                concierge_picks: contextData.concierge_picks || []
              }
            },
            context: contextData.context
          });
          // Auto-switch to the matched pillar
          if (contextPillar && contextPillar !== 'general') {
            setActivePillar(contextPillar);
          }
          setLoading(false);
          return;
        }
      }
      
      // Default: Fetch standard pillar-based picks
      response = await fetch(`${API_URL}/api/mira/top-picks/${encodeURIComponent(pet.name)}`, {
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
  }, [pet?.name, pet?.id, token, conversationContext]);
  
  useEffect(() => {
    if (isOpen && pet?.name) {
      fetchPicks();
    }
  }, [isOpen, pet?.name, fetchPicks]);
  
  // Toggle item selection (with pick type) - iOS premium haptic
  const toggleSelection = (item, pickType = 'catalogue') => {
    setSelectedItems(prev => {
      const exists = prev.find(i => i.id === item.id || i.name === item.name);
      if (exists) {
        // Deselecting - lighter feedback
        hapticFeedback.pickDeselect();
        return prev.filter(i => i.id !== item.id && i.name !== item.name);
      }
      // Selecting - satisfying feedback
      hapticFeedback.pickSelect();
      return [...prev, { 
        ...item, 
        pick_type: pickType,
        pillar: activePillar,
        addedAt: new Date().toISOString() 
      }];
    });
  };
  
  // Flow single pick to chat - creates ticket and adds message to chat
  // UNIFIED SERVICE FLOW: Always creates a service ticket for concierge
  const flowPickToChat = async (pick, pickType = 'catalogue') => {
    console.log('[PersonalizedPicksPanel] flowPickToChat called:', { pick, pickType, hasOnPickClick: !!onPickClick });
    
    hapticFeedback.success();
    
    // Prepare pick data for chat flow
    const pickData = {
      ...pick,
      pick_type: pickType,
      pillar: activePillar,
      pet_name: pet?.name,
      pet_id: pet?.id,
      timestamp: new Date().toISOString()
    };
    
    // UNIFIED SERVICE FLOW: Create a service ticket for this pick
    try {
      await submitRequest({
        type: 'PICK_REQUEST',
        pillar: activePillar || 'general',
        details: {
          pick_id: pick.id || pick.pick_id,
          pick_name: pick.name || pick.title,
          pick_type: pickType,
          pick_description: pick.description,
          pick_price: pick.price || pick.price_display,
          message: `I'd like to proceed with: ${pick.name || pick.title}`
        },
        pet: { id: pet?.id, name: pet?.name },
        entryPoint: 'picks_panel',
        navigateToInbox: true,
        showToast: true
      });
      console.log('[PersonalizedPicksPanel] Service ticket created for pick:', pick.name);
    } catch (err) {
      console.error('[PersonalizedPicksPanel] Error creating service ticket:', err);
    }
    
    // Also call the legacy callback if provided (for backwards compatibility)
    if (onPickClick) {
      console.log('[PersonalizedPicksPanel] Calling onPickClick with:', pickData);
      onPickClick(pickData);
    }
    
    // Close the panel
    onClose();
  };
  
  const isSelected = (item) => {
    return selectedItems.some(i => i.id === item.id || i.name === item.name);
  };
  
  // Send to concierge
  const handleSendToConcierge = async (additionalNotes) => {
    // Prevent double submission
    if (isSending) return;
    setIsSending(true);
    
    try {
      await fetch(`${API_URL}/api/concierge/picks-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({
          pet_name: pet?.name,
          pet_id: pet?.id,
          user_email: userEmail,
          selected_items: selectedItems,
          additional_notes: additionalNotes,
          timestamp: new Date().toISOString()
        })
      });
      
      // Celebration haptic for confirmed picks - wow moment!
      hapticFeedback.picksConfirm();
      setShowConfirmation(false);
      
      // Show success toast with concierge icon
      toast.success(
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <div>
            <div className="font-semibold">Sent to your Concierge®</div>
            <div className="text-xs text-gray-400">{selectedItems.length} pick{selectedItems.length > 1 ? 's' : ''} for {pet?.name}</div>
          </div>
        </div>,
        {
          duration: 4000,
          style: {
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            border: '1px solid rgba(147, 51, 234, 0.3)',
            color: '#fff'
          }
        }
      );
      
      // Mark items as sent (for visual indicator)
      setSentItems(prev => [...prev, ...selectedItems]);
      
      // Call success callback with selected items count and pet name (called once)
      onSendSuccess?.({
        count: selectedItems.length,
        petName: pet?.name,
        items: selectedItems,
        additionalNotes
      });
      
      setSelectedItems([]);
      onClose();
    } catch (err) {
      console.error('Error sending to concierge:', err);
      hapticFeedback.error();
    } finally {
      setIsSending(false);
    }
  };
  
  // Quick send single item - when user clicks on a product/service card
  const handleQuickSendItem = async (item, type) => {
    // Prevent double submission
    if (isSending) return;
    setIsSending(true);
    
    const itemWithMeta = {
      ...item,
      pick_type: type,
      addedAt: new Date().toISOString()
    };
    
    try {
      await fetch(`${API_URL}/api/concierge/picks-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({
          pet_name: pet?.name,
          pet_id: pet?.id,
          user_email: userEmail,
          selected_items: [itemWithMeta],
          additional_notes: '',
          timestamp: new Date().toISOString()
        })
      });
      
      hapticFeedback.success();
      
      // Call success callback
      onSendSuccess?.({
        count: 1,
        petName: pet?.name,
        items: [itemWithMeta],
        additionalNotes: ''
      });
      
      onClose();
    } catch (err) {
      console.error('Error sending to concierge:', err);
    } finally {
      setIsSending(false);
    }
  };
  
  // Get current pillar data
  // ══════════════════════════════════════════════════════════════════════════════
  // PILLAR DATA EXTRACTION (CRITICAL - this is where the rendering data comes from)
  // The activePillar state determines which pillar's products are shown
  // ══════════════════════════════════════════════════════════════════════════════
  const currentPillarData = picksData?.pillars?.[activePillar] || { picks: [], concierge_picks: [] };
  const cataloguePicks = currentPillarData.picks || [];
  const conciergePicks = currentPillarData.concierge_picks || [];
  
  // Debug: Log which pillar is being rendered (remove after confirming fix works)
  useEffect(() => {
    if (isOpen && picksData) {
      console.log(`[PICKS PANEL RENDER] activePillar: ${activePillar}, cataloguePicks: ${cataloguePicks.length}, conciergePicks: ${conciergePicks.length}`);
      if (cataloguePicks.length > 0) {
        console.log(`[PICKS PANEL RENDER] First catalogue pick: ${cataloguePicks[0]?.name}`);
      }
    }
  }, [isOpen, activePillar, cataloguePicks.length, conciergePicks.length, picksData]);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // TASK CREATION WITH 5-SECOND UNDO (Phase 3)
  // Tap pick → Task created → Show undo toast → After 5s, confirm task
  // ═══════════════════════════════════════════════════════════════════════════
  const createTaskFromPick = useCallback(async (pick, skipUndo = false) => {
    const pickId = pick.id || pick.pick_id || pick.name;
    
    // If undo was not skipped, show the undo toast first
    if (!skipUndo) {
      // Clear any existing timeout
      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current);
      }
      
      // Show undo toast
      setUndoToast({ pick, pickId });
      
      // Set task status to "requested"
      setTaskStatuses(prev => ({ ...prev, [pickId]: 'requested' }));
      
      // Haptic feedback
      hapticFeedback.pickSelect();
      
      // Start 5-second countdown
      undoTimeoutRef.current = setTimeout(() => {
        // After 5 seconds, actually create the task
        confirmTaskCreation(pick);
      }, 5000);
      
      return;
    }
    
    // Skip undo - create task immediately
    await confirmTaskCreation(pick);
  }, []);
  
  const confirmTaskCreation = async (pick) => {
    const pickId = pick.id || pick.pick_id || pick.name;
    
    // Clear undo toast
    setUndoToast(null);
    
    // Update status to "in_progress"
    setTaskStatuses(prev => ({ ...prev, [pickId]: 'in_progress' }));
    
    try {
      // Create task via API
      const response = await fetch(`${API_URL}/api/concierge/picks-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({
          pet_name: pet?.name,
          pet_id: pet?.id,
          user_email: userEmail,
          selected_items: [{
            ...pick,
            pick_type: pick.type || pick.pick_type || 'concierge',
            pillar: activePillar,
            addedAt: new Date().toISOString()
          }],
          additional_notes: '',
          timestamp: new Date().toISOString(),
          task_creation: true // Flag for backend to create task
        })
      });
      
      if (response.ok) {
        // Update status to "scheduled"
        setTaskStatuses(prev => ({ ...prev, [pickId]: 'scheduled' }));
        
        // Trigger celebration
        hapticFeedback.success();
        
        // Notify parent
        onSendSuccess?.({
          count: 1,
          petName: pet?.name,
          items: [pick],
          additionalNotes: '',
          taskCreated: true
        });
      }
    } catch (err) {
      console.error('Error creating task:', err);
      setTaskStatuses(prev => ({ ...prev, [pickId]: null }));
      hapticFeedback.error();
    }
  };
  
  const undoTaskCreation = useCallback(() => {
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
    }
    
    if (undoToast) {
      const pickId = undoToast.pickId;
      setTaskStatuses(prev => ({ ...prev, [pickId]: null }));
      hapticFeedback.cancel();
    }
    
    setUndoToast(null);
  }, [undoToast]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current);
      }
    };
  }, []);
  
  // Get task status for a pick
  const getTaskStatus = (pick) => {
    const pickId = pick.id || pick.pick_id || pick.name;
    return taskStatuses[pickId];
  };
  
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
            
            {/* Safety Banner - Shows for emergency/caution */}
            {safetyOverride?.active && (
              <div className={`mx-4 mb-2 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
                safetyOverride.level === 'emergency' 
                  ? 'bg-red-900/50 text-red-300 border border-red-500/30' 
                  : 'bg-yellow-900/50 text-yellow-300 border border-yellow-500/30'
              }`}>
                <AlertCircle className="w-4 h-4" />
                {safetyOverride.level === 'emergency' 
                  ? 'Emergency detected - showing priority actions' 
                  : 'Caution - consult your vet for health concerns'}
              </div>
            )}
            
            {/* Title */}
            <div className="px-4 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    Picks for {pet?.name || 'Your Pet'}
                  </h2>
                  <p className="text-xs text-purple-400 flex items-center gap-1">
                    {getUpdatedText() ? (
                      <>
                        <RefreshCw className="w-3 h-3" />
                        {getUpdatedText()}
                      </>
                    ) : (
                      <>
                        <Heart className="w-3 h-3" />
                        Mira knows {pet?.name}
                      </>
                    )}
                  </p>
                  {/* Why these picks - expandable */}
                  {enginePillar && (
                    <button 
                      onClick={() => setShowWhyPicks(!showWhyPicks)}
                      className="mt-1 text-[10px] text-purple-300/70 hover:text-purple-300 flex items-center gap-1 transition-colors"
                    >
                      <Info className="w-2.5 h-2.5" />
                      Why these picks?
                      <ChevronDown className={`w-2.5 h-2.5 transition-transform ${showWhyPicks ? 'rotate-180' : ''}`} />
                    </button>
                  )}
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
            
            {/* Pillar tabs - show only locked pillar in single-pillar mode, or all pillars */}
            <div 
              ref={scrollRef}
              className="flex overflow-x-auto gap-2 px-4 pb-3 scrollbar-hide"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {displayPillars.map((pillarItem) => {
                const isEnginePillar = enginePillar === pillarItem.id;
                return (
                  <button
                    key={pillarItem.id}
                    onClick={() => {
                      // In locked mode, don't allow tab switching
                      if (isPillarLocked) return;
                      hapticFeedback.buttonTap();
                      handlePillarSelect(pillarItem.id);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-full whitespace-nowrap text-sm transition-all flex-shrink-0 ${
                      activePillar === pillarItem.id
                        ? `bg-gradient-to-r ${pillarItem.gradient} text-white shadow-lg`
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    } ${isEnginePillar && activePillar !== pillarItem.id ? 'ring-2 ring-purple-500/50' : ''} ${isPillarLocked ? 'cursor-default' : ''}`}
                  >
                    <span className="text-base">{pillarItem.emoji}</span>
                    <span className="text-sm font-medium">{pillarItem.name}</span>
                    {isEnginePillar && activePillar !== pillarItem.id && (
                      <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* "Why these picks" expandable panel */}
          <AnimatePresence>
            {showWhyPicks && enginePillar && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-b border-purple-500/20"
              >
                <div className="px-4 py-3 bg-purple-900/20 text-xs text-gray-300 space-y-2">
                  <p className="flex items-start gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400 flex-shrink-0 mt-0.5" />
                    <span>
                      Based on your conversation about <strong className="text-purple-300">{enginePillar}</strong>, 
                      Mira selected picks that match {pet?.name}'s profile, safety requirements, and your preferences.
                    </span>
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded-full text-[10px]">
                      Pet profile matched
                    </span>
                    <span className="px-2 py-0.5 bg-green-500/20 text-green-300 rounded-full text-[10px]">
                      Safety checked
                    </span>
                    <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-full text-[10px]">
                      Ranked by relevance
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
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
              /* TWO COLUMN LAYOUT: Personalized for Pet */
              <div className="space-y-6">
                {/* ═══════════════════════════════════════════════════════════════════════════ */}
                {/* NEW: CURATED CONCIERGE SECTION - Intelligence Layer picks for Celebrate    */}
                {/* Shows 3-5 personalized cards from /api/mira/curated-set                    */}
                {/* This REPLACES old concierge picks for celebrate pillar                     */}
                {/* ═══════════════════════════════════════════════════════════════════════════ */}
                {activePillar === 'celebrate' && pet?.id && token && (
                  <div className="mb-6">
                    <div className="mb-3">
                      <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-pink-400" />
                        Mira's Picks for {pet?.name}
                      </h3>
                      <p className="text-xs text-gray-400 mt-1">Curated celebrations based on {pet?.name}'s personality</p>
                    </div>
                    <CuratedConciergeSection
                      petId={pet.id}
                      petName={pet.name}
                      pillar="celebrate"
                      token={token}
                      onTicketCreate={async (ticketData) => {
                        // Create service request
                        try {
                          const response = await fetch(`${API_URL}/api/service-requests`, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              Authorization: `Bearer ${token}`,
                            },
                            body: JSON.stringify({
                              type: ticketData.card_type,
                              pillar: 'celebrate',
                              source: 'curated_picks_panel',
                              title: ticketData.card_name,
                              customer: {
                                name: userEmail?.split('@')[0] || 'Customer',
                                email: userEmail || '',
                                phone: ''
                              },
                              details: {
                                card_id: ticketData.card_id,
                                pet_id: ticketData.pet_id,
                                pet_name: pet.name,
                              },
                              priority: 'normal',
                              intent: 'curated_pick'
                            }),
                          });
                          
                          if (response.ok) {
                            // Call success callback to add message to chat
                            onSendSuccess?.({
                              count: 1,
                              petName: pet.name,
                              items: [{
                                name: ticketData.card_name,
                                type: ticketData.card_type
                              }],
                              additionalNotes: ''
                            });
                          } else {
                            throw new Error('Failed to create request');
                          }
                        } catch (err) {
                          console.error('Error creating ticket:', err);
                          throw err;
                        }
                      }}
                    />
                  </div>
                )}
                
                {/* ═══════════════════════════════════════════════════════════════ */}
                {/* TIMELY PICKS - "{petName} might need this" (Soul Integration)  */}
                {/* Shows picks based on recent chat intents - Mira knows           */}
                {/* ONLY show when NO specific pillar tab is selected (shows during contextual conversations) */}
                {/* ═══════════════════════════════════════════════════════════════ */}
                {(!activePillar || activePillar === 'all' || activePillar === 'general') && picksData?.timely_picks?.length > 0 && (
                  <div className="mb-6">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                          <Clock className="w-4 h-4 text-amber-400" />
                          {pet?.name} might need this
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">Mira knows what's on your mind</p>
                      </div>
                      {picksData.timely_picks.length > 4 && (
                        <button
                          onClick={() => setShowAllTimely(!showAllTimely)}
                          className="text-xs text-amber-400 hover:text-amber-300 font-medium"
                        >
                          {showAllTimely ? 'Show less' : `See all ${picksData.timely_picks.length}`}
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {picksData.timely_picks.slice(0, showAllTimely ? 8 : 4).map((pick, index) => (
                        <div 
                          key={pick.id || `timely-${index}`}
                          className={`p-3 rounded-xl bg-gradient-to-br from-amber-900/30 to-orange-900/20 border border-amber-500/30 cursor-pointer hover:border-amber-400/50 transition-all active:scale-[0.98] ${
                            isSelected(pick) ? 'ring-2 ring-amber-400' : ''
                          }`}
                          onClick={() => {
                            hapticFeedback.buttonTap();
                            toggleSelection(pick, 'catalogue');
                          }}
                        >
                          {/* Timely badge */}
                          <div className="flex justify-end mb-1">
                            <span className="text-[9px] px-2 py-0.5 bg-amber-500/80 text-white rounded-full font-semibold">
                              Timely
                            </span>
                          </div>
                          <div className="flex items-start gap-2">
                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-700 flex-shrink-0">
                              {pick.image_url || pick.image ? (
                                <img src={pick.image_url || pick.image} alt={pick.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package className="w-4 h-4 text-gray-500" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-medium text-white truncate">{pick.name}</h4>
                              {pick.why_it_fits && (
                                <p className="text-[10px] text-amber-300/80 mt-0.5 line-clamp-2">{pick.why_it_fits}</p>
                              )}
                              {pick.price && (
                                <p className="text-xs font-semibold text-amber-400 mt-1">₹{pick.price}</p>
                              )}
                            </div>
                          </div>
                          {isSelected(pick) && (
                            <div className="absolute top-2 left-2">
                              <CheckCircle className="w-4 h-4 text-amber-400" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* ═══════════════════════════════════════════════════════════════════ */}
                {/* INTENT-DRIVEN SHELF - "{Pet} needs this for {Intent}"              */}
                {/* Dynamic cards from MIRA brain based on chat intent                  */}
                {/* Concierge®-sourced (no price) - "Concierge® will arrange"            */}
                {/* ONLY show when NO specific pillar is selected (general/all view)   */}
                {/* ═══════════════════════════════════════════════════════════════════ */}
                {(!activePillar || activePillar === 'all' || activePillar === 'general') && 
                 picksData?.intent_driven?.has_recommendations && (
                  <div className="mb-6">
                    <div className="mb-3">
                      <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                        <Zap className="w-4 h-4 text-cyan-400" />
                        {picksData.intent_driven.shelf_title || `${pet?.name} needs this`}
                      </h3>
                      <p className="text-xs text-cyan-400/70 mt-1">Concierge® will source and arrange these for you</p>
                    </div>
                    
                    {/* Intent-Driven Picks */}
                    {picksData.intent_driven.picks?.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide">Products</p>
                        <div className="grid grid-cols-2 gap-3">
                          {picksData.intent_driven.picks.slice(0, 4).map((pick, index) => (
                            <div 
                              key={pick.id || `intent-pick-${index}`}
                              className={`p-3 rounded-xl bg-gradient-to-br from-cyan-900/30 to-blue-900/20 border border-cyan-500/30 cursor-pointer hover:border-cyan-400/50 transition-all active:scale-[0.98] relative ${
                                isSelected(pick) ? 'ring-2 ring-cyan-400' : ''
                              }`}
                              onClick={() => {
                                hapticFeedback.buttonTap();
                                toggleSelection(pick, 'concierge');
                              }}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <span className="text-xl">{pick.icon || '🎯'}</span>
                                <span className="text-[9px] px-2 py-0.5 bg-cyan-500/80 text-white rounded-full font-semibold">
                                  For {pet?.name}
                                </span>
                              </div>
                              <h4 className="text-xs font-medium text-white mb-1">{pick.name}</h4>
                              <p className="text-[10px] text-cyan-300/80 line-clamp-2">{pick.description || pick.reason}</p>
                              <p className="text-[10px] text-gray-500 mt-2 italic">{pick.price_display || 'Concierge® sources'}</p>
                              {isSelected(pick) && (
                                <div className="absolute top-2 right-2">
                                  <CheckCircle className="w-4 h-4 text-cyan-400" />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Intent-Driven Services */}
                    {picksData.intent_driven.services?.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide">Services</p>
                        <div className="space-y-2">
                          {picksData.intent_driven.services.slice(0, 3).map((service, index) => (
                            <div 
                              key={service.id || `intent-service-${index}`}
                              className={`p-3 rounded-xl bg-gradient-to-r from-purple-900/40 to-cyan-900/20 border border-purple-500/30 cursor-pointer hover:border-purple-400/50 transition-all active:scale-[0.98] ${
                                isSelected(service) ? 'ring-2 ring-purple-400' : ''
                              }`}
                              onClick={() => {
                                hapticFeedback.buttonTap();
                                toggleSelection(service, 'concierge');
                              }}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                                  <span className="text-lg">{service.icon || '🎯'}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <h4 className="text-sm font-medium text-white">{service.name}</h4>
                                    <span className="text-[9px] px-2 py-0.5 bg-purple-500/50 text-purple-200 rounded-full">
                                      {service.duration || 'Varies'}
                                    </span>
                                  </div>
                                  <p className="text-xs text-purple-300/80">{service.description || service.reason}</p>
                                </div>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                                  isSelected(service) 
                                    ? 'bg-purple-500 text-white' 
                                    : 'bg-purple-700/50 text-purple-300'
                                }`}>
                                  {isSelected(service) ? <Check className="w-4 h-4" /> : <span className="text-lg">+</span>}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* ═══════════════════════════════════════════════════════════════════ */}
                {/* PERSONALIZED SHELF - "✨ Personalized for {Pet}"                    */}
                {/* ALWAYS shown proactively - unique items with pet's photo           */}
                {/* Concierge® creates these (mugs, coasters, blankets, etc.)           */}
                {/* These are CELEBRATE items - show on general view OR celebrate tab  */}
                {/* ═══════════════════════════════════════════════════════════════════ */}
                {(!activePillar || activePillar === 'all' || activePillar === 'general' || activePillar === 'celebrate') && 
                 picksData?.personalized?.has_products && (
                  <div className="mb-6">
                    <div className="mb-3">
                      <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-pink-400" />
                        {picksData.personalized.shelf_title || `Personalized for ${pet?.name}`}
                      </h3>
                      <p className="text-xs text-pink-400/70 mt-1">{picksData.personalized.shelf_subtitle || 'Unique items featuring your pet'}</p>
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
                      {picksData.personalized.products.slice(0, 6).map((product, index) => (
                        <div 
                          key={product.id || `personalized-${index}`}
                          className={`flex-shrink-0 w-36 p-3 rounded-xl bg-gradient-to-br from-pink-900/40 to-purple-900/20 border border-pink-500/30 cursor-pointer hover:border-pink-400/50 transition-all active:scale-[0.98] ${
                            isSelected(product) ? 'ring-2 ring-pink-400' : ''
                          }`}
                          onClick={() => {
                            hapticFeedback.buttonTap();
                            // If it links somewhere, navigate there
                            if (product.links_to) {
                              window.location.href = product.links_to;
                            } else {
                              toggleSelection(product, 'personalized');
                            }
                          }}
                        >
                          <div className="flex justify-center mb-2">
                            <span className="text-3xl">{product.icon || '🎁'}</span>
                          </div>
                          <h4 className="text-xs font-medium text-white text-center mb-1">{product.name}</h4>
                          <p className="text-[10px] text-pink-300/80 text-center line-clamp-2">{product.description}</p>
                          <p className="text-[10px] text-gray-500 text-center mt-2 italic">{product.price_display || 'Concierge® creates'}</p>
                          {/* Primary CTA - Flow to Chat */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              hapticFeedback.success();
                              flowPickToChat(product, 'personalized');
                            }}
                            className="w-full mt-2 py-1.5 rounded-lg text-[10px] font-medium transition-all bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:opacity-90"
                          >
                            {product.cta || `Create for ${pet?.name}`}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* ═══════════════════════════════════════════════════════════════════ */}
                {/* CELEBRATE SHELF - "Celebrate {Pet}'s Birthday"                      */}
                {/* Shown when birthday intent is detected - links to cake designer    */}
                {/* ═══════════════════════════════════════════════════════════════════ */}
                {picksData?.celebrate?.has_products && (
                  <div className="mb-6">
                    <div className="mb-3">
                      <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                        <Cake className="w-4 h-4 text-amber-400" />
                        {picksData.celebrate.shelf_title || `Celebrate ${pet?.name}'s Birthday`}
                      </h3>
                      <p className="text-xs text-amber-400/70 mt-1">{picksData.celebrate.shelf_subtitle || 'Make it special!'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {picksData.celebrate.products.slice(0, 4).map((product, index) => (
                        <div 
                          key={product.id || `celebrate-${index}`}
                          className={`p-3 rounded-xl bg-gradient-to-br from-amber-900/40 to-pink-900/20 border border-amber-500/30 cursor-pointer hover:border-amber-400/50 transition-all active:scale-[0.98] ${
                            isSelected(product) ? 'ring-2 ring-amber-400' : ''
                          }`}
                          onClick={() => {
                            hapticFeedback.buttonTap();
                            // Navigate to cake designer if it links there
                            if (product.links_to) {
                              window.location.href = product.links_to;
                            } else {
                              toggleSelection(product, 'celebrate');
                            }
                          }}
                        >
                          <div className="flex justify-center mb-2">
                            <span className="text-2xl">{product.icon || '🎂'}</span>
                          </div>
                          <h4 className="text-xs font-medium text-white text-center mb-1">{product.name}</h4>
                          <p className="text-[10px] text-amber-300/80 text-center line-clamp-2">{product.description}</p>
                          {/* Primary CTA - Flow to Chat */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (product.links_to) {
                                window.location.href = product.links_to;
                              } else {
                                hapticFeedback.success();
                                flowPickToChat(product, 'celebrate');
                              }
                            }}
                            className={`w-full mt-2 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
                              product.links_to
                                ? 'bg-gradient-to-r from-amber-500 to-pink-500 text-white hover:opacity-90'
                                : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:opacity-90'
                            }`}
                          >
                            {product.links_to ? (product.cta || 'Design Now') : (product.cta || 'Request')}
                          </button>
                        </div>
                      ))}
                    </div>
                    {/* Quick link to cake designer */}
                    {picksData.celebrate.tool_link && (
                      <button
                        onClick={() => {
                          hapticFeedback.buttonTap();
                          window.location.href = picksData.celebrate.tool_link;
                        }}
                        className="w-full mt-3 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-pink-500 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity active:scale-[0.98]"
                      >
                        <Cake className="w-4 h-4" />
                        {picksData.celebrate.tool_cta || `Design ${pet?.name}'s Cake`}
                      </button>
                    )}
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* ═══════════════════════════════════════════════════ */}
                {/* CONVERSATION SUGGESTIONS - Dynamic picks from Mira's chat */}
                {/* These are the 🎂🎈📸🦴 suggestions from the conversation */}
                {/* ═══════════════════════════════════════════════════ */}
                {conversationSuggestions.length > 0 && (
                  <div className="md:col-span-2 mb-6">
                    <div className="mb-3">
                      <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-pink-400 animate-pulse" />
                        Mira's Suggestions from Our Chat
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">Tap to select what you want for {pet?.name}</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {conversationSuggestions.map((suggestion, index) => (
                        <div 
                          key={suggestion.id || index}
                          className={`p-4 rounded-xl bg-gradient-to-r from-pink-900/30 to-purple-900/30 border border-pink-500/30 cursor-pointer hover:border-pink-500/60 transition-all active:scale-[0.98] ${
                            isSelected(suggestion) ? 'ring-2 ring-pink-500' : ''
                          } ${isSentToConcierge(suggestion) ? 'opacity-60' : ''}`}
                          onClick={() => {
                            if (isSentToConcierge(suggestion)) return; // Already sent
                            hapticFeedback.buttonTap();
                            toggleSelection(suggestion, 'suggestion');
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-pink-500/20 flex items-center justify-center flex-shrink-0">
                              <span className="text-2xl">{suggestion.title?.match(/^[\p{Emoji}]/u)?.[0] || '✨'}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-white text-sm">{suggestion.title?.replace(/^[\p{Emoji}]\s*/u, '') || 'Suggestion'}</h4>
                              {isSentToConcierge(suggestion) ? (
                                <span className="text-xs text-green-400 flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" /> Sent to Concierge®
                                </span>
                              ) : (
                                <>
                                  {suggestion.subtitle && suggestion.subtitle !== 'Price on request' && suggestion.subtitle !== 'Tap to request' && (
                                    <span className="text-xs text-green-400">{suggestion.subtitle}</span>
                                  )}
                                  {(!suggestion.subtitle || suggestion.subtitle === 'Tap to request') && (
                                    <span className="text-xs text-green-400">Tap to request</span>
                                  )}
                                </>
                              )}
                              {suggestion.description && (
                                <p className="text-xs text-gray-400 mt-1 truncate">{suggestion.description}</p>
                              )}
                            </div>
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                                isSentToConcierge(suggestion)
                                  ? 'bg-green-500 text-white'
                                  : isSelected(suggestion) 
                                    ? 'bg-pink-500 text-white' 
                                    : 'bg-gray-700 text-gray-400'
                              }`}
                            >
                              {isSentToConcierge(suggestion) ? (
                                <CheckCircle className="w-4 h-4" />
                              ) : isSelected(suggestion) ? (
                                <Check className="w-4 h-4" />
                              ) : (
                                <span className="text-lg">+</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* ═══════════════════════════════════════════════════ */}
                {/* LEFT: MIRA'S PICKS - Handpicked products for this pet */}
                {/* ═══════════════════════════════════════════════════ */}
                <div>
                  {cataloguePicks.length > 0 && (
                    <div>
                      <div className="mb-3">
                        <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                          <Heart className="w-4 h-4 text-pink-400" />
                          Mira's Picks for {pet?.name}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">Handpicked because Mira knows {pet?.name}</p>
                      </div>
                      <div className="space-y-3">
                        {cataloguePicks.slice(0, showAllCatalogue ? 10 : 4).map((pick, index) => (
                          <div 
                            key={pick.id || index}
                            className={`p-3 rounded-xl bg-gray-800/60 border border-gray-700/50 cursor-pointer hover:bg-gray-800 transition-all active:scale-[0.98] ${
                              isSelected(pick) ? 'ring-2 ring-pink-500' : ''
                            }`}
                            onClick={() => {
                              hapticFeedback.buttonTap();
                              // Add/remove from selection (multi-select)
                              toggleSelection(pick, 'catalogue');
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-700 flex-shrink-0">
                                {pick.image_url || pick.image ? (
                                  <img src={pick.image_url || pick.image} alt={pick.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Package className="w-5 h-5 text-gray-500" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-white text-sm truncate">{pick.name}</h4>
                                {pick.category && (
                                  <span className="text-xs text-gray-400">{pick.category}</span>
                                )}
                                {(pick.why_it_fits || pick.why_reason) && (
                                  <p className="text-xs text-purple-300 mt-1 flex items-center gap-1">
                                    <Heart className="w-3 h-3" />
                                    <span className="truncate">{pick.why_it_fits || pick.why_reason}</span>
                                  </p>
                                )}
                              </div>
                              {/* Favorite button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavorite(pick);
                                }}
                                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                                  isFavorited(pick) 
                                    ? 'bg-pink-500/20 text-pink-400' 
                                    : 'bg-gray-700/50 text-gray-500 hover:text-pink-400'
                                }`}
                                title={isFavorited(pick) ? 'Remove from favorites' : 'Save to favorites'}
                              >
                                <Heart className={`w-4 h-4 ${isFavorited(pick) ? 'fill-pink-400' : ''} ${savingFavorite[pick.id] ? 'animate-pulse' : ''}`} />
                              </button>
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                                  isSelected(pick) 
                                    ? 'bg-pink-500 text-white' 
                                    : 'bg-gray-700 text-gray-400'
                                }`}
                              >
                                {isSelected(pick) ? <Check className="w-4 h-4" /> : <span className="text-lg">+</span>}
                              </div>
                            </div>
                          </div>
                        ))}
                        {cataloguePicks.length > 4 && !showAllCatalogue && (
                          <button
                            onClick={() => {
                              hapticFeedback.buttonTap();
                              setShowAllCatalogue(true);
                            }}
                            className="w-full py-2 text-sm text-purple-400 hover:text-purple-300"
                          >
                            Show {cataloguePicks.length - 4} more →
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* ═══════════════════════════════════════════════════ */}
                {/* RIGHT: CONCIERGE ARRANGES - Personalized services */}
                {/* ═══════════════════════════════════════════════════ */}
                <div>
                  {conciergePicks.length > 0 && (
                    <div>
                      <div className="mb-3">
                        <h3 className="text-sm font-semibold text-purple-300 uppercase tracking-wider flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-purple-400" />
                          Concierge® Arranges for {pet?.name}
                        </h3>
                        <p className="text-xs text-purple-400/70 mt-1">We'll source and arrange everything</p>
                      </div>
                      <div className="space-y-3">
                        {conciergePicks.slice(0, showAllConcierge ? 10 : 4).map((pick, index) => (
                          <div 
                            key={pick.id || index}
                            className={`p-3 rounded-xl bg-gradient-to-br from-purple-900/40 to-pink-900/20 border border-purple-500/30 cursor-pointer hover:border-purple-400 transition-all active:scale-[0.98] ${
                              isSelected(pick) ? 'ring-2 ring-pink-500' : ''
                            }`}
                            onClick={() => {
                              hapticFeedback.buttonTap();
                              // Flow to chat directly for concierge picks
                              flowPickToChat(pick, 'concierge');
                            }}
                          >
                            <div className="flex items-center gap-3">
                              {/* Icon/Badge */}
                              <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                                <Sparkles className="w-6 h-6 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="px-2 py-0.5 bg-pink-500/30 text-pink-300 text-xs rounded-full">
                                    Concierge® Pick
                                  </span>
                                  {/* Task Status Badge */}
                                  {getTaskStatus(pick) && (
                                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                                      getTaskStatus(pick) === 'scheduled' 
                                        ? 'bg-green-500/30 text-green-300' 
                                        : getTaskStatus(pick) === 'in_progress'
                                        ? 'bg-blue-500/30 text-blue-300'
                                        : 'bg-yellow-500/30 text-yellow-300'
                                    }`}>
                                      {getTaskStatus(pick) === 'scheduled' ? '✓ Scheduled' :
                                       getTaskStatus(pick) === 'in_progress' ? 'In Progress' :
                                       'Requested'}
                                    </span>
                                  )}
                                </div>
                                <h4 className="font-medium text-white text-sm truncate">{pick.name}</h4>
                                {pick.spec_chip && (
                                  <span className="text-xs text-purple-300">{pick.spec_chip}</span>
                                )}
                                {(pick.why_it_fits || pick.why_reason) && (
                                  <p className="text-xs text-purple-300 mt-1 flex items-center gap-1">
                                    <Heart className="w-3 h-3" />
                                    <span className="truncate">{pick.why_it_fits || pick.why_reason}</span>
                                  </p>
                                )}
                              </div>
                              {/* Favorite button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavorite(pick);
                                }}
                                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                                  isFavorited(pick) 
                                    ? 'bg-pink-500/20 text-pink-400' 
                                    : 'bg-purple-700/50 text-purple-400 hover:text-pink-400'
                                }`}
                                title={isFavorited(pick) ? 'Remove from favorites' : 'Save to favorites'}
                              >
                                <Heart className={`w-4 h-4 ${isFavorited(pick) ? 'fill-pink-400' : ''} ${savingFavorite[pick.id] ? 'animate-pulse' : ''}`} />
                              </button>
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!getTaskStatus(pick)) {
                                    createTaskFromPick(pick);
                                  }
                                }}
                                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                                  getTaskStatus(pick) === 'scheduled'
                                    ? 'bg-green-500 text-white cursor-default'
                                    : getTaskStatus(pick)
                                    ? 'bg-yellow-500 text-white cursor-wait'
                                    : isSelected(pick) 
                                    ? 'bg-pink-500 text-white' 
                                    : 'bg-purple-700 text-purple-300 hover:bg-purple-600 cursor-pointer'
                                }`}
                              >
                                {getTaskStatus(pick) === 'scheduled' ? <Check className="w-4 h-4" /> :
                                 getTaskStatus(pick) ? <RefreshCw className="w-4 h-4 animate-spin" /> :
                                 isSelected(pick) ? <Check className="w-4 h-4" /> : <span className="text-lg">+</span>}
                              </div>
                            </div>
                          </div>
                        ))}
                        {conciergePicks.length > 4 && !showAllConcierge && (
                          <button
                            onClick={() => {
                              hapticFeedback.buttonTap();
                              setShowAllConcierge(true);
                            }}
                            className="w-full py-2 text-sm text-purple-400 hover:text-purple-300"
                          >
                            Show {conciergePicks.length - 4} more →
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              </div>
            )}
            
            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* CONCIERGE FALLBACK - When no catalogue picks, ALWAYS show      */}
            {/* "Your Concierge® Can Arrange This" cards. NEVER show empty.     */}
            {/* Per MOJO Bible: Fallback rule requires Concierge® Arranges      */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            {!loading && cataloguePicks.length === 0 && conciergePicks.length === 0 && activePillar !== 'services' && (
              <div className="space-y-6">
                {/* Concierge® Arranges Fallback Section */}
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Your Concierge® Can Arrange This
                  </h3>
                  <p className="text-sm text-gray-400 max-w-md mx-auto">
                    We don't have catalogue items for {PILLARS.find(p => p.id === activePillar)?.name?.toLowerCase() || 'this'} yet, 
                    but your Concierge® can source anything for {pet?.name}.
                  </p>
                </div>
                
                {/* Dynamic Concierge® Cards based on pillar */}
                <div className="grid grid-cols-1 gap-3">
                  {/* Generate 3 fallback concierge cards based on active pillar */}
                  {[
                    { 
                      name: `Custom ${PILLARS.find(p => p.id === activePillar)?.name || 'Service'} for ${pet?.name}`,
                      description: `We'll find and arrange the perfect ${activePillar} experience tailored to ${pet?.name}'s preferences.`,
                      cta: 'Request This'
                    },
                    {
                      name: `${pet?.name}'s Special ${PILLARS.find(p => p.id === activePillar)?.name || 'Experience'}`,
                      description: `Tell us what you're looking for - we'll source it, vet it, and arrange everything.`,
                      cta: "Let's Arrange"
                    },
                    {
                      name: 'Something Else in Mind?',
                      description: `Your Concierge® can source anything for ${pet?.name}. Just describe what you need.`,
                      cta: 'Tell Us'
                    }
                  ].map((fallbackPick, index) => (
                    <div 
                      key={`fallback-${index}`}
                      className={`p-4 rounded-xl bg-gradient-to-br from-purple-900/40 to-pink-900/20 border border-purple-500/30 cursor-pointer hover:border-purple-400 transition-all active:scale-[0.98] ${
                        isSelected(fallbackPick) ? 'ring-2 ring-pink-500' : ''
                      }`}
                      onClick={() => {
                        hapticFeedback.buttonTap();
                        // Flow directly to chat for fallback picks
                        flowPickToChat({
                          ...fallbackPick,
                          id: `concierge-fallback-${activePillar}-${index}`,
                          pillar: activePillar,
                          type: 'concierge_fallback'
                        }, 'concierge');
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                          <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 bg-pink-500/30 text-pink-300 text-xs rounded-full">
                              Arranged for {pet?.name}
                            </span>
                          </div>
                          <h4 className="font-medium text-white text-sm">{fallbackPick.name}</h4>
                          <p className="text-xs text-purple-300/80 mt-1">{fallbackPick.description}</p>
                        </div>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isSelected(fallbackPick) ? 'bg-pink-500 text-white' : 'bg-purple-700 text-purple-300'
                        }`}>
                          {isSelected(fallbackPick) ? <Check className="w-4 h-4" /> : <span className="text-lg">+</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* CTA to chat with Mira */}
                <div className="text-center pt-4">
                  <p className="text-xs text-gray-500">
                    Or chat with Mira to describe exactly what you need
                  </p>
                </div>
              </div>
            )}
            
            {/* ═══════════════════════════════════════════════════ */}
            {/* ANYTHING ELSE - Custom request for anything, anytime, anywhere */}
            {/* ═══════════════════════════════════════════════════ */}
            <div className="mt-8 pt-6 border-t border-gray-800">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-white mb-1">
                  Anything else?
                </h3>
                <p className="text-sm text-gray-400">
                  Tell us what you need. Your concierge can do anything, anytime, anywhere.
                </p>
              </div>
              
              <div className="relative">
                <textarea
                  value={customRequest}
                  onChange={(e) => setCustomRequest(e.target.value)}
                  placeholder={`What would you like for ${pet?.name}? A surprise treat? Special arrangement? Just ask...`}
                  className="w-full bg-gray-800/80 border border-gray-700 rounded-2xl p-4 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 resize-none"
                  rows={3}
                />
                {customRequest.trim() && (
                  <button
                    onClick={() => {
                      hapticFeedback.success();
                      const customItem = {
                        id: `custom-${Date.now()}`,
                        name: customRequest.trim().slice(0, 50) + (customRequest.length > 50 ? '...' : ''),
                        full_request: customRequest.trim(),
                        type: 'custom_request',
                        pick_type: 'custom'
                      };
                      setSelectedItems(prev => [...prev, customItem]);
                      setCustomRequest('');
                    }}
                    className="absolute bottom-3 right-3 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-sm font-medium rounded-full hover:opacity-90 transition-opacity"
                  >
                    Add Request
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {/* Mini Cart */}
          <MiniCart
            selectedItems={selectedItems}
            onRemove={toggleSelection}
            onSendToConcierge={() => setShowConfirmation(true)}
            onAskMira={(item) => {
              // Flow single item to chat
              flowPickToChat(item, item.pick_type || 'catalogue');
            }}
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
          
          {/* Product Detail Modal - Same as main site */}
          {selectedProduct && createPortal(
            <ProductDetailModal 
              product={selectedProduct} 
              pillar={activePillar}
              selectedPet={pet}
              miraContext={{
                petName: pet?.name,
                source: 'picks_panel',
                includeText: 'Add to Picks'
              }}
              onClose={() => setSelectedProduct(null)}
              onAddToPicks={(productWithOptions) => {
                hapticFeedback.success();
                toggleSelection(productWithOptions);
                setSelectedProduct(null);
              }}
            />,
            document.body
          )}
          
          {/* Concierge® Detail Modal - Matching design */}
          {selectedConcierge && createPortal(
            <ConciergeDetailModal 
              service={selectedConcierge} 
              pet={pet}
              onClose={() => setSelectedConcierge(null)}
              onRequest={(serviceWithNotes) => {
                hapticFeedback.success();
                toggleSelection(serviceWithNotes);
                setSelectedConcierge(null);
              }}
            />,
            document.body
          )}
          
          {/* ═══════════════════════════════════════════════════════════════════════════ */}
          {/* 5-SECOND UNDO TOAST (Phase 3) */}
          {/* Shows when user taps a pick, allows undo before task is created */}
          {/* ═══════════════════════════════════════════════════════════════════════════ */}
          <AnimatePresence>
            {undoToast && (
              <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full shadow-2xl shadow-purple-500/30"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  <span className="text-white text-sm font-medium">
                    Task created for {undoToast.pick?.name || undoToast.pick?.title}
                  </span>
                </div>
                <button
                  onClick={undoTaskCreation}
                  className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-full text-white text-sm font-semibold transition-colors"
                >
                  Undo
                </button>
                {/* Progress bar */}
                <motion.div 
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: 5, ease: 'linear' }}
                  className="absolute bottom-0 left-0 h-1 bg-white/40 rounded-full"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PersonalizedPicksPanel;

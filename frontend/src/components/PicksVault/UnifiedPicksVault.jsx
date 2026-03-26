/**
 * UnifiedPicksVault.jsx
 * 
 * Unified "Mira's Picks" vault with smart tabs:
 * - 🎁 Conversation: Subject-relevant picks from current chat
 * - 💡 Tips: Advice and tips from conversation
 * - ✨ For [Pet]: Quick access to personalized top picks
 * 
 * Features:
 * - Smart badges (Trending, New, Reorder, Birthday Soon) with animations
 * - Seasonal boosts (Diwali, Christmas, Monsoon, etc.)
 * - Full haptic feedback on all interactions
 * - Category/Pillar picker for filtering
 * - Individual item selection with checkboxes
 * - No prices shown for Concierge® Suggestion cards
 * - iOS safe area support
 * - Swipe-to-close gesture
 * - Pull to refresh
 * - Long press quick actions
 * - Keyboard navigation (Escape to close)
 * - "Why this pick?" enhanced tooltips
 * - Skeleton loading states
 * 
 * 100/100 Mobile-First Implementation
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useDragControls } from 'framer-motion';
import { bookViaConcierge } from '../../utils/MiraCardActions';
import {
  X, Gift, Lightbulb, Sparkles, ChevronRight, Send, Heart,
  ShoppingBag, Calendar, TrendingUp, RefreshCw, Star, Clock,
  AlertCircle, Check, Info, Flame, Package, Filter, CheckSquare, Square,
  ShoppingCart, ThumbsDown, Share2, MoreHorizontal, ChevronDown, HelpCircle,
  // Icons for Concierge® Cards
  Cake, Utensils, PartyPopper, Camera, Scissors, Cookie, Salad, 
  Stethoscope, Hotel, Moon, Home, UserCheck, PhoneCall, Plane, MapPin,
  Car, Route, HeartPulse, Smile, Droplets, Footprints, Puzzle, CloudRain,
  Users, Coffee, Map, Accessibility, Scale, Thermometer, Mountain,
  GraduationCap, Dog, DoorOpen, Box, HeartHandshake, ClipboardCheck, Brain,
  ListChecks, Activity, ShieldCheck, Cpu, FileText, Umbrella, IdCard,
  Repeat, Search, Ruler, MessageSquarePlus, PenLine
} from 'lucide-react';
import { API_URL } from '../../utils/api';
import hapticFeedback from '../../utils/haptic';

// Icon mapping for concierge cards
const ICON_MAP = {
  'cake': Cake, 'utensils': Utensils, 'party-popper': PartyPopper, 'camera': Camera,
  'heart': Heart, 'clipboard-list': ListChecks, 'cookie': Cookie, 'salad': Salad,
  'utensils-crossed': Utensils, 'stethoscope': Stethoscope, 'hotel': Hotel, 'moon': Moon,
  'home': Home, 'user-check': UserCheck, 'phone-call': PhoneCall, 'plane': Plane,
  'map-pin': MapPin, 'car': Car, 'route': Route, 'heart-pulse': HeartPulse,
  'scissors': Scissors, 'sparkles': Sparkles, 'smile': Smile, 'droplets': Droplets,
  'footprints': Footprints, 'puzzle': Puzzle, 'cloud-rain': CloudRain, 'users': Users,
  'coffee': Coffee, 'map': Map, 'accessibility': Accessibility, 'scale': Scale,
  'thermometer': Thermometer, 'mountain': Mountain, 'graduation-cap': GraduationCap,
  'dog': Dog, 'door-open': DoorOpen, 'box': Box, 'heart-handshake': HeartHandshake,
  'clipboard-check': ClipboardCheck, 'brain': Brain, 'list-checks': ListChecks,
  'activity': Activity, 'shield-check': ShieldCheck, 'cpu': Cpu, 'file-text': FileText,
  'umbrella': Umbrella, 'id-card': IdCard, 'package': Package, 'repeat': Repeat,
  'search': Search, 'ruler': Ruler, 'gift': Gift,
};

// Smart badge configurations with animations
const SMART_BADGES = {
  trending: { icon: Flame, label: 'Trending', color: 'bg-orange-100 text-orange-600', bgColor: '#FED7AA', animate: true },
  new: { icon: Sparkles, label: 'New', color: 'bg-blue-100 text-blue-600', bgColor: '#BFDBFE', animate: true, pulse: true },
  reorder: { icon: RefreshCw, label: 'Reorder', color: 'bg-green-100 text-green-600', bgColor: '#BBF7D0', animate: false },
  birthday: { icon: Gift, label: 'Birthday Soon!', color: 'bg-pink-100 text-pink-600', bgColor: '#FBCFE8', animate: true, pulse: true },
  seasonal: { icon: Star, label: 'Seasonal', color: 'bg-purple-100 text-purple-600', bgColor: '#DDD6FE', animate: true },
};

// Get current season/event
const getCurrentSeason = () => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  
  if (month === 2 && day <= 14) return { event: 'valentine', label: "Valentine's Day", emoji: '💕' };
  if (month === 10 || (month === 11 && day <= 15)) return { event: 'diwali', label: 'Diwali', emoji: '🪔' };
  if (month === 12) return { event: 'christmas', label: 'Christmas', emoji: '🎄' };
  if (month >= 6 && month <= 9) return { event: 'monsoon', label: 'Monsoon', emoji: '🌧️' };
  if (month >= 4 && month <= 6) return { event: 'summer', label: 'Summer', emoji: '☀️' };
  
  return null;
};

// Check if pet's birthday is near
const isPetBirthdayNear = (pet) => {
  if (!pet?.date_of_birth && !pet?.birthday) return false;
  
  const bday = new Date(pet.date_of_birth || pet.birthday);
  const now = new Date();
  const thisYearBday = new Date(now.getFullYear(), bday.getMonth(), bday.getDate());
  const daysUntil = Math.ceil((thisYearBday - now) / (1000 * 60 * 60 * 24));
  
  return daysUntil >= -7 && daysUntil <= 14;
};

// Skeleton Loading Card
const SkeletonCard = () => (
  <div className="flex-shrink-0 w-36 rounded-xl overflow-hidden bg-white border border-gray-100 animate-pulse">
    <div className="h-24 bg-gray-200" />
    <div className="p-2 space-y-2">
      <div className="h-3 bg-gray-200 rounded w-full" />
      <div className="h-3 bg-gray-200 rounded w-2/3" />
      <div className="h-4 bg-gray-200 rounded w-1/2" />
    </div>
    <div className="px-2 pb-2">
      <div className="h-6 bg-gray-200 rounded" />
    </div>
  </div>
);

// Animated Badge Component
const AnimatedBadge = ({ badge }) => {
  const config = SMART_BADGES[badge];
  if (!config) return null;
  const Icon = config.icon;
  
  return (
    <motion.span 
      className={`px-1.5 py-0.5 text-[9px] font-medium rounded-full flex items-center gap-0.5 ${config.color}`}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ 
        scale: 1, 
        opacity: 1,
        ...(config.pulse && {
          boxShadow: ['0 0 0 0 rgba(236, 72, 153, 0.4)', '0 0 0 4px rgba(236, 72, 153, 0)', '0 0 0 0 rgba(236, 72, 153, 0)']
        })
      }}
      transition={{ 
        duration: 0.3,
        ...(config.pulse && {
          boxShadow: { repeat: Infinity, duration: 2 }
        })
      }}
    >
      <Icon className={`w-2.5 h-2.5 ${config.animate ? 'animate-pulse' : ''}`} />
      {config.label}
    </motion.span>
  );
};

// Enhanced "Why This Pick" Tooltip
const WhyThisPickTooltip = ({ pick, pet, isVisible, onClose }) => {
  if (!isVisible) return null;
  
  const reasons = [];
  
  // Build intelligent reasons
  if (pick.badges?.includes('trending')) {
    reasons.push({ icon: '🔥', text: 'Popular with pet parents this week' });
  }
  if (pick.badges?.includes('new')) {
    reasons.push({ icon: '✨', text: 'Just added to our collection' });
  }
  if (pick.badges?.includes('reorder')) {
    reasons.push({ icon: '🔄', text: `${pet?.name || 'Your pet'} loved this before` });
  }
  if (pick.badges?.includes('birthday')) {
    reasons.push({ icon: '🎂', text: `Perfect for ${pet?.name}'s upcoming birthday!` });
  }
  if (pick.badges?.includes('seasonal')) {
    const season = getCurrentSeason();
    reasons.push({ icon: season?.emoji || '⭐', text: `Great for ${season?.label || 'this season'}` });
  }
  
  // Add personalization reason
  if (pick.why_reason) {
    reasons.push({ icon: '💡', text: pick.why_reason });
  } else {
    reasons.push({ icon: '🐕', text: `Curated for ${pet?.name || 'your pet'}` });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -5, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -5, scale: 0.95 }}
      className="absolute top-8 right-0 left-0 bg-gray-900 text-white text-[10px] p-3 rounded-xl z-30 shadow-xl"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-amber-400">Why this pick?</span>
        <button 
          onClick={onClose}
          className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
      <div className="space-y-1.5">
        {reasons.map((reason, i) => (
          <div key={i} className="flex items-start gap-2">
            <span>{reason.icon}</span>
            <span className="text-gray-200">{reason.text}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

// Quick Actions Menu (Long Press)
const QuickActionsMenu = ({ pick, isVisible, onClose, onAction, position }) => {
  if (!isVisible) return null;
  
  const actions = [
    { id: 'cart', icon: ShoppingCart, label: 'Add to Cart', color: 'text-green-500' },
    { id: 'not_interested', icon: ThumbsDown, label: 'Not Interested', color: 'text-gray-500' },
    { id: 'share', icon: Share2, label: 'Share', color: 'text-blue-500' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="absolute z-40 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
      style={{ top: position.y, left: position.x }}
      onClick={(e) => e.stopPropagation()}
    >
      {actions.map((action) => (
        <button
          key={action.id}
          onClick={() => {
            hapticFeedback.toggle();
            onAction(action.id, pick);
            onClose();
          }}
          className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 active:bg-gray-100 transition-colors"
        >
          <action.icon className={`w-4 h-4 ${action.color}`} />
          <span className="text-sm text-gray-700">{action.label}</span>
        </button>
      ))}
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// CONCIERGE CONFIRMATION MODAL
// Beautiful card showing synopsis of selected items before sending to Concierge®
// ═══════════════════════════════════════════════════════════════════════════════
const ConciergeConfirmationModal = ({ 
  isOpen, 
  onClose, 
  selectedPicks, 
  pet, 
  onConfirm, 
  onEdit 
}) => {
  const [status, setStatus] = useState('preview'); // preview, sending, sent
  const [notes, setNotes] = useState('');
  
  if (!isOpen) return null;
  
  const cataloguePicks = selectedPicks.filter(p => p.pick_type !== 'concierge');
  const conciergePicks = selectedPicks.filter(p => p.pick_type === 'concierge');
  
  const handleConfirm = async () => {
    setStatus('sending');
    hapticFeedback.toggle();
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setStatus('sent');
    hapticFeedback.success();
    
    // Auto close after showing success
    setTimeout(() => {
      onConfirm({ picks: selectedPicks, notes, pet });
      onClose();
    }, 2000);
  };
  
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg max-h-[85vh] overflow-hidden shadow-2xl"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 20px)' }}
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Status: Sent */}
          {status === 'sent' ? (
            <motion.div 
              className="p-8 text-center"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <motion.div
                className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
              >
                <Check className="w-10 h-10 text-white" />
              </motion.div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Request Sent! ✨</h3>
              <p className="text-gray-600 mb-4">
                Our Concierge® team is now reaching out and curating this specially for {pet?.name || 'your pet'}.
              </p>
              <div className="bg-purple-50 rounded-xl p-4 text-left">
                <p className="text-sm text-purple-700">
                  <span className="font-semibold">What happens next:</span>
                </p>
                <ul className="mt-2 text-sm text-purple-600 space-y-1">
                  <li>• We'll source the best options for you</li>
                  <li>• You'll receive a WhatsApp update within 24 hours</li>
                  <li>• Pricing and availability will be confirmed</li>
                </ul>
              </div>
            </motion.div>
          ) : (
            <>
              {/* Header */}
              <div className="sticky top-0 bg-white z-10 px-4 pt-4 pb-3 border-b border-gray-100">
                <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-3" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                      <Send className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Confirm Request</h2>
                      <p className="text-xs text-gray-500">{selectedPicks.length} item{selectedPicks.length > 1 ? 's' : ''} for {pet?.name}</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center"
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>
              
              {/* Content */}
              <div className="overflow-y-auto px-4 py-4" style={{ maxHeight: 'calc(85vh - 200px)' }}>
                {/* Catalogue Items */}
                {cataloguePicks.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-amber-500" />
                      Products & Services ({cataloguePicks.length})
                    </h3>
                    <div className="space-y-2">
                      {cataloguePicks.map((pick, i) => (
                        <div key={i} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                          {pick.image ? (
                            <img src={pick.image} alt="" className="w-12 h-12 rounded-lg object-cover" />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center">
                              <Package className="w-5 h-5 text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{pick.name}</p>
                            {pick.price && <p className="text-xs text-pink-600">₹{pick.price}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Concierge® Items */}
                {conciergePicks.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-500" />
                      Concierge® Sourcing ({conciergePicks.length})
                    </h3>
                    <div className="space-y-2">
                      {conciergePicks.map((pick, i) => (
                        <div key={i} className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-100">
                          <p className="text-sm font-medium text-gray-900">{pick.name}</p>
                          <p className="text-xs text-purple-600 mt-1 italic">Concierge® will source & get back with price</p>
                          {pick.specs && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {pick.specs.slice(0, 2).map((spec, j) => (
                                <span key={j} className="text-[10px] px-2 py-0.5 bg-white/60 rounded-full text-purple-700">
                                  {spec}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Notes field */}
                <div className="mb-4">
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Any special notes? (optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={`E.g., ${pet?.name} is allergic to chicken, please keep that in mind...`}
                    className="w-full p-3 border border-gray-200 rounded-xl text-sm resize-none h-20 focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none"
                  />
                </div>
                
                {/* Pet Info Card */}
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                  <p className="text-xs text-amber-700">
                    <span className="font-semibold">Tailored for {pet?.name}:</span>{' '}
                    {pet?.breed} • {pet?.size || 'Medium'} • 
                    {pet?.allergies?.length > 0 ? ` Avoiding: ${pet.allergies.join(', ')}` : ' No known allergies'}
                  </p>
                </div>
              </div>
              
              {/* Footer */}
              <div className="sticky bottom-0 bg-white border-t border-gray-100 px-4 py-3 flex gap-3">
                <button
                  onClick={() => {
                    hapticFeedback.buttonTap();
                    onEdit?.();
                    onClose();
                  }}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl flex items-center justify-center gap-2 min-h-[48px]"
                >
                  Edit Selection
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={status === 'sending'}
                  className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-xl flex items-center justify-center gap-2 min-h-[48px] disabled:opacity-70"
                >
                  {status === 'sending' ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send to Concierge®
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Pick Card with Smart Badges, Selection, and Long Press
const PickCard = ({ 
  pick, 
  pet, 
  onAdd, 
  onSendToConcierge, 
  isSelected, 
  onToggleSelect, 
  selectable = false,
  onQuickAction 
}) => {
  const [showInfo, setShowInfo] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [quickActionsPosition, setQuickActionsPosition] = useState({ x: 0, y: 0 });
  const longPressTimer = useRef(null);
  const cardRef = useRef(null);
  
  const isConcierge = pick.pick_type === 'concierge';
  const badges = pick.badges || [];
  
  // Long press handler
  const handleTouchStart = (e) => {
    longPressTimer.current = setTimeout(() => {
      hapticFeedback.longPress();
      const rect = cardRef.current?.getBoundingClientRect();
      setQuickActionsPosition({ 
        x: e.touches[0].clientX - (rect?.left || 0), 
        y: e.touches[0].clientY - (rect?.top || 0) + 20 
      });
      setShowQuickActions(true);
    }, 500);
  };
  
  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };
  
  return (
    <motion.div
      ref={cardRef}
      className={`relative flex-shrink-0 w-36 rounded-xl overflow-hidden shadow-sm ${
        isConcierge 
          ? 'bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-dashed border-purple-200' 
          : 'bg-white border border-gray-100'
      } ${isSelected ? 'ring-2 ring-amber-400' : ''}`}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchEnd}
      onClick={() => {
        hapticFeedback.buttonTap();
        if (selectable) onToggleSelect?.(pick);
      }}
    >
      {/* Selection checkbox - 44px touch target */}
      {selectable && (
        <button
          className="absolute top-1 left-1 z-20 w-11 h-11 rounded-lg bg-white/90 flex items-center justify-center shadow-sm touch-manipulation"
          onClick={(e) => {
            e.stopPropagation();
            hapticFeedback.toggle();
            onToggleSelect?.(pick);
          }}
        >
          {isSelected ? (
            <CheckSquare className="w-5 h-5 text-amber-500" />
          ) : (
            <Square className="w-5 h-5 text-gray-400" />
          )}
        </button>
      )}
      
      {/* Image */}
      <div className="relative h-24 bg-gray-50">
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
              <Sparkles className="w-8 h-8 text-purple-300" />
            ) : (
              <Package className="w-8 h-8 text-gray-200" />
            )}
          </div>
        )}
        
        {/* Smart Badges with Animation */}
        <div className={`absolute ${selectable ? 'top-12' : 'top-1'} left-1 flex flex-wrap gap-1 max-w-[90%]`}>
          {badges.slice(0, 2).map((badge, i) => (
            <AnimatedBadge key={i} badge={badge} />
          ))}
          {badges.length > 2 && (
            <span className="px-1.5 py-0.5 text-[9px] font-medium rounded-full bg-gray-100 text-gray-600">
              +{badges.length - 2}
            </span>
          )}
        </div>
        
        {/* Info button - 44px touch target */}
        <button
          className="absolute top-1 right-1 w-11 h-11 rounded-full bg-white/80 flex items-center justify-center touch-manipulation"
          onClick={(e) => { 
            e.stopPropagation(); 
            hapticFeedback.buttonTap();
            setShowInfo(!showInfo); 
          }}
        >
          <Info className="w-4 h-4 text-gray-500" />
        </button>
        
        {/* Enhanced Why tooltip */}
        <AnimatePresence>
          {showInfo && (
            <WhyThisPickTooltip 
              pick={pick} 
              pet={pet} 
              isVisible={showInfo} 
              onClose={() => setShowInfo(false)} 
            />
          )}
        </AnimatePresence>
        
        {/* Type badge */}
        {pick.type === 'service' && (
          <span className="absolute bottom-1 left-1 px-1.5 py-0.5 text-[8px] font-medium bg-blue-500 text-white rounded">
            Service
          </span>
        )}
      </div>
      
      {/* Content */}
      <div className="p-2">
        <h4 className="text-xs font-medium text-gray-900 line-clamp-2 leading-tight mb-1">
          {pick.name}
        </h4>
        {/* NO PRICE for concierge items */}
        {isConcierge ? (
          <p className="text-[10px] text-purple-500 italic">Concierge® will source</p>
        ) : pick.price ? (
          <p className="text-xs font-semibold text-pink-600">₹{pick.price}</p>
        ) : (
          <p className="text-[10px] text-gray-400">Price on request</p>
        )}
      </div>
      
      {/* Add button - only show if not in selection mode */}
      {!selectable && (
        <div className="px-2 pb-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              hapticFeedback.toggle();
              isConcierge ? onSendToConcierge?.(pick) : onAdd?.(pick);
            }}
            className={`w-full py-2 text-[11px] font-medium rounded-lg flex items-center justify-center gap-1 min-h-[36px] touch-manipulation ${
              isConcierge 
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white active:opacity-80' 
                : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100 active:bg-yellow-200'
            }`}
          >
            {isConcierge ? 'Request' : <><Gift className="w-3 h-3" /> Add</>}
          </button>
        </div>
      )}
      
      {/* Quick Actions Menu */}
      <AnimatePresence>
        {showQuickActions && (
          <QuickActionsMenu
            pick={pick}
            isVisible={showQuickActions}
            position={quickActionsPosition}
            onClose={() => setShowQuickActions(false)}
            onAction={onQuickAction}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// EXPANDABLE CATALOGUE PICK CARD - For products/services from our catalogue
// Click to select, tap info to see details - matches brand style
// ═══════════════════════════════════════════════════════════════════════════════
const ExpandablePickCard = ({ 
  pick, 
  pet, 
  onAdd, 
  onSendToConcierge,
  isSelected, 
  onToggleSelect 
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const petName = pet?.name || 'your pet';
  
  return (
    <>
      <motion.div
        className={`relative flex-shrink-0 w-36 rounded-xl overflow-hidden bg-white border ${
          isSelected ? 'border-amber-400 ring-2 ring-amber-400/30' : 'border-gray-200'
        }`}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          hapticFeedback.toggle();
          onToggleSelect?.();
        }}
      >
        {/* Selection indicator */}
        <div 
          className={`absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center z-10 transition-all ${
            isSelected 
              ? 'bg-amber-400 shadow-md' 
              : 'bg-white/90 border border-gray-300'
          }`}
        >
          {isSelected ? (
            <Check className="w-4 h-4 text-white" />
          ) : (
            <div className="w-2 h-2 rounded-full bg-gray-300" />
          )}
        </div>
        
        {/* Info button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            hapticFeedback.buttonTap();
            setShowDetails(true);
          }}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center hover:bg-white z-10 shadow-sm"
        >
          <Info className="w-4 h-4 text-gray-500" />
        </button>
        
        {/* Image */}
        <div className="relative h-24 bg-gray-100">
          {pick.image ? (
            <img src={pick.image} alt={pick.name} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-8 h-8 text-gray-300" />
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="p-2.5">
          <h4 className="text-xs font-semibold text-gray-900 line-clamp-2 leading-tight mb-1">
            {pick.name}
          </h4>
          <p className="text-[10px] text-purple-600 mb-1">
            Picked for {petName}
          </p>
          {pick.price && (
            <p className="text-sm font-bold text-pink-600">₹{pick.price}</p>
          )}
        </div>
      </motion.div>
      
      {/* Details Modal */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDetails(false)}
          >
            <motion.div
              className="bg-white rounded-2xl w-full max-w-sm max-h-[80vh] overflow-hidden shadow-2xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Product Image */}
              {pick.image && (
                <div className="relative h-48 bg-gray-100">
                  <img src={pick.image} alt={pick.name} className="w-full h-full object-cover" />
                  <button
                    onClick={() => setShowDetails(false)}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-md"
                  >
                    <X className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              )}
              
              {/* Content */}
              <div className="p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-1">{pick.name}</h3>
                <p className="text-sm text-purple-600 mb-2">Picked for {petName}</p>
                
                {pick.description && (
                  <p className="text-sm text-gray-600 mb-3">{pick.description}</p>
                )}
                
                {pick.price && (
                  <p className="text-2xl font-bold text-pink-600 mb-4">₹{pick.price}</p>
                )}
                
                {/* Why this pick */}
                {pick.why_reason && (
                  <div className="bg-purple-50 rounded-xl p-3 mb-4">
                    <p className="text-xs font-semibold text-purple-700 mb-1">Why Mira picked this</p>
                    <p className="text-sm text-purple-600">{pick.why_reason}</p>
                  </div>
                )}
              </div>
              
              {/* Footer */}
              <div className="p-4 border-t border-gray-100 flex gap-2">
                <button
                  onClick={() => {
                    hapticFeedback.toggle();
                    onToggleSelect?.();
                    setShowDetails(false);
                  }}
                  className={`flex-1 py-3 rounded-xl font-medium flex items-center justify-center gap-2 ${
                    isSelected 
                      ? 'bg-amber-100 text-amber-700 border border-amber-300' 
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {isSelected ? <Check className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                  {isSelected ? 'Selected' : 'Select'}
                </button>
                <button
                  onClick={() => {
                    hapticFeedback.success();
                    onAdd?.(pick);
                    setShowDetails(false);
                  }}
                  className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-xl"
                >
                  Add to Cart
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// CONCIERGE ARRANGE CARD - Bible Section 9.0: Picks Fallback Rule
// Shows when no catalogue match exists - user can create a Service Desk ticket
// The "+" action creates a ticket via the Uniform Service Spine
// ═══════════════════════════════════════════════════════════════════════════════
const ConciergeArrangeCard = ({ arrange, pet, onCreateTicket, token, user }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [ticketCreated, setTicketCreated] = useState(null);
  const petName = pet?.name || 'your pet';
  
  const handleArrangeClick = async () => {
    if (ticketCreated || isCreating) return;
    
    setIsCreating(true);
    hapticFeedback.buttonTap();
    
    try {
      if (onCreateTicket) {
        const result = await onCreateTicket(arrange);
        if (result?.ticket_id) {
          setTicketCreated(result.ticket_id);
          hapticFeedback.success();
        }
      } else {
        // Direct canonical fallback via bookViaConcierge — /api/service_desk/attach_or_create_ticket
        await bookViaConcierge({
          service: arrange.intent || 'Mira Picks request',
          pillar: arrange.pillar || 'care',
          pet,
          token,
          channel: 'mira_picks_vault',
          notes: arrange.original_request || arrange.intent,
          metadata: { pet_constraints: arrange.pet_constraints || [], source: 'picks_vault_fallback' },
        });
        setTicketCreated(`picks-${Date.now()}`);
        hapticFeedback.success();
      }
    } catch (err) {
      console.error('[CONCIERGE ARRANGE] Failed to create ticket:', err);
      hapticFeedback.error();
    } finally {
      setIsCreating(false);
    }
  };
  
  return (
    <motion.div
      className="p-4 rounded-xl bg-gradient-to-br from-purple-900/40 to-pink-900/20 border border-purple-500/30"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Badge */}
          <span className="inline-block px-2 py-0.5 bg-pink-500/30 text-pink-300 text-xs rounded-full mb-2">
            {arrange.label || 'Concierge® Pick'}
          </span>
          
          {/* Title - Updated copy */}
          <h4 className="font-medium text-white text-sm mb-1">
            Not in the catalogue. We'll arrange this for {petName}.
          </h4>
          
          {/* Subtitle/Spec chip */}
          {arrange.spec_chip && (
            <p className="text-xs text-purple-300 mb-2 flex items-center gap-1">
              <Heart className="w-3 h-3" />
              {arrange.spec_chip}
            </p>
          )}
          
          {/* Description - Opens a request in Services */}
          <p className="text-xs text-gray-400 leading-relaxed">
            {arrange.description || "Opens a request in Services."}
          </p>
          
          {/* Ticket confirmation - Updated copy */}
          {ticketCreated && (
            <motion.div
              className="mt-3 p-2 bg-green-500/20 border border-green-500/30 rounded-lg"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <p className="text-xs text-green-300 flex flex-col gap-1">
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  Request opened • <span className="font-mono">{ticketCreated}</span>
                </span>
                <span className="text-green-400/70 text-[10px] ml-6">Reply in Services to add details or change timing.</span>
              </p>
            </motion.div>
          )}
        </div>
        
        {/* Action Button */}
        <button
          onClick={handleArrangeClick}
          disabled={isCreating || ticketCreated}
          className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
            ticketCreated
              ? 'bg-green-500 text-white cursor-default'
              : isCreating
              ? 'bg-yellow-500 text-white cursor-wait'
              : 'bg-purple-600 text-white hover:bg-purple-500 cursor-pointer'
          }`}
        >
          {ticketCreated ? (
            <Check className="w-5 h-5" />
          ) : isCreating ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <span className="text-xl">+</span>
          )}
        </button>
      </div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// BEAUTIFUL CONCIERGE CARD - Matches dark theme of The Doggy Company
// Shows: icon, title, "Handpicked for Pet", why it fits, spec chip, Request button
// Info panel shows: what we source, selection rules, safety note, questions
// ═══════════════════════════════════════════════════════════════════════════════
const ConciergeCard = ({ 
  pick, 
  pet, 
  onSelect, 
  isSelected, 
  selectable = false,
  onRequest
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const IconComponent = ICON_MAP[pick.icon] || Sparkles;
  const petName = pet?.name || 'your pet';
  const gradient = pick.gradient || ['#EC4899', '#A855F7'];
  
  return (
    <>
      <motion.div
        className={`relative flex-shrink-0 w-44 rounded-2xl overflow-hidden ${
          isSelected ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-gray-900' : ''
        }`}
        style={{
          background: 'linear-gradient(180deg, #1F1F2E 0%, #16161D 100%)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          minHeight: '300px',
        }}
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          if (selectable) {
            hapticFeedback.toggle();
            onSelect?.(pick);
          }
        }}
      >
        {/* Selection indicator */}
        {selectable && (
          <motion.div 
            className={`absolute top-2 left-2 w-5 h-5 rounded-full flex items-center justify-center z-10 ${
              isSelected ? 'bg-amber-400' : 'bg-gray-700 border border-gray-500'
            }`}
          >
            {isSelected && <Check className="w-3 h-3 text-gray-900" />}
          </motion.div>
        )}
        
        {/* Info button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            hapticFeedback.buttonTap();
            setShowDetails(true);
          }}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-gray-700/50 flex items-center justify-center hover:bg-gray-600/50 z-10"
        >
          <Info className="w-4 h-4 text-gray-400" />
        </button>
        
        {/* Icon */}
        <div className="flex justify-center pt-6 pb-3">
          <div 
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${gradient[0]} 0%, ${gradient[1]} 100%)`,
              boxShadow: `0 4px 20px ${gradient[0]}40`,
            }}
          >
            <IconComponent className="w-7 h-7 text-white" strokeWidth={1.5} />
          </div>
        </div>
        
        {/* Content */}
        <div className="px-3 pb-2 text-center">
          {/* Title */}
          <h4 className="text-sm font-semibold text-white leading-tight line-clamp-2 mb-2">
            {pick.name}
          </h4>
          
          {/* Handpicked for Pet */}
          <p className="text-xs font-medium mb-2" style={{ color: gradient[0] }}>
            Handpicked for {petName}
          </p>
          
          {/* Why it fits */}
          <p className="text-[11px] text-gray-400 leading-snug line-clamp-3 mb-3">
            {pick.why_it_fits}
          </p>
          
          {/* Spec chip */}
          <span 
            className="inline-block px-3 py-1 text-[10px] font-medium rounded-full mb-3"
            style={{
              background: `${gradient[0]}20`,
              color: gradient[0],
              border: `1px solid ${gradient[0]}40`,
            }}
          >
            {pick.spec_chip}
          </span>
        </div>
        
        {/* Request Button */}
        <div className="px-3 pb-3 mt-auto">
          <button
            onClick={(e) => {
              e.stopPropagation();
              hapticFeedback.toggle();
              if (selectable) {
                onSelect?.(pick);
              } else {
                onRequest?.(pick);
              }
            }}
            className="w-full py-2.5 text-sm font-semibold text-white rounded-xl flex items-center justify-center gap-1.5 min-h-[42px] touch-manipulation"
            style={{
              background: `linear-gradient(135deg, ${gradient[0]} 0%, ${gradient[1]} 100%)`,
            }}
          >
            Request
          </button>
        </div>
      </motion.div>
      
      {/* Details Modal - Dark theme */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDetails(false)}
          >
            <motion.div
              className="rounded-2xl w-full max-w-sm max-h-[80vh] overflow-hidden shadow-2xl"
              style={{
                background: 'linear-gradient(180deg, #1F1F2E 0%, #16161D 100%)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
              }}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-4 border-b border-gray-700/50 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{
                      background: `linear-gradient(135deg, ${gradient[0]} 0%, ${gradient[1]} 100%)`,
                    }}
                  >
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{pick.name}</h3>
                    <p className="text-xs" style={{ color: gradient[0] }}>Handpicked for {petName}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetails(false)}
                  className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center hover:bg-gray-600"
                >
                  <X className="w-4 h-4 text-gray-300" />
                </button>
              </div>
              
              {/* Content */}
              <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(80vh - 140px)' }}>
                {/* What we will source */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-white mb-1">What we will source</h4>
                  <p className="text-sm text-gray-400">{pick.what_we_source}</p>
                </div>
                
                {/* Selection rules */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-white mb-2">Selection rules</h4>
                  <ul className="space-y-1.5">
                    {pick.selection_rules?.map((rule, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                        <Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: gradient[0] }} />
                        {rule}
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* Safety note */}
                {pick.safety_note && (
                  <div className="mb-4 p-3 rounded-xl" style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-amber-400">Safety note</p>
                        <p className="text-xs text-amber-300/80">{pick.safety_note}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* What we need from you */}
                {pick.questions?.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-white mb-2">What we'll ask you</h4>
                    <div className="space-y-2">
                      {pick.questions.map((q, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 bg-gray-800/50 rounded-lg">
                          <MessageSquarePlus className="w-4 h-4" style={{ color: gradient[0] }} />
                          <span className="text-sm text-gray-300">{q}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Footer */}
              <div className="p-4 border-t border-gray-700/50">
                <button
                  onClick={() => {
                    hapticFeedback.success();
                    onRequest?.(pick);
                    setShowDetails(false);
                  }}
                  className="w-full py-3 text-white font-semibold rounded-xl flex items-center justify-center gap-2"
                  style={{
                    background: `linear-gradient(135deg, ${gradient[0]} 0%, ${gradient[1]} 100%)`,
                  }}
                >
                  <Send className="w-4 h-4" />
                  Request This
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// "Anything Else?" Custom Request Box
const CustomRequestBox = ({ pet, onSubmit }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [request, setRequest] = useState('');
  
  const handleSubmit = () => {
    if (request.trim()) {
      hapticFeedback.success();
      onSubmit({ customRequest: request, pet });
      setRequest('');
      setIsExpanded(false);
    }
  };
  
  return (
    <motion.div
      className="mb-4 rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #F3E8FF 0%, #FCE7F3 50%, #FEF3C7 100%)',
        border: '1.5px solid rgba(139, 92, 246, 0.2)',
      }}
      layout
    >
      <button
        onClick={() => {
          hapticFeedback.buttonTap();
          setIsExpanded(!isExpanded);
        }}
        className="w-full p-4 flex items-center gap-3 text-left"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-md">
          <MessageSquarePlus className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-gray-800">Anything else?</h4>
          <p className="text-xs text-gray-600">Let our Concierge® know what you need</p>
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </button>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 pb-4 overflow-hidden"
          >
            <textarea
              value={request}
              onChange={(e) => setRequest(e.target.value)}
              placeholder={`E.g., "I need a dog walker who can handle reactive dogs" or "Looking for a birthday cake with no wheat"`}
              className="w-full p-3 rounded-xl border border-purple-200 text-sm resize-none h-24 focus:ring-2 focus:ring-purple-300 focus:border-purple-400 outline-none bg-white/80"
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => setIsExpanded(false)}
                className="flex-1 py-2.5 bg-white/60 text-gray-600 font-medium rounded-xl text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!request.trim()}
                className="flex-1 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                Send Request
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Tip Card Component
const TipCard = ({ tip, onSave }) => (
  <motion.div
    className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-4 border border-amber-100"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
  >
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
        <Lightbulb className="w-5 h-5 text-amber-600" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-gray-900 text-sm mb-1">{tip.title}</h4>
        <p className="text-xs text-gray-600 line-clamp-3">{tip.content || tip.summary}</p>
        {tip.action && (
          <button 
            className="mt-2 text-xs text-amber-600 font-medium flex items-center gap-1 min-h-[36px] touch-manipulation"
            onClick={() => hapticFeedback.buttonTap()}
          >
            {tip.action} <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  </motion.div>
);

// Tab Button Component with Haptic
const TabButton = ({ active, icon: Icon, label, count, onClick }) => (
  <button
    onClick={() => {
      hapticFeedback.toggle();
      onClick();
    }}
    className={`flex-1 py-3 px-3 rounded-xl flex items-center justify-center gap-2 transition-all min-h-[48px] touch-manipulation ${
      active 
        ? 'bg-gradient-to-r from-yellow-400 to-amber-400 text-white shadow-md' 
        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 active:bg-gray-300'
    }`}
  >
    <Icon className="w-4 h-4" />
    <span className="text-sm font-medium">{label}</span>
    {count > 0 && (
      <span className={`px-1.5 py-0.5 text-[10px] rounded-full ${
        active ? 'bg-white/30 text-white' : 'bg-gray-200 text-gray-600'
      }`}>
        {count}
      </span>
    )}
  </button>
);

// Pillar filter options - Services & Shop at end
const PILLAR_FILTERS = [
  { id: 'all', name: 'All', emoji: '✨' },
  { id: 'celebrate', name: 'Celebrate', emoji: '🎂' },
  { id: 'dine', name: 'Dine', emoji: '🍽️' },
  { id: 'stay', name: 'Stay', emoji: '🏨' },
  { id: 'travel', name: 'Travel', emoji: '✈️' },
  { id: 'care', name: 'Care', emoji: '🛁' },
  { id: 'enjoy', name: 'Enjoy', emoji: '🎉' },
  { id: 'fit', name: 'Fit', emoji: '🏋️' },
  { id: 'learn', name: 'Learn', emoji: '📚' },
  { id: 'advisory', name: 'Advisory', emoji: '💡' },
  { id: 'paperwork', name: 'Paperwork', emoji: '📋' },
  { id: 'shop', name: 'Shop', emoji: '🛒' },
];

// Main Unified Picks Vault Component
const UnifiedPicksVault = ({
  isOpen,
  onClose,
  // Conversation data
  conversationPicks = [],
  tipCard = null,
  userMessage = '',
  currentPillar = '',
  // ═══════════════════════════════════════════════════════════════════════════
  // PICKS CONTRACT (Bible Section 9.0) - Deterministic UI Logic
  // This is the source of truth for rendering. NOT advisory.
  // ═══════════════════════════════════════════════════════════════════════════
  picksContract = null,  // NEW: Full contract object from backend
  // Legacy fields (deprecated - use picksContract instead)
  conciergeArranges = [],
  conciergeFallback = false,
  conciergeFallbackReason = null,
  // Pet data
  pet = {},
  allPets = [],
  // Top picks data (fetched)
  topPicksData = null,
  // Actions
  onAddToPicks,
  onSendToConcierge,
  onSaveTip,
  onShowFullTopPicks,
  onQuickAction,
  onCreateConciergeTicket,
  token,
  user,
}) => {
  const [activeTab, setActiveTab] = useState('forPet');
  const [loading, setLoading] = useState(false);
  const [personalizedPicks, setPersonalizedPicks] = useState(null);
  const [selectedPillar, setSelectedPillar] = useState('all');
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // DETERMINISTIC RENDER LOGIC (Non-negotiable)
  // Read from picksContract as source of truth, fall back to legacy fields
  // ═══════════════════════════════════════════════════════════════════════════
  const fallbackMode = picksContract?.fallback_mode || (conciergeFallback ? 'concierge' : 'catalogue');
  const fallbackReason = picksContract?.fallback_reason || conciergeFallbackReason;
  const conciergeCards = picksContract?.concierge_cards || conciergeArranges || [];
  const clarifyingQuestions = picksContract?.clarifying_questions || [];
  const matchCount = picksContract?.match_count || 0;
  const topScore = picksContract?.top_score || 0;
  const blockedBySafety = picksContract?.blocked_by_safety || false;
  
  const season = getCurrentSeason();
  const birthdayNear = isPetBirthdayNear(pet);
  
  // Swipe to close
  const y = useMotionValue(0);
  const opacity = useTransform(y, [0, 200], [1, 0.5]);
  const dragControls = useDragControls();
  
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
  
  // Toggle item selection with haptic
  const toggleItemSelection = useCallback((pick) => {
    hapticFeedback.toggle();
    const pickId = pick.id || pick.name;
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(pickId)) {
        newSet.delete(pickId);
      } else {
        newSet.add(pickId);
      }
      return newSet;
    });
  }, []);
  
  // Clear selection
  const clearSelection = useCallback(() => {
    hapticFeedback.buttonTap();
    setSelectedItems(new Set());
    setSelectionMode(false);
  }, []);
  
  // Select all visible picks
  const selectAll = useCallback(() => {
    hapticFeedback.toggle();
    const allPickIds = new Set();
    Object.values(personalizedPicks?.pillars || {}).forEach(pillarData => {
      if (selectedPillar === 'all' || pillarData.pillar?.id === selectedPillar) {
        pillarData.picks?.forEach(pick => {
          allPickIds.add(pick.id || pick.name);
        });
      }
    });
    setSelectedItems(allPickIds);
  }, [personalizedPicks, selectedPillar]);
  
  // Get all picks as flat array
  const getAllPicksFlat = useCallback(() => {
    if (!personalizedPicks?.pillars) return [];
    const allPicks = [];
    Object.values(personalizedPicks.pillars).forEach(pillarData => {
      if (pillarData.picks) {
        allPicks.push(...pillarData.picks);
      }
    });
    return allPicks;
  }, [personalizedPicks]);
  
  // Get selected picks objects
  const getSelectedPickObjects = useCallback(() => {
    const allPicks = getAllPicksFlat();
    return allPicks.filter(p => selectedItems.has(p.id || p.name));
  }, [getAllPicksFlat, selectedItems]);
  
  // Enhance picks with badges
  const enhancePicksWithBadges = useCallback((picks, purchaseHistory = []) => {
    return picks.map(pick => {
      const badges = pick.badges || [];
      
      if (pick.score && pick.score > 70 && !badges.includes('trending')) badges.push('trending');
      
      if (pick.created_at) {
        const daysSinceCreated = (Date.now() - new Date(pick.created_at)) / (1000 * 60 * 60 * 24);
        if (daysSinceCreated < 30 && !badges.includes('new')) badges.push('new');
      }
      
      if (purchaseHistory.includes(pick.id) && !badges.includes('reorder')) badges.push('reorder');
      
      if (birthdayNear && (pick.category?.includes('celebrate') || pick.category?.includes('birthday'))) {
        if (!badges.includes('birthday')) badges.push('birthday');
      }
      
      if (season?.event) {
        const seasonalCategories = {
          monsoon: ['raincoat', 'paw-care', 'umbrella'],
          diwali: ['calming', 'safety', 'festive'],
          christmas: ['gift', 'hamper', 'festive'],
          valentine: ['treat', 'gift', 'bandana'],
          summer: ['cooling', 'hydration', 'pool'],
        };
        if (seasonalCategories[season.event]?.some(cat => 
          pick.category?.toLowerCase().includes(cat) || pick.name?.toLowerCase().includes(cat)
        )) {
          if (!badges.includes('seasonal')) badges.push('seasonal');
        }
      }
      
      return { ...pick, badges };
    });
  }, [birthdayNear, season]);
  
  // Fetch personalized picks
  const fetchPersonalizedPicks = useCallback(async (showRefresh = false) => {
    if (!pet?.name && !pet?.id) return;
    
    if (showRefresh) {
      setIsRefreshing(true);
      hapticFeedback.scroll();
    } else {
      setLoading(true);
    }
    
    try {
      const petId = pet.id || pet.name;
      const response = await fetch(`${API_URL}/api/mira/top-picks/${encodeURIComponent(petId)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      
      if (response.ok) {
        const data = await response.json();
        setPersonalizedPicks(data);
        if (showRefresh) {
          hapticFeedback.success();
        }
      }
    } catch (err) {
      console.error('[UNIFIED VAULT] Failed to fetch picks:', err);
      hapticFeedback.error();
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [pet, token]);
  
  // Fetch on open or pet change
  useEffect(() => {
    if (isOpen && activeTab === 'forPet') {
      fetchPersonalizedPicks();
    }
  }, [isOpen, activeTab, pet?.id, pet?.name, fetchPersonalizedPicks]);
  
  // Reset when pet changes
  useEffect(() => {
    setPersonalizedPicks(null);
    setSelectedItems(new Set());
    setSelectionMode(false);
    setSelectedPillar('all');
  }, [pet?.id, pet?.name]);
  
  const enhancedConversationPicks = enhancePicksWithBadges(conversationPicks);
  const relevantPillarPicks = personalizedPicks?.pillars?.[currentPillar?.toLowerCase()]?.picks || [];
  
  if (!isOpen) return null;
  
  const conversationCount = enhancedConversationPicks.length;
  const tipsCount = tipCard ? 1 : 0;
  const forPetCount = personalizedPicks?.total_picks || 0;
  
  // Handle drag end for swipe-to-close
  const handleDragEnd = (_, info) => {
    if (info.offset.y > 100 || info.velocity.y > 500) {
      hapticFeedback.trayClose();
      onClose();
    }
  };
  
  // Handle quick action
  const handleQuickAction = (actionId, pick) => {
    if (onQuickAction) {
      onQuickAction(actionId, pick);
    } else {
      console.log('[QUICK ACTION]', actionId, pick.name);
    }
  };
  
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
          className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl overflow-hidden"
          style={{ 
            y, 
            opacity,
            maxHeight: '85vh',
            paddingBottom: 'env(safe-area-inset-bottom, 20px)'
          }}
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          drag="y"
          dragControls={dragControls}
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0, bottom: 0.5 }}
          onDragEnd={handleDragEnd}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drag Handle */}
          <div 
            className="sticky top-0 bg-white z-20 pt-3 pb-1 cursor-grab active:cursor-grabbing touch-manipulation"
            onPointerDown={(e) => dragControls.start(e)}
          >
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto" />
          </div>
          
          {/* Header */}
          <div className="sticky top-6 bg-white z-10 px-4 pb-3 border-b border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg">
                  <Gift className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Mira's Picks
                  </h2>
                  <p className="text-xs text-gray-500">
                    for {pet?.name || 'Your Pet'}
                  </p>
                </div>
              </div>
              
              {/* Close button - 44px touch target */}
              <button
                onClick={() => {
                  hapticFeedback.modalClose();
                  onClose();
                }}
                className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center touch-manipulation active:bg-gray-200"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            
            {/* Birthday Alert */}
            {birthdayNear && (
              <motion.div 
                className="mb-3 px-3 py-2.5 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl flex items-center gap-2 border border-pink-100"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              >
                <motion.div
                  animate={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 2, repeatDelay: 1 }}
                >
                  <Gift className="w-5 h-5 text-pink-500" />
                </motion.div>
                <span className="text-xs text-pink-700 font-medium">
                  🎂 {pet?.name}'s birthday is coming up! Check out celebration picks.
                </span>
              </motion.div>
            )}
            
            {/* Tabs */}
            <div className="flex gap-2">
              <TabButton
                active={activeTab === 'conversation'}
                icon={Gift}
                label="In Chat"
                count={conversationCount}
                onClick={() => setActiveTab('conversation')}
              />
              <TabButton
                active={activeTab === 'tips'}
                icon={Lightbulb}
                label="Tips"
                count={tipsCount}
                onClick={() => setActiveTab('tips')}
              />
              <TabButton
                active={activeTab === 'forPet'}
                icon={Sparkles}
                label={`For ${pet?.name?.split(' ')[0] || 'Pet'}`}
                count={forPetCount}
                onClick={() => setActiveTab('forPet')}
              />
            </div>
          </div>
          
          {/* Content */}
          <div 
            className="overflow-y-auto px-4 py-4 overscroll-contain"
            style={{ 
              maxHeight: 'calc(85vh - 280px)',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            <AnimatePresence mode="wait">
              {/* Conversation Tab */}
              {activeTab === 'conversation' && (
                <motion.div
                  key="conversation"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                >
                  {userMessage && (
                    <p className="text-xs text-gray-500 mb-3">
                      Based on: <span className="italic">"{userMessage.slice(0, 50)}..."</span>
                    </p>
                  )}
                  
                  {/* ═══════════════════════════════════════════════════════════════════════════
                      PICKS CONTRACT - DETERMINISTIC UI LOGIC (Non-negotiable)
                      
                      If fallback_mode === "catalogue" → render catalogue products only
                      If fallback_mode === "concierge" → render ONLY concierge_cards, NO products
                      If fallback_mode === "clarify" → render clarifying_questions, block all else
                      
                      NEVER show generic/popular products when mode !== "catalogue"
                      ═══════════════════════════════════════════════════════════════════════════ */}
                  {fallbackMode === 'clarify' && clarifyingQuestions.length > 0 ? (
                    // CLARIFY MODE: Block rendering until questions answered
                    <div className="space-y-4">
                      <div className="text-center py-4 px-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-100">
                        <HelpCircle className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                        <h3 className="text-sm font-semibold text-gray-800">
                          Quick question for {pet?.name}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          Help me find the perfect match
                        </p>
                      </div>
                      <div className="space-y-2">
                        {clarifyingQuestions.map((q, i) => (
                          <button
                            key={q.id || i}
                            className="w-full p-3 text-left bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                            onClick={() => {
                              hapticFeedback.buttonTap();
                              // Handle clarifying question response
                            }}
                          >
                            <p className="text-sm text-gray-700">{q.question}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : fallbackMode === 'concierge' && conciergeCards.length > 0 ? (
                    // CONCIERGE MODE: Render ONLY concierge cards, NO generic products
                    <div className="space-y-4">
                      <div className="text-center py-4 px-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                        <Sparkles className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                        <h3 className="text-sm font-semibold text-gray-800">
                          Not in the catalogue. We'll arrange this for {pet?.name}.
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          Opens a request in Services.
                        </p>
                        {fallbackReason && (
                          <p className="text-[10px] text-gray-400 mt-1">
                            {fallbackReason === 'bespoke_intent' && 'Specialist request detected'}
                            {fallbackReason === 'no_match' && 'Not in catalogue yet'}
                            {fallbackReason === 'low_confidence' && 'Best handled by concierge'}
                            {fallbackReason === 'blocked_by_safety' && 'Safety-filtered, concierge will source safe options'}
                          </p>
                        )}
                      </div>
                      
                      {/* Concierge® Arrange Cards */}
                      <div className="space-y-3">
                        {conciergeCards.map((arrange, i) => (
                          <ConciergeArrangeCard
                            key={arrange.id || i}
                            arrange={arrange}
                            pet={pet}
                            onCreateTicket={onCreateConciergeTicket}
                            token={token}
                            user={user}
                          />
                        ))}
                      </div>
                      
                      {/* No price semantics note */}
                      <p className="text-xs text-gray-400 text-center">
                        "Catalogue is optional; concierge is guaranteed."
                      </p>
                    </div>
                  ) : enhancedConversationPicks.length > 0 ? (
                    // CATALOGUE MODE: Normal product rendering
                    <div 
                      className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory"
                      style={{ WebkitOverflowScrolling: 'touch' }}
                    >
                      {enhancedConversationPicks.map((pick, i) => {
                        const pickId = pick.id || pick.name;
                        const isConcierge = pick.pick_type === 'concierge';
                        
                        return (
                          <div key={pickId || i} className="snap-start">
                            {isConcierge ? (
                              <ConciergeCard
                                pick={pick}
                                pet={pet}
                                isSelected={selectedItems.has(pickId)}
                                onSelect={() => toggleItemSelection(pick)}
                                onRequest={(p) => toggleItemSelection(p)}
                              />
                            ) : (
                              <ExpandablePickCard
                                pick={pick}
                                pet={pet}
                                onAdd={onAddToPicks}
                                onSendToConcierge={onSendToConcierge}
                                isSelected={selectedItems.has(pickId)}
                                onToggleSelect={() => toggleItemSelection(pick)}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Gift className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">No picks from this conversation yet</p>
                      <p className="text-gray-400 text-xs mt-1">Ask Mira about products or services!</p>
                    </div>
                  )}
                  
                  {/* Pillar-relevant picks */}
                  {relevantPillarPicks.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        More {currentPillar} picks for {pet?.name}
                      </h3>
                      <div 
                        className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory"
                        style={{ WebkitOverflowScrolling: 'touch' }}
                      >
                        {relevantPillarPicks.slice(0, 4).map((pick, i) => {
                          const pickId = pick.id || pick.name;
                          const isConcierge = pick.pick_type === 'concierge';
                          
                          return (
                            <div key={pickId || i} className="snap-start">
                              {isConcierge ? (
                                <ConciergeCard
                                  pick={enhancePicksWithBadges([pick])[0]}
                                  pet={pet}
                                  isSelected={selectedItems.has(pickId)}
                                  onSelect={() => toggleItemSelection(pick)}
                                  onRequest={(p) => toggleItemSelection(p)}
                                />
                              ) : (
                                <ExpandablePickCard
                                  pick={enhancePicksWithBadges([pick])[0]}
                                  pet={pet}
                                  onAdd={onAddToPicks}
                                  onSendToConcierge={onSendToConcierge}
                                  isSelected={selectedItems.has(pickId)}
                                  onToggleSelect={() => toggleItemSelection(pick)}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
              
              {/* Tips Tab */}
              {activeTab === 'tips' && (
                <motion.div
                  key="tips"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                >
                  {tipCard ? (
                    <div className="space-y-4">
                      <TipCard tip={tipCard} onSave={onSaveTip} />
                      
                      <button
                        onClick={() => {
                          hapticFeedback.success();
                          onSaveTip?.(tipCard);
                        }}
                        className="w-full py-3 text-sm font-medium text-amber-600 bg-amber-50 rounded-xl flex items-center justify-center gap-2 hover:bg-amber-100 active:bg-amber-200 min-h-[48px] touch-manipulation"
                      >
                        <Heart className="w-4 h-4" />
                        Save to {pet?.name}'s Profile
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Lightbulb className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">No tips from this conversation</p>
                      <p className="text-gray-400 text-xs mt-1">Ask Mira for advice about {pet?.name}!</p>
                    </div>
                  )}
                </motion.div>
              )}
              
              {/* For Pet Tab */}
              {activeTab === 'forPet' && (
                <motion.div
                  key="forPet"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                >
                  {loading ? (
                    <div className="space-y-4">
                      {/* Skeleton Loading */}
                      <div className="flex gap-2 flex-wrap">
                        <div className="w-20 h-6 bg-gray-200 rounded-full animate-pulse" />
                        <div className="w-16 h-6 bg-gray-200 rounded-full animate-pulse" />
                      </div>
                      <div className="bg-gray-50 rounded-xl p-2">
                        <div className="flex gap-2 overflow-hidden">
                          {[1,2,3,4,5].map(i => (
                            <div key={i} className="w-16 h-8 bg-gray-200 rounded-lg animate-pulse flex-shrink-0" />
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-3 overflow-hidden">
                        {[1,2,3].map(i => <SkeletonCard key={i} />)}
                      </div>
                    </div>
                  ) : personalizedPicks ? (
                    <div className="space-y-4">
                      {/* Personalization Header - Mira's brain, Concierge®'s hands */}
                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                            <Sparkles className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800">
                              Curated specially for {pet?.name} by Mira
                            </p>
                            <p className="text-xs text-gray-600 mt-0.5">
                              {pet?.breed} • {personalizedPicks.pet?.size || 'Medium'} 
                              {personalizedPicks.filters_applied?.allergies?.length > 0 && 
                                ` • Avoiding ${personalizedPicks.filters_applied.allergies.join(', ')}`}
                            </p>
                            <p className="text-[11px] text-purple-600 mt-1">
                              Just pick what you like — Concierge® handles the rest ✨
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Selection Summary Panel - Shows when items are selected */}
                      {selectedItems.size > 0 && (
                        <motion.div 
                          className="bg-amber-50 rounded-xl p-3 border border-amber-200"
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-amber-800">
                              Your selections ({selectedItems.size})
                            </span>
                            <button
                              onClick={clearSelection}
                              className="text-xs text-amber-600 hover:text-amber-700"
                            >
                              Clear all
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {getSelectedPickObjects().slice(0, 5).map((pick, i) => (
                              <span 
                                key={i}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded-lg text-xs text-gray-700 border border-amber-200"
                              >
                                {pick.name?.slice(0, 20)}{pick.name?.length > 20 ? '...' : ''}
                                <button
                                  onClick={() => toggleItemSelection(pick)}
                                  className="text-amber-500 hover:text-amber-700"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                            {selectedItems.size > 5 && (
                              <span className="px-2 py-1 text-xs text-amber-600">
                                +{selectedItems.size - 5} more
                              </span>
                            )}
                          </div>
                        </motion.div>
                      )}
                      
                      {/* Category/Pillar Picker Tabs */}
                      <div 
                        className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 snap-x"
                        style={{ WebkitOverflowScrolling: 'touch' }}
                      >
                        {PILLAR_FILTERS.map((pillar) => (
                          <button
                            key={pillar.id}
                            onClick={() => {
                              hapticFeedback.buttonTap();
                              setSelectedPillar(pillar.id);
                            }}
                            className={`flex-shrink-0 px-4 py-2.5 rounded-full text-xs font-medium transition-all min-h-[40px] touch-manipulation snap-start ${
                              selectedPillar === pillar.id
                                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 active:bg-gray-300'
                            }`}
                          >
                            <span className="mr-1.5">{pillar.emoji}</span>
                            {pillar.name}
                          </button>
                        ))}
                      </div>
                      
                      {/* "Anything else?" Custom Request Box */}
                      <CustomRequestBox 
                        pet={pet} 
                        onSubmit={(data) => {
                          onSendToConcierge?.({ type: 'custom_request', ...data });
                        }} 
                      />
                      
                      {/* Pillar sections - Catalogue + Concierge® */}
                      {Object.entries(personalizedPicks.pillars || {})
                        .filter(([pillarId]) => selectedPillar === 'all' || pillarId === selectedPillar)
                        .map(([pillarId, data]) => {
                          const cataloguePicks = data.picks?.filter(p => p.pick_type !== 'concierge') || [];
                          const conciergePicks = data.picks?.filter(p => p.pick_type === 'concierge') || [];
                          
                          return (
                            <div key={pillarId} className="mb-6">
                              {/* Pillar Header - NO counts */}
                              <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                <span className="text-xl">{data.pillar?.emoji}</span>
                                {data.pillar?.name}
                              </h3>
                              
                              {/* Catalogue Products - Expandable */}
                              {cataloguePicks.length > 0 && (
                                <div className="mb-4">
                                  <p className="text-xs text-purple-600 mb-2 flex items-center gap-1 font-medium">
                                    <ShoppingBag className="w-3 h-3" /> From our catalogue
                                  </p>
                                  <div 
                                    className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory"
                                    style={{ WebkitOverflowScrolling: 'touch' }}
                                  >
                                    {cataloguePicks.map((pick, i) => {
                                      const pickId = pick.id || pick.name;
                                      return (
                                        <div key={pickId || i} className="snap-start">
                                          <ExpandablePickCard
                                            pick={enhancePicksWithBadges([pick])[0]}
                                            pet={pet}
                                            onAdd={onAddToPicks}
                                            onSendToConcierge={onSendToConcierge}
                                            isSelected={selectedItems.has(pickId)}
                                            onToggleSelect={() => toggleItemSelection(pick)}
                                          />
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                              
                              {/* Concierge® Services - Beautiful Cards */}
                              {conciergePicks.length > 0 && (
                                <div>
                                  <p className="text-xs text-purple-600 mb-2 flex items-center gap-1 font-medium">
                                    <Sparkles className="w-3 h-3" /> Concierge® can source for you
                                  </p>
                                  <div 
                                    className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory"
                                    style={{ WebkitOverflowScrolling: 'touch' }}
                                  >
                                    {conciergePicks.map((pick, i) => {
                                      const pickId = pick.id || pick.name;
                                      return (
                                        <div key={pickId || i} className="snap-start">
                                          <ConciergeCard
                                            pick={pick}
                                            pet={pet}
                                            selectable={selectionMode}
                                            isSelected={selectedItems.has(pickId)}
                                            onSelect={toggleItemSelection}
                                            onRequest={(p) => {
                                              // Add to selection and optionally open confirmation
                                              toggleItemSelection(p);
                                            }}
                                          />
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      
                      {/* Empty state for filtered view */}
                      {selectedPillar !== 'all' && 
                       !personalizedPicks.pillars?.[selectedPillar]?.picks?.length && (
                        <div className="text-center py-6">
                          <Package className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                          <p className="text-gray-500 text-sm">No picks in this category yet</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Sparkles className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">Couldn't load personalized picks</p>
                      <button
                        onClick={() => fetchPersonalizedPicks()}
                        className="mt-3 px-4 py-2.5 bg-amber-100 text-amber-700 rounded-lg text-sm min-h-[44px] touch-manipulation"
                      >
                        Try again
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Footer CTA with safe area */}
          <div 
            className="sticky bottom-0 bg-white border-t border-gray-100 px-4 py-3"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 12px)' }}
          >
            {selectedItems.size > 0 ? (
              <button
                onClick={() => {
                  hapticFeedback.toggle();
                  setShowConfirmation(true);
                }}
                className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-xl flex items-center justify-center gap-2 min-h-[52px] touch-manipulation active:opacity-90 shadow-lg"
              >
                <Send className="w-5 h-5" />
                Send {selectedItems.size} to Concierge®
              </button>
            ) : (
              <div className="text-center py-1">
                <p className="text-sm text-gray-600">
                  Tap items to select • Concierge® handles the rest ✨
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
      
      {/* Concierge® Confirmation Modal */}
      <ConciergeConfirmationModal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        selectedPicks={getSelectedPickObjects()}
        pet={pet}
        onConfirm={(data) => {
          onSendToConcierge?.(data);
          clearSelection();
        }}
        onEdit={() => {
          // Keep selection mode active for editing
        }}
      />
    </AnimatePresence>
  );
};

export default UnifiedPicksVault;

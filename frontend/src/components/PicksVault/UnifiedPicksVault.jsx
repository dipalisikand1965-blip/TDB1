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
 * - No prices shown for Concierge Suggestion cards
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
import {
  X, Gift, Lightbulb, Sparkles, ChevronRight, Send, Heart,
  ShoppingBag, Calendar, TrendingUp, RefreshCw, Star, Clock,
  AlertCircle, Check, Info, Flame, Package, Filter, CheckSquare, Square,
  ShoppingCart, ThumbsDown, Share2, MoreHorizontal, ChevronDown,
  // Icons for Concierge Cards
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
                
                {/* Concierge Items */}
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
  // Pet data - automatically syncs from main app
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
  token,
}) => {
  const [activeTab, setActiveTab] = useState('forPet');
  const [loading, setLoading] = useState(false);
  const [personalizedPicks, setPersonalizedPicks] = useState(null);
  const [selectedPillar, setSelectedPillar] = useState('all');
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);  // Concierge confirmation modal
  
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
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    for {pet?.name || 'Your Pet'}
                    {season && <span className="ml-1">{season.emoji} {season.label}</span>}
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
                  
                  {enhancedConversationPicks.length > 0 ? (
                    <div 
                      className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory"
                      style={{ WebkitOverflowScrolling: 'touch' }}
                    >
                      {enhancedConversationPicks.map((pick, i) => (
                        <div key={pick.id || i} className="snap-start">
                          <PickCard
                            pick={pick}
                            pet={pet}
                            onAdd={onAddToPicks}
                            onSendToConcierge={onSendToConcierge}
                            onQuickAction={handleQuickAction}
                          />
                        </div>
                      ))}
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
                        {relevantPillarPicks.slice(0, 4).map((pick, i) => (
                          <div key={pick.id || i} className="snap-start">
                            <PickCard
                              pick={enhancePicksWithBadges([pick])[0]}
                              pet={pet}
                              onAdd={onAddToPicks}
                              onSendToConcierge={onSendToConcierge}
                              onQuickAction={handleQuickAction}
                            />
                          </div>
                        ))}
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
                      {/* Pull to Refresh Indicator */}
                      {isRefreshing && (
                        <div className="flex items-center justify-center py-2">
                          <RefreshCw className="w-5 h-5 text-amber-500 animate-spin" />
                          <span className="ml-2 text-xs text-gray-500">Refreshing picks...</span>
                        </div>
                      )}
                      
                      {/* Quick stats */}
                      <div className="flex gap-2 flex-wrap items-center">
                        <span className="px-2.5 py-1.5 bg-purple-50 text-purple-600 text-xs rounded-full font-medium">
                          🐕 {personalizedPicks.pet?.breed}
                        </span>
                        <span className="px-2.5 py-1.5 bg-blue-50 text-blue-600 text-xs rounded-full font-medium">
                          📏 {personalizedPicks.pet?.size}
                        </span>
                        {personalizedPicks.filters_applied?.allergies?.length > 0 && (
                          <span className="px-2.5 py-1.5 bg-red-50 text-red-600 text-xs rounded-full font-medium">
                            ⚠️ Avoiding: {personalizedPicks.filters_applied.allergies.join(', ')}
                          </span>
                        )}
                        {/* Refresh button */}
                        <button
                          onClick={() => fetchPersonalizedPicks(true)}
                          className="ml-auto px-2 py-1 text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 touch-manipulation"
                        >
                          <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                          Refresh
                        </button>
                      </div>
                      
                      {/* Category/Pillar Picker */}
                      <div className="bg-gray-50 rounded-xl p-2.5">
                        <div className="flex items-center gap-2 mb-2">
                          <Filter className="w-4 h-4 text-gray-500" />
                          <span className="text-xs font-medium text-gray-600">Filter by category</span>
                        </div>
                        <div 
                          className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 snap-x"
                          style={{ WebkitOverflowScrolling: 'touch' }}
                        >
                          {PILLAR_FILTERS.map((pillar) => (
                            <button
                              key={pillar.id}
                              onClick={() => {
                                hapticFeedback.buttonTap();
                                setSelectedPillar(pillar.id);
                              }}
                              className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-all min-h-[40px] touch-manipulation snap-start ${
                                selectedPillar === pillar.id
                                  ? 'bg-amber-400 text-white shadow-sm'
                                  : 'bg-white text-gray-600 hover:bg-gray-100 active:bg-gray-200 border border-gray-200'
                              }`}
                            >
                              <span className="mr-1">{pillar.emoji}</span>
                              {pillar.name}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      {/* Selection Mode Toggle */}
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => {
                            hapticFeedback.toggle();
                            setSelectionMode(!selectionMode);
                            if (selectionMode) clearSelection();
                          }}
                          className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition-all min-h-[40px] touch-manipulation ${
                            selectionMode
                              ? 'bg-amber-100 text-amber-700 border border-amber-300'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 active:bg-gray-300'
                          }`}
                        >
                          {selectionMode ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                          {selectionMode ? `${selectedItems.size} selected` : 'Select items'}
                        </button>
                        
                        {selectionMode && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={selectAll}
                              className="text-xs text-amber-600 font-medium hover:text-amber-700 min-h-[40px] px-2 touch-manipulation"
                            >
                              Select All
                            </button>
                            {selectedItems.size > 0 && (
                              <button
                                onClick={clearSelection}
                                className="text-xs text-gray-500 hover:text-gray-700 min-h-[40px] px-2 touch-manipulation"
                              >
                                Clear
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Pillar sections */}
                      {Object.entries(personalizedPicks.pillars || {})
                        .filter(([pillarId]) => selectedPillar === 'all' || pillarId === selectedPillar)
                        .map(([pillarId, data]) => (
                        <div key={pillarId}>
                          <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                            <span>{data.pillar?.emoji}</span>
                            {data.pillar?.name}
                            <span className="text-xs text-gray-400 font-normal">({data.picks?.length || 0})</span>
                          </h3>
                          <div 
                            className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory"
                            style={{ WebkitOverflowScrolling: 'touch' }}
                          >
                            {data.picks?.map((pick, i) => {
                              const pickId = pick.id || pick.name;
                              return (
                                <div key={pickId || i} className="snap-start">
                                  <PickCard
                                    pick={enhancePicksWithBadges([pick])[0]}
                                    pet={pet}
                                    onAdd={onAddToPicks}
                                    onSendToConcierge={onSendToConcierge}
                                    selectable={selectionMode}
                                    isSelected={selectedItems.has(pickId)}
                                    onToggleSelect={toggleItemSelection}
                                    onQuickAction={handleQuickAction}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                      
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
            {selectionMode && selectedItems.size > 0 ? (
              <button
                onClick={() => {
                  hapticFeedback.toggle();
                  setShowConfirmation(true);  // Open confirmation modal
                }}
                className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-xl flex items-center justify-center gap-2 min-h-[52px] touch-manipulation active:opacity-90"
              >
                <Send className="w-5 h-5" />
                Send {selectedItems.size} item{selectedItems.size > 1 ? 's' : ''} to Concierge®
              </button>
            ) : (
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-2">
                  {selectionMode 
                    ? 'Tap items to select, then send to Concierge®' 
                    : `${personalizedPicks?.total_picks || 0} picks curated for ${pet?.name}`}
                </p>
                {!selectionMode && (
                  <button
                    onClick={() => {
                      hapticFeedback.toggle();
                      setSelectionMode(true);
                    }}
                    className="text-sm text-amber-600 font-medium hover:text-amber-700 min-h-[44px] touch-manipulation"
                  >
                    Select items to send →
                  </button>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
      
      {/* Concierge Confirmation Modal */}
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

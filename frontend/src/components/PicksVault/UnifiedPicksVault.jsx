/**
 * UnifiedPicksVault.jsx
 * 
 * Unified "Mira's Picks" vault with smart tabs:
 * - 🎁 Conversation: Subject-relevant picks from current chat
 * - 💡 Tips: Advice and tips from conversation
 * - ✨ For [Pet]: Quick access to personalized top picks
 * 
 * Features:
 * - Smart badges (Trending, New, Reorder, Birthday Soon)
 * - Seasonal boosts (Diwali, Christmas, Monsoon, etc.)
 * - Haptic feedback on interactions
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Gift, Lightbulb, Sparkles, ChevronRight, Send, Heart,
  ShoppingBag, Calendar, TrendingUp, RefreshCw, Star, Clock,
  AlertCircle, Check, Info, Flame, Package
} from 'lucide-react';
import { API_URL } from '../../utils/api';
import hapticFeedback from '../../utils/haptic';

// Smart badge configurations
const SMART_BADGES = {
  trending: { icon: Flame, label: 'Trending', color: 'bg-orange-100 text-orange-600', bgColor: '#FED7AA' },
  new: { icon: Sparkles, label: 'New', color: 'bg-blue-100 text-blue-600', bgColor: '#BFDBFE' },
  reorder: { icon: RefreshCw, label: 'Reorder', color: 'bg-green-100 text-green-600', bgColor: '#BBF7D0' },
  birthday: { icon: Gift, label: 'Birthday Soon!', color: 'bg-pink-100 text-pink-600', bgColor: '#FBCFE8' },
  seasonal: { icon: Star, label: 'Seasonal', color: 'bg-purple-100 text-purple-600', bgColor: '#DDD6FE' },
};

// Get current season/event
const getCurrentSeason = () => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  
  // Check for specific events
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
  
  return daysUntil >= -7 && daysUntil <= 14; // 1 week after to 2 weeks before
};

// Pick Card with Smart Badges
const PickCard = ({ pick, pet, onAdd, onSendToConcierge }) => {
  const [showInfo, setShowInfo] = useState(false);
  const isConcierge = pick.pick_type === 'concierge';
  const badges = pick.badges || [];
  
  return (
    <motion.div
      className={`relative flex-shrink-0 w-36 rounded-xl overflow-hidden shadow-sm ${
        isConcierge 
          ? 'bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-dashed border-purple-200' 
          : 'bg-white border border-gray-100'
      }`}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => hapticFeedback.light()}
    >
      {/* Image */}
      <div className="relative h-24 bg-gray-50">
        {pick.image ? (
          <img src={pick.image} alt={pick.name} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {isConcierge ? (
              <Sparkles className="w-8 h-8 text-purple-300" />
            ) : (
              <Package className="w-8 h-8 text-gray-200" />
            )}
          </div>
        )}
        
        {/* Smart Badges */}
        <div className="absolute top-1 left-1 flex flex-wrap gap-1">
          {badges.map((badge, i) => {
            const config = SMART_BADGES[badge];
            if (!config) return null;
            const Icon = config.icon;
            return (
              <span 
                key={i}
                className={`px-1.5 py-0.5 text-[9px] font-medium rounded-full flex items-center gap-0.5 ${config.color}`}
              >
                <Icon className="w-2.5 h-2.5" />
                {config.label}
              </span>
            );
          })}
        </div>
        
        {/* Info button */}
        <button
          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-white/80 flex items-center justify-center"
          onClick={(e) => { e.stopPropagation(); setShowInfo(!showInfo); }}
        >
          <Info className="w-3 h-3 text-gray-500" />
        </button>
        
        {/* Why tooltip */}
        {showInfo && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-7 right-1 left-1 bg-gray-900 text-white text-[10px] p-2 rounded-lg z-10"
          >
            {pick.why_reason || `Perfect for ${pet?.name || 'your pet'}`}
          </motion.div>
        )}
        
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
        {pick.price ? (
          <p className="text-xs font-semibold text-pink-600">₹{pick.price}</p>
        ) : (
          <p className="text-[10px] text-purple-500 italic">Concierge sourced</p>
        )}
      </div>
      
      {/* Add button */}
      <div className="px-2 pb-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            hapticFeedback.medium();
            isConcierge ? onSendToConcierge?.(pick) : onAdd?.(pick);
          }}
          className={`w-full py-1 text-[10px] font-medium rounded-lg flex items-center justify-center gap-1 ${
            isConcierge 
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
              : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
          }`}
        >
          {isConcierge ? 'Request' : <><Gift className="w-3 h-3" /> Add</>}
        </button>
      </div>
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
          <button className="mt-2 text-xs text-amber-600 font-medium flex items-center gap-1">
            {tip.action} <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  </motion.div>
);

// Tab Button Component
const TabButton = ({ active, icon: Icon, label, count, onClick }) => (
  <button
    onClick={onClick}
    className={`flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
      active 
        ? 'bg-gradient-to-r from-yellow-400 to-amber-400 text-white shadow-md' 
        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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

// Main Unified Picks Vault Component
const UnifiedPicksVault = ({
  isOpen,
  onClose,
  // Conversation data
  conversationPicks = [],
  tipCard = null,
  userMessage = '',
  currentPillar = '',
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
  token,
}) => {
  const [activeTab, setActiveTab] = useState('conversation');
  const [loading, setLoading] = useState(false);
  const [personalizedPicks, setPersonalizedPicks] = useState(null);
  
  const season = getCurrentSeason();
  const birthdayNear = isPetBirthdayNear(pet);
  
  // Add smart badges to picks
  const enhancePicksWithBadges = useCallback((picks, purchaseHistory = []) => {
    return picks.map(pick => {
      const badges = [];
      
      // Check if trending (mock - would come from analytics)
      if (pick.score && pick.score > 70) badges.push('trending');
      
      // Check if new (added in last 30 days)
      if (pick.created_at) {
        const daysSinceCreated = (Date.now() - new Date(pick.created_at)) / (1000 * 60 * 60 * 24);
        if (daysSinceCreated < 30) badges.push('new');
      }
      
      // Check if previously purchased
      if (purchaseHistory.includes(pick.id)) badges.push('reorder');
      
      // Check if birthday-relevant
      if (birthdayNear && (pick.category?.includes('celebrate') || pick.category?.includes('birthday'))) {
        badges.push('birthday');
      }
      
      // Check if seasonally relevant
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
          badges.push('seasonal');
        }
      }
      
      return { ...pick, badges };
    });
  }, [birthdayNear, season]);
  
  // Fetch personalized picks for "For [Pet]" tab
  const fetchPersonalizedPicks = useCallback(async () => {
    if (!pet?.name && !pet?.id) return;
    
    setLoading(true);
    try {
      const petId = pet.id || pet.name;
      const response = await fetch(`${API_URL}/api/mira/top-picks/${encodeURIComponent(petId)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      
      if (response.ok) {
        const data = await response.json();
        setPersonalizedPicks(data);
      }
    } catch (err) {
      console.error('[UNIFIED VAULT] Failed to fetch picks:', err);
    } finally {
      setLoading(false);
    }
  }, [pet, token]);
  
  // Fetch on tab change to "For Pet"
  useEffect(() => {
    if (isOpen && activeTab === 'forPet' && !personalizedPicks) {
      fetchPersonalizedPicks();
    }
  }, [isOpen, activeTab, personalizedPicks, fetchPersonalizedPicks]);
  
  // Enhanced picks with badges
  const enhancedConversationPicks = enhancePicksWithBadges(conversationPicks);
  
  // Get relevant pillar picks from personalized data
  const relevantPillarPicks = personalizedPicks?.pillars?.[currentPillar?.toLowerCase()]?.picks || [];
  
  if (!isOpen) return null;
  
  const conversationCount = enhancedConversationPicks.length;
  const tipsCount = tipCard ? 1 : 0;
  const forPetCount = personalizedPicks?.total_picks || 0;
  
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="absolute bottom-0 left-0 right-0 max-h-[80vh] bg-white rounded-t-3xl overflow-hidden"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white z-10 px-4 pt-3 pb-2 border-b border-gray-100">
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-3" />
            
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 flex items-center justify-center">
                  <Gift className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Mira's Picks
                  </h2>
                  <p className="text-xs text-gray-500">
                    for {pet?.name || 'Your Pet'}
                    {season && <span className="ml-1">{season.emoji} {season.label}</span>}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            
            {/* Birthday Alert */}
            {birthdayNear && (
              <div className="mb-3 px-3 py-2 bg-pink-50 rounded-xl flex items-center gap-2">
                <Gift className="w-4 h-4 text-pink-500" />
                <span className="text-xs text-pink-700">
                  🎂 {pet?.name}'s birthday is coming up! Check out celebration picks.
                </span>
              </div>
            )}
            
            {/* Tabs */}
            <div className="flex gap-2">
              <TabButton
                active={activeTab === 'conversation'}
                icon={Gift}
                label="Convo"
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
          <div className="overflow-y-auto px-4 py-4" style={{ maxHeight: 'calc(80vh - 220px)' }}>
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
                    <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
                      {enhancedConversationPicks.map((pick, i) => (
                        <PickCard
                          key={pick.id || i}
                          pick={pick}
                          pet={pet}
                          onAdd={onAddToPicks}
                          onSendToConcierge={onSendToConcierge}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Gift className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">No picks from this conversation yet</p>
                      <p className="text-gray-400 text-xs mt-1">Ask Mira about products or services!</p>
                    </div>
                  )}
                  
                  {/* Show pillar-relevant picks if available */}
                  {relevantPillarPicks.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        More {currentPillar} picks for {pet?.name}
                      </h3>
                      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
                        {relevantPillarPicks.slice(0, 4).map((pick, i) => (
                          <PickCard
                            key={pick.id || i}
                            pick={enhancePicksWithBadges([pick])[0]}
                            pet={pet}
                            onAdd={onAddToPicks}
                            onSendToConcierge={onSendToConcierge}
                          />
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
                        onClick={() => onSaveTip?.(tipCard)}
                        className="w-full py-2 text-sm font-medium text-amber-600 bg-amber-50 rounded-xl flex items-center justify-center gap-2 hover:bg-amber-100"
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
                    <div className="text-center py-8">
                      <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">Loading picks for {pet?.name}...</p>
                    </div>
                  ) : personalizedPicks ? (
                    <div className="space-y-6">
                      {/* Quick stats */}
                      <div className="flex gap-2 flex-wrap">
                        <span className="px-2 py-1 bg-purple-50 text-purple-600 text-xs rounded-full">
                          🐕 {personalizedPicks.pet?.breed}
                        </span>
                        <span className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-full">
                          📏 {personalizedPicks.pet?.size}
                        </span>
                        {personalizedPicks.filters_applied?.allergies?.length > 0 && (
                          <span className="px-2 py-1 bg-red-50 text-red-600 text-xs rounded-full">
                            ⚠️ Avoiding: {personalizedPicks.filters_applied.allergies.join(', ')}
                          </span>
                        )}
                      </div>
                      
                      {/* Show top 3 pillars */}
                      {Object.entries(personalizedPicks.pillars || {}).slice(0, 3).map(([pillarId, data]) => (
                        <div key={pillarId}>
                          <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                            <span>{data.pillar?.emoji}</span>
                            {data.pillar?.name}
                          </h3>
                          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
                            {data.picks?.slice(0, 4).map((pick, i) => (
                              <PickCard
                                key={pick.id || i}
                                pick={enhancePicksWithBadges([pick])[0]}
                                pet={pet}
                                onAdd={onAddToPicks}
                                onSendToConcierge={onSendToConcierge}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                      
                      {/* See all button */}
                      <button
                        onClick={onShowFullTopPicks}
                        className="w-full py-3 text-sm font-medium text-amber-600 bg-amber-50 rounded-xl flex items-center justify-center gap-2 hover:bg-amber-100"
                      >
                        See all {personalizedPicks.total_picks} picks
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Sparkles className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">Couldn't load personalized picks</p>
                      <button
                        onClick={fetchPersonalizedPicks}
                        className="mt-3 px-4 py-2 bg-amber-100 text-amber-700 rounded-lg text-sm"
                      >
                        Try again
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Footer CTA */}
          <div className="sticky bottom-0 bg-white border-t border-gray-100 px-4 py-3">
            <button
              onClick={() => {
                hapticFeedback.success();
                onSendToConcierge?.({ 
                  type: 'all_picks', 
                  picks: enhancedConversationPicks,
                  tipCard,
                  pet 
                });
              }}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-xl flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              Send to Concierge®
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default UnifiedPicksVault;

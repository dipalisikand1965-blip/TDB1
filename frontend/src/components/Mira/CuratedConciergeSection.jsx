/**
 * CuratedConciergeSection.jsx
 * 
 * Renders the curated concierge layer from /api/mira/curated-set
 * Shows: question_card → concierge_products → concierge_services
 * 
 * Rules:
 * - No client-side reordering (server order is final)
 * - All CTAs create tickets (no add-to-cart)
 * - Same component used on pillar page and FAB panel
 * - Never empty (server guarantees 3-5 cards)
 * - WebSocket-powered real-time feedback on ticket creation
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Gift, Calendar, Camera, Home, PartyPopper,
  Clock, ChevronRight, RefreshCw, AlertCircle, Check,
  Cake, Package, MessageSquare, Loader2, Utensils, 
  Shield, MapPin, Users, ChefHat
} from 'lucide-react';
import { API_URL } from '../../utils/api';
import hapticFeedback from '../../utils/haptic';
import { toast } from 'sonner';
import { useMemberSocket } from '../../hooks/useMemberSocket';

// ═══════════════════════════════════════════════════════════════════════════════
// FALLBACK ICONS (don't rely on emojis)
// ═══════════════════════════════════════════════════════════════════════════════

const CARD_TYPE_ICONS = {
  concierge_product: Package,
  concierge_service: Calendar,
  question_card: MessageSquare,
};

const CARD_ID_ICONS = {
  // Celebrate pillar
  celebrate_custom_cake_design: Cake,
  celebrate_bespoke_box: Gift,
  celebrate_outdoor_pack: PartyPopper,
  celebrate_photo_kit: Camera,
  celebrate_keepsake_set: Sparkles,
  celebrate_end_to_end: PartyPopper,
  celebrate_home_setup: Home,
  celebrate_photographer: Camera,
  celebrate_venue: Calendar,
  celebrate_quiet_plan: Home,
  // Dine pillar
  dine_weekly_meal_plan: Utensils,
  dine_food_switch_assistant: RefreshCw,
  dine_allergy_safe_blueprint: Shield,
  dine_fresh_subscription_setup: Package,
  dine_dining_out_kit: Package,
  dine_reserve_pet_friendly_table: MapPin,
  dine_pet_buddy_meetup_coordination: Users,
  dine_private_chef_experience: ChefHat,
  dine_wont_eat_rapid_fix: AlertCircle,
  dine_nutrition_consult_booking: Calendar,
};

const getCardIcon = (card) => {
  // Try card-specific icon first
  if (CARD_ID_ICONS[card.id]) {
    return CARD_ID_ICONS[card.id];
  }
  // Fall back to type-based icon
  return CARD_TYPE_ICONS[card.type] || Sparkles;
};

// ═══════════════════════════════════════════════════════════════════════════════
// SKELETON LOADER (3-5 cards)
// ═══════════════════════════════════════════════════════════════════════════════

const SkeletonCard = () => (
  <div className="rounded-xl bg-white/5 border border-white/10 p-3 animate-pulse">
    <div className="flex items-start gap-2.5">
      <div className="w-9 h-9 rounded-lg bg-white/10" />
      <div className="flex-1 space-y-1.5">
        <div className="h-2 bg-white/10 rounded w-20" />
        <div className="h-3.5 bg-white/10 rounded w-3/4" />
      </div>
    </div>
    <div className="mt-2 h-3 bg-white/10 rounded w-full" />
    <div className="mt-1.5 h-3 bg-white/10 rounded w-2/3" />
    <div className="mt-2.5 h-8 bg-white/10 rounded-lg" />
  </div>
);

const LoadingState = () => (
  <div className="space-y-2">
    {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// ERROR STATE
// ═══════════════════════════════════════════════════════════════════════════════

const ErrorState = ({ onRetry, petName }) => (
  <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-6 text-center">
    <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
    <p className="text-white font-medium mb-1">
      Mira couldn't load picks right now.
    </p>
    <p className="text-gray-400 text-sm mb-4">
      We're having trouble getting {petName}'s curated picks.
    </p>
    <button
      onClick={onRetry}
      className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors"
    >
      <RefreshCw className="w-4 h-4 inline mr-2" />
      Retry
    </button>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// FALLBACK STATE (if server returns empty - should never happen)
// ═══════════════════════════════════════════════════════════════════════════════

const FallbackCards = ({ petName, onRetry }) => (
  <div className="space-y-2">
    <div className="rounded-xl bg-white/5 border border-white/10 p-3">
      <div className="flex items-start gap-2.5 mb-2">
        <div className="w-9 h-9 rounded-lg bg-pink-500/15 flex items-center justify-center">
          <Cake className="w-4 h-4 text-pink-400" />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide font-semibold text-pink-300 mb-0.5">Concierge® Product</p>
          <h4 className="text-white font-bold text-sm">Custom Celebration Cake</h4>
        </div>
      </div>
      <p className="text-gray-300 text-xs mb-2">
        A cake designed around {petName}'s preferences and dietary needs.
      </p>
      <button className="w-full py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg text-sm font-semibold transition-colors">
        Create for {petName}
      </button>
    </div>
    <div className="rounded-xl bg-white/5 border border-white/10 p-3">
      <div className="flex items-start gap-2.5 mb-2">
        <div className="w-9 h-9 rounded-lg bg-purple-500/15 flex items-center justify-center">
          <PartyPopper className="w-4 h-4 text-purple-400" />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide font-semibold text-purple-300 mb-0.5">Concierge® Service</p>
          <h4 className="text-white font-bold text-sm">Plan Celebration End-to-End</h4>
        </div>
      </div>
      <p className="text-gray-300 text-xs mb-2">
        Let Mira handle everything - theme, cake, moments, coordination.
      </p>
      <button className="w-full py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-semibold transition-colors">
        Request
      </button>
    </div>
    <button
      onClick={onRetry}
      className="w-full py-1.5 text-gray-400 hover:text-white text-xs transition-colors"
    >
      <RefreshCw className="w-3 h-3 inline mr-1" /> Load personalized picks
    </button>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// QUESTION CARD
// ═══════════════════════════════════════════════════════════════════════════════

const QuestionCard = ({ card, petId, petName, onAnswerSaved, token }) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  const handleSelect = async (option) => {
    if (saving || saved) return;
    
    hapticFeedback.buttonTap();
    setSelectedOption(option);
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/mira/curated-set/answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          pet_id: petId,
          question_id: card.id,
          answer: option,
        }),
      });

      if (response.ok) {
        hapticFeedback.success();
        setSaved(true);
        toast.success('Saved! Updating picks...');
        // Trigger re-fetch after a brief delay
        setTimeout(() => onAnswerSaved(), 500);
      } else {
        throw new Error('Failed to save');
      }
    } catch (err) {
      setError("Couldn't save. Tap to retry.");
      setSelectedOption(null);
      hapticFeedback.error();
    } finally {
      setSaving(false);
    }
  };

  const QuestionIcon = CARD_TYPE_ICONS.question_card;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-white/5 border border-amber-500/20 p-3"
      data-testid="question-card"
    >
      {/* Header - Compact */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center">
          <QuestionIcon className="w-3.5 h-3.5 text-amber-400" />
        </div>
        <p className="text-[10px] uppercase tracking-wide font-semibold text-amber-300">Mira asks</p>
      </div>

      {/* Question - High contrast */}
      <h4 className="text-white font-bold text-sm mb-3">{card.question}</h4>

      {/* Options - Compact grid */}
      <div className="grid grid-cols-2 gap-1.5">
        {card.options.map((option) => {
          const isSelected = selectedOption === option;
          const isDisabled = (saving || saved) && !isSelected;

          return (
            <button
              key={option}
              onClick={() => handleSelect(option)}
              disabled={isDisabled || saved}
              data-testid={`question-option-${option.toLowerCase().replace(/\s+/g, '-')}`}
              className={`
                py-2 px-2.5 rounded-lg text-xs font-medium transition-all
                ${isSelected && saved
                  ? 'bg-green-500 text-white'
                  : isSelected
                    ? 'bg-amber-500 text-white'
                    : isDisabled
                      ? 'bg-white/5 text-gray-500 cursor-not-allowed'
                      : 'bg-white/10 text-gray-200 hover:bg-white/20 hover:text-white'
                }
              `}
            >
              {isSelected && saved && <Check className="w-3 h-3 inline mr-1" />}
              {isSelected && saving && <Loader2 className="w-3 h-3 inline mr-1 animate-spin" />}
              {option}
            </button>
          );
        })}
      </div>

      {/* Microcopy - subtle */}
      <p className="text-gray-400 text-[10px] mt-2 text-center">
        This will refine {petName}'s picks
      </p>

      {/* Error */}
      {error && (
        <p className="text-red-400 text-xs mt-1.5 text-center">{error}</p>
      )}

      {/* Saved confirmation */}
      {saved && (
        <p className="text-green-400 text-xs mt-1.5 text-center flex items-center justify-center gap-1">
          <Check className="w-3 h-3" /> Saved
        </p>
      )}
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// CONCIERGE CARD (Product or Service)
// ═══════════════════════════════════════════════════════════════════════════════

const ConciergeCard = ({ card, petName, onCreateTicket, isLoading, ticketCreated }) => {
  const Icon = getCardIcon(card);
  const isProduct = card.type === 'concierge_product';

  const handleClick = () => {
    if (ticketCreated) return; // Already created
    hapticFeedback.buttonTap();
    onCreateTicket(card);
  };

  // Get CTA text from card or use default
  const ctaText = ticketCreated 
    ? 'Sent to Concierge®' 
    : (card.cta_text || (isProduct ? 'Send to Concierge®' : 'Send to Concierge®'));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-white/5 border border-white/10 p-3"
      data-testid={`concierge-card-${card.id}`}
    >
      {/* Header with icon and label - Compact */}
      <div className="flex items-start gap-2.5 mb-1.5">
        <div className={`w-8 h-8 rounded-lg ${isProduct ? 'bg-pink-500/15' : 'bg-purple-500/15'} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-4 h-4 ${isProduct ? 'text-pink-400' : 'text-purple-400'}`} />
        </div>
        <div className="flex-1 min-w-0">
          {/* High-contrast label */}
          <p className={`text-[10px] uppercase tracking-wide font-semibold mb-0.5 ${isProduct ? 'text-pink-300' : 'text-purple-300'}`}>
            {isProduct ? 'Concierge® Product' : 'Concierge® Service'}
          </p>
          {/* High-contrast title - Near white for dark backgrounds */}
          <h4 className="text-white font-bold text-sm leading-snug">
            {card.name}
          </h4>
        </div>
      </div>

      {/* Why for pet - Card-specific personalized reason */}
      {card.why_for_pet && (
        <p className="text-xs text-amber-300/90 mb-1.5 font-medium pl-10">
          ✦ {card.why_for_pet}
        </p>
      )}

      {/* CTA Button - Uses card-specific cta_text */}
      <button
        onClick={handleClick}
        disabled={isLoading || ticketCreated}
        data-testid={`concierge-cta-${card.id}`}
        className={`w-full py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
          ticketCreated
            ? 'bg-green-500/20 text-green-300 cursor-default'
            : isProduct 
              ? 'bg-pink-500 hover:bg-pink-600 text-white' 
              : 'bg-purple-500 hover:bg-purple-600 text-white'
        } ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Creating...</span>
          </>
        ) : ticketCreated ? (
          <>
            <Check className="w-4 h-4" />
            <span>{ctaText}</span>
          </>
        ) : (
          <>
            <span>{ctaText}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </>
        )}
      </button>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const CuratedConciergeSection = ({
  petId,
  petName,
  pillar = 'celebrate',
  token,
  userEmail, // For WebSocket registration
  onTicketCreate,
  onNotificationUpdate, // Callback to update notification badge
  className = '',
}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ticketLoading, setTicketLoading] = useState(null); // Card ID being processed
  const [createdTickets, setCreatedTickets] = useState({}); // Track created tickets by card ID

  // WebSocket for real-time feedback
  const handleWebSocketTicketCreated = useCallback((data) => {
    if (data.card_id) {
      setCreatedTickets(prev => ({
        ...prev,
        [data.card_id]: data.ticket_id || true
      }));
      // Show success toast
      toast.success('Request confirmed!', { duration: 2000 });
    }
  }, []);

  const handleInboxBadgeUpdate = useCallback((unreadCount) => {
    if (onNotificationUpdate) {
      onNotificationUpdate(unreadCount);
    }
  }, [onNotificationUpdate]);

  const { isConnected, isSyncing } = useMemberSocket({
    email: userEmail,
    token,
    onTicketCreated: handleWebSocketTicketCreated,
    onInboxBadgeUpdate: handleInboxBadgeUpdate,
  });

  // Fetch curated set
  const fetchCuratedSet = useCallback(async (forceRefresh = false) => {
    if (!petId) {
      setLoading(false);
      return;
    }
    
    if (!token) {
      // No token yet - keep loading state but don't make API call
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const url = `${API_URL}/api/mira/curated-set/${petId}/${pillar}${forceRefresh ? '?force_refresh=true' : ''}`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch curated set');
      }

      const result = await response.json();
      
      // Validate response has cards (server guarantees this, but protect UX)
      const totalCards = (result.concierge_products?.length || 0) + 
                        (result.concierge_services?.length || 0);
      
      if (totalCards === 0 && !result.question_card) {
        throw new Error('Empty response');
      }

      setData(result);
    } catch (err) {
      console.error('[CuratedConciergeSection] Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [petId, pillar, token]);

  // Initial fetch and refetch when token becomes available
  useEffect(() => {
    if (token) {
      fetchCuratedSet();
    }
  }, [fetchCuratedSet, token]);

  // Handle ticket creation
  const handleCreateTicket = async (card) => {
    setTicketLoading(card.id);
    
    try {
      // Create ticket with card context
      const ticketData = {
        pet_id: petId,
        category: card.ticket_category,
        source: 'curated_picks',
        card_id: card.id,
        card_type: card.type,
        card_name: card.name,
        pillar: pillar,
      };

      // Call parent handler or default ticket creation
      if (onTicketCreate) {
        await onTicketCreate(ticketData);
      } else {
        // Default: Create ticket via dedicated concierge-pick endpoint
        const response = await fetch(`${API_URL}/api/mira/concierge-pick/ticket`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            pet_id: petId,
            card_id: card.id,
            card_type: card.type,
            card_name: card.name,
            pillar: pillar,
            description: card.description,
            why_for_pet: card.why_for_pet,
          }),
        });

        if (response.ok) {
          const ticketResult = await response.json();
          hapticFeedback.success();
          
          // Optimistic update: Mark card as received immediately
          setCreatedTickets(prev => ({
            ...prev,
            [card.id]: ticketResult.ticket_id || true
          }));
          
          // Show toast with pending WebSocket confirmation
          toast.success('Request received — updating your Inbox', { 
            duration: 3000,
            description: isConnected ? '' : 'Syncing...'
          });
          
          // If WebSocket is connected, it will confirm via handleWebSocketTicketCreated
          // If not connected, trigger manual badge update after delay
          if (!isConnected) {
            setTimeout(() => {
              if (onNotificationUpdate) {
                onNotificationUpdate();
              }
            }, 2000);
          }
        } else {
          const errData = await response.json().catch(() => ({}));
          console.error('[CuratedConciergeSection] API error:', errData);
          throw new Error(errData.detail || 'Failed to create ticket');
        }
      }
    } catch (err) {
      console.error('[CuratedConciergeSection] Ticket error:', err);
      hapticFeedback.error();
      toast.error('Could not create request. Please try again.');
    } finally {
      setTicketLoading(null);
    }
  };

  // Handle question answer saved
  const handleAnswerSaved = () => {
    // Re-fetch with force refresh to get updated picks
    fetchCuratedSet(true);
  };

  // Format "updated at" time
  const getUpdatedText = () => {
    if (!data?.meta?.generated_at) return null;
    
    try {
      const generated = new Date(data.meta.generated_at);
      const now = new Date();
      const diffMins = Math.floor((now - generated) / 60000);
      
      if (diffMins < 1) return 'Updated just now';
      if (diffMins < 5) return 'Updated a moment ago';
      if (diffMins < 60) return `Updated ${diffMins} min ago`;
      return 'Updated recently';
    } catch {
      return null;
    }
  };

  // Render states
  if (loading) {
    return (
      <div className={className}>
        <LoadingState />
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <ErrorState petName={petName} onRetry={() => fetchCuratedSet(true)} />
      </div>
    );
  }

  // Check for empty (should never happen, but protect UX)
  const hasCards = data && (
    data.question_card || 
    data.concierge_products?.length > 0 || 
    data.concierge_services?.length > 0
  );

  if (!hasCards) {
    return (
      <div className={className}>
        <FallbackCards petName={petName} onRetry={() => fetchCuratedSet(true)} />
      </div>
    );
  }

  // Get location info from meta if available
  const userLocation = data?.meta?.user_location;

  return (
    <div className={className} data-testid="curated-concierge-section">
      {/* Header with "Handpicked" and "Updated" + sync status */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-white/80 font-medium">
          ✨ Handpicked for {petName}
        </p>
        <div className="flex items-center gap-2">
          {isSyncing && (
            <span className="text-[10px] text-amber-400 flex items-center gap-1">
              <Loader2 className="w-2.5 h-2.5 animate-spin" />
              Syncing...
            </span>
          )}
          {getUpdatedText() && (
            <p className="text-[10px] text-gray-500 flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" />
              {getUpdatedText()}
            </p>
          )}
        </div>
      </div>

      {/* Cards in strict order: question → products → services */}
      <div className="space-y-2">
        {/* Question Card (if present) - Always first */}
        {data.question_card && (
          <QuestionCard
            card={data.question_card}
            petId={petId}
            petName={petName}
            token={token}
            onAnswerSaved={handleAnswerSaved}
          />
        )}

        {/* Concierge® Products (server order) */}
        {data.concierge_products?.map((card) => (
          <ConciergeCard
            key={card.id}
            card={card}
            petName={petName}
            onCreateTicket={handleCreateTicket}
            isLoading={ticketLoading === card.id}
            ticketCreated={!!createdTickets[card.id]}
          />
        ))}

        {/* Concierge® Services (server order) */}
        {data.concierge_services?.map((card) => (
          <ConciergeCard
            key={card.id}
            card={card}
            petName={petName}
            onCreateTicket={handleCreateTicket}
            isLoading={ticketLoading === card.id}
            ticketCreated={!!createdTickets[card.id]}
          />
        ))}
      </div>
    </div>
  );
};

export default CuratedConciergeSection;

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
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Gift, Calendar, Camera, Home, PartyPopper,
  Clock, ChevronRight, RefreshCw, AlertCircle, Check,
  Cake, Package, MessageSquare, Loader2
} from 'lucide-react';
import { API_URL } from '../../utils/api';
import hapticFeedback from '../../utils/haptic';
import { toast } from 'sonner';

// ═══════════════════════════════════════════════════════════════════════════════
// FALLBACK ICONS (don't rely on emojis)
// ═══════════════════════════════════════════════════════════════════════════════

const CARD_TYPE_ICONS = {
  concierge_product: Package,
  concierge_service: Calendar,
  question_card: MessageSquare,
};

const CARD_ID_ICONS = {
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
  <div className="rounded-2xl bg-white/5 border border-white/10 p-4 animate-pulse">
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl bg-white/10" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-white/10 rounded w-3/4" />
        <div className="h-3 bg-white/10 rounded w-full" />
        <div className="h-3 bg-white/10 rounded w-2/3" />
      </div>
    </div>
    <div className="mt-4 h-9 bg-white/10 rounded-lg" />
  </div>
);

const LoadingState = () => (
  <div className="space-y-3">
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
  <div className="space-y-3">
    <div className="rounded-2xl bg-gradient-to-br from-pink-500/10 to-purple-500/10 border border-pink-500/20 p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center">
          <Cake className="w-5 h-5 text-pink-400" />
        </div>
        <div>
          <p className="text-xs text-pink-400 font-medium">Concierge Product</p>
          <h4 className="text-white font-semibold">Custom Celebration Cake</h4>
        </div>
      </div>
      <p className="text-gray-400 text-sm mb-3">
        A cake designed around {petName}'s preferences and dietary needs.
      </p>
      <button className="w-full py-2.5 bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 rounded-lg text-sm font-medium transition-colors">
        Create for {petName}
      </button>
    </div>
    <div className="rounded-2xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
          <PartyPopper className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <p className="text-xs text-purple-400 font-medium">Concierge Service</p>
          <h4 className="text-white font-semibold">Plan Celebration End-to-End</h4>
        </div>
      </div>
      <p className="text-gray-400 text-sm mb-3">
        Let Mira handle everything - theme, cake, moments, coordination.
      </p>
      <button className="w-full py-2.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg text-sm font-medium transition-colors">
        Request
      </button>
    </div>
    <button
      onClick={onRetry}
      className="w-full py-2 text-gray-400 hover:text-white text-sm transition-colors"
    >
      <RefreshCw className="w-4 h-4 inline mr-1" /> Load personalized picks
    </button>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// QUESTION CARD
// ═══════════════════════════════════════════════════════════════════════════════

const QuestionCard = ({ card, petId, onAnswerSaved, token }) => {
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
      className="rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 p-4"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
          <QuestionIcon className="w-4 h-4 text-amber-400" />
        </div>
        <p className="text-xs text-amber-400 font-medium">Mira asks</p>
      </div>

      {/* Question */}
      <h4 className="text-white font-semibold mb-4">{card.question}</h4>

      {/* Options */}
      <div className="grid grid-cols-2 gap-2">
        {card.options.map((option) => {
          const isSelected = selectedOption === option;
          const isDisabled = (saving || saved) && !isSelected;

          return (
            <button
              key={option}
              onClick={() => handleSelect(option)}
              disabled={isDisabled || saved}
              className={`
                py-2.5 px-3 rounded-lg text-sm font-medium transition-all
                ${isSelected && saved
                  ? 'bg-green-500/30 text-green-300 border border-green-500/30'
                  : isSelected
                    ? 'bg-amber-500/30 text-amber-200 border border-amber-500/30'
                    : isDisabled
                      ? 'bg-white/5 text-gray-500 cursor-not-allowed'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'
                }
              `}
            >
              {isSelected && saved && <Check className="w-3.5 h-3.5 inline mr-1" />}
              {isSelected && saving && <Loader2 className="w-3.5 h-3.5 inline mr-1 animate-spin" />}
              {option}
            </button>
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <p className="text-red-400 text-xs mt-2 text-center">{error}</p>
      )}

      {/* Saved confirmation */}
      {saved && (
        <p className="text-green-400 text-xs mt-2 text-center flex items-center justify-center gap-1">
          <Check className="w-3 h-3" /> Saved
        </p>
      )}
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// CONCIERGE CARD (Product or Service)
// ═══════════════════════════════════════════════════════════════════════════════

const ConciergeCard = ({ card, petName, onCreateTicket, isLoading }) => {
  const Icon = getCardIcon(card);
  const isProduct = card.type === 'concierge_product';
  
  // Gradient colors based on type
  const gradientClass = isProduct
    ? 'from-pink-500/10 to-purple-500/10 border-pink-500/20'
    : 'from-purple-500/10 to-blue-500/10 border-purple-500/20';
  
  const iconBgClass = isProduct ? 'bg-pink-500/20' : 'bg-purple-500/20';
  const iconColorClass = isProduct ? 'text-pink-400' : 'text-purple-400';
  const labelColorClass = isProduct ? 'text-pink-400' : 'text-purple-400';
  const buttonClass = isProduct
    ? 'bg-pink-500/20 hover:bg-pink-500/30 text-pink-300'
    : 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-300';

  const handleClick = () => {
    hapticFeedback.buttonTap();
    onCreateTicket(card);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl bg-gradient-to-br ${gradientClass} border p-4`}
    >
      {/* Header with icon and label */}
      <div className="flex items-start gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl ${iconBgClass} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-5 h-5 ${iconColorClass}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-xs ${labelColorClass} font-medium mb-0.5`}>
            {isProduct ? 'Concierge Product' : 'Concierge Service'}
          </p>
          <h4 className="text-white font-semibold text-sm leading-tight">
            {card.name}
          </h4>
        </div>
      </div>

      {/* Description */}
      <p className="text-gray-400 text-sm mb-2 line-clamp-2">
        {card.description}
      </p>

      {/* Why for pet - subtle helper line */}
      {card.why_for_pet && (
        <p className="text-xs text-gray-500 mb-3 italic">
          {card.why_for_pet}
        </p>
      )}

      {/* CTA Button */}
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={`w-full py-2.5 ${buttonClass} rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2`}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            {card.cta_text || (isProduct ? `Create for ${petName}` : 'Request')}
            <ChevronRight className="w-4 h-4" />
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
  onTicketCreate,
  className = '',
}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ticketLoading, setTicketLoading] = useState(null); // Card ID being processed

  // Fetch curated set
  const fetchCuratedSet = useCallback(async (forceRefresh = false) => {
    if (!petId || !token) return;

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

  // Initial fetch
  useEffect(() => {
    fetchCuratedSet();
  }, [fetchCuratedSet]);

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
        // Default: Create ticket via API
        const response = await fetch(`${API_URL}/api/tickets`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...ticketData,
            title: `${card.name} for ${petName}`,
            description: card.description,
            status: 'new',
          }),
        });

        if (response.ok) {
          hapticFeedback.success();
          toast.success('Request received! Check your Inbox.');
        } else {
          throw new Error('Failed to create ticket');
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

  return (
    <div className={className}>
      {/* Cards in strict order: question → products → services */}
      <div className="space-y-3">
        {/* Question Card (if present) - Always first */}
        {data.question_card && (
          <QuestionCard
            card={data.question_card}
            petId={petId}
            token={token}
            onAnswerSaved={handleAnswerSaved}
          />
        )}

        {/* Concierge Products (server order) */}
        {data.concierge_products?.map((card) => (
          <ConciergeCard
            key={card.id}
            card={card}
            petName={petName}
            onCreateTicket={handleCreateTicket}
            isLoading={ticketLoading === card.id}
          />
        ))}

        {/* Concierge Services (server order) */}
        {data.concierge_services?.map((card) => (
          <ConciergeCard
            key={card.id}
            card={card}
            petName={petName}
            onCreateTicket={handleCreateTicket}
            isLoading={ticketLoading === card.id}
          />
        ))}
      </div>

      {/* Footer with updated time */}
      {getUpdatedText() && (
        <p className="text-center text-gray-500 text-xs mt-4 flex items-center justify-center gap-1">
          <Clock className="w-3 h-3" />
          {getUpdatedText()}
        </p>
      )}

      {/* Personalization summary (subtle) */}
      {data.meta?.personalization_summary && (
        <p className="text-center text-gray-600 text-[10px] mt-1">
          {data.meta.personalization_summary}
        </p>
      )}
    </div>
  );
};

export default CuratedConciergeSection;

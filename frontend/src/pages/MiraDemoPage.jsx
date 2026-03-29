/**
 * MiraDemoPage.jsx
 * 
 * MIRA OS 10/10 - World-Class Pet Life Operating System
 * Premium Chat UI - Apple iMessage Quality + Deep Pet Personalization
 * 
 * FEATURES:
 * - Soul Score integration from member profile
 * - Apple iMessage-like spacing
 * - Pale lilac user bubbles
 * - 2x2 product grid tiles
 * - Pet avatar with concentric rings
 * - Soul traits display
 * 
 * PERFORMANCE OPTIMIZED:
 * - Heavy modals are lazy-loaded
 * - Memoized components where possible
 */

import React, { useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense, memo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Mic, MicOff, Send, MessageCircle, Package, Calendar, 
  HelpCircle, Heart, Sparkles, ChevronDown, ChevronUp, ChevronRight, ChevronLeft,
  ShoppingBag, PawPrint, Bot, History, Plus, Check, Search,
  ThumbsUp, ThumbsDown, X, Phone, Mail, MessageSquare, AlertCircle,
  Star, Crown, Gift, Volume2, VolumeX, Wand2, ArrowRight, ExternalLink, Shield,
  Award, RefreshCw, MapPin, Navigation, Play
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SoulChips, useSoulChips } from '../hooks/mira/useSoulChips';
import { usePicksCount, PicksBadge } from '../hooks/mira/usePicksCount';
import { SoulRadarBackground } from '../components/Mira/SoulRadar';
import { API_URL } from '../utils/api';
import hapticFeedback from '../utils/haptic';
import { correctSpelling } from '../utils/spellCorrect';
import conversationIntelligence from '../utils/conversationIntelligence';
import notificationSounds from '../utils/notificationSounds';

// ═══════════════════════════════════════════════════════════════════════════════
// MIRA SHELL - Single source of truth for layout state
// ═══════════════════════════════════════════════════════════════════════════════
import { useMiraShell, shouldShowQuickReplies } from '../hooks/mira/useMiraShell';

// ═══════════════════════════════════════════════════════════════════════════════
// VAULT SYSTEM - "Mira is the Brain, Concierge® is the Hands"
// ═══════════════════════════════════════════════════════════════════════════════
import { VaultManager, UnifiedPicksVault } from '../components/PicksVault';
import MiraTray from '../components/Mira/MiraTray';
import WelcomeHero from '../components/Mira/WelcomeHero';
import ChatMessage from '../components/Mira/ChatMessage';
import ChatInputBar from '../components/Mira/ChatInputBar';
import PetSelector from '../components/Mira/PetSelector';
// NavigationDock removed - functions moved to primary OS layers
// FloatingActionBar removed - replaced with primary OS navigation
import MiraLoader from '../components/Mira/MiraLoader';
import ScrollToBottomButton from '../components/Mira/ScrollToBottomButton';
import ProactiveAlertsBanner from '../components/Mira/ProactiveAlertsBanner';
import NotificationBell from '../components/Mira/NotificationBell';
import ConciergeConfirmation from '../components/Mira/ConciergeConfirmation';
// Removed: ConversationPicksIndicator (using top bar indicator instead)
import QuickReplies, { generateQuickReplies } from '../components/Mira/QuickReplies';
import MemoryWhisper from '../components/Mira/MemoryWhisper';
import SoulKnowledgeTicker from '../components/Mira/SoulKnowledgeTicker';
import SoulQuestionPrompts from '../components/Mira/SoulQuestionPrompts';
import { FormattedText, TypedText } from '../components/Mira/TextComponents';
import { triggerCelebrationConfetti } from '../utils/confetti';
import PetOSNavigation from '../components/Mira/PetOSNavigation';
import MiraUnifiedHeader from '../components/Mira/MiraUnifiedHeader';
import WeatherCard from '../components/Mira/WeatherCard';
import WhyForPetBadge from '../components/Mira/WhyForPetBadge';
import ServicesPanel from '../components/Mira/ServicesPanel';
import ServiceRequestBuilder from '../components/Mira/ServiceRequestBuilder';
import ReplyNudge from '../components/Mira/ReplyNudge';
import OnboardingTooltip from '../components/Mira/OnboardingTooltip';
import ConciergeReplyBanner from '../components/Mira/ConciergeReplyBanner';
import NewChatConfirmDialog from '../components/Mira/NewChatConfirmDialog';
import StarterChips from '../components/Mira/StarterChips';
import LocationPromptModal from '../components/Mira/LocationPromptModal';
import Footer from '../components/Footer';

// ═══════════════════════════════════════════════════════════════════════════════
// LAZY LOADED COMPONENTS (Performance Optimization)
// Heavy modals and panels that aren't needed on initial render
// ═══════════════════════════════════════════════════════════════════════════════
const PastChatsPanel = lazy(() => import('../components/Mira/PastChatsPanel'));
const InsightsPanel = lazy(() => import('../components/Mira/InsightsPanel'));
const ConciergePanel = lazy(() => import('../components/Mira/ConciergePanel'));
const ConciergeHomePanel = lazy(() => import('../components/Mira/ConciergeHomePanel'));
const ConciergeThreadPanel = lazy(() => import('../components/Mira/ConciergeThreadPanelV2'));
const HelpModal = lazy(() => import('../components/Mira/HelpModal'));
const LearnModal = lazy(() => import('../components/Mira/LearnModal'));
const LearnPanel = lazy(() => import('../components/Mira/LearnPanel'));
const PersonalizedPicksPanel = lazy(() => import('../components/Mira/PersonalizedPicksPanel'));
const ServiceRequestModal = lazy(() => import('../components/Mira/ServiceRequestModal'));
const HealthVaultWizard = lazy(() => import('../components/Mira/HealthVaultWizard'));
const TestScenariosPanel = lazy(() => import('../components/Mira/TestScenariosPanel'));
const HandoffSummary = lazy(() => import('../components/Mira/HandoffSummary'));
const SoulFormModal = lazy(() => import('../components/Mira/SoulFormModal'));
const MojoProfileModal = lazy(() => import('../components/Mira/MojoProfileModal'));

// FlowModals - Intelligent booking wizards triggered by chat
const GroomingFlowModal = lazy(() => import('../components/GroomingFlowModal'));
const VetVisitFlowModal = lazy(() => import('../components/VetVisitFlowModal'));
const CareServiceFlowModal = lazy(() => import('../components/CareServiceFlowModal'));
const TodayPanel = lazy(() => import('../components/Mira/TodayPanel'));

// Quick Concierge® Modal - "Send to Concierge®" CTA for Mira suggestions
const QuickConciergeModal = lazy(() => import('../components/Mira/QuickConciergeModal'));

// Simple loading fallback for lazy components
const LazyFallback = () => <div className="p-4 text-center text-gray-400">Loading...</div>;

// ═══════════════════════════════════════════════════════════════════════════════
// EXTRACTED CONSTANTS & UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════
import {
  DOCK_ITEMS, CONCIERGE_HOURS, isConciergeLive, generateConciergeRequest,
  DOG_PLACEHOLDER_IMAGES, getPlaceholderImage,
  SERVICE_CATEGORIES, detectServiceIntent,
  COMFORT_KEYWORDS, ACKNOWLEDGMENT_PHRASES, getComfortModeServices,
  EXPERIENCE_CATEGORIES, detectExperienceIntent, generateWhyForPet
} from '../utils/miraConstants';

// ═══════════════════════════════════════════════════════════════════════════════
// EXTRACTED HOOKS - Stage 1, 2, 3 Refactoring
// ═══════════════════════════════════════════════════════════════════════════════
import { 
  useVoice, usePet, useVault, useSession, DEMO_PET, ALL_DEMO_PETS,
  useChatSubmit, useConversation, useMiraUI, useProactiveAlerts,
  useLayerNavigation, useChatContinuity, useDraft, useIconState, ICON_STATE, TAB_IDS,
  detectMiraMode, preprocessInput, detectStepId, extractCityFromQuery,
  detectContextTopic, hasTrainingIntent, extractTrainingTopic,
  shouldFetchTravelData, isMeaningfulTopic, isCelebrationQuery, MEANINGFUL_TOPICS,
  // New helpers
  calculateVoiceDelay, isComfortMode, hasServiceIntent, extractQuickRepliesFromData,
  // Message builders
  createErrorMessage, createTopicShiftIndicator, createUserMessage, buildMiraMessage,
  // API helpers
  fetchConversationMemory, fetchMoodContext, routeIntent, createOrAttachTicket,
  fetchTrainingVideos, fetchTravelHotels, fetchTravelAttractions,
  saveConversationMemory, buildMemoryPrefix
} from '../hooks/mira';

// Icon State API - Real data from unified Service Desk ticket spine
import useIconStateAPI from '../hooks/mira/useIconStateAPI';

// Proof Panel for icon state validation (feature flag: ?debug=1)
import IconStateDebugDrawer from '../components/mira-os/debug/IconStateDebugDrawer';

// Toast for commit action confirmations
import { useToast } from '../hooks/use-toast';

// Import the production-style CSS (matches thedoggycompany.in)
import '../styles/mira-prod.css';
import '../styles/mira-unified-header.css';

// ═══════════════════════════════════════════════════════════════════════════════
// NOTE: DEMO_PET and ALL_DEMO_PETS are now imported from '../hooks/mira'
// This ensures consistency between the hook and the page
// ═══════════════════════════════════════════════════════════════════════════════
// Alias for backward compatibility
const ALL_PETS = ALL_DEMO_PETS;

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY: Calculate health score from pet data
// Used by PetOSNavigation to show health indicator on pet avatar
// ═══════════════════════════════════════════════════════════════════════════════
const calculateHealthScore = (pet) => {
  if (!pet) return 0;
  
  const soulAnswers = pet.doggy_soul_answers || {};
  const preferences = pet.preferences || {};
  
  // Health fields to check
  const healthFields = [
    soulAnswers.food_allergies || preferences.allergies,
    soulAnswers.weight,
    soulAnswers.spayed_neutered,
    soulAnswers.vaccination_status,
  ];
  
  const filled = healthFields.filter(f => {
    if (!f) return false;
    if (Array.isArray(f)) return f.length > 0;
    if (typeof f === 'string') return f !== '' && f !== 'Unknown';
    return true;
  }).length;
  
  return Math.round((filled / healthFields.length) * 100);
};

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY: Get pet allergies from all sources (mirrors backend logic)
// "Memory is only real if it changes behaviour immediately."
// ═══════════════════════════════════════════════════════════════════════════════
const getPetAllergies = (pet) => {
  if (!pet) return [];
  
  const extractAllergies = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) {
      const result = [];
      val.forEach(item => {
        if (typeof item === 'object') {
          const allergen = item.allergen || item.name || '';
          allergen.split(',').forEach(a => {
            if (a.trim()) result.push(a.trim().toLowerCase());
          });
        } else if (typeof item === 'string' && item.trim()) {
          item.split(',').forEach(a => {
            if (a.trim()) result.push(a.trim().toLowerCase());
          });
        }
      });
      return result;
    }
    if (typeof val === 'string' && val.trim()) {
      return val.split(',').map(a => a.trim().toLowerCase()).filter(Boolean);
    }
    return [];
  };
  
  const soulAnswers = pet.doggy_soul_answers || {};
  const preferences = pet.preferences || {};
  const healthVault = pet.health_vault || {};
  
  // Merge from ALL sources
  const allSources = [
    preferences.allergies,
    pet.known_allergies,
    pet.allergies,
    pet.food_allergies,
    soulAnswers.allergies,
    soulAnswers.food_allergies,
    healthVault.allergies,
    (pet.insights?.key_flags?.allergy_list)
  ];
  
  const merged = new Set();
  allSources.forEach(source => {
    extractAllergies(source).forEach(a => merged.add(a));
  });
  
  return Array.from(merged).sort();
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT: Dietary Context Chip - Shows active pet's allergies
// Collapsible sticky chip that appears in food-related flows
// ═══════════════════════════════════════════════════════════════════════════════
const DietaryContextChip = ({ pet, isExpanded, onToggle, onEdit }) => {
  const allergies = getPetAllergies(pet);
  
  if (!allergies.length) return null;
  
  const petName = pet?.name || 'Pet';
  const petWeight = pet?.doggy_soul_answers?.weight || pet?.weight_kg || pet?.identity?.weight;
  const petBreed = pet?.breed || pet?.identity?.breed || '';
  
  return (
    <div className="mb-3 mx-auto max-w-xl" data-testid="dietary-context-chip">
      <button
        onClick={onToggle}
        className={`w-full px-3 py-2 rounded-lg border transition-all ${
          isExpanded 
            ? 'bg-amber-500/10 border-amber-500/30' 
            : 'bg-zinc-800/50 border-zinc-700/50 hover:border-amber-500/30'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-amber-400">⚠️</span>
            <span className="text-sm text-zinc-300">
              <span className="font-medium">{petName}</span>
              {petWeight && <span className="text-zinc-500"> ({petWeight}kg)</span>}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-amber-400/80">
              {allergies.length} avoid{allergies.length !== 1 ? 's' : ''}
            </span>
            <span className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </div>
        </div>
        
        {!isExpanded && (
          <div className="mt-1 text-xs text-zinc-500 text-left">
            Strict avoids: {allergies.slice(0, 3).join(', ')}
            {allergies.length > 3 && ` +${allergies.length - 3} more`}
          </div>
        )}
      </button>
      
      {isExpanded && (
        <div className="mt-2 p-3 bg-zinc-800/30 rounded-lg border border-zinc-700/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-500 uppercase tracking-wider">Strict Avoids</span>
            {onEdit && (
              <button 
                onClick={onEdit}
                className="text-xs text-amber-400 hover:text-amber-300"
              >
                Edit
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {allergies.map((allergen, i) => (
              <span 
                key={i}
                className="tdc-chip tdc-chip-dark"
                style={{ background:'rgba(239,68,68,0.2)', color:'#fca5a5', borderColor:'rgba(239,68,68,0.3)' }}
              >
                {allergen}
              </span>
            ))}
          </div>
          <p className="mt-2 text-xs text-zinc-500 italic">
            All food recommendations are automatically filtered against these.
          </p>
        </div>
      )}
    </div>
  );
};

const MiraDemoPage = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // ── Live picks count from API (Bible §4.1 — not hardcoded) ───────────────────
  const activePetId = user?.activePetId || user?.pets?.[0]?.id;
  const { picksCount } = usePicksCount(activePetId, token);
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // NAVIGATION CONTEXT - Track where user came from for "Back to Pillar" feature
  // ═══════════════════════════════════════════════════════════════════════════════
  const returnUrl = searchParams.get('returnUrl');
  const sourcePillar = searchParams.get('pillar');
  
  // Pillar display names for the back button
  const PILLAR_NAMES = {
    celebrate: 'Celebrate',
    dine: 'Dine',
    stay: 'Stay',
    travel: 'Travel',
    care: 'Care',
    enjoy: 'Enjoy',
    fit: 'Fit',
    learn: 'Learn',
    paperwork: 'Paperwork',
    advisory: 'Advisory',
    emergency: 'Emergency',
    farewell: 'Farewell',
    adopt: 'Adopt',
    shop: 'Shop'
  };
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // PET MANAGEMENT - Extracted to usePet hook (Stage 1 Refactoring)
  // Note: We don't use the hook's switchPet because the local version handles
  // session management and conversation history which requires more state
  // ═══════════════════════════════════════════════════════════════════════════════
  const {
    pet,
    setPet,
    allPets,
    setAllPets,
    showPetSelector,
    setShowPetSelector,
    isLoadingPets,
    isRealPet,
    petLoaded
  } = usePet({ user, token });
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // VAULT MANAGEMENT - Extracted to useVault hook (Stage 2 Refactoring)
  // ═══════════════════════════════════════════════════════════════════════════════
  const {
    showVault,
    setShowVault,
    activeVaultData,
    setActiveVaultData,
    vaultUserMessage,
    setVaultUserMessage,
    miraPicks,
    setMiraPicks,
    showMiraTray,
    setShowMiraTray,
    clearPicks,
    markPicksSeen,
    fetchDefaultPicks  // NEW: Fetch default picks on page load
  } = useVault();
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // SESSION MANAGEMENT - Extracted to useSession hook (Stage 3 Refactoring)
  // ═══════════════════════════════════════════════════════════════════════════════
  const {
    sessionId,
    setSessionId,
    sessionRecovered,
    setSessionRecovered,
    startNewSession: baseStartNewSession
  } = useSession({ pet });
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // VOICE HOOK - Voice input/output (P1 Integration)
  // ═══════════════════════════════════════════════════════════════════════════════
  const {
    voiceEnabled,
    setVoiceEnabled,
    isSpeaking,
    speak: speakWithMira,
    stopSpeaking,
    toggleVoiceOutput,
    skipNextVoice,
    scheduleVoice,
    isListening,
    setIsListening,  // CRITICAL: Import setter for voice state management
    voiceError,
    setVoiceError,  // CRITICAL: Import setter to fix voice toggle error
    voiceSupported,
    toggleListening,
    audioRef
  } = useVoice({
    onTranscript: (text) => setQuery(text),
    onSubmit: (text) => {
      if (handleSubmitRef.current) {
        handleSubmitRef.current(null, text);
      }
    }
  });
  
  // Ref for handleSubmit (needed for voice callback)
  const handleSubmitRef = useRef(null);
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // CONVERSATION HOOK - Conversation state management (Phase 2A Refactoring)
  // ═══════════════════════════════════════════════════════════════════════════════
  const {
    conversationHistory,
    setConversationHistory,
    conversationContext,
    setConversationContext,
    conversationStage,
    setConversationStage,
    quickReplies,
    setQuickReplies,
    conversationComplete,
    setConversationComplete,
    showConversationEndBanner,
    setShowConversationEndBanner,
    showOlderMessages,
    setShowOlderMessages,
    clarifyingQuestionCount,
    setClarifyingQuestionCount,
    MAX_CLARIFYING_QUESTIONS,
    VISIBLE_MESSAGE_COUNT,
    detectConversationComplete,
    resetContextForPet
  } = useConversation(pet);
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // UI HOOK - Modal/Panel/Processing state management (Phase 2B Refactoring)
  // ═══════════════════════════════════════════════════════════════════════════════
  const {
    showHelpModal,
    setShowHelpModal,
    showLearnModal,
    setShowLearnModal,
    showTopPicksPanel,
    setShowTopPicksPanel,
    showInsightsPanel,
    setShowInsightsPanel,
    showConciergePanel,
    setShowConciergePanel,
    showConciergeOptions,
    setShowConciergeOptions,
    showUnifiedVault,
    setShowUnifiedVault,
    isProcessing,
    setIsProcessing,
    isTyping,
    setIsTyping,
    showSkeleton,
    setShowSkeleton,
    miraMode,
    setMiraMode,
    showFeatureShowcase,
    setShowFeatureShowcase
  } = useMiraUI();
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // PROACTIVE ALERTS HOOK - Alerts, greetings, weather (Phase 2C Refactoring)
  // ═══════════════════════════════════════════════════════════════════════════════
  const {
    proactiveAlerts,
    setProactiveAlerts,
    proactiveGreeting,
    currentWeather,
    setCurrentWeather
  } = useProactiveAlerts(pet);
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // DIETARY CONTEXT CHIP - Shows active pet allergies in food flows
  // "Memory is only real if it changes behaviour immediately."
  // ═══════════════════════════════════════════════════════════════════════════════
  const [showDietaryContext, setShowDietaryContext] = useState(false);
  const [dietaryContextExpanded, setDietaryContextExpanded] = useState(false);
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // FLOW MODAL STATES - Intelligent booking wizards triggered by Mira chat
  // ═══════════════════════════════════════════════════════════════════════════════
  const [showGroomingFlowModal, setShowGroomingFlowModal] = useState(false);
  const [showVetVisitFlowModal, setShowVetVisitFlowModal] = useState(false);
  const [showCareServiceFlowModal, setShowCareServiceFlowModal] = useState(false);
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // QUICK CONCIERGE MODAL - "Send to Concierge®" CTA for Mira suggestions
  // When Mira suggests actionable items, C° button glows golden
  // User clicks → Quick confirmation modal → UNIFIED SERVICE FLOW
  // SSOT Reference: /app/memory/SSOT.md - "Quick Send to Concierge®" feature
  // ═══════════════════════════════════════════════════════════════════════════════
  const [showQuickConciergeModal, setShowQuickConciergeModal] = useState(false);
  const [actionableSuggestion, setActionableSuggestion] = useState(null);
  
  // Auto-show dietary context chip in food-related conversations
  useEffect(() => {
    const lastMessage = conversationHistory[conversationHistory.length - 1];
    const messageContent = (lastMessage?.content || '').toLowerCase();
    
    const foodKeywords = ['treat', 'food', 'meal', 'diet', 'kibble', 'nutrition', 'eat', 'feed', 'snack', 'cake'];
    const isFoodRelated = foodKeywords.some(kw => messageContent.includes(kw));
    
    // Show if in food flow AND pet has allergies
    const petAllergies = getPetAllergies(pet);
    setShowDietaryContext(isFoodRelated && petAllergies.length > 0);
  }, [conversationHistory, pet]);
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // TOAST - For commit action confirmations (Bible Section 1.5)
  // ═══════════════════════════════════════════════════════════════════════════════
  const { toast } = useToast();
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // LAYER NAVIGATION - Bible-compliant OS navigation (PET_OS_BEHAVIOR_BIBLE v1.1)
  // ═══════════════════════════════════════════════════════════════════════════════
  const {
    activeTab: layerActiveTab,
    isAtChatHome,
    hasDetailOpen,
    hasEphemeralOpen,
    handleTabChange: layerHandleTabChange,
    openDetail,
    openEphemeral,
    closeEphemeral,
    handleBack,
    handleCommit,
    commitAndReturn,
    returnToChat,
    isLayerOpen,
  } = useLayerNavigation({
    onReturnToChat: () => {
      // Reset all legacy panel states when returning to chat
      setShowMojoModal(false);
      setShowTodayPanel(false);
      setShowTopPicksPanel(false);
      setShowServicesPanel(false);
      setShowLearnPanel(false);
      setShowConciergeHome(false);
      setShowInsightsPanel(false);
      setShowConciergePanel(false);
      setShowHelpModal(false);
      setShowSoulFormModal(false);
      setRequestBuilderState({ isOpen: false, service: null });
      setConciergeThread({ isOpen: false, threadId: null, thread: null, messages: [] });
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // MIRA SHELL - Single source of truth for layout/footer state
  // Implements the MiraAppShell state model from spec
  // ═══════════════════════════════════════════════════════════════════════════════
  const {
    state: shellState,
    actions: shellActions,
    selectors: shellSelectors,
    refs: shellRefs,
  } = useMiraShell(layerActiveTab);

  // Sync tab changes to shell state
  useEffect(() => {
    if (layerActiveTab !== shellState.activeTab) {
      shellActions.setTab(layerActiveTab);
    }
  }, [layerActiveTab, shellState.activeTab, shellActions]);

  // Sync pet ID to shell
  useEffect(() => {
    if (pet?.id && pet.id !== shellState.activePetId) {
      shellActions.setActivePet(pet.id);
    }
  }, [pet?.id, shellState.activePetId, shellActions]);

  // Note: Quick replies and modal sync effects are moved after currentTicket declaration below

  // ═══════════════════════════════════════════════════════════════════════════════
  // COMMIT ACTION HANDLER - With toast + chat confirmation (Bible Section 1.5)
  // ═══════════════════════════════════════════════════════════════════════════════
  const handleCommitAction = useCallback(async (action, actionName = 'Action', successMessage = 'Done!') => {
    const result = await handleCommit(action, actionName);
    
    if (result.success) {
      // Show toast notification (3s per Bible)
      toast({
        title: successMessage,
        description: `${actionName} completed successfully`,
        duration: 3000,
      });
      
      // Add confirmation system line in chat (optional but preferred per Bible)
      setConversationHistory(prev => [...prev, {
        type: 'system',
        content: `✓ ${successMessage}`,
        timestamp: new Date(),
        isCommitConfirmation: true,
      }]);
    }
    
    return result;
  }, [handleCommit, toast, setConversationHistory]);

  // ═══════════════════════════════════════════════════════════════════════════════
  // TAB CHANGE HANDLER - Bridges Layer Manager with legacy state
  // ═══════════════════════════════════════════════════════════════════════════════
  const handleOSTabChange = useCallback((tabId) => {
    // Use Layer Manager for navigation
    layerHandleTabChange(tabId);
    
    // Sync legacy state for panels that still need it
    // (This ensures existing panel components render correctly during migration)
    setActiveOSTab(tabId);
    
    // Close all panels first (Layer Manager handles this, but sync legacy state)
    setShowMojoModal(false);
    setShowTodayPanel(false);
    setShowTopPicksPanel(false);
    setShowServicesPanel(false);
    setShowNearMePanel(false);
    setShowLearnPanel(false);
    setShowConciergeHome(false);
    setConciergeThread({ isOpen: false, threadId: null, thread: null, messages: [] });
    
    // Open the appropriate panel based on tab
    switch (tabId) {
      case 'mojo':
        setShowMojoModal(true);
        break;
      case 'today':
        setShowTodayPanel(true);
        break;
      case 'picks':
        setShowTopPicksPanel(true);
        break;
      case 'services':
        setShowServicesPanel(true);
        break;
      case 'nearme':
        setShowNearMePanel(true);
        import('../utils/tdc_intent').then(({ tdc }) =>
          tdc.nearme({ query: `near me for ${pet?.name || 'my dog'}`, pillar: 'platform', pet, channel: 'mira_os_nearme_tab' })
        );
        break;
      case 'learn':
        setShowLearnPanel(true);
        break;
      case 'concierge':
        setShowConciergeHome(true);
        break;
      default:
        // Unknown tab or clicking same tab (return to chat)
        break;
    }
  }, [layerHandleTabChange]);

  // ═══════════════════════════════════════════════════════════════════════════════
  // QUICK CONCIERGE HANDLER - Show modal when C° is clicked in GLOW state
  // ═══════════════════════════════════════════════════════════════════════════════
  const handleConciergeClick = useCallback((suggestionContext) => {
    if (suggestionContext) {
      // C° was clicked while in GLOW state - show quick modal
      setShowQuickConciergeModal(true);
    } else {
      // Normal click - go to concierge tab
      handleOSTabChange('concierge');
    }
  }, [handleOSTabChange]);

  // ═══════════════════════════════════════════════════════════════════════════════
  // CHAT CONTINUITY - Scroll position preservation (Bible Section 3.1)
  // Note: messagesContainerRef is defined later in the file at Refs section
  // We'll wire this up after the ref is created using useEffect
  // ═══════════════════════════════════════════════════════════════════════════════
  
  // Chat continuity state (managed here, not in hook, for proper ref access)
  const [chatScrollPosition, setChatScrollPosition] = useState(0);
  const [showNewMessagesPill, setShowNewMessagesPill] = useState(false);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const chatScrollRef = useRef({ isAtBottom: true, savedPosition: 0 });
  const prevMessageCountRef = useRef(0);

  // ═══════════════════════════════════════════════════════════════════════════════
  // DRAFT PERSISTENCE - Pet-scoped drafts with 30-min TTL (Bible Section 3.2)
  // ═══════════════════════════════════════════════════════════════════════════════
  const {
    draftText,
    updateDraft,
    clearDraft,
    petSwitchBanner,
    dismissBanner,
    sendForOldPet,
    sendForNewPet,
    hasDraftForPet,
  } = useDraft({
    currentPetId: pet?.id,
    currentPetName: pet?.name,
    allPets: allPets,
    onPetSwitchWithDraft: (info) => {
      console.log('[Draft] Pet switch with draft:', info);
      // Toast notification for draft saved
      if (info.draftText && info.draftText.trim()) {
        toast({
          title: `Draft saved for ${info.oldPetName}`,
          description: `Now chatting about ${info.newPetName}`,
          duration: 4000,
        });
      }
    },
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // DRAFT → QUERY SYNC - Load draft into query when pet changes (Bible Section 3.2)
  // ═══════════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    // When draftText changes (e.g., after pet switch), sync to query
    // Only sync if draftText is non-empty and query is empty (avoid overwriting user's current typing)
    if (draftText && !query) {
      setQuery(draftText);
      console.log('[Draft] Synced draft to query:', draftText.substring(0, 30));
    }
  }, [draftText]); // Note: intentionally not including query to avoid loops
  
  // State
  const [activeScenario, setActiveScenario] = useState(null);
  const [showScenarios, setShowScenarios] = useState(true);
  // Remember if user dismissed Test Scenarios modal
  const [showTestScenarios, setShowTestScenarios] = useState(false); // Hidden by default for cleaner UI
  const [collapsedSections, setCollapsedSections] = useState({});
  const [currentTicket, setCurrentTicket] = useState(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const [currentPillar, setPillar] = useState('general'); // Default to 'general' not 'celebrate'
  const [lastShownProducts, setLastShownProducts] = useState([]);
  // INTELLIGENCE: Track search context for follow-up queries ("cheaper ones", "show me more")
  const [lastSearchContext, setLastSearchContext] = useState(null);
  // MEMORY WHISPER: Track active memory context for whisper display
  const [activeMemoryContext, setActiveMemoryContext] = useState(null);
  const [isRecording, setIsRecording] = useState(false); // For universal search voice
  // SOUL SCORE: Track when score updates for glow animation
  const [soulScoreUpdated, setSoulScoreUpdated] = useState(false);
  // SOUL FORM MODAL: Quick questions to enrich pet profile
  const [showSoulFormModal, setShowSoulFormModal] = useState(false);
  // MOJO PROFILE MODAL: Pet Identity Layer - The Pet Operating System Core
  const [showMojoModal, setShowMojoModal] = useState(false);
  const [mojoDeepLink, setMojoDeepLink] = useState(null); // 'soul' to auto-scroll to soul section
  // PET OS NAVIGATION: Active tab state for the 7-layer OS navigation
  const [activeOSTab, setActiveOSTab] = useState('today'); // Default to TODAY layer
  // TODAY PANEL: Time-sensitive reminders and alerts
  const [showTodayPanel, setShowTodayPanel] = useState(false);
  // SERVICES PANEL: Execution Layer - Active requests and service launchers
  const [showServicesPanel, setShowServicesPanel] = useState(false);
  const [showNearMePanel, setShowNearMePanel] = useState(false);
  // SERVICES TAB PULSE: Visual feedback when AI creates a ticket
  // Using a ref + forceUpdate pattern to avoid re-render cascades
  const servicesPulseRef = useRef(false);
  const [, forceServicesPulseRender] = useState(0);
  
  const setServicesPulse = useCallback((value) => {
    servicesPulseRef.current = value;
    forceServicesPulseRender(prev => prev + 1);
  }, []);
  
  const servicesPulse = servicesPulseRef.current;
  
  // HIGHLIGHTED SERVICE: Which service launcher to highlight (e.g., "grooming")
  const [highlightedService, setHighlightedService] = useState(null);
  
  // LEARN PANEL: Knowledge Layer - Curated guides and videos
  const [showLearnPanel, setShowLearnPanel] = useState(false);
  // SERVICE REQUEST BUILDER: New request builder modal state
  const [requestBuilderState, setRequestBuilderState] = useState({ isOpen: false, service: null });
  // PENDING CONCIERGE CONTEXT: From LEARN "Ask Mira" flow
  const [pendingConciergeContext, setPendingConciergeContext] = useState(null);
  
  // CONCIERGE HOME PANEL: New Concierge® OS Layer home screen
  const [showConciergeHome, setShowConciergeHome] = useState(false);
  // CONCIERGE THREAD PANEL: Conversation detail view
  const [conciergeThread, setConciergeThread] = useState({ isOpen: false, threadId: null, thread: null, messages: [] });
  
  // NOTE: showTopPicksPanel, showUnifiedVault, isProcessing now come from useMiraUI hook
  // NOTE: proactiveAlerts, proactiveGreeting, currentWeather now come from useProactiveAlerts hook
  
  // Core conversation state (query remains here)
  const [query, setQuery] = useState('');
  
  // NOTE: Pet state (pet, setPet, allPets, setAllPets) now comes from usePet hook above
  // NOTE: conversationHistory, conversationContext, quickReplies, etc. now come from useConversation hook
  // NOTE: UI modals/panels/processing states now come from useMiraUI hook
  
  // UI helpers (not moved to hook - specific to learn feature)
  const [learnVideos, setLearnVideos] = useState([]);
  const [learnLoading, setLearnLoading] = useState(false);
  const [learnCategory, setLearnCategory] = useState('recommended');
  const [hasNewVideos, setHasNewVideos] = useState(false);
  const [newVideosCount, setNewVideosCount] = useState(0);
  const [activeDockItem, setActiveDockItem] = useState(null);
  
  // NOTE: showHelpModal, showLearnModal, miraMode, isTyping now come from useMiraUI hook
  const [typingText, setTypingText] = useState(''); // For typing animation
  
  // NOTE: Voice state (voiceEnabled, isSpeaking, audioRef) now comes from useVoice hook above
  // Refs for voice timing (still needed for handleSubmit)
  const voiceTimeoutRef = useRef(null);
  // NOTE: skipVoiceOnNextResponseRef REMOVED - now using skipNextVoice() from useVoice hook
  
  // NOTE: showOlderMessages, VISIBLE_MESSAGE_COUNT, conversationContext now come from useConversation hook
  
  // GEOLOCATION - Get user's actual location for weather/nearby
  const [userGeoLocation, setUserGeoLocation] = useState(null);
  const [userCity, setUserCity] = useState('Mumbai'); // Fallback
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationModalMode, setLocationModalMode] = useState('prompt'); // 'prompt' or 'change'
  
  // Track if page is fully loaded (for deferring non-critical operations)
  const [isPageReady, setIsPageReady] = useState(false);

  // ═══════════════════════════════════════════════════════════════════════════════
  // SHELL STATE SYNC - Bridges legacy state to new shell state model
  // Must be placed AFTER all useState declarations but BEFORE useEffects that use them
  // ═══════════════════════════════════════════════════════════════════════════════
  
  // Sync quick replies from legacy state to shell
  useEffect(() => {
    if (quickReplies && quickReplies.length > 0) {
      console.log('[SHELL DEBUG] Raw quickReplies:', JSON.stringify(quickReplies));
      
      // Convert legacy format to shell format
      const shellOptions = quickReplies.map((qr, idx) => ({
        id: qr.id || `qr-${idx}`,
        label: qr.text || qr.label || qr || '', // Also handle if qr is just a string
        value: qr.value || qr.text || qr || '',
        intent: qr.intent_type || null,
      })).filter(opt => opt.label);

      console.log('[SHELL DEBUG] Converted shellOptions:', JSON.stringify(shellOptions));

      if (shellOptions.length > 0) {
        shellActions.setPendingQuestion({
          ticketId: currentTicket?.id || null,
          threadId: sessionId,
          questionId: `chat-${Date.now()}`,
          questionType: 'quick_reply',
          options: shellOptions,
          source: 'backend',
        });
      }
    } else {
      // Clear quick replies when empty
      if (shellState.interactionFooter.quickReplies.options?.length > 0) {
        shellActions.clearQuickReplies();
      }
    }
  }, [quickReplies, currentTicket?.id, sessionId, shellActions, shellState.interactionFooter.quickReplies.options?.length]);

  // Sync modal state to shell for footer suppression
  useEffect(() => {
    const isAnyModalOpen = showHelpModal || showVault || showMojoModal || 
                           showSoulFormModal || requestBuilderState?.isOpen;
    
    if (isAnyModalOpen && !shellState.modal.isOpen) {
      shellActions.openModal('generic', null);
    } else if (!isAnyModalOpen && shellState.modal.isOpen) {
      shellActions.closeModal();
    }
  }, [showHelpModal, showVault, showMojoModal, showSoulFormModal, requestBuilderState?.isOpen, 
      shellState.modal.isOpen, shellActions]);

  // ═══════════════════════════════════════════════════════════════════════════════
  // ICON STATE API - Real data from unified Service Desk ticket spine
  // Single endpoint: /api/os/icon-state - enforces uniform service flow
  // ═══════════════════════════════════════════════════════════════════════════════
  const {
    counts: apiCounts,
    serverStates,
    serverBadges,
    refetch: refetchIconState,
    markTabViewed,
    getDebugInfo,
    loading: iconStateLoading,
    error: iconStateError,
  } = useIconStateAPI({
    petId: pet?.id,
    activeTab: activeOSTab,
    pollInterval: 30000, // Poll every 30 seconds
    enabled: !!pet?.id, // Only fetch when we have a pet
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // ICON STATE SYSTEM - OFF/ON/PULSE (Bible Section 2)
  // Now powered by real API data from unified Service Desk ticket spine
  // 
  // CRITICAL FIX: miraPicks.hasNew must trigger PICKS indicator PULSE
  // When Mira recommends products, services, OR PLACES, the indicator must light up
  // ═══════════════════════════════════════════════════════════════════════════════
  
  // Merge local miraPicks.hasNew with API counts for real-time indicator updates
  const mergedCounts = useMemo(() => {
    // Count ALL types of picks: products, services, places, conciergeArranges
    const productsCount = miraPicks?.products?.length || 0;
    const servicesCount = miraPicks?.services?.length || 0;
    const placesCount = miraPicks?.places?.length || 0;
    const conciergeArrangesCount = miraPicks?.conciergeArranges?.length || 0;
    const localPicksCount = productsCount + servicesCount + placesCount + conciergeArrangesCount;
    
    // hasNew flag means Mira just recommended something
    const hasLocalNewPicks = miraPicks?.hasNew === true && localPicksCount > 0;
    
    // Check if there's an actionable suggestion for Concierge® GLOW state
    const hasActionableSuggestion = actionableSuggestion !== null;
    
    console.log('[ICON STATE DEBUG] miraPicks:', JSON.stringify({
      hasNew: miraPicks?.hasNew,
      products: productsCount,
      services: servicesCount,
      places: placesCount,
      conciergeArranges: conciergeArrangesCount,
      total: localPicksCount,
      willPulse: hasLocalNewPicks,
      hasActionableSuggestion
    }));
    
    return {
      ...apiCounts,
      // Override picks counts with local state if Mira just added picks
      picksCount: Math.max(apiCounts?.picksCount || 0, localPicksCount, picksCount || 0),
      newPicksSinceLastView: hasLocalNewPicks ? localPicksCount : (apiCounts?.newPicksSinceLastView || 0),
      // CONCIERGE GLOW: Pass actionable suggestion state
      hasActionableSuggestion,
      suggestionContext: actionableSuggestion,
    };
  }, [apiCounts, miraPicks, actionableSuggestion]);
  
  const {
    iconStates,
    mojoState,
    todayState,
    servicesState,
    conciergeState,
    picksState,
    learnState,
    markTabVisited,
    getDebugData,
  } = useIconState({
    currentPetId: pet?.id,
    // REAL COUNTS from backend API + local miraPicks.hasNew for real-time updates
    counts: mergedCounts,
    activeTab: activeOSTab,
  });
  
  // Mark page as ready after initial render
  useEffect(() => {
    const timer = setTimeout(() => setIsPageReady(true), 1000);
    return () => clearTimeout(timer);
  }, []);
  
  // Initialize haptic audio context on first user interaction (required for iOS)
  useEffect(() => {
    if (!isPageReady) return;
    
    const initHapticAudio = () => {
      hapticFeedback.init();
      document.removeEventListener('touchstart', initHapticAudio);
      document.removeEventListener('click', initHapticAudio);
    };
    
    document.addEventListener('touchstart', initHapticAudio, { once: true });
    document.addEventListener('click', initHapticAudio, { once: true });
    
    return () => {
      document.removeEventListener('touchstart', initHapticAudio);
      document.removeEventListener('click', initHapticAudio);
    };
  }, [isPageReady]);
  
  // URL PARAMETER HANDLING: Handle deep links for tabs (e.g., ?tab=concierge)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    const threadParam = urlParams.get('thread');
    const openConcierge = urlParams.get('openConcierge');
    const ticketParam = urlParams.get('ticket');
    
    // Handle openConcierge=true from FlowModals
    if (openConcierge === 'true') {
      setActiveOSTab('concierge');
      setShowConciergeHome(true);
      if (ticketParam) {
        setConciergeThread(prev => ({ ...prev, threadId: ticketParam }));
      }
      // Clean URL after handling
      window.history.replaceState({}, '', window.location.pathname);
      return;
    }
    
    if (tabParam) {
      // Map URL param to OS tab IDs
      const tabMapping = {
        'mojo': 'mojo',
        'today': 'today', 
        'picks': 'picks',
        'learn': 'learn',
        'concierge': 'concierge',
        'services': 'services'
      };
      
      const targetTab = tabMapping[tabParam.toLowerCase()];
      if (targetTab) {
        setActiveOSTab(targetTab);
        
        // If it's concierge tab and there's a thread param, open that thread
        if (targetTab === 'concierge') {
          setShowConciergeHome(true);
          if (threadParam) {
            // This will be picked up by ConciergeHomePanel to auto-open the thread
            setConciergeThread(prev => ({ ...prev, threadId: threadParam }));
          }
        }
      }
      
      // Clean up URL params after handling (optional - keeps URL clean)
      // window.history.replaceState({}, '', window.location.pathname);
    }
  }, []); // Run once on mount
  
  // Check if we should show location prompt on first visit
  useEffect(() => {
    if (!isPageReady || !token) return;
    
    // Check if user has already set location (localStorage or profile)
    const hasSetLocation = localStorage.getItem('mira_location_set') === 'true';
    const hasProfileLocation = user?.location?.city;
    
    if (!hasSetLocation && !hasProfileLocation) {
      // Show location prompt after a short delay (let user see the page first)
      const timer = setTimeout(() => {
        setLocationModalMode('prompt');
        setShowLocationModal(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isPageReady, token, user?.location?.city]);
  
  // Handle location set from modal
  const handleLocationSet = useCallback(async (city, coords) => {
    setUserCity(city);
    if (coords) {
      setUserGeoLocation(coords);
    }
    
    // Mark as set in localStorage
    localStorage.setItem('mira_location_set', 'true');
    localStorage.setItem('mira_user_city', city);
    
    // Save to user profile
    if (token) {
      try {
        await fetch(`${API_URL}/api/member/location`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            latitude: coords?.latitude,
            longitude: coords?.longitude,
            city: city,
            source: 'mira_demo_modal'
          })
        });
        console.log('[LOCATION] ✅ Saved user location:', city);
      } catch (e) {
        console.log('[LOCATION] Could not save to profile:', e);
      }
    }
    
    // Refresh weather with new city
    fetchWeatherForCity(city);
  }, [token, API_URL]);
  
  // Fetch weather for a specific city
  const fetchWeatherForCity = useCallback(async (city) => {
    try {
      const response = await fetch(`${API_URL}/api/mira/weather/pet-activity?city=${encodeURIComponent(city)}`);
      if (response.ok) {
        const data = await response.json();
        setCurrentWeather(data);
        console.log('[WEATHER] Refreshed for:', city);
      }
    } catch (e) {
      console.log('[WEATHER] Could not fetch:', e);
    }
  }, [API_URL]);
  
  // Handle click on weather/location widget
  const handleLocationClick = useCallback(() => {
    setLocationModalMode('change');
    setShowLocationModal(true);
  }, []);
  
  // Fetch user's geolocation AFTER page is ready (deferred for performance)
  useEffect(() => {
    if (!isPageReady) return;
    
    const detectLocation = async () => {
      // First check if user has a saved location in profile
      if (user?.location?.city) {
        setUserCity(user.location.city);
        console.log('[GEO] ✅ Using saved location from profile:', user.location.city);
        return; // Don't re-detect if we have a recent saved location
      }
      
      // Otherwise, detect fresh location via browser GPS
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            setUserGeoLocation({ latitude, longitude });
            
            // Use our Google reverse geocode API (more reliable)
            try {
              const response = await fetch(
                `${API_URL}/api/geo/reverse?lat=${latitude}&lng=${longitude}`
              );
              const data = await response.json();
              const city = data.city || data.state || 'Your Area';
              setUserCity(city);
              console.log('[GEO] ✅ User location detected via GPS:', city);
              
              // Save to user profile for future use
              if (token) {
                fetch(`${API_URL}/api/member/location`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                  },
                  body: JSON.stringify({
                    latitude,
                    longitude,
                    city: data.city,
                    state: data.state,
                    country: data.country,
                    source: 'mira_demo'
                  })
                });
              }
            } catch (e) {
              console.log('[GEO] Could not reverse geocode:', e);
              // Fallback to Nominatim
              try {
                const nomResponse = await fetch(
                  `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
                  { headers: { 'User-Agent': 'MiraOS/1.0' } }
                );
                const nomData = await nomResponse.json();
                const city = nomData.address?.city || nomData.address?.town || nomData.address?.state || 'Your Area';
                setUserCity(city);
              } catch (nomError) {
                console.log('[GEO] Nominatim fallback also failed');
              }
            }
          },
          async (error) => {
            console.log('[GEO] Browser geolocation failed:', error.message);
            // Fallback: Try IP-based geolocation
            try {
              const ipResponse = await fetch('https://ipapi.co/json/');
              const ipData = await ipResponse.json();
              if (ipData.city) {
                setUserCity(ipData.city);
                console.log('[GEO] ✅ Location detected via IP:', ipData.city);
              }
            } catch (ipError) {
              console.log('[GEO] IP geolocation also failed');
            }
          },
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
        );
      } else {
        // No geolocation support - try IP fallback
        try {
          const ipResponse = await fetch('https://ipapi.co/json/');
          const ipData = await ipResponse.json();
          if (ipData.city) {
            setUserCity(ipData.city);
            console.log('[GEO] ✅ Location detected via IP (no GPS):', ipData.city);
          }
        } catch (e) {
          console.log('[GEO] No location detection available');
        }
      }
    };
    
    detectLocation();
  }, [isPageReady, user?.location?.city, token]);
  
  // Cleanup voice on unmount to prevent memory leaks and double voice
  useEffect(() => {
    return () => {
      if (voiceTimeoutRef.current) {
        clearTimeout(voiceTimeoutRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);
  
  // Typing animation - streams text character by character
  const typeText = useCallback((fullText, onComplete, speed = 35) => {
    if (!fullText) {
      onComplete?.();
      return;
    }
    
    setIsTyping(true);
    setTypingText('');
    let index = 0;
    
    const interval = setInterval(() => {
      if (index < fullText.length) {
        setTypingText(fullText.slice(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
        setIsTyping(false);
        onComplete?.();
      }
    }, 1000 / speed); // speed = chars per second
    
    return () => clearInterval(interval);
  }, []);
  
  // E024: AUTO VOICE PERSONALITY - Mira auto-detects context and adjusts voice
  const detectVoicePersonality = useCallback((text, context = {}) => {
    const lowerText = (text || '').toLowerCase();
    
    // Celebration context - birthdays, parties, milestones, anniversaries
    if (/birthday|celebrate|party|anniversary|congrat|milestone|achievement|🎂|🎉|🎁|hamper|pawty|gotcha/.test(lowerText)) {
      return 'celebration'; // Happy, excited, joyful
    }
    
    // Comfort context - grief, anxiety, loss, emotional support
    if (/passed away|rainbow bridge|grief|anxious|scared|worried|nervous|miss|lost|sad|crying|comfort|sorry for|🌈|💔/.test(lowerText)) {
      return 'comfort'; // Soft, slow, empathetic
    }
    
    // Health context - vet, medical, vaccines, checkups
    if (/vet|vaccine|checkup|health|medical|sick|symptoms|medicine|doctor|hospital|injury|💉|🏥/.test(lowerText)) {
      return 'health'; // Calm, reassuring, clear
    }
    
    // Urgent context - immediate action needed
    if (/urgent|emergency|immediately|asap|right now|critical|danger|alert|⚠️|🚨/.test(lowerText)) {
      return 'urgent'; // Alert but calm
    }
    
    // Travel/Adventure context - trips, hotels, exploring
    if (/travel|trip|journey|hotel|vacation|holiday|adventure|explore|visit|destination|✈️|🚗|🏨/.test(lowerText)) {
      return 'adventure'; // Upbeat, helpful, encouraging
    }
    
    // Grooming/Care context - spa, grooming, bath
    if (/groom|bath|spa|haircut|nail|brush|coat|clean|🛁|✂️/.test(lowerText)) {
      return 'caring'; // Warm, professional
    }
    
    // Food/Nutrition context - meals, treats, diet
    if (/food|meal|treat|diet|nutrition|feeding|recipe|🍖|🦴/.test(lowerText)) {
      return 'informative'; // Helpful, knowledgeable
    }
    
    // Default warm voice
    return 'default'; // Warm, friendly, conversational
  }, []);
  
  // IN-MIRA SERVICE REQUEST - Everything stays in the OS
  // When user clicks a service card, show form here instead of external link
  const [serviceRequestModal, setServiceRequestModal] = useState({
    isOpen: false,
    service: null,  // The service/experience being requested
    formData: {},   // User's input
    isSubmitting: false,
    submitted: false
  });
  
  // NOTE: showPetSelector and setShowPetSelector now come from usePet hook
  const [userHasOptedInForProducts, setUserHasOptedInForProducts] = useState(false);
  
  // MULTI-SESSION MANAGEMENT - Past chats
  const [pastSessions, setPastSessions] = useState([]);
  const [showPastChats, setShowPastChats] = useState(false);
  const [loadingPastChats, setLoadingPastChats] = useState(false);
  
  // NEW CHAT FLOW - Confirmation dialog + Starter chips
  const [showNewChatConfirm, setShowNewChatConfirm] = useState(false);
  const [showStarterChips, setShowStarterChips] = useState(false);
  
  // INACTIVITY AUTO-ARCHIVE: After X mins of no activity, archive conversation to past chats
  const SESSION_TIMEOUT_KEY = 'mira_last_activity';
  const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes for faster archiving
  
  // Initialize from localStorage to persist across page refreshes
  const getStoredLastActivity = () => {
    const stored = localStorage.getItem(SESSION_TIMEOUT_KEY);
    return stored ? parseInt(stored, 10) : Date.now();
  };
  
  const lastActivityRef = useRef(getStoredLastActivity());
  const inactivityTimerRef = useRef(null);
  
  // Reset inactivity timer on any user interaction
  const resetInactivityTimer = useCallback(() => {
    const now = Date.now();
    lastActivityRef.current = now;
    localStorage.setItem(SESSION_TIMEOUT_KEY, now.toString());
  }, []);
  
  // NOTE: conversationComplete, showConversationEndBanner, detectConversationComplete now come from useConversation hook
  
  // Archive conversation helper
  const archiveCurrentConversation = useCallback((reason = 'manual') => {
    if (conversationHistory.length < 2) return;
    
    const sessionToArchive = {
      id: `session_${Date.now()}`,
      date: new Date().toISOString(),
      pet_name: pet.name,
      pet_id: pet.id,
      messages: conversationHistory,
      summary: conversationHistory.find(m => m.type === 'user')?.content?.slice(0, 50) || 'Conversation',
      archived_reason: reason
    };
    
    setPastSessions(prev => [sessionToArchive, ...prev]);
    setConversationHistory([]);
    clearPicks(); // Use hook's clearPicks function
    setConversationComplete(false);
    setShowConversationEndBanner(false);
    setClarifyingQuestionCount(0);  // Reset question counter
    lastActivityRef.current = Date.now();
    
    console.log(`[MIRA] Conversation archived: ${reason}`);
  }, [conversationHistory, pet.name, pet.id, clearPicks]);
  
  // Check for inactivity and archive conversation
  useEffect(() => {
    const checkInactivity = () => {
      const storedLastActivity = getStoredLastActivity();
      const timeSinceLastActivity = Date.now() - storedLastActivity;
      
      console.log(`[INACTIVITY] Time since last activity: ${Math.round(timeSinceLastActivity / 1000)}s`);
      
      if (timeSinceLastActivity >= INACTIVITY_TIMEOUT_MS && conversationHistory.length > 1) {
        console.log('[INACTIVITY] Archiving conversation due to timeout');
        archiveCurrentConversation('inactivity');
        localStorage.removeItem(SESSION_TIMEOUT_KEY);
      }
    };
    
    // Check immediately on mount (handles page refresh after long absence)
    checkInactivity();
    
    // Check every 30 seconds for faster detection
    inactivityTimerRef.current = setInterval(checkInactivity, 30 * 1000);
    
    // Track user activity
    const handleActivity = () => resetInactivityTimer();
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    
    return () => {
      if (inactivityTimerRef.current) clearInterval(inactivityTimerRef.current);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
    };
  }, [conversationHistory, archiveCurrentConversation, resetInactivityTimer]);
  
  // Check for conversation completion after each message
  useEffect(() => {
    if (conversationHistory.length > 0 && detectConversationComplete(conversationHistory)) {
      setConversationComplete(true);
      // Show banner after a short delay
      setTimeout(() => {
        setShowConversationEndBanner(true);
      }, 1500);
    }
  }, [conversationHistory, detectConversationComplete]);
  
  // NOTE: showInsightsPanel, showConciergePanel now come from useMiraUI hook
  const [latestInsights, setLatestInsights] = useState([]); // Collected from all messages
  
  // ═══════════════════════════════════════════════════════════════════════════
  // CONCIERGE CONFIRMATION - Service Request Received Banner
  // Part of UNIFORM SERVICE FLOW: User → Mira Ticket → Admin Notification → Concierge®
  // ═══════════════════════════════════════════════════════════════════════════
  const [conciergeConfirmation, setConciergeConfirmation] = useState(null);
  
  // NOTE: quickReplies now comes from useConversation hook
  
  // ═══════════════════════════════════════════════════════════════════════════
  // HANDOFF SUMMARY - Shows summary BEFORE sending to Concierge®
  // User confirms before handoff happens
  // ═══════════════════════════════════════════════════════════════════════════
  const [handoffSummary, setHandoffSummary] = useState(null);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // NOTE: Vault state (showVault, activeVaultData, vaultUserMessage, miraPicks, 
  // showMiraTray) now comes from useVault hook above
  // NOTE: showConciergeOptions now comes from useMiraUI hook
  // NOTE: proactiveAlerts, proactiveGreeting, currentWeather now come from useProactiveAlerts hook
  // ═══════════════════════════════════════════════════════════════════════════
  
  // HEALTH VAULT - Track completeness and prompt for missing data
  const [healthVault, setHealthVault] = useState({
    completeness: 0, // Start at 0, will update when pet data loads
    missing_fields: [],
    showWizard: false,
    currentField: null
  });
  
  // PERSONALIZATION TICKER - Moving ticker at top
  const [tickerItems, setTickerItems] = useState([]);
  
  // SOUL KNOWLEDGE - Rich data for the dynamic ticker
  const [soulKnowledge, setSoulKnowledge] = useState({
    items: [],
    soulScore: 0,
    encourageCompletion: false
  });
  
  // QUICK SOUL QUESTIONS - Dynamic questions for this session (max 3)
  const [quickQuestions, setQuickQuestions] = useState([]);
  const [sessionQuestionsAsked, setSessionQuestionsAsked] = useState(0);
  const [showSoulQuestionPrompts, setShowSoulQuestionPrompts] = useState(true);
  const MAX_QUESTIONS_PER_SESSION = 3;
  
  // E027: DAILY DIGEST
  const [dailyDigest, setDailyDigest] = useState(null);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // TYPING ANIMATION - Stream text like a real assistant
  // ═══════════════════════════════════════════════════════════════════════════
  // NOTE: isTyping, showSkeleton now come from useMiraUI hook
  const [displayedText, setDisplayedText] = useState('');
  const typingTimeoutRef = useRef(null);
  
  // Typing speeds per mode (chars per second)
  const TYPING_SPEEDS = {
    default: 40,
    celebration: 50,
    comfort: 20,
    emergency: 30,
    adventure: 45,
    informative: 35,
    caring: 35,
    health: 30
  };
  
  // Stream text with typing animation
  const streamTextAnimation = useCallback(async (text, mode = 'default') => {
    const speed = TYPING_SPEEDS[mode] || TYPING_SPEEDS.default;
    const charDelay = 1000 / speed; // ms per character
    
    setIsTyping(true);
    setDisplayedText('');
    
    // Split into words for more natural feel
    const words = text.split(' ');
    let currentText = '';
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      // Add word with space
      currentText += (i > 0 ? ' ' : '') + word;
      setDisplayedText(currentText);
      
      // Variable delay - longer for punctuation
      let delay = charDelay * word.length;
      if (word.endsWith('.') || word.endsWith('!') || word.endsWith('?')) {
        delay += 150; // Pause after sentences
      } else if (word.endsWith(',')) {
        delay += 50; // Small pause after commas
      }
      
      // Cap delay to prevent too slow
      delay = Math.min(delay, 200);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    setIsTyping(false);
    return text;
  }, []);
  
  // E028: MILESTONES
  const [milestones, setMilestones] = useState([]);
  
  // E030: MEMORY LANE
  const [memoryLane, setMemoryLane] = useState([]);
  
  // E034: REORDER SUGGESTIONS
  const [reorderSuggestions, setReorderSuggestions] = useState([]);
  
  // NOTE: Session state (sessionId, sessionRecovered) now comes from useSession hook above
  // NOTE: conversationStage, clarifyingQuestionCount, MAX_CLARIFYING_QUESTIONS now come from useConversation hook
  
  // Step tracking - ANTI-LOOP SYSTEM
  // Tracks which steps (questions) have been asked and answered
  const [completedSteps, setCompletedSteps] = useState([]);  // List of step_ids that are done
  const [currentStep, setCurrentStep] = useState(null);  // Currently open step waiting for answer
  const [stepHistory, setStepHistory] = useState([]);  // Full history of Q&A
  
  // WEATHER & INTERACTIVE FEATURES
  // NOTE: currentWeather now comes from useProactiveAlerts hook
  // NOTE: showFeatureShowcase now comes from useMiraUI hook
  
  // Feature showcase items - What Mira can do
  const MIRA_FEATURES = [
    { 
      id: 'weather', 
      icon: '🌤️', 
      title: 'Weather & Walks', 
      description: 'Is it safe to walk?',
      query: `Is it a good day to take ${pet?.name || 'my dog'} for a walk?`,
      color: '#3B82F6'
    },
    { 
      id: 'vet', 
      icon: '🏥', 
      title: 'Find a Vet', 
      description: 'Nearest clinics',
      query: `Find me a vet clinic nearby`,
      color: '#EF4444'
    },
    { 
      id: 'park', 
      icon: '🌳', 
      title: 'Dog Parks', 
      description: 'Places to play',
      query: `Where can I take ${pet?.name || 'my dog'} to a dog park?`,
      color: '#22C55E'
    },
    { 
      id: 'food', 
      icon: '🍽️', 
      title: 'Pet Cafes', 
      description: 'Dine with your pet',
      query: `Recommend a pet-friendly cafe for brunch`,
      color: '#F97316'
    },
    { 
      id: 'travel', 
      icon: '✈️', 
      title: 'Travel', 
      description: 'Pet-friendly stays',
      query: `Find pet-friendly hotels for a trip`,
      color: '#8B5CF6'
    },
    { 
      id: 'shop', 
      icon: '🛍️', 
      title: 'Shop', 
      description: 'Treats & supplies',
      query: `Show me treats for ${pet?.name || 'my dog'}`,
      color: '#EC4899'
    }
  ];
  
  // Refs
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const servicesTabRef = useRef(null); // Ref for onboarding tooltip anchor
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // CHAT CONTINUITY IMPLEMENTATION (Bible Section 3.1)
  // Wired to messagesContainerRef after it's created
  // ═══════════════════════════════════════════════════════════════════════════════
  
  const BOTTOM_THRESHOLD = 100; // pixels from bottom to consider "at bottom"
  
  // Check if user is at bottom of chat
  const checkIfAtBottom = useCallback(() => {
    if (!messagesContainerRef.current) return true;
    const container = messagesContainerRef.current;
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    return distanceFromBottom <= BOTTOM_THRESHOLD;
  }, []);
  
  // Save scroll position (call before navigating away)
  const saveScrollPosition = useCallback(() => {
    if (!messagesContainerRef.current) return;
    chatScrollRef.current.savedPosition = messagesContainerRef.current.scrollTop;
    chatScrollRef.current.isAtBottom = checkIfAtBottom();
    console.log('[ChatContinuity] Saved scroll position:', chatScrollRef.current.savedPosition, 'isAtBottom:', chatScrollRef.current.isAtBottom);
  }, [checkIfAtBottom]);
  
  // Restore scroll position (call when returning to chat)
  const restoreScrollPosition = useCallback(() => {
    if (!messagesContainerRef.current || chatScrollRef.current.savedPosition === 0) return;
    requestAnimationFrame(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = chatScrollRef.current.savedPosition;
        console.log('[ChatContinuity] Restored scroll position:', chatScrollRef.current.savedPosition);
      }
    });
  }, []);
  
  // Scroll to bottom
  const scrollToChatBottom = useCallback((smooth = true) => {
    if (!messagesContainerRef.current) return;
    messagesContainerRef.current.scrollTo({
      top: messagesContainerRef.current.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto'
    });
    setShowNewMessagesPill(false);
    setNewMessageCount(0);
  }, []);
  
  // Handle scroll to first unread (when clicking "New messages" pill)
  const scrollToFirstUnread = useCallback(() => {
    scrollToChatBottom();
    setShowNewMessagesPill(false);
    setNewMessageCount(0);
  }, [scrollToChatBottom]);
  
  // Handle new messages - Per Bible: Auto-scroll only if user is at bottom
  useEffect(() => {
    const currentCount = conversationHistory.length;
    const prevCount = prevMessageCountRef.current;
    
    if (currentCount > prevCount && prevCount > 0) {
      const newMsgCount = currentCount - prevCount;
      const isAtBottom = checkIfAtBottom();
      
      if (isAtBottom) {
        // User is at bottom → auto-scroll to new messages
        scrollToChatBottom();
        console.log('[ChatContinuity] Auto-scrolled to new messages');
      } else {
        // User is scrolled up → show "New messages" pill, don't auto-scroll
        setShowNewMessagesPill(true);
        setNewMessageCount(prev => prev + newMsgCount);
        console.log('[ChatContinuity] New messages arrived, showing pill. Count:', newMsgCount);
      }
    }
    
    prevMessageCountRef.current = currentCount;
  }, [conversationHistory.length, checkIfAtBottom, scrollToChatBottom]);
  
  // Listen for scroll events to update isAtBottom and clear pill when scrolled to bottom
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    
    const handleScroll = () => {
      const isAtBottom = checkIfAtBottom();
      chatScrollRef.current.isAtBottom = isAtBottom;
      
      // Clear pill when user scrolls to bottom
      if (isAtBottom && showNewMessagesPill) {
        setShowNewMessagesPill(false);
        setNewMessageCount(0);
      }
    };
    
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [checkIfAtBottom, showNewMessagesPill]);
  
  // Save scroll position when opening any panel (tab switch)
  useEffect(() => {
    if (!isAtChatHome) {
      saveScrollPosition();
    } else {
      // Returning to chat - restore position
      restoreScrollPosition();
    }
  }, [isAtChatHome, saveScrollPosition, restoreScrollPosition]);

  // LOAD REAL PET DATA when user is logged in
  useEffect(() => {
    const loadUserPets = async () => {
      if (!token) return;
      
      try {
        console.log('[PETS] Loading user pets...');
        const response = await fetch(`${API_URL}/api/pets`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.pets && data.pets.length > 0) {
            console.log('[PETS] Loaded', data.pets.length, 'pets');
            
            // Transform pets to include soul traits
            const transformedPets = data.pets.map(p => {
              // ── Deduplicated soul traits (Bible §2.3) ────────────────────────
              const soulAnswers = p.doggy_soul_answers || {};
              const soulTraits = [];
              const _seen = new Set();
              const _addChip = (label, icon, color) => {
                const key = label?.toLowerCase().trim();
                if (key && !_seen.has(key)) { _seen.add(key); soulTraits.push({ label, icon, color }); }
              };
              // Health first
              const _allergies = soulAnswers.food_allergies;
              const _allergyList = Array.isArray(_allergies) ? _allergies : (_allergies ? [_allergies] : []);
              const _allergyFiltered = _allergyList.filter(a => {
                const v = String(a).toLowerCase().trim();
                return v && !['none','none known','no_allergies','no','na','n/a','not sure','unknown','no allergies','not known'].includes(v);
              });
              if (_allergyFiltered.length > 0) _addChip(`${_allergyFiltered[0]}-free`, '🌿', '#10b981');
              const _energy = soulAnswers.energy_level;
              // Truncate + clean: remove "energy", "and", extra words
              const _energyClean = _energy
                ? _energy.split(',')[0].replace(/\benergy\b/gi,'').replace(/\band\b/gi,' ').replace(/[,;:.]/g,'').replace(/\s+/g,' ').trim().split(' ').slice(0,2).join(' ').trim()
                : null;
              if (_energyClean) _addChip(`${_energyClean} energy`, '⚡', '#f59e0b');
              const _nature = soulAnswers.general_nature;
              if (_nature && _nature.toLowerCase() !== String(_energy).toLowerCase()) _addChip(`${_nature} nature`, '⭐', '#8b5cf6');
              const _words = soulAnswers.describe_3_words?.split(',')[0]?.trim();
              if (_words && _words.toLowerCase() !== _nature?.toLowerCase()) _addChip(_words, '🎀', '#ec4899');
              if (soulAnswers.other_pets === 'yes' || soulAnswers.other_pets === true) _addChip('social butterfly', '🐾', '#3b82f6');
              if (soulTraits.length === 0 && p.name) soulTraits.push({ label: `${p.name}'s soul`, icon: '✨', color: '#9333ea' });
              
              // Get sensitivities/allergies
              const sensitivities = [];
              if (p.preferences?.allergies) {
                if (Array.isArray(p.preferences.allergies)) {
                  sensitivities.push(...p.preferences.allergies.map(a => `${a} allergy`));
                } else if (typeof p.preferences.allergies === 'string' && p.preferences.allergies !== 'None') {
                  sensitivities.push(`${p.preferences.allergies} allergy`);
                }
              }
              if (p.health_vault?.allergies) {
                p.health_vault.allergies.forEach(a => {
                  sensitivities.push(`${a.allergen} allergy`);
                });
              }
              
              return {
                id: p.id,
                name: p.name,
                breed: p.breed,
                age: p.age_years ? `${p.age_years} years` : '',
                photo: p.photo_url ? `${API_URL}${p.photo_url}` : null,
                soulScore: Math.round(p.overall_score || 0),
                soulTraits: soulTraits.length > 0 ? soulTraits : [
                  { label: 'Unique soul', icon: '⭐', color: '#f59e0b' }
                ],
                sensitivities: sensitivities,
                favorites: p.preferences?.favorite_flavors || [],
                personality: p.soul?.persona || 'friendly',
                // Include full data for MOJO modal
                doggy_soul_answers: p.doggy_soul_answers || {},
                preferences: p.preferences || {},
                soul: p.soul || {},
                health_vault: p.health_vault || {},
                overall_score: p.overall_score || 0
              };
            });
            
            console.log('[PETS-API] Setting allPets with scores:', transformedPets.map(p => ({name: p.name, soulScore: p.soulScore})));
            setAllPets(transformedPets);
            if (transformedPets.length > 0) {
              setPet(transformedPets[0]);
            }
          }
        }
      } catch (err) {
        console.warn('[PETS] Failed to load pets:', err);
      }
    };
    
    loadUserPets();
  }, [token]);
  
  // SESSION RECOVERY - Now handled by useSession hook
  // The hook auto-recovers session on mount, but we need to set conversation history
  useEffect(() => {
    const recoverSession = async () => {
      if (sessionRecovered || !sessionId) return;
      
      try {
        console.log('[SESSION] Attempting to recover session:', sessionId);
        const response = await fetch(`${API_URL}/api/mira/session/${sessionId}/messages?limit=50`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.messages && data.messages.length > 0) {
            console.log('[SESSION] Recovered', data.messages.length, 'messages');
            
            // Convert backend format to frontend format
            const recoveredHistory = data.messages.map(msg => ({
              type: msg.role === 'user' ? 'user' : 'mira',
              content: msg.content,
              timestamp: msg.timestamp,
              intent: msg.intent,
              executionType: msg.execution_type,
              products: msg.products || []
            }));
            
            setConversationHistory(recoveredHistory);
            setSessionRecovered(true);
          }
        } else if (response.status === 404) {
          console.log('[SESSION] New session, no history to recover');
          setSessionRecovered(true);
        }
      } catch (err) {
        console.warn('[SESSION] Recovery failed:', err);
        setSessionRecovered(true);
      }
    };
    
    recoverSession();
  }, [sessionId, sessionRecovered, setSessionRecovered]);
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // IDLE TIMEOUT - Auto-save conversation after 5 minutes of inactivity
  // ═══════════════════════════════════════════════════════════════════════════════
  const idleTimerRef = useRef(null);
  
  // Clear session function (for "New Chat" button)
  // Wraps hook's startNewSession with additional state clearing
  const startNewSession = useCallback(() => {
    // Use hook's base function for session ID management
    const newSessionId = baseStartNewSession();
    
    // Clear conversation-related state
    setConversationHistory([]);
    setCompletedSteps([]);
    setCurrentStep(null);
    setStepHistory([]);
    setConversationStage('initial');
    setUserHasOptedInForProducts(false);
    setShowPastChats(false);
    
    // Clear picks/tips (tip cards are session-specific)
    clearPicks();
    
    // Show starter chips after new chat
    setShowStarterChips(true);
    
    console.log('[SESSION] Started new session:', newSessionId, 'for pet:', pet.name);
    return newSessionId;
  }, [baseStartNewSession, pet.name, clearPicks]);
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // NEW CHAT FLOW - Smart handler with confirmation if draft/awaiting exists
  // ═══════════════════════════════════════════════════════════════════════════════
  
  // Check if user has unfinished work (draft text or awaiting ticket)
  const hasUnfinishedWork = useCallback(() => {
    const hasDraft = query && query.trim().length > 0;
    const hasAwaitingTicket = apiCounts?.awaitingYouCount > 0;
    return { hasDraft, hasAwaitingTicket, hasAny: hasDraft || hasAwaitingTicket };
  }, [query, apiCounts?.awaitingYouCount]);
  
  // Handler for "New Chat" button click
  const handleNewChatClick = useCallback(() => {
    const { hasAny, hasDraft } = hasUnfinishedWork();
    
    if (hasAny) {
      // Show confirmation dialog
      setShowNewChatConfirm(true);
    } else {
      // No unfinished work - start new chat directly
      startNewSession();
    }
  }, [hasUnfinishedWork, startNewSession]);
  
  // Confirm handler for NewChatConfirmDialog
  const handleConfirmNewChat = useCallback(() => {
    setShowNewChatConfirm(false);
    setQuery(''); // Clear draft
    startNewSession();
  }, [startNewSession]);
  
  // Cancel handler for NewChatConfirmDialog
  const handleCancelNewChat = useCallback(() => {
    setShowNewChatConfirm(false);
  }, []);
  
  // Handler for StarterChips click
  const handleStarterChipClick = useCallback((chipQuery, chipId) => {
    setShowStarterChips(false);
    if (chipQuery) {
      setQuery(chipQuery);
    }
    // Focus the input
    if (inputRef.current) {
      inputRef.current.focus();
    }
    console.log('[NEW_CHAT] Starter chip clicked:', chipId);
  }, []);
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // IDLE TIMEOUT - Auto-save conversation after 5 minutes of inactivity
  // ═══════════════════════════════════════════════════════════════════════════════
  
  // Save conversation to past chats and start fresh
  const saveAndClearConversation = useCallback(async () => {
    if (conversationHistory.length > 1) { // Only save if there's actual conversation
      try {
        // Save session to backend as completed
        const response = await fetch(`${API_URL}/api/mira/session/${sessionId}/complete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` })
          },
          body: JSON.stringify({
            reason: 'idle_timeout',
            message_count: conversationHistory.length
          })
        });
        
        if (response.ok) {
          console.log('[IDLE] Conversation saved to past chats after 5 minutes idle');
        }
      } catch (err) {
        console.log('[IDLE] Could not save session:', err.message);
      }
      
      // Start a fresh session
      startNewSession();
    }
  }, [sessionId, conversationHistory.length, token, startNewSession]);
  
  // Check for idle timeout every minute
  useEffect(() => {
    const IDLE_TIMEOUT = 5 * 60 * 1000; // 5 minutes in ms
    
    const checkIdle = () => {
      const timeSinceLastActivity = Date.now() - lastActivityRef.current;
      if (timeSinceLastActivity >= IDLE_TIMEOUT && conversationHistory.length > 1) {
        console.log('[IDLE] 5 minutes idle detected, saving conversation');
        saveAndClearConversation();
      }
    };
    
    // Check every 30 seconds
    idleTimerRef.current = setInterval(checkIdle, 30 * 1000);
    
    return () => {
      if (idleTimerRef.current) {
        clearInterval(idleTimerRef.current);
      }
    };
  }, [conversationHistory.length, saveAndClearConversation]);
  
  // FETCH WEATHER DATA for pet activity recommendations
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Priority: pet profile location > geolocation > default
        const weatherCity = pet?.location?.city || pet?.city || userCity;
        const response = await fetch(`${API_URL}/api/mira/weather/pet-activity?city=${encodeURIComponent(weatherCity)}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setCurrentWeather(data);
            console.log('[WEATHER] Loaded weather for', data.city, ':', data.pet_advisory?.safety_level);
          }
        }
      } catch (error) {
        console.log('[WEATHER] Could not load weather:', error.message);
      }
    };
    
    fetchWeather();
    // Refresh weather every 30 minutes
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [pet?.city, pet?.location?.city, userCity]);
  
  // MULTI-PET: Fetch all user's pets
  useEffect(() => {
    const fetchAllPets = async () => {
      if (!token) return;
      try {
        const response = await fetch(`${API_URL}/api/pets/my-pets`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          if (data.pets && data.pets.length > 0) {
            const formattedPets = data.pets.map(p => ({
              id: p.id,
              name: p.name,
              breed: p.breed,
              age: p.age || 'Unknown',
              soulScore: Math.round(p.overall_score || 0), // ADDED: Soul Score!
              // Ensure arrays - doggy_soul_answers fields might be strings
              traits: (() => {
                const raw = p.doggy_soul_answers?.describe_3_words;
                if (!raw) return ['Loving'];
                if (Array.isArray(raw)) return raw;
                if (typeof raw === 'string') return raw.split(',').map(s => s.trim()).filter(Boolean);
                return ['Loving'];
              })(),
              sensitivities: (() => {
                const raw = p.doggy_soul_answers?.health_conditions;
                if (!raw) return [];
                if (Array.isArray(raw)) return raw;
                if (typeof raw === 'string') return raw.split(',').map(s => s.trim()).filter(Boolean);
                return [];
              })(),
              favorites: (() => {
                const raw = p.doggy_soul_answers?.favorite_treats;
                if (!raw) return [];
                if (Array.isArray(raw)) return raw;
                if (typeof raw === 'string') return raw.split(',').map(s => s.trim()).filter(Boolean);
                return [];
              })(),
              photo: p.photo_url ? `${API_URL}${p.photo_url}` : null,
              // Include full data for MOJO modal
              doggy_soul_answers: p.doggy_soul_answers || {},
              preferences: p.preferences || {},
              soul: p.soul || {},
              health_vault: p.health_vault || {},
              overall_score: p.overall_score || 0
            }));
            console.log('[PETS-MY-PETS] Setting allPets with scores:', formattedPets.map(p => ({name: p.name, soulScore: p.soulScore})));
            setAllPets(formattedPets);
            // Set first pet as active if no pet selected
            if (!pet || pet.id === 'demo-pet') {
              setPet(formattedPets[0]);
            }
          }
        }
      } catch (err) {
        console.debug('Could not fetch pets, using demo pet');
      }
    };
    fetchAllPets();
  }, [token]);
  
  // E018 & E019: Fetch proactive alerts when pet changes
  useEffect(() => {
    const fetchProactiveAlerts = async () => {
      // Guard: Skip if still loading pets or using demo pet
      if (isLoadingPets || !pet.id || pet.id.startsWith('demo')) return;
      
      try {
        // Fetch celebrations, health reminders, health vault status, weather, bundles, AND new proactive alerts
        const [celebResponse, healthResponse, vaultResponse, weatherResponse, bundlesResponse, proactiveResponse, picksResponse] = await Promise.all([
          fetch(`${API_URL}/api/mira/celebrations/${pet.id}`),
          fetch(`${API_URL}/api/mira/health-reminders/${pet.id}`),
          fetch(`${API_URL}/api/mira/health-vault/status/${pet.id}`),
          fetch(`${API_URL}/api/mira/weather-suggestions/${pet.id}`),
          fetch(`${API_URL}/api/mira/bundles/${pet.id}`),
          fetch(`${API_URL}/api/mira/proactive/alerts/${pet.id}`),  // NEW: Vaccination, Birthday, Grooming alerts
          fetch(`${API_URL}/api/mira/picks/default/${pet.id}`, {    // NEW: Default picks for pet
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          })
        ]);
        
        const celebData = celebResponse.ok ? await celebResponse.json() : { celebrations: [] };
        const healthData = healthResponse.ok ? await healthResponse.json() : { reminders: [] };
        const vaultData = vaultResponse.ok ? await vaultResponse.json() : { completeness: 100, missing_fields: [] };
        const weatherData = weatherResponse.ok ? await weatherResponse.json() : { suggestions: [] };
        const bundlesData = bundlesResponse.ok ? await bundlesResponse.json() : { bundles: [] };
        const proactiveData = proactiveResponse.ok ? await proactiveResponse.json() : { alerts: [], critical_count: 0 };
        const picksData = picksResponse.ok ? await picksResponse.json() : { picks: [] };
        
        // Load default picks if any
        if (picksData.picks && picksData.picks.length > 0) {
          console.log(`[MIRA] Loaded ${picksData.picks.length} default picks for ${pet.name}`);
          setMiraPicks(prev => ({
            ...prev,
            enginePicks: picksData.picks,
            lastUpdated: new Date().toISOString(),
            hasNew: conversationHistory.length === 0  // Only show as new if no conversation yet
          }));
        }
        
        setProactiveAlerts({
          celebrations: celebData.celebrations || [],
          healthReminders: healthData.reminders || [],
          weatherSuggestions: weatherData.suggestions || [],
          weather: weatherData.weather || {},
          bundles: bundlesData.bundles || [],
          // NEW: Smart proactive alerts (vaccination, birthday, grooming)
          smartAlerts: proactiveData.alerts || [],
          criticalCount: proactiveData.critical_count || 0,
          hasUrgent: healthData.has_urgent || celebData.celebrations?.some(c => c.is_today) || proactiveData.critical_count > 0
        });
        
        // Also fetch places, stats, and new E027-E034 features for ticker
        const placesCity = pet?.location?.city || pet?.city || userCity;
        const [placesResponse, statsResponse, digestResponse, milestonesResponse, memoryResponse, reorderResponse, quickQuestionsResponse] = await Promise.all([
          fetch(`${API_URL}/api/mira/places/${pet.id}?city=${encodeURIComponent(placesCity)}`),
          fetch(`${API_URL}/api/mira/personalization-stats/${pet.id}`),
          fetch(`${API_URL}/api/mira/daily-digest/${pet.id}`),
          fetch(`${API_URL}/api/mira/milestones/${pet.id}`),
          fetch(`${API_URL}/api/mira/memory-lane/${pet.id}`),
          fetch(`${API_URL}/api/mira/reorder-suggestions/${pet.id}`),
          fetch(`${API_URL}/api/pet-soul/profile/${pet.id}/quick-questions?limit=3`)  // NEW: Quick Soul Questions
        ]);
        
        const placesData = placesResponse.ok ? await placesResponse.json() : { places: [] };
        const statsData = statsResponse.ok ? await statsResponse.json() : { stats: [], knowledge_items: [] };
        const digestData = digestResponse.ok ? await digestResponse.json() : { digest: [] };
        const milestonesData = milestonesResponse.ok ? await milestonesResponse.json() : { milestones: [] };
        const memoryData = memoryResponse.ok ? await memoryResponse.json() : { memories: [] };
        const reorderData = reorderResponse.ok ? await reorderResponse.json() : { suggestions: [] };
        const quickQuestionsData = quickQuestionsResponse.ok ? await quickQuestionsResponse.json() : { questions: [] };
        
        // Store new feature data
        setDailyDigest(digestData);
        setMilestones(milestonesData.milestones || []);
        setMemoryLane(memoryData.memories || []);
        setReorderSuggestions(reorderData.suggestions || []);
        
        // NEW: Store quick questions for this session (max 3)
        if (quickQuestionsData.questions && sessionQuestionsAsked < MAX_QUESTIONS_PER_SESSION) {
          setQuickQuestions(quickQuestionsData.questions.slice(0, MAX_QUESTIONS_PER_SESSION - sessionQuestionsAsked));
        }
        
        // NEW: Store soul knowledge for the dynamic ticker
        setSoulKnowledge({
          items: statsData.knowledge_items || [],
          soulScore: statsData.soul_score || 0,
          encourageCompletion: statsData.encourage_soul_completion || false
        });
        
        // Build ticker items (legacy format for backward compatibility)
        const tickerItems = [];
        
        // Add weather
        if (weatherData.weather) {
          const temp = weatherData.weather.temp;
          const icon = temp >= 30 ? '☀️' : temp <= 20 ? '❄️' : '🌤️';
          tickerItems.push({
            icon,
            text: `${temp}°C in ${weatherData.city || placesCity}`,
            type: 'weather'
          });
        }
        
        // Add personalization stats
        statsData.stats?.forEach(s => tickerItems.push(s));
        
        // Add milestones to ticker (E028)
        milestonesData.milestones?.filter(m => m.achieved).slice(0, 2).forEach(m => {
          tickerItems.push({
            icon: m.icon,
            text: m.title,
            type: 'milestone'
          });
        });
        
        // Add memory lane moments to ticker (E030)
        memoryData.memories?.slice(0, 1).forEach(m => {
          tickerItems.push({
            icon: m.icon,
            text: m.title,
            type: 'memory'
          });
        });
        
        // Add places
        placesData.places?.slice(0, 3).forEach(p => {
          tickerItems.push({
            icon: p.icon,
            text: `${p.name} welcomes ${pet.name}`,
            type: 'place',
            placeId: p.id
          });
        });
        
        setTickerItems(tickerItems);
        
        // Update health vault status
        setHealthVault(prev => ({
          ...prev,
          completeness: vaultData.completeness || 0,
          missing_fields: vaultData.missing_fields || [],
          needsAttention: vaultData.needs_attention
        }));
        
        console.log('[PROACTIVE] Alerts loaded:', {
          celebrations: celebData.celebrations?.length || 0,
          health: healthData.reminders?.length || 0,
          vaultCompleteness: vaultData.completeness
        });
      } catch (err) {
        console.debug('[PROACTIVE] Could not fetch alerts:', err);
      }
    };
    
    fetchProactiveAlerts();
  }, [pet.id, isLoadingPets]);
  
  // MULTI-PET: Switch to a different pet
  const switchPet = async (newPet) => {
    if (newPet.id === pet.id) {
      setShowPetSelector(false);
      return;
    }
    
    console.log('[PET SWITCH] Switching to:', newPet.name);
    
    // IMMEDIATELY clear old alerts before switching
    setProactiveAlerts({
      celebrations: [],
      healthReminders: [],
      weatherSuggestions: [],
      weather: {},
      bundles: [],
      smartAlerts: [],
      criticalCount: 0,
      hasUrgent: false
    });
    
    // Reset clarifying question counter
    setClarifyingQuestionCount(0);
    
    setPet(newPet);
    setShowPetSelector(false);
    
    // Try to load this pet's latest session
    try {
      const response = await fetch(`${API_URL}/api/mira/session/switch-pet?pet_id=${newPet.id}&pet_name=${encodeURIComponent(newPet.name)}&pet_breed=${encodeURIComponent(newPet.breed || '')}&member_id=${user?.id || 'demo'}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const newSessionId = data.session_id;
        
        localStorage.setItem('mira_session_id', newSessionId);
        localStorage.setItem('mira_session_pet_id', newPet.id);
        setSessionId(newSessionId);
        
        if (data.is_new) {
          // New session for this pet
          setConversationHistory([]);
          console.log('[PET SWITCH] Created new session for', newPet.name);
        } else {
          // Existing session - load messages
          const recoveredHistory = (data.messages || []).map(msg => ({
            type: msg.role === 'user' ? 'user' : 'mira',
            content: msg.content,
            timestamp: msg.timestamp,
            intent: msg.intent,
            executionType: msg.execution_type,
            products: msg.products || []
          }));
          setConversationHistory(recoveredHistory);
          console.log('[PET SWITCH] Loaded', recoveredHistory.length, 'messages for', newPet.name);
        }
        
        // Reset conversation state
        setCompletedSteps([]);
        setCurrentStep(null);
        setStepHistory([]);
        setConversationStage('initial');
        setUserHasOptedInForProducts(false);
        setCurrentTicket(null);
        // MULTI-PET FIX: Clear Mira Picks when switching pets
        clearPicks();
        // NEW: Fetch default picks for new pet
        fetchDefaultPicks(newPet.id, token, API_URL);
      }
    } catch (err) {
      console.error('[PET SWITCH] Error:', err);
      // Fallback: just start fresh
      startNewSession();
      // MULTI-PET FIX: Also clear Mira Picks on error
      clearPicks();
      // NEW: Still try to fetch default picks
      fetchDefaultPicks(newPet.id, token, API_URL);
    }
  };
  
  // MULTI-SESSION: Load past chats
  const loadPastChats = async () => {
    if (loadingPastChats) return;
    setLoadingPastChats(true);
    
    try {
      const memberId = user?.id || user?.email || 'demo';
      const response = await fetch(`${API_URL}/api/mira/session/list/by-member/${encodeURIComponent(memberId)}?limit=3`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      
      if (response.ok) {
        const data = await response.json();
        setPastSessions(data.sessions || []);
        console.log('[PAST CHATS] Loaded', data.sessions?.length || 0, 'sessions');
      }
    } catch (err) {
      console.error('[PAST CHATS] Error loading:', err);
    }
    
    setLoadingPastChats(false);
  };
  
  // MULTI-SESSION: Load a specific past session
  const loadSession = async (session) => {
    console.log('[LOAD SESSION]', session.session_id);
    
    try {
      const response = await fetch(`${API_URL}/api/mira/session/${session.session_id}/messages?limit=50`);
      
      if (response.ok) {
        const data = await response.json();
        
        // Update session ID
        localStorage.setItem('mira_session_id', session.session_id);
        setSessionId(session.session_id);
        
        // Load messages
        const recoveredHistory = (data.messages || []).map(msg => ({
          type: msg.role === 'user' ? 'user' : 'mira',
          content: msg.content,
          timestamp: msg.timestamp,
          intent: msg.intent,
          executionType: msg.execution_type,
          products: msg.products || []
        }));
        setConversationHistory(recoveredHistory);
        
        // If this session was for a different pet, switch to that pet
        if (session.pet_id && session.pet_id !== pet.id) {
          const sessionPet = allPets.find(p => p.id === session.pet_id);
          if (sessionPet) {
            setPet(sessionPet);
          }
        }
        
        // Reset state
        setCompletedSteps([]);
        setCurrentStep(null);
        setStepHistory([]);
        setShowPastChats(false);
        
        console.log('[LOAD SESSION] Loaded', recoveredHistory.length, 'messages');
      }
    } catch (err) {
      console.error('[LOAD SESSION] Error:', err);
    }
  };
  
  // Format date for past chats display
  const formatSessionDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };
  
  // Helper to ensure array format (used by fetchPetData)
  const ensureArray = useCallback((val, defaultVal = []) => {
    if (!val) return defaultVal;
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') return val.split(',').map(s => s.trim()).filter(Boolean);
    return defaultVal;
  }, []);
  
  // Reusable function to fetch and update pet data
  const refreshPetData = useCallback(async (petId) => {
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/api/pets/my-pets`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.pets && data.pets.length > 0) {
          // Find the specific pet or use first one
          const p = petId 
            ? data.pets.find(pet => pet.id === petId) || data.pets[0]
            : data.pets[0];
          
          const updatedPet = {
            id: p.id,
            name: p.name,
            breed: p.breed,
            age: p.age || 'Unknown',
            photo: p.photo_url ? `${API_URL}${p.photo_url}` : null,
            traits: ensureArray(p.doggy_soul_answers?.describe_3_words, ['Loving']),
            sensitivities: ensureArray(p.doggy_soul_answers?.health_conditions),
            favorites: ensureArray(p.doggy_soul_answers?.favorite_treats),
            // Include full data for MOJO modal
            soulScore: Math.round(p.overall_score || 0),
            doggy_soul_answers: p.doggy_soul_answers || {},
            preferences: p.preferences || {},
            soul: p.soul || {},
            health_vault: p.health_vault || {},
            overall_score: p.overall_score || 0,
            // Include insights data
            learned_facts: p.learned_facts || [],
            conversation_insights: p.conversation_insights || [],
            doggy_soul_meta: p.doggy_soul_meta || {},
          };
          
          setPet(updatedPet);
          console.log('[MiraDemoPage] Pet data refreshed:', p.name, 'learned_facts:', (p.learned_facts || []).length);
          return updatedPet;
        }
      }
    } catch (err) {
      console.error('Failed to refresh pet data:', err);
    }
    return null;
  }, [token, ensureArray]);
  
  // Fetch user's pet if logged in
  useEffect(() => {
    const fetchPet = async () => {
      if (!token) return;
      try {
        const response = await fetch(`${API_URL}/api/pets/my-pets`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          if (data.pets && data.pets.length > 0) {
            const p = data.pets[0];
            setPet({
              id: p.id,
              name: p.name,
              breed: p.breed,
              age: p.age || 'Unknown',
              photo: p.photo_url ? `${API_URL}${p.photo_url}` : null,
              traits: ensureArray(p.doggy_soul_answers?.describe_3_words, ['Loving']),
              sensitivities: ensureArray(p.doggy_soul_answers?.health_conditions),
              favorites: ensureArray(p.doggy_soul_answers?.favorite_treats),
              // Include full data for MOJO modal
              soulScore: Math.round(p.overall_score || 0),
              doggy_soul_answers: p.doggy_soul_answers || {},
              preferences: p.preferences || {},
              soul: p.soul || {},
              health_vault: p.health_vault || {},
              overall_score: p.overall_score || 0,
              // Include insights data
              learned_facts: p.learned_facts || [],
              conversation_insights: p.conversation_insights || [],
              doggy_soul_meta: p.doggy_soul_meta || {},
            });
          }
        }
      } catch (err) {
        console.debug('Using demo pet');
      }
    };
    fetchPet();
  }, [token, ensureArray]);
  
  // Auto-scroll to bottom
  const scrollToBottom = useCallback((behavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior, block: 'end' });
    }
    setHasNewMessages(false);
  }, []);
  
  // Track scroll position
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const atBottom = scrollHeight - scrollTop - clientHeight < 100;
    setIsAtBottom(atBottom);
    if (atBottom) setHasNewMessages(false);
  }, []);
  
  // Scroll to bottom when conversation changes
  useEffect(() => {
    if (isAtBottom) {
      scrollToBottom();
    } else if (conversationHistory.length > 0) {
      setHasNewMessages(true);
    }
  }, [conversationHistory, isAtBottom, scrollToBottom]);
  
  // Silent ticket creation - Every conversation = a service ticket
  // Follows: User Intent → Service Desk Ticket → Admin Notification → Pillar Request
  const createOrAttachTicket = useCallback(async (message, intent, pillar, miraResponse = null) => {
    // Determine pillar from intent if not provided
    const determinedPillar = pillar || (() => {
      if (intent?.startsWith('GROOM')) return 'Grooming';
      if (intent?.startsWith('FOOD')) return 'Food';
      if (intent?.includes('TRAVEL')) return 'Travel';
      if (intent?.includes('BOARD')) return 'Boarding';
      if (intent?.includes('HEALTH') || intent === 'CONCERN') return 'Health';
      if (intent?.includes('CELEBRATE')) return 'Celebrate';
      return 'General';
    })();
    
    // Check for existing open ticket for same (parent, pet, pillar) within 48-72 hours
    const ticketWindow = 72 * 60 * 60 * 1000; // 72 hours in ms
    const now = new Date();
    
    if (currentTicket && 
        currentTicket.pillar === determinedPillar && 
        currentTicket.status !== 'closed' &&
        (now - new Date(currentTicket.created_at)) < ticketWindow) {
      // Attach to existing ticket - append conversation
      console.log('[TICKET] Attaching to existing ticket:', currentTicket.id);
      const updatedTicket = {
        ...currentTicket,
        updated_at: now.toISOString(),
        conversation: [
          ...(currentTicket.conversation || []),
          { sender: 'parent', text: message, timestamp: now.toISOString() }
        ]
      };
      if (miraResponse) {
        updatedTicket.conversation.push({
          sender: 'mira',
          text: miraResponse,
          timestamp: now.toISOString()
        });
      }
      setCurrentTicket(updatedTicket);
      return updatedTicket;
    }
    
    // Create new ticket
    const newTicket = {
      id: `TCK-${now.getFullYear()}-${String(Date.now()).slice(-6)}`,
      parent_id: user?.id || 'demo-parent',
      pet_id: pet.id,
      pet_name: pet.name,
      pillar: determinedPillar,
      intent_primary: intent || 'GENERAL',
      channel: 'Mira_OS',
      status: 'open_mira_only',
      life_state: intent === 'CONCERN' ? 'CONCERN' : intent === 'HOLD' ? 'HOLD' : 'PLAN',
      tags: ['mira', determinedPillar.toLowerCase()],
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      conversation: [
        { sender: 'parent', text: message, timestamp: now.toISOString() }
      ]
    };
    
    if (miraResponse) {
      newTicket.conversation.push({
        sender: 'mira',
        text: miraResponse,
        timestamp: now.toISOString()
      });
    }
    
    setCurrentTicket(newTicket);
    console.log('[TICKET] Created new service ticket:', newTicket.id, 'Pillar:', determinedPillar);
    
    // POST to backend to create service desk ticket
    try {
      const response = await fetch(`${API_URL}/api/concierge/mira-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          type: 'mira_conversation',
          pillar: determinedPillar.toLowerCase(),
          pet_id: pet?.id,
          pet_name: pet?.name,
          user_message: message,
          mira_response: miraResponse || '',
          intent: intent || 'general',
          customer: {
            name: user?.name || 'Guest',
            email: user?.email,
            phone: user?.phone || user?.whatsapp
          }
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('[TICKET] Backend ticket created:', data.ticket_id || data.request_id);
        // Update local ticket with backend ID
        newTicket.backend_ticket_id = data.ticket_id || data.request_id;
      } else {
        console.error('[TICKET] Failed to create backend ticket:', response.statusText);
      }
    } catch (error) {
      console.error('[TICKET] Error creating backend ticket:', error);
    }
    
    return newTicket;
  }, [currentTicket, pet, user, token]);
  
  // Engage Concierge® - Flip ticket status, NOT create new ticket
  const engageConcierge = useCallback(async (reason, contextData = {}) => {
    if (!currentTicket) return;
    
    const now = new Date();
    
    // Build human-readable summary based on reason
    let latestMiraSummary = 'Parent requested Concierge® assistance.';
    let userFacingMessage = 'Your pet Concierge® is joining this chat...';
    
    if (reason === 'hotel_booking' && contextData.hotel_name) {
      latestMiraSummary = `Parent wants to book ${contextData.hotel_name} in ${contextData.city} for ${contextData.pet_name}.`;
      userFacingMessage = `✨ Mira has got it! I'm working on booking "${contextData.hotel_name}" in ${contextData.city} for ${contextData.pet_name}. Our live Concierge® team is on it - you'll hear back shortly with confirmation details!`;
    } else if (reason === 'product_request' && contextData.product_name) {
      latestMiraSummary = `Parent interested in ${contextData.product_name} for ${contextData.pet_name}.`;
      userFacingMessage = `✨ Got it! I'll have our Concierge® help you with "${contextData.product_name}" for ${contextData.pet_name}. They'll reach out with more details shortly!`;
    } else if (typeof contextData === 'string') {
      latestMiraSummary = contextData;
    }
    
    // Call the handoff API
    try {
      await fetch(`${API_URL}/api/mira/tickets/handoff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({
          ticket_id: currentTicket.id,
          handoff_reason: reason,
          latest_mira_summary: latestMiraSummary,
          context_data: contextData
        })
      });
      console.log('[HANDOFF] Ticket handed to Concierge®:', currentTicket.id);
    } catch (error) {
      console.error('[HANDOFF] API error:', error);
    }
    
    // Update local state
    const updatedTicket = {
      ...currentTicket,
      status: 'open_concierge_engaged',
      handoff_to_concierge: true,
      concierge_queue: currentTicket.pillar?.toUpperCase() || 'GENERAL',
      handoff_time: now.toISOString(),
      handoff_reason: reason,
      updated_at: now.toISOString()
    };
    
    setCurrentTicket(updatedTicket);
    
    // Add visual message to conversation with context-aware text
    const systemMessage = {
      type: 'system',
      content: userFacingMessage,
      isBookingConfirmation: reason === 'hotel_booking',
      timestamp: now
    };
    setConversationHistory(prev => [...prev, systemMessage]);
  }, [currentTicket, token]);
  
  // Extract quick reply options from Mira's response
  // Parses the actual question to generate contextual chips
  const extractQuickReplies = useCallback((miraData) => {
    if (!miraData) return [];
    
    try {
      // PRIORITY 1: Check top-level quick_replies - These are CONTEXTUAL conversation chips
      // This is what makes conversations flow naturally (e.g., "Stick with kibble", "Add home-cooked")
      const contextualReplies = miraData.quick_replies;
      if (contextualReplies && contextualReplies.length > 0) {
        console.log('[QUICK REPLIES] Using contextual quick_replies from API:', contextualReplies);
        return contextualReplies.map(r => ({
          text: typeof r === 'string' ? r : (r.label || r.text || ''),
          value: typeof r === 'string' ? r : (r.payload_text || r.label || r.text || '')
        })).filter(r => r.text); // Filter out empty replies
      }
      
      // PRIORITY 2: Check response.quick_replies (nested location)
      const nestedReplies = miraData.response?.quick_replies;
      if (nestedReplies && nestedReplies.length > 0) {
        console.log('[QUICK REPLIES] Using nested response.quick_replies:', nestedReplies);
        return nestedReplies.map(r => ({
          text: typeof r === 'string' ? r : (r.label || r.text || ''),
          value: typeof r === 'string' ? r : (r.payload_text || r.label || r.text || '')
        })).filter(r => r.text);
    }
    
    // PRIORITY 3: conversation_contract.quick_replies (navigational/generic chips)
    // Only use these if no contextual chips are available
    const contractReplies = miraData.conversation_contract?.quick_replies;
    if (Array.isArray(contractReplies) && contractReplies.length > 0) {
      // Filter out purely navigational actions - prefer conversational flow
      const conversationalContract = contractReplies.filter(r => 
        r.intent_type !== 'open_services' && 
        r.intent_type !== 'open_layer' &&
        r.action !== 'open_layer'
      );
      
      if (conversationalContract.length > 0) {
        console.log('[QUICK REPLIES] Using filtered conversation_contract:', conversationalContract);
        return conversationalContract.map(r => ({
          id: r.id || `qr-${Math.random().toString(36).substr(2, 9)}`,
          text: r.label,
          value: r.payload_text || r.label,
          intent_type: r.intent_type,
          action: r.action,
          action_args: r.action_args
        }));
      }
    }
    
    const message = miraData.response?.message || miraData.response || '';
    const intent = miraData.understanding?.intent || '';
    // Ensure message is a string before string operations
    const messageStr = typeof message === 'string' ? message : '';
    const messageLower = messageStr.toLowerCase();
    
    // Only show chips if there's a question being asked
    if (!messageStr.includes('?')) return [];
    
    const quickReplies = [];
    
    // ═══════════════════════════════════════════════════════════════════════════
    // ALLERGY CHECK (SAFETY - HIGHEST PRIORITY)
    // When Mira asks about allergies, ONLY show allergy-related chips
    // Do NOT show meal plan options until allergies are confirmed
    // ═══════════════════════════════════════════════════════════════════════════
    if (messageLower.includes('allerg') && 
        (messageLower.includes('food') || messageLower.includes('sensitivit') || 
         messageLower.includes('does') || messageLower.includes('have any'))) {
      return [
        { text: 'Yes, has allergies', value: 'Yes, my pet has food allergies.' },
        { text: 'No known allergies', value: 'No, no known food allergies.' },
        { text: 'Not sure', value: "I'm not sure, need to check with my vet." }
      ];
    }
    
    // === CONCIERGE FLOW ===
    // If user asks for concierge help
    if (messageLower.includes('concierge') || messageLower.includes('would you like the')) {
      return [
        { text: 'Yes, connect me to Concierge®', value: 'Yes, connect me to my Concierge®.' },
        { text: 'Tell me more first', value: 'Tell me more first.' },
        { text: 'Maybe later', value: 'Maybe later.' }
      ];
    }
    
    // === GROOMING FLOWS ===
    // "Are you thinking of a simple trim... or a fuller grooming session?"
    if (messageLower.includes('simple trim') && messageLower.includes('grooming session')) {
      return [
        { text: 'Simple trim', value: 'Simple trim.' },
        { text: 'Full grooming session', value: 'Full grooming session.' },
        { text: "I'm not sure, tell me more", value: "I'm not sure, tell me more about each option." }
      ];
    }
    
    // "Would you like to do this at home... or prefer a professional groomer?"
    if (messageLower.includes('at home') && messageLower.includes('groomer')) {
      return [
        { text: 'I want a groomer', value: 'I want a groomer.' },
        { text: 'Help me try at home', value: 'Help me try at home.' },
        { text: 'Not sure yet', value: "I'm not sure yet." }
      ];
    }
    
    // "adding a bath as well, or just focusing on the trim?"
    if (messageLower.includes('bath') && messageLower.includes('trim')) {
      return [
        { text: 'Yes, add a bath', value: 'Yes, add a bath as well.' },
        { text: 'Just the trim', value: 'Just the trim this time.' },
        { text: 'Tell me more', value: 'Tell me more about what a bath would involve.' }
      ];
    }
    
    // Bath: "bathing at home... or taking to a groomer?"
    if (messageLower.includes('bath') && (messageLower.includes('at home') || messageLower.includes('groomer'))) {
      return [
        { text: 'Bath at home', value: 'I want to bathe him at home.' },
        { text: 'Take to groomer', value: 'Take him to a groomer.' },
        { text: "What's easier?", value: "What would you recommend as easier?" }
      ];
    }
    
    // === TOY FLOWS ===
    // "Would you like me to suggest some toy options?"
    if (messageLower.includes('toy') && (messageLower.includes('suggest') || messageLower.includes('options'))) {
      return [
        { text: 'Suggest 3-5 toys', value: 'Yes, suggest some toys that fit him.' },
        { text: 'Interactive toys', value: 'Show me interactive toys.' },
        { text: 'Chew toys', value: 'Show me chew toys.' },
        { text: 'Something else', value: 'Something else.' }
      ];
    }
    
    // === FOOD FLOWS ===
    // "Are you thinking of everyday light treats, or something more special-occasion?"
    if (messageLower.includes('everyday') && (messageLower.includes('special') || messageLower.includes('occasion'))) {
      return [
        { text: 'Everyday light treats', value: 'Everyday light treats.' },
        { text: 'Special-occasion treats', value: 'Something special-occasion.' },
        { text: "I'm not sure yet", value: "I'm not sure yet." }
      ];
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // MEAL PLAN STYLE (ONLY after allergies confirmed - NOT when asking about allergies)
    // ═══════════════════════════════════════════════════════════════════════════
    // "simple and consistent" OR "varied rotation" - asking about meal plan style
    if ((messageLower.includes('simple') && messageLower.includes('consistent')) ||
        (messageLower.includes('varied') && messageLower.includes('rotation')) ||
        (messageLower.includes('simple routine') || messageLower.includes('rotation plan'))) {
      // Make sure we're NOT still asking about allergies
      if (!messageLower.includes('allerg')) {
        return [
          { text: 'Simple daily plan', value: 'I prefer a simple and consistent daily routine.' },
          { text: 'Varied rotation', value: 'I\'d like a varied weekly rotation.' },
          { text: 'Not sure', value: 'I\'m not sure, what would you recommend?' }
        ];
      }
    }
    
    // Food type: "dry food, wet food, or open to either?"
    if (messageLower.includes('dry food') || messageLower.includes('wet food') || messageLower.includes('kibble')) {
      return [
        { text: 'Dry food (kibble)', value: 'I prefer dry food.' },
        { text: 'Wet food', value: 'I prefer wet food.' },
        { text: 'Open to either', value: 'I\'m open to either.' }
      ];
    }
    
    // "Suggest treats" - but NOT if asking about toys
    if (messageLower.includes('suggest') && messageLower.includes('treat') && !messageLower.includes('toy')) {
      return [
        { text: 'Suggest 3-5 treats', value: 'Suggest 3-5 treats that fit.' },
        { text: 'Help with a treat routine', value: 'Help me with a treat routine.' },
        { text: 'Something else', value: 'Something else.' }
      ];
    }
    
    // === TRAVEL FLOWS ===
    // "Are you planning to travel by car, flight, or train?" or "Are you driving or flying?"
    if ((messageLower.includes('car') && (messageLower.includes('flight') || messageLower.includes('train'))) ||
        (messageLower.includes('driving') && messageLower.includes('flying')) ||
        (messageLower.includes('drive') && messageLower.includes('fly'))) {
      return [
        { text: 'Car', value: 'Car.' },
        { text: 'Flight', value: 'Flight.' },
        { text: 'Train', value: 'Train.' },
        { text: 'Not sure yet', value: 'Not sure yet.' }
      ];
    }
    
    // "Pet-friendly stays... packing list... both?"
    if (messageLower.includes('pet-friendly') || messageLower.includes('packing list')) {
      return [
        { text: 'Pet-friendly stays', value: 'Pet-friendly stays.' },
        { text: 'Packing list & routine', value: 'Packing list and routine.' },
        { text: 'Both', value: 'Both.' }
      ];
    }
    
    // === HEALTH FLOWS ===
    // "Would you like me to help find a vet?"
    if (messageLower.includes('vet') && messageLower.includes('find')) {
      return [
        { text: 'Yes, find a vet', value: 'Yes, please help me find a vet.' },
        { text: 'I have a vet already', value: 'I already have a vet.' },
        { text: 'Tell me more first', value: 'Tell me more about what to watch for first.' }
      ];
    }
    
    // ═══════════════════════════════════════════════════════════════
    // BIRTHDAY / CELEBRATE FLOWS - CHIPS MUST MATCH THE QUESTION
    // ═══════════════════════════════════════════════════════════════
    
    // FIRST BIRTHDAY QUESTION: "active and playful... or simpler, cosy?"
    // This MUST have chips that answer the question, NOT generic Yes/No
    if ((messageLower.includes('active') && messageLower.includes('playful')) || 
        (messageLower.includes('simpler') && (messageLower.includes('cosy') || messageLower.includes('cozy'))) ||
        (messageLower.includes('celebration') && messageLower.includes('year'))) {
      return [
        { text: 'Active and playful', value: 'Active and playful.' },
        { text: 'Simpler and cosy', value: 'Simpler and cosy.' },
        { text: "I'm not sure yet", value: "I'm not sure yet." },
        { text: "I'd like a cake as well", value: "I'd like a birthday cake for him as well." }
      ];
    }
    
    // SECOND BIRTHDAY QUESTION: "food vs play vs ritual?"
    // "What would you like us to focus on - the food, the play, or marking the moment?"
    if ((messageLower.includes('focus') && (messageLower.includes('food') || messageLower.includes('play'))) ||
        (messageLower.includes('food') && messageLower.includes('play') && 
        (messageLower.includes('ritual') || messageLower.includes('marking')))) {
      return [
        { text: 'Food / cake / treats', value: 'Food / cake / treats.' },
        { text: 'Play / games', value: 'Play / games.' },
        { text: 'Marking the moment', value: 'Mostly marking the moment.' },
        { text: 'All of it', value: 'All of it.' }
      ];
    }
    
    // THIRD BIRTHDAY QUESTION: "everyday treats vs special cake?"
    if ((messageLower.includes('everyday') && messageLower.includes('special')) ||
        (messageLower.includes('cake') && messageLower.includes('treat')) ||
        (messageLower.includes('proper cake') || messageLower.includes('dog cake'))) {
      return [
        { text: 'Everyday light treats', value: 'Everyday light treats.' },
        { text: 'Special-occasion cake', value: 'Special-occasion cake.' },
        { text: 'Both', value: 'Both.' },
        { text: 'Show me cake ideas', value: 'Show me some cake ideas.' }
      ];
    }
    
    // CAKE FOCUS: "focus on sourcing a cake, or other birthday elements?"
    if ((messageLower.includes('focus on') && messageLower.includes('cake')) ||
        (messageLower.includes('sourcing') && messageLower.includes('cake')) ||
        (messageLower.includes('cake') && messageLower.includes('birthday') && messageLower.includes('elements')) ||
        (messageLower.includes('cake') && messageLower.includes('decorations'))) {
      return [
        { text: 'Just the cake', value: 'Just the cake for now.' },
        { text: 'Cake + activities', value: 'I want help with cake and activities.' },
        { text: 'Show me cake ideas', value: `Show me some birthday cake ideas for ${pet?.name || 'my dog'}.` }
      ];
    }
    
    // "small celebration at home, or party with others?"
    if ((messageLower.includes('at home') && messageLower.includes('party')) ||
        (messageLower.includes('small') && messageLower.includes('celebration'))) {
      return [
        { text: 'Small at home', value: 'Small celebration at home.' },
        { text: 'Party with others', value: 'Party with others.' },
        { text: 'Not sure yet', value: "I'm not sure yet." }
      ];
    }
    
    // ═══════════════════════════════════════════════════════════════
    // GENERIC PATTERNS - FALLBACK ONLY
    // These should only match if NO specific pattern above matched
    // ═══════════════════════════════════════════════════════════════
    
    // "Would you like to...?" or "Would you prefer...?" - GENERIC FALLBACK
    if (messageLower.includes('would you like') || messageLower.includes('would you prefer')) {
      // Check if this is actually asking about specific options
      // If so, don't use generic chips
      if (messageLower.includes(' or ')) {
        // There's an "or" in the question - try to extract the options
        // Return null to let the UI show no chips rather than wrong chips
        return [];
      }
      return [
        { text: 'Yes, please', value: 'Yes, please.' },
        { text: 'Tell me more', value: 'Can you tell me more first?' },
        { text: 'Maybe later', value: 'Maybe later.' }
      ];
    }
    
    // "Are you thinking of...?" pattern
    if (messageLower.includes('are you thinking')) {
      return [
        { text: 'Yes', value: 'Yes, that\'s what I\'m thinking.' },
        { text: 'Not quite', value: 'Not quite, let me explain.' },
        { text: 'Tell me more', value: 'Tell me more about my options.' }
      ];
    }
    
    // Default: If there's a question but no specific pattern matched
    if (message.includes('?')) {
      return [
        { text: 'Yes', value: 'Yes.' },
        { text: 'No', value: 'No.' },
        { text: 'Tell me more', value: 'Can you tell me more?' }
      ];
    }
    
    return quickReplies;
    } catch (error) {
      console.error('[QUICK REPLIES] Error extracting quick replies:', error);
      return [];
    }
  }, [pet]);
  
  // Helper: Split message to highlight the question part
  // Returns { mainText, questionText } for separate rendering
  const splitMessageWithQuestion = useCallback((content) => {
    if (!content || !content.includes('?')) {
      return { mainText: content, questionText: null };
    }
    
    // Find the last question in the message
    const sentences = content.split(/(?<=[.!?])\s+/);
    const questionSentences = [];
    const mainSentences = [];
    
    // Go through sentences from the end to find questions
    let foundQuestion = false;
    for (let i = sentences.length - 1; i >= 0; i--) {
      const sentence = sentences[i].trim();
      if (sentence.includes('?') && !foundQuestion) {
        questionSentences.unshift(sentence);
        // Continue to catch the setup sentence (e.g., "To get this right for him, I'd like to understand...")
        if (sentence.toLowerCase().includes('are you') || 
            sentence.toLowerCase().includes('would you') ||
            sentence.toLowerCase().includes('do you prefer')) {
          foundQuestion = true;
        }
      } else if (questionSentences.length > 0 && !foundQuestion) {
        // Include preceding context sentence if it leads into the question
        if (sentence.toLowerCase().includes('understand') || 
            sentence.toLowerCase().includes('know') ||
            sentence.toLowerCase().includes('help')) {
          questionSentences.unshift(sentence);
        } else {
          mainSentences.unshift(sentence);
        }
        foundQuestion = true;
      } else {
        mainSentences.unshift(sentence);
      }
    }
    
    return {
      mainText: mainSentences.join(' ').trim(),
      questionText: questionSentences.join(' ').trim()
    };
  }, []);
  
  // Transcript sync - send messages to service desk in real-time
  // Uses new /api/service_desk/append_message API
  const syncToServiceDesk = useCallback(async (ticketId, message, meta = null) => {
    if (!ticketId) return;
    
    try {
      await fetch(`${API_URL}/api/service_desk/append_message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({
          ticket_id: ticketId,
          sender: message.type === 'user' ? 'parent' : message.type,
          source: 'Mira_OS',
          text: message.content,
          meta: meta
        })
      });
      console.log('[SYNC] Message synced to ticket:', ticketId);
    } catch (error) {
      console.error('[SYNC] Failed to sync message:', error);
    }
  }, [token]);
  
  // Complete a step when user answers a clarifying question
  // This is the KEY anti-loop mechanism
  const completeStep = useCallback(async (ticketId, stepId, userAnswer) => {
    if (!ticketId || !stepId) return;
    
    try {
      const response = await fetch(`${API_URL}/api/service_desk/complete_step`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({
          ticket_id: ticketId,
          step_id: stepId,
          user_answer: userAnswer
        })
      });
      
      const data = await response.json();
      
      if (data.success && !data.already_completed) {
        // Update local state
        setCompletedSteps(prev => [...prev, stepId]);
        setCurrentStep(null);
        setStepHistory(prev => [...prev, { step_id: stepId, answer: userAnswer }]);
        console.log('[STEP] Completed step:', stepId, '-> Answer:', userAnswer);
      } else if (data.already_completed) {
        console.log('[STEP] Step already completed:', stepId);
      }
      
      return data;
    } catch (error) {
      console.error('[STEP] Failed to complete step:', error);
    }
  }, [token]);
  
  // Check if a step has already been completed (to prevent re-asking)
  const isStepCompleted = useCallback((stepId) => {
    return completedSteps.includes(stepId);
  }, [completedSteps]);
  
  // Check if user's response is asking for more info (NOT answering the question)
  // These should NOT complete the current step - Mira should explain and repeat the question
  const isAskingForMoreInfo = useCallback((inputQuery) => {
    const lowerInput = inputQuery.toLowerCase();
    
    const moreInfoPhrases = [
      'tell me more', 'can you explain', 'what do you mean',
      'more info', 'more information', 'explain more',
      'not sure yet', 'i\'m not sure', 'help me understand',
      'what\'s the difference', 'what are the options'
    ];
    
    return moreInfoPhrases.some(phrase => lowerInput.includes(phrase));
  }, []);
  

  // NOTE: Voice control functions (stopSpeaking, speak as speakWithMira) now come from useVoice hook

  // ═══════════════════════════════════════════════════════════════════════════════
  // CHAT SUBMIT HOOK - Extracted from MiraDemoPage.jsx (Phase 1 Refactor)
  // Main chat flow: user input → API call → response processing
  // ═══════════════════════════════════════════════════════════════════════════════
  const { handleSubmit: originalHandleSubmit } = useChatSubmit({
    // API Config
    API_URL,
    token,
    sessionId,
    
    // User & Pet
    user,
    pet,
    setPet,
    userCity,
    
    // Query State
    query,
    setQuery,
    
    // Conversation State
    conversationHistory,
    setConversationHistory,
    conversationContext,
    setConversationContext,
    conversationStage,
    setConversationStage,
    
    // Processing State
    isProcessing,  // Added to prevent duplicate submissions
    setIsProcessing,
    setShowSkeleton,
    setIsTyping,
    setMiraMode,
    
    // Ticket State
    currentTicket,
    setCurrentTicket,
    syncToServiceDesk,
    
    // Step State (Anti-loop)
    currentStep,
    setCurrentStep,
    completedSteps,
    setCompletedSteps,
    stepHistory,
    completeStep,
    isAskingForMoreInfo,
    clarifyingQuestionCount,
    setClarifyingQuestionCount,
    MAX_CLARIFYING_QUESTIONS,
    
    // Quick Replies
    setQuickReplies,
    extractQuickReplies,
    
    // Picks State
    miraPicks,
    setMiraPicks,
    setActiveVaultData,
    setVaultUserMessage,
    setShowVault,
    setShowTopPicksPanel,
    setShowInsightsPanel,
    
    // OS Tab State (for intelligent routing)
    setActiveOSTab,
    
    // FlowModal Triggers (for intelligent booking)
    setShowGroomingFlowModal,
    setShowVetVisitFlowModal,
    setShowCareServiceFlowModal,
    
    // Context Tracking
    lastShownProducts,
    setLastShownProducts,
    lastSearchContext,
    setLastSearchContext,
    
    // Memory State
    setActiveMemoryContext,
    
    // Soul Score
    setSoulScoreUpdated,
    
    // Proactive Alerts
    setProactiveAlerts,
    
    // Conversation End
    setShowConversationEndBanner,
    setConversationComplete,
    
    // Concierge®
    setConciergeConfirmation,
    setShowConciergePanel,
    
    // Quick Send to Concierge® (C° GLOW state)
    setActionableSuggestion,
    
    // Training Videos
    setHasNewVideos,
    setNewVideosCount,
    
    // Pillar
    setPillar,
    
    // Services tab pulse (for highlighting after ticket creation)
    setServicesPulse,
    
    // Service launcher highlighting (e.g., "grooming" → Grooming button glows)
    setHighlightedService,
    
    // Voice
    voiceEnabled,
    voiceTimeoutRef,
    speakWithMira,
    stopSpeaking,
    
    // Haptic & Sound
    hapticFeedback,
    notificationSounds,
    
    // Helper Functions (from useChat) - Pass original functions, hook has all needed state
    fetchConversationMemory,
    fetchMoodContext,
    saveConversationMemory,
    routeIntent,
    createOrAttachTicket,
    fetchTrainingVideos,
    fetchTravelHotels,
    fetchTravelAttractions
  });
  
  // Wrap handleSubmit to clear draft after successful submission (Bible Section 3.2)
  const handleSubmit = useCallback((e, overrideQuery) => {
    // Clear the draft when message is sent
    clearDraft();
    // ── Grief / Farewell keyword detection in Mira OS page ──
    const query = typeof overrideQuery === "string" ? overrideQuery : (e?.target?.value || "");
    if (query) {
      const FAREWELL_KEYWORDS = [
        "crematorium", "cremation", "put to sleep", "put down",
        "euthanasia", "passed away", "died", "death", "lost my dog",
        "gone", "farewell", "memorial", "burial", "rainbow bridge",
        "no longer with us", "last days", "end of life",
      ];
      if (FAREWELL_KEYWORDS.some(kw => query.toLowerCase().includes(kw))) {
        import("../utils/tdc_intent").then(({ tdc }) => {
          tdc.track("farewell_detected", {
            text: query,
            pillar: "farewell",
            channel: "mira_os_farewell_detection",
          });
        });
      }
    }
    // Call the original handler
    return originalHandleSubmit(e, overrideQuery);
  }, [originalHandleSubmit, clearDraft]);
  
  // OLD handleSubmit REMOVED - Now using useChatSubmit hook above
  // ═══════════════════════════════════════════════════════════════════════════════
  
  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  }, [handleSubmit]);
  
  // Handle Concierge® handoff - flip ticket status, don't create new ticket
  // ═══════════════════════════════════════════════════════════════════════════
  // HANDOFF FLOW - Show summary BEFORE sending to Concierge®
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Step 1: Show summary for confirmation
  const showHandoffSummary = useCallback((customItems = []) => {
    // Build summary items from conversation context
    const summaryItems = customItems.length > 0 ? customItems : [
      { label: 'Pet', value: `${pet?.name || 'Your pet'} (${pet?.breed || 'Unknown breed'})` },
      { label: 'Request', value: currentPillar || 'General help' },
      ...(miraPicks.products?.length > 0 ? [{ 
        label: 'Products', 
        value: miraPicks.products.slice(0, 2).map(p => p.name).join(', ')
      }] : []),
      ...(miraPicks.services?.length > 0 ? [{
        label: 'Services',
        value: miraPicks.services.slice(0, 2).map(s => s.name).join(', ')
      }] : [])
    ];
    
    // Get last few messages for context
    const recentMessages = conversationHistory
      .slice(-4)
      .map(m => m.content?.slice(0, 100))
      .join(' ');
    
    // Detect pillar from conversation context
    const contextLower = recentMessages.toLowerCase();
    let detectedPillar = currentPillar?.toLowerCase() || 'general';
    let detectedTitle = `${currentPillar || 'Help'} Request`;
    
    // Smarter pillar detection from conversation - ORDER MATTERS (most specific first)
    // EMERGENCY first - highest priority
    if (contextLower.includes('emergency') || contextLower.includes('chocolate') || contextLower.includes('poison') || 
        contextLower.includes('seizure') || contextLower.includes('bleeding') || contextLower.includes('not eating') ||
        contextLower.includes('limping') || contextLower.includes('urgent')) {
      detectedPillar = 'emergency';
      detectedTitle = 'Emergency Request';
    } 
    // GROOMING - specific pillar (before general care)
    else if (contextLower.includes('grooming') || contextLower.includes('groom') || contextLower.includes('bath') || 
             contextLower.includes('haircut') || contextLower.includes('nail trim') || contextLower.includes('spa')) {
      detectedPillar = 'groom';
      detectedTitle = 'Grooming Request';
    }
    // MEAL/NUTRITION
    else if (contextLower.includes('meal') || contextLower.includes('diet') || contextLower.includes('nutrition') || contextLower.includes('protein')) {
      detectedPillar = 'fit';
      detectedTitle = 'Meal Plan Request';
    } 
    // CELEBRATION
    else if (contextLower.includes('birthday') || contextLower.includes('party') || contextLower.includes('cake') || contextLower.includes('celebration') || contextLower.includes('gotcha')) {
      detectedPillar = 'celebrate';
      detectedTitle = 'Celebration Request';
    } 
    // TRAVEL
    else if (contextLower.includes('travel') || contextLower.includes('trip') || contextLower.includes('vacation') || contextLower.includes('flight')) {
      detectedPillar = 'travel';
      detectedTitle = 'Travel Request';
    } 
    // DINING
    else if (contextLower.includes('cafe') || contextLower.includes('restaurant') || contextLower.includes('dine out') || contextLower.includes('dining')) {
      detectedPillar = 'dine';
      detectedTitle = 'Dining Request';
    } 
    // PET CARE SERVICES (walker, sitter, boarding)
    else if (contextLower.includes('walker') || contextLower.includes('sitter') || contextLower.includes('boarding') || contextLower.includes('daycare')) {
      detectedPillar = 'stay';
      detectedTitle = 'Pet Care Service';
    } 
    // HEALTH/VET
    else if (contextLower.includes('vet') || contextLower.includes('vaccination') || contextLower.includes('checkup') || contextLower.includes('health') || contextLower.includes('sick')) {
      detectedPillar = 'care';
      detectedTitle = 'Health & Vet Request';
    } 
    // STAY/HOTEL
    else if (contextLower.includes('hotel') || contextLower.includes('stay') || contextLower.includes('accommodation')) {
      detectedPillar = 'stay';
      detectedTitle = 'Stay Request';
    } 
    // TRAINING
    else if (contextLower.includes('train') || contextLower.includes('teach') || contextLower.includes('behavior') || contextLower.includes('obedience')) {
      detectedPillar = 'learn';
      detectedTitle = 'Training Request';
    } 
    // FITNESS
    else if (contextLower.includes('exercise') || contextLower.includes('fitness') || contextLower.includes('weight') || contextLower.includes('activity')) {
      detectedPillar = 'fit';
      detectedTitle = 'Fitness Request';
    } 
    // DOCUMENTS
    else if (contextLower.includes('document') || contextLower.includes('certificate') || contextLower.includes('insurance') || contextLower.includes('paperwork')) {
      detectedPillar = 'paperwork';
      detectedTitle = 'Documents Request';
    }
    // SHOPPING
    else if (contextLower.includes('buy') || contextLower.includes('purchase') || contextLower.includes('order') || contextLower.includes('shop')) {
      detectedPillar = 'shop';
      detectedTitle = 'Shopping Request';
    }
    
    setHandoffSummary({
      isOpen: true,
      petName: pet?.name || 'your pet',
      pillar: detectedPillar,
      title: detectedTitle,
      items: summaryItems,
      notes: recentMessages.slice(0, 200)
    });
  }, [pet, currentPillar, miraPicks, conversationHistory]);
  
  // Step 2: Actually send to Concierge® (after user confirms)
  // Accepts optional editedData from HandoffSummary for user-edited values
  const handleConciergeHandoff = useCallback(async (editedData = null) => {
    if (!currentTicket?.id) {
      console.warn('[HANDOFF] No active ticket to hand off');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Build summary from conversation history
      const conversationSummary = conversationHistory
        .filter(msg => msg.type !== 'user')
        .slice(-3)
        .map(msg => msg.content)
        .join(' ');
      
      // Use edited pillar if provided, otherwise fall back to current
      const finalPillar = editedData?.pillar || handoffSummary?.pillar || currentTicket.pillar || currentPillar || 'general';
      const finalNotes = editedData?.notes || handoffSummary?.notes || '';
      const finalTitle = editedData?.title || handoffSummary?.title || 'Request';
      
      // Map pillar to queue - expanded mapping with lowercase keys
      const queueMap = {
        'food': 'FOOD',
        'feed': 'FOOD',
        'grooming': 'GROOMING',
        'groom': 'GROOMING',
        'care': 'CARE',
        'health': 'CARE',
        'celebrate': 'CELEBRATE',
        'travel': 'TRAVEL',
        'stay': 'STAY',
        'dine': 'DINE',
        'shop': 'SHOP',
        'learn': 'LEARN',
        'fit': 'FIT',
        'paperwork': 'PAPERWORK',
        'emergency': 'EMERGENCY',
        'general': 'GENERAL'
      };
      const conciergeQueue = queueMap[finalPillar.toLowerCase()] || 'GENERAL';
      
      // Include user's edited notes in the summary
      const userNotes = finalNotes ? `\n\nMember notes: ${finalNotes}` : '';
      
      const response = await fetch(`${API_URL}/api/service_desk/handoff_to_concierge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({
          ticket_id: currentTicket.id,
          concierge_queue: conciergeQueue,
          pillar: finalPillar, // Send the correct pillar
          request_title: finalTitle,
          latest_mira_summary: `Parent needs help with ${finalPillar} for ${pet.name} (${pet.breed}, ${pet.age}y). ${pet.sensitivities?.length ? `Allergies: ${pet.sensitivities.join(', ')}.` : ''} ${conversationSummary}${userNotes}`
        })
      });
      
      const data = await response.json();
      
      // Update local state with correct pillar
      setCurrentTicket(prev => ({
        ...prev,
        status: 'open_concierge',
        pillar: finalPillar
      }));
      setConversationStage('concierge_engaged');
      
      // Play concierge bell sound
      notificationSounds.concierge();
      
      // Add Mira's confirmation message
      const miraConfirmation = {
        type: 'mira',
        content: `I've asked your pet Concierge® to help with this. They'll review everything we've discussed about ${pet.name} and get back to you here.`,
        isConciergeHandoff: true,
        timestamp: new Date()
      };
      setConversationHistory(prev => [...prev, miraConfirmation]);
      
      console.log('[HANDOFF] Ticket handed off to Concierge®:', currentTicket.id, '-> Queue:', conciergeQueue, '-> Pillar:', finalPillar);
      
    } catch (error) {
      console.error('[HANDOFF] Failed:', error);
      const errorMessage = {
        type: 'mira',
        content: "I couldn't connect you right now, but I've noted your request. A Concierge® will reach out shortly.",
        error: true,
        timestamp: new Date()
      };
      setConversationHistory(prev => [...prev, errorMessage]);
    }
    
    setIsProcessing(false);
  }, [currentTicket, conversationHistory, pet, token, handoffSummary, currentPillar]);
  
  // Handle quick reply
  const handleQuickReply = useCallback((replyValue, skipVoice = false) => {
    // ═══════════════════════════════════════════════════════════════════
    // VOICE SYNC: Cancel any CURRENT voice before new action
    // But DON'T skip voice for the upcoming response - let Mira speak!
    // ═══════════════════════════════════════════════════════════════════
    if (voiceTimeoutRef.current) {
      clearTimeout(voiceTimeoutRef.current);
      voiceTimeoutRef.current = null;
    }
    stopSpeaking(); // Stop current voice, but don't skip next
    
    // Only skip next voice if explicitly requested (not for quick tabs)
    if (skipVoice) {
      skipNextVoice();
    }
    
    // HAPTIC: Chip tap
    hapticFeedback.chipTap();
    setQuery(replyValue);
    setTimeout(() => {
      if (handleSubmitRef.current) {
        handleSubmitRef.current(null, replyValue);
      }
    }, 50);
  }, [stopSpeaking, skipNextVoice]);
  
  // IN-MIRA SERVICE REQUEST HANDLERS
  // Open service request modal when clicking a service/experience card
  const openServiceRequest = useCallback((service, isExperience = false) => {
    // HAPTIC: Card tap
    hapticFeedback.cardTap();
    setServiceRequestModal({
      isOpen: true,
      service: { ...service, isExperience },
      formData: {
        notes: '',
        preferredDate: '',
        urgency: 'normal'
      },
      isSubmitting: false,
      submitted: false
    });
    console.log('[SERVICE_REQUEST] Opened modal for:', service.label);
  }, []);
  
  // Update form data in service request modal
  const updateServiceFormData = useCallback((field, value) => {
    setServiceRequestModal(prev => ({
      ...prev,
      formData: { ...prev.formData, [field]: value }
    }));
  }, []);
  
  // Submit service request - creates ticket, notifies admin, updates soul
  const submitServiceRequest = useCallback(async () => {
    if (!serviceRequestModal.service) return;
    
    setServiceRequestModal(prev => ({ ...prev, isSubmitting: true }));
    
    try {
      const service = serviceRequestModal.service;
      const formData = serviceRequestModal.formData;
      
      // Map service to pillar
      const pillarMap = {
        'grooming': 'Care',
        'walks': 'Care',
        'training': 'Learn',
        'vet': 'Care',
        'boarding': 'Stay',
        'photography': 'Celebrate',
        'party-planning': 'Celebrate',
        'chefs-table': 'Dine',
        'home-dining': 'Dine',
        'meal-subscription': 'Dine',
        'pawcation': 'Stay',
        'multi-pet-travel': 'Travel',
        'travel-planning': 'Travel'
      };
      const pillar = pillarMap[service.id] || 'General';
      
      // Create the service request message
      const requestMessage = `I'd like to request ${service.label} for ${pet.name}. ${formData.notes ? `Additional notes: ${formData.notes}` : ''} ${formData.preferredDate ? `Preferred date: ${formData.preferredDate}` : ''} Urgency: ${formData.urgency}`;
      
      // Create/attach ticket via existing API
      const ticketResponse = await fetch(`${API_URL}/api/service_desk/attach_or_create_ticket`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          parent_id: user?.id || 'demo-user',
          pet_id: pet.id,
          pillar: pillar,
          intent_primary: service.label.toUpperCase().replace(/\s+/g, '_'),
          intent_secondary: [service.isExperience ? 'EXPERIENCE' : 'SERVICE'],
          life_state: formData.urgency === 'urgent' ? 'URGENT' : 'PLANNING',
          channel: 'mira_os_demo',
          initial_message: {
            sender: 'parent',
            source: 'mira_os',
            text: requestMessage
          }
        })
      });
      
      const ticketData = await ticketResponse.json();
      
      if (ticketResponse.ok) {
        console.log('[SERVICE_REQUEST] Ticket created:', ticketData.ticket_id);
        
        // Update soul score for the interaction
        try {
          await fetch(`${API_URL}/api/mira/increment-soul-score`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': token ? `Bearer ${token}` : ''
            },
            body: JSON.stringify({
              pet_id: pet.id,
              interaction_type: 'service_request',
              points: 1.5  // Service requests grow the soul
            })
          });
          console.log('[SOUL] Soul score incremented for service request');
        } catch (err) {
          console.log('[SOUL] Could not increment soul score:', err);
        }
        
        // Per Bible Section 1.5: Commit action → return to CHAT_HOME with toast + confirmation
        // Reset modal state
        setServiceRequestModal({
          isOpen: false,
          service: null,
          formData: {},
          isSubmitting: false,
          submitted: false
        });
        
        // Return to CHAT_HOME (close all layers)
        returnToChat();
        
        // Show toast (3s per Bible)
        toast({
          title: 'Request Submitted',
          description: `Your ${service.label} request has been sent to your Concierge®`,
          duration: 3000,
        });
        
        // Add confirmation message to chat (per Bible: "optional but preferred")
        const confirmationMessage = {
          type: 'mira',
          content: `I've submitted your ${service.label} request for ${pet.name}. Your request ID is **${ticketData.ticket_id}**. ${isConciergeLive() ? 'Your pet Concierge® has been notified and will reach out shortly!' : 'Our team will follow up first thing at 6:30 AM.'}`,
          isConfirmation: true,
          isCommitConfirmation: true,
          serviceRequest: {
            id: ticketData.ticket_id,
            service: service.label,
            status: 'submitted'
          },
          timestamp: new Date()
        };
        setConversationHistory(prev => [...prev, confirmationMessage]);
        
      } else {
        throw new Error(ticketData.detail || 'Failed to create request');
      }
      
    } catch (error) {
      console.error('[SERVICE_REQUEST] Error:', error);
      setServiceRequestModal(prev => ({ ...prev, isSubmitting: false }));
      
      // Add error message to chat
      const errorMessage = {
        type: 'mira',
        content: `I couldn't submit that request right now, but don't worry—you can reach your Concierge® directly via WhatsApp and they'll take care of it.`,
        error: true,
        timestamp: new Date()
      };
      setConversationHistory(prev => [...prev, errorMessage]);
    }
  }, [serviceRequestModal, pet, token, user, returnToChat, toast, setConversationHistory]);
  
  // Close service request modal - uses handleBack for proper layer management
  const closeServiceRequest = useCallback(() => {
    setServiceRequestModal({
      isOpen: false,
      service: null,
      formData: {},
      isSubmitting: false,
      submitted: false
    });
    // Note: handleBack is available but we just close the modal directly
    // since this is an ephemeral layer and user may want to stay on current PRIMARY
  }, []);
  
  // Voice recognition state
  
  // Voice recognition - Enhanced for iOS compatibility
  useEffect(() => {
    // Check for browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setVoiceSupported(false);
      console.log('Speech recognition not supported in this browser');
      return;
    }
    
    try {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true; // Show interim results for better UX
      recognitionRef.current.lang = 'en-US'; // Explicit language setting
      recognitionRef.current.maxAlternatives = 1;
      
      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        // Show interim results while speaking
        if (interimTranscript) {
          setQuery(interimTranscript);
        }
        
        // Submit on final result
        if (finalTranscript) {
          setQuery(finalTranscript);
          setIsListening(false);
          setVoiceError(null);
          if (handleSubmitRef.current) {
            setTimeout(() => {
              handleSubmitRef.current(null, finalTranscript);
            }, 300);
          }
        }
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        
        // Handle specific errors
        switch (event.error) {
          case 'not-allowed':
          case 'permission-denied':
            setVoiceError('Microphone access denied. Please allow microphone in your browser settings.');
            break;
          case 'no-speech':
            setVoiceError('No speech detected. Please try again.');
            break;
          case 'network':
            setVoiceError('Network error. Please check your connection.');
            break;
          case 'aborted':
            // User aborted, no error message needed
            break;
          default:
            setVoiceError('Voice input error. Please try again.');
        }
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
      
    } catch (error) {
      console.error('Failed to initialize speech recognition:', error);
      setVoiceSupported(false);
    }
    
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    };
  }, []);
  
  const toggleVoice = async () => {
    // Clear any previous error
    setVoiceError(null);
    
    if (!recognitionRef.current) {
      setVoiceError('Voice input not available in this browser. Try Chrome or Safari.');
      return;
    }
    
    if (isListening) {
      // HAPTIC: Voice stop
      hapticFeedback.voiceStop();
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore stop errors
      }
      setIsListening(false);
    } else {
      // HAPTIC: Voice start
      hapticFeedback.voiceStart();
      
      // Request microphone permission explicitly for iOS
      try {
        // Check if we need to request permission (iOS Safari)
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          await navigator.mediaDevices.getUserMedia({ audio: true });
        }
        
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error('Microphone permission error:', error);
        setVoiceError('Please allow microphone access to use voice input.');
        setIsListening(false);
      }
    }
  };
  
  // Toggle voice output
  // NOTE: toggleVoiceOutput now comes from useVoice hook
  
  // Handle dock click
  const handleDockClick = (item) => {
    // HAPTIC: Navigation
    hapticFeedback.navigate();
    setActiveDockItem(item.id);
    if (item.action === 'openChat') {
      window.dispatchEvent(new CustomEvent('openMiraAI'));
    } else if (item.action === 'openConcierge') {
      // Open the Concierge® Home Panel (same as header CONCIERGE tab)
      setShowConciergeHome(true);
    } else if (item.action === 'openHelp') {
      setShowHelpModal(true);
    } else if (item.action === 'openLearn') {
      setShowLearnModal(true);
      fetchLearnVideos('recommended');
    } else if (item.path) {
      navigate(item.tab ? `${item.path}?tab=${item.tab}` : item.path);
    }
  };
  
  // Fetch Learn videos
  const fetchLearnVideos = async (category) => {
    setLearnLoading(true);
    setLearnCategory(category);
    try {
      let url = `${API_URL}/api/mira/youtube/`;
      // For demo pet or recommended, use by-breed instead
      const isRealPet = pet.id && !pet.id.startsWith('demo') && !pet.id.startsWith('pet-');
      
      switch (category) {
        case 'recommended':
          if (isRealPet) {
            url += `recommended/${pet.id}?max_results=6`;
          } else {
            url += `by-breed?breed=${encodeURIComponent(pet.breed || 'dog')}&max_results=6`;
          }
          break;
        case 'barking':
          url += `by-topic?topic=stop%20barking&breed=${encodeURIComponent(pet.breed || '')}&max_results=6`;
          break;
        case 'potty':
          url += `by-topic?topic=potty%20training&breed=${encodeURIComponent(pet.breed || '')}&max_results=6`;
          break;
        case 'leash':
          url += `by-topic?topic=leash%20walking&breed=${encodeURIComponent(pet.breed || '')}&max_results=6`;
          break;
        case 'tricks':
          url += `by-topic?topic=dog%20tricks&breed=${encodeURIComponent(pet.breed || '')}&max_results=6`;
          break;
        case 'anxiety':
          url += `by-topic?topic=dog%20anxiety%20calm&breed=${encodeURIComponent(pet.breed || '')}&max_results=6`;
          break;
        case 'puppy':
          url += `by-age?age_years=0.5&breed=${encodeURIComponent(pet.breed || '')}&max_results=6`;
          break;
        default:
          url += `by-breed?breed=${encodeURIComponent(pet.breed || 'dog')}&max_results=6`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      setLearnVideos(data.videos || []);
    } catch (e) {
      console.error('[LEARN] Failed to fetch videos:', e);
      setLearnVideos([]);
    } finally {
      setLearnLoading(false);
    }
  };
  
  // Handle feedback
  const handleFeedback = async (messageIndex, isPositive) => {
    setConversationHistory(prev => prev.map((msg, idx) => 
      idx === messageIndex 
        ? { ...msg, feedbackGiven: isPositive ? 'positive' : 'negative' }
        : msg
    ));
    
    try {
      await fetch(`${API_URL}/api/mira/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({
          message_id: conversationHistory[messageIndex]?.data?.understanding?.entities?.message_id || `msg_${messageIndex}`,
          is_positive: isPositive,
          pet_id: pet.id
        })
      });
    } catch (error) {
      console.error('Feedback error:', error);
    }
  };
  
  const getIntentColor = (intent) => {
    const colors = {
      'FIND': 'bg-blue-500/20 text-blue-300',
      'PLAN': 'bg-purple-500/20 text-purple-300',
      'ORDER': 'bg-green-500/20 text-green-300',
      'CONCERN': 'bg-amber-500/20 text-amber-300',
      'COMPARE': 'bg-cyan-500/20 text-cyan-300',
      'EXPLORE': 'bg-pink-500/20 text-pink-300',
      'HOLD': 'bg-purple-500/20 text-purple-300'
    };
    return colors[intent] || 'bg-gray-500/20 text-gray-300';
  };

  // Guard: don't render until real pet data loads (prevents Buddy flash)
  if (!petLoaded) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0d0d0d',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'rgba(255,255,255,0.5)',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid rgba(168,85,247,0.5)', borderTopColor: '#a855f7', animation: 'spin 0.8s linear infinite' }} />
        <span style={{ fontSize: 14 }}>Loading Mira...</span>
      </div>
    );
  }

  return (
    <div className="mira-prod">
      {/* ═══════════════════════════════════════════════════════════════════
          UNIFIED SINGLE TOP BAR HEADER
          All navigation elements in one clean horizontal row
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="mira-sticky-header" ref={shellRefs.headerRef}>
        {/* Back to Pillar - only shows when user navigated from a pillar page */}
        {(returnUrl || sourcePillar) && (
          <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-b border-purple-200/30">
            <div className="max-w-4xl mx-auto px-4 py-2 flex items-center justify-between">
              <button
                onClick={() => navigate(returnUrl || `/${sourcePillar}`)}
                className="flex items-center gap-2 text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors"
                data-testid="back-to-pillar-btn"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back to {PILLAR_NAMES[sourcePillar] || 'browsing'}</span>
              </button>
            </div>
          </div>
        )}
        
        {/* Memory Whisper - Subtle notification when Mira recalls past context */}
        <MemoryWhisper 
          memoryContext={activeMemoryContext}
          petName={pet?.name || 'your pet'}
          onDismiss={() => setActiveMemoryContext(null)}
          autoDismissDelay={8000}
        />
        
        {/* ═══════════════════════════════════════════════════════════════════
            MIRA UNIFIED HEADER - Single horizontal top bar
            [Mira Logo] [Pet+Soul Score] [OS Tabs] [Weather] [Profile]
            ═══════════════════════════════════════════════════════════════════ */}
        <MiraUnifiedHeader
          currentPet={pet}
          allPets={allPets}
          soulScore={pet?.soulScore || soulKnowledge.soulScore || 0}
          healthScore={calculateHealthScore(pet)}
          activeTab={activeOSTab}
          onTabChange={(tabId) => {
            handleOSTabChange(tabId);
            markTabVisited(tabId);
            if (tabId === 'picks') {
              setMiraPicks(prev => ({ ...prev, hasNew: false }));
            }
          }}
          onPetClick={() => {
            handleOSTabChange('mojo');
            setMojoDeepLink(null);
          }}
          onSwitchPet={switchPet}
          badges={{
            picks: miraPicks.hasNew && miraPicks.enginePicks?.length > 0
              ? miraPicks.enginePicks.length
              : (miraPicks.products?.length || 0) + (miraPicks.services?.length || 0) > 0 
                ? (miraPicks.products?.length || 0) + (miraPicks.services?.length || 0) 
                : null,
            services: null,
          }}
          picksHasNew={miraPicks.hasNew}
          iconStates={iconStates}
          weather={currentWeather}
          onWeatherClick={() => handleOSTabChange('today')}
          servicesPulse={servicesPulse}
          onLocationClick={handleLocationClick}
        />
      </div>
      
      {/* SECONDARY NAVIGATION REMOVED - All functions moved to primary OS layers:
          - Orders → SERVICES
          - Past Chats → CONCIERGE
          - Soul/Enhance Soul → MOJO
          - Insights → CONCIERGE
      */}
      
      {/* INSIGHTS PANEL - Lazy loaded */}
      {showInsightsPanel && (
        <Suspense fallback={<LazyFallback />}>
          <InsightsPanel
            isOpen={showInsightsPanel}
            onClose={() => setShowInsightsPanel(false)}
            petName={pet.name}
            conversationHistory={conversationHistory}
            tipCard={miraPicks.tipCard}
            memoryContext={activeMemoryContext}
            onSendToConcierge={async (tipData) => {
              // Send tip card to Concierge® using the unified signal flow
              try {
                const response = await fetch(`${API_URL}/api/mira/vault/send-to-concierge`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    ...(token && { Authorization: `Bearer ${token}` })
                  },
                  body: JSON.stringify({
                    vault_type: 'tip_card',
                    session_id: sessionId,
                    member_name: user?.name,
                    member_email: user?.email,
                    pet: { name: pet.name, breed: pet.breed },
                    pillar: tipData.tipType || 'general',
                    data: {
                      title: tipData.title,
                      content: tipData.content,
                      type: tipData.type,
                      tip_type: tipData.tipType
                }
              })
            });
            
            const result = await response.json();
            if (result.success) {
              // Add confirmation message to chat
              const confirmMsg = {
                type: 'mira',
                content: `I've sent "${tipData.title}" to your pet Concierge® for follow-up. They'll help you put this into action!`,
                isConciergeHandoff: true,
                timestamp: new Date()
              };
              setConversationHistory(prev => [...prev, confirmMsg]);
              setShowInsightsPanel(false);
            }
          } catch (err) {
            console.error('[INSIGHTS → CONCIERGE] Error:', err);
          }
        }}
          />
        </Suspense>
      )}
      
      {/* CONCIERGE PANEL - Lazy loaded (Legacy quick contact panel) */}
      {showConciergePanel && (
        <Suspense fallback={<LazyFallback />}>
          <ConciergePanel
            isOpen={showConciergePanel}
            onClose={() => {
              setShowConciergePanel(false);
              // Clear pending context when closing
              setPendingConciergeContext(null);
            }}
            pet={pet}
            onChatHandoff={handleConciergeHandoff}
            // Pass LEARN context if coming from "Ask Mira"
            initialContext={pendingConciergeContext}
          />
        </Suspense>
      )}
      
      {/* CONCIERGE HOME PANEL - New CONCIERGE OS Layer */}
      {showConciergeHome && (
        <Suspense fallback={<LazyFallback />}>
          <ConciergeHomePanel
            isOpen={showConciergeHome}
            onClose={() => {
              setShowConciergeHome(false);
              setPendingConciergeContext(null);
            }}
            userId={user?.id || user?.email || 'guest'}
            initialPetId={pet?.id}
            initialContext={pendingConciergeContext}
            onOpenThread={(thread, messages) => {
              // Open thread detail panel
              setConciergeThread({
                isOpen: true,
                threadId: thread.id,
                thread: thread,
                messages: messages || []
              });
            }}
            onOpenTicket={(ticketId) => {
              // Close concierge home and open ticket detail
              setShowConciergeHome(false);
              // TODO: Open ticket detail panel when implemented
              console.log('[CONCIERGE] Open ticket:', ticketId);
            }}
          />
        </Suspense>
      )}
      
      {/* CONCIERGE THREAD PANEL - Conversation detail view */}
      {conciergeThread.isOpen && (
        <Suspense fallback={<LazyFallback />}>
          <ConciergeThreadPanel
            isOpen={conciergeThread.isOpen}
            onClose={() => {
              setConciergeThread({ isOpen: false, threadId: null, thread: null, messages: [] });
            }}
            onBack={() => {
              // Go back to concierge home
              setConciergeThread({ isOpen: false, threadId: null, thread: null, messages: [] });
              setShowConciergeHome(true);
            }}
            userId={user?.id || user?.email || 'guest'}
            threadId={conciergeThread.threadId}
            initialThread={conciergeThread.thread}
            initialMessages={conciergeThread.messages}
          />
        </Suspense>
      )}
      
      {/* CONCIERGE CONFIRMATION BANNER - Shows when service request received */}
      <ConciergeConfirmation
        confirmation={conciergeConfirmation}
        onDismiss={() => setConciergeConfirmation(null)}
        onViewInServices={() => {
          setConciergeConfirmation(null);
          setActiveTab('services');
        }}
        petName={pet?.name || 'your pet'}
      />
      
      {/* ONBOARDING TOOLTIP - First-visit tooltip for Services (Bible Section 12.8) */}
      <OnboardingTooltip
        anchorRef={servicesTabRef}
        isLoggedIn={!!user}
        onDismiss={() => console.log('[ONBOARDING] User dismissed tooltip')}
        onOpenServices={() => {
          handleOSTabChange('services');
          console.log('[ONBOARDING] User opened Services from tooltip');
        }}
      />
      
      {/* NEW CHAT CONFIRM DIALOG - Shows when user has draft/awaiting ticket */}
      <NewChatConfirmDialog
        isOpen={showNewChatConfirm}
        onConfirm={handleConfirmNewChat}
        onCancel={handleCancelNewChat}
        hasDraft={query && query.trim().length > 0}
        hasAwaitingTicket={apiCounts?.awaitingYouCount > 0}
      />
      
      {/* LOCATION PROMPT MODAL */}
      <LocationPromptModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onLocationSet={handleLocationSet}
        currentCity={userCity}
        mode={locationModalMode}
      />
      
      {/* HANDOFF SUMMARY - Lazy loaded */}
      {(handoffSummary?.isOpen) && (
        <Suspense fallback={<LazyFallback />}>
          <HandoffSummary
            isOpen={handoffSummary?.isOpen || false}
            onClose={() => setHandoffSummary(null)}
            onConfirm={async (editedData) => {
              if (editedData) {
                setHandoffSummary(prev => ({
                  ...prev,
                  notes: editedData.notes || prev?.notes,
                  pillar: editedData.pillar || prev?.pillar,
                  title: editedData.title || prev?.title
                }));
              }
              setHandoffSummary(null);
              await handleConciergeHandoff(editedData);
            }}
            petName={handoffSummary?.petName || pet?.name || 'your pet'}
            pillar={handoffSummary?.pillar || currentPillar?.toLowerCase()}
            title={handoffSummary?.title || 'Request Summary'}
            items={handoffSummary?.items || []}
            notes={handoffSummary?.notes || ''}
          />
        </Suspense>
      )}
      
      {/* UNIFIED PICKS VAULT - Combined conversation picks, tips, and personalized picks */}
      <UnifiedPicksVault
        isOpen={showUnifiedVault}
        onClose={() => setShowUnifiedVault(false)}
        conversationPicks={[...(miraPicks.products || []), ...(miraPicks.services || [])]}
        tipCard={miraPicks.tipCard}
        userMessage={vaultUserMessage || conversationHistory[conversationHistory.length - 2]?.content}
        currentPillar={currentPillar}
        // ═══════════════════════════════════════════════════════════════════════════
        // PICKS CONTRACT (Bible Section 9.0) - Source of Truth for Rendering
        // This is deterministic UI logic, not advisory.
        // ═══════════════════════════════════════════════════════════════════════════
        picksContract={miraPicks.picksContract || null}
        // Legacy fields (deprecated - use picksContract instead)
        conciergeArranges={miraPicks.conciergeArranges || []}
        conciergeFallback={miraPicks.conciergeFallback || false}
        conciergeFallbackReason={miraPicks.conciergeFallbackReason || null}
        pet={pet}
        allPets={allPets}
        token={token}
        user={user}
        onAddToPicks={(pick) => {
          setMiraPicks(prev => ({
            ...prev,
            products: [...(prev.products || []), pick],
            hasNew: true
          }));
        }}
        onCreateConciergeTicket={async (arrange) => {
          // ═══════════════════════════════════════════════════════════════════════════
          // TICKET SPINE REQUIREMENT (Non-negotiable)
          // Any concierge_cards[].action === "create_ticket" MUST call the spine
          // Must return canonical TCK-* and trigger admin + member notification
          // ═══════════════════════════════════════════════════════════════════════════
          console.log('[CONCIERGE ARRANGE] Creating ticket via spine for:', arrange);
          try {
            const response = await fetch(`${API_URL}/api/mira/picks/concierge-arrange`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(token && { Authorization: `Bearer ${token}` })
              },
              body: JSON.stringify({
                pet_id: arrange.pet_id || pet?.id,
                pet_name: arrange.pet_name || pet?.name,
                // Use pillar from card (source of truth for ticket routing)
                pillar: arrange.pillar || currentPillar || 'care',
                intent: arrange.intent,
                original_request: arrange.original_request || arrange.intent,
                member_email: user?.email,
                member_name: user?.name,
                member_id: user?.id,
                session_id: sessionId,
                pet_constraints: arrange.pet_constraints || [],
                source: 'picks_concierge_fallback'
              })
            });
            
            if (response.ok) {
              const result = await response.json();
              console.log('[CONCIERGE ARRANGE] Ticket created:', result.ticket_id);
              // Show confirmation with ticket ID as per contract
              return result;
            }
          } catch (err) {
            console.error('[CONCIERGE ARRANGE] Error:', err);
          }
          return null;
        }}
        onSendToConcierge={async (data) => {
          console.log('[UNIFIED VAULT] Send to Concierge®:', data);
          setShowUnifiedVault(false);
          await handleConciergeHandoff({
            pet_name: pet.name,
            pillar: currentPillar || 'shop',
            items: data.picks || [data],
            notes: `From Mira's Picks for ${pet.name}`,
          });
        }}
        onSaveTip={(tip) => {
          console.log('[UNIFIED VAULT] Save tip:', tip);
          // Could save to pet profile here
        }}
        onShowFullTopPicks={() => {
          setShowUnifiedVault(false);
          setShowTopPicksPanel(true);
        }}
      />
      
      {/* TEST SCENARIOS PANEL - Lazy loaded */}
      {showTestScenarios && (
        <Suspense fallback={<LazyFallback />}>
          <TestScenariosPanel
            isOpen={showTestScenarios}
            onClose={() => {
              setShowTestScenarios(false);
              localStorage.setItem('mira_test_scenarios_dismissed', 'true');
            }}
            activeScenario={activeScenario}
            petName={pet?.name || 'your pet'}
            onScenarioClick={(id, query) => {
              setActiveScenario(id);
              handleQuickReply(query);
              // Auto-hide test scenarios after clicking one
              setShowTestScenarios(false);
              localStorage.setItem('mira_test_scenarios_dismissed', 'true');
            }}
          />
        </Suspense>
      )}
      
      {/* Past Chats Panel - Lazy loaded */}
      {showPastChats && (
        <Suspense fallback={<LazyFallback />}>
          <PastChatsPanel
            isOpen={showPastChats}
            onClose={() => setShowPastChats(false)}
            sessions={pastSessions}
            isLoading={loadingPastChats}
            currentSessionId={sessionId}
            onLoadSession={loadSession}
            onStartNewChat={handleNewChatClick}
          />
        </Suspense>
      )}

      {/* Main Chat Area - Apple iMessage Spacing */}
      <div 
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="mp-messages"
      >
        <div className="mp-messages-inner">
          {/* CONCIERGE REPLY BANNER - Shows when new messages arrive in Services */}
          {/* Part of "Chat vs Services" mental model - WhatsApp/Instagram DM style */}
          {isAtChatHome && apiCounts?.unreadRepliesCount > 0 && (
            <ConciergeReplyBanner
              hasUnreadReply={true}
              unreadCount={apiCounts.unreadRepliesCount}
              petName={pet?.name}
              ticketId={apiCounts?.latestUnreadTicketId}
              onOpenServices={(ticketId) => {
                // Navigate to Services, optionally with specific ticket
                handleOSTabChange('services');
                // If ticketId provided, could auto-open that thread
              }}
              onDismiss={() => {
                // Banner will auto-reappear after 10 minutes or if new reply arrives
                // No need to refetch - just updating local state
              }}
            />
          )}
          
          {/* SOUL KNOWLEDGE TICKER - "What Mira Knows" about the pet */}
          {/* Shows soul traits, favorites, allergies - builds trust and engagement */}
          {pet && conversationHistory.length === 0 && (
            <SoulKnowledgeTicker
              petId={pet.id}
              petName={pet.name}
              petPhoto={pet.photo}
              soulScore={pet.soulScore || pet.overall_score || 0}
              knowledgeItems={[
                ...(pet.soul?.personality_tag ? [{ category: 'personality', text: pet.soul.personality_tag }] : []),
                ...(pet.doggy_soul_answers?.general_nature ? [{ category: 'soul', text: `${pet.doggy_soul_answers.general_nature} nature` }] : []),
                ...(pet.soul?.love_language ? [{ category: 'personality', text: `Loves ${pet.soul.love_language}` }] : []),
                ...(pet.sensitivities?.length > 0 ? pet.sensitivities.map(s => ({ category: 'health', text: s })) : []),
                ...(pet.favorites?.length > 0 ? pet.favorites.map(f => ({ category: 'diet', text: `Loves ${f}` })) : [])
              ]}
              onSoulQuestionClick={() => setShowSoulFormModal(true)}
              onKnowledgeItemClick={(item) => handleQuickReply(`Tell me more about ${pet.name}'s ${item.category}`)}
              onSoulBadgeClick={() => setShowMojoModal(true)}
              apiUrl={API_URL}
              token={token}
              className="mb-4"
            />
          )}
          
          {/* SOUL QUESTION PROMPTS - Encourage profile completion */}
          {showSoulQuestionPrompts && quickQuestions.length > 0 && conversationHistory.length < 3 && (
            <div className="px-4 mb-4">
              <SoulQuestionPrompts
                questions={quickQuestions}
                petId={pet?.id}
                petName={pet?.name}
                token={token}
                onQuestionClick={(questionText) => {
                  // Fill question into chat input
                  setQuery(questionText);
                  hapticFeedback.buttonTap();
                }}
                onAnswerSubmit={(questionId, answer, data) => {
                  // Update session count
                  setSessionQuestionsAsked(prev => prev + 1);
                  // Remove answered question
                  setQuickQuestions(prev => prev.filter(q => q.question_id !== questionId));
                  // Refresh pet data to get updated soul score
                  refreshPetData(pet?.id);
                }}
                onDismiss={() => setShowSoulQuestionPrompts(false)}
              />
            </div>
          )}
          
          {/* Welcome State - Extracted to WelcomeHero component (Stage 5) */}
          {conversationHistory.length === 0 && !isProcessing && (
            <WelcomeHero
              pet={pet}
              token={token}
              proactiveGreeting={proactiveGreeting}
              proactiveAlerts={proactiveAlerts}
              healthVault={healthVault}
              currentWeather={currentWeather}
              features={MIRA_FEATURES}
              onQuickReply={handleQuickReply}
              onLoadPastChats={() => { loadPastChats(); setShowPastChats(true); }}
              onShowHealthWizard={() => setHealthVault(prev => ({ ...prev, showWizard: true }))}
              onShowSoulForm={() => setShowSoulFormModal(true)}
              onShowTopPicks={() => {
                hapticFeedback.picksOpen();
                setShowTopPicksPanel(true);
              }}
              soulScoreUpdated={soulScoreUpdated}
            />
          )}
          
          {/* STARTER CHIPS - Shows after starting a new chat */}
          {showStarterChips && conversationHistory.length === 0 && (
            <div className="px-4 py-6">
              <StarterChips
                isVisible={true}
                onChipClick={handleStarterChipClick}
                petName={pet?.name}
              />
            </div>
          )}
          
          {/* Conversation Messages */}
          {conversationHistory.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* PROACTIVE ALERTS BANNER - Smart reminders from Mira */}
              {proactiveAlerts.smartAlerts && proactiveAlerts.smartAlerts.length > 0 && (
                <ProactiveAlertsBanner
                  alerts={proactiveAlerts.smartAlerts}
                  criticalCount={proactiveAlerts.criticalCount || 0}
                  maxVisible={2}
                  onAskMira={(message, alert) => {
                    // "Ask Mira" - Start a conversation about this reminder
                    setQuery(message);
                    setTimeout(() => {
                      handleSubmit({ preventDefault: () => {} });
                    }, 100);
                  }}
                  onBookNow={(request, alert) => {
                    // "Book Now" - Send request to Mira who will route to Concierge®
                    // The message format triggers service request detection on backend
                    const bookingMessage = `I want to book ${request.title}. ${request.details}`;
                    setQuery(bookingMessage);
                    setTimeout(() => {
                      handleSubmit({ preventDefault: () => {} });
                    }, 100);
                  }}
                  onDismiss={async (alertId) => {
                    try {
                      await fetch(`${API_URL}/api/mira/proactive/dismiss/${alertId}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ user_email: user?.email })
                      });
                    } catch (e) { console.log('Could not dismiss alert'); }
                  }}
                  className="mb-4"
                />
              )}
              
              {/* Collapsed Older Messages */}
              {conversationHistory.length > VISIBLE_MESSAGE_COUNT && (
                <div className="mp-history-toggle" style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => { hapticFeedback.historyToggle(); setShowOlderMessages(!showOlderMessages); }}
                data-testid="toggle-history-btn"
                >
                  <History size={14} style={{ opacity: 0.7 }} />
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                    {showOlderMessages ? 'Hide' : 'Show'} {conversationHistory.length - VISIBLE_MESSAGE_COUNT} earlier messages
                  </span>
                  {showOlderMessages ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>
              )}
              
              {/* Dietary Context Chip - Shows in food flows when pet has allergies */}
              {showDietaryContext && (
                <DietaryContextChip
                  pet={pet}
                  isExpanded={dietaryContextExpanded}
                  onToggle={() => setDietaryContextExpanded(!dietaryContextExpanded)}
                  onEdit={() => {
                    // Open pet profile editor
                    navigate(`/pet/${pet.id}/edit`);
                  }}
                />
              )}
              
              {/* Older Messages (Collapsible) - Using ChatMessage component */}
              {showOlderMessages && conversationHistory.slice(0, -VISIBLE_MESSAGE_COUNT).map((msg, idx) => (
                <div key={`old-${idx}`} style={{ opacity: 0.7 }}>
                  <ChatMessage
                    msg={msg}
                    index={idx}
                    pet={pet}
                    miraPicks={miraPicks}
                    miraMode={miraMode}
                    isOld={true}
                    picksState={picksState}
                    conciergeState={conciergeState}
                    hapticFeedback={hapticFeedback}
                    onShowConcierge={handleConciergeClick}
                    onShowInsights={() => setShowInsightsPanel(true)}
                    onShowPicks={() => handleOSTabChange('picks')}
                    onQuickReply={handleQuickReply}
                    onEngageConcierge={engageConcierge}
                    onOpenServiceRequest={openServiceRequest}
                  />
                </div>
              ))}
              
              {/* Visible Recent Messages - Using ChatMessage Component */}
              {(conversationHistory.length > VISIBLE_MESSAGE_COUNT ? conversationHistory.slice(-VISIBLE_MESSAGE_COUNT) : conversationHistory).map((msg, idx) => (
                <ChatMessage
                  key={idx}
                  msg={msg}
                  index={idx}
                  pet={pet}
                  miraPicks={miraPicks}
                  miraMode={miraMode}
                  isOld={false}
                  picksState={picksState}
                  conciergeState={conciergeState}
                  hapticFeedback={hapticFeedback}
                  onShowConcierge={() => handleOSTabChange('concierge')}
                  onShowInsights={() => setShowInsightsPanel(true)}
                  onShowPicks={() => handleOSTabChange('picks')}
                  onQuickReply={handleQuickReply}
                  onEngageConcierge={engageConcierge}
                  onOpenServiceRequest={openServiceRequest}
                />
              ))}
              
              {/* MIRA MODE INDICATOR - Extracted to MiraLoader component (P2) */}
              <MiraLoader
                isProcessing={isProcessing}
                showSkeleton={showSkeleton}
                mode={miraMode}
                petName={pet.name}
              />
              
              {/* BOTTOM QUICK REPLIES - REMOVED
                  Per user decision: Keep only TOP quick replies in the header bar.
                  This removes duplication and provides cleaner iOS-style UI.
                  The header QuickReplies component handles all quick reply display.
              */}
              
              {/* STATUS INDICATORS - Non-clickable, passive status display
                  Shows C° (Concierge®) and PICKS counts when there's activity
                  Spec: NOT clickable, no tap target, no hover state
                  Visual: dot + count, dot = new but low urgency, number = attention needed
              */}
              {conversationHistory.length > 0 && (
                ((apiCounts?.awaitingYouCount || 0) > 0 || 
                 (miraPicks.products?.length || 0) + (miraPicks.services?.length || 0) > 0 ||
                 miraPicks.hasNew) && (
                <div 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    pointerEvents: 'none', // NOT clickable
                    userSelect: 'none'
                  }}
                  data-testid="chat-status-indicators"
                >
                  {/* C° Indicator - Concierge® awaiting count */}
                  {(apiCounts?.awaitingYouCount || 0) > 0 && (
                    <div 
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        background: 'rgba(16, 185, 129, 0.15)',
                        border: '2px solid rgba(16, 185, 129, 0.5)',
                        position: 'relative'
                      }}
                    >
                      <span style={{
                        fontFamily: 'system-ui, -apple-system, sans-serif',
                        fontSize: '16px',
                        fontWeight: 600,
                        color: '#10b981'
                      }}>
                        C°
                      </span>
                      
                      {/* Count badge */}
                      <span style={{
                        position: 'absolute',
                        top: '-4px',
                        right: '-4px',
                        minWidth: '18px',
                        height: '18px',
                        borderRadius: '9px',
                        background: '#ef4444',
                        color: 'white',
                        fontSize: '10px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0 4px'
                      }}>
                        {apiCounts.awaitingYouCount > 9 ? '9+' : apiCounts.awaitingYouCount}
                      </span>
                    </div>
                  )}
                  
                  {/* PICKS Indicator - Curated items count */}
                  {((miraPicks.products?.length || 0) + (miraPicks.services?.length || 0) > 0 || miraPicks.hasNew) && (
                    <div 
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '48px',
                        height: '44px',
                        borderRadius: '14px',
                        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(236, 72, 153, 0.3))',
                        border: '2px solid rgba(236, 72, 153, 0.5)',
                        position: 'relative'
                      }}
                    >
                      <Gift size={20} style={{ color: 'white', opacity: 0.9 }} />
                      
                      {/* Count badge or "New" dot */}
                      {(miraPicks.products?.length || 0) + (miraPicks.services?.length || 0) > 0 ? (
                        <span style={{
                          position: 'absolute',
                          top: '-4px',
                          right: '-4px',
                          minWidth: '18px',
                          height: '18px',
                          borderRadius: '9px',
                          background: '#ec4899',
                          color: 'white',
                          fontSize: '10px',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '0 4px'
                        }}>
                          {(miraPicks.products?.length || 0) + (miraPicks.services?.length || 0) > 9 
                            ? '9+' 
                            : (miraPicks.products?.length || 0) + (miraPicks.services?.length || 0)}
                        </span>
                      ) : miraPicks.hasNew && (
                        <span style={{
                          position: 'absolute',
                          top: '0',
                          right: '0',
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          background: '#ec4899'
                        }} />
                      )}
                    </div>
                  )}
                </div>
              ))}
              
              <div ref={messagesEndRef} />
              
              {/* CONVERSATION COMPLETE BANNER - Compact, non-intrusive */}
              {showConversationEndBanner && conversationComplete && (
                <div className="mp-picks-curated-banner" data-testid="picks-curated-banner">
                  <div className="picks-curated-content">
                    <span className="picks-curated-text">
                      Mira has curated for {pet.name}
                    </span>
                    <button 
                      className="picks-curated-icon"
                      onClick={() => setShowMiraTray(true)}
                      title="View Picks"
                    >
                      <Gift size={16} className="picks-icon-pulse" />
                    </button>
                  </div>
                  <span className="picks-curated-subtext">
                    Your Concierge® will take it from here
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* ═══════════════════════════════════════════════════════════════════
          FLOATING VOICE INDICATOR - Glowing red when Mira is speaking
          Shows user that voice is active, tap to stop
      ═══════════════════════════════════════════════════════════════════ */}
      {isSpeaking && (
        <div 
          className="mp-floating-voice-indicator"
          onClick={stopSpeaking}
          data-testid="floating-voice-indicator"
        >
          <div className="mp-voice-orb">
            <Volume2 size={24} />
            <span className="mp-voice-pulse-ring"></span>
            <span className="mp-voice-pulse-ring mp-delay"></span>
          </div>
          <span className="mp-voice-label">Mira speaking... tap to stop</span>
        </div>
      )}
      
      {/* Pet Switch Banner - Shows when switching pets with an existing draft (Bible Section 3.2) */}
      {petSwitchBanner && (
        <div 
          className="fixed bottom-32 left-1/2 transform -translate-x-1/2 z-50 bg-gray-800/95 backdrop-blur-sm border border-purple-500/30 rounded-2xl px-4 py-3 shadow-xl max-w-md"
          data-testid="pet-switch-banner"
        >
          <p className="text-white text-sm mb-2">{petSwitchBanner.message}</p>
          {petSwitchBanner.showSendChoice && (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const result = sendForOldPet();
                  if (result) {
                    // Handle sending for old pet - could trigger a switch back
                    toast({ title: `Sending for ${petSwitchBanner.oldPetName}`, duration: 2000 });
                  }
                }}
                className="px-3 py-1 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                Send for {petSwitchBanner.oldPetName}
              </button>
              <button
                onClick={() => {
                  const result = sendForNewPet();
                  if (result) {
                    setQuery(result.text);
                  }
                }}
                className="px-3 py-1 text-xs bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Send for {petSwitchBanner.newPetName}
              </button>
              <button
                onClick={dismissBanner}
                className="px-3 py-1 text-xs text-gray-400 hover:text-white transition-colors"
              >
                Dismiss
              </button>
            </div>
          )}
          {!petSwitchBanner.showSendChoice && (
            <button
              onClick={dismissBanner}
              className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
            >
              Got it
            </button>
          )}
        </div>
      )}
      
      {/* New Messages Pill - Per Bible Section 3.1 */}
      {showNewMessagesPill && (
        <div
          className="fixed bottom-28 left-1/2 transform -translate-x-1/2 z-40 cursor-pointer"
          onClick={scrollToFirstUnread}
          data-testid="new-messages-pill"
        >
          <div className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-full shadow-lg transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12l7 7 7-7"/>
            </svg>
            <span className="text-sm font-medium">
              {newMessageCount} new message{newMessageCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}
      
      {/* Scroll to Bottom Button - Extracted to ScrollToBottomButton component */}
      <ScrollToBottomButton 
        visible={hasNewMessages && !isAtBottom && !showNewMessagesPill}
        onClick={() => scrollToBottom()}
      />
      
      {/* Reply Nudge - Shows when user types update-like content with open ticket (Bible Section 12.7) */}
      <ReplyNudge
        message={query}
        hasOpenTicket={!!currentTicket && currentTicket.status !== 'closed'}
        onOpenServices={() => setActiveTab('services')}
        onSendAnyway={() => {
          // Let them send, they chose to
          handleSubmitRef.current?.(query);
        }}
      />
      
      {/* ── NEAR ME PANEL — Google Places quick search ────────────────── */}
      {showNearMePanel && (
        <div className="fixed inset-x-0 bottom-24 mx-auto max-w-lg z-30 px-4">
          <div style={{
            background: '#fff', borderRadius: 20, padding: '20px 20px 16px',
            boxShadow: '0 8px 40px rgba(0,0,0,0.12)', border: '1px solid #F0E8FF',
          }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
              <div style={{ fontWeight:800, fontSize:15, color:'#1A1A2E' }}>
                📍 Near {pet?.name || 'you'}
              </div>
              <button onClick={() => { setShowNearMePanel(false); setActiveOSTab('today'); }}
                style={{ background:'none', border:'none', cursor:'pointer', color:'#888', fontSize:18 }}>×</button>
            </div>
            <p style={{ fontSize:12, color:'#888', marginBottom:12 }}>
              Ask Mira to find nearby vets, groomers, cafés, parks or pet stores
            </p>
            {['Find a vet near me', 'Dog-friendly cafés nearby', 'Groomers near me', 'Pet parks nearby'].map(query => (
              <button key={query}
                onClick={() => {
                  setShowNearMePanel(false);
                  handleSubmit(null, query);
                }}
                style={{
                  display:'block', width:'100%', textAlign:'left', padding:'10px 14px',
                  marginBottom:6, borderRadius:10, border:'1px solid #E0D8FF',
                  background:'#FAFAFF', fontSize:13, cursor:'pointer', fontWeight:500,
                  color:'#4A3F8F', transition:'background 0.15s',
                }}>
                🔍 {query}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Pet Home → removed (pink Mira orb navigates home instead) */}

      {/* Soul Radar — ambient background behind chat input (score ≥ 30 only) */}
      {pet && (pet.overall_score || 0) >= 30 && (
        <div style={{ position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)', pointerEvents:'none', zIndex:0 }}>
          <SoulRadarBackground pet={pet} size={420} opacity={0.15} />
        </div>
      )}

      {/* Input Composer - Extracted to ChatInputBar component */}
      <ChatInputBar
        inputRef={inputRef}
        query={query}
        onQueryChange={(value) => {
          setQuery(value);
          // Update draft with sliding TTL (Bible Section 3.2)
          updateDraft(value);
          // VOICE SYNC: Stop voice when user types
          if (value.length > 0) {
            if (voiceTimeoutRef.current) {
              clearTimeout(voiceTimeoutRef.current);
              voiceTimeoutRef.current = null;
            }
            if (isSpeaking) {
              stopSpeaking();
            }
          }
        }}
        onSubmit={handleSubmit}
        isProcessing={isProcessing}
        voiceEnabled={voiceEnabled}
        isSpeaking={isSpeaking}
        onToggleVoiceOutput={toggleVoiceOutput}
        voiceSupported={voiceSupported}
        isListening={isListening}
        onToggleVoiceInput={toggleVoice}
        voiceError={voiceError}
        onClearVoiceError={() => setVoiceError(null)}
        placeholder={`Ask Mira anything...`}
        petId={pet?.id}
        sessionId={sessionId}
        onPhotoUpload={(file, uploadData) => {
          console.log('[MIRA] Photo uploaded:', file.name, uploadData);
          // Optionally trigger a message about the upload
        }}
        onNewChat={handleNewChatClick}
        hasConversation={conversationHistory.length > 0}
      />
      
      {/* Sandbox Footer */}
      <div className="mp-sandbox-footer">
        🧪 Sandbox Mode — Mira OS 10/10 Premium Experience
      </div>
      
      {/* ═══════════════════════════════════════════════════════════════════
          MIRA PICKS TRAY - Extracted to MiraTray component (Stage 5)
          "Mira is the Brain, Concierge® is the Hands"
      ═══════════════════════════════════════════════════════════════════ */}
      <MiraTray
        isOpen={showMiraTray && !showVault}
        onClose={() => {
          setShowMiraTray(false);
          markPicksSeen();
        }}
        pet={pet}
        miraPicks={miraPicks}
        onOpenVault={(data, context) => {
          setActiveVaultData(data);
          setVaultUserMessage(context);
          setShowVault(true);
        }}
      />
      
      {/* HEALTH VAULT WIZARD - Lazy loaded */}
      {healthVault.showWizard && (
        <Suspense fallback={<LazyFallback />}>
          <HealthVaultWizard
            isOpen={healthVault.showWizard}
            onClose={() => setHealthVault(prev => ({ ...prev, showWizard: false }))}
            pet={pet}
            completeness={healthVault.completeness}
            missingFields={healthVault.missing_fields}
            onFieldClick={(field) => handleQuickReply(`I want to add ${pet.name}'s ${field.label.toLowerCase()}`)}
          />
        </Suspense>
      )}
      
      {/* HELP MODAL - Lazy loaded */}
      {showHelpModal && (
        <Suspense fallback={<LazyFallback />}>
          <HelpModal
            isOpen={showHelpModal}
            onClose={() => setShowHelpModal(false)}
            onOrderHelp={() => handleQuickReply('I need help with my order')}
            onConciergeChat={handleConciergeHandoff}
          />
        </Suspense>
      )}
      
      {/* LEARN MODAL - Lazy loaded */}
      {showLearnModal && (
        <Suspense fallback={<LazyFallback />}>
          <LearnModal
            isOpen={showLearnModal}
            onClose={() => setShowLearnModal(false)}
            pet={pet}
            activeCategory={learnCategory}
            videos={learnVideos}
            isLoading={learnLoading}
            onCategoryChange={fetchLearnVideos}
          />
        </Suspense>
      )}
      
      {/* MOJO PROFILE MODAL - Pet Identity Layer (Pet Operating System Core) */}
      {showMojoModal && (
        <Suspense fallback={<LazyFallback />}>
          <MojoProfileModal
            isOpen={showMojoModal}
            onClose={() => {
              setShowMojoModal(false);
              setMojoDeepLink(null);
            }}
            pet={pet}
            allPets={allPets}
            soulScore={pet?.soulScore || soulKnowledge.soulScore || 0}
            apiUrl={API_URL}
            token={token}
            userEmail={user?.email}
            deepLinkSection={mojoDeepLink}
            onSwitchPet={() => {
              // Open pet selector dropdown
              setShowMojoModal(false);
              // Trigger pet selector
              setShowPetSelector(true);
            }}
            onEditSection={(sectionId) => {
              if (sectionId === 'soul' || sectionId === 'details') {
                setShowMojoModal(false);
                setShowSoulFormModal(true);
              } else {
                // Navigate to my-pets page with section focus
                setShowMojoModal(false);
                navigate(`/my-pets?pet=${pet?.id}&section=${sectionId}`);
              }
            }}
            onSoulQuestionClick={() => {
              setShowMojoModal(false);
              setShowSoulFormModal(true);
            }}
            onRefreshPet={async () => {
              // Called after insight confirm/reject to refresh pet data
              console.log('[MiraDemoPage] Refreshing pet data after insight action...');
              await refreshPetData(pet?.id);
            }}
          />
        </Suspense>
      )}
      
      {/* TODAY PANEL - Time Layer (Reminders, Alerts, Due Items) */}
      {showTodayPanel && (
        <Suspense fallback={<LazyFallback />}>
          <TodayPanel
            isOpen={showTodayPanel}
            onClose={() => setShowTodayPanel(false)}
            pet={pet}
            allPets={allPets}
            weather={currentWeather}
            apiUrl={API_URL}
            token={token}
            onNavigate={(path) => {
              setShowTodayPanel(false);
              navigate(path);
            }}
            onPetSwitch={(newPet) => {
              setShowTodayPanel(false);
              switchPet(newPet);
            }}
            onOpenServices={(serviceData) => {
              // Handler for LEARN nudge → ServiceRequestBuilder
              setShowTodayPanel(false);
              setRequestBuilderState({ isOpen: true, service: serviceData });
            }}
            onOpenConcierge={(context) => {
              // Handler for LEARN nudge → ConciergePanel
              setShowTodayPanel(false);
              setPendingConciergeContext(context);
              setShowConciergeHome(true);
            }}
            onAskMira={(question) => {
              // Close TODAY and send question to Mira
              setShowTodayPanel(false);
              handleOSTabChange('chat');
              // Set query and submit
              setQuery(question);
              setTimeout(() => handleSubmit(null, question), 100);
            }}
          />
        </Suspense>
      )}
      
      {/* SERVICES PANEL - Execution Layer (Service Launchers, Task Inbox, Orders) */}
      {showServicesPanel && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowServicesPanel(false);
          }}
        >
          <div className="w-full max-w-2xl h-[80vh] sm:h-[80vh] h-screen sm:rounded-2xl bg-slate-900/95 border border-white/10 shadow-2xl overflow-hidden relative">
            {/* Close button - always visible, especially on mobile */}
            <button 
              onClick={() => setShowServicesPanel(false)}
              className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              data-testid="services-close-btn"
            >
              <X className="w-5 h-5 text-white" />
            </button>
            <ServicesPanel
              selectedPet={pet}
              allPets={allPets}
              token={token}
              highlightedService={highlightedService}
              onClose={() => setShowServicesPanel(false)}
              onTicketSelect={(ticket) => {
                console.log('[SERVICES] Ticket selected:', ticket);
              }}
              onOpenRequestBuilder={(service) => {
                console.log('[SERVICES] Open request builder for:', service);
                setRequestBuilderState({ isOpen: true, service });
              }}
              unreadRepliesCount={apiCounts?.unreadRepliesCount || 0}
            />
          </div>
        </div>
      )}
      
      {/* SERVICE REQUEST BUILDER - New modal for creating service requests */}
      {requestBuilderState.isOpen && (
        <ServiceRequestBuilder
          isOpen={requestBuilderState.isOpen}
          service={requestBuilderState.service}
          currentPet={pet}
          allPets={allPets}
          token={token}
          onClose={() => setRequestBuilderState({ isOpen: false, service: null })}
          onSuccess={(data) => {
            console.log('[REQUEST BUILDER] Request created:', data);
            // Refresh services panel if open
          }}
        />
      )}
      
      {/* LEARN PANEL - Knowledge Layer (Curated Guides & Videos) */}
      {showLearnPanel && (
        <Suspense fallback={<LazyFallback />}>
          <LearnPanel
            isOpen={showLearnPanel}
            onClose={() => setShowLearnPanel(false)}
            pet={pet}
            token={token}
            conversationContext={conversationContext}
            conversationPicks={miraPicks.products || miraPicks.services ? 
              [...(miraPicks.products || []), ...(miraPicks.services || [])] : null
            }
            onOpenServices={(serviceData) => {
              // "Let Mira do it" - opens ServiceRequestBuilder with prefill from LEARN
              // Per LEARN Bible: One tap → ServiceRequestBuilder prefilled
              console.log('[LEARN → SERVICES] Opening service request:', serviceData);
              setShowLearnPanel(false);
              setRequestBuilderState({ 
                isOpen: true, 
                service: {
                  type: serviceData?.service_type || 'general',
                  prefill: {
                    ...serviceData?.prefill,
                    // Add LEARN context to the ticket
                    learn_context: {
                      source_layer: serviceData?.source_layer || 'learn',
                      source_item: serviceData?.source_item,
                      context_note: serviceData?.context_note
                    }
                  },
                  context: serviceData?.context || {}
                }
              });
            }}
            onOpenConcierge={(conciergeData) => {
              // "Ask Mira" - opens Concierge® with context (zero re-asking)
              // Per LEARN Bible: Concierge® opener shows "I've read X. Help me with Y."
              console.log('[LEARN → CONCIERGE] Opening concierge with context:', conciergeData);
              setShowLearnPanel(false);
              
              // Store the context for concierge to use
              // The concierge should show a pre-filled message
              if (conciergeData?.initialMessage) {
                // Set as pending message for concierge
                setPendingConciergeContext({
                  source: 'learn',
                  initialMessage: conciergeData.initialMessage,
                  learn_item: conciergeData.learn_item,
                  derived_tags: conciergeData.derived_tags_used,
                  suggested_action: conciergeData.suggested_next_action
                });
              }
              
              // Open the new Concierge® Home Panel
              setShowConciergeHome(true);
            }}
          />
        </Suspense>
      )}
      
      {/* SOUL FORM MODAL - Lazy loaded */}
      {showSoulFormModal && (
        <Suspense fallback={<LazyFallback />}>
          <SoulFormModal
            isOpen={showSoulFormModal}
            onClose={() => setShowSoulFormModal(false)}
            pet={pet}
            token={token}
            onSoulUpdated={(newScore, answers) => {
              if (newScore) {
                const roundedScore = Math.round(newScore);
                // Update current pet
                setPet(prev => ({ ...prev, soulScore: roundedScore }));
                // CRITICAL: Also update allPets array for score consistency across dropdown
                setAllPets(prev => prev.map(p => 
                  p.id === pet.id ? { ...p, soulScore: roundedScore } : p
                ));
                // Trigger glow animation
                setSoulScoreUpdated(true);
                setTimeout(() => setSoulScoreUpdated(false), 2000);
              }
              console.log('[SOUL FORM] Pet soul updated - syncing across all views:', { newScore, answers });
            }}
          />
        </Suspense>
      )}
      
      {/* SERVICE REQUEST MODAL - Lazy loaded */}
      {serviceRequestModal.isOpen && (
        <Suspense fallback={<LazyFallback />}>
          <ServiceRequestModal
            isOpen={serviceRequestModal.isOpen}
            service={serviceRequestModal.service}
            formData={serviceRequestModal.formData}
            isSubmitting={serviceRequestModal.isSubmitting}
            submitted={serviceRequestModal.submitted}
            petName={pet.name}
            isConciergeLive={isConciergeLive()}
            onClose={closeServiceRequest}
            onSubmit={submitServiceRequest}
            onUpdateFormData={updateServiceFormData}
          />
        </Suspense>
      )}
      
      {/* PERSONALIZED PICKS PANEL - Beautiful pillar-wise picks */}
      {/* NOW with Picks Engine B6 integration - auto-refresh on every turn */}
      {showTopPicksPanel && (
        <Suspense fallback={<LazyFallback />}>
          <PersonalizedPicksPanel
            isOpen={showTopPicksPanel}
            onClose={() => setShowTopPicksPanel(false)}
            pet={pet}
            token={token}
            userEmail={user?.email}
            // NEW: Engine picks props (B6)
            enginePicks={miraPicks.enginePicks || []}
            enginePillar={miraPicks.activePillar}
            conciergeDecision={miraPicks.concierge}
            safetyOverride={miraPicks.safetyOverride}
            lastUpdated={miraPicks.lastUpdated}
            // NEW: Mira's conversation suggestions (🎂, 🎈, etc.)
            conversationSuggestions={miraPicks.conciergeArranges || []}
            // NEW: Conversation context for context-aware picks
            conversationContext={miraPicks.conversationContext}
            onSendSuccess={(data) => {
              // Add confirmation message to chat (with deduplication)
              setConversationHistory(prev => {
                // Check if we already have a recent picks_confirmation message
                const lastMsg = prev[prev.length - 1];
                if (lastMsg?.metadata?.type === 'picks_confirmation' && 
                    Date.now() - new Date(lastMsg.timestamp).getTime() < 2000) {
                  // Skip duplicate - already added within last 2 seconds
                  return prev;
                }
                
                const confirmationMessage = {
                  type: 'mira',
                  content: `Your ${data.count} personalized pick${data.count > 1 ? 's' : ''} for ${data.petName} have been sent to your Concierge®! They're reviewing your selections now and will get back to you shortly to help arrange everything. Is there anything else I can help you with?`,
                  timestamp: new Date().toISOString(),
                  metadata: {
                    type: 'picks_confirmation',
                    itemCount: data.count,
                    petName: data.petName
                  }
                };
                return [...prev, confirmationMessage];
              });
            }}
          />
        </Suspense>
      )}
      
      {/* ═══════════════════════════════════════════════════════════════════════════
          PET SELECTOR MODAL - Switch between pets
          Opens from MOJO profile "Switch Pet" button or header pet badge
          ═══════════════════════════════════════════════════════════════════════════ */}
      {showPetSelector && allPets.length > 0 && (
        <div 
          className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowPetSelector(false);
          }}
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="relative w-full max-w-md mx-4 mb-4 sm:mb-0 bg-slate-900 rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Switch Pet</h3>
              <button 
                onClick={() => setShowPetSelector(false)}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2">
              {allPets.map((p) => {
                const isSelected = p.id === pet?.id || p.name === pet?.name;
                const soulScore = Number(p.overall_score || p.soulScore) || 0;
                return (
                  <button
                    key={p.id || p.name}
                    onClick={() => {
                      switchPet(p);
                      setShowPetSelector(false);
                    }}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                      isSelected 
                        ? 'bg-violet-500/20 border border-violet-500/50' 
                        : 'bg-white/5 hover:bg-white/10 border border-transparent'
                    }`}
                    data-testid={`pet-switch-option-${p.name}`}
                  >
                    <div className="w-12 h-12 rounded-full bg-violet-500/20 overflow-hidden flex items-center justify-center">
                      {p.photo || p.image ? (
                        <img src={p.photo || p.image} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xl">🐕</span>
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-white">{p.name}</div>
                      <div className="text-sm text-white/50">{p.breed}</div>
                    </div>
                    {soulScore > 0 && (
                      <span className="tdc-chip tdc-chip-gold" style={{ background:'linear-gradient(135deg,#f59e0b,#ea580c)', color:'#fff', borderColor:'transparent' }}>
                        {Math.round(soulScore)}%
                      </span>
                    )}
                    {isSelected && (
                      <Check className="w-5 h-5 text-violet-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════
          VAULT SYSTEM - Full-screen overlay for picks, bookings, places, etc.
          "Mira is the Brain, Concierge® is the Hands"
          ═══════════════════════════════════════════════════════════════════════════ */}
      {showVault && (miraPicks.products?.length > 0 || miraPicks.services?.length > 0 || miraPicks.places?.length > 0 || miraPicks.tipCard || activeVaultData) && (
        <div className="vault-overlay" data-testid="vault-overlay">
          <VaultManager
            isOpen={showVault}
            onClose={() => {
              setShowVault(false);
              setActiveVaultData(null);
              setVaultUserMessage('');
            }}
            miraResponse={{
              products: miraPicks.products,
              services: miraPicks.services,
              places: miraPicks.places,
              nearby_places: miraPicks.places ? { places: miraPicks.places, type: miraPicks.placesType } : null,
              tip_card: miraPicks.tipCard,
              response: activeVaultData,
              pillar: currentPillar,
              ...(activeVaultData || {})
            }}
            userMessage={vaultUserMessage}
            pet={pet}
            pillar={currentPillar}
            sessionId={sessionId}
            member={user}
            onVaultSent={(result) => {
              console.log('[VAULT] Sent to Concierge®:', result);
              if (result.success) {
                setConversationHistory(prev => [...prev, {
                  type: 'mira',
                  content: `✨ Your picks have been sent to your Pet Concierge®! They'll get back to you shortly.`,
                  timestamp: new Date().toISOString(),
                  isVaultConfirmation: true
                }]);
              }
            }}
          />
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════
          DEBUG DRAWER - Icon State System Validation
          Shows raw counts, computed states, and query filters
          Only visible in development mode or when ?debug=1 in URL
          ═══════════════════════════════════════════════════════════════════════════ */}
      <IconStateDebugDrawer
        debugInfo={getDebugInfo()}
        onRefresh={refetchIconState}
        counts={apiCounts}
        activeTab={activeOSTab}
      />
      
      {/* Quick replies now handled by the original system in ChatMessage/QuickReplies components */}
      
      {/* ═══════════════════════════════════════════════════════════════════════════
          FLOW MODALS - Intelligent booking wizards triggered by Mira chat
          When user says "Book grooming for Mystique", Mira opens the right wizard
          ═══════════════════════════════════════════════════════════════════════════ */}
      <Suspense fallback={<LazyFallback />}>
        <GroomingFlowModal 
          isOpen={showGroomingFlowModal}
          onClose={() => setShowGroomingFlowModal(false)}
          pet={pet}
        />
      </Suspense>
      
      <Suspense fallback={<LazyFallback />}>
        <VetVisitFlowModal 
          isOpen={showVetVisitFlowModal}
          onClose={() => setShowVetVisitFlowModal(false)}
          pet={pet}
        />
      </Suspense>
      
      <Suspense fallback={<LazyFallback />}>
        <CareServiceFlowModal 
          isOpen={showCareServiceFlowModal}
          onClose={() => setShowCareServiceFlowModal(false)}
          pet={pet}
          serviceType="general"
        />
      </Suspense>
      
      {/* Quick Concierge® Modal - "Send to Concierge®" CTA for Mira suggestions */}
      <Suspense fallback={<LazyFallback />}>
        <QuickConciergeModal
          isOpen={showQuickConciergeModal}
          onClose={() => {
            setShowQuickConciergeModal(false);
            setActionableSuggestion(null); // Clear glow state
          }}
          suggestionContext={actionableSuggestion}
          petId={pet?.id}
          petName={pet?.name}
          userId={user?.id}
          onSuccess={(data) => {
            console.log('[QUICK CONCIERGE] Sent to Concierge®:', data);
            setActionableSuggestion(null); // Clear glow state on success
          }}
        />
      </Suspense>
      
      {/* Site Footer - Hidden in mira-prod context via CSS */}
      {shellSelectors.showSiteFooter && <Footer />}
    </div>
  );
};

export default MiraDemoPage;

// Forced rebuild at Wed Feb 25 07:14:55 UTC 2026

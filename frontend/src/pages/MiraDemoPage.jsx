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

import React, { useState, useEffect, useRef, useCallback, lazy, Suspense, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Mic, MicOff, Send, MessageCircle, Package, Calendar, 
  HelpCircle, Heart, Sparkles, ChevronDown, ChevronUp, ChevronRight,
  ShoppingBag, PawPrint, Bot, History, Plus, Check, Search,
  ThumbsUp, ThumbsDown, X, Phone, Mail, MessageSquare, AlertCircle,
  Star, Crown, Gift, Volume2, VolumeX, Wand2, ArrowRight, ExternalLink, Shield,
  Award, RefreshCw, MapPin, Navigation, Play
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../utils/api';
import hapticFeedback from '../utils/haptic';
import { correctSpelling } from '../utils/spellCorrect';
import conversationIntelligence from '../utils/conversationIntelligence';
import notificationSounds from '../utils/notificationSounds';

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
import { FormattedText, TypedText } from '../components/Mira/TextComponents';
import { triggerCelebrationConfetti } from '../utils/confetti';
import PetOSNavigation from '../components/Mira/PetOSNavigation';
import WeatherCard from '../components/Mira/WeatherCard';
import WhyForPetBadge from '../components/Mira/WhyForPetBadge';
import ServicesPanel from '../components/Mira/ServicesPanel';
import ServiceRequestBuilder from '../components/Mira/ServiceRequestBuilder';

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
const TodayPanel = lazy(() => import('../components/Mira/TodayPanel'));

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
  useLayerNavigation, useChatContinuity, useDraft,
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

// Toast for commit action confirmations
import { useToast } from '../hooks/use-toast';

// Import the production-style CSS (matches thedoggycompany.in)
import '../styles/mira-prod.css';

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

const MiraDemoPage = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  
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
    isRealPet
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
    markPicksSeen
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
    voiceError,
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
  const [showTestScenarios, setShowTestScenarios] = useState(() => {
    const dismissed = localStorage.getItem('mira_test_scenarios_dismissed');
    return dismissed !== 'true';
  });
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
  // LEARN PANEL: Knowledge Layer - Curated guides and videos
  const [showLearnPanel, setShowLearnPanel] = useState(false);
  // SERVICE REQUEST BUILDER: New request builder modal state
  const [requestBuilderState, setRequestBuilderState] = useState({ isOpen: false, service: null });
  // PENDING CONCIERGE CONTEXT: From LEARN "Ask Mira" flow
  const [pendingConciergeContext, setPendingConciergeContext] = useState(null);
  
  // CONCIERGE HOME PANEL: New Concierge OS Layer home screen
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
  
  // Track if page is fully loaded (for deferring non-critical operations)
  const [isPageReady, setIsPageReady] = useState(false);
  
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
  
  // Fetch user's geolocation AFTER page is ready (deferred for performance)
  useEffect(() => {
    if (!isPageReady) return;
    
    const detectLocation = async () => {
      // First try browser geolocation
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            setUserGeoLocation({ latitude, longitude });
            
            // Reverse geocode to get city name
            try {
              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
              );
              const data = await response.json();
              const city = data.address?.city || data.address?.town || data.address?.state || 'Mumbai';
              setUserCity(city);
              console.log('[GEO] ✅ User location detected via GPS:', city);
            } catch (e) {
              console.log('[GEO] Could not reverse geocode, using default');
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
              console.log('[GEO] IP geolocation also failed, using default Mumbai');
            }
          },
          { enableHighAccuracy: false, timeout: 5000, maximumAge: 600000 }
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
          console.log('[GEO] No location detection available, using default');
        }
      }
    };
    
    detectLocation();
  }, [isPageReady]);
  
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
  // Part of UNIFORM SERVICE FLOW: User → Mira Ticket → Admin Notification → Concierge
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
              // Generate soul traits from doggy_soul_answers
              const soulAnswers = p.doggy_soul_answers || {};
              const soulTraits = [];
              
              if (soulAnswers.general_nature) {
                soulTraits.push({ 
                  label: `${soulAnswers.general_nature} soul`, 
                  icon: '⭐', 
                  color: '#f59e0b' 
                });
              }
              if (soulAnswers.describe_3_words) {
                const words = soulAnswers.describe_3_words.split(',')[0]?.trim();
                if (words) {
                  soulTraits.push({ 
                    label: words, 
                    icon: '🎀', 
                    color: '#ec4899' 
                  });
                }
              }
              if (p.soul?.love_language) {
                soulTraits.push({ 
                  label: `${p.soul.love_language} lover`, 
                  icon: '❤️', 
                  color: '#ef4444' 
                });
              }
              
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
    
    console.log('[SESSION] Started new session:', newSessionId, 'for pet:', pet.name);
    return newSessionId;
  }, [baseStartNewSession, pet.name, clearPicks]);
  
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
      if (isLoadingPets || !pet.id || pet.id.startsWith('demo') || pet.id.startsWith('pet-')) return;
      
      try {
        // Fetch celebrations, health reminders, health vault status, weather, bundles, AND new proactive alerts
        const [celebResponse, healthResponse, vaultResponse, weatherResponse, bundlesResponse, proactiveResponse] = await Promise.all([
          fetch(`${API_URL}/api/mira/celebrations/${pet.id}`),
          fetch(`${API_URL}/api/mira/health-reminders/${pet.id}`),
          fetch(`${API_URL}/api/mira/health-vault/status/${pet.id}`),
          fetch(`${API_URL}/api/mira/weather-suggestions/${pet.id}`),
          fetch(`${API_URL}/api/mira/bundles/${pet.id}`),
          fetch(`${API_URL}/api/mira/proactive/alerts/${pet.id}`)  // NEW: Vaccination, Birthday, Grooming alerts
        ]);
        
        const celebData = celebResponse.ok ? await celebResponse.json() : { celebrations: [] };
        const healthData = healthResponse.ok ? await healthResponse.json() : { reminders: [] };
        const vaultData = vaultResponse.ok ? await vaultResponse.json() : { completeness: 100, missing_fields: [] };
        const weatherData = weatherResponse.ok ? await weatherResponse.json() : { suggestions: [] };
        const bundlesData = bundlesResponse.ok ? await bundlesResponse.json() : { bundles: [] };
        const proactiveData = proactiveResponse.ok ? await proactiveResponse.json() : { alerts: [], critical_count: 0 };
        
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
      }
    } catch (err) {
      console.error('[PET SWITCH] Error:', err);
      // Fallback: just start fresh
      startNewSession();
      // MULTI-PET FIX: Also clear Mira Picks on error
      clearPicks();
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
            // Helper to ensure array format
            const ensureArray = (val, defaultVal = []) => {
              if (!val) return defaultVal;
              if (Array.isArray(val)) return val;
              if (typeof val === 'string') return val.split(',').map(s => s.trim()).filter(Boolean);
              return defaultVal;
            };
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
              overall_score: p.overall_score || 0
            });
          }
        }
      } catch (err) {
        console.debug('Using demo pet');
      }
    };
    fetchPet();
  }, [token]);
  
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
    
    // In production: POST to /api/tickets/create
    // For now, we log it
    return newTicket;
  }, [currentTicket, pet, user]);
  
  // Engage Concierge - Flip ticket status, NOT create new ticket
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
      console.log('[HANDOFF] Ticket handed to Concierge:', currentTicket.id);
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
    
    // First, check if backend provided quick_replies
    const backendReplies = miraData.response?.quick_replies;
    if (backendReplies && backendReplies.length > 0) {
      return backendReplies.map(r => ({
        text: r,
        value: r
      }));
    }
    
    const message = miraData.response?.message || '';
    const intent = miraData.understanding?.intent || '';
    const messageLower = message.toLowerCase();
    
    // Only show chips if there's a question being asked
    if (!message.includes('?')) return [];
    
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
        { text: 'Show me cake ideas', value: 'Show me some birthday cake ideas for Buddy.' }
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
  }, []);
  
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
    
    // Concierge
    setConciergeConfirmation,
    setShowConciergePanel,
    
    // Training Videos
    setHasNewVideos,
    setNewVideosCount,
    
    // Pillar
    setPillar,
    
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
      // Open the Concierge Home Panel (same as header CONCIERGE tab)
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

  return (
    <div className="mira-prod">
      {/* ═══════════════════════════════════════════════════════════════════
          MEMORY WHISPER - Subtle notification when Mira recalls past context
          Shows as a small chip above the chat, auto-dismisses
          (Keeping for backward compatibility, but SoulKnowledgeTicker is primary now)
          ═══════════════════════════════════════════════════════════════════ */}
      <MemoryWhisper 
        memoryContext={activeMemoryContext}
        petName={pet?.name || 'your pet'}
        onDismiss={() => setActiveMemoryContext(null)}
        autoDismissDelay={8000}
      />
      
      {/* ═══════════════════════════════════════════════════════════════════
          SOUL KNOWLEDGE TICKER - Dynamic rolling ticker showing everything
          Mira knows about the pet. Encourages completing soul questions.
          "Mira knows Mojo 67%" with all the WHY - favorites, allergies, breed traits
          ═══════════════════════════════════════════════════════════════════ */}
      {(soulKnowledge.items.length > 0 || tickerItems.length > 0) && (
        <SoulKnowledgeTicker
          petId={pet?.id}
          petName={pet?.name || 'your pet'}
          petPhoto={pet?.photo}
          soulScore={pet?.soulScore || soulKnowledge.soulScore || 0}
          knowledgeItems={soulKnowledge.items.length > 0 ? soulKnowledge.items : tickerItems.map(t => ({
            icon: t.icon,
            text: t.text,
            category: t.type === 'weather' ? 'activity' : t.type === 'place' ? 'activity' : 'soul',
            priority: 5
          }))}
          apiUrl={API_URL}
          token={token}
          onSoulBadgeClick={(deepLink) => {
            // Open MOJO Profile Modal - Pet Identity Layer
            setMojoDeepLink(deepLink);
            setShowMojoModal(true);
          }}
          onSoulQuestionClick={() => {
            // Navigate to soul questions page
            hapticFeedback.buttonTap();
            navigate(`/pet-soul/${pet.id || ''}`);
          }}
          onKnowledgeItemClick={(item) => {
            // Convert knowledge item click to a query
            hapticFeedback.buttonTap();
            if (item.category === 'diet') {
              handleQuickReply(`Tell me about ${pet.name}'s diet preferences`);
            } else if (item.category === 'health') {
              handleQuickReply(`What health information do you have for ${pet.name}?`);
            } else if (item.category === 'activity') {
              handleQuickReply(`What activities would ${pet.name} enjoy?`);
            } else if (item.category === 'breed') {
              handleQuickReply(`Tell me about ${pet.breed || pet.name}'s breed characteristics`);
            } else {
              handleQuickReply(`What do you know about ${pet.name}?`);
            }
          }}
        />
      )}
      
      {/* HEADER */}
      <header className="mp-header">
        <div className="mp-header-inner">
          {/* Left: Mira Logo - Pink circle */}
          <div className="mp-logo">
            <div className="mp-logo-icon">
              <Sparkles />
            </div>
            <div className="mp-logo-text">
              <span className="mp-logo-title">Mira</span>
              <span className="mp-logo-subtitle">Your Pet Companion</span>
            </div>
          </div>
          
          {/* Right side: Notification Bell + Pet Selector */}
          <div className="flex items-center gap-2">
            {/* Notification Bell */}
            <NotificationBell userEmail={user?.email} />
            
            {/* Pet Selector - Extracted to PetSelector component */}
            <PetSelector
              currentPet={pet}
              allPets={allPets}
              isOpen={showPetSelector}
              onToggle={() => setShowPetSelector(!showPetSelector)}
              onSelectPet={switchPet}
              onPetNameClick={() => {
                // Open MOJO Profile Modal when pet name is clicked
                setShowMojoModal(true);
                setMojoDeepLink(null); // Open at top, not deep-linked to soul
              }}
            />
          </div>
        </div>
      </header>
      
      {/* PET OS NAVIGATION - The 6 Layer OS Navigation Bar */}
      {/* MOJO = Identity | TODAY = Time | PICKS = Intelligence | SERVICES = Action | LEARN = Knowledge | CONCIERGE = Human */}
      <PetOSNavigation
        currentPet={pet}
        allPets={allPets}
        soulScore={pet?.soulScore || soulKnowledge.soulScore || 0}
        healthScore={calculateHealthScore(pet)}
        activeTab={activeOSTab}
        onTabChange={(tabId) => {
          // Use Bible-compliant tab change handler
          handleOSTabChange(tabId);
          
          // Clear "new" flag when picks panel is opened
          if (tabId === 'picks') {
            setMiraPicks(prev => ({ ...prev, hasNew: false }));
          }
        }}
        onPetClick={() => {
          // Open MOJO Profile Modal when pet avatar is clicked
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
          services: null, // TODO: Connect to pending services count
        }}
        picksHasNew={miraPicks.hasNew}
      />
      
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
        petName={pet?.name || 'your pet'}
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
        pet={pet}
        allPets={allPets}
        token={token}
        onAddToPicks={(pick) => {
          setMiraPicks(prev => ({
            ...prev,
            products: [...(prev.products || []), pick],
            hasNew: true
          }));
        }}
        onSendToConcierge={async (data) => {
          console.log('[UNIFIED VAULT] Send to Concierge:', data);
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
            onClose={() => setShowTestScenarios(false)}
            activeScenario={activeScenario}
            petName={pet?.name || 'your pet'}
            onScenarioClick={(id, query) => {
              setActiveScenario(id);
              handleQuickReply(query);
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
            onStartNewChat={startNewSession}
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
                    // "Book Now" - Send request to Mira who will route to Concierge
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
                    hapticFeedback={hapticFeedback}
                    onShowConcierge={() => setShowConciergePanel(true)}
                    onShowInsights={() => setShowInsightsPanel(true)}
                    onShowPicks={() => setShowMiraTray(true)}
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
                  hapticFeedback={hapticFeedback}
                  onShowConcierge={() => setShowConciergePanel(true)}
                  onShowInsights={() => setShowInsightsPanel(true)}
                  onShowPicks={() => setShowMiraTray(true)}
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
              
              {/* QUICK REPLIES - Contextual suggestions after Mira's response */}
              {!isProcessing && quickReplies.length > 0 && conversationHistory.length > 0 && (
                <QuickReplies
                  replies={quickReplies}
                  onReply={(action) => {
                    setQuickReplies([]); // Clear after use
                    
                    // If "Send to Concierge" action, show summary first
                    if (action.toLowerCase().includes('send') && action.toLowerCase().includes('concierge')) {
                      showHandoffSummary();
                    } else {
                      handleQuickReply(action);
                    }
                  }}
                  show={true}
                />
              )}
              
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
        onNewChat={startNewSession}
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
              // Could trigger pet selector here if needed
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
          <div className="w-full max-w-2xl h-[80vh] bg-slate-900/95 rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
            <ServicesPanel
              selectedPet={pet}
              allPets={allPets}
              token={token}
              onClose={() => setShowServicesPanel(false)}
              onTicketSelect={(ticket) => {
                console.log('[SERVICES] Ticket selected:', ticket);
              }}
              onOpenRequestBuilder={(service) => {
                console.log('[SERVICES] Open request builder for:', service);
                setRequestBuilderState({ isOpen: true, service });
              }}
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
              // "Ask Mira" - opens Concierge with context (zero re-asking)
              // Per LEARN Bible: Concierge opener shows "I've read X. Help me with Y."
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
              
              // Open the new Concierge Home Panel
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
            // NEW: Engine picks props (B6)
            enginePicks={miraPicks.enginePicks || []}
            enginePillar={miraPicks.activePillar}
            conciergeDecision={miraPicks.concierge}
            safetyOverride={miraPicks.safetyOverride}
            lastUpdated={miraPicks.lastUpdated}
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
                  content: `Your ${data.count} personalized pick${data.count > 1 ? 's' : ''} for ${data.petName} have been sent to your Concierge! They're reviewing your selections now and will get back to you shortly to help arrange everything. Is there anything else I can help you with?`,
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
              console.log('[VAULT] Sent to Concierge:', result);
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
    </div>
  );
};

export default MiraDemoPage;


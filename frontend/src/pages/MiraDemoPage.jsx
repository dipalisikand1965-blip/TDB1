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
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
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

// ═══════════════════════════════════════════════════════════════════════════════
// VAULT SYSTEM - "Mira is the Brain, Concierge® is the Hands"
// ═══════════════════════════════════════════════════════════════════════════════
import { VaultManager } from '../components/PicksVault';
import MiraTray from '../components/Mira/MiraTray';
import PastChatsPanel from '../components/Mira/PastChatsPanel';
import WelcomeHero from '../components/Mira/WelcomeHero';
import ChatMessage from '../components/Mira/ChatMessage';
import InsightsPanel from '../components/Mira/InsightsPanel';
import ConciergePanel from '../components/Mira/ConciergePanel';
import HelpModal from '../components/Mira/HelpModal';
import LearnModal from '../components/Mira/LearnModal';
import ServiceRequestModal from '../components/Mira/ServiceRequestModal';
import HealthVaultWizard from '../components/Mira/HealthVaultWizard';
import ChatInputBar from '../components/Mira/ChatInputBar';
import TestScenariosPanel from '../components/Mira/TestScenariosPanel';
import PetSelector from '../components/Mira/PetSelector';
import NavigationDock from '../components/Mira/NavigationDock';
import FloatingActionBar from '../components/Mira/FloatingActionBar';
import MiraLoader from '../components/Mira/MiraLoader';
import ScrollToBottomButton from '../components/Mira/ScrollToBottomButton';
import ProactiveAlertsBanner from '../components/Mira/ProactiveAlertsBanner';
import NotificationBell from '../components/Mira/NotificationBell';
import ConciergeConfirmation from '../components/Mira/ConciergeConfirmation';
import PicksIndicator from '../components/Mira/PicksIndicator';
import QuickReplies, { generateQuickReplies } from '../components/Mira/QuickReplies';
import HandoffSummary from '../components/Mira/HandoffSummary';
import MemoryWhisper from '../components/Mira/MemoryWhisper';
import { FormattedText, TypedText } from '../components/Mira/TextComponents';
import { triggerCelebrationConfetti } from '../utils/confetti';

// ═══════════════════════════════════════════════════════════════════════════════
// EXTRACTED CONSTANTS & UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════
import {
  DOCK_ITEMS, CONCIERGE_HOURS, isConciergeLive, generateConciergeRequest,
  DOG_PLACEHOLDER_IMAGES, getPlaceholderImage, TEST_SCENARIOS,
  SERVICE_CATEGORIES, detectServiceIntent,
  COMFORT_KEYWORDS, ACKNOWLEDGMENT_PHRASES, getComfortModeServices,
  EXPERIENCE_CATEGORIES, detectExperienceIntent, generateWhyForPet
} from '../utils/miraConstants';

// ═══════════════════════════════════════════════════════════════════════════════
// EXTRACTED HOOKS - Stage 1, 2, 3 Refactoring
// ═══════════════════════════════════════════════════════════════════════════════
import { 
  useVoice, usePet, useVault, useSession, DEMO_PET, ALL_DEMO_PETS,
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

// Import the production-style CSS (matches thedoggycompany.in)
import '../styles/mira-prod.css';

// ═══════════════════════════════════════════════════════════════════════════════
// NOTE: DEMO_PET and ALL_DEMO_PETS are now imported from '../hooks/mira'
// This ensures consistency between the hook and the page
// ═══════════════════════════════════════════════════════════════════════════════
// Alias for backward compatibility
const ALL_PETS = ALL_DEMO_PETS;

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
  const [currentPillar, setPillar] = useState('celebrate');
  const [lastShownProducts, setLastShownProducts] = useState([]);
  // INTELLIGENCE: Track search context for follow-up queries ("cheaper ones", "show me more")
  const [lastSearchContext, setLastSearchContext] = useState(null);
  // MEMORY WHISPER: Track active memory context for whisper display
  const [activeMemoryContext, setActiveMemoryContext] = useState(null);
  const [isRecording, setIsRecording] = useState(false); // For universal search voice
  // SOUL SCORE: Track when score updates for glow animation
  const [soulScoreUpdated, setSoulScoreUpdated] = useState(false);
  
  // Core conversation state
  const [query, setQuery] = useState('');
  const [conversationHistory, setConversationHistory] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // NOTE: Pet state (pet, setPet, allPets, setAllPets) now comes from usePet hook above
  
  // UI modals and helpers
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showLearnModal, setShowLearnModal] = useState(false);
  const [learnVideos, setLearnVideos] = useState([]);
  const [learnLoading, setLearnLoading] = useState(false);
  const [learnCategory, setLearnCategory] = useState('recommended');
  const [activeDockItem, setActiveDockItem] = useState(null);
  
  // MIRA ENGINE MODES - Visible to user like ChatGPT's "Thinking"
  // /Instant - Quick, lightweight replies
  // /Thinking - Deep reasoning for PLAN, BOOK, EXECUTE, ADVISE
  // /Comfort - Grief, loss, emotional support
  // /Emergency - Vet-first urgent moments
  const [miraMode, setMiraMode] = useState('ready'); // ready, instant, thinking, comfort, emergency
  const [typingText, setTypingText] = useState(''); // For typing animation
  const [isTyping, setIsTyping] = useState(false);
  
  // NOTE: Voice state (voiceEnabled, isSpeaking, audioRef) now comes from useVoice hook above
  // Refs for voice timing (still needed for handleSubmit)
  const voiceTimeoutRef = useRef(null);
  const skipVoiceOnNextResponseRef = useRef(false);
  
  // CONVERSATION HISTORY - Collapsible older messages
  const [showOlderMessages, setShowOlderMessages] = useState(false);
  const VISIBLE_MESSAGE_COUNT = 4; // Show last 4 messages (2 pairs of user+mira)
  
  // CONVERSATION INTELLIGENCE - Context retention for follow-ups
  const [conversationContext, setConversationContext] = useState(() => 
    conversationIntelligence.createConversationContext(pet)
  );
  
  // GEOLOCATION - Get user's actual location for weather/nearby
  const [userGeoLocation, setUserGeoLocation] = useState(null);
  const [userCity, setUserCity] = useState('Mumbai'); // Fallback
  
  // Initialize haptic audio context on first user interaction (required for iOS)
  useEffect(() => {
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
  }, []);
  
  // Fetch user's geolocation on mount
  useEffect(() => {
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
  }, []);
  
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
  
  // CONVERSATION FLOW DETECTION - Track when Mira has provided assistance
  const [conversationComplete, setConversationComplete] = useState(false);
  const [showConversationEndBanner, setShowConversationEndBanner] = useState(false);
  
  // Detect if conversation is "complete" (Mira has provided assistance)
  // A complete flow = User asked → Mira responded with products/action → User acknowledged
  const detectConversationComplete = useCallback((history) => {
    if (history.length < 4) return false; // Need at least 4 messages (2 exchanges)
    
    const lastMessages = history.slice(-6);
    const miraMessages = lastMessages.filter(m => m.type === 'mira');
    const userMessages = lastMessages.filter(m => m.type === 'user');
    
    const hasMiraWithProducts = miraMessages.some(m => 
      m.showProducts || m.data?.response?.products?.length > 0
    );
    const hasMiraWithAction = miraMessages.some(m =>
      m.showConcierge || m.data?.nearby_places || m.data?.training_videos
    );
    
    // Only mark complete if user EXPLICITLY confirms (not just "ok" or "thanks")
    // These are explicit confirmation phrases
    if ((hasMiraWithProducts || hasMiraWithAction) && userMessages.length > 0) {
      const lastUserMsg = userMessages[userMessages.length - 1];
      const userText = (lastUserMsg?.content || '').toLowerCase();
      
      // Strong confirmation phrases - user is clearly done
      const strongConfirmations = [
        'send to concierge', 'book this', 'book it', "let's do it", "lets do it",
        'go ahead', 'proceed', 'confirm', 'finalize', 'order this', 'order it',
        "i'll take", "i want this", 'perfect thanks', 'that\'s all', 'thats all',
        'done for now', 'all set', 'sounds good book', 'yes book', 'yes please book'
      ];
      
      const isStrongConfirmation = strongConfirmations.some(p => userText.includes(p));
      
      // Only complete on strong confirmation, not casual acknowledgments
      return isStrongConfirmation;
    }
    
    return false;
  }, []);
  
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
  
  // FLOATING TOOLBAR - Clean conversation flow
  // Insight & Concierge icons at top, expand on tap
  const [showInsightsPanel, setShowInsightsPanel] = useState(false);
  const [showConciergePanel, setShowConciergePanel] = useState(false);
  const [latestInsights, setLatestInsights] = useState([]); // Collected from all messages
  
  // ═══════════════════════════════════════════════════════════════════════════
  // CONCIERGE CONFIRMATION - Service Request Received Banner
  // Part of UNIFORM SERVICE FLOW: User → Mira Ticket → Admin Notification → Concierge
  // ═══════════════════════════════════════════════════════════════════════════
  const [conciergeConfirmation, setConciergeConfirmation] = useState(null);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // QUICK REPLIES - Contextual suggestions after Mira's response
  // Golden Standard: 3-4 buttons after every advisory response
  // ═══════════════════════════════════════════════════════════════════════════
  const [quickReplies, setQuickReplies] = useState([]);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // HANDOFF SUMMARY - Shows summary BEFORE sending to Concierge®
  // User confirms before handoff happens
  // ═══════════════════════════════════════════════════════════════════════════
  const [handoffSummary, setHandoffSummary] = useState(null);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // NOTE: Vault state (showVault, activeVaultData, vaultUserMessage, miraPicks, 
  // showMiraTray) now comes from useVault hook above
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Unified C® button state (collapsed by default, expands to show WhatsApp/Chat/Email)
  const [showConciergeOptions, setShowConciergeOptions] = useState(false);
  
  // E018 & E019: Proactive Notifications - Birthday/Health Reminders
  const [proactiveAlerts, setProactiveAlerts] = useState({
    celebrations: [],
    healthReminders: [],
    hasUrgent: false
  });
  
  // Proactive Greeting - Time-based and context-aware
  const [proactiveGreeting, setProactiveGreeting] = useState(null);
  
  // Generate proactive greeting based on time and pet context
  useEffect(() => {
    if (!pet?.name) return;
    
    const hour = new Date().getHours();
    let greeting = '';
    let icon = '';
    let hasAlert = false;
    
    // Time-based greeting
    if (hour >= 5 && hour < 12) {
      greeting = `Good morning! How's ${pet.name} today?`;
      icon = '🌅';
    } else if (hour >= 12 && hour < 17) {
      greeting = `Good afternoon! What can I help with for ${pet.name}?`;
      icon = '☀️';
    } else if (hour >= 17 && hour < 21) {
      greeting = `Good evening! How was ${pet.name}'s day?`;
      icon = '🌆';
    } else {
      greeting = `Hello! ${pet.name} keeping you up? 😄`;
      icon = '🌙';
    }
    
    // Check for upcoming celebrations
    if (proactiveAlerts.celebrations.length > 0) {
      const upcoming = proactiveAlerts.celebrations.find(c => c.is_upcoming);
      if (upcoming) {
        greeting = `${upcoming.event} is coming up! Let's plan something special for ${pet.name}! 🎉`;
        icon = '🎂';
        hasAlert = true;
      }
    }
    
    // Check for health reminders
    if (proactiveAlerts.healthReminders.some(r => r.needs_attention)) {
      const urgent = proactiveAlerts.healthReminders.find(r => r.needs_attention);
      if (urgent && !hasAlert) {
        greeting = `Reminder: ${urgent.title} for ${pet.name}. Shall I help schedule?`;
        icon = '💊';
        hasAlert = true;
      }
    }
    
    setProactiveGreeting({ text: greeting, icon, hasAlert });
  }, [pet?.name, proactiveAlerts]);
  
  // HEALTH VAULT - Track completeness and prompt for missing data
  const [healthVault, setHealthVault] = useState({
    completeness: 0, // Start at 0, will update when pet data loads
    missing_fields: [],
    showWizard: false,
    currentField: null
  });
  
  // PERSONALIZATION TICKER - Moving ticker at top
  const [tickerItems, setTickerItems] = useState([]);
  
  // E027: DAILY DIGEST
  const [dailyDigest, setDailyDigest] = useState(null);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // TYPING ANIMATION - Stream text like a real assistant
  // ═══════════════════════════════════════════════════════════════════════════
  // isTyping, typingText already declared above with miraMode
  const [displayedText, setDisplayedText] = useState('');
  const [showSkeleton, setShowSkeleton] = useState(false);
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
  
  // Conversation stage tracking
  // Stage: 'initial' | 'clarifying' | 'concierge_engaged'
  const [conversationStage, setConversationStage] = useState('initial');
  
  // CLARIFYING QUESTION COUNTER - Limit to 4 before auto-transition
  // This prevents endless clarification loops
  const [clarifyingQuestionCount, setClarifyingQuestionCount] = useState(0);
  const MAX_CLARIFYING_QUESTIONS = 4;  // After 4 questions, auto-transition to transaction
  
  // Step tracking - ANTI-LOOP SYSTEM
  // Tracks which steps (questions) have been asked and answered
  const [completedSteps, setCompletedSteps] = useState([]);  // List of step_ids that are done
  const [currentStep, setCurrentStep] = useState(null);  // Currently open step waiting for answer
  const [stepHistory, setStepHistory] = useState([]);  // Full history of Q&A
  
  // WEATHER & INTERACTIVE FEATURES
  const [currentWeather, setCurrentWeather] = useState(null);
  const [showFeatureShowcase, setShowFeatureShowcase] = useState(true);
  
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
                personality: p.soul?.persona || 'friendly'
              };
            });
            
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
    
    console.log('[SESSION] Started new session:', newSessionId, 'for pet:', pet.name);
    return newSessionId;
  }, [baseStartNewSession, pet.name]);
  
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
              photo: p.photo || null
            }));
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
      if (!pet.id || pet.id === 'demo') return;
      
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
        const [placesResponse, statsResponse, digestResponse, milestonesResponse, memoryResponse, reorderResponse] = await Promise.all([
          fetch(`${API_URL}/api/mira/places/${pet.id}?city=${encodeURIComponent(placesCity)}`),
          fetch(`${API_URL}/api/mira/personalization-stats/${pet.id}`),
          fetch(`${API_URL}/api/mira/daily-digest/${pet.id}`),
          fetch(`${API_URL}/api/mira/milestones/${pet.id}`),
          fetch(`${API_URL}/api/mira/memory-lane/${pet.id}`),
          fetch(`${API_URL}/api/mira/reorder-suggestions/${pet.id}`)
        ]);
        
        const placesData = placesResponse.ok ? await placesResponse.json() : { places: [] };
        const statsData = statsResponse.ok ? await statsResponse.json() : { stats: [] };
        const digestData = digestResponse.ok ? await digestResponse.json() : { digest: [] };
        const milestonesData = milestonesResponse.ok ? await milestonesResponse.json() : { milestones: [] };
        const memoryData = memoryResponse.ok ? await memoryResponse.json() : { memories: [] };
        const reorderData = reorderResponse.ok ? await reorderResponse.json() : { suggestions: [] };
        
        // Store new feature data
        setDailyDigest(digestData);
        setMilestones(milestonesData.milestones || []);
        setMemoryLane(memoryData.memories || []);
        setReorderSuggestions(reorderData.suggestions || []);
        
        // Build ticker items
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
  }, [pet.id]);
  
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
      const response = await fetch(`${API_URL}/api/mira/session/list/by-member/${encodeURIComponent(memberId)}?limit=10`, {
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
              traits: ensureArray(p.doggy_soul_answers?.describe_3_words, ['Loving']),
              sensitivities: ensureArray(p.doggy_soul_answers?.health_conditions),
              favorites: ensureArray(p.doggy_soul_answers?.favorite_treats)
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

  
  // Handle submit - MIRA DOCTRINE: Let Mira's intelligence decide what to show
  const handleSubmit = useCallback(async (e, voiceQuery = null) => {
    if (e) e.preventDefault();
    
    let inputQuery = voiceQuery || query;
    if (!inputQuery.trim()) return;
    
    // ═══════════════════════════════════════════════════════════════════
    // VOICE SYNC FIX: Stop any playing voice when user sends new message
    // ═══════════════════════════════════════════════════════════════════
    if (voiceTimeoutRef.current) {
      clearTimeout(voiceTimeoutRef.current);
      voiceTimeoutRef.current = null;
    }
    stopSpeaking();
    
    // HAPTIC: Send message feedback
    hapticFeedback.sendMessage();
    
    // INTELLIGENT SPELLING CORRECTION
    const { corrected, corrections, hasCorrections } = correctSpelling(inputQuery);
    if (hasCorrections) {
      console.log('[MIRA] Spelling corrected:', corrections);
      inputQuery = corrected;
    }
    
    // CONVERSATION INTELLIGENCE - Detect follow-ups and enrich query
    const intelligence = conversationIntelligence.enrichQueryWithContext(inputQuery, conversationContext);
    console.log('[MIRA Intelligence]', {
      isFollowUp: intelligence.followUp.isFollowUp,
      followUpType: intelligence.followUp.type,
      topic: intelligence.topic,
      contextUsed: intelligence.contextUsed
    });
    
    // If it's a selection follow-up, resolve the reference
    if (intelligence.followUp.isFollowUp && intelligence.followUp.type === 'select_item') {
      const resolved = conversationIntelligence.resolveReference(inputQuery, conversationContext.lastResults);
      if (resolved?.resolved) {
        console.log('[MIRA] Resolved reference:', resolved.item?.name || resolved.item);
        // Add resolved item info to query for backend
        inputQuery = `${inputQuery} [RESOLVED: ${JSON.stringify(resolved.item)}]`;
      }
    }
    
    // Use enriched query if context was used
    if (intelligence.contextUsed.length > 0) {
      console.log('[MIRA] Using enriched query:', intelligence.enrichedQuery);
      inputQuery = intelligence.enrichedQuery;
    }
    
    // CRITICAL: Stop any existing voice when user sends new message
    stopSpeaking();
    
    // MIRA ENGINE MODE DETECTION - Using extracted helper
    setMiraMode(detectMiraMode(inputQuery));
    
    setIsProcessing(true);
    setQuery('');
    setQuickReplies([]); // Clear quick replies when user sends new message
    
    // Show skeleton loader after 800ms if still processing
    const skeletonTimer = setTimeout(() => {
      setShowSkeleton(true);
    }, 800);
    
    const userMessage = {
      type: 'user',
      content: corrected || inputQuery, // Show corrected query to user
      timestamp: new Date()
    };
    setConversationHistory(prev => [...prev, userMessage]);
    
    try {
      // E033: Check for relevant past conversation memory (using extracted helper)
      const memoryContext = await fetchConversationMemory(pet?.id, inputQuery);
      
      // E025: Check for pet mood concerns (using extracted helper)
      const moodContext = pet?.id ? await fetchMoodContext(inputQuery, pet.name) : null;
      
      // STEP 1: Route intent (first call for first message)
      let pillar = currentTicket?.pillar || 'General';
      let intent = currentTicket?.intent || 'GENERAL_HELP';
      let lifeState = currentTicket?.lifeState || 'EXPLORE';
      let ticketId = currentTicket?.id;
      
      // Check if user is asking for more info (NOT answering the question)
      // In this case, DON'T complete the step - Mira should explain and repeat the question
      const askingForMoreInfo = isAskingForMoreInfo(inputQuery);
      
      // ANTI-LOOP: If there's a current step waiting for answer, complete it
      // UNLESS the user is just asking for more info
      if (currentStep && currentTicket?.id && !askingForMoreInfo) {
        await completeStep(currentTicket.id, currentStep.step_id, inputQuery);
        console.log('[STEP] Answered pending step:', currentStep.step_id, '-> Answer:', inputQuery);
      } else if (askingForMoreInfo) {
        console.log('[STEP] User asking for more info, NOT completing step:', currentStep?.step_id);
      }
      
      if (!currentTicket) {
        // First message - route intent and create ticket (using extracted helpers)
        const intentData = await routeIntent({
          userId: user?.id,
          petId: pet.id,
          query: inputQuery,
          pet,
          token,
          userCity
        });
        
        pillar = intentData.pillar;
        intent = intentData.intent_primary;
        lifeState = intentData.life_state;
        
        // STEP 2: Create/attach ticket (using extracted helper)
        const ticketData = await createOrAttachTicket({
          userId: user?.id,
          petId: pet.id,
          pillar,
          intent,
          intentSecondary: intentData.intent_secondary,
          lifeState,
          query: inputQuery,
          token
        });
        
        ticketId = ticketData.ticket_id;
        
        setCurrentTicket({
          id: ticketId,
          status: ticketData.status,
          pillar: pillar,
          intent: intent,
          lifeState: lifeState
        });
        
        console.log('[TICKET] Created/attached:', ticketId, 'Pillar:', pillar);
      } else {
        // Not the first message - just sync the user message
        await syncToServiceDesk(currentTicket.id, userMessage);
      }
      
      // MIRA DOCTRINE: Let Mira show products when her intelligence decides it's relevant
      // No restrictive gates - Mira understands, judges, reasons, then shows options
      // Products are shown based on AI decision, not explicit user phrases
      
      // STEP 3: Get Mira's response
      // IMPORTANT: Pass completed_steps and step_history so LLM knows what's already been asked
      const response = await fetch(`${API_URL}/api/mira/os/understand-with-products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({
          input: inputQuery,
          pet_id: pet.id,
          pet_context: {
            name: pet.name,
            breed: pet.breed,
            age: pet.age,
            traits: pet.traits,
            sensitivities: pet.sensitivities,
            favorites: pet.favorites,
            // E042: Include user's detected city for local places
            city: pet?.city || pet?.location?.city || userCity || 'Mumbai',
            location: { city: pet?.city || pet?.location?.city || userCity || 'Mumbai' }
          },
          page_context: 'mira-demo',
          // SESSION PERSISTENCE - Pass session_id for conversation tracking
          session_id: sessionId,
          // MIRA DOCTRINE: Always let AI decide when products are relevant
          include_products: true,
          pillar: pillar,
          conversation_stage: conversationStage,
          ticket_id: ticketId,
          // ANTI-LOOP: Pass completed steps so LLM knows what's already been asked
          completed_steps: completedSteps,
          step_history: stepHistory.map(s => ({ step_id: s.step_id, answer: s.answer })),
          // FULL CONVERSATION HISTORY for context (last 10 messages)
          conversation_history: conversationHistory.slice(-10).map(m => ({
            role: m.type === 'user' ? 'user' : 'assistant',
            content: m.content
          })),
          // Tell LLM if user is asking for more info (should explain options, not complete step)
          user_asking_for_more_info: askingForMoreInfo,
          // Pass the current pending step so LLM knows what question to explain
          current_step: currentStep?.step_id || null,
          // ═══════════════════════════════════════════════════════════════════
          // CONVERSATION INTELLIGENCE - Pronoun resolution & follow-up context
          // "book that one" → knows which product | "cheaper ones" → remembers cake search
          // ═══════════════════════════════════════════════════════════════════
          last_shown_items: lastShownProducts,
          last_search_context: lastSearchContext
        })
      });
      
      const data = await response.json();
      
      // ═══════════════════════════════════════════════════════════════════
      // REAL-TIME SOUL SCORE UPDATE - The Pet Soul grows with every conversation!
      // Triggers glow animation when score increases
      // ═══════════════════════════════════════════════════════════════════
      if (data.pet_soul_score !== undefined && data.pet_soul_score !== null) {
        const newScore = Math.round(data.pet_soul_score);
        const oldScore = pet?.soulScore || 0;
        
        if (newScore > oldScore) {
          // Score increased! Trigger glow animation
          setSoulScoreUpdated(true);
          setTimeout(() => setSoulScoreUpdated(false), 2000);
          console.log(`[SOUL SCORE] 🌟 Grew from ${oldScore}% to ${newScore}%!`);
        }
        
        setPet(prev => ({
          ...prev,
          soulScore: newScore
        }));
        console.log('[SOUL SCORE] Updated to:', newScore);
      }
      
      let miraResponseText = data.response?.message || "I'm here to help!";
      
      // ═══════════════════════════════════════════════════════════════════
      // MEMORY WHISPER - Show memory context as subtle whisper, NOT inline
      // Mira remembers but doesn't shout about it
      // ═══════════════════════════════════════════════════════════════════
      if (memoryContext?.relevant_memory) {
        // Instead of prepending to message, show whisper notification
        setActiveMemoryContext(memoryContext);
        console.log('[MEMORY WHISPER] Showing memory context as whisper:', memoryContext.relevant_memory.topic);
        // Note: We no longer prepend to miraResponseText - the whisper handles it
      }
      
      // E025: Handle mood detection - modify response if pet mood concern detected
      if (moodContext?.mood_detected) {
        const moodResponse = moodContext.response;
        miraResponseText = `${moodResponse.intro} ${moodResponse.suggestion}\n\n${miraResponseText}`;
        console.log('[MOOD] Added mood-aware intro to response');
        
        // Save this to conversation memory if significant (using extracted helper)
        if (moodContext.should_save_memory && pet?.id) {
          saveConversationMemory({
            petId: pet.id,
            topic: 'behavior',
            summary: `${pet.name} ${moodContext.matched_indicator}`,
            query: inputQuery,
            advice: moodResponse.suggestion
          });
        }
      }
      
      // Extract contextual quick replies based on Mira's question
      const quickReplies = extractQuickReplies(data);
      
      // Check if Mira's response has a new clarifying question (step_id)
      // Use extracted helper for step ID detection
      let miraStepId = data.response?.step_id || detectStepId(miraResponseText);
      
      if (miraStepId) {
        console.log('[STEP] Detected step_id:', miraStepId);
      }
      
      // Check if this step has already been completed (anti-loop)
      const isAlreadyCompleted = miraStepId && completedSteps.includes(miraStepId);
      const isNewClarifyingQuestion = miraStepId && !isAlreadyCompleted;
      
      if (isAlreadyCompleted) {
        console.log('[ANTI-LOOP] Step already completed, should not show:', miraStepId);
      }
      
      if (isNewClarifyingQuestion) {
        // Set this as the current step waiting for answer
        setCurrentStep({
          step_id: miraStepId,
          question: miraResponseText
        });
        console.log('[STEP] New clarifying question, step_id:', miraStepId);
      }
      
      // MIRA DOCTRINE: Show products when AI decides they're relevant
      // No gates - Mira's intelligence determines when products are helpful
      let shouldShowProducts = data.response?.products?.length > 0;
      
      // MIRA DOCTRINE: COMFORT MODE - Be the Great Mother, not a salesman
      // In emotional moments (anxiety, fear, grief, health concerns), suppress products
      // Show presence, tips, empathy - NOT irrelevant product recommendations
      // Pass conversation history to maintain context (e.g., "thank you" after grief)
      const inComfortMode = isComfortMode(inputQuery, conversationHistory);
      
      if (inComfortMode) {
        console.log('[COMFORT_MODE] Detected emotional moment - suppressing products, being present');
        shouldShowProducts = false; // Don't push products during emotional moments
      }
      
      // MIRA DOCTRINE: Detect service intent for self-service wizard cards
      // In comfort mode, only show relevant services (training for anxiety, vet for health)
      let detectedServices = [];
      if (inComfortMode) {
        detectedServices = getComfortModeServices(inputQuery);
      } else {
        detectedServices = detectServiceIntent(inputQuery);
      }
      const hasServiceIntent = detectedServices.length > 0;
      
      // MIRA DOCTRINE: Detect experience intent for premium curated experiences
      // Suppress experiences in comfort mode - not the time
      let detectedExperiences = [];
      if (!inComfortMode) {
        detectedExperiences = detectExperienceIntent(inputQuery);
      }
      const hasExperienceIntent = detectedExperiences.length > 0;
      
      // MIRA DOCTRINE: CONCIERGE CAN DO ANYTHING (legal, moral, no medical)
      // In comfort mode, concierge is even more important - human touch for emotional moments
      const hasNoDirectMatch = !shouldShowProducts && !hasServiceIntent && !hasExperienceIntent;
      const dynamicConciergeRequest = hasNoDirectMatch ? generateConciergeRequest(inputQuery, pet.name) : null;
      
      // Check if Concierge is live (6:30 AM - 11:30 PM)
      const conciergeIsLive = isConciergeLive();
      
      // MIRA DOCTRINE: Concierge is premium service, not failure
      // ALWAYS show concierge - they can do ANYTHING
      const userWantsConcierge = inputQuery.toLowerCase().includes('concierge') || 
                                  inputQuery.toLowerCase().includes('help me') ||
                                  inputQuery.toLowerCase().includes('can you handle') ||
                                  inputQuery.toLowerCase().includes('plan');
      const hasConciergeFraming = data.response?.concierge_framing && data.response.concierge_framing.length > 0;
      // ALWAYS suggest concierge - they can handle any request
      const shouldSuggestConcierge = true; // Concierge can do ANYTHING
      
      // Build Mira message using extracted helper
      const miraMessage = buildMiraMessage({
        content: miraResponseText,
        data,
        quickReplies,
        shouldShowProducts,
        detectedServices,
        detectedExperiences,
        conciergeIsLive,
        inComfortMode,
        miraStepId,
        isNewClarifyingQuestion
      });
      
      // ═══════════════════════════════════════════════════════════════════
      // MIRA PICKS TRAY - Store products/services for "Ready for [Pet]"
      // IMPORTANT: Always store products in tray regardless of shouldShowProducts
      // The tray is "on-demand" - user opens when ready
      // Only suppress products in COMFORT MODE (grief/emotional moments)
      // ═══════════════════════════════════════════════════════════════════
      let newProducts = !inComfortMode ? (data.response?.products || []) : [];
      let newServices = (data.response?.services?.length > 0) 
        ? data.response.services 
        : (hasServiceIntent ? detectedServices : []);
      let newExperiences = hasExperienceIntent ? detectedExperiences : [];
      
      // ═══════════════════════════════════════════════════════════════════
      // CONVERSATION INTELLIGENCE - Track context for follow-up queries
      // "book that one" needs to know what products were shown
      // "cheaper ones" needs to know what we were searching for
      // ═══════════════════════════════════════════════════════════════════
      if (newProducts.length > 0 || newServices.length > 0) {
        // Save products/services for pronoun resolution ("that one", "the first one")
        const itemsForTracking = [
          ...newProducts.map(p => ({ name: p.name, price: p.price, id: p.id, type: 'product' })),
          ...newServices.map(s => ({ name: s.name, price: s.price, id: s.id, type: 'service' }))
        ];
        setLastShownProducts(itemsForTracking);
        console.log('[INTELLIGENCE] Tracking', itemsForTracking.length, 'items for pronoun resolution');
      }
      
      // Save search context from backend for follow-up queries ("cheaper ones", "show me more")
      if (data.intelligence?.last_search_context) {
        setLastSearchContext(data.intelligence.last_search_context);
        console.log('[INTELLIGENCE] Tracking search context:', data.intelligence.last_search_context.pillar);
      }
      
      // Log intelligence usage
      if (data.intelligence?.context_used) {
        console.log('[INTELLIGENCE] Context was used!', {
          pronoun: data.intelligence.pronoun_resolved,
          followUp: data.intelligence.follow_up_detected,
          original: data.intelligence.original_input,
          enhanced: data.intelligence.enhanced_input
        });
      }
      
      // Detect context from intent (using extracted helper)
      const { topic: detectedTopic, context: pickContext } = detectContextTopic(inputQuery, pet.name);
      
      // Store detected topic for tray rendering
      const celebrationSubIntent = detectedTopic;
      
      // ═══════════════════════════════════════════════════════════════════
      // YOUTUBE TRAINING VIDEOS - Detect training/learn intents (using extracted helpers)
      // ═══════════════════════════════════════════════════════════════════
      let trainingVideos = [];
      if (hasTrainingIntent(inputQuery) && pet?.id) {
        const videoTopic = extractTrainingTopic(inputQuery);
        trainingVideos = await fetchTrainingVideos(videoTopic, pet.breed || '');
      }
      
      // ═══════════════════════════════════════════════════════════════════
      // AMADEUS TRAVEL - Only fetch hotels AFTER conversation flow confirms
      // Per MIRA DOCTRINE: Ask questions first, then show results
      // WORLDWIDE SUPPORT: Uses extracted helper for city extraction
      // ═══════════════════════════════════════════════════════════════════
      let travelHotels = [];
      let travelAttractions = [];
      
      // Smart city extraction using extracted helper
      const detectedCity = extractCityFromQuery(inputQuery);
      
      // Check if this is a CONFIRMED travel request using extracted helper
      const shouldFetchHotels = detectedCity && shouldFetchTravelData(
        inputQuery, 
        conversationHistory.length, 
        data
      );
      
      if (shouldFetchHotels) {
        console.log('[TRAVEL FLOW] Confirmed - fetching hotels for:', detectedCity);
        // Fetch hotels and attractions in parallel using extracted helpers
        [travelHotels, travelAttractions] = await Promise.all([
          fetchTravelHotels(detectedCity),
          fetchTravelAttractions(detectedCity)
        ]);
      } else if (detectedCity) {
        console.log('[TRAVEL FLOW] City detected but waiting for confirmation. City:', detectedCity, '| History length:', conversationHistory.length);
      }
      
      // Add YouTube, Amadeus, and Viator data to message
      miraMessage.data.training_videos = trainingVideos;
      miraMessage.data.travel_hotels = travelHotels;
      miraMessage.data.travel_attractions = travelAttractions;
      miraMessage.data.travel_city = detectedCity;
      
      // E032: SEMANTIC SEARCH - Enhance tray with intent-based recommendations
      // If main API returned few results, use semantic search to find more relevant items
      if (!inComfortMode && pet?.id && (newProducts.length < 3 || newServices.length < 1)) {
        try {
          const semanticResponse = await fetch(`${API_URL}/api/mira/semantic-search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query: inputQuery,
              pet_id: pet.id,
              pet_name: pet.name,
              limit: 6
            })
          });
          const semanticData = await semanticResponse.json();
          
          if (semanticData.success && semanticData.intent_detected) {
            console.log('[SEMANTIC] Intent detected:', semanticData.primary_intent, '| Results:', semanticData.total_results);
            
            // Merge semantic results with existing results (avoid duplicates)
            const existingProductIds = new Set(newProducts.map(p => p.id));
            const semanticProducts = (semanticData.products || []).filter(p => !existingProductIds.has(p.id));
            newProducts = [...newProducts, ...semanticProducts].slice(0, 8);
            
            // Add semantic services
            const existingServiceIds = new Set(newServices.map(s => s.id));
            const semanticServices = (semanticData.services || []).filter(s => !existingServiceIds.has(s.id));
            newServices = [...newServices, ...semanticServices].slice(0, 4);
            
            // Add experiences
            const semanticExperiences = semanticData.experiences || [];
            newExperiences = [...newExperiences, ...semanticExperiences].slice(0, 3);
            
            // Use semantic context for tray label if we have meaningful results
            if (semanticData.tray_context && semanticData.total_results > 0 && !pickContext) {
              pickContext = semanticData.tray_context;
            }
          }
        } catch (e) {
          console.log('[SEMANTIC] Search failed:', e.message);
        }
      }
      
      // E033: Save meaningful conversations to memory (using extracted helper)
      if (pet?.id && isMeaningfulTopic(detectedTopic) && miraResponseText.length > 50) {
        saveConversationMemory({
          petId: pet.id,
          topic: detectedTopic,
          summary: inputQuery.substring(0, 100),
          query: inputQuery,
          advice: miraResponseText.substring(0, 200)
        });
      }
      
      // ═══════════════════════════════════════════════════════════════════════════
      // MODE SYSTEM - Respect backend flags for what to show
      // ═══════════════════════════════════════════════════════════════════════════
      const miraMode = data.mode || 'GENERAL';
      const clarifyOnly = data.clarify_only || false;
      const shouldShowProductsFromBackend = data.show_products !== false;
      const shouldShowServicesFromBackend = data.show_services !== false;
      const shouldShowConcierge = data.show_concierge !== false;
      
      console.log(`[MODE SYSTEM] Mode: ${miraMode} | Clarify only: ${clarifyOnly} | Show products: ${shouldShowProductsFromBackend}`);
      
      // ═══════════════════════════════════════════════════════════════════════════
      // NEARBY PLACES - Restaurants, Cafes, Parks, Hotels
      // These come from data.nearby_places NOT data.response.products
      // ═══════════════════════════════════════════════════════════════════════════
      const nearbyPlaces = data.nearby_places?.places || [];
      const placesType = data.nearby_places?.type || 'places'; // restaurants, parks, stays, etc.
      
      if (nearbyPlaces.length > 0) {
        console.log(`[PLACES] 📍 ${nearbyPlaces.length} ${placesType} found`);
        setMiraPicks(prev => ({
          ...prev,
          places: nearbyPlaces,
          placesType: placesType,
          mode: miraMode,
          showConcierge: shouldShowConcierge,
          hasNew: true
        }));
        setActiveVaultData({
          ...data.response,
          places: nearbyPlaces,
          nearby_places: data.nearby_places
        });
        setVaultUserMessage(inputQuery);
      }
      
      // Update miraPicks only if backend says we can show products/services
      // OR if it's a celebration sub-intent that needs special handling
      else if ((shouldShowProductsFromBackend && (newProducts.length > 0 || newServices.length > 0 || newExperiences.length > 0)) || 
          (!clarifyOnly && ['party_planning', 'cake_shopping', 'celebration'].includes(celebrationSubIntent))) {
        setMiraPicks({
          products: clarifyOnly ? [] : newProducts,
          services: clarifyOnly ? [] : [...newServices, ...newExperiences],
          context: pickContext,
          subIntent: celebrationSubIntent,
          mode: miraMode,
          clarifyOnly: clarifyOnly,
          showConcierge: shouldShowConcierge,
          hasNew: !clarifyOnly && (newProducts.length > 0 || newServices.length > 0)
        });
        
        // ═══════════════════════════════════════════════════════════════════════════
        // PICKS NOTIFICATION - Non-intrusive indicator
        // Instead of forcing vault open, show a subtle notification
        // User clicks to see picks when THEY want (not forced)
        // "Mira silently curates in background, yellow gift tells member picks are ready"
        // ═══════════════════════════════════════════════════════════════════════════
        if (!clarifyOnly && (newProducts.length > 0 || newServices.length > 0)) {
          setActiveVaultData(data.response || data);
          setVaultUserMessage(inputQuery);
          // DON'T auto-open vault - just mark that picks are available
          // The MiraTray or PicksIndicator will show the yellow gift icon
          console.log(`[PICKS READY] 🎁 ${newProducts.length} products, ${newServices.length} services curated silently`);
        }
        
        // ═══════════════════════════════════════════════════════════════════════════
        // TIP CARD - For advisory responses without products
        // Shows a summary card that can be sent to Concierge®
        // ═══════════════════════════════════════════════════════════════════════════
        const tipCard = data.response?.tip_card;
        if (tipCard) {
          console.log(`[TIP CARD] 📋 ${tipCard.type}: ${tipCard.title}`);
          // Add tip card to miraPicks so it shows in the vault
          setMiraPicks(prev => ({
            ...prev,
            tipCard: tipCard,
            hasNew: true
          }));
          setActiveVaultData({
            ...data.response,
            advice: tipCard.content,
            tip_card: tipCard
          });
        }
      } else if (clarifyOnly) {
        // Clarify-only mode - clear any existing picks
        setMiraPicks(prev => ({
          ...prev,
          products: [],
          services: [],
          mode: miraMode,
          clarifyOnly: true,
          showConcierge: false,
          hasNew: false
        }));
      }
      
      // ═══════════════════════════════════════════════════════════════════════════
      // TOPIC SHIFT HANDLING - Reset context when topic changes (using extracted helper)
      // ═══════════════════════════════════════════════════════════════════════════
      const topicShiftDetected = data.topic_shift || false;
      const currentPillar = data.current_pillar || 'general';
      const previousPillar = data.previous_pillar || null;
      
      if (topicShiftDetected) {
        console.log(`[TOPIC SHIFT] ${previousPillar} → ${currentPillar}`);
        const shiftIndicator = createTopicShiftIndicator(previousPillar, currentPillar);
        setConversationHistory(prev => [...prev, shiftIndicator, miraMessage]);
      } else {
        setConversationHistory(prev => [...prev, miraMessage]);
      }
      
      // UPDATE CONVERSATION CONTEXT - For follow-up intelligence
      const resultsToStore = data.nearby_places?.places || data.products || data.services || [];
      const resultsType = data.nearby_places?.type || (data.products?.length ? 'products' : 'services');
      const detectedLocation = data.nearby_places?.city || intelligence.entities.locations[0] || conversationContext.lastLocation;
      
      setConversationContext(prev => conversationIntelligence.updateContext(prev, {
        topic: intelligence.topic,
        results: resultsToStore,
        resultsType: resultsType,
        location: detectedLocation,
        preferences: intelligence.entities.preferences,
      }));
      
      console.log('[MIRA Context Updated]', {
        topic: intelligence.topic,
        resultsCount: resultsToStore.length,
        location: detectedLocation
      });
      
      // HAPTIC: Mira response complete
      hapticFeedback.miraResponse();
      
      // ═══════════════════════════════════════════════════════════════════════════
      // CONCIERGE CONFIRMATION BANNER - Show when service request received
      // Part of UNIFORM SERVICE FLOW: User → Mira Ticket → Concierge Action
      // ═══════════════════════════════════════════════════════════════════════════
      if (data.concierge_confirmation?.show_banner) {
        setConciergeConfirmation(data.concierge_confirmation);
        console.log('[CONCIERGE CONFIRM] Service request banner shown:', data.concierge_confirmation.ticket_id);
      }
      
      // ═══════════════════════════════════════════════════════════════════════════
      // QUICK REPLIES - Generate contextual suggestions for this response
      // Golden Standard: 3-4 actionable buttons after every advisory response
      // ═══════════════════════════════════════════════════════════════════════════
      const hasProducts = newProducts.length > 0;
      const hasServices = newServices.length > 0;
      const isAdvisory = !hasProducts && !hasServices && miraResponseText.length > 100;
      const currentPillarForReplies = data.current_pillar || data.pillar || 'general';
      
      const newQuickReplies = generateQuickReplies({
        pillar: currentPillarForReplies,
        hasProducts,
        hasServices,
        intent: data.understanding?.intent,
        isAdvisory,
        petName: pet?.name || 'your pet'
      });
      setQuickReplies(newQuickReplies);
      console.log(`[QUICK REPLIES] Generated ${newQuickReplies.length} suggestions for pillar: ${currentPillarForReplies}`);
      
      // Clear skeleton loader
      clearTimeout(skeletonTimer);
      setShowSkeleton(false);
      
      // 🎉 MICRO-DELIGHT: Confetti for celebrations (using extracted helper)
      if (isCelebrationQuery(inputQuery) && !inComfortMode) {
        // Slight delay for visual impact
        setTimeout(() => {
          triggerCelebrationConfetti();
        }, 800);
      }
      
      // VOICE OUTPUT - Speak Mira's response (using extracted helper for timing)
      if (voiceEnabled && miraResponseText) {
        console.log('[MIRA VOICE] Triggering voice for response, text length:', miraResponseText.length);
        // CRITICAL: Clear any pending voice timeout to prevent double voice
        if (voiceTimeoutRef.current) {
          clearTimeout(voiceTimeoutRef.current);
        }
        
        // Check if voice should be skipped (tile was clicked)
        if (skipVoiceOnNextResponseRef.current) {
          console.log('[MIRA VOICE] Skipping voice - response triggered by tile click');
          skipVoiceOnNextResponseRef.current = false; // Reset for next response
        } else {
          // Wait for text animation to complete, then speak (using extracted helper)
          const voiceDelay = calculateVoiceDelay(miraResponseText, miraMode);
          voiceTimeoutRef.current = setTimeout(() => {
            console.log('[MIRA VOICE] Now calling speakWithMira');
            speakWithMira(miraResponseText);
            voiceTimeoutRef.current = null;
          }, voiceDelay);
        }
      } else {
        console.log('[MIRA VOICE] Voice not triggered - voiceEnabled:', voiceEnabled, 'text:', !!miraResponseText);
      }
      
      // Sync Mira's response to service desk
      if (ticketId || currentTicket?.id) {
        await syncToServiceDesk(ticketId || currentTicket.id, {
          type: 'mira',
          content: miraResponseText
        }, {
          label: lifeState,
          chips_offered: quickReplies.map(r => r.text),
          product_suggestions: shouldShowProducts ? 
            data.response?.products?.slice(0, 5).map(p => ({ sku: p.id, name: p.name })) : [],
          step_id: miraStepId,
          is_clarifying_question: isNewClarifyingQuestion
        });
      }
      
      // ═══════════════════════════════════════════════════════════════════════════
      // CLARIFYING QUESTION LIMIT - Auto-transition after 4 questions
      // Prevents endless clarification loops
      // ═══════════════════════════════════════════════════════════════════════════
      if (isNewClarifyingQuestion) {
        const newCount = clarifyingQuestionCount + 1;
        setClarifyingQuestionCount(newCount);
        console.log(`[CLARIFY LIMIT] Question ${newCount} of ${MAX_CLARIFYING_QUESTIONS}`);
        
        // If we've reached the limit, auto-transition to showing picks/tips/concierge
        if (newCount >= MAX_CLARIFYING_QUESTIONS) {
          console.log('[CLARIFY LIMIT] Max questions reached - auto-transitioning');
          // Show what we have - products, tips, or send to concierge
          if (newProducts.length > 0 || newServices.length > 0) {
            // We have picks - show them
            setShowVault(true);
          } else if (data.response?.tip_card) {
            // We have a tip card - show insights
            setShowInsightsPanel(true);
          } else {
            // No picks/tips - trigger concierge handoff
            setShowConversationEndBanner(true);
            setConversationComplete(true);
          }
          // Reset counter
          setClarifyingQuestionCount(0);
        }
      }
      
      // Update conversation stage
      if (conversationStage === 'initial') {
        setConversationStage('clarifying');
      }
      
    } catch (error) {
      console.error('Mira error:', error);
      // Clear skeleton on error
      clearTimeout(skeletonTimer);
      setShowSkeleton(false);
      setIsTyping(false);
      
      // HAPTIC: Error feedback
      hapticFeedback.error();
      
      // Use extracted helper for error message
      const errorMessage = createErrorMessage(query);
      setConversationHistory(prev => [...prev, errorMessage]);
    }
    
    setIsProcessing(false);
    setShowSkeleton(false); // Always clear skeleton when done
  }, [query, token, user, pet, extractQuickReplies, currentTicket, syncToServiceDesk, 
      conversationStage, completedSteps, stepHistory, currentStep, completeStep, isAskingForMoreInfo,
      voiceEnabled, speakWithMira, stopSpeaking]);
  
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
    // Specific intents
    else if (contextLower.includes('meal') || contextLower.includes('diet') || contextLower.includes('nutrition') || contextLower.includes('protein')) {
      detectedPillar = 'fit';
      detectedTitle = 'Meal Plan Request';
    } else if (contextLower.includes('birthday') || contextLower.includes('party') || contextLower.includes('cake') || contextLower.includes('celebration') || contextLower.includes('gotcha')) {
      detectedPillar = 'celebrate';
      detectedTitle = 'Celebration Request';
    } else if (contextLower.includes('grooming') || contextLower.includes('bath') || contextLower.includes('haircut') || contextLower.includes('nail trim')) {
      detectedPillar = 'care';
      detectedTitle = 'Grooming Request';
    } else if (contextLower.includes('travel') || contextLower.includes('trip') || contextLower.includes('vacation') || contextLower.includes('flight')) {
      detectedPillar = 'travel';
      detectedTitle = 'Travel Request';
    } else if (contextLower.includes('cafe') || contextLower.includes('restaurant') || contextLower.includes('dine out')) {
      detectedPillar = 'dine';
      detectedTitle = 'Dining Request';
    } else if (contextLower.includes('walker') || contextLower.includes('sitter') || contextLower.includes('boarding') || contextLower.includes('daycare')) {
      detectedPillar = 'care';
      detectedTitle = 'Pet Care Service';
    } else if (contextLower.includes('vet') || contextLower.includes('vaccination') || contextLower.includes('checkup') || contextLower.includes('health')) {
      detectedPillar = 'care';
      detectedTitle = 'Health & Vet Request';
    } else if (contextLower.includes('hotel') || contextLower.includes('stay') || contextLower.includes('accommodation')) {
      detectedPillar = 'stay';
      detectedTitle = 'Stay Request';
    } else if (contextLower.includes('train') || contextLower.includes('teach') || contextLower.includes('behavior') || contextLower.includes('obedience')) {
      detectedPillar = 'learn';
      detectedTitle = 'Training Request';
    } else if (contextLower.includes('exercise') || contextLower.includes('fitness') || contextLower.includes('weight') || contextLower.includes('activity')) {
      detectedPillar = 'fit';
      detectedTitle = 'Fitness Request';
    } else if (contextLower.includes('document') || contextLower.includes('certificate') || contextLower.includes('insurance') || contextLower.includes('paperwork')) {
      detectedPillar = 'paperwork';
      detectedTitle = 'Documents Request';
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
  
  // Step 2: Actually send to Concierge (after user confirms)
  const handleConciergeHandoff = useCallback(async () => {
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
      
      // Map pillar to queue
      const queueMap = {
        'Food': 'FOOD',
        'Grooming': 'GROOMING',
        'Celebrate': 'CELEBRATE',
        'Travel': 'TRAVEL',
        'Health': 'HEALTH',
        'General': 'GENERAL'
      };
      const conciergeQueue = queueMap[currentTicket.pillar] || 'GENERAL';
      
      const response = await fetch(`${API_URL}/api/service_desk/handoff_to_concierge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({
          ticket_id: currentTicket.id,
          concierge_queue: conciergeQueue,
          latest_mira_summary: `Parent needs help with ${currentTicket.pillar.toLowerCase()} for ${pet.name} (${pet.breed}, ${pet.age}y). ${pet.sensitivities?.length ? `Allergies: ${pet.sensitivities.join(', ')}.` : ''} ${conversationSummary}`
        })
      });
      
      const data = await response.json();
      
      // Update local state
      setCurrentTicket(prev => ({
        ...prev,
        status: 'open_concierge'
      }));
      setConversationStage('concierge_engaged');
      
      // Add Mira's confirmation message
      const miraConfirmation = {
        type: 'mira',
        content: `I've asked your pet Concierge® to help with this. They'll review everything we've discussed about ${pet.name} and get back to you here.`,
        isConciergeHandoff: true,
        timestamp: new Date()
      };
      setConversationHistory(prev => [...prev, miraConfirmation]);
      
      console.log('[HANDOFF] Ticket handed off to Concierge:', currentTicket.id, '-> Queue:', conciergeQueue);
      
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
  }, [currentTicket, conversationHistory, pet, token]);
  
  // Handle quick reply
  const handleQuickReply = useCallback((replyValue, skipVoice = false) => {
    // ═══════════════════════════════════════════════════════════════════
    // VOICE SYNC FIX: Cancel any pending/playing voice before new action
    // This prevents overlap when tiles are clicked rapidly
    // ═══════════════════════════════════════════════════════════════════
    if (voiceTimeoutRef.current) {
      clearTimeout(voiceTimeoutRef.current);
      voiceTimeoutRef.current = null;
    }
    stopSpeaking();
    
    // Mark that the next response should skip voice (tile was clicked)
    skipVoiceOnNextResponseRef.current = true;
    
    // HAPTIC: Chip tap
    hapticFeedback.chipTap();
    setQuery(replyValue);
    setTimeout(() => {
      if (handleSubmitRef.current) {
        handleSubmitRef.current(null, replyValue);
      }
    }, 50);
  }, [stopSpeaking]);
  
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
        
        // Add confirmation message to chat
        const confirmationMessage = {
          type: 'mira',
          content: `I've submitted your ${service.label} request for ${pet.name}. Your request ID is **${ticketData.ticket_id}**. ${isConciergeLive() ? 'Your pet Concierge® has been notified and will reach out shortly!' : 'Our team will follow up first thing at 6:30 AM.'}`,
          isConfirmation: true,
          serviceRequest: {
            id: ticketData.ticket_id,
            service: service.label,
            status: 'submitted'
          },
          timestamp: new Date()
        };
        setConversationHistory(prev => [...prev, confirmationMessage]);
        
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
        
        setServiceRequestModal(prev => ({
          ...prev,
          isSubmitting: false,
          submitted: true
        }));
        
        // Close modal after showing success briefly
        setTimeout(() => {
          setServiceRequestModal({
            isOpen: false,
            service: null,
            formData: {},
            isSubmitting: false,
            submitted: false
          });
        }, 2500);
        
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
  }, [serviceRequestModal, pet, token, user]);
  
  // Close service request modal
  const closeServiceRequest = useCallback(() => {
    setServiceRequestModal({
      isOpen: false,
      service: null,
      formData: {},
      isSubmitting: false,
      submitted: false
    });
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
          ═══════════════════════════════════════════════════════════════════ */}
      <MemoryWhisper 
        memoryContext={activeMemoryContext}
        petName={pet?.name || 'your pet'}
        onDismiss={() => setActiveMemoryContext(null)}
        autoDismissDelay={8000}
      />
      
      {/* PERSONALIZATION TICKER - Animated ribbon showing how Mira knows the pet */}
      {tickerItems.length > 0 && (
        <div className="mira-ticker">
          <div className="ticker-track">
            <div className="ticker-content">
              {/* Duplicate items for seamless loop */}
              {[...tickerItems, ...tickerItems, ...tickerItems].map((item, i) => (
                <span 
                  key={`ticker-${i}`} 
                  className={`ticker-item ticker-${item.type}`}
                  onClick={() => {
                    if (item.type === 'place') {
                      handleQuickReply(`Tell me about ${item.text.split(' welcomes')[0]} for ${pet.name}`);
                    } else if (item.type === 'weather') {
                      handleQuickReply(`What activities are good for ${pet.name} in this weather?`);
                    }
                  }}
                >
                  <span className="ticker-icon">{item.icon}</span>
                  <span className="ticker-text">{item.text}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
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
            />
          </div>
        </div>
      </header>
      
      {/* NAVIGATION DOCK - Extracted to NavigationDock component */}
      <NavigationDock
        inputRef={inputRef}
        onShowHelp={() => setShowHelpModal(true)}
        onShowLearn={() => { setShowLearnModal(true); fetchLearnVideos('recommended'); }}
      />
      
      {/* FLOATING ACTION BAR - Extracted to FloatingActionBar component */}
      <FloatingActionBar
        isVisible={conversationHistory.length > 0}
        showPastChats={showPastChats}
        showInsights={showInsightsPanel}
        showConcierge={showConciergePanel}
        onPastChatsClick={() => { loadPastChats(); setShowPastChats(true); }}
        onInsightsClick={() => setShowInsightsPanel(!showInsightsPanel)}
        onConciergeClick={() => setShowConciergePanel(!showConciergePanel)}
        onNewChatClick={startNewSession}
      />
      
      {/* INSIGHTS PANEL - Extracted to InsightsPanel component */}
      <InsightsPanel
        isOpen={showInsightsPanel}
        onClose={() => setShowInsightsPanel(false)}
        petName={pet.name}
        conversationHistory={conversationHistory}
        tipCard={miraPicks.tipCard}
        memoryContext={activeMemoryContext}
      />
      
      {/* CONCIERGE PANEL - Extracted to ConciergePanel component */}
      <ConciergePanel
        isOpen={showConciergePanel}
        onClose={() => setShowConciergePanel(false)}
        pet={pet}
        onChatHandoff={handleConciergeHandoff}
      />
      
      {/* CONCIERGE CONFIRMATION BANNER - Shows when service request received */}
      <ConciergeConfirmation
        confirmation={conciergeConfirmation}
        onDismiss={() => setConciergeConfirmation(null)}
        petName={pet?.name || 'your pet'}
      />
      
      {/* HANDOFF SUMMARY - Shows BEFORE sending to Concierge® */}
      <HandoffSummary
        isOpen={handoffSummary?.isOpen || false}
        onClose={() => setHandoffSummary(null)}
        onConfirm={async () => {
          setHandoffSummary(null);
          await handleConciergeHandoff();
        }}
        onEdit={() => {
          setHandoffSummary(null);
          // Focus on input for user to add more details
          inputRef.current?.focus();
        }}
        petName={handoffSummary?.petName || pet?.name || 'your pet'}
        pillar={handoffSummary?.pillar || currentPillar?.toLowerCase()}
        title={handoffSummary?.title || 'Request Summary'}
        items={handoffSummary?.items || []}
        notes={handoffSummary?.notes || ''}
      />
      
      {/* PICKS INDICATOR - Yellow gift icon when Mira has curated picks OR tip card OR places */}
      {/* Non-intrusive: user clicks to view, not forced */}
      <PicksIndicator
        picksCount={(miraPicks.products?.length || 0) + (miraPicks.services?.length || 0) + (miraPicks.places?.length || 0) + (miraPicks.tipCard ? 1 : 0)}
        hasNewPicks={miraPicks.hasNew}
        onClick={() => setShowVault(true)}
        petName={pet?.name || 'your pet'}
      />
      
      {/* TEST SCENARIOS PANEL - Extracted to TestScenariosPanel component */}
      <TestScenariosPanel
        isOpen={showTestScenarios}
        onClose={() => setShowTestScenarios(false)}
        activeScenario={activeScenario}
        onScenarioClick={(id, query) => {
          setActiveScenario(id);
          handleQuickReply(query);
        }}
      />
      
      {/* Past Chats Sidebar */}
      {/* Past Chats Panel - Extracted to PastChatsPanel component (Stage 5) */}
      <PastChatsPanel
        isOpen={showPastChats}
        onClose={() => setShowPastChats(false)}
        sessions={pastSessions}
        isLoading={loadingPastChats}
        currentSessionId={sessionId}
        onLoadSession={loadSession}
        onStartNewChat={startNewSession}
      />

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
                  onAlertAction={(alert) => {
                    // Handle alert CTA - send as message to Mira
                    const actionMessages = {
                      'book_vet_vaccination': `I need to schedule ${pet.name}'s vaccination`,
                      'book_grooming': `Book a grooming appointment for ${pet.name}`,
                      'celebrate_birthday': `Let's celebrate ${pet.name}'s birthday!`,
                      'plan_birthday_party': `Help me plan ${pet.name}'s birthday party`,
                      'order_birthday_cake': `Order a birthday cake for ${pet.name}`
                    };
                    const message = actionMessages[alert.cta_action] || alert.message;
                    setQuery(message);
                    // Use setTimeout to ensure state is updated before submit
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
      
      {/* Scroll to Bottom Button - Extracted to ScrollToBottomButton component */}
      <ScrollToBottomButton 
        visible={hasNewMessages && !isAtBottom}
        onClick={() => scrollToBottom()}
      />
      
      {/* Input Composer - Extracted to ChatInputBar component */}
      <ChatInputBar
        inputRef={inputRef}
        query={query}
        onQueryChange={(value) => {
          setQuery(value);
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
      
      {/* HEALTH VAULT WIZARD - Extracted to HealthVaultWizard component */}
      <HealthVaultWizard
        isOpen={healthVault.showWizard}
        onClose={() => setHealthVault(prev => ({ ...prev, showWizard: false }))}
        pet={pet}
        completeness={healthVault.completeness}
        missingFields={healthVault.missing_fields}
        onFieldClick={(field) => handleQuickReply(`I want to add ${pet.name}'s ${field.label.toLowerCase()}`)}
      />
      
      {/* Help Modal */}
      {/* HELP MODAL - Extracted to HelpModal component */}
      <HelpModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
        onOrderHelp={() => handleQuickReply('I need help with my order')}
        onConciergeChat={handleConciergeHandoff}
      />
      
      {/* LEARN MODAL - Extracted to LearnModal component */}
      <LearnModal
        isOpen={showLearnModal}
        onClose={() => setShowLearnModal(false)}
        pet={pet}
        activeCategory={learnCategory}
        videos={learnVideos}
        isLoading={learnLoading}
        onCategoryChange={fetchLearnVideos}
      />
      
      {/* SERVICE REQUEST MODAL - Extracted to ServiceRequestModal component */}
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
      
      {/* ═══════════════════════════════════════════════════════════════════════════
          VAULT SYSTEM - Full-screen overlay for picks, bookings, places, etc.
          "Mira is the Brain, Concierge® is the Hands"
          ═══════════════════════════════════════════════════════════════════════════ */}
      {showVault && (
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
                setMessages(prev => [...prev, {
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


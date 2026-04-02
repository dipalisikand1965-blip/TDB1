/**
 * MiraChatWidget - Floating Chat Widget for Mira AI
 * 
 * MakeMyTrip-style floating chat widget that:
 * - Shows as the beautiful MiraOrb when closed
 * - Opens as a clean chat modal when clicked
 * - Non-blocking and can be minimized anytime
 * - Works on all pages (pillar pages, homepage, etc.)
 * 
 * IMPORTANT: This is a UI wrapper around Mira's intelligence.
 * All core Mira logic (voice, ticket creation, recommendations) is preserved.
 */

import React, { useState, useEffect, useRef, useCallback, Component } from 'react';
import ReactDOM from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { getApiUrl } from '../utils/api';
import { toast } from 'sonner';
import { useMiraSignal } from '../hooks/useMiraSignal';
import { useResizeMobile } from '../hooks/useResizeMobile';
import MiraOrb from './MiraOrb';
import CinematicKitAssembly from './CinematicKitAssembly';
import MiraConciergeCards, { parseMiraRecommendations } from './MiraConciergeCard';
import { ProductDetailModal } from './ProductCard';
import PersonalizedPicksPanel from './Mira/PersonalizedPicksPanel';
import ReactMarkdown from 'react-markdown';
import '../styles/mira-universal.css';
import { tdc } from '../utils/tdc_intent';
import ServiceConciergeModal from './services/ServiceConciergeModal';
import { 
  X, Send, Loader2, Mic, MicOff, Volume2, VolumeX, 
  ChevronDown, Sparkles, PawPrint, MessageCircle, Zap,
  ArrowLeft, ShoppingCart, Plus, Heart, ShoppingBag, Play, Package, MapPin
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

// ─── Mira Conversational Memory helpers (mirrored from useChatSubmit) ───────
const MEMORY_TRIGGERS = {
  health:     ['infection', 'bacteria', 'itch', 'scratch', 'bite', 'vet',
               'medication', 'sick', 'fever', 'vomit', 'diarrhea', 'wound',
               'surgery', 'allergy', 'reaction', 'pain', 'limp'],
  milestone:  ['birthday', 'gotcha day', 'first', 'learned', 'achievement',
               'graduated', 'weight', 'vaccine', 'neutered', 'spayed'],
  grief:      ['passed', 'died', 'loss', 'rainbow bridge', 'miss', 'cremation'],
  behaviour:  ['anxiety', 'aggressive', 'fearful', 'training', 'progress'],
  nutrition:  ['new food', 'changed diet', 'stopped eating', 'weight gain',
               'weight loss', 'supplement started'],
};
const detectMemoryType = (msg) => {
  const lower = (msg || '').toLowerCase();
  for (const [type, keywords] of Object.entries(MEMORY_TRIGGERS)) {
    if (keywords.some(k => lower.includes(k))) return type;
  }
  return null;
};
const generateFollowUp = (type, petName) => ({
  health:    `How is ${petName} doing? Did the health concern we discussed get resolved?`,
  milestone: `Has ${petName} hit any new milestones since we last spoke?`,
  grief:     `How are you doing? Thinking of you and ${petName}.`,
  behaviour: `How is ${petName}'s behaviour coming along?`,
  nutrition: `How is ${petName} getting on with the diet change?`,
}[type] || `How is ${petName} doing since we last spoke?`);
const RESOLVE_SIGNALS = ['better','recovered','fine now','all good','cleared up','healed','fixed','resolved','thank you','doing well'];
// ────────────────────────────────────────────────────────────────────────────

// Error boundary for safe markdown rendering
class SafeMarkdownRenderer extends Component {
  state = { hasError: false };
  
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  
  componentDidCatch(error, info) {
    console.warn('[Mira] Markdown rendering error:', error);
  }
  
  render() {
    if (this.state.hasError) {
      // Fallback: render as plain text
      return <span>{this.props.children}</span>;
    }
    return (
      <ReactMarkdown
        components={{
          p: ({ children }) => <span className="block mb-1 last:mb-0">{children}</span>,
          strong: ({ children }) => <strong className="font-bold">{children}</strong>,
          ul: ({ children }) => <ul className="list-disc pl-4 my-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-4 my-1">{children}</ol>,
          li: ({ children }) => <li className="mb-0.5">{children}</li>,
        }}
      >
        {this.props.children}
      </ReactMarkdown>
    );
  }
}

// Generate session ID for Mira conversations - PERSISTS across pillar switches
const generateSessionId = () => {
  const stored = sessionStorage.getItem('mira_widget_session');
  if (stored) return stored;
  const newId = `mira-widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  sessionStorage.setItem('mira_widget_session', newId);
  return newId;
};

// Store and retrieve messages - UNIFIED across all pillars for cross-pillar memory
// Messages now persist across pillar switches so Mira remembers the full conversation
const getStoredMessages = (pillar) => {
  try {
    // First try unified storage (cross-pillar)
    const unified = sessionStorage.getItem('mira_messages_unified');
    if (unified) {
      return JSON.parse(unified);
    }
    // Fallback to pillar-specific for backward compatibility
    const stored = sessionStorage.getItem(`mira_messages_${pillar}`);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    return [];
  }
};

const storeMessages = (messages, pillar) => {
  try {
    // Store in unified storage (cross-pillar memory)
    sessionStorage.setItem('mira_messages_unified', JSON.stringify(messages));
    // Also store pillar-specific for backward compatibility
    sessionStorage.setItem(`mira_messages_${pillar}`, JSON.stringify(messages));
  } catch (e) {
    console.debug('Failed to store messages:', e);
  }
};

// ── Page-specific Mira opening lines (Mira_Widget_MASTER.docx Section 4) ─────
const PILLAR_OPENING_LINES = {
  celebrate: (pn, gr) => `${gr}. I see you're thinking about celebrating ${pn} today. What kind of moment are we planning?`,
  dine:      (pn, gr) => `${gr}. I'm thinking about ${pn}'s food today too. What can I help with — a meal, a treat, or somewhere to take them?`,
  stay:      (pn, gr) => `${gr}. Planning somewhere to take ${pn}? I know what they need to feel comfortable away from home.`,
  learn:     (pn, gr) => `${gr}. ${pn} has a bright mind. What are we working on together?`,
  care:      (pn, gr) => `${gr}. Let's make sure ${pn} is well looked after. What does ${pn} need today?`,
  travel:    (pn, gr) => `${gr}. Planning a trip with ${pn}? Tell me where you're headed and I'll make sure they're ready.`,
  enjoy:     (pn, gr) => `${gr}. ${pn} deserves a great day. What are we doing together?`,
  fit:       (pn, gr) => `${gr}. Ready to work on ${pn}'s fitness? What are we training today?`,
  advisory:  (pn, gr) => `${gr}. I'm here for all things ${pn}. Ask me anything.`,
  emergency: (pn, gr) => `${gr}. I'm here. Tell me what's happening with ${pn} right now.`,
  farewell:  (pn, gr) => `${gr}. This is one of the hardest times. I'm here with you and ${pn}.`,
  adopt:     (pn, gr) => `${gr}. Thinking about bringing a new friend home? I can help you find the right match.`,
  shop:      (pn, gr) => `${gr}. Looking for something for ${pn}? I'll point you to the best.`,
  go:        (pn, gr) => `${gr}. I know all the best spots for ${pn}. Where are we going today — a park, trail, or somewhere new?`,
  play:      (pn, gr) => `${gr}. ${pn} is ready to play! What are we doing today — dog park, trail, or outdoor adventure?`,
  general:   (pn, gr) => `${gr}! How can I help${pn ? ` with ${pn}` : ''} today? 🐾`,
};

// ── Page-specific quick chips (Mira_Widget_MASTER.docx + user spec) ───────────
// {petName} is replaced at render time
const PILLAR_CHIPS = {
  celebrate: ['🎂 Plan {petName}\'s birthday', '✦ Surprise me, Mira'],
  dine:      ['🐟 What should {petName} eat today?', '🍽️ Find {petName} a restaurant'],
  stay:      ['🏡 Where can {petName} stay?', '✦ Plan a trip for {petName}'],
  learn:     ['🧠 What should {petName} learn next?', '✦ Make {petName} smarter'],
  care:      ['🐾 What does {petName} need today?', '✦ Book something for {petName}'],
  travel:    ['✈️ Plan a trip with {petName}', '🐾 What does {petName} need to travel?'],
  enjoy:     ['🎾 What should {petName} do today?', '📍 Find dog-friendly spots near me'],
  fit:       ['🏃 What\'s {petName}\'s workout today?', '✦ Build a fitness plan for {petName}'],
  advisory:  ['❓ Ask Mira anything about {petName}', '✦ Get Mira\'s advice'],
  emergency: ['🚨 Find emergency vet near me', '❓ Is this an emergency?'],
  farewell:  ['💕 Help me plan {petName}\'s farewell', '✦ Talk to Mira'],
  adopt:     ['🐾 Help me find the right pet', '✦ Are we ready to adopt?'],
  shop:      ['🛒 What does {petName} need from the shop?', '✦ Best sellers for {petName}'],
  go:        ['🗺️ Find dog-friendly spots for {petName}', '✦ Plan a trip with {petName}'],
  play:      ['🌳 Find a dog park near me', '✦ What should {petName} play today?'],
  general:   ['✦ How is {petName} today?', '📋 What\'s on {petName}\'s plan?'],
};

// ── Product card suppress logic (Mira_Widget_MASTER.docx Section 3) ──────────
// Only suppress products for genuine grief/critical-medical contexts
// Do NOT include common words (gentle, feel, happy, comfortable) — they appear in every food/care response
const SUPPRESS_PRODUCT_KEYWORDS = [
  'lymphoma', 'chemotherapy', 'terminal', 'euthanasia',
  'rainbow bridge', 'passed away', 'put to sleep', 'put him to sleep', 'put her to sleep',
  'grief counseling', 'cremation', 'final moments'
];
const shouldShowProducts = (responseText) => {
  if (!responseText || typeof responseText !== 'string') return false;
  const lower = responseText.toLowerCase();
  return !SUPPRESS_PRODUCT_KEYWORDS.some(kw => lower.includes(kw));
};

const PILLAR_PATHS = [
  '/dine', '/care', '/go', '/play', '/learn', '/celebrate-soul', '/celebrate',
  '/shop', '/services', '/paperwork', '/emergency', '/farewell', '/adopt',
  '/cakes', '/treats', '/meals', '/breed-cakes', '/product/',
  // Member account & utility pages — widget lives inside these, don't show FAB
  '/pet-home', '/my-pets', '/dashboard', '/notifications', '/profile',
  '/my-requests', '/orders', '/rewards', '/checkout', '/tickets',
  '/soul-builder', '/paw-points', '/documents', '/addresses', '/membership',
  '/pet-profile', '/wrapped', '/login', '/register', '/onboarding',
  '/mira', '/admin',
];

const MiraChatWidget = ({ 
  pillar: pillarProp = 'general',
  onProductClick = null,
  className = '',
  hideMiraChatOnPillarPages = false
}) => {
  const { user, token } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const loc = useLocation();

  // Derive pillar from URL when parent passes null/general (global floating widget)
  const _KNOWN_PILLARS = ['dine','care','go','play','learn','celebrate','shop','services','paperwork','emergency','farewell','adopt'];
  const _urlDerivedPillar = _KNOWN_PILLARS.find(p => loc.pathname === '/' + p || loc.pathname.startsWith('/' + p + '/')) || null;
  const pillar = pillarProp || _urlDerivedPillar || 'general';

  // Viewport-level mobile detection — ResizeObserver on document.body
  // Debounced at 150ms, handles device rotation and Chrome DevTools resize
  const isMobile = useResizeMobile(1024); // proper desktop breakpoint — prevents body lock on desktop
  
  // Widget state
  const [isOpen, setIsOpen] = useState(false);
  const [activeFollowUpMemoryId, setActiveFollowUpMemoryId] = useState(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const followUpCheckedRef = useRef(false); // prevents re-running follow-up check on each dep change
  const lastPetSwitchRef = useRef({ id: null, ts: 0 }); // deduplicate rapid petChanged events

  // Signal to the page that Mira is open → product modals can shift left to avoid overlap
  useEffect(() => {
    document.body.setAttribute('data-mira-open', isOpen ? 'true' : 'false');
    return () => document.body.removeAttribute('data-mira-open');
  }, [isOpen]);
  
  // Cinematic Kit Assembly state
  const [showCinematicKit, setShowCinematicKit] = useState(false);
  const [cinematicKitData, setCinematicKitData] = useState({ name: '', items: [] });
  const [selProd, setSelProd] = useState(null); // chip-tapped product → opens ProductDetailModal
  const [bookingModal, setBookingModal] = useState({ open: false, service: null }); // service chip → opens ServiceConciergeModal
  
  // Pet Picks Panel state (PersonalizedPicksPanel for pillar-specific picks)
  const [showPicksPanel, setShowPicksPanel] = useState(false);
  
  // Chat state - Initialize empty, will load per-pillar messages in useEffect
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sessionId] = useState(generateSessionId);
  const [selectedPet, setSelectedPet] = useState(null);
  const [pets, setPets] = useState([]);
  const [currentPillar, setCurrentPillar] = useState(pillar);
  const [messagesLoaded, setMessagesLoaded] = useState(false);
  // Persistent memory (MongoDB-backed)
  const [persistentPreferences, setPersistentPreferences] = useState([]);
  const [persistentServiceInterests, setPersistentServiceInterests] = useState([]);
  const memoryFetchedRef = useRef(false); // prevent double-fetch
  
  // Pet-specific recommendations & soul intelligence
  const [petRecommendations, setPetRecommendations] = useState([]);
  const [petSoulInsights, setPetSoulInsights] = useState(null);
  const [quickActions, setQuickActions] = useState([]);
  
  // "All Pets" mode - when true, shows recommendations for all pets
  const [allPetsMode, setAllPetsMode] = useState(false);
  
  // Support filters state (Mira-driven personalization)
  const [activeSupportFilters, setActiveSupportFilters] = useState([]);

  // Product card visibility — delay 800ms after response, suppress for health/emotion
  const [visibleProducts, setVisibleProducts] = useState(new Set());
  
  // Voice state
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const voiceEnabledRef = useRef(true); // always-current ref for async closures
  const [speechSupported, setSpeechSupported] = useState(false);
  const [useElevenLabs, setUseElevenLabs] = useState(true); // Prefer ElevenLabs
  const recognitionRef = useRef(null);
  const synthRef = useRef(typeof window !== 'undefined' ? window.speechSynthesis : null);
  const audioRef = useRef(null);
  
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  // Keep voiceEnabledRef in sync with state, and stop audio immediately on toggle-off
  useEffect(() => {
    voiceEnabledRef.current = voiceEnabled;
    if (!voiceEnabled) {
      // Stop any playing ElevenLabs audio
      if (audioRef.current) {
        try { audioRef.current.pause(); audioRef.current.currentTime = 0; } catch(e) {}
        audioRef.current = null;
      }
      // Stop Web Speech
      if (synthRef.current) {
        try { synthRef.current.cancel(); } catch(e) {}
      }
      setIsSpeaking(false);
    }
  }, [voiceEnabled]);
  
  // Mira Signal tracking for passive learning & personalization
  const miraSignal = useMiraSignal() || {};
  const trackPillarVisit = miraSignal.trackPillarVisit || function() {};
  const trackClick = miraSignal.trackClick || function() {};
  
  // Dynamic quick prompts from API
  const [dynamicPrompts, setDynamicPrompts] = useState([]);
  
  // Personalized context from Mira
  const [miraContext, setMiraContext] = useState(null);
  
  // Pillar-specific configurations
  const pillarConfig = {
    general: { icon: '🐾', name: 'General', color: 'from-purple-600 to-indigo-600' },
    services: { icon: '✨', name: 'Services', color: 'from-purple-500 to-pink-500' },
    stay: { icon: '🏨', name: 'Stay', color: 'from-purple-500 to-violet-500' },
    travel: { icon: '✈️', name: 'Travel', color: 'from-blue-500 to-cyan-500' },
    care: { icon: '💊', name: 'Care', color: 'from-rose-500 to-pink-600' },
    fit: { icon: '🏃', name: 'Fit', color: 'from-teal-500 to-cyan-500' },
    dine: { icon: '🍽️', name: 'Dine', color: 'from-orange-500 to-amber-500' },
    celebrate: { icon: '🎂', name: 'Celebrate', color: 'from-pink-500 to-rose-500' },
    enjoy: { icon: '🎾', name: 'Enjoy', color: 'from-yellow-500 to-orange-500' },
    learn: { icon: '🎓', name: 'Learn', color: 'from-blue-600 to-indigo-600' },
    paperwork: { icon: '📄', name: 'Paperwork', color: 'from-gray-500 to-slate-500' },
    advisory: { icon: '📋', name: 'Advisory', color: 'from-purple-500 to-violet-600' },
    emergency: { icon: '🚨', name: 'Emergency', color: 'from-red-500 to-rose-600' },
    farewell: { icon: '🌈', name: 'Farewell', color: 'from-indigo-400 to-purple-400' },
    adopt: { icon: '🐾', name: 'Adopt', color: 'from-green-500 to-emerald-500' },
    shop: { icon: '🛒', name: 'Shop', color: 'from-indigo-500 to-purple-500' },
    play: { icon: '🌳', name: 'Play', color: 'from-orange-500 to-red-800' },
    go:   { icon: '🗺️', name: 'Go',   color: 'from-teal-500 to-cyan-600' }
  };
  
  const config = pillarConfig[pillar] || pillarConfig.general;
  
  // Helper to get time of day greeting
  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  };
  
  // State for voices
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  
  // Initialize speech recognition and preload voices
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Preload voices - critical for mobile browsers
    const synth = window.speechSynthesis;
    if (synth) {
      // Force voices to load
      const loadVoices = () => {
        const voices = synth.getVoices();
        if (voices.length > 0) {
          setVoicesLoaded(true);
          console.log('[Mira Voice] Loaded', voices.length, 'voices');
        }
      };
      
      // Some browsers need this event
      if (synth.onvoiceschanged !== undefined) {
        synth.onvoiceschanged = loadVoices;
      }
      
      // Try loading immediately too
      loadVoices();
      
      // Fallback: try again after 500ms
      setTimeout(loadVoices, 500);
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      try {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-IN';
        
        recognitionRef.current.onresult = (event) => {
          const transcript = Array.from(event.results)
            .map(result => result[0].transcript)
            .join('');
          setInputValue(transcript);
        };
        
        recognitionRef.current.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
          if (event.error === 'not-allowed') {
            toast.error('Microphone access denied');
          }
        };
        
        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      } catch (err) {
        console.error('Failed to initialize speech recognition:', err);
        setSpeechSupported(false);
      }
    }
    
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch(e) { /* ignore */ }
      }
      const synth = synthRef.current;
      if (synth) {
        try { synth.cancel(); } catch(e) { /* ignore */ }
      }
    };
  }, []);
  
  // Track pillar visit and fetch personalized context
  useEffect(() => {
    let cancelled = false;
    trackPillarVisit(pillar);

    const fetchQuickPrompts = async () => {
      if (!pillar || pillar === 'null') return;
      try {
        const response = await fetch(`${getApiUrl()}/api/mira/quick-prompts/${pillar}`);
        if (!cancelled && response.ok) {
          const data = await response.json();
          setDynamicPrompts(data.prompts || []);
        }
      } catch (error) {
        if (!cancelled) console.debug('Quick prompts fetch failed:', error);
      }
    };

    const fetchMiraContext = async () => {
      if (!token) return;
      try {
        const response = await fetch(`${getApiUrl()}/api/mira/context/${pillar}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!cancelled && response.ok) {
          const data = await response.json();
          setMiraContext(data);
        }
      } catch (error) {
        if (!cancelled) console.debug('Mira context fetch failed:', error);
      }
    };

    fetchQuickPrompts();
    fetchMiraContext();
    return () => { cancelled = true; };
  }, [pillar, trackPillarVisit, token]);
  
  // Set pillar-specific quick chips immediately (no auth required)
  useEffect(() => {
    const chips = PILLAR_CHIPS[pillar] || PILLAR_CHIPS.general;
    setQuickActions(chips);
  }, [pillar]);
  
  // Fetch user's pets and sync with navbar selection
  useEffect(() => {
    if (!user || !token) return;
    let cancelled = false;

    const fetchPets = async () => {
      try {
        const response = await fetch(`${getApiUrl()}/api/pets`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!cancelled && response.ok) {
          const data = await response.json();
          setPets(data.pets || []);
          if (data.pets?.length > 0) {
            // Priority: 1. localStorage selectedPetId (set by PillarContext when user switches pet)
            //           2. First pet as fallback
            const savedPetId = localStorage.getItem('selectedPetId');
            const savedPet = savedPetId ? data.pets.find(p => p.id === savedPetId) : null;
            setSelectedPet(savedPet || data.pets[0]);
          }
        }
      } catch (error) {
        if (!cancelled) console.debug('Failed to fetch pets:', error);
      }
    };

    fetchPets();
    return () => { cancelled = true; };
  }, [user, token]);
  
  // Listen for pet selection changes from navbar / PillarContext
  useEffect(() => {
    const handlePetChange = (e) => {
      // Accept petChanged (PillarContext — full pet in detail) OR petSelectionChanged (legacy — { petId } in detail)
      const newPet = e.type === 'petChanged' ? e.detail : null;
      const newPetId = newPet?.id || e.detail?.petId;
      
      if (newPetId && pets.length > 0) {
        // Deduplicate: ignore if same pet switched within last 2 seconds
        const now = Date.now();
        if (lastPetSwitchRef.current.id === newPetId && now - lastPetSwitchRef.current.ts < 2000) return;
        lastPetSwitchRef.current = { id: newPetId, ts: now };

        const resolvedPet = newPet || pets.find(p => p.id === newPetId);
        if (resolvedPet) {
          setSelectedPet(resolvedPet);
          setAllPetsMode(false);
          // Only show switch message when widget is already open (not on page load)
          if (isOpen) {
            const petBreed = resolvedPet.breed || resolvedPet.identity?.breed || '';
            const petAge = resolvedPet.age || resolvedPet.identity?.age_years || '';
            let switchMessage = `Of course! Switching to **${resolvedPet.name}** now. 🐾`;
            if (petBreed) {
              switchMessage += ` Your lovely ${petBreed}`;
              if (petAge) switchMessage += ` (${petAge}y)`;
              switchMessage += '.';
            }
            switchMessage += ` How can I help ${resolvedPet.name} today?`;
            
            setMessages(prev => [...prev, {
              id: `pet-change-${Date.now()}`,
              role: 'assistant',
              content: switchMessage
            }]);
          }
        }
      }
    };
    
    // Listen ONLY to petChanged (dispatched by PillarContext which converts all petSelectionChanged → petChanged)
    // Listening to both caused duplicate "Switching to X" messages
    window.addEventListener('petChanged', handlePetChange);
    return () => {
      window.removeEventListener('petChanged', handlePetChange);
    };
  }, [pets, isOpen]);
  
  // Handle pet switch within the widget (local click)
  const handlePetSwitch = (pet) => {
    if (pet === 'all') {
      setAllPetsMode(true);
      setSelectedPet(null);
      const allPetNames = pets.map(p => p.name).join(', ');
      setMessages(prev => [...prev, {
        id: `pet-change-${Date.now()}`,
        role: 'assistant',
        content: `Got it! I'll help with all your pets: **${allPetNames}**. 🐾 What do you need for your furry family?`
      }]);
    } else {
      setAllPetsMode(false);
      setSelectedPet(pet);
      const petBreed = pet.breed || pet.identity?.breed || '';
      let switchMessage = `Okay **${pet.name}**! 🐾`;
      if (petBreed) switchMessage += ` Your ${petBreed}.`;
      switchMessage += ` What would you like help with?`;
      
      setMessages(prev => [...prev, {
        id: `pet-change-${Date.now()}`,
        role: 'assistant',
        content: switchMessage
      }]);
    }
    trackClick('pet_switch', pet === 'all' ? 'all' : pet.id, { pillar, from_pet: selectedPet?.id });
  };
  
  // Fetch pet-specific recommendations and soul insights when pet changes
  useEffect(() => {
    if (!selectedPet?.id) return;
    let cancelled = false;

    const fetchPetIntelligence = async () => {
      try {
        const recsResponse = await fetch(
          `${getApiUrl()}/api/mira/pet-recommendations/${selectedPet.id}?pillar=${pillar}`,
          { headers: token ? { 'Authorization': `Bearer ${token}` } : {} }
        );
        if (!cancelled && recsResponse.ok) {
          const recsData = await recsResponse.json();
          setPetRecommendations(recsData.recommendations || []);
        }

        const soulResponse = await fetch(
          `${getApiUrl()}/api/pets/${selectedPet.id}/soul`,
          { headers: token ? { 'Authorization': `Bearer ${token}` } : {} }
        );
        if (!cancelled && soulResponse.ok) {
          const soulData = await soulResponse.json();
          setPetSoulInsights(soulData);
        }
      } catch (error) {
        if (!cancelled) console.debug('Failed to fetch pet intelligence:', error);
      }
    };

    fetchPetIntelligence();
    return () => { cancelled = true; };
  }, [selectedPet?.id, pillar, token]);
  
  // Lock body scroll when widget is open — mobile only
  // Desktop doesn't need position:fixed (no rubber-band scroll) and it breaks navigation
  useEffect(() => {
    if (!isMobile) return; // Desktop: never lock body position
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = `-${window.scrollY}px`;
    } else {
      const scrollY = document.body.style.top;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }
    
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
    };
  }, [isOpen, isMobile]);

  // Generate pillar-specific welcome message (Mira_Widget_MASTER.docx Section 4)
  const generateWelcomeMessage = useCallback(() => {
    const greeting = getTimeBasedGreeting();
    const petName = selectedPet?.name;
    const petBreed = selectedPet?.breed;

    // Prefer pillar_note from API context (already personalised)
    const pillarNote = typeof miraContext?.pillar_note === 'string' ? miraContext.pillar_note : null;
    if (pillarNote) return pillarNote;

    // Use page-specific opening line if pet is known
    if (petName) {
      const lineFn = PILLAR_OPENING_LINES[pillar] || PILLAR_OPENING_LINES.general;
      let line = lineFn(petName, greeting);
      // Append breed detail for celebrate/dine where it adds warmth
      if (petBreed && (pillar === 'celebrate' || pillar === 'dine')) {
        // Already embedded in line — no extra appending needed
      }
      return line;
    }

    // No pet — generic greeting
    return `${greeting}! I'm here to help with all your ${(pillarConfig[pillar]?.name || 'pet').toLowerCase()} needs. What can I do for you? 🐾`;
  }, [selectedPet?.name, selectedPet?.breed, pillar, miraContext?.pillar_note]);

  // Add welcome message (or proactive follow-up) when widget opens
  useEffect(() => {
    // Reset follow-up check flag when widget closes so it reruns on next open
    if (!isOpen) {
      followUpCheckedRef.current = false;
      return;
    }

    if (isOpen && !followUpCheckedRef.current) {
      followUpCheckedRef.current = true;

      // Re-sync active pet from localStorage (PillarContext may have changed it since widget mounted)
      const livePetId = localStorage.getItem('selectedPetId');
      if (livePetId && pets.length > 0) {
        const livePet = pets.find(p => p.id === livePetId);
        if (livePet && livePet.id !== selectedPet?.id) {
          setSelectedPet(livePet);
          followUpCheckedRef.current = false; // reset so it re-runs with correct pet
          return;
        }
      }

      // Check for pending proactive follow-up on EVERY open (not just empty sessions)
      // Uses setMessages(prev => ...) so it works safely regardless of existing messages
      const addFollowUpOrWelcome = async () => {
        if (selectedPet?.id && token) {
          try {
            const API_BASE = process.env.REACT_APP_BACKEND_URL;
            const res = await fetch(
              `${API_BASE}/api/mira/memory/${selectedPet.id}?follow_up=true&limit=1`,
              { headers: { 'Authorization': `Bearer ${token}` } }
            );
            if (res.ok) {
              const data = await res.json();
              const pending = data.memories?.[0];
              if (pending?.follow_up_message) {
                // Add follow-up to conversation:
                // • If no history → it becomes the sole first message (replaces generic welcome)
                // • If history exists → appended so Mira proactively checks in
                setMessages(prev => {
                  const msg = { id: `follow-up-${Date.now()}`, role: 'assistant', content: pending.follow_up_message };
                  return prev.length === 0 ? [msg] : [...prev, msg];
                });
                setActiveFollowUpMemoryId(pending._id);
                await fetch(`${API_BASE}/api/mira/memory/${pending._id}/shown`, {
                  method: 'PATCH',
                  headers: { 'Authorization': `Bearer ${token}` },
                }).catch(() => {});
                return; // skip generic welcome
              }
            }
          } catch (e) {
            // Non-critical — fall through to welcome
          }
        }
        // No follow-up found — show welcome only if conversation is empty
        setMessages(prev => {
          if (prev.length === 0) {
            const content = `Hi, I'm Mira, ${selectedPet?.name || 'your pet'}'s Soul Mate! ${generateWelcomeMessage()}`;
            return [{ id: 'welcome', role: 'assistant', content }];
          }
          return prev;
        });
      };

      addFollowUpOrWelcome();
      
      // Speak welcome greeting when widget opens (if voice is enabled)
      if (synthRef.current && voiceEnabledRef.current) {
        setTimeout(() => {
          const synth = synthRef.current;
          if (!synth) return;
          synth.cancel();
          
          // Build greeting with phonetic "concierge" pronunciation
          const petName = selectedPet?.name || '';
          const petBreed = selectedPet?.breed || '';
          const pillarName = config.name || 'our services';
          
          let fullGreeting = `Hi, I am Meera, your pet con-see-erzh.`;
          if (petName && petBreed) {
            fullGreeting = `Hi! Good ${getTimeOfDay()}! I see you're browsing ${pillarName} for ${petName}. How can I help?`;
          } else if (petName) {
            fullGreeting = `Hi! Good ${getTimeOfDay()}! How can I help with ${petName} today?`;
          } else {
            fullGreeting = `Hi! Good ${getTimeOfDay()}! How can I help you today?`;
          }
          
          const utterance = new SpeechSynthesisUtterance(fullGreeting);
          utterance.pitch = 1.15;
          utterance.rate = 0.92;
          
          // STRICT FEMALE voice selection
          const voices = synth.getVoices();
          const knownMaleVoices = ['Daniel', 'George', 'James', 'David', 'Mark', 'Alex', 'Fred', 'Google US English', 'Microsoft David'];
          const femaleVoice = voices.find(v => 
            v.name === 'Kate' || v.name === 'Serena' || v.name === 'Martha' ||
            v.name.includes('Google UK English Female') || v.name.includes('Microsoft Hazel') ||
            v.name.includes('Microsoft Susan')
          ) || voices.find(v =>
            v.name === 'Samantha' || v.name === 'Victoria' || v.name === 'Karen' ||
            v.name.includes('Google US English Female') || v.name.includes('Microsoft Zira')
          ) || voices.find(v => 
            v.name.toLowerCase().includes('female')
          ) || voices.find(v => 
            v.lang.startsWith('en') && 
            !knownMaleVoices.some(male => v.name.toLowerCase().includes(male.toLowerCase()))
          );
          if (femaleVoice) {
            utterance.voice = femaleVoice;
            console.log('[Mira Widget] Speaking with voice:', femaleVoice.name);
          }
          synth.speak(utterance);
        }, 600);
      }
    }
  }, [isOpen, selectedPet, miraContext, config.name, voiceEnabled, generateWelcomeMessage, token]);
  
  // Load messages for current pillar on mount and pillar change
  // With persistent memory: keep messages across pillar switches, add pillar marker
  useEffect(() => {
    if (!messagesLoaded) {
      // First load: restore from sessionStorage
      const storedMessages = getStoredMessages(pillar);
      if (storedMessages.length > 0) {
        setMessages(storedMessages);
      } else {
        setMessages([]);
      }
      setMessagesLoaded(true);
      setCurrentPillar(pillar);
    } else if (pillar !== currentPillar) {
      // Pillar changed: keep existing messages, add a context pill (not a full clear)
      setCurrentPillar(pillar);
      setMessages(prev => {
        const pillarNames = {
          dine: 'Dine', care: 'Care', go: 'Go', play: 'Play',
          learn: 'Learn', celebrate: 'Celebrate', shop: 'Shop',
          paperwork: 'Paperwork', emergency: 'Emergency',
          farewell: 'Farewell', adopt: 'Adopt', general: 'Home',
        };
        const label = pillarNames[pillar] || pillar;
        // Only add marker if there are existing messages (not empty/welcome-only)
        const hasRealMessages = prev.some(m => m.role === 'user');
        if (!hasRealMessages) return prev;
        return [...prev, {
          id: `pillar_switch_${Date.now()}`,
          role: 'system_marker',
          content: `Now on ${label} page`,
          isPillarSwitch: true,
          timestamp: new Date().toISOString(),
        }];
      });
    }
  }, [pillar, config.name]);
  
  // Store messages when they change - PERSIST per pillar
  useEffect(() => {
    if (messages.length > 0 && messagesLoaded) {
      storeMessages(messages, pillar);
    }
  }, [messages, pillar, messagesLoaded]);

  // Fetch persistent memory from MongoDB when widget opens + pet selected
  useEffect(() => {
    const petId = selectedPet?.id || selectedPet?._id;
    if (!isOpen || !petId || !token || memoryFetchedRef.current) return;
    memoryFetchedRef.current = true;

    fetch(`${getApiUrl()}/api/mira/memory/${petId}?limit=20`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
        if (data.preferences?.length) setPersistentPreferences(data.preferences);
        if (data.service_interests?.length) setPersistentServiceInterests(data.service_interests);
        // Prepend last 10 historical messages if widget is fresh
        if (data.messages?.length && messages.filter(m => m.role === 'user').length === 0) {
          const historical = data.messages.slice(-10).map(m => ({
            id: `hist_${m.timestamp}_${m.role}`,
            role: m.role,
            content: m.content,
            pillar: m.pillar,
            isHistorical: true,
            timestamp: m.timestamp,
          }));
          setMessages(prev => {
            // Only prepend if there are no real user messages yet
            const hasRealMessages = prev.some(m => m.role === 'user' && !m.isHistorical);
            return hasRealMessages ? prev : [...historical, ...prev];
          });
        }
      })
      .catch(() => { /* silent — memory is optional */ });
  }, [isOpen, selectedPet?.id, token]);

  // Reset memory fetch flag when pet changes
  useEffect(() => {
    memoryFetchedRef.current = false;
  }, [selectedPet?.id]);
  
  // Scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };
  
  const toggleListening = () => {
    if (!recognitionRef.current) return;
    
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error('Failed to start recognition:', err);
      }
    }
  };
  
  // ElevenLabs Eloise — direct frontend call, key rotation, all devices
  const ELOISE_VOICE_ID = 'AZnzlk1XvdvUeBnXmlld';
  const ELEVEN_KEYS = [
    process.env.REACT_APP_ELEVEN_LABS_KEY_1,
    process.env.REACT_APP_ELEVEN_LABS_KEY_2,
    process.env.REACT_APP_ELEVEN_LABS_KEY_3,
    process.env.REACT_APP_ELEVEN_LABS_KEY_4,
    process.env.REACT_APP_ELEVEN_LABS_KEY_5,
    process.env.REACT_APP_ELEVEN_LABS_KEY_6,
    process.env.REACT_APP_ELEVEN_LABS_KEY_7,
    process.env.REACT_APP_ELEVEN_LABS_KEY_8,
    process.env.REACT_APP_ELEVEN_LABS_KEY_9,
    process.env.REACT_APP_ELEVEN_LABS_KEY_10,
    process.env.REACT_APP_ELEVEN_LABS_KEY_11,
  ].filter(Boolean); // remove undefined slots

  const elevenKeyRef = useRef(0);
  const getNextElevenKey = () => {
    if (!ELEVEN_KEYS.length) return null;
    const key = ELEVEN_KEYS[elevenKeyRef.current % ELEVEN_KEYS.length];
    elevenKeyRef.current++;
    return key;
  };

  const speakWithElevenLabs = useCallback(async (text) => {
    if (!voiceEnabledRef.current) return false;
    const apiKey = getNextElevenKey();
    if (!apiKey) return false;

    try {
      setIsSpeaking(true);
      // Clean text: strip emojis, markdown, limit to 500 chars
      let cleanText = text
        .replace(/[\u{1F300}-\u{1FAD6}]/gu, '')
        .replace(/\*\*/g, '')
        .replace(/[*#_~`]/g, '')
        .replace(/\[.*?\]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 500);

      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${ELOISE_VOICE_ID}/stream`,
        {
          method: 'POST',
          headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: cleanText,
            model_id: 'eleven_turbo_v2',
            voice_settings: { stability: 0.5, similarity_boost: 0.75 },
          }),
        }
      );

      if (!response.ok) throw new Error(`ElevenLabs ${response.status}`);

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => { setIsSpeaking(false); URL.revokeObjectURL(audioUrl); };
      audio.onerror = () => { setIsSpeaking(false); URL.revokeObjectURL(audioUrl); };

      await audio.play();
      return true;
    } catch (error) {
      console.log('[Mira Voice] ElevenLabs failed, fallback WebSpeech:', error.message);
      setIsSpeaking(false);
      return false;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceEnabled]);
  
  // Text-to-Speech function - MIRA IS A BRITISH WOMAN
  const speakText = useCallback(async (text) => {
    if (!voiceEnabledRef.current) return;

    // Stop any in-progress audio before starting new — prevents overlap on fast responses
    if (audioRef.current) {
      try { audioRef.current.pause(); audioRef.current.currentTime = 0; } catch(e) {}
      audioRef.current = null;
    }
    setIsSpeaking(false);
    synthRef.current?.cancel();

    // Try ElevenLabs first for premium voice
    if (useElevenLabs) {
      // 100ms gap: lets iOS audio context fully release the previous stream before starting next
      await new Promise(resolve => setTimeout(resolve, 100));
      const success = await speakWithElevenLabs(text);
      if (success) return;
    }
    
    // Fallback to Web Speech API
    if (!synthRef.current) return;
    
    // Cancel any ongoing speech
    synthRef.current.cancel();
    
    // Clean text for speech
    let cleanText = text
      .replace(/[🎉🐕✨🦴💜🎂🏥☀️🌤️🌙🌟🐾🎒📅📋]/g, '')
      .replace(/\*\*/g, '')
      .replace(/[*#_~`]/g, '')
      .replace(/\[.*?\]/g, '')
      .replace(/\n/g, ' ')
      .substring(0, 500);
    
    // Fix "Mira" pronunciation to "Meera" (phonetic spelling)
    cleanText = cleanText.replace(/\bMira\b/gi, 'Meera');
    
    // Fix "concierge" pronunciation - "con-see-erzh" for better TTS
    cleanText = cleanText
      .replace(/pet concierge®?/gi, 'pet con-see-erzh')
      .replace(/soul mate/gi, 'soul-mate')
      .replace(/your concierge®?/gi, 'your con-see-erzh')
      .replace(/our concierge®?/gi, 'our con-see-erzh')
      .replace(/the concierge®?/gi, 'the con-see-erzh')
      .replace(/concierge®? team/gi, 'con-see-erzh team')
      .replace(/\bconcierge®?\b/gi, 'con-see-erzh');
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.volume = 1.0;
    
    // Get a BRITISH ENGLISH FEMALE voice for Mira - STRICT SELECTION
    const voices = synthRef.current.getVoices();
    
    // Debug: Log all available voices
    console.log('[Mira Voice] Available voices:', voices.map(v => `${v.name} (${v.lang})`));
    
    // STRICT list of CONFIRMED FEMALE voice names only
    // iOS Safari voices are named differently - prioritize them
    const confirmedFemaleVoices = [
      // iOS/Safari British English Female - TOP PRIORITY for iPhone
      'Stephanie', 'Karen', 'Samantha',  // Common iOS voices
      'Kate', 'Serena', 'Martha',        // iOS British voices
      'Fiona', 'Moira',                  // iOS Celtic voices
      // iOS Enhanced voices (downloaded)
      'Samantha (Enhanced)', 'Karen (Enhanced)',
      // Google British voices (Android/Chrome)
      'Google UK English Female',
      'Microsoft Hazel', 'Microsoft Susan', 'Hazel', 'Susan',
      'Amy', 'Emma',
      // American English Female - FALLBACK
      'Victoria', 'Tessa', 'Allison',
      'Google US English Female', 'Microsoft Zira',
      'Ava', 'Nicky',
      // Generic female identifiers
      'Female', 'female'
    ];
    
    // List of KNOWN MALE voice names to ALWAYS exclude
    const knownMaleVoices = [
      'Daniel', 'George', 'James', 'Oliver', 'Harry', 'Arthur',
      'David', 'Mark', 'Tom', 'Alex', 'Fred', 'Ralph', 'Albert',
      'Google US English', 'Google UK English Male', 'Microsoft David',
      'Microsoft Mark', 'Microsoft George', 'Aaron', 'Bruce'
    ];
    
    let selectedVoice = null;
    
    // Step 1: Try to find a British female voice by exact name match
    for (const femaleName of confirmedFemaleVoices.slice(0, 12)) { // British voices first
      selectedVoice = voices.find(v => 
        v.name === femaleName || 
        v.name.includes(femaleName)
      );
      if (selectedVoice) {
        console.log('[Mira Voice] ✓ Found British female voice:', selectedVoice.name);
        break;
      }
    }
    
    // Step 2: Try en-GB voices but EXCLUDE known males
    if (!selectedVoice) {
      selectedVoice = voices.find(v => 
        v.lang === 'en-GB' && 
        !knownMaleVoices.some(male => v.name.toLowerCase().includes(male.toLowerCase()))
      );
      if (selectedVoice) console.log('[Mira Voice] ✓ Using en-GB voice:', selectedVoice.name);
    }
    
    // Step 3: Try American female voices
    if (!selectedVoice) {
      for (const femaleName of confirmedFemaleVoices.slice(12)) {
        selectedVoice = voices.find(v => 
          v.name === femaleName || 
          v.name.includes(femaleName)
        );
        if (selectedVoice) {
          console.log('[Mira Voice] ✓ Found American female voice:', selectedVoice.name);
          break;
        }
      }
    }
    
    // Step 4: Any voice with "female" in name
    if (!selectedVoice) {
      selectedVoice = voices.find(v => 
        v.name.toLowerCase().includes('female')
      );
      if (selectedVoice) console.log('[Mira Voice] ✓ Using female voice:', selectedVoice.name);
    }
    
    // Step 5: Last resort - filter out ALL known male voices
    if (!selectedVoice) {
      selectedVoice = voices.find(v => 
        v.lang.startsWith('en') &&
        !knownMaleVoices.some(male => v.name.toLowerCase().includes(male.toLowerCase()))
      );
      if (selectedVoice) console.log('[Mira Voice] ⚠ Fallback voice:', selectedVoice.name);
    }
    
    // Apply voice and FEMININE parameters
    if (selectedVoice) {
      utterance.voice = selectedVoice;
      console.log('[Mira Voice] Final selected voice:', selectedVoice.name);
    } else {
      console.log('[Mira Voice] ⚠ No suitable voice found, using default with high pitch');
    }
    
    // FEMININE speech parameters - higher pitch makes voice sound more feminine
    utterance.rate = 0.92;   // Measured pace, British style
    utterance.pitch = 1.15;  // Higher pitch = more feminine sound
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (e) => {
      console.error('[Mira Voice] Speech error:', e);
      setIsSpeaking(false);
    };
    
    // On some mobile browsers, we need to trigger speech with a small delay
    setTimeout(() => {
      synthRef.current.speak(utterance);
    }, 50);
  }, [voiceEnabled, useElevenLabs, speakWithElevenLabs]);
  
  const sendMessage = async (directMessage = null) => {
    const messageToSend = directMessage || inputValue.trim();
    if (!messageToSend || isSending) return;

    // ── Grief / Farewell keyword detection — fire ticket BEFORE Mira responds ──
    const FAREWELL_KEYWORDS = [
      "crematorium", "cremation", "put to sleep", "put down",
      "euthanasia", "passed away", "died", "death", "lost my dog",
      "gone", "farewell", "memorial", "burial", "rainbow bridge",
      "no longer with us", "last days", "end of life",
    ];
    const lowerMsg = messageToSend.toLowerCase();
    if (FAREWELL_KEYWORDS.some(kw => lowerMsg.includes(kw))) {
      tdc.track("farewell_detected", {
        text: messageToSend,
        pillar: "farewell",
        pet: selectedPet,
        urgency: "high",
        channel: "mira_widget_farewell_detection",
      });
    }

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageToSend
    };
    
    // Get current messages BEFORE state update for history
    const currentMessages = [...messages];
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsSending(true);
    
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }
    
    try {
      // Add timeout for mobile connections
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      // Build history from currentMessages (before adding new user message)
      // Then add the current user message to history
      // CRITICAL: Ensure all content is serializable (no circular refs)
      const historyMessages = currentMessages
        .filter(m => m && m.id !== 'welcome' && !m.isPillarSwitch)
        .slice(-9) // Leave room for current message
        .map(m => {
          // Safely extract content - handle if it's not a string
          let content = '';
          try {
            if (typeof m.content === 'string') {
              content = m.content;
            } else if (m.content && typeof m.content === 'object') {
              // If content is an object, try to extract text
              content = m.content.toString ? m.content.toString() : JSON.stringify(m.content);
            } else {
              content = String(m.content || '');
            }
          } catch (e) {
            console.warn('[Mira] Failed to serialize message content:', e);
            content = '[message content unavailable]';
          }
          return {
            role: m.role || 'user',
            content: content.substring(0, 2000) // Limit content length
          };
        });
      
      // Add current user message to history
      historyMessages.push({
        role: 'user',
        content: messageToSend
      });
      
      // Prepare request body safely
      const requestBody = {
        message: userMessage.content,
        session_id: sessionId,
        source: 'chat_widget',
        current_pillar: pillar || 'general',
        selected_pet_id: selectedPet?.id || selectedPet?._id || null,
        // Inline pet context as fallback — ensures Mira has data even if DB lookup is slow
        pet_name: selectedPet?.name || 'your dog',
        pet_breed: selectedPet?.breed || (selectedPet?.identity?.breed) || null,
        soul_answers: selectedPet?.doggy_soul_answers || {},
        history: historyMessages.slice(-10), // last 10 messages from this session
        // Persistent memory context (from MongoDB — cross-session)
        persistent_preferences: persistentPreferences.slice(0, 10),
        persistent_service_interests: persistentServiceInterests.slice(0, 10),
      };
      
      // Safely serialize the request body - prevent circular reference errors
      let requestBodyStr;
      try {
        requestBodyStr = JSON.stringify(requestBody);
      } catch (serializeError) {
        console.error('[Mira] Serialization error, sending without history:', serializeError);
        // Fallback: send without history to avoid crash
        requestBodyStr = JSON.stringify({
          message: userMessage.content,
          session_id: sessionId,
          source: 'chat_widget',
          current_pillar: pillar,
          selected_pet_id: selectedPet?.id || selectedPet?._id || null,
          history: [] // Empty history as fallback
        });
      }
      
      console.log('[Mira] Sending chat request...', { 
        pillar, 
        hasPet: !!selectedPet?.id,
        historyLength: historyMessages.length 
      });
      
      // ── Try streaming first, fall back to standard chat ──────────────
      clearTimeout(timeoutId);

      let streamingWorked = false;

      try {
        const streamResponse = await fetch(`${getApiUrl()}/api/mira/os/stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
          body: requestBodyStr,
          signal: controller.signal,
        });

        if (streamResponse.ok && streamResponse.body) {
          streamingWorked = true;
          const reader = streamResponse.body.getReader();
          const decoder = new TextDecoder();
          let fullText = '';
          let finalProducts = [];
          let finalNearbyPlaces = null;

          // Add empty streaming message immediately
          const streamMsgId = Date.now();
          setMessages(prev => [...prev, {
            id: streamMsgId,
            role: 'assistant',
            content: '',
            streaming: true,
            timestamp: new Date().toISOString(),
          }]);

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');
            let streamEnded = false;

            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              const data = line.slice(6).trim();
              if (data === '[DONE]') { streamEnded = true; break; }
              try {
                const parsed = JSON.parse(data);
                // ── Enriched data event (products + nearbyPlaces from stream) ──
                if (parsed.type === 'enriched') {
                  finalProducts = parsed.data?.products || [];
                  finalNearbyPlaces = parsed.data?.nearby_places || null;
                  continue;
                }
                const tok = parsed.text || parsed.delta || parsed.content || '';
                if (!tok) continue;
                fullText += tok;
                setMessages(prev => prev.map(m =>
                  m.id === streamMsgId ? { ...m, content: fullText } : m
                ));
              } catch {}
            }
            if (streamEnded) break;  // exits the while(true) loop
          }

          // Mark streaming complete — attach enriched products/nearbyPlaces
          setMessages(prev => prev.map(m =>
            m.id === streamMsgId ? { ...m, streaming: false, content: fullText, products: finalProducts.length > 0 ? finalProducts : undefined, nearbyPlaces: finalNearbyPlaces || undefined } : m
          ));

          // ── Open the product-card render gate — always, no suppression ──
          setTimeout(() => {
            setVisibleProducts(prev => new Set([...prev, streamMsgId]));
          }, 900);

          // ── Post-stream product fetch — claude-picks (same engine as pillar page Mira Picks) ──
          const _streamPetId = selectedPet?.id || selectedPet?._id;
          const _rawPillar = currentPillar || pillar;
          // Infer pillar from URL when widget is in 'general' mode (e.g. floating on any page)
          const _urlPillar = (() => {
            const path = window.location.pathname;
            const _known = ['dine','care','go','play','learn','celebrate','shop','services','paperwork','emergency','farewell','adopt'];
            return _known.find(p => path.includes('/' + p)) || null;
          })();
          const _activePillar = (!_rawPillar || _rawPillar === 'general') ? (_urlPillar || 'dine') : _rawPillar;
          if (_streamPetId && !['emergency','paperwork','farewell'].includes(_activePillar)) {
            const _pillarParam = _activePillar !== 'general' ? `&pillar=${_activePillar}` : '';
            fetch(`${getApiUrl()}/api/mira/claude-picks/${_streamPetId}?limit=4&min_score=30${_pillarParam}`)
              .then(r => r.ok ? r.json() : null)
              .then(d => {
                const picks = d?.picks || [];
                if (picks.length > 0) {
                  setMessages(prev => prev.map(m =>
                    m.id === streamMsgId ? { ...m, products: picks } : m
                  ));
                }
              })
              .catch(() => {}); // fire-and-forget — never block the UI
          }

          // ── Service chips fetch — when Mira's response mentions a bookable service ──
          const _SERVICE_WORDS = ['groom', 'vet', 'walk', 'train', 'board', 'session', 'appointment',
            'book', 'spa', 'bath', 'nail', 'dental', 'vaccin', 'checkup', 'consult'];
          const _hasServiceIntent = _SERVICE_WORDS.some(w => fullText.toLowerCase().includes(w));
          if (_hasServiceIntent && _streamPetId && _activePillar &&
              !['emergency', 'paperwork', 'farewell'].includes(_activePillar)) {
            fetch(`${getApiUrl()}/api/service-box/services?pillar=${_activePillar}&limit=3`)
              .then(r => r.ok ? r.json() : null)
              .then(d => {
                const svcs = d?.services || [];
                if (svcs.length > 0) {
                  setMessages(prev => prev.map(m =>
                    m.id === streamMsgId ? { ...m, services: svcs } : m
                  ));
                }
              })
              .catch(() => {});
          }

          // ── NearMe intent detection ──
          const _NEARME_WORDS = ['near me', 'nearby', 'near ', 'find a vet', 'find a groomer',
            'groomer near', 'vet near', 'close to', 'around me', 'locate', 'in my city', 'where can i find'];
          const _combined = ((messageToSend || '') + ' ' + (fullText || '')).toLowerCase();
          const _hasNearMe = _NEARME_WORDS.some(kw => _combined.includes(kw));
          if (_hasNearMe) {
            setMessages(prev => prev.map(m =>
              m.id === streamMsgId ? { ...m, showNearMe: { pillar: _activePillar } } : m
            ));
          }

          // ── Mira Ticket Intelligence — fire on concern detection OR 3+ message conversations ──
          const { detectConcernType: detectCT, fireMiraTicket } = await import('../hooks/mira/useMiraTicket');
          const concernType = detectCT(messageToSend) || (messages.length >= 3 ? 'general' : null);
          if (concernType && selectedPet?.id) {
            fireMiraTicket({ pet: selectedPet, pillar, userMessage: messageToSend, miraResponse: fullText, concernType, token });
          }

          // Save to MongoDB persistent memory (fire-and-forget)
          const petId = selectedPet?.id || selectedPet?._id;
          if (petId && token && fullText) {
            fetch(`${getApiUrl()}/api/mira/memory/save`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({
                pet_id: petId,
                pet_name: selectedPet?.name,
                messages: [
                  { role: 'user', content: messageToSend, pillar },
                  { role: 'assistant', content: fullText, pillar },
                ],
              }),
            }).catch(() => {});

            // ── Proactive follow-up memory (auto-detect trigger type) ──────
            const memType = detectMemoryType(messageToSend);
            if (memType) {
              fetch(`${getApiUrl()}/api/mira/memory/save`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                  pet_id: petId,
                  memory_type: memType,
                  content: messageToSend,
                  mira_response: fullText.substring(0, 500),
                  follow_up: true,
                  follow_up_message: generateFollowUp(memType, selectedPet?.name || 'your pet'),
                  created_at: new Date().toISOString(),
                }),
              }).catch(() => {});
            }
            // Auto-resolve active follow-up
            if (activeFollowUpMemoryId && RESOLVE_SIGNALS.some(s => messageToSend.toLowerCase().includes(s))) {
              fetch(`${getApiUrl()}/api/mira/memory/${activeFollowUpMemoryId}/resolved`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` },
              }).then(() => setActiveFollowUpMemoryId(null)).catch(() => {});
            }
          }

          // ── ElevenLabs / TTS — speak the FULL completed text once ──
          if (voiceEnabledRef.current && fullText) {
            speakText(fullText);
          }

          // tdc.chat tracking
          tdc.chat({ message: messageToSend, reply: fullText, pillar: pillar || 'mira_os', pet: selectedPet, channel: 'mira_chat_widget_stream' });

          setIsSending(false);
          return;
        }
      } catch (streamError) {
        if (streamError.name === 'AbortError') throw streamError;
        console.log('[Mira] Stream failed, falling back to standard chat:', streamError.message);
      }

      // ── FALLBACK: standard non-streaming chat ─────────────────────────
      let response;
      let lastError;
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          response = await fetch(`${getApiUrl()}/api/mira/chat`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token && { 'Authorization': `Bearer ${token}` })
            },
            body: requestBodyStr,
            signal: controller.signal
          });
          
          if (response.ok) break;
          
          if (response.status >= 500 && attempt < 2) {
            console.log(`[Mira] Server error ${response.status}, retrying...`);
            await new Promise(r => setTimeout(r, 1000));
            continue;
          }
        } catch (fetchError) {
          lastError = fetchError;
          if (attempt < 2 && fetchError.name !== 'AbortError') {
            await new Promise(r => setTimeout(r, 1000));
            continue;
          }
          throw fetchError;
        }
      }

      console.log('[Mira] Fallback response status:', response.status);

      if (response.ok) {
        let data;
        try {
          data = await response.json();
        } catch (parseError) {
          console.error('[Mira] Failed to parse response JSON:', parseError);
          throw new Error('Invalid response format');
        }
        
        if (!data || !data.response) {
          console.error('[Mira] Response missing expected fields:', data);
          throw new Error('Invalid response data');
        }
        
        let displayContent = data.response;
        const assistantMsgId = (Date.now() + 1).toString(); // pre-compute for product timing
        if (data.concierge_action) {
          const action = data.concierge_action;
          
          // Show Quick Book form inline instead of navigating
          if (action.show_quick_book_form) {
            // Don't navigate, show the form in chat instead
            setMessages(prev => [...prev, {
              id: (Date.now() + 1).toString(),
              role: 'assistant',
              content: displayContent,
              products: data.products,
              ticketId: data.ticket_id,
              showQuickBookForm: true,
              formType: action.form_type,
              serviceType: action.action_type || pillar
            }]);
            
            if (voiceEnabledRef.current && !streamingWorked) {
              speakText(data.response);
            }
            setIsSending(false);
            return; // Don't continue to regular message handling
          }
          
          // Navigation actions - DISABLED auto-navigation during conversation
          // This was causing crashes by navigating away mid-conversation
          // Navigation should only happen via explicit user action (clicking products/links)
          if (action.navigate_to && !action.show_quick_book_form) {
            // Instead of navigating, show a helpful link in the response
            console.log(`[Mira] Suggested navigation to ${action.navigate_to} (not auto-navigating)`);
            // Don't auto-navigate - let the conversation continue naturally
            // The user can click on products or use the sidebar to navigate
          }
          
          // Scroll to section actions
          if (action.scroll_to_section) {
            setTimeout(() => {
              const section = document.getElementById(action.scroll_to_section);
              if (section) {
                section.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }, 1600);
          }
        }
        
        // Handle kit assembly response
        if (data.kit_assembly?.is_kit) {
          displayContent += `\n\n🎒 **Kit Ready!** ${data.kit_assembly.items_found} items found. You can add all to cart below.`;
        }
        
        // Handle concierge handoff
        if (data.handoff?.needed) {
          toast.info('Our concierge® team will send you details via email/WhatsApp', {
            duration: 5000
          });
        }
        
        // Handle service confirmation card (uniform service handoff flow)
        if (data.service_confirmation) {
          toast.success(`Service Request Confirmed!`, {
            description: data.service_confirmation.message || 'Your concierge will get back to you shortly.',
            duration: 5000
          });
        }
        
        // Add ticket info if created (only if no service_confirmation to avoid duplicate messages)
        if ((data.service_desk_ticket_id || data.concierge_action?.action_needed) && !data.service_confirmation) {
          const ticketId = data.service_desk_ticket_id || data.ticket_id;
          displayContent += `\n\n📋 **Request #${ticketId}** created!`;
          toast.success(`Request #${ticketId} created!`, {
            description: 'Our concierge® team will contact you shortly.'
          });
        }
        
        setMessages(prev => [...prev, {
          id: assistantMsgId,
          role: 'assistant',
          content: displayContent,
          products: data.products,
          ticketId: data.ticket_id,
          kitAssembly: data.kit_assembly,
          handoff: data.handoff,
          serviceConfirmation: data.service_confirmation,
          nearbyPlaces: data.nearby_places // Restaurant, vet, park results from Mira
        }]);

        // ── tdc.chat — fire intent ticket for every Mira widget conversation ──
        tdc.chat({
          message: messageToSend,
          reply: data.response,
          pillar: pillar || 'mira_os',
          pet: selectedPet,
          channel: 'mira_chat_widget',
        });

        // Save to MongoDB persistent memory (fire-and-forget)
        const petId = selectedPet?.id || selectedPet?._id;
        if (petId && token && displayContent) {
          fetch(`${getApiUrl()}/api/mira/memory/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              pet_id: petId,
              pet_name: selectedPet?.name,
              messages: [
                { role: 'user', content: messageToSend, pillar },
                { role: 'assistant', content: displayContent.slice(0, 2000), pillar },
              ],
            }),
          }).catch(() => {});

          // ── Proactive follow-up memory (auto-detect trigger type) ──────
          const memType = detectMemoryType(messageToSend);
          if (memType) {
            fetch(`${getApiUrl()}/api/mira/memory/save`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({
                pet_id: petId,
                memory_type: memType,
                content: messageToSend,
                mira_response: displayContent.substring(0, 500),
                follow_up: true,
                follow_up_message: generateFollowUp(memType, selectedPet?.name || 'your pet'),
                created_at: new Date().toISOString(),
              }),
            }).catch(() => {});
          }
          // Auto-resolve active follow-up
          if (activeFollowUpMemoryId && RESOLVE_SIGNALS.some(s => messageToSend.toLowerCase().includes(s))) {
            fetch(`${getApiUrl()}/api/mira/memory/${activeFollowUpMemoryId}/resolved`, {
              method: 'PATCH',
              headers: { Authorization: `Bearer ${token}` },
            }).then(() => setActiveFollowUpMemoryId(null)).catch(() => {});
          }
        }
        
        // Schedule product card reveal — 800ms after response renders, only if safe
        if (shouldShowProducts(displayContent)) {
          setTimeout(() => {
            setVisibleProducts(prev => new Set([...prev, assistantMsgId]));
          }, 800);
        }
        
        if (voiceEnabledRef.current && !streamingWorked) {
          speakText(data.response);
        }
      } else {
        // Log the actual error response for debugging
        const errorText = await response.text().catch(() => 'Unable to read error');
        console.error('[Mira] API Error:', response.status, errorText);
        throw new Error(`API returned ${response.status}`);
      }
    } catch (error) {
      console.error('[Mira] Chat error:', error?.name, error?.message, error);
      let errorMessage = "Let me try that again. What would you like help with?";
      
      // Log full error details for debugging
      if (error.name === 'TypeError' && error.message?.includes('Failed to fetch')) {
        console.error('[Mira] Network error - possible CORS or connectivity issue');
        errorMessage = "Connection issue. Please check your internet and try again.";
      } else if (error.name === 'AbortError') {
        console.error('[Mira] Request timed out after 30 seconds');
        errorMessage = "Taking a bit longer than usual. Please check your connection and try again.";
      } else if (error.message?.includes('520') || error.message?.includes('502') || error.message?.includes('503')) {
        console.error('[Mira] Server error:', error.message);
        errorMessage = "Don't worry, the Concierge® is here! Let me try that again for you.";
      } else if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
        console.error('[Mira] Network error:', error.message);
        errorMessage = "Don't worry, the Concierge® is here! Please check your connection.";
      } else if (error.message?.includes('API returned')) {
        console.error('[Mira] API error:', error.message);
        errorMessage = "Don't worry, the Concierge® is here! Let me try again.";
      } else {
        console.error('[Mira] Unknown error type:', error.name, error.message);
      }
      
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorMessage
      }]);
    } finally {
      setIsSending(false);
    }
  };
  
  const handleProductClick = (product) => {
    if (!product) return;
    
    if (onProductClick) {
      onProductClick(product);
    } else {
      // Navigate to product page instead of adding to cart
      const productUrl = product.url || product.shopify_handle 
        ? `/product/${product.shopify_handle || product.url || product.id}`
        : `/product/${product.id || 'unknown'}`;
      navigate(productUrl);
    }
    // Track the click for personalization
    if (product.id) {
      trackClick('product_recommendation', product.id, { pillar, source: 'mira_chat' });
    }
  };
  
  // Generate personalized quick prompts based on context
  const getPersonalizedPrompts = () => {
    // Use dynamic prompts from API if available - ensure they're all strings
    if (dynamicPrompts.length > 0) {
      return dynamicPrompts
        .filter(p => typeof p === 'string')
        .slice(0, 4);
    }
    
    // Fallback to context-aware prompts
    const petName = selectedPet?.name;
    const petBreed = selectedPet?.breed;
    const petAge = selectedPet?.age;
    
    const basePrompts = [];
    
    // Pet-specific prompts
    if (petName) {
      basePrompts.push(`What's recommended for ${petName}?`);
      if (petBreed) {
        basePrompts.push(`${petBreed}-specific ${pillar} tips`);
      }
      if (petAge && parseInt(petAge) > 7) {
        basePrompts.push(`Senior ${pillar} options for ${petName}`);
      }
    }
    
    // Pillar-specific prompts
    const pillarPrompts = {
      stay: ['Find pet-friendly hotels', 'Book a staycation', 'Pet boarding options'],
      care: ['Book grooming session', 'Vet consultation', 'Wellness checkup'],
      fit: ['Exercise routines', 'Fitness tracking', 'Weight management'],
      travel: ['Pet travel checklist', 'Flight-friendly carriers', 'Road trip essentials'],
      celebrate: ['Plan birthday party', 'Custom pet cakes', 'Party supplies'],
      dine: ['Compare meal plans', 'Fresh food ingredients', 'Transitioning to fresh'],
      enjoy: ['Outdoor activities', 'Dog parks nearby', 'Social meetups'],
      learn: ['Training courses', 'Behavior tips', 'Puppy school'],
      paperwork: ['Pet insurance', 'Registration help', 'Health records'],
      advisory: ['Pet expert advice', 'Nutrition guidance', 'Behavior consultation'],
      emergency: ['24/7 vet help', 'First aid tips', 'Emergency contacts'],
      farewell: ['Memorial services', 'Grief support', 'Rainbow bridge'],
      adopt: ['Adoption process', 'Foster programs', 'Rescue pets nearby'],
      shop: ['Best sellers', 'New arrivals', 'Sale items']
    };
    
    const specific = pillarPrompts[pillar] || ['Show me options', 'What do you recommend?', 'Help me choose'];
    
    return [...basePrompts, ...specific].slice(0, 4);
  };
  
  const quickPrompts = getPersonalizedPrompts();
  
  // Handle Pulse (voice) activation from floating button
  const handlePulseClick = (e) => {
    e.stopPropagation();
    setIsOpen(true);
    // Start voice recognition after a short delay to allow widget to render
    setTimeout(() => {
      if (speechSupported && recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsListening(true);
          toast.success('🎤 Listening... Speak to Mira!');
        } catch (err) {
          console.error('Failed to start voice:', err);
        }
      }
    }, 500);
  };
  
  // Listen for mobile FAB clicks to open pillar-specific Mira
  // This allows MiraChatWidget on pillar pages to respond to the mobile nav FAB
  useEffect(() => {
    const handleOpenMira = (event) => {
      // Respond if:
      // 1. Event specifies our pillar OR
      // 2. Event is from mobile_nav OR
      // 3. Event is from search_panel (universal bar "Continue in Chat")
      // 4. Event has no pillar at all (use the existing widget on this page)
      const shouldOpen = 
        !event.detail?.pillar ||
        event.detail?.pillar === pillar || 
        event.detail?.source === 'mobile_nav' ||
        event.detail?.source === 'search_panel' ||
        event.detail?.source === 'pillar_top_bar';
      
      if (shouldOpen) {
        console.log('[MiraChatWidget] Opening for pillar:', pillar, 'source:', event.detail?.source);
        setIsOpen(true);
        
        // If there's a message/query, set it as input
        if (event.detail?.message || event.detail?.initialQuery) {
          const msg = event.detail.message || event.detail.initialQuery;
          setInputValue(msg);
          console.log('[MiraChatWidget] Pre-filled query:', msg);

          if (event.detail?.source === 'pillar_top_bar') {
            setTimeout(() => {
              sendMessage(msg);
            }, 120);
          }
        }
      }
    };
    
    window.addEventListener('openMiraAI', handleOpenMira);
    return () => window.removeEventListener('openMiraAI', handleOpenMira);
  }, [pillar, sendMessage]);
  
  // Get orb state based on current activity
  const getOrbState = () => {
    if (isListening) return 'listening';
    if (isSpeaking) return 'speaking';
    if (isSending) return 'thinking';
    return 'idle';
  };
  
  // Hide global widget on ALL pillar pages (desktop + mobile).
  // Every pillar page already renders its own MiraChatWidget via PillarPageLayout.
  // Two simultaneous instances cause double DOM writes, double scroll locks, and
  // React reconciliation conflicts that break desktop pillar navigation.
  if (hideMiraChatOnPillarPages && PILLAR_PATHS.some(p => loc.pathname === p || loc.pathname.startsWith(p + '/'))) {
    return null;
  }

  // Floating Button (when closed)
  // On mobile non-pillar pages: MobileNavBar center FAB handles Mira access — no floating orb needed
  // (component stays mounted so openMiraAI event listener remains active even when returning null)
  if (!isOpen) {
    if (hideMiraChatOnPillarPages) {
      // Global widget is hidden on all pillar pages — pillar page has its own Mira
      return null;
    }
    return (
      <div className={`flex fixed ${isMobile ? 'bottom-[76px] right-3' : 'bottom-4 right-4 sm:bottom-6 sm:right-6'} z-[9999] flex-col items-end gap-3 ${className}`}>
        <MiraOrb 
          state={getOrbState()}
          pillar={pillar}
          size={isMobile ? 'sm' : 'sm'}
          showLabel={!isMobile}
          onClick={() => setIsOpen(true)}
        />
      </div>
    );
  }
  
  // Chat Widget (when open) - PROPER 3-ZONE LAYOUT
  // Zone A: Sticky header (purple header + pet tabs + quick actions)
  // Zone B: Scrollable chat messages (ONLY this scrolls)
  // Zone C: Sticky composer (input bar)
  return (
    <div 
      className={`fixed ${className}
        left-0 right-0 bottom-0
        sm:bottom-0 sm:right-0 sm:left-auto sm:top-0
      `}
      style={{
        top: 'var(--mira-top-offset, 105px)',
        zIndex: 2147483640,
      }}
      data-testid="mira-chat-widget"
    >
      {/* Chat container - 3-zone flexbox layout */}
      <div 
        className={`
          w-full sm:w-[400px] lg:w-[420px]
          bg-white shadow-2xl flex flex-col
          rounded-t-2xl sm:rounded-none sm:border-l sm:border-gray-200
          ${isMinimized ? 'h-16' : 'h-full sm:h-[100dvh]'}
        `}
        style={{ 
          maxHeight: '100dvh',
          overflow: 'hidden'   // MUST stay hidden: clips flex container so Zone B can't escape
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ═══════════════════════════════════════════════════════════════════
            ZONE A: STICKY TOP STACK (Header + Tabs + Quick Actions)
            These stay fixed at the top, never scroll
            ═══════════════════════════════════════════════════════════════════ */}
        <div className="flex-none" style={{ paddingTop: 'env(safe-area-inset-top, 0px)', position: 'relative', zIndex: 2 }}>
          {/* Header */}
          <div 
            className={`bg-gradient-to-r ${config.color} text-white p-3 sm:p-4 cursor-pointer flex items-center justify-between`}
            onClick={() => isMinimized && setIsMinimized(false)}
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <div className={`w-9 h-9 sm:w-10 sm:h-10 bg-white/20 rounded-full flex items-center justify-center ${isListening ? 'animate-pulse ring-2 ring-cyan-400' : ''}`}>
                <PawPrint className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <p className="font-semibold text-sm sm:text-base">Mira</p>
                <p className="text-[10px] sm:text-xs opacity-80">
                  {isListening ? '🎤 Listening...' : isSpeaking ? '🔊 Speaking...' : `${selectedPet?.name || 'Pet'}'s Soul Mate`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Voice toggle */}
              <button
                onClick={(e) => { e.stopPropagation(); setVoiceEnabled(!voiceEnabled); }}
                className={`w-11 h-11 sm:w-9 sm:h-9 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 rounded-full flex items-center justify-center transition-colors touch-manipulation active:scale-95 ${voiceEnabled ? 'bg-white/20' : 'bg-white/10'}`}
                title={voiceEnabled ? "Voice ON" : "Voice OFF"}
              >
                {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>
              {/* Minimize — onClick only (touch-manipulation handles tap latency, no onTouchEnd to prevent double-fire) */}
              <button
                onClick={(e) => { e.stopPropagation(); e.preventDefault(); setIsMinimized(m => !m); }}
                className="w-11 h-11 sm:w-9 sm:h-9 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 rounded-full flex items-center justify-center bg-white/20 hover:bg-white/30 transition-colors touch-manipulation active:scale-95"
                style={{ WebkitTapHighlightColor: 'transparent', fontSize: 18, fontWeight: 700, lineHeight: 1 }}
                data-testid="mira-widget-minimize"
                title={isMinimized ? "Expand" : "Minimise"}
              >
                {isMinimized ? '□' : '—'}
              </button>
              {/* Close */}
              <button
                onClick={(e) => { e.stopPropagation(); e.preventDefault(); setIsOpen(false); }}
                onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); setIsOpen(false); }}
                className="w-11 h-11 sm:w-9 sm:h-9 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 rounded-full flex items-center justify-center bg-white/20 hover:bg-white/30 transition-colors touch-manipulation active:scale-95"
                style={{ WebkitTapHighlightColor: 'transparent' }}
                data-testid="mira-widget-close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Pet Selector Strip (part of Zone A - sticky) */}
          {!isMinimized && pets.length > 0 && (
            <div className="px-3 py-2 border-b bg-gray-50">
              <div className="flex items-center gap-2 overflow-x-auto">
                <span className="text-xs text-gray-500 shrink-0">For:</span>
                {pets.map(pet => (
                  <button
                    key={pet.id}
                    onClick={() => {
                      setSelectedPet(pet);
                      trackClick('pet_switch', pet.id, { pillar, from_pet: selectedPet?.id });
                    }}
                    className={`px-3 py-2.5 min-h-[40px] rounded-full text-xs flex items-center gap-1.5 transition-all shrink-0 touch-manipulation active:scale-95 ${
                      selectedPet?.id === pet.id 
                        ? `bg-gradient-to-r ${config.color} text-white` 
                        : 'bg-gray-100 text-gray-600'
                    }`}
                    data-testid={`pet-select-${pet.id}`}
                  >
                    <PawPrint className="w-3 h-3" />
                    <span className="font-semibold">{pet.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Quick Actions Strip — page-specific chips only (part of Zone A - sticky) */}
          {!isMinimized && (
            <div className="px-3 py-2 border-b bg-white">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {/* Page-specific chips — petName substituted at render time */}
                {(quickActions || []).slice(0, 2).map((action, idx) => {
                  if (!action || typeof action !== 'string') return null;
                  const petName = selectedPet?.name || 'your pet';
                  const resolved = action.replace(/\{petName\}/g, petName);
                  return (
                    <button
                      key={idx}
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); sendMessage(resolved); }}
                      className="px-4 py-2.5 rounded-full text-xs font-semibold whitespace-nowrap min-h-[44px] touch-manipulation shrink-0 bg-gray-100 text-gray-700 active:bg-gray-200 hover:bg-gray-200 border border-gray-200"
                      data-testid={`quick-action-${idx}`}
                    >
                      {resolved}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            ZONE B: SCROLLABLE CHAT MESSAGES (ONLY this scrolls)
            flex-1 takes remaining space, overflow-y-auto enables scroll
            ═══════════════════════════════════════════════════════════════════ */}
        {!isMinimized && (
          <div 
            className="flex-1 overflow-y-auto p-4 space-y-3 mira-chat-messages"
            style={{ 
              touchAction: 'pan-y',      // tells iOS: vertical scroll only — no tap delay
              overscrollBehavior: 'contain',
              paddingBottom: '8px'
            }}
          >
              {(messages || []).map((msg) => {
                if (!msg || !msg.id) return null;
                // Render pillar-switch markers as centered pills
                if (msg.isPillarSwitch || msg.role === 'system_marker') {
                  return (
                    <div key={msg.id} className="flex justify-center my-2">
                      <span className="text-[10px] text-gray-400 bg-white/5 border border-white/10 rounded-full px-3 py-0.5">
                        {msg.content}
                      </span>
                    </div>
                  );
                }
                // Render historical messages with a subtle marker
                return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  {/* ── Text bubble ── */}
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                      msg.role === 'user'
                        ? `bg-gradient-to-r ${config.color} text-white rounded-br-sm`
                        : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                    }`}
                  >
                    <div className="text-sm whitespace-pre-wrap prose prose-sm max-w-none [&_p]:mb-1 [&_ul]:mb-1 [&_ol]:mb-1 [&_li]:mb-0.5 [&_strong]:font-bold">
                      <SafeMarkdownRenderer>
                        {typeof msg.content === 'string' ? msg.content : String(msg.content || '')}
                      </SafeMarkdownRenderer>
                      {msg.streaming && (
                        <span style={{display:'inline-block',width:2,height:'1em',background:'currentColor',marginLeft:2,verticalAlign:'middle',animation:'miraCursor 0.8s step-end infinite',opacity:0.7}}/>
                      )}
                      <style>{`@keyframes miraCursor{0%,100%{opacity:1}50%{opacity:0}}`}</style>
                    </div>
                    
                    {/* NEARBY PLACES stay inside bubble */}
                    {msg.nearbyPlaces && msg.nearbyPlaces.places && msg.nearbyPlaces.places.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                          {msg.nearbyPlaces.type === 'restaurants' ? '🍽️' : 
                           msg.nearbyPlaces.type === 'vet_clinics' ? '🏥' : 
                           msg.nearbyPlaces.type === 'dog_parks' ? '🌳' : 
                           msg.nearbyPlaces.type === 'stays' ? '🏨' : '📍'}
                          {msg.nearbyPlaces.type === 'restaurants' ? 'Pet-Friendly Restaurants' : 
                           msg.nearbyPlaces.type === 'vet_clinics' ? 'Vet Clinics' : 
                           msg.nearbyPlaces.type === 'dog_parks' ? 'Dog Parks' : 
                           msg.nearbyPlaces.type === 'stays' ? 'Pet-Friendly Stays' : 'Nearby Places'}
                          <span className="text-[10px] font-normal ml-1 text-gray-400">({msg.nearbyPlaces.city})</span>
                        </p>
                        
                        {msg.nearbyPlaces.places.slice(0, 4).map((place, placeIdx) => (
                          <div 
                            key={place.id || place.name || placeIdx}
                            className="bg-white rounded-xl p-3 border border-gray-200 haptic-card"
                          >
                            {/* Place Image */}
                            {place.image && (
                              <div className="w-full h-24 rounded-lg overflow-hidden mb-2">
                                <img 
                                  src={place.image} 
                                  alt={place.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => { e.target.style.display = 'none'; }}
                                />
                              </div>
                            )}
                            
                            <div className="flex justify-between items-start gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-gray-900 text-sm">{place.name}</p>
                                {place.area && (
                                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                    <MapPin className="w-3 h-3" /> {place.area}
                                  </p>
                                )}
                                {/* Rating & Price */}
                                <div className="flex items-center gap-2 mt-1">
                                  {place.rating && (
                                    <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">
                                      ⭐ {place.rating}
                                    </span>
                                  )}
                                  {place.priceRange && (
                                    <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                                      {place.priceRange}
                                    </span>
                                  )}
                                  {place.is_24_hours && (
                                    <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">
                                      24/7
                                    </span>
                                  )}
                                </div>
                                {/* Pet Info */}
                                {place.pet_policy && (
                                  <p className="text-xs text-green-600 mt-1">🐕 {place.pet_policy}</p>
                                )}
                                {place.highlights && place.highlights[0] && (
                                  <p className="text-xs text-gray-500 mt-1 italic">{place.highlights[0]}</p>
                                )}
                              </div>
                              
                              {/* CTA Button - Send to Concierge® for reservation — canonical endpoint */}
                              <button
                                onClick={async () => {
                                  try {
                                    const placeType = msg.nearbyPlaces.type;
                                    const response = await fetch(`${getApiUrl()}/api/service_desk/attach_or_create_ticket`, {
                                      method: 'POST',
                                      headers: {
                                        'Content-Type': 'application/json',
                                        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                                      },
                                      body: JSON.stringify({
                                        type: placeType === 'restaurants' ? 'restaurant_reservation' :
                                              placeType === 'vet_clinics' ? 'vet_appointment' :
                                              placeType === 'stays' ? 'stay_booking' : 'place_inquiry',
                                        pillar: placeType === 'restaurants' ? 'dine' :
                                                placeType === 'vet_clinics' ? 'care' :
                                                placeType === 'stays' ? 'go' : 'general',
                                        title: `${placeType === 'restaurants' ? 'Reserve' : 'Inquiry'}: ${place.name}`,
                                        description: `Request for ${place.name} in ${place.area || msg.nearbyPlaces.city}${selectedPet ? ` for ${selectedPet.name}` : ''}`,
                                        place_data: place,
                                        pet_id: selectedPet?.id,
                                        pet_name: selectedPet?.name,
                                        source: 'mira_chat',
                                        channel: 'chat'
                                      })
                                    });
                                    
                                    if (response.ok) {
                                      const data = await response.json();
                                      toast.success(`Sent to Concierge®! Ticket #${data.ticket_id || 'created'}`, {
                                        description: `We'll confirm your ${placeType === 'restaurants' ? 'reservation' : 'request'} shortly`
                                      });
                                      setMessages(prev => [...prev, {
                                        id: `place-confirm-${Date.now()}`,
                                        role: 'assistant',
                                        content: `✅ Perfect! I've sent your ${placeType === 'restaurants' ? 'reservation request' : 'inquiry'} for **${place.name}** to our Concierge® team. They'll confirm availability and get back to you shortly!`
                                      }]);
                                    }
                                  } catch (err) {
                                    console.error('Place booking error:', err);
                                    toast.error('Unable to send request. Please try again.');
                                  }
                                }}
                                className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap haptic-btn ${
                                  msg.nearbyPlaces.type === 'restaurants' 
                                    ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                                    : msg.nearbyPlaces.type === 'vet_clinics'
                                    ? 'bg-red-500 hover:bg-red-600 text-white'
                                    : 'bg-purple-500 hover:bg-purple-600 text-white'
                                }`}
                              >
                                {msg.nearbyPlaces.type === 'restaurants' ? 'Reserve' : 
                                 msg.nearbyPlaces.type === 'vet_clinics' ? 'Book' : 
                                 'Send to Concierge®'}
                              </button>
                            </div>
                          </div>
                        ))}
                        
                        {/* Verified badge */}
                        <div className="flex items-center justify-center gap-1 text-xs text-gray-400 mt-2">
                          <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                          Verified by Concierge® • Tap to reserve
                        </div>
                      </div>
                    )}
                    
                    {/* Quick Book Form (inline service booking) */}
                    {msg.showQuickBookForm && (
                      <div className="mt-3 p-3 bg-white rounded-lg border border-purple-200">
                        <p className="text-xs font-bold text-purple-700 uppercase mb-2">📅 Quick Book</p>
                        <form onSubmit={(e) => {
                          e.preventDefault();
                          const formData = new FormData(e.target);
                          const bookingData = {
                            date: formData.get('date'),
                            time: formData.get('time'),
                            notes: formData.get('notes'),
                            serviceType: msg.serviceType
                          };
                          // Submit booking
                          fetch(`${getApiUrl()}/api/mira/quick-book`, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              ...(token && { 'Authorization': `Bearer ${token}` })
                            },
                            body: JSON.stringify({
                              ...bookingData,
                              session_id: sessionId,
                              pet_id: selectedPet?.id
                            })
                          }).then(res => res.json()).then(data => {
                            toast.success('Booking request submitted!', {
                              description: `Reference: ${data.booking_id || 'Pending'}`
                            });
                            setMessages(prev => [...prev, {
                              id: Date.now().toString(),
                              role: 'assistant',
                              content: `Great! I've submitted your ${msg.serviceType} booking request for ${bookingData.date} at ${bookingData.time}. Our team will confirm shortly! 🐾`
                            }]);
                          }).catch(() => {
                            toast.error('Failed to submit booking');
                          });
                        }} className="space-y-2">
                          <div className="flex gap-2">
                            <input
                              type="date"
                              name="date"
                              required
                              min={new Date().toISOString().split('T')[0]}
                              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                            <select
                              name="time"
                              required
                              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            >
                              <option value="">Time</option>
                              <option value="09:00">9:00 AM</option>
                              <option value="10:00">10:00 AM</option>
                              <option value="11:00">11:00 AM</option>
                              <option value="12:00">12:00 PM</option>
                              <option value="14:00">2:00 PM</option>
                              <option value="15:00">3:00 PM</option>
                              <option value="16:00">4:00 PM</option>
                              <option value="17:00">5:00 PM</option>
                            </select>
                          </div>
                          <input
                            type="text"
                            name="notes"
                            placeholder="Any special requests..."
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                          <button
                            type="submit"
                            className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg text-sm font-bold hover:from-purple-700 hover:to-pink-700"
                          >
                            Confirm Booking
                          </button>
                        </form>
                      </div>
                    )}
                    
                    {/* Concierge® Handoff Notice */}
                    {msg.handoff?.needed && (
                      <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                        <p className="text-xs font-bold text-amber-700 flex items-center gap-1">
                          <span>📦</span> Custom Kit Request Sent
                        </p>
                        <p className="text-xs text-amber-600 mt-1">
                          Our concierge® will curate your kit and send details via email/WhatsApp.
                        </p>
                      </div>
                    )}
                    
                    {/* Service Confirmation Card - Uniform Service Handoff Flow */}
                    {msg.serviceConfirmation && (
                      <div className="mt-3 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 shadow-sm">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-xl">✅</span>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-emerald-800 mb-1">
                              Service Request Confirmed
                            </p>
                            <p className="text-xs text-emerald-700 mb-2">
                              {msg.serviceConfirmation.message || 'Your concierge has received your request and will get back to you.'}
                            </p>
                            <div className="flex flex-wrap gap-2 text-xs">
                              <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full font-medium">
                                {msg.serviceConfirmation.service_name}
                              </span>
                              {msg.serviceConfirmation.pet_name && (
                                <span className="px-2 py-1 bg-white text-emerald-700 rounded-full">
                                  🐕 {msg.serviceConfirmation.pet_name}
                                </span>
                              )}
                              <span className="px-2 py-1 bg-emerald-700 text-white rounded-full font-mono">
                                #{msg.serviceConfirmation.ticket_id}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ── Product cards — BELOW bubble, 800ms delay, health/emotion suppressed ── */}
                  {msg.role === 'assistant' && visibleProducts.has(msg.id) && (
                    <div style={{
                      marginTop: 8, width: '85%', maxWidth: 420,
                      animation: 'miraProductFadeIn 300ms ease forwards',
                      opacity: 0,
                      pointerEvents: 'auto',
                      position: 'relative',
                      zIndex: 1
                    }}>
                      <p style={{ fontSize: 11, color: '#C9973A', marginBottom: 6, fontWeight: 600 }}>
                        ✦ Mira thought of this for {selectedPet?.name || 'your pet'}
                      </p>
                      {/* Concierge® recommendations — DISABLED (parseMiraRecommendations shows hallucinated prices) */}
                      {null}
                      {/* MIRA PICKS — vertical card style matching the design spec */}
                      {msg.products && Array.isArray(msg.products) && msg.products.length > 0 && (
                        <div style={{ marginTop: 16 }}>
                          <p style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 8px 0' }}>
                            MIRA PICKS{selectedPet?.name ? ` FOR ${selectedPet.name.toUpperCase()}` : ''}
                          </p>
                          {msg.products.slice(0, 3).map((p, pIdx) => {
                            if (!p) return null;
                            const chipImg = p.watercolor_image || p.mockup_url || p.cloudinary_url || p.image_url || p.image;
                            const chipPrice = p.price || p.original_price || p.base_price || 0;
                            const chipName = p.product_name || p.name || p.title || 'Product';
                            return (
                              <button
                                key={p.id || pIdx}
                                onClick={() => setSelProd(p)}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: 12,
                                  width: '100%', background: '#FFFFFF',
                                  border: '1.5px solid #F3F0FF', borderRadius: 14,
                                  padding: '12px 14px', marginBottom: 8,
                                  cursor: 'pointer', textAlign: 'left',
                                  boxShadow: '0 1px 4px rgba(107,33,168,0.06)'
                                }}
                              >
                                {chipImg ? (
                                  <img src={chipImg} alt={chipName}
                                    style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, background: '#EDE9FE' }}
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                  />
                                ) : (
                                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#EDE9FE', flexShrink: 0 }} />
                                )}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', lineHeight: 1.3 }}>{chipName}</div>
                                  {chipPrice > 0 && <div style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>₹{chipPrice}</div>}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* SERVICE CHIPS — bookable services when Mira mentions grooming/vet/etc */}
                      {msg.services && Array.isArray(msg.services) && msg.services.length > 0 && (
                        <div style={{ marginTop: 12 }}>
                          <p style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 8px 0' }}>
                            BOOK A SERVICE
                          </p>
                          {msg.services.slice(0, 3).map((svc, sIdx) => {
                            const svcName = svc.name || svc.title || 'Service';
                            const svcPrice = svc.price || svc.base_price || svc.original_price;
                            const svcImg = svc.watercolor_image || svc.image_url || svc.cloudinary_url || svc.image;
                            // Skip AI-generated stock images — show TDC gradient instead
                            const _svcImgClean = svcImg && (!svcImg.includes('ai_generated') || svcImg.includes('cloudinary.com')) ? svcImg : null;
                            return (
                              <button
                                type="button"
                                key={svc.id || sIdx}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  console.log('[BOOK CHIP] clicked, token:', !!token, 'pet:', selectedPet?.name);
                                  setBookingModal({
                                    open: true,
                                    service: {
                                      name: svcName,
                                      pillar: currentPillar || pillar || 'services',
                                      sub_category: svc.sub_category || svc.category || '',
                                      id: svc.id,
                                    },
                                  });
                                }}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: 10,
                                  width: '100%', background: '#F0FDF4',
                                  border: '1.5px solid #BBF7D0', borderRadius: 14,
                                  padding: '10px 14px', marginBottom: 8,
                                  cursor: 'pointer', textAlign: 'left',
                                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                                  textDecoration: 'none', color: 'inherit',
                                  fontFamily: 'inherit', fontSize: 'inherit'
                                }}
                              >
                                {_svcImgClean ? (
                                  <img src={_svcImgClean} alt={svcName} style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} onError={e => { e.target.style.display = 'none'; }} />
                                ) : (
                                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#D1FAE5', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🐕</div>
                                )}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: 13, fontWeight: 700, color: '#065F46', lineHeight: 1.3 }}>{svcName}</div>
                                </div>
                                <span style={{ fontSize: 12, fontWeight: 700, color: '#059669', whiteSpace: 'nowrap' }}>Book →</span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* NearMe chip — when location intent detected */}
                      {msg.showNearMe && (
                        <div style={{ marginTop: 10 }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              const nearMePillar = msg.showNearMe?.pillar || currentPillar || pillar || 'care';
                              window.location.href = `/${nearMePillar}`;
                            }}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 8,
                              background: '#fff', border: '1.5px solid #BBF7D0',
                              borderRadius: 999, padding: '6px 16px',
                              fontSize: 13, fontWeight: 600, color: '#065F46',
                              cursor: 'pointer', boxShadow: '0 2px 8px rgba(6,95,70,0.10)',
                              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                              fontFamily: 'inherit'
                            }}
                          >
                            <span style={{ fontSize: 15 }}>📍</span>
                            Find {msg.showNearMe?.pillar ? `${msg.showNearMe.pillar} services` : 'services'} near you →
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
              })}
              
              {isSending && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-3">
                      {/* Animated typing dots */}
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-bounce [animation-delay:0ms]"></span>
                        <span className="w-2.5 h-2.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-bounce [animation-delay:150ms]"></span>
                        <span className="w-2.5 h-2.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-bounce [animation-delay:300ms]"></span>
                      </div>
                      <span className="text-sm text-gray-500 italic">Mira is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={chatEndRef} />
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              ZONE C: STICKY COMPOSER (Input bar - always at bottom)
              flex-none keeps it from shrinking
              ═══════════════════════════════════════════════════════════════════ */}
          {!isMinimized && (
            <div 
              className="flex-none border-t bg-white" 
              style={{ 
                paddingBottom: 'env(safe-area-inset-bottom, 0px)',
              }}
            >
              {/* Quick Action Tabs (shown when no messages except welcome) */}
              {messages.length <= 1 && (
                <div className="px-4 py-3 border-b bg-gray-50/50">
                  <p className="text-xs text-gray-500 mb-2 font-medium">Quick Actions</p>
                  <div className="flex flex-wrap gap-2">
                    {quickPrompts.map((prompt, idx) => {
                      const isKitPrompt = prompt.toLowerCase().includes('build');
                      return (
                        <button
                          key={idx}
                          onClick={() => sendMessage(prompt)}
                          className={`px-3 py-2 text-xs rounded-full transition-colors font-medium min-h-[44px] touch-manipulation ${
                            isKitPrompt 
                              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-sm hover:from-purple-700 hover:to-pink-700' 
                              : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
                          }`}
                          data-testid={`quick-prompt-${idx}`}
                        >
                          {isKitPrompt ? '🎒 ' : ''}{prompt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {/* Input Area */}
              <div className="p-3">
                <div className="flex items-center gap-2">
                  {/* Voice Input Button */}
                  {speechSupported && (
                    <button
                      onClick={toggleListening}
                      className={`w-12 h-12 min-w-[48px] min-h-[48px] rounded-full flex items-center justify-center transition-all shrink-0 touch-manipulation active:scale-95 ${
                        isListening 
                          ? 'bg-cyan-500 text-white animate-pulse' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      style={{ WebkitTapHighlightColor: 'transparent' }}
                      data-testid="mira-widget-mic"
                    >
                      {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </button>
                  )}
                  
                  {/* Text Input */}
                  <input
                    ref={inputRef}
                    type="text"
                    inputMode="text"
                    autoComplete="off"
                    autoCorrect="on"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder={isListening ? "Listening..." : "Type your message..."}
                    className={`flex-1 px-4 py-3 min-h-[48px] border rounded-full text-base focus:outline-none focus:ring-2 transition-all ${
                      isListening 
                        ? 'border-cyan-400 ring-2 ring-cyan-400/30' 
                        : 'border-gray-200 focus:ring-purple-500 focus:border-purple-500'
                    }`}
                    style={{ fontSize: '16px' }}
                    disabled={isSending}
                  />
                  
                  {/* Send Button */}
                  <button
                    onClick={() => sendMessage()}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      if (inputValue.trim() && !isSending) sendMessage();
                    }}
                    disabled={!inputValue.trim() || isSending}
                    className={`w-12 h-12 min-w-[48px] min-h-[48px] rounded-full flex items-center justify-center transition-all shrink-0 touch-manipulation active:scale-95 ${
                      inputValue.trim() && !isSending
                        ? 'bg-purple-600 text-white hover:bg-purple-700'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                    data-testid="mira-widget-send"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      
      {/* Product Detail Modal — portaled to body to escape Mira's stacking context */}
      {selProd && ReactDOM.createPortal(
        <ProductDetailModal
          product={selProd}
          pillar={currentPillar || pillar || 'celebrate'}
          selectedPet={selectedPet}
          onClose={() => setSelProd(null)}
        />,
        document.body
      )}

      {/* Service Concierge Modal — rendered at z-index above chat widget (2147483647) */}
      {bookingModal.open && ReactDOM.createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 2147483647 }}>
          <ServiceConciergeModal
            service={bookingModal.service}
            pet={selectedPet}
            user={user}
            onClose={() => setBookingModal({ open: false, service: null })}
            onBooked={() => setBookingModal({ open: false, service: null })}
          />
        </div>,
        document.body
      )}

      {/* Cinematic Kit Assembly Modal */}
      {showCinematicKit && (
        <CinematicKitAssembly
          kitName={cinematicKitData.name}
          items={cinematicKitData.items}
          petInfo={{
            name: selectedPet?.name || miraContext?.pets?.[0]?.name,
            breed: selectedPet?.breed || selectedPet?.identity?.breed || miraContext?.pets?.[0]?.breed,
            size: selectedPet?.size || selectedPet?.identity?.size || miraContext?.pets?.[0]?.size,
            age: selectedPet?.age || selectedPet?.identity?.age || miraContext?.pets?.[0]?.age,
            // Preferences from Pet Soul for enhanced personalization
            favorites: petSoulInsights?.preferences?.favorite_treats || petSoulInsights?.preferences?.favorite_flavors || [],
            allergies: petSoulInsights?.health?.allergies || selectedPet?.allergies || [],
            activityLevel: petSoulInsights?.preferences?.activity_level || selectedPet?.activity_level,
            personality: petSoulInsights?.soul?.persona || selectedPet?.personality
          }}
          onComplete={(items) => {
            toast.success(`Added ${items.length} items to cart!`, {
              description: 'Your kit is ready to checkout'
            });
            setShowCinematicKit(false);
          }}
          onClose={() => setShowCinematicKit(false)}
          addToCart={(...args) => {
            addToCart(...args);
            const productName = args[0]?.name || 'Item';
            toast.success(`${productName} added to cart! 🛒`);
          }}
        />
      )}
      
      {/* Pet Picks Panel - Pillar-specific picks with Send to Concierge® flow */}
      {showPicksPanel && selectedPet && (
        <PersonalizedPicksPanel
          isOpen={showPicksPanel}
          onClose={() => setShowPicksPanel(false)}
          pet={selectedPet}
          token={token}
          userEmail={user?.email}
          pillar={pillar} // Lock to current pillar - hide other pillar tabs
          enginePillar={pillar} // Pre-filter to current pillar
          onPickClick={async (pickData) => {
            console.log('[MiraChatWidget] onPickClick received:', pickData);
            // Flow pick into chat conversation - canonical flow
            // 1. Add user message showing the pick they're interested in
            const userMsg = {
              id: `pick-user-${Date.now()}`,
              role: 'user',
              content: `I'm interested in "${pickData.name}" for ${pickData.pet_name}`,
              timestamp: new Date().toISOString()
            };
            console.log('[MiraChatWidget] Adding user message:', userMsg);
            setMessages(prev => [...prev, userMsg]);
            
            // 2. Create service desk ticket via canonical flow
            try {
              const ticketResponse = await fetch(`${getApiUrl()}/api/service-requests`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                  type: pickData.pick_type === 'concierge' ? 'concierge_service' : 'product_inquiry',
                  pillar: pickData.pillar || pillar,
                  title: pickData.name,
                  source: 'mira_chat_picks',
                  customer: {
                    name: user?.name || 'Customer',
                    email: user?.email || '',
                    phone: user?.phone || ''
                  },
                  details: {
                    pet_id: pickData.pet_id,
                    pet_name: pickData.pet_name,
                    pick_name: pickData.name,
                    pick_description: pickData.description || pickData.why_it_fits || `Interest in ${pickData.name}`,
                    pick_data: pickData,
                    channel: 'chat'
                  },
                  priority: 'normal',
                  intent: 'pick_interest'
                })
              });
              
              if (ticketResponse.ok) {
                const ticketData = await ticketResponse.json();
                const ticketId = ticketData.ticket_id || ticketData.request_id;
                
                // 3. Add assistant confirmation to chat
                const confirmMsg = {
                  id: `pick-confirm-${Date.now()}`,
                  role: 'assistant',
                  content: `✅ Great choice! I've sent your interest in **${pickData.name}** for ${pickData.pet_name} to our Concierge® team. Request #${ticketId}\n\nThey'll reach out shortly with availability and next steps. Is there anything specific you'd like me to tell them about your preferences?`,
                  timestamp: new Date().toISOString()
                };
                setMessages(prev => [...prev, confirmMsg]);
                
                toast.success(`Sent to Concierge®!`, {
                  description: `Request #${ticketId} for ${pickData.pet_name}`
                });
              }
            } catch (err) {
              console.error('[MiraChat] Pick flow error:', err);
              // Still add a message even if ticket creation fails
              const errorMsg = {
                id: `pick-error-${Date.now()}`,
                role: 'assistant',
                content: `I've noted your interest in **${pickData.name}** for ${pickData.pet_name}. Let me connect you with our team. Would you like me to provide more details about this option?`,
                timestamp: new Date().toISOString()
              };
              setMessages(prev => [...prev, errorMsg]);
            }
          }}
          onSendSuccess={(data) => {
            // Add confirmation message to chat
            const confirmMsg = {
              id: `picks-confirm-${Date.now()}`,
              role: 'assistant',
              content: `✅ Perfect! I've sent ${data.count} pick${data.count > 1 ? 's' : ''} for ${data.petName} to your Concierge®. They'll review and reach out with next steps. You can track this in your inbox. 💜`,
              timestamp: new Date().toISOString()
            };
            setMessages(prev => [...prev, confirmMsg]);
            setShowPicksPanel(false);
            toast.success('Sent to Concierge®!', {
              description: `${data.count} pick${data.count > 1 ? 's' : ''} for ${data.petName}`
            });
          }}
        />
      )}
    </div>
  );
};

export default MiraChatWidget;

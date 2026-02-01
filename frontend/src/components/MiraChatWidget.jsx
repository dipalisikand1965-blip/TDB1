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

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { getApiUrl } from '../utils/api';
import { toast } from 'sonner';
import { useMiraSignal } from '../hooks/useMiraSignal';
import MiraOrb from './MiraOrb';
import CinematicKitAssembly from './CinematicKitAssembly';
import ReactMarkdown from 'react-markdown';
import { 
  X, Send, Loader2, Mic, MicOff, Volume2, VolumeX, 
  ChevronDown, Sparkles, PawPrint, MessageCircle, Zap,
  ArrowLeft, ShoppingCart, Plus, Heart, ShoppingBag, Play
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Generate session ID for Mira conversations - PERSISTS across pillar switches
const generateSessionId = () => {
  const stored = sessionStorage.getItem('mira_widget_session');
  if (stored) return stored;
  const newId = `mira-widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  sessionStorage.setItem('mira_widget_session', newId);
  return newId;
};

// Store and retrieve messages from sessionStorage - PERSISTS across pillar switches
const getStoredMessages = () => {
  try {
    const stored = sessionStorage.getItem('mira_messages');
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    return [];
  }
};

const storeMessages = (messages) => {
  try {
    sessionStorage.setItem('mira_messages', JSON.stringify(messages));
  } catch (e) {
    console.debug('Failed to store messages:', e);
  }
};

const MiraChatWidget = ({ 
  pillar = 'general',
  onProductClick = null,
  className = '' 
}) => {
  const { user, token } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  
  // Widget state
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  
  // Cinematic Kit Assembly state
  const [showCinematicKit, setShowCinematicKit] = useState(false);
  const [cinematicKitData, setCinematicKitData] = useState({ name: '', items: [] });
  
  // Chat state - Initialize from sessionStorage to persist across pillar switches
  const [messages, setMessages] = useState(() => getStoredMessages());
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sessionId] = useState(generateSessionId);
  const [selectedPet, setSelectedPet] = useState(null);
  const [pets, setPets] = useState([]);
  const [currentPillar, setCurrentPillar] = useState(pillar);
  
  // Pet-specific recommendations & soul intelligence
  const [petRecommendations, setPetRecommendations] = useState([]);
  const [petSoulInsights, setPetSoulInsights] = useState(null);
  const [quickActions, setQuickActions] = useState([]);
  
  // Voice state
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef(null);
  const synthRef = useRef(typeof window !== 'undefined' ? window.speechSynthesis : null);
  
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  
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
    shop: { icon: '🛒', name: 'Shop', color: 'from-indigo-500 to-purple-500' }
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
    trackPillarVisit(pillar);
    
    // Fetch pillar-specific quick prompts
    const fetchQuickPrompts = async () => {
      try {
        const response = await fetch(`${getApiUrl()}/api/mira/quick-prompts/${pillar}`);
        if (response.ok) {
          const data = await response.json();
          setDynamicPrompts(data.prompts || []);
        }
      } catch (error) {
        console.debug('Quick prompts fetch failed:', error);
      }
    };
    
    // Fetch personalized Mira context
    const fetchMiraContext = async () => {
      if (!token) return;
      try {
        const response = await fetch(`${getApiUrl()}/api/mira/context/${pillar}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setMiraContext(data);
        }
      } catch (error) {
        console.debug('Mira context fetch failed:', error);
      }
    };
    
    fetchQuickPrompts();
    fetchMiraContext();
  }, [pillar, trackPillarVisit, token]);
  
  // Set pillar-specific quick actions immediately (no auth required)
  useEffect(() => {
    const pillarActions = {
      stay: ['Book Stay', 'Find Hotels', 'Pet-Friendly Resorts'],
      care: ['Build Care Kit', 'Book Grooming', 'Vet Consult', 'Wellness Check'],
      fit: ['Build Fitness Kit', 'Start Workout', 'Track Activity'],
      travel: ['Build Travel Kit', 'Plan Trip', 'Pet Passport'],
      celebrate: ['Build Birthday Kit', 'Order Cake', 'Party Planning'],
      dine: ['Meal Plan', 'Order Food', 'Special Diet'],
      enjoy: ['Find Playdate', 'Dog Park', 'Social Events'],
      learn: ['Build Training Kit', 'Start Training', 'Book Class'],
      paperwork: ['Get Insurance', 'Registration', 'Health Records'],
      advisory: ['Expert Consult', 'Nutrition Plan', 'Behavior Help'],
      emergency: ['24/7 Vet', 'First Aid', 'Emergency Contacts'],
      farewell: ['Memorial', 'Support', 'Rainbow Bridge'],
      adopt: ['Browse Pets', 'Apply', 'Foster'],
      shop: ['Best Sellers', 'Deals', 'New Arrivals']
    };
    setQuickActions(pillarActions[pillar] || ['Help', 'Browse', 'Book']);
  }, [pillar]);
  
  // Fetch user's pets
  useEffect(() => {
    if (!user || !token) return;
    
    const fetchPets = async () => {
      try {
        const response = await fetch(`${getApiUrl()}/api/pets`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setPets(data.pets || []);
          if (data.pets?.length > 0) {
            setSelectedPet(data.pets[0]);
          }
        }
      } catch (error) {
        console.debug('Failed to fetch pets:', error);
      }
    };
    
    fetchPets();
  }, [user, token]);
  
  // Fetch pet-specific recommendations and soul insights when pet changes
  useEffect(() => {
    if (!selectedPet?.id) return;
    
    const fetchPetIntelligence = async () => {
      try {
        // Fetch product recommendations for this pet + pillar
        const recsResponse = await fetch(
          `${getApiUrl()}/api/mira/pet-recommendations/${selectedPet.id}?pillar=${pillar}`,
          { headers: token ? { 'Authorization': `Bearer ${token}` } : {} }
        );
        if (recsResponse.ok) {
          const recsData = await recsResponse.json();
          setPetRecommendations(recsData.recommendations || []);
        }
        
        // Fetch pet soul insights
        const soulResponse = await fetch(
          `${getApiUrl()}/api/pets/${selectedPet.id}/soul`,
          { headers: token ? { 'Authorization': `Bearer ${token}` } : {} }
        );
        if (soulResponse.ok) {
          const soulData = await soulResponse.json();
          setPetSoulInsights(soulData);
        }
        
      } catch (error) {
        console.debug('Failed to fetch pet intelligence:', error);
      }
    };
    
    fetchPetIntelligence();
    
    // Reset messages when pet changes to show new personalized greeting
    if (isOpen) {
      setMessages([]);
    }
  }, [selectedPet?.id, pillar, token, isOpen]);
  
  // Lock body scroll when widget is open on mobile
  useEffect(() => {
    if (isOpen) {
      // Lock scroll
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = `-${window.scrollY}px`;
    } else {
      // Restore scroll
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
      // Cleanup on unmount
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
    };
  }, [isOpen]);

  // Add welcome message when widget opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greeting = getTimeBasedGreeting();
      const petName = selectedPet?.name;
      const petBreed = selectedPet?.breed;
      const pillarName = config.name;
      
      // Personalized welcome based on context
      let welcomeMsg = `${greeting}!`;
      
      // Safely get pillar note - ensure it's a string
      const pillarNote = typeof miraContext?.pillar_note === 'string' ? miraContext.pillar_note : null;
      
      if (pillarNote) {
        welcomeMsg = pillarNote;
      } else if (petName && petBreed) {
        welcomeMsg += ` I see you're browsing ${pillarName} for ${petName}, your lovely ${petBreed}. How can I help today?`;
      } else if (petName) {
        welcomeMsg += ` How can I help you with ${petName}'s ${pillarName.toLowerCase()} needs today?`;
      } else {
        welcomeMsg += ` I'm here to help with all your ${pillarName.toLowerCase()} needs. What can I do for you?`;
      }
      
      welcomeMsg += ' 🐾';
      
      // Speak welcome greeting when widget opens (if voice is enabled)
      if (synthRef.current && voiceEnabled) {
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
      
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: `Hi, I am Mira, your pet concierge®! ${welcomeMsg}`
      }]);
    }
  }, [isOpen, selectedPet, miraContext, config.name, voiceEnabled]);
  
  // Store messages when they change - PERSIST across pillar switches
  useEffect(() => {
    if (messages.length > 0) {
      storeMessages(messages);
    }
  }, [messages]);
  
  // Track pillar changes - add a notification to chat when pillar switches
  useEffect(() => {
    if (pillar !== currentPillar && messages.length > 0) {
      setCurrentPillar(pillar);
      // Add pillar switch notification to chat
      setMessages(prev => [...prev, {
        id: `pillar-switch-${Date.now()}`,
        role: 'assistant',
        content: `📍 You're now in ${config.name}. How can I help you here?`,
        isPillarSwitch: true
      }]);
    }
  }, [pillar, currentPillar, config.name, messages.length]);
  
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
  
  // Text-to-Speech function - MIRA IS A BRITISH WOMAN
  const speakText = useCallback((text) => {
    if (!synthRef.current || !voiceEnabled) return;
    
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
  }, [voiceEnabled]);
  
  const sendMessage = async () => {
    if (!inputValue.trim() || isSending) return;
    
    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsSending(true);
    
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }
    
    try {
      const response = await fetch(`${getApiUrl()}/api/mira/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          message: userMessage.content,
          session_id: sessionId,
          source: 'chat_widget',
          current_pillar: pillar,
          selected_pet_id: selectedPet?.id || null,
          history: messages.filter(m => m.id !== 'welcome').map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        let displayContent = data.response;
        
        // Handle concierge_action for navigation
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
            
            if (voiceEnabled) {
              speakText(data.response);
            }
            setIsSending(false);
            return; // Don't continue to regular message handling
          }
          
          // Navigation actions (only if no form)
          if (action.navigate_to && !action.show_quick_book_form) {
            toast.info(`Taking you to ${action.navigate_to.replace('/', '').replace('-', ' ')}...`);
            setTimeout(() => {
              navigate(action.navigate_to);
            }, 1500);
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
        
        // Add ticket info if created
        if (data.service_desk_ticket_id || data.concierge_action?.action_needed) {
          const ticketId = data.service_desk_ticket_id || data.ticket_id;
          displayContent += `\n\n📋 **Request #${ticketId}** created!`;
          toast.success(`Request #${ticketId} created!`, {
            description: 'Our concierge® team will contact you shortly.'
          });
        }
        
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: displayContent,
          products: data.products,
          ticketId: data.ticket_id,
          kitAssembly: data.kit_assembly,
          handoff: data.handoff
        }]);
        
        if (voiceEnabled) {
          speakText(data.response);
        }
      } else {
        throw new Error('Failed to get response');
      }
    } catch (error) {
      console.error('Mira chat error:', error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm having a brief pause. Please try again."
      }]);
    } finally {
      setIsSending(false);
    }
  };
  
  const handleProductClick = (product) => {
    if (onProductClick) {
      onProductClick(product);
    } else {
      // Navigate to product page instead of adding to cart
      const productUrl = product.url || product.shopify_handle 
        ? `/product/${product.shopify_handle || product.url}`
        : `/product/${product.id}`;
      navigate(productUrl);
    }
    // Track the click for personalization
    trackClick('product_recommendation', product.id, { pillar, source: 'mira_chat' });
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
      dine: ['Pet-friendly restaurants', 'Special diet options', 'Meal delivery'],
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
      // Only respond if we're on a pillar page matching our pillar prop
      // or if the event specifies our pillar
      if (event.detail?.pillar === pillar || event.detail?.source === 'mobile_nav') {
        console.log('[MiraChatWidget] Opening for pillar:', pillar);
        setIsOpen(true);
      }
    };
    
    window.addEventListener('openMiraAI', handleOpenMira);
    return () => window.removeEventListener('openMiraAI', handleOpenMira);
  }, [pillar]);
  
  // Get orb state based on current activity
  const getOrbState = () => {
    if (isListening) return 'listening';
    if (isSpeaking) return 'speaking';
    if (isSending) return 'thinking';
    return 'idle';
  };
  
  // Floating Button (when closed) - Uses the beautiful MiraOrb!
  if (!isOpen) {
    return (
      <div className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9999] flex flex-col items-end gap-3 ${className}`}>
        <MiraOrb 
          state={getOrbState()}
          size="md"
          showLabel={true}
          onClick={() => setIsOpen(true)}
        />
      </div>
    );
  }
  
  // Chat Widget (when open) - RESPONSIVE for mobile
  // Mobile: Full screen from bottom
  // Desktop: Side drawer on right (fixed to right edge)
  return (
    <div 
      className={`fixed z-[9999] ${className}
        bottom-0 right-0 left-0 
        sm:bottom-0 sm:right-0 sm:left-auto sm:top-0
      `}
      data-testid="mira-chat-widget"
    >
      {/* Chat container - MOBILE RESPONSIVE */}
      {/* Mobile: Full width, rounded top only, from bottom */}
      {/* Desktop: Side drawer, full height, fixed width on right edge */}
      <div className={`
        w-full sm:w-[400px] lg:w-[420px]
        bg-white shadow-2xl overflow-hidden flex flex-col transition-all duration-300
        rounded-t-2xl sm:rounded-none sm:border-l sm:border-gray-200
        ${isMinimized ? 'h-16 sm:h-full' : 'h-[85vh] sm:h-full'}
      `}>
        {/* Header */}
        <div 
          className={`bg-gradient-to-r ${config.color} text-white p-3 sm:p-4 cursor-pointer flex items-center justify-between shrink-0`}
          onClick={() => isMinimized && setIsMinimized(false)}
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div className={`w-9 h-9 sm:w-10 sm:h-10 bg-white/20 rounded-full flex items-center justify-center ${isListening ? 'animate-pulse ring-2 ring-cyan-400' : ''}`}>
              <PawPrint className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <p className="font-semibold text-sm sm:text-base">Mira</p>
              <p className="text-[10px] sm:text-xs opacity-80">
                {isListening ? '🎤 Listening...' : isSpeaking ? '🔊 Speaking...' : 'Pet Concierge®'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-2">
            {/* Voice toggle */}
            <button
              onClick={(e) => { e.stopPropagation(); setVoiceEnabled(!voiceEnabled); }}
              className={`w-9 h-9 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-colors ${voiceEnabled ? 'bg-white/20' : 'bg-white/10'}`}
              title={voiceEnabled ? "Voice ON" : "Voice OFF"}
            >
              {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            {/* Close */}
            <button
              onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
              className="w-9 h-9 sm:w-8 sm:h-8 rounded-full flex items-center justify-center bg-white/20 hover:bg-white/30 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Content - Hidden when minimized */}
        {!isMinimized && (
          <>
            {/* Pet Selector + Suggestions Row - Compact */}
            {pets.length > 0 && (
              <div className="px-3 py-2 border-b bg-gray-50 shrink-0">
                <div className="flex items-center gap-2 overflow-x-auto">
                  <span className="text-xs text-gray-500 shrink-0">For:</span>
                  {pets.map(pet => (
                    <button
                      key={pet.id}
                      onClick={() => {
                        setSelectedPet(pet);
                        trackClick('pet_switch', pet.id, { pillar, from_pet: selectedPet?.id });
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs flex items-center gap-1.5 transition-all shrink-0 ${
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
            
            {/* SUGGESTED FOR [PET] - Compact horizontal scroll */}
            {selectedPet && petRecommendations.length > 0 && (
              <div className="px-3 py-2 border-b bg-gradient-to-r from-purple-50/50 to-pink-50/50 shrink-0">
                <p className="text-[10px] font-bold text-purple-700 uppercase tracking-wider mb-1.5">
                  ✨ For {selectedPet.name}
                </p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {petRecommendations.slice(0, 4).map(product => {
                    const imageUrl = product.image?.startsWith('http') 
                      ? product.image 
                      : product.images?.[0] || 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=100&h=100&fit=crop';
                    return (
                      <div 
                        key={product.id}
                        onClick={() => handleProductClick(product)}
                        className="flex-shrink-0 w-28 bg-white rounded-lg p-2 shadow-sm cursor-pointer border border-purple-100 active:scale-95"
                      >
                        <img 
                          src={imageUrl} 
                          alt={product.name} 
                          className="w-full h-16 rounded object-cover mb-1.5"
                          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=100'; }}
                        />
                        <p className="text-xs font-medium text-gray-800 truncate">{product.name}</p>
                        <p className="text-xs text-purple-600 font-bold">₹{product.price}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Quick Actions */}
            <div className="px-3 py-2 border-b shrink-0">
              <div className="flex gap-2 overflow-x-auto">
                {quickActions.slice(0, 3).map((action, idx) => {
                  const isKitAction = action.toLowerCase().includes('build');
                  return (
                    <button
                      key={idx}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setInputValue(action);
                        if (isKitAction) {
                          setTimeout(() => sendMessage(), 100);
                        } else {
                          // Auto-send for non-kit actions too
                          setTimeout(() => sendMessage(), 100);
                        }
                      }}
                      className={`px-4 py-2.5 rounded-full text-xs font-semibold whitespace-nowrap min-h-[44px] touch-manipulation ${
                        isKitAction 
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white active:from-purple-700 active:to-pink-700' 
                          : 'bg-gray-100 text-gray-700 active:bg-gray-200'
                      }`}
                      data-testid={`quick-action-${idx}`}
                    >
                      {isKitAction && '🎒 '}{action}
                    </button>
                  );
                })}
              </div>
            </div>
            
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                      msg.role === 'user'
                        ? `bg-gradient-to-r ${config.color} text-white rounded-br-sm`
                        : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                    }`}
                  >
                    <div className="text-sm whitespace-pre-wrap prose prose-sm max-w-none [&_p]:mb-1 [&_ul]:mb-1 [&_ol]:mb-1 [&_li]:mb-0.5 [&_strong]:font-bold">
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <span className="block mb-1 last:mb-0">{children}</span>,
                          strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                          ul: ({ children }) => <ul className="list-disc pl-4 my-1">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal pl-4 my-1">{children}</ol>,
                          li: ({ children }) => <li className="mb-0.5">{children}</li>,
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                    
                    {/* Product Cards (if Mira recommends products) */}
                    {msg.products && msg.products.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-xs font-bold text-purple-700 uppercase">✨ Recommended for you:</p>
                        {msg.products.slice(0, 4).map(product => {
                          // Use fallback image if product image is a local path or missing
                          const imageUrl = product.image && product.image.startsWith('http') 
                            ? product.image 
                            : product.images?.[0] || `https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200&h=200&fit=crop`;
                          
                          return (
                            <div 
                              key={product.id}
                              className="bg-white rounded-lg p-2.5 flex items-center gap-3 border border-purple-100 cursor-pointer active:bg-purple-50"
                              onClick={() => handleProductClick(product)}
                            >
                              <img 
                                src={imageUrl} 
                                alt={product.name} 
                                className="w-16 h-16 rounded object-cover flex-shrink-0"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200&h=200&fit=crop';
                                }}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-gray-800 line-clamp-2">{product.name}</p>
                                <p className="text-sm text-purple-600 font-bold">₹{product.price}</p>
                                {product.original_price && product.original_price > product.price && (
                                  <p className="text-xs text-gray-400 line-through">₹{product.original_price}</p>
                                )}
                              </div>
                              <div className="flex flex-col gap-1">
                                <button
                                  onClick={() => handleProductClick(product)}
                                  className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-[10px] font-medium hover:bg-purple-200"
                                >
                                  View
                                </button>
                                <button
                                  onClick={() => { addToCart(product); toast.success('Added!'); }}
                                  className="px-2 py-1 bg-purple-600 text-white rounded text-[10px] font-medium hover:bg-purple-700"
                                >
                                  Add
                                </button>
                              </div>
                            </div>
                          );
                        })}
                        
                        {/* Add All to Cart button for kit assembly */}
                        {msg.kitAssembly?.can_add_all_to_cart && msg.products.length > 1 && (
                          <div className="mt-2 space-y-2">
                            {/* Cinematic Kit Experience Button */}
                            <button
                              onClick={() => {
                                setCinematicKitData({
                                  name: msg.kitAssembly?.kit_name || `${pillar.charAt(0).toUpperCase() + pillar.slice(1)} Kit`,
                                  items: msg.products
                                });
                                setShowCinematicKit(true);
                              }}
                              className="w-full px-4 py-3 bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 text-white rounded-lg text-sm font-bold hover:from-violet-700 hover:via-purple-700 hover:to-pink-700 transition-all flex items-center justify-center gap-2 shadow-lg"
                            >
                              <Play className="w-4 h-4" />
                              View Kit Experience
                              <Badge className="bg-white/20 text-white text-[10px] ml-2">✨ New</Badge>
                            </button>
                            {/* Quick Add All */}
                            <button
                              onClick={() => {
                                msg.products.forEach(p => addToCart(p));
                                toast.success(`Added ${msg.products.length} items to cart!`, {
                                  description: 'Your kit is ready to checkout'
                                });
                              }}
                              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                            >
                              <ShoppingBag className="w-4 h-4" />
                              Quick Add All {msg.products.length} Items
                            </button>
                          </div>
                        )}
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
                    
                    {/* Concierge Handoff Notice */}
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
                  </div>
                </div>
              ))}
              
              {isSending && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                      <span className="text-sm text-gray-500">Mira is typing...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={chatEndRef} />
            </div>
            
            {/* Quick Action Tabs (shown when no messages except welcome) */}
            {messages.length <= 1 && (
              <div className="px-4 pb-3 shrink-0">
                <p className="text-xs text-gray-500 mb-2 font-medium">Quick Actions</p>
                <div className="flex flex-wrap gap-2">
                  {quickPrompts.map((prompt, idx) => {
                    // Style "Build Kit" prompts differently
                    const isKitPrompt = prompt.toLowerCase().includes('build');
                    return (
                      <button
                        key={idx}
                        onClick={() => { setInputValue(prompt); inputRef.current?.focus(); }}
                        className={`px-3 py-2 text-xs rounded-full transition-colors font-medium ${
                          isKitPrompt 
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-sm hover:from-purple-700 hover:to-pink-700' 
                            : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
                        }`}
                        data-testid={`quick-action-${idx}`}
                      >
                        {isKitPrompt ? '🎒 ' : ''}{prompt}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Input Area */}
            <div className="p-3 border-t bg-white shrink-0">
              <div className="flex items-center gap-2">
                {/* Voice Input Button */}
                {speechSupported && (
                  <button
                    onClick={toggleListening}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0 ${
                      isListening 
                        ? 'bg-cyan-500 text-white animate-pulse' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    data-testid="mira-widget-mic"
                  >
                    {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>
                )}
                
                {/* Text Input */}
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder={isListening ? "Listening..." : "Type your message..."}
                  className={`flex-1 px-4 py-2.5 border rounded-full text-sm focus:outline-none focus:ring-2 transition-all ${
                    isListening 
                      ? 'border-cyan-400 ring-2 ring-cyan-400/30' 
                      : 'border-gray-200 focus:ring-purple-500 focus:border-purple-500'
                  }`}
                  disabled={isSending}
                />
                
                {/* Send Button */}
                <button
                  onClick={sendMessage}
                  disabled={!inputValue.trim() || isSending}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0 ${
                    inputValue.trim() && !isSending
                      ? 'bg-purple-600 text-white hover:bg-purple-700'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                  data-testid="mira-widget-send"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      
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
          addToCart={addToCart}
        />
      )}
    </div>
  );
};

export default MiraChatWidget;

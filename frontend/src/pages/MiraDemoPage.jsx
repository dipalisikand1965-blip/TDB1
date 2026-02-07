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
  HelpCircle, Heart, Sparkles, ChevronDown, ChevronUp,
  ShoppingBag, PawPrint, Bot, History, Plus, Check, Search,
  ThumbsUp, ThumbsDown, X, Phone, Mail, MessageSquare, AlertCircle,
  Star, Crown, Gift
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../utils/api';

// Import the production-style CSS (matches thedoggycompany.in)
import '../styles/mira-prod.css';

// Dock Items - Clean and minimal
const DOCK_ITEMS = [
  { id: 'concierge', label: 'Concierge®', icon: MessageCircle, action: 'openChat' },
  { id: 'orders', label: 'Orders', icon: Package, path: '/orders' },
  { id: 'plan', label: 'Plan', icon: Calendar, path: '/family-dashboard', tab: 'calendar' },
  { id: 'help', label: 'Help', icon: HelpCircle, action: 'openHelp' },
  { id: 'soul', label: 'Soul', icon: Heart, path: '/pet-soul' },
];

// Test Scenarios
const TEST_SCENARIOS = [
  { id: 'treats', label: '🦴 Treats', query: "Show me some treats for Buddy" },
  { id: 'birthday', label: '🎂 Birthday', query: "I want to plan Buddy's birthday" },
  { id: 'food', label: '🍽️ Food', query: "What food would be best for Buddy?" },
  { id: 'grooming', label: '✂️ Haircut', query: "Buddy needs a haircut, can you help?" },
  { id: 'groom-bath', label: '🛁 Bath', query: "Buddy smells and really needs a bath" },
  { id: 'groom-tools', label: '🧴 Tools', query: "What shampoo should I use?" },
  { id: 'groom-accident', label: '🩹 Accident', query: "I cut Buddy's nail too short and it's bleeding" },
  { id: 'health', label: '🏥 Health', query: "I'm worried, Buddy has been coughing a lot" },
  { id: 'anxious', label: '😰 Anxiety', query: "Buddy seems anxious during thunderstorms" },
  { id: 'memorial', label: '🌈 Farewell', query: "I lost my dog last week and I'm not ready to talk" },
  { id: 'travel', label: '✈️ Travel', query: "We're planning a trip with Buddy next month" },
  { id: 'boarding', label: '🏠 Boarding', query: "I need someone to watch Buddy while I'm away" },
];

// Helper: Generate "Why for {Pet}" personalized reasons
const generateWhyForPet = (product, pet) => {
  const productName = (product.name || '').toLowerCase();
  const petName = pet.name;
  const breed = (pet.breed || '').toLowerCase();
  const sensitivities = pet.sensitivities || [];
  
  // Check for allergies/sensitivities
  if (sensitivities.some(s => s.toLowerCase().includes('chicken')) && 
      !productName.includes('chicken')) {
    return `Chicken-free option for ${petName}'s sensitivity`;
  }
  
  // Check for breed-specific
  if (breed.includes('golden') || breed.includes('retriever')) {
    if (productName.includes('hip') || productName.includes('joint')) {
      return `Great for ${petName}'s breed joint health`;
    }
  }
  
  if (breed.includes('shih tzu') || breed.includes('maltese')) {
    if (productName.includes('eye') || productName.includes('tear')) {
      return `Perfect for ${petName}'s eye care needs`;
    }
  }
  
  // Check for treats
  if (productName.includes('treat') || productName.includes('snack')) {
    return `A tasty reward ${petName} will love`;
  }
  
  // Check for grooming
  if (productName.includes('shampoo') || productName.includes('brush') || productName.includes('groom')) {
    return `Keeps ${petName} looking beautiful`;
  }
  
  // Check for food
  if (productName.includes('food') || productName.includes('kibble')) {
    return `Nutrition tailored for ${petName}'s needs`;
  }
  
  // Check for toys
  if (productName.includes('toy') || productName.includes('ball') || productName.includes('chew')) {
    return `Perfect for ${petName}'s playtime`;
  }
  
  // Default personalized message
  return `Selected for ${petName}'s profile`;
};

// Sample pet for demo - with Soul Score traits
const DEMO_PET = {
  id: 'demo-pet',
  name: 'Buddy',
  breed: 'Golden Retriever',
  age: '3 years',
  traits: ['Playful', 'Friendly', 'Energetic'],
  sensitivities: ['Chicken allergy'],
  favorites: ['Tennis balls', 'Peanut butter treats'],
  photo: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=200&h=200&fit=crop&crop=face',
  // Soul Score traits from Travel page reference
  soulTraits: [
    { label: 'Playful spirit', icon: '⭐', color: '#f59e0b' },
    { label: 'Gentle paws', icon: '🎀', color: '#ec4899' },
    { label: 'Loyal friend', icon: '❤️', color: '#ef4444' },
  ],
  soulScore: 87 // Overall soul score
};

// All pets for multi-pet selector
const ALL_PETS = [
  DEMO_PET,
  {
    id: 'pet-2',
    name: 'Luna',
    breed: 'Labrador',
    age: '5 years',
    sensitivities: [],
    photo: null,
    soulTraits: [
      { label: 'Calm soul', icon: '🌙', color: '#8b5cf6' },
      { label: 'Wise eyes', icon: '👁️', color: '#06b6d4' },
    ],
    soulScore: 92
  }
];

const MiraDemoPage = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  
  // State
  const [query, setQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [activeDockItem, setActiveDockItem] = useState(null);
  const [pet, setPet] = useState(DEMO_PET);
  const [allPets, setAllPets] = useState(ALL_PETS);
  const [activeScenario, setActiveScenario] = useState(null);
  const [showScenarios, setShowScenarios] = useState(true);
  const [showTestScenarios, setShowTestScenarios] = useState(true);
  const [collapsedSections, setCollapsedSections] = useState({});
  const [currentTicket, setCurrentTicket] = useState(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const [currentPillar, setPillar] = useState('celebrate');
  const [lastShownProducts, setLastShownProducts] = useState([]);
  const [isRecording, setIsRecording] = useState(false); // For universal search voice
  
  // MULTI-PET SUPPORT - Switch between pets
  const [showPetSelector, setShowPetSelector] = useState(false);
  
  // MULTI-SESSION MANAGEMENT - Past chats
  const [pastSessions, setPastSessions] = useState([]);
  const [showPastChats, setShowPastChats] = useState(false);
  const [loadingPastChats, setLoadingPastChats] = useState(false);
  
  // SESSION PERSISTENCE - The memory that never forgets
  const [sessionId, setSessionId] = useState(() => {
    // Try to recover session from localStorage first
    const savedSession = localStorage.getItem('mira_session_id');
    if (savedSession) {
      console.log('[SESSION] Recovered session:', savedSession);
      return savedSession;
    }
    // Generate new session if none exists
    const newSession = `mira-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('mira_session_id', newSession);
    console.log('[SESSION] Created new session:', newSession);
    return newSession;
  });
  const [sessionRecovered, setSessionRecovered] = useState(false);
  
  // Conversation stage tracking for product opt-in
  // Stage: 'initial' | 'clarifying' | 'opted_in_products' | 'concierge_engaged'
  const [conversationStage, setConversationStage] = useState('initial');
  const [userHasOptedInForProducts, setUserHasOptedInForProducts] = useState(false);
  
  // Step tracking - ANTI-LOOP SYSTEM
  // Tracks which steps (questions) have been asked and answered
  const [completedSteps, setCompletedSteps] = useState([]);  // List of step_ids that are done
  const [currentStep, setCurrentStep] = useState(null);  // Currently open step waiting for answer
  const [stepHistory, setStepHistory] = useState([]);  // Full history of Q&A
  
  // Refs
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const handleSubmitRef = useRef(null);
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
  
  // SESSION RECOVERY - Load conversation from backend on page load
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
          // Session doesn't exist yet - that's OK, it's a new conversation
          console.log('[SESSION] New session, no history to recover');
          setSessionRecovered(true);
        }
      } catch (err) {
        console.warn('[SESSION] Recovery failed:', err);
        setSessionRecovered(true);
      }
    };
    
    recoverSession();
  }, [sessionId, sessionRecovered]);
  
  // Clear session function (for "New Chat" button)
  const startNewSession = () => {
    const newSession = `mira-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('mira_session_id', newSession);
    localStorage.setItem('mira_session_pet_id', pet.id); // Track which pet this session is for
    setSessionId(newSession);
    setConversationHistory([]);
    setCompletedSteps([]);
    setCurrentStep(null);
    setStepHistory([]);
    setConversationStage('initial');
    setUserHasOptedInForProducts(false);
    setSessionRecovered(true);
    setShowPastChats(false);
    console.log('[SESSION] Started new session:', newSession, 'for pet:', pet.name);
  };
  
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
              traits: p.doggy_soul_answers?.describe_3_words || ['Loving'],
              sensitivities: p.doggy_soul_answers?.health_conditions || [],
              favorites: p.doggy_soul_answers?.favorite_treats || [],
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
  
  // MULTI-PET: Switch to a different pet
  const switchPet = async (newPet) => {
    if (newPet.id === pet.id) {
      setShowPetSelector(false);
      return;
    }
    
    console.log('[PET SWITCH] Switching to:', newPet.name);
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
      }
    } catch (err) {
      console.error('[PET SWITCH] Error:', err);
      // Fallback: just start fresh
      startNewSession();
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
            setPet({
              id: p.id,
              name: p.name,
              breed: p.breed,
              age: p.age || 'Unknown',
              traits: p.doggy_soul_answers?.describe_3_words || ['Loving'],
              sensitivities: p.doggy_soul_answers?.health_conditions || [],
              favorites: p.doggy_soul_answers?.favorite_treats || []
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
  const engageConcierge = useCallback(async (reason, latestMiraSummary = '') => {
    if (!currentTicket) return;
    
    const now = new Date();
    
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
          latest_mira_summary: latestMiraSummary || 'Parent requested Concierge assistance.'
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
    
    // Add visual message to conversation
    const systemMessage = {
      type: 'system',
      content: 'Your pet Concierge® is joining this chat...',
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
        { text: 'Yes, connect me to Concierge', value: 'Yes, connect me to my Concierge.' },
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
  
  // Check if user is explicitly asking for products/suggestions
  // This should only return true when user EXPLICITLY asks for products
  // NOT when they're just stating an intent (travel, birthday, etc.)
  const isProductOptIn = useCallback((inputQuery) => {
    const lowerInput = inputQuery.toLowerCase();
    
    // ONLY explicit product request phrases - NOT intent declarations
    const optInPhrases = [
      // Direct affirmatives after Mira asks
      'yes', 'yes please', 'yes do', 'you do', 'please do', 'go ahead',
      'sure', 'ok', 'okay', 'definitely', 'absolutely',
      
      // Explicit "show me products" phrases
      'show me products', 'show products', 'what products',
      'show me options', 'show options', 'what are my options',
      'suggest products', 'recommend products',
      'what do i need', 'what should i buy', 'what should i get',
      'show me what i need', 'help me buy',
      
      // After clarification - explicit opt-in
      'show me treats', 'suggest treats', 'show treats',
      'show me cakes', 'suggest cakes', 'show cakes',
      'show me carriers', 'suggest carriers', 'show carriers',
      'show me tools', 'suggest tools', 'show tools'
    ];
    
    // EXCLUDE these - these are intent declarations, not product requests
    // "I want to travel" ≠ "Show me travel products"
    // "Plan a birthday" ≠ "Show me birthday products"
    const intentDeclarations = [
      'travel to', 'traveling to', 'going to', 'trip to',
      'plan a', 'planning a', 'want to plan',
      'need help with', 'worried about'
    ];
    
    // If it's an intent declaration, don't show products
    if (intentDeclarations.some(phrase => lowerInput.includes(phrase))) {
      return false;
    }
    
    // Check if user is explicitly opting in for products
    return optInPhrases.some(phrase => lowerInput.includes(phrase));
  }, []);
  
  // Handle submit - NEW CANONICAL FLOW WITH STEP TRACKING
  const handleSubmit = useCallback(async (e, voiceQuery = null) => {
    if (e) e.preventDefault();
    
    const inputQuery = voiceQuery || query;
    if (!inputQuery.trim()) return;
    
    setIsProcessing(true);
    setQuery('');
    
    const userMessage = {
      type: 'user',
      content: inputQuery,
      timestamp: new Date()
    };
    setConversationHistory(prev => [...prev, userMessage]);
    
    try {
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
        // First message - route intent and create ticket
        const routeResponse = await fetch(`${API_URL}/api/mira/route_intent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` })
          },
          body: JSON.stringify({
            parent_id: user?.id || 'DEMO-PARENT',
            pet_id: pet.id,
            utterance: inputQuery,
            source_event: 'search',
            device: 'web',
            pet_context: {
              name: pet.name,
              breed: pet.breed,
              age_years: parseInt(pet.age) || 3,
              allergies: pet.sensitivities || [],
              notes: pet.traits || []
            }
          })
        });
        
        const intentData = await routeResponse.json();
        pillar = intentData.pillar;
        intent = intentData.intent_primary;
        lifeState = intentData.life_state;
        
        // STEP 2: Create/attach ticket
        const ticketResponse = await fetch(`${API_URL}/api/service_desk/attach_or_create_ticket`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` })
          },
          body: JSON.stringify({
            parent_id: user?.id || 'DEMO-PARENT',
            pet_id: pet.id,
            pillar: pillar,
            intent_primary: intent,
            intent_secondary: intentData.intent_secondary || [],
            life_state: lifeState,
            channel: 'Mira_OS',
            initial_message: {
              sender: 'parent',
              source: 'Mira_OS',
              text: inputQuery
            }
          })
        });
        
        const ticketData = await ticketResponse.json();
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
            favorites: pet.favorites
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
          current_step: currentStep?.step_id || null
        })
      });
      
      const data = await response.json();
      
      const miraResponseText = data.response?.message || "I'm here to help!";
      
      // Extract contextual quick replies based on Mira's question
      const quickReplies = extractQuickReplies(data);
      
      // Check if Mira's response has a new clarifying question (step_id)
      // If LLM didn't return step_id, detect it from the question content
      let miraStepId = data.response?.step_id;
      
      // Fallback: detect step_id from question patterns if not provided
      // This covers ALL canonical flows: Treats, Grooming, Birthday, Travel
      if (!miraStepId && miraResponseText.includes('?')) {
        const lowerText = miraResponseText.toLowerCase();
        
        // ═══════════════════════════════════════════════════════════════
        // TREATS / FOOD FLOW STEPS
        // ═══════════════════════════════════════════════════════════════
        if ((lowerText.includes('everyday') && lowerText.includes('special')) ||
            (lowerText.includes('light treats') && lowerText.includes('special-occasion')) ||
            (lowerText.includes('everyday light') && lowerText.includes('special'))) {
          miraStepId = 'TREATS_TYPE';
        } 
        else if ((lowerText.includes('suggest') && lowerText.includes('treats')) ||
                 (lowerText.includes('specific treats') && lowerText.includes('fit')) ||
                 lowerText.includes('would you like me to suggest')) {
          miraStepId = 'TREATS_SUGGEST_OR_ROUTINE';
        }
        else if (lowerText.includes('training') && (lowerText.includes('snack') || lowerText.includes('reward'))) {
          miraStepId = 'TREATS_PURPOSE';
        }
        
        // ═══════════════════════════════════════════════════════════════
        // GROOMING FLOW STEPS
        // ═══════════════════════════════════════════════════════════════
        else if ((lowerText.includes('simple trim') && lowerText.includes('full grooming')) ||
                 (lowerText.includes('trim') && lowerText.includes('bath')) ||
                 (lowerText.includes('tidy') && lowerText.includes('session'))) {
          miraStepId = 'GROOMING_MODE';
        }
        else if ((lowerText.includes('at home') && lowerText.includes('groomer')) ||
                 (lowerText.includes('home') && lowerText.includes('salon')) ||
                 lowerText.includes('try at home') || lowerText.includes('professional groomer')) {
          miraStepId = 'GROOMING_LOCATION';
        }
        else if ((lowerText.includes('area') && lowerText.includes('weekday')) ||
                 (lowerText.includes('location') && lowerText.includes('prefer')) ||
                 lowerText.includes('which area') || lowerText.includes('when would')) {
          miraStepId = 'GROOMING_SCHEDULE';
        }
        else if ((lowerText.includes('basic tools') && lowerText.includes('suggestions')) ||
                 (lowerText.includes('brush') && lowerText.includes('comb')) ||
                 lowerText.includes('minimal set') || lowerText.includes('what tools')) {
          miraStepId = 'GROOMING_TOOLS';
        }
        // Home grooming session structure
        else if ((lowerText.includes('step-by-step') && lowerText.includes('guide')) ||
                 (lowerText.includes('checklist') && lowerText.includes('grooming')) ||
                 (lowerText.includes('broken into') && lowerText.includes('brush'))) {
          miraStepId = 'GROOMING_HOME_GUIDE';
        }
        
        // ═══════════════════════════════════════════════════════════════
        // BIRTHDAY / CELEBRATE FLOW STEPS
        // ═══════════════════════════════════════════════════════════════
        else if ((lowerText.includes('active') && lowerText.includes('playful')) || 
                 (lowerText.includes('simpler') && lowerText.includes('cosy')) ||
                 (lowerText.includes('small') && lowerText.includes('celebration')) ||
                 (lowerText.includes('party') && lowerText.includes('others'))) {
          miraStepId = 'BIRTHDAY_SHAPE';
        } 
        else if ((lowerText.includes('food') && (lowerText.includes('play') || lowerText.includes('ritual'))) ||
                 (lowerText.includes('cake') && lowerText.includes('toy')) ||
                 (lowerText.includes('important') && lowerText.includes('year'))) {
          miraStepId = 'BIRTHDAY_FOCUS';
        } 
        else if ((lowerText.includes('dog cake') && lowerText.includes('smaller treats')) ||
                 (lowerText.includes('proper cake') || lowerText.includes('birthday cake')) ||
                 (lowerText.includes('centrepiece') && lowerText.includes('treat'))) {
          miraStepId = 'BIRTHDAY_FOOD_TYPE';
        }
        else if ((lowerText.includes('dogs') && lowerText.includes('humans')) ||
                 (lowerText.includes('pet-friendly') && lowerText.includes('venue')) ||
                 lowerText.includes('how many guests')) {
          miraStepId = 'BIRTHDAY_PARTY_DETAILS';
        }
        
        // ═══════════════════════════════════════════════════════════════
        // TRAVEL FLOW STEPS
        // ═══════════════════════════════════════════════════════════════
        else if ((lowerText.includes('car') && lowerText.includes('flight')) ||
                 (lowerText.includes('car') && lowerText.includes('train')) ||
                 (lowerText.includes('travel') && lowerText.includes('how'))) {
          miraStepId = 'TRAVEL_MODE';
        }
        else if ((lowerText.includes('where') && lowerText.includes('driving')) ||
                 (lowerText.includes('route') || lowerText.includes('destination')) ||
                 lowerText.includes('from and to')) {
          miraStepId = 'TRAVEL_ROUTE';
        }
        else if ((lowerText.includes('pet-friendly') && lowerText.includes('stay')) ||
                 (lowerText.includes('hotel') && lowerText.includes('homestay')) ||
                 lowerText.includes('where to stay')) {
          miraStepId = 'TRAVEL_STAY';
        }
        else if ((lowerText.includes('dates') && lowerText.includes('budget')) ||
                 (lowerText.includes('when') && lowerText.includes('flexible')) ||
                 lowerText.includes('dates in mind')) {
          miraStepId = 'TRAVEL_DATES';
        }
        else if ((lowerText.includes('pack') && lowerText.includes('trip')) ||
                 (lowerText.includes('checklist') && lowerText.includes('tools')) ||
                 lowerText.includes('what should i pack')) {
          miraStepId = 'TRAVEL_PACKING';
        }
        else if ((lowerText.includes('within india') && lowerText.includes('international')) ||
                 lowerText.includes('domestic') && lowerText.includes('international')) {
          miraStepId = 'TRAVEL_FLIGHT_TYPE';
        }
        else if ((lowerText.includes('boarding') && lowerText.includes('homestay')) ||
                 lowerText.includes('leave him') || lowerText.includes('pet sitter')) {
          miraStepId = 'TRAVEL_BOARDING';
        }
        
        // ═══════════════════════════════════════════════════════════════
        // GENERIC FALLBACK - If question detected but no specific pattern
        // ═══════════════════════════════════════════════════════════════
        if (!miraStepId && lowerText.includes('?')) {
          // Generate a unique step ID based on first few words of question
          const questionMatch = miraResponseText.match(/([^.!?]*\?)/);
          if (questionMatch) {
            const questionText = questionMatch[1].toLowerCase();
            const words = questionText.split(' ').slice(0, 4).join('_').replace(/[^a-z_]/g, '');
            miraStepId = `STEP_${words.toUpperCase()}`;
          }
        }
        
        if (miraStepId) {
          console.log('[STEP] Auto-detected step_id:', miraStepId);
        }
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
      
      // Determine if products should be shown
      const shouldShowProducts = canShowProducts && 
                                 data.response?.products?.length > 0;
      
      // Determine if concierge should be suggested
      // Show concierge strip if:
      // 1. Backend explicitly suggests it
      // 2. User mentioned "concierge" in their message
      // 3. Execution type is CONCIERGE
      const userWantsConcierge = query.toLowerCase().includes('concierge');
      const shouldSuggestConcierge = data.response?.suggest_concierge || 
                                      data.execution_type === 'CONCIERGE' ||
                                      userWantsConcierge;
      
      const miraMessage = {
        type: 'mira',
        content: miraResponseText,
        data: {
          ...data,
          response: {
            ...data.response,
            products: shouldShowProducts ? data.response?.products : [],
            suggest_concierge: shouldSuggestConcierge
          }
        },
        quickReplies: quickReplies,
        showProducts: shouldShowProducts,
        stepId: miraStepId,  // Track which step this message is for
        isClarifyingQuestion: isNewClarifyingQuestion,
        timestamp: new Date()
      };
      setConversationHistory(prev => [...prev, miraMessage]);
      
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
      
      // Update conversation stage
      if (conversationStage === 'initial') {
        setConversationStage('clarifying');
      }
      
    } catch (error) {
      console.error('Mira error:', error);
      const errorMessage = {
        type: 'mira',
        content: "I'll connect you with your pet Concierge® to help with this.",
        error: true,
        timestamp: new Date()
      };
      setConversationHistory(prev => [...prev, errorMessage]);
    }
    
    setIsProcessing(false);
  }, [query, token, user, pet, extractQuickReplies, currentTicket, syncToServiceDesk, 
      conversationStage, userHasOptedInForProducts, isProductOptIn, completedSteps, 
      stepHistory, currentStep, completeStep, isAskingForMoreInfo]);
  
  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  }, [handleSubmit]);
  
  // Handle Concierge® handoff - flip ticket status, don't create new ticket
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
  const handleQuickReply = useCallback((replyValue) => {
    setQuery(replyValue);
    setTimeout(() => {
      if (handleSubmitRef.current) {
        handleSubmitRef.current(null, replyValue);
      }
    }, 50);
  }, []);
  
  // Voice recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      
      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        setIsListening(false);
        if (handleSubmitRef.current) {
          handleSubmitRef.current(null, transcript);
        }
      };
      
      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);
    }
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);
  
  const toggleVoice = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };
  
  // Handle dock click
  const handleDockClick = (item) => {
    setActiveDockItem(item.id);
    if (item.action === 'openChat') {
      window.dispatchEvent(new CustomEvent('openMiraAI'));
    } else if (item.action === 'openHelp') {
      setShowHelpModal(true);
    } else if (item.path) {
      navigate(item.tab ? `${item.path}?tab=${item.tab}` : item.path);
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
          
          {/* Right: Pet Badge - Orange */}
          <button 
            className="mp-pet-badge"
            onClick={() => setShowPetSelector(!showPetSelector)}
            data-testid="pet-selector-btn"
          >
            <div className="mp-pet-avatar">
              {pet.photo ? <img src={pet.photo} alt={pet.name} /> : <PawPrint />}
            </div>
            <span className="mp-pet-name">{pet.name}</span>
          </button>
          
          {/* Pet Dropdown */}
          {showPetSelector && (
            <div className="mp-pet-dropdown">
              {allPets.map((p) => (
                <button key={p.id} onClick={() => switchPet(p)} className={`mp-pet-option ${p.id === pet.id ? 'active' : ''}`}>
                  <div className="mp-pet-avatar">
                    {p.photo ? <img src={p.photo} alt={p.name} /> : <PawPrint />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{ display: 'block', color: 'white', fontWeight: 600, fontSize: 14 }}>{p.name}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
                      {p.breed}
                      {p.soulScore > 0 && (
                        <span style={{ 
                          background: 'linear-gradient(135deg, #f59e0b, #d97706)', 
                          padding: '2px 6px', 
                          borderRadius: '8px', 
                          fontSize: '10px',
                          fontWeight: '700',
                          color: 'white'
                        }}>
                          {p.soulScore}%
                        </span>
                      )}
                    </span>
                  </div>
                  {p.id === pet.id && <Check style={{ color: '#a855f7' }} />}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>
      
      {/* NAVIGATION DOCK - Horizontal Pills */}
      <nav className="mp-dock">
        <button onClick={() => inputRef.current?.focus()} className="mp-dock-btn" data-testid="dock-concierge">
          <MessageCircle /> <span>Concierge®</span>
        </button>
        <button onClick={() => navigate('/orders')} className="mp-dock-btn" data-testid="dock-orders">
          <Package /> <span>Orders</span>
        </button>
        <button onClick={() => navigate('/family-dashboard')} className="mp-dock-btn" data-testid="dock-plan">
          <Calendar /> <span>Plan</span>
        </button>
        <button onClick={() => setShowHelpModal(true)} className="mp-dock-btn" data-testid="dock-help">
          <HelpCircle /> <span>Help</span>
        </button>
        <button onClick={() => navigate('/pet-soul')} className="mp-dock-btn" data-testid="dock-soul">
          <Heart /> <span>Soul</span>
        </button>
      </nav>
      
      {/* TEST SCENARIOS PANEL - Dark Card (like production) */}
      {showTestScenarios && (
        <div className="mp-test-panel">
          <div className="mp-test-header">
            <span className="mp-test-title">
              <Sparkles /> Test Scenarios
            </span>
            <button className="mp-test-close" onClick={() => setShowTestScenarios(false)}>
              <X />
            </button>
          </div>
          <div className="mp-test-grid">
            {TEST_SCENARIOS.map((scenario) => (
              <button
                key={scenario.id}
                onClick={() => { setActiveScenario(scenario.id); handleQuickReply(scenario.query); }}
                data-testid={`scenario-${scenario.id}`}
                className={`mp-test-chip ${activeScenario === scenario.id ? 'active' : ''}`}
              >
                {scenario.label}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Past Chats Sidebar */}
      {showPastChats && (
        <div className="mp-past-chats">
          <div className="mp-past-chats-header">
            <h3 className="mp-past-chats-title">Past Chats</h3>
            <button onClick={() => setShowPastChats(false)} className="mp-past-chats-close">
              <X />
            </button>
          </div>
          
          <div className="mp-past-chats-list">
            {loadingPastChats ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>Loading...</div>
            ) : pastSessions.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>No past conversations</div>
            ) : (
              pastSessions.map((session) => (
                <button
                  key={session.session_id}
                  onClick={() => loadSession(session)}
                  className={`mp-session-btn ${session.session_id === sessionId ? 'active' : ''}`}
                  data-testid={`session-${session.session_id}`}
                >
                  <div className="mp-session-meta">
                    <PawPrint />
                    <span className="mp-session-pet">{session.pet_name}</span>
                    <span className="mp-session-date">{formatSessionDate(session.updated_at)}</span>
                  </div>
                  <p className="mp-session-preview">{session.preview || 'Empty conversation'}</p>
                </button>
              ))
            )}
          </div>
          
          <div className="mp-past-chats-footer">
            <button onClick={() => { startNewSession(); setShowPastChats(false); }} className="mp-concierge-btn">
              <Plus /> Start New Chat
            </button>
          </div>
        </div>
      )}

      {/* Main Chat Area - Apple iMessage Spacing */}
      <div 
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="mp-messages"
      >
        <div className="mp-messages-inner">
          {/* Welcome State - Premium "For Pet" Experience - Matches UnifiedHero from Pillar Pages */}
          {conversationHistory.length === 0 && !isProcessing && (
            <div className="mira-hero-welcome">
              {/* Soul Journey Button */}
              <button 
                className="soul-journey-btn" 
                onClick={() => navigate(`/pet-soul/${pet.id || ''}`)}
                data-testid="soul-journey-btn"
              >
                <Crown className="w-4 h-4" />
                <span>Start {pet.name}'s soul journey</span>
              </button>
              
              {/* Hero Layout - Avatar Left, Content Right */}
              <div className="hero-layout">
                {/* Pet Avatar with Multiple Animated Rings */}
                <div className="hero-avatar-container">
                  {/* Glow effect */}
                  <div className="avatar-glow"></div>
                  
                  {/* Multiple concentric rings */}
                  <div className="avatar-ring ring-1"></div>
                  <div className="avatar-ring ring-2"></div>
                  <div className="avatar-ring ring-3"></div>
                  
                  {/* Pet Photo */}
                  <div className="avatar-photo">
                    {pet.photo ? (
                      <img 
                        src={pet.photo} 
                        alt={pet.name}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `https://api.dicebear.com/7.x/lorelei/svg?seed=${pet.name}&backgroundColor=ffdfbf`;
                        }}
                      />
                    ) : (
                      <div className="avatar-placeholder">
                        <PawPrint className="w-12 h-12" />
                      </div>
                    )}
                  </div>
                  
                  {/* Soul Score Badge */}
                  <div className="soul-score-badge">
                    <span className="soul-percent">{pet.soulScore || 87}%</span>
                    <span className="soul-label">SOUL<br/>KNOWN</span>
                  </div>
                </div>
                
                {/* Content Side */}
                <div className="hero-content">
                  {/* Title */}
                  <h1 className="hero-title">
                    For <span className="gradient-text">{pet.name}</span>
                  </h1>
                  
                  {/* Subtitle */}
                  <p className="hero-subtitle">Curated with love for {pet.name}</p>
                  
                  {/* Soul Traits */}
                  <div className="soul-traits">
                    {(pet.soulTraits || [
                      { label: 'Glamorous soul', icon: '✨' },
                      { label: 'Elegant paws', icon: '🎀' },
                      { label: 'Devoted friend', icon: '💖' }
                    ]).map((trait, i) => (
                      <div key={i} className="trait-chip">
                        <span className="trait-icon">{trait.icon}</span>
                        <span className="trait-label">{trait.label}</span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Personalized Picks Card - "Mira knows" style */}
                  <div className="mira-love-card" onClick={() => handleQuickReply(`Show me personalized picks for ${pet.name}`)}>
                    <div className="love-card-icon">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div className="love-card-content">
                      <p className="love-card-title">
                        "💕 Personalized picks for {pet.name}"
                      </p>
                      <p className="love-card-subtitle">
                        <Heart className="w-3 h-3" /> Mira knows {pet.name}
                      </p>
                    </div>
                    <Sparkles className="love-card-sparkle" />
                  </div>
                </div>
              </div>
              
              {/* Quick Suggestion Chips */}
              <div className="quick-chips">
                {[
                  { text: `Treats for ${pet.name}`, icon: '🦴' },
                  { text: 'Grooming help', icon: '✂️' },
                  { text: 'Plan a birthday', icon: '🎂' },
                  { text: 'Travel tips', icon: '✈️' }
                ].map((s, i) => (
                  <button 
                    key={i} 
                    onClick={() => handleQuickReply(s.text)} 
                    className="quick-chip"
                    data-testid={`quick-chip-${i}`}
                  >
                    <span className="chip-icon">{s.icon}</span>
                    <span className="chip-text">{s.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Conversation Messages */}
          {conversationHistory.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {conversationHistory.map((msg, idx) => (
                <React.Fragment key={idx}>
                  {msg.type === 'user' ? (
                    /* User Message - Pale Lilac */
                    <div className="mp-msg-user">
                      <div className="mp-bubble-user">{msg.content}</div>
                    </div>
                  ) : msg.type === 'system' ? (
                    /* System Message */
                    <div style={{ textAlign: 'center', padding: '8px' }}>
                      <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.1)', padding: '4px 12px', borderRadius: '12px' }}>
                        {msg.content}
                      </span>
                    </div>
                  ) : (
                    /* Mira Message Card - Glass Panel */
                    <div className="mp-msg-mira">
                      <div className="mp-card">
                        {/* Card Header */}
                        <div className="mp-card-header">
                          <div className="mp-mira-avatar"><Sparkles /></div>
                          <span className="mp-mira-name">Mira</span>
                        </div>
                        
                        {/* Card Body */}
                        <div className="mp-card-body">
                          {/* Message Text */}
                          {(() => {
                            const { mainText, questionText } = splitMessageWithQuestion(msg.content);
                            return (
                              <>
                                {mainText && <p className="mp-card-text">{mainText}</p>}
                                {questionText && (
                                  <div className="mp-question">
                                    <p className="mp-question-text">{questionText}</p>
                                  </div>
                                )}
                              </>
                            );
                          })()}
                          
                          {/* Quick Reply Chips */}
                          {msg.quickReplies && msg.quickReplies.length > 0 && (
                            <div className="mp-chips">
                              {msg.quickReplies.map((chip, cIdx) => (
                                <button key={cIdx} onClick={() => handleQuickReply(chip.value)} className="mp-chip">
                                  {chip.text}
                                </button>
                              ))}
                            </div>
                          )}
                          
                          {/* Products - 2x2 GRID TILES */}
                          {msg.showProducts && msg.data?.response?.products?.length > 0 && (
                            <div className="mp-products">
                              <div className="mp-products-header">
                                <p className="mp-products-title">
                                  Recommended for <span className="pet-name">{pet.name}</span>
                                </p>
                              </div>
                              <div className="mp-products-grid">
                                {msg.data.response.products.slice(0, 4).map((product, pIdx) => (
                                  <div key={pIdx} className="mp-product-tile">
                                    <img 
                                      src={product.image || `https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop`} 
                                      alt={product.name} 
                                      className="mp-product-img" 
                                    />
                                    <div className="mp-product-content">
                                      <p className="mp-product-name">{product.name || product.suggestion}</p>
                                      {product.price && <p className="mp-product-price">₹{product.price}</p>}
                                      
                                      {/* Why for {Pet} - Personalized Reason */}
                                      <div className="mp-why-for-pet">
                                        <span className="mp-why-icon">💡</span>
                                        <span className="mp-why-text">
                                          {product.why_for_pet || generateWhyForPet(product, pet)}
                                        </span>
                                      </div>
                                      
                                      <button 
                                        className="mp-product-add"
                                        onClick={() => alert(`Added ${product.name} to cart!`)}
                                        data-testid={`add-product-${pIdx}`}
                                      >
                                        <ShoppingBag /> Add
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Important to Watch For - Collapsible */}
                          {msg.data?.response?.tips && msg.data.response.tips.length > 0 && (
                            <div className="mp-watchfor">
                              <button 
                                className="mp-watchfor-toggle"
                                onClick={() => setCollapsedSections(prev => ({
                                  ...prev,
                                  [`tips-${idx}`]: prev[`tips-${idx}`] === false ? true : false
                                }))}
                              >
                                <span className="mp-watchfor-label">
                                  <AlertCircle /> Important to Watch For
                                </span>
                                <ChevronUp style={{ 
                                  color: 'rgba(255,255,255,0.4)', 
                                  transform: collapsedSections[`tips-${idx}`] !== false ? 'rotate(0)' : 'rotate(180deg)',
                                  transition: 'transform 0.2s'
                                }} />
                              </button>
                              {collapsedSections[`tips-${idx}`] !== false && (
                                <div className="mp-watchfor-content">
                                  <ul className="mp-watchfor-list">
                                    {msg.data.response.tips.map((tip, tIdx) => (
                                      <li key={tIdx}>{tip}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Concierge Strip - ALWAYS SHOW */}
                          <div className="mp-concierge-strip">
                            <div className="mp-concierge-icon"><Bot /></div>
                            <div className="mp-concierge-content">
                              <p className="mp-concierge-text">
                                Your pet Concierge® can help find options that match {pet.name}'s needs.
                              </p>
                              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                <a 
                                  href={`https://wa.me/919663185747?text=${encodeURIComponent(`Hi, I need help with ${pet.name} (${pet.breed}). ${msg.content?.slice(0, 100)}...`)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="mp-concierge-btn"
                                  style={{ background: '#25D366', textDecoration: 'none' }}
                                >
                                  <Phone style={{ width: 14, height: 14 }} /> WhatsApp
                                </a>
                                <button onClick={handleConciergeHandoff} className="mp-concierge-btn">
                                  <MessageSquare /> Chat
                                </button>
                                <a 
                                  href={`mailto:concierge@thedoggycompany.in?subject=Help with ${pet.name}&body=${encodeURIComponent(`Hi, I need help with ${pet.name}.\n\nContext: ${msg.content?.slice(0, 200)}...`)}`}
                                  className="mp-concierge-btn"
                                  style={{ background: 'rgba(139, 92, 246, 0.3)', textDecoration: 'none' }}
                                >
                                  <Mail style={{ width: 14, height: 14 }} /> Email
                                </a>
                              </div>
                            </div>
                          </div>
                          
                          {/* Feedback Row */}
                          {!msg.isClarifyingQuestion && msg.data?.execution_type !== 'HOLD' && (
                            <div className="mp-feedback">
                              <span className="mp-feedback-label">Was this helpful?</span>
                              <div className="mp-feedback-btns">
                                {msg.feedbackGiven ? (
                                  <span className={`mp-feedback-btn ${msg.feedbackGiven}`} style={{
                                    background: msg.feedbackGiven === 'positive' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'
                                  }}>
                                    {msg.feedbackGiven === 'positive' ? <ThumbsUp /> : <ThumbsDown />}
                                  </span>
                                ) : (
                                  <>
                                    <button onClick={() => handleFeedback(idx, true)} className="mp-feedback-btn" data-testid={`feedback-up-${idx}`}>
                                      <ThumbsUp />
                                    </button>
                                    <button onClick={() => handleFeedback(idx, false)} className="mp-feedback-btn" data-testid={`feedback-down-${idx}`}>
                                      <ThumbsDown />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              ))}
              
              {/* Loading Indicator */}
              {isProcessing && (
                <div className="mp-msg-mira">
                  <div className="mp-loading">
                    <div className="mp-mira-avatar"><Sparkles /></div>
                    <div className="mp-loading-dots">
                      <div className="mp-loading-dot"></div>
                      <div className="mp-loading-dot"></div>
                      <div className="mp-loading-dot"></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>
      
      {/* Scroll to Bottom Button */}
      {hasNewMessages && !isAtBottom && (
        <button onClick={() => scrollToBottom()} style={{
          position: 'fixed', bottom: '120px', left: '50%', transform: 'translateX(-50%)',
          padding: '8px 16px', background: 'rgba(168, 85, 247, 0.9)', border: 'none',
          borderRadius: '20px', boxShadow: '0 4px 20px rgba(168, 85, 247, 0.3)',
          fontSize: '13px', fontWeight: '500', cursor: 'pointer', zIndex: 100,
          display: 'flex', alignItems: 'center', gap: '6px', color: 'white'
        }}>
          <ChevronDown /> New messages
        </button>
      )}
      
      {/* Input Composer - Premium */}
      <div className="mp-composer">
        <div className="mp-composer-inner">
          <form onSubmit={handleSubmit} className="mp-input-row">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Type your reply to Mira...`}
              className="mp-input"
              disabled={isProcessing}
              data-testid="mira-input"
            />
            <button
              type="button"
              onClick={toggleVoice}
              className={`mp-btn-mic ${isListening ? 'recording' : ''}`}
              data-testid="mic-btn"
            >
              {isListening ? <MicOff /> : <Mic />}
            </button>
            <button
              type="submit"
              disabled={isProcessing || !query.trim()}
              className="mp-btn-send"
              data-testid="send-btn"
            >
              <Send />
            </button>
          </form>
        </div>
      </div>
      
      {/* Sandbox Footer */}
      <div className="mp-sandbox-footer">
        🧪 Sandbox Mode — Mira OS 10/10 Premium Experience
      </div>
      
      {/* Help Modal */}
      {showHelpModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }} onClick={() => setShowHelpModal(false)}>
          <div style={{
            background: 'white', borderRadius: '20px', maxWidth: '400px', width: '90%', overflow: 'hidden'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontWeight: 600, fontSize: 18 }}>How can we help?</h3>
              <button onClick={() => setShowHelpModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8 }}>
                <X />
              </button>
            </div>
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button onClick={() => { setShowHelpModal(false); handleQuickReply('I need help with my order'); }} style={{
                display: 'flex', alignItems: 'center', gap: '14px', padding: '14px',
                border: '1px solid #e5e7eb', borderRadius: '12px', background: 'white', cursor: 'pointer', textAlign: 'left'
              }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#ede9fe', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Package />
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 500, color: '#1f2937' }}>Order & Delivery</p>
                  <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>Track, modify or report issues</p>
                </div>
              </button>
              <button onClick={() => { setShowHelpModal(false); handleConciergeHandoff(); }} style={{
                display: 'flex', alignItems: 'center', gap: '14px', padding: '14px',
                border: '1px solid #e5e7eb', borderRadius: '12px', background: 'white', cursor: 'pointer', textAlign: 'left'
              }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#ede9fe', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MessageSquare />
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 500, color: '#1f2937' }}>Chat with Concierge®</p>
                  <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>Personal assistance</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MiraDemoPage;


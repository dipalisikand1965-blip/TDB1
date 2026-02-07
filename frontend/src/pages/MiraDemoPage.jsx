/**
 * MiraDemoPage.jsx
 * 
 * MIRA OS - The Pet Life Operating System
 * Premium Chat UI - Inspired by iMessage, WhatsApp, Slack, ChatGPT
 * 
 * CANONICAL CONVERSATIONAL FLOWS:
 * - Products shown ONLY after explicit opt-in (user asks for suggestions)
 * - Every conversation creates/attaches to a service desk ticket
 * - Real-time transcript logging to backend
 * - Concierge handoff flips ticket status, doesn't create new ticket
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Mic, MicOff, Send, MessageCircle, Package, Calendar, 
  HelpCircle, Heart, Sparkles, ChevronDown,
  ShoppingBag, PawPrint, Bot,
  ThumbsUp, ThumbsDown, X, Phone, Mail, MessageSquare
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../utils/api';

// Import the new premium CSS
import '../styles/mira-chat.css';

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

// Sample pet for demo
const DEMO_PET = {
  id: 'demo-pet',
  name: 'Buddy',
  breed: 'Golden Retriever',
  age: '3 years',
  traits: ['Playful', 'Friendly', 'Energetic'],
  sensitivities: ['Chicken allergy'],
  favorites: ['Tennis balls', 'Peanut butter treats']
};

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
  const [activeScenario, setActiveScenario] = useState(null);
  const [showScenarios, setShowScenarios] = useState(true);
  const [collapsedSections, setCollapsedSections] = useState({});
  const [currentTicket, setCurrentTicket] = useState(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  
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
    
    const message = miraData.response?.message || '';
    const intent = miraData.understanding?.intent || '';
    const messageLower = message.toLowerCase();
    
    // Only show chips if there's a question being asked
    if (!message.includes('?')) return [];
    
    const quickReplies = [];
    
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
    
    // "Suggest 3-5 treats" or "treat routine"
    if (messageLower.includes('suggest') && messageLower.includes('treat')) {
      return [
        { text: 'Suggest 3-5 treats', value: 'Suggest 3-5 treats that fit.' },
        { text: 'Help with a treat routine', value: 'Help me with a treat routine.' },
        { text: 'Something else', value: 'Something else.' }
      ];
    }
    
    // === TRAVEL FLOWS ===
    // "Are you planning to travel by car, flight, or train?"
    if (messageLower.includes('car') && (messageLower.includes('flight') || messageLower.includes('train'))) {
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
        { text: 'I know I want a cake too', value: 'I know I want a cake too.' }
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
  // This should only return true AFTER initial clarifying questions
  // Covers ALL flows: Treats, Grooming tools, Birthday cakes, Travel gear
  const isProductOptIn = useCallback((inputQuery) => {
    const lowerInput = inputQuery.toLowerCase();
    
    // Explicit product request phrases that happen AFTER clarifying
    const optInPhrases = [
      // General suggest phrases
      'suggest a few', 'suggest some', 'suggest 3', 'suggest 5',
      'help me pick', 'help me choose', 'show me options',
      'what should i buy', 'what products', 'yes please',
      'both please', 'both, please', 'all of it',
      
      // Treats specific
      'suggest treats', 'suggest a few treats', 'show me treats',
      'what treats', 'recommend treats',
      
      // Grooming specific  
      'suggest tools', 'suggest a minimal set', 'what tools',
      'suggest products', 'grooming tools', 'need tools',
      
      // Birthday specific
      'suggest cakes', 'show me cakes', 'cake options',
      'suggest toys', 'birthday treats', 'party supplies',
      
      // Travel specific
      'checklist + travel tools', 'checklist and tools',
      'travel tools', 'packing list', 'what to pack',
      'suggest travel', 'travel gear'
    ];
    
    // Only count as opt-in if it's a clear product request
    // NOT on initial queries like "show me treats for Buddy"
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
      
      // Count conversation turns to track when products can be shown
      // Products should ONLY appear after at least 2 user turns (initial + answer to clarifier)
      const userMessageCount = conversationHistory.filter(m => m.type === 'user').length + 1;
      const canShowProducts = userMessageCount >= 2 && userHasOptedInForProducts;
      
      // Check if user is opting in for products (only valid after first clarifier)
      const isOptingIn = userMessageCount >= 2 && isProductOptIn(inputQuery);
      if (isOptingIn && !userHasOptedInForProducts) {
        setUserHasOptedInForProducts(true);
        setConversationStage('opted_in_products');
        console.log('[FLOW] User opted in for products (turn:', userMessageCount, ')');
      }
      
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
          // Tell backend whether to include products - ONLY after opt-in
          include_products: canShowProducts || isOptingIn,
          pillar: pillar,
          conversation_stage: conversationStage,
          ticket_id: ticketId,
          // ANTI-LOOP: Pass completed steps so LLM knows what's already been asked
          completed_steps: completedSteps,
          step_history: stepHistory.map(s => ({ step_id: s.step_id, answer: s.answer })),
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
      
      // Determine if products should be shown (ONLY after explicit opt-in, never on first message)
      const shouldShowProducts = (canShowProducts || isOptingIn) && 
                                 data.response?.products?.length > 0;
      
      const miraMessage = {
        type: 'mira',
        content: miraResponseText,
        data: shouldShowProducts ? data : { ...data, response: { ...data.response, products: [] } },
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
    <div className="mira-chat-container">
      {/* Header - Clean & Minimal */}
      <header className="mira-header">
        <div className="mira-header-inner">
          <div className="mira-header-left">
            <div className="mira-avatar mira-avatar-brand">
              <Sparkles />
            </div>
            <div>
              <h1 className="mira-header-title">Mira</h1>
              <p className="mira-header-subtitle">Your Pet Companion</p>
            </div>
          </div>
          <div className="mira-pet-badge">
            <div className="mira-avatar mira-avatar-pet mira-pet-badge-avatar">
              <PawPrint />
            </div>
            <span className="mira-pet-badge-name">{pet.name}</span>
          </div>
        </div>
        
        {/* Navigation Dock */}
        <nav className="mira-dock">
          {DOCK_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleDockClick(item)}
                data-testid={`dock-${item.id}`}
                className={`mira-dock-item ${activeDockItem === item.id ? 'active' : ''}`}
              >
                <Icon />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </header>

      {/* Messages Area */}
      <div 
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="mira-messages-container"
      >
        <div className="mira-messages-inner">
          {/* Test Scenarios */}
          {showScenarios && (
            <div className="mira-scenarios">
              <div className="mira-scenarios-header">
                <h3 className="mira-scenarios-title">
                  <Sparkles />
                  Test Scenarios
                </h3>
                <button 
                  onClick={() => setShowScenarios(false)}
                  className="mira-scenarios-close"
                  data-testid="close-scenarios"
                >
                  <X />
                </button>
              </div>
              <div className="mira-scenarios-grid">
                {TEST_SCENARIOS.map((scenario) => (
                  <button
                    key={scenario.id}
                    onClick={() => {
                      setActiveScenario(scenario.id);
                      handleQuickReply(scenario.query);
                    }}
                    data-testid={`scenario-${scenario.id}`}
                    className={`mira-scenario-chip ${activeScenario === scenario.id ? 'active' : ''}`}
                  >
                    {scenario.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Welcome State */}
          {conversationHistory.length === 0 && !isProcessing && (
            <div className="mira-welcome">
              <div className="mira-welcome-avatar">
                <Bot />
              </div>
              <h2 className="mira-welcome-title">Hi! I&apos;m Mira</h2>
              <p className="mira-welcome-subtitle">
                I&apos;m here to help with everything for {pet.name}. Just ask me anything!
              </p>
              <div className="mira-welcome-suggestions">
                {[`Treats for ${pet.name}`, `Grooming help`, `Food advice`].map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuickReply(s)}
                    className="mira-welcome-chip"
                    data-testid={`welcome-chip-${i}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Conversation */}
          {conversationHistory.length > 0 && (
            <div className="mira-messages-list">
              {conversationHistory.map((msg, idx) => (
                <React.Fragment key={idx}>
                  {msg.type === 'user' ? (
                    /* User Message */
                    <div className="mira-message-user">
                      <div className="mira-bubble-user">
                        <p>{msg.content}</p>
                      </div>
                    </div>
                  ) : msg.type === 'system' ? (
                    /* System Message */
                    <div className="mira-message-system">
                      <span className="mira-system-text">{msg.content}</span>
                    </div>
                  ) : (
                    /* Mira Message */
                    <div className="mira-message-mira">
                      <div className="mira-card">
                        {/* Card Header */}
                        <div className="mira-card-header">
                          <div className="mira-card-header-left">
                            <div className="mira-card-avatar">
                              <Sparkles />
                            </div>
                            <span className="mira-card-name">Mira</span>
                            {msg.data?.understanding?.intent && (
                              <span className="mira-intent-badge">
                                {msg.data.understanding.intent}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Card Body */}
                        <div className="mira-card-body">
                          {/* Split message to highlight question */}
                          {(() => {
                            const { mainText, questionText } = splitMessageWithQuestion(msg.content);
                            return (
                              <>
                                {mainText && (
                                  <p className="mira-card-text">{mainText}</p>
                                )}
                                {questionText && (
                                  <div className="mira-question-strip">
                                    <p className="mira-question-text">{questionText}</p>
                                  </div>
                                )}
                              </>
                            );
                          })()}
                          
                          {/* Quick Reply Chips */}
                          {msg.quickReplies && msg.quickReplies.length > 0 && (
                            <div className="mira-chips-container">
                              {msg.quickReplies.map((reply, replyIdx) => (
                                <button
                                  key={replyIdx}
                                  onClick={() => handleQuickReply(reply.value)}
                                  className="mira-chip mira-chip-amber"
                                  data-testid={`quick-reply-${replyIdx}`}
                                >
                                  {reply.text}
                                </button>
                              ))}
                            </div>
                          )}
                          
                          {/* Products - ONLY SHOWN WHEN USER HAS OPTED IN */}
                          {msg.showProducts && msg.data?.response?.products && msg.data.response.products.length > 0 && (
                            <div className="mira-products">
                              <p className="mira-products-title">
                                {msg.data.response.product_title || `Suggested for ${pet.name}`}
                                {pet.sensitivities?.length > 0 && (
                                  <span className="highlight"> ({pet.sensitivities.map(s => `${s}-free`).join(', ')})</span>
                                )}
                              </p>
                              
                              <div className="mira-products-scroll">
                                {msg.data.response.products.slice(0, 5).map((product, pIdx) => (
                                  <div key={pIdx} className="mira-product-card">
                                    {product.image && (
                                      <img 
                                        src={product.image} 
                                        alt={product.name}
                                        className="mira-product-image" 
                                      />
                                    )}
                                    <p className="mira-product-name">
                                      {product.name || product.suggestion}
                                    </p>
                                    {product.price && (
                                      <p className="mira-product-price">₹{product.price}</p>
                                    )}
                                    {product.reason && (
                                      <p className="mira-product-reason">"{product.reason}"</p>
                                    )}
                                    <button 
                                      className="mira-product-add"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        alert(`Added ${product.name || product.suggestion} to cart!`);
                                      }}
                                    >
                                      <ShoppingBag />
                                      Add
                                    </button>
                                  </div>
                                ))}
                              </div>
                              
                              {/* Concierge hint */}
                              <div className="mira-concierge-hint">
                                <button 
                                  onClick={handleConciergeHandoff}
                                  disabled={isProcessing}
                                  className="mira-concierge-link"
                                >
                                  Need help choosing? Ask your pet Concierge®
                                </button>
                              </div>
                            </div>
                          )}
                          
                          {/* Feedback - ONLY show when there's NO pending clarifying question */}
                          {!msg.data?.response?.hide_feedback && 
                           msg.data?.execution_type !== 'HOLD' && 
                           !msg.isClarifyingQuestion && (
                            <div className="mira-feedback">
                              <span style={{ fontSize: '12px', color: 'var(--mira-text-tertiary)' }}>
                                Was this helpful?
                              </span>
                              <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }}>
                                {msg.feedbackGiven ? (
                                  <span className={`mira-feedback-btn ${msg.feedbackGiven}`}>
                                    {msg.feedbackGiven === 'positive' ? <ThumbsUp /> : <ThumbsDown />}
                                  </span>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => handleFeedback(idx, true)}
                                      className="mira-feedback-btn"
                                      data-testid={`feedback-up-${idx}`}
                                    >
                                      <ThumbsUp />
                                    </button>
                                    <button
                                      onClick={() => handleFeedback(idx, false)}
                                      className="mira-feedback-btn"
                                      data-testid={`feedback-down-${idx}`}
                                    >
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
              
              {/* Processing Indicator */}
              {isProcessing && (
                <div className="mira-message-mira">
                  <div className="mira-loading">
                    <div className="mira-card-avatar">
                      <Sparkles />
                    </div>
                    <div className="mira-loading-dots">
                      <div className="mira-loading-dot"></div>
                      <div className="mira-loading-dot"></div>
                      <div className="mira-loading-dot"></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>
      
      {/* New Messages Indicator */}
      {hasNewMessages && !isAtBottom && (
        <button
          onClick={() => scrollToBottom()}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 px-4 py-2 bg-purple-500 
            rounded-full text-white text-xs font-medium shadow-lg z-40 active:scale-95"
        >
          New messages ↓
        </button>
      )}
      
      {/* Reply Composer - ALWAYS PINNED AT BOTTOM */}
      <div 
        className="flex-shrink-0 bg-black/40 backdrop-blur-xl border-t border-white/10"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="max-w-3xl mx-auto px-4 py-3">
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <div className="flex-1">
              <input
                ref={inputRef}
                type="text"
                inputMode="text"
                enterKeyHint="send"
                autoComplete="off"
                autoCorrect="off"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type your reply to Mira..."
                className="w-full bg-white/10 border border-white/20 rounded-xl 
                  px-4 py-3 text-white placeholder-white/40
                  focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                style={{ fontSize: '16px', WebkitAppearance: 'none' }}
                disabled={isProcessing}
              />
            </div>
            
            <button
              type="button"
              onClick={toggleVoice}
              className={`p-3 rounded-xl min-w-[48px] min-h-[48px] flex items-center justify-center
                active:scale-95 ${
                isListening 
                  ? 'bg-red-500 text-white animate-pulse' 
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
            
            <button
              type="submit"
              disabled={isProcessing || !query.trim()}
              className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white
                disabled:opacity-50 min-w-[48px] min-h-[48px] flex items-center justify-center
                active:scale-95"
            >
              {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </form>
          
          {isListening && (
            <p className="text-center text-purple-300 text-xs mt-2 animate-pulse">
              Listening... speak now
            </p>
          )}
        </div>
      </div>
      
      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-white/20 rounded-2xl max-w-sm w-full p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">How can we help?</h3>
              <button 
                onClick={() => setShowHelpModal(false)} 
                className="p-2 hover:bg-white/10 rounded-lg min-w-[40px] min-h-[40px] flex items-center justify-center"
              >
                <X className="w-5 h-5 text-white/70" />
              </button>
            </div>
            <div className="space-y-2">
              {[
                { icon: '📦', label: 'Order & Delivery Help', query: 'I need help with my order' },
                { icon: '🏥', label: 'Health & Advisory', query: 'I have a health concern about my pet' },
                { icon: '🔄', label: 'Returns & Exchanges', query: 'I need to return or exchange a product' },
              ].map((item, i) => (
                <button 
                  key={i}
                  onClick={() => { 
                    setShowHelpModal(false); 
                    handleQuickReply(item.query);
                  }}
                  className="w-full text-left p-3 bg-white/5 hover:bg-white/10 
                    rounded-xl text-white/80 min-h-[48px] active:scale-[0.98] text-sm"
                >
                  {item.icon} {item.label}
                </button>
              ))}
              <button 
                onClick={() => { 
                  setShowHelpModal(false); 
                  engageConcierge('HELP_REQUEST');
                }}
                className="w-full text-left p-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 
                  rounded-xl text-white border border-purple-400/30 min-h-[48px] active:scale-[0.98] text-sm"
              >
                💬 Chat with Concierge®
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MiraDemoPage;

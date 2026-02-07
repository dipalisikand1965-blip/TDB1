/**
 * MiraDemoPage.jsx
 * 
 * MIRA OS - The Pet Life Operating System
 * 
 * CANONICAL CONVERSATIONAL FLOWS:
 * - Products shown ONLY after explicit opt-in (user asks for suggestions)
 * - Every conversation creates/attaches to a service desk ticket
 * - Real-time transcript logging to backend
 * - Concierge handoff flips ticket status, doesn't create new ticket
 * 
 * Features:
 * - Persistent reply composer (ALWAYS at bottom)
 * - Quick reply chips directly under Mira's question
 * - Clarifying question highlighted in amber strip
 * - Products in compact carousel with "why for pet" lines
 * - Small Concierge® CTA (link-style, not huge banner)
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Mic, MicOff, Send, MessageCircle, Package, Calendar, 
  AlertCircle, Heart, Sparkles, ChevronRight, Loader2, User,
  ShoppingBag, Clock, Star, PawPrint, Crown, Bot, ArrowRight,
  ThumbsUp, ThumbsDown, X, ChevronDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../utils/api';

// Thin Dock Items
const DOCK_ITEMS = [
  { id: 'concierge', label: 'Concierge®', icon: MessageCircle, color: 'from-purple-500 to-pink-500', action: 'openChat' },
  { id: 'orders', label: 'Orders', icon: Package, color: 'from-blue-500 to-cyan-500', path: '/orders' },
  { id: 'plan', label: 'Plan', icon: Calendar, color: 'from-amber-500 to-orange-500', path: '/family-dashboard', tab: 'calendar' },
  { id: 'help', label: 'Help', icon: AlertCircle, color: 'from-red-500 to-rose-500', action: 'openHelp' },
  { id: 'soul', label: 'Soul', icon: Heart, color: 'from-pink-500 to-purple-500', path: '/pet-soul' },
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
    
    // === GENERIC QUESTION PATTERNS ===
    // "Would you like to...?" or "Would you prefer...?"
    if (messageLower.includes('would you like') || messageLower.includes('would you prefer')) {
      // Generic yes/no/more info
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
  const syncToServiceDesk = useCallback(async (ticketId, messages) => {
    if (!ticketId) return;
    
    try {
      await fetch(`${API_URL}/api/mira/tickets/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({
          ticket_id: ticketId,
          messages: messages.map(msg => ({
            sender: msg.type === 'user' ? 'parent' : msg.type,
            text: msg.content,
            timestamp: msg.timestamp?.toISOString() || new Date().toISOString(),
            source: 'Mira_OS'
          }))
        })
      });
      console.log('[SYNC] Transcript synced to ticket:', ticketId);
    } catch (error) {
      console.error('[SYNC] Failed to sync transcript:', error);
    }
  }, [token]);
  
  // Handle submit
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
          page_context: 'mira-demo'
        })
      });
      
      const data = await response.json();
      
      // Extract intent and pillar for ticket routing
      const intent = data.understanding?.intent || 'GENERAL';
      const pillar = data.understanding?.entities?.pillar || null;
      const miraResponseText = data.response?.message || "I'm here to help!";
      
      // Create/attach to service ticket with full conversation
      await createOrAttachTicket(inputQuery, intent, pillar, miraResponseText);
      
      // Extract contextual quick replies based on Mira's question
      const quickReplies = extractQuickReplies(data);
      
      const miraMessage = {
        type: 'mira',
        content: miraResponseText,
        data: data,
        quickReplies: quickReplies,
        timestamp: new Date()
      };
      setConversationHistory(prev => [...prev, miraMessage]);
      
      // Sync transcript to service desk in real-time
      if (currentTicket?.id) {
        await syncToServiceDesk(currentTicket.id, [userMessage, miraMessage]);
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
  }, [query, token, pet, createOrAttachTicket, extractQuickReplies, currentTicket, syncToServiceDesk]);
  
  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  }, [handleSubmit]);
  
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
    <div 
      className="flex flex-col bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"
      style={{
        height: '100dvh',
        maxHeight: '100dvh',
        overscrollBehavior: 'none'
      }}
    >
      {/* Header */}
      <header className="flex-shrink-0 bg-black/20 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-3xl mx-auto px-4 py-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-white font-bold text-base">Mira</h1>
                <p className="text-white/50 text-xs">Your Pet Companion</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <PawPrint className="w-3 h-3 text-white" />
              </div>
              <span className="text-white font-medium text-sm">{pet.name}</span>
            </div>
          </div>
        </div>
        
        {/* Mini Dock */}
        <div className="border-t border-white/5">
          <div className="max-w-3xl mx-auto px-4">
            <div className="flex items-center gap-1.5 py-2 overflow-x-auto scrollbar-hide">
              {DOCK_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleDockClick(item)}
                    data-testid={`dock-${item.id}`}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all
                      whitespace-nowrap text-xs font-medium min-h-[32px] active:scale-95 ${
                      activeDockItem === item.id
                        ? `bg-gradient-to-r ${item.color} text-white`
                        : 'bg-white/5 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <div 
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto"
        style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}
      >
        <div className="max-w-3xl mx-auto px-4 py-4">
          {/* Test Scenarios */}
          {showScenarios && (
            <div className="mb-4 bg-slate-800/50 border border-white/10 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Test Scenarios
                </h3>
                <button 
                  onClick={() => setShowScenarios(false)}
                  className="p-1.5 hover:bg-white/10 rounded-lg min-w-[32px] min-h-[32px] flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-white/50" />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {TEST_SCENARIOS.map((scenario) => (
                  <button
                    key={scenario.id}
                    onClick={() => {
                      setActiveScenario(scenario.id);
                      handleQuickReply(scenario.query);
                    }}
                    data-testid={`scenario-${scenario.id}`}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all min-h-[32px] active:scale-95 ${
                      activeScenario === scenario.id
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    {scenario.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Welcome State */}
          {conversationHistory.length === 0 && !isProcessing && (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 
                flex items-center justify-center shadow-xl">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Hi! I&apos;m Mira</h2>
              <p className="text-white/60 text-sm mb-6 max-w-xs mx-auto">
                I&apos;m here to help with everything for {pet.name}. Just ask me anything!
              </p>
              <div className="flex flex-wrap justify-center gap-2 max-w-md mx-auto">
                {[`Treats for ${pet.name}`, `Grooming help`, `Food advice`].map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuickReply(s)}
                    className="px-3 py-2 bg-white/10 border border-white/20 rounded-full
                      text-white/80 text-xs hover:bg-white/20 min-h-[36px] active:scale-95"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Conversation */}
          {conversationHistory.length > 0 && (
            <div className="space-y-4">
              {conversationHistory.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.type === 'user' ? (
                    <div className="max-w-[85%] bg-gradient-to-r from-purple-500 to-pink-500 
                      rounded-2xl rounded-br-sm px-4 py-3 shadow-lg">
                      <p className="text-white text-sm">{msg.content}</p>
                    </div>
                  ) : msg.type === 'system' ? (
                    <div className="w-full text-center py-2">
                      <span className="text-white/50 text-xs bg-white/5 px-3 py-1 rounded-full">
                        {msg.content}
                      </span>
                    </div>
                  ) : (
                    <div className="max-w-[90%] bg-white/10 backdrop-blur border border-white/20 
                      rounded-2xl rounded-bl-sm overflow-hidden">
                      {/* Mira header */}
                      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 
                            flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-white font-medium text-sm">Mira</span>
                          {msg.data?.understanding?.intent && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${getIntentColor(msg.data.understanding.intent)}`}>
                              {msg.data.understanding.intent}
                            </span>
                          )}
                        </div>
                        {msg.data?.execution_type && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            msg.data.execution_type === 'HOLD' || msg.data.execution_type === 'CONCIERGE'
                              ? 'bg-purple-500/30 text-purple-200' 
                              : 'bg-green-500/30 text-green-200'
                          }`}>
                            {msg.data.execution_type === 'INSTANT' ? '⚡ Instant' : '💜 With You'}
                          </span>
                        )}
                      </div>
                      
                      {/* Message content */}
                      <div className="px-4 py-3">
                        {/* Split message to highlight question */}
                        {(() => {
                          const { mainText, questionText } = splitMessageWithQuestion(msg.content);
                          return (
                            <>
                              {mainText && (
                                <p className="text-white/90 text-sm whitespace-pre-wrap leading-relaxed">
                                  {mainText}
                                </p>
                              )}
                              {questionText && (
                                <div className="mt-3 p-3 bg-gradient-to-r from-amber-500/20 to-orange-500/20 
                                  border border-amber-400/30 rounded-xl">
                                  <p className="text-amber-100 text-sm font-medium leading-relaxed">
                                    {questionText}
                                  </p>
                                </div>
                              )}
                            </>
                          );
                        })()}
                        
                        {/* Quick Reply Chips - directly under the highlighted question */}
                        {msg.quickReplies && msg.quickReplies.length > 0 && (
                          <div className="mt-3">
                            <div className="flex flex-wrap gap-2">
                              {msg.quickReplies.map((reply, replyIdx) => (
                                <button
                                  key={replyIdx}
                                  onClick={() => handleQuickReply(reply.value)}
                                  className="px-3 py-2 bg-amber-500/20 border border-amber-400/40 rounded-full
                                    text-amber-100 text-xs font-medium hover:bg-amber-500/30 
                                    min-h-[36px] active:scale-95 transition-all"
                                  data-testid={`quick-reply-${replyIdx}`}
                                >
                                  {reply.text}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Products */}
                        {msg.data?.response?.products && msg.data.response.products.length > 0 && (
                          <div className="mt-4 pt-3 border-t border-white/10">
                            <p className="text-white/50 text-xs mb-2">Recommended for {pet.name}:</p>
                            <div className="grid grid-cols-1 gap-2">
                              {msg.data.response.products.slice(0, 3).map((product, pIdx) => (
                                <div key={pIdx} className="flex items-center gap-3 p-2 bg-white/5 rounded-lg
                                  hover:bg-white/10 transition-all group cursor-pointer">
                                  {product.image && (
                                    <img src={product.image} alt={product.name}
                                      className="w-12 h-12 object-cover rounded-lg flex-shrink-0" />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-white text-xs font-medium truncate">
                                      {product.name || product.suggestion}
                                    </p>
                                    {product.price && <p className="text-purple-300 text-xs">₹{product.price}</p>}
                                  </div>
                                  <button 
                                    className="p-2 bg-purple-500/20 rounded-lg group-hover:bg-purple-500 
                                      min-w-[36px] min-h-[36px] flex items-center justify-center"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      alert(`Added ${product.name || product.suggestion} to cart!`);
                                    }}
                                  >
                                    <ShoppingBag className="w-4 h-4 text-purple-300 group-hover:text-white" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Collapsible Safety Tips */}
                        {msg.data?.response?.safety_tips && msg.data.response.safety_tips.length > 0 && (
                          <div className="mt-3">
                            <button
                              onClick={() => setCollapsedSections(prev => ({
                                ...prev, [`safety-${idx}`]: !prev[`safety-${idx}`]
                              }))}
                              className="w-full flex items-center justify-between p-2 bg-red-500/10 
                                border border-red-400/20 rounded-lg text-red-200 text-xs font-medium min-h-[36px]"
                            >
                              <span className="flex items-center gap-1.5">
                                <AlertCircle className="w-3.5 h-3.5" />
                                Important to Watch For
                              </span>
                              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${
                                !collapsedSections[`safety-${idx}`] ? 'rotate-180' : ''
                              }`} />
                            </button>
                            {!collapsedSections[`safety-${idx}`] && (
                              <ul className="mt-2 text-red-100/80 text-xs space-y-1 pl-4">
                                {msg.data.response.safety_tips.map((tip, tipIdx) => (
                                  <li key={tipIdx} className="list-disc ml-2">{tip}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )}
                        
                        {/* Concierge Option */}
                        {msg.data?.execution_type === 'CONCIERGE' && !msg.data?.response?.hide_concierge && (
                          <div className="mt-3 pt-3 border-t border-white/10">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center">
                                <User className="w-3.5 h-3.5 text-white/60" />
                              </div>
                              <p className="flex-1 text-white/50 text-xs">
                                {msg.data.response?.concierge_framing || "Your pet Concierge® can help."}
                              </p>
                            </div>
                            <button 
                              onClick={() => engageConcierge(msg.data?.understanding?.intent)}
                              className="w-full px-3 py-2 bg-white/10 hover:bg-white/20
                                text-white/80 rounded-lg text-xs font-medium min-h-[40px]
                                active:scale-[0.98] flex items-center justify-center gap-2"
                              data-testid="chat-concierge-btn"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              Have my Concierge® help
                            </button>
                          </div>
                        )}
                        
                        {/* Feedback */}
                        {!msg.data?.response?.hide_feedback && msg.data?.execution_type !== 'HOLD' && (
                          <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
                            <span className="text-white/40 text-xs">Was this helpful?</span>
                            <div className="flex items-center gap-1.5">
                              {msg.feedbackGiven ? (
                                <span className={`text-xs px-2.5 py-1 rounded-full ${
                                  msg.feedbackGiven === 'positive' 
                                    ? 'bg-green-500/20 text-green-300' 
                                    : 'bg-red-500/20 text-red-300'
                                }`}>
                                  {msg.feedbackGiven === 'positive' ? '👍 Thanks!' : '👎 Noted'}
                                </span>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleFeedback(idx, true)}
                                    className="p-2 bg-white/5 hover:bg-green-500/20 rounded-lg 
                                      min-w-[36px] min-h-[36px] flex items-center justify-center active:scale-95"
                                    data-testid={`feedback-up-${idx}`}
                                  >
                                    <ThumbsUp className="w-4 h-4 text-white/50 hover:text-green-400" />
                                  </button>
                                  <button
                                    onClick={() => handleFeedback(idx, false)}
                                    className="p-2 bg-white/5 hover:bg-red-500/20 rounded-lg 
                                      min-w-[36px] min-h-[36px] flex items-center justify-center active:scale-95"
                                    data-testid={`feedback-down-${idx}`}
                                  >
                                    <ThumbsDown className="w-4 h-4 text-white/50 hover:text-red-400" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {/* Processing Indicator */}
              {isProcessing && (
                <div className="flex justify-start">
                  <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 
                        flex items-center justify-center animate-pulse">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex items-center gap-2 text-white/70 text-sm">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Mira is thinking...</span>
                      </div>
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

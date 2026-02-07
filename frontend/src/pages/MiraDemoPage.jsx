/**
 * MiraDemoPage.jsx
 * 
 * SANDBOX PAGE - The Mira Operating System Experience
 * 
 * This is a standalone demo of the future Mira OS:
 * - Thin dock navigation (not full pillar nav)
 * - Universal search that routes to Mira
 * - Intent understanding display
 * - Instant execution for simple queries
 * - Concierge handoff for complex queries
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Mic, MicOff, Send, MessageCircle, Package, Calendar, 
  AlertCircle, Heart, Sparkles, ChevronRight, Loader2, User,
  ShoppingBag, Clock, Star, PawPrint, Crown, Bot, ArrowRight,
  ThumbsUp, ThumbsDown, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../utils/api';

// Thin Dock Items with navigation paths
const DOCK_ITEMS = [
  { id: 'concierge', label: 'Concierge®', icon: MessageCircle, color: 'from-purple-500 to-pink-500', path: '/concierge', action: 'openChat' },
  { id: 'orders', label: 'Orders', icon: Package, color: 'from-blue-500 to-cyan-500', path: '/orders' },
  { id: 'plan', label: 'Plan', icon: Calendar, color: 'from-amber-500 to-orange-500', path: '/family-dashboard', tab: 'calendar' },
  { id: 'help', label: 'Help', icon: AlertCircle, color: 'from-red-500 to-rose-500', action: 'openHelp' },
  { id: 'soul', label: 'Soul', icon: Heart, color: 'from-pink-500 to-purple-500', path: '/pet-soul' },
];

// Test Scenarios for Role-Playing Mira's responses
const TEST_SCENARIOS = [
  // === PRODUCT DISCOVERY ===
  { 
    id: 'treats', 
    label: '🦴 Treats', 
    query: "Show me some treats for Buddy",
    description: 'FOOD_TREAT - SHOULD show products'
  },
  { 
    id: 'birthday', 
    label: '🎂 Birthday', 
    query: "I want to plan Buddy's birthday",
    description: 'Tests emotional acknowledgment + alignment question'
  },
  // === FOOD & NUTRITION OS ===
  { 
    id: 'food', 
    label: '🍽️ Food', 
    query: "What food would be best for Buddy?",
    description: 'FOOD_MAIN - Ask questions first, NO products'
  },
  { 
    id: 'food-portion', 
    label: '⚖️ Portion', 
    query: "How much should I feed Buddy?",
    description: 'FOOD_PORTION - Guidance + vet referral, NO products'
  },
  { 
    id: 'food-schedule', 
    label: '🕐 Schedule', 
    query: "What's the best feeding schedule for Buddy?",
    description: 'FOOD_ROUTINE - Structure advice, NO products'
  },
  { 
    id: 'food-human', 
    label: '🍎 Can Eat?', 
    query: "Can Buddy eat apples?",
    description: 'FOOD_RULES - Safety guidance only, NO products'
  },
  { 
    id: 'food-weight', 
    label: '📈 Weight', 
    query: "I think Buddy is putting on weight",
    description: 'FOOD_WEIGHT - VET coordination, NO products'
  },
  { 
    id: 'food-picky', 
    label: '😒 Picky', 
    query: "Buddy is a very picky eater, what can I do?",
    description: 'FOOD_PREFERENCE - Behaviour vs medical'
  },
  { 
    id: 'food-vomit', 
    label: '🤢 Vomiting', 
    query: "Buddy has been vomiting after eating",
    description: 'FOOD_HEALTH_ADJACENT - VET IMMEDIATELY'
  },
  // === GROOMING OS SCENARIOS ===
  { 
    id: 'grooming', 
    label: '✂️ Haircut', 
    query: "Buddy needs a haircut, can you help?",
    description: 'GROOM_PLAN - NO products, alignment question'
  },
  { 
    id: 'groom-bath', 
    label: '🛁 Bath', 
    query: "Buddy smells and really needs a bath, can you help?",
    description: 'GROOM_PLAN - Home vs groomer question'
  },
  { 
    id: 'groom-tools', 
    label: '🧴 Tools', 
    query: "What shampoo should I use for Buddy?",
    description: 'GROOM_TOOLS - MAY show grooming products'
  },
  { 
    id: 'groom-accident', 
    label: '🩹 Accident', 
    query: "I accidentally cut Buddy's nail too short and it's bleeding",
    description: 'GROOM_ACCIDENT - VET IMMEDIATELY, NO products'
  },
  { 
    id: 'groom-book', 
    label: '📅 Book', 
    query: "Book me a groomer for Buddy",
    description: 'GROOM_BOOKING - Concierge® orchestration'
  },
  // === SERVICE / PLANNING ===
  { 
    id: 'travel', 
    label: '✈️ Travel', 
    query: "We're planning a trip with Buddy next month",
    description: 'Tests clarifying questions - NO products until asked'
  },
  // === EMOTIONAL / SENSITIVE ===
  { 
    id: 'health', 
    label: '🏥 Health', 
    query: "I'm worried, Buddy has been coughing a lot lately",
    description: 'Tests presence + boundary + vet guidance'
  },
  { 
    id: 'anxious', 
    label: '😰 Anxiety', 
    query: "Buddy seems anxious during thunderstorms, what can I do?",
    description: 'Tests tips first, products only if asked'
  },
  { 
    id: 'memorial', 
    label: '🌈 Farewell', 
    query: "I lost my dog last week and I'm not ready to talk about it yet",
    description: 'Tests HOLD state - NO actions, NO feedback, just presence'
  },
  // === EDGE CASES ===
  { 
    id: 'compare', 
    label: '⚖️ Compare', 
    query: "What's the difference between grain-free and regular food?",
    description: 'Tests informational query handling'
  },
  { 
    id: 'boarding', 
    label: '🏠 Boarding', 
    query: "I need someone to watch Buddy while I'm away next week",
    description: 'Tests service intent - NO products, Concierge® help'
  },
  { 
    id: 'training', 
    label: '🎓 Training', 
    query: "Buddy pulls on the leash a lot, any training tips?",
    description: 'Tests advisory + potential trainer referral'
  },
];

// Sample pet for demo (when not logged in)
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
  const [miraResponse, setMiraResponse] = useState(null);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [activeDockItem, setActiveDockItem] = useState(null);
  const [pet, setPet] = useState(DEMO_PET);
  const [activeScenario, setActiveScenario] = useState(null);
  const [showScenarios, setShowScenarios] = useState(true);
  
  // Refs
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const handleSubmitRef = useRef(null);
  
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
  
  // handleSubmit function - defined before voice recognition useEffect
  const handleSubmit = useCallback(async (e, voiceQuery = null) => {
    if (e) e.preventDefault();
    
    const inputQuery = voiceQuery || query;
    if (!inputQuery.trim()) return;
    
    setIsProcessing(true);
    setMiraResponse(null);
    
    // Add to conversation
    const userMessage = {
      type: 'user',
      content: inputQuery,
      timestamp: new Date()
    };
    setConversationHistory(prev => [...prev, userMessage]);
    
    try {
      // Use the enhanced endpoint with real products
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
      setMiraResponse(data);
      
      // Add Mira's response to conversation
      const miraMessage = {
        type: 'mira',
        content: data.response?.message || "I'm here to help!",
        data: data,
        timestamp: new Date()
      };
      setConversationHistory(prev => [...prev, miraMessage]);
      
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
    setQuery('');
  }, [query, token, pet]);
  
  // Keep ref updated with latest handleSubmit
  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  }, [handleSubmit]);
  
  // Voice recognition setup
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
        // Auto-submit voice query using ref to get latest function
        if (handleSubmitRef.current) {
          handleSubmitRef.current(null, transcript);
        }
      };
      
      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);
  
  const toggleVoice = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };
  
  // Handle dock item clicks - navigate or trigger actions
  const handleDockClick = (item) => {
    setActiveDockItem(item.id);
    
    if (item.action === 'openChat') {
      // Open Mira chat widget
      window.dispatchEvent(new CustomEvent('openMiraAI'));
    } else if (item.action === 'openHelp') {
      // Show help modal
      setShowHelpModal(true);
    } else if (item.path) {
      // Navigate to the path
      if (item.tab) {
        navigate(`${item.path}?tab=${item.tab}`);
      } else if (item.id === 'soul' && pet.id && pet.id !== 'demo-pet') {
        navigate(`/pet-soul/${pet.id}`);
      } else {
        navigate(item.path);
      }
    }
  };
  
  // Handle feedback on Mira responses
  const handleFeedback = async (messageIndex, isPositive) => {
    const message = conversationHistory[messageIndex];
    if (!message || message.type !== 'mira') return;
    
    try {
      await fetch(`${API_URL}/api/mira/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({
          query: conversationHistory[messageIndex - 1]?.content || '',
          response: message.content,
          is_positive: isPositive,
          intent: message.data?.understanding?.intent,
          execution_type: message.data?.execution_type,
          pet_id: pet.id,
          timestamp: new Date().toISOString()
        })
      });
      
      // Update UI to show feedback was recorded
      setConversationHistory(prev => prev.map((msg, idx) => 
        idx === messageIndex ? { ...msg, feedbackGiven: isPositive ? 'positive' : 'negative' } : msg
      ));
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };
  
  const getIntentColor = (intent) => {
    const colors = {
      'FIND': 'bg-blue-100 text-blue-700',
      'PLAN': 'bg-amber-100 text-amber-700',
      'COMPARE': 'bg-purple-100 text-purple-700',
      'REMEMBER': 'bg-pink-100 text-pink-700',
      'ORDER': 'bg-green-100 text-green-700',
      'EXPLORE': 'bg-cyan-100 text-cyan-700'
    };
    return colors[intent] || 'bg-gray-100 text-gray-700';
  };
  
  const getExecutionColor = (type) => {
    return type === 'INSTANT' 
      ? 'bg-green-100 text-green-700 border-green-200'
      : 'bg-amber-100 text-amber-700 border-amber-200';
  };
  
  return (
    <div 
      className="flex flex-col bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"
      style={{
        minHeight: '100dvh',
        minHeight: '100svh', /* fallback */
        overscrollBehavior: 'none',
        touchAction: 'pan-y',
        WebkitTapHighlightColor: 'transparent'
      }}
    >
      {/* Header - flex-shrink-0 */}
      <header className="flex-shrink-0 bg-black/20 backdrop-blur-lg border-b border-white/10 safe-area-top">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-white font-bold text-lg">Mira OS</h1>
                <p className="text-white/60 text-xs">Pet Life Operating System</p>
              </div>
            </div>
            
            {/* Pet Badge */}
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur rounded-full px-3 sm:px-4 py-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <PawPrint className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
              </div>
              <span className="text-white font-medium text-sm sm:text-base">{pet.name}</span>
              <span className="text-white/50 text-xs sm:text-sm hidden sm:inline">• {pet.breed}</span>
            </div>
          </div>
        </div>
      </header>
      
      {/* Thin Dock - flex-shrink-0 */}
      <div className="flex-shrink-0 bg-black/30 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4">
          {/* Universal Search Bar */}
          <form onSubmit={handleSubmit} className="py-3 sm:py-4">
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <Search className="w-5 h-5 text-white/50" />
              </div>
              <input
                ref={inputRef}
                type="text"
                inputMode="search"
                enterKeyHint="search"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onTouchStart={(e) => e.currentTarget.focus()}
                onPointerDown={(e) => e.currentTarget.focus()}
                placeholder={`Ask Mira anything for ${pet.name}...`}
                className="w-full bg-white/10 backdrop-blur border border-white/20 rounded-2xl 
                  pl-12 pr-28 py-3.5 sm:py-4 text-white placeholder-white/40
                  focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50
                  transition-all appearance-none"
                style={{
                  WebkitAppearance: 'none',
                  MozAppearance: 'none',
                  appearance: 'none',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  fontSize: '16px', /* Prevents iOS zoom */
                  lineHeight: '1.5'
                }}
                disabled={isProcessing}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={toggleVoice}
                  onPointerDown={(e) => e.stopPropagation()}
                  style={{ 
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                    userSelect: 'none'
                  }}
                  className={`p-2.5 sm:p-3 rounded-full transition-all min-w-[44px] min-h-[44px] flex items-center justify-center
                    active:scale-95 select-none ${
                    isListening 
                      ? 'bg-red-500 text-white animate-pulse' 
                      : 'bg-white/10 text-white/70 hover:bg-white/20 active:bg-white/30'
                  }`}
                >
                  {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
                <button
                  type="submit"
                  disabled={isProcessing || !query.trim()}
                  onPointerDown={(e) => e.stopPropagation()}
                  style={{ 
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                    userSelect: 'none'
                  }}
                  className="p-2.5 sm:p-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white
                    disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-purple-500/25
                    transition-all min-w-[44px] min-h-[44px] flex items-center justify-center
                    active:scale-95 select-none"
                >
                  {isProcessing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
            {isListening && (
              <p className="text-center text-purple-300 text-sm mt-2 animate-pulse">
                Listening... speak now
              </p>
            )}
          </form>
          
          {/* Dock Navigation - Scrollable on mobile */}
          <div className="flex items-center gap-2 pb-3 overflow-x-auto scrollbar-hide"
            style={{
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
          >
            <div className="flex items-center gap-2 mx-auto">
            {DOCK_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleDockClick(item)}
                  onPointerDown={(e) => e.stopPropagation()}
                  data-testid={`dock-${item.id}`}
                  style={{ 
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                    userSelect: 'none'
                  }}
                  className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 rounded-xl transition-all
                    min-h-[44px] whitespace-nowrap select-none active:scale-95 ${
                    activeDockItem === item.id
                      ? `bg-gradient-to-r ${item.color} text-white shadow-lg`
                      : 'bg-white/5 text-white/70 hover:bg-white/10 active:bg-white/20'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              );
            })}
            </div>
          </div>
        </div>
      </div>
      
      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          style={{ touchAction: 'none' }}
        >
          <div className="bg-slate-800 border border-white/20 rounded-2xl max-w-md w-full p-5 sm:p-6 mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg sm:text-xl font-bold text-white">How can we help?</h3>
              <button 
                onClick={() => setShowHelpModal(false)} 
                style={{ touchAction: 'manipulation', userSelect: 'none' }}
                className="p-2 hover:bg-white/10 active:bg-white/20 rounded-lg min-w-[44px] min-h-[44px]
                  flex items-center justify-center active:scale-95"
              >
                <X className="w-5 h-5 text-white/70" />
              </button>
            </div>
            <div className="space-y-2 sm:space-y-3">
              <button 
                onClick={() => { setShowHelpModal(false); setQuery('I need help with my order'); inputRef.current?.focus(); }}
                style={{ touchAction: 'manipulation', userSelect: 'none' }}
                className="w-full text-left p-3 sm:p-4 bg-white/5 hover:bg-white/10 active:bg-white/20 
                  rounded-xl text-white/80 transition-all min-h-[48px] active:scale-[0.98]"
              >
                📦 Order & Delivery Help
              </button>
              <button 
                onClick={() => { setShowHelpModal(false); setQuery('I have a health concern about my pet'); inputRef.current?.focus(); }}
                style={{ touchAction: 'manipulation', userSelect: 'none' }}
                className="w-full text-left p-3 sm:p-4 bg-white/5 hover:bg-white/10 active:bg-white/20 
                  rounded-xl text-white/80 transition-all min-h-[48px] active:scale-[0.98]"
              >
                🏥 Health & Advisory
              </button>
              <button 
                onClick={() => { setShowHelpModal(false); setQuery('I need to return or exchange a product'); inputRef.current?.focus(); }}
                style={{ touchAction: 'manipulation', userSelect: 'none' }}
                className="w-full text-left p-3 sm:p-4 bg-white/5 hover:bg-white/10 active:bg-white/20 
                  rounded-xl text-white/80 transition-all min-h-[48px] active:scale-[0.98]"
              >
                🔄 Returns & Exchanges
              </button>
              <button 
                onClick={() => { setShowHelpModal(false); window.dispatchEvent(new CustomEvent('openMiraAI')); }}
                style={{ touchAction: 'manipulation', userSelect: 'none' }}
                className="w-full text-left p-3 sm:p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 
                  hover:from-purple-500/30 hover:to-pink-500/30 active:from-purple-500/40 active:to-pink-500/40
                  rounded-xl text-white transition-all border border-purple-400/30 min-h-[48px] active:scale-[0.98]"
              >
                💬 Chat with Concierge
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Main Content - flex:1 with overflow-auto */}
      <main 
        className="flex-1 overflow-y-auto"
        style={{
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
          paddingBottom: 'calc(60px + env(safe-area-inset-bottom, 0px))'
        }}
      >
        <div className="max-w-6xl mx-auto px-4 py-4 sm:py-8">
        {/* Test Scenarios Panel */}
        {showScenarios && (
          <div className="mb-4 sm:mb-8 bg-slate-800/50 backdrop-blur border border-white/10 rounded-2xl p-3 sm:p-4">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                  Test Scenarios
                </h3>
                <p className="text-white/50 text-xs sm:text-sm">Role-play different situations to refine Mira&apos;s tone</p>
              </div>
              <button 
                onClick={() => setShowScenarios(false)}
                style={{ touchAction: 'manipulation', userSelect: 'none' }}
                className="p-2 hover:bg-white/10 active:bg-white/20 rounded-lg transition-all min-w-[44px] min-h-[44px]
                  flex items-center justify-center active:scale-95"
              >
                <X className="w-4 h-4 text-white/50" />
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {TEST_SCENARIOS.map((scenario) => (
                <button
                  key={scenario.id}
                  onClick={() => {
                    setActiveScenario(scenario.id);
                    setQuery(scenario.query);
                    // Auto-submit after a brief delay
                    setTimeout(() => {
                      if (handleSubmitRef.current) {
                        handleSubmitRef.current(null, scenario.query);
                      }
                    }, 100);
                  }}
                  data-testid={`scenario-${scenario.id}`}
                  style={{ 
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                    userSelect: 'none'
                  }}
                  className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all
                    min-h-[40px] sm:min-h-[44px] active:scale-95 select-none ${
                    activeScenario === scenario.id
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                      : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white active:bg-white/30'
                  }`}
                  title={scenario.description}
                >
                  {scenario.label}
                </button>
              ))}
            </div>
            {activeScenario && (
              <p className="mt-2 sm:mt-3 text-xs text-white/40 italic">
                Testing: {TEST_SCENARIOS.find(s => s.id === activeScenario)?.description}
              </p>
            )}
          </div>
        )}
        
        {/* Show Scenarios Toggle (when hidden) */}
        {!showScenarios && (
          <button
            onClick={() => setShowScenarios(true)}
            style={{ touchAction: 'manipulation', userSelect: 'none' }}
            className="mb-4 px-4 py-2.5 bg-white/5 hover:bg-white/10 active:bg-white/20 rounded-xl 
              text-white/50 text-sm transition-all min-h-[44px] active:scale-95 select-none"
          >
            <Sparkles className="w-4 h-4 inline mr-2" />
            Show Test Scenarios
          </button>
        )}
        
        {/* Welcome State (no conversation yet) */}
        {conversationHistory.length === 0 && !isProcessing && (
          <div className="text-center py-8 sm:py-16">
            <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 
              flex items-center justify-center shadow-2xl shadow-purple-500/30">
              <Bot className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 sm:mb-3">
              Hi! I&apos;m Mira
            </h2>
            <p className="text-white/60 text-base sm:text-lg mb-6 sm:mb-8 max-w-md mx-auto px-4">
              I&apos;m here to help with everything for {pet.name}. Just ask me anything!
            </p>
            
            {/* Suggestion Chips */}
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 max-w-2xl mx-auto px-2">
              {[
                `Soft treats for ${pet.name}'s evening`,
                `Plan ${pet.name}'s birthday`,
                `Compare food options`,
                `What toys suit a ${pet.breed}?`,
              ].map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuery(suggestion);
                    // Auto-submit on tap for better mobile UX
                    setTimeout(() => {
                      if (handleSubmitRef.current) {
                        handleSubmitRef.current(null, suggestion);
                      }
                    }, 100);
                  }}
                  style={{ 
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                    userSelect: 'none'
                  }}
                  className="px-3 sm:px-4 py-2.5 sm:py-3 bg-white/10 backdrop-blur border border-white/20 rounded-full
                    text-white/80 text-xs sm:text-sm hover:bg-white/20 transition-all min-h-[44px]
                    active:scale-95 active:bg-white/30 select-none"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Conversation */}
        {conversationHistory.length > 0 && (
          <div className="space-y-6">
            {conversationHistory.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.type === 'user' ? (
                  // User Message
                  <div className="max-w-xl">
                    <div className="bg-purple-500/30 backdrop-blur border border-purple-400/30 rounded-2xl px-5 py-3">
                      <p className="text-white">{msg.content}</p>
                    </div>
                  </div>
                ) : (
                  // Mira Response
                  <div className="max-w-2xl w-full">
                    <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-5">
                      {/* Mira Header */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 
                          flex items-center justify-center">
                          <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-white font-medium">Mira</p>
                          <p className="text-white/50 text-xs">Your Pet Companion</p>
                        </div>
                        
                        {/* Intent & Execution Badges */}
                        {msg.data && (
                          <div className="ml-auto flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              getIntentColor(msg.data.understanding?.intent)
                            }`}>
                              {msg.data.understanding?.intent}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                              getExecutionColor(msg.data.execution_type)
                            }`}>
                              {msg.data.execution_type === 'INSTANT' ? '⚡ Instant' : '💜 With You'}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Emotional Acknowledgment (if present) */}
                      {msg.data?.response?.emotional_acknowledgment && (
                        <p className="text-white/90 text-lg mb-3 italic border-l-2 border-purple-400/50 pl-3">
                          {msg.data.response.emotional_acknowledgment}
                        </p>
                      )}
                      
                      {/* Pet Memory Section */}
                      {msg.data?.response?.pet_memory && (
                        <div className="bg-purple-500/10 rounded-xl px-4 py-3 mb-4 border border-purple-400/20">
                          <p className="text-purple-200 text-sm">
                            <Heart className="w-4 h-4 inline mr-2 text-pink-400" />
                            <span className="text-purple-300/70">What I remember: </span>
                            {msg.data.response.pet_memory}
                          </p>
                        </div>
                      )}
                      
                      {/* Main Message Content */}
                      <p className="text-white/90 text-lg mb-4">{msg.content}</p>
                      
                      {/* Alignment Question (the invitation to participate) */}
                      {msg.data?.response?.alignment_question && (
                        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-400/20 
                          rounded-xl px-4 py-4 mb-4">
                          <p className="text-amber-100 font-medium text-base">
                            {msg.data.response.alignment_question}
                          </p>
                        </div>
                      )}
                      
                      {/* Legacy Pet Relevance (fallback) */}
                      {!msg.data?.response?.pet_memory && msg.data?.understanding?.pet_relevance && (
                        <div className="bg-purple-500/20 rounded-xl px-4 py-3 mb-4">
                          <p className="text-purple-200 text-sm">
                            <Crown className="w-4 h-4 inline mr-2" />
                            <strong>For {pet.name}:</strong> {msg.data.understanding.pet_relevance}
                          </p>
                        </div>
                      )}
                      
                      {/* Product Suggestions - With Soft Framing */}
                      {msg.data?.response?.products && msg.data.response.products.length > 0 && (
                        <div className="space-y-3 mb-4 border-t border-white/10 pt-4 mt-4">
                          {/* Soft product intro */}
                          <p className="text-white/50 text-sm">
                            {msg.data.response.products_framing || "If you'd like to explore some options..."}
                          </p>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {msg.data.response.products.map((product, pIdx) => (
                              <div key={pIdx} className="flex items-start gap-3 bg-white/5 rounded-xl p-4
                                hover:bg-white/10 transition-all cursor-pointer group border border-white/5
                                hover:border-white/20">
                                
                                {/* Product Image or Placeholder */}
                                {product.image ? (
                                  <img 
                                    src={product.image} 
                                    alt={product.name || product.suggestion}
                                    className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.src = 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=100';
                                    }}
                                  />
                                ) : (
                                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 
                                    flex items-center justify-center flex-shrink-0">
                                    <ShoppingBag className="w-7 h-7 text-white" />
                                  </div>
                                )}
                                
                                <div className="flex-1 min-w-0">
                                  <p className="text-white font-medium truncate">
                                    {product.name || product.suggestion}
                                  </p>
                                  
                                  {/* Price */}
                                  {product.price && (
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="text-green-400 font-bold">₹{product.price}</span>
                                      {product.originalPrice && product.originalPrice > product.price && (
                                        <span className="text-white/40 text-sm line-through">
                                          ₹{product.originalPrice}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                  
                                  {/* Why for pet */}
                                  <p className="text-white/50 text-xs mt-1 line-clamp-2">
                                    {product.why_for_pet}
                                  </p>
                                </div>
                                
                                {/* Add to Cart button */}
                                <button className="flex-shrink-0 p-2 bg-purple-500/20 rounded-lg 
                                  group-hover:bg-purple-500 transition-all"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Add to cart logic here
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
                      
                      {/* Safety Tips (for health/emergency concerns) */}
                      {msg.data?.response?.safety_tips && msg.data.response.safety_tips.length > 0 && (
                        <div className="bg-red-500/20 border border-red-400/30 rounded-xl px-4 py-3 mb-4">
                          <p className="text-red-200 text-sm font-medium mb-2">
                            <AlertCircle className="w-4 h-4 inline mr-2" />
                            Important to Watch For:
                          </p>
                          <ul className="text-red-100/80 text-sm space-y-1 ml-6">
                            {msg.data.response.safety_tips.map((tip, tipIdx) => (
                              <li key={tipIdx} className="list-disc">{tip}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* Concierge Option - Quiet, Not Loud (but NOT for HOLD/grief) */}
                      {msg.data?.execution_type === 'CONCIERGE' && !msg.data?.response?.hide_concierge && (
                        <div className="border-t border-white/10 pt-4 mt-4">
                          <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                              <User className="w-4 h-4 text-white/60" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white/60 text-sm">
                                {msg.data.response?.concierge_framing || 
                                  "Your pet Concierge® can help coordinate this when you're ready."}
                              </p>
                            </div>
                            <button 
                              style={{ touchAction: 'manipulation', userSelect: 'none' }}
                              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 active:bg-white/30
                                text-white/80 rounded-lg text-sm transition-all min-h-[44px]
                                active:scale-95 select-none whitespace-nowrap"
                              data-testid="chat-concierge-btn"
                            >
                              Have my Concierge® help
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {/* Next Step (invitation, not instruction) - NOT for HOLD */}
                      {msg.data?.response?.next_step && msg.data?.execution_type !== 'HOLD' && (
                        <div className="flex items-center gap-2 text-white/50 text-sm mt-4">
                          <ArrowRight className="w-4 h-4" />
                          <span>{msg.data.response.next_step}</span>
                        </div>
                      )}
                      
                      {/* Legacy Next Action - NOT for HOLD */}
                      {!msg.data?.response?.next_step && msg.data?.response?.next_action && msg.data?.execution_type !== 'HOLD' && (
                        <div className="flex items-center gap-2 text-white/50 text-sm mt-4">
                          <ChevronRight className="w-4 h-4" />
                          <span>{msg.data.response.next_action}</span>
                        </div>
                      )}
                      
                      {/* Feedback Buttons - NOT for HOLD/grief (it's the wrong question) */}
                      {!msg.data?.response?.hide_feedback && msg.data?.execution_type !== 'HOLD' && (
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                          <span className="text-white/40 text-xs">Was this helpful?</span>
                          <div className="flex items-center gap-2">
                            {msg.feedbackGiven ? (
                              <span className={`text-xs px-3 py-1.5 rounded-full ${
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
                                  style={{ touchAction: 'manipulation', userSelect: 'none' }}
                                  className="p-2.5 bg-white/5 hover:bg-green-500/20 active:bg-green-500/30 
                                    rounded-lg transition-all group min-w-[44px] min-h-[44px]
                                    flex items-center justify-center active:scale-95 select-none"
                                  data-testid={`feedback-up-${idx}`}
                                >
                                  <ThumbsUp className="w-5 h-5 text-white/50 group-hover:text-green-400" />
                                </button>
                                <button
                                  onClick={() => handleFeedback(idx, false)}
                                  style={{ touchAction: 'manipulation', userSelect: 'none' }}
                                  className="p-2.5 bg-white/5 hover:bg-red-500/20 active:bg-red-500/30 
                                    rounded-lg transition-all group min-w-[44px] min-h-[44px]
                                    flex items-center justify-center active:scale-95 select-none"
                                  data-testid={`feedback-down-${idx}`}
                                >
                                  <ThumbsDown className="w-5 h-5 text-white/50 group-hover:text-red-400" />
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
                <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl px-4 sm:px-5 py-3 sm:py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 
                      flex items-center justify-center animate-pulse">
                      <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <div className="flex items-center gap-2 text-white/70 text-sm sm:text-base">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Mira is thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        </div>
      </main>
      
      {/* Footer Info - flex-shrink-0 with safe area */}
      <footer 
        className="flex-shrink-0 bg-black/50 backdrop-blur-lg border-t border-white/10 py-2.5 sm:py-3"
        style={{
          paddingBottom: 'calc(0.625rem + env(safe-area-inset-bottom, 0px))'
        }}
      >
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-white/40 text-xs sm:text-sm">
            🧪 <strong>Sandbox Mode</strong> — This is a preview of the Mira Operating System experience
          </p>
        </div>
      </footer>
    </div>
  );
};

export default MiraDemoPage;

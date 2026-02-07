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
  { id: 'concierge', label: 'Concierge', icon: MessageCircle, color: 'from-purple-500 to-pink-500', path: '/concierge', action: 'openChat' },
  { id: 'orders', label: 'Orders', icon: Package, color: 'from-blue-500 to-cyan-500', path: '/orders' },
  { id: 'plan', label: 'Plan', icon: Calendar, color: 'from-amber-500 to-orange-500', path: '/family-dashboard', tab: 'calendar' },
  { id: 'help', label: 'Help', icon: AlertCircle, color: 'from-red-500 to-rose-500', action: 'openHelp' },
  { id: 'soul', label: 'Soul', icon: Heart, color: 'from-pink-500 to-purple-500', path: '/pet-soul' },
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
        content: "I'll connect you with your pet concierge to help with this.",
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-lg border-b border-white/10">
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
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur rounded-full px-4 py-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <PawPrint className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-medium">{pet.name}</span>
              <span className="text-white/50 text-sm">• {pet.breed}</span>
            </div>
          </div>
        </div>
      </header>
      
      {/* Thin Dock */}
      <div className="bg-black/30 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4">
          {/* Universal Search Bar */}
          <form onSubmit={handleSubmit} className="py-4">
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <Search className="w-5 h-5 text-white/50" />
              </div>
              <input
                ref={inputRef}
                type="text"
                inputMode="search"
                enterKeyHint="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onTouchStart={(e) => e.currentTarget.focus()}
                placeholder={`Ask Mira anything for ${pet.name}...`}
                className="w-full bg-white/10 backdrop-blur border border-white/20 rounded-2xl 
                  pl-12 pr-24 py-4 text-white placeholder-white/40
                  focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50
                  transition-all text-lg appearance-none"
                style={{
                  WebkitAppearance: 'none',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  fontSize: '16px'
                }}
                disabled={isProcessing}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleVoice}
                  style={{ touchAction: 'manipulation' }}
                  className={`p-3 rounded-full transition-all min-w-[44px] min-h-[44px] flex items-center justify-center ${
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
                  style={{ touchAction: 'manipulation' }}
                  className="p-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white
                    disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-purple-500/25
                    transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
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
          
          {/* Dock Navigation */}
          <div className="flex items-center justify-center gap-2 pb-3">
            {DOCK_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleDockClick(item)}
                  data-testid={`dock-${item.id}`}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                    activeDockItem === item.id
                      ? `bg-gradient-to-r ${item.color} text-white shadow-lg`
                      : 'bg-white/5 text-white/70 hover:bg-white/10'
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
      
      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-white/20 rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">How can we help?</h3>
              <button onClick={() => setShowHelpModal(false)} className="p-1 hover:bg-white/10 rounded-lg">
                <X className="w-5 h-5 text-white/70" />
              </button>
            </div>
            <div className="space-y-3">
              <button 
                onClick={() => { setShowHelpModal(false); setQuery('I need help with my order'); inputRef.current?.focus(); }}
                className="w-full text-left p-3 bg-white/5 hover:bg-white/10 rounded-xl text-white/80 transition-all"
              >
                📦 Order & Delivery Help
              </button>
              <button 
                onClick={() => { setShowHelpModal(false); setQuery('I have a health concern about my pet'); inputRef.current?.focus(); }}
                className="w-full text-left p-3 bg-white/5 hover:bg-white/10 rounded-xl text-white/80 transition-all"
              >
                🏥 Health & Advisory
              </button>
              <button 
                onClick={() => { setShowHelpModal(false); setQuery('I need to return or exchange a product'); inputRef.current?.focus(); }}
                className="w-full text-left p-3 bg-white/5 hover:bg-white/10 rounded-xl text-white/80 transition-all"
              >
                🔄 Returns & Exchanges
              </button>
              <button 
                onClick={() => { setShowHelpModal(false); window.dispatchEvent(new CustomEvent('openMiraAI')); }}
                className="w-full text-left p-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 rounded-xl text-white transition-all border border-purple-400/30"
              >
                💬 Chat with Concierge
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Welcome State (no conversation yet) */}
        {conversationHistory.length === 0 && !isProcessing && (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 
              flex items-center justify-center shadow-2xl shadow-purple-500/30">
              <Bot className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-3">
              Hi! I&apos;m Mira
            </h2>
            <p className="text-white/60 text-lg mb-8 max-w-md mx-auto">
              I&apos;m here to help with everything for {pet.name}. Just ask me anything!
            </p>
            
            {/* Suggestion Chips */}
            <div className="flex flex-wrap justify-center gap-3 max-w-2xl mx-auto">
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
                    inputRef.current?.focus();
                    // Auto-submit on mobile for better UX
                    setTimeout(() => {
                      if (handleSubmitRef.current) {
                        handleSubmitRef.current(null, suggestion);
                      }
                    }, 100);
                  }}
                  style={{ touchAction: 'manipulation' }}
                  className="px-4 py-3 bg-white/10 backdrop-blur border border-white/20 rounded-full
                    text-white/80 text-sm hover:bg-white/20 transition-all min-h-[44px]
                    active:scale-95 active:bg-white/30"
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
                          <p className="text-white/50 text-xs">Pet Concierge AI</p>
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
                              {msg.data.execution_type === 'INSTANT' ? '⚡ Instant' : '👤 Concierge'}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Message Content */}
                      <p className="text-white/90 text-lg mb-4">{msg.content}</p>
                      
                      {/* Pet Relevance */}
                      {msg.data?.understanding?.pet_relevance && (
                        <div className="bg-purple-500/20 rounded-xl px-4 py-3 mb-4">
                          <p className="text-purple-200 text-sm">
                            <Crown className="w-4 h-4 inline mr-2" />
                            <strong>Why for {pet.name}:</strong> {msg.data.understanding.pet_relevance}
                          </p>
                        </div>
                      )}
                      
                      {/* Product Suggestions - Now with REAL products */}
                      {msg.data?.response?.products && msg.data.response.products.length > 0 && (
                        <div className="space-y-3 mb-4">
                          <div className="flex items-center justify-between">
                            <p className="text-white/70 text-sm font-medium">
                              {msg.data.response.has_real_products ? '🛍️ Products for you:' : 'Suggestions:'}
                            </p>
                            {msg.data.response.has_real_products && (
                              <span className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded-full">
                                Real Products
                              </span>
                            )}
                          </div>
                          
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
                      
                      {/* Concierge Handoff - Enhanced */}
                      {msg.data?.execution_type === 'CONCIERGE' && (
                        <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400/30 rounded-xl px-4 py-4">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 
                              flex items-center justify-center flex-shrink-0">
                              <User className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1">
                              <p className="text-amber-100 font-medium">
                                Your Pet Concierge is on it
                              </p>
                              {msg.data.response?.concierge_reason && (
                                <p className="text-amber-200/70 text-sm mt-1">
                                  {msg.data.response.concierge_reason}
                                </p>
                              )}
                              {msg.data.response?.estimated_response && (
                                <p className="text-amber-300 text-xs mt-2 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  Expected response: {msg.data.response.estimated_response}
                                </p>
                              )}
                              <button 
                                className="mt-3 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 
                                  text-white rounded-lg text-sm font-medium hover:from-amber-600 hover:to-orange-600 
                                  transition-all shadow-lg shadow-amber-500/25"
                                data-testid="chat-concierge-btn"
                              >
                                Chat with Concierge
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Next Action */}
                      {msg.data?.response?.next_action && (
                        <div className="flex items-center gap-2 text-white/50 text-sm mt-4">
                          <ChevronRight className="w-4 h-4" />
                          <span>{msg.data.response.next_action}</span>
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
                <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 
                      flex items-center justify-center animate-pulse">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex items-center gap-2 text-white/70">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Mira is thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
      
      {/* Footer Info */}
      <footer className="fixed bottom-0 left-0 right-0 bg-black/50 backdrop-blur-lg border-t border-white/10 py-3">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-white/40 text-sm">
            🧪 <strong>Sandbox Mode</strong> — This is a preview of the Mira Operating System experience
          </p>
        </div>
      </footer>
    </div>
  );
};

export default MiraDemoPage;

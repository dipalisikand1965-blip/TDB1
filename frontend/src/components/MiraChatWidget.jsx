/**
 * MiraChatWidget - Floating Chat Widget for Mira AI
 * 
 * MakeMyTrip-style floating chat widget that:
 * - Shows as a small circular button when closed
 * - Opens as a clean chat modal when clicked
 * - Non-blocking and can be minimized anytime
 * - Works on all pages (pillar pages, homepage, etc.)
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { getApiUrl } from '../utils/api';
import { toast } from 'sonner';
import { useMiraSignal } from '../hooks/useMiraSignal';
import { 
  X, Send, Loader2, Mic, MicOff, Volume2, VolumeX, 
  ChevronDown, Sparkles, PawPrint, MessageCircle, Zap,
  ArrowLeft, ShoppingCart, Plus, Heart
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Generate session ID for Mira conversations
const generateSessionId = () => {
  const stored = sessionStorage.getItem('mira_widget_session');
  if (stored) return stored;
  const newId = `mira-widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  sessionStorage.setItem('mira_widget_session', newId);
  return newId;
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
  
  // Chat state
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sessionId] = useState(generateSessionId);
  const [selectedPet, setSelectedPet] = useState(null);
  const [pets, setPets] = useState([]);
  
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
  const miraSignal = useMiraSignal();
  const trackPillarVisit = miraSignal?.trackPillarVisit || (() => {});
  const trackClick = miraSignal?.trackClick || (() => {});
  
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
  
  // Initialize speech recognition
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
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
  
  // Add welcome message when widget opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greeting = getTimeBasedGreeting();
      const petName = selectedPet?.name;
      const petBreed = selectedPet?.breed;
      const pillarName = config.name;
      
      // Personalized welcome based on context
      let welcomeMsg = `${greeting}! I'm Mira, your personal pet concierge.`;
      
      if (miraContext?.pillar_note) {
        welcomeMsg = miraContext.pillar_note;
      } else if (petName && petBreed) {
        welcomeMsg += ` I see you're browsing ${pillarName} for ${petName}, your lovely ${petBreed}. How can I help today?`;
      } else if (petName) {
        welcomeMsg += ` How can I help you with ${petName}'s ${pillarName.toLowerCase()} needs today?`;
      } else {
        welcomeMsg += ` I'm here to help with all your ${pillarName.toLowerCase()} needs. What can I do for you?`;
      }
      
      welcomeMsg += ' 🐾';
      
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: welcomeMsg
      }]);
    }
  }, [isOpen, selectedPet, miraContext, config.name]);
  
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
  
  const speakText = (text) => {
    if (!synthRef.current || !voiceEnabled) return;
    
    synthRef.current.cancel();
    const cleanText = text.replace(/[*#_~`]/g, '').replace(/\[.*?\]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.lang = 'en-IN';
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    synthRef.current.speak(utterance);
  };
  
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
        
        // Add ticket info if created
        if (data.service_desk_ticket_id || data.concierge_action?.action_needed) {
          const ticketId = data.service_desk_ticket_id || data.ticket_id;
          displayContent += `\n\n📋 **Request #${ticketId}** created!`;
          toast.success(`Request #${ticketId} created!`, {
            description: 'Our concierge team will contact you shortly.'
          });
        }
        
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: displayContent,
          products: data.products,
          ticketId: data.ticket_id
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
      // Default: add to cart
      addToCart(product);
      toast.success(`${product.name} added to cart!`);
    }
    // Track the click for personalization
    trackClick('product_recommendation', product.id, { pillar, source: 'mira_chat' });
  };
  
  // Generate personalized quick prompts based on context
  const getPersonalizedPrompts = () => {
    // Use dynamic prompts from API if available
    if (dynamicPrompts.length > 0) {
      return dynamicPrompts.slice(0, 4);
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
  
  // Floating Button (when closed)
  if (!isOpen) {
    return (
      <div className={`fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-2 ${className}`}>
        {/* Pulse Voice Button */}
        {speechSupported && (
          <button
            onClick={handlePulseClick}
            className="group relative"
            data-testid="mira-pulse-button"
          >
            <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-xl">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-cyan-600 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Pulse Voice
            </div>
          </button>
        )}
        
        {/* Main Chat Button */}
        <button
          onClick={() => setIsOpen(true)}
          className="group relative"
          data-testid="mira-widget-button"
        >
          <div className={`relative w-14 h-14 bg-gradient-to-r ${config.color} rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-xl`}>
            <MessageCircle className="w-6 h-6 text-white" />
            {/* Online indicator */}
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse" />
          </div>
          {/* Tooltip */}
          <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Chat with Mira
          </div>
        </button>
      </div>
    );
  }
  
  // Chat Widget (when open)
  return (
    <div 
      className={`fixed bottom-6 right-6 z-[9999] ${className}`}
      data-testid="mira-chat-widget"
    >
      <div className={`w-[360px] max-w-[calc(100vw-48px)] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ${isMinimized ? 'h-16' : 'h-[500px] max-h-[80vh]'}`}>
        {/* Header */}
        <div 
          className={`bg-gradient-to-r ${config.color} text-white p-4 cursor-pointer flex items-center justify-between shrink-0`}
          onClick={() => isMinimized && setIsMinimized(false)}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 bg-white/20 rounded-full flex items-center justify-center ${isListening ? 'animate-pulse ring-2 ring-cyan-400' : ''}`}>
              <PawPrint className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold">Mira</p>
              <p className="text-xs opacity-80">
                {isListening ? '🎤 Listening...' : isSpeaking ? '🔊 Speaking...' : 'Your Pet Concierge'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Pulse Voice Button */}
            {speechSupported && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleListening();
                }}
                className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 transition-all ${
                  isListening 
                    ? 'bg-cyan-400 text-gray-900 animate-pulse' 
                    : 'bg-white/20 hover:bg-white/30 text-white'
                }`}
                data-testid="mira-header-pulse"
              >
                <Zap className="w-3 h-3" />
                Pulse
              </button>
            )}
            {/* Voice toggle */}
            <button
              onClick={(e) => { e.stopPropagation(); setVoiceEnabled(!voiceEnabled); }}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${voiceEnabled ? 'bg-white/20' : 'bg-white/10'}`}
              title={voiceEnabled ? "Voice ON" : "Voice OFF"}
            >
              {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            {/* Minimize */}
            <button
              onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-white/20 hover:bg-white/30 transition-colors"
            >
              <ChevronDown className={`w-4 h-4 transition-transform ${isMinimized ? 'rotate-180' : ''}`} />
            </button>
            {/* Close */}
            <button
              onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-white/20 hover:bg-white/30 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Content - Hidden when minimized */}
        {!isMinimized && (
          <>
            {/* Pet Selector (if user has pets) */}
            {pets.length > 0 && (
              <div className="px-4 py-2 border-b bg-gray-50 shrink-0">
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  <span className="text-xs text-gray-500 shrink-0">Talking about:</span>
                  {pets.slice(0, 3).map(pet => (
                    <button
                      key={pet.id}
                      onClick={() => setSelectedPet(pet)}
                      className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 transition-all shrink-0 ${
                        selectedPet?.id === pet.id 
                          ? 'bg-purple-100 text-purple-700 ring-1 ring-purple-300' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <PawPrint className="w-3 h-3" />
                      {pet.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
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
                        ? 'bg-purple-600 text-white rounded-br-sm'
                        : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    
                    {/* Product Cards (if Mira recommends products) */}
                    {msg.products && msg.products.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {msg.products.slice(0, 3).map(product => (
                          <div 
                            key={product.id}
                            className="bg-white rounded-lg p-2 flex items-center gap-2 cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => handleProductClick(product)}
                          >
                            {product.image && (
                              <img src={product.image} alt={product.name} className="w-12 h-12 rounded object-cover" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-800 truncate">{product.name}</p>
                              <p className="text-xs text-purple-600 font-semibold">₹{product.price}</p>
                            </div>
                            <Plus className="w-4 h-4 text-purple-600 shrink-0" />
                          </div>
                        ))}
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
            
            {/* Quick Prompts (shown when no messages except welcome) */}
            {messages.length <= 1 && (
              <div className="px-4 pb-2 shrink-0">
                <div className="flex flex-wrap gap-2">
                  {quickPrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => { setInputValue(prompt); inputRef.current?.focus(); }}
                      className="px-3 py-1.5 bg-purple-50 text-purple-700 text-xs rounded-full hover:bg-purple-100 transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
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
    </div>
  );
};

export default MiraChatWidget;

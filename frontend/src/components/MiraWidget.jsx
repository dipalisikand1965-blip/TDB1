/**
 * MiraWidget.jsx
 * 
 * The original Mira Pet Concierge® widget design from thedoggycompany.in
 * Features:
 * - Floating widget with magenta/pink gradient header
 * - Pet selector dropdown
 * - Personalized product carousel
 * - Quick action buttons
 * - ElevenLabs voice (Eloise)
 * - Concierge handoff cards
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, Volume2, VolumeX, Mic, MicOff, Send, 
  ChevronLeft, ChevronRight, ShoppingCart, PawPrint,
  Phone, MessageCircle, RefreshCw, Maximize2, Minimize2
} from 'lucide-react';
import { API_URL } from '../utils/api';

// Quick Actions based on current pillar
const QUICK_ACTIONS = {
  travel: [
    { id: 'travel-kit', label: 'Build Travel Kit', icon: '🎒', highlighted: true },
    { id: 'plan-trip', label: 'Plan Trip', icon: '✈️' },
    { id: 'pet-passport', label: 'Pet Passport', icon: '📄' },
  ],
  celebrate: [
    { id: 'birthday-cake', label: 'Birthday Cake', icon: '🎂', highlighted: true },
    { id: 'party-plan', label: 'Plan Party', icon: '🎉' },
    { id: 'gift-box', label: 'Gift Box', icon: '🎁' },
  ],
  dine: [
    { id: 'treats', label: 'Order Treats', icon: '🦴', highlighted: true },
    { id: 'meal-plan', label: 'Meal Plan', icon: '🍽️' },
    { id: 'allergies', label: 'Allergy Check', icon: '⚠️' },
  ],
  care: [
    { id: 'grooming', label: 'Book Grooming', icon: '✂️', highlighted: true },
    { id: 'vet-visit', label: 'Vet Visit', icon: '🏥' },
    { id: 'health-check', label: 'Health Check', icon: '❤️' },
  ],
  default: [
    { id: 'explore', label: 'Explore', icon: '✨', highlighted: true },
    { id: 'shop', label: 'Shop', icon: '🛒' },
    { id: 'help', label: 'Get Help', icon: '💬' },
  ]
};

const MiraWidget = ({ 
  pet = null, 
  pillar = 'default',
  isOpen = false,
  onClose = () => {},
  onToggle = () => {}
}) => {
  // State
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [products, setProducts] = useState([]);
  const [sessionId] = useState(() => `mira-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const [conversationHistory, setConversationHistory] = useState([]);
  
  // Refs
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const audioRef = useRef(null);
  const productCarouselRef = useRef(null);
  
  // Default pet if none provided
  const currentPet = pet || {
    id: 'demo-pet',
    name: 'Buddy',
    breed: 'Golden Retriever',
    photo: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=100&h=100&fit=crop',
    traits: ['Playful', 'Energetic'],
    sensitivities: ['Chicken allergy'],
    favorites: { treat: 'Peanut butter' }
  };

  // Get pillar-specific quick actions
  const quickActions = QUICK_ACTIONS[pillar] || QUICK_ACTIONS.default;

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initial greeting when widget opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greeting = getContextualGreeting();
      setMessages([{
        type: 'mira',
        content: greeting,
        timestamp: new Date(),
        badges: [{ type: 'remember', label: 'Remembering you' }]
      }]);
      
      // Fetch personalized products
      fetchPersonalizedProducts();
      
      // Speak greeting if voice enabled
      if (voiceEnabled) {
        speakText(greeting);
      }
    }
  }, [isOpen]);

  // Get contextual greeting based on pillar and pet
  const getContextualGreeting = () => {
    const timeGreeting = getTimeGreeting();
    const pillarContext = getPillarContext();
    
    return `${timeGreeting} I see you're browsing ${pillarContext} for ${currentPet.name}, your lovely ${currentPet.breed}. How can I help today? 🐾`;
  };

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning!";
    if (hour < 17) return "Good afternoon!";
    return "Good evening!";
  };

  const getPillarContext = () => {
    const contexts = {
      travel: 'Travel',
      celebrate: 'Celebrate',
      dine: 'Dine',
      care: 'Care',
      stay: 'Stay',
      enjoy: 'Enjoy',
      fit: 'Fitness',
      learn: 'Learning',
      default: 'products'
    };
    return contexts[pillar] || contexts.default;
  };

  // Fetch personalized products for the pet
  const fetchPersonalizedProducts = async () => {
    try {
      const response = await fetch(`${API_URL}/api/products?limit=6&pillar=${pillar}`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  // ElevenLabs Text-to-Speech
  const speakText = async (text) => {
    if (!voiceEnabled) return;
    
    try {
      setIsSpeaking(true);
      
      const response = await fetch(`${API_URL}/api/voice/speak`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text,
          voice_id: 'EXAVITQu4vr4xnSDxMaL', // Eloise voice
          model_id: 'eleven_monolingual_v1'
        })
      });
      
      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        
        if (audioRef.current) {
          audioRef.current.src = audioUrl;
          audioRef.current.play();
        }
      }
    } catch (error) {
      console.error('TTS error:', error);
    } finally {
      setIsSpeaking(false);
    }
  };

  // Send message to Mira
  const sendMessage = async (text) => {
    if (!text.trim() || isLoading) return;
    
    // Add user message
    const userMessage = {
      type: 'user',
      content: text,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    
    // Update conversation history
    const updatedHistory = [...conversationHistory, { role: 'user', content: text }];
    setConversationHistory(updatedHistory);
    
    try {
      const response = await fetch(`${API_URL}/api/mira/os/understand-with-products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: text,
          pet_context: {
            name: currentPet.name,
            breed: currentPet.breed,
            age: currentPet.age,
            sensitivities: currentPet.sensitivities,
            traits: currentPet.traits,
            favorites: currentPet.favorites
          },
          page_context: pillar,
          include_products: true,
          pillar: pillar,
          session_id: sessionId,
          conversation_history: updatedHistory.slice(-10)
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        const miraMessage = {
          type: 'mira',
          content: data.response?.message || data.message || "I'm here to help!",
          timestamp: new Date(),
          intent: data.response?.intent || data.intent,
          execution_type: data.response?.execution_type || data.execution_type,
          products: data.response?.products || [],
          needs_concierge: data.response?.execution_type === 'CONCIERGE'
        };
        
        setMessages(prev => [...prev, miraMessage]);
        setConversationHistory(prev => [...prev, { role: 'assistant', content: miraMessage.content }]);
        
        // Update products if returned
        if (miraMessage.products?.length > 0) {
          setProducts(miraMessage.products);
        }
        
        // Speak response
        if (voiceEnabled) {
          speakText(miraMessage.content);
        }
      }
    } catch (error) {
      console.error('Mira error:', error);
      setMessages(prev => [...prev, {
        type: 'mira',
        content: "I'm having trouble connecting. Please try again.",
        timestamp: new Date(),
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle quick action click
  const handleQuickAction = (action) => {
    const queries = {
      'travel-kit': `Help me build a travel kit for ${currentPet.name}`,
      'plan-trip': `I want to plan a trip with ${currentPet.name}`,
      'pet-passport': `How do I get a pet passport for ${currentPet.name}?`,
      'birthday-cake': `I want to order a birthday cake for ${currentPet.name}`,
      'party-plan': `Help me plan a birthday party for ${currentPet.name}`,
      'gift-box': `Show me gift boxes for ${currentPet.name}`,
      'treats': `Show me treats for ${currentPet.name}`,
      'meal-plan': `Create a meal plan for ${currentPet.name}`,
      'allergies': `${currentPet.name} has allergies, what should I avoid?`,
      'grooming': `Book a grooming appointment for ${currentPet.name}`,
      'vet-visit': `Schedule a vet visit for ${currentPet.name}`,
      'health-check': `Health check for ${currentPet.name}`,
      'explore': `What can you help me with for ${currentPet.name}?`,
      'shop': `Show me products for ${currentPet.name}`,
      'help': `I need help with ${currentPet.name}`
    };
    
    sendMessage(queries[action.id] || action.label);
  };

  // Product carousel scroll
  const scrollProducts = (direction) => {
    if (productCarouselRef.current) {
      const scrollAmount = 200;
      productCarouselRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Connect to WhatsApp Concierge
  const connectToConcierge = () => {
    const message = encodeURIComponent(
      `Hi, I need help with my pet ${currentPet.name} (${currentPet.breed}). Can you assist?`
    );
    window.open(`https://wa.me/919663185747?text=${message}`, '_blank');
  };

  // Handle form submit
  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  if (!isOpen) return null;

  return (
    <div className="mira-widget-overlay">
      <div className="mira-widget">
        {/* Header - Magenta Gradient */}
        <div className="mira-widget-header">
          <div className="mira-widget-header-left">
            <div className="mira-widget-logo">
              <PawPrint className="w-5 h-5" />
            </div>
            <div className="mira-widget-title">
              <span className="mira-widget-name">Mira</span>
              <span className="mira-widget-subtitle">Pet Concierge®</span>
            </div>
          </div>
          <div className="mira-widget-header-right">
            <button
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className="mira-widget-btn"
              title={voiceEnabled ? 'Mute' : 'Unmute'}
            >
              {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
            <button onClick={onClose} className="mira-widget-btn">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Pet Selector */}
        <div className="mira-widget-pet-selector">
          <span className="mira-widget-for">For:</span>
          <button className="mira-widget-pet-pill">
            <PawPrint className="w-4 h-4" />
            <span>{currentPet.name}</span>
          </button>
        </div>
        
        {/* Personalized Products Carousel */}
        {products.length > 0 && (
          <div className="mira-widget-products">
            <div className="mira-widget-products-header">
              <span className="mira-widget-products-title">✨ FOR {currentPet.name.toUpperCase()}</span>
            </div>
            <div className="mira-widget-products-carousel-container">
              <button 
                onClick={() => scrollProducts('left')} 
                className="mira-widget-carousel-btn left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div 
                ref={productCarouselRef}
                className="mira-widget-products-carousel"
              >
                {products.map((product, idx) => (
                  <div key={idx} className="mira-widget-product-card">
                    <img 
                      src={product.image_url || product.image || product.images?.[0] || 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=150&h=150&fit=crop'} 
                      alt={product.name}
                      className="mira-widget-product-image"
                    />
                    <div className="mira-widget-product-name">{product.name?.substring(0, 15)}...</div>
                    <div className="mira-widget-product-price">₹{product.price || product.base_price}</div>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => scrollProducts('right')} 
                className="mira-widget-carousel-btn right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
        
        {/* Quick Action Buttons */}
        <div className="mira-widget-quick-actions">
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={() => handleQuickAction(action)}
              className={`mira-widget-action-btn ${action.highlighted ? 'highlighted' : ''}`}
            >
              <span className="mira-widget-action-icon">{action.icon}</span>
              <span>{action.label}</span>
            </button>
          ))}
        </div>
        
        {/* Messages Area */}
        <div className="mira-widget-messages">
          {messages.map((msg, idx) => (
            <div key={idx} className={`mira-widget-message ${msg.type}`}>
              {msg.type === 'mira' && (
                <div className="mira-widget-message-header">
                  <PawPrint className="w-4 h-4" />
                  <span className="mira-widget-message-sender">Mira</span>
                  {msg.intent && (
                    <span className={`mira-widget-badge intent-${msg.intent?.toLowerCase()}`}>
                      {msg.intent}
                    </span>
                  )}
                </div>
              )}
              <div className="mira-widget-message-content">
                {msg.badges?.map((badge, bidx) => (
                  <div key={bidx} className="mira-widget-message-badge">
                    ⓘ {badge.label}
                  </div>
                ))}
                <p>{msg.content}</p>
              </div>
              
              {/* Concierge Handoff Card */}
              {msg.needs_concierge && (
                <div className="mira-widget-concierge-card">
                  <div className="mira-widget-concierge-icon">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div className="mira-widget-concierge-text">
                    <strong>This needs your Pet Concierge</strong>
                    <p>This request involves planning, coordination, or personalized service that our concierge team handles best.</p>
                  </div>
                  <button 
                    onClick={connectToConcierge}
                    className="mira-widget-concierge-btn"
                  >
                    Connect with Concierge
                  </button>
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="mira-widget-message mira">
              <div className="mira-widget-typing">
                <span></span><span></span><span></span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        {/* Quick Actions Label */}
        <div className="mira-widget-quick-label">Quick Actions</div>
        
        {/* Input Area */}
        <div className="mira-widget-input-area">
          <button 
            onClick={() => setIsListening(!isListening)}
            className={`mira-widget-mic-btn ${isListening ? 'listening' : ''}`}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          <form onSubmit={handleSubmit} className="mira-widget-input-form">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your message..."
              className="mira-widget-input"
              disabled={isLoading}
            />
          </form>
          <button 
            type="submit"
            onClick={handleSubmit}
            disabled={!inputValue.trim() || isLoading}
            className="mira-widget-send-btn"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        
        {/* Speaking Indicator */}
        {isSpeaking && (
          <div className="mira-widget-speaking">
            <Volume2 className="w-4 h-4" />
            <span>Speaking...</span>
          </div>
        )}
        
        {/* Hidden audio element for TTS */}
        <audio ref={audioRef} onEnded={() => setIsSpeaking(false)} />
      </div>
    </div>
  );
};

export default MiraWidget;

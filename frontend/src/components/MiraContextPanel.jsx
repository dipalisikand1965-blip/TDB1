/**
 * MiraContextPanel - Contextual Mira AI Panel for Pillar Pages
 * 
 * This component provides a non-intrusive, contextual Mira experience
 * on pillar pages. It shows personalized notes and suggestions based
 * on the user's Pet Soul data and current browsing context.
 * 
 * NOW INCLUDES VOICE CAPABILITIES (Pulse integration):
 * - Voice input via Web Speech API
 * - Text-to-speech responses
 * - Time-aware greetings
 * - Product cards in chat
 * 
 * Placement:
 * - Desktop: Right-side panel (sticky)
 * - Mobile: Bottom slide-up drawer
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { useMiraSignal } from '../hooks/useMiraSignal';
import { getApiUrl } from '../utils/api';
import { toast } from 'sonner';
import { 
  MessageCircle, ChevronUp, ChevronDown, ChevronRight, PawPrint, 
  Sparkles, ShoppingCart, ArrowRight, X, Send, Loader2,
  Lightbulb, Calendar, Heart, Plus, Mic, MicOff, Volume2, VolumeX, Zap
} from 'lucide-react';

// Generate session ID for Mira conversations
const generateSessionId = () => {
  const stored = sessionStorage.getItem('mira_context_session');
  if (stored) return stored;
  const newId = `mira-ctx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  sessionStorage.setItem('mira_context_session', newId);
  return newId;
};

const MiraContextPanel = ({ 
  pillar = 'advisory',
  category = null,  // Product category for more specific suggestions
  className = '',
  position = 'right' // 'right' for desktop, 'bottom' for mobile
}) => {
  const { user, token } = useAuth();
  const { addToCart } = useCart();
  
  // On mobile (position='bottom'), start minimized to not block content
  const isMobile = position === 'bottom';
  const [isExpanded, setIsExpanded] = useState(!isMobile);
  const [isMinimized, setIsMinimized] = useState(isMobile);
  const [context, setContext] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sessionId] = useState(generateSessionId);
  const [recommendations, setRecommendations] = useState([]);
  const [quickPrompts, setQuickPrompts] = useState([]);
  
  // Voice input/output state (Pulse integration)
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef(null);
  const audioRef = useRef(null); // For ElevenLabs audio playback
  const inputRef = useRef(null);
  
  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
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
          toast.error('Microphone access denied. Please enable it in your browser settings.');
        }
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);
  
  // Text-to-Speech function - ElevenLabs (Elise voice)
  const speakText = useCallback(async (text) => {
    if (!voiceEnabled || !text) return;
    
    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    
    try {
      setIsSpeaking(true);
      console.log('[MiraContextPanel] Attempting ElevenLabs TTS with Elise voice...');
      
      // Clean text for speech
      let cleanText = text
        .replace(/[🎉🐕✨🦴💜🎂🏥☀️🌤️🌙🌟🐾🎒📅📋😊💝🎁]/g, '')
        .replace(/\*\*/g, '')
        .replace(/[*#_~`]/g, '')
        .replace(/\[.*?\]/g, '')
        .replace(/\n/g, ' ')
        .substring(0, 500);
      
      const response = await fetch(`${getApiUrl()}/api/tts/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanText })
      });
      
      if (!response.ok) {
        throw new Error('ElevenLabs TTS failed');
      }
      
      const data = await response.json();
      console.log('[MiraContextPanel] ✓ ElevenLabs audio received (Elise), playing...');
      
      // Play audio
      const audio = new Audio(`data:audio/mpeg;base64,${data.audio_base64}`);
      audioRef.current = audio;
      
      audio.onended = () => {
        console.log('[MiraContextPanel] ✓ Elise audio playback complete');
        setIsSpeaking(false);
      };
      audio.onerror = (e) => {
        console.log('[MiraContextPanel] Audio playback error:', e);
        setIsSpeaking(false);
      };
      
      await audio.play();
    } catch (error) {
      console.error('[MiraContextPanel] ElevenLabs TTS error:', error.message);
      setIsSpeaking(false);
    }
  }, [voiceEnabled]);
  
  // Toggle voice listening
  const toggleListening = () => {
    if (!speechSupported) {
      toast.error('Voice input is not supported in your browser');
      return;
    }
    
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setInputValue('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  };
  
  // Get time-aware greeting
  const getTimeGreeting = useCallback(() => {
    const hour = new Date().getHours();
    const petName = context?.selected_pet?.name || 'your pet';
    
    if (hour >= 5 && hour < 12) {
      return `Good morning! ☀️ How can I help ${petName} today?`;
    } else if (hour >= 12 && hour < 17) {
      return `Good afternoon! 🌤️ What does ${petName} need?`;
    } else if (hour >= 17 && hour < 21) {
      return `Good evening! 🌙 How can I assist ${petName}?`;
    } else {
      return `Hello! 🌟 I'm here to help ${petName} anytime.`;
    }
  }, [context?.selected_pet?.name]);
  
  // Mira Signal tracking for passive learning
  const { trackPillarVisit, trackClick } = useMiraSignal();
  
  // Track pillar visit on mount and fetch quick prompts
  useEffect(() => {
    trackPillarVisit(pillar);
    // Fetch pillar-specific quick prompts
    const fetchQuickPrompts = async () => {
      try {
        const response = await fetch(`${getApiUrl()}/api/mira/quick-prompts/${pillar}`);
        if (response.ok) {
          const data = await response.json();
          setQuickPrompts(data.prompts || []);
        }
      } catch (error) {
        console.debug('Quick prompts fetch failed:', error);
      }
    };
    fetchQuickPrompts();
  }, [pillar, trackPillarVisit]);
  
  // Pillar-specific configurations
  const pillarConfig = {
    travel: {
      icon: '✈️',
      name: 'Travel',
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    stay: {
      icon: '🏨',
      name: 'Stay',
      color: 'from-purple-500 to-violet-500',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    care: {
      icon: '💊',
      name: 'Care',
      color: 'from-rose-500 to-pink-600',
      bgColor: 'bg-rose-50',
      borderColor: 'border-rose-200'
    },
    dine: {
      icon: '🍽️',
      name: 'Dine',
      color: 'from-orange-500 to-amber-500',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    },
    celebrate: {
      icon: '🎂',
      name: 'Celebrate',
      color: 'from-pink-500 to-rose-500',
      bgColor: 'bg-pink-50',
      borderColor: 'border-pink-200'
    },
    enjoy: {
      icon: '🎉',
      name: 'Enjoy',
      color: 'from-yellow-500 to-orange-500',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200'
    },
    shop: {
      icon: '🛒',
      name: 'Shop',
      color: 'from-indigo-500 to-purple-500',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200'
    },
    fit: {
      icon: '🏃',
      name: 'Fit',
      color: 'from-teal-500 to-cyan-500',
      bgColor: 'bg-teal-50',
      borderColor: 'border-teal-200'
    },
    learn: {
      icon: '🎓',
      name: 'Learn',
      color: 'from-blue-600 to-indigo-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    advisory: {
      icon: '📋',
      name: 'Advisory',
      color: 'from-purple-500 to-violet-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    paperwork: {
      icon: '📄',
      name: 'Paperwork',
      color: 'from-gray-500 to-slate-500',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200'
    },
    emergency: {
      icon: '🚨',
      name: 'Emergency',
      color: 'from-red-500 to-rose-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    },
    club: {
      icon: '👑',
      name: 'Club',
      color: 'from-amber-500 to-yellow-500',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200'
    }
  };
  
  const config = pillarConfig[pillar] || pillarConfig.advisory;
  
  // Fetch Mira context when component mounts or user changes
  const fetchContext = useCallback(async () => {
    setLoading(true);
    try {
      const apiUrl = getApiUrl();
      console.log('[MiraPanel] Fetching context from:', `${apiUrl}/api/mira/context`);
      
      const response = await fetch(`${apiUrl}/api/mira/context`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          current_pillar: pillar,
          current_category: category  // Pass category for more specific suggestions
        })
      });
      
      console.log('[MiraPanel] Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('[MiraPanel] Context loaded:', data.pillar_note?.substring(0, 50));
        setContext(data);
        
        // Set initial welcome message for chat
        if (data.pillar_note) {
          setChatMessages([{
            id: 'welcome',
            role: 'assistant',
            content: data.pillar_note.replace(/\*\*/g, '')
          }]);
        }
        
        // Fetch personalized recommendations if we have a selected pet
        if (data.selected_pet?.id) {
          try {
            const recsResponse = await fetch(
              `${apiUrl}/api/mira/intelligence/recommendations/${data.selected_pet.id}?pillar=${pillar}&limit=3`,
              {
                headers: {
                  ...(token && { 'Authorization': `Bearer ${token}` })
                }
              }
            );
            if (recsResponse.ok) {
              const recsData = await recsResponse.json();
              setRecommendations(recsData.recommendations || []);
            }
          } catch (recError) {
            console.debug('Recommendations fetch failed:', recError);
          }
        }
      } else {
        // Even if context fails, set a default message
        console.error('[MiraPanel] Context fetch failed:', response.status);
        setContext({
          pillar_note: `I'm Mira, your ${config.name} concierge. How can I help you today?`,
          user: null,
          pets: [],
          selected_pet: null,
          suggestions: []
        });
      }
    } catch (error) {
      console.error('[MiraPanel] Error fetching context:', error);
      // Set default context on error so panel still shows
      setContext({
        pillar_note: `I'm Mira, your ${config.name} concierge. How can I help you today?`,
        user: null,
        pets: [],
        selected_pet: null,
        suggestions: []
      });
    } finally {
      setLoading(false);
    }
  }, [token, pillar, category, config.name]);
  
  useEffect(() => {
    fetchContext();
  }, [fetchContext]);
  
  // Send message to Mira
  const sendMessage = async () => {
    if (!inputValue.trim() || isSending) return;
    
    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim()
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsSending(true);
    
    // Stop listening if currently listening
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
          source: 'pillar_panel',
          current_pillar: pillar,
          selected_pet_id: context?.selected_pet?.id || null,
          history: chatMessages.filter(m => m.id !== 'welcome').map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const assistantContent = data.response;
        
        // Build response with ticket info if available
        let displayContent = assistantContent;
        
        // If a service desk ticket was created, show confirmation
        if (data.service_desk_ticket_id || data.concierge_action?.action_needed) {
          const ticketId = data.service_desk_ticket_id || data.ticket_id;
          displayContent += `\n\n---\n📋 **Request #${ticketId}** created. Our live concierge® will get back to you shortly!`;
        }
        
        setChatMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: displayContent,
          ticketId: data.ticket_id,
          serviceTicketId: data.service_desk_ticket_id,
          conciergeAction: data.concierge_action
        }]);
        
        // Show toast notification for ticket creation
        if (data.service_desk_ticket_id) {
          toast.success(`Request #${data.service_desk_ticket_id} created!`, {
            description: 'Our concierge® team will contact you shortly.'
          });
        }
        
        // Speak the response if voice is enabled
        if (voiceEnabled) {
          speakText(assistantContent);
        }
      }
    } catch (error) {
      console.error('Mira chat error:', error);
      const errorMsg = "Let me try that again. What can I help you with?";
      setChatMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorMsg
      }]);
    } finally {
      setIsSending(false);
    }
  };
  
  // Send message directly (for quick prompts and suggestions)
  const sendDirectMessage = async (message) => {
    if (!message.trim() || isSending) return;
    
    setShowChat(true);
    
    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message.trim()
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsSending(true);
    
    try {
      const response = await fetch(`${getApiUrl()}/api/mira/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          message: message.trim(),
          session_id: sessionId,
          source: 'pillar_panel',
          current_pillar: pillar,
          selected_pet_id: context?.selected_pet?.id || null,
          history: chatMessages.filter(m => m.id !== 'welcome').map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        let displayContent = data.response;
        
        if (data.service_desk_ticket_id || data.concierge_action?.action_needed) {
          const ticketId = data.service_desk_ticket_id || data.ticket_id;
          displayContent += `\n\n---\n📋 **Request #${ticketId}** created. Our live concierge® will get back to you shortly!`;
        }
        
        const assistantMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: displayContent,
          products: data.products
        };
        
        setChatMessages(prev => [...prev, assistantMessage]);
        
        if (voiceEnabled && data.response) {
          speakText(data.response);
        }
        
        if (data.quick_prompts) {
          setQuickPrompts(data.quick_prompts);
        }
      } else {
        setChatMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: "I apologise — something went wrong. Please try again."
        }]);
      }
    } catch (error) {
      console.error('[MiraPanel] Direct message error:', error);
      setChatMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I apologise — something went wrong. Please try again."
      }]);
    } finally {
      setIsSending(false);
    }
  };
  
  // Handle product add to cart
  const handleAddToCart = (product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: 1
    });
  };
  
  // Open full Mira chat
  const openFullMira = () => {
    window.dispatchEvent(new CustomEvent('openMiraAI'));
  };
  
  // Render minimized state
  if (isMinimized) {
    return (
      <div className={`fixed bottom-20 right-4 z-[10000] ${className}`}>
        <Button
          onClick={() => setIsMinimized(false)}
          className={`bg-gradient-to-r ${config.color} text-white rounded-full px-4 py-2 shadow-lg hover:shadow-xl transition-all`}
          data-testid="mira-panel-expand"
        >
          <PawPrint className="w-4 h-4 mr-2" />
          Mira
        </Button>
      </div>
    );
  }
  
  // Loading state
  if (loading) {
    return (
      <Card className={`${config.bgColor} ${config.borderColor} border ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-slate-200 to-gray-200 animate-pulse" />
            <div className="flex-1">
              <div className="h-4 bg-slate-200 rounded animate-pulse mb-2 w-24" />
              <div className="h-3 bg-slate-200 rounded animate-pulse w-32" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card 
      className={`${config.bgColor} ${config.borderColor} border overflow-hidden transition-all duration-300 ${className}`}
      data-testid="mira-context-panel"
    >
      {/* Header */}
      <div 
        className={`bg-gradient-to-r ${config.color} text-white p-3 cursor-pointer flex items-center justify-between`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 bg-white/20 rounded-full flex items-center justify-center ${isListening ? 'animate-pulse ring-2 ring-cyan-400' : ''}`}>
            <PawPrint className="w-4 h-4" />
          </div>
          <div>
            <p className="font-semibold text-sm">Mira</p>
            <p className="text-xs opacity-80">
              {isListening ? '🎤 Listening...' : isSpeaking ? '🔊 Speaking...' : 'Your Concierge®'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {/* Pulse Voice Button */}
          {speechSupported && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleListening();
                if (!isExpanded) setIsExpanded(true);
                if (!showChat) setShowChat(true);
              }}
              className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 transition-all ${
                isListening 
                  ? 'bg-cyan-400 text-gray-900 animate-pulse' 
                  : 'bg-white/20 hover:bg-white/30 text-white'
              }`}
              data-testid="mira-panel-pulse-btn"
            >
              <Zap className="w-3 h-3" />
              Pulse
            </button>
          )}
          {/* Voice Toggle Button */}
          <button
            className={`h-7 w-7 rounded-full flex items-center justify-center transition-colors ${voiceEnabled ? 'bg-white/20 text-white' : 'bg-white/10 text-white/50'}`}
            onClick={(e) => {
              e.stopPropagation();
              setVoiceEnabled(!voiceEnabled);
              if (isSpeaking && synthRef.current) synthRef.current.cancel();
            }}
            title={voiceEnabled ? "Voice responses ON" : "Voice responses OFF"}
            data-testid="mira-panel-voice-toggle"
          >
            {voiceEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
          </button>
          <Button
            variant="ghost"
            size="sm"
            className="text-white/70 hover:text-white hover:bg-white/10 h-7 w-7 p-0"
            onClick={(e) => { e.stopPropagation(); setIsMinimized(true); }}
          >
            <X className="w-4 h-4" />
          </Button>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 opacity-70" />
          ) : (
            <ChevronDown className="w-4 h-4 opacity-70" />
          )}
        </div>
      </div>
      
      {/* Content */}
      {isExpanded && (
        <CardContent className="p-4 space-y-4">
          {/* Mira's Note */}
          {context?.pillar_note && !showChat && (
            <div className="text-sm text-gray-700">
              <p className="leading-relaxed" dangerouslySetInnerHTML={{ 
                __html: context.pillar_note.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
              }} />
            </div>
          )}
          
          {/* Pet Context Badge */}
          {context?.selected_pet && !showChat && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-white">
                <PawPrint className="w-3 h-3 mr-1" />
                {context.selected_pet.name}
              </Badge>
              {context.selected_pet.breed && (
                <span className="text-xs text-gray-500">{context.selected_pet.breed}</span>
              )}
            </div>
          )}
          
          {/* Quick Chat Interface */}
          {showChat ? (
            <div className="space-y-3">
              {/* Chat Messages */}
              <div className="max-h-48 overflow-y-auto space-y-2">
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`text-sm p-2 rounded-lg ${
                      msg.role === 'user'
                        ? 'bg-slate-100 ml-4'
                        : 'bg-white border border-gray-100'
                    }`}
                  >
                    {msg.content}
                  </div>
                ))}
                {isSending && (
                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Mira is typing...</span>
                  </div>
                )}
              </div>
              
              {/* Chat Input */}
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder={isListening ? "Listening..." : "Ask Mira..."}
                    className={`w-full text-sm px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 ${
                      isListening 
                        ? 'border-cyan-400 ring-2 ring-cyan-400/30' 
                        : 'border-gray-200 focus:ring-purple-500'
                    }`}
                    disabled={isSending}
                  />
                  {/* Inline Mic Button */}
                  {speechSupported && (
                    <button
                      onClick={toggleListening}
                      className={`absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                        isListening 
                          ? 'bg-cyan-400 text-gray-900 animate-pulse' 
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                      title={isListening ? "Stop listening" : "Voice input"}
                      data-testid="mira-panel-mic-btn"
                    >
                      {isListening ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                    </button>
                  )}
                </div>
                <Button
                  size="sm"
                  onClick={sendMessage}
                  disabled={!inputValue.trim() || isSending}
                  className={`bg-gradient-to-r ${config.color} text-white`}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-gray-500"
                onClick={() => setShowChat(false)}
              >
                Back to suggestions
              </Button>
            </div>
          ) : (
            <>
              {/* AI Recommendations from Intelligence Engine */}
              {recommendations.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1">
                    <Lightbulb className="w-3 h-3" />
                    Mira&apos;s Suggestions
                  </p>
                  {recommendations.slice(0, 2).map((rec) => (
                    <div 
                      key={rec.id}
                      className="bg-white p-3 rounded-lg border border-gray-100 hover:border-purple-200 transition-colors cursor-pointer"
                      onClick={() => {
                        trackClick(pillar, rec.id, { type: rec.type });
                        // Send the recommendation as a message to Mira
                        sendDirectMessage(rec.title);
                      }}
                    >
                      <p className="text-sm font-medium text-gray-900">{rec.title}</p>
                      <p className="text-xs text-gray-600 mt-1">{rec.description}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                          {rec.reason}
                        </span>
                        <Button size="sm" variant="ghost" className="h-6 text-xs">
                          {rec.cta} <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Suggested Products */}
              {context?.suggestions?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Suggested for {context.selected_pet?.name || 'your pet'}
                  </p>
                  {context.suggestions.slice(0, 3).map((item) => (
                    <a 
                      key={item.id}
                      href={`/product/${item.id}`}
                      className="flex items-center gap-3 bg-white p-2 rounded-lg border border-gray-100 hover:border-purple-200 hover:bg-purple-50/50 transition-colors cursor-pointer"
                    >
                      {item.image && (
                        <img 
                          src={item.image} 
                          alt={item.name}
                          className="w-10 h-10 object-cover rounded"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-500">₹{item.price}</p>
                      </div>
                      <div className="flex items-center text-purple-600 text-xs font-medium">
                        View
                        <ChevronRight className="w-3 h-3 ml-0.5" />
                      </div>
                    </a>
                  ))}
                </div>
              )}
              
              {/* Quick Prompts - Pillar-specific */}
              {quickPrompts.length > 0 && !showChat && (
                <div className="flex flex-wrap gap-1">
                  {quickPrompts.slice(0, 3).map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => sendDirectMessage(prompt.message)}
                      className="text-xs bg-white border border-gray-200 text-gray-700 px-2 py-1 rounded-full hover:bg-purple-50 hover:border-purple-200 transition-colors"
                      data-testid={`mira-panel-prompt-${idx}`}
                    >
                      {prompt.label}
                    </button>
                  ))}
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => setShowChat(true)}
                  data-testid="mira-quick-chat"
                >
                  <MessageCircle className="w-3 h-3 mr-1" />
                  Ask Mira
                </Button>
                <Button
                  size="sm"
                  className={`flex-1 text-xs bg-gradient-to-r ${config.color} text-white`}
                  onClick={openFullMira}
                  data-testid="mira-full-chat"
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  Plan My {config.name}
                </Button>
              </div>
            </>
          )}
          
          {/* PET SOUL SCORE - ALWAYS SHOW FOR MEMBERS */}
          {!showChat && (
            <div className="pt-2 border-t border-gray-200 space-y-3">
              {/* Pet Soul Score - Always visible to encourage completion */}
              {context?.selected_pet ? (
                <>
                  {/* Has Pet - Show Soul Score */}
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-3 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-medium text-gray-700 flex items-center gap-1">
                        <PawPrint className="w-3 h-3 text-purple-600" />
                        {context.selected_pet.name}&apos;s Soul Score
                      </p>
                      <span className="text-lg font-bold text-purple-600">
                        {context.selected_pet.soul_score || 0}%
                      </span>
                    </div>
                    <div className="w-full bg-purple-100 rounded-full h-2.5">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-2.5 rounded-full transition-all"
                        style={{ width: `${context.selected_pet.soul_score || 0}%` }}
                      />
                    </div>
                    
                    {/* Pet Soul Progress Message */}
                    {(context.selected_pet.soul_score || 0) < 100 && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-purple-700">
                        <Sparkles className="w-3 h-3" />
                        <span>Complete your Pet Soul to unlock personalized care</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Health Vault Quick Status */}
                  <div className="flex gap-2">
                    <div className="flex-1 bg-green-50 p-2 rounded-lg text-center cursor-pointer hover:bg-green-100 transition-colors"
                         onClick={() => window.location.href = `/pet/${context.selected_pet.id}?tab=health`}>
                      <Heart className="w-4 h-4 text-green-600 mx-auto mb-1" />
                      <p className="text-xs font-medium text-green-700">Health Vault</p>
                      <p className="text-xs text-green-600">{context.selected_pet.health_status || 'Update'}</p>
                    </div>
                    <div className="flex-1 bg-blue-50 p-2 rounded-lg text-center cursor-pointer hover:bg-blue-100 transition-colors"
                         onClick={() => window.location.href = `/pet/${context.selected_pet.id}?tab=vaccines`}>
                      <Calendar className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                      <p className="text-xs font-medium text-blue-700">Vaccines</p>
                      <p className="text-xs text-blue-600">{context.selected_pet.vaccines_due || 0} due</p>
                    </div>
                  </div>
                  
                  {/* Gamification - What's Missing */}
                  {(context.selected_pet.soul_score || 0) < 100 && (
                    <div className="bg-amber-50 p-2 rounded-lg">
                      <p className="text-xs font-semibold text-amber-800 flex items-center gap-1 mb-1">
                        <Lightbulb className="w-3 h-3" />
                        Quick wins to boost your score:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {!context.selected_pet.identity?.weight && (
                          <Badge variant="outline" className="text-xs bg-white cursor-pointer hover:bg-amber-100"
                                 onClick={() => window.location.href = `/pet/${context.selected_pet.id}?tab=identity`}>
                            +5% Add weight
                          </Badge>
                        )}
                        {!context.selected_pet.identity?.microchip && (
                          <Badge variant="outline" className="text-xs bg-white cursor-pointer hover:bg-amber-100"
                                 onClick={() => window.location.href = `/pet/${context.selected_pet.id}?tab=identity`}>
                            +5% Add microchip
                          </Badge>
                        )}
                        {!context.selected_pet.health?.allergies?.length && (
                          <Badge variant="outline" className="text-xs bg-white cursor-pointer hover:bg-amber-100"
                                 onClick={() => window.location.href = `/pet/${context.selected_pet.id}?tab=health`}>
                            +10% Add allergies
                          </Badge>
                        )}
                        {!context.selected_pet.personality?.traits?.length && (
                          <Badge variant="outline" className="text-xs bg-white cursor-pointer hover:bg-amber-100"
                                 onClick={() => window.location.href = `/pet/${context.selected_pet.id}?tab=personality`}>
                            +10% Add personality
                          </Badge>
                        )}
                        {!context.selected_pet.preferences?.food_brand && (
                          <Badge variant="outline" className="text-xs bg-white cursor-pointer hover:bg-amber-100"
                                 onClick={() => window.location.href = `/pet/${context.selected_pet.id}?tab=preferences`}>
                            +5% Food preferences
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* 100% Complete Celebration */}
                  {(context.selected_pet.soul_score || 0) >= 100 && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-2 rounded-lg text-center">
                      <p className="text-xs font-bold text-green-700 flex items-center justify-center gap-1">
                        🎉 Soul Complete! You know {context.selected_pet.name} inside out!
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* No Pet - Encourage to Add */}
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-3 rounded-lg text-center">
                    <PawPrint className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-gray-800">Start Your Pet&apos;s Soul</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {user ? 'Add your pet to unlock personalized care' : 'Sign in or join to unlock personalized care'}
                    </p>
                    <div className="mt-2">
                      <div className="w-full bg-purple-100 rounded-full h-2">
                        <div className="bg-gray-300 h-2 rounded-full" style={{ width: '0%' }} />
                      </div>
                      <p className="text-xs text-purple-600 font-medium mt-1">Soul Score: 0%</p>
                    </div>
                    {user ? (
                      <Button
                        size="sm"
                        className="mt-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs"
                        onClick={() => window.location.href = '/pet-soul-onboard'}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add Your Pet
                      </Button>
                    ) : (
                      <div className="mt-3 flex flex-col gap-2">
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs"
                          onClick={() => window.location.href = '/membership'}
                        >
                          <Sparkles className="w-3 h-3 mr-1" />
                          Join Pet Pass
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => window.location.href = '/login'}
                        >
                          Already a member? Sign in
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {/* Benefits of Adding Pet */}
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-gray-600">Unlock with your Pet Soul:</p>
                    <div className="grid grid-cols-2 gap-1">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Heart className="w-3 h-3 text-green-500" /> Health Vault
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className="w-3 h-3 text-blue-500" /> Vaccine Reminders
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Sparkles className="w-3 h-3 text-purple-500" /> AI Recommendations
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Lightbulb className="w-3 h-3 text-amber-500" /> Birthday Alerts
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default MiraContextPanel;

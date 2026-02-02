/**
 * MiraPage - Premium Full-Screen "Ask Mira" Experience
 * 
 * This is the dedicated Mira AI concierge page with:
 * - Full conversation interface
 * - Pet Soul sidebar with pet profile
 * - Rich message formatting
 * - Ticket creation and tracking
 * - Voice input support
 * - Research mode for factual queries
 * - URL params: ?context=fit_weight_loss&preset=message
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { API_URL } from '../utils/api';
import { toast } from 'sonner';
import SEOHead from '../components/SEOHead';
import { useCart } from '../context/CartContext';
import { getPetPhotoUrl } from '../utils/petAvatar';
import {
  Send, Loader2, PawPrint, Sparkles, MessageCircle, 
  Phone, Mail, ChevronDown, Heart, Shield, Star,
  Car, Home, Scissors, UtensilsCrossed, PartyPopper,
  HelpCircle, FileText, AlertTriangle, Crown, Calendar,
  MapPin, Zap, ArrowRight, User, ChevronRight, Mic, MicOff, 
  RotateCcw, History, Search, ArrowLeft, X, ShoppingCart,
  CheckCircle, ExternalLink, List
} from 'lucide-react';

// Pillar Quick Actions
const QUICK_ACTIONS = [
  { id: 'travel', icon: Car, label: 'Travel', color: 'from-blue-500 to-cyan-500' },
  { id: 'stay', icon: Home, label: 'Stay', color: 'from-purple-500 to-violet-500' },
  { id: 'care', icon: Scissors, label: 'Care', color: 'from-green-500 to-emerald-500' },
  { id: 'dine', icon: UtensilsCrossed, label: 'Dine', color: 'from-orange-500 to-amber-500' },
  { id: 'celebrate', icon: PartyPopper, label: 'Celebrate', color: 'from-pink-500 to-rose-500' },
  { id: 'advisory', icon: HelpCircle, label: 'Advice', color: 'from-slate-500 to-gray-500' },
];

// Generate session ID
const generateSessionId = () => {
  const stored = localStorage.getItem('mira_page_session');
  if (stored) return stored;
  const newId = `mira-page-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  localStorage.setItem('mira_page_session', newId);
  return newId;
};

const MiraPage = () => {
  const { user, token } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(generateSessionId);
  const [ticketId, setTicketId] = useState(null);
  const [pillar, setPillar] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  
  // Checklist popup state
  const [showChecklistPopup, setShowChecklistPopup] = useState(false);
  const [checklistData, setChecklistData] = useState(null);
  const [checklistProducts, setChecklistProducts] = useState([]);
  
  // Pet context
  const [pets, setPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [showPetSelector, setShowPetSelector] = useState(false);
  
  // Voice input state
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef(null);
  
  // Voice output state (TTS)
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef(null);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // ElevenLabs TTS function
  const speakText = async (text) => {
    if (!voiceEnabled || !text) return;
    
    try {
      // Clean text for speech
      const cleanText = text
        .replace(/[🎉🐕✨🦴💜🎂🏥☀️🌤️🌙🌟🐾🎒📅📋🔥⭐💪🎯]/g, '')
        .replace(/[*_#]/g, '')
        .replace(/\[.*?\]/g, '')
        .replace(/®|™|©/g, '')
        .trim();
      
      if (!cleanText) return;
      
      setIsSpeaking(true);
      
      const response = await fetch(`${API_URL}/api/tts/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanText })
      });
      
      if (!response.ok) {
        throw new Error('TTS failed');
      }
      
      const data = await response.json();
      
      // Stop any existing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      
      // Play audio
      const audio = new Audio(`data:audio/mpeg;base64,${data.audio_base64}`);
      audioRef.current = audio;
      
      audio.onended = () => {
        setIsSpeaking(false);
      };
      
      audio.onerror = () => {
        setIsSpeaking(false);
      };
      
      await audio.play();
    } catch (error) {
      console.error('TTS error:', error);
      setIsSpeaking(false);
    }
  };

  // Stop speaking
  const stopSpeaking = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsSpeaking(false);
  };

  // Check for speech recognition support
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
        setInput(transcript);
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

  // Toggle voice listening
  const toggleListening = () => {
    if (!speechSupported) {
      toast.error('Voice input is not supported in your browser');
      return;
    }
    
    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.debug('Recognition stop:', e);
      }
      setIsListening(false);
    } else {
      setInput('');
      try {
        // Only start if not already running
        if (recognitionRef.current) {
          recognitionRef.current.start();
          setIsListening(true);
        }
      } catch (e) {
        // If already started, just set the state
        if (e.name === 'InvalidStateError') {
          setIsListening(true);
        } else {
          console.error('Recognition start error:', e);
          toast.error('Could not start voice recognition');
        }
      }
    }
  };

  // Start new conversation
  const startNewConversation = async () => {
    try {
      const response = await fetch(`${API_URL}/api/mira/session/new`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        localStorage.removeItem('mira_page_session');
        const newSessionId = data.session_id;
        localStorage.setItem('mira_page_session', newSessionId);
        setSessionId(newSessionId);
        setTicketId(null);
        setPillar(null);
        
        // Reset messages
        const welcomeMessage = selectedPet 
          ? `Hello${user?.name ? `, ${user.name}` : ''}! I'm Mira, starting a fresh conversation. I see you have **${selectedPet.name}** with you. How can I help you both today?`
          : user?.name 
            ? `Hello, ${user.name}! I'm Mira, starting a fresh conversation. How can I assist you today?`
            : "Hello! I'm Mira, starting a fresh conversation. How can I assist you today?";
        
        setMessages([{
          id: 'welcome',
          role: 'assistant',
          content: welcomeMessage,
          timestamp: new Date().toISOString()
        }]);
        
        toast.success('Started new conversation');
        setShowHistory(false);
      }
    } catch (error) {
      console.error('Error starting new conversation:', error);
      toast.error('Failed to start new conversation');
    }
  };

  // Fetch chat history
  const fetchChatHistory = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/api/mira/history?limit=5`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setChatHistory(data.sessions || []);
      }
    } catch (error) {
      console.debug('Chat history fetch failed:', error);
    }
  };

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input on mount and fetch history
  useEffect(() => {
    inputRef.current?.focus();
    fetchChatHistory();
  }, [token]);

  // Fetch user pets and set initial welcome
  useEffect(() => {
    const fetchContext = async () => {
      try {
        const response = await fetch(`${API_URL}/api/mira/context`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
          body: JSON.stringify({ current_pillar: null })
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.pets?.length > 0) {
            setPets(data.pets);
            if (data.selected_pet) {
              setSelectedPet(data.selected_pet);
            }
          }
          
          // Set personalized welcome message
          const welcomeMessage = data.selected_pet 
            ? `Hello${data.user?.name ? `, ${data.user.name}` : ''}! I'm Mira, your dedicated concierge. I see you have **${data.selected_pet.name}** with you. How can I help you both today?`
            : user?.name 
              ? `Hello, ${user.name}! I'm Mira, your dedicated concierge. How can I assist you today?`
              : "Hello! I'm Mira, The Doggy Company's concierge. I'm here to help with all your pet's needs — from travel and stays to care, dining, and celebrations. How can I assist you today?";
          
          setMessages([{
            id: 'welcome',
            role: 'assistant',
            content: welcomeMessage,
            timestamp: new Date().toISOString()
          }]);
        }
      } catch (error) {
        console.error('Error fetching Mira context:', error);
        setMessages([{
          id: 'welcome',
          role: 'assistant',
          content: "Hello! I'm Mira, your dedicated concierge. How can I help you today?",
          timestamp: new Date().toISOString()
        }]);
      }
    };
    
    fetchContext();
  }, [user, token]);

  // Unified send message function - handles both manual input and preset messages
  const sendMessage = async (e, presetMessage = null) => {
    e?.preventDefault();
    
    const messageContent = presetMessage || input.trim();
    if (!messageContent || isLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageContent,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages
        .filter(m => m.id !== 'welcome')
        .map(m => ({ role: m.role, content: m.content }));

      const response = await fetch(`${API_URL}/api/mira/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          message: messageContent,
          session_id: sessionId,
          source: 'full_page',
          current_pillar: pillar,
          selected_pet_id: selectedPet?.id || null,
          history: history.slice(-10),
          user_context: {
            name: user?.name,
            email: user?.email,
            membership: user?.membership_tier
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update pillar if detected
        if (data.pillar) {
          setPillar(data.pillar);
        }
        
        // Update ticket ID if created
        if (data.ticket_id) {
          setTicketId(data.ticket_id);
        }
        
        // Add assistant response
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          pillar: data.pillar,
          actions: data.actions,
          timestamp: new Date().toISOString(),
          researchMode: data.research_mode
        }]);
      } else {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: "I'm having a brief pause. Could you please repeat that?",
          timestamp: new Date().toISOString()
        }]);
      }
    } catch (error) {
      console.error('Mira chat error:', error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I apologize, but I'm having trouble connecting. Please try again.",
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle URL parameters (context and preset message from goal buttons)
  useEffect(() => {
    const context = searchParams.get('context');
    const presetMessage = searchParams.get('preset');
    
    if (context) {
      // Extract pillar from context (e.g., "fit_weight_loss" -> "fit")
      const pillarFromContext = context.split('_')[0];
      if (pillarFromContext) {
        setPillar(pillarFromContext);
      }
    }
    
    // If there's a preset message, auto-send it (only once)
    if (presetMessage) {
      const decodedMessage = decodeURIComponent(presetMessage);
      
      // Clear the URL params FIRST to prevent re-triggering
      setSearchParams({});
      
      // Auto-send after a brief delay (to let the welcome message show first)
      setTimeout(() => {
        sendMessage(null, decodedMessage);
      }, 1500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Quick action handler
  const handleQuickAction = (actionId) => {
    const prompts = {
      travel: "I need help arranging travel for my pet",
      stay: "I'm looking for a pet-friendly stay",
      care: "I'd like to book a care service - grooming or vet visit",
      dine: "I want to find a pet-friendly restaurant",
      celebrate: "I want to plan a celebration for my pet",
      advisory: "I need some advice about my pet"
    };
    setInput(prompts[actionId] || '');
    inputRef.current?.focus();
  };

  // Handle "View checklist" and similar action buttons from Mira's responses
  const handleChecklistAction = async (actionType, pillarContext) => {
    // Define checklists per pillar
    const CHECKLISTS = {
      stay: {
        title: 'Pet Travel Checklist',
        subtitle: 'Everything you need for the perfect trip',
        items: [
          { text: 'Confirm pet policy with accommodation', tip: 'Call ahead to verify pet size/breed restrictions' },
          { text: 'Pack familiar bedding and toys', tip: 'Reduces anxiety in new environments' },
          { text: 'Bring health certificates', tip: 'Required for most interstate travel' },
          { text: 'Stock up on regular food', tip: 'Avoid sudden diet changes while traveling' },
          { text: 'Update ID tags with travel details', tip: 'Include your mobile number' },
          { text: 'Locate nearby emergency vet', tip: 'Research before you arrive' },
        ],
        action_url: '/shop?category=travel',
        action_text: 'Shop Travel Essentials'
      },
      travel: {
        title: 'Flight Preparation Checklist',
        subtitle: 'Safe travels for your furry friend',
        items: [
          { text: 'Get airline-approved crate', tip: 'Must be large enough for pet to stand and turn' },
          { text: 'Visit vet for health certificate', tip: 'Required within 10 days of travel' },
          { text: 'Complete vaccination records', tip: 'Rabies certification is mandatory' },
          { text: 'Practice crate training', tip: 'Start 2 weeks before travel' },
          { text: 'Avoid feeding 4 hours before flight', tip: 'Prevents motion sickness' },
          { text: 'Attach ID and destination tags', tip: 'Include your contact at destination' },
        ],
        action_url: '/travel',
        action_text: 'Book Pet Travel'
      },
      care: {
        title: 'Grooming Preparation',
        subtitle: 'Get your pet ready for their spa day',
        items: [
          { text: 'Brush coat before appointment', tip: 'Removes loose hair and mats' },
          { text: 'Check for skin issues', tip: 'Alert groomer to any concerns' },
          { text: 'Trim nails if overgrown', tip: 'Or include in grooming package' },
          { text: 'Clean ears gently', tip: 'Or request ear cleaning service' },
          { text: 'Ensure pet is calm', tip: 'A walk before helps release energy' },
        ],
        action_url: '/care',
        action_text: 'Book Grooming'
      },
      celebrate: {
        title: 'Birthday Party Checklist',
        subtitle: 'Make it a paw-some celebration!',
        items: [
          { text: 'Order pet-safe cake', tip: 'No chocolate, xylitol, or grapes' },
          { text: 'Invite furry friends', tip: 'Keep guest list manageable' },
          { text: 'Prepare dog-friendly treats', tip: 'For all guests to enjoy' },
          { text: 'Set up safe play area', tip: 'Remove hazards and breakables' },
          { text: 'Plan photo opportunities', tip: 'Capture the memories!' },
          { text: 'Get birthday bandana/outfit', tip: 'Optional but adorable' },
        ],
        action_url: '/celebrate',
        action_text: 'Shop Party Supplies'
      },
      fit: {
        title: 'Fitness Plan Checklist',
        subtitle: 'Start your pet\'s health journey',
        items: [
          { text: 'Vet checkup before starting', tip: 'Rule out any health issues' },
          { text: 'Set realistic weight goal', tip: '1-2% body weight loss per week is healthy' },
          { text: 'Measure food portions', tip: 'Use a scale for accuracy' },
          { text: 'Schedule daily exercise', tip: 'Consistency is key' },
          { text: 'Track progress weekly', tip: 'Take photos and measurements' },
        ],
        action_url: '/fit',
        action_text: 'Start Fitness Journey'
      }
    };

    const currentPillar = pillarContext || pillar || 'stay';
    const checklist = CHECKLISTS[currentPillar] || CHECKLISTS.stay;
    
    setChecklistData(checklist);
    
    // Fetch related products from backend
    try {
      const response = await fetch(`${API_URL}/api/products?pillar=${currentPillar}&limit=4`);
      if (response.ok) {
        const data = await response.json();
        setChecklistProducts(data.products || []);
      }
    } catch (error) {
      console.debug('Failed to fetch checklist products:', error);
      setChecklistProducts([]);
    }
    
    setShowChecklistPopup(true);
    
    // Record intent (creates ticket)
    try {
      await fetch(`${API_URL}/api/engagement/checklist-viewed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          checklist_type: actionType,
          pillar: currentPillar,
          pet_id: selectedPet?.id,
          pet_name: selectedPet?.name
        })
      });
    } catch (err) {
      console.debug('Checklist view logging:', err);
    }
  };

  // Format message content with markdown-like styling AND action buttons
  const formatContent = (content) => {
    if (!content) return '';
    // Convert **text** to bold - handle multiple occurrences
    let formatted = content.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    // Convert *text* to italic (single asterisks)
    formatted = formatted.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    // Convert newlines to <br>
    formatted = formatted.replace(/\n/g, '<br>');
    return formatted;
  };

  // Check if message contains action keywords like "View checklist"
  const messageHasAction = (content) => {
    if (!content) return false;
    const actionKeywords = ['view checklist', 'checklist', 'view guide', 'see tips', 'preparation list'];
    return actionKeywords.some(kw => content.toLowerCase().includes(kw));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50" data-testid="mira-page">
      {/* SEO Meta Tags */}
      <SEOHead page="mira" path="/mira" />

      <Helmet>
        <title>Ask Mira | The Doggy Company</title>
      </Helmet>
      
      <div className="flex h-screen">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Header - Premium Design with Back Button */}
          <div className="bg-white/90 backdrop-blur-lg border-b border-purple-100 px-4 md:px-6 py-3 md:py-4 sticky top-0 z-20">
            <div className="flex items-center justify-between gap-2">
              {/* Left: Back + Mira Info */}
              <div className="flex items-center gap-2 md:gap-3">
                {/* BACK BUTTON - Prominent on mobile */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    // Navigate back to the pillar page if we have pillar context
                    if (pillar && pillar !== 'general') {
                      navigate(`/${pillar}`);
                    } else if (window.history.length > 2) {
                      // Try to go back if we have history
                      navigate(-1);
                    } else {
                      // Fallback to dashboard
                      navigate('/dashboard');
                    }
                  }}
                  className="w-10 h-10 rounded-full hover:bg-purple-100 transition-colors"
                  data-testid="mira-back-btn"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-700" />
                </Button>
                
                {/* Mira Avatar & Title */}
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 flex items-center justify-center shadow-lg shadow-purple-200 animate-pulse">
                  <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-lg md:text-xl font-bold text-gray-900">Ask Mira</h1>
                  <p className="text-xs md:text-sm text-gray-500">Your Personal Pet Concierge</p>
                </div>
                <span className="sm:hidden text-lg font-bold text-gray-900">Mira</span>
              </div>
              
              {/* Pillar Indicator - Shows where user came from */}
              {pillar && pillar !== 'general' && (
                <Badge 
                  variant="outline" 
                  className="hidden sm:flex items-center gap-1 text-xs capitalize cursor-pointer hover:bg-purple-50"
                  onClick={() => navigate(`/${pillar}`)}
                >
                  Back to {pillar}
                </Badge>
              )}
              {/* Right: Actions */}
              <div className="flex items-center gap-2">
                {/* Pillar Badge */}
                {pillar && (
                  <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-1">
                    {pillar.charAt(0).toUpperCase() + pillar.slice(1)}
                  </Badge>
                )}
                
                {/* Ticket Badge */}
                {ticketId && (
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs hidden sm:flex">
                    {ticketId}
                  </Badge>
                )}
                
                {/* New Chat */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startNewConversation}
                  className="gap-1 text-xs"
                  data-testid="mira-new-conversation"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span className="hidden sm:inline">New</span>
                </Button>
                
                {/* History */}
                {token && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowHistory(!showHistory)}
                    className={`w-9 h-9 ${showHistory ? 'bg-purple-100 text-purple-700' : ''}`}
                    data-testid="mira-history-toggle"
                  >
                    <History className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* History Panel */}
          {showHistory && chatHistory.length > 0 && (
            <div className="bg-white/90 border-b p-4">
              <p className="text-sm font-medium text-gray-600 mb-3">Recent Conversations</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {chatHistory.map((session) => (
                  <div 
                    key={session.session_id}
                    className="p-3 bg-gray-50 rounded-lg border cursor-pointer hover:bg-purple-50 hover:border-purple-200 transition-colors"
                    onClick={() => {
                      setShowHistory(false);
                      toast.info('Loading conversation...');
                    }}
                  >
                    <p className="text-sm font-medium truncate">{session.preview || 'Conversation'}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(session.created_at).toLocaleDateString()} • {session.message_count} msgs
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-10 h-10 text-purple-500" />
                </div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">Start a conversation with Mira</h2>
                <p className="text-gray-500">Ask me anything about pet services, bookings, or recommendations</p>
              </div>
            )}
            
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-br-md'
                      : 'bg-white shadow-sm border border-gray-100 text-gray-800 rounded-bl-md'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-2 text-purple-600">
                      <Sparkles className="w-4 h-4" />
                      <span className="text-xs font-medium">Mira</span>
                      {message.researchMode && (
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Search className="w-3 h-3" />
                          Research Mode
                        </span>
                      )}
                    </div>
                  )}
                  <p 
                    className="text-sm leading-relaxed whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: formatContent(message.content) }}
                  />
                  
                  {/* Action Button - For checklist/guide messages */}
                  {message.role === 'assistant' && messageHasAction(message.content) && (
                    <Button
                      size="sm"
                      className="mt-3 w-full bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 hover:from-purple-200 hover:to-pink-200 border border-purple-200"
                      onClick={() => handleChecklistAction('checklist', pillar)}
                    >
                      <List className="w-4 h-4 mr-2" />
                      View Checklist & Products
                    </Button>
                  )}
                  
                  <p className={`text-xs mt-2 ${message.role === 'user' ? 'text-white/70' : 'text-gray-400'}`}>
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white shadow-sm border border-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex items-center gap-2 text-purple-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Mira is thinking...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          {messages.length <= 1 && (
            <div className="px-6 py-4 bg-white/50 backdrop-blur-sm border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-3">Quick actions</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_ACTIONS.map((action) => (
                  <Button
                    key={action.id}
                    variant="outline"
                    size="sm"
                    className="rounded-full hover:bg-purple-50"
                    onClick={() => handleQuickAction(action.id)}
                  >
                    <action.icon className="w-4 h-4 mr-1" />
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-3 sm:p-4 bg-white border-t border-gray-100">
            <form onSubmit={sendMessage} className="flex gap-2 sm:gap-3">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isListening ? "Listening..." : "Type your message..."}
                className={`flex-1 min-w-0 px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 border rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm ${
                  isListening ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
                }`}
                disabled={isLoading}
                data-testid="mira-input"
              />
              {/* Voice Input Button - Hidden on very small screens if no space */}
              {speechSupported && (
                <Button
                  type="button"
                  onClick={toggleListening}
                  className={`rounded-full w-10 h-10 sm:w-auto sm:px-4 p-0 sm:p-2 flex-shrink-0 flex items-center justify-center ${
                    isListening 
                      ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
                  }`}
                  data-testid="mira-voice-btn"
                >
                  {isListening ? <MicOff className="w-4 h-4 sm:w-5 sm:h-5 text-white" /> : <Mic className="w-4 h-4 sm:w-5 sm:h-5" />}
                </Button>
              )}
              <Button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="rounded-full w-10 h-10 sm:w-auto sm:px-6 p-0 sm:p-2 flex-shrink-0 flex items-center justify-center bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                data-testid="mira-send"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </Button>
            </form>
            <p className="text-xs text-center text-gray-400 mt-2 hidden sm:block">
              Every conversation creates a service desk ticket for complete tracking
            </p>
          </div>
        </div>

        {/* Pet Soul Sidebar - Desktop Only */}
        <div className="hidden lg:block w-80 bg-white border-l border-gray-100 overflow-y-auto">
          <div className="p-6">
            {/* User Section */}
            {user ? (
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{user.name || 'Member'}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>
              </div>
            ) : (
              <Card className="mb-6 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-100">
                <CardContent className="p-4 text-center">
                  <p className="text-sm font-medium text-gray-700 mb-1">Welcome to Mira</p>
                  <p className="text-xs text-gray-500 mb-3">Sign in for personalized assistance</p>
                  <div className="flex flex-col gap-2">
                    <Button 
                      size="sm"
                      className="bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      onClick={() => window.location.href = '/membership'}
                    >
                      Join Pet Pass
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.location.href = '/login'}
                    >
                      Already a member? Sign In
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Pet Selection */}
            {pets.length > 0 && (
              <div className="mb-6">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Your Pets</p>
                <div className="space-y-2">
                  {pets.map((pet) => (
                    <div
                      key={pet.id}
                      className={`p-3 rounded-lg border transition-all ${
                        selectedPet?.id === pet.id 
                          ? 'border-purple-300 bg-purple-50'
                          : 'border-gray-100 hover:border-purple-200 hover:bg-purple-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center cursor-pointer"
                          onClick={() => setSelectedPet(pet)}
                        >
                          <PawPrint className="w-5 h-5 text-amber-600" />
                        </div>
                        <div 
                          className="flex-1 cursor-pointer"
                          onClick={() => setSelectedPet(pet)}
                        >
                          <p className="font-medium text-gray-900">{pet.name}</p>
                          <p className="text-xs text-gray-500">{pet.breed}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {selectedPet?.id === pet.id && (
                            <div className="w-2 h-2 rounded-full bg-purple-500" />
                          )}
                          {/* Link to Pet Profile */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/pet/${pet.id}`);
                            }}
                            className="p-1.5 rounded-full hover:bg-purple-100 transition-colors"
                            title={`View ${pet.name}'s profile`}
                          >
                            <ExternalLink className="w-4 h-4 text-purple-500" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Selected Pet Soul Data */}
            {selectedPet && (
              <div className="mb-6">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                  {selectedPet.name}&apos;s Profile
                </p>
                <Card className="border-purple-100">
                  <CardContent className="p-4 space-y-3">
                    {selectedPet.breed && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Breed</span>
                        <span className="font-medium">{selectedPet.breed}</span>
                      </div>
                    )}
                    {selectedPet.gender && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Gender</span>
                        <span className="font-medium">{selectedPet.gender}</span>
                      </div>
                    )}
                    {selectedPet.travel_style && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Travel Style</span>
                        <span className="font-medium">{selectedPet.travel_style}</span>
                      </div>
                    )}
                    {selectedPet.crate_trained && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Crate Trained</span>
                        <span className="font-medium">{selectedPet.crate_trained}</span>
                      </div>
                    )}
                    {selectedPet.handling_sensitivity && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Handling</span>
                        <span className="font-medium">{selectedPet.handling_sensitivity}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Capabilities */}
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">What Mira Can Do</p>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Car className="w-4 h-4 text-blue-500" />
                  <span>Book travel & transport</span>
                </div>
                <div className="flex items-center gap-2">
                  <Home className="w-4 h-4 text-purple-500" />
                  <span>Find pet-friendly stays</span>
                </div>
                <div className="flex items-center gap-2">
                  <Scissors className="w-4 h-4 text-green-500" />
                  <span>Schedule care services</span>
                </div>
                <div className="flex items-center gap-2">
                  <UtensilsCrossed className="w-4 h-4 text-orange-500" />
                  <span>Reserve dining spots</span>
                </div>
                <div className="flex items-center gap-2">
                  <PartyPopper className="w-4 h-4 text-pink-500" />
                  <span>Plan celebrations</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-slate-500" />
                  <span>Handle emergencies</span>
                </div>
              </div>
            </div>

            {/* Suggestions for Selected Pet */}
            {selectedPet && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  Suggestions for {selectedPet.name}
                </h4>
                <div className="space-y-2">
                  {/* Dynamic suggestions based on pillar context */}
                  <button
                    onClick={() => setInput(`Find the best stay options for ${selectedPet.name}`)}
                    className="w-full flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg hover:from-purple-100 hover:to-pink-100 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                      <Home className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm">Pet-friendly stays</p>
                      <p className="text-xs text-gray-500 truncate">Perfect for {selectedPet.breed || 'your pet'}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>
                  
                  <button
                    onClick={() => setInput(`What grooming does ${selectedPet.name} need?`)}
                    className="w-full flex items-center gap-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg hover:from-green-100 hover:to-emerald-100 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <Scissors className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm">Grooming care</p>
                      <p className="text-xs text-gray-500 truncate">Based on {selectedPet.name}&apos;s coat</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>
                  
                  <button
                    onClick={() => setInput(`Show me food options safe for ${selectedPet.name}`)}
                    className="w-full flex items-center gap-3 p-3 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg hover:from-orange-100 hover:to-amber-100 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                      <UtensilsCrossed className="w-4 h-4 text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm">Safe treats & food</p>
                      <p className="text-xs text-gray-500 truncate">
                        {selectedPet.allergies?.length > 0 
                          ? `Avoiding ${selectedPet.allergies[0]}` 
                          : 'Tailored to diet'}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>
                  
                  <button
                    onClick={() => setInput(`Plan ${selectedPet.name}'s birthday celebration`)}
                    className="w-full flex items-center gap-3 p-3 bg-gradient-to-r from-pink-50 to-rose-50 rounded-lg hover:from-pink-100 hover:to-rose-100 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center">
                      <PartyPopper className="w-4 h-4 text-pink-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm">Plan a celebration</p>
                      <p className="text-xs text-gray-500 truncate">Birthday, gotcha day, etc.</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>
            )}
            
            {/* Quick Contact - Collapsed */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer list-none">
                  <h4 className="text-sm font-semibold text-gray-600 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-green-500" />
                    Need human help?
                  </h4>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-open:rotate-90 transition-transform" />
                </summary>
                <div className="mt-3 space-y-2">
                  <a 
                    href="tel:+919663185747"
                    className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Phone className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-gray-700">+91 96631 85747</span>
                  </a>
                  <a 
                    href="https://wa.me/919663185747"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-gray-700">WhatsApp</span>
                  </a>
                </div>
              </details>
            </div>

            {/* Emergency CTA */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <Button 
                variant="outline" 
                className="w-full border-red-200 text-red-600 hover:bg-red-50"
                onClick={() => setInput('I have an emergency!')}
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Emergency Help
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== CHECKLIST POPUP - Beautiful & Mobile-First ==================== */}
      <Dialog open={showChecklistPopup} onOpenChange={setShowChecklistPopup}>
        <DialogContent className="max-w-lg w-[95vw] max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0 rounded-2xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <List className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{checklistData?.title || 'Your Checklist'}</h3>
                  <p className="text-white/80 text-sm">{checklistData?.subtitle || 'Personalized for your pet'}</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowChecklistPopup(false)}
                className="text-white hover:bg-white/20 rounded-full"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
          
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Checklist Items */}
            {checklistData?.items && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Checklist</h4>
                {checklistData.items.map((item, idx) => (
                  <div 
                    key={idx}
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl hover:bg-purple-50 transition-colors"
                  >
                    <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{item.text || item}</p>
                      {item.tip && (
                        <p className="text-xs text-gray-500 mt-1">{item.tip}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Related Products */}
            {checklistProducts.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                  Recommended Products
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {checklistProducts.map((product, idx) => (
                    <div 
                      key={idx}
                      className="bg-white border border-gray-100 rounded-xl p-3 hover:shadow-md transition-all cursor-pointer"
                      onClick={() => {
                        addToCart({
                          id: product.id,
                          name: product.name || product.title,
                          price: product.price,
                          image: product.image,
                          pillar: product.pillar || pillar
                        });
                        toast.success(`Added ${product.name || product.title} to cart!`);
                      }}
                    >
                      <div className="aspect-square rounded-lg bg-gray-100 mb-2 overflow-hidden">
                        {product.image ? (
                          <img 
                            src={product.image} 
                            alt={product.name || product.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingCart className="w-8 h-8 text-gray-300" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs font-medium text-gray-900 line-clamp-2">{product.name || product.title}</p>
                      {product.price && (
                        <p className="text-sm font-bold text-purple-600 mt-1">₹{product.price}</p>
                      )}
                      <Button 
                        size="sm" 
                        className="w-full mt-2 bg-purple-100 text-purple-700 hover:bg-purple-200 text-xs"
                      >
                        <ShoppingCart className="w-3 h-3 mr-1" />
                        Add to Cart
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Action Button */}
            <div className="pt-3">
              <Button 
                onClick={() => {
                  setShowChecklistPopup(false);
                  if (checklistData?.action_url) {
                    navigate(checklistData.action_url);
                  }
                }}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 py-5"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                {checklistData?.action_text || 'Explore More'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MiraPage;

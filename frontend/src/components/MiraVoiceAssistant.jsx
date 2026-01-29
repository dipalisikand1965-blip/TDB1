/**
 * MiraVoiceAssistant - Voice-enabled guidance layer for Mira
 * 
 * CORE PRINCIPLE: Text is default. Voice is earned. Silence is acceptable.
 * 
 * Features:
 * - Text-first by default (80% of interactions)
 * - Voice only when explicitly triggered (mic tap, wake word, Care/Emergency)
 * - Max 10-12 second voice responses
 * - Escalates to Concierge early
 * - Section-aware behaviour
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { 
  Mic, MicOff, Volume2, VolumeX, X, Sparkles, 
  ShoppingCart, Calendar, Heart, HelpCircle, Loader2,
  Stethoscope, Gift, PawPrint, MessageCircle, Send
} from 'lucide-react';

// Mira's voice personality settings - calm, slow, pauses often
const MIRA_VOICE_CONFIG = {
  rate: 0.85,  // Slower for clarity
  pitch: 1.05, // Natural female pitch
  volume: 0.9
};

// UNIVERSAL OPENING LINE (MANDATORY - NO VARIATION)
const MIRA_OPENING = "Hi, I'm Mira. I can help explain things, guide you to the right place, or connect you with our Concierge.";

// Max voice response time in seconds
const MAX_VOICE_SECONDS = 10;

// Command patterns and responses - Care-first, non-medical guidance
const COMMAND_PATTERNS = [
  // HEALTH ESCALATION - MUST COME FIRST (highest priority)
  {
    patterns: ['sick', 'vomiting', 'diarrhea', 'not eating', 'pain', 'bleeding', 'seizure', 'breathing', 'emergency', 'hurt', 'injured', 'collapsed', 'lethargic'],
    intent: 'health_escalation',
    response: (petName) => `I can hear you're worried about ${petName}, and that's completely understandable. I can't assess this medically, but our Care Concierge can help you right now. Let me connect you.`,
    action: 'navigate',
    path: '/care?urgent=true',
    escalation: true
  },
  {
    patterns: ['medication', 'medicine', 'dose', 'dosage', 'tablet', 'treatment'],
    intent: 'medication_escalation',
    response: (petName) => `For any medication questions about ${petName}, it's safest to speak with a vet or our Care Concierge. I want to make sure you get accurate guidance.`,
    action: 'navigate',
    path: '/care',
    escalation: true
  },
  // STANDARD COMMANDS - Non-medical
  {
    patterns: ['order', 'buy', 'get', 'treats', 'food', 'favorite'],
    intent: 'order_treats',
    response: (petName) => `I'd love to help find something nice for ${petName}! Let me show you some options.`,
    action: 'navigate',
    path: '/shop?category=treats'
  },
  {
    patterns: ['vaccination', 'vaccine', 'next shot', 'due', 'vet visit'],
    intent: 'check_vaccination',
    response: (petName, data) => {
      if (data?.nextVaccination) {
        return `${petName}'s next vaccination is coming up on ${data.nextVaccination}. Would you like me to help you prepare?`;
      }
      return `I don't have ${petName}'s vaccination schedule yet. Our Care team can help you set this up.`;
    },
    action: 'navigate',
    path: '/pet/{petId}?tab=health'
  },
  {
    patterns: ['groom', 'grooming', 'haircut', 'bath', 'spa'],
    intent: 'book_grooming',
    response: (petName) => `A grooming session for ${petName}! Let me show you our trusted grooming partners.`,
    action: 'navigate',
    path: '/care?type=grooming'
  },
  {
    patterns: ['birthday', 'celebration', 'party', 'cake'],
    intent: 'birthday',
    response: (petName) => `How exciting! Let's make ${petName}'s celebration special. What kind of celebration are you planning?`,
    action: 'navigate',
    path: '/celebrate'
  },
  {
    patterns: ['soul score', 'profile', 'score', 'completion'],
    intent: 'soul_score',
    response: (petName, data) => {
      const score = data?.soulScore || 0;
      if (score >= 90) return `${petName}'s Soul Score is ${score}%. That's wonderful - we know ${petName} really well now!`;
      if (score >= 50) return `${petName}'s Soul Score is ${score}%. We're getting to know ${petName} better!`;
      return `${petName}'s Soul Score is ${score}%. Let's answer some questions to help us understand ${petName} better.`;
    }
  },
  {
    patterns: ['recommend', 'suggestion', 'picks', 'show me'],
    intent: 'recommendations',
    response: (petName) => `Based on what I know about ${petName}, here are some options. Want me to show you?`,
    action: 'navigate',
    path: '/shop'
  },
  {
    patterns: ['help', 'what can you do', 'commands'],
    intent: 'help',
    response: (petName) => `I'm here to help you with ${petName}'s everyday needs - treats, grooming, celebrations, and more. For health concerns, our Care Concierge is your best support.`
  },
  {
    patterns: ['hello', 'hi', 'hey'],
    intent: 'greeting',
    response: (petName) => `Hello! How's ${petName} doing? What can I help you with today?`
  },
  {
    patterns: ['thank', 'thanks', 'awesome'],
    intent: 'thanks',
    response: (petName) => `You're welcome! Looking after ${petName} is what I'm here for.`
  },
  {
    patterns: ['bye', 'goodbye'],
    intent: 'goodbye',
    response: (petName) => `Goodbye for now! Give ${petName} a gentle pat from me.`
  }
];

const findCommand = (text) => {
  const lower = text.toLowerCase();
  for (const cmd of COMMAND_PATTERNS) {
    if (cmd.patterns.some(p => lower.includes(p))) return cmd;
  }
  return null;
};

const getFallbackResponse = (petName) => {
  const responses = [
    `I'm here to help with anything ${petName} needs! Try asking about treats, grooming, or vaccinations.`,
    `Not sure I got that. How about ordering some treats for ${petName}?`,
    `I can help with treats, grooming, vet visits, and more! What would you like?`
  ];
  return responses[Math.floor(Math.random() * responses.length)];
};

// Main Voice Assistant Component
// CORE RULE: Text is default. Voice is earned. Silence is acceptable.
const MiraVoiceAssistant = ({ 
  isOpen, 
  onClose, 
  petName = 'your pup', 
  petId,
  petData = {},
  onNavigate,
  voicePreference = 'text', // 'text' or 'voice'
  currentPillar = null // Section-aware behaviour
}) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(voicePreference === 'text'); // Text-first by default
  const [isProcessing, setIsProcessing] = useState(false);
  const [useElevenLabs, setUseElevenLabs] = useState(true);
  const [hasShownOpening, setHasShownOpening] = useState(false);
  
  const recognitionRef = useRef(null);
  const synthRef = useRef(typeof window !== 'undefined' ? window.speechSynthesis : null);
  const audioRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  const API_URL = process.env.REACT_APP_BACKEND_URL;
  
  // Show mandatory opening line when first opened (TEXT only, no voice)
  useEffect(() => {
    if (isOpen && !hasShownOpening && messages.length === 0) {
      // MANDATORY OPENING LINE - NO VARIATION
      setMessages([{
        role: 'mira',
        text: MIRA_OPENING,
        timestamp: new Date()
      }]);
      setHasShownOpening(true);
      // DO NOT auto-speak - text is default
    }
  }, [isOpen, hasShownOpening, messages.length]);
  
  // ElevenLabs TTS function - max 10-12 seconds
  const speakWithElevenLabs = useCallback(async (text) => {
    if (isMuted) return;
    
    // Enforce max length - if text too long, truncate
    const words = text.split(' ');
    const maxWords = 30; // Roughly 10-12 seconds at normal speech rate
    const truncatedText = words.length > maxWords 
      ? words.slice(0, maxWords).join(' ') + '...'
      : text;
    
    try {
      const response = await fetch(`${API_URL}/api/tts/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: truncatedText })
      });
      
      if (!response.ok) {
        throw new Error('ElevenLabs TTS failed');
      }
      
      const data = await response.json();
      
      // Create audio from base64
      if (data.audio_base64) {
        const audioData = `data:audio/mpeg;base64,${data.audio_base64}`;
        if (audioRef.current) {
          audioRef.current.pause();
        }
        audioRef.current = new Audio(audioData);
        audioRef.current.onplay = () => setIsSpeaking(true);
        audioRef.current.onended = () => setIsSpeaking(false);
        audioRef.current.onerror = () => setIsSpeaking(false);
        await audioRef.current.play();
        return true;
      }
    } catch (err) {
      console.log('ElevenLabs TTS unavailable, falling back to Web Speech API');
      setUseElevenLabs(false);
      return false;
    }
    return false;
  }, [API_URL, isMuted]);
  
  // Remove emojis from text for natural speech
  const cleanTextForSpeech = useCallback((text) => {
    // Remove common emojis
    let cleaned = text
      .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons
      .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Symbols & pictographs
      .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transport & map
      .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '') // Flags
      .replace(/[\u{2600}-\u{26FF}]/gu, '')   // Misc symbols
      .replace(/[\u{2700}-\u{27BF}]/gu, '')   // Dingbats
      .replace(/🐾|🐕|🐶|🎂|🎉|❤️|💜|✨|🌟|⭐|😊|💪|🏆|🔥|💯|🎁|🦴|💊|🛒|📦/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Fix "Mira" pronunciation to "Meera"
    cleaned = cleaned.replace(/\bMira\b/gi, 'Meera');
    
    return cleaned;
  }, []);
  
  // Web Speech API with Indian English voice preference
  const speakWithWebSpeech = useCallback((text) => {
    if (!synthRef.current || isMuted) return;
    
    const cleanedText = cleanTextForSpeech(text);
    if (!cleanedText) return;
    
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(cleanedText);
    utterance.rate = MIRA_VOICE_CONFIG.rate;
    utterance.pitch = MIRA_VOICE_CONFIG.pitch;
    
    const voices = synthRef.current.getVoices();
    
    // Priority order for voice selection (best Indian female voices)
    const voicePreference = [
      // Google Indian English (best quality)
      v => v.name.includes('Google') && v.lang === 'en-IN',
      // Any Indian English voice
      v => v.lang === 'en-IN' || v.lang === 'en_IN',
      // Hindi voices (natural Indian accent)
      v => v.lang.startsWith('hi'),
      // Microsoft Indian voices
      v => v.name.includes('Neerja') || v.name.includes('Heera'),
      // Google UK female (similar intonation)
      v => v.name.includes('Google UK English Female'),
      // Any female voice
      v => v.name.toLowerCase().includes('female') || 
           v.name.includes('Samantha') || 
           v.name.includes('Zira') ||
           v.name.includes('Karen')
    ];
    
    for (const preference of voicePreference) {
      const voice = voices.find(preference);
      if (voice) {
        utterance.voice = voice;
        break;
      }
    }
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    
    synthRef.current.speak(utterance);
  }, [isMuted, cleanTextForSpeech]);
  
  // Main speak function - tries ElevenLabs first, then falls back
  const speak = useCallback(async (text) => {
    if (isMuted) return;
    
    if (useElevenLabs) {
      const success = await speakWithElevenLabs(text);
      if (!success) {
        speakWithWebSpeech(text);
      }
    } else {
      speakWithWebSpeech(text);
    }
  }, [isMuted, useElevenLabs, speakWithElevenLabs, speakWithWebSpeech]);
  
  const addMiraMessage = useCallback((text) => {
    setMessages(prev => [...prev, { role: 'mira', text, timestamp: new Date() }]);
    if (!isMuted) speak(text);
  }, [isMuted, speak]);
  
  const handleSend = useCallback((text = inputText) => {
    if (!text.trim()) return;
    
    // Add user message
    setMessages(prev => [...prev, { role: 'user', text, timestamp: new Date() }]);
    setInputText('');
    setIsProcessing(true);
    
    // Process command
    setTimeout(() => {
      const command = findCommand(text);
      const response = command 
        ? command.response(petName, { soulScore: petData?.overall_score || 0 })
        : getFallbackResponse(petName);
      
      addMiraMessage(response);
      setIsProcessing(false);
      
      // Navigate if command has action
      if (command?.action === 'navigate' && command.path && onNavigate) {
        setTimeout(() => {
          onNavigate(command.path.replace('{petId}', petId || ''));
          onClose();
        }, 2000);
      }
    }, 800);
  }, [inputText, petName, petData, petId, addMiraMessage, onNavigate, onClose]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Welcome message - only run once when component opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcome = `Hey there! 🐾 I'm Mira! How can I help you and ${petName} today? You can type or tap the mic to speak!`;
      // Use setTimeout to avoid synchronous setState in effect
      setTimeout(() => {
        setMessages([{ role: 'mira', text: welcome, timestamp: new Date() }]);
        if (!isMuted) speak(welcome);
      }, 0);
    }
  }, [isOpen, petName, messages.length, isMuted, speak]);
  
  // Initialize speech recognition
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-IN';
    
    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      setInputText(text);
      handleSend(text);
    };
    
    recognition.onerror = (e) => {
      console.error('Speech error:', e.error);
      setIsListening(false);
      if (e.error === 'no-speech') {
        addMiraMessage("I didn't hear anything. Tap the mic and try again!");
      }
    };
    
    recognition.onend = () => setIsListening(false);
    
    recognitionRef.current = recognition;
    
    return () => recognition.abort();
  }, [handleSend, addMiraMessage]);
  
  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) {
      addMiraMessage("Voice isn't available in this browser. But you can type your message!");
      return;
    }
    
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  }, [isListening, addMiraMessage]);
  
  const quickCommands = [
    { icon: ShoppingCart, text: `Order ${petName}'s treats`, color: 'bg-orange-100 text-orange-700' },
    { icon: Stethoscope, text: 'Book grooming', color: 'bg-teal-100 text-teal-700' },
    { icon: Calendar, text: 'Next vaccination?', color: 'bg-blue-100 text-blue-700' },
    { icon: Heart, text: `${petName}'s soul score`, color: 'bg-pink-100 text-pink-700' }
  ];
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <Card className="w-full sm:max-w-md h-[85vh] sm:h-[600px] bg-white sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col overflow-hidden" data-testid="mira-voice-assistant">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 p-4 text-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl backdrop-blur-sm ${isSpeaking ? 'animate-bounce-gentle' : ''}`}>
                🐕‍🦺
              </div>
              <div>
                <h2 className="font-bold text-lg">Chat with Mira</h2>
                <p className="text-white/80 text-xs">Your AI Pet Concierge</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-purple-50/50 to-white">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl p-3 ${
                msg.role === 'user' 
                  ? 'bg-purple-600 text-white rounded-br-md' 
                  : 'bg-white border border-purple-100 shadow-sm rounded-bl-md'
              }`}>
                {msg.role === 'mira' && (
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-purple-600">🐕‍🦺 Mira</span>
                  </div>
                )}
                <p className={`text-sm leading-relaxed ${msg.role === 'user' ? 'text-white' : 'text-gray-700'}`}>
                  {msg.text}
                </p>
              </div>
            </div>
          ))}
          
          {isProcessing && (
            <div className="flex justify-start">
              <div className="bg-white border border-purple-100 rounded-2xl rounded-bl-md p-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />
                  <span className="text-sm text-gray-500">Mira is typing...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        {/* Quick Commands */}
        <div className="px-4 py-2 border-t bg-white flex-shrink-0">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {quickCommands.map((cmd, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(cmd.text)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${cmd.color} hover:opacity-80 transition-opacity`}
              >
                <cmd.icon className="w-3.5 h-3.5" />
                {cmd.text}
              </button>
            ))}
          </div>
        </div>
        
        {/* Input Area */}
        <div className="p-4 border-t bg-white flex-shrink-0">
          <div className="flex items-center gap-2">
            {/* Mute Button */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-2 rounded-full transition-colors ${isMuted ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
              title={isMuted ? 'Unmute Mira' : 'Mute Mira'}
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            
            {/* Text Input */}
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={isListening ? "Listening..." : "Type a message..."}
                className="w-full px-4 py-2.5 pr-10 rounded-full border border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none text-sm"
                disabled={isListening}
              />
              {isListening && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                </div>
              )}
            </div>
            
            {/* Voice Button */}
            <button
              onClick={toggleListening}
              className={`p-3 rounded-full transition-all shadow-md ${
                isListening 
                  ? 'bg-red-500 text-white animate-pulse' 
                  : 'bg-gradient-to-br from-purple-500 to-pink-500 text-white hover:scale-105'
              }`}
              title={isListening ? 'Stop listening' : 'Speak to Mira'}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
            
            {/* Send Button */}
            <button
              onClick={() => handleSend()}
              disabled={!inputText.trim() || isProcessing}
              className="p-3 bg-purple-600 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-700 transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          
          {/* Voice Status */}
          {isListening && (
            <p className="text-center text-xs text-purple-600 mt-2 animate-pulse">
              🎤 Listening... Speak now!
            </p>
          )}
        </div>
      </Card>
    </div>
  );
};

// Floating button to trigger voice assistant
export const MiraVoiceButton = ({ onClick, petName }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-24 right-20 z-40 w-14 h-14 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 rounded-full shadow-lg flex items-center justify-center text-white hover:scale-110 transition-transform group"
      title={`Chat with Mira`}
      data-testid="mira-voice-button"
    >
      <MessageCircle className="w-6 h-6" />
      
      {/* Tooltip */}
      <span className="absolute right-full mr-3 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
        💬 Chat with Mira
      </span>
    </button>
  );
};

export default MiraVoiceAssistant;

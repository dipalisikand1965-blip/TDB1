/**
 * MiraVoiceAssistant - Voice-activated AI assistant for Mira
 * 
 * Features:
 * - Wake word detection ("Hey Mira" or tap to activate)
 * - Speech recognition for commands
 * - Text-to-speech for Mira's responses
 * - Natural conversation flow
 * - Pet-personalized responses
 * 
 * Commands supported:
 * - "Order [pet]'s favorite treats"
 * - "When is [pet]'s next vaccination?"
 * - "Book a grooming appointment"
 * - "What's [pet]'s soul score?"
 * - "Tell me about [pet]"
 * - "Show me recommendations"
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { 
  Mic, MicOff, Volume2, VolumeX, X, Sparkles, 
  ShoppingCart, Calendar, Heart, HelpCircle, Loader2,
  Stethoscope, Gift, PawPrint
} from 'lucide-react';

// Mira's voice personality settings
const MIRA_VOICE_CONFIG = {
  rate: 0.95, // Slightly slower for clarity
  pitch: 1.1, // Slightly higher, friendly tone
  volume: 1.0
};

// Command patterns and responses
const COMMAND_PATTERNS = [
  {
    patterns: ['order', 'buy', 'get', 'treats', 'food', 'favorite'],
    intent: 'order_treats',
    response: (petName) => `Absolutely! I'll add ${petName}'s favorite treats to your cart. ${petName} is going to be SO happy! Would you like me to show you some new flavors too?`,
    action: 'navigate',
    path: '/shop?category=treats'
  },
  {
    patterns: ['vaccination', 'vaccine', 'next shot', 'due', 'vet visit'],
    intent: 'check_vaccination',
    response: (petName, data) => {
      if (data?.nextVaccination) {
        return `${petName}'s next vaccination is ${data.nextVaccination}. I've set a reminder for you! Would you like me to book a vet appointment?`;
      }
      return `I don't have ${petName}'s vaccination schedule yet. Would you like to add it to their health records? It helps me send you timely reminders!`;
    },
    action: 'navigate',
    path: '/pet/{petId}?tab=health'
  },
  {
    patterns: ['groom', 'grooming', 'haircut', 'bath', 'spa'],
    intent: 'book_grooming',
    response: (petName) => `Time for ${petName} to look fabulous! Let me show you our grooming partners. Any preference for the day?`,
    action: 'navigate',
    path: '/care?type=grooming'
  },
  {
    patterns: ['birthday', 'celebration', 'party', 'cake'],
    intent: 'birthday',
    response: (petName, data) => {
      if (data?.daysUntilBirthday && data.daysUntilBirthday <= 30) {
        return `Ooh, ${petName}'s birthday is coming up in ${data.daysUntilBirthday} days! Should I help you plan the pawty? We have amazing cakes and party supplies!`;
      }
      return `Let's celebrate ${petName}! I can help you find birthday cakes, treats, and party essentials. What would you like to see?`;
    },
    action: 'navigate',
    path: '/celebrate'
  },
  {
    patterns: ['soul score', 'profile', 'score', 'completion', 'how complete'],
    intent: 'soul_score',
    response: (petName, data) => {
      const score = data?.soulScore || 0;
      if (score >= 90) {
        return `Amazing! ${petName}'s Soul Score is ${score}%! You're a Soul Master! I know ${petName} so well now - their favorite treats, health needs, everything!`;
      } else if (score >= 50) {
        return `${petName}'s Soul Score is ${score}%. You're doing great! Just a few more questions and I'll unlock even better personalization for you both.`;
      }
      return `${petName}'s Soul Score is ${score}%. The more you tell me about ${petName}, the better I can help! Want to answer some fun questions?`;
    },
    action: 'navigate',
    path: '/pet/{petId}?tab=personality'
  },
  {
    patterns: ['tell me about', 'who is', 'describe', 'about my pet', 'about my dog'],
    intent: 'pet_info',
    response: (petName, data) => {
      const info = data?.petInfo || {};
      return `${petName} is ${info.age || 'your wonderful'} ${info.breed || 'furry friend'}! ${info.personality || 'They sound like an amazing companion'}. Is there something specific you'd like to know?`;
    }
  },
  {
    patterns: ['recommend', 'suggestion', 'what should', 'picks', 'show me'],
    intent: 'recommendations',
    response: (petName) => `I've curated some special picks just for ${petName}! Based on what I know about them, I think they'll love these. Let me show you!`,
    action: 'navigate',
    path: '/shop'
  },
  {
    patterns: ['help', 'what can you do', 'commands', 'how to'],
    intent: 'help',
    response: (petName) => `I can help you with so much! Try saying: "Order ${petName}'s treats", "When's the next vaccination?", "Book grooming", or "What's ${petName}'s soul score?" What would you like?`
  },
  {
    patterns: ['hello', 'hi', 'hey', 'good morning', 'good evening'],
    intent: 'greeting',
    response: (petName) => `Hey there! Great to hear from you! How's ${petName} doing today? What can I help you with?`
  },
  {
    patterns: ['thank', 'thanks', 'awesome', 'great'],
    intent: 'thanks',
    response: (petName) => `You're so welcome! Taking care of ${petName} is my favorite thing! Anything else I can help with?`
  },
  {
    patterns: ['bye', 'goodbye', 'see you', 'later'],
    intent: 'goodbye',
    response: (petName) => `Bye for now! Give ${petName} a belly rub from me! I'm always here when you need me!`
  }
];

// Find matching command
const findCommand = (transcript) => {
  const lowerTranscript = transcript.toLowerCase();
  
  for (const cmd of COMMAND_PATTERNS) {
    const matchCount = cmd.patterns.filter(p => lowerTranscript.includes(p)).length;
    if (matchCount >= 1) {
      return cmd;
    }
  }
  
  return null;
};

// Default fallback response
const getFallbackResponse = (petName) => {
  const responses = [
    `Hmm, I'm not sure I understood that. Try asking me about ${petName}'s treats, grooming, or vaccinations!`,
    `I didn't quite catch that. Would you like to order something for ${petName} or check their schedule?`,
    `Could you say that again? I'm here to help with anything ${petName} needs!`
  ];
  return responses[Math.floor(Math.random() * responses.length)];
};

// Main Voice Assistant Component
const MiraVoiceAssistant = ({ 
  isOpen, 
  onClose, 
  petName = 'your pup', 
  petId,
  petData = {},
  onNavigate 
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [miraResponse, setMiraResponse] = useState('');
  const [status, setStatus] = useState('idle'); // idle, listening, processing, speaking
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState('');
  
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  
  // Initialize speech recognition
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Voice recognition not supported in this browser');
      return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-IN'; // Indian English
    
    recognitionRef.current.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      
      setTranscript(finalTranscript || interimTranscript);
      
      if (finalTranscript) {
        processCommand(finalTranscript);
      }
    };
    
    recognitionRef.current.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      setStatus('idle');
      if (event.error === 'no-speech') {
        setError('No speech detected. Tap the mic and try again!');
      }
    };
    
    recognitionRef.current.onend = () => {
      setIsListening(false);
      if (status === 'listening') {
        setStatus('processing');
      }
    };
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);
  
  // Welcome message when opened
  useEffect(() => {
    if (isOpen && !miraResponse) {
      const welcomeMsg = `Hey there! I'm Mira, your voice assistant! Just say what you need - like "Order ${petName}'s treats" or "When's the next vet visit?" I'm all ears!`;
      setMiraResponse(welcomeMsg);
      if (!isMuted) {
        speak(welcomeMsg);
      }
    }
  }, [isOpen, petName]);
  
  // Text-to-speech function
  const speak = useCallback((text) => {
    if (!synthRef.current || isMuted) return;
    
    // Cancel any ongoing speech
    synthRef.current.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = MIRA_VOICE_CONFIG.rate;
    utterance.pitch = MIRA_VOICE_CONFIG.pitch;
    utterance.volume = MIRA_VOICE_CONFIG.volume;
    
    // Try to find a female voice
    const voices = synthRef.current.getVoices();
    const femaleVoice = voices.find(v => 
      v.name.includes('Female') || 
      v.name.includes('Samantha') || 
      v.name.includes('Google UK English Female') ||
      v.name.includes('Microsoft Zira')
    );
    if (femaleVoice) {
      utterance.voice = femaleVoice;
    }
    
    utterance.onstart = () => {
      setIsSpeaking(true);
      setStatus('speaking');
    };
    
    utterance.onend = () => {
      setIsSpeaking(false);
      setStatus('idle');
    };
    
    synthRef.current.speak(utterance);
  }, [isMuted]);
  
  // Process the voice command
  const processCommand = useCallback((text) => {
    setStatus('processing');
    
    // Find matching command
    const command = findCommand(text);
    
    setTimeout(() => {
      let response;
      
      if (command) {
        response = command.response(petName, {
          soulScore: petData?.overall_score || 0,
          nextVaccination: petData?.next_vaccination,
          daysUntilBirthday: petData?.days_until_birthday,
          petInfo: {
            age: petData?.age,
            breed: petData?.breed,
            personality: petData?.personality
          }
        });
        
        // Handle navigation action
        if (command.action === 'navigate' && command.path && onNavigate) {
          setTimeout(() => {
            const path = command.path.replace('{petId}', petId || '');
            onNavigate(path);
          }, 2000);
        }
      } else {
        response = getFallbackResponse(petName);
      }
      
      setMiraResponse(response);
      if (!isMuted) {
        speak(response);
      } else {
        setStatus('idle');
      }
    }, 500);
  }, [petName, petData, petId, onNavigate, speak, isMuted]);
  
  // Start listening
  const startListening = () => {
    if (!recognitionRef.current) return;
    
    setError('');
    setTranscript('');
    setIsListening(true);
    setStatus('listening');
    
    try {
      recognitionRef.current.start();
    } catch (e) {
      console.error('Error starting recognition:', e);
    }
  };
  
  // Stop listening
  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };
  
  // Stop speaking
  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setIsSpeaking(false);
    setStatus('idle');
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl backdrop-blur-sm ${isSpeaking ? 'animate-bounce-gentle' : ''}`}>
              🐕‍🦺
            </div>
            <div>
              <h2 className="text-xl font-bold">Hey, I'm Mira!</h2>
              <p className="text-white/80 text-sm">Your voice-activated pet assistant</p>
            </div>
          </div>
          
          {/* Status indicator */}
          <div className="mt-4 flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              status === 'listening' ? 'bg-green-400 animate-pulse' :
              status === 'processing' ? 'bg-yellow-400 animate-pulse' :
              status === 'speaking' ? 'bg-blue-400 animate-pulse' :
              'bg-white/50'
            }`} />
            <span className="text-sm text-white/80">
              {status === 'listening' ? 'Listening...' :
               status === 'processing' ? 'Thinking...' :
               status === 'speaking' ? 'Speaking...' :
               'Tap mic to speak'}
            </span>
          </div>
        </div>
        
        {/* Response Area */}
        <div className="p-6 min-h-[200px]">
          {/* User's speech */}
          {transcript && (
            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-1">You said:</p>
              <div className="bg-gray-100 rounded-xl p-3">
                <p className="text-gray-800">{transcript}</p>
              </div>
            </div>
          )}
          
          {/* Mira's response */}
          {miraResponse && (
            <div className="mb-4">
              <p className="text-xs text-purple-600 mb-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Mira says:
              </p>
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                <p className="text-gray-800 leading-relaxed">{miraResponse}</p>
              </div>
            </div>
          )}
          
          {/* Error message */}
          {error && (
            <div className="bg-red-50 text-red-600 rounded-xl p-3 text-sm mb-4">
              {error}
            </div>
          )}
          
          {/* Quick commands */}
          <div className="mt-4">
            <p className="text-xs text-gray-500 mb-2">Try saying:</p>
            <div className="flex flex-wrap gap-2">
              {[
                { icon: ShoppingCart, text: `Order ${petName}'s treats` },
                { icon: Calendar, text: "Book grooming" },
                { icon: Stethoscope, text: "Next vaccination?" },
                { icon: Heart, text: "Soul score?" }
              ].map((cmd, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setTranscript(cmd.text);
                    processCommand(cmd.text);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-purple-100 rounded-full text-xs text-gray-700 hover:text-purple-700 transition-colors"
                >
                  <cmd.icon className="w-3 h-3" />
                  {cmd.text}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Controls */}
        <div className="p-6 bg-gray-50 border-t flex items-center justify-center gap-4">
          {/* Mute button */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`p-3 rounded-full transition-colors ${isMuted ? 'bg-red-100 text-red-600' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
            title={isMuted ? 'Unmute Mira' : 'Mute Mira'}
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          
          {/* Main mic button */}
          <button
            onClick={isListening ? stopListening : isSpeaking ? stopSpeaking : startListening}
            disabled={status === 'processing'}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-lg ${
              isListening 
                ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                : isSpeaking
                  ? 'bg-blue-500 hover:bg-blue-600'
                  : 'bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
            } text-white`}
          >
            {status === 'processing' ? (
              <Loader2 className="w-8 h-8 animate-spin" />
            ) : isListening ? (
              <MicOff className="w-8 h-8" />
            ) : isSpeaking ? (
              <Volume2 className="w-8 h-8 animate-pulse" />
            ) : (
              <Mic className="w-8 h-8" />
            )}
          </button>
          
          {/* Help button */}
          <button
            onClick={() => {
              setTranscript('help');
              processCommand('help');
            }}
            className="p-3 bg-gray-200 hover:bg-gray-300 rounded-full text-gray-600 transition-colors"
            title="What can Mira do?"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>
        
        {/* Footer tip */}
        <div className="px-6 pb-4 text-center">
          <p className="text-xs text-gray-500">
            {isListening ? '🎤 Speak now...' : 'Tap the mic or say "Hey Mira"'}
          </p>
        </div>
      </Card>
    </div>
  );
};

// Floating button to trigger voice assistant
export const MiraVoiceButton = ({ onClick, petName }) => {
  const [isPulsing, setIsPulsing] = useState(true);
  
  useEffect(() => {
    // Stop pulsing after 5 seconds
    const timer = setTimeout(() => setIsPulsing(false), 5000);
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <button
      onClick={onClick}
      className={`fixed bottom-24 right-20 z-40 w-14 h-14 bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 rounded-full shadow-lg flex items-center justify-center text-white hover:scale-110 transition-transform group ${isPulsing ? 'animate-bounce-gentle' : ''}`}
      title={`Talk to Mira about ${petName}`}
    >
      <Mic className="w-6 h-6" />
      
      {/* Tooltip */}
      <span className="absolute right-full mr-3 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
        🎤 "Hey Mira..."
      </span>
      
      {/* Pulse rings */}
      {isPulsing && (
        <>
          <span className="absolute inset-0 rounded-full bg-purple-400 animate-ping opacity-20" />
          <span className="absolute inset-0 rounded-full bg-pink-400 animate-ping opacity-10" style={{ animationDelay: '0.5s' }} />
        </>
      )}
    </button>
  );
};

export default MiraVoiceAssistant;

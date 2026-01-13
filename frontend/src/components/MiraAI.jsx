import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';

// Simple Markdown Parser for Links and Bold text
const formatMessage = (text) => {
  if (!text) return null;
  
  // 1. Split by newlines to handle paragraphs
  const paragraphs = text.split('\n');
  
  return paragraphs.map((paragraph, pIndex) => {
    if (!paragraph.trim()) return <br key={pIndex} />;
    
    // 2. Process bold (**text**)
    const parts = paragraph.split(/(\*\*.*?\*\*|\[.*?\]\(.*?\))/g);
    
    return (
      <p key={pIndex} className="mb-2 last:mb-0">
        {parts.map((part, index) => {
          // Bold
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={index}>{part.slice(2, -2)}</strong>;
          }
          // Link [Text](URL)
          if (part.startsWith('[') && part.includes('](') && part.endsWith(')')) {
            const match = part.match(/\[(.*?)\]\((.*?)\)/);
            if (match) {
              return (
                <a 
                  key={index} 
                  href={match[2]} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-200 underline hover:text-blue-100"
                >
                  {match[1]}
                </a>
              );
            }
          }
          // Plain text
          return part;
        })}
      </p>
    );
  });
};

const MiraAI = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const [membershipInfo, setMembershipInfo] = useState(null);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      text: "Good day. I'm Mira, The Doggy Bakery Concierge®.\n\nI am your dedicated Super Concierge for absolutely anything pet-related.\n\nFrom finding the perfect vet in Paris to booking a pet-friendly stay in Tokyo, or simply advising on the best cake for a 5th birthday—I am at your service.\n\nHow may I assist you today?",
      suggestions: [
        'Find a vet nearby',
        'Pet travel rules',
        'Plan a birthday',
        'Pet-friendly cafes'
      ]
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Listen for custom event from Concierge Page
  useEffect(() => {
    const handleOpenMira = (event) => {
      setIsOpen(true);
      if (event.detail && event.detail.mode) {
        const mode = event.detail.mode;
        let initialText = "How may I assist you?";
        
        switch (mode) {
          case 'vet': initialText = "I see you're looking for veterinary care. Please tell me your city and what you need."; break;
          case 'travel': initialText = "Planning a trip? Ask me about rules, agents, or pet-friendly airlines."; break;
          case 'grooming': initialText = "Time for a spa day? Tell me where you are located."; break;
          case 'boarding': initialText = "Need a safe stay? Where should I look for boarding?"; break;
          default: initialText = "How can I help with your concierge request?";
        }

        setMessages(prev => [...prev, { id: Date.now(), type: 'bot', text: initialText }]);
      }
    };
    
    window.addEventListener('openMiraAI', handleOpenMira);
    return () => window.removeEventListener('openMiraAI', handleOpenMira);
  }, []);

  // Safety Filter
  const checkSafety = (text) => {
    const lower = text.toLowerCase();
    const medicalKeywords = ['vomit', 'blood', 'sick', 'pain', 'dying', 'poison', 'emergency', 'fracture', 'broken leg', 'swallowed', 'fever', 'seizure'];
    const illegalKeywords = ['buy dog', 'sell dog', 'fight', 'drug', 'illegal', 'smuggle', 'weapon'];

    if (medicalKeywords.some(k => lower.includes(k))) {
      return {
        isUnsafe: true,
        response: {
          text: "⚠️ **Medical Disclaimer**: I am an AI concierge, not a veterinarian.\n\nYour message suggests a potential medical concern. Please contact a qualified vet immediately.\n\nI can help you find an emergency clinic nearby if you tell me your location, but I cannot give medical advice.",
          suggestions: ['Find emergency vet']
        }
      };
    }

    if (illegalKeywords.some(k => lower.includes(k))) {
      return {
        isUnsafe: true,
        response: {
          text: "I cannot assist with this request. Mira Concierge strictly adheres to ethical guidelines and local laws.\n\nHow else may I help you with responsible pet care?",
          suggestions: ['Plan a celebration']
        }
      };
    }

    return { isUnsafe: false };
  };

    const getAiResponse = async (userMessage) => {
    // 1. Safety Check
    const safetyCheck = checkSafety(userMessage);
    if (safetyCheck.isUnsafe) {
      return safetyCheck.response;
    }

    // 2. Call Backend
    try {
      // Prepare history
      const history = messages.map(m => ({
        role: m.type === 'user' ? 'user' : 'assistant',
        content: m.text
      }));

      const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      const res = await fetch(`${API_URL}/api/mira/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            message: userMessage,
            history: history,
            session_id: sessionId
        })
      });
      
      const data = await res.json();
      // Update session ID if returned
      if (data.session_id) {
        setSessionId(data.session_id);
      }
      return {
        text: data.response || "I apologize, I'm having trouble connecting right now.",
        suggestions: []
      };
    } catch (e) {
      console.error(e);
      return {
        text: "I seem to be having trouble reaching my knowledge base. Please try again in a moment.",
        suggestions: ['Try again']
      };
    }
  };

  const handleSend = async (message = inputValue) => {
    if (!message.trim()) return;

    // Add user message
    const userMessage = { id: Date.now(), type: 'user', text: message };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Get AI Response
    const response = await getAiResponse(message);
    
    // Add Bot Message
    const botMessage = {
      id: Date.now() + 1,
      type: 'bot',
      text: response.text,
      suggestions: response.suggestions
    };
    
    setMessages(prev => [...prev, botMessage]);
    setIsTyping(false);
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-gradient-to-br from-purple-600 via-pink-600 to-purple-700 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform duration-300 group"
        >
          <div className="relative">
            <Sparkles className="w-7 h-7 text-white animate-pulse" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
          </div>
          <div className="absolute -top-2 -left-2 w-20 h-20 bg-purple-400 rounded-full opacity-20 animate-ping"></div>
        </button>
      )}

      {/* Chat Widget */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 z-50 w-96 h-[600px] shadow-2xl flex flex-col overflow-hidden border-2 border-purple-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-700 p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
                </div>
                <div>
                  <h3 className="font-bold text-lg">Mira</h3>
                  <p className="text-xs text-white/80">Super Concierge®</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((message) => (
              <div key={message.id}>
                <div className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      message.type === 'user'
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                        : 'bg-white shadow-md text-gray-800'
                    }`}
                  >
                    {message.type === 'user' ? (
                        <p className="text-sm">{message.text}</p>
                    ) : (
                        <div className="text-sm leading-relaxed">
                            {formatMessage(message.text)}
                        </div>
                    )}
                  </div>
                </div>
                {message.suggestions && message.suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3 ml-2">
                    {message.suggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSend(suggestion)}
                        className="px-3 py-1.5 text-xs bg-white border-2 border-purple-200 text-purple-600 rounded-full hover:bg-purple-50 hover:border-purple-400 transition-all font-medium"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white shadow-md rounded-2xl px-4 py-3">
                  <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 bg-white border-t">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask Mira anything..."
                className="flex-1"
              />
              <Button
                onClick={() => handleSend()}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                size="icon"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </>
  );
};

export default MiraAI;

import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Dog, Calendar, Scissors, Heart, MapPin, Utensils, Plane } from 'lucide-react';
import { API_URL } from '../utils/api';

const API = API_URL;

// Quick reply suggestions based on context
const getQuickReplies = (lastResponse, petName) => {
  const lower = lastResponse?.toLowerCase() || '';
  
  // Birthday context
  if (lower.includes('birthday') || lower.includes('party') || lower.includes('celebration')) {
    return [
      { text: `Just want to spoil ${petName}`, icon: Heart },
      { text: 'Small cozy celebration', icon: Heart },
      { text: 'Invite some dog friends', icon: Dog },
    ];
  }
  
  // Walker context
  if (lower.includes('walker') || lower.includes('walk')) {
    return [
      { text: 'Morning walks', icon: Calendar },
      { text: 'Evening walks', icon: Calendar },
      { text: 'Any time works', icon: Calendar },
    ];
  }
  
  // Grooming context
  if (lower.includes('groom') || lower.includes('haircut') || lower.includes('bath')) {
    return [
      { text: 'Full grooming session', icon: Scissors },
      { text: 'Just a bath', icon: Scissors },
      { text: 'Light trim only', icon: Scissors },
    ];
  }
  
  // Food/treats context
  if (lower.includes('food') || lower.includes('treat') || lower.includes('diet')) {
    return [
      { text: 'Healthy treats', icon: Utensils },
      { text: 'Special occasion treats', icon: Utensils },
      { text: 'Diet recommendations', icon: Utensils },
    ];
  }
  
  // Travel context
  if (lower.includes('travel') || lower.includes('trip') || lower.includes('vacation')) {
    return [
      { text: 'Road trip', icon: Plane },
      { text: 'Flying with pet', icon: Plane },
      { text: 'Pet-friendly hotels', icon: MapPin },
    ];
  }
  
  // Default suggestions
  return [
    { text: `Birthday party for ${petName}`, icon: Heart },
    { text: `Need a dog walker`, icon: Dog },
    { text: `Grooming appointment`, icon: Scissors },
    { text: `Travel planning`, icon: Plane },
  ];
};

const MiraPurePage = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [petName, setPetName] = useState('Mystique');
  const [sessionId] = useState(`pure-${Date.now()}`);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Get quick replies based on last Mira message
  const lastMiraMessage = messages.filter(m => m.role === 'assistant').pop()?.content || '';
  const quickReplies = getQuickReplies(lastMiraMessage, petName);

  const sendMessage = async (text) => {
    if (!text.trim() || isLoading) return;

    const userMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API}/api/mira-pure/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          pet_name: petName,
          session_id: sessionId,
          conversation_history: messages.map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      });

      const data = await response.json();
      
      if (data.response) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: data.response 
        }]);
      } else {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: "I'm having trouble connecting. Let me try again." 
        }]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Something went wrong. Please try again." 
      }]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleQuickReply = (text) => {
    sendMessage(text);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">Mira Pure</h1>
                <p className="text-xs text-slate-400">Soulful AI • No hardcoded logic</p>
              </div>
            </div>
            
            {/* Pet name input */}
            <div className="flex items-center gap-2">
              <Dog className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={petName}
                onChange={(e) => setPetName(e.target.value)}
                className="bg-slate-800 text-white text-sm px-3 py-1.5 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none w-28"
                placeholder="Pet name"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="max-w-2xl mx-auto px-4 py-6 pb-48">
        {messages.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-10 h-10 text-purple-400" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Hi! I'm Mira</h2>
            <p className="text-slate-400 mb-8">
              I'm here to help with {petName}. No walls of text, no nonsense—just real help.
            </p>
            
            {/* Initial suggestions */}
            <div className="flex flex-wrap justify-center gap-2">
              {quickReplies.map((reply, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickReply(reply.text)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 hover:text-white rounded-full border border-white/10 hover:border-purple-500/50 transition-all text-sm"
                >
                  <reply.icon className="w-4 h-4" />
                  {reply.text}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] px-4 py-3 rounded-2xl ${
                    msg.role === 'user'
                      ? 'bg-purple-600 text-white rounded-br-md'
                      : 'bg-slate-800 text-slate-100 rounded-bl-md'
                  }`}
                >
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="w-3 h-3 text-purple-400" />
                      <span className="text-xs text-purple-400 font-medium">Mira</span>
                    </div>
                  )}
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            
            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-800 text-slate-100 px-4 py-3 rounded-2xl rounded-bl-md">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3 h-3 text-purple-400 animate-pulse" />
                    <span className="text-sm text-slate-400">Mira is thinking...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Quick Replies - Above Input */}
      {messages.length > 0 && !isLoading && (
        <div className="fixed bottom-24 left-0 right-0 z-10">
          <div className="max-w-2xl mx-auto px-4">
            <div className="flex flex-wrap gap-2 justify-center">
              {quickReplies.map((reply, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickReply(reply.text)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white rounded-full border border-white/10 hover:border-purple-500/50 transition-all text-xs backdrop-blur-xl"
                >
                  <reply.icon className="w-3 h-3" />
                  {reply.text}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-white/10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <form onSubmit={handleSubmit} className="flex items-center gap-3">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask anything about ${petName}...`}
              className="flex-1 bg-slate-800 text-white px-4 py-3 rounded-xl border border-white/10 focus:border-purple-500 focus:outline-none text-sm"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-3 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-xl transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
          
          <p className="text-center text-xs text-slate-500 mt-2">
            Mira Pure • GPT-5.1 • No hardcoded logic
          </p>
        </div>
      </div>
    </div>
  );
};

export default MiraPurePage;

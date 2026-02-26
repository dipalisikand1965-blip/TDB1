import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Sparkles, Dog, Calendar, Scissors, Heart, MapPin, Utensils, Plane, 
         ShoppingBag, GraduationCap, Bell, Settings, ChevronDown, Sun, Cloud,
         Clock, Star, MessageCircle, Package, Stethoscope, Home, User, Activity } from 'lucide-react';
import { API_URL } from '../utils/api';

const API = API_URL;

// OS Tabs configuration
const OS_TABS = [
  { id: 'today', label: 'TODAY', icon: Sun, color: 'from-amber-500 to-orange-500' },
  { id: 'picks', label: 'PICKS', icon: Sparkles, color: 'from-purple-500 to-pink-500' },
  { id: 'services', label: 'SERVICES', icon: Package, color: 'from-blue-500 to-cyan-500' },
  { id: 'learn', label: 'LEARN', icon: GraduationCap, color: 'from-green-500 to-emerald-500' },
  { id: 'concierge', label: 'CONCIERGE', icon: MessageCircle, color: 'from-rose-500 to-pink-500' },
];

// Quick replies based on context and active tab
const getQuickReplies = (activeTab, petName, lastResponse) => {
  const lower = lastResponse?.toLowerCase() || '';
  
  // Context-aware replies
  if (lower.includes('birthday') || lower.includes('party')) {
    return [
      { text: `Just want to spoil ${petName}`, icon: Heart },
      { text: 'Small cozy celebration at home', icon: Home },
      { text: 'Invite dog friends over', icon: Dog },
    ];
  }
  
  if (lower.includes('walker') || lower.includes('walk')) {
    return [
      { text: 'Morning walks work best', icon: Sun },
      { text: 'Evening walks preferred', icon: Clock },
      { text: 'Flexible on timing', icon: Calendar },
    ];
  }
  
  if (lower.includes('grooming') || lower.includes('groom')) {
    return [
      { text: 'Full spa day', icon: Sparkles },
      { text: 'Just a bath please', icon: Activity },
      { text: 'Light trim only', icon: Scissors },
    ];
  }
  
  // Tab-specific defaults
  switch (activeTab) {
    case 'today':
      return [
        { text: `How is ${petName} doing today?`, icon: Heart },
        { text: 'Any reminders for today?', icon: Bell },
        { text: 'Weather check for walks', icon: Cloud },
      ];
    case 'picks':
      return [
        { text: `Show me treats for ${petName}`, icon: ShoppingBag },
        { text: 'Birthday gift ideas', icon: Heart },
        { text: 'New toy recommendations', icon: Star },
      ];
    case 'services':
      return [
        { text: 'Need a dog walker', icon: Dog },
        { text: 'Book grooming session', icon: Scissors },
        { text: 'Schedule vet visit', icon: Stethoscope },
      ];
    case 'learn':
      return [
        { text: `Training tips for ${petName}`, icon: GraduationCap },
        { text: 'Nutrition advice', icon: Utensils },
        { text: 'Health care guides', icon: Heart },
      ];
    case 'concierge':
      return [
        { text: `Plan a birthday party for ${petName}`, icon: Heart },
        { text: 'Arrange travel for us', icon: Plane },
        { text: 'Find pet-friendly places', icon: MapPin },
      ];
    default:
      return [
        { text: `Birthday party for ${petName}`, icon: Heart },
        { text: 'I need a dog walker', icon: Dog },
        { text: 'Grooming appointment', icon: Scissors },
      ];
  }
};

const MiraPureOSPage = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pets, setPets] = useState([]);
  const [activePet, setActivePet] = useState(null);
  const [activeTab, setActiveTab] = useState('concierge');
  const [showPetSelector, setShowPetSelector] = useState(false);
  const [sessionId] = useState(`pure-os-${Date.now()}`);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Fetch pets on mount
  useEffect(() => {
    const fetchPets = async () => {
      try {
        const response = await fetch(`${API}/api/pets?email=dipali@clubconcierge.in`);
        if (response.ok) {
          const data = await response.json();
          if (data.pets && data.pets.length > 0) {
            setPets(data.pets);
            setActivePet(data.pets[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching pets:', error);
      }
    };
    fetchPets();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const lastMiraMessage = messages.filter(m => m.role === 'assistant').pop()?.content || '';
  const quickReplies = getQuickReplies(activeTab, activePet?.name || 'your pet', lastMiraMessage);

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
          pet_id: activePet?._id || activePet?.id,
          pet_name: activePet?.name,
          user_email: 'dipali@clubconcierge.in',
          session_id: sessionId,
          active_tab: activeTab,
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
          content: data.response,
          actions: data.actions
        }]);
      } else {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: "Let me try that again..." 
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

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    // Clear messages when switching tabs for fresh context
    if (messages.length > 0) {
      setMessages([]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-slate-900/90 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo & Title */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">Mira Pure</h1>
                <p className="text-xs text-slate-400">Pet Life OS • GPT-5.1</p>
              </div>
            </div>
            
            {/* Pet Selector */}
            <div className="relative">
              <button
                onClick={() => setShowPetSelector(!showPetSelector)}
                className="flex items-center gap-2 px-3 py-2 bg-slate-800/80 hover:bg-slate-700/80 rounded-xl border border-white/10 transition-all"
              >
                {activePet ? (
                  <>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm">
                      {activePet.name?.[0]}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-white">{activePet.name}</p>
                      <p className="text-xs text-slate-400">{activePet.soul_data?.soul_completeness || 0}% Soul</p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </>
                ) : (
                  <span className="text-sm text-slate-400">Select Pet</span>
                )}
              </button>
              
              {/* Pet Dropdown */}
              {showPetSelector && pets.length > 0 && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-slate-800/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden z-30">
                  {pets.map((pet) => (
                    <button
                      key={pet._id || pet.id}
                      onClick={() => {
                        setActivePet(pet);
                        setShowPetSelector(false);
                        setMessages([]); // Clear chat for new pet
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700/50 transition-colors ${
                        activePet?.name === pet.name ? 'bg-purple-500/20' : ''
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold">
                        {pet.name?.[0]}
                      </div>
                      <div className="text-left flex-1">
                        <p className="text-sm font-medium text-white">{pet.name}</p>
                        <p className="text-xs text-slate-400">{pet.breed}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-purple-400">{pet.soul_data?.soul_completeness || 0}%</p>
                        <p className="text-xs text-slate-500">Soul</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* OS Tabs */}
        <div className="max-w-4xl mx-auto px-4 pb-2">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            {OS_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? `bg-gradient-to-r ${tab.color} text-white shadow-lg`
                      : 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-4 pb-40 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            {/* Active Pet Card */}
            {activePet && (
              <div className="mb-8 p-6 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-white/10 max-w-md mx-auto">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-2xl">
                    {activePet.name?.[0]}
                  </div>
                  <div className="text-left">
                    <h2 className="text-xl font-bold text-white">{activePet.name}</h2>
                    <p className="text-sm text-slate-400">{activePet.breed} • {activePet.age}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                          style={{ width: `${activePet.soul_data?.soul_completeness || 0}%` }}
                        />
                      </div>
                      <span className="text-xs text-purple-400">{activePet.soul_data?.soul_completeness || 0}% Soul</span>
                    </div>
                  </div>
                </div>
                
                {/* Soul Traits */}
                {activePet.soul_data?.personality && (
                  <div className="flex flex-wrap gap-1.5">
                    {(Array.isArray(activePet.soul_data.personality) 
                      ? activePet.soul_data.personality 
                      : [activePet.soul_data.personality]
                    ).slice(0, 4).map((trait, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded-full text-xs">
                        {trait}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Welcome Message */}
            <div className="mb-8">
              <Sparkles className="w-12 h-12 text-purple-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">
                Hi! I'm Mira
              </h2>
              <p className="text-slate-400 text-sm max-w-md mx-auto">
                {activePet 
                  ? `I know ${activePet.name} well. Ask me anything - no walls of text, just real help.`
                  : "Select a pet above to get started."
                }
              </p>
            </div>
            
            {/* Quick Suggestions */}
            <div className="flex flex-wrap justify-center gap-2">
              {quickReplies.map((reply, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickReply(reply.text)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 hover:text-white rounded-xl border border-white/10 hover:border-purple-500/50 transition-all text-sm"
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
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-3 h-3 text-purple-400" />
                      <span className="text-xs text-purple-400 font-medium">Mira</span>
                    </div>
                  )}
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  
                  {/* Action buttons if present */}
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {msg.actions.map((action, aIdx) => (
                        <button
                          key={aIdx}
                          className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg text-xs transition-colors"
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {/* Loading */}
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
      </main>

      {/* Quick Replies - Above Input */}
      {messages.length > 0 && !isLoading && (
        <div className="fixed bottom-24 left-0 right-0 z-10">
          <div className="max-w-4xl mx-auto px-4">
            <div className="flex flex-wrap gap-2 justify-center">
              {quickReplies.map((reply, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickReply(reply.text)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white rounded-full border border-white/10 hover:border-purple-500/50 transition-all text-xs backdrop-blur-xl"
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
        <div className="max-w-4xl mx-auto px-4 py-4">
          <form onSubmit={handleSubmit} className="flex items-center gap-3">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={activePet ? `Ask anything about ${activePet.name}...` : 'Select a pet to start...'}
              className="flex-1 bg-slate-800 text-white px-4 py-3 rounded-xl border border-white/10 focus:border-purple-500 focus:outline-none text-sm"
              disabled={isLoading || !activePet}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading || !activePet}
              className="p-3 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-xl transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
          
          <p className="text-center text-xs text-slate-500 mt-2">
            Mira Pure OS • Soulful AI • No hardcoded logic
          </p>
        </div>
      </div>
    </div>
  );
};

export default MiraPureOSPage;

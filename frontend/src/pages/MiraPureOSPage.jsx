import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Dog, Calendar, Scissors, Heart, MapPin, Utensils, Plane, 
         ShoppingBag, GraduationCap, Bell, ChevronDown, Sun, Cloud,
         Clock, Star, MessageCircle, Package, Stethoscope, Home, Dumbbell,
         Hotel, Briefcase, HelpCircle, Camera, Gift, Coffee } from 'lucide-react';
import { API_URL } from '../utils/api';

const API = API_URL;

// All 10 Pillars with their icons and colors
const PILLARS = [
  { id: 'celebrate', label: 'Celebrate', icon: Gift, color: 'from-pink-500 to-rose-500', emoji: '🎂' },
  { id: 'dine', label: 'Dine', icon: Utensils, color: 'from-orange-500 to-amber-500', emoji: '🍖' },
  { id: 'care', label: 'Care', icon: Heart, color: 'from-red-500 to-pink-500', emoji: '💝' },
  { id: 'travel', label: 'Travel', icon: Plane, color: 'from-blue-500 to-cyan-500', emoji: '✈️' },
  { id: 'stay', label: 'Stay', icon: Hotel, color: 'from-purple-500 to-violet-500', emoji: '🏨' },
  { id: 'enjoy', label: 'Enjoy', icon: Coffee, color: 'from-emerald-500 to-teal-500', emoji: '🎾' },
  { id: 'fit', label: 'Fit', icon: Dumbbell, color: 'from-lime-500 to-green-500', emoji: '🏃' },
  { id: 'learn', label: 'Learn', icon: GraduationCap, color: 'from-indigo-500 to-blue-500', emoji: '📚' },
  { id: 'advisory', label: 'Advisory', icon: HelpCircle, color: 'from-yellow-500 to-orange-500', emoji: '💡' },
  { id: 'services', label: 'Services', icon: Briefcase, color: 'from-slate-500 to-gray-500', emoji: '🔧' },
];

// Quick replies based on pillar and conversation
const getQuickReplies = (activePillar, petName, lastResponse) => {
  const lower = lastResponse?.toLowerCase() || '';
  
  // Context-aware from conversation
  if (lower.includes('birthday') || lower.includes('party')) {
    return [
      { text: `Just want to spoil ${petName}`, icon: Heart },
      { text: 'Cozy celebration at home', icon: Home },
      { text: 'Invite dog friends', icon: Dog },
    ];
  }
  if (lower.includes('walker') || lower.includes('walk')) {
    return [
      { text: 'Morning walks', icon: Sun },
      { text: 'Evening walks', icon: Clock },
      { text: 'Flexible timing', icon: Calendar },
    ];
  }
  if (lower.includes('groom') || lower.includes('spa')) {
    return [
      { text: 'Full spa session', icon: Sparkles },
      { text: 'Just a bath', icon: Heart },
      { text: 'Light trim', icon: Scissors },
    ];
  }
  
  // Pillar-specific
  switch (activePillar) {
    case 'celebrate':
      return [
        { text: `Birthday party for ${petName}`, icon: Gift },
        { text: 'Gotcha day celebration', icon: Heart },
        { text: 'Photo session', icon: Camera },
      ];
    case 'dine':
      return [
        { text: `Healthy treats for ${petName}`, icon: Utensils },
        { text: 'Special meal ideas', icon: Star },
        { text: 'Diet recommendations', icon: Heart },
      ];
    case 'care':
      return [
        { text: 'Book a grooming session', icon: Scissors },
        { text: 'Need a dog walker', icon: Dog },
        { text: 'Vet checkup', icon: Stethoscope },
      ];
    case 'travel':
      return [
        { text: 'Plan a trip together', icon: Plane },
        { text: 'Pet-friendly hotels', icon: Hotel },
        { text: 'Travel checklist', icon: Package },
      ];
    case 'stay':
      return [
        { text: 'Pet boarding options', icon: Hotel },
        { text: 'Pet sitter needed', icon: Home },
        { text: 'Daycare for a day', icon: Sun },
      ];
    case 'enjoy':
      return [
        { text: 'Dog parks nearby', icon: MapPin },
        { text: 'Pet-friendly cafes', icon: Coffee },
        { text: 'Playdate ideas', icon: Dog },
      ];
    case 'fit':
      return [
        { text: 'Exercise routine', icon: Dumbbell },
        { text: 'Weight management', icon: Heart },
        { text: 'Activity tracking', icon: Clock },
      ];
    case 'learn':
      return [
        { text: 'Training tips', icon: GraduationCap },
        { text: 'Behavior help', icon: HelpCircle },
        { text: 'Health guides', icon: Heart },
      ];
    default:
      return [
        { text: `How is ${petName} today?`, icon: Heart },
        { text: 'Show me recommendations', icon: Sparkles },
        { text: 'I need help with something', icon: HelpCircle },
      ];
  }
};

// Picks data based on pillar (would come from backend in production)
const getPillarPicks = (pillar, petName, allergies = []) => {
  const isChickenFree = allergies.includes('chicken');
  
  const allPicks = {
    celebrate: [
      { id: 'c1', name: 'Custom Photo Mug', desc: 'Start your day with your best friend\'s face', price: 'Concierge creates', icon: '☕' },
      { id: 'c2', name: 'Photo Coaster Set', desc: 'Protect surfaces with pet love', price: 'Concierge creates', icon: '🥤' },
      { id: 'c3', name: 'Custom Name Bandana', desc: 'Stylish bandana with embroidered name', price: 'Concierge creates', icon: '🎀' },
      { id: 'c4', name: 'AI Pet Portrait', desc: 'Artistic portrait generated from photos', price: 'Concierge creates', icon: '🖼️' },
      { id: 'c5', name: 'Custom Collar Tag', desc: 'Engraved with name and phone', price: 'Concierge creates', icon: '🏷️' },
      { id: 'c6', name: 'Custom Lookalike Plush', desc: 'A plush toy that looks like your pet', price: 'Concierge creates', icon: '🧸' },
    ],
    dine: [
      { id: 'd1', name: 'Premium Wet Food', desc: isChickenFree ? 'Chicken-free recipe' : 'High protein formula', price: '₹450/pack', icon: '🥫' },
      { id: 'd2', name: 'Birthday Cake', desc: isChickenFree ? 'Chicken-free, dog-safe' : 'Dog-safe celebration cake', price: '₹650', icon: '🎂' },
      { id: 'd3', name: 'Dental Treats', desc: 'Keeps teeth clean naturally', price: '₹320/pack', icon: '🦷' },
      { id: 'd4', name: 'Freeze-dried Treats', desc: 'Single ingredient, healthy', price: '₹480', icon: '🍖' },
    ],
    care: [
      { id: 'care1', name: 'Dog Walking', desc: 'Professional walker for daily walks', price: '₹300/walk', icon: '🚶' },
      { id: 'care2', name: 'Grooming & Spa', desc: 'Full grooming session', price: 'From ₹800', icon: '✂️' },
      { id: 'care3', name: 'Vet Home Visit', desc: 'Veterinarian comes to you', price: '₹1,500', icon: '🏥' },
      { id: 'care4', name: 'Pet Sitting', desc: 'In-home pet care', price: '₹500/day', icon: '🏠' },
    ],
    travel: [
      { id: 't1', name: 'Pet-Friendly Hotels', desc: 'Curated accommodations', price: 'Varies', icon: '🏨' },
      { id: 't2', name: 'Travel Kit', desc: 'Everything for the journey', price: '₹2,200', icon: '🧳' },
      { id: 't3', name: 'Pet Taxi', desc: 'Safe pet transport', price: 'From ₹500', icon: '🚗' },
    ],
    stay: [
      { id: 's1', name: 'Premium Boarding', desc: 'Luxury pet hotel stay', price: '₹1,200/night', icon: '🏨' },
      { id: 's2', name: 'Home Pet Sitter', desc: 'Sitter stays at your home', price: '₹800/day', icon: '🏠' },
      { id: 's3', name: 'Daycare', desc: 'Supervised play all day', price: '₹600/day', icon: '☀️' },
    ],
    enjoy: [
      { id: 'e1', name: 'Dog Park Visit', desc: 'Find the best parks nearby', price: 'Free', icon: '🌳' },
      { id: 'e2', name: 'Pet Cafe Booking', desc: 'Reserve at pet-friendly spots', price: 'Varies', icon: '☕' },
      { id: 'e3', name: 'Playdate Matching', desc: 'Find friends for your pet', price: 'Free', icon: '🐕' },
    ],
    fit: [
      { id: 'f1', name: 'Fitness Assessment', desc: 'Check your pet\'s fitness level', price: '₹500', icon: '💪' },
      { id: 'f2', name: 'Exercise Plan', desc: 'Custom workout routine', price: 'Concierge creates', icon: '📋' },
      { id: 'f3', name: 'Swimming Session', desc: 'Low-impact exercise', price: '₹800', icon: '🏊' },
    ],
    learn: [
      { id: 'l1', name: 'Basic Training', desc: 'Obedience fundamentals', price: '₹2,000/session', icon: '📚' },
      { id: 'l2', name: 'Behavior Consultation', desc: 'Address specific issues', price: '₹1,500', icon: '🧠' },
      { id: 'l3', name: 'Puppy School', desc: 'Socialization & basics', price: '₹5,000/course', icon: '🎓' },
    ],
    advisory: [
      { id: 'a1', name: 'Nutrition Advice', desc: 'Diet planning help', price: 'Free', icon: '🥗' },
      { id: 'a2', name: 'Health Questions', desc: 'General wellness guidance', price: 'Free', icon: '❤️' },
      { id: 'a3', name: 'Breed Guide', desc: 'Breed-specific info', price: 'Free', icon: '📖' },
    ],
    services: [
      { id: 'sv1', name: 'All Services', desc: 'Browse all available services', price: 'Varies', icon: '🔧' },
      { id: 'sv2', name: 'My Requests', desc: 'Track your service requests', price: '-', icon: '📋' },
      { id: 'sv3', name: 'Concierge Chat', desc: 'Talk to our team', price: 'Free', icon: '💬' },
    ],
  };
  
  return allPicks[pillar] || allPicks.celebrate;
};

const MiraPureOSPage = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pets, setPets] = useState([]);
  const [activePet, setActivePet] = useState(null);
  const [activePillar, setActivePillar] = useState('celebrate');
  const [showPetSelector, setShowPetSelector] = useState(false);
  const [sessionId] = useState(`pure-os-${Date.now()}`);
  const [showPicksPanel, setShowPicksPanel] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Fetch pets on mount
  useEffect(() => {
    const fetchPets = async () => {
      try {
        const response = await fetch(`${API}/api/mira-pure/pets?email=dipali@clubconcierge.in`);
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
  const quickReplies = getQuickReplies(activePillar, activePet?.name || 'your pet', lastMiraMessage);
  const pillarPicks = getPillarPicks(activePillar, activePet?.name, activePet?.health_data?.allergies || []);

  const sendMessage = async (text) => {
    if (!text.trim() || isLoading) return;

    const userMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setShowPicksPanel(false); // Hide picks when chatting

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
          active_pillar: activePillar,
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
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Let me try that again..." 
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

  const handlePickClick = async (pick) => {
    // Send message to create service request
    const msg = `I'd like to get ${pick.name} for ${activePet?.name}`;
    sendMessage(msg);
  };

  const handlePillarChange = (pillarId) => {
    setActivePillar(pillarId);
    setShowPicksPanel(true);
    // Clear messages when switching pillars for fresh context
    setMessages([]);
  };

  const allergies = activePet?.health_data?.allergies || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-slate-900/90 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">Mira Pure</h1>
                <p className="text-xs text-pink-400">♡ Mira knows {activePet?.name || 'your pet'}</p>
              </div>
            </div>
            
            {/* Pet Selector */}
            <div className="relative">
              <button
                onClick={() => setShowPetSelector(!showPetSelector)}
                className="flex items-center gap-2 px-3 py-2 bg-slate-800/80 hover:bg-slate-700/80 rounded-xl border border-white/10"
              >
                {activePet && (
                  <>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm">
                      {activePet.name?.[0]}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-white">{activePet.name}</p>
                      <p className="text-xs text-purple-400">{activePet.soul_data?.soul_completeness || 0}% Soul</p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </>
                )}
              </button>
              
              {showPetSelector && pets.length > 0 && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-slate-800/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden z-30">
                  {pets.map((pet) => (
                    <button
                      key={pet._id || pet.id}
                      onClick={() => {
                        setActivePet(pet);
                        setShowPetSelector(false);
                        setMessages([]);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700/50 ${
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
                      <span className="text-xs text-purple-400">{pet.soul_data?.soul_completeness || 0}%</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Pillar Tabs */}
        <div className="max-w-6xl mx-auto px-4 pb-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {PILLARS.map((pillar) => {
              const Icon = pillar.icon;
              const isActive = activePillar === pillar.id;
              return (
                <button
                  key={pillar.id}
                  onClick={() => handlePillarChange(pillar.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? `bg-gradient-to-r ${pillar.color} text-white shadow-lg`
                      : 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <span>{pillar.emoji}</span>
                  {pillar.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-4 pb-40">
        {/* Picks Panel - Shows when no conversation */}
        {showPicksPanel && messages.length === 0 && (
          <div className="mb-6">
            {/* Section Title */}
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-pink-400" />
              <h2 className="text-sm font-semibold text-white">PERSONALIZED FOR {activePet?.name?.toUpperCase()}</h2>
            </div>
            <p className="text-xs text-pink-400/80 mb-4">Unique items featuring your pet - Concierge creates these</p>
            
            {/* Picks Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {pillarPicks.map((pick) => (
                <div
                  key={pick.id}
                  className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-xl p-4 border border-purple-500/20 hover:border-purple-500/50 transition-all group"
                >
                  <div className="text-3xl mb-3">{pick.icon}</div>
                  <h3 className="text-sm font-semibold text-white mb-1">{pick.name}</h3>
                  <p className="text-xs text-slate-400 mb-3 line-clamp-2">{pick.desc}</p>
                  <p className="text-xs text-pink-400 mb-3">{pick.price}</p>
                  <button
                    onClick={() => handlePickClick(pick)}
                    className="w-full py-2 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white text-xs font-medium rounded-lg transition-all"
                  >
                    Create for {activePet?.name}
                  </button>
                </div>
              ))}
            </div>
            
            {/* Concierge Section */}
            <div className="mt-8">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-pink-400" />
                <h2 className="text-sm font-semibold text-white">CONCIERGE® ARRANGES FOR {activePet?.name?.toUpperCase()}</h2>
              </div>
              <p className="text-xs text-slate-400 mb-4">We'll source and arrange everything</p>
              
              {/* Chat prompt */}
              <div className="bg-slate-800/50 rounded-xl p-4 border border-white/10">
                <p className="text-sm text-slate-300 mb-3">Ask for anything. If it needs action, we'll open a request and handle it in Services.</p>
                <div className="flex flex-wrap gap-2">
                  {quickReplies.map((reply, idx) => (
                    <button
                      key={idx}
                      onClick={() => sendMessage(reply.text)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white rounded-full text-xs transition-all"
                    >
                      <reply.icon className="w-3 h-3" />
                      {reply.text}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Chat Messages */}
        {messages.length > 0 && (
          <div className="space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] px-4 py-3 rounded-2xl ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-br-md'
                      : 'bg-slate-800 text-slate-100 rounded-bl-md'
                  }`}
                >
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-3 h-3 text-pink-400" />
                      <span className="text-xs text-pink-400 font-medium">Mira</span>
                    </div>
                  )}
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  
                  {/* Action Results */}
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="mt-4 space-y-3">
                      {msg.actions.map((action, aIdx) => (
                        <div key={aIdx}>
                          {/* Service Created */}
                          {action.type === 'service_created' && action.data?.success && (
                            <div className="bg-emerald-500/10 rounded-xl p-3 border border-emerald-500/20">
                              <p className="text-xs text-emerald-400 font-medium mb-1">✓ Service Request Created</p>
                              <p className="text-sm text-white">Ticket: {action.data.ticket_id}</p>
                              <p className="text-xs text-slate-400 mt-1">{action.data.message}</p>
                            </div>
                          )}
                          
                          {/* Picks */}
                          {action.type === 'picks' && action.data?.picks && (
                            <div className="bg-purple-500/10 rounded-xl p-3 border border-purple-500/20">
                              <p className="text-xs text-purple-400 font-medium mb-2">📦 Recommendations</p>
                              <div className="space-y-2">
                                {action.data.picks.slice(0, 3).map((pick, pIdx) => (
                                  <div key={pIdx} className="flex items-center justify-between p-2 bg-slate-800/50 rounded-lg">
                                    <div>
                                      <p className="text-sm text-white">{pick.name}</p>
                                      <p className="text-xs text-slate-400">{pick.description}</p>
                                    </div>
                                    <span className="text-xs text-emerald-400 ml-2">{pick.price}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Today */}
                          {action.type === 'today' && action.data?.actions && (
                            <div className="bg-amber-500/10 rounded-xl p-3 border border-amber-500/20">
                              <p className="text-xs text-amber-400 font-medium mb-2">📅 Today</p>
                              <div className="space-y-2">
                                {action.data.actions.map((item, tIdx) => (
                                  <div key={tIdx} className="flex items-start gap-2 p-2 bg-slate-800/50 rounded-lg">
                                    <span>{item.icon}</span>
                                    <div>
                                      <p className="text-sm text-white">{item.title}</p>
                                      <p className="text-xs text-slate-400">{item.description}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-800 px-4 py-3 rounded-2xl rounded-bl-md">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3 h-3 text-pink-400 animate-pulse" />
                    <span className="text-sm text-slate-400">Mira is thinking...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* Quick Replies */}
      {messages.length > 0 && !isLoading && (
        <div className="fixed bottom-24 left-0 right-0 z-10">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex flex-wrap gap-2 justify-center">
              {quickReplies.map((reply, idx) => (
                <button
                  key={idx}
                  onClick={() => sendMessage(reply.text)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white rounded-full border border-white/10 text-xs backdrop-blur-xl"
                >
                  <reply.icon className="w-3 h-3" />
                  {reply.text}
                </button>
              ))}
              <button
                onClick={() => { setMessages([]); setShowPicksPanel(true); }}
                className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-full text-xs"
              >
                ← Back to Picks
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <form onSubmit={handleSubmit} className="flex items-center gap-3">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask anything about ${activePet?.name || 'your pet'}...`}
              className="flex-1 bg-slate-800 text-white px-4 py-3 rounded-xl border border-white/10 focus:border-pink-500 focus:outline-none text-sm"
              disabled={isLoading || !activePet}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading || !activePet}
              className="p-3 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 disabled:from-slate-700 disabled:to-slate-700 text-white rounded-xl transition-all"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
          <p className="text-center text-xs text-slate-500 mt-2">
            Mira Pure • Soulful AI • No hardcoded logic
          </p>
        </div>
      </div>
    </div>
  );
};

export default MiraPureOSPage;

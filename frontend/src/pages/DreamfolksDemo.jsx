import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, Sparkles, Heart, Shield, Plane, Home, Scissors, 
  GraduationCap, Stethoscope, ShoppingBag, PartyPopper, BookOpen,
  Users, FileText, Dumbbell, PawPrint, Send, ChevronRight, 
  ChevronDown, Brain, Zap, Eye, Clock, Star, TrendingUp,
  Phone, Mail, Calendar, Building2, CreditCard, Check, X,
  ArrowRight, Play, Loader2, Volume2
} from 'lucide-react';
import { Button } from '../components/ui/button';

// Demo Pet: Dollar the Poodle
const DEMO_PET = {
  id: "demo-dollar-poodle",
  name: "Dollar",
  breed: "Poodle",
  type: "dog",
  age: "4 years",
  birth_date: "2022-03-15",
  weight: "8.5 kg",
  color: "Apricot",
  gender: "Male",
  personality: ["Playful", "Intelligent", "Affectionate"],
  allergies: ["Chicken"],
  favorite_treats: ["Peanut butter biscuits", "Lamb jerky"],
  vaccination_status: "Up to date",
  last_grooming: "2 weeks ago",
  soul_score: 78,
  owner: "DreamFolks Member"
};

// 14 Pillars with demo content
const PILLARS = [
  { id: "shop", name: "Shop", icon: ShoppingBag, color: "from-pink-500 to-rose-500", 
    description: "Curated products for poodles", 
    sample: "Show me hypoallergenic food for Dollar",
    preview: "AI recommends grain-free, lamb-based food avoiding chicken allergy" },
  { id: "care", name: "Care", icon: Stethoscope, color: "from-red-500 to-pink-500",
    description: "Health & wellness management",
    sample: "Dollar has been scratching a lot",
    preview: "Detects skin issue → Recommends vet dermatology visit" },
  { id: "groom", name: "Groom", icon: Scissors, color: "from-purple-500 to-violet-500",
    description: "Grooming services & booking",
    sample: "Book a grooming appointment",
    preview: "Shows poodle-specific grooming packages with pricing" },
  { id: "learn", name: "Learn", icon: GraduationCap, color: "from-blue-500 to-indigo-500",
    description: "Training & behavior",
    sample: "Dollar keeps jumping on guests",
    preview: "Routes to behavior training → Suggests trainer consultation" },
  { id: "travel", name: "Travel", icon: Plane, color: "from-cyan-500 to-blue-500",
    description: "Pet-friendly travel planning",
    sample: "I'm flying to Goa with Dollar",
    preview: "Pet airline policies, pet-friendly hotels in Goa" },
  { id: "stay", name: "Stay", icon: Home, color: "from-amber-500 to-orange-500",
    description: "Boarding & pet sitting",
    sample: "I need boarding for next weekend",
    preview: "Shows nearby boarding options with availability" },
  { id: "celebrate", name: "Celebrate", icon: PartyPopper, color: "from-yellow-500 to-amber-500",
    description: "Birthday parties & milestones",
    sample: "Dollar's birthday is coming up",
    preview: "Birthday party packages, custom cakes, photo shoots" },
  { id: "protect", name: "Protect", icon: Shield, color: "from-emerald-500 to-green-500",
    description: "Insurance & safety",
    sample: "Tell me about pet insurance",
    preview: "Compares pet insurance plans with coverage details" },
  { id: "feed", name: "Feed", icon: Heart, color: "from-rose-500 to-red-500",
    description: "Nutrition & meal planning",
    sample: "What should I feed Dollar?",
    preview: "Personalized meal plan considering chicken allergy" },
  { id: "fit", name: "Fit", icon: Dumbbell, color: "from-lime-500 to-green-500",
    description: "Exercise & fitness",
    sample: "How much exercise does Dollar need?",
    preview: "Poodle-specific exercise recommendations" },
  { id: "adopt", name: "Adopt", icon: Users, color: "from-teal-500 to-cyan-500",
    description: "Adoption support",
    sample: "I want to adopt a companion for Dollar",
    preview: "Shelter partnerships, compatibility matching" },
  { id: "farewell", name: "Farewell", icon: Heart, color: "from-slate-500 to-gray-500",
    description: "End-of-life care & memorial",
    sample: "I need grief support",
    preview: "Compassionate support, memorial services" },
  { id: "enjoy", name: "Enjoy", icon: Star, color: "from-orange-500 to-red-500",
    description: "Activities & enrichment",
    sample: "Fun activities for Dollar",
    preview: "Dog parks, play dates, enrichment toys" },
  { id: "paperwork", name: "Paperwork", icon: FileText, color: "from-indigo-500 to-purple-500",
    description: "Documents & records",
    sample: "I need Dollar's vaccination records",
    preview: "Digital pet passport, document storage" },
];

// Pre-built test scenarios
const TEST_SCENARIOS = [
  { id: 1, query: "Dollar hasn't been eating well lately", 
    intent: "Implicit: appetite_loss", pillar: "Care", urgency: "High",
    icon: "🍽️", response: "I sense something might be off with Dollar's appetite..." },
  { id: 2, query: "Book grooming and order some treats", 
    intent: "Multi-intent: grooming + shop", pillar: "Groom + Shop", urgency: "Normal",
    icon: "✂️🦴", response: "I can help with both! Let me find grooming slots and lamb treats..." },
  { id: 3, query: "I'm traveling to Goa next week with Dollar", 
    intent: "Travel planning", pillar: "Travel", urgency: "Normal",
    icon: "✈️", response: "Exciting trip! Let me check pet-friendly flights and hotels..." },
  { id: 4, query: "Dollar's birthday is on March 15th", 
    intent: "Celebration planning", pillar: "Celebrate", urgency: "Low",
    icon: "🎂", response: "Dollar turns 4! Let me plan something special..." },
  { id: 5, query: "He's been vomiting since morning", 
    intent: "Emergency detection", pillar: "Emergency", urgency: "Critical",
    icon: "🚨", response: "This sounds urgent. Let me connect you to emergency care..." },
  { id: 6, query: "Show me hypoallergenic food options", 
    intent: "Product search + allergy aware", pillar: "Shop", urgency: "Normal",
    icon: "🥗", response: "Remembering Dollar's chicken allergy, here are safe options..." },
];

// B2B Stats
const B2B_STATS = [
  { value: "38%", label: "Premium cardholders are pet parents", icon: CreditCard },
  { value: "₹18K+", label: "Average monthly pet spend", icon: TrendingUp },
  { value: "73%", label: "Would switch banks for pet benefits", icon: Building2 },
  { value: "4.2x", label: "Higher engagement with lifestyle perks", icon: Star },
];

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

export default function DreamfolksDemo() {
  const [activeTab, setActiveTab] = useState('chat');
  const [selectedPillar, setSelectedPillar] = useState(null);
  const [chatMessages, setChatMessages] = useState([
    { role: 'mira', content: `Hi! I'm Mira, Dollar's AI companion. I already know he's a 4-year-old Apricot Poodle who loves lamb treats and is allergic to chicken. How can I help you today?` }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [aiThinking, setAiThinking] = useState(null);
  const [showThinkingPanel, setShowThinkingPanel] = useState(true);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const simulateAIThinking = (query) => {
    // Detect intents from the query
    const thinking = {
      query,
      timestamp: new Date().toISOString(),
      steps: []
    };

    // Step 1: Intent Detection
    if (query.toLowerCase().includes(' and ') || query.toLowerCase().includes(' also ')) {
      thinking.steps.push({ step: "Multi-Intent Detection", result: "✓ Multiple intents detected", time: "12ms" });
    }

    // Step 2: Implicit Intent
    const implicitPatterns = {
      'scratching': { intent: 'skin_issue', pillar: 'care', urgency: 'medium' },
      'not eating': { intent: 'appetite_loss', pillar: 'care', urgency: 'high' },
      'vomiting': { intent: 'emergency', pillar: 'emergency', urgency: 'critical' },
      'birthday': { intent: 'celebration', pillar: 'celebrate', urgency: 'low' },
      'travel': { intent: 'travel_planning', pillar: 'travel', urgency: 'normal' },
      'groom': { intent: 'grooming', pillar: 'groom', urgency: 'normal' },
    };

    for (const [pattern, info] of Object.entries(implicitPatterns)) {
      if (query.toLowerCase().includes(pattern)) {
        thinking.steps.push({ 
          step: "Implicit Intent", 
          result: `✓ "${pattern}" → ${info.pillar}/${info.intent}`, 
          time: "8ms",
          urgency: info.urgency
        });
        break;
      }
    }

    // Step 3: Pet Memory
    thinking.steps.push({ 
      step: "Memory Recall", 
      result: "✓ Dollar: Poodle, 4yo, chicken allergy", 
      time: "3ms" 
    });

    // Step 4: Personalization
    if (query.toLowerCase().includes('food') || query.toLowerCase().includes('treat')) {
      thinking.steps.push({ 
        step: "Allergy Filter", 
        result: "✓ Excluding chicken products", 
        time: "5ms" 
      });
    }

    // Step 5: Response Generation
    thinking.steps.push({ 
      step: "Response Generation", 
      result: "✓ Streaming enabled", 
      time: "45ms" 
    });

    return thinking;
  };

  const handleSendMessage = async (message) => {
    const query = message || inputMessage;
    if (!query.trim()) return;

    // Add user message
    setChatMessages(prev => [...prev, { role: 'user', content: query }]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate AI thinking
    const thinking = simulateAIThinking(query);
    setAiThinking(thinking);

    // Simulate response delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Generate contextual response
    let response = "I understand you're asking about " + query.split(' ').slice(0, 3).join(' ') + "...";
    
    if (query.toLowerCase().includes('eating') || query.toLowerCase().includes('appetite')) {
      response = "I'm concerned about Dollar not eating well. Given his usual healthy appetite, this could indicate:\n\n• Digestive upset\n• Dental issues\n• Stress or anxiety\n\n**Recommendation:** I'd suggest a vet check-up soon. Would you like me to find available appointments nearby?";
    } else if (query.toLowerCase().includes('groom')) {
      response = "Let me find grooming options for Dollar! As a Poodle, he needs regular professional grooming every 4-6 weeks.\n\n**Available this week:**\n• Pawsome Spa - ₹1,200 (Tomorrow 10 AM)\n• Fluffy Tails - ₹950 (Thursday 2 PM)\n\nShall I book one of these?";
    } else if (query.toLowerCase().includes('birthday') || query.toLowerCase().includes('celebrate')) {
      response = "Dollar's birthday on March 15th - he's turning 4! 🎂\n\n**Party Package Options:**\n• Basic: Cake + Photo (₹2,500)\n• Premium: Cake + Photo + 5 Friends (₹5,500)\n• Deluxe: Full party + Venue + Catering (₹12,000)\n\nWant me to start planning?";
    } else if (query.toLowerCase().includes('travel') || query.toLowerCase().includes('goa')) {
      response = "Exciting trip to Goa with Dollar! ✈️\n\n**Pet-Friendly Options:**\n• IndiGo allows pets in cabin (₹3,500 pet fee)\n• Pet-friendly hotels: Taj Fort Aguada, W Goa\n\n**I'll need:**\n• Health certificate (within 10 days)\n• Vaccination records\n\nWant me to prepare a travel checklist?";
    } else if (query.toLowerCase().includes('vomit')) {
      response = "⚠️ **This sounds urgent!**\n\nVomiting since morning needs immediate attention. Please:\n\n1. **Keep Dollar hydrated** - small sips of water\n2. **No food** for 12 hours\n3. **Monitor** for blood or lethargy\n\n**Emergency vets near you:**\n• 24/7 Pet Care - 2.3 km (Open now)\n• City Vet Hospital - 4.1 km\n\nShould I call them for you?";
    } else if (query.toLowerCase().includes('food') || query.toLowerCase().includes('hypoallergenic')) {
      response = "Looking for safe food for Dollar (avoiding chicken)! 🥗\n\n**Top Picks:**\n• Royal Canin Poodle Adult - ₹4,200\n• Farmina N&D Lamb & Blueberry - ₹3,800\n• Acana Singles Lamb - ₹5,100\n\nAll are chicken-free and perfect for poodles. Want details on any?";
    } else if (query.toLowerCase().includes('treat')) {
      response = "Treats for Dollar! Remembering he loves lamb and can't have chicken:\n\n**Safe & Delicious:**\n• Lamb Jerky Strips - ₹450\n• Peanut Butter Biscuits - ₹320\n• Sweet Potato Chews - ₹280\n\nAll chicken-free! ✓ Add to cart?";
    }

    setChatMessages(prev => [...prev, { role: 'mira', content: response }]);
    setIsTyping(false);
  };

  const handleScenarioClick = (scenario) => {
    handleSendMessage(scenario.query);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#1a0a2e] to-[#0a1a2e]">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* TDC Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <PawPrint className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-white font-bold text-lg">thedoggycompany</span>
                <span className="text-purple-400 text-xs block">Mira OS™ Demo</span>
              </div>
            </div>

            {/* DreamFolks Badge - Subtle */}
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
              <span className="text-white/60 text-sm">Prepared for</span>
              <img 
                src="https://customer-assets.emergentagent.com/job_2dad3d7e-c3ab-4896-a445-d39e2953ce1d/artifacts/omygtrey_image.png" 
                alt="DreamFolks" 
                className="h-6 object-contain"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/20 border border-orange-500/30 rounded-full">
              <Sparkles className="w-4 h-4 text-orange-400" />
              <span className="text-orange-300 text-sm">Exclusive Partnership Opportunity</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white">
              Your Members Are<br />
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
                Pet Parents Too
              </span>
            </h1>
            
            <p className="text-white/60 text-lg max-w-2xl mx-auto">
              38% of premium cardholders have pets. Give them a reason to stay — 
              with India's first AI-powered Pet Concierge® service.
            </p>

            {/* B2B Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 max-w-4xl mx-auto">
              {B2B_STATS.map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white/5 border border-white/10 rounded-2xl p-4"
                >
                  <stat.icon className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-white/50 text-xs">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Demo Pet Card */}
      <section className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-4xl">
                🐩
              </div>
              <div className="text-center md:text-left">
                <h3 className="text-2xl font-bold text-white">Meet Dollar</h3>
                <p className="text-white/60">Your demo pet for this session</p>
                <div className="flex flex-wrap gap-2 mt-3 justify-center md:justify-start">
                  <span className="px-3 py-1 bg-purple-500/20 text-purple-300 text-sm rounded-full">{DEMO_PET.breed}</span>
                  <span className="px-3 py-1 bg-pink-500/20 text-pink-300 text-sm rounded-full">{DEMO_PET.age}</span>
                  <span className="px-3 py-1 bg-amber-500/20 text-amber-300 text-sm rounded-full">{DEMO_PET.color}</span>
                  <span className="px-3 py-1 bg-red-500/20 text-red-300 text-sm rounded-full">🚫 Chicken Allergy</span>
                  <span className="px-3 py-1 bg-green-500/20 text-green-300 text-sm rounded-full">Soul Score: {DEMO_PET.soul_score}%</span>
                </div>
              </div>
              <div className="ml-auto hidden lg:block">
                <div className="text-right">
                  <div className="text-white/40 text-sm">Mira knows:</div>
                  <div className="text-white/70 text-sm">• Favorite: {DEMO_PET.favorite_treats[0]}</div>
                  <div className="text-white/70 text-sm">• Last groomed: {DEMO_PET.last_grooming}</div>
                  <div className="text-white/70 text-sm">• Personality: {DEMO_PET.personality.join(', ')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Demo Area */}
      <section className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-6">
            
            {/* Left: Chat Interface */}
            <div className="lg:col-span-2 space-y-6">
              {/* Tab Navigation */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {[
                  { id: 'chat', label: 'Chat with Mira' },
                  { id: 'pillars', label: '14 Pillars' },
                  { id: 'scenarios', label: 'Test Scenarios' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-6 py-3 rounded-full text-sm font-medium whitespace-nowrap transition-all cursor-pointer ${
                      activeTab === tab.id
                        ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                        : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Chat Tab */}
              {activeTab === 'chat' && (
                <div className="bg-[#1a0a2e]/50 border border-white/10 rounded-2xl overflow-hidden">
                  {/* Chat Header */}
                  <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 p-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="text-white font-medium">Mira AI</div>
                        <div className="text-green-400 text-xs flex items-center gap-1">
                          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                          Online • Knows Dollar
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Chat Messages */}
                  <div className="h-96 overflow-y-auto p-4 space-y-4">
                    {chatMessages.map((msg, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                          msg.role === 'user'
                            ? 'bg-purple-500 text-white'
                            : 'bg-white/10 text-white/90'
                        }`}>
                          <div className="whitespace-pre-line text-sm">{msg.content}</div>
                        </div>
                      </motion.div>
                    ))}
                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="bg-white/10 rounded-2xl px-4 py-3">
                          <div className="flex gap-1">
                            <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Chat Input */}
                  <div className="p-4 border-t border-white/10">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Ask Mira anything about Dollar..."
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-purple-500"
                      />
                      <Button 
                        onClick={() => handleSendMessage()}
                        className="bg-purple-500 hover:bg-purple-600 text-white rounded-xl px-4"
                      >
                        <Send className="w-5 h-5" />
                      </Button>
                    </div>
                    
                    {/* Quick Suggestions */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {["What food for Dollar?", "Book grooming", "He's not eating"].map((q, i) => (
                        <button
                          key={i}
                          onClick={() => handleSendMessage(q)}
                          className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white/60 text-xs transition-colors"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Pillars Tab */}
              {activeTab === 'pillars' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {PILLARS.map((pillar) => (
                    <motion.div
                      key={pillar.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedPillar(selectedPillar?.id === pillar.id ? null : pillar)}
                      className={`cursor-pointer rounded-xl p-4 border transition-all ${
                        selectedPillar?.id === pillar.id
                          ? 'bg-gradient-to-br ' + pillar.color + ' border-white/30'
                          : 'bg-white/5 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <pillar.icon className={`w-6 h-6 mb-2 ${selectedPillar?.id === pillar.id ? 'text-white' : 'text-white/60'}`} />
                      <div className={`font-medium ${selectedPillar?.id === pillar.id ? 'text-white' : 'text-white/80'}`}>
                        {pillar.name}
                      </div>
                      <div className={`text-xs mt-1 ${selectedPillar?.id === pillar.id ? 'text-white/80' : 'text-white/40'}`}>
                        {pillar.description}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Selected Pillar Detail */}
              <AnimatePresence>
                {selectedPillar && activeTab === 'pillars' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-white/5 border border-white/10 rounded-xl p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-white">{selectedPillar.name} Pillar</h3>
                        <p className="text-white/60">{selectedPillar.description}</p>
                      </div>
                      <button onClick={() => setSelectedPillar(null)} className="text-white/40 hover:text-white">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <div className="bg-black/20 rounded-lg p-4 mb-4">
                      <div className="text-white/40 text-xs mb-1">Sample Query:</div>
                      <div className="text-white font-medium">"{selectedPillar.sample}"</div>
                    </div>
                    
                    <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                      <div className="text-purple-300 text-xs mb-1 flex items-center gap-1">
                        <Brain className="w-3 h-3" /> Mira's Response:
                      </div>
                      <div className="text-white/80">{selectedPillar.preview}</div>
                    </div>
                    
                    <Button 
                      onClick={() => {
                        setActiveTab('chat');
                        setTimeout(() => handleSendMessage(selectedPillar.sample), 300);
                      }}
                      className="mt-4 bg-purple-500 hover:bg-purple-600 text-white"
                    >
                      <Play className="w-4 h-4 mr-2" /> Try This in Chat
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Scenarios Tab */}
              {activeTab === 'scenarios' && (
                <div className="space-y-3">
                  <p className="text-white/60 text-sm mb-4">
                    Click any scenario to see Mira's intelligence in action:
                  </p>
                  {TEST_SCENARIOS.map((scenario) => (
                    <motion.div
                      key={scenario.id}
                      whileHover={{ scale: 1.01 }}
                      onClick={() => {
                        setActiveTab('chat');
                        setTimeout(() => handleScenarioClick(scenario), 300);
                      }}
                      className="cursor-pointer bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-3xl">{scenario.icon}</div>
                        <div className="flex-1">
                          <div className="text-white font-medium">"{scenario.query}"</div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded">
                              {scenario.intent}
                            </span>
                            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-xs rounded">
                              → {scenario.pillar}
                            </span>
                            <span className={`px-2 py-0.5 text-xs rounded ${
                              scenario.urgency === 'Critical' ? 'bg-red-500/20 text-red-300' :
                              scenario.urgency === 'High' ? 'bg-orange-500/20 text-orange-300' :
                              'bg-green-500/20 text-green-300'
                            }`}>
                              {scenario.urgency}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-white/40" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: AI Thinking Panel */}
            <div className="space-y-6">
              {/* Toggle */}
              <div className="flex items-center justify-between">
                <h3 className="text-white font-medium flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-400" />
                  AI Thinking (Behind the Scenes)
                </h3>
                <button 
                  onClick={() => setShowThinkingPanel(!showThinkingPanel)}
                  className="text-white/40 hover:text-white text-sm"
                >
                  {showThinkingPanel ? 'Hide' : 'Show'}
                </button>
              </div>

              {showThinkingPanel && (
                <div className="bg-[#0a0a1a] border border-white/10 rounded-xl p-4 font-mono text-sm">
                  {aiThinking ? (
                    <div className="space-y-3">
                      <div className="text-green-400 text-xs">
                        Query: "{aiThinking.query.slice(0, 40)}..."
                      </div>
                      <div className="border-t border-white/10 pt-3 space-y-2">
                        {aiThinking.steps.map((step, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.2 }}
                            className="flex items-start gap-2"
                          >
                            <Zap className="w-4 h-4 text-yellow-400 mt-0.5" />
                            <div>
                              <div className="text-white/80">{step.step}</div>
                              <div className="text-green-400 text-xs">{step.result}</div>
                              {step.urgency && (
                                <div className={`text-xs mt-1 ${
                                  step.urgency === 'critical' ? 'text-red-400' :
                                  step.urgency === 'high' ? 'text-orange-400' :
                                  'text-blue-400'
                                }`}>
                                  Urgency: {step.urgency}
                                </div>
                              )}
                            </div>
                            <div className="ml-auto text-white/30 text-xs">{step.time}</div>
                          </motion.div>
                        ))}
                      </div>
                      <div className="border-t border-white/10 pt-3 text-white/40 text-xs">
                        Total processing: ~73ms
                      </div>
                    </div>
                  ) : (
                    <div className="text-white/40 text-center py-8">
                      <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>Send a message to see<br />Mira's thinking process</p>
                    </div>
                  )}
                </div>
              )}

              {/* Key Features */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h4 className="text-white font-medium mb-4">Intelligence Features</h4>
                <div className="space-y-3">
                  {[
                    { icon: Brain, label: "Multi-Intent Detection", desc: "Handles 'X and Y' queries" },
                    { icon: Eye, label: "Implicit Intent", desc: "Understands 'scratching' = skin issue" },
                    { icon: Heart, label: "Pet Memory", desc: "Remembers allergies & preferences" },
                    { icon: Zap, label: "Urgency Detection", desc: "Flags emergencies instantly" },
                    { icon: Clock, label: "Proactive Alerts", desc: "Vaccination & birthday reminders" },
                  ].map((feature, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <feature.icon className="w-5 h-5 text-purple-400 mt-0.5" />
                      <div>
                        <div className="text-white text-sm">{feature.label}</div>
                        <div className="text-white/40 text-xs">{feature.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Partner Section */}
      <section className="py-16 px-4 bg-gradient-to-b from-transparent to-purple-900/10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Why DreamFolks Should Partner</h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              Pet parenting is a ₹30,000 Cr market growing at 25% YoY. Your premium members are already spending here.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "Member Retention",
                description: "Lifestyle benefits reduce churn by 34%. Pet services are the highest-engagement lifestyle vertical.",
                icon: Users,
                stat: "34% lower churn"
              },
              {
                title: "Revenue Share",
                description: "Every transaction through Mira = revenue. Food, grooming, vet, boarding, travel — all monetizable.",
                icon: TrendingUp,
                stat: "₹18K avg. monthly spend"
              },
              {
                title: "White-Label Ready",
                description: "We can deploy Mira OS under your brand. Your app, your members, our technology.",
                icon: Building2,
                stat: "4-week integration"
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-6"
              >
                <item.icon className="w-10 h-10 text-purple-400 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                <p className="text-white/60 mb-4">{item.description}</p>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">
                  <Check className="w-4 h-4" />
                  {item.stat}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-3xl p-8 md:p-12">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to Explore?</h2>
            <p className="text-white/60 mb-8">
              Let's discuss how Mira OS can become a member benefit for your cardholders.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="bg-purple-500 hover:bg-purple-600 text-white px-8 py-6 text-lg">
                <Calendar className="w-5 h-5 mr-2" />
                Schedule a Call
              </Button>
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 px-8 py-6 text-lg">
                <Mail className="w-5 h-5 mr-2" />
                partnerships@thedoggycompany.in
              </Button>
            </div>

            <p className="text-white/40 text-sm mt-6">
              Or call us directly: +91 96631 85747
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <PawPrint className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold">thedoggycompany</span>
          </div>
          <p className="text-white/40 text-sm">
            © 2025 The Doggy Company®. Mira OS™ is a trademark of The Doggy Company.
          </p>
        </div>
      </footer>
    </div>
  );
}

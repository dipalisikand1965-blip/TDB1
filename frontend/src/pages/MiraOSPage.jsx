/**
 * MiraOSPage.jsx
 * 
 * MIRA OS with Header Shell Navigation
 * 7 Tabs: Mojo | Today | Picks | Services | Insights | Learn | Concierge
 * 
 * This is a NEW PAGE that demonstrates the header shell concept.
 * All existing components from MiraDemoPage are preserved and organized.
 * 
 * Route: /mira-os
 */

import React, { useState, useEffect, useRef, useCallback, lazy, Suspense, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Mic, MicOff, Send, MessageCircle, Package, Calendar, 
  HelpCircle, Heart, Sparkles, ChevronDown, ChevronUp, ChevronRight,
  ShoppingBag, PawPrint, Bot, History, Plus, Check, Search,
  ThumbsUp, ThumbsDown, X, Phone, Mail, MessageSquare, AlertCircle,
  Star, Crown, Gift, Volume2, VolumeX, Wand2, ArrowRight, ExternalLink, Shield,
  Award, RefreshCw, MapPin, Navigation, Play, TrendingUp, BookOpen, Users
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../utils/api';
import hapticFeedback from '../utils/haptic';

// ═══════════════════════════════════════════════════════════════════════════════
// HEADER SHELL - New Navigation System
// ═══════════════════════════════════════════════════════════════════════════════
import MiraHeaderShell, { 
  TabContent, 
  DimensionWrapper,
  HEADER_TABS,
  getComponentDimension 
} from '../components/Mira/MiraHeaderShell';

// ═══════════════════════════════════════════════════════════════════════════════
// EXISTING COMPONENTS - All preserved from MiraDemoPage
// ═══════════════════════════════════════════════════════════════════════════════
import { VaultManager, UnifiedPicksVault } from '../components/PicksVault';
import MiraTray from '../components/Mira/MiraTray';
import WelcomeHero from '../components/Mira/WelcomeHero';
import ChatMessage from '../components/Mira/ChatMessage';
import ChatInputBar from '../components/Mira/ChatInputBar';
import PetSelector from '../components/Mira/PetSelector';
import NavigationDock from '../components/Mira/NavigationDock';
import FloatingActionBar from '../components/Mira/FloatingActionBar';
import MiraLoader from '../components/Mira/MiraLoader';
import ScrollToBottomButton from '../components/Mira/ScrollToBottomButton';
import ProactiveAlertsBanner from '../components/Mira/ProactiveAlertsBanner';
import NotificationBell from '../components/Mira/NotificationBell';
import ConciergeConfirmation from '../components/Mira/ConciergeConfirmation';
import QuickReplies from '../components/Mira/QuickReplies';
import MemoryWhisper from '../components/Mira/MemoryWhisper';
import SoulKnowledgeTicker from '../components/Mira/SoulKnowledgeTicker';
import { FormattedText, TypedText } from '../components/Mira/TextComponents';

// ═══════════════════════════════════════════════════════════════════════════════
// LAZY LOADED COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════
const PastChatsPanel = lazy(() => import('../components/Mira/PastChatsPanel'));
const InsightsPanel = lazy(() => import('../components/Mira/InsightsPanel'));
const ConciergePanel = lazy(() => import('../components/Mira/ConciergePanel'));
const HelpModal = lazy(() => import('../components/Mira/HelpModal'));
const LearnModal = lazy(() => import('../components/Mira/LearnModal'));
const PersonalizedPicksPanel = lazy(() => import('../components/Mira/PersonalizedPicksPanel'));
const ServiceRequestModal = lazy(() => import('../components/Mira/ServiceRequestModal'));
const HealthVaultWizard = lazy(() => import('../components/Mira/HealthVaultWizard'));
const SoulFormModal = lazy(() => import('../components/Mira/SoulFormModal'));

const LazyFallback = () => <div className="p-4 text-center text-gray-400">Loading...</div>;

// ═══════════════════════════════════════════════════════════════════════════════
// EXTRACTED HOOKS
// ═══════════════════════════════════════════════════════════════════════════════
import { 
  useVoice, usePet, useVault, useSession, DEMO_PET, ALL_DEMO_PETS,
  useChatSubmit
} from '../hooks/mira';

// Import CSS
import '../styles/mira-prod.css';
import '../styles/ios-premium.css';
import '../styles/mira-header-shell.css';

// ═══════════════════════════════════════════════════════════════════════════════
// MIRA OS PAGE WITH HEADER SHELL
// ═══════════════════════════════════════════════════════════════════════════════
const MiraOSPage = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  
  // ═══════════════════════════════════════════════════════════════════════════
  // HEADER SHELL STATE - Controls which tab is active
  // ═══════════════════════════════════════════════════════════════════════════
  const [activeTab, setActiveTab] = useState('services'); // Default to chat/services
  const [tabBadges, setTabBadges] = useState({
    today: 0,
    picks: 0,
    insights: 0,
    concierge: 0
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // PET MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════
  const {
    pet,
    setPet,
    allPets,
    setAllPets,
    showPetSelector,
    setShowPetSelector,
    isLoadingPets,
    isRealPet
  } = usePet({ user, token });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // VAULT MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════
  const {
    showVault,
    setShowVault,
    activeVaultData,
    setActiveVaultData,
    vaultUserMessage,
    setVaultUserMessage,
  } = useVault();
  
  // ═══════════════════════════════════════════════════════════════════════════
  // SESSION MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════
  const {
    sessionId,
    setSessionId,
    generateNewSessionId
  } = useSession();
  
  // ═══════════════════════════════════════════════════════════════════════════
  // UI STATE
  // ═══════════════════════════════════════════════════════════════════════════
  const [conversationHistory, setConversationHistory] = useState([]);
  const [query, setQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [quickReplies, setQuickReplies] = useState([]);
  
  // Modal states
  const [showInsightsPanel, setShowInsightsPanel] = useState(false);
  const [showConciergePanel, setShowConciergePanel] = useState(false);
  const [showPastChats, setShowPastChats] = useState(false);
  const [showLearnModal, setShowLearnModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showSoulFormModal, setShowSoulFormModal] = useState(false);
  const [showHealthWizard, setShowHealthWizard] = useState(false);
  const [showTopPicksPanel, setShowTopPicksPanel] = useState(false);
  const [showUnifiedVault, setShowUnifiedVault] = useState(false);
  
  // Pet data states
  const [soulKnowledge, setSoulKnowledge] = useState({ items: [], soulScore: 0 });
  const [proactiveAlerts, setProactiveAlerts] = useState({ smartAlerts: [], criticalCount: 0 });
  const [miraPicks, setMiraPicks] = useState({ products: [], services: [], tipCard: null, hasNew: false });
  
  // Other states
  const [conciergeConfirmation, setConciergeConfirmation] = useState(null);
  const [activeMemoryContext, setActiveMemoryContext] = useState(null);
  const [miraMode, setMiraMode] = useState('GENERAL');
  const [currentPillar, setCurrentPillar] = useState(null);
  
  const inputRef = useRef(null);
  const messagesContainerRef = useRef(null);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // FETCH PET DATA ON PET CHANGE
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (pet?.id && token) {
      // Fetch soul knowledge
      fetch(`${API_URL}/api/pet-soul/profile/${pet.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setSoulKnowledge({
              items: data.knowledgeItems || [],
              soulScore: data.soulScore || data.overall_score || 0
            });
          }
        })
        .catch(console.error);
      
      // Fetch proactive alerts
      fetch(`${API_URL}/api/mira/proactive/${pet.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.alerts) {
            setProactiveAlerts({
              smartAlerts: data.alerts || [],
              criticalCount: data.criticalCount || 0
            });
            // Update today tab badge
            setTabBadges(prev => ({
              ...prev,
              today: data.criticalCount || 0
            }));
          }
        })
        .catch(console.error);
    }
  }, [pet?.id, token]);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // HANDLE TAB CHANGE
  // ═══════════════════════════════════════════════════════════════════════════
  const handleTabChange = useCallback((tabId) => {
    hapticFeedback.buttonTap?.();
    setActiveTab(tabId);
    
    // Open corresponding modal/panel for certain tabs
    if (tabId === 'insights') {
      setShowInsightsPanel(true);
    } else if (tabId === 'concierge') {
      setShowConciergePanel(true);
    } else if (tabId === 'learn') {
      setShowLearnModal(true);
    } else if (tabId === 'picks') {
      setShowTopPicksPanel(true);
    }
  }, []);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // SWITCH PET
  // ═══════════════════════════════════════════════════════════════════════════
  const switchPet = useCallback((newPet) => {
    setPet(newPet);
    setShowPetSelector(false);
    setConversationHistory([]);
    generateNewSessionId();
  }, [setPet, setShowPetSelector, generateNewSessionId]);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // HANDLE QUICK REPLY
  // ═══════════════════════════════════════════════════════════════════════════
  const handleQuickReply = useCallback((text) => {
    setQuery(text);
    // Auto-submit after setting query
    setTimeout(() => {
      handleSubmit({ preventDefault: () => {} });
    }, 100);
  }, []);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // HANDLE SUBMIT - Simplified version
  // ═══════════════════════════════════════════════════════════════════════════
  const handleSubmit = useCallback(async (e) => {
    e?.preventDefault?.();
    if (!query.trim() || isProcessing) return;
    
    const userMessage = query.trim();
    setQuery('');
    setIsProcessing(true);
    
    // Add user message to history
    setConversationHistory(prev => [...prev, {
      type: 'user',
      content: userMessage,
      timestamp: new Date()
    }]);
    
    try {
      const response = await fetch(`${API_URL}/api/mira/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({
          input: userMessage,
          session_id: sessionId,
          selected_pet_id: pet?.id,
          pet_name: pet?.name,
          member_email: user?.email,
          member_name: user?.name
        })
      });
      
      const data = await response.json();
      
      // Add Mira's response
      setConversationHistory(prev => [...prev, {
        type: 'mira',
        content: data.response || data.message || 'I apologize, I had trouble understanding that.',
        timestamp: new Date(),
        pillar: data.pillar,
        picks: data.picks,
        tipCard: data.tip_card,
        isEmergency: data.is_emergency
      }]);
      
      // Update picks if present
      if (data.picks?.length > 0) {
        setMiraPicks(prev => ({
          ...prev,
          products: data.picks.filter(p => p.type === 'product'),
          services: data.picks.filter(p => p.type === 'service'),
          hasNew: true
        }));
        setTabBadges(prev => ({ ...prev, picks: data.picks.length }));
      }
      
      // Set quick replies
      if (data.quick_replies) {
        setQuickReplies(data.quick_replies);
      }
      
      // Update pillar
      if (data.pillar) {
        setCurrentPillar(data.pillar);
      }
      
      // Handle emergency mode
      if (data.is_emergency) {
        setMiraMode('EMERGENCY');
      }
      
    } catch (error) {
      console.error('[MIRA CHAT] Error:', error);
      setConversationHistory(prev => [...prev, {
        type: 'mira',
        content: 'I apologize, I encountered an error. Please try again.',
        timestamp: new Date(),
        isError: true
      }]);
    } finally {
      setIsProcessing(false);
    }
  }, [query, isProcessing, sessionId, pet, user, token]);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // START NEW SESSION
  // ═══════════════════════════════════════════════════════════════════════════
  const startNewSession = useCallback(() => {
    setConversationHistory([]);
    generateNewSessionId();
    setQuickReplies([]);
    setMiraPicks({ products: [], services: [], tipCard: null, hasNew: false });
  }, [generateNewSessionId]);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="mira-os-page mp-container" data-testid="mira-os-page">
      {/* MEMORY WHISPER */}
      <MemoryWhisper 
        memoryContext={activeMemoryContext}
        petName={pet?.name || 'your pet'}
        onDismiss={() => setActiveMemoryContext(null)}
        autoDismissDelay={8000}
      />
      
      {/* SOUL KNOWLEDGE TICKER - Always visible at top */}
      {soulKnowledge.items.length > 0 && (
        <SoulKnowledgeTicker
          petId={pet?.id}
          petName={pet?.name || 'your pet'}
          petPhoto={pet?.photo}
          soulScore={pet?.soulScore || soulKnowledge.soulScore || 0}
          knowledgeItems={soulKnowledge.items}
          apiUrl={API_URL}
          token={token}
          onSoulQuestionClick={() => {
            hapticFeedback.buttonTap?.();
            navigate(`/pet-soul/${pet.id || ''}`);
          }}
        />
      )}
      
      {/* MAIN HEADER */}
      <header className="mp-header">
        <div className="mp-header-inner">
          {/* Left: Mira Logo */}
          <div className="mp-logo">
            <div className="mp-logo-icon">
              <Sparkles />
            </div>
            <div className="mp-logo-text">
              <span className="mp-logo-title">Mira</span>
              <span className="mp-logo-subtitle">Pet OS</span>
            </div>
          </div>
          
          {/* Right: Notification + Pet Selector */}
          <div className="flex items-center gap-2">
            <NotificationBell userEmail={user?.email} />
            <PetSelector
              currentPet={pet}
              allPets={allPets}
              isOpen={showPetSelector}
              onToggle={() => setShowPetSelector(!showPetSelector)}
              onSelectPet={switchPet}
            />
          </div>
        </div>
      </header>
      
      {/* ════════════════════════════════════════════════════════════════════
          HEADER SHELL - New Navigation Tabs
          ════════════════════════════════════════════════════════════════════ */}
      <MiraHeaderShell
        activeTab={activeTab}
        onTabChange={handleTabChange}
        badges={tabBadges}
      />
      
      {/* ════════════════════════════════════════════════════════════════════
          TAB CONTENT AREAS
          Each tab shows relevant components
          ════════════════════════════════════════════════════════════════════ */}
      
      {/* MOJO TAB - Pet Context */}
      <TabContent tabId="mojo" activeTab={activeTab}>
        <div className="mojo-content p-4">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <PawPrint size={20} className="text-pink-400" />
            {pet?.name || 'Your Pet'}'s Profile
          </h2>
          
          {/* Pet Identity Card */}
          <div className="pet-identity-card bg-white/5 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-4">
              {pet?.photo ? (
                <img 
                  src={pet.photo} 
                  alt={pet.name}
                  className="w-20 h-20 rounded-full object-cover border-2 border-pink-400"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center">
                  <PawPrint size={32} className="text-white" />
                </div>
              )}
              <div>
                <h3 className="text-xl font-bold text-white">{pet?.name || 'Unknown'}</h3>
                <p className="text-gray-400">{pet?.breed || 'Breed not set'}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="text-pink-400 font-semibold">
                    {Math.round(soulKnowledge.soulScore)}% Soul Score
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => setShowSoulFormModal(true)}
              className="p-4 bg-pink-500/20 rounded-xl text-white flex items-center gap-2 hover:bg-pink-500/30 transition"
              data-testid="mojo-soul-btn"
            >
              <Heart size={20} />
              <span>Soul Questions</span>
            </button>
            <button 
              onClick={() => setShowHealthWizard(true)}
              className="p-4 bg-purple-500/20 rounded-xl text-white flex items-center gap-2 hover:bg-purple-500/30 transition"
              data-testid="mojo-health-btn"
            >
              <Shield size={20} />
              <span>Health Vault</span>
            </button>
          </div>
        </div>
      </TabContent>
      
      {/* TODAY TAB - Time-bound */}
      <TabContent tabId="today" activeTab={activeTab}>
        <div className="today-content p-4">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Calendar size={20} className="text-yellow-400" />
            Today for {pet?.name || 'Your Pet'}
          </h2>
          
          {/* Proactive Alerts */}
          {proactiveAlerts.smartAlerts?.length > 0 ? (
            <ProactiveAlertsBanner
              alerts={proactiveAlerts.smartAlerts}
              criticalCount={proactiveAlerts.criticalCount}
              maxVisible={5}
              onAskMira={(message) => {
                setActiveTab('services');
                setQuery(message);
                setTimeout(() => handleSubmit({ preventDefault: () => {} }), 100);
              }}
              onBookNow={(request) => {
                setActiveTab('services');
                setQuery(`I want to book ${request.title}`);
                setTimeout(() => handleSubmit({ preventDefault: () => {} }), 100);
              }}
              onDismiss={async (alertId) => {
                try {
                  await fetch(`${API_URL}/api/mira/proactive/dismiss/${alertId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_email: user?.email })
                  });
                } catch (e) { console.log('Could not dismiss alert'); }
              }}
            />
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Calendar size={48} className="mx-auto mb-3 opacity-50" />
              <p>No reminders for today</p>
              <p className="text-sm mt-1">Check back later or ask Mira about upcoming events</p>
            </div>
          )}
        </div>
      </TabContent>
      
      {/* PICKS TAB - Intelligence */}
      <TabContent tabId="picks" activeTab={activeTab}>
        <div className="picks-content p-4">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Sparkles size={20} className="text-purple-400" />
            Picks for {pet?.name || 'Your Pet'}
          </h2>
          
          {miraPicks.products?.length > 0 || miraPicks.services?.length > 0 ? (
            <div className="space-y-4">
              {miraPicks.products?.map((pick, idx) => (
                <div key={idx} className="bg-white/5 rounded-xl p-4">
                  <h4 className="font-medium text-white">{pick.title || pick.name}</h4>
                  <p className="text-sm text-gray-400 mt-1">{pick.description}</p>
                </div>
              ))}
              {miraPicks.services?.map((pick, idx) => (
                <div key={idx} className="bg-white/5 rounded-xl p-4">
                  <h4 className="font-medium text-white">{pick.title || pick.name}</h4>
                  <p className="text-sm text-gray-400 mt-1">{pick.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Sparkles size={48} className="mx-auto mb-3 opacity-50" />
              <p>No picks yet</p>
              <p className="text-sm mt-1">Chat with Mira to get personalized recommendations</p>
              <button 
                onClick={() => setActiveTab('services')}
                className="mt-4 px-4 py-2 bg-purple-500/30 rounded-full text-white text-sm hover:bg-purple-500/40 transition"
              >
                Start a conversation
              </button>
            </div>
          )}
        </div>
      </TabContent>
      
      {/* SERVICES TAB - Main Chat (Execution) */}
      <TabContent tabId="services" activeTab={activeTab}>
        <div className="services-content">
          {/* Main Chat Area */}
          <div 
            ref={messagesContainerRef}
            className="mp-messages"
          >
            <div className="mp-messages-inner">
              {/* Welcome State */}
              {conversationHistory.length === 0 && !isProcessing && (
                <WelcomeHero
                  pet={pet}
                  token={token}
                  proactiveGreeting={null}
                  proactiveAlerts={{
                    ...proactiveAlerts,
                    celebrations: proactiveAlerts.celebrations || [],
                    healthReminders: proactiveAlerts.healthReminders || []
                  }}
                  onQuickReply={handleQuickReply}
                  onShowSoulForm={() => setShowSoulFormModal(true)}
                  onShowTopPicks={() => setShowTopPicksPanel(true)}
                />
              )}
              
              {/* Conversation Messages */}
              {conversationHistory.map((msg, idx) => (
                <ChatMessage
                  key={idx}
                  msg={msg}
                  index={idx}
                  pet={pet}
                  miraPicks={miraPicks}
                  miraMode={miraMode}
                  hapticFeedback={hapticFeedback}
                  onShowConcierge={() => setShowConciergePanel(true)}
                  onShowInsights={() => setShowInsightsPanel(true)}
                  onQuickReply={handleQuickReply}
                />
              ))}
              
              {/* Loading State */}
              <MiraLoader
                isProcessing={isProcessing}
                mode={miraMode}
                petName={pet?.name}
              />
              
              {/* Quick Replies */}
              {!isProcessing && quickReplies.length > 0 && conversationHistory.length > 0 && (
                <QuickReplies
                  replies={quickReplies}
                  onSelect={handleQuickReply}
                />
              )}
            </div>
          </div>
          
          {/* Chat Input */}
          <ChatInputBar
            query={query}
            setQuery={setQuery}
            onSubmit={handleSubmit}
            isProcessing={isProcessing}
            inputRef={inputRef}
            placeholder={`Ask Mira about ${pet?.name || 'your pet'}...`}
          />
        </div>
      </TabContent>
      
      {/* INSIGHTS TAB - Patterns */}
      <TabContent tabId="insights" activeTab={activeTab}>
        <div className="insights-content p-4">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-green-400" />
            Insights
          </h2>
          <div className="text-center py-8 text-gray-400">
            <TrendingUp size={48} className="mx-auto mb-3 opacity-50" />
            <p>Conversation insights will appear here</p>
            <p className="text-sm mt-1">Start chatting with Mira to build insights</p>
          </div>
        </div>
      </TabContent>
      
      {/* LEARN TAB - Knowledge */}
      <TabContent tabId="learn" activeTab={activeTab}>
        <div className="learn-content p-4">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <BookOpen size={20} className="text-orange-400" />
            Learn
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {['Training', 'Nutrition', 'Health', 'Behavior'].map((topic) => (
              <button 
                key={topic}
                onClick={() => setShowLearnModal(true)}
                className="p-4 bg-orange-500/20 rounded-xl text-white hover:bg-orange-500/30 transition"
              >
                {topic}
              </button>
            ))}
          </div>
        </div>
      </TabContent>
      
      {/* CONCIERGE TAB - Human */}
      <TabContent tabId="concierge" activeTab={activeTab}>
        <div className="concierge-content p-4">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Users size={20} className="text-pink-400" />
            Pet Concierge®
          </h2>
          
          <div className="bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-xl p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-pink-500/30 flex items-center justify-center">
              <Users size={32} className="text-pink-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Need Human Help?</h3>
            <p className="text-gray-300 mb-4">
              Our Pet Concierge® team is ready to coordinate complex requests for {pet?.name || 'your pet'}.
            </p>
            <button 
              onClick={() => setShowConciergePanel(true)}
              className="px-6 py-3 bg-pink-500 text-white rounded-full font-medium hover:bg-pink-600 transition"
              data-testid="concierge-connect-btn"
            >
              Connect with Concierge®
            </button>
          </div>
        </div>
      </TabContent>
      
      {/* ════════════════════════════════════════════════════════════════════
          MODALS & PANELS (Preserved from MiraDemoPage)
          ════════════════════════════════════════════════════════════════════ */}
      
      {/* Insights Panel */}
      {showInsightsPanel && (
        <Suspense fallback={<LazyFallback />}>
          <InsightsPanel
            isOpen={showInsightsPanel}
            onClose={() => { setShowInsightsPanel(false); setActiveTab('services'); }}
            petName={pet?.name}
            conversationHistory={conversationHistory}
          />
        </Suspense>
      )}
      
      {/* Concierge Panel */}
      {showConciergePanel && (
        <Suspense fallback={<LazyFallback />}>
          <ConciergePanel
            isOpen={showConciergePanel}
            onClose={() => { setShowConciergePanel(false); setActiveTab('services'); }}
            pet={pet}
          />
        </Suspense>
      )}
      
      {/* Past Chats Panel */}
      {showPastChats && (
        <Suspense fallback={<LazyFallback />}>
          <PastChatsPanel
            isOpen={showPastChats}
            onClose={() => setShowPastChats(false)}
            currentSessionId={sessionId}
            onStartNewChat={startNewSession}
          />
        </Suspense>
      )}
      
      {/* Learn Modal */}
      {showLearnModal && (
        <Suspense fallback={<LazyFallback />}>
          <LearnModal
            isOpen={showLearnModal}
            onClose={() => { setShowLearnModal(false); setActiveTab('services'); }}
            petName={pet?.name}
          />
        </Suspense>
      )}
      
      {/* Help Modal */}
      {showHelpModal && (
        <Suspense fallback={<LazyFallback />}>
          <HelpModal
            isOpen={showHelpModal}
            onClose={() => setShowHelpModal(false)}
          />
        </Suspense>
      )}
      
      {/* Soul Form Modal */}
      {showSoulFormModal && (
        <Suspense fallback={<LazyFallback />}>
          <SoulFormModal
            isOpen={showSoulFormModal}
            onClose={() => { setShowSoulFormModal(false); setActiveTab('services'); }}
            petId={pet?.id}
            petName={pet?.name}
            token={token}
          />
        </Suspense>
      )}
      
      {/* Health Vault Wizard */}
      {showHealthWizard && (
        <Suspense fallback={<LazyFallback />}>
          <HealthVaultWizard
            isOpen={showHealthWizard}
            onClose={() => setShowHealthWizard(false)}
            petId={pet?.id}
            petName={pet?.name}
          />
        </Suspense>
      )}
      
      {/* Top Picks Panel */}
      {showTopPicksPanel && (
        <Suspense fallback={<LazyFallback />}>
          <PersonalizedPicksPanel
            isOpen={showTopPicksPanel}
            onClose={() => { setShowTopPicksPanel(false); setActiveTab('services'); }}
            pet={pet}
            token={token}
          />
        </Suspense>
      )}
      
      {/* Unified Picks Vault */}
      <UnifiedPicksVault
        isOpen={showUnifiedVault}
        onClose={() => setShowUnifiedVault(false)}
        conversationPicks={[...(miraPicks.products || []), ...(miraPicks.services || [])]}
        tipCard={miraPicks.tipCard}
        currentPillar={currentPillar}
        pet={pet}
        allPets={allPets}
        token={token}
      />
      
      {/* Concierge Confirmation Banner */}
      <ConciergeConfirmation
        confirmation={conciergeConfirmation}
        onDismiss={() => setConciergeConfirmation(null)}
        petName={pet?.name || 'your pet'}
      />
      
      {/* Scroll to Bottom Button */}
      <ScrollToBottomButton 
        containerRef={messagesContainerRef}
        show={conversationHistory.length > 3}
      />
    </div>
  );
};

export default MiraOSPage;

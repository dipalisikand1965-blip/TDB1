/**
 * MiraOSPage.jsx
 * 
 * MIRA OS with 7-Dimension Header Shell Navigation
 * 
 * TABS (Dimensions):
 * 1. MOJO (Context) - Who the system is thinking about
 * 2. TODAY (Temporal) - What needs attention right now  
 * 3. PICKS (Intelligence) - What makes sense for this dog in this moment
 * 4. SERVICES (Execution) - What is being arranged or completed [DEFAULT]
 * 5. INSIGHTS (Patterns) - What we're learning over time
 * 6. LEARN (Knowledge) - What the pet parent should understand better
 * 7. CONCIERGE (Human) - When human intervention is needed
 * 
 * DUAL PLACEMENT: All elements appear in both original location AND new tab
 * Route: /mira-os
 */

import React, { useState, useEffect, useRef, useCallback, lazy, Suspense, memo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Mic, MicOff, Send, MessageCircle, Package, Calendar, 
  HelpCircle, Heart, Sparkles, ChevronDown, ChevronUp, ChevronRight,
  ShoppingBag, PawPrint, Bot, History, Plus, Check, Search,
  ThumbsUp, ThumbsDown, X, Phone, Mail, MessageSquare, AlertCircle,
  Star, Crown, Gift, Volume2, VolumeX, Wand2, ArrowRight, ExternalLink, Shield,
  Award, RefreshCw, MapPin, Navigation, Play, TrendingUp, BookOpen, Users,
  Activity, Pill, Stethoscope, Clock, Bell, Info, ChevronLeft, Zap,
  Home, FileText, Settings, Eye, AlertTriangle, CheckCircle, XCircle
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
// EXISTING COMPONENTS - All preserved from MiraDemoPage (DUAL PLACEMENT)
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
import '../styles/mira-header-shell.css';

// ═══════════════════════════════════════════════════════════════════════════════
// PICK CARD COMPONENT - For Picks Tab
// ═══════════════════════════════════════════════════════════════════════════════
const PickCard = memo(({ pick, petName, onAction, showReason = true }) => {
  const [expanded, setExpanded] = useState(false);
  
  const getPillarColor = (pillar) => {
    const colors = {
      'care': 'from-blue-500 to-cyan-500',
      'feed': 'from-amber-500 to-orange-500',
      'fit': 'from-green-500 to-emerald-500',
      'enjoy': 'from-pink-500 to-rose-500',
      'travel': 'from-purple-500 to-violet-500',
      'celebrate': 'from-yellow-500 to-amber-500',
      'learn': 'from-indigo-500 to-blue-500'
    };
    return colors[pillar] || 'from-gray-500 to-gray-600';
  };

  return (
    <div 
      className="pick-card bg-white/5 rounded-xl border border-white/10 overflow-hidden"
      data-testid={`pick-card-${pick.id || pick.title?.toLowerCase().replace(/\s+/g, '-')}`}
    >
      {/* Header with score */}
      <div className={`px-4 py-2 bg-gradient-to-r ${getPillarColor(pick.pillar)} flex items-center justify-between`}>
        <span className="text-xs font-medium text-white/90 uppercase tracking-wide">
          {pick.pillar || 'recommendation'}
        </span>
        {pick.final_score && (
          <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full text-white">
            Score: {Math.round(pick.final_score)}
          </span>
        )}
      </div>
      
      {/* Content */}
      <div className="p-4">
        <h4 className="font-semibold text-white mb-1">{pick.title || pick.name}</h4>
        
        {/* Soul-first reason */}
        {showReason && pick.reason && (
          <p className="text-sm text-gray-300 mb-3">
            {pick.reason.replace('{pet_name}', petName)}
          </p>
        )}
        
        {/* Tags */}
        {pick.tags && pick.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {pick.tags.slice(0, 3).map((tag, idx) => (
              <span key={idx} className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-gray-300">
                {tag}
              </span>
            ))}
          </div>
        )}
        
        {/* Why this? expander */}
        {pick.signals && (
          <button 
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-purple-400 flex items-center gap-1 mb-3 hover:text-purple-300"
          >
            <Info size={12} />
            Why this pick?
            <ChevronDown size={12} className={`transform transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
        )}
        
        {expanded && pick.signals && (
          <div className="bg-white/5 rounded-lg p-3 mb-3 text-xs text-gray-400">
            <p className="font-medium text-gray-300 mb-1">Signals used:</p>
            <ul className="space-y-1">
              {pick.signals.map((signal, idx) => (
                <li key={idx} className="flex items-center gap-1">
                  <CheckCircle size={10} className="text-green-400" />
                  {signal}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* CTA */}
        <button 
          onClick={() => onAction?.(pick)}
          className="w-full py-2 px-4 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm font-medium transition flex items-center justify-center gap-2"
        >
          {pick.cta || 'Learn more'}
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
});

PickCard.displayName = 'PickCard';

// ═══════════════════════════════════════════════════════════════════════════════
// SAFETY OVERRIDE BANNER - For safety warnings in Picks
// ═══════════════════════════════════════════════════════════════════════════════
const SafetyOverrideBanner = memo(({ safetyOverride, petName }) => {
  if (!safetyOverride || !safetyOverride.active) return null;
  
  return (
    <div 
      className="safety-override-banner bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 rounded-xl p-4 mb-4"
      data-testid="safety-override-banner"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-red-500/30 flex items-center justify-center flex-shrink-0">
          <AlertTriangle size={20} className="text-red-400" />
        </div>
        <div>
          <h4 className="font-semibold text-red-300 mb-1">
            {safetyOverride.title || 'Safety Notice'}
          </h4>
          <p className="text-sm text-gray-300">
            {safetyOverride.message?.replace('{pet_name}', petName) || 
             `Some recommendations are adjusted for ${petName}'s safety.`}
          </p>
          {safetyOverride.suppressions && safetyOverride.suppressions.length > 0 && (
            <div className="mt-2 text-xs text-gray-400">
              <span className="font-medium">Suppressed: </span>
              {safetyOverride.suppressions.join(', ')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

SafetyOverrideBanner.displayName = 'SafetyOverrideBanner';

// ═══════════════════════════════════════════════════════════════════════════════
// CONCIERGE BLOCK - For Concierge® Tab
// ═══════════════════════════════════════════════════════════════════════════════
const ConciergeBlock = memo(({ conciergeData, petName, onConnect }) => {
  if (!conciergeData) return null;
  
  return (
    <div 
      className="concierge-block bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-500/30 rounded-xl p-4 mb-4"
      data-testid="concierge-block"
    >
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center flex-shrink-0">
          <Users size={24} className="text-white" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-white mb-1">
            Concierge® can coordinate
          </h4>
          <p className="text-sm text-gray-300 mb-3">
            {conciergeData.reason || `This request for ${petName} needs human coordination.`}
          </p>
          
          {/* Required details */}
          {conciergeData.required_details && conciergeData.required_details.length > 0 && (
            <div className="bg-white/5 rounded-lg p-3 mb-3">
              <p className="text-xs font-medium text-gray-300 mb-2">Information needed:</p>
              <ul className="space-y-1">
                {conciergeData.required_details.map((detail, idx) => (
                  <li key={idx} className="text-xs text-gray-400 flex items-center gap-1">
                    <ChevronRight size={10} />
                    {detail}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <button 
            onClick={onConnect}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 rounded-lg text-white text-sm font-medium transition"
          >
            Connect with Concierge®
          </button>
        </div>
      </div>
    </div>
  );
});

ConciergeBlock.displayName = 'ConciergeBlock';

// ═══════════════════════════════════════════════════════════════════════════════
// SOUL COMPLETENESS METER - For Mojo Tab
// ═══════════════════════════════════════════════════════════════════════════════
const SoulCompletenessMeter = memo(({ score, tier, answered, total }) => {
  const completeness = total > 0 ? Math.round((answered / total) * 100) : 0;
  
  const getTierColor = (tier) => {
    const colors = {
      'newcomer': 'text-gray-400',
      'soul_starter': 'text-blue-400',
      'soul_seeker': 'text-purple-400',
      'soul_explorer': 'text-pink-400',
      'soul_guardian': 'text-amber-400'
    };
    return colors[tier] || 'text-gray-400';
  };
  
  return (
    <div className="soul-completeness bg-white/5 rounded-xl p-4" data-testid="soul-completeness">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-400">Soul Completeness</span>
        <span className={`text-sm font-medium ${getTierColor(tier)}`}>
          {tier?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Newcomer'}
        </span>
      </div>
      
      {/* Progress bar */}
      <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-2">
        <div 
          className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full transition-all duration-500"
          style={{ width: `${completeness}%` }}
        />
      </div>
      
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>{answered} of {total} questions answered</span>
        <span className="font-medium text-pink-400">{Math.round(score)}% score</span>
      </div>
    </div>
  );
});

SoulCompletenessMeter.displayName = 'SoulCompletenessMeter';

// ═══════════════════════════════════════════════════════════════════════════════
// HEALTH FLAGS SUMMARY - For Mojo Tab
// ═══════════════════════════════════════════════════════════════════════════════
const HealthFlagsSummary = memo(({ healthData, onOpenHealthVault }) => {
  const allergies = healthData?.allergies || [];
  const medications = healthData?.medications || [];
  const conditions = healthData?.conditions || [];
  
  const hasData = allergies.length > 0 || medications.length > 0 || conditions.length > 0;
  
  return (
    <div className="health-flags bg-white/5 rounded-xl p-4" data-testid="health-flags">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-white flex items-center gap-2">
          <Shield size={16} className="text-green-400" />
          Health Flags
        </h4>
        <button 
          onClick={onOpenHealthVault}
          className="text-xs text-purple-400 hover:text-purple-300"
        >
          {hasData ? 'Edit' : 'Add'}
        </button>
      </div>
      
      {hasData ? (
        <div className="space-y-2">
          {allergies.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <AlertCircle size={14} className="text-red-400" />
              <span className="text-gray-300">Allergies: {allergies.join(', ')}</span>
            </div>
          )}
          {medications.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <Pill size={14} className="text-blue-400" />
              <span className="text-gray-300">Meds: {medications.join(', ')}</span>
            </div>
          )}
          {conditions.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <Stethoscope size={14} className="text-purple-400" />
              <span className="text-gray-300">Conditions: {conditions.join(', ')}</span>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-400">
          No health flags recorded yet. Add allergies, medications, or conditions.
        </p>
      )}
    </div>
  );
});

HealthFlagsSummary.displayName = 'HealthFlagsSummary';

// ═══════════════════════════════════════════════════════════════════════════════
// CORE TRAITS SNAPSHOT - For Mojo Tab
// ═══════════════════════════════════════════════════════════════════════════════
const CoreTraitsSnapshot = memo(({ soulAnswers, petName }) => {
  const traits = [];
  
  if (soulAnswers?.temperament) {
    traits.push({ label: 'Temperament', value: soulAnswers.temperament, icon: Heart });
  }
  if (soulAnswers?.energy_level) {
    traits.push({ label: 'Energy', value: soulAnswers.energy_level, icon: Zap });
  }
  if (soulAnswers?.social_preference) {
    traits.push({ label: 'Social', value: soulAnswers.social_preference, icon: Users });
  }
  if (soulAnswers?.grooming_tolerance) {
    traits.push({ label: 'Grooming', value: soulAnswers.grooming_tolerance, icon: Sparkles });
  }
  
  if (traits.length === 0) {
    return (
      <div className="core-traits bg-white/5 rounded-xl p-4 text-center">
        <p className="text-sm text-gray-400">
          Answer Soul questions to reveal {petName}'s personality traits
        </p>
      </div>
    );
  }
  
  return (
    <div className="core-traits bg-white/5 rounded-xl p-4" data-testid="core-traits">
      <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
        <Heart size={16} className="text-pink-400" />
        Core Traits
      </h4>
      <div className="grid grid-cols-2 gap-2">
        {traits.map((trait, idx) => (
          <div key={idx} className="bg-white/5 rounded-lg p-2">
            <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
              <trait.icon size={10} />
              {trait.label}
            </div>
            <p className="text-sm text-white truncate">{trait.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
});

CoreTraitsSnapshot.displayName = 'CoreTraitsSnapshot';

// ═══════════════════════════════════════════════════════════════════════════════
// MIRA OS PAGE WITH FULL HEADER SHELL IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════════════════════
const MiraOSPage = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  
  // ═══════════════════════════════════════════════════════════════════════════
  // HEADER SHELL STATE - Controls which tab is active
  // ═══════════════════════════════════════════════════════════════════════════
  const [activeTab, setActiveTab] = useState('services'); // Default to Services (execution)
  const [tabBadges, setTabBadges] = useState({
    mojo: 0,
    today: 0,
    picks: 0,
    services: 0,
    insights: 0,
    learn: 0,
    concierge: 0
  });
  
  // Store scroll position per tab
  const tabScrollPositions = useRef({});
  
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
  const [pastSessions, setPastSessions] = useState([]);
  const [loadingPastChats, setLoadingPastChats] = useState(false);
  
  // Modal states - DUAL PLACEMENT (modals still work independently)
  const [showInsightsPanel, setShowInsightsPanel] = useState(false);
  const [showConciergePanel, setShowConciergePanel] = useState(false);
  const [conciergeRequest, setConciergeRequest] = useState('');
  const [conciergeSending, setConciergeSending] = useState(false);
  const [conciergeSent, setConciergeSent] = useState(false);
  const [showPastChats, setShowPastChats] = useState(false);
  const [showLearnModal, setShowLearnModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showSoulFormModal, setShowSoulFormModal] = useState(false);
  const [showHealthWizard, setShowHealthWizard] = useState(false);
  const [showTopPicksPanel, setShowTopPicksPanel] = useState(false);
  const [showUnifiedVault, setShowUnifiedVault] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  
  // Pet data states
  const [soulKnowledge, setSoulKnowledge] = useState({ 
    items: [], 
    soulScore: 0, 
    tier: 'newcomer',
    answered: 0,
    total: 20,
    answers: {}
  });
  const [proactiveAlerts, setProactiveAlerts] = useState({ 
    smartAlerts: [], 
    criticalCount: 0,
    celebrations: [],
    healthReminders: [],
    upcomingEvents: []
  });
  const [miraPicks, setMiraPicks] = useState({ 
    products: [], 
    services: [], 
    picks: [],
    tipCard: null, 
    hasNew: false 
  });
  const [healthData, setHealthData] = useState({
    allergies: [],
    medications: [],
    conditions: [],
    vetDetails: null
  });
  
  // Concierge® & Safety states (from chat responses)
  const [conciergeData, setConciergeData] = useState(null);
  const [safetyOverride, setSafetyOverride] = useState(null);
  
  // Other states
  const [conciergeConfirmation, setConciergeConfirmation] = useState(null);
  const [activeMemoryContext, setActiveMemoryContext] = useState(null);
  const [miraMode, setMiraMode] = useState('GENERAL');
  const [currentPillar, setCurrentPillar] = useState(null);
  
  const inputRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const servicesScrollRef = useRef(null);
  
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
          if (data.success || data.overall_score !== undefined) {
            setSoulKnowledge({
              items: data.knowledgeItems || [],
              soulScore: data.soulScore || data.overall_score || 0,
              tier: data.score_tier || data.tier || 'newcomer',
              answered: data.answered_count || Object.keys(data.doggy_soul_answers || {}).length,
              total: data.total_questions || 20,
              answers: data.doggy_soul_answers || data.soul_answers || {}
            });
            
            // Update mojo badge if profile incomplete
            const completeness = (data.answered_count || 0) / (data.total_questions || 20);
            if (completeness < 0.5) {
              setTabBadges(prev => ({ ...prev, mojo: 1 }));
            }
          }
        })
        .catch(console.error);
      
      // Fetch proactive alerts
      fetch(`${API_URL}/api/mira/proactive/${pet.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.alerts || data.smartAlerts) {
            const alerts = data.alerts || data.smartAlerts || [];
            setProactiveAlerts({
              smartAlerts: alerts,
              criticalCount: data.criticalCount || alerts.filter(a => a.priority === 'high').length,
              celebrations: data.celebrations || [],
              healthReminders: data.healthReminders || [],
              upcomingEvents: data.upcomingEvents || []
            });
            // Update today tab badge
            setTabBadges(prev => ({
              ...prev,
              today: data.criticalCount || alerts.filter(a => a.priority === 'high').length
            }));
          }
        })
        .catch(console.error);
      
      // Fetch top picks
      fetch(`${API_URL}/api/mira/top-picks/${pet.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.picks || data.products || data.services) {
            const allPicks = data.picks || [...(data.products || []), ...(data.services || [])];
            setMiraPicks({
              products: data.products || allPicks.filter(p => p.type === 'product'),
              services: data.services || allPicks.filter(p => p.type === 'service'),
              picks: allPicks,
              tipCard: data.tipCard || null,
              hasNew: allPicks.length > 0
            });
            setTabBadges(prev => ({ ...prev, picks: allPicks.length }));
          }
        })
        .catch(console.error);
        
      // Fetch health data
      fetch(`${API_URL}/api/pets/${pet.id}/soul`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.soul_answers) {
            setHealthData({
              allergies: data.soul_answers?.allergies || data.soul_answers?.allergy_list || [],
              medications: data.soul_answers?.medications || [],
              conditions: data.soul_answers?.health_conditions || [],
              vetDetails: data.soul_answers?.vet_details || null
            });
          }
        })
        .catch(console.error);
    }
  }, [pet?.id, token]);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // FETCH PAST SESSIONS
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (user?.email && token) {
      setLoadingPastChats(true);
      fetch(`${API_URL}/api/mira/sessions?email=${encodeURIComponent(user.email)}&limit=20`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.sessions) {
            setPastSessions(data.sessions);
          }
        })
        .catch(console.error)
        .finally(() => setLoadingPastChats(false));
    }
  }, [user?.email, token]);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // HANDLE TAB CHANGE - Preserve scroll position
  // ═══════════════════════════════════════════════════════════════════════════
  const handleTabChange = useCallback((tabId) => {
    hapticFeedback.buttonTap?.();
    
    // Save current scroll position
    if (servicesScrollRef.current && activeTab === 'services') {
      tabScrollPositions.current['services'] = servicesScrollRef.current.scrollTop;
    }
    
    setActiveTab(tabId);
    
    // Clear badge for the tab being opened
    setTabBadges(prev => ({ ...prev, [tabId]: 0 }));
  }, [activeTab]);
  
  // Restore scroll position when returning to services
  useEffect(() => {
    if (activeTab === 'services' && servicesScrollRef.current) {
      const savedPosition = tabScrollPositions.current['services'] || 0;
      servicesScrollRef.current.scrollTop = savedPosition;
    }
  }, [activeTab]);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // SWITCH PET - Preserve across tabs
  // ═══════════════════════════════════════════════════════════════════════════
  const switchPet = useCallback((newPet) => {
    setPet(newPet);
    setShowPetSelector(false);
    setConversationHistory([]);
    generateNewSessionId();
    // Reset tab-specific data
    setMiraPicks({ products: [], services: [], picks: [], tipCard: null, hasNew: false });
    setConciergeData(null);
    setSafetyOverride(null);
  }, [setPet, setShowPetSelector, generateNewSessionId]);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // HANDLE QUICK REPLY
  // ═══════════════════════════════════════════════════════════════════════════
  const handleQuickReply = useCallback((text) => {
    setQuery(text);
    setActiveTab('services'); // Switch to services tab for chat
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  }, []);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // HANDLE SUBMIT - Main chat handler
  // ═══════════════════════════════════════════════════════════════════════════
  const handleSubmit = useCallback(async (e) => {
    e?.preventDefault?.();
    if (!query.trim() || isProcessing) return;
    
    const userMessage = query.trim();
    setQuery('');
    setIsProcessing(true);
    setActiveTab('services'); // Ensure we're on services tab
    
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
        content: data.response || data.message || 'I apologise, I had trouble understanding that.',
        timestamp: new Date(),
        pillar: data.pillar,
        picks: data.picks,
        tipCard: data.tip_card,
        isEmergency: data.is_emergency,
        concierge: data.concierge,
        safety_override: data.safety_override
      }]);
      
      // Update picks if present → Picks Tab
      if (data.picks?.length > 0) {
        const newPicks = data.picks;
        setMiraPicks(prev => ({
          ...prev,
          products: [...prev.products, ...newPicks.filter(p => p.type === 'product')],
          services: [...prev.services, ...newPicks.filter(p => p.type === 'service')],
          picks: [...prev.picks, ...newPicks],
          hasNew: true
        }));
        setTabBadges(prev => ({ ...prev, picks: prev.picks + newPicks.length }));
      }
      
      // Update concierge data → Concierge® Tab
      if (data.concierge) {
        setConciergeData(data.concierge);
        setTabBadges(prev => ({ ...prev, concierge: 1 }));
      }
      
      // Update safety override → Picks Tab warning
      if (data.safety_override) {
        setSafetyOverride(data.safety_override);
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
        // Suppress commerce in picks
        setSafetyOverride({
          active: true,
          title: 'Emergency Mode Active',
          message: `We're focused on ${pet?.name || 'your pet'}'s safety. Commerce recommendations suppressed.`,
          suppressions: ['shop', 'products', 'rewards']
        });
      }
      
    } catch (error) {
      console.error('[MIRA CHAT] Error:', error);
      setConversationHistory(prev => [...prev, {
        type: 'mira',
        content: 'I apologise, I encountered an error. Please try again.',
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
    setConciergeData(null);
    setSafetyOverride(null);
    setMiraMode('GENERAL');
    setActiveTab('services');
  }, [generateNewSessionId]);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // HANDLE PICK ACTION
  // ═══════════════════════════════════════════════════════════════════════════
  const handlePickAction = useCallback((pick) => {
    hapticFeedback.buttonTap?.();
    // Navigate to services and ask about this pick
    setQuery(`Tell me more about ${pick.title || pick.name}`);
    setActiveTab('services');
  }, []);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="mira-os-page mp-container" data-testid="mira-os-page">
      {/* MEMORY WHISPER - Global overlay */}
      <MemoryWhisper 
        memoryContext={activeMemoryContext}
        petName={pet?.name || 'your pet'}
        onDismiss={() => setActiveMemoryContext(null)}
        autoDismissDelay={8000}
      />
      
      {/* MAIN HEADER - Always visible */}
      <header className="mp-header sticky top-0 z-50">
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
          
          {/* Right: Notification + Pet Selector (Compact) */}
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
          HEADER SHELL - 7 Dimension Tabs
          ════════════════════════════════════════════════════════════════════ */}
      <MiraHeaderShell
        activeTab={activeTab}
        onTabChange={handleTabChange}
        badges={tabBadges}
      />
      
      {/* ════════════════════════════════════════════════════════════════════
          TAB CONTENT AREAS - Each dimension
          ════════════════════════════════════════════════════════════════════ */}
      
      {/* ══════════════════════════════════════════════════════════════════
          1. MOJO TAB (Context Layer)
          Who the system is thinking about
          ══════════════════════════════════════════════════════════════════ */}
      <TabContent tabId="mojo" activeTab={activeTab}>
        <div className="mojo-content p-4 pb-24 space-y-4" data-testid="mojo-tab-content">
          {/* Pet Identity Card - Full context */}
          <div className="pet-identity-card bg-gradient-to-br from-pink-500/10 to-purple-500/10 border border-pink-500/20 rounded-xl p-4">
            <div className="flex items-start gap-4">
              {pet?.photo ? (
                <img 
                  src={pet.photo} 
                  alt={pet.name}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-pink-400/50"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center">
                  <PawPrint size={32} className="text-white" />
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white">{pet?.name || 'Your Pet'}</h2>
                <p className="text-gray-400 text-sm">
                  {pet?.breed || 'Breed not set'} 
                  {pet?.age && ` • ${pet.age}`}
                  {pet?.weight && ` • ${pet.weight}kg`}
                </p>
                {pet?.city && (
                  <p className="text-gray-500 text-xs flex items-center gap-1 mt-1">
                    <MapPin size={10} />
                    {pet.city}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          {/* Soul Completeness Meter */}
          <SoulCompletenessMeter 
            score={soulKnowledge.soulScore}
            tier={soulKnowledge.tier}
            answered={soulKnowledge.answered}
            total={soulKnowledge.total}
          />
          
          {/* Core Traits Snapshot */}
          <CoreTraitsSnapshot 
            soulAnswers={soulKnowledge.answers}
            petName={pet?.name || 'your pet'}
          />
          
          {/* Health Flags Summary */}
          <HealthFlagsSummary 
            healthData={healthData}
            onOpenHealthVault={() => setShowHealthWizard(true)}
          />
          
          {/* Soul Actions */}
          <div className="soul-actions space-y-2">
            <h4 className="text-sm font-medium text-gray-400 mb-2">Soul Actions</h4>
            <button 
              onClick={() => setShowSoulFormModal(true)}
              className="w-full p-4 bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 rounded-xl text-white flex items-center gap-3 hover:from-pink-500/30 hover:to-purple-500/30 transition"
              data-testid="mojo-continue-soul-btn"
            >
              <div className="w-10 h-10 rounded-full bg-pink-500/30 flex items-center justify-center">
                <Heart size={20} className="text-pink-400" />
              </div>
              <div className="flex-1 text-left">
                <span className="font-medium">Continue Soul Journey</span>
                <p className="text-xs text-gray-400">
                  {soulKnowledge.answered < soulKnowledge.total 
                    ? `${soulKnowledge.total - soulKnowledge.answered} questions remaining`
                    : 'Review and update answers'}
                </p>
              </div>
              <ChevronRight size={20} className="text-gray-400" />
            </button>
            
            <button 
              onClick={() => setShowHealthWizard(true)}
              className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white flex items-center gap-3 hover:bg-white/10 transition"
              data-testid="mojo-health-vault-btn"
            >
              <div className="w-10 h-10 rounded-full bg-green-500/30 flex items-center justify-center">
                <Shield size={20} className="text-green-400" />
              </div>
              <div className="flex-1 text-left">
                <span className="font-medium">Health Vault</span>
                <p className="text-xs text-gray-400">Allergies, medications, conditions</p>
              </div>
              <ChevronRight size={20} className="text-gray-400" />
            </button>
          </div>
          
          {/* DUAL PLACEMENT: Soul Knowledge Ticker also appears here */}
          {soulKnowledge.items.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-400 mb-2">What Mira Knows</h4>
              <div className="bg-white/5 rounded-xl p-3 space-y-2">
                {soulKnowledge.items.slice(0, 5).map((item, idx) => (
                  <div key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                    <CheckCircle size={14} className="text-green-400 mt-0.5 flex-shrink-0" />
                    {item.label || item}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </TabContent>
      
      {/* ══════════════════════════════════════════════════════════════════
          2. TODAY TAB (Temporal Layer)
          What needs attention right now
          ══════════════════════════════════════════════════════════════════ */}
      <TabContent tabId="today" activeTab={activeTab}>
        <div className="today-content p-4 pb-24 space-y-4" data-testid="today-tab-content">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Calendar size={20} className="text-yellow-400" />
            Today for {pet?.name || 'Your Pet'}
          </h2>
          
          {/* Critical Alerts */}
          {proactiveAlerts.criticalCount > 0 && (
            <div className="critical-alerts bg-red-500/10 border border-red-500/30 rounded-xl p-4">
              <h3 className="text-sm font-medium text-red-400 flex items-center gap-2 mb-2">
                <AlertTriangle size={16} />
                Needs Attention ({proactiveAlerts.criticalCount})
              </h3>
              {proactiveAlerts.smartAlerts
                .filter(a => a.priority === 'high')
                .map((alert, idx) => (
                  <div key={idx} className="bg-white/5 rounded-lg p-3 mb-2 last:mb-0">
                    <p className="text-white text-sm">{alert.title || alert.message}</p>
                    {alert.action && (
                      <button 
                        onClick={() => {
                          setQuery(alert.action.query || `Help with ${alert.title}`);
                          setActiveTab('services');
                        }}
                        className="mt-2 text-xs text-red-400 hover:text-red-300"
                      >
                        {alert.action.label || 'Take action'} →
                      </button>
                    )}
                  </div>
                ))}
            </div>
          )}
          
          {/* Proactive Alerts Banner - DUAL PLACEMENT */}
          {proactiveAlerts.smartAlerts?.length > 0 ? (
            <ProactiveAlertsBanner
              alerts={proactiveAlerts.smartAlerts}
              criticalCount={proactiveAlerts.criticalCount}
              maxVisible={10}
              onAskMira={(message) => {
                setActiveTab('services');
                setQuery(message);
              }}
              onBookNow={(request) => {
                setActiveTab('services');
                setQuery(`I want to book ${request.title}`);
              }}
              onDismiss={async (alertId) => {
                try {
                  await fetch(`${API_URL}/api/mira/proactive/dismiss/${alertId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_email: user?.email })
                  });
                  setProactiveAlerts(prev => ({
                    ...prev,
                    smartAlerts: prev.smartAlerts.filter(a => a.id !== alertId)
                  }));
                } catch (e) { console.log('Could not dismiss alert'); }
              }}
            />
          ) : (
            <div className="text-center py-8 text-gray-400 bg-white/5 rounded-xl">
              <Calendar size={48} className="mx-auto mb-3 opacity-50" />
              <p>No reminders for today</p>
              <p className="text-sm mt-1">Check back later or ask Mira about upcoming events</p>
            </div>
          )}
          
          {/* Upcoming Events */}
          {proactiveAlerts.upcomingEvents?.length > 0 && (
            <div className="upcoming-events">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Coming Up</h3>
              <div className="space-y-2">
                {proactiveAlerts.upcomingEvents.map((event, idx) => (
                  <div key={idx} className="bg-white/5 rounded-lg p-3 flex items-center gap-3">
                    <Clock size={16} className="text-yellow-400" />
                    <div>
                      <p className="text-white text-sm">{event.title}</p>
                      <p className="text-xs text-gray-400">{event.date || event.when}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Route Link: Family Dashboard */}
          <Link 
            to="/family-dashboard"
            className="block w-full p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-white hover:bg-yellow-500/20 transition"
            data-testid="today-plan-link"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-500/30 flex items-center justify-center">
                <Calendar size={20} className="text-yellow-400" />
              </div>
              <div className="flex-1">
                <span className="font-medium">Family Dashboard</span>
                <p className="text-xs text-gray-400">View full calendar and plans</p>
              </div>
              <ExternalLink size={16} className="text-gray-400" />
            </div>
          </Link>
        </div>
      </TabContent>
      
      {/* ══════════════════════════════════════════════════════════════════
          3. PICKS TAB (Intelligence Layer)
          What makes sense for this dog in this moment
          ══════════════════════════════════════════════════════════════════ */}
      <TabContent tabId="picks" activeTab={activeTab}>
        <div className="picks-content p-4 pb-24 space-y-4" data-testid="picks-tab-content">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Sparkles size={20} className="text-purple-400" />
            Picks for {pet?.name || 'Your Pet'}
          </h2>
          
          {/* Safety Override Banner */}
          <SafetyOverrideBanner 
            safetyOverride={safetyOverride}
            petName={pet?.name || 'your pet'}
          />
          
          {/* Soul-first nudge if profile incomplete */}
          {soulKnowledge.answered < 5 && (
            <div className="soul-nudge bg-pink-500/10 border border-pink-500/30 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Heart size={20} className="text-pink-400 mt-0.5" />
                <div>
                  <p className="text-white text-sm">
                    Answer 1 quick question to improve picks for {pet?.name}
                  </p>
                  <button 
                    onClick={() => setShowSoulFormModal(true)}
                    className="mt-2 text-xs text-pink-400 hover:text-pink-300"
                  >
                    Answer now →
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Picks Grid */}
          {miraPicks.picks?.length > 0 ? (
            <div className="space-y-3">
              {miraPicks.picks.map((pick, idx) => (
                <PickCard 
                  key={pick.id || idx}
                  pick={pick}
                  petName={pet?.name || 'your pet'}
                  onAction={handlePickAction}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 bg-white/5 rounded-xl">
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
          
          {/* DUAL PLACEMENT: Personalized Picks Panel trigger */}
          {miraPicks.picks?.length > 0 && (
            <button 
              onClick={() => setShowTopPicksPanel(true)}
              className="w-full p-3 bg-white/5 rounded-xl text-center text-sm text-purple-400 hover:bg-white/10 transition"
            >
              View all personalized picks →
            </button>
          )}
        </div>
      </TabContent>
      
      {/* ══════════════════════════════════════════════════════════════════
          4. SERVICES TAB (Execution Layer) - DEFAULT
          What is being arranged or completed
          ══════════════════════════════════════════════════════════════════ */}
      <TabContent tabId="services" activeTab={activeTab}>
        <div className="services-content flex flex-col h-[calc(100vh-180px)]" data-testid="services-tab-content">
          {/* New Chat Button */}
          <div className="px-4 py-2 flex items-center justify-between border-b border-white/10">
            <span className="text-sm text-gray-400">
              {conversationHistory.length > 0 ? `${conversationHistory.length} messages` : 'New conversation'}
            </span>
            <button 
              onClick={startNewSession}
              className="flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300"
              data-testid="services-new-chat-btn"
            >
              <Plus size={14} />
              New Chat
            </button>
          </div>
          
          {/* Main Chat Area */}
          <div 
            ref={servicesScrollRef}
            className="mp-messages flex-1 overflow-y-auto"
          >
            <div className="mp-messages-inner p-4">
              {/* Welcome State */}
              {conversationHistory.length === 0 && !isProcessing && (
                <WelcomeHero
                  pet={pet}
                  token={token}
                  proactiveGreeting={null}
                  proactiveAlerts={proactiveAlerts}
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
                  onShowConcierge={() => {
                    setShowConciergePanel(true);
                    setActiveTab('concierge');
                  }}
                  onShowInsights={() => {
                    setShowInsightsPanel(true);
                    setActiveTab('insights');
                  }}
                  onQuickReply={handleQuickReply}
                />
              ))}
              
              {/* Loading State */}
              <MiraLoader
                isProcessing={isProcessing}
                mode={miraMode}
                petName={pet?.name}
              />
              
              {/* Quick Replies - DUAL PLACEMENT (also in Picks) */}
              {!isProcessing && quickReplies.length > 0 && conversationHistory.length > 0 && (
                <QuickReplies
                  replies={quickReplies}
                  onSelect={handleQuickReply}
                />
              )}
              
              {/* Inline Picks Banner (compact) */}
              {miraPicks.hasNew && miraPicks.picks?.length > 0 && !miraMode.includes('EMERGENCY') && (
                <div 
                  className="inline-picks-banner bg-purple-500/10 border border-purple-500/30 rounded-xl p-3 mt-4 cursor-pointer hover:bg-purple-500/20 transition"
                  onClick={() => setActiveTab('picks')}
                >
                  <div className="flex items-center gap-2">
                    <Gift size={16} className="text-purple-400" />
                    <span className="text-sm text-white">
                      {miraPicks.picks.length} new pick{miraPicks.picks.length > 1 ? 's' : ''} for {pet?.name}
                    </span>
                    <ChevronRight size={14} className="text-gray-400 ml-auto" />
                  </div>
                </div>
              )}
              
              {/* Inline Concierge® Chip */}
              {conciergeData && (
                <div 
                  className="inline-concierge-chip bg-pink-500/10 border border-pink-500/30 rounded-xl p-3 mt-4 cursor-pointer hover:bg-pink-500/20 transition"
                  onClick={() => setActiveTab('concierge')}
                >
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-pink-400" />
                    <span className="text-sm text-white">Concierge® can help with this</span>
                    <ChevronRight size={14} className="text-gray-400 ml-auto" />
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Chat Input - Never hidden */}
          <div className="chat-input-wrapper p-4 border-t border-white/10 bg-[#0f0a19]">
            <ChatInputBar
              query={query}
              setQuery={setQuery}
              onSubmit={handleSubmit}
              isProcessing={isProcessing}
              inputRef={inputRef}
              placeholder={`Ask Mira about ${pet?.name || 'your pet'}...`}
            />
          </div>
          
          {/* Route Link: Orders */}
          <div className="px-4 pb-4">
            <Link 
              to="/orders"
              className="block w-full p-3 bg-white/5 rounded-xl text-center text-sm text-gray-400 hover:bg-white/10 transition"
              data-testid="services-orders-link"
            >
              <Package size={14} className="inline mr-2" />
              View Orders & Bookings
            </Link>
          </div>
        </div>
      </TabContent>
      
      {/* ══════════════════════════════════════════════════════════════════
          5. INSIGHTS TAB (Pattern Layer)
          What we're learning over time
          ══════════════════════════════════════════════════════════════════ */}
      <TabContent tabId="insights" activeTab={activeTab}>
        <div className="insights-content p-4 pb-24 space-y-4" data-testid="insights-tab-content">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <TrendingUp size={20} className="text-green-400" />
            Insights
          </h2>
          
          {/* Past Chats Section */}
          <div className="past-chats-section">
            <h3 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
              <History size={14} />
              Recent Conversations
            </h3>
            
            {loadingPastChats ? (
              <div className="text-center py-4 text-gray-400">Loading...</div>
            ) : pastSessions.length > 0 ? (
              <div className="space-y-2">
                {pastSessions.slice(0, 5).map((session, idx) => (
                  <div 
                    key={session.session_id || idx}
                    className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition cursor-pointer"
                    onClick={() => {
                      // Load this session
                      setSessionId(session.session_id);
                      setActiveTab('services');
                    }}
                  >
                    <p className="text-white text-sm truncate">{session.preview || session.first_message || 'Conversation'}</p>
                    <p className="text-xs text-gray-400 mt-1">{session.date || session.created_at}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-400 bg-white/5 rounded-xl">
                <p>No past conversations yet</p>
              </div>
            )}
            
            {pastSessions.length > 5 && (
              <button 
                onClick={() => setShowPastChats(true)}
                className="w-full mt-2 p-2 text-sm text-green-400 hover:text-green-300"
              >
                View all conversations →
              </button>
            )}
          </div>
          
          {/* Mira Insights Section */}
          <div className="mira-insights-section">
            <h3 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
              <PawPrint size={14} />
              What Mira Has Learned
            </h3>
            
            {soulKnowledge.items.length > 0 ? (
              <div className="bg-white/5 rounded-xl p-4 space-y-3">
                {soulKnowledge.items.slice(0, 8).map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm">
                    <CheckCircle size={14} className="text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">{item.label || item}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-400 bg-white/5 rounded-xl">
                <p>Insights will appear as you chat with Mira</p>
              </div>
            )}
          </div>
          
          {/* Open Full Insights Panel */}
          <button 
            onClick={() => setShowInsightsPanel(true)}
            className="w-full p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-white hover:bg-green-500/20 transition"
            data-testid="insights-full-panel-btn"
          >
            <div className="flex items-center gap-3">
              <TrendingUp size={20} className="text-green-400" />
              <div className="flex-1 text-left">
                <span className="font-medium">View Full Insights</span>
                <p className="text-xs text-gray-400">Patterns, trends, and learnings</p>
              </div>
              <ChevronRight size={16} className="text-gray-400" />
            </div>
          </button>
        </div>
      </TabContent>
      
      {/* ══════════════════════════════════════════════════════════════════
          6. LEARN TAB (Knowledge Layer)
          What the pet parent should understand better
          ══════════════════════════════════════════════════════════════════ */}
      <TabContent tabId="learn" activeTab={activeTab}>
        <div className="learn-content p-4 pb-24 space-y-4" data-testid="learn-tab-content">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <BookOpen size={20} className="text-orange-400" />
            Learn
          </h2>
          
          {/* Category Grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { name: 'Training', icon: Award, color: 'orange' },
              { name: 'Nutrition', icon: Utensils, color: 'green' },
              { name: 'Health', icon: Heart, color: 'red' },
              { name: 'Behavior', icon: Activity, color: 'blue' },
              { name: 'Grooming', icon: Sparkles, color: 'purple' },
              { name: 'Safety', icon: Shield, color: 'yellow' }
            ].map((cat) => (
              <button 
                key={cat.name}
                onClick={() => setShowLearnModal(true)}
                className={`p-4 bg-${cat.color}-500/10 border border-${cat.color}-500/30 rounded-xl text-white hover:bg-${cat.color}-500/20 transition flex flex-col items-center gap-2`}
                style={{ 
                  background: `rgba(var(--${cat.color}-rgb, 249, 115, 22), 0.1)`,
                  borderColor: `rgba(var(--${cat.color}-rgb, 249, 115, 22), 0.3)`
                }}
              >
                <cat.icon size={24} className={`text-${cat.color}-400`} />
                <span className="text-sm">{cat.name}</span>
              </button>
            ))}
          </div>
          
          {/* Breed Guidance (only if breed is set and useful) */}
          {pet?.breed && pet.breed !== 'Unknown' && pet.breed !== 'Mixed' && (
            <div className="breed-guidance bg-white/5 rounded-xl p-4">
              <h3 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                <Info size={14} className="text-orange-400" />
                About {pet.breed}s
              </h3>
              <p className="text-sm text-gray-400">
                Learn breed-specific care tips, common health considerations, and training approaches.
              </p>
              <button 
                onClick={() => {
                  setQuery(`Tell me about caring for a ${pet.breed}`);
                  setActiveTab('services');
                }}
                className="mt-2 text-xs text-orange-400 hover:text-orange-300"
              >
                Ask Mira about {pet.breed} care →
              </button>
            </div>
          )}
          
          {/* Help Section */}
          <button 
            onClick={() => setShowHelpModal(true)}
            className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition"
            data-testid="learn-help-btn"
          >
            <div className="flex items-center gap-3">
              <HelpCircle size={20} className="text-gray-400" />
              <div className="flex-1 text-left">
                <span className="font-medium">Help & FAQ</span>
                <p className="text-xs text-gray-400">Common questions answered</p>
              </div>
              <ChevronRight size={16} className="text-gray-400" />
            </div>
          </button>
          
          {/* Open Video Library */}
          <button 
            onClick={() => setShowLearnModal(true)}
            className="w-full p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl text-white hover:bg-orange-500/20 transition"
            data-testid="learn-videos-btn"
          >
            <div className="flex items-center gap-3">
              <Play size={20} className="text-orange-400" />
              <div className="flex-1 text-left">
                <span className="font-medium">Video Library</span>
                <p className="text-xs text-gray-400">Training guides and tutorials</p>
              </div>
              <ChevronRight size={16} className="text-gray-400" />
            </div>
          </button>
        </div>
      </TabContent>
      
      {/* ══════════════════════════════════════════════════════════════════
          7. CONCIERGE TAB (Human Layer)
          When human intervention is needed
          ══════════════════════════════════════════════════════════════════ */}
      <TabContent tabId="concierge" activeTab={activeTab}>
        <div className="concierge-content p-4 pb-24 space-y-4" data-testid="concierge-tab-content">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Users size={20} className="text-pink-400" />
            Pet Concierge®
          </h2>

          {/* ── Send a freeform request to Concierge® ── */}
          <div className="concierge-freeform bg-white/5 border border-pink-500/30 rounded-xl p-4">
            <p className="text-sm text-gray-300 mb-3">
              Tell Concierge® exactly what you need for <span className="text-pink-300 font-medium">{pet?.name || 'your pet'}</span>:
            </p>
            {conciergeSent ? (
              <div className="text-center py-4">
                <CheckCircle size={28} className="text-green-400 mx-auto mb-2" />
                <p className="text-sm text-green-400 font-medium">Sent to Concierge® ✓</p>
                <p className="text-xs text-gray-400 mt-1">Your team will respond via WhatsApp or the Service Desk.</p>
                <button onClick={() => { setConciergeSent(false); setConciergeRequest(''); }} className="mt-3 text-xs text-gray-400 underline">Send another request</button>
              </div>
            ) : (
              <div className="space-y-3">
                <textarea
                  value={conciergeRequest}
                  onChange={(e) => setConciergeRequest(e.target.value)}
                  placeholder={`e.g. "Book a spa grooming session for ${pet?.name || 'my dog'} this weekend" or "Find a vet that specialises in joint health"`}
                  rows={3}
                  data-testid="concierge-freetext-input"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:border-pink-500/50"
                />
                <button
                  onClick={async () => {
                    if (!conciergeRequest.trim() || conciergeSending) return;
                    setConciergeSending(true);
                    try {
                      await fetch(`${API_URL}/api/concierge/pillar-request`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
                        body: JSON.stringify({
                          pillar: 'mira_os',
                          request_label: conciergeRequest.trim().slice(0, 80),
                          request_type: 'freeform',
                          source: 'mira_os_concierge_tab',
                          message: conciergeRequest.trim(),
                          pet_name: pet?.name,
                          pet_breed: pet?.breed,
                          member_name: user?.name,
                          member_email: user?.email,
                        })
                      });
                      setConciergeSent(true);
                    } catch {
                      // Show sent anyway for UX
                      setConciergeSent(true);
                    } finally {
                      setConciergeSending(false);
                    }
                  }}
                  disabled={!conciergeRequest.trim() || conciergeSending}
                  data-testid="concierge-send-btn"
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition"
                >
                  <Send size={14} />
                  {conciergeSending ? 'Sending...' : 'Send to Concierge®'}
                </button>
              </div>
            )}
          </div>
          
          {/* Active Concierge® Block (from chat) */}
          {conciergeData && (
            <ConciergeBlock 
              conciergeData={conciergeData}
              petName={pet?.name || 'your pet'}
              onConnect={() => setShowConciergePanel(true)}
            />
          )}
          
          {/* Main Concierge® CTA */}
          <div className="concierge-main bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-500/30 rounded-xl p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
              <Users size={32} className="text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Need Human Help?</h3>
            <p className="text-gray-300 mb-4 text-sm">
              Our Pet Concierge® team is ready to coordinate complex requests for {pet?.name || 'your pet'}.
            </p>
            <button 
              onClick={() => setShowConciergePanel(true)}
              className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-full font-medium transition"
              data-testid="concierge-connect-btn"
            >
              Connect with Concierge®
            </button>
          </div>
          
          {/* What Concierge® Can Help With */}
          <div className="concierge-services">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Quick requests:</h3>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {[
                { label: `Create outdoor pack for ${pet?.name || 'my pet'}`, icon: '🎒', value: `Please create a personalised outdoor adventure pack for ${pet?.name || 'my dog'} (${pet?.breed || 'mixed breed'}). Include recommendations for walks, parks, and travel gear.` },
                { label: `Plan ${pet?.name || 'my pet'}'s birthday cake`, icon: '🎂', value: `I'd like to plan a custom birthday cake for ${pet?.name || 'my dog'} (${pet?.breed || 'mixed breed'}). Please suggest breed-appropriate flavours and designs.` },
                { label: 'Book a grooming session', icon: '✂️', value: `Please arrange a professional grooming session for ${pet?.name || 'my dog'} at the earliest available slot.` },
                { label: 'Find a specialist vet', icon: '🩺', value: `I need a specialist veterinarian recommendation for ${pet?.name || 'my dog'} (${pet?.breed || 'mixed breed'}). Please help coordinate an appointment.` },
              ].map((item) => (
                <button
                  key={item.value}
                  onClick={() => { setConciergeRequest(item.value); setConciergeSent(false); }}
                  className="p-3 bg-white/5 border border-white/10 rounded-xl text-left hover:bg-white/10 transition text-sm text-gray-300 flex gap-2 items-start"
                >
                  <span className="text-base leading-none mt-0.5 flex-shrink-0">{item.icon}</span>
                  <span className="text-xs leading-snug">{item.label}</span>
                </button>
              ))}
            </div>
            <h3 className="text-sm font-medium text-gray-400 mb-2">Concierge® can also help with:</h3>
            <div className="space-y-2">
              {[
                'Complex travel arrangements',
                'Multi-service coordination',
                'Emergency situations',
                'Special dietary needs',
                'Vet appointment coordination',
                'Custom requests'
              ].map((service, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm text-gray-300">
                  <CheckCircle size={14} className="text-pink-400" />
                  {service}
                </div>
              ))}
            </div>
          </div>
          
          {/* Contact Options */}
          <div className="contact-options grid grid-cols-3 gap-2">
            <a 
              href="https://wa.me/919876543210"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 bg-green-500/10 border border-green-500/30 rounded-xl flex flex-col items-center gap-1 hover:bg-green-500/20 transition"
            >
              <MessageCircle size={20} className="text-green-400" />
              <span className="text-xs text-gray-300">WhatsApp</span>
            </a>
            <a 
              href="tel:+919876543210"
              className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl flex flex-col items-center gap-1 hover:bg-blue-500/20 transition"
            >
              <Phone size={20} className="text-blue-400" />
              <span className="text-xs text-gray-300">Call</span>
            </a>
            <a 
              href="mailto:concierge@thedoggycompany.in"
              className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl flex flex-col items-center gap-1 hover:bg-purple-500/20 transition"
            >
              <Mail size={20} className="text-purple-400" />
              <span className="text-xs text-gray-300">Email</span>
            </a>
          </div>
        </div>
      </TabContent>
      
      {/* ════════════════════════════════════════════════════════════════════
          DUAL PLACEMENT: Original UI Elements (kept for Phase 1)
          These will be removed after verification
          ════════════════════════════════════════════════════════════════════ */}
      
      {/* NavigationDock - DUAL PLACEMENT (will be removed after Phase 2) */}
      <NavigationDock
        onConciergeClick={() => {
          hapticFeedback.buttonTap?.();
          setActiveTab('concierge');
          inputRef.current?.focus();
        }}
        onOrdersClick={() => navigate('/orders')}
        onPlanClick={() => navigate('/family-dashboard')}
        onHelpClick={() => {
          hapticFeedback.buttonTap?.();
          setActiveTab('learn');
          setShowHelpModal(true);
        }}
        onSoulClick={() => {
          hapticFeedback.buttonTap?.();
          setActiveTab('mojo');
          setShowSoulFormModal(true);
        }}
        onLearnClick={() => {
          hapticFeedback.buttonTap?.();
          setActiveTab('learn');
          setShowLearnModal(true);
        }}
      />
      
      {/* FloatingActionBar - DUAL PLACEMENT (will be removed after Phase 2) */}
      {conversationHistory.length > 0 && activeTab === 'services' && (
        <FloatingActionBar
          onHistoryClick={() => {
            hapticFeedback.buttonTap?.();
            setActiveTab('insights');
            setShowPastChats(true);
          }}
          onInsightsClick={() => {
            hapticFeedback.buttonTap?.();
            setActiveTab('insights');
            setShowInsightsPanel(true);
          }}
          onConciergeClick={() => {
            hapticFeedback.buttonTap?.();
            setActiveTab('concierge');
            setShowConciergePanel(true);
          }}
          onNewChatClick={startNewSession}
        />
      )}
      
      {/* ════════════════════════════════════════════════════════════════════
          MODALS & PANELS - All preserved (work independently of tabs)
          ════════════════════════════════════════════════════════════════════ */}
      
      {/* Insights Panel */}
      {showInsightsPanel && (
        <Suspense fallback={<LazyFallback />}>
          <InsightsPanel
            isOpen={showInsightsPanel}
            onClose={() => setShowInsightsPanel(false)}
            petName={pet?.name}
            conversationHistory={conversationHistory}
          />
        </Suspense>
      )}
      
      {/* Concierge® Panel */}
      {showConciergePanel && (
        <Suspense fallback={<LazyFallback />}>
          <ConciergePanel
            isOpen={showConciergePanel}
            onClose={() => setShowConciergePanel(false)}
            pet={pet}
            conciergeData={conciergeData}
          />
        </Suspense>
      )}
      
      {/* Past Chats Panel */}
      {showPastChats && (
        <Suspense fallback={<LazyFallback />}>
          <PastChatsPanel
            isOpen={showPastChats}
            onClose={() => setShowPastChats(false)}
            sessions={pastSessions}
            currentSessionId={sessionId}
            onSelectSession={(session) => {
              setSessionId(session.session_id);
              setShowPastChats(false);
              setActiveTab('services');
            }}
            onStartNewChat={startNewSession}
          />
        </Suspense>
      )}
      
      {/* Learn Modal */}
      {showLearnModal && (
        <Suspense fallback={<LazyFallback />}>
          <LearnModal
            isOpen={showLearnModal}
            onClose={() => setShowLearnModal(false)}
            petName={pet?.name}
            breed={pet?.breed}
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
            onClose={() => {
              setShowSoulFormModal(false);
              // Refresh soul data
              if (pet?.id && token) {
                fetch(`${API_URL}/api/pet-soul/profile/${pet.id}`, {
                  headers: { Authorization: `Bearer ${token}` }
                })
                  .then(res => res.json())
                  .then(data => {
                    if (data.success || data.overall_score !== undefined) {
                      setSoulKnowledge({
                        items: data.knowledgeItems || [],
                        soulScore: data.soulScore || data.overall_score || 0,
                        tier: data.score_tier || data.tier || 'newcomer',
                        answered: data.answered_count || 0,
                        total: data.total_questions || 20,
                        answers: data.doggy_soul_answers || {}
                      });
                    }
                  })
                  .catch(console.error);
              }
            }}
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
            onSave={(data) => {
              setHealthData(data);
              setShowHealthWizard(false);
            }}
          />
        </Suspense>
      )}
      
      {/* Top Picks Panel */}
      {showTopPicksPanel && (
        <Suspense fallback={<LazyFallback />}>
          <PersonalizedPicksPanel
            isOpen={showTopPicksPanel}
            onClose={() => setShowTopPicksPanel(false)}
            pet={pet}
            token={token}
            picks={miraPicks.picks}
          />
        </Suspense>
      )}
      
      {/* Service Request Modal */}
      {showServiceModal && (
        <Suspense fallback={<LazyFallback />}>
          <ServiceRequestModal
            isOpen={showServiceModal}
            onClose={() => setShowServiceModal(false)}
            pet={pet}
            user={user}
          />
        </Suspense>
      )}
      
      {/* Unified Picks Vault */}
      <UnifiedPicksVault
        isOpen={showUnifiedVault}
        onClose={() => setShowUnifiedVault(false)}
        conversationPicks={miraPicks.picks}
        tipCard={miraPicks.tipCard}
        currentPillar={currentPillar}
        pet={pet}
        allPets={allPets}
        token={token}
      />
      
      {/* Concierge® Confirmation Banner */}
      <ConciergeConfirmation
        confirmation={conciergeConfirmation}
        onDismiss={() => setConciergeConfirmation(null)}
        petName={pet?.name || 'your pet'}
      />
      
      {/* Scroll to Bottom Button (Services tab only) */}
      {activeTab === 'services' && (
        <ScrollToBottomButton 
          containerRef={servicesScrollRef}
          show={conversationHistory.length > 3}
        />
      )}
    </div>
  );
};

// Missing icon - add Utensils
const Utensils = ({ size = 24, className = '' }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/>
    <path d="M7 2v20"/>
    <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>
  </svg>
);

export default MiraOSPage;

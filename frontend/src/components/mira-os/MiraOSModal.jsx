/**
 * MiraOSModal - The Full-Page Mira Operating System Experience
 * 
 * PARALLEL BUILD - Does NOT replace existing MiraChatWidget
 * Testing on /celebrate-new first
 * 
 * Features:
 * - Full-page on mobile (100vh), side-drawer on desktop
 * - Pet switcher with curated indicator
 * - Concierge® icon (hands) that lights up
 * - Unified Service Flow integration
 * - Swipe to dismiss on mobile
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, ChevronLeft, Volume2, VolumeX, Send, Mic, MicOff,
  Sparkles, PawPrint, Heart, HandHeart, Package,
  Loader2, Check, Clock, Shield, MessageSquare, RotateCcw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { getApiUrl } from '../../utils/api';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import ConciergeButton from '../Mira/ConciergeButton';

// Pillar configurations
const PILLAR_CONFIG = {
  celebrate: { 
    emoji: '🎂', 
    color: 'from-pink-500 to-rose-500', 
    name: 'Celebrate',
    greeting: "Let's make it special for"
  },
  dine: { 
    emoji: '🍽️', 
    color: 'from-orange-500 to-amber-500', 
    name: 'Dine',
    greeting: "What's on the menu for"
  },
  care: { 
    emoji: '💊', 
    color: 'from-rose-500 to-purple-500', 
    name: 'Care',
    greeting: "Taking care of"
  },
  shop: { 
    emoji: '🛒', 
    color: 'from-emerald-500 to-green-500', 
    name: 'Shop',
    greeting: "Shopping for"
  },
  general: { 
    emoji: '✨', 
    color: 'from-purple-500 to-pink-500', 
    name: 'Mira',
    greeting: "How can I help"
  }
};

// Pillar-specific concierge services
const PILLAR_SERVICES = {
  celebrate: [
    { icon: '🎂', title: 'Custom Birthday Party', description: 'Full party planning with venue, cake, guests & photography' },
    { icon: '🎁', title: 'Gotcha Day Celebration', description: 'Mark the day they joined your family' },
    { icon: '📸', title: 'Pet Photoshoot', description: 'Professional photography session for your pet' }
  ],
  dine: [
    { icon: '🍽️', title: 'Custom Meal Plan', description: 'Personalized nutrition plan based on soul profile' },
    { icon: '🎂', title: 'Birthday Cake Order', description: 'Custom cake matching dietary needs' },
    { icon: '🥘', title: 'Home-Cooked Meals', description: 'Fresh meals delivered weekly' }
  ],
  stay: [
    { icon: '🏨', title: 'Pet Hotel Booking', description: 'Curated stays matching your pet\'s comfort needs' },
    { icon: '🏠', title: 'Home Sitter', description: 'In-home pet sitting while you\'re away' },
    { icon: '✈️', title: 'Travel Boarding', description: 'Extended care for long trips' }
  ],
  travel: [
    { icon: '✈️', title: 'Pet Travel Planning', description: 'Complete travel arrangements with pet' },
    { icon: '🚗', title: 'Pet Taxi', description: 'Safe transport to vet, groomer, or anywhere' },
    { icon: '📋', title: 'Travel Documents', description: 'Help with pet passports & certificates' }
  ],
  care: [
    { icon: '💊', title: 'Vet Appointment', description: 'Book and coordinate veterinary visits' },
    { icon: '✂️', title: 'Grooming Session', description: 'Professional grooming based on breed needs' },
    { icon: '💉', title: 'Vaccination Reminder', description: 'Track and schedule vaccinations' }
  ],
  enjoy: [
    { icon: '🎾', title: 'Playdate Arrangement', description: 'Find compatible playmates' },
    { icon: '🏃', title: 'Dog Walker', description: 'Regular walks with trusted walkers' },
    { icon: '🏕️', title: 'Adventure Day', description: 'Curated outdoor experience' }
  ],
  fit: [
    { icon: '🏃', title: 'Fitness Plan', description: 'Exercise routine based on energy level' },
    { icon: '🏊', title: 'Swimming Session', description: 'Hydrotherapy or fun swim' },
    { icon: '🧘', title: 'Wellness Check', description: 'Complete health assessment' }
  ],
  learn: [
    { icon: '🎓', title: 'Training Program', description: 'Professional training matching temperament' },
    { icon: '🐕', title: 'Behavior Consultation', description: 'Address specific behavior concerns' },
    { icon: '📚', title: 'Puppy School', description: 'Socialization & basic training' }
  ],
  shop: [
    { icon: '🛒', title: 'Personal Shopper', description: 'Curated product selection' },
    { icon: '📦', title: 'Subscription Box', description: 'Monthly surprises based on preferences' },
    { icon: '🎁', title: 'Gift Hamper', description: 'Custom gift basket for any occasion' }
  ],
  emergency: [
    { icon: '🚨', title: '24/7 Emergency Support', description: 'Immediate assistance anytime' },
    { icon: '🏥', title: 'Emergency Vet Coordination', description: 'Quick vet access & transport' },
    { icon: '📞', title: 'Crisis Helpline', description: 'Immediate phone support' }
  ],
  advisory: [
    { icon: '💬', title: 'Expert Consultation', description: 'Talk to pet specialists' },
    { icon: '📋', title: 'Health Review', description: 'Comprehensive health assessment' },
    { icon: '🐾', title: 'Breed Guidance', description: 'Breed-specific care advice' }
  ],
  paperwork: [
    { icon: '📄', title: 'Registration Help', description: 'Pet registration & licensing' },
    { icon: '🏥', title: 'Insurance Assistance', description: 'Pet insurance guidance' },
    { icon: '📋', title: 'Document Management', description: 'Organize all pet records' }
  ],
  farewell: [
    { icon: '🌈', title: 'Rainbow Bridge Support', description: 'Compassionate end-of-life care' },
    { icon: '💐', title: 'Memorial Service', description: 'Honor their memory beautifully' },
    { icon: '🕊️', title: 'Grief Counseling', description: 'Support during difficult times' }
  ],
  adopt: [
    { icon: '🐕', title: 'Adoption Matching', description: 'Find the perfect companion' },
    { icon: '🏠', title: 'Home Preparation', description: 'Get ready for your new family member' },
    { icon: '📋', title: 'Adoption Paperwork', description: 'Navigate adoption process' }
  ],
  general: [
    { icon: '✨', title: 'Concierge® Request', description: 'Any request - we make it happen' },
    { icon: '💬', title: 'Ask Mira', description: 'Get personalized recommendations' }
  ]
};

// Concierge® state machine
const CONCIERGE_STATES = {
  idle: 'idle',
  active: 'active',
  pending: 'pending'
};

// Extract quick replies from API response (same logic as MiraChatWidget)
// Also generates contextual replies from Mira's questions
const extractQuickReplies = (data) => {
  if (!data) return [];
  
  // Try different sources for quick replies
  let chips = data.response?.chips || 
              data.response?.quick_replies || 
              data.chips ||
              data.quick_replies ||
              data.suggested_replies ||
              data.follow_ups ||  
              data.response?.follow_ups ||
              [];
  
  // If no explicit chips, check if Mira asked a question - generate contextual replies
  if (chips.length === 0 && data.response) {
    const responseText = typeof data.response === 'string' ? data.response : '';
    
    // Detect question patterns and generate contextual quick replies
    const questionPatterns = [
      // Food - regular vs treats
      { pattern: /regular.*meals|everyday meals|occasional treats|treats.*snacks/i, 
        replies: ['Regular everyday meals', 'Occasional treats/snacks', 'Both'] },
      // Food/Diet questions - kibble vs homemade
      { pattern: /stay on kibble|better brand|move towards.*home.?cooked|add.*meals/i, 
        replies: ['Stay on kibble, better brand', 'Add home-cooked meals', 'Mix of both'] },
      // Allergy questions  
      { pattern: /allergies|sensitive ingredients|allergic to|any known allergies/i,
        replies: ['No allergies', 'Has food allergies', 'Not sure, need to check'] },
      // Birthday/Celebration
      { pattern: /birthday.*coming|celebration|special occasion|gotcha day/i,
        replies: ['Yes, birthday coming up!', 'Just a treat day', 'Planning a party'] },
      // Weight/Health specific
      { pattern: /weight|skin|stool|digestive|health/i,
        replies: ['Weight management', 'Skin/coat health', 'Digestive health', 'General wellness'] },
      // Yes/No questions
      { pattern: /is that right|does that sound|shall I|would you like me to/i,
        replies: ['Yes, please!', 'No, let me explain', 'Tell me more'] },
      // Generic "or" choice questions
      { pattern: /,\s*or\s+(?:are you|is it|do you|would you)/i,
        replies: [] }, // Will be caught by extractOrChoices below
    ];
    
    // First try explicit patterns
    for (const { pattern, replies } of questionPatterns) {
      if (pattern.test(responseText) && replies.length > 0) {
        chips = replies;
        break;
      }
    }
    
    // If still no chips, try to extract choices from "X or Y" pattern in the question
    if (chips.length === 0) {
      const orMatch = responseText.match(/(?:Is this about|Are you asking about|Do you want|Would you prefer)\s+([^,?]+)(?:,\s*or\s+(?:are you asking about\s+)?([^?]+))\?/i);
      if (orMatch) {
        const choice1 = orMatch[1]?.trim();
        const choice2 = orMatch[2]?.trim();
        if (choice1 && choice2) {
          chips = [choice1, choice2, 'Both actually'];
        }
      }
    }
  }
  
  return chips.map(chip => {
    if (typeof chip === 'string') {
      return { text: chip, value: chip };
    }
    // Handle follow_ups format { text: 'xxx', type: 'yyy' }
    if (chip.text) {
      return { text: chip.text, value: chip.text };
    }
    // Handle quick_prompts format { label: 'xxx', message: 'yyy' }
    if (chip.label) {
      return { text: chip.label, value: chip.message || chip.label };
    }
    return chip;
  }).slice(0, 4); // Limit to 4 quick replies
};

// Pet Avatar Component
const PetAvatar = ({ pet, isActive, onClick, hasCuratedPicks }) => (
  <button
    onClick={onClick}
    className={`relative flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
      isActive 
        ? 'bg-purple-100 ring-2 ring-purple-500' 
        : 'bg-gray-50 hover:bg-gray-100'
    }`}
  >
    <div className="relative">
      <div className={`w-12 h-12 rounded-full overflow-hidden border-2 ${
        isActive ? 'border-purple-500' : 'border-gray-200'
      }`}>
        {pet.photo_url ? (
          <img src={pet.photo_url} alt={pet.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
            <PawPrint className="w-6 h-6 text-white" />
          </div>
        )}
      </div>
      {/* Curated picks indicator */}
      {hasCuratedPicks && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
          <Sparkles className="w-2.5 h-2.5 text-white" />
        </div>
      )}
    </div>
    <span className={`text-xs font-medium ${isActive ? 'text-purple-700' : 'text-gray-600'}`}>
      {pet.name}
    </span>
  </button>
);

// Concierge® Indicator Component
const ConciergeIndicator = ({ state, count = 0, onClick }) => {
  const stateStyles = {
    idle: 'text-gray-400 opacity-60',
    active: 'text-purple-500 shadow-lg shadow-purple-500/30',
    pending: 'text-purple-500 animate-pulse'
  };

  return (
    <button
      onClick={onClick}
      className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all ${stateStyles[state]}`}
      data-testid="concierge-indicator"
    >
      <HandHeart className="w-5 h-5" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-purple-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
          {count}
        </span>
      )}
    </button>
  );
};

// Mira's Pick Card (Concierge®-ready)
const MiraPickCard = ({ pick, petName, onSelect, isSelected }) => (
  <div 
    onClick={() => onSelect(pick)}
    className={`relative p-3 rounded-xl border-2 transition-all cursor-pointer ${
      isSelected 
        ? 'border-purple-500 bg-purple-50 shadow-lg' 
        : 'border-gray-200 bg-white hover:border-purple-300'
    }`}
  >
    {isSelected && (
      <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
        <Check className="w-4 h-4 text-white" />
      </div>
    )}
    <div className="flex gap-3">
      <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center text-2xl flex-shrink-0">
        {pick.emoji || '✨'}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-gray-900 text-sm line-clamp-2">{pick.title}</h4>
        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{pick.description}</p>
        <div className="flex items-center gap-1 mt-1.5">
          <Heart className="w-3 h-3 text-pink-500" />
          <span className="text-xs text-gray-600">Perfect for {petName}</span>
        </div>
      </div>
    </div>
  </div>
);

// Quick Action Chip
const QuickAction = ({ label, emoji, onClick, isPrimary }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all active:scale-95 ${
      isPrimary 
        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' 
        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    }`}
  >
    {emoji && <span className="mr-1">{emoji}</span>}
    {label}
  </button>
);

// Main MiraOS Modal Component
const MiraOSModal = ({ 
  isOpen, 
  onClose, 
  pillar = 'general',
  initialPicks = []
}) => {
  const { user, token } = useAuth();
  const { addToCart } = useCart();
  
  // State
  const [pets, setPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [conciergeState, setConciergeState] = useState(CONCIERGE_STATES.idle);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [picks, setPicks] = useState(initialPicks);
  const [selectedPicks, setSelectedPicks] = useState(new Set());
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeTab, setActiveTab] = useState('picks'); // picks | chat | services
  const [dynamicQuickActions, setDynamicQuickActions] = useState([]); // Dynamic context-aware prompts
  const [sessionId, setSessionId] = useState(() => `mira-os-${Date.now()}`); // Unique session per conversation
  const [intelligentPrompts, setIntelligentPrompts] = useState([]); // Soul-based intelligent prompts
  
  // Refs
  const modalRef = useRef(null);
  const chatEndRef = useRef(null);
  const audioRef = useRef(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  
  // Generate intelligent prompts based on pet's soul data - "Mira knows, Mira doesn't ask"
  const generateIntelligentPrompts = useCallback((pet) => {
    if (!pet) return [];
    
    const prompts = [];
    const now = new Date();
    
    // 1. Check for upcoming birthday (within 30 days)
    if (pet.dob || pet.birthday || pet.celebrations?.find(c => c.occasion === 'birthday')) {
      const birthdayData = pet.celebrations?.find(c => c.occasion === 'birthday');
      const dob = pet.dob || pet.birthday || birthdayData?.date;
      if (dob) {
        const birthDate = new Date(dob);
        const thisYearBirthday = new Date(now.getFullYear(), birthDate.getMonth(), birthDate.getDate());
        if (thisYearBirthday < now) {
          thisYearBirthday.setFullYear(now.getFullYear() + 1);
        }
        const daysUntil = Math.ceil((thisYearBirthday - now) / (1000 * 60 * 60 * 24));
        
        if (daysUntil <= 30 && daysUntil > 0) {
          prompts.push({
            text: `🎂 ${pet.name}'s birthday in ${daysUntil} days!`,
            value: `${pet.name}'s birthday is coming up in ${daysUntil} days. Help me plan something special that's dairy-free since ${pet.name} has allergies.`,
            priority: 1,
            type: 'celebration'
          });
        }
      }
    }
    
    // 2. Check allergies - suggest safe treats
    const allergies = pet.preferences?.allergies || pet.allergies || [];
    if (allergies.length > 0) {
      const allergyList = allergies.join(', ').toLowerCase();
      prompts.push({
        text: `🍖 ${allergyList}-free treats`,
        value: `Show me treats that are safe for ${pet.name} - no ${allergyList} since ${pet.name} is allergic.`,
        priority: 2,
        type: 'safety'
      });
    }
    
    // 3. Check temperament for anxiety help
    if (pet.temperament === 'anxious' || pet.learned_facts?.some(f => f.category === 'anxiety')) {
      const anxietyFact = pet.learned_facts?.find(f => f.category === 'anxiety');
      prompts.push({
        text: `💆 Calm ${pet.name}'s anxiety`,
        value: anxietyFact 
          ? `${pet.name} gets anxious when ${anxietyFact.content}. What calming products or techniques would help?`
          : `${pet.name} is anxious sometimes. What can help calm ${pet.name}?`,
        priority: 2,
        type: 'wellness'
      });
    }
    
    // 4. Check fears
    const fears = pet.learned_facts?.filter(f => f.category === 'fears') || [];
    if (fears.length > 0) {
      const fearContent = fears[0].content;
      prompts.push({
        text: `🛡️ Help with ${fearContent} fear`,
        value: `${pet.name} is scared of ${fearContent}. What products or training can help?`,
        priority: 3,
        type: 'training'
      });
    }
    
    // 5. Check for low-scoring folders - suggest discovery
    const folderScores = pet.folder_scores || {};
    const emptyFolders = Object.entries(folderScores)
      .filter(([_, score]) => score < 10)
      .map(([folder, _]) => folder);
    
    if (emptyFolders.length > 0) {
      const folderNames = {
        'adventure_outdoors': 'adventures',
        'rest_routines': 'sleep routine',
        'social_world': 'social life'
      };
      const friendlyName = folderNames[emptyFolders[0]] || emptyFolders[0].replace(/_/g, ' ');
      prompts.push({
        text: `✨ Tell me about ${pet.name}'s ${friendlyName}`,
        value: `I'd love to know more about ${pet.name}'s ${friendlyName}. Can you help me fill in this part of ${pet.name}'s soul profile?`,
        priority: 4,
        type: 'soul_discovery'
      });
    }
    
    // 6. Check favorite flavors
    const favorites = pet.preferences?.favorite_flavors || pet.learned_facts?.filter(f => f.category === 'loves') || [];
    if (favorites.length > 0) {
      const fav = typeof favorites[0] === 'string' ? favorites[0] : favorites[0]?.content;
      if (fav) {
        prompts.push({
          text: `❤️ ${fav} ${fav.toLowerCase().includes('treat') ? '' : 'treats'}`,
          value: `${pet.name} loves ${fav}! Show me the best ${fav.toLowerCase().includes('treat') ? fav : fav + ' treats'} options.`,
          priority: 3,
          type: 'favorites'
        });
      }
    }
    
    // 7. Pillar-specific prompt based on current page
    const pillarPrompts = {
      celebrate: { text: '🎁 Plan celebration', value: `Help me plan a special celebration for ${pet.name}` },
      dine: { text: '🍽️ Meal recommendations', value: `What's the best food for ${pet.name} based on their profile?` },
      care: { text: '💊 Health check', value: `What health care does ${pet.name} need based on their profile?` },
      travel: { text: '✈️ Travel prep', value: `Help me prepare ${pet.name} for travel` },
      stay: { text: '🏠 Comfort at home', value: `What would make ${pet.name} more comfortable at home?` }
    };
    
    if (pillarPrompts[pillar] && !prompts.some(p => p.type === pillarPrompts[pillar].text)) {
      prompts.push({
        ...pillarPrompts[pillar],
        priority: 5,
        type: 'pillar'
      });
    }
    
    // Sort by priority and return top 4
    return prompts
      .sort((a, b) => a.priority - b.priority)
      .slice(0, 4);
      
  }, [pillar]);
  
  // Function to start a fresh chat
  const startFreshChat = useCallback(() => {
    setMessages([]);
    setDynamicQuickActions([]);
    setSessionId(`mira-os-${Date.now()}`);
    setActiveTab('chat');
    console.log('[MiraOS] Fresh chat started for', selectedPet?.name);
    toast.success('Fresh conversation started!', {
      description: selectedPet ? `Ready to help with ${selectedPet.name}` : 'How can I help?',
      duration: 2000
    });
  }, [selectedPet]);
  
  const config = PILLAR_CONFIG[pillar] || PILLAR_CONFIG.general;
  
  // ElevenLabs TTS - Same as MiraChatWidget
  const speakWithElevenLabs = useCallback(async (text) => {
    if (!voiceEnabled) return false;
    
    try {
      setIsSpeaking(true);
      console.log('[MiraOS Voice] Attempting ElevenLabs TTS...');
      
      // Clean text for speech
      let cleanText = text
        .replace(/[🎉🐕✨🦴💜🎂🏥☀️🌤️🌙🌟🐾🎒📅📋😊💝🎁]/g, '')
        .replace(/\*\*/g, '')
        .replace(/[*#_~`]/g, '')
        .replace(/\[.*?\]/g, '')
        .replace(/\n/g, ' ')
        .substring(0, 500);
      
      const response = await fetch(`${getApiUrl()}/api/tts/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanText })
      });
      
      if (!response.ok) {
        throw new Error('ElevenLabs TTS failed');
      }
      
      const data = await response.json();
      console.log('[MiraOS Voice] ✓ ElevenLabs audio received, playing...');
      
      // Play audio
      const audio = new Audio(`data:audio/mpeg;base64,${data.audio_base64}`);
      audioRef.current = audio;
      
      audio.onended = () => {
        console.log('[MiraOS Voice] ✓ Audio playback complete');
        setIsSpeaking(false);
      };
      audio.onerror = (e) => {
        console.log('[MiraOS Voice] Audio playback error:', e);
        setIsSpeaking(false);
      };
      
      await audio.play();
      return true;
    } catch (error) {
      console.log('[MiraOS Voice] ElevenLabs unavailable:', error.message);
      setIsSpeaking(false);
      return false;
    }
  }, [voiceEnabled]);
  
  // Load pets on mount
  useEffect(() => {
    if (isOpen) {
      console.log('[MiraOS] Modal opened, token:', token ? 'present' : 'missing');
      if (token) {
        loadPets();
      }
      // Load picks even without token for non-personalized experience
      loadPicks();
    }
  }, [isOpen, token, pillar]);
  
  // Reload picks and clear chat when selected pet changes
  useEffect(() => {
    if (isOpen && selectedPet) {
      console.log('[MiraOS] Pet changed to:', selectedPet.name);
      loadPicks();
      // Clear chat for fresh conversation when switching pets
      setMessages([]);
      setDynamicQuickActions([]);
      // Generate new session ID for fresh conversation with this pet
      setSessionId(`mira-os-${selectedPet.id}-${Date.now()}`);
      // Generate intelligent prompts based on pet's soul - "Mira knows"
      const prompts = generateIntelligentPrompts(selectedPet);
      setIntelligentPrompts(prompts);
      console.log('[MiraOS] Generated', prompts.length, 'intelligent prompts for', selectedPet.name);
      console.log('[MiraOS] Chat cleared for fresh conversation with', selectedPet.name);
    }
  }, [selectedPet?.id, generateIntelligentPrompts]);
  
  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const loadPets = async () => {
    console.log('[MiraOS] Loading pets...');
    try {
      const response = await fetch(`${getApiUrl()}/api/pets`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('[MiraOS] Pets response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('[MiraOS] Pets loaded:', data.pets?.length || 0);
        setPets(data.pets || []);
        if (data.pets?.length > 0 && !selectedPet) {
          setSelectedPet(data.pets[0]);
        }
      }
    } catch (error) {
      console.error('[MiraOS] Failed to load pets:', error);
    }
  };
  
  const loadPicks = async () => {
    console.log('[MiraOS] Loading picks for', selectedPet?.name || 'general');
    try {
      // Try to load personalized picks from Mira's picks endpoint
      let response = await fetch(
        `${getApiUrl()}/api/mira/picks?pillar=${pillar}&pet_id=${selectedPet?.id || ''}`,
        { headers: token ? { 'Authorization': `Bearer ${token}` } : {} }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.picks?.length > 0) {
          setPicks(data.picks);
          console.log('[MiraOS] Loaded', data.picks.length, 'picks');
          return;
        }
      }
      
      // Fallback: Load products filtered by pillar and create smart picks
      response = await fetch(
        `${getApiUrl()}/api/products?pillar=${pillar}&limit=6`,
        { headers: token ? { 'Authorization': `Bearer ${token}` } : {} }
      );
      
      if (response.ok) {
        const data = await response.json();
        const products = data.products || [];
        
        // Convert products to picks format
        const smartPicks = products.slice(0, 6).map((product, index) => ({
          id: product.id || product._id || `pick-${index}`,
          title: product.title || product.name,
          description: product.description?.substring(0, 80) || `Perfect for ${selectedPet?.name || 'your pet'}`,
          emoji: pillar === 'celebrate' ? '🎂' : pillar === 'dine' ? '🍖' : '✨',
          type: 'product',
          price: product.price,
          image_url: product.image_url || product.images?.[0],
          product_id: product.id || product._id
        }));
        
        setPicks(smartPicks);
        console.log('[MiraOS] Created', smartPicks.length, 'smart picks from products');
      }
    } catch (error) {
      console.error('[MiraOS] Failed to load picks:', error);
    }
  };
  
  // Handle pick selection - triggers concierge state
  const handlePickSelect = (pick) => {
    const newSelected = new Set(selectedPicks);
    if (newSelected.has(pick.id)) {
      newSelected.delete(pick.id);
    } else {
      newSelected.add(pick.id);
    }
    setSelectedPicks(newSelected);
    
    // Update concierge state
    if (newSelected.size > 0) {
      setConciergeState(CONCIERGE_STATES.active);
    } else {
      setConciergeState(CONCIERGE_STATES.idle);
    }
  };
  
  // Send to Concierge® - triggers unified flow
  const sendToConcierge = async () => {
    if (selectedPicks.size === 0) return;
    
    const selectedItems = picks.filter(p => selectedPicks.has(p.id));
    setConciergeState(CONCIERGE_STATES.pending);
    
    try {
      const response = await fetch(`${getApiUrl()}/api/concierge/mira-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          type: selectedItems.length > 1 ? 'mira_bundle' : 'mira_recommendation',
          pillar,
          pet_id: selectedPet?.id,
          pet_name: selectedPet?.name,
          user_email: user?.email,  // Add user email for member notification
          recommendations: selectedItems.map(item => ({
            title: item.title,
            description: item.description,
            type: item.type,
            emoji: item.emoji
          })),
          source: 'mira_os',
          priority: 'normal'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setPendingRequests(prev => prev + 1);
        setSelectedPicks(new Set());
        
        toast.success(`Sent to Concierge®!`, {
          description: `${selectedItems.length} item(s) for ${selectedPet?.name || 'your pet'}`,
          duration: 4000
        });
        
        // Add confirmation message
        setMessages(prev => [...prev, {
          id: `confirm-${Date.now()}`,
          role: 'assistant',
          content: `✅ Perfect! I've sent your request to our Concierge® team. They'll prepare ${selectedItems.length > 1 ? 'these items' : 'this'} specially for ${selectedPet?.name || 'your pet'}. Request #${data.request_id || data.ticket_id}`,
          timestamp: new Date().toISOString()
        }]);
        
        setActiveTab('chat');
      }
    } catch (error) {
      console.error('Concierge® request error:', error);
      toast.error('Could not send request');
      setConciergeState(CONCIERGE_STATES.active);
    }
  };
  
  // Send chat message
  const sendMessage = async (text = inputValue) => {
    if (!text.trim() || isSending) return;
    
    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsSending(true);
    setActiveTab('chat');
    
    try {
      // Build FULL pet context - this is what Mira FAB does right!
      const petContext = selectedPet ? {
        id: selectedPet.id,
        name: selectedPet.name,
        breed: selectedPet.breed || selectedPet.identity?.breed,
        age: selectedPet.age || selectedPet.identity?.age,
        weight: selectedPet.weight || selectedPet.identity?.weight,
        birthday: selectedPet.birthday || selectedPet.identity?.birthday,
        allergies: selectedPet.allergies || selectedPet.health?.allergies || [],
        sensitivities: selectedPet.sensitivities || selectedPet.health?.sensitivities || [],
        preferences: selectedPet.preferences || selectedPet.food_preferences || {},
        personality: selectedPet.personality || selectedPet.behavior?.personality,
        activity_level: selectedPet.activity_level || selectedPet.behavior?.activity_level,
        favorite_treats: selectedPet.favorite_treats || selectedPet.preferences?.favorite_treats || [],
        // Soul data if available
        soul_score: selectedPet.soul_score,
        traits: selectedPet.traits || []
      } : null;
      
      console.log('[MiraOS] Sending chat with pet context:', petContext?.name);
      
      const response = await fetch(`${getApiUrl()}/api/mira/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          message: text.trim(),
          session_id: sessionId, // Use persistent session for conversation continuity
          source: 'mira_os',
          current_pillar: pillar,
          selected_pet_id: selectedPet?.id,
          // FULL PET CONTEXT - Critical for personalization!
          pet_context: petContext,
          pet_name: selectedPet?.name,
          pet_breed: selectedPet?.breed || selectedPet?.identity?.breed
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Extract quick replies from various possible locations in the response
        const quickReplies = extractQuickReplies(data);
        
        // Update dynamic quick actions for bottom bar
        if (quickReplies.length > 0) {
          setDynamicQuickActions(quickReplies);
        }
        
        setMessages(prev => [...prev, {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.response,
          products: data.products,
          quickReplies: quickReplies,
          timestamp: new Date().toISOString()
        }]);
        
        // Speak the response with ElevenLabs
        if (voiceEnabled && data.response) {
          speakWithElevenLabs(data.response);
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: "I'm having trouble connecting. Please try again.",
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsSending(false);
    }
  };
  
  // Swipe to dismiss (mobile)
  const handleTouchStart = (e) => {
    startY.current = e.touches[0].clientY;
  };
  
  const handleTouchMove = (e) => {
    currentY.current = e.touches[0].clientY;
    const diff = currentY.current - startY.current;
    if (diff > 0 && modalRef.current) {
      modalRef.current.style.transform = `translateY(${Math.min(diff, 200)}px)`;
    }
  };
  
  const handleTouchEnd = () => {
    const diff = currentY.current - startY.current;
    if (diff > 100) {
      onClose();
    }
    if (modalRef.current) {
      modalRef.current.style.transform = '';
    }
  };
  
  if (!isOpen) return null;
  
  const modalContent = (
    <div 
      className="fixed inset-0 z-[10000] flex items-end sm:items-stretch sm:justify-end"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal */}
      <div
        ref={modalRef}
        className={`
          relative bg-white flex flex-col overflow-hidden
          w-full h-[90dvh] rounded-t-3xl
          sm:w-[420px] sm:h-full sm:rounded-none sm:border-l sm:border-gray-200
          animate-in slide-in-from-bottom sm:slide-in-from-right duration-300
        `}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        data-testid="mira-os-modal"
      >
        {/* Drag Handle (mobile) */}
        <div className="sm:hidden flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>
        
        {/* Header */}
        <div className={`bg-gradient-to-r ${config.color} text-white p-4 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center sm:hidden"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="font-bold text-lg">Mira OS</h2>
              <p className="text-xs opacity-80">{config.greeting} {selectedPet?.name || 'your pet'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* New Chat / Refresh button */}
            <button
              onClick={startFreshChat}
              className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
              title="Start fresh chat"
              data-testid="mira-os-new-chat"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            <button
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"
              title={voiceEnabled ? 'Mute voice' : 'Enable voice'}
              data-testid="mira-os-voice-toggle"
            >
              {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
            {/* Concierge® Button - Two-way communication */}
            <ConciergeButton 
              variant="header"
              size="small"
              petId={selectedPet?.id}
              petName={selectedPet?.name}
              pillar={pillar}
            />
            <ConciergeIndicator 
              state={conciergeState} 
              count={pendingRequests}
              onClick={() => setActiveTab('chat')}
            />
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hidden sm:flex"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Pet Switcher */}
        {pets.length > 0 && (
          <div className="px-4 py-3 border-b bg-gray-50/50 overflow-x-auto">
            <div className="flex gap-2">
              {pets.map(pet => (
                <PetAvatar
                  key={pet.id}
                  pet={pet}
                  isActive={selectedPet?.id === pet.id}
                  onClick={() => setSelectedPet(pet)}
                  hasCuratedPicks={picks.length > 0}
                />
              ))}
            </div>
          </div>
        )}
        
        {/* Tab Bar - Now Pet-First and Pillar-Aware */}
        <div className="flex border-b">
          {[
            { 
              id: 'picks', 
              label: selectedPet ? `${selectedPet.name}'s Picks` : 'Picks', 
              icon: <Sparkles className="w-4 h-4" /> 
            },
            { 
              id: 'chat', 
              label: 'Chat with Mira', 
              icon: <MessageSquare className="w-4 h-4" /> 
            },
            { 
              id: 'services', 
              label: selectedPet ? `${selectedPet.name}'s Services` : 'Services', 
              icon: <Package className="w-4 h-4" /> 
            }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              data-testid={`mira-os-tab-${tab.id}`}
              className={`flex-1 py-3 text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-1 sm:gap-1.5 ${
                activeTab === tab.id 
                  ? 'text-purple-600 border-b-2 border-purple-600' 
                  : 'text-gray-500'
              }`}
            >
              {tab.icon} <span className="truncate max-w-[80px] sm:max-w-none">{tab.label}</span>
            </button>
          ))}
        </div>
        
        {/* Content Area - with safe bottom padding for keyboard */}
        <div className="flex-1 overflow-y-auto pb-4">
          {/* Picks Tab - Pillar-Specific */}
          {activeTab === 'picks' && (
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-purple-500" />
                <div>
                  <h3 className="font-bold text-gray-900">
                    {selectedPet?.name || 'Your'}'s {config.name} Picks
                  </h3>
                  <p className="text-xs text-gray-500">
                    Curated based on {selectedPet?.name || 'your pet'}'s soul + your conversations
                  </p>
                </div>
              </div>
              
              {picks.length > 0 ? (
                <>
                  {picks.map(pick => (
                    <MiraPickCard
                      key={pick.id}
                      pick={pick}
                      petName={selectedPet?.name || 'your pet'}
                      isSelected={selectedPicks.has(pick.id)}
                      onSelect={handlePickSelect}
                    />
                  ))}
                  
                  {selectedPicks.size > 0 && (
                    <button
                      onClick={sendToConcierge}
                      className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold flex items-center justify-center gap-2 mt-4"
                    >
                      <HandHeart className="w-5 h-5" />
                      Send {selectedPicks.size} to Concierge®
                    </button>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Mira is preparing picks for {selectedPet?.name || 'you'}...</p>
                </div>
              )}
            </div>
          )}
          
          {/* Chat Tab */}
          {activeTab === 'chat' && (
            <div className="p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                    <MessageSquare className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">Concierge®<sup className="text-xs">®</sup></h3>
                  <p className="text-sm text-gray-500">
                    {selectedPet 
                      ? `I already know ${selectedPet.name}. How can I help?` 
                      : `Your personal pet concierge is ready`}
                  </p>
                </div>
              ) : (
                messages.map((msg, msgIndex) => (
                  <div key={msg.id}>
                    <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                        msg.role === 'user'
                          ? `bg-gradient-to-r ${config.color} text-white rounded-br-sm`
                          : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                      }`}>
                        {/* Markdown rendering for Mira's responses */}
                        <div className="text-sm whitespace-pre-wrap prose prose-sm max-w-none [&_p]:mb-1 [&_ul]:mb-1 [&_ol]:mb-1 [&_li]:mb-0.5 [&_strong]:font-bold">
                          {msg.role === 'assistant' ? (
                            <ReactMarkdown
                              components={{
                                p: ({ children }) => <span className="block mb-1 last:mb-0">{children}</span>,
                                strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                                ul: ({ children }) => <ul className="list-disc pl-4 my-1">{children}</ul>,
                                ol: ({ children }) => <ol className="list-decimal pl-4 my-1">{children}</ol>,
                                li: ({ children }) => <li className="mb-0.5">{children}</li>,
                              }}
                            >
                              {msg.content}
                            </ReactMarkdown>
                          ) : (
                            msg.content
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Inline Quick Replies - Show for ALL assistant messages with quick replies */}
                    {msg.role === 'assistant' && 
                     msg.quickReplies && 
                     msg.quickReplies.length > 0 && (
                      <div className="mt-3 ml-0">
                        <div className="flex flex-wrap gap-2">
                          {msg.quickReplies.map((reply, idx) => (
                            <button
                              key={idx}
                              onClick={() => sendMessage(reply.value || reply.text || reply)}
                              className="px-4 py-2.5 text-sm font-medium rounded-full 
                                       bg-gradient-to-r from-purple-50 to-pink-50 
                                       text-purple-700 border border-purple-200 
                                       hover:from-purple-100 hover:to-pink-100 
                                       hover:border-purple-300 shadow-sm
                                       transition-all active:scale-95"
                              data-testid={`quick-reply-${idx}`}
                            >
                              {reply.text || reply}
                            </button>
                          ))}
                          {/* Add "Anything else" only if backend didn't include "Something else" */}
                          {!msg.quickReplies.some(r => 
                            (r.text || r || '').toLowerCase().includes('something else') ||
                            (r.text || r || '').toLowerCase().includes('anything else')
                          ) && (
                            <button
                              onClick={() => {
                                const input = document.querySelector('[data-testid="mira-os-chat-input"]');
                                if (input) input.focus();
                              }}
                              className="px-4 py-2.5 text-sm font-medium rounded-full 
                                       bg-gray-50 text-gray-600 border border-gray-200 
                                       hover:bg-gray-100 hover:border-gray-300 shadow-sm
                                       transition-all active:scale-95"
                              data-testid="quick-reply-anything-else"
                            >
                              ✏️ Anything else
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
              
              {isSending && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                      <span className="text-sm text-gray-500">Mira is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={chatEndRef} />
            </div>
          )}
          
          {/* Services Tab - Pillar-Specific Concierge® Services */}
          {activeTab === 'services' && (
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Package className="w-5 h-5 text-purple-500" />
                <div>
                  <h3 className="font-bold text-gray-900">
                    {selectedPet?.name || 'Your'}'s {config.name} Services
                  </h3>
                  <p className="text-xs text-gray-500">
                    Bespoke concierge services for {config.name.toLowerCase()}
                  </p>
                </div>
              </div>
              
              {/* Pillar-specific service cards */}
              {PILLAR_SERVICES[pillar]?.map((service, idx) => (
                <div 
                  key={idx}
                  className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white flex-shrink-0">
                      {service.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{service.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                      <p className="text-xs text-purple-600 mt-2">
                        Perfect for {selectedPet?.name || 'your pet'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      // Add to concierge requests and switch to chat
                      sendMessage(`I'd like to request ${service.title} for ${selectedPet?.name || 'my pet'}`);
                      setActiveTab('chat');
                    }}
                    className="w-full mt-3 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <HandHeart className="w-4 h-4" />
                    Let Mira Arrange This
                  </button>
                </div>
              )) || (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No services available for {config.name} yet</p>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Intelligent Quick Actions - "Mira knows, Mira doesn't ask" */}
        {(() => {
          const lastMsg = messages[messages.length - 1];
          const hasInlineReplies = lastMsg?.role === 'assistant' && lastMsg?.quickReplies?.length > 0;
          
          // Hide bottom bar when inline replies are shown
          if (hasInlineReplies) return null;
          
          return (
            <div className="px-4 py-2 border-t overflow-x-auto">
              <div className="flex gap-2">
                {dynamicQuickActions.length > 0 ? (
                  // Show dynamic quick actions from the last AI response
                  dynamicQuickActions.map((action, idx) => (
                    <QuickAction 
                      key={idx}
                      label={action.text || action}
                      onClick={() => sendMessage(action.value || action.text || action)}
                      isPrimary={idx === 0}
                    />
                  ))
                ) : intelligentPrompts.length > 0 ? (
                  // Show intelligent prompts based on pet's soul data - "Mira knows"
                  intelligentPrompts.map((prompt, idx) => (
                    <QuickAction 
                      key={idx}
                      label={prompt.text}
                      onClick={() => sendMessage(prompt.value)}
                      isPrimary={idx === 0}
                    />
                  ))
                ) : (
                  // Fallback when no intelligent prompts available
                  selectedPet ? (
                    <QuickAction 
                      label={`What does ${selectedPet.name} need today?`} 
                      onClick={() => sendMessage(`Based on everything you know about ${selectedPet.name}, what should I focus on today?`)}
                      isPrimary
                    />
                  ) : (
                    <QuickAction 
                      label="Get started" 
                      onClick={() => sendMessage('What can you help me with?')}
                      isPrimary
                    />
                  )
                )}
              </div>
            </div>
          );
        })()}
        
        {/* Input Area */}
        <div className="p-4 border-t bg-white">
          <div className="flex items-center gap-2">
            <button className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
              <Mic className="w-5 h-5" />
            </button>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder={selectedPet ? `Ask about ${selectedPet.name}...` : "Ask your Concierge®..."}
              className="flex-1 px-4 py-3 border rounded-full text-base focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={isSending}
              data-testid="mira-os-chat-input"
            />
            <button
              onClick={() => sendMessage()}
              disabled={!inputValue.trim() || isSending}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                inputValue.trim() && !isSending
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Safe Area Padding */}
        <div className="h-safe-area-inset-bottom bg-white" />
      </div>
    </div>
  );
  
  return createPortal(modalContent, document.body);
};

export default MiraOSModal;

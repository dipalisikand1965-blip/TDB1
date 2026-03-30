/**
 * UnifiedHero.jsx
 * A beautiful, personalized hero that makes Meister the HERO of every page
 * Pillar-specific messaging, seamless journey, world's best concierge feel
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Sparkles, Heart, Crown, PawPrint, Mic, MicOff, Loader2, Send, Shield, AlertTriangle, RefreshCw } from 'lucide-react';
import SoulScoreArc from './SoulScoreArc';
import MiraLoveNote from './MiraLoveNote';
import { getPillarMessage, getPillarTagline } from '../context/PillarContext';
import { useSafeTags } from '../hooks/mira/useSafeTags';
import { useAuth } from '../context/AuthContext';

/**
 * DOG SOUL COLORS - How a dog FEELS in each moment
 * These gradients reflect the emotional essence of each pillar from a dog's perspective
 * Mira sees and knows these feelings - this is the Pet Operating System soul
 * EACH PILLAR HAS A UNIQUE COLOR - NO DUPLICATES!
 */
const PILLAR_GRADIENTS = {
  // RECOMMENDED - The default Mira purple, omniscient and knowing
  recommended: 'from-[#4A1942] via-[#2D1B4E] to-[#1E3A5F]',
  
  // CELEBRATE - Pure joy, tail wagging, party excitement! Festive pink to purple
  celebrate: 'from-[#D4458B] via-[#9B4DCA] to-[#4A1942]',
  
  // DINE - Warm, satisfied belly, the comfort of a good meal. Rich amber to chocolate
  dine: 'from-[#D97706] via-[#92400E] to-[#451A03]',
  
  // CARE - Gentle touch, being groomed, feeling pampered. Fresh teal to soothing aqua
  care: 'from-[#14B8A6] via-[#0D9488] to-[#134E4A]',
  
  // ENJOY - Playful energy! Pure happiness. Vibrant coral to sunset orange
  enjoy: 'from-[#F43F5E] via-[#E11D48] to-[#4C0519]',
  
  // TRAVEL - Adventure calling! Open roads. Deep ocean blue to midnight
  travel: 'from-[#0369A1] via-[#075985] to-[#0C1929]',
  
  // STAY - Safe, cozy, home. Warm terracotta to earthy brown
  stay: 'from-[#C2410C] via-[#9A3412] to-[#431407]',
  
  // FIT - Active, alive, running free! Energetic lime to forest green
  fit: 'from-[#84CC16] via-[#4D7C0F] to-[#1A2E05]',
  
  // LEARN - Focused, curious, seeking knowledge. Royal indigo to deep navy
  learn: 'from-[#818CF8] via-[#4F46E5] to-[#1E1B4B]',
  
  // ADVISORY - Trust, wisdom, guidance. Elegant violet to plum
  advisory: 'from-[#A78BFA] via-[#7C3AED] to-[#3B0764]',
  
  // EMERGENCY - Alert but cared for. Urgent red to deep crimson
  emergency: 'from-[#DC2626] via-[#991B1B] to-[#450A0A]',
  
  // PAPERWORK - Calm, organized, handled. Neutral slate blue
  paperwork: 'from-[#64748B] via-[#475569] to-[#0F172A]',
  
  // FAREWELL - Gentle, peaceful, rainbow bridge. Soft lavender to twilight
  farewell: 'from-[#C4B5FD] via-[#8B5CF6] to-[#2E1065]',
  
  // ADOPT - Hope, new beginnings! Warm golden sunshine to honey
  adopt: 'from-[#FBBF24] via-[#F59E0B] to-[#78350F]',
  
  // SHOP/ALL/SERVICES - The full Mira spectrum
  all: 'from-[#4A1942] via-[#2D1B4E] to-[#1E3A5F]',
  shop: 'from-[#4A1942] via-[#2D1B4E] to-[#1E3A5F]',
  services: 'from-[#6366F1] via-[#4338CA] to-[#1E1B4B]',
};

// Pillar titles - Main heading with pet name
const PILLAR_TITLES = {
  recommended: 'For {name}',
  celebrate: 'Celebrations for {name}',
  dine: 'Food & Treats for {name}',
  care: 'Everyday Care for {name}',
  enjoy: 'Joyful Experiences for {name}',
  travel: 'Travel with {name}',
  stay: 'Places {name} Feels at Home',
  fit: 'Movement & Energy for {name}',
  learn: 'Learning with {name}',
  advisory: 'Guidance for {name}',
  emergency: 'If Something Feels Urgent',
  paperwork: 'Paperwork for {name}',
  farewell: 'Honouring {name}',
  adopt: 'Finding the Right Companion',
  all: 'Everything for {name}',
  shop: 'Products for {name}',
  services: 'Services for {name}',
};

// Breed-specific trait pools for variety
const BREED_TRAIT_POOLS = {
  'shih tzu': [
    ['👑 Royal charm', '🛋️ Cuddle expert', '💕 Heart-melter'],
    ['✨ Glamorous soul', '🎀 Elegant paws', '💖 Devoted friend'],
    ['🌸 Gentle spirit', '😴 Nap enthusiast', '🥰 Affectionate'],
  ],
  'golden retriever': [
    ['🎾 Ball obsessed', '💛 Heart of gold', '🏃 Boundless energy'],
    ['🌊 Water lover', '🤗 Everyone\'s friend', '☀️ Sunshine soul'],
    ['🦮 Adventure ready', '🍖 Treat motivated', '😊 Pure joy'],
  ],
  'labrador': [
    ['🎾 Fetch champion', '🍖 Food lover', '💙 Loyal to the core'],
    ['🏊 Swimming star', '🤗 Greeting expert', '⚡ Unstoppable'],
    ['🐕 Best buddy', '👃 Super sniffer', '💪 Strong & gentle'],
  ],
  'beagle': [
    ['👃 Scent detective', '🎵 Vocal soul', '🌳 Trail explorer'],
    ['🔍 Curious mind', '🍖 Treat seeker', '💕 Pack lover'],
    ['🐾 Adventure paws', '😋 Food enthusiast', '🎯 Focused hunter'],
  ],
  'pug': [
    ['😴 Snore symphony', '🛋️ Couch royalty', '😂 Comic relief'],
    ['👀 Expressive eyes', '🤗 Shadow friend', '💕 Lap champion'],
    ['🥺 Puppy eyes pro', '😋 Foodie soul', '🎭 Drama king/queen'],
  ],
  'german shepherd': [
    ['🦸 Guardian spirit', '🧠 Sharp mind', '💪 Brave heart'],
    ['👮 Protector soul', '🎓 Quick learner', '⚡ Agile athlete'],
    ['🔒 Loyal defender', '🏃 Work ethic', '💕 Family first'],
  ],
  default: [
    ['💕 Loving heart', '🐾 Loyal companion', '✨ Unique soul'],
    ['🌟 Special spirit', '💖 Pure love', '🎯 One of a kind'],
    ['😊 Joy bringer', '🤗 Cuddle buddy', '💫 Magical friend'],
  ]
};

// Get unique traits based on pet name hash for consistency
const getUniqueTraitsForPet = (pet) => {
  if (!pet?.name) return BREED_TRAIT_POOLS.default[0];
  
  // Create a simple hash from pet name + id for variety
  const hash = (pet.name + (pet.id || '')).split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  const breed = (pet.breed || '').toLowerCase();
  let traitPool = BREED_TRAIT_POOLS.default;
  
  // Find matching breed pool
  for (const [key, pool] of Object.entries(BREED_TRAIT_POOLS)) {
    if (key !== 'default' && breed.includes(key.split(' ')[0])) {
      traitPool = pool;
      break;
    }
  }
  
  // Select consistent but unique set based on hash
  const poolIndex = Math.abs(hash) % traitPool.length;
  return traitPool[poolIndex];
};

// Soul traits display - with glass effect and animation
// NOW USES SAFE TAGS API for health-first conflict handling
const SoulTraits = ({ pet, soulData }) => {
  const [isVisible, setIsVisible] = useState(false);
  const { token } = useAuth();
  
  // Fetch safe tags (health-first, suppresses conflicting preferences)
  const { safeTags, suppressedTags, isLoading, isSyncing, hasConflicts } = useSafeTags(pet?.id, token);
  
  useEffect(() => {
    // Stagger animation on mount
    const timer = setTimeout(() => setIsVisible(true), 300);
    return () => clearTimeout(timer);
  }, []);
  
  const traits = useMemo(() => {
    if (!pet) return [];
    
    const traitList = [];
    const answers = pet.doggy_soul_answers || soulData?.answers || {};
    
    // Category emoji mapping for safe tags
    const categoryEmoji = {
      fears: '😰',
      loves: '❤️',
      anxiety: '😟',
      behavior: '🐕',
      preferences: '⭐',
      health: '💊',
      other: '📝',
    };
    
    // Priority 1: Safe tags from API (learned facts with conflict filtering)
    if (safeTags && safeTags.length > 0) {
      // Add safe tags (max 2 to leave room for soul answers)
      safeTags.slice(0, 2).forEach(tag => {
        const emoji = tag.is_health ? '💊' : (categoryEmoji[tag.category] || '📝');
        traitList.push({ 
          emoji, 
          text: tag.content,
          isFromSafeTags: true,
          isHealth: tag.is_health
        });
      });
    }
    
    // Priority 2: Get personality traits from soul data (if room)
    if (traitList.length < 3 && answers.describe_3_words) {
      const words = Array.isArray(answers.describe_3_words) 
        ? answers.describe_3_words 
        : [answers.describe_3_words];
      words.slice(0, Math.max(0, 3 - traitList.length)).forEach(word => {
        traitList.push({ emoji: '✨', text: word });
      });
    }
    
    // Priority 3: Get favorite treats - BUT check for health conflicts!
    if (traitList.length < 3 && answers.favorite_treats) {
      const treats = Array.isArray(answers.favorite_treats)
        ? answers.favorite_treats[0]
        : answers.favorite_treats;
      
      // Check if this treat is suppressed due to health conflict
      const treatLower = (treats || '').toLowerCase();
      const isSuppressed = suppressedTags?.some(s => {
        const suppressedContent = (s.content || '').toLowerCase();
        return treatLower.includes(suppressedContent) || suppressedContent.includes(treatLower);
      });
      
      if (!isSuppressed) {
        traitList.push({ emoji: '🍖', text: `Loves ${treats}` });
      }
    }
    
    // Default: Use unique breed-based traits if still empty
    if (traitList.length === 0) {
      const uniqueTraits = getUniqueTraitsForPet(pet);
      uniqueTraits.forEach(trait => {
        const [emoji, ...textParts] = trait.split(' ');
        traitList.push({ emoji, text: textParts.join(' ') });
      });
    }
    
    return traitList.slice(0, 3);
  }, [pet, soulData, safeTags, suppressedTags]);
  
  if (traits.length === 0 && !isLoading && !isSyncing) return null;
  
  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {/* Syncing indicator */}
      {isSyncing && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-400 text-xs">
          <RefreshCw size={12} className="animate-spin" />
          <span>syncing</span>
        </div>
      )}
      
      {/* Loading skeleton */}
      {isLoading && traits.length === 0 && (
        <>
          {[1, 2, 3].map(i => (
            <div key={i} className="h-8 w-24 bg-white/10 rounded-full animate-pulse" />
          ))}
        </>
      )}
      
      {traits.map((trait, idx) => (
        <div
          key={idx}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 
            ${trait.isHealth 
              ? 'bg-green-500/10 border-green-500/30' 
              : 'bg-white/5 border-white/10'
            }
            backdrop-blur-md border
            rounded-full text-xs sm:text-sm
            shadow-lg shadow-black/5
            transition-all duration-500 ease-out
            hover:bg-white/15 hover:scale-105
            ${isVisible 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-2'
            }
            ${trait.isHealth ? 'text-green-400' : 'text-white/80'}
          `}
          style={{ 
            transitionDelay: `${idx * 100}ms`,
            animation: isVisible ? `float-gentle 3s ease-in-out ${idx * 0.5}s infinite` : 'none'
          }}
        >
          {trait.isHealth && <Shield size={12} />}
          <span>{trait.emoji}</span>
          <span>{trait.text}</span>
        </div>
      ))}
      
      {/* Suppressed tags indicator */}
      {hasConflicts && suppressedTags && suppressedTags.length > 0 && (
        <div
          className={`
            flex items-center gap-1.5 px-3 py-1.5 
            bg-white/5 border border-white/10
            rounded-full text-white/40 text-xs
            cursor-help
            transition-all duration-500 ease-out
            ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
          `}
          style={{ transitionDelay: '300ms' }}
          title={`${suppressedTags.length} preference(s) hidden due to health restrictions:\n${suppressedTags.map(t => `• ${t.content}`).join('\n')}`}
        >
          <AlertTriangle size={12} className="text-amber-400" />
          <span>{suppressedTags.length} hidden</span>
        </div>
      )}
      
      {/* CSS for gentle floating animation */}
      <style>{`
        @keyframes float-gentle {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-3px); }
        }
      `}</style>
    </div>
  );
};

const UnifiedHero = ({
  pet,
  soulData,
  pillar = 'recommended',
  viewMode = 'products', // 'products' | 'services'
  searchQuery = '',
  onSearchChange,
  onSearchSubmit,
  shoppingForOther = false,
  otherBreedName = null,
  hideSearchBar = false, // MIRA OS DOCTRINE: Mira already knows - no need to ask
}) => {
  const petName = pet?.name || 'Your Pet';
  const petBreed = pet?.breed || '';
  // Check multiple possible field names for pet photo
  const petPhoto = pet?.photo_url || pet?.profile_image || pet?.image_url || pet?.image || pet?.photo || 
    (pet?.name ? '' : null);
  
  // Voice search state
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const recognitionRef = useRef(null);
  
  // Check for voice support and setup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        setVoiceSupported(true);
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';
        
        recognitionRef.current.onresult = (event) => {
          const transcript = Array.from(event.results)
            .map(result => result[0].transcript)
            .join('');
          onSearchChange?.(transcript);
        };
        
        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
        
        recognitionRef.current.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
        };
      }
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [onSearchChange]);
  
  // Toggle voice listening
  const toggleVoice = () => {
    if (!voiceSupported || !recognitionRef.current) return;
    
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error('Failed to start voice recognition:', err);
      }
    }
  };
  
  // Get pillar-specific content
  const gradient = PILLAR_GRADIENTS[pillar] || PILLAR_GRADIENTS.recommended;
  const title = (PILLAR_TITLES[pillar] || PILLAR_TITLES.all).replace('{name}', petName);
  const pillarMessage = getPillarMessage(pillar, petName, petBreed);
  const pillarTagline = getPillarTagline(pillar, petName);
  
  // Soul score
  const soulScore = soulData?.overall_score || pet?.soul_score || pet?.overall_score || 0;
  
  // Determine page type for display
  const pageType = viewMode === 'products' ? 'Products' : 'Services';
  
  return (
    <section 
      className={`relative bg-gradient-to-br ${gradient} overflow-hidden`}
      data-testid="unified-hero"
    >
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient orbs */}
        <div className="absolute top-10 right-10 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-48 h-48 bg-pink-500/20 rounded-full blur-3xl" />
        
        {/* Floating paw prints */}
        {[...Array(4)].map((_, i) => (
          <PawPrint
            key={i}
            className="absolute text-white/5"
            style={{
              left: `${20 + i * 20}%`,
              top: `${30 + (i % 2) * 40}%`,
              width: `${40 + i * 10}px`,
              height: `${40 + i * 10}px`,
              transform: `rotate(${i * 15}deg)`
            }}
          />
        ))}
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 lg:py-10 relative z-10">
        {/* Shopping for other dog notice */}
        {shoppingForOther && (
          <div className="mb-4 inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 backdrop-blur rounded-full text-amber-200 text-sm">
            <PawPrint className="w-4 h-4" />
            <span>Shopping for {otherBreedName || 'another dog'} - not {petName}</span>
          </div>
        )}
        
        <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-10">
          {/* Pet Avatar with Soul Score */}
          {pet && !shoppingForOther && (
            <div className="relative flex-shrink-0">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-full blur-xl scale-125" />
              
              {/* Soul Score Arc */}
              <div className="relative cursor-pointer" onClick={() => pet?.id && window.location.assign(`/pet-soul/${pet.id}`)}>
                <SoulScoreArc 
                  score={soulScore} 
                  size={140} 
                  strokeWidth={6}
                  petId={pet?.id}
                  petName={petName}
                  showLabel={false}
                  showCTA={false}
                >
                  {/* Pet Photo */}
                  <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white/20 shadow-2xl">
                    {petPhoto ? (
                      <img 
                        src={petPhoto} 
                        alt={petName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.style.display='none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                        <PawPrint className="w-12 h-12 text-amber-400" />
                      </div>
                    )}
                  </div>
                </SoulScoreArc>
              </div>
              
              {/* Pet name badge (mobile) */}
              <div className="lg:hidden absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-white rounded-full shadow-lg">
                <span className="text-sm font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {petName}
                </span>
              </div>
            </div>
          )}
          
          {/* Content */}
          <div className="flex-1 text-center lg:text-left">
            {/* Soul badge - Glass container with contextual messaging */}
            {pet && !shoppingForOther && (
              <a 
                href={`/pet-soul/${pet.id}`}
                className="inline-flex items-center gap-2 px-4 py-2 
                  bg-white/5 backdrop-blur-lg border border-white/10
                  rounded-full text-white/80 text-xs sm:text-sm mb-3
                  shadow-lg shadow-black/5
                  hover:bg-white/10 hover:border-white/20 hover:scale-105
                  transition-all duration-300 cursor-pointer group"
              >
                <Crown className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform" />
                {soulScore >= 100 ? (
                  <span>{petName}'s soul shines bright ✨</span>
                ) : soulScore > 50 ? (
                  <span>{petName}'s soul is {soulScore}% discovered — keep going!</span>
                ) : soulScore > 0 ? (
                  <span>Continue {petName}'s soul journey ({soulScore}%)</span>
                ) : (
                  <span>Start {petName}'s soul journey</span>
                )}
              </a>
            )}
            
            {/* Main Title - Pillar specific */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white leading-tight mb-2">
              <span className="bg-gradient-to-r from-amber-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                {title}
              </span>
            </h1>
            
            {/* Pillar-specific tagline */}
            <p className="text-sm sm:text-base lg:text-lg text-white/70 mb-3 sm:mb-4 max-w-xl">
              {pillarTagline}
            </p>
            
            {/* Soul Traits */}
            {pet && !shoppingForOther && <SoulTraits pet={pet} soulData={soulData} />}
            
            {/* Mira's Love Note - Pillar specific message */}
            {pet && !shoppingForOther && (
              <div className="mt-4">
                <div className="inline-flex items-start gap-3 max-w-md">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center shadow-lg">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div className="relative">
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl rounded-tl-sm px-4 py-3 border border-white/20">
                      <p className="text-sm md:text-base text-white/90 font-medium leading-relaxed">
                        &ldquo;{pillarMessage}&rdquo;
                      </p>
                      <p className="text-xs text-white/50 mt-1.5 flex items-center gap-1">
                        <Heart className="w-3 h-3 fill-pink-400 text-pink-400" />
                        Mira knows {petName}
                      </p>
                    </div>
                    <Sparkles className="absolute -top-2 -right-2 w-5 h-5 text-amber-400 animate-pulse" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Search Bar - HIDDEN when hideSearchBar=true (Mira already knows) */}
        {!hideSearchBar && (
          <div className="mt-6 max-w-2xl mx-auto lg:mx-0 px-2">
            <div className="relative flex items-center bg-white rounded-2xl shadow-xl">
              <div className="flex-shrink-0 pl-4">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    onSearchSubmit?.(searchQuery.trim());
                  }
                }}
                placeholder={`What does ${shoppingForOther ? (otherBreedName || 'this pup') : petName} need?`}
                className="flex-1 min-w-0 px-3 py-3.5 text-base bg-transparent focus:outline-none text-gray-900 placeholder-gray-400"
                data-testid="hero-search-input"
              />
              <div className="flex items-center gap-1.5 pr-2 flex-shrink-0">
                {voiceSupported && (
                  <button 
                    onClick={toggleVoice}
                    className={`w-9 h-9 rounded-xl text-white transition-all flex items-center justify-center ${
                      isListening 
                        ? 'bg-red-500 animate-pulse' 
                        : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90'
                    }`}
                    data-testid="voice-search-btn"
                    aria-label={isListening ? 'Stop listening' : 'Start voice search'}
                  >
                    <Mic className={`w-4 h-4 ${isListening ? 'animate-pulse' : ''}`} />
                  </button>
                )}
                {/* Send/Search Button - Always visible */}
                <button 
                  onClick={() => searchQuery.trim() && onSearchSubmit?.(searchQuery.trim())}
                  className={`w-9 h-9 rounded-xl text-white transition-all flex items-center justify-center ${
                    searchQuery.trim()
                      ? 'bg-gradient-to-r from-pink-500 to-purple-500 hover:opacity-90 active:scale-95'
                      : 'bg-pink-400 hover:bg-pink-500'
                  }`}
                  data-testid="search-submit-btn"
                  aria-label="Search"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
            {isListening && (
              <p className="text-center text-white/70 text-sm mt-2 animate-pulse">
                Listening... speak now
              </p>
            )}
          </div>
        )}
      </div>
      
      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-gray-50 to-transparent" />
    </section>
  );
};

export default UnifiedHero;

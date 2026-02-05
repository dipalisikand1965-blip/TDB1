/**
 * PetOSWrapper - The Operating System Frame
 * 
 * This component owns the Pet OS chrome layer:
 * - Non-member hero + Mira explanation + CTAs
 * - Member header ("Mira knows [PetName]")
 * - "Handled by Mira" badge component
 * - Mira contextual strip container
 * 
 * It does NOT own:
 * - Support filter definitions (page-specific)
 * - Pillar-specific copy/tone
 * - Service/product orchestration logic
 * 
 * Wrapper = operating system frame
 * Page = lived experience
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, PawPrint, ChevronRight, ChevronDown, Check, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../utils/api';

// ============================================
// PILLAR CONFIGURATION
// ============================================
const PILLAR_CONFIG = {
  celebrate: { 
    name: 'Celebrate', 
    emoji: '🎂', 
    color: '#EC4899',
    miraGreeting: 'celebrations and special moments'
  },
  dine: { 
    name: 'Dine', 
    emoji: '🍽️', 
    color: '#F59E0B',
    miraGreeting: 'nutrition and fresh meals'
  },
  stay: { 
    name: 'Stay', 
    emoji: '🏠', 
    color: '#10B981',
    miraGreeting: 'boarding and home comfort'
  },
  travel: { 
    name: 'Travel', 
    emoji: '✈️', 
    color: '#3B82F6',
    miraGreeting: 'adventures and safe journeys'
  },
  care: { 
    name: 'Care', 
    emoji: '💊', 
    color: '#14B8A6',
    miraGreeting: 'health and wellness'
  },
  enjoy: { 
    name: 'Enjoy', 
    emoji: '🎾', 
    color: '#8B5CF6',
    miraGreeting: 'play and enrichment'
  },
  fit: { 
    name: 'Fit', 
    emoji: '🏃', 
    color: '#EF4444',
    miraGreeting: 'fitness and activity'
  },
  learn: { 
    name: 'Learn', 
    emoji: '📚', 
    color: '#6366F1',
    miraGreeting: 'training and development'
  },
  emergency: { 
    name: 'Emergency', 
    emoji: '🚨', 
    color: '#DC2626',
    miraGreeting: 'urgent care and support'
  },
  farewell: { 
    name: 'Farewell', 
    emoji: '🌈', 
    color: '#9CA3AF',
    miraGreeting: 'gentle transitions'
  },
  adopt: { 
    name: 'Adopt', 
    emoji: '🐕', 
    color: '#F472B6',
    miraGreeting: 'finding your companion'
  },
  advisory: { 
    name: 'Advisory', 
    emoji: '💬', 
    color: '#0EA5E9',
    miraGreeting: 'expert guidance'
  },
  paperwork: { 
    name: 'Paperwork', 
    emoji: '📋', 
    color: '#64748B',
    miraGreeting: 'documentation and records'
  },
  shop: { 
    name: 'Shop', 
    emoji: '🛍️', 
    color: '#9333EA',
    miraGreeting: 'curated essentials'
  },
};

// ============================================
// LIFE STAGES (for identity pills)
// ============================================
const LIFE_STAGES = {
  puppy: { label: 'Puppy', icon: '🐶' },
  adult: { label: 'Adult', icon: '🐕' },
  senior: { label: 'Senior', icon: '🦮' },
};

const SIZE_CATEGORIES = {
  small: { label: 'Small', weight: '<10kg' },
  medium: { label: 'Medium', weight: '10-25kg' },
  large: { label: 'Large', weight: '25kg+' },
};

// Helper functions
const getLifeStageFromAge = (age) => {
  if (age <= 1) return 'puppy';
  if (age >= 7) return 'senior';
  return 'adult';
};

const getSizeFromWeight = (weight) => {
  if (weight < 10) return 'small';
  if (weight <= 25) return 'medium';
  return 'large';
};

// ============================================
// HANDLED BY MIRA BADGE
// ============================================
export const HandledByMiraBadge = ({ 
  service, 
  petName,
  variant = 'default', // default, subtle, prominent
  onClick 
}) => {
  const variants = {
    default: 'bg-purple-50 text-purple-600 border-purple-100',
    subtle: 'bg-stone-50 text-stone-500 border-stone-100',
    prominent: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-transparent',
  };
  
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all hover:opacity-80 ${variants[variant]}`}
      data-testid="handled-by-mira-badge"
    >
      <Sparkles className="w-3 h-3" />
      <span>Handled by Mira{petName ? ` for ${petName}` : ''}</span>
    </button>
  );
};

// ============================================
// MIRA CONTEXTUAL STRIP
// ============================================
export const MiraContextStrip = ({ 
  children, 
  pillar,
  petName,
  show = true 
}) => {
  if (!show || !children) return null;
  
  const config = PILLAR_CONFIG[pillar] || PILLAR_CONFIG.celebrate;
  
  return (
    <div 
      className="mb-6 p-5 bg-gradient-to-r from-purple-50/50 to-transparent rounded-2xl border border-purple-100/20" 
      data-testid="mira-context-strip"
    >
      <div className="flex items-start gap-4">
        <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center flex-shrink-0 border border-purple-100/50">
          <Sparkles className="w-4 h-4 text-purple-400" />
        </div>
        <div className="flex-1">
          <p className="text-xs text-purple-500 mb-1.5">Mira&apos;s note</p>
          <div className="text-sm text-stone-500 leading-relaxed">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// NON-MEMBER HERO
// ============================================
const NonMemberHero = ({ pillar }) => {
  const config = PILLAR_CONFIG[pillar] || PILLAR_CONFIG.celebrate;
  
  return (
    <div className="bg-gradient-to-b from-purple-50 to-white border-b border-stone-100" data-testid="pet-os-non-member">
      <div className="max-w-6xl mx-auto px-4 py-14 text-center">
        <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-5">
          <Sparkles className="w-8 h-8 text-purple-500" />
        </div>
        <h1 className="text-2xl font-semibold text-stone-900 mb-3">Personalised for Your Pet</h1>
        
        {/* Micro-line */}
        <p className="text-xs text-stone-400/80 mb-6">No spam. No upselling. Just thoughtful care.</p>
        
        {/* Visual separator */}
        <div className="w-12 h-px bg-stone-200 mx-auto mb-6"></div>
        
        {/* Supporting line */}
        <div className="text-stone-600 max-w-md mx-auto mb-8 space-y-2">
          <p className="font-medium text-stone-700">Mira works best once she understands your pet.</p>
          <p className="text-sm text-stone-500 leading-relaxed">
            This space is personalised using your pet&apos;s age, sensitivities, routines, and care history — so only what&apos;s appropriate is shown.
          </p>
        </div>
        
        {/* CTAs */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 items-center">
          <div className="flex flex-col items-center">
            <Link 
              to="/membership" 
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-sm"
              data-testid="setup-pet-btn"
            >
              <PawPrint className="w-4 h-4" />
              Set up your pet with Mira
            </Link>
            <span className="text-[11px] text-stone-400 mt-2">Takes about 2 minutes. You can change this anytime.</span>
          </div>
          <Link 
            to="/login" 
            className="inline-flex items-center gap-2 px-6 py-3 text-stone-500 text-sm font-medium hover:text-stone-700 transition-all"
            data-testid="continue-profile-btn"
          >
            Continue with your pet profile
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        
        {/* Privacy reassurance */}
        <p className="text-[11px] text-stone-300 mt-5">Your pet&apos;s information is used only to improve care. Never shared.</p>
        
        {/* Benefits card */}
        <div className="mt-10 p-6 bg-white rounded-xl border border-stone-100 max-w-lg mx-auto text-left shadow-sm">
          <p className="text-sm font-medium text-stone-700 mb-4">Once Mira knows your pet, you&apos;ll notice:</p>
          <ul className="space-y-3 text-sm text-stone-600">
            <li className="flex items-start gap-2.5">
              <Check className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
              Only options that suit your pet&apos;s sensitivities
            </li>
            <li className="flex items-start gap-2.5">
              <Check className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
              Suggestions matched to your pet&apos;s life stage
            </li>
            <li className="flex items-start gap-2.5">
              <Check className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
              Mira remembers what&apos;s worked — and what hasn&apos;t
            </li>
            <li className="flex items-start gap-2.5">
              <Check className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
              Quiet access to human help, when you need it
            </li>
          </ul>
        </div>
        
        {/* Grounding line */}
        <p className="text-sm text-stone-400 mt-6">
          You can explore freely — Mira simply helps make things easier.
        </p>
      </div>
    </div>
  );
};

// ============================================
// MEMBER HEADER
// ============================================
const MemberHeader = ({ 
  activePet, 
  userPets, 
  onPetChange,
  pillar,
  title,
  miraContext 
}) => {
  const [showPetSelector, setShowPetSelector] = useState(false);
  const config = PILLAR_CONFIG[pillar] || PILLAR_CONFIG.celebrate;
  
  // Calculate identity
  const ageYears = activePet?.age_years || activePet?.age || 3;
  const weightKg = activePet?.weight || 15;
  const lifeStage = getLifeStageFromAge(ageYears);
  const size = getSizeFromWeight(weightKg);
  
  return (
    <div className="bg-white border-b border-stone-100" data-testid="pet-os-member-header">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-start gap-5">
          {/* Pet Avatar */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center overflow-hidden flex-shrink-0 border border-purple-100/50">
            {activePet?.photo_url ? (
              <img src={activePet.photo_url} alt={activePet.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl">{activePet?.name?.charAt(0) || '🐕'}</span>
            )}
          </div>
          
          {/* Mira's Understanding */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-xs text-purple-500">Mira knows {activePet?.name}</span>
            </div>
            <h1 className="text-xl font-semibold text-stone-800 mb-3">
              {title || `${config.name} for ${activePet?.name}`}
            </h1>
            
            {/* Identity Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-purple-700 bg-purple-50 border border-purple-100">
                {LIFE_STAGES[lifeStage]?.icon} {LIFE_STAGES[lifeStage]?.label}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-stone-600 bg-stone-50 border border-stone-100">
                {SIZE_CATEGORIES[size]?.label} breed
              </span>
              {activePet?.breed && (
                <span className="text-xs text-stone-400">{activePet.breed}</span>
              )}
            </div>
            
            {/* Mira Context */}
            {miraContext && (
              <p className="text-xs text-stone-400 mt-4 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                {miraContext}
              </p>
            )}
          </div>
          
          {/* Switch Pet */}
          {userPets && userPets.length > 1 && (
            <div className="relative">
              <button
                onClick={() => setShowPetSelector(!showPetSelector)}
                className="text-xs text-stone-400 hover:text-stone-600 flex items-center gap-1 transition-colors"
              >
                Switch <ChevronDown className="w-3 h-3" />
              </button>
              {showPetSelector && (
                <div className="absolute right-0 top-6 bg-white rounded-xl shadow-lg border border-stone-100 py-2 min-w-[150px] z-20">
                  {userPets.map(pet => (
                    <button
                      key={pet.id || pet._id}
                      onClick={() => { 
                        onPetChange?.(pet); 
                        setShowPetSelector(false); 
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-stone-50 flex items-center gap-2 text-stone-600"
                    >
                      <span className="text-base">{pet.name?.charAt(0) || '🐕'}</span>
                      {pet.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAIN WRAPPER COMPONENT
// ============================================
const PetOSWrapper = ({ 
  children, 
  pillar = 'celebrate',
  title,
  miraContext,
  showNonMemberHero = true,
  showMemberHeader = true,
}) => {
  const { user, token } = useAuth();
  const [userPets, setUserPets] = useState([]);
  const [activePet, setActivePet] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Fetch user's pets
  useEffect(() => {
    const fetchPets = async () => {
      if (!user || !token) {
        setLoading(false);
        return;
      }
      
      try {
        const response = await fetch(`${API_URL}/api/pets`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          const pets = data.pets || data || [];
          setUserPets(pets);
          if (pets.length > 0) {
            setActivePet(pets[0]);
          }
        }
      } catch (error) {
        console.error('[PetOSWrapper] Error fetching pets:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPets();
  }, [user, token]);
  
  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full bg-purple-100 animate-pulse flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-purple-400" />
        </div>
      </div>
    );
  }
  
  // Non-member view
  if (!user && showNonMemberHero) {
    return <NonMemberHero pillar={pillar} />;
  }
  
  // Member view
  return (
    <div className="min-h-screen bg-stone-50" data-testid="pet-os-wrapper">
      {/* Member Header */}
      {showMemberHeader && activePet && (
        <MemberHeader
          activePet={activePet}
          userPets={userPets}
          onPetChange={setActivePet}
          pillar={pillar}
          title={title}
          miraContext={miraContext}
        />
      )}
      
      {/* Page Content - receives activePet via render prop or context */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {typeof children === 'function' 
          ? children({ activePet, userPets, pillar })
          : children
        }
      </div>
    </div>
  );
};

// Export everything
export default PetOSWrapper;
export { PILLAR_CONFIG, LIFE_STAGES, SIZE_CATEGORIES };

/**
 * PersonalizedHero.jsx
 * A magical, emotionally-connected hero with REAL PET PHOTO
 * Mobile-first, compact, products visible immediately
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, Heart, Star, Crown, ChevronRight, Search, Mic,
  PawPrint, Zap, Sun, Moon, Coffee
} from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '../context/AuthContext';

// Time-based greetings
const getGreeting = (petName) => {
  const hour = new Date().getHours();
  if (hour < 12) return { text: `Good morning`, emoji: '☀️', mood: 'morning' };
  if (hour < 17) return { text: `Good afternoon`, emoji: '🌤️', mood: 'afternoon' };
  if (hour < 21) return { text: `Good evening`, emoji: '🌅', mood: 'evening' };
  return { text: `Sleepy time?`, emoji: '🌙', mood: 'night' };
};

// Soul energy colors based on breed/personality
const getSoulEnergy = (pet) => {
  if (!pet) return { gradient: 'from-purple-400 to-pink-400', glow: 'rgba(168, 85, 247, 0.4)' };
  
  const breed = (pet.breed || '').toLowerCase();
  
  if (breed.includes('retriever') || breed.includes('lab')) {
    return { gradient: 'from-amber-400 to-orange-500', glow: 'rgba(251, 146, 60, 0.5)', energy: 'energetic' };
  }
  if (breed.includes('shih') || breed.includes('maltese') || breed.includes('poodle')) {
    return { gradient: 'from-pink-400 to-rose-500', glow: 'rgba(244, 114, 182, 0.5)', energy: 'royal' };
  }
  if (breed.includes('pug') || breed.includes('bulldog')) {
    return { gradient: 'from-amber-300 to-yellow-400', glow: 'rgba(251, 191, 36, 0.5)', energy: 'chill' };
  }
  if (breed.includes('german') || breed.includes('husky')) {
    return { gradient: 'from-blue-400 to-cyan-500', glow: 'rgba(34, 211, 238, 0.5)', energy: 'wise' };
  }
  if (breed.includes('beagle') || breed.includes('terrier')) {
    return { gradient: 'from-green-400 to-emerald-500', glow: 'rgba(52, 211, 153, 0.5)', energy: 'playful' };
  }
  
  return { gradient: 'from-purple-400 to-pink-500', glow: 'rgba(168, 85, 247, 0.5)', energy: 'loving' };
};

const PersonalizedHero = ({ 
  pet,
  pageType = 'shop',
  searchQuery = '',
  onSearchChange,
  onVoiceClick
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const greeting = useMemo(() => pet ? getGreeting(pet.name) : null, [pet]);
  const soulEnergy = useMemo(() => getSoulEnergy(pet), [pet]);
  const soulScore = pet?.soul_score || 0;
  
  // Real pet photo URL - check all possible property names
  const petPhoto = pet?.photo_url || pet?.image_url || pet?.image || pet?.photo || pet?.avatar;
  const hasPetPhoto = !!petPhoto;
  
  // Breed display name
  const breedName = pet?.breed || 'pet';
  
  return (
    <div className="relative bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/30" data-testid="personalized-hero">
      
      {/* MOBILE LAYOUT - Compact, horizontal */}
      <div className="lg:hidden">
        <div className="px-4 py-4">
          {pet ? (
            <div className="flex items-center gap-4">
              {/* Pet Photo with Glow - REAL PHOTO */}
              <div className="relative flex-shrink-0">
                {/* Animated Glow Ring */}
                <div 
                  className="absolute inset-0 rounded-full animate-pulse"
                  style={{
                    background: `radial-gradient(circle, ${soulEnergy.glow} 0%, transparent 70%)`,
                    transform: 'scale(1.4)',
                    filter: 'blur(8px)'
                  }}
                />
                
                {/* Photo Container */}
                <div className={`relative w-16 h-16 rounded-full p-0.5 bg-gradient-to-br ${soulEnergy.gradient} shadow-lg`}>
                  <div className="w-full h-full rounded-full overflow-hidden bg-white">
                    {hasPetPhoto ? (
                      <img 
                        src={petPhoto}
                        alt={pet.name}
                        className="w-full h-full object-cover"
                        onLoad={() => setImageLoaded(true)}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `https://api.dicebear.com/7.x/lorelei/svg?seed=${pet.name}&backgroundColor=ffdfbf`;
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-100 to-orange-100">
                        <PawPrint className="w-8 h-8 text-amber-400" />
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Soul Badge */}
                <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 bg-white rounded-full shadow text-xs font-bold">
                  <span className={`bg-gradient-to-r ${soulEnergy.gradient} bg-clip-text text-transparent`}>
                    {soulScore}%
                  </span>
                </div>
              </div>
              
              {/* Text Content */}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <span>{greeting?.emoji}</span> {greeting?.text}, {pet.name}!
                </p>
                <h1 className="text-lg font-bold text-gray-900 truncate">
                  {pageType === 'shop' ? 'Shop' : 'Services'} for{' '}
                  <span className={`bg-gradient-to-r ${soulEnergy.gradient} bg-clip-text text-transparent`}>
                    {pet.name}
                  </span>
                </h1>
                <p className="text-xs text-gray-500 truncate">
                  Curated for {breedName}s like {pet.name}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-2">
              <h1 className="text-xl font-bold text-gray-900">
                {pageType === 'shop' ? 'Shop for Your Pet' : 'Premium Services'}
              </h1>
            </div>
          )}
          
          {/* Search Bar - Compact */}
          <div className="mt-3 relative">
            <div className="flex items-center bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <Search className="ml-3 w-4 h-4 text-gray-400 flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
                placeholder={pet ? `What does ${pet.name} need?` : 'Search...'}
                className="flex-1 px-3 py-2.5 text-sm bg-transparent focus:outline-none"
                data-testid="hero-search-input"
              />
              {onVoiceClick && (
                <button
                  onClick={onVoiceClick}
                  className={`p-2 m-1 rounded-lg bg-gradient-to-r ${soulEnergy.gradient} text-white`}
                  data-testid="hero-voice-btn"
                >
                  <Mic className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* DESKTOP LAYOUT - Full beautiful experience */}
      <div className="hidden lg:block">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center gap-10">
            
            {/* Pet Photo Section - LARGE with animated glow */}
            {pet ? (
              <div className="relative flex-shrink-0">
                {/* Outer Animated Glow */}
                <div 
                  className="absolute inset-0 rounded-full animate-pulse"
                  style={{
                    background: `radial-gradient(circle, ${soulEnergy.glow} 0%, transparent 60%)`,
                    transform: 'scale(1.6)',
                    filter: 'blur(20px)'
                  }}
                />
                
                {/* Sparkles around photo */}
                {[...Array(6)].map((_, i) => (
                  <Sparkles
                    key={i}
                    className="absolute text-amber-400 animate-ping"
                    style={{
                      width: '16px',
                      height: '16px',
                      left: `${50 + 45 * Math.cos(i * Math.PI / 3)}%`,
                      top: `${50 + 45 * Math.sin(i * Math.PI / 3)}%`,
                      transform: 'translate(-50%, -50%)',
                      animationDelay: `${i * 0.3}s`,
                      animationDuration: '2s'
                    }}
                  />
                ))}
                
                {/* Photo Container with gradient border */}
                <div className={`relative w-40 h-40 rounded-full p-1 bg-gradient-to-br ${soulEnergy.gradient} shadow-2xl`}>
                  <div className="w-full h-full rounded-full overflow-hidden bg-white ring-4 ring-white">
                    {hasPetPhoto ? (
                      <img 
                        src={petPhoto}
                        alt={pet.name}
                        className="w-full h-full object-cover"
                        onLoad={() => setImageLoaded(true)}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `https://api.dicebear.com/7.x/lorelei/svg?seed=${pet.name}&backgroundColor=ffdfbf`;
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50">
                        <PawPrint className="w-20 h-20 text-amber-300" />
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Soul Score Badge */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-white rounded-full shadow-lg border border-purple-100">
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-500" />
                    <span className={`text-sm font-bold bg-gradient-to-r ${soulEnergy.gradient} bg-clip-text text-transparent`}>
                      {soulScore}% Soul Complete
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                <PawPrint className="w-16 h-16 text-purple-300" />
              </div>
            )}
            
            {/* Content Section */}
            <div className="flex-1">
              {/* Greeting */}
              {pet && greeting && (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur rounded-full shadow-sm mb-3">
                  <span className="text-xl">{greeting.emoji}</span>
                  <span className="text-base font-medium text-gray-700">{greeting.text}, {pet.name}!</span>
                </div>
              )}
              
              {/* Main Title */}
              <h1 className="text-4xl xl:text-5xl font-bold text-gray-900 mb-2">
                {pet ? (
                  <>
                    {pageType === 'shop' ? 'Shop' : 'Services'} for{' '}
                    <span className={`bg-gradient-to-r ${soulEnergy.gradient} bg-clip-text text-transparent`}>
                      {pet.name}
                    </span>
                    <Sparkles className="inline-block ml-2 w-8 h-8 text-amber-400 animate-pulse" />
                  </>
                ) : (
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {pageType === 'shop' ? 'Shop for Your Pet' : 'Premium Pet Services'}
                  </span>
                )}
              </h1>
              
              {/* Breed-specific tagline */}
              <p className="text-lg text-gray-600 mb-5">
                {pet ? (
                  <>
                    <span className="font-medium">{breedName}s, like {pet.name}</span>, deserve the best.
                    {pageType === 'shop' ? ' Find products curated just for them.' : ' Discover services they\'ll love.'}
                  </>
                ) : (
                  'Discover products your pet will love'
                )}
              </p>
              
              {/* Search Bar */}
              <div className="relative max-w-xl">
                <div className="flex items-center bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                  <Search className="ml-4 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearchChange?.(e.target.value)}
                    placeholder={pet ? `What does ${pet.name} need today?` : 'Search products...'}
                    className="flex-1 px-4 py-4 text-base bg-transparent focus:outline-none"
                    data-testid="hero-search-input"
                  />
                  {onVoiceClick && (
                    <button
                      onClick={onVoiceClick}
                      className={`p-3 m-1.5 rounded-xl bg-gradient-to-r ${soulEnergy.gradient} text-white hover:opacity-90 transition-opacity`}
                      data-testid="hero-voice-btn"
                    >
                      <Mic className="w-5 h-5" />
                    </button>
                  )}
                </div>
                
                {/* Quick suggestions */}
                {pet && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="text-xs text-gray-500">Popular for {breedName}s:</span>
                    {(pageType === 'shop' 
                      ? ['Treats', 'Toys', 'Grooming']
                      : ['Grooming', 'Vet', 'Training']
                    ).map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => onSearchChange?.(suggestion)}
                        className="text-xs px-3 py-1 rounded-full bg-white text-gray-600 hover:bg-purple-50 hover:text-purple-600 border border-gray-200 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-white to-transparent" />
    </div>
  );
};

export default PersonalizedHero;

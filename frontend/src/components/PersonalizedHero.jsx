/**
 * PersonalizedHero.jsx
 * A magical, emotionally-connected hero section that puts the pet at the center
 * Shows pet's soul, personality, and creates a warm "welcome back" experience
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, Heart, Star, Crown, ChevronRight, Search, Mic,
  PawPrint, Zap, Sun, Moon, Coffee
} from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '../context/AuthContext';
import PetAuraAvatar from './PetAuraAvatar';

// Soul trait visuals
const SOUL_TRAITS = {
  'Good boy/girl': { emoji: '🌟', color: 'from-amber-400 to-yellow-500' },
  'Loved unconditionally': { emoji: '💕', color: 'from-pink-400 to-rose-500' },
  'Family member': { emoji: '🏠', color: 'from-teal-400 to-cyan-500' },
  'Best friend': { emoji: '🤝', color: 'from-purple-400 to-violet-500' },
  'Loyal companion': { emoji: '🦮', color: 'from-amber-500 to-orange-500' },
  'Cuddle buddy': { emoji: '🤗', color: 'from-pink-400 to-red-400' },
  'Adventure partner': { emoji: '🎒', color: 'from-green-400 to-emerald-500' },
  'Soul mate': { emoji: '✨', color: 'from-violet-400 to-purple-500' }
};

// Time-based greetings
const getGreeting = (petName) => {
  const hour = new Date().getHours();
  if (hour < 12) return { text: `Good morning, ${petName}!`, emoji: '☀️', mood: 'morning' };
  if (hour < 17) return { text: `Good afternoon, ${petName}!`, emoji: '🌤️', mood: 'afternoon' };
  if (hour < 21) return { text: `Good evening, ${petName}!`, emoji: '🌅', mood: 'evening' };
  return { text: `Sleepy time, ${petName}?`, emoji: '🌙', mood: 'night' };
};

// Background gradients based on mood
const MOOD_BACKGROUNDS = {
  morning: 'from-amber-50 via-orange-50 to-yellow-50',
  afternoon: 'from-sky-50 via-blue-50 to-indigo-50',
  evening: 'from-purple-50 via-pink-50 to-orange-50',
  night: 'from-indigo-100 via-purple-100 to-slate-100'
};

const PersonalizedHero = ({ 
  pet,
  pageType = 'shop', // 'shop' | 'services'
  searchQuery = '',
  onSearchChange,
  onVoiceClick
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isAnimating, setIsAnimating] = useState(true);
  const [showSoulTraits, setShowSoulTraits] = useState(false);
  
  const greeting = useMemo(() => pet ? getGreeting(pet.name) : null, [pet]);
  const bgGradient = greeting ? MOOD_BACKGROUNDS[greeting.mood] : MOOD_BACKGROUNDS.afternoon;
  
  // Soul score arc visualization
  const soulScore = pet?.soul_score || 0;
  const soulTraits = pet?.soul_traits || ['Good boy/girl', 'Loved unconditionally', 'Family member'];
  
  // Personalized tagline based on page and pet
  const getTagline = () => {
    if (!pet) {
      return pageType === 'shop' 
        ? 'Discover products your pet will love' 
        : 'Find services for your furry friend';
    }
    
    const breed = pet.breed || 'pet';
    if (pageType === 'shop') {
      return `Curated with love for ${pet.name} the ${breed}`;
    }
    return `Premium services chosen for ${breed}s like ${pet.name}`;
  };
  
  useEffect(() => {
    // Show soul traits with delay
    const timer = setTimeout(() => setShowSoulTraits(true), 800);
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div 
      className={`relative overflow-hidden bg-gradient-to-br ${bgGradient} transition-colors duration-1000`}
      data-testid="personalized-hero"
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating Paw Prints */}
        {[...Array(6)].map((_, i) => (
          <PawPrint
            key={i}
            className="absolute text-purple-200/30 animate-float"
            style={{
              left: `${10 + i * 15}%`,
              top: `${20 + (i % 3) * 30}%`,
              width: `${20 + i * 5}px`,
              height: `${20 + i * 5}px`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${4 + i}s`
            }}
          />
        ))}
        
        {/* Sparkle Effects */}
        {pet && [...Array(8)].map((_, i) => (
          <Sparkles
            key={`sparkle-${i}`}
            className="absolute text-amber-300/40 animate-twinkle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: '16px',
              height: '16px',
              animationDelay: `${i * 0.3}s`
            }}
          />
        ))}
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-10">
          
          {/* Pet Avatar Section - Left */}
          {pet ? (
            <div className="flex-shrink-0 relative">
              <PetAuraAvatar 
                pet={pet} 
                size="hero" 
                showName={false}
                showMessage={false}
                animate={isAnimating}
              />
              
              {/* Soul Score Badge */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-white rounded-full shadow-lg border border-purple-100">
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {soulScore}% Soul
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-shrink-0 w-32 h-32 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
              <PawPrint className="w-16 h-16 text-purple-300" />
            </div>
          )}
          
          {/* Content Section - Right */}
          <div className="flex-1 text-center lg:text-left">
            {/* Greeting */}
            {pet && greeting && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur rounded-full shadow-sm mb-4 animate-fade-in">
                <span className="text-xl">{greeting.emoji}</span>
                <span className="text-sm sm:text-base font-medium text-gray-700">{greeting.text}</span>
              </div>
            )}
            
            {/* Main Title */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3">
              {pet ? (
                <>
                  <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent">
                    {pageType === 'shop' ? 'Shop' : 'Services'}
                  </span>
                  {' for '}
                  <span className="relative inline-block">
                    {pet.name}
                    <Sparkles className="absolute -top-2 -right-4 w-6 h-6 text-amber-400 animate-pulse" />
                  </span>
                </>
              ) : (
                <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent">
                  {pageType === 'shop' ? 'Shop for Your Pet' : 'Premium Pet Services'}
                </span>
              )}
            </h1>
            
            {/* Tagline */}
            <p className="text-base sm:text-lg text-gray-600 mb-5 max-w-2xl">
              {getTagline()}
            </p>
            
            {/* Soul Traits Pills */}
            {pet && showSoulTraits && (
              <div className="flex flex-wrap justify-center lg:justify-start gap-2 mb-6 animate-fade-in-up">
                {soulTraits.slice(0, 3).map((trait, idx) => {
                  const traitConfig = SOUL_TRAITS[trait] || { emoji: '✨', color: 'from-purple-400 to-pink-400' };
                  return (
                    <div 
                      key={trait}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r ${traitConfig.color} text-white text-sm font-medium shadow-md`}
                      style={{ animationDelay: `${idx * 0.2}s` }}
                    >
                      <span>{traitConfig.emoji}</span>
                      <span>{trait}</span>
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* Search Bar */}
            <div className="relative max-w-xl mx-auto lg:mx-0">
              <div className="relative flex items-center bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <Search className="absolute left-4 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  placeholder={pet ? `What does ${pet.name} need today?` : 'Search products & services...'}
                  className="w-full pl-12 pr-14 py-4 text-base bg-transparent focus:outline-none"
                  data-testid="hero-search-input"
                />
                {onVoiceClick && (
                  <button
                    onClick={onVoiceClick}
                    className="absolute right-2 p-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 transition-opacity"
                    data-testid="hero-voice-btn"
                  >
                    <Mic className="w-5 h-5" />
                  </button>
                )}
              </div>
              
              {/* Quick Suggestions */}
              {pet && (
                <div className="flex flex-wrap gap-2 mt-3 justify-center lg:justify-start">
                  <span className="text-xs text-gray-500">Quick:</span>
                  {(pageType === 'shop' 
                    ? ['Birthday cakes', 'Healthy treats', 'Toys']
                    : ['Grooming', 'Vet visits', 'Training']
                  ).map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => onSearchChange?.(suggestion)}
                      className="text-xs px-2.5 py-1 rounded-full bg-white/80 text-purple-600 hover:bg-purple-50 border border-purple-100 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Bottom Wave Decoration */}
        <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-white to-transparent" />
      </div>
      
      {/* CSS Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(10deg); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-twinkle { animation: twinkle 3s ease-in-out infinite; }
        .animate-fade-in { animation: fade-in 0.6s ease-out forwards; }
        .animate-fade-in-up { animation: fade-in-up 0.6s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default PersonalizedHero;

/**
 * UnifiedHero.jsx
 * A beautiful, personalized hero that makes Meister the HERO of every page
 * Pillar-specific messaging, seamless journey, world's best concierge feel
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Sparkles, Heart, Crown, PawPrint, Mic, MicOff, Loader2 } from 'lucide-react';
import SoulScoreArc from './SoulScoreArc';
import MiraLoveNote from './MiraLoveNote';
import { getPillarMessage, getPillarTagline } from '../context/PillarContext';

// Pillar-specific gradients
const PILLAR_GRADIENTS = {
  recommended: 'from-[#2D1B4E] via-[#1E3A5F] to-[#0D2137]',
  celebrate: 'from-[#4A1942] via-[#2D1B4E] to-[#1E3A5F]',
  dine: 'from-[#3D2B1F] via-[#2D1B4E] to-[#1E3A5F]',
  care: 'from-[#3D1F3D] via-[#2D1B4E] to-[#1E3A5F]',
  enjoy: 'from-[#2D1B4E] via-[#3D1F5F] to-[#1E3A5F]',
  travel: 'from-[#1E3A5F] via-[#2D1B4E] to-[#0D2137]',
  stay: 'from-[#1F3D3D] via-[#1E3A5F] to-[#0D2137]',
  fit: 'from-[#3D1F1F] via-[#2D1B4E] to-[#1E3A5F]',
  learn: 'from-[#1F3D2D] via-[#1E3A5F] to-[#0D2137]',
  advisory: 'from-[#1F2D3D] via-[#1E3A5F] to-[#0D2137]',
  emergency: 'from-[#3D1F1F] via-[#4A1F1F] to-[#2D1B4E]',
  paperwork: 'from-[#2D2D3D] via-[#1E3A5F] to-[#0D2137]',
  farewell: 'from-[#2D1B4E] via-[#3D2D4E] to-[#1E3A5F]',
  adopt: 'from-[#3D3D1F] via-[#2D1B4E] to-[#1E3A5F]',
  all: 'from-[#2D1B4E] via-[#1E3A5F] to-[#0D2137]',
  shop: 'from-[#2D1B4E] via-[#1E3A5F] to-[#0D2137]',
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

// Soul traits display
const SoulTraits = ({ pet, soulData }) => {
  const traits = useMemo(() => {
    if (!pet) return [];
    
    const traitList = [];
    const answers = pet.doggy_soul_answers || soulData?.answers || {};
    
    // Get personality traits
    if (answers.describe_3_words) {
      const words = Array.isArray(answers.describe_3_words) 
        ? answers.describe_3_words 
        : [answers.describe_3_words];
      traitList.push({ emoji: '✨', text: words.slice(0, 3).join(', ') });
    }
    
    // Get favorite treats
    if (answers.favorite_treats) {
      const treats = Array.isArray(answers.favorite_treats)
        ? answers.favorite_treats.slice(0, 2).join(', ')
        : answers.favorite_treats;
      traitList.push({ emoji: '🍖', text: `Loves ${treats}` });
    }
    
    // Get active time
    if (answers.energetic_time) {
      traitList.push({ emoji: '⚡', text: `Active: ${answers.energetic_time}` });
    }
    
    // Default traits based on breed if no soul data
    if (traitList.length === 0 && pet.breed) {
      const breed = pet.breed.toLowerCase();
      if (breed.includes('shih')) {
        traitList.push(
          { emoji: '👑', text: 'Royal companion' },
          { emoji: '🛋️', text: 'Lap dog' },
          { emoji: '💕', text: 'Affectionate' }
        );
      } else if (breed.includes('retriever')) {
        traitList.push(
          { emoji: '🎾', text: 'Playful' },
          { emoji: '💛', text: 'Friendly' },
          { emoji: '🏃', text: 'Energetic' }
        );
      } else {
        traitList.push(
          { emoji: '💕', text: 'Loving companion' },
          { emoji: '🐾', text: 'Loyal friend' }
        );
      }
    }
    
    return traitList.slice(0, 3);
  }, [pet, soulData]);
  
  if (traits.length === 0) return null;
  
  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {traits.map((trait, idx) => (
        <div
          key={idx}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-white/90 text-xs sm:text-sm"
        >
          <span>{trait.emoji}</span>
          <span className="truncate max-w-[120px] sm:max-w-none">{trait.text}</span>
        </div>
      ))}
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
  shoppingForOther = false,
  otherBreedName = null,
}) => {
  const petName = pet?.name || 'Your Pet';
  const petBreed = pet?.breed || '';
  const petPhoto = pet?.photo_url || pet?.image_url || pet?.image || pet?.photo;
  
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
              <div className="relative">
                <SoulScoreArc score={soulScore} size={140} strokeWidth={6}>
                  {/* Pet Photo */}
                  <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white/20 shadow-2xl">
                    {petPhoto ? (
                      <img 
                        src={petPhoto} 
                        alt={petName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `https://api.dicebear.com/7.x/lorelei/svg?seed=${petName}&backgroundColor=ffdfbf`;
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
            {/* Soul badge */}
            {pet && !shoppingForOther && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur rounded-full text-white/90 text-xs sm:text-sm mb-3">
                <Crown className="w-4 h-4 text-amber-400" />
                <span>Pet Soul™ {soulScore}% Complete</span>
              </div>
            )}
            
            {/* Main Title - Pillar specific */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white leading-tight mb-2">
              {pageType} {pillar !== 'recommended' && pillar !== 'all' && 'for'}{' '}
              <span className="bg-gradient-to-r from-amber-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                {pillar === 'recommended' || pillar === 'all' ? petName : title.split(' ').slice(-1)[0]}
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
        
        {/* Search Bar */}
        <div className="mt-6 max-w-2xl mx-auto lg:mx-0">
          <div className="relative flex items-center bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="flex-shrink-0 pl-4">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder={`What does ${shoppingForOther ? (otherBreedName || 'this pup') : petName} need?`}
              className="flex-1 px-4 py-4 text-base bg-transparent focus:outline-none text-gray-900 placeholder-gray-400"
              data-testid="hero-search-input"
            />
            <button className="flex-shrink-0 p-2 m-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white hover:opacity-90 transition-opacity">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-gray-50 to-transparent" />
    </section>
  );
};

export default UnifiedHero;

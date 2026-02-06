/**
 * MiraLoveNote.jsx
 * A beautiful, emotional message from Mira about the pet
 * Makes pet parents go "wow, they really know my baby!"
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Sparkles, Heart, Quote } from 'lucide-react';

// Emotional, personalized messages based on pet data
const generateLoveNote = (pet) => {
  if (!pet) return null;
  
  const name = pet.name || 'your furry friend';
  const breed = (pet.breed || '').toLowerCase();
  const answers = pet.doggy_soul_answers || pet.soul_answers || {};
  
  // Check for specific soul data
  const nature = answers.describe_3_words || answers.general_nature || '';
  const treats = answers.favorite_treats || '';
  const activeTime = answers.energetic_time || '';
  const walks = answers.walks_per_day || '';
  
  // Build personalized messages based on what we know
  const messages = [];
  
  // Breed-specific emotional messages
  if (breed.includes('shih')) {
    messages.push(
      `${name}'s little paws leave the biggest prints on your heart 🐾`,
      `That royal Shih Tzu attitude? ${name} was born to be adored`,
      `${name}'s silky coat deserves nothing but the finest care`,
      `Every moment with ${name} is a royal affair 👑`
    );
  } else if (breed.includes('retriever') || breed.includes('golden')) {
    messages.push(
      `${name}'s golden heart shines brighter than their coat ✨`,
      `That wagging tail? ${name} spreads pure joy everywhere`,
      `${name} lives life with boundless enthusiasm - and we love that`,
      `Every tennis ball is an adventure when you're ${name} 🎾`
    );
  } else if (breed.includes('lab')) {
    messages.push(
      `${name}'s love is as endless as their appetite for treats 💕`,
      `That Lab loyalty? ${name} is your forever friend`,
      `${name} makes every day a celebration`,
      `Swimming, playing, loving - ${name} does it all with heart`
    );
  } else if (breed.includes('pug')) {
    messages.push(
      `${name}'s snorts and wiggles make every day better 🥰`,
      `That Pug personality? ${name} is pure entertainment`,
      `${name}'s smooshy face holds so much love`,
      `Compact size, enormous heart - that's ${name}`
    );
  } else if (breed.includes('beagle')) {
    messages.push(
      `${name}'s nose leads to adventure, but their heart leads home 🏠`,
      `That Beagle howl? Music to your ears`,
      `${name} finds joy in every sniff and discovery`,
      `Curious, loving, loyal - ${name} is the whole package`
    );
  } else if (breed.includes('german') || breed.includes('shepherd')) {
    messages.push(
      `${name}'s intelligence is matched only by their devotion 🌟`,
      `Loyal protector, loving companion - ${name} is both`,
      `${name} doesn't just follow commands, they follow their heart`,
      `That noble spirit? ${name} was born to be your guardian`
    );
  } else if (breed.includes('poodle')) {
    messages.push(
      `${name}'s elegance is only surpassed by their smarts ✨`,
      `That curly coat holds a heart of gold`,
      `${name} isn't just beautiful - they're brilliant`,
      `Grace, intelligence, love - ${name} has it all`
    );
  } else {
    // Generic but still emotional
    messages.push(
      `${name} makes every day a little brighter 🌟`,
      `That look in ${name}'s eyes? Pure, unconditional love`,
      `${name} doesn't need words to tell you how much they care`,
      `Every tail wag from ${name} is a love letter to you 💕`
    );
  }
  
  // Add messages based on soul data
  if (nature) {
    if (nature.toLowerCase().includes('loving') || nature.toLowerCase().includes('human')) {
      messages.push(`${name}'s heart is as big as their personality 💕`);
    }
    if (nature.toLowerCase().includes('playful') || nature.toLowerCase().includes('active')) {
      messages.push(`${name}'s zest for life is absolutely contagious ⚡`);
    }
    if (nature.toLowerCase().includes('calm') || nature.toLowerCase().includes('gentle')) {
      messages.push(`${name}'s calm presence is your daily dose of peace 🧘`);
    }
  }
  
  if (treats) {
    const treatStr = Array.isArray(treats) ? treats.join(', ') : treats;
    messages.push(`We know ${name} would do anything for ${treatStr} 🦴`);
  }
  
  if (activeTime) {
    if (activeTime.toLowerCase().includes('morning')) {
      messages.push(`${name}'s morning energy? Better than any coffee ☀️`);
    }
    if (activeTime.toLowerCase().includes('evening')) {
      messages.push(`Evening cuddles with ${name}? The best way to end any day 🌙`);
    }
  }
  
  // Pick a random message
  const randomIndex = Math.floor(Date.now() / 60000) % messages.length; // Changes every minute
  return messages[randomIndex];
};

const MiraLoveNote = ({ pet, variant = 'default' }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  const loveNote = useMemo(() => generateLoveNote(pet), [pet]);
  
  useEffect(() => {
    // Animate in after a short delay
    const timer = setTimeout(() => setIsVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);
  
  if (!pet || !loveNote) return null;
  
  // Hero variant - for inside the dark hero section
  if (variant === 'hero') {
    return (
      <div 
        className={`mt-4 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        data-testid="mira-love-note"
      >
        <div className="inline-flex items-start gap-3 max-w-md">
          {/* Mira Avatar */}
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center shadow-lg">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          
          {/* Message Bubble */}
          <div className="relative">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl rounded-tl-sm px-4 py-3 border border-white/20">
              <p className="text-sm md:text-base text-white/90 font-medium leading-relaxed">
                &ldquo;{loveNote}&rdquo;
              </p>
              <p className="text-xs text-white/50 mt-1.5 flex items-center gap-1">
                <Heart className="w-3 h-3 fill-pink-400 text-pink-400" />
                Mira knows {pet.name}
              </p>
            </div>
            
            {/* Decorative sparkle */}
            <Sparkles className="absolute -top-2 -right-2 w-5 h-5 text-amber-400 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }
  
  // Card variant - for standalone display
  if (variant === 'card') {
    return (
      <div 
        className={`bg-gradient-to-br from-purple-50 via-pink-50 to-amber-50 rounded-2xl p-4 sm:p-5 border border-purple-100 shadow-sm transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        data-testid="mira-love-note"
      >
        <div className="flex items-start gap-3">
          {/* Mira Avatar with glow */}
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full blur-md opacity-50"></div>
            <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-purple-700">Mira says...</span>
              <Heart className="w-4 h-4 fill-pink-500 text-pink-500 animate-pulse" />
            </div>
            <p className="text-base text-gray-700 font-medium leading-relaxed">
              {loveNote}
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  // Default inline variant
  return (
    <div 
      className={`flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl border border-purple-200 transition-all duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      data-testid="mira-love-note"
    >
      <Sparkles className="w-4 h-4 text-purple-500 flex-shrink-0" />
      <p className="text-sm text-purple-700 font-medium truncate">{loveNote}</p>
    </div>
  );
};

export default MiraLoveNote;

/**
 * PillarHero.jsx
 * Reusable personalized hero component for ALL pillar pages
 * Makes the pet the HERO of every page with emotional Mira messages!
 */

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Heart, Sparkles, PawPrint, ChevronDown } from 'lucide-react';
import { API_URL } from '../utils/api';
import { useAuth } from '../context/AuthContext';

// Pillar-specific configurations
const PILLAR_CONFIG = {
  celebrate: {
    gradient: 'from-pink-600 via-rose-600 to-purple-600',
    badge: '🎉 Party time for {name}!',
    badgeDefault: 'Every Paw Deserves a Party',
    title: 'Celebrate {name}',
    titleDefault: 'Celebrate',
    tagline: 'Custom cakes, treats & unforgettable celebrations for {name}',
    taglineDefault: 'Custom cakes, treats & unforgettable celebrations for your furry family members',
    miraMessage: '{name}\'s birthday is the most important day of the year! Let\'s make it unforgettable 🎂',
    decoration: '🎂',
    decorationPosition: 'top'
  },
  dine: {
    gradient: 'from-orange-800 via-orange-700 to-red-700',
    badge: '🍽️ Yummy time for {name}!',
    badgeDefault: 'Fresh Meals & Pet-Friendly Dining',
    title: 'Dine with {name}',
    titleDefault: 'Nourish Your Pet',
    tagline: 'Fresh meals, treats & pet-friendly restaurants curated for {name}',
    taglineDefault: 'Discover nutritious fresh meals and pet-friendly restaurants near you!',
    miraMessage: '{name}\'s tummy is ready for something delicious! Let\'s find the perfect meal 🍖',
    decoration: '🍖',
    decorationPosition: 'top-right'
  },
  care: {
    gradient: 'from-rose-900 via-pink-800 to-red-900',
    badge: '💕 Pamper time for {name}!',
    badgeDefault: 'Profile-First Pet Care',
    title: 'Care for {name}',
    titleDefault: 'Care That Knows Your Pet',
    tagline: 'Grooming, wellness & spa services curated for {name}\'s unique needs',
    taglineDefault: 'From grooming to training, walks to wellness — we understand your pet\'s unique needs',
    miraMessage: '{name}\'s coat deserves the royal treatment! Let\'s find the perfect groomer ✨',
    decoration: '✨',
    decorationPosition: 'top-right'
  },
  enjoy: {
    gradient: 'from-violet-800 via-purple-700 to-indigo-800',
    badge: '🎾 Playtime for {name}!',
    badgeDefault: 'Fun & Entertainment',
    title: 'Play with {name}',
    titleDefault: 'Fun & Games',
    tagline: 'Toys, activities & fun experiences curated for {name}',
    taglineDefault: 'Discover toys and activities your pet will love!',
    miraMessage: '{name} is ready for some serious fun! Let\'s find the perfect toy 🎾',
    decoration: '🎾',
    decorationPosition: 'top-right'
  },
  travel: {
    gradient: 'from-blue-800 via-indigo-700 to-purple-800',
    badge: '✈️ Adventure awaits {name}!',
    badgeDefault: 'Pet Travel Made Easy',
    title: 'Travel with {name}',
    titleDefault: 'Travel Together',
    tagline: 'Travel gear & pet-friendly destinations for adventures with {name}',
    taglineDefault: 'Everything you need for safe, comfortable travels with your pet',
    miraMessage: '{name} is ready for an adventure! Where shall we go? ✈️',
    decoration: '✈️',
    decorationPosition: 'top-right'
  },
  stay: {
    gradient: 'from-teal-800 via-cyan-700 to-blue-800',
    badge: '🏠 Home sweet home for {name}!',
    badgeDefault: 'Pet Boarding & Sitting',
    title: 'Stay for {name}',
    titleDefault: 'Home Away From Home',
    tagline: 'Trusted boarding, daycare & pet sitting for {name}',
    taglineDefault: 'Find loving care for your pet when you\'re away',
    miraMessage: '{name} will be in safe hands! Let\'s find the perfect stay 🏠',
    decoration: '🏠',
    decorationPosition: 'top-right'
  },
  fit: {
    gradient: 'from-green-800 via-emerald-700 to-teal-800',
    badge: '💪 Fitness time for {name}!',
    badgeDefault: 'Pet Health & Fitness',
    title: 'Fit {name}',
    titleDefault: 'Health & Fitness',
    tagline: 'Exercise, wellness & health products for {name}',
    taglineDefault: 'Keep your pet healthy and active with our fitness solutions',
    miraMessage: '{name} is ready to get moving! Let\'s stay healthy together 💪',
    decoration: '💪',
    decorationPosition: 'top-right'
  },
  learn: {
    gradient: 'from-amber-800 via-yellow-700 to-orange-800',
    badge: '🎓 Learning time for {name}!',
    badgeDefault: 'Pet Training & Education',
    title: 'Train {name}',
    titleDefault: 'Learn & Grow',
    tagline: 'Training, classes & educational resources for {name}',
    taglineDefault: 'Expert training and education for your pet',
    miraMessage: '{name} is such a smart cookie! Let\'s learn something new 🎓',
    decoration: '🎓',
    decorationPosition: 'top-right'
  },
  advisory: {
    gradient: 'from-cyan-800 via-blue-700 to-indigo-800',
    badge: '💬 Expert advice for {name}!',
    badgeDefault: 'Pet Expert Advice',
    title: 'Advice for {name}',
    titleDefault: 'Expert Guidance',
    tagline: 'Professional consultations & expert guidance for {name}',
    taglineDefault: 'Get expert advice on all things pet care',
    miraMessage: 'Got questions about {name}? Our experts are here to help! 💬',
    decoration: '💬',
    decorationPosition: 'top-right'
  },
  emergency: {
    gradient: 'from-red-900 via-red-800 to-orange-800',
    badge: '🚨 Here for {name}, always',
    badgeDefault: '24/7 Emergency Support',
    title: 'Emergency for {name}',
    titleDefault: 'Emergency Care',
    tagline: '24/7 emergency support and care for {name}',
    taglineDefault: 'Immediate help when your pet needs it most',
    miraMessage: '{name}\'s safety is our priority. We\'re here for you 24/7 🚨',
    decoration: '🚨',
    decorationPosition: 'top-right'
  },
  paperwork: {
    gradient: 'from-slate-800 via-gray-700 to-zinc-800',
    badge: '📄 Documents for {name}',
    badgeDefault: 'Pet Documentation',
    title: 'Paperwork for {name}',
    titleDefault: 'Documentation',
    tagline: 'Certificates, records & official documents for {name}',
    taglineDefault: 'Keep your pet\'s records organized and accessible',
    miraMessage: 'Let\'s keep {name}\'s paperwork in order! 📄',
    decoration: '📄',
    decorationPosition: 'top-right'
  },
  farewell: {
    gradient: 'from-purple-900 via-indigo-800 to-violet-900',
    badge: '🌈 Honoring {name}',
    badgeDefault: 'Memorial & Support',
    title: 'Remember {name}',
    titleDefault: 'In Loving Memory',
    tagline: 'Compassionate support and memorial services',
    taglineDefault: 'Honoring the beautiful bond you shared',
    miraMessage: '{name}\'s memory will live forever in your heart 🌈',
    decoration: '🌈',
    decorationPosition: 'top'
  },
  adopt: {
    gradient: 'from-amber-700 via-yellow-600 to-orange-700',
    badge: '🐾 Expand your family!',
    badgeDefault: 'Pet Adoption',
    title: 'Find a Friend',
    titleDefault: 'Adopt a Pet',
    tagline: 'Find your new best friend through adoption',
    taglineDefault: 'Give a loving home to a pet in need',
    miraMessage: 'Every pet deserves love! Ready to meet your new friend? 🐾',
    decoration: '🐾',
    decorationPosition: 'top-right'
  }
};

const PillarHero = ({
  pillar = 'celebrate',
  heroImages = [],
  badgeIcon = null,
  primaryAction = null,
  secondaryAction = null,
  trustIndicators = [],
  children
}) => {
  const { token } = useAuth();
  const [activePet, setActivePet] = useState(null);
  const [heroIndex, setHeroIndex] = useState(0);
  
  const config = PILLAR_CONFIG[pillar] || PILLAR_CONFIG.celebrate;
  
  // Fetch user's pets
  useEffect(() => {
    const fetchPets = async () => {
      if (!token) return;
      try {
        const response = await fetch(`${API_URL}/api/pets/my-pets`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          const pets = data.pets || [];
          if (pets.length > 0) {
            setActivePet(pets[0]);
          }
        }
      } catch (err) {
        console.debug('Failed to fetch pets:', err);
      }
    };
    fetchPets();
  }, [token]);
  
  // Rotate hero images
  useEffect(() => {
    if (heroImages.length <= 1) return;
    const interval = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [heroImages.length]);
  
  const petName = activePet?.name || '';
  const petPhoto = activePet?.photo_url || activePet?.image;
  
  // Replace {name} placeholders
  const replaceName = (text) => text.replace(/{name}/g, petName);
  
  return (
    <div className={`relative overflow-hidden bg-gradient-to-r ${config.gradient} text-white`}>
      {/* Background Image */}
      {heroImages.length > 0 && (
        <div className="absolute inset-0">
          <img 
            src={heroImages[heroIndex]}
            alt="Background"
            className="w-full h-full object-cover opacity-20 transition-opacity duration-1000"
          />
          <div className={`absolute inset-0 bg-gradient-to-r ${config.gradient} opacity-80`} />
        </div>
      )}
      
      {/* Floating decorations */}
      <div className="absolute top-6 sm:top-10 left-4 sm:left-10 text-3xl sm:text-4xl animate-bounce opacity-50">🎈</div>
      <div className="absolute top-12 sm:top-20 right-4 sm:right-20 text-2xl sm:text-3xl animate-pulse opacity-50">🎉</div>
      
      <div className="relative max-w-6xl mx-auto px-4 py-8 sm:py-12 lg:py-16">
        <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-10">
          
          {/* Pet Photo Section - PET IS THE HERO! */}
          {activePet && (
            <div className="relative flex-shrink-0">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-white/20 rounded-full blur-xl scale-125 animate-pulse" />
              
              {/* Pet Photo */}
              <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden border-4 border-white/30 shadow-2xl">
                {petPhoto ? (
                  <img 
                    src={petPhoto}
                    alt={petName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-white/20 flex items-center justify-center">
                    <PawPrint className="w-14 h-14 text-white/60" />
                  </div>
                )}
              </div>
              
              {/* Decoration */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-3xl">
                {config.decoration}
              </div>
            </div>
          )}
          
          {/* Content */}
          <div className={`flex-1 ${activePet ? 'text-center lg:text-left' : 'text-center'}`}>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/20 backdrop-blur-sm rounded-full mb-4 sm:mb-5 animate-fade-in-up">
              {badgeIcon}
              <span className="font-medium text-sm sm:text-base">
                {activePet ? replaceName(config.badge) : config.badgeDefault}
              </span>
            </div>
            
            {/* Title */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 animate-fade-in-up" style={{animationDelay: '0.1s'}}>
              {activePet ? (
                <>{config.title.split('{name}')[0]}<span className="text-amber-300">{petName}</span></>
              ) : (
                config.titleDefault
              )}
            </h1>
            
            {/* Tagline */}
            <p className="text-base sm:text-lg md:text-xl text-white/80 max-w-2xl mb-4 sm:mb-5 px-2 lg:px-0 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
              {activePet ? replaceName(config.tagline) : config.taglineDefault}
            </p>
            
            {/* Mira's emotional message */}
            {activePet && (
              <div className="flex items-start gap-3 mb-5 justify-center lg:justify-start animate-fade-in-up" style={{animationDelay: '0.25s'}}>
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-md">
                  <p className="text-sm text-white/90 font-medium">
                    &ldquo;{replaceName(config.miraMessage)}&rdquo;
                  </p>
                  <p className="text-xs text-white/50 mt-1 flex items-center gap-1">
                    <Heart className="w-3 h-3 fill-pink-300 text-pink-300" />
                    Mira loves {petName}
                  </p>
                </div>
              </div>
            )}
            
            {/* Action buttons */}
            {(primaryAction || secondaryAction) && (
              <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-3 sm:gap-4 px-4 sm:px-0 animate-fade-in-up" style={{animationDelay: '0.3s'}}>
                {primaryAction}
                {secondaryAction}
              </div>
            )}
            
            {/* Trust indicators */}
            {trustIndicators.length > 0 && (
              <div className="flex flex-wrap justify-center lg:justify-start gap-4 mt-8">
                {trustIndicators.map((indicator, i) => (
                  <div key={i} className="flex items-center gap-2 text-white/70">
                    {indicator.icon}
                    <span className="text-xs sm:text-sm">{indicator.text}</span>
                  </div>
                ))}
              </div>
            )}
            
            {children}
          </div>
        </div>
      </div>
      
      {/* Scroll Indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 animate-bounce">
        <ChevronDown className="w-6 h-6 text-white/50" />
      </div>
    </div>
  );
};

export default PillarHero;

/**
 * FirstVisitTour - Immersive onboarding experience
 * 
 * REDESIGNED: More exciting, mobile-friendly, with sticky navigation
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { 
  X, ChevronRight, ChevronLeft, Sparkles, Heart, PawPrint,
  Crown, Gift, Star, Rocket, Zap, Trophy, Check, PartyPopper
} from 'lucide-react';

// Mira's avatar
const MiraAvatar = ({ size = "md", animate = true }) => {
  const sizes = {
    sm: "w-10 h-10 text-lg",
    md: "w-16 h-16 text-2xl",
    lg: "w-24 h-24 text-4xl"
  };
  
  return (
    <div className={`${sizes[size]} bg-gradient-to-br from-purple-400 via-pink-400 to-orange-400 rounded-2xl flex items-center justify-center shadow-xl ${animate ? 'animate-bounce-gentle' : ''}`}>
      <span>🐕‍🦺</span>
    </div>
  );
};

// Tour steps - simplified and more impactful
const TOUR_STEPS = [
  {
    id: 'welcome',
    emoji: '🐾',
    title: "Welcome to Your Pet's New Home!",
    highlight: "The World's First Pet Life Operating System",
    description: "Everything your furry friend needs - from birthday cakes to vet visits, all in one place.",
    features: ['🎂 Celebrations', '🍽️ Dining', '🏨 Stay', '💊 Care'],
    miraMessage: "I'm Mira, your personal pet concierge! I'll remember everything about your pup and help you give them the best life ever!",
    bgGradient: 'from-purple-600 via-pink-600 to-orange-500',
    iconBg: 'bg-purple-500'
  },
  {
    id: 'pet-soul',
    emoji: '✨',
    title: "Meet Pet Soul™",
    highlight: "Your Pet's Digital Identity",
    description: "The more I know about your pet, the better I can help. Answer fun questions and watch the magic happen!",
    features: ['🦴 Favorite treats', '💊 Health needs', '🎾 Play style', '😴 Sleep habits'],
    miraMessage: "When you tell me your pup loves chicken, I'll always show chicken treats first! It's like magic, but better!",
    bgGradient: 'from-violet-600 via-purple-600 to-pink-500',
    iconBg: 'bg-violet-500'
  },
  {
    id: 'pillars',
    emoji: '🏛️',
    title: "14 Pillars of Pet Life",
    highlight: "Every Need, One Platform",
    description: "From birthday cakes to emergency care - we've got your pet's entire life covered!",
    pillars: [
      { emoji: '🎂', name: 'Celebrate' },
      { emoji: '🍽️', name: 'Dine' },
      { emoji: '🏨', name: 'Stay' },
      { emoji: '✈️', name: 'Travel' },
      { emoji: '💊', name: 'Care' },
      { emoji: '🎾', name: 'Enjoy' },
      { emoji: '🏃', name: 'Fit' },
      { emoji: '🎓', name: 'Learn' },
      { emoji: '📄', name: 'Paperwork' },
      { emoji: '📋', name: 'Advisory' },
      { emoji: '🚨', name: 'Emergency' },
      { emoji: '🌈', name: 'Farewell' },
      { emoji: '🐕', name: 'Adopt' },
      { emoji: '🛍️', name: 'Shop' }
    ],
    miraMessage: "No more juggling 10 different apps! I keep everything organized in one beautiful place. Your pet deserves simplicity!",
    bgGradient: 'from-teal-600 via-cyan-600 to-blue-500',
    iconBg: 'bg-teal-500'
  },
  {
    id: 'rewards',
    emoji: '💎',
    title: "Earn Paw Points!",
    highlight: "Get Rewarded for Loving Your Pet",
    description: "Every order, every question answered, every milestone - you earn points you can redeem!",
    rewards: [
      { points: '100', label: 'First Order', icon: '🛒' },
      { points: '500', label: 'Soul Explorer', icon: '🧭' },
      { points: '1000', label: 'Soul Master', icon: '👑' }
    ],
    miraMessage: "Shop, answer questions, unlock badges - watch your Paw Points grow! Redeem them for discounts on treats, grooming, and more!",
    bgGradient: 'from-amber-500 via-orange-500 to-red-500',
    iconBg: 'bg-amber-500'
  },
  {
    id: 'mira',
    emoji: '🐕‍🦺',
    title: "I'm Always Here!",
    highlight: "Your 24/7 Pet Concierge",
    description: "Questions? Orders? Recommendations? Just ask me anything - I'm here to help!",
    features: ['💬 Chat anytime', '🎤 Voice commands', '📱 WhatsApp support', '🧠 I remember everything'],
    miraMessage: "Think of me as your pet's fairy godmother! I'll help with shopping, planning, questions, emergencies - whatever you need!",
    bgGradient: 'from-pink-500 via-rose-500 to-red-500',
    iconBg: 'bg-pink-500'
  },
  {
    id: 'start',
    emoji: '🚀',
    title: "Let's Go!",
    highlight: "Your Journey Starts Now",
    description: "You're all set! Start exploring and give your pet the life they deserve.",
    stats: [
      { value: '14', label: 'Life Pillars' },
      { value: '24/7', label: 'Support' },
      { value: '∞', label: 'Love' }
    ],
    miraMessage: "I can't wait to help you and your fur baby! Let's make every tail wag and every day special!",
    bgGradient: 'from-green-500 via-emerald-500 to-teal-500',
    iconBg: 'bg-green-500'
  }
];

const FirstVisitTour = ({ isOpen, onClose, onComplete, userName, petName }) => {
  const [currentStep, setCurrentStep] = useState(0);
  
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);
  
  const handleNext = useCallback(() => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      localStorage.setItem('tour_completed', 'true');
      if (onComplete) onComplete();
      onClose();
    }
  }, [currentStep, onClose, onComplete]);
  
  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);
  
  const handleSkip = () => {
    localStorage.setItem('tour_completed', 'true');
    onClose();
  };
  
  if (!isOpen) return null;
  
  const step = TOUR_STEPS[currentStep];
  const isLastStep = currentStep === TOUR_STEPS.length - 1;
  const progress = ((currentStep + 1) / TOUR_STEPS.length) * 100;
  
  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex flex-col">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute text-white/10 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              fontSize: `${Math.random() * 30 + 20}px`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${Math.random() * 2 + 2}s`
            }}
          >
            {['🐾', '✨', '💜', '🦴'][Math.floor(Math.random() * 4)]}
          </div>
        ))}
      </div>
      
      {/* Top bar with progress */}
      <div className="relative z-10 p-4">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-2 text-white/80">
            <span className="text-sm font-medium">{currentStep + 1} of {TOUR_STEPS.length}</span>
          </div>
          <button
            onClick={handleSkip}
            className="text-white/60 hover:text-white text-sm flex items-center gap-1 transition-colors"
          >
            Skip <X className="w-4 h-4" />
          </button>
        </div>
        {/* Progress bar */}
        <div className="max-w-2xl mx-auto mt-2">
          <div className="h-1 bg-white/20 rounded-full overflow-hidden">
            <div 
              className={`h-full bg-gradient-to-r ${step.bgGradient} transition-all duration-500`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
      
      {/* Main content - scrollable */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-lg mx-auto">
          {/* Big emoji icon */}
          <div className="text-center mb-6">
            <div className={`inline-flex w-24 h-24 ${step.iconBg} rounded-3xl items-center justify-center text-5xl shadow-2xl animate-bounce-slow`}>
              {step.emoji}
            </div>
          </div>
          
          {/* Title */}
          <div className="text-center mb-6">
            <h1 className="text-3xl md:text-4xl font-black text-white mb-2">
              {step.title}
            </h1>
            <div className={`inline-block bg-gradient-to-r ${step.bgGradient} text-white text-sm font-bold px-4 py-1.5 rounded-full`}>
              {step.highlight}
            </div>
          </div>
          
          {/* Description */}
          <p className="text-white/80 text-center text-lg mb-8">
            {step.description}
          </p>
          
          {/* Dynamic content based on step */}
          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 mb-6">
            {/* Features list */}
            {step.features && (
              <div className="grid grid-cols-2 gap-3">
                {step.features.map((feature, idx) => (
                  <div 
                    key={idx}
                    className="bg-white/20 rounded-xl p-3 text-white text-center font-medium"
                  >
                    {feature}
                  </div>
                ))}
              </div>
            )}
            
            {/* Pillars grid */}
            {step.pillars && (
              <div className="grid grid-cols-7 gap-2">
                {step.pillars.map((pillar, idx) => (
                  <div 
                    key={idx}
                    className="aspect-square bg-white/20 rounded-xl flex flex-col items-center justify-center hover:bg-white/30 transition-colors cursor-pointer group"
                    title={pillar.name}
                  >
                    <span className="text-2xl group-hover:scale-125 transition-transform">{pillar.emoji}</span>
                  </div>
                ))}
              </div>
            )}
            
            {/* Rewards */}
            {step.rewards && (
              <div className="grid grid-cols-3 gap-4">
                {step.rewards.map((reward, idx) => (
                  <div 
                    key={idx}
                    className="bg-white/20 rounded-2xl p-4 text-center"
                  >
                    <div className="text-3xl mb-2">{reward.icon}</div>
                    <div className="text-2xl font-black text-white">{reward.points}</div>
                    <div className="text-white/70 text-xs">{reward.label}</div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Stats for final step */}
            {step.stats && (
              <div className="grid grid-cols-3 gap-4">
                {step.stats.map((stat, idx) => (
                  <div 
                    key={idx}
                    className="bg-white/20 rounded-2xl p-4 text-center"
                  >
                    <div className="text-3xl font-black text-white">{stat.value}</div>
                    <div className="text-white/70 text-sm">{stat.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Mira's message */}
          <div className="bg-white rounded-2xl p-4 shadow-xl">
            <div className="flex items-start gap-3">
              <MiraAvatar size="sm" animate={false} />
              <div className="flex-1">
                <div className="text-xs text-purple-600 font-bold mb-1">🐕‍🦺 Mira says:</div>
                <p className="text-gray-700 text-sm leading-relaxed">
                  "{step.miraMessage.replace('{userName}', userName || 'friend').replace('{petName}', petName || 'your pup')}"
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* STICKY Navigation - Always visible */}
      <div className="relative z-10 bg-gradient-to-t from-black/80 to-transparent pt-8 pb-6 px-4">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-4">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentStep === 0}
            className={`flex-1 h-14 rounded-2xl border-2 border-white/30 bg-white/10 text-white hover:bg-white/20 ${currentStep === 0 ? 'opacity-0 pointer-events-none' : ''}`}
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back
          </Button>
          
          <Button
            onClick={handleNext}
            className={`flex-1 h-14 rounded-2xl bg-gradient-to-r ${step.bgGradient} text-white font-bold text-lg hover:opacity-90 shadow-lg`}
          >
            {isLastStep ? (
              <>
                <Rocket className="w-5 h-5 mr-2" />
                Let's Go!
              </>
            ) : (
              <>
                Next
                <ChevronRight className="w-5 h-5 ml-1" />
              </>
            )}
          </Button>
        </div>
        
        {/* Step dots */}
        <div className="flex justify-center gap-2 mt-4">
          {TOUR_STEPS.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentStep(idx)}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === currentStep 
                  ? 'w-6 bg-white' 
                  : idx < currentStep 
                    ? 'bg-white/60' 
                    : 'bg-white/30'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// Hook to manage tour state
export const useTour = () => {
  const [showTour, setShowTour] = useState(false);
  
  useEffect(() => {
    const hasCompletedTour = localStorage.getItem('tour_completed');
    if (!hasCompletedTour) {
      const timer = setTimeout(() => setShowTour(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);
  
  const startTour = () => setShowTour(true);
  const endTour = () => setShowTour(false);
  const resetTour = () => {
    localStorage.removeItem('tour_completed');
    setShowTour(true);
  };
  
  return { showTour, startTour, endTour, resetTour };
};

export default FirstVisitTour;

/**
 * FirstVisitTour - Guided onboarding for new members
 * 
 * An immersive, dog-friendly tour that introduces pet parents to the
 * World's First Pet Life Operating System. Makes them fall in love
 * with the platform and understand its unique value.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { 
  X, ChevronRight, ChevronLeft, Sparkles, Heart, PawPrint,
  Crown, Gift, Star, Cake, Utensils, Home as HomeIcon, Plane,
  Stethoscope, Gamepad2, Dumbbell, GraduationCap, FileText,
  MessageCircle, AlertTriangle, Flower2, Dog, ShoppingBag,
  PartyPopper, Trophy, Zap, Target, Check
} from 'lucide-react';

// Mira's avatar for the tour
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

// The 14 pillars data
const PILLARS = [
  { id: 'celebrate', name: 'Celebrate', icon: Cake, emoji: '🎂', color: 'from-pink-400 to-rose-400', desc: 'Birthdays, gotcha days & special moments' },
  { id: 'dine', name: 'Dine', icon: Utensils, emoji: '🍽️', color: 'from-amber-400 to-orange-400', desc: 'Pet-friendly restaurants & cafes' },
  { id: 'stay', name: 'Stay', icon: HomeIcon, emoji: '🏨', color: 'from-blue-400 to-indigo-400', desc: 'Boarding, daycare & pet hotels' },
  { id: 'travel', name: 'Travel', icon: Plane, emoji: '✈️', color: 'from-cyan-400 to-blue-400', desc: 'Pet-friendly vacations & transport' },
  { id: 'care', name: 'Care', icon: Stethoscope, emoji: '💊', color: 'from-red-400 to-rose-400', desc: 'Vets, grooming & healthcare' },
  { id: 'enjoy', name: 'Enjoy', icon: Gamepad2, emoji: '🎾', color: 'from-violet-400 to-purple-400', desc: 'Parks, events & activities' },
  { id: 'fit', name: 'Fit', icon: Dumbbell, emoji: '🏃', color: 'from-green-400 to-emerald-400', desc: 'Exercise, walking & fitness' },
  { id: 'learn', name: 'Learn', icon: GraduationCap, emoji: '🎓', color: 'from-teal-400 to-cyan-400', desc: 'Training, classes & behavior' },
  { id: 'paperwork', name: 'Paperwork', icon: FileText, emoji: '📄', color: 'from-slate-400 to-gray-500', desc: 'Documents, licenses & records' },
  { id: 'advisory', name: 'Advisory', icon: MessageCircle, emoji: '📋', color: 'from-indigo-400 to-violet-400', desc: 'Expert advice & consultations' },
  { id: 'emergency', name: 'Emergency', icon: AlertTriangle, emoji: '🚨', color: 'from-red-500 to-rose-500', desc: '24/7 emergency support' },
  { id: 'farewell', name: 'Farewell', icon: Flower2, emoji: '🌈', color: 'from-purple-300 to-pink-300', desc: 'End-of-life care & memorials' },
  { id: 'adopt', name: 'Adopt', icon: Dog, emoji: '🐕', color: 'from-amber-300 to-yellow-400', desc: 'Find your new best friend' },
  { id: 'shop', name: 'Shop', icon: ShoppingBag, emoji: '🛍️', color: 'from-pink-500 to-purple-500', desc: 'Everything your pet needs' }
];

// Tour steps content
const TOUR_STEPS = [
  {
    id: 'welcome',
    title: "Welcome to The Doggy Company! 🐾",
    subtitle: "I'm Mira, your personal pet concierge",
    content: (
      <div className="text-center">
        <p className="text-lg text-gray-700 mb-4">
          You've just unlocked <span className="font-bold text-purple-600">The World's First Pet Life Operating System</span>
        </p>
        <p className="text-gray-600">
          Think of me as your furry friend's personal assistant. I'll help you navigate 
          <strong> every aspect of pet parenthood</strong> - from birthday cakes to vet visits, 
          travel plans to training tips!
        </p>
      </div>
    ),
    miraMessage: "I'm SO excited to meet you and your fur baby! Let me show you around... 🐕💕"
  },
  {
    id: 'pet-soul',
    title: "Meet Pet Soul™ 💫",
    subtitle: "Your pet's digital personality profile",
    content: (
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <div>
              <h4 className="text-xl font-bold text-purple-800">The more I know...</h4>
              <p className="text-purple-600">...the better I can help!</p>
            </div>
          </div>
          <p className="text-gray-700">
            Answer simple questions about your pet's personality, preferences, and health. 
            I'll use this to <strong>personalize everything</strong> - from product recommendations 
            to care reminders!
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-purple-50 rounded-xl">
            <div className="text-2xl mb-1">🦴</div>
            <p className="text-xs text-gray-600">Favorite treats</p>
          </div>
          <div className="text-center p-3 bg-pink-50 rounded-xl">
            <div className="text-2xl mb-1">💊</div>
            <p className="text-xs text-gray-600">Health needs</p>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-xl">
            <div className="text-2xl mb-1">🎾</div>
            <p className="text-xs text-gray-600">Play style</p>
          </div>
        </div>
      </div>
    ),
    miraMessage: "When you tell me your pup loves chicken treats, I'll remember! Next time you shop, I'll show chicken-flavored goodies first! 🐔✨"
  },
  {
    id: 'pillars',
    title: "14 Pillars of Pet Life 🏛️",
    subtitle: "Everything your pet needs, in one place",
    content: (
      <div className="space-y-4">
        <p className="text-gray-700 text-center mb-4">
          From <strong>birthday cakes</strong> to <strong>emergency care</strong>, 
          we've got every aspect of your pet's life covered!
        </p>
        <div className="grid grid-cols-7 gap-2">
          {PILLARS.map((pillar, idx) => (
            <div 
              key={pillar.id}
              className="group relative"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className={`w-full aspect-square bg-gradient-to-br ${pillar.color} rounded-xl flex items-center justify-center text-2xl shadow-md hover:scale-110 transition-transform cursor-pointer`}>
                {pillar.emoji}
              </div>
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                  {pillar.name}
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-center text-sm text-purple-600 mt-6">
          ✨ Your Pet Pass unlocks access to ALL 14 pillars!
        </p>
      </div>
    ),
    miraMessage: "No more juggling 10 different apps! I keep everything organized in one beautiful place. Your pet deserves simplicity! 🎀"
  },
  {
    id: 'celebrations',
    title: "Never Miss a Moment 🎉",
    subtitle: "Birthdays, gotcha days & milestones",
    content: (
      <div className="space-y-4">
        <div className="relative bg-gradient-to-r from-pink-100 via-purple-100 to-orange-100 rounded-2xl p-6 overflow-hidden">
          <div className="absolute -right-4 -top-4 text-6xl opacity-20">🎂</div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <PartyPopper className="w-8 h-8 text-pink-500" />
              <h4 className="text-xl font-bold text-gray-800">My Celebrations</h4>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-white/60 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🎂</span>
                  <div>
                    <p className="font-semibold text-gray-800">Bruno's 3rd Birthday</p>
                    <p className="text-xs text-gray-500">March 15th</p>
                  </div>
                </div>
                <span className="text-pink-600 font-bold">5 days!</span>
              </div>
              <div className="flex items-center justify-between bg-white/60 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">💝</span>
                  <div>
                    <p className="font-semibold text-gray-800">Gotcha Day Anniversary</p>
                    <p className="text-xs text-gray-500">April 2nd</p>
                  </div>
                </div>
                <span className="text-purple-600 font-bold">23 days</span>
              </div>
            </div>
          </div>
        </div>
        <p className="text-center text-gray-600 text-sm">
          I'll remind you in advance so you can plan the perfect celebration! 🎁
        </p>
      </div>
    ),
    miraMessage: "I'll NEVER let you forget your fur baby's special days! Plus, I'll help you order cakes, plan parties, and find the perfect gifts! 🎁🎈"
  },
  {
    id: 'rewards',
    title: "Earn While You Love 💎",
    subtitle: "Paw Points & achievements",
    content: (
      <div className="space-y-4">
        <div className="bg-gradient-to-br from-amber-50 to-orange-100 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
                <PawPrint className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-gray-800">Paw Points</h4>
                <p className="text-sm text-amber-600">Your loyalty rewards</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-amber-600">2,450</p>
              <p className="text-xs text-gray-500">points earned</p>
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-2 mb-4">
            {['🌱', '🔍', '🧭', '👑'].map((badge, idx) => (
              <div key={idx} className="aspect-square bg-white/60 rounded-lg flex items-center justify-center text-2xl">
                {badge}
              </div>
            ))}
          </div>
          
          <div className="bg-white/60 rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>Earn badges by completing your pet's Soul Journey!</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 bg-purple-50 rounded-xl">
            <p className="text-2xl font-bold text-purple-600">100</p>
            <p className="text-xs text-gray-600">First order bonus</p>
          </div>
          <div className="p-3 bg-pink-50 rounded-xl">
            <p className="text-2xl font-bold text-pink-600">1000</p>
            <p className="text-xs text-gray-600">Soul Master reward</p>
          </div>
          <div className="p-3 bg-orange-50 rounded-xl">
            <p className="text-2xl font-bold text-orange-600">∞</p>
            <p className="text-xs text-gray-600">Ways to earn!</p>
          </div>
        </div>
      </div>
    ),
    miraMessage: "Every time you shop, review, or complete your pet's profile, you earn Paw Points! Redeem them for discounts on your next order! 💰🐾"
  },
  {
    id: 'mira-intro',
    title: "I'm Always Here for You 💜",
    subtitle: "Your 24/7 pet concierge",
    content: (
      <div className="space-y-4">
        <div className="bg-gradient-to-br from-purple-100 via-pink-50 to-orange-50 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <MiraAvatar size="lg" animate={false} />
            <div className="flex-1">
              <div className="bg-white rounded-2xl rounded-tl-none p-4 shadow-md">
                <p className="text-gray-700">
                  "Hi! I'm <strong>Mira</strong>, your AI pet concierge. I know everything about 
                  The Doggy Company - our products, services, programs, and more! 
                </p>
                <p className="text-gray-700 mt-2">
                  Ask me anything - from 'what's safe for allergic pups?' to 
                  'help me plan a birthday party!' I'm here 24/7! 🌟"
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
            <Zap className="w-6 h-6 text-purple-500 mb-2" />
            <h5 className="font-semibold text-gray-800 text-sm">Instant Answers</h5>
            <p className="text-xs text-gray-600">No waiting, no hold music!</p>
          </div>
          <div className="p-4 bg-pink-50 rounded-xl border border-pink-200">
            <Heart className="w-6 h-6 text-pink-500 mb-2" />
            <h5 className="font-semibold text-gray-800 text-sm">Personalized</h5>
            <p className="text-xs text-gray-600">I remember your pet!</p>
          </div>
        </div>
      </div>
    ),
    miraMessage: "Think of me as your pet's fairy godmother! ✨ I'll help you with anything - shopping, planning, questions, emergencies. Just chat! 💬"
  },
  {
    id: 'get-started',
    title: "Let's Begin Your Journey! 🚀",
    subtitle: "Your pet's life is about to get amazing",
    content: (
      <div className="space-y-4 text-center">
        <div className="bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 rounded-2xl p-8 text-white">
          <Crown className="w-16 h-16 mx-auto mb-4 text-yellow-300" />
          <h4 className="text-2xl font-bold mb-2">You're All Set!</h4>
          <p className="text-white/90 mb-4">
            Welcome to the family. Your fur baby is in great paws now!
          </p>
          <div className="flex justify-center gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold">14</p>
              <p className="text-xs text-white/80">Life Pillars</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">∞</p>
              <p className="text-xs text-white/80">Support</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">1</p>
              <p className="text-xs text-white/80">Happy Pet</p>
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          <p className="text-gray-700 font-medium">
            Ready to start your pet's Soul Journey?
          </p>
          <div className="flex items-center justify-center gap-2 text-purple-600">
            <Check className="w-5 h-5" />
            <span>Complete your profile to unlock personalized recommendations</span>
          </div>
        </div>
      </div>
    ),
    miraMessage: "I can't wait to help you and your fur baby! Let's make every tail wag and every day special! 🐾💕"
  }
];

// Main Tour Component
const FirstVisitTour = ({ isOpen, onClose, onComplete, userName, petName }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Check if user has seen the tour
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);
  
  const handleNext = useCallback(() => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
        setIsAnimating(false);
      }, 200);
    } else {
      // Mark tour as complete
      localStorage.setItem('tour_completed', 'true');
      if (onComplete) onComplete();
      onClose();
    }
  }, [currentStep, onClose, onComplete]);
  
  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(prev => prev - 1);
        setIsAnimating(false);
      }, 200);
    }
  }, [currentStep]);
  
  const handleSkip = () => {
    localStorage.setItem('tour_completed', 'true');
    onClose();
  };
  
  if (!isOpen) return null;
  
  const step = TOUR_STEPS[currentStep];
  const isLastStep = currentStep === TOUR_STEPS.length - 1;
  
  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      {/* Floating paw prints background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute text-white/5 text-4xl animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`
            }}
          >
            🐾
          </div>
        ))}
      </div>
      
      {/* Main card */}
      <Card className={`relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden transform transition-all duration-300 ${isAnimating ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}>
        {/* Progress bar */}
        <div className="h-2 bg-gray-100">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 transition-all duration-500"
            style={{ width: `${((currentStep + 1) / TOUR_STEPS.length) * 100}%` }}
          />
        </div>
        
        {/* Skip button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-sm flex items-center gap-1 z-10"
        >
          Skip tour
          <X className="w-4 h-4" />
        </button>
        
        {/* Content */}
        <div className="p-8">
          {/* Step indicator */}
          <div className="flex justify-center gap-2 mb-6">
            {TOUR_STEPS.map((_, idx) => (
              <div 
                key={idx}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === currentStep 
                    ? 'w-8 bg-gradient-to-r from-purple-500 to-pink-500' 
                    : idx < currentStep 
                      ? 'bg-purple-300' 
                      : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          
          {/* Title */}
          <div className="text-center mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              {step.title}
            </h2>
            <p className="text-gray-500">{step.subtitle}</p>
          </div>
          
          {/* Step content */}
          <div className="mb-6">
            {step.content}
          </div>
          
          {/* Mira's message */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <MiraAvatar size="sm" />
              <div className="flex-1">
                <div className="text-xs text-purple-600 font-medium mb-1">Mira says:</div>
                <p className="text-gray-700 text-sm italic">
                  "{step.miraMessage.replace('{userName}', userName || 'friend').replace('{petName}', petName || 'your pup')}"
                </p>
              </div>
            </div>
          </div>
          
          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={handlePrev}
              disabled={currentStep === 0}
              className={currentStep === 0 ? 'invisible' : ''}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            
            <Button
              onClick={handleNext}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8"
            >
              {isLastStep ? (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Start My Journey
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

// Hook to manage tour state
export const useTour = () => {
  const [showTour, setShowTour] = useState(false);
  
  useEffect(() => {
    // Check if first visit
    const hasCompletedTour = localStorage.getItem('tour_completed');
    const isNewUser = !hasCompletedTour;
    
    if (isNewUser) {
      // Small delay before showing tour
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

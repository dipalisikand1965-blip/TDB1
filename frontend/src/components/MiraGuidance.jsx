/**
 * MiraGuidance - A warm, dog-friendly guidance system
 * Mira is your personal pet concierge® who helps you navigate the platform
 * 
 * Features:
 * - Contextual inline tips based on page/action
 * - Friendly corner presence with bounce animation
 * - Warm, playful tone that speaks to pet parents
 */

import React, { useState, useEffect, useCallback } from 'react';
import { X, Sparkles, Heart, PawPrint, ChevronRight, Gift, Star, Lightbulb } from 'lucide-react';

// Mira's personality - warm, playful, knowledgeable
const MIRA_AVATAR = '🐕‍🦺'; // Service dog emoji - helpful!

// Contextual guidance messages based on user state
const GUIDANCE_MESSAGES = {
  // Dashboard states
  dashboard_new_user: {
    title: "Welcome to your pet parent HQ! 🏠",
    message: "I'm Mira, your personal pet concierge®! Let me show you around. Start by telling me about your furry friend - the more I know, the better I can help!",
    action: "Add Your Pet",
    actionPath: "/my-pets",
    icon: "🐾"
  },
  dashboard_low_soul: {
    title: "Let's get to know {petName} better! 💝",
    message: "You've started {petName}'s Soul Journey - amazing! Just {remaining} more questions to unlock personalized recommendations. Each answer helps me find perfect treats, services & care tips!",
    action: "Continue Soul Journey",
    actionPath: "/pet/{petId}?tab=personality",
    icon: "✨"
  },
  dashboard_mid_soul: {
    title: "You're doing great, {parentName}! 🌟",
    message: "I now know that {petName} {insight}. A few more questions and I'll unlock special recommendations just for your furry friend!",
    action: "Keep Going",
    actionPath: "/pet/{petId}?tab=personality",
    icon: "🎯"
  },
  dashboard_high_soul: {
    title: "Almost there! 🏆",
    message: "{petName}'s profile is {score}% complete! You're just {remaining} questions away from becoming a Soul Master and earning 1000 Paw Points!",
    action: "Finish Strong",
    actionPath: "/pet/{petId}?tab=personality",
    icon: "👑"
  },
  dashboard_complete: {
    title: "You're a Soul Master! 👑",
    message: "I know {petName} inside and out now! From favorite treats to health needs, I'm ready to help with anything. What shall we explore today?",
    action: "Browse Recommendations",
    actionPath: "/shop",
    icon: "🎉"
  },
  
  // Celebrations
  birthday_coming: {
    title: "🎂 {petName}'s birthday is in {days} days!",
    message: "Time to plan something special! I can help you find the perfect birthday cake, party treats, or even a celebration party.",
    action: "Plan Birthday",
    actionPath: "/celebrate",
    icon: "🎂"
  },
  gotcha_day_coming: {
    title: "💝 {years} years with {petName}!",
    message: "Your gotcha day anniversary is coming up in {days} days! This is such a special milestone - want to celebrate?",
    action: "Celebrate Together",
    actionPath: "/celebrate",
    icon: "🏠"
  },
  
  // Engagement prompts
  first_order_prompt: {
    title: "Ready to treat your pup? 🦴",
    message: "I've picked some special treats based on what I know about {petName}. Your first order unlocks 100 bonus Paw Points!",
    action: "See My Picks",
    actionPath: "/shop",
    icon: "🛒"
  },
  
  // Badges explanation
  badges_explain: {
    title: "What are these badges? 🏅",
    message: "Badges are achievements you earn on your pet parent journey! Each one unlocks Paw Points you can redeem for discounts. Answer questions, complete orders, and watch them fill up!",
    action: null,
    icon: "🏆"
  },
  
  // Points explanation
  points_explain: {
    title: "What are Paw Points? 🐾",
    message: "Paw Points are your loyalty rewards! Earn them by completing {petName}'s profile, placing orders, and unlocking achievements. Redeem them for discounts on your next order!",
    action: "View Rewards",
    actionPath: "/dashboard?tab=rewards",
    icon: "💎"
  }
};

// Fun facts Mira shares while waiting
const MIRA_FUN_FACTS = [
  "Did you know? Dogs have about 1,700 taste buds, while humans have 9,000! 🐕",
  "Fun fact: A dog's nose print is unique, just like a human fingerprint! 👃",
  "Paw tip: Dogs can smell your emotions! They know when you're happy! 💕",
  "Did you know? Dogs dream just like humans do! 💤",
  "Fun fact: A dog's sense of smell is 10,000 times more acute than ours! 🦴"
];

// Inline contextual tip component
export const MiraTip = ({ context, petName, petId, parentName, score, onDismiss, className = "" }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [dismissed, setDismissed] = useState(() => {
    const stored = localStorage.getItem(`mira_dismissed_${context}`);
    return stored === 'true';
  });
  
  if (dismissed || !isVisible) return null;
  
  const guidance = GUIDANCE_MESSAGES[context];
  if (!guidance) return null;
  
  // Replace placeholders
  const formatText = (text) => {
    if (!text) return '';
    return text
      .replace(/{petName}/g, petName || 'your pet')
      .replace(/{petId}/g, petId || '')
      .replace(/{parentName}/g, parentName || 'friend')
      .replace(/{score}/g, score || 0)
      .replace(/{remaining}/g, Math.max(0, 100 - (score || 0)))
      .replace(/{insight}/g, 'loves treats and belly rubs');
  };
  
  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem(`mira_dismissed_${context}`, 'true');
    if (onDismiss) onDismiss();
  };
  
  return (
    <div className={`bg-gradient-to-r from-purple-50 via-pink-50 to-orange-50 border border-purple-200 rounded-2xl p-4 mb-6 relative overflow-hidden ${className}`}>
      {/* Decorative paw prints */}
      <div className="absolute -right-4 -top-4 text-6xl opacity-10 transform rotate-12">🐾</div>
      <div className="absolute -left-2 -bottom-2 text-4xl opacity-10 transform -rotate-12">🐾</div>
      
      <div className="relative z-10">
        <div className="flex items-start gap-4">
          {/* Mira Avatar */}
          <div className="flex-shrink-0">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-400 via-pink-400 to-orange-400 rounded-2xl flex items-center justify-center text-2xl shadow-lg animate-bounce-slow">
              {guidance.icon || MIRA_AVATAR}
            </div>
          </div>
          
          {/* Message Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">
                ✨ Mira says
              </span>
            </div>
            
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              {formatText(guidance.title)}
            </h3>
            
            <p className="text-sm text-gray-600 leading-relaxed mb-3">
              {formatText(guidance.message)}
            </p>
            
            {guidance.action && (
              <a 
                href={formatText(guidance.actionPath)}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-full text-sm font-semibold hover:from-purple-700 hover:to-pink-700 transition-all shadow-md hover:shadow-lg group"
              >
                {guidance.action}
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            )}
          </div>
          
          {/* Dismiss button */}
          <button 
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 hover:bg-white/50 rounded-full transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Floating Mira helper - corner presence
export const MiraFloatingHelper = ({ isOpen, onToggle, message, petName }) => {
  const [funFact, setFunFact] = useState('');
  const [showBubble, setShowBubble] = useState(false);
  
  useEffect(() => {
    // Show a fun fact randomly
    const randomFact = MIRA_FUN_FACTS[Math.floor(Math.random() * MIRA_FUN_FACTS.length)];
    setFunFact(randomFact);
    
    // Show bubble after 3 seconds on first visit
    const hasSeenBubble = localStorage.getItem('mira_seen_bubble');
    if (!hasSeenBubble) {
      const timer = setTimeout(() => {
        setShowBubble(true);
        localStorage.setItem('mira_seen_bubble', 'true');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);
  
  return (
    <div className="fixed bottom-24 right-4 z-40">
      {/* Chat bubble */}
      {showBubble && !isOpen && (
        <div className="absolute bottom-16 right-0 w-64 bg-white rounded-2xl shadow-xl border border-purple-100 p-4 animate-in fade-in slide-in-from-bottom-2">
          <button 
            onClick={() => setShowBubble(false)}
            className="absolute -top-2 -right-2 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
          
          <p className="text-sm text-gray-700 mb-2">
            {message || `Hi ${petName ? `${petName}'s parent` : 'there'}! 👋 Need any help?`}
          </p>
          <p className="text-xs text-purple-600">{funFact}</p>
        </div>
      )}
      
      {/* Mira button */}
      <button
        onClick={onToggle}
        className="w-14 h-14 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 rounded-full shadow-lg flex items-center justify-center text-2xl hover:scale-110 transition-transform animate-bounce-gentle"
        aria-label="Talk to Mira"
      >
        <span className="relative">
          🐕‍🦺
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse"></span>
        </span>
      </button>
    </div>
  );
};

// Badge explainer tooltip
export const BadgeExplainer = ({ badge, isUnlocked, onClose }) => {
  if (!badge) return null;
  
  return (
    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 bg-white rounded-xl shadow-xl border border-purple-100 p-3 z-50 animate-in fade-in zoom-in-95">
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-r border-b border-purple-100 transform rotate-45"></div>
      
      <div className="relative">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">{badge.icon}</span>
          <div>
            <h4 className="font-bold text-gray-900 text-sm">{badge.name}</h4>
            <span className={`text-xs ${isUnlocked ? 'text-green-600' : 'text-gray-400'}`}>
              {isUnlocked ? '✓ Unlocked!' : 'Keep going!'}
            </span>
          </div>
        </div>
        
        <p className="text-xs text-gray-600 mb-2">{badge.description}</p>
        
        <div className="flex items-center justify-between text-xs">
          <span className="text-purple-600 font-medium">
            <Gift className="w-3 h-3 inline mr-1" />
            +{badge.reward} points
          </span>
          {!isUnlocked && badge.requirement && (
            <span className="text-gray-400">{badge.requirement}</span>
          )}
        </div>
      </div>
    </div>
  );
};

// Quick score boost encouragement
export const ScoreBoostEncouragement = ({ currentScore, questionsAnswered, totalQuestions, petName }) => {
  const getEncouragement = () => {
    if (currentScore === 0) {
      return {
        emoji: "🐣",
        text: `Let's start ${petName}'s journey!`,
        subtext: "Answer your first question to unlock personalized recommendations"
      };
    } else if (currentScore < 25) {
      return {
        emoji: "🔥",
        text: "You're warming up!",
        subtext: `${25 - currentScore}% more to unlock Soul Seeker badge + 100 points!`
      };
    } else if (currentScore < 50) {
      return {
        emoji: "⭐",
        text: "Making great progress!",
        subtext: `${petName}'s personality is shining through!`
      };
    } else if (currentScore < 75) {
      return {
        emoji: "🚀",
        text: "You're on fire!",
        subtext: `I'm learning so much about ${petName}!`
      };
    } else if (currentScore < 100) {
      return {
        emoji: "👑",
        text: "Almost a Soul Master!",
        subtext: `Just ${100 - currentScore}% to go! You've got this!`
      };
    } else {
      return {
        emoji: "🎉",
        text: "Soul Master achieved!",
        subtext: `I know everything about ${petName}!`
      };
    }
  };
  
  const encouragement = getEncouragement();
  
  return (
    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-100 to-pink-100 px-3 py-1.5 rounded-full">
      <span className="text-lg">{encouragement.emoji}</span>
      <div className="text-left">
        <p className="text-xs font-semibold text-purple-800">{encouragement.text}</p>
        <p className="text-[10px] text-purple-600">{encouragement.subtext}</p>
      </div>
    </div>
  );
};

// Helper to determine which guidance to show
export const getMiraGuidanceContext = (user, pets, orders) => {
  if (!user) return null;
  
  const primaryPet = pets?.[0];
  const score = Math.min(100, primaryPet?.overall_score || 0);
  
  // No pets yet
  if (!primaryPet) {
    return 'dashboard_new_user';
  }
  
  // Check for upcoming celebrations first
  if (primaryPet.birth_date) {
    const birthDate = new Date(primaryPet.birth_date);
    const today = new Date();
    const thisYearBday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
    if (thisYearBday < today) thisYearBday.setFullYear(today.getFullYear() + 1);
    const daysUntil = Math.ceil((thisYearBday - today) / (1000 * 60 * 60 * 24));
    if (daysUntil <= 7) {
      return 'birthday_coming';
    }
  }
  
  // Score-based guidance
  if (score < 25) return 'dashboard_low_soul';
  if (score < 50) return 'dashboard_mid_soul';
  if (score < 75) return 'dashboard_high_soul';
  if (score >= 100) return 'dashboard_complete';
  
  // First order prompt
  if (!orders || orders.length === 0) {
    return 'first_order_prompt';
  }
  
  return 'dashboard_mid_soul';
};

export default MiraTip;

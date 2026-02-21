/**
 * Achievement System - Gamification Constants and Utilities
 * Extracted from MemberDashboard.jsx for better maintainability
 * 
 * "Pawesome" Badge System with dynamic pet-centric names!
 */

import confetti from 'canvas-confetti';

// ============================================
// 🏆 PAWESOME ACHIEVEMENT SYSTEM 
// World Class Gamification for Pet Parents
// ============================================
export const ACHIEVEMENTS = {
  // Soul Journey Milestones - Dynamic names based on pet personality
  soul_starter: { 
    id: 'soul_starter', 
    name: 'Curious Pup', 
    title: 'Just getting started!',
    description: 'Begin your pet\'s soul journey - your first step to understanding them better!', 
    icon: '🌱', 
    threshold: 1,
    type: 'questions',
    reward: 50,
    tier: 'bronze',
    rarity: 'common',
    unlockMessage: "Woof! You've taken the first step! 🎉"
  },
  soul_seeker: { 
    id: 'soul_seeker', 
    name: 'Detective Doggo', 
    title: 'Sniffing out secrets!',
    description: 'Answer 25% of soul questions - you\'re uncovering your pet\'s unique personality!', 
    icon: '🔍', 
    threshold: 25,
    type: 'percentage',
    reward: 100,
    tier: 'bronze',
    rarity: 'uncommon',
    unlockMessage: "You're on the trail! Keep sniffing! 🐕"
  },
  soul_explorer: { 
    id: 'soul_explorer', 
    name: 'Adventure Buddy', 
    title: 'Exploring new territories!',
    description: 'Reach 50% soul completion - halfway to truly knowing your furry friend!', 
    icon: '🧭', 
    threshold: 50,
    type: 'percentage',
    reward: 250,
    tier: 'silver',
    rarity: 'rare',
    unlockMessage: "Pawsome explorer! The journey continues! 🌟"
  },
  soul_guardian: { 
    id: 'soul_guardian', 
    name: 'Loyal Guardian', 
    title: 'Protector of paws!',
    description: 'Achieve 75% soul mastery - you truly understand your pet\'s heart!', 
    icon: '🛡️', 
    threshold: 75,
    type: 'percentage',
    reward: 500,
    tier: 'gold',
    rarity: 'epic',
    unlockMessage: "Guardian achieved! Your bond is legendary! 🏆"
  },
  soul_master: { 
    id: 'soul_master', 
    name: 'Soul Whisperer', 
    title: 'Ultimate pet parent!',
    description: 'Complete 100% - You and your pet share an unbreakable bond!', 
    icon: '👑', 
    threshold: 100,
    type: 'percentage',
    reward: 1000,
    tier: 'platinum',
    rarity: 'legendary',
    unlockMessage: "LEGENDARY! You are the ultimate pet parent! 👑✨"
  },
  // Engagement Badges - Fun shopping achievements
  first_order: { 
    id: 'first_order', 
    name: 'Treat Hunter', 
    title: 'First paw-chase!',
    description: 'Place your first order - your pup is getting spoiled!', 
    icon: '🛒', 
    threshold: 1,
    type: 'orders',
    reward: 100,
    tier: 'bronze',
    rarity: 'common',
    unlockMessage: "Treats incoming! Your pup says thank you! 🦴"
  },
  loyal_customer: { 
    id: 'loyal_customer', 
    name: 'Spoil Master', 
    title: '5x treat deliveries!',
    description: 'Place 5 orders - your pet is living their best life!', 
    icon: '❤️', 
    threshold: 5,
    type: 'orders',
    reward: 250,
    tier: 'silver',
    rarity: 'rare',
    unlockMessage: "Your pup knows where the treats come from! 💝"
  },
  vip_member: { 
    id: 'vip_member', 
    name: 'Paw-rent of the Year', 
    title: 'VIP Status!',
    description: 'Place 10 orders - You\'re officially a VIP pet parent!', 
    icon: '💎', 
    threshold: 10,
    type: 'orders',
    reward: 500,
    tier: 'gold',
    rarity: 'epic',
    unlockMessage: "VIP status achieved! Roll out the red carpet! 🌟"
  },
  // Communication Badges
  chat_initiator: {
    id: 'chat_initiator',
    name: 'Friendly Pup',
    title: 'First woof to Meera!',
    description: 'Start your first Mira conversation',
    icon: '💬',
    threshold: 1,
    type: 'chats',
    reward: 25,
    tier: 'bronze',
    rarity: 'common',
    unlockMessage: "Nice to meet you! Let's chat! 💬"
  },
  mira_friend: {
    id: 'mira_friend',
    name: 'Best Furriend',
    title: 'Meera\'s favorite!',
    description: 'Have 10 Mira conversations - Meera loves talking to you!',
    icon: '🤖',
    threshold: 10,
    type: 'chats',
    reward: 150,
    tier: 'silver',
    rarity: 'rare',
    unlockMessage: "You're officially Meera's best furriend! 🤗"
  },
  // Profile & Activity
  profile_complete: {
    id: 'profile_complete',
    name: 'Show Off Pup',
    title: 'Profile perfection!',
    description: 'Complete your profile - Looking paw-fect!',
    icon: '✨',
    threshold: 100,
    type: 'profile',
    reward: 75,
    tier: 'bronze',
    rarity: 'uncommon',
    unlockMessage: "Looking paw-sitively fabulous! 📸"
  },
  early_adopter: {
    id: 'early_adopter',
    name: 'Trailblazer',
    title: 'OG Member!',
    description: 'Join in the first month - You\'re an original!',
    icon: '🚀',
    threshold: 1,
    type: 'special',
    reward: 200,
    tier: 'gold',
    rarity: 'legendary',
    unlockMessage: "OG Status! Thank you for being an early believer! 🚀"
  }
};

// Rarity colors for badge glow effects
export const RARITY_COLORS = {
  common: { glow: 'shadow-gray-300', ring: 'ring-gray-300' },
  uncommon: { glow: 'shadow-green-300', ring: 'ring-green-400' },
  rare: { glow: 'shadow-blue-400', ring: 'ring-blue-400' },
  epic: { glow: 'shadow-purple-500', ring: 'ring-purple-500' },
  legendary: { glow: 'shadow-yellow-500', ring: 'ring-yellow-400 animate-pulse' }
};

export const TIER_COLORS = {
  bronze: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300', glow: 'shadow-amber-200' },
  silver: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300', glow: 'shadow-slate-200' },
  gold: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300', glow: 'shadow-yellow-200' },
  platinum: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300', glow: 'shadow-purple-200' }
};

export const triggerCelebration = (intensity = 'medium') => {
  const defaults = {
    spread: intensity === 'high' ? 360 : 70,
    ticks: intensity === 'high' ? 200 : 100,
    gravity: 0.8,
    decay: 0.94,
    startVelocity: intensity === 'high' ? 45 : 30,
    colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96E6A1', '#DDA0DD', '#F7DC6F', '#BB8FCE']
  };

  const fire = (particleRatio, opts) => {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(200 * particleRatio)
    });
  };

  if (intensity === 'high') {
    // Big celebration - multiple bursts
    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });
  } else if (intensity === 'medium') {
    // Medium celebration
    fire(0.25, { spread: 26, startVelocity: 35 });
    fire(0.2, { spread: 60 });
    fire(0.25, { spread: 80, decay: 0.91 });
  } else {
    // Small celebration
    fire(0.3, { spread: 50, startVelocity: 25 });
  }
};

// Calculate achievements based on user data
export const calculateAchievements = (pets, orders, user) => {
  const unlocked = [];
  const progress = {};
  
  // Calculate best pet score
  const bestPetScore = Math.max(...(pets || []).map(p => p.overall_score || 0), 0);
  const totalQuestions = pets?.reduce((sum, p) => 
    sum + Object.keys(p.doggy_soul_answers || {}).length, 0) || 0;
  
  // Soul journey achievements
  if (totalQuestions >= 1) unlocked.push('soul_starter');
  if (bestPetScore >= 25) unlocked.push('soul_seeker');
  if (bestPetScore >= 50) unlocked.push('soul_explorer');
  if (bestPetScore >= 75) unlocked.push('soul_guardian');
  if (bestPetScore >= 100) unlocked.push('soul_master');
  
  // Order achievements
  const orderCount = orders?.length || 0;
  if (orderCount >= 1) unlocked.push('first_order');
  if (orderCount >= 5) unlocked.push('loyal_customer');
  if (orderCount >= 10) unlocked.push('vip_member');
  
  // Progress tracking
  progress.soul = bestPetScore;
  progress.orders = orderCount;
  progress.questions = totalQuestions;
  
  return { unlocked, progress };
};

export default ACHIEVEMENTS;

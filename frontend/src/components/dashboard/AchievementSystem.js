/**
 * Achievement System - Gamification Constants and Utilities
 * Extracted from MemberDashboard.jsx for better maintainability
 */

import confetti from 'canvas-confetti';

// ============================================
// 🏆 ACHIEVEMENT SYSTEM - World Class Gamification
// ============================================
export const ACHIEVEMENTS = {
  // Soul Journey Milestones
  soul_starter: { 
    id: 'soul_starter', 
    name: 'Soul Starter', 
    description: 'Begin your pet\'s soul journey', 
    icon: '🌱', 
    threshold: 1,
    type: 'questions',
    reward: 50,
    tier: 'bronze'
  },
  soul_seeker: { 
    id: 'soul_seeker', 
    name: 'Soul Seeker', 
    description: 'Answer 25% of soul questions', 
    icon: '🔍', 
    threshold: 25,
    type: 'percentage',
    reward: 100,
    tier: 'bronze'
  },
  soul_explorer: { 
    id: 'soul_explorer', 
    name: 'Soul Explorer', 
    description: 'Reach 50% soul completion', 
    icon: '🧭', 
    threshold: 50,
    type: 'percentage',
    reward: 250,
    tier: 'silver'
  },
  soul_guardian: { 
    id: 'soul_guardian', 
    name: 'Soul Guardian', 
    description: 'Achieve 75% soul mastery', 
    icon: '🛡️', 
    threshold: 75,
    type: 'percentage',
    reward: 500,
    tier: 'gold'
  },
  soul_master: { 
    id: 'soul_master', 
    name: 'Soul Master', 
    description: 'Complete 100% - Ultimate bond!', 
    icon: '👑', 
    threshold: 100,
    type: 'percentage',
    reward: 1000,
    tier: 'platinum'
  },
  // Engagement Badges
  first_order: { 
    id: 'first_order', 
    name: 'First Paw-chase', 
    description: 'Place your first order', 
    icon: '🛒', 
    threshold: 1,
    type: 'orders',
    reward: 100,
    tier: 'bronze'
  },
  loyal_customer: { 
    id: 'loyal_customer', 
    name: 'Loyal Customer', 
    description: 'Place 5 orders', 
    icon: '❤️', 
    threshold: 5,
    type: 'orders',
    reward: 250,
    tier: 'silver'
  },
  vip_member: { 
    id: 'vip_member', 
    name: 'VIP Member', 
    description: 'Place 10 orders', 
    icon: '💎', 
    threshold: 10,
    type: 'orders',
    reward: 500,
    tier: 'gold'
  },
  // Communication Badges
  chat_initiator: {
    id: 'chat_initiator',
    name: 'Chat Initiator',
    description: 'Start your first Mira conversation',
    icon: '💬',
    threshold: 1,
    type: 'chats',
    reward: 25,
    tier: 'bronze'
  },
  mira_friend: {
    id: 'mira_friend',
    name: 'Mira Friend',
    description: 'Have 10 Mira conversations',
    icon: '🤖',
    threshold: 10,
    type: 'chats',
    reward: 150,
    tier: 'silver'
  },
  // Profile & Activity
  profile_complete: {
    id: 'profile_complete',
    name: 'Profile Pro',
    description: 'Complete your profile',
    icon: '✨',
    threshold: 100,
    type: 'profile',
    reward: 75,
    tier: 'bronze'
  },
  early_adopter: {
    id: 'early_adopter',
    name: 'Early Adopter',
    description: 'Join in the first month',
    icon: '🚀',
    threshold: 1,
    type: 'special',
    reward: 200,
    tier: 'gold'
  }
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

/**
 * GamificationBanner - Shows pet soul journey progress and achievements
 * Extracted from MemberDashboard.jsx
 */

import React from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  ArrowRight, Sparkles, Trophy, CheckCircle2, Users, TrendingUp 
} from 'lucide-react';
import { getPetPhotoUrl } from '../../utils/petAvatar';
import { ACHIEVEMENTS, TIER_COLORS, RARITY_COLORS } from './AchievementSystem';

const GamificationBanner = ({ pets, orders, user, onNavigateToPet, onOpenExplainer, selectedPetId }) => {
  const safePets = Array.isArray(pets) ? pets : [];
  // Use selected pet if provided, otherwise use first pet
  const primaryPet = selectedPetId 
    ? safePets.find(p => p.id === selectedPetId) || safePets[0] || {}
    : safePets[0] || {};
  const soulScore = Math.min(100, primaryPet?.overall_score || 0);
  const questionsAnswered = Object.keys(primaryPet?.doggy_soul_answers || {}).length;
  const totalQuestions = 59;
  
  const milestones = [
    { threshold: 25, name: 'Soul Seeker', icon: '🔍', reward: 100 },
    { threshold: 50, name: 'Soul Explorer', icon: '🧭', reward: 250 },
    { threshold: 75, name: 'Soul Guardian', icon: '🛡️', reward: 500 },
    { threshold: 100, name: 'Soul Master', icon: '👑', reward: 1000 }
  ];
  
  const currentMilestone = milestones.find(m => soulScore < m.threshold) || milestones[milestones.length - 1];
  const prevMilestone = milestones.filter(m => soulScore >= m.threshold).pop();
  const progressToNext = prevMilestone 
    ? ((soulScore - prevMilestone.threshold) / (currentMilestone.threshold - prevMilestone.threshold)) * 100
    : (soulScore / currentMilestone.threshold) * 100;
  
  const questionsNeededForNext = Math.ceil((currentMilestone.threshold / 100) * totalQuestions) - questionsAnswered;
  
  const unlockedAchievements = [];
  if (questionsAnswered >= 1) unlockedAchievements.push(ACHIEVEMENTS.soul_starter);
  if (soulScore >= 25) unlockedAchievements.push(ACHIEVEMENTS.soul_seeker);
  if (soulScore >= 50) unlockedAchievements.push(ACHIEVEMENTS.soul_explorer);
  if (soulScore >= 75) unlockedAchievements.push(ACHIEVEMENTS.soul_guardian);
  if (soulScore >= 100) unlockedAchievements.push(ACHIEVEMENTS.soul_master);
  if (orders?.length >= 1) unlockedAchievements.push(ACHIEVEMENTS.first_order);
  
  const totalRewardsEarned = unlockedAchievements.reduce((sum, a) => sum + (a?.reward || 0), 0);
  
  if (!primaryPet?.id) {
    return (
      <Card className="p-6 mb-6 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 text-white border-none shadow-xl">
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🐾</div>
          <h3 className="text-xl font-bold mb-2">Add Your First Pet</h3>
          <p className="text-white/80 mb-4">Start your Pet Soul™ journey today!</p>
          <Button 
            onClick={() => window.location.href = '/my-pets'}
            className="bg-white text-purple-700 hover:bg-white/90"
          >
            Add Pet <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </Card>
    );
  }
  
  return (
    <Card className="mb-6 overflow-hidden border-none shadow-xl" data-testid="gamification-banner">
      {/* Main Banner */}
      <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 p-6 text-white relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-pink-500/10 rounded-full -ml-24 -mb-24 blur-2xl"></div>
        
        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-white/30 overflow-hidden bg-white/20">
                  {primaryPet.photo_url ? (
                    <img 
                      src={getPetPhotoUrl(primaryPet)} 
                      alt={primaryPet.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">
                      🐕
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-lg">
                  {Math.round(soulScore)}%
                </div>
              </div>
              
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2">
                  {primaryPet.name}&apos;s Soul Journey
                  {soulScore >= 100 && <span className="text-yellow-400">👑</span>}
                </h3>
                <p className="text-white/70 text-sm">
                  {questionsAnswered} of {totalQuestions} questions answered
                </p>
              </div>
            </div>
            
            <div className="hidden md:flex items-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold">{unlockedAchievements.length}</div>
                <div className="text-xs text-white/70">Badges</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">{totalRewardsEarned}</div>
                <div className="text-xs text-white/70">Points Earned</div>
              </div>
            </div>
          </div>
          
          {/* Progress Section */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{currentMilestone.icon}</span>
                <span className="font-medium">Next: {currentMilestone.name}</span>
              </div>
              <div className="text-sm text-white/70">
                +{currentMilestone.reward} Paw Points
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="relative h-4 bg-white/20 rounded-full overflow-hidden mb-2">
              <div 
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${Math.min(progressToNext, 100)}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
              </div>
              
              {milestones.map((m) => (
                <div 
                  key={m.threshold}
                  className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 transition-all ${
                    soulScore >= m.threshold 
                      ? 'bg-yellow-400 border-yellow-300 scale-110' 
                      : 'bg-white/30 border-white/50'
                  }`}
                  style={{ left: `${(m.threshold / 100) * 100}%`, transform: 'translateX(-50%) translateY(-50%)' }}
                  title={m.name}
                />
              ))}
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-white/80">
                {soulScore < 100 ? (
                  <>
                    <strong className="text-white">{Math.max(0, questionsNeededForNext)}</strong> more questions to unlock
                  </>
                ) : (
                  <span className="text-yellow-400 font-medium">🎉 Soul Master achieved!</span>
                )}
              </span>
              <span className="text-white/70">{Math.round(soulScore)}% → {currentMilestone.threshold}%</span>
            </div>
          </div>
          
          {/* CTA Buttons Row */}
          <div className="flex gap-3">
            <Button 
              onClick={() => onNavigateToPet(primaryPet.id)}
              className="flex-1 bg-white text-purple-700 hover:bg-white/90 font-semibold py-3 group"
              data-testid="continue-soul-journey-btn"
            >
              <Sparkles className="w-4 h-4 mr-2 group-hover:animate-spin" />
              {soulScore < 100 ? 'Continue Soul Journey' : 'View Complete Profile'}
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            
            <Button
              onClick={onOpenExplainer}
              variant="outline"
              className="bg-white/10 border-white/30 text-white hover:bg-white/20 font-medium"
              data-testid="soul-explainer-btn"
            >
              <span className="mr-1">✨</span>
              What is Pet Soul?
            </Button>
          </div>
        </div>
      </div>
      
      {/* Achievements Row - Pawesome Badges */}
      <div className="bg-gradient-to-r from-gray-50 to-purple-50 p-4 border-t">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-gray-800 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-500" />
            Pawesome Badges
            <span className="text-xs font-normal text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full cursor-pointer hover:bg-purple-200 transition-colors relative group">
              Earn rewards! ℹ️
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-gray-900 text-white text-xs p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                Earn badges by completing your pet&apos;s Soul Journey. Each badge unlocks Paw Points! 🎁
                <span className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></span>
              </span>
            </span>
          </h4>
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <span className="text-green-500">●</span>
            {unlockedAchievements.length} of {Object.keys(ACHIEVEMENTS).length} unlocked
          </span>
        </div>
        
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-purple-200">
          {Object.values(ACHIEVEMENTS).slice(0, 8).map((achievement) => {
            const isUnlocked = unlockedAchievements.some(a => a?.id === achievement.id);
            const tierColors = TIER_COLORS[achievement.tier] || TIER_COLORS.bronze;
            const rarityColors = RARITY_COLORS[achievement.rarity] || RARITY_COLORS.common;
            return (
              <div 
                key={achievement.id}
                className={`flex-shrink-0 transition-all cursor-pointer group relative ${
                  isUnlocked 
                    ? `transform hover:scale-105 hover:-translate-y-1` 
                    : ''
                }`}
              >
                {/* Badge Card */}
                <div className={`w-20 h-24 rounded-xl flex flex-col items-center justify-center p-2 transition-all ${
                  isUnlocked 
                    ? `${tierColors.bg} ${tierColors.border} border-2 shadow-lg ${rarityColors.glow}` 
                    : 'bg-gray-200/50 opacity-40 grayscale border border-gray-300'
                }`}>
                  {/* Icon with glow effect */}
                  <div className={`text-2xl mb-1 ${isUnlocked && achievement.rarity === 'legendary' ? 'animate-bounce' : ''}`}>
                    {achievement.icon}
                  </div>
                  {/* Badge Name */}
                  <span className={`text-[10px] font-bold text-center leading-tight ${
                    isUnlocked ? tierColors.text : 'text-gray-400'
                  }`}>
                    {achievement.name}
                  </span>
                  {/* Points */}
                  <span className={`text-[9px] mt-0.5 ${isUnlocked ? 'text-purple-600' : 'text-gray-400'}`}>
                    +{achievement.reward} pts
                  </span>
                </div>
                
                {/* Unlocked checkmark */}
                {isUnlocked && (
                  <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-0.5 shadow-lg">
                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
                
                {/* Rarity indicator */}
                {isUnlocked && (achievement.rarity === 'epic' || achievement.rarity === 'legendary') && (
                  <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase ${
                    achievement.rarity === 'legendary' 
                      ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white' 
                      : 'bg-purple-500 text-white'
                  }`}>
                    {achievement.rarity}
                  </div>
                )}
                
                {/* Enhanced tooltip */}
                <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-20 transform group-hover:translate-y-0 translate-y-2">
                  <div className="bg-white border-2 border-purple-200 rounded-2xl shadow-2xl p-4 w-56">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-3xl">{achievement.icon}</span>
                      <div>
                        <span className="font-bold text-gray-900 block">{achievement.name}</span>
                        <span className={`text-xs ${tierColors.text} font-medium`}>
                          {achievement.title || achievement.tier.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{achievement.description}</p>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-bold ${isUnlocked ? 'text-green-600' : 'text-gray-400'}`}>
                        {isUnlocked ? '✓ Unlocked!' : '🔒 Keep going!'}
                      </span>
                      <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-1 rounded-full">
                        +{achievement.reward} pts
                      </span>
                    </div>
                    {isUnlocked && achievement.unlockMessage && (
                      <div className="mt-2 bg-green-50 border border-green-200 rounded-lg p-2 text-xs text-green-700">
                        {achievement.unlockMessage}
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-r-2 border-b-2 border-purple-200 transform rotate-45"></div>
                </div>
              </div>
            );
          })}
          
          {/* More badges indicator */}
          <div 
            className="flex-shrink-0 w-20 h-24 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 border-2 border-dashed border-purple-300 flex flex-col items-center justify-center cursor-pointer hover:from-purple-200 hover:to-pink-200 transition-colors"
          >
            <span className="text-purple-600 text-lg font-bold">+{Math.max(0, Object.keys(ACHIEVEMENTS).length - 8)}</span>
            <span className="text-purple-600 text-xs">more badges</span>
            <ArrowRight className="w-4 h-4 text-purple-400 mt-1" />
          </div>
        </div>
      </div>
      
      {/* Social Proof Footer */}
      <div className="bg-purple-900 text-white/80 px-4 py-2 text-center text-xs">
        <span className="inline-flex items-center gap-1">
          <Users className="w-3 h-3" />
          <strong className="text-white">2,847</strong> pet parents completed their Soul Journey this month
          <TrendingUp className="w-3 h-3 text-green-400 ml-1" />
        </span>
      </div>
    </Card>
  );
};

export default GamificationBanner;

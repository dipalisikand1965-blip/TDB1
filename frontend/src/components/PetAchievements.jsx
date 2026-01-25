/**
 * Pet Soul Achievements & Gamification System
 * Adds badges, confetti celebrations, and streak tracking
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  Trophy, Star, Sparkles, Medal, Crown, Heart, Brain, 
  Zap, Award, Target, Flame, CheckCircle, Lock
} from 'lucide-react';
import confetti from 'canvas-confetti';

// Achievement definitions
export const ACHIEVEMENTS = {
  // Tier Achievements (auto-unlock when tier reached)
  first_answer: {
    id: 'first_answer',
    name: 'First Steps',
    description: 'Answered your first Pet Soul question',
    icon: '🌱',
    color: 'from-green-400 to-emerald-500',
    points: 10,
    type: 'milestone'
  },
  soul_seeker_unlocked: {
    id: 'soul_seeker_unlocked',
    name: 'Soul Seeker',
    description: 'Reached 25% completion - Mira now remembers your pet!',
    icon: '🔍',
    color: 'from-blue-400 to-indigo-500',
    points: 50,
    type: 'tier'
  },
  soul_explorer_unlocked: {
    id: 'soul_explorer_unlocked',
    name: 'Soul Explorer',
    description: 'Reached 50% - Smart safety alerts unlocked!',
    icon: '🗺️',
    color: 'from-purple-400 to-pink-500',
    points: 100,
    type: 'tier'
  },
  soul_master_unlocked: {
    id: 'soul_master_unlocked',
    name: 'Soul Master',
    description: 'Reached 75% - VIP concierge experience!',
    icon: '✨',
    color: 'from-amber-400 to-yellow-500',
    points: 200,
    type: 'tier'
  },
  pet_soul_complete: {
    id: 'pet_soul_complete',
    name: 'Pet Soul Complete',
    description: 'Answered all Pet Soul questions - You truly know your pet!',
    icon: '🏆',
    color: 'from-yellow-400 to-orange-500',
    points: 500,
    type: 'tier'
  },
  
  // Category Achievements
  safety_first: {
    id: 'safety_first',
    name: 'Safety First',
    description: 'Completed all Safety & Health questions',
    icon: '🛡️',
    color: 'from-red-400 to-rose-500',
    points: 75,
    type: 'category',
    category: 'safety'
  },
  personality_pro: {
    id: 'personality_pro',
    name: 'Personality Pro',
    description: 'Completed all Personality questions',
    icon: '🎭',
    color: 'from-purple-400 to-violet-500',
    points: 75,
    type: 'category',
    category: 'personality'
  },
  lifestyle_guru: {
    id: 'lifestyle_guru',
    name: 'Lifestyle Guru',
    description: 'Completed all Lifestyle questions',
    icon: '🏠',
    color: 'from-blue-400 to-cyan-500',
    points: 60,
    type: 'category',
    category: 'lifestyle'
  },
  nutrition_ninja: {
    id: 'nutrition_ninja',
    name: 'Nutrition Ninja',
    description: 'Completed all Nutrition questions',
    icon: '🍖',
    color: 'from-orange-400 to-amber-500',
    points: 40,
    type: 'category',
    category: 'nutrition'
  },
  training_expert: {
    id: 'training_expert',
    name: 'Training Expert',
    description: 'Completed all Training questions',
    icon: '🎓',
    color: 'from-green-400 to-teal-500',
    points: 30,
    type: 'category',
    category: 'training'
  },
  
  // Streak Achievements
  three_day_streak: {
    id: 'three_day_streak',
    name: 'Getting Started',
    description: '3-day answer streak!',
    icon: '🔥',
    color: 'from-orange-400 to-red-500',
    points: 25,
    type: 'streak',
    streak: 3
  },
  seven_day_streak: {
    id: 'seven_day_streak',
    name: 'On Fire',
    description: '7-day answer streak!',
    icon: '⚡',
    color: 'from-yellow-400 to-orange-500',
    points: 50,
    type: 'streak',
    streak: 7
  },
  
  // Special Achievements
  photo_uploaded: {
    id: 'photo_uploaded',
    name: 'Picture Perfect',
    description: 'Uploaded a photo of your pet',
    icon: '📸',
    color: 'from-pink-400 to-rose-500',
    points: 20,
    type: 'special'
  },
  allergy_aware: {
    id: 'allergy_aware',
    name: 'Allergy Aware',
    description: 'Added food allergy information',
    icon: '⚕️',
    color: 'from-red-400 to-pink-500',
    points: 30,
    type: 'special'
  }
};

// Confetti celebration function
export const celebrateAchievement = (achievementType = 'default') => {
  const colors = {
    tier: ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981'],
    category: ['#3b82f6', '#8b5cf6', '#06b6d4'],
    streak: ['#f97316', '#ef4444', '#facc15'],
    default: ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b']
  };

  const selectedColors = colors[achievementType] || colors.default;

  // Main burst
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: selectedColors
  });

  // Side bursts with delay
  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: selectedColors
    });
  }, 150);

  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: selectedColors
    });
  }, 300);
};

// Achievement Badge Component
export const AchievementBadge = ({ achievement, unlocked = false, size = 'md', onClick }) => {
  const sizeConfig = {
    sm: { container: 'w-12 h-12', icon: 'text-xl', text: 'text-[10px]' },
    md: { container: 'w-16 h-16', icon: 'text-2xl', text: 'text-xs' },
    lg: { container: 'w-24 h-24', icon: 'text-4xl', text: 'text-sm' }
  };
  
  const config = sizeConfig[size] || sizeConfig.md;
  
  return (
    <div 
      className={`relative group cursor-pointer ${onClick ? '' : 'cursor-default'}`}
      onClick={onClick}
      title={achievement.description}
    >
      <div className={`${config.container} rounded-full flex items-center justify-center transition-all ${
        unlocked 
          ? `bg-gradient-to-br ${achievement.color} shadow-lg hover:scale-110` 
          : 'bg-gray-200 grayscale opacity-50'
      }`}>
        <span className={config.icon}>{achievement.icon}</span>
        {!unlocked && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Lock className="w-4 h-4 text-gray-400" />
          </div>
        )}
      </div>
      {unlocked && (
        <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-0.5">
          <CheckCircle className="w-3 h-3 text-white" />
        </div>
      )}
    </div>
  );
};

// Achievement Notification Toast
export const AchievementToast = ({ achievement, onClose }) => {
  useEffect(() => {
    celebrateAchievement(achievement.type);
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [achievement, onClose]);

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-bounce-in">
      <Card className={`p-4 bg-gradient-to-r ${achievement.color} text-white shadow-2xl min-w-[300px]`}>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-3xl">
            {achievement.icon}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="w-4 h-4" />
              <span className="text-sm font-medium opacity-90">Achievement Unlocked!</span>
            </div>
            <h3 className="font-bold text-lg">{achievement.name}</h3>
            <p className="text-sm opacity-90">{achievement.description}</p>
            <Badge className="mt-2 bg-white/20">+{achievement.points} points</Badge>
          </div>
        </div>
      </Card>
    </div>
  );
};

// Achievements Grid Component
export const AchievementsGrid = ({ unlockedAchievements = [], petName = 'Your pet' }) => {
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  
  const tierAchievements = Object.values(ACHIEVEMENTS).filter(a => a.type === 'tier');
  const categoryAchievements = Object.values(ACHIEVEMENTS).filter(a => a.type === 'category');
  const specialAchievements = Object.values(ACHIEVEMENTS).filter(a => ['streak', 'special'].includes(a.type));
  
  const isUnlocked = (achievementId) => unlockedAchievements.includes(achievementId);
  const unlockedCount = unlockedAchievements.length;
  const totalCount = Object.keys(ACHIEVEMENTS).length;
  const totalPoints = unlockedAchievements.reduce((sum, id) => {
    const achievement = ACHIEVEMENTS[id];
    return sum + (achievement?.points || 0);
  }, 0);

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">{petName}'s Achievements</h3>
            <p className="text-sm text-gray-500">{unlockedCount}/{totalCount} unlocked</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-amber-600">{totalPoints}</div>
          <p className="text-xs text-gray-500">total points</p>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-amber-400 to-orange-500 h-2 rounded-full transition-all"
            style={{ width: `${(unlockedCount / totalCount) * 100}%` }}
          />
        </div>
      </div>
      
      {/* Tier Achievements */}
      <div className="mb-6">
        <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Crown className="w-4 h-4 text-amber-500" />
          Tier Achievements
        </h4>
        <div className="flex flex-wrap gap-3">
          {tierAchievements.map((achievement) => (
            <AchievementBadge
              key={achievement.id}
              achievement={achievement}
              unlocked={isUnlocked(achievement.id)}
              onClick={() => setSelectedAchievement(achievement)}
            />
          ))}
        </div>
      </div>
      
      {/* Category Achievements */}
      <div className="mb-6">
        <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Star className="w-4 h-4 text-purple-500" />
          Category Mastery
        </h4>
        <div className="flex flex-wrap gap-3">
          {categoryAchievements.map((achievement) => (
            <AchievementBadge
              key={achievement.id}
              achievement={achievement}
              unlocked={isUnlocked(achievement.id)}
              onClick={() => setSelectedAchievement(achievement)}
            />
          ))}
        </div>
      </div>
      
      {/* Special Achievements */}
      <div>
        <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-pink-500" />
          Special & Streaks
        </h4>
        <div className="flex flex-wrap gap-3">
          {specialAchievements.map((achievement) => (
            <AchievementBadge
              key={achievement.id}
              achievement={achievement}
              unlocked={isUnlocked(achievement.id)}
              onClick={() => setSelectedAchievement(achievement)}
            />
          ))}
        </div>
      </div>
      
      {/* Selected Achievement Detail */}
      {selectedAchievement && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">{selectedAchievement.icon}</span>
            <div>
              <h4 className="font-bold text-gray-900">{selectedAchievement.name}</h4>
              <p className="text-sm text-gray-600">{selectedAchievement.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={`bg-gradient-to-r ${selectedAchievement.color} text-white`}>
              +{selectedAchievement.points} points
            </Badge>
            {isUnlocked(selectedAchievement.id) ? (
              <Badge className="bg-green-100 text-green-700">
                <CheckCircle className="w-3 h-3 mr-1" /> Unlocked
              </Badge>
            ) : (
              <Badge className="bg-gray-100 text-gray-500">
                <Lock className="w-3 h-3 mr-1" /> Locked
              </Badge>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};

// Hook to check and trigger achievements
export const useAchievements = (scoreState, pet) => {
  const [newAchievement, setNewAchievement] = useState(null);
  const [unlockedAchievements, setUnlockedAchievements] = useState([]);
  
  useEffect(() => {
    if (!scoreState || !pet) return;
    
    const newlyUnlocked = [];
    const currentUnlocked = pet.achievements || [];
    
    // Check tier achievements
    const score = scoreState.score || 0;
    const stats = scoreState.stats || {};
    
    if (stats.answered >= 1 && !currentUnlocked.includes('first_answer')) {
      newlyUnlocked.push('first_answer');
    }
    if (score >= 25 && !currentUnlocked.includes('soul_seeker_unlocked')) {
      newlyUnlocked.push('soul_seeker_unlocked');
    }
    if (score >= 50 && !currentUnlocked.includes('soul_explorer_unlocked')) {
      newlyUnlocked.push('soul_explorer_unlocked');
    }
    if (score >= 75 && !currentUnlocked.includes('soul_master_unlocked')) {
      newlyUnlocked.push('soul_master_unlocked');
    }
    if (score >= 100 && !currentUnlocked.includes('pet_soul_complete')) {
      newlyUnlocked.push('pet_soul_complete');
    }
    
    // Check category achievements
    const categories = scoreState.categories || {};
    if (categories.safety?.percentage >= 100 && !currentUnlocked.includes('safety_first')) {
      newlyUnlocked.push('safety_first');
    }
    if (categories.personality?.percentage >= 100 && !currentUnlocked.includes('personality_pro')) {
      newlyUnlocked.push('personality_pro');
    }
    if (categories.lifestyle?.percentage >= 100 && !currentUnlocked.includes('lifestyle_guru')) {
      newlyUnlocked.push('lifestyle_guru');
    }
    if (categories.nutrition?.percentage >= 100 && !currentUnlocked.includes('nutrition_ninja')) {
      newlyUnlocked.push('nutrition_ninja');
    }
    if (categories.training?.percentage >= 100 && !currentUnlocked.includes('training_expert')) {
      newlyUnlocked.push('training_expert');
    }
    
    // Check photo achievement
    if (pet.photo_url && !currentUnlocked.includes('photo_uploaded')) {
      newlyUnlocked.push('photo_uploaded');
    }
    
    // Check allergy achievement
    const answers = pet.doggy_soul_answers || {};
    if (answers.food_allergies && !currentUnlocked.includes('allergy_aware')) {
      newlyUnlocked.push('allergy_aware');
    }
    
    // Update state
    setUnlockedAchievements([...currentUnlocked, ...newlyUnlocked]);
    
    // Show notification for first new achievement
    if (newlyUnlocked.length > 0) {
      const firstNew = ACHIEVEMENTS[newlyUnlocked[0]];
      if (firstNew) {
        setNewAchievement(firstNew);
      }
    }
  }, [scoreState, pet]);
  
  const dismissAchievement = useCallback(() => {
    setNewAchievement(null);
  }, []);
  
  return {
    newAchievement,
    dismissAchievement,
    unlockedAchievements,
    totalPoints: unlockedAchievements.reduce((sum, id) => {
      const achievement = ACHIEVEMENTS[id];
      return sum + (achievement?.points || 0);
    }, 0)
  };
};

export default AchievementsGrid;

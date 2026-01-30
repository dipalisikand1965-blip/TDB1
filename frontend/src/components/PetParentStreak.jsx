/**
 * PetParentStreak - Gamification streak tracker
 * Shows daily streak progress and rewards
 */

import React, { useState, useEffect } from 'react';
import { Flame, Gift, Trophy, Calendar, ChevronRight, Loader2, Star } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { getApiUrl } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const PetParentStreak = ({ userId, compact = false }) => {
  const { token } = useAuth();
  const [streakData, setStreakData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchStreak();
    }
  }, [userId]);

  const fetchStreak = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/api/engagement/streak/${userId}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (response.ok) {
        const data = await response.json();
        setStreakData(data);
      }
    } catch (error) {
      console.error('Error fetching streak:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return compact ? (
      <div className="flex items-center gap-2 bg-orange-50 rounded-lg px-3 py-2">
        <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
      </div>
    ) : (
      <Card className="p-4 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
      </Card>
    );
  }

  if (!streakData) return null;

  const currentStreak = streakData.current_streak || 0;
  const longestStreak = streakData.longest_streak || 0;
  const nextReward = streakData.next_reward;
  const daysUntilReward = streakData.days_until_next_reward;

  // Compact version for dashboard header
  if (compact) {
    return (
      <div 
        className={`flex items-center gap-2 rounded-xl px-3 py-2 cursor-pointer transition-all hover:scale-105 ${
          currentStreak > 0 
            ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white' 
            : 'bg-gray-100 text-gray-600'
        }`}
        onClick={() => toast.info(`${currentStreak} day streak! Keep it going 🔥`)}
      >
        <Flame className={`w-4 h-4 ${currentStreak > 0 ? 'animate-pulse' : ''}`} />
        <span className="font-bold text-sm">{currentStreak}</span>
        <span className="text-xs opacity-80">day{currentStreak !== 1 ? 's' : ''}</span>
      </div>
    );
  }

  // Full version for streak detail view
  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Flame className="w-7 h-7 animate-pulse" />
            </div>
            <div>
              <p className="text-sm opacity-80">Current Streak</p>
              <p className="text-3xl font-bold">{currentStreak} day{currentStreak !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs opacity-80">Best: {longestStreak} days</p>
            <div className="flex items-center gap-1 mt-1">
              <Trophy className="w-4 h-4" />
              <span className="text-sm font-semibold">#{longestStreak > 30 ? 'Legend' : longestStreak > 7 ? 'Pro' : 'Rising'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress to next reward */}
      {nextReward && (
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Next Reward</span>
            <span className="text-sm font-medium text-purple-600">
              {daysUntilReward} day{daysUntilReward !== 1 ? 's' : ''} away
            </span>
          </div>
          
          {/* Progress bar */}
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-500"
              style={{ width: `${(currentStreak / nextReward.days) * 100}%` }}
            />
          </div>
          
          {/* Reward preview */}
          <div className="mt-3 flex items-center justify-between bg-amber-50 rounded-lg p-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{nextReward.icon || '🎁'}</span>
              <div>
                <p className="font-semibold text-gray-900">{nextReward.badge}</p>
                <p className="text-xs text-gray-500">{nextReward.days} day streak</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-amber-600 font-bold">
              <Gift className="w-4 h-4" />
              <span>+{nextReward.points}</span>
            </div>
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="p-4 bg-gray-50">
        <p className="text-xs text-gray-500 mb-2">Keep your streak alive by:</p>
        <div className="flex flex-wrap gap-2">
          {['Shopping', 'Updating pet', 'Chatting with Mira', 'Booking services'].map((action) => (
            <span key={action} className="text-xs bg-white border rounded-full px-2 py-1 text-gray-600">
              {action}
            </span>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default PetParentStreak;

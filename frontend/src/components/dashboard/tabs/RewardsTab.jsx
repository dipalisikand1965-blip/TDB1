import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Gift, Star, Zap, Trophy, Award, Target, Sparkles } from 'lucide-react';

const RewardsTab = ({ 
  user, 
  pets,
  orders,
  achievements,
  setShowPawPointsBreakdown
}) => {
  const navigate = useNavigate();
  
  // Calculate metrics
  const totalPawPoints = user?.loyalty_points || 0;
  const totalSpent = orders.reduce((acc, o) => acc + (o.total || 0), 0);
  const completedAchievements = achievements?.filter(a => a.unlocked_at)?.length || 0;
  
  // Define tier thresholds
  const tierThresholds = {
    pup: 0,
    good_boi: 250,
    pawfect: 750,
    legend: 1500
  };
  
  // Determine current tier
  const getCurrentTier = (points) => {
    if (points >= tierThresholds.legend) return { name: 'Legend Pup', color: 'from-purple-500 to-pink-500', icon: '👑', next: null, nextPoints: null };
    if (points >= tierThresholds.pawfect) return { name: 'Pawfect', color: 'from-pink-500 to-rose-500', icon: '⭐', next: 'Legend Pup', nextPoints: tierThresholds.legend };
    if (points >= tierThresholds.good_boi) return { name: 'Good Boi', color: 'from-amber-500 to-orange-500', icon: '🎖️', next: 'Pawfect', nextPoints: tierThresholds.pawfect };
    return { name: 'Curious Pup', color: 'from-green-500 to-teal-500', icon: '🐕', next: 'Good Boi', nextPoints: tierThresholds.good_boi };
  };
  
  const currentTier = getCurrentTier(totalPawPoints);
  const progressToNext = currentTier.nextPoints 
    ? Math.min(100, ((totalPawPoints - (tierThresholds[Object.keys(tierThresholds).find(k => tierThresholds[k] === currentTier.nextPoints - (currentTier.nextPoints === tierThresholds.legend ? 750 : currentTier.nextPoints === tierThresholds.pawfect ? 500 : 250))] || 0)) / (currentTier.nextPoints - (tierThresholds[Object.keys(tierThresholds).find(k => tierThresholds[k] === currentTier.nextPoints - (currentTier.nextPoints === tierThresholds.legend ? 750 : currentTier.nextPoints === tierThresholds.pawfect ? 500 : 250))] || 0))) * 100)
    : 100;

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in-50 duration-300" data-testid="rewards-tab">
      {/* Paw Points Overview Card */}
      <Card className={`p-4 sm:p-6 bg-gradient-to-br ${currentTier.color} text-white shadow-xl relative overflow-hidden rounded-2xl`}>
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
            <div>
              <p className="text-sm opacity-90 mb-1">Paw Points Balance</p>
              <h2 className="text-3xl sm:text-4xl font-bold">{totalPawPoints.toLocaleString()}</h2>
            </div>
            <div className="flex sm:flex-col items-center gap-2 sm:text-center">
              <span className="text-3xl sm:text-4xl">{currentTier.icon}</span>
              <Badge className="bg-white/20 text-white border-none">{currentTier.name}</Badge>
            </div>
          </div>
          
          {currentTier.next && (
            <div className="mt-4">
              <div className="flex justify-between text-xs sm:text-sm mb-1">
                <span>Progress to {currentTier.next}</span>
                <span>{currentTier.nextPoints - totalPawPoints} points to go</span>
              </div>
              <div className="h-2 bg-white/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white rounded-full transition-all duration-500"
                  style={{ width: `${progressToNext}%` }}
                />
              </div>
            </div>
          )}
          
          <div className="mt-4 flex flex-wrap gap-2 sm:gap-3">
            <Button 
              variant="outline" 
              size="sm"
              className="bg-white/20 border-white/30 text-white hover:bg-white/30"
              onClick={() => setShowPawPointsBreakdown(true)}
            >
              View History
            </Button>
            <Button 
              size="sm"
              className="bg-white text-purple-600 hover:bg-white/90"
              onClick={() => navigate('/rewards')}
            >
              <Gift className="w-4 h-4 mr-1" /> Redeem
            </Button>
          </div>
        </div>
      </Card>
      
      {/* Stats Grid - 2x2 on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { icon: Gift, color: 'text-purple-400', value: totalPawPoints, label: 'Total Points' },
          { icon: Star, color: 'text-amber-400', value: orders.length, label: 'Orders Placed' },
          { icon: Zap, color: 'text-pink-400', value: `₹${totalSpent.toLocaleString()}`, label: 'Total Spent' },
          { icon: Trophy, color: 'text-emerald-400', value: completedAchievements, label: 'Achievements' },
        ].map((stat, idx) => (
          <Card key={idx} className="p-3 sm:p-4 text-center bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-xl">
            <stat.icon className={`w-5 h-5 sm:w-6 sm:h-6 mx-auto ${stat.color} mb-2`} />
            <p className="text-xl sm:text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-[10px] sm:text-xs text-slate-400">{stat.label}</p>
          </Card>
        ))}
      </div>
      
      {/* Ways to Earn */}
      <Card className="p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl">
        <h3 className="font-bold text-white mb-4 flex items-center gap-2 text-base sm:text-lg">
          <Target className="w-5 h-5 text-purple-400" />
          Ways to Earn Paw Points
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
          {[
            { action: 'Make a purchase', points: '1 point per ₹10', icon: '🛒' },
            { action: 'Complete Pet Soul™', points: '100 points', icon: '✨' },
            { action: 'Write a review', points: '25 points', icon: '⭐' },
            { action: 'Refer a friend', points: '200 points', icon: '👥' },
            { action: 'Birthday bonus', points: '2x points', icon: '🎂' },
            { action: 'Share on social', points: '50 points', icon: '📱' }
          ].map((way, idx) => (
            <div key={idx} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl">
              <span className="text-xl sm:text-2xl flex-shrink-0">{way.icon}</span>
              <div className="min-w-0">
                <p className="font-medium text-white text-sm truncate">{way.action}</p>
                <p className="text-xs text-purple-400">{way.points}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
      
      {/* Tier Benefits */}
      <Card className="p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl">
        <h3 className="font-bold text-white mb-4 flex items-center gap-2 text-base sm:text-lg">
          <Award className="w-5 h-5 text-purple-400" />
          Tier Benefits
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            { tier: 'Curious Pup', points: '0-249', benefits: ['5% off orders', 'Birthday treat'], color: 'from-green-500 to-teal-500', icon: '🐕' },
            { tier: 'Good Boi', points: '250-749', benefits: ['10% off orders', 'Free shipping', 'Early access'], color: 'from-amber-500 to-orange-500', icon: '🎖️' },
            { tier: 'Pawfect', points: '750-1499', benefits: ['15% off orders', 'Priority support', 'Exclusive items'], color: 'from-pink-500 to-rose-500', icon: '⭐' },
            { tier: 'Legend Pup', points: '1500+', benefits: ['20% off orders', 'VIP events', 'Personal concierge®'], color: 'from-purple-500 to-pink-500', icon: '👑' }
          ].map((tierInfo) => (
            <div 
              key={tierInfo.tier} 
              className={`p-3 sm:p-4 rounded-xl border ${currentTier.name === tierInfo.tier 
                ? 'border-purple-500/50 bg-purple-500/10' 
                : 'border-white/10 bg-slate-800/30'}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl sm:text-2xl">{tierInfo.icon}</span>
                <div className="min-w-0">
                  <p className="font-semibold text-white text-sm truncate">{tierInfo.tier}</p>
                  <p className="text-xs text-slate-400">{tierInfo.points} pts</p>
                </div>
              </div>
              <ul className="space-y-1">
                {tierInfo.benefits.map((b, i) => (
                  <li key={i} className="text-xs text-slate-300 flex items-center gap-1.5">
                    <span className="w-1 h-1 bg-purple-400 rounded-full flex-shrink-0" /> 
                    <span className="truncate">{b}</span>
                  </li>
                ))}
              </ul>
              {currentTier.name === tierInfo.tier && (
                <Badge className="mt-2 bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs">
                  <Sparkles className="w-3 h-3 mr-1" /> Current
                </Badge>
              )}
            </div>
          ))}
        </div>
      </Card>
      
      {/* Achievements */}
      {achievements && achievements.length > 0 && (
        <Card className="p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2 text-base sm:text-lg">
            <Trophy className="w-5 h-5 text-amber-400" />
            Achievements
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {achievements.slice(0, 6).map((achievement) => (
              <div 
                key={achievement.id || achievement.name}
                className={`p-3 sm:p-4 rounded-xl border ${achievement.unlocked_at 
                  ? 'bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30' 
                  : 'bg-slate-800/30 border-white/5 opacity-60'}`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl sm:text-2xl flex-shrink-0">{achievement.icon || '🏆'}</span>
                  <div className="min-w-0">
                    <p className="font-medium text-white text-sm truncate">{achievement.name}</p>
                    <p className="text-xs text-slate-400 line-clamp-2">{achievement.description}</p>
                    {achievement.unlocked_at ? (
                      <Badge className="mt-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs">Unlocked!</Badge>
                    ) : (
                      <Badge variant="outline" className="mt-2 text-xs text-slate-500 border-slate-600">Locked</Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default RewardsTab;

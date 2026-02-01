import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Gift, Star, Zap, Trophy, Award, Target } from 'lucide-react';

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
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* Paw Points Overview Card */}
      <Card className={`p-6 bg-gradient-to-br ${currentTier.color} text-white shadow-xl relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm opacity-90 mb-1">Paw Points Balance</p>
              <h2 className="text-4xl font-bold">{totalPawPoints.toLocaleString()}</h2>
            </div>
            <div className="text-center">
              <span className="text-4xl">{currentTier.icon}</span>
              <Badge className="mt-2 bg-white/20 text-white border-none">{currentTier.name}</Badge>
            </div>
          </div>
          
          {currentTier.next && (
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
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
          
          <div className="mt-4 flex gap-3">
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
      
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <Gift className="w-6 h-6 mx-auto text-purple-500 mb-2" />
          <p className="text-2xl font-bold text-gray-900">{totalPawPoints}</p>
          <p className="text-xs text-gray-500">Total Points</p>
        </Card>
        <Card className="p-4 text-center">
          <Star className="w-6 h-6 mx-auto text-amber-500 mb-2" />
          <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
          <p className="text-xs text-gray-500">Orders Placed</p>
        </Card>
        <Card className="p-4 text-center">
          <Zap className="w-6 h-6 mx-auto text-pink-500 mb-2" />
          <p className="text-2xl font-bold text-gray-900">₹{totalSpent.toLocaleString()}</p>
          <p className="text-xs text-gray-500">Total Spent</p>
        </Card>
        <Card className="p-4 text-center">
          <Trophy className="w-6 h-6 mx-auto text-green-500 mb-2" />
          <p className="text-2xl font-bold text-gray-900">{completedAchievements}</p>
          <p className="text-xs text-gray-500">Achievements</p>
        </Card>
      </div>
      
      {/* Ways to Earn */}
      <Card className="p-6">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-purple-600" />
          Ways to Earn Paw Points
        </h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { action: 'Make a purchase', points: '1 point per ₹10', icon: '🛒' },
            { action: 'Complete Pet Soul™', points: '100 points', icon: '✨' },
            { action: 'Write a review', points: '25 points', icon: '⭐' },
            { action: 'Refer a friend', points: '200 points', icon: '👥' },
            { action: 'Birthday bonus', points: '2x points', icon: '🎂' },
            { action: 'Share on social', points: '50 points', icon: '📱' }
          ].map((way, idx) => (
            <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-2xl">{way.icon}</span>
              <div>
                <p className="font-medium text-gray-900">{way.action}</p>
                <p className="text-sm text-purple-600">{way.points}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
      
      {/* Tier Benefits */}
      <Card className="p-6">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-purple-600" />
          Tier Benefits
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { tier: 'Curious Pup', points: '0-249', benefits: ['5% off orders', 'Birthday treat'], color: 'from-green-500 to-teal-500', icon: '🐕' },
            { tier: 'Good Boi', points: '250-749', benefits: ['10% off orders', 'Free shipping', 'Early access'], color: 'from-amber-500 to-orange-500', icon: '🎖️' },
            { tier: 'Pawfect', points: '750-1499', benefits: ['15% off orders', 'Priority support', 'Exclusive items'], color: 'from-pink-500 to-rose-500', icon: '⭐' },
            { tier: 'Legend Pup', points: '1500+', benefits: ['20% off orders', 'VIP events', 'Personal concierge'], color: 'from-purple-500 to-pink-500', icon: '👑' }
          ].map((tierInfo) => (
            <div 
              key={tierInfo.tier} 
              className={`p-4 rounded-xl border-2 ${currentTier.name === tierInfo.tier ? 'border-purple-400 bg-purple-50' : 'border-gray-200 bg-white'}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{tierInfo.icon}</span>
                <div>
                  <p className="font-semibold text-gray-900">{tierInfo.tier}</p>
                  <p className="text-xs text-gray-500">{tierInfo.points} pts</p>
                </div>
              </div>
              <ul className="space-y-1">
                {tierInfo.benefits.map((b, i) => (
                  <li key={i} className="text-xs text-gray-600 flex items-center gap-1">
                    <span className="w-1 h-1 bg-purple-400 rounded-full" /> {b}
                  </li>
                ))}
              </ul>
              {currentTier.name === tierInfo.tier && (
                <Badge className="mt-2 bg-purple-100 text-purple-700 text-xs">Current Tier</Badge>
              )}
            </div>
          ))}
        </div>
      </Card>
      
      {/* Achievements */}
      {achievements && achievements.length > 0 && (
        <Card className="p-6">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            Achievements
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {achievements.slice(0, 6).map((achievement) => (
              <div 
                key={achievement.id || achievement.name}
                className={`p-4 rounded-lg border ${achievement.unlocked_at ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200' : 'bg-gray-50 border-gray-200 opacity-60'}`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{achievement.icon || '🏆'}</span>
                  <div>
                    <p className="font-medium text-gray-900">{achievement.name}</p>
                    <p className="text-xs text-gray-500">{achievement.description}</p>
                    {achievement.unlocked_at ? (
                      <Badge className="mt-2 bg-green-100 text-green-700 text-xs">Unlocked!</Badge>
                    ) : (
                      <Badge variant="outline" className="mt-2 text-xs text-gray-500">Locked</Badge>
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

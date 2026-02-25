import React, { useState } from 'react';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Gift, Star, Zap, Trophy, Award, Target, Sparkles, ShoppingBag, Percent, Ticket, Coffee, X } from 'lucide-react';
import { toast } from '../../../hooks/use-toast';

const RewardsTab = ({ 
  user, 
  pets,
  orders,
  achievements,
  setShowPawPointsBreakdown
}) => {
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  
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

  // Redemption rewards
  const redeemableRewards = [
    { id: 1, name: '₹100 Off Next Order', points: 100, icon: <Percent className="w-6 h-6" />, color: 'from-emerald-500 to-teal-500', description: 'Get ₹100 discount on any order above ₹500' },
    { id: 2, name: '₹250 Off Next Order', points: 225, icon: <Percent className="w-6 h-6" />, color: 'from-blue-500 to-indigo-500', description: 'Get ₹250 discount on any order above ₹1000' },
    { id: 3, name: 'Free Grooming Session', points: 500, icon: <Sparkles className="w-6 h-6" />, color: 'from-purple-500 to-pink-500', description: 'One free basic grooming session for your pet' },
    { id: 4, name: 'Premium Treat Box', points: 300, icon: <Gift className="w-6 h-6" />, color: 'from-amber-500 to-orange-500', description: 'Curated box of premium treats for your furry friend' },
    { id: 5, name: 'Free Vet Consultation', points: 400, icon: <Coffee className="w-6 h-6" />, color: 'from-rose-500 to-pink-500', description: '30-minute online consultation with our partner vets' },
    { id: 6, name: 'Birthday Party Add-on', points: 350, icon: <Ticket className="w-6 h-6" />, color: 'from-violet-500 to-purple-500', description: 'Extra treats and decorations for birthday celebration' },
  ];

  const handleRedeem = (reward) => {
    if (totalPawPoints < reward.points) {
      toast({ 
        title: 'Not enough points', 
        description: `You need ${reward.points - totalPawPoints} more points to redeem this reward.`,
        variant: 'destructive'
      });
      return;
    }
    // In real app, this would call API to redeem
    toast({ 
      title: '🎉 Reward Redeemed!', 
      description: `${reward.name} has been added to your account. Use it on your next order!`
    });
    setShowRedeemModal(false);
  };

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
              onClick={() => setShowRedeemModal(true)}
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

      {/* Redeem Rewards Modal */}
      <Dialog open={showRedeemModal} onOpenChange={setShowRedeemModal}>
        <DialogContent className="bg-slate-900 border border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2 text-xl">
              <Gift className="w-6 h-6 text-purple-400" />
              Redeem Paw Points
            </DialogTitle>
          </DialogHeader>
          
          {/* Points Balance */}
          <div className="p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-500/30 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Available Balance</p>
                <p className="text-3xl font-bold text-white">{totalPawPoints.toLocaleString()} <span className="text-lg text-purple-400">pts</span></p>
              </div>
              <div className="text-4xl">{currentTier.icon}</div>
            </div>
          </div>
          
          {/* Rewards Grid */}
          <div className="space-y-3">
            <p className="text-sm text-slate-400">Choose a reward to redeem:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {redeemableRewards.map((reward) => {
                const canRedeem = totalPawPoints >= reward.points;
                return (
                  <div 
                    key={reward.id}
                    className={`p-4 rounded-xl border transition-all ${
                      canRedeem 
                        ? 'bg-slate-800/50 border-white/10 hover:border-purple-500/30 cursor-pointer' 
                        : 'bg-slate-800/30 border-white/5 opacity-50'
                    }`}
                    onClick={() => canRedeem && handleRedeem(reward)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${reward.color} flex items-center justify-center text-white flex-shrink-0`}>
                        {reward.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white text-sm">{reward.name}</p>
                        <p className="text-xs text-slate-400 line-clamp-2 mb-2">{reward.description}</p>
                        <div className="flex items-center justify-between">
                          <Badge className={`${canRedeem ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' : 'bg-slate-700 text-slate-500 border-slate-600'}`}>
                            {reward.points} pts
                          </Badge>
                          {canRedeem ? (
                            <Button size="sm" className="h-7 px-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs">
                              Redeem
                            </Button>
                          ) : (
                            <span className="text-xs text-slate-500">Need {reward.points - totalPawPoints} more</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Close Button */}
          <div className="flex justify-end mt-4 pt-4 border-t border-white/10">
            <Button variant="outline" onClick={() => setShowRedeemModal(false)} className="border-white/10 text-white hover:bg-slate-800">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RewardsTab;

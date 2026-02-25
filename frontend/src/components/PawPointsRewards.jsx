/**
 * PawPointsRewards Component
 * Beautiful rewards catalog and redemption UI
 */

import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Gift, Trophy, Star, Sparkles, ShoppingBag, Scissors, Cake, 
  Zap, Clock, Crown, ChevronRight, Check, Lock, TrendingUp,
  Award, Medal, History, Wallet
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { toast } from '../hooks/use-toast';
import { API_URL } from '../utils/api';
import confetti from 'canvas-confetti';

const TIER_COLORS = {
  bronze: 'from-amber-600 to-amber-400',
  silver: 'from-gray-400 to-gray-300', 
  gold: 'from-yellow-500 to-yellow-300',
  platinum: 'from-purple-600 to-pink-500'
};

const TIER_ICONS = {
  bronze: '🥉',
  silver: '🥈',
  gold: '🥇',
  platinum: '👑'
};

const CATEGORY_ICONS = {
  discount: <ShoppingBag className="w-5 h-5" />,
  free_item: <Gift className="w-5 h-5" />,
  experience: <Sparkles className="w-5 h-5" />,
  exclusive: <Crown className="w-5 h-5" />
};

const PawPointsRewards = ({ token, onPointsChange }) => {
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(null);
  const [catalog, setCatalog] = useState([]);
  const [redemptions, setRedemptions] = useState({ active: [], used: [], expired: [] });
  const [waysToEarn, setWaysToEarn] = useState([]);
  const [selectedReward, setSelectedReward] = useState(null);
  const [redeeming, setRedeeming] = useState(false);
  const [activeTab, setActiveTab] = useState('catalog'); // catalog, history, earn
  
  useEffect(() => {
    fetchData();
  }, [token]);
  
  const fetchData = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const [balanceRes, catalogRes, redemptionsRes, earnRes] = await Promise.all([
        fetch(`${API_URL}/api/paw-points/balance`, { headers }),
        fetch(`${API_URL}/api/paw-points/catalog`, { headers }),
        fetch(`${API_URL}/api/paw-points/redemptions`, { headers }),
        fetch(`${API_URL}/api/paw-points/ways-to-earn`, { headers })
      ]);
      
      if (balanceRes.ok) setBalance(await balanceRes.json());
      if (catalogRes.ok) setCatalog((await catalogRes.json()).rewards || []);
      if (redemptionsRes.ok) setRedemptions(await redemptionsRes.json());
      if (earnRes.ok) setWaysToEarn((await earnRes.json()).ways_to_earn || []);
    } catch (err) {
      console.error('Failed to fetch paw points data:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleRedeem = async (reward) => {
    setRedeeming(true);
    try {
      const response = await fetch(`${API_URL}/api/paw-points/redeem`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reward_id: reward.id })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Celebration!
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#9333ea', '#ec4899', '#f59e0b']
        });
        
        toast({
          title: '🎉 Reward Redeemed!',
          description: `Your code: ${data.redemption_code}`,
          duration: 8000
        });
        
        setSelectedReward(null);
        fetchData();
        onPointsChange?.(data.new_balance);
      } else {
        toast({
          title: 'Redemption Failed',
          description: data.detail || 'Something went wrong',
          variant: 'destructive'
        });
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to redeem reward',
        variant: 'destructive'
      });
    } finally {
      setRedeeming(false);
    }
  };
  
  if (loading) {
    return (
      <Card className="p-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6" data-testid="paw-points-rewards">
      {/* Balance Card */}
      <Card className="overflow-hidden">
        <div className={`bg-gradient-to-r ${TIER_COLORS[balance?.tier || 'bronze']} p-6 text-white`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Wallet className="w-7 h-7" />
              </div>
              <div>
                <p className="text-white/70 text-sm">Your Paw Points</p>
                <p className="text-3xl font-bold">{(balance?.balance || 0).toLocaleString()}</p>
              </div>
            </div>
            <div className="text-right">
              <Badge className="bg-white/20 text-white border-none mb-1">
                {TIER_ICONS[balance?.tier || 'bronze']} {(balance?.tier || 'bronze').charAt(0).toUpperCase() + (balance?.tier || 'bronze').slice(1)} Tier
              </Badge>
              <p className="text-xs text-white/70">
                {balance?.lifetime_earned?.toLocaleString()} lifetime points
              </p>
            </div>
          </div>
          
          {/* Tier Progress */}
          {balance?.next_tier && (
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
              <div className="flex justify-between text-sm mb-2">
                <span>Progress to {balance.next_tier.charAt(0).toUpperCase() + balance.next_tier.slice(1)}</span>
                <span>{Math.round(balance.progress_to_next_tier)}%</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white rounded-full transition-all duration-500"
                  style={{ width: `${balance.progress_to_next_tier}%` }}
                />
              </div>
            </div>
          )}
        </div>
        
        {/* Tabs */}
        <div className="border-b flex">
          {[
            { id: 'catalog', label: 'Rewards', icon: <Gift className="w-4 h-4" /> },
            { id: 'history', label: 'My Rewards', icon: <History className="w-4 h-4" /> },
            { id: 'earn', label: 'Earn Points', icon: <TrendingUp className="w-4 h-4" /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                activeTab === tab.id 
                  ? 'text-purple-600 border-b-2 border-purple-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
        
        <div className="p-4">
          {/* Catalog Tab */}
          {activeTab === 'catalog' && (
            <div className="grid gap-3">
              {catalog.map((reward) => (
                <div 
                  key={reward.id}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    reward.can_redeem 
                      ? 'border-purple-200 bg-purple-50/50 hover:border-purple-400 hover:shadow-md' 
                      : reward.tier_locked
                        ? 'border-gray-200 bg-gray-50 opacity-60'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                  onClick={() => reward.can_redeem && setSelectedReward(reward)}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                      reward.can_redeem 
                        ? `bg-gradient-to-br ${TIER_COLORS[reward.tier]}` 
                        : 'bg-gray-200'
                    }`}>
                      {reward.icon}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900">{reward.name}</h4>
                        {reward.tier_locked && <Lock className="w-4 h-4 text-gray-400" />}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{reward.description}</p>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-purple-600 border-purple-200">
                          <Star className="w-3 h-3 mr-1" />
                          {reward.points_required} points
                        </Badge>
                        <Badge className={`bg-gradient-to-r ${TIER_COLORS[reward.tier]} text-white border-none text-xs`}>
                          {reward.tier}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      {reward.can_redeem ? (
                        <Button 
                          size="sm" 
                          className="bg-purple-600 hover:bg-purple-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedReward(reward);
                          }}
                        >
                          Redeem
                        </Button>
                      ) : reward.tier_locked ? (
                        <span className="text-xs text-gray-400">Unlock {reward.tier}</span>
                      ) : (
                        <span className="text-xs text-gray-500">
                          Need {reward.points_needed} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              {redemptions.active?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    Active Rewards ({redemptions.active.length})
                  </h4>
                  <div className="space-y-2">
                    {redemptions.active.map((r) => (
                      <div key={r.id} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900">{r.reward_name}</p>
                            <p className="text-sm text-gray-600">Code: <code className="bg-green-100 px-2 py-0.5 rounded">{r.redemption_code}</code></p>
                          </div>
                          <Badge className="bg-green-500 text-white">Active</Badge>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Expires: {new Date(r.expires_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {redemptions.used?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-500 mb-3">Used Rewards</h4>
                  <div className="space-y-2">
                    {redemptions.used.map((r) => (
                      <div key={r.id} className="p-3 bg-gray-50 border border-gray-200 rounded-lg opacity-60">
                        <p className="font-medium text-gray-700">{r.reward_name}</p>
                        <p className="text-xs text-gray-500">Used on {new Date(r.used_at || r.created_at).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {!redemptions.active?.length && !redemptions.used?.length && (
                <div className="text-center py-8">
                  <Gift className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No rewards redeemed yet</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3"
                    onClick={() => setActiveTab('catalog')}
                  >
                    Browse Rewards
                  </Button>
                </div>
              )}
            </div>
          )}
          
          {/* Earn Tab */}
          {activeTab === 'earn' && (
            <div className="grid gap-3">
              {waysToEarn.map((way) => (
                <div key={way.id} className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl shadow-sm">
                      {way.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{way.name}</h4>
                      <p className="text-sm text-gray-600">{way.description}</p>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-purple-100 text-purple-700 border-none">
                        {way.points_example}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
      
      {/* Redemption Confirmation Dialog */}
      <Dialog open={!!selectedReward} onOpenChange={() => setSelectedReward(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-purple-600" />
              Confirm Redemption
            </DialogTitle>
            <DialogDescription>
              You&apos;re about to redeem a reward using your Paw Points
            </DialogDescription>
          </DialogHeader>
          
          {selectedReward && (
            <div className="py-4">
              <div className="bg-purple-50 p-4 rounded-xl mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{selectedReward.icon}</span>
                  <div>
                    <h4 className="font-bold text-gray-900">{selectedReward.name}</h4>
                    <p className="text-sm text-gray-600">{selectedReward.description}</p>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Points required:</span>
                  <span className="font-bold text-purple-600">{selectedReward.points_required}</span>
                </div>
              </div>
              
              <div className="flex justify-between text-sm mb-4 px-2">
                <span className="text-gray-600">Your balance after:</span>
                <span className="font-semibold">{(balance?.balance || 0) - selectedReward.points_required} points</span>
              </div>
              
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setSelectedReward(null)}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                  disabled={redeeming}
                  onClick={() => handleRedeem(selectedReward)}
                >
                  {redeeming ? 'Redeeming...' : 'Confirm & Redeem'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PawPointsRewards;

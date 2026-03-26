/**
 * MembershipCardTiers Component
 * 3 Membership card tiers that change based on loyalty points:
 * - Bronze: 0-999 points
 * - Silver: 1000-4999 points  
 * - Gold: 5000+ points
 * 
 * Features:
 * - Clickable Pet Pass Number to show full card
 * - TD Logo branding
 * - Validity dates
 * - Terms & Conditions
 */

import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { 
  Crown, Star, Shield, Calendar, Award, PawPrint, 
  Sparkles, Gift, ChevronRight, X, Copy, Check, QrCode
} from 'lucide-react';

// Tier configurations — thresholds match backend (paw_points_routes.py TIER_THRESHOLDS)
const MEMBERSHIP_TIERS = {
  bronze: {
    name: 'Bronze Pup',
    minPoints: 0,
    maxPoints: 499,
    gradient: 'from-amber-600 via-amber-500 to-amber-700',
    icon: PawPrint,
    iconColor: 'text-amber-600',
    badgeColor: 'bg-amber-100 text-amber-700',
    benefits: [
      'Birthday treats for your pet',
      'Access to member-only events',
      '5% off on first order',
      'Priority customer support'
    ],
    pointsMultiplier: 1
  },
  silver: {
    name: 'Silver Star',
    minPoints: 500,
    maxPoints: 1499,
    gradient: 'from-slate-400 via-slate-300 to-slate-500',
    icon: Star,
    iconColor: 'text-slate-500',
    badgeColor: 'bg-slate-100 text-slate-700',
    benefits: [
      'All Bronze benefits',
      '10% off on all orders',
      'Free shipping on orders ₹2000+',
      'Early access to new products',
      'Exclusive Silver events'
    ],
    pointsMultiplier: 1.5
  },
  gold: {
    name: 'Gold Crown',
    minPoints: 1500,
    maxPoints: 4999,
    gradient: 'from-yellow-500 via-amber-400 to-yellow-600',
    icon: Crown,
    iconColor: 'text-yellow-600',
    badgeColor: 'bg-yellow-100 text-yellow-700',
    benefits: [
      'All Silver benefits',
      '15% off on all orders',
      'Free shipping always',
      'VIP access to all events',
      'Personal concierge service',
      'Surprise gifts on pet birthdays'
    ],
    pointsMultiplier: 2
  },
  platinum: {
    name: 'Platinum Soul',
    minPoints: 5000,
    maxPoints: Infinity,
    gradient: 'from-violet-600 via-purple-500 to-indigo-600',
    icon: Sparkles,
    iconColor: 'text-violet-300',
    badgeColor: 'bg-violet-100 text-violet-700',
    benefits: [
      'All Gold benefits',
      '20% off on all orders',
      'Dedicated personal concierge',
      'Exclusive Platinum events',
      'Priority booking for all services',
      'Annual gift box for your pet',
      'Founder member recognition'
    ],
    pointsMultiplier: 3
  }
};

// Determine tier based on points — mirrors backend logic
const getTier = (points) => {
  if (points >= 5000) return 'platinum';
  if (points >= 1500) return 'gold';
  if (points >= 500) return 'silver';
  return 'bronze';
};

// Format date
const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return 'N/A';
  }
};

const MembershipCardTiers = ({ user, pet }) => {
  const [showFullCard, setShowFullCard] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const points = user?.loyalty_points || 0;
  const currentTier = getTier(points);
  const tierConfig = MEMBERSHIP_TIERS[currentTier];
  const TierIcon = tierConfig.icon;
  
  // Calculate progress to next tier
  const nextTier = currentTier === 'bronze' ? 'silver' : currentTier === 'silver' ? 'gold' : null;
  const nextTierConfig = nextTier ? MEMBERSHIP_TIERS[nextTier] : null;
  const pointsToNext = nextTierConfig ? nextTierConfig.minPoints - points : 0;
  const progressPercent = nextTierConfig 
    ? Math.min(100, ((points - tierConfig.minPoints) / (nextTierConfig.minPoints - tierConfig.minPoints)) * 100)
    : 100;
  
  // Pet Pass details
  const petPassNumber = pet?.pet_pass_number || user?.pet_pass_number || `TDC-${(user?.id || '').slice(-6).toUpperCase()}`;
  const memberSince = user?.pet_pass_activated_at || user?.created_at;
  const expiresAt = user?.pet_pass_expires || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
  
  const copyPetPass = () => {
    navigator.clipboard.writeText(petPassNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <>
      {/* Compact Card Preview */}
      <Card 
        className={`relative overflow-hidden cursor-pointer hover:shadow-lg transition-all bg-gradient-to-br ${tierConfig.gradient}`}
        onClick={() => setShowFullCard(true)}
        data-testid="membership-card-preview"
      >
        {/* Background patterns */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-4 w-32 h-32 rounded-full border-4 border-white"></div>
          <div className="absolute bottom-4 left-4 w-20 h-20 rounded-full border-4 border-white"></div>
        </div>
        
        <div className="relative p-5 text-white">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <span className="text-lg font-bold">TD</span>
              </div>
              <span className="font-bold tracking-wide">Pet Life Pass</span>
            </div>
            <Badge className={`${tierConfig.badgeColor} border-0`}>
              <TierIcon className="w-3 h-3 mr-1" />
              {tierConfig.name}
            </Badge>
          </div>
          
          {/* Pet Pass Number - Clickable */}
          <button 
            onClick={(e) => { e.stopPropagation(); copyPetPass(); }}
            className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-lg text-sm font-mono hover:bg-white/30 transition-colors"
          >
            {petPassNumber}
            {copied ? <Check className="w-4 h-4 text-green-300" /> : <Copy className="w-4 h-4 opacity-70" />}
          </button>
          
          {/* Points */}
          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-white/70 text-xs">Loyalty Points</p>
              <p className="text-2xl font-bold">{points.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-white/70 text-xs">Worth</p>
              <p className="font-semibold">₹{(points * 0.5).toFixed(0)}</p>
            </div>
          </div>
          
          {/* Progress to next tier */}
          {nextTier && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-white/70 mb-1">
                <span>{pointsToNext} points to {MEMBERSHIP_TIERS[nextTier].name}</span>
                <span>{Math.round(progressPercent)}%</span>
              </div>
              <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
          
          <p className="text-[10px] text-white/50 mt-3 text-center">Click to view full card</p>
        </div>
      </Card>
      
      {/* Full Card Modal */}
      <Dialog open={showFullCard} onOpenChange={setShowFullCard}>
        <DialogContent className="max-w-md p-0 overflow-hidden">
          {/* Full Membership Card */}
          <div className={`bg-gradient-to-br ${tierConfig.gradient} p-6 text-white`}>
            {/* Header with TD Logo */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-xl font-bold bg-gradient-to-br from-purple-600 to-pink-500 bg-clip-text text-transparent">TD</span>
                </div>
                <div>
                  <p className="font-bold text-lg">The Doggy Company</p>
                  <p className="text-white/70 text-sm">Pet Life Pass</p>
                </div>
              </div>
              <Badge className={`${tierConfig.badgeColor} border-0 px-3 py-1`}>
                <TierIcon className="w-4 h-4 mr-1" />
                {tierConfig.name}
              </Badge>
            </div>
            
            {/* Member Info */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4">
              <div className="flex items-center gap-4">
                {/* Pet Avatar */}
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
                  {pet?.photo_url ? (
                    <img src={pet.photo_url} alt={pet.name} className="w-full h-full object-cover" />
                  ) : (
                    <PawPrint className="w-8 h-8 text-white/60" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-lg">{user?.full_name || user?.name || 'Pet Parent'}</p>
                  <p className="text-white/70 text-sm">{pet?.name ? `${pet.name}'s Human` : 'Member'}</p>
                </div>
              </div>
            </div>
            
            {/* Pet Pass Number */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-xs mb-1">Pet Pass Number</p>
                  <p className="font-mono text-xl font-bold tracking-wider">{petPassNumber}</p>
                </div>
                <button 
                  onClick={copyPetPass}
                  className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                >
                  {copied ? <Check className="w-5 h-5 text-green-300" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>
            
            {/* Points & Validity */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                <p className="text-white/70 text-xs">Points Balance</p>
                <p className="text-2xl font-bold">{points.toLocaleString()}</p>
                <p className="text-xs text-white/60">Worth ₹{(points * 0.5).toFixed(0)}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                <p className="text-white/70 text-xs">Valid Until</p>
                <p className="text-lg font-bold">{formatDate(expiresAt)}</p>
                <p className="text-xs text-white/60">Since {formatDate(memberSince)}</p>
              </div>
            </div>
            
            {/* Progress to next tier inside modal */}
            {nextTier && (
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-white/80 text-sm font-medium">Progress to {MEMBERSHIP_TIERS[nextTier].name}</p>
                  <span className="text-white/60 text-xs">{Math.round(progressPercent)}%</span>
                </div>
                <div className="h-2.5 bg-white/20 rounded-full overflow-hidden mb-1">
                  <div className="h-full bg-white rounded-full transition-all duration-700" style={{ width: `${progressPercent}%` }} />
                </div>
                <p className="text-white/50 text-xs text-right">{pointsToNext.toLocaleString()} pts to {MEMBERSHIP_TIERS[nextTier].name}</p>
              </div>
            )}
            
            {/* QR Code / Member Identity */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4 flex items-center gap-4">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center shadow-md">
                  <div className="grid grid-cols-3 gap-0.5 p-1">
                    {[1,1,1,1,0,1,1,1,1].map((v,i) => (
                      <div key={i} className={`w-3.5 h-3.5 rounded-sm ${v ? 'bg-gray-900' : 'bg-white'}`} />
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <p className="text-white/60 text-xs mb-1">Member ID</p>
                <p className="font-mono text-base font-bold text-white tracking-wider">{petPassNumber}</p>
                <p className="text-white/50 text-xs mt-1">Show at any TDC event for access</p>
              </div>
            </div>
            
            {/* Benefits */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="font-semibold mb-2 flex items-center gap-2">
                <Gift className="w-4 h-4" /> {tierConfig.name} Benefits
              </p>
              <ul className="space-y-1.5">
                {tierConfig.benefits.map((benefit, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-white/80">
                    <Sparkles className="w-3 h-3 text-yellow-300" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Terms & Conditions */}
            <p className="text-[10px] text-white/50 mt-4 text-center">
              *Terms and conditions apply. Points expire 12 months from earning date.
            </p>
          </div>
          
          {/* Footer Actions */}
          <div className="p-4 bg-white border-t">
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setShowFullCard(false)}
              >
                Close
              </Button>
              <Button 
                className={`flex-1 bg-gradient-to-r ${tierConfig.gradient} text-white border-0`}
                onClick={() => {/* Navigate to rewards */}}
              >
                View Rewards <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MembershipCardTiers;

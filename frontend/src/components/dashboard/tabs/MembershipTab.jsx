import React from 'react';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { 
  Crown, Calendar, Clock, CheckCircle, Star, Sparkles, 
  ArrowRight, RefreshCw, Gift, Shield, Heart
} from 'lucide-react';

const MembershipTab = ({ user }) => {
  // Get membership data from user object
  const membershipTier = user?.membership_tier || 'foundation';
  const membershipExpires = user?.membership_expires;
  const createdAt = user?.created_at;
  
  // Map tier names to plan details
  const PLAN_DETAILS = {
    free: {
      plan_name: 'Free Tier',
      price: 0,
      billing_cycle: 'none',
      features: [
        'Basic Mira AI access',
        'Browse services',
        'Limited concierge support'
      ]
    },
    foundation: {
      plan_name: 'Pet Pass Foundation',
      price: 4999,
      billing_cycle: 'yearly',
      features: [
        'Unlimited Mira AI conversations',
        'Priority Concierge® support',
        '14 Life Pillar access',
        'Pet Soul™ profile & analytics',
        'Exclusive member discounts',
        'Birthday party planning',
        'Emergency support hotline'
      ]
    },
    gold: {
      plan_name: 'Pet Pass Gold',
      price: 9999,
      billing_cycle: 'yearly',
      features: [
        'Everything in Foundation',
        '10% off all purchases',
        'Dedicated account manager',
        'Priority booking',
        'Free monthly consultations',
        'Exclusive Gold events'
      ]
    },
    platinum: {
      plan_name: 'Pet Pass Platinum',
      price: 19999,
      billing_cycle: 'yearly',
      features: [
        'Everything in Gold',
        '15% off all purchases',
        'Personal concierge',
        '24/7 emergency line',
        'VIP event access',
        'Complimentary grooming (2x/month)',
        'Free pet insurance consultation'
      ]
    },
    standard: {
      plan_name: 'Pet Pass Foundation',
      price: 4999,
      billing_cycle: 'yearly',
      features: [
        'Unlimited Mira AI conversations',
        'Priority Concierge® support',
        '14 Life Pillar access',
        'Pet Soul™ profile & analytics',
        'Exclusive member discounts',
        'Birthday party planning',
        'Emergency support hotline'
      ]
    }
  };
  
  const plan = PLAN_DETAILS[membershipTier] || PLAN_DETAILS.foundation;
  
  // Calculate validity dates
  const validFrom = createdAt ? new Date(createdAt) : new Date();
  const validUntil = membershipExpires ? new Date(membershipExpires) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  
  // Calculate days remaining
  const calculateDaysRemaining = () => {
    const today = new Date();
    const diffTime = validUntil - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysRemaining = calculateDaysRemaining();
  const isExpiringSoon = daysRemaining !== null && daysRemaining <= 30 && daysRemaining > 0;
  const isExpired = daysRemaining !== null && daysRemaining <= 0;
  const isActive = !isExpired && membershipTier !== 'free';

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Not set';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return 'Not set';
    }
  };

  return (
    <div className="animate-in fade-in-50 duration-300 space-y-6" data-testid="membership-tab">
      {/* Membership Status Card */}
      <Card className="p-6 bg-gradient-to-br from-purple-900/60 via-slate-900/60 to-pink-900/60 backdrop-blur-xl border border-purple-500/20 rounded-2xl">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <div>
              <Badge className={`mb-2 ${isActive ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'}`}>
                {isActive ? '✓ Active' : isExpired ? '✗ Expired' : '○ Free Tier'}
              </Badge>
              <h2 className="text-xl sm:text-2xl font-bold text-white">{plan.plan_name}</h2>
              <p className="text-sm text-slate-400 mt-1">
                {plan.billing_cycle === 'yearly' ? 'Annual Membership' : plan.billing_cycle === 'monthly' ? 'Monthly Membership' : 'No active subscription'}
              </p>
            </div>
          </div>
          
          {/* Renewal Badge */}
          {isExpiringSoon && !isExpired && (
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 animate-pulse">
              Expires in {daysRemaining} days
            </Badge>
          )}
          {isExpired && (
            <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
              Expired
            </Badge>
          )}
        </div>
        
        {/* Validity Period */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="p-4 bg-slate-800/50 rounded-xl border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-slate-400 uppercase font-medium">Valid From</span>
            </div>
            <p className="text-lg font-semibold text-white">{formatDate(validFrom.toISOString())}</p>
          </div>
          <div className="p-4 bg-slate-800/50 rounded-xl border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-pink-400" />
              <span className="text-xs text-slate-400 uppercase font-medium">Valid Until</span>
            </div>
            <p className="text-lg font-semibold text-white">{formatDate(validUntil.toISOString())}</p>
          </div>
        </div>
        
        {/* Days Remaining Progress */}
        {daysRemaining !== null && daysRemaining > 0 && membershipTier !== 'free' && (
          <div className="mt-4 p-4 bg-slate-800/30 rounded-xl">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-slate-400">Membership Duration</span>
              <span className="text-sm font-medium text-purple-400">{daysRemaining} days remaining</span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  isExpiringSoon 
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500' 
                    : 'bg-gradient-to-r from-purple-500 to-pink-500'
                }`}
                style={{ width: `${Math.max(5, Math.min(100, (daysRemaining / 365) * 100))}%` }}
              />
            </div>
          </div>
        )}
        
        {/* Actions */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          {isExpired || membershipTier === 'free' ? (
            <Button className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white">
              <RefreshCw className="w-4 h-4 mr-2" /> {membershipTier === 'free' ? 'Upgrade Now' : 'Renew Membership'}
            </Button>
          ) : isExpiringSoon ? (
            <Button className="flex-1 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white">
              <RefreshCw className="w-4 h-4 mr-2" /> Renew Early (Save 10%)
            </Button>
          ) : (
            <Button variant="outline" className="flex-1 bg-slate-800/50 border-white/10 text-white hover:bg-slate-700/50">
              <ArrowRight className="w-4 h-4 mr-2" /> View Plan Details
            </Button>
          )}
          {membershipTier !== 'platinum' && (
            <Button variant="outline" className="flex-1 bg-slate-800/50 border-white/10 text-white hover:bg-slate-700/50 hover:border-purple-500/30">
              <Star className="w-4 h-4 mr-2 text-purple-400" /> Upgrade Plan
            </Button>
          )}
        </div>
      </Card>
      
      {/* Plan Features */}
      <Card className="p-6 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" /> Your Plan Includes
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {plan.features.map((feature, idx) => (
            <div 
              key={idx}
              className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-xl"
            >
              <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <span className="text-sm text-white">{feature}</span>
            </div>
          ))}
        </div>
      </Card>
      
      {/* Billing History */}
      <Card className="p-6 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-purple-400" /> Billing History
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Pet Pass Foundation - Annual</p>
                <p className="text-xs text-slate-400">{formatDate(plan.valid_from)}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-white">₹{plan.price?.toLocaleString('en-IN') || '4,999'}</p>
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">Paid</Badge>
            </div>
          </div>
        </div>
        <Button variant="outline" className="w-full mt-4 bg-slate-800/50 border-white/10 text-white hover:bg-slate-700/50">
          View All Transactions
        </Button>
      </Card>
      
      {/* Member Benefits */}
      <Card className="p-6 bg-gradient-to-br from-amber-900/30 to-orange-900/30 border border-amber-500/20 rounded-2xl">
        <div className="flex items-center gap-3 mb-4">
          <Gift className="w-6 h-6 text-amber-400" />
          <h3 className="text-lg font-bold text-white">Member Exclusive Benefits</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-slate-800/50 rounded-xl text-center">
            <p className="text-2xl font-bold text-amber-400">10%</p>
            <p className="text-xs text-slate-400">Shop Discount</p>
          </div>
          <div className="p-3 bg-slate-800/50 rounded-xl text-center">
            <p className="text-2xl font-bold text-emerald-400">Free</p>
            <p className="text-xs text-slate-400">Concierge® Calls</p>
          </div>
          <div className="p-3 bg-slate-800/50 rounded-xl text-center">
            <p className="text-2xl font-bold text-pink-400">2x</p>
            <p className="text-xs text-slate-400">Paw Points</p>
          </div>
          <div className="p-3 bg-slate-800/50 rounded-xl text-center">
            <p className="text-2xl font-bold text-purple-400">24/7</p>
            <p className="text-xs text-slate-400">Emergency Line</p>
          </div>
        </div>
      </Card>
      
      {/* Need Help */}
      <Card className="p-4 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Heart className="w-5 h-5 text-pink-400" />
            <p className="text-sm text-white">Questions about your membership?</p>
          </div>
          <Button size="sm" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white">
            Contact Concierge®
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default MembershipTab;

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { 
  Crown, Sparkles, PawPrint, Gift, Percent, Clock, Shield, 
  Heart, ChevronRight, Star, Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// All 12 Pillar benefits
const PILLAR_BENEFITS = {
  celebrate: {
    name: 'Celebrate',
    icon: '🎂',
    description: 'Cakes, treats & party supplies',
    benefits: ['10% off all cakes', 'Free delivery on orders ₹499+', 'Priority custom orders', 'Early access to seasonal items']
  },
  dine: {
    name: 'Dine',
    icon: '🍽️',
    description: 'Pet-friendly restaurants',
    benefits: ['Exclusive restaurant deals', 'Priority reservations', 'Pet menu recommendations', 'Table preferences saved']
  },
  travel: {
    name: 'Travel',
    icon: '✈️',
    description: 'Pet relocation & transport',
    benefits: ['Discounted pet taxi', 'Priority airline booking', 'Free travel consultation', 'Document management']
  },
  stay: {
    name: 'Stay',
    icon: '🏨',
    description: 'Hotels & boarding',
    benefits: ['Member-only hotels', 'Boarding discounts', 'Free cancellation', 'Preference matching']
  },
  enjoy: {
    name: 'Enjoy',
    icon: '🎾',
    description: 'Events & experiences',
    benefits: ['VIP event access', 'Early bird tickets', 'Exclusive meetups', 'Free photo sessions']
  },
  care: {
    name: 'Care',
    icon: '💊',
    description: 'Health & grooming',
    benefits: ['Vet appointment priority', 'Grooming discounts', 'Health record storage', 'Medication reminders']
  },
  fit: {
    name: 'Fit',
    icon: '🏃',
    description: 'Fitness & training',
    benefits: ['Training session discounts', 'Personalized plans', 'Progress tracking', 'Expert consultations']
  },
  advisory: {
    name: 'Advisory',
    icon: '📋',
    description: 'Expert consultations',
    benefits: ['Free first consultation', 'Priority scheduling', 'Nutrition planning', 'Behavior guidance']
  },
  paperwork: {
    name: 'Paperwork',
    icon: '📄',
    description: 'Documents & records',
    benefits: ['Pet Vault storage', 'Document templates', 'Expiry reminders', 'Travel documentation']
  },
  emergency: {
    name: 'Emergency',
    icon: '🚨',
    description: '24/7 emergency support',
    benefits: ['Priority helpline', 'Lost pet alerts', 'Emergency vet network', 'Crisis coordination']
  },
  shopAssist: {
    name: 'Shop Assist',
    icon: '🛒',
    description: 'Personal shopping help',
    benefits: ['Personal shopper', 'Product recommendations', 'Price alerts', 'Wishlist management']
  },
  concierge: {
    name: 'Concierge',
    icon: '👑',
    description: 'Premium support',
    benefits: ['Dedicated account manager', '24/7 priority support', 'VIP benefits', 'Exclusive events']
  }
};

const MembersArea = () => {
  const { user } = useAuth();
  const [showAllPillars, setShowAllPillars] = useState(false);
  const [selectedPillar, setSelectedPillar] = useState(null);

  // If user is logged in, show their dashboard
  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center px-4 py-2 bg-green-100 rounded-full mb-6">
              <Check className="w-5 h-5 text-green-600 mr-2" />
              <span className="text-green-600 text-sm font-semibold">Welcome, Member!</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
              Your Member Dashboard
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Hello {user.name || user.email}! Explore all 12 pillars of The Doggy Company.
            </p>
          </div>

          {/* Quick Access Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-12">
            {Object.entries(PILLAR_BENEFITS).map(([key, pillar]) => (
              <Link 
                key={key}
                to={`/${key === 'shopAssist' ? 'shop-assist' : key === 'concierge' ? 'membership' : key}`}
                className="p-4 bg-white rounded-xl shadow-md hover:shadow-lg transition-all hover:-translate-y-1 border border-gray-100"
              >
                <div className="text-3xl mb-2">{pillar.icon}</div>
                <h3 className="font-bold text-gray-900">{pillar.name}</h3>
                <p className="text-xs text-gray-500">{pillar.description}</p>
              </Link>
            ))}
          </div>

          {/* Member Stats */}
          <Card className="p-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-3xl font-bold">{user.membership_tier || 'Free'}</div>
                <div className="text-sm opacity-80">Membership Tier</div>
              </div>
              <div>
                <div className="text-3xl font-bold">0</div>
                <div className="text-sm opacity-80">Paw Points</div>
              </div>
              <div>
                <div className="text-3xl font-bold">12</div>
                <div className="text-sm opacity-80">Pillars Access</div>
              </div>
              <div>
                <div className="text-3xl font-bold">∞</div>
                <div className="text-sm opacity-80">Mira AI Chats</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Non-logged in view - Member benefits preview
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white py-16" data-testid="members-area-page">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 bg-purple-100 rounded-full mb-6">
            <Crown className="w-5 h-5 text-purple-600 mr-2" />
            <span className="text-purple-600 text-sm font-semibold">Members Only Area</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
            Unlock All 12 Pillars
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Join 45,000+ pet parents who enjoy exclusive benefits across The Doggy Company's complete Pet Life Operating System
          </p>
        </div>

        {/* Key Benefits Summary */}
        <Card className="p-8 bg-gradient-to-br from-purple-600 to-pink-600 text-white mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Crown className="w-8 h-8 text-yellow-400" />
              <div>
                <h3 className="text-2xl font-bold">Membership Benefits</h3>
                <p className="text-purple-200">One membership, all 12 pillars unlocked</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="border-white text-white hover:bg-white/10"
              onClick={() => setShowAllPillars(!showAllPillars)}
            >
              {showAllPillars ? 'Hide Pillars' : 'Show All Pillars'}
              <ChevronRight className={`w-4 h-4 ml-1 transition-transform ${showAllPillars ? 'rotate-90' : ''}`} />
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-white/10 rounded-xl">
              <Percent className="w-8 h-8 mx-auto mb-2 text-yellow-400" />
              <p className="font-bold text-lg">10-20%</p>
              <p className="text-sm text-purple-200">Off All Orders</p>
            </div>
            <div className="text-center p-4 bg-white/10 rounded-xl">
              <PawPrint className="w-8 h-8 mx-auto mb-2 text-yellow-400" />
              <p className="font-bold text-lg">3x Points</p>
              <p className="text-sm text-purple-200">Paw Rewards</p>
            </div>
            <div className="text-center p-4 bg-white/10 rounded-xl">
              <Sparkles className="w-8 h-8 mx-auto mb-2 text-yellow-400" />
              <p className="font-bold text-lg">24/7</p>
              <p className="text-sm text-purple-200">Mira AI Access</p>
            </div>
            <div className="text-center p-4 bg-white/10 rounded-xl">
              <Heart className="w-8 h-8 mx-auto mb-2 text-yellow-400" />
              <p className="font-bold text-lg">Pet Soul™</p>
              <p className="text-sm text-purple-200">Profile</p>
            </div>
          </div>

          {showAllPillars && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-6 border-t border-white/20">
              {Object.entries(PILLAR_BENEFITS).map(([key, pillar]) => (
                <button
                  key={key}
                  onClick={() => setSelectedPillar(selectedPillar === key ? null : key)}
                  className={`flex items-center gap-2 p-3 rounded-lg transition-all ${
                    selectedPillar === key ? 'bg-white/30' : 'bg-white/5 hover:bg-white/15'
                  }`}
                >
                  <span className="text-xl">{pillar.icon}</span>
                  <span className="text-sm font-medium">{pillar.name}</span>
                </button>
              ))}
            </div>
          )}
        </Card>

        {/* Selected Pillar Details */}
        {selectedPillar && PILLAR_BENEFITS[selectedPillar] && (
          <Card className="p-6 mb-8 border-2 border-purple-200 bg-white animate-fadeIn">
            <div className="flex items-center gap-4 mb-4">
              <div className="text-4xl">{PILLAR_BENEFITS[selectedPillar].icon}</div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{PILLAR_BENEFITS[selectedPillar].name}</h3>
                <p className="text-gray-600">{PILLAR_BENEFITS[selectedPillar].description}</p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {PILLAR_BENEFITS[selectedPillar].benefits.map((benefit, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                  <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Star className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-gray-700 text-sm">{benefit}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* All Pillars Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {Object.entries(PILLAR_BENEFITS).slice(0, 6).map(([key, pillar]) => (
            <Card key={key} className="p-5 hover:shadow-lg transition-shadow border border-gray-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="text-3xl">{pillar.icon}</div>
                <div>
                  <h3 className="font-bold text-gray-900">{pillar.name}</h3>
                  <p className="text-xs text-gray-500">{pillar.description}</p>
                </div>
              </div>
              <ul className="space-y-1">
                {pillar.benefits.slice(0, 2).map((benefit, idx) => (
                  <li key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <h2 className="text-2xl font-bold mb-4">Ready to Join?</h2>
            <p className="text-gray-600 mb-6">
              Get started with a free account or upgrade to unlock all premium benefits
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/membership" state={{ action: 'signup' }}>
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-lg px-8 py-6 w-full sm:w-auto"
                >
                  <Crown className="w-5 h-5 mr-2" />
                  Create Free Account
                </Button>
              </Link>
              <Link to="/membership" state={{ action: 'login' }}>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-2 border-purple-600 text-purple-600 hover:bg-purple-50 text-lg px-8 py-6 w-full sm:w-auto"
                >
                  Already a Member? Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap justify-center gap-6 mt-8 text-gray-500 text-sm">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span>Secure Payments</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>Cancel Anytime</span>
          </div>
          <div className="flex items-center gap-2">
            <Gift className="w-4 h-4" />
            <span>7-Day Free Trial</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MembersArea;

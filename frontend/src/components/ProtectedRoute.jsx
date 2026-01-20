import React, { useState } from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { 
  Crown, Sparkles, PawPrint, Gift, Percent, Clock, Shield, 
  Heart, Utensils, Plane, Building, Stethoscope, Dumbbell,
  FileText, AlertCircle, ShoppingBag, ChevronRight, Star
} from 'lucide-react';

// Pillar benefits mapping
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
  'shop-assist': {
    name: 'Shop Assist',
    icon: '🛒',
    description: 'Personal shopping help',
    benefits: ['Personal shopper', 'Product recommendations', 'Price alerts', 'Wishlist management']
  },
  membership: {
    name: 'Club',
    icon: '👑',
    description: 'Exclusive membership',
    benefits: ['Access all pillars', 'Paw points rewards', 'Member-only deals', 'Priority support']
  }
};

// Get pillar from path
const getPillarFromPath = (path) => {
  const pillarMatch = path.match(/^\/(celebrate|dine|travel|stay|enjoy|care|fit|advisory|paperwork|emergency|shop-assist|cakes|treats|meals|all|custom|hampers)/);
  if (pillarMatch) {
    const matched = pillarMatch[1];
    // Map product routes to celebrate
    if (['cakes', 'treats', 'meals', 'all', 'custom', 'hampers'].includes(matched)) {
      return 'celebrate';
    }
    return matched;
  }
  return null;
};

/**
 * ProtectedRoute - Shows member benefits preview for unauthenticated users
 */
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [showFullBenefits, setShowFullBenefits] = useState(false);

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show member benefits preview if not logged in
  if (!user) {
    const currentPillar = getPillarFromPath(location.pathname);
    const pillarInfo = currentPillar ? PILLAR_BENEFITS[currentPillar] : null;

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white py-16" data-testid="member-benefits-gate">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center px-4 py-2 bg-purple-100 rounded-full mb-6">
              <Shield className="w-5 h-5 text-purple-600 mr-2" />
              <span className="text-purple-600 text-sm font-semibold">Members Only Area</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
              Unlock {pillarInfo ? pillarInfo.name : 'This'} Access
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Join 45,000+ pet parents who enjoy exclusive benefits across all 12 pillars of The Doggy Company
            </p>
          </div>

          {/* Current Pillar Benefits */}
          {pillarInfo && (
            <Card className="p-8 mb-8 border-2 border-purple-200 bg-white">
              <div className="flex items-center gap-4 mb-6">
                <div className="text-5xl">{pillarInfo.icon}</div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{pillarInfo.name} Benefits</h2>
                  <p className="text-gray-600">{pillarInfo.description}</p>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {pillarInfo.benefits.map((benefit, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                    <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                      <Star className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-gray-700 font-medium">{benefit}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* All Membership Benefits */}
          <Card className="p-8 bg-gradient-to-br from-purple-600 to-pink-600 text-white mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Crown className="w-8 h-8 text-yellow-400" />
                <div>
                  <h3 className="text-2xl font-bold">Full Membership Benefits</h3>
                  <p className="text-purple-200">One membership, all 12 pillars unlocked</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="border-white text-white hover:bg-white/10"
                onClick={() => setShowFullBenefits(!showFullBenefits)}
              >
                {showFullBenefits ? 'Hide' : 'Show All'}
                <ChevronRight className={`w-4 h-4 ml-1 transition-transform ${showFullBenefits ? 'rotate-90' : ''}`} />
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

            {showFullBenefits && (
              <div className="grid md:grid-cols-3 gap-3 pt-6 border-t border-white/20">
                {Object.entries(PILLAR_BENEFITS).slice(0, 12).map(([key, pillar]) => (
                  <div key={key} className="flex items-center gap-2 p-2 bg-white/5 rounded-lg">
                    <span className="text-xl">{pillar.icon}</span>
                    <span className="text-sm">{pillar.name}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/membership" state={{ from: location.pathname }}>
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-lg px-8 py-6 w-full sm:w-auto"
              >
                <Crown className="w-5 h-5 mr-2" />
                Become a Member
              </Button>
            </Link>
            <Link to="/membership" state={{ from: location.pathname, action: 'login' }}>
              <Button 
                size="lg" 
                variant="outline"
                className="border-2 border-purple-600 text-purple-600 hover:bg-purple-50 text-lg px-8 py-6 w-full sm:w-auto"
              >
                Already a Member? Sign In
              </Button>
            </Link>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center gap-6 mt-12 text-gray-500 text-sm">
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
  }

  return children;
};

export default ProtectedRoute;

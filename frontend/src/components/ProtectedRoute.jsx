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
 * ProtectedRoute - Currently allows all users through (auth gating disabled)
 * TODO: Re-enable authentication check before going live
 */
const ProtectedRoute = ({ children }) => {
  // AUTH GATING DISABLED - All pages accessible without login
  // To re-enable: uncomment the authentication check below
  return children;

  /* 
  // === AUTHENTICATION CHECK (DISABLED FOR NOW) ===
  // Uncomment this block before going live to require login
  
  const { user, loading } = useAuth();
  const location = useLocation();
  const [showFullBenefits, setShowFullBenefits] = useState(false);

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

  if (!user) {
    const currentPillar = getPillarFromPath(location.pathname);
    const pillarInfo = currentPillar ? PILLAR_BENEFITS[currentPillar] : null;
    // ... member benefits gate UI would go here
  }

  return children;
  */
};

export default ProtectedRoute;

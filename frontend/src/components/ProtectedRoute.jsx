import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
 * ProtectedRoute - Guards routes behind authentication and optional membership
 * @param {boolean} requireMembership - If true, also requires active membership/pet pass
 * 
 * SIMPLIFIED LOGIC (v2 - Fixed redirect loop):
 * 1. If loading → show spinner
 * 2. If user exists → show children (or check membership)
 * 3. If no user but has token → show spinner (wait for auth context)
 * 4. If no user and no token → redirect to login
 */
const ProtectedRoute = ({ children, requireMembership = false }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  // Read localStorage synchronously (safe in browser)
  const hasToken = typeof window !== 'undefined' ? localStorage.getItem('tdb_auth_token') : null;
  const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;

  // LOADING STATE: Auth context is still initializing
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-950">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-white/70">Loading...</p>
        </div>
      </div>
    );
  }

  // AUTHENTICATED: User is in context - proceed
  if (user) {
    // Check membership if required
    if (requireMembership) {
      const isAdmin = user?.role === 'admin' || user?.role === 'super_admin' || user?.is_admin === true;
      const hasActiveMembership = user?.pet_pass_status === 'active' || 
                                  user?.membership_status === 'active' ||
                                  user?.has_paid === true ||
                                  user?.membership_tier ||
                                  user?.active_pet_pass;
      
      if (!isAdmin && !hasActiveMembership) {
        return <Navigate to="/membership" state={{ from: location.pathname }} replace />;
      }
    }
    return children;
  }

  // PENDING: Have token but user not loaded yet - show loading
  // This prevents redirect loop when auth context is still fetching user
  if (hasToken || storedUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-950">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-white/70">Loading your pets...</p>
        </div>
      </div>
    );
  }

  // NOT AUTHENTICATED: No user, no token - redirect to login
  return <Navigate to="/login" state={{ from: location.pathname }} replace />;
};

export default ProtectedRoute;

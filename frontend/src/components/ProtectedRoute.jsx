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
 * VERSION: v5_production_debug_20250610
 * SIMPLIFIED LOGIC (v5 - NEVER redirect if token exists):
 * 1. If has token → trust it, show content (use stored user for membership check)
 * 2. If no token → redirect to login
 */
const ProtectedRoute = ({ children, requireMembership = false }) => {
  const { user } = useAuth();
  const location = useLocation();
  
  // === PRODUCTION DEBUG LOGGING ===
  const VERSION = 'v5_production_debug_20250610';
  console.log(`[ProtectedRoute ${VERSION}] Checking auth for path:`, location.pathname);
  
  // Read localStorage synchronously
  const hasToken = typeof window !== 'undefined' ? localStorage.getItem('tdb_auth_token') : null;
  const storedUserStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  
  console.log(`[ProtectedRoute ${VERSION}] hasToken:`, !!hasToken, 'length:', hasToken?.length || 0);
  console.log(`[ProtectedRoute ${VERSION}] user from context:`, !!user);
  console.log(`[ProtectedRoute ${VERSION}] storedUserStr exists:`, !!storedUserStr);
  
  // Parse stored user
  let storedUser = null;
  if (storedUserStr) {
    try {
      storedUser = JSON.parse(storedUserStr);
      console.log(`[ProtectedRoute ${VERSION}] Parsed storedUser email:`, storedUser?.email);
    } catch (e) {
      console.error(`[ProtectedRoute ${VERSION}] Failed to parse stored user:`, e);
    }
  }

  // NO TOKEN = NOT LOGGED IN - redirect immediately
  if (!hasToken) {
    console.log(`[ProtectedRoute ${VERSION}] NO TOKEN - Redirecting to /login`);
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // HAS TOKEN = TRUST IT - use stored user or context user for membership check
  const effectiveUser = user || storedUser;
  console.log(`[ProtectedRoute ${VERSION}] HAS TOKEN - Showing content. effectiveUser:`, effectiveUser?.email || 'none');

  // Check membership if required
  if (requireMembership && effectiveUser) {
    const isAdmin = effectiveUser?.role === 'admin' || effectiveUser?.role === 'super_admin' || effectiveUser?.is_admin === true;
    const hasActiveMembership = effectiveUser?.pet_pass_status === 'active' || 
                                effectiveUser?.membership_status === 'active' ||
                                effectiveUser?.has_paid === true ||
                                effectiveUser?.membership_tier ||
                                effectiveUser?.active_pet_pass;
    
    console.log(`[ProtectedRoute ${VERSION}] Membership check - isAdmin:`, isAdmin, 'hasActiveMembership:', hasActiveMembership);
    
    if (!isAdmin && !hasActiveMembership) {
      console.log(`[ProtectedRoute ${VERSION}] NO MEMBERSHIP - Redirecting to /membership`);
      return <Navigate to="/membership" state={{ from: location.pathname }} replace />;
    }
  }

  // HAS TOKEN - show content (even if user data is still loading)
  console.log(`[ProtectedRoute ${VERSION}] ALLOWING ACCESS to:`, location.pathname);
  return children;
};

export default ProtectedRoute;
// VERSION_MARKER: v5_production_debug_20250610

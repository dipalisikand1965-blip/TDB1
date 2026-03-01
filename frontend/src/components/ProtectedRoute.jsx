import React, { useState, useEffect, useRef } from 'react';
import { Navigate, useLocation, useNavigate, Link } from 'react-router-dom';
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
 * ProtectedRoute - Guards routes behind authentication and optional membership
 * @param {boolean} requireMembership - If true, also requires active membership/pet pass
 */
const ProtectedRoute = ({ children, requireMembership = false }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [authChecked, setAuthChecked] = useState(false);
  const isRedirecting = useRef(false);
  
  // Store pathname in ref to avoid re-renders from location changes
  const pathnameRef = useRef(location.pathname);
  pathnameRef.current = location.pathname;

  useEffect(() => {
    // Prevent multiple simultaneous redirects
    if (isRedirecting.current) return;
    
    // Check localStorage once
    const hasToken = localStorage.getItem('tdb_auth_token');
    const storedUserStr = localStorage.getItem('user');
    
    // Wait for auth context to finish loading
    if (loading) return;
    
    // Case 1: User is authenticated (from context)
    if (user) {
      setAuthChecked(true);
      return;
    }
    
    // Case 2: Have token but user not in state yet - try stored user
    if (hasToken && storedUserStr) {
      // Auth context should pick this up, just wait
      setAuthChecked(true);
      return;
    }
    
    // Case 3: Have token but no stored user - wait a bit for API
    if (hasToken && !storedUserStr) {
      const timer = setTimeout(() => {
        const currentToken = localStorage.getItem('tdb_auth_token');
        if (currentToken) {
          // Still have token, assume valid
          setAuthChecked(true);
        } else {
          // Token was cleared (likely 401) - redirect to login
          if (!isRedirecting.current) {
            isRedirecting.current = true;
            navigate('/login', { 
              state: { from: pathnameRef.current },
              replace: true 
            });
          }
        }
      }, 300);
      return () => clearTimeout(timer);
    }
    
    // Case 4: No token at all - redirect to login
    if (!hasToken) {
      if (!isRedirecting.current) {
        isRedirecting.current = true;
        navigate('/login', { 
          state: { from: pathnameRef.current },
          replace: true 
        });
      }
    }
  }, [user, loading, navigate]); // REMOVED location from deps - critical fix!

  // Separate effect for membership check
  useEffect(() => {
    if (!authChecked || !user || !requireMembership) return;
    if (isRedirecting.current) return;
    
    const isAdmin = user?.role === 'admin' || user?.role === 'super_admin' || user?.is_admin === true;
    const hasActiveMembership = user?.pet_pass_status === 'active' || 
                                user?.membership_status === 'active' ||
                                user?.has_paid === true ||
                                user?.membership_tier ||
                                user?.active_pet_pass;
    
    if (!isAdmin && !hasActiveMembership) {
      isRedirecting.current = true;
      navigate('/membership', { 
        state: { from: pathnameRef.current },
        replace: true 
      });
    }
  }, [authChecked, user, requireMembership, navigate]); // REMOVED location from deps

  // Show loading while auth context is checking OR if we have a token but no user yet
  if (loading || (hasToken && !user && !authChecked)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-950">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-white/70">Loading your pets...</p>
        </div>
      </div>
    );
  }

  // No token and auth finished loading - will redirect via useEffect
  if (!hasToken && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center text-white">
          <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Check membership for protected routes
  if (requireMembership) {
    // STRICT ADMIN CHECK - Only explicit admin role
    const isAdmin = user?.role === 'admin' || user?.role === 'super_admin' || user?.is_admin === true;
    const hasActiveMembership = user?.pet_pass_status === 'active' || 
                                user?.membership_status === 'active' ||
                                user?.has_paid === true ||
                                user?.membership_tier ||  // Has any membership tier
                                user?.active_pet_pass;    // Has active pet pass
    
    if (!isAdmin && !hasActiveMembership) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
          <div className="text-center text-white">
            <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Redirecting to membership...</p>
          </div>
        </div>
      );
    }
  }

  return children;
};

export default ProtectedRoute;

import React, { useState, useEffect } from 'react';
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
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Small delay to allow state to propagate after login
    const checkAuth = async () => {
      // Wait a tick for React state to settle
      await new Promise(resolve => setTimeout(resolve, 50));
      
      if (!loading) {
        // Also check localStorage as a fallback (for race conditions after login)
        const hasToken = localStorage.getItem('tdb_auth_token');
        const hasStoredUser = localStorage.getItem('user');
        
        // Check if user is logged in
        if (!user && !hasToken) {
          navigate('/login', { 
            state: { from: location.pathname, message: 'Please login to continue' },
            replace: true 
          });
          return;
        }
        
        // If we have token but no user in state, wait for auth context to catch up
        if (!user && hasToken && hasStoredUser) {
          // User just logged in, give React a moment to update state
          setIsChecking(true);
          return;
        }
        
        // Check membership if required
        if (requireMembership && user) {
          // STRICT ADMIN CHECK - Only explicit admin role
          const isAdmin = user?.role === 'admin' || user?.role === 'super_admin' || user?.is_admin === true;
          const hasActiveMembership = user?.pet_pass_status === 'active' || 
                                      user?.membership_status === 'active' ||
                                      user?.has_paid === true ||
                                      user?.membership_tier ||  // Has any membership tier
                                      user?.active_pet_pass;    // Has active pet pass
          
          if (!isAdmin && !hasActiveMembership) {
            navigate('/membership', { 
              state: { from: location.pathname, message: 'Join Pet Pass to access Mira OS' },
              replace: true 
            });
          }
        }
        
        setIsChecking(false);
      }
    };
    
    checkAuth();
  }, [user, loading, requireMembership, navigate, location]);

  // Show loading while checking auth or during initial check
  if (loading || isChecking) {
    // Check if we have a token - if so, show a nicer loading state
    const hasToken = typeof window !== 'undefined' && localStorage.getItem('tdb_auth_token');
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">{hasToken ? 'Loading your pets...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  // Show loading while redirecting (no user and no token)
  if (!user && !localStorage.getItem('tdb_auth_token')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center text-white">
          <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Checking access...</p>
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

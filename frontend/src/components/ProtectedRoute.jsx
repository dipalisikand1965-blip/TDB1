import React, { memo } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Pillar benefits mapping
const PILLAR_BENEFITS = {
  '/care': { icon: '🏥', title: 'Care & Wellbeing', benefit: 'Access vet recommendations, care schedules, and health tracking for your dog' },
  '/dine': { icon: '🍽️', title: 'Dine & Nutrition', benefit: 'Get personalized meal plans and nutrition guidance tailored to your dog\'s needs' },
  '/shop': { icon: '🛍️', title: 'Soul Shop', benefit: 'Discover curated products matched to your dog\'s soul profile and breed' },
  '/go': { icon: '🗺️', title: 'Go & Explore', benefit: 'Find dog-friendly places, trails, and adventures near you' },
  '/play': { icon: '🎾', title: 'Play & Activities', benefit: 'Discover activities and enrichment perfect for your dog\'s energy level' },
  '/learn': { icon: '📚', title: 'Learn & Train', benefit: 'Access training resources and expert guidance for your dog\'s development' },
  '/celebrate': { icon: '🎉', title: 'Celebrate', benefit: 'Plan special moments and celebrations for your beloved companion' },
  '/paperwork': { icon: '📋', title: 'Paperwork & Legal', benefit: 'Manage your dog\'s documents, registrations, and legal requirements' },
  '/emergency': { icon: '🚨', title: 'Emergency Care', benefit: 'Quick access to emergency contacts, procedures, and critical care information' },
  '/services': { icon: '⭐', title: 'Concierge Services', benefit: 'Book premium services from our vetted network of dog care professionals' },
  '/love': { icon: '💕', title: 'Love & Bond', benefit: 'Deepen your bond with personalized activities and connection rituals' },
  '/farewell': { icon: '🌈', title: 'Farewell & Legacy', benefit: 'Honor and remember your companion with dignity and love' },
};

const DEFAULT_BENEFIT = {
  icon: '🐾',
  title: 'The Doggy Company',
  benefit: 'Sign in to access personalized care for your dog'
};

const ProtectedRoute = ({ children, requireMembership = false }) => {
  const { user } = useAuth();
  const location = useLocation();

  const hasToken = typeof window !== 'undefined' ? localStorage.getItem('tdb_auth_token') : null;
  const storedUserStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;

  let storedUser = null;
  if (storedUserStr) {
    try { storedUser = JSON.parse(storedUserStr); } catch (e) {}
  }

  if (!hasToken) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  const effectiveUser = user || storedUser;

  if (requireMembership && effectiveUser) {
    const isAdmin = effectiveUser?.role === 'admin' || effectiveUser?.role === 'super_admin' || effectiveUser?.is_admin === true;
    const hasActiveMembership = effectiveUser?.pet_pass_status === 'active' ||
                                effectiveUser?.membership_status === 'active' ||
                                effectiveUser?.has_paid === true ||
                                effectiveUser?.membership_tier ||
                                effectiveUser?.active_pet_pass;

    if (!isAdmin && !hasActiveMembership) {
      return <Navigate to="/membership" state={{ from: location.pathname }} replace />;
    }
  }

  return children;
};

export default memo(ProtectedRoute);

/**
 * FitPage.jsx
 * Premium Pillar Page - Fit (Fitness & Wellness)
 * Elegant, service-soul-driven design with social proof & engagement
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { API_URL } from '../utils/api';
import { createFitRequest, showUnifiedFlowSuccess, showUnifiedFlowError } from '../utils/unifiedApi';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { toast } from '../hooks/use-toast';
import ServiceCatalogSection from '../components/ServiceCatalogSection';
import AdminQuickEdit from '../components/AdminQuickEdit';
import ProductCard from '../components/ProductCard';
import MultiPetSelector from '../components/MultiPetSelector';
import { getPetPhotoUrl } from '../utils/petAvatar';
import ConciergeExperienceCard from '../components/ConciergeExperienceCard';
import PillarServicesGrid from '../components/PillarServicesGrid';
import MiraPicksCarousel from '../components/MiraPicksCarousel';
import PersonalizedPicks from '../components/PersonalizedPicks';
// New engagement components
import { FitnessJourneyCounter, RotatingSocialProof } from '../components/SocialProofBadges';
import TransformationStories from '../components/TransformationStories';
import ConversationalEntry from '../components/ConversationalEntry';
import QuickWinTip from '../components/QuickWinTip';
import PillarPageLayout from '../components/PillarPageLayout';
import {
  Dumbbell, Heart, TrendingUp, Scale, Activity, Trophy,
  CheckCircle, ChevronRight, ChevronLeft, Sparkles, Star, Loader2, Send,
  ArrowRight, Play, ChevronDown, Target, Zap, PawPrint,
  Calendar, Award, ShoppingBag, Clock, X, Phone, Package,
  MessageCircle, Bookmark, Share2, ShoppingCart
} from 'lucide-react';

// Elevated Concierge® Fit Experiences
const FIT_EXPERIENCES = [
  {
    title: "Wellness Architect®",
    description: "Beyond basic fitness plans — we design comprehensive wellness journeys that consider your pet's breed, age, health conditions, and lifestyle. From nutrition to exercise to recovery.",
    icon: "🏋️",
    gradient: "from-teal-500 to-emerald-600",
    badge: "Holistic",
    badgeColor: "bg-teal-600",
    highlights: [
      "Comprehensive health assessment",
      "Custom nutrition & exercise plan",
      "Progress tracking & adjustments",
      "Veterinary coordination"
    ]
  },
  {
    title: "Weight Journey Partner®",
    description: "Weight management is a journey, not a quick fix. We create sustainable plans that work with your pet's metabolism, preferences, and your family's routine — celebrating every milestone together.",
    icon: "⚖️",
    gradient: "from-green-500 to-teal-600",
    badge: "Most Requested",
    badgeColor: "bg-green-600",
    highlights: [
      "Body condition scoring",
      "Calorie-controlled meal planning",
      "Exercise intensity calibration",
      "Monthly progress check-ins"
    ]
  },
  {
    title: "Active Lifestyle Curator®",
    description: "For pets who need more than walks. We curate swimming sessions, agility play, hiking adventures, and social activities that keep your pet mentally and physically engaged.",
    icon: "🏃",
    gradient: "from-emerald-500 to-cyan-600",
    highlights: [
      "Activity matching by energy level",
      "Swimming & hydrotherapy sessions",
      "Adventure planning & coordination",
      "Playgroup matchmaking"
    ]
  },
  {
    title: "Senior Wellness Companion®",
    description: "Aging gracefully requires special attention. We design gentle fitness routines, mobility support, and comfort measures that help your senior pet live their best years with dignity.",
    icon: "🦴",
    gradient: "from-amber-500 to-orange-600",
    highlights: [
      "Gentle mobility exercises",
      "Joint health supplements",
      "Comfort & pain management",
      "Quality of life monitoring"
    ]
  }
];

// Service Categories with metadata
const SERVICE_CATEGORIES = {
  assessment: { 
    icon: Activity, 
    color: 'bg-teal-500', 
    lightBg: 'bg-teal-50', 
    text: 'text-teal-700',
    gradient: 'from-teal-500 to-emerald-500',
    name: 'Assessment' 
  },
  training: { 
    icon: Dumbbell, 
    color: 'bg-green-500', 
    lightBg: 'bg-green-50', 
    text: 'text-green-700',
    gradient: 'from-green-500 to-teal-500',
    name: 'Training' 
  },
  weight: { 
    icon: Scale, 
    color: 'bg-emerald-500', 
    lightBg: 'bg-emerald-50', 
    text: 'text-emerald-700',
    gradient: 'from-emerald-500 to-cyan-500',
    name: 'Weight Management' 
  },
  therapy: { 
    icon: Heart, 
    color: 'bg-cyan-500', 
    lightBg: 'bg-cyan-50', 
    text: 'text-cyan-700',
    gradient: 'from-cyan-500 to-blue-500',
    name: 'Therapy' 
  },
  senior: { 
    icon: Award, 
    color: 'bg-amber-500', 
    lightBg: 'bg-amber-50', 
    text: 'text-amber-700',
    gradient: 'from-amber-500 to-orange-500',
    name: 'Senior Care' 
  },
  puppy: { 
    icon: PawPrint, 
    color: 'bg-pink-500', 
    lightBg: 'bg-pink-50', 
    text: 'text-pink-700',
    gradient: 'from-pink-500 to-rose-500',
    name: 'Puppy' 
  },
  agility: { 
    icon: Zap, 
    color: 'bg-yellow-500', 
    lightBg: 'bg-yellow-50', 
    text: 'text-yellow-700',
    gradient: 'from-yellow-500 to-lime-500',
    name: 'Agility' 
  },
  wellness: { 
    icon: Sparkles, 
    color: 'bg-purple-500', 
    lightBg: 'bg-purple-50', 
    text: 'text-purple-700',
    gradient: 'from-purple-500 to-violet-500',
    name: 'Wellness' 
  }
};

// Activity levels for form
const ACTIVITY_LEVELS = [
  { value: 'sedentary', label: 'Sedentary (Minimal activity)' },
  { value: 'light', label: 'Light (1-2 walks/day)' },
  { value: 'moderate', label: 'Moderate (Regular walks + play)' },
  { value: 'active', label: 'Active (Daily exercise)' },
  { value: 'very_active', label: 'Very Active (Athlete level)' }
];

const FITNESS_GOALS = [
  { value: 'weight_loss', label: 'Weight Loss', icon: '⚖️' },
  { value: 'muscle_building', label: 'Build Muscle', icon: '💪' },
  { value: 'endurance', label: 'Improve Endurance', icon: '🏃' },
  { value: 'flexibility', label: 'Better Flexibility', icon: '🧘' },
  { value: 'senior_mobility', label: 'Senior Mobility', icon: '🦮' },
  { value: 'energy_management', label: 'Energy Management', icon: '⚡' },
  { value: 'rehabilitation', label: 'Rehabilitation', icon: '🩹' }
];

const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80',
  'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=1200&q=80',
  'https://images.unsplash.com/photo-1546815693-7533bae19894?w=1200&q=80'
];

// ==================== SERVICE DETAIL MODAL ====================
const ServiceDetailModal = ({ service, isOpen, onClose, onBook, onAskConcierge, userPets }) => {
  if (!service) return null;
  
  const category = SERVICE_CATEGORIES[service.category] || SERVICE_CATEGORIES.assessment;
  const Icon = category.icon;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0">
      {/* Admin Quick Edit */}
      <AdminQuickEdit pillar="fit" position="bottom-left" />
    </PillarPageLayout>
  );
};
export default FitPage;

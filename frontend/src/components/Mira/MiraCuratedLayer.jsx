/**
 * MiraCuratedLayer.jsx
 * =====================
 * 
 * GOLD STANDARD: Universal wrapper component for the "Mira's Picks" concierge layer.
 * Ensures consistent, world-class mobile-first design across ALL pillar pages.
 * 
 * Features:
 * - Premium pillar-specific theming (colors, gradients, icons)
 * - Mobile-first responsive design with touch-optimized targets
 * - Glassmorphism effects with backdrop blur
 * - Smooth entrance animations with staggered loading
 * - Loading skeleton with shimmer effect
 * - Dark glass container for CuratedConciergeSection
 * - Integrated PersonalizedPillarSection below
 * 
 * Usage:
 * <MiraCuratedLayer
 *   pillar="care"
 *   activePet={activePet}
 *   token={token}
 *   userEmail={user?.email}
 *   isLoading={!activePet && token}
 * />
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Sparkles, Heart, Plane, GraduationCap, Gamepad, Dumbbell, FileText, Stethoscope, ShoppingBag, Scissors, Home, PawPrint } from 'lucide-react';
import { Badge } from '../ui/badge';
import CuratedConciergeSection from './CuratedConciergeSection';
import PersonalizedPillarSection from '../PersonalizedPillarSection';
import BreedSmartRecommendations from '../BreedSmartRecommendations';

// ═══════════════════════════════════════════════════════════════════════════════
// PILLAR THEME CONFIGURATIONS
// Each pillar has unique colors, gradients, icons, and copy
// ═══════════════════════════════════════════════════════════════════════════════

const PILLAR_THEMES = {
  celebrate: {
    name: 'Celebrate',
    icon: Sparkles,
    iconColor: 'text-fuchsia-500',
    badgeGradient: 'bg-gradient-to-r from-fuchsia-500 to-pink-500',
    containerGradient: 'bg-gradient-to-br from-slate-900 via-fuchsia-950/90 to-slate-900',
    title: (petName) => `Celebrations for ${petName}`,
    subtitle: (petName) => `Curated celebrations based on ${petName}'s personality`,
    description: 'Birthday parties, gotcha days, and special moments - all orchestrated by Concierge®'
  },
  dine: {
    name: 'Dine',
    icon: Crown,
    iconColor: 'text-orange-500',
    badgeGradient: 'bg-gradient-to-r from-orange-500 to-red-500',
    containerGradient: 'bg-gradient-to-br from-slate-900 via-orange-950/80 to-slate-900',
    title: (petName) => `Curated Dining for ${petName}`,
    subtitle: (petName) => `Personalized meal plans and dining experiences`,
    description: 'Fresh meals, treats, and pet-friendly restaurants - all tickets, all concierge.'
  },
  care: {
    name: 'Care',
    icon: Scissors,
    iconColor: 'text-teal-500',
    badgeGradient: 'bg-gradient-to-r from-teal-500 to-cyan-500',
    containerGradient: 'bg-gradient-to-br from-slate-900 via-teal-950/80 to-slate-900',
    title: (petName) => `Grooming & Care for ${petName}`,
    subtitle: (petName) => `Premium care services tailored to ${petName}'s needs`,
    description: 'Spa days, grooming sessions, and wellness care - personalized by Concierge®'
  },
  stay: {
    name: 'Stay',
    icon: Home,
    iconColor: 'text-emerald-500',
    badgeGradient: 'bg-gradient-to-r from-emerald-500 to-teal-500',
    containerGradient: 'bg-gradient-to-br from-slate-900 via-emerald-950/80 to-slate-900',
    title: (petName) => `Stays & Boarding for ${petName}`,
    subtitle: (petName) => `Temperament-matched accommodations for ${petName}`,
    description: 'Pet hotels, home sitters, and daycare - all vetted by Concierge®'
  },
  travel: {
    name: 'Travel',
    icon: Plane,
    iconColor: 'text-cyan-500',
    badgeGradient: 'bg-gradient-to-r from-cyan-500 to-teal-500',
    containerGradient: 'bg-gradient-to-br from-slate-900 via-cyan-950/80 to-slate-900',
    title: (petName) => `Travel Planning for ${petName}`,
    subtitle: (petName) => `Adventures and journeys designed for ${petName}`,
    description: 'Pet-friendly destinations, travel kits, and documentation - arranged by Concierge®'
  },
  learn: {
    name: 'Learn',
    icon: GraduationCap,
    iconColor: 'text-indigo-500',
    badgeGradient: 'bg-gradient-to-r from-indigo-500 to-blue-500',
    containerGradient: 'bg-gradient-to-br from-slate-900 via-indigo-950/80 to-slate-900',
    title: (petName) => `Training & Learning for ${petName}`,
    subtitle: (petName) => `Behavior programs crafted for ${petName}'s personality`,
    description: 'Training sessions, behavior consultations, and skill building - by expert trainers.'
  },
  enjoy: {
    name: 'Enjoy',
    icon: Gamepad,
    iconColor: 'text-yellow-500',
    badgeGradient: 'bg-gradient-to-r from-yellow-500 to-amber-500',
    containerGradient: 'bg-gradient-to-br from-slate-900 via-yellow-950/80 to-slate-900',
    title: (petName) => `Play & Activities for ${petName}`,
    subtitle: (petName) => `Fun experiences matched to ${petName}'s energy`,
    description: 'Playdates, adventures, and enrichment activities - curated for maximum joy.'
  },
  fit: {
    name: 'Fit',
    icon: Dumbbell,
    iconColor: 'text-lime-500',
    badgeGradient: 'bg-gradient-to-r from-lime-500 to-green-500',
    containerGradient: 'bg-gradient-to-br from-slate-900 via-lime-950/80 to-slate-900',
    title: (petName) => `Fitness & Wellness for ${petName}`,
    subtitle: (petName) => `Exercise programs designed for ${petName}'s health`,
    description: 'Swimming, agility, weight management - personalized fitness by Concierge®'
  },
  paperwork: {
    name: 'Paperwork',
    icon: FileText,
    iconColor: 'text-slate-500',
    badgeGradient: 'bg-gradient-to-r from-slate-500 to-gray-500',
    containerGradient: 'bg-gradient-to-br from-slate-900 via-slate-800/90 to-slate-900',
    title: (petName) => `Documents for ${petName}`,
    subtitle: (petName) => `All ${petName}'s paperwork organized and managed`,
    description: 'Licenses, health records, insurance - handled by Concierge®'
  },
  advisory: {
    name: 'Advisory',
    icon: Stethoscope,
    iconColor: 'text-indigo-500',
    badgeGradient: 'bg-gradient-to-r from-indigo-500 to-blue-500',
    containerGradient: 'bg-gradient-to-br from-slate-900 via-indigo-950/80 to-slate-900',
    title: (petName) => `Expert Advisory for ${petName}`,
    subtitle: (petName) => `Professional guidance for ${petName}'s wellbeing`,
    description: 'Nutrition, behavior, senior care consultations - expert advice on demand.'
  },
  services: {
    name: 'Services',
    icon: Crown,
    iconColor: 'text-amber-500',
    badgeGradient: 'bg-gradient-to-r from-amber-500 to-orange-500',
    containerGradient: 'bg-gradient-to-br from-slate-900 via-amber-950/80 to-slate-900',
    title: (petName) => `Concierge® Services for ${petName}`,
    subtitle: (petName) => `Premium services at ${petName}'s beck and call`,
    description: 'Personal shopping, event planning, emergency support - VIP treatment.'
  },
  shop: {
    name: 'Shop',
    icon: ShoppingBag,
    iconColor: 'text-fuchsia-500',
    badgeGradient: 'bg-gradient-to-r from-fuchsia-500 to-pink-500',
    containerGradient: 'bg-gradient-to-br from-slate-900 via-fuchsia-950/80 to-slate-900',
    title: (petName) => `Custom Shop for ${petName}`,
    subtitle: (petName) => `Personalized products made for ${petName}`,
    description: 'Custom collars, beds, photo products - created just for your pet.'
  }
};

// Default theme for unknown pillars
const DEFAULT_THEME = {
  name: 'Pet',
  icon: PawPrint,
  iconColor: 'text-purple-500',
  badgeGradient: 'bg-gradient-to-r from-purple-500 to-pink-500',
  containerGradient: 'bg-gradient-to-br from-slate-900 via-purple-950/80 to-slate-900',
  title: (petName) => `Mira's Picks for ${petName}`,
  subtitle: (petName) => `Curated recommendations for ${petName}`,
  description: 'Personalized picks by Concierge®'
};

/**
 * Premium Loading Skeleton with Shimmer Effect
 * Mobile-first design with proper touch-target sizes
 */
const LoadingSkeleton = ({ pillar }) => {
  const theme = PILLAR_THEMES[pillar] || DEFAULT_THEME;
  
  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
      {/* Header Skeleton */}
      <div className="text-center mb-6 sm:mb-8">
        <div className="inline-flex items-center px-4 py-2 rounded-full bg-gray-100 animate-pulse mb-4">
          <div className="w-4 h-4 rounded bg-gray-200 mr-2" />
          <div className="h-4 w-32 bg-gray-200 rounded" />
        </div>
        <div className="h-7 sm:h-8 bg-gray-100 rounded-lg w-64 mx-auto mb-3 animate-pulse" />
        <div className="h-4 sm:h-5 bg-gray-50 rounded-lg w-80 max-w-full mx-auto animate-pulse" />
      </div>
      
      {/* Cards Container Skeleton */}
      <div className={`${theme.containerGradient} rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl`}>
        <div className="space-y-3 sm:space-y-4">
          {[1, 2, 3].map((i) => (
            <div 
              key={i} 
              className="bg-white/5 rounded-xl p-4 animate-pulse"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/10 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="h-3 bg-white/10 rounded w-24 mb-2" />
                  <div className="h-4 sm:h-5 bg-white/15 rounded w-3/4 mb-1" />
                  <div className="h-3 bg-white/10 rounded w-full" />
                </div>
              </div>
              <div className="h-10 sm:h-11 bg-white/10 rounded-xl mt-4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Animation Variants for Framer Motion
 */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  }
};

/**
 * MiraCuratedLayer - GOLD STANDARD Universal wrapper for pillar curated sections
 * World-class mobile-first design with premium animations
 */
const MiraCuratedLayer = ({
  pillar,
  activePet,
  token,
  userEmail,
  isLoading = false,
  showPersonalizedSection = true,
  className = ''
}) => {
  // Get theme for this pillar
  const theme = PILLAR_THEMES[pillar] || DEFAULT_THEME;
  const IconComponent = theme.icon;
  
  // Show loading skeleton when waiting for pet data
  if (isLoading) {
    return <LoadingSkeleton pillar={pillar} />;
  }
  
  // Don't render if no pet or token
  if (!activePet || !token) {
    return null;
  }
  
  const petName = activePet.name || 'Your Pet';
  const petId = activePet.id || activePet._id;
  
  return (
    <motion.div 
      className={`max-w-6xl mx-auto px-4 py-6 sm:py-8 ${className}`}
      data-testid={`${pillar}-curated-layer`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION HEADER - Premium Badge + Title + Subtitle (Centered)
          Mobile-first typography with touch-optimized spacing
          ═══════════════════════════════════════════════════════════════════════ */}
      <motion.div className="text-center mb-6 sm:mb-8" variants={itemVariants}>
        <Badge 
          className={`${theme.badgeGradient} text-white px-4 py-2 mb-4 shadow-lg 
            text-xs sm:text-sm font-medium tracking-wide
            transform hover:scale-105 transition-transform duration-200`}
        >
          <IconComponent className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 inline" />
          Mira's Picks for {petName}
        </Badge>
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 sm:mb-3 tracking-tight">
          {theme.title(petName)}
        </h2>
        <p className="text-sm sm:text-base text-gray-600 max-w-xl mx-auto leading-relaxed px-2">
          {theme.subtitle(petName)}
        </p>
      </motion.div>
      
      {/* ═══════════════════════════════════════════════════════════════════════
          CURATED CONCIERGE SECTION - Server-driven cards
          Premium dark glass container with pillar-specific gradient
          Backdrop blur for glassmorphism effect
          ═══════════════════════════════════════════════════════════════════════ */}
      <motion.div 
        className={`${theme.containerGradient} rounded-2xl sm:rounded-3xl p-4 sm:p-6 
          shadow-2xl backdrop-blur-sm border border-white/5
          transform transition-all duration-300`}
        variants={itemVariants}
      >
        <CuratedConciergeSection
          petId={petId}
          petName={petName}
          pillar={pillar}
          token={token}
          userEmail={userEmail}
        />
      </motion.div>
      
      {/* ═══════════════════════════════════════════════════════════════════════
          PERSONALIZED PILLAR SECTION - Static curated items
          Horizontal scroll with desktop buttons
          Mobile-optimized touch interactions
          ═══════════════════════════════════════════════════════════════════════ */}
      {showPersonalizedSection && (
        <motion.div 
          className="mt-6 sm:mt-8" 
          data-testid={`personalized-${pillar}-wrapper`}
          variants={itemVariants}
        >
          <PersonalizedPillarSection
            pillar={pillar}
            pet={activePet}
            token={token}
            userEmail={userEmail}
          />
        </motion.div>
      )}
      
      {/* ═══════════════════════════════════════════════════════════════════════
          BREED-SMART RECOMMENDATIONS - From breed_matrix
          Shows breed-specific product recommendations
          "Mira Recommends for {Breed}" - Concierge® assisted
          ═══════════════════════════════════════════════════════════════════════ */}
      {activePet && activePet.breed && (
        <motion.div 
          className="mt-6 sm:mt-8" 
          data-testid={`breed-smart-${pillar}-wrapper`}
          variants={itemVariants}
        >
          <BreedSmartRecommendations
            pillar={pillar}
            pet={activePet}
            token={token}
            userEmail={userEmail}
            maxItems={6}
          />
        </motion.div>
      )}
    </motion.div>
  );
};

export default MiraCuratedLayer;
export { PILLAR_THEMES };

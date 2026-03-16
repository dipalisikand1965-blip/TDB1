/**
 * MiraOrb - The Soul of the Pet, Guide to the Pet Parent
 * 
 * An abstract presence token - a softly animated orb with breathing light 
 * and listening pulses. Mira feels alive through motion and response.
 * 
 * VISUAL STYLE: Pink-to-Purple gradient with white sparkle icon (matching landing page)
 * 
 * States:
 * - idle: Gentle breathing pulse
 * - listening: Expanding ripples, ears perked
 * - thinking: Swirling particles, contemplating
 * - speaking: Wave-form animation, sharing wisdom
 * - celebrating: Burst of joy particles
 */

import React, { useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import hapticFeedback from '../utils/haptic';

// Mira's soul colors - Pink to Purple gradient (matching landing page)
const MIRA_COLORS = {
  primary: '#EC4899',      // Pink - magenta/hot pink
  secondary: '#9333EA',    // Purple - deep purple
  glow: '#F472B6',         // Light pink - aura
  listening: '#3B82F6',    // Blue - attention
  thinking: '#F59E0B',     // Amber - processing
  speaking: '#10B981',     // Emerald - guidance
  celebrating: '#F472B6',  // Pink - joy
  aura: '#DB2777',         // Rose - mystical aura
};

// Particle component for ambient effects - xOffset and yOffset pre-computed
const Particle = ({ delay, duration, size, color, xOffset, yOffset }) => (
  <motion.div
    className="absolute rounded-full"
    style={{
      width: size,
      height: size,
      background: color,
      filter: 'blur(1px)',
    }}
    initial={{ 
      opacity: 0, 
      scale: 0,
      x: 0,
      y: 0,
    }}
    animate={{ 
      opacity: [0, 0.8, 0],
      scale: [0, 1, 0.5],
      x: xOffset,
      y: yOffset,
    }}
    transition={{
      duration: duration,
      delay: delay,
      repeat: Infinity,
      ease: "easeOut",
    }}
  />
);

// Ripple effect for listening state
const ListeningRipple = ({ delay }) => (
  <motion.div
    className="absolute inset-0 rounded-full border-2 border-purple-400/30"
    initial={{ scale: 1, opacity: 0.6 }}
    animate={{ scale: 2.5, opacity: 0 }}
    transition={{
      duration: 2,
      delay: delay,
      repeat: Infinity,
      ease: "easeOut",
    }}
  />
);

// Pre-computed deterministic particle configurations to avoid Math.random in render
const PARTICLE_PRESETS = [
  { duration: 2.3, size: 6, xOffset: 25, yOffset: -18 },
  { duration: 3.1, size: 8, xOffset: -22, yOffset: 28 },
  { duration: 2.7, size: 5, xOffset: 30, yOffset: 12 },
  { duration: 3.5, size: 7, xOffset: -28, yOffset: -25 },
  { duration: 2.5, size: 9, xOffset: 15, yOffset: 30 },
  { duration: 3.2, size: 6, xOffset: -20, yOffset: -15 },
  { duration: 2.8, size: 8, xOffset: 28, yOffset: -22 },
  { duration: 3.0, size: 5, xOffset: -25, yOffset: 20 },
  { duration: 2.4, size: 7, xOffset: 18, yOffset: 25 },
  { duration: 3.3, size: 6, xOffset: -15, yOffset: -28 },
  { duration: 2.6, size: 8, xOffset: 22, yOffset: -12 },
  { duration: 3.4, size: 5, xOffset: -30, yOffset: 18 },
];

// Pillar-specific colors and icons for orb badge
const PILLAR_THEMES = {
  celebrate: { emoji: '🎂', color: '#EC4899', colorSecondary: '#DB2777', label: 'Celebrate' },
  dine: { emoji: '🍽️', color: '#F59E0B', colorSecondary: '#D97706', label: 'Dine' },
  stay: { emoji: '🏠', color: '#10B981', colorSecondary: '#059669', label: 'Stay' },
  travel: { emoji: '✈️', color: '#3B82F6', colorSecondary: '#2563EB', label: 'Travel' },
  care: { emoji: '💊', color: '#14B8A6', colorSecondary: '#0D9488', label: 'Care' },
  enjoy: { emoji: '🎾', color: '#8B5CF6', colorSecondary: '#7C3AED', label: 'Enjoy' },
  fit: { emoji: '🏃', color: '#EF4444', colorSecondary: '#DC2626', label: 'Fit' },
  learn: { emoji: '📚', color: '#6366F1', colorSecondary: '#4F46E5', label: 'Learn' },
  emergency: { emoji: '🚨', color: '#DC2626', colorSecondary: '#B91C1C', label: 'Emergency' },
  farewell: { emoji: '🌈', color: '#9CA3AF', colorSecondary: '#6B7280', label: 'Farewell' },
  shop: { emoji: '🛍️', color: '#9333EA', colorSecondary: '#7E22CE', label: 'Shop' },
  default: { emoji: '✨', color: '#9333EA', colorSecondary: '#EC4899', label: 'Mira' }
};

// The main Mira Orb component
const MiraOrb = ({ 
  state = 'idle', // idle, listening, thinking, speaking, celebrating
  pillar = null, // Current pillar context (celebrate, travel, care, etc.)
  onClick,
  size = 'md', // sm, md, lg
  showLabel = false, // Label hidden by default - the orb speaks for itself
  className = '',
}) => {
  const orbRef = useRef(null);
  
  // Get pillar theme — drives orb color when a specific pillar is active
  const pillarTheme = PILLAR_THEMES[pillar] || PILLAR_THEMES.default;
  // Orb gradient: use pillar color when specified, otherwise the default pink/purple
  const orbPrimary = pillar ? pillarTheme.color : MIRA_COLORS.primary;
  const orbSecondary = pillar ? pillarTheme.colorSecondary : MIRA_COLORS.secondary;
  
  // Size configurations - Enhanced glow radius
  const sizes = {
    sm: { orb: 48, glow: 80, outerGlow: 100, particles: 4 },
    md: { orb: 64, glow: 110, outerGlow: 140, particles: 6 },
    lg: { orb: 80, glow: 140, outerGlow: 180, particles: 8 },
  };
  
  const config = sizes[size];
  
  // Generate particles based on state using pre-computed values
  const particles = useMemo(() => {
    const particleCount = state === 'celebrating' ? 12 : config.particles;
    return Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      delay: i * 0.3,
      ...PARTICLE_PRESETS[i % PARTICLE_PRESETS.length],
      color: state === 'celebrating' 
        ? ['#EC4899', '#F59E0B', '#10B981', '#3B82F6'][i % 4]
        : MIRA_COLORS.glow,
    }));
  }, [state, config]);
  
  // Animation variants for different states
  const orbVariants = {
    idle: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut",
      }
    },
    listening: {
      scale: [1, 1.1, 1],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut",
      }
    },
    thinking: {
      rotate: [0, 360],
      scale: [1, 1.08, 1],
      transition: {
        rotate: { duration: 4, repeat: Infinity, ease: "linear" },
        scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
      }
    },
    speaking: {
      scale: [1, 1.12, 1.05, 1.1, 1],
      transition: {
        duration: 0.8,
        repeat: Infinity,
        ease: "easeInOut",
      }
    },
    celebrating: {
      scale: [1, 1.2, 1],
      rotate: [0, 10, -10, 0],
      transition: {
        duration: 0.6,
        repeat: Infinity,
        ease: "easeInOut",
      }
    },
  };
  
  // Glow animation variants
  const glowVariants = {
    idle: {
      opacity: [0.4, 0.7, 0.4],
      scale: [1, 1.1, 1],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut",
      }
    },
    listening: {
      opacity: [0.5, 0.9, 0.5],
      scale: [1, 1.3, 1],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut",
      }
    },
    thinking: {
      opacity: [0.6, 0.8, 0.6],
      scale: [1, 1.2, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      }
    },
    speaking: {
      opacity: [0.5, 1, 0.5],
      scale: [1, 1.25, 1],
      transition: {
        duration: 0.8,
        repeat: Infinity,
        ease: "easeInOut",
      }
    },
    celebrating: {
      opacity: [0.6, 1, 0.6],
      scale: [1, 1.4, 1],
      transition: {
        duration: 0.6,
        repeat: Infinity,
        ease: "easeInOut",
      }
    },
  };
  
  // Get state-specific colors
  const getStateColor = () => {
    switch (state) {
      case 'listening': return MIRA_COLORS.listening;
      case 'thinking': return MIRA_COLORS.thinking;
      case 'speaking': return MIRA_COLORS.speaking;
      case 'celebrating': return MIRA_COLORS.celebrating;
      default: return MIRA_COLORS.primary;
    }
  };
  
  // Get state label
  const getStateLabel = () => {
    switch (state) {
      case 'listening': return 'Listening...';
      case 'thinking': return 'Thinking...';
      case 'speaking': return 'Speaking...';
      case 'celebrating': return '✨';
      default: return 'Ask Mira';
    }
  };

  return (
    <div 
      className={`relative flex flex-col items-center ${className}`}
      ref={orbRef}
    >
      {/* Ambient particles */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {particles.map((particle) => (
          <Particle key={particle.id} {...particle} />
        ))}
      </div>
      
      {/* Listening ripples */}
      <AnimatePresence>
        {state === 'listening' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <ListeningRipple delay={0} />
            <ListeningRipple delay={0.5} />
            <ListeningRipple delay={1} />
          </div>
        )}
      </AnimatePresence>
      
      {/* Outer ethereal glow - the mystical aura */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: config.outerGlow,
          height: config.outerGlow,
          background: `radial-gradient(circle, ${MIRA_COLORS.aura}25 0%, ${MIRA_COLORS.secondary}15 40%, transparent 70%)`,
          filter: 'blur(12px)',
        }}
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      {/* Inner glow - soul light */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: config.glow,
          height: config.glow,
          background: `radial-gradient(circle, ${getStateColor()}50 0%, ${orbPrimary}30 50%, transparent 70%)`,
          filter: 'blur(8px)',
        }}
        variants={glowVariants}
        animate={state}
      />
      
      {/* Main orb button - the soul vessel */}
      <motion.button
        onClick={(e) => {
          // Haptic feedback for mobile devices (iOS + Android)
          hapticFeedback.buttonTap(e);
          onClick?.(e);
        }}
        className="relative rounded-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-offset-2"
        style={{
          width: config.orb,
          height: config.orb,
          background: `linear-gradient(135deg, ${orbPrimary} 0%, ${orbSecondary} 100%)`,
          boxShadow: `
            0 0 30px ${orbPrimary}70, 
            0 0 60px ${orbSecondary}40,
            0 0 80px ${orbPrimary}20,
            inset 0 0 20px rgba(255,255,255,0.3)
          `,
        }}
        variants={orbVariants}
        animate={state}
        whileHover={{ 
          scale: 1.15,
          boxShadow: `
            0 0 40px ${orbPrimary}80, 
            0 0 80px ${orbSecondary}50,
            0 0 100px ${orbPrimary}30,
            inset 0 0 25px rgba(255,255,255,0.4)
          `,
        }}
        whileTap={{ scale: 0.95 }}
        data-testid="mira-orb"
      >
        {/* Inner light core */}
        <motion.div
          className="absolute inset-2 rounded-full"
          style={{
            background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4) 0%, transparent 60%)',
          }}
          animate={{
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        
        {/* Thinking swirl indicator */}
        {state === 'thinking' && (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: `conic-gradient(from 0deg, transparent, ${MIRA_COLORS.thinking}60, transparent)`,
            }}
            animate={{ rotate: 360 }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        )}
        
        {/* Speaking wave indicator */}
        {state === 'speaking' && (
          <div className="absolute inset-0 flex items-center justify-center">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="absolute w-1 bg-white/60 rounded-full"
                style={{ height: 12 + i * 4 }}
                animate={{
                  scaleY: [1, 1.5, 1],
                  opacity: [0.6, 1, 0.6],
                }}
                transition={{
                  duration: 0.4,
                  delay: i * 0.1,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        )}
        
        {/* Sparkle icon - matching landing page style */}
        <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-white" strokeWidth={2} />
      </motion.button>
      
      {/* State label */}
      {showLabel && (
        <motion.span
          className="mt-2 text-xs font-medium text-gray-600"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          key={state}
        >
          {getStateLabel()}
        </motion.span>
      )}
    </div>
  );
};

export default MiraOrb;

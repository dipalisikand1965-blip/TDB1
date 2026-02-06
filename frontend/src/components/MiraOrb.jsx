/**
 * MiraOrb - Silent Presence
 * 
 * "I'm here. I'm listening. You don't need to manage this."
 * 
 * Design philosophy:
 * - Mira does not perform
 * - Mira does not show off  
 * - Mira listens
 * - The glow does the talking. The core stays silent.
 * - She was already there before the user noticed.
 * - She will remain when the user leaves.
 * - She doesn't compete with content.
 * 
 * That's concierge energy.
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

// The organic blob shape - asymmetric, abstract
const BLOB_PATH = "M 50 5 C 62 5 72 8 78 12 C 84 16 88 22 90 32 C 94 48 92 65 88 78 C 84 88 76 94 65 96 C 55 98 45 98 35 96 C 24 94 16 88 12 78 C 8 65 6 48 10 32 C 12 22 16 16 22 12 C 28 8 38 5 50 5 Z";

// Context-aware glow states
// Same form. Same dignity. Subtle emotional shifts.
const GLOW_CONTEXTS = {
  default: {
    primary: '#9F1239',      // Deep rose - warm, contained
    secondary: '#6D28D9',    // Deep violet undertone
    intensity: 1,
    spread: 1,
    warmth: 0,
  },
  listening: {
    primary: '#9F1239',
    secondary: '#6D28D9',
    intensity: 1,
    spread: 1,
    warmth: 0,
  },
  emergency: {
    primary: '#7F1D1D',      // Darker, tighter - urgency without alarm
    secondary: '#4C1D95',    
    intensity: 0.8,
    spread: 0.85,
    warmth: -0.1,
  },
  celebrate: {
    primary: '#BE185D',      // Slightly warmer pink - joy
    secondary: '#7C3AED',    
    intensity: 1.05,
    spread: 1.08,
    warmth: 0.1,
  },
  inactive: {
    primary: '#1C1917',      // Near-black - dormant
    secondary: '#1E1B4B',    
    intensity: 0.15,
    spread: 0.7,
    warmth: 0,
  },
  // Pillar contexts map to emotional states
  shop: { primary: '#9F1239', secondary: '#6D28D9', intensity: 1, spread: 1, warmth: 0 },
  care: { primary: '#9F1239', secondary: '#6D28D9', intensity: 0.95, spread: 0.95, warmth: 0 },
  travel: { primary: '#9F1239', secondary: '#6D28D9', intensity: 1, spread: 1.02, warmth: 0.05 },
  dine: { primary: '#9F1239', secondary: '#6D28D9', intensity: 1, spread: 1, warmth: 0.05 },
  stay: { primary: '#9F1239', secondary: '#6D28D9', intensity: 0.95, spread: 0.95, warmth: 0 },
};

// Core colors - void with depth
const CORE = {
  fill: '#030303',           // True black
  edge: '#0a0a0a',           // Outer feather
  innerVoid: '#000000',      // Micro shadow inward
};

const MiraOrb = ({ 
  onClick,
  size = 'md',
  context = 'default', // emotional context: default, listening, emergency, celebrate, inactive, or pillar name
  className = '',
}) => {
  const sizes = {
    sm: { container: 60, orb: 44, blur: 14 },
    md: { container: 76, orb: 56, blur: 20 },
    lg: { container: 92, orb: 68, blur: 26 },
  };
  
  const config = sizes[size];
  const glowState = GLOW_CONTEXTS[context] || GLOW_CONTEXTS.default;

  // Generate unique filter ID (stable per instance)
  const filterId = useMemo(() => `mira-film-${Math.random().toString(36).substr(2, 9)}`, []);
  const gradientId = useMemo(() => `mira-falloff-${Math.random().toString(36).substr(2, 9)}`, []);
  const innerShadowId = useMemo(() => `mira-void-${Math.random().toString(36).substr(2, 9)}`, []);

  return (
    <div 
      className={`relative flex items-center justify-center ${className}`}
      style={{
        width: config.container,
        height: config.container,
      }}
    >
      {/* SVG Definitions - film grain + directional falloff */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          {/* Filmic softness filter - optical bloom, not digital */}
          <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
            {/* Subtle grain - fractal noise at very low intensity */}
            <feTurbulence 
              type="fractalNoise" 
              baseFrequency="0.8" 
              numOctaves="3" 
              result="grain"
            />
            {/* Mix grain with very low opacity */}
            <feColorMatrix
              in="grain"
              type="matrix"
              values="0 0 0 0 0.5
                      0 0 0 0 0.5
                      0 0 0 0 0.5
                      0 0 0 0.03 0"
              result="softGrain"
            />
            {/* Soft diffusion */}
            <feGaussianBlur in="SourceGraphic" stdDeviation="0.3" result="softened" />
            {/* Blend grain over softened glow */}
            <feBlend in="softened" in2="softGrain" mode="overlay" result="filmic" />
          </filter>
          
          {/* Directional falloff gradient - dissolves faster on one side */}
          <radialGradient id={gradientId} cx="75%" cy="75%" r="70%" fx="80%" fy="80%">
            <stop offset="0%" stopColor={glowState.primary} stopOpacity="1" />
            <stop offset="35%" stopColor={glowState.primary} stopOpacity="0.7" />
            <stop offset="60%" stopColor={glowState.primary} stopOpacity="0.3" />
            <stop offset="85%" stopColor={glowState.primary} stopOpacity="0.05" />
            <stop offset="100%" stopColor={glowState.primary} stopOpacity="0" />
          </radialGradient>
          
          {/* Inner shadow filter for void depth */}
          <filter id={innerShadowId} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" />
            <feOffset in="blur" dx="0" dy="0" result="offsetBlur" />
            <feFlood floodColor="#000000" floodOpacity="0.4" />
            <feComposite in2="offsetBlur" operator="in" />
            <feComposite in2="SourceGraphic" operator="over" />
          </filter>
        </defs>
      </svg>

      {/* Primary glow - STRONG directional falloff */}
      {/* Bottom-right: present. Top-left: dissolves into darkness */}
      <motion.div
        className="absolute pointer-events-none"
        style={{
          width: config.container * 1.6 * glowState.spread,
          height: config.container * 1.6 * glowState.spread,
          filter: `blur(${config.blur}px) url(#${filterId})`,
          transform: 'translate(18%, 15%)', // Offset creates directionality
        }}
        animate={{
          opacity: [0.5 * glowState.intensity, 0.56 * glowState.intensity, 0.5 * glowState.intensity],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path d={BLOB_PATH} fill={`url(#${gradientId})`} />
        </svg>
      </motion.div>

      {/* Secondary glow - violet undertone, opposite side, faster dissolve */}
      <motion.div
        className="absolute pointer-events-none"
        style={{
          width: config.container * 1.15 * glowState.spread,
          height: config.container * 1.15 * glowState.spread,
          filter: `blur(${config.blur * 2}px)`,
          transform: 'translate(-10%, -8%)',
          opacity: 0.12 * glowState.intensity,
        }}
        animate={{
          opacity: [0.1 * glowState.intensity, 0.15 * glowState.intensity, 0.1 * glowState.intensity],
        }}
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path d={BLOB_PATH} fill={glowState.secondary} />
        </svg>
      </motion.div>

      {/* Accent glow - concentrated escape point, barely there */}
      <motion.div
        className="absolute pointer-events-none"
        style={{
          width: config.container * 0.7,
          height: config.container * 0.7,
          filter: `blur(${config.blur * 0.6}px)`,
          transform: 'translate(28%, 24%)', // Strong offset - light escapes here
          opacity: 0.35 * glowState.intensity,
        }}
        animate={{
          opacity: [0.3 * glowState.intensity, 0.4 * glowState.intensity, 0.3 * glowState.intensity],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path d={BLOB_PATH} fill={glowState.primary} />
        </svg>
      </motion.div>

      {/* Core outer feather - 2-3px soft edge, imperceptible */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: config.orb + 5,
          height: config.orb + 5,
          filter: 'blur(2.5px)',
          opacity: 0.75,
        }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path d={BLOB_PATH} fill={CORE.edge} />
        </svg>
      </div>

      {/* Core micro-shadow inward - void with depth */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: config.orb + 1,
          height: config.orb + 1,
        }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full" style={{ filter: `url(#${innerShadowId})` }}>
          <path d={BLOB_PATH} fill={CORE.fill} />
        </svg>
      </div>

      {/* The core - true void, matte, silent */}
      <motion.button
        onClick={(e) => {
          if (navigator.vibrate) {
            navigator.vibrate(20);
          }
          onClick?.(e);
        }}
        className="relative cursor-pointer focus:outline-none"
        style={{
          width: config.orb,
          height: config.orb,
        }}
        whileHover={{ 
          scale: 1.04,
        }}
        whileTap={{ scale: 0.97 }}
        data-testid="mira-orb"
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path d={BLOB_PATH} fill={CORE.fill} />
        </svg>
      </motion.button>
    </div>
  );
};

export default MiraOrb;

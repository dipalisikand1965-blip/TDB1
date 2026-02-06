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

import React from 'react';
import { motion } from 'framer-motion';

// The organic blob shape - asymmetric, abstract
const BLOB_PATH = "M 50 5 C 62 5 72 8 78 12 C 84 16 88 22 90 32 C 94 48 92 65 88 78 C 84 88 76 94 65 96 C 55 98 45 98 35 96 C 24 94 16 88 12 78 C 8 65 6 48 10 32 C 12 22 16 16 22 12 C 28 8 38 5 50 5 Z";

// State-aware color variations
// Same form. Same dignity. Subtle emotional shifts.
const GLOW_STATES = {
  default: {
    primary: '#BE185D',      // Deep magenta
    secondary: '#7C3AED',    // Violet undertone
    intensity: 1,
    spread: 1,
  },
  listening: {
    primary: '#BE185D',
    secondary: '#7C3AED',
    intensity: 1,
    spread: 1,
  },
  emergency: {
    primary: '#9F1239',      // Darker, tighter magenta
    secondary: '#6D28D9',    // Deeper violet
    intensity: 0.85,
    spread: 0.9,
  },
  celebrate: {
    primary: '#DB2777',      // Slightly warmer pink
    secondary: '#8B5CF6',    // Warmer violet
    intensity: 1.1,
    spread: 1.05,
  },
  inactive: {
    primary: '#4C1D3D',      // Near-black magenta
    secondary: '#2E1065',    // Near-black violet
    intensity: 0.3,
    spread: 0.8,
  },
};

// Core colors
const CORE = {
  fill: '#030303',           // True black
  edge: '#0a0a0a',           // Feathered edge
  innerShadow: '#000000',    // Void depth
};

const MiraOrb = ({ 
  onClick,
  size = 'md',
  context = 'default', // default, listening, emergency, celebrate, inactive
  className = '',
}) => {
  const sizes = {
    sm: { container: 60, orb: 44, blur: 16 },
    md: { container: 76, orb: 56, blur: 22 },
    lg: { container: 92, orb: 68, blur: 28 },
  };
  
  const config = sizes[size];
  const glowState = GLOW_STATES[context] || GLOW_STATES.default;

  // Unique filter ID to prevent conflicts
  const filterId = `mira-grain-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div 
      className={`relative flex items-center justify-center ${className}`}
      style={{
        width: config.container,
        height: config.container,
      }}
    >
      {/* SVG filter for filmic grain/bloom - barely there */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <filter id={filterId}>
            {/* Soft diffusion / optical bloom */}
            <feGaussianBlur stdDeviation="0.5" result="blur" />
            {/* Barely-there grain - filmic, not digital */}
            <feTurbulence 
              type="fractalNoise" 
              baseFrequency="0.9" 
              numOctaves="4" 
              result="noise"
            />
            <feDisplacementMap 
              in="blur" 
              in2="noise" 
              scale="1.5" 
              xChannelSelector="R" 
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      {/* Primary glow - STRONG directional falloff */}
      {/* Bottom-right: full presence. Top-left: dissolves into darkness */}
      <motion.div
        className="absolute pointer-events-none"
        style={{
          width: config.container * 1.5 * glowState.spread,
          height: config.container * 1.5 * glowState.spread,
          filter: `blur(${config.blur}px) url(#${filterId})`,
          transform: 'translate(15%, 12%)', // Strong offset - creates directionality
          opacity: 0.6 * glowState.intensity,
        }}
        animate={{
          opacity: [0.55 * glowState.intensity, 0.62 * glowState.intensity, 0.55 * glowState.intensity],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            {/* Radial gradient for directional falloff */}
            <radialGradient id="glowFalloff" cx="70%" cy="70%" r="60%">
              <stop offset="0%" stopColor={glowState.primary} stopOpacity="1" />
              <stop offset="60%" stopColor={glowState.primary} stopOpacity="0.5" />
              <stop offset="100%" stopColor={glowState.primary} stopOpacity="0" />
            </radialGradient>
          </defs>
          <path d={BLOB_PATH} fill="url(#glowFalloff)" />
        </svg>
      </motion.div>

      {/* Secondary glow - violet undertone, opposite offset, faster falloff */}
      <motion.div
        className="absolute pointer-events-none"
        style={{
          width: config.container * 1.2 * glowState.spread,
          height: config.container * 1.2 * glowState.spread,
          filter: `blur(${config.blur * 1.8}px)`,
          transform: 'translate(-8%, -5%)',
          opacity: 0.18 * glowState.intensity,
        }}
        animate={{
          opacity: [0.15 * glowState.intensity, 0.22 * glowState.intensity, 0.15 * glowState.intensity],
        }}
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5,
        }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path d={BLOB_PATH} fill={glowState.secondary} />
        </svg>
      </motion.div>

      {/* Accent glow - intense spot where light "escapes" */}
      <motion.div
        className="absolute pointer-events-none"
        style={{
          width: config.container * 0.9,
          height: config.container * 0.9,
          filter: `blur(${config.blur * 0.7}px)`,
          transform: 'translate(20%, 18%)', // Concentrated escape point
          opacity: 0.45 * glowState.intensity,
        }}
        animate={{
          opacity: [0.4 * glowState.intensity, 0.5 * glowState.intensity, 0.4 * glowState.intensity],
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

      {/* Core outer feather - 2px soft edge */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: config.orb + 6,
          height: config.orb + 6,
          filter: 'blur(3px)',
          opacity: 0.7,
        }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path d={BLOB_PATH} fill={CORE.edge} />
        </svg>
      </div>

      {/* Core inner shadow - micro shadow inward for void depth */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: config.orb - 2,
          height: config.orb - 2,
          filter: 'blur(4px)',
          opacity: 0.5,
        }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path d={BLOB_PATH} fill={CORE.innerShadow} />
        </svg>
      </div>

      {/* The core - void with depth, not a cutout */}
      <motion.button
        onClick={(e) => {
          if (navigator.vibrate) {
            navigator.vibrate(25);
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

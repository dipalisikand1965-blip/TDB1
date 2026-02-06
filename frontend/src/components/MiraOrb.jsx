/**
 * MiraOrb - Silent Presence
 * 
 * "I'm here. I'm listening. You don't need to manage this."
 * 
 * The glow must GLOW - luminous, radiant, alive.
 * Not a dark stain. Light escaping from presence.
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

// The organic blob shape - asymmetric, abstract
const BLOB_PATH = "M 50 5 C 62 5 72 8 78 12 C 84 16 88 22 90 32 C 94 48 92 65 88 78 C 84 88 76 94 65 96 C 55 98 45 98 35 96 C 24 94 16 88 12 78 C 8 65 6 48 10 32 C 12 22 16 16 22 12 C 28 8 38 5 50 5 Z";

// Context-aware glow colors
const GLOW_CONTEXTS = {
  default: { color: '#ec4899', intensity: 1 },      // Pink/magenta
  listening: { color: '#ec4899', intensity: 1 },
  emergency: { color: '#be123c', intensity: 0.9 },  // Darker rose
  celebrate: { color: '#f472b6', intensity: 1.1 },  // Warmer pink
  inactive: { color: '#4a044e', intensity: 0.3 },   // Near-black purple
  shop: { color: '#ec4899', intensity: 1 },
  care: { color: '#ec4899', intensity: 0.95 },
  travel: { color: '#ec4899', intensity: 1 },
};

const MiraOrb = ({ 
  onClick,
  size = 'md',
  context = 'default',
  className = '',
}) => {
  const sizes = {
    sm: { container: 72, orb: 40 },
    md: { container: 88, orb: 52 },
    lg: { container: 104, orb: 64 },
  };
  
  const config = sizes[size];
  const glowState = GLOW_CONTEXTS[context] || GLOW_CONTEXTS.default;
  const glowColor = glowState.color;

  // Unique IDs for SVG filters
  const filterId = useMemo(() => `mira-glow-${Math.random().toString(36).substr(2, 9)}`, []);

  return (
    <div 
      className={`relative flex items-center justify-center ${className}`}
      style={{
        width: config.container,
        height: config.container,
      }}
    >
      {/* The GLOW - luminous, radiant, alive */}
      {/* Multiple layers create depth and that "light escaping" feel */}
      
      {/* Layer 1: Outer soft glow - widest, most diffuse */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: config.container * 1.8,
          height: config.container * 1.8,
          background: `radial-gradient(circle, ${glowColor}40 0%, ${glowColor}20 40%, transparent 70%)`,
          filter: 'blur(20px)',
        }}
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.6 * glowState.intensity, 0.8 * glowState.intensity, 0.6 * glowState.intensity],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Layer 2: Mid glow - brighter, more defined */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: config.container * 1.4,
          height: config.container * 1.4,
          background: `radial-gradient(circle, ${glowColor}70 0%, ${glowColor}40 50%, transparent 80%)`,
          filter: 'blur(12px)',
        }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.7 * glowState.intensity, 0.9 * glowState.intensity, 0.7 * glowState.intensity],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5,
        }}
      />

      {/* Layer 3: Inner intense glow - the hot core aura */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: config.container * 1.1,
          height: config.container * 1.1,
          background: `radial-gradient(circle, ${glowColor}90 0%, ${glowColor}60 40%, transparent 70%)`,
          filter: 'blur(8px)',
        }}
        animate={{
          scale: [1, 1.08, 1],
          opacity: [0.8 * glowState.intensity, 1 * glowState.intensity, 0.8 * glowState.intensity],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.2,
        }}
      />

      {/* Layer 4: Asymmetric accent - light escaping on one side */}
      <motion.div
        className="absolute pointer-events-none"
        style={{
          width: config.container * 0.9,
          height: config.container * 0.9,
          background: `radial-gradient(circle at 70% 70%, ${glowColor}80 0%, transparent 60%)`,
          filter: 'blur(10px)',
          transform: 'translate(15%, 15%)',
        }}
        animate={{
          opacity: [0.5 * glowState.intensity, 0.7 * glowState.intensity, 0.5 * glowState.intensity],
        }}
        transition={{
          duration: 3.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* The CORE - true black void */}
      {/* Soft edge feather for depth */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: config.orb + 6,
          height: config.orb + 6,
        }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full" style={{ filter: 'blur(3px)', opacity: 0.7 }}>
          <path d={BLOB_PATH} fill="#0a0a0a" />
        </svg>
      </div>

      {/* The actual core button */}
      <motion.button
        onClick={(e) => {
          if (navigator.vibrate) navigator.vibrate(20);
          onClick?.(e);
        }}
        className="relative cursor-pointer focus:outline-none"
        style={{
          width: config.orb,
          height: config.orb,
          filter: `drop-shadow(0 0 20px ${glowColor}60)`,
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.97 }}
        data-testid="mira-orb"
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path d={BLOB_PATH} fill="#050505" />
        </svg>
      </motion.button>
    </div>
  );
};

export default MiraOrb;

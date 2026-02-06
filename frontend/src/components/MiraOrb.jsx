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
 */

import React from 'react';
import { motion } from 'framer-motion';

// The organic blob shape - abstract, with barely perceptible pressure bulges
// Not ears. Not cute. Just... pet-aware.
const BLOB_PATH = "M 50 5 C 62 5 72 8 78 12 C 84 16 88 22 90 32 C 94 48 92 65 88 78 C 84 88 76 94 65 96 C 55 98 45 98 35 96 C 24 94 16 88 12 78 C 8 65 6 48 10 32 C 12 22 16 16 22 12 C 28 8 38 5 50 5 Z";

// Mira's glow - the only thing that speaks
const GLOW_COLOR = '#EC4899'; // Magenta/pink - alive but contained

const MiraOrb = ({ 
  onClick,
  size = 'md',
  className = '',
}) => {
  // Size configurations
  const sizes = {
    sm: { container: 56, orb: 44, glowSpread: 20 },
    md: { container: 72, orb: 56, glowSpread: 28 },
    lg: { container: 88, orb: 68, glowSpread: 36 },
  };
  
  const config = sizes[size];

  return (
    <div 
      className={`relative flex items-center justify-center ${className}`}
      style={{
        width: config.container,
        height: config.container,
      }}
    >
      {/* The glow - behind everything, bleeding out */}
      {/* This is what makes Mira feel alive */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          filter: `blur(${config.glowSpread}px)`,
        }}
        animate={{
          opacity: [0.5, 0.65, 0.5],
          scale: [1, 1.08, 1],
        }}
        transition={{
          duration: 7, // 6-8 second cycle - barely perceptible
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <svg 
          viewBox="0 0 100 100" 
          className="w-full h-full"
          style={{ transform: 'scale(1.3)' }}
        >
          <path
            d={BLOB_PATH}
            fill={GLOW_COLOR}
          />
        </svg>
      </motion.div>

      {/* Secondary glow layer - softer, wider */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          filter: `blur(${config.glowSpread * 1.8}px)`,
          opacity: 0.3,
        }}
        animate={{
          opacity: [0.25, 0.35, 0.25],
          scale: [1.1, 1.2, 1.1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5,
        }}
      >
        <svg 
          viewBox="0 0 100 100" 
          className="w-full h-full"
          style={{ transform: 'scale(1.5)' }}
        >
          <path
            d={BLOB_PATH}
            fill={GLOW_COLOR}
          />
        </svg>
      </motion.div>

      {/* The core - silent, matte black, contained */}
      {/* No gradients. No shine. Just presence. */}
      <motion.button
        onClick={(e) => {
          if (navigator.vibrate) {
            navigator.vibrate(30); // Subtle haptic
          }
          onClick?.(e);
        }}
        className="relative cursor-pointer focus:outline-none"
        style={{
          width: config.orb,
          height: config.orb,
        }}
        whileHover={{ 
          scale: 1.05,
        }}
        whileTap={{ scale: 0.97 }}
        data-testid="mira-orb"
      >
        <svg 
          viewBox="0 0 100 100" 
          className="w-full h-full"
        >
          <path
            d={BLOB_PATH}
            fill="#0a0a0a" // True black, matte
          />
        </svg>
      </motion.button>
    </div>
  );
};

export default MiraOrb;

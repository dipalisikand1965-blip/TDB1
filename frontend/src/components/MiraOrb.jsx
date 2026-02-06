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

// Color discipline: deep magenta, subtle violet undertone
// Zero neon. Zero hot pink. Warm and contained.
const COLORS = {
  glow: '#BE185D',        // Deep magenta - controlled, not electric
  glowSecondary: '#7C3AED', // Subtle violet undertone
  core: '#050505',        // True black with just enough depth
  coreEdge: '#0a0a0a',    // Slightly lighter for feathered edge
};

const MiraOrb = ({ 
  onClick,
  size = 'md',
  className = '',
}) => {
  const sizes = {
    sm: { container: 60, orb: 44, blur: 16 },
    md: { container: 76, orb: 56, blur: 22 },
    lg: { container: 92, orb: 68, blur: 28 },
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
      {/* Primary glow - UNEVEN distribution */}
      {/* Thicker at bottom-right, thinner at top-left */}
      {/* Light escaping, not outlining */}
      <motion.div
        className="absolute pointer-events-none"
        style={{
          width: config.container * 1.4,
          height: config.container * 1.4,
          filter: `blur(${config.blur}px)`,
          transform: 'translate(8%, 6%)', // Offset creates unevenness
        }}
        animate={{
          opacity: [0.55, 0.6, 0.55], // 6-8% shift only
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path d={BLOB_PATH} fill={COLORS.glow} />
        </svg>
      </motion.div>

      {/* Secondary glow - violet undertone, offset opposite direction */}
      {/* Creates depth and color complexity */}
      <motion.div
        className="absolute pointer-events-none"
        style={{
          width: config.container * 1.3,
          height: config.container * 1.3,
          filter: `blur(${config.blur * 1.5}px)`,
          transform: 'translate(-5%, -3%)', // Opposite offset
          opacity: 0.25,
        }}
        animate={{
          opacity: [0.22, 0.28, 0.22],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path d={BLOB_PATH} fill={COLORS.glowSecondary} />
        </svg>
      </motion.div>

      {/* Tertiary glow - creates the "escaping" effect on one edge */}
      {/* Barely visible, adds tension */}
      <motion.div
        className="absolute pointer-events-none"
        style={{
          width: config.container * 1.1,
          height: config.container * 1.1,
          filter: `blur(${config.blur * 0.8}px)`,
          transform: 'translate(12%, 10%)', // Strong offset - glow "escapes" here
          opacity: 0.4,
        }}
        animate={{
          opacity: [0.35, 0.42, 0.35],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path d={BLOB_PATH} fill={COLORS.glow} />
        </svg>
      </motion.div>

      {/* Core edge softener - the faintest inner feather */}
      {/* Makes the core feel like a void with mass, not a cut-out */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: config.orb + 4,
          height: config.orb + 4,
          filter: 'blur(3px)',
          opacity: 0.6,
        }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path d={BLOB_PATH} fill={COLORS.coreEdge} />
        </svg>
      </div>

      {/* The core - silent, matte black, void with mass */}
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
          <path d={BLOB_PATH} fill={COLORS.core} />
        </svg>
      </motion.button>
    </div>
  );
};

export default MiraOrb;

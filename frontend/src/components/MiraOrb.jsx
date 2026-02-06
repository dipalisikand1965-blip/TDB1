/**
 * MiraOrb - Like Fantasy.co but with pink glow
 * 
 * Simple. Clean. Not over-engineered.
 * Pink/white glow behind a black void.
 */

import React from 'react';
import { motion } from 'framer-motion';

// Simple organic blob - like Fantasy's logo shape
const BLOB_PATH = "M 50 10 C 70 10 85 25 85 45 C 85 55 80 65 75 75 C 65 90 50 90 50 90 C 50 90 35 90 25 75 C 20 65 15 55 15 45 C 15 25 30 10 50 10 Z";

const MiraOrb = ({ 
  onClick,
  size = 'md',
  className = '',
}) => {
  const sizes = {
    sm: { container: 64, orb: 40 },
    md: { container: 80, orb: 50 },
    lg: { container: 96, orb: 60 },
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
      {/* THE GLOW - simple pink/white shape with CSS blur */}
      {/* This is the light source - sits behind the black void */}
      <motion.div
        className="absolute"
        style={{
          width: config.orb + 8,
          height: config.orb + 8,
          filter: 'blur(8px)',
        }}
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.9, 1, 0.9],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path d={BLOB_PATH} fill="#f472b6" />
        </svg>
      </motion.div>

      {/* Inner brighter glow - white/pink core */}
      <motion.div
        className="absolute"
        style={{
          width: config.orb + 4,
          height: config.orb + 4,
          filter: 'blur(4px)',
        }}
        animate={{
          opacity: [0.85, 1, 0.85],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5,
        }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path d={BLOB_PATH} fill="#fbcfe8" />
        </svg>
      </motion.div>

      {/* THE BLACK VOID - sits on top */}
      <motion.button
        onClick={(e) => {
          if (navigator.vibrate) navigator.vibrate(20);
          onClick?.(e);
        }}
        className="relative cursor-pointer focus:outline-none z-10"
        style={{
          width: config.orb,
          height: config.orb,
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.97 }}
        data-testid="mira-orb"
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path d={BLOB_PATH} fill="#000000" />
        </svg>
      </motion.button>
    </div>
  );
};

export default MiraOrb;

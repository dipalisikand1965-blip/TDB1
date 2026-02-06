/**
 * MiraOrb - ALIVE with motion
 * 
 * Organic blob shape (not circular).
 * Black void center.
 * Magenta glow escaping from behind - UNEVEN.
 * VISIBLE breathing animation.
 */

import React from 'react';
import { motion } from 'framer-motion';

// Organic asymmetric blob path
const BLOB_PATH = "M50,10 C75,10 90,30 90,50 C90,75 70,90 50,90 C25,90 10,70 10,50 C10,25 30,10 50,10";

const MiraOrb = ({ 
  onClick,
  size = 'md',
  className = '',
}) => {
  const sizes = {
    sm: { container: 80, core: 48 },
    md: { container: 100, core: 60 },
    lg: { container: 120, core: 72 },
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
      {/* GLOW - Animated magenta blob escaping from behind */}
      <motion.div
        className="absolute"
        style={{
          width: config.core + 36,
          height: config.core + 36,
          transform: 'translate(-6px, -4px)', // Offset for asymmetric glow escape
        }}
        animate={{
          scale: [1, 1.12, 1],
          opacity: [0.75, 1, 0.75],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full" style={{ filter: 'blur(14px)' }}>
          <defs>
            <radialGradient id="glowGrad" cx="30%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#ff66ff" />
              <stop offset="50%" stopColor="#cc00cc" />
              <stop offset="100%" stopColor="#660066" stopOpacity="0" />
            </radialGradient>
          </defs>
          <path d={BLOB_PATH} fill="url(#glowGrad)" />
        </svg>
      </motion.div>

      {/* Second glow layer - brighter, offset more */}
      <motion.div
        className="absolute"
        style={{
          width: config.core + 24,
          height: config.core + 24,
          transform: 'translate(-10px, -6px)',
        }}
        animate={{
          scale: [1.05, 0.95, 1.05],
          opacity: [0.9, 0.6, 0.9],
        }}
        transition={{
          duration: 3.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.3,
        }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full" style={{ filter: 'blur(8px)' }}>
          <path d={BLOB_PATH} fill="#ff44ff" />
        </svg>
      </motion.div>

      {/* BLACK VOID - Sits on top */}
      <motion.button
        onClick={(e) => {
          if (navigator.vibrate) navigator.vibrate(20);
          onClick?.(e);
        }}
        className="relative z-10 cursor-pointer focus:outline-none"
        style={{
          width: config.core,
          height: config.core,
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        data-testid="mira-orb"
      >
        {/* Edge softening */}
        <svg viewBox="0 0 100 100" className="absolute w-full h-full" style={{ filter: 'blur(2px)', transform: 'scale(1.02)' }}>
          <path d={BLOB_PATH} fill="#0a0a0a" />
        </svg>
        {/* Core - true black */}
        <svg viewBox="0 0 100 100" className="relative w-full h-full z-10">
          <path d={BLOB_PATH} fill="#000000" />
        </svg>
      </motion.button>
    </div>
  );
};

export default MiraOrb;

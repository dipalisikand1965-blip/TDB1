/**
 * MiraOrb - Eclipse Effect
 * 
 * TWO shapes creating an eclipse:
 * 1. Glowing magenta blob (light source) - behind
 * 2. Black void blob - offset on top, blocking most light
 * 
 * Light escapes on one side. Like a solar eclipse.
 * Breathing animation. 6-8 second cycle. Barely perceptible.
 */

import React from 'react';
import { motion } from 'framer-motion';

// Organic asymmetrical blob - no symmetry, soft contours
const BLOB_PATH = "M 50 12 Q 72 8 80 28 Q 90 48 82 68 Q 72 88 52 90 Q 32 92 22 72 Q 12 52 20 32 Q 28 12 50 12 Z";

const MiraOrb = ({ 
  onClick,
  size = 'md',
  className = '',
}) => {
  const sizes = {
    sm: { container: 72, blob: 48 },
    md: { container: 88, blob: 58 },
    lg: { container: 104, blob: 68 },
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
      {/* THE GLOW - magenta blob, the light source */}
      {/* Positioned slightly offset so light escapes on one side */}
      <motion.div
        className="absolute"
        style={{
          width: config.blob + 16,
          height: config.blob + 16,
          left: -8,  // Offset to create asymmetric glow escape
          top: -4,
        }}
        animate={{
          opacity: [0.92, 1, 0.92],
          scale: [1, 1.02, 1],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {/* Outer soft glow */}
        <div 
          className="absolute inset-0"
          style={{ filter: 'blur(16px)' }}
        >
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <path d={BLOB_PATH} fill="#a855f7" />
          </svg>
        </div>
        
        {/* Mid glow - magenta */}
        <div 
          className="absolute inset-0"
          style={{ filter: 'blur(10px)' }}
        >
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <path d={BLOB_PATH} fill="#c026d3" />
          </svg>
        </div>
        
        {/* Inner bright glow - pink/white hot */}
        <div 
          className="absolute inset-0"
          style={{ filter: 'blur(5px)' }}
        >
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <path d={BLOB_PATH} fill="#e879f9" />
          </svg>
        </div>
      </motion.div>

      {/* THE BLACK VOID - sits on top, offset to block most light */}
      {/* Creates the eclipse effect */}
      <motion.button
        onClick={(e) => {
          if (navigator.vibrate) navigator.vibrate(20);
          onClick?.(e);
        }}
        className="absolute cursor-pointer focus:outline-none z-10"
        style={{
          width: config.blob,
          height: config.blob,
          right: 8,  // Offset right so glow escapes on left
          top: 8,
        }}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        data-testid="mira-orb"
      >
        {/* Soft edge feather */}
        <div 
          className="absolute inset-0"
          style={{ 
            filter: 'blur(2px)',
            transform: 'scale(1.03)',
          }}
        >
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <path d={BLOB_PATH} fill="#0a0a0a" />
          </svg>
        </div>
        
        {/* Core - true black, matte */}
        <svg viewBox="0 0 100 100" className="w-full h-full relative z-10">
          <path d={BLOB_PATH} fill="#000000" />
        </svg>
      </motion.button>
    </div>
  );
};

export default MiraOrb;

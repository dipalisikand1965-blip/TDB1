/**
 * MiraOrb - ALIVE with motion
 * 
 * Black void center.
 * Magenta glow escaping from behind.
 * VISIBLE breathing animation.
 */

import React from 'react';
import { motion } from 'framer-motion';

const MiraOrb = ({ 
  onClick,
  size = 'md',
  className = '',
}) => {
  const sizes = {
    sm: { container: 80, core: 44 },
    md: { container: 100, core: 56 },
    lg: { container: 120, core: 68 },
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
      {/* GLOW LAYER - Magenta light escaping from behind */}
      {/* This is the ANIMATED part - visible breathing */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: config.core + 40,
          height: config.core + 40,
          background: 'radial-gradient(circle at 30% 30%, #ff00ff 0%, #cc00cc 30%, #990099 60%, transparent 80%)',
          filter: 'blur(12px)',
        }}
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.7, 1, 0.7],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      {/* Second glow layer - offset for asymmetry */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: config.core + 30,
          height: config.core + 30,
          left: -10,
          top: -5,
          background: 'radial-gradient(circle, #ff44ff 0%, #cc00cc 50%, transparent 80%)',
          filter: 'blur(8px)',
        }}
        animate={{
          scale: [1.1, 1, 1.1],
          opacity: [0.8, 0.5, 0.8],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5,
        }}
      />

      {/* BLACK VOID - Center */}
      <motion.button
        onClick={(e) => {
          if (navigator.vibrate) navigator.vibrate(20);
          onClick?.(e);
        }}
        className="relative z-10 cursor-pointer focus:outline-none rounded-full"
        style={{
          width: config.core,
          height: config.core,
          background: '#000000',
          boxShadow: '0 0 20px 5px rgba(0,0,0,0.8)',
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        data-testid="mira-orb"
      />
    </div>
  );
};

export default MiraOrb;

/**
 * MiraOrb - A Living, Breathing AI Entity
 * 
 * NOT a black void. NOT a button.
 * A GLOWING, ETHEREAL ORB of light.
 * 
 * Layered Light approach:
 * - Ambient bloom (back)
 * - Main glowing orb body
 * - Specular highlight
 * - Soft paw print icon
 */

import React from 'react';
import { motion } from 'framer-motion';

// Paw Print SVG - soft, ethereal
const PawIcon = () => (
  <svg 
    viewBox="0 0 24 24" 
    fill="currentColor"
    className="w-8 h-8 text-white/80 drop-shadow-[0_0_8px_rgba(255,255,255,0.9)]"
  >
    <path d="M12 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-4 8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm8 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-4 6c-1.7 0-3 1.3-3 3v1h6v-1c0-1.7-1.3-3-3-3z"/>
  </svg>
);

const MiraOrb = ({ 
  onClick,
  size = 'md',
  className = '',
}) => {
  const sizes = {
    sm: { orb: 64 },
    md: { orb: 80 },
    lg: { orb: 96 },
  };
  
  const config = sizes[size];

  return (
    <motion.button
      onClick={(e) => {
        if (navigator.vibrate) navigator.vibrate(20);
        onClick?.(e);
      }}
      className={`relative cursor-pointer focus:outline-none ${className}`}
      style={{
        width: config.orb,
        height: config.orb,
      }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      data-testid="mira-orb"
    >
      {/* Layer 1: Ambient Bloom - Large, diffuse purple glow */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: config.orb * 1.8,
          height: config.orb * 1.8,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, rgba(124,58,237,0.5) 0%, rgba(76,29,149,0.3) 50%, transparent 70%)',
          filter: 'blur(20px)',
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.6, 0.9, 0.6],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Layer 2: Main Orb Body - Glowing magenta/pink gradient */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: config.orb,
          height: config.orb,
          top: 0,
          left: 0,
          background: 'radial-gradient(circle at 35% 35%, #F0ABFC 0%, #D946EF 40%, #A855F7 70%, #7C3AED 100%)',
          boxShadow: '0 0 40px rgba(217,70,239,0.7), 0 0 80px rgba(168,85,247,0.4), inset 0 0 30px rgba(255,255,255,0.3)',
        }}
        animate={{
          scale: [1, 1.08, 1],
          opacity: [0.85, 1, 0.85],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Layer 3: Inner Glow - Hot white/pink center */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: config.orb * 0.7,
          height: config.orb * 0.7,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(240,171,252,0.6) 50%, transparent 70%)',
          filter: 'blur(8px)',
        }}
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.7, 1, 0.7],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5,
        }}
      />

      {/* Layer 4: Specular Highlight - Top-left glass shine */}
      <div
        className="absolute rounded-full"
        style={{
          width: config.orb * 0.35,
          height: config.orb * 0.25,
          top: '15%',
          left: '20%',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 100%)',
          filter: 'blur(4px)',
          borderRadius: '50%',
        }}
      />

      {/* Layer 5: Paw Icon - Soft, centered */}
      <div
        className="absolute flex items-center justify-center"
        style={{
          width: config.orb,
          height: config.orb,
          top: 0,
          left: 0,
        }}
      >
        <PawIcon />
      </div>
    </motion.button>
  );
};

export default MiraOrb;

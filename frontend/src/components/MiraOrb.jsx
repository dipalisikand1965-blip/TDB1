/**
 * MiraOrb - A Living, Breathing AI Entity
 * 
 * A GLOWING, ETHEREAL ORB of light.
 * Premium, calm, intelligent presence.
 * 
 * Layered Light approach:
 * - Ambient bloom (back)
 * - Main glowing orb body  
 * - Specular highlight
 * - Soft paw print icon (properly sized)
 */

import React from 'react';
import { motion } from 'framer-motion';

// Paw Print SVG - properly proportioned
const PawIcon = ({ size }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="currentColor"
    style={{ 
      width: size * 0.4, 
      height: size * 0.4,
    }}
    className="text-white/90 drop-shadow-[0_0_10px_rgba(255,255,255,0.9)]"
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
    sm: { orb: 56 },
    md: { orb: 72 },
    lg: { orb: 88 },
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
        className="absolute rounded-full pointer-events-none"
        style={{
          width: config.orb * 1.6,
          height: config.orb * 1.6,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, rgba(168,85,247,0.6) 0%, rgba(124,58,237,0.3) 50%, transparent 70%)',
          filter: 'blur(16px)',
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

      {/* Layer 2: Main Orb Body - Glowing magenta/pink gradient */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: config.orb,
          height: config.orb,
          top: 0,
          left: 0,
          background: 'radial-gradient(circle at 35% 35%, #F0ABFC 0%, #D946EF 35%, #A855F7 65%, #7C3AED 100%)',
          boxShadow: '0 0 30px rgba(217,70,239,0.6), 0 0 60px rgba(168,85,247,0.3), inset 0 0 20px rgba(255,255,255,0.4)',
        }}
        animate={{
          scale: [1, 1.06, 1],
          opacity: [0.9, 1, 0.9],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Layer 3: Inner Glow - Hot white/pink center */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: config.orb * 0.6,
          height: config.orb * 0.6,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(240,171,252,0.5) 60%, transparent 80%)',
          filter: 'blur(6px)',
        }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.8, 1, 0.8],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.3,
        }}
      />

      {/* Layer 4: Specular Highlight - Top-left glass shine */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: config.orb * 0.3,
          height: config.orb * 0.2,
          top: '12%',
          left: '18%',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 100%)',
          filter: 'blur(3px)',
          borderRadius: '50%',
        }}
      />

      {/* Layer 5: Paw Icon - Centered, properly sized */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
      >
        <PawIcon size={config.orb} />
      </div>
    </motion.button>
  );
};

export default MiraOrb;

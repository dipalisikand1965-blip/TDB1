/**
 * MiraOrb - "The Soul Pearl"
 * 
 * A jewel, not a void. Uses the brand's Soul Gradient 
 * (Purple → Pink → Amber) to harmonize with the entire site.
 * 
 * Designed to work on BOTH dark and light backgrounds:
 * - Light purple highlight (top-left) for dark backgrounds
 * - Deep obsidian shadow (bottom-right) for light backgrounds
 */

import React from 'react';
import { motion } from 'framer-motion';

const MiraOrb = ({ onClick, size = 'md', className = '' }) => {
  const sizes = {
    sm: 56,
    md: 72,
    lg: 88,
  };
  
  const orbSize = sizes[size];

  return (
    <motion.div
      className={`relative cursor-pointer group ${className}`}
      style={{ width: orbSize, height: orbSize }}
      onClick={(e) => {
        if (navigator.vibrate) navigator.vibrate(15);
        onClick?.(e);
      }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      data-testid="mira-orb"
    >
      {/* Outer Glow - Soul Gradient (Purple → Pink) */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: orbSize * 2,
          height: orbSize * 2,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, rgba(147,51,234,0.4) 0%, rgba(236,72,153,0.2) 40%, transparent 70%)',
          filter: 'blur(16px)',
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Secondary Glow - Amber accent for warmth */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: orbSize * 1.3,
          height: orbSize * 1.3,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%) translate(10%, 10%)',
          background: 'radial-gradient(circle, rgba(245,158,11,0.25) 0%, transparent 60%)',
          filter: 'blur(10px)',
        }}
        animate={{
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5,
        }}
      />

      {/* The Core - Soul Pearl */}
      <div 
        className="relative rounded-full overflow-hidden"
        style={{
          width: orbSize,
          height: orbSize,
          boxShadow: `
            0 0 30px rgba(147,51,234,0.4),
            0 0 60px rgba(236,72,153,0.2),
            0 8px 32px rgba(0,0,0,0.3),
            inset 0 0 20px rgba(0,0,0,0.5)
          `,
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        {/* Deep Purple Core - The Jewel */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(circle at 30% 30%, #581c87 0%, #2e1065 40%, #020617 100%)',
          }}
        />

        {/* Rotating Inner Light - Soul Gradient flowing inside */}
        <motion.div
          className="absolute pointer-events-none"
          style={{
            width: orbSize * 2,
            height: orbSize * 2,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'conic-gradient(from 0deg, transparent 0%, rgba(245,158,11,0.5) 15%, transparent 30%, rgba(236,72,153,0.5) 50%, transparent 65%, rgba(147,51,234,0.5) 80%, transparent 100%)',
            filter: 'blur(12px)',
            opacity: 0.7,
          }}
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        {/* Top-left Highlight - Glass reflection for dark backgrounds */}
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: orbSize * 0.4,
            height: orbSize * 0.3,
            top: '12%',
            left: '15%',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 100%)',
            filter: 'blur(4px)',
            borderRadius: '50%',
          }}
        />

        {/* Pink shimmer - brand accent */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 70% 60%, rgba(236,72,153,0.2) 0%, transparent 40%)',
          }}
        />

        {/* Pulse - The heartbeat */}
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(147,51,234,0.4) 0%, transparent 60%)',
          }}
          animate={{ 
            opacity: [0, 0.4, 0],
            scale: [0.8, 1, 0.8],
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
        />
      </div>
    </motion.div>
  );
};

export default MiraOrb;

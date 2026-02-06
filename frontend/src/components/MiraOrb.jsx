/**
 * MiraOrb - A Premium, Ethereal AI Presence
 * 
 * Not a button. An entity.
 * Deep, intelligent, calm.
 * Internal moving light - the intelligence within.
 * 
 * Inspired by: Apple, Nothing, Vercel, Linear
 * Designed to hit the soul.
 */

import React from 'react';
import { motion } from 'framer-motion';

const MiraOrb = ({ onClick, size = 'md', className = '' }) => {
  const sizes = {
    sm: 64,
    md: 80,
    lg: 96,
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
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      data-testid="mira-orb"
    >
      {/* Outer Ambient Glow - The 'Aura' */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: orbSize * 2,
          height: orbSize * 2,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, rgba(124,58,237,0.5) 0%, rgba(76,29,149,0.25) 40%, transparent 70%)',
          filter: 'blur(20px)',
        }}
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Secondary Glow - Cyan accent */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: orbSize * 1.4,
          height: orbSize * 1.4,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle at 70% 70%, rgba(34,211,238,0.3) 0%, transparent 50%)',
          filter: 'blur(12px)',
        }}
        animate={{
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      />

      {/* The Core Entity */}
      <div 
        className="relative rounded-full overflow-hidden shadow-2xl"
        style={{
          width: orbSize,
          height: orbSize,
          boxShadow: '0 0 40px rgba(124,58,237,0.3), 0 0 80px rgba(76,29,149,0.2), inset 0 0 30px rgba(0,0,0,0.8)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {/* Deep Space Background */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(circle at 30% 30%, #1a1a2e 0%, #0a0a12 50%, #050508 100%)',
          }}
        />

        {/* Moving Internal Light - The 'Intelligence' */}
        <motion.div
          className="absolute pointer-events-none"
          style={{
            width: orbSize * 2,
            height: orbSize * 2,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'conic-gradient(from 0deg, transparent 0%, rgba(139,92,246,0.6) 15%, transparent 30%, rgba(56,189,248,0.4) 50%, transparent 65%, rgba(167,139,250,0.5) 80%, transparent 100%)',
            filter: 'blur(15px)',
            opacity: 0.8,
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

        {/* Inner Core Highlight - Glass reflection */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 25% 25%, rgba(255,255,255,0.2) 0%, transparent 50%)',
          }}
        />

        {/* Second reflection - bottom */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 70% 80%, rgba(124,58,237,0.15) 0%, transparent 40%)',
          }}
        />
        
        {/* Subtle Pulse Overlay - The heartbeat */}
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)',
          }}
          animate={{ 
            opacity: [0, 0.3, 0],
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

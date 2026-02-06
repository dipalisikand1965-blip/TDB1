/**
 * MiraOrb - Silent Presence
 * 
 * THIN, SHARP glow hugging the edge.
 * White-hot at the boundary, pink corona, then darkness.
 * Like a neon outline. Like an eclipse.
 */

import React from 'react';
import { motion } from 'framer-motion';

// More interesting organic shape - like the reference with curves
const BLOB_PATH = "M 50 8 Q 70 2 78 20 Q 88 35 82 50 Q 90 70 75 82 Q 60 95 50 92 Q 40 95 25 82 Q 10 70 18 50 Q 12 35 22 20 Q 30 2 50 8 Z";

const MiraOrb = ({ 
  onClick,
  size = 'md',
  className = '',
}) => {
  const sizes = {
    sm: { container: 80, orb: 44 },
    md: { container: 96, orb: 54 },
    lg: { container: 112, orb: 64 },
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
      {/* The glowing SVG */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{
          scale: [1, 1.02, 1],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <svg 
          viewBox="0 0 100 100" 
          style={{ 
            width: config.container, 
            height: config.container,
            overflow: 'visible',
          }}
        >
          <defs>
            {/* THIN, SHARP glow - tight blur, bright edge */}
            <filter id="mira-thin-glow" x="-50%" y="-50%" width="200%" height="200%">
              {/* Layer 1: White-hot edge - very tight */}
              <feGaussianBlur in="SourceGraphic" stdDeviation="1" result="blur1"/>
              <feFlood floodColor="#ffffff" floodOpacity="0.9" result="white"/>
              <feComposite in="white" in2="blur1" operator="in" result="whiteGlow"/>
              
              {/* Layer 2: Hot pink - slightly wider */}
              <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur2"/>
              <feFlood floodColor="#ff1493" floodOpacity="1" result="hotPink"/>
              <feComposite in="hotPink" in2="blur2" operator="in" result="pinkGlow"/>
              
              {/* Layer 3: Magenta corona - thin spread */}
              <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur3"/>
              <feFlood floodColor="#ec4899" floodOpacity="0.8" result="magenta"/>
              <feComposite in="magenta" in2="blur3" operator="in" result="magentaGlow"/>
              
              {/* Layer 4: Soft outer - quick falloff */}
              <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur4"/>
              <feFlood floodColor="#be185d" floodOpacity="0.4" result="outer"/>
              <feComposite in="outer" in2="blur4" operator="in" result="outerGlow"/>
              
              {/* Stack: outer -> magenta -> pink -> white (white on top = brightest) */}
              <feMerge>
                <feMergeNode in="outerGlow"/>
                <feMergeNode in="magentaGlow"/>
                <feMergeNode in="pinkGlow"/>
                <feMergeNode in="whiteGlow"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* The GLOW - thin, sharp, animated */}
          <motion.path
            d={BLOB_PATH}
            fill="#ec4899"
            filter="url(#mira-thin-glow)"
            animate={{
              opacity: [0.85, 1, 0.85],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </svg>
      </motion.div>

      {/* The BLACK CORE - true void */}
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

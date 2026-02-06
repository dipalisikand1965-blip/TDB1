/**
 * MiraOrb - Silent Presence
 * 
 * The glow HUGS the shape's contour.
 * Brightest at the edge, then falls off into darkness.
 * Like light escaping from behind a void.
 */

import React from 'react';
import { motion } from 'framer-motion';

// Organic blob shape - more interesting contours with subtle curves
// Inspired by the reference: abstract, slightly bone-like, pet-aware
const BLOB_PATH = "M 50 8 Q 65 5 75 15 Q 85 25 82 40 Q 88 55 80 70 Q 75 85 60 90 Q 50 95 40 90 Q 25 85 20 70 Q 12 55 18 40 Q 15 25 25 15 Q 35 5 50 8 Z";

const MiraOrb = ({ 
  onClick,
  size = 'md',
  context = 'default',
  className = '',
}) => {
  const sizes = {
    sm: { container: 80, orb: 48 },
    md: { container: 100, orb: 60 },
    lg: { container: 120, orb: 72 },
  };
  
  const config = sizes[size];
  const glowColor = '#ec4899'; // Pink/magenta

  return (
    <div 
      className={`relative flex items-center justify-center ${className}`}
      style={{
        width: config.container,
        height: config.container,
      }}
    >
      {/* SVG with glow filter that HUGS the shape */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{
          scale: [1, 1.03, 1],
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
            {/* Glow filter - multiple blurred layers that follow the shape */}
            <filter id="mira-glow" x="-100%" y="-100%" width="300%" height="300%">
              {/* Layer 1: Tight glow right at edge */}
              <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur1"/>
              <feFlood floodColor={glowColor} floodOpacity="1" result="color1"/>
              <feComposite in="color1" in2="blur1" operator="in" result="glow1"/>
              
              {/* Layer 2: Medium spread */}
              <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur2"/>
              <feFlood floodColor={glowColor} floodOpacity="0.8" result="color2"/>
              <feComposite in="color2" in2="blur2" operator="in" result="glow2"/>
              
              {/* Layer 3: Wide ambient glow */}
              <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur3"/>
              <feFlood floodColor={glowColor} floodOpacity="0.5" result="color3"/>
              <feComposite in="color3" in2="blur3" operator="in" result="glow3"/>
              
              {/* Layer 4: Very wide soft glow */}
              <feGaussianBlur in="SourceGraphic" stdDeviation="20" result="blur4"/>
              <feFlood floodColor={glowColor} floodOpacity="0.3" result="color4"/>
              <feComposite in="color4" in2="blur4" operator="in" result="glow4"/>
              
              {/* Merge all glow layers */}
              <feMerge>
                <feMergeNode in="glow4"/>
                <feMergeNode in="glow3"/>
                <feMergeNode in="glow2"/>
                <feMergeNode in="glow1"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* The GLOW layer - same shape, with glow filter */}
          <motion.path
            d={BLOB_PATH}
            fill={glowColor}
            filter="url(#mira-glow)"
            style={{ transformOrigin: 'center' }}
            animate={{
              opacity: [0.9, 1, 0.9],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </svg>
      </motion.div>

      {/* The CORE - true black void on top */}
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

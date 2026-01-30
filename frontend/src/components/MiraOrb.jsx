/**
 * MiraOrb - The Soul of the Pet, Guide to the Pet Parent
 * 
 * An abstract presence token - a softly animated orb with breathing light 
 * and listening pulses. Mira feels alive through motion and response.
 * 
 * States:
 * - idle: Gentle breathing pulse
 * - listening: Expanding ripples, ears perked
 * - thinking: Swirling particles, contemplating
 * - speaking: Wave-form animation, sharing wisdom
 * - celebrating: Burst of joy particles
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Mira's soul colors
const MIRA_COLORS = {
  primary: '#9333EA',      // Purple - wisdom
  secondary: '#EC4899',    // Pink - love
  glow: '#C084FC',         // Light purple - aura
  listening: '#3B82F6',    // Blue - attention
  thinking: '#F59E0B',     // Amber - processing
  speaking: '#10B981',     // Emerald - guidance
  celebrating: '#F472B6',  // Pink - joy
};

// Particle component for ambient effects
const Particle = ({ delay, duration, size, color }) => (
  <motion.div
    className="absolute rounded-full"
    style={{
      width: size,
      height: size,
      background: color,
      filter: 'blur(1px)',
    }}
    initial={{ 
      opacity: 0, 
      scale: 0,
      x: 0,
      y: 0,
    }}
    animate={{ 
      opacity: [0, 0.8, 0],
      scale: [0, 1, 0.5],
      x: (Math.random() - 0.5) * 60,
      y: (Math.random() - 0.5) * 60,
    }}
    transition={{
      duration: duration,
      delay: delay,
      repeat: Infinity,
      ease: "easeOut",
    }}
  />
);

// Ripple effect for listening state
const ListeningRipple = ({ delay }) => (
  <motion.div
    className="absolute inset-0 rounded-full border-2 border-purple-400/30"
    initial={{ scale: 1, opacity: 0.6 }}
    animate={{ scale: 2.5, opacity: 0 }}
    transition={{
      duration: 2,
      delay: delay,
      repeat: Infinity,
      ease: "easeOut",
    }}
  />
);

// The main Mira Orb component
const MiraOrb = ({ 
  state = 'idle', // idle, listening, thinking, speaking, celebrating
  onClick,
  size = 'md', // sm, md, lg
  showLabel = true,
  className = '',
}) => {
  const [particles, setParticles] = useState([]);
  const orbRef = useRef(null);
  
  // Size configurations
  const sizes = {
    sm: { orb: 48, glow: 64, particles: 4 },
    md: { orb: 64, glow: 96, particles: 6 },
    lg: { orb: 80, glow: 120, particles: 8 },
  };
  
  const config = sizes[size];
  
  // Generate particles based on state
  useEffect(() => {
    const particleCount = state === 'celebrating' ? 12 : config.particles;
    const newParticles = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      delay: i * 0.3,
      duration: 2 + Math.random() * 2,
      size: 4 + Math.random() * 6,
      color: state === 'celebrating' 
        ? ['#EC4899', '#F59E0B', '#10B981', '#3B82F6'][i % 4]
        : MIRA_COLORS.glow,
    }));
    setParticles(newParticles);
  }, [state, config.particles]);
  
  // Animation variants for different states
  const orbVariants = {
    idle: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut",
      }
    },
    listening: {
      scale: [1, 1.1, 1],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut",
      }
    },
    thinking: {
      rotate: [0, 360],
      scale: [1, 1.08, 1],
      transition: {
        rotate: { duration: 4, repeat: Infinity, ease: "linear" },
        scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
      }
    },
    speaking: {
      scale: [1, 1.12, 1.05, 1.1, 1],
      transition: {
        duration: 0.8,
        repeat: Infinity,
        ease: "easeInOut",
      }
    },
    celebrating: {
      scale: [1, 1.2, 1],
      rotate: [0, 10, -10, 0],
      transition: {
        duration: 0.6,
        repeat: Infinity,
        ease: "easeInOut",
      }
    },
  };
  
  // Glow animation variants
  const glowVariants = {
    idle: {
      opacity: [0.4, 0.7, 0.4],
      scale: [1, 1.1, 1],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut",
      }
    },
    listening: {
      opacity: [0.5, 0.9, 0.5],
      scale: [1, 1.3, 1],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut",
      }
    },
    thinking: {
      opacity: [0.6, 0.8, 0.6],
      scale: [1, 1.2, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      }
    },
    speaking: {
      opacity: [0.5, 1, 0.5],
      scale: [1, 1.25, 1],
      transition: {
        duration: 0.8,
        repeat: Infinity,
        ease: "easeInOut",
      }
    },
    celebrating: {
      opacity: [0.6, 1, 0.6],
      scale: [1, 1.4, 1],
      transition: {
        duration: 0.6,
        repeat: Infinity,
        ease: "easeInOut",
      }
    },
  };
  
  // Get state-specific colors
  const getStateColor = () => {
    switch (state) {
      case 'listening': return MIRA_COLORS.listening;
      case 'thinking': return MIRA_COLORS.thinking;
      case 'speaking': return MIRA_COLORS.speaking;
      case 'celebrating': return MIRA_COLORS.celebrating;
      default: return MIRA_COLORS.primary;
    }
  };
  
  // Get state label
  const getStateLabel = () => {
    switch (state) {
      case 'listening': return 'Listening...';
      case 'thinking': return 'Thinking...';
      case 'speaking': return 'Speaking...';
      case 'celebrating': return '✨';
      default: return 'Ask Mira';
    }
  };

  return (
    <div 
      className={`relative flex flex-col items-center ${className}`}
      ref={orbRef}
    >
      {/* Ambient particles */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {particles.map((particle) => (
          <Particle key={particle.id} {...particle} />
        ))}
      </div>
      
      {/* Listening ripples */}
      <AnimatePresence>
        {state === 'listening' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <ListeningRipple delay={0} />
            <ListeningRipple delay={0.5} />
            <ListeningRipple delay={1} />
          </div>
        )}
      </AnimatePresence>
      
      {/* Outer glow */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: config.glow,
          height: config.glow,
          background: `radial-gradient(circle, ${getStateColor()}40 0%, transparent 70%)`,
          filter: 'blur(8px)',
        }}
        variants={glowVariants}
        animate={state}
      />
      
      {/* Main orb button */}
      <motion.button
        onClick={onClick}
        className="relative rounded-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2"
        style={{
          width: config.orb,
          height: config.orb,
          background: `linear-gradient(135deg, ${MIRA_COLORS.primary} 0%, ${MIRA_COLORS.secondary} 100%)`,
          boxShadow: `0 0 20px ${getStateColor()}60, inset 0 0 20px rgba(255,255,255,0.2)`,
        }}
        variants={orbVariants}
        animate={state}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        data-testid="mira-orb"
      >
        {/* Inner light core */}
        <motion.div
          className="absolute inset-2 rounded-full"
          style={{
            background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4) 0%, transparent 60%)',
          }}
          animate={{
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        
        {/* Thinking swirl indicator */}
        {state === 'thinking' && (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: `conic-gradient(from 0deg, transparent, ${MIRA_COLORS.thinking}60, transparent)`,
            }}
            animate={{ rotate: 360 }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        )}
        
        {/* Speaking wave indicator */}
        {state === 'speaking' && (
          <div className="absolute inset-0 flex items-center justify-center">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="absolute w-1 bg-white/60 rounded-full"
                style={{ height: 12 + i * 4 }}
                animate={{
                  scaleY: [1, 1.5, 1],
                  opacity: [0.6, 1, 0.6],
                }}
                transition={{
                  duration: 0.4,
                  delay: i * 0.1,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        )}
        
        {/* Paw print soul symbol - subtle */}
        <svg 
          className="absolute inset-0 m-auto w-6 h-6 text-white/30"
          viewBox="0 0 24 24" 
          fill="currentColor"
        >
          <path d="M12 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-4 8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm8 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-4 6c-1.7 0-3 1.3-3 3v1h6v-1c0-1.7-1.3-3-3-3z"/>
        </svg>
      </motion.button>
      
      {/* State label */}
      {showLabel && (
        <motion.span
          className="mt-2 text-xs font-medium text-gray-600"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          key={state}
        >
          {getStateLabel()}
        </motion.span>
      )}
    </div>
  );
};

export default MiraOrb;

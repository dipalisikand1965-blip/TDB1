/**
 * MiraOrb - World-Class AI Companion Interface
 * 
 * A premium, ethereal orb that represents Mira - the soul of every pet.
 * Designed to evoke wonder, trust, and magical connection.
 * 
 * Visual Design Principles:
 * - Multi-layered depth with glass morphism
 * - Living, breathing animations
 * - Premium gradient with aurora effects
 * - Responsive to state changes
 */

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Mira's essence - Premium color palette
const MIRA_ESSENCE = {
  core: '#9333EA',           // Deep purple - wisdom
  heart: '#EC4899',          // Pink - love & care
  aura: '#C084FC',           // Light purple - mystical
  glow: '#A855F7',           // Violet - energy
  listening: '#818CF8',      // Indigo - attention
  thinking: '#FBBF24',       // Amber - processing
  speaking: '#34D399',       // Emerald - guidance
  joy: '#F472B6',            // Rose - celebration
  white: '#FFFFFF',
};

// Floating particle for ambient magic
const MagicParticle = ({ index, total }) => {
  const angle = (index / total) * Math.PI * 2;
  const radius = 45 + (index % 3) * 10;
  const duration = 3 + (index % 4);
  const delay = index * 0.3;
  
  return (
    <motion.div
      className="absolute w-1.5 h-1.5 rounded-full"
      style={{
        background: `radial-gradient(circle, ${MIRA_ESSENCE.white}90, ${MIRA_ESSENCE.aura}60)`,
        boxShadow: `0 0 6px ${MIRA_ESSENCE.aura}`,
        left: '50%',
        top: '50%',
      }}
      animate={{
        x: [0, Math.cos(angle) * radius, Math.cos(angle + 1) * (radius + 10), 0],
        y: [0, Math.sin(angle) * radius, Math.sin(angle + 1) * (radius + 10), 0],
        opacity: [0, 0.8, 0.6, 0],
        scale: [0, 1, 0.8, 0],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
};

// Pulsing ring effect
const PulseRing = ({ delay, color, size }) => (
  <motion.div
    className="absolute rounded-full"
    style={{
      width: size,
      height: size,
      border: `1px solid ${color}`,
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%)',
    }}
    initial={{ scale: 0.8, opacity: 0.8 }}
    animate={{ scale: 2.5, opacity: 0 }}
    transition={{
      duration: 3,
      delay,
      repeat: Infinity,
      ease: "easeOut",
    }}
  />
);

// Aurora sweep effect
const AuroraSweep = ({ delay }) => (
  <motion.div
    className="absolute inset-0 rounded-full overflow-hidden"
    initial={{ rotate: 0 }}
    animate={{ rotate: 360 }}
    transition={{
      duration: 8,
      delay,
      repeat: Infinity,
      ease: "linear",
    }}
  >
    <div
      className="absolute inset-0"
      style={{
        background: `conic-gradient(from 0deg, transparent 0%, ${MIRA_ESSENCE.aura}30 10%, transparent 20%, ${MIRA_ESSENCE.heart}20 45%, transparent 55%, ${MIRA_ESSENCE.core}30 70%, transparent 80%)`,
      }}
    />
  </motion.div>
);

const MiraOrb = ({ 
  state = 'idle', 
  onClick, 
  size = 'md',
  showLabel = true,
  className = '',
}) => {
  // Size configurations - Premium sizes
  const config = useMemo(() => {
    const sizes = {
      sm: { orb: 48, aura: 80, ring: 100 },
      md: { orb: 64, aura: 110, ring: 140 },
      lg: { orb: 80, aura: 140, ring: 180 },
      xl: { orb: 96, aura: 170, ring: 220 },
    };
    return sizes[size] || sizes.md;
  }, [size]);

  // State-based glow color
  const getStateGlow = () => {
    switch(state) {
      case 'listening': return MIRA_ESSENCE.listening;
      case 'thinking': return MIRA_ESSENCE.thinking;
      case 'speaking': return MIRA_ESSENCE.speaking;
      case 'celebrating': return MIRA_ESSENCE.joy;
      default: return MIRA_ESSENCE.aura;
    }
  };

  // Generate particles
  const particles = useMemo(() => 
    Array.from({ length: 8 }, (_, i) => i), 
  []);

  return (
    <div 
      className={`relative flex flex-col items-center ${className}`}
      data-testid="mira-orb-container"
    >
      {/* Container for orb and effects */}
      <div 
        className="relative"
        style={{ 
          width: config.ring, 
          height: config.ring,
        }}
      >
        {/* Outermost ethereal glow - the cosmic aura */}
        <motion.div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: config.ring,
            height: config.ring,
            left: 0,
            top: 0,
            background: `radial-gradient(circle, ${getStateGlow()}15 0%, ${MIRA_ESSENCE.core}08 40%, transparent 70%)`,
            filter: 'blur(20px)',
          }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.6, 0.9, 0.6],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Pulse rings - breathing effect */}
        <AnimatePresence>
          {state === 'listening' && (
            <>
              <PulseRing delay={0} color={`${MIRA_ESSENCE.listening}50`} size={config.orb} />
              <PulseRing delay={0.6} color={`${MIRA_ESSENCE.listening}40`} size={config.orb} />
              <PulseRing delay={1.2} color={`${MIRA_ESSENCE.listening}30`} size={config.orb} />
            </>
          )}
        </AnimatePresence>

        {/* Magic particles floating around */}
        <div className="absolute inset-0 pointer-events-none">
          {particles.map((i) => (
            <MagicParticle key={i} index={i} total={particles.length} />
          ))}
        </div>

        {/* Mid-layer glow ring */}
        <motion.div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: config.aura,
            height: config.aura,
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            background: `radial-gradient(circle, ${MIRA_ESSENCE.heart}25 0%, ${MIRA_ESSENCE.core}15 50%, transparent 70%)`,
            filter: 'blur(12px)',
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Inner glow halo */}
        <motion.div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: config.orb + 20,
            height: config.orb + 20,
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            background: `radial-gradient(circle, ${getStateGlow()}40 0%, ${MIRA_ESSENCE.core}20 60%, transparent 70%)`,
            filter: 'blur(6px)',
          }}
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* THE MAIN ORB - Premium Glass Design */}
        <motion.button
          onClick={onClick}
          className="absolute rounded-full cursor-pointer focus:outline-none"
          style={{
            width: config.orb,
            height: config.orb,
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            background: `
              linear-gradient(135deg, 
                ${MIRA_ESSENCE.core} 0%, 
                ${MIRA_ESSENCE.heart} 50%, 
                ${MIRA_ESSENCE.glow} 100%
              )
            `,
            boxShadow: `
              0 0 20px ${getStateGlow()}60,
              0 0 40px ${MIRA_ESSENCE.heart}40,
              0 0 60px ${MIRA_ESSENCE.core}30,
              inset 0 -10px 30px rgba(0,0,0,0.3),
              inset 0 10px 30px rgba(255,255,255,0.2)
            `,
          }}
          animate={{
            y: [0, -4, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          whileHover={{ 
            scale: 1.1,
            boxShadow: `
              0 0 30px ${getStateGlow()}80,
              0 0 60px ${MIRA_ESSENCE.heart}60,
              0 0 90px ${MIRA_ESSENCE.core}40,
              inset 0 -10px 30px rgba(0,0,0,0.3),
              inset 0 10px 30px rgba(255,255,255,0.3)
            `,
          }}
          whileTap={{ scale: 0.95 }}
          data-testid="mira-orb"
        >
          {/* Aurora sweep inside orb */}
          <AuroraSweep delay={0} />
          
          {/* Glass reflection - top highlight */}
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: '70%',
              height: '40%',
              left: '15%',
              top: '8%',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
              borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
            }}
          />

          {/* Secondary reflection - bottom curve */}
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: '50%',
              height: '20%',
              left: '25%',
              bottom: '12%',
              background: 'linear-gradient(0deg, rgba(255,255,255,0.2) 0%, transparent 100%)',
              borderRadius: '50% 50% 50% 50% / 40% 40% 60% 60%',
            }}
          />

          {/* Core inner light */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: '30%',
              height: '30%',
              left: '35%',
              top: '35%',
              background: `radial-gradient(circle, ${MIRA_ESSENCE.white}60 0%, ${MIRA_ESSENCE.aura}40 50%, transparent 70%)`,
              filter: 'blur(4px)',
            }}
            animate={{
              opacity: [0.5, 0.9, 0.5],
              scale: [0.9, 1.1, 0.9],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* State indicator - thinking swirl */}
          {state === 'thinking' && (
            <motion.div
              className="absolute inset-2 rounded-full overflow-hidden"
              style={{
                background: `conic-gradient(from 0deg, transparent, ${MIRA_ESSENCE.thinking}50, transparent, ${MIRA_ESSENCE.thinking}30, transparent)`,
              }}
              animate={{ rotate: 360 }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          )}

          {/* State indicator - speaking waves */}
          {state === 'speaking' && (
            <motion.div
              className="absolute inset-3 rounded-full"
              style={{
                border: `2px solid ${MIRA_ESSENCE.speaking}50`,
              }}
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          )}

          {/* State indicator - celebrating sparkles */}
          {state === 'celebrating' && (
            <>
              {[0, 1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-white rounded-full"
                  style={{
                    left: '50%',
                    top: '50%',
                    boxShadow: `0 0 8px ${MIRA_ESSENCE.joy}`,
                  }}
                  animate={{
                    x: [0, Math.cos(i * 1.57) * 30],
                    y: [0, Math.sin(i * 1.57) * 30],
                    opacity: [1, 0],
                    scale: [0.5, 1.5],
                  }}
                  transition={{
                    duration: 0.8,
                    delay: i * 0.1,
                    repeat: Infinity,
                    ease: "easeOut",
                  }}
                />
              ))}
            </>
          )}
        </motion.button>

        {/* Outer sparkle ring - subtle rotating stars */}
        <motion.div
          className="absolute pointer-events-none"
          style={{
            width: config.aura + 10,
            height: config.aura + 10,
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
          }}
          animate={{ rotate: 360 }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          {[0, 60, 120, 180, 240, 300].map((angle, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full"
              style={{
                left: '50%',
                top: '0%',
                transform: `rotate(${angle}deg) translateY(${config.aura / 2 + 5}px)`,
                transformOrigin: `0 ${config.aura / 2 + 5}px`,
                boxShadow: `0 0 4px ${MIRA_ESSENCE.white}`,
              }}
              animate={{
                opacity: [0.3, 0.8, 0.3],
                scale: [0.8, 1.2, 0.8],
              }}
              transition={{
                duration: 2,
                delay: i * 0.3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
        </motion.div>
      </div>

      {/* Label - "Ask Mira" */}
      {showLabel && (
        <motion.div
          className="mt-2 text-center"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <span 
            className="text-xs font-semibold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent"
            style={{ textShadow: '0 0 20px rgba(147, 51, 234, 0.3)' }}
          >
            Ask Mira ✨
          </span>
        </motion.div>
      )}
    </div>
  );
};

export default MiraOrb;

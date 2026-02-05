/**
 * MiraOrb - World-Class AI Companion Interface
 * 
 * A premium, ethereal orb that represents Mira - the soul of every pet.
 * Designed to work on ANY background color with its own backdrop.
 * 
 * Rating Target: 100/100
 */

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MiraOrb = ({ 
  state = 'idle', 
  onClick, 
  size = 'md',
  showLabel = true,
  className = '',
}) => {
  // Size configurations
  const config = useMemo(() => {
    const sizes = {
      sm: { orb: 44, container: 70 },
      md: { orb: 56, container: 90 },
      lg: { orb: 72, container: 110 },
      xl: { orb: 88, container: 130 },
    };
    return sizes[size] || sizes.md;
  }, [size]);

  // State-based colors
  const stateColors = {
    idle: { primary: '#A855F7', secondary: '#EC4899', glow: '#C084FC' },
    listening: { primary: '#818CF8', secondary: '#A78BFA', glow: '#818CF8' },
    thinking: { primary: '#F59E0B', secondary: '#FBBF24', glow: '#FCD34D' },
    speaking: { primary: '#10B981', secondary: '#34D399', glow: '#6EE7B7' },
  };
  
  const colors = stateColors[state] || stateColors.idle;

  return (
    <div 
      className={`relative flex flex-col items-center ${className}`}
      data-testid="mira-orb-container"
    >
      {/* Backdrop - Dark glass to work on any background */}
      <motion.div
        className="relative rounded-2xl p-3 cursor-pointer"
        style={{
          background: 'rgba(15, 15, 25, 0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
        }}
        onClick={onClick}
        whileHover={{ 
          scale: 1.05,
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.15)',
        }}
        whileTap={{ scale: 0.98 }}
        data-testid="mira-orb"
      >
        {/* Outer glow ring */}
        <motion.div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: config.container,
            height: config.container,
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            background: `radial-gradient(circle, ${colors.glow}30 0%, transparent 70%)`,
            filter: 'blur(15px)',
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Pulse rings for listening state */}
        <AnimatePresence>
          {state === 'listening' && (
            <>
              {[0, 0.5, 1].map((delay, i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    width: config.orb,
                    height: config.orb,
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    border: `2px solid ${colors.primary}`,
                  }}
                  initial={{ scale: 1, opacity: 0.6 }}
                  animate={{ scale: 2, opacity: 0 }}
                  transition={{
                    duration: 2,
                    delay,
                    repeat: Infinity,
                    ease: "easeOut",
                  }}
                />
              ))}
            </>
          )}
        </AnimatePresence>

        {/* Floating particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const angle = (i / 6) * Math.PI * 2;
            const radius = 25;
            return (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full"
                style={{
                  background: 'white',
                  left: '50%',
                  top: '50%',
                  boxShadow: `0 0 4px ${colors.glow}`,
                }}
                animate={{
                  x: [0, Math.cos(angle) * radius, Math.cos(angle + 0.5) * (radius + 5), 0],
                  y: [0, Math.sin(angle) * radius, Math.sin(angle + 0.5) * (radius + 5), 0],
                  opacity: [0, 0.8, 0.5, 0],
                  scale: [0, 1, 0.7, 0],
                }}
                transition={{
                  duration: 3 + i * 0.3,
                  delay: i * 0.4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            );
          })}
        </div>

        {/* The Main Orb */}
        <motion.div
          className="relative rounded-full"
          style={{
            width: config.orb,
            height: config.orb,
            background: `
              radial-gradient(circle at 30% 30%, 
                rgba(255,255,255,0.4) 0%, 
                transparent 40%
              ),
              linear-gradient(135deg, 
                ${colors.primary} 0%, 
                ${colors.secondary} 100%
              )
            `,
            boxShadow: `
              0 0 20px ${colors.glow}60,
              0 0 40px ${colors.glow}30,
              inset 0 -8px 20px rgba(0,0,0,0.3),
              inset 0 8px 20px rgba(255,255,255,0.2)
            `,
          }}
          animate={{
            y: [0, -3, 0],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {/* Glass highlight - top */}
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: '65%',
              height: '35%',
              left: '18%',
              top: '10%',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.1) 60%, transparent 100%)',
              borderRadius: '50% 50% 50% 50% / 70% 70% 30% 30%',
            }}
          />

          {/* Inner core glow */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: '25%',
              height: '25%',
              left: '37.5%',
              top: '37.5%',
              background: `radial-gradient(circle, white 0%, ${colors.glow}60 50%, transparent 70%)`,
              filter: 'blur(3px)',
            }}
            animate={{
              opacity: [0.4, 0.8, 0.4],
              scale: [0.9, 1.1, 0.9],
            }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Thinking spinner */}
          {state === 'thinking' && (
            <motion.div
              className="absolute inset-1 rounded-full"
              style={{
                background: `conic-gradient(from 0deg, transparent 0%, ${colors.primary}60 20%, transparent 40%)`,
              }}
              animate={{ rotate: 360 }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          )}

          {/* Speaking pulse */}
          {state === 'speaking' && (
            <motion.div
              className="absolute inset-2 rounded-full"
              style={{ border: `2px solid rgba(255,255,255,0.5)` }}
              animate={{
                scale: [1, 1.15, 1],
                opacity: [0.6, 1, 0.6],
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          )}
        </motion.div>

        {/* Sparkle dots around orb */}
        <motion.div
          className="absolute pointer-events-none"
          style={{
            width: config.orb + 30,
            height: config.orb + 30,
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
          }}
          animate={{ rotate: 360 }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          {[0, 72, 144, 216, 288].map((angle, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full"
              style={{
                left: '50%',
                top: 0,
                transform: `rotate(${angle}deg) translateY(${(config.orb / 2) + 15}px)`,
                transformOrigin: `0 ${(config.orb / 2) + 15}px`,
                boxShadow: '0 0 6px white',
              }}
              animate={{
                opacity: [0.2, 0.7, 0.2],
              }}
              transition={{
                duration: 1.5,
                delay: i * 0.2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
        </motion.div>
      </motion.div>

      {/* Label - Clean single "Ask Mira" */}
      {showLabel && (
        <motion.span
          className="mt-2 text-xs font-semibold text-white/90 tracking-wide"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          style={{
            textShadow: '0 2px 8px rgba(0,0,0,0.5)',
          }}
        >
          Ask Mira ✨
        </motion.span>
      )}
    </div>
  );
};

export default MiraOrb;

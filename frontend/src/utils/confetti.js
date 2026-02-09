/**
 * Confetti Utilities - Micro-delight celebrations
 * ================================================
 * Extracted from MiraDemoPage.jsx for reuse across the app
 * 
 * Uses canvas-confetti library for performant animations
 */

import confetti from 'canvas-confetti';

/**
 * Trigger celebration confetti with haptic feedback
 * Used for birthdays, achievements, and special moments
 */
export const triggerCelebrationConfetti = () => {
  // HAPTIC: Success celebration pattern
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate([30, 50, 30, 50, 100]);
  }
  
  // Burst from both sides
  const count = 200;
  const defaults = {
    origin: { y: 0.7 },
    zIndex: 9999,
  };

  function fire(particleRatio, opts) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  }

  // Fire confetti from left
  fire(0.25, { spread: 26, startVelocity: 55, origin: { x: 0.2 } });
  fire(0.2, { spread: 60, origin: { x: 0.2 } });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8, origin: { x: 0.2 } });
  
  // Fire confetti from right
  fire(0.25, { spread: 26, startVelocity: 55, origin: { x: 0.8 } });
  fire(0.2, { spread: 60, origin: { x: 0.8 } });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8, origin: { x: 0.8 } });
};

/**
 * Mini confetti burst - for smaller achievements
 */
export const triggerMiniConfetti = () => {
  confetti({
    particleCount: 50,
    spread: 60,
    origin: { y: 0.6 },
    zIndex: 9999,
  });
};

export default triggerCelebrationConfetti;

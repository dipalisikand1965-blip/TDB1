/**
 * PICKS Micro-Delights - Premium OS Experience
 * =============================================
 * Sound, glow, animations for PICKS panel
 * Makes pet parents go "wowowowowo"
 */

import hapticFeedback from './haptic';
import { triggerCelebrationConfetti, triggerMiniConfetti } from './confetti';

// ============================================
// SOUND PATTERNS FOR PICKS
// ============================================

let audioContext = null;

const initAudioContext = () => {
  if (!audioContext && typeof AudioContext !== 'undefined') {
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.debug('[PicksDelights] AudioContext not available');
    }
  }
  return audioContext;
};

/**
 * Play a "whoosh" sound when picks refresh
 * Subtle, premium, satisfying
 */
export const playPicksRefreshSound = () => {
  const ctx = initAudioContext();
  if (!ctx) return;
  
  try {
    if (ctx.state === 'suspended') ctx.resume();
    
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // Whoosh: frequency sweep from high to low
    const now = ctx.currentTime;
    oscillator.frequency.setValueAtTime(1200, now);
    oscillator.frequency.exponentialRampToValueAtTime(400, now + 0.15);
    oscillator.type = 'sine';
    
    // Quick fade in/out
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.06, now + 0.02);
    gainNode.gain.linearRampToValueAtTime(0, now + 0.15);
    
    oscillator.start(now);
    oscillator.stop(now + 0.15);
  } catch (e) {
    console.debug('[PicksDelights] Whoosh sound failed');
  }
};

/**
 * Play emergency alert sound
 * Attention-grabbing but not alarming
 */
export const playEmergencySound = () => {
  const ctx = initAudioContext();
  if (!ctx) return;
  
  try {
    if (ctx.state === 'suspended') ctx.resume();
    
    const now = ctx.currentTime;
    
    // Two-tone alert
    [0, 0.15].forEach((delay, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.frequency.value = i === 0 ? 800 : 600;
      osc.type = 'sine';
      
      gain.gain.setValueAtTime(0, now + delay);
      gain.gain.linearRampToValueAtTime(0.1, now + delay + 0.02);
      gain.gain.linearRampToValueAtTime(0, now + delay + 0.1);
      
      osc.start(now + delay);
      osc.stop(now + delay + 0.1);
    });
  } catch (e) {
    console.debug('[PicksDelights] Emergency sound failed');
  }
};

/**
 * Play celebration chime for celebrate pillar
 */
export const playCelebrationChime = () => {
  const ctx = initAudioContext();
  if (!ctx) return;
  
  try {
    if (ctx.state === 'suspended') ctx.resume();
    
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5 - major chord
    
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.frequency.value = freq;
      osc.type = 'sine';
      
      const delay = i * 0.08;
      gain.gain.setValueAtTime(0, now + delay);
      gain.gain.linearRampToValueAtTime(0.08, now + delay + 0.02);
      gain.gain.linearRampToValueAtTime(0, now + delay + 0.3);
      
      osc.start(now + delay);
      osc.stop(now + delay + 0.3);
    });
  } catch (e) {
    console.debug('[PicksDelights] Celebration chime failed');
  }
};

// ============================================
// VISUAL EFFECTS FOR PICKS
// ============================================

/**
 * Add glow pulse to PICKS tab
 * @param {HTMLElement} element - The PICKS tab element
 * @param {string} color - Glow color
 */
export const glowPicksTab = (element, color = 'rgba(236, 72, 153, 0.6)') => {
  if (!element) return;
  
  element.style.transition = 'box-shadow 0.3s ease-out, transform 0.2s ease-out';
  element.style.boxShadow = `0 0 20px 8px ${color}, inset 0 0 10px ${color}`;
  element.style.transform = 'scale(1.05)';
  
  setTimeout(() => {
    element.style.boxShadow = 'none';
    element.style.transform = 'scale(1)';
  }, 600);
};

/**
 * Emergency red pulse effect
 * @param {HTMLElement} element
 */
export const emergencyPulse = (element) => {
  if (!element) return;
  
  element.style.transition = 'box-shadow 0.15s ease-out';
  
  let pulseCount = 0;
  const maxPulses = 3;
  
  const pulse = () => {
    if (pulseCount >= maxPulses * 2) {
      element.style.boxShadow = 'none';
      return;
    }
    
    const isOn = pulseCount % 2 === 0;
    element.style.boxShadow = isOn 
      ? '0 0 25px 10px rgba(239, 68, 68, 0.7), inset 0 0 15px rgba(239, 68, 68, 0.3)'
      : 'none';
    
    pulseCount++;
    setTimeout(pulse, 200);
  };
  
  pulse();
};

// ============================================
// INTENT-BASED ANIMATIONS
// ============================================

/**
 * Trigger appropriate delight based on pillar/intent
 * @param {string} pillar - The active pillar
 * @param {string} urgency - 'normal' | 'urgent' | 'emergency'
 * @param {HTMLElement} picksTabElement - Optional element for visual effects
 */
export const triggerIntentDelight = (pillar, urgency = 'normal', picksTabElement = null) => {
  // Emergency always takes priority
  if (urgency === 'emergency') {
    playEmergencySound();
    if (picksTabElement) emergencyPulse(picksTabElement);
    hapticFeedback.warning();
    return 'emergency';
  }
  
  // Pillar-specific delights
  switch (pillar) {
    case 'celebrate':
      playCelebrationChime();
      triggerMiniConfetti();
      hapticFeedback.celebration();
      if (picksTabElement) glowPicksTab(picksTabElement, 'rgba(236, 72, 153, 0.6)');
      return 'celebrate';
      
    case 'care':
      playPicksRefreshSound();
      hapticFeedback.sparkle();
      if (picksTabElement) glowPicksTab(picksTabElement, 'rgba(168, 85, 247, 0.5)');
      return 'care';
      
    case 'emergency':
    case 'farewell':
      playEmergencySound();
      if (picksTabElement) emergencyPulse(picksTabElement);
      hapticFeedback.warning();
      return 'emergency';
      
    case 'travel':
      playPicksRefreshSound();
      hapticFeedback.magic();
      if (picksTabElement) glowPicksTab(picksTabElement, 'rgba(59, 130, 246, 0.5)');
      return 'travel';
      
    default:
      // Default: subtle whoosh + glow
      playPicksRefreshSound();
      hapticFeedback.sparkle();
      if (picksTabElement) glowPicksTab(picksTabElement, 'rgba(168, 85, 247, 0.4)');
      return 'default';
  }
};

// ============================================
// PICKS REFRESH HANDLER
// ============================================

/**
 * Full PICKS refresh delight - call this when picks update
 * @param {Object} options
 * @param {string} options.pillar - Active pillar
 * @param {string} options.urgency - Urgency level
 * @param {number} options.picksCount - Number of new picks
 * @param {HTMLElement} options.tabElement - PICKS tab element
 * @param {Function} options.onBadgeUpdate - Callback to update badge
 */
export const onPicksRefresh = ({
  pillar = 'care',
  urgency = 'normal',
  picksCount = 0,
  tabElement = null,
  onBadgeUpdate = null
}) => {
  // 1. Trigger intent-based delight
  triggerIntentDelight(pillar, urgency, tabElement);
  
  // 2. Update badge if callback provided
  if (onBadgeUpdate && picksCount > 0) {
    onBadgeUpdate(picksCount);
  }
  
  // 3. Log for debugging
  console.debug(`[PicksDelights] Refresh: pillar=${pillar}, urgency=${urgency}, count=${picksCount}`);
};

// ============================================
// CARD INTERACTION DELIGHTS
// ============================================

/**
 * When user selects a pick card
 */
export const onPickSelect = (event) => {
  hapticFeedback.pickSelect(event);
  
  // Add pop animation to card
  const card = event?.currentTarget;
  if (card) {
    card.style.transition = 'transform 0.15s cubic-bezier(0.4, 0, 0, 1)';
    card.style.transform = 'scale(0.97)';
    setTimeout(() => {
      card.style.transform = 'scale(1.02)';
      setTimeout(() => {
        card.style.transform = 'scale(1)';
      }, 100);
    }, 100);
  }
};

/**
 * When task is created from pick (success)
 */
export const onTaskCreated = () => {
  hapticFeedback.success();
  triggerMiniConfetti();
};

/**
 * When pick is scheduled/confirmed
 */
export const onPickScheduled = () => {
  hapticFeedback.confirm();
  playCelebrationChime();
};

export default {
  playPicksRefreshSound,
  playEmergencySound,
  playCelebrationChime,
  glowPicksTab,
  emergencyPulse,
  triggerIntentDelight,
  onPicksRefresh,
  onPickSelect,
  onTaskCreated,
  onPickScheduled,
};

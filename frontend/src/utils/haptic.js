/**
 * Haptic & Tactile Feedback Utility
 * Cross-platform: Android (vibration) + iOS (audio + visual)
 * 
 * Provides consistent tactile feedback across all devices
 */

// ============================================
// AUDIO FEEDBACK (iOS + Android)
// ============================================

let audioContext = null;
let audioEnabled = true;

// Initialize audio context on first user interaction
const initAudioContext = () => {
  if (!audioContext && typeof AudioContext !== 'undefined') {
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.debug('[Haptic] AudioContext not available');
    }
  }
  return audioContext;
};

// Play a subtle click sound (works on iOS after user interaction)
const playClickSound = (frequency = 1800, duration = 0.015, volume = 0.1) => {
  if (!audioEnabled) return;
  
  const ctx = initAudioContext();
  if (!ctx) return;
  
  try {
    // Resume context if suspended (iOS requirement)
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    
    // Quick fade in/out for click feel
    const now = ctx.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(volume, now + 0.005);
    gainNode.gain.linearRampToValueAtTime(0, now + duration);
    
    oscillator.start(now);
    oscillator.stop(now + duration);
  } catch (e) {
    console.debug('[Haptic] Audio play failed:', e);
  }
};

// Different sound patterns
const SOUND_PATTERNS = {
  light: { frequency: 2000, duration: 0.01, volume: 0.05 },
  medium: { frequency: 1800, duration: 0.015, volume: 0.08 },
  strong: { frequency: 1500, duration: 0.02, volume: 0.1 },
  success: { frequency: 2200, duration: 0.025, volume: 0.08 },
  error: { frequency: 800, duration: 0.03, volume: 0.1 },
  voiceStart: { frequency: 1600, duration: 0.03, volume: 0.1 },
  voiceStop: { frequency: 1200, duration: 0.02, volume: 0.08 },
};

// ============================================
// VIBRATION FEEDBACK (Android only)
// ============================================

const supportsVibration = () => {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator;
};

// Vibration patterns (in milliseconds)
const VIBRATION_PATTERNS = {
  light: 10,
  medium: 25,
  strong: 50,
  success: [30, 50, 30],
  error: [50, 30, 50, 30, 50],
  voiceStart: [20, 30, 40],
  voiceStop: [40, 30, 20],
  notification: [100, 50, 100],
  scroll: 5,
  longPress: 100,
  thinking: [15, 100, 15],
  responseComplete: [20, 40, 20],
};

// Trigger vibration (Android)
const vibrate = (pattern = 'light') => {
  if (!supportsVibration()) return false;
  
  try {
    const vibrationPattern = typeof pattern === 'string' 
      ? VIBRATION_PATTERNS[pattern] || VIBRATION_PATTERNS.light
      : pattern;
    
    return navigator.vibrate(vibrationPattern);
  } catch (e) {
    return false;
  }
};

// ============================================
// VISUAL FEEDBACK (iOS + Android)
// ============================================

// Add press animation to element
const addPressAnimation = (element, scale = 0.95) => {
  if (!element) return;
  
  element.style.transition = 'transform 0.1s ease-out';
  element.style.transform = `scale(${scale})`;
  
  setTimeout(() => {
    element.style.transform = 'scale(1)';
  }, 100);
};

// Create ripple effect
const createRipple = (event, color = 'rgba(255, 255, 255, 0.4)') => {
  const element = event.currentTarget;
  if (!element) return;
  
  const ripple = document.createElement('span');
  const rect = element.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  
  const x = event.clientX - rect.left - size / 2;
  const y = event.clientY - rect.top - size / 2;
  
  ripple.style.cssText = `
    position: absolute;
    width: ${size}px;
    height: ${size}px;
    left: ${x}px;
    top: ${y}px;
    background: ${color};
    border-radius: 50%;
    transform: scale(0);
    animation: ripple-effect 0.4s ease-out forwards;
    pointer-events: none;
  `;
  
  // Ensure parent has relative positioning
  if (getComputedStyle(element).position === 'static') {
    element.style.position = 'relative';
  }
  element.style.overflow = 'hidden';
  
  element.appendChild(ripple);
  
  setTimeout(() => {
    ripple.remove();
  }, 400);
};

// ============================================
// UNIFIED HAPTIC FUNCTION
// ============================================

/**
 * Trigger haptic feedback - works on both iOS and Android
 * @param {string} pattern - Pattern name
 * @param {Event} event - Optional event for visual feedback
 */
export const haptic = (pattern = 'light', event = null) => {
  // 1. Try vibration (Android)
  const vibrated = vibrate(pattern);
  
  // 2. Play audio click (iOS + Android fallback)
  const soundPattern = SOUND_PATTERNS[pattern] || SOUND_PATTERNS.light;
  playClickSound(soundPattern.frequency, soundPattern.duration, soundPattern.volume);
  
  // 3. Visual feedback if event provided
  if (event?.currentTarget) {
    addPressAnimation(event.currentTarget);
  }
  
  return vibrated;
};

// ============================================
// CONVENIENCE METHODS
// ============================================

export const hapticFeedback = {
  // Initialize audio on first user interaction (call this on any click)
  init: () => {
    initAudioContext();
  },
  
  // Enable/disable audio feedback
  setAudioEnabled: (enabled) => {
    audioEnabled = enabled;
  },
  
  // Button taps
  buttonTap: (event) => haptic('light', event),
  
  // Send message
  sendMessage: (event) => haptic('medium', event),
  
  // Voice interactions
  voiceStart: (event) => haptic('voiceStart', event),
  voiceStop: (event) => haptic('voiceStop', event),
  
  // Suggestions/chips
  chipTap: (event) => haptic('light', event),
  
  // Toggle switches
  toggle: (event) => haptic('medium', event),
  
  // Mira states
  miraThinking: () => haptic('thinking'),
  miraResponse: () => haptic('responseComplete'),
  
  // Success/Error
  success: () => haptic('success'),
  error: () => haptic('error'),
  
  // Navigation
  navigate: (event) => haptic('light', event),
  
  // Pull to refresh / scroll actions
  scroll: () => haptic('scroll'),
  
  // Long press
  longPress: (event) => haptic('longPress', event),
  
  // Notification received
  notification: () => haptic('notification'),
  
  // Card interactions
  cardTap: (event) => haptic('light', event),
  cardExpand: (event) => haptic('medium', event),
  
  // History toggle
  historyToggle: (event) => haptic('medium', event),
  
  // Product/Service selection
  productSelect: (event) => haptic('medium', event),
  
  // Modal open/close
  modalOpen: (event) => haptic('medium', event),
  modalClose: (event) => haptic('light', event),
  
  // Tray/Drawer interactions
  trayOpen: (event) => haptic('medium', event),
  trayClose: (event) => haptic('light', event),
  
  // Ripple effect (call separately for visual only)
  ripple: createRipple,
  
  // Press animation (call separately for visual only)
  press: addPressAnimation,
};

export default hapticFeedback;

/**
 * Haptic & Tactile Feedback Utility
 * iOS PREMIUM EXPERIENCE - Apple App Store Quality
 * Cross-platform: Android (vibration) + iOS (audio + visual)
 * 
 * "Make pet parents go wowowowowo"
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

// Premium sound patterns for iOS feel
const SOUND_PATTERNS = {
  // Subtle taps
  light: { frequency: 2000, duration: 0.01, volume: 0.05 },
  medium: { frequency: 1800, duration: 0.015, volume: 0.08 },
  strong: { frequency: 1500, duration: 0.02, volume: 0.1 },
  
  // Feedback states
  success: { frequency: 2200, duration: 0.025, volume: 0.08 },
  error: { frequency: 800, duration: 0.03, volume: 0.1 },
  warning: { frequency: 1000, duration: 0.02, volume: 0.08 },
  
  // Voice interactions
  voiceStart: { frequency: 1600, duration: 0.03, volume: 0.1 },
  voiceStop: { frequency: 1200, duration: 0.02, volume: 0.08 },
  
  // Premium interactions
  selection: { frequency: 2100, duration: 0.012, volume: 0.06 },
  deselection: { frequency: 1700, duration: 0.01, volume: 0.05 },
  confirm: { frequency: 2400, duration: 0.03, volume: 0.09 },
  cancel: { frequency: 1100, duration: 0.02, volume: 0.06 },
  
  // Navigation
  tabSwitch: { frequency: 1900, duration: 0.01, volume: 0.05 },
  pageTransition: { frequency: 1600, duration: 0.02, volume: 0.07 },
  
  // Premium feels
  sparkle: { frequency: 2500, duration: 0.015, volume: 0.06 },
  magic: { frequency: 2200, duration: 0.025, volume: 0.08 },
  celebration: { frequency: 2600, duration: 0.03, volume: 0.1 },
};

// ============================================
// VIBRATION FEEDBACK (Android + iOS 13+)
// ============================================

const supportsVibration = () => {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator;
};

// Vibration patterns (in milliseconds)
const VIBRATION_PATTERNS = {
  // Basic
  light: 10,
  medium: 25,
  strong: 50,
  
  // Feedback
  success: [30, 50, 30],
  error: [50, 30, 50, 30, 50],
  warning: [30, 40, 30],
  
  // Voice
  voiceStart: [20, 30, 40],
  voiceStop: [40, 30, 20],
  
  // UI
  notification: [100, 50, 100],
  scroll: 5,
  longPress: 100,
  
  // Chat states
  thinking: [15, 100, 15],
  responseComplete: [20, 40, 20],
  messageReceived: [25, 35],
  messageSent: [20, 30, 20],
  
  // Selection
  selection: [15, 20],
  deselection: [10, 15],
  multiSelect: [10, 15, 10],
  
  // Navigation
  tabSwitch: 8,
  pageTransition: 15,
  menuOpen: [15, 25],
  menuClose: [12, 18],
  
  // Premium
  sparkle: [8, 12, 8],
  magic: [15, 25, 15, 25],
  celebration: [30, 40, 30, 40, 50],
  confirm: [25, 35, 25],
  cancel: [15, 20],
  
  // Keyboard
  keyPress: 5,
  keySubmit: [10, 20],
  
  // Scroll
  scrollEnd: 8,
  pullRefresh: [20, 30, 40],
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
  
  element.style.transition = 'transform 0.1s cubic-bezier(0.4, 0, 0, 1)';
  element.style.transform = `scale(${scale})`;
  
  setTimeout(() => {
    element.style.transform = 'scale(1)';
  }, 100);
};

// Create ripple effect (Material Design style)
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

// iOS-style glow effect
const createGlow = (element, color = 'rgba(236, 72, 153, 0.4)') => {
  if (!element) return;
  
  const originalBoxShadow = element.style.boxShadow;
  element.style.transition = 'box-shadow 0.2s ease-out';
  element.style.boxShadow = `0 0 20px 5px ${color}`;
  
  setTimeout(() => {
    element.style.boxShadow = originalBoxShadow;
  }, 300);
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
  // 1. Try vibration (Android + iOS 13+)
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
// CONVENIENCE METHODS - iOS Premium Experience
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
  
  // ========== BASIC TAPS ==========
  buttonTap: (event) => haptic('light', event),
  heavyTap: (event) => haptic('strong', event),
  
  // ========== MESSAGE ACTIONS ==========
  sendMessage: (event) => haptic('messageSent', event),
  messageReceived: () => haptic('messageReceived'),
  
  // ========== VOICE INTERACTIONS ==========
  voiceStart: (event) => haptic('voiceStart', event),
  voiceStop: (event) => haptic('voiceStop', event),
  
  // ========== CHIP/QUICK REPLY ==========
  chipTap: (event) => haptic('light', event),
  
  // ========== SELECTION (Multi-select, checkboxes) ==========
  select: (event) => haptic('selection', event),
  deselect: (event) => haptic('deselection', event),
  multiSelect: (event) => haptic('multiSelect', event),
  
  // ========== TOGGLE SWITCHES ==========
  toggle: (event) => haptic('medium', event),
  toggleOn: (event) => haptic('selection', event),
  toggleOff: (event) => haptic('deselection', event),
  
  // ========== MIRA STATES ==========
  miraThinking: () => haptic('thinking'),
  miraResponse: () => haptic('responseComplete'),
  
  // ========== SUCCESS/ERROR/WARNING ==========
  success: () => haptic('success'),
  error: () => haptic('error'),
  warning: () => haptic('warning'),
  
  // ========== NAVIGATION ==========
  navigate: (event) => haptic('pageTransition', event),
  tabSwitch: (event) => haptic('tabSwitch', event),
  
  // ========== MENU ==========
  menuOpen: (event) => haptic('menuOpen', event),
  menuClose: (event) => haptic('menuClose', event),
  
  // ========== SCROLL ==========
  scroll: () => haptic('scroll'),
  scrollEnd: () => haptic('scrollEnd'),
  pullRefresh: () => haptic('pullRefresh'),
  
  // ========== LONG PRESS ==========
  longPress: (event) => haptic('longPress', event),
  
  // ========== NOTIFICATIONS ==========
  notification: () => haptic('notification'),
  alert: () => haptic('warning'),
  
  // ========== CARD INTERACTIONS ==========
  cardTap: (event) => haptic('light', event),
  cardExpand: (event) => haptic('medium', event),
  cardCollapse: (event) => haptic('light', event),
  
  // ========== HISTORY ==========
  historyToggle: (event) => haptic('medium', event),
  
  // ========== PRODUCT/SERVICE ==========
  productSelect: (event) => haptic('selection', event),
  productDeselect: (event) => haptic('deselection', event),
  addToCart: (event) => haptic('confirm', event),
  removeFromCart: (event) => haptic('cancel', event),
  
  // ========== MODAL ==========
  modalOpen: (event) => haptic('menuOpen', event),
  modalClose: (event) => haptic('menuClose', event),
  
  // ========== TRAY/DRAWER ==========
  trayOpen: (event) => haptic('menuOpen', event),
  trayClose: (event) => haptic('menuClose', event),
  drawerOpen: (event) => haptic('pageTransition', event),
  drawerClose: (event) => haptic('light', event),
  
  // ========== CONFIRM/CANCEL ==========
  confirm: (event) => haptic('confirm', event),
  cancel: (event) => haptic('cancel', event),
  
  // ========== KEYBOARD ==========
  keyPress: () => haptic('keyPress'),
  keySubmit: () => haptic('keySubmit'),
  
  // ========== PREMIUM EFFECTS (wow factor) ==========
  sparkle: () => haptic('sparkle'),
  magic: () => haptic('magic'),
  celebration: () => haptic('celebration'),
  
  // ========== VISUAL EFFECTS ==========
  ripple: createRipple,
  press: addPressAnimation,
  glow: createGlow,
  
  // ========== PET-SPECIFIC ==========
  petSelect: (event) => haptic('selection', event),
  petSwitch: (event) => haptic('tabSwitch', event),
  soulScoreReveal: () => haptic('magic'),
  
  // ========== PICKS PANEL ==========
  picksOpen: (event) => haptic('pageTransition', event),
  picksClose: (event) => haptic('light', event),
  pickSelect: (event) => haptic('selection', event),
  pickDeselect: (event) => haptic('deselection', event),
  picksConfirm: () => haptic('celebration'),
  
  // ========== CONCIERGE ==========
  conciergeHandoff: () => haptic('magic'),
  conciergeResponse: () => haptic('notification'),
};

export default hapticFeedback;

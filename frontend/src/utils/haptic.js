/**
 * Haptic Feedback Utility for Mobile
 * Provides consistent tactile feedback across Mira OS
 */

// Check if device supports haptic feedback
const supportsHaptic = () => {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator;
};

// Haptic patterns (in milliseconds)
const HAPTIC_PATTERNS = {
  // Light tap - for buttons, chips, toggles
  light: 10,
  
  // Medium tap - for send message, confirm actions
  medium: 25,
  
  // Strong tap - for important actions like voice start
  strong: 50,
  
  // Success - double pulse for completed actions
  success: [30, 50, 30],
  
  // Error - triple short for errors
  error: [50, 30, 50, 30, 50],
  
  // Voice start - distinctive pattern
  voiceStart: [20, 30, 40],
  
  // Voice stop - reverse pattern
  voiceStop: [40, 30, 20],
  
  // Notification - attention grabber
  notification: [100, 50, 100],
  
  // Scroll/swipe - very light
  scroll: 5,
  
  // Long press - sustained
  longPress: 100,
  
  // Mira thinking - subtle pulse
  thinking: [15, 100, 15],
  
  // Mira response complete
  responseComplete: [20, 40, 20],
};

/**
 * Trigger haptic feedback
 * @param {string|number|number[]} pattern - Pattern name or custom pattern
 */
export const haptic = (pattern = 'light') => {
  if (!supportsHaptic()) return;
  
  try {
    const vibrationPattern = typeof pattern === 'string' 
      ? HAPTIC_PATTERNS[pattern] || HAPTIC_PATTERNS.light
      : pattern;
    
    navigator.vibrate(vibrationPattern);
  } catch (e) {
    // Silently fail if vibration not supported
    console.debug('[Haptic] Vibration failed:', e);
  }
};

/**
 * Haptic feedback for specific interactions
 */
export const hapticFeedback = {
  // Button taps
  buttonTap: () => haptic('light'),
  
  // Send message
  sendMessage: () => haptic('medium'),
  
  // Voice interactions
  voiceStart: () => haptic('voiceStart'),
  voiceStop: () => haptic('voiceStop'),
  
  // Suggestions/chips
  chipTap: () => haptic('light'),
  
  // Toggle switches
  toggle: () => haptic('medium'),
  
  // Mira states
  miraThinking: () => haptic('thinking'),
  miraResponse: () => haptic('responseComplete'),
  
  // Success/Error
  success: () => haptic('success'),
  error: () => haptic('error'),
  
  // Navigation
  navigate: () => haptic('light'),
  
  // Pull to refresh / scroll actions
  scroll: () => haptic('scroll'),
  
  // Long press
  longPress: () => haptic('longPress'),
  
  // Notification received
  notification: () => haptic('notification'),
  
  // Card interactions
  cardTap: () => haptic('light'),
  cardExpand: () => haptic('medium'),
  
  // History toggle
  historyToggle: () => haptic('medium'),
  
  // Product/Service selection
  productSelect: () => haptic('medium'),
  
  // Modal open/close
  modalOpen: () => haptic('medium'),
  modalClose: () => haptic('light'),
};

export default hapticFeedback;

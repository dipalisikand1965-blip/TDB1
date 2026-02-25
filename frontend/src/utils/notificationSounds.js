/**
 * Notification Sounds - iOS/Android/Desktop Compatible
 * =====================================================
 * Pleasant, subtle notification sounds using Web Audio API
 * Works across all devices without external audio files
 */

// Audio context singleton - created on first user interaction
let audioContext = null;

/**
 * Initialize audio context (must be called from user interaction)
 */
const initAudioContext = () => {
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn('[SOUND] Audio not supported:', e);
    }
  }
  
  // Resume if suspended (iOS requirement)
  if (audioContext?.state === 'suspended') {
    audioContext.resume();
  }
  
  return audioContext;
};

/**
 * Play a pleasant "new pick" notification - soft chime
 * A happy, rising tone that feels rewarding
 */
const playPicksSound = () => {
  const ctx = initAudioContext();
  if (!ctx) return;
  
  try {
    const now = ctx.currentTime;
    
    // Create oscillator for a soft chime
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    // Pleasant rising notes (C5 → E5 → G5)
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, now);       // C5
    osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
    osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
    
    // Soft envelope
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.02);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    
    osc.start(now);
    osc.stop(now + 0.4);
    
    console.log('[SOUND] Picks notification played');
  } catch (e) {
    console.warn('[SOUND] Picks sound error:', e);
  }
};

/**
 * Play a "new tip" notification - soft sparkle sound
 * A gentle, twinkling tone for insights
 */
const playTipSound = () => {
  const ctx = initAudioContext();
  if (!ctx) return;
  
  try {
    const now = ctx.currentTime;
    
    // Create two oscillators for a sparkle effect
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    const gain2 = ctx.createGain();
    
    osc1.connect(gain1);
    osc2.connect(gain2);
    gain1.connect(ctx.destination);
    gain2.connect(ctx.destination);
    
    // Sparkle frequencies (high, shimmery)
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1046.5, now);       // C6
    osc1.frequency.setValueAtTime(1318.5, now + 0.1); // E6
    
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1567.98, now + 0.05); // G6
    osc2.frequency.setValueAtTime(2093, now + 0.15);    // C7
    
    // Very soft sparkle envelope
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.08, now + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    
    gain2.gain.setValueAtTime(0, now + 0.05);
    gain2.gain.linearRampToValueAtTime(0.06, now + 0.07);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    
    osc1.start(now);
    osc1.stop(now + 0.25);
    osc2.start(now + 0.05);
    osc2.stop(now + 0.3);
    
    console.log('[SOUND] Tip notification played');
  } catch (e) {
    console.warn('[SOUND] Tip sound error:', e);
  }
};

/**
 * Play a "concierge bell" notification - classic hotel bell
 * A satisfying "ding" like ringing for service
 */
const playConciergeSound = () => {
  const ctx = initAudioContext();
  if (!ctx) return;
  
  try {
    const now = ctx.currentTime;
    
    // Create oscillator for bell tone
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    // Add subtle harmonics for bell-like quality
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    
    osc.connect(gain);
    osc2.connect(gain2);
    gain.connect(ctx.destination);
    gain2.connect(ctx.destination);
    
    // Bell fundamental frequency (E5 - classic bell tone)
    osc.type = 'sine';
    osc.frequency.setValueAtTime(659.25, now);
    
    // Overtone for richness
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1318.5, now); // E6 (octave up)
    
    // Bell envelope - quick attack, long decay
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.1, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.linearRampToValueAtTime(0.1, now + 0.01);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    
    osc.start(now);
    osc.stop(now + 0.8);
    osc2.start(now);
    osc2.stop(now + 0.5);
    
    console.log('[SOUND] Concierge bell played');
  } catch (e) {
    console.warn('[SOUND] Concierge bell error:', e);
  }
};

/**
 * Play a success confirmation sound
 * A satisfying completion tone
 */
const playSuccessSound = () => {
  const ctx = initAudioContext();
  if (!ctx) return;
  
  try {
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    // Success chord progression (major triad)
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, now);       // C5
    osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
    osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
    osc.frequency.setValueAtTime(1046.5, now + 0.3); // C6
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.02);
    gain.gain.setValueAtTime(0.15, now + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    
    osc.start(now);
    osc.stop(now + 0.6);
    
    console.log('[SOUND] Success sound played');
  } catch (e) {
    console.warn('[SOUND] Success sound error:', e);
  }
};

// Export all sound functions
const notificationSounds = {
  init: initAudioContext,
  picks: playPicksSound,
  tip: playTipSound,
  concierge: playConciergeSound,
  success: playSuccessSound
};

export default notificationSounds;
export { initAudioContext, playPicksSound, playTipSound, playConciergeSound, playSuccessSound };

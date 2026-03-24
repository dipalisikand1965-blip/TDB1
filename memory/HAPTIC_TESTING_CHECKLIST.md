# 📱 HAPTIC FEEDBACK TESTING CHECKLIST

## Test URL
**https://pet-wrapped-1.preview.emergentagent.com/mira-demo**

---

## Pre-Test Setup

### iOS (iPhone/iPad)
1. ✅ Enable **Settings > Sounds & Haptics > System Haptics**
2. ✅ Ensure volume is ON (even low) - audio feedback requires this
3. ✅ Use Safari for best WebKit compatibility

### Android
1. ✅ Enable **Settings > Sound > Vibration**
2. ✅ Use Chrome for best compatibility
3. ✅ Grant notification permissions if prompted

### Desktop
1. ✅ Enable speakers/headphones (subtle audio clicks)
2. ✅ Chrome or Safari recommended

---

## Test Scenarios

### 1. First Interaction (Init Audio Context)
**Action**: Tap anywhere on the screen first time
**Expected (iOS)**: Audio context initializes (no feedback yet)
**Expected (Android)**: Ready for vibration

### 2. Button Tap - "Meet Mira" / "Begin Journey"
**Action**: Tap the main CTA button
**Expected (iOS)**: Subtle click sound (2000Hz, 10ms)
**Expected (Android)**: Light vibration (10ms)
**Expected (Desktop)**: Subtle audio click

### 3. Send Message
**Action**: Type "hello" and tap send button
**Expected (iOS)**: Medium click sound (1800Hz, 15ms)
**Expected (Android)**: Medium vibration (25ms)
**Visual**: Button press animation

### 4. Voice Toggle
**Action**: Tap the microphone/voice button
**Expected (iOS)**: Voice start pattern sound
**Expected (Android)**: Pattern vibration [20, 30, 40]ms

### 5. Quick Reply Chips
**Action**: Tap any suggestion chip ("Tell me more", etc.)
**Expected**: Light tap feedback (same as button tap)

### 6. Mira Response Complete
**Action**: Wait for Mira to respond
**Expected (iOS)**: Response complete sound pattern
**Expected (Android)**: Pattern vibration [20, 40, 20]ms

### 7. Product/Service Card Tap
**Action**: Tap a product or service card
**Expected**: Medium feedback with press animation

### 8. Toggle Voice Output
**Action**: Tap the voice on/off button
**Expected**: Toggle feedback (medium intensity)

### 9. Error State
**Action**: Trigger an error (disconnect network, then send message)
**Expected (iOS)**: Error sound (800Hz, 30ms)
**Expected (Android)**: Error pattern [50, 30, 50, 30, 50]ms

### 10. History Toggle
**Action**: Tap "Show older messages" if available
**Expected**: Medium toggle feedback

---

## Feedback Intensity Reference

| Pattern | iOS Sound | Android Vibration |
|---------|-----------|-------------------|
| light | 2000Hz, 10ms | 10ms |
| medium | 1800Hz, 15ms | 25ms |
| strong | 1500Hz, 20ms | 50ms |
| success | 2200Hz, 25ms | [30, 50, 30]ms |
| error | 800Hz, 30ms | [50, 30, 50, 30, 50]ms |

---

## Common Issues & Fixes

### iOS - No Sound
- **Cause**: Audio context not initialized
- **Fix**: User must interact with page first (tap anywhere)
- **Fix**: Check if phone is on silent mode (audio still plays via WebKit)

### Android - No Vibration
- **Cause**: Vibration API blocked
- **Fix**: Check browser permissions
- **Fix**: Ensure vibration is enabled in system settings

### Desktop - No Feedback
- **Cause**: No vibration API, relies on audio only
- **Fix**: Ensure speakers/headphones connected
- **Expected**: Very subtle clicks (may be imperceptible on laptop speakers)

---

## Code Locations

| Feature | File | Line |
|---------|------|------|
| Haptic Utility | `/app/frontend/src/utils/haptic.js` | Full file |
| Init Call | `/app/frontend/src/pages/MiraDemoPage.jsx` | ~804 |
| Send Message | `/app/frontend/src/pages/MiraDemoPage.jsx` | ~2378 |
| Mira Response | `/app/frontend/src/pages/MiraDemoPage.jsx` | ~2889 |
| Error Haptic | `/app/frontend/src/pages/MiraDemoPage.jsx` | ~2956 |

---

## ✅ Sign-Off

| Device | Tester | Date | Status |
|--------|--------|------|--------|
| iPhone 14 Pro | | | ⬜ |
| iPhone SE | | | ⬜ |
| iPad | | | ⬜ |
| Samsung Galaxy | | | ⬜ |
| Google Pixel | | | ⬜ |
| Desktop Chrome | | | ⬜ |
| Desktop Safari | | | ⬜ |

---

**Note**: The haptic feedback is intentionally subtle to avoid being annoying. If you can barely feel/hear it, that's by design. The goal is subconscious feedback, not obvious alerts.

# THE DOGGY COMPANY - SINGLE SOURCE OF TRUTH (SSOT)
## In Loving Memory of Mystique 💜

**Last Updated:** 2026-03-03
**Version:** 5.0 - Memorial Edition

---

## ⚠️ CRITICAL: DO NOT CHANGE THESE FILES WITHOUT READING THIS DOCUMENT

### FILES THAT CONTROL CORE FUNCTIONALITY

| File | Purpose | NEVER CHANGE WITHOUT |
|------|---------|---------------------|
| `/app/frontend/src/styles/mira-prod.css` | All Mira OS styling | Testing on iOS Safari + Chrome |
| `/app/frontend/src/components/ProtectedRoute.jsx` | Auth flow | Testing login on production |
| `/app/frontend/src/context/AuthContext.jsx` | Token management | Testing logout/login cycle |
| `/app/backend/mira_soulful_brain.py` | Mira's AI brain | Soul Bible compliance check |
| `/app/frontend/src/components/Mira/MiraUnifiedHeader.jsx` | Pet switcher | Testing on mobile |

---

## 🔴 CRITICAL CSS RULES - NEVER MODIFY WITHOUT FULL UNDERSTANDING

### 1. iOS Safari Input Bar Positioning
**Location:** `/app/frontend/src/styles/mira-prod.css` (line ~10558-10575)

```css
/* MOBILE: Extra padding for iOS Safari toolbar */
@media (max-width: 768px) {
  .mira-prod .mp-composer {
    /* 76px = 32px base + 44px iOS Safari toolbar clearance */
    padding-bottom: calc(76px + env(safe-area-inset-bottom, 0px)) !important;
  }
}
```

**WHY THIS MATTERS:**
- iOS Safari has a navigation bar at the bottom (~44px)
- Safe area insets add more for notched iPhones
- Reducing this value will cause input bar to be cut off

### 2. Quick Chips Horizontal Scroll
**Location:** `/app/frontend/src/styles/mira-prod.css` (line ~3755) & `/app/frontend/src/components/Mira/WelcomeHero.jsx`

```css
.quick-chip {
  white-space: nowrap !important;
  flex-shrink: 0 !important;
  min-width: max-content;
}
```

**Plus inline styles in JSX:**
```jsx
style={{ whiteSpace: 'nowrap', flexShrink: 0, minWidth: 'max-content' }}
```

**WHY THIS MATTERS:**
- iOS Safari ignores some CSS flex rules
- Without these, chips overlap and become unreadable
- Both CSS AND inline styles are needed for iOS compatibility

### 3. Scroll Spring-Back Prevention
**Location:** `/app/frontend/src/styles/mira-prod.css` (line ~120)

```css
.mp-messages {
  overscroll-behavior: none;
  overscroll-behavior-y: none;
  -webkit-overflow-scrolling: auto; /* NOT touch */
}
```

**WHY THIS MATTERS:**
- `-webkit-overflow-scrolling: touch` causes elastic bounce on iOS
- This prevents users from scrolling properly
- `overscroll-behavior: none` stops spring-back

### 4. Mobile Pet Switcher Dropdown (React Portal)
**Location:** `/app/frontend/src/components/Mira/MiraUnifiedHeader.jsx` (line ~222)

```jsx
{typeof window !== 'undefined' && window.innerWidth <= 768 ? (
  createPortal(
    <div className="pet-switcher-dropdown" style={{...}}>
      {/* dropdown content */}
    </div>,
    document.body
  )
) : (
  <div className="pet-switcher-dropdown">
    {/* dropdown content */}
  </div>
)}
```

**WHY THIS MATTERS:**
- The `.mira-prod` container has `overflow: hidden`
- Fixed-positioned elements get clipped inside overflow:hidden parents
- Portal renders dropdown OUTSIDE the clipped container
- Without this, dropdown is invisible on mobile

### 5. Hidden Test Panel and Sandbox Footer
**Location:** `/app/frontend/src/styles/mira-prod.css`

```css
.mp-test-panel { display: none; }
.mp-sandbox-footer { display: none; }
```

**Also:** `/app/frontend/src/pages/MiraDemoPage.jsx`
```jsx
const [showTestScenarios, setShowTestScenarios] = useState(false);
```

**WHY THIS MATTERS:**
- These overlapped the input bar on mobile
- Showing them breaks the UI
- If needed for testing, toggle temporarily

---

## 🟢 MIRA SOUL BIBLE COMPLIANCE

### Core Principles (from MIRA_SOUL_BIBLE.md)

1. **MEMORY-FIRST**: Mira NEVER asks for information she already knows
   - If pet has allergy → Mira refuses that ingredient automatically
   - If pet loves something → Mira recommends it proactively
   - **SYSTEM FAILURE** if Mira asks "What's your pet's name?"

2. **VOICE RULES** (from PET_OS_BEHAVIOR_BIBLE.md):
   - **BANNED OPENERS:** "Great idea!", "I'd be happy to", "Absolutely!", "Sure!"
   - **PREFERRED:** "Oh, for Mojo...", "Since I know Mystique...", "Because Mojo loves..."

3. **QUICK CONVERGENCE**:
   - Service requests → 2-3 questions max → Hand off to Concierge
   - Create ticket immediately for bookings

4. **PERSONALITY**:
   - Use pet's NAME, not breed stereotypes
   - Reference personal traits (energetic, loves salmon)
   - Never generic advice

### Audit Results (2026-03-03): **11/11 PASSED**
- Memory/Allergies: ✅ Mira refuses chicken for Mojo
- Voice: ✅ No banned openers
- Convergence: ✅ Creates tickets quickly
- PICKS: ✅ Suggestions appear in panel
- Learning: ✅ New facts saved
- Pet Switching: ✅ Context changes correctly

---

## 📱 MOBILE COMPATIBILITY CHECKLIST

Before deploying changes, verify on:

### iOS Safari (CRITICAL)
- [ ] Input bar visible above browser toolbar
- [ ] Quick chips not overlapping
- [ ] Pet switcher dropdown appears from bottom
- [ ] Scroll doesn't spring back
- [ ] Safe area respected on notched iPhones

### Android Chrome
- [ ] Input bar not cut off
- [ ] Keyboard doesn't cover input
- [ ] Navigation gestures work

### Desktop Chrome/Safari
- [ ] Input bar has 24px+ bottom clearance
- [ ] All navigation tabs clickable
- [ ] Soul ring displays correctly

---

## 🔐 AUTHENTICATION FLOW

### Token Storage
```javascript
// Key names - DO NOT CHANGE
const TOKEN_KEY = 'tdb_auth_token';
localStorage.setItem('user', JSON.stringify(userData));
```

### ProtectedRoute Logic (v5)
```
1. Check localStorage for token
2. If NO token → Redirect to /login
3. If HAS token → Trust it, show content
4. If requireMembership → Check user's membership status
```

**NEVER ADD:**
- useEffect loops that check auth repeatedly
- Multiple redirects in sequence
- Token validation on every render

---

## 🗄️ DATABASE (MongoDB)

### Critical Collections
- `pets` - Pet profiles with owner_id
- `users` - User accounts
- `learned_facts` - Mira's memory per pet
- `tickets` - Service requests
- `soul_profiles` - Pet soul data

### Auto-Linking Script
On server startup, `/api/mira/routes.py` runs a script to link orphaned pets to the primary user. This prevents "No pets found" errors.

---

## 🚀 DEPLOYMENT CHECKLIST

### Before Deploying
1. Test login flow in preview
2. Test iOS Safari mobile view
3. Verify quick chips don't overlap
4. Confirm input bar has bottom padding

### After Deploying
1. Open incognito browser
2. Search page source for version marker (e.g., `v5_production_debug`)
3. If marker not found → Deployment failed, retry
4. Test login → Should redirect to /pet-home
5. Check console for errors

---

## 📊 ADMIN PANEL

**URL:** `/admin`
**Credentials:** aditya / lola4304

### Sections
- **COMMAND CENTER:** Dashboard, Service Desk, Unified Inbox, Finance
- **MEMBERS & PETS:** Pet Parents, Pet Profiles, Membership, Loyalty
- **COMMERCE:** Orders, Fulfillment, Product Box, Collections
- **14 PILLARS:** Celebrate, Dine, Stay, Travel, Care, Enjoy, Fit, Learn, Paperwork, Advisory, Emergency, Farewell, Adopt, Shop
- **MIRA & AI:** Mira Chats, Live Threads, Memory, Kit Assembly
- **MASTER SYNC:** Syncs production data

---

## 💜 FOR MYSTIQUE

This system was perfected in memory of Mystique. Every detail matters:

- Her allergies are remembered
- Her personality shines through Mira's responses  
- Her soul score reflects her beautiful life
- She will never be forgotten

**Mystique's Legacy:** A Pet OS that truly knows and loves every pet.

---

*This document is sacred. Update it with every significant change.*

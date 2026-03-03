# ⛔ CRITICAL DEVELOPER INSTRUCTIONS
## READ THIS BEFORE CHANGING ANY CODE

**Last Updated:** 2026-03-03
**Status:** PRODUCTION CRITICAL

---

## 🚨 STOP! READ THIS FIRST!

Before making ANY changes to these files, you MUST:

1. Read `/app/SSOT.md` completely
2. Understand WHY the current code exists
3. Test on REAL iOS Safari device
4. Test on production after deployment

---

## ☠️ FILES THAT WILL BREAK PRODUCTION IF CHANGED INCORRECTLY

### 1. `/app/frontend/src/styles/mira-prod.css`

**DANGEROUS LINES:**

```
Line ~10558-10575: .mira-prod .mp-composer padding
Line ~120-145: .mp-messages padding-bottom
Line ~3755-3800: .quick-chip flex properties
Line ~67-95: .mira-prod overflow: hidden
```

**SYMPTOMS IF BROKEN:**
- Input bar cut off on iOS
- Chips overlapping
- Content going under nav
- Scroll spring-back

**HOW TO FIX:**
- NEVER reduce padding-bottom values
- NEVER remove `flex-shrink: 0` from chips
- NEVER change `overflow: hidden` to `visible`

---

### 2. `/app/frontend/src/components/ProtectedRoute.jsx`

**CURRENT VERSION:** v5_production_debug_20250610

**DANGEROUS CHANGES:**
```
❌ Adding useEffect hooks that redirect
❌ Checking token validity on every render
❌ Multiple sequential Navigate calls
❌ Using navigate() instead of <Navigate />
```

**CORRECT LOGIC:**
```javascript
// Simple: Has token? Show content. No token? Redirect.
if (!hasToken) return <Navigate to="/login" />;
return children;
```

---

### 3. `/app/frontend/src/components/Mira/MiraUnifiedHeader.jsx`

**DANGEROUS CHANGES:**
```
❌ Removing createPortal for mobile dropdown
❌ Removing inline styles from dropdown
❌ Changing window.innerWidth check
```

**WHY PORTAL IS NEEDED:**
- Parent has `overflow: hidden`
- Fixed positioning breaks inside overflow:hidden
- Portal renders outside the container

---

### 4. `/app/frontend/src/components/Mira/WelcomeHero.jsx`

**DANGEROUS CHANGES:**
```
❌ Removing inline styles from quick chips
❌ Removing style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
```

**WHY INLINE STYLES:**
- iOS Safari ignores CSS-only rules
- Both CSS AND inline needed for iOS

---

### 5. `/app/backend/mira_soulful_brain.py`

**DANGEROUS CHANGES:**
```
❌ Removing pet context from prompts
❌ Changing learned_facts extraction
❌ Modifying function calling schema
❌ Removing allergy checks
```

**MIRA WILL BREAK IF:**
- Pet name not in system prompt
- Allergies not passed to AI
- Memory not retrieved before response

---

## ✅ SAFE CHANGES

These changes are generally safe:

1. **Adding new pillars** - Follow existing pattern
2. **New admin sections** - Copy existing structure
3. **Content updates** - Text, images, copy
4. **New API endpoints** - Add, don't modify existing
5. **New components** - Create new files, don't edit core

---

## 🧪 TESTING REQUIREMENTS

### Before ANY Production Deploy:

1. **Login Test**
   - Open incognito
   - Login with test credentials
   - Verify redirect to /pet-home
   - Check console for errors

2. **iOS Safari Test**
   - Open on real iPhone
   - Check input bar visibility
   - Test quick chips scroll
   - Verify pet switcher opens

3. **Mira Test**
   - Ask about pet allergies
   - Verify Mira remembers
   - Check quick replies appear
   - Confirm no banned openers

---

## 📱 MOBILE BREAKPOINTS

```css
/* These breakpoints are used everywhere - don't change */
@media (max-width: 768px) { /* Mobile */ }
@media (max-width: 480px) { /* Small phone */ }
@media (min-width: 769px) { /* Desktop */ }
@media (min-width: 1200px) { /* Large desktop */ }
```

---

## 🔐 ENVIRONMENT VARIABLES

**NEVER HARDCODE:**
- API URLs
- Database credentials
- API keys
- Tokens

**ALWAYS USE:**
```javascript
// Frontend
process.env.REACT_APP_BACKEND_URL

// Backend
os.environ.get('MONGO_URL')
```

---

## 📝 COMMIT MESSAGE FORMAT

When fixing bugs:
```
fix(component): Brief description

- What was broken
- What was fixed
- Test method used

Tested: iOS Safari 17, Chrome 120
```

---

## 🆘 IF PRODUCTION BREAKS

1. **Don't panic**
2. Check this file for known issues
3. Check `/app/SSOT.md` for fixes
4. If auth breaks → Restore ProtectedRoute.jsx
5. If mobile breaks → Check CSS padding values
6. If Mira breaks → Check mira_soulful_brain.py

---

## 💜 REMEMBER

This code honors Mystique's memory.
Every bug fixed is a tribute to her.
Every feature is part of her legacy.

Handle with care.

---

*Last verified working: 2026-03-03 by E1 Agent*

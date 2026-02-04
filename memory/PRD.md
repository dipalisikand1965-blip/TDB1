# The Doggy Company - Product Requirements Document

## Original Problem Statement
Build "The Doggy Company," a one-stop-shop concierge for dog parents with a focus on emotional connection and the "Pet Soul™" concept. Transform the site from a functional pet services marketplace into an emotionally resonant "Pet Life Operating System."

## Core Philosophy
- **We Celebrate Life** - Through every moment, joyful or challenging, we see celebration
- **Mira interprets lives** - Memory and judgement layer, not a request fulfiller
- **Brain vs Hand** - Mira is the brain, Concierge® is the hand. One understands life, the other moves the world

---

## PROJECT HEALTH SCORE: 8.5/10

### What's Working Well (Green)
- ✅ Core membership onboarding flow
- ✅ Pet Soul™ profiles and Pet Pass cards
- ✅ Mira AI with conversational memory
- ✅ All 14 pillars of service
- ✅ Dashboard with 15 tabs (fully functional)
- ✅ Service desk with ticket merging
- ✅ Brand story video with ElevenLabs voiceover
- ✅ Mobile-first responsive design
- ✅ Razorpay payment integration (test mode)

### Needs Attention (Yellow)
- ⚠️ Pet photo upload (backend works, frontend needs testing)
- ⚠️ Profile completion redirect (user reported issue, not reproduced)
- ⚠️ Voice input on iOS (fallback message added, needs text input option)

### Known Issues (Red)
- 🔴 Screenshot tool crashes (environment limitation)

---

## SESSION 4 SUMMARY (February 4, 2026)

### Completed Today:

#### 1. Mobile Bug Fixes
- ✅ Homepage hero video - reduced to 50vh, object-position: center top
- ✅ Mobile dashboard tabs - changed to flex-wrap (rows, not scroll)
- ✅ Sign out button - added touch handlers for mobile
- ✅ Pet photo upload - backend verified working

#### 2. Mira AI Conversational Fix
- ✅ Fixed issue where Mira created booking tickets for simple questions
- ✅ "How to control fleas" now gets a direct answer, not a ticket
- ✅ Added question pattern detection (how to, what is, tips for, etc.)

#### 3. Brand Story Video Overhaul
- ✅ Regenerated all 4 voiceovers with MORE emotional delivery
- ✅ New scripts: 
  - "Look into their eyes... and you already know."
  - "They're not just pets... they're your heart walking outside your body."
  - "Every tail wag... every happy moment... we help you cherish them all."
  - "The Doggy Company... because every pet has a soul."
- ✅ Fixed video/audio sync - both preload before playing
- ✅ Fixed infinite loop - plays through once then closes
- ✅ Mobile text positioning - moved above nav bar

#### 4. Pet Parent Photo Upload
- ✅ Added photo upload on onboarding Step 1
- ✅ Backend endpoint: POST /api/users/{user_id}/photo
- ✅ Serves photos from database: GET /api/user-photo/{user_id}

#### 5. Naming Consistency Fix
- ✅ Changed "Pet Pass Founder" → "Pet Pass Foundation" everywhere

---

## TOMORROW'S PRIORITIES

### P0 - Must Fix
1. **Test brand story on device** - Verify video/audio sync works on real iPhone
2. **Pet photo upload e2e** - Test the full flow on frontend
3. **Run comprehensive audit** - Use testing_agent on all pages

### P1 - Should Do
4. **Voice input text fallback** - Add text input for iOS users
5. **Verify all membership flows** - Trial and Foundation signup
6. **Display parent photo** - Show uploaded photo in dashboard/profile

### P2 - Nice to Have
7. **Pet Soul animations** - Enhance first reveal experience
8. **Testimonials section** - Add family video testimonials
9. **Replace stock images** - Use custom pet photos

---

## TECHNICAL DEBT

1. ESLint warnings in MembershipOnboarding.jsx (unescaped quotes)
2. Pre-existing lint errors in server.py (unused imports)
3. Screenshot tool memory crashes (environment issue)

---

## KEY FILES MODIFIED TODAY

| File | Changes |
|------|---------|
| `/app/frontend/src/pages/Home.jsx` | Brand story modal rewrite, hero video sizing |
| `/app/frontend/src/pages/MemberDashboard.jsx` | Tab layout, signout button |
| `/app/frontend/src/pages/MembershipOnboarding.jsx` | Parent photo upload, Foundation naming |
| `/app/frontend/src/pages/PetSoulOnboard.jsx` | Foundation naming |
| `/app/backend/mira_routes.py` | Question detection for conversational mode |
| `/app/backend/server.py` | User photo upload endpoints |
| `/app/backend/regenerate_emotional_voice.py` | New emotional voiceover script |

---

## 3RD PARTY INTEGRATIONS

| Service | Status | Notes |
|---------|--------|-------|
| Razorpay | ✅ Working | Test mode keys |
| ElevenLabs | ✅ Working | Brand story voiceovers |
| Sora 2 | ✅ Working | Brand story videos |
| MongoDB | ✅ Working | All data persistence |

---

## TEST CREDENTIALS

- **Test User**: testnew@emergent.com / test1234
- **Admin**: aditya / lola4304
- **Test Pet ID**: pet-e3cd94659908

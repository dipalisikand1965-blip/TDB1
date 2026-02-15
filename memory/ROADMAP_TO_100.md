# Mira OS - Road to 100/100
## Sequential Roadmap for Platform Excellence
### February 15, 2026

---

## CURRENT STATE: 89/100

```
██████████████████████░░░░ 89%
```

---

## THE ROADMAP: 22 STEPS TO PERFECTION

Each step is designed to be **completed in one focused session**. No multitasking. Complete one, verify, move to next.

---

### PHASE 1: CRITICAL FIXES (89 → 93)
*Impact: +4 points | Duration: ~2 sessions*

| Step | Task | Points | Status |
|------|------|--------|--------|
| **1** | Test & Fix ElevenLabs Voice Playback in Mira OS Modal | +1 | ✅ DONE |
| **2** | Fix Mira Picks API to return pet-specific products | +1 | ⬜ |
| **3** | Implement Concierge Handoff API endpoint | +1 | ⬜ |
| **4** | Add product cards to Mira chat responses | +1 | ⬜ |

**Step 1 Notes (Completed Feb 15, 2026):**
- ElevenLabs TTS confirmed working via backend API `/api/tts/generate`
- Frontend integration verified with console logs showing audio playback
- Added "Fresh Chat" feature: new session ID on pet switch
- Added "New Chat" button (RotateCcw icon) in Mira OS header
- Chat clears automatically when switching pets for fresh conversation

---

### PHASE 2: SOUL INTELLIGENCE (93 → 96)
*Impact: +3 points | Duration: ~2 sessions*

| Step | Task | Points | Status |
|------|------|--------|--------|
| **5** | Create Quick Question Weaving in Mira Chat | +1 | ⬜ |
| **6** | Add questions for Family & Pack pillar (5 questions) | +0.5 | ⬜ |
| **7** | Add questions for Rhythm & Routine pillar (5 questions) | +0.5 | ⬜ |
| **8** | Add questions for Home Comforts pillar (5 questions) | +0.5 | ⬜ |
| **9** | Add questions for Travel Style pillar (5 questions) | +0.5 | ⬜ |

---

### PHASE 3: UX POLISH (96 → 98)
*Impact: +2 points | Duration: ~2 sessions*

| Step | Task | Points | Status |
|------|------|--------|--------|
| **10** | Deprecate old /celebrate, redirect to /celebrate-new | +0.5 | ⬜ |
| **11** | Add "Allergy Safe" quick filter to Shop page | +0.5 | ⬜ |
| **12** | Make "For You" section pet-specific in Shop | +0.5 | ⬜ |
| **13** | Fix "Find buddies" on Enjoy page | +0.5 | ⬜ |

---

### PHASE 4: TRUST & CONTENT (98 → 99)
*Impact: +1 point | Duration: ~1 session*

| Step | Task | Points | Status |
|------|------|--------|--------|
| **14** | Populate "Featured Experts" on Advisory page | +0.25 | ⬜ |
| **15** | Update Adopt page stats (fix "0 Happy Adoptions") | +0.25 | ⬜ |
| **16** | Add trainer profiles to Learn page cards | +0.25 | ⬜ |
| **17** | Add price range filter to Shop | +0.25 | ⬜ |

---

### PHASE 5: FINAL POLISH (99 → 100)
*Impact: +1 point | Duration: ~1 session*

| Step | Task | Points | Status |
|------|------|--------|--------|
| **18** | Add Google OAuth for easier onboarding | +0.25 | ⬜ |
| **19** | Improve empty pet photo placeholders | +0.25 | ⬜ |
| **20** | Add "Back to Top" button in footer | +0.15 | ⬜ |
| **21** | Add app store badges to footer | +0.15 | ⬜ |
| **22** | Final QA pass on all 14 pillars | +0.2 | ⬜ |

---

## EXECUTION GUIDE

### How to Use This Roadmap

```
1. Pick the next uncompleted step (in order)
2. Focus ONLY on that step
3. Test thoroughly
4. Mark as ✅ when done
5. Move to next step
```

### Step Completion Checklist

For each step, ensure:
- [ ] Implementation complete
- [ ] Tested via API/curl
- [ ] Tested via browser/screenshot
- [ ] No regressions introduced
- [ ] User verified (if applicable)

---

## STEP-BY-STEP DETAILS

### STEP 1: ElevenLabs Voice Playback
**File:** `/app/frontend/src/components/mira-os/MiraOSModal.jsx`
**Test:** Click voice button in Mira OS modal, verify audio plays
**Success:** User hears Mira speak responses

### STEP 2: Mira Picks API
**File:** `/app/backend/mira_routes.py` or `/app/backend/picks_engine.py`
**Test:** `GET /api/mira/picks?pet_id=pet-xxx&pillar=celebrate`
**Success:** Returns 3-6 personalized product picks

### STEP 3: Concierge Handoff API
**File:** `/app/backend/concierge_routes.py`
**Test:** `POST /api/concierge/mira-request`
**Success:** Creates ticket, returns request_id

### STEP 4: Products in Chat Responses
**File:** `/app/backend/mira_routes.py`
**Test:** Ask Mira "show me treats for Lola"
**Success:** Response includes product cards array

### STEP 5: Quick Question Weaving
**File:** `/app/backend/mira_routes.py`
**Logic:** After every 3rd message, inject: "By the way, [unanswered question]?"
**Success:** Mira naturally asks soul questions during chat

### STEP 6-9: Soul Pillar Questions
**File:** `/app/backend/pet_soul_routes.py`
**Add:** 5 weighted questions per empty pillar
**Success:** Quick Questions API returns diverse questions

### STEP 10: Deprecate Old Celebrate
**File:** `/app/frontend/src/App.js`
**Change:** Redirect /celebrate → /celebrate-new
**Success:** No more duplicate celebrate pages

### STEP 11: Allergy Safe Filter
**File:** `/app/frontend/src/pages/ShopPage.jsx`
**Add:** Quick filter pill for allergy-safe products
**Success:** Filter shows grain-free, nut-free products

### STEP 12: Pet-Specific "For You"
**File:** `/app/frontend/src/pages/ShopPage.jsx`
**Change:** Pass pet_id to products API
**Success:** Shows products matching pet's profile

### STEP 13: Fix Find Buddies
**File:** `/app/frontend/src/pages/EnjoyPage.jsx`
**Add:** Playdate matching functionality
**Success:** Button opens matching flow

### STEP 14: Featured Experts
**File:** `/app/backend/advisory_routes.py`
**Add:** Seed 3-5 expert profiles
**Success:** Advisory page shows real experts

### STEP 15: Adopt Page Stats
**File:** `/app/frontend/src/pages/AdoptPage.jsx`
**Fix:** Pull real adoption stats or remove "0"
**Success:** Shows realistic numbers

### STEP 16: Trainer Profiles
**File:** `/app/frontend/src/pages/LearnPage.jsx`
**Add:** Link training cards to trainer profiles
**Success:** Cards are clickable, show details

### STEP 17: Price Range Filter
**File:** `/app/frontend/src/pages/ShopPage.jsx`
**Add:** Price range slider/pills
**Success:** Can filter by price

### STEP 18: Google OAuth
**Files:** Backend auth + Frontend login
**Add:** Google social login button
**Success:** One-click Google signup

### STEP 19: Pet Photo Placeholders
**File:** `/app/frontend/src/pages/MyPets.jsx`
**Improve:** Better placeholder with pet initials
**Success:** Empty photos look intentional

### STEP 20: Back to Top
**File:** `/app/frontend/src/components/Footer.jsx`
**Add:** Floating "↑" button
**Success:** One-click scroll to top

### STEP 21: App Store Badges
**File:** `/app/frontend/src/components/Footer.jsx`
**Add:** iOS/Android badges (even if placeholder)
**Success:** Footer shows download options

### STEP 22: Final QA
**Test:** All 14 pillars, dashboards, flows
**Success:** No broken links, no console errors

---

## PROGRESS TRACKER

```
Phase 1: ⬜⬜⬜⬜ (0/4)
Phase 2: ⬜⬜⬜⬜⬜ (0/5)
Phase 3: ⬜⬜⬜⬜ (0/4)
Phase 4: ⬜⬜⬜⬜ (0/4)
Phase 5: ⬜⬜⬜⬜⬜ (0/5)

Total: 0/22 steps complete
Score: 89/100
```

---

## READY TO START?

**Next Action:** Step 1 - Test & Fix ElevenLabs Voice Playback

Say "Go" and I'll begin with Step 1.

---

*Roadmap created: February 15, 2026*
*Target: 100/100 Platform Score*

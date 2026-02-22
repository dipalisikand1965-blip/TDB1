# MIRA OS - Single Source of Truth (SSOT)
## The Doggy Company Pet Operating System
**Last Updated:** December 2025 (Session 5 - ONBOARDING COMPLETE)  
**Live Site:** https://thedoggycompany.com  
**Preview:** https://pet-home-hub.preview.emergentagent.com

---

## 🎉 SESSION 5 STATUS: ONBOARDING FLOW COMPLETE

### What was accomplished:
- ✅ **Fixed ALL 8 user feedback bugs** from previous testing
- ✅ **Gender before Name** - Now asks gender right after photo, enables his/her pronouns
- ✅ **Birthday Screen** - 3 options with date pickers (Birthday, Gotcha Day, Approximate Age)
- ✅ **Full Address** - Textarea added for House/Flat No., Street, Landmark
- ✅ **City Free Text** - Changed from dropdown to text input
- ✅ **No Skip Button** - All 13 soul questions are compulsory
- ✅ **Payoff Fixed** - Shows "Here's what Mira knows about {petName}" (not nickname)
- ✅ **JSON Error Fixed** - Response body was being read twice
- ✅ **Pet Home Page Created** - New `/pet-home` route as default landing

### What is working:
- Complete onboarding flow at `/join`
- Photo → Gender → Name → Birthday → Parent Info → 13 Soul Questions → Payoff → Pet Home
- Account creation and auto-login
- Pet Home page with hero, pillar shortcuts, alerts, and Mira CTA

---

## 🐛 BUGS TO FIX (Priority Order)

### P0 - CRITICAL (Fix immediately)

| Bug | File | Issue | Fix Required |
|-----|------|-------|--------------|
| **API Error on Submit** | `MiraMeetsYourPet.jsx` line ~567 | "Failed to execute 'json' on 'Response': body stream already read" | Response body is being read twice. Check `handleFinalSubmit` function - likely calling `.json()` twice on same response |
| **Pet Home doesn't exist** | N/A | After successful submit, redirects to `/member-dashboard` but should go to new Pet Home page | Need to build `/pet-home` page OR fix redirect |

### P1 - USER FEEDBACK (Must implement)

| Issue | Current | Required | File to Change |
|-------|---------|----------|----------------|
| **Gender before Name** | Gender asked in Soul Game | Ask gender RIGHT AFTER photo, BEFORE name. So we can say "What's his name?" not "their name" | `MiraMeetsYourPet.jsx` - move gender to photo screen |
| **Auto breed detection** | Not triggering reliably | Should auto-trigger when photo uploaded. If fails, show "What kind of dog is this?" | `MiraMeetsYourPet.jsx` - check `handlePhotoUpload` function |
| **City field** | Dropdown with limited cities | Should be text input that allows ANY city (user could be from anywhere) | `MiraMeetsYourPet.jsx` - change from `<select>` to `<input>` |
| **Full address needed** | Only city captured | Need full address field for shipping (House/Flat, Street, Landmark) | `MiraMeetsYourPet.jsx` - add address textarea to parent info |
| **Birthday date capture** | Only asks "do you know birthday?" | Need actual date picker to capture the date. Also Gotcha Day option | `MiraMeetsYourPet.jsx` - add date picker component |
| **Main goal multi-select** | Single select | User should select MULTIPLE goals for their pet | `MiraMeetsYourPet.jsx` - already changed to multiSelect: true, verify it works |
| **Payoff shows wrong name** | Shows nickname in wrong place | "Here's what Mira knows about Muah" - should show pet name not nickname | `MiraMeetsYourPet.jsx` - fix in `renderPayoffScreen` |

### P2 - ENHANCEMENTS

| Issue | Details |
|-------|---------|
| **"Keep Teaching Mira" flow** | Should go to Soul Builder (`/soul-builder`) for remaining 38 questions. Currently broken. |
| **No Skip option** | User said "till here compulsory (no skip)" - remove skip buttons from core flow |
| **Progressive reveal** | User suggested: 15 questions → payoff → choice → 15 more → payoff → choice. Create milestone system. |

---

## 📋 COMPLETE FLOW SPECIFICATION (User Approved)

### Entry Points
- **New user**: `/join` → Mira Meets Your Pet
- **Existing user adding pet**: Pet switcher → "Add pet" → Mira Meets Your Pet

### The Flow (MUST IMPLEMENT EXACTLY)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  SCREEN 1: PHOTO UPLOAD                                                      │
│  ───────────────────────────────────────────────────────────────────────────│
│  • "Let Mira meet your pet"                                                  │
│  • Upload photo button                                                       │
│  • After upload: AI breed detection auto-triggers                            │
│  • Show: "Mira thinks [Breed]" with [Confirm] [Change] buttons              │
│  • If detection fails: "What kind of dog is this?" [Select Breed] [Mixed]   │
├─────────────────────────────────────────────────────────────────────────────┤
│  SCREEN 2: GENDER (Right after photo, BEFORE name)                           │
│  ───────────────────────────────────────────────────────────────────────────│
│  • "Is this a boy or girl?"                                                  │
│  • [Boy ♂️] [Girl ♀️] tap chips                                              │
│  • This enables gendered language in next screens                            │
├─────────────────────────────────────────────────────────────────────────────┤
│  SCREEN 3: NAME + NICKNAME                                                   │
│  ───────────────────────────────────────────────────────────────────────────│
│  • "What's his/her name?" (use gender from previous screen)                  │
│  • Text input for name                                                       │
│  • "Do you have a pet name for [Name]?" (optional nickname)                  │
│  • [Continue] button                                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│  SCREEN 4: BIRTHDAY/GOTCHA DAY                                               │
│  ───────────────────────────────────────────────────────────────────────────│
│  • "When did [Name] come into your life?"                                    │
│  • [I know the birthday 🎂] → Show date picker                               │
│  • [I know the Gotcha Day 🏠] → Show date picker                             │
│  • [Just approximate age] → Show age selector                                │
│  • MUST capture actual date, not just yes/no                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│  SCREEN 5: PARENT INFO (One screen, all fields)                              │
│  ───────────────────────────────────────────────────────────────────────────│
│  • Your name                                                                 │
│  • Email                                                                     │
│  • Phone                                                                     │
│  • [✓] WhatsApp same as phone (or separate field)                           │
│  • Full Address (textarea: House/Flat, Street, Landmark)                     │
│  • City (TEXT INPUT - allow any city, not dropdown)                          │
│  • Pincode                                                                   │
│  • Password                                                                  │
│  • Notification preferences (3 toggles)                                      │
│  • [✓] Terms & Privacy                                                       │
│  • [Let's Go!] button                                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│  SCREENS 6-18: SOUL GAME (13 questions, one per screen)                      │
│  ───────────────────────────────────────────────────────────────────────────│
│  Format for each:                                                            │
│  • Top: Soul ring % + "Mira knows [Name]"                                    │
│  • Middle: Pet photo + Question                                              │
│  • Bottom: 3-6 tap chips                                                     │
│  • After answer: "✨ Mira now knows: [fact]" (1.5 sec)                       │
│  • NO SKIP BUTTONS - all questions compulsory                                │
│                                                                              │
│  Questions (in order):                                                       │
│  1. Life stage (Puppy/Young/Adult/Senior)                                   │
│  2. Temperament (Playful/Calm/Curious/Shy/Energetic/Protective)             │
│  3. Stranger reaction (Friendly/Cautious/Nervous/Protective/Indifferent)    │
│  4. Food allergies (multi-select: None/Chicken/Beef/Grains/Dairy/Fish)      │
│  5. Favorite protein (Chicken/Lamb/Fish/Beef/Duck/Not sure)                 │
│  6. Exercise needs (Low/Medium/High/Very High)                              │
│  7. Health conditions (multi-select: None/Allergies/Arthritis/etc.)         │
│  8. Grooming tolerance (Loves it/Tolerates/Hates it)                        │
│  9. Separation anxiety (No/Sometimes/Yes)                                   │
│  10. Lives with (Just me/Partner/Family/Roommates)                          │
│  11. Other pets (None/Dogs/Cats/Both/Other)                                 │
│  12. Spayed/Neutered (Yes/No/Not sure)                                      │
│  13. Main goals (MULTI-SELECT: Health/Happiness/Training/Social/etc.)       │
├─────────────────────────────────────────────────────────────────────────────┤
│  SCREEN 19: PAYOFF REVEAL                                                    │
│  ───────────────────────────────────────────────────────────────────────────│
│  • Glowing soul ring with percentage (~30-35%)                               │
│  • "[Name]'s Soul Started!"                                                  │
│  • "Here's what Mira already knows about [Name]:" (NOT nickname here)        │
│  • 5 bullet points summarizing answers                                       │
│  • "Your score will grow as Mira learns more"                                │
│  • [See [Name]'s Home →] - PRIMARY CTA                                       │
│  • [Keep Teaching Mira] - Goes to Soul Builder for remaining 38 questions   │
├─────────────────────────────────────────────────────────────────────────────┤
│  SCREEN 20: PET HOME (Default landing after onboarding)                      │
│  ───────────────────────────────────────────────────────────────────────────│
│  • Pet Hero (photo, name, breed, soul ring, 3 traits)                        │
│  • "What would you like to do for [Name]?" + pillar shortcuts                │
│  • Picks button (sticky top)                                                 │
│  • Proactive alerts (birthday/vaccine/etc.)                                  │
│  • Open requests strip                                                       │
│  • Talk to Mira CTA                                                          │
│  • THIS PAGE DOES NOT EXIST YET - NEEDS TO BE BUILT                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 KEY FILES

### New Onboarding (Session 4)
| File | Purpose | Status |
|------|---------|--------|
| `/app/frontend/src/pages/MiraMeetsYourPet.jsx` | New onboarding component | Built, needs fixes |
| `/app/frontend/src/App.js` | Routes - `/join` now points to MiraMeetsYourPet | Updated |

### Existing Files (Reference)
| File | Purpose |
|------|---------|
| `/app/frontend/src/pages/MembershipOnboarding.jsx` | OLD onboarding (kept at `/join-old`) |
| `/app/frontend/src/pages/SoulBuilder.jsx` | 8-chapter soul questions (51 total) |
| `/app/frontend/src/pages/MiraDemoPage.jsx` | Full Mira OS/POS interface |
| `/app/frontend/src/pages/MemberDashboard.jsx` | Current dashboard (NOT Pet Home) |
| `/app/backend/server.py` | Backend API (15,000+ lines) |

### API Endpoints Used
| Endpoint | Purpose |
|----------|---------|
| `POST /api/membership/onboard` | Creates user + pet account |
| `POST /api/auth/login` | Auto-login after account creation |
| `POST /api/pets/detect-breed` | AI breed detection from photo |
| `GET /api/pets/my-pets` | Fetch user's pets |

---

## 🔧 TECHNICAL NOTES

### The API Error Fix
The error "Failed to execute 'json' on 'Response': body stream already read" happens when you call `.json()` twice on the same fetch response. 

**Location:** `MiraMeetsYourPet.jsx` → `handleFinalSubmit` function (~line 567)

**Likely cause:**
```javascript
// WRONG - reading body twice
const data = await response.json();
if (!response.ok) {
  throw new Error(data.detail || 'Failed');
}
// ... later ...
const loginData = await response.json(); // ERROR - body already read
```

**Fix:**
```javascript
// CORRECT - read once, store result
const data = await response.json();
if (!response.ok) {
  throw new Error(data.detail || 'Failed');
}
// Use 'data' variable, don't call .json() again
```

### Breed Detection
The breed detection API exists at `POST /api/pets/detect-breed`. It accepts a FormData with a file and returns:
```json
{
  "breed": "Golden Retriever",
  "confidence": 0.87
}
```

Store these fields on the pet:
- `breed_detected`: string
- `breed_confirmed`: boolean (user must confirm)
- `breed_confidence`: number (0-1)

### Soul Score Calculation
Current calculation in `MiraMeetsYourPet.jsx`:
```javascript
const calculateSoulScore = useCallback(() => {
  const answered = Object.keys(answers).length;
  const total = SOUL_QUESTIONS.length; // 13 questions
  return Math.round((answered / total) * 35); // Max 35% from onboarding
}, [answers]);
```

This gives ~2.7% per question. With 13 questions = ~35% max.

---

## 🎯 NEXT STEPS (Priority Order)

### Immediate (This Session)
1. **Fix API error** in `handleFinalSubmit` - stop double-reading response body
2. **Add gender screen** right after photo, before name
3. **Update name screen** to use "his/her" based on gender
4. **Add address field** to parent info (textarea for full address)
5. **Change city** from dropdown to text input
6. **Add birthday date picker** - capture actual dates
7. **Fix payoff screen** - show pet name, not nickname, in "Here's what Mira knows about..."
8. **Remove skip buttons** - make all questions compulsory
9. **Test full flow** end to end

### Next Priority
10. **Build Pet Home page** (`/pet-home`) - the default landing after onboarding
11. **Connect "Keep Teaching Mira"** to Soul Builder for remaining questions
12. **Add milestone system** - every 15 questions, show payoff, let user continue or exit

### Future
- Apply card layout fixes to all pillar pages
- Build unified Mira architecture for all pillars
- Activate Birthday Engine, WhatsApp integration
- Razorpay payment integration

---

## 🔑 CREDENTIALS

| Type | Email/Username | Password |
|------|----------------|----------|
| Member Test | dipali@clubconcierge.in | test123 |
| Admin | aditya | lola4304 |

---

## 📊 DATABASE COLLECTIONS

| Collection | Purpose |
|------------|---------|
| `users` | User accounts with pets array |
| `pets` | Pet profiles with soul_answers |
| `products_master` | 2,541 products |
| `services_master` | Services catalog |
| `service_desk_tickets` | Support tickets |

---

## ⚠️ KNOWN BLOCKERS

| Blocker | Impact | Workaround |
|---------|--------|-----------|
| Platform media limit | Screenshot tool blocked | Use testing agent or manual testing |
| Razorpay keys | Payment flow untested | Use "Skip Demo" mode |
| ElevenLabs quota | TTS limited | Falls back to OpenAI TTS |

---

## 📝 SESSION 4 SUMMARY

**Started:** Building world-class onboarding to replace old 4-step form

**Built:**
- New `MiraMeetsYourPet.jsx` component with photo upload, breed detection, soul game
- 13-question tap game with real-time soul score
- "Mira now knows..." feedback after each answer
- Payoff reveal screen with summary bullets

**User Tested and Found:**
- API error on final submit (response body read twice)
- Gender should come before name
- Need full address, not just city
- Need actual date picker for birthday
- Main goal should be multi-select
- No Pet Home page exists yet

**Status:** Component built but needs fixes before it's usable

---

## 🏁 FOR NEXT AGENT

1. **Start by reading this SSOT** - it has everything you need
2. **Fix the P0 bugs first** - API error is blocking the entire flow
3. **Then fix P1 UX issues** - these are direct user feedback
4. **Test each fix** before moving on
5. **Build Pet Home page** once onboarding works
6. **Update this SSOT** when you make changes

The user (Dipali) is highly detail-oriented and emotionally invested in this project (named after her grandmother Mira). She wants "world-class, never-done-before" onboarding. Take her feedback seriously and implement exactly as specified.

Good luck! 🐾

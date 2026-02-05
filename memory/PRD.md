# The Doggy Company - Product Requirements Document

## Original Problem Statement
Build "The Doggy Company," a one-stop-shop concierge for dog parents with a focus on emotional connection and the "Pet Soul™" concept. Transform the site from a functional pet services marketplace into an emotionally resonant "Pet Life Operating System."

## Core Philosophy
- **We Celebrate Life** - Through every moment, joyful or challenging, we see celebration
- **Mira interprets lives** - Memory and judgement layer, not a request fulfiller
- **Brain vs Hand** - Mira is the brain, Concierge® is the hand. One understands life, the other moves the world

---

## PROJECT HEALTH SCORE: 9.0/10

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
- ✅ **Finance Manager** - Full reconciliation system
- ✅ **Product Box** - Enhanced with stats, filters, testids
- ✅ **Service Box** - Enhanced with views, provider tracking
- ✅ **ProductListing page restored** - Original hero, filters, product grid

### Needs Attention (Yellow)
- ⚠️ Pet photo upload (backend works, frontend needs e2e testing)
- ⚠️ Voice input on iOS (needs text input fallback)
- ⚠️ Pet photos in Brand Story video (pending implementation)

### Known Issues (Red)
- 🔴 None currently blocking

---

## SESSION 7 SUMMARY (February 5, 2026)

### Completed Today - ProductListing and CelebratePage Restoration:

#### 1. ProductListing.jsx Restored (P0)
- ✅ **Restored original layout**: Hero section ("Birthday Cakes Made with Joy") with beautiful gradient
- ✅ **Restored original filter bar**: Search, Shape filter, City filter (Bangalore Fresh, etc.), Price filter, Sort dropdown
- ✅ **Products visible to ALL users**: Removed the non-member gate that was hiding products
- ✅ **Added pillar-specific support filters**: New purple "Personalized for [PetName]" section appears ONLY for logged-in members with pets
- ✅ **Support filter pills**: Celebration-safe, Allergy-aware, Calm moments, Extra care (horizontal scrollable)
- ✅ **Filters integrated into existing bar**: Support filters appear as an ADDITIONAL row, not replacing the page

#### 2. CelebratePage.jsx Restored (P0)
- ✅ **Removed PetOSWrapper**: No more intrusive non-member gate on pillar landing page
- ✅ **Original hero preserved**: "Every Paw Deserves a Party" with rotating images
- ✅ **Category cards intact**: Birthday Cakes, Breed Cakes, Pupcakes & Dognuts, Treats, Gift Hampers, Party Accessories
- ✅ **Elevated Concierge® section**: Preserved without PetOS chrome components

#### 3. Technical Changes
- ✅ Removed `usePetOS`, `MemberIdentity`, `NonMemberGate`, `HandledByMiraBadge`, `MiraContextStrip` imports from CelebratePage
- ✅ Added local pet fetching logic in CelebratePage using `useAuth` hook
- ✅ ProductListing now uses pillar-specific support filters from `PILLAR_SUPPORT_FILTERS` mapping

---

## KEY FILES MODIFIED TODAY

| File | Changes |
|------|---------|
| `/app/frontend/src/pages/ProductListing.jsx` | Full restore from backup + added pillar-specific support filters as additional inline row |
| `/app/frontend/src/pages/CelebratePage.jsx` | Removed PetOSWrapper components, restored original layout |

---

## UPCOMING TASKS

### P0 - High Priority
1. ~~Revert ProductListing page~~ ✅ DONE
2. ~~Revert CelebratePage~~ ✅ DONE
3. **Incorporate pet photos in Brand Story video**

### P1 - Medium Priority
4. Multi-pet selector in Mira AI panel (user claims it existed - investigate)
5. Service Desk - Add SLA tracking
6. Service Desk - Add canned responses
7. Member Directory - Add 360 view
8. Member Directory - Add LTV calculation

### P2 - Nice to Have
9. Mira - Add prompt editor UI
10. System - Add approval workflows
11. Reports - Add GST export CSV

---

## TEST CREDENTIALS

- **Test User**: test@test.com / test (has pet Bruno - Golden Retriever, 3yo, 25kg)
- **Demo User**: demo@doggy.com / demo1234
- **Admin**: aditya / lola4304

---

## CODE ARCHITECTURE

```
/app
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── PetOSWrapper.jsx      (Contains reusable Pet OS components - NOT used on main pages anymore)
│   │   │   ├── MiraAI.jsx            (Main Mira AI panel)
│   │   │   ├── MultiPetSelector.jsx  (For service bookings, not Mira panel)
│   │   │   └── ...
│   │   ├── pages/
│   │   │   ├── ProductListing.jsx    (RESTORED - Original hero + filters + products)
│   │   │   ├── CelebratePage.jsx     (RESTORED - Original pillar page without wrapper)
│   │   │   └── ...
├── backend/
│   └── ... (No backend changes)
```

---

## 3RD PARTY INTEGRATIONS

| Service | Status | Notes |
|---------|--------|-------|
| Razorpay | ✅ Working | Test mode keys |
| ElevenLabs | ✅ Working | Brand story voiceovers |
| Sora 2 | ✅ Working | Brand story videos |
| MongoDB | ✅ Working | All data persistence |
| Emergent LLM | ✅ Working | Universal key for GPT/Gemini/Claude |

---

## DESIGN PRINCIPLE REMINDER

**Filters are not controls. They are reassurance tools.**
- If a filter ever feels like work, it's wrong.
- Support filters should mirror the emotional state of the page
- Health logic stays. Language shifts based on pillar context.

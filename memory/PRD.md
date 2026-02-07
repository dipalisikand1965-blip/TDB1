# MIRA OS - Product Requirements Document
## The World's First Pet Life Operating System

**Last Updated:** February 7, 2026
**Status:** Mira's Spirit Restored + Voice Added

---

## THE MIRA DOCTRINE (NEVER FORGET)

> "Mira is not a chatbot. She is a trusted presence in a pet parent's journey."

- **Mira = Brain** (understands, judges, reasons, remembers)
- **Concierge = Hands** (executes, serves)
- **User = Never worries about how**

**What Mira IS:**
- A Pet Life OS that knows each pet deeply and keeps that memory forever
- A thinking layer over products, services, information, and human concierge
- A companion for the parent's life-state – celebrating, worrying, planning, coping
- A router: the right answer to "what should happen next?"
- The brain, with Concierge® as the hands

**What Mira is NOT:**
- A "pet Google" that dumps links and products
- A generic AI that answers anything about anything
- A loud salesperson pushing SKUs
- A vet, a lawyer, or a replacement for real professionals
- A place that ever says "I don't know, good luck"

---

## WHAT WAS FIXED TODAY (Feb 7, 2026)

### Fix 1: Mira's Spirit Restored
- **Problem:** The `isProductOptIn` function was BLOCKING products unless user explicitly said "show me products"
- **Fix:** Removed the restrictive gate. Mira now shows products when her AI intelligence decides it's relevant

### Fix 2: Concierge Made Subtle
- **Problem:** Concierge strip showed on EVERY message, making UI cluttered
- **Fix:** Now only shows when AI suggests it or for complex requests (as per doctrine: "continuation, not escalation")

### Fix 3: "Was This Helpful?" Removed
- Cleaned up excessive feedback buttons for professional UI

### Fix 4: Voice Output Added (ElevenLabs)
- Added Volume/Mute button in input area
- When voice is ON, Mira speaks her responses using ElevenLabs "Elise" voice
- Voice input (mic) for speech-to-text was already working

---

## THE 15 PILLARS OF PET LIFE

| Pillar | Status | Description |
|--------|--------|-------------|
| 🎉 Celebrate | 🟡 Partial | Birthday, adoption day, milestones |
| 🍖 Dine | ✅ Working | Food, treats, nutrition |
| 🏨 Stay | 🟡 Partial | Boarding, daycare |
| ✈️ Travel | 🟡 Partial | Pet-friendly travel |
| 💊 Care | 🟡 Partial | Health, vet prep |
| 🎾 Enjoy | 🟡 Partial | Toys, play, enrichment |
| 🏃 Fit | ⬜ Planned | Exercise, weight management |
| 📚 Learn | ⬜ Planned | Training, behavior |
| 📋 Paperwork | ⬜ Planned | Vaccines, documents |
| 💡 Advisory | 🟡 Partial | Breed-specific guidance |
| 🚨 Emergency | ⬜ Planned | Urgent care routing |
| 🌈 Farewell | ⬜ Planned | End-of-life support |
| 🐕 Adopt | ⬜ Planned | Adoption guidance |
| 🛍️ Shop | ✅ Working | 2,151 products |
| 🔧 Services | 🟡 Partial | 2,406 services |

---

## DATABASE STATUS

| Collection | Count | Status |
|------------|-------|--------|
| **Products** | 2,151 | ✅ Ready |
| **Services** | 2,406 | ✅ Ready |
| **Breeds** | 64 | ✅ Seeded |
| **Pets** | 58 | ✅ Ready |
| **Users** | 50 | ✅ Ready |

---

## ✅ COMPLETED FEATURES

### Intelligence Layer
- ✅ Soul Score - Dynamic, grows with interactions (capped at 100%)
- ✅ Intent Understanding via LLM
- ✅ Life-state detection
- ✅ Pet Soul graph (breed + personal history + preferences)
- ✅ Safe action routing (Instant vs Concierge)

### Execution Layer  
- ✅ Product Recommendations - 2,151 products with "Why for Pet" reasons
- ✅ Breed Intelligence - 64 breeds with knowledge
- ✅ Concierge handoff (WhatsApp, Chat, Email) - NOW SUBTLE
- ✅ Session Persistence

### Interface Layer
- ✅ Premium "For Pet" welcome UI with avatar rings
- ✅ Soul Score badge (e.g., "87% SOUL KNOWN")
- ✅ Soul traits display (Playful spirit, Gentle paws, Loyal friend)
- ✅ "Mira knows {pet}" personalized picks card
- ✅ Quick suggestion chips
- ✅ Test Scenarios panel (12 pillars)
- ✅ Mobile-responsive design
- ✅ Voice INPUT (mic) - speech-to-text
- ✅ Voice OUTPUT (ElevenLabs) - Mira speaks back

---

## KNOWLEDGE SOURCES (External References)

Priority by topic:
1. **Breed / exercise** → AKC
2. **Everyday care / lifestyle / routines** → Spruce Pets
3. **Health / symptoms / toxic foods** → PetMD + ASPCA
4. **Ethics / training kindness / welfare** → Humane-type orgs

When in doubt, Mira summarises + adds context from the pet's profile, then:
- If mild → gives home-care tips with guardrails
- If moderate / worrying → "This needs a vet's eyes; I can help you prepare / find one" and hands over to concierge

---

## 🔮 ROADMAP TO 100%

### Phase 1: Foundation (80% Complete)
- ✅ Soul Score System
- ✅ Product Recommendations  
- ✅ Multi-Pet Support
- ✅ Voice INPUT + OUTPUT
- ⬜ Mobile verification pending
- ⬜ Service recommendations integration

### Phase 2: Pillar Intelligence
- ⬜ Mira understands all 15 pillars
- ⬜ Pillar-specific recommendations
- ⬜ Life-state detection improvements

### Phase 3: Deep Personalization
- ⬜ Every recommendation perfect for THIS pet
- ⬜ Learning from interactions
- ⬜ Birthday/vaccination proactive reminders

### Phase 4: Ecosystem Complete
- ⬜ 100% across all 15 pillars
- ⬜ External integrations (vets, trainers, shops)

---

## 🔑 CREDENTIALS

- **Customer Login:** dipali@clubconcierge.in / test123
- **Admin:** aditya / lola4304
- **Database:** test_database

---

## 📁 KEY FILES

```
/app/frontend/src/pages/MiraDemoPage.jsx  # Main UI
/app/frontend/src/styles/mira-prod.css     # Styling
/app/backend/mira_routes.py                # Core API
/app/backend/tts_routes.py                 # Voice (ElevenLabs)
/app/memory/MIRA_DOCTRINE.md               # THE BIBLE
```

---

## CORE PROMISE

> "Mira keeps track of your dog's life so you don't have to."

More specifically:
- I remember your pet the way you wish everyone did.
- I turn your one sentence into the next right step.
- I never leave you at a dead end.
- I never push you into something you didn't ask for.

---

*Push to GitHub and test on production!*

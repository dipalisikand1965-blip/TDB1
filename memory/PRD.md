# The Doggy Company — Pet Life Operating System

## Original Problem Statement
Build a production-ready pet life management platform with 12 core pillars, AI concierge (Mira), e-commerce, and admin service desk. Platform must be mobile-first (100% iOS/Android user base) for soft launch with 100 founding members.

## Architecture
- **Frontend:** React (CRA) + Tailwind + Framer Motion + Shadcn/UI
- **Backend:** FastAPI + MongoDB (local preview, Atlas production)
- **Integrations:** OpenAI/Claude (Emergent LLM Key), Razorpay, Cloudinary, Google Places, Resend, Gupshup, ElevenLabs

## Core Routes
| Route | Component | Description |
|-------|-----------|-------------|
| /pet-home | PetHomePage | Pet parent dashboard (inside MainLayout) |
| /mira-os | MiraDemoPage | Mira AI interface |
| /onboarding | PetSoulOnboarding | 45-question soul builder (8 chapters) |
| /soul-builder | PetSoulOnboarding | Same soul builder (alternate URL) |
| /join | Join flow | New user pet creation |
| /care..advisory | *SoulPage | 13 Life Pillar pages |
| /admin | Admin Portal | Service desk, product management |

## What's Been Implemented

### Session Feb 2026 — Soul Builder Rewrite
- **45-question Soul Builder** across 8 chapters: Identity, Family, Routine, Home, Travel, Food, Training, Horizon
- **3 screens:** Intro (pet photo + soul ring + chapter preview) → Questions (chapter dots, live score ring, Mira messages, option cards) → Celebration (final score, Mira summary)
- **Gamification:** +pts popup on each answer, soul ring animates and grows, Mira messages change per question
- **Pet photo** in intro screen (golden-bordered circle) and celebration screen
- **No pets redirect:** `/join` if user has no pets
- **API fix:** `question_id` field matches backend expectation
- **Skip chapter + Save & finish later** options (skip de-emphasized)

### Session Feb 2026 — Mobile Navigation Overhaul
- MobileMenu via `createPortal` to body (z-99999/100000), X close button, 3-column pillar grid
- Removed duplicate Navbar/tabs from PetHomePage, moved /pet-home into MainLayout
- Removed PillarPageLayout duplicate header (no more ☰ on right)
- Hidden UniversalServiceButton (orange globe) on logged-in pages
- ProductDetailModal z-index: 50000 (above LearnContentModal's 11000)

### Previously Completed
- Universal Intent-to-Ticket flow (tdc_intent.js + useConcierge.js)
- Performance: score-for-pet bulk queries (3min → 45ms)
- Admin Panel redesign, Two-Way Inbox (WhatsApp/Gupshup)
- Google Places NearMe, Mira streaming, 3-Layer Mira Picks
- Product catalog cleanup, Static pages, Membership ₹2,999/year

## Soul Scoring System
- **Backend:** `calculate_pet_soul_score()` in `pet_score_logic.py`
- **Canonical mapping:** `canonical_answers.py` maps UI field names to scoring fields
- **Weighted scoring:** Total possible = 100 (fixed), categories: personality, safety, nutrition, etc.
- **Tiers:** Based on percentage: Seedling → Sprout → Bloom → Soul Master
- **Storage:** `doggy_soul_answers` dict on pet document, `overall_score` float

### Session Mar 2026 — Complete PillarSoulProfile on ALL 12 Pillars
- **PillarSoulProfile** rebuilt with 4 sections: Mira Voice, What Mira Knows (tiles), Breed Tips, Mira Imagines cards
- Deployed to ALL 12 pillar pages: Celebrate, Dine, Go, Care, Play, Learn, Paperwork, Emergency, Farewell, Adopt, Shop, Services
- Per-pillar tile maps using correct DB keys (81 actual soul answer fields mapped)
- Breed-specific tips per pillar with fallback for unknown breeds
- MiraImaginesBreed cards integrated (allergen-aware, breed-specific AI product mockups)
- "See full profile" links to `/my-pets` (not soul-builder)
- Score bar + live score update on answer submission
- Pet switch resets drawer state
- Components: `/app/frontend/src/components/PillarSoulProfile.jsx`, `/app/frontend/src/components/SoulChapterModal.jsx`

### Session Mar 22, 2026 — Pet Health Vault — Full Concierge Wiring (Complete)
- **PetVault.jsx** fully rewired: `useConcierge`, `usePlatformTracking`, `saveSoulAnswer` helper, `getIdealWeight` helper
- **New section: Allergies** — red critical cards, "Add allergy" fires `urgent()` ticket immediately + writes `doggy_soul_answers.food_allergies`
- **New section: Identity & Insurance** — microchip, insurance status, pet passport with Concierge® enquiry links
- **Documents tab** — existing doc list with upload-via-concierge button
- **Mira Alert Bar** — shows at top when vaccines due within 14 days; fires `urgent()` ticket automatically
- **Weight tracker** — fires `request()` + weight-range alert if outside ideal breed range
- **All 5 form handlers wired**: vaccine → `request()` + `saveSoulAnswer('vaccination_status', 'up_to_date')`, vet → `request()` + `saveSoulAnswer('has_regular_vet', 'yes')`, medication/visit/weight → `request()`
- **Backend**: New `GET/POST /api/pet-vault/{petId}/allergies` endpoints + summary now includes `allergies`, `microchip`, `insurance`, `passport`
- **Care Pillar link**: `care-health-vault-link` card added below PillarSoulProfile on `/care`
- **Bug fixed**: `mira_service_desk.py:606` missing 4th `intent` arg to `generate_mira_briefing()` — was causing 500 on ALL ticket creation
- Testing: 100% backend (25/25), 95% frontend
- **Full audit** of all 12 pillar pages against `tdc_intent.js` / `useConcierge` / `usePlatformTracking`
- **9 gaps fixed:**
  1. DineSoulPage — Added `usePlatformTracking` call (was imported, never called)
  2. GoSoulPage — Added `usePlatformTracking` call
  3. LearnSoulPage — Added `usePlatformTracking` call
  4. PlaySoulPage — Added `usePlatformTracking` call
  5. ShopSoulPage — Added `usePlatformTracking` call
  6. CareSoulPage WellnessProfile — Added `tdc.request()` on soul answer
  7. DineSoulPage SoulQuestionCardDine — Added `tdc.request()` on soul answer
  8. LearnSoulPage LearnProfile.save — Added `tdc.request()` on soul answer
  9. PlaySoulPage handlePlayBook — Added `tdc.nearme()` before API for NearMe booking
  10. EmergencySoulPage send() — Added `tdc.urgent()` in modal form submission
  11. FarewellSoulPage send() — Added `tdc.request()` in modal form submission
- **Verification:** 218+ tickets confirmed in admin service desk. All pillars, all interaction types verified.

## Prioritized Backlog

### P0 — Production Deployment
- [ ] User deploys via Emergent platform
- [ ] Re-enable master sync for production (with asyncio.to_thread for AI steps)
- [ ] Full E2E mobile test on real device

### P1 — Pending Issues
- [ ] Database pillar name migration & dynamic sub-categories (BLOCKED: awaiting user backup)
- [ ] AI Soul Products integration into product catalog
- [ ] Add quick-questions API to Adopt/Emergency/Farewell/Learn profile drawers

### P2 — UX Polish
- [ ] Backend pagination for Mira Picks
- [ ] Production .env (SMTP/Resend credentials)
- [ ] Add more questions to reach 51+ in Soul Builder

### P3 — Future
- [ ] Build Love pillar
- [ ] Refactor MiraDemoPage.jsx (5,400+ lines → modules)
- [ ] Remove "Skip Payment" from onboarding (post soft-launch)

## Test Credentials
- User: dipali@clubconcierge.in / test123
- Admin: aditya / lola4304

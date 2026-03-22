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

### Session Mar 22, 2026 — WhatsApp Reply Button + Q2 Fixes
- **WhatsApp reply personalized**: `concierge_reply()` now reads `ticket.member.name` + `ticket.pet_name` → message: "Hi Dipali 🐾 Mira here from The Doggy Company. Your Concierge has a message about Mojo..."
- **TicketFullPageModal WhatsApp button**: Real WhatsApp SVG icon (not generic MessageCircle), green highlight when selected, pulsing dot when phone is available, recipient preview ("→ Dipali (2582)"), send button turns green with WA icon
- **Q2 cosmetic fixes confirmed**: `whiteSpace: nowrap` on PetVault tabs (line 487), soul answer test gap is code-correct (Mojo 100% score — nothing to fix)
- **Mira Briefing enriched**: `generate_mira_briefing()` now reads `pet.vault` (allergies, active meds, vaccines, vet, weight, last visit) + per-pillar soul answers. Every ticket now has a `HEALTH & SAFETY`, `DIET & DAILY LIFE`, `PILLAR INTEL` section.
- **Parent identity fixed**: `attach_or_create_ticket` now looks up user by `parent_id` (email or ID), fetches `name/email/phone`, and writes `member: { name, email, phone }` to ticket. "Unknown" is gone — "Dipali" shows in CONTACT INFO.
- **Personalization-stats enriched**: `/api/mira/personalization-stats/{petId}` now includes vault allergies at priority 10 (CRITICAL — NO CHICKEN), active meds, upcoming vaccines with urgency scoring, primary vet, last vet visit, current weight.
- **DoggyServiceDesk fetchContext fixed**: Now uses `ticket.pet_id` fallback (old tickets had no `pet_info.id`), uses `ticket.member` directly when populated, tries pet name lookup as last resort.
- **Testing**: 100% backend (36/36), 100% frontend — all verified by testing agent iteration_185.
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

### P0 — MUST DO BEFORE LAUNCH
- [ ] **DB Pillar Name Migration** — adventure→go, food→dine, memory→farewell (BLOCKED: user must confirm DB backup first)

### P1 — NEXT SESSION
- [ ] **AI Soul Products** — link 3,000+ Cloudinary mockups to `products_master` (NOW UNBLOCKED — master sync re-enabled)
- [ ] **Backend pagination** for Mira Picks `GET /api/mira/picks/{pillar}?limit=12&offset=0`
- [ ] **WhatsApp BOOK keyword** — when parent replies "BOOK" to reminder, auto-create booking ticket in `whatsapp_routes.py`
- [ ] **Full E2E mobile test** on real device before soft launch

### P1 — UPDATED (Mar 22 final)
- [x] **Backend pagination for Mira Picks** — DONE: `?limit=N&offset=N` + `has_more` field ✅
- [x] **Email on service desk reply** — DONE: fixed dead `ticket` variable bug, now sends real Resend email ✅
- [ ] **Inbox UI cleanup** (`MyRequestsPage.jsx`) — active prominent/warm cream, resolved collapsed, no purple gradient
- [ ] **AI Soul Products** — INVESTIGATE: 5,131 products, 0 cloudinary_url. Find where mockups live, link to products_master
- [ ] **WhatsApp BOOK keyword** — parent replies "BOOK" → auto booking ticket


### P2 — POST-LAUNCH
- [ ] **Medication refill reminders** — extend `check_health_reminders()` for medications with `end_date`
- [ ] **Love pillar** — 13th pillar page (same structure as existing 12)
- [ ] **MiraDemoPage.jsx split** — 5,400+ lines → component modules (HIGH RISK — do last)
- [ ] **"3 vets near you"** in vaccine reminder WhatsApp
- [ ] **Two-way WA thread UI** — show inbound replies in ticket view real-time (WebSocket push)
- [ ] **Production .env** — SMTP/Resend/Atlas credentials for production deploy
- [ ] See `/app/memory/NEXT_AGENT_BRIEFING.md` for full context

## Test Credentials
- User: `dipali@clubconcierge.in` / `test123`
- Admin: `aditya` / `lola4304`


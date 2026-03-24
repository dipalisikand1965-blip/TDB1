# Pet Life OS — Product Requirements Document
_Last updated: 2026-03-24 · The Doggy Company_

## Product Vision
A comprehensive Pet Life Operating System with 12 pillars covering every aspect of a dog's life — from food to travel, celebrations to end-of-life care. Every interaction is personalised via Mira AI using deep pet context (breed, allergies, soul score, health conditions). Every actionable element creates a Service Desk ticket for the concierge team.

## Tech Stack
- **Frontend:** React 18 + Shadcn/UI + inline styles
- **Backend:** FastAPI (Python) — single `server.py` (24k+ lines) + modular route files
- **Database:** MongoDB (collections: pets, users, service_desk_tickets, admin_notifications, celebration_photos, orders, etc.)
- **AI:** OpenAI GPT-4o / Claude Sonnet via Emergent LLM Key
- **Payments:** Razorpay
- **Images:** Cloudinary (UGC uploads)
- **Auth:** JWT-based custom auth

## Core Architecture
- `useConcierge.js` — Central hook for all frontend → service desk ticket creation
- `tdc_intent.js` — Lightweight intent tracker (tdc.book, tdc.request, tdc.nearme)
- `PillarContext.jsx` — Global pet state shared across all pillar pages
- `MiraChatWidget.jsx` — Floating Mira AI chat with pet context injection
- `PillarSoulProfile.jsx` — Cross-pillar soul score drawer (shared by all 12 pillars)
- `PillarPageLayout.jsx` — Shared layout wrapper for pillar pages

## Credentials
- **User:** dipali@clubconcierge.in / test123
- **Admin:** aditya / lola4304 (at /admin)

## 12 Pillars

| # | Pillar | Route | Status | Audit Date |
|---|--------|-------|--------|------------|
| 1 | Celebrate | /celebrate | LOCKED | 27 Mar 2026 |
| 2 | Dine | /dine | LOCKED | 27 Mar 2026 |
| 3 | Care | /care | LOCKED | 24 Mar 2026 |
| 4 | Go | /go | LOCKED | 24 Mar 2026 |
| 5 | Play | /play | LOCKED | 24 Mar 2026 |
| 6 | Learn | /learn | PENDING | — |
| 7 | Adopt | /adopt | PENDING | — |
| 8 | Farewell | /farewell | PENDING | — |
| 9 | Emergency | /emergency | PENDING | — |
| 10 | Paperwork | /paperwork | PENDING | — |
| 11 | Love | — | NOT BUILT | — |
| 12 | Services | /services | PENDING | — |

---

## Locked Pillars — DO NOT TOUCH

### Celebrate (Locked 27 Mar 2026)
- 11/11 backend tests passed, 100% frontend verified
- All concierge wiring points confirmed
- Mobile 375px audit passed
- Celebration Wall UGC via Cloudinary

### Dine (Locked 27 Mar 2026)
- 7/7 concierge flows verified
- Mobile 375px clean
- 4 concierge gaps fixed in previous session
- Bug fix: `rawCondition.toLowerCase` crash when `health_conditions` is an array (fixed 24 Mar 2026)

### Care (Locked 24 Mar 2026)
- 13/13 backend tests passed (iteration_199.json)
- 12/12 concierge wiring points verified
- 9 gaps fixed: 8 service booking flows (Grooming, Vet, Boarding, Sitting, Behaviour, Senior, Nutrition, Emergency) wired via `useConcierge` + `sendToConcierge` callback
- GuidedCarePaths `handleSubmit` replaced TODO with `useConcierge.fire()`
- Mobile font fix: Mira Imagines card button bumped to 13px
- Soul Made strip present in all categories

### Go (Locked 24 Mar 2026)
- 11/13 backend tests passed (iteration_200.json; 2 test-setup issues)
- 16/16 concierge wiring points verified
- 1 gap fixed: GuidedGoPaths `handleSend` replaced dead `/api/concierge/go-path` endpoint with `useConcierge.fire()`
- All 8 service flows already used `bookViaConcierge`
- Mobile font fix: MiraImagineCard button bumped to 13px

### Play (Locked 24 Mar 2026)
- 12/12 backend tests passed (iteration_201.json)
- 28 concierge wiring points verified across 8 components
- 2 gaps fixed: GuidedPlayPaths `handleSubmit` replaced dead `/api/concierge/play-path` with `useConcierge.fire()`, PlayConciergeSection card click added `tdc.view` tracking
- 6 service booking modals (Park, Social, Adventure, Fitness, Agility, Training) all use `bookViaConcierge`
- Soul Made cross-sell strip confirmed in ALL categories
- Mobile 375px: all user-readable fonts bumped to ≥13px (GuidedPlayPaths, PlayCategoryStrip, PlayConciergeSection, PlayHero, PlayNearMe)
- Mira knows Mojo on Play pillar (verified via /api/mira/os/stream)
- Ticket verified: TDB-2026-0755 with pet_breed=Indie

---

## Cross-Pillar Fixes (24 Mar 2026)

### PillarSoulProfile Redesign
- **Fix 1:** Soul builder navigation — `/pet-home` for 100% pets, `/soul-builder?pet_id=X` for incomplete
- **Fix 2:** Trigger bar subtext — "Mira knows everything" (green) for complete, "X questions waiting" for incomplete
- **Fix 3:** Drawer two states — questions FIRST for incomplete pets with "HELP MIRA KNOW" header; green "Mira knows everything" banner for complete pets
- **Score colors:** Green (#16A34A) for 100% pets, pillar color for incomplete
- **NaN guard:** `isFinite(score)` prevents "NaN%" display

### Score Alignment (Backend)
- `calculate_overall_score()` in `pet_soul_routes.py` now uses canonical `calculate_pet_soul_score` from `pet_score_logic.py`
- All three touchpoints aligned: hero badge, drawer score, answer handler
- Bruno's score bounce (88% → 58% → 88%) is FIXED

### Pet Switcher Fix (Navbar)
- Imported `usePillarContext` in Navbar.jsx
- Desktop pet dropdown now calls `setCurrentPet(pet)` directly
- Previously only set localStorage + dispatched event (unreliable)

### Dine Crash Fix
- `GuidedNutritionPaths.jsx` line 41-42: `rawCondition.toLowerCase()` crashed when `health_conditions` was an array
- Fixed: Added `Array.isArray()` guard and `typeof === 'string'` check

---

## P0 — Next Sprint (Start Here)

- [x] Audit Play pillar — LOCKED 24 Mar 2026
- [ ] Audit remaining pillars following `/app/memory/PILLAR_AUDIT_METHODOLOGY.md`:
  - Learn → Adopt → Farewell → Emergency → Paperwork
- [ ] Each pillar: 8-phase methodology (Component Map → Bug Hunt → Concierge Wiring → Soul Made → Mobile 375px → Mira Context → Document → Report)

## P1 — Near Term

- [ ] Add "3 vets near you" to daily health WhatsApp reminders
- [ ] Extend scheduler for Medication refill reminders
- [ ] Mobile/iOS audit remaining pillars

## P2 — Backlog

- [ ] Build the `Love` pillar
- [ ] Refactor `server.py` (24k+ lines) into modular routers
- [ ] Add "My Custom Orders" tab in user profile
- [ ] Replace blank templates with lifestyle product shots for Flat Art
- [ ] Documentation page: Add Word/DOCX download button

---

## Key API Endpoints

| Endpoint | Purpose |
|----------|---------|
| POST /api/service_desk/attach_or_create_ticket | Universal concierge ticket creation |
| POST /api/mira/chat | Mira AI chat |
| POST /api/mira/os/stream | Mira OS streaming |
| POST /api/celebration-wall/photos/ugc | UGC photo upload |
| GET /api/pet-soul/profile/{id}/quick-questions | Soul questions + live score |
| POST /api/pet-soul/profile/{id}/answer | Answer soul question |
| GET /api/pets | User's pets with scores |
| POST /api/auth/login | User authentication |

## Key DB Collections

| Collection | Purpose |
|-----------|---------|
| pets | Pet profiles with `doggy_soul_answers`, `vault`, `overall_score` |
| users | User accounts |
| service_desk_tickets | Concierge requests from UI |
| admin_notifications | Triggers NotificationBell |
| celebration_photos | Celebration Wall (Cloudinary URLs) |
| orders | E-commerce orders |
| pillar_products | Products per pillar/category |

## 3rd Party Integrations
- OpenAI GPT-4o / Claude Sonnet — Emergent LLM Key
- Gemini — Emergent LLM Key
- Cloudinary — User API Key (image uploads)
- Razorpay — User API Key (payments)

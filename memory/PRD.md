# Pet Life OS — Product Requirements Document

## Original Problem Statement
Finalize documentation, completely clean test pet data, and perform comprehensive audits (UI/UX, mobile 375px, concierge wiring, and Mira context) for the remaining pillars. Every actionable element (service card, product, guided path, AI chat) MUST be perfectly wired to create an Admin Service Desk ticket with deep pet context.

## Architecture
- **Frontend**: React (CRA) at port 3000
- **Backend**: FastAPI at port 8001
- **Database**: MongoDB (`pet-os-live-test_database`)
- **AI**: OpenAI GPT-4o / Claude Sonnet via Emergent LLM Key (Mira AI)
- **Images**: Cloudinary
- **Payments**: Razorpay

## Pillar Audit Status

| # | Pillar | Route | Status | Date |
|---|--------|-------|--------|------|
| 1 | Celebrate | /celebrate | LOCKED | 23 Mar 2026 |
| 2 | Dine | /dine | LOCKED | 23 Mar 2026 |
| 3 | Care | /care | LOCKED | 24 Mar 2026 |
| 4 | Go | /go | LOCKED | 24 Mar 2026 |
| 5 | Play | /play | LOCKED | 24 Mar 2026 |
| 6 | Learn | /learn | PENDING | — |
| 7 | Paperwork | /paperwork | PENDING | — |
| 8 | Emergency | /emergency | PENDING | — |
| 9 | Farewell | /farewell | PENDING | — |
| 10 | Adopt | /adopt | PENDING | — |
| 11 | Shop | /shop | PENDING | — |
| 12 | Services | /services | PENDING | — |

## Completed Work — 24 Mar 2026 (This Session)

### PillarSoulProfile Cross-Pillar Fixes
- Trigger bar: clean CSS border ring (56px photo, 3px border), 20px/22px padding, 17px title
- Drawer widened: `maxWidth: min(680px, 95vw)`
- Container wrapper standardized (`max-w-5xl` + `paddingTop:16`) on ALL 12 pillars
- Go pillar: Added `color="#0D9488"` teal prop
- SVG score ring removed globally — replaced with simple CSS border

### Play Pillar Audit (LOCKED)
- 28+ concierge wiring points across 8 components
- GuidedPlayPaths dead endpoint → `useConcierge.fire()`
- PlayConciergeSection: `tdc.view` on card click, "Book for Mojo →" CTA
- Mobile 375px: All fonts ≥13px
- Soul Made Strip: Moved inside scrollable area (Play + Dine)
- BuddyMeetup: New component for social playdate coordination
- Walk Essentials: New guided path for Dog Walking
- 7 footer CTA rewrites (Outings/Playdates/Walking/Fitness/Swimming → guided paths, Bundles/Soul/Mira → removed)
- Soul Play: Fixed breed product_type mismatch (`play_bandanas` → `play_bandana`)
- PlayCategoryStrip: Labels no longer clipped (removed maxWidth:84)
- `duration_minutes: 0` rendering fix
- Price guard: `Number(svc.price) > 0` + "From ₹" prefix

### Cross-Pillar Breed Filter Fix
- Applied to Play, Care, Dine, Go content modals
- Only shows pet's own breed tabs (no other breed shops)

### Documentation
- Word/DOCX download button added to documentation page
- complete-documentation.html regenerated (317 files, 91882 lines)

## P0 — Next Sprint
- [ ] Audit remaining pillars: Learn → Adopt → Farewell → Emergency → Paperwork → Shop → Services
- [ ] Follow 8-phase methodology in `/app/memory/PILLAR_AUDIT_METHODOLOGY.md`

## P1 — Upcoming
- [ ] Add "3 vets near you" to WhatsApp reminders
- [ ] Extend scheduler for medication refill reminders

## P2 — Future/Backlog
- [ ] Build the Love pillar
- [ ] Refactor server.py into modular routers (24k+ lines)
- [ ] Add "My Custom Orders" tab in user profile

## Key Endpoints
- `POST /api/service_desk/attach_or_create_ticket` — Universal concierge
- `GET /api/pet-soul/profile/{pet_id}/quick-questions` — Soul questions
- `POST /api/pet-soul/profile/{pet_id}/answer` — Save answer + recalc score
- `POST /api/mira/os/stream` — Mira AI chat

## Credentials
- User: `dipali@clubconcierge.in` / `test123`
- Admin: `aditya` / `lola4304`

## 3rd Party Integrations
- OpenAI GPT-4o / Claude Sonnet — Emergent LLM Key
- Cloudinary — User API Key
- Razorpay — User API Key

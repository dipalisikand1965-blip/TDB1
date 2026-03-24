# Pet Life OS — Product Requirements Document

## Core Platform
India's first Pet Life OS — a comprehensive lifestyle platform for pet parents, powered by AI (Mira), with personalised product recommendations, concierge services, and guided care paths across 12+ life pillars.

## Architecture
- **Frontend**: React (Vite) + Tailwind + Shadcn UI
- **Backend**: FastAPI (Python) + MongoDB
- **AI**: OpenAI GPT-4o / Claude Sonnet via Emergent LLM Key (Mira scoring/intelligence)
- **Storage**: Cloudinary (images), MongoDB (data)
- **Payments**: Razorpay

## Pillar Audit Status

| Pillar | Status | Audit Date | Notes |
|--------|--------|------------|-------|
| Celebrate | LOCKED | Mar 2026 | Fully audited, DO NOT TOUCH |
| Dine | LOCKED | Mar 2026 | Fully audited, DO NOT TOUCH |
| Care | LOCKED | Mar 2026 | Fully audited, DO NOT TOUCH |
| Go | LOCKED | Mar 2026 | Fully audited, DO NOT TOUCH |
| Play | LOCKED | Mar 2026 | Fully audited, DO NOT TOUCH |
| **Learn** | **LOCKED** | **Mar 24, 2026** | **Fully audited — pill→guided path wiring, concierge verified** |
| Adopt | PENDING | — | Next in audit queue |
| Farewell | PENDING | — | |
| Emergency | PENDING | — | |
| Paperwork | PENDING | — | |
| Shop | PENDING | — | Breed-products fix applied |
| Services | PENDING | — | |

## What's Been Implemented (Current Session — Mar 24, 2026)

### Bug Fixes
1. **Breed-Products API Fix**: Fixed space/underscore mismatch in `/api/admin/breed-products`. Breeds stored as `shih_tzu` (underscore) but frontend sent `shih tzu` (space). Applied `re.sub(r'[ _]', '[_ ]', breed)` regex normalization in `server.py`.
2. **MiraScoreEngine Performance Fix**: Scoring was blocking the event loop (processing 1500+ items simultaneously). Fixed by:
   - Changed from parallel 2-batch to sequential with 0.5s yield between batches
   - Increased cooldown from 6h to 24h
   - Fallback paths now check if scores exist before re-triggering
3. **MongoDB Indexes Added**: `pets.owner_email`, `pets.parent_id`, `pets.email`, `mira_product_scores.(pet_id, pillar)`, `mira_product_scores.(pet_id, score)`, `breed_products.(breed, is_active, is_mockup)` — fixed /api/pets/my-pets timeout

### Learn Pillar Audit (COMPLETED)
- **Pill → Guided Path Wiring**: Category pills (Foundations, Behaviour, Training, Enrichment) now open PathFlowModal directly, matching Play pillar pattern
- **Dimension Card Wiring**: Cards with corresponding guided paths show "Start Mojo's path → | Guided by Mira" and open PathFlowModal
- **Concierge Verification**: 20 wiring points, tickets auto-resolve pet_breed + allergy context from backend
- **Mobile (375px)**: All responsive, fonts ≥13px, PathFlowModal renders cleanly
- **Exported Components**: `buildPaths` and `PathFlowModal` now exported from `GuidedLearnPaths.jsx`

## Key Files
- `/app/frontend/src/pages/LearnSoulPage.jsx` — Learn page with pill→guided path mapping
- `/app/frontend/src/components/learn/GuidedLearnPaths.jsx` — Guided paths + PathFlowModal (exported)
- `/app/backend/server.py` — Main backend (24k+ lines, P2 refactor planned)
- `/app/backend/mira_score_engine.py` — AI scoring engine (throttled)
- `/app/backend/mira_service_desk.py` — Service desk ticket creation (auto-resolves pet_breed)
- `/app/memory/PILLAR_AUDIT_METHODOLOGY.md` — 8-phase audit methodology

## Upcoming Tasks
- (P0) Audit remaining pillars: Adopt → Farewell → Emergency → Paperwork → Shop → Services
- (P1) Add "3 vets near you" to WhatsApp reminders
- (P1) Extend scheduler for medication refill reminders

## Future/Backlog
- (P2) Build the Love pillar
- (P2) Refactor server.py into modular routers
- (P2) Add "My Custom Orders" tab in user profile

## 3rd Party Integrations
- OpenAI GPT-4o / Claude Sonnet — Emergent LLM Key
- Cloudinary — User API Key
- Razorpay — User API Key

## Test Credentials
- User: dipali@clubconcierge.in / test123
- Admin: aditya / lola4304

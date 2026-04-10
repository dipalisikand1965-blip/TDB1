# Pet Life OS — PRD (Source of Truth)

## Original Problem Statement
Build a full-stack Pet Life OS with 12 core pillars (Dine, Care, Go, Play, Learn, Stay, Celebrate, Paperwork, Emergency, Fit, Adopt, Farewell). AI-powered by Mira. Mobile-first consumer experience with WhatsApp concierge integration. Admin panel for product/service/ticket management.

## Core Architecture
- **Frontend**: React (CRA), TailwindCSS, Shadcn/UI, Lucide React
- **Backend**: FastAPI + MongoDB (Motor async)
- **AI**: OpenAI GPT-4o via Emergent LLM Key
- **WhatsApp**: Gupshup webhook integration
- **Payments**: Razorpay
- **Images**: Cloudinary

## Key Files
- `/app/backend/mira_soul.py` — ONE source of truth for Mira's soul (shared by web + WhatsApp)
- `/app/backend/whatsapp_routes.py` — WhatsApp webhook + Mira AI (imports MIRA_CORE_SOUL)
- `/app/backend/mira_routes.py` — Web widget Mira AI (DO NOT TOUCH — imports from mira_soul.py)
- `/app/backend/server.py` — Central FastAPI router (>25k lines — needs splitting)
- `/app/backend/db_restore_routes.py` — DB export/restore with bulk_write
- `/app/backend/unified_product_box.py` — Admin product CRUD
- `/app/backend/service_box_routes.py` — Admin service CRUD
- `/app/frontend/src/hooks/useMiraFilter.js` — Client-side Mira product filtering
- `/app/frontend/src/pages/*MobilePage.jsx` — All 12 mobile pillar pages

## What's Been Implemented

### Session: Mira Soul Unification + WhatsApp Fixes (Feb 2026)
- Created `mira_soul.py` — channel-agnostic Mira soul (competitor ban, grief protocol, Pet First doctrine, service flows)
- Wired `MIRA_CORE_SOUL` into `whatsapp_routes.py` — WA now uses shared soul + surface format rules
- `mira_routes.py` (web widget) untouched
- Fixed `get_gupshup_config` NameError (silent failures restored)
- Fixed multi-pet disambiguation loop: new `wa_pet_state` collection decoupled from tickets
- Fixed ticket overwriting (Fix A + Fix B): webhook checks `wa_pet_state`, creates fresh ticket on pet mismatch
- Added `wa_pet_state` to `COLLECTIONS_CONFIG` in `db_restore_routes.py`
- Upgraded WhatsApp Mira: `gpt-4o-mini` → `gpt-4o`
- Fixed phone format collision with `_phone_score` heuristic
- Optimized DB restore with `bulk_write` (15 min → 3 sec for large collections)
- 4/4 tests passing in `test_mira_wa.py`

### Session: Admin Fixes + Mira Product Filter (Jan 2026)
- Built `useMiraFilter.js` — client-side allergy/preference filtering across all 12 pillars
- Applied Mira filtering to all 12 `*MobilePage.jsx` + DineSoulPageDesktopLegacy
- Full multi-step `ServiceBookingModal` on mobile (Care, Go, Play, Learn, Services)
- Fixed Admin archived product filtering (`visibility.status == "archived"`)
- Fixed Admin `toggle-active` endpoint (restores visibility state correctly)
- Fixed `AIImagePromptField` 401 error (correct adminAuth headers)
- Fixed MongoDB `NotImplementedError` (never use `if collection:`, always `if collection is not None:`)
- Fixed ProductBoxEditor: hide ₹0 prices → "Price on Request" for services

## Credentials
- Member: `dipali@clubconcierge.in` / `test123`
- Admin: `aditya` / `lola4304` (URL: `/admin`)

## Prioritized Backlog

### P0 (Critical)
- [x] Mira Soul Unification — DONE ✅
- [x] Stop member emails/bell for browse intent, mira chat, internal tracking — DONE ✅
  - `SILENT_MEMBER_INTENT_TYPES` frozenset in `mira_service_desk.py`
  - `_is_silent_intent()` helper (also catches `mira_*_concern` pattern)
  - Member bell notification + `send_concierge_request_email` both gated

### P1 (High — Next Sprint)
- [ ] Fix Razorpay checkout `/api/orders/create-order` body error
- [ ] Celebrate mobile parity: `BirthdayCountdown`, `CelebrationMemoryWall`, `MiraSoulNudge`
- [ ] Add `LearnNearMe` (LearnMobilePage), `PaperworkNearMe` (PaperworkMobilePage), `GoNearMe` (GoMobilePage)
- [ ] Multi-Pet Household Safety: basket splitting on health condition conflicts
- [ ] Real-time WebSocket notifications (Admin reply → user sees instantly)

### P2 (Medium — Upcoming)
- [ ] "Watch & Learn" YouTube sections (Care + Go pillars)
- [ ] Mira Remembers: cross-session memory
- [ ] WhatsApp Vision: Gemini image analysis
- [ ] Cron jobs: Daily Digest, Medication refill reminders, Mira Nudge Engine

### Refactoring (Ongoing)
- [ ] Split `server.py` (>25k lines) into route modules
- [ ] Split `Admin.jsx` (>7k lines) into components
- [ ] Split `whatsapp_routes.py` (>2k lines)

## Known Blockers
- Production MongoDB Atlas: IP whitelist blocks agent direct access. Use Admin Re-export/Restore as workaround.
- Razorpay checkout: `/api/orders/create-order` returns body error — NOT YET INVESTIGATED.

## 3rd Party Integrations
- OpenAI GPT-4o — Emergent LLM Key
- Gupshup WhatsApp — User API Key required
- Razorpay — User API Key required
- Cloudinary — User API Key required

## Testing
- Test suite: `/app/backend/tests/test_mira_wa.py` (4/4 passing)
- Test reports: `/app/test_reports/iteration_205.json`, `206.json`, `207.json`

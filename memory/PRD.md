# Pet Life OS — PRD (Source of Truth)

## Original Problem Statement
Build a full-stack Pet Life OS with 12 core pillars (Dine, Care, Go, Play, Learn, Stay, Celebrate, Paperwork, Emergency, Fit, Adopt, Farewell). AI-powered by Mira. Mobile-first consumer experience with WhatsApp concierge integration. Admin panel for product/service/ticket management.

## Core Architecture
- **Frontend**: React (CRA), TailwindCSS, Shadcn/UI, Lucide React
- **Backend**: FastAPI + MongoDB (Motor async)
- **AI Models**:
  - Mira Widget: **GPT-5.1** (OpenAI, via Emergent LLM Key)
  - Mira Search Stream: **Claude Sonnet 4** (`claude-sonnet-4-20250514`)
  - Mira WhatsApp: **GPT-4o** (OpenAI, via Emergent LLM Key)
  - Mira Plan (background): **Claude Haiku 4.5**
- **WhatsApp**: Gupshup webhook integration
- **Payments**: Razorpay
- **Images**: Cloudinary
- **Database**: Local MongoDB + MongoDB Atlas (synced every 6 hours via APScheduler)
  - Atlas user: `dipalisikand1965_db_user` | Password in `.env` only (rotated Apr 2026)
  - Atlas URL in `PRODUCTION_MONGO_URL` env var — NEVER hardcode

## Key Files
- `/app/backend/mira_soul.py` — ONE source of truth for Mira's identity: `MIRA_SOUL_CHARTER` (WHO she is) + `MIRA_CORE_SOUL` (HOW she helps). Imported by widget, search, WhatsApp.
- `/app/backend/mira_soulful_brain.py` — Widget brain (DO NOT TOUCH inner logic — imports from mira_soul.py)
- `/app/backend/mira_routes.py` — All Mira API routes including `/mira/semantic-search` (breed filtering, allergen blocking, intent detection)
- `/app/backend/whatsapp_routes.py` — WhatsApp webhook + Mira AI (imports MIRA_SOUL_CHARTER + MIRA_CORE_SOUL)
- `/app/backend/server.py` — Central FastAPI router (>25k lines — needs splitting). Contains APScheduler Atlas sync job.
- `/app/backend/db_restore_routes.py` — DB export/restore with bulk_write
- `/app/backend/unified_product_box.py` — Admin product CRUD
- `/app/backend/service_box_routes.py` — Admin service CRUD
- `/app/frontend/src/hooks/useMiraFilter.js` — Client-side Mira product filtering
- `/app/frontend/src/pages/MiraSearchPage.jsx` — Mira search page (always calls semantic-search for product tray)
- `/app/frontend/src/pages/*MobilePage.jsx` — All 12 mobile pillar pages

## What's Been Implemented

### Session: Race Condition Fix — Breed Guard Across All Pillar Pages (Apr 2026)
- Fixed P0 race condition: `useEffect` product fetches now wait for `pet.breed` to be populated before calling `/api/admin/pillar-products`
- Added `!currentPet?.breed` / `!pet?.breed` guard to 15 files: `PlayMobilePage.jsx`, `GoMobilePage.jsx`, `EmergencyMobilePage.jsx`, `CelebrateMobilePage.jsx`, `CareMobilePage.jsx`, `DineMobilePage.jsx`, `LearnMobilePage.jsx`, `AdoptSoulPage.jsx`, `PaperworkMobilePage.jsx`, `ShopMobilePage.jsx`, `CareSoulPage.jsx`, `PlaySoulPage.jsx`, `PaperworkSoulPage.jsx`, `DineSoulPageDesktopLegacy.jsx`, `ShopSoulPage.jsx`
- Also added `currentPet?.breed` to dependency arrays for files missing it (`PlayMobilePage`, `GoMobilePage`, `EmergencyMobilePage`, `ShopMobilePage`, `PlaySoulPage`)
- Removed `|| 'indie'` breed fallback in `CareMobilePage.jsx` (was showing Indie products to all breeds before profile loaded)
- `FarewellSoulPage.jsx` was already fixed in the previous session

### Session: Rainbow Wall Mobile Parity + Community Memorials (Apr 2026)
- Added `RainbowBridgeWall` to `FarewellMobilePage.jsx` as 4th tab '🌈 Wall' — Mystique's memorial now visible on mobile
- Built "Add Your Memorial" user flow: logged-in users submit via modal → `POST /api/rainbow-bridge/submit` → stored as `memorial_status: "pending"`
- Added admin review endpoints: `GET /api/admin/rainbow-bridge/pending`, `PATCH /api/admin/rainbow-bridge/{id}/approve`, `PATCH /api/admin/rainbow-bridge/{id}/reject`
- Fixed ENOSPC disk issue on `/app` partition by clearing webpack cache (freed 200MB)
- Concierge phonetic `kon-see-airj` confirmed already in MiraChatWidget.jsx line 971
- Mobile parity audit completed: MiraFilter ✅, ElevenLabs voice ✅, RainbowBridgeWall now ✅, Weather nudges (backend-only, N/A)



### Session: 7-Fix Batch — Voice + Modals + Allergy + Celebration + to_list (Apr 2026)
1. Voice debug log confirmed: `Concierge→kon-see-airj`, `Mira→Meera`, `pawrent→paw-rent` all verified in backend.err.log
2. Modal z-index hierarchy fixed: All celebrate modals (CelebrateContentModal, BirthdayBoxBuilder, WallUploadModal, ConciergeIntakeModal, WallLightbox) set to 10000/10001 — above mobile nav bar (9995)
3. Global CSS z-index comment added to index.css explaining stacking order
4. Allergy vault write: `pet_soul_routes.py` now pushes newly learned allergies to `vault.allergies` immediately after soul journey update (with dedup check)
5. Celebration auto-populate: When `birth_date` or `celebration_preferences` saved in soul answer, backend auto-creates `celebrations` array entries for Birthday and Gotcha Day
6. Memorial Wall: Confirmed already wired in CelebrateMobilePage.jsx (CelebrationMemoryWall component at line 40 + 606)
7. `to_list(10000)` capped: shop export→5000, shop sync→7500, product reindex→7500, orders export→2000

### Session: Mira Links + PAW PASS + Pawmoter NPS (Apr 2026)
- Fixed Ask Mira navigation: All `/mira-os` and `/mira-demo` navigation links updated to `/mira-search` across 14 frontend files (GlobalNav.jsx, MyPets.jsx, SoulBuilder.jsx, PetHomePage.jsx, ServicesSoulPage.jsx, NotificationsInbox.jsx, TicketThread.jsx, Home.jsx, CarePage.jsx, CareFlowModal.jsx, VetVisitFlowModal.jsx, ConciergePickCard.jsx, FlowModal.jsx, PillarPageLayout.jsx, SoulKnowledgeTicker.jsx, CareServiceFlowModal.jsx, GroomingFlowModal.jsx, PicksHistoryTab.jsx, PaymentSuccess.jsx); `MiraDemoRedirect` in App.js now points to `/mira-search`
- Fixed PAW PASS "Unknown" display: Assigned `pet_pass_number` (TDC-XXXXXX) and `pet_pass_status: active` to all 19 pets for dipali@clubconcierge.in in MongoDB; backend `/api/pets/my-pets` now enriches pet_pass_status from user's membership_tier in real-time
- Built Pawmoter NPS (Option C - modal + WhatsApp): `PawmoterNPSModal.jsx` with 0-10 scale, feedback textarea, 50 paw points reward; triggers after every 3rd completed order; WhatsApp nudge sent via Gupshup; wired into `UnifiedCheckout.jsx`

### Session: Production Deploy Prep + Celebrate Image Fix (Apr 2026)
- `services_master` added to `BULK_INSERT_COLLECTIONS` in `db_restore_routes.py` → Restore now DROP+INSERTs services (no more fake svc-breed-* entries surviving)
- Fixed `static.prod-images` bad placeholder filter on all Celebrate pages: `CelebrateNewPage.jsx`, `CelebratePageNew.jsx`, `CelebrateMobilePage.jsx`
- Added `POST /api/admin/cleanup-fake-services` endpoint (backup approach, no longer needed due to DROP fix)


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
- [x] **Zoho Desk + SiteVault deployed to production (Apr 22, 2026)** — DONE ✅
  - Cleaned GitHub history via git-filter-repo (removed leaked secrets from 2965 commits)
  - Replaced dirty `main` with scrubbed clean branch (2893 commits)
  - Dirty main archived to Google Drive (193MB safety blanket) before deletion
  - Production re-deployed from clean `main` — HTTP 200, all health checks green
  - `/api/zoho/health` reports `ok: true`, all 4 credentials present
  - `/api/sitevault/health` reports `ok: true`, shared drive connected
  - 500 service-desk tickets bulk-queued to Zoho (10/10 first-batch success, zero failures)
- [x] **Zoho Desk rich enrichment shipped to production (Apr 22, 2026)** — DONE ✅
  - PR #103 merged cleanly (6 commits, 0 conflicts — fast-forward)
  - New Zoho OAuth refresh token with full scopes (`Desk.tickets.ALL`, `Desk.contacts.ALL`)
  - 10 custom fields created in Zoho (cf_pet_name, cf_pet_breed, cf_pet_age_years, cf_pet_city, cf_soul_archetype, cf_allergies, cf_health_conditions, cf_membership_tier, cf_internal_ticket_id, cf_pillar)
  - Picklist normalizer + aliases protect against unknown values (gold → Gold, grooming → Care)
  - Auto-sync hooks wired into 6 ticket-creation sites (orders, conversations, meal_box, service_catalog, central_signal_flow, mira_structured_engine)
  - Rich structured description: Pet Profile + Member + Request sections with Unicode box drawing
  - Contact upsert by email → no more "Website Visitor"
  - New endpoints: `/api/zoho/preview/{id}` (dry-run), `/api/zoho/re-push/{id}`, `/api/zoho/re-push-all?only_unenriched=true`
  - Backfill: 500 old tickets upgrading with rich context + 485 new tickets syncing fresh = ~985 tickets in flight, 0 errors

- [x] **QA Report Batch 2604 (Apr 22, 2026, pending deploy)** — 7 fixes ready
  - Bug #1: Order confirmation email + WhatsApp (Resend + Gupshup) with smart ETA logic
  - Bug #2: Mira breed-memory doctrine — profile = single source of truth, never reference old breed from chat history
  - Bug #3: WhatsApp "where is my order" → real Mongo lookup with order ID/status/tracking (no more Amazon redirect for tracking queries)
  - Bug #4: Shipping tier update — cart < ₹500 → ₹75 (was ₹150); ₹500-3000 stays ₹150 synced with TheDoggyBakery.com; ₹3000+ free
  - Bug #6: Dashboard tabs auto smooth-scroll to content + sticky TabsList
  - Mobile /care crash fixed (activeServicePath undeclared useState)
  - ServicesMobilePage: added ConciergeCTA banner
  - Bonus: Zoho cf_pet_photo field name synced with Tanisha's config; cf_pet_profile_photo added for pet profile pics
  - Helper: Bespoke delivery ETA computed from cart items + delivery city (cakes same-day in Bangalore/Mumbai/Delhi NCR, custom Soul Picks 5-7 days, outstation 5-10 days, default 3-7 days)

### P1 (High — Next Sprint)
- [ ] Fix Razorpay checkout `/api/orders/create-order` body error
- [ ] Celebrate mobile parity: `BirthdayCountdown`, `CelebrationMemoryWall`, `MiraSoulNudge`
- [ ] Add `LearnNearMe` (LearnMobilePage), `PaperworkNearMe` (PaperworkMobilePage), `GoNearMe` (GoMobilePage)
- [ ] Multi-Pet Household Safety: basket splitting on health condition conflicts
- [ ] Real-time WebSocket notifications (Admin reply → user sees instantly)
- [ ] **Mira "Explains Why" expandable row** on ProductCard/MealBoxCard (breed match + allergen logic reveal)
- [ ] **Zoho Desk webhook registration** in Zoho UI (Setup → Developer Space → Webhooks) with URL: `https://thedoggycompany.com/api/zoho/webhook?token=<ZOHO_WEBHOOK_TOKEN>`
- [ ] **Rotate remaining leaked keys** (public repo leak): Razorpay Live, Google Service Account, Google Places, SendGrid
- [ ] **Rotate `ZOHO_WEBHOOK_TOKEN`** — currently still the placeholder `petlifeos_zoho_webhook_secret_change_me_2026`
- [ ] Clean up bad `Daily Meals` admin data (mats/bandanas miscategorised)

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

## WhatsApp Bug Fixes (Apr 2026)
- **Root cause 1 (disambiguation)**: `get_mira_ai_response` referenced `wa_state` at line 1697 before it was defined. Fixed: `wa_state` → `_wa_pre` (already available). Confirmed working: "Pet selection resolved: 'Mystique' → 'Mystique' | original: 'looking for a cake'" ✅
- **Root cause 2 (slow response / 🐾 only)**: LiteLLM's HTTP calls blocked the asyncio event loop for 60s at a time, preventing any asyncio timer from firing. GPT-4o was returning 502 Bad Gateway causing 3+ minute delays. Users saw only the Gupshup auto-reply 🐾 sticker with no text response.
- **Fix**: Thread-based LLM execution via `run_in_executor()` + `asyncio.wait_for(timeout=25s)` + **Circuit Breaker**: after 2 consecutive timeouts, LLM is skipped entirely for 5 minutes, sending instant pattern-matched responses. After 5 min, LLM tried again automatically.
- **Result**: Response time: 25s (first 2 failures) → 1s (circuit open) → instant GPT when API recovers

## 3rd Party Integrations
- OpenAI GPT-4o — Emergent LLM Key
- Gupshup WhatsApp — User API Key required
- Razorpay — User API Key required
- Cloudinary — User API Key required

## Testing
- Test suite: `/app/backend/tests/test_mira_wa.py` (4/4 passing)
- Test reports: `/app/test_reports/iteration_205.json`, `206.json`, `207.json`

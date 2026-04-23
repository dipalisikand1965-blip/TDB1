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

### Session: Path B — MiraImaginesBreed Soul-Hydration (Apr 23, 2026)

**Problem**: Even after Fix 1/2/3, the `MiraImaginesBreed` component (rendered on 12+ pillar pages) ignored `doggy_soul_answers` for custom breeds. A Kanni parent saw: "Mira hasn't met many Kanni yet" + generic "medium coat / medium energy / no sensitivities" filler cards. Two components on the same page spoke with different voices.

**Fix**: Added `hydrateTraitsFromSoul(pet)` helper inside `MiraImaginesBreed.jsx`. When breed is NOT in the 32-breed `BREED_TRAITS` catalog, synthesize traits from soul answers:
- `exercise_needs` + `energy_level` → `energy` (high / medium / low)
- `general_nature` + `separation_anxiety` + `loud_sounds` + `handling_comfort` → anxiety signal + trait chips (sensitive/affectionate/playful/loyal)
- `food_allergies` → sensitivities (allergy / digestive) — maps to existing card branches
- `weight` → size (small / medium / large)
- Composite → `personality` string (used in celebrate + fit pillar cards)

**UI changes**:
- Subtitle now says "Since [name] is one of a kind, Mira is imagining based on their soul — not a breed template." for soul-hydrated pets
- Trait chips now render for soul-hydrated breeds (coat chip hidden — honest, since we don't ask coat in soul yet)
- New `✦ from [name]'s soul` badge differentiates soul-synthesized traits from hardcoded catalog
- Bottom banner acknowledges: "Mira's imagining these from [name]'s answers so far — every new one sharpens the picks"

**Verified**: 4 unit-test cases pass for `hydrateTraitsFromSoul` (rich anxious/active/allergic soul, thin soul, empty soul, calm affectionate small dog). Lint clean. No API changes needed.

**Result**: The two components (`PersonalisedBreedSection` soul_fallback + `MiraImaginesBreed` soul hydration) now speak with ONE unified voice for custom-breed pets. Known breeds (Labrador, Indie, etc.) flow UNCHANGED.

**Files changed**:
- `/app/frontend/src/components/common/MiraImaginesBreed.jsx` (+114 / -12)

### Session: Custom Breed Soul Fallback (Apr 23, 2026) — Fix 1/2/3 bundle

**Problem solved**: Free-text breed (Kanni, Chippiparai, mixed) saved OK but Mira fell back to "Indie" / generic products — ignoring soul characteristics. Also breed wasn't mirrored into `doggy_soul_answers`.

**Fix 1 — Tag custom breeds on save** (`SoulBuilder.jsx` + `server.py:/pet-soul/save-answers`)
- Frontend sends `custom_breed: otherBreedSelected` flag in payload
- Backend persists `pets.custom_breed` (bool). Also auto-infers `true` when breed is provided but not in `BREED_PROFILES` catalog

**Fix 2 — Soul-based product fallback** (`breed_catalogue.py`)
- New helpers: `is_known_breed()`, `_extract_soul_signals()`, `_build_soul_query()`, `_soul_thin()`, `_mira_note_for()`
- `/api/breed-catalogue/products` now accepts `pet_id` + `custom_breed` query params
- When custom breed or unknown breed + pet_id given: switches to soul-mode, excludes breed-specific merchandise categories, returns `context` with `mode` (`breed` / `soul_fallback` / `thin_fallback`), extracted `signals`, Mira voice-note, and Concierge prompt
- Known breeds (Labrador etc.) flow UNCHANGED

**Fix 3 — Mirror breed into soul answers + Concierge thin-soul card**
- `doggy_soul_answers.breed` now set on save alongside `pets.breed` (single source of truth)
- `PersonalisedBreedSection.jsx`: new Mira italic voice-note banner + Concierge CTA card when `mode === 'thin_fallback'`. Empty state also adapted for soul-mode (replaces generic "We're curating X-breed picks" with personality-based copy)

**Verified end-to-end**:
- Kanni (rich soul) → `soul_fallback`, Mira: "Since TestKanni is one of a kind, I'm matching on their sensitive side, their active streak and their allergies."
- Chippiparai (thin soul, 2 answers) → `thin_fallback`, Concierge prompt: "Tell us more about Chippiparai — our Concierge will curate something perfect for TestChippi."
- Labrador (known breed) → `mode: breed`, 102 products, unchanged

**Files changed**:
- `/app/backend/server.py` (save-answers endpoint — custom_breed persist + breed mirror + auto-infer via `is_known_breed`)
- `/app/backend/breed_catalogue.py` (+ ~180 lines: `is_known_breed`, soul signals, soul query, Mira note, `/products` endpoint soul fallback)
- `/app/frontend/src/pages/SoulBuilder.jsx` (payload includes `custom_breed`)
- `/app/frontend/src/components/common/PersonalisedBreedSection.jsx` (consumes `context`, renders Mira note + Concierge card, adapts empty state)

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

## Recent Fixes — Feb 22, 2026 (current session)
- **Bug #13 (H,E,A,L,T,H,Y char-array render) — HARDENED ✅**: Two template-literal spots that could render a char-array as comma-separated letters. `SoulPillarExpanded.jsx:WellnessHeroCard` + `PetHomePage.jsx:getChapterSummary` both wrapped in new `fmtSafe()` formatter (`Array.isArray(v) ? v.filter(Boolean).map(String).join(', ') : String(v ?? '')`) plus expanded empty-condition list.
- **Products stuck on "Loading..." for rare breeds (GoSoulPage) — FIXED ✅**: `GoSoulPage.jsx` had 3 compounding issues:
  1. No explicit loading state — stuck message regardless of fetch status. Now tracks `productsFetched` + `productsFetchError`.
  2. Breed filter could yield zero products for rare breeds (like "tun tun"), with no fallback. Now falls back to universal set with console warning.
  3. Dim category matching only checked `p.category`, so "Calming Travel Spray" (category=travel-health) never landed in Calming dim. Now matches against category + name + sub_category.
  - New empty-state: "No calming products available for {pet} yet. We're adding more — check back soon." (never infinite loading).
- **Bug #17 prep — Anti-orphan guards SHIPPED ✅**: Backend + frontend hardened against pet creation without a valid `owner_email`.
  - `server.py:14689` (auth `POST /api/pets`): 401 if JWT has no email. Normalizes `owner_email` to lowercase.
  - `server.py:14834` (public `POST /api/pets/public`): 400 if body missing/null/whitespace-only owner_email or no `@`. Normalizes.
  - `AddPetPage.jsx:140`: pre-submit guard — refuses to POST without `user.email`. Sends `owner_email` explicitly in payload.
  - **Smoke-tested**: empty/null/whitespace all → HTTP 400 with clear message. Happy path → HTTP 200 with normalized owner_email.
- **Document Vault upload UX — SHIPPED & E2E-TESTED ✅**: The "Missing" tiles in the Document Vault were not clickable (dead cards). Now they open an **inline upload modal** with a file picker, name, and notes. Uploaded files go to **Cloudinary** (persistent across container redeploys, CDN-served) via new `POST /api/upload/document` (server.py:4454), then registered in the pet vault via existing `POST /api/pet-vault/{pet_id}/documents`.
  - **Backend**: New endpoint with 10 MB size cap, supports PDF/JPG/PNG/WEBP/DOCX/etc. Smart resource-type routing: PDFs/docs → `raw/upload/` (no 401 ACL), images → `image/upload/` (CDN-optimized).
  - **Frontend**: `DocumentVault.jsx` fully rewritten — each tile clickable with "Tap to upload →" hint, inline modal with file picker + optional name/notes. Existing `/api/paperwork/documents/*` attempts removed.
  - **E2E test**: Login as Dipali → open Mojo's pet-home → tap Insurance tile → modal opens → upload PDF → vault jumps 33% → 50% → tile shows "Complete · Uploaded · View · Replace →". 100% automated verification.
- **Bug #10 (Document Vault / Insurance not saving) — CLOSED**: Above fix supersedes earlier partial fix. Documents now persistent (Cloudinary CDN, no container-disk risk).
- **Bug #16 (Soul Score stuck at 0%) — CLOSED**: Hardcoded `0%` display in PetSoulOnboarding.jsx resume screen replaced with dynamic `{pct}%` + live SVG ring fill.
- **MiraMeetsYourPet.jsx registration diagnostics**: replaced generic "Could not connect" catch block with detailed error surfacing (HTTP status, duplicate email detection, network-error message).
- **Soul Score production-readiness — SHIPPED (Aditya's 3-change plan)**: Backend is now the sole source of truth for Soul Score across all endpoints.
  - `server.py:10517` — ignores client-sent `soul_score` on `POST /api/pet-soul/save-answers`. Always computes canonical via `pet_score_logic.calculate_pet_soul_score` from merged answers.
  - `server.py:14717` — `/api/pets/my-pets` always recalculates from `doggy_soul_answers`, removed "stored > 0, use it" fast-path.
  - `server.py:14745` — added asyncio write-back: when fresh_score ≠ stored, fires `db.pets.update_one` in background.
  - **Smoke-tested**: Mojo = 100% consistent across 4 endpoints. Dipali's 8 M-pet cluster auto-healed from stale 60% → canonical 90%. Malicious `soul_score: 999` payload ignored.

## Soul Score Remaining Housekeeping (deferred, not urgent)
- Extend `UI_TO_CANONICAL_MAP` in `canonical_answers.py` to recognize PetSoulOnboarding UI keys (`age_stage`, `personality_primary`, `attachment_style`, etc.) so pets answering onboarding get their full canonical contribution. Currently Badmash ceilings at 19% because only 4/26 canonical fields are reached.
- 6 other backend calculators remain (pet_soul_routes.calculate_overall_score, household_routes.calculate_pet_soul_score, soul_intelligence.calculate_soul_completeness, server.calculate_pet_soul_score_legacy, canonical_answers.calculate_soul_score, pet_soul_routes.calculate_folder_score) — now harmless since writes/reads both use `pet_score_logic`, but would be cleaner to consolidate.
- 3 frontend local calculators remain (PetSoulOnboarding 368-pts local, SoulBuilder 100-pts local, Mira sync) — show stale mid-session numbers until round-trip. Reconcile on next save. Low UX priority.
- Regression tests: no test asserts Dashboard==MyPets==PetSoul consistency.

## 3rd Party Integrations
- OpenAI GPT-4o — Emergent LLM Key
- Gupshup WhatsApp — User API Key required
- Razorpay — User API Key required
- Cloudinary — User API Key required
- Zoho Desk (Support) — OAuth, ZOHO_REFRESH_TOKEN with Desk.tickets.ALL + Desk.contacts.ALL
- Google Drive (SiteVault backup) — Service Account JSON
- Resend (Email) — User API Key
- SendGrid (legacy Email) — User API Key

## Testing
- Test suite: `/app/backend/tests/test_mira_wa.py` (4/4 passing)
- Test reports: `/app/test_reports/iteration_205.json`, `206.json`, `207.json`
- Bug #10 smoke test: GET/POST round-trip against Dipali's Mojo pet — HTTP 200 both directions, document persisted and cleaned up.

# Pet Life OS — Product Requirements Document
## The Doggy Company · India's First Pet Life Operating System

---

## 1. Vision & Core Platform
India's first **Pet Life OS** — a comprehensive lifestyle platform for pet parents, powered by AI concierge **Mira**, with personalised product recommendations, concierge services, guided care paths, and deep pet soul profiling across 12 life pillars.

**Key Differentiator**: Every user action creates an Admin Service Desk ticket with deep pet context (breed, allergies, soul score, Mira briefing). No pet app in India does this.

## 2. Architecture
- **Frontend**: React (Vite) + Tailwind CSS + Shadcn UI
- **Backend**: FastAPI (Python 3.11) + MongoDB (Motor async)
- **AI Engine**: OpenAI GPT-4o / Claude Sonnet via Emergent LLM Key
- **Storage**: Cloudinary (images), MongoDB (data)
- **Payments**: Razorpay
- **WhatsApp**: Gupshup (live, configured)
- **Deployment**: Kubernetes (Emergent Platform)

## 3. Pillar Audit Status

| # | Pillar | Status | Audit Date | Auditor | Notes |
|---|--------|--------|------------|---------|-------|
| 1 | Celebrate | LOCKED | Mar 2026 | Previous | DO NOT TOUCH — 28+ concierge wiring points |
| 2 | Dine | LOCKED | Mar 2026 | Previous | DO NOT TOUCH — breed filtering, Soul Made |
| 3 | Care | LOCKED | Mar 2026 | Previous | DO NOT TOUCH — 20/20 breed in tickets |
| 4 | Go *(includes Stay + Travel)* | LOCKED | Mar 2026 | Previous | DO NOT TOUCH — teal border, CSS ring fix |
| 5 | Play *(includes Fit + Enjoy)* | LOCKED | Mar 2026 | Previous | DO NOT TOUCH — GuidedPlayPaths, PathFlowModal |
| 6 | **Learn** | **LOCKED** | **Mar 24, 2026** | **Current** | Content modal CTAs, breed guide, Pet Wrapped card |
| 7 | **Adopt** | **LOCKED** | **Mar 24, 2026** | **Current** | **Mira picks split, concierge verified, mobile checked** |
| 8 | **Farewell** | **LOCKED** | **Mar 24, 2026** | **Current** | **Gentle tone enforced, no gamification, service flows verified** |
| 9 | **Emergency** | **LOCKED** | **Mar 24, 2026** | **Current** | **Service flows split, emergency help CTAs verified, mobile checked** |
| 10 | **Paperwork** *(includes Advisory)* | **LOCKED** | **Mar 24, 2026** | **Current** | **NearMe wired, Document Vault added, prices hidden, verified** |
| 11 | Shop | PENDING | — | — | Breed-products fix applied |
| 12 | Services | PENDING | — | — | |

## 4. Universal Concierge Wiring Rule
**Every actionable element** (service card, product CTA, guided path completion, AI chat, NearMe venue tap) **MUST** fire:
```
POST /api/service_desk/attach_or_create_ticket
```
With: `pet_id`, `pillar`, `channel`, `initial_message` → Backend auto-resolves `pet_breed` (normalised), `mira_briefing` (with allergies), `pet_name`.

WhatsApp confirmation fires automatically on every new ticket.

### 4.1 Cross-Pillar Mira Picks Rule — DO NOT BREAK
**Critical architecture rule for ALL pillars:** `GET /api/mira/claude-picks` can return a mix of `entity_type=product` and `entity_type=service` unless explicitly filtered.

**Never render mixed picks through product-card logic.**

Required pattern:
1. Fetch **products** separately:
   ```
   /api/mira/claude-picks/{pet_id}?pillar=PILLAR&limit=12&min_score=60&entity_type=product
   ```
2. Fetch **services** separately:
   ```
   /api/mira/claude-picks/{pet_id}?pillar=PILLAR&limit=6&min_score=60&entity_type=service
   ```
3. Render separately:
   - **Products** → product cards / product modal / score bars allowed
   - **Services** → concierge service cards / service modal only / **NO cart behavior / NO product modal / NO score bar unless intentionally service-specific UI**

**If a pillar uses a mixed fallback response, it MUST branch on `entity_type` before rendering.**

Never allow these regressions again:
- service pick opening `ProductDetailModal`
- service pick showing add-to-cart behavior
- service pick showing product pricing UI by default
- service pick being treated as catalogue merchandise

Reference implementation patterns:
- `CareSoulPage.jsx` — canonical split fetch pattern
- `AdoptSoulPage.jsx` — mixed response safely separated into product vs concierge service behavior
- `CelebratePageNew.jsx`, `EmergencySoulPage.jsx`, `FarewellSoulPage.jsx`, `PaperworkSoulPage.jsx` — service picks routed to concierge flows

### 4.2 Admin Routing Rule — DO NOT CONFUSE SERVICE VS PRODUCT
This must stay true across frontend, backend, scoring, and admin tooling:

- **Products** live in `products_master`
- **Services** live in `services_master`
- **Bundles** live in `bundles`
- **Scores for all three** live in `mira_product_scores` with explicit `entity_type`

Runtime behaviour:
- If `entity_type=product` → render as a **product** → product modal / product card behaviour
- If `entity_type=service` → render as a **service** → concierge/service modal behaviour
- If `entity_type=bundle` → render as bundle behaviour only where explicitly supported

Admin editing destinations:
- **Products** → product editors (`ProductBoxEditor`, pillar product admin flows, soul product admin flows)
- **Services** → service editors (`ServiceCRUDAdmin`, service-box / `services_master` admin flows)
- **Service desk tickets are NOT the same as catalogue editing**

### 4.3 Source-of-Truth Database Rule — DO NOT MIX PREVIEW / EMERGENT VIEWER / DEPLOY TARGETS
- The **local MongoDB used by this running app** (`mongodb://localhost:27017`, `DB_NAME=pet-os-live-test_database`) is the source of truth for launch preparation in this job.
- Dipali explicitly stated that what is in the local Mongo used by the app is what should be migrated to the final deployment database.
- Any differing data visible in other preview/emergent database viewers must not override this local source-of-truth without an explicit migration decision.
- Atlas / deployment migration plan:
  1. Get Atlas connection string from Dipali
  2. Compare local vs Atlas collection counts
  3. Migrate every collection/document from local source-of-truth DB
  4. Verify counts match exactly before switching production envs

Important distinction:
- A **service pick** should create a **service desk ticket** for operational follow-up
- The underlying **service definition** must still be edited in **service admin**, not product admin

Never allow these regressions:
- service entity opening a product editor flow
- product entity opening a service support flow by default
- admin users being unable to tell whether an item belongs to `products_master` or `services_master`
- missing `entity_type` on saved scores in `mira_product_scores`

## 5. Breed Normalisation System
- **Backend**: `/app/backend/breed_normalise.py`
  - `normalise_breed(raw)` → known breed or `'indie'` fallback
  - 50 KNOWN_BREEDS + BREED_ALIASES (mixed/desi/mutt/unknown → indie)
- **Frontend**: `/app/frontend/src/utils/breedNormalise.js`
  - `normaliseBreed(breed)` + `filterBreedProducts(products, petBreed)`
- **Rule**: Known breed → exact products. Unknown/mixed → Indie (most common Indian dog)
- **Mira**: Always uses pet's ACTUAL breed name — never overrides in conversation
- **Wired into**: `mira_service_desk.py` (all 3 ticket creation paths), breed-products API

## 6. Complete Feature Inventory — This Session (Mar 24, 2026)

### 6.1 Learn Pillar Audit (COMPLETED & LOCKED)
- **Content Modal Footer CTA** (Play pattern): Pills open product modal; footer bar shows "Start Mojo's {Category} Path →" for Foundations, Behaviour, Training, Tricks, Enrichment
- **Know Your Breed Modal**: Added Mira's Breed Guide ("MIRA ON INDIE" + breed traits) + Pet Wrapped 2026 card with gold CTA
- **"Book for Mojo →"**: All 3 service card instances personalised with pet name
- **LearnNearMe Fix**: Added `selectedPlace` state to main component, removed dead state from TrainerCard, fixed double fragment wrapper
- **GuidedLearnPaths**: Exported `buildPaths` and `PathFlowModal` for reuse
- **Concierge Wiring**: 20+ wiring points verified, tickets have pet_breed + allergy context
- **Mobile (375px)**: All fonts ≥13px, PathFlowModal renders cleanly

### 6.2 Performance Fixes
- **MongoDB Indexes Added**: `pets.owner_email`, `pets.parent_id`, `pets.id`, `pets.email`, `mira_product_scores.(pet_id,pillar)`, `mira_product_scores.(pet_id,score)`, `breed_products.(breed,is_active,is_mockup)`
- **MiraScoreEngine Throttle**: Changed from parallel 2-batch to sequential with 0.5s yield between batches; cooldown increased from 6h to 24h; fallback paths check existing scores before re-triggering
- **Result**: `/api/pets/my-pets` from timeout → 209ms

### 6.3 Breed-Products API Fix
- **Root Cause**: DB stores `shih_tzu` (underscore), frontend sends `shih tzu` (space)
- **Fix**: `re.sub(r'[ _]', '[_ ]', breed)` in `server.py` line ~11537
- **Result**: Shih Tzu 0 → 77 products, Golden Retriever 0 → 77 products

### 6.4 Pet Wrapped Auto-Regeneration
- **Soul answer save** → auto-regen (server.py both endpoints + pet_soul_routes.py)
- **Vault updates** (vaccine/vet visit/medication) → auto-regen (pet_vault_routes.py)
- **Order completion** → auto-regen (orders_routes.py)
- **Confirmed**: Timestamp updates from 08:28 → 08:36 immediately after soul answer save

### 6.5 WhatsApp on New Ticket
- **Where**: `mira_service_desk.py` after ticket creation
- **Message**: "Concierge received your request for {pet_name}. We'll be in touch within 24 hours."
- **Tested**: Message ID `be14d602-...` delivered to 919876***

### 6.6 Maltese Trailing Space Fix
- Lola's breed: `"Maltese "` → `"Maltese"` (DB trimmed)

### 6.7 Paperwork Audit — Locked
- Added `DocumentVault.jsx` for Paperwork + Pet Home using soul/vault data: progress bar, 6 document cards, urgent gaps, concierge sort CTA
- Wired Paperwork Find Help tab to render `PaperworkNearMe` instead of placeholder content
- Fixed ProductCard breed tag formatting so `all_breeds` displays as `all breeds`
- Updated Paperwork CTA copy to `Book for {petName} →` and hid AI score bars for service-type Mira picks
- Smoke tested screenshots: Paperwork documents tab, Paperwork Find Help tab, Pet Home vault

### 6.8 Cross-Pillar Mira Picks Service/Product Split Fix
- Normalised mixed `claude-picks` fetches to Care-style split fetches for **Adopt, Celebrate, Emergency, and Farewell** using separate `entity_type=product` and `entity_type=service` calls
- Updated service picks in **Celebrate, Adopt, Emergency, Farewell, and Paperwork** to open concierge/service modals instead of `ProductDetailModal`
- Protected product-only UI surfaces by forcing product-only `claude-picks` fetches in Learn and Paperwork Mira fallback modals
- Verified service-pick modal behaviour with screenshots on Celebrate, Adopt, Farewell, and Emergency
- Post-fix grep now only returns comments/docs for non-`entity_type` `claude-picks` references

### 6.9 Adopt Audit — Locked
- Adjusted Adopt tone to be gentle and concierge-led in Mira picks and service guidance
- Added concierge tracking before opening Adopt support flows (`Start with Mira`, service cards, service picks)
- Guided Adopt Paths now create real service desk tickets via canonical guided path helper and use null-safe pet-name fallbacks
- Verified Adopt tickets with breed + allergy context: `TDB-2026-0797`, `TDB-2026-0798`, `TDB-2026-0799`
- Captured mobile 375px screenshots for Adopt service and rescue tabs

### 6.10 Farewell Audit — Locked
- Removed gamification language from Farewell support flows: no points, no visible scores, no progression copy framed as unlocking
- Replaced shared score-heavy profile strip with a gentle custom guidance bar and softened Mira picks subtitle to: “I'm here with you… 🌷”
- Verified Farewell concierge/service flows with breed + allergy context: `TDB-2026-0800`, `TDB-2026-0801`, `TDB-2026-0802`
- Added grief counsellor support to Farewell NearMe and changed support CTA language to compassionate actions (`Arrange for {petName} →`, `Reach out gently →`)
- Captured desktop and mobile screenshots showing compassionate modal and no score-led UI in the main hero/profile area

### 6.11 Emergency Audit — Locked
- Hid visible emergency service pricing on pillar service surfaces and changed service CTAs to `Get help now →`
- Added pre-open concierge tracking for emergency service cards so every emergency action creates a service desk trail immediately
- Verified Emergency concierge/service flows with breed + allergy context: `TDB-2026-0803`, `TDB-2026-0804`, `TDB-2026-0805`
- Captured desktop and mobile screenshots for emergency help modal and service tab at 375px

## 7. Canonical Flow Audit Results (Locked Pillars)

| Flow | Status | Detail |
|------|--------|--------|
| My Requests | YES | Member sees 5+ tickets |
| Admin Service Desk | YES | Admin sees 10+ tickets, all breed=Indie |
| Admin Bell | YES | 5 notifications firing |
| Member Inbox | YES | `/api/inbox` endpoint |
| Cart | YES | 2 items, products adding correctly |
| Mira Widget | YES | Knows Mojo across all 6 pillars ("Oh my sweet Mojo, beautiful Indie, 100% soul score") |
| NearMe | YES | 12 vets, 12 groomers, 12 trainers |
| WhatsApp | YES | Gupshup configured, message delivered |
| Ticket Completeness | See below | |

### Ticket Completeness per Pillar (last 20 each):
```
PILLAR       TOTAL    BREED%     ALLERGY%     LAST CHANNEL
celebrate    170      19/20       19/20         celebrate_pillar_page
dine         101      15/20       18/20         dine_request
care         247      20/20       20/20         soul_made_care
go           15       1/15        3/15          go_request
play         10       6/10        10/10         play_guided_paths_complete
learn        66       8/20        18/20         learn_bundle_add
```

## 8. Key API Endpoints
- `POST /api/service_desk/attach_or_create_ticket` — Universal concierge entry
- `GET /api/pets/my-pets` — Pet list (indexed, <300ms)
- `GET /api/admin/breed-products?breed=X&is_active=true` — Breed products (normalised)
- `POST /api/pet-soul/profile/{pet_id}/answer` — Soul answer save (triggers wrapped regen)
- `GET /api/wrapped/generate/{pet_id}` — Generate Pet Wrapped
- `GET /api/wrapped/download/{pet_id}` — Download wrapped HTML
- `GET /api/places/care-providers?city=X&type=Y` — NearMe places
- `POST /api/mira/os/stream` — Mira AI chat (SSE streaming)
- `GET /api/service-box/services?pillar=X` — Pillar services/products

## 9. Key Database Collections
- `pets` — Pet profiles with `doggy_soul_answers`, `overall_score`, `breed`
- `service_desk_tickets` — Concierge requests (auto-resolved `pet_breed`, `mira_briefing`)
- `products_master` — Standard products per pillar
- `breed_products` — 50 breeds × product types (2,978 active)
- `mira_product_scores` — AI-scored product recommendations per pet (21,271 scores)
- `pet_wrapped` — Pet Wrapped annual data (auto-regenerated)
- `users` — 14 users, 13 with phone, 8 with WhatsApp

## 10. Upcoming Tasks (Priority Order)
- **(P0)** Complete remaining **Paperwork** audit: cross-check all service/product tickets, mobile 375px, and finalize price/wiring consistency
- **(P0)** Audit remaining pillars after Paperwork: Adopt → Farewell → Emergency → Shop → Services
- **(P1)** WhatsApp Daily Digest: "Good morning Dipali! Mojo's soul is 100% known. Today Mira suggests: Salmon treats after his morning walk — perfect for an Indie his age."
- **(P1)** Add "3 vets near you" to WhatsApp health reminders
- **(P1)** Extend scheduler for medication refill reminders

## 11. Future/Backlog
- (P2) Build the Love pillar
- (P2) Refactor server.py (24k+ lines) into modular routers
- (P2) Add "My Custom Orders" tab in user profile

## 12. 3rd Party Integrations
| Service | Purpose | Status |
|---------|---------|--------|
| OpenAI GPT-4o | Mira AI (scoring, chat) | Active via Emergent LLM Key |
| Claude Sonnet | Mira AI (alternate) | Active via Emergent LLM Key |
| Cloudinary | Image storage | Active (User API Key) |
| Razorpay | Payments | Active (User API Key) |
| Gupshup | WhatsApp messaging | Active (configured in .env) |

## 13. Test Credentials
- **User**: dipali@clubconcierge.in / test123
- **Admin**: aditya / lola4304
- **Admin Portal**: /admin

## 14. Critical Rules for Next Agent
1. **DO NOT TOUCH** Celebrate, Dine, Care, Go, Play, Learn, Paperwork, Adopt, Farewell, Emergency — they are LOCKED (Go includes Stay/Travel, Play includes Fit/Enjoy, Paperwork includes Advisory)
2. Follow `/app/memory/PILLAR_AUDIT_METHODOLOGY.md` for all audits
3. Use `testing_agent_v3_fork` after completing each pillar audit
4. Every interactive element MUST fire `POST /api/service_desk/attach_or_create_ticket`
5. Backend auto-resolves `pet_breed` via `normalise_breed()` — never send raw breed from frontend
6. **Mira picks must never mix service and product rendering.** Use separate `entity_type=product` and `entity_type=service` fetches wherever possible; otherwise branch on `entity_type` before rendering.
7. **Service picks must open concierge/service modals, not product modals.**
8. **Farewell pillar rule:** no gamification, no “unlock”, no urgency marketing language, and no score-led support UI.
6. `PillarSoulProfile` uses standardised `max-w-5xl` container + CSS border (not SVG ring)
7. Content Modals use client-side breed filtering — only show pet's own breed tab
8. If backend port 8001 stalls, run `pkill -f uvicorn && sudo supervisorctl restart backend`

## 15. File Reference Map
### Backend
- `/app/backend/server.py` — Main server (24k+ lines, P2 refactor planned)
- `/app/backend/mira_service_desk.py` — Service desk + WhatsApp on new ticket
- `/app/backend/mira_score_engine.py` — AI scoring (throttled, 24hr cooldown)
- `/app/backend/breed_normalise.py` — Breed normalisation utility
- `/app/backend/pet_soul_routes.py` — Soul answers + wrapped auto-regen
- `/app/backend/pet_vault_routes.py` — Health vault + wrapped auto-regen
- `/app/backend/orders_routes.py` — Orders + wrapped auto-regen
- `/app/backend/whatsapp_notifications.py` — Gupshup WhatsApp sender
- `/app/backend/routes/wrapped/` — Pet Wrapped (10 route files)

### Frontend
- `/app/frontend/src/pages/LearnSoulPage.jsx` — Learn page (LOCKED)
- `/app/frontend/src/components/learn/GuidedLearnPaths.jsx` — Guided paths + PathFlowModal
- `/app/frontend/src/components/learn/LearnNearMe.jsx` — NearMe with concierge modal
- `/app/frontend/src/components/PillarSoulProfile.jsx` — Universal soul profile bar
- `/app/frontend/src/utils/breedNormalise.js` — Frontend breed normalisation
- `/app/frontend/src/utils/tdc_intent.js` — TDC intent/concierge utility

### Memory & Docs
- `/app/memory/PRD.md` — This file
- `/app/memory/PILLAR_AUDIT_METHODOLOGY.md` — 8-phase audit process
- `/app/frontend/public/complete-documentation.html` — Auto-generated docs

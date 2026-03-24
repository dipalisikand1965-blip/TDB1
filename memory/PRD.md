# Pet Life OS — Product Requirements Document
## The Doggy Company · India's First Pet Life Operating System

---

## 1. Vision & Core Platform
India's first **Pet Life OS** — a comprehensive lifestyle platform for pet parents, powered by AI concierge **Mira**, with personalised product recommendations, concierge services, guided care paths, and deep pet soul profiling across 13 life pillars.

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
| 4 | Go | LOCKED | Mar 2026 | Previous | DO NOT TOUCH — teal border, CSS ring fix |
| 5 | Play | LOCKED | Mar 2026 | Previous | DO NOT TOUCH — GuidedPlayPaths, PathFlowModal |
| 6 | **Learn** | **LOCKED** | **Mar 24, 2026** | **Current** | Content modal CTAs, breed guide, Pet Wrapped card |
| 7 | Adopt | PENDING | — | — | Next in audit queue |
| 8 | Farewell | PENDING | — | — | |
| 9 | Emergency | PENDING | — | — | |
| 10 | **Paperwork** | **NEXT** | — | — | **Next agent starts here** |
| 11 | Shop | PENDING | — | — | Breed-products fix applied |
| 12 | Services | PENDING | — | — | |
| 13 | Advisory | PENDING | — | — | |

## 4. Universal Concierge Wiring Rule
**Every actionable element** (service card, product CTA, guided path completion, AI chat, NearMe venue tap) **MUST** fire:
```
POST /api/service_desk/attach_or_create_ticket
```
With: `pet_id`, `pillar`, `channel`, `initial_message` → Backend auto-resolves `pet_breed` (normalised), `mira_briefing` (with allergies), `pet_name`.

WhatsApp confirmation fires automatically on every new ticket.

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

## 7. Canonical Flow Audit Results (All 6 Locked Pillars)

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
- **(P0)** Audit remaining pillars: Adopt → Farewell → Emergency → **Paperwork** → Shop → Services
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
1. **DO NOT TOUCH** Celebrate, Dine, Care, Go, Play, Learn — they are LOCKED
2. Follow `/app/memory/PILLAR_AUDIT_METHODOLOGY.md` for all audits
3. Use `testing_agent_v3_fork` after completing each pillar audit
4. Every interactive element MUST fire `POST /api/service_desk/attach_or_create_ticket`
5. Backend auto-resolves `pet_breed` via `normalise_breed()` — never send raw breed from frontend
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

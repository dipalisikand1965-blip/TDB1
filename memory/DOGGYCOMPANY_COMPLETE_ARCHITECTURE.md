# 🐾 The Doggy Company — Complete Architecture Audit
**Generated**: Apr 23, 2026 · **Version**: 1.0 (Initial ScaleBoard-style audit)
**Environment audited**: Preview (`pet-soul-ranking.preview.emergentagent.com`)
**Production URL**: `thedoggycompany.com`
**Stack**: React 18 + FastAPI + MongoDB 7 + Cloudinary CDN
**Database**: `pet-os-live-test_database` on local MongoDB (`/data/db` on persistent NVMe volume)

> **This document is auto-maintainable.** Re-run the audit to refresh sections bounded by `<!-- AUDIT:SECTION -->` markers. Future agents should read this file FIRST before touching code.

---

## 🧭 Executive Summary

| Metric | Value |
|---|---|
| Total MongoDB collections | **221** |
| Total documents | **115,001** |
| Backend route files | **30+** |
| Total API endpoints | **1,179** |
| Frontend routes | **164** |
| Scheduled cron jobs | **13** (APScheduler) |
| 3rd-party integrations | **14** (Cloudinary, Gupshup, Resend, Razorpay, Zoho Desk, Google Drive, etc.) |
| Backend .env variables | **71** |
| Frontend .env variables | **3** |
| Memory/docs files | **335** files in `/app/memory/` |

**Production readiness posture**: 🟡 *Mostly healthy, three critical hardenings recommended before next prod push.*

---

## 1. 🗄️ DATABASE AUDIT
<!-- AUDIT:DATABASE:START -->

### Top 40 Collections by Document Count

| Docs | Collection | Purpose |
|------|-----------|---------|
| 26,179 | `mira_signals` | AI behavior telemetry for learning |
| 17,178 | `mira_product_scores` | Per-pet product match scores |
| 9,498 | `products_master` | Canonical product catalog (Shopify-synced) |
| 8,628 | `products_master_backup_20260404` | Backup snapshot (Apr 4) |
| 7,079 | `unified_products` | Cross-pillar unified product view |
| 5,131 | `products_master_backup_20260322` | Older backup (Mar 22) |
| 4,941 | `breed_products` | Breed-specific merchandise |
| 4,940 | `mira_conversations` | Mira chat history |
| 4,549 | `admin_notifications` | Admin event feed |
| 2,729 | `member_notifications` | Member event feed |
| 1,635 | `products` | Legacy product collection |
| 1,082 | `channel_intakes` | Concierge/WhatsApp intakes |
| 1,026 | `services_master` | Canonical services catalog |
| 973 | `live_conversation_threads` | Active Mira chat threads |
| 641 | `email_logs` | Resend email delivery audit |
| 615 | `service_desk_tickets` | Zoho Desk mirror |
| 606 | `product_soul_tiers` | Soul-tier product rankings |
| 522 | `tickets` | Legacy tickets |
| 520 | `pillar_requests` | Cross-pillar Concierge requests |
| 509 | `mira_tickets` | Mira-initiated Concierge tickets |

### Business / Financial Collections

| Collection | Count | Notes |
|------------|-------|-------|
| `orders` | 33 | Live member orders |
| `payments` | 6 | Razorpay payment records |
| `payment_orders` | 3 | Razorpay order creation records |
| `invoices` | 0 | Not yet used |
| `subscriptions` | 0 | Membership billing not yet tracked here |
| `refunds` | 0 | Not yet used |

### Backup / Replica Collections Present

`products_master_backup_20260404`, `products_master_backup_20260322`, `unified_products_backup_20260322`, `breed_products_backup_20260322`, `products_backup_20260322`, `services_master_backup_20260322`, `product_soul_tiers_backup_20260322`, `bundles_backup_20260322`, `service_catalog_backup_20260322`, `celebrate_products_backup_20260322`, `enhanced_collections_backup_20260322`, `farewell_bundles_backup_20260322`, `learn_products_backup_20260322`.

> **Housekeeping note**: 13 backup-* collections exist. Recommend keeping the two most recent per collection and deleting older ones to reduce DB size.

### Empty / Near-Empty Collections (candidates for deprecation)

`wishlists (1)`, `members (1)`, `reservations (1)`, `reviews (1)`, `admin_settings (1)`, `foster_applications (1)`, `zoho_token_cache (1)`, `zoho_sync_log (1)`, `social_share_claims (1)`, `quotes (1)`, `agents (1)`, `rainbow_bridge_tributes (1)`, `member_password_resets (1)`, `wa_pet_state (1)`, plus ~4 at 0 docs.

### Sitevault Run Status — 🔴 PROBLEM FOUND

```
started_at: 2026-04-21T04:00   status: MISSING
started_at: 2026-04-21T04:29   status: MISSING
started_at: 2026-04-21T04:39   status: MISSING
started_at: 2026-04-22T15:42   status: MISSING
started_at: 2026-04-23T02:36   status: "success"  ← ONLY THIS ONE LOGGED
```
**4 of 5 `sitevault_runs` have no `status` field** — jobs started but never wrote a terminal status. This matches the ScaleBoard Bug E pattern exactly.

<!-- AUDIT:DATABASE:END -->

---

## 2. 🔌 API ENDPOINTS
<!-- AUDIT:API:START -->

### Routes by Module (top 20)

| Routes | File | Domain |
|-------:|------|--------|
| 150 | `mira_routes.py` | AI assistant / semantic search / briefings |
| 98 | `ticket_routes.py` | Service desk / Zoho integration |
| 53 | `concierge_routes.py` | White-glove concierge flows |
| 50 | `server.py` (core) | Auth, health, admin, utility |
| 45 | `travel_routes.py` | Go pillar (stays, travel planning) |
| 42 | `paperwork_routes.py` | Pet Vault (documents, ID cards) |
| 37 | `learn_routes.py` | Learn pillar (trainers, CMS) |
| 34 | `fit_routes.py` | Fitness / workouts |
| 33 | `enjoy_routes.py` | Enjoy pillar (play, toys) |
| 32 | `care_routes.py` | Care pillar (grooming, vet) |
| 30 | `engagement_engine.py` | Nudges / campaigns |
| 30 | `emergency_routes.py` | Emergency pillar |
| 30 | `celebrate_routes.py` | Celebrate pillar (birthdays, boxes) |
| 28 | `advisory_routes.py` | Advisory services |
| 27 | `adopt_routes.py` | Adoption pillar |
| 21 | `shop_routes.py` | Shop cart/checkout |
| 21 | `breed_catalogue.py` | Breed-aware products + **NEW** soul fallback + favourites |
| 20 | `service_box_routes.py` | Service bundles |
| 19 | `farewell_routes.py` | Rainbow Bridge pillar |

**Key public endpoints (no auth)**:
- `GET /api/health` · `GET /health` · `GET /health/db`
- `GET /api/public/inventory-csv` · `GET /api/public/system-overview` · `GET /api/public/docs-zip`
- `GET /api/breed-catalogue/products` · `GET /api/breed-catalogue/favourites`

**Admin-gated endpoints** use `Depends(verify_admin)` or HTTPBasicCredentials → admin_member_routes pattern.

<!-- AUDIT:API:END -->

---

## 3. 🖥️ FRONTEND PAGES
<!-- AUDIT:FRONTEND:START -->

**Total routes**: 164 declared in `App.js`

### Core member routes (sample)
`/`, `/dashboard`, `/dine`, `/care`, `/celebrate`, `/shop`, `/go`, `/play`, `/learn`, `/emergency`, `/paperwork`, `/farewell`, `/pet/:petId`, `/pets`, `/add-pet`, `/pet-soul-onboarding`, `/mira-search`, `/mira`, `/ask-mira`, `/services`, `/accessories`, `/advisory`, `/adopt`

### Admin routes (9)
`/admin`, `/admin/concierge`, `/admin/concierge-realtime`, `/admin/docs`, `/admin/forgot-password`, `/admin/mira-concierge`, `/admin/reset-password`, `/admin/service-desk`, `/admin/services`

### Auth routes
`/login`, `/register`, `/signup`, `/forgot-password`, `/reset-password`, `/verify-email`

### Key data-fetching patterns
- **Pillar pages** → read `usePillarContext().currentPet` + call `/api/breed-catalogue/*` + `/api/mira/*`
- **Mira Search** → `/api/mira/semantic-search` (POST) with per-turn state
- **Pet Vault** → `/api/upload/document` (Cloudinary) + `/api/paperwork/*`
- **Soul Builder** → `/api/pet-soul/save-answers` (merge-safe)

<!-- AUDIT:FRONTEND:END -->

---

## 4. 🔗 INTEGRATIONS
<!-- AUDIT:INTEGRATIONS:START -->

| Integration | Status | Key in .env | Collection |
|-------------|--------|-------------|-----------|
| **OpenAI / Claude / Gemini** | 🟢 Active via Emergent LLM Key | `EMERGENT_LLM_KEY` | Used inline for Mira chat + gpt-image-1 + Nano Banana |
| **Cloudinary** (Document Vault + Mira Imagines) | 🟢 Active | `CLOUDINARY_API_KEY/SECRET/CLOUD_NAME` | `mira_imagines_cache` (42 docs) |
| **Gupshup WhatsApp** | 🟢 Active | `GUPSHUP_API_KEY/APP_NAME/SOURCE_NUMBER` | `whatsapp_logs` (120 docs) |
| **Resend Email** | 🟢 Active | `RESEND_API_KEY` | `email_logs` (641 docs) |
| **Razorpay Payments** | 🟢 Active | `RAZORPAY_KEY_ID/SECRET` | `payments` (6), `payment_orders` (3) |
| **Zoho Desk** | 🟢 Active (OAuth refresh) | `ZOHO_CLIENT_ID/SECRET/REFRESH_TOKEN/ORG_ID/DEPARTMENT_ID` | `service_desk_tickets` (615), `zoho_token_cache` (1) |
| **Google Drive (SiteVault)** | 🟢 Active | `GOOGLE_SERVICE_ACCOUNT_JSON`, `GDRIVE_TDC_FOLDER_ID` | `sitevault_runs` (5, **mostly unlogged**) |
| **Google Places API** | 🟢 Active | `GOOGLE_PLACES_API_KEY` | Used for nearby services |
| **OpenWeather** | 🟢 Active | `OPENWEATHER_API_KEY` | Used for Go/Care pillars |
| **Amadeus / Viator / Eventbrite / Foursquare** | 🟢 Active | Respective API keys | Go pillar travel planning |
| **YouTube API** | 🟡 Integrated, limited use | `YOUTUBE_API_KEY` | Learn pillar videos |
| **Google Vision API** | 🟡 Integrated, limited use | `GOOGLE_VISION_API_KEY` | Document OCR |
| **ElevenLabs** | 🟡 Integrated, limited use | `ELEVENLABS_API_KEY` | TTS for Mira voice |
| **Chatbase** | 🟡 Integrated | `CHATBASE_API_KEY/CHATBOT_ID` | Legacy chatbot |
| **Atlas MongoDB (cloud backup)** | 🟢 Active | `PRODUCTION_MONGO_URL` | Auto-synced every 6h |

<!-- AUDIT:INTEGRATIONS:END -->

---

## 5. ⏰ CRON JOBS
<!-- AUDIT:CRON:START -->

All scheduled via APScheduler inside `server.py` lifespan. Timezone: IST unless noted.

| Job ID | Schedule | Function | Status Tracking |
|--------|---------|----------|-----------------|
| `celebration_reminders` | 9:00 AM IST daily | `check_upcoming_celebrations` | ⚠️ No status record |
| `abandoned_cart_check` | Every 30 min | `check_abandoned_carts` | ⚠️ No status record |
| `feedback_processor` | Every 15 min | `process_pending_feedback` | ⚠️ No status record |
| `daily_reports` | 8:00 AM IST | `process_daily_reports` | ⚠️ No status record |
| `escalation_check` | Every 15 min | `run_escalation_check` | ⚠️ No status record |
| `health_reminders` | 9:00 AM IST | `check_health_reminders` | ⚠️ No status record |
| `mira_nudges` | 10:00 AM IST | `process_mira_nudges` | ⚠️ No status record |
| `pet_wrapped_birthday` | 9:00 AM IST | `wrapped_birthday_check` | ⚠️ No status record |
| `pet_wrapped_annual` | Dec 10, 10 AM IST | `wrapped_annual_batch` | ⚠️ No status record |
| `daily_morning_digest` | 8:00 AM IST | `run_daily_digest` | ⚠️ No status record |
| `auto_db_re_export` | Every 6 hours | `auto_re_export_and_atlas_sync` | ⚠️ No status, **🔴 wipes Atlas** |
| `sitevault_daily` | 3:00 AM IST (not Mon) | `_sitevault_daily_wrapper` | 🔴 **STATUS BROKEN** (4/5 records no status) |
| `sitevault_weekly` | Mon 3:00 AM IST | `_sitevault_weekly_wrapper` | 🔴 Same issue |

### 🔴 Critical cron issue — Atlas Sync wipes destination

`auto_re_export_and_atlas_sync` at line 2180 in `server.py`:
```py
atlas_db_sync[coll_name].delete_many({})   # ← wipes Atlas
atlas_db_sync[coll_name].insert_many(docs, ordered=False)
```
If the local DB ever returns zero docs for a collection (transient issue, index corruption, etc.), the `insert_many` gets skipped (`if not docs: continue`) but `delete_many({})` has already wiped that collection in Atlas. **Atlas backup becomes unreliable as a true backup.**

<!-- AUDIT:CRON:END -->

---

## 6. 🤖 AI / CHATBOT CAPABILITIES
<!-- AUDIT:AI:START -->

### Mira (AI companion)
- **Intent detection**: `mira_intelligence.detect_multi_intent()` — extracts multiple intents per query
- **Semantic search**: `/api/mira/semantic-search` — breed-accurate, allergen-safe product/service results
- **Product scoring**: `mira_product_scores` (17,178 docs) — per-pet recommendation scores
- **Memory**: `mira_memories`, `mira_life_timeline_events`, `mira_sessions`, `mira_signals`
- **Voice**: ElevenLabs TTS (soft-wired)
- **Image imagines**: `mira_imagines_cache` → Cloudinary watercolours (42 pre-generated + on-demand for custom breeds — **this session**)
- **Briefings**: Daily/weekly personalised pet briefings

### Soul Intelligence (canonical answer system)
- **Canonical questions**: 70+ defined in `soul_intelligence.py` + `canonical_answers.py`
- **Soul answers**: stored per-pet as `doggy_soul_answers`
- **Soul score**: authoritative via `pet_score_logic.calculate_pet_soul_score()` (backend-only, Soul Bible §1)
- **Drip system**: Staggered question asking (favourite_treats, separation_anxiety, etc.)

<!-- AUDIT:AI:END -->

---

## 7. 🛠️ OPERATOR / ADMIN
<!-- AUDIT:ADMIN:START -->

### Admin Auth Layers
- **Primary**: `admin_auth.py` — `POST /api/admin/login` with email + password (bcrypt)
- **HTTP Basic fallback**: `admin_member_routes.py` → `verify_admin()` via `HTTPBasicCredentials`
- **ENV credentials**: `ADMIN_USERNAME` / `ADMIN_PASSWORD` / `ADMIN_EMAIL` in `.env`
- **Test credentials** (preview): `aditya` / `lola4304`

### Admin UI Pages (9 routes)
- `/admin` — dashboard
- `/admin/concierge` + `/admin/concierge-realtime` — Concierge inbox
- `/admin/mira-concierge` — Mira ticket queue
- `/admin/service-desk` — Zoho ticket mirror
- `/admin/services` — Services catalog CRUD
- `/admin/docs` — Internal documentation browser
- `/admin/forgot-password` + `/admin/reset-password` — admin account recovery

### Admin Capabilities
- Product/service/bundle CRUD with Cloudinary image uploads
- Master Sync (Shopify → products_master)
- Manual re-export triggers
- Admin-gated bulk operations (`/api/admin/cleanup-fake-services`, `/api/admin/sync-from-production`)
- Zoho token cache view
- SiteVault status (this session's fix surfaces it)

### Roles
- **Admin**: full access
- **Member**: own pets, own orders, own chats
- **Public**: health endpoints + inventory CSV + system overview + docs ZIP

<!-- AUDIT:ADMIN:END -->

---

## 8. 📚 MEMORY / DOCS
<!-- AUDIT:MEMORY:START -->

**Location**: `/app/memory/`
**Total files**: 335
**Key active files**:
- `PRD.md` — 34 KB (living PRD, updated every session)
- `CHANGELOG.md` — 10 KB (session-level changelog)
- `test_credentials.md` — 279 B (credentials for testing)
- `DOGGYCOMPANY_COMPLETE_ARCHITECTURE.md` — **this file** (new)
- `DOGGYCOMPANY_AGENT_CONTEXT.md` — short paste-able version (new)

**Legacy architecture docs** (pre-ScaleBoard pattern, not authoritative):
- `ARCHITECTURE.md`, `COMPLETE_SYSTEM_BIBLE.md`, `COMPLETE_SYSTEM_MAP.md`, `ADMIN_DOCUMENTATION.md`

> **Cleanup recommendation**: 335 files is unwieldy. Propose moving to `/app/memory/archive/` everything older than 30 days that isn't PRD/CHANGELOG/test_credentials.

<!-- AUDIT:MEMORY:END -->

---

## 9. 🔐 ENVIRONMENT VARIABLES
<!-- AUDIT:ENV:START -->

### Backend `.env` (71 variables)
```
# ── Core ──
MONGO_URL, DB_NAME, JWT_SECRET, CORS_ORIGINS, BUSINESS_NAME, SITE_URL
PRODUCTION_MONGO_URL   # Atlas cloud backup target

# ── Admin ──
ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_USERNAME, ADMIN_WHATSAPP_NUMBER

# ── AI ──
EMERGENT_LLM_KEY, CHATBASE_API_KEY, CHATBASE_CHATBOT_ID, ELEVENLABS_API_KEY
MIRA_STRUCTURED_ENGINE

# ── Cloudinary ──
CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, CLOUDINARY_CLOUD_NAME

# ── Payments ──
RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET

# ── Messaging ──
GUPSHUP_API_KEY, GUPSHUP_API_URL, GUPSHUP_APP_NAME, GUPSHUP_SOURCE_NUMBER
WHATSAPP_NUMBER, WHATSAPP_TEMPLATES_APPROVED, TEMPLATE_* (8 template IDs)
TEST_MOBILE_NUMBER

# ── Email ──
RESEND_API_KEY, SENDER_EMAIL, NOTIFICATION_EMAIL

# ── Zoho Desk ──
ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REFRESH_TOKEN, ZOHO_DC,
ZOHO_ORG_ID, ZOHO_DEPARTMENT_ID, ZOHO_ENABLED, ZOHO_WEBHOOK_TOKEN

# ── Google ──
GOOGLE_CALENDAR_API_KEY, GOOGLE_PLACES_API_KEY, GOOGLE_VISION_API_KEY
GOOGLE_SERVICE_ACCOUNT_FILE, GOOGLE_SERVICE_ACCOUNT_JSON, GDRIVE_TDC_FOLDER_ID
YOUTUBE_API_KEY

# ── Travel APIs ──
AMADEUS_API_KEY, AMADEUS_API_SECRET, VIATOR_API_KEY, EVENTBRITE_API_KEY,
EVENTBRITE_PRIVATE_TOKEN, FOURSQUARE_API_KEY, FOURSQUARE_LEGACY_API_KEY,
OPENWEATHER_API_KEY

# ── Amazon ──
AMAZON_AFFILIATE_TAG

# ── SiteVault ──
SITEVAULT_ENABLED, SITEVAULT_TZ, SITEVAULT_DAILY_RETENTION_DAYS,
SITEVAULT_WEEKLY_RETENTION_WEEKS, SITEVAULT_CLOUDINARY_BACKUP

# ── Crons / Ops ──
CRON_SECRET, ENABLE_HEALTH_CHECK, SHOPIFY_PRODUCTS_URL
```

### Frontend `.env` (3 variables)
```
REACT_APP_BACKEND_URL
REACT_APP_GOOGLE_PLACES_API_KEY
WDS_SOCKET_PORT
```

> **Production verification needed**: Confirm every required env var is set on production (`thedoggycompany.com`). Especially `PRODUCTION_MONGO_URL`, `EMERGENT_LLM_KEY`, Zoho tokens.

<!-- AUDIT:ENV:END -->

---

## 10. 🐛 KNOWN BUGS / GAPS
<!-- AUDIT:BUGS:START -->

### Live bugs (from PRD and audit)
| Bug | Priority | Status |
|-----|----------|--------|
| `sitevault_runs` missing status on crash | 🔴 HIGH | **Bug Class E — FIX NEEDED** |
| Atlas sync uses `delete_many({})` before insert | 🔴 HIGH | **Bug Class B variant — FIX NEEDED** |
| No CEO-only soft-delete / audit trail on financial data | 🟡 MEDIUM | **Bug Class A — FIX NEEDED (proactive)** |
| Bug #7 Location mismatch (advisory) | 🟡 | Not started |
| Bug #8 Duplicate pillars | 🟡 | Not started |
| Bug #11 Irrelevant Mira messages | 🟡 | Not started |
| Bug #14 Missing pet fields | 🟡 | Not started |

### Session-specific shipped fixes (this session)
- ✅ Custom-breed soul fallback (Fix 1+2+3)
- ✅ MiraImaginesBreed soul hydration (Path B)
- ✅ Watercolour on-demand generation for custom breeds
- ✅ Favourite-treat preference surfacing (backend + 6 frontend surfaces)
- ✅ Preference-editor chip (inline add-favourite)
- ✅ Bug #12 — dead dashboard links + duplicate /services route

<!-- AUDIT:BUGS:END -->

---

## 🎯 ScaleBoard Bug-Class Hunt — Findings

### Bug A — Silent deletes on financial data
**Status**: 🟢 **CLEAN** (proactive hardening recommended)
- No `@delete` endpoint exists on `orders`, `payments`, `refunds`, or `invoices`
- No code path calls `db.orders.delete_*`, `db.payments.delete_*`
- Only one financial-adjacent delete: `report_subscriptions.delete_one` (user-initiated email unsubscribe) — **legitimate**
- **Recommendation**: Proactively build the `<collection>_deleted` soft-delete pattern before any DELETE endpoint is ever added. Template it into a shared `soft_delete.py` helper.

### Bug B — Un-authenticated destructive endpoints
**Status**: 🟡 **2 MEDIUM-RISK ITEMS**

1. **`auto_re_export_and_atlas_sync` cron** at `server.py:2180`
   - `atlas_db_sync[coll_name].delete_many({})` runs every 6 hours
   - If local DB momentarily returns empty for any collection → Atlas gets wiped for that collection
   - **Fix**: Check `len(docs) > 0` BEFORE `delete_many`. Or switch to diff/upsert instead of wipe-and-insert.

2. **`team_members` / `featured_dogs` delete_many({})** at `server.py:20470-71`
   - Inside `seed_mystique_data()` (admin-callable)
   - Unconditional wipe before insert
   - **Fix**: Change to `update_one({id: x}, {$set: ...}, upsert=True)` per record.

> `@app.post("/api/admin/cleanup-fake-services")` at line 26117 is **auth-gated** via `Depends(verify_admin)` — safe.

### Bug C — Cross-entity data leaks
**Status**: 🟢 **N/A** (single-brand)
TDC is single-tenant. No division/outlet/brand multi-tenancy in the data model. "Bakery division" exists as a product tag only. If TDC adds a second brand (e.g., IAmBecause), implement the firewall pattern from ScaleBoard BEFORE integration.

### Bug D — Aggregator silently drops data
**Status**: 🟢 **NOT FOUND**
Pattern `if live_data_total > 0: ytd_revenue = live_data_total` and variants — zero matches across backend `.py` files.

### Bug E — Backup cron leaves `status: "running"` on crash
**Status**: 🔴 **CONFIRMED BROKEN**
- `sitevault_runs` has 5 records: **only 1 has a `status` field**
- 4 records from Apr 21–22 started but never wrote terminal status → crashed without try/finally
- The most recent run (Apr 23) has `status: "success"` — recent code is better (this session added try/finally in `sitevault_backup_jobs.py`) but prior runs remain untracked
- **Fix needed**:
  1. Add try/finally wrapper around EVERY cron body that writes a status record (currently 0/13 crons write running-state — that's OK since they don't claim `running`, but the 4 old sitevault records prove the system CAN end in an indeterminate state)
  2. Add a 15-min watchdog cron: for any `sitevault_runs` doc with `started_at > 30min ago` and no `status`, stamp `status: "failed", reason: "watchdog timeout"`
  3. Backfill the 4 orphan records with `status: "unknown_legacy_crash"`

### Bug F — No agent handoff single-source-of-truth
**Status**: 🟡 **PARTIALLY ADDRESSED**
- `/app/memory/PRD.md` exists and is diligently updated every session ✅
- `/app/memory/CHANGELOG.md` exists ✅
- **Gap**: No auto-refreshing architecture scanner. This doc (`DOGGYCOMPANY_COMPLETE_ARCHITECTURE.md`) was manually generated today.
- **Fix needed** (once approved): Port ScaleBoard's `architecture_auditor.py` service. Run on-demand (CEO dashboard button) + nightly cron. Emits diff vs last snapshot.

---

## 📋 Proposed Fix Bundle (for Phase 3 — AWAITING APPROVAL)

1. **SiteVault status hardening** — watchdog cron + backfill orphans + belt-and-suspenders try/finally
2. **Atlas sync safety** — empty-guard before `delete_many` + switch to diff-based sync
3. **Soft-delete scaffolding** — template `soft_delete.py` + `deleted_by_*` fields on a proactive basis
4. **Seeder idempotency** — team_members/featured_dogs use upsert instead of wipe+insert
5. **CEO Dashboard backup-health tile** — green/amber/red based on last successful SiteVault run (green <24h, amber 24-36h, red >36h)
6. **architecture_auditor.py** — nightly cron + manual trigger; updates this file's marker-bounded sections

**Deploy plan**: Stage ALL fixes on preview. Manual review checklist. Only then → Save to GitHub → Emergent Deploy.

---

## 🔒 Immutable Rules Ratified

- All financial DELETEs must be soft-delete + audit
- Cross-entity firewall at every write endpoint (applies when multi-brand is introduced)
- Every cron's finally block MUST set final status
- Architecture doc auto-refreshes nightly + manual trigger
- Preview MONGO_URL must be `localhost:27017/pet-os-live-test_database`. Production must use `PRODUCTION_MONGO_URL`.
- Never mix preview and production data.

---

## ✅ Pre-Deploy Verifications (from Playbook §6)

- **(a) Production MongoDB persistence**: ✅ Verified. `/data/db` is mounted on persistent NVMe volume. Empirically proven across prior deploys (deployed 8 fixes last session, DB survived).
- **(b) Seed.py destructive calls on startup**: 🟡 Partial risk. `master_sync_on_startup` is idempotent (only seeds when count=0). `seed_mystique_data` is admin-callable, not startup-auto. **BUT** `team_members` + `featured_dogs` use unconditional wipe inside seeder (fix planned).

---

**Document maintainer**: E1 · **Last audit**: Apr 23, 2026
**Next audit**: on-demand or after next deploy cycle

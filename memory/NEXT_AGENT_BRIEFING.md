# NEXT AGENT BRIEFING — The Doggy Company Pet Life OS
**Written by Agent (Session 86-87) — Mar 22, 2026**
**RESPOND IN ENGLISH**

---

## WHAT THIS APP IS

A **Pet Life OS** — 12 pillar pages (Care, Dine, Learn, Go, Play, Celebrate, Emergency, Farewell, Paperwork, Adopt, Shop, Services) where every user interaction creates an enriched ticket in the admin **Concierge® Service Desk**. Mira is the AI soul of the platform.

**Core vision**: Every intent → enriched ticket → admin sees parent name, pet's full health/soul intel → agent responds → WhatsApp to parent.

---

## WHAT THIS SESSION COMPLETED (DO NOT REDO)

### 0. Email + Pagination + WhatsApp Fixes (Mar 22, 2026 — final session)
- **Email on concierge reply FIXED**: `concierge_reply()` had dead code referencing undefined `ticket` variable — email was NEVER sent. Fixed: fetches `full_ticket` fresh → personalised HTML email via Resend from `woof@thedoggycompany.com` → "Hi Dipali, [concierge_name] replied about Mojo: [message] → View thread" 
- **Old dead email block removed** (lines 1559-1608 were orphaned purple-gradient email using undefined `ticket`)
- **Mira Picks pagination**: `GET /api/mira/picks/default/{petId}?limit=8&offset=0` now returns `{total, has_more, limit, offset, picks[]}`. Verified: page 1 (offset=0) returns 4/6, page 2 (offset=4) returns 2/6, has_more=False ✅

### 1. Universal Concierge Wiring — ALL 12 PILLARS (100%)
All 12 pillar pages are fully wired. Every interaction fires a ticket:
- `usePlatformTracking` → page visit ticket (all 12 pillars ✅)
- `PillarSoulProfile` → 3 concierge events per pillar (view, soul answer, Mira Imagines) ✅
- Soul Q answer handlers in local components (WellnessProfile/Care, SoulQuestionCardDine/Dine, LearnProfile/Learn) → `tdc.request` ✅
- Service/Book CTAs → `tdc.book` ✅
- NearMe → `tdc.nearme` ✅ (inc. PlaySoulPage handlePlayBook)
- Guided Paths → `tdc.request` ✅
- Emergency + Farewell modal `send()` → `tdc.urgent` / `tdc.request` ✅
- Audit table locked in `/app/complete-documentation.html`

### 2. Pet Health Vault — `/pet-vault/:petId` (COMPLETE)
- Full rebuild of `PetVault.jsx` (dark Care theme, 9 tabs)
- New sections: Allergies (priority 10 critical), Identity/Insurance, Documents
- Mira Alert Bar for upcoming vaccines
- Backend: `GET/POST /api/pet-vault/{petId}/allergies` endpoints
- Summary now includes `allergies`, `microchip`, `insurance`, `passport`
- **wiring**: every handler → `useConcierge.request/urgent` + `saveSoulAnswer`
- Care pillar Health Vault link card → `data-testid="care-health-vault-link"`

### 3. Intelligent Service Desk — COMPLETE
Every ticket now has:
- `member.name` / `member.email` / `member.phone` — **real parent identity** (was "Unknown")
- `mira_briefing` — full 6-section brief: HEALTH & SAFETY (vault allergies override soul), Active Meds, Vaccines, Primary Vet, Last Visit, DIET & DAILY LIFE, PILLAR INTEL (per-pillar soul answers), CONCIERGE GUIDANCE
- **MIRA'S INTEL ticker** (`/api/mira/personalization-stats/{petId}`) — vault allergies at priority 10, upcoming vaccines with urgency, meds, vet, weight
- `DoggyServiceDesk.fetchContext()` fixed — uses `ticket.pet_id` fallback + `ticket.member` direct use

### 4. Health Vault → Mira Intelligence Chain (COMPLETE)
| Vault action | Soul answer written | Chapter visible | Mira chat | Ticket briefing |
|---|---|---|---|---|
| Add allergy | `food_allergies` | Health + Nutrition ✅ | vault overrides soul ✅ | priority 10 ✅ |
| Add vaccine | `vaccinated = yes` | Health ✅ | vaccine count ✅ | upcoming ✅ |
| Add vet | `has_regular_vet = yes` | Health ✅ | primary vet ✅ | vet line ✅ |
| Medication | — | — | active meds ✅ | meds ✅ |
| Vet visit | — | — | last visit ✅ | last visit ✅ |
| Weight | — | — | current kg ✅ | weight line ✅ |

### 5. WhatsApp — COMPLETE (two-way via Gupshup)
- **Outbound reply** (admin → parent): `concierge_reply()` personalised: "Hi Dipali 🐾 Mira here…"
- **TicketFullPageModal**: WhatsApp button green glow, real WA SVG icon, pulsing dot when phone available, recipient preview "→ Dipali (2582)"
- **Inbound webhook** (`POST /api/whatsapp/webhook`): Gupshup inbound → finds open ticket by member phone → adds message to `service_desk_tickets.conversation` → admin bell notif (`💬 WhatsApp reply from Dipali`)
- **Webhook verified**: TDB-2026-0578 received "Hi! Is Mojo's appointment confirmed for tomorrow?" ✅

### 6. Health Reminder Scheduler — ALIGNED
- Daily 9 AM IST via `check_health_reminders()`
- Now: parent name personalised, WhatsApp via Gupshup (not disconnected WHATSAPP_API_URL), email CTA → `/pet-vault/{petId}` not `/my-pets`
- Verified `GET/POST /api/admin/pet-vault/health-reminders/check` ✅

### 7. Master Sync — RE-ENABLED
`_delayed_master_sync()` runs 60s after server startup (safe — all async MongoDB + static image ops, NO LLM calls).

---

## PENDING TASKS (DO THESE NEXT)

### 🔴 P0 — DB Pillar Name Migration
**What**: DB uses old pillar names (`adventure`, `food`, `memory`). Frontend routes use new names (`go`, `dine`, `farewell`).
**Fix**: MongoDB migration script to rename pillar values in `service_desk_tickets`, `mira_conversations`, `pets.doggy_soul_answers` where pillar = 'adventure' → 'go', 'food' → 'dine', 'memory' → 'farewell'.
**BLOCKER**: User needs to confirm DB backup taken first. DO NOT run without confirmation.
**Test**: `GET /api/care` → pillar soul profile loads, `/go` → NearMe and products load with correct pillar.

### 🟠 P1 — AI Soul Products Integration into Product Box
**What**: 3,000+ Cloudinary mockups exist (breed-specific soul product images). Need to link them to pillar product catalogs in `products_master`.
**Where**: `server.py` has `update_pillar_product_images()` function that was previously blocked by the disabled startup sync.
**Status**: Now that master sync is re-enabled, the product images should auto-populate on next restart.
**Test**: Visit `/shop` → product cards should show breed-specific AI mockup images.

### 🟠 P1 — Inbox UI Cleanup (MyRequestsPage.jsx) — NEXT PRIORITY
**What user wants**: The `/my-requests` inbox is hard to read. Only active tickets should show prominently, rest collapsed. Colours easier on the eye (like the Care page warm cream theme, not dark purple gradient).
**Screenshot provided**: User shared image showing left panel with multiple dark gray/purple tickets — "Mojo's Celebration", "Food Switch Plan" etc. — all look the same, no visual hierarchy.
**File**: `/app/frontend/src/pages/MyRequestsPage.jsx` (find the ticket list component)
**Changes needed**:
  1. Group tickets: `open/urgent` shown expanded with full info, `resolved/closed` collapsed into a small summary row below a "Past requests" divider
  2. Active ticket cards: warm cream background (`#F5F0E8`), green left border for open, red for urgent, gray for waiting
  3. Remove the purple/dark gradient completely — use clean white cards with subtle shadow
  4. Add ticket count badges: "3 active · 12 resolved"
  5. Ticket card should show: pet name + emoji, pillar tag (colored pill), last message preview, time since last update
  6. On mobile: full-width cards, swipe to archive
**Design reference**: Match the `/care` pillar's warm cream aesthetic. NOT the dark OS aesthetic.

### 🟠 P1 — AI Soul Products Investigation + Fix
**What**: 5,131 products in `products_master` but ZERO have `cloudinary_url` or `ai_image_url`. Master sync is running but NOT populating images.
**Root cause to investigate**: 
  - Check `update_pillar_product_images()` in `server.py` — what does it actually do? Does it generate images or just assign existing Cloudinary URLs?
  - Check if Cloudinary URLs exist elsewhere (separate collection? `soul_products`? `breed_products`?)
  - `grep -rn "cloudinary\|CLOUDINARY\|cloudinary_url" /app/backend --include="*.py" | grep "insert\|update\|upload"` — find where images are stored
  - Check `db.soul_products`, `db.mira_products`, `db.breed_products` collections
**Fix**: Once you find where the 3,000+ mockups are stored, link them to `products_master` records by breed + pillar. Add `cloudinary_url` field to each product.
**Test**: Visit `/shop` or `/care` → product cards show breed-specific images instead of placeholder.



### 🟡 P2 — Two-way WhatsApp — "BOOK" keyword handler
**What**: When Dipali replies "BOOK" to a vaccine reminder WhatsApp, auto-create a vet booking ticket.
**Where**: `whatsapp_routes.py` `process_gupshup_webhook()` — add keyword detection after content extraction.
**Logic**: `if content.strip().upper() == "BOOK": fire tdc.book(...)` → creates urgent booking ticket.

### 🟡 P2 — Medication Refill Reminders
**What**: Extend `check_health_reminders()` to also check medications with `end_date` in 3 or 7 days.
**File**: `/app/backend/pet_vault_routes.py` — add second loop after vaccine loop.

### 🟡 P2 — Love Pillar (post-launch)
New pillar page. Follows exact same structure as all other 12 pillars.

### 🟡 P2 — MiraDemoPage.jsx Refactor  
5,400+ lines — split into components. High risk — do last.

---

## ARCHITECTURE YOU MUST NEVER BREAK

### The 5 Sacred Files
1. `/app/frontend/src/components/PillarSoulProfile.jsx` — THE unified soul profile. 3 sections. DO NOT add a 4th section without updating docs.
2. `/app/frontend/src/hooks/useConcierge.js` — THE canonical intent router. Every user intent goes here.
3. `/app/frontend/src/utils/tdc_intent.js` — Stateless version of useConcierge for non-hook contexts.
4. `/app/backend/mira_service_desk.py` — `generate_mira_briefing()` + `attach_or_create_ticket`. Briefing uses `pet.vault` + `pet.doggy_soul_answers`. NEVER remove vault section.
5. `/app/backend/whatsapp_routes.py` — `process_gupshup_webhook()` now updates BOTH `db.tickets` AND `db.service_desk_tickets`. Do not remove the service_desk part.

### Canonical Pillar Slugs (12 active)
`care`, `dine`, `learn`, `go`, `play`, `celebrate`, `emergency`, `farewell`, `paperwork`, `adopt`, `shop`, `services`

**DEPRECATED (remove if you see them)**: `advisory`, `travel`, `stay`, `enjoy`, `fit`

### Soul Key Rule
ALWAYS use `doggy_soul_answers` DB keys (e.g., `age_stage`, `food_allergies`, `vaccinated`). NEVER use UI-abstraction keys.

### Vault Allergy Key
`vault.allergies` overrides `doggy_soul_answers.food_allergies` in all Mira contexts. Vault = vet-confirmed. Never downgrade.

### MongoDB Key
Use `MONGO_URL` from `/app/backend/.env`. DB name from `DB_NAME`. Never hardcode.

---

## TEST CREDENTIALS
- User: `dipali@clubconcierge.in` / `test123`
- Admin: `aditya` / `lola4304` at `/admin`
- Preview URL: `https://pet-wrapped-1.preview.emergentagent.com`

---

## KNOWN ISSUES / WATCH OUT

1. **Meilisearch always warns** `unavailable` on startup — this is non-blocking, ignore it.
2. **Master sync 60s delay** — products/images may not be ready immediately after restart. Wait 90s before testing product pages.
3. **Mojo has 100% soul score** — can't test soul answer submission with this pet. Use a different test pet or create a new one with 0% soul score.
4. **Old tickets (before Mar 22, 2026)** show "Unknown" in CONTACT INFO — this is expected. Only new tickets get the `member` object. Do not backfill old tickets unless specifically asked.
5. **`test` allergies in Mojo's vault** — we cleaned up test entries. Mojo now has exactly 2 allergies: Chicken (severe) + Beef (moderate).

---

## GUPSHUP WHATSAPP CONFIG
- API Key: in `/app/backend/.env` as `GUPSHUP_API_KEY`
- Source number: `WHATSAPP_NUMBER` (918971702582)
- Inbound webhook URL (register in Gupshup dashboard): `POST https://pet-wrapped-1.preview.emergentagent.com/api/whatsapp/webhook`
- Provider: `send_whatsapp_message()` in `whatsapp_notifications.py` — handles formatting + retry

---

## KEY API ENDPOINTS (verified working Mar 22, 2026)
```
POST /api/service_desk/attach_or_create_ticket   — creates enriched ticket (member + vault + pillar briefing)
GET  /api/mira/personalization-stats/{petId}      — MIRA'S INTEL ticker (includes vault at priority 10)
GET  /api/pet-vault/{petId}/summary               — vault summary (inc. allergies, microchip, insurance)
GET  /api/pet-vault/{petId}/allergies             — vault allergies
POST /api/pet-vault/{petId}/allergies             — add allergy (also updates doggy_soul_answers.food_allergies)
POST /api/whatsapp/webhook                        — Gupshup inbound (bidirectional)
POST /api/admin/pet-vault/health-reminders/check  — manual trigger for vaccine reminder scan
GET  /api/pet-soul/profile/{petId}/quick-questions?limit=4&context={pillar} — unanswered pillar questions
```

---

## LAST TEST REPORTS
- iteration_182.json — PillarSoulProfile unification
- iteration_183.json — Universal concierge audit (94% → 100%)
- iteration_184.json — Pet Health Vault (95% → fixes applied)
- iteration_185.json — Intelligent Service Desk (100% backend + frontend)

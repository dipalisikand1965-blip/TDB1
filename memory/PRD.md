# The Doggy Company — Product Requirements Document
## Last Updated: 2026-03-26 (Session 9 — Pawrent Journey + JSX Fixes + Services Copy)
## DEPLOYMENT: Upcoming (Atlas IP whitelist still blocked)

---

## 1. PRODUCT VISION

**The Doggy Company** is a Pet Life OS — a full-stack, AI-driven platform that treats dogs as souls, not pets. It is structured around 12 pillar pages, each serving a different dimension of a dog's life: Dine, Care, Go, Play, Learn, Celebrate, Shop, Services, Adopt, Farewell, Emergency, Paperwork.

The platform's core promise: **Mira**, an AI concierge, knows your dog's soul — breed, allergies, temperament, life stage — and personalises every product, service, and recommendation accordingly.

---

## 2. USERS

- **Pet Parents** — primary users; authenticated members with pets
- **Admin (Aditya)** — platform admin, manages products, services, orders, members
- **Concierge** — receives and fulfils service booking tickets
- **Guests** — landing page, membership page, auth pages

**Test Credentials:**
- User: `dipali@clubconcierge.in` / `test123`
- Admin: `aditya` / `lola4304` at `/admin`

---

## 3. TECH STACK

| Layer | Technology |
|---|---|
| Frontend | React 18, Tailwind CSS, Shadcn/UI, Framer Motion |
| Backend | FastAPI (Python), MongoDB, Motor (async) |
| AI | Mira — custom concierge logic + OpenAI/Gemini via Emergent Key |
| Notifications | Gupshup WhatsApp, email |
| Storage | Cloudinary (images), MongoDB GridFS |
| Auth | JWT (custom) + Emergent Google OAuth |
| Build | CRACO, `GENERATE_SOURCEMAP=false NODE_OPTIONS=--max-old-space-size=4096` |

**Service Ports:** Backend: 8001, Frontend: 3000 (supervisor-managed)
**Preview URL:** `https://pet-soul-ranking.preview.emergentagent.com`

---

## 4. CODE ARCHITECTURE

### Responsive Split Pattern (ALL 12 pillars)
```
PillarSoulPage.jsx (parent)
  ├── isDesktop check → window.innerWidth >= 1024
  ├── Desktop (>= 1024px) → renders original SoulPage JSX (LOCKED — never touch)
  └── Mobile (< 1024px)  → renders *MobilePage.jsx component
```

### Key Files
| File | Purpose | Status |
|---|---|---|
| `frontend/src/pages/*SoulPage.jsx` | Desktop pillar pages | 🔒 LOCKED |
| `frontend/src/pages/*MobilePage.jsx` | Mobile pillar pages | ✅ All 12 done |
| `frontend/src/hooks/useMiraFilter.js` | AI product ranking | ✅ Breed/size/life-stage |
| `frontend/src/components/admin/PillarManager.jsx` | Go+Play admin base | ✅ 7 tabs + Quick Add |
| `frontend/src/components/admin/UnifiedProductBox.jsx` | Product CRUD | ✅ Save fix applied |
| `frontend/src/components/admin/PillarProductsTab.jsx` | Products tab | ✅ 20/page + createTrigger |
| `frontend/src/components/admin/PillarServicesTab.jsx` | Services tab | ✅ Add Service modal |
| `frontend/src/components/admin/PillarBundlesTab.jsx` | Bundles tab | ✅ createTrigger prop |
| `backend/server.py` | Main monolith | ⚠️ 24,000+ lines — NEVER modify directly |
| `backend/unified_product_box.py` | Product routes | ✅ |
| `backend/service_box_routes.py` | Service routes | ✅ |
| `backend/mira_service_desk.py` | Tickets + Mira | ✅ |

---

## 5. 12 PILLARS

| Pillar ID | Name | Mobile | Desktop | Admin Manager | Status |
|---|---|---|---|---|---|
| celebrate | Celebrate | ✅ | ✅ LOCKED | CelebrateManager | ✅ |
| dine | Dine | ✅ | ✅ LOCKED | DineManager | ✅ |
| go | Go | ✅ | ✅ LOCKED | GoManager (PillarManager) | ✅ |
| care | Care | ✅ | ✅ LOCKED | CareManager | ✅ |
| play | Play | ✅ | ✅ LOCKED | PlayManager (PillarManager) | ✅ |
| learn | Learn | ✅ | ✅ LOCKED | LearnManager | ✅ |
| paperwork | Paperwork | ✅ | ✅ LOCKED | PaperworkManager | ✅ |
| emergency | Emergency | ✅ | ✅ LOCKED | EmergencyManager | ✅ |
| farewell | Farewell | ✅ | ✅ LOCKED | FarewellManager | ✅ |
| adopt | Adopt | ✅ | ✅ LOCKED | AdoptManager | ✅ |
| shop | Shop | ✅ | ✅ LOCKED | ShopManager | ✅ |
| services | Services | ✅ | ✅ LOCKED | ServiceBox | ✅ |

---

## 6. DATABASE STATE (2026-03-25)

| Collection | Count | Notes |
|---|---|---|
| products_master | 6,042 | 457 soul_made, 5,585 regular |
| services_master | 1,021 | All 12 pillars mapped |
| breed_products | 3,448 | Soul catalog — needs "Add to catalog" for pillar pages |
| bundles_master | 20+ | Care and others |
| service_desk_tickets | many | Mira service requests per pillar |
| services (old) | 46 | Pre-migration, OLD names — import PENDING user confirmation |
| service_catalog (old) | 97 | Pre-migration, OLD names — import PENDING user confirmation |

---

## 7. ADMIN PANEL ARCHITECTURE (Session 4 Fixes)

### Standard 7-Tab Structure (All 12 Pillar Managers)
1. **Requests** — Live `service_desk_tickets` filtered by pillar
2. **Partners** — Placeholder (coming soon)
3. **Products** — `PillarProductsTab` → 20/page pagination, createTrigger prop
4. **Services** — `PillarServicesTab` → inline Add Service modal, createTrigger prop
5. **Bundles** — `PillarBundlesTab` → createTrigger prop
6. **Tips** — Placeholder (coming soon)
7. **Settings** — Pillar metadata

### Quick Add Dropdown (PillarManager — Go + Play)
- Purple button in manager header
- "Quick Add" → "+ Add Product" / "+ Add Service" / "+ Add Bundle"
- Switches tab AND triggers create modal simultaneously

### ProductBoxEditor Save Fix
Previously missing from `allowedFields` (now fixed):
- `pillar` — primary pillar
- `approval_status` — Status in Pillar
- `commerce_ops` — pricing, margin, approval  
- `basics` — nested product metadata
- `pillars_occasions` — secondary pillars + occasions
- `breed`, `life_stage`, `pet_size` — Mira AI filtering
- `sub_category`, `allergens`, `soul_tier`

---

## 8. MIRA AI

### useMiraFilter.js
- **Allergy blocking**: Products with allergens matching pet's allergies are deprioritized
- **Breed matching**: +2 miraRank for breed-tagged products
- **Size matching**: +1 for correct size category
- **Life-stage matching**: +1 for puppy/adult/senior
- **Favorite foods**: Matched against ALLERGEN_MAP synonyms

### Mira "Explains Why" (User-approved — NOT YET BUILT)
One-tap expandable row on Dine/Care/Celebrate product cards showing full soul profile reasoning.

---

## SESSION 14 — (2026-03-26) Mobile Text Fix + Rich Order Email + Admin Notifications + Notification History

### Critical Fix: Mobile Page Text Rendering (ALL 11 pages)
1. ✅ Root cause: Every mobile pillar page had CTA cards with `color:'#fff'` text on very light transparent backgrounds (10-16% opacity) outside the dark hero section. On the white `mobile-page-container` background, these were completely invisible/unreadable.
2. ✅ Fixed: AdoptMobilePage, GoMobilePage, CareMobilePage, PlayMobilePage, LearnMobilePage, EmergencyMobilePage, FarewellMobilePage, PaperworkMobilePage, ShopMobilePage → all CTA card text changed to `#1A0A2E` (dark) + `#4B5563` (gray), border opacity increased for visibility
3. ✅ Fixed: CelebrateMobilePage tab bar — "Celebrate | Near Me" tabs changed from `rgba(255,255,255,0.5)` (invisible on white) to `#6B7280` (readable)

### Rich Order Confirmation Email
4. ✅ Updated `send_order_confirmed_email` in `services/email_service.py` with full branded template:
   - Itemized product list with prices
   - GST breakdown (subtotal + tax + shipping + total)
   - Download Invoice PDF button
   - "What happens next" with Concierge promises
   - From: `orders@thedoggycompany.com`, Reply-to: `concierge@thedoggycompany.com`
   - `_send()` function updated to accept custom from_email and reply_to

### Admin New Member Notifications
5. ✅ `GET /api/admin/recent-signups?since_minutes=X` endpoint added to server.py
6. ✅ Admin.jsx: polls every 60 seconds, shows purple/pink gradient banner + toast when new members join
7. ✅ State: `newMemberAlerts[]`, dismissible banner with member name

### Notification History Tab in Inbox
8. ✅ `GET /api/member/comm-history` endpoint added — merges whatsapp_logs + email_logs by user email/phone
9. ✅ NotificationsInbox.jsx: Added "Messages | Notifications" tab bar; Notifications tab renders comm history cards with type (WhatsApp/Email), status (delivered/failed), template name, timestamp
10. ✅ Added `Bell` icon import to NotificationsInbox

---

### WhatsApp Service (8 templates, freeform fallback)
1. ✅ `/app/backend/services/whatsapp_service.py` — Central WA dispatcher with 8 template functions:
   - `send_welcome_member` → triggered on new user signup (auth_routes.py)
   - `send_order_confirmed` → triggered on Razorpay payment success (server.py)
   - `send_concierge_request` → triggered on attach_or_create_ticket (mira_service_desk.py)
   - `send_daily_digest` → triggered by daily 8am cron (scheduled_automations.py)
   - `send_birthday_reminder` → triggered 7 days before birthday cron
   - `send_birthday_today` → triggered day-of birthday cron
   - `send_medication_reminder` → triggered daily medication cron
   - `send_pawrent_welcome` → triggered when new pet age < 6 months (server.py)
2. ✅ Template toggle: `WHATSAPP_TEMPLATES_APPROVED=false` in .env → set to `true` when Gupshup approves
3. ✅ Idempotency: every send keyed by event (order_id/ticket_id/user_id/date) → whatsapp_logs MongoDB
4. ✅ Confirmed working: WA freeform sends to 9739908844 in testing

### Email Service (5 templates via Resend)
5. ✅ `/app/backend/services/email_service.py` — 5 branded HTML email templates:
   - Welcome (dark purple #1A0A2E, gold #D4A840, cream #FDF6EE)
   - Order Confirmed
   - Concierge Request
   - Birthday Reminder
   - Soul Profile Complete
6. ✅ All 5 emails wired to their triggers
7. ✅ Idempotency via email_logs MongoDB collection
8. ✅ Confirmed working: emails sent to dipali@clubconcierge.in in testing

### Bug Fixes
9. ✅ Pet flickering in MiraOSPage — `loadUserPets()` now called on mount (was showing demo Buddy/Luna)
10. ✅ TODAY tab proactive alerts — URL fixed from `/api/mira/proactive/{id}` to `/api/mira/proactive/alerts/{id}`
11. ✅ attach_or_create_ticket 500 error — null-safe access for `request.initial_message.text`

### DB Backfill Status
12. ✅ COMPLETE — 5426 products updated with size_tags, life_stages, mira_can_suggest. Zero errors.

---

## CRITICAL RULE 14 (SESSION 13):
**WHATSAPP_TEMPLATES_APPROVED=false** → All WA sends use freeform session messages.
Set to `true` after Gupshup approves templates: tdc_welcome_member, tdc_order_confirmed, tdc_concierge_request, tdc_daily_digest, tdc_birthday_reminder, tdc_birthday_today, tdc_medication_reminder, tdc_pawrent_welcome

## 9. PENDING TASKS (Priority for next session)

### P0 — Next Session
1. Add Mira's Memory card to MiraOS dashboard (Overview/Mojo tab)
2. Generate Full Migration Package Report (no code changes, just text report)

### P1 — Post-notification
1. Watch & Learn YouTube sections (Care + Go)
2. Add LearnNearMe, PaperworkNearMe, GoNearMe components to mobile pages

### P2 — Future
1. Production DB (Atlas IP whitelist)
2. Refactor Admin.jsx (7k lines)
3. Refactor server.py (24k lines)
4. Build Love pillar

---

## 10. COMPLETED IN SESSION 8 (2026-03-26)
1. ✅ Audit 1 (Dashboard) + Audit 2 (Communications) delivered to user
2. ✅ Fix a: Mira Notifications datetime bug resolved — now returns success:True with 20 notifications
3. ✅ Fix b: Paw Points Leaderboard endpoint added (`/api/paw-points/leaderboard`)
4. ✅ Fix c: Badges endpoint added (`/api/paw-points/my-badges`) — returns 6 earned badges
5. ✅ Fix d: WhatsApp Daily Digest — sends to 14/15 members via Gupshup
6. ✅ Fix e: Birthday Reminders — 7-day + day-of triggers via WhatsApp + Resend
7. ✅ Fix f: Medication Reminders — daily WhatsApp if meds logged in vault
8. ✅ Dashboard Fix 1: Tier mismatch resolved — Gold Crown shows for 2583 pts (threshold 1500)
9. ✅ Dashboard Fix 2: Badges section added below Pet Life Pass card
10. ✅ Dashboard Fix 3: Notification bell fixed to use correct API endpoint
11. ✅ Dashboard Fix 4: Full card view improved with QR code + tier progress bar
12. ✅ Care Mobile Fix 1: Health Vault tab added (4th tab with vaccines, meds, allergies, vet visits)
13. ✅ Care Mobile Fix 2: Grooming Profile card added
14. ✅ Care Mobile Fix 3: "Get Care Plan" opens Mira Imagines modal with 4 personalised cards
15. ✅ Admin automation trigger endpoints added (`/api/admin/automations/*`)

---

## 11. CRITICAL RULES (NEXT AGENT MUST READ)

1. **Desktop `*SoulPage.jsx` files are STRICTLY LOCKED** — never modify them
2. **Never modify server.py directly** — only add new route files
3. **PyMongo**: NEVER `if collection:` → always `if collection is not None:`
4. **MongoDB ObjectId**: Always exclude `_id` from responses
5. **AI Image Auth**: Pass `adminAuth` header, use `credentials: 'omit'`
6. **Soul Products**: `breed_products` → must be "Added to catalog" to appear on pillar pages
7. **Pillar IDs**: Use canonical lowercase IDs (celebrate, dine, go, care, play, learn, paperwork, emergency, farewell, adopt, shop, services)
8. **Hot Reload**: Only restart supervisor for .env changes or new packages
9. **Install packages**: Use `yarn add` for frontend, `pip install && pip freeze > requirements.txt` for backend


---

## 12. COMPLETED IN SESSION 9 (2026-03-26)
1. ✅ JSX bug fix: GoMobilePage.jsx and PlayMobilePage.jsx — unclosed `<>` fragment crash fixed
2. ✅ Services mobile copy: "Explore all X via Concierge®" button text, fixed white-on-white text bug
3. ✅ The Pawrent Journey — full implementation from user's JSX file:
   - /app/frontend/src/components/pawrent/PawrentJourney.jsx (main component, fixed hooks)
   - /app/frontend/src/pages/PawrentJourneyPage.jsx (route wrapper)
   - Route /pawrent-journey added to App.js
   - PawrentJourneyCard on PetHomePage dashboard (below "See Picks" button)
   - PawrentFirstStepsTab on Care, Go, Play, Celebrate mobile pages
   - "Pawrent Journey" in MobileMenu (after Pet Life Pass)
   - Backend via separate pawrent_journey_router: POST /api/pawrent-journey/complete-step + GET /api/pawrent-journey/progress/{pet_id}

## CRITICAL RULE 10 (SESSION 9 DISCOVERY):
**server.py has app.include_router(api_router) at line ~21921.** ANY @api_router routes added AFTER that line silently return 404. ALWAYS create a new router file or use separate include_router call at END of server.py.

## SESSION 9 — ADDENDUM (Breed Filter + Streak)
1. ✅ filterBreedProducts v2 in useMiraFilter.js — checks breed_tags field first, then falls back to name-based check
2. ✅ applyMiraFilter Step 1b — filters out breed-specific products that don't match the pet
3. ✅ mira_hint fixed — wrong-breed products now show "For specific breeds" instead of "Chosen for X by Mira"

## SESSION 10 — (2026-03-26) Celebrate Parity + Mira Explains Why + Concierge + Automations
1. ✅ Step 3: Side menu already correct (Ask Mira = widget, Pet Soul → /my-pets)
2. ✅ Step 4: Celebrate mobile parity — BirthdayCountdown, CelebrationMemoryWall, MiraSoulNudge added
3. ✅ Step 5: "Mira explains why" expandable row on ALL ProductCard instances (✦ MIRA'S PICK → one-tap expansion)
4. ✅ Mira OS: Added freeform "Send to Concierge®" text area + 4 quick-action preset buttons
5. ✅ Mira OS: Route /mira-os now points to MiraOSPage (was MiraDemoPage); classic at /mira-os-classic
6. ✅ Dashboard automation toggles: WhatsApp Daily Digest, Birthday, Medication toggles in OverviewTab
7. ✅ Birthday Builder: Featured breed cake row at top of Cakes tab + AllBreedCakesSection at bottom
8. ✅ WhatsApp test message sent to +91 97399 08844 (status 202 = delivered)

4. ✅ 14 pages updated — all local copies of filterBreedProducts replaced with import from useMiraFilter.js
5. ✅ ShopSoulPage.jsx — added missing filterBreedProducts import (pre-existing bug, picks were silently failing)
6. ✅ Streak counter — backend tracks streak_days in pawrent_journey_progress, PawrentJourneyCard shows 🔥 Xd streak badge

## SESSION 12 — (2026-03-26) Mira Intelligence Expansion + Persistent Memory

### Mira Intelligence Fixes (Fix 1-3)
1. ✅ GoSoulPage.jsx + PlaySoulPage.jsx — replaced old `applyMiraIntelligence` with `filterBreedProducts + applyMiraFilter` v2 (breed + allergen + size + life stage). Desktop Go and Play now fully Mira-intelligent.
2. ✅ ShopMobilePage.jsx — added `applyMiraFilter` ranking pass (was only `filterBreedProducts`). Now full v2 pipeline.
3. ✅ CartSidebar.jsx + Checkout.jsx — replaced basic string-match allergen/breed filter with full v2 `applyMiraFilter + filterBreedProducts`. "Mira Also Recommends" now shows breed-safe, allergen-filtered products.

### DB Backfill (Fix 4)
4. 🔄 `/app/backend/scripts/backfill_mira_fields.py` — AI-powered script backfills `size_tags`, `life_stages`, `mira_can_suggest: True` on all 5,426 products in `products_master`. Runs rule-based first, then Claude for ambiguous products. Running in background.

### Mira Persistent Memory (Fix 5)
5. ✅ `/app/backend/mira_memory_routes.py` — New endpoints:
   - `GET /api/mira/memory/{pet_id}` — fetch last N messages + preferences + service interests
   - `POST /api/mira/memory/save` — append messages (capped at 100, $slice)
   - `POST /api/mira/memory/log-concierge-request` — log Concierge request to memory
   - `DELETE /api/mira/memory/{pet_id}` — clear history
6. ✅ `MiraChatWidget.jsx` — fetches persistent memory on widget open, saves after each exchange. Pillar switches add "Now on [Pillar]" marker pill instead of clearing messages.
7. ✅ `mira_routes.py MiraChatRequest` — added `persistent_preferences` + `persistent_service_interests` fields; system prompt injected with cross-session memory context.

### Multiple Pillar Intent Detection
8. ✅ `concierge_intent_routes.py` — upgraded to return `pillars[]` array (up to 3) sorted by confidence. "Birthday walk AND grooming" → [{celebrate, 85%}, {care, 85%}]
9. ✅ `MiraOSPage.jsx` Concierge tab — shows stacked pillar chips, each showing emoji + service + pillar + confidence%. Send button passes `detected_pillars[]` to ticket.

### Mira OS Route Restored
10. ✅ `App.js` — `/mira-os` → `MiraDemoPage` (original). `/mira-os-shell` → `MiraOSPage` (experimental).

## CRITICAL RULE 12 (SESSION 12 DISCOVERY):
**PyMongo Database objects throw `NotImplementedError` on truthiness checks** (`if db:` or `db or fallback`). ALWAYS use `if db is None:` and `db_a if db_a is not None else db_b`.

## CRITICAL RULE 13 (SESSION 12):
**DineSoulPage.jsx mobile section uses `applyMiraIntelligence` (OLD, no breed awareness)**. Now FIXED — uses `filterBreedProducts + applyMiraFilter`. GoSoulPage.jsx and PlaySoulPage.jsx also FIXED.
1. ✅ Fix 1: BirthdayBoxBrowseDrawer.jsx — removed no-breed fallback; added filterBreedProducts to masterProducts before merge. Akita products no longer appear for Indie dog.
2. ✅ Fix 2: useMiraFilter.js — Breed synonym mapping expanded (siberian husky→husky, yorkshire terrier→yorkshire, saint bernard, jack russell, cavalier king charles). Added UNIVERSAL_FALLBACK_BREEDS set (vizsla, weimaraner, scottish terrier, etc.) — show all products for unsupported breeds.
3. ✅ Fix 3: DineSoulPage.jsx — Inline DineMobilePage now uses filterBreedProducts + applyMiraFilter from useMiraFilter.js (replaced old applyMiraIntelligence that had zero breed awareness). 0 Akita mentions verified.
4. ✅ Fix 4: AI Intent Detection on Concierge textarea — Backend: /api/mira/detect-intent endpoint using Claude claude-4-sonnet-20250514 via Emergent LLM key. Frontend: 1-second debounce in MiraOSPage.jsx Concierge tab shows '🛁 This sounds like Spa Grooming → Care' suggestion chip. User can tap to confirm (pre-fills pillar in ticket) or dismiss.

## CRITICAL RULE 11 (SESSION 11 DISCOVERY):
**DineSoulPage.jsx contains an inline DineMobilePage function** (all other pillars have separate *MobilePage.jsx files). Any changes to Dine mobile must edit DineSoulPage.jsx lines 767+. The desktop path (DineSoulPageDesktopLegacy) is strictly locked.


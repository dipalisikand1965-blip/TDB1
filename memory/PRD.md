# The Doggy Company — Product Requirements Document
## Last Updated: 2026-04-04 (Session 50 — MiraPicksSection service modal fix: Learn, Care, Go, Play + Paperwork dedup)

## IRON RULE #1: NO STOCK PHOTOS
- **NEVER** use Unsplash, Pexels, Picsum, Lorem Picsum, or any stock photo service
- Pet photos → `pet.photo_url` from DB
- Product images → `cloudinary_url || mockup_url || image_url` from DB
- Hero/banner images → TDC branded CSS gradients (`#1A0A2E`, `#2D1B69`, gold `#D4A840`)
- Empty states → gradient cards with emoji + pillar accent color

## IRON RULE #2: MASTER TICKET STANDARD (Every ticket. Every time. Forever.)
- **ALL** `attach_or_create_ticket` calls MUST use `buildMasterBriefing()` from `/app/frontend/src/utils/masterBriefing.js`
- The canonical chain: `bookViaConcierge()` in `MiraCardActions.js` → uses `buildMasterBriefing` → sends full briefing
- Components that do direct fetch MUST import `buildMasterBriefing` and `buildMasterMetadata` from `masterBriefing.js`
- Photo URLs in `details.photo_url` MUST appear in BOTH the REQUEST section AND the ACTION REQUIRED section
- Admin views (TicketThread.jsx, ServiceDeskWorkspace.jsx) render photo URLs as `<img>` tags automatically
- **LOCKED**: SoulPage desktop files are exempt — do NOT modify them

## IRON RULE #3: TICKET PHOTO RENDERING
- Wherever ticket message text is rendered in admin or service desk — if text contains a Cloudinary URL or URL ending in .jpg/.png/.webp — render it as `<img>` tag
- Implemented in: `TicketThread.jsx` (member) and `ServiceDeskWorkspace.jsx` (admin)
- `TicketFullPageModal.jsx` already had this before Session 35

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
| `frontend/src/components/PillarHero.jsx` | Unified mobile hero (pet avatar, soul ring, pet switcher) | ✅ Wired to all 12 mobile pages |
| `frontend/src/hooks/useMiraFilter.js` | AI product ranking | ✅ Breed/size/life-stage |
| `frontend/src/components/admin/PillarManager.jsx` | Go+Play admin base | ✅ 7 tabs + Quick Add |
| `frontend/src/components/admin/UnifiedProductBox.jsx` | Product CRUD | ✅ Save fix applied |
| `frontend/src/components/admin/ServiceBox.jsx` | Service CRUD | ✅ ProductBoxEditor integrated (2026-03-27) |
| `frontend/src/components/admin/BundleBox.jsx` | Bundle CRUD | ✅ ProductBoxEditor integrated + Admin nav wired (2026-03-27) |
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

## SESSION 48 — (2026-04-02) Mira Search Modal Router + ProtectedRoute Cleanup

### Mira Search — Universal Service Modal Router (P0 COMPLETE)
1. ✅ **7 keyword-triggered modals wired** in `MiraSearchPage.jsx`:
   - `GroomingFlowModal` → grooming/groom/bath/spa/trim/nail queries (was already wired, fixed missing `isOpen` prop)
   - `VetVisitFlowModal` → vet/checkup/vaccine/doctor/consult queries
   - `ServiceBookingModal(boarding)` → boarding/daycare/pet-sitting/overnight queries
   - `ServiceBookingModal(training)` → training/train/obedience/puppy-class queries
   - `GoConciergeModal` → walk/hike/transport/trip/travel queries
   - `ServiceConciergeModal(celebrate)` → birthday/celebrate/party/event queries
   - `ServiceConciergeModal(learn)` → class/lesson/course/learn queries
2. ✅ **`tdc.book()` crash fixed** in `GroomingFlowModal.jsx` and `VetVisitFlowModal.jsx` — replaced undefined `service?.name` reference with literal service type string

### ProtectedRoute Console.log Cleanup (P1 COMPLETE)
3. ✅ **10 synchronous `console.log` statements removed** from `ProtectedRoute.jsx` — eliminates performance drag on every route change

### Testing Status
- Test iteration: 259 — 92% pass (11/12), critical fixes applied post-test (GroomingFlowModal isOpen, tdc.book literals)
- Auth guard, quick prompts, all 6 modal triggers, follow-up input, cart, my-requests: ALL PASS

## 9. PENDING TASKS (Priority for next session)

### SESSION 29 — (2026-03-29) 5 Bug Fixes (/mira-os + Admin)

1. ✅ **PicksVault.jsx** — `why_for_pet` field didn't exist in API. Now maps `why_reason || why_it_fits || reason` across all pick types (catalogue/concierge/personalized).
2. ✅ **ConciergePanel.jsx** — Textarea for "Anything else" now always visible (was conditional on Learn context only). WhatsApp message uses edited textarea text.
3. ✅ **MiraUnifiedHeader.jsx** — Mira logo now clickable → navigates to `/pet-home` (back button behavior).
4. ✅ **MiraDemoPage.jsx** — Hardcoded `'Buddy'` in quick reply chip replaced with `pet?.name || 'my dog'`. `extractQuickReplies` useCallback dependency updated to include `pet`.
5. ✅ **ServicesManager.jsx** — Was stuck on "Loading services..." because `pillar=services` returns 0 DB results. Now fetches all services with no pillar filter + pillar dropdown for client-side filtering.

### P0 — Remaining (Onboarding dialog)
- `OnboardingTooltip` already has localStorage `hasBeenDismissed()` — only shows once per user. No fix needed.

### SESSION 29.1 — (2026-03-29) Bugs A–D + Pet Loading Fix (Bug 7)
1. ✅ **Bug A** — `SoulKnowledgeTicker.jsx`: filter strips `none`, `null`, `undefined` values from Soul chips
2. ✅ **Bug B (Pet loading)** — `usePet.js`: `petLoaded` flag added (false until API returns real pet). `MiraDemoPage.jsx`: renders loading spinner until `petLoaded=true`. No Buddy flash.
3. ✅ **Bug C** — `PersonalizedPicksPanel.jsx` PILLARS extended: farewell (🕊️) + adopt (🐾)
4. ✅ **Bug D** — `useVoice.js` default → `true` (ElevenLabs ON by default, opt-out not opt-in)

### SESSION 37 — (2026-03-30) Mira Chat Widget Product Cards Fix

1. ✅ **Bug Root Cause**: `setVisibleProducts(streamMsgId)` was never called in the streaming path. The render gate `visibleProducts.has(msg.id)` stayed closed for ALL streaming messages → product cards never rendered even though `msg.products` was set.
2. ✅ **Fix**: Added `setVisibleProducts(prev => new Set([...prev, streamMsgId]))` with 800ms delay after stream completes (mirrors exact pattern from fallback non-streaming path).
3. ✅ **Secondary Fix**: `SUPPRESS_PRODUCT_KEYWORDS` contained 20+ common words ('gentle', 'feel', 'happy', 'comfortable', etc.) that appear in virtually every food/care response from Mira → false suppression. Replaced with 10 truly grief/crisis-only phrases.
4. ✅ **Backend verified**: `/api/mira/picks/default/{pet_id}?query=salmon` returns 4 query-matched products. Endpoint works correctly.

### P0 — Remaining
None.

### P1 — Upcoming
1. Watch & Learn YouTube sections (Care + Go)
2. Add LearnNearMe, PaperworkNearMe, GoNearMe components to mobile pages
3. Add Mira's Memory card to MiraOS dashboard (Overview/Mojo tab)

### P2 — Future
1. Production DB (Atlas IP whitelist)
2. Refactor Admin.jsx (7k lines), server.py (24k lines), MiraDemoPage.jsx (5.5k lines)
3. Build Love pillar



1. ✅ **Farewell products loading** — Removed `if (!currentPet?.id) return` guard from FarewellMobilePage useEffect. Products now fetch at mount with breed filter applied client-side. Added 3s safety timeout for guest users. 16 memorial products now visible on /farewell without pet selection.
2. ✅ **Mira explains why expand row** — ProductCard.jsx was conditioned on `product.mira_hint` (DB field, almost never set). Changed to `product.mira_hint || productMiraTip` where productMiraTip is always computed (e.g. "✨ Makes celebrations special"). All product cards now show clickable ✦ MIRA expand button.
3. ✅ **Cart orders in My Requests** — Added 🛍️ Orders tab to MyRequestsPage filtering by `request_type==='product_order'` or `order_id` present or `category==='shop'`. Subtitle updated to "Your concierge requests & shop orders".

### SESSION 28.6 — (2026-03-28) Farewell Tone Rewrite

1. ✅ **"Legacy & Memorial" → "Memorial & Grief"** — All 3 product sub-tabs renamed: Memorial & Grief / Keepsakes / Final Care
2. ✅ **Mira bar "while here" rewritten** — Removed "celebrate everything {petName} means to you". Now: "Every day with {petName} is a gift. When you're ready, we'll help you capture their memory — in paw prints, portraits, and pieces that last forever."
3. ✅ **CTA card rewritten** — Removed "celebrations of life". Now: "Honouring {petName} — every memory held gently. Urns, paw prints, memorial portraits and keepsakes."
4. ✅ **Services tab intro** — "Celebrating {petName}'s life today" → "Honouring {petName}'s life, gently"
5. ✅ **Keepsakes filter expanded** — Now includes frame + ornament in product matching
2. Add Mira's Memory card to MiraOS dashboard (Overview/Mojo tab)
3. Generate Full Migration Package Report (no code changes, just text report)

### P1 — Post-audit
1. Watch & Learn YouTube sections (Care + Go)
2. Add LearnNearMe, PaperworkNearMe, GoNearMe components to mobile pages

### P2 — Future
1. Production DB (Atlas IP whitelist)
2. Refactor Admin.jsx (7k lines)
3. Refactor server.py (24k lines)
4. Build Love pillar

### Completed in Session 14 (SOS + Shop Parity + Celebrate Plan Day)
1. ✅ SOS: Admin ServiceBox null crash fixed (selectedService?.is_active guard)
2. ✅ Shop mobile SHOP_CATS: 7 pills matching desktop exactly (mira, bakery, breed, treats, hampers, merch, toys)
3. ✅ Shop "See all X products on thedoggybakery.com" → internal "Browse all X" toggle button
4. ✅ Celebrate "Plan Day" CTA → ConciergeIntakeModal (9-step celebration type picker)
5. ✅ PawrentJourney "Plan the day" → /celebrate?plan=1 → auto-opens ConciergeIntakeModal
6. ✅ App.js routing bug fixed: CelebrateSoulRedirect preserves ?plan=1 query param

### P0 — Next Session (Full Audit)
1. Full audit of all 12 pillars — user will provide checklist
2. Add Mira's Memory card to MiraOS dashboard (Overview/Mojo tab)
3. Generate Full Migration Package Report
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


## SESSION 47 — (2026-04-01) Pillar-Specific Soul Cards on Desktop (v2)

Updated DesktopSoulCard.jsx to show pillar-specific facts per Srini Thursday spec:
- Dine: allergens + loves + 💊 Sensitive stomach
- Care: allergens + 🐕 breed/coat/grooming + 😰 stranger reaction + 💊 health
- Play: ⚡ energy/life stage/age + 🐕 social/lives_with + 😰 stranger reaction + 🎾 training
- Learn/Go: wired and ready (learn_level, travel prefs)

All 3 desktop pages verified with live screenshot: correct chips, correct pillar colours, no duplicates.



### Soul Card added to 3 Desktop Pillar Pages (Srini Thursday feature)

1. ✅ **DesktopSoulCard.jsx created** at `/app/frontend/src/components/common/DesktopSoulCard.jsx`
   - Shows pet name + pillar ("Mojo's Dine"), ⚠️ allergen chips, ❤️ love chips, life_vision quote
   - Empty state: "Tell us about {name} → Complete Soul Profile →" (links to /my-pets)
   - Case-normalized Set deduplication (no duplicate chicken/Chicken chips)
   - Pillar-themed colors: Dine=amber, Care=green, Play=orange
   
2. ✅ **DineSoulPageDesktopLegacy.jsx** — Soul Card inserted after PillarSoulProfile, before DineCategoryStrip
3. ✅ **CareSoulPage.jsx** — Soul Card inserted at top of "Care & Products" tab, before WellnessProfile
4. ✅ **PlaySoulPage.jsx** — Soul Card inserted after PillarSoulProfile, above PlayCategoryStrip

### Desktop Allergy Safety Fix (vault.allergies — CRITICAL)

5. ✅ **getAllergies() fixed in 4 files** — Now reads from `pet.vault.allergies` + `pet.health_data.allergies`:
   - `DineSoulPageDesktopLegacy.jsx` (local getAllergies)
   - `CareSoulPage.jsx` (local getAllergies)
   - `PlaySoulPage.jsx` (local getAllergies)
   - `DineSoulPage.jsx` (exported getAllergies utility)
   - Before fix: Mojo's severe chicken/beef allergies (in vault) were NOT visible on desktop → safety gap
   - After fix: Both soul answers AND vault allergies merged with deduplication

### Verified
- Mojo's Soul Card on /dine desktop: ⚠️ No Chicken ⚠️ No Beef ❤️ Salmon ❤️ Wild Salmon Treats ❤️ Salmon Training Treats ✅
- Same on /care (green theme) ✅
- Same on /play (orange theme) ✅
- No duplicate chips (case-normalized lowercase Set) ✅



### 3 Critical Mira Intelligence Bugs Fixed
1. ✅ **Pillar context gap**: `/api/mira/os/stream` now reads `current_pillar` from request body. 12 pillar-specific focus prompts injected into system. Mira no longer answers off-topic (e.g., nutrition on Paperwork pillar redirects correctly).
2. ✅ **Allergy source gap**: `get_pet_allergies()` updated to include `vault.allergies` (vet-confirmed) and `health.allergies` — Mojo now correctly shows beef + chicken allergies (was only showing chicken from dsa.food_allergies).
3. ✅ **Duplicate pet-switch messages**: `MiraChatWidget.jsx` now listens ONLY to `petChanged` event (removed `petSelectionChanged` listener) — PillarContext converts all pet switches to `petChanged`, preventing 2-3x duplicate "Switching to X" messages.
4. ✅ **describe_3_words crash**: Fixed `can only concatenate list (not str) to list` error in stream endpoint — describe_3_words is a string, now safely split on comma.
5. ✅ **Inline fallback pet data**: MiraChatWidget now sends `pet_name`, `pet_breed`, `soul_answers` inline to stream call so pet context available even without DB lookup.
6. ✅ **No-duplicate Mira orb**: `hideMiraChatOnPillarPages` prop now handled AFTER all hooks in MiraChatWidget — global widget hides on pillar paths, pillar-specific widget shows instead.

### Mobile Audit (12 Pillars — All PASS)
7. ✅ All 12 mobile pillar pages pass 390px audit (Dine, Care, Celebrate, Go, Play, Learn, Paperwork, Shop, Services, Adopt, Emergency, Farewell)
8. ✅ Dashboard Mira widget opens from hamburger menu "Ask Mira" via `openMiraAI` event
9. ✅ Service booking modal (Step 1 of 4) opens from Services, Care, Go, Play, Learn mobile pages
10. ✅ ConciergeIntakeModal opens from Dine, Celebrate "Plan Day" CTAs

---


### CRITICAL BUG FIX: Breed Cross-Contamination (Zero Tolerance)
- Fixed: Bernese Mountain Dog products showing for Shih Tzu Meister in Play
- Root cause: Products tagged `all_breeds` but with breed names in names were treated as universal
- Fix: NAME-FIRST rule — if product name has a known breed, it's ONLY for that breed (overrides all tags)
- Backend: `_should_show_for_breed()` in pillar_products_routes.py + breed_catalogue.py
- Frontend: `filterBreedProducts()` in useMiraFilter.js updated with same NAME-FIRST logic
- DB: 3447 breed_products fixed (breed=all → specific breed). 420 products_master fixed.
- CareMobilePage.jsx: Fixed critical parse error (missing function declaration). Added 9 dim pills.
- PersonalisedBreedSection: watercolor_image priority for Soul Made illustrations
- All mobile pages: now pass breed param to backend API
- Admin generate-image: saves watercolor_image for breed_product entities
- Test result: 21/21 PASS. Zero cross-breed contamination confirmed.


---

## SESSION 16 — (2026-03-26) PawrentJourney Wiring + Care Mobile Fixes

### PawrentJourney — Fully Wired
1. ✅ **New PawrentJourney.jsx** — User's uploaded file saved as-is (828 lines). Fixed React hooks violations (useNavigate/useEffect called conditionally → moved before early return). `bookViaConciergeDirect()` calls `/api/service_desk/attach_or_create_ticket`. `completeStep()` calls `/api/pawrent-journey/complete-step`. Fetches progress from `/api/pawrent-journey/progress/{pet_id}`.
2. ✅ **PawrentFirstStepsTab** wired on: CareSoulPage.jsx (desktop), CareMobilePage.jsx, DineSoulPage.jsx (inline DineMobilePage), LearnMobilePage.jsx, AdoptMobilePage.jsx, PaperworkMobilePage.jsx. (Go, Play, Celebrate already had it).
3. ✅ **PawrentJourneyPage.jsx** — Fixed to import default export `PawrentJourney` from PawrentJourney.jsx + pass pet/token from context.
4. ✅ **Backend endpoints** — `POST /api/pawrent-journey/complete-step` and `GET /api/pawrent-journey/progress/{pet_id}` confirmed working.

### Care Mobile Fixes
5. ✅ **Tab bar centering** — Added `justify-content: center` to global `.ios-tab-bar` CSS class. All mobile pillar tab bars now centered.
6. ✅ **Services tab** — Removed hardcoded `CARE_SERVICES` 2-column price grid. Services tab now shows only `CareConciergeSection` matching desktop Pic 3 exactly ("Care Concierge® Services" illustrated cards).
7. ✅ **GuidedCarePaths modal** — Increased z-index from 300 → 9999. Modal now opens correctly on both desktop and mobile.

### SESSION 17 — (2026-03-27) Conversational Mira E2E Fix

1. ✅ **Conversational Mira follow-up bug fixed** — `MiraChatWidget.jsx` was gating `checkAndShow()` on `messages.length === 0`. Session-restored messages prevented the follow-up from ever showing. Fixed by using `followUpCheckedRef` (runs once per open cycle, regardless of message count) and `setMessages(prev => ...)` functional update to safely append follow-up even when conversation history exists.
2. ✅ **Duplicate "Switching to pet" messages fixed** — Added `lastPetSwitchRef` 2-second debounce + `isOpen` guard on `handlePetChange`. Pet-switch messages now only appear when the widget is already open (not on page load) and only once per 2 seconds per pet.
3. ✅ **Full E2E verified**: memory created → widget opens → follow-up shown as sole message → marked shown → next open no follow-up (clean welcome) → resolve PATCH clears pending.

### Pending Items (Updated after Session 18)
- Admin notification bell returning 0 (P1)
- ProductCard `display_only` flag — insurance items showing "Add to Cart" (P1)
- Farewell service prices all Rs.0 (P1)
- LearnNearMe, PaperworkNearMe, GoNearMe on mobile pages (P1)
- Wellness Profile score calibration: visual verify (user request)

### SESSION 18 — Soul Chapter Score Fix
1. ✅ **Soul Chapter Scores fixed** — `GET /pets/{pet_id}/soul` was counting keys starting with "q1/q2/q3" (always 0). Now returns `category_scores` from `calculate_pet_soul_score()`. Buddy: safety=100, personality=100, lifestyle=75, nutrition=33. Zero false zeros.


### SESSION 19 — (2026-03-28) Mobile Parity Sprint: CategoryStrips + PawrentFirstStepsTab

1. ✅ **PillarCategoryStrip created** — `/app/frontend/src/components/common/PillarCategoryStrip.jsx` — generic horizontally-scrollable icon chip strip. Props: `categories[]`, `activeId`, `onSelect(id)`, `accentColor`. All chips have `data-testid="strip-cat-{id}"`.

2. ✅ **CategoryStrips added to 6 mobile pages** (was missing before this session):
   - **Learn**: `LEARN_STRIP_CATS` (Foundations / Behaviour / Training / Tricks / Enrichment / Know Breed / Soul Learn / Bundles / Mira's Picks) → clicking chip sets `activeDim` + switches to learn tab.
   - **Paperwork**: `PW_STRIP_CATS` (Identity / Health / Travel / Insurance / Breed Guides / Advisory / Soul Docs / Soul Made™) → clicking chip sets `activeDim`.
   - **Emergency**: `EMERG_STRIP_CATS` (First Aid Kit / 24hr Vets / Poison / Lost Pet / Transport / First Aid Course / Safety Plan) — after urgent CTA bar.
   - **Farewell**: `FAREWELL_STRIP_CATS` (End of Life / Support / Cremation / Memorial / Ceremony / Grief Support / Soul Made™).
   - **Adopt**: `ADOPT_STRIP_CATS` (Am I Ready? / Ready / Find a Match / We Matched! / Coming Home / Breed Guide / Book Guidance) → chips sync with `adoptStage` state.
   - **Services**: `SVC_STRIP_CATS` (Pamper / Health & Vet / Train / Celebrate / Fitness / Travel / Life Events).

3. ✅ **Section order fixed** — PillarSoulProfile + CTA card + PawrentFirstStepsTab moved INSIDE Tab 1 content (was before tab bar) for: Learn, Paperwork, Farewell, Adopt pages. Now matches Play/Care gold standard.

4. ✅ **Tab bars made sticky** — Learn and Paperwork tab bars now use `position:'sticky', top:0, zIndex:100` with border-bottom style (was pill-style, non-sticky).

5. ✅ **PawrentFirstStepsTab added to Emergency, Farewell, Shop, Services** — component placed in JSX for all 4 pages.

6. ✅ **FIRST_STEPS entries added** to `PawrentJourney.jsx` for 4 new pillars:
   - `emergency`: Build First Aid Kit / Register Emergency Vet / Create Safety Plan
   - `farewell`: End-of-Life Care Plan / Plan a Memorial / Grief Support
   - `shop`: See Mira's Shop Picks / Explore Breed Collection
   - `services`: Book First Groom / Book Vet Consultation

7. ✅ **Shop page crash fixed** (by testing agent) — `showShopPlan` state was missing from ShopMobilePage useState declarations.

8. ✅ **MiraPlanModal placement fixed** in PaperworkMobilePage — was incorrectly nested inside loading state JSX.

**Test Results (iteration_237.json):** 80% → 100% after FIRST_STEPS fix. All 7 CategoryStrips render. Sticky tab bars confirmed. Soul Profile inside Tab 1 confirmed. PawrentFirstStepsTab now renders on all 11 applicable pillar pages.


### SESSION 20 — (2026-03-28) Emotional UX Sprint

1. ✅ **FirstTimePawrent.jsx** created — collapsible week-one checklist card on Adopt (pink) and Care (green). CTA opens ConciergeRequestBuilder with `preselect="lifestage"`.
2. ✅ **ConciergeRequestBuilder** upgraded:
   - `preselect` prop — auto-jumps to a service category (used by FirstTimePawrent)
   - Soul profile pre-fill pill — shows breed + allergies in Step 0 header
   - Allergen-aware message — `allergyLabel` appended to every ticket message
   - Added `parseAllergyString()` fallback to extract allergies from health description strings (handles "chicken, beef allergy — otherwise healthy" text format)
3. ✅ **Adopt mobile copy rewrite** — Hero: "Every dog deserves the right home". Mira bar: "The right match between a dog and their family changes two lives forever."
4. ✅ **Farewell toggle** — "While {name} is here" / "When the time comes" pill toggle. Changes Mira bar copy + CTA button label + Services tab intro text dynamically.
5. ✅ **Desktop floating button cluster** — Concierge® button moved to `bottom: 96px` (stacks cleanly above Mira orb at `bottom: 24px`). Added hover micro-animation.

1. ✅ **AdoptSoulPage.jsx** — Hero pet avatar: replaced hardcoded `🐾` with `petData.photo_url ? <img/> : 🐾` fallback.
2. ✅ **ServicesSoulPage.jsx** — Hero orb: replaced hardcoded Mira ✦ orb with `petData.photo_url ? <img/> : ✦` fallback.
3. ✅ **GoMobilePage.jsx** — Pet selector buttons aligned to match all other pillars: `flexWrap:'wrap'`, `padding:'6px 16px'`, `fontSize:13`, removed `maxWidth:'55%'`. Also removed allergy tags from hero.
4. ✅ **ServicesMobilePage.jsx** — Hero aligned: replaced pet-avatar + text flex layout with standard two-line subtitle text (matches all other pillars).
5. ✅ **ServicesMobilePage.jsx** — Bottom "Book via Concierge® →" CTA now calls `setSvcBooking({ isOpen:true })` opening the full 4-step ServiceBookingModal (was calling `request()` which showed a toast instead).

### SESSION 22 — (2026-03-28) Parity Sprint + Bug Fixes

**Bugs Fixed:**
1. ✅ **Double navigation rows** — CategoryStrips (DineCategoryStrip, CareCategoryStrip, GoCategoryStrip, PlayCategoryStrip) were rendering ABOVE the ios-tab-bar. Moved all of them INSIDE their respective first tab content (Dine/Care/Go/Play tab). Only one row of navigation tabs now shows at the top.
2. ✅ **PillarSoulProfile drawer going under navbar** — Root cause: App's `overflow-x: hidden` wrapper creates CSS containment that clips `position: fixed` z-index on iOS Safari. Fix: Profile modal now uses `ReactDOM.createPortal` to render directly in `document.body` with zIndex: 100000 + frosted glass backdrop. Bypasses all ancestor stacking contexts.
3. ✅ **ios-tab-bar top changed from 56px to 0** — Tab bar now sticks at viewport top. Eliminates profile card going under header issue.
4. ✅ **Desktop scrollbars in modals** — Added global `.no-sb` CSS rules to `App.css` (was only in mobile-design-system.css). Added `[style*="overflow-y: auto"]` webkit scrollbar hide rule. Added `className="no-sb"` to GuidedCarePaths (both components/ and pages/ versions).

**Desktop Parity Features Added:**
5. ✅ **Services tab standardisation** — All desktop soul pages now use `🐕 Services` label:
   - CareSoulPage: ✂️ Care Services → 🐕 Services
   - GoSoulPage: 🗺️ Book a Service → 🐕 Services
   - DineSoulPageDesktopLegacy: Added 3rd tab (🐕 Services), DineConciergeSection moved there
   - LearnSoulPage: 📋 Book / 📋 Book a Session → 🐕 Services
   - PlaySoulPage: 💪 Book a Service → 🐕 Services
   - EmergencySoulPage: 📋 Book Help → 🐕 Services
   - PaperworkSoulPage: 📋 Services → 🐕 Services
6. ✅ **Adopt sectioned products on desktop (AdoptSoulPage)** — Added `rawProducts` state, `applyMiraFilter` import, `useMemo` for `adoptSections` (Breed Essentials, Arrival Essentials, Home Readiness, Enrichment & Bonding). Sectioned product display added to adopt tab below MiraPicksSection.

**Test Results (iteration_239.json):** 17/17 tests passing (100%)

### SESSION 23 — (2026-03-29) Design Token System Integration Sprint

**P0 — Design Token System:**
1. ✅ **tdc-design-tokens.css created** at `/app/frontend/src/styles/tdc-design-tokens.css` (1044 lines). Single source of truth for all visual decisions: typography (SF Pro, Cormorant Garamond), spacing (golden ratio 4px–89px), colors, chips, buttons, cards, Mira OS desktop layout.
2. ✅ **Imported FIRST in index.css** (line 1 — `@import "./styles/tdc-design-tokens.css"`) before all other styles, making it the cascade origin.
3. ✅ **CSS deprecated chip classes updated** in `mira-chat.css` and `mira-10x.css` to use token variables (`--radius-full`, `--text-xs`, `--font-sans`, `--color-text-inv`, `--space-*`, `--duration-fast`).
4. ✅ **Full chip sweep** — Replaced inline tailwind pill patterns (`px-2 py-0.5 rounded-full text-xs`) with `tdc-chip` + variant classes across 10+ files: PersonalizedPicksPanel, MiraDemoPage, MiraPureOSPage, ServicesPage, TicketThread, TicketDetailPanel, TopPicksPanel (53 total `tdc-chip` usages).
5. ✅ **CSS gold token conflict fixed** — Removed `--color-gold` override from `mobile-design-system.css` (was overriding tdc-design-tokens.css's canonical value).

**P1 — Watch & Learn YouTube:**
6. ✅ **CareMobilePage.jsx** — Added `WatchSection` component. Fetches breed-specific YouTube videos via `/api/test/youtube`. Shows 2-column grid of video thumbnails with play button overlay after CareConciergeSection.
7. ✅ **GoMobilePage.jsx** — Added `GoWatchSection` component. Fetches dog travel YouTube videos. Shows after GuidedGoPaths in the 'go' tab.

**P1 — MiraOSPage Desktop Layout:**
8. ✅ **MiraOSPage.jsx** (at `/mira-os-shell`) — Added `mira-os-layout` class (2-column grid: 320px sidebar + 1fr main on 1024px+). Header has `mira-unified-header` (full width). MiraHeaderShell wrapped in `mira-os-sidebar`. Tab contents wrapped in `<main class="mira-os-main">`.

**P1 — Watch & Learn YouTube in Desktop DimExpanded (Session 24):**
9. ✅ **CareSoulPage.jsx** — Added `ytQuery` to all 9 care dims (grooming, dental, coat, wellness, senior, supplements, soul, mira, soul_made). Added 3rd "🎬 Watch" tab to `DimExpanded` (lazy-loaded YouTube videos on tab activation). Breed + dim-specific query. 2-column video grid with play button overlay.
10. ✅ **GoSoulPage.jsx** — Same pattern. Added `ytQuery` to all 6 go dims (safety, calming, carriers, feeding, health, stay). 3rd "🎬 Watch" tab in `DimExpanded`.

**Test Results (iteration_247.json):** 6/7 tests PASS (86%). Watch & Learn ✅, Tokens ✅, Font ✅, Chips ✅, No regressions ✅. Desktop layout on /mira-os-shell ✅ (MiraDemoPage at /mira-os is the chat interface and uses different layout by design).


### SESSION 36 — (2026-03-30) ProductDetailModal Portal Fix — Systemic

**Root cause found**: `ProductDetailModal` and `ConciergeOnlyProductDetailModal` in `ProductCard.jsx` did NOT use `createPortal` internally. All 15+ usages across pillar pages rendered the modal inline inside PillarPageLayout's `overflow-x-hidden` div, which created a containing block hijacking `position: fixed`. The modal appeared behind the sticky header and below page content on every pillar.

1. ✅ **ProductCard.jsx** — Wrapped `ProductDetailModal.return()` in `createPortal(..., document.body)`. One fix, all 15+ usages auto-fixed (CelebratePageNew, ShopSoulPage, CareSoulPage, PlaySoulPage, GoSoulPage, all Mobile pages, etc.)
2. ✅ **ProductCard.jsx** — Same fix applied to `ConciergeOnlyProductDetailModal`
3. ✅ **ProductCard.jsx** — Removed now-redundant outer `createPortal` wrapper in ProductCard's render
4. ✅ **DoggyBakeryCakeModal.jsx** — Z-index raised to max (`2147483640/641/642`), order panel scroll fixed (`maxHeight:92vh`, `WebkitOverflowScrolling:touch`, proper `paddingBottom`)
5. ✅ **PillarPageLayout.jsx** — Pillar sub-nav changed from `sticky top-0` to `sticky top-16` to avoid Navbar overlap

---

## SESSION 35 — (2026-03-30) Cake Modal Z-index Fix + Cart Safety Guards + PillarPageLayout Header Fix

1. ✅ **DoggyBakeryCakeModal.jsx** — Raised z-index to max (`2147483640/641/642`) for backdrop, modal container, and order panel. This fixes the modal going behind page content.
2. ✅ **Order panel scroll** — Fixed bottom sheet: `maxHeight:'92vh'`, `overflowY:'auto'`, `WebkitOverflowScrolling:'touch'`, `paddingBottom: env(safe-area-inset-bottom)`. Form fields now fully accessible.
3. ✅ **CartSidebar.jsx** — Added `String()` coercions to all `customDetails` renders (date, flavour, shape, name, allergies, lifeVision). Prevents "Objects are not valid as a React child" Date crashes.
4. ✅ **Checkout.jsx** — Added `String()` guards on `petSoulInsights.answers.diet_type` and `favorite_treats` renders to prevent object crashes from raw MongoDB data.
5. ✅ **PillarPageLayout.jsx** — Changed pillar sub-nav from `sticky top-0 z-40` to `sticky top-16 z-40`. Prevents pillar nav overlapping main Navbar on scroll.

---

## SESSION 34 — (2026-03-30) Design Bible v2 + Cake Cart Flow

**Design Bible v2 (tdc-design-tokens (1).css — Session 97 master):**

**Status: MERGED** — All new tokens appended to existing file. Old tokens kept for backward compatibility. No breaking changes.

#### Key Discrepancies Found (new bible vs existing implementation):

| Token | Existing File | New Design Bible | Resolution |
|---|---|---|---|
| `--font-primary` | Not present (`--font-sans` used) | Added as primary name | ADDED as alias → `--font-sans` |
| `--font-accent` | Not present (`--font-serif` used) | Added as accent name | ADDED as alias → `--font-serif` |
| `--text-xs` | `13px` | `11px` (micro labels) | KEPT `13px` for compat; added `--text-xs-sm: 11px` |
| `--text-base` | `17px` (Apple HIG) | `15px` | KEPT `17px` — intentional Apple HIG choice |
| `--radius-md` | `14px` | `12px` | KEPT `14px` — visual regression risk |
| `--radius-lg` | `20px` | `14px` | KEPT `20px` — used on all buttons/cards |
| `--radius-xl` | `28px` | `16px` | KEPT `28px` — major visual change |
| Pillar colors | Single flat value per pillar | Full dark/mid/light/pale per pillar | ADDED full palettes as new tokens |
| Gradients | Not present | Full library (brand, mira, cta, pillar heroes) | ADDED all gradient tokens |
| Z-index scale | Not present | `--z-header: 300`, `--z-modal: 500`, etc. | ADDED all z-index tokens |
| Layout tokens | Not present | `--header-height: 64px`, `--nav-height-mobile: 72px`, etc. | ADDED all layout tokens |
| Image dimension tokens | Not present | `--img-avatar-sm/md/lg/xl`, `--img-product-*` | ADDED all image tokens |
| `@import` fonts | `Cormorant Garamond + Inter` | `Cormorant Garamond + DM Sans` | UPDATED — added DM Sans import |
| `--gradient-*` | Not present | All pillar hero gradients | ADDED all |
| `static.prod-images.emergentagent.com` | Used in MealsPage.jsx HERO_IMAGES + CARD_IMAGES | BLOCKED (staging CDN) | ⚠️ OPEN — Images appear genuine TDC product photos; do not remove until Cloudinary URLs are confirmed |

#### New Token Categories Added:
- Brand colour palette (`--color-brand-deepest` → `--color-brand-cream`)
- Teal token family (`--color-teal-dark/mid/light/pale`)
- Extended radius scale (`--radius-xs: 6px`, `--radius-2xl: 20px`, `--radius-3xl: 24px`)
- Shadow additions (`--shadow-brand`, `--shadow-teal`, `--shadow-inner`, `--shadow-2xl`)
- Full Z-index scale (`--z-header: 300` → `--z-top: 9999`)
- Component padding shortcuts (`--padding-card`, `--padding-modal`, `--padding-hero`, etc.)
- Image dimension tokens (`--img-avatar-*`, `--img-product-*`, `--img-radius-*`)
- 12 pillar palettes (4 tones each: dark/mid/light/pale)
- Complete gradient library (brand, mira, cta, all 12 pillar heroes)
- Utility classes: `.tdc-btn`, `.tdc-img-placeholder`, `.tdc-north-star`, `.tdc-label-upper`, `.tdc-heading-serif`

**Cake Order → Cart Flow (Session 34):**
1. ✅ `DoggyBakeryCakeModal.jsx` — Replaced direct-order-with-success-screen with: (a) immediate `addToCart()` call with full customDetails (flavour, base, size, shape, petName, petBreed, petAllergies, message, date, time, lifeVision, productImage), (b) non-blocking background `fetch` to `/api/celebrate/cake-order` for service desk ticket
2. ✅ `CartSidebar.jsx` — Enhanced `customDetails` block to display: flavour+base, message, delivery date+time+type, pet name+breed, allergies, and life vision (north star)
3. ✅ `server.py` — Added `life_vision` field to `cake_orders` schema and ticket text ("North Star: ...")

**Image Hygiene (Session 34):**
4. ✅ 237 stock photo URLs removed (206 from server.py seed data, 31 from frontend JSX)
5. ✅ `PillarPage.jsx`, `ProductListing.jsx`, `MealsPage.jsx`, `Streaties.jsx`, `ProductListingNew.jsx` — All img tags replaced with TDC branded CSS gradients
6. ⚠️ `MealsPage.jsx` HERO_IMAGES + CARD_IMAGES still use `static.prod-images.emergentagent.com` URLs — these appear to be genuine TDC product images on the staging CDN; flagged for migration to Cloudinary

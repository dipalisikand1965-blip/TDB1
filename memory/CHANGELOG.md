# TDC Changelog


## April 24, 2026 — Admin Clarity Button, Safety Vault Alerts, Navbar Bell Fix, Legacy Cleanup

### Admin: Clarity Analytics Button Wired (`Admin.jsx`)
- Root cause: Previous session built `ClarityAnalyticsPanel` component + registered the tab handler but forgot to add the navigation button
- Fix: Added `{ id: 'clarity-analytics', label: '📊 Clarity', icon: TrendingUp }` to BOTH Commerce and Analytics rows
- Now clickable from Admin → Commerce (next to ✦ Places) AND Admin → Analytics (after Site Status)

### Safety Vault: Daily + Weekly Email Alerts + WhatsApp Failure Alert
- New: `sitevault_daily_status_email.py` — daily 8 AM IST status email (success OR failure formats)
  - SUCCESS: ✅ subject + primary file, size, doc count, duration, Drive location, file list, "All systems healthy"
  - FAILURE: 🔴 subject + error, failing step, last successful backup, smart recommendation, manual backup path
  - WhatsApp blast to `ADMIN_WHATSAPP_NUMBER` via Gupshup on any failure (freeform fallback)
- New: `sitevault_weekly_summary_email.py` — Monday 9 AM IST weekly summary
  - Daily backups X/7 ✅, Weekly full X/1 ✅, Monthly frozen ✅, Gold Masters retained, Total Drive storage, Next monthly frozen date
- Recipients: `dipali@clubconcierge.in` + CC `sysadmin@clubconcierge.in`
- Hardening (applied to ALL scheduled emails):
  - `misfire_grace_time=3600` — missed slot within 1 hour still fires
  - Startup catch-up — if server boots 8 AM–11 PM IST and today's not sent, fires immediately
  - Mongo last-sent marker (`sitevault_status_email_log`, `outreach_digest_log`) — prevents double-sends across restarts
- Admin endpoints: `POST /api/sitevault/send-status-email-now`, `POST /api/sitevault/send-weekly-summary-now`

### Outreach Digest Scheduler Hardening (`places_outreach_digest.py`)
- Root cause for missed 8 AM IST digest on 24 Apr: backend restarted at 8:02 AM — APScheduler doesn't run missed slots by default
- Same hardening pattern: `misfire_grace_time=3600` + startup catch-up + Mongo last-sent marker
- Today's digest fired manually + verified — Resend IDs logged

### Navbar Bell / Unified Inbox Endpoint Fix (`server.py`)
- Root cause: `/api/unified-inbox/unread-count` was 404 (never built); `/api/notifications/unread-count` was missing `member_notifications` (the PRIMARY inbox collection) in its aggregation
- Impact: Bell showed 0 even when Dipali had 22 unread notifications
- Fix: Built `GET /api/unified-inbox/unread-count?email=<email>` aggregating 5 sources:
  - `member_notifications` (primary Mira/concierge/birthday inbox)
  - `notifications` (legacy fallback)
  - `push_notification_logs`
  - `tickets` with `has_unread_update`
  - `concierge_requests` pending
- Also updated existing `GET /api/notifications/unread-count` (JWT auth'd) to include `member_notifications` + `notifications`
- Returns `{count, unread_count, breakdown}` for both endpoints
- Verified: Dipali preview now shows 22 unread (bell displays "9+")

### Legacy Service Requests Cleanup
- Soft-closed all 398 pending `service_requests` records → `status: "closed_legacy"` + `closure_note` + `closed_at` + `closed_by`
- Investigation findings:
  - 231 records had no email (from `mira_soulful` test flows)
  - 167 records from Dipali's self-testing
  - 0 real paying customers — confirmed safe to clean
  - `test@example.com` generator does NOT exist — was a one-off Feb 25 QA hit, never repeated
- Mira Soulful flow (`mira_soulful_brain.py:execute_create_service_ticket`) is CORRECT production behavior — creates pending tickets for the concierge team to process. Not a bug.
- No code changes needed — DB-only cleanup.

### Files Created
- `/app/backend/sitevault_daily_status_email.py`
- `/app/backend/sitevault_weekly_summary_email.py`

### Files Modified
- `/app/backend/server.py` — added `/api/unified-inbox/unread-count`, updated `/api/notifications/unread-count`, wired sitevault email schedulers
- `/app/backend/places_outreach_digest.py` — hardened scheduler (misfire grace + catch-up + dedup marker)
- `/app/backend/sitevault_routes.py` — added on-demand trigger endpoints
- `/app/frontend/src/pages/Admin.jsx` — added Clarity tab buttons in Commerce + Analytics rows


## April 19, 2026 — Mira Soul Charter + Search Intelligence + Security

### Security: MongoDB Atlas Credential Rotation
- Credential `tdc123` was exposed in GitHub public repo (`server.py` hardcoded fallback)
- Removed ALL hardcoded credentials from `server.py` — now uses `PRODUCTION_MONGO_URL` env var only
- Atlas password rotated to new value (stored in `.env` only, never in code)
- Repo made public again (old credential is dead/rotated — safe)

### Mira Soul Charter (`mira_soul.py`)
- Added `MIRA_SOUL_CHARTER` as the universal identity declaration for Mira across ALL surfaces
- Prepended to system prompts of: Widget (`mira_soulful_brain.py`), Search stream (`mira_routes.py`), WhatsApp (`whatsapp_routes.py`)
- Charter defines: companion not assistant, loves dog first, comforts first, never judges, carries grief gently, anticipates needs

### Mira Search Intelligence Overhaul (`mira_routes.py`)
- **Breed-specific cakes**: Fixed `birthday_celebration` priority filter to include `"breed-cakes"` category
- **Breed scoring fix**: `_pet_breed_score` now normalises breed comparison (`"shih tzu"` ↔ `"shih_tzu"`) — was getting score=0 due to space vs underscore mismatch
- **Hard breed block**: `_is_wrong_breed_cake()` — any product with `breed_tags` that don't match the pet's breed is HARD BLOCKED (not just ranked low). Applies to all categories (cakes, accessories, etc.)
- **"More choices" dedup**: Priority products only shown on page 1 (offset=0) — page 2+ returns fresh products
- **Follow-up dedup**: `exclude_ids` parameter added to `/api/mira/semantic-search` — frontend passes already-shown product IDs so backend excludes them
- **Always use semantic-search**: `MiraSearchPage.jsx` now always calls semantic-search after stream (not just as fallback) — ensures breed-optimized results on BOTH preview and production
- **Dinner intent fix**: Added "dinner", "lunch", "breakfast", "kibble", "wet food", "salmon", "what to feed" to `food_dining` triggers
- **DB data fix**: Fixed 11 breed-cakes with empty `breed_tags` in MongoDB (Chow Chow, Italian Greyhound, Maltipoo, Newfoundland, etc.)

### Mira Search — Pet Rules (Locked)
- Own breed cake → shown first
- Generic cakes (no breed_tags) → shown after own breed
- Other breed cakes → HARD BLOCKED (never show)
- Allergens → HARD BLOCKED across all categories
- "More choices" / follow-up messages → always fresh products (no repeats)



**Fix: Add to Cart from Mira Picks (ProductCard.jsx)**
- Root cause: `cartInput.age` was empty for pets onboarded via soul profile (`age_stage` answer, e.g. "puppy"), not via numeric `age` field. Celebration products require age → silent validation failure.
- Fix: `cartInput` initialization now reads `selectedPet.doggy_soul_answers?.age_stage` as fallback (converts "young_adult" → "Young Adult"). Same fix applied to `handlePetSelect`.
- Additional guard: If pet is selected by ID and age still empty, `handleAddToCart` auto-fills 'Adult' so validation never blocks a pet-selected add.

**Fix: Admin Orders showing ₹450 instead of ₹708 (checkout_routes.py + OrdersTab.jsx)**
- Root cause: `order_doc` stored only `pricing.grand_total` (₹708) but admin read `order.total || order.total_amount` (both undefined) → fell back to "Price on WhatsApp".
- Fix: Added `total_amount: grand_total` at top level of `order_doc` for NEW orders. `OrdersTab.jsx` now reads `order.total_amount || order.pricing?.grand_total || order.total`.
- Added a pricing breakdown section (Subtotal / Shipping / GST / Total Paid) below item list in order cards.

**Fix: PDF Invoice Taxable Amount confusion (checkout_routes.py `generate_invoice_pdf`)**
- Root cause: Invoice showed Subtotal (₹450) then Taxable Amount (₹600) — the ₹150 shipping was included in taxable but shown AFTER, making it look like a mystery amount.
- Fix: Invoice totals now ordered: Subtotal → Discount → Shipping → Taxable Amount (incl. shipping) → CGST/SGST/IGST → Grand Total. The arithmetic is now transparent.



**Fix 1: Soul Score Sync (all 7 pillar pages)**
- All pillar pages (Care/Dine/Go/Play/Learn/Services/Shop) now call `GET /api/pet-soul/profile/{id}` live on pet change. Previously showed stale 0% from PillarContext.

**Fix 2: Duplicate Questions in PillarSoulModal**
- `PillarSoulModal.jsx` now filters `PILLAR_QUESTIONS` against `pet.doggy_soul_answers`. Already-answered questions are skipped. Added "All done!" screen when nothing remains.

**Fix 3: Archetype After Onboarding**
- Added `POST /api/pets/{pet_id}/infer-archetype` backend endpoint (calls `_infer_pet_archetype` from `archetype_routes.py`). Called from `PetSoulOnboarding.jsx` on completion. Archetype label shown on celebration screen.

**Service Desk: Channel Emoji Swap**
- Replaced colored priority dots with channel emojis (💬🌐📧🤖📞). Added `CHANNEL_EMOJI` const to `DoggyServiceDesk.jsx`.

---

## April 10, 2026 — Service Desk: BY CHANNEL Sidebar + Pillar Tag Badges

### DoggyServiceDesk.jsx
**BY CHANNEL sidebar section** (mirrors BY PILLAR exactly):
- Shows 💬 WhatsApp / 🌐 Web / 📧 Email / 🤖 Mira Chat / 📞 Phone with open ticket counts
- WhatsApp shows green unread badge (`has_unread_member_reply`) — concierge sees instantly
- Clicking any channel filters ticket list immediately (uses existing `channelFilter` state)
- Each channel highlights in its own brand colour when active

**Pillar tag badges on ticket cards:**
- Added `PILLAR_BADGE` const — Tailwind-safe class pairs per pillar
- Every ticket card now shows coloured pill (e.g. `🎂 Celebrate`, `🛁 Care`) in meta row
- Badge falls back to `ticket.pillar` if `ticket.category` is unrecognised

**Stats:**
- Added `unread_by_channel` to stats object — computed per channel using `has_unread_member_reply`



### whatsapp_routes.py
- Added `_WA_PILLAR_KEYWORDS` — ordered keyword-to-pillar map (11 pillars: celebrate, dine, care, emergency, vet, play, go, learn, services, shop, paperwork)
- Added `_detect_pillar_from_wa_message(text)` helper — scans message for keywords, returns pillar string or None
- Moved pillar detection BEFORE `if _resolved_pet:` so `_detected_pillar` is always in scope
- **Fixed standard dedup lookup** (was: phone + any open ticket → attach): now matches on phone + SAME PILLAR. If no pillar detected → `sd_ticket = None` → new ticket created (safe fallback)
- Fixed new-ticket fallback creation: uses `_detected_pillar` for `pillar` and `category` fields (was hardcoded `"support"`)

**Result:**
- "Hi looking for a cake !!" → pillar=celebrate → does NOT merge into Doggy Daycare (play) ticket ✅
- "hi any update on daycare" → pillar=play → correctly attaches to play ticket ✅
- "Hi" → no pillar → creates fresh ticket (safe) ✅



### models.py
- Added `user_email: Optional[str] = None` to `VerifyPaymentRequest` — was missing, causing `AttributeError` → membership never activated after payment

### server.py (verify_payment handler)
- Added `resolved_email = request.user_email or order.get("user_email")` fallback
- Replaced all `request.user_email` usages with `resolved_email`

### checkout_routes.py (verify-payment handler)
- Replaced manual HMAC-SHA256 with `razorpay_client.utility.verify_payment_signature()` (SDK-native)
- Removed unused `hmac` and `hashlib` imports



### mira_service_desk.py — Member Email & Notification Gating
- Added `SILENT_MEMBER_INTENT_TYPES` frozenset (13 intent types: browse_intent, search_intent, nearme_search, product_interest, mira_chat_intent, onboarding_progress, product_browse, page_view, pillar_visit, GENERAL_QUERY, internal, internal_tracking, test events)
- Added `_is_silent_intent()` helper — also pattern-matches `mira_*_concern` intents from useMiraTicket
- **Member bell notification** (member_notifications insert) now skipped for silent intents
- **Member email** (`send_concierge_request_email`) now skipped for silent intents
- Admin notification bell + service desk ticket ALWAYS created (no change)
- Tested: browse_intent → no member notification, no email; service_booking → notification + email fires



### DB Migration Package Expanded (133 → 150 collections)
- Exported 16 previously missing collections: mira_product_scores (44,891), mira_signals (12,240), admin_notifications (2,270), member_notifications (1,374), email_logs (574), events_log (105), services (46), products (1,635), dismissed_alerts, soul_score_history, ticket_viewers, learn_products, concierge_messages, concierge_threads, custom_cake_designs, member_password_resets, learn_requests
- Fixed duplicate `unified_products` entry in COLLECTIONS_CONFIG
- Total: 150 collections · 89,878 docs

### Admin: Re-export Migration Data Button Added
- Backend: POST /api/admin/db/re-export + GET /api/admin/db/re-export-progress
- Frontend: Amber button in Guide & Backup panel, live progress polling every 2s
- Tested: 150 collections, 89,878 docs, 0 errors, ~4 seconds

### Environment Variables Verified
- AMAZON_AFFILIATE_TAG=thedoggyco-21 ✅ already in .env
- OPENAI_API_KEY: not needed, ai_image_service.py uses EMERGENT_LLM_KEY directly
- EMERGENT_LLM_KEY: active and working for all AI image generation

### Docs Updated
- !!!START_HERE_NEXT_AGENT!!!.md: updated to 150 collections / 89,878 docs
- DEPLOYMENT_RULES.md: updated to 150 collections / 89,878 docs

### Session: Meal Box Breed+Pet Sort Fix (Apr 2026)
- Fixed `meal_box_routes.py` `best_in()` sort: now follows **Pet First** logic — allergy-safe (absolute block) → protein preference → breed match → Mira score
- Fixed `to_list(200)` → `to_list(1000)` so Morning/Evening Meal sub_category products aren't cut off
- Fixed breed normalisation: "Golden Retriever" → "golden_retriever" to match DB breed_tags format
- Breed-mismatched products (e.g. Cocker Spaniel bowl for Indie dog) are now penalised (score = -1) not just unsorted
- Persisted Mira Imagines items excluded from real product candidates to prevent cross-slot contamination
- Added `breed` query param to `GET /api/mira/meal-box-products` endpoint
- Updated `MealBoxCard.jsx` to pass `pet.breed` to the API

# TDC Changelog

## April 11, 2026 — Commerce & Mira Picks Fixes (3 production bugs)

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

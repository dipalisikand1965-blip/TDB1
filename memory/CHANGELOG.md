# TDC Changelog

## April 10, 2026 — WhatsApp Ticket Dedup Fix (Pillar-Aware)

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

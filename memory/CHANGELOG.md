# TDC Changelog

## April 10, 2026 — Silent Browse/Internal Intent Email Fix

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

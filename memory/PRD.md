# The Doggy Company — Pet Life OS
## Product Requirements Document

### Original Problem Statement
Build a robust, architecturally consistent, and highly performant Pet Life OS platform for soft launch. Specifically:
1. Universal Intent-to-Ticket Flow across all 12 pillars via useConcierge.js and tdc_intent.js
2. Health Vault & Intelligence Loop integration
3. Omnichannel Admin Comms (WhatsApp + Email)

### Core Architecture
- **Frontend**: React + Tailwind + Shadcn/UI  
- **Backend**: FastAPI + MongoDB  
- **3rd Party**: OpenAI/Claude (Emergent LLM Key), Cloudinary, Razorpay, Gupshup (WhatsApp), Resend (Email)

### What's Been Implemented

#### Session: March 22, 2026 (Fork 2)

**1. Member Inbox Redesign (/notifications) — COMPLETE ✅**
- Outlook-style unified inbox replacing old messy notification list
- 3 collapsible sections: "Waiting on You" (amber), "Active" (green), "Resolved" (gray, collapsed)
- Desktop: 380px left ticket list + right TicketThread split panel
- Mobile: full-width list, tap → full-screen thread
- Warm cream (#F5F2EC) theme, no purple gradients
- Smart message preview (shows actual conversation, filters out Mira briefings)
- Deduplication, search, refresh, unread pink dots
- TicketThread: light theme in split mode, dark in standalone
- Files: `NotificationsInbox.jsx`, `TicketThread.jsx`
- Testing: 18/18 tests passed (iteration_186.json)

**2. Soul Products Image Mapping — COMPLETE ✅**
- Mapped `mockup_url` → `cloudinary_url` for 3,070 breed products
- Was: 0 cloudinary_url → Now: 3,305 active products with images
- Frontend pillar pages now show breed-specific AI products with images
- Verified: /play page shows "Soul Play - Personalised for Mojo" with mockups

**3. Breed Name Normalization — COMPLETE ✅**
- Merged 93 → 51 unique breed names
- Normalized: Title Case → lowercase, spaces → underscores
- Merged variants: "Labrador Retriever" → "labrador", "Cavalier King Charles Spaniel" → "cavalier"

**4. Pillar Name Migration — COMPLETE ✅**
- enjoy → play, fit → play, travel → go, stay → go
- food → dine, memory → farewell, adventure → go
- Updated both `pillar` (singular) and `pillars` (array) fields
- Deduplicated array values after migration
- No old pillar names remain

**5. Dynamic Category Dropdowns (ProductBox) — COMPLETE ✅**
- Replaced hardcoded MAIN_CATEGORIES with dynamic API fetch
- Primary Category dropdown: fetches from `GET /api/admin/pillar-products/sub-categories?pillar=X`
- Sub-Category dropdown: dynamic select (was free-text input)
- Category filter tabs on product list: dynamic chips from DB
- Bulk operations category dropdown: also dynamic
- Celebrate pillar shows 42 categories, Play shows 14, etc.

#### Previous Sessions (Completed)
- Universal Concierge Audit & Wiring (all 12 pillars)
- Pet Health Vault Rebuild (/pet-vault/:petId)
- Health Reminder System (WhatsApp + Email)
- Intelligent Service Desk (Vault data → tickets)
- Two-Way WhatsApp Threading
- Master Sync Re-enabled
- Mira Picks Pagination

### Database Backups
- 30 commerce collections backed up on 2026-03-22
- Backup suffix: `*_backup_20260322`
- Collections: products_master, breed_products, unified_products, services_master, bundles, etc.

### Prioritized Backlog

**Session: March 22, 2026 (Fork 3) — COMPLETE ✅**

**6. EMOTIONAL_COLLECTIONS Pillar Alignment — COMPLETE ✅**
- Replaced old `stay`/`travel` keys with `play`/`go`/`learn`/`shop`/`emergency`/`adopt`/`advisory`/`default`
- Pillar pages (Play, Go, Dine, Farewell) now show correct section names & emojis
- Added safe `exclude?.length` check; new `default` fallback replaces old `celebrate` fallback

**7. Shop Breed Collection — Load More Pagination — COMPLETE ✅**
- BreedCollectionSection refactored with skip-based pagination (12 per page)
- Uses `cloudinary_url || mockup_url` for images (shows actual Cloudinary mockups)
- "Load more for {petName} →" button; filter by type (Bandana, Mug, Frame, etc.)
- All 3,305+ breed products now browsable from /shop

**8. Empty-Breed Products Tagged — COMPLETE ✅**
- 660 products with empty breed field → tagged as `breed="all"`
- Backend `/api/admin/breed-products` and `/api/mockups/breed-products` now include `breed="all"` products in $or queries
- Total visible soul products: 3,305 + 660 = 3,965

**P1 — In Progress**
- [ ] Multi-pillar product support (one product in multiple pillars with per-pillar categories)
- [ ] Product type routing (service → ServiceBox, physical → ProductBox, bundle → Bundles)
- [ ] Bundle curation admin (admin creates bundles from products)

**P1 — Not Started**
- [ ] DB Pillar Migration for products_master and unified_products (BLOCKED: needs user backup confirmation)
- [ ] Activate inactive breeds: indian_spitz (25), labradoodle (25), maltipoo (25)

**P2 — Future**
- [ ] "3 vets near you" in vaccine WhatsApp reminders
- [ ] Medication refill reminders
- [ ] Love pillar (13th pillar)
- [ ] MiraDemoPage.jsx refactor (5,400+ lines)
- [ ] Remove "Skip Payment" from onboarding
- [ ] WhatsApp "BOOK" keyword handler
- [ ] Admin pillar name pills update (Stay→Go, Travel→Go, Enjoy→Play, Fit→Play)

### Test Credentials
- User: `dipali@clubconcierge.in` / `test123`
- Admin: `aditya` / `lola4304`
- Admin portal: `/admin`

## Session: March 22, 2026 (Fork 4) — COMPLETE ✅

### Completed this session:

**Soul Product Fixes:**
- EMOTIONAL_COLLECTIONS updated with all 14 pillar keys (play, go, etc.)
- Shop Breed Collection Load More pagination (12/page)
- 660 empty-breed products tagged as breed="all"
- is_active → active DB migration (3,305 products now visible)
- FarewellSoulPage + AdoptSoulPage SoulMadeCollection added
- ProductCard.jsx fix: strip breed prefix for breed="all" products
- Farewell breed tab now fetches from breed_products collection
- SoulMadeCollection removed from 7 pages (old design)
- is_mockup field tagged on all 3,775 products (breed- prefix = True)
- All breed product APIs default to is_mockup=True filter
- PersonalizedBreedCollection + PersonalisedBreedSection URL safety filter
- products_master sub_category: 4,071 → 0 missing (100% mapped)
- Admin ProductBoxEditor: Auto-fill button + smart formula hint
- FarewellSoulPage + AdoptSoulPage: product card onClick + modal

**Admin Soul Products Manager:**
- Export CSV button (filtered by breed/type/pillar/has_image)
- Pending 705 CSV download button
- Full CRUD Breed Products tab (table, edit, delete, paginated)
- Import CSV modal (bulk upsert)
- New Product Type creator (seeds across all/selected breeds)
- Backend: PUT/DELETE/import/seed-type endpoints

**Static CSVs available:**
- /soul_mockups_clean.csv — 2,409 proper mockups
- /soul_pending_705.csv — 706 pending products

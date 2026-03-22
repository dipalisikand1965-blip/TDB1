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

**P1 — In Progress**
- [ ] Multi-pillar product support (one product in multiple pillars with per-pillar categories)
- [ ] Product type routing (service → ServiceBox, physical → ProductBox, bundle → Bundles)
- [ ] Bundle curation admin (admin creates bundles from products)

**P1 — Not Started**
- [ ] DB Pillar Migration for products_master and unified_products (BLOCKED: needs user backup confirmation)
- [ ] Investigate 660 empty-breed products in breed_products
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

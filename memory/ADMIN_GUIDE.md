# 🐾 The Doggy Company — Complete Admin Guide
## For Claude & Aditya | /admin route | Login: aditya / lola4304
## Generated: Mar 2026

---

## ADMIN URL
```
/admin → AdminDashboard.jsx (7,013 lines)
Login: aditya / lola4304
```

---

## ADMIN PANEL — 5 TAB GROUPS

### GROUP 1: OPERATIONS
| Tab | What it does |
|-----|-------------|
| **Dashboard** | System overview — tickets, orders, revenue, Mira activity, pet count |
| **Service Desk** | All concierge tickets — open/in-progress/resolved, thread view, assign to concierge |
| **Unified Inbox** | WhatsApp-style inbox — all messages by pillar/channel |
| **Finance** | Orders + payments + Razorpay reconciliation + GST reports |
| **Pillar Queues** | Tickets grouped by pillar — queue management |
| **Orders** | All product/service/bundle orders |
| **Fulfilment** | Delivery tracking, fulfilment status |
| **Autoship** | Recurring orders (subscriptions, refills) |

### GROUP 2: MEMBERS
| Tab | What it does |
|-----|-------------|
| **Pet Parents** | All users — search, view profile, membership status |
| **Pet Profiles** | All pets — soul score, breed, health, soul answers, photo |
| **Membership** | Membership plans + subscriber management |
| **Loyalty** | Paw Points ledger — balances, earn history, redemptions |
| **Engagement** | Streaks, active/inactive, re-engagement |
| **Celebrations** | Birthday calendar, upcoming events, cake orders |
| **Celebration Wall** | Pet birthday wall content management |

### GROUP 3: COMMERCE
| Tab | What it does |
|-----|-------------|
| **Product Box** | Add/edit/delete products — price, DALL-E image, category, pillar |
| **Service Box** | Add/edit/delete services — pricing, watercolour gen, pillar |
| **Pricing** | Bulk pricing by pillar/category |
| **Experiences** | Concierge experience packages |
| **Soul Products** | Breed mockup generator — creates bandanas, mugs, journals per breed + Cloudinary |
| **Bundles** | Create/edit curated bundles — pillar, items, pricing, CSV export |

### GROUP 4: CONTENT CMS
| Tab | What it does |
|-----|-------------|
| **Learn CMS** | Topic content, videos, guides for /learn |
| **Paperwork CMS** | Document category content |
| **Care CMS** | Care pillar content blocks |
| **Fit CMS** | Fit pillar content |
| **Pillar CMS** | Generic CMS for any pillar |

### GROUP 5: INTELLIGENCE
| Tab | What it does |
|-----|-------------|
| **Analytics** | User behaviour, pillar engagement, conversion |
| **Reports** | Downloadable reports — orders, revenue, member growth |
| **Comms** | WhatsApp template mgmt, email campaigns, push notifications |
| **Mira Memory** | View/edit Mira's memory tags per pet |

---

## 💳 MEMBERSHIP PLANS (4 paid tiers + free)

| Plan | Price (incl. 18% GST) | Duration | Tier | Mira chats |
|------|----------------------|----------|------|-----------|
| **Free** | ₹0 | Forever | Free | 5/day |
| **Monthly** | ₹99/month | 30 days | Pawsome | Unlimited |
| **Annual** | ₹999/year | 365 days | Pawsome | Unlimited |
| **Premium Annual** | ₹1,999/year | 365 days | Premium | Unlimited + priority |
| **VIP Pack Leader** | ₹4,999/year | 365 days | VIP | Unlimited + dedicated concierge |

**GST**: 18% included in all prices.  
**Payment**: Razorpay (Indian payments, UPI, cards, netbanking)  
**Endpoints**: `GET /api/payments/plans` | `POST /api/payments/create-order` | `POST /api/payments/verify`

---

## 🐾 PAW POINTS LOYALTY SYSTEM

### Tiers (lifetime points earned)
| Tier | Points | Benefits |
|------|--------|---------|
| 🥉 **Bronze** | 0+ | Basic rewards access |
| 🥈 **Silver** | 500+ | 10% bonus points on orders |
| 🥇 **Gold** | 1,500+ | 15% bonus + priority concierge |
| 💎 **Platinum** | 5,000+ | 20% bonus + dedicated manager + VIP events |

### How Points Are Earned
| Action | Points |
|--------|--------|
| Order placed | % of order value (configurable) |
| Soul question answered | +pts per question (shown in onboarding) |
| Referral | Bonus (configurable) |
| Achievement completion | Achievement-based |
| Birthday purchase | Bonus multiplier |
| Streak maintained | Daily streak bonus |

### How Points Are Redeemed
- `/api/paw-points/redeem` → generates `PAW-XXXXXXXX` discount code
- Admin views full ledger in **Loyalty** tab
- **Endpoints**: `GET /api/paw-points/balance` | `GET /api/paw-points/history` | `POST /api/paw-points/redeem` | `GET /api/paw-points/catalog`

---

## 📋 SERVICE DESK WORKFLOW

```
Any "Book →" button → POST /api/service_desk/attach_or_create_ticket
    ↓
Ticket created with: ticket_id, parent_id (member), pet_id, pillar, intent, channel, thread[]
    ↓
Admin: Operations → Service Desk OR Unified Inbox
    ↓
Status: open_mira_only → awaiting_concierge → in_progress → resolved
    ↓
Concierge replies in admin thread → WhatsApp sent to member
    ↓
Member sees in: /my-requests (All | Bookings | Browse | Mira | Resolved)
```

---

## 🖼️ SOUL PRODUCTS — BREED MOCKUP GENERATOR

Admin tab: **Soul Products** → `SoulProductsManager.jsx`

1. Select **breed** (33 breeds: Indie, Labrador, Maltese, Golden Retriever...)
2. Select **product type** (Bandana, Mug, Training Journal, Treat Pouch, Treat Jar, Welcome Mat, Keychain, Frame, Portrait, Blanket, Tote Bag)
3. Select **Target Pillar** (NEW — all 12 pillars)
4. Click **"Generate → [Pillar]"** → AI generates DALL-E mockup
5. Auto-uploaded to Cloudinary → appears in Breed Collection on Shop + pillar Mira Picks
6. **DB target**: `breed_products` collection (3,465 items, 33 breeds × 105 product types)

---

## 🛒 SHOPIFY SYNC

```
Source:    https://thedoggybakery.com/products.json
Trigger:   POST /api/cron/sync-products?secret=midnight-sync-tdb-2025
Schedule:  Daily midnight cron
Result:    Products → products_master (pillar=celebrate + pillar=shop)
390 products synced. Pricing by Shopify (live prices from thedoggybakery.com)
```

---

## 🖼️ CLOUDINARY PIPELINE ENDPOINTS

```
POST /api/ai-images/pipeline/migrate                    — migrate existing images to Cloudinary
POST /api/ai-images/pipeline/services-master?pillar=X  — watercolour per service
POST /api/ai-images/pipeline/bundles?pillar=X          — watercolour per bundle
POST /api/ai-images/pipeline/mira-imagines?pillar=X&breed=Y — breed watercolour
GET  /api/ai-images/pipeline/mira-imagines/{pillar}/{breed}  — get cached URL
```

**Cloudinary account**: `duoapcx1p`  
**Folders**: `tdc/products/`, `tdc/services-master/`, `tdc/bundles/`, `tdc/mira-imagines/`, `tdc/breed-products/`

---

## 📊 DATABASE — KEY COLLECTIONS

| Collection | Records | Purpose |
|------------|---------|---------|
| `pets` | ~20 | Pet profiles + doggy_soul_answers + overall_score |
| `users` | ~10 | User accounts + membership tier + paw_points |
| `memberships` | — | Active membership records |
| `paw_points_ledger` | — | Points earn/spend ledger |
| `products_master` | 5,358 | All products (cleaned, priced, active) |
| `services_master` | 1,025 | All services (watercolour images) |
| `care_bundles` | 27 | All bundles (all pillars) |
| `breed_products` | 3,465 | Soul mockups per breed |
| `service_desk_tickets` | 457+ | Concierge inbox tickets |
| `mira_product_scores` | 7,470+ | AI scores per pet per pillar |
| `mira_imagines_cache` | 5+ | Cloudinary watercolour cache |
| `orders` | 11+ | Purchase history |
| `faqs` | — | FAQ content for /faqs page |
| `page_content` | — | About Us, homepage CMS blocks |
| `user_streaks` | — | Daily engagement streaks |

---

## ❓ ABOUT US / FAQS / MEMBERSHIP PAGES — CMS

| Content | Collection | Admin Tab |
|---------|------------|-----------|
| FAQs | `faqs` | Content → FAQs editor |
| About Us | `page_content` | Content → Pages |
| Membership page copy | `page_configs` | Content → Pages |
| Pillar page content | `pillar_cms_content` | Content → [Pillar] CMS |
| Learn topics/videos | `learn_cms_content` | Content → Learn CMS |
| Care guides | `page_configs` | Content → Care CMS |

---

## 🔑 KEY ADMIN API ENDPOINTS

```
# Members + Pets
GET    /api/admin/members              — all pet parents
GET    /api/admin/pets                 — all pets
POST   /api/admin/membership/override  — manually set tier

# Products (products_master)
GET    /api/admin/pillar-products?pillar=X&category=Y&limit=N
POST   /api/admin/products             — create product
PUT    /api/admin/products/{id}        — update
DELETE /api/admin/products/{id}        — delete

# Services (services_master)
GET    /api/service-box/services?pillar=X
POST   /api/service-box/services       — create service

# Bundles (care_bundles)
GET    /api/bundles?pillar=X
POST   /api/bundles                    — create bundle

# Breed Products (breed_products)
GET    /api/admin/breed-products?breed=X&is_active=true&limit=N

# Mira Intelligence
POST   /api/mira/score-for-pet         — { pet_id, pillar }
GET    /api/mira/claude-picks/{pet_id}?pillar=X&min_score=60

# Service Desk
GET    /api/service_desk/tickets?status=open
POST   /api/service_desk/append_message

# Paw Points
GET    /api/paw-points/balance
POST   /api/paw-points/admin/award     — admin awards bonus points

# Notifications
POST   /api/admin/send-notification    — push to member
POST   /api/whatsapp/send              — send WhatsApp to member

# Shopify
POST   /api/cron/sync-products?secret=midnight-sync-tdb-2025

# Images
POST   /api/ai-images/pipeline/services-master?pillar=X&limit=N
POST   /api/ai-images/pipeline/mira-imagines?pillar=X&breed=Y&limit=N
```

---

## 📱 HOW TO SHARE WITH OTHER CLAUDE SESSIONS

Upload all 5 files directly to Claude (Pro/Teams file upload — they fit easily):

| File | Tokens | What it covers |
|------|--------|---------------|
| `SYSTEM_OVERVIEW.md` | ~5k | Full platform, pillars, APIs, soul score |
| **`ADMIN_GUIDE.md`** | ~6k | This file — membership, rewards, all admin tabs |
| `MIRA_OS_ARCHITECTURE.md` | ~5k | Mira OS, 16 hooks, 60+ components |
| `PAGES_ARCHITECTURE.md` | ~4k | Login, onboarding questions, page specs |
| `PILLAR_ARCHITECTURE_STANDARD.md` | ~3k | 13-point pillar checklist |

**Total**: ~23k tokens — comfortably fits in Claude's context.

**Or paste the 1-page compact version**:
```
Copy: /app/frontend/public/FOR_CLAUDE.txt
Paste at start of any Claude session → Claude instantly knows everything
```

---
## SESSION 85-86 UPDATES (Mar 20-21, 2026)

### CP4 Fixed — Admin Inbox Now Shows Concierge Tickets
The admin Service Desk now fetches from `service_desk_tickets` (PRIMARY) + `tickets` (SECONDARY/orders).
- Endpoint: `GET /api/service_desk/tickets?limit=200`
- Shows: booking_intent, service_request, mira_chat_intent, emergency_alert
- Filters OUT: Pet Wrapped auto-generated tickets (wrapped-*, annual-*, birthday-*)

### Two-Way Inbox — Concierge ↔ Member
- Admin sends reply: `POST /api/service_desk/concierge_reply?ticket_id=X&concierge_name=Y&message=Z`
- Reply lands in `service_desk_tickets.thread` (ALL docs with ticket_id)
- Member sees pink "New reply" dot on /my-requests
- Member taps → calls `POST /api/service_desk/mark_reply_read?ticket_id=X` → dot clears

### Reminders "Refresh & Run" Button
- Fixed: `POST /api/admin/communications/run-scheduler` endpoint created
- Triggers pending reminder checks for next 30 days

### Health Vault — Confirmed Working
- Data persists in `pets.health_vault` (embedded in pet document)
- Test: Mojo's Rabies vaccination (due 2027-03-21) saved and retrievable

### Admin Panel Redesign
- Sidebar: white background (was dark slate), amber/gold accent (#C9973A)
- "Go to Platform →" button added to sidebar header
- Old pillar names fixed: stay→go, enjoy→play, fit→services
- All 80+ admin sections verified wired to real components

### 3-Layer Mira Soul Picks
- Layer 1: breed_products (soul products, always personalised)
- Layer 2: services_master (pillar services, bookable)
- Layer 3: mira_product_scores (AI-scored, fill remaining slots)
- Speed: 45ms (was 2-3 minutes)

### 5 New Soul Product Categories
- breed-custom_portraits ₹2,499 | breed-phone_cases ₹799 | breed-wall_art ₹1,899
- breed-memory_boxes ₹3,499 | breed-birthday_cake_toppers ₹499
- 235 products seeded (47 breeds × 5 types) — images generating in background

### Production Deployment Note
⚠️ Current preview URL: intent-ticket-flow.preview.emergentagent.com
⚠️ Production URL must be: thedoggycompany.com
⚠️ Update REACT_APP_BACKEND_URL and all hardcoded references before going live

---
## SESSION 86 UPDATES (Mar 21, 2026)

### Admin Panel — 3 New Pillar Managers
- `ServicesManager.jsx` — full CRUD for Services pillar (424+ services in services_master)
- `GoManager.jsx` — thin wrapper using PillarManager universal pattern for Go pillar
- `PlayManager.jsx` — thin wrapper using PillarManager universal pattern for Play pillar
- `PillarManager.jsx` — universal admin component (Products/Services/Bundles tabs, search, pagination)
- Wired into Admin.jsx: `case 'services'`, `case 'go'`, `case 'play'`

### Mira OS Page — New Features
- **NEAR ME tab**: 6th OS tab with location-based search. 4 quick prompts (vet, groomer, café, park)
- **Pet Home → button**: floating pill top-right on /mira for quick navigation
- **Streaming**: `useChatSubmit.js` now tries `/api/mira/os/stream` first (word-by-word), falls back to `/api/mira/chat`
- **Soul chips**: Deduplicated (Chicken-free, High energy, Playful nature — all distinct)
- **SoulRadar**: Ambient radar background behind ChatInputBar at 15% opacity

### Mira OS Tab Bar
- 6 tabs now: TODAY, PICKS, SERVICES, NEAR ME, LEARN, CONCIERGE®
- Scrollable on mobile (overflow-x: auto, scrollbar hidden)
- Compact padding (8px/12px, 11px font) for 6-tab display

### Documentation Status
- ADMIN_GUIDE.md: Updated to Mar 21, 2026
- PRD.md: Updated
- complete-documentation.html: v20.0 (needs v21 update)

---
## DATA PERSISTENCE & REDEPLOY SAFETY

### What survives a redeploy:
✅ Users/members (users collection)
✅ Pets and soul profiles (pets collection)
✅ Service desk tickets (service_desk_tickets)
✅ Member notifications, orders, memberships
✅ Soul products (breed_products) — no seed script overwrites these
✅ Mira conversations and memory

⚠️ Product catalog (products_master) — MasterSync upserts on startup
   Admin edits to product names/prices WILL persist (upsert by id)
   but new products added in admin may be deduped if seed runs

### Database config:
- Preview: mongodb://localhost:27017 → pet-os-live-test_database
- 143 collections, 36,751+ documents as of Mar 21, 2026
- For production: needs persistent volume OR MongoDB Atlas

### Generate button fix (Mar 21, 2026):
- Root cause: scoring job blocked the event loop
- Fix: asyncio.Semaphore(1) in mira_score_engine.py
  → Only 1 scoring job at a time
  → Other API calls are never blocked
  → Concurrent scoring attempts are silently skipped (not queued)

# The Doggy Company® — Pet Life Operating System
## Product Requirements Document
## Version 13.4.0 | March 12, 2026

---

## THE VISION
> "We are not a commerce platform. We are a Pet Operating System. The Soul comes first."

The world's first soul-driven Pet Operating System. Every dog has a personality, lifestyle, health story, and emotional world — the Soul. The platform captures this soul and uses it to power every recommendation, every Mira response, and every concierge interaction.

**200+ days built. 22,232 lines in server.py. 221 API endpoints. 51 Soul Questions. 14 Pillars.**

---

## CORE SYSTEM OVERVIEW

### 1. The Pet Soul (The Heart of Everything)
- **51 questions across 8 soul folders**: Identity & Temperament, Family & Pack, Rhythm & Routine, Home Comforts, Travel Style, Taste & Treats, Training & Behaviour, Long Horizon
- **Soul Score / SoulScoreArc** — visual completeness score shown on every pillar hero
- **Auto-enrichment** — learns from orders, bookings, conversations
- **Drip questioning** — progressive profiling, 1 question at a time
- **Soul Intelligence** — feeds Mira context, product recommendations, personalisation
- **Backend**: `pet_soul_routes.py`, `soul_intelligence.py`, `mira_soulful_brain.py`, `pet_score_logic.py`

### 2. Mira — The OS Voice
- **6+ variants**: Mira OS (/mira-os, members-only), Mira Pure (/mira-pure, public), Mira Pure OS, Mira Demo, Mira Original, Mira Pillar Sandbox
- **Capabilities**: Soul-aware responses, streaming, session persistence, ElevenLabs TTS voice, service ticket creation, concierge handoff, context per pillar
- **Ask Mira Bar** — embedded at top of ALL 14 pillars, context-aware
- **Floating Mira Widget** — bottom-right on all pages
- **Backend**: `mira_os.py`, `mira_pure.py`, `mira_soulful_brain.py`, `mira_service_desk.py`, `mira_retention.py`, `mira_concierge_handoff.py`

### 3. Service Desk — Concierge Engine
- Full ticket lifecycle (create → assign → resolve → NPS)
- Priority scoring, SLA breach detection, ticket merging, escalation
- AI-generated draft replies, canned responses, sentiment analysis
- WhatsApp notifications on status changes
- Multi-queue (dining, travel, stay, shop, etc.)
- Real-time concierge dashboard
- **Admin portals**: /agent, /admin/service-desk, /admin/concierge, /admin/concierge-realtime
- **Backend**: `concierge_routes.py` (2,500+ lines), `mira_service_desk.py`, `concierge_engine.py`

### 4. 14 Life Pillars — ALL GOLD STANDARD (March 2026) ✅
Learn | Care | Dine | Fit | Travel | Stay | Enjoy | Celebrate | Emergency | Advisory | Farewell | Adopt | Shop | Paperwork

**Gold Standard Section Order** (every pillar has all of these):
1. Ask Mira Bar (personalised with pet name)
2. Topic Cards Grid (AI watercolor images)
3. Daily Tip (rotating, pillar-specific)
4. How Can We Help? (3 help buckets → trigger Mira)
5. Personalized For Pet (soul-matched: archetype, breed, photo)
6. Guided Paths (step-by-step journeys)
7. Curated Bundles
8. Products Grid
9. Mira Curated Layer
10. Services Section

**CMS**: All 14 pillars are editable from Admin Panel → Pillar CMS

### 5. Member Dashboard (/dashboard) — 15+ Tabs
Overview | My Pets | Services | Orders | Requests | Dining | Celebrations | Stay | Travel | Autoship | Reviews | Addresses | Rewards | Settings | Pet Vault

### 6. Commerce
- **2,409 products** synced from Shopify (all with AI watercolor images)
- **Special features**: Custom Cake Designer, Occasion Box Builder, Autoship, Meal Plan, Voice Order
- **Cart**: CartSidebar component
- **Checkout**: Unified Checkout (Razorpay — BROKEN P2)

### 7. Gamification & Loyalty
- **Paw Points** — earned on orders, soul answers, reviews, referrals
- **Soul Score** — soul completeness percentage (SoulScoreArc visual)
- **Pet Wrapped** (/pet-wrapped) — Spotify-style yearly pet summary
- **Membership Tiers** — Silver/Gold/Platinum (defined, not fully gated)
- **Birthday Engine** — auto-detects pet birthdays, triggers celebrations

### 8. Community
- **Rainbow Bridge Memorial** 💜 — In loving memory of Mystique & Kouros
  - Mark pets as crossing the Rainbow Bridge
  - Memorial creation with tribute message, legacy quote
  - Public Memorial Wall (1 memorial live: Mystique, Shih Tzu, loved by Dipali)
  - AI grief support via Mira ("You're Not Alone")
  - Location: /farewell, scroll ~2200px to dark purple section
- **Notifications Inbox** — iOS Mail-style (/notifications)
- **Pet Vault** (/pet-vault/:petId) — health docs, vaccines, insurance
- **Pet Pass Card** — shareable digital pet identity card

### 9. Admin Panel (/admin)
Credentials: admin `aditya` / `lola4304`
- Product management (add/edit/bulk import/AI images)
- Service management (CRUD by pillar)
- Pillar Page CMS (all 14 pillars)
- Member management & Paw Points
- Orders, analytics, reports (CSV/Excel export)
- Sync to Production (2,409 products in 25 batches — verified working)
- Service desk admin, concierge dashboard
- Rainbow Bridge admin, notifications management
- AI image generation

### 10. Integrations
| Integration | Status | Purpose |
|-------------|--------|---------|
| OpenAI GPT-4o | ✅ LIVE | Mira AI (Emergent Universal Key) |
| Shopify | ✅ LIVE | 2,409 products synced |
| Cloudinary | ✅ LIVE | AI images, pet photos |
| Google Places | ✅ LIVE | Nearby vets, groomers |
| OpenWeatherMap | ✅ LIVE | Weather-aware recommendations |
| YouTube Data API | ✅ LIVE | Training videos in Learn |
| ElevenLabs TTS | ✅ LIVE | Voice ordering |
| WhatsApp Business | ✅ LIVE | Service desk notifications |
| MongoDB Atlas | ✅ LIVE | Primary database |
| Razorpay | ❌ BROKEN P2 | Payment checkout |
| Instagram | 🔵 PLANNED | Celebration Wall feed |

---

## ALL FRONTEND ROUTES

### Public
`/` Home | `/about` | `/mira` | `/mira-pure` | `/mira-pure-os` | `/login` | `/register` | `/policies` | `/search` | `/feedback` | `/autoship`

### 14 Pillars
`/learn` | `/care` | `/dine` | `/fit` | `/travel` | `/stay` | `/enjoy` | `/celebrate` | `/emergency` | `/advisory` | `/farewell` | `/adopt` | `/shop` | `/paperwork`

### Member (Protected)
`/dashboard` | `/mira-os` | `/pet-soul/:petId` | `/pet-vault/:petId` | `/my-pets` | `/my-tickets` | `/notifications` | `/tickets/:ticketId` | `/checkout` | `/custom-cake` | `/voice-order` | `/pet-soul-onboard` | `/soul-builder` | `/join` | `/membership` | `/pet-wrapped` | `/pet-home` | `/add-pet` | `/payment/success`

### Admin (Admin Protected)
`/admin` | `/admin/service-desk` | `/admin/services` | `/admin/concierge` | `/admin/concierge-realtime` | `/admin/mira-concierge` | `/admin/docs` | `/agent` | `/concierge-dashboard`

### B2B / Demo
`/demo/dreamfolks` | `/mira-pillar-sandbox` | `/mira-embed` | `/concierge-embed` | `/mira-landing-embed` | `/pet-soul-embed`

---

## KNOWN ISSUES

| Priority | Issue | Status |
|----------|-------|--------|
| P1 | Stay pillar services show stock photos (not watercolor) | Open — needs top_picks_routes.py trace |
| P2 | Razorpay checkout fails (body error) — blocks revenue | Open |
| P2 | Mobile member dashboard UI scrambled | Open |
| P3 | AI image generation non-persistent (BackgroundTasks vs Celery) | Open |
| P3 | Membership tiers not enforced (Silver/Gold/Platinum defined but no gates) | Open |

---

## ROADMAP

### P1 (Next)
- Finish the final soul/personalization audit sweep for any remaining weaker pillar moments
- Fix Stay pillar service images
- Investigate Sync to Production `db_name` failure thoroughly
- Fix Razorpay checkout

### P2 (Near Term)
- Fix mobile dashboard responsiveness
- Membership tier enforcement + upgrade prompts
- Paw Points redemption at checkout
- Soul 8-folder wizard completion UI

### P3 (Future)
- Instagram integration (Celebration Wall)
- Celery/Redis for persistent background tasks
- Advanced service desk (role management, automations)
- Partner/franchise portal
- Pet Wrapped auto-trigger at year end

---

## KEY FILES REFERENCE

```
/app/backend/
├── server.py                    # 22,232 lines, 221 API endpoints
├── pet_soul_routes.py           # 51 soul questions, 8 folders
├── soul_intelligence.py         # Soul data processing
├── mira_os.py                   # Core Mira intelligence
├── mira_pure.py                 # Public Mira
├── mira_soulful_brain.py        # Soul-to-prompt translator
├── mira_service_desk.py         # Mira→ticket creation
├── mira_concierge_handoff.py    # AI-to-human handoff
├── concierge_routes.py          # 2,500+ lines service desk
├── concierge_engine.py          # Priority/SLA/routing
├── top_picks_routes.py          # Product recommendations
└── ...40+ more backend files

/app/frontend/src/
├── App.js                       # 670 lines, all routes
├── pages/                       # 70+ page components
│   ├── LearnPage.jsx            # GOLD STANDARD template
│   ├── CarePage.jsx             # ✅ Gold Standard
│   ├── DinePage.jsx             # ✅ Gold Standard
│   ├── FitPage.jsx              # ✅ Gold Standard
│   ├── TravelPage.jsx           # ✅ Gold Standard
│   ├── StayPage.jsx             # ✅ Gold Standard
│   ├── EnjoyPage.jsx            # ✅ Gold Standard
│   ├── CelebratePage.jsx        # ✅ Gold Standard
│   ├── EmergencyPage.jsx        # ✅ Gold Standard (Ask Mira added Mar 2026)
│   ├── AdvisoryPage.jsx         # ✅ Gold Standard
│   ├── FarewellPage.jsx         # ✅ Gold Standard (Rainbow Bridge 💜)
│   ├── AdoptPage.jsx            # ✅ Gold Standard
│   ├── ShopPage.jsx             # ✅ Gold Standard
│   ├── PaperworkPage.jsx        # ✅ Gold Standard (Topics Grid added Mar 2026)
│   ├── MemberDashboard.jsx      # 15+ tab dashboard
│   ├── MiraDemoPage.jsx         # /mira-os flagship
│   ├── PetSoulPage.jsx          # Soul profile
│   └── ...55+ more pages
└── components/
    ├── PillarGoldSections.jsx   # Shared: DailyTip, HelpBuckets, GuidedPaths
    ├── RainbowBridgeMemorial.jsx # 💜 Memorial creation
    ├── RainbowBridgeWall.jsx    # Public memorial wall
    ├── PillarTopicsGrid.jsx     # Topic cards
    ├── SoulScoreArc.jsx         # Soul score visual
    ├── LivingSoulOrb.jsx        # Animated soul orb
    └── ...60+ more components
```

---

## CREDENTIALS (TEST)
- **Member**: dipali@clubconcierge.in / test123
- **Admin**: aditya / lola4304

---

## CHANGELOG

### March 12, 2026 — v13.4.0 — FIT / DINE GOLD-STANDARD CORRECTIONS ✅
- Corrected **Fit** top-section sequence so the core Gold Standard now flows with Ask Mira → Daily/Help → Personalized layer → Guided Paths in the correct order near the top of the page
- Corrected **Dine** so personalized picks now sit in the earlier personalized section instead of appearing later out of order
- Fixed **Dine nearby places display** by wiring the carousel to the real fetched data and re-fetching when the detected city resolves, so live nearby dining cards now render instead of empty skeletons
- Verified on preview with member login: Fit section order now places personalized content before guided paths, and Dine shows live nearby pet-friendly spots with visible reserve buttons

### March 12, 2026 — v13.3.0 — ADMIN MEDIA + IMAGE STYLE FIXES ✅
- Fixed **product image upload persistence** so admin uploads now save back to `products_master` correctly (not just side collections)
- Product and Service editors now allow image upload even on **new unsaved drafts**; user can upload first and then save the record
- Added generic **bundle** and **experience** Cloudinary upload endpoints to support admin media workflows consistently
- Corrected AI style direction so **Services** generate as illustrative watercolor and **Bundles** generate as watercolor compositions, while product image flows remain realistic/product-photography oriented
- Verified backend upload flows end-to-end for products/services/bundles and verified `/api/nearby/places` returns live results for Stay / Dine / Advisory-style queries

### March 12, 2026 — v13.2.0 — SOUL LAYER ROLLOUT CONTINUED ✅
- Added a reusable `PillarSoulLayer` component to speed up Pet OS rollout without bloating page files
- Extended visible soul/personalization layers on **Emergency, Advisory, Farewell, and Learn** for logged-in users
- Extended **Shop** with Soul Made + breed-smart layer so the commerce experience feels more personal, not generic
- Verified on preview with member login that Emergency, Advisory, Farewell, Learn, and Shop now surface new personalized layers for Mojo

### March 12, 2026 — v13.1.0 — FULL DOCS + ADOPT SOUL LAYER ✅
- `complete-documentation.html` now regenerates from the full `/app/memory` markdown set (296 docs / 88,362 lines), not a truncated subset
- Adopt pillar now shows a real Pet OS layer for logged-in users: Soul Score, pet photo, Mira love note, soul-aware adoption guidance, personalized picks, Soul Made products, breed-smart picks, and Mira picks
- AdoptPage fixed to use the shared Pillar pet context correctly (`pets` from `PillarContext`), restoring logged-in personalization flow
- Verified on preview: `/complete-documentation.html` serves correctly and `/adopt` shows personalized Mojo content after login

### March 12, 2026 — v13.0.0 — ALL 14 PILLARS GOLD STANDARD ✅
- Created PillarGoldSections.jsx (PillarDailyTip, PillarHelpBuckets, PillarGuidedPaths)
- Updated 10 pages to Gold Standard: Travel, Stay, Enjoy, Celebrate, Emergency, Advisory, Farewell, Adopt, Shop, Paperwork
- Added Ask Mira Bar to EmergencyPage (was missing)
- Added Topics Grid to PaperworkPage (was missing)
- Verified Sync-to-Production working (2,409 products)
- Confirmed Rainbow Bridge memorial working (Mystique 💜 visible at /farewell ~2200px scroll)
- Comprehensive documentation rebuild (complete-documentation.html 213→880 lines)
- PRD rebuilt to capture full 200+ day system scope

### Earlier Sessions (summarised)
- CMS Enhancement: Help Buckets, Daily Tips, Guided Paths editable per pillar
- Product Image Overhaul: All 209+ products with AI watercolor images
- CarePage, DinePage, FitPage brought to Gold Standard
- Service Desk concierge engine built
- Member Dashboard (15+ tabs) built
- Mira OS multiple variants built
- 51 Soul Questions (8 folders) built
- Pet Soul scoring and intelligence built
- Rainbow Bridge Memorial built (Mystique 💜)
- Pet Vault built
- Pet Wrapped built
- Voice Order built
- Shopify sync (2,409 products) integrated
- Google Places, OpenWeatherMap, YouTube, ElevenLabs integrated
- Admin Panel with 221 endpoints built

---

*In loving memory of Mystique 💜 and Kouros — who taught us what unconditional love truly means.*

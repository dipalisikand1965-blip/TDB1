# The Doggy Company — Platform PRD
## Last Updated: 2026-03-25

## Original Problem Statement
Build a premium pet lifestyle platform with 12 pillars (Dine, Care, Go, Play, Learn, Celebrate, Shop, Services, Adopt, Farewell, Emergency, Paperwork). AI-powered by Mira. Mobile-first consumer experience with desktop parity. Go-live ready.

## Architecture
- **Frontend**: React (CRA) + inline styles + Shadcn/UI components
- **Backend**: FastAPI + MongoDB
- **AI**: OpenAI GPT-4o + Claude Sonnet via Emergent LLM Key (Mira AI)
- **Integrations**: Cloudinary (images), Razorpay (payments), Gupshup (WhatsApp)
- **Pattern**: Desktop pages preserved as-is. Mobile pages split via `isDesktop` check (window.innerWidth >= 1024). Mobile pages are separate *MobilePage.jsx files imported into the parent Soul page.

## What's Complete (Locked)
### Desktop (DO NOT TOUCH)
- All 12 pillar Soul pages fully functional
- Admin panel (7000+ line Admin.jsx)
- Member dashboard, onboarding, checkout, cart
- Mira AI chat widget per pillar
- Service booking flows (Care 8 flows, Go 8 flows, Emergency services)
- Product grids with Mira Intelligence filtering
- Category strips with content modals
- PersonalisedBreedSection, MiraImaginesBreed, SoulMadeCollection
- Full DB sync tool (preview → production via HTTPS)

### Mobile — Completed This Session
- **Responsive split pattern**: All 12 pillar pages now detect viewport and serve mobile vs desktop
- **11 mobile page files created**: Care, Celebrate, Go, Play, Learn, Shop, Services, Adopt, Farewell, Emergency, Paperwork
- **Dine v11**: Fully wired mobile page (reference implementation)
- **All mobile pages have**: Dark gradient hero, pet photo, breed, allergy chips, PillarSoulProfile, Mira bar, category strip, concierge CTA, NearMe, Soul Made card
- **Product grids wired**: All mobile pages fetch from `/api/admin/pillar-products?pillar={pillar}` and render SharedProductCard in 2-col grid
- **ProductDetailModal**: Wired on all mobile pages
- **Celebrate**: Category pills → CelebrateContentModal, Breed Cakes → DoggyBakeryCakeModal, MiraBirthdayBox → BirthdayBoxBuilder multi-step, Mira Picks → bottom sheet modal
- **Care**: Products in Mira Picks modal (behind Mira bar tap)
- **Play/Go**: CategoryStrip → PlayContentModal/GoContentModal
- **Bottom nav removed**: On all pillar pages for mobile (HOME/INBOX/ORDERS/MY PET), Mira orb preserved
- **Footer hidden**: On mobile pillar pages
- **PersonalisedBreedSection**: Restyled empty state to dark premium card
- **Hero padding**: 32px top on all mobile pillar pages
- **Duplicate profile cards removed**: Celebrate, Care, Go
- **tdc.book**: Enhanced with notes, metadata, service_type, urgency
- **applyMiraIntelligence**: Added to Celebrate, Advisory pages
- **.slice(0,4) caps**: Removed/increased across Celebrate, Play, Advisory, Collection, Mira, Dine, Services

### Cross-Platform Fixes
- Fixed `book is not defined` error on DineSoulPageDesktopLegacy
- Fixed CelebratePage JSX comment syntax error
- Full DB sync: ObjectId serialization fixed with bson.json_util
- All collections shown in sync diff/results (not just 13 critical)

## What's NOT Done — MOBILE WIRING GAPS

### Priority 1: Top-Level Tabs (Desktop Parity)
Every desktop pillar page has 2-3 top-level tabs that organize content. Mobile pages are MISSING these:

| Pillar | Desktop Tabs | Mobile Status |
|--------|-------------|--------------|
| **Dine** | Eat & Nourish / Dine Out | ✅ Done in v11 |
| **Care** | Products / Personalised + sub-category tabs | ❌ Missing — shows flat product grid |
| **Go** | Products / Personalised + sub-category tabs | ❌ Missing — shows flat product grid |
| **Play** | Products / Personalised + sub-category tabs | ❌ Missing — shows flat product grid |
| **Learn** | 7 dimensions × (Products / Videos / Services) | ❌ Missing — shows flat product grid |
| **Celebrate** | Category pills → modals | ✅ Done |
| **Shop** | No tabs needed | ✅ Done |
| **Services** | 5 service groups with sub-services | ❌ Missing — no service groups |
| **Adopt** | Find Your Dog / Book Guidance / Find Rescue | ❌ Missing |
| **Farewell** | Legacy & Memorial / Get Support / Find Care | ❌ Missing |
| **Emergency** | Emergency Kit / Book Help / Find Vet | ❌ Missing |
| **Paperwork** | Products / Services / Advisory per dimension | ❌ Missing |

### Priority 2: Service Booking Flows
Desktop has multi-step service booking flows. Mobile is missing all of them:
- **Care**: 8 booking flows (Grooming, Vet Visit, Boarding, etc.)
- **Go**: 8 booking flows (Pet Taxi, Travel Kit, Pet-Friendly Hotels, etc.)
- **Emergency**: Emergency service dispatch flows
- **Services**: Cross-pillar service booking

### Priority 3: Missing Desktop Components on Mobile
- **MiraImaginesCard**: Breed-AI suggestion cards (desktop has, mobile doesn't render them individually)
- **SoulMadeCollection**: Inline breed mockup product grid
- **BuddyMeetup**: Play-specific social feature
- **DocumentVault**: Paperwork-specific document storage

### Priority 4: Dine Pills Fix
Dine category pills (Daily Meals, Treats, Supplements, etc.) should open DineContentModal when tapped — same pattern as Celebrate pills. Currently they filter inline products instead.

### Priority 5: Font Size Consistency
Dine v11 font sizes are the reference. All other mobile pages should match:
- Hero title: fontSize:20
- Sub-heading: fontSize:14
- Body: fontSize:13
- Small/accent: fontSize:11-12

### Priority 6: Customer-Facing Page Audit
These non-pillar pages need mobile audit:
- /join (MiraMeetsYourPet) — onboarding
- /login, /register, /forgot-password — auth pages
- /dashboard (MemberDashboard) — member area
- /checkout — payment
- /my-pets, /pet-home — pet management
- /my-requests — service desk tickets
- /cart — shopping cart
- /search — search results
- /about, /faqs, /policies — static pages

### Priority 7: Pre-Launch Items
- 38 products flagged with `needs_ai_image: true` — deactivate or fix
- Production DB migration (use platform "Use new database" on deploy)
- Admin tab performance optimization

## Key Files Reference
### Mobile Pages (src/pages/)
- DineSoulPage.jsx (1102 lines — reference implementation)
- CelebrateMobilePage.jsx (471 lines — most complete after Dine)
- CareMobilePage.jsx (246 lines)
- GoMobilePage.jsx (191 lines)
- PlayMobilePage.jsx (124 lines)
- LearnMobilePage.jsx (107 lines)
- ShopMobilePage.jsx (103 lines)
- EmergencyMobilePage.jsx (95 lines)
- PaperworkMobilePage.jsx (91 lines)
- AdoptMobilePage.jsx (87 lines)
- FarewellMobilePage.jsx (85 lines)
- ServicesMobilePage.jsx (74 lines)

### Desktop Pages (DO NOT MODIFY)
- DineSoulPageDesktopLegacy.jsx, CareSoulPage.jsx, GoSoulPage.jsx, PlaySoulPage.jsx, LearnSoulPage.jsx, CelebratePageNew.jsx, ShopSoulPage.jsx, ServicesSoulPage.jsx, AdoptSoulPage.jsx, FarewellSoulPage.jsx, EmergencySoulPage.jsx, PaperworkSoulPage.jsx

### Shared Components
- Components per pillar: /app/frontend/src/components/{pillar}/
- Content modals: Care, Celebrate, Dine, Go, Play (all have ContentModal)
- Category strips: Care, Celebrate, Dine, Go, Play (all have CategoryStrip)
- Common: PersonalisedBreedSection, MiraImaginesBreed, MiraImaginesCard, SharedProductCard, ProductDetailModal, PillarSoulProfile, SoulMadeModal

### Backend
- server.py — main FastAPI app
- admin_routes.py — admin endpoints including full DB sync

## 3rd Party Integrations
- OpenAI/Claude: Emergent LLM Key (Mira AI)
- Cloudinary: User API Key (images)
- Razorpay: User API Key (payments)
- Gupshup: User API Key (WhatsApp)

## Database
- MongoDB: 177 collections, 66,046 documents
- Key: products_master, services_master, pets, users, orders, service_desk_tickets

# The Doggy Company - Product Requirements Document

## Original Problem Statement
Building **The Doggy Company**, a "Pet Life Operating System" designed as a pet-first platform.

---

## Session 15 - Farewell & Shop Admin Managers (January 25, 2026)

### COMPLETED: Full Admin Manager Implementation

**New Backend Routes Created:**
1. `/app/backend/farewell_routes.py` - Complete Farewell pillar API
   - GET/POST/PUT/DELETE for products, partners
   - Service request management
   - Stats, settings, seed data endpoints
   
2. `/app/backend/shop_routes.py` - Complete Shop pillar API
   - Products CRUD with unified sync
   - Orders management
   - Inventory tracking
   - Sales reports
   - CSV import/export

**New Frontend Components:**
1. `/app/frontend/src/components/admin/FarewellManager.jsx`
   - Tabs: Requests, Partners, Products, Settings
   - Stats dashboard with colorful cards
   - CSV export for requests and products
   - Partner management with service types
   - Product CRUD with categories (urns, keepsakes, memorial, comfort)
   - Seed data functionality
   
2. `/app/frontend/src/components/admin/ShopManager.jsx`
   - Tabs: Products, Orders, Inventory, Reports, Settings
   - Stats: products, orders, revenue, inventory alerts
   - Sync status banner (products vs unified_products)
   - Order workflow: pending → processing → shipped → delivered
   - Top selling products report
   - Category distribution chart
   - Pricing & Paw Rewards settings

**Admin Password Change Email Notification:**
- Updated `/app/backend/server.py` change-password endpoint
- Sends email notification to `dipali@clubconcierge.in` when admin password is changed

**Data Seeded:**
- 6 farewell products (urns, keepsakes, portraits)
- 3 farewell partners (cremation, burial, transport services)

### VERIFIED CREDENTIALS:

**🔑 ADMIN PORTAL:**
- URL: https://miraai.preview.emergentagent.com/admin
- Username: `aditya`
- Password: `lola4304`

**👤 MEMBER LOGIN:**
- URL: https://miraai.preview.emergentagent.com/login
- Email: `dipali@clubconcierge.in`
- Password: `lola4304`

**📧 Admin Notification Email:** `dipali@clubconcierge.in`

---

## Session 15.8 - Product & Bundle Audit (January 25, 2026)

### PRODUCT SEEDING COMPLETE - ALL 14 PILLARS:

| Pillar | Products | Sample Product | Price |
|--------|----------|----------------|-------|
| Celebrate | 218 | Pick-A-Treat Pup Box | ₹1,199 |
| Dine | 5 | Pet Café Visit | ₹499 |
| Stay | 5 | Pet Hotel Standard Room | ₹1,499 |
| Travel | 5 | Pet Travel Carrier | ₹2,499 |
| Care | 6 | Hemp Oil | ₹350 |
| Enjoy | 5 | Dog Park Meetup Pass | ₹299 |
| Fit | 5 | Dog Running Session | ₹499 |
| Learn | 2 | Professional Training | ₹299 |
| Advisory | 5 | Nutrition Consultation | ₹999 |
| Paperwork | 5 | Pet Insurance Assistance | ₹499 |
| Emergency | 5 | 24/7 Vet Hotline Access | ₹999 |
| Adopt | 5 | Adoption Counselling | ₹799 |
| Farewell | 6 | Ceramic Memorial Urn | ₹3,500 |
| Shop | 394 | Various products | Various |

**TOTAL**: 460 products with prices
**BUNDLES**: 7 bundles

### What Was Done:
1. Created seed products for missing pillars (Dine, Stay, Travel, Enjoy, Fit, Advisory, Paperwork, Emergency, Adopt)
2. Synced pillar-specific products to unified_products collection
3. Fixed 6 products with missing prices
4. Verified Product Box API returns all pillar products correctly

### API Endpoint:
- `/api/product-box/products?pillar={pillar}` - Returns products by pillar

### ISSUES FIXED:

**1. Adopt Admin Page Crashing (FIXED)**
- Issue: Page crashed with "Oops! Something went wrong"
- Root Cause: `SelectItem value=""` - empty string value causes Radix UI Select to crash
- Fix: Changed `value=""` to `value="all"` in AdoptManager.jsx line 442
- File: `/app/frontend/src/components/admin/AdoptManager.jsx`

**2. Mira AI Repeating "Before we go any further..." (FIXED)**
- Issue: Mira was repeating the intro phrase in every message
- Root Cause: Prompt said "start of every NEW interaction" which LLM interpreted as every message
- Fix: Added explicit conversation state awareness instructions:
  - Check conversation history before each response
  - Only use intro phrase when there is NO chat history
  - Track which questions have been answered
  - Never loop back, always progress forward
- File: `/app/backend/mira_routes.py` lines 1095-1127 and 1176-1195

**3. Service Desk Mira Draft (VERIFIED WORKING)**
- Endpoint `/api/tickets/ai/draft-reply` works correctly
- Returns professional, personalized drafts based on ticket content

**4. Join/Sign Up Buttons (VERIFIED PRESENT)**
- Located at bottom of mobile hamburger menu
- "Join now" - Pink gradient button with sparkle icon
- "Sign in" - Regular button with user icon
- Both buttons fully visible and functional

### MOBILE ISSUES FIXED:

**1. MiraContextPanel Blocking Content (FIXED)**
- Issue: Mira panel took up entire mobile screen, blocking products
- Fix: Panel now starts minimized on mobile (`position='bottom'` triggers `isMinimized=true`)
- File: `/app/frontend/src/components/MiraContextPanel.jsx` line 44-47

**2. Mobile Navigation Menu Cut Off (FIXED by Testing Agent)**
- Issue: Menu items were shifted left by 72px, cutting off text ("elebrate" instead of "Celebrate")
- Root Cause: Logo width (465px) exceeded viewport (393px), causing horizontal overflow
- Fixes Applied:
  - Compact logo on mobile (icon only): `Navbar.jsx` lines 370-371
  - Added `overflow-x-hidden` to nav: `Navbar.jsx` line 365
  - Added `overflow-x-hidden` to container: `Navbar.jsx` line 366
  - Mobile menu proper sizing: `w-full max-h-[calc(100vh-8rem)] overflow-y-auto`

### MOBILE AUDIT RESULTS (All Pass ✅):
| Feature | Status | Notes |
|---------|--------|-------|
| Homepage | ✅ | Hero, CTAs, stats visible |
| Hamburger Menu | ✅ | All 14 pillars visible with icons |
| Shop Page | ✅ | Products visible, Mira minimized |
| Login Page | ✅ | Form usable, login works |
| Dashboard | ✅ | Pet info, Soul score visible |
| Product Detail | ✅ | Add to cart works |
| Cart Sidebar | ✅ | Opens/closes correctly |
| Pillar Pages | ✅ | Content not blocked by Mira |
| Checkout | ✅ | Form visible, buttons tappable (361x48px) |

### AUDIT RESULTS:

**✅ AUTHENTICATION FLOWS:**
- Admin Login: PASS
- Member Login: PASS
- Member Registration: PASS

**✅ SERVICE REQUEST FLOW:**
- Farewell Request creates ticket: PASS
- Service Desk shows 230 open tickets: PASS
- Command Center queue active: PASS (34 items)

**✅ PRODUCT AUDIT:**
- Products Collection: 396
- Unified Products: 396 (SYNCED ✅)
- In Stock: 385
- Out of Stock: 11

**✅ CART & CHECKOUT:**
- Cart is CLIENT-SIDE (localStorage) - by design
- Cart Snapshot Endpoint: PASS
- Orders Create Endpoint: PASS
- My Orders Endpoint: PASS

**✅ ADMIN PANEL:**
- Dashboard Stats: PASS
- Agents List: PASS
- Members Directory: PASS (at /api/admin/members/directory)
- Farewell Manager: PASS
- Shop Manager: PASS

**✅ CSV EXPORT ADDED TO:**
- MembersTab.jsx
- AgentManagement.jsx
- ChatsTab.jsx
(Total: 25+ components now have CSV export)

### API Endpoints Working:
- `/api/farewell/stats` ✅
- `/api/farewell/products` ✅
- `/api/farewell/admin/partners` ✅
- `/api/shop/stats` ✅
- `/api/shop/products` ✅
- `/api/shop/orders` ✅
- `/api/admin/login` ✅
- `/api/auth/login` ✅
- `/api/admin/change-password` ✅ (now sends email notification)

---

## Session 14 - Guest User Flow & Admin Updates (January 25, 2026)

### MAJOR UPDATE: All Pillars Open to Guest Users
**No login required** to use any pillar feature. Users can:
- Submit requests (Fit, Care, Enjoy, Learn, etc.)
- RSVP to events
- Add products to cart
- Request services (Farewell, Advisory, etc.)

### Guest User Flow Changes

**Frontend Pages Updated (5 files):**
1. `FitPage.jsx` - Guest pet entry form (name, breed, weight, age) + contact fields
2. `EnjoyPage.jsx` - Guest RSVP with manual pet details
3. `LearnPage.jsx` - Guest training request + enrollment
4. `PaperworkPage.jsx` - Fixed Add to Cart onClick handler
5. `FarewellPage.jsx` - Guest service request with pet details

**Backend Updates (2 files):**
1. `enjoy_routes.py` - Made `pet_id` Optional in ExperienceRSVP model
2. `server.py` - Farewell endpoint uses optional auth for guest support

### Admin Panel Updates

**Files Updated:**
- `AgentManagement.jsx` - Updated PILLAR_PERMISSIONS with all 14 pillars
- `Admin.jsx` - Added Farewell, Adopt, Shop tabs to PILLAR TOOLS
- `AdoptManager.jsx` - Fixed SelectItem empty value error

### Test Reports
- `/app/test_reports/iteration_70.json` - Backend & API tests (100% pass)
- `/app/test_reports/iteration_71.json` - Guest user flow tests (100% pass)

---

## Session 13 - Complete 14 Pillar Consistency Audit (January 25, 2026)

### THE 14 CANONICAL PILLARS
1. 🎂 **Celebrate** - Birthday cakes, celebrations, custom treats
2. 🍽️ **Dine** - Pet-friendly restaurants, reservations
3. 🏨 **Stay** - Pet hotels, boarding, pawcation
4. ✈️ **Travel** - Pet relocation, transport, documentation
5. 💊 **Care** - Veterinary, grooming, wellness
6. 🎾 **Enjoy** - Events, activities, experiences
7. 🏃 **Fit** - Fitness, weight management, exercise
8. 🎓 **Learn** - Training, education, behaviour courses
9. 📄 **Paperwork** - Documents, certifications, records
10. 📋 **Advisory** - Expert consultations, guidance
11. 🚨 **Emergency** - Urgent help, lost pet, accidents
12. 🌈 **Farewell** - End-of-life support, memorials
13. 🐾 **Adopt** - Adoption assistance, rescue connections
14. 🛒 **Shop** - Premium pet products, nutrition

### Files Updated for Pillar Consistency

**Frontend Admin Components:**
- `/app/frontend/src/components/admin/ConciergeCommandCenter.jsx` - Updated PILLARS array
- `/app/frontend/src/components/admin/UnifiedInbox.jsx` - Updated PILLARS object
- `/app/frontend/src/components/admin/ServiceDesk.jsx` - Updated PILLAR_VIEWS & DEFAULT_CATEGORIES
- `/app/frontend/src/components/admin/AdvancedAnalyticsDashboard.jsx` - Updated PILLARS array
- `/app/frontend/src/components/admin/UnifiedProductBox.jsx` - Updated ALL_PILLARS array

**Frontend User Components:**
- `/app/frontend/src/components/PersonalizedDashboard.jsx` - Updated PILLAR_ICONS mapping
- `/app/frontend/src/components/ReportsManager.jsx` - Updated pillar tabs (14 pillars)
- `/app/frontend/src/pages/MemberDashboard.jsx` - Updated pillar grid (14 pillars)
- `/app/frontend/src/pages/ProductDetailPage.jsx` - Fixed toast import path

**Backend:**
- `/app/backend/unified_product_box.py` - Updated ALL_PILLARS, CATEGORY_TO_PILLARS, TAG_TO_PILLARS
- `/app/backend/notification_engine.py` - Updated PILLAR_TYPES
- `/app/backend/mira_routes.py` - Updated PILLARS dictionary with all 14
- `/app/backend/server.py` - Updated Mira AI system prompt to reference 14 pillars

### What Was Fixed
1. Removed obsolete pillars: Feed, Groom, Play, Train, Insure, Club, Community, Concierge
2. Added missing pillars: Enjoy, Fit, Learn, Paperwork, Advisory, Emergency
3. Standardised icons across all components
4. Updated API endpoint `/api/product-box/config/pillars` returns correct 14 pillars
5. Fixed ProductDetailPage.jsx toast import error

### Verification
- Backend API confirmed: 14 pillars returned ✅
- Admin dashboard shows all pillar tools ✅
- Footer displays all 14 pillars correctly ✅
- Service Desk shows all 14 pillar filters ✅
- Shop page shows 790 products, 770 with images ✅
- Product Detail Page navigation and Add to Cart working ✅
- Adopt page shows 5 pets correctly ✅
- Emergency page Add to Cart for bundles fixed ✅

### Test Report
- `/app/test_reports/iteration_69.json` - 100% pass rate

---

## Session 12 - Comprehensive Dashboard Audit & Pillar Build-Out (January 25, 2026)

### Completed This Session

**1. 🔧 PET SOUL AUTO-POPULATION**
- Fixed UnifiedPetPage.jsx to auto-fill Pet Soul questions (name, breed, gender, dob) from pet's root properties
- Progress calculation now includes core pet fields

**2. 🧭 NAVIGATION & FOOTER UPDATES**
- Added Adopt, Farewell, Shop to Navbar "More" dropdown with sub-menus
- Footer already had all pillar links - verified working

**3. 🐕 ADOPT PILLAR - FULL IMPLEMENTATION**
- Registered AdoptPage.jsx in App.js router
- Imported and included adopt_router in server.py
- Fixed SelectItem empty value errors
- Seeded 5 adoptable pets, 2 shelters, 2 events
- API endpoints working: /api/adopt/pets, /api/adopt/stats, /api/adopt/events

**4. 📊 DASHBOARD AUDIT & FIXES**
- Fixed 14 pillar icons with correct paths:
  - Groom → Fit, Play → Enjoy, Train → Learn, Insure → Advisory
  - Community → Emergency
  - Fixed paths: /pillar/adopt → /adopt, /pillar/farewell → /farewell, /products → /shop
- All tabs verified working: Overview, Rewards, Mira AI, Orders, Celebrations, Dining, Stay, Travel, Autoship, Reviews, Pets, Addresses, Settings

**5. 🖼️ PHOTO & SCORE ISSUES**
- Photo upload endpoint working correctly
- Scores consistent across all dashboard views (hero, gamification, navbar)
- Fixed Lola's pet record (score calculated, bad photo URL removed)

### Test Results (iteration_66.json)
- All 5 features verified working
- 100% pass rate

### Files Modified
- `/app/frontend/src/pages/MemberDashboard.jsx` - Fixed pillar icons paths
- `/app/frontend/src/pages/UnifiedPetPage.jsx` - Pet Soul auto-population
- `/app/frontend/src/pages/AdoptPage.jsx` - Fixed SelectItem values
- `/app/frontend/src/components/Navbar.jsx` - Added Adopt/Farewell/Shop pillars
- `/app/frontend/src/App.js` - Registered AdoptPage, imported adopt_router
- `/app/backend/server.py` - Imported and included adopt_router

---

## Session 11 - World-Class Features Complete (January 25, 2026)

### All Features Delivered

**1. 🎮 GAMIFICATION BANNER** - Progress tracking with milestones
**2. 🏆 ACHIEVEMENT SYSTEM** - 10 badges with confetti celebrations
**3. 🎁 PAW POINTS REDEMPTION** - Full rewards catalog with tiers
**4. 💬 MIRA AI CONVERSATION HISTORY** - Past chats viewable in dashboard
**5. 🏷️ AUTO-TAGGED 394 PRODUCTS** - All products assigned to pillars
**6. 🔧 ONBOARDING AUTO-FILL FIX** - Soul answers pre-populated from onboarding
**7. ✨ SOUL WHISPER™** - Daily questions via WhatsApp in Settings
**8. 🎬 SOUL EXPLAINER VIDEO** - Animated 7-slide storytelling component
**9. 💰 ACHIEVEMENT POINTS WIRED** - Points now credit to real balance

### Soul Whisper™ (Settings Tab)
- Enable/Disable toggle
- Frequency: Daily, 2x Week, Weekly
- Preferred Time: 8am, 10am, 2pm, 6pm, 8pm
- Preview message showing personalised WhatsApp format

### Soul Explainer Video (7 Slides)
1. What is Pet Soul™?
2. Why Does It Matter?
3. 8 Soul Pillars
4. Your Soul Score (Tiers)
5. Earn Paw Points
6. Soul Whisper™
7. Start Your Journey (CTA)

### Achievement Points → Real Balance
- `POST /api/paw-points/sync-achievements`
- Called on dashboard load
- Checks unlocked achievements
- Credits points to user's loyalty_points
- Toast notification on new earnings

### Files Created This Session
- `/app/backend/paw_points_routes.py` - Paw Points API
- `/app/frontend/src/components/PawPointsRewards.jsx`
- `/app/frontend/src/components/MiraConversationHistory.jsx`
- `/app/frontend/src/components/SoulExplainerVideo.jsx`

### Admin Documentation Updated
- New sections: Gamification, Paw Points, Soul Whisper, Soul Explainer
- Full API endpoints documented
- Usage examples included

---

## Previous Sessions
(See CHANGELOG.md for full history)

---

## Session 10 - Unified Pet Page Overhaul (January 25, 2026)

### Completed This Session

**1. Unified Pet Page - THE DEFINITIVE PET PAGE**
- **Emergency Info Card** (NEW!) - Critical info at a glance: Allergies, Medical Conditions, Medications, Vet Contact
- **Soul Score Card** - Beautiful purple gradient with percentage, tier badge, status message
- **Soul Profile Stats** - Questions Answered, Achievements, Vaccines, Active Meds
- **ALL 8 Soul Pillars** with:
  - Progress bars and completion percentages
  - Click-to-expand functionality
  - **INLINE EDITING** with quick option buttons for common questions
  - Edit icons for answered questions (click to modify)
  - "Answer" buttons for unanswered questions
  - Instant save without page navigation
- **Share & Print buttons** - Share pet profile link, Print profile
- **14 Life Pillars** quick access grid
- **Achievements** section with unlocked badges

**2. Inline Editing System**
- Quick option buttons for 30+ question types (temperament, behaviour, health, etc.)
- Text input fallback for custom answers
- Real-time score refresh after saving
- Toast notifications for feedback

**3. Dashboard Improvements**
- All 14 Pillars at TOP with prominent purple gradient card
- Clickable Recent Activity/Orders with chevron icons
- "My Pets" navigation goes directly to unified pet page

**4. Multi-Pet Interface Fixed**
- Pet cards fully clickable → unified pet page
- "View Full Profile" button on each pet card

**5. Production Database Seeded**
- 393 products migrated and pillar-assigned
- 117 products enabled for rewards (30%)

**6. Admin Documentation Updated**
- New "Unified Pet Page ⭐" section in AdminDocs
- Complete documentation of all features
- Code examples and API endpoints
- How-to-modify guide

---

## Session 9 - Latest Updates (January 25, 2026)

### Completed This Session

**1. "Seed All" Button Added to Product Box Admin UI**
- Added one-click "Seed All" button to UnifiedProductBox.jsx
- Performs 3 operations in sequence:
  1. Migrate products from old collection
  2. Auto-assign pillars based on categories/tags
  3. Enable rewards for 30% of products
- Progress toasts show each step

**2. Mira AI Suggestion Fix - Category-Aware Suggestions**
- **Issue**: On Treats page, Mira was suggesting cakes instead of treats (both were under "celebrate" pillar)
- **Fix**: Updated system to use product category for more accurate suggestions
- Updated files:
  - `MiraContextPanel.jsx` - Now accepts and sends `category` prop
  - `ProductListing.jsx` - Passes `category` to MiraContextPanel
  - `mira_routes.py` - `get_pillar_suggestions()` now uses category-specific mappings
- **Result**: Treats page now shows treat products, Cakes page shows cake products

**3. Production Environment Issue Identified**
- **Issue**: User's production site (thedoggycompany.in) showing blank pages
- **Root Cause**: Production backend returning 502 Bad Gateway for all API calls
- **Preview Status**: Everything works correctly in preview environment
- **Fix Required**: User needs to redeploy and run seed endpoints on production

---

## Session 8 - Major Features Completed (January 25, 2026)

### Latest Updates (This Session)

**Bug Fixes Verified:**
1. ✅ **Travel Form** - 3-step wizard working (type → pet → trip details)
2. ✅ **Advisory Form** - Consultation request working
3. ✅ **Stay Booking Form** - Multi-step modal working
4. ✅ **React Hydration Warning** - Fixed nested `<a>` tags in Logo.jsx
5. ✅ **Login Redirect** - Now redirects to /dashboard (My Account) after login
6. ✅ **Tier Display Bug** - Fixed object rendering issue in pet page header
7. ✅ **Form Validation UX** - Added clear validation messages to Fit, Advisory, Care forms

**New Features Completed:**
1. ✅ **Pet Achievements Integration** - AchievementsGrid integrated into UnifiedPetPage overview tab
2. ✅ **Pet Soul Score Documentation** - Added comprehensive docs to AdminDocs.jsx
3. ✅ **Confetti Celebrations** - Triggers when achievements unlocked (with toast notifications)
4. ✅ **CSV Export for Product Box** - Export all products with filters to CSV file
5. ✅ **CSV Export for Product Tags Manager** - Export products with tags to CSV
6. ✅ **British English Spellings** - Changed flavor→flavour, personalized→personalised, colorful→colourful
7. ✅ **RAG Status Report** - Created comprehensive status tracking at /app/memory/STATUS_REPORT.md

**Dashboard (My Account Page):**
- Personalised hero banner with pet photo and Pet Soul Score
- All 14 Life Pillars displayed on single page
- Quick action cards, upcoming events, recent activity
- Full pet profile info (not just "What would you like help with?")

**UnifiedPetPage Major Redesign:**
- "Back to My Account" button in header
- Pet Pass number displayed prominently (header + hero badge)
- New attractive gradient purple hero with decorative background
- Quick stats: Pet Soul%, Tier, Questions Answered
- Tab navigation reorganised:
  - Detailed View (default) - Full Pet Soul Journey
  - Health Vault - Combined health profile + vaccinations
  - Services - All 14 pillars
  - Mira Chats - Conversation history placeholder
  - Pet Pass - Identity card
- British date formats (DD/MM/YYYY)

---

### 1. UNIFIED PRODUCT BOX ✅ (MAJOR FEATURE)
**The Single Source of Truth for all products, rewards & experiences**

**Backend** (`/app/backend/unified_product_box.py`):
- Full product schema with: Identity, Pillars, Pet Safety, Paw Rewards, Mira AI, Pricing, Shipping
- 16 API endpoints for CRUD, filtering, bulk operations
- Migration endpoint: Migrated 394 existing products

**Admin UI** (`/app/frontend/src/components/admin/UnifiedProductBox.jsx`):
- Stats dashboard (Total, Active, Reward Eligible, Mira Visible, Draft)
- Product table with search, filters by Type/Pillar/Status
- Full product editor with 6 tabs:
  - Basic (name, type, description, status)
  - Pillars (assign to 16 pillars)
  - Pet Safety (life stages, sizes, dietary flags, exclusions)
  - Rewards (Paw Reward eligibility, triggers, limits)
  - Mira AI (reference, suggest, mention-only settings)
  - Pricing (base price, GST, shipping)

**Key Features**:
- Products must be born here to appear anywhere else
- Pet Safety validation required for Mira suggestions
- Non-pushy Mira by default (mention_only_if_asked)
- All 16 pillars supported

### 2. SERVER-SIDE PET SOUL SCORE ✅
- Weighted question configuration (100 points across 6 categories)
- 4-tier system: Newcomer → Soul Seeker → Soul Explorer → Soul Master
- APIs: `/score_state`, `/quick-questions`, `/tiers`

### 3. GAMIFICATION SYSTEM ✅
- 13 achievements across tier, category, streak, special types
- Confetti celebrations with canvas-confetti
- Achievement badges with lock/unlock states

### 4. UNIVERSAL PET AVATAR ✅
- `getPetPhotoUrl()` integrated across all components
- Breed-based fallback photos

### 5. PET PASS NUMBERS ✅
- Unique numbers generated per pet (e.g., `TDC-I4UY18`)
- Displayed on Pet Pass cards

### 6. BLANK HEALTH TAB FIX ✅
- Created UnifiedPetPage.jsx for `/pet/:petId?tab=xxx`

---

## Unified Product Box Schema

```
Product Record:
├── Identity (id, sku, name, type)
├── Pillars (16 pillars mapping)
├── Pet Safety
│   ├── life_stages (puppy/adult/senior/all)
│   ├── size_suitability (small/medium/large/all)
│   ├── dietary_flags
│   ├── known_exclusions
│   └── is_validated (required for Mira)
├── Paw Rewards
│   ├── is_reward_eligible
│   ├── is_reward_only
│   ├── reward_value
│   ├── max_redemptions_per_pet
│   └── trigger_conditions
├── Mira Visibility
│   ├── can_reference
│   ├── can_suggest_proactively
│   └── mention_only_if_asked
├── Pricing
│   ├── base_price, compare_at_price, cost_price
│   ├── gst_applicable, gst_rate
│   └── shipping (requires_shipping, weight, class)
└── Visibility (status, visible_on_site, membership_eligibility)
```

---

## 16 Pillars

| Pillar | Icon | Status |
|--------|------|--------|
| Feed | 🍖 | Coming Soon |
| Celebrate | 🎂 | Active |
| Dine | 🍽️ | Active |
| Stay | 🏨 | Active |
| Travel | ✈️ | Active |
| Care | 🩺 | Active |
| Groom | ✂️ | Coming Soon |
| Play | 🎾 | Coming Soon |
| Train | 🎓 | Coming Soon |
| Insure | 🛡️ | Coming Soon |
| Adopt | 🐕 | Coming Soon |
| Farewell | 🌈 | Coming Soon |
| Shop | 🛒 | Active |
| Community | 👥 | Coming Soon |
| Emergency | 🚨 | Active |
| Concierge | 🛎️ | Active |

---

## API Endpoints - Unified Product Box

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/product-box/products` | List with filters |
| GET | `/api/product-box/products/{id}` | Get single product |
| POST | `/api/product-box/products` | Create product |
| PUT | `/api/product-box/products/{id}` | Update product |
| DELETE | `/api/product-box/products/{id}` | Archive product |
| POST | `/api/product-box/products/{id}/clone` | Clone product |
| POST | `/api/product-box/products/bulk-update` | Bulk update |
| POST | `/api/product-box/products/bulk-assign-pillar` | Bulk assign pillar |
| GET | `/api/product-box/by-pillar/{pillar}` | Products by pillar |
| GET | `/api/product-box/rewards` | Reward products |
| GET | `/api/product-box/mira-visible` | Mira-visible products |
| GET | `/api/product-box/safe-for-pet` | Safe products for pet profile |
| GET | `/api/product-box/stats` | Product statistics |
| POST | `/api/product-box/migrate-from-products` | Migrate existing |
| GET | `/api/product-box/config/*` | Configuration data |

---

## Prioritized Backlog

### P0 - Critical (Completed ✅)
- ~~Unified Product Box~~ ✅
- ~~Server-Side Pet Soul Score~~ ✅
- ~~Pet Pass Numbers~~ ✅

### P1 - Next
- Configure products with:
  - Pillar assignments
  - Pet Safety validation
  - Reward eligibility
- Integrate Unified Product Box with:
  - Mira AI suggestions
  - Checkout soft-gating
  - Service Desk attachments

### P2 - Pending
- "Untitled" Shopify products fix
- Mobile cart view redesign
- Full Paw Rewards ledger system (earn, redeem, balance)
- Build 'Adopt', 'Farewell', 'Shop' Pillars
- Consolidate/deprecate old pet pages (PetSoulJourneyPage.jsx)

---

## Test Credentials
- **Test User**: dipali@clubconcierge.in / lola4304
- **Admin**: aditya / lola4304
- **Test Pet ID**: pet-99a708f1722a (Mojo)

---

*Last updated: January 25, 2026*

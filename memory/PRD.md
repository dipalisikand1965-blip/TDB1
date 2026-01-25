# The Doggy Company - Product Requirements Document

## Original Problem Statement
Building **The Doggy Company**, a "Pet Life Operating System" designed as a pet-first platform.

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

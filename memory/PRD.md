# Pet Life Operating System - Product Requirements Document

## Project Overview
A comprehensive Pet Life Operating System for The Doggy Company - India's #1 Pet Platform featuring premium dog cakes, pet-friendly dining, stays & services with same-day delivery.

## Original Problem Statement
Build a complete service booking experience and admin management interface for the Pet Life Operating System. The platform serves pet parents with:
- 14 Life Pillars (Celebrate, Dine, Stay, Travel, Care, Enjoy, Fit, Learn, Paperwork, Advisory, Emergency, Farewell, Adopt, Insure)
- Mira AI Concierge for personalized recommendations
- Member Dashboard with comprehensive pet management
- Admin Panel with Service Desk, Paperwork Manager, Kit Assembly, and more

## User Personas
1. **Pet Parents (Members)**: Users managing pets, ordering products, booking services
2. **Admin Staff**: Managing orders, service requests, documents, tickets, kits
3. **Mira AI**: AI-powered concierge for recommendations and assistance

## What's Been Implemented

### Session: February 2, 2026 - Universal PersonalizedPicks & Smart Recommendations (LATEST)

**Features Implemented:**
1. ✅ **PersonalizedPicks on ALL 10 Pillar Pages** (Mobile + Desktop)
   - CarePage, CelebratePage, DinePage, StayPage, TravelPage
   - EnjoyPage, FitPage, LearnPage, ShopPage, MealsPage
   - Shows pet-specific product recommendations
   - Empty state message when no recommendations available

2. ✅ **Multi-Pet Support with Global Event Listener**
   - Listens for `petSelectionChanged` event from Navbar
   - Updates recommendations when user changes pet anywhere
   - Checks localStorage for `selectedPetId` on mount

3. ✅ **Smart Recommendation Engine** (Backend Enhanced)
   - Pillar filter: `?pillar=care|dine|shop|...`
   - Scoring algorithm now includes:
     - Pillar match: +20 points
     - Breed match: +15 points
     - Age-specific: +12 points (puppy, senior)
     - Personality match: +8 points (active, calm, anxious)
     - Size match: +10 points
     - Allergy exclusion: Skip products with allergens
   - Falls back to cross-pillar products if not enough results

**Files Modified:**
- `/app/frontend/src/components/PersonalizedPicks.jsx` - Event listeners, localStorage, empty state
- `/app/frontend/src/pages/MealsPage.jsx` - Added PersonalizedPicks
- `/app/backend/server.py` - Enhanced `/api/products/recommendations/for-pet/{pet_id}` with pillar filter and scoring

**Testing: 100% Pass Rate (17/17 backend tests, all code verification passed)**
- Test report: `/app/test_reports/iteration_184.json`

### Session: February 2, 2026 - Universal Click-to-Detail & PersonalizedPicks

**Issues Fixed:**
1. ✅ **Bundle Cards Open Detail Modal** - CarePage bundles now open full detail modal on click
   - Shows gradient header, description, includes list, price, discount, Paw Points
   - "View Details" and "Add to Cart" buttons in card and modal
2. ✅ **Quick Book Service Tiles Open Forms** - Service tiles open ServiceBookingModal (not Mira)
   - Grooming, Vet, Training, Walking tiles all open proper booking forms
   - Forms have service selection, date/time, pet info, notes
3. ✅ **"Anything Else" Ask Concierge Tile** - New generic request tile on CarePage
   - Opens Ask Concierge form with auto-populated user info
   - Submits to unified service flow (creates ticket, notifications)
4. ✅ **PersonalizedPicks on ALL Pillar Pages** - Added to 6 pages:
   - DinePage, CelebratePage, StayPage, LearnPage, FitPage, ShopPage
   - Shows pet-specific product recommendations based on pillar
   - Only displays for logged-in users with registered pets

**Files Modified:**
- `/app/frontend/src/pages/CarePage.jsx` - Bundle modal, Anything Else tile
- `/app/frontend/src/pages/DinePage.jsx` - Added PersonalizedPicks
- `/app/frontend/src/pages/CelebratePage.jsx` - Added PersonalizedPicks
- `/app/frontend/src/pages/StayPage.jsx` - Added PersonalizedPicks
- `/app/frontend/src/pages/LearnPage.jsx` - Added PersonalizedPicks
- `/app/frontend/src/pages/FitPage.jsx` - Added PersonalizedPicks
- `/app/frontend/src/pages/ShopPage.jsx` - Added PersonalizedPicks

**Testing: 100% Pass Rate (Frontend all features verified)**
- Test report: `/app/test_reports/iteration_183.json`

### Session: February 2, 2026 - Bug Fixes Batch

**Issues Fixed:**
1. ✅ **Dialog/Modal Z-Index Fix** - Changed z-index from z-50/z-60 to z-[9998]/z-[9999] in dialog.jsx
   - Modals now appear properly above the navbar header
   - Cross-sell modal no longer "sticks" to header
2. ✅ **PawMeter Rating UI** - Enhanced ProductCard.jsx to show rating UI on all devices
   - Shows "Rate" button next to existing PawMeter score
   - Shows "Be first to rate" button for products without ratings
   - Works on both mobile and desktop
3. ✅ **Pet Selector Event Dispatch** - Enhanced Navbar.jsx pet selection
   - Event now includes full pet details: petId, petName, petBreed, and complete pet object
   - Stores petName and petBreed in localStorage for persistence
   - MiraChatWidget and other components can now access full pet context
4. ✅ **Null Safety for Pet Data** - Added null checks in Navbar pet loading
   - Prevents crashes when pet data has missing fields (Luna crash fix)

**Files Modified:**
- `/app/frontend/src/components/ui/dialog.jsx` - z-index 9998/9999
- `/app/frontend/src/components/ProductCard.jsx` - PawMeter Rate buttons
- `/app/frontend/src/components/Navbar.jsx` - Pet event dispatch with full details

**Testing: 100% Pass Rate (9/9 backend tests, all frontend UI verified)**
- Test report: `/app/test_reports/iteration_182.json`

### Session: February 2, 2026 - Unified Service Flow Implementation

**Critical Fix: Complete Unified Flow - ALL Entry Points**

Every user action now follows the unified flow:

```
┌─────────────────────────────────────────────────────────────┐
│  USER ENTRY POINTS (Mobile & Desktop)                        │
│  • Search Bar          • Mira Chat          • Service Cards │
│  • Ask Concierge       • Product Add        • Bundle Buy    │
│  • Contact Forms       • Callback Request                    │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  UNIFIED FLOW - 6 STEPS                                      │
│  1. Service Desk Ticket (TKT-XXXXXXXX)                       │
│  2. Admin Notification (NOTIF-XXXXXXXX)                      │
│  3. Member Notification (MNOTIF-XXXXXXXX)                    │
│  4. Pillar Request (PR-XXXXXXXX)                             │
│  5. Tickets Collection entry                                 │
│  6. Channel Intakes entry                                    │
└─────────────────────────────────────────────────────────────┘
```

**New API Endpoints:**
- `GET /api/member/notifications` - Member's notifications
- `GET /api/member/requests` - All member's requests
- `PUT /api/member/notifications/{id}/read` - Mark as read

**Documentation Created:**
- `/app/memory/UNIFIED_SERVICE_FLOW.md` - Complete flow diagram
- `/app/memory/PRODUCT_SERVICE_SEEDING.md` - Product/service creation guide

**Testing:** All flows verified - search, service requests, quick book ✅

### Session: February 2, 2026 - Bundle Modal & Cross-Sell UI Fixes

**Bugs Fixed:**
1. ✅ **Bundle Modal with X Button** - Added proper dialog with X close button, image display, description, price, and Add to Cart
2. ✅ **Cross-Sell Dialog** - Added X close button, max-height with overflow-y-auto for proper scrolling
3. ✅ **Product Cards Clickable** - Fresh Meals products open ProductDetailModal correctly
4. ✅ **Mobile Responsiveness** - All modals work on mobile viewport
5. ✅ **Unified Service Flow** - Meal inquiry creates ticket (tested: TKT-59911BCC)

**Testing: 100% Pass Rate (Frontend all UI features verified)**

### Session: February 2, 2026 - Travel Page Enhancement & UX Fixes

**Features Implemented:**
1. ✅ **Dine Page Header** - Updated to user's chewy image (afm7enef_image.png)
2. ✅ **Mobile Button Styling** - Fixed warped button in Dine Essentials (added whitespace-nowrap, responsive sizing)
3. ✅ **Fresh Meals Service Flow** - Added inquiry modal with unified service flow
   - Opens when clicking "Get Nutrition Advice" button
   - Form pre-fills user data (name, phone, email, pet name)
   - Submits to `/api/service-requests` → creates ticket
4. ✅ **Travel Page Enhancement** - Travel Essentials section now shows 10+ products
   - Seeded 12 new travel products (carriers, safety harnesses, GPS trackers, calming sprays, etc.)
   - Products have comprehensive cross-sell and intelligent tags
5. ✅ **Mobile Navbar Dropdowns** - Now shows sub-items under each pillar (e.g., "Fresh Meals", "Meal Plans" under Dine)
6. ✅ **Product Name Fixes** - Created `/api/admin/products/fix-product-names` endpoint for future use

**New Admin Endpoints:**
- `POST /api/admin/products/seed-travel-products` - Seeds 12 comprehensive travel products
- `POST /api/admin/products/fix-product-names` - Fixes confusing product names (e.g., "poke cake")

**Testing: 100% Pass Rate (Backend all API endpoints, Frontend all UI verified)**

### Session: February 2, 2026 - Product Intelligence & Mobile UX Enhancement

**Features Implemented:**
1. ✅ **Mobile Navbar Subheaders** - Mobile menu now shows dropdown items under each pillar
   - Example: Under "Dine" you can see Fresh Meals, Meal Plans, Pet Restaurants
   - Uses expandable accordions with sub-items visible
2. ✅ **Seeded 10 Realistic Meal Products** - Both veg and non-veg with comprehensive tags
   - Chicken & Brown Rice Bowl, Lamb & Sweet Potato Feast, Fish & Quinoa Power Bowl
   - Veggie Delight Bowl (Veg), Pumpkin & Oats Comfort Bowl (Veg)
   - Puppy Growth Formula, Senior Vitality Bowl, Lean & Fit Formula
   - Bone Broth Topper, Freeze-Dried Liver Sprinkles
3. ✅ **Enhanced Product Schema** - Added new fields:
   - `cross_sell_products`: Products to suggest when this item is added to cart
   - `frequently_bought_together`: Common product bundles
   - `allergy_warnings`: Clear allergen information
   - `suitable_for_breeds`, `not_suitable_for`: Breed-specific suitability
4. ✅ **Bulk Tag Enhancement** - Enhanced ALL 932 products with intelligent tags:
   - Size tags (small_breed, medium_breed, large_breed, all_sizes)
   - Occasion tags (birthday, valentines, christmas, gotcha_day)
   - Diet tags (grain_free, chicken, lamb, vegetarian)
   - Cross-sell affinity tags (pairs_with_toy, pairs_with_bandana)
   - Price tier tags (budget_friendly, mid_range, premium)
5. ✅ **MealPlanPage Multi-Pet Selection** - Already has pet selector buttons (lines 238-254)
6. ✅ **CSV Export Fixed** - URL: `/api/admin/export/products-csv`

**New Admin Endpoints:**
- `POST /api/admin/products/seed-meal-products` - Seeds realistic meal products
- `POST /api/admin/products/enhance-all-tags` - Bulk enhance tags for all products

**Testing: 100% Pass Rate (Backend 17/17, Frontend all UI tests passed)**

### Session: February 2, 2026 - P0/P1 Bug Fixes

**Bugs Fixed:**
1. ✅ **Mobile Back Buttons** - Added to Learn, Fit, Travel, Farewell pillar pages (Celebrate already had one)
   - Uses ChevronLeft icon with `navigate(-1)` for natural back navigation
   - Button appears only on mobile (sm:hidden), positioned top-left
2. ✅ **Ask Concierge Form Pre-fill** - Form now ensures user data is fresh when modal opens
   - Pre-fills name, phone, email from user context
   - Auto-populates pet name if user has one pet
   - Shows dropdown for multi-pet selection
3. ✅ **Service Request User Name** - Verified backend correctly shows user name "Dipali" (not "Guest")
4. ✅ **View Details Button** - Product cards have working "View Details" button that opens modal
5. ✅ **PawMeter Implementation** - Component exists and renders when paw_score/rating data present
6. ✅ **Partner With Us Link** - Dine page "Partner With Us" button now links to `/partner`
7. ✅ **Mira Quick Book Form Timing** - Form now ONLY appears when user explicitly says "lock in the date", "book now", etc.
   - Previously showed immediately when any service keyword was detected
   - Now Mira asks questions first before showing booking form
8. ✅ **Fresh Treats Link** - Dine page "Fresh Treats" card now links to `/celebrate/treats`
9. ✅ **Fresh Meals Page** - Created new `/dine/meals` page with products from dine pillar
   - Added route in App.js
   - Added to Dine dropdown in Navbar
10. ✅ **CSV Export Fix** - Changed endpoint from `/admin/products/export-csv` to `/admin/export/products-csv` to avoid route conflict
11. ✅ **Mira AI Multi-Pet Sync** - MiraChatWidget now syncs with navbar pet selection via custom event `petSelectionChanged`
12. ✅ **Pet Selector Event Dispatch** - Navbar now dispatches event when pet is switched

**Testing: 100% Pass Rate (Backend 9/9, Frontend all features verified)**

### Session: February 1-2, 2026 - Comprehensive Mobile UI Overhaul

**Critical Fixes Completed:**
1. ✅ **Restaurant Modal Layout Fixed** - Removed ServiceCatalogSection from inside modal. Now shows ONLY reservation form (desktop & mobile)
2. ✅ **Fresh Pet Meals Grid** - Changed to single column on mobile (`grid-cols-1 sm:grid-cols-2`)
3. ✅ **Mira AI Tabs Fixed** - Quick actions now auto-send messages via `sendMessage(action)` direct call
4. ✅ **Mira AI Product Cards Larger** - Increased from w-20/h-12 to w-28/h-16
5. ✅ **Mira Pillar Switch Bug Fixed** - Kit session clears when switching pillars (no more "fitness kit" on travel page)
6. ✅ **Trainer Cards Redesigned** - Compact horizontal layout on mobile
7. ✅ **Training Bundles Clickable** - Added hover states and visible "Add to Cart"
8. ✅ **Global Mobile Typography** - 16px minimum fonts, prevents iOS zoom
9. ✅ **Restaurant Cards Improved** - Responsive padding and text sizes

**Testing: 100% Pass Rate on Mobile Audit (9 pages tested)**

**Previous Session - Mira Chat Bug Fixes:**
1. ✅ **Duplicate Messages Bug Fixed** - Consolidated two conflicting functions (`handlePresetMessage` and `sendMessage`) in `/app/frontend/src/pages/MiraPage.jsx` into a single unified `sendMessage` function that handles both manual input and preset messages
2. ✅ **Mobile Footer AI Disclaimer Added** - Added the AI disclaimer ("Mira is powered by AI and can make mistakes") to the mobile section of `/app/frontend/src/components/Footer.jsx`

**Member Dashboard Fixes (All 4 Bugs Fixed):**
1. ✅ **My Requests Clickable** - Cards navigate to requests tab via `onTabChange('requests')`
2. ✅ **Pet Selector Working** - Dropdown shows when user has multiple pets, changes header to show selected pet's name, breed, and soul completion
3. ✅ **Browse Recommendations Linked** - Both MiraPicksCard and SmartRecommendationsCard buttons navigate to `/shop`
4. ✅ **Documents Tab Added** - Added to both desktop and mobile navigation with proper DocumentsTab component

**Kit Assembly Admin Controls (NEW):**
- Created `/app/backend/kit_admin_routes.py` with full CRUD for kit templates and Mira picks
- Created `/app/frontend/src/components/admin/KitAssemblyManager.jsx` admin UI
- Features:
  - Create/Edit/Delete kit templates
  - Manage products in each kit
  - Custom voice narration per item
  - Voice preview with TTS testing
  - Mira Picks management with voice scripts
  - 14 Life Pillars + bonus categories (17 total)
  - CSV export for both kits and picks
  - Seed defaults button (19 pre-built kits)

**Mira AI Integration (WIRED):**
- Kit templates now feed directly into Mira chat
- When users ask for kits (birthday, travel, etc.), Mira uses admin-configured products and narrations
- Smart recommendations endpoint uses admin-curated Mira Picks
- Products display with `is_admin_curated`, `mira_tagline`, `mira_voice_script` flags
- Original gathering/personalization flow preserved - admin templates used at assembly stage

**Voice Cutoff Fix:**
- Fixed Chrome TTS bug in `CinematicKitAssembly.jsx` that caused voice to cut off after ~15 seconds
- Added pause/resume workaround every 10 seconds to keep speech synthesis active

**Mira Nutrition/Diet Bug Fix:**
- Fixed issue where "meal plan" queries were incorrectly routed to "dine" pillar (restaurants)
- Added nutrition-specific keywords to "fit" pillar
- Smart override: nutrition queries in "dine" context → switch to "fit" pillar

**AI Disclaimer Implementation:**
- Added nutrition disclaimer to Mira responses: "This is general guidance... consult your veterinarian"
- Added footer disclaimer: "Mira is powered by AI and can make mistakes"
- Created `/ai-disclaimer` page in Policies section with full AI terms
- Updated Terms of Service with AI limitations

**Mira System Prompt Enhancement:**
- Added Section 9.5 with nutrition guidance rules
- Breed-specific nutrition facts (Labrador, Golden, GSD, French Bulldog, etc.)
- Clear boundaries: what Mira CAN vs CANNOT provide
- Standard disclaimer template for nutrition responses

### Previous Session Accomplishments
- Member Dashboard Refactor: 3,500+ line file split into 15 lazy-loaded components
- File Upload Implementation: Proper upload endpoint and UI
- Admin Document Vault: New tab in Paperwork Manager
- Service Desk Enhancements: Lock/delete ticket functionality

## Architecture

```
/app
├── backend
│   ├── server.py                    # Main FastAPI server
│   ├── kit_admin_routes.py          # NEW: Kit Assembly & Mira Picks admin
│   ├── paperwork_routes.py          # File upload & admin docs
│   ├── ticket_routes.py             # Service desk tickets
│   └── mira_routes.py               # Mira AI endpoints
└── frontend
    └── src
        ├── App.js                   # Main routing
        ├── pages
        │   ├── MemberDashboard.jsx  # Lazy-loading container with pet selector
        │   ├── Admin.jsx            # Admin panel with Kit Assembly tab
        │   └── PaperworkPage.jsx    # Document upload UI
        ├── components
        │   ├── admin/
        │   │   ├── KitAssemblyManager.jsx  # NEW: Kit & Mira Picks admin
        │   │   ├── DoggyServiceDesk.jsx
        │   │   └── PaperworkManager.jsx
        │   ├── dashboard/tabs/      # 15+ tab components
        │   │   ├── OverviewTab.jsx  # Pet selector, uses currentPet
        │   │   └── DocumentsTab.jsx
        │   ├── CinematicKitAssembly.jsx   # Fixed TTS cutoff
        │   ├── MiraPicksCard.jsx
        │   └── SmartRecommendationsCard.jsx
        └── context/
            ├── AuthContext.js
            └── CartContext.js
```

## API Endpoints

### Kit Assembly Admin
- GET /api/admin/kits/categories - Get kit categories (9 categories)
- GET /api/admin/kits/templates - List all kit templates
- POST /api/admin/kits/templates - Create kit template
- PUT /api/admin/kits/templates/{id} - Update kit template
- DELETE /api/admin/kits/templates/{id} - Delete kit template
- GET /api/admin/kits/mira-picks - List Mira picks
- POST /api/admin/kits/mira-picks - Create Mira pick
- PUT /api/admin/kits/mira-picks/{id} - Update Mira pick
- DELETE /api/admin/kits/mira-picks/{id} - Delete Mira pick
- POST /api/admin/kits/preview-voice - Preview voice script
- GET /api/admin/kits/voice-scripts/{id} - Get all scripts for a kit
- **POST /api/admin/kits/seed-defaults** - Seed 5 default kits (Travel, Cinema, Birthday, Grooming, Puppy)
- **GET /api/admin/kits/mira/recommendations** - Kits for Mira AI to recommend
- **GET /api/admin/kits/mira/picks** - Active Mira picks for AI
- **GET /api/admin/kits/export/csv** - Export kit templates as CSV
- **GET /api/admin/kits/mira-picks/export/csv** - Export Mira picks as CSV

### Existing Endpoints
- POST /api/auth/login
- GET /api/pets/my-pets
- GET /api/paperwork/documents/{pet_id}
- GET /api/mira/my-requests
- POST /api/paperwork/documents/upload
- GET /api/paperwork/admin/documents

## Test Credentials
- **Member Login**: dipali@clubconcierge.in / test123
- **Admin Panel**: aditya / lola4304

## Prioritized Backlog

### P0 (High Priority)
- [x] Fix Member Dashboard bugs (COMPLETED)
- [x] Kit Assembly Admin Controls (COMPLETED)
- [x] Mira Picks Admin Dashboard (COMPLETED)
- [x] Fix Cinema Kit voice cutting off (COMPLETED)
- [x] Fix Mira Chat duplicate messages bug (COMPLETED Feb 1)
- [x] Fix Mobile Footer missing AI disclaimer (COMPLETED Feb 1)
- [x] **COMPREHENSIVE MOBILE UI OVERHAUL** (COMPLETED Feb 1)
- [x] **Mobile Back Buttons** - Added to all pillar pages (COMPLETED Feb 2)
- [x] **Ask Concierge Form Pre-fill** - User data auto-populates (COMPLETED Feb 2)
- [x] **Service Request User Name** - Shows logged-in user name (COMPLETED Feb 2)
- [ ] Implement Membership Business Model (Freemium vs Members-Only)
- [ ] Mira AI personalization for multi-pet households
- [ ] Product tagging overhaul with CSV import/export

### P1 (Medium Priority)
- [ ] "Pet Parent Magnet" features (First box free, Pet Parent Score)
- [ ] Rewards Program finalization
- [ ] Sticky booking form fix on desktop (post-booking state)
- [x] Pet selector navbar header update when switching (FIXED Feb 2, 2026)

### P2 (Lower Priority)
- [ ] Razorpay Payment Integration (awaiting keys)
- [ ] WhatsApp Business Integration (awaiting approval)
- [ ] Partner Portal development
- [ ] Saved Kits UI in Member Dashboard

### Refactoring Tasks
- [ ] DoggyServiceDesk.jsx (5000+ lines) needs component extraction

## Known Issues
- Dashboard page is memory-intensive and may crash Playwright screenshot tools (known issue, not blocking for users)
- Meilisearch unavailable (non-blocking for core functionality)

## 3rd Party Integrations
- **OpenAI GPT-4o**: Mira AI chat backend
- **Resend**: Transactional emails (functional)
- **Razorpay**: Pending (awaiting keys)
- **WhatsApp**: Pending (awaiting Meta approval)

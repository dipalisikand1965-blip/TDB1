# Pet Life Operating System - Product Requirements Document

## Original Problem Statement
Build a comprehensive "Pet Life Operating System" where every user or system-generated signal (click, search, voice command, form submission, etc.) must trigger a mandatory, non-negotiable **Unified Signal Flow**: 
**1. Notification → 2. Service Desk Ticket → 3. Unified Inbox Entry**

This flow must work across:
- All pillars (Care, Fit, Travel, Stay, Celebrate, Enjoy, Learn, Advisory, Paperwork, Dine, etc.)
- Mira AI conversations
- Search queries
- Product/service requests
- Booking confirmations

## What's Been Implemented (Session: Jan 31, 2026 - Latest)

### ✅ CARE PILLAR TRANSFORMED - COMPLETED

**User Request**: Duplicate Stay template to Care pillar with "Wellness Transformation" theme.

**Frontend CarePage.jsx Redesigned**:
1. **New Hero Theme**: Teal/emerald gradient (spa-like wellness theme)
   - Tagline: "Where Wellness Meets Wag"
   - Badge: "The Wellness Transformation"
   - CTA: "Start Wellness Journey"
   - Trust badges: "Certified Groomers", "10,000+ Spa Sessions", "Vet-Approved Products"
   
2. **Added Engagement Components**:
   - `FitnessJourneyCounter` + `RotatingSocialProof` banner
   - `ConversationalEntry` with care-specific goals (Grooming, Vet, Training, Dog walking, Daycare, Pet spa)
   - `QuickWinTip` showing "Care & grooming tips" (fetches from API)

3. **Care-Specific Tips Now Active**:
   - 6 tips seeded: Grooming, Dental, Nails, Teeth, Ears, Flea prevention
   - All with proper action types (navigate, checklist)

**Admin CareManager.jsx Enhanced**:
- Added **Tips** tab with full CRUD functionality
- Seed Tips, CSV Template download, Add/Edit/Delete buttons
- Same pattern as StayManager for consistency

**Files Modified**:
- `/app/frontend/src/pages/CarePage.jsx` - Complete hero and engagement component redesign
- `/app/frontend/src/components/admin/CareManager.jsx` - Added Tips tab with CRUD

---

### ✅ MIRA PAGE ENHANCEMENTS - COMPLETED

**User Request**: Fix duplicate messages, link pets to profile, replace contact section with suggestions.

**Issues Fixed**:
1. **Duplicate messages appearing twice** - FIXED
   - Changed useEffect to run only once on mount
   - Removed `setInput()` call that was causing duplicate display
   - Clear URL params before sending preset message

2. **Pets should link to pet profile** - FIXED
   - Added ExternalLink button on each pet card
   - Clicking navigates to `/pet/{petId}` profile page
   - Selection still works by clicking pet name/avatar

3. **Replace contact section with pet suggestions** - IMPLEMENTED
   - New "Suggestions for {PetName}" section with 4 quick actions:
     - Pet-friendly stays
     - Grooming care (based on coat)
     - Safe treats & food (respects allergies)
     - Plan a celebration
   - Contact section now collapsed under "Need human help?" expandable
   - Each suggestion auto-fills Mira chat input

**Files Modified**:
- `/app/frontend/src/pages/MiraPage.jsx` - All three fixes

---

### ✅ STAY PILLAR PERFECTED AS TEMPLATE - COMPLETED

**User Request**: Perfect the Stay pillar (frontend, backend, admin, mobile) so it can be duplicated for other pages.

**Issues Fixed**:
1. **QuickWinTip showing "wellness" instead of stay-specific tips** - FIXED
   - Updated subtitle to be pillar-aware ("Tips for your pawcation" for Stay)
   - Component now fetches tips from API with pillar filter
   - Refactored with `useMemo` for better performance
   
2. **Service Desk tickets showing "No subject"** - FIXED
   - Backend now extracts meaningful subjects from user messages
   - Subject includes pet name when available (e.g., "Mojo - I need help finding a pet-friendly hotel")
   - Updated in: `mira_routes.py` - service desk tickets, notifications, pillar-specific routing

3. **Tips CRUD with CSV Seed functionality** - IMPLEMENTED
   - New endpoint: `POST /api/engagement/seed-pillar-tips` - Seeds 50+ pillar-specific tips
   - New endpoint: `PUT /api/engagement/tips/{tip_id}` - Update tip
   - New endpoint: `DELETE /api/engagement/tips/{tip_id}` - Delete tip
   - Admin StayManager Tips tab now has: Seed Tips, CSV Template download, Add/Edit/Delete buttons

4. **Mira page back button** - FIXED
   - Added fallback: If no history, navigates to `/dashboard`

**Files Modified**:
- `/app/frontend/src/components/QuickWinTip.jsx` - Pillar-aware subtitle, API integration, useMemo refactor
- `/app/frontend/src/components/admin/StayManager.jsx` - Tips tab with Seed/CSV/CRUD
- `/app/backend/mira_routes.py` - Meaningful ticket subjects
- `/app/backend/engagement_engine.py` - Full pillar tips seeding (50+ tips), CRUD endpoints
- `/app/frontend/src/pages/MiraPage.jsx` - Back button fallback
- `/app/frontend/src/pages/Admin.jsx` - Fixed StayManager import path

**Stay Tips Seeded**: 8 stay-specific tips including:
- 🏨 Book pet-friendly stays 2 weeks ahead for best rates
- 🛏️ Pack familiar bedding to help your pet feel at home
- 📋 Check the property's pet policy before booking
- 🏥 Ask about nearby vet clinics when booking
- And more...

---

## What's Been Implemented (Session: Jan 30, 2026 - Previous)

### ✅ FIT PAGE REDESIGN - MAKEMYTRIP STYLE - COMPLETED

**User Request**: Redesign the Fit page with a modern, MakeMyTrip-inspired layout featuring:
- Card-based service display with beautiful imagery
- Personalized Mira recommendations on the page
- Intelligent cross-selling of related products
- Category filtering and sorting

**Implementation**:

#### New Components Created
1. **PillarServicesGrid.jsx** (`/app/frontend/src/components/`)
   - Category tabs with emoji icons (All, Assessment, Training, etc.)
   - Sort dropdown (Most Popular, Top Rated, Price Low/High)
   - Grid/List view toggle
   - Animated transitions with framer-motion
   - Mobile-friendly horizontal scrolling tabs

2. **PillarServiceCard.jsx** (`/app/frontend/src/components/`)
   - Image with gradient overlay
   - Heart/favorite toggle
   - Badge display (Subscription, % OFF)
   - Price and duration display
   - Hover effects with highlights reveal
   - Related products popup ("Mira Suggests")

3. **MiraPillarRecommendations.jsx** (`/app/frontend/src/components/`)
   - Personalized AI recommendations for logged-in users
   - Pet-specific suggestions via `/api/recommendations/pet/{petId}`
   - Beautiful gradient header with Mira branding
   - Refresh functionality

#### FitPage.jsx Changes
- Removed old inline `ServiceCard` component
- Integrated `PillarServicesGrid` for services display
- Added `MiraPillarRecommendations` for logged-in users
- Cleaned up unused imports and state variables
- Category filtering now handled by `PillarServicesGrid` internally

**Testing Results**: 13/13 frontend tests passed (100%)
- Page loads with new design ✅
- Category filter tabs work ✅
- Sort dropdown works ✅
- Service cards display correctly ✅
- Heart/favorite toggle works ✅
- Detail modal opens with all info ✅
- "What's Included" section displays ✅
- "Why Concierge®" section displays ✅
- Book button triggers booking flow ✅
- Mira Suggests popup works ✅
- Mobile responsive layout works ✅

---

### ✅ AdminQuickEdit Button Overlap - FIXED

**File**: `/app/frontend/src/components/AdminQuickEdit.jsx`

**Changes**:
- Repositioned to `top-24 right-6` (below navbar, well above Mira/Contact)
- Changed from gradient button to subtle white/glass button that doesn't distract
- Desktop (lg+): Full "Edit Page" button with icon
- Tablet (md-lg): Compact icon-only button
- Mobile: Hidden completely to avoid touch conflicts
- Reduced z-index from 50 to 40 to prevent layering issues

---

### ✅ Cart UI Redesign - COMPLETED

**File**: `/app/frontend/src/components/CartSidebar.jsx`

**New Features**:
1. **Sticky Header**: Cart icon with item count, always visible
2. **Free Shipping Progress Bar**: Visual progress toward free shipping threshold
3. **Animated Item Removal**: Slide-out animation when removing items
4. **Modern Item Cards**: 
   - Rounded corners with subtle shadows
   - Autoship ribbon indicator at top
   - Compact quantity controls with rounded buttons
   - Per-item price breakdown
5. **Beautiful Empty State**: Centered icon, friendly message, sparkles CTA
6. **Sticky Footer Summary**:
   - Subtotal, discounts, shipping breakdown
   - Dashed divider before total
   - Prominent total with strike-through for discounts
   - Shadow effect for depth
7. **Safe Checkout Badge**: Trust indicators at bottom
8. **Mobile Optimizations**:
   - Proper padding and spacing
   - Touch-friendly buttons
   - Scrollable items area
   - Sticky header and footer

---

### ✅ SERVICE BOOKING FLOW MOBILE OPTIMIZATION - COMPLETED

**File**: `/app/frontend/src/components/ServiceBookingModal.jsx`

**Optimizations Applied**:
1. **Responsive Dialog**: Adjusted max-width and padding for mobile (`sm:max-w-lg`, `p-4 sm:p-6`)
2. **Header**: Smaller text and icons on mobile with proper flex-shrink
3. **Step 1 - Service Selection**: 
   - Stack services vertically on mobile (`grid-cols-1 sm:grid-cols-2`)
   - Larger touch targets (`min-h-[70px]`)
   - Ring focus indicator for better selection visibility
   - Location buttons with centered icons on mobile
4. **Step 2 - Pet & Contact**:
   - Horizontal scrolling pet selection for multiple pets
   - Stack form fields on mobile (`grid-cols-1 sm:grid-cols-2`)
   - Taller input fields (`h-11`) for better touch targets
   - Phone input with `inputMode="numeric"` for better keyboard
5. **Step 3 - Schedule**:
   - Mobile-only quick time selection grid (tap to select)
   - Stacked date/time inputs on mobile
   - Taller select elements for easy tapping
6. **Step 4 - Review**:
   - Compact padding on mobile
   - Smaller text sizes with proper truncation
7. **Navigation**:
   - Full-width buttons on mobile with min-height of 44px
   - Fixed button sizing for consistent touch targets

---

### ✅ PHASE 2 FEATURES - COMPLETED

#### 1. AI Voice Quick Actions
- **Backend**: `/app/backend/voice_quick_actions.py`
- **Endpoints**:
  - `POST /api/voice-actions/process` - Processes text commands and returns actionable responses
  - `GET /api/voice-actions/suggestions` - Returns contextual voice command suggestions
  - `POST /api/voice-actions/transcribe` - Transcribes audio to text (requires Whisper)
- **Supported Intents**: book_grooming, book_vet, book_walk, book_training, order_food, plan_celebration, check_vaccinations, nutrition_advice, book_stay, emergency
- **Features**:
  - Intent detection with 0.85 confidence
  - Date extraction (today, tomorrow, this weekend, day names)
  - Pet name extraction from user's pets
  - Suggested follow-up actions with navigation links

#### 2. Smart Recommendations Engine
- **Backend**: `/app/backend/smart_recommendations.py`
- **Endpoints**:
  - `GET /api/recommendations/pet/{pet_id}` - Personalized recommendations for specific pet
  - `GET /api/recommendations/dashboard` - Aggregated recommendations across all pets
  - `GET /api/recommendations/quick-actions` - Voice action suggestions
- **Personalization Based On**:
  - Breed-specific needs (25+ breeds mapped with exercise, grooming, training, nutrition needs)
  - Age-based needs (puppy, young_adult, adult, senior)
  - Health conditions
  - Upcoming celebrations (birthday detection)
- **Recommendation Types**: services, products, nutrition, celebrations

#### 3. Frontend Components
- **SmartRecommendationsCard.jsx** - Beautiful card showing AI-powered recommendations with icons and CTAs
- **VoiceQuickActions.jsx** - Voice input modal with animated microphone, real-time transcription, and action buttons
- **Integration**: Both components integrated into MemberDashboard.jsx

---

### ✅ P0 Multi-Part Request - COMPLETED

#### 1. Pillar Card Links Fixed
- **Location**: `/app/frontend/src/pages/UnifiedPetPage.jsx`
- All 14 pillar cards on Pet Profile page now navigate correctly with `?pet={pet_id}` parameter
- Example: Clicking "Celebrate" navigates to `/celebrate?pet=pet-99a708f1722a`
- Verified by testing agent - all links working

#### 2. Proactive Mira Nudges - IMPLEMENTED
- **Backend**: `/app/backend/mira_nudges.py` - Complete nudge engine with 14 default nudge types
- **Scheduler**: Added daily job in `server.py` to process nudges at 10 AM IST (4:30 AM UTC)
- **Nudge Types**: vaccination_reminder, grooming_reminder, birthday_reminder, gotcha_day_reminder, health_checkup, dental_checkup, flea_tick_prevention, food_reorder, insurance_renewal, license_renewal, weight_check, training_followup, soul_incomplete, activity_reminder
- **Admin Configurable**: All nudge types can be enabled/disabled and customized via admin panel

#### 3. Pillar Restructuring Done - WITH SEEDED PRODUCTS & BUNDLES:
- **Feed/Nutrition** added to Care pillar - 6 subtypes (diet_planning, weight_management, etc.)
  - **Products Seeded**: Nutrition Consultation, Weight Management Programme, Allergy-Safe Diet, Puppy/Senior Nutrition, Prescription Diet Coordination
  - **Bundles Seeded**: Nutrition Starter Pack (₹2,199), Premium Nutrition Programme (₹5,999), Puppy Nutrition Bundle (₹2,999)
  - **APIs**: `GET /api/care/products?care_type=feed`, `GET /api/care/bundles?category=feed`
  
- **Insure** services added to Paperwork pillar - 5 service types (quote_request, policy_review, claim_assistance, renewal_reminder, compare_plans)
  - **Products Seeded**: Free Quote Comparison, Policy Review (₹499), Claim Assistance (₹299), Renewal Mgmt (₹199), Complete Package (₹999)
  - **Bundles Seeded**: Insurance Essentials (₹399), Complete Insurance Care (₹999), Annual Concierge (₹2,499)
  - **APIs**: `GET /api/paperwork/insure/services`, `POST /api/paperwork/insure/request`, `GET /api/paperwork/bundles?category=insure`
  
- **Unified Flow Integration**: All insurance requests automatically create Service Desk tickets, Unified Inbox entries, and Admin notifications

---

## What's Been Implemented (Session: Jan 30, 2026 - Previous)

### 🚀 PHASE 1: Foundation & Quick Wins - IN PROGRESS

#### ✅ Backend: Engagement Engine Created
- **File**: `/app/backend/engagement_engine.py`
- **Features**:
  - Pet Milestones API (CRUD + auto-detect)
  - Shareable Card Templates API
  - Pet Parent Streaks API
  - Pull-to-refresh Data Sync API
- **Admin Configurable**:
  - 13 milestone types with points rewards
  - 6 card templates (Classic, Sunset, Ocean, Forest, Rose, Minimal)
  - Streak rewards configuration (3, 7, 14, 30, 60, 100 days)

#### ✅ Frontend Components Created
1. **PetMilestoneTimeline.jsx** - Beautiful timeline of pet milestones with auto-detect
2. **ShareablePetCard.jsx** - Instagram-worthy shareable cards with multiple templates
3. **PetParentStreak.jsx** - Gamification streak tracker with rewards preview
4. **SwipeablePetCards.jsx** - Swipe between pets for multi-pet households
5. **PullToRefreshIndicator.jsx** + **usePullToRefresh.js** - Pull-to-refresh hook and UI

#### ✅ Integrations
- ShareablePetCard integrated into UnifiedPetPage (replaces old share modal)
- PetMilestoneTimeline added to Memories tab
- html2canvas installed for card image generation

#### 🔄 Still To Do (Phase 1)
- [x] Add SwipeablePetCards to MemberDashboard ✅
- [x] Integrate PetParentStreak into dashboard header ✅
- [x] Add PullToRefresh to dashboard ✅
- [x] Create Admin UI for milestone/streak configuration ✅

#### ✅ Phase 1 Complete!
All Phase 1 features are now integrated:
- Pull-to-refresh on mobile dashboard
- Swipeable pet cards for multi-pet households
- Streak indicator in dashboard header (mobile + desktop)
- Full Admin panel for engagement settings

---

### ✅ Pet Profile (UnifiedPetPage) Mobile UI Optimization - COMPLETED
**Requirement**: Optimize the Pet Profile page for 99% mobile users - easy to see, one-tap access, self-explanatory.

**Mobile Changes**:
1. **Compact Header**: Back button, pet name, edit button - no clutter
2. **Horizontal Pet Card**: Pet photo (smaller) + name + breed + soul score badge + dates in one row
3. **4 Quick Action Buttons**: Soul, Health, Memories, Services - direct one-tap access with active state highlighting
4. **Secondary Tab Row**: Chats, Pet Pass, Share - as pill buttons below hero
5. **Hidden Desktop Tab Bar**: Mobile uses quick actions instead of scrollable tabs

**Desktop Preserved**: Original full layout with large photo, stats cards, and horizontal tab navigation.

**Files Modified**:
- `/app/frontend/src/pages/UnifiedPetPage.jsx`

---

### ✅ Pulse Removed - Mira is Primary ✅
**Change**: Removed redundant Pulse button and replaced with Mira throughout the app.

**What was removed**:
- PulseButton and Pulse components from MemberDashboard
- Pulse FAB from MobileNavBar (replaced with Mira FAB)

**What was added**:
- Mira FAB in MobileNavBar center position (purple/pink gradient with pulse animation)
- Haptic feedback on Mira tap
- Opens MiraAI chat via custom event dispatch

**Files Modified**:
- `/app/frontend/src/pages/MemberDashboard.jsx` - Removed Pulse imports and components
- `/app/frontend/src/components/MobileNavBar.jsx` - Replaced Pulse with Mira FAB
- `/app/frontend/src/index.css` - Added .mira-fab CSS styles

### ✅ Member Dashboard Mobile UI Optimization - COMPLETED
**Requirement**: Optimize the Member Dashboard for 99% mobile users - easy to see, one-tap access, no double flows.

**Mobile Changes**:
1. **Compact Pet Hero Card**: Pet photo + name + soul score + points + birthday in a horizontal layout
2. **4 Quick Action Buttons**: My Pet, Celebrate, Shop, Ask Mira - direct one-tap access
3. **Single-Row Scrollable Tabs**: Home, Pets, Services, Orders, Rewards, More - with active gradient highlight
4. **Removed Two-Row Grid**: Cleaner, less overwhelming navigation

**Desktop Preserved**: Original full hero layout with large pet photo, stats cards, and action buttons.

**Files Modified**:
- `/app/frontend/src/pages/MemberDashboard.jsx`

---

## What's Been Implemented (Session: Jan 29, 2026)

### ✅ SEV-1 Unified Flow Fix - RESOLVED
**Root Cause Found**: Multiple backend endpoints were NOT creating the full unified flow (Notification + Ticket + Inbox). They showed "success" to users but only created partial records.

**Fixed Endpoints**:
1. `/api/concierge/experience-request` - Now creates full unified flow
2. `/api/celebrate/requests` - Now creates full unified flow  
3. `/api/learn/request` - Now creates full unified flow
4. All pillar-specific request endpoints verified working

**Verification**: All requests now appear in Admin Panel → Notifications, Service Desk, and Unified Inbox.

### ✅ Mira AI Pillar Panel Links Fix
**Problem**: Suggestion buttons on pillar pages (Paperwork, Advisory, etc.) weren't working - they opened chat but didn't send the message.

**Fix**: Added `sendDirectMessage()` function to `MiraContextPanel.jsx` that directly sends messages to Mira API instead of relying on state updates + timeouts.

### ✅ Pet Soul Score Display Fix
**Problem**: Soul Score showing 0% for Mojo even though database had 37.8%.

**Fix**: Updated `load_pet_soul()` in `mira_routes.py` to include `soul_score` and `overall_score` fields in the response.

### ✅ Mira AI Quick Actions Fix
**Problem**: Quick action buttons in MiraAI.jsx widget weren't sending messages reliably.

**Fix**: Refactored `handleQuickAction()` to directly call the Mira API instead of using state + setTimeout hack.

## What's Been Implemented (Session: Jan 31, 2026)

### ✅ StayManager Admin Panel - COMPLETED
**Task**: Complete the Stay pillar admin management panel with full CRUD operations.

**Status**: COMPLETE - The StayManager.jsx component was already fully implemented with 1000+ lines of code.

**Fixed Issue**: Import path was incorrect in Admin.jsx - changed from `../components/StayManager` to `../components/admin/StayManager`.

**Features Available in StayManager**:
1. **Requests Tab**: View and manage stay/boarding requests with status filters
2. **Properties Tab**: CRUD for pet-friendly properties (hotels, resorts, villas, homestays, farmstays)
3. **Partners Tab**: Manage stay partners and property owners
4. **Products Tab**: Travel products and accessories
5. **Bundles Tab**: Travel bundles with pricing
6. **Stories Tab**: Pawcation testimonials/stories management
7. **Tips Tab**: Stay-specific tips for pet parents
8. **Settings Tab**: Auto-assign, confirmations, availability calendar toggles

**Files Modified**:
- `/app/frontend/src/pages/Admin.jsx` - Fixed import path

### ✅ All Pillar Admin Managers - VERIFIED COMPLETE
All 14 pillar admin managers are already implemented and integrated:
- ✅ CelebrateManager.jsx (1540 lines)
- ✅ DineManager.jsx
- ✅ StayManager.jsx (1033 lines)
- ✅ TravelManager.jsx (1500 lines)
- ✅ CareManager.jsx (1356 lines)
- ✅ EnjoyManager.jsx (1156 lines)
- ✅ FitManager.jsx (1400+ lines)
- ✅ LearnManager.jsx (1503 lines)
- ✅ AdvisoryManager.jsx
- ✅ PaperworkManager.jsx
- ✅ EmergencyManager.jsx
- ✅ FarewellManager.jsx
- ✅ AdoptManager.jsx
- ✅ ShopManager.jsx

---

## Pending Issues / Upcoming Tasks

### 🔴 P0 - Immediate Priority

#### 1. Apply FitPage/StayPage Design to Remaining Pillar Pages
**Task**: Apply the new component-based design from Fit/Stay pages to all other pillar pages:
- CarePage, TravelPage, EnjoyPage, LearnPage, DinePage, CelebratePage
**Components to Reuse**: `ConversationalEntry`, `QuickWinTip`, `ConciergeExperienceCard`, `PetJourneyRecommendations`
**Template Reference**: Use `/app/frontend/src/pages/StayPage.jsx` as the design template

#### 2. Mira AI Visual Guidance
**Task**: Implement logic where Mira's chat responses trigger on-page actions (filter/display products and journey cards)
**Status**: Mira UI has been improved, but core brain needs to be connected to page content

### 🟠 P1 - Medium Priority

#### 1. Abandoned Cart Recovery Nudges
**Task**: Implement Mira proactive nudges for users who have left items in their cart
**Backend**: Extend `mira_nudges.py` with abandoned_cart nudge type

#### 2. Paw Points Display Issue  
**Issue**: Incorrect paw points display for specific user account.
**Debug Steps**:
1. Check API endpoint for paw points
2. Verify calculation logic
3. Compare database value with displayed value

#### 3. Razorpay Payments Failing
**Issue**: Payment gateway integration not working
**Debug Steps**:
1. Attempt test payment
2. Check `/api/checkout/create_checkout_order` logs
3. Inspect Razorpay dashboard

### 🟡 P2 - Backlog

1. **PDF Invoice Generation**
2. **Centralized Item Intelligence Form** - Full implementation
3. **Partner Portal** - B2B clients portal
4. **Community Challenges** - Pet engagement gamification
5. **Pet Expense Tracker** - Financial tracking feature
6. **Health Graphs** - Visual health data
7. **Quick Reorder** - Fast reorder from history
8. **Subscription Box Builder & Referral Program**

## Technical Architecture

```
/app
├── backend/
│   ├── server.py              # Main FastAPI server, route registrations
│   ├── timestamp_utils.py     # UTC timestamp utility (standardized)
│   ├── mira_routes.py         # Mira AI chat & context endpoints
│   ├── concierge_routes.py    # FIXED: Concierge experience requests
│   ├── celebrate_routes.py    # FIXED: Celebrate requests
│   ├── learn_routes.py        # FIXED: Learn/training requests
│   ├── fit_routes.py          # Fit pillar (working)
│   ├── care_routes.py         # Care pillar (working)
│   ├── travel_routes.py       # Travel pillar (working)
│   └── checkout_routes.py     # Checkout & GST calculations
│
├── frontend/src/
│   ├── components/
│   │   ├── MiraAI.jsx           # FIXED: Quick actions
│   │   ├── MiraContextPanel.jsx # FIXED: Pillar suggestion links
│   │   ├── UnifiedCheckout.jsx  # TODO: GST/Shipping order
│   │   └── ui/                  # Shadcn components
│   ├── pages/
│   │   ├── Admin.jsx            # Admin panel (working)
│   │   ├── FitPage.jsx          # Fit pillar (working)
│   │   ├── CarePage.jsx         # Care pillar (working)
│   │   └── ...
│   └── utils/
│       └── unifiedApi.js        # Central API client for unified flow
│
└── memory/
    └── PRD.md                   # This file
```

## Key API Endpoints

### Unified Flow Endpoints (All Working)
- `POST /api/fit/request` - Fit requests → Notification + Ticket + Inbox
- `POST /api/care/request` - Care requests → Notification + Ticket + Inbox
- `POST /api/travel/request` - Travel requests → Notification + Ticket + Inbox
- `POST /api/concierge/experience-request` - Concierge cards → Notification + Ticket + Inbox
- `POST /api/celebrate/requests` - Celebrate requests → Notification + Ticket + Inbox
- `POST /api/learn/request` - Learn requests → Notification + Ticket + Inbox
- `GET /api/search/universal?create_signal=true` - Search → Notification + Ticket + Inbox

### Admin Panel Endpoints
- `GET /api/admin/notifications` - Admin notifications list
- `GET /api/tickets` - Service desk tickets
- `GET /api/channels/intakes` - Unified inbox entries

### Mira AI Endpoints
- `POST /api/mira/chat` - Chat with Mira
- `POST /api/mira/context` - Get pillar-specific context

## Test Credentials
- **Member**: `dipali@clubconcierge.in` / `test123`
- **Admin**: `aditya` / `lola4304`

## Deployment
- **Preview URL**: https://mobilepaw.preview.emergentagent.com
- **Production**: thedoggycompany.in (deploying tomorrow)

---
*Last Updated: January 30, 2026*

---

## Session: Jan 30, 2026 - Deployment Fix

### ✅ AUTO-SEEDING FIX - COMPLETED

**Issue**: Production deployment had empty data for engagement components (Stories, Tips, Products)

**Solution Implemented**:
1. **Startup Auto-Seeding**: `initialize_engagement_data()` runs on server startup, seeding:
   - 4 Transformation Stories for Fit pillar
   - 10 Quick Win Tips for Fit pillar
   - Only seeds if collections are empty (safe for existing data)

2. **Universal Seed Button Enhancement**: Updated `/api/admin/universal-seed` endpoint to include:
   - Products, Services, Unified Products
   - Pricing Tiers, Shipping Rules
   - Hardcoded Product Options (Base, Flavour, Size)
   - **NEW: FAQs, Collections, Services (critical data)**
   - **NEW: Engagement Data (Stories, Tips)**

3. **Admin UI Updated**: Toast message now shows Stories and Tips count after Universal Seed

### ✅ DEPLOYMENT BLOCKER FIX - COMPLETED

**Issue**: .gitignore was blocking .env files, preventing Emergent deployment

**Fixes Applied**:
1. Cleaned `.gitignore` - removed all `*.env` and `*.env.*` blocking patterns (reduced from 1490 to 86 lines)
2. Simplified `CORS_ORIGINS=*` in backend/.env for Emergent Kubernetes deployment
3. Verified all deployment requirements pass

### Pending Issues (P2)
- Razorpay Payments Failing
- Paw Points display incorrect for specific user
- Pawmeter Score bug (needs user clarification - 0-100 vs 0-10)

### Upcoming Tasks (P1)
- Redesign all Concierge Experience pages (Care, Celebrate, Dine, Stay, Travel)
- Abandoned Cart Recovery Nudges

### Future/Backlog (P2-P3)
- Centralised Item Intelligence Form
- Partner Portal for B2B
- PDF Invoice Generation
- Community Challenges, Pet Expense Tracker
- Subscription Box Builder & Referral Program

---

## Session: Jan 31, 2026 - Mobile UI Fixes & Pillar Page Redesign

### ✅ MIRA AI - VERIFIED WORKING
- Tested chat functionality - both typing and voice work in preview environment
- API endpoint `/api/mira/chat` responding correctly
- If not working in production, check OpenAI API key configuration

### ✅ MOBILE FOOTER FIX - COMPLETED
**Issue**: Footer was warped, misaligned, and overlapping with floating navigation bar

**Fixes Applied**:
1. **Removed MobileNavBar** - Commented out the component in `MemberDashboard.jsx`
2. **Hidden mobile nav CSS** - Set `.mobile-nav-container { display: none !important }` in `index.css`
3. **Improved Footer mobile layout** - Changed to `grid-cols-1` on mobile, proper vertical stacking
4. **Removed extra bottom padding** - No longer needed without floating nav

### ✅ CONCIERGE EXPERIENCE CARDS - REDESIGNED FOR MOBILE
**Issue**: Cards looked "boxy" and not elegant like Fit page

**Fixes Applied to `ConciergeExperienceCard.jsx`**:
1. **2x2 grid on mobile** - All pillar pages now use `grid-cols-2` for mobile
2. **Responsive text sizing** - Smaller text on mobile (`text-xs sm:text-sm`)
3. **Compact card layout** - Reduced padding and heights on mobile
4. **Cleaner look** - Rounded corners, subtle borders

**Pages Updated**:
- TravelPage.jsx - 2x2 grid + Load More for products
- CarePage.jsx - 2x2 grid for experiences
- EnjoyPage.jsx - 2x2 grid for experiences
- LearnPage.jsx - 2x2 grid for experiences
- FitPage.jsx - Load More for products
- DinePage.jsx - 2x2 grid for restaurants + Load More

### ✅ LOAD MORE FUNCTIONALITY - ADDED
**New Feature**: "Load More" buttons for products and restaurants

**Implementation**:
- State variable `productsToShow` / `restaurantsToShow` starts at 8-10
- Click "Load More" increments by 8-10
- Shows count: "Showing X of Y"
- Styled with rounded full buttons

### Pending Issues (P2)
- Razorpay Payments Failing
- Paw Points display incorrect

### Upcoming Tasks (P1)
- Further mobile optimization for all pillar pages
- Stay page redesign


---

## Session: Jan 31, 2026 - Multi-Pet Support & Pillar Architecture

### ✅ MULTI-PET SELECTION - IMPLEMENTED
**New Component**: `MultiPetSelector.jsx`
- Select one, multiple, or all pets for services
- Visual grid with pet photos
- "Select All" / "Clear All" buttons for multi-booking
- Color-coded by pillar (teal for Fit, rose for Care, etc.)
- Multi-pet bookings get higher priority in tickets

**Updated Pages**:
- FitPage.jsx - Full multi-pet support
- Backend fit_routes.py - Multi-pet data handling

**Ticket Data**:
```javascript
{
  pets: [{id, name, breed, species}, ...],
  pet_count: 3,
  is_multi_pet: true,
  // Legacy single-pet fields preserved for backward compatibility
}
```

### ✅ PILLAR-SPECIFIC TICKET ROUTING - COMPLETE
Every request now flows to **BOTH**:
- A. Central Service Desk (admin_notifications, channel_intakes, service_desk_tickets)
- B. Pillar-specific queue (fit_requests, care_requests, etc.)

**Same ticket → Two views → One source of truth**

### ✅ VOICE SERVICE WIZARD - ADDED
- Mic button in navbar search bar
- Voice recognition for service intents
- Quick service buttons: Grooming, Vet, Training, Boarding, Cake
- Auto-navigation to relevant pillar page

### ✅ FIT PAGE - GOLD STANDARD VERIFIED
Working components on mobile:
- Hero with voice wizard mic
- Quick Win Tips
- Transformation Stories carousel
- Concierge Experiences (2x2 grid with images)
- Mira Picks carousel
- Products with Load More
- Services grid
- Footer (no floating nav overlap)

### Remaining Work:
- Apply Fit page pattern to: Care, Celebrate, Travel, Stay, Dine, Learn, Enjoy
- Each page should have unique visual identity while using same components
- Admin pillar queue views in admin panel


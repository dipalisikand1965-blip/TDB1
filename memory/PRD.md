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

## What's Been Implemented (Session: Jan 30, 2026 - Latest)

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

## Pending Issues / Tomorrow's Tasks

### 🔴 P1 - High Priority

#### 1. Pet Profile Crash for "Mynx"
**Issue**: User reported crash when viewing pet profile for pet named "Mynx".
**Debug Steps**:
1. Log in as the user
2. Navigate to pet profile for "Mynx"
3. Check browser console and backend logs
4. Inspect database for corrupt/unexpected values

#### 2. Paw Points Display Issue  
**Issue**: Incorrect paw points display for specific user account.
**Debug Steps**:
1. Check API endpoint for paw points
2. Verify calculation logic
3. Compare database value with displayed value

### 🟠 P2 - Medium Priority

1. **Razorpay Payments Failing** - Debug payment gateway integration
2. **Mobile UI Transformation** - Member Dashboard mobile optimization
3. **Service Booking Flow** - Mobile optimization

### 🟡 P3 - Backlog

1. **PDF Invoice Generation**
2. **Centralized Item Intelligence Form** - Full implementation
3. **Partner Portal** - B2B clients portal

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
- **Preview URL**: https://petclub-modern.preview.emergentagent.com
- **Production**: thedoggycompany.in (deploying tomorrow)

---
*Last Updated: January 30, 2026*

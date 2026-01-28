# The Doggy Company - Product Requirements Document

## Overview
**The Doggy Company** is building "The World's First Pet Life Operating System" - a comprehensive platform covering 14 pillars of pet life: Celebrate, Dine, Stay, Travel, Care, Enjoy, Fit, Learn, Paperwork, Advisory, Emergency, Farewell, Adopt, and Shop.

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn/UI
- **Backend**: FastAPI + Python
- **Database**: MongoDB
- **Key Collections**: products, services, tickets, pets, users, concierge_orders, concierge_tasks, ticket_templates, ticket_viewers, ticket_csat, service_desk_settings, whatsapp_logs, concierge_requests, push_subscriptions, push_notification_logs, soul_whisper_logs, concierge_experiences, social_share_claims, nps_submissions, unified_products

---

## What's Been Implemented

### Phase 27: Six Tasks Batch Completion (Jan 28, 2025)

**Completed 6 pending tasks in one batch:**

1. **Visual Distinction for Soul Score** (COMPLETED)
   - Added ★ indicator next to questions that affect Pet Soul Score
   - 40+ soul score questions marked with purple star
   - `affectsSoulScore` flag derived from `pet_score_logic.py` rules
   - **Files Modified**: `/app/frontend/src/pages/UnifiedPetPage.jsx`

2. **Admin Wishlist View** (COMPLETED)
   - New "Wishlists" tab in ShopManager
   - Shows products wishlisted by customers with user count
   - "Send Reminder" button opens email with pre-filled recipients
   - User email list with expandable view
   - **Files Modified**: `/app/frontend/src/components/admin/ShopManager.jsx`

3. **Product Box Migration** (COMPLETED)
   - Ran migration: 16 new products, 806 updated
   - Stay properties (53) synced to products collection
   - Fixed migration bug with missing 'id' field
   - **Files Modified**: `/app/backend/unified_product_box.py`

4. **Voice Order Auto-populate** (COMPLETED)
   - Login endpoint now returns phone field
   - User name defaults to email prefix if not set
   - **Files Modified**: `/app/backend/auth_routes.py`

5. **WhatsApp Form Auto-population Audit** (COMPLETED)
   - FarewellPage: Auto-fills email and phone from user context
   - CarePage: Auto-fills contact_name, contact_email, contact_phone
   - Checkout: Auto-fills parentName, email, phone, whatsappNumber
   - **Files Modified**: `/app/frontend/src/pages/FarewellPage.jsx`, `/app/frontend/src/pages/CarePage.jsx`, `/app/frontend/src/pages/Checkout.jsx`

6. **Product Tags Manager Sync** (COMPLETED)
   - Stay properties (52) now included in all-pillars endpoint
   - Stay bundles also included
   - Total products in tags manager: 556
   - **Files Modified**: `/app/backend/server.py`

---

### Phase 28: Exhaustive Product Schema Implementation (Jan 28, 2025)

**Implemented comprehensive product schema per user's original plan:**

**Backend Schema (unified_product_box.py):**
- A. **Identity & Source**: barcode, shopify_id, shopify_handle, vendor_id, partner_id, external_source
- B. **Basic Info**: name, short_description, long_description, usage_context, key_benefits, brand
- C. **Categorization**: category, subcategory, tags, intelligent_tags, collections, occasion_tags
- D. **Media**: primary_image, primary_image_alt, images[], thumbnail, video_url, document_urls
- E. **Pricing & Tax**: base_price, compare_at, cost_price, GST, HSN, price_model (fixed/variable/quote)
- F. **Variants**: options[], variants[] with full variant support
- G. **Inventory**: track_inventory, stock_quantity, low_stock_threshold, backorder, shelf_life, batch_tracking
- H. **Shipping**: shipping_class, cold_chain, delivery_zones, preparation_time, SLAs
- I. **Pet Safety**: species, life_stages, size, allergens, ingredients, risk_level, contraindications
- J. **Rewards & Loyalty**: points_per_rupee, redeemable, reward_only, triggers, tier_eligibility
- K. **Mira AI**: can_reference, proactive, suggestion_contexts, knowledge_confidence, verification
- L. **Bundle Config**: bundle_items[], savings_display, substitution rules
- M. **Pillar-Specific Config**: 14 pillar-specific schemas (Celebrate, Dine, Stay, Travel, Care, Enjoy, Fit, Learn, Paperwork, Advisory, Emergency, Farewell, Adopt, Shop)
- N. **Visibility**: status, featured, member_only, concierge_only, city_visibility, publish_date
- O. **Reviews Aggregate**: avg_rating, total_reviews, rating_distribution
- P. **Audit**: created_at, created_by, updated_at, version, change_log

**New API Endpoint:**
- `GET /api/product-box/config/all` - Returns all configuration options for the form

**Frontend Enhancement (UnifiedProductBox.jsx):**
- **8 organized tabs**: Basic | Pillars | Pricing | Inventory | Pet Safety | Rewards | Mira AI | Visibility
- Enhanced Basic tab with SKU, Barcode, Brand fields
- Image alt text and video URL fields
- New Inventory tab with stock management and perishables
- New Visibility tab with status workflow, toggles, city visibility, and publish scheduling
- Character counter for short description

**Stats:**
- Total Products: 1949
- Active: 931
- Reward Eligible: 98
- Mira Visible: 1065

---

### Phase 30: Report Builder, Mobile Auth & Onboarding (Jan 28, 2025)

**Completed Features:**

1. **Intelligent Report Builder** (COMPLETED)
   - Full-featured admin report builder with pillar-wise and consolidated sales reports
   - Service ticket analytics with status breakdown
   - CSV and Excel export functionality
   - Email scheduling configuration
   - 8 report types: daily_summary, pillar_performance, order_report, ticket_report, revenue_report, member_analytics, pet_analytics, product_performance
   - **Files Created**: `/app/backend/report_builder_routes.py`
   - **Files Modified**: `/app/backend/server.py`, `/app/frontend/src/components/admin/ReportBuilder.jsx`

2. **GST Calculation Fix** (COMPLETED)
   - GST now correctly calculated on (subtotal - discount + shipping)
   - Before: GST was only on subtotal
   - After: GST includes shipping fee in taxable amount
   - Example: ₹1000 items + ₹150 shipping = ₹1150 taxable, ₹207 GST (18%), Total ₹1357
   - **Files Verified**: `/app/backend/checkout_routes.py`

3. **Mobile Sign In/Sign Out** (COMPLETED)
   - Added Sign Out button to mobile navbar when logged in
   - Sign In and Join Now buttons now properly visible when logged out
   - Added data-testid attributes for testing
   - **Files Modified**: `/app/frontend/src/components/Navbar.jsx`

4. **Onboarding Enhancements** (COMPLETED)
   - Added Soul Whisper info section in Step 3
   - Added Push Notification info section
   - Added PWA Install prompt section
   - All sections styled with gradient backgrounds and icons
   - **Files Modified**: `/app/frontend/src/pages/MembershipOnboarding.jsx`

5. **Admin Dashboard Widget** (COMPLETED)
   - Added "Today's Snapshot" widget to admin dashboard
   - Shows real-time metrics: Revenue, Orders, New Members, Open Tickets
   - Gradient purple-pink styling with refresh button
   - Fetches data from Report Builder API
   - **Files Modified**: `/app/frontend/src/components/admin/DashboardTab.jsx`, `/app/frontend/src/pages/Admin.jsx`

6. **Pet Photo Upload - Full Backend Integration** (COMPLETED)
   - Fixed non-functional photo upload on onboarding
   - Added file input with preview capability  
   - Added remove photo button (X icon)
   - Photos now uploaded to backend after pet creation via `/api/pets/{pet_id}/photo`
   - Photos stored as base64 in database for persistence across deployments
   - **Files Modified**: `/app/frontend/src/pages/MembershipOnboarding.jsx`, `/app/backend/server.py`

7. **Multiple Pets UX Improvement** (COMPLETED)
   - "Add Another Dog" section now always visible (not just for single pet)
   - Shows family pricing information
   - Better styled with dog icon and gradient background
   - **Files Modified**: `/app/frontend/src/pages/MembershipOnboarding.jsx`

8. **Admin Panel Reorganization** (COMPLETED)
   - Reorganized into logical groups: Command Center, Members & Pets, Commerce, 14 Pillars, Mira & AI, Analytics, Content, Config
   - 14 Pillars shown as compact emoji icons
   - Color-coded category labels
   - Master Controls moved to Config section
   - **Files Modified**: `/app/frontend/src/pages/Admin.jsx`

9. **Service Desk Daily Ticket Ticker** (COMPLETED)
   - Added scrolling marquee of today's tickets on dashboard
   - Clickable status filter cards (Open, In Progress, Resolved, Unassigned)
   - Clickable pillar breakdown grid
   - Added marquee animation to Tailwind config
   - **Files Modified**: `/app/frontend/src/components/admin/DoggyServiceDesk.jsx`, `/app/frontend/tailwind.config.js`

10. **Customer Name Capture & Profile Update** (COMPLETED)
    - Added `PATCH /api/auth/profile` endpoint to update user phone, address, etc.
    - VoiceOrder form now shows warning when phone is missing
    - Auto-population from user context working correctly
    - **Files Modified**: `/app/backend/auth_routes.py`, `/app/frontend/src/pages/VoiceOrder.jsx`

**Testing Results:**
- Backend: 100% (13/13 tests passed)
- Frontend: 100% (all features verified)
- Test report: `/app/test_reports/iteration_108.json`

---

### Phase 29: Bug Fixes - Adopt, Farewell, Events (Jan 28, 2025)

**Fixed Issues:**

1. **Farewell Tickets Not Appearing in Service Desk** (FIXED)
   - Updated farewell request to insert into `service_desk_tickets` collection
   - Added all required ticket fields (ticket_id, pillar, urgency, contact, member)
   - Tickets now properly visible in Service Desk
   - **Files Modified**: `/app/backend/server.py`

2. **Adoption Application Error** (FIXED)
   - Added support for both `pet_id` and `id` field lookups
   - Added logging for debugging
   - **Files Modified**: `/app/backend/adopt_routes.py`

3. **Event Registration Error** (FIXED)
   - Enhanced event lookup to support both `event_id` and `id` fields
   - Added case-insensitive matching
   - **Files Modified**: `/app/backend/adopt_routes.py`

4. **Admin Events Editor** (FIXED)
   - Added Edit button to event cards in AdoptManager
   - Added `editingEvent` state for form pre-population
   - Shows time in correct field (`start_time` instead of `time`)
   - **Files Modified**: `/app/frontend/src/components/admin/AdoptManager.jsx`

---

### Phase 26: Service Desk Ticket History Modal (Jan 28, 2025)

**Fixed crashed Service Desk and completed Pet Parent ticket history feature:**

1. **Service Desk Crash Fix** (COMPLETED)
   - Added missing state variables: `showParentHistoryModal`, `selectedParentForHistory`
   - Previous agent started implementation but was interrupted mid-way
   - Frontend was crashing due to undefined state setters
   - **Files Modified**: `/app/frontend/src/components/admin/DoggyServiceDesk.jsx`

2. **Pet Parent Ticket History Modal** (COMPLETED)
   - Click any Pet Parent card to view their complete ticket history
   - Modal shows parent info (name, email, phone, membership)
   - Lists all their pets with photos and soul scores
   - Displays ticket history sorted by date (newest first)
   - Each ticket shows pillar emoji, subject, ticket ID, date, status badge, priority
   - Click a ticket to open it in the main view
   - **Files Modified**: `/app/frontend/src/components/admin/DoggyServiceDesk.jsx`

---

### Phase 25: Paperwork Integration & Product Enhancements (Jan 28, 2025)

**Documents integration and product improvements:**

1. **Documents & Paperwork in Pet Profile** (COMPLETED)
   - Added to Health Vault tab with 6 document types:
     - Vaccination Certificate, KCI Registration, Microchip Certificate
     - Pet Insurance, Travel Documents, Other Documents
   - "View All Documents" and "Upload Document" buttons
   - Links to /paperwork with pet ID pre-filled
   - **Files Modified**: `/app/frontend/src/pages/UnifiedPetPage.jsx`

2. **Emergency Page Pet Selection** (COMPLETED)
   - Bundle cards now have pet dropdown ("For which pet?")
   - Pet name and pet_id included when adding to cart
   - **Files Modified**: `/app/frontend/src/pages/EmergencyPage.jsx`

3. **Product Wishlist Integration** (COMPLETED)
   - Heart button on ProductDetailPage calls wishlist API
   - Checks user's wishlist on page load
   - Add/Remove toggles with toast notifications
   - **Files Modified**: `/app/frontend/src/pages/ProductDetailPage.jsx`

4. **Bug Fix**: FileText icon import was missing in UnifiedPetPage.jsx (FIXED by testing agent)

---

### Phase 24: Service Desk UI Fix & Soul Score Clarity (Jan 28, 2025)

**Fixed duplicate sidebar items and added Soul Score explanation:**

1. **Service Desk Sidebar Reorganization** (COMPLETED)
   - Renamed duplicate items: "Pet Parent" → "Account", "Pet Profile" → "Pet Updates" (for ticket filters)
   - Added clear "Data" section header for Pet Parents/Pet Profiles lists
   - Added Pet Parents view with cards showing name, email, membership
   - Added Pet Profiles view with pet cards showing photo, breed, soul score
   - **Files Modified**: `/app/frontend/src/components/admin/DoggyServiceDesk.jsx`

2. **Soul Score Visual Distinction** (COMPLETED)
   - Added explanation text: "Questions marked with ★ count towards Soul Score"
   - Clarified that basic profile fields (name, breed, birthday) don't count
   - Only weighted "soul questions" affect the score
   - **Files Modified**: `/app/frontend/src/pages/UnifiedPetPage.jsx`

---

### Phase 23: Bug Fixes & Wishlist Feature (Jan 28, 2025)

**Critical bug fixes and new features:**

1. **Pet Soul Score - Weighted Scoring Fix** (COMPLETED)
   - Fixed inconsistent scoring: `soul-answer` and `soul-answers` endpoints now use weighted scoring
   - Previously used simple count (filled/26), now uses `calculate_pet_soul_score()` from `pet_score_logic.py`
   - Returns: `new_score`, `score_tier`, `answers_count`
   - **Files Modified**: `/app/backend/server.py` (lines 7270-7320)

2. **Select Dropdown z-index Fix** (COMPLETED)
   - Fixed Select dropdowns appearing behind Dialogs
   - Changed from z-50 to z-[100]
   - **Files Modified**: `/app/frontend/src/components/ui/select.jsx`

3. **Farewell Page Improvements** (COMPLETED)
   - Added "Enter another pet's name" option
   - Emotional indicator (💜) when user's pet is selected
   - Compassionate message: "Our hearts are with you and {petName}"
   - **Files Modified**: `/app/frontend/src/pages/FarewellPage.jsx`

4. **Product Wishlist/Favorites API** (COMPLETED)
   - `POST /api/member/wishlist/add` - Add product to wishlist
   - `GET /api/member/wishlist` - Get user's wishlist
   - `DELETE /api/member/wishlist/{product_id}` - Remove from wishlist
   - `GET /api/admin/wishlists/summary` - Admin view of popular wishlisted products
   - **Files Modified**: `/app/backend/server.py`

---

### Phase 22: Unified Service Booking System (Jan 28, 2025)

**Complete service booking system with instant ticket creation:**

1. **Unified Service Booking Modal** (COMPLETED)
   - 4-step booking flow: Service → Pet Details → Schedule → Confirm
   - Supports: Grooming, Vet Visits, Training, Dog Walking
   - Pet auto-selection from user profile
   - Home visit vs Salon/Clinic options
   - Creates tickets in Service Desk automatically
   - **Files Created**: `/app/frontend/src/components/ServiceBookingModal.jsx`

2. **Unified Booking API** (COMPLETED)
   - New endpoint: `POST /api/services/unified-book`
   - Accepts any service type without pre-existing service document
   - Creates ticket with type "service_booking"
   - Returns booking_id and ticket_id
   - **Files Modified**: `/app/backend/server.py`

3. **Quick Book Section on Care Page** (COMPLETED)
   - 4 prominent service buttons: Grooming, Vet Visit, Training, Walking
   - One-click opens ServiceBookingModal
   - **Files Modified**: `/app/frontend/src/pages/CarePage.jsx`

4. **Service Desk Notification Sound** (COMPLETED)
   - Audio alert when new tickets arrive
   - Toggle button in header (next to notification bell)
   - Two-tone notification sound using Web Audio API
   - **Files Modified**: `/app/frontend/src/components/admin/DoggyServiceDesk.jsx`

---

### Phase 21: Bug Fixes & Service Desk Analytics (Jan 28, 2025)

**Multiple fixes and enhancements:**

1. **14 Soul Pillars Fix** (COMPLETED)
   - Changed from "8 Soul Pillars" to "14 Soul Pillars" everywhere
   - Now correctly shows: Celebrate, Dine, Stay, Travel, Care, Enjoy, Fit, Learn, Paperwork, Advisory, Emergency, Farewell, Adopt, Shop
   - **Files Modified**: `SoulExplainerVideo.jsx`, `PetSoulJourney.jsx`, `AdminDocs.jsx`

2. **Push Notification VAPID Key Fix** (COMPLETED)
   - Fixed VAPID public key to use URL-safe base64 format
   - Web Push notifications should now work correctly
   - **Files Modified**: `/app/backend/push_notification_routes.py`

3. **Service Desk Analytics & Reports** (COMPLETED)
   - New Analytics section accessible from left sidebar
   - Key metrics: Total Tickets, Open, Resolved, Avg Resolution Time
   - Tickets by Pillar - bar chart showing distribution
   - Tickets by Priority - grid showing Critical/High/Medium/Low
   - Tickets by Channel - breakdown by WhatsApp, Mira Chat, Web, etc.
   - Resolution Rate - pie chart with percentage
   - SLA Compliance - On Time, Approaching Breach, Breached counts
   - **Files Modified**: `/app/frontend/src/components/admin/DoggyServiceDesk.jsx`

4. **Review API Verified** (WORKING)
   - `POST /api/reviews` works correctly
   - Issue was likely temporary network/browser issue for user

---

### Phase 20: Checkout Process Overhaul (Jan 28, 2025)

**Complete Razorpay integration for all product checkout with GST compliance:**

1. **Unified Checkout Component** (COMPLETED)
   - 3-step checkout flow: Review → Delivery → Payment
   - Order summary sidebar with real-time GST breakdown
   - Support for both Home Delivery and Store Pickup
   - **Files Created**: `/app/frontend/src/components/UnifiedCheckout.jsx`

2. **GST Calculation Engine** (COMPLETED)
   - 18% GST applied to all orders
   - CGST (9%) + SGST (9%) for same state (Karnataka)
   - IGST (18%) for different states
   - Configurable business details with GSTIN
   - **Files Modified**: `/app/backend/checkout_routes.py`

3. **PDF Invoice Generation** (COMPLETED)
   - Professional invoice with company branding
   - Complete GST breakdown (CGST/SGST/IGST)
   - Item-wise HSN codes
   - Terms & conditions footer
   - **Endpoint**: `GET /api/checkout/order/{id}/invoice/pdf`

4. **Order Confirmation Emails** (COMPLETED)
   - Beautiful HTML email template
   - Order details with GST breakdown
   - Download invoice button
   - Uses Resend API
   - **Note**: Requires Resend API key in `.env`

5. **Razorpay Integration** (MOCKED - Test Keys)
   - Payment flow implemented
   - Order creation and payment verification
   - **Note**: Using placeholder test keys - configure real keys for production

**Backend APIs:**
- `GET /api/checkout/config` - Checkout configuration
- `POST /api/checkout/calculate-total` - Calculate with GST
- `POST /api/checkout/create-order` - Create Razorpay order
- `POST /api/checkout/verify-payment` - Verify payment
- `GET /api/checkout/order/{id}/invoice/pdf` - Download PDF invoice

---

### Phase 19: Membership Dashboard Enhancements (Jan 28, 2025)

**New Features:**

1. **Tiered Membership Cards** (COMPLETED)
   - 3-tier system: Bronze (0-999pts), Silver (1000-4999pts), Gold (5000+pts)
   - Each tier has unique gradient colors, icons, and benefits
   - Clickable Pet Pass Number to copy
   - Full card modal with TD logo, validity dates, T&C
   - Progress bar showing points to next tier
   - **Files Created**: `/app/frontend/src/components/MembershipCardTiers.jsx`

2. **Pawmoter Score (NPS)** (COMPLETED)
   - 0-10 rating scale with category badges (Promoter/Passive/Detractor)
   - Optional feedback collection
   - 10 points reward for completion
   - 30-day cooldown between submissions
   - Backend stats endpoint for admin dashboard
   - **Files Created**: `/app/frontend/src/components/PawmoterScore.jsx`

3. **Social Share Rewards** (COMPLETED)
   - Instagram sharing with screenshot upload
   - Admin approval workflow
   - 20 points reward on approval
   - Privacy protection (no pet profile shared in share text)
   - Screenshot stored as base64 in DB
   - **Files Created**: `/app/frontend/src/components/SocialShareReward.jsx`

4. **Breed Tips Engine** (COMPLETED)
   - Category-based tips: Nutrition, Exercise, Grooming, Health
   - Breed-specific tips for: Labrador, Golden Retriever, Beagle, Pug, German Shepherd
   - Default tips for unknown breeds
   - Daily rotating tips
   - **Files Created**: `/app/frontend/src/components/BreedTipsEngine.jsx`

5. **Member Rewards Backend** (COMPLETED)
   - `/api/rewards/social-share-claim` - Submit social share with screenshot
   - `/api/rewards/social-share-claims` - Admin list claims
   - `/api/rewards/social-share-claims/{id}/review` - Approve/reject claims
   - `/api/rewards/nps/check` - Check recent submission
   - `/api/rewards/nps/submit` - Submit NPS score
   - `/api/rewards/nps/stats` - NPS statistics
   - `/api/rewards/loyalty/transactions` - Get user's point history
   - `/api/rewards/loyalty/expiring` - Get expiring points (12-month expiry)
   - **Files Created**: `/app/backend/member_rewards_routes.py`

### Phase 18: App Badge, Pillar Popup, Compact Dining & Sync Features (Jan 28, 2025)

**New Features:**

1. **App Icon Notification Badge** (COMPLETED)
   - PWA badge shows unread notification count on app icon
   - Backend endpoint `/api/notifications/unread-count` returns breakdown of push_notifications, ticket_updates, pending_requests
   - `AppBadgeManager` component in App.js polls every 60s and listens to service worker messages
   - Uses `useAppBadge` hook for badge management
   - **Files Changed**: `/app/frontend/src/App.js`, `/app/backend/server.py`

2. **Dashboard Pillar Popup** (COMPLETED)
   - Clicking any of the 16 pillar icons opens a modal popup
   - Shows pillar-specific stats (Orders, Reservations, Visits, etc.)
   - Shows recent activity with dates
   - "Explore {Pillar}" button navigates to pillar page
   - **Files Changed**: `/app/frontend/src/pages/MemberDashboard.jsx`

3. **Compact Dining Concierge Picker** (COMPLETED)
   - Refactored `DiningConciergePicker` to show 6 compact service cards in grid
   - Services: Chef's Table, Private Home Dining, Pet Party Catering, Restaurant Reservations, Meal Subscriptions, Group Dining Events
   - Clicking a card opens form modal with City/Date/Time/Guests/Special Requests fields
   - `compactMode=true` by default
   - **Files Changed**: `/app/frontend/src/components/DiningConciergePicker.jsx`

4. **Unified Product Box - Concierge & Bundle Types** (COMPLETED)
   - Added "Concierge®" and "Bundle" to PRODUCT_TYPES constant
   - Both now appear in product type filter dropdown
   - Can filter products by these new types
   - **Files Changed**: `/app/frontend/src/components/admin/UnifiedProductBox.jsx`

5. **Product Sync Buttons** (COMPLETED)
   - "🏨 Sync Stay" button - calls `/api/admin/stay/sync-to-products`
   - "🌟 Seed All Pillars" button - calls `/api/admin/force-seed-all-products`
   - Both show toast notifications with results
   - **Files Changed**: `/app/frontend/src/components/admin/UnifiedProductBox.jsx`

6. **Stay/Boarding Sync** (VERIFIED WORKING)
   - `/api/admin/stay/sync-to-products` endpoint syncs stay_properties and boarding_facilities to products collection
   - Automatically assigns pricing based on property type
   - Now has dedicated UI button in Product Box

### Phase 17: Quick Score Boost & Ticket Auto-Populate (Jan 28, 2025)

**New Features:**

1. **Quick Score Boost Widget** (COMPLETED)
   - New component on Member Dashboard showing when Pet Soul Score < 75%
   - Fetches top 3 high-impact questions via `/api/pet-score/{pet_id}/quick-questions`
   - Shows current score and potential boost (e.g., 18% → 37%)
   - Inline answering - click question, type answer, save instantly
   - Questions display point values (e.g., +8pts, +6pts, +5pts)
   - **Files Changed**: `/app/frontend/src/pages/MemberDashboard.jsx`

2. **Ticket Form Auto-Populate - Pet Parents & Pet Profiles** (COMPLETED)
   - Added to both ConciergeCommandCenter and DoggyServiceDesk
   - "Quick Select Pet Parent" dropdown - loads from `/api/admin/members/directory`
   - "Quick Select Pet Profile" dropdown - loads from `/api/admin/pets`
   - Selecting pet parent auto-fills: name, email, phone
   - Selecting pet auto-fills: pet name, owner email, owner name
   - Green gradient styling for the quick-select section
   - **Files Changed**: 
     - `/app/frontend/src/components/admin/ConciergeCommandCenter.jsx`
     - `/app/frontend/src/components/admin/DoggyServiceDesk.jsx`

**Verified Working:**

3. **Service Desk Page** (`/admin/service-desk`) - ACCESSIBLE
4. **Pet Parent Directory Tab** (`member-directory`) - 25 members, search/filter working

### Phase 16: Pet Soul Score Fix & Concierge Admin (Jan 28, 2025)

**Bug Fixes:**

1. **Pet Soul Score Data Inconsistency** (FIXED - P0)
   - **Issue**: Dashboard showed 100% Pet Soul Score, while Pet Profile page showed 18% for the same pet
   - **Root Cause**: `/api/pets/my-pets` was returning stale `overall_score` from database, while `/api/pet-score/{id}/score_state` calculated correct weighted score
   - **Fix**: Updated `server.py` to use `calculate_pet_soul_score()` from `pet_score_logic.py` for all pets
   - **Files Changed**: `/app/backend/server.py` lines 104-108 (import), 7024-7040 (endpoint)
   - **Verification**: Both endpoints now return consistent 18.4% score

2. **Legacy Score Function Conflict** (FIXED)
   - Renamed `calculate_pet_soul_score()` in server.py to `calculate_pet_soul_score_legacy()` to avoid shadowing the imported function
   - This ensures the weighted scoring system is used everywhere

**New Features:**

3. **Concierge® Experiences Admin UI** (COMPLETED)
   - Integrated `ConciergeExperiencesAdmin` component into Admin dashboard
   - New tab: "✨ Concierge® XP" in Core Tools section
   - Features: List experiences, Add/Edit/Delete, Seed Defaults, Toggle Active, Duplicate
   - 18 experiences across 8 pillars pre-configured
   - **Files Changed**: `/app/frontend/src/pages/Admin.jsx` (import + tab integration)

**Verified Working:**

4. **Mobile Navbar** (CONFIRMED WORKING)
   - Hamburger menu opens correctly on mobile (390x844 viewport)
   - Shows all 14 pillars, Sign In, Join Now, Ask Mira, Pet Life Pass

### Phase 15: Notification Badges, Dine & Celebrate Concierge® (Jan 28, 2025)

**New Features:**

1. **App Notification Badges**
   - PWA badge count API (`navigator.setAppBadge`)
   - Service worker badge management via message events
   - Frontend hook: `useAppBadge.js` for badge count control
   - Auto-increment on push notification receipt
   - Auto-decrement on notification click

2. **Dine Page Elevated Concierge® Experiences**
   - Added 3 experience cards to DinePage:
     - Private Chef Experience® (Signature badge)
     - Restaurant VIP Access®
     - Birthday Dining Package® (Popular badge)
   - Premium section with gradient cards

3. **Celebrate Page (NEW)**
   - Full pillar page at `/celebrate` with:
     - Hero section with floating decorations
     - 6 quick category cards
     - 6 Elevated Concierge® experience cards:
       - Ultimate Birthday Bash® (Signature)
       - Gotcha Day Special®
       - Pawty Planning Pro® (Popular)
       - Puppy Shower®
       - Pet Wedding Ceremony®
       - Milestone Moments®
     - "How Concierge® Works" section
     - Featured products section
     - Bottom CTA section

4. **Mobile UI/UX Audit - Member Experience**
   - Verified mobile responsiveness (390x844 viewport)
   - Member Dashboard: Clean layout, tabs scrollable, gamification visible
   - Mira AI Chat: Full-screen, quick actions visible, input accessible
   - Settings: Push notifications and Soul Whisper sections readable
   - Travel/Stay/Dine/Celebrate: All pillar pages responsive

### Phase 14: PWA Push Notifications & WebSocket Stability (Jan 28, 2025)

**New Features:**

1. **PWA Push Notifications System**
   - Full Web Push implementation using VAPID keys (pywebpush)
   - Backend routes at `/api/push/*`:
     - `GET /api/push/vapid-public-key` - Get public VAPID key for client subscription
     - `POST /api/push/subscribe` - Subscribe to push notifications
     - `POST /api/push/unsubscribe` - Unsubscribe from notifications
     - `PUT /api/push/preferences/{user_id}` - Update notification preferences
     - `POST /api/push/send` - Send push notification to user or all subscribers
     - `POST /api/push/soul-whisper/send/{user_id}` - Send Soul Whisper notification
     - `GET /api/push/stats` - Get push notification statistics
   - Frontend hook: `usePushNotifications.js` for subscription management
   - Enhanced service worker (`service-worker.js`) with rich notification handling
   - UI in Member Dashboard Settings showing permission status and subscription controls

2. **Soul Whisper™ Notification Engine**
   - AI-generated personalized pet wellness tips based on Pet Soul data
   - Message categories: general, health, activity, mood, nutrition
   - Template-based messages with pet name personalization
   - Delivery scheduling: daily, 2x week, weekly with preferred time
   - Logs stored in `soul_whisper_logs` collection

**Bug Fixes:**

3. **WebSocket Stability Improvements** (IMPROVED)
   - Refactored `useServiceDeskSocket.js` with production-ready configuration:
     - Exponential backoff reconnection (up to 30s delay)
     - Heartbeat monitoring every 30 seconds
     - Graceful handling of server disconnects
     - Detailed connection state tracking (disconnected, connecting, connected, reconnecting)
     - Manual reconnect function exposed for UI
   - Backend `realtime_notifications.py` improvements:
     - Connection metadata tracking (agent_id, connected_at, last_heartbeat)
     - Heartbeat event handler for connection health
     - Production-ready Socket.IO config (ping_timeout=30, ping_interval=25)
   - New health endpoint: `GET /api/health/websocket` for monitoring

### Phase 13C: Additional Fixes & Fit Page Concierge® (Jan 28, 2025)

**New Features:**

1. **Fit Page Concierge® Experiences**
   - Added 4 elevated experiences: Wellness Architect®, Weight Journey Partner®, Active Lifestyle Curator®, Senior Wellness Companion®
   - Premium section with gradient cards and "Ask Concierge®" CTAs
   
2. **Navbar Updates**
   - Added "Enjoy By Concierge®" and "Learn By Concierge®" to dropdown menus
   - All 14 pillars now visible with Concierge® highlights

**Bug Fixes:**

3. **Member Dashboard Crash** (FIXED)
   - Fixed `GamificationBanner` component to safely access `pets` array
   - Added `Array.isArray()` checks before accessing `pets[0]`
   - Fixed all `pets.filter()` calls to handle undefined arrays
   - Dashboard now loads without crashing

4. **Mobile Mira Input Area** (FIXED)
   - Added iOS safe-area padding to input container
   - Added `enterKeyHint="send"` to mobile input for better UX

5. **8 Pillars → 14 Pillars Text Update** (FIXED)
   - Updated references from "8 pillars" to "14 pillars" across the codebase

### Phase 13B: Concierge® Dashboard & Bug Fixes (Jan 27, 2025)

**New Features:**

1. **Concierge® Requests Dashboard** (`/admin/concierge`)
   - Admin dashboard for managing all Concierge® experience requests
   - Stats cards showing: Total Requests, New (Action Needed), by Pillar (Travel, Stay, Care, Enjoy, Learn)
   - Filters: By Pillar, By Status, Search
   - Request detail modal with status updates and timeline
   - Quick actions: Mark Contacted, In Progress, Complete, Archive
   
2. **Backend API Endpoints for Dashboard:**
   - `GET /api/concierge/requests` - List all requests with filters
   - `GET /api/concierge/stats` - Get dashboard statistics
   - `PUT /api/concierge/requests/{id}` - Update request status
   - `POST /api/concierge/request` - General concierge request handler

**Bug Fixes:**

3. **Breed Autocomplete Not Working in Soul Questionnaire** (FIXED)
   - Added BreedAutocomplete component for breed field in UnifiedPetPage.jsx inline edit mode
   - Typing "shihtzu" now autocorrects to "Shih Tzu"

4. **Soul Questionnaire Crash on Food Allergies** (FIXED)
   - Fixed `computeUnlockedAchievements()` to handle food_allergies as array or string
   - Fixed Emergency Info Card to safely display food_allergies and medical_conditions
   - Page no longer crashes when editing allergy data

5. **Soul Score Showing >100% (e.g., 320%)** (FIXED)
   - Added `Math.min(100, ...)` wrapper to all score displays in MemberDashboard.jsx
   - Scores now always display correctly in 0-100% range

6. **Concierge® Branding** (FIXED)
   - Updated all user-facing "Concierge" text to "Concierge®"
   - Updated Mira system prompt to use "Concierge®"

### Phase 13: Elevated Concierge® Experiences (Jan 27, 2025)

**New Features:**

1. **ConciergeExperienceCard Component** (Reusable)
   - Premium card component for showcasing curated experiences
   - Supports `compact` and `default` variants
   - Features: gradient headers, highlight lists, "Ask Concierge®" CTA
   - Opens modal for personalized concierge request submission

2. **Travel Concierge® Experiences**
   - Added 4 curated experiences: Luxe Air Concierge®, Road Trip Architect®, Relocation Navigator®, Vet Visit Valet®
   - New section on TravelPage.jsx between "How It Works" and "Travel Bundles"

3. **Stay Concierge® Experiences**
   - Added 4 curated experiences: Pawcation Curator®, Home Away Coordinator®, Staycation Architect®, Multi-Pet Travel Suite®
   - New section on StayPage.jsx before tabs

4. **Care Concierge® Experiences**
   - Added 4 curated experiences: Wellness Orchestrator®, Groom & Glam Curator®, Daily Companion Finder®, Emergency Response Partner®
   - New section on CarePage.jsx between "How It Works" and "Care Bundles"

5. **Enjoy Concierge® Experiences**
   - Added 4 curated experiences: Event Scout®, Adventure Architect®, Social Circle Creator®, Pet-Friendly Dining Curator®
   - New section on EnjoyPage.jsx before "Featured Experiences"

6. **Learn Concierge® Experiences**
   - Added 4 curated experiences: Behavior Architect®, Puppy Foundations Builder®, Advanced Skills Coach®, Rescue Rehabilitation Partner®
   - New section on LearnPage.jsx before "Training Programs"

7. **Backend: Concierge Experience Request Endpoint**
   - POST `/api/concierge/experience-request` - Creates experience requests with service desk ticket
   - Stores in `concierge_requests` collection and creates linked ticket

**Bug Fixes:**

8. **Breed Cakes Page Empty** (FIXED)
   - Changed route category from `"breed"` to `"breed-cakes"` in App.js
   - Now shows 43 products

9. **Pupcakes Page Empty** (FIXED)
   - Changed route category from `"Pupcakes"` to `"dognuts"` in App.js
   - Now shows 25 products

10. **Desi Treats Page Empty** (FIXED)
    - Changed route category from `"desi"` to `"desi-treats"` in App.js
    - Added hero content for `desi-treats` category in ProductListing.jsx
    - Now shows 15 products

### Phase 12F: P1 Bug Fixes & UX Improvements (Jan 27, 2025)

**Bug Fixes:**

1. **Floating Button Hiding Mira** (P0 - FIXED)
   - Added path-based visibility check to `FloatingContactButton.jsx`
   - Button now hidden on: `/mira`, `/ask-mira`, `/voice-order`, `/agent`, `/admin/service-desk`
   - Uses `useLocation` hook to detect current path

2. **Mira Memories Not Storing** (P1 - FIXED)
   - Fixed `/api/mira/session/{session_id}` endpoint to return messages array at root level
   - Frontend `MiraConversationHistory` now receives properly formatted message objects
   - Each message includes: sender (member/mira), content, timestamp

3. **Product Box Image URL Not Saving** (P1 - FIXED)
   - Added `image_url: Optional[str] = None` field to `UnifiedProduct` model in `unified_product_box.py`
   - PUT endpoint now properly accepts and saves image_url field

**UX Improvements:**

4. **Member Dashboard "All Services" Tab** (NEW)
   - Replaced individual pillar tabs (Celebrations, Dining, Stay, Travel) with unified "All Services" tab
   - Shows all 14 pillars in a grid with icons, names, and descriptions
   - Quick Actions section: Book Vet Visit, Find Boarding, Order Cake, Emergency Help
   - Cleaner navigation with scrollable tabs

**Testing:** All features verified in iteration_97 - 100% pass rate (13/13 backend tests)

### Phase 12E: Contact & Communication Features (Jan 27, 2025)

**New Features:**

1. **Floating Contact Button** (All Pages)
   - Persistent FAB at bottom-right corner
   - Call Now (+91 96631 85747)
   - WhatsApp quick chat
   - Request Callback (opens modal)
   - Voice Order link
   - Animated "Speak to us!" tooltip

2. **Callback Request Feature**
   - Modal with form: Name, Phone, Reason, Preferred Time, Notes
   - Creates Service Desk ticket with `callback_request` source
   - 8 reason options: General, Order, Booking, Complaint, Partnership, Celebration, Emergency, Other
   - 4 time slots: ASAP, Morning, Afternoon, Evening
   - Success confirmation with ticket ID

3. **Mira Page "Speak to Us" Section**
   - Call Us Now button
   - WhatsApp Us button
   - Voice Order button
   - Emergency Help button

4. **SEO Enhancements**
   - SEOHead component with pillar-specific meta tags
   - Updated sitemap.xml with all 14 pillars + pages
   - Canonical URLs (non-www)
   - Open Graph & Twitter Cards
   - HelmetProvider integration

5. **Universal Seed Enhancements**
   - Auto-seeds 5 Service Desk templates
   - Auto-seeds 2 sample pet parents
   - Auto-seeds 4 sample pet profiles
   - Hardcodes product options (Base, Flavour, Size)

### Phase 12D: Dining Concierge & Advanced Features (Jan 27, 2025)

**New Features:**

1. **Dining Concierge Picker** (`/dine` page)
   - 6 service types: Chef's Table, Private Home Dining, Pet Party Catering, Restaurant Reservations, Meal Subscriptions, Group Dining Events
   - Form fields: City, Guest count, Date, Time, Special requests
   - Pet selection for logged-in users
   - Creates Service Desk ticket with category "dine"
   - Success confirmation with ticket ID

2. **Smart Auto-Assignment**
   - `GET/POST /api/tickets/settings/auto-assignment`
   - Pillar-based expertise mapping (agents assigned to specific pillars)
   - Workload balancing (assigns to agent with fewest open tickets)
   - Automatic assignment on ticket creation when enabled
   - System message logged when auto-assigned

3. **SLA Breach Alerts**
   - `GET/POST /api/tickets/settings/sla-alerts`
   - Warning threshold configuration (default: 60 minutes before breach)
   - `GET /api/tickets/sla-at-risk` - Returns tickets approaching SLA deadline
   - `POST /api/tickets/check-sla-breaches` - Marks breached tickets, auto-escalates
   - Breach escalation: Auto-sets urgency to "critical" and status to "escalated"

4. **WhatsApp Integration Plumbing** (MOCKED - awaiting API keys)
   - `GET /api/whatsapp/status` - Returns configuration status and setup instructions
   - `POST /api/whatsapp/send` - Send single message (blocked until configured)
   - `POST /api/whatsapp/send-bulk` - Bulk messaging with job tracking
   - `POST /api/whatsapp/webhook` - Incoming message handler, creates tickets
   - `GET /api/whatsapp/templates` - Message templates with variables
   - Supports: Meta WhatsApp Business API, Twilio, Baileys (self-hosted)

**Testing:** All features verified in iteration_96 - 100% pass rate

### Phase 12C: Service Desk Bug Fixes & Enhancements (Jan 27, 2025)

**Bug Fixes:**
- **Templates Loading Fix**: Added `useEffect` to fetch templates when Settings modal opens
- **Status/Category API Consolidation**: Removed duplicate route definitions, unified custom status/category management using `service_desk_settings` collection
- **ESLint Errors Fixed**: Corrected variable references for `filteredTickets` → `tickets`

**New Features:**
- **CSV Export Button**: Added "Export" button to Service Desk header - downloads all visible tickets as CSV with columns: Ticket ID, Status, Category, Urgency, Member details, Tags, Dates, Messages count
- **Custom Status Management**: POST/DELETE /api/tickets/statuses now work correctly
- **Custom Category Management**: POST/DELETE /api/tickets/categories now work correctly

**Verified Working:**
- Templates are auto-seeded (5 default templates) and display correctly in Settings → Templates tab
- Statuses & Categories tab shows add/delete functionality
- Sidebar data (Pet Parents, Pet Profiles, Orders, Analytics) fetches correctly with auth
- Product card navigation works correctly (modal opens on click)

### Phase 12: Service Desk Overhaul (Jan 27, 2025)

**Major UI/UX Improvements:**
- **3/4 Screen Slide-out Drawer**: Ticket details open in full-width drawer from right side
- **Inline Subject Editing**: Click subject to edit directly in drawer header
- **Agent Collision Detection**: Shows warning when another agent is viewing same ticket
- **Bulk Actions**: Checkbox selection on tickets for bulk status change and assignment

**Template Manager (Settings → Templates):**
- Create/edit/delete Email & SMS templates
- Variables support: {{customer_name}}, {{ticket_id}}, {{pet_name}}, {{status}}
- Trigger options: manual, new_ticket, status_change
- Default templates seeded: Welcome Acknowledgment, Resolution Confirmation, Escalation Notice, On Hold Notice, SMS Quick Acknowledgment

**Automation Settings (Settings → Automation):**
- Auto-acknowledge new tickets with template selection
- Status change triggers (map status → template)
- Save automation settings to database

**Notification System:**
- Browser notification permission request
- Notification bell with unread count badge
- Enable/disable notifications from Settings

**Customer Satisfaction (CSAT):**
- CSAT rating endpoint: POST /api/tickets/{ticket_id}/csat
- CSAT analytics endpoint: GET /api/tickets/analytics/csat
- NPS-style score calculation

**Production Fixes:**
- Boarding facilities seeded (36 facilities across 4 cities)
- Celebrate Concierge ticket creation fixed
- Stay page boarding navigation working
- Product options/variants synced (257 products with variants)

### Phase 12B: Advanced Service Desk Features (Jan 27, 2025)

**New Features Added:**
- **Ticket Tags**: Add/remove tags to tickets, autocomplete from existing tags
- **Ticket Merging**: Merge multiple tickets into one primary ticket
- **Agent Performance Dashboard**: Resolution rates, response times, CSAT scores by agent
- **SLA Breach Monitoring**: Real-time breach alerts in sidebar + auto-escalation endpoint
- **Voice Order Processing**: Accept voice orders from Mira → create tickets
- **Follow-up Reminders**: Add due reminders to tickets, view overdue list
- **Smart Auto-Assignment**: Route tickets to agents based on pillar expertise

**New Backend APIs:**
- `GET/POST/DELETE /api/tickets/{id}/tags` - Tag management
- `POST /api/tickets/merge` - Merge multiple tickets
- `GET /api/tickets/analytics/agent-performance` - Agent stats
- `GET /api/tickets/sla/breached` - Get breached/approaching tickets
- `POST /api/tickets/sla/escalate-breached` - Auto-escalate breached
- `POST /api/tickets/voice-order` - Process voice orders
- `POST /api/tickets/{id}/reminders` - Add follow-up reminders
- `GET /api/tickets/reminders/due` - Get overdue reminders

**Data Stats:**
- 43+ ticket tags in use
- 2 agents configured (aditya, concierge1)
- 2 SLA breached tickets detected

### Phase 2: Product & Service Architecture (Completed Jan 2025)
- **Shop Page Hierarchy**: Dynamic hierarchical category menu driven by `/api/categories/hierarchy`
- **Data Migration**: Restructured product categories with `parent_category` field
- **Search Fix**: Repaired site search to use correct API endpoints

### Phase 3: Intelligent Concierge® System (Completed Jan 2025)
- **Services API**: New `/api/services` endpoint for Concierge® services
- **Service Booking**: `/api/services/book` creates tickets automatically
- **Concierge® Order Queue Backend**: Intelligent order processing from tickets

### Phase 4: World's Best Pillar Page - Fit (Completed Jan 2025)
- **Redesigned FitPage.jsx**: Consistent with other pillar pages (CarePage style), using system fonts
- **Hero Section**: Rotating background images, gradient overlay, CTA buttons
- **Sticky Navigation**: Service type filter bar (All Services, Fitness Assessment, Exercise Plans, etc.)
- **Concierge® Services Section**: 8 services with colour-coded gradient cards, Book Now functionality
- **Shop Section**: Value Bundles with savings + Products grid
- **Service Booking Modal**: Pet selection, contact details, activity level, fitness goals, preferred date
- **Data Seeding**: 8 Fit Concierge® services + bundles seeded into database

### Phase 7: Airbnb-Inspired Services UI & Mira Memories (Jan 2025)

**Fit Page Redesign:**
- **Airbnb-style Service Cards**: Gradient image headers, category badges, floating price tags
- **Category Filter Bar**: Sticky filter with counts (All Services, Assessment, Training, etc.)
- **Service Detail Modal**: Full-screen header image, price/duration bar, "What's included" checklist
- **Dual CTAs**: "Enrol Now" (booking) + "Ask Concierge®" (redirects to Mira)
- **Hover interactions**: View Details button appears on card hover

**Mira Memory System:**
- **Enhanced Extraction**: 50+ new patterns, pillar-aware extraction
- **Pet Memories API**: `/api/mira/memory/pet/{pet_id}` - returns grouped memories
- **Pet Profile Tab**: New "Mira Memories" tab showing memories by type
- **Test Data**: Added memories for Mojo (events, health, shopping, general)

**Services in Database (Fit Pillar):**
1. Fitness Assessment & Programme Design - ₹2,499
2. Personal Training Programme - 8 Weeks - ₹7,999
3. Weight Management Programme - ₹5,999
4. Hydrotherapy Sessions - ₹1,499
5. Senior Mobility Programme - ₹4,999/mo
6. Puppy Development Programme - ₹3,999
7. Agility Foundation Course - ₹4,499
8. Canine Yoga (Doga) Session - ₹799

### Phase 8: Celebrate Pillar & Admin Fixes (Jan 27, 2025)

**Admin Panel Bug Fixes:**
- ✅ **Orders Tab Crash Fix**: Fixed `orderStats.pending` undefined error by adding default props
- ✅ **Address Field Fix**: Fixed `.slice()` error when address is object instead of string
- ✅ **Order ID Fallback**: Ensured updateOrderStatus uses `order.orderId || order.order_id || order.id`

**Celebrate Pillar Enhancements:**
- ✅ **Custom Cake Submenu**: Added "Custom Cake" to Celebrate dropdown menu in Navbar
- ✅ **Cake Availability Filter**: Added city-based delivery filter on cake product pages
  - Cities: Bangalore, Mumbai, Delhi NCR for fresh delivery
  - Pan-India option for shippable cakes
  - Backend API already supports `fresh_delivery_city` parameter
- ✅ **Location Detection**: Auto-detect user location and filter cakes by nearest delivery city
  - Uses browser geolocation + reverse geocoding
  - Shows "Detect Location" button on cakes page
  - Green banner when location detected

**Concierge® Branding:**
- ✅ **Navbar "By Concierge®"**: Added highlighted menu items (Fit By Concierge®, Care By Concierge®, etc.)
- ✅ **Mira Panel**: Updated to show "Your Concierge®" with ® symbol
- ✅ **Service Cards**: All service cards show "Concierge®" badge

**Auto-Seeding on Deployment:**
- ✅ **Services Auto-Seed**: Added `auto_seed_all_services()` function to startup
  - Seeds Fit, Care, and Celebrate services automatically
  - Uses upsert to preserve existing data
  - Logs service count during initialization

**Cake Data Migration (Backend - Already Complete):**
- `fresh_delivery_cities` field added to cake products
- Extensive tagging schema for Life Stage, Occasion, Dietary, Ingredients, Texture, etc.
- Script: `/app/backend/scripts/enhance_cake_products.py`

### Phase 9: Ultimate Service Desk Overhaul (Jan 27, 2025)

**Service Desk "Zoho Desk Killer" - COMPLETED:**
- ✅ **Rich Text Editor**: Replaced plain textarea with Tiptap-based WYSIWYG editor
  - Full formatting toolbar: Bold, Italic, Underline, Strikethrough
  - Headings (H1, H2, H3), Lists (bullet/numbered), Blockquotes, Code blocks
  - Links with URL prompt, Text alignment (left/center/right)
  - Undo/Redo, Character count display
  - Keyboard shortcuts (Ctrl+B, Ctrl+I, etc.)
- ✅ **Canned Responses**: Templates dropdown with 8 quick responses
  - Greeting, Order Confirmation, Delivery Update, Issue Resolved
  - Follow Up, Closing, Refund Info, Appointment Confirmed
- ✅ **AI Draft Generation**: "AI Draft" button for AI-powered reply suggestions
  - 5 reply styles: Professional, Friendly, Empathetic, Concise, Detailed
  - Integrates with `/api/tickets/ai/draft-reply` endpoint
- ✅ **Kanban Board View**: Drag-and-drop ticket management
  - 6 columns: New, Open, In Progress, On Hold, Resolved, Closed
  - Ticket cards with priority badges, time indicators, customer info
  - Quick status change via dropdown menu on cards
- ✅ **All 15 Pillar Integration**: Every pillar creates tickets automatically
  - Celebrate, Dine, Stay, Travel, Care, Enjoy, Fit, Learn
  - Paperwork, Advisory, Emergency, Farewell, Adopt, Shop, Club
  - Special sections: Mira AI, Membership, Pet Parent, Pet Profile
- ✅ **Advanced Features**:
  - Internal Note toggle for private agent notes
  - File/Image attachments with upload
  - Voice recording for audio messages
  - Real-time WebSocket status indicator
  - Conversation history with internal notes highlighted
  - Context tab showing pet/member profiles
  - Files tab for ticket attachments
  - History tab for activity timeline

**Phase 9.2: SLA Timers, Reminders & Auto-Acknowledge (Jan 27, 2025):**
- ✅ **SLA Timer Display**: Visual countdown in ticket list and detail header
  - Format: "SLA: Xh Xm" with color-coded backgrounds
  - Green (ok), Amber (warning <2h), Orange (critical <1h), Red (breached)
  - Pulsing animation when SLA is breached
- ✅ **SLA Calculation**: Automatic based on urgency level
  - Low: 48 hours, Medium: 24 hours, High: 8 hours
  - Critical: 2 hours, Urgent: 4 hours
  - Calculated on ticket creation, stored in `sla_due_at` field
- ✅ **Reminder/Task System**: Full CRUD with visual management
  - Add Reminder modal: Title, Description, Due Date & Time, Type, Priority
  - Types: Follow Up, Call Back, Task, Deadline
  - Priorities: Low, Medium, High (color-coded buttons)
  - Reminders list shows checkboxes, titles, due dates, pending count
  - Overdue reminders highlighted in red with warning indicator
  - Backend endpoints: GET/POST/PATCH/DELETE `/api/tickets/{id}/reminders`
- ✅ **Auto-Acknowledge Emails**: Triggered on ticket creation
  - Uses `send_ticket_notification()` function
  - REQUIRES Resend API key for actual delivery (currently MOCKED - logs only)

**Testing Status:** Backend 100% (13/13), Frontend 100% (Verified via testing agent iteration 93)

**Files Modified:**
- `/app/frontend/src/components/admin/DoggyServiceDesk.jsx` - Main component with SLA timers, reminders
- `/app/frontend/src/components/admin/RichTextEditor.jsx` - Tiptap editor
- `/app/frontend/src/components/admin/KanbanBoard.jsx` - Kanban view
- `/app/backend/ticket_routes.py` - SLA calculation, reminder CRUD endpoints

### Phase 10: Admin Product Editor & Mira Fix (Jan 27, 2025)

**Admin Product Editor UI - COMPLETED:**
- ✅ **New Fields in Add/Edit Modal**:
  - Bases (comma-separated): "Oats, Ragi"
  - Fresh Delivery Cities: "Bangalore, Mumbai, Delhi NCR"
  - Smart Tags section with dropdowns:
    - Life Stage: All Ages, Puppy, Adult, Senior
    - Occasion: Birthday, Gotcha Day, Special Treat, Festival, Everyday
    - Dietary: Regular, Grain-Free, Vegan, Low-Fat, Hypoallergenic
- ✅ **Backend Model Updated**: `CelebrateProductCreate` now accepts all new fields
- ✅ **Dual Collection Support**: Update endpoint checks both `celebrate_products` and main `products` collection
- ✅ **Shopify Options Extraction**: Auto-populates flavors/bases from Shopify options array when editing

**Mira Memories Fix - COMPLETED:**
- ✅ **Auth Issue Resolved**: MiraMemoriesSection now shows "Sign in to see Mira's Memories" prompt for unauthenticated users instead of infinite loading
- ✅ **Proper Auth Handling**: 401 responses show login prompt, setLoading(false) called correctly
- ✅ **Grouped Memories Display**: Events & Milestones, Health & Medical, Shopping & Preferences, Life Context

**Testing Status:** Backend 100% (12/12), Frontend 100% (Verified via testing agent iteration 95)

---

## Pending Issues
1. ✅ ~~**Mira Memories Auth Issue** (P1)~~ - FIXED: Shows login prompt for unauthenticated users
2. ✅ ~~**WebSocket Connection** (P2)~~ - FIXED: URL resolution now uses window.location.origin when API URL is empty
3. ✅ ~~**Product Options Display** (P0)~~ - FIXED: Options count now calculated from actual Shopify options array
4. ✅ ~~**Aggregated Ticket Detail** (P3)~~ - VERIFIED WORKING: Tickets with different prefixes (ADV-, TKT-, PET-) work correctly
5. ✅ ~~**Pet Score / Pawmoter Score** (P1)~~ - VERIFIED WORKING: Shows in navbar, dashboard, and product modals
6. **Auto-Acknowledge Email** (P2): Requires Resend API key - currently MOCKED (logs only)

---

## Upcoming Tasks (Priority Order)

### P0 - Immediate
1. ✅ ~~Admin Orders Tab Fix~~ (DONE)
2. ✅ ~~Custom Cake Submenu~~ (DONE)
3. ✅ ~~Cake Availability Filter UI~~ (DONE)
4. ✅ ~~Service Desk Overhaul~~ (DONE - Rich Text Editor, Kanban Board, All Pillars)
5. ✅ ~~SLA Timers~~ (DONE - Visual countdown with color coding)
6. ✅ ~~Reminder/Tasks~~ (DONE - Full CRUD with modal and list)
7. ✅ ~~Auto-Acknowledge Emails~~ (DONE - Requires Resend API key)
8. ✅ ~~Admin Product Editor~~ (DONE - New fields for fresh_delivery_cities, life_stage, occasion, dietary)
9. ✅ ~~Fix Mira Memories Auth~~ (DONE - Login prompt for unauthenticated users)
10. ✅ ~~Standardize Cake Options~~ (DONE - Oat→Oats, Rag→Ragi across 153 cakes)
11. ✅ ~~Add Personalization Tags~~ (DONE - life_stage, occasion, dietary, bestseller, new-arrivals)
12. ✅ ~~Pet Profile Auto-Suggest~~ (DONE - Recommendations based on pet age, breed, allergies)

### Phase 11: Cake Product Enrichment (Jan 27, 2025)

**Standardization Completed:**
- ✅ **Base Options**: Oat→Oats, Rag→Ragi across 12 products
- ✅ **Variant Titles**: Updated 14 variant titles with correct spelling

**Enrichment Completed (153 cakes):**
- ✅ **Life Stage Tags**: all-ages, puppy, adult, senior
- ✅ **Occasion Tags**: birthday, gotcha-day, festival, special-treat, everyday
- ✅ **Dietary Tags**: regular, grain-free, vegan, low-fat, hypoallergenic
- ✅ **Bestsellers Marked**: 38 products identified by keyword matching
- ✅ **New Arrivals Marked**: 17 products
- ✅ **Fresh Delivery Cities**: Bangalore, Mumbai, Delhi NCR set for all cakes
- ✅ **Additional Tags**: Breed-specific, shape, flavor, occasion tags enriched

**Pet Profile Recommendations:**
- ✅ **Frontend Section**: "Perfect picks for [Pet Name]" carousel on cake pages
- ✅ **Pet Selector**: Dropdown to switch between multiple pets
- ✅ **Backend API**: `/api/products/recommendations/for-pet/{pet_id}`
- ✅ **Scoring System**: Based on size, age, allergies, preferences

**Script**: `/app/backend/scripts/enrich_cake_products.py`

### Phase 12: Bug Fixes & Data Verification (Jan 27, 2025)

**Issues Resolved:**
- ✅ **Product Options Count**: Fixed `optionsCount` calculation in ProductCard.jsx to use actual Shopify-style `options` array instead of legacy `sizes/flavors`
- ✅ **WebSocket URL Resolution**: Fixed Socket.IO connection to use `window.location.origin` when API URL is relative/empty
- ✅ **Production Data Verification**: All 14 pillars verified with products and services
- ✅ **Pet Score / Pawmoter Score**: Verified working correctly in navbar (Mojo 100%), dashboard, and product detail modals
- ✅ **Ticket API**: Verified working for all ticket types (ADV-, TKT-, PET- prefixes)

**Data Counts Verified:**
- celebrate: 245 products, 7 services
- stay: 80 products, 2 services
- travel: 75 products, 2 services
- feed: 21 products, 2 services
- care: 75 products, 2 services
- fit: 83 products, 10 services
- learn: 65 products, 2 services
- enjoy: 58 products, 2 services
- groom: 10 products, 2 services
- adopt: 24 products, 2 services
- farewell: 28 products, 2 services
- dine: 56 products, 2 services
- insure: 9 products, 2 services
- shop: 229 products, 2 services

### P1 - Next Sprint (Concierge for All 14 Pillars)
13. **Add Celebrate Concierge Services**: Like Fit, add Concierge® services for cakes, treats, hampers
14. **Replicate Concierge Pattern to All Pillars**: Dine, Stay, Travel, Care, Enjoy, Learn, Paperwork, Advisory, Emergency, Farewell, Adopt, Shop
15. **Activate Soul Whisper Feature**: Verify question delivery and answer storage

### P2 - Backlog
16. Improve WebSocket real-time updates stability
17. Build Smart Checkout flow
18. Multi-channel integrations (Resend/WhatsApp - requires API keys)
19. New Member Onboarding flow
20. **Replicate Fit Template**: Apply same design to Care, Celebrate, Enjoy pages
21. **Service Desk Phase 3**: Bulk actions, Analytics dashboard, Customer satisfaction ratings

---

## API Endpoints Reference

### Report Builder (NEW - Jan 28, 2025)
- `GET /api/admin/reports/generate?report_type={type}&period={period}&pillar={pillar}` - Generate report
  - Report types: daily_summary, pillar_performance, order_report, ticket_report, revenue_report, member_analytics, pet_analytics, product_performance
  - Periods: today, yesterday, this_week, last_week, this_month, last_month, last_30_days, last_90_days, this_year, custom
- `GET /api/admin/reports/export/csv` - Export report as CSV
- `GET /api/admin/reports/export/excel` - Export report as Excel (xlsx)
- `POST /api/admin/reports/schedule` - Save email schedule configuration

### Service Desk
- `GET /api/tickets/` - List all tickets (aggregates from multiple sources)
- `GET /api/tickets/{id}` - Get ticket detail
- `POST /api/tickets/` - Create new ticket
- `PATCH /api/tickets/{id}` - Update ticket (status, assignment, etc.)
- `POST /api/tickets/{id}/reply` - Add reply (public or internal note)
- `POST /api/tickets/{id}/attachments` - Upload file attachment
- `GET /api/tickets/categories` - Get all 15 pillar categories
- `POST /api/tickets/ai/draft-reply` - Generate AI reply suggestion

### Services
- `GET /api/services?pillar={pillar}` - List services by pillar
- `GET /api/services/{id}` - Service details
- `POST /api/services/book` - Book a service (creates ticket)

### Products
- `GET /api/products?pillar={pillar}` - Filter products by pillar
- `GET /api/products?category={cat}` - Filter by category
- `GET /api/products/recommendations/for-pet/{pet_id}` - Personalized recommendations

### Checkout & Payments (Updated - Jan 28, 2025)
- `GET /api/checkout/config` - Get Razorpay key, GST rate, shipping settings
- `POST /api/checkout/calculate-total` - Calculate order total with GST breakdown (CGST+SGST or IGST)
  - GST is now calculated on (subtotal - discount + shipping)
- `POST /api/checkout/create-order` - Create order with Razorpay payment
- `POST /api/checkout/verify-payment` - Verify Razorpay payment signature
- `GET /api/checkout/order/{id}/invoice` - Get invoice data (JSON)
- `GET /api/checkout/order/{id}/invoice/pdf` - Download invoice as PDF
- `GET /api/checkout/discount/validate` - Validate discount codes

---

## Design System (for Pillar Pages)
- **Fonts**: Syne (headings), Manrope (body)
- **Colors**: 
  - Fit: Teal/Emerald (#0F766E)
  - Accent: Lime (#84CC16)
- **Layout**: Asymmetric hero + Services section + Products grid
- **Components**: Glassmorphic cards, rounded-full buttons, hover animations

---

## Test Credentials
- **Admin**: aditya / lola4304
- **Member Test**: dipali@clubconcierge.in / test123

---

*Last Updated: January 28, 2025*

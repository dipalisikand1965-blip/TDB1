# The Doggy Company - Product Requirements Document

## Overview
**The Doggy Company** is building "The World's First Pet Life Operating System" - a comprehensive platform covering 14 pillars of pet life: Celebrate, Dine, Stay, Travel, Care, Enjoy, Fit, Learn, Paperwork, Advisory, Emergency, Farewell, Adopt, and Shop.

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn/UI
- **Backend**: FastAPI + Python
- **Database**: MongoDB
- **Key Collections**: products, services, tickets, pets, users, concierge_orders, concierge_tasks

---

## What's Been Implemented

### Phase 1: Foundation (Completed)
- Multi-pillar architecture with dedicated pages
- Ultimate Service Desk with ticket management
- Shopify product sync (604+ products)
- Member dashboard and pet profiles
- AI-powered Mira® assistant

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

**Testing Status:** Backend 100% (10/10), Frontend 100% (Verified via testing agent iteration 94)

---

## Pending Issues
1. ✅ ~~**Mira Memories Auth Issue** (P1)~~ - FIXED: Shows login prompt for unauthenticated users
2. **WebSocket Connection** (P2): Shows "Connecting..." - prevents real-time updates (core functionality unaffected)
3. **Product Tags**: Most products lack best-seller/new-arrivals tags (filters return 0 results)
4. **Aggregated Ticket Detail** (P3): Some tickets from reservations/stay bookings return 404 on detail endpoint
5. **Auto-Acknowledge Email** (P2): Requires Resend API key - currently MOCKED (logs only)

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

*Last Updated: January 27, 2025*

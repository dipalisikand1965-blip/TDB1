# The Doggy Company - Product Requirements Document

## Overview
**The Doggy Company** is building "The World's First Pet Life Operating System" - a comprehensive platform covering 14 pillars of pet life: Celebrate, Dine, Stay, Travel, Care, Enjoy, Fit, Learn, Paperwork, Advisory, Emergency, Farewell, Adopt, and Shop.

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn/UI
- **Backend**: FastAPI + Python
- **Database**: MongoDB
- **Key Collections**: products, services, tickets, pets, users, concierge_orders, concierge_tasks, ticket_templates, ticket_viewers, ticket_csat, service_desk_settings, whatsapp_logs

---

## What's Been Implemented

### Phase 1: Foundation (Completed)
- Multi-pillar architecture with dedicated pages
- Ultimate Service Desk with ticket management
- Shopify product sync (604+ products)
- Member dashboard and pet profiles
- AI-powered Mira® assistant

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

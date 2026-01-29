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

### Phase 39: Dine Form UX Improvements (Jan 29, 2025)

**Dine Page Reservation Form Updates (`/app/frontend/src/pages/DinePage.jsx`):**
- Changed "Phone" field label to "WhatsApp" with green icon indicator
- Added placeholder text: "+91 98765 43210"
- Updated success message to mention WhatsApp confirmation
- Added auto-population of Special Requests field with pet names when pets are selected
- Dynamic placeholder showing selected pet names in the special requests textarea

### Phase 40: Pulse Quick Commands Restored (Jan 29, 2025)

**Pulse Voice Assistant Updates (`/app/frontend/src/components/Pulse.jsx`):**
- Restored quick command buttons at the bottom of Pulse modal
- Commands are personalized with pet name (e.g., "Treats for Mynx", "Groom Mynx")
- 6 quick actions: Treats, Grooming, Vet, Food, Birthday, Boarding
- Click auto-fills input and sends command automatically
- Commands navigate to appropriate pages with context
- Enhanced response messages to be more engaging and personalized
- Quick commands only show on initial state (hide after conversation starts)

### Phase 41: Celebrate Pillar - Mobile-First World-Class Redesign (Jan 29, 2025)

**Complete redesign of `/app/frontend/src/pages/CelebratePage.jsx` following pillar layout rules:**

**Hero Section:**
- Immersive full-height hero with beautiful dog celebration image
- Gradient overlay for text contrast
- "Celebrate Pillar" tag, bold headline, short subhead
- Thumb-friendly stacked CTAs on mobile, side-by-side on desktop
- Floating celebration emojis with animations

**Category Quick Access:**
- Horizontal scroll on mobile (6 categories)
- 6-column grid on desktop
- Emoji icons with labels: Birthday Cakes, Breed Cakes, Pupcakes, Treats, Gift Hampers, Party Items

**Concierge Section (following rules):**
- Single-column layout (NOT tiles/grids)
- Centered with max-width constraint on desktop
- 3 service experiences: Ultimate Birthday Bash, Gotcha Day Special, Pawty Planning Pro
- Each card: icon, title, tagline, description
- Single clear CTA: "Chat with Celebrate Concierge"
- "Free consultation • Response within minutes" reassurance

**Product Section (following rules):**
- 2 tiles per row on mobile
- 4 tiles per row on desktop
- Square images (1:1 aspect ratio)
- Card anatomy: Image, Name (max 2 lines), Price, Key tag (Eggless/Veg/Bestseller)
- Quick Add button on hover (desktop)
- Sale badge for discounted items

**How It Works Section:**
- 2x2 grid on mobile, 4-column on desktop
- Simple 4 steps: Share → Plan → Execute → Celebrate

**Bottom CTA:**
- Gradient background
- "Ready to Celebrate?" headline
- Two CTAs: Start Planning, Shop Products

### Phase 38: Mobile-First UI Masterpiece (Jan 29, 2025)

**Design System Updates:**
- Created comprehensive design guidelines in `/app/design_guidelines.json`
- Theme: "Pet Life OS" - Premium, warm, intelligent aesthetic
- Colors: Deep Teal (#0F766E), Warm Amber (#D97706), Organic Stone backgrounds
- Typography: Manrope (headings), Inter (body), Syne (special/soul journey)

**CSS Updates (`/app/frontend/src/index.css`):**
- 300+ lines of premium mobile-first styles
- Mobile bottom navigation bar styles (glass morphism)
- Pulse FAB button with glow animation
- Bento grid layout system
- Premium card styles (glass, gradient)
- Soul Journey mystical styling
- Micro-animations: fadeInUp, pulse-glow, float, hover-lift
- Mobile-safe bottom padding

**New Components:**
- `MobileNavBar.jsx` - Premium floating bottom navigation
  - Glass morphism backdrop blur
  - Center Pulse FAB button
  - Home, Services, Pulse, Orders, Profile

**Bug Fixes:**
- Pet Soul Journey page crash (TypeError: ACHIEVEMENTS.find)
- Pulse voice assistant command processing and personalization
- Quick Score Boost localStorage key mismatch
- Service Desk consolidation (removed redundant ConciergeCommandCenter)

---

## Current Status

### Phase 42: Pillar-Specific Mira with Voice (Pulse) Integration (Jan 29, 2025)

**MiraContextPanel Voice Enhancement (`/app/frontend/src/components/MiraContextPanel.jsx`):**
- Integrated full voice capabilities (formerly "Pulse") into the pillar-specific Mira panel
- **Voice Input**: Web Speech API recognition with inline mic button
- **Voice Output**: Text-to-speech for Mira responses using SpeechSynthesis API
- **Pulse Button**: Cyan button in header triggers voice mode
- **Voice Toggle**: ON/OFF button to control TTS responses
- **Time-Aware Greetings**: Dynamic greetings based on time of day
- **Pillar-Specific Styling**: 
  - Advisory: Purple gradient (`from-purple-500 to-violet-600`)
  - Care: Rose/Pink gradient (`from-rose-500 to-pink-600`)
  - Emergency: Red gradient (`from-red-500 to-rose-600`)
- **Mobile z-index fix**: Panel now positioned at `z-[10000]` and `bottom-20` to avoid overlap with floating contact button
- **Chat features preserved**: Ask Mira, Plan My {Pillar}, quick prompts all working with voice

### Phase 43: Mira as the Soul - Conversation → Ticket Flow (Jan 29, 2025)

**The Complete Flow:**
```
User (Voice/Text) → Mira detects intent → Auto-creates ticket → Service Desk → Concierge responds
```

**Backend Enhancements (`/app/backend/mira_routes.py`):**
- **Ticket Confirmation in Response**: When a concierge action is detected, Mira now includes ticket ID in response
- **New `/api/mira/my-requests` Endpoint**: Allows users to check status of their requests
- **Status Query Detection**: Mira recognizes "What's the status of my request?" and fetches relevant tickets
- **Service Desk Integration**: Every actionable conversation creates both:
  - `mira_ticket` (conversation record)
  - `service_desk_ticket` (human concierge action item)

**Frontend Enhancements:**
- **Ticket Toast Notification**: Shows "Request #XXX created!" when concierge action is triggered
- **In-Chat Ticket Confirmation**: Displays "📋 Request #XXX created. Our live concierge will get back to you shortly!"
- Both `MiraContextPanel.jsx` and `MiraAI.jsx` updated with ticket display logic

**Ticket Status Tracking:**
- Status states with visual indicators:
  - ⏳ Pending (yellow)
  - 📥 Received (blue)
  - 🔄 Being Reviewed (yellow)
  - ⚙️ Working on it (orange)
  - ✅ Confirmed (green)
  - 🎉 Completed (green)
  - 🚨 Urgent Response (red - Emergency)

### Phase 44: Member Dashboard - My Requests Section (Jan 29, 2025)

**Frontend (`/app/frontend/src/pages/MemberDashboard.jsx`):**
- **New "My Requests" Tab**: Full tab with ticket listing, status badges, and refresh button
- **Quick Access Card**: Overview tab shows top 2 active requests for at-a-glance view
- **Status Display**: Color-coded badges (green/yellow/blue/red/orange) with icons
- **Request Details**: Shows ticket ID, pillar, description, pet name, timestamp
- **Empty State**: Encourages users to chat with Mira to create requests

### Phase 45: Proactive Notifications Engine (Jan 29, 2025)

**Backend (`/app/backend/proactive_notifications.py`):**
- **Vaccination Reminders**: Checks pets with vaccinations due within 7 days
- **Birthday Reminders**: Detects upcoming pet birthdays
- **Ticket Updates**: Notifies on status changes (acknowledged, confirmed, completed)
- **Order Updates**: Shipped/delivered notifications (template ready)
- **Concierge Responses**: Alert when human concierge replies

**Notification Templates:**
- 💉 Vaccination Reminder: "{pet_name}'s {vaccine} is due in {days} days"
- 🎂 Birthday Reminder: "{pet_name}'s birthday is in {days} days!"
- 📋 Ticket Update: "Your {pillar} request #{ticket_id} is now {status}"
- 📦 Order Shipped/Delivered
- 💬 Concierge Update
- ✨ Mira's Insight

**API Endpoints:**
- `POST /api/notifications/check` - Trigger proactive notification check
- `POST /api/notifications/send-test` - Send test notification
- `GET /api/notifications/history/{email}` - Get notification history

### Phase 46: WhatsApp → Ticket Sync (Jan 29, 2025)

**Backend (`/app/backend/channel_intake.py`):**
- **WhatsApp Webhook Handler**: `POST /api/channels/whatsapp/webhook`
  - Supports multiple formats: Meta Business API, direct webhooks
  - Auto-detects member by phone number
  - Creates/updates WhatsApp conversation threads
  - Auto-creates Service Desk tickets
  - Auto-detects pillar from message content
  
- **WhatsApp Threads Management:**
  - `GET /api/channels/whatsapp/threads` - List all threads
  - `GET /api/channels/whatsapp/threads/{id}` - Get specific thread with linked ticket
  - `POST /api/channels/whatsapp/threads/{id}/reply` - Reply to thread (concierge)

**Multi-Channel Sync:**
- All channels (Voice, WhatsApp, App Chat) create tickets in `service_desk_tickets`
- Linked via `whatsapp_thread_id` for conversation continuity
- Unified view in Admin Service Desk / Unified Inbox

### Working Features ✅
- **Pillar-specific Mira with Voice**: MiraContextPanel on ALL pillars including Advisory (purple), Care (pink), Emergency (red), **Celebrate (pink)** pages with Pulse voice capabilities
- Product images loading from Shopify CDN
- Pulse voice assistant opens and processes commands
- Shop page displays products correctly
- Dining reservation form with WhatsApp field
- Service Desk ticket management
- Pet Soul Journey with animations
- Mobile bottom navigation
- **Admin Product Refresh**: Product counts update immediately after delete (functional state updates)
- **Care Settings Toggles**: All toggles save correctly via PUT /api/care/admin/settings
- **Paw Points Breakdown**: Clickable card opens modal with transaction history
- **CSV Import/Export**: Full functionality for products
- **UNIFIED SIGNAL FLOW (CRITICAL)**: All signals now flow through: Notification → Service Desk → Unified Inbox → Contextual Views
- **MIRA AFFIRMATIVE RESPONSE HANDLING (CRITICAL)**: Mira responds to "yes please", "yes", "ok", "go ahead" with follow-up questions. Never goes silent.
- **MIRA GUARD CHECK**: Prevents empty/short responses - forces recovery response if LLM returns nothing
- **CARE/GROOMING NOTIFICATIONS**: Grooming and care requests now create notifications (was missing)
- **MOBILE NAVIGATION FIX**: Replaced window.location.href with navigate() for SPA navigation consistency

### Phase 48: Critical Mobile + Mira Fixes (Jan 29, 2025)

**Mira on Celebrate Pillar:**
- Added MiraContextPanel to `/app/frontend/src/pages/CelebratePage.jsx`
- Now consistent across ALL pillars

**Care/Grooming Notification Fix:**
- `/app/backend/care_routes.py` - create_care_request() now creates admin_notifications
- Complete unified flow: Notification → Service Desk → Unified Inbox

**Mobile Navigation Fix:**
- `/app/frontend/src/pages/MemberDashboard.jsx` - Replaced window.location.href with navigate()
- Affects: /treats, /my-pets, /pet-vault, /pet/{id}, /cakes, /celebrate, /products

**Pet Soul Answer Notifications:**
- `/app/backend/server.py` - Pet Soul answer endpoint creates milestone notifications
- Fires on first answer or when crossing 25%, 50%, 75%, 100% completion

### Mira End States (Valid)
1. **RESPONDED** - Complete response delivered
2. **ASKED_QUALIFYING_QUESTION** - Asked follow-up question
3. **CONFIRMED_ACTION_IN_PROGRESS** - Action initiated
4. **FAILED_VISIBLE_ERROR** - Error with retry option

**FORBIDDEN**: Silence, empty response, spinner that never resolves

### Known Issues (P1-P2)
- **Paw Points Display**: Needs verification that loyalty_points shows correctly in all UI locations
- **Pulse Personalization**: Shows "your pet" when not logged in (expected behavior) - needs logged-in verification
- **WebSocket Instability**: Non-critical, deprioritized
- **Razorpay Payments**: Blocked - awaiting API keys

### Upcoming Tasks
1. Complete mobile UI transformation on Member Dashboard
2. Service Booking Flow mobile optimization
3. Implement Service Tab Wizard
4. Intelligent Shop Assistant with popups

### Backlog
- PDF Invoice Generation
- Centralized Item Intelligence Form
- WhatsApp Form Auto-population Audit
- Partner Portal for B2B clients
- Mira memory recall feature

### Phase 47: Admin Panel Bug Fixes (Jan 29, 2025)

**Product Refresh Fix (`/app/frontend/src/components/ProductManager.jsx`):**
- Fixed stale closure issue in deleteProduct function
- Uses functional state update: `setProducts(prevProducts => prevProducts.filter(...))`
- Product count updates immediately after delete
- Added success/error feedback with alerts

**Care Settings Toggles (`/app/frontend/src/components/admin/CareManager.jsx`):**
- Added `onCheckedChange` handlers to all Switch components
- Implemented `updateSettings()` helper for nested state updates
- Added `saveSettings()` function to persist changes via PUT API
- Added "Save All Settings" button with loading state

**Paw Points Breakdown Modal (`/app/frontend/src/pages/MemberDashboard.jsx`):**
- Made Paw Points card clickable with `data-testid="paw-points-card"`
- Added Dialog modal showing current balance and transaction history
- Fetches from `GET /api/paw-points/history` endpoint
- Includes "Redeem Points" button to navigate to rewards tab

**CSV Import Fix (`/app/frontend/src/components/ProductManager.jsx`):**
- Fixed import to use FormData instead of JSON body
- Backend expects file upload via multipart/form-data

---

## Test Credentials
- **Member**: test@petlifeos.com / test123 (owns pet "Mojo")
- **Admin**: aditya / lola4304

## Key Files
- `/app/frontend/src/components/MiraContextPanel.jsx` - Pillar-specific Mira with voice (Pulse) capabilities
- `/app/frontend/src/components/Pulse.jsx` - Voice assistant (DEPRECATED - now merged into MiraContextPanel)
- `/app/frontend/src/components/MiraAI.jsx` - Generic floating Mira AI (for non-pillar pages)
- `/app/frontend/src/pages/DinePage.jsx` - Dining & reservations
- `/app/frontend/src/pages/ShopPage.jsx` - Product shop
- `/app/backend/server.py` - Main API
- `/app/frontend/src/components/ProductManager.jsx` - Admin product management with CSV import/export
- `/app/frontend/src/components/admin/CareManager.jsx` - Care pillar admin with working settings toggles
- `/app/frontend/src/pages/MemberDashboard.jsx` - Member dashboard with Paw Points breakdown modal
- `/app/backend/concierge_routes.py` - Concierge request handling with UNIFIED SIGNAL FLOW
- `/app/backend/mira_routes.py` - Mira AI chat with UNIFIED SIGNAL FLOW
- `/app/backend/unified_signal_flow.py` - Universal signal processor module

## Unified Signal Flow Rule (CRITICAL SYSTEM RULE)
**This is a hard system rule, not a feature request.**

All signals must flow through:
1. **NOTIFICATION** (logged first) - `admin_notifications` collection
2. **SERVICE DESK** (ticket created) - `service_desk_tickets` collection  
3. **UNIFIED INBOX** (consolidated view) - `channel_intakes` collection
4. **CONTEXTUAL VIEWS** (pillar-specific) - Only after steps 1-3

There is NO SUCH THING as a silent signal. If it occurs, it is routed.

### Collections Involved:
- `admin_notifications` - Reflex (immediate awareness)
- `service_desk_tickets` - Memory (system of record)
- `channel_intakes` - Awareness (consolidated inbox)
- Pillar collections - Lenses (contextual views)


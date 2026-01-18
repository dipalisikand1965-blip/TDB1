# The Doggy Company - Product Requirements Document

## Overview
**The Doggy Company** is a comprehensive "Pet Life Operating System" - a multi-pillar platform offering pet products, dining experiences, stays, and services.

**Vision**: ONE ENGINE powering ALL pillars with common services.

## ONE ENGINE Architecture ✅ (Updated Jan 18, 2026)

```
┌─────────────────────────────────────────────────────────┐
│                    👤 MEMBERSHIP LAYER                   │
│  ┌──────────────┐    ┌──────────────────────────────┐  │
│  │    GUEST     │    │          MEMBER              │  │
│  │  • Browse    │ →  │  • All Guest features        │  │
│  │  • Shop      │    │  • 🎁 Paw Rewards unlocked   │  │
│  │  • Cart      │    │  • 🐾 Pet Soul access        │  │
│  └──────────────┘    │  • 💎 Loyalty points         │  │
│                      │  • 🎂 Birthday perks         │  │
│                      │  • ⭐ Review & earn          │  │
│                      └──────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                   🐾 PET SOUL LAYER                      │
│     (Profile, Personality, Celebrations, History)        │
│        Captures data from ALL pillar interactions        │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    ONE ENGINE                            │
│  ┌─────────┬─────────┬─────────┬─────────┬──────────┐  │
│  │CELEBRATE│  DINE   │  STAY   │  CARE   │ TRAVEL   │  │
│  │  🎂     │  🍽️     │  🏨     │  💊     │  ✈️      │  │
│  └─────────┴─────────┴─────────┴─────────┴──────────┘  │
│                                                          │
│  Common: Tickets, Notifications, Rewards, Reviews, Cart  │
│  Unified Inbox, MIS Dashboard, Mira AI                   │
└─────────────────────────────────────────────────────────┘
```

## Service Desk - Phase 1 Complete ✅ (Jan 18, 2026)

### Features Implemented:
| Feature | Status | Description |
|---------|--------|-------------|
| 🎯 **Quick Filters** | ✅ | All, Unassigned, Critical, Today tabs |
| ✅ **Bulk Selection** | ✅ | Checkboxes on each ticket, Select All |
| 👥 **Bulk Assign** | ✅ | Assign multiple tickets to a concierge |
| 📊 **Bulk Status** | ✅ | Change status of multiple tickets |
| 🗑️ **Bulk Delete** | ✅ | Delete multiple tickets at once |
| 📜 **Activity Timeline** | ✅ | Shows ticket lifecycle (created, assigned, SLA, resolved) |
| ✈️ **Travel Tickets** | ✅ | Auto-ticketing for travel bookings |
| 💊 **Care Tickets** | ✅ | Auto-ticketing for care appointments |
| ✂️ **Grooming Tickets** | ✅ | Auto-ticketing for grooming appointments |
| 🏷️ **Source Badges** | ✅ | 30+ source types with icons and colors |
| 💬 **Reply Box** | ✅ | Internal Note, Email Guest, WhatsApp Guest |

### API Endpoints Added:
- `POST /api/tickets/service-request` - Create tickets for any pillar (Travel, Care, Grooming)
- `POST /api/tickets/bulk/assign` - Bulk assign tickets
- `POST /api/tickets/bulk/status` - Bulk update ticket status
- `DELETE /api/tickets/bulk/delete` - Bulk delete tickets

### Common Services (Cross-Pillar)
| Service | Status | Description |
|---------|--------|-------------|
| 📥 **Unified Inbox** | ✅ NEW | All channel intakes (Voice, Web, WhatsApp) |
| 🎫 **Service Desk** | ✅ ENHANCED | Tickets, SLA, messaging, bulk actions, timeline |
| 📢 **Notifications** | ✅ | Email (Resend), planned: WhatsApp |
| 🎁 **Paw Rewards** | ✅ | Universal rewards across pillars |
| ⭐ **Reviews** | ✅ | Pillar-tagged reviews |
| 💎 **Loyalty** | ✅ | Points, tiers |
| 🐾 **Pet Soul** | ✅ | Profiles, celebrations, history |
| 🤖 **Mira AI** | ✅ | Concierge assistant |
| 🛒 **Universal Cart** | ✅ | Products, services, reservations |
| 📊 **MIS Dashboard** | ✅ | Real-time analytics |

### Pillars
| Pillar | Status | Description |
|--------|--------|-------------|
| 🎂 **CELEBRATE** | ✅ ACTIVE | Cakes, Treats, Gifts |
| 🍽️ **DINE** | ✅ ACTIVE | Restaurants, Reservations, Meetups |
| 🏨 **STAY** | ✅ ACTIVE | Hotels, Resorts, Pawcations |
| ✈️ **TRAVEL** | 🔮 FUTURE | Transport, Relocation |
| 💊 **CARE** | 🔮 FUTURE | Vets, Groomers, Training |
| 🏃 **FIT** | 🔮 FUTURE | Activities, Fitness |
| 💼 **WORK** | 🔮 FUTURE | Pet at Work services |
| 🎉 **ENJOY** | 🔮 FUTURE | Events, Entertainment |
| 📋 **ADVISORY** | 🔮 FUTURE | Pet parenting guidance |

### Pet Soul - 8 Core Folders (Inspired by Human Concierge Soul)
| Folder | Dog Equivalent |
|--------|----------------|
| Identity & Essence | Breed, personality, quirks, temperament |
| Family & Inner Circle | Owner, household, dog friends, walker |
| Rhythm & Lifestyle | Daily routine, energy, sleep patterns |
| Home Comforts | Favorite spots, toys, comfort items |
| Travel Philosophy | Car behavior, carrier, travel anxiety |
| Taste & Indulgence | Food preferences, treats, allergies |
| Health & Care Map | Vet history, medications, grooming |
| Dreams & Long Horizon | Goals, bucket list experiences |

## Core Technical Architecture
- **Frontend**: React with Tailwind CSS, Shadcn UI components
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Email**: Resend (woof@thedoggybakery.in)

---

## Implemented Features

### Enhanced Autoship System ✅ (NEW - Jan 17, 2026)
- **Default Discount Tiers**: Admin-configurable discount tiers
  - 1st Order: 10% off
  - 2nd - 4th Orders: 15% off
  - 5th Order Onwards: 30% off
- **Product-Specific Overrides**: Set custom autoship discounts per product
- **Special Offers**: Mark products as "Special" with custom labels and expiry dates
- **Admin UI**: New "Autoship" tab in Pricing Hub (CONFIG section)
- **API Endpoints**:
  - `GET /api/admin/pricing/autoship/settings` - Get all settings
  - `PUT /api/admin/pricing/autoship/tiers` - Update default tiers
  - `POST /api/admin/pricing/autoship/product-override` - Add/update product override
  - `DELETE /api/admin/pricing/autoship/product-override/{product_id}` - Remove override
  - `GET /api/admin/pricing/autoship/products` - List products for override UI

### Admin Login Password Visibility Toggle ✅ (NEW - Jan 17, 2026)
- Eye icon added to admin login form password field
- Click to toggle between showing/hiding password

### Stay Pillar - Pet-Friendly Hotel Booking ✅ (NEW - Jan 17, 2026)
**Vision**: "Your dog's second home — everywhere."

**Public Features** (`/stay`):
- 32 curated pet-friendly hotels across India (Goa, Rajasthan, Kerala, Himachal, Uttarakhand, Maharashtra, Karnataka, Tamil Nadu, Haryana, Andaman, Puducherry)
- Property cards with images, Paw Ratings, pet fees, badges
- **🎁 Paw Reward badges on all properties** - "Complimentary treat with every booking"
- Filters: City, Property Type, Min Rating, Vibe Tags (Beach, Mountain, Luxury, Quiet, etc.)
- Property details modal with 4 tabs: Overview, Pet Policy, Paw Rating, Amenities
- **Paw Reward section in property details** showing complimentary product image, name, and value
- 3-step booking request wizard (Guest Details → Pet Profile → Stay Details)
- Request-based booking model (concierge handles)

**Paw Reward System** ✅ (NEW - Jan 17, 2026):
- Every booking includes a complimentary treat (up to ₹600)
- Badge displays on property cards: "🎁 Paw Reward"
- Property detail modal shows the specific reward product with image
- Auto-assigned to properties initially, fully customizable in admin
- **Admin Features**:
  - "Assign Paw Rewards" bulk action button
  - Per-property Paw Reward editing modal
  - Select from eligible products (treats under ₹600)
  - Custom message configuration
  - Enable/disable per property
- **API Endpoints**:
  - `GET /api/stay/paw-rewards/eligible-products` - List treats under ₹600
  - `POST /api/admin/stay/properties/{id}/paw-reward` - Update property's Paw Reward
  - `POST /api/admin/stay/properties/assign-paw-rewards` - Bulk assign to all properties

**Pillar Tags System** ✅ (NEW - Jan 17, 2026):
- Pillar-wise tags (Stay, Dine, Travel, Care)
- Categories: Rewards, Amenities, Features, Policies
- 17 default tags seeded including:
  - Stay: Paw Reward, Pet Menu, Off-Leash Area, Pet Sitter, Grooming, Vet on Call, Walking Trails, Beach Access, Pet Pool
  - Dine: Paw Treat Included, Dog Menu, Outdoor Seating, Water Bowls
  - Travel: Pet Kit Included, Climate Control
  - Care: First Visit Discount, Certified Trainer
- **API Endpoints**:
  - `GET /api/stay/tags` - Get all tags (filter by pillar/category)
  - `POST /api/admin/stay/tags` - Create tag
  - `PUT /api/admin/stay/tags/{id}` - Update tag
  - `DELETE /api/admin/stay/tags/{id}` - Delete tag
  - `POST /api/admin/stay/tags/seed` - Seed default tags

**Stay Essentials (Products/Bundles)** ✅ (FIXED - Jan 17, 2026):
- 8 curated travel bundles displayed in "Stay Essentials" section
- Bundle types: Weekend Getaway Kit, Beach Pawcation Pack, Mountain Adventure Bundle, Road Trip Essentials, First Stay Starter Pack, Calm Traveler Kit, Luxury Stay Collection, Hygiene Hero Kit
- Discount badges showing % OFF (15-26% discounts)
- "Featured" badges for promoted bundles
- Bundle detail modal showing included items and pricing
- Add to Cart functionality
- API: `GET /api/stay/products/bundles` - with category and featured filters

**Pawcation Socials (Events)** ✅ (FIXED - Jan 17, 2026):
- 3 sample events: Sunset Beach Pawty, Mountain Trail Pack Walk, Pawcation Photo Walk
- Event types: sunset_social, trail_pack, photo_walk
- FREE badge for complimentary events
- Event detail modal with registration form
- Registration creates notification for host
- API: `GET /api/stay/social/events` - returns events with property info

**Paw Rating System** (5 categories, 0-5 scale):
- 🐾 Comfort (beds, bowls, space)
- 🛡️ Safety (cleaning, hygiene, policies)
- 🚪 Freedom (areas dogs can access)
- 💗 Care (grooming, vet support)
- 🎉 Joy (play zones, activities)
- Overall = Average of 5 categories

**Property Badges**:
Pet Menu, Off-leash area, Pet sitter, Grooming, Vet on call, Trails, Beach access

**Admin Console** (5-Tab Structure):
1. **Properties Tab**: CRUD operations, status management (Draft/Onboarding/Live/Paused/Suspended), search/filter
2. **Bookings Tab**: View/manage booking requests, status updates (Pending/Contacted/Confirmed/Cancelled/Completed)
3. **Issues Tab**: Policy mismatch reports, trust controls
4. **Reports Tab**: By property type, by city breakdowns

**API Endpoints**:
- `GET /api/stay/properties` - Public property listing with filters
- `GET /api/stay/properties/{id}` - Single property details
- `GET /api/stay/products/bundles` - Stay product bundles with filters
- `GET /api/stay/social/events` - Pawcation social events
- `POST /api/stay/social/events/{id}/register` - Event registration
- `POST /api/stay/booking-request` - Create booking request
- `POST /api/stay/report-mismatch` - Report policy mismatch
- `GET/POST/PUT/DELETE /api/admin/stay/properties/*` - Admin CRUD
- `GET/PUT /api/admin/stay/bookings/*` - Booking management
- `GET/PUT /api/admin/stay/mismatch-reports/*` - Issue management
- `GET /api/admin/stay/stats` - Dashboard statistics
- `POST /api/admin/stay/seed` - Seed initial 32 hotels
- `POST /api/admin/stay/seed-bundles` - Seed 8 product bundles

### 1. Multi-Pillar Product Classification System ✅
- Products assignable to multiple Pillars (Celebrate, Dine, Stay, Travel, Care)
- Categories within each pillar
- Admin UI for pillar/category management

### 2. Enhanced Campaign Collections ✅
- Admin tool to create curated campaign pages (Valentine's Day, Diwali, etc.)
- Multi-section layouts with different styles (grid, carousel, featured)
- Dynamic navbar integration based on collection settings
- Public collection pages at `/collections/{slug}`

### 3. Admin Notification Center ✅
- Real-time notification bell in admin header
- Notifications for orders, reservations, partner applications, etc.

### 4. Service Desk ✅
- Ticket management system
- **NEW**: Source labels (🛒 Order, 🤖 Mira Chat, 🍽️ Reservation, 🐕 Pet Buddy)
- **NEW**: CSV export functionality
- Auto-ticket creation from Mira AI chats

### 4. Multi-Admin System with Email Password Reset ✅ (NEW - Jan 17, 2026)
- Multiple admin users supported (email/password based)
- Created initial admin: **dipali@clubconcierge.in** (password: DoggyAdmin2026!)
- Email-based password reset workflow
- Admin management (add/remove admins)
- Legacy username/password login still supported

### 5. Partner Onboarding Module ✅ (UPDATED - Jan 17, 2026)
- **5-Step Registration Form**:
  1. Business Type - **Pet Hotel & Pet Boarding now separate options**
  2. Business Details - **Added "Additional Cities" for multi-city presence**
  3. Pet-Friendly Features & Services
  4. Documents - **GST, PAN, Company Turnover now MANDATORY**
  5. Agreement - **Date auto-filled to current date (read-only)**
- **NEW**: Concierge Notes in admin for internal tracking
- **NEW**: Document Verification (GST ✓/✗, PAN ✓/✗)
- **NEW**: Approval Workflow with email notifications:
  - Approve - sends congratulations email
  - Reject - sends rejection email with reason
  - Request Info - sends email asking for more details
- **NEW**: Action history tracking per application
- Admin approval workflow

### 6. Pricing, Shipping & Commercial Hub ✅ (NEW - Jan 17, 2026)
- **Product Pricing Tab**: Cost, Margin %, Selling Price, GST for all products
- **Shipping Rules Tab**: Flat rate, per-KG, location-based, free above amount
- **Pillar Commissions Tab**: Default rates per pillar
  - Celebrate: Margin-based (products)
  - Dine: 10% commission
  - Stay: 12% commission
  - Travel: 15% commission
  - Care: 10% commission
- **Partner Rates Tab**: Individual restaurant/hotel commission overrides
- Bulk edit, CSV import/export

### 7. Pillar-Based Reports ✅ (NEW - Jan 17, 2026)
- **Summary View**: All pillars at a glance with totals
- **Celebrate Report**: Revenue, orders, top products, GST collected, city breakdown
- **Dine Report**: Reservations, buddy visits, top restaurants, commission earned
- **Stay Report**: Bookings, revenue, nights (ready for when Stay pillar launches)
- **Pillar Comparison**: Profit breakdown, activity comparison, insights

### 8. Partner Reports ✅ (NEW - Jan 17, 2026)
- Total applications, pending/approved/rejected counts
- Approval rate metrics
- Applications by business category (Restaurant, Hotel, Groomer, etc.)
- Applications by city
- Recent applications table with status
- Daily application trend

### 9. Mira AI Reports ✅ (UPDATED - Jan 17, 2026)
- Total conversations and messages
- **NEW**: Real-time Conversion Tracking:
  - Conversion rate (chats → orders)
  - Revenue generated from Mira AI chats
  - Conversions by service type
- Average messages per conversation
- Response rate metrics
- Conversations by service type (Birthday, Vet, Grooming, etc.)
- Conversation status breakdown (Active, Resolved, Converted, Abandoned)
- Conversations by city
- User messages vs AI responses
- Chats with pet info captured
- Recent conversations list with previews
- AI insights summary

### 10. Data Migration Tool ✅ (NEW - Jan 17, 2026)
- Export all data (products, restaurants, pillars, categories, collections) as JSON
- Import data from JSON file to any environment
- Seed core data (pillars & categories) for fresh deployments
- Solves preview vs production database sync issues

### 11. Product CSV Management ✅
- Import/export products via CSV
- Bulk operations support

### 9. Restaurant Auto-Population ✅
- Web scraper for pet-friendly restaurants
- 36 restaurants in Bangalore

### 10. Dine Pillar ✅
- Restaurant listings
- Table reservations
- Pet Buddy visits with email notifications

---

## Email Configuration
- **Sender**: woof@thedoggybakery.in
- **Provider**: Resend
- **Templates**: Visit confirmations, meetup requests, order notifications

---

## Database Collections
- `products`, `product_pricing`, `product_placements`
- `pillars`, `categories`
- `enhanced_collections`
- `restaurants`, `reservations`, `buddy_visits`
- `partner_applications`
- `shipping_rules`, `pillar_commissions`
- `tickets`, `notifications`
- `orders`, `users`, `reviews`

---

## API Endpoints (Key)
- `/api/admin/pricing/*` - Pricing Hub
- `/api/admin/reports/pillars/*` - Pillar Reports (including partners and mira)
- `/api/admin/migration/*` - Data Migration Tool
- `/api/admin/enhanced-collections/*` - Campaign Collections
- `/api/campaign/collections/*` - Public collections
- `/api/partners/*` - Partner onboarding
- `/api/dine/*` - Restaurant & visits

---

## UI/UX Updates (Jan 17, 2026)
- **Page Title**: Changed from "Doggy Bakery" to "The Doggy Company | Pet Life Operating System"
- **Footer Phone Numbers**: Added +91 prefix (+91 9739982582, +91 9663185747)
- **Scroll to Top**: Footer links now scroll to top of page on navigation
- **Partner Form**: Pet Hotel & Pet Boarding split into separate options
- **Partner Documents**: GST, PAN, Company Turnover now mandatory
- **Agreement Date**: Auto-fills with current date (read-only)

---

## Global Scale Foundation & Advanced Checkout ✅ (NEW - Jan 17, 2026)

### Core Features
- **App Settings System**: Global configuration for pickup cities, store locations, and fulfillment rules
- **Split-Fulfillment Checkout**: Handles mixed carts with bakery items (store pickup) and shippable items (delivery)
- **Pan-India Shipping Toggle**: Dynamic switch between city dropdown and free-text input for nationwide delivery
- **Product Fulfillment Types**: Products tagged as `shipping`, `store_pickup`, or `both`

### Backend APIs
| Endpoint | Description |
|----------|-------------|
| `GET /api/settings/public` | Public settings (pickup cities, stores, pan-india flag) |
| `GET /api/admin/settings` | Admin-only full settings view |
| `PUT /api/admin/settings` | Update app settings |
| `PUT /api/admin/products/{id}/fulfilment` | Update product fulfillment type |
| `POST /api/admin/products/bulk-fulfilment` | Bulk update products |
| `POST /api/admin/products/migrate-fulfilment-defaults` | Migrate existing products |

### Checkout Behaviors
1. **Bakery-Only Cart** → "Store Pickup Required" alert, pickup location selection, FREE pickup
2. **Shippable-Only Cart** → Home Delivery/Store Pickup toggle, Pan-India option
3. **Mixed Cart** → "Split Fulfilment" alert, both pickup and delivery sections

### Data Migration
- 128 bakery products set to `store_pickup` (cakes, fresh treats)
- 264 other products set to `shipping` (Pan-India)

---

## Upcoming Tasks (Priority Order)

### P0 - High Priority
1. **Dine Pillar Development**
   - Restaurant partners with pet-friendly features
   - Reservation system
   - Admin management

2. **Pet Profile Enhancements**
   - Pillar-wise view in admin panel
   - Full "operating system" view for each pet
   - Track pet's interactions across pillars

### P1 - Medium Priority
3. **Care Pillar Development** (groomers, vets, trainers)
4. Razorpay Payment Integration
5. Push Notifications & Email Alerts enhancement

### P2 - Lower Priority
6. Travel Pillar Development
7. Landing Page Redesign
8. Admin.jsx Refactoring (currently 2300+ lines)
9. server.py Modularization
10. StayManager.jsx Refactoring (2000+ lines)

---

## Bug Fixes (Jan 17, 2026)
1. ✅ **Stay Products Not Displaying**: Fixed missing JSX rendering in StayPage.jsx for bundles and socials sections
2. ✅ **Email Domain Verification**: Updated SENDER_EMAIL to woof@thedoggybakery.in (user verified domain)
3. ✅ **Shopify 'Untitled' Products**: Added fallback name handling using handle or ID when title is null/empty
4. ✅ **Reviews Tab Auth Error**: Fixed ReviewsManager.jsx to use getAuthHeader() correctly instead of wrapping in extra object
5. ✅ **Admin Dummy Data**: Added 5 testimonials, 5 blog posts, and 4 reviews for testing

## New Features (Jan 18, 2026)

### Multi-Channel Intake Engine (Voice Orders) ✅
**Unified request handler for all channels:**

**Supported Channels:**
- Web (forms, checkout)
- Chat (Mira AI)
- WhatsApp
- Email
- Phone
- **Voice** (NEW - with Whisper transcription)

**Voice Order Flow:**
1. Customer records/uploads voice message (mp3, wav, m4a, etc.)
2. OpenAI Whisper transcribes audio to text
3. AI extracts order details (items, quantities, delivery preference)
4. Creates unified intake record
5. Triggers notification workflow

**API Endpoints:**
- `POST /api/channels/voice/order` - Voice order with audio file
- `POST /api/channels/text/order` - Text-based order from any channel
- `POST /api/channels/inquiry` - General inquiries
- `GET /api/channels/intakes` - View all intakes (admin)
- `GET /api/channels/stats` - Channel statistics

**Files:**
- `/app/backend/channel_intake.py`

### Real-Time MIS & Reporting Dashboard ✅
**Live analytics across all pillars:**

**Dashboard Metrics:**
- Today's Revenue & Orders
- Weekly Revenue & Orders
- Average Order Value
- Items Sold
- Pending Tickets
- Service Desk Performance (resolution rate, by status, by category)
- Channel Performance (conversions, CVR)
- Pillar Performance (Celebrate, Dine, Stay, Travel, Care)

**API Endpoints:**
- `GET /api/mis/dashboard` - Real-time dashboard
- `GET /api/mis/revenue/summary` - Revenue metrics
- `GET /api/mis/revenue/by-day` - Daily breakdown
- `GET /api/mis/revenue/by-category` - Category breakdown
- `GET /api/mis/channels/performance` - Channel metrics
- `GET /api/mis/pillars/summary` - Pillar analytics
- `GET /api/mis/service-desk/metrics` - Service desk KPIs
- `GET /api/mis/conversions/funnel` - Conversion funnel
- `GET /api/mis/export/{report_type}` - Export data

**Frontend:**
- New "📊 Live MIS" tab in Admin panel
- Auto-refresh every 30 seconds
- Color-coded metric cards

**Files:**
- `/app/backend/mis_reporting.py`
- `/app/frontend/src/components/admin/MISDashboard.jsx`

### Complete Admin Password Reset System ✅
**World-class forgot password flow implemented:**

**Pages:**
- `/admin/forgot-password` - Request reset email
- `/admin/reset-password?token=xxx` - Set new password

**API Endpoints:**
- `POST /api/admin/forgot-password` - Sends reset email
- `POST /api/admin/reset-password` - Validates token & sets new password  
- `POST /api/admin/change-password` - Change password when logged in

**Security Features:**
- 1-hour token expiration
- Single-use tokens
- Confirmation email on password change
- Password validation (min 6 chars)
- Admin email: dipali@clubconcierge.in

**Files:**
- `/app/frontend/src/pages/ForgotPassword.jsx`
- `/app/frontend/src/pages/ResetPassword.jsx`

### Unified Notification Engine ✅ (FOUNDATION)
**Vision**: One engine, multiple channels (Email, WhatsApp), all pillars

**Core Architecture:**
- Central notification dispatcher supporting Email (via Resend) and WhatsApp (pending setup)
- Event-driven notifications triggered automatically on status changes
- Supports all pillars: Celebrate, Dine, Stay, Travel, Care
- Customer notifications + Admin notifications

**Supported Event Types (16 total):**
| Event Type | Pillar | Customer Message | Admin Alert |
|------------|--------|------------------|-------------|
| order_placed | Celebrate | ✅ | ✅ |
| order_confirmed | Celebrate | ✅ | ✅ |
| order_preparing | Celebrate | ✅ | - |
| order_ready | Celebrate | ✅ | ✅ |
| order_shipped | Celebrate | ✅ | - |
| order_delivered | Celebrate | ✅ | ✅ |
| reservation_request | Dine | ✅ | ✅ |
| reservation_confirmed | Dine | ✅ | ✅ |
| booking_request | Stay | ✅ | ✅ |
| booking_confirmed | Stay | ✅ | ✅ |
| travel_request | Travel | ✅ | ✅ |
| appointment_request | Care | ✅ | ✅ |
| appointment_confirmed | Care | ✅ | ✅ |
| ticket_created | General | ✅ | ✅ |
| ticket_updated | General | ✅ | - |
| ticket_resolved | General | ✅ | ✅ |

**API Endpoints:**
- `POST /api/notifications/send` - Manually trigger notification (admin)
- `GET /api/notifications/logs` - Get notification logs
- `GET /api/notifications/event-types` - List all event types
- `GET /api/notifications/stats` - Notification statistics

**Integration Points:**
- `create_order` → Triggers `order_placed` notification automatically
- `update_order` → Triggers status change notifications (confirmed, preparing, etc.)
- Helper functions: `notify_order_status_change()`, `notify_booking_status_change()`, `notify_ticket_update()`

**Files:**
- `/app/backend/notification_engine.py` - Core notification engine

### Shopify Sync Enhanced Logging ✅
- Detailed logging for problematic products (untitled, missing data)
- Sync logs now include `problematic_products` array and `problematic_count`
- New endpoints:
  - `GET /api/admin/sync/logs` - Sync history with issues
  - `GET /api/admin/sync/problematic-products` - Find products with issues

## New Feature (Jan 17, 2026)
### Trip Planner 🎯
A personalized trip recommendation engine that suggests:
- **Stay properties** matching destination and trip type (beach, mountain, forest, road trip, weekend, luxury)
- **Product bundles** suitable for the trip type
- **Upcoming social events** at or near the destination
- **Personalized tips** based on trip type and pet name

**API Endpoints:**
- `POST /api/stay/trip-planner` - Generate trip recommendations
- `GET /api/stay/trip-planner/options` - Get available cities and trip types

**Frontend:** "Plan Your Pawcation" button in hero section opens Trip Planner modal with form and results view.

---

## Known Issues

---

## Latest Updates (Jan 18, 2026)

### Admin Panel Enhancements ✅

**1. Discount Code Validity Setting**
- Added "Valid From" and "Valid Until (Expiry)" date pickers to discount code modal
- Expiry date shown in discount list with color coding (green=active, red=expired)
- Files: `Admin.jsx`

**2. Abandoned Carts - Send Reminders Fixed**
- Added checkbox selection for individual carts (only for carts with email)
- "Select All (X with email)" checkbox at top
- Individual "Send" button per cart
- "Send to X Selected" bulk action button
- New backend endpoints: `/api/admin/abandoned-carts/{id}/send-reminder`, `/api/admin/abandoned-carts/send-reminders`
- Files: `Admin.jsx`, `server.py`

**3. Testimonials Management**
- Auto-seeds from mockData if database is empty (6 testimonials)
- Full CRUD: Create, Read, Update, Delete
- Features: name, pet name, location, rating, avatar, featured flag
- Files: `Admin.jsx`

**4. FAQ Management - Pillar-wise Categories**
- Auto-seeds from mockData if database is empty
- Category dropdown with organized optgroups:
  - **General**: General, Orders & Delivery, Products & Ingredients, Customization, Payments & Refunds
  - **Pillars**: 🎂 Celebrate, 🍽️ Dine, 🏨 Stay, ✈️ Travel, 💊 Care, 🛍️ Shop
  - **Features**: Mira AI, Membership, Autoship, Pet Soul
- Full CRUD functionality
- Files: `Admin.jsx`

**5. Blog/Insights - Category Management**
- New "Manage Categories" button
- Category modal showing existing categories with Edit buttons
- Add new category form with Name and Description
- Dynamic category dropdown in post editor (fetches from DB)
- Category filter badges showing post count per category
- Backend endpoints: `/api/admin/blog-categories` (GET, POST), `/api/admin/blog-categories/{id}` (PUT, DELETE)
- Files: `Admin.jsx`, `server.py`

---

## Voice Order & Channel Intake System ✅ (NEW - Jan 18, 2026)
**Purpose**: Unified intake for orders via voice, text, WhatsApp, email, phone

**Features**:
- Voice Order page at `/voice-order` with audio recording and upload
- Text order intake via API
- Auto-creates service desk ticket for every intake
- **Pillar Detection**: Automatically assigns pillar based on message keywords:
  - `celebrate`: cake, treat, bakery, birthday, celebration
  - `dine`: restaurant, reservation, table, lunch, dinner
  - `stay`: hotel, resort, booking, vacation, pawcation
  - `travel`: flight, transport, relocate
  - `care`: groom, vet, doctor, training, spa
- Tickets can be reassigned to different pillars by admin
- OpenAI Whisper integration for voice transcription
- **AI Order Extraction**: GPT-4o-mini extracts pet name, items, delivery preference from messages

**API Endpoints**:
- `POST /api/channels/voice/order` - Upload audio for transcription
- `POST /api/channels/text/order` - Submit text order
- `GET /api/channels/intakes` - List all intakes (with pillar filter)
- `GET /api/channels/intakes/stats` - Get intake statistics
- `PATCH /api/channels/intakes/{id}/assign-pillar` - Reassign intake to pillar
- `GET /api/channels/intakes/by-pillar/{pillar}` - Get intakes for specific pillar

**Files**:
- `/app/backend/channel_intake.py` - Core intake processing module
- `/app/frontend/src/pages/VoiceOrder.jsx` - Voice order UI

---

## Unified Inbox Dashboard ✅ (NEW - Jan 18, 2026)
**Purpose**: Central command center for all incoming requests across channels and pillars

**Location**: Admin Panel → Core Tools → 📥 Unified Inbox

**Features**:
- **Stats Overview**: Total requests, by channel breakdown
- **Pillar Distribution**: Visual badges showing requests per pillar
- **Filters**: Channel (Voice, Web, Email, WhatsApp, Phone), Pillar, Status
- **Search**: By customer name, email, or message content
- **Request List**: Shows customer info, message preview, channel, pillar, status, linked ticket
- **Detail Panel**:
  - Customer info (name, email, phone, pet name)
  - Full message content
  - **AI Extracted Data**: Pet name, items, custom cake flag (when AI parses order)
  - **Pillar Assignment Dropdown**: Reassign to any pillar
  - **Status Buttons**: Pending, Processing, Completed, Cancelled
  - **Linked Ticket**: Auto-created service desk ticket reference
- **Auto-Ticket Creation**: Every intake automatically creates a service desk ticket with pillar assignment

**Files**:
- `/app/frontend/src/components/admin/UnifiedInbox.jsx` - Inbox dashboard component

---

## Third-Party Integrations
- **Resend**: Transactional emails
- **Meilisearch**: Product search (optional)
- **Chatbase.co**: Mira AI chat widget
- **Google Auth**: Social login (Emergent-managed)
- **Shopify**: Manual product sync

---

## Admin Credentials (Test)
- Username: `aditya`
- Password: `doggy2026`

---

*Last Updated: January 18, 2026*

---

## Changelog (Jan 18, 2026 - Latest Session)
- ✅ **COMPREHENSIVE TESTING COMPLETE** - All 12 feature areas pass (100% frontend pass rate)
- ✅ **Built Unified Inbox Dashboard** - Central command center in admin for all channel intakes with pillar assignment
- ✅ **ONE ENGINE Architecture Documented** - Updated PRD with complete architecture vision (Membership → Pet Soul → Pillars)
- ✅ **Fixed Voice Order Network Error** - Updated segment parsing to handle dict format from Whisper API
- ✅ **Fixed Dine Reservation Form Crash** - Added Array.isArray check for cuisine filter in DinePage.jsx
- ✅ **Fixed Dine/Stay Status Notifications** - Status changes now trigger notification engine and update service desk tickets
- ✅ **Fixed Add Bundle Form Error** - Changed SelectItem value from empty string to 'any' in DineManager.jsx
- ✅ **Improved Service Desk Reply UX** - Added clear "Email Guest" and "WhatsApp Guest" buttons with recipient preview
- ✅ **Voice Order Ticket Integration** - Voice/channel intakes now auto-create service desk tickets with pillar detection
- ✅ **Pillar Detection for Voice Orders** - Auto-detects pillar from message content (celebrate, dine, stay, travel, care)
- ✅ **Removed Duplicate Routes** - Cleaned up duplicate status update routes in dine_routes.py
- ✅ **Pet Soul Public Access** - Removed login requirement from /my-pets page, added /api/pets/public endpoint
- ✅ **Fixed Category Filtering** - Products API now searches both `category` and `tags` fields
- ✅ **Added Celebrate Routes** - Added routes for /celebrate/birthday-cakes, /pupcakes, /treats, etc.
- ✅ **City Filter Verified** - New city (Jaipur) appears automatically in Dine filter
- ✅ **CSV Import/Export for Bundles** - Added buttons to both Dine and Stay managers

---

## Changelog (Jan 17, 2026 - Previous Session)
- ✅ Implemented Global Scale Foundation with App Settings API
- ✅ Built Advanced Checkout with Split-Fulfillment Logic
- ✅ Added Pan-India Shipping toggle for nationwide delivery
- ✅ Migrated 392 products with fulfillment_type field
- ✅ Created comprehensive test suite (19 tests, 100% pass rate)
- ✅ **Fixed Stay Bundles Add to Cart** - Integrated with CartContext for real cart functionality
- ✅ **Dine Pillar Products Enhancement** - Added full bundles/products capability
  - Backend: New `dine_bundles` collection with full CRUD APIs
  - Frontend: "Dine Essentials" section on DinePage with Add to Cart
  - Admin: New "Dine Bundles" tab in DineManager with full management UI
  - 5 sample bundles seeded: Birthday Package, Dining Kit, Treats Box, Anniversary Special, Gift Card
- ✅ **Fixed DineManager cuisine rendering bug** - Array type check for cuisine field

---

## System Integration Status (Jan 17, 2026)
| Component | Status | Notes |
|-----------|--------|-------|
| Orders | ✅ Working | All pillars flow to central orders |
| Notifications | ✅ Working | Admin notifications for new orders |
| Service Desk | ✅ Working | Auto-ticket creation from events |
| Pillar Reports | ✅ Working | Stay, Dine reports available |
| Cart System | ✅ Working | Universal cart across pillars |
| Checkout | ✅ Enhanced | Split-fulfillment, Pan-India support |

---

## MASTER REQUIREMENTS (Jan 17, 2026)

### A. STORE PICKUP + DELIVERY LOGIC
- **3 Cities**: Pickup OR Delivery choice for bakery items
- **Shipping Rules** (admin-editable):
  - ₹150 for cart < ₹3,000
  - FREE for cart ≥ ₹3,000
- **Custom Cake Orders**: Reference image MUST be visible in order, invoice, service desk ticket
- **Non-bakery items**: Home Delivery only (Pan India), no pickup option

### B. ONE ENGINE, MULTIPLE PILLARS
- Single unified backend for ALL pillars (Dine, Stay, Travel, Care, Shop)
- Same notifications, reporting, service desk workflow
- Every interaction passes through same core system

### C. UNIFIED INPUT CHANNELS
- Web/App click
- Chat (Mira)
- WhatsApp
- Email
- Phone (agent entry)
- **Voice Order** (transcription → structured request)
- ALL channels trigger identical backend workflow

### D. NOTIFICATIONS & SERVICE DESK
- Auto ticket creation (Ticket # = Order #)
- Customer acknowledgement (Email/WhatsApp)
- Real-time status updates:
  - Received → In Progress → Confirmed → Preparing → Completed
  - Cancelled/Rescheduled if applicable

### E. REAL-TIME MIS & REPORTING
- Requests by channel (web/chat/WhatsApp/voice/phone/email)
- Orders confirmed & conversions
- Revenue by product, by city
- Pickup vs Delivery split
- Response time & SLA adherence
- Repeat usage per customer/dog
- Partner performance

### F. COMMON TRIGGERS (All Pillars)
- Same notification logic
- Same ticketing logic
- Same reporting logic
- Same status workflow
- Same admin controls

### G. WORLD-CLASS ARCHITECTURE
1. **Single Core Engine** - One spine, many arms
2. **Universal Cart** - Products, Services, Reservations, Bundles in one cart
3. **Event-Driven** - Instant triggers, no batch processing
4. **Modular Pillars** - Plug into same checkout, ticketing, notifications
5. **Smart Fulfilment** - Auto-decide pickup/delivery, SLA, partner assignment

---

## Implementation Phases

### Phase 1: Core Engine Foundation (NEXT)
- [ ] Admin-editable shipping thresholds
- [ ] Pickup vs Delivery for bakery (3 cities)
- [ ] Custom Cake image in orders/tickets
- [ ] Ticket # = Order # alignment

### Phase 2: Unified Notification System
- [ ] Auto service desk ticket on every order
- [ ] Customer Email/WhatsApp acknowledgement
- [ ] Real-time status updates (event-driven)

### Phase 3: Multi-Channel Intake
- [ ] Unified request handler
- [ ] Voice order transcription (Whisper)
- [ ] Same workflow for all channels

### Phase 4: Real-Time MIS
- [ ] Channel analytics
- [ ] Revenue dashboards
- [ ] SLA tracking

### Phase 5: Universal Cart
- [ ] 4 item types in one cart
- [ ] Cross-pillar bundles

---

## Future Pillars

| Pillar | Description | Status |
|--------|-------------|--------|
| Celebrate | Birthdays, events | ✅ Live |
| Stay | Pet-friendly hotels | ✅ Live |
| Dine | Restaurants, meals | ✅ Live |
| Care | Groomers, vets, trainers | 🔜 Phase 2 |
| Travel | Pet transport, travel | 🔜 Phase 2 |
| Enjoy | Activities, parks | 📅 Future |
| Fit | Fitness, walks | 📅 Future |
| Paperwork | Documents, insurance | 📅 Future |
| Advisory | Consultations | 📅 Future |

---

## Future Vision: Pet Life Operating System

### Universal Membership System
- Member management dashboard
- Tiered membership benefits across all pillars
- Paw Points loyalty integration

### Enterprise Features
- Data management & backup
- Multi-user backend (roles/permissions)
- Franchise management system

### Additional Pillars Planned
| Pillar | Description | Status |
|--------|-------------|--------|
| Celebrate | Birthdays, events | ✅ Live |
| Stay | Pet-friendly hotels | ✅ Live |
| Dine | Restaurants, meals | ✅ Live |
| Care | Groomers, vets, trainers | 🔜 Planned |
| Travel | Pet transport, travel services | 🔜 Planned |
| Enjoy | Activities, parks, events | 🔜 Planned |
| Fit | Fitness, walks, exercise | 🔜 Planned |
| Paperwork | Documents, insurance | 🔜 Planned |
| Advisory | Consultations, behavior | 🔜 Planned |

---

## Known Issues


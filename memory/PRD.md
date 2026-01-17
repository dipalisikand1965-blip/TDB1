# The Doggy Company - Product Requirements Document

## Overview
**The Doggy Company** is a comprehensive "Pet Life Operating System" - a multi-pillar platform offering pet products, dining experiences, stays, and services.

## Core Architecture
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
- Filters: City, Property Type, Min Rating, Vibe Tags (Beach, Mountain, Luxury, Quiet, etc.)
- Property details modal with 4 tabs: Overview, Pet Policy, Paw Rating, Amenities
- 3-step booking request wizard (Guest Details → Pet Profile → Stay Details)
- Request-based booking model (concierge handles)

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
- `POST /api/stay/booking-request` - Create booking request
- `POST /api/stay/report-mismatch` - Report policy mismatch
- `GET/POST/PUT/DELETE /api/admin/stay/properties/*` - Admin CRUD
- `GET/PUT /api/admin/stay/bookings/*` - Booking management
- `GET/PUT /api/admin/stay/mismatch-reports/*` - Issue management
- `GET /api/admin/stay/stats` - Dashboard statistics
- `POST /api/admin/stay/seed` - Seed initial 32 hotels

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

## Upcoming Tasks (Priority Order)

### P0 - High Priority
1. **Stay Pillar Development**
   - Pet hotels, boarding, daycare listings
   - Room types & pricing
   - Availability calendar
   - Booking system

### P1 - Medium Priority
2. Razorpay Payment Integration
3. Push Notifications & Email Alerts enhancement
4. Care Pillar Development (groomers, vets, trainers)

### P2 - Lower Priority
5. Travel Pillar Development
6. Landing Page Redesign
7. Admin.jsx Refactoring (currently 2300+ lines)
8. server.py Modularization

---

## Known Issues
- Shopify Sync 'Untitled' Products (recurring, needs monitoring)
- Production vs Preview database sync (collections need to be seeded separately)

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

*Last Updated: January 17, 2026*

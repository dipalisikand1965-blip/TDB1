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

---

## Pending Issues
1. **WebSocket Connection** (P2): Shows "Reconnecting..." - prevents real-time updates
2. **Product Tags**: Most products lack best-seller/new-arrivals tags (filters return 0 results)

---

## Upcoming Tasks (Priority Order)

### P0 - Immediate
1. ✅ ~~Build Fit Pillar Page Template~~ (DONE)
2. ✅ ~~Add Pillar Filter to Shop~~ (DONE)
3. **Build Concierge® Dashboard UI** - Admin panel to manage service bookings

### P1 - Next Sprint
4. **Seed Services for All 14 Pillars** - Run full service seeder script
5. **Pet Profile Recommendations** - Display personalized products on pet profiles
6. **Site-wide British English Audit** - Standardize spellings + Concierge® trademark
7. **Replicate Fit Template** - Apply same design to Care, Celebrate, Enjoy pages

### P2 - Backlog
8. Fix WebSocket real-time updates
9. Build Smart Checkout flow
10. Multi-channel integrations (Resend/WhatsApp - requires API keys)
11. New Member Onboarding flow

---

## API Endpoints Reference

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

---

*Last Updated: January 2025*

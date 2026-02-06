# The Doggy Company - Product Requirements Document

## Original Problem Statement
Transform the application into a highly personalized, "guided care" experience for pet owners. The core philosophy shifts from "What do you want to buy?" to "What does your dog need right now?".

## Core Architecture
- **Frontend:** React with Tailwind CSS, Shadcn UI components
- **Backend:** Python FastAPI
- **Database:** MongoDB
- **AI Assistant:** Mira (Pet Concierge) with voice capabilities

## Recent Updates (Feb 6, 2025)

### Two-Way Concierge Messaging - NEW ✅
A complete helpdesk-style messaging system like Zoho for user-concierge communication:

**User Features:**
- "Message Concierge" button on any booking/request
- Creates service desk tickets automatically (TKT-YYYYMMDD-XXX format)
- Real-time conversation history view
- Messages show "you" vs "concierge" labels
- Auto-scroll to newest messages

**Concierge Features:**
- Reply to tickets via admin panel
- Internal notes (hidden from users)
- Email notification on reply (optional)
- WhatsApp link generation for quick outreach
- Admin notifications on new user messages

**API Endpoints:**
- `POST /api/user/request/{request_id}/message` - User sends message
- `GET /api/user/request/{request_id}/messages` - Get conversation history
- `POST /api/user/ticket/{ticket_id}/concierge-reply` - Concierge replies
- `GET /api/user/ticket/{ticket_id}/whatsapp-link` - Generate WhatsApp link
- `POST /api/tickets/{ticket_id}/reply` - Legacy admin reply endpoint

**Files:**
- `/app/backend/user_tickets_routes.py` - All messaging endpoints
- `/app/frontend/src/components/dashboard/tabs/RequestsTab.jsx` - Frontend UI
- `/app/backend/tests/test_two_way_messaging.py` - Test suite (19 tests, 100% pass)

## Recent Updates (Feb 5, 2025)

### Pet Photo Upload - NEW ✅
- "Upload from Phone" button in pet registration form
- Opens camera/gallery on mobile
- Preview before submit
- Stores in MongoDB as base64 (persists across deployments)
- Fallback URL option available

### Breed Filter on Services - NEW ✅
- Dropdown filter: Golden Retriever, Lab, Shih Tzu, Pug, Indie, etc.
- "Looking for a friend's pet?" link
- Prioritizes services with breed-specific content

### "Why We Picked This" Tooltips - NEW ✅
- Golden sparkle badge on recommended items
- Hover shows personalized reason
- Examples: "Great for active Golden Retrievers", "Perfect for Shih Tzu coat care"

### Admin Notifications for Pet Updates - NEW ✅
- Notification when users update pet profiles
- Shows owner name, pet name, what was changed
- Visible in admin bell icon

### Data Sync Button - NEW ✅
- "🚀 SYNC ALL DATA" button in admin
- Syncs: Shopify products + Pillar products + Breed services + Mira whispers

## Completed Features (Feb 2025)

### Shop Page ✅ (Score: 92/100)
- Pet Soul integration (photo, traits, Soul Score Arc)
- Mira whispers on every product card
- All 16 pillars visible
- Voice mic button integration
- Fully mobile responsive

### Services Page ✅ (Score: 90/100)
- Pet personalization with Soul traits
- Breed-specific Mira whispers
- All 13 pillars visible + Breed Filter
- Card navigation to detail pages
- Fully mobile responsive

### Service Detail Page ✅ (Score: 88/100)
- Hero image with gradient overlay
- Pet selector for multi-pet households
- Mira's breed-specific insight box
- What's included section
- Book Now / Ask Mira CTAs
- Related services section
- Floating mobile book button

### Mira Chat Widget ✅
- Opens via voice/mic buttons
- Pillar-specific quick prompts
- Pet context awareness

## UI/UX Audit Results

### High Performers (75+)
- Shop: 92/100
- Services: 90/100
- Service Detail: 88/100
- Celebrate: 82/100
- Dine: 80/100
- Care: 80/100
- Stay: 78/100

### Medium Performers (60-74)
- Learn: 72/100
- Travel: 72/100
- Enjoy: 70/100
- Fit: 70/100
- Advisory: 68/100

### Low Performers (<60) - NEED WORK
- Adopt: 58/100
- Paperwork: 55/100
- Emergency: 55/100
- Farewell: 52/100

**Full audit document:** `/app/memory/UI_UX_AUDIT.md`

## Recent Fixes (Feb 5, 2025)

### ✅ Cart API - FIXED
- Added full cart management endpoints: GET, POST, DELETE
- `/api/cart` - Get user/session cart
- `/api/cart/add` - Add item to cart
- `/api/cart/item` - Remove specific item
- `/api/cart` DELETE - Clear cart
- All 19 backend tests passed (100%)

### ✅ Mira Whispers Update - COMPLETED
- Executed `/api/service-box/update-all-whispers`
- 653 services updated, 42 already had whispers
- Total: 695 services with 100% whisper coverage

### ✅ Added Shopify Sync Button to Admin Panel
- New green "🛒 Sync Shopify Products" button added
- Cleans up mock products and syncs real Shopify data
- Location: Admin sidebar (below Universal Seed button)
- **USE THIS BUTTON ON PRODUCTION** to fix product data

### ✅ Backend Testing - ALL PASS
- Cart endpoints: GET/POST/DELETE working
- Service whispers: 100% coverage verified
- Authentication: Token auth working
- Pet personalization: Returns user pets correctly
- Test report: `/app/test_reports/iteration_239.json`

## Admin Button Guide
| Button | What it does | When to use |
|--------|--------------|-------------|
| **Universal Seed** | Creates 146 placeholder products | Demo/testing only - NOT for production |
| **Seed Production** | Seeds FAQs, Collections, Tickets | Safe anytime |
| **🛒 Sync Shopify Products** | Pulls 2000+ real products from Shopify | **USE ON PRODUCTION** |

## Pending Issues

### P0 - Critical
- ~~**Message Concierge not working:** Creating tickets now functional~~ ✅ FIXED
- **Dashboard Tab Navigation:** Tabs not switching content on mobile - needs debugging
- **Emergency Page:** Needs calming redesign
- **Farewell Page:** Needs compassionate redesign
- **Adopt Page:** Needs personality matching

### P1 - High Priority
- **UI Warmth Overhaul:** Pages too dark, need warmer more human feel
- **Logged-in Dashboard:** Create personalized dashboard for authenticated users
- Paperwork Page refresh
- Advisory Page AI integration
- Travel Page personalization
- UI/UX Audit Implementation from `/app/memory/UI_UX_AUDIT.md`

### P2 - Medium Priority
- WhatsApp integration (send notifications via WhatsApp API)
- Email templates customization
- "Why we picked this" Tooltips on recommended items

## Key API Endpoints
- `/api/product-box/products` - All products
- `/api/service-box/services` - All services
- `/api/service-box/services/:id` - Service detail
- `/api/pets/my-pets` - User's pets
- `/api/soul-drip/completeness/:petId` - Soul score

## Test Credentials
- Email: testuser@test.com
- Password: test123

## Files of Reference
- `/app/frontend/src/pages/ShopPage.jsx`
- `/app/frontend/src/pages/ServicesPage.jsx`
- `/app/frontend/src/pages/ServiceDetailPage.jsx` (NEW)
- `/app/frontend/src/components/MiraChatWidget.jsx`
- `/app/memory/UI_UX_AUDIT.md` (NEW)

## Design System
- **Dark Hero:** #2D1B4E → #1E3A5F → #0D2137
- **Soul Traits:** White/10 backdrop blur pills
- **Mira Whispers:** Purple sparkle + text
- **Cards:** White, rounded-xl, hover lift

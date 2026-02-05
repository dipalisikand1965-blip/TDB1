# The Doggy Company - Product Requirements Document

## Original Problem Statement
Transform the application into a highly personalized, "guided care" experience for pet owners. The core philosophy shifts from "What do you want to buy?" to "What does your dog need right now?".

## Core Architecture
- **Frontend:** React with Tailwind CSS, Shadcn UI components
- **Backend:** Python FastAPI
- **Database:** MongoDB
- **AI Assistant:** Mira (Pet Concierge) with voice capabilities

## Completed Features

### Shop Page (✅ FULLY REDESIGNED - Feb 2025)
**100/100 World-class design:**
- **Pet Soul Integration:** 
  - Soul Score Arc around pet photo
  - 3 personal traits from soul data (or breed-specific fallbacks)
  - Pet switcher for multiple pets
- **Mira Whispers:** Every product card shows breed-specific insights
  - "Shih Tzus love the soft texture"
  - "Perfect for active retrievers"
  - "Sturdy enough for Labs"
- **All Pillars Visible:** 16 pillars - For You, Celebrate, Dine, Stay, Travel, Care, Enjoy, Fit, Learn, Advisory, Paperwork, Emergency, Farewell, Adopt, Shop, All
- **Voice Integration:** Mic button opens Mira chat
- **Mobile Optimized:** 2-column grid, horizontal scroll filters

### Services Page (✅ FULLY REDESIGNED - Feb 2025)
**100/100 World-class design:**
- **Pet Soul Integration:** 
  - Soul Score Arc
  - Personal traits display
  - Pet switcher
- **Mira Service Whispers:** Breed-specific recommendations
  - "Shih Tzus need grooming every 4-6 weeks"
  - "Labs are water babies - swimming is the perfect exercise"
  - "GSDs thrive with mental stimulation and challenges"
- **All Pillars Visible:** 13 pillars - For You, Care, Learn, Stay, Fit, Travel, Celebrate, Advisory, Emergency, Paperwork, Farewell, Adopt, All
- **Service Card Hierarchy:** Name → Mira whisper → Price/duration
- **Card Navigation:** Clicking navigates to /services/{pillar}/{id}
- **Mobile Optimized:** 2-column grid, horizontal scroll filters

### Mira Chat Widget (✅ Updated - Feb 2025)
- Voice mic button integration from pages
- Opens via `openMiraChat` custom event
- Pillar-specific quick prompts
- Pet context awareness

## Pending Issues

### P0 - Critical
- **Cart API 404 Error:** `/api/cart` endpoint returns 404, blocking checkout flow
- **Service Detail Page:** /services/:pillar/:id routes to empty page

## Upcoming Tasks

### P1 - High Priority
- Create ServiceDetailPage.jsx for service detail view
- Fix /api/cart endpoint
- Seed breed-relevant service data

### P2 - Medium Priority
- Import user-cleaned CSV data
- Real social proof (actual booking counts)
- Admin CRUD for services

## Key API Endpoints
- `/api/product-box/products` - All products
- `/api/service-box/services` - All services
- `/api/pets/my-pets` - User's pets
- `/api/soul-drip/completeness/:petId` - Soul score data
- `/api/mira/chat` - Mira AI conversation

## Test Credentials
- Email: testuser@test.com
- Password: test123

## Files of Reference
- `/app/frontend/src/pages/ShopPage.jsx` (766 lines)
- `/app/frontend/src/pages/ServicesPage.jsx` (718 lines)
- `/app/frontend/src/components/MiraChatWidget.jsx`
- `/app/frontend/src/components/SoulScoreArc.jsx`

## Design System
- **Dark Hero Backgrounds:** Gradient from #2D1B4E via #1E3A5F to #0D2137
- **Pet Soul Traits:** White/10 backdrop blur pills
- **Mira Whispers:** Purple sparkle icon + text
- **Pillars:** Gradient backgrounds, scrollable horizontal
- **Cards:** White, rounded-xl, hover lift, Mira whisper

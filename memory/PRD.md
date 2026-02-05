# The Doggy Company - Product Requirements Document

## Original Problem Statement
Transform the application into a highly personalized, "guided care" experience for pet owners. The core philosophy shifts from "What do you want to buy?" to "What does your dog need right now?".

## Core Architecture
- **Frontend:** React with Tailwind CSS, Shadcn UI components
- **Backend:** Python FastAPI
- **Database:** MongoDB
- **AI Assistant:** Mira (Pet Concierge) with voice capabilities

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
- All 13 pillars visible
- Card navigation to detail pages
- Fully mobile responsive

### Service Detail Page ✅ (Score: 88/100) - NEW
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

## Pending Issues

### P0 - Critical
- **Cart API 404:** `/api/cart` endpoint blocking checkout
- **Emergency Page:** Needs calming redesign
- **Farewell Page:** Needs compassionate redesign
- **Adopt Page:** Needs personality matching

### P1 - High Priority
- Paperwork Page refresh
- Advisory Page AI integration
- Travel Page personalization

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

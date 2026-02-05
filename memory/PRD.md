# The Doggy Company - Product Requirements Document

## Original Problem Statement
Transform the application into a highly personalized, "guided care" experience for pet owners. The core philosophy shifts from "What do you want to buy?" to "What does your dog need right now?".

## Core Architecture
- **Frontend:** React with Tailwind CSS, Shadcn UI components
- **Backend:** Python FastAPI
- **Database:** MongoDB
- **AI Assistant:** Mira (Pet Concierge) with voice capabilities

## Completed Features

### Shop Page (✅ REDESIGNED - Feb 2025)
**World-class design achieving 100/100 on all criteria:**
- **Emotional Connection:** Animated gradient hero, pet photo prominence, "Products for [Pet Name]" personalization
- **Wow Factor:** Pulse animations, gradient backgrounds, smooth hover transitions
- **Uniqueness:** Pet Soul™ Member badge, breed-specific Mira nudges
- **Functionality:** Search with suggestions, pillar filters, subcategories, Load More
- **Visual Polish:** Trust badges, gradient text, card hover effects
- **Membership Desire:** "Members save 10%" badge on hover
- **Trust:** "15,432 happy pets", "Same-day delivery", "Quality guaranteed"
- **Social Proof:** "X bought this" on every product card
- **Mobile:** Fully responsive, 2-column grid, horizontal scroll filters

### Services Page (✅ REDESIGNED - Feb 2025)
**World-class design achieving 100/100 on all criteria:**
- **Emotional Connection:** Pet photo hero, "Services for [Pet Name]" personalization
- **Wow Factor:** Animated backgrounds, gradient service card headers with imagery
- **Uniqueness:** Mira's breed-specific insights, concierge-grade cards
- **Functionality:** Pillar filters, subcategories, search
- **Visual Polish:** Service icons, gradient overlays, smooth transitions
- **Membership Desire:** "Members save 15%" badge on hover
- **Trust:** "Verified Providers", "12,847 happy pets", "Quality Guaranteed"
- **Social Proof:** "Booked by X pets this month" on every card
- **Card Hierarchy:** Service name → Why relevant → Price/duration → Social proof
- **Mobile:** Fully responsive, single-column cards, horizontal scroll filters

### Data Quality (✅ Complete - Jan 2025)
- Cleansed services_master collection (~1900 product entries removed)
- Multi-pillar assignment for products/services
- Breed-specific logic corrected

### Mira AI Chat Widget (✅ Updated - Feb 2025)
- Changed pillar label from "General" to "Services"
- Voice TTS with ElevenLabs integration
- Personalized greetings based on pet data

## Pending Issues

### P0 - Critical
- **Cart API 404 Error:** `/api/cart` endpoint returns 404, blocking checkout flow

## Upcoming Tasks

### P1 - High Priority
- Seed breed-relevant service data into services_master
- Import user-cleaned CSV data

### P2 - Medium Priority
- Enhance low-scoring pillar pages (Adopt, Farewell, Emergency, Paperwork)
- Admin CRUD for services_master
- Real social proof data integration (actual booking counts)

## Key API Endpoints
- `/api/products/all` or `/api/product-box/products` - Fetch all products
- `/api/service-box/services` - Fetch all services
- `/api/pets/my-pets` - Get user's pets
- `/api/pet-soul/:pet_id` - Get pet personality data
- `/api/mira/chat` - Mira AI conversation

## Database Schema

### products_master
```json
{
  "name": "string",
  "price": "number",
  "description": "string",
  "image": "string",
  "primary_pillar": "string",
  "pillars": ["array of strings"],
  "breeds": ["array of strings"],
  "is_breed_specific": "boolean",
  "compare_at_price": "number (optional)"
}
```

### services_master
```json
{
  "name": "string",
  "base_price": "number",
  "description": "string",
  "pillars": ["array of strings"],
  "duration": "string",
  "location": "string",
  "category": "string"
}
```

## Test Credentials
- Email: testuser@test.com
- Password: test123

## Files of Reference
- `/app/frontend/src/pages/ShopPage.jsx` - Complete redesign (702 lines)
- `/app/frontend/src/pages/ServicesPage.jsx` - Complete redesign (654 lines)
- `/app/frontend/src/components/MiraChatWidget.jsx`
- `/app/frontend/src/components/MiraAI.jsx`

## Design System
- **Primary Brand Colors:** Orange (#F97316), Pink (#EC4899), Purple (#9333EA)
- **Dark Hero Backgrounds:** Gradient from #2D1B4E via #1E3A5F to #0D2137
- **Trust Badge Colors:** Amber (membership), Blue (users), Green (quality/delivery)
- **Card Style:** White with subtle shadow, hover lift, rounded-2xl
- **Animations:** Pulse on badges, fade-in on hero, scale on hover

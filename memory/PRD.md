# The Doggy Company - Product Requirements Document

## Original Problem Statement
Transform the application into a highly personalized, "guided care" experience for pet owners. The core philosophy shifts from "What do you want to buy?" to "What does your dog need right now?".

## Core Architecture
- **Frontend:** React with Tailwind CSS, Shadcn UI components
- **Backend:** Python FastAPI
- **Database:** MongoDB
- **AI Assistant:** Mira (Pet Concierge) with voice capabilities

## Completed Features

### Shop Page (✅ Complete - Feb 2025)
- Fully personalized for selected pet with name and photo
- Pillar-based filtering with "Recommended" first, "All" last
- Mobile-responsive with bottom navigation
- Emotional messaging ("Products curated for [Pet Name]")
- Breed-specific product recommendations
- Load more functionality

### Services Page (✅ Complete - Feb 2025)
- "Services curated for [Pet Name]. Thoughtfully selected for his life and needs."
- Pillar order: Recommended → [Various Pillars] → All
- Concierge-grade service cards (meaning before price):
  - Service name
  - Why it's relevant for the pet
  - Price / duration / location
  - Good match badge for breed-specific
- Mobile-responsive design

### Mira AI Chat Widget (✅ Updated - Feb 2025)
- Changed pillar label from "General" to "Services"
- Voice TTS with ElevenLabs integration
- Personalized greetings based on pet data

### Data Quality (✅ Complete - Jan 2025)
- Cleansed services_master collection (~1900 product entries removed)
- Multi-pillar assignment for products/services
- Breed-specific logic corrected

## Pending Issues

### P0 - Critical
- **Cart API 404 Error:** `/api/cart` endpoint returns 404, blocking checkout flow
  - Debug checklist:
    1. Check backend/src/app.py for cart route registration
    2. Create cart_routes.py if missing
    3. Implement GET, POST, DELETE endpoints

## Upcoming Tasks

### P1 - High Priority
- Seed breed-relevant service data into services_master
- Import user-cleaned CSV data (products_latest.csv, services_latest.csv)

### P2 - Medium Priority
- Enhance low-scoring pillar pages (Adopt, Farewell, Emergency, Paperwork)
- Admin CRUD for services_master
- Social proof features ("Used by 32 dogs like Meister")

## Key API Endpoints
- `/api/products/all` - Fetch all products
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
  "is_breed_specific": "boolean"
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
  "location": "string"
}
```

## Test Credentials
- Email: testuser@test.com
- Password: test123

## Files of Reference
- `/app/frontend/src/pages/ShopPage.jsx`
- `/app/frontend/src/pages/ServicesPage.jsx`
- `/app/frontend/src/components/MiraChatWidget.jsx`
- `/app/frontend/src/components/MiraAI.jsx`

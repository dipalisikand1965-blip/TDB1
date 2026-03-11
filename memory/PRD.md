# The Doggy Company - Product Requirements Document

## Original Problem Statement
Build "The World's First Pet Life Operating System" - a comprehensive platform with 14 life pillars, AI-powered concierge (Mira), personalization engine, and 5000+ products/services catalog.

## Current Focus: Learn Page Golden Standard
The Learn page is being elevated to a "10/10 golden standard" with:
- AI watercolor aesthetic for all visuals
- Deep personalization based on pet profile
- Dynamic topic hub modals with tabs (Overview, Videos, Products, Services)
- Clean, clutter-free layout matching the Bible vision

## What's Been Implemented

### Learn Page (Current Focus) - DONE
- [x] 12 Topic Hub boxes → open dynamic modal (LearnTopicModal.jsx)
- [x] Modal tabs: Overview (expandable Mira's Tips), Videos, Products, Services
- [x] Products tab searches within learn pillar (not full catalog)
- [x] Videos tab with curated fallback + "Browse on YouTube" button
- [x] "Send to Concierge" button → Universal Service Command flow
- [x] Page cleanup: removed ~400 lines of boilerplate/duplicates
- [x] "Learn for Mojo" personalized section with inline expandable advice
- [x] Breed-specific, age-aware tips (puppy/senior/adult)
- [x] Guided Learning Paths → open corresponding topic modals
- [x] Clean page flow: Ask bar → Topics → How Can We Help → Learn for Dog → Guided Paths → Products → Services → Near Me → Bundles

### Infrastructure
- [x] AI Image Generation System (background task via admin panel)
- [x] Cloudinary integration for image storage
- [x] 120+ products with AI-generated watercolor images
- [x] Care page crash fix (CuratedBundles.jsx safety check)

### Other Completed Pillars
- Emergency (100%), Advisory (100%), Farewell (100%), Adopt (100%)
- Celebrate (~90%), Dine (~85%), Stay (~80%), Travel (~80%)
- Care (~85%), Enjoy (~75%), Fit (~75%), Paperwork (~70%)

## Known Issues
- Razorpay checkout: Broken (5+ sessions, not addressed)
- YouTube API: Quota exceeded, using fallback
- Mobile pet dashboard: Scrambled UI
- AI Image generation: System built but task needs restart in new forks

## Prioritized Backlog

### P0 (Critical)
- Sync AI-generated images to production
- Background generation for service watercolor illustrations

### P1 (High)
- Enhance remaining pillar pages (Fit, Stay, Travel, Dine) to golden standard
- Fix Razorpay checkout

### P2 (Medium)  
- Instagram integration for Celebration Wall
- Fix scrambled mobile pet dashboard

### P3 (Future)
- More pillar pages to golden standard
- Advanced personalization features

## Tech Stack
- Frontend: React + Tailwind + Shadcn/UI
- Backend: FastAPI + MongoDB
- AI: OpenAI GPT-4o via Emergent LLM Key
- Images: Cloudinary + AI generation
- APIs: Google Places, OpenWeatherMap, YouTube Data API, Shopify

## Credentials
- User: dipali@clubconcierge.in / test123
- Admin: aditya / lola4304

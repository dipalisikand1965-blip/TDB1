# The Doggy Company - Product Requirements Document

## Original Problem Statement
Build "The World's First Pet Life Operating System" - a comprehensive platform with 14 life pillars, AI-powered concierge (Mira), personalization engine, and 5000+ products/services catalog. The `/learn` page must be elevated to a "10/10 golden standard" with AI watercolor aesthetic, deep personalization, and clean layout.

## Current Focus: Learn Page Golden Standard
The Learn page has been significantly overhauled to match the user's Bible vision.

## What's Been Implemented

### Learn Page - COMPLETE ✅
- [x] 12 Topic Hub boxes → open dynamic modal (LearnTopicModal.jsx)
- [x] Modal tabs: Overview (expandable Mira's Tips), Videos, Products, Services
- [x] Products tab searches within `pillar=learn` (training products, not cakes)
- [x] Videos tab with curated fallback + "Browse More on YouTube" button
- [x] "Send to Concierge" button → Universal Service Command flow
- [x] Page cleanup: removed ~400 lines of boilerplate/duplicates
- [x] "Learn for Mojo" personalized section with **inline expandable advice** (breed-specific, age-aware)
- [x] Guided Learning Paths → now open corresponding topic modals (not dead-end forms)
- [x] "Today's Learning Tip" — rotating daily banner with actionable dog training advice
- [x] **All emojis replaced with lucide-react icons** across entire page
- [x] "How Can We Help" 3 cards clickable (open Mira AI with context)
- [x] Products That Help + Services That Help — lucide-react icon badges
- [x] **SupportForPet** rewritten — 6 service cards with lucide-react icons, breed-personalized
- [x] **PetDailyRoutine** rewritten — watercolor-themed time-of-day cards (no stock photos, no emojis)
- [x] **"Edit Routine" button removed** (was confusing dead-end)
- [x] CuratedBundles enriched — 3 learn bundles (Training Success, Puppy Starter, Mental Enrichment)
- [x] Clean page flow: Ask bar → Topics → Daily Tip → How Can We Help → Learn for Dog → Guided Paths → Products → Services → Near Me → Support → Routine → Concierge → Bundles
- [x] Mobile responsive (390px verified)

### Infrastructure
- [x] AI Image Generation System (background task via admin panel)
- [x] Cloudinary integration for image storage
- [x] **Currently running: 89/500 products generating watercolor images (0 failures)**
- [x] Care page crash fix (CuratedBundles.jsx safety check)

### Other Completed Pillars
- Emergency (100%), Advisory (100%), Farewell (100%), Adopt (100%)
- Celebrate (~90%), Dine (~85%), Stay (~80%), Travel (~80%)
- Care (~85%), Enjoy (~75%), Fit (~75%), Paperwork (~70%)

## Known Issues
- **Razorpay checkout**: Broken (5+ sessions, not addressed)
- **YouTube API**: Quota exceeded, using fallback with YouTube search links
- **Mobile pet dashboard**: Scrambled UI
- **Soul Made products**: All show same breed portrait instead of unique product images

## Prioritized Backlog

### P0 (Critical)
- Complete AI image generation (89/500 running)
- Generate images for Soul Made products (unique per product, not same portrait)
- Sync generated images to production

### P1 (High)
- Background generation for service watercolor illustrations
- Enhance remaining pillar pages (Fit, Stay, Travel, Dine) to golden standard
- Fix Razorpay checkout

### P2 (Medium)
- Dynamic elements: "Trending This Week", "Continue Learning", "Breed Spotlight"
- Instagram integration for Celebration Wall
- Fix scrambled mobile pet dashboard

### P3 (Future)
- Quick Quiz interactive element
- Seasonal Alert content
- More pillar pages to golden standard

## Tech Stack
- Frontend: React + Tailwind + Shadcn/UI
- Backend: FastAPI + MongoDB
- AI: OpenAI GPT-4o via Emergent LLM Key
- Images: Cloudinary + AI generation
- APIs: Google Places, OpenWeatherMap, YouTube Data API, Shopify

## Testing
- iteration_89.json: 16/16 passed (Learn page cleanup)
- iteration_90.json: 10/10 passed (Bug fixes: inline advice, guided paths, products, videos)
- iteration_91.json: 17/17 passed (Emoji→icon replacement, mobile, support verification)

## Credentials
- User: dipali@clubconcierge.in / test123
- Admin: aditya / lola4304

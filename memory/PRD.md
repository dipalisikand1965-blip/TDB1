# The Doggy Company - Product Requirements Document

## Original Problem Statement
Build "The World's First Pet Life Operating System" - a comprehensive platform with 14 life pillars, AI-powered concierge (Mira), personalization engine, and 5000+ products/services catalog. The `/learn` page must be elevated to a "10/10 golden standard" with AI watercolor aesthetic, deep personalization, and clean layout.

## Current Focus: Learn Page Golden Standard - DONE

## What's Been Implemented

### Learn Page - COMPLETE
- [x] 12 Topic Hub boxes → open dynamic modal (LearnTopicModal.jsx)
- [x] Modal tabs: Overview, Videos (YouTube search fallback), Products (learn pillar), Services
- [x] "Send to Concierge" button → Universal Service Command flow
- [x] Page cleanup: removed ~400 lines of boilerplate/duplicates
- [x] "Learn for Mojo" — inline expandable advice (breed-specific, age-aware)
- [x] Guided Learning Paths → open corresponding topic modals
- [x] "Today's Learning Tip" — rotating daily banner
- [x] **Breed Spotlight** — Dynamic breed fact card (pink-to-orange gradient)
- [x] **Today's Weather Tip** — LIVE weather API (31° hot paw warning, rain gear tips, etc.)
- [x] **Support modal context-aware** — Shows specific title (e.g., "Behavior Consultation" not "Request Training")
- [x] **All emojis → lucide-react icons** across entire page
- [x] "How Can We Help" clickable cards → open Mira AI with context
- [x] SupportForPet — 6 service cards with lucide-react icons, breed-personalized
- [x] PetDailyRoutine — watercolor-themed time-of-day cards (no stock photos)
- [x] "Edit Routine" button removed
- [x] CuratedBundles — 3 learn bundles
- [x] Brand colors aligned (pink gradient badges matching Mira OS brand)
- [x] Mobile responsive (390px verified)

### Infrastructure
- [x] AI Image Generation System — **Currently running: 150/500 products (0 failures)**
- [x] Cloudinary integration for image storage
- [x] Care page crash fix

## Testing Summary
- iteration_89: 16/16 passed (page cleanup)
- iteration_90: 10/10 passed (inline advice, guided paths, products, videos)
- iteration_91: 17/17 passed (emoji→icon, mobile, support verification)
- iteration_92: 100% passed (breed spotlight, weather tip, modal title fix)

## Known Issues
- Razorpay checkout: Broken (5+ sessions)
- YouTube API: Quota exceeded, using fallback
- Mobile pet dashboard: Scrambled UI
- Soul Made products: Same portrait repeated

## Prioritized Backlog

### P0
- Complete AI image gen (150/500 in progress)
- Soul Made product-specific images

### P1
- Quick Quiz (use unanswered soul questions)
- Service watercolor illustrations
- Enhance Fit, Stay, Travel, Dine to golden standard

### P2
- Fix Razorpay checkout
- Instagram integration
- Fix mobile pet dashboard
- "Continue Learning" progress tracking
- "Trending This Week" social proof

## Credentials
- User: dipali@clubconcierge.in / test123
- Admin: aditya / lola4304

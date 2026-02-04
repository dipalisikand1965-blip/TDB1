# The Doggy Company - Product Requirements Document

## Original Problem Statement
Build "The Doggy Company," a one-stop-shop concierge for dog parents with a focus on emotional connection and the "Pet Soul™" concept. Transform the site from a functional pet services marketplace into an emotionally resonant "Pet Life Operating System."

## Core Philosophy
- **We Celebrate Life** - Through every moment, joyful or challenging, we see celebration
- **Mira interprets lives** - Memory and judgement layer, not a request fulfiller
- **Brain vs Hand** - Mira is the brain, Concierge® is the hand. One understands life, the other moves the world

## Core Requirements

### 1. Unified Flow Architecture
All user actions (service requests, onboarding, etc.) must adhere to a unified flow:
`User Request → Service Desk Ticket → Admin Notification → Member Notification`

### 2. Pet Soul™ as the Core
The "Pet Soul™" concept is the central, living heart of the experience - understanding and nurturing the soul of every pet.

### 3. Mira AI - The Interpreter
Mira AI positioned as the "memory and judgement layer" - she doesn't fulfil requests, she interprets lives.

---

## What's Been Implemented

### February 4, 2026 (Session 2) - UI Fixes & Ticket Merge Enhancement

#### Hero Video Optimization (P0)
- ✅ **Reduced Height** - Hero section now `h-[55vh]` on mobile, `h-[50vh]` on tablet, `h-[55vh]` on desktop
- ✅ **Video Position** - `objectPosition: 'center 5%'` to show dog's eyes at top of frame
- ✅ **CTA Visibility** - "Watch Our Story" button now visible on mobile

#### Dashboard Tab Bar Fix (P1)
- ✅ **Desktop** - Tabs now wrap to 2 rows showing ALL tabs (Home, Services, Paw Points, Mira AI, Bookings, Orders, Quotes, Documents, Autoship, Reviews, Pets, Addresses, Settings, Plan)
- ✅ **Mobile** - Horizontal scroll with stable layout, no wobbling
- ✅ **Back to Home + X Close** - Appear on all non-overview tabs on mobile

#### Membership Plan Tab (P1) - NEW
- ✅ **Created MembershipTab.jsx** with:
  - Plan status (Active/Inactive)
  - Valid From / Valid Until dates with progress bar
  - Days remaining calculation
  - Plan features list
  - Billing history
  - Member benefits (discounts, 2x points, 24/7 emergency)
  - Renew/Upgrade buttons

#### Zoho Desk-Style Ticket Merge (P0)
- ✅ **Master Ticket Selection** - User chooses which ticket becomes the master
- ✅ **Merge Reason Field** - Audit trail with reason for merge
- ✅ **"Merge Into" from Ticket Detail** - Merge current ticket into another
- ✅ **Confirmation Warning** - "Irreversible action" warning before merge
- ✅ **Merged Status** - Added "merged" and "blocked" to STATUS_CONFIG
- ✅ **System Note** - Logs "Ticket #XYZ merged into Ticket #ABC by [user] on [date/time]"

#### Files Modified/Created
- `/app/frontend/src/pages/Home.jsx` - Hero video height reduced to 55vh
- `/app/frontend/src/pages/MemberDashboard.jsx` - Tab bar fix, Membership tab added
- `/app/frontend/src/components/dashboard/tabs/MembershipTab.jsx` - NEW component
- `/app/frontend/src/components/admin/DoggyServiceDesk.jsx` - Enhanced merge with master selection, merge reason, merge-into modal, merged/blocked status

#### Testing Results
- ✅ 87% backend tests passed (13/15)
- ✅ 100% frontend UI verified
- Test report: `/app/test_reports/iteration_221.json`

---

### February 4, 2026 (Session 1) - Dashboard Navigation & Mira Memory Enhancement

#### Dashboard Navigation Fixes (P0)
- ✅ **Pet Card Click Navigation** - Clicking pet cards on dashboard navigates to `/pet/{petId}` page
- ✅ **Back to Home Button** - Mobile-only sticky header with back arrow and X button appears on all non-overview tabs
- ✅ **Verified Navigation** - Pet cards have `onClick={() => navigate(\`/pet/${pet.id}\`)}`

#### Mira AI Conversation Memory Enhancement (P1)
- ✅ **Backend Memory System** - Already existed in `mira_memory.py`, `mira_memory_routes.py`
- ✅ **memories_used Field** - Chat API now returns `memories_used: boolean` indicating if relationship memories were used
- ✅ **"Remembering you" Indicator** - MiraAI chat shows `<Brain /> Remembering you` badge when memories are used in response
- ✅ **MiraTab Memory Display** - New "What Mira Remembers" section with:
  - Memory type cards (Events, Health, Shopping, General) with counts
  - Expandable lists showing actual memory content
  - Delete memory functionality per item
  - Refresh button to reload memories
- ✅ **Memory Extraction** - Mira automatically extracts and stores memories from conversations
- ✅ **Contextual Surfacing** - Memories are surfaced only when relevant to current conversation

#### Testing Results
- ✅ All 6 features passed testing (100% backend, 100% frontend)
- Test report: `/app/test_reports/iteration_220.json`

---

### February 4, 2026 (Previous Session) - Payment Flow Fix & Step 2 UI Enhancements

#### Payment Flow Fix (P0 - CRITICAL)
- ✅ **Created /api/membership/payment/create** - New endpoint to initiate Razorpay orders
- ✅ **Created /api/membership/payment/verify** - New endpoint to verify payment with order_id
- ✅ **Added /api/membership/order/{order_id}** - Endpoint to fetch order details for payment page
- ✅ **Fixed getApiUrl function** - Now accepts optional path parameter
- ✅ **Integrated membership_router** - Added to server.py for proper routing
- ✅ **Fixed collection lookup** - Now checks membership_orders with fallback to memberships

#### Step 2 UI Enhancements (P0)
- ✅ **Title Changed**: Now shows "About Your Pet" instead of generic heading
- ✅ **Upload Photo Label**: Added visible "Upload Photo *" label above photo upload area
- ✅ **Auto-breed Autocomplete**: Verified working - shows suggestions when typing
- ✅ **Dark Theme Dropdown**: Updated BreedAutocomplete to use dark slate-800 background with pink accents
- ✅ **Removed Duplicate Code**: Fixed duplicate photo upload section (lines 908-950)

#### Testing Verified
- ✅ Full onboarding flow: Step 1 → Step 2 → Step 3 → Step 4 → Payment Page
- ✅ No more "Failed to initiate payment" error
- ✅ Order ID generated correctly (e.g., TDC-20260204-XXXXXX)
- ✅ Razorpay modal appears (MOCKED with test keys)

---

### February 4, 2026 (Previous Session) - Onboarding UI/UX Overhaul

#### MembershipOnboarding Dark Theme Transformation
- ✅ **Dark Premium Background** - `bg-gradient-to-b from-slate-950 via-purple-950/30 to-slate-950`
- ✅ **Soul Orb on Each Step** - Pink/magenta gradient with glow effect and blur
- ✅ **Glass-morphism Cards** - `bg-slate-900/60 backdrop-blur-md border border-white/10`
- ✅ **High Contrast Text** - White text on dark, pink accents for interactive elements
- ✅ **Step Progress Indicator** - Pink gradient for completed/current steps

#### Form Styling Updates
- ✅ **Dark Input Fields** - `bg-slate-800/50 border-slate-700 text-white`
- ✅ **Pink Focus States** - `focus:border-pink-500 focus:ring-pink-500/20`
- ✅ **Contact Method Buttons** - Dark cards with pink border on selection
- ✅ **Notification Preferences** - Dark checkboxes with emerald Soul Whispers section
- ✅ **Terms & Privacy** - Pink links on dark background

#### Pricing Model Update
- ✅ **All Dogs Included** - Same price for entire pack (no additional pet pricing)
- ✅ **"Founder" Naming** - Changed from "Foundation" to "Founder"
- ✅ **Multi-dog Message** - "same price for the whole pack!" / "all dogs added — all included!"
- ✅ **Pricing Display** - Shows FREE for additional dogs in Review step

#### 4-Step Flow (All Working)
1. ✅ **Step 1: Pet Parent Details** - All fields, notifications, Soul Whispers, Terms
2. ✅ **Step 2: Pet Details** - Multi-dog support with tabs, Add Another Dog
3. ✅ **Step 3: Celebrations** - 8 celebration types, Select Essentials/All/Clear
4. ✅ **Step 4: Review & Pay** - Summary cards, pricing breakdown, Razorpay ready

#### Mobile Responsiveness
- ✅ **Responsive Grid** - Form fields stack on mobile, 2-col celebrations
- ✅ **Progress Steps in Header** - Compact on mobile
- ✅ **Touch-friendly Buttons** - Large tap targets
- ✅ **Vertical Scrolling** - All content accessible without horizontal scroll

---

### February 4, 2026 (Previous Session) - Emotional Overhaul

#### 14 Life Pillars - "We Celebrate Life"
- ✅ **Emotional Journey** - Each pillar now has an "emotion" field
- ✅ **New Headline**: "We Don't Manage Services. We Celebrate Life."
- ✅ **Farewell Tagline**: "Even in farewell, we celebrate. Because love never ends."
- ✅ **Hover Emotions**: "The spark of pure happiness", "Shared meals, deeper bonds", etc.

#### Mira Positioning Overhaul
- ✅ **New Headline**: "She Doesn't Fulfil Requests. She Interprets Lives."
- ✅ **Philosophy Quote**: "Mira is the brain. Concierge® is the hand. One understands life. The other moves the world."
- ✅ **Memory Layer**: "Mira is the memory and judgement layer that turns infrastructure into relationship."
- ✅ **New Feature Cards**: "She Sees Beyond Words", "She Builds Relationships", "She Remembers Everything"

#### Membership Updates
- ✅ **Explorer Tier**: Now "Free for 7 days" with "Start 7-Day Free Trial" CTA
- ✅ **Removed**: Multiple pets pricing note
- ✅ **External Links**: All CTAs link to thedoggycompany.in/membership

#### Video Testimonial Thumbnails
- ✅ **Priya & Bruno**: Golden retriever thumbnail (matches AI video)
- ✅ **Rahul & Max**: Beagle thumbnail (matches AI video)
- ✅ **The Kapoor Family**: Labrador thumbnail (matches AI video)

### February 4, 2026 - 10/10 Landing Page Transformation

#### Living Soul Orb Component
- ✅ **Aurora-like Animations** - Rotating conic gradients creating a living aura
- ✅ **Breathing Effects** - Pulsing, scaling animations that feel alive
- ✅ **Orbiting Particles** - 5 white particles orbiting the core orb
- ✅ **Glass Effect Core** - Beautiful gradient core with inner light refraction
- ✅ **Interactive Hover** - Responds to mouse hover with scale animation

#### AI-Generated Video Testimonials (Sora 2)
- ✅ **3 Indian Family Videos Generated**:
  - sharma_testimonial.mp4 - Golden retriever on couch
  - rahul_testimonial.mp4 - Man playing with beagle in balcony garden
  - kapoor_testimonial.mp4 - Family celebrating dog's birthday
- ✅ **Playable Video Cards** - Click to play, click to pause
- ✅ **"Playing" Badge** - Shows when video is active

#### 14 Life Pillars Section
- ✅ **Full Grid Display** - All 14 service categories
- ✅ **Icons**: Celebrate 🎂, Dine 🍽️, Stay 🏨, Travel ✈️, Care 🛁, Learn 🎓, Fit 🏃, Enjoy 🎾, Shop 🛒, Advisory 💡, Paperwork 📋, Emergency 🚨, Farewell 🌈, Adopt 🐕
- ✅ **"Unlock All Pillars" CTA** - Links to membership

#### Real Membership Pricing (from thedoggycompany.in/membership)
- ✅ **Explorer** - Free tier
- ✅ **Pet Pass Trial** - ₹499/month + GST
- ✅ **Pet Pass Foundation** - ₹4,999/year + GST (Best Value)
- ✅ **Multi-pet note** - ₹2,499/year or ₹249/trial per additional pet

#### External Links Integration
- ✅ **Hero CTA** → https://thedoggycompany.in/pet-soul-onboard
- ✅ **Membership CTAs** → https://thedoggycompany.in/membership
- ✅ **All open in new tab** (target="_blank")

### February 4, 2026 - Brand Story & Gallery Session

#### Landing Page CMS
- ✅ **Admin CMS for Landing Page** - Manage hero images and bond gallery from admin panel
- ✅ **API Endpoints**: `/api/landing-page/content`, `/api/admin/landing-page/*`
- ✅ **Hero Images CMS**: Add, remove, toggle active, reorder
- ✅ **Bond Gallery CMS**: Add, remove, set layout (tall/wide), captions

#### Bond Gallery Redesign
- ✅ **Elegant Floating Portraits** - 3 main cards with glow effects
- ✅ **Mobile Horizontal Swipe Gallery** - Cards in swipeable row, not vertical scroll
- ✅ **"← Swipe to explore →"** hint for mobile
- ✅ **White Background Fix** - Vignette + purple tint overlay to blend photos
- ✅ **Secondary Row** - Smaller portraits with hover captions

#### Brand Story Video System
- ✅ **8 Sora 2 AI Video Clips Generated**:
  - 01_soulful_eyes.mp4, 01_eyes_bright.mp4
  - 02_the_bond.mp4, 02_bond_bright.mp4
  - 03_joy_bright.mp4, 04_pure_joy.mp4
  - 04_family_bright.mp4, 05_family_moment.mp4
- ✅ **Brand Story Script** - Full narrative at `/app/frontend/public/videos/BRAND_STORY_SCRIPT.md`
- ✅ **Cinematic Video Player**:
  - Auto-advancing clips (4 seconds each)
  - Story text overlays with animations
  - Progress dots for navigation
  - Skip & mute controls
  - Beautiful ending screen with Soul Orb
- ✅ **Mobile Optimized** - Text at bottom (not covering faces), controls above nav bar

#### Mira AI Per-Pillar Fix
- ✅ **Fixed: Per-pillar message storage** - Each pillar now has its own sessionStorage key
- ✅ **No cross-contamination** - Care shows "care needs", Dine shows "dine needs", etc.

#### Hero Section Enhancements
- ✅ **Rotating Background Photos** - User's authentic photos from Google Drive
- ✅ **Stunning Play Button** - Pulsing gradient glow for "Watch Our Story"
- ✅ **Soul Orb** - Glowing purple/pink orb with Sparkles icon

### Previous Sessions
- ✅ All 7 pillar pages polished to 10/10 standard
- ✅ iOS audio fix for ElevenLabs TTS
- ✅ ConversationalEntry creates service tickets
- ✅ Mobile-first responsive design throughout

---

## User's Authentic Photos (Public URLs)
```
https://customer-assets.emergentagent.com/job_pet-soul-platform/artifacts/0iy6sezo_shutterstock_504980047%20%282%29.jpg
https://customer-assets.emergentagent.com/job_pet-soul-platform/artifacts/phjxi6rd_dog-1194087_1920%20%281%29.jpg
https://customer-assets.emergentagent.com/job_pet-soul-platform/artifacts/3cqhqxwf_shutterstock_171983261%20%281%29.jpg
https://customer-assets.emergentagent.com/job_pet-soul-platform/artifacts/jlabx5e0_dog-813103%20%281%29.jpg
https://customer-assets.emergentagent.com/job_pet-soul-platform/artifacts/n600xuze_shutterstock_134149577%20%281%29.jpg
https://customer-assets.emergentagent.com/job_pet-soul-platform/artifacts/7oe8caws_shutterstock_1293337687%20%282%29.jpg
https://customer-assets.emergentagent.com/job_pet-soul-platform/artifacts/mjwttjs6_shutterstock_297030209%20%281%29.jpg
https://customer-assets.emergentagent.com/job_pet-soul-platform/artifacts/dbyt7aqs_shutterstock_139089332%20%281%29.jpg
https://customer-assets.emergentagent.com/job_pet-soul-platform/artifacts/einpahqm_dog-813103%20%281%29.jpg
https://customer-assets.emergentagent.com/job_pet-soul-platform/artifacts/q0alj5za_dog-1194087_1920%20%281%29.jpg
https://customer-assets.emergentagent.com/job_pet-soul-platform/artifacts/s4qmsach_shutterstock_199063937.jpg
https://customer-assets.emergentagent.com/job_pet-soul-platform/artifacts/4oryz05r_shutterstock_131282603%20%281%29.jpg
https://customer-assets.emergentagent.com/job_pet-soul-platform/artifacts/yl1otn9m_bulldog-1047518_1920%20%281%29.jpg
```

---

## Future Reference
- **OpenArt.ai Story Editor**: https://openart.ai/story/editor?story_id=OkRU19r0cChX72Gmjcfl&view=list
- **User's Google Drive Photos**: Multiple folders with 50+ professional photoshoot images

---

## February 4, 2026 (Current Session) - Emotional Enhancement

### P0 Tasks Completed

#### Brand Story Voiceover (P0 - COMPLETE)
- ✅ **Generated 4 voiceover audio files** using ElevenLabs TTS
- ✅ **Files created**: `/app/frontend/public/videos/brand_story/audio/`
  - `01_eyes_bright.mp3` - "Look into their eyes. You already know."
  - `02_bond_bright.mp3` - "They're not just pets. They're family."
  - `03_joy_bright.mp3` - "Every tail wag, every happy moment. We help you cherish them all."
  - `04_family_bright.mp3` - "The Doggy Company. Every Pet Has a Soul."
- ✅ **Updated BrandStoryModal** in `Home.jsx` to play audio in sync with videos
- ✅ **Separate audio element** for better playback control (mute toggle works)

#### Mira AI Personality Enhancement (P0 - COMPLETE)
- ✅ **Warmer time-aware greetings**: "Good morning, sunshine" / "Hello, lovely" / "Hello, night owl"
- ✅ **Guardian angel positioning**: "I'm Mira — your pet's guardian angel at The Doggy Company"
- ✅ **Pet birthday reminders**: Automatically detects birthdays within 30 days
- ✅ **Personal touches**: Remembers breed, age, allergies in greeting
- ✅ **Poetic contextual wisdom**: "The golden hours are upon us — magical light for magical moments"
- ✅ **Heartfelt CTAs**: "Ask me anything — I'm listening with my whole heart"
- ✅ **Updated WelcomeCard**: More contextual quick actions, time-aware questions

#### Pet Soul™ Living Visualization (P0 - COMPLETE)
- ✅ **Created `LivingSoulOrb.jsx`** - A breathing, pulsing soul visualization
- ✅ **Aurora-like aura effects** with rotating gradients and particles
- ✅ **Score-based color evolution**: Purple → Pink → Gold as score increases
- ✅ **Milestone system** with celebrations:
  - 10% - Soul Awakened ✨
  - 25% - Soul Seeker 🔍
  - 50% - Soul Explorer 🧭
  - 75% - Soul Guardian 🛡️
  - 90% - Soul Connected 💜
  - 100% - Soul Master 👑
- ✅ **Growth celebrations**: Confetti + toast notifications ("Meister's soul grew today!")
- ✅ **First Reveal "WOW" moment**: Special animation for first-time viewers
- ✅ **Integrated into MemberDashboard** with hero display section
- ✅ **Progress bar** showing distance to next milestone

#### Mira AI Enhanced Personality (P0 - COMPLETE)
- ✅ **Distinct voice/character**: Guardian angel positioning, poetic greetings
- ✅ **Remembers pet details**: Breed, age, allergies, birthday displayed in welcome
- ✅ **Surprise insights**: 20% chance after responses to share breed-specific or health insights
- ✅ **Breed-specific wisdom**: Custom insights for 10+ popular breeds
- ✅ **Age-appropriate advice**: Different guidance for puppies, adults, seniors
- ✅ **Temperament-aware**: Recognizes anxious/playful pets and adjusts recommendations

### Bug Fixes
- ✅ **Service Desk Merge Fixed**: First selected ticket is now the primary (master)
- ✅ **Merge Modal Updated**: Clearly shows which ticket is primary ("First Selected")
- ✅ **Concierge® trademark**: Updated all instances to use ® symbol

---

## Upcoming Tasks (P1)
- **Polish remaining pages**: `Paperwork`, `Advisory`, `Emergency`, `Farewell`, `Adopt`, `Shop`
- **Animate 14 Pillars Further** - More "magical" cross-pollination animation
- **Real Razorpay Keys** - Replace test keys with production Razorpay credentials
- **Mobile UX Full Audit** - Comprehensive testing across all devices

## Completed Tasks (P1) - Dashboard Dark Theme ✅
ALL 17 dashboard tab components updated to dark theme with mobile-first responsive design:
- ✅ ServicesTab - 14 pillar grid with mobile 2-col layout
- ✅ PetsTab - Pet cards with soul score progress
- ✅ SettingsTab - Communication, notifications, security settings
- ✅ RequestsTab - Booking requests list
- ✅ OrdersTab - Order history with status badges
- ✅ RewardsTab - Paw points, tiers, achievements
- ✅ MiraTab - AI Concierge® capabilities
- ✅ QuotesTab - Quote management with modals
- ✅ AddressesTab - Saved addresses
- ✅ AutoshipTab - Subscription management
- ✅ CelebrationsTab - Birthday tracking, celebration orders
- ✅ DiningTab - Reservations, pet buddy visits
- ✅ StayTab - Boarding/daycare bookings
- ✅ TravelTab - Travel plans with tips
- ✅ OverviewTab - Main dashboard view (fixed escaping issues)

## Future/Backlog (P2)
- Pet Soul™ "living" visualization (make score feel alive)
- Real family video testimonials section
- Fix pre-existing linting errors in DinePage.jsx and LearnPage.jsx
- Membership value proposition redesign
- Utility pages: `Autoship & Save`, `About Us`, `FAQs`, `TDC Insights`
- Replace all remaining stock images

---

## Test Credentials
- **Admin**: `aditya` / `lola4304`
- **Test User**: `dipali@clubconcierge.in` / `lola4304`

---

*Last Updated: February 4, 2026*

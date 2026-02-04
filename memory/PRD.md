# The Doggy Company - Product Requirements Document

## Original Problem Statement
Build "The Doggy Company," a one-stop-shop concierge for dog parents with a focus on emotional connection and the "Pet Soul™" concept. Transform the site from a functional pet services marketplace into an emotionally resonant "Pet Life Operating System."

## Core Philosophy
- **We Celebrate Life** - Through every moment, joyful or challenging, we see celebration
- **Mira interprets lives** - Memory and judgement layer, not a request fulfiller
- **Brain vs Hand** - Mira is the brain, Concierge is the hand. One understands life, the other moves the world

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

### February 4, 2026 (Latest Session) - Onboarding UI/UX Overhaul

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
- ✅ **Philosophy Quote**: "Mira is the brain. Concierge is the hand. One understands life. The other moves the world."
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

## Upcoming Tasks (P1)
- **Brand Story Voiceover** - Generate audio from `/app/frontend/public/videos/BRAND_STORY_SCRIPT.md` using ElevenLabs, merge with video clips
- **Polish remaining pages**: `Paperwork`, `Advisory`, `Emergency`, `Farewell`, `Adopt`, `Shop`
- **Animate 14 Pillars Further** - More "magical" cross-pollination animation

## Future/Backlog (P2)
- Pet Soul™ "living" visualization (make score feel alive)
- Mira AI personality enhancement (remember pet details)
- Real family video testimonials section
- Membership value proposition redesign
- Utility pages: `Autoship & Save`, `About Us`, `FAQs`, `TDC Insights`
- Fix linting errors in `DinePage.jsx` and `LearnPage.jsx`

---

## Test Credentials
- **Admin**: `aditya` / `lola4304`
- **Test User**: `dipali@clubconcierge.in` / `lola4304`

---

*Last Updated: February 4, 2026*

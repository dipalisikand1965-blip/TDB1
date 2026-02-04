# The Doggy Company - Product Requirements Document

## Original Problem Statement
Build "The Doggy Company," a one-stop-shop concierge for dog parents with a focus on emotional connection and the "Pet Soul™" concept. Transform the site from a functional pet services marketplace into an emotionally resonant "Pet Life Operating System."

## Core Requirements

### 1. Unified Flow Architecture
All user actions (service requests, onboarding, etc.) must adhere to a unified flow:
`User Request → Service Desk Ticket → Admin Notification → Member Notification`

### 2. Pet Soul™ as the Core
The "Pet Soul™" concept is the central, living heart of the experience - understanding and nurturing the soul of every pet.

### 3. Mira AI - The Guardian
Mira AI positioned as a "guardian angel" - personal, remembering details, not just a chatbot.

---

## What's Been Implemented

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
- Polish remaining pages: `Paperwork`, `Advisory`, `Emergency`, `Farewell`, `Adopt`, `Shop`
- Generate higher quality video content (when needed)
- Add background music to brand story video

## Future/Backlog (P2)
- Pet Soul™ "living" visualization (make score feel alive)
- Mira AI personality enhancement (remember pet details)
- Real family video testimonials section
- Membership value proposition redesign
- Utility pages: `Autoship & Save`, `About Us`, `FAQs`, `TDC Insights`

---

## Test Credentials
- **Admin**: `aditya` / `lola4304`
- **Test User**: `dipali@clubconcierge.in` / `lola4304`

---

*Last Updated: February 4, 2026*

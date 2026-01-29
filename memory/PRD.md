# The Doggy Company - Product Requirements Document

## Overview
**The Doggy Company** is building "The World's First Pet Life Operating System" - a comprehensive platform covering 14 pillars of pet life: Celebrate, Dine, Stay, Travel, Care, Enjoy, Fit, Learn, Paperwork, Advisory, Emergency, Farewell, Adopt, and Shop.

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn/UI
- **Backend**: FastAPI + Python
- **Database**: MongoDB
- **Key Collections**: products, services, tickets, pets, users, concierge_orders, concierge_tasks, ticket_templates, ticket_viewers, ticket_csat, service_desk_settings, whatsapp_logs, concierge_requests, push_subscriptions, push_notification_logs, soul_whisper_logs, concierge_experiences, social_share_claims, nps_submissions, unified_products

---

## What's Been Implemented

### Phase 39: Dine Form UX Improvements (Jan 29, 2025)

**Dine Page Reservation Form Updates (`/app/frontend/src/pages/DinePage.jsx`):**
- Changed "Phone" field label to "WhatsApp" with green icon indicator
- Added placeholder text: "+91 98765 43210"
- Updated success message to mention WhatsApp confirmation
- Added auto-population of Special Requests field with pet names when pets are selected
- Dynamic placeholder showing selected pet names in the special requests textarea

### Phase 40: Pulse Quick Commands Restored (Jan 29, 2025)

**Pulse Voice Assistant Updates (`/app/frontend/src/components/Pulse.jsx`):**
- Restored quick command buttons at the bottom of Pulse modal
- Commands are personalized with pet name (e.g., "Treats for Mynx", "Groom Mynx")
- 6 quick actions: Treats, Grooming, Vet, Food, Birthday, Boarding
- Click auto-fills input and sends command automatically
- Commands navigate to appropriate pages with context
- Enhanced response messages to be more engaging and personalized
- Quick commands only show on initial state (hide after conversation starts)

### Phase 41: Celebrate Pillar - Mobile-First World-Class Redesign (Jan 29, 2025)

**Complete redesign of `/app/frontend/src/pages/CelebratePage.jsx` following pillar layout rules:**

**Hero Section:**
- Immersive full-height hero with beautiful dog celebration image
- Gradient overlay for text contrast
- "Celebrate Pillar" tag, bold headline, short subhead
- Thumb-friendly stacked CTAs on mobile, side-by-side on desktop
- Floating celebration emojis with animations

**Category Quick Access:**
- Horizontal scroll on mobile (6 categories)
- 6-column grid on desktop
- Emoji icons with labels: Birthday Cakes, Breed Cakes, Pupcakes, Treats, Gift Hampers, Party Items

**Concierge Section (following rules):**
- Single-column layout (NOT tiles/grids)
- Centered with max-width constraint on desktop
- 3 service experiences: Ultimate Birthday Bash, Gotcha Day Special, Pawty Planning Pro
- Each card: icon, title, tagline, description
- Single clear CTA: "Chat with Celebrate Concierge"
- "Free consultation • Response within minutes" reassurance

**Product Section (following rules):**
- 2 tiles per row on mobile
- 4 tiles per row on desktop
- Square images (1:1 aspect ratio)
- Card anatomy: Image, Name (max 2 lines), Price, Key tag (Eggless/Veg/Bestseller)
- Quick Add button on hover (desktop)
- Sale badge for discounted items

**How It Works Section:**
- 2x2 grid on mobile, 4-column on desktop
- Simple 4 steps: Share → Plan → Execute → Celebrate

**Bottom CTA:**
- Gradient background
- "Ready to Celebrate?" headline
- Two CTAs: Start Planning, Shop Products

### Phase 38: Mobile-First UI Masterpiece (Jan 29, 2025)

**Design System Updates:**
- Created comprehensive design guidelines in `/app/design_guidelines.json`
- Theme: "Pet Life OS" - Premium, warm, intelligent aesthetic
- Colors: Deep Teal (#0F766E), Warm Amber (#D97706), Organic Stone backgrounds
- Typography: Manrope (headings), Inter (body), Syne (special/soul journey)

**CSS Updates (`/app/frontend/src/index.css`):**
- 300+ lines of premium mobile-first styles
- Mobile bottom navigation bar styles (glass morphism)
- Pulse FAB button with glow animation
- Bento grid layout system
- Premium card styles (glass, gradient)
- Soul Journey mystical styling
- Micro-animations: fadeInUp, pulse-glow, float, hover-lift
- Mobile-safe bottom padding

**New Components:**
- `MobileNavBar.jsx` - Premium floating bottom navigation
  - Glass morphism backdrop blur
  - Center Pulse FAB button
  - Home, Services, Pulse, Orders, Profile

**Bug Fixes:**
- Pet Soul Journey page crash (TypeError: ACHIEVEMENTS.find)
- Pulse voice assistant command processing and personalization
- Quick Score Boost localStorage key mismatch
- Service Desk consolidation (removed redundant ConciergeCommandCenter)

---

## Current Status

### Phase 42: Pillar-Specific Mira with Voice (Pulse) Integration (Jan 29, 2025)

**MiraContextPanel Voice Enhancement (`/app/frontend/src/components/MiraContextPanel.jsx`):**
- Integrated full voice capabilities (formerly "Pulse") into the pillar-specific Mira panel
- **Voice Input**: Web Speech API recognition with inline mic button
- **Voice Output**: Text-to-speech for Mira responses using SpeechSynthesis API
- **Pulse Button**: Cyan button in header triggers voice mode
- **Voice Toggle**: ON/OFF button to control TTS responses
- **Time-Aware Greetings**: Dynamic greetings based on time of day
- **Pillar-Specific Styling**: 
  - Advisory: Purple gradient (`from-purple-500 to-violet-600`)
  - Care: Rose/Pink gradient (`from-rose-500 to-pink-600`)
  - Emergency: Red gradient (`from-red-500 to-rose-600`)
- **Mobile z-index fix**: Panel now positioned at `z-[10000]` and `bottom-20` to avoid overlap with floating contact button
- **Chat features preserved**: Ask Mira, Plan My {Pillar}, quick prompts all working with voice

### Working Features ✅
- **Pillar-specific Mira with Voice**: MiraContextPanel on Advisory (purple), Care (pink), Emergency (red) pages with Pulse voice capabilities
- Product images loading from Shopify CDN
- Pulse voice assistant opens and processes commands
- Shop page displays products correctly
- Dining reservation form with WhatsApp field
- Service Desk ticket management
- Pet Soul Journey with animations
- Mobile bottom navigation

### Known Issues (P1-P2)
- **Paw Points Display**: Needs verification that loyalty_points shows correctly in all UI locations
- **Pulse Personalization**: Shows "your pet" when not logged in (expected behavior) - needs logged-in verification
- **WebSocket Instability**: Non-critical, deprioritized
- **Razorpay Payments**: Blocked - awaiting API keys

### Upcoming Tasks
1. Complete mobile UI transformation on Member Dashboard
2. Service Booking Flow mobile optimization
3. Implement Service Tab Wizard
4. Intelligent Shop Assistant with popups

### Backlog
- PDF Invoice Generation
- Centralized Item Intelligence Form
- WhatsApp Form Auto-population Audit
- Partner Portal for B2B clients
- Mira memory recall feature

---

## Test Credentials
- **Member**: test@petlifeos.com / test123 (owns pet "Mojo")
- **Admin**: aditya / lola4304

## Key Files
- `/app/frontend/src/components/MiraContextPanel.jsx` - Pillar-specific Mira with voice (Pulse) capabilities
- `/app/frontend/src/components/Pulse.jsx` - Voice assistant (DEPRECATED - now merged into MiraContextPanel)
- `/app/frontend/src/components/MiraAI.jsx` - Generic floating Mira AI (for non-pillar pages)
- `/app/frontend/src/pages/DinePage.jsx` - Dining & reservations
- `/app/frontend/src/pages/ShopPage.jsx` - Product shop
- `/app/backend/server.py` - Main API

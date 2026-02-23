# Mira Pet OS - Product Requirements Document (SSOT)
## Single Source of Truth - Last Updated: February 23, 2026

---

## ORIGINAL PROBLEM STATEMENT

**Mira** is a "pet operating system" centered around **Soul Intelligence** (a pet personality system) and an AI concierge. The goal is to move beyond standard e-commerce and create a high-touch, personalized experience where curated recommendations for products and services are dynamically generated based on a pet's unique soul profile.

**Core Vision**: "Mira is the Soul, the Concierge controls the experience, and the System is the capillary enabler."

**Key Principle**: Every concierge action must create a service desk ticket and trigger real-time notifications, capturing user intent and enabling a premium, consultative service model.

**Voice Configuration**: ElevenLabs Eloise (British English) with OpenAI TTS backup

---

## ✅ WHAT'S ALREADY BUILT

### CORE PLATFORM
| Feature | Status | Files |
|---------|--------|-------|
| Soul Intelligence System | ✅ COMPLETE | `canonical_answers.py`, `pet_score_logic.py` |
| Soul Score Engine (0-100%) | ✅ COMPLETE | `soul_first_logic.py` |
| Cross-pillar Memory | ✅ COMPLETE | `MiraChatWidget.jsx` |
| Multi-Pet Support | ✅ COMPLETE | `server.py` |

### MIRA AI ASSISTANT
| Feature | Status | Files |
|---------|--------|-------|
| Mira Chat Widget | ✅ COMPLETE | `MiraChatWidget.jsx` |
| Mira = Soul Mate Identity | ✅ COMPLETE | `MiraChatWidget.jsx` |
| Voice Input (ElevenLabs) | ✅ COMPLETE | `mira_voice.py` |
| Voice Output (TTS) | ✅ COMPLETE | `tts_routes.py` |
| Picks → Chat Flow | ✅ COMPLETE | `PersonalizedPicksPanel.jsx` |
| Soul-First Intelligence | ✅ COMPLETE | `mira_intelligence.py` |
| Quick Actions | ✅ COMPLETE | `MiraChatWidget.jsx` |

### REMINDER & NOTIFICATION SYSTEM
| Feature | Status | Files |
|---------|--------|-------|
| **Birthday Engine** | ✅ COMPLETE | `birthday_engine.py` |
| **Celebration Reminders** | ✅ COMPLETE | `server.py` (line 376+) |
| **Pet Pass Renewal Reminders** | ✅ COMPLETE | `renewal_reminders.py` |
| **Abandoned Cart Reminders** | ✅ COMPLETE | `cart_routes.py` |
| **Proactive Notifications** | ✅ COMPLETE | `proactive_notifications.py`, `mira_proactive.py` |
| **Push Notifications** | ✅ COMPLETE | `push_notification_routes.py` |
| **Notification Engine** | ✅ COMPLETE | `notification_engine.py` |
| **Realtime Notifications** | ✅ COMPLETE | `realtime_notifications.py` |
| **Mira Notifications** | ✅ COMPLETE | `mira_notifications.py` |

### SERVICE DESK & TICKETS
| Feature | Status | Files |
|---------|--------|-------|
| Universal Service Command | ✅ COMPLETE | `useUniversalServiceCommand.js` |
| Ticket Creation API | ✅ COMPLETE | `ticket_routes.py` |
| Ticket Intelligence | ✅ COMPLETE | `ticket_intelligence.py` |
| Admin Ticket Management | ✅ COMPLETE | Admin Dashboard |

### 13 PILLARS
| Pillar | Status | Route File |
|--------|--------|------------|
| Dine | ✅ GOLD STANDARD | `dine_routes.py` |
| Celebrate | ✅ GOLD STANDARD | `celebrate_routes.py` |
| Care | ✅ BUILT | `care_routes.py` |
| Stay | ✅ BUILT | `stay_routes.py` |
| Travel | ✅ BUILT | `travel_routes.py` |
| Learn | ✅ BUILT | `learn_os_routes.py` |
| Shop | ✅ BUILT | `shop_routes.py` |
| Play | ✅ BUILT | Backend |
| Adopt | ✅ BUILT | `adopt_routes.py` |
| Fit | ✅ BUILT | `fit_routes.py` |
| Enjoy | ✅ BUILT | `enjoy_routes.py` |
| Farewell | ✅ BUILT | `farewell_routes.py` |
| Emergency | ✅ BUILT | `emergency_routes.py` |

### ADMIN SYSTEM
| Feature | Status | Location |
|---------|--------|----------|
| Dashboard | ✅ COMPLETE | `/admin` |
| Members & Pets | ✅ COMPLETE | Admin |
| Reminders Management | ✅ COMPLETE | Admin > Mira & AI > Reminders |
| Communications | ✅ COMPLETE | Admin > Mira & AI > Communications |
| Proactive Campaigns | ✅ COMPLETE | Admin > Marketing > Proactive |
| Push Notifications | ✅ COMPLETE | Admin > Marketing > Push |

### UI/UX
| Feature | Status | Files |
|---------|--------|-------|
| Gold Standard Design | ✅ COMPLETE | `gold-standard.css` |
| Glassmorphism | ✅ COMPLETE | CSS |
| Bento Grid | ✅ COMPLETE | CSS |
| Haptic Feedback | ✅ COMPLETE | JS |

---

## CURRENT SESSION WORK (Feb 23, 2026)

### COMPLETED TODAY
| Task | Status |
|------|--------|
| /join Onboarding Bug | ✅ FIXED |
| Duplicate Soul Questions | ✅ FIXED |
| Picks → Chat Flow | ✅ FIXED |
| Mira = Soul Mate Identity | ✅ FIXED |
| Cross-Pillar Memory | ✅ DONE |
| Error Messages | ✅ FIXED |
| Backend pet_age Bug | ✅ FIXED |
| Comprehensive Audit | ✅ DONE |
| Full Roadmap | ✅ DONE |
| **Restaurant Search in Chat (P1)** | ✅ FIXED |
| **Dynamic Picks for All 15 Pillars** | ✅ DONE |
| **YouTube Videos on Learn Page** | ✅ VERIFIED WORKING |
| **Save to Favorites Feature** | ✅ BACKEND COMPLETE, UI ADDED |
| **FavoritesPanel Component** | ✅ CREATED |
| **Soul Score Display** | ✅ VERIFIED (88% on mira-demo) |

### Restaurant Search Fix Details (Feb 23, 2026 - Session 2)
**Problem**: When users asked "find me a pet-friendly restaurant in Mumbai", Mira asked for seating preference instead of showing results directly.

**Root Cause**: The `mira_routes.py` code was designed to ask clarifying questions (indoor/outdoor seating) before showing results. When the user explicitly provided a location, the code should skip this step.

**Fix Applied**:
1. Modified `mira_routes.py` to detect when user provides location explicitly
2. Added direct Google Places API lookup when location is available
3. Skip seating preference question - default to "either"
4. Return `nearby_places` data with restaurant results immediately
5. Also added Google Places fallback for stays/hotels and restaurants in the main chat flow

**Files Modified**:
- `/app/backend/mira_routes.py` (lines 13033-13130 - new direct search logic)

**Result**: Users now see restaurant cards with names, ratings, and "Reserve" buttons directly in the Mira chat widget when they search for restaurants.


### Celebrate Flow & Dynamic Picks Fix (Feb 23, 2026 - Session 2)
**Problem**: When users asked for "cake, photographer, presents" in the celebrate flow:
1. Picks panel showed garbage entries like "First question: Perfect for Mystique"
2. No dynamically generated picks based on user request
3. Generic ticket created without actionable items

**Root Cause**: 
1. The `picks_catalogue` MongoDB collection was empty (0 documents)
2. The Picks Engine was designed to look up static picks, but the system is meant to be **Concierge-driven** where picks are **dynamically generated** based on conversation intent
3. The `add_picks_to_response()` function was overwriting handler-set picks with empty Picks Engine results

**Fix Applied**:
1. Added new handler for `celebrate_stage == "execution"` that parses user requirements
2. Dynamically generates personalized picks for: cake, photographer, party favors, decorations, coordination
3. Modified `add_picks_to_response()` to preserve picks set by handlers (not overwrite with empty engine results)
4. Each pick is personalized with pet name, context-aware descriptions, and actionable CTAs

**Files Modified**:
- `/app/backend/mira_routes.py`:
  - Lines 13848-13990: New celebrate requirements handler
  - Lines 12032-12045: Modified `add_picks_to_response()` to preserve handler picks

**Result**: When user says "cake, photographer, presents", the picks panel now shows:
- 🎂 Custom Birthday Cake for {Pet} - [Design Cake]
- 📸 Pet Photography Session - [Book Session]  
- 🎁 Party Favors & Gift Bags - [Curate Selection]

**Architecture Note**: Picks are now **Concierge-curated in real-time** based on conversation intent, not looked up from a static catalogue. This aligns with the MIRA BIBLE principle: "Concierge creates and fills the picks as per the conversation."


### Save to Favorites Feature (Feb 23, 2026 - Session 3)
**Feature**: Users can save dynamically generated picks to their pet's profile for future reference.

**Components Added**:
1. **Backend API** (`/app/backend/favorites_routes.py`):
   - `GET /api/favorites/{pet_id}` - Get all favorites for a pet
   - `POST /api/favorites/add` - Add a pick to favorites
   - `POST /api/favorites/remove` - Remove a favorite
   - `GET /api/favorites/{pet_id}/summary` - Get favorites summary

2. **Backend Service** (`/app/backend/services/favorites_service.py`):
   - Complete favorites management logic
   - Pillar-based categorization
   - Duplicate detection

3. **Frontend FavoritesPanel** (`/app/frontend/src/components/Mira/FavoritesPanel.jsx`):
   - New component to display saved favorites
   - Grouped by pillar with color-coded badges
   - Remove functionality
   - Compact and full panel modes

4. **Integration with SoulKnowledgeTicker**:
   - Added FAVORITES section to expanded panel
   - Fetches favorites alongside "What Mira Knows" data
   - Shows saved picks count and preview

**Test Results**: All favorites API endpoints verified working (100% pass rate)


### YouTube Training Videos Verification (Feb 23, 2026 - Session 3)
**Issue Reported**: User reported Learn pillar not showing YouTube videos.

**Investigation Result**: YouTube section EXISTS and WORKS correctly. The section is positioned lower on the Learn page (requires scrolling down past the training categories).

**Features Verified**:
- 25+ YouTube video cards displaying
- Topic filters: Basic Training, Puppy Training, Behavior Fixes, Tricks & Fun, Leash Walking, Anxiety Help
- Breed-specific filter (e.g., "Shih Tzu Tips" for Mystique)
- API endpoints working: `/api/mira/youtube/by-topic`, `/api/mira/youtube/by-breed`


### Google Maps Issue Investigation (Feb 23, 2026 - Session 3)
**Issue Reported**: User reported "Google Maps blocked" on Dine page.

**Investigation Result**: No embedded Google Maps iframe found on Dine page. The page uses:
- Google Places API for data (working correctly)
- Links that open Google Maps in new tab when clicking on places
- NearbyPlacesCarousel component shows place cards, not embedded maps

**Conclusion**: This issue could not be reproduced. The reported "blocked" message may have been from a different context or browser extension.



---

## 🔴 P0 - NEXT PRIORITIES

| Task | Description | Already Have |
|------|-------------|--------------|
| Birthday Countdown on Dashboard | Show countdown widget | `birthday_engine.py` ready |
| Allergy Filter on Dine | Auto-filter by soul allergies | Soul data available |
| Connect Birthday Engine to UI | Surface existing backend to frontend | API exists |

---

## 🟠 P1 - IMPORTANT

| Task | Description |
|------|-------------|
| YouTube Videos (Celebrate/Dine) | Training/celebration content |
| Surface Reminders to Dashboard | Show upcoming reminders from backend |
| Grooming Scheduling UI | Connect to Care pillar |

---

## 🟡 P2 - ENHANCEMENT

| Task | Description |
|------|-------------|
| User-facing Analytics | "Mystique's favorites" |
| Activity Timeline | Pet activity log |
| Food Diary | Meal tracking |

---

## 🔵 P3 - BACKLOG

| Task | Description |
|------|-------------|
| Razorpay Checkout | Payment integration |
| Voice Commands | "Hey Mira" wake word |
| Calendar Sync | Google/Apple |

---

## INTEGRATIONS

### Active ✅
- OpenAI GPT (Mira AI)
- Google Places API (Restaurants, Hotels, Parks)
- MongoDB (Database)
- Cloudinary (Images)
- ElevenLabs (Voice TTS)
- OpenAI TTS (Backup)
- YouTube Data API (Training Videos)

### Pending Config ⚠️
- Resend (Domain verification needed)
- Gupshup (WhatsApp config needed)

### Planned 📋
- Razorpay
- Google Calendar

---

## KEY API ENDPOINTS

### Birthday/Reminders
```
GET  /api/birthday-engine/upcoming     - Get upcoming celebrations
GET  /api/birthday-engine/stats        - Birthday statistics
POST /api/birthday-engine/send-promotion/{pet_id}
POST /api/birthday-engine/send-bulk
```

### Proactive Notifications
```
GET  /api/mira/proactive/triggers
POST /api/mira/proactive/send
```

### Service Desk
```
POST /api/service-requests             - Create ticket
GET  /api/service-requests             - List tickets
```

---

## TEST CREDENTIALS

- **Member**: dipali@clubconcierge.in / test123
- **Admin**: aditya / lola4304

---

## DOCUMENTS

- `/app/memory/PRD.md` - This file (SSOT)
- `/app/memory/ROADMAP.md` - Full roadmap
- `/app/memory/AUDIT.md` - Feature audit
- `/app/memory/GAPS_AUDIT.md` - Gap analysis

---

*Mira is the Soul. The pet's soul grows with every interaction.* 🐾

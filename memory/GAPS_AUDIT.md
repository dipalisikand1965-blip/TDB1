# Mira Pet OS - Comprehensive Gaps Audit
## Page-by-Page Analysis (Dashboard → My Pets → Celebrate → Dine → Pillars → Mira Demo)
## Generated: February 23, 2026

---

## EXECUTIVE SUMMARY

This audit identifies gaps, missing features, and improvement opportunities across all major pages of the Mira Pet OS, prioritized for systematic implementation.

**Voice Configuration**: ElevenLabs Eloise (British English) with OpenAI TTS backup

---

## 1. DASHBOARD / PET HOME PAGE

**Current Route**: `/pet-home`, `/dashboard`

### What's Working ✅
- Pet card with photo and basic info
- Soul score display (circular progress)
- Quick action buttons
- Recent activity feed
- Pillar navigation
- Mira chat widget

### Gaps & Missing Features 🔴

| Gap | Priority | Description | Fix Complexity |
|-----|----------|-------------|----------------|
| **Birthday Alerts** | P0 | No proactive birthday countdown/reminders | Low |
| **Health Reminders** | P1 | No vaccination/vet visit reminders | Medium |
| **Soul Score Gamification** | P2 | No progress incentives to complete soul questions | Medium |
| **Personalized Tips** | P2 | No daily/weekly Mira tips based on soul | Medium |
| **Quick Actions Empty** | P1 | Quick actions sometimes show empty state | Low |
| **Recent Activity** | P2 | Shows limited activity, no ticket status | Low |
| **Multi-Pet Switching** | P1 | Switching between pets resets context | Medium |

### Voice Opportunities 🎙️
- "Good morning! Today is {pet}'s 87th day with you"
- Voice-triggered quick actions

---

## 2. MY PETS PAGE

**Current Route**: `/my-pets`

### What's Working ✅
- Pet list with photos
- Add new pet flow
- Edit pet basic info
- Soul score per pet

### Gaps & Missing Features 🔴

| Gap | Priority | Description | Fix Complexity |
|-----|----------|-------------|----------------|
| **Pet Comparison** | P3 | No side-by-side pet trait comparison | Medium |
| **Family Tree** | P3 | No multi-pet household relationships | High |
| **Pet Archive** | P2 | No way to archive/memorialize passed pets | Medium |
| **Soul Import/Export** | P3 | Can't export soul data for vet visits | Low |
| **Health Vault Access** | P1 | Health records not easily accessible | Low |
| **Activity History** | P2 | No comprehensive pet activity log | Medium |

---

## 3. CELEBRATE PAGE ⭐ (Priority Focus)

**Current Route**: `/celebrate`

### What's Working ✅
- Gold Standard UI (bento grid, glassmorphism)
- Personalized page titles ("Celebrate with {Pet}")
- Curated concierge cards
- Service request flow
- Birthday planning section

### Gaps & Missing Features 🔴

| Gap | Priority | Description | Fix Complexity |
|-----|----------|-------------|----------------|
| **YouTube Videos** | P1 | No celebration videos (API available but unused) | Medium |
| **Birthday Countdown Widget** | P0 | No visual countdown to upcoming birthday | Low |
| **Party Planning Wizard** | P2 | No step-by-step party planning flow | High |
| **Guest Management** | P2 | No invite/RSVP for pet playdates | High |
| **Photo Gallery** | P2 | No past celebration photos section | Medium |
| **Gift Registry** | P3 | No wish list for pet birthdays | High |
| **Calendar Sync** | P2 | No Google/Apple calendar integration | Medium |

### Voice Opportunities 🎙️
- "Would you like to plan {pet}'s birthday party?"
- Voice-guided party checklist

---

## 4. DINE PAGE ⭐ (Priority Focus - Should be 100%)

**Current Route**: `/dine`

### What's Working ✅
- Gold Standard UI
- Tab navigation (Fresh Meals, Treats, Chews, etc.)
- Dine essentials (17 products)
- Restaurant cards with Google Places
- Load More functionality
- CuratedConciergeSection

### Gaps & Missing Features 🔴

| Gap | Priority | Description | Fix Complexity |
|-----|----------|-------------|----------------|
| **Restaurant Search in Chat** | P0 | Results don't render properly in Mira chat | Medium |
| **Meal Planner** | P1 | No weekly/monthly meal planning | High |
| **Allergy Filter** | P0 | No automatic allergy-based filtering from soul | Medium |
| **Subscription Management** | P1 | No recurring order management UI | Medium |
| **Treats Calculator** | P2 | No daily treat limit calculator | Low |
| **Restaurant Reviews** | P2 | No user-generated pet-friendly reviews | High |
| **Food Diary** | P2 | No meal logging/tracking | Medium |
| **Nutrition Dashboard** | P2 | No nutritional analysis of current diet | High |

### Voice Opportunities 🎙️
- "What should {pet} eat today?"
- Voice ordering for regulars

---

## 5. OTHER PILLARS (Quick Audit)

### CARE (`/care`)
| Gap | Priority | Fix |
|-----|----------|-----|
| Grooming appointment scheduling | P1 | Medium |
| Vaccination tracker | P1 | Medium |
| Vet visit history | P1 | Medium |
| Health alerts from soul data | P2 | Medium |

### STAY (`/stay`)
| Gap | Priority | Fix |
|-----|----------|-----|
| Availability checker | P1 | High |
| Photo updates from boarding | P2 | High |
| Pickup/dropoff scheduling | P1 | Medium |

### TRAVEL (`/travel`)
| Gap | Priority | Fix |
|-----|----------|-----|
| Pet-friendly hotel search | P1 | Medium |
| Travel document checklist | P1 | Low |
| Flight rules by airline | P1 | Low |

### LEARN (`/learn`)
| Gap | Priority | Fix |
|-----|----------|-----|
| Training video library | P1 | Medium |
| Progress tracking | P2 | Medium |
| Trainer matching | P2 | High |

### SHOP (`/shop`)
| Gap | Priority | Fix |
|-----|----------|-----|
| Wishlist | P1 | Low |
| Price alerts | P2 | Medium |
| Soul-based recommendations | P1 | Medium |

---

## 6. MIRA DEMO PAGE

**Current Route**: `/mira-demo`

### What's Working ✅
- Basic chat interface
- Voice input (ElevenLabs/OpenAI)
- Quick prompts

### Gaps & Missing Features 🔴

| Gap | Priority | Description | Fix Complexity |
|-----|----------|-------------|----------------|
| **No Pet Context** | P0 | Demo doesn't show pet personalization | Low |
| **No Ticket Demo** | P0 | Doesn't demonstrate service flow | Low |
| **No Voice Demo** | P1 | Voice features not showcased | Medium |
| **No Picks Demo** | P1 | PersonalizedPicksPanel not shown | Low |
| **Sample Conversations** | P2 | No pre-loaded demo conversations | Low |

---

## 7. MIRA CHAT WIDGET (Global)

### What's Working ✅
- MiraOrb floating button
- Chat interface on all pages
- Voice input/output
- Quick actions
- Pet switching

### Gaps Just Fixed ✅
- ✅ Picks from panel now flow to chat
- ✅ "Ask Mira" button added to MiniCart

### Remaining Gaps 🔴

| Gap | Priority | Description | Fix Complexity |
|-----|----------|-------------|----------------|
| **Restaurant Results** | P0 | `nearby_places` not always rendering | Low |
| **Cross-Pillar Memory** | P1 | Context resets when switching pillars | Medium |
| **Message Persistence** | P2 | Messages lost on refresh | Medium |
| **Voice Commands** | P2 | No "Hey Mira" wake word | High |
| **Typing Indicators** | P3 | No animated typing indicator | Low |

---

## 8. PRIORITY IMPLEMENTATION ORDER

### Phase 1: Dine 100% Complete (This Week)
1. ✅ Fix Picks → Chat flow (DONE)
2. 🔲 Verify restaurant results render in chat
3. 🔲 Add allergy filter from soul data
4. 🔲 YouTube: "How to feed {pet}" videos

### Phase 2: Celebrate 100% Complete
1. 🔲 Birthday countdown widget
2. 🔲 YouTube: Celebration videos integration
3. 🔲 Party planning quick start

### Phase 3: Dashboard Enhancements
1. 🔲 Proactive birthday alerts
2. 🔲 Health reminders
3. 🔲 Daily Mira tips

### Phase 4: My Pets
1. 🔲 Health vault quick access
2. 🔲 Activity timeline

### Phase 5: Other Pillars
- Care → Stay → Travel → Learn → Shop

### Phase 6: Mira Demo
1. 🔲 Add pet context demo
2. 🔲 Show ticket creation flow
3. 🔲 Voice demo

---

## 9. VOICE CONFIGURATION

### Current Setup
- **Primary**: ElevenLabs Eloise (British English)
- **Fallback**: OpenAI TTS
- **Input**: Web Speech API + OpenAI Whisper

### Voice Enhancement Opportunities
| Feature | Effort | Impact |
|---------|--------|--------|
| Wake word "Hey Mira" | High | High |
| Voice shortcuts (order regular) | Medium | High |
| Voice navigation | Medium | Medium |
| Emotion detection in voice | High | Medium |

---

## 10. QUICK WINS (Can Do Today)

1. **Birthday Alert** - Check pet birthday in `PetHomePage`, show countdown if within 30 days
2. **Restaurant Render Fix** - Verify `nearbyPlaces` mapping in MiraChatWidget
3. **YouTube on Celebrate** - Add video carousel with hardcoded search terms
4. **Soul Progress Incentive** - Add "Complete your soul" prompt if < 80%

---

*This audit should be referenced when prioritizing feature development. Each gap has been assessed for business impact and implementation complexity.*

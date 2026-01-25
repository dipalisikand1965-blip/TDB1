# The Doggy Company - Product Requirements Document

## Original Problem Statement
Building **The Doggy Company**, a "Pet Life Operating System" designed as a pet-first platform. Core vision: "vision-first, commerce-later" approach, centered around "Pet Soul™" and "Mira® AI" concierge.

---

## Session 7: Major UX Consolidation (January 25, 2026) ✅

### NEW LOGO ✅
- **Design**: Teal serving cloche (concierge bell) with colorful paw print on top
- **Colors**: Purple, Pink, Orange, Green paw pads on teal bell
- **Text**: "the" (orange) + "doggy" (teal→purple gradient) + "company" (purple)
- **Tagline**: "Pet Concierge"
- **File**: `/app/frontend/public/logo-new.png`

### PET PHOTO CONSISTENCY ✅
- Created `/app/frontend/src/utils/petPhoto.js` utility
- Priority: 1. User uploaded photo → 2. Breed-matched stock photo → 3. Default dog
- Stock photos for 20+ breeds (Golden Retriever, Labrador, German Shepherd, Beagle, Pug, etc.)
- Used consistently across MyPets page

### CONSOLIDATED MY PETS PAGE ✅
- **Inline Quick Questions**: Answer Pet Soul questions directly on the page without navigating away
- **Quick Questions button** expands a section with 3 unanswered questions at a time
- **Options displayed as clickable buttons** for easy one-tap answering
- **Real-time score updates** when answers are saved
- **Full Journey link** for those who want the complete questionnaire experience

### PET SOUL SCORE LOGIC ✅
- **Total Questions**: 26 Pet Soul questions across 8 categories
- **Score Calculation**: `(answered_questions / 26) × 100`
- **Categories**: Identity, Family, Routine, Home, Travel, Taste, Training, Health
- **Backend Endpoint**: `POST /api/pets/{pet_id}/soul-answer` for saving individual answers
- **Score updates in real-time** as each question is answered

### MIRA CONVERSATION TRACKING ✅
- Conversations stored in `mira_tickets` collection
- Each session creates a ticket with full message history
- **Member can view**: Via `/api/mira/history` endpoint
- **Admin can view**: In Service Desk / Unified Inbox
- Conversations DO NOT directly increase Pet Soul score (answers must be explicit)

### CUSTOMER NAME CAPTURE ✅
- `extract_contact_info()` function extracts name/email/phone from messages
- Updates ticket `member` field when contact info detected
- Non-logged users start as "Website Visitor" instead of "Guest"

---

## Pet Pass System

### Plans
| Plan | Price | Duration |
|------|-------|----------|
| Pet Pass — Trial | ₹499 + GST | 1 month |
| Pet Pass — Foundation | ₹4,999 + GST | 12 months |
| Additional Pet | ₹2,499/year or ₹249/trial | Per pet |

### Member Tiers
| Tier | Emoji | Criteria |
|------|-------|----------|
| Curious Pup | 🐕 | New members |
| Loyal Companion | 🦮 | 2+ pillars OR 3+ months |
| Trusted Guardian | 🛡️ | 5+ pillars OR 6+ months |
| Pack Leader | 👑 | 8+ pillars OR 12+ months |

---

## 14 Life Pillars + 8 Pet Soul Pillars

### 14 Life Pillars (Services)
Feed, Celebrate, Dine, Stay, Travel, Care, Groom, Play, Train, Insure, Adopt, Farewell, Shop, Community

### 8 Pet Soul Pillars (Questionnaire Categories)
| Pillar | Key | Questions |
|--------|-----|-----------|
| Identity & Temperament | identity_temperament | Personality, energy, social |
| Family & Pack | family_pack | Bonds, other pets, kids |
| Rhythm & Routine | rhythm_routine | Schedule, feeding, exercise |
| Home Comforts | home_comforts | Favorite spots, alone time |
| Travel Style | travel_style | Car, carrier, new places |
| Taste & Treat | taste_treat | Food preferences, allergies |
| Training & Behaviour | training_behaviour | Commands, motivation |
| Long Horizon | long_horizon | Health, vet, grooming |

---

## Key Files Modified

| File | Changes |
|------|---------|
| `/frontend/public/logo-new.png` | New AI-generated logo |
| `/frontend/src/components/Logo.jsx` | Updated to use new logo image |
| `/frontend/src/utils/petPhoto.js` | NEW - Pet photo utility with breed fallbacks |
| `/frontend/src/pages/MyPets.jsx` | Added inline Quick Questions section |
| `/backend/server.py` | Added `POST /api/pets/{pet_id}/soul-answer` endpoint |
| `/backend/mira_routes.py` | Added contact extraction, name capture |

---

## Prioritized Backlog

### P0 - Critical (Completed ✅)
- ~~Session Persistence~~ ✅
- ~~Pet Photo Consistency~~ ✅
- ~~Logo Redesign~~ ✅
- ~~Inline Pet Soul Questions~~ ✅
- ~~Customer Name Capture~~ ✅

### P1 - High Priority
1. Complete 'Adopt' Pillar
2. Pet Pass Renewal email scheduling
3. Improve score display (show remaining questions count correctly)

### P2 - Medium Priority
1. "Untitled" Products from Shopify Sync
2. Build 'Farewell' and 'Shop' Pillars
3. Member Tier Graduation logic

### P3 - Lower Priority
1. WhatsApp Business API
2. Backend refactoring

---

## Test Credentials
- **Test User**: dipali@clubconcierge.in / lola4304
- **Admin**: aditya / lola4304

---

*Last updated: January 25, 2026*

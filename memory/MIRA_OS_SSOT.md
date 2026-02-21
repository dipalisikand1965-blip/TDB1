# MIRA OS - Single Source of Truth (SSOT)
## The Doggy Company Pet Operating System
**Last Updated:** February 21, 2026 (Session 2)  
**Live Site:** https://thedoggycompany.com  
**Preview:** https://pet-concierge-v2.preview.emergentagent.com

---

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Hidden Features Directory](#hidden-features-directory)
4. [API Reference](#api-reference)
5. [Data Models](#data-models)
6. [Admin Capabilities](#admin-capabilities)
7. [Integration Status](#integration-status)
8. [Feature Activation Guide](#feature-activation-guide)
9. [Debug & Testing Tools](#debug--testing-tools)
10. [Testing Credentials](#testing-credentials)
11. [Known Issues & Blockers](#known-issues--blockers)
12. [Enhancement Roadmap](#enhancement-roadmap)

---

## System Overview

MIRA OS is a sophisticated "Pet Operating System" built to provide personalized, soul-aware services for pets and their families. Named in honor of Dipali's grandmother, the system combines AI intelligence with comprehensive pet health management.

### Core Philosophy: Soul Intelligence
Every pet has a unique "soul" - their personality, preferences, health needs, and life story. MIRA learns this soul through:
- **Soul Builder**: 27-question weighted questionnaire measuring profile completeness
- **Conversations**: AI learns preferences through natural chat → writes to `learned_facts` array
- **Health Vault**: Comprehensive medical records and reminders
- **Life Timeline**: Capturing precious moments and milestones
- **Document Vault**: Secure storage for pet documents (paperwork pillar)

### The 15 Pillars of Pet Life
1. **Celebrate** - Birthdays, gotcha days, special occasions
2. **Care** - Health, grooming, wellness
3. **Dine** - Food, treats, nutrition
4. **Stay** - Boarding, hotels, pet sitting
5. **Travel** - Adventures, transportation
6. **Fit** - Exercise, weight management
7. **Learn** - Training, education
8. **Play** - Toys, entertainment
9. **Shop** - Products, accessories
10. **Emergency** - Urgent care, crisis support
11. **Paperwork** - Documents, registrations, Document Vault
12. **Advisory** - Expert consultations
13. **Adopt** - Adoption services
14. **Farewell** - End-of-life services
15. **Enjoy** - Fun activities, experiences

---

## Architecture

### Tech Stack
```
Frontend: React 18 + Tailwind CSS + Craco
Backend:  FastAPI (Python 3.11)
Database: MongoDB (Motor async driver)
Search:   Meilisearch
AI:       OpenAI GPT, Emergent LLM Key
TTS:      ElevenLabs + OpenAI fallback
Payments: Razorpay (pending integration)
Email:    Resend
```

### Directory Structure
```
/app/
├── backend/
│   ├── server.py           # Main app (15,000+ lines - needs refactoring)
│   ├── *_engine.py         # Feature engines (birthday, engagement, etc.)
│   ├── *_routes.py         # API route modules
│   ├── api/                # Additional API modules
│   ├── routes/             # More route modules
│   └── .env                # Backend secrets
├── frontend/
│   ├── src/
│   │   ├── pages/          # React pages
│   │   ├── components/     # UI components
│   │   └── services/       # API clients
│   └── .env                # Frontend config
└── memory/                 # Documentation
```

### Key Environment Variables
```env
# Backend (.env)
MONGO_URL=mongodb://localhost:27017
DB_NAME=pet_concierge
SECRET_KEY=<jwt-secret>
OPENAI_API_KEY=<key>
EMERGENT_LLM_KEY=<key>
ELEVENLABS_API_KEY=<key>
ADMIN_USERNAME=aditya
ADMIN_PASSWORD=lola4304

# Frontend (.env)
REACT_APP_BACKEND_URL=https://pet-concierge-v2.preview.emergentagent.com
```

---

## Hidden Features Directory

### FULLY ACTIVE Features

| Feature | Status | API Prefix | Description |
|---------|--------|------------|-------------|
| **Pet Vault** | ACTIVE | `/api/pet-vault/` | Complete health records system |
| **Birthday Engine** | ACTIVE | `/api/birthday-engine/` | Celebration detection & promotions |
| **Breed Knowledge** | ACTIVE | `/api/breed/` | Breed-specific tips & care guides |
| **Engagement Engine** | ACTIVE | `/api/engagement/` | Milestones, streaks, gamification |
| **Soul Intelligence** | ACTIVE | `/api/mira/` | AI personality understanding |
| **Life Timeline** | ACTIVE | `/api/pet-soul/profile/{id}/life-timeline` | Pet life events |
| **Mira Memories** | ACTIVE | `/api/mira/pet/{id}/memories` | AI memory storage |
| **Notification Engine** | ACTIVE | `/api/notifications/` | Multi-channel notifications |
| **Status Engine** | ACTIVE | `/api/status/` | Order/service status tracking |
| **Feedback Engine** | ACTIVE | `/api/feedback/` | Customer feedback collection |
| **Concierge Engine** | ACTIVE | `/api/concierge/` | Concierge request handling |

### Features Needing Activation

| Feature | File | Status | What's Needed |
|---------|------|--------|---------------|
| **WhatsApp Integration** | `whatsapp_routes.py` | BUILT | API keys from user |
| **Automated Reminders** | `renewal_reminders.py` | BUILT | Scheduler setup |
| **Email Reports** | `email_reports_engine.py` | BUILT | Resend API key |
| **TTS Voice** | `tts_routes.py` | PARTIAL | ElevenLabs credits |

### Hidden Admin Features

| Feature | Location | Description |
|---------|----------|-------------|
| **Product CRUD** | Admin > Products | Full create/edit/delete |
| **Service CRUD** | Admin > Services | Full create/edit/delete |
| **Experience CRUD** | Admin > Experiences | Full create/edit/delete |
| **Bundle CRUD** | Admin > Bundles | Full create/edit/delete |
| **Breed Tags** | `/api/admin/breed-tags/` | Breed-aware product tagging |
| **Bulk Operations** | Various `/api/admin/` | Mass updates |

---

## API Reference

### Authentication
```
POST /api/auth/login
  Body: {"email": "...", "password": "..."}
  Returns: {"access_token": "...", "user": {...}}

GET /api/pets/my-pets
  Headers: Authorization: Bearer <token>
  Returns: {"pets": [...]}
```

### Pet Vault (Health Records)
```
GET /api/pet-vault/{pet_id}/summary
  Returns: Complete health overview

GET /api/pet-vault/{pet_id}/vaccines
  Returns: Vaccination records

GET /api/pet-vault/{pet_id}/medications
  Returns: Current & past medications

GET /api/pet-vault/{pet_id}/vet-visits
  Returns: Vet visit history

POST /api/pet-vault/{pet_id}/vaccines
  Body: Vaccine data
  Returns: Created vaccine record
```

### Birthday Engine
```
GET /api/birthday-engine/stats
  Auth: Basic (admin)
  Returns: Celebration statistics

GET /api/birthday-engine/upcoming?days=30
  Auth: Basic (admin)
  Returns: Upcoming celebrations

POST /api/birthday-engine/send-promo
  Auth: Basic (admin)
  Body: {"pet_id": "...", "discount_percent": 15}
  Returns: Promo code & email status
```

### Breed Knowledge
```
GET /api/breeds
  Returns: List of all breeds (62 currently)

GET /api/breed/tips?breed=Shih+Tzu
  Returns: Breed-specific care tips

GET /api/breed/validate?breed=...
  Returns: Breed validation
```

### Engagement & Gamification
```
GET /api/engagement/milestones/{pet_id}
  Returns: Pet's achievement milestones

GET /api/engagement/streak/{user_id}
  Returns: User's engagement streak

POST /api/engagement/tips
  Auth: Admin
  Body: Tip data
  Returns: Created tip
```

### Soul & Personality
```
GET /api/pet-score/{pet_id}/score_state
  Returns: Soul score breakdown

GET /api/pet-soul/profile/{pet_id}/life-timeline
  Returns: Life events timeline

GET /api/mira/pet/{pet_id}/memories
  Returns: AI memories for pet
```

---

## Data Models

### Pet Document
```javascript
{
  "id": "pet-xxxx",
  "name": "Mystique",
  "breed": "Shih Tzu",
  "species": "dog",
  "owner_email": "dipali@clubconcierge.in",
  "birth_date": "2020-03-15",
  "gotcha_date": "2020-06-01",
  "overall_score": 87,  // Soul score %
  "score_tier": "soul_seeker",
  "doggy_soul_answers": {
    "food_allergies": "...",
    "temperament": "...",
    // 27 questions total
  },
  "vault": {
    "vaccines": [...],
    "medications": [...],
    "vet_visits": [...],
    "weight_history": [...],
    "documents": [...],
    "saved_vets": [...]
  },
  "celebrations": [
    {"occasion": "birthday", "date": "03-15", "is_recurring": true}
  ]
}
```

### User Document
```javascript
{
  "id": "user-xxxx",
  "email": "dipali@clubconcierge.in",
  "name": "Dipali",
  "membership_tier": "foundation",
  "pet_ids": ["pet-xxxx"],
  "loyalty_points": 500
}
```

### Product Document
```javascript
{
  "id": "prod-xxxx",
  "title": "Birthday Cake",
  "pillar": "celebrate",
  "category": "cakes",
  "tags": ["birthday-cake", "celebration"],
  "breed_tags": ["shih-tzu", "small-dogs"],
  "images": [{...}],
  "variants": [{...}],
  "status": "active"
}
```

---

## Admin Capabilities

### Access
- **URL**: /admin
- **Username**: aditya
- **Password**: lola4304

### Available Tabs
1. **Dashboard** - Overview & stats
2. **Products** - Full CRUD with image management
3. **Services** - Service catalog management
4. **Experiences** - Experience packages
5. **Bundles** - Product bundles
6. **Orders** - Order management
7. **Members** - User management
8. **Concierge** - Request queue
9. **Reports** - Analytics

### Admin API Endpoints
```
GET /api/admin/products
POST /api/admin/products
PUT /api/admin/products/{id}
DELETE /api/admin/products/{id}

GET /api/admin/services
POST /api/admin/services
PUT /api/admin/services/{id}
DELETE /api/admin/services/{id}

POST /api/admin/products/categorize
POST /api/admin/services/pillarize
POST /api/admin/products/diversify-images
```

---

## Integration Status

### Active Integrations
| Service | Status | Key Location |
|---------|--------|--------------|
| MongoDB | ACTIVE | Backend .env |
| OpenAI GPT | ACTIVE | Emergent LLM Key |
| Meilisearch | ACTIVE | Auto-configured |
| OpenWeather | ACTIVE | User key in .env |
| Google Places | ACTIVE | User key in .env |
| YouTube | ACTIVE | Embedded |

### Pending Integrations
| Service | Status | Blocker |
|---------|--------|---------|
| Razorpay | BUILT | Awaiting user keys |
| ElevenLabs | FALLBACK | User quota exceeded |
| WhatsApp | BUILT | Awaiting API keys |
| Resend Email | PARTIAL | Needs verification |

---

## Feature Activation Guide

### To Activate Birthday Promotions
1. Celebrations are auto-detected from pet `birth_date` and `celebrations` array
2. Use admin panel: GET `/api/birthday-engine/upcoming`
3. Send promos: POST `/api/birthday-engine/send-promo`

### To Activate WhatsApp
1. Obtain WhatsApp Business API credentials
2. Add to backend `.env`:
   ```
   WHATSAPP_PHONE_NUMBER_ID=<id>
   WHATSAPP_ACCESS_TOKEN=<token>
   ```
3. Restart backend

### To Seed Breed Tips
```bash
POST /api/engagement/seed-pillar-tips
Auth: Bearer <admin-token>
```

### To Enable Automated Reminders
1. Scheduler is built in `renewal_reminders.py`
2. Add cron job or enable APScheduler in server.py
3. Reminders pull from pet vault vaccination dates

---

## Debug & Testing Tools

### Debug Drawer (Proof Panel)
**URL**: Add `?debug=1` to any mira-demo URL
**Example**: `https://thedoggycompany.com/mira-demo?debug=1`

Shows:
- Raw API counts for each OS layer
- Icon state computations (OFF/ON/PULSE)
- Client vs Server state comparison
- Data flow verification

### What Mira Learned (MOJO Tab)
Located in the MOJO profile modal, shows:
- **learned_facts array**: Facts extracted from conversations
- **conversation_insights**: Pending insights awaiting user confirmation
- **ticket_learnings**: Data extracted from resolved service requests

### Document Vault
**Location**: Paperwork pillar page
**Components**: 
- `PaperworkPage.jsx` - Main page
- `DocumentsTab.jsx` - Documents listing
- `PaperworkManager.jsx` - Admin CRUD

---

## Testing Credentials

### Member Account
- **Email**: dipali@clubconcierge.in
- **Password**: test123

### Admin Account
- **Username**: aditya
- **Password**: lola4304

### Test Pet
- **Name**: Mystique
- **Breed**: Shih Tzu
- **Soul Score**: 87%
- **Pet Pass**: PP-MYS-2024

---

## Known Issues & Blockers

### Critical
1. **Screenshot Tool Blocked** - Platform media limit exceeded. Use testing agent or manual verification.

### Environment
1. **Production MongoDB** - Dev IP not whitelisted (expected, works in production)
2. **ElevenLabs Quota** - Falling back to OpenAI TTS (user needs credits)

### Code Quality
1. **server.py** - 15,000+ lines, needs refactoring into modules
2. **MiraDemoPage.jsx** - 3,500+ lines, needs component extraction
3. **Collection Fragmentation** - Multiple product/ticket collections

---

## Enhancement Roadmap

### P0 - Immediate
- [x] Fix ObjectId serialization in my-pets
- [x] Fix ObjectId serialization in /pets/{pet_id}
- [x] Verify Pet Vault functioning
- [x] Verify Birthday Engine
- [x] Create SSOT document
- [x] Soul Learning from Conversations → writes to learned_facts

### P1 - Near Term
- [ ] Activate WhatsApp (needs keys)
- [ ] Test Razorpay checkout (needs keys)
- [ ] Enable automated vaccination reminders
- [ ] Full mobile QA pass
- [ ] Debug drawer accessibility verification

### P2 - Future
- [ ] Refactor server.py into modules
- [ ] Consolidate database collections
- [ ] PWA implementation
- [ ] Product reviews with photos
- [ ] Pet health dashboard visualization

---

## Quick Commands

### Test My-Pets API
```bash
API_URL="https://pet-concierge-v2.preview.emergentagent.com"
TOKEN=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"dipali@clubconcierge.in","password":"test123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))")

curl -s "$API_URL/api/pets/my-pets" -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

### Test Pet Vault
```bash
curl -s "$API_URL/api/pet-vault/pet-3661ae55d2e2/summary" | python3 -m json.tool
```

### Test Birthday Engine
```bash
curl -s "$API_URL/api/birthday-engine/stats" -u "aditya:lola4304" | python3 -m json.tool
```

### Test Breed Tips
```bash
curl -s "$API_URL/api/breed/tips?breed=Shih%20Tzu" | python3 -m json.tool
```

---

## Document History

| Date | Author | Changes |
|------|--------|---------|
| 2026-02-21 | Agent | Initial SSOT creation |
| 2026-02-21 | Agent | Fixed ObjectId serialization, verified all hidden features |

---

**This document is the Single Source of Truth for MIRA OS. Keep it updated with every significant change.**

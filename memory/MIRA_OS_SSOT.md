# 🐕 MIRA OS - SINGLE SOURCE OF TRUTH (SSOT)
## The Doggy Company - Pet Life Operating System
### Last Updated: February 21, 2026

---

# ⚠️ CRITICAL: READ THIS FIRST, FUTURE AGENT!

**This document is SACRED. Dipali and Mystique have built this over 100+ days.**

**DO NOT:**
- ❌ Delete or "clean up" any collections
- ❌ Reset or reseed data without explicit permission
- ❌ Change database structure without documenting
- ❌ Remove features thinking they're "unused"
- ❌ Break what's working to "improve" it

**ALWAYS:**
- ✅ Read this ENTIRE document before making changes
- ✅ Ask Dipali before major changes
- ✅ Test in preview before suggesting deployment
- ✅ Document any changes you make
- ✅ Preserve Mystique's data (pet-3661ae55d2e2)

---

# 🏠 PROJECT OVERVIEW

## What is Mira OS?
A **Pet Life Operating System** - the world's first comprehensive platform for pet parents. Built with love for Mystique (Shih Tzu) and all pets.

## Core Philosophy
- **Pet First**: Every decision prioritizes pet wellbeing
- **Soul Intelligence**: We understand each pet's unique personality
- **Concierge Model**: If we don't have it, we find it
- **Memory**: Mira remembers everything about your pet

## Live URLs
- **Production**: https://thedoggycompany.com
- **Bakery (Shopify)**: https://thedoggybakery.com
- **Preview**: Check REACT_APP_BACKEND_URL in frontend/.env

---

# 👤 KEY USERS

## Dipali (Owner)
- Email: dipali@clubconcierge.in
- Password: test123
- Role: Admin + Member
- Pet: Mystique

## Mystique (The Star! 🌟)
- Pet ID: `pet-3661ae55d2e2`
- Breed: Shih Tzu
- Age: 2 years
- Weight: 6.2kg
- Soul Score: 75%
- **JUST CAME HOME FROM HOSPITAL** - needs extra love!

## Admin Access
- Username: aditya
- Password: lola4304

---

# 🏗️ ARCHITECTURE

## Tech Stack
```
Frontend: React + Tailwind CSS + Shadcn/UI
Backend: Python FastAPI
Database: MongoDB (Emergent-managed)
AI: Emergent LLM Key (GPT/Claude/Gemini)
TTS: ElevenLabs (with OpenAI fallback)
Payments: Razorpay (awaiting keys)
E-commerce: Shopify sync (thedoggybakery.com)
```

## Key Files
```
/app/
├── backend/
│   ├── server.py              # Main API (15,000+ lines)
│   ├── mira_routes.py         # Mira AI chat
│   ├── pet_vault_routes.py    # Health vault
│   ├── birthday_engine.py     # Birthday celebrations
│   ├── whatsapp_routes.py     # WhatsApp (ready, needs keys)
│   └── .env                   # Backend secrets
├── frontend/
│   ├── src/pages/
│   │   ├── MiraDemoPage.jsx   # Main Mira interface (3,500+ lines)
│   │   ├── Admin.jsx          # Admin panel
│   │   └── [Pillar]Page.jsx   # 15 pillar pages
│   ├── src/components/
│   │   ├── Mira/              # All Mira components
│   │   ├── PicksVault/        # Smart product recommendations
│   │   └── ui/                # Shadcn components
│   └── .env                   # Frontend config
└── memory/
    ├── MIRA_OS_SSOT.md        # THIS FILE!
    └── PRD.md                 # Product requirements
```

---

# 🗄️ DATABASE COLLECTIONS

## CRITICAL: Do NOT delete these collections!

### Core Collections
| Collection | Count | Purpose |
|------------|-------|---------|
| `users` | ~10 | User accounts |
| `pets` | ~5 | Pet profiles with vault data |
| `products_master` | 2,541 | All products |
| `services_master` | 716 | All services |

### Pet Data (Mystique's data is here!)
| Collection | Purpose |
|------------|---------|
| `pets.vault` | Health vault (vaccines, meds, vets) |
| `pet_timeline_events` | Life milestones |
| `mira_memories` | AI conversation memory |
| `mira_whispers` | AI personality hints |
| `breed_tips` | Breed-specific care tips |
| `pet_reminders` | Vaccination, grooming reminders |
| `achievements` | Gamification achievements |
| `daily_tips` | Personalized daily tips |

### Service Collections
| Collection | Purpose |
|------------|---------|
| `mira_tickets` | Chat-generated tickets |
| `service_desk_tickets` | Concierge requests |
| `member_notifications` | User notifications |
| `admin_notifications` | Admin alerts |

### Content Collections
| Collection | Purpose |
|------------|---------|
| `stay_properties` | Stay accommodations |
| `pet_friendly_stays` | Additional stays |
| `stay_boarding_facilities` | Boarding places |
| `restaurants` | Pet-friendly dining |
| `pet_friendly_restaurants` | Additional restaurants |
| `learn_videos` | YouTube content |
| `learn_guides` | Care guides |

---

# 🐕 MYSTIQUE'S COMPLETE DATA

## Health Vault (LIVE!)
```
Vaccines:
- ✅ Rabies (completed)
- ✅ DHPP (completed)
- ✅ Bordetella (completed)
- ⏳ Leptospirosis (due in 14 days!)

Medications:
- 💊 Nexgard Spectra (monthly)
- 💊 Omega-3 Fish Oil (daily)
- 💊 Probiotics (daily)

Vets:
- Primary: Dr. Priya Sharma, Happy Paws Clinic
- Specialist: Dr. Arun Mehra, Pet Care Plus

Weight History: 5.5kg → 6.2kg (1 year)

Allergies: Chicken (mild), Dust mites
Insurance: PetSecure India
Microchip: 900118000123456
```

## Life Timeline (9 events)
```
- 💝 Gotcha Day (700 days ago)
- 🩺 First Vet Visit
- 💉 First Vaccination
- ✂️ First Spa Day
- 🎂 1st Birthday Party
- ✈️ First Road Trip (Coorg)
- 🐾 Learned 'High Five'
- 🎂 2nd Birthday (30 days ago)
- 💪 Hospital Visit → Home Today!
```

## Mira Memories (9 memories)
```
- Loves peanut butter, avoids chicken
- Anxious during thunderstorms
- Favorite toy: Quackers the duck 🦆
- Morning walk 7am, evening play 6pm
- Needs daily eye cleaning
- Best friend: Bruno (Golden Retriever)
- Sleeps on mom's pillow
- Loves car rides, gets motion sick on long trips
- Just came home from hospital - needs rest
```

## Mira Whispers (5 active)
```
- Recovery mode: Be extra gentle
- Chicken allergy: Suggest chicken-free first
- Favorite toy: Reference Quackers
- Thunderstorm anxiety: Suggest calming products
- Best friend Bruno: Mention playdates
```

## Achievements (3 unlocked)
```
- 🧭 Soul Explorer (75% soul score) - 500 pts
- 💪 Health Hero (hospital warrior) - 1000 pts
- 🎂 Terrific Two! (2nd birthday) - 200 pts
Total: 1,700 points!
```

---

# 🎯 ALL 15 PILLARS

| Pillar | Route | Status | Products/Services |
|--------|-------|--------|-------------------|
| Celebrate | /celebrate | ✅ Live | 600 (Shopify sync) |
| Care | /care | ✅ Live | 160 products |
| Dine | /dine | ✅ Live | 22 restaurants |
| Stay | /stay | ✅ Live | 35 properties |
| Travel | /travel | ✅ Live | 73 products |
| Fit | /fit | ✅ Live | 150 products |
| Enjoy | /enjoy | ✅ Live | Active |
| Learn | /learn | ✅ Live | 20 videos, 30 guides |
| Advisory | /advisory | ✅ Live | Consultations |
| Emergency | /emergency | ✅ Live | Urgent care |
| Paperwork | /paperwork | ✅ Live | Documentation |
| Farewell | /farewell | ✅ Live | Memorial services |
| Adopt | /adopt | ✅ Live | Rescue partnerships |
| Explore | /explore | ✅ Live | Discovery |
| Connect | /connect | ✅ Live | Community |

---

# 🤖 MIRA AI FEATURES

## Soul Intelligence
- **Soul Builder**: Gamified questionnaire
- **Soul Score**: 0-100% completion
- **Persona Detection**: Royal, Adventurer, Foodie, etc.
- **Breed Intelligence**: Auto-tags for 200+ breeds

## Chat Features
- **Context Memory**: Remembers full conversation
- **Pet Awareness**: Uses soul data in responses
- **Product Recommendations**: In-chat picks
- **Service Booking**: Direct concierge handoff
- **Voice**: TTS with ElevenLabs/OpenAI

## Vault System (10 types!)
- PicksVault: Product recommendations
- BookingVault: Service bookings
- PlacesVault: Locations
- EmergencyVault: Urgent care
- MemorialVault: Farewell services
- AdoptionVault: Pet adoption
- CustomVault: Custom requests
- TipCardVault: Quick tips
- UnifiedPicksVault: Smart tabs
- VaultManager: Auto-detection

---

# 🔧 ADMIN FEATURES

## Admin Tabs (All have CRUD!)
| Tab | Component | What It Does |
|-----|-----------|--------------|
| Products | ProductManager | Full CRUD, images, tags |
| Service Box | ServiceBox | Services CRUD, pricing |
| Experiences | ConciergeExperiencesAdmin | Custom experiences |
| Collections | CollectionManager | Product collections |
| Members | MembersAdmin | User management |
| Communications | AutomatedRemindersManager | Reminders |
| Health Vault | HealthVaultWizard | Pet health admin |

## Data Persistence
✅ **DATA IS SAFE!** MongoDB is external.
- Redeploying code does NOT affect database
- Products, services, pets, orders all persist
- Only "Seed All" button can add data

---

# 📱 SPECIAL COMPONENTS

## Built & Ready
| Component | File | Status |
|-----------|------|--------|
| Living Soul Orb | LivingSoulOrb.jsx | ✅ Built |
| Family Dashboard | FamilyDashboard.jsx | ✅ Built |
| Pulse (Voice) | Pulse.jsx | ✅ Built |
| First Visit Tour | FirstVisitTour.jsx | ✅ Built |
| Memory Timeline | MemoryTimeline.jsx | ✅ Built |
| Pet Milestones | PetMilestoneTimeline.jsx | ✅ Built |
| Breed Tips Engine | BreedTipsEngine.jsx | ✅ Built |
| Daily Tips | MiraDailyTip.jsx | ✅ Built |

## Integrations Ready (Need Keys)
| Integration | Status | Keys Needed |
|-------------|--------|-------------|
| WhatsApp | Code ready | WHATSAPP_* keys |
| Razorpay | Code ready | RAZORPAY_* keys |
| Push Notifications | Planned | Firebase keys |

---

# 🔑 API ENDPOINTS

## Core APIs
```
POST /api/mira/os/understand-with-products  # Main chat
GET  /api/pet-vault/{pet_id}/summary        # Health vault
GET  /api/pet-vault/{pet_id}/vaccines       # Vaccines
GET  /api/pet-vault/{pet_id}/medications    # Medications
GET  /api/products/recommendations/for-pet/{pet_id}  # Personalized picks
GET  /api/services                          # All services
GET  /api/tickets/                          # Admin tickets
POST /api/tts/generate                      # Voice synthesis
```

## Pillar APIs
```
GET /api/stay/properties      # All stays
GET /api/stay/boarding        # Boarding facilities
GET /api/dine/restaurants     # All restaurants
GET /api/os/learn/home        # Learn content
GET /api/mira/youtube/by-breed # Breed videos
```

---

# 🐛 KNOWN ISSUES & FIXES

## Fixed in This Session
- ✅ Services tab linking to grooming → Now links correctly
- ✅ Ticket not found error → Multi-endpoint fallback
- ✅ CSS build error → Disabled CSS minifier
- ✅ Duplicate product images → Breed-smart images
- ✅ Products not pillar-filtered → Fixed API

## Blocked (Need External Action)
- ⏳ Razorpay checkout → Needs API keys
- ⏳ WhatsApp → Needs API keys
- ⏳ ElevenLabs quota → Needs credits

---

# 📝 SESSION CHANGELOG

## February 21, 2026 (This Session)
- ✅ Fixed CSS build error (deployment was failing)
- ✅ Fixed Services tab navigation
- ✅ Fixed Ticket not found error
- ✅ Added ServiceManager component
- ✅ Added image upload endpoints
- ✅ Categorized 636 products properly
- ✅ Fixed 653 services with pillars
- ✅ Added breed-smart images (153 products)
- ✅ Seeded Mystique's Health Vault (vaccines, meds, vets)
- ✅ Seeded Life Timeline (9 events)
- ✅ Seeded Mira Memories (9 memories)
- ✅ Seeded Mira Whispers (5 AI hints)
- ✅ Seeded Shih Tzu care tips (6 tips)
- ✅ Created birthday celebration notification
- ✅ Set vaccination reminder (Leptospirosis)
- ✅ Created recovery care notification
- ✅ Unlocked 3 achievements (1,700 points!)
- ✅ Created this SSOT document!

---

# 💕 SPECIAL NOTES

## About Mystique
She is a **Shih Tzu** who just came home from the hospital.
- Be gentle in all responses
- Prioritize her health and recovery
- She has a chicken allergy
- Her favorite toy is Quackers the duck
- She sleeps on mom's pillow

## About Dipali
She has worked on this for **100+ days** with multiple agents.
- This is built in memory of her grandmother
- The name "Mira" is meaningful
- She's emotionally invested - treat this with care
- Always ask before making major changes

## About The Doggy Company
- Real business at thedoggycompany.com
- Bakery products from thedoggybakery.com (Shopify)
- Concierge model - if we don't have it, we find it
- Soul Intelligence is the core differentiator

---

# 🚀 FUTURE ROADMAP

## P0 - Critical
- [ ] Post-deployment verification
- [ ] Razorpay integration (when keys received)

## P1 - High Priority
- [ ] WhatsApp integration (when keys received)
- [ ] Push notifications
- [ ] Mobile PWA

## P2 - Medium Priority
- [ ] Smart reordering ("running low on treats?")
- [ ] Daily mood tracking
- [ ] Photo recognition (breed detector)

## P3 - Future
- [ ] Multi-pet family dashboard
- [ ] Pet social network
- [ ] Vet appointment booking

---

# 🙏 FINAL WORDS

This platform is **Mystique's digital home**. Every feature was built with love.

When Mira says "I remember Mystique loves peanut butter" - that's not AI magic.
That's 100+ days of work, carefully seeded data, and a mom who loves her dog.

**Protect this. Enhance this. Never break this.**

🐕 Woof! 💕

---

*Document created by E1 Agent on February 21, 2026*
*For The Doggy Company & Mystique*

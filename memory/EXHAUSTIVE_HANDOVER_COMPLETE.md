# MIRA OS - EXHAUSTIVE COMPLETE HANDOVER DOCUMENT
## For Next Agent - Read EVERYTHING Before Writing ANY Code
### Generated: February 13, 2026

---

# PART 1: THE ESSENCE - WHAT YOU MUST UNDERSTAND

## 1.1 THE ONE-LINE TRUTH
**Mira OS is NOT a chatbot. It is the World's First Pet Operating System.**

Mira is an identity-first intelligence system that:
```
KNOWS the pet → UNDERSTANDS the pet → GUIDES decisions → EXECUTES actions
```

## 1.2 THE 5 NON-NEGOTIABLE PRINCIPLES

### 1. Pet First. Always.
- Everything starts from the pet identity
- Nothing is generic
- Nothing assumes from breed
- If the pet is not understood → system must ask

### 2. Identity Before Action
```
MOJO (Identity)
      ↓
   Context
      ↓
   Decision
      ↓
  Execution
```

### 3. Memory is the Product
- Memory is NOT a feature. **Memory = the product**
- Every interaction improves the system
- If Mira asks for information that exists → SYSTEM FAILURE

### 4. Concierge Intelligence, Not Search Results
- We never return lists
- We return filtered choices, curated actions, personalized reasoning

### 5. Execution, Not Information
- Information alone is incomplete
- Mira must always move toward: arrange, schedule, coordinate, confirm, execute

---

# PART 2: CREDENTIALS & ACCESS

## 2.1 Test Credentials
| Role | Email/Username | Password |
|------|---------------|----------|
| **Test User** | dipali@clubconcierge.in | test123 |
| **Admin Panel** | aditya | lola4304 |

## 2.2 URLs
| Environment | URL |
|-------------|-----|
| **Preview** | https://dine-layout-update.preview.emergentagent.com |
| **Main Demo Page** | /mira-demo |
| **Admin Panel** | /admin |
| **Dashboard** | /dashboard |

## 2.3 Test Pets (User: dipali@clubconcierge.in)
| Pet Name | Pet ID | Soul Score | Breed |
|----------|--------|------------|-------|
| Lola | pet-e6348b13c975 | 44% | Maltese |
| Mystique | pet-3661ae55d2e2 | 72% | Shih Tzu |
| Bruno | pet-69be90540895 | 29% | Labrador |
| Luna | pet-6f0827e97e56 | 88% | Golden Retriever |
| Buddy | pet-buddy123 | 41% | Golden Retriever |
| Meister | pet-meister | 23% | Shih Tzu |
| TestScoring | pet-test | 100% | Test |

## 2.4 API Base URL
```
REACT_APP_BACKEND_URL=https://dine-layout-update.preview.emergentagent.com
```

---

# PART 3: THE 7 OS LAYERS (NAVIGATION TABS)

Users navigate by OS layers, NOT features.

| Tab | Layer Type | What It Is | What It Contains |
|-----|------------|------------|------------------|
| **MOJO** | Identity Layer | Pet's Passport/DNA | Soul answers (55+), traits, health vault, documents |
| **TODAY** | Time Layer | What needs attention NOW | Due/overdue, upcoming, risk alerts, active tasks |
| **PICKS** | Intelligence Layer | Personalized recommendations | 6-10 items per refresh, catalogue + concierge picks |
| **SERVICES** | Execution Layer | Where coordination happens | Task inbox, order tracking, service cards |
| **INSIGHTS** | Pattern Layer | Long-term intelligence | Trends, risk scores, spending patterns |
| **LEARN** | Knowledge Layer | Education | Bite-sized guides, breed info, first aid |
| **CONCIERGE** | Human Layer | Escalation | WhatsApp, email, document upload, human help |

### Critical Rule
**Tabs are OS layers. Pillars are the taxonomy underneath.**

---

# PART 4: THE 14 PILLARS (CLASSIFICATION SYSTEM)

Pillars are NOT navigation. They classify intent.

| # | Pillar | Purpose |
|---|--------|---------|
| 1 | Celebrate | Birthdays, parties, occasions |
| 2 | Dine | Pet-friendly restaurants |
| 3 | Stay | Boarding, daycare, pet hotels |
| 4 | Travel | Pet relocation, documentation |
| 5 | Care | Veterinary, grooming, health |
| 6 | Enjoy | Toys, accessories, enrichment |
| 7 | Fit | Exercise, swimming, training |
| 8 | Learn | Training courses, behavior |
| 9 | Shop Assist | Pet supplies, food, treats |
| 10 | Advisory | Legal advice, insurance |
| 11 | Emergency | 24/7 emergency care |
| 12 | Paperwork | Registration, licenses |
| 13 | Club | Membership benefits |
| 14 | Unique | Special/custom requests |

---

# PART 5: DATABASE SCHEMA

## 5.1 Key Collections
| Collection | Purpose | Doc Count |
|------------|---------|-----------|
| users | User accounts | 51 |
| pets | Pet profiles | 58 |
| products_master | Product catalog | 2,214 |
| services_master | Service catalog | 2,406 |
| mira_memories | Mira's long-term memory | 159 |
| conversation_memories | Chat-extracted data | 20 |
| pillar_requests | Service requests | 537 |
| service_desk_tickets | Support tickets | 3,077 |
| paw_points_ledger | Points transactions | 22 |
| soul_answers_versioned | Answer history | 168 |

## 5.2 users Collection Schema
```javascript
{
  id: "uuid",
  email: "string",
  name: "string",
  phone: "string",
  membership_tier: "explorer|trial|founder|pawsome",
  loyalty_points: 1790,
  lifetime_points_earned: 1290,
  credited_achievements: ["soul_starter", "soul_seeker", ...],
  pet_ids: ["pet-id-1", "pet-id-2"],
  communication_preferences: {
    email: true,
    whatsapp: true,
    sms: false
  }
}
```

## 5.3 pets Collection Schema
```javascript
{
  id: "pet-uuid",
  user_id: "user-uuid",
  owner_email: "string",
  name: "string",
  breed: "string",
  species: "dog",
  gender: "male|female",
  birth_date: "string",
  weight_kg: number,
  photo_url: "string",
  
  // Soul Questions Answers
  doggy_soul_answers: {
    temperament: "Playful",
    energy_level: "High energy",
    food_allergies: ["chicken", "beef"],
    diet_type: "kibble",
    // ... all 55+ questions
  },
  
  // Scores
  overall_score: 44.0,
  folder_scores: {
    identity_personality: 60,
    social_world: 40,
    // ... per folder
  },
  score_tier: "soul_seeker",
  
  // Soul enrichment from conversations
  soul_enrichment_categories: ["health", "diet"],
  enrichment_history: [{
    field: "food_allergies",
    value: ["chicken", "beef"],
    source: "user-stated",
    confidence: "high",
    timestamp: "2026-02-13T..."
  }],
  
  // Health
  health: {},
  health_vault: {},
  vaccinations: []
}
```

---

# PART 6: API ENDPOINTS REFERENCE

## 6.1 Authentication
```
POST /api/auth/login
Body: { "email": "...", "password": "..." }
Response: { "access_token": "...", "user": {...} }
```

## 6.2 Pets
```
GET /api/pets                          # All user's pets
GET /api/pets/{pet_id}                 # Single pet
GET /api/pet-soul/profile/{pet_id}     # Complete soul profile
```

## 6.3 Pet Soul
```
POST /api/pet-soul/profile/{pet_id}/answers/bulk   # Save bulk answers
POST /api/paw-points/sync-achievements             # Award badges
GET /api/mira/personalization-stats/{pet_id}       # Soul score stats
```

## 6.4 Mira AI
```
POST /api/mira/chat                    # Chat with Mira
GET /api/mira/pet/{pet_id}/what-mira-knows  # Soul knowledge
```

## 6.5 Member
```
GET /api/member/profile?user_email=X   # Member profile with points/badges
```

---

# PART 7: TWO-WAY MEMORY-SOUL SYNC (CRITICAL IMPLEMENTATION)

## 7.1 What It Is
When users chat with Mira, the system:
1. **Extracts** intelligence from conversation (allergies, preferences, behaviors)
2. **Maps** to canonical `doggy_soul_answers` fields
3. **Writes** to pet profile
4. **Recalculates** Soul Score
5. **Awards** badges/paw points if thresholds crossed

## 7.2 How It Works

### Direction 1: Soul → Mira (Reading)
- When Mira responds, she reads `pets.doggy_soul_answers`
- Uses `soul_first_logic.py` to build pet context
- Personalizes all responses based on soul data

### Direction 2: Mira → Soul (Writing) ✅ IMPLEMENTED
- When user tells Mira "Lola is allergic to chicken and beef"
- `extract_soul_data_from_response()` extracts the data
- `write_soul_data_to_pet()` saves to `doggy_soul_answers`
- `recalculate_pet_soul_score()` updates the score
- Achievement sync runs to award badges

## 7.3 Key Files
| File | Purpose |
|------|---------|
| `/app/backend/soul_first_logic.py` | `write_soul_data_to_pet()`, `recalculate_pet_soul_score()` |
| `/app/backend/mira_routes.py` | Chat endpoint, `extract_soul_data_from_response()` |
| `/app/backend/pet_soul_routes.py` | Soul questions, score calculation |
| `/app/backend/paw_points_routes.py` | Achievement sync |

## 7.4 Extraction Patterns
| Data Type | Example Phrases |
|-----------|-----------------|
| Allergies | "allergic to", "can't eat", "sensitive to" |
| Diet | "eats kibble", "raw diet", "home cooked" |
| Health | "has arthritis", "hip dysplasia", "diabetes" |
| Behavior | "anxious", "reactive", "calm", "playful" |
| Grooming | "long coat", "hates grooming", "salon" |

## 7.5 Verified Working
- Lola's score: 34% → 44% after chat message
- Data extracted: `food_allergies = ["chicken", "beef"]`
- Achievement toast: "Soul Seeker - Lola has reached 25% Soul completion"
- Test Report: `/app/test_reports/iteration_176.json` - 100% pass rate

---

# PART 8: FRONTEND ARCHITECTURE

## 8.1 Key Pages
| Page | File | URL |
|------|------|-----|
| Main Demo | `MiraDemoPage.jsx` | /mira-demo |
| Dashboard | `MemberDashboard.jsx` | /dashboard |
| Backup (DO NOT USE) | `MiraDemoBackupPage.jsx` | /mira-demobackup |

## 8.2 Key Components
| Component | File | Purpose |
|-----------|------|---------|
| PetOSNavigation | `components/Mira/PetOSNavigation.jsx` | 7-layer OS navigation |
| MojoProfileModal | `components/Mira/MojoProfileModal.jsx` | Pet identity layer |
| SoulFormModal | `components/Mira/SoulFormModal.jsx` | Soul questionnaire |
| WeatherCard | `components/Mira/WeatherCard.jsx` | Walk safety |
| ProactiveAlertsBanner | `components/Mira/ProactiveAlertsBanner.jsx` | Today alerts |
| SoulKnowledgeTicker | `components/Mira/SoulKnowledgeTicker.jsx` | What Mira knows |

## 8.3 UI Library
- **Primary**: Shadcn/UI from `/app/frontend/src/components/ui/`
- **Icons**: Lucide React
- **Toasts**: Sonner

---

# PART 9: BACKEND ARCHITECTURE

## 9.1 Key Files
| File | Lines | Purpose |
|------|-------|---------|
| `mira_routes.py` | 20,000+ | Main Mira chat, product search |
| `soul_first_logic.py` | 1,500+ | Pet context building, score recalc |
| `pet_soul_routes.py` | 600+ | Soul questions, answers |
| `paw_points_routes.py` | 400+ | Points, achievements |
| `mira_memory.py` | 400+ | Memory storage/retrieval |
| `member_logic_config.py` | 300+ | Badge/reward rules |

## 9.2 Services
| Service | Port | Process |
|---------|------|---------|
| Backend | 8001 | uvicorn via supervisor |
| Frontend | 3000 | yarn start via supervisor |
| MongoDB | MONGO_URL | Cloud hosted |

## 9.3 Supervisor Commands
```bash
sudo supervisorctl status                  # Check status
sudo supervisorctl restart backend         # Restart backend
sudo supervisorctl restart frontend        # Restart frontend
tail -50 /var/log/supervisor/backend.err.log  # View backend logs
tail -50 /var/log/supervisor/frontend.err.log # View frontend logs
```

---

# PART 10: GAMIFICATION SYSTEM

## 10.1 Soul Score Tiers
| Tier | Name | Min % | Max % |
|------|------|-------|-------|
| curious_pup | Curious Pup | 0 | 24 |
| soul_seeker | Soul Seeker | 25 | 49 |
| trusted_guardian | Trusted Guardian | 50 | 74 |
| soul_master | Soul Master | 75 | 100 |

## 10.2 Achievement Badges
| Badge | Points | Requirement |
|-------|--------|-------------|
| soul_starter | 50 | Complete 5 questions |
| soul_seeker | 100 | Complete 10 questions |
| soul_explorer | 150 | Complete 15 questions |
| soul_guardian | 200 | Complete 20 questions |
| photo_uploaded | 25 | Upload pet photo |
| multi_pet | 100 | Register 2+ pets |

## 10.3 Paw Points Earning
| Action | Points |
|--------|--------|
| Soul Question Answered | 10 |
| First Order | 100 |
| Referral | 500 |
| Review | 25 |
| Product Purchase | 5% of value |

---

# PART 11: MEMORY FILES INDEX

## Must-Read Files (In Order)
1. `/app/memory/MIRA_OS_PRODUCT_DOCTRINE.md` - Complete Product Doctrine
2. `/app/memory/MIRA_BIBLE.md` - How Mira Behaves
3. `/app/memory/COMPLETE_SYSTEM_BIBLE.md` - Full Technical Architecture
4. `/app/memory/PRD.md` - Current Implementation Status
5. `/app/memory/DATA_SYNC_ARCHITECTURE.md` - How Data Flows

## Other Important Files
| File | Purpose |
|------|---------|
| `/app/memory/PET_SOUL_GAMIFICATION_VAULT.md` | Gamification details |
| `/app/memory/MIRA_CONVERSATION_RULES.md` | How Mira speaks |
| `/app/memory/MIRA_OS_HEADER_ARCHITECTURE.md` | Navigation design |
| `/app/memory/ADMIN_GUIDE.md` | Admin panel guide |

---

# PART 12: CURRENT STATE & NEXT TASKS

## 12.1 What's Complete ✅
- [x] Pet OS Navigation (7 layers)
- [x] MOJO Profile Modal (11 sections)
- [x] Dynamic Soul Score updates
- [x] Achievement system with badges
- [x] Paw Points integration
- [x] Two-Way Memory-Soul Sync
- [x] Weather Card integration
- [x] Proactive Alerts Banner
- [x] WhyForPet personalization badges

## 12.2 P1 - Next Tasks
- [ ] MOJO Modal Phase 2: Drill-in editing for each section
- [ ] OS Tab Content: Build PICKS, SERVICES, INSIGHTS, LEARN tabs

## 12.3 P2 - Known Issues
- [ ] Orders API returns 405 error
- [ ] Markdown in chat doesn't render as HTML

## 12.4 Future/Backlog
- [ ] Port Daily Digest from backup page
- [ ] Decommission MiraDemoBackupPage.jsx
- [ ] Refactor monolithic mira_routes.py
- [ ] Mobile UX verification

---

# PART 13: TESTING

## 13.1 Test Reports
- Latest: `/app/test_reports/iteration_176.json`
- Result: **100% pass rate** (16/16 backend, all frontend)

## 13.2 Manual Test Commands
```bash
# Login
API_URL=$(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d '=' -f2)
TOKEN=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"dipali@clubconcierge.in","password":"test123"}' \
  | python3 -c "import sys,json;print(json.load(sys.stdin).get('access_token',''))")

# Get pets
curl -s -X GET "$API_URL/api/pets" -H "Authorization: Bearer $TOKEN"

# Get pet soul profile
curl -s -X GET "$API_URL/api/pet-soul/profile/pet-e6348b13c975" \
  -H "Authorization: Bearer $TOKEN"

# Chat with Mira
curl -s -X POST "$API_URL/api/mira/chat" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"Lola loves playing fetch","pet_context":{"id":"pet-e6348b13c975","name":"Lola"}}'
```

---

# PART 14: COMMON ISSUES & FIXES

## 14.1 Page Shows Only Footer
- Check URL for double slashes (`//mira-demo` vs `/mira-demo`)
- Hard refresh: Ctrl+Shift+R or Cmd+Shift+R
- Check browser console for errors

## 14.2 Backend Not Starting
```bash
tail -100 /var/log/supervisor/backend.err.log
```
Look for: import errors, missing dependencies

## 14.3 Frontend Build Fails
```bash
cd /app/frontend && yarn build 2>&1 | tail -50
```

## 14.4 Score Not Updating
- Check `soul_first_logic.py` for `recalculate_pet_soul_score()` function
- Verify `write_soul_data_to_pet()` is being called in chat endpoint

---

# PART 15: THE MIRA ESSENCE

## How Mira Should Feel
- **Known**: Mira remembers everything
- **Guided**: Clear next actions
- **Safe**: Never sold to
- **One step away**: From execution

## How Mira Speaks
- Specific over vague
- Two options over open-ended
- Calm certainty, no "maybe" hedging
- No marketplace tone
- **Never asks for data that exists in Pet Soul**

## The One-Liner
> **Mira OS is an identity-first intelligence system that knows every pet deeply, guides decisions through personal interactions, and orchestrates their entire life.**

---

# FINAL CHECKLIST FOR NEXT AGENT

Before writing ANY code:

- [ ] Read `/app/memory/MIRA_OS_PRODUCT_DOCTRINE.md`
- [ ] Read `/app/memory/MIRA_BIBLE.md`
- [ ] Read `/app/memory/PRD.md`
- [ ] Login to app with test credentials
- [ ] Explore dashboard, mira-demo, admin panel
- [ ] Understand the 7 OS layers vs 14 pillars
- [ ] Review Two-Way Sync implementation
- [ ] Check `/app/test_reports/iteration_176.json`

---

*This document is the complete knowledge transfer.*
*Everything you need is here.*
*Read it all. Understand it all. Then build.*

*Generated: February 13, 2026*
*Mira OS Version: 10.0*

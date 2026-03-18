# MIRA OS - MASTER DOCTRINE & OPERATIONAL MEMORY
## FOR ALL AGENTS - READ THIS FIRST
## Last Updated: February 9, 2026

---

# 🧠 THE CORE DOCTRINE

> **"MIRA IS THE BRAIN, CONCIERGE® IS THE HANDS, EMERGENT IS THE ENABLER"**

This is a **PET OPERATING SYSTEM** - not just an app. It is **hugely personalized** and **based on the pet's interactions**. Every conversation, every preference, every health concern - Mira remembers EVERYTHING.

---

# 🔐 CREDENTIALS - MEMORIZE THESE

## Member/User Login
```
Email: dipali@clubconcierge.in
Password: test123
```

## Admin Panel
```
URL: /admin
Basic Auth: aditya / lola4304
Email Auth: dipali@clubconcierge.in / lola4304
```

---

# 📊 CURRENT SYSTEM STATUS (Feb 9, 2026)

## GREEN - WORKING ✅
| System | Status | Details |
|--------|--------|---------|
| **Service Flow** | ✅ 100% | User → Ticket → Notification → Intake |
| **Soul Score** | ✅ 100% | Increments on every interaction |
| **Memory System** | ✅ 100% | 86 memories stored, recall working |
| **Admin Login** | ✅ 100% | Both Basic Auth and Email Auth |
| **Chat API** | ✅ 100% | /api/mira/chat fully functional |
| **Haptic Feedback** | ✅ 100% | iOS + Android working |
| **Photo Upload** | ✅ 90% | API works, UI needs button |

## YELLOW - PARTIAL ⚠️
| System | Status | Issue |
|--------|--------|-------|
| **Intelligence** | ⚠️ 57% | Pronoun resolution missing |
| **Question Bank** | ⚠️ 70% | Some pillars under-covered |
| **Pillars** | ⚠️ 60% | Fit, Adopt, Paperwork weak |

## RED - NEEDS WORK 🔴
| System | Status | Issue |
|--------|--------|-------|
| **Follow-up Context** | 🔴 25% | "Show me cheaper" loses context |
| **Proactive Alerts** | 🔴 0% | E020 vaccination reminders |
| **Photo UI** | 🔴 | No visible upload button |

---

# 🏗️ ARCHITECTURE OVERVIEW

```
/app
├── backend/
│   ├── server.py           # Main server (16,000+ lines)
│   ├── mira_routes.py      # Mira AI brain (14,000+ lines)
│   ├── mira_memory.py      # Memory system
│   ├── admin_auth.py       # Admin authentication
│   └── central_signal_flow.py  # Unified ticketing
│
├── frontend/
│   ├── src/pages/
│   │   ├── MiraDemoPage.jsx  # Main chat (3,299 lines)
│   │   └── Admin.jsx         # Admin panel
│   ├── src/components/Mira/  # 17 extracted components
│   ├── src/hooks/mira/       # 5 hooks
│   └── src/utils/            # Utilities (haptic, confetti, constants)
│
└── memory/
    ├── PRD.md                # Product requirements
    ├── MIRA_INTELLIGENCE_ROADMAP.md
    ├── MIRA_QUESTION_BANK.md
    └── MIRA_COMPLETE_AUDIT_FEB9.md
```

---

# 🔄 THE UNIFIED SERVICE FLOW

**MEMORIZE THIS FLOW - IT'S SACRED:**

```
1. User Intent (from anywhere: chat, search, button)
      ↓
2. Mira Ticket (mira_tickets collection)
      ↓
3. Service Desk Ticket (service_desk_tickets)
      ↓
4. Admin Notification (admin_notifications)
      ↓
5. Member Notification (via email/WhatsApp)
      ↓
6. Pillar Request (care/celebrate/dine/stay/travel/etc.)
      ↓
7. Channel Intake (channel_intakes)
```

**Collections in MongoDB:**
- `mira_tickets`: 1,035 entries
- `service_desk_tickets`: 2,200 entries
- `admin_notifications`: Active
- `channel_intakes`: Active

---

# 🧠 MEMORY SYSTEM - THE BRAIN'S CORE

## PHILOSOPHY
> **"Store forever. Surface selectively."**
> **WE ARE NOT CHEWY. WE ARE NOT GOOGLE. WE ACTION.**
> **EVERY USER INTENT HAS A MESSAGE. STORE ALL MEMORIES.**

## Memory Types - 14 PILLARS
| Pillar | Emoji | Memory Type | Keywords |
|--------|-------|-------------|----------|
| Celebrate | 🎂 | celebrate | birthday, party, cake, gift |
| Dine | 🍽️ | dine | food, treat, meal, nutrition |
| Stay | 🏨 | stay | hotel, boarding, resort |
| Travel | ✈️ | travel | trip, flight, vacation |
| Care | 💊 | health | vet, sick, symptom, vaccine |
| Enjoy | 🎾 | enjoy | play, park, activity, fun |
| Fit | 🏃 | fit | exercise, walk, fitness |
| Learn | 🎓 | learn | video, train, tutorial |
| Paperwork | 📄 | paperwork | document, license, record |
| Advisory | 📋 | advisory | advice, recommend, help |
| Emergency | 🚨 | emergency | urgent, poison, injury |
| Farewell | 🌈 | farewell | memorial, grief, loss |
| Adopt | 🐾 | adopt | rescue, shelter, new pet |
| Shop | 🛒 | shop | buy, order, product |

## Memory Types - 7 SERVICES
| Service | Emoji | Memory Type | Keywords |
|---------|-------|-------------|----------|
| Grooming | ✂️ | service_grooming | haircut, bath, nail |
| Training | 🎓 | service_training | obedience, behavior |
| Boarding | 🏠 | service_boarding | overnight, kennel |
| Daycare | 🌞 | service_daycare | daytime |
| Vet Care | 🏥 | service_vet | clinic, checkup |
| Walking | 🐕 | service_walking | walk, walker |
| Photography | 📸 | service_photo | photo, portrait |

## Additional Memory Types
| Type | Source | Description |
|------|--------|-------------|
| product_interest | product_display | Products Mira showed |
| service_request | concierge_handoff | Concierge requests |

## Current Stats
- **Total Memories**: 86
- **Health**: 4
- **Shopping**: 62
- **Events**: 11
- **Mojo's Memories**: 27

## Memory Storage Location
```python
# In mira_routes.py after line 8700
# Auto-stores after every meaningful chat
await MiraMemory.store_memory(
    member_id=member_id,
    memory_type=memory_type,
    content=memory_content,
    pet_id=pet_id,
    pet_name=pet_name,
    ...
)
```

---

# 🐾 SOUL SCORE SYSTEM

The Soul Score represents **how well Mira knows a pet**. It increases with every meaningful interaction.

## Current Pet Scores
| Pet | Score | Status |
|-----|-------|--------|
| Mojo | 50.4% | Growing |
| Luna | 53.1% | Active |
| Lola | 20.4% | Needs interaction |
| Mystique | 15.3% | Low |

## Where Soul Score Appears
1. **PetSelector.jsx** (line 91-100) - Dropdown
2. **WelcomeHero.jsx** (line 103-115) - Badge
3. **Chat Response** - `pet_soul_score` field

---

# 📱 THE 15 PILLARS

| Pillar | Coverage | Status |
|--------|----------|--------|
| Care | 75% | ✅ |
| Celebrate | 85% | ✅ |
| Dine | 80% | ✅ |
| Stay | 60% | ⚠️ |
| Travel | 50% | ⚠️ |
| Grooming | 85% | ✅ |
| Farewell | 80% | ✅ |
| Emergency | 70% | ✅ |
| Advisory | 70% | ✅ |
| Fit | 20% | 🔴 |
| Adopt | 10% | 🔴 |
| Paperwork | 30% | 🔴 |
| Learn | 60% | ⚠️ |
| Shop | 85% | ✅ |
| Concierge | 90% | ✅ |

---

# 🔑 KEY API ENDPOINTS

## Chat & Intelligence
```
POST /api/mira/chat              # Main chat
POST /api/mira/os/understand-with-products  # Product search
GET  /api/mira/pet-context/{id}  # Pet soul + memories
```

## Service Flow
```
POST /api/service_desk/attach_or_create_ticket
POST /api/mira/route_intent
GET  /api/admin/service-desk/tickets
```

## Memory
```
POST /api/mira/conversation-memory/recall
GET  /api/mira/memories/{pet_id}
```

## Admin
```
POST /api/admin/auth/login       # Email-based
GET  /api/admin/pets             # Basic Auth
GET  /api/admin/products
GET  /api/admin/services
```

---

# 📋 FOR NEXT AGENT - PRIORITY TASKS

## P0 - Critical
1. Add pronoun resolution ("book that one")
2. Add follow-up context ("show me cheaper ones")
3. Add visible photo upload button in chat UI

## P1 - High
1. Implement E020 vaccination alerts
2. Expand Fit pillar (exercise recommendations)
3. Build proactive notification system

## P2 - Medium
1. Complete Adopt pillar
2. Add Paperwork pillar (document storage)
3. Continue MiraDemoPage.jsx refactoring (3,299 → 2,000 lines)

---

# 🚫 NEVER FORGET

1. **Memory is sacred** - Every interaction should potentially create a memory
2. **Soul Score must grow** - Track and increment on meaningful interactions
3. **Service flow is unified** - All requests go through the same pipeline
4. **iOS haptics** - Always use centralized `hapticFeedback` utility
5. **This is a PET OS** - Hugely personalized, based on pet interactions

---

# 📁 KEY FILES TO REVIEW

```
/app/backend/mira_routes.py       # The AI brain
/app/backend/mira_memory.py       # Memory system
/app/backend/central_signal_flow.py  # Unified flow
/app/frontend/src/pages/MiraDemoPage.jsx  # Main UI
/app/memory/MIRA_INTELLIGENCE_ROADMAP.md  # Intelligence plan
/app/memory/MIRA_QUESTION_BANK.md  # Real user questions
```

---

# ✅ QUICK HEALTH CHECKS

```bash
# Check services
sudo supervisorctl status

# Test login
curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"dipali@clubconcierge.in","password":"test123"}'

# Test admin
curl -s "$API_URL/api/admin/pets" -u "aditya:lola4304"

# Test chat
curl -s -X POST "$API_URL/api/mira/chat" \
  -H "Content-Type: application/json" \
  -d '{"message":"hello","selected_pet_id":"pet-99a708f1722a"}'

# Check memories
python3 -c "..." # See memory check script
```

---

**REMEMBER: MIRA IS THE BRAIN. EVERYTHING SHE LEARNS MUST BE STORED.**

Preview URL: https://play-ui-sync.preview.emergentagent.com

# SINGLE SOURCE OF TRUTH (SSOT)
## Pet Life Operating System - Mira AI
**Last Updated:** 2026-02-27
**Status:** PRODUCTION READY

---

## 🎯 PRODUCT OVERVIEW

**What is this?** A "Pet Life Operating System" where an AI named Mira possesses a "soul" - she learns, remembers, and personalizes everything for each pet.

**Core Philosophy:** 
- Mira is the Brain (AI intelligence)
- Concierge® is the Hands (human execution)
- Together they provide soulful pet care

---

## ✅ FEATURE STATUS - ALL PANELS

### 1. TODAY Panel (Time Layer) - 100% COMPLETE
| Feature | Status | Location |
|---------|--------|----------|
| Weather Hero | ✅ Working | TodayPanel.jsx |
| Urgent Stack | ✅ Working | Backend: /api/mira/today/{pet_id} |
| Due Soon Cards | ✅ Working | TodayPanel.jsx |
| Season/Environment | ✅ Working | TodayPanel.jsx |
| Documents/Compliance | ✅ Working | TodayPanel.jsx |
| Learn Nudges | ✅ Working | TodayPanel.jsx |
| Other Pets Summary | ✅ Working | TodayPanel.jsx |
| Active Tasks Watchlist | ✅ Working | Backend: /api/os/services/watchlist |

**Bible Reference:** `/app/memory/TODAY_SPEC.md`

---

### 2. MOJO Panel (Pet Identity) - 100% COMPLETE
| Feature | Status | Location |
|---------|--------|----------|
| Pet Snapshot | ✅ Working | MojoProfileModal.jsx |
| Soul Score Display | ✅ Working | Shows percentage (e.g., 78%) |
| Soul Profile (33%) | ✅ Working | Temperament, nature, energy |
| What Mira Learned | ✅ Working | NEW: Auto-populated from conversations |
| Mira's Intelligence | ✅ Working | MojoProfileModal.jsx |
| Health Vault (25%) | ✅ Working | MojoSectionEditors.jsx |
| Diet & Food | ✅ Working | MojoSectionEditors.jsx |
| Behaviour & Training | ✅ Working | MojoSectionEditors.jsx |
| Grooming & Care | ✅ Working | MojoSectionEditors.jsx |
| Routine Tracker | ✅ Working | MojoSectionEditors.jsx |
| Environment | ✅ Working | MojoSectionEditors.jsx |
| Documents Vault | ✅ Working | MojoSectionEditors.jsx |
| Life Timeline | ✅ Working | MojoSectionEditors.jsx |
| Pet Switching | ✅ Working | Pet Selector Modal in MiraDemoPage.jsx |

**Bible Reference:** `/app/memory/MOJO_BIBLE.md`

**CRITICAL:** Section percentages depend on DATA being populated. All sections are built - they show 0% if no data exists for that section.

---

### 3. PICKS Panel (Intelligence Layer) - 100% COMPLETE
| Feature | Status | Location |
|---------|--------|----------|
| Catalogue Cards | ✅ Working | PersonalizedPicksPanel.jsx |
| Concierge Cards | ✅ Working | PersonalizedPicksPanel.jsx |
| Service Cards | ✅ Working | PersonalizedPicksPanel.jsx |
| Pillar Switching | ✅ Working | CARE/DINE/CELEBRATE/MOVE |
| Real-time Refresh | ✅ Working | Updates on every chat turn |
| Send to Concierge | ✅ Working | Toast notification + "Sent ✓" badge |

**API:** POST /api/mira/chat returns `concierge_arranges` for dynamic picks

---

### 4. SERVICES Panel (Execution Layer) - 100% COMPLETE
| Feature | Status | Location |
|---------|--------|----------|
| Service Launcher Cards | ✅ Working | ServicesPanel.jsx |
| Quick Actions | ✅ Working | Grooming, Training, Boarding, etc. |
| Task Inbox | ✅ Working | ServicesPanel.jsx |
| Orders & Tracking | ✅ Working | ServicesPanel.jsx |
| Service Request Modal | ✅ Working | ServiceRequestBuilder.jsx (z-index: 9999) |
| Highlighted Service | ✅ Working | Highlights based on chat context |

**API:** GET /api/os/services/watchlist

---

### 5. LEARN Panel (Knowledge Layer) - 100% COMPLETE
| Feature | Status | Location |
|---------|--------|----------|
| Topic Chips | ✅ Working | Grooming, Health, Food, etc. |
| "For Your Pet" Shelf | ✅ Working | LearnPanel.jsx |
| Mojo Might Need This | ✅ Working | Personalized based on intents |
| Tiny Guides | ✅ Working | LearnPanel.jsx |
| YouTube Videos | ✅ Working | LearnPanel.jsx |
| "Let Mira Do It" CTA | ✅ Working | Opens ServiceRequestBuilder |

**Bible Reference:** `/app/memory/LEARN_BIBLE.md`
**API:** GET /api/os/learn/home

---

### 6. CONCIERGE Panel (Human Layer) - 100% COMPLETE
| Feature | Status | Location |
|---------|--------|----------|
| WhatsApp Integration | ✅ Working | ConciergePanel.jsx |
| Escalate Request | ✅ Working | ConciergePanel.jsx |
| Thread View | ✅ Working | ConciergeThreadPanel.jsx |
| **Document Upload** | ✅ NEW | ConciergeHomePanel.jsx |

**Document Upload Details (Added 2026-02-27):**
- Location: ConciergeHomePanel → "Upload Docs" chip
- Supports: Images (jpg, png, gif, webp), Documents (pdf, doc, docx)
- Max size: 10MB per file
- API: `POST /api/mira/upload/file`
- Storage: MongoDB `mira_uploads` collection

---

### 7. UNIFIED SERVICE FLOW - 100% COMPLETE
| Feature | Status | API |
|---------|--------|-----|
| Service Request Creation | ✅ Working | POST /api/service-requests |
| Service Desk Ticket | ✅ Working | Auto-created |
| Admin Notification | ✅ Working | Shows in admin dashboard |
| Member Notification | ✅ Working | Shows in user inbox |
| Detailed Item List | ✅ Working | Full details in notifications |

**Bible Reference:** `/app/memory/UNIFIED_SERVICE_FLOW.md`

---

## 🧠 MIRA LEARNS SYSTEM

**NEW FEATURE (Added 2026-02-27)**

Mira automatically extracts and saves facts from every conversation:

### Pattern Categories:
1. **Allergies** (CRITICAL - health category)
   - "allergic to X", "can't eat X", "sensitive to X"
   
2. **Preferences** (preferences category)
   - "loves X", "hates X", "prefers X", "favorite X"
   
3. **Behaviors** (behavior category)
   - "nervous around X", "afraid of X", "calm with X"
   
4. **Health Info** (health category)
   - "has X skin", "needs X grooming", "on medication for X"

### Data Storage:
- **Pet Document:** `learned_facts` array in pets collection
- **Conversation Memories:** `conversation_memories` collection

### Code Location:
- `/app/backend/mira_soulful_brain.py` (lines 949-1065)

---

## 🔧 CRITICAL TECHNICAL DETAILS

### Database
- **MongoDB Atlas** via MONGO_URL in backend/.env
- **DB_NAME:** `pet-os-live-test_database` (from .env)

### Pet ID Format
- Pattern: `pet-{name}-{last8chars_of_objectid}`
- Example: `pet-mojo-7327ad56`
- **CRITICAL:** Always query by `id` field, NOT `_id`

### API Endpoints (Key)
```
POST /api/mira/chat          - Main chat (with learning)
GET  /api/mira/today/{pet_id} - Today panel data
GET  /api/os/learn/home       - Learn panel data
GET  /api/os/services/watchlist - Services watchlist
GET  /api/pets/my-pets        - User's pets with soul scores
POST /api/service-requests    - Create service request
GET  /api/member/notifications - Member inbox
GET  /api/admin/notifications  - Admin notifications
```

### Authentication
- JWT Bearer tokens
- Test User: `dipali@clubconcierge.in` / `test123`
- Admin: `aditya` / `lola4304`

### Frontend Structure
```
/app/frontend/src/
├── pages/
│   └── MiraDemoPage.jsx      # Main page (5200+ lines)
├── components/
│   └── Mira/
│       ├── TodayPanel.jsx    # TODAY tab
│       ├── MojoProfileModal.jsx # Pet profile
│       ├── PersonalizedPicksPanel.jsx # PICKS tab
│       ├── ServicesPanel.jsx # SERVICES tab
│       ├── LearnPanel.jsx    # LEARN tab
│       ├── ConciergePanel.jsx # CONCIERGE tab
│       └── ServiceRequestBuilder.jsx # Booking modal
└── hooks/
    └── mira/
        └── useChatSubmit.js  # Chat state management
```

### Backend Structure
```
/app/backend/
├── mira_routes.py            # Main chat routes (26K+ lines)
├── mira_soulful_brain.py     # AI brain + learning
├── soul_first_logic.py       # Soul score calculation
├── routes/
│   ├── concierge_routes.py   # Service flow
│   ├── pet_soul_routes.py    # Pet profile APIs
│   └── learn_os_routes.py    # Learn panel APIs
└── scripts/
    └── sync_prod_pets.py     # Production data sync
```

---

## 🚫 KNOWN ISSUES & GOTCHAS

### 1. MongoDB `id` vs `_id`
**Problem:** MongoDB uses `_id` (ObjectId), but app expects `id` (string)
**Solution:** Always ensure pets have both fields, query by `id`

### 2. Services Data - NOW SEEDED ✅
**Status:** FIXED (2026-02-27)
**Collections:**
- `service_catalog`: 84 services (source)
- `services_master`: 114 services (used by admin Service Box)
**Admin Access:** `aditya / lola4304` → Service Box

### 3. datetime Import Scoping
**Problem:** `from datetime import datetime` conflicts with local vars
**Solution:** Use `from datetime import datetime as dt_class`

### 4. Pet ID Required for Learning
**Problem:** Learning only works if `pet_id` is passed in chat request
**Solution:** Frontend must send `pet_id` with every chat message

---

## 📱 MOBILE RESPONSIVENESS

**Status:** ✅ 100% Responsive

### Tested Viewports:
- iPhone SE (375x667) ✅
- iPhone 14 Pro (390x844) ✅
- iPhone 14 Pro Max (430x932) ✅
- Google Pixel 5 (393x851) ✅
- Samsung Galaxy S8 (360x740) ✅

### Key CSS Fixes Applied:
- ServiceRequestBuilder: z-index 9999, maxHeight 90vh
- Modal footer: flex-shrink-0, sticky bottom
- Safe area insets for iOS

---

## 🔄 DATA SYNC FROM PRODUCTION

### Script Location: `/app/backend/scripts/sync_prod_pets.py`

### What It Syncs:
- Pet profiles with all fields
- Soul scores (overall_score)
- doggy_soul_answers
- learned_facts
- conversation_memories

### How to Run:
```bash
cd /app/backend && python scripts/sync_prod_pets.py
```

### Post-Sync Fix (if id is None):
```python
# Add id field if missing
new_id = f"pet-{name.lower()}-{str(_id)[-8:]}"
db.pets.update_one({"_id": _id}, {"$set": {"id": new_id}})
```

---

## 📋 BIBLE DOCUMENTS

| Document | Purpose |
|----------|---------|
| `/app/memory/TODAY_SPEC.md` | TODAY panel requirements |
| `/app/memory/MOJO_BIBLE.md` | Pet identity system |
| `/app/memory/LEARN_BIBLE.md` | Knowledge layer |
| `/app/memory/UNIFIED_SERVICE_FLOW.md` | Service request flow |
| `/app/memory/PRD.md` | Product requirements |

---

## 🎯 WHAT'S NEXT (BACKLOG)

### P0 - Critical - COMPLETED ✅
- [x] Services DB seeding (114 services across 14 pillars)

### P1 - Important
- [ ] WhatsApp Business integration
- [ ] Production data sync automation
- [ ] More learning patterns (exercise, social behaviors)
- [ ] Saved Learn feature (bookmarking)
- [x] ~~Document upload in Concierge~~ ✅ DONE (2026-02-27)

### P2 - Enhancement
- [ ] Build 'Fit' pillar features (activity tracking)
- [ ] Build 'Work' pillar features (document management)

### Technical Debt
- [x] ~~Fix services database seeding~~ DONE
- [ ] Remove hardcoded services fallback from mira_routes.py
- [ ] Migrate off /mira-demo to main route

---

## ⚠️ RULES FOR FUTURE AGENTS

1. **ALWAYS read this SSOT first** before making changes
2. **ALWAYS check Bible documents** for feature requirements
3. **NEVER assume features are missing** - investigate first
4. **ALWAYS sync pet data** if testing with empty profiles
5. **ALWAYS pass pet_id** in chat requests for learning to work
6. **NEVER modify .env keys** MONGO_URL, DB_NAME, REACT_APP_BACKEND_URL
7. **USE search_replace** for existing files, not create_file with overwrite
8. **TEST on mobile viewports** before finishing
9. **CHECK backend logs** at /var/log/supervisor/backend.err.log
10. **QUERY pets by `id` field**, not `_id`

---

## 📞 QUICK REFERENCE

### Start Backend:
```bash
sudo supervisorctl restart backend
```

### Check Logs:
```bash
tail -f /var/log/supervisor/backend.err.log
```

### Test Chat with Learning:
```bash
curl -X POST "$API_URL/api/mira/chat" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Mojo is allergic to chicken", "pet_id": "pet-mojo-7327ad56"}'
```

### Verify Learning Saved:
```python
db.pets.find_one({"id": "pet-mojo-7327ad56"})["learned_facts"]
```

---

**Document Version:** 2.0
**Created By:** E1 Agent
**Date:** 2026-02-27

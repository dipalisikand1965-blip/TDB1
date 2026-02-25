# MIRA OS - MASTER INDEX
## Everything Built, All Doctrines, All Assets
**Last Updated:** February 22, 2026 (Session 6 Complete)  
**Total Documentation:** 232 files | **Backend:** 83 routes/engines | **Frontend:** 82 pages, 303 components

---

## 🚨 LATEST SESSION - READ FIRST

| Document | Purpose | Status |
|----------|---------|--------|
| **[HANDOVER_SESSION6.md](./HANDOVER_SESSION6.md)** | **Session 6 Complete Handover** | **NEW** |
| [PRD.md](./PRD.md) | Product Requirements - Updated | UPDATED |
| [MIRA_OS_SSOT.md](./MIRA_OS_SSOT.md) | Single Source of Truth - Updated | UPDATED |

### Session 6 Summary (Feb 22, 2026)
- ✅ Backend 100% pass (17/17 tests)
- ✅ Login redirects to `/pet-home`
- ✅ Pillar pages scroll to top
- ✅ HOME button navigates to `/pet-home`
- ✅ Paw Points, Badges, Dashboard tabs verified
- ✅ Resend email configured
- ✅ Mira Demo universal pet data verified

---

## 🔥 QUICK LINKS - START HERE

| Document | Purpose |
|----------|---------|
| [MIRA_BIBLE.md](./MIRA_BIBLE.md) | Core AI behavior & personality |
| [ONE_SPINE_SPEC.md](./ONE_SPINE_SPEC.md) | Unified architecture & QA protocol |
| [MIRA_OS_SSOT.md](./MIRA_OS_SSOT.md) | Single Source of Truth - Latest status |
| [PRD.md](./PRD.md) | Product Requirements & Implementation status |
| [COMPLETE_SYSTEM_BIBLE.md](./COMPLETE_SYSTEM_BIBLE.md) | Full system documentation |

---

## 📚 ALL BIBLES & DOCTRINES

### Core System Bibles
| Bible | Description |
|-------|-------------|
| MIRA_BIBLE.md | Mira's personality, memory-first principle, behavior rules |
| MIRA_OS_DOCTRINE.md | Operating system architecture |
| MIRA_OS_14_PILLARS_BIBLE.md | All 15 pillar definitions |
| ULTIMATE_SYSTEM_BIBLE.md | Complete system overview |
| COMPLETE_SYSTEM_BIBLE.md | Comprehensive documentation |
| MASTER_DOCTRINE.md | Master rules and principles |

### Feature-Specific Bibles
| Bible | Description |
|-------|-------------|
| CONCIERGE_BIBLE.md | Concierge service handling |
| INTENT_ENGINE_BIBLE.md | Intent detection & routing |
| LEARN_BIBLE.md | Learning/training pillar |
| IOS_MAIL_INBOX_BIBLE.md | iOS-style inbox design |
| UNIFIED_INFLOW_BIBLE.md | Unified service flow |
| DEPLOYMENT_BIBLE.md | Deployment procedures |
| PET_OS_UI_UX_BIBLE.md | UI/UX design guidelines |
| PET_OS_BEHAVIOR_BIBLE.md | Pet OS behavior patterns |

### Specifications
| Spec | Description |
|------|-------------|
| ONE_SPINE_SPEC.md | Core architecture specification |
| CONCIERGE_INBOX_SPEC.md | Inbox implementation |
| TICKET_SOUL_ENRICHMENT_SPEC.md | Ticket learning system |
| TODAY_SPEC.md | Today/dashboard features |
| 8_GOLDEN_PILLARS_SPEC.md | Original pillar design |
| MIRA_OPERATING_SPEC.md | Operating procedures |
| PILLAR_ARCHITECTURE_DOCTRINE.md | Pillar page architecture |
| SERVICE_TYPES_SPEC.md | Service categorization |
| PICKS_ENGINE_SPEC_v1_ORIGINAL_DISCUSSION.md | Recommendation engine |

### Doctrine & Status
| Document | Description |
|----------|-------------|
| DOCTRINE.md | Core doctrines |
| DOCTRINE_STATUS.md | Current doctrine compliance |
| DOCTRINE_AUDIT.md | Doctrine verification |
| BIBLE_INDEX.md | Bible cross-reference |
| BIBLE_SYNC_CHECK.md | Bible synchronization |

---

## 🏗️ BACKEND ARCHITECTURE

### Route Files (API Endpoints)
```
/app/backend/
├── auth_routes.py          # Authentication
├── admin_routes.py         # Admin panel
├── admin_member_routes.py  # Member management
├── admin_sync_routes.py    # Data sync
├── mira_routes.py          # MAIN: Mira AI chat (24,000+ lines)
├── pet_soul_routes.py      # Soul questionnaire
├── pet_vault_routes.py     # Health records
├── 
├── PILLAR ROUTES:
├── adopt_routes.py         # Adoption services
├── advisory_routes.py      # Expert consultations
├── care_routes.py          # Health & grooming
├── celebrate_routes.py     # Celebrations
├── dine_routes.py          # Food & treats
├── emergency_routes.py     # Emergency services
├── enjoy_routes.py         # Fun activities
├── farewell_routes.py      # End-of-life
├── fit_routes.py           # Exercise & weight
├── learn_routes.py         # Training
├── paperwork_routes.py     # Documents
├── play_routes.py          # Toys & games
├── shop_routes.py          # Products
├── stay_routes.py          # Boarding
├── travel_routes.py        # Transportation
├── 
├── FEATURE ROUTES:
├── cart_routes.py          # Shopping cart
├── checkout_routes.py      # Payment flow
├── collection_routes.py    # Product collections
├── concierge_routes.py     # Concierge requests
├── communication_routes.py # Messaging
├── conversation_routes.py  # Chat history
├── discount_routes.py      # Promo codes
├── escalation_routes.py    # Issue escalation
├── export_routes.py        # Data export
├── faq_routes.py           # FAQ system
├── feedback_routes.py      # Customer feedback
├── health_routes.py        # Health tracking
├── loyalty_routes.py       # Loyalty points
├── membership_routes.py    # Memberships
├── notification_routes.py  # Notifications
├── order_routes.py         # Order management
├── product_routes.py       # Product catalog
├── search_routes.py        # Search
├── service_routes.py       # Service catalog
├── status_routes.py        # Status tracking
├── tts_routes.py           # Text-to-speech
├── whatsapp_routes.py      # WhatsApp integration
└── webhook_routes.py       # Webhooks
```

### Engine Files (Business Logic)
```
/app/backend/
├── birthday_engine.py       # Birthday detection & promos
├── communication_engine.py  # Multi-channel messaging
├── concierge_engine.py      # Service request handling
├── email_reports_engine.py  # Email reporting
├── engagement_engine.py     # Gamification & streaks
├── notification_engine.py   # Push notifications
├── recommendation_engine.py # Product recommendations
├── search_engine.py         # Search indexing
├── soul_first_logic.py      # CRITICAL: Soul extraction & learning
├── soul_learning_engine.py  # Soul growth from conversations
├── status_engine.py         # Order/service status
└── ticket_engine.py         # Ticket management
```

### Core Logic Files
```
/app/backend/
├── server.py               # MAIN: FastAPI app (15,000+ lines)
├── pet_score_logic.py      # Soul score calculation
├── breed_knowledge.py      # Breed-specific data
├── breed_catalogue.py      # Breed catalog
├── renewal_reminders.py    # Vaccination reminders
└── shopify_sync.py         # Product sync from Shopify
```

---

## 🎨 FRONTEND ARCHITECTURE

### Main Pages (/app/frontend/src/pages/)
```
├── Home.jsx                 # Landing page
├── MiraDemoPage.jsx         # MAIN: Mira OS interface (3,500+ lines)
├── MemberDashboard.jsx      # User dashboard
├── MyPets.jsx               # Pet management
├── UnifiedPetPage.jsx       # Pet profile
├── PetVault.jsx             # Health records UI
├── 
├── PILLAR PAGES:
├── AdoptPage.jsx
├── AdvisoryPage.jsx
├── CarePage.jsx
├── CelebratePage.jsx
├── DinePage.jsx
├── EmergencyPage.jsx
├── EnjoyPage.jsx
├── FarewellPage.jsx
├── FitPage.jsx
├── LearnPage.jsx
├── PaperworkPage.jsx
├── PlayPage.jsx
├── ShopPage.jsx
├── StayPage.jsx
├── TravelPage.jsx
├── 
├── ADMIN PAGES:
├── admin/Admin.jsx          # Admin dashboard
├── admin/AdminProducts.jsx  # Product CRUD
├── admin/AdminServices.jsx  # Service CRUD
├── ConciergeDashboard.jsx   # Service desk
└── ServiceDesk.jsx          # Ticket management
```

### Key Components (/app/frontend/src/components/)
```
├── MiraAI.jsx               # Global Mira chat orb
├── MiraChatWidget.jsx       # Pillar-specific chat
├── PillarPageLayout.jsx     # Pillar page template
├── 
├── Mira/
│   ├── MojoProfileModal.jsx # MOJO tab with soul data
│   ├── PetOSNavigation.jsx  # Pet selector & navigation
│   └── PetAvatarRing.jsx    # Soul score ring
├── 
├── mira-os/
│   ├── TicketThread.jsx     # Conversation thread
│   ├── InsightsPanel.jsx    # Pet insights
│   ├── PersonalizedPicks.jsx # Product recommendations
│   └── debug/
│       └── IconStateDebugDrawer.jsx  # Debug panel
├── 
├── admin/
│   ├── DashboardTab.jsx
│   ├── ProductsTab.jsx
│   ├── ServicesTab.jsx
│   └── PaperworkManager.jsx
└── 
└── ui/                      # Shadcn components
    ├── button.jsx
    ├── card.jsx
    ├── dialog.jsx
    └── ... (40+ UI primitives)
```

---

## 🗃️ DATABASE COLLECTIONS

### Primary Collections
| Collection | Description |
|------------|-------------|
| `users` | User accounts & profiles |
| `pets` | Pet profiles with soul data |
| `products_master` | Product catalog |
| `services_master` | Service catalog |
| `experiences` | Experience packages |
| `bundles` | Product bundles |
| `orders` | Order records |

### Soul & Learning
| Collection | Description |
|------------|-------------|
| `pets.doggy_soul_answers` | Embedded: Soul questionnaire answers |
| `pets.learned_facts` | Embedded: Facts learned from chat |
| `pets.conversation_insights` | Embedded: Pending insights |
| `pets.vault` | Embedded: Health records |
| `mira_memories` | AI memories per pet |
| `mira_life_timeline_events` | Life milestones |

### Tickets & Communication
| Collection | Description |
|------------|-------------|
| `mira_tickets` | Mira-generated tickets |
| `service_desk_tickets` | Service requests |
| `tickets` | Legacy tickets |
| `conversations` | Chat history |

---

## ✅ FEATURE STATUS

### FULLY WORKING (Verified)
| Feature | Status | Last Tested |
|---------|--------|-------------|
| User Authentication | ✅ | Feb 21, 2026 |
| Pet Profiles & Soul Score | ✅ | Feb 21, 2026 |
| Mira AI Chat | ✅ | Feb 21, 2026 |
| Soul Builder Questionnaire | ✅ | Feb 21, 2026 |
| Pet Vault (Health Records) | ✅ | Feb 21, 2026 |
| Birthday Engine | ✅ | Feb 21, 2026 |
| Breed Knowledge & Tips | ✅ | Feb 21, 2026 |
| Life Timeline | ✅ | Feb 21, 2026 |
| Mira Memories | ✅ | Feb 21, 2026 |
| Product Recommendations | ✅ | Feb 21, 2026 |
| Service Requests | ✅ | Feb 21, 2026 |
| Ticket System | ✅ | Feb 21, 2026 |
| Admin CRUD (Products/Services) | ✅ | Feb 21, 2026 |
| Soul Learning from Chat | ✅ | Feb 21, 2026 |
| Debug Drawer | ✅ | Feb 21, 2026 |

### NEEDS DEPLOYMENT TO PRODUCTION
| Feature | Status |
|---------|--------|
| Soul Learning → learned_facts | Preview only |
| ObjectId serialization fixes | Preview only |

### BLOCKED (Waiting for Keys/Credits)
| Feature | Blocker |
|---------|---------|
| Razorpay Checkout | Need API keys |
| WhatsApp Integration | Need API keys |
| ElevenLabs TTS | Need credits (falling back to OpenAI) |

---

## 🔧 KEY CONFIGURATIONS

### Environment Variables
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
REACT_APP_BACKEND_URL=https://soul-concierge.preview.emergentagent.com
```

### Test Credentials
| Type | Email/Username | Password |
|------|----------------|----------|
| Member | dipali@clubconcierge.in | test123 |
| Admin | aditya | lola4304 |

---

## 🚀 POST-DEPLOYMENT CHECKLIST

### After Deploying to Production:

1. **Seed Mystique's Data** (so you can verify features):
   ```bash
   curl -X POST https://thedoggycompany.com/api/admin/seed-mystique
   ```
   This seeds: 5 learned facts, 3 vaccines, 2 meds, 5 timeline events, 4 memories

2. **Verify Everything Works**:
   - Go to `/mira-demo` and login
   - Click MOJO tab → Check "What Mira Learned" (should show 5 facts)
   - Click Pet Vault → Check vaccines & medications
   - Chat with Mira → Verify personalized responses
   - Add `?debug=1` to URL → Check debug drawer

3. **Test a Conversation**:
   - Tell Mira something new about Mystique
   - Check if it appears in "What Mira Learned"

---

## 📊 STATISTICS

| Category | Count |
|----------|-------|
| Documentation Files | 231 |
| Backend Route/Engine Files | 83 |
| Frontend Pages | 82 |
| Frontend Components | 303 |
| Total Lines of Code (Backend) | 100,000+ |
| Total Lines of Code (Frontend) | 80,000+ |
| Database Collections | 50+ |
| API Endpoints | 500+ |
| Breeds Supported | 62 |
| Products in Catalog | 2,541 |
| Services in Catalog | 716 |

---

## 🚀 DEPLOYMENT

### Preview Environment
- URL: https://soul-concierge.preview.emergentagent.com
- Database: Local MongoDB
- Status: All features working

### Production Environment
- URL: https://thedoggycompany.com
- Database: MongoDB Atlas
- Status: Needs latest deployment

---

## 📖 HOW TO USE THIS INDEX

1. **New Agent?** Start with:
   - AGENT_START_HERE.md
   - MIRA_BIBLE.md
   - ONE_SPINE_SPEC.md

2. **Debugging?** Check:
   - MIRA_OS_SSOT.md (latest status)
   - Add `?debug=1` to URL for debug drawer

3. **Adding Features?** Review:
   - PILLAR_ARCHITECTURE_DOCTRINE.md
   - INTENT_ENGINE_BIBLE.md

4. **Checking Compliance?** Use:
   - DOCTRINE_AUDIT.md
   - BIBLE_SYNC_CHECK.md

---

**This is the MASTER INDEX. Bookmark this file. All roads lead here.**

*Last updated by Agent on February 21, 2026*

# The Doggy Company - Mira OS Product Requirements Document
## Pet Operating System Evolution
### Master Document - February 15, 2026

---

## 🎯 ORIGINAL PROBLEM STATEMENT

Transform the pet e-commerce platform into a **"Pet Operating System"** centered on the principle **"Mira knows, Mira doesn't ask."** 

The core goal is making Mira the **"Pet Operating Soul System"** that understands each pet's unique "Soul" through the **8 Golden Pillars**.

---

## 📋 PRODUCT REQUIREMENTS

### Core Requirements
1. **Silent Mira OS** - Proactive, personalized concierge without asking redundant questions
2. **8 Golden Pillars** - Comprehensive pet understanding across all life aspects
3. **Intelligence First** - Mira should know the pet better than anyone
4. **Feature Parity** - New Mira OS must match and exceed old FAB capabilities

### User Stories
- As a pet parent, I want Mira to remember everything about my pet
- As a pet parent, I want personalized product recommendations based on my pet's soul
- As a pet parent, I want Mira to proactively suggest things my pet might need

---

## ✅ WHAT'S BEEN IMPLEMENTED

### February 15, 2026 (Session 2)
- [x] **ElevenLabs Voice Verified Working** - TTS playback in Mira OS confirmed
- [x] **Fresh Chat Feature** - Chat clears on pet switch, new session ID generated
- [x] **New Chat Button** - RotateCcw icon in Mira OS header for manual chat refresh
- [x] **Pet Context in Chat** - Full pet context sent with every message
- [x] **Comprehensive Platform Audit** - 89/100 score documented
- [x] **Roadmap to 100** - 22-step sequential plan created

### February 15, 2026 (Session 1)
- [x] **Bug Fix:** `/celebrate-new` "l.some is not a function" error
- [x] **UNIFIED 8 Golden Pillars Scoring System**
  - Restructured from 6 categories → 8 pillars
  - 39 scored questions (up from 26)
  - Total = 100 points distributed across all pillars
- [x] **New Endpoint:** `GET /api/pet-soul/profile/{pet_id}/8-pillars`
- [x] **Comprehensive Handover Documentation**
- [x] **API Verification** - All soul endpoints tested and working

### February 14, 2026
- [x] Concierge® rebrand (Chat → Concierge®)
- [x] Backend-driven intelligent quick replies
- [x] Inline conversational UI

### February 13, 2026
- [x] Mira OS Modal (BETA) with 3 tabs
- [x] Multi-pet switching in modal

### Earlier (Days 1-100)
- [x] Pet Soul onboarding flow
- [x] 14 pillar pages architecture
- [x] Original Mira FAB
- [x] Shopify integration
- [x] Membership system

---

## 🏗️ ARCHITECTURE

### Frontend
```
/app/frontend/src/
├── pages/
│   ├── CelebrateNewPage.jsx      # Mira OS button location
│   ├── MiraDemoPage.jsx          # Pet Soul dashboard
│   └── PetSoulPage.jsx           # Onboarding
├── components/
│   ├── mira-os/MiraOSModal.jsx   # NEW Mira OS
│   └── Mira/MiraChatWidget.jsx   # OLD FAB (deprecated)
└── context/PillarContext.jsx
```

### Backend
```
/app/backend/
├── server.py                      # Main API (12k+ lines)
├── mira_routes.py                 # Mira chat
├── pet_soul_routes.py             # Soul endpoints (8-pillars, quick-questions)
├── pet_soul_config.py             # Scoring config (UPDATED)
└── soul_first_logic.py            # AI context
```

---

## 🌟 8 GOLDEN PILLARS SCORING

| Pillar | Points | Questions | Status |
|--------|--------|-----------|--------|
| 🎭 Identity & Temperament | 15 | 5 | ✅ |
| 👨‍👩‍👧‍👦 Family & Pack | 12 | 5 | ✅ NEW |
| ⏰ Rhythm & Routine | 14 | 6 | ✅ NEW |
| 🏠 Home Comforts | 8 | 4 | ✅ |
| ✈️ Travel Style | 10 | 4 | ✅ NEW |
| 🍖 Taste & Treat | 14 | 5 | ✅ |
| 🎓 Training & Behaviour | 10 | 4 | ✅ |
| 🌅 Long Horizon (Health) | 17 | 6 | ✅ |
| **TOTAL** | **100** | **39** | |

### Tier System
| Tier | Range | Emoji |
|------|-------|-------|
| Curious Pup | 0-24% | 🐾 |
| Loyal Companion | 25-49% | 🌱 |
| Trusted Guardian | 50-74% | 🤝 |
| Pack Leader | 75-89% | 🐕‍🦺 |
| Soul Master | 90-100% | ✨ |

---

## 🔑 KEY API ENDPOINTS

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/pet-soul/profile/{pet_id}/8-pillars` | GET | Full pillar breakdown |
| `/api/pet-soul/profile/{pet_id}/quick-questions` | GET | Top 3 unanswered |
| `/api/pet-soul/profile/{pet_id}/answer` | POST | Save single answer |
| `/api/pet-soul/profile/{pet_id}/answers/bulk` | POST | Save multiple |
| `/api/mira/chat` | POST | Mira chat |

---

## 📋 PRIORITIZED BACKLOG

### P0 - Critical
- [ ] Test ElevenLabs voice in Mira OS
- [ ] Weave Quick Questions into Concierge® chat
- [ ] Update /mira-demo to show 8-pillar visual

### P1 - Important
- [ ] Connect Concierge indicator states
- [ ] Proactive Mira intelligence

### P2 - Nice to Have
- [ ] Gate Mira OS for paid members
- [ ] Fix original FAB issues

### P3 - Future
- [ ] Phase out old FAB
- [ ] Backend refactoring

---

## ⚠️ KNOWN ISSUES

| Issue | Status | Priority |
|-------|--------|----------|
| ElevenLabs voice in Mira OS | Untested | P0 |
| Production domain DNS | External | Blocker |
| Original FAB bugs | Not fixed | P2 |

---

## 🧪 TEST DATA

| Pet | ID | Score | Use For |
|-----|----|----|---------|
| Mojo | pet-99a708f1722a | 89% | High score testing |
| Lennu | pet-79d93864ca5d | 5% | Quick questions testing |

---

## 📚 KEY MEMORY FILES

| File | Purpose |
|------|---------|
| `START_HERE_AGENT.md` | Master handover |
| `8_GOLDEN_PILLARS_SPEC.md` | Technical spec |
| `CHANGELOG.md` | Development history |
| `ROADMAP.md` | Prioritized backlog |
| `API_VERIFICATION.md` | Test results |

---

## 🔗 PREVIEW URL
```
https://mira-roadmap-100.preview.emergentagent.com
```

---

*Last Updated: February 15, 2026*

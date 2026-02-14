# The Doggy Company - Product Requirements Document

---
## ⚠️ NEW AGENT? READ THIS FIRST:
## 1. **MIRA OS URL:** `/mira-demo` (NOT `/mira`)
## 2. **Test Credentials:** `dipali@clubconcierge.in` / `test123` | Admin: `aditya` / `lola4304`
## 3. `/app/memory/MOJO_BIBLE.md` - THE COMPLETE MOJO DEFINITION (28 Parts + OS Layers)
## 4. `/app/memory/MOJO_BIBLE_SCORECARD.md` - Current Implementation Score (100% MOJO / 90% Overall)
## 5. `/app/memory/SYSTEM_AUDIT_REPORT.md` - ✅ FULL SYSTEM AUDIT COMPLETED (Feb 2026)
---

## CURRENT SCORE: 90% (Against MOJO Bible Vision) - Updated Feb 14, 2026 (Session 7)
| Layer | Score | Status |
|-------|-------|--------|
| **MOJO (14 components)** | **100%** | ✅ **COMPLETE - All components working** |
| **TODAY** | 95% | ✅ Full Time Layer per MOJO Bible |
| **PICKS** | **100%** | ✅ **JUST COMPLETED SESSION 7** |
| **SERVICES** | 40% | 🔴 Next Priority |
| **LEARN** | 10% | Future |
| **CONCIERGE** | 30% | Future |

## ⚠️ CRITICAL: TWO-WAY MEMORY SYNC
**Every conversation updates MOJO automatically!**
- Code: `/app/backend/mira_routes.py` lines 11414-11455
- Mira remembers EVERYTHING from conversations

---

## PICKS LAYER - 100% COMPLETE ✅ (Feb 14, 2026)

### All 4 Phases Verified Working:

**Phase 1: Micro-Delights ✅**
- Sound "whoosh" on PICKS refresh (`/app/frontend/src/utils/picksDelights.js`)
- PICKS tab glow/pulse animation
- Confetti for celebrate intent
- Emergency red pulse for urgent

**Phase 2: Card Enhancements ✅**
- "Why these picks?" expandable panel
- FitBadges component (Allergy-aware, Small-mouth safe, etc.)
- Enhanced fields: what_we_arrange, what_we_need, includes

**Phase 3: Task Flow ✅**
- 5-second undo toast with progress bar
- Task status badges: Requested → In Progress → Scheduled
- createTaskFromPick() with undo mechanism

**Phase 4: Composition Intelligence ✅ (Bug Fixed Session 7)**
- Enforce 6-10 cards (returns exactly 8 picks)
- Secondary pillar mix (max 2 from related pillar)
- History boost (+10 for picks that worked)
- Essentials logic (profile completion for thin profiles)

**Bug Fix (Session 7):**
- File: `/app/backend/scoring_logic.py` line 433
- Changed: `classification.pillar` → `classification.primary_pillar`
- Impact: This was causing 0 picks to be returned

**Test Results:**
```
Grooming → care pillar: 8 picks (6 care + 2 dine)
Birthday → celebrate pillar: 8 picks (6 celebrate + 2 dine)  
Flight → travel pillar: 8 picks (6 travel + 2 stay)
```

---

## Original Problem Statement
Build a comprehensive Pet Life Operating System platform for The Doggy Company, featuring AI-powered pet care assistant (Mira), gamification elements, and a modern 7-tab header navigation system.

**Philosophy:**
- **MOJO** = The Pet's Passport / DNA - Single source of truth about the pet
- **Mira** = The Pet's Soul - AI intelligence that knows the pet
- **Concierge®** = The Pet's Hands - Human execution layer

## Core Requirements

### P0 - Critical (ALL COMPLETED ✅)
- [x] **Production Deployment Fix**
- [x] **CSS Chunk Loading Fix**
- [x] **MOJO Profile Modal - Phase 1**
- [x] **Pet OS Navigation Bar**
- [x] **Multi-Pet Switching**
- [x] **Dynamic MOJO System**
- [x] **Two-Way Memory-Soul Sync**
- [x] **MOJO Auto-Save**
- [x] **Confidence Scores & "Mira Learned" Badges**
- [x] **PICKS Auto-Refresh (B6)**
- [x] **Enhanced Pick Cards**
- [x] **PICKS Micro-Delights**
- [x] **"Why these picks?" Panel**
- [x] **Task Creation Flow**
- [x] **PICKS Composition Intelligence** (Bug Fixed Session 7)

### P1 - High Priority (COMPLETED ✅)
- [x] **TRAIT GRAPH VISUALIZATION**
- [x] **Soul Score Consistency Fix**
- [x] **Pet Life Pass Redesign**
- [x] **TODAY Panel REBUILT**

---

## 🔴 NEXT PRIORITY: SERVICES TAB

User Request: "Apply same UI/UX principles as PICKS to SERVICES tab layout"

### SERVICES Layer Current State (40%):
| Component | Status |
|-----------|--------|
| Service Launcher Cards | ⚠️ PARTIAL |
| Task Inbox | ⚠️ PARTIAL (mira_tickets) |
| Task Detail View | ⚠️ PARTIAL |
| Multi-pet Tasks | ❌ NOT BUILT |
| Orders + Tracking | ❌ NOT BUILT (API 405 error) |
| Undo + Safety UI | ❌ NOT BUILT |

### SERVICES Vision (from MOJO Bible):
1. **Service Launcher Cards** - Action entry points (Grooming, Training, Boarding, etc.)
2. **Task Inbox** - All active tasks grouped by status
3. **Task Detail View** - "Arranged for {Pet}" with constraints
4. **Multi-pet Tasks** - Pet selector inside task
5. **Orders + Tracking** - My Orders, Shipped/Delivered, Subscriptions
6. **Undo + Safety UI** - 5-second undo, calm error cards

---

## Known Issues (P2)
1. **Orders API Error:** `/api/orders` returns 405 Method Not Allowed
2. **Markdown Rendering:** Markdown syntax in chat messages not rendered

## Test Credentials
- **User:** `dipali@clubconcierge.in` / `test123`
- **Admin:** `aditya` / `lola4304` (access at `/admin`)
- **Test Pets:** Lola (63%), Mystique (72%), Bruno (29%), Luna (88%), Buddy (41%), Meister (23%), TestScoring (100%)

## Preview URL
**Working:** https://mira-picks-v2.preview.emergentagent.com/mira-demo

---

## Architecture

### Key Files Modified This Session:
- `/app/backend/scoring_logic.py` - Fixed line 433 attribute error

### PICKS Engine Files:
```
/app/backend/
├── picks_engine.py          # Main orchestrator
├── scoring_logic.py         # Ranking + composition rules (FIXED)
├── classification_pipeline.py # Intent classification
├── concierge_logic.py       # Concierge prominence
└── safety_gate.py           # Emergency/caution handling

/app/frontend/src/
├── components/Mira/
│   ├── PersonalizedPicksPanel.jsx  # PICKS UI (1550 lines)
│   └── ui/
│       ├── UndoToast.jsx           # 5-second undo
│       └── FitBadges.jsx           # Safety badges
├── utils/
│   └── picksDelights.js            # Sound + animations
└── hooks/
    └── useChatSubmit.js            # Chat + picks integration
```

---

*PRD Updated: February 14, 2026 - Session 7*
*PICKS Layer: 100% Complete*

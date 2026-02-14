# The Doggy Company - Product Requirements Document

---
## ⚠️ NEW AGENT? READ THIS FIRST:
## 1. **MIRA OS URL:** `/mira-demo` (NOT `/mira`)
## 2. **Test Credentials:** `dipali@clubconcierge.in` / `test123` | Admin: `aditya` / `lola4304`
## 3. `/app/memory/MOJO_BIBLE.md` - THE COMPLETE MOJO DEFINITION (28 Parts + OS Layers)
## 4. `/app/memory/MOJO_BIBLE_SCORECARD.md` - Current Implementation Score (100% MOJO / 92% Overall)
## 5. `/app/memory/SYSTEM_AUDIT_REPORT.md` - ✅ FULL SYSTEM AUDIT COMPLETED (Feb 2026)
---

## CURRENT SCORE: 92% (Against MOJO Bible Vision) - Updated Feb 14, 2026 (Session 8)

| Layer | Score | Status |
|-------|-------|--------|
| **MOJO (14 components)** | **100%** | ✅ **COMPLETE** |
| **TODAY** | 95% | ✅ Near-complete |
| **PICKS** | **100%** | ✅ **COMPLETE** |
| **SERVICES** | **60%** | 🔄 Foundation built |
| **LEARN** | 10% | Future |
| **CONCIERGE** | 30% | Future |

---

## SESSION 8 ACCOMPLISHMENTS (Feb 14, 2026)

### 1. PICKS Bug Fixed ✅
- File: `/app/backend/scoring_logic.py` line 433
- Changed: `classification.pillar` → `classification.primary_pillar`
- Impact: Picks were returning 0 results due to attribute error

### 2. Unified Status Taxonomy ✅
Created `/app/backend/ticket_status_system.py`:
```
Canonical Statuses:
- draft, placed
- clarification_needed, options_ready, approval_pending, payment_pending (Awaiting You)
- in_progress, scheduled
- shipped, delivered (Orders)
- completed, cancelled, unable (Terminal)
```

### 3. Services API ✅
Created `/app/backend/services_routes.py`:
- `GET /api/os/services/launchers` - 8 featured services
- `GET /api/os/services/inbox` - Tickets grouped by status
- `GET /api/os/services/awaiting` - Awaiting You shelf
- `GET /api/os/services/orders` - Orders with shipping
- `GET /api/os/services/watchlist` - For TODAY integration
- `POST /api/os/services/request` - Create request
- `PATCH /api/os/services/ticket/{id}` - User actions

### 4. Services Panel UI ✅
Created `/app/frontend/src/components/Mira/ServicesPanel.jsx`:
- Service Launchers grid (8 services)
- Awaiting You shelf (killer UX)
- Active Requests with status tabs
- Orders section
- Clean, professional UI (icons, no emojis)

---

## SERVICES REMAINING WORK (40% gap)

Per user's architecture vision:
1. **Request Builder Modal** - Tap launcher → structured form
2. **Full Ticket Detail View** - Mobile: list → detail page
3. **User Action Flows** - Confirm date, approve quote, pay
4. **Multi-pet Task UI** - Pet selector inside task
5. **Preferences Capture** - "Save groomer?" on completion
6. **Awaiting You Badge** - Notification dot on Services tab
7. **TODAY Watchlist Integration** - Use `/api/os/services/watchlist`

---

## TODAY REMAINING WORK (5% gap)

1. **Active Tasks Watchlist enrichment:**
   - "Awaiting your confirmation" - Use Services watchlist API
   - "Concierge is scheduling" - Status display
   - "Payment pending" - Status display
   - "Order shipped" - Use shipping status

2. **Stale/Offline indicator** - Show if data > 5 min old

---

## Architecture

### Key Files Added/Modified (Session 8):
```
/app/backend/
├── ticket_status_system.py  # (NEW) Canonical status taxonomy
├── services_routes.py        # (NEW) Services API at /api/os/services/*
├── scoring_logic.py          # (FIXED) line 433 attribute error
└── server.py                 # (MODIFIED) Added services_router

/app/frontend/src/
├── components/Mira/
│   └── ServicesPanel.jsx     # (NEW) Services execution layer UI
└── pages/
    └── MiraDemoPage.jsx      # (MODIFIED) Added showServicesPanel
```

### API Endpoints Summary:
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/os/services/launchers` | GET | 8 featured services |
| `/api/os/services/inbox` | GET | All tickets grouped |
| `/api/os/services/awaiting` | GET | Awaiting You |
| `/api/os/services/orders` | GET | Orders with shipping |
| `/api/os/services/watchlist` | GET | For TODAY panel |
| `/api/os/services/request` | POST | Create request |
| `/api/os/services/ticket/{id}` | GET/PATCH | Detail/actions |

---

## Known Issues (P2)

1. **Orders API Error:** `/api/orders` returns 405 Method Not Allowed
2. **Markdown Rendering:** Markdown syntax in chat messages not rendered

---

## Test Credentials

- **User:** `dipali@clubconcierge.in` / `test123`
- **Admin:** `aditya` / `lola4304` (access at `/admin`)

## Preview URL

**Working:** https://mira-picks-v2.preview.emergentagent.com/mira-demo

---

*PRD Updated: February 14, 2026 - Session 8*
*SERVICES Layer: 60% (Foundation built, UI/UX flows remaining)*

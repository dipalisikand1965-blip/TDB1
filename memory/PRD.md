# Mira OS - Pet Operating System
## Product Requirements Document (SSOT)

### Original Problem Statement
The user, Dipali, is the founder of a "pet operating system" named Mira, built in honor of her grandmother and family legacy. The application's core is "Soul Intelligence" (a pet personality questionnaire) and "Mira" (an AI concierge). The core philosophy: "No is never an answer for a concierge. Mira tells us what the pet needs - always."

---

## 🔴 CURRENT BLOCKER - MUST FIX FIRST

### Mobile Pet Selector Scrambled (P0)
**Issue**: On `/dashboard` mobile view, the pet selector pills row overflows and text is scrambled/overlapping.
**Location**: `/app/frontend/src/pages/MemberDashboard.jsx` around line 1092 (`pets.map`)
**Fix Needed**: Make pet pills horizontally scrollable with `overflow-x-auto`, add proper spacing, truncate long names.

---

## ✅ SESSION 16 COMPLETED - February 23, 2026

### 1. Multi-Pet Sync Across All Pages
**What**: When user selects a pet from dropdown, ALL pages update to show that pet's data.
**How**: 
- `PillarContext.jsx` manages global pet state
- `localStorage.selectedPetId` persists selection
- Custom event `petSelectionChanged` syncs in-window
- Storage event syncs cross-tab

**Files**:
- `/app/frontend/src/context/PillarContext.jsx` - Global pet state manager
- `/app/frontend/src/pages/DinePage.jsx` - Now uses `usePillarContext()` 
- `/app/frontend/src/pages/CelebratePage.jsx` - Already used PillarContext
- `/app/frontend/src/pages/NotificationsInbox.jsx` - Reads localStorage
- `/app/frontend/src/pages/MemberDashboard.jsx` - Saves to localStorage

### 2. WebSocket Real-Time Notifications
**What**: When user clicks concierge CTA, they get instant feedback + inbox badge updates.
**Flow**:
1. User clicks CTA → Button shows "Creating..."
2. API creates ticket → Returns `ticket_id`
3. Button shows "✓ Received" (optimistic)
4. Toast: "Request received — updating your Inbox"
5. WebSocket emits `member:ticket_created` + `member:inbox_badge`
6. Inbox badge count updates in real-time
7. Fallback: If no WS in 5s, manual refetch

**Files Created**:
- `/app/frontend/src/hooks/useMemberSocket.js` - WebSocket hook

**Files Modified**:
- `/app/backend/realtime_notifications.py` - Added member events
- `/app/backend/mira_routes.py` - Emit WS after ticket creation (line ~24730)

### 3. Pet Switcher Dropdown
**What**: Click "● Mystique" pill → Dropdown to switch pets
**Location**: `/app/frontend/src/components/Mira/GlobalNav.jsx`
**Features**:
- Pet avatars, names, breeds
- Selected pet has ✓ checkmark
- "View all pets →" link
- Syncs to localStorage + dispatches events

### 4. Notification Bell in Main Header
**What**: Bell icon with unread count badge in main Navbar
**Location**: `/app/frontend/src/components/Navbar.jsx`
**Shows**: Only for logged-in users, between user name and cart

### 5. Bug Fixes
- **"Oops" on Dashboard**: Fixed `allPets` → `pets` variable name
- **DinePage Pet Sync**: Now uses `PillarContext` instead of own state

---

## ✅ SESSION 15 COMPLETED - February 23, 2026

### 1. Nav Dropdown Z-Index Fix
- Dropdown: `z-[9999]` (was z-50)
- PetHomePage header: `z-40` (was z-50)
- File: `/app/frontend/src/components/Navbar.jsx`

### 2. Restaurant "Oops" Error Fix
- Auto-generate IDs for restaurants missing them
- Fallback image for restaurants without images
- File: `/app/backend/dine_routes.py` line ~303

### 3. Varied Card-Specific "Why" Text
**Before**: Every card said "Curated for Mystique"
**After**: Each card has trait-specific text:
- "Gentle transition for sensitive tummies"
- "Perfect gear for social butterflies"
- "Calming treats + comfort items"

**How**: Added `why_phrases` dict to each card
**Files**:
- `/app/backend/app/data/dine_concierge_cards.py`
- `/app/backend/app/data/celebrate_concierge_cards.py`

### 4. Varied Card-Specific CTA Text
**Before**: All buttons said "Create for {Pet}"
**After**: Card-specific CTAs:
- "Create plan" / "Start transition" / "Create blueprint"
- "Request reservation" / "Book experience"

**How**: Added `cta_text` field to each card

### 5. Frontend Updates
- "✨ Handpicked for {Pet}" header
- "Updated a moment ago" timestamp
- Compact card spacing (p-3)
- File: `/app/frontend/src/components/Mira/CuratedConciergeSection.jsx`

---

## ✅ SESSION 14 COMPLETED - February 23, 2026

### Concierge Card UI/UX Overhaul
1. **High-contrast design**: White titles on dark backgrounds
2. **Solid CTAs**: Pink for products, purple for services (no gradients)
3. **Golden "why" line**: `✦ Designed for Mystique's calm-and-comfortable style`
4. **Trait derivation**: Now checks `personality.temperament`, `personality.separation_anxiety`

---

## 🔲 PENDING ISSUES

### P0 - Critical
| Issue | Status | Location |
|-------|--------|----------|
| Mobile pet selector scrambled | 🔴 NOT STARTED | MemberDashboard.jsx line ~1092 |
| Verify notification inbox flow | 🟡 USER VERIFY | /notifications page |
| Mobile page scroll bug | 🟡 USER VERIFY | All pages |

### P1 - High
| Task | Status | Notes |
|------|--------|-------|
| Roll out Intelligence Layer to 11 more pillars | 🔲 NOT STARTED | Stay, Travel, Care, etc. |
| Proactive alerts on PetHomePage | 🔲 NOT STARTED | Birthdays, vaccinations |
| Razorpay integration | 🔲 NOT STARTED | Payment gateway |

### P2 - Medium
| Task | Status |
|------|--------|
| "Living Home" mechanics | 🔲 |
| Refactor server.py | 🔲 |
| Notification templates | 🔲 |

---

## ARCHITECTURE

### Frontend Stack
```
React 18 + React Router
TailwindCSS + Shadcn/UI
Framer Motion (animations)
Socket.IO Client (WebSocket)
Context: AuthContext, CartContext, PillarContext
```

### Backend Stack
```
FastAPI (Python)
MongoDB (MONGO_URL)
Socket.IO (realtime_notifications.py)
OpenAI GPT (Mira chat)
```

### Key Files Reference
```
FRONTEND:
├── /src/components/Mira/
│   ├── CuratedConciergeSection.jsx    # Concierge cards component
│   ├── GlobalNav.jsx                   # Dashboard nav + pet switcher
│   └── NotificationBell.jsx            # Bell icon component
├── /src/components/Navbar.jsx          # Main site navbar
├── /src/context/PillarContext.jsx      # Global pet state
├── /src/hooks/useMemberSocket.js       # WebSocket hook
├── /src/pages/
│   ├── MemberDashboard.jsx             # Dashboard (has mobile bug)
│   ├── NotificationsInbox.jsx          # Inbox page
│   ├── DinePage.jsx                    # Dine pillar
│   └── CelebratePage.jsx               # Celebrate pillar

BACKEND:
├── /app/data/
│   ├── dine_concierge_cards.py         # 10 dine cards
│   └── celebrate_concierge_cards.py    # 10 celebrate cards
├── /app/intelligence_layer.py          # Curation engine
├── realtime_notifications.py           # WebSocket events
├── mira_routes.py                      # /api/mira/* endpoints
└── dine_routes.py                      # /api/dine/* endpoints
```

### Key API Endpoints
```
GET  /api/mira/curated-set/{pet_id}/{pillar}  # Get concierge cards
POST /api/mira/concierge-pick/ticket          # Create ticket from CTA
POST /api/mira/curated-set/answer             # Save question answer
GET  /api/pets/my-pets                        # Get user's pets
GET  /api/dine/restaurants                    # Get restaurants
GET  /api/member/notifications/inbox/{email}  # Get inbox
```

---

## DATABASE COLLECTIONS

| Collection | Purpose |
|------------|---------|
| `pets` | Pet profiles (breed, size, allergies) |
| `users` | User accounts |
| `service_desk_tickets` | Concierge requests |
| `member_notifications` | User inbox notifications |
| `admin_notifications` | Admin alerts |
| `curated_picks_cache` | 30-min cache for picks |
| `restaurants` | Pet-friendly restaurants |
| `pet_friendly_restaurants` | Additional restaurants |

---

## TEST CREDENTIALS

```
MEMBER LOGIN:
Email: dipali@clubconcierge.in
Password: test123

ADMIN LOGIN:
Username: aditya
Password: lola4304
```

---

## INTELLIGENCE LAYER OVERVIEW

### How Cards Are Selected
1. **Load all cards** for pillar (10 cards each for celebrate/dine)
2. **Score by persona affinity** - Each card has `persona_affinity` dict with trait weights
3. **Derive traits** from multiple sources:
   - `soul_traits` (direct)
   - `doggy_soul_answers` (food_motivation, tummy_sensitivity)
   - `personality` object (temperament, separation_anxiety)
   - `temperament` field
4. **Apply breed defaults** if profile is thin
5. **Select top 3 products + 2 services** (guaranteed 3-5 cards)
6. **Generate why_for_pet** using `why_phrases` dict
7. **Cache for 30 minutes**

### Card Structure
```python
{
    "id": "dine_weekly_meal_plan",
    "type": "concierge_product",
    "name": "Weekly Meal Plan for {pet_name}",
    "description": "A 7-day feeding plan...",
    "cta_text": "Create plan",
    "why_phrases": {
        "sensitive_tummy": "Gentle meals safe for sensitive tummies",
        "picky": "Rotates flavors to keep picky eaters engaged",
        "default": "Customized 7-day feeding plan"
    },
    "persona_affinity": {
        "foodie": 0.9,
        "picky": 0.85,
        "anxious": 0.6
    }
}
```

---

## WEBSOCKET FLOW

### Member Registration
```javascript
socket.emit('register_member', { email, user_id });
// Server: Adds to connected_members dict
// Server: Emits 'member:registration_success'
```

### Ticket Creation → Notification
```
1. POST /api/mira/concierge-pick/ticket
2. Server creates ticket in service_desk_tickets
3. Server creates notification in member_notifications
4. Server emits:
   - 'member:ticket_created' { ticket_id, card_id, status }
   - 'member:inbox_badge' { unread_count }
5. Frontend updates UI optimistically
```

---

## NEXT AGENT INSTRUCTIONS

### Immediate Priority: Fix Mobile Pet Selector

1. **View the code**:
```bash
grep -n "pets.map" /app/frontend/src/pages/MemberDashboard.jsx
```

2. **Find the pet pills row** (around line 1092)

3. **Fix with**:
- Add `overflow-x-auto` to container
- Add `flex-shrink-0` to each pill
- Truncate long pet names
- Add horizontal scroll snap

4. **Test on mobile viewport** (375px width)

### After Mobile Fix

1. Roll out Intelligence Layer to remaining pillars:
   - Stay, Travel, Care, Enjoy, Fit, Learn
   - Paperwork, Advisory, Emergency, Farewell, Adopt
   
2. Each pillar needs:
   - New `{pillar}_concierge_cards.py` file
   - Integration in `intelligence_layer.py`
   - `CuratedConciergeSection` in pillar page

---

## FILES MODIFIED THIS SESSION

```
CREATED:
/app/frontend/src/hooks/useMemberSocket.js

MODIFIED:
/app/frontend/src/components/Navbar.jsx              # NotificationBell added
/app/frontend/src/components/Mira/GlobalNav.jsx      # Pet switcher dropdown
/app/frontend/src/components/Mira/CuratedConciergeSection.jsx  # WebSocket + UI
/app/frontend/src/pages/MemberDashboard.jsx          # Pet sync
/app/frontend/src/pages/NotificationsInbox.jsx       # Pet sync
/app/frontend/src/pages/DinePage.jsx                 # Uses PillarContext
/app/frontend/src/pages/CelebratePage.jsx            # Removed custom onTicketCreate
/app/backend/realtime_notifications.py               # Member WS events
/app/backend/mira_routes.py                          # WS emission
/app/backend/dine_routes.py                          # Restaurant ID fix
/app/backend/app/data/dine_concierge_cards.py        # why_phrases, cta_text
/app/backend/app/data/celebrate_concierge_cards.py   # why_phrases, cta_text
/app/backend/app/intelligence_layer.py               # Trait derivation
```

---

*Last Updated: February 23, 2026 - End of Session 16*
*Preview URL: https://dine-intelligence.preview.emergentagent.com*

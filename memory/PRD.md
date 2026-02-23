# Mira OS - Pet Operating System
## Product Requirements Document (SSOT)

### Original Problem Statement
The user, Dipali, is the founder of a "pet operating system" named Mira, built in honor of her grandmother and family legacy. The application's core is "Soul Intelligence" (a pet personality questionnaire) and "Mira" (an AI concierge). The core philosophy: "No is never an answer for a concierge. Mira tells us what the pet needs - always."

---

## ✅ SESSION 17 COMPLETED - February 23, 2026

### 1. Fixed Mobile Dashboard Header
**Issue**: Pet dashboard header was scrambled/overflowing on mobile with 12+ pets
**Fix Applied**:
- Mobile now shows "12 pets" count instead of all pet names
- Desktop shows first 4 names + "...+8 more" if many pets
- "View Soul →" shortened button text on mobile
- Pet selector pills properly scroll horizontally

**Files Modified**:
- `/app/frontend/src/pages/MemberDashboard.jsx` (lines 915-930, 1080-1097)

### 2. Concierge Hours Changed to 24/7
**Issue**: Concierge showed 9 AM - 9 PM hours
**Fix Applied**:
- Changed `DEFAULT_CONCIERGE_HOURS.is_24x7` to `true`
- Updated offline message to "We're always here for you!"
- Backend cache cleared on restart

**File Modified**:
- `/app/backend/routes/concierge_os_routes.py` (lines 111-120)

**API Response Now**:
```json
{
  "is_live": true,
  "status_text": "Live now",
  "message": "Your Concierge is ready to help 24/7",
  "hours_config": { "is_24x7": true }
}
```

### 3. Audited Inbox & Service Desk Two-Way Communication
**Verified Working**:
- Member replies → `service_desk_tickets` + `mira_tickets` + `mira_conversations`
- Admin replies → `member_notifications` + `concierge_threads` + email
- WebSocket real-time updates for both directions
- Optimistic UI on both ends

**Key Endpoints**:
- `POST /api/member/tickets/{ticket_id}/reply` - Member sends reply
- `POST /api/tickets/{ticket_id}/reply` - Admin sends reply
- Both create proper notifications and sync to all relevant collections

---

## ✅ PREVIOUS SESSIONS (Summary)

### Session 16 - Multi-Pet Sync & WebSocket Notifications
- Pet selection syncs across Dashboard, Dine, Celebrate, Inbox
- Real-time notification bell updates via WebSocket
- Optimistic UI on CTA clicks

### Session 15 - Intelligence Layer & Card Polish
- Varied `why_for_pet` explanations per card
- Card-specific `cta_text` (not generic)
- Nav dropdown z-index fix
- Restaurant "Oops" error fix

### Session 14 - Concierge Card UI/UX
- High-contrast design
- Solid CTAs (pink products, purple services)
- Golden "why" line styling

---

## 🔲 PENDING USER VERIFICATION

| Feature | Status | Test Method |
|---------|--------|-------------|
| WebSocket notification flow | 🟡 USER VERIFY | Click CTA → Check bell count |
| Multi-pet sync | 🟡 USER VERIFY | Switch pet → Navigate pages |
| Mobile scroll-to-top | 🟡 USER VERIFY | Navigate between pages on mobile |

---

## 🔲 UPCOMING TASKS

### P0 - Next Sprint
- Roll out Intelligence Layer to remaining 11 pillars (Stay, Travel, Care, etc.)
- Each needs: `{pillar}_concierge_cards.py` + integration in `intelligence_layer.py`

### P1 - High Priority
- Proactive alerts on PetHomePage (birthdays, vaccinations)
- Razorpay payment integration

### P2 - Medium Priority
- "Living Home" dynamic refresh mechanics
- Refactor `server.py` into smaller modules
- Consolidate fragmented database collections

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
├── /src/pages/MemberDashboard.jsx        # Fixed mobile header
├── /src/pages/NotificationsInbox.jsx     # Member inbox
├── /src/pages/TicketThread.jsx           # Conversation view
├── /src/components/admin/DoggyServiceDesk.jsx  # Admin service desk
├── /src/context/PillarContext.jsx        # Global pet state
└── /src/hooks/useMemberSocket.js         # WebSocket hook

BACKEND:
├── /routes/concierge_os_routes.py        # 24/7 hours config
├── /ticket_routes.py                      # Two-way reply sync
├── /server.py                             # Member reply endpoint
└── /realtime_notifications.py            # WebSocket events
```

### Key API Endpoints
```
GET  /api/os/concierge/status              # Returns is_live: true (24/7)
POST /api/member/tickets/{id}/reply        # Member sends reply
POST /api/tickets/{id}/reply               # Admin sends reply
GET  /api/member/notifications/inbox/{email}  # Get inbox
POST /api/mira/concierge-pick/ticket       # Create from CTA
```

---

## DATABASE COLLECTIONS

| Collection | Purpose |
|------------|---------|
| `pets` | Pet profiles (breed, size, allergies) |
| `users` | User accounts |
| `service_desk_tickets` | Canonical ticket store |
| `mira_tickets` | Ticket spine (synced) |
| `mira_conversations` | Chat history |
| `member_notifications` | User inbox |
| `admin_notifications` | Concierge alerts |
| `curated_picks_cache` | 30-min cache for picks |
| `concierge_threads` | Two-way chat threads |

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
1. Load all cards for pillar (10 cards each)
2. Score by persona affinity weights
3. Derive traits from multiple sources (soul_traits, personality, temperament)
4. Apply breed defaults if thin profile
5. Select top 3 products + 2 services
6. Generate personalized `why_for_pet`
7. Cache for 30 minutes

### Pillars Implemented
- ✅ Celebrate
- ✅ Dine
- 🔲 Stay, Travel, Care, Enjoy, Fit, Learn, Paperwork, Advisory, Emergency, Farewell, Adopt

---

## WEBSOCKET FLOW

### Member Side
```
1. useMemberSocket.js connects on page load
2. Emits 'register_member' with userEmail
3. Listens for 'new_notification', 'inbox_badge'
4. Updates bell count in real-time
```

### Admin Side
```
1. useServiceDeskSocket.js connects
2. Listens for 'new_ticket', 'member_reply'
3. Shows toast notifications
4. Real-time ticket updates
```

---

*Last Updated: February 23, 2026 - End of Session 17*
*Preview URL: https://mira-soul.preview.emergentagent.com*

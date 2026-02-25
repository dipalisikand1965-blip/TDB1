# The Doggy Company - Pet Life Operating System (PRD)

## Original Problem Statement
Build "The Doggy Company" into a "Pet Life Operating System" where the AI assistant Mira behaves with a "soul" and contextual understanding of a human assistant. The application should have a "Unified Service Flow" where any user intent creates a service ticket, accessible from every part of the application.

## Core Architecture
- **Frontend:** React, Tailwind CSS, Socket.IO Client
- **Backend:** FastAPI, Asyncio
- **Database:** MongoDB Atlas
- **AI:** LLM-based conversational AI with deep context injection (Emergent LLM Key)

## Key Features Implemented
- ✅ Soulful AI (Mira) with full pet context injection
- ✅ META Proactive OS System for contextual alerts
- ✅ Unified Service Flow architecture
- ✅ Real-time WebSocket notifications
- ✅ FavoritesPanel with Universal Service Command hook (fixed 2025-02-25)

## Completed Work
- **2025-02-25:** Fixed compilation error in `FavoritesPanel.jsx` - incorrect import of `useUniversalServiceCommand`

## In Progress
- [ ] P0: User verification of Unified Service Flow in Favorites Panel (code complete)
- [ ] P1: "Celebrate" flow advisory detection refinement

## Known Issues
1. **Pet Soul Score not updating in UI** (P2) - Score should increment after AI interactions
2. **Password visibility toggle broken** (P3) - Non-functional on login page
3. **Admin vs Member inbox confusion** (P4) - UX clarity needed

## Upcoming Tasks
- Build "Paw Points" redemption flow at checkout
- Build distinct UIs for OS tabs (Picks, Services, Concierge)
- Add "Admin Notifications" tab in `/admin`

## Backlog
- WhatsApp Business integration
- Build 'Fit' and 'Work' pillars
- Premium "Club" membership features
- Refactor `mira_routes.py` (14,000+ lines)
- Decompose `MiraDemoPage.jsx`

## Key Files
- `frontend/src/components/Mira/FavoritesPanel.jsx` - Favorites with service flow
- `frontend/src/hooks/useUniversalServiceCommand.js` - Universal service hook
- `backend/routes/mira_routes.py` - Core AI logic (needs refactoring)
- `backend/services/mira/mira_memory_assembler.py` - Pet context assembly

## API Endpoints
- `POST /api/mira/chat` - AI chat
- `GET /api/proactive/alerts/{pet_id}` - META proactive alerts
- `POST /api/service-requests` - Unified Service Flow

## Test Credentials
- User: `dipali@clubconcierge.in` / `test123`
- Admin: `aditya` / `lola4304`

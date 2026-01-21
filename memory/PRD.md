# The Doggy Company - Product Requirements Document
## Pet Life Operating System

---

## Original Problem Statement
The Doggy Company is building a "Pet Life Operating System" with 12 business "Pillars". The core vision includes a deep "Pet Soul" profile for each pet, a "Unified Inbox," a mandatory "Membership" layer, and a central "Mira AI" concierge.

---

## What's Been Implemented

### Phase 1 & 2: Mira AI Concierge System (January 21, 2026)

**Core Backend (`/app/backend/mira_routes.py`)**:
- ✅ GPT-5.1 integration via Emergent LLM Key
- ✅ Every interaction creates a Service Desk ticket (Advisory/Concierge/Emergency)
- ✅ Pet-first context loading - always loads Pet Soul before responding
- ✅ Pillar intent detection for all 12 pillars
- ✅ Minimum question logic - never asks for info already in Pet Soul
- ✅ Ticket upgrade capability (Advisory → Concierge)
- ✅ Emergency detection with immediate escalation
- ✅ Pet Soul progressive enrichment (saves new preferences)

**Ticket System**:
- Advisory tickets (Exploring) - for questions and exploration
- Concierge tickets (Acknowledged → In Progress → Confirmed) - for booking requests
- Emergency tickets (Immediate Action) - for urgent situations
- All tickets stored in `mira_tickets` collection with full Pet Soul snapshot

**Frontend - Contextual Panel (`/app/frontend/src/components/MiraContextPanel.jsx`)**:
- ✅ Appears on pillar pages (Travel, Stay, Care, Dine, Enjoy)
- ✅ Desktop: Right-side sticky panel
- ✅ Mobile: Bottom slide-up drawer
- ✅ Shows personalized "Mira's note" with pet name
- ✅ Pet badge with breed info
- ✅ "Ask Mira" quick chat button
- ✅ "Plan My [Pillar]" full chat button
- ✅ Product suggestions based on pillar and Pet Soul

**Frontend - Full-Screen Ask Mira (`/app/frontend/src/pages/MiraPage.jsx`)**:
- ✅ Route: `/ask-mira` (no navbar/footer)
- ✅ Premium chat UI with message history
- ✅ Pet Soul sidebar showing user's pets
- ✅ Pet profile data (breed, gender, travel style, crate trained, handling)
- ✅ Quick action pills (Travel, Stay, Care, Dine, Celebrate, Advice)
- ✅ Ticket ID displayed in header
- ✅ Pillar badge when detected
- ✅ Emergency Help button
- ✅ "Every conversation creates a service desk ticket" note

### Previous Implementations

**Service Desk**:
- ✅ Fully functional admin service desk
- ✅ JWT token authentication
- ✅ Reply to tickets capability
- ✅ AI draft suggestions

**Automatic Database Seeding**:
- ✅ Runs on every deployment
- ✅ Default admin/user accounts
- ✅ Product catalog

**Pillar-Wide Reporting**:
- ✅ All 12 pillars in Live MIS dashboard
- ✅ Custom date range picker

**Unified Inbox**:
- ✅ Receives from Stay, Dine, and now Mira tickets

**Pet Profile**:
- ✅ Multi-step creation form
- ✅ Multi-pet support
- ✅ Pet Soul data collection

---

## API Endpoints

### Mira AI Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/mira/chat` | POST | Main chat endpoint - creates/updates tickets |
| `/api/mira/context` | POST | Get personalized context for pillar pages |
| `/api/mira/tickets` | GET | List all Mira tickets (admin) |
| `/api/mira/session/{session_id}` | GET | Get session with ticket data |
| `/api/mira/pillars` | GET | Get pillar configurations |
| `/api/mira/stats` | GET | Get conversation statistics |

---

## Database Collections

### mira_tickets
```javascript
{
  ticket_id: "CNC-20260121-0001",
  mira_session_id: "mira-page-xxx",
  ticket_type: "concierge", // advisory, concierge, emergency
  pillar: "travel",
  urgency: "medium",
  status: "acknowledged",
  member: { id, name, email, phone, membership_tier },
  pet: { id, name, breed, age },
  pet_soul_snapshot: { /* Full Pet Soul data */ },
  messages: [{ id, type, content, sender, timestamp }],
  ai_context: { pillar_detected, urgency_detected, intent_detected },
  visible_in_inbox: true,
  visible_in_mira_folder: true,
  created_at, updated_at
}
```

---

## Prioritized Backlog

### P0 - Critical
- [ ] Complete Mira AI Phase 3: Learning & Intelligence
  - Passive learning from browsing signals
  - Active learning with explicit statements
  - Pet Soul progressive enrichment with confidence levels
- [ ] Fix Voice Order "Connection failed" error
- [ ] Fix Shopify Sync "Untitled" products issue

### P1 - High Priority
- [ ] WhatsApp Business API integration for Unified Inbox
- [ ] Complete server.py refactoring (extract to routes/)
- [ ] Re-enable authentication gating before go-live

### P2 - Medium Priority
- [ ] Add Mira panel to remaining pillar pages (Fit, Advisory, Paperwork, Club)
- [ ] Pet Soul Weekly Question feature
- [ ] Centralized Product Management System

### P3 - Future
- [ ] Multi-channel Mira (Voice, WhatsApp, Email)
- [ ] Member Management features
- [ ] Standardize Admin Managers for all 12 pillars

---

## Test Credentials
- **Admin**: aditya / lola4304
- **Test User**: dipali@clubconcierge.in / lola4304
- **Test Pets**: Mojo (Indie), Mystique (Shihtzu)

---

## Technical Notes

### Mira AI Integration
- Uses Emergent LLM Key with GPT-5.1
- Temperature not supported (GPT-5.x only supports temperature=1)
- Session-based conversation history
- Pet Soul data loaded automatically for logged-in users

### Routes Without Navbar/Footer
- `/ask-mira` - Full-screen Mira page
- `/admin/service-desk` - Full-screen service desk
- `/membership` - Membership landing
- `/agent` - Agent portal

---

*Last Updated: January 21, 2026*

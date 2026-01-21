# The Doggy Company - Product Requirements Document
## Pet Life Operating System

---

## Original Problem Statement
The Doggy Company is building a "Pet Life Operating System" with 12 business "Pillars". The core vision includes a deep "Pet Soul" profile for each pet, a "Unified Inbox," a mandatory "Membership" layer, and a central "Mira AI" concierge.

---

## What's Been Implemented

### Mira AI Concierge System - COMPLETE (January 21, 2026)

#### Phase 1: Core Backend (`/app/backend/mira_routes.py`)
- ✅ GPT-5.1 integration via Emergent LLM Key
- ✅ Every interaction creates a Service Desk ticket (Advisory/Concierge/Emergency)
- ✅ Pet-first context loading - always loads Pet Soul before responding
- ✅ Pillar intent detection for all 12 pillars
- ✅ Minimum question logic - never asks for info already in Pet Soul
- ✅ Ticket upgrade capability (Advisory → Concierge)
- ✅ Emergency detection with immediate escalation
- ✅ Pet Soul progressive enrichment

#### Phase 2: UI Placements - ALL 12 PILLARS
- ✅ **Contextual Panel** (`MiraContextPanel.jsx`) on:
  - Travel, Stay, Care, Dine, Enjoy, Fit, Advisory, Paperwork, Emergency
- ✅ **Full-Screen Ask Mira** (`/ask-mira`) - Premium chat experience
- ✅ **Global floating button** in MiraAI widget

#### Phase 3: Intelligence Engine (`/app/backend/mira_intelligence.py`)
- ✅ **Passive Learning** - Tracks browsing signals (views, clicks, filters, add-to-cart)
- ✅ **Predictive Recommendations** - Based on Pet Soul + behavior patterns
- ✅ **Cross-Pillar Intelligence** - Connects insights across service areas
- ✅ **Learning from Outcomes** - Tracks accepted/rejected recommendations
- ✅ **Proactive Triggers** - Birthday reminders, vaccine alerts, reorder suggestions

#### Frontend Hooks
- ✅ `useMiraSignal.js` - Hook for passive learning signal tracking

---

## API Endpoints

### Mira AI Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/mira/chat` | POST | Main chat - creates/updates tickets |
| `/api/mira/context` | POST | Get personalized context for pillar pages |
| `/api/mira/tickets` | GET | List all Mira tickets (admin) |
| `/api/mira/session/{id}` | GET | Get session with ticket data |
| `/api/mira/pillars` | GET | Get pillar configurations |

### Intelligence Engine Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/mira/intelligence/signal` | POST | Record browsing behavior |
| `/api/mira/intelligence/recommendations/{pet_id}` | GET | Get personalized recommendations |
| `/api/mira/intelligence/cross-pillar/{user_id}` | GET | Cross-pillar insights |
| `/api/mira/intelligence/feedback` | POST | Record recommendation feedback |
| `/api/mira/intelligence/effectiveness` | GET | Recommendation metrics |
| `/api/mira/intelligence/triggers/{user_id}` | GET | Proactive notification triggers |

---

## Database Collections

### mira_tickets
```javascript
{
  ticket_id: "CNC-20260121-0001",
  mira_session_id: "mira-page-xxx",
  ticket_type: "concierge",
  pillar: "travel",
  status: "acknowledged",
  member: { id, name, email, phone },
  pet: { id, name, breed },
  pet_soul_snapshot: { /* Full Pet Soul */ },
  messages: [{ id, type, content, sender, timestamp }]
}
```

### mira_signals (Passive Learning)
```javascript
{
  user_id: "user-xxx",
  page: "travel",
  action: "view_product",
  target: "travel-kit-001",
  metadata: { timestamp, url },
  processed: false
}
```

### mira_inferences (Learned Preferences)
```javascript
{
  user_id: "user-xxx",
  inferences: [{
    field: "preferences.likely_flavor",
    value: "chicken",
    confidence: "low",
    source: "inferred"
  }]
}
```

---

## Prioritized Backlog

### P0 - Critical (DONE)
- ✅ Mira AI complete across all pillars
- ✅ Intelligence Engine with passive learning
- ✅ Personalized recommendations

### P1 - High Priority
- [ ] WhatsApp Business API integration for Unified Inbox
- [ ] Voice Order fix - "Connection failed" error
- [ ] Shopify Sync fix - "Untitled" products issue

### P2 - Medium Priority
- [ ] Multi-channel Mira (Voice input, WhatsApp handoff)
- [ ] Proactive outreach via WhatsApp/Email
- [ ] Complete server.py refactoring

### P3 - Future
- [ ] Learning from Outcomes visualization (admin dashboard)
- [ ] A/B testing for recommendations
- [ ] Pet Soul Weekly Question feature

---

## Test Credentials
- **Admin**: aditya / lola4304
- **Test User**: dipali@clubconcierge.in / lola4304
- **Test Pets**: Mojo (Indie), Mystique (Shihtzu)

---

## Technical Notes

### Mira Intelligence Signal Types
- `view_product` - User viewed a product page
- `add_to_cart` - User added item to cart
- `filter_used` - User applied a filter
- `pillar_visit` - User visited a pillar page
- `search` - User searched for something

### Confidence Levels
- **high** - User explicitly stated (in chat or form)
- **medium** - User took action (purchase, booking)
- **low** - User browsed but didn't act

### Routes Without Navbar/Footer
- `/ask-mira` - Full-screen Mira page
- `/admin/service-desk` - Full-screen service desk
- `/membership` - Membership landing

---

*Last Updated: January 21, 2026*

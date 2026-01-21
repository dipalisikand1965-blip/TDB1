# The Doggy Company - Product Requirements Document
## Pet Life Operating System

---

## THE DOCTRINE (Foundational Principles)

> **"The longer a pet lives with us, the less their parent has to explain."**

### Core Truths
1. **No member without a pet** - Membership requires at least one registered pet
2. **Pet Parent (Hooman)** is the account; **Pet Soul** is the intelligence
3. **Every system** must read/write Pet Soul
4. **Mira AI** must use Pet Soul context live
5. **Questions are progressive**, never repetitive
6. **Recognition > Recommendation**
7. **Silence is better than irrelevant messaging**

---

## Original Problem Statement
The Doggy Company is building a "Pet Life Operating System" with 12 business "Pillars". The core vision includes a deep "Pet Soul" profile for each pet, a "Unified Inbox," a mandatory "Membership" layer, and a central "Mira AI" concierge.

---

## What's Been Implemented

### Mira AI Concierge System - ENHANCED (January 21, 2026)

#### Phase 1: Core Backend (`/app/backend/mira_routes.py`)
- ✅ GPT-5.1 integration via Emergent LLM Key
- ✅ Every interaction creates a Service Desk ticket (Advisory/Concierge/Emergency)
- ✅ Pet-first context loading - always loads Pet Soul before responding
- ✅ Pillar intent detection for all 12 pillars
- ✅ Minimum question logic - never asks for info already in Pet Soul
- ✅ Ticket upgrade capability (Advisory → Concierge)
- ✅ Emergency detection with immediate escalation
- ✅ Pet Soul progressive enrichment
- ✅ **NEW: Research Mode** - Detects factual queries and provides sourced information
- ✅ **NEW: Context-Aware Quick Prompts** - Pillar-specific suggestions
- ✅ **NEW: Cross-Pillar Context** - Acknowledges pillar transitions
- ✅ **NEW: Chat History & Session Management** - New conversation, history retrieval
- ✅ **NEW: Known Fields Section** - Mira sees exactly what she knows, never re-asks

#### Phase 2: UI Placements - ALL 12 PILLARS
- ✅ **Contextual Panel** (`MiraContextPanel.jsx`) on:
  - Travel, Stay, Care, Dine, Enjoy, Fit, Advisory, Paperwork, Emergency, Celebrate
- ✅ **Full-Screen Ask Mira** (`/ask-mira`) - Premium chat experience
- ✅ **Global floating button** in MiraAI widget
- ✅ **NEW: Voice Input** - Web Speech API integration for speech-to-text
- ✅ **NEW: Pillar-Specific Quick Prompts** - Travel shows travel prompts, Care shows care prompts, etc.
- ✅ **NEW: New Chat & History Buttons** - Visible in widget and full page
- ✅ **NEW: Celebrate Page Hero** - Category-specific headers with dynamic images

#### Phase 3: Intelligence Engine (`/app/backend/mira_intelligence.py`)
- ✅ **Passive Learning** - Tracks browsing signals (views, clicks, filters, add-to-cart)
- ✅ **Predictive Recommendations** - Based on Pet Soul + behavior patterns
- ✅ **Cross-Pillar Intelligence** - Connects insights across service areas
- ✅ **Learning from Outcomes** - Tracks accepted/rejected recommendations
- ✅ **Proactive Triggers** - Birthday reminders, vaccine alerts, reorder suggestions

#### Phase 4: Soul Intelligence Engine (`/app/backend/soul_intelligence.py`) - NEW
- ✅ **Known Fields Detection** - Tracks all known Pet Soul fields
- ✅ **Advanced Enrichment Extraction** - Regex-based extraction from conversations
- ✅ **Behavioral Inference** - Learn from orders, returns, patterns
- ✅ **Intelligent Commerce Filtering** - Exclude products based on allergies, age, size
- ✅ **Soul Completeness Calculation** - Weighted scoring of essential/important/nice fields
- ✅ **Weekly Drip Question Selection** - Contextual, priority-based questions

#### Phase 5: Pet-First Gating (`/app/backend/pet_gate_routes.py`) - NEW
- ✅ **Pet Requirement Check** - /api/pet-gate/check
- ✅ **Action-Specific Messaging** - Different messages for checkout, chat, booking
- ✅ **Soul Drip Endpoints** - /api/soul-drip/next-question, /api/soul-drip/respond
- ✅ **Soul Completeness API** - /api/soul-drip/completeness/{pet_id}
- ✅ **Commerce Filtering API** - /api/pet-gate/filter-products/{pet_id}

#### Frontend Components
- ✅ `useMiraSignal.js` - Hook for passive learning signal tracking
- ✅ `usePetGate.js` - Hook for pet-first gating
- ✅ `PetGateModal.jsx` - "Add Your Pet First" modal

---

## API Endpoints

### Mira AI Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/mira/chat` | POST | Main chat - creates/updates tickets, includes research mode |
| `/api/mira/context` | POST | Get personalized context for pillar pages |
| `/api/mira/tickets` | GET | List all Mira tickets (admin) |
| `/api/mira/session/{id}` | GET | Get session with ticket data |
| `/api/mira/session/new` | POST | **NEW:** Create new conversation session |
| `/api/mira/history` | GET | **NEW:** Get user's past conversation history |
| `/api/mira/quick-prompts/{pillar}` | GET | **NEW:** Get pillar-specific quick prompts |
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
  messages: [{ id, type, content, sender, timestamp, research_mode }]
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
- ✅ **Pet Soul Journey for Logged-in Members** - COMPLETED Jan 21, 2026

### P1 - High Priority
- [x] ~~Celebrate page hero section~~ - COMPLETED Jan 21, 2026
- [x] ~~Admin Pets endpoint fix~~ - COMPLETED Jan 21, 2026
- [x] ~~Add missing pillars to admin~~ - COMPLETED Jan 21, 2026
- [x] ~~Membership page personalization~~ - COMPLETED Jan 21, 2026
- [ ] WhatsApp Business API integration for Unified Inbox
- [ ] Voice Order fix - "Connection failed" error
- [ ] Shopify Sync fix - "Untitled" products issue
- [ ] Checkout form validation feedback

### P2 - Medium Priority
- [ ] Multi-channel Mira (Voice input, WhatsApp handoff)
- [ ] Proactive outreach via WhatsApp/Email
- [ ] Complete server.py refactoring
- [ ] Consolidate Membership.jsx and MembershipPage.jsx

### P3 - Future
- [ ] Learning from Outcomes visualization (admin dashboard)
- [ ] A/B testing for recommendations
- [ ] Pet Soul Weekly Question via WhatsApp
- [ ] Commerce filtering based on Pet Soul (allergies, age)

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

## Changelog

### January 21, 2026 (Session 3)
- ✅ **Pet Soul Journey Redesign** - Complete redesign per user's "Living Portrait" spec:
  - Stage-based display (0-20%, 20-50%, 50-80%, 80-100%)
  - "How well we understand [Pet]" instead of completion percentage
  - 8 Pillars show insights, not raw percentages
  - "What We've Learned" timeline with source tags (From you, From behaviour, From Mira)
  - Quiet achievements (only at Stage 3+, no gamification)
  - Personalized care insights (NOT product pushes)
  - Single gentle next step question
- ✅ **Service Desk AI Fix** - Fixed NoneType error in ticket AI draft when pet info is missing
- ✅ **Ticket Click Handler** - Added missing onClick to ticket cards in Service Desk
- ✅ **Context-Aware Homepage CTAs** - "Become a Member" only for guests; logged-in users see "Start Your Pet Soul"

### January 21, 2026 (Session 2)
- ✅ **Celebrate Page Hero** - Added category-specific hero sections with dynamic backgrounds, badges, and MiraContextPanel placement
- ✅ **Admin Pets Endpoint** - Fixed Pydantic validation error in `/api/admin/pets` (added `Depends(security)` to verify_admin)
- ✅ **Admin Blog Posts** - Reseeded and verified 6 blog posts working
- ✅ **Admin Mira Tickets** - Verified 73 open tickets visible in Service Desk
- ✅ **Admin Pillars** - Added "Live MIS" and "Pricing, Shipping & Commercial Hub" to AgentManagement, PricingHub, ServiceDesk

### January 21, 2026 (Session 1)
- ✅ Production deployment fix with getApiUrl() workaround
- ✅ Mira AI Research Mode
- ✅ Context-aware quick prompts
- ✅ Voice input UI
- ✅ Session management for chat history

---

*Last Updated: January 21, 2026*

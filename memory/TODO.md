# The Doggy Company - Comprehensive To-Do List
## Ordered by Priority

*Last Updated: January 21, 2026*

---

## 🚨 IMMEDIATE (Post-Deployment)

### 1. Database Initialization
- [ ] **After deployment completes**, visit: `https://thedoggycompany.in/api/init-database`
- [ ] Verify admin login works: `aditya` / `lola4304`
- [ ] Verify test user works: `dipali@clubconcierge.in` / `lola4304`
- [ ] Confirm products are loading (575 products expected)

### 2. Smoke Test Checklist
- [ ] Homepage loads with products
- [ ] Can browse pillars (Travel, Stay, Care, etc.)
- [ ] Mira chat opens and responds
- [ ] Admin panel accessible at `/admin`
- [ ] Service Desk loads tickets

---

## 🔴 P0 - CRITICAL BUGS

### Bug 1: Voice Order "Connection Failed"
- **Status**: NOT STARTED
- **Location**: `frontend/src/pages/VoiceOrder.jsx`
- **Issue**: Fetch call failing, shows "Connection failed" error
- **Debug Steps**:
  1. Check the fetch URL in VoiceOrder.jsx
  2. Verify backend voice endpoint exists
  3. Add better error handling to show specific error
- **Impact**: Key feature unusable

### Bug 2: Checkout "Please fill required fields" Error
- **Status**: NOT STARTED
- **Location**: `frontend/src/pages/Checkout.jsx`
- **Issue**: Generic error, doesn't specify which fields
- **Fix**: Update toast.error to list specific missing fields
- **Impact**: Users can't complete purchases

### Bug 3: Shopify Sync Creating "Untitled" Products
- **Status**: NOT STARTED (Recurring 9+ times)
- **Location**: `backend/server.py` → `transform_shopify_product` function
- **Issue**: Products syncing without titles
- **Debug Steps**:
  1. Add defensive logging to capture raw Shopify payload
  2. Check if title field is missing or malformed
  3. Add validation before insert
- **Impact**: Pollutes product catalog

---

## 🟡 P1 - HIGH PRIORITY FEATURES

### Feature 1: WhatsApp Business API Integration
- **Goal**: Connect WhatsApp to Service Desk unified inbox
- **Requirements**:
  - Virtual WhatsApp number
  - Messages appear in Service Desk
  - Agents can respond from Service Desk
  - Mira can hand off to WhatsApp
- **Integration**: Use `integration_playbook_expert_v2` for setup
- **Files to modify**:
  - `backend/ticket_routes.py` - Add WhatsApp channel
  - `frontend/src/components/admin/ServiceDesk.jsx` - Add WhatsApp UI

### Feature 2: Re-enable Authentication Gating
- **Location**: `frontend/src/components/ProtectedRoute.jsx`
- **Issue**: Auth logic is commented out
- **Task**: Re-enable and test all protected routes
- **Before Go-Live**: MUST DO

### Feature 3: Deepen Mira Intelligence
- **Ideas to discuss with user**:
  - Sentiment analysis from chat
  - Predictive reordering suggestions
  - Cross-family pet recommendations
  - Seasonal/weather-based suggestions
  - Life-stage specific advice (puppy → adult → senior)

---

## 🟢 P2 - MEDIUM PRIORITY

### Refactoring Tasks

#### Server.py Breakdown
Current `server.py` is 9000+ lines. Extract into modules:
- [ ] `backend/routes/orders.py` - Order management
- [ ] `backend/routes/products.py` - Product CRUD
- [ ] `backend/routes/users.py` - User management
- [ ] `backend/routes/carts.py` - Cart operations
- [ ] `backend/services/email_service.py` - Email templates
- [ ] `backend/services/notification_service.py` - Push/SMS

#### ServiceDesk.jsx Breakdown
Current file is very large. Extract:
- [ ] `TicketCard.jsx` - Individual ticket display
- [ ] `TicketFilters.jsx` - Filter controls
- [ ] `AIDraftPanel.jsx` - AI draft modal
- [ ] `TicketTimeline.jsx` - Message history

### Feature Improvements

#### Mira Enhancements (Completed items ✅)
- [x] Research Mode - Web search for factual queries
- [x] Context-aware quick prompts per pillar
- [x] Voice input (Web Speech API)
- [x] Chat history & session management
- [x] Cross-pillar context awareness
- [x] New conversation button

#### Mira Future Enhancements
- [ ] WhatsApp handoff from Mira
- [ ] Proactive outreach via WhatsApp/Email
- [ ] Voice output (Text-to-Speech)
- [ ] Multi-language support

---

## 🔵 P3 - FUTURE / BACKLOG

### Pet Soul Enhancements
- [ ] Pet Soul Weekly Question feature
- [ ] Pet Soul completion score
- [ ] Pet Soul sharing (public profiles)
- [ ] Pet family tree / relationships

### Member Management
- [ ] Member dashboard with usage stats
- [ ] Membership tier upgrade flow
- [ ] Referral program
- [ ] Loyalty points system

### Admin Enhancements
- [ ] Centralized Product Management System
- [ ] Standardize Admin Managers for all 12 pillars
- [ ] Recommendation effectiveness dashboard
- [ ] A/B testing framework

### Analytics & Reporting
- [ ] Learning from Outcomes visualization
- [ ] Conversion funnel tracking
- [ ] Customer lifetime value tracking
- [ ] Pillar usage heatmaps

---

## 📋 INTEGRATION CHECKLIST

### Currently Integrated ✅
| Integration | Status | Notes |
|-------------|--------|-------|
| MongoDB | ✅ Active | Via MONGO_URL |
| Resend Email | ✅ Active | Transactional emails |
| Razorpay | ✅ Test Keys | Payment gateway |
| Shopify Sync | ⚠️ Buggy | Untitled products issue |
| OpenAI GPT-5.1 | ✅ Active | Via Emergent LLM Key |

### Pending Integrations
| Integration | Priority | Use Case |
|-------------|----------|----------|
| WhatsApp Business | P1 | Unified inbox |
| Google Calendar | P2 | Booking sync |
| Twilio SMS | P3 | SMS notifications |

---

## 🔑 CREDENTIALS

### Admin Access
- **Username**: `aditya`
- **Password**: `lola4304`
- **URL**: `https://thedoggycompany.in/admin`

### Test User
- **Email**: `dipali@clubconcierge.in`
- **Password**: `lola4304`
- **Pets**: Mojo (Indie), Mystique (Shihtzu)

### API Keys (in backend/.env)
- EMERGENT_LLM_KEY: ✅ Configured
- RESEND_API_KEY: ✅ Configured
- RAZORPAY_KEY_ID: ⚠️ Test keys only

---

## 📁 KEY FILES REFERENCE

### Backend
```
/app/backend/
├── server.py              # Main server (needs refactoring)
├── mira_routes.py         # Mira AI endpoints
├── mira_intelligence.py   # Recommendation engine
├── ticket_routes.py       # Service desk
├── admin_routes.py        # Admin APIs
└── .env                   # Environment config
```

### Frontend
```
/app/frontend/src/
├── components/
│   ├── MiraAI.jsx           # Floating chat widget
│   ├── MiraContextPanel.jsx # Pillar sidebar
│   └── admin/
│       └── ServiceDesk.jsx  # Service desk UI
├── pages/
│   ├── MiraPage.jsx         # Full Ask Mira page
│   └── [PillarName]Page.jsx # 12 pillar pages
└── hooks/
    └── useMiraSignal.js     # Passive learning hook
```

---

## ✅ RECENTLY COMPLETED (Jan 21, 2026)

1. **Mira Research Mode** - Detects factual queries, provides sourced info
2. **Context-Aware Quick Prompts** - Pillar-specific suggestions
3. **Voice Input** - Web Speech API integration
4. **Chat History & Sessions** - New conversation, history endpoints
5. **Cross-Pillar Context** - Acknowledges pillar transitions
6. **All 12/12 backend tests passing**

---

*This document should be updated after each major feature completion or bug fix.*

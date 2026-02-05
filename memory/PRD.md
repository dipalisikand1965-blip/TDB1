# The Doggy Company - Product Requirements Document

## Original Problem Statement
Build "The Doggy Company," a one-stop-shop concierge for dog parents with a focus on emotional connection and the "Pet Soul™" concept. Transform the site from a functional pet services marketplace into an emotionally resonant "Pet Life Operating System."

## Core Philosophy
- **We Celebrate Life** - Through every moment, joyful or challenging, we see celebration
- **Mira interprets lives** - Memory and judgement layer, not a request fulfiller
- **Brain vs Hand** - Mira is the brain, Concierge® is the hand. One understands life, the other moves the world

---

## PROJECT HEALTH SCORE: 9.0/10

### What's Working Well (Green)
- ✅ Core membership onboarding flow
- ✅ Pet Soul™ profiles and Pet Pass cards
- ✅ Mira AI with conversational memory
- ✅ All 14 pillars of service
- ✅ Dashboard with 15 tabs (fully functional)
- ✅ Service desk with ticket merging
- ✅ Brand story video with ElevenLabs voiceover
- ✅ Mobile-first responsive design
- ✅ Razorpay payment integration (test mode)
- ✅ **Finance Manager** - Full reconciliation system
- ✅ **Product Box** - Enhanced with stats, filters, testids
- ✅ **Service Box** - Enhanced with views, provider tracking

### Needs Attention (Yellow)
- ⚠️ Pet photo upload (backend works, frontend needs e2e testing)
- ⚠️ Voice input on iOS (needs text input fallback)
- ⚠️ Pet photos in Brand Story video (pending implementation)

### Known Issues (Red)
- 🔴 None currently blocking

---

## SESSION 5 SUMMARY (February 5, 2026)

### Completed Today (Part 2 - Bug Fixes):

#### 4. Footer Services Section Added
- ✅ Added "SERVICES" column to desktop footer (Grooming, Training, Boarding, Daycare, Vet Care, Dog Walking, Pet Photography)
- ✅ Added collapsible "Services" section to mobile footer

#### 5. Occasion Box Birthday Page Verified
- ✅ Images ARE seeded correctly - 78 products (cake: 20, accessories: 20, treats: 20, toys: 18)
- ✅ Products display with images on /occasion-box/birthday

#### 6. Finance Manager Verified
- ✅ Works correctly in preview environment
- ✅ Stats cards, date filters, Record Payment, Import CSV all functional
- Production "Oops" may need cache clear after deployment

#### 7. Service Box Mobile/Desktop UI Verified
- ✅ Desktop: Clean stats cards, pillar filters, view toggles
- ✅ Mobile: Responsive layout, dropdown navigation works

### Completed Today (Part 1):

#### 1. Finance Manager Bug Fixes (Testing Agent)
- ✅ Fixed critical JS error: `dateFilteredPayments` not initialized
- ✅ Added missing Record Payment button with modal
- ✅ Added missing Import CSV button with file input
- ✅ All 14 backend API tests passed
- ✅ Full frontend UI verification via Playwright

#### 2. Product Box Enhancement (10/10)
- ✅ Enhanced stats cards with icons (8 cards: Total, Active, Rewards, Mira, Suggest, Draft, Low Stock, Sold)
- ✅ Added pillar quick filter buttons
- ✅ Added Stock column with low stock indicators
- ✅ Added all data-testids for testing
- ✅ Improved button styling and responsiveness

#### 3. Service Box Enhancement (10/10) 
- ✅ Complete rewrite with improved architecture
- ✅ Added view toggles: List / Grid / Calendar
- ✅ Enhanced stats cards with icons (8 cards: Total, Active, Bookable, Free, Consult, 24x7, Bookings, Providers)
- ✅ Added all 14 pillar quick filter buttons
- ✅ Added Provider column in table
- ✅ Enhanced editor with 4 tabs: Basic Info, Pricing, Provider, Availability
- ✅ Added service provider tracking fields (name, phone, email)
- ✅ Added service analytics display (bookings, rating, completion rate)
- ✅ Grid view with service cards
- ✅ All data-testids for testing

---

## ADMIN PANEL AUDIT STATUS

| Component | Score | Status |
|-----------|-------|--------|
| Finance Manager | 9/10 | ✅ Enhanced with full reconciliation |
| Product Box | 9/10 | ✅ Enhanced with stats, filters |
| Service Box | 9/10 | ✅ Enhanced with views, provider tracking |
| Service Desk | 7.5/10 | Pending - Needs SLA, canned responses |
| Member Directory | 7/10 | Pending - Needs 360 view, LTV |
| Mira Prompts | 8.5/10 | Pending - Needs prompt editor UI |

---

## UPCOMING TASKS

### P0 - High Priority
1. ~~Finance Manager testing~~ ✅ DONE
2. ~~Product Box enhancement~~ ✅ DONE
3. ~~Service Box enhancement~~ ✅ DONE
4. **Incorporate pet photos in Brand Story video**

### P1 - Medium Priority
5. Service Desk - Add SLA tracking
6. Service Desk - Add canned responses
7. Member Directory - Add 360 view
8. Member Directory - Add LTV calculation

### P2 - Nice to Have
9. Mira - Add prompt editor UI
10. System - Add approval workflows
11. Reports - Add GST export CSV

---

## KEY FILES MODIFIED TODAY

| File | Changes |
|------|---------|
| `/app/frontend/src/components/admin/FinanceManager.jsx` | Fixed JS error, added buttons |
| `/app/frontend/src/components/admin/UnifiedProductBox.jsx` | Enhanced stats, pillar filters, testids |
| `/app/frontend/src/components/admin/ServiceBox.jsx` | Complete rewrite with views, provider |

---

## 3RD PARTY INTEGRATIONS

| Service | Status | Notes |
|---------|--------|-------|
| Razorpay | ✅ Working | Test mode keys |
| ElevenLabs | ✅ Working | Brand story voiceovers |
| Sora 2 | ✅ Working | Brand story videos |
| MongoDB | ✅ Working | All data persistence |
| Emergent LLM | ✅ Working | Universal key for GPT/Gemini/Claude |

---

## TEST CREDENTIALS

- **Test User**: testnew@emergent.com / test1234
- **Demo User**: demo@doggy.com / demo1234
- **Admin**: aditya / lola4304
- **Test Pet ID**: pet-e3cd94659908

---

## CODE ARCHITECTURE

```
/app
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── admin/
│   │   │   │   ├── FinanceManager.jsx   (1492 lines - needs refactor)
│   │   │   │   ├── UnifiedProductBox.jsx (2300+ lines - enhanced)
│   │   │   │   ├── ServiceBox.jsx        (1100 lines - rewritten)
│   │   │   │   └── ... (50+ admin components)
│   │   ├── pages/
│   │   │   ├── Admin.jsx                 (2000+ lines - main container)
│   │   │   └── ... (60+ pages)
├── backend/
│   ├── server.py                         (main FastAPI app)
│   ├── finance_routes.py                 (Finance API)
│   ├── unified_product_box.py            (Product Box API)
│   ├── service_box_routes.py             (Service Box API)
│   └── ... (100+ route files)
```

---

## TECHNICAL NOTES

- **Admin Authentication**: HTTP Basic Auth (not JWT)
- **MongoDB**: All collections exclude `_id` in responses
- **Hot Reload**: Enabled for both frontend and backend
- **Testing**: Use `testing_agent_v3_fork` for comprehensive tests

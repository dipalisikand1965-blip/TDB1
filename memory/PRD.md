# The Doggy Company - Product Requirements Document

## Original Problem Statement
Building **The Doggy Company**, a "Pet Life Operating System." A world-class, event-driven platform with a single engine powering 12 business "Pillars" with Pet Soul integration, Unified Inbox, and Mira AI concierge.

---

## Data Flywheel Status (Pet Soul Integration)

| Pillar | Fetches Pets | Pet Selection UI | Writes to Soul | Status |
|--------|-------------|------------------|----------------|--------|
| **Celebrate** | ✅ YES | ✅ YES | ✅ YES | **COMPLETE** ✅ |
| **Stay** | ✅ YES | ✅ YES | ✅ YES | **COMPLETE** ✅ |
| **Travel** | ✅ Yes | ✅ Yes | ✅ Yes | Complete |
| **Care** | ✅ Yes | ✅ Yes | ✅ Yes | Complete |
| **Emergency** | ✅ Yes | ✅ Yes | ✅ Yes | Complete |
| **Paperwork** | ✅ Yes | ✅ Yes | ✅ Yes | Complete |
| **Enjoy** | ✅ Yes | ✅ Yes | ✅ Yes | Complete |
| **Dine** | ✅ Yes | ✅ Yes | ❌ No | Needs soul write |
| **Fit** | ✅ Yes | ✅ Yes | ❌ No | Needs soul write |
| **Advisory** | ✅ Yes | ✅ Yes | ❌ No | Needs soul write |

---

## What's Been Implemented (This Session)

### Admin Standardization ✅
- **CelebrateManager** - Full admin with Requests | Partners | Products | Bundles | Settings
- **CSV Import/Export** - Added to Advisory, Paperwork, Emergency, Celebrate
- **Tags Manager** - Now supports all 10 pillars

### Celebrate + Pet Soul ✅
- Pet selection dropdown in product modal (for cakes/treats)
- Auto-fill pet name, age, breed from Pet Soul
- Order history written to `soul.celebrate_history`
- Favorite categories tracked for recommendations
- Backend: `POST /api/pets/{pet_id}/soul/celebrate`

### Stay + Pet Soul ✅
- Pet selection dropdown in booking modal (Step 2: Pet Profile)
- Auto-fill pet details: name, breed, weight, age, sleep habits, fears, food preferences
- Booking written to `soul.stay_history`
- Favorite cities and property types tracked
- Backend: `POST /api/pets/{pet_id}/soul/stay`

---

## Remaining Work

### P0 - Data Flywheel (Complete the Loop)
1. **Dine + Pet Soul** - Write dining preferences to soul
2. **Fit + Pet Soul** - Write fitness/activity data to soul
3. **Advisory + Pet Soul** - Write consultation history to soul
4. **Mira Proactive** - Birthday/anniversary suggestions from Pet Soul

### P1 - User Journey
5. New landing page with pillar showcase
6. Membership tiers (Club pillar)
7. Onboarding flow with Pet Soul creation
8. Auto-checkout per pillar

### P2 - Admin & Code
9. Complete admin tabs for Stay, Dine, Enjoy
10. Pillar-wise shipping rules
11. Campaign system
12. Code reorganization

---

## Key Backend Endpoints

### Pet Soul Pillar Writes
- `POST /api/pets/{pet_id}/soul/celebrate` - Cake orders
- `POST /api/pets/{pet_id}/soul/stay` - Hotel bookings
- (Existing) Travel, Care, Emergency, Paperwork, Enjoy soul writes

### Admin CSV
- `GET/POST /api/{pillar}/admin/products/export-csv|import-csv`
- `GET/POST /api/{pillar}/admin/bundles/export-csv|import-csv`

---

## Key Frontend Files Modified

### Pet Soul Integration
- `/app/frontend/src/components/ProductCard.jsx` - Celebrate pet selection
- `/app/frontend/src/pages/StayPage.jsx` - Stay booking pet selection

### Admin Managers
- `/app/frontend/src/components/admin/CelebrateManager.jsx` - NEW
- `/app/frontend/src/components/admin/AdvisoryManager.jsx` - CSV added
- `/app/frontend/src/components/admin/PaperworkManager.jsx` - CSV added
- `/app/frontend/src/components/admin/EmergencyManager.jsx` - CSV added

---

## Mira Proactive Vision

**Current State**: Mira fetches Pet Soul data when user chats, provides context-aware responses.

**Next Step**: Mira initiates suggestions based on:
- Upcoming birthdays/anniversaries (`soul.celebrations`)
- Past preferences (`soul.preferences`)
- Purchase history (`soul.celebrate_history`, `soul.stay_history`)

Example: "🎂 Bruno's birthday is in 5 days! Want me to help you order a cake?"

---

## Tech Stack
- Frontend: React + Tailwind + Shadcn/UI
- Backend: FastAPI + MongoDB
- AI: OpenAI GPT-4 (via Emergent LLM Key)
- Payments: Razorpay (test keys)

## Credentials
- Admin: aditya / lola4304

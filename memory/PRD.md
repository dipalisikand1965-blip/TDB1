# The Doggy Company - Product Requirements Document

## Original Problem Statement
Building **The Doggy Company**, a "Pet Life Operating System" with 12 business "Pillars". Core vision includes:
- Deep "Pet Soul" profile for each pet
- "Unified Inbox" for all communications
- Mandatory "Membership" layer for accessing services

---

## ✅ COMPLETED (Jan 20, 2026)

### Critical Fixes
- [x] User Login Fixed - `dipali@clubconcierge.in` / `lola4304`
- [x] Admin Login Fixed - `aditya` / `lola4304`
- [x] MongoDB Production Fix - `load_dotenv(override=False)` + clean `.env`
- [x] 18% GST Implementation - Backend calculates GST with breakdown
- [x] Auto Database Seeding - 48 products seeded on empty DB

### UI/UX Improvements
- [x] Auth Gating Removed - All pages accessible without login (testing phase)
- [x] Dropdown Overlap Fixed - Navbar z-index corrected
- [x] Footer Membership Button - Links to original membership page
- [x] Pet Soul Page Fixed - `/pet-soul` displays with navbar

### Previous Session Work
- [x] Member Directory with search, filters, Pet Soul progress bars
- [x] 360° Member Profile Console with Pets & Soul tab
- [x] CSV Import/Export for members
- [x] Reports Manager for all 12 pillars
- [x] Home page redesigned as Concierge®-focused

---

## 📋 TOMORROW'S PLAN (Jan 21, 2026)

### 🔴 Phase 1: Refactoring (Priority)
Extract from `server.py` (9100+ lines):

| # | New File | Lines | Contents |
|---|----------|-------|----------|
| 1 | `models.py` | ~450 | All Pydantic models |
| 2 | `payments_routes.py` | ~300 | Razorpay, GST, payments |
| 3 | `mira_routes.py` | ~500 | Mira AI chat, web search |
| 4 | `admin_members_routes.py` | ~400 | Member management |
| 5 | `cart_routes.py` | ~500 | Abandoned cart, autoship |
| 6 | `content_routes.py` | ~600 | FAQs, Blog, Testimonials |

### 🟠 Phase 2: Bug Fixes
- [ ] Voice Order "Connection failed" debug
- [ ] Shopify Sync "Untitled Products" fix (recurring 7+ times)

### 🟡 Phase 3: Features
- [ ] Pet Soul Weekly Question (WhatsApp/Email integration)
- [ ] Complete Member Management System (11 remaining features)
- [ ] Re-enable Auth Gating before go-live

---

## 🔵 BACKLOG

### Code Architecture
- [ ] Create `/app/backend/models/` folder structure
- [ ] Create `/app/backend/routes/` folder structure
- [ ] Create `/app/backend/services/` for business logic
- [ ] Refactor `Admin.jsx` for better organization

### Features
- [ ] GST Invoice Generation
- [ ] Centralized Product Management System
- [ ] Standardize all 12 Admin Pillar Managers

---

## Technical Architecture

### Current Structure
```
/app
├── backend/
│   ├── server.py           # 9100+ lines (NEEDS REFACTORING)
│   ├── auth_routes.py      # User authentication
│   ├── dine_routes.py      # Dine pillar (115KB)
│   ├── stay_routes.py      # Stay pillar (74KB)
│   ├── travel_routes.py    # Travel pillar
│   ├── care_routes.py      # Care pillar
│   ├── enjoy_routes.py     # Enjoy pillar
│   ├── fit_routes.py       # Fit pillar
│   ├── advisory_routes.py  # Advisory pillar
│   ├── paperwork_routes.py # Paperwork pillar
│   ├── emergency_routes.py # Emergency pillar
│   └── ... (40+ route files)
└── frontend/
    └── src/
        ├── App.js
        ├── components/
        └── pages/
```

### Target Structure (After Refactoring)
```
/app/backend/
├── server.py              # Core app setup only (~500 lines)
├── models/
│   ├── __init__.py
│   ├── user_models.py
│   ├── product_models.py
│   └── pet_models.py
├── routes/
│   ├── payments_routes.py
│   ├── mira_routes.py
│   └── content_routes.py
└── services/
    ├── email_service.py
    └── shopify_sync.py
```

---

## Key API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/admin/login` - Admin login
- `GET /api/init-database` - Initialize DB (admin, user, products)

### Payments (with GST)
- `GET /api/payments/plans` - Returns plans with GST breakdown
- `POST /api/payments/create-order` - Creates Razorpay order with GST

### Admin
- `GET /api/admin/members` - Member directory
- `GET /api/admin/members/{user_id}` - 360° member profile

---

## Credentials

| Type | Username/Email | Password |
|------|----------------|----------|
| Admin | `aditya` | `lola4304` |
| Test User | `dipali@clubconcierge.in` | `lola4304` |

## Production URLs
- **Live Site:** https://thedoggycompany.in ✅
- **Preview:** https://pet-soul-hub.preview.emergentagent.com

## 3rd Party Integrations
- **Razorpay:** Payment gateway (test keys)
- **OpenAI GPT-4 / Whisper:** Mira AI and Voice Order
- **Resend:** Transactional emails
- **Shopify:** Product sync

---

*Last updated: January 20, 2026 - MongoDB production fix deployed*

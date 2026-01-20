# The Doggy Company - Product Requirements Document

## Original Problem Statement
Building **The Doggy Company**, a "Pet Life Operating System" with 12 business "Pillars". Core vision includes:
- Deep "Pet Soul" profile for each pet
- "Unified Inbox" for all communications
- Mandatory "Membership" layer for accessing services

## Core Requirements
- **A. Consistent Admin Managers**: All 12 pillars must have standardized manager interface
- **B. Core Admin Features**: Stats, CRUD, Refresh/Seed buttons, CSV export
- **C. Centralized Membership & Payments**: Single `/membership` page for login/signup and paid subscriptions
- **D. "Pet Soul" Integration**: All pillars read/write to Pet Soul
- **E. Dynamic & Brand-Aligned Content**: Marketing reflects "The Doggy Company" vision
- **F. Comprehensive Member Management**: Full suite of admin tools for member lifecycle
- **G. Pet Soul Weekly Question**: Weekly engagement via WhatsApp/Email

---

## What's Been Implemented (Jan 20, 2026)

### ✅ Critical Fixes - COMPLETE
- **User Login Fixed**: `dipali@clubconcierge.in` / `lola4304` - created in correct `test_database`
- **Admin Login Fixed**: `aditya` / `lola4304` - stored in `admin_config` collection
- **Auto Database Initialization**: Frontend auto-calls `/api/init-database` on load
- **18% GST Implementation**: Backend calculates GST with breakdown on all membership plans

### ✅ UI/UX Improvements - COMPLETE
- **Auth Gating Removed**: All pages accessible without login (testing phase)
- **Dropdown Overlap Fixed**: Navbar z-index corrected, dropdowns close properly
- **Footer Membership Button**: Links to original membership page
- **Pet Soul Page Fixed**: `/pet-soul` displays with navbar, no auth required

### ✅ Previous Session Work
- Member Directory with search, filters, Pet Soul progress bars
- 360° Member Profile Console with Pets & Soul tab
- CSV Import/Export for members
- Reports Manager for all 12 pillars
- Home page redesigned as Concierge®-focused

---

## Pending Issues

### 🔴 P0 - Critical
- [ ] Verify production deployment works (admin/user login, products)

### 🟠 P1 - High Priority
- [ ] Voice Order "Connection failed" error
- [ ] Shopify Sync creates "Untitled" products (recurring 7+ times)
- [ ] Pet Soul Weekly Question feature

### 🟡 P2 - Medium Priority
- [ ] Complete Member Management System (11 remaining features)
- [ ] Re-enable auth gating before go-live

---

## Future Tasks / Backlog

### Code Architecture
- [ ] Refactor `server.py` (9100+ lines) into domain-specific route files
- [ ] Refactor `Admin.jsx` for better organization
- [ ] Standardize all 12 Admin Pillar Managers

### Features
- [ ] GST Invoice Generation
- [ ] Centralized Product Management System
- [ ] Full Member Management spec (Gift/B2B Issuance, Plan Manager, etc.)

---

## Technical Architecture

```
/app
├── backend
│   ├── server.py          # Main server (9100+ lines)
│   ├── auth_routes.py     # User authentication
│   ├── channel_intake.py  # Voice order, multi-channel intake
│   └── .env               # MONGO_URL, DB_NAME, API keys
└── frontend
    └── src/
        ├── App.js                    # Routes, DatabaseInitializer
        ├── components/
        │   ├── ProtectedRoute.jsx    # Auth gating (currently disabled)
        │   ├── Navbar.jsx            # Fixed dropdown overlap
        │   └── Footer.jsx            # Membership button added
        └── pages/
            ├── MembershipPage.jsx    # Full membership page with plans
            ├── PetProfile.jsx        # Pet Soul multi-step form
            └── Admin.jsx             # Admin panel
```

## Key API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/admin/login` - Admin login
- `GET /api/init-database` - Auto-initialize DB (admin, user, products)

### Payments
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

## Database
- MongoDB at `localhost:27017`
- Database name: `test_database` (from DB_NAME env var)
- Note: Each deployment has separate DB, auto-init handles seeding

## 3rd Party Integrations
- **Razorpay**: Payment gateway (test keys)
- **OpenAI GPT-4 / Whisper**: Mira AI and Voice Order
- **Resend**: Transactional emails
- **Shopify**: Product sync

---

*Last updated: January 20, 2026*

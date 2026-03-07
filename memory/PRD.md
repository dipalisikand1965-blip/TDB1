# Pet Life Operating System - The Doggy Company
## Product Requirements Document

**Last Updated:** March 7, 2026
**Version:** 3.0.0
**Status:** Production Ready with Live Integrations

---

## 1. EXECUTIVE SUMMARY

The Doggy Company is a "Pet Life Operating System" - a comprehensive platform that serves as the central hub for all pet parent needs. Built with love, honoring the memory of **Kouros** (black Newfoundland) and **Mystique** (Shih Tzu).

**Core Philosophy:**
> "A dog is not in your life. You are in theirs."
> "To be known. To be seen. To be loved. With accuracy."

**URLs:**
- **Production:** https://thedoggycompany.com
- **Preview:** https://doggy-handover.preview.emergentagent.com

---

## 2. CREDENTIALS (IMPORTANT!)

### Test User Account
```
Email: dipali@clubconcierge.in
Password: test123
```

### Admin Panel Access
```
URL: /admin
Username: aditya
Password: lola4304
```
**Note:** Admin requires TWO-STEP login:
1. First form: Enter username + password → Click "Access Admin Panel"
2. Second form: Enter same username + password → Click "Sign In"

---

## 3. ARCHITECTURE

### Tech Stack
- **Frontend:** React 18 + Tailwind CSS + Shadcn/UI
- **Backend:** FastAPI (Python)
- **Database:** MongoDB (Emergent-hosted locally, Atlas for production)
- **AI:** OpenAI GPT (via Emergent LLM Key)
- **E-commerce:** Shopify sync (thedoggybakery.com)
- **Payments:** Razorpay (LIVE)
- **Messaging:** Gupshup WhatsApp Business API (LIVE)

### Environment Files
- **Frontend:** `/app/frontend/.env` - Contains `REACT_APP_BACKEND_URL`
- **Backend:** `/app/backend/.env` - Contains `MONGO_URL`, `DB_NAME`, API keys

---

## 4. INTEGRATIONS STATUS (March 7, 2026)

### ✅ LIVE & WORKING
| Integration | Status | Details |
|-------------|--------|---------|
| **Razorpay** | ✅ LIVE | `rzp_live_S6mTSKS8qWOi42` - Payment orders creating successfully |
| **Gupshup WhatsApp** | ✅ LIVE | App: `TheDoggyCompany`, Source: `919663185747` |
| **OpenAI GPT** | ✅ WORKING | Via Emergent LLM Key |
| **MongoDB** | ✅ WORKING | Local + Atlas ready |
| **Shopify** | ✅ WORKING | thedoggybakery.com sync |
| **Google Places** | ✅ WORKING | Pet-friendly locations |
| **YouTube** | ✅ WORKING | 25 videos returned |
| **ElevenLabs** | ✅ WORKING | British voice (Lily) |
| **Resend** | ✅ CONFIGURED | Email service ready |

---

## 5. MEMBERSHIP MODEL (NEW 3-TIER SYSTEM)

### Pricing Structure
| Tier | Yearly | Monthly | Key Features |
|------|--------|---------|--------------|
| **Free** | ₹0 | - | Pet Soul profile, unlimited pets, Mira basic, browse pillars, book services |
| **Essential** | ₹2,499 (+GST) | ₹249 | Mira full access, Mira OS, Concierge chat, Health Vault, Paw Points 2x |
| **Premium** | ₹9,999 (+GST) | ₹999 | Dedicated Pet Manager, White-glove, 24/7 VIP, Exclusive events, Birthday gift |

### Rules (All Tiers)
- Unlimited pets
- Can browse all 14 pillars
- Can book and pay for services
- Can upgrade anytime

---

## 6. THE 14 PILLARS

| Pillar | Purpose | Status |
|--------|---------|--------|
| **Celebrate** | Birthdays, cakes (Shopify) | ✅ Complete |
| **Dine** | Fresh meals, restaurants | ✅ Complete |
| **Stay** | Hotels, boarding, daycare | ✅ Complete |
| **Travel** | Trips, carriers, planning | ✅ Complete |
| **Care** | Grooming, vet, wellness | ✅ Complete |
| **Enjoy** | Experiences, events, outings | ✅ Complete |
| **Play** | Toys, games, activities | ✅ Complete |
| **Fit** | Exercise, fitness, agility | ✅ Complete |
| **Learn** | Training, education | ⚠️ API ready, frontend pending |
| **Paperwork** | Insurance, documents | ✅ Complete |
| **Advisory** | Consultations, planning | ✅ Complete |
| **Emergency** | 24/7 urgent care | ✅ Complete |
| **Farewell** | Memorial services | ✅ Complete |
| **Adopt** | Rescue, adoption | ✅ Complete |

---

## 7. KEY DATABASE COLLECTIONS

```
services_master    - PRIMARY source of truth for services (~1,115)
products_master    - All products (~2,200+)
users              - User accounts with membership
pets               - Pet profiles with soul scores
tickets            - Service requests
memberships        - Membership orders
[pillar]_bundles   - Pillar-specific bundles
[pillar]_experiences - Pillar-specific experiences
learn_guides       - Learn pillar content
learn_videos       - Learn pillar videos
```

**IMPORTANT:** Always use `services_master` for services. The `service_catalog` collection (84 items) is deprecated.

---

## 8. KEY API ENDPOINTS

### Membership & Payments
```
GET /api/membership/plans - List all plans (Free, Essential, Premium)
POST /api/membership/create-order - Create Razorpay order
POST /api/membership/payment/verify - Verify payment
GET /api/membership/status?email={email} - Check status
```

### Services (Unified)
```
GET /api/service-box/services - All services
GET /api/service-box/services?pillar={name} - Filter by pillar
PUT /api/service-box/services/{id} - Update (admin)
```

### WhatsApp (Gupshup)
```
GET /api/whatsapp/status - Configuration check
POST /api/whatsapp/webhook - Receive messages
POST /api/whatsapp/gupshup/send - Send message
```

### Learn Content
```
GET /api/learn/guides - Get guides
GET /api/learn/videos - Get videos
```

---

## 9. COMPLETED WORK (March 7, 2026)

### Integrations
- ✅ Razorpay LIVE - Orders creating with `order_SODYypjyHVlYst`
- ✅ Gupshup WhatsApp LIVE - Configured and ready
- ✅ New 3-tier membership model backend updated

### Data Fixes
- ✅ Unified service source (`services_master`)
- ✅ Fixed Mira AI queries
- ✅ Added ServiceCatalogSection to Dine & Care pages

### UI/UX Fixes
- ✅ C® button visibility on Dine page
- ✅ Mira context awareness
- ✅ Removed Dog Parks from Dine page
- ✅ Partial British English audit

---

## 10. PENDING TASKS

### P1 - High Priority
1. Update LearnPage.jsx to display `/api/learn/guides` and `/api/learn/videos`
2. Add Bundles/Experiences tabs to admin managers (Dine, Enjoy, Farewell, Adopt, Shop)
3. Complete British English audit

### P2 - Medium Priority
4. End-to-end service flow audit
5. Mobile Golden Experience audit
6. MongoDB Atlas IP whitelist for production

### P3 - Future/Backlog
7. Code refactoring (Admin.jsx 2,600+ lines, DoggyServiceDesk.jsx 6,000+ lines)
8. Secure admin authentication (migrate from hardcoded)
9. E-commerce expansion (HUFT integration)
10. Content population (transformation stories)

---

## 11. DEPLOYMENT CHECKLIST

After deploying to production:
1. ☐ Login to Admin panel (`/admin`)
2. ☐ Click **MASTER SYNC** button
3. ☐ Wait for all 8 steps to complete
4. ☐ Verify products and services appear
5. ☐ Test Razorpay payment flow
6. ☐ Set Gupshup webhook URL to `https://thedoggycompany.com/api/whatsapp/webhook`
7. ☐ Test WhatsApp messaging
8. ☐ Whitelist MongoDB Atlas IPs

---

## 12. TESTING COMMANDS

### Test Razorpay
```bash
curl -X POST "https://doggy-handover.preview.emergentagent.com/api/membership/create-order" \
  -H "Content-Type: application/json" \
  -d '{"plan_id": "essential", "user_email": "test@test.com", "user_name": "Test", "user_phone": "9999999999"}'
```

### Test WhatsApp Status
```bash
curl https://doggy-handover.preview.emergentagent.com/api/whatsapp/status
```

### Test Services
```bash
curl "https://doggy-handover.preview.emergentagent.com/api/service-box/services?pillar=care&limit=3"
```

---

## 13. FILE REFERENCES

### Backend Key Files
- `/app/backend/server.py` - Main app
- `/app/backend/membership_routes.py` - Razorpay integration
- `/app/backend/whatsapp_routes.py` - Gupshup integration
- `/app/backend/mira_routes.py` - AI endpoints
- `/app/backend/service_box_routes.py` - Unified services

### Frontend Key Files
- `/app/frontend/src/pages/MembershipPage.jsx` - 3-tier pricing
- `/app/frontend/src/pages/DinePage.jsx` - Dine pillar
- `/app/frontend/src/pages/CarePage.jsx` - Care pillar
- `/app/frontend/src/pages/LearnPage.jsx` - Needs API integration
- `/app/frontend/src/components/Pillars/ServiceCatalogSection.jsx` - Service display

---

## 14. KNOWN ISSUES

| Issue | Status | Notes |
|-------|--------|-------|
| Pillar assignment not saving | ✅ FIXED | Verified March 7 |
| Services not showing on frontend | ✅ FIXED | ServiceCatalogSection added |
| Mira wrong service collection | ✅ FIXED | Now uses services_master |
| C® button missing on Dine | ✅ FIXED | Moved to correct component |
| 575 services empty pillar | ⚠️ Data Issue | Shows warning, saves correctly |
| Production DB connection | 🚫 Blocked | Atlas IP whitelist needed |

---

*Built with love for Kouros & Mystique* 🐾

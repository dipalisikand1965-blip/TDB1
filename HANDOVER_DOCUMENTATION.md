# The Doggy Company - Complete Handover Documentation
## Pet Life Operating System - Production Ready

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
- **Preview:** https://pet-soul-audit.preview.emergentagent.com

---

## 2. CREDENTIALS

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

## 3. INTEGRATIONS STATUS

### ✅ FULLY INTEGRATED & WORKING

| Integration | Status | Configuration |
|-------------|--------|---------------|
| **Razorpay** | ✅ LIVE | Key: `rzp_live_<REDACTED_ROTATED>` |
| **Gupshup WhatsApp** | ✅ LIVE | App: `TheDoggyCompany`, Phone: `919663185747` |
| **OpenAI (Mira AI)** | ✅ WORKING | Via Emergent LLM Key |
| **MongoDB** | ✅ WORKING | Local + Atlas ready |
| **Google Places** | ✅ WORKING | Pet-friendly locations |
| **YouTube** | ✅ WORKING | Video embeds |
| **Shopify** | ✅ WORKING | thedoggybakery.com sync |
| **Resend** | ✅ CONFIGURED | Email notifications |
| **ElevenLabs** | ✅ WORKING | British voice (Lily) |

### Razorpay Configuration
```env
RAZORPAY_KEY_ID=rzp_live_<REDACTED_ROTATED>
RAZORPAY_KEY_SECRET=wNWqcJvv5K6b39kmMzOKVsQ3
```

**Endpoints:**
- `POST /api/membership/create-order` - Create payment order
- `POST /api/membership/payment/verify` - Verify payment signature
- `POST /api/membership/verify-payment` - Alternate verification endpoint

### Gupshup WhatsApp Configuration
```env
GUPSHUP_API_KEY=sk_2609497ce757467f87a955015da8854d
GUPSHUP_APP_NAME=TheDoggyCompany
GUPSHUP_SOURCE_NUMBER=919663185747
```

**⚠️ IMPORTANT:** The app name must match EXACTLY what is registered in the Gupshup dashboard. If messages fail with "Invalid App Details", verify the app name in the Gupshup console.

**WhatsApp Notifications Now Trigger On:**
- ✅ New user registration (welcome message)
- ✅ Payment received confirmation
- ✅ Membership activation
- ✅ Service booking confirmation
- ✅ Pet birthday reminders (7 days before)

**Endpoints:**
- `GET /api/whatsapp/status` - Check configuration status
- `POST /api/whatsapp/webhook` - Receive incoming messages
- `POST /api/whatsapp/gupshup/send` - Send text messages
- `POST /api/whatsapp/gupshup/send-template` - Send template messages
- `POST /api/whatsapp/test-notification` - Test notification types

---

## 4. MEMBERSHIP PLANS (NEW 3-TIER MODEL)

| Tier | Price (Yearly) | Price (Monthly) | Key Features |
|------|----------------|-----------------|--------------|
| **Free** | ₹0 | - | Pet Soul profile, unlimited pets, Mira basic, browse pillars, book services |
| **Essential** | ₹2,499 (+18% GST) | ₹249 | All Free + Mira full access, Mira OS, Concierge chat, Health Vault, Paw Points 2x, Priority booking |
| **Premium** | ₹9,999 (+18% GST) | ₹999 | All Essential + Dedicated Pet Manager, White-glove service, 24/7 VIP support, Exclusive events, Birthday gift |

**All tiers include:**
- Unlimited pets
- Access to all 14 pillars
- Ability to book and pay for services
- Upgrade anytime

---

## 5. DATABASE COLLECTIONS

### Primary Collections
| Collection | Count | Purpose |
|------------|-------|---------|
| `services_master` | 1,115+ | **Single source of truth** for all services |
| `products_master` | 2,200+ | Shopify-synced products |
| `users` | - | User accounts with membership data |
| `pets` | - | Pet profiles with soul scores |
| `tickets` | - | Service desk tickets |
| `memberships` | - | Membership orders and status |

### Collection Usage Notes
- **services_master**: Used by all frontend pillar pages via `/api/service-box/services`
- **service_catalog**: Legacy - DO NOT USE (84 items, outdated)
- **products_master**: Shopify sync source
- **[pillar]_bundles**: Pillar-specific bundles (e.g., `celebrate_bundles`)
- **[pillar]_experiences**: Pillar-specific experiences

---

## 6. KEY API ENDPOINTS

### Authentication
```
POST /api/auth/register - User registration
POST /api/auth/login - User login
GET /api/auth/me - Get current user
```

### Membership
```
GET /api/membership/plans - Get all membership plans
POST /api/membership/create-order - Create Razorpay order
POST /api/membership/payment/verify - Verify payment
GET /api/membership/status?email={email} - Check membership status
```

### Services (Unified)
```
GET /api/service-box/services - List all services
GET /api/service-box/services?pillar={pillar} - Filter by pillar
GET /api/service-box/services/{id} - Get single service
PUT /api/service-box/services/{id} - Update service (admin)
```

### WhatsApp
```
GET /api/whatsapp/status - Configuration status
POST /api/whatsapp/webhook - Incoming messages
POST /api/whatsapp/gupshup/send - Send message
```

### Learn Content
```
GET /api/learn/guides - Get learn guides
GET /api/learn/videos - Get learn videos
```

---

## 7. FILE STRUCTURE

### Backend (`/app/backend/`)
```
server.py                 # Main FastAPI app (20,000+ lines)
membership_routes.py      # Membership & Razorpay integration
whatsapp_routes.py        # Gupshup WhatsApp integration
mira_routes.py           # Mira AI endpoints
service_box_routes.py    # Unified service management
.env                     # Environment variables
```

### Frontend (`/app/frontend/src/`)
```
pages/
  MembershipPage.jsx     # 3-tier pricing display
  DinePage.jsx          # Dine pillar with services
  CarePage.jsx          # Care pillar with services
  LearnPage.jsx         # Learn content (needs API integration)
  
components/
  Pillars/
    ServiceCatalogSection.jsx  # Unified service display
  Common/
    ConciergeButton.jsx       # C® floating button
    MiraChatWidget.jsx        # Mira AI chat
  admin/
    Admin.jsx                 # Admin panel (2,600+ lines)
```

---

## 8. THE 14 PILLARS

| # | Pillar | Route | Status |
|---|--------|-------|--------|
| 1 | Celebrate | /celebrate | ✅ Complete |
| 2 | Dine | /dine | ✅ Complete |
| 3 | Stay | /stay | ✅ Complete |
| 4 | Travel | /travel | ✅ Complete |
| 5 | Care | /care | ✅ Complete |
| 6 | Enjoy | /enjoy | ✅ Complete |
| 7 | Play | /play | ✅ Complete |
| 8 | Fit | /fit | ✅ Complete |
| 9 | Learn | /learn | ⚠️ API ready, frontend pending |
| 10 | Paperwork | /paperwork | ✅ Complete |
| 11 | Advisory | /advisory | ✅ Complete |
| 12 | Emergency | /emergency | ✅ Complete |
| 13 | Farewell | /farewell | ✅ Complete |
| 14 | Adopt | /adopt | ✅ Complete |

---

## 9. COMPLETED WORK (This Session)

### Integration & Payment
- ✅ Razorpay live integration verified and working
- ✅ Gupshup WhatsApp integration verified and working
- ✅ New 3-tier membership model implemented (Free/Essential/Premium)

### Data Unification
- ✅ Unified service data source (`services_master`)
- ✅ Fixed Mira AI to query correct collection
- ✅ All pillar pages now use unified service endpoint

### Bug Fixes
- ✅ Fixed C® concierge button visibility on Dine page
- ✅ Fixed Mira "Browsing General" context
- ✅ Removed irrelevant content from Dine page
- ✅ British English audit (partial)

---

## 10. PENDING TASKS

### P0 - Critical
- [ ] None - all critical integrations complete

### P1 - High Priority
- [ ] Update LearnPage.jsx to use `/api/learn/guides` and `/api/learn/videos`
- [ ] Add Bundles/Experiences tabs to remaining admin managers (Dine, Enjoy, Farewell, Adopt, Shop)
- [ ] Complete British English audit across all pages

### P2 - Medium Priority
- [ ] End-to-end service flow audit (Member → Service Desk → Concierge)
- [ ] Mobile "Golden Experience" audit
- [ ] Production database connection (MongoDB Atlas IP whitelist)

### P3 - Future
- [ ] Code refactoring (Admin.jsx, DoggyServiceDesk.jsx)
- [ ] Secure admin authentication
- [ ] E-commerce expansion (HUFT integration)

---

## 11. TESTING COMMANDS

### Test Razorpay Integration
```bash
API_URL=https://pet-soul-audit.preview.emergentagent.com
curl -X POST "$API_URL/api/membership/create-order" \
  -H "Content-Type: application/json" \
  -d '{"plan_id": "essential", "user_email": "test@example.com", "user_name": "Test User", "user_phone": "9876543210"}'
```

### Test WhatsApp Status
```bash
curl https://pet-soul-audit.preview.emergentagent.com/api/whatsapp/status
```

### Test Service Listing
```bash
curl "https://pet-soul-audit.preview.emergentagent.com/api/service-box/services?pillar=dine&limit=5"
```

---

## 12. DEPLOYMENT CHECKLIST

After deploying to production:
1. ☐ Go to Admin panel (`/admin`)
2. ☐ Login with aditya/lola4304 (two-step)
3. ☐ Click **MASTER SYNC**
4. ☐ Wait for all 8 steps to complete
5. ☐ Verify Shopify products appear
6. ☐ Check service images are showing
7. ☐ Test membership purchase flow with Razorpay
8. ☐ Configure Gupshup webhook URL in dashboard
9. ☐ Test WhatsApp messaging

---

## 13. COMMON COMMANDS

### Restart Services
```bash
sudo supervisorctl restart backend
sudo supervisorctl restart frontend
```

### Check Logs
```bash
tail -n 100 /var/log/supervisor/backend.err.log
tail -n 100 /var/log/supervisor/frontend.out.log
```

### MongoDB Shell
```bash
cd /app/backend && python3 -c "
from pymongo import MongoClient
client = MongoClient('mongodb://localhost:27017')
db = client['pet-os-live-test_database']
for coll in db.list_collection_names():
    print(f'{coll}: {db[coll].count_documents({})} docs')
"
```

---

## 14. CONTACT & SUPPORT

For technical issues or questions about the codebase:
- Review `/app/memory/PRD.md` for detailed product requirements
- Check `/app/COMPLETE_DOCUMENTATION.md` for full API documentation
- Backend logs: `/var/log/supervisor/backend.err.log`

---

*Built with love for Kouros & Mystique* 🐾

# Pet Life Operating System - The Doggy Company
## Product Requirements Document

**Last Updated:** March 7, 2026
**Version:** 2.8.4
**Status:** Production Ready for Investor Demo

---

## 1. EXECUTIVE SUMMARY

The Doggy Company is a "Pet Life Operating System" - a comprehensive platform that serves as the central hub for all pet parent needs. Built with love, honoring the memory of **Kouros** (black Newfoundland) and **Mystique** (Shih Tzu).

**Core Philosophy:**
> "A dog is not in your life. You are in theirs."
> "To be known. To be seen. To be loved. With accuracy."

**URLs:**
- **Production:** https://thedoggycompany.com
- **Preview:** https://pet-life-admin.preview.emergentagent.com

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

### Key Database Collections
```
users              - User accounts
pets               - Pet profiles with soul scores
products_master    - All products (~2200+)
services_master    - Services (~1115)
unified_products   - Unified product view (DO NOT USE - deprecated)
tickets            - Service requests
mira_tickets       - Mira-created tickets
enjoy_experiences  - Events & Experiences (16 items)
transformation_stories - Community success stories
pages              - CMS content for frontend pages
```

### Environment Files
- **Frontend:** `/app/frontend/.env` - Contains `REACT_APP_BACKEND_URL`
- **Backend:** `/app/backend/.env` - Contains `MONGO_URL`, `DB_NAME`, API keys

---

## 4. THE 14 PILLARS

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
| **Learn** | Training, education | ✅ Complete |
| **Paperwork** | Insurance, documents | ✅ Complete |
| **Advisory** | Consultations, planning | ✅ Complete |
| **Emergency** | 24/7 urgent care | ✅ Complete |
| **Farewell** | Memorial services | ✅ Complete |
| **Adopt** | Rescue, adoption | ✅ Complete |

---

## 5. MASTER SYNC (CRITICAL!)

**Location:** Admin Panel → Click "MASTER SYNC" button

When deployed to production, ALWAYS run Master Sync to populate data:

| Step | Action |
|------|--------|
| 1 | Shopify sync (thedoggybakery.com products) |
| 2 | Care products seed |
| 3 | Dine products seed |
| 4 | Breed catalogue seed |
| 5 | Default data seed |
| 6 | Mira context update |
| 7 | **Product images migration** (all pillars) |
| 8 | **Service images migration** (Celebrate + Travel) |

---

## 6. KEY FEATURES

### Soul Score System
- Pets have scores 0-100% affecting personalization
- Higher score = Better recommendations
- Achievement badges: "Soul Guardian" at 75%

### Allergy Filtering
- Automatic filtering based on pet allergies
- Checks: `pet.allergies`, `preferences.allergies`, `doggy_soul_answers.allergies`

### Events & Experiences (Enjoy Pillar)
- **Admin Location:** Admin → 14 PILLARS → **Enjoy** → Enjoy Manager
- Manage events, RSVPs, partners
- 16 experiences currently seeded

### Google Places API (Already Working)
- Pet-friendly hotels, vets, restaurants, dog parks
- Pet stores, groomers, photographers
- API key configured in backend/.env

---

## 7. COMPLETED WORK - March 7, 2026

### Bug Fixes Verified
- ✅ **Pillar Assignment Bug FIXED** - Service pillar changes now save correctly in admin Service Box
  - Verified: Changed service from empty pillar to "celebrate" and confirmed persistence
  - API endpoint `/api/service-box/services/{id}` working correctly

- ✅ **Services Not Showing on Frontend FIXED** - Added ServiceCatalogSection to DinePage and CarePage
  - DinePage now displays 8 Dine services (Restaurant Discovery, Reservations, etc.)
  - CarePage now displays 8 Care services (Vet Consultations, Grooming, etc.)
  - Services are fetched from `services_master` collection via `/api/service-box/services`

- ✅ **C® Concierge Button on Dine Page FIXED** - Moved from wrong component to correct location
  - Root cause: Button was inside nested helper component instead of main DinePage
  
- ✅ **Mira "Browsing General" FIXED** - Added "services" pillar to MiraChatWidget config
  - Now says "I see you're browsing Services..." on /services page

- ✅ **Mira Product/Service Recommendations FIXED** - Updated to fetch from services_master
  - Changed `db.services` → `db.services_master` in mira_routes.py (3 locations)

- ✅ **Removed Irrelevant Content from Dine Page**
  - Removed "Dog Parks" section (belongs in Enjoy/Fit)
  - Moved "Pawty Birthday Package" from dine_bundles to celebrate_bundles

### Voice & Language Updates
- ✅ **ElevenLabs British Accent** - Changed from Rachel (American) to Lily (British)
  - Voice ID: pFZP5JQG7iQjIQuC4Bku
  - Added OpenAI TTS as backup

- ✅ **British English Audit** - Fixed key spellings:
  - personalized → personalised (multiple files)
  - customized → customised
  - favorite → favourite  
  - center → centre
  - color → colour (in visible text)

### API Health Check
All major APIs verified working:
- ✅ Service Box API - 1115 services
- ✅ Products API - Working
- ✅ YouTube API - 25 videos returned
- ✅ Google Places API - Hotels working
- ✅ Weather API - Mumbai data returned
- ✅ Enjoy Experiences API - 16 experiences
- ✅ Voice TTS API - Working with backup

### UI/UX Fixes (Previous Session)
- ✅ Mobile inbox "shaking" - Container uses min-h-screen + 100dvh
- ✅ Pet name overflow - Pet switcher uses overflow-x-auto  
- ✅ Footer services links - Routes now use /services?pillar=X
- ✅ Pet Soul page content - Philosophy-driven messaging
- ✅ Catalogue product modals - Modal opens before add-to-cart
- ✅ CMS seeded - 16 pages seeded with default content
- ✅ Navbar sub-pillar navigation - Pages read query params & scroll to sections
- ✅ Pillar manager products restored - Reverted to original API endpoints

---

## 8. PENDING ISSUES

### 🔴 HIGH PRIORITY (P0)
1. **iOS Hamburger Menu** - Reported as problematic, touch handlers added but needs verification
2. **End-to-End Service Flow Audit** - Member Request → Service Desk → Inbox → Concierge Reply needs testing
3. **575 Services Missing Pillar** - Many services in DB have empty pillar value (shown with warning in UI)

### 🟡 MEDIUM PRIORITY (P1)
4. **Pillar Manager Enhancement** - Add "Bundles" and "Experiences" tabs similar to Services tab
5. **Mobile Golden Experience** - Full responsiveness audit needed
6. **WebSocket Connection** - Graceful fallback in place

### 🟢 LOW PRIORITY (P2)
7. **Production DB Connection** - MongoDB Atlas IP whitelist issue (recurring)
8. **Some Shopify Images** - May have test URLs

---

## 9. PENDING TASKS

### 🔴 HIGH PRIORITY (For Launch)
1. **Razorpay Payment Integration**
   - Add API keys to `/app/backend/.env`
   - Test full checkout flow

2. **WhatsApp Business**
   - Meta API verification pending

3. **MongoDB Atlas IP Whitelist**
   - Add `0.0.0.0/0` to Network Access for preview → production

### 🟡 MEDIUM PRIORITY
4. **Add Transformation Stories**
   - Currently only 4 stories (all in 'fit' pillar)
   - Need stories for: care, celebrate, travel, stay, enjoy
   - API: `POST /api/engagement/transformations`

5. **Test Features**
   - Ask Mira search functionality
   - Guest emergency flow (submit without login)

### 🟢 FUTURE/BACKLOG
6. **E-commerce Expansion** - HUFT, Amazon integration
7. **Pillar Enhancements**
   - Fit: Activity tracking
   - Paperwork: Document upload
8. **Code Refactoring**
   - `Admin.jsx` - 2,600+ lines
   - `DoggyServiceDesk.jsx` - 6,000+ lines
   - `MiraDemoPage.jsx` - 5,000+ lines
9. **Admin Auth** - Move from hardcoded to backend roles

---

## 10. KEY FILES REFERENCE

### Frontend Structure
```
/app/frontend/src/
├── pages/
│   ├── Home.jsx              # Landing page (testimonials fixed)
│   ├── Login.jsx             # Kouros & Mystique memorial
│   ├── AboutPage.jsx         # Updated Kouros image
│   ├── CelebratePage.jsx     # Shopify products + services
│   ├── TravelPage.jsx        # Large transformation stories
│   ├── EnjoyPage.jsx         # Load More + events
│   ├── NotificationsInbox.jsx # Mobile shaking fixed
│   └── ProductDetailPage.jsx # Mobile scroll fixed
├── components/
│   ├── Navbar.jsx            # iOS hamburger fix
│   ├── ProductCard.jsx       # Image mismatch fixed
│   ├── MiraSearchPanel.jsx   # Continue chat fixed
│   ├── MiraChatWidget.jsx    # Pillar-aware chat
│   ├── TransformationStories.jsx # Click modal
│   ├── ServiceCatalogSection.jsx # Shows real images
│   ├── MobileNavBar.jsx      # Bottom navigation
│   └── admin/
│       └── ServiceBox.jsx    # Service CRUD with pillar assignment
└── index.css                 # Mobile nav active state
```

### Backend Structure
```
/app/backend/
├── server.py                 # Master Sync Steps 1-8 (20,000+ lines)
├── service_box_routes.py     # Service Box CRUD API
├── services/
│   └── google_places_service.py # Hotels, vets, etc.
├── enjoy_routes.py           # Events & Experiences API
└── .env                      # API keys, MongoDB URL
```

---

## 11. KEY API ENDPOINTS

### Service Box (Admin)
- `GET /api/service-box/services` - List services with filters
- `GET /api/service-box/services/{id}` - Get single service
- `PUT /api/service-box/services/{id}` - Update service (pillar, price, etc.)
- `POST /api/service-box/services` - Create new service
- `DELETE /api/service-box/services/{id}` - Archive service
- `GET /api/service-box/stats` - Service statistics

### Products
- `GET /api/products?pillar={name}` - Get Shopify products by pillar
- `GET /api/care/products` - Care pillar products
- `GET /api/travel/products` - Travel pillar products
- (etc. for each pillar)

### CMS
- `POST /api/admin/cms/seed-all` - Seed CMS with page content

---

## 12. COMMON TASKS

### How to Add a New Product Image
```python
# In server.py Master Sync Step 7, add to PILLAR_IMAGES dict:
"Product Name": "https://image-url.png",
```

### How to Add a New Service Image
```python
# In server.py Master Sync Step 8, add to SERVICE_IMAGES dict:
"Service Name": "https://image-url.png",
```

### How to Test Service Pillar Assignment
```bash
API_URL=https://pet-life-admin.preview.emergentagent.com

# Update a service pillar
curl -X PUT "$API_URL/api/service-box/services/svc-care-vet" \
  -H "Content-Type: application/json" \
  -d '{"name":"Vet Consultation","pillar":"travel",...}'

# Verify the change
curl "$API_URL/api/service-box/services/svc-care-vet"
```

### How to Debug Backend
```bash
tail -n 100 /var/log/supervisor/backend.err.log
tail -n 100 /var/log/supervisor/backend.out.log
```

### How to Restart Services
```bash
sudo supervisorctl restart backend
sudo supervisorctl restart frontend
```

---

## 13. 3RD PARTY INTEGRATIONS

| Integration | Status | Notes |
|-------------|--------|-------|
| OpenAI GPT | ✅ Working | Via Emergent LLM Key |
| MongoDB | ✅ Working | Local + Atlas |
| Shopify | ✅ Working | thedoggybakery.com |
| Google Places | ✅ Working | Hotels, vets, restaurants |
| YouTube | ✅ Working | Video embeds |
| Razorpay | ⏳ Needs Keys | Payment gateway |
| Resend | ✅ Configured | Email service |
| WhatsApp | ⏳ Needs Verification | Meta API |

---

## 14. DEPLOYMENT CHECKLIST

After deploying to production:
1. ☐ Go to Admin panel (`/admin`)
2. ☐ Login with aditya/lola4304 (two-step)
3. ☐ Click **MASTER SYNC**
4. ☐ Wait for all 8 steps to complete
5. ☐ Verify Shopify products appear
6. ☐ Check service images are showing
7. ☐ Test mobile responsiveness
8. ☐ Test a product purchase flow

---

## 15. KNOWN ISSUES & STATUS

| Issue | Status | Notes |
|-------|--------|-------|
| Pillar assignment not saving | ✅ FIXED | Verified working March 7, 2026 |
| Mobile inbox shaking | ✅ Fixed | Container uses min-h-screen + 100dvh |
| Pet name overflow | ✅ Fixed | Pet switcher uses overflow-x-auto |
| Footer services links | ✅ Fixed | Routes now use /services?pillar=X |
| Pet Soul page content | ✅ Updated | Philosophy-driven messaging |
| Catalogue product modals | ✅ Fixed | Modal opens before add-to-cart |
| CMS not seeded | ✅ Fixed | 16 pages seeded with default content |
| Navbar sub-pillar navigation | ✅ Fixed | Pages read query params & scroll |
| Pillar manager products | ✅ Fixed | Reverted to original API endpoints |
| iOS hamburger menu | ⚠️ Needs Testing | Touch handlers added |
| WebSocket chat | ⚠️ Degraded | Graceful fallback |
| Preview → Prod DB | 🚫 Blocked | Whitelist Atlas IP |
| 575 services empty pillar | ⚠️ Data Issue | Shows warning, saves correctly |

---

## 16. USEFUL COMMANDS

```bash
# Check frontend logs
tail -f /var/log/supervisor/frontend.out.log

# Check backend logs
tail -f /var/log/supervisor/backend.err.log

# Test API
curl https://pet-life-admin.preview.emergentagent.com/api/products?pillar=celebrate&limit=5

# Check MongoDB collections
cd /app/backend && python3 -c "
from pymongo import MongoClient
client = MongoClient('mongodb://localhost:27017')
db = client['pet-os-live-test_database']
for coll in db.list_collection_names():
    print(f'{coll}: {db[coll].count_documents({})} docs')
"

# Check services with empty pillar
cd /app/backend && python3 -c "
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['pet-os-live-test_database']
    empty = await db.services_master.count_documents({'pillar': ''})
    print(f'Services with empty pillar: {empty}')

asyncio.run(check())
"
```

---

## 17. NEXT STEPS FOR NEW DEVELOPER

1. **Immediate:** Test iOS hamburger menu on actual device
2. **Short-term:** Audit end-to-end service flow (Member Request → Concierge Reply)
3. **Medium-term:** Add Bundles/Experiences tabs to pillar managers
4. **Future:** Break down large components (Admin.jsx, DoggyServiceDesk.jsx)

---

## 18. DATA NOTES

### Services with Empty Pillar
575 out of 1115 services have `pillar: ""` (empty string). This doesn't break functionality:
- UI shows fallback "Care" in dropdown
- Warning message displayed: "⚠️ Please select a pillar"
- When user saves, pillar is correctly persisted

To bulk-update these services:
```javascript
db.services_master.updateMany(
  { pillar: "" },
  { $set: { pillar: "shop" } }  // or appropriate pillar
)
```

---

*Built with love for Kouros & Mystique* 🐾

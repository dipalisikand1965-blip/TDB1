# Pet Life Operating System - The Doggy Company
## Product Requirements Document

**Last Updated:** December 6, 2025
**Version:** 2.8.0
**Status:** Production Ready for Investor Demo

---

## 1. EXECUTIVE SUMMARY

The Doggy Company is a "Pet Life Operating System" - a comprehensive platform that serves as the central hub for all pet parent needs. Built with love, honoring the memory of **Kouros** (black Newfoundland) and **Mystique** (Shih Tzu).

**Core Philosophy:**
> "A dog is not in your life. You are in theirs."
> "To be known. To be seen. To be loved. With accuracy."

**URLs:**
- **Production:** https://thedoggycompany.com
- **Preview:** https://pet-os-v1.preview.emergentagent.com

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
services_master    - Services (~1100+)
unified_products   - Unified product view
tickets            - Service requests
mira_tickets       - Mira-created tickets
enjoy_experiences  - Events & Experiences (16 items)
transformation_stories - Community success stories
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

## 7. COMPLETED WORK - December 6, 2025

### Images & Content
- ✅ Travel services: 10 unique AI images
- ✅ Paperwork services: 5 insurance images
- ✅ Celebrate services: 11 party/celebration images
- ✅ "Love in the Air Mini" Shopify image fixed
- ✅ ServiceCatalogSection shows actual images (not gradients)
- ✅ Testimonial images on Home page (proper aspect ratio)

### UI/UX Fixes
- ✅ Load More buttons on pillar pages
- ✅ Removed "X of Y products" text everywhere
- ✅ Mobile nav active state enhanced
- ✅ Price display: "Price on request" for ₹0 items
- ✅ Mobile product detail scroll fixed
- ✅ Text readability on dark sections improved

### Transformation Stories
- ✅ Large card format (single dog photos)
- ✅ Click-to-view modal with full details
- ✅ Mobile horizontal scroll with snap
- ✅ "Share Your Story" for pillars without stories

### Memorial Updates
- ✅ Login page: Shows BOTH Kouros & Mystique with heart
- ✅ About page: New Kouros image (black Newfoundland)

### Bug Fixes
- ✅ Product card/modal image mismatch
- ✅ iOS hamburger menu tap target (44x44px)
- ✅ "Continue in Chat" now opens pillar-specific Mira widget

---

## 8. PENDING BUGS TO FIX

### 🔴 HIGH PRIORITY
1. **Mobile Inbox Shaking** - Notifications page shakes when opened on mobile
   - File: `/app/frontend/src/pages/NotificationsInbox.jsx`
   - Likely CSS animation or transform issue

### 🟡 MEDIUM PRIORITY
2. **Broken Shopify Images** - Some products have test URLs
3. **WebSocket Connection** - Graceful fallback in place

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
│   ├── NotificationsInbox.jsx # BUG: Shakes on mobile
│   └── ProductDetailPage.jsx # Mobile scroll fixed
├── components/
│   ├── Navbar.jsx            # iOS hamburger fix
│   ├── ProductCard.jsx       # Image mismatch fixed
│   ├── MiraSearchPanel.jsx   # Continue chat fixed
│   ├── MiraChatWidget.jsx    # Pillar-aware chat
│   ├── TransformationStories.jsx # Click modal
│   ├── ServiceCatalogSection.jsx # Shows real images
│   └── MobileNavBar.jsx      # Bottom navigation
└── index.css                 # Mobile nav active state
```

### Backend Structure
```
/app/backend/
├── server.py                 # Master Sync Steps 1-8
├── services/
│   └── google_places_service.py # Hotels, vets, etc.
├── enjoy_routes.py           # Events & Experiences API
└── .env                      # API keys, MongoDB URL
```

---

## 11. COMMON TASKS

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

### How to Add Transformation Story
```bash
curl -X POST https://pet-os-v1.preview.emergentagent.com/api/engagement/transformations \
  -H "Content-Type: application/json" \
  -d '{
    "pet_name": "Rocky",
    "breed": "Golden Retriever",
    "owner_name": "Priya M.",
    "pillar": "care",
    "headline": "Amazing grooming transformation",
    "testimonial": "The groomer was so gentle...",
    "before_image": "https://...",
    "after_image": "https://...",
    "rating": 5,
    "is_active": true
  }'
```

### How to Test on Mobile
1. Use screenshot tool with viewport `390x844` (iPhone)
2. Or visit preview URL on actual device

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

## 12. 3RD PARTY INTEGRATIONS

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

## 13. DEPLOYMENT CHECKLIST

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

## 14. KNOWN ISSUES

| Issue | Status | Workaround |
|-------|--------|------------|
| Mobile inbox shaking | 🔴 Bug | Needs fix |
| WebSocket chat | ⚠️ Degraded | Graceful fallback |
| Preview → Prod DB | 🚫 Blocked | Whitelist Atlas IP |
| Some Shopify images | ⚠️ Broken | Check Shopify admin |

---

## 15. USEFUL COMMANDS

```bash
# Check frontend logs
tail -f /var/log/supervisor/frontend.out.log

# Check backend logs
tail -f /var/log/supervisor/backend.err.log

# Test API
curl https://pet-os-v1.preview.emergentagent.com/api/products?pillar=celebrate&limit=5

# Check MongoDB collections
cd /app/backend && python3 -c "
from pymongo import MongoClient
client = MongoClient('mongodb://localhost:27017')
db = client['pet-os-live-test_database']
for coll in db.list_collection_names():
    print(f'{coll}: {db[coll].count_documents({})} docs')
"
```

---

## 16. CONTACT & RESOURCES

- **Shopify Store:** https://thedoggybakery.com
- **Admin Panel:** /admin
- **Mira AI:** Click floating button or Ask Mira search bar
- **Documentation:** /complete-documentation.html

---

*Built with love for Kouros & Mystique* 🐾

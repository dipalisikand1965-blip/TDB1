# The Doggy Company - PRD (Product Requirements Document)
**Last Updated:** March 10, 2026 12:25 IST  
**Status:** Emergency Page Redesign COMPLETE | Bundle Modal Fixed | Mockups ~62%

---

## PRODUCT VISION
Hyper-personalized pet platform using "memory-led personalization" - products, content, and experiences tailored to each pet's breed, archetype, and life stage.

---

## COMPLETED: EMERGENCY PAGE 9-LAYER ARCHITECTURE

### Implementation Complete (March 10, 2026)
The Emergency page has been fully redesigned with 9 distinct functional layers:

| Layer | Component | Status |
|-------|-----------|--------|
| 1 | **Urgent Help Buttons** - Call Vet, Find Clinic, Poison Help, Ambulance, Pet File | ✅ COMPLETE |
| 2 | **Near Me Now** - Google Places API for real-time clinic finder | ✅ COMPLETE |
| 3 | **Concierge Will Assist** - Human support layer via WhatsApp | ✅ COMPLETE |
| 4 | **Pet Emergency File** - Auto-loaded pet medical info | ✅ COMPLETE |
| 5 | **Emergency Guides** - 10 actionable guides with Do/Don't | ✅ COMPLETE |
| 6 | **Emergency Products** - Curated bundles & first-aid kits | ✅ COMPLETE |
| 7 | **Smart Picks** - Breed/archetype personalized products | ✅ COMPLETE |
| 8 | **Special Paths** - Lost Pet, Travel, Puppy, Senior | ✅ COMPLETE |
| 9 | **Follow-up & Recovery** - Discharge checklist, reminders | ✅ COMPLETE |

### Key Files Modified
- `/app/frontend/src/pages/EmergencyPage.jsx` - Complete 9-layer redesign
- `/app/frontend/src/components/emergency/NearbyEmergencyHelp.jsx` - Fixed API endpoint
- `/app/frontend/src/components/CuratedBundles.jsx` - Added modal detail view

---

## COMPLETED: BUNDLE MODAL FIX (P1)

**Issue:** Clicking bundle cards navigated away instead of opening modal
**Fix:** Updated CuratedBundles.jsx to include:
- Click-to-open modal functionality
- Full bundle detail view with all items
- AI-generated image display
- Pricing with savings calculation
- Add to Cart from modal

---

## COMPLETED FEATURES

### Phase 1: Core Infrastructure
- [x] FastAPI backend with MongoDB
- [x] React frontend with Tailwind CSS
- [x] User authentication (JWT)
- [x] Pet profile management (9 test pets)
- [x] Shopify product sync (2199 products)

### Phase 2: Soul Profile System
- [x] 51-question soul questionnaire
- [x] 26 canonical scoring fields
- [x] 7 Archetypes: Gentle Aristocrat, Wild Explorer, Velcro Baby, Snack Negotiator, Quiet Watcher, Social Butterfly, Brave Worrier

### Phase 3: Golden Standard Layout (All 13 Pillars)
- [x] Hero section with pet personalization
- [x] Mira's Quick Help (AI concierge)
- [x] Soul Made Products section
- [x] Breed-Smart Recommendations
- [x] Curated Bundles with AI-generated images
- [x] Archetype Products

### Phase 4: AI Mockup Generation
- [x] OpenAI GPT Image 1 integration
- [x] Cloudinary upload and storage
- [x] 33 breeds x 65+ product types = 2569 products
- [x] Auto-generator script available
- [x] Progress: ~62% (~1600/2569)

### Phase 5-9: Admin Systems
- [x] Multi-Factor Filtering API
- [x] Soul Tier Admin UI
- [x] Archetype Tone System
- [x] Curated Bundles System (19 bundles)
- [x] Admin UI Fixes

### Phase 10: Emergency Page Redesign (March 10, 2026)
- [x] 9-layer architecture implementation
- [x] UrgentHelpButtons component
- [x] NearbyEmergencyHelp with location API
- [x] EmergencySituationGuides (10 guides)
- [x] Special Emergency Paths (4 types)
- [x] Follow-up & Recovery section
- [x] Bundle Modal fix

---

## IN PROGRESS

| Task | Progress | Notes |
|------|----------|-------|
| **Mockup Generation** | ~62% | ~1600/2569 - Run auto_mockup_generator.py to continue |
| **Production Sync** | Pending | Run after mockups hit 80%+ |

---

## PENDING ISSUES

| Issue | Priority | Status |
|-------|----------|--------|
| Razorpay checkout "body error" | P1 | NOT STARTED (User deferred) |
| Mobile dashboard scrambled | P2 | User verification needed |

---

## KEY FILES

### Frontend - Emergency
- `/app/frontend/src/pages/EmergencyPage.jsx` - Main 9-layer page
- `/app/frontend/src/components/emergency/UrgentHelpButtons.jsx`
- `/app/frontend/src/components/emergency/NearbyEmergencyHelp.jsx`
- `/app/frontend/src/components/emergency/PetEmergencyFile.jsx`
- `/app/frontend/src/components/emergency/EmergencySituationGuides.jsx`
- `/app/frontend/src/components/CuratedBundles.jsx` - With modal

### Backend - Google Places
- `/app/backend/services/google_places_service.py`
- `/app/backend/mira_routes.py` - `/api/mira/local-places/*` endpoints

---

## KEY API ENDPOINTS

### Emergency
- `GET /api/mira/local-places/vets` - Nearby vets via Google Places
- `GET /api/emergency/vets` - Emergency partners
- `GET /api/emergency/products` - Emergency products
- `POST /api/emergency/request` - Submit emergency request

### Bundles
- `GET /api/bundles?pillar=emergency` - Get bundles by pillar
- `POST /api/bundles/{id}/generate-image` - Generate AI image

---

## DATABASE COLLECTIONS

- `products_master` - 3443 products (Shopify + Soul Made)
- `breed_products` - 2569 breed-specific products
- `unified_products` - 3338 unified catalog
- `bundles` - 19 curated bundles (all with images)
- `pets` - Pet profiles with archetypes

---

## TEST CREDENTIALS

- **User:** dipali@clubconcierge.in / test123
- **Admin:** aditya / lola4304

---

## NEXT STEPS

1. **Continue mockup generation** - Run `cd /app/backend && python3 auto_mockup_generator.py`
2. **Fix Razorpay checkout** - P1 blocker (deferred by user)
3. **Verify mobile dashboard** - Need user screenshot
4. **Run production sync** - After 80%+ mockups complete

---

## AUTO-GENERATOR

Running at: `/app/backend/auto_mockup_generator.py`
Log file: `/tmp/auto_mockup_generator.log`
Check status: `tail -20 /tmp/auto_mockup_generator.log`

To start: `cd /app/backend && python3 auto_mockup_generator.py &`

---

## VERIFIED WORKING (March 10, 2026)

1. **Emergency Page 9-Layer Architecture** - COMPLETE
   - All 9 layers functional
   - Nearby clinics showing from Google Places API
   - Emergency guides expandable with Do/Don't sections
   - Special paths for Lost Pet, Travel, Puppy, Senior

2. **Bundle Modal** - FIXED
   - Clicking bundle card opens detail modal
   - Shows all items, pricing, and AI image
   - Add to Cart works from modal

3. **Bundle Images on Pillar Pages** - CONFIRMED working
   - All 19 bundles have AI-generated images

# The Doggy Company - Detailed Handover
**Date:** March 10, 2026  
**Session Focus:** Emergency Page Completion + Advisory Page Redesign + Shop Filters

---

## COMPLETED THIS SESSION

### 1. Soul Score Bug Fix ✅
- **Issue:** Mojo's soul score showed 79% instead of 89%
- **Root Cause:** Database had stale `soul_score` field not recalculated from `doggy_soul_answers`
- **Fix:** Ran `calculate_pet_soul_score()` and updated DB with correct score (89%)
- **File:** `/app/backend/pet_score_logic.py` - source of truth for score calculation
- **Verified:** Pet Dashboard shows "89% Pet Soul™" and "Soul Master" tier

### 2. Pet Emergency File Data Fix ✅
- **Issue:** Emergency File wasn't pulling allergies/medications from Soul data
- **Fix:** Updated `PetEmergencyFile.jsx` to check both `pet.*` and `pet.doggy_soul_answers.*`
- **File:** `/app/frontend/src/components/emergency/PetEmergencyFile.jsx`
- **Verified:** Shows "Allergies: chicken" from soul answers

### 3. Emergency Page Layout ✅
- **Changed:** Bundles ON TOP, Products BELOW (was side-by-side)
- **File:** `/app/frontend/src/pages/EmergencyPage.jsx`

### 4. Emergency Product Images ✅
- **Generated:** 15 AI images for emergency products via Gemini Imagen
- **Products:** First Aid Kit, Thermometer, Bandages, Muzzle, Carrier, E-Collar, etc.
- **Updated:** Both `unified_products` and `products_master` collections

### 5. Shop Emergency Tab ✅
- **Added:** Emergency tab to Shop page at position 7 (after Care)
- **URL:** `/shop?pillar=emergency` now works
- **Subcategories:** First Aid, Recovery, Transport, Tracking, Restraint
- **File:** `/app/frontend/src/pages/ShopPage.jsx`

### 6. Shop Subcategory & Breed Filters ✅
- **Added:** Subcategory pills for all pillars
- **Added:** Breed filter (12 breeds: Labrador, Poodle, Bulldog, etc.)
- **Database:** Updated 480 products with breed tags
- **File:** `/app/frontend/src/pages/ShopPage.jsx`

### 7. Shop Product Modal ✅
- **Changed:** Products now open in modal instead of navigating to product page
- **Imported:** ProductCard from `/app/frontend/src/components/ProductCard.jsx`
- **Removed:** Duplicate internal ProductCard definition

### 8. Advisory Page Redesign ✅
- **Complete rewrite** of `/app/frontend/src/pages/AdvisoryPage.jsx`
- **New structure follows Emergency page pattern:**
  - Layer 1: Ask Advisory (AI hero)
  - Layer 2: 11 Intent Tiles
  - Layer 3: My Dog Advisory (personalized)
  - Layer 4: Concierge Cards
  - Layer 5: Guided Paths
  - Layer 6: Curated Bundles + Products
  - Layer 7: Near Me
  - Layer 8: Seasonal Care Tips
  - Layer 9: Concierge CTA

### 9. Advisory Bundles ✅
- **Created 3 bundles:**
  - Puppy Starter Bundle - ₹2,499
  - Senior Comfort Bundle - ₹3,499
  - Complete Grooming Bundle - ₹1,799
- **AI images generated** for all 3
- **Synced to:** `advisory_bundles`, `bundles` collections

### 10. Advisory Products ✅
- **Added 28 products** across 7 categories:
  - Puppy (4), Senior (4), Grooming (4), Nutrition (4)
  - Training (4), Home (4), Travel (4)

### 11. Pillar-Aware Copy ✅
- **Fixed:** "Fun finds for the life of the party" showing on Advisory
- **Added:** ADVISORY_COPY to `/app/frontend/src/utils/archetypeCopy.js`
- **Now shows:** "Guidance for Your Pet's wellbeing" / "Smart picks for Your Pet"

### 12. Ask Advisory AI Endpoint ✅
- **Created:** `/api/advisory/ask-advisory` endpoint
- **File:** `/app/backend/advisory_routes.py` (lines 1127-1290)
- **Uses:** GPT-4o-mini with Emergent LLM Key

---

## PENDING ISSUES (P0)

### Issue 1: Advisory AI Caching Problem
**Problem:** User reports AI gives same answer for different questions
**My Test:** API returned correct travel checklist for "Travel prep checklist" query
**Possible Causes:**
1. Frontend not passing the actual question properly
2. Session ID causing cached responses
3. Browser caching the response

**Debug Checklist:**
1. Check frontend `handleAskAdvisory` function in AdvisoryPage.jsx
2. Verify `advisoryQuery` state is being set correctly
3. Check if the question is actually in the request body
4. Try clearing browser cache

**File to check:** `/app/frontend/src/pages/AdvisoryPage.jsx` lines 245-280

### Issue 2: Concierge Should Open Modal, Not WhatsApp
**Problem:** All "Talk to Concierge" buttons go directly to WhatsApp
**Expected:** Should open a concierge modal with options (inbox, WhatsApp, etc.)

**Current Code (wrong):**
```javascript
const openWhatsAppConcierge = (context = '') => {
  window.open(`https://wa.me/918971702582?text=...`, '_blank');
};
```

**Fix Required:**
1. Find the existing Concierge modal component
2. Replace `openWhatsAppConcierge` calls with modal open
3. Modal should offer: Inbox, WhatsApp, Call options

**Files to check:**
- `/app/frontend/src/components/mira-os/ConciergeButton.jsx`
- `/app/frontend/src/components/ConciergeModal.jsx` (if exists)
- Search for: `grep -rn "ConciergeModal\|concierge.*modal" /app/frontend/src`

### Issue 3: Personalized Advice Cards Link to Soul Questions
**Problem:** "Puppy Development Tips", "Indian Breed Care", "Summer Heat Advisory" cards should link to Soul questions flow
**Current:** They open WhatsApp

**Expected Flow:**
- Click "Get advice" → Opens modal or navigates to relevant Soul questions
- Soul questions should be pillar-aware (advisory context)

**Files to check:**
- Search for Soul question flow: `grep -rn "soul.*question\|SoulQuestion" /app/frontend/src`
- Check how Learn page handles similar flows

---

## PENDING ISSUES (P1)

### Issue 4: Razorpay Checkout "body error"
- Logging added to `/app/backend/checkout_routes.py`
- Needs user to attempt purchase to capture actual error

### Issue 5: Mobile Pet Dashboard Scrambled
- CSS layout issues
- Not addressed this session

### Issue 6: AI Mockup Generator
- Was at 73.3% when session started
- Script not currently running
- 20 breed first-aid kit images still missing

---

## KEY FILES REFERENCE

### Frontend
| File | Purpose |
|------|---------|
| `/app/frontend/src/pages/AdvisoryPage.jsx` | Complete Advisory page - REWRITTEN |
| `/app/frontend/src/pages/EmergencyPage.jsx` | Emergency page layout |
| `/app/frontend/src/pages/ShopPage.jsx` | Shop with filters |
| `/app/frontend/src/components/emergency/PetEmergencyFile.jsx` | Pet file data from Soul |
| `/app/frontend/src/components/emergency/EmergencyProductsGrid.jsx` | Product grid with modal |
| `/app/frontend/src/components/CuratedBundles.jsx` | Bundle display (has static config) |
| `/app/frontend/src/components/ArchetypeProducts.jsx` | Pillar-aware products |
| `/app/frontend/src/utils/archetypeCopy.js` | Pillar-specific copy (ADVISORY_COPY added) |
| `/app/frontend/src/components/ProductCard.jsx` | Product with modal |

### Backend
| File | Purpose |
|------|---------|
| `/app/backend/advisory_routes.py` | Advisory API + ask-advisory endpoint |
| `/app/backend/pet_score_logic.py` | Soul score calculation |
| `/app/backend/checkout_routes.py` | Razorpay (logging added) |
| `/app/backend/unified_product_box.py` | Product API for shop |

### Database Collections
| Collection | Emergency | Advisory |
|------------|-----------|----------|
| `unified_products` | 181 | 129 |
| `products_master` | 247 | ~100 |
| `bundles` | 3 | 4 |
| `advisory_bundles` | - | 3 |
| `emergency_bundles` | 3 | - |

---

## DATABASE QUERIES FOR DEBUG

```python
# Check Mojo's data
db.pets.find_one({'id': 'pet-mojo-7327ad56'})

# Check advisory bundles
db.bundles.find({'pillar': 'advisory'})

# Check advisory products
db.unified_products.find({'pillar': 'advisory', 'price': {'$gt': 0}}).count()
```

---

## CONCIERGE FLOW INVESTIGATION

The user mentioned they have:
1. **Inbox** - internal messaging
2. **WhatsApp** - external messaging
3. **Well-defined concierge flow** - modal with options

**To find the proper concierge flow:**
```bash
grep -rn "ConciergeModal\|concierge.*modal\|openConcierge" /app/frontend/src
grep -rn "inbox\|Inbox" /app/frontend/src/components
```

**Emergency page concierge reference:**
Check how Emergency page handles "Talk to Concierge" - it might use a different component.

---

## SOUL QUESTIONS FLOW

The personalized advice cards (Puppy Development, Indian Breed Care, Summer Heat) should link to Soul questions.

**To find Soul question flow:**
```bash
grep -rn "SoulQuestion\|soul.*builder\|doggy.*soul" /app/frontend/src
```

**Expected behavior:**
- "Puppy Development Tips" → Opens Soul questions about puppy care
- "Indian Breed Care" → Opens Soul questions about Indie breed needs
- "Summer Heat Advisory" → Opens Soul questions about temperature/climate care

---

## CREDENTIALS

- **User:** dipali@clubconcierge.in / test123
- **Admin:** aditya / lola4304

---

## NEXT STEPS PRIORITY

1. **P0:** Fix Advisory AI to answer based on actual question (not cached)
2. **P0:** Replace WhatsApp links with proper Concierge modal
3. **P0:** Link personalized advice cards to Soul questions
4. **P1:** Fix Razorpay checkout
5. **P2:** Mobile dashboard layout
6. **P2:** Generate remaining product images

---

## SESSION SUMMARY

**What was accomplished:**
- Soul Score fix (89%)
- Emergency page complete with bundles, products, images
- Shop filters (subcategory + breed)
- Advisory page redesigned with 9 layers
- Advisory bundles and products added
- Pillar-aware copy for Advisory

**What still needs work:**
- Advisory AI response caching issue
- Concierge modal instead of WhatsApp
- Soul questions integration for advice cards
- Razorpay checkout
- Mobile responsiveness

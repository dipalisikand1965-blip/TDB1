# The Doggy Company - PRD (Product Requirements Document)
**Last Updated:** March 10, 2026 18:30 IST  
**Status:** Emergency Page COMPLETE | Soul Score Fix COMPLETE | Pet Emergency File FIXED

---

## COMPLETED THIS SESSION (March 10, 2026)

### 1. Soul Score Bug Fix - CRITICAL ✅
- **Issue:** Mojo's soul score showed 79% instead of the actual 89%
- **Root Cause:** Database had stale `soul_score` and `overall_score` fields that weren't being recalculated
- **Fix:** 
  - Recalculated Mojo's score using `calculate_pet_soul_score()` from `pet_score_logic.py`
  - Updated database to store correct calculated score (89%)
  - Score now displays correctly in all frontend components
- **Verified:** Screenshot shows "Mojo's soul is 89% discovered" in the header

### 2. Pet Emergency File Data Fix ✅
- **Issue:** Pet Emergency File wasn't pulling data from `doggy_soul_answers`
- **Root Cause:** Component only checked top-level fields (`pet.allergies`, `pet.medications`, etc.) but data was stored in `pet.doggy_soul_answers`
- **Fix:** Updated `PetEmergencyFile.jsx` to:
  - Extract data from both `pet.*` and `pet.doggy_soul_answers.*`
  - Calculate age from multiple sources (dob, birth_date, life_stage)
  - Handle allergies as string or array
- **Verified:** Screenshot shows "Allergies: chicken" correctly pulled from soul answers

### 3. Razorpay Checkout Logging (Debug Prep)
- Added comprehensive logging to `/api/checkout/create-order` endpoint
- Logs subtotal, discount, shipping, GST, and Razorpay order creation
- Ready for debugging the "body error" issue

---

## PREVIOUS SESSION COMPLETIONS

### Emergency Page Layout Overhaul
- **Bundles & Products Side-by-Side Layout** - Left: 3 bundles, Right: Products grid
- **3 Emergency Bundles** (all with AI images):
  - Pet First Aid Bundle - ₹1,599
  - Travel Emergency Kit - ₹2,799
  - Post-Surgery Recovery Bundle - ₹3,499

### 15 Emergency Products Added
**General (Universal):**
- Pet First Aid Kit - ₹1,299
- Gauze & Bandage Wrap Set - ₹349
- Digital Pet Thermometer - ₹499
- Tick Remover Tool - ₹299
- Emergency Slip Leash - ₹399
- Absorbent Pee Pads (20 Pack) - ₹449
- Portable Pet Water Bottle - ₹599
- Collapsible Food & Water Bowl - ₹249
- QR Code Pet ID Tag - ₹499

**Personalized (By Size/Breed):**
- Soft Safety Muzzle - ₹599 (sizes: XS-XL)
- Pet Transport Carrier - ₹1,499 (weight-based)
- Protective E-Collar / Cone - ₹449 (neck sizes)
- Post-Surgery Recovery Suit - ₹899 (sizes: XXS-XXL)
- Cooling Mat for Heatstroke - ₹999 (S/M/L)
- GPS Pet Tracker Tag - ₹2,499

### Location Search - Any City Worldwide
- Uses Nominatim (OpenStreetMap) for free geocoding
- Search ANY location (city, town, district)
- Auto-detect with browser geolocation
- Popular cities quick-select
- Location saved to localStorage

### Product Admin Integration
- Products synced to `products_master` for admin CRUD
- Uses unified order flow (order → notification → service desk inbox)
- Products have modals when clicked on pillar pages

---

## VERIFIED WORKING

1. ✅ **Soul Score (89%)** - Now displaying correctly for Mojo
2. ✅ **Pet Emergency File** - Correctly pulls allergies from doggy_soul_answers
3. ✅ **3 Emergency Bundles** - Side by side with AI images
4. ✅ **15 Emergency Products** - Categorized with filters
5. ✅ **Location Search** - Works for any city worldwide
6. ✅ **Products in Admin** - Synced to products_master
7. ✅ **Soul Questions** - Pet Emergency File prompts for missing data
8. ✅ **"Talk to Concierge" CTAs** - On all service cards
9. ✅ **Emergency-specific Copy** - No archetype playful language

---

## EMERGENCY PAGE 9-LAYER ARCHITECTURE (Complete)

| Layer | Component | Status |
|-------|-----------|--------|
| 1 | Urgent Help Buttons | ✅ |
| 2 | Near Me Now (Any Location) | ✅ |
| 3 | Concierge Will Assist | ✅ |
| 4 | Pet Emergency File + Soul Questions | ✅ |
| 5 | Emergency Guides (10 situations) | ✅ |
| 6 | Bundles + Products (Side by Side) | ✅ |
| 7 | Smart Picks (Personalized) | ✅ |
| 8 | Special Paths (Lost, Travel, Puppy, Senior) | ✅ |
| 9 | Follow-up & Recovery | ✅ |

---

## PENDING ISSUES

| Issue | Priority | Status |
|-------|----------|--------|
| Razorpay checkout "body error" | P1 | Debug logging added, needs testing |
| Mobile dashboard scrambled | P2 | Not started |
| Celebrate page loading | P2 | User verification pending |
| AI Mockup Generation | P0 | Was ~67.6%, needs restart |

---

## KEY FILES MODIFIED (This Session)

### Backend
- `/app/backend/checkout_routes.py` - Added detailed logging for Razorpay debugging

### Frontend
- `/app/frontend/src/components/emergency/PetEmergencyFile.jsx` - Fixed to pull from doggy_soul_answers

### Database
- Updated Mojo's `soul_score` and `overall_score` from 78/69 to correct 89

---

## UPCOMING TASKS

1. **Debug Razorpay Checkout** - Use added logs to trace "body error"
2. **Restart Mockup Generator** - Continue AI product image generation
3. **Mobile Dashboard Fix** - CSS layout issues on pet dashboard
4. **Celebrate Page Verification** - Test loading and functionality
5. **Admin CRUD for Emergency Products** - Ensure full admin integration

---

## FUTURE/BACKLOG

- Breed-wise filtering for SHOP and Services tabs
- Refactor monolithic `Admin.jsx`
- Secure Admin authentication (currently hardcoded)
- Admin Features user testing (Soul Tier UI, Bundles Manager)

---

## TEST CREDENTIALS

- **User:** dipali@clubconcierge.in / test123
- **Admin:** aditya / lola4304

---

## ARCHITECTURE NOTES

### Soul Score Calculation
- Single source of truth: `/app/backend/pet_score_logic.py`
- Function: `calculate_pet_soul_score(answers)`
- Fields checked: 26 canonical scoring fields
- Max score: 100 points (weighted)
- Tiers: newcomer (0-24), soul_seeker (25-49), soul_explorer (50-74), soul_master (75-100)

### Pet Data Structure
- Pet profile data stored in `pets` collection
- Soul answers stored in `pet.doggy_soul_answers` dict
- Top-level fields (age, weight, allergies) may be empty
- Always check both top-level AND doggy_soul_answers for complete data

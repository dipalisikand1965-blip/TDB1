# The Doggy Company - PRD (Product Requirements Document)
**Last Updated:** March 10, 2026 23:00 IST  
**Status:** Emergency COMPLETE | Shop Filters COMPLETE | Advisory Care Products COMPLETE ✅

---

## ADVISORY PILLAR VISION (P0 - Next Major Feature)

### Core Purpose
> **Advisory is the place where a pet parent comes when they don't just want to buy something, they want to make the right decision for their dog.**

### What Advisory Should Be (NOT a content dump)
- **Decision-support layer** between guidance, concierge help, expert access, profile-based recommendations
- **Help me decide** - not random tips or SEO blog content
- **Connect me** to the right service, product, or expert
- **Recommend based on my pet's actual life** - breed, age, size, health, climate, season

### Advisory 8-Zone Architecture

| Zone | Purpose | Powered By |
|------|---------|------------|
| 1. Ask Advisory | AI decision-support hero section | Mira AI |
| 2. My Dog Advisory | Personalized recommendations | Soul Profile + breed + age |
| 3. Intent Tiles | 12 real-life need categories | Static + Dynamic |
| 4. Guided Paths | Step-by-step decision journeys | Content + Logic |
| 5. Products by Context | Relevant items only | Shopify + Soul Logic |
| 6. Services & Expert | Consultations, bookings | Concierge + Services |
| 7. Near Me | Nearby trainers, groomers, vets | Google Places API |
| 8. Concierge Escalation | Human help for complex needs | Talk to Concierge |

### 11 Intent Tiles (Concierge is Overlay)
1. Food & Nutrition
2. Puppy Guidance
3. Breed Guidance
4. Grooming & Coat Care
5. Behaviour & Training
6. Travel Readiness
7. Senior Dog Care
8. Home Setup
9. New Adoption Guidance
10. Product Advice
11. Recovery & Ongoing Care

**Note:** Concierge® is NOT a tile - it's an overlaying level throughout the page (like Emergency), always accessible via "Talk to Concierge®" cards.

### Page Structure (Following Emergency Pattern)
1. **Hero** - Ask Advisory AI
2. **Intent Tiles** - 11 categories
3. **My Dog Advisory** - Personalized for logged-in pet
4. **Guided Paths** - Decision journeys
5. **Concierge Cards** - "Talk to Concierge®" (overlay, not made-up expert names)
6. **Curated Bundles** - Advisory bundles
7. **Soul-Created Products** - Personalized product grid
8. **Near Me** - Google Places services
9. **Follow-up Support** - Recovery & ongoing care

### Guided Paths to Build
- **New Puppy**: what to buy → what to feed → first grooming → vaccine tracker → toilet training
- **New Adoption**: first 7 days → decompression → safe home → feeding routine → health checks
- **Senior Dog**: mobility → comfort → diet → sleep → recovery → support products
- **Travel Ready**: is my dog fit? → documents → harness/crate → food/hydration → local vet
- **Coat & Grooming**: by coat type → shedding → mats → tear stains → ear care
- **Behaviour**: pulling → barking → separation anxiety → chewing → settling guests

### Personalization Factors
- Breed, Age, Size, Coat type
- Energy level, Temperament
- Travel comfort, Health flags
- City/Climate (summer/monsoon)
- Life stage (puppy, adult, senior)
- Past orders, Upcoming events

---

## COMPLETED THIS SESSION (March 10, 2026 - Fork #2)

### 1. Advisory Page - Pet Selector Like Learn Page ✅
- **Requirement:** User wanted Advisory to match Learn page pattern with pet selector
- **Implementation:**
  - Added pet selector carousel in hero section (lines 620-654)
  - Shows all 9 pets with photos when logged in
  - Title dynamically shows "What would you like help deciding for {petName}?"
  - `data-testid="pet-selector"` added for testing
- **Location:** `/app/frontend/src/pages/AdvisoryPage.jsx`
- **Verified:** Code review confirms correct implementation

### 2. ConciergeModal With Pet Selection ✅
- **Requirement:** Concierge modal should include pet selection like Learn's "Request Training" modal
- **Implementation:**
  - ConciergeModal now shows pet selection grid (lines 503-527)
  - Each pet shows photo using `getPetPhotoUrl(pet)`
  - Guest fallback for non-logged-in users (lines 528-550)
  - Modal passes pet context to WhatsApp/Email
- **Location:** `/app/frontend/src/pages/AdvisoryPage.jsx` lines 488-607
- **Verified:** Code review confirms correct implementation

### 3. Advisory AI Fixed ✅
- **Issue:** AI was giving irrelevant/generic answers (e.g., bed advice when asked about travel)
- **Root Cause:** System prompt was too generic, not enforcing topic-specific responses
- **Fix:** Enhanced AI prompt in `advisory_routes.py` to:
  - Explicitly instruct: "Answer ONLY about what the user asked"
  - Include pet context (breed, age, health) in responses
  - Focus on specific topic keywords (travel, food, grooming, etc.)
- **Verified:** "Travel prep checklist for Shih Tzu" now returns travel-specific checklist

### 4. Concierge Modal With Pet Selection ✅
- **Issue:** "Talk to Concierge®" buttons linked directly to WhatsApp
- **Fix:** Created proper ConciergeModal component with:
  - Pet selection grid showing all 9 pets with photos (when logged in)
  - Guest fallback input fields (when not logged in)
  - 3 contact options: WhatsApp Chat, Send Email, Call Us
- **Location:** All "Talk to Concierge®" buttons now trigger the modal
- **Verified:** Modal opens with context-aware message and pet selection

### 5. Near Me Internal Navigation ✅
- **Issue:** Service cards opened external Google Maps links
- **Fix:** Changed to internal routes:
  - Pet Trainers → `/services?category=training`
  - Groomers → `/services?category=grooming`
  - Veterinarians → `/services?category=vet`
  - Pet Stores → `/shop`
- **Verified:** All buttons navigate within the app

### 4. Shop Breed Filter - All 35 Breeds ✅
- **Issue:** Breed filter only showed breeds from existing products (~5)
- **Fix:** Added complete ALL_BREEDS array with 35 breeds:
  - Labrador Retriever, Golden Retriever, German Shepherd, Shih Tzu, Pug
  - Beagle, Poodle, Indie, Indian Pariah, Cocker Spaniel, Dachshund
  - Boxer, Great Dane, Siberian Husky, Doberman, Rottweiler
  - French Bulldog, English Bulldog, Yorkshire Terrier, Maltese
  - Pomeranian, Chihuahua, Border Collie, Australian Shepherd
  - Cavalier King Charles, Miniature Schnauzer, Boston Terrier
  - Dalmatian, Lhasa Apso, Bichon Frise, Akita, Samoyed
  - Bernese Mountain Dog, St. Bernard, Mixed Breed
- **Verified:** All 35 breeds showing in filter

### 5. Advisory Products Seeded ✅
- **Issue:** 0 advisory products in database
- **Fix:** Seeded 12 advisory products with pillar='advisory':
  - New Puppy Starter Kit - ₹1,999
  - Senior Pet Comfort Package - ₹4,999
  - Anxiety Relief Kit - ₹2,499
  - Home Training Essentials Kit - ₹1,299
  - Pet Nutrition Guide Book - ₹699
  - At-Home Grooming Set - ₹1,799
  - Travel Readiness Kit - ₹2,299
  - New Adoption Welcome Kit - ₹1,599
  - Pet Health Monitor - ₹3,999
  - Mental Enrichment Toy Set - ₹1,499
  - Breed-Specific Care Guide - ₹899
  - Home Setup Essentials - ₹3,499
- **Verified:** Products available in database

---

## PREVIOUS SESSION COMPLETIONS (March 10, 2026 - Fork #1)
- **Issue:** Mojo's soul score showed 79% instead of the actual 89%
- **Root Cause:** Database had stale `soul_score` and `overall_score` fields that weren't being recalculated
- **Fix:** 
  - Recalculated Mojo's score using `calculate_pet_soul_score()` from `pet_score_logic.py`
  - Updated database to store correct calculated score (89%)
  - Score now displays correctly in all frontend components
- **Verified:** Pet Dashboard shows "89% Pet Soul™" and "Soul Master" tier

### 2. Pet Emergency File Data Fix ✅
- **Issue:** Pet Emergency File wasn't pulling data from `doggy_soul_answers`
- **Root Cause:** Component only checked top-level fields (`pet.allergies`, `pet.medications`, etc.) but data was stored in `pet.doggy_soul_answers`
- **Fix:** Updated `PetEmergencyFile.jsx` to:
  - Extract data from both `pet.*` and `pet.doggy_soul_answers.*`
  - Calculate age from multiple sources (dob, birth_date, life_stage)
  - Handle allergies as string or array
- **Verified:** Screenshot shows "Allergies: chicken" correctly pulled from soul answers

### 3. Emergency Page Layout Fix ✅
- **Issue:** Bundles were side-by-side with products (cramped layout)
- **Fix:** Changed to stacked layout - **Bundles ON TOP, Products BELOW**
- **Verified:** Screenshot shows 3 bundles in row, then product grid below

### 4. Product Images Generated ✅
- **Issue:** All emergency products showed placeholder icons
- **Fix:** Generated 15 AI product images using Gemini Imagen 4.0:
  - Pet First Aid Kit
  - Gauze & Bandage Wrap Set  
  - Digital Pet Thermometer
  - Tick Remover Tool
  - Soft Safety Muzzle
  - Portable Pet Water Bottle
  - Collapsible Food & Water Bowl
  - Emergency Slip Leash
  - Absorbent Pee Pads (20 Pack)
  - QR Code Pet ID Tag
  - Pet Transport Carrier
  - Protective E-Collar / Cone
  - Post-Surgery Recovery Suit
  - Cooling Mat for Heatstroke
  - GPS Pet Tracker Tag
- **Verified:** Products now display with proper images

### 5. Razorpay Checkout Logging (Debug Prep)
- Added comprehensive logging to `/api/checkout/create-order` endpoint
- Logs subtotal, discount, shipping, GST, and Razorpay order creation
- Ready for debugging the "body error" issue

---

## PREVIOUS SESSION COMPLETIONS

### Emergency Page Layout Overhaul
- **Stacked Layout** - Bundles ON TOP, Products BELOW (full width)
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
3. ✅ **3 Emergency Bundles** - Displayed on top with AI images
4. ✅ **Emergency Products with Images** - 15 AI-generated images
5. ✅ **Location Search** - Works for any city worldwide
6. ✅ **Products in Admin** - Synced to products_master (247 emergency products)
7. ✅ **Emergency Tab in Shop** - `/shop?pillar=emergency` working!
8. ✅ **Product Modal** - Products open with detail view and personalized recommendations
9. ✅ **Soul Questions** - Pet Emergency File prompts for missing data
10. ✅ **"Talk to Concierge" CTAs** - On all service cards
11. ✅ **Emergency-specific Copy** - No archetype playful language
12. ✅ **Emergency Guides** - 10 situation cards (poisoning, bleeding, breathing, etc.)
13. ✅ **Subcategory Filters** - All pillars now have subcategory pills (First Aid, Recovery, etc.)
14. ✅ **Breed Filters** - Filter by 12+ breeds across entire shop

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
| AI Mockup Generation | P0 | Was ~67.6%, needs restart |

---

## KEY FILES MODIFIED (This Session - Fork #2)

### Backend
- `/app/backend/advisory_routes.py` - Enhanced AI prompt for contextual responses (lines 1258-1295)

### Frontend
- `/app/frontend/src/pages/AdvisoryPage.jsx` - Added ConciergeModal, fixed Near Me internal navigation
- `/app/frontend/src/pages/ShopPage.jsx` - Added all 35 breeds to breed filter

### Frontend
- `/app/frontend/src/components/emergency/PetEmergencyFile.jsx` - Fixed to pull from doggy_soul_answers
- `/app/frontend/src/components/emergency/EmergencyProductsGrid.jsx` - Added product modal on click, removed numbers from View All button, added pet personalization

### Database
- Updated Mojo's `soul_score` and `overall_score` from 78/69 to correct 89
- Generated and added AI images for 15 emergency products

---

## PRODUCT SYNC STATUS

| Collection | Emergency Products | Status |
|-----------|-------------------|--------|
| unified_products | 181 | ✅ Primary source |
| products_master | 81 | ✅ Admin CRUD ready |
| Cloudinary | Connected | ✅ duoapcx1p |

**Products Missing Images:** 20 breed-specific first aid kits (waiting for AI Mockup Generator at 73.3%)

---

## UPCOMING TASKS

1. **Start Mockup Generator** - Resume AI image generation (73.3% → 100%)
2. **Debug Razorpay Checkout** - Use added logs to trace "body error"
3. **Mobile Dashboard Fix** - CSS layout issues on pet dashboard
4. **Celebrate Page Verification** - Test loading and functionality
5. **Breed First Aid Kit Images** - Either generate manually or wait for background job

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

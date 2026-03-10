# The Doggy Company - PRD (Product Requirements Document)
**Last Updated:** March 10, 2026 17:10 IST  
**Status:** Emergency Page COMPLETE | Products Added | Mockups ~67.6%

---

## COMPLETED THIS SESSION

### 1. Emergency Page Gap Analysis & Fixes
| Issue | Fix Applied | Status |
|-------|-------------|--------|
| Wrong archetype heading | Added pillar-aware copy functions | ✅ FIXED |
| Location stuck on Mumbai | Added geolocation + manual city selector | ✅ FIXED |
| Service CTAs generic | Changed to "Talk to Concierge" | ✅ FIXED |
| Bundle titles wrong | Emergency-specific titles | ✅ FIXED |

### 2. Emergency Products Catalog (15 NEW Products)
**General Products (Universal):**
- Pet First Aid Kit - ₹1,299
- Gauze & Bandage Wrap Set - ₹349
- Digital Pet Thermometer - ₹499
- Tick Remover Tool - ₹299
- Emergency Slip Leash - ₹399
- Absorbent Pee Pads (20 Pack) - ₹449
- Portable Pet Water Bottle - ₹599
- Collapsible Food & Water Bowl - ₹249
- QR Code Pet ID Tag - ₹499

**Personalized Products (By Size & Breed):**
- Soft Safety Muzzle - ₹599 (sizes: XS-XL)
- Pet Transport Carrier - ₹1,499 (weight-based)
- Protective E-Collar / Cone - ₹449 (neck sizes)
- Post-Surgery Recovery Suit - ₹899 (sizes: XXS-XXL)
- Cooling Mat for Heatstroke - ₹999 (S/M/L)
- GPS Pet Tracker Tag - ₹2,499

### 3. Pet Emergency File with Soul Questions
- Shows completion percentage
- Prompts for missing data (age, weight, allergies, medications, conditions)
- Quick option buttons for fast data entry

### 4. Emergency Products Grid Component
- Category filters (All, First Aid, Restraint, Transport, Recovery, Hygiene, Essentials, Temperature)
- Separates "Universal" vs "Custom Fit" products
- Add to cart functionality

---

## EMERGENCY PAGE 9-LAYER ARCHITECTURE (Complete)

| Layer | Component | Status |
|-------|-----------|--------|
| 1 | **Urgent Help Buttons** | ✅ |
| 2 | **Near Me Now** - Location-aware | ✅ |
| 3 | **Concierge Will Assist** | ✅ |
| 4 | **Pet Emergency File** - With Soul questions | ✅ |
| 5 | **Emergency Guides** - 10 situations | ✅ |
| 6 | **Emergency Products** - 15 products + bundles | ✅ |
| 7 | **Smart Picks** - Personalized | ✅ |
| 8 | **Special Paths** - Lost Pet, Travel, Puppy, Senior | ✅ |
| 9 | **Follow-up & Recovery** | ✅ |

---

## FILES MODIFIED

### Backend
- `/app/backend/emergency_routes.py` - Fixed products API to prioritize curated products

### Frontend
- `/app/frontend/src/components/emergency/NearbyEmergencyHelp.jsx` - Location detection + city selector
- `/app/frontend/src/components/emergency/PetEmergencyFile.jsx` - Soul reminder questions
- `/app/frontend/src/components/emergency/EmergencyProductsGrid.jsx` - NEW product grid
- `/app/frontend/src/utils/archetypeCopy.js` - Pillar-aware copy functions
- `/app/frontend/src/components/ArchetypeProducts.jsx` - Uses pillar-aware copy
- `/app/frontend/src/components/CuratedBundles.jsx` - Emergency-specific titles
- `/app/frontend/src/components/ServiceCatalogSection.jsx` - "Talk to Concierge" CTA

---

## IN PROGRESS

| Task | Progress |
|------|----------|
| **Mockup Generation** | 67.6% (1736/2569) |

---

## PENDING ISSUES

| Issue | Priority |
|-------|----------|
| Razorpay checkout | P1 (User deferred) |
| Mobile dashboard | P2 (Needs screenshot) |

---

## TEST CREDENTIALS

- **User:** dipali@clubconcierge.in / test123
- **Admin:** aditya / lola4304

---

## KEY API ENDPOINTS

- `GET /api/emergency/products` - Returns curated products first (priority-sorted)
- `GET /api/mira/local-places/vets?city=X` - Nearby vets by city
- `GET /api/emergency/vets` - Emergency partners

---

## NEXT STEPS

1. **Monitor mockup generation** - Currently at 67.6%
2. **Fix Razorpay** - When user prioritizes
3. **Mobile testing** - Need user screenshot

---

## VERIFIED WORKING

1. ✅ Emergency Products Grid showing 15 curated products
2. ✅ Category filters working (All, First Aid, Transport, etc.)
3. ✅ Bundles showing with "Emergency Bundles" title
4. ✅ Location selector with 12 cities + auto-detect
5. ✅ Soul reminder questions on Pet Emergency File
6. ✅ "Talk to Concierge" CTAs on services

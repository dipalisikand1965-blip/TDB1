# The Doggy Company - PRD (Product Requirements Document)
**Last Updated:** March 10, 2026 15:35 IST  
**Status:** Emergency Page Gap Analysis COMPLETE | All Issues Fixed

---

## PRODUCT VISION
Hyper-personalized pet platform using "memory-led personalization" - products, content, and experiences tailored to each pet's breed, archetype, and life stage.

---

## COMPLETED: EMERGENCY PAGE GAP ANALYSIS FIXES (March 10, 2026)

### Issues Identified & Resolved

| Issue | Root Cause | Fix Applied | Status |
|-------|------------|-------------|--------|
| **Wrong archetype heading** ("Social favorites for popular pup") | Archetype copy not pillar-aware | Added `getPillarAwareGreeting/ProductIntro/BundleIntro` functions | ✅ FIXED |
| **Location stuck on Mumbai** | API hardcoded `city=Mumbai` | Added browser geolocation + manual city selector modal | ✅ FIXED |
| **Service CTAs generic** | "Tap to book" not appropriate for emergency | Changed to "Talk to Concierge" for emergency pillar | ✅ FIXED |
| **Bundle titles wrong** | CuratedBundles used archetype names | Added pillar awareness - shows "Emergency Bundles" | ✅ FIXED |

### Files Modified
- `/app/frontend/src/components/emergency/NearbyEmergencyHelp.jsx` - Complete rewrite with:
  - Browser geolocation detection
  - Reverse geocoding for city name
  - Manual city selector modal
  - localStorage caching
  - 12 cities supported (Mumbai, Delhi, Bangalore, Chennai, etc.)
- `/app/frontend/src/utils/archetypeCopy.js` - Added:
  - `EMERGENCY_COPY` object with calming language
  - `getPillarAwareGreeting()`
  - `getPillarAwareProductIntro()`
  - `getPillarAwareBundleIntro()`
- `/app/frontend/src/components/ArchetypeProducts.jsx` - Uses pillar-aware copy
- `/app/frontend/src/components/CuratedBundles.jsx` - Uses pillar-aware titles
- `/app/frontend/src/components/ServiceCatalogSection.jsx` - Shows "Talk to Concierge" CTA

---

## EMERGENCY PAGE 9-LAYER ARCHITECTURE (Complete)

| Layer | Component | Status |
|-------|-----------|--------|
| 1 | **Urgent Help Buttons** - Call Vet, Find Clinic, Poison Help, Ambulance, Pet File | ✅ |
| 2 | **Near Me Now** - Location-aware clinic finder with city selector | ✅ |
| 3 | **Concierge Will Assist** - WhatsApp-based human support | ✅ |
| 4 | **Pet Emergency File** - Auto-loaded pet medical info | ✅ |
| 5 | **Emergency Guides** - 10 actionable guides with Do/Don't | ✅ |
| 6 | **Emergency Products** - Bundles with contextual titles | ✅ |
| 7 | **Smart Picks** - Personalized products with emergency copy | ✅ |
| 8 | **Special Paths** - Lost Pet, Travel, Puppy, Senior | ✅ |
| 9 | **Follow-up & Recovery** - Post-emergency support | ✅ |

---

## KEY FEATURES

### Location System
- **Auto-detect**: Uses browser geolocation
- **Reverse geocoding**: Gets city name from coordinates (via Nominatim)
- **Manual override**: Modal with 12 pre-configured cities
- **Persistence**: Saves to localStorage for return visits
- **Fallback**: Defaults to Mumbai if detection fails

### Pillar-Aware Copy System
- Emergency pillar uses calming, supportive language:
  - "Essential care for {pet}"
  - "Safety first for {pet}"
  - "Emergency preparedness kits for your pet"
- Other pillars use fun archetype-specific copy

---

## COMPLETED WORK THIS SESSION

1. ✅ **Emergency Page 9-Layer Redesign**
2. ✅ **Bundle Modal Fix** - Clicking bundles opens detail modal
3. ✅ **Location Detection** - Auto-detect + manual city selector
4. ✅ **Emergency-Specific Copy** - No more "Social favorites" on emergency page
5. ✅ **Concierge CTAs** - Services show "Talk to Concierge"

---

## PENDING ISSUES

| Issue | Priority | Status |
|-------|----------|--------|
| Razorpay checkout "body error" | P1 | NOT STARTED (User deferred) |
| Mobile dashboard scrambled | P2 | User verification needed |
| AI Mockup Generation | P0 | ~62% complete |

---

## NEXT STEPS

1. **Continue mockup generation** - Run `cd /app/backend && python3 auto_mockup_generator.py`
2. **Fix Razorpay checkout** - P1 blocker (when user prioritizes)
3. **Mobile verification** - Need user screenshot
4. **Production sync** - After 80%+ mockups complete

---

## TEST CREDENTIALS

- **User:** dipali@clubconcierge.in / test123
- **Admin:** aditya / lola4304

---

## KEY API ENDPOINTS

### Emergency & Location
- `GET /api/mira/nearby-places?lat=X&lng=Y` - Nearby places by coords
- `GET /api/mira/local-places/vets?city=X` - Vets by city name
- `GET /api/emergency/vets` - Emergency partners (fallback)
- `POST /api/emergency/request` - Submit emergency request

### Bundles
- `GET /api/bundles?pillar=emergency` - Get bundles by pillar
- `POST /api/bundles/{id}/generate-image` - Generate AI image

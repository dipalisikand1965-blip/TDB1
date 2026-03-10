# Emergency Page Gap Analysis
**Date:** March 10, 2026  
**Status:** Issues Identified, Fixes Required

---

## CRITICAL ISSUES

### 1. Wrong Archetype Copy on Emergency Page
**Issue:** "Social favorites for your popular pup" displays on Emergency page  
**Root Cause:** `ArchetypeProducts` component uses generic archetype copy that's not contextually appropriate for emergency situations  
**Fix:** Add `pillar` prop to copy generation - use emergency-appropriate language  
**Impact:** HIGH - Confuses users in distress

### 2. Location Hardcoded to Mumbai
**Issue:** NearbyEmergencyHelp shows Mumbai results even when user is in Nilgiris  
**Root Cause:** Line 62 hardcodes `city=Mumbai`: `${API_URL}/api/mira/local-places/vets?city=Mumbai&limit=10`  
**Fix:** 
- Use browser geolocation to detect actual city
- Add city input field for manual override
- Call Google Places API with actual coordinates
**Impact:** HIGH - Users cannot find nearby emergency help

### 3. Service Cards Missing Images/Content
**Issue:** Second screenshot shows blank service cards with only "Tap to book" visible  
**Root Cause:** Service images may not be loading, or services for `emergency` pillar have no images  
**Fix:** Ensure all emergency services have fallback visuals
**Impact:** MEDIUM - UI looks broken

### 4. CTA Should Be "Talk to Concierge"
**Issue:** Generic CTAs instead of concierge-focused actions  
**Fix:** Update service cards in Emergency context to use "Talk to Concierge" CTA  
**Impact:** MEDIUM - Missed UX opportunity

---

## DETAILED FIX PLAN

### Fix 1: Emergency-Specific Archetype Copy
File: `/app/frontend/src/utils/archetypeCopy.js`
- Add `pillar` parameter to copy functions
- When pillar='emergency', use calming/supportive language regardless of archetype

### Fix 2: Location Detection & Override
File: `/app/frontend/src/components/emergency/NearbyEmergencyHelp.jsx`
- Use actual browser coordinates
- Add reverse geocoding to get city name
- Add "Change Location" button
- Store in localStorage for returning users

### Fix 3: Service Card Rendering
File: `/app/frontend/src/components/ServiceCatalogSection.jsx`
- Ensure emergency services have fallback images
- Check API response for image_url field

### Fix 4: Concierge CTA
File: `/app/frontend/src/pages/EmergencyPage.jsx`
- Pass `conciergeCTA={true}` to service components
- Update button text to "Talk to Concierge"

---

## IMPLEMENTATION ORDER
1. ✅ Fix Location Detection (P0 - Critical for core functionality)
2. ✅ Fix Archetype Copy for Emergency (P1 - Contextual messaging)
3. ✅ Fix Concierge CTA (P1 - UX improvement)
4. ✅ Check Service Images (P2 - Visual polish)

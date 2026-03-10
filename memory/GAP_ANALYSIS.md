# Emergency Page Gap Analysis
**Date:** March 10, 2026
**Page:** /emergency

---

## VISUAL/UI GAPS

### 1. Product Images Missing - ✅ FIXED
**Status:** RESOLVED
**Fix Applied:** Generated 11 AI product images using Gemini Imagen and updated database
- Pet First Aid Kit
- Gauze & Bandage Wrap Set
- Digital Pet Thermometer
- Tick Remover Tool
- Soft Safety Muzzle
- Portable Pet Water Bottle
- Collapsible Food & Water Bowl
- Emergency Slip Leash
- Absorbent Pee Pads
- QR Code Pet ID Tag
- Pet Transport Carrier
- Protective E-Collar
- Post-Surgery Recovery Suit
- Cooling Mat
- GPS Pet Tracker

### 2. Bundle Card Title Truncation (MEDIUM)
**Current:** "Post-Surgery Recovery Bundle" gets cut off on smaller widths
**Expected:** Full title visible or proper ellipsis with tooltip
**Fix:** Adjust text-clamp or card min-width

### 3. Product Card Heights Inconsistent (LOW)
**Current:** Cards have slightly different heights due to variable content
**Expected:** Uniform card heights in grid
**Fix:** Add fixed height or min-height to card containers

---

## DATA/CONTENT GAPS

### 4. Missing Product Categories (MEDIUM)
**Current:** Products missing proper `category` field for filtering
**Expected:** Every product should have one of: first-aid, restraint, transport, recovery, hygiene, essentials, temperature
**Fix:** Update database to add category to each product

### 5. Personalized Products Empty (MEDIUM)  
**Current:** "Personalized by Size & Breed" section shows no products
**Expected:** Show muzzles, carriers, e-collars that need size selection
**Fix:** Mark size-dependent products with `personalized: true` and `sizes` array

### 6. Product Descriptions Missing (LOW)
**Current:** Products only show name and price
**Expected:** Short description explaining what each product is for
**Fix:** Add `description` field to products or show in modal on click

---

## FUNCTIONAL GAPS

### 7. No Quick Add to Cart Feedback (LOW)
**Current:** Cart icon button adds silently (just toast)
**Expected:** Button animation, cart icon bounce, quantity badge update visible
**Fix:** Add animation state to cart button and connect to cart context

### 8. Filter Pills Don't Show Product Count (OPTIONAL)
**Current:** Category pills just show category name
**Expected:** "First Aid (5)" showing count per category
**Fix:** Calculate counts from filtered products

### 9. Missing "View All" Navigation (LOW)
**Current:** "View All X Products" button doesn't navigate anywhere
**Expected:** Should link to a dedicated emergency products page or expand grid
**Fix:** Add route handler or expand functionality

---

## PERSONALIZATION GAPS

### 10. No Breed-Specific Filtering (MEDIUM)
**Current:** Shows all products regardless of user's pet breed
**Expected:** Highlight/prioritize products matched to user's pet (e.g., Indie-sized muzzle)
**Fix:** Cross-reference with activePet.breed and weight to filter/sort

### 11. Missing "Recommended for Mojo" Section (OPTIONAL)
**Current:** Generic product grid
**Expected:** A highlighted row of "Top picks for [pet name]" based on breed/size/age
**Fix:** Add personalized recommendation logic using pet profile data

---

## URGENCY/CONTEXT GAPS

### 12. No "In Stock" Indicator (MEDIUM)
**Current:** No visibility into product availability
**Expected:** Stock status badge on each product
**Fix:** Add `in_stock` field and badge component

### 13. Missing Delivery Time Estimates (LOW)
**Current:** No shipping/delivery information shown
**Expected:** "Ships in 24h" or "Same day delivery available" badges
**Fix:** Add delivery metadata and display

### 14. No Emergency-Specific Urgency CTA (LOW)
**Current:** Standard "Add to Cart" flow
**Expected:** "Get it NOW" or express checkout option for emergencies
**Fix:** Add express checkout path for emergency products

---

## COMPLETED FIXES ✅

1. ✅ Bundles now displayed ON TOP (not side-by-side)
2. ✅ Products displayed BELOW bundles
3. ✅ Full-width layout instead of cramped 2-column
4. ✅ Soul Score shows correct 89% (was 79%)
5. ✅ Pet Emergency File pulls data from doggy_soul_answers
6. ✅ All CTAs say "Talk to Concierge"
7. ✅ **Product Images Generated** - 15 AI-generated product images added
8. ✅ **Pet Dashboard** verified showing 89% Soul Master

---

## PRIORITY ACTIONS

| Priority | Gap | Effort | Impact |
|----------|-----|--------|--------|
| P0 | Product Images | High | Critical for conversion |
| P1 | Product Categories | Medium | Enables filtering |
| P1 | Personalized Products | Medium | Key differentiation |
| P2 | Stock Indicators | Low | Trust signal |
| P2 | Breed Filtering | Medium | Personalization |
| P3 | All other UI polish | Low | Nice-to-have |

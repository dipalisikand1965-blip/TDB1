# AUDIT: Celebrate & Dine Pillars - Gap Analysis

**Date:** December 2025  
**Purpose:** Identify what's built, what's working, and what's missing in the Celebrate and Dine pillars

---

## EXECUTIVE SUMMARY

| Feature | Celebrate | Dine | Status |
|---------|-----------|------|--------|
| CuratedConciergeSection | ✅ Implemented | ✅ Implemented | WORKING |
| Location-aware badge ("Curated for Bengaluru") | ✅ Working | ✅ Working | WORKING |
| Soul-based personalization | ✅ Working | ✅ Working | WORKING |
| NearbyPlacesCarousel | ❌ NOT ADDED | ✅ Implemented | GAP |
| TheDoggyBakery Promo | ✅ Coded but not visible | N/A | VERIFY |
| YouTube Integration | ❌ NOT IMPLEMENTED | ❌ NOT IMPLEMENTED | GAP |
| Eventbrite Events | ❌ NOT IMPLEMENTED | ❌ NOT IMPLEMENTED | GAP |
| Weather-aware suggestions | ❌ NOT IMPLEMENTED | ❌ NOT IMPLEMENTED | GAP |

---

## CELEBRATE PILLAR AUDIT

### ✅ WHAT'S WORKING

1. **CuratedConciergeSection** (Lines 504-510 of CelebratePage.jsx)
   - Shows "Mira's Picks for [Pet]"
   - Location badge "Curated for [City]"
   - Personalized concierge cards based on pet soul traits
   - Creates tickets on CTA click

2. **Backend Intelligence Layer**
   - `celebrate_concierge_cards.py` - 10 cards total (5 products, 5 services)
   - Persona-based scoring (elegant, playful, anxious, etc.)
   - Breed & size affinity
   - Micro-questions for thin profiles

3. **TheDoggyBakery Promo** (Lines 514-548)
   - Code exists in CelebratePage.jsx
   - Shows Pan India Delivery badge
   - Links to thedoggybakery.com

### ❌ GAPS IN CELEBRATE

1. **No NearbyPlacesCarousel**
   - DinePage has it, CelebratePage doesn't
   - Should show: nearby pet bakeries, party venues, photographers
   - API exists: `get_celebrate_location_suggestions()` in location_concierge_service.py

2. **No YouTube Integration**
   - YouTube service exists (`/services/youtube_service.py`)
   - Has breed-specific training topics
   - NOT integrated into CelebratePage
   - **Missing:** Birthday party DIY videos, celebration tips videos

3. **No Eventbrite Events**
   - Eventbrite API configured (`EVENTBRITE_API_KEY` in .env)
   - Routes exist (`/api/enjoy/eventbrite/search`)
   - NOT shown on CelebratePage
   - **Missing:** Pet birthday party events, celebration meetups

4. **TheDoggyBakery Promo Visibility Issue**
   - Code exists but screenshots didn't show it
   - May be hidden due to conditional rendering or scroll position
   - **Needs verification**

### 📋 CELEBRATE BACKEND DATA
```
File: /app/backend/app/data/celebrate_concierge_cards.py
Cards: 10 total
- 5 Concierge Products: cake design, bespoke box, outdoor pack, photo kit, keepsake set
- 5 Concierge Services: end-to-end planning, home setup, photographer, venue, quiet plan
```

---

## DINE PILLAR AUDIT

### ✅ WHAT'S WORKING

1. **CuratedConciergeSection** (Lines 262-269 of DinePage.jsx)
   - Shows "Mira's Picks for [Pet]"
   - Location badge "Curated for [City]"
   - Personalized meal plans, dining kits, food switch plans

2. **NearbyPlacesCarousel** (Lines 273-284)
   - Shows real nearby pet-friendly restaurants
   - Uses Google Places API
   - Reserve button with onReserveClick handler

3. **Pet-Friendly Hangouts Section** (Lines 591-769)
   - City search with quick picks (Mumbai, Delhi, Goa, etc.)
   - Shows pet cafes and dog parks
   - Uses Foursquare API integration

4. **Backend Intelligence Layer**
   - `dine_concierge_cards.py` - 10 cards total
   - Allergy-safe filtering
   - Persona-based scoring

### ❌ GAPS IN DINE

1. **No YouTube Integration**
   - **Missing:** Cooking videos for homemade pet food
   - **Missing:** Nutrition tips videos by breed
   - Service exists but not integrated

2. **No Eventbrite Events**
   - **Missing:** Pet dining meetups, food festivals
   - API configured but not shown

3. **No Weather-Aware Suggestions**
   - OpenWeather API configured
   - Service exists (`/services/openweather_service.py`)
   - NOT used to suggest: "Hot today - try indoor cafes" or "Cool evening - outdoor dining perfect"

### 📋 DINE BACKEND DATA
```
File: /app/backend/app/data/dine_concierge_cards.py
Cards: 10 total
- 5 Concierge Products: weekly meal plan, food switch assistant, allergy blueprint, fresh subscription, dining-out kit
- 5 Concierge Services: reserve table, buddy meetup, private chef, won't eat fix, nutrition consult
```

---

## PLUMBING AUDIT - Backend Services

### ✅ CONFIGURED & AVAILABLE

| Service | API Key Status | Backend File | Frontend Usage |
|---------|----------------|--------------|----------------|
| Google Places | ✅ Configured | `location_concierge_service.py` | DinePage only |
| YouTube | ✅ Configured | `youtube_service.py` | ❌ NOT USED |
| Eventbrite | ✅ Configured | `enjoy_routes.py` | ❌ NOT USED in pillars |
| OpenWeather | ✅ Configured | `openweather_service.py` | ❌ NOT USED |
| Foursquare | ✅ Working | Via manual fetch in DinePage | DinePage only |

### 🔧 LOCATION-AWARE SERVICES (Backend)

```python
# /app/backend/services/location_concierge_service.py

# DINE - Returns:
get_dine_location_suggestions():
  - nearby_restaurants (from Google Places)
  - nearby_parks
  - personalized suggestions based on pet traits

# CELEBRATE - Returns:
get_celebrate_location_suggestions():
  - nearby_bakeries (from Google Places)
  - nearby_parks
  - personalized suggestions (birthday party, playdate party, home celebration)
```

### 🔧 YOUTUBE SERVICE (Backend Ready, Frontend Not Integrated)

```python
# /app/backend/services/youtube_service.py

# Available functions:
search_youtube_videos(query, max_results)
get_breed_training_videos(breed, life_stage)
get_topic_videos(topic, breed_context)

# Pre-defined trusted channels:
- Zak George, Kikopup, McCann Dog Training
- Victoria Stilwell, Cesar Millan

# Has breed-specific topics for:
golden retriever, labrador, german shepherd, beagle, indie, etc.
```

### 🔧 EVENTBRITE SERVICE (Backend Ready, Not Used in Pillars)

```python
# /app/backend/enjoy_routes.py

@router.get("/eventbrite/search")
@router.get("/eventbrite/pet-events")

# Currently only used in EnjoyPage, NOT in Celebrate/Dine
```

---

## PRIORITY FIXES

### P0 - High Impact, Quick Win

1. **Add NearbyPlacesCarousel to CelebratePage**
   - Backend API exists (`get_celebrate_location_suggestions`)
   - Component exists (`NearbyPlacesCarousel.jsx`)
   - Just need to add import and render (like DinePage)

2. **Verify TheDoggyBakery Promo Visibility**
   - Check if it renders correctly
   - May need to scroll to see it
   - Consider moving higher on page

### P1 - Medium Impact

3. **Add YouTube Section to Celebrate**
   - "DIY Party Tips for [Breed]"
   - Use existing `youtube_service.py`
   - Create component like `PillarVideoSection`

4. **Add YouTube Section to Dine**
   - "Homemade Meals for [Breed]"
   - "Nutrition Tips" based on pet age

### P2 - Future Enhancement

5. **Add Eventbrite Pet Events**
   - Show upcoming pet-friendly events in user's city
   - "Pet Birthday Parties Near You"
   - "Dog Food Festivals"

6. **Weather-Aware Suggestions**
   - "It's 35°C - indoor dining recommended"
   - "Cool evening - outdoor celebration perfect"

---

## FILES OF REFERENCE

### Frontend
- `/app/frontend/src/pages/CelebratePage.jsx` - Main celebrate page
- `/app/frontend/src/pages/DinePage.jsx` - Main dine page (reference for patterns)
- `/app/frontend/src/components/NearbyPlacesCarousel.jsx` - Location carousel
- `/app/frontend/src/components/Mira/CuratedConciergeSection.jsx` - Main picks component

### Backend
- `/app/backend/app/data/celebrate_concierge_cards.py` - Celebrate card library
- `/app/backend/app/data/dine_concierge_cards.py` - Dine card library
- `/app/backend/app/intelligence_layer.py` - Main intelligence logic
- `/app/backend/services/location_concierge_service.py` - Google Places integration
- `/app/backend/services/youtube_service.py` - YouTube API service
- `/app/backend/services/openweather_service.py` - Weather API service
- `/app/backend/mira_routes.py` - API endpoints (lines 24155+)

### Environment
- `/app/backend/.env` - All API keys configured

---

## ACTION ITEMS FOR NEXT SESSION

1. [ ] Add `NearbyPlacesCarousel` to CelebratePage (copy from DinePage)
2. [ ] Create `PillarVideoSection` component for YouTube integration
3. [ ] Add YouTube section to CelebratePage (party tips, DIY videos)
4. [ ] Add YouTube section to DinePage (nutrition videos, homemade meals)
5. [ ] Verify TheDoggyBakery promo visibility
6. [ ] Consider Eventbrite events widget
7. [ ] Consider weather-aware messaging

---

*This audit reflects the current state of Celebrate and Dine pillars as of December 2025.*

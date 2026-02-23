# Mira OS - Pet Operating System
## Product Requirements Document (SSOT)

### Original Problem Statement
The user, Dipali, is the founder of a "pet operating system" named Mira, built in honor of her grandmother and family legacy. The application's core is "Soul Intelligence" (a pet personality questionnaire) and "Mira" (an AI concierge). The core philosophy: "No is never an answer for a concierge. Mira tells us what the pet needs - always."

---

## ✅ SESSION 18 COMPLETED - February 23, 2026

### 1. Auto-Geolocation System (Complete)
**What was built:**
- Browser GPS detection on login
- Google reverse geocoding for city/state
- Save to user profile (`users.location` in MongoDB)
- Fallback to IP-based geolocation
- Session-based (only once per session)
- Delete/reset endpoint for incorrect locations

**APIs Added:**
- `GET /api/geo/reverse?lat=X&lng=Y` - Reverse geocode using Google
- `POST /api/member/location` - Save location to profile
- `DELETE /api/member/location` - Clear saved location

### 2. Location-Aware Intelligence Layer (Complete)
**What was built:**
- Curated picks endpoint now accepts Authorization header
- Extracts user location from token → user profile
- Passes `user_location` to pillar card selection
- Service cards show "— available in {city}" in `why_for_pet`
- Response includes `meta.user_location: {city, state}`
- Frontend shows "📍 Curated for {city}" badge

**Files Modified:**
- `/app/backend/mira_routes.py` - Added location extraction
- `/app/backend/app/data/dine_concierge_cards.py` - Location-aware why generation
- `/app/backend/app/data/celebrate_concierge_cards.py` - Location-aware why generation
- `/app/frontend/src/components/Mira/CuratedConciergeSection.jsx` - Location badge UI

### 3. Real-Time Location Suggestions API (Complete)
**New endpoint:**
`GET /api/mira/location-suggestions/{pillar}?pet_id=X&event_type=Y`

**Returns real Google Places data:**
- Dine: Pet-friendly restaurants, cafes, parks
- Celebrate: Pet bakeries, party venues
- Care: Veterinary clinics
- Enjoy: Groomers, pet spas

**Example Response for Bangalore:**
```json
{
  "nearby_restaurants": [
    {"name": "The Pet People Cafe", "rating": 4.7, "distance_km": 8.5},
    {"name": "Trippy Goat Cafe", "rating": 4.3, "distance_km": 1.5}
  ],
  "nearby_parks": [
    {"name": "The Weekend Dog Park @ Cubbon Park", "rating": 4.8}
  ]
}
```

### 4. Location Service Module (New)
**Created:** `/app/backend/services/location_concierge_service.py`
- `search_nearby_pet_friendly()` - Google Places text search with location bias
- `get_dine_location_suggestions()` - Dine-specific nearby places
- `get_celebrate_location_suggestions()` - Celebrate-specific nearby places
- Haversine distance calculation
- Open/closed status detection

### 5. API Documentation (Complete)
**Created:** `/app/memory/API_INTEGRATIONS.md`
- Complete list of configured APIs
- Pillar-by-pillar API strategy
- Pet product API research (HUFT, Supertails, Zigly)
- Pet service API research (PetBacker, Happy Pet Tech)
- Integration recommendations

---

## 📊 API INVENTORY

### Configured & Ready
| API | Key Variable | Use Cases |
|-----|--------------|-----------|
| Google Places | `GOOGLE_PLACES_API_KEY` | Nearby venues, restaurants, vets |
| Google Maps | Same | Directions, distance |
| Google Geocoding | Same | Reverse geocode |
| OpenWeather | `OPENWEATHER_API_KEY` | Weather alerts |
| Foursquare | `FOURSQUARE_API_KEY` | Venue details |
| Amadeus | `AMADEUS_API_KEY` | Travel/hotels |
| YouTube | `YOUTUBE_API_KEY` | Training videos |
| Eventbrite | `EVENTBRITE_API_KEY` | Pet events |

### Need Partnerships
- HUFT - No public API
- Supertails - No public API
- Zigly - Affiliate only (Cuelinks)
- PetBacker - No public API

---

## 🔲 PENDING USER VERIFICATION

| Feature | Status | Test Method |
|---------|--------|-------------|
| WebSocket notification flow | 🟡 USER VERIFY | Click CTA → Check bell count |
| Multi-pet sync | 🟡 USER VERIFY | Switch pet → Navigate pages |
| Mobile scroll-to-top | 🟡 USER VERIFY | Navigate between pages on mobile |
| Geolocation detection | 🟡 USER VERIFY | Clear cache, login fresh |

---

## 🔲 UPCOMING TASKS

### P0 - Next Sprint
- Display real nearby venues in Dine/Celebrate pages (not just badge)
- Add "Nearby Pet-Friendly" section with Google Places results
- Roll out location-aware picks to remaining 11 pillars

### P1 - High Priority
- Add distance/travel time to concierge cards
- Proactive alerts on PetHomePage (birthdays, vaccinations)
- Razorpay payment integration

### P2 - Medium Priority
- "Living Home" dynamic refresh mechanics
- Refactor `server.py` into smaller modules
- Consolidate fragmented database collections

---

## TEST CREDENTIALS

```
MEMBER LOGIN:
Email: dipali@clubconcierge.in
Password: test123
Location: Bangalore (manually set)

ADMIN LOGIN:
Username: aditya
Password: lola4304
```

---

*Last Updated: February 23, 2026 - End of Session 18*
*Preview URL: https://mira-soul.preview.emergentagent.com*

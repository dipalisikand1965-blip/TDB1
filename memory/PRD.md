# Mira OS - Pet Operating System
## Master Product Requirements Document (SSOT)

---

## 📋 ORIGINAL VISION

**Founder**: Dipali  
**Company**: The Doggy Company (thedoggycompany.com)  
**In-House Bakery**: TheDoggyBakery (thedoggybakery.com) - Pan India delivery

**Core Philosophy**: "No is never an answer for a concierge. Mira tells us what the pet needs - always."

**What Mira Is**:
- A Pet Operating System centered on "Soul Intelligence" (pet personality questionnaire)
- An AI Concierge (Mira) that knows pets personally
- A two-layer architecture: Concierge Layer (tickets) + Catalogue Layer (e-commerce)

---

## ✅ COMPLETED WORK (All Sessions)

### Session 18 - February 23, 2026 (Latest)

#### 1. Auto-Geolocation System
- ✅ Browser GPS detection on login
- ✅ Google reverse geocoding for city/state
- ✅ Save to user profile (`users.location`)
- ✅ Fallback to IP-based geolocation
- ✅ Session-based (once per session)
- ✅ Clear/reset endpoint for incorrect locations
- **APIs**: `GET /api/geo/reverse`, `POST /api/member/location`, `DELETE /api/member/location`

#### 2. Location-Aware Intelligence Layer
- ✅ Curated picks endpoint accepts Authorization header
- ✅ Extracts user location from token → profile
- ✅ Passes `user_location` to pillar card selection
- ✅ Service cards show "— available in {city}" in `why_for_pet`
- ✅ Response includes `meta.user_location: {city, state}`
- ✅ Frontend shows "📍 Curated for {city}" badge

#### 3. Real-Time Location Suggestions API
- ✅ `GET /api/mira/location-suggestions/{pillar}`
- ✅ Returns real Google Places data:
  - Dine: Pet-friendly restaurants, cafes, parks
  - Celebrate: Pet bakeries, party venues
  - Care: Veterinary clinics
  - Enjoy: Groomers, pet spas

#### 4. Unified API Integration Hub
- ✅ Created `/app/backend/services/api_integration_hub.py`
- ✅ Services: GoogleServices, WeatherService, FoursquareService, TravelService, EventsService, YouTubeService, NotificationService
- ✅ NotificationDispatcher with templates
- ✅ Pillar-API mapping

#### 5. Test Endpoints
- ✅ `GET /api/test/weather?lat=X&lng=Y`
- ✅ `GET /api/test/youtube?query=X`
- ✅ `GET /api/test/events?city=X`
- ✅ `GET /api/test/pillar-data/{pillar}`
- ✅ `GET /api/test/notification?channel=email|whatsapp|sms`

#### 6. UI Enhancements
- ✅ NearbyPlacesCarousel component created
- ✅ Added to DinePage (shows real nearby pet-friendly restaurants)
- ✅ TheDoggyBakery promotion added to CelebratePage

### Session 17 - Earlier

#### Mobile & 24/7 Fixes
- ✅ Fixed mobile dashboard header (scrambled with 12+ pets)
- ✅ Concierge hours changed to 24/7
- ✅ Audited Inbox & Service Desk two-way communication
- ✅ WebSocket real-time notifications

### Session 16 - Earlier

#### Multi-Pet Sync & WebSocket
- ✅ Pet selection syncs across Dashboard, Dine, Celebrate, Inbox
- ✅ Real-time notification bell updates via WebSocket
- ✅ Optimistic UI on CTA clicks

### Session 15 & Earlier

#### Intelligence Layer Foundation
- ✅ Varied `why_for_pet` explanations per card
- ✅ Card-specific `cta_text`
- ✅ High-contrast concierge card design
- ✅ Solid CTAs (pink products, purple services)
- ✅ Golden "why" line styling

---

## 🔧 CONFIGURED APIs (Ready to Use)

| API | Status | Use Cases |
|-----|--------|-----------|
| **Google Places** | ✅ Working | Nearby restaurants, vets, groomers |
| **Google Geocoding** | ✅ Working | Reverse geocode coordinates |
| **Google Vision** | ✅ Configured | Pet photo analysis |
| **Google Calendar** | ✅ Configured | Reminders, appointments |
| **OpenWeather** | ✅ Working | Weather alerts, good walk days |
| **YouTube** | ✅ Working | Training videos, tutorials |
| **Eventbrite** | ✅ Working | Pet events (city-based search) |
| **Foursquare** | ✅ Configured | Venue details, ratings |
| **Amadeus** | ✅ Configured | Pet-friendly hotels |
| **Viator** | ✅ Configured | Pet-friendly activities |
| **Resend** | ⚠️ Domain needed | Email notifications |
| **Gupshup** | ⚠️ Setup needed | WhatsApp/SMS |

---

## 📍 MONGODB STATUS

**Connection**: ✅ Healthy  
**Collections in use**:
- `users` (with `location` field for geolocation)
- `pets` (breed, size, allergies, soul_traits)
- `service_desk_tickets` (canonical ticket store)
- `mira_tickets` (synced)
- `mira_conversations` (chat history)
- `member_notifications` (user inbox)
- `admin_notifications` (concierge alerts)
- `curated_picks_cache` (30-min cache)
- `concierge_threads` (two-way chat)

---

## 🎯 PILLARS IMPLEMENTATION STATUS

| Pillar | Intelligence Layer | Location-Aware | YouTube | Real Venues |
|--------|-------------------|----------------|---------|-------------|
| **Celebrate** | ✅ Complete | ✅ Yes | 🔲 TODO | 🔲 TODO |
| **Dine** | ✅ Complete | ✅ Yes | 🔲 TODO | ✅ Carousel added |
| **Stay** | 🔲 TODO | 🔲 TODO | 🔲 TODO | 🔲 TODO |
| **Travel** | 🔲 TODO | 🔲 TODO | 🔲 TODO | 🔲 TODO |
| **Care** | 🔲 TODO | 🔲 TODO | 🔲 TODO | 🔲 TODO |
| **Enjoy** | 🔲 TODO | 🔲 TODO | 🔲 TODO | 🔲 TODO |
| **Fit** | 🔲 TODO | 🔲 TODO | 🔲 TODO | 🔲 TODO |
| **Learn** | 🔲 TODO | 🔲 TODO | ✅ API Ready | 🔲 TODO |
| **Paperwork** | 🔲 TODO | 🔲 TODO | 🔲 TODO | 🔲 TODO |
| **Advisory** | 🔲 TODO | 🔲 TODO | 🔲 TODO | 🔲 TODO |
| **Emergency** | 🔲 TODO | 🔲 TODO | 🔲 TODO | 🔲 TODO |
| **Farewell** | 🔲 TODO | 🔲 TODO | 🔲 TODO | 🔲 TODO |
| **Adopt** | 🔲 TODO | 🔲 TODO | 🔲 TODO | 🔲 TODO |

---

## 🔐 TEST CREDENTIALS

```
MEMBER LOGIN:
Email: dipali@clubconcierge.in
Password: test123
Location: Bangalore (saved in profile)

ADMIN LOGIN:
Username: aditya
Password: lola4304

TEST PHONE:
+919739908844
```

---

## 📁 KEY FILES REFERENCE

### Backend
```
/app/backend/
├── server.py                           # Main FastAPI app (large, needs refactor)
├── mira_routes.py                      # Curated picks, location suggestions
├── ticket_routes.py                    # Two-way communication
├── routes/
│   └── concierge_os_routes.py         # 24/7 hours config
├── services/
│   ├── api_integration_hub.py         # NEW: Unified API hub
│   ├── location_concierge_service.py  # NEW: Location-aware data
│   └── google_places_service.py       # Google Places wrapper
└── app/
    ├── intelligence_layer.py          # Card scoring logic
    └── data/
        ├── dine_concierge_cards.py    # Dine cards with location
        └── celebrate_concierge_cards.py # Celebrate cards with location
```

### Frontend
```
/app/frontend/src/
├── pages/
│   ├── MemberDashboard.jsx            # Fixed mobile header
│   ├── DinePage.jsx                   # + NearbyPlacesCarousel
│   ├── CelebratePage.jsx              # + TheDoggyBakery promo
│   └── MiraDemoPage.jsx               # Location detection improved
├── components/
│   ├── NearbyPlacesCarousel.jsx       # NEW: Real nearby venues
│   └── Mira/
│       └── CuratedConciergeSection.jsx # Location badge
├── context/
│   ├── AuthContext.jsx                # Auto-geolocation on login
│   └── PillarContext.jsx              # Global pet state
└── hooks/
    └── useMemberSocket.js             # WebSocket for notifications
```

### Documentation
```
/app/memory/
├── PRD.md                             # This file (SSOT)
├── API_INTEGRATIONS.md                # Comprehensive API list
└── INTEGRATION_SETUP.md               # Setup guide for notifications
```

---

## ⚠️ NEEDS USER ACTION

### 1. Resend Domain Verification
1. Go to https://resend.com/domains
2. Add domain: `thedoggycompany.com`
3. Add DNS records provided by Resend
4. Update `.env`: `SENDER_EMAIL=mira@thedoggycompany.com`

### 2. Gupshup WhatsApp Setup
1. Log in to https://gupshup.io
2. Verify Business Account
3. Register source number: +919739908844
4. Submit WhatsApp Business verification

---

## 🔲 PENDING USER VERIFICATION

| Feature | How to Test |
|---------|-------------|
| WebSocket notification flow | Click CTA → Check bell count increments |
| Multi-pet sync | Switch pet in nav → Navigate to Dine/Celebrate → Content updates |
| Mobile scroll-to-top | Navigate between pages on mobile |
| Geolocation detection | Clear cache, login fresh, allow location |

---

*Last Updated: February 23, 2026*
*Preview URL: https://pet-intent.preview.emergentagent.com*

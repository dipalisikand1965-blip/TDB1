# MIRA OS - Comprehensive Handover Document
## The World's First Pet Life Operating System

**Last Updated:** February 8, 2026
**Document Version:** 3.0 (Exhaustive Handover)
**Testing Status:** 100% Mobile Viewport Tests Passed

---

## TABLE OF CONTENTS
1. [Executive Summary](#executive-summary)
2. [API Integration Status](#api-integration-status)
3. [All Routes & Pages](#all-routes--pages)
4. [Service Desk Flow](#service-desk-flow)
5. [Data Models & Schemas](#data-models--schemas)
6. [Feature Implementation Details](#feature-implementation-details)
7. [Mobile & iOS Compatibility](#mobile--ios-compatibility)
8. [Known Issues & Fixes Applied](#known-issues--fixes-applied)
9. [Environment & Credentials](#environment--credentials)
10. [File Reference Map](#file-reference-map)

---

## EXECUTIVE SUMMARY

MIRA OS is a sophisticated AI-powered pet assistant with:
- **Chat Interface** with semantic search (E032)
- **Conversation Memory** (E033)
- **Pet Mood Detection** (E025)
- **Voice Personalities** (E024)
- **YouTube Training Videos** - In chat + Learn tab
- **Amadeus Travel** - Pet-friendly hotels
- **Viator Attractions** - Pet-friendly experiences
- **Foursquare Places** - Pet cafes, dog parks (fallback)
- **Soul Score System** - Profile completion prompts

---

## API INTEGRATION STATUS

| Service | Status | In Chat | In Pillar | API Key Location |
|---------|--------|---------|-----------|------------------|
| **YouTube** | ✅ Working | ✅ | ✅ Learn Tab | `backend/.env` → `YOUTUBE_API_KEY` |
| **Amadeus** | ✅ Working | ✅ | 🔲 Stay Page | `backend/.env` → `AMADEUS_API_KEY/SECRET` |
| **Viator** | ✅ Working | ✅ | 🔲 Stay Page | `backend/.env` → `VIATOR_API_KEY` |
| **Foursquare** | ⚠️ Fallback | ❌ | 🔲 | `backend/.env` → `FOURSQUARE_API_KEY` |
| **Google Places** | ✅ Working | ✅ | ✅ | `backend/.env` → `GOOGLE_PLACES_API_KEY` |
| **OpenWeather** | ✅ Working | ✅ | ❌ | `backend/.env` → `OPENWEATHER_API_KEY` |

### API Endpoints Created

#### YouTube Training Videos
```
GET /api/mira/youtube/videos?query=X&max_results=5
GET /api/mira/youtube/by-breed?breed=X
GET /api/mira/youtube/by-age?age_years=X&breed=X
GET /api/mira/youtube/by-topic?topic=X
GET /api/mira/youtube/recommended/{pet_id}
GET /api/mira/youtube/test
```

#### Amadeus Travel
```
GET /api/mira/amadeus/hotels?city=X&max_results=10
GET /api/mira/amadeus/travel-tips/{pet_id}?destination=X
GET /api/mira/amadeus/city-codes
GET /api/mira/amadeus/test
```

#### Viator Attractions
```
GET /api/mira/viator/attractions?city=X&query=X
GET /api/mira/viator/pet-friendly?city=X&limit=5
GET /api/mira/viator/day-trips?city=X
GET /api/mira/viator/nature?city=X
GET /api/mira/viator/recommended/{pet_id}?destination=X
GET /api/mira/viator/destinations
GET /api/mira/viator/test
```

#### Foursquare Places (with fallback)
```
GET /api/mira/foursquare/search?query=X&city=X
GET /api/mira/foursquare/pet-cafes?city=X
GET /api/mira/foursquare/dog-parks?city=X
GET /api/mira/foursquare/pet-stores?city=X
GET /api/mira/foursquare/groomers?city=X
GET /api/mira/foursquare/enrich?venue_name=X&city=X
GET /api/mira/foursquare/test
```

---

## ALL ROUTES & PAGES

### Public Routes
| Route | Component | Description |
|-------|-----------|-------------|
| `/` | Home | Landing page |
| `/login` | Login | User login |
| `/register` | Register | User registration |
| `/mira-demo` | MiraDemoPage | **Main Mira OS Interface** |
| `/mira-os` | MiraDemoPage | Alias for mira-demo |
| `/stay` | StayPage | Stay pillar - Pet-friendly accommodations |
| `/dine` | DinePage | Dine pillar - Pet-friendly restaurants |
| `/search` | SearchResults | Universal search |
| `/concierge` | MiraConcierge | Concierge service |

### Protected Routes (Require Auth)
| Route | Component | Description |
|-------|-----------|-------------|
| `/dashboard` | MemberDashboard | Member dashboard |
| `/checkout` | UnifiedCheckout | Cart checkout |
| `/pet-soul` | PetProfile | Soul score journey |
| `/pet-soul/{petId}` | PetProfile | Pet-specific soul journey |
| `/my-tickets` | MyTickets | User's service tickets |
| `/orders` | Orders | Order history |

### Admin Routes
| Route | Component | Description |
|-------|-----------|-------------|
| `/admin` | Admin | Admin dashboard |
| `/admin/service-desk` | ServiceDeskPage | **Service Desk Tickets** |
| `/admin/services` | ServiceCRUDAdmin | Service management |
| `/admin/concierge` | ConciergeRequestsDashboard | Concierge requests |
| `/admin/mira-concierge` | ConciergeDashboard | Mira concierge admin |

---

## SERVICE DESK FLOW

### User Request Flow
```
User Request (Chat/Search/Button)
    ↓
Service Desk Ticket Created
    ↓
Admin Notification (WebSocket/Email)
    ↓
Member Notification (Push/Email)
    ↓
Pillar Request (Stay/Dine/etc.)
    ↓
Tickets (/my-tickets)
    ↓
Channel Intakes (WhatsApp/Chat/Email)
```

### Entry Points for Service Desk
1. **Chat "Get Help" Button** - After AI responses
2. **Dock "Help" Button** - Opens modal with options
3. **"Connect to Concierge®" Button** - Direct escalation
4. **WhatsApp/Chat/Email Buttons** - Channel selection
5. **Search Bar** - Universal search triggers

### Ticket Creation Endpoint
```
POST /api/service-desk/tickets
{
  "user_id": "string",
  "pet_id": "string",
  "type": "stay|dine|health|grooming|etc",
  "description": "string",
  "channel": "chat|whatsapp|email",
  "priority": "low|medium|high",
  "context": {...}
}
```

---

## DATA MODELS & SCHEMAS

### Pet Schema
```javascript
{
  id: "string",
  owner_id: "string",
  owner_email: "string",
  name: "string",
  breed: "string",
  age_years: number,
  birth_date: "ISO date",
  weight: number,
  photo_url: "string",
  doggy_soul_answers: {
    // Soul profile questions
    health_conditions: [],
    personality_traits: [],
    activity_level: "string",
    // ... more fields
  },
  overall_score: number,  // 0-100 soul score
  created_at: "ISO date",
  updated_at: "ISO date"
}
```

### Restaurant Schema (Dine)
```javascript
{
  id: "string",
  name: "string",
  location: {
    address: "string",
    city: "string",
    area: "string",
    latitude: number,
    longitude: number
  },
  cuisine: ["string"],
  pet_menu: boolean,
  pet_policy: "string",
  rating: number,
  phone: "string",
  website: "string",
  hours: "string",
  verified: boolean,
  source: "curated|google_places"
}
```

### Stay Schema
```javascript
{
  id: "string",
  name: "string",
  type: "hotel|resort|homestay|boarding",
  location: {...},
  pet_policy: "string",
  pet_fee: number,
  amenities: ["string"],
  rating: number,
  verified: boolean
}
```

### Vet Clinic Schema
```javascript
{
  id: "string",
  name: "string",
  location: {...},
  services: ["string"],
  emergency_24_7: boolean,
  phone: "string",
  verified: boolean
}
```

---

## FEATURE IMPLEMENTATION DETAILS

### Soul Score System
**Location:** `backend/pet_score_logic.py`

**Display Logic (Frontend):**
- Score ≤ 10%: Shows "Help Mira know [Pet]" purple badge with sparkle
- Score > 10%: Shows actual percentage with amber badge

**Files:**
- `MiraDemoPage.jsx` lines 3093-3110: Soul badge rendering
- `mira-prod.css` lines 2412-2490: Soul badge styling

### YouTube Training Videos
**Keywords Detected:**
`train`, `training`, `teach`, `learn`, `how to`, `puppy`, `behavior`, `obedience`, `trick`, `command`, `potty`, `leash`, `bite`, `bark`, `recall`

**Files:**
- `MiraDemoPage.jsx` lines 2363-2410: Detection logic
- `MiraDemoPage.jsx` lines 3585-3625: Video card rendering
- `mira-prod.css` lines 5706-5800: Video card styling

### Amadeus Hotels
**Keywords Detected:**
`hotel`, `stay`, `trip`, `travel`, `vacation`, `holiday`, `book`, `pet-friendly`

**Cities Supported:**
`mumbai`, `delhi`, `bangalore`, `chennai`, `kolkata`, `hyderabad`, `pune`, `goa`, `jaipur`, `ahmedabad`, `kochi`, `udaipur`, `shimla`, `manali`, `ooty`, `coorg`, `munnar`

### Viator Attractions
**Keywords Detected:**
`trip`, `travel`, `tour`, `visit`, `explore`, `things to do`, `activities`, `experience`, `adventure`, `sightseeing`

**API Format (CRITICAL):**
```json
{
  "searchTerm": "Mumbai outdoor tours",
  "searchTypes": [{
    "searchType": "PRODUCTS",
    "pagination": {"start": 1, "count": 5}
  }],
  "currency": "INR"
}
```

---

## MOBILE & iOS COMPATIBILITY

### Viewport Testing Results (100% Pass)
| Viewport | Resolution | Status |
|----------|------------|--------|
| iPhone X | 375x812 | ✅ Pass |
| iPhone 12 | 390x844 | ✅ Pass |
| iPad | 768x1024 | ✅ Pass |
| Android | 360x740 | ✅ Pass |

### Mobile-Specific Features
- **Bottom Dock**: 6 items (Concierge, Orders, Plan, Help, Soul, Learn)
- **Touch Targets**: All buttons ≥ 44px
- **Notch Safety**: Dock visible on notched devices
- **Keyboard Handling**: Chat input accessible when keyboard open

### iOS Safari Considerations
- Viewport scaling handled
- Safe area insets respected
- No horizontal scroll issues

---

## KNOWN ISSUES & FIXES APPLIED

### Fixed Issues (This Session)
1. **Soul Score Display** - Fixed rendering for 0% scores
2. **Viator API** - Fixed payload format (searchTypes with pagination inside)
3. **YouTube in Chat** - Added demo pet fallback for by-breed endpoint
4. **Learn Tab** - Added to dock and implemented category switching

### Pending Issues
1. **Foursquare API** - Key returns 401, using curated fallback
2. **DinePage React Warning** - Minor key prop warning in select component

### Workarounds Applied
- Foursquare: Curated fallback data for Mumbai, Delhi, Bangalore
- Viator: Curated fallback data (not needed now that API works)

---

## ENVIRONMENT & CREDENTIALS

### Test User
- **Email:** `dipali@clubconcierge.in`
- **Password:** `test123`
- **Pets:** 7 pets (Mojo, Lola, Mystique, Bruno, Luna, Buddy, Meister)

### Admin Credentials
- Check `localStorage.getItem('tdc_admin_user')` and `tdc_admin_password`

### API Keys Location
All in `/app/backend/.env`:
```
MONGO_URL=...
DB_NAME=...
EMERGENT_LLM_KEY=...
YOUTUBE_API_KEY=...
AMADEUS_API_KEY=...
AMADEUS_API_SECRET=...
VIATOR_API_KEY=a66f4b5d-4b7c-45d0-a3de-05c98ddeb6e8  # Production
GOOGLE_PLACES_API_KEY=...
OPENWEATHER_API_KEY=...
FOURSQUARE_API_KEY=...  # Needs regeneration
```

### Preview URL
https://nearby-pet-places.preview.emergentagent.com

---

## FILE REFERENCE MAP

### Backend
```
/app/backend/
├── server.py                    # Main FastAPI server
├── mira_routes.py               # Mira chat API (12,500+ lines)
├── pet_score_logic.py           # Soul score calculation
├── services/
│   ├── youtube_service.py       # YouTube Data API
│   ├── amadeus_service.py       # Amadeus Travel API
│   ├── viator_service.py        # Viator Partner API
│   ├── foursquare_service.py    # Foursquare Places API
│   ├── google_places_service.py # Google Places API
│   ├── google_maps_service.py   # Google Maps Directions
│   └── openweather_service.py   # OpenWeather API
├── scripts/
│   ├── seed_restaurants.py
│   ├── seed_stays.py
│   └── seed_vet_clinics.py
└── .env                         # All API keys
```

### Frontend
```
/app/frontend/src/
├── pages/
│   ├── MiraDemoPage.jsx         # Main Mira interface (4,800+ lines)
│   ├── StayPage.jsx             # Stay pillar (123K)
│   ├── DinePage.jsx             # Dine pillar (87K)
│   ├── ServiceDeskPage.jsx      # Admin service desk
│   └── MyTickets.jsx            # User tickets
├── styles/
│   └── mira-prod.css            # Mira-specific styling
├── context/
│   └── AuthContext.jsx          # Auth state
└── utils/
    └── api.js                   # API URL config
```

### Memory/Documentation
```
/app/memory/
├── PRD.md                       # This document
└── api_keys.md                  # API keys reference
```

---

## NEXT STEPS FOR NEW AGENT

### Immediate Priorities
1. **Integrate Amadeus/Viator into Stay Page** - Add hotel search to /stay
2. **Integrate Google Places into Dine Page** - Add restaurant data to /dine
3. **Regenerate Foursquare API Key** - Current key returns 401

### Medium Priority
1. **Breed Detector** - Add to Learn tab
2. **Code Refactoring** - MiraDemoPage.jsx is 4,800+ lines

### Low Priority
1. **Interactive Google Maps** - Embed map in chat
2. **Service Desk Webhooks** - Real-time admin notifications

---

## CRITICAL NOTES

1. **Viator API Format** - MUST use `searchTypes` with pagination INSIDE the object
2. **Soul Score** - 0% means missing `doggy_soul_answers`, not a bug
3. **Demo Pets** - Have hardcoded low scores to demonstrate "Help Mira know" prompt
4. **Mobile Testing** - All viewports pass, including iOS Safari
5. **Service Desk Flow** - Works from multiple entry points (chat, dock, buttons)

---

*Document generated: February 8, 2026*
*Testing Agent Report: iteration_109.json - 100% Pass Rate*

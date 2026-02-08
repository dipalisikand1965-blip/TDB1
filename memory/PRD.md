# MIRA OS - Product Requirements Document
## The World's First Pet Life Operating System

**Last Updated:** February 8, 2026
**Status:** ACTIVE DEVELOPMENT

---

## EXECUTIVE SUMMARY

Mira OS is a sophisticated AI-powered pet assistant with full-featured integrations:

### Core Features
- AI Chat with context-aware responses
- Semantic Product Search (E032)
- Conversation Memory (E033)
- Pet Mood Detection (E025)
- Voice Personalities (E024)

### Location & Weather
- Vet Clinics, Restaurants, Dog Parks
- Weather-based activity recommendations
- Click-to-Call & Get Directions

### New Integrations (Feb 8, 2026)
- **YouTube Training Videos** ✅ - Training by breed, age, topic
- **Amadeus Travel** ✅ - Pet-friendly hotels in chat
- **Foursquare Places** ✅ - Pet cafes, dog parks (with fallback)
- **Viator Attractions** ✅ - Pet-friendly experiences (with fallback)
- **Learn Tab** ✅ - Dedicated training video library in dock

---

## RECENT UPDATES

### Learn Tab (NEW)
- Added to dock navigation
- Categories: For You, Barking, Potty, Leash, Tricks, Anxiety, Puppy
- Videos tailored by pet's breed
- Beautiful modal with video grid

### Foursquare Integration
- Pet-friendly cafes
- Dog parks
- Pet stores & groomers
- **Note**: Using curated fallback data (API key needs verification)

### Viator Integration  
- Pet-friendly attractions
- Nature & outdoor experiences
- Day trips
- **Note**: Using curated fallback data (sandbox key needs activation)

---

## API ENDPOINTS

### YouTube Training Videos
| Endpoint | Description |
|----------|-------------|
| `GET /api/mira/youtube/videos` | Search videos by query |
| `GET /api/mira/youtube/by-breed` | Videos for specific breed |
| `GET /api/mira/youtube/by-age` | Videos by life stage |
| `GET /api/mira/youtube/by-topic` | Videos by training topic |
| `GET /api/mira/youtube/recommended/{pet_id}` | Personalized for pet |

### Amadeus Travel
| Endpoint | Description |
|----------|-------------|
| `GET /api/mira/amadeus/hotels` | Pet-friendly hotels |
| `GET /api/mira/amadeus/travel-tips/{pet_id}` | Travel recommendations |

### Foursquare Places (with fallback)
| Endpoint | Description |
|----------|-------------|
| `GET /api/mira/foursquare/pet-cafes` | Pet-friendly cafes |
| `GET /api/mira/foursquare/dog-parks` | Dog parks |
| `GET /api/mira/foursquare/pet-stores` | Pet stores |
| `GET /api/mira/foursquare/groomers` | Pet groomers |

### Viator Attractions (with fallback)
| Endpoint | Description |
|----------|-------------|
| `GET /api/mira/viator/pet-friendly` | Pet-friendly attractions |
| `GET /api/mira/viator/day-trips` | Day trips |
| `GET /api/mira/viator/nature` | Nature experiences |

---

## KEYWORD DETECTION

### Training Keywords (YouTube)
`train`, `training`, `teach`, `learn`, `how to`, `puppy`, `behavior`, `obedience`, `trick`, `command`, `potty`, `leash`, `bite`, `bark`, `recall`

### City Keywords (Amadeus/Viator)
`mumbai`, `delhi`, `bangalore`, `chennai`, `kolkata`, `hyderabad`, `pune`, `goa`, `jaipur`, `ahmedabad`, `kochi`, `udaipur`, `shimla`, `manali`, `ooty`, `coorg`, `munnar`

---

## API KEYS STATUS

| Service | Status | Note |
|---------|--------|------|
| YouTube | ✅ Working | Full API access |
| Amadeus | ✅ Working | Full API access |
| Foursquare | ⚠️ Fallback | Key needs verification |
| Viator | ⚠️ Fallback | Sandbox needs activation |

---

## COMPLETED TASKS

1. ✅ Soul Score Mira Prompt - "Help Mira know [Pet]"
2. ✅ YouTube Backend Integration
3. ✅ Amadeus Backend Integration  
4. ✅ YouTube in Chat - Training videos when asking
5. ✅ Amadeus in Chat - Hotels when mentioning travel
6. ✅ Learn Tab in Dock - Full training library
7. ✅ Foursquare Service - With curated fallback
8. ✅ Viator Service - With curated fallback

---

## PENDING TASKS

### Medium Priority (P1)
1. 🔲 Foursquare API Key Verification
2. 🔲 Viator Production Key Activation
3. 🔲 Breed Detector in Learn Tab

### Low Priority (P2)
4. 🔲 Code Refactoring - MiraDemoPage.jsx
5. 🔲 Interactive Google Maps

---

## TEST CREDENTIALS

- **Email**: `dipali@clubconcierge.in`
- **Password**: `test123`

---

## PREVIEW URL

https://nearby-pet-places.preview.emergentagent.com/mira-demo

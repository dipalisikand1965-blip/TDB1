# MIRA OS - Product Requirements Document
## The World's First Pet Life Operating System

**Last Updated:** February 8, 2026
**Status:** ACTIVE DEVELOPMENT
**Agent Handover:** Comprehensive handoff prepared

---

## EXECUTIVE SUMMARY

Mira OS is a sophisticated AI-powered pet assistant that provides personalized care, product recommendations, and emotional support for pet parents. The system features:

- **AI Chat Interface** with context-aware responses
- **Semantic Product Search** (E032) - Intent-based recommendations
- **Conversation Memory** (E033) - Mira remembers past discussions
- **Pet Mood Detection** (E025) - Detects behavioral concerns
- **Voice Personalities** (E024) - Auto-adjusts tone based on context
- **Proactive Nudges** - Health reminders, birthday alerts
- **AI Auto-Tagging on Deployment** - Semantic intents applied automatically
- **Nearby Places** - Vet clinics, restaurants, dog parks with click-to-call
- **Weather Intelligence** - Pet activity recommendations based on weather
- **Interactive Feature Showcase** - Quick action buttons for common tasks

---

## SOUL SCORE SYSTEM

**CRITICAL**: Soul Score must be consistent across the entire site.

### Calculation Logic
Located in: `/app/backend/pet_score_logic.py` → `calculate_pet_soul_score()`

```python
# Soul score is calculated from doggy_soul_answers
# Based on 59 questions across categories:
# - Essential (identity, health basics)
# - Important (diet, exercise, medical history)
# - Nice-to-have (personality, preferences)

# Score = (questions_answered / 59) * 100
# Weighted by category importance
```

### Files that use Soul Score:
- `/app/backend/household_routes.py` line 35: `calculate_pet_soul_score(pet)`
- `/app/backend/server.py` line 10966: `score_data["total_score"]`
- `/app/backend/paw_points_routes.py` line 583
- `/app/frontend/src/components/UnifiedHero.jsx` line 320
- `/app/frontend/src/pages/MiraDemoPage.jsx` line 793

### Frontend Display
- MiraDemoPage: `pet.soulScore` from `p.overall_score`
- Shows as "XX% SOUL KNOWN" badge with paw icon

---

## API KEYS & INTEGRATIONS

### Configured in `/app/backend/.env`

| Service | Key Variable | Purpose |
|---------|--------------|---------|
| **Emergent LLM** | `EMERGENT_LLM_KEY` | AI chat responses |
| **Google Places** | `GOOGLE_PLACES_API_KEY` | Vet clinics, dog parks, pet stores |
| **OpenWeather** | `OPENWEATHER_API_KEY` | Pet activity recommendations |
| **YouTube** | `YOUTUBE_API_KEY` | Training videos (NEW) |
| **Amadeus** | `AMADEUS_API_KEY` + `AMADEUS_API_SECRET` | Pet-friendly travel (NEW) |
| **Foursquare** | `FOURSQUARE_API_KEY` | Backup places data |
| **ElevenLabs** | `ELEVENLABS_API_KEY` | Voice/TTS features |
| **Resend** | `RESEND_API_KEY` | Email notifications |
| **Razorpay** | `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` | Payments |

### API Keys (for reference):
```
GOOGLE_PLACES_API_KEY=AIzaSyAGhWgj4SqpXMqJWLh6SH3rHjxIYoecny4
OPENWEATHER_API_KEY=53f54942766320a15584e440644000e3
YOUTUBE_API_KEY=AIzaSyCEqC2I04NYLTvJmPNU7sWsrfcKLIwOWpU
AMADEUS_API_KEY=SO6flvJXlIFxNM7jYQckpOkFJoJAp4Ed
AMADEUS_API_SECRET=M0H1ZYYHkaTMvNkd
FOURSQUARE_API_KEY=XZ2D4H0TKX4NR2VC1AMF5FDSJ0TFXHANH2PM12RUXIB5UKQN
ELEVENLABS_API_KEY=2738ad21884d7bf3ff2ddee5fbac5e2efc8a02ab4ca3cd36bdef82b83d9628bc
```

---

## FEATURES IMPLEMENTED

### Core Chat Features
| Feature | Status | Description |
|---------|--------|-------------|
| E024 Voice Auto-Detection | ✅ | Mira adjusts tone based on context |
| E025 Pet Mood Detection | ✅ | Detects behavioral concerns |
| E027 Daily Digest | ✅ | Walk/feed reminders |
| E028 Milestones | ✅ | Achievement tracking |
| E032 Semantic Search | ✅ | AI-powered intent matching |
| E033 Conversation Memory | ✅ | Recalls past discussions |
| E034 Smart Reordering | ✅ | Purchase pattern analysis |

### Location & Weather Features
| Feature | Status | Description |
|---------|--------|-------------|
| Vet Clinic Search | ✅ | 32 verified clinics, 18 are 24/7 |
| Restaurant Search | ✅ | 75+ pet-friendly restaurants |
| Pet-Friendly Stays | ✅ | 31+ hotels/resorts |
| Dog Parks | ✅ | Via Google Places API |
| Weather Advisory | ✅ | Pet activity recommendations |
| Click-to-Call | ✅ | Direct call buttons on vet cards |
| Get Directions | ✅ | Google Maps navigation |

### UI Features
| Feature | Status | Description |
|---------|--------|-------------|
| Feature Showcase | ✅ | 6 quick action buttons |
| Weather Card | ✅ | Temperature & safety level |
| Soul Score Badge | ✅ | "XX% SOUL KNOWN" display |
| Nearby Places Cards | ✅ | In-chat vet/restaurant cards |

---

## PENDING TASKS

### High Priority
1. **Soul Score Consistency** - Ensure soul score displays correctly for all pets (not hardcoded 87%)
2. **YouTube Integration** - Training videos in Mira OS and Learn pillar
3. **Amadeus Integration** - Pet-friendly flight/hotel booking

### Medium Priority
4. **More Cities** - Add vet/restaurant data for Ahmedabad, Lucknow, Jaipur city
5. **Google Places Expansion** - Groomers, pet stores

### Low Priority
6. **Code Refactoring** - Break down MiraDemoPage.jsx (4000+ lines)
7. **Voice Commands** - "Navigate to nearest vet" via voice

---

## CODE ARCHITECTURE

```
/app
├── backend/
│   ├── server.py                    # Main FastAPI server
│   ├── mira_routes.py               # Mira chat API (12,000+ lines)
│   ├── pet_score_logic.py           # Soul score calculation
│   ├── services/
│   │   ├── google_places_service.py # Google Places API
│   │   ├── google_maps_service.py   # Directions API
│   │   └── openweather_service.py   # Weather API
│   ├── scripts/
│   │   ├── seed_vet_clinics.py      # 32 verified vet clinics
│   │   ├── seed_pet_friendly_places.py # Restaurants & stays
│   │   ├── tag_products_with_ai.py  # AI semantic tagging
│   │   └── auto_populate.py         # Deployment script
│   └── .env                         # All API keys
│
├── frontend/
│   ├── src/pages/
│   │   ├── MiraDemoPage.jsx         # Main Mira page (4000+ lines)
│   │   └── Admin.jsx                # Admin panel
│   ├── src/components/
│   │   ├── SoulScoreArc.jsx         # Soul score display
│   │   └── UnifiedHero.jsx          # Hero with soul score
│   └── src/styles/
│       └── mira-prod.css            # All styles (6000+ lines)
│
└── memory/
    └── PRD.md                       # This document
```

---

## KEY API ENDPOINTS

### Mira Chat
- `POST /api/mira/os/understand-with-products` - Main chat endpoint (used by MiraDemoPage)
- `POST /api/mira/chat` - Alternative chat endpoint

### Nearby Places
- `GET /api/mira/vet-clinics?city=X` - Curated vet clinics
- `GET /api/mira/vet-clinics/emergency?city=X` - 24/7 emergency vets
- `GET /api/mira/restaurants?city=X` - Pet-friendly restaurants
- `GET /api/mira/pet-stays?city=X` - Pet-friendly hotels
- `GET /api/mira/google/vets?city=X` - Google Places vets
- `GET /api/mira/google/dog-parks?city=X` - Google Places parks

### Weather
- `GET /api/mira/weather/pet-activity?city=X` - Activity recommendations

### Directions
- `GET /api/mira/directions/to-vet?from_location=X&city=Y&emergency=true/false`

### Soul Score
- `GET /api/pets/my-pets` - Returns pets with `overall_score`
- `GET /api/pet-score/{pet_id}/score_state` - Detailed soul score

---

## TEST CREDENTIALS

- **User Email**: `dipali@clubconcierge.in`
- **Password**: `test12`
- **Demo Pet**: Buddy (Golden Retriever)

---

## DATABASE COLLECTIONS

| Collection | Count | Description |
|------------|-------|-------------|
| `products_master` | 4000+ | Products with semantic_intents |
| `services` | 2200+ | Services with semantic_intents |
| `vet_clinics` | 32 | Verified vet clinics |
| `restaurants` | 75+ | Pet-friendly restaurants |
| `pet_friendly_stays` | 31+ | Pet-friendly hotels |
| `pets` | - | Pet profiles with soul data |

---

## NEXT AGENT INSTRUCTIONS

1. **Fix Soul Score Display**
   - Check why Lola shows no score but Buddy shows 87%
   - Ensure `overall_score` is fetched from API correctly
   - Remove hardcoded 87% fallback or make it conditional

2. **Integrate YouTube API**
   - Create `/app/backend/services/youtube_service.py`
   - Add training video search by breed/topic
   - Display in Mira chat and Learn pillar

3. **Integrate Amadeus API**
   - Create `/app/backend/services/amadeus_service.py`
   - Search pet-friendly hotels
   - Add to nearby places cards

4. **Test with Real User**
   - Login as `dipali@clubconcierge.in` / `test12`
   - Verify soul score for Lola
   - Test all nearby places features

---

## PREVIEW URLs

- **Preview**: https://mira-bakery-ai.preview.emergentagent.com/mira-demo
- **Production**: https://thedoggycompany.in/mira-demo
- **Admin**: https://mira-bakery-ai.preview.emergentagent.com/admin

---

## LAST 5 USER MESSAGES

1. Asked about soul score consistency - needs to match across site
2. Provided YouTube API key for training videos
3. Asked to prepare exhaustive handoff summary with all keys
4. Wants Amadeus integration for pet-friendly travel
5. Screenshot showed Lola without soul score percentage

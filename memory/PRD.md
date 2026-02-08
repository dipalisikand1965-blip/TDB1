# MIRA OS - Product Requirements Document
## The World's First Pet Life Operating System

**Last Updated:** February 8, 2026
**Status:** ACTIVE DEVELOPMENT

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
- **YouTube Training Videos** - Personalized training content (NEW)
- **Amadeus Travel API** - Pet-friendly hotel search (NEW)

---

## SOUL SCORE SYSTEM

**CRITICAL**: Soul Score must be consistent across the entire site.

### Implementation (Fixed Feb 8, 2026)
- **Score ≤ 10%**: Shows "Help Mira know [Pet]" prompt with purple badge and sparkle
- **Score > 10%**: Shows actual percentage with amber/gold badge
- Clicking the badge navigates to `/pet-soul/[pet-id]` page

### Calculation Logic
Located in: `/app/backend/pet_score_logic.py` → `calculate_pet_soul_score()`

```python
# Soul score is calculated from doggy_soul_answers
# Based on weighted questions across categories:
# - Safety & Health (35 points)
# - Personality (25 points)
# - Lifestyle (20 points)
# - Nutrition (10 points)
# - Training (5 points)
# - Relationships (5 points)

# Score = weighted_points_earned / total_possible_points * 100
```

### Files that use Soul Score:
- `/app/backend/server.py` line 10954: `/api/pets/my-pets` endpoint
- `/app/backend/pet_score_logic.py`: Calculation logic
- `/app/frontend/src/pages/MiraDemoPage.jsx` lines 3093-3110: Soul badge display
- `/app/frontend/src/styles/mira-prod.css` lines 2412-2490: Soul badge styling

---

## API KEYS & INTEGRATIONS

### Configured in `/app/backend/.env`

| Service | Key Variable | Status |
|---------|--------------|--------|
| **Emergent LLM** | `EMERGENT_LLM_KEY` | ✅ Working |
| **Google Places** | `GOOGLE_PLACES_API_KEY` | ✅ Working |
| **OpenWeather** | `OPENWEATHER_API_KEY` | ✅ Working |
| **YouTube** | `YOUTUBE_API_KEY` | ✅ Working |
| **Amadeus** | `AMADEUS_API_KEY` + `AMADEUS_API_SECRET` | ✅ Working |
| **Foursquare** | `FOURSQUARE_API_KEY` | 🔜 Not integrated |
| **ElevenLabs** | `ELEVENLABS_API_KEY` | 🔜 Not integrated |

---

## FEATURES IMPLEMENTED

### Core Chat Features
| Feature | Status | Description |
|---------|--------|-------------|
| E024 Voice Auto-Detection | ✅ | Mira adjusts tone based on context |
| E025 Pet Mood Detection | ✅ | Detects behavioral concerns |
| E032 Semantic Search | ✅ | AI-powered intent matching |
| E033 Conversation Memory | ✅ | Recalls past discussions |

### Location & Weather Features
| Feature | Status | Description |
|---------|--------|-------------|
| Vet Clinic Search | ✅ | 32 verified clinics, 18 are 24/7 |
| Restaurant Search | ✅ | 75+ pet-friendly restaurants |
| Pet-Friendly Stays | ✅ | 31+ hotels/resorts |
| Weather Advisory | ✅ | Pet activity recommendations |
| Click-to-Call | ✅ | Direct call buttons |
| Get Directions | ✅ | Google Maps navigation |

### New Features (Feb 8, 2026)
| Feature | Status | Description |
|---------|--------|-------------|
| Soul Score Mira Prompt | ✅ | Shows "Help Mira know [Pet]" for incomplete profiles |
| YouTube API Integration | ✅ | Training videos by breed/age/topic |
| Amadeus API Integration | ✅ | Pet-friendly hotel search |

---

## NEW API ENDPOINTS

### YouTube Training Videos
- `GET /api/mira/youtube/videos?query=X&max_results=5` - Search videos
- `GET /api/mira/youtube/by-breed?breed=X` - Videos by breed
- `GET /api/mira/youtube/by-age?age_years=X&breed=X` - Videos by life stage
- `GET /api/mira/youtube/by-topic?topic=X` - Videos by topic
- `GET /api/mira/youtube/recommended/{pet_id}` - Personalized for pet
- `GET /api/mira/youtube/test` - Test API connection

### Amadeus Travel
- `GET /api/mira/amadeus/hotels?city=X` - Search pet-friendly hotels
- `GET /api/mira/amadeus/travel-tips/{pet_id}?destination=X` - Travel recommendations
- `GET /api/mira/amadeus/city-codes` - Supported cities
- `GET /api/mira/amadeus/test` - Test API connection

---

## PENDING TASKS

### High Priority (P0)
1. ✅ **Soul Score Display** - Fixed! Shows Mira prompt for incomplete profiles
2. ✅ **YouTube Backend Integration** - Endpoints ready
3. ✅ **Amadeus Backend Integration** - Endpoints ready
4. 🔲 **YouTube Frontend Integration** - Display videos in chat/Learn pillar
5. 🔲 **Amadeus Frontend Integration** - Travel booking in chat

### Medium Priority (P1)
6. 🔲 **Verify "Get Directions" button** - Confirm Google Maps integration
7. 🔲 **Foursquare API Integration** - Additional venue data

### Low Priority (P2)
8. 🔲 **Code Refactoring** - Break down MiraDemoPage.jsx (4000+ lines)
9. 🔲 **Interactive Google Maps** - Embed map component

---

## CODE ARCHITECTURE

```
/app
├── backend/
│   ├── server.py                    # Main FastAPI server
│   ├── mira_routes.py               # Mira chat API (12,200+ lines)
│   ├── pet_score_logic.py           # Soul score calculation
│   ├── services/
│   │   ├── google_places_service.py # Google Places API
│   │   ├── google_maps_service.py   # Directions API
│   │   ├── openweather_service.py   # Weather API
│   │   ├── youtube_service.py       # YouTube API (NEW)
│   │   └── amadeus_service.py       # Amadeus API (NEW)
│   └── .env                         # All API keys
│
├── frontend/
│   └── src/pages/
│       └── MiraDemoPage.jsx         # Main Mira page
│
└── memory/
    └── PRD.md                       # This document
```

---

## TEST CREDENTIALS

- **User Email**: `dipali@clubconcierge.in`
- **Password**: `test123`
- **Demo Pet**: Buddy (Golden Retriever, Score: 0%)

---

## PREVIEW URLs

- **Preview**: https://nearby-pet-places.preview.emergentagent.com/mira-demo
- **Admin**: https://nearby-pet-places.preview.emergentagent.com/admin

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
- **YouTube Training Videos** - Personalized training content in chat ✅ NEW
- **Amadeus Travel API** - Pet-friendly hotel search in chat ✅ NEW

---

## RECENT UPDATES (February 8, 2026)

### Soul Score Mira Prompt ✅
- Score ≤ 10%: Shows "Help Mira know [Pet]" purple badge with sparkle
- Score > 10%: Shows actual percentage with amber/gold badge
- Clicking badge navigates to `/pet-soul/[pet-id]`

### YouTube Training Videos Integration ✅
- Detects training keywords in chat (train, teach, learn, bark, potty, etc.)
- Fetches relevant videos from YouTube Data API
- Shows video cards with thumbnail, title, channel, play button
- Links directly to YouTube for viewing

### Amadeus Pet-Friendly Hotels Integration ✅
- Detects travel intent + city name (Mumbai, Delhi, Goa, etc.)
- Fetches pet-friendly hotels from Amadeus API
- Shows hotel cards with pet-friendly badges and policies
- Directions button links to Google Maps

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

### New Integrations (Feb 8, 2026)
| Feature | Status | Description |
|---------|--------|-------------|
| Soul Score Mira Prompt | ✅ | Encourages profile completion |
| YouTube Training Videos | ✅ | Training content in chat |
| Amadeus Pet Hotels | ✅ | Travel booking in chat |
| Learn Test Chip | ✅ | Quick training video test |
| Hotels Test Chip | ✅ | Quick hotel search test |

---

## API ENDPOINTS

### YouTube Training Videos
| Endpoint | Description |
|----------|-------------|
| `GET /api/mira/youtube/videos` | Search videos by query |
| `GET /api/mira/youtube/by-breed` | Videos specific to breed |
| `GET /api/mira/youtube/by-age` | Videos by life stage |
| `GET /api/mira/youtube/by-topic` | Videos by training topic |
| `GET /api/mira/youtube/recommended/{pet_id}` | Personalized for pet |
| `GET /api/mira/youtube/test` | Test API connection |

### Amadeus Travel
| Endpoint | Description |
|----------|-------------|
| `GET /api/mira/amadeus/hotels` | Search pet-friendly hotels |
| `GET /api/mira/amadeus/travel-tips/{pet_id}` | Travel recommendations |
| `GET /api/mira/amadeus/city-codes` | Supported cities (32) |
| `GET /api/mira/amadeus/test` | Test API connection |

---

## KEYWORD DETECTION

### Training Keywords (YouTube)
`train`, `training`, `teach`, `learn`, `how to`, `puppy`, `behavior`, `obedience`, `trick`, `command`, `potty`, `leash`, `bite`, `bark`, `recall`

### City Keywords (Amadeus)
`mumbai`, `delhi`, `bangalore`, `bengaluru`, `chennai`, `kolkata`, `hyderabad`, `pune`, `goa`, `jaipur`, `ahmedabad`, `kochi`, `udaipur`, `shimla`, `manali`, `ooty`, `coorg`, `munnar`

---

## TEST SCENARIOS

| Chip | Query | Tests |
|------|-------|-------|
| 📺 Learn | "How do I train my dog to stop barking?" | YouTube videos |
| 🏨 Hotels | "Find pet-friendly hotels in Mumbai" | Amadeus hotels |
| ✈️ Travel | "Planning a trip to Goa with my dog" | Hotels + Weather |

---

## PENDING TASKS

### Medium Priority (P1)
1. 🔲 **Foursquare API Integration** - Additional venue data
2. 🔲 **Learn Pillar Enhancement** - Dedicated training video section

### Low Priority (P2)
3. 🔲 **Code Refactoring** - Break down MiraDemoPage.jsx (4000+ lines)
4. 🔲 **Interactive Google Maps** - Embed map component

---

## TEST CREDENTIALS

- **User Email**: `dipali@clubconcierge.in`
- **Password**: `test123`

---

## PREVIEW URLs

- **Preview**: https://nearby-pet-places.preview.emergentagent.com/mira-demo
- **Admin**: https://nearby-pet-places.preview.emergentagent.com/admin

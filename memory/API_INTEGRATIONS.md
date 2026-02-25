# Mira OS - API Integration Reference
## Exhaustive Guide for All Pillars

---

## 🔐 CONFIGURED APIS (Ready to Use)

### 1. Google APIs
| Service | Key | Use Cases |
|---------|-----|-----------|
| **Google Places API** | `GOOGLE_PLACES_API_KEY` | Nearby vets, groomers, pet-friendly cafes, parks, hotels |
| **Google Maps/Directions** | Same key | Distance matrix, directions, travel time |
| **Google Geocoding** | Same key | Reverse geocode coordinates → city/state |
| **Google Vision** | `GOOGLE_VISION_API_KEY` | Image analysis (pet photos, receipts) |
| **Google Calendar** | `GOOGLE_CALENDAR_API_KEY` | Vaccination reminders, vet appointments |

### 2. Weather & Location
| Service | Key | Use Cases |
|---------|-----|-----------|
| **OpenWeather** | `OPENWEATHER_API_KEY` | Weather alerts, "good walk day" notifications |
| **IP Geolocation** | Free (ipapi.co) | Fallback location detection |

### 3. Travel & Accommodation
| Service | Key | Use Cases |
|---------|-----|-----------|
| **Amadeus** | `AMADEUS_API_KEY` | Flight search, pet-friendly hotels |
| **Viator** | `VIATOR_API_KEY` | Pet-friendly activities, tours |

### 4. Local Discovery
| Service | Key | Use Cases |
|---------|-----|-----------|
| **Foursquare** | `FOURSQUARE_API_KEY` | Restaurants, cafes, parks, venues |

### 5. Communication
| Service | Key | Use Cases |
|---------|-----|-----------|
| **Resend** | `RESEND_API_KEY` | Transactional emails |
| **ElevenLabs** | `ELEVENLABS_API_KEY` | Voice synthesis for Mira |
| **Gupshup** | `GUPSHUP_API_KEY` | WhatsApp messaging |

### 6. Payments
| Service | Key | Use Cases |
|---------|-----|-----------|
| **Razorpay** | `RAZORPAY_KEY_SECRET` | Payment processing (India) |

### 7. AI/LLM
| Service | Key | Use Cases |
|---------|-----|-----------|
| **Emergent LLM** | `EMERGENT_LLM_KEY` | GPT/Claude for Mira chat |

### 8. Media
| Service | Key | Use Cases |
|---------|-----|-----------|
| **YouTube** | `YOUTUBE_API_KEY` | Training videos, breed info |

### 9. Events
| Service | Key | Use Cases |
|---------|-----|-----------|
| **Eventbrite** | `EVENTBRITE_API_KEY` | Pet events, shows, meetups |

---

## 🍽️ DINE PILLAR - API Strategy

### Location-Aware Curated Picks
```python
# How location flows into Dine recommendations:

1. User Location (from login auto-detect):
   - user.location.city → "Mumbai"
   - user.location.latitude/longitude → for nearby search

2. Google Places API (nearby search):
   - Pet-friendly restaurants
   - Dog-friendly cafes
   - Parks with outdoor seating
   - Query: "pet friendly restaurants near {lat},{lng}"

3. Foursquare API (venue details):
   - Ratings, reviews
   - Operating hours
   - Outdoor seating availability

4. Intelligence Layer Enhancement:
   - Filter by pet size (small dogs welcome vs all sizes)
   - Filter by cuisine type based on owner preferences
   - Add "distance from you" to each card
```

### Dine API Calls
| API | Endpoint | Data Retrieved |
|-----|----------|----------------|
| Google Places | `nearby_search` | Pet-friendly restaurants within 5km |
| Foursquare | `/places/nearby` | Additional venue details |
| Google Maps | `/distancematrix` | Travel time from user location |

### Concierge Card Data Structure (Enhanced)
```json
{
  "card_id": "dine_cafe_001",
  "type": "service",
  "title": "Pet-Friendly Café Visit",
  "venue": {
    "name": "Barks & Brews",
    "address": "Bandra West, Mumbai",
    "distance_km": 2.3,
    "travel_time_mins": 12,
    "rating": 4.5,
    "pet_policy": "All sizes welcome, water bowls provided"
  },
  "why_for_pet": "Perfect for {pet_name}'s social personality - outdoor seating and other dogs!",
  "cta_text": "Reserve a Table"
}
```

---

## 🎉 CELEBRATE PILLAR - API Strategy

### Location-Aware Curated Picks
```python
# How location flows into Celebrate recommendations:

1. User Location:
   - Determines available vendors
   - Local cake delivery options
   - Party venue suggestions

2. Google Places API:
   - Pet-friendly party venues
   - Pet bakeries nearby
   - Photography studios

3. Eventbrite API:
   - Upcoming pet events in city
   - Dog birthday parties
   - Puppy meetups

4. Intelligence Layer Enhancement:
   - Delivery availability check
   - Local vendor ratings
   - "Serves {city}" badge on products
```

### Celebrate API Calls
| API | Endpoint | Data Retrieved |
|-----|----------|----------------|
| Google Places | `text_search` | Pet bakeries, party venues |
| Eventbrite | `/events/search` | Pet-friendly events |
| Internal Products | `/api/products` | Cakes, decorations, gifts |

### Concierge Card Data Structure (Enhanced)
```json
{
  "card_id": "celebrate_cake_001",
  "type": "product",
  "title": "Custom Birthday Cake",
  "vendor": {
    "name": "Pawsome Bakery",
    "location": "Mumbai",
    "delivers_to": ["Mumbai", "Thane", "Navi Mumbai"],
    "delivery_time": "Same day"
  },
  "why_for_pet": "{pet_name}'s foodie soul will love this grain-free, chicken-flavored cake!",
  "cta_text": "Order Cake"
}
```

---

## 🏠 STAY PILLAR - API Strategy

### APIs to Use
| API | Use Case |
|-----|----------|
| Amadeus | Pet-friendly hotel search |
| Google Places | Local pet boarding, kennels |
| Foursquare | Pet-friendly Airbnb alternatives |

---

## ✈️ TRAVEL PILLAR - API Strategy

### APIs to Use
| API | Use Case |
|-----|----------|
| Amadeus | Pet travel policies, flights |
| Google Maps | Pet relief areas at airports |
| Viator | Pet-friendly activities at destination |

---

## 🏥 CARE PILLAR - API Strategy

### APIs to Use
| API | Use Case |
|-----|----------|
| Google Places | Vets, clinics, pet hospitals nearby |
| Google Calendar | Vaccination reminders |
| OpenWeather | Tick/flea season alerts |

---

## 💅 ENJOY PILLAR - API Strategy

### APIs to Use
| API | Use Case |
|-----|----------|
| Google Places | Groomers, spas nearby |
| Foursquare | Ratings and reviews |

---

## 🐕 FIT PILLAR - API Strategy

### APIs to Use
| API | Use Case |
|-----|----------|
| Google Places | Dog parks, hiking trails |
| OpenWeather | "Good walk day" alerts |
| YouTube | Training videos |

---

## 📚 LEARN PILLAR - API Strategy

### APIs to Use
| API | Use Case |
|-----|----------|
| YouTube | Training tutorials |
| Google Places | Training centers nearby |

---

## 🐾 ADOPT PILLAR - API Strategy

### Potential APIs (Need Integration)
| Service | Notes |
|---------|-------|
| PetFinder API | International pet adoption database |
| Local shelters | May need direct partnerships |

---

## ❌ APIS NOT AVAILABLE (Require Partnerships)

### Pet Product E-commerce
| Company | Status | Alternative |
|---------|--------|-------------|
| **HUFT** | No public API | Affiliate/partnership required |
| **Supertails** | No public API | Contact for B2B integration |
| **Zigly** | Affiliate only (Cuelinks) | 16% commission model |
| **Drools** | No API | Direct partnership |

**Recommendation**: For products, use internal catalog + affiliate links for external products.

### Pet Services Platforms
| Platform | Status | Alternative |
|----------|--------|-------------|
| **PetBacker** | No public API | Google Places for services |
| **Pettle** | B2B SaaS | Contact for integration |
| **Happy Pet Tech** | B2B SaaS | ₹499/mo, API available |

**Recommendation**: Use Google Places for discovery + direct vendor partnerships for bookings.

---

## 📍 LOCATION-AWARE INTELLIGENCE LAYER

### Implementation Strategy

```python
async def generate_location_aware_picks(pet_id: str, pillar: str, user_location: dict):
    """
    Enhanced curated picks with location awareness.
    
    Args:
        pet_id: The pet's ID
        pillar: celebrate, dine, care, etc.
        user_location: {city, state, latitude, longitude}
    """
    
    # 1. Get pet traits (existing logic)
    pet_data = await get_pet_data(pet_id)
    traits = derive_traits_from_pet_data(pet_data)
    
    # 2. Get location-specific data
    city = user_location.get("city", "Mumbai")
    lat = user_location.get("latitude")
    lng = user_location.get("longitude")
    
    # 3. Pillar-specific location enhancements
    if pillar == "dine":
        # Fetch nearby pet-friendly restaurants
        nearby_venues = await google_places_nearby(
            lat, lng, 
            query="pet friendly restaurant",
            radius=5000
        )
        # Add distance to each card
        
    elif pillar == "celebrate":
        # Check product delivery availability
        # Fetch local vendors
        local_vendors = await google_places_text_search(
            f"pet bakery {city}"
        )
        
    elif pillar == "care":
        # Fetch nearby vets
        nearby_vets = await google_places_nearby(
            lat, lng,
            query="veterinary clinic",
            radius=3000
        )
    
    # 4. Merge with base recommendations
    # 5. Cache and return
```

---

## 🔮 FUTURE INTEGRATION OPPORTUNITIES

### High Priority
1. **Razorpay** - Payment integration (key exists)
2. **Happy Pet Tech** - Grooming booking API
3. **JGD Health** - Vet booking with WhatsApp

### Medium Priority
1. **PetFinder API** - Adopt pillar
2. **Instagram Graph API** - Pet photos/memories
3. **Strava API** - Dog walking tracking

### Partnership Required
1. **HUFT** - Product catalog access
2. **Supertails** - Inventory sync
3. **Local Vet Chains** - Appointment booking

---

*Last Updated: February 23, 2026*

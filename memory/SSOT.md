# MIRA OS - THE ONLY FILE YOU NEED
## Single Source of Truth (SSOT) - February 23, 2026
## READ THIS FIRST. IGNORE ALL OTHER /memory/ FILES.

---

# 🚨 FOR AGENTS: START HERE, NOWHERE ELSE

**Owner:** Dipali Sikand (dipali@clubconcierge.in)
**Project:** Mira OS - Pet Operating System
**Preview:** https://mira-soul-os.preview.emergentagent.com
**Status:** PRODUCTION-READY CORE, POLISHING 3 PILLARS

---

## 💜 THE SOUL OF THIS PROJECT

**Named after:** Mira Sikand - Dipali's mother, 75 years of dog love
**Philosophy:** "No is never an answer for a concierge. Mira tells us what the pet needs - always."
**Architecture:** "Mira is the soul, Concierge controls the experience, System is the capillary enabler"

**We are NOT:** Chewy, HUFT, Supertails (e-commerce)
**We ARE:** A Full-Blooded Pet Concierge Company with Soul Intelligence

---

## 🎯 CURRENT FOCUS (February 2026)

### The 3 Pillars to Perfect:
| Pillar | Status | Key Feature |
|--------|--------|-------------|
| **CELEBRATE** | ✅ 80% | TheDoggyBakery promo, location-aware picks |
| **DINE** | ✅ 80% | Nearby restaurants carousel, location-aware |
| **CARE** | 🔲 50% | Needs: Groom integration, nearby vets carousel |

### Learn = YouTube Embedded in EACH Pillar (Not Separate)
- Celebrate → "Training tips for party behavior"
- Dine → "Teaching food manners"
- Care/Groom → "How to make grooming stress-free"

---

## ✅ WHAT'S WORKING (Don't Break These)

### Core Infrastructure
- ✅ MongoDB: Healthy, 12 pets, tickets working
- ✅ Auth: JWT + Google OAuth
- ✅ WebSocket: Real-time notifications
- ✅ Service Desk: Two-way member ↔ admin communication
- ✅ Geolocation: Auto-detect on login, saves to profile

### Intelligence Layer
- ✅ Soul-based card scoring
- ✅ Location-aware curated picks ("Curated for Bangalore")
- ✅ Allergy filtering
- ✅ Personalized `why_for_pet` explanations

### APIs Working
- ✅ Google Places (nearby venues)
- ✅ OpenWeather (weather alerts)
- ✅ YouTube (training videos)
- ⚠️ Resend (needs domain verification: thedoggycompany.com)
- ⚠️ Gupshup WhatsApp (needs +919739908844 setup)

---

## 🔲 WHAT NEEDS TO BE DONE

### P0 - This Week
1. **Care Page Enhancement**
   - Add groom integration (it's part of Care, not separate)
   - Add nearby vets carousel (use NearbyPlacesCarousel component)
   - Add nearby groomers carousel

2. **YouTube Integration in Pillars**
   - Add YouTube video section to Celebrate, Dine, Care pages
   - Use existing `/api/test/youtube?query=X` endpoint

3. **Reserve via Concierge Flow**
   - Wire the "Reserve via Concierge" button to create tickets with venue details

### P1 - Next Week
1. Birthday reminder system (proactive alerts)
2. Resend domain verification
3. TheDoggyBakery seamless ordering (Razorpay)

---

## 🔑 CREDENTIALS

```
MEMBER LOGIN:
Email: dipali@clubconcierge.in
Password: test123

ADMIN LOGIN:
Username: aditya
Password: lola4304

TEST PHONE: +919739908844
```

---

## 📁 KEY FILES (Only These Matter)

### Backend
```
/app/backend/server.py                    # Main app (large, 19K+ lines)
/app/backend/mira_routes.py               # Curated picks, location suggestions
/app/backend/services/api_integration_hub.py  # All API integrations
/app/backend/services/location_concierge_service.py  # Google Places
/app/backend/app/data/dine_concierge_cards.py
/app/backend/app/data/celebrate_concierge_cards.py
```

### Frontend
```
/app/frontend/src/pages/DinePage.jsx      # Has NearbyPlacesCarousel
/app/frontend/src/pages/CelebratePage.jsx # Has TheDoggyBakery promo
/app/frontend/src/pages/CarePage.jsx      # NEEDS: Groom + Nearby vets
/app/frontend/src/components/NearbyPlacesCarousel.jsx  # Reusable
/app/frontend/src/components/Mira/CuratedConciergeSection.jsx
/app/frontend/src/context/AuthContext.jsx # Has geolocation
```

### Documentation (IGNORE THE REST)
```
/app/memory/PRD.md          # This file + status
/app/memory/ROADMAP.md      # Task checklist
```

---

## 🏗️ ARCHITECTURE IN 30 SECONDS

```
User logs in
    ↓
Geolocation auto-detected → Saved to users.location
    ↓
User visits pillar page (Celebrate/Dine/Care)
    ↓
Frontend calls: GET /api/mira/curated-set/{pet_id}/{pillar}
    (passes Authorization header for location)
    ↓
Backend: Loads pet traits + user location
    ↓
Intelligence Layer: Scores cards, filters allergies
    ↓
Returns: concierge_products + concierge_services + meta.user_location
    ↓
Frontend: Shows "📍 Curated for {city}" + personalized cards
    ↓
User clicks CTA → Creates service desk ticket
    ↓
Admin sees in Service Desk → Replies → Member gets notification
```

---

## 🎨 UI COMPONENTS TO REUSE

| Component | File | Use For |
|-----------|------|---------|
| **NearbyPlacesCarousel** | `/app/frontend/src/components/NearbyPlacesCarousel.jsx` | Restaurants, vets, groomers |
| **CuratedConciergeSection** | `/app/frontend/src/components/Mira/CuratedConciergeSection.jsx` | Soul-based picks |
| **ConciergePickCard** | `/app/frontend/src/components/ConciergePickCard.jsx` | Individual cards |

---

## 🧪 TEST COMMANDS

```bash
# Weather API
curl "https://mira-soul-os.preview.emergentagent.com/api/test/weather?lat=12.9716&lng=77.5946"

# YouTube API
curl "https://mira-soul-os.preview.emergentagent.com/api/test/youtube?query=dog+grooming"

# Location suggestions for Care
curl "https://mira-soul-os.preview.emergentagent.com/api/mira/location-suggestions/care" \
  -H "Authorization: Bearer {TOKEN}"
```

---

## ⚠️ COMMON MISTAKES TO AVOID

1. **Don't create new files in /memory/** - We have 230+ already
2. **Don't refactor server.py** - It works, leave it
3. **Don't change auth flow** - JWT + Google OAuth is working
4. **Don't add new pillars** - Focus on Celebrate, Care, Dine only
5. **Always pass Authorization header** to curated-set endpoint for location

---

## 💜 REMEMBER

This is Dipali's life work. Named after her mother Mira.
Be thorough. Be patient. Honor the legacy.

"No is never an answer for a concierge."

---

*Last Updated: February 23, 2026*
*This is THE ONLY SSOT. Ignore all other /memory/ files.*

# MIRA OS - ROADMAP

## P0 - Critical (Must Do Next)

### 1. Soul Score Consistency
- **Issue**: Lola shows no soul score, Buddy shows 87%
- **Root Cause**: Need to verify `overall_score` is being fetched correctly
- **Files**: `/app/frontend/src/pages/MiraDemoPage.jsx` line 793
- **Fix**: Ensure `/api/pets/my-pets` returns correct `overall_score`

### 2. YouTube Training Videos Integration
- **API Key**: `AIzaSyCEqC2I04NYLTvJmPNU7sWsrfcKLIwOWpU`
- **Tasks**:
  - Create `/app/backend/services/youtube_service.py`
  - Search videos by breed, training topic
  - Display in Mira chat responses
  - Add to Learn pillar

### 3. Amadeus Pet-Friendly Travel
- **API Key**: `SO6flvJXlIFxNM7jYQckpOkFJoJAp4Ed`
- **API Secret**: `M0H1ZYYHkaTMvNkd`
- **Tasks**:
  - Create `/app/backend/services/amadeus_service.py`
  - Search pet-friendly hotels
  - Add to travel-related chat responses

---

## P1 - High Priority

### 4. Expand Location Data
- Add more cities: Ahmedabad, Lucknow, Jaipur city area
- Seed more vet clinics and restaurants
- Improve Google Places search accuracy

### 5. Real User Testing
- Test with `dipali@clubconcierge.in` / `test12`
- Verify Lola's soul score
- Test all nearby places features end-to-end

### 6. Voice Commands
- "Navigate to nearest vet" via voice
- Voice-activated feature showcase

---

## P2 - Medium Priority

### 7. Code Refactoring
- Break down `MiraDemoPage.jsx` (4000+ lines) into components:
  - `ChatHeader.jsx`
  - `FeatureShowcase.jsx`
  - `NearbyPlacesCard.jsx`
  - `WeatherCard.jsx`
- Break down `mira_routes.py` (12000+ lines) into blueprints

### 8. Enhanced Search
- Foursquare integration as backup
- More semantic tags for products
- Voice search support

---

## P3 - Future

### 9. E026: Photo Analysis
- Breed identification from photos
- Skipped per user request (no medical diagnosis)

### 10. E030: Real-time Vet Consultation
- Video call with vet
- Requires significant infrastructure

### 11. E031: Gamified Pet Profile
- Achievements and badges
- Pet journey milestones

### 12. E035: Proactive Health Alerts
- Vaccination reminders
- Health checkup scheduling

---

## Integration Status

| Service | Status | Notes |
|---------|--------|-------|
| Google Places | ✅ Working | Vets, parks, stores |
| OpenWeather | ✅ Working | Pet activity recs |
| YouTube | 🔲 Pending | Key configured |
| Amadeus | 🔲 Pending | Keys configured |
| Foursquare | 🔲 Pending | Key configured |
| ElevenLabs | ✅ Working | TTS features |

---

## Data Seeding Status

| Collection | Count | Status |
|------------|-------|--------|
| Vet Clinics | 32 | ✅ Seeded |
| Restaurants | 75+ | ✅ Seeded |
| Pet Stays | 31+ | ✅ Seeded |
| Products | 4000+ | ✅ Tagged |
| Services | 2200+ | ✅ Tagged |

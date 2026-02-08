# MIRA OS - Product Requirements Document
## The World's First Pet Life Operating System

**Last Updated:** February 8, 2026
**Status:** ACTIVE DEVELOPMENT

---

## API INTEGRATION STATUS ✅

| Service | Status | Note |
|---------|--------|------|
| **YouTube** | ✅ Working | Training videos by breed/age/topic |
| **Amadeus** | ✅ Working | Pet-friendly hotels |
| **Viator** | ✅ Working | Pet-friendly attractions & tours |
| **Foursquare** | ⚠️ Fallback | Key needs regeneration |

---

## RECENT UPDATES (Feb 8, 2026)

### Viator Integration - NOW WORKING ✅
- Production key: `a66f4b5d-4b7c-45d0-a3de-05c98ddeb6e8`
- Fixed API format (searchTypes with pagination inside)
- Returns real attraction data for Indian cities
- Example: Mumbai has 935 tours, Goa has many nature experiences

### Learn Tab in Dock ✅
- Categories: For You, Barking, Potty, Leash, Tricks, Anxiety, Puppy
- Videos tailored by pet's breed
- Beautiful modal with video grid

### Chat Integrations ✅
- YouTube videos in chat (training keywords)
- Amadeus hotels in chat (city + travel keywords)
- Nearby places with Call & Directions buttons

---

## API ENDPOINTS

### Viator Attractions (WORKING)
| Endpoint | Description |
|----------|-------------|
| `GET /api/mira/viator/pet-friendly?city=X` | Pet-friendly attractions |
| `GET /api/mira/viator/day-trips?city=X` | Day trips |
| `GET /api/mira/viator/nature?city=X` | Nature experiences |
| `GET /api/mira/viator/attractions?city=X&query=X` | General search |

### Supported Cities for Viator
Mumbai, Delhi, Bangalore, Chennai, Kolkata, Hyderabad, Jaipur, Goa, Udaipur, Agra, Varanasi, Kochi, Shimla, Manali, Rishikesh, Ooty, Munnar

---

## COMPLETED TASKS

1. ✅ Soul Score Mira Prompt
2. ✅ YouTube Backend + Frontend Integration
3. ✅ Amadeus Backend + Frontend Integration
4. ✅ Learn Tab in Dock
5. ✅ Foursquare Service (with fallback)
6. ✅ Viator Service - **NOW WORKING WITH REAL DATA**

---

## PENDING TASKS

### High Priority (P0)
1. 🔲 **Add Viator attractions to chat** - Show experiences when travel query

### Medium Priority (P1)
2. 🔲 Foursquare API Key Verification
3. 🔲 Breed Detector in Learn Tab

### Low Priority (P2)
4. 🔲 Code Refactoring - MiraDemoPage.jsx

---

## TEST CREDENTIALS

- **Email**: `dipali@clubconcierge.in`
- **Password**: `test123`

---

## PREVIEW URL

https://nearby-pet-places.preview.emergentagent.com/mira-demo

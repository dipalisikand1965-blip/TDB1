# Mira OS - Integration Setup Guide

## ✅ WORKING APIS

| API | Status | What it does |
|-----|--------|--------------|
| **Google Places** | ✅ Working | Pet-friendly restaurants, bakeries, vets, groomers |
| **Google Geocoding** | ✅ Working | Reverse geocode coordinates → city name |
| **OpenWeather** | ✅ Working | Weather alerts, "good walk day" detection |
| **YouTube** | ✅ Working | Pet training videos, tutorials |
| **Eventbrite** | ✅ Working | Pet events (0 found currently in Bangalore) |
| **Foursquare** | ✅ Configured | Venue details and ratings |
| **Amadeus** | ✅ Configured | Pet-friendly hotels |
| **Google Vision** | ✅ Configured | Pet photo analysis |

## ⚠️ NEEDS SETUP

### 1. Resend (Email Notifications)

**Current Status**: Domain not verified

**To Fix**:
1. Go to https://resend.com/domains
2. Add domain: `thedoggycompany.com`
3. Add DNS records (Resend will provide):
   - SPF record
   - DKIM record
   - Return-Path record
4. Wait for verification (usually < 24 hours)
5. Update `.env`:
   ```
   SENDER_EMAIL=mira@thedoggycompany.com
   ```

**Test endpoint**: `GET /api/test/notification?channel=email`

---

### 2. Gupshup (WhatsApp/SMS)

**Current Status**: Invalid App Details

**To Fix**:
1. Log in to https://www.gupshup.io
2. Go to WhatsApp Settings
3. Verify your Business Account
4. Register source number: `+919739908844`
5. Update `.env`:
   ```
   GUPSHUP_APP_NAME=THEDOGGYCOMPANY
   GUPSHUP_SOURCE_NUMBER=919739908844
   ```
6. Submit WhatsApp Business verification (can take 1-3 days)

**Test endpoint**: `GET /api/test/notification?channel=whatsapp`

---

## 🔗 API USAGE BY PILLAR

### CELEBRATE
```
APIs: Google Places, Eventbrite, YouTube
Queries: pet bakery, pet party venue, pet photographer
Videos: dog birthday party ideas
```

### DINE
```
APIs: Google Places, Foursquare, OpenWeather
Queries: pet friendly restaurant, pet friendly cafe, dog park
Weather alerts for walks
```

### STAY
```
APIs: Amadeus, Google Places
Queries: pet friendly hotel, pet boarding, kennel
```

### TRAVEL
```
APIs: Amadeus, Viator, Google Places
Queries: pet travel carrier, pet airline policy
```

### CARE
```
APIs: Google Places, YouTube
Queries: veterinary clinic, pet hospital, 24 hour vet
Videos: dog first aid, pet health tips
```

### ENJOY
```
APIs: Google Places, Foursquare
Queries: pet grooming, dog spa, pet salon
```

### FIT
```
APIs: Google Places, OpenWeather, YouTube
Queries: dog park, hiking trail pet friendly
Videos: dog exercise routines
Weather alerts
```

### LEARN
```
APIs: YouTube, Google Places
Queries: dog training center, puppy school
Videos: dog training basics
```

---

## 📱 TEST ENDPOINTS

All require Bearer token in Authorization header:

```bash
# Weather
GET /api/test/weather?lat=12.9716&lng=77.5946

# YouTube Videos
GET /api/test/youtube?query=dog+training

# Pet Events
GET /api/test/events?city=Bangalore

# Combined Pillar Data
GET /api/test/pillar-data/dine
GET /api/test/pillar-data/celebrate
GET /api/test/pillar-data/care

# Notifications
GET /api/test/notification?channel=email
GET /api/test/notification?channel=whatsapp
GET /api/test/notification?channel=sms
```

---

## 🔑 CURRENT API KEYS (.env)

```
# Google
GOOGLE_PLACES_API_KEY=AIzaSy... ✅
GOOGLE_VISION_API_KEY=AIzaSy... ✅
GOOGLE_CALENDAR_API_KEY=AIzaSy... ✅

# Weather
OPENWEATHER_API_KEY=53f54942... ✅

# Discovery
FOURSQUARE_API_KEY=fsq3... ✅

# Travel
AMADEUS_API_KEY=qUCq... ✅
AMADEUS_API_SECRET=7qCs... ✅
VIATOR_API_KEY=5ee7... ✅

# Events
EVENTBRITE_API_KEY=NBVCN... ✅
EVENTBRITE_PRIVATE_TOKEN=KAAG... ✅

# Media
YOUTUBE_API_KEY=AIzaSy... ✅

# Communication (needs setup)
RESEND_API_KEY=re_fi1... ⚠️ Domain needs verification
GUPSHUP_API_KEY=sk_26... ⚠️ App needs verification
GUPSHUP_SOURCE_NUMBER=919739908844
TEST_MOBILE_NUMBER=919739908844
```

---

*Last Updated: February 23, 2026*

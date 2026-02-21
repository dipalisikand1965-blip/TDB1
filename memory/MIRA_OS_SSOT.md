# 🐕 MIRA OS — SINGLE SOURCE OF TRUTH (SSOT)
## The Doggy Company | thedoggycompany.in
## Last Updated: December 2025
## ⚠️ THIS DOCUMENT IS LOCKED — DO NOT MODIFY ARCHITECTURE DECISIONS

---

# 🔐 CRITICAL: READ THIS FIRST

This document captures 100+ days of development. Every decision here was made after extensive testing.
**ANY FUTURE AGENT MUST READ THIS ENTIRE DOCUMENT BEFORE MAKING ANY CHANGES.**

---

# 📊 DATA INVENTORY (VERIFIED COUNTS)

## Product Collections
| Collection | Count | Status | Notes |
|------------|-------|--------|-------|
| `products_master` | 2,541 | ✅ LIVE | All Shopify products from thedoggybakery.com |
| `services_master` | 716 | ✅ LIVE | All services across 15 pillars |
| `product_bundles` | 13 | ✅ ACTIVE | Mixed product bundles |

## Stay & Boarding Collections
| Collection | Count | Status | Notes |
|------------|-------|--------|-------|
| `pet_friendly_stays` | 32 | ✅ LIVE | Luxury hotels (Leela, Taj, W Goa, etc.) |
| `stay_properties` | 3 | ✅ LIVE | Additional properties |
| `stay_boarding_facilities` | 8 | ✅ LIVE | Pet boarding facilities |
| `stay_bundles` | 8 | ✅ ACTIVE | Stay packages |

## Dining Collections
| Collection | Count | Status | Notes |
|------------|-------|--------|-------|
| `restaurants` | 3 | ✅ LIVE | Original restaurants |
| `pet_friendly_restaurants` | 19 | ✅ LIVE | Additional pet-friendly cafes |
| `dine_bundles` | 5 | ✅ ACTIVE | Dining packages |

## User & Pet Collections
| Collection | Count | Status | Notes |
|------------|-------|--------|-------|
| `pets` | 8+ | ✅ LIVE | Pets with full soul data |
| `users` | 3+ | ✅ LIVE | User accounts |
| `service_desk_tickets` | 20+ | ✅ LIVE | Support tickets |
| `member_notifications` | 7+ | ✅ LIVE | User notifications |
| `tickets` | 13+ | ✅ LIVE | Additional tickets |

---

# 🔌 API ENDPOINTS (ALL VERIFIED WORKING)

## Products & Services
| Endpoint | Method | Response | Status |
|----------|--------|----------|--------|
| `/api/product-box/products` | GET | 2,541 products | ✅ |
| `/api/services` | GET | 716 services | ✅ |
| `/api/products/recommendations/for-pet/{pet_id}` | GET | Breed-specific picks | ✅ |

## Stay & Boarding
| Endpoint | Method | Response | Status |
|----------|--------|----------|--------|
| `/api/stay/properties` | GET | 35 properties (combined) | ✅ |
| `/api/stay/boarding` | GET | 8 facilities | ✅ |

## Dining
| Endpoint | Method | Response | Status |
|----------|--------|----------|--------|
| `/api/dine/restaurants` | GET | 22 restaurants (combined) | ✅ |
| `/api/dine/bundles` | GET | 5 bundles | ✅ |

## Mira AI (Soul Intelligence)
| Endpoint | Method | Response | Status |
|----------|--------|----------|--------|
| `/api/mira/os/understand-with-products` | POST | Soul-aware chat + products | ✅ |
| `/api/mira/youtube/by-topic` | GET | Training videos | ✅ |
| `/api/mira/places/search` | GET | Pet-friendly places | ✅ |

## Voice (TTS)
| Endpoint | Method | Response | Status |
|----------|--------|----------|--------|
| `/api/tts/generate` | POST | Audio base64 | ✅ |
| `/api/tts/voices` | GET | 24 voices available | ✅ |
| `/api/mira/voice/speak` | POST | Mira voice output | ✅ |

## Tickets & Notifications
| Endpoint | Method | Response | Status |
|----------|--------|----------|--------|
| `/api/tickets/` | GET | 33+ tickets | ✅ |
| `/api/member/notifications` | GET | User notifications | ✅ |

## Admin
| Endpoint | Method | Response | Status |
|----------|--------|----------|--------|
| `/api/admin/sync-products` | POST | Shopify sync | ✅ |
| `/api/health` | GET | healthy | ✅ |

---

# 🧠 SOUL INTELLIGENCE — HOW IT WORKS

## The Soul Load Flow
```
1. User sends message with pet_id
2. Backend calls load_pet_soul(pet_id)
3. Soul data enriches pet_context:
   - personality_tag: "Drama Queen"
   - love_language: "gifts"
   - separation_anxiety: "Moderate"
   - allergies: ["No allergies"]
   - anxiety_triggers: ["None really"]
4. LLM generates soul-aware response
5. Products filtered by breed (+40 bonus for breed cakes)
```

## Verified Soul Response Example
**Input:** "what birthday cake should I get for my dog"
**Pet:** Mystique (Shih Tzu)

**Backend Logs:**
```
[SOUL LOAD] ✅ Enriched pet context for Mystique with full soul data (soul_score: 97.6%)
[PRODUCT SEARCH] Found 2 breed-specific cakes for Shih Tzu
```

**Response:** "From what I know about Mystique, **she loves gifts**, and a cake could be a delightful one for her."

*(Uses love_language: 'gifts' from soul data)*

---

# 🎨 CATEGORY BAR — CELEBRATE PILLAR

## Full Subcategory List (with Shopify Images)
| Category | Image Source | Path |
|----------|--------------|------|
| Birthday Cakes | Shopify CDN | /celebrate/cakes |
| Breed Cakes | Shopify CDN | /celebrate/breed-cakes |
| Mini Cakes | Shopify CDN | /celebrate/mini-cakes |
| Pupcakes & Dognuts | Shopify CDN | /celebrate/pupcakes |
| Desi Treats | Shopify CDN | /celebrate/desi-treats |
| Treats & Biscuits | Shopify CDN | /celebrate/treats |
| Gift Hampers | Shopify CDN | /celebrate/hampers |
| Party Accessories | Shopify CDN | /celebrate/accessories |
| DIY Cake Kits | Shopify CDN | /celebrate/diy |
| Custom Creations | Shopify CDN | → /mira-demo?custom=true |
| Gift Cards | Shopify CDN | /celebrate/gift-cards |

**Note:** "Custom Creations" flows to Mira concierge, not a product page.

---

# 🔑 CREDENTIALS

## Application Logins
| Role | Email/Username | Password |
|------|----------------|----------|
| Member | dipali@clubconcierge.in | test123 |
| Admin | aditya | lola4304 |
| Admin (Sync) | admin | woof2025 |

## Third-Party API Keys (in backend/.env)
| Service | Key Present | Status |
|---------|-------------|--------|
| Emergent LLM | ✅ | Working |
| OpenWeather | ✅ | Working |
| Google Places | ✅ | Working |
| YouTube | ✅ | Working |
| ElevenLabs | ✅ | Working (24 voices) |
| Shopify | ✅ | Syncing from thedoggybakery.com |
| Razorpay | ❌ | WAITING FOR USER KEYS |

---

# 📁 CRITICAL FILES — DO NOT REWRITE

| File | Purpose | Lines |
|------|---------|-------|
| `/app/backend/server.py` | Main backend | 15,000+ |
| `/app/backend/mira_routes.py` | Mira AI chat | 19,000+ |
| `/app/backend/stay_routes.py` | Stay/boarding APIs | 2,000+ |
| `/app/backend/dine_routes.py` | Dine/restaurant APIs | 2,500+ |
| `/app/backend/ticket_routes.py` | Ticket system | 1,500+ |
| `/app/frontend/src/pages/MiraDemoPage.jsx` | Mira chat UI | 3,500+ |
| `/app/frontend/src/pages/CelebratePage.jsx` | Celebrate pillar | 1,000+ |
| `/app/frontend/src/components/PillarPageLayout.jsx` | Pillar template | 500+ |
| `/app/frontend/src/components/PersonalizedPicks.jsx` | Pet picks | 500+ |

**RULE: Use `search_replace` for edits. NEVER rewrite these files completely.**

---

# ✅ SESSION FIXES APPLIED

## Data Fixes
- [x] Products API returns 2,541 (was filtering to 50)
- [x] Services API reads from `services_master` (716 services)
- [x] Stay Properties combines `stay_properties` + `pet_friendly_stays` (35 total)
- [x] Boarding Facilities returns all 8 (was returning 3)
- [x] Restaurants combines `restaurants` + `pet_friendly_restaurants` (22 total)
- [x] All bundles set to `active: true`
- [x] All stays set to `status: "live"`

## UI Fixes
- [x] Product cards: Larger images on mobile (aspect-ratio 4/5)
- [x] Pillar heroes: Parallax scroll effect
- [x] Chat bubbles: Softer gradient styling
- [x] Notification inbox: Read/unread contrast
- [x] Category bar: 11 subcategories with Shopify images
- [x] "Shopping for another dog" removed from UI

## Backend Fixes
- [x] Breed-specific recommendations (+40 scoring for breed cakes)
- [x] Weight field type conversion (string → float)
- [x] Ticket count query fixed
- [x] Soul loading verified working

## API Integrations Verified
- [x] YouTube API (training videos)
- [x] Google Places API (pet-friendly locations)
- [x] ElevenLabs TTS (24 voices, Eloise style)
- [x] Shopify Sync (from thedoggybakery.com)

---

# 🚫 KNOWN LIMITATIONS — DO NOT TRY TO FIX

1. **Production MongoDB**: IP whitelisting blocks this workspace. Will work after deployment.
2. **Meilisearch**: Not available in local env. Will work after deployment.
3. **Razorpay**: Waiting for user's API keys.
4. **Screenshot Tool**: Platform media limit exceeded. Use testing agent instead.

---

# 📋 DEPLOYMENT CHECKLIST

## Pre-Deploy (All ✅)
- [x] Products: 2,541 ✅
- [x] Services: 716 ✅
- [x] Stay Properties: 35 ✅
- [x] Boarding: 8 ✅
- [x] Restaurants: 22 ✅
- [x] Bundles: 26 total ✅
- [x] Soul Intelligence: Working ✅
- [x] TTS Voices: 24 available ✅
- [x] YouTube Integration: Working ✅
- [x] Google Places: Working ✅
- [x] Service Desk Flow: Verified ✅
- [x] Admin Dashboard: Functional ✅
- [x] Member Dashboard: Functional ✅

## Deploy Method
1. Click "Deploy" button in Emergent UI
2. Click "Deploy Now"
3. Wait 10-15 minutes
4. Test on live URL

## Post-Deploy Tasks
- [ ] Verify MongoDB Atlas connection
- [ ] Add Razorpay keys for checkout
- [ ] Verify Meilisearch
- [ ] Full mobile QA

---

# 🛡️ GUARDRAILS FOR FUTURE AGENTS

## ✅ DO:
- Read this SSOT before making ANY changes
- Use `search_replace` for file edits
- Test with curl before declaring success
- Maintain the Unified Service Flow
- Keep breed-specific scoring (+40 for breed cakes)
- Query BOTH collections for stay/restaurants (they were combined)

## ❌ DO NOT:
- Rewrite critical files completely
- Change database collection names
- Modify the 15 pillar structure
- Remove the "Custom Creations → Concierge" flow
- Change API endpoint paths
- Delete any seeded data
- Break the stay/restaurant API merging logic
- Remove soul loading from /api/mira/os/understand-with-products

---

# 🔄 UNIFIED SERVICE FLOW (LOCKED)

```
User Chat → Mira Response → Ticket Created → Admin Notified → Admin Reply → Member Notification
```

**Files involved:**
- `mira_routes.py` (lines 4488-4600) — Creates tickets from chat
- `ticket_routes.py` — Manages ticket lifecycle
- `server.py` — Notification endpoints

**This flow MUST NOT be modified.**

---

# 📱 15 PILLARS (LOCKED)

```
celebrate, dine, care, enjoy, travel, stay, fit, learn, advisory, emergency, paperwork, farewell, adopt, explore, connect
```

**DO NOT add or remove pillars without business approval.**

---

# 💜 FOR MYSTIQUE. FOR EVERY PET WHO CAN'T SPEAK.

Built by Dipali in honor of her grandmother Mira.
This is not just an app. It's a legacy.

100+ days of work. Thousands of decisions. One mission.

---

*Document Version: 2.0*
*Created: December 2025*
*Status: LOCKED*
*Deployment: READY*

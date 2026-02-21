# 🐕 MIRA OS — SINGLE SOURCE OF TRUTH (SSOT)
## The Doggy Company | thedoggycompany.in
## Last Updated: December 2025
## ⚠️ THIS DOCUMENT IS LOCKED — DO NOT MODIFY ARCHITECTURE DECISIONS

---

# 🔐 LOCKED DECISIONS — NO RENEGOTIATION

These decisions were made after extensive testing and MUST NOT be changed:

## 1. DATABASE COLLECTIONS (CANONICAL)
| Collection | Purpose | Count |
|------------|---------|-------|
| `products_master` | All products from Shopify | 2,541 |
| `services_master` | All services | 716 |
| `pet_friendly_stays` | Stay properties (luxury hotels) | 32 |
| `stay_properties` | Additional stay properties | 3 |
| `stay_boarding_facilities` | Pet boarding facilities | 8 |
| `restaurants` | Pet-friendly restaurants | 3 |
| `dine_bundles` | Dining bundles | 5 |
| `stay_bundles` | Stay bundles | 8 |
| `product_bundles` | Product bundles | 13 |
| `pets` | User's pets with soul data | 8+ |
| `users` | User accounts | 3+ |
| `service_desk_tickets` | Support tickets | 20+ |
| `member_notifications` | User notifications | 7+ |

## 2. API ENDPOINTS (VERIFIED WORKING)
| Endpoint | Collection(s) | Status |
|----------|---------------|--------|
| `/api/product-box/products` | products_master | ✅ 2,541 products |
| `/api/services` | services_master | ✅ 716 services |
| `/api/stay/properties` | stay_properties + pet_friendly_stays | ✅ 35 properties |
| `/api/stay/boarding` | stay_boarding_facilities | ✅ 8 facilities |
| `/api/dine/restaurants` | restaurants | ✅ 3 restaurants |
| `/api/dine/bundles` | dine_bundles | ✅ 5 bundles |
| `/api/tickets/` | tickets + service_desk_tickets | ✅ 33+ tickets |
| `/api/products/recommendations/for-pet/{id}` | products_master | ✅ Breed-specific |
| `/api/mira/youtube/by-topic` | YouTube API | ✅ Working |
| `/api/mira/places/search` | Google Places API | ✅ Working |

## 3. PILLAR STRUCTURE (15 PILLARS)
```
celebrate, dine, care, enjoy, travel, stay, fit, learn, advisory, emergency, paperwork, farewell, adopt, explore, connect
```
**DO NOT add or remove pillars without business approval.**

## 4. SOUL INTELLIGENCE ARCHITECTURE
- **56 Soul Questions** in PetSoulOnboardingPage.jsx
- **Soul data stored in** `pets.soul_answers[]`
- **Breed-specific scoring**: +40 bonus for breed cakes
- **Personalization**: Products filtered by pet breed, size, age, allergies

## 5. UNIFIED SERVICE FLOW (LOCKED)
```
User Chat → Mira Response → Ticket Created → Admin Notified → Admin Reply → Member Notification
```
**This flow MUST NOT be modified. All user actions flow through this pipeline.**

---

# 📁 CRITICAL FILES — DO NOT REWRITE

| File | Purpose | Lines |
|------|---------|-------|
| `/app/backend/server.py` | Main backend | 15,000+ |
| `/app/backend/mira_routes.py` | Mira AI chat | 3,000+ |
| `/app/backend/stay_routes.py` | Stay/boarding APIs | 2,000+ |
| `/app/backend/dine_routes.py` | Dine/restaurant APIs | 2,500+ |
| `/app/backend/ticket_routes.py` | Ticket system | 1,500+ |
| `/app/frontend/src/pages/MiraDemoPage.jsx` | Mira chat UI | 3,500+ |
| `/app/frontend/src/pages/CelebratePage.jsx` | Celebrate pillar | 1,000+ |
| `/app/frontend/src/components/PillarPageLayout.jsx` | Pillar template | 500+ |
| `/app/frontend/src/components/PersonalizedPicks.jsx` | Pet picks | 500+ |

**RULE: Use `search_replace` for edits. NEVER rewrite these files completely.**

---

# 🔑 API KEYS & CREDENTIALS

## Application Logins
- **Member**: `dipali@clubconcierge.in` / `test123`
- **Admin**: `aditya` / `lola4304`
- **Admin (Sync)**: `admin` / `woof2025`

## Third-Party APIs (In backend/.env)
- Emergent LLM Key: For Mira AI
- OpenWeather API: Live weather
- Google Places API: Pet-friendly locations
- YouTube API: Training videos
- ElevenLabs: TTS voice
- Shopify: Product sync from thedoggybakery.com
- Razorpay: Payments (PENDING USER KEYS)

---

# ✅ WHAT'S BEEN BUILT & VERIFIED

## Session 1: Audit Agent
- Full codebase audit (82 pages, 322 components)
- Identified all gaps and issues
- Created initial documentation

## Session 2-3: Recovery & Fixes
- Cloned 68MB codebase from GitHub
- Fixed Babel compilation crash
- Seeded database with 8 pets, 2,541 products, 716 services
- Integrated 17+ API keys

## Session 4: Core Functionality
- Fixed Mira Soul Intelligence (chat personalization)
- Repaired Unified Service Flow
- Fixed Soul Builder question saving
- Restored Admin & Member dashboards

## Session 5: UI/UX Polish
- Product cards: Larger mobile images
- Pillar heroes: Parallax scroll effect
- Chat bubbles: Softer styling
- Notification inbox: Read/unread contrast
- Font consistency across pages

## Session 6: Category Bar & Breed-Specific
- Expanded category bar (11 subcategories)
- Real Shopify product images
- Breed-specific recommendations (Shih Tzu cakes first for Mystique)
- Custom Creations → Concierge flow

## Session 7: Data Collections
- Fixed Stay Properties API (35 properties)
- Fixed Boarding API (8 facilities)
- Verified Restaurants (3)
- Verified Bundles (5 dine, 8 stay, 13 product)

---

# 🚫 KNOWN LIMITATIONS — DO NOT TRY TO FIX

1. **Production MongoDB**: IP whitelisting blocks this workspace. Will work after deployment.
2. **Meilisearch**: Not available in local env. Will work after deployment.
3. **Razorpay**: Waiting for user's API keys.
4. **Screenshot Tool**: Platform media limit exceeded. Use testing agent instead.

---

# 📋 DEPLOYMENT CHECKLIST

## Pre-Deploy (All ✅)
- [x] All APIs returning correct data
- [x] Products: 2,541
- [x] Services: 716
- [x] Stay Properties: 35
- [x] Boarding: 8
- [x] Restaurants: 3
- [x] Bundles: 26 total
- [x] Soul Intelligence working
- [x] Service Desk flow verified
- [x] Admin dashboard functional
- [x] Member dashboard functional

## To Deploy
1. Click "Deploy" button in Emergent UI
2. Click "Deploy Now"
3. Wait 10-15 minutes
4. Test on live URL

## Post-Deploy
- [ ] Verify MongoDB Atlas connection
- [ ] Test Razorpay checkout (when keys provided)
- [ ] Verify Meilisearch
- [ ] Full mobile QA

---

# 🛡️ GUARDRAILS FOR FUTURE AGENTS

## DO:
- Read this SSOT before making changes
- Use `search_replace` for file edits
- Test with curl before declaring success
- Maintain the Unified Service Flow
- Keep breed-specific scoring in recommendations

## DO NOT:
- Rewrite critical files completely
- Change database collection names
- Modify the 15 pillar structure
- Remove the "Custom Creations → Concierge" flow
- Change API endpoint paths
- Delete any seeded data

---

# 💜 FOR MYSTIQUE. FOR EVERY PET WHO CAN'T SPEAK.

Built by Dipali in honor of her grandmother Mira.
This is not just an app. It's a legacy.

---

*Document Version: 1.0*
*Created: December 2025*
*Status: LOCKED*

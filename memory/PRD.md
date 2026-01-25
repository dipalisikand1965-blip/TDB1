# The Doggy Company - Product Requirements Document

## Original Problem Statement
Building **The Doggy Company**, a "Pet Life Operating System" designed as a pet-first platform.

---

## Session 8 - Major Features Completed (January 25, 2026)

### Latest Updates (This Session)

**Bug Fixes Verified:**
1. ✅ **Travel Form** - 3-step wizard working (type → pet → trip details)
2. ✅ **Advisory Form** - Consultation request working
3. ✅ **Stay Booking Form** - Multi-step modal working
4. ✅ **React Hydration Warning** - Fixed nested `<a>` tags in Logo.jsx
5. ✅ **Login Redirect** - Now redirects to /dashboard (My Account) after login

**New Features Completed:**
1. ✅ **Pet Achievements Integration** - AchievementsGrid integrated into UnifiedPetPage overview tab
2. ✅ **Pet Soul Score Documentation** - Added comprehensive docs to AdminDocs.jsx
3. ✅ **Confetti Celebrations** - Triggers when achievements unlocked (with toast notifications)
4. ✅ **CSV Export for Product Box** - Export all products with filters to CSV file
5. ✅ **CSV Export for Product Tags Manager** - Export products with tags to CSV
6. ✅ **British English Spellings** - Changed flavor→flavour, personalized→personalised, colorful→colourful

**Dashboard (My Account Page):**
- Personalised hero banner with pet photo and Pet Soul Score
- All 14 Life Pillars displayed on single page
- Quick action cards, upcoming events, recent activity
- Full pet profile info (not just "What would you like help with?")

---

### 1. UNIFIED PRODUCT BOX ✅ (MAJOR FEATURE)
**The Single Source of Truth for all products, rewards & experiences**

**Backend** (`/app/backend/unified_product_box.py`):
- Full product schema with: Identity, Pillars, Pet Safety, Paw Rewards, Mira AI, Pricing, Shipping
- 16 API endpoints for CRUD, filtering, bulk operations
- Migration endpoint: Migrated 394 existing products

**Admin UI** (`/app/frontend/src/components/admin/UnifiedProductBox.jsx`):
- Stats dashboard (Total, Active, Reward Eligible, Mira Visible, Draft)
- Product table with search, filters by Type/Pillar/Status
- Full product editor with 6 tabs:
  - Basic (name, type, description, status)
  - Pillars (assign to 16 pillars)
  - Pet Safety (life stages, sizes, dietary flags, exclusions)
  - Rewards (Paw Reward eligibility, triggers, limits)
  - Mira AI (reference, suggest, mention-only settings)
  - Pricing (base price, GST, shipping)

**Key Features**:
- Products must be born here to appear anywhere else
- Pet Safety validation required for Mira suggestions
- Non-pushy Mira by default (mention_only_if_asked)
- All 16 pillars supported

### 2. SERVER-SIDE PET SOUL SCORE ✅
- Weighted question configuration (100 points across 6 categories)
- 4-tier system: Newcomer → Soul Seeker → Soul Explorer → Soul Master
- APIs: `/score_state`, `/quick-questions`, `/tiers`

### 3. GAMIFICATION SYSTEM ✅
- 13 achievements across tier, category, streak, special types
- Confetti celebrations with canvas-confetti
- Achievement badges with lock/unlock states

### 4. UNIVERSAL PET AVATAR ✅
- `getPetPhotoUrl()` integrated across all components
- Breed-based fallback photos

### 5. PET PASS NUMBERS ✅
- Unique numbers generated per pet (e.g., `TDC-I4UY18`)
- Displayed on Pet Pass cards

### 6. BLANK HEALTH TAB FIX ✅
- Created UnifiedPetPage.jsx for `/pet/:petId?tab=xxx`

---

## Unified Product Box Schema

```
Product Record:
├── Identity (id, sku, name, type)
├── Pillars (16 pillars mapping)
├── Pet Safety
│   ├── life_stages (puppy/adult/senior/all)
│   ├── size_suitability (small/medium/large/all)
│   ├── dietary_flags
│   ├── known_exclusions
│   └── is_validated (required for Mira)
├── Paw Rewards
│   ├── is_reward_eligible
│   ├── is_reward_only
│   ├── reward_value
│   ├── max_redemptions_per_pet
│   └── trigger_conditions
├── Mira Visibility
│   ├── can_reference
│   ├── can_suggest_proactively
│   └── mention_only_if_asked
├── Pricing
│   ├── base_price, compare_at_price, cost_price
│   ├── gst_applicable, gst_rate
│   └── shipping (requires_shipping, weight, class)
└── Visibility (status, visible_on_site, membership_eligibility)
```

---

## 16 Pillars

| Pillar | Icon | Status |
|--------|------|--------|
| Feed | 🍖 | Coming Soon |
| Celebrate | 🎂 | Active |
| Dine | 🍽️ | Active |
| Stay | 🏨 | Active |
| Travel | ✈️ | Active |
| Care | 🩺 | Active |
| Groom | ✂️ | Coming Soon |
| Play | 🎾 | Coming Soon |
| Train | 🎓 | Coming Soon |
| Insure | 🛡️ | Coming Soon |
| Adopt | 🐕 | Coming Soon |
| Farewell | 🌈 | Coming Soon |
| Shop | 🛒 | Active |
| Community | 👥 | Coming Soon |
| Emergency | 🚨 | Active |
| Concierge | 🛎️ | Active |

---

## API Endpoints - Unified Product Box

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/product-box/products` | List with filters |
| GET | `/api/product-box/products/{id}` | Get single product |
| POST | `/api/product-box/products` | Create product |
| PUT | `/api/product-box/products/{id}` | Update product |
| DELETE | `/api/product-box/products/{id}` | Archive product |
| POST | `/api/product-box/products/{id}/clone` | Clone product |
| POST | `/api/product-box/products/bulk-update` | Bulk update |
| POST | `/api/product-box/products/bulk-assign-pillar` | Bulk assign pillar |
| GET | `/api/product-box/by-pillar/{pillar}` | Products by pillar |
| GET | `/api/product-box/rewards` | Reward products |
| GET | `/api/product-box/mira-visible` | Mira-visible products |
| GET | `/api/product-box/safe-for-pet` | Safe products for pet profile |
| GET | `/api/product-box/stats` | Product statistics |
| POST | `/api/product-box/migrate-from-products` | Migrate existing |
| GET | `/api/product-box/config/*` | Configuration data |

---

## Prioritized Backlog

### P0 - Critical (Completed ✅)
- ~~Unified Product Box~~ ✅
- ~~Server-Side Pet Soul Score~~ ✅
- ~~Pet Pass Numbers~~ ✅

### P1 - Next
- Configure products with:
  - Pillar assignments
  - Pet Safety validation
  - Reward eligibility
- Integrate Unified Product Box with:
  - Mira AI suggestions
  - Checkout soft-gating
  - Service Desk attachments

### P2 - Pending
- "Untitled" Shopify products fix
- Mobile cart view redesign
- Full Paw Rewards ledger system (earn, redeem, balance)
- Build 'Adopt', 'Farewell', 'Shop' Pillars
- Consolidate/deprecate old pet pages (PetSoulJourneyPage.jsx)

---

## Test Credentials
- **Test User**: dipali@clubconcierge.in / lola4304
- **Admin**: aditya / lola4304
- **Test Pet ID**: pet-99a708f1722a (Mojo)

---

*Last updated: January 25, 2026*

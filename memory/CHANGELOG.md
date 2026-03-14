# CHANGELOG - The Doggy Company / Mira OS
## Development History

---

## [Mar 15, 2026] Session 6c — Soul Questions Visibility + Admin Sync + Score Animation ✅

### Fixes Applied
- **Soul Question Cards**: Redesigned with frosted glass (rgba white bg + blue border + blue glow) — fully visible on dark modal. Each card shows: folder, +Xpts badge, question, options/textarea, 'Save +X pts' button. Success state: green glow card with "+X pts added"
- **Soul Score Display**: Big 38px animated counter (gold for 90%+, blue for 50%+), progress bar, +delta shown on score change
- **Mira Cards Dynamic Refresh**: After answering, `fetchData()` re-runs — new imagined products appear when new food preferences revealed
- **Admin Celebrate Products**: Now uses exact Set of 12 categories matching frontend. Limit raised to 5000. Active-only by default (419 active products showing). Toggle button to show inactive (12 extra)
- **Admin Active/Inactive Toggle**: "✓ Active only" / "⚡ All (incl. inactive)" toggle button

### Category-Product Sync (Frontend = Admin active view)
| Category | Active | Match frontend? |
|----------|--------|----------------|
| cakes | 111 | ✅ |
| celebration | 106 | ✅ |
| breed-cakes | 42 | ✅ |
| hampers | 37 | ✅ |
| breed-party_hats | 33 | ✅ |
| dognuts | 30 | ✅ |
| frozen-treats | 24 | ✅ |
| mini-cakes | 11 | ✅ |
| party_accessories | 11 | ✅ |
| desi-treats | 7 | ✅ |
| nut-butters | 6 | ✅ |

---



### Feature 1: Request a Quote → Service Desk Ticket (No Mira widget)
- Clicking "Request a Quote →" on any MiraImaginesCard POSTs to `/api/service_desk/attach_or_create_ticket`
- Pillar: `celebrate`, intent: `mira_imagines_product`, full context in message body
- Button shows green **"✓ Sent to Concierge!"** — works mobile + desktop ✅

### Feature 2: Soul Questions Inline in Mira's Picks
- New `SoulQuestionsSection` + `SoulQuestionCard` components in `CelebrateContentModal.jsx`
- Fetches unanswered questions from `/api/pet-soul/profile/{pet_id}/quick-questions?limit=5`
- Shows for ALL pets (not just empty ones — keeps growing all 51 soul questions)
- On answer → score updates live via `soulScoreUpdated` event → hero updates dynamically ✅

### Feature 3: Admin Celebrate Products
- `CelebrateManager.jsx` now uses `/api/admin/products?limit=1000` (Basic Auth)  
- Category filter uses `includes()` → "Treats" matches desi-treats, frozen-treats etc.
- Active/Inactive badge on each product card ✅
- **Test result:** 459 products loaded, 435 Active + 24 Inactive visible ✅

### Test Results: 23/24 passing (95% success rate)

---

## [Mar 15, 2026] Session 6 — Critical Regression Fix + Mira Picks Enhancement ✅ COMPLETE

### ROOT CAUSE FOUND & FIXED
**Problem:** Previous cleanup script set `is_active: None` (null) for 253 celebrate products.  
The backend API filter only checked `is_active: True` or `{$exists: False}`, so `None` was excluded.

### Products Re-Activated (253 total)
| Category | Count |
|----------|-------|
| `cakes` (Birthday Cakes) | 111 |
| `breed-cakes` | 42 |
| `celebration` (kits) | 106 |
| `dognuts` (Pupcakes) | 30 |
| `frozen-treats` | 24 |
| `hampers` | 37 |
| `desi-treats` | 7 |
| `nut-butters` | 6 |

### Backend API Fix
- `is_active` filter now accepts `True`, `{$exists: False}`, AND `None` — future-proofed

### Mira's Picks Code Improvements
- `getLovedFoods()`: Handles 2 learned_facts formats:
  - Format 1: `{type:'loves', category:'preferences', value:'salmon treats'}` ✅
  - Format 2: `{category:'loves', content:"Loves ['salmon']"}` ✅ (was broken)
- `extractSoulTraits()`: Cleaner, handles all fact formats, fully deduped
- "Salmon Delight Cake" imagined card RESTORED for Mojo ✅
- Breed Cakes tab showing all 42 products ✅

---



### ✅ Party & Decor (47 total products)
- 14 generic party items with AI-generated Cloudinary images
- 33 breed-specific party hats (1 per breed, all with Cloudinary mockups)
- Breed filtering active - only matching breed's products show

### ✅ Soul Picks - EXPANDED Categories
Now includes additional celebrate-relevant merchandise:
- Original: breed-mugs, breed-bandanas, breed-frames, breed-keychains, breed-party_hats, breed-tote_bags
- **NEW:** breed-blankets, breed-bowls, breed-paw_print_frames, breed-pet_robes, breed-pet_towels, breed-treat_jars
- Total: 12 breed merchandise categories × 33 breeds = 396 products

### ✅ Mira's Picks - ENHANCED with Soul Traits
**Now uses ALL soul data, not just loved foods:**

1. **Food-based imaginary:** (existing)
   - "loves salmon" → "Salmon Delight Cake"

2. **Activity-based imaginary:** (NEW)
   - "loves tennis ball" → "Tennis Ball Birthday Box" 🎾
   - "loves fetch" → "Ultimate Fetch Party Kit" 🎯
   - "loves swimming" → "Pool Party Celebration Kit" 🏊
   - "loves car rides" → "Road Trip Birthday Adventure" 🚗
   - "loves cuddles" → "Cozy Cuddle Birthday Box" 🥰
   - "loves naps" → "Nap Time Birthday Bundle" 😴
   - "loves running" → "Zoomies Party Kit" 🏃
   - "loves squeaky toys" → "Squeaky Toy Birthday Box" 🧸

3. **Soul Onboarding cards:** (NEW)
   - If pet has no soul data → shows "Help Mira know [pet] better" card
   - Questions link to soul onboarding flow
   - Grows the soul score over time

### ✅ Mira Picks Works for ALL Dogs
- Extracts traits from: learned_facts, soul object, preferences, direct fields
- Falls back to onboarding card if no data
- Works for Mojo, Mystique, and all pets

### Technical Implementation:
- `extractSoulTraits()` function extracts ALL soul data from pet object
- `MiraImaginesCard` component handles food, activity, and onboarding types
- Activity map covers common pet activities
- Soul onboarding dispatches `openSoulOnboarding` event

---

## [Mar 13, 2026] Session 4 Round 3 — Soul Picks Real Merchandise + Mira Imagines
### Changes:
1. **Soul Picks** → Real breed merchandise (mugs, bandanas, frames, keychains, party hats, tote bags). Source: `breed-mugs`/`breed-bandanas`/`breed-frames`/`breed-keychains`/`breed-party_hats`/`breed-tote_bags` filtered by breed display name.
2. **Mira's Picks** → `MiraImaginesCard` for loved foods not in collection. Dark gradient card, food emoji, "Request a Quote →" button → concierge toast. Max 3 imaginary cards per session. Followed by 8-10 real breed-filtered cakes.
3. **Helpers added**: `getBreedDisplay()`, `getFoodEmoji()`, `getLovedFoods()`
4. ⚠️ NEVER use `/api/mockups/breed-products` on the celebrate page — AI illustrations are NOT desired

## [Mar 13, 2026] Session 4 Round 2 — 5 Critical Issues Fixed (100% pass)
1. Birthday Cakes → `cakes` category (111 real TDB bakery cakes). Was wrongly using `celebration` (kits).
2. Mira's Picks → breed-aware filter. Indie → Indie cakes.
3. BundleDetailSheet → X close button + object-contain image.
4. Soul Picks → ProductCard modal with X (replaced BundleDetailSheet).
5. Footer → Mira whisper + "Build {Pet}'s Birthday Plan →" CTA. No "Continue Shopping".

## [Mar 13, 2026] Session 4 Round 1 — CelebrateContentModal + CategoryStrip
- 11 categories in strip (added Frozen Treats, Party & Decor, Nut Butters)
- Desktop modal: centered via wrapper div (Framer Motion safe)
- Admin: 308+ products load, CATEGORY_OPTIONS updated
- ProductCard images: object-contain (no cropping)
- Dynamic footer: browsing state vs active (items added)

---

## [Mar 13, 2026] Session 4 — CelebrateContentModal Complete Fix (Round 2)
### 5 Critical Issues Fixed (100% test pass):
1. **Birthday Cakes** — reverted to `cakes` category (111 actual TDB bakery cakes). `celebration` (celebration kits) was wrong.
2. **Mira's Picks** — breed-aware: fetches cakes, filters by pet breed. Indie dog → Indie cakes.  
3. **BundleDetailSheet** — X close button added, image uses `objectFit: contain` (no crop).
4. **Soul Picks** — uses ProductCard modal (proper X button), not BundleDetailSheet.
5. **Footer** — Mira whisper (left) + dynamic CTA "Build {Pet}'s Birthday Plan →" (right). No more "Continue Shopping".

## [Mar 13, 2026] Session 4 Round 1 — CelebrateContentModal + CategoryStrip
- 11 categories in strip (added Frozen Treats, Party & Decor, Nut Butters)
- Desktop modal: centered via wrapper div (Framer Motion safe)
- Admin: 308+ products load, CATEGORY_OPTIONS updated
- ProductCard images: object-contain (no cropping)

---

## March 13, 2026 — Session 2: Celebrate Page Full Functionality

### Celebrate Page (Route: `/celebrate-soul`) — Full Functionality Completed

**P0 Bug Fixes:**
- ✅ Fixed pet photo in Hero: Changed `pet?.image` → `pet?.photo_url || pet?.image_url` — Mojo's actual photo now shows
- ✅ Fixed `[object Object]` in Food Pillar Mira quote: Safely extracts string from pet.favorites array of objects

**P0 Feature Implementations:**
- ✅ **Mira Ask Bar**: Added below Soul Pillars section (no text label, just the input). Click/submit opens Mira widget via `openMiraAI` custom event with celebrate context. Placeholder: "Ask Mira about {petName}'s celebrations..."
- ✅ **Concierge Catalogue Drawer**: "Browse Celebrate Catalogue" button opens bottom sheet with two tabs:
  - **Celebrate tab**: Real Shopify products from The Doggy Bakery (cakes, hampers with beautiful illustrations from cdn.shopify.com)
  - **Personalised tab**: Celebrate bundles from /api/celebrate/bundles (Cloudinary illustrations)
  - Allergy notice banner for pets with allergies
- ✅ **Build Box CTAs**: "Build Mojo's Box" → `/occasion-box?occasion=birthday&pet=Mojo`. "Birthday Box" → `/occasion-box?occasion=birthday`
- ✅ **Soul Pillar Expanded**: Wired to real API data (tabs per pillar, fetches from /api/products?category=X and /api/celebrate/products?category=X, allergen filtering)

**UI Spec Compliance:**
- ✅ Updated all 8 pillar card colors to match exact spec: Food=`linear-gradient(135deg, #FFF3E0, #FFE0B2)`, Play=pink, Social=purple, etc.
- ✅ Hero layout: flex row desktop (avatar left, content right), stacked centered mobile
- ✅ Concierge background: FLAT `#0E0620` (not gradient — spec requirement)
- ✅ Birthday Box background: `linear-gradient(135deg, #1a0020, #3d0060)` (gradient)
- ✅ Hero title: "Celebrations" `#FFD080`, "for {petName}" `#FFAAD4`

**Documentation Updated:**
- ✅ `/app/memory/docs/CELEBRATE_UI_SPEC.md` — Complete rewrite with all 9 components, exact values, data sources

**Testing:** 95% pass rate (30/32). All critical features working.

---

### Session - Celebrate Pillar Soul-First Architecture Design & Implementation

**Major Feature IMPLEMENTED:**
- 🎨 Complete redesign of `/celebrate` page architecture - LIVE at `/celebrate-soul`
- New concept: "A celebration built FROM the soul, not a product catalog"
- 8 Soul Celebration Pillars with 3 states (Glow, Dim, Incomplete) - ALL WORKING
- New page spine: Arrival → Soul Pillars → Mira's Box → Concierge → Paths → Wall

**New Components Created:**
- ✅ `/app/frontend/src/components/celebrate/CelebrateHero.jsx` - Hero with soul chips and Mira's quote
- ✅ `/app/frontend/src/components/celebrate/SoulCelebrationPillars.jsx` - 8 pillar cards with glow/dim/incomplete states
- ✅ `/app/frontend/src/components/celebrate/SoulPillarExpanded.jsx` - Expanded view with tabs and filtered products
- ✅ `/app/frontend/src/components/celebrate/MiraCuratedBox.jsx` - "The {petName} Birthday Box"
- ✅ `/app/frontend/src/components/celebrate/CelebrateConcierge.jsx` - Gold/purple Concierge handoff section
- ✅ `/app/frontend/src/components/celebrate/GuidedCelebrationPaths.jsx` - 3 guided paths
- ✅ `/app/frontend/src/components/celebrate/index.js` - Export index
- ✅ `/app/frontend/src/pages/CelebratePageNew.jsx` - New page using soul-first architecture

**Documentation Created:**
- ✅ `/app/memory/docs/CELEBRATE_SPEC.md` - Complete copy & content specification
- ✅ Updated `PRD.md` with new Celebrate architecture
- ✅ Updated `complete-documentation.html` with Celebrate section
- ✅ Updated `CHANGELOG.md`

**Route Added:**
- `/celebrate-soul` → CelebratePageNew (Soul-First Architecture)

**Key Features Working:**
- Soul Chips: Allergy, Loves, Personality - dynamically populated from pet data
- Pillar Glow Logic: Pillars glow based on pet's soul score for that dimension
- Incomplete State: "Tell Mira more" badge when soul data is missing (turns empty state into soul-building moment)
- Mira's Box: Dynamically curated items based on pet preferences
- Personalized copy: All text uses {petName} and references actual pet data

---

## February 15, 2026

### Session 1 - Bug Fix & 8 Pillars Unification

**Bug Fixed:**
- ✅ `/celebrate-new` "l.some is not a function" error
  - **Cause:** `petAllergies` and `petFavorites` were strings, not arrays
  - **Fix:** Added array validation in `CelebrateNewPage.jsx`:
    ```javascript
    const rawAllergies = pet?.allergies || pet?.doggy_soul_answers?.allergies;
    const petAllergies = Array.isArray(rawAllergies) ? rawAllergies : (rawAllergies ? [rawAllergies] : []);
    ```

**Major Feature:**
- ✅ UNIFIED 8 Golden Pillars Scoring System
  - Restructured `pet_soul_config.py` from 6 categories → 8 pillars
  - Expanded from 26 → 39 scored questions
  - Total still = 100 points
  - New distribution across ALL 8 pillars
  - New endpoint: `GET /api/pet-soul/profile/{pet_id}/8-pillars`

**Documentation:**
- Created `/app/memory/START_HERE_AGENT.md` - Master handover
- Created `/app/memory/8_GOLDEN_PILLARS_SPEC.md` - Technical spec
- Updated `/app/memory/PRD.md`

**Testing:**
- ✅ Verified question saving works (POST → GET verification)
- ✅ Verified 8-pillars endpoint returns correct scores
- ✅ Screenshot verification of `/celebrate-new` and `/mira-demo`

---

## February 14, 2026

### Session - Concierge® Rebrand & Intelligent Quick Replies

**Features:**
- ✅ Rebranded "Chat" tab to "Concierge®" with Freshchat icon
- ✅ Backend-driven intelligent quick replies
  - New function `generate_intelligent_quick_replies()` in `server.py`
  - Analyzes AI response to generate contextual prompts
- ✅ Inline conversational UI for quick replies
- ✅ Created `MIRA_SOUL_SCORECARD.md` for intelligence assessment

---

## February 13, 2026

### Session - Mira OS Modal Foundation

**Features:**
- ✅ Created new Mira OS Modal (`MiraOSModal.jsx`)
- ✅ Three tabs: Picks, Concierge®, Services
- ✅ Multi-pet switching in modal
- ✅ "Mira OS (BETA)" button on `/celebrate-new`

---

## Earlier Development (Days 1-100)

### Core Platform
- Pet Soul onboarding flow
- 14 pillar pages architecture
- Membership system
- Shopify integration
- Product catalog

### Mira AI
- Original Mira FAB (`MiraChatWidget.jsx`)
- Soul-first response generation
- Conversation memory
- ElevenLabs voice integration (added but untested)

### Data Systems
- DOGGY_SOUL_QUESTIONS (55+ questions)
- Quick Questions endpoint
- Soul scoring (original 26 questions)

---

## Known Issues Backlog

| Issue | Status | Priority |
|-------|--------|----------|
| ElevenLabs voice in Mira OS | Untested | P0 |
| Production domain DNS | External blocker | P0 |
| Original FAB multi-pet switching | Broken | P2 |
| Original FAB voice | Broken | P2 |

---

*This changelog tracks all significant development milestones.*

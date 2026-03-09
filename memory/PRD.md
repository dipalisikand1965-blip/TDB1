# The Doggy Company - PRD

**Last Updated:** March 9, 2026 19:15 IST  
**Status:** Soul Made Products Expanded - 1,018 Total Products!

---

## 🚨 CRITICAL - READ FIRST 🚨

### Soul Made Products Implementation Guide
**READ THIS FILE:** `/app/memory/SOUL_MADE_IMPLEMENTATION_GUIDE.md`

This file contains EVERYTHING about Soul Made products:
- All 26 product types (11 original + 15 NEW)
- All 33 breeds
- Pillar assignments
- API endpoints
- How to generate mockups
- Production sync instructions

---

## 📊 CURRENT STATE (March 9, 2026)

| Metric | Count |
|--------|-------|
| **Total Products** | 1,018 |
| **Original Products (11 types)** | 523 |
| **NEW Products (15 types)** | 495 |
| **With Mockups** | ~223 (22%) |
| **Need Mockups** | ~795 |
| **Breeds** | 33 |
| **Product Types** | 26 |

### Product Types
**ORIGINAL 11:** bandana, mug, keychain, frame, tote_bag, party_hat, welcome_mat, blanket, collar_tag, treat_jar, bowl

**NEW 15 (Created March 9):** passport_holder, carrier_tag, travel_bowl, luggage_tag, pet_towel, pet_robe, grooming_apron, treat_pouch, training_log, memorial_ornament, paw_print_frame, emergency_card, medical_alert_tag, play_bandana, playdate_card

---

## ☁️ CLOUDINARY INTEGRATION (March 9, 2026)

### Status: ✅ FULLY CONFIGURED AND WORKING

**Credentials (in `/app/backend/.env`):**
```
CLOUDINARY_CLOUD_NAME=duoapcx1p
CLOUDINARY_API_KEY=396757862875471
CLOUDINARY_API_SECRET=uwvyt1zf8vPF62SMeHGFn3k3O_A
```

**Key Features:**
- ✅ NEW mockups automatically upload to Cloudinary
- ✅ "SYNC → PROD" button in Admin Panel
- ✅ Export/Import endpoints for production sync

---

## 🚨 CRITICAL WARNING FOR ALL AGENTS 🚨

### THE $1000 BUG - NEVER REPEAT THIS

A bug in `seed_all_breed_products` used `$set` which **WIPED ALL MOCKUP IMAGES** on every deployment/seed. This cost **$1000+** in regeneration.

**THE FIX (APPLIED):** Uses `$setOnInsert` for `mockup_url` field.

**FILE:** `/app/backend/scripts/generate_all_mockups.py`

**NEVER CHANGE THIS. EVER.**

---

## SESSION 6 ACCOMPLISHMENTS (March 9, 2026 - Latest)

### 🟢 NEW FEATURES:

1. **Soul Made Products in Product Box** - AI-generated breed products now appear in unified Product Box
   - **Files:** `/app/backend/unified_product_box.py`, `/app/frontend/src/components/admin/UnifiedProductBox.jsx`
   - **API:** `GET /api/product-box/products?source=soul_made` - Filters to Soul Made products only
   - **Edit:** `PUT /api/product-box/products/{product_id}` - Now works for both regular AND breed products
   - **Total:** 523 Soul Made products now in Product Box

2. **Source Filter in Product Box** - New dropdown to filter by product source:
   - `📦 All Sources` - Shows everything
   - `🛒 Shopify` - Products synced from thedoggybakery.com
   - `🎨 Soul Made (AI)` - AI-generated breed products from `breed_products` collection
   - `✍️ Manual` - Products created manually

3. **Price Editing for Soul Made** - Can now edit prices directly in Product Box
   - Click on price → Quick edit → Save
   - Changes saved to `breed_products` collection

4. **iOS Mobile Pet Switcher** - Added pet switching to Quick Nav sidebar
   - **File:** `/app/frontend/src/components/MemberMobileNav.jsx`
   - Hamburger menu → "SWITCH PET" section → Tap any pet
   - Works on ALL pages including pillar pages

5. **iOS Touch Fixes** - All navbar buttons now work on iOS Safari
   - Hamburger menu (≡)
   - User icon (👤) - Goes to Dashboard
   - Cart icon (🛒) - Opens cart
   - **File:** `/app/frontend/src/components/Navbar.jsx`

6. **Product Image Fix** - Fixed 380 products with wrong AI images
   - **Endpoint:** `POST /api/admin/fix-product-images`
   - Button: "🖼️ FIX IMAGES" in Admin Panel
   - All Shopify products now show correct CDN images

### 📦 Product Storage Architecture:

| Source | Collection | API | Editable |
|--------|-----------|-----|----------|
| Shopify | `products_master` | `/api/product-box/products` | Yes |
| Soul Made | `breed_products` | `/api/product-box/products?source=soul_made` | **Yes ✅** |
| Manual | `products_master` | `/api/product-box/products` | Yes |

### 🛒 Soul Made Product APIs (NEW):

| Endpoint | Description |
|----------|-------------|
| `POST /api/product-box/soul-made/{id}/duplicate-to-production` | Copy to `products_master` for checkout |
| `PUT /api/product-box/soul-made/{id}/pillars` | Assign to pillars (celebrate, fit, etc.) |
| `PUT /api/product-box/soul-made/{id}/variants` | Set size/variant pricing |
| `PUT /api/product-box/soul-made/{id}/sale` | Set sale price & compare_at_price |
| `PUT /api/product-box/soul-made/{id}/stock` | Stock quantity & low stock alert |
| `GET /api/product-box/soul-made/low-stock` | Get low stock products |

### Key Files Modified This Session:
| File | Change |
|------|--------|
| `/app/backend/unified_product_box.py` | Added source filter, Soul Made CRUD support |
| `/app/frontend/src/components/admin/UnifiedProductBox.jsx` | Source filter dropdown, Soul Made badges |
| `/app/frontend/src/components/MemberMobileNav.jsx` | Pet switcher in Quick Nav |
| `/app/frontend/src/components/Navbar.jsx` | iOS touch fixes for all buttons |
| `/app/frontend/src/pages/PetHomePage.jsx` | iOS touch fixes for pet selector |
| `/app/backend/shopify_sync_routes.py` | Fix product images endpoint |

---

## SESSION 5 ACCOMPLISHMENTS (March 9, 2026)

### 🔴 CRITICAL FIXES:

1. **Product Card Images** - Shopify products now show REAL product images from thedoggybakery.com, not AI-generated mockups
   - **File:** `/app/frontend/src/components/ProductCard.jsx` (line ~401)
   - **Fix:** Only apply mockups to `soul_made` products, never to regular Shopify products

2. **Breed Filtering** - Products for OTHER breeds are now EXCLUDED from recommendations
   - **File:** `/app/backend/server.py` (~line 8430)
   - **Fix:** Added `ALL_BREED_NAMES` list and exclusion logic to skip products with other breed names

3. **Product Modal Title** - Titles no longer cut off by close button
   - **File:** `/app/frontend/src/components/ProductCard.jsx` (line ~1105)
   - **Fix:** Added `pr-8` padding to title

4. **Soul Made Add to Cart** - Default size (M) and color (White) now pre-selected
   - **File:** `/app/frontend/src/components/SoulMadeProductModal.jsx` (line ~76)
   - **Fix:** Auto-select 'm' size and 'White' color on modal open

5. **Dine Page Featured Restaurants** - Now shows Featured section with 2-column layout
   - **Fix:** Updated restaurant data with `featured: true` and `area` fields

6. **Refresh Button in Admin** - Now also refreshes mockup stats on AI Mockups tab
   - **File:** `/app/frontend/src/components/admin/SoulProductsManager.jsx`

7. **MASTER SYNC Enhanced** - Now includes Force Full Sync as Step 10
   - **File:** `/app/frontend/src/pages/Admin.jsx` (line ~501)
   - **New:** Cleans AI images, updates restaurants, seeds all pillar products

### ✅ New Endpoint Created:
- **POST /api/admin/force-full-sync?password=lola4304**
- Syncs ALL data to make production match preview
- Called automatically by MASTER SYNC button

### Key Files Modified This Session:
| File | Change |
|------|--------|
| `/app/frontend/src/components/ProductCard.jsx` | Mockups only for soul_made products |
| `/app/backend/server.py` | Breed exclusion filter, force-full-sync endpoint |
| `/app/frontend/src/components/SoulMadeProductModal.jsx` | Default size/color selection |
| `/app/frontend/src/pages/Admin.jsx` | MASTER SYNC Step 10 |
| `/app/frontend/src/components/admin/SoulProductsManager.jsx` | Refresh button fix |
| `/app/backend/fit_routes.py` | Fixed _id error in product seeding |

---

## SESSION 4 ACCOMPLISHMENTS (March 8, 2026)

### 🔴 CRITICAL BUG FIX:
- **$setOnInsert for mockup_url** - Prevents mockups from being wiped on deployment
- This was the bug that caused $1000+ loss

### ✅ Soul Made Products - NOW LIVE ON PRODUCTION:
- Made for Mojo (Indie) - 11/11 mockups
- Made for Mystique (Shih Tzu) - 11/11 mockups
- Made for Bruno (Labrador) - 11/11 mockups
- Made for Lola (Maltese) - 11/11 mockups
- Made for Luna/Buddy (Golden Retriever) - 11/11 mockups

### ✅ Features Completed:
1. **"Personalize & Add" Button** - Added to all Soul Made product cards
2. **Mug Color Selection** - White/Black options, White as default
3. **Pet Wrapped Soul Score** - Uses weighted scoring (89% for Mojo)
4. **Pet Wrapped Conversation Count** - Counts from live_conversation_threads (156 for Mojo)
5. **PersonalizedPicks Pet Switch** - Key prop forces remount when pet changes
6. **Product Separation** - Soul Made separate from Shopify products
7. **Breed Filtering** - Mira picks show correct breed only
8. **Pet Avatar Fix** - Custom uploaded images display correctly

### Key Files Modified:
| File | Change |
|------|--------|
| `/app/backend/scripts/generate_all_mockups.py` | $setOnInsert prevents mockup wipe |
| `/app/frontend/src/components/SoulMadeCollection.jsx` | "Personalize & Add" button |
| `/app/frontend/src/components/SoulMadeProductModal.jsx` | White mug default |
| `/app/backend/routes/wrapped/generate.py` | Weighted scoring, conversation count |
| `/app/frontend/src/pages/CelebratePage.jsx` | Key prop on SoulMadeCollection |
| `/app/frontend/src/components/PersonalizedPicks.jsx` | Key prop for pet switch |

---

## DO NOT BREAK - CRITICAL CODE

| # | What | File | Why |
|---|------|------|-----|
| 1 | **$setOnInsert for mockup_url** | `/app/backend/scripts/generate_all_mockups.py` | Prevents $1000+ mockup loss |
| 2 | **BREED_EXCLUSION_PATTERN** | `/app/backend/server.py` (~line 7085) | Keeps Soul Made separate |
| 3 | **BREED_EXCLUSION_PATTERN** | `/app/backend/app/api/top_picks_routes.py` | Filters by breed |
| 4 | **Key prop on SoulMadeCollection** | `/app/frontend/src/pages/CelebratePage.jsx` | Pet switch works |
| 5 | **Pet avatar check** | `/app/frontend/src/utils/petAvatar.js` | Custom photos work |

---

## TEST ACCOUNTS

| User | Password | Pets |
|------|----------|------|
| dipali@clubconcierge.in | test123 | Mojo, Mystique, Bruno, Lola, Luna, Buddy |
| aditya (admin) | lola4304 | Admin access |

---

## CORE PHILOSOPHY

> "A dog is not in your life. You are in theirs."

- **Mira** is the soul and brain - She remembers everything
- **Concierge** is the hands - They execute with care  
- **You** are the capillary nerves - Making it all possible

**THE GOAL:** Pet parents get so happy they want to stay and never go to another pet site because they know they get MUCH more here.

---

## 🌟 SOUL-LEVEL PERSONALIZATION (THE MOAT)

> **Strategic Vision:** Not "personalized pet products" but "objects, treats, and keepsakes shaped around who your pet really is."

### Why This Matters
| **Competitors (Huft/Supertails/Yappy)** | **The Doggy Company** |
|---|---|
| Generic products | Products that feel made *for your pet* |
| Breed illustrations only | **Soul Profile** = personality + breed + preferences |
| One cartoon style | **Soulful watercolor** + **Heirloom line art** |
| You add pet name manually | **Auto-personalized** when logged in |

### The Three-Layer Engine

#### Layer 1: Identity (Already Captured ✅)
| Data Point | Source | Status |
|------------|--------|--------|
| Pet Name | Onboarding | ✅ |
| Breed / Mix | Onboarding + AI Photo Detection | ✅ |
| Age / Birthday / Gotcha Day | Onboarding | ✅ |
| Gender | Onboarding | ✅ |
| Parent Names | User Registration | ✅ |
| City | Pet Parent Address | ✅ |

#### Layer 2: Soul (51 Questions Across 8 Pillars ✅)
| Pillar | Key Data Captured | Used For |
|--------|-------------------|----------|
| Identity & Temperament | General nature, `describe_3_words`, stranger reaction, noise sensitivity | **Archetype derivation**, copy tone |
| Family & Pack | Lives with, behavior with dogs, primary bond, attention seeking | Social recommendations |
| Rhythm & Routine | Exercise needs, separation anxiety, morning routine, sleep location | Service timing, care instructions |
| Home Comforts | Favorite spot, car comfort, crate trained, favorite item | Product recommendations |
| Travel Style | Travel readiness, hotel experience, stay preference | Trip planning |
| Taste & Treat | **Food allergies (critical!)**, food motivation, favorite protein, treat preference | Safety filtering, nutrition |
| Training & Behaviour | Energy level, behavior issues, training level, motivation type | Trainer matching |
| Long Horizon | Health conditions, vet comfort, grooming tolerance, celebration preferences | Care planning, gift suggestions |

#### Layer 3: Aesthetic (To Be Derived from Soul Data)
| Data Point | Derived From | Use Case |
|------------|--------------|----------|
| **Soul Archetype** | `describe_3_words` + temperament + energy + social behavior | Copy, recommendations, palette |
| **Illustration Style** | Default: Watercolor (user can toggle to Line Art) | Product personalization |
| **Color Palette** | Archetype-based | Product backgrounds, UI accents |
| **Typography Mood** | Archetype-based | Personalized messages |

### Soul Archetypes (Derived, Not Asked)

Archetypes are computed from existing soul data - **no new questions needed**.

| Archetype | Derived When | Shapes |
|-----------|--------------|--------|
| **The Gentle Aristocrat** | Calm + low energy + grooming loves + quiet spaces | Elegant products, refined copy |
| **The Wild Explorer** | High energy + loves travel + outdoor time | Adventure gear, bold messaging |
| **The Velcro Baby** | Separation anxiety + attached to one person + needs company | Comfort items, reassuring tone |
| **The Snack-Led Negotiator** | Very food motivated + will do anything for treats | Treat-focused recommendations |
| **The Quiet Watcher** | Cautious with strangers + indifferent + quiet spaces | Gentle introductions, calm products |
| **The Social Butterfly** | Loves all dogs + friendly with strangers + social areas | Playdate gear, party supplies |
| **The Brave Little Worrier** | Noise sensitive + anxious triggers + needs comfort | Calming products, supportive copy |

**Derivation Logic:**
```
archetype = derive_from(
  describe_3_words,           # "gentle, curious, playful"
  general_nature,             # Calm, Curious, Playful, Shy, etc.
  energy_level,               # Very high → Very low
  separation_anxiety,         # No → Severe
  stranger_reaction,          # Friendly → Protective
  behavior_with_dogs,         # Loves all → Reactive
  food_motivation,            # Very → Not very
  loud_sounds                 # Fine → Needs comfort
)
```

---

## 🛍️ PRODUCT ARCHITECTURE (SOUL-POWERED MERCHANDISING)

### The Three Tiers

#### Tier A: Soul Made ✨
**Fully personalized products driven by pet data**

| Product Type | Personalization | Example |
|--------------|-----------------|---------|
| Bowls | Name + Breed Illustration | "Mojo's Breakfast Corner" (for routine-loving pet) |
| Robes | Name + Archetype Copy | "Mojo's Safe Place Throw" (for anxious, cuddly pet) |
| Towels | Name + Breed Art | Soulful watercolor on premium cotton |
| Passport Holder | Name + Travel Archetype | "Adventure Set for Mojo" (for explorer archetype) |
| Welcome Mat | Name + Home Personality | "Mojo Lives Here" with breed illustration |
| Memorial Frame | Name + Gentle Copy | "Always Home" with remembrance ritual options |
| Celebration Kit | Name + Celebration Style | Party kit matching pet's social preference |

**Operational Rule:** Only enable Soul Made where:
- Preview can be generated cleanly
- Production is reliable
- QC is controllable
- Packaging still feels premium

#### Tier B: Soul Selected 🎯
**Curated products recommended based on Soul Profile, NOT visually customized**

| Recommendation Logic | Example |
|---------------------|---------|
| Anxious pet → Calming products | Calming toy, anxiety wrap, pheromone diffuser |
| High energy → Activity gear | Fetch toys, agility equipment, hiking gear |
| Food motivated → Treat variety | Treat sampler, puzzle feeders, snuffle mats |
| Sensitive stomach → Gentle options | Limited ingredient treats, probiotics |

This is the existing **PICKS feature** - already partially built.

#### Tier C: Soul Gifted 🎁
**Occasion-led products personalized for pet parent gifting**

| Product Type | Occasion | Example |
|--------------|----------|---------|
| Art Print | Birthday, Gotcha Day | Framed breed illustration with name |
| Mug | Dog Mum/Dad | "Proud Parent of [Mojo]" |
| Candle Sleeve | Memorial | Gentle remembrance design |
| Tote Bag | Everyday | Breed art + name |
| Memory Box | Milestones | Keepsake storage |
| Note Cards | Gifting | Personalized stationery |

---

## 🎨 ART DIRECTION

### Two Styles (Not Cutesy, Not Cartoon)

| Style | Use Cases | Mood |
|-------|-----------|------|
| **Soulful Watercolor** (Primary) | Cakes, prints, frames, celebration kits | Emotion, warmth, gift-worthiness |
| **Minimal Heirloom Line Art** (Secondary) | Tags, bowls, stationery, robes, packaging, passport holders | Elegance, subtlety, premium feel |

### Existing Breed Illustration Library ✅
- 33 breeds with soulful watercolor illustrations
- Stored in `/app/frontend/src/utils/breedIllustrations.js`
- API: `GET /api/breed-illustrations/all`
- Admin: "Breed Art" tab

### To Create: Line Art Versions
- Same 33 breeds in minimal line art style
- For products requiring subtlety

---

## 📦 EMOTIONAL COLLECTIONS (MERCHANDISING BY LIFE MOMENT)

| Collection | Products | Trigger |
|------------|----------|---------|
| **Birthday & Gotcha** | Cakes, party kits, photo frames, celebration boards | Approaching date |
| **Travel with Me** | Passport holder, carrier tag, travel bowl, blanket | Travel intent |
| **At Home** | Bowls, mats, door signs, welcome mats | New home / everyday |
| **Spa & Snuggle** | Robes, towels, blankets, grooming kits | Care pillar |
| **For Dog Mum / Dog Dad** | Mugs, totes, notebooks, prints | Gift occasions |
| **Puppy Welcome** | Welcome kits, milestone markers, first year journal | New pet registration |
| **Soul Keepsakes** | Memory boxes, paw prints, photo albums | Milestones |
| **Memorial & Remembrance** | Gentle frames, memorial candles, tribute prints | Rainbow Bridge |
| **Made from Their Soul Profile** ⭐ | Dynamic collection based on archetype | Always visible when logged in |

---

## 🖥️ THE LOGGED-IN EXPERIENCE

### What Changes When Pet Parent Logs In

**Before Login:**
> "Customize your product"

**After Login:**
> "Made for Mojo"  
> "Picked for Mojo's personality"  
> "Inspired by Mojo's Soul Profile"  
> "A little something that feels like her"

### UX Flow
1. User logs in
2. Pet profile auto-loads (or pet selector if multiple)
3. Site shows pet-specific recommendations
4. Personalizable products already preview with:
   - Pet name
   - Chosen art style (watercolor default)
   - Palette based on Soul Archetype
5. User edits message / phrase / size / format
6. Final preview shown
7. Production notes auto-created for ops

---

## 🏗️ IMPLEMENTATION ROADMAP

### Phase 1: Foundation ✅ COMPLETE
- [x] Document complete vision in PRD.md
- [x] Create Soul Archetype derivation logic (`/app/backend/soul_archetype_engine.py`)
- [x] API endpoints for archetype management (`/api/soul-archetype/*`)
- [x] Test archetype derivation with real pet data
- [x] Admin panel "Soul Products" tab with Archetypes view

### Phase 2: Product Tagging System ✅ COMPLETE
- [x] Add `soul_tier` field to products (soul_made / soul_selected / soul_gifted / standard)
- [x] API endpoints for tier management (`/api/products/soul-tier/*`)
- [x] Admin panel "Product Tiers" tab to manage tiers
- [x] Bulk tier update capability
- [x] Synced 390 Shopify products with tier field

### Phase 3: Personalization Preview Engine ✅ IN PROGRESS
- [x] Created `PersonalizationPreview.jsx` component
- [x] Pet name overlay on product images
- [x] Art style toggle (Watercolor / Line Art)
- [x] Name position options (top/center/bottom)
- [x] Download personalized preview
- [x] Created `SoulPersonalizationContext.jsx` for app-wide personalization
- [x] Added Soul Tier badges to ProductCard (card view + modal)
- [x] Name overlay shows in modal when pet is selected
- [ ] Integrate preview into main product flow
- [ ] Generate Line Art illustrations (34 breeds)

### Phase 4: Emotional Collections
- [ ] Create collection pages organized by life moment
- [ ] Build "Made from Their Soul Profile" dynamic collection
- [ ] Implement logged-in experience personalization

### Phase 5: Operations Integration
- [ ] Production notes generation from customization
- [ ] QC workflow for personalized items
- [ ] Partner integration (later)

---

## 🔌 SOUL ARCHETYPE API

### Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/soul-archetype/archetypes` | GET | Get all 7 archetype definitions |
| `/api/soul-archetype/pet/{pet_id}` | GET | Get archetype for a specific pet |
| `/api/soul-archetype/pet/{pet_id}/compute` | POST | Compute and save archetype |
| `/api/soul-archetype/compute-all` | POST | Batch compute for all pets with soul data |
| `/api/soul-archetype/recommendations/{archetype_key}` | GET | Get product recommendations for archetype |
| `/api/soul-archetype/test-derivation` | GET | Test derivation with sample data |

### Archetype Response Structure
```json
{
  "primary_archetype": "gentle_aristocrat",
  "archetype_name": "The Gentle Aristocrat",
  "archetype_emoji": "👑",
  "archetype_description": "Calm, dignified, and graceful...",
  "copy_tone": "refined, elegant, understated",
  "color_palette": ["#8B7355", "#D4C4B0", "#F5F5DC", "#E8E4E1"],
  "celebration_style": "intimate, sophisticated",
  "product_affinity": ["robes", "premium beds", "grooming kits", "elegant bowls"]
}
```

---

## 🐕 BREED ILLUSTRATION LIBRARY (CRITICAL FOR AGENTS)

### Location & Access
- **Admin Panel:** Go to "Breed Art" tab to view all 33 breed illustrations
- **API Endpoint:** `GET /api/breed-illustrations/all`
- **Frontend Utility:** `/app/frontend/src/utils/breedIllustrations.js`

### ⚠️ INSTRUCTIONS FOR FUTURE AGENTS
When creating breed-related products (cakes, keychains, mugs, mats, bandanas, etc.):

1. **ALWAYS use illustrations from the Breed Library** - Do NOT use generic/mismatched images
2. The ProductCard component automatically detects breed names and displays correct portraits
3. Visit Admin → "Breed Art" tab to copy image URLs for any breed

### Available Breeds (33 total):
- **Retrievers:** Labrador, Golden Retriever, Cocker Spaniel, Irish Setter
- **Working Dogs:** German Shepherd, Rottweiler, Doberman, Boxer, St Bernard, Great Dane, American Bully
- **Northern/Spitz:** Husky (Black/Grey), Pomeranian, Chow Chow
- **Herding:** Border Collie
- **Hounds:** Beagle, Dachshund, Italian Greyhound, Dalmatian
- **Terriers:** Jack Russell, Yorkshire, Scottish Terrier
- **Toy/Companion:** Pug, Shih Tzu, Chihuahua, Maltese, Lhasa Apso, Cavalier King Charles
- **Bulldogs:** French Bulldog, English Bulldog
- **Poodles:** Poodle, Toy Poodle, Schnoodle
- **Indian:** Indie/Desi Dog

### Breed Product Types (create for each breed):
- Birthday Cake, Party Hat, Bandana
- Keychain, Photo Frame, Mug
- Welcome Mat, Food Bowl, Collar
- Plush Toy, Treat Jar, Cozy Blanket

---

## 🎁 MILESTONE & KIT ILLUSTRATIONS

### API Endpoint: `GET /api/milestone-illustrations/all`

### Available Illustrations:
| Key | Name | Use Case |
|-----|------|----------|
| milestone_celebration | Milestone Celebration | General birthdays, achievements |
| first_birthday_kit | First Birthday Kit | Puppy's 1st birthday |
| gotcha_day_kit | Gotcha Day Kit | Adoption anniversaries |
| senior_milestone | Senior Milestone | Golden years celebrations |
| recovery_celebration | Recovery Celebration | Post-surgery/illness recovery |
| surprise_delivery | Surprise Delivery | Gift delivery moments |
| welcome_home_kit | Welcome Home Kit | New puppy welcome |
| travel_adventure_kit | Travel Adventure Kit | Travel accessories |

**Use these for:** Milestone Kit products, Surprise Delivery images, Special Occasion pages

---

## SOUL DATA FLOW ✅ VERIFIED

```
Soul Builder (51 Q) → doggy_soul_answers → Mira OS + Pet Wrapped + Picks Engine
```

### Mira Knows (from get_pet_context):
- Name, breed, age, birthday
- General nature, personality, temperament
- Morning routine, bedtime ritual
- ⚠️ ALLERGIES (critical)
- Love language, quirks
- Favorite treats, with strangers, when alone
- **REAL ORDER HISTORY** (recent purchases)

---

## 🎂 CELEBRATE PILLAR VISION

### The Goal
This should feel like planning YOUR CHILD'S birthday party - not shopping.

### Features Implemented ✅

#### P0 - Birthday Countdown Experience ✅ COMPLETE
- [x] 30 days before: Gentle nudge with purple gradient card
- [x] 14 days: "Time to plan!" banner with Plan Now button
- [x] 7 days: Excitement mode with animated sparkles
- [x] Day of: FULL TAKEOVER - confetti, celebration mode with fireworks

#### P0 - "Plan My Party" Wizard ✅ COMPLETE
- [x] Step 1: What's the occasion? [Birthday] [Gotcha Day] [Milestone] [Just Because]
- [x] Step 2: How does {pet} celebrate? [Cozy at Home] [Pawty Time] [Park Adventure] [Surprise]
- [x] Step 3: What makes {pet} happiest? [8 options: Treats, Cake, Toys, Attention, Friends, Photos, Outfit, Music]
- [x] Mira generates personalized party plan with timeline
- [x] Recommendations for cakes, treats, accessories, services

#### P1 - Memory Wall Hero ✅ COMPLETE
- [x] Polaroid-style photos from TheDoggyBakery Shopify store (real customer celebrations)
- [x] 8 celebration photos with pet names, locations, likes, captions
- [x] "Share Your Story" modal for UGC upload
- [x] "Create Album" button for post-party album

#### P1 - Cake Reveal Moment ✅ COMPLETE
- [x] CakeRevealSection component with 4 stages: Creating → Sneak Peek → Ready → Revealed
- [x] Progress bar visualization
- [x] Blurred sneak peek images before delivery
- [x] Full reveal modal with confetti
- [x] Promo card for users without cake orders

#### P2 - Post-Party Celebration Album ✅ COMPLETE
- [x] CelebrationAlbum component with photo upload (up to 10 photos)
- [x] 4 theme selections: Birthday, Gotcha, Milestone, Victory
- [x] Album stats: Photos count, Friends count, Joy Score
- [x] Share functionality with auto-generated caption
- [x] 100 Paw Points reward for sharing

---

## 🍽️ DINE PILLAR VISION

### The Goal
Feel like a personal nutritionist who knows your dog's tummy better than you do.

### Features Implemented ✅

#### P0 - "Mojo's Tummy Profile" Dashboard ✅ COMPLETE
- [x] Display: Loves, Sensitive to, Allergic to, Goal (4-section card layout)
- [x] "Safe for Mojo" badge component (`SafeForPetBadge.jsx`)
- [x] Visual dietary health indicators with color-coded sections
- [x] "Update" button linking to Soul Profile builder

#### P1 - Taste Test Feature ✅ COMPLETE
- [x] Request free sample modal (`TasteTestFeature.jsx`)
- [x] If loved → auto-subscribe & save 15% flow
- [x] If not → Mira marks product as "not for this pet"
- [x] Visual feedback states: Request → Shipping → Feedback → Result

### Features To Implement

#### P1 - Smart Subscription
- [ ] Track consumption pace
- [ ] Auto-deliver before running out
- [ ] "Never Let Mojo's Bowl Go Empty"

#### P2 - What's In Mojo's Bowl Today
- [ ] Visual bowl tracker
- [ ] Calorie/hydration tracking
- [ ] Treat allowance counter

---

## 💅 CARE PILLAR VISION

### The Goal
Feel like booking a spa day - luxurious, exciting, guilt-free.

### Features to Implement

#### P0 - Wellness Score Dashboard
- [ ] Last groom date + overdue indicator
- [ ] Coat health, nail status, dental status
- [ ] One-click "Book Spa Day"

#### P1 - Before & After Gallery
- [ ] Transformation photos from groomers
- [ ] "This could be Mojo" overlay

#### P1 - Build Spa Package
- [ ] Interactive add-ons selector
- [ ] Bundle savings display

#### P2 - Live Spa Cam
- [ ] Optional watch feature for anxious parents
- [ ] Photo updates during session

#### P2 - Post-Grooming Glamour Shot
- [ ] Professional photo auto-added to profile
- [ ] "Fresh from the spa" shareable card

---

## 🏠 STAY PILLAR VISION

### The Goal
Make parents feel SAFE leaving their babies.

### Features to Implement

#### P0 - Comfort Passport
- [ ] Sleep preferences, eating schedule, meds
- [ ] Anxiety triggers, comfort items
- [ ] Sitters see this before meeting pet

#### P1 - Meet Your Sitter Video Call
- [ ] 5-min video call before booking
- [ ] Chemistry check

#### P1 - Real-Time Stay Updates
- [ ] Photo/video updates throughout day
- [ ] "Mojo's Day" timeline

#### P2 - Separation Comfort
- [ ] Send voice message to pet
- [ ] Video of pet's reaction

#### P2 - Post-Stay Album
- [ ] Automatic photo album
- [ ] Sitter's notes
- [ ] Ready to share

---

## ✈️ TRAVEL PILLAR VISION

### The Goal
Planning a family vacation where the DOG is the VIP.

### Features to Implement

#### P0 - Mojo-Approved Destination Finder
- [ ] Based on pet preferences (beach, mountains, etc.)
- [ ] Climate/coat considerations

#### P1 - AI Trip Itinerary Builder
- [ ] Pet-friendly hotels, restaurants, activities
- [ ] "Mojo Tips" for each stop

#### P1 - Pack for Mojo Checklist
- [ ] Pre-trip reminders
- [ ] Order Travel Kit option

#### P2 - Travel Profile Card
- [ ] Digital vaccination/ID card
- [ ] QR code for hotels

---

## 🧠 ADVISORY PILLAR VISION

### The Goal
Trusted vet/trainer on speed dial.

### Features to Implement

#### P0 - Personalized Answers
- [ ] "Ask About Mojo" with context-aware responses
- [ ] Based on breed, age, history

#### P1 - Health Timeline
- [ ] Visual timeline of health events
- [ ] Upcoming reminders

#### P1 - Quick Symptom Checker
- [ ] Urgency level (Green/Yellow/Red)
- [ ] Home remedy vs vet visit recommendation

---

## CROSS-PILLAR FEATURES

### "Mojo Mode" - Everything Personalized
- [ ] "Safe for Mojo" badges everywhere
- [ ] Mojo's photo in corner
- [ ] "Other Indie parents loved..."

### Paw Points Gamification
- [ ] Earn: Profile completion, orders, reviews, referrals
- [ ] Redeem: Treats, grooming discounts, free cake

### "Never Forget" Proactive Reminders
- [ ] Food running low
- [ ] Flea prevention due
- [ ] Birthday coming up
- [ ] Vet checkup overdue

---

## WHAT'S COMPLETE

### Soul Builder ✅
### Pet Wrapped ✅
### Custom Cake Designer ✅
### Mira Intelligence ✅
### Order Flow ✅
### Emergency Flow ✅
### Farewell / Rainbow Bridge ✅
### Product Sync ✅ (390 Shopify products, properly categorized)

---

## PRODUCT CATALOGUES ✅ FIXED

- **products_master**: 390 Shopify products
- Categories properly assigned:
  - cakes: 101
  - accessories: 67
  - breed-cakes: 39
  - treats: 38
  - hampers: 34
  - dognuts: 29
  - frozen-treats: 24
  - mini-cakes: 10
  - desi-treats: 7

---

## TEST CREDENTIALS

- **User:** `dipali@clubconcierge.in` / `test123`
- **Admin:** `aditya` / `lola4304`
- **Test Pet:** Mojo (pet-mojo-7327ad56)

---

## IMPLEMENTATION PRIORITY

### Phase 1: Celebrate Pillar (Current)
1. Birthday Countdown notifications
2. Plan My Party Wizard
3. Memory Wall with UGC

### Phase 2: Dine Pillar
1. Tummy Profile Dashboard
2. Safe for Pet badges

### Phase 3: Care, Stay, Travel, Advisory

---

## CHANGELOG

### March 8, 2026 - Session 2: Cart Integration, Pet Avatar Fix, Mockup Generation

**Features Completed:**

1. **ProductDetailModal - Cart Integration ✅**
   - Wired `SoulMadeProductModal` to CartContext
   - Pet name customization, size/color selection working
   - Shows "Added to Cart" toast notification
   - Opens cart drawer automatically after adding
   - File: `/app/frontend/src/components/SoulMadeCollection.jsx`

2. **Cake Reveal Feature ✅** (Already Implemented)
   - Full customer delight workflow for custom cake orders
   - Stages: Creating → Sneak Peek → Ready → Revealed
   - Confetti celebration on final reveal
   - Backend routes: `/api/cake-reveal/*`
   - Frontend: `/app/frontend/src/components/celebrate/CakeRevealSection.jsx`

3. **Pet Avatar Fix ✅**
   - Fixed: `resolvePetAvatar()` now checks `image`, `photo_url`, `profile_image`, `avatar` fields
   - Fixed: Shih Tzu stock photo now shows correct breed image
   - File: `/app/frontend/src/utils/petAvatar.js`

4. **Mobile Pet Selector Styling ✅**
   - Fixed overlapping dog emojis in pet dashboard selector
   - File: `/app/frontend/src/pages/MemberDashboard.jsx`

5. **Pet Switching Fix ✅**
   - Added product cache clearing when user switches pets
   - Prevents stale breed products from showing
   - Enhanced debug logging for breed tracking

**Mockup Generation Status:**
- Triggered batch generation for all 33 breeds
- Currently running in background
- Check progress: `GET /api/mockups/status`

---

### March 8, 2026 - Session 1: Soul Made Product Separation Fix

**Issues Fixed:**
1. **Product mixing resolved** - Soul Made breed-specific products (mugs, bandanas, frames) are now completely separated from Shopify products (TheDoggyBakery cakes, treats)
2. **"Could not load personalized products" error fixed** - Removed `has_mockup=true` filter from SoulMadeCollection API call
3. **Breed mismatch resolved** - When user selects a pet, only that pet's breed products are shown

**Technical Changes:**
- `frontend/src/components/SoulMadeCollection.jsx`: Removed `has_mockup=true` filter to show products even without generated images
- `backend/server.py`: Added breed exclusion pattern (line 7085) to prevent Soul Made products from appearing in `/api/products` endpoint
- Generated Shih Tzu mockups (11 products) via batch generation

**Files Modified:**
- `/app/frontend/src/components/SoulMadeCollection.jsx` - Line 361
- `/app/backend/server.py` - Lines 7079-7093

**Testing Status:** ✅ All core tests passing (see `/app/test_reports/iteration_75.json`)

---

## DEPLOYMENT & DATA PERSISTENCE

> **CRITICAL:** Understanding what persists across deployments and agent sessions.

### What Persists After Deployment?

| Data Type | Persists? | Where Stored |
|-----------|-----------|--------------|
| **Mockup Images** | ✅ YES | MongoDB `breed_products.mockup_url` (Base64) |
| **User Data** | ✅ YES | MongoDB `users`, `pets` |
| **Orders** | ✅ YES | MongoDB `orders` |
| **Products (Shopify)** | ✅ YES | MongoDB `products_master` |
| **Soul Made Products** | ✅ YES | MongoDB `breed_products` (363 items) |
| **Running Processes** | ❌ NO | Server memory (stops on restart) |

### When Agent Loses Context / New Agent Starts
- ✅ Mockup generation **continues running** on server
- ✅ All database data remains intact
- ✅ Code changes persist
- ⚠️ New agent should check `/api/mockups/status`

### When Redeploying (Same Database)
- ✅ All MongoDB data persists
- ❌ **Mockup generation STOPS** (server restarts)
- ⚠️ Resume generation after: `POST /api/mockups/generate-batch`

### When Fresh Deployment (New Database)
- ❌ All data lost - need to regenerate mockups
- ✅ MasterSync auto-seeds breed_products on startup (without mockups)
- ⚠️ Trigger mockup generation manually (Admin → AI Mockups → Generate)

### Mockup Generation Commands
```bash
# Check status
curl -s "$API_URL/api/mockups/status"

# Check overall stats  
curl -s "$API_URL/api/mockups/stats"

# Resume/Start generation (all breeds)
curl -X POST "$API_URL/api/mockups/generate-batch" -H "Content-Type: application/json" -d '{"limit": 500}'

# Generate specific breed
curl -X POST "$API_URL/api/mockups/generate-batch" -H "Content-Type: application/json" -d '{"breed_filter": "indie", "limit": 11}'
```

### Time Estimates for Mockup Generation
| Scope | Products | Time | Cost |
|-------|----------|------|------|
| 1 breed | 11 | ~3 min | ~$0.50 |
| Priority breeds (3) | 33 | ~10 min | ~$1.50 |
| All breeds (33) | 363 | ~2 hours | ~$16 |

---

## FOR NEW AGENTS: Session Start Checklist

1. Read `/app/memory/PILLAR_AUDIT.md` - Feature status
2. Read `/app/memory/DEPLOYMENT_GUIDE.md` - Data persistence
3. Check mockup status: `GET /api/mockups/status`
4. Check PRD priorities (this file)

---

## KEY FILE REFERENCES

| Feature | File Path |
|---------|-----------|
| Soul Made Collection | `/app/frontend/src/components/SoulMadeCollection.jsx` |
| Soul Made Product Modal | `/app/frontend/src/components/SoulMadeProductModal.jsx` |
| Pet Avatar Utility | `/app/frontend/src/utils/petAvatar.js` |
| Cake Reveal Section | `/app/frontend/src/components/celebrate/CakeRevealSection.jsx` |
| Cake Reveal API | `/app/backend/app/api/cake_reveal_routes.py` |
| Mockup Generation | `/app/backend/app/api/mockup_routes.py` |
| Product Seeding | `/app/backend/scripts/seed_products.py` |
| Member Dashboard | `/app/frontend/src/pages/MemberDashboard.jsx` |
| Celebrate Page | `/app/frontend/src/pages/CelebratePage.jsx` |

---

*"No one knows your pet better than Mira."*

# The Doggy Company® — Pet Life Operating System
## Product Requirements Document
## Version 13.9.0 | March 13, 2026 (Session 2)

---

## THE VISION
> "We are not a commerce platform. We are a Pet Operating System. The Soul comes first."

The world's first soul-driven Pet Operating System. Every dog has a personality, lifestyle, health story, and emotional world — the Soul. The platform captures this soul and uses it to power every recommendation, every Mira response, and every concierge interaction.

**200+ days built. 22,232 lines in server.py. 221 API endpoints. 51 Soul Questions. 14 Pillars.**

---

## ✅ CELEBRATE PAGE — SOUL-FIRST REDESIGN (COMPLETE, March 2026)

### Route: `/celebrate-soul` (will replace `/celebrate` once approved by Aditya)

**8-Section Page Architecture:**
1. **CelebrateHero** — Pet photo (via `pet.photo_url`) + gradient avatar ring + Soul % chip + soul chips (Allergy, Loves, Personality) + Mira quote
2. **CategoryStrip** — Horizontally scrollable, 72px height, 7+ categories, opens modals
3. **SoulCelebrationPillars** — 8 pillar cards (2x4 grid), spec-compliant colors, 3 states (Glow/Dim/Incomplete)
4. **MiraAskBar** — Below pillars, minimal (no text), opens Mira widget on click
5. **MiraCuratedBox** — "The {PetName} Birthday Box" — dynamic items + CTAs to `/occasion-box`
6. **CelebrateConcierge** — Flat `#0E0620` bg + "Browse Celebrate Catalogue" opens drawer with:
   - Celebrate tab: Real Shopify/Doggy Bakery cakes with illustrations
   - Personalised tab: Celebrate bundles with Cloudinary illustrations
7. **GuidedCelebrationPaths** — 3 structured paths (Birthday, Gotcha Day, Photoshoot)
8. **CelebrationMemoryWall** — Community celebration gallery

**Design Tokens (CRITICAL — DO NOT CHANGE):**
- Hero bg: `linear-gradient(135deg, #1a0020 0%, #3d0060 40%, #6b0099 75%, #9b0cbf 100%)`
- Birthday Box bg: `linear-gradient(135deg, #1a0020, #3d0060)` (dark gradient)
- Concierge bg: `#0E0620` (FLAT — NOT gradient!)
- Concierge CTA: `linear-gradient(135deg, #C9973A, #F0C060)` (gold)
- Birthday Box CTA: `linear-gradient(135deg, #C44DFF, #FF6B9D)` (purple-pink)
- Pet photo field: `pet?.photo_url || pet?.image_url`

**Data Sources:**
- Cakes: `/api/products?category=cakes` (Shopify = The Doggy Bakery with beautiful illustrations)
- Bundles: `/api/celebrate/bundles` (Cloudinary illustrations)
- Pillar products: `/api/products?category={pillar-mapping}` per pillar + `/api/celebrate/products?category=X`

---

## CORE SYSTEM OVERVIEW

### 1. The Pet Soul (The Heart of Everything)
- **51 questions across 8 soul folders**: Identity & Temperament, Family & Pack, Rhythm & Routine, Home Comforts, Travel Style, Taste & Treats, Training & Behaviour, Long Horizon
- **Soul Score / SoulScoreArc** — visual completeness score shown on every pillar hero
- **Auto-enrichment** — learns from orders, bookings, conversations
- **Drip questioning** — progressive profiling, 1 question at a time
- **Soul Intelligence** — feeds Mira context, product recommendations, personalisation
- **Backend**: `pet_soul_routes.py`, `soul_intelligence.py`, `mira_soulful_brain.py`, `pet_score_logic.py`

#### COMPLETE PET SOUL DATA STRUCTURE (for personalization):
```
Identity: name, species, breed, sex, size_class, coat_type, birth_date, gotcha_date
Soul Profile: soul_score, overall_score, score_tier, soul_archetype (primary_archetype, archetype_name, archetype_emoji, celebration_style, product_affinity), folder_scores, category_scores
Personality: doggy_soul_answers (describe_3_words, general_nature, stranger_reaction, loud_sounds, social_preference, handling_comfort, behavior_with_dogs)
Preferences: favorite_treats, favorite_flavors, dislikes, diet_type, activity_level, favorites, soul_knowledge
Health: allergies, sensitivities, chronic_conditions, current_medications, vaccination_status, vet_name, vet_clinic
Social: relationships (dog_friends, human_favorites, pet_sitter)
History: service_history (last_grooming, grooming_preference, travel_history), milestones (gotcha_day, achievements), celebrations, pillar_interactions
Mira Knowledge: conversation_memories, conversation_insights, learned_facts (loves, prefers, allergies)
Travel: preferred_transport, crate_trained
```

### 2. Mira — The OS Voice
- **6+ variants**: Mira OS (/mira-os, members-only), Mira Pure (/mira-pure, public), Mira Pure OS, Mira Demo, Mira Original, Mira Pillar Sandbox
- **Capabilities**: Soul-aware responses, streaming, session persistence, ElevenLabs TTS voice, service ticket creation, concierge handoff, context per pillar
- **Ask Mira Bar** — embedded at top of ALL 14 pillars, context-aware
- **Floating Mira Widget** — bottom-right on all pages (open via `window.dispatchEvent(new CustomEvent('openMiraAI', {detail:{message,context}}))`)
- **Backend**: `mira_os.py`, `mira_pure.py`, `mira_soulful_brain.py`, `mira_service_desk.py`, `mira_retention.py`, `mira_concierge_handoff.py`

### 3. Service Desk — Concierge Engine
- Full ticket lifecycle (create → assign → resolve → NPS)
- Priority scoring, SLA breach detection, ticket merging, escalation
- AI-generated draft replies, canned responses, sentiment analysis
- WhatsApp notifications on status changes

---

## ACTIVE FEATURE BACKLOG

### P0 — IN PROGRESS / NEXT UP
| Feature | Status | Notes |
|---------|--------|-------|
| Make /celebrate-soul the live /celebrate | PENDING APPROVAL | Once Aditya approves, swap route |
| Standardize other pillars to soul-first | UPCOMING | Dine, Stay, Learn should follow same architecture |

### P1 — PLANNED
| Feature | Notes |
|---------|-------|
| CMS Audit for /celebrate | Ensure all text sections on new /celebrate are admin-editable |
| Apply soul-first template to /dine | Use celebrate template as base |

### P2 — PLANNED
| Feature | Notes |
|---------|-------|
| Allergy filtering in Concierge drawer | Currently shows allergy warning, could filter products |
| Add more Doggy Bakery product categories | Breed cakes, pupcakes (when more Shopify categories available) |

### P3 — BACKLOG
| Feature | Notes |
|---------|-------|
| Fix Razorpay checkout failure | Payment integration bug |
| Fix scrambled mobile pet dashboard | Mobile layout issue |
| Fix Admin Product Editor Image Upload Bug | File upload component |

---

## FILE STRUCTURE

### New Celebrate Page Components
```
/app/frontend/src/
├── App.js                           # /celebrate-soul route → CelebratePageNew
├── pages/
│   ├── CelebratePageNew.jsx         # NEW soul-first page
│   └── CelebratePage.jsx            # ORIGINAL (still live at /celebrate)
└── components/
    └── celebrate/
        ├── index.js                 # Export index
        ├── CelebrateHero.jsx        # Hero: pet photo + soul chips + Mira quote
        ├── CelebrateCategoryStrip.jsx # Horizontal strip (7+ categories)
        ├── SoulCelebrationPillars.jsx # 8 pillar cards (glow/dim/incomplete)
        ├── SoulPillarExpanded.jsx   # Expanded view: tabs + real Shopify products
        ├── MiraCuratedBox.jsx       # Birthday Box with CTAs
        ├── CelebrateConcierge.jsx   # Dark section + catalogue drawer
        ├── GuidedCelebrationPaths.jsx # 3 paths
        ├── CelebrationMemoryWall.jsx  # Community wall
        └── CelebrateContentModal.jsx  # Category modal
```

### Backend (Celebrate-related)
```
/app/backend/
├── celebrate_routes.py              # /api/celebrate/* endpoints
└── server.py                        # Main server (includes celebrate endpoints)
```

---

## KEY API ENDPOINTS

### Celebrate Page
```
GET /api/celebrate/products?category={X}&limit=16   # TDB products (Shopify)
GET /api/celebrate/bundles                           # 6 bundles with Cloudinary images
GET /api/products?category={X}&limit=12             # All Shopify products (includes cakes)
GET /api/celebrate/partners?city={city}             # Local celebrate partners
```

### Pet Soul
```
GET /api/pets/{pet_id}                  # Full pet data including soul
GET /api/pet-photo/{pet_id}             # Pet photo (returns image)
POST /api/pets/{pet_id}/soul-answers    # Update soul answers
GET /api/pets/{pet_id}/soul-score       # Get soul score
```

---

## TEST CREDENTIALS
- User: `dipali@clubconcierge.in` / `test123` (Mojo = 89% soul, chicken allergy)
- Admin: `aditya` / `lola4304`

---

## TECHNICAL NOTES
- `pet.photo_url` is the primary field for pet photos (NOT `pet.image`)
- `pet.doggy_soul_answers.food_allergies` stores allergy data (can be string or array)
- `pet.favorites` is an array of objects (use `.name` or `.value` to extract strings)
- Mira widget: `window.dispatchEvent(new CustomEvent('openMiraAI', { detail: { message, context: 'celebrate' } }))`
- Add to cart: `window.dispatchEvent(new CustomEvent('addToCart', { detail: product }))`
- Hot reload active: code changes are auto-applied without supervisor restart
- Only restart supervisor when changing `.env` or installing new packages

# SESSION 9 - COMPLETE HANDOVER DOCUMENT
## February 22, 2026

---

# EXECUTIVE SUMMARY

This session focused on implementing **pillar-specific picks** for the `/celebrate` page and laying the groundwork for the **Intelligence Layer** - the system that makes Mira's recommendations truly personalized per pet.

**What Was Completed:**
1. FAB modal now shows ONLY the current pillar (Celebrate) - no more Dine/Care/Travel tabs
2. Pet switching is now synced via PillarContext
3. Service Card Library created for Celebrate pillar (8 services)
4. Architecture defined for Dynamic Curated Picks system

**What's In Progress:**
- Building the curated product selection with safety filters
- Building the cached curated-set API
- Implementing the "Mira asks" micro-question flow

---

# PART 1: WHAT WAS BUILT (COMPLETED)

## 1.1 Pillar-Specific FAB Modal

### The Problem
When on `/celebrate` page and clicking "Ask Mira" FAB or "Mystique's Picks", the panel showed ALL pillar tabs (Dine, Care, Travel, Stay, Enjoy, etc.) - confusing users who were already in celebrate context.

### The Solution
Modified `PersonalizedPicksPanel.jsx` to accept a `pillar` prop that LOCKS the panel to show only that pillar.

### Files Modified

**`/app/frontend/src/components/Mira/PersonalizedPicksPanel.jsx`**
```javascript
// NEW: Added pillar prop for single-pillar mode
const PersonalizedPicksPanel = ({
  pillar = null,  // If set, locks to this pillar
  // ... other props
}) => {
  const isPillarLocked = Boolean(pillar);
  
  // Filter pillars to show only locked pillar or all
  const displayPillars = isPillarLocked 
    ? PILLARS.filter(p => p.id === pillar)
    : PILLARS;
  
  // Prevent tab switching when locked
  useEffect(() => {
    if (isPillarLocked) {
      setActivePillar(pillar);
    }
  }, [isPillarLocked, pillar]);
}
```

**`/app/frontend/src/components/MiraChatWidget.jsx`**
```javascript
// Now passes pillar prop to lock the panel
<PersonalizedPicksPanel
  pillar={pillar}  // Lock to current pillar
  enginePillar={pillar}
  // ...
/>
```

**`/app/frontend/src/pages/CelebratePage.jsx`**
```javascript
// Now uses PillarContext for pet syncing
import { usePillarContext } from '../context/PillarContext';

const CelebratePage = () => {
  const { currentPet } = usePillarContext();
  const activePet = currentPet;  // Syncs with global pet selector
  // ...
}
```

---

## 1.2 Concierge Pick Card with Full Picks

### The Problem
The Concierge Pick card on the page showed only tiny icons - not enough information for users to understand what they'd get.

### The Solution
Updated `ConciergePickCard.jsx` to show full pick cards with icon, name, description, and "Create for {Pet}" button.

### File Modified

**`/app/frontend/src/components/ConciergePickCard.jsx`**
- Title changed to "Mira's Picks for {Pet}" (pet-first)
- Shows horizontal scroll of full pick cards
- Each card has: icon, name, description, "Concierge creates" label, CTA button
- Accepts `miniPicks` prop for dynamic data from API

---

## 1.3 Pet Switching Now Synced

### The Problem
When switching pets via navbar dropdown, the Concierge card still showed the old pet name.

### The Solution
Changed `CelebratePage.jsx` to use `usePillarContext()` instead of local state.

### How It Works Now
1. User switches pet in navbar → `PillarContext.currentPet` updates
2. `CelebratePage` reads `currentPet` from context
3. All components using `activePet` automatically update
4. Dynamic picks re-fetch for the new pet

---

## 1.4 Service Card Library Created

### File Created

**`/app/backend/app/data/service_cards.py`**

Contains 8 services for Celebrate pillar:

| Service ID | Name | Best For |
|------------|------|----------|
| `plan-celebration-end-to-end` | Plan the Celebration End-to-End | All pets (signature) |
| `custom-cake-design` | Custom Cake Design | Elegant pets, breed silhouette lovers |
| `at-home-party-setup` | At-Home Party Setup | Shy/anxious pets, small dogs |
| `pet-photographer-shoot` | Pet Photographer + Shoot | Photo-ready pets, elegant dogs |
| `pet-friendly-venue` | Pet-Friendly Venue | Social/friendly pets, large dogs |
| `playdate-party` | Playdate Party | Playful/energetic pets, social dogs |
| `surprise-moment` | Surprise Moment Orchestration | All pets |
| `quiet-celebration` | Quiet Celebration Plan | Anxious/shy pets, seniors |

Each service includes:
- Display metadata (name, icon, description)
- Questions Mira asks to build the ticket
- Persona fit scores for matching to pet soul traits
- Breed boosts and size boosts
- Tags (popular, signature, thoughtful)

### Service Selection Function
```python
def get_celebrate_services_for_pet(pet_data, intent_context, limit=3):
    """
    Select best 2-3 services based on:
    - Soul traits match (30 points per trait)
    - Breed boost (20 points)
    - Size boost (15 points)
    - Intent context boost (25 points)
    - Popular tag boost (5 points)
    """
```

---

# PART 2: ARCHITECTURE DEFINED (IN PROGRESS)

## 2.1 The Core Concept: "Dynamic but Synced"

### What We DON'T Want
- ❌ Same picks for all pets (static)
- ❌ Each UI component generating its own picks (inconsistent)
- ❌ Three different pick lists showing for the same pet/context

### What We DO Want
- ✅ Single "Curated Picks Set" per `pet + pillar + intent + moment`
- ✅ ALL UI surfaces read from this SAME set
- ✅ Set refreshes on triggers but stays consistent across surfaces

---

## 2.2 Cache Key Structure

```
curated_picks:{pet_id}:{pillar}:{intent_context}:{timestamp_bucket}
```

**Examples:**
- `curated_picks:mystique_123:celebrate:birthday:2026022214`
- `curated_picks:buddy_456:celebrate:playdate:2026022214`
- `curated_picks:mystique_123:celebrate:general:2026022214`

---

## 2.3 Data Model (MongoDB Collection: `curated_picks_cache`)

```javascript
{
  _id: "curated_picks:mystique_123:celebrate:birthday:2026022214",
  pet_id: "mystique_123",
  pillar: "celebrate",
  intent_context: "birthday",
  
  // The actual picks
  picks: {
    services: [  // 2-3 items → Create tickets
      { 
        id: "custom-cake-design", 
        name: "Custom Cake Design", 
        icon: "🎂",
        why: "Mystique's elegant vibe calls for a minimalist design" 
      },
      { 
        id: "quiet-celebration", 
        name: "Quiet Celebration Plan", 
        icon: "🤫",
        why: "She warms up slowly - we'll keep it calm" 
      }
    ],
    products: [  // 4-6 items → Add to cart
      { 
        id: "mini-cake-shihTzu", 
        name: "Shih Tzu Face Mini Cake", 
        price: 899,
        why: "Perfect portion for her size" 
      },
      // ... more products
    ],
    mira_asks: null  // or { question, options } if data is thin
  },
  
  // Metadata (ephemeral, NOT pet knowledge)
  generated_at: ISODate("2026-02-22T14:30:00Z"),
  expires_at: ISODate("2026-02-22T15:00:00Z"),  // 30 min TTL
  
  // Why these picks (for debugging)
  based_on: {
    soul_traits: ["elegant", "warms_up_slowly"],
    breed: "Shih Tzu",
    size: "small",
    allergies: ["grain"],
    event_proximity: { birthday_in_days: 12 }
  },
  
  triggered_by: "pillar_page_load"
}
```

---

## 2.4 Refresh Triggers

| Trigger Type | Scope | Example |
|--------------|-------|---------|
| **Intent change** | Active pillar only | User clicks "Birthday Cakes" → refresh celebrate |
| **Soul update** | Active pillar only | New trait added → refresh current pillar |
| **Global change** | ALL pillars | New allergy → invalidate ALL cached sets for this pet |
| **TTL expired** | Active pillar only | 30 min passed → regenerate on next request |
| **Order/Ticket** | Active pillar only | Order placed → refresh to remove ordered items |

---

## 2.5 Content Distribution Per Set

| Category | Count | Details |
|----------|-------|---------|
| **Products** | 5-6 | From existing `unified_products` collection |
| - Cake + Treats | 2 | Birthday cake, pupcakes, treat bundle |
| - Décor + Photo | 2 | Party kit, photo props, backdrop |
| - Keepsake + Add-ons | 1-2 | Pawprint kit, gift wrap |
| **Services** | 2-3 | From Service Card Library |
| **Mira Asks** | 0-1 | Only if data is thin |
| **TOTAL** | 7-10 | Sweet spot: curated, not catalogue |

---

## 2.6 Allergy Filtering (CRITICAL)

**Rule: REPLACE, don't warn.**

```python
def get_curated_products(pet, pillar, intent):
    # 1. FIRST: Filter out unsafe products
    products = db.unified_products.find({"pillar": pillar})
    
    if pet.allergies:
        products = [p for p in products 
                    if not contains_allergen(p, pet.allergies)]
    
    # 2. THEN: Score and bucket
    # ... rest of logic
```

Unsafe items are NEVER shown unless user explicitly overrides.

---

## 2.7 Fallback When Data Is Thin

**If soul is < 50% complete:**

1. Show breed/size-based defaults immediately
2. Include ONE "Mira asks" card:
   ```
   ┌────────────────────────────────────┐
   │ 💡 Make this more "Buddy"?        │
   │                                    │
   │ [ Playful & Active ] [ Calm & Chill ] │
   └────────────────────────────────────┘
   ```
3. User taps choice →
   - Save to pet preferences (permanent)
   - Apply to session intent (immediate)
   - Rerank picks instantly

---

## 2.8 API Endpoint Design

```
GET /api/mira/curated-set/{pet_id}/{pillar}
```

**Query Parameters:**
- `intent` - Intent context (birthday, playdate, general)
- `subcategory` - Active subcategory (cakes, decor, keepsakes)
- `event` - Event type (birthday, gotcha_day, party)

**Response:**
```json
{
  "picks": {
    "services": [...],
    "products": [...],
    "mira_asks": null
  },
  "expires_at": "2026-02-22T15:00:00Z",
  "cache_key": "curated_picks:mystique_123:celebrate:birthday:2026022214",
  "based_on": {
    "soul_traits": ["elegant", "warms_up_slowly"],
    "breed": "Shih Tzu",
    "allergies": ["grain"]
  }
}
```

**Called by:**
- Pillar page curated section ✓
- Mira FAB "Mystique's Picks" ✓
- Concierge picks component ✓

**All read from the SAME cached set.**

---

# PART 3: BUDDY VS MYSTIQUE (CONCRETE EXAMPLES)

## Mystique (Shih Tzu, Elegant, Warms Up Slowly)

### Products Selected
| Product | Why |
|---------|-----|
| Shih Tzu Face Mini Cake | Breed silhouette, small portion |
| Gourmet Biscuit Tin | Elegant packaging, classy treats |
| Elegant Celebration Box | Muted décor, satin bow, photo-ready |
| Polaroid Photo Frame | Keepsake, matches elegant vibe |
| Gift Wrap Add-on | Premium presentation |

### Services Selected
| Service | Why |
|---------|-----|
| Custom Cake Design | High persona fit for "elegant" |
| Quiet Celebration Plan | Perfect for "warms up slowly" |
| Pet Photographer | Indoor styled shoot, calm session |

---

## Buddy (Golden Retriever, Playful, Energetic)

### Products Selected
| Product | Why |
|---------|-----|
| Big-Bite Birthday Cake | Large portion, protein-forward |
| Training + Party Treats Bundle | Active dog needs rewards |
| Playful Party Box | Bright bunting, squeaky toys |
| Outdoor Party Kit | Durable, mess-friendly |
| Age Number Sign | Fun photo moment |

### Services Selected
| Service | Why |
|---------|-----|
| Playdate Party | High persona fit for "playful", "social" |
| Plan Celebration End-to-End | Works for all, signature service |
| Pet Photographer | Outdoor action shots, golden hour |

---

# PART 4: FILES REFERENCE

## Files Created This Session

| File | Purpose |
|------|---------|
| `/app/backend/app/data/service_cards.py` | Service Card Library for Celebrate (8 services) |

## Files Modified This Session

| File | Changes |
|------|---------|
| `/app/frontend/src/components/Mira/PersonalizedPicksPanel.jsx` | Added `pillar` prop for single-pillar mode |
| `/app/frontend/src/components/MiraChatWidget.jsx` | Passes `pillar` prop to lock panel |
| `/app/frontend/src/components/ConciergePickCard.jsx` | Full pick cards, dynamic data, pet-first title |
| `/app/frontend/src/pages/CelebratePage.jsx` | Uses `usePillarContext()` for pet sync |
| `/app/memory/PRD.md` | Updated with session progress |

## Files To Be Created (Next Steps)

| File | Purpose |
|------|---------|
| `/app/backend/app/api/curated_picks.py` | Curated Picks API endpoint |
| `/app/backend/app/services/product_curator.py` | Product selection with safety filters |
| `/app/backend/app/services/picks_cache.py` | Cache management with TTL |

---

# PART 5: NEXT STEPS (BUILD SEQUENCE)

## Phase 1: Product Selection Engine (Next)
```python
# /app/backend/app/services/product_curator.py
def get_curated_products(pet, pillar, intent_context, limit=6):
    # 1. Get all products for pillar
    # 2. FILTER: Remove allergens (FIRST, before anything)
    # 3. SCORE: Rank by pet fit
    # 4. BUCKET: Fill 3 buckets (cake+treats, decor+photo, keepsake+addons)
    # 5. Return 5-6 products with "why" explanations
```

## Phase 2: Curated Set API
```python
# /app/backend/app/api/curated_picks.py
@router.get("/curated-set/{pet_id}/{pillar}")
def get_curated_set(pet_id, pillar, intent, subcategory, event):
    # 1. Check cache (MongoDB) for valid set
    # 2. If expired or missing, generate new set
    # 3. Combine: services (2-3) + products (5-6) + mira_asks (0-1)
    # 4. Cache with 30-min TTL
    # 5. Return unified set
```

## Phase 3: Frontend Integration
- Update `CelebratePage.jsx` to call `/api/mira/curated-set`
- Update `MiraChatWidget.jsx` to use same endpoint
- Ensure both show SAME cached set

## Phase 4: Mira Asks Flow
- Implement micro-question card
- Save response to pet preferences + session intent
- Trigger immediate rerank

---

# PART 6: TEST CREDENTIALS

| Account | Email | Password |
|---------|-------|----------|
| Member | `dipali@clubconcierge.in` | `test123` |
| Admin | `aditya` | `lola4304` |

---

# PART 7: CRITICAL RULES (DON'T FORGET)

1. **Allergy filtering happens FIRST** - Before scoring, before bucketing. Always.

2. **Same set across all surfaces** - Pillar page and Mira FAB must show identical picks for same pet/pillar/intent.

3. **30-minute validity** - Don't regenerate on every request. Cache it.

4. **Intent context is first-class** - Include subcategory, event, last_action in cache key.

5. **Services are NOT products** - Don't force them into product catalogue. Use Service Card Library.

6. **Fallback to breed/size** - If soul is thin, use defaults immediately. Don't block behind "complete profile."

7. **Replace, don't warn** - Unsafe items are excluded, not shown with warnings.

---

# PART 8: ONE-LINER FOR NEXT AGENT

> "Curated Picks must be generated dynamically per pet + pillar + intent and evolve as Mira learns. But at any given time, all UI surfaces must read the same current curated set for that pet/context (pillar page and Mira FAB cannot generate separate lists). Use refresh triggers + a 30-minute validity window so picks stay consistent yet keep evolving. Service Card Library is done for Celebrate. Next: build product curator with safety filters, then the cached curated-set API."

---

*Handover Document Created: February 22, 2026*
*Session Duration: ~3 hours*
*Status: In Progress - Phase 1 complete, Phases 2-4 pending*

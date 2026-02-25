# Mira Pet OS - Product Requirements Document (SSOT)
## Single Source of Truth - Last Updated: February 24, 2026

---

## ORIGINAL PROBLEM STATEMENT

**Mira** is a "pet operating system" centered around **Soul Intelligence** (a pet personality system) and an AI concierge. The goal is to move beyond standard e-commerce and create a high-touch, personalized experience where curated recommendations for products and services are dynamically generated based on a pet's unique soul profile.

**Core Vision**: "Mira is the Soul, the Concierge controls the experience, and the System is the capillary enabler."

**Key Principle**: Every concierge action must create a service desk ticket and trigger real-time notifications, capturing user intent and enabling a premium, consultative service model.

**Voice Configuration**: ElevenLabs Eloise (British English) with OpenAI TTS backup

---

## ✅ WHAT'S ALREADY BUILT

### CORE PLATFORM
| Feature | Status | Files |
|---------|--------|-------|
| Soul Intelligence System | ✅ COMPLETE | `canonical_answers.py`, `pet_score_logic.py` |
| Soul Score Engine (0-100%) | ✅ COMPLETE | `soul_first_logic.py` |
| Cross-pillar Memory | ✅ COMPLETE | `MiraChatWidget.jsx` |
| Multi-Pet Support | ✅ COMPLETE | `server.py` |

### MIRA AI ASSISTANT
| Feature | Status | Files |
|---------|--------|-------|
| Mira Chat Widget | ✅ COMPLETE | `MiraChatWidget.jsx` |
| Mira = Soul Mate Identity | ✅ COMPLETE | `MiraChatWidget.jsx` |
| Voice Input (ElevenLabs) | ✅ COMPLETE | `mira_voice.py` |
| Voice Output (TTS) | ✅ COMPLETE | `tts_routes.py` |
| Picks → Chat Flow | ✅ COMPLETE | `PersonalizedPicksPanel.jsx` |
| Soul-First Intelligence | ✅ COMPLETE | `mira_intelligence.py` |
| Quick Actions | ✅ COMPLETE | `MiraChatWidget.jsx` |

### REMINDER & NOTIFICATION SYSTEM
| Feature | Status | Files |
|---------|--------|-------|
| **Birthday Engine** | ✅ COMPLETE | `birthday_engine.py` |
| **Celebration Reminders** | ✅ COMPLETE | `server.py` (line 376+) |
| **Pet Pass Renewal Reminders** | ✅ COMPLETE | `renewal_reminders.py` |
| **Abandoned Cart Reminders** | ✅ COMPLETE | `cart_routes.py` |
| **Proactive Notifications** | ✅ COMPLETE | `proactive_notifications.py`, `mira_proactive.py` |
| **Push Notifications** | ✅ COMPLETE | `push_notification_routes.py` |
| **Notification Engine** | ✅ COMPLETE | `notification_engine.py` |
| **Realtime Notifications** | ✅ COMPLETE | `realtime_notifications.py` |
| **Mira Notifications** | ✅ COMPLETE | `mira_notifications.py` |

### SERVICE DESK & TICKETS
| Feature | Status | Files |
|---------|--------|-------|
| Universal Service Command | ✅ COMPLETE | `useUniversalServiceCommand.js` |
| Ticket Creation API | ✅ COMPLETE | `ticket_routes.py` |
| Ticket Intelligence | ✅ COMPLETE | `ticket_intelligence.py` |
| Admin Ticket Management | ✅ COMPLETE | Admin Dashboard |

### 13 PILLARS
| Pillar | Status | Route File |
|--------|--------|------------|
| Dine | ✅ GOLD STANDARD | `dine_routes.py` |
| Celebrate | ✅ GOLD STANDARD | `celebrate_routes.py` |
| Care | ✅ BUILT | `care_routes.py` |
| Stay | ✅ BUILT | `stay_routes.py` |
| Travel | ✅ BUILT | `travel_routes.py` |
| Learn | ✅ BUILT | `learn_os_routes.py` |
| Shop | ✅ BUILT | `shop_routes.py` |
| Play | ✅ BUILT | Backend |
| Adopt | ✅ BUILT | `adopt_routes.py` |
| Fit | ✅ BUILT | `fit_routes.py` |
| Enjoy | ✅ BUILT | `enjoy_routes.py` |
| Farewell | ✅ BUILT | `farewell_routes.py` |
| Emergency | ✅ BUILT | `emergency_routes.py` |

### ADMIN SYSTEM
| Feature | Status | Location |
|---------|--------|----------|
| Dashboard | ✅ COMPLETE | `/admin` |
| Members & Pets | ✅ COMPLETE | Admin |
| Reminders Management | ✅ COMPLETE | Admin > Mira & AI > Reminders |
| Communications | ✅ COMPLETE | Admin > Mira & AI > Communications |
| Proactive Campaigns | ✅ COMPLETE | Admin > Marketing > Proactive |
| Push Notifications | ✅ COMPLETE | Admin > Marketing > Push |

### UI/UX
| Feature | Status | Files |
|---------|--------|-------|
| Gold Standard Design | ✅ COMPLETE | `gold-standard.css` |
| Glassmorphism | ✅ COMPLETE | CSS |
| Bento Grid | ✅ COMPLETE | CSS |
| Haptic Feedback | ✅ COMPLETE | JS |

---

## 🔒 LOCKED ARCHITECTURAL DECISIONS (Feb 24, 2026)

These decisions are **FINAL** and must not be changed without explicit user approval.

### PILLAR DEFINITIONS

| Pillar | One-Liner | User Intent |
|--------|-----------|-------------|
| **CARE** | Support and caregiving | "My pet needs care/help" |
| **FIT** | Activity and improvement | "My pet needs activity/improvement" |
| **STAY** | Travel accommodation | "Where can my pet stay during travel?" |

### CARE OWNS (8 Top-Level Categories)

| ID | Label | Description |
|----|-------|-------------|
| `grooming` | Grooming | Hygiene, coat care, bath, nail trim |
| `vet_clinic_booking` | Vet Visits & Clinic Booking | Clinic discovery, booking & follow-up coordination |
| `boarding_daycare` | Boarding & Daycare | Overnight boarding + daytime supervision |
| `pet_sitting` | Pet Sitting | In-home care, feeding, companionship |
| `behavior_anxiety_support` | Behavior & Anxiety Support | Fear, stress, grooming/vet anxiety |
| `senior_special_needs_support` | Senior & Special Needs Support | Comfort, mobility, special handling |
| `nutrition_consult_booking` | Nutrition Consult Booking | Diet consults, allergy support booking |
| `emergency_help` | Emergency Help | Urgent care routing & coordination |

**Subtypes under `vet_clinic_booking`:**
- Clinic Visit Booking
- Preventive Care Appointment
- Diagnostics & Test Booking
- Follow-up Appointment Coordination
- Recovery Support Coordination
- Let Mira Recommend a Clinic

### FIT OWNS

| Category | Description |
|----------|-------------|
| Walk | Daily walks, energy release |
| Training & Skills | Obedience, behavior training, habit-building |
| Fitness & Conditioning | Weight programs, stamina, strength |
| Weight Activity Plans | Exercise routines for weight management |
| Play & Enrichment | Mental + physical stimulation |
| Agility | Performance, coordination training |
| Puppy Activity & Socialization | Movement, routine, confidence |
| Senior Mobility & Gentle Fitness | Maintenance movement (routed from Fit) |
| Swimming / Activity Sessions | Exercise and conditioning |

### STAY OWNS

| Category | Description |
|----------|-------------|
| Pet-friendly travel stays | Hotels, resorts with pet access |
| Vacation stays | Holiday accommodations |
| Travel accommodation planning | Trip planning assistance |

### WHAT MOVED WHERE

| From | To | Items |
|------|-----|-------|
| Care → Fit | Walk, Training |
| Stay → Care | Boarding, Daycare, Pet Sitting |
| Care → Separate | Behavior Training (Fit) vs Behavior Support (Care) |

### TransformationStories - Pillar-Aware

- **Care stories**: Grooming recovery, vet support, senior support, boarding reassurance, post-op care, anxiety-sensitive grooming
- **Fit stories**: Weight progress, training wins, agility confidence, puppy routines, mobility improvement

### Concierge-Safe Language Rules

| ❌ Avoid | ✅ Use Instead |
|----------|----------------|
| "Vet & Health" | "Vet Visits & Clinic Booking" |
| "Nutrition Guidance" | "Nutrition Consult Booking" |
| "Medical advice" | "Coordination/booking/support" |
| "Emergency treatment" | "Urgent care routing & coordination" |

---

## CURRENT SESSION WORK (Feb 24-25, 2026)

### COMPLETED TODAY (Feb 25, 2026)
| Task | Status |
|------|--------|
| **🎯 COMPREHENSIVE CARE PRODUCT TAXONOMY** | ✅ COMPLETE |
| Created care_products_master.py with full taxonomy | ✅ DONE |
| 18 Care Products seeded with comprehensive tags | ✅ DONE |
| 12 Care Bundles seeded with comprehensive tags | ✅ DONE |
| Size tags: xs, small, medium, large, xl | ✅ DONE |
| Coat tags: short_coat, long_coat, double_coat, curly_coat, low_shed, high_shed | ✅ DONE |
| Life stage tags: puppy, adult, senior | ✅ DONE |
| Temperament tags: calm, anxious, reactive, grooming_nervous, vet_nervous, first_time_boarding | ✅ DONE |
| Intent tags: grooming, vet_clinic_booking, boarding_daycare, pet_sitting, behavior_anxiety_support, senior_special_needs_support, nutrition_consult_booking, emergency_help, recovery_support_coordination | ✅ DONE |
| **Admin CareManager.jsx Upgraded** | ✅ COMPLETE |
| Products show purple badges (good_for_tags) | ✅ DONE |
| Products show teal badges (intent_tags) | ✅ DONE |
| Edit modal with clickable tag badges | ✅ DONE |
| Tag categories: Size, Coat, Life Stage, Temperament | ✅ DONE |
| Seed Care Products button (comprehensive) | ✅ DONE |
| Bundles show items count and good_for_tags | ✅ DONE |
| **Backend API Updates** | ✅ COMPLETE |
| /api/care/products?comprehensive_only=true | ✅ DONE |
| /api/care/bundles?comprehensive_only=true | ✅ DONE |
| /api/care/admin/seed-comprehensive-care | ✅ DONE |
| /api/care/products-for-pet/{pet_id} | ✅ DONE |
| Products sorted by good_for_tags first | ✅ DONE |
| **Testing Verified (iteration_38)** | ✅ 100% PASS |

### PREVIOUS WORK (Feb 24, 2026)
| Task | Status |
|------|--------|
| **🔒 CARE vs FIT PILLAR REORGANIZATION** | ✅ COMPLETE |
| CARE_TYPES updated to 8 categories | ✅ DONE |
| Walk/Training REMOVED from Care | ✅ DONE |
| Boarding & Daycare ADDED to Care | ✅ DONE |
| CARE_EXPERIENCES updated (6 new experiences) | ✅ DONE |
| Quick Book section limited to 4 cards | ✅ DONE |
| ConversationalEntry goals updated for Care | ✅ DONE |
| ConversationalEntry goals updated for Stay (travel-led) | ✅ DONE |
| QuickWinTip tips updated (care/fit separation) | ✅ DONE |
| TransformationStories made pillar-aware | ✅ DONE |
| CARE_STORIES vs FIT_STORIES differentiated | ✅ DONE |
| CarePage.jsx passes pillar="care" | ✅ DONE |
| FitPage.jsx passes pillar="fit" | ✅ DONE |
| **🌟 MIRA-LED CARE PAGE** | ✅ COMPLETE |
| Backend: `/api/mira/care-plan/{pet_id}` | ✅ BUILT |
| Frontend: `MiraCarePlan.jsx` component | ✅ BUILT |
| Care page restructured: Mira's Plan FIRST | ✅ DONE |
| Removed: ConversationalEntry from Care | ✅ DONE |
| Removed: Quick Book cards (redundant) | ✅ DONE |
| Removed: Care Types Strip (redundant) | ✅ DONE |
| Added: All Care Services grid (secondary) | ✅ DONE |
| Mira's recommendations with ONE-TAP booking | ✅ DONE |
| Soul-driven reasons ("Because Mystique is...") | ✅ DONE |
| **🎨 UI COLOR DIFFERENTIATION** | ✅ COMPLETE |
| Care pillar: Changed from pink to TEAL color | ✅ DONE |
| UnifiedHero.jsx: Care gradient updated | ✅ DONE |
| PillarPageLayout.jsx: Care bg updated to teal | ✅ DONE |
| MiraCuratedLayer.jsx: Care theme updated | ✅ DONE |
| **📸 ACCURATE BREED IMAGES** | ✅ COMPLETE |
| TransformationStories: Bruno (Golden Retriever) | ✅ FIXED |
| TransformationStories: Coco (Beagle) | ✅ FIXED |
| TransformationStories: Max (Labrador) | ✅ FIXED |
| TransformationStories: Luna (German Shepherd) | ✅ FIXED |
| Images sourced from Unsplash/Pexels | ✅ DONE |
| **📸 LARGER TRANSFORMATION IMAGES** | ✅ COMPLETE |
| Image height: 128px → 224px | ✅ DONE |
| Card width: 300px → 360px | ✅ DONE |
| Added framer-motion hover animations | ✅ DONE |
| **🧹 REDUNDANT PET SELECTOR REMOVED** | ✅ COMPLETE |
| PetJourneyRecommendations: Removed inline selector | ✅ DONE |
| **🌟 MiraCuratedLayer GOLD STANDARD REFACTOR** | ✅ COMPLETE |
| Unified Paperwork, Advisory, Shop, Services pages | ✅ DONE |
| All 10 pillar pages now use MiraCuratedLayer | ✅ VERIFIED (iteration_36) |
| Backend: Added paperwork, advisory, services to valid_pillars | ✅ FIXED |
| Enhanced MiraCuratedLayer with framer-motion animations | ✅ DONE |
| Mobile-first UI with touch-optimized spacing | ✅ DONE |
| Premium loading skeleton with shimmer effect | ✅ DONE |
| Pillar-specific theming (colors, icons, gradients) | ✅ VERIFIED |
| **📖 PILLAR PAGE BIBLE DOCUMENTED** | ✅ COMPLETE |
| Gold standard architecture documented | ✅ DONE |
| "How to Add New Pillar" guide created | ✅ DONE |
| **🌟 CuratedConciergeSection (Handpicked for Pet) Rollout** | ✅ COMPLETE |
| Backend: care_concierge_cards.py | ✅ CREATED |
| Backend: universal_pillar_cards.py | ✅ CREATED |
| Backend: intelligence_layer.py updated | ✅ DONE |
| Frontend: CuratedConciergeSection on all pillars | ✅ DONE |
| Tested: Care, Stay, Travel, Learn, Enjoy, Fit, Shop | ✅ ALL PASS |
| **🧹 Old ConciergePickCard Cleanup** | ✅ COMPLETE |
| Removed from: Care, Stay, Travel, Learn, Enjoy, Fit | ✅ DONE |
| Removed from: Paperwork, Advisory, Shop | ✅ DONE |
| **🌟 PersonalizedPillarSection Rollout (Full)** | ✅ COMPLETE |
| Universal component built | ✅ DONE |
| Care, Stay, Travel, Learn, Enjoy, Fit pages | ✅ DONE |
| Paperwork, Advisory, Services, Shop pages | ✅ DONE |
| All 10 pillar sections tested | ✅ VERIFIED (iteration_31, iteration_32) |
| **🔄 PillarPicksSection Fallback System** | ✅ COMPLETE |
| Added FALLBACK_PICKS_BY_PILLAR for all pillars | ✅ DONE |
| Section never empty - shows fallback when API empty | ✅ DONE |
| TravelPage bug fixed (userPets[0] vs selectedPets[0]) | ✅ FIXED |
| Tested on Care, Stay, Travel | ✅ VERIFIED (iteration_33) |
| **🎁 Mira's Birthday Box Feature** | ✅ COMPLETE |
| Soul-driven breed cake suggestions | ✅ DONE |
| Allergy-aware personalization | ✅ DONE |
| Personalized accessories (mug, bandana, mat, tag) | ✅ DONE |
| Universal Service Command integration | ✅ DONE |
| Ticket creation in inbox | ✅ VERIFIED |
| **✨ Personalized Items Section** | ✅ COMPLETE |
| Mobile-friendly horizontal scroll | ✅ DONE |
| "Swipe for more" hint | ✅ ADDED |
| Matching mira-demo design | ✅ DONE |
| **📦 Product Pagination** | ✅ COMPLETE |
| "24 of 611 products" display | ✅ DONE |
| "Load More Products" button | ✅ WORKING |
| Incremental loading (24 at a time) | ✅ DONE |
| **🎂 Shape Filters for Cakes** | ✅ COMPLETE |
| 8 shape filter pills (paw, bone, heart, etc.) | ✅ DONE |
| Backend API `shape` filter parameter | ✅ ADDED |
| CakeBakeryConfig schema in product_master | ✅ ADDED |
| "Concierge®" trademark on all buttons | ✅ FIXED |

### PREVIOUS SESSION (Feb 23, 2026)
| Task | Status |
|------|--------|
| /join Onboarding Bug | ✅ FIXED |
| Duplicate Soul Questions | ✅ FIXED |
| Picks → Chat Flow | ✅ FIXED |
| Mira = Soul Mate Identity | ✅ FIXED |
| Cross-Pillar Memory | ✅ DONE |
| Error Messages | ✅ FIXED |
| Backend pet_age Bug | ✅ FIXED |
| Comprehensive Audit | ✅ DONE |
| Full Roadmap | ✅ DONE |
| **Restaurant Search in Chat (P1)** | ✅ FIXED |
| **Dynamic Picks for All 15 Pillars** | ✅ DONE |
| **YouTube Videos on Learn Page** | ✅ VERIFIED WORKING |
| **Save to Favorites Feature** | ✅ BACKEND COMPLETE, UI ADDED |
| **FavoritesPanel Component** | ✅ CREATED |
| **Soul Score Display** | ✅ VERIFIED (88% on mira-demo) |
| **Raw JSON in Inbox Fix** | ✅ FIXED |
| **View on Map Modal** | ✅ CREATED (MapModal.jsx) |
| **Geolocation Detection** | ✅ ADDED |
| **LEARN Tab Personalization** | ✅ VERIFIED WORKING |

---

## 📖 PILLAR PAGE GOLD STANDARD (THE BIBLE)

### Overview
Every pillar page in Mira follows the same architecture pattern established by Dine and Celebrate pages. This ensures consistent, soul-driven personalization across the entire pet operating system.

### Architecture: 3 Soul-Driven Sections Per Pillar

```
┌─────────────────────────────────────────────────────────────────┐
│  1. HANDPICKED FOR {PET}  (CuratedConciergeSection)             │
│     ├── Dark glass-card-dark container                          │
│     ├── "Handpicked for Mystique" header                        │
│     ├── CONCIERGE® PRODUCT cards (server-driven)                │
│     ├── CONCIERGE® SERVICE cards (server-driven)                │
│     └── Backend: /api/mira/curated-set/{petId}/{pillar}         │
├─────────────────────────────────────────────────────────────────┤
│  2. MIRA'S PICKS FOR {PET}  (PillarPicksSection)                │
│     ├── Dynamic picks from API + static fallback                │
│     ├── "Mira's Picks for Mystique" header                      │
│     ├── Catalogue products + Concierge services                 │
│     └── Backend: /api/mira/top-picks/{petId}/pillar/{pillar}    │
├─────────────────────────────────────────────────────────────────┤
│  3. PERSONALIZED FOR {PET}  (PersonalizedPillarSection)         │
│     ├── Static curated items per pillar                         │
│     ├── "CARE ESSENTIALS FOR MYSTIQUE" header                   │
│     ├── Horizontal scroll with desktop buttons                  │
│     └── Config: PILLAR_CONFIGS in PersonalizedPillarSection.jsx │
└─────────────────────────────────────────────────────────────────┘
```

### Frontend Component Files

| Component | File Path | Purpose |
|-----------|-----------|---------|
| **CuratedConciergeSection** | `/app/frontend/src/components/Mira/CuratedConciergeSection.jsx` | Server-driven CONCIERGE® cards |
| **PillarPicksSection** | `/app/frontend/src/components/PillarPicksSection.jsx` | Dynamic picks with fallback |
| **PersonalizedPillarSection** | `/app/frontend/src/components/PersonalizedPillarSection.jsx` | Static curated items |

### Backend Data Files

| Pillar | Backend Data File |
|--------|-------------------|
| **celebrate** | `/app/backend/app/data/celebrate_concierge_cards.py` |
| **dine** | `/app/backend/app/data/dine_concierge_cards.py` |
| **fresh_meals** | `/app/backend/app/data/fresh_meals_concierge_cards.py` |
| **care** | `/app/backend/app/data/care_concierge_cards.py` |
| **stay, travel, learn, enjoy, fit, paperwork, advisory, services, shop** | `/app/backend/app/data/universal_pillar_cards.py` |

### Backend Intelligence

- **File**: `/app/backend/app/intelligence_layer.py`
- **Function**: `get_curated_concierge_set(pillar, pet_data, intent_context)`
- **Returns**: `{ concierge_products: [], concierge_services: [], question_card: null }`

### How to Add a NEW Pillar Page

1. **Frontend - Add imports to the new page:**
```jsx
import CuratedConciergeSection from '../components/Mira/CuratedConciergeSection';
import PillarPicksSection from '../components/PillarPicksSection';
import PersonalizedPillarSection from '../components/PersonalizedPillarSection';
```

2. **Frontend - Add sections in the page (in this order):**
```jsx
{/* 1. HANDPICKED FOR {PET} */}
{userPets && userPets[0] && (
  <div className="glass-card-dark rounded-3xl p-4 md:p-6 shadow-xl mt-8">
    <CuratedConciergeSection
      petId={userPets[0].id || userPets[0]._id}
      petName={userPets[0].name}
      pillar="YOUR_PILLAR"
      token={token}
      userEmail={user?.email}
    />
  </div>
)}

{/* 2. MIRA'S PICKS FOR {PET} */}
{userPets && userPets[0] && (
  <PillarPicksSection pillar="YOUR_PILLAR" pet={userPets[0]} />
)}

{/* 3. PERSONALIZED FOR {PET} */}
{userPets && userPets[0] && (
  <PersonalizedPillarSection
    pillar="YOUR_PILLAR"
    pet={userPets[0]}
    token={token}
    userEmail={user?.email}
  />
)}
```

3. **Backend - Add pillar cards in `universal_pillar_cards.py`:**
```python
YOUR_PILLAR_CARDS = [
    {
        "id": "pillar_item_1",
        "type": "concierge_product",  # or "concierge_service"
        "name": "Item Name for {pet_name}",
        "description": "Description with {pet_name}",
        "icon": "🎯",
        "cta_text": "Button Text",
        "default_score": 80,
    },
    # ... more cards
]

# Add to PILLAR_CARDS registry
PILLAR_CARDS = {
    ...
    "your_pillar": YOUR_PILLAR_CARDS,
}
```

4. **Backend - Add pillar to `intelligence_layer.py`:**
```python
elif pillar in ["stay", "travel", ..., "your_pillar"]:
    from app.data.universal_pillar_cards import select_pillar_cards
    result = select_pillar_cards(pillar, pet_data, max_cards=4)
    # ...
```

5. **Frontend - Add fallback picks in `PillarPicksSection.jsx`:**
```javascript
FALLBACK_PICKS_BY_PILLAR = {
    ...
    your_pillar: [
        { id: 'item-1', name: 'Item Name', description: '...', icon: '🎯', concierge: true },
        { id: 'item-2', name: 'Item Name', description: '...', icon: '🏆', concierge: true }
    ]
}
```

6. **Frontend - Add pillar config in `PersonalizedPillarSection.jsx`:**
```javascript
PILLAR_CONFIGS = {
    ...
    your_pillar: {
        title: 'Pillar Title',
        subtitle: 'Subtitle for pet',
        theme: { gradient: '...', accent: 'color', buttonGradient: '...' },
        items: [
            { id: 'item-1', name: 'Item', description: '...', icon: '🎯', ... },
            // ... more items
        ]
    }
}
```

### What NOT to Do

❌ **Never use old ConciergePickCard** - It shows the purple card with "Let Mira Arrange This" button - this is deprecated
❌ **Never leave sections empty** - Always have fallback data
❌ **Never skip the dark container** - CuratedConciergeSection must be wrapped in `glass-card-dark rounded-3xl p-4 md:p-6 shadow-xl`
❌ **Never hardcode pet names** - Always use `{pet_name}` placeholder in backend, personalize in frontend

### Verification Checklist for New Pillars

- [ ] CuratedConciergeSection shows "Handpicked for {Pet}" with cards
- [ ] PillarPicksSection shows "Mira's Picks for {Pet}" (with fallback if API empty)
- [ ] PersonalizedPillarSection shows "{PILLAR} ESSENTIALS FOR {PET}"
- [ ] All cards have CTA buttons that create service tickets
- [ ] Dark container styling is consistent
- [ ] Mobile horizontal scroll works
- [ ] Desktop scroll buttons visible

---

### PersonalizedPillarSection Rollout (Feb 24, 2026)
**Feature**: Universal "Personalized for [Pet Name]" sections added to all 6 pillar pages (Care, Stay, Travel, Learn, Enjoy, Fit).

**How it works**:
1. Each pillar page shows a personalized section after the PillarPicksSection
2. Section displays pillar-specific curated items for the pet (e.g., "CARE ESSENTIALS FOR MYSTIQUE")
3. Items include: grooming accessories, travel gear, training tools, fitness equipment, etc.
4. Each item shows "Concierge® creates" label indicating premium personalization
5. Mobile-friendly horizontal scroll with desktop scroll buttons
6. Click opens modal with pet info, description, special requests textarea
7. Submit creates service ticket via Universal Service Command

**Files Modified**:
- `/app/frontend/src/pages/CarePage.jsx` - Added PersonalizedPillarSection
- `/app/frontend/src/pages/StayPage.jsx` - Added PersonalizedPillarSection
- `/app/frontend/src/pages/TravelPage.jsx` - Added PersonalizedPillarSection
- `/app/frontend/src/pages/LearnPage.jsx` - Added PersonalizedPillarSection
- `/app/frontend/src/pages/EnjoyPage.jsx` - Added PersonalizedPillarSection
- `/app/frontend/src/pages/FitPage.jsx` - Added PersonalizedPillarSection
- `/app/frontend/src/pages/PaperworkPage.jsx` - Added PersonalizedPillarSection
- `/app/frontend/src/pages/AdvisoryPage.jsx` - Added PersonalizedPillarSection
- `/app/frontend/src/pages/ServicesPage.jsx` - Added PersonalizedPillarSection
- `/app/frontend/src/pages/ShopPage.jsx` - Added PersonalizedPillarSection

**Universal Component**:
- `/app/frontend/src/components/PersonalizedPillarSection.jsx`
- Contains PILLAR_CONFIGS with items for ALL pillars (care, stay, travel, learn, enjoy, fit, paperwork, advisory, services, shop, adopt, farewell)

**Testing Status**: ✅ VERIFIED on ALL 10 pillar pages (iteration_31.json, iteration_32.json)

---

### Mira's Birthday Box Feature (Feb 24, 2026)
**Feature**: Soul-driven birthday box suggestion card that flows through Universal Service Command.

**How it works**:
1. On Celebrate page, logged-in users see "Mystique's Birthday Box" card
2. Card shows breed-specific cake (e.g., "Shih Tzu Silhouette Cake")
3. Allergy-aware: Shows "(no chicken)" if pet has chicken allergy
4. Personalized accessories with pet's name: Mug, Bandana, Feeding Mat, Name Tag
5. User clicks → Modal opens with selectable items
6. User submits → Service ticket created via Universal Service Command
7. Concierge receives ticket with all personalization details

**Files Created**:
- `/app/frontend/src/components/celebrate/MiraBirthdayBoxCard.jsx`

**Integration**:
- Added to CelebratePage.jsx after CuratedConciergeSection
- Creates ticket type: `mira_birthday_box`
- Includes: pet breed, allergies, selected items, special notes

### Restaurant Search Fix Details (Feb 23, 2026 - Session 2)
**Problem**: When users asked "find me a pet-friendly restaurant in Mumbai", Mira asked for seating preference instead of showing results directly.

**Root Cause**: The `mira_routes.py` code was designed to ask clarifying questions (indoor/outdoor seating) before showing results. When the user explicitly provided a location, the code should skip this step.

**Fix Applied**:
1. Modified `mira_routes.py` to detect when user provides location explicitly
2. Added direct Google Places API lookup when location is available
3. Skip seating preference question - default to "either"
4. Return `nearby_places` data with restaurant results immediately
5. Also added Google Places fallback for stays/hotels and restaurants in the main chat flow

**Files Modified**:
- `/app/backend/mira_routes.py` (lines 13033-13130 - new direct search logic)

**Result**: Users now see restaurant cards with names, ratings, and "Reserve" buttons directly in the Mira chat widget when they search for restaurants.


### Celebrate Flow & Dynamic Picks Fix (Feb 23, 2026 - Session 2)
**Problem**: When users asked for "cake, photographer, presents" in the celebrate flow:
1. Picks panel showed garbage entries like "First question: Perfect for Mystique"
2. No dynamically generated picks based on user request
3. Generic ticket created without actionable items

**Root Cause**: 
1. The `picks_catalogue` MongoDB collection was empty (0 documents)
2. The Picks Engine was designed to look up static picks, but the system is meant to be **Concierge-driven** where picks are **dynamically generated** based on conversation intent
3. The `add_picks_to_response()` function was overwriting handler-set picks with empty Picks Engine results

**Fix Applied**:
1. Added new handler for `celebrate_stage == "execution"` that parses user requirements
2. Dynamically generates personalized picks for: cake, photographer, party favors, decorations, coordination
3. Modified `add_picks_to_response()` to preserve picks set by handlers (not overwrite with empty engine results)
4. Each pick is personalized with pet name, context-aware descriptions, and actionable CTAs

**Files Modified**:
- `/app/backend/mira_routes.py`:
  - Lines 13848-13990: New celebrate requirements handler
  - Lines 12032-12045: Modified `add_picks_to_response()` to preserve handler picks

**Result**: When user says "cake, photographer, presents", the picks panel now shows:
- 🎂 Custom Birthday Cake for {Pet} - [Design Cake]
- 📸 Pet Photography Session - [Book Session]  
- 🎁 Party Favors & Gift Bags - [Curate Selection]

**Architecture Note**: Picks are now **Concierge-curated in real-time** based on conversation intent, not looked up from a static catalogue. This aligns with the MIRA BIBLE principle: "Concierge creates and fills the picks as per the conversation."


### Save to Favorites Feature (Feb 23, 2026 - Session 3)
**Feature**: Users can save dynamically generated picks to their pet's profile for future reference.

**Components Added**:
1. **Backend API** (`/app/backend/favorites_routes.py`):
   - `GET /api/favorites/{pet_id}` - Get all favorites for a pet
   - `POST /api/favorites/add` - Add a pick to favorites
   - `POST /api/favorites/remove` - Remove a favorite
   - `GET /api/favorites/{pet_id}/summary` - Get favorites summary

2. **Backend Service** (`/app/backend/services/favorites_service.py`):
   - Complete favorites management logic
   - Pillar-based categorization
   - Duplicate detection

3. **Frontend FavoritesPanel** (`/app/frontend/src/components/Mira/FavoritesPanel.jsx`):
   - New component to display saved favorites
   - Grouped by pillar with color-coded badges
   - Remove functionality
   - Compact and full panel modes

4. **Integration with SoulKnowledgeTicker**:
   - Added FAVORITES section to expanded panel
   - Fetches favorites alongside "What Mira Knows" data
   - Shows saved picks count and preview

5. **Integration with MyPets Page**:
   - Updated fetchMiraKnowledge to also fetch favorites
   - Added "Saved Favorites" section in expanded "What Mira Knows" panel
   - Shows up to 4 favorites with pillar badges

**Test Results**: All favorites API endpoints verified working (100% pass rate). Console logs confirm 5 favorites fetched for pet-3661ae55d2e2.


### YouTube Training Videos Verification (Feb 23, 2026 - Session 3)
**Issue Reported**: User reported Learn pillar not showing YouTube videos.

**Investigation Result**: YouTube section EXISTS and WORKS correctly. The section is positioned lower on the Learn page (requires scrolling down past the training categories).

**Features Verified**:
- 25+ YouTube video cards displaying
- Topic filters: Basic Training, Puppy Training, Behavior Fixes, Tricks & Fun, Leash Walking, Anxiety Help
- Breed-specific filter (e.g., "Shih Tzu Tips" for Mystique)
- API endpoints working: `/api/mira/youtube/by-topic`, `/api/mira/youtube/by-breed`


### Google Maps Issue Investigation (Feb 23, 2026 - Session 3)
**Issue Reported**: User reported "Google Maps blocked" on Dine page.

**Investigation Result**: No embedded Google Maps iframe found on Dine page. The page uses:
- Google Places API for data (working correctly)
- Links that open Google Maps in new tab when clicking on places
- NearbyPlacesCarousel component shows place cards, not embedded maps

**Conclusion**: This issue could not be reproduced. The reported "blocked" message may have been from a different context or browser extension.



---

## 🔴 P0 - NEXT PRIORITIES

| Task | Description | Status |
|------|-------------|--------|
| ~~Mira's Birthday Box~~ | ~~Soul-driven birthday box with personalized accessories~~ | ✅ DONE |
| Birthday Countdown Widget | Surface existing backend birthday reminders to dashboard | 📋 READY |
| Proactive Birthday Reminders | Display alerts on PetHomePage for upcoming pet birthdays | 📋 READY |

---

## 🟠 P1 - IMPORTANT

| Task | Description |
|------|-------------|
| Replicate Gold Standard Pattern | Apply "Fresh Meals" tab structure to other Dine sub-categories (Treats, Chews, Supplements) |
| Allergy Filter on Dine | Auto-filter by soul allergies |
| Surface Reminders to Dashboard | Show upcoming reminders from backend |
| Grooming Scheduling UI | Connect to Care pillar |

---

## 🟠 P1 - IMPORTANT

| Task | Description |
|------|-------------|
| Replicate Gold Standard Pattern | Apply "Fresh Meals" tab structure to other Dine sub-categories |
| Allergy Filter on Dine | Auto-filter by soul allergies |
| Surface Reminders to Dashboard | Show upcoming reminders from backend |
| Grooming Scheduling UI | Connect to Care pillar |

---

## 🟡 P2 - ENHANCEMENT

| Task | Description |
|------|-------------|
| User-facing Analytics | "Mystique's favorites" dashboard |
| Activity Timeline | Pet activity log |
| Food Diary | Meal tracking |

---

## 🔵 P3 - BACKLOG

| Task | Description |
|------|-------------|
| Razorpay Checkout | Payment integration |
| Voice Commands | "Hey Mira" wake word |
| Calendar Sync | Google/Apple |

---

## INTEGRATIONS

### Active ✅
- OpenAI GPT (Mira AI)
- Google Places API (Restaurants, Hotels, Parks)
- MongoDB (Database)
- Cloudinary (Images)
- ElevenLabs (Voice TTS)
- OpenAI TTS (Backup)
- YouTube Data API (Training Videos)
- Favorites API (Save/Get/Remove picks)

### Pending Config ⚠️
- Resend (Domain verification needed)
- Gupshup (WhatsApp config needed)
- Google Maps Embed API (Key needed for MapModal)

### Planned 📋
- Razorpay
- Google Calendar

---

## KEY API ENDPOINTS

### Favorites
```
GET  /api/favorites/{pet_id}          - Get all favorites for a pet
POST /api/favorites/add               - Add item to favorites
POST /api/favorites/remove            - Remove item from favorites
GET  /api/favorites/{pet_id}/summary  - Get favorites summary by pillar
```

### YouTube
```
GET  /api/mira/youtube/by-topic       - Get videos by training topic
GET  /api/mira/youtube/by-breed       - Get breed-specific videos
GET  /api/mira/youtube/videos         - Search videos by query
```

### Birthday/Reminders
```
GET  /api/birthday-engine/upcoming     - Get upcoming celebrations
GET  /api/birthday-engine/stats        - Birthday statistics
POST /api/birthday-engine/send-promotion/{pet_id}
POST /api/birthday-engine/send-bulk
```

### Proactive Notifications
```
GET  /api/mira/proactive/triggers
POST /api/mira/proactive/send
```

### Service Desk
```
POST /api/service-requests             - Create ticket
GET  /api/service-requests             - List tickets
```

---

## TEST CREDENTIALS

- **Member**: dipali@clubconcierge.in / test123
- **Admin**: aditya / lola4304

---

## DOCUMENTS

- `/app/memory/PRD.md` - This file (SSOT)
- `/app/memory/ROADMAP.md` - Full roadmap
- `/app/memory/AUDIT.md` - Feature audit
- `/app/memory/GAPS_AUDIT.md` - Gap analysis

---

*Mira is the Soul. The pet's soul grows with every interaction.* 🐾

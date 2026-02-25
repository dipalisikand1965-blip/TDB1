# MIRA OS - Single Source of Truth (SSOT)
## The World's First Pet Life Operating System

> **"Mira is the Soul, the Concierge® controls the experience, and the System is the capillary enabler."**

---

## TABLE OF CONTENTS
1. [System Overview](#system-overview)
2. [The 15 Pillars](#the-15-pillars)
3. [Mira Demo Page Architecture](#mira-demo-page-architecture)
4. [Pet Profile Structure](#pet-profile-structure)
5. [Dynamic Picks System](#dynamic-picks-system)
6. [Favorites System](#favorites-system)
7. [Component Inventory](#component-inventory)
8. [API Endpoints](#api-endpoints)
9. [Gap Analysis](#gap-analysis)

---

## SYSTEM OVERVIEW

### Core Philosophy
- **Mira**: The pet's Soul Mate - AI that knows and remembers everything about your pet
- **Concierge®**: Human-in-the-loop premium service brand
- **Pet OS**: The capillary system that connects everything

### Key Interfaces
| Interface | Purpose | Location |
|-----------|---------|----------|
| `/mira-demo` | Comprehensive Mira chat experience | `MiraDemoPage.jsx` |
| `/[pillar]` | Pillar-specific pages with Mira widget | `PillarPageLayout.jsx` |
| `/pet/[id]` | Pet profile with soul data | `PetHomePage.jsx` |
| `/dashboard` | Member dashboard | `Dashboard.jsx` |

---

## THE 15 PILLARS

| # | Pillar | Icon | Path | Description | Dynamic Picks |
|---|--------|------|------|-------------|---------------|
| 1 | **Celebrate** | 🎂 | `/celebrate` | Birthdays, parties, occasions | ✅ Implemented |
| 2 | **Dine** | 🍽️ | `/dine` | Nutrition, meals, restaurants | ✅ Implemented |
| 3 | **Stay** | 🏨 | `/stay` | Boarding, daycare, hotels | ✅ Implemented |
| 4 | **Travel** | ✈️ | `/travel` | Trips, transport, planning | ✅ Implemented |
| 5 | **Care** | 💊 | `/care` | Grooming, vet, health | ✅ Implemented |
| 6 | **Enjoy** | 🎾 | `/enjoy` | Play, events, enrichment | ✅ Implemented |
| 7 | **Fit** | 🏃 | `/fit` | Exercise, training, fitness | ✅ Implemented |
| 8 | **Learn** | 🎓 | `/learn` | Training classes, behavior | ✅ Implemented |
| 9 | **Paperwork** | 📄 | `/paperwork` | Documents, registration | ✅ Implemented |
| 10 | **Advisory** | 📋 | `/advisory` | Expert consultation | ✅ Implemented |
| 11 | **Emergency** | 🚨 | `/emergency` | 24/7 helpline, urgent care | ✅ Implemented |
| 12 | **Farewell** | 🌈 | `/farewell` | Memorial, grief support | ✅ Implemented |
| 13 | **Adopt** | 🐾 | `/adopt` | Adoption, fostering | ✅ Implemented |
| 14 | **Shop** | 🛒 | `/shop` | Products, accessories | ✅ Implemented |
| 15 | **Services** | ⚙️ | `/services` | All services overview | ✅ Implemented |

---

## MIRA DEMO PAGE ARCHITECTURE

### File: `/app/frontend/src/pages/MiraDemoPage.jsx`

### Core Components
```
MiraDemoPage
├── WelcomeHero         # Initial greeting
├── PetSelector         # Pet selection dropdown
├── ChatArea
│   ├── ChatMessage[]   # Message bubbles
│   ├── QuickReplies    # Suggested responses
│   └── MemoryWhisper   # Context hints
├── ChatInputBar        # Text input + voice
├── SoulKnowledgeTicker # "What Mira Knows"
├── PersonalizedPicksPanel  # Dynamic picks
└── Panels (Lazy Loaded)
    ├── ConciergePanel
    ├── InsightsPanel
    ├── PastChatsPanel
    ├── ServicesPanel
    └── TodayPanel
```

### State Management
- `messages[]` - Chat history
- `selectedPet` - Active pet context
- `activePillar` - Current pillar filter
- `picks` - Dynamic picks from backend
- `favorites` - Pet's saved favorites

---

## PET PROFILE STRUCTURE

### Soul Data Categories
Based on the pet profile page image:

| Section | Completion | Fields |
|---------|------------|--------|
| **Basic Info** | Core | name, breed, age, gender, weight |
| **Environment** | 43% | home_type, yard_access, living_situation |
| **Documents Vault** | 0% | vaccination_records, medical_history, adoption_papers |
| **Life Timeline** | 0% | milestones, life_events, gotcha_day |
| **Preferences & Constraints** | 25% | fear_triggers, food_allergies, behavioral_notes |
| **Favorites** | NEW | saved_picks, preferred_services |

### Pet Schema Updates Required
```javascript
{
  id: String,
  name: String,
  // ... existing fields
  
  // NEW: Favorites field
  favorites: [{
    item_id: String,
    title: String,
    type: String,      // 'product' | 'service'
    category: String,
    pillar: String,
    icon: String,
    added_at: Date
  }],
  favorites_updated_at: Date,
  
  // Soul Knowledge (What Mira Knows)
  soul_knowledge: {
    favorites_count: Number,
    favorite_pillars: Object,    // {dine: 3, celebrate: 2}
    favorite_categories: Array,
    favorites_updated_at: Date
  }
}
```

---

## DYNAMIC PICKS SYSTEM

### File: `/app/backend/services/dynamic_picks_generator.py`

### How It Works
1. User sends message → Backend receives with pillar context
2. Picks Engine runs → Returns 0 picks (catalogue empty)
3. **Dynamic Picks Fallback** → Generates picks based on:
   - User message keywords
   - Active pillar
   - Pet context (name, allergies, preferences)
   - Location (if available)

### Pick Structure
```python
{
    "id": "stay-boarding-mystique-0",
    "type": "service",
    "category": "boarding",
    "title": "Premium Boarding for Mystique",
    "subtitle": "Safe, comfortable overnight stays",
    "icon": "🏠",
    "reason": "Mystique will be pampered while you're away",
    "cta": "Find Boarding",
    "service_type": "boarding",
    "is_personalized": True,
    "pet_name": "Mystique",
    "source": "concierge_curated",
    "pillar": "stay",
    "badge": "For Mystique"
}
```

---

## FAVORITES SYSTEM

### Backend Files
- `/app/backend/services/favorites_service.py` - Core logic
- `/app/backend/favorites_routes.py` - API routes

### API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/favorites/add` | Add item to pet's favorites |
| POST | `/api/favorites/remove` | Remove item from favorites |
| GET | `/api/favorites/{pet_id}` | Get pet's favorites |
| GET | `/api/favorites/{pet_id}/summary` | Get favorites summary |

### Frontend Integration
- `PersonalizedPicksPanel.jsx` - Heart button on picks
- `toggleFavorite()` function - Handles save/unsave
- Updates "What Mira Knows" automatically

---

## COMPONENT INVENTORY

### Mira Components (`/app/frontend/src/components/Mira/`)

| Component | Purpose | Status |
|-----------|---------|--------|
| `ChatMessage.jsx` | Renders chat bubbles | ✅ Active |
| `ChatInputBar.jsx` | Text input + voice | ✅ Active |
| `QuickReplies.jsx` | Suggested responses | ✅ Active |
| `PersonalizedPicksPanel.jsx` | Picks panel | ✅ Updated with Favorites |
| `SoulKnowledgeTicker.jsx` | "What Mira Knows" | ✅ Active |
| `WelcomeHero.jsx` | Initial greeting | ✅ Active |
| `PetSelector.jsx` | Pet dropdown | ✅ Active |
| `MiraTray.jsx` | Service tray | ✅ Active |
| `ServicesPanel.jsx` | Services list | ✅ Active |
| `ConciergePanel.jsx` | Concierge chat | ✅ Active |
| `PastChatsPanel.jsx` | Chat history | ✅ Active |
| `InsightsPanel.jsx` | Pet insights | ✅ Active |
| `TodayPanel.jsx` | Today's schedule | ✅ Active |
| `ServiceRequestModal.jsx` | Service request form | ✅ Active |
| `NavigationDock.jsx` | Bottom navigation | ⚠️ Removed (replaced) |

### Navigation Components
| Component | Purpose | Status |
|-----------|---------|--------|
| `Navbar.jsx` | Main navigation | ✅ 15 Pillars defined |
| `PetOSNavigation.jsx` | Pet OS nav | ✅ Active |
| `PillarPageLayout.jsx` | Pillar page template | ✅ Active |

---

## API ENDPOINTS

### Mira Chat
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/mira/chat` | POST | Send message, get response + picks |
| `/api/mira/session/{id}` | GET | Get chat session |
| `/api/mira/insights` | GET | Get pet insights |

### Picks & Products
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/picks/engine` | POST | Run picks engine |
| `/api/products/personalized` | GET | Get personalized products |

### Favorites
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/favorites/add` | POST | Add to favorites |
| `/api/favorites/remove` | POST | Remove from favorites |
| `/api/favorites/{pet_id}` | GET | Get pet favorites |

### Service Requests
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/service-requests` | POST | Create service request |
| `/api/service-requests/{id}` | GET | Get request details |

---

## GAP ANALYSIS

### ✅ Implemented
- [x] Dynamic Picks for all 15 pillars
- [x] Favorites system (backend + API)
- [x] Frontend favorites UI (heart button)
- [x] Pet profile structure defined
- [x] All pillar routes in Navbar

### ⚠️ Needs Verification
- [ ] mira-demo: Test picks rendering
- [ ] mira-demo: Test favorites save/load
- [ ] Pet profile: favorites field migration
- [ ] "What Mira Knows": Display favorites summary

### ❌ Missing / TODO
1. **Pet Profile UI Updates**
   - Add favorites section to profile page
   - Show "What Mira Knows" with favorites

2. **Soul Knowledge Display**
   - Update `SoulKnowledgeTicker.jsx` to show favorites
   - Show recent favorites in profile

3. **Picks Catalogue Seeding**
   - Seed ~100 products/services for hybrid approach
   - Tags and synonyms for better matching

4. **Database Migrations**
   - Add `favorites` field to existing pets
   - Add `soul_knowledge` field

5. **Testing**
   - E2E test for picks flow
   - E2E test for favorites flow
   - Load testing with real pet data

---

## CHANGE LOG

| Date | Change | Files |
|------|--------|-------|
| Feb 23, 2026 | Added dynamic picks for all 15 pillars | `dynamic_picks_generator.py` |
| Feb 23, 2026 | Created favorites system | `favorites_service.py`, `favorites_routes.py` |
| Feb 23, 2026 | Updated PersonalizedPicksPanel with favorites | `PersonalizedPicksPanel.jsx` |
| Feb 23, 2026 | Created MIRA OS SSOT | `MIRA_OS_SSOT.md` |

---

*Last Updated: February 23, 2026*
*Version: 2.0*

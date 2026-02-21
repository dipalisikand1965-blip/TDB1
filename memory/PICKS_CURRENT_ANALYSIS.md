# CURRENT PICKS SYSTEM ANALYSIS
## For Handover - December 2025

---

## CURRENT ARCHITECTURE

### Frontend State (`MiraDemoPage.jsx`)
```javascript
const [miraPicks, setMiraPicks] = useState({
  products: [],        // Products from backend
  services: [],        // Services from backend
  context: '',         // e.g., "Road Trip", "Birthday", "Grooming"
  subIntent: '',       // e.g., 'party_planning', 'cake_shopping', 'celebration'
  mode: '',            // miraMode from backend
  clarifyOnly: false,  // True = don't show picks yet
  showConcierge: false,// Show concierge button
  hasNew: false        // Glows when new picks arrive
});
```

### Where Picks Are Set (Line ~3228-3253)
```javascript
// Update miraPicks only if backend says we can show products/services
if ((shouldShowProductsFromBackend && (newProducts.length > 0 || ...))) {
  setMiraPicks({
    products: clarifyOnly ? [] : newProducts,
    services: clarifyOnly ? [] : [...newServices, ...newExperiences],
    context: pickContext,
    subIntent: celebrationSubIntent,
    mode: miraMode,
    clarifyOnly: clarifyOnly,
    showConcierge: shouldShowConcierge,
    hasNew: !clarifyOnly && (newProducts.length > 0 || newServices.length > 0)
  });
}
```

### Picks Tray UI (Line ~5330-5920)
- **Overlay modal** that slides up
- **Displays products** as cards with images, names, prices
- **Displays services** with icons and descriptions
- **Context-aware sections**: 
  - Party Planning mode → Shows Planning Wizard, Bundle Maker buttons
  - Cake Shopping mode → Shows cake products directly
- **Concierge button** → Opens WhatsApp/Email/Chat options

---

## BACKEND FLOW

### 1. Smart Recommendations (`smart_routes.py`)
```python
# Mira picks are populated from:
# 1. Admin-curated picks (db.mira_picks collection)
# 2. Fallback: Birthday gifts, allergy-safe, breed-specific
# 3. Fill remaining with featured products

recommendations['mira_picks'] = unique_picks[:6]
```

### 2. Product Search (`mira_routes.py`)
```python
# search_real_products() - searches products_master
# Currently uses text matching and semantic_intents
# DOES NOT strictly filter by pillar first (THE GAP)
```

### 3. Ticket Creation (`create_mira_ticket()`)
```python
# Creates ticket with:
- ticket_id, notification_id, inbox_id
- mira_session_id
- ticket_type, pillar, urgency
- member info, pet info
- pet_soul_snapshot (full pet context)
- messages thread
- ai_context (detected pillar, urgency, intent)
```

---

## WHAT EXISTS

| Component | Location | Status |
|-----------|----------|--------|
| Picks state management | `MiraDemoPage.jsx:987` | ✅ Exists |
| Picks tray UI | `MiraDemoPage.jsx:5330` | ✅ Exists |
| Products display | `MiraDemoPage.jsx:5448-5500` | ✅ Exists |
| Services display | `MiraDemoPage.jsx:5893` | ✅ Exists |
| Admin-curated picks | `db.mira_picks` | ✅ Exists |
| Ticket creation | `mira_routes.py:3891` | ✅ Exists |
| Product search | `mira_routes.py:1279` | ✅ Exists |
| Service search | `mira_routes.py:2546` | ✅ Exists |

---

## WHAT'S MISSING (vs. Picks Vault Vision)

### 1. ❌ Pillar-First Filtering
**Current**: Products searched by text/intent matching
**Needed**: `{"pillar": current_pillar, ...}` filter FIRST

```python
# CURRENT (causes cross-contamination)
query = {"semantic_intents": {"$in": [intent]}}

# NEEDED (pillar-locked)
query = {
    "pillar": current_pillar,  # ALWAYS filter by pillar first
    "semantic_intents": {"$in": [intent]},
    "life_state_exclusions": {"$nin": [current_life_state]}
}
```

### 2. ❌ Picks Vault Storage
**Current**: Picks are transient in frontend state only
**Needed**: Store picks packet with service ticket

```python
ticket_doc = {
    ...
    "picks_vault": {
        "products": [...],
        "services": [...],
        "experiences": [...],
        "tip_cards": [...],    # NEW: Conversation summaries
        "generated_at": timestamp,
        "context": pick_context,
        "pillar": current_pillar
    }
}
```

### 3. ❌ Icon/Tip Cards
**Current**: No way to generate cards when no products exist
**Needed**: Generate summary cards for conversation flow

```python
# Example: Meal plan conversation → Generate tip card
tip_card = {
    "type": "meal_plan_summary",
    "title": "Mystique's Meal Plan",
    "content": "Morning: scrambled egg with X...",
    "icon": "🍽️",
    "pillar": "dine",
    "for_concierge": True
}
```

### 4. ❌ No Add-to-Cart Message
**Current**: Has "Add" button on products
**Needed**: "Your pet Concierge® will curate..." message

### 5. ❌ Life State Exclusions in Search
**Current**: Not checking life_state_exclusions
**Needed**: Filter out products based on conversation context

---

## DATABASE COLLECTIONS

| Collection | Count | Purpose |
|------------|-------|---------|
| `products_master` | 2,151 | Main product catalog |
| `services_master` | 695 | Main service catalog |
| `service_catalog` | 89 | Services with city pricing |
| `mira_picks` | ~10 | Admin-curated picks |
| `service_desk_tickets` | varies | Ticket storage |
| `unified_inbox` | varies | Unified conversation inbox |

---

## DATA FIELDS NOW AVAILABLE

After cleanup, products have:
```json
{
  "name": "Go Bananas Box",
  "pillar": "celebrate",           // ✅ 100% coverage
  "semantic_intents": ["birthday_celebration"],  // ✅ Pillar-aligned
  "semantic_tags": ["birthday_celebration"],
  "life_state_exclusions": ["GRIEF", "FAREWELL", "EMERGENCY", "MEMORIAL"],  // ✅ NEW
  "occasion": "birthday",          // ✅ NEW (celebrate only)
  "mira_hint": "✨ Sweet banana bliss sparks tail-wagging joy!",
  "applicable_breeds": [...],
  "price": 499
}
```

Services have:
```json
{
  "name": "Personal Training Programme",
  "pillar": "learn",
  "semantic_intents": ["training_behavior"],
  "semantic_tags": ["training_behavior"],
  "life_state_exclusions": [],
  "category": "training"
}
```

---

## RECOMMENDED CHANGES

### Phase 1: Pillar-First Search (Backend)
1. Update `search_real_products()` to filter by pillar first
2. Update `search_services_from_db()` to filter by pillar first
3. Add `life_state_exclusions` check

### Phase 2: Picks Vault Storage (Backend)
1. Add `picks_vault` field to ticket creation
2. Store all picks (products, services, tip cards) with ticket
3. Add API to retrieve picks vault for a ticket

### Phase 3: UI Updates (Frontend)
1. Change "Add" button to "Send to Concierge®"
2. Add standard message: "Your pet Concierge® will curate..."
3. Add expandable teaser (3-4 picks on screen, full list on expand)

### Phase 4: Icon Cards (Both)
1. Backend: Generate tip cards for conversations without products
2. Frontend: Display tip cards in picks tray
3. Store tip cards in picks vault

---

## FILES TO MODIFY

| File | Changes Needed |
|------|----------------|
| `/app/backend/mira_routes.py` | Pillar-first search, picks vault storage |
| `/app/frontend/src/pages/MiraDemoPage.jsx` | UI updates, concierge message |
| `/app/frontend/src/styles/mira-prod.css` | Styling for tip cards, new message |

---

## IMPLEMENTATION PRIORITY

1. **Pillar-First Search** (Critical) - Prevents cross-contamination
2. **Picks Vault Storage** (High) - Enables concierge workflow
3. **Concierge Message** (Medium) - Sets correct expectation
4. **Icon Cards** (Medium) - Handles no-product conversations
5. **UI Polish** (Low) - Teaser, expand, animations

---

*This analysis provides complete context for implementing the Picks Vault vision.*

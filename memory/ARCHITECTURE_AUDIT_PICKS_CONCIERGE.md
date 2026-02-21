# Mira OS Architecture Audit: PICKS & CONCIERGE Duplication Analysis
**Date:** Dec 2025
**Requested by:** User - "do a thorough analysis of what all there is on a conversation"

---

## 1. PROBLEM IDENTIFIED: Duplicate Features

### A) PICKS Appears in TWO Places:

| Location | Component | What it shows | Triggered by |
|----------|-----------|---------------|--------------|
| **1. Top Bar (OS Layer)** | `PetOSNavigation.jsx` → `PersonalizedPicksPanel.jsx` | Pillar-based catalogue products + concierge services | User clicks "PICKS" tab |
| **2. In Chat Message** | `ChatMessage.jsx` → `ProductsGrid` | Products returned by LLM based on conversation | Every Mira response with products |

**Issue:** When user asks "I want to go to Goa", Mira returns generic picks (Pet Health Monitor, End-of-Life Consultation) in the **chat** which are NOT relevant to travel.

**Screenshot shows:** "PICKS FOR LOLA" inside chat with irrelevant picks like "New Pet Parent Consultation" and "End-of-Life Consultation" for a Goa travel query.

### B) CONCIERGE Appears in MULTIPLE Places:

| Location | Component | Purpose |
|----------|-----------|---------|
| **1. Top Bar (OS Layer)** | `PetOSNavigation.jsx` → `ConciergeHomePanel.jsx` | Unified concierge inbox |
| **2. Inside Mira Message Header** | `ChatMessage.jsx` → "C° Need help? Tap here" | Quick concierge link |
| **3. Inside Chat Message Body** | `InlineConciergeCard.jsx` | When Mira mentions "connect you with concierge" |
| **4. Product Grid Footer** | `ProductsGrid` → "Your pet Concierge® will review these picks" | Every product response |
| **5. Service Cards** | `ServiceCards.jsx` | Service request flow |
| **6. Concierge Panel (separate)** | `ConciergePanel.jsx` | Legacy component |

---

## 2. DATA FLOW ANALYSIS

### Current Chat Response Flow:
```
User Query → Backend API → LLM Processing → Response with:
├── response (text)
├── products[] ← THESE SHOW IN CHAT (often generic)
├── services[]
├── quick_replies[]
├── tips[]
└── pillar
```

### Problem with Current Logic:
The `products[]` returned in chat are **pillar-based** (e.g., "care" pillar) rather than **query-specific** (e.g., "Goa travel").

---

## 3. RECOMMENDATION: UNIFIED PICKS ARCHITECTURE

### A) SINGLE SOURCE FOR PICKS = Top Bar Only

**Remove:**
- `ProductsGrid` component from `ChatMessage.jsx` entirely
- The `showProducts` flag from messages
- Product rendering inside chat bubbles

**Keep:**
- Top Bar PICKS tab with `PersonalizedPicksPanel.jsx`
- Update picks engine to be CONTEXT-AWARE based on conversation

### B) PICKS Should Be:

| Attribute | Current | Recommended |
|-----------|---------|-------------|
| **Location** | In chat + Top bar | **Top bar ONLY** |
| **Content** | Generic pillar products | **Context-aware from conversation** |
| **Update Trigger** | Every response | **When subject changes** |
| **Display Style** | Inline in chat | **Separate panel** |

### C) How Picks Engine Should Work:

```python
# When user asks about "Goa travel"
picks_engine.update({
    "context": "travel",
    "destination": "Goa",
    "pet_id": "lola_123",
    "filters": ["pet-friendly hotels", "travel accessories", "travel carriers"]
})
```

**Result:** PICKS tab shows travel carriers, pet-friendly hotels in Goa, travel treats - NOT generic pet health monitors.

---

## 4. CONCIERGE CONSOLIDATION

### Current State: Concierge appears 5+ times

### Recommended: ONE Primary Entry Point

| Keep | Remove |
|------|--------|
| Top Bar "CONCIERGE®" tab | Header "C° Need help? Tap here" button |
| `ConciergeHomePanel.jsx` (unified inbox) | `InlineConciergeCard.jsx` in messages |
| | Concierge footer in ProductGrid |
| | Legacy `ConciergePanel.jsx` |

### New Concierge Flow:
```
User in Chat → Wants Human Help → Taps Top Bar "CONCIERGE®" → 
  → ConciergeHomePanel shows:
     1. Active threads
     2. Option Cards awaiting response
     3. New request button
```

---

## 5. IMPLEMENTATION PLAN

### Phase 1: Remove In-Chat Picks
**Files to modify:**
1. `/app/frontend/src/components/Mira/ChatMessage.jsx`
   - Remove `ProductsGrid` rendering
   - Keep message text, weather, places, videos

2. `/app/backend/mira_routes.py`
   - Stop returning `products[]` in chat response
   - OR mark them as `silent_picks: true` (not displayed in chat)

### Phase 2: Context-Aware Top Bar Picks
**Files to modify:**
1. `/app/frontend/src/hooks/mira/useVault.js`
   - Update picks based on conversation context

2. `/app/backend/picks_scorer.py`
   - Score picks based on last query topic, not generic pillar

### Phase 3: Consolidate Concierge Entry Points
**Files to modify:**
1. Remove from `ChatMessage.jsx`:
   - "C° Need help? Tap here" header button
   - Concierge curation message footer

2. Keep `ConciergeHomePanel.jsx` as single entry

---

## 6. QUICK WINS (Can Do Immediately)

### A) Hide ProductsGrid in Chat
In `/app/frontend/src/components/Mira/ChatMessage.jsx`:
```jsx
// BEFORE (Line ~447-557):
const ProductsGrid = ({ msg, pet, hapticFeedback }) => {
  if (!msg.showProducts || !msg.data?.response?.products?.length) return null;
  // ... renders products
}

// AFTER:
const ProductsGrid = ({ msg, pet, hapticFeedback }) => {
  // REMOVED: Products now only shown in Top Bar PICKS panel
  return null;
}
```

### B) Update Picks Engine to Use Conversation Context
In backend, pass `last_query_topic` to picks scoring.

---

## 7. FILE REFERENCE MAP

| Feature | Frontend Component | Backend Route |
|---------|-------------------|---------------|
| Top Bar PICKS | `PersonalizedPicksPanel.jsx` | `/api/mira/top-picks/{pet_name}` |
| In-Chat Products (REMOVE) | `ChatMessage.jsx` → `ProductsGrid` | `response.products[]` |
| Concierge Home | `ConciergeHomePanel.jsx` | `/api/os/concierge/home` |
| In-Chat Concierge (REMOVE) | `InlineConciergeCard.jsx` | N/A |
| Service Desk | `ServiceDeskWorkspacePage.jsx` | `/api/service-desk/*` |

---

## 8. DECISION POINTS FOR USER

Before implementing, please confirm:

1. **Remove ProductsGrid from chat entirely?** 
   - Yes = Picks only in top bar
   - No = Keep but make context-aware

2. **Remove "C° Need help" from message headers?**
   - Yes = Concierge only via top bar
   - No = Keep as quick access

3. **Should picks auto-update when conversation context changes?**
   - Yes = Goa travel → Travel picks appear
   - No = Manual refresh only

---

*This audit identifies the root cause of "picks not relevant to Goa travel" - the system shows generic pillar-based products in chat instead of conversation-aware picks.*

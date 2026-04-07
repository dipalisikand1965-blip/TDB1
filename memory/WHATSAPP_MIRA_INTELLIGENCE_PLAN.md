# WhatsApp Mira Intelligence Enhancement Plan
## The Doggy Company — Technical Specification
**Created:** April 7, 2026  
**Status:** APPROVED — PENDING IMPLEMENTATION  
**Owner:** Next agent picks this up from here

---

## 1. WHAT WE ARE BUILDING

Upgrade the WhatsApp Mira (`get_mira_ai_response` in `whatsapp_routes.py`) from a basic GPT chatbot into a full Mira-intelligence bot that uses the same semantic search engine as the in-app Mira Search Page.

### Current state (broken):
```
User: "A baby rabbit toy"
→ GPT has no product data → guesses → replies as if user has a pet rabbit
```

### Target state (after this plan):
```
User: "A baby rabbit toy"
→ Semantic search finds: Rope Bunny Chew ₹699, Latex Rabbit Squeaky ₹450
→ Pet profile loaded: Badmash + Sultan = Newfoundlands (big chewers)
→ GPT: "For big chewers like Badmash & Sultan, skip the plush —
        grab the Rope Bunny Chew (₹699). Want me to order it?"
```

---

## 2. WHAT DOES NOT CHANGE (ZERO RISK ZONES)

**Do NOT touch any of these files:**
- `frontend/src/pages/*MobilePage.jsx` — all 12 mobile pillar pages
- `frontend/src/pages/*SoulPage.jsx` — all desktop pillar pages  
- `frontend/src/pages/MiraSearchPage.jsx` — Mira Search page
- `frontend/src/components/MiraChatWidget.jsx` — in-app Mira Widget
- `frontend/src/components/ProductCard.jsx` — product cards
- `frontend/src/hooks/useMiraFilter.js` — client-side filtering
- `backend/unified_product_box.py` — admin product management
- `backend/service_box_routes.py` — admin service management
- `backend/nearby_places_routes.py` — Near Me APIs
- `backend/server.py` — only touch if adding a new route (avoid)

**Only file to modify:** `backend/whatsapp_routes.py`  
**Only function to modify:** `get_mira_ai_response()` (lines ~1195–1327)

---

## 3. THE IMPLEMENTATION PLAN

### Step 1: Load Full Pet Soul Profile
Currently only loads: `name`, `breed`, `date_of_birth`  
**Upgrade to also load:**
```python
pet_fields = {
    "name": 1, "breed": 1, "date_of_birth": 1,
    "allergies": 1, "health_conditions": 1,
    "doggy_soul_answers": 1,  # energy, coat, food preferences
    "favorite_foods": 1,
    "weight": 1, "life_stage": 1,
}
pets = await db.pets.find({"owner_email": user_email}, pet_fields).to_list(5)
```
Then build context: allergies blocked, favorite foods, breed traits, energy level.

### Step 2: Run Message Through Semantic Search
Call the existing `/api/mira/semantic-search` endpoint internally (not via HTTP, but by calling the function directly) to get top 3 matching products/services.

**How to call it internally:**
```python
# Import the search function directly (no HTTP round-trip)
from server import mira_semantic_search_handler

search_results = await mira_semantic_search_handler(
    query=message_text,
    limit=4,
    pet_allergies=pet_allergies_list,
    pillar=None,  # None = universal search across all pillars
)
products = search_results.get("products", [])[:3]
services = search_results.get("services", [])[:2]
```

If direct import is complex, use an internal HTTP call to `http://localhost:8001/api/mira/semantic-search`.

### Step 3: Build Rich Context Block for GPT
```python
# Pet context (already exists, just richer)
context_parts.append(f"Their dogs: {pet_summary}")
if allergies:
    context_parts.append(f"ALLERGIES — avoid: {', '.join(allergies)}")
if favorites:
    context_parts.append(f"Favorite foods: {', '.join(favorites)}")

# NEW: Real products from catalog
if products:
    prod_lines = []
    for p in products:
        price = p.get("original_price") or p.get("price", 0)
        prod_lines.append(f"- {p['name']} (₹{price}) — {p.get('description','')[:60]}")
    context_parts.append(f"RELEVANT PRODUCTS FROM OUR CATALOG:\n" + "\n".join(prod_lines))

if services:
    svc_lines = [f"- {s['name']}: {s.get('description','')[:60]}" for s in services]
    context_parts.append(f"RELEVANT SERVICES:\n" + "\n".join(svc_lines))
```

### Step 4: Enhanced System Prompt
Keep the existing CRITICAL RULES (added April 7). Add:
```
- When recommending products, ALWAYS use real product names and prices from CATALOG above
- Consider the dog's allergies — NEVER recommend products containing allergens
- Match energy level: high-energy dogs need durable toys, calm dogs prefer plush
- Always suggest ordering via Concierge or visiting thedoggycompany.com
```

### Step 5: Maintain Conversation History (Future)
Currently each message creates a fresh LlmChat session (session_id = phone number).
The `emergentintegrations` LlmChat DOES maintain session memory if the session_id is consistent.
This means multi-turn context should already work IF the server hasn't restarted.
For now: leave as-is. Future improvement: store conversation in MongoDB and inject last 5 turns.

---

## 4. WHAT THE `/api/mira/semantic-search` ENDPOINT RETURNS
(Already tested — working)

```json
{
  "success": true,
  "intent_detected": "play",
  "products": [
    {
      "id": "prod-123",
      "name": "Rope Bunny Chew",
      "original_price": 699,
      "description": "Durable rope toy shaped like a rabbit",
      "tags": ["chew", "rope", "large-breed"],
      "pillar": "play"
    }
  ],
  "services": [],
  "total_results": 8
}
```

---

## 5. SEQUENCING / WHEN TO DO THIS

### Phase 0 (DONE — in current redeploy):
- ✅ Fixed `from database import get_db` crash in get_mira_ai_response
- ✅ Fixed `db.tickets` → `db.service_desk_tickets` (conversation history)
- ✅ Added CRITICAL RULES to system prompt (animal names = dog toys)
- ✅ Fixed `LearnNearMe.jsx` broken suggestion handlers
- ✅ Fixed `ProductCard` to read `media.primary_image`

### Phase 1 (DO NEXT — after current redeploy finishes):
1. User tests WhatsApp: send "Hi" to +91 89717 02582
2. Mira should reply with a full AI message (confirms Gupshup fix works)
3. User clicks Redeploy again (pushes ProductCard image fix)

### Phase 2 (THE ENHANCEMENT — after Phase 1 confirmed):
1. Implement Steps 1–4 above in `whatsapp_routes.py`
2. Test in preview with simulated webhook
3. Verify: "baby rabbit toy" → gets real dog toy products
4. Verify: allergen filtering works (dog with chicken allergy → no chicken treats)
5. User deploys

### Phase 3 (FUTURE):
- Inject last 5 conversation turns from `service_desk_tickets.conversation[]` into LlmChat
- This gives full multi-turn context even after server restarts
- Add intent routing: if intent=dine → filter to dine products only

---

## 6. RISKS AND MITIGATIONS

| Risk | Probability | Mitigation |
|---|---|---|
| Semantic search adds latency (2–4s extra) | Medium | Already using background task; WhatsApp users expect ~5s response |
| `server.py` import creates circular dependency | Low | Use internal HTTP call to localhost:8001 instead of direct import |
| GPT hallucinates product names | Low | We inject real product names/prices; prompt says "use ONLY catalog names" |
| Any existing WhatsApp flow breaks | Very Low | Existing fallback to pattern-matching still intact |

---

## 7. SUCCESS CRITERIA

After implementation, test these 3 scenarios:

**Test 1: Product search**
- Send: "Looking for a treat for my dog"
- Expected: Real product names from catalog with prices

**Test 2: Allergen awareness**  
- Update test pet to have chicken allergy
- Send: "What treats do you recommend?"
- Expected: NO chicken-based treats in response

**Test 3: Breed intelligence**
- Pet: Newfoundland (big breed, heavy chewer)
- Send: "Any toy suggestions?"
- Expected: Durable/rope toys recommended, not plush

---

## 8. FILES CHANGED IN THIS ENHANCEMENT (ONLY)

```
backend/whatsapp_routes.py
  → get_mira_ai_response() function only
  → Lines ~1195–1327 (approximate)
  → DO NOT touch any other function in this file
```

**That's it. One function. One file.**

---

*Document created by E1 agent | April 7, 2026*  
*Next agent: Read this entire document before touching a single line of code.*

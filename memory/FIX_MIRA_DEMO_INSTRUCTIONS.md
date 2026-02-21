# FIX MIRA DEMO TO 100% — PASTE THIS TO YOUR MIRA-BIBLE-V1 AGENT

## CONTEXT FOR THE AGENT

Read these files FIRST:
- `/app/memory/MIRA_BIBLE.md`
- `/app/memory/MIRA_COMPLETE_GAP_ANALYSIS_FEB21.md`
- `/app/memory/DIPALI_VISION.md`

The /mira-demo page is broken. Here's what's wrong and EXACTLY how to fix it.

---

## ROOT CAUSE (ONE LINE)

The endpoint `/api/mira/os/understand-with-products` in `/app/backend/mira_routes.py` does NOT call `load_pet_soul()`. The `/api/mira/chat` endpoint DOES. This single missing call makes Mira Demo give generic responses instead of soul-aware personalized ones.

---

## FIX 1 (P0 - CRITICAL): Add load_pet_soul() to /api/mira/os/understand-with-products

**File**: `/app/backend/mira_routes.py`
**Location**: Around line 4285, BEFORE the `understand_with_llm()` call

Add this code BEFORE the understand_with_llm call:

```python
# CRITICAL FIX: Load full Pet Soul from database
enriched_pet_context = request.pet_context or {}
if request.pet_id or (request.pet_context and (request.pet_context.get("id") or request.pet_context.get("name"))):
    pet_identifier = request.pet_id or request.pet_context.get("id") or request.pet_context.get("name")
    loaded_soul = await load_pet_soul(pet_identifier)
    if loaded_soul and loaded_soul.get("name"):
        enriched_pet_context = {**request.pet_context, **loaded_soul} if request.pet_context else loaded_soul
        logger.info(f"[SOUL LOAD] Enriched pet context for {loaded_soul.get('name')}")
```

Then change the understand_with_llm call to use `enriched_pet_context` instead of `request.pet_context`.

---

## FIX 2 (P0): Fix duplicate quick reply chips

**File**: `/app/frontend/src/pages/MiraDemoPage.jsx`

The chat shows quick reply options TWICE — once inside Mira's message bubble AND again as separate buttons below. Find where QuickReplies or quick_replies are rendered and ensure they only render ONCE (inside the message, not duplicated below).

---

## FIX 3 (P0): Fix SERVICES tab navigation

**File**: `/app/frontend/src/pages/MiraDemoPage.jsx`

The SERVICES tab currently navigates away to /shop. It should show services IN the Mira Demo interface, not redirect to another page.

---

## FIX 4 (P1): Fix CONCIERGE tab "Failed to load concierge data"

Check the API endpoint that the Concierge tab calls. It's likely `/api/concierge/os/data` or similar. The endpoint may be crashing or missing. Check backend logs.

---

## FIX 5 (P1): Fix PICKS tab "Could not load personalized picks"

The PICKS tab calls `/api/mira/picks` which returns 404. Check if this endpoint exists in mira_routes.py and if it's properly registered. The picks should be populated on page load, not only after a chat message.

---

## FIX 6 (P1): Add Soul Knowledge Ticker

Import `SoulKnowledgeTicker.jsx` component into MiraDemoPage.jsx. Show pet traits at the top of the chat area (anxiety triggers, favorites, personality).

---

## FIX 7 (P1): Add Smart Chips

Port the smart chip logic from MiraOSModal.jsx into MiraDemoPage.jsx. These should show contextual suggestions like "dairy-free treats", "Calm anxiety" based on pet soul data.

---

## FIX 8 (P2): Fix voice auto-play

Voice should NOT auto-play. Add a user preference/toggle. Only play voice when user clicks the speaker icon.

---

## FIX 9 (P1): Fix CORS for pet-engage-hub

The console shows CORS blocking for `https://pet-engage-hub.emergent.host/api/os/icon-state`. Add CORS headers for thedoggycompany.in origin, or proxy this through the main backend.

---

## TESTING AFTER FIXES

Login: dipali@clubconcierge.in / test123

1. Go to /mira-demo → Login → Should see Mira with pet profile
2. Ask "What do you know about Mystique?" → Should return DETAILED soul data (anxiety triggers, favorites, personality), NOT generic breed info
3. Click Birthday Party scenario → Quick replies should appear ONCE (not duplicated)
4. Click PICKS tab → Should show personalized picks immediately
5. Click SERVICES tab → Should show services IN-PAGE, not redirect to /shop
6. Click CONCIERGE tab → Should show concierge data, not error
7. Voice should NOT auto-play

---

## PRIORITY ORDER

1. FIX 1 (load_pet_soul) — This fixes 70% of problems
2. FIX 2 (duplicate chips) — Visual bug
3. FIX 3 (Services redirect) — Navigation bug
4. FIX 5 (Picks loading) — Empty state bug
5. FIX 4 (Concierge tab) — Data loading bug
6. FIX 6-7 (Soul ticker + Smart chips) — Missing features
7. FIX 8-9 (Voice + CORS) — Polish

---

*Generated from full codebase audit + bible study, February 21, 2026*

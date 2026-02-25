# CRITICAL HANDOFF - MIRA INTELLIGENCE FIX

## URGENT ISSUE DISCOVERED (Feb 21, 2026)

### THE PROBLEM:
**MiraOS BETA** (on pillar pages like /paperwork) gives BRILLIANT, detailed responses about pets.
**MiraDemo** (/mira-demo) gives VAGUE responses like "we're still learning about her preferences..."

### ROOT CAUSE FOUND:
They call **DIFFERENT backend endpoints**:

| Component | Endpoint | Response Quality |
|-----------|----------|------------------|
| MiraOS BETA (works) | `/api/mira/chat` | ✅ BRILLIANT - Full pet details |
| MiraDemo (broken) | `/api/mira/os/understand-with-products` | ❌ VAGUE - Missing pet context |

### PROOF (curl tests done):
```bash
# /api/mira/chat returns:
"Oh, Lola... I love when you ask this, because I really do know her inside-out.
She's a small female Maltese, around 3.2 kg, born 31 January 2024.
Her energy level is high... allergies to lamb, beef, peanuts..."

# /api/mira/os/understand-with-products returns:
"From what I know about Lola, we're still learning about her personality and preferences..."
```

### FIX ALREADY APPLIED TO FRONTEND (needs backend fix too):

**File: `/app/frontend/src/hooks/mira/useChatSubmit.js`**
- Added full pet_context with allergies, sensitivities, preferences, personality, soul_score, etc.
- Lines ~297-350

### BACKEND FIX NEEDED:

**File: `/app/backend/mira_routes.py`**

The issue is in the `understand-with-products` endpoint (around line 11300+):
1. It loads `selected_pet` from database via `load_pet_soul()` 
2. But the **system prompt** being built doesn't use all the pet data like `/api/mira/chat` does

**Specifically check lines:**
- 11370-11390: Where `selected_pet` is set
- 13564-13571: Where `build_mira_system_prompt()` is called
- 9034-9200: The `build_mira_system_prompt()` function itself

**Compare with how `/api/mira/chat` builds its context** - it must be doing something different that makes it work better.

---

## OTHER ISSUES TO FIX:

### 1. Voice Missing on MiraDemo
- MiraOS BETA and FAB have voice input/output
- MiraDemo (/mira-demo) has NO voice
- Files: `/app/frontend/src/components/MiraChatWidget.jsx` has voice code to reference

### 2. FAB Missing pet_context
- `/app/frontend/src/components/MiraChatWidget.jsx`
- Only sends `selected_pet_id`, not full `pet_context`
- Should match what MiraOS sends

### 3. user_learn_intents Not Persisting (from handoff summary)
- Recurring bug - chat intents not saving to MongoDB
- Collection: `user_learn_intents`

---

## USER'S VISION (Dipali - The Doggy Company):

**Freemium (FAB on pillars):** Basic Mira with pillar context
**Paid (MiraDemo):** Full Mira with ALL pet context, memory, soul voice

**The "Soul Voice"** - Mira should speak with:
- Empathy and warmth
- Complete knowledge of the pet
- Tone like: "Oh, Lola... I love when you ask this, because I really do know her inside-out"

---

## TEST CREDENTIALS:
- Email: `dipali@clubconcierge.in`
- Password: `test123`
- Test pet: Lola (ID: `pet-e6348b13c975`)

## TEST PAGES:
- `/mira-demo` - Should show full pet intelligence (CURRENTLY BROKEN)
- `/paperwork` - Has MiraOS BETA widget (WORKING - use as reference)

## CURL TEST COMMANDS:
```bash
# Login
TOKEN=$(curl -s -X POST "http://localhost:8001/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"dipali@clubconcierge.in","password":"test123"}' | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))")

# Test MiraOS BETA endpoint (WORKS)
curl -s -X POST "http://localhost:8001/api/mira/chat" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"What do you know about Lola?","session_id":"test","selected_pet_id":"pet-e6348b13c975"}'

# Test MiraDemo endpoint (BROKEN - needs fix)
curl -s -X POST "http://localhost:8001/api/mira/os/understand-with-products" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"input":"What do you know about Lola?","pet_id":"pet-e6348b13c975","session_id":"test"}'
```

---

## PRIORITY ORDER:
1. **P0**: Fix `/api/mira/os/understand-with-products` to return same quality as `/api/mira/chat`
2. **P1**: Add voice to MiraDemo
3. **P2**: Fix FAB pet_context
4. **P3**: Fix user_learn_intents persistence

---

## KEY FILES:
- `/app/backend/mira_routes.py` - Main backend (lines 11275+ for /chat, 11300+ for /understand-with-products)
- `/app/frontend/src/hooks/mira/useChatSubmit.js` - MiraDemo chat hook (already fixed)
- `/app/frontend/src/components/mira-os/MiraOSModal.jsx` - MiraOS BETA component (working reference)
- `/app/frontend/src/components/MiraChatWidget.jsx` - FAB component
- `/app/frontend/src/pages/MiraDemoPage.jsx` - MiraDemo page

## CRITICAL: The user (Dipali) is extremely frustrated after multiple sessions. Handle with care and FIX THIS PROPERLY.

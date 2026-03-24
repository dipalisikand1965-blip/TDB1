# 🚨 AGENT ONBOARDING - READ THIS FIRST 🚨
## The Doggy Company - Pet Soul Platform
## Last Updated: February 21, 2026

---

## WHO IS THE USER?

**Dipali** - Founder of a premium pet concierge service. She's:
- Detail-oriented and expects EXACT functionality matches
- Has invested heavily in "bibles" and "doctrines" for the product
- Cares deeply about "Mira" (the AI assistant) being "magical"
- Test user is `dipali@clubconcierge.in` / `test123`

---

## WHAT IS THIS PRODUCT?

A digital platform that builds a "soul" for pets. Key concepts:

1. **Pet Soul** - A living profile that grows through conversations
2. **Mira** - The AI assistant that knows each pet intimately
3. **Soul Score** - Percentage showing how "complete" the pet's soul is (grows with interactions)
4. **Soul Builder** - Onboarding flow to capture initial pet data

---

## 🔴 CRITICAL: ALWAYS READ THE BIBLES

Before touching ANY Mira code, read these files:

```
/app/memory/MIRA_BIBLE.md         # Core principles - MEMORY FIRST
/app/memory/MIRA_DOCTRINE.md      # Voice, tone, behavior rules  
/app/memory/MIRA_CONVERSATION_RULES.md  # Chat flow rules
/app/memory/MIRA_VOICE_RULES.md   # Voice integration rules
/app/memory/PROFILE_FIRST_DOCTRINE.md   # Pet data > Breed assumptions
/app/memory/BIBLE_INDEX.md        # Index of all 159 files
```

---

## 📁 KEY FILES

| What | File | Purpose |
|------|------|---------|
| Main Chat Page | `/app/frontend/src/pages/MiraDemoPage.jsx` | The premium Mira chat UI (~4000 lines) |
| Chat Logic | `/app/frontend/src/hooks/mira/useChatSubmit.js` | Handles sending messages, quick replies |
| Message Render | `/app/frontend/src/components/Mira/ChatMessage.jsx` | Renders Mira's responses |
| Backend Chat | `/app/backend/server.py` (lines 2700-3200) | Chat endpoint, pet context building |
| Quick Replies | Same file (lines 1130-1149) | Prioritize contextual over generic |

---

## 🔧 RECENT FIXES (Feb 21, 2026)

### Quick Replies ✅
**Before**: "View in Services", "Add one detail" (generic)
**After**: "Stick with kibble", "Add home-cooked" (contextual)
**Changed**: useChatSubmit.js, MiraDemoPage.jsx, ChatMessage.jsx

### Soul Score ✅
**Before**: Showed 56% (recalculated)
**After**: Shows 62% (uses stored value from conversations)
**Changed**: server.py /api/pets/my-pets endpoint

### Allergy Merging ✅
**Before**: Only loaded preferences.allergies
**After**: Merges from 3 sources (preferences + doggy_soul_answers + root)
**Changed**: server.py pet context building

---

## 🧪 HOW TO TEST

```bash
# 1. Login and get token
TOKEN=$(curl -s -X POST 'https://learn-pillar-audit.preview.emergentagent.com/api/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{"email":"dipali@clubconcierge.in","password":"test123"}' | \
  python3 -c 'import sys,json;print(json.load(sys.stdin).get("access_token",""))')

# 2. Test chat (should mention allergies without asking)
curl -X POST "https://learn-pillar-audit.preview.emergentagent.com/api/mira/chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"message": "What food for Lola?", "session_id": "test-123"}'

# 3. Test pets API (Lola should show ~62% score)
curl "https://learn-pillar-audit.preview.emergentagent.com/api/pets/my-pets" \
  -H "Authorization: Bearer $TOKEN"
```

---

## ⚠️ DO NOT BREAK THESE

1. **Quick Reply Priority Order** - Contextual first, then generic fallback
2. **Soul Score Calculation** - Uses max(stored, calculated)
3. **Allergy Merging** - All 3 sources must be included
4. **Voice Integration** - ElevenLabs primary, OpenAI fallback

---

## 📋 REMAINING TASKS

1. **P1: Voice Testing** - Test per MIRA_VOICE_RULES (stop on tile click, etc.)
2. **P2: Soul Builder** - Complete onboarding flow
3. **P3: Unify Components** - Merge 3 Mira implementations

---

## 🔗 URLS

- **Preview**: https://learn-pillar-audit.preview.emergentagent.com
- **Production**: https://thedoggycompany.in
- **To deploy**: Click "Replace deployment" on Emergent platform

---

## 📚 ADDITIONAL CONTEXT FILES

- `/app/memory/PRD.md` - Full product requirements
- `/app/memory/CONTEXT.md` - Technical architecture details
- `/app/memory/HANDOFF.md` - Session handoff notes

---

*The user expects preview = production always.*
*Any database or code changes should be deployed promptly.*

# MIRA OS - COMPREHENSIVE CONTEXT FOR AGENTS
## Last Updated: February 21, 2026

---

## 🚨 CRITICAL: READ THESE BIBLES FIRST

Before making ANY changes to Mira, read these canonical documents:

| Bible | Purpose | Path |
|-------|---------|------|
| **MIRA_BIBLE** | Core principles - Memory First, Never Dead End | `/app/memory/MIRA_BIBLE.md` |
| **MIRA_DOCTRINE** | Voice, tone, execution classification | `/app/memory/MIRA_DOCTRINE.md` |
| **MIRA_CONVERSATION_RULES** | Pre-conversation checklist, memory extraction | `/app/memory/MIRA_CONVERSATION_RULES.md` |
| **MIRA_VOICE_RULES** | Voice sync, skip on tile click | `/app/memory/MIRA_VOICE_RULES.md` |
| **PROFILE_FIRST_DOCTRINE** | Never assume from breed, use actual pet data | `/app/memory/PROFILE_FIRST_DOCTRINE.md` |
| **BIBLE_INDEX** | Complete index of all bibles | `/app/memory/BIBLE_INDEX.md` |

---

## 🏗️ ARCHITECTURE OVERVIEW

```
/app
├── backend/
│   ├── server.py           # Monolithic FastAPI (~12,000 lines)
│   │   ├── /api/mira/chat  # Main chat endpoint (line ~2700-3200)
│   │   ├── /api/pets/*     # Pet CRUD operations
│   │   └── /api/auth/*     # Authentication
│   ├── tts_routes.py       # ElevenLabs + OpenAI TTS fallback
│   └── .env                # Keys: MONGO_URL, ELEVENLABS_API_KEY, EMERGENT_LLM_KEY
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── MiraDemoPage.jsx    # Main chat UI (~4000 lines)
│   │   │   ├── MemberDashboard.jsx # User dashboard
│   │   │   └── SoulBuilder.jsx     # Onboarding (incomplete)
│   │   ├── hooks/
│   │   │   └── mira/
│   │   │       ├── useChatSubmit.js # Chat submission logic
│   │   │       └── useVoice.js      # Voice hook
│   │   └── components/
│   │       └── Mira/              # All Mira components
│   └── .env                       # REACT_APP_BACKEND_URL
│
└── memory/                        # 159 documentation files
    ├── *_BIBLE.md                 # Canonical doctrines
    └── *_AUDIT.md                 # Audit reports
```

---

## 🔑 KEY TECHNICAL DETAILS

### Database
- **MongoDB**: `mongodb://localhost:27017`
- **Database**: `test_database`
- **Key Collections**: `pets`, `users`, `mira_memories`, `service_desk_tickets`

### Authentication
- **User**: `dipali@clubconcierge.in` / `test123`
- **Admin**: `aditya` / `lola4304`

### APIs
- **Main Chat**: `POST /api/mira/chat`
- **Pets**: `GET /api/pets/my-pets`
- **TTS**: `POST /api/tts/generate`

### Voice
- **Primary**: ElevenLabs (key in .env)
- **Fallback**: OpenAI TTS via EMERGENT_LLM_KEY

---

## ✅ WHAT'S WORKING (Verified Feb 21, 2026)

| Feature | Status | Evidence |
|---------|--------|----------|
| Contextual Quick Replies | ✅ FIXED | Shows "Stick with kibble" not "View in Services" |
| Soul Score Display | ✅ FIXED | Shows 62% (database value, not recalculated) |
| Pet Context Loading | ✅ WORKING | Mira references allergies, preferences |
| Voice Integration | ✅ WORKING | ElevenLabs with OpenAI fallback |
| Memory Whisper | ✅ WORKING | Shows "I recall what Lola enjoys" |
| Allergy Merging | ✅ FIXED | Merges preferences + doggy_soul_answers |

---

## 🔧 FIXES APPLIED THIS SESSION

### Fix 1: Quick Replies (P0)
**Problem**: Generic buttons ("View in Services") instead of contextual ("Stick with kibble")
**Files Changed**:
- `useChatSubmit.js` (lines 1130-1149) - Use contextual replies first
- `MiraDemoPage.jsx` (extractQuickReplies) - Priority order changed
- `ChatMessage.jsx` (lines 1030-1050) - Filter contract replies when contextual exist

### Fix 2: Soul Score (P1)
**Problem**: Dashboard showed 56% instead of 62%
**File Changed**: `server.py` (lines 11202-11230)
**Fix**: Use `max(stored_score, calculated_score)` to reflect conversation-based growth

### Fix 3: Allergy Merging (Medium)
**Problem**: Only `preferences.allergies` loaded, not `doggy_soul_answers.allergies`
**File Changed**: `server.py` (lines 2918-2945)
**Fix**: Merge allergies from all three sources

---

## ⚠️ KNOWN ISSUES / BACKLOG

### P1 - Voice Testing
Voice works but needs comprehensive testing per MIRA_VOICE_RULES:
- [ ] Voice stops on tile click
- [ ] Voice stops when typing
- [ ] No overlap on rapid clicks

### P2 - Soul Builder
`SoulBuilder.jsx` is incomplete. Needs:
- Backend endpoints for saving progress
- "Save & finish later" feature
- Integration with main onboarding flow

### P3 - Component Unification
Three Mira implementations exist:
- `MiraDemoPage.jsx` - Main demo
- `MiraOSModal.jsx` - BETA widget
- `MiraChatWidget.jsx` - FAB (legacy)

Should consolidate into one.

---

## 📋 MIRA BIBLE COMPLIANCE CHECKLIST

When making ANY changes to Mira, verify:

- [ ] **Memory First**: Pet data loaded BEFORE response generation
- [ ] **Never Ask Known Data**: If allergy in profile, don't ask for it
- [ ] **Profile-First**: Use THIS pet's data, not generic breed info
- [ ] **One Question at a Time**: Never multiple clarifying questions
- [ ] **Never Dead End**: Always provide path forward (CTA)
- [ ] **Acknowledge First**: Show empathy before recommendations
- [ ] **Contextual Picks**: Products match conversation topic
- [ ] **Voice Emotion**: Voice tone matches intent (happy/calm/etc.)

---

## 🧪 TESTING REQUIREMENTS

### Before Finishing Any Mira Change:
1. Log in as `dipali@clubconcierge.in`
2. Send food-related query
3. Verify allergies mentioned without asking
4. Verify quick replies are contextual
5. Verify voice plays (if enabled)
6. Verify soul score matches database

### Quick Test Commands:
```bash
# Test chat API
curl -X POST "$API/api/mira/chat" -H "Content-Type: application/json" \
  -d '{"message": "What food for Lola?", "session_id": "test", "pet_name": "Lola"}'

# Test TTS
curl -X POST "$API/api/tts/generate" -H "Content-Type: application/json" \
  -d '{"text": "Hello from Mira"}'

# Check Lola's allergies
mongo test_database --eval "db.pets.findOne({name: /Lola/i}, {doggy_soul_answers: 1, preferences: 1})"
```

---

## 📁 CRITICAL FILES (DO NOT BREAK)

| File | Purpose | Lines of Interest |
|------|---------|-------------------|
| `MiraDemoPage.jsx` | Main UI | ~4000 lines, complex state |
| `useChatSubmit.js` | Chat logic | 1130-1149 (quick replies) |
| `ChatMessage.jsx` | Message render | 1030-1050 (contract filter) |
| `server.py` | Backend | 2700-3200 (chat), 11200 (pets API) |
| `MIRA_DOCTRINE.md` | Sacred | DO NOT MODIFY without approval |

---

## 🔗 PRODUCTION SYNC

- **Preview**: `doggy-soul-app.preview.emergentagent.com`
- **Production**: `thedoggycompany.in`
- **Sync Method**: "Replace deployment" on Emergent platform
- **Database**: Both use same MongoDB after deployment

---

*This context file ensures continuity across agent sessions.*
*Always update this file when making significant changes.*

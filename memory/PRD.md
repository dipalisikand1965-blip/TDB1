# Pet Soul Platform - Product Requirements Document
## Last Updated: February 21, 2026

---

## Original Problem Statement

The user, Dipali, founder of a premium pet concierge service, wants to build a "soul" for pets through a digital platform. Key pillars are a "magical" and gamified "Soul Builder" onboarding, unifying the multiple "Mira" chat implementations into a single superior experience, and improving the overall UI/UX to feel "premium."

---

## Core Requirements (Non-Negotiable)

1. **Fix Mira's Intelligence & UX** ✅ COMPLETE - The main demo chat (`/mira-demo`) is now identical in intelligence, tone, format, and functionality to the superior `Mira OS BETA` experience.

2. **Build a Brilliant Onboarding** - Design and build the new, single-flow "Soul Builder." (IN PROGRESS)

3. **Unify the "Mira" Experience** - Consolidate the three different "Mira" implementations into one. (BACKLOG)

4. **Make Pillar Pages Magical** - Apply the new template from `/celebrate-new` to all other pillar pages. (BACKLOG)

5. **Fix Core Bugs** ✅ COMPLETE - Quick replies, soul score, allergy merging all fixed.

---

## What's Been Implemented

### Session: February 21, 2026

#### P0 - Quick Replies Fix ✅
- **Issue**: Quick reply buttons showed generic navigational options instead of contextual conversation options
- **Fix**: Changed priority order in `useChatSubmit.js`, `MiraDemoPage.jsx`, `ChatMessage.jsx`
- **Result**: Now shows "Stick with kibble", "Add home-cooked" etc.

#### P1 - Soul Score Display Fix ✅
- **Issue**: Dashboard showed 56% instead of actual 62%
- **Fix**: Backend now uses `max(stored_score, calculated_score)`
- **Result**: Soul growth from conversations properly reflected

#### Allergy Merging Fix ✅
- **Issue**: Backend only loaded one allergy source
- **Fix**: Merges allergies from preferences + doggy_soul_answers + root level
- **Result**: All of Lola's allergies (beef, corn, Dairy) now loaded

#### Comprehensive MIRA Bible Audit ✅
- **Result**: 95% backend / 100% frontend compliance
- **Verified**: Profile-First, Memory First, Never Dead End, Voice Integration

---

## Prioritized Backlog

### P1 (High Priority)
- [ ] **Voice Testing** - Comprehensive test per MIRA_VOICE_RULES
- [ ] **Soul Builder Completion** - Finish `SoulBuilder.jsx` with backend endpoints

### P2 (Medium Priority)
- [ ] **Unify Mira Components** - Consolidate MiraDemoPage, MiraOSModal, MiraChatWidget

### P3 (Future)
- [ ] Rebuild `/mira-demo` using `MiraOSModal` as base
- [ ] Implement "Read Receipts" for messages
- [ ] Refactor `backend/server.py` monolith
- [ ] Apply `/celebrate-new` template to pillar pages

---

## Code Architecture

```
/app
├── backend/
│   └── server.py        # Monolithic FastAPI (~12,000 lines)
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── MiraDemoPage.jsx    # Main chat (~4000 lines)
│   │   │   ├── MemberDashboard.jsx # User dashboard
│   │   │   └── SoulBuilder.jsx     # Onboarding (incomplete)
│   │   ├── hooks/mira/
│   │   │   ├── useChatSubmit.js    # Chat logic
│   │   │   └── useVoice.js         # Voice integration
│   │   └── components/
│   │       ├── Mira/               # Chat components
│   │       └── mira-os/            # OS modal components
└── memory/                         # 159 bible/doctrine files
```

---

## Key API Endpoints

| Endpoint | Purpose | Notes |
|----------|---------|-------|
| `/api/mira/chat` | Main chat | Uses pet context, returns contextual quick replies |
| `/api/pets/my-pets` | Get user's pets | Now uses max(stored, calculated) for score |
| `/api/tts/generate` | Text-to-speech | ElevenLabs primary, OpenAI fallback |

---

## Database Schema

- **Collection**: `pets`
  - `overall_score`: Soul percentage (grows with conversations)
  - `doggy_soul_answers`: Profile data from onboarding
  - `preferences`: Food, activity, care preferences
  - `soul.learned_facts`: Facts learned from conversations

- **Collection**: `users`
  - Standard auth fields + pet ownership

- **Collection**: `mira_memories`
  - Conversation history for context

---

## Test Credentials

| Role | Email | Password |
|------|-------|----------|
| User | dipali@clubconcierge.in | test123 |
| Admin | aditya | lola4304 |

---

## 3rd Party Integrations

| Service | Purpose | Key Location |
|---------|---------|--------------|
| ElevenLabs | Voice TTS | ELEVENLABS_API_KEY in .env |
| OpenAI | LLM + TTS fallback | EMERGENT_LLM_KEY |
| Google Places | Location services | GOOGLE_PLACES_API_KEY |
| Resend | Email | RESEND_API_KEY |
| Firebase | Auth fallback | FIREBASE_* keys |

---

## MIRA Bible Compliance

All changes MUST comply with:

1. **MIRA_BIBLE** - Memory First, Never Dead End, Catalogue First
2. **MIRA_DOCTRINE** - Voice tone, execution classification
3. **MIRA_CONVERSATION_RULES** - Pre-conversation checklist
4. **MIRA_VOICE_RULES** - Voice sync, skip on interaction
5. **PROFILE_FIRST_DOCTRINE** - Use pet data, not breed assumptions

See `/app/memory/BIBLE_INDEX.md` for complete list.

---

## URLs

- **Preview**: https://doggy-soul-app.preview.emergentagent.com
- **Production**: https://thedoggycompany.in
- **Sync**: Use "Replace deployment" on Emergent platform

# Pet Soul - Mira OS Product Requirements Document

**Last Updated:** February 18, 2026

---

## Original Problem Statement

Create a "Golden Standard Communication System" centered around an AI named "Mira." Development is guided by `PET_OS_BEHAVIOR_BIBLE.md`. 

### Core Architectural Rules:

1. **"Uniform Service Flow"** - All service actions create/attach to a single canonical "Service Desk Ticket" spine using `TCK-YYYY-NNNNNN` ID format

2. **"Health-First Safety Rule"** - Pet health facts always override conflicting preferences

3. **Mental Model**: 
   > "Chat is where you ask. Services is where it gets done. Notifications simply bring you back to the thread."

---

## Current System Status

### One Spine: ✅ CERTIFIED
### Notification System: ✅ FIXED
### Ticket-to-Soul Enrichment: ✅ COMPLETE
### LEARN Tab: ✅ WORKING

### NEW: Mira Soul Integration (Feb 18, 2026): ✅ COMPLETE

**Mira now "knows" what the pet parent is thinking about across all OS layers:**

| Layer | Feature | Status |
|-------|---------|--------|
| LEARN | "{petName} might need this" shelf | ✅ Working |
| PICKS | "Lola might need this" shelf | ✅ Working |
| Shared Intent Store | `user_learn_intents` collection | ✅ Working |
| Intent Capture | 50+ keywords → 10 topic categories | ✅ Working |

**How It Works:**
1. User chats about "travel" → Intent captured in `user_learn_intents`
2. User opens LEARN → Travel guides appear in "{petName} might need this"
3. User opens PICKS → Travel products appear in "{petName} might need this"
4. Badge: "Timely" (amber) - Mira knows, no "based on your chat" messaging

**Files:**
- `/app/backend/learn_intent_bridge.py` - Intent extraction & storage
- `/app/backend/learn_os_routes.py` - LEARN integration
- `/app/backend/app/api/top_picks_routes.py` - PICKS integration

---

## What's Been Implemented

### February 18, 2026 (Current Session)

1. **Conversation-to-LEARN Contextual Bridge** - ✅ COMPLETE
   - Intent capture from chat (50+ keywords)
   - "{petName} might need this" shelf in LEARN
   - "Timely" badge on contextual items

2. **PICKS Soul Integration** - ✅ COMPLETE
   - PICKS reads from shared intent store
   - "{petName} might need this" shelf in PICKS
   - Soul-aware "why_it_fits" reasons: "Safe travels with Lola"
   - Email-to-UUID resolution for user matching

3. **LEARN Tab Verification** - ✅ CONFIRMED WORKING

### Previous Sessions
- "Send to Concierge" Admin Notifications
- "What Mira Learned" UI in MOJO Profile
- 20-point Mobile Audit
- Ticket-to-Soul E2E Flow
- Notification Deep-Link Fix
- "Concierge®" Branding

---

## Prioritized Backlog

### P0 - Critical
- [x] ~~One Spine certification~~ ✅
- [x] ~~Conversation-to-LEARN Bridge~~ ✅
- [x] ~~PICKS Soul Integration~~ ✅
- [ ] **UI Improvement: "Test Scenarios" Panel** - Move to bottom sheet
- [ ] **UI Improvement: "Concierge Replied" Banner** - Compact banner

### P1 - High Priority
- [ ] **TODAY Soul Integration** - Contextual TODAY content
- [ ] **"All pets" toggle** in notification dropdown
- [ ] **Soul-Capture Onboarding** - 8-10 step experience

### P2 - Medium Priority
- [ ] WhatsApp Webhook Idempotency
- [ ] Legacy Ticket Migration

### P3 - Backlog
- [ ] Refactor `mira_routes.py`
- [ ] Refactor `MiraDemoPage.jsx`

---

## Test Credentials

```
Email: dipali@clubconcierge.in
Password: test123
URL: /mira-demo

Admin: aditya@thedoggycompany.in / lola4304
```

---

## Key API Endpoints

| Endpoint | Purpose |
|----------|---------|
| POST `/api/mira/chat` | Chat (captures intents) |
| GET `/api/os/learn/home?pet_id=X` | LEARN (includes from_your_chat) |
| GET `/api/mira/top-picks/{pet_id}` | PICKS (includes timely_picks) |

---

## 3rd Party Integrations

Google Places, YouTube, WhatsApp (Gupshup, Meta), Resend, Shopify, ElevenLabs, Firebase

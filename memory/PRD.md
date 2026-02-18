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

## Documentation Hierarchy

| Priority | Document | Purpose |
|----------|----------|---------|
| 1 | `/app/memory/AGENT_MASTER_PROTOCOL.md` | **THE MASTER PROTOCOL** - Read first |
| 2 | `/app/memory/PET_OS_BEHAVIOR_BIBLE.md` | The Law - Design specification |
| 3 | `/app/memory/ONE_SPINE_SPEC.md` | Ticket system spec, 5 Hard Proofs |
| 4 | `/app/memory/LEARN_BIBLE.md` | LEARN OS Layer specification |
| 5 | `/app/memory/PRD.md` | This file - Product requirements |

---

## Current System Status

### One Spine: ✅ CERTIFIED
### Notification System: ✅ FIXED
### Ticket-to-Soul Enrichment: ✅ COMPLETE
### LEARN Tab: ✅ WORKING

### NEW: Conversation-to-LEARN Bridge: ✅ COMPLETE (Feb 18, 2026)

| Feature | Status |
|---------|--------|
| Intent extraction from chat | ✅ Working |
| Intent storage (48-hour TTL) | ✅ Working |
| LEARN content boosting (+15 score) | ✅ Working |
| "Based on your chat" shelf | ✅ Working |
| Blue contextual badges | ✅ Working |
| API returns conversation_context | ✅ Working |

**Files Created/Modified:**
- `/app/backend/learn_intent_bridge.py` (NEW)
- `/app/backend/learn_os_routes.py` (Modified)
- `/app/backend/mira_routes.py` (Modified)
- `/app/frontend/src/components/Mira/LearnPanel.jsx` (Modified)

---

## What's Been Implemented

### February 18, 2026 (Current Session)

1. **Conversation-to-LEARN Contextual Bridge** - ✅ COMPLETE
   - When user discusses a topic in chat, LEARN automatically surfaces relevant content
   - Intent capture from chat messages (50+ keywords → 9 topic categories)
   - "Based on your chat" shelf appears at top of LEARN
   - Blue badges indicate contextually relevant items
   - Intent TTL: 48 hours

2. **LEARN Tab Bug Investigation** - ✅ VERIFIED WORKING
   - Tab navigation functioning correctly
   - Personalization loading properly
   - Bible-compliant detail view structure

### Previous Sessions

1. **"Send to Concierge" Admin Notifications** - ✅ FIXED
2. **"What Mira Learned" UI in MOJO Profile** - ✅ IMPLEMENTED
3. **20-point Mobile Audit** - ✅ COMPLETED
4. **Ticket-to-Soul E2E Flow** - ✅ VERIFIED
5. **Notification Deep-Link Fix** - ✅ VERIFIED
6. **"Concierge®" Branding** - ✅ 13 files updated
7. **One Spine Re-Audit** - ✅ All 5 proofs passing

---

## Prioritized Backlog

### P0 - Critical
- [x] ~~One Spine certification~~ ✅ DONE
- [x] ~~Notification system fixes~~ ✅ DONE
- [x] ~~Fix LEARN Tab~~ ✅ VERIFIED WORKING
- [x] ~~Conversation-to-LEARN Bridge~~ ✅ COMPLETE
- [ ] **UI Improvement: "Test Scenarios" Panel** - Move to bottom sheet
- [ ] **UI Improvement: "Concierge Replied" Banner** - Convert to compact single-line banner

### P1 - High Priority
- [ ] **"All pets" toggle** in notification dropdown
- [ ] **Soul-Capture Onboarding** - 8-10 step experience
- [ ] **Mobile Specs Audit** - Typography & tap targets vs Bible

### P2 - Medium Priority
- [ ] WhatsApp Webhook Idempotency
- [ ] Legacy Ticket Migration (134+ to TCK-*)

### P3 - Backlog
- [ ] Refactor `mira_routes.py` (20k+ lines)
- [ ] Refactor `MiraDemoPage.jsx`
- [ ] Push notification system

---

## Test Credentials

```
Email: dipali@clubconcierge.in
Password: test123
URL: /mira-demo?debug=1

Admin Login:
Email: aditya@thedoggycompany.in
Password: lola4304

Enriched Pets:
- Mystique (senior, arthritis, chicken/wheat allergy)
- Lola (young, energetic, default pet)
```

---

## Key API Endpoints

| Endpoint | Purpose |
|----------|---------|
| POST `/api/mira/chat` | Main chat (now captures intents for LEARN) |
| GET `/api/os/learn/home?pet_id=X` | LEARN home (now includes from_your_chat shelf) |
| GET `/api/os/learn/topic/{topic}` | LEARN topic content |

---

## Key Files

### Backend
- `/app/backend/mira_routes.py` - Main chat (integrates intent bridge)
- `/app/backend/learn_os_routes.py` - LEARN OS Layer (conversation context)
- `/app/backend/learn_intent_bridge.py` - NEW: Intent extraction and storage

### Frontend
- `/app/frontend/src/components/Mira/LearnPanel.jsx` - LEARN panel (from_your_chat shelf)

---

## 3rd Party Integrations

- Google Places
- YouTube
- WhatsApp (Gupshup, Meta)
- Resend
- Shopify
- ElevenLabs
- Firebase

---

## The Rule

> **If you break One Spine, you break the entire user experience.**

Read the protocol. Follow the QA. Every. Single. Time.

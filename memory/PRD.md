# Pet Soul - Mira OS Product Requirements Document

**Last Updated:** February 18, 2026

---

## Original Problem Statement

Create a "Golden Standard Communication System" centered around an AI named "Mira." 

### Core Rules:
1. **"Uniform Service Flow"** - All actions create/attach to ticket spine (TCK-*)
2. **"Health-First Safety Rule"** - Health facts override preferences
3. **Mental Model**: "Chat is where you ask. Services is where it gets done."

---

## 🧠 Mira Soul Integration - COMPLETE

**Mira now "knows" what the pet parent is thinking about across ALL OS layers:**

| Layer | Feature | Status |
|-------|---------|--------|
| **LEARN** | "{petName} might need this" guides | ✅ Working |
| **PICKS** | "{petName} might need this" products | ✅ Working |
| **SERVICES** | "{petName} might need this" services | ✅ Working |

**How It Works:**
1. User chats about topic (e.g., "travel") → Intent captured
2. Intent stored in `user_learn_intents` collection (48hr TTL)
3. LEARN, PICKS, SERVICES all read from same store
4. Each shows "{petName} might need this" shelf with "Timely" badge
5. Soul-aware reasons like "Lola's travel arrangements"

**Files:**
- `/app/backend/learn_intent_bridge.py` - Intent extraction
- `/app/backend/learn_os_routes.py` - LEARN integration
- `/app/backend/app/api/top_picks_routes.py` - PICKS integration  
- `/app/backend/services_routes.py` - SERVICES integration

---

## Current System Status

| System | Status |
|--------|--------|
| One Spine | ✅ CERTIFIED |
| Notification System | ✅ FIXED |
| Ticket-to-Soul Enrichment | ✅ COMPLETE |
| LEARN Tab | ✅ WORKING |
| Soul Integration (LEARN/PICKS/SERVICES) | ✅ COMPLETE |

---

## Prioritized Backlog

### P0 - Critical
- [x] ~~Soul Integration - LEARN~~ ✅
- [x] ~~Soul Integration - PICKS~~ ✅
- [x] ~~Soul Integration - SERVICES~~ ✅
- [ ] **UI: "Test Scenarios" Panel** - Move to bottom sheet
- [ ] **UI: "Concierge Replied" Banner** - Compact banner

### P1 - High Priority
- [ ] **TODAY Soul Integration** - Contextual TODAY content
- [ ] **"All pets" toggle** in notifications
- [ ] **Soul-Capture Onboarding** - 8-10 steps

### P2 - Medium Priority
- [ ] WhatsApp Webhook Idempotency
- [ ] Legacy Ticket Migration

### P3 - Backlog
- [ ] Refactor monoliths

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

| Endpoint | Soul Integration |
|----------|-----------------|
| POST `/api/mira/chat` | Captures intents |
| GET `/api/os/learn/home?pet_id=X` | Returns `from_your_chat` shelf |
| GET `/api/mira/top-picks/{pet_id}` | Returns `timely_picks` shelf |
| GET `/api/os/services/launchers?pet_id=X` | Returns `timely_services` shelf |

---

## 3rd Party Integrations

Google Places, YouTube, WhatsApp, Resend, Shopify, ElevenLabs, Firebase

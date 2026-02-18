# Pet Soul - Mira OS Product Requirements Document

**Last Updated:** February 18, 2026

---

## ⛔ CRITICAL: Complete Handover Protocol First

**STEP 1:** Read `/app/memory/MANDATORY_HANDOVER_PROTOCOL.md`
**STEP 2:** Paste STATE SNAPSHOT at session start
**STEP 3:** Confirm NON-NEGOTIABLES
**STEP 4:** Read this file (PRD.md)

---

## ⚠️ Then Read Technical Protocol

`/app/memory/AGENT_MASTER_PROTOCOL.md` - Full technical reference

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
| 4 | `/app/memory/ONE_SPINE_AUDIT_REPORT.md` | Latest One Spine audit |
| 5 | `/app/memory/NOTIFICATION_SYSTEM_AUDIT.md` | Notification system audit |
| 6 | `/app/memory/PRD.md` | This file - Product requirements |

---

## Current System Status

### One Spine: ✅ CERTIFIED

| Proof | Status |
|-------|--------|
| 1. Canonical TCK Format | ✅ PASS |
| 2. Services Visibility | ✅ PASS |
| 3. Ownership Fields | ✅ PASS (new tickets) |
| 4. Two-Way Replies | ✅ PASS |
| 5. Unread Indicator | ✅ PASS |

### Notification System: ✅ FIXED

| Feature | Status |
|---------|--------|
| Bell icon in header | ✅ Working |
| Per-pet filtering | ✅ Working |
| Concierge reply → notification | ✅ Fixed |
| Deep-link to Services | ✅ Fixed |
| Pet avatar in cards | ✅ Added |
| My Account link | ✅ Added |

### Pet Soul Data: ✅ ENRICHED

5 pets enriched with 51 fields each:
- Mystique, Lola, Meister, Bruno, Luna

---

## What's Been Implemented

### February 18, 2026 (Session 2)

1. **ConciergeReplyBanner** - Verified working with petName prop
2. **"Concierge®" Branding** - Updated in 13 user-facing components:
   - ConciergeConfirmation, PersonalizedPicksPanel, TodayPanel
   - PicksHistoryTab, CarePage, HelpModal, PlacesWithConcierge
   - MiraSearchPanel, Pulse, MiraOSModal, MiraConciergeCard
   - OnboardingTooltip, MiraDemoPage
3. **Pet Context Audit** - ✅ PASS - All ticket paths enforce pet context
4. **Test Credentials Standardized** - See `/app/memory/TEST_CREDENTIALS.md`

### February 18, 2026 (Session 1)

1. **AGENT_MASTER_PROTOCOL.md** - Comprehensive exhaustive protocol for all agents
2. **One Spine Re-Audit** - All 5 proofs passing for new tickets
3. **Notification System Fixes:**
   - concierge_reply now creates member_notifications
   - Deep-link goes to Services (not Concierge tab)
   - Pet avatar + name in notification cards
   - My Account link in dropdown
4. **Help Modal FAQs** - Mental model copy added
5. **Pet Soul Enrichment** - 5 pets with 51 fields each
6. **Soul Learning Engine** - Active, returns `_memory_trace`
7. **Breed Bug Instrumentation** - Monitoring via `breed_mention_detector.py`

---

## Prioritized Backlog

### P0 - Critical

- [x] ~~One Spine certification~~ ✅ DONE
- [x] ~~Notification system fixes~~ ✅ DONE
- [x] ~~Agent Master Protocol~~ ✅ DONE
- [ ] **Soul-Capture Onboarding** - 8-10 step experience

### P1 - High Priority

- [ ] **Ensure pet_id/pet_name on ALL tickets** - Some tickets missing pet context
- [ ] **"All pets" toggle** in notification dropdown
- [ ] **Mobile Specs Audit** - Typography & tap targets vs Bible
- [ ] Monitor Breed Bug logs for `[BREED MISMATCH]`

### P2 - Medium Priority

- [ ] WhatsApp Webhook Idempotency
- [ ] Legacy Ticket Migration (134+ to TCK-*)
- [ ] Gradual backfill of ownership fields

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

Enriched Pets:
- Mystique (senior, arthritis, chicken/wheat allergy)
- Lola (young, energetic, beef/corn allergy)
- Meister (senior, heart condition, severe anxiety)
- Bruno (young, high energy, loves swimming)
- Luna (hip dysplasia, grain allergy)
```

---

## Key API Endpoints

| Endpoint | Purpose |
|----------|---------|
| POST `/api/mira/chat` | Main chat, creates tickets |
| GET `/api/mira/tickets` | Get Services tickets |
| POST `/api/service_desk/concierge_reply` | Concierge sends reply |
| GET `/api/member/notifications/inbox/{email}` | Bell notifications |

---

## Key Files

### Backend
- `/app/backend/mira_routes.py` - Main chat
- `/app/backend/mira_service_desk.py` - Service desk, concierge_reply
- `/app/backend/utils/service_ticket_spine.py` - Ticket creation

### Frontend
- `/app/frontend/src/pages/MiraDemoPage.jsx` - Main UI
- `/app/frontend/src/components/Mira/NotificationBell.jsx` - Bell icon

### Documentation
- `/app/memory/AGENT_MASTER_PROTOCOL.md` - **THE MASTER PROTOCOL**
- `/app/memory/PET_OS_BEHAVIOR_BIBLE.md` - The Law

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

# Pet Soul - Mira OS Product Requirements Document

## Original Problem Statement
Create a "Golden Standard Communication System" centered around an AI named "Mira." Development is guided by `PET_OS_BEHAVIOR_BIBLE.md`. 

### Core Architectural Rules:
1. **"Uniform Service Flow"** - All service actions create/attach to a single canonical "Service Desk Ticket" spine using `TCK-YYYY-NNNNNN` ID format
2. **"Health-First Safety Rule"** - Pet health facts always override conflicting preferences
3. **Mental Model**: "Chat is where you ask. Services is where it gets done."

## Product Requirements

### 1. Mental Model Reinforcement
All UI copy, notifications, and interaction flows must guide users to ask in Chat and manage execution/replies in Services.

### 2. Uniform Service Flow
Enforce single ticket backbone (`TCK-*` IDs) for all service requests.

### 3. Picks Fallback Logic
If Mira cannot find a matching product, the "Picks" panel must fall back to "Concierge Arranges" flow.

### 4. Deterministic UI Contracts
Frontend renders strictly based on `conversation_contract` from backend, including `mode` and `quick_replies`.

### 5. Explicit Location Consent
For "near me" queries, system must ask for consent before triggering geolocation.

### 6. Reply Guardrail
Prevent users from replying to open tickets in main Chat view by nudging them to Services thread.

### 7. Consistent Ownership
Ticket ownership derived from unified identity model.

### 8. Pet First, Breed Second Doctrine
Personalization logic prioritizes pet's individual traits over breed characteristics.

---

## What's Been Implemented

### Session: Feb 18, 2026

#### ✅ Verified Working
- **Quick Reply Chips** - All scenario chips rendering correctly (Birthday Party, Grooming, Food Recs, Health Check, Travel, Training, Places, Emergency)
- **Services Tab Unread Badge** - Notification banner showing "Concierge replied in Services - 1 message waiting"
- **Mental Model Reinforcement Modal** - "Chat is where you ask" dialog working correctly
- **Pet Profile Chips** - Glamorous soul, Elegant paws, Devoted friend

#### Previous Session Accomplishments:
- **CELEBRATE Pillar Logic Fix** - Multi-step conversation flow (location → size → execution) fully functional
- **Pet Soul Data Loading Fix** - Complete pet soul data now loads from database
- **Soul Learning Engine** - Extracts and saves durable facts from conversations
- **Breed Substitution Bug Instrumentation** - Monitoring system with `breed_mention_detector.py`
- **Full "One Spine" QA Verification** - Ticketing flow verified against Bible's 8-step QA
- **Emergency Triage Chips Verification** - Emergency flow returns all required quick replies
- **Agent Protocol Documentation** - `/app/memory/AGENT_INSTRUCTIONS.md` created

---

## Prioritized Backlog

### P0 - Critical
- [ ] Perform Exhaustive Audit using `/app/memory/EXHAUSTIVE_AUDIT_FRAMEWORK.md`
- [ ] Implement 8-10 step soul-capture onboarding experience

### P1 - High Priority
- [ ] **Mobile Specs Audit** - Verify UI against Bible specs (typography, tap targets, spacing)
- [ ] **Monitor Breed Bug** - Check logs for `[BREED MISMATCH]` alerts
- [ ] Past Chats Panel UI implementation
- [ ] System Health Scorecard Review

### P2 - Medium Priority
- [ ] **WhatsApp Webhook Idempotency** - Use `source.provider_message_id` for deduplication
- [ ] **Pet Memory Allergy Test** - Verify Health-First Safety Rule logic
- [ ] Legacy Ticket Migration (134+ tickets to `TCK-*` format)

### P3 - Backlog
- [ ] Refactor `mira_routes.py` (20k+ lines monolith)
- [ ] Refactor `MiraDemoPage.jsx`
- [ ] Picks Engine enhancements
- [ ] Push notification system
- [ ] Gate Mira OS for Paid Members

---

## Key Files Reference

### Backend
- `/app/backend/routes/mira_routes.py` - Main Mira chat logic
- `/app/backend/utils/breed_mention_detector.py` - Breed bug monitoring
- `/app/backend/utils/soul_learning_engine.py` - Conversation learning
- `/app/backend/soul_intelligence.py` - Pet soul data handling
- `/app/backend/routes/ticket_routes.py` - Member ticket endpoints
- `/app/backend/services/service_desk_ticket_routes.py` - Concierge endpoints

### Frontend
- `/app/frontend/src/pages/MiraDemoPage.jsx` - Main Mira UI

### Documentation
- `/app/memory/PET_OS_BEHAVIOR_BIBLE.md` - Design specification
- `/app/memory/AGENT_INSTRUCTIONS.md` - Mandatory QA protocol
- `/app/memory/EXHAUSTIVE_AUDIT_FRAMEWORK.md` - Audit guide
- `/app/memory/QUICK_REPLIES_AUDIT_FRAMEWORK.md` - QR audit guide

---

## Test Credentials
- **Email:** dipali@clubconcierge.in
- **Password:** test123
- **Test Pet:** Mystique
- **Debug URL:** `/mira-demo?debug=1`

---

## 3rd Party Integrations
- Google Places
- YouTube
- WhatsApp (Gupshup, Meta)
- Resend
- Shopify
- ElevenLabs
- Firebase

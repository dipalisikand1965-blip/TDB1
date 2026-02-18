# EXHAUSTIVE AUDIT FRAMEWORK
## Complete System Validation for Mira OS / Pet Soul Platform

**Purpose:** This document provides a comprehensive audit checklist covering ALL system aspects for QA, handover, and regression testing.

**Last Updated:** February 18, 2026

---

# ⚠️ MANDATORY AGENT PROTOCOL

**BEFORE ANY AUDIT OR CHANGE, every agent MUST:**

1. **Read ALL Bible documents:**
   - `/app/memory/PET_OS_BEHAVIOR_BIBLE.md` (Complete system contract)
   - `/app/memory/QUICK_REPLIES_AUDIT_FRAMEWORK.md` (Chip validation)
   - `/app/memory/PRD.md` (Product requirements)
   - `/app/memory/LEARN_BIBLE.md` (LEARN pillar)

2. **Understand Core Doctrines:**
   - **PET FIRST DOCTRINE:** Mira knows the pet's SOUL. Breed is secondary.
   - **VOICE CONTRACT (Section 0.05):** Banned openers, required openers
   - **QUICK REPLIES CONTRACT (Section 11.2):** Deterministic chips, 3-6 per turn

3. **Test on:** `/mira-demo?debug=1`
   - User: `dipali@clubconcierge.in` / `test123`
   - Pets: Lola, Mystique

4. **WARN if any request conflicts with Bible doctrines**

---

# TABLE OF CONTENTS

1. [VOICE & PERSONALITY AUDIT](#1-voice--personality-audit)
2. [UI/UX AUDIT](#2-uiux-audit)
3. [INTELLIGENCE & PERSONALIZATION AUDIT](#3-intelligence--personalization-audit)
4. [UNIFIED SERVICE FLOW (SPINE) AUDIT](#4-unified-service-flow-spine-audit)
5. [PILLAR-BY-PILLAR AUDIT](#5-pillar-by-pillar-audit)
6. [ICON STATE SYSTEM AUDIT](#6-icon-state-system-audit)
7. [EMERGENCY & SAFETY AUDIT](#7-emergency--safety-audit)
8. [ADMIN & BACKEND AUDIT](#8-admin--backend-audit)
9. [INTEGRATION AUDIT](#9-integration-audit)
10. [MOBILE & RESPONSIVENESS AUDIT](#10-mobile--responsiveness-audit)
11. [PERFORMANCE & RELIABILITY AUDIT](#11-performance--reliability-audit)
12. [SECURITY & COMPLIANCE AUDIT](#12-security--compliance-audit)
13. [DATA INTEGRITY AUDIT](#13-data-integrity-audit)
14. [REGRESSION TEST SUITE](#14-regression-test-suite)
15. [QUICK REPLIES AUDIT](#15-quick-replies-audit) ← **NEW**

---

# 1. VOICE & PERSONALITY AUDIT

## 1.1 First-Word Ban Compliance

| Test Prompt | Expected First Words | Banned Words | Pass/Fail |
|------------|---------------------|--------------|-----------|
| "What treats would [Pet] like?" | "Oh, [Pet]..." / "I know [Pet]..." | "Great idea", "That sounds" | |
| "Find me a vet nearby" | "Looking out for [Pet]'s wellbeing..." | "That sounds lovely" | |
| "Plan [Pet]'s birthday" | "Oh, a birthday for [Pet]..." | "Great idea", "How exciting" | |
| "Help me with grooming" | "Since I know [Pet]..." | "I'd be happy to" | |
| "[Pet] seems off today" | "I hear you..." / "Let's figure this out..." | "Oh no!" | |

### Banned First Words (NEVER use):
- [ ] "Great idea"
- [ ] "Great question"
- [ ] "That sounds" (lovely/wonderful/great)
- [ ] "I'd be happy to"
- [ ] "Absolutely"
- [ ] "Sure"
- [ ] "Of course"
- [ ] "No problem"
- [ ] "Certainly"
- [ ] "Good thinking"
- [ ] "What a great"
- [ ] "How exciting"

### Required Soulful Openers:
- [ ] "Oh, [Pet]..."
- [ ] "I know [Pet]..."
- [ ] "Since I know [Pet]..."
- [ ] "[Pet]'s lucky to have..."
- [ ] "Looking out for [Pet]'s wellbeing..."
- [ ] "I love that you're thinking about..."
- [ ] "I hear you..." (for concerns)
- [ ] "I've got you..." (for emergencies)

## 1.2 Context-Adaptive Voice Register

| Context | Expected Tone | Test Phrase | Pass/Fail |
|---------|--------------|-------------|-----------|
| Treats/Food | Knowing delight | "What treats?" | |
| Health concern | Calm, caring | "[Pet] seems off" | |
| Vet/Places | Clarify first | "Find vet nearby" | |
| Booking | In-control | "Book grooming" | |
| Celebration | Joy + specifics | "Plan birthday" | |
| Emergency | Steady, serious | "Not breathing" | |
| Parent panic | Structured calm | "I'm scared" | |
| Grief/Loss | Presence only | "Lost my dog" | |

## 1.3 Trap Prompt Tests

| Trap Prompt | Correct Response | Wrong Response | Pass/Fail |
|-------------|-----------------|----------------|-----------|
| "I'm scared. [Pet] ate something weird." | Calm triage: "What did they eat? How long ago?" | Panic: "Oh no! That's scary!" | |
| "Find me the best vet NOW" | Still clarify: "Which area? Is this urgent?" | Show results without clarification | |
| User sounds panicked | Match with calm competence | Match their panic or dismiss | |

---

# 2. UI/UX AUDIT

## 2.1 Navigation & Layout

### Top Navigation
- [ ] Mira logo clickable → returns to home
- [ ] Pet selector shows current pet with photo
- [ ] Pet selector dropdown works (switch pets)
- [ ] Pet selector does NOT open modal on click
- [ ] Weather/location widget displays correctly
- [ ] Notification bell shows per-pet notifications

### OS Tab Bar
- [ ] TODAY tab - visible and clickable
- [ ] PICKS tab - visible and clickable
- [ ] SERVICES tab - visible with badge count
- [ ] LEARN tab - visible and clickable
- [ ] CONCIERGE tab - visible and clickable

### Chat Area
- [ ] Messages display correctly (user right, Mira left)
- [ ] Mira avatar shows sparkle icon
- [ ] Quick replies render as clickable chips
- [ ] Older messages collapsible
- [ ] "Show X earlier messages" link works
- [ ] Scroll behavior smooth

### Chat Input Bar
- [ ] Input field placeholder: "Ask Mira anything..."
- [ ] Voice input button visible
- [ ] Send button visible
- [ ] Enter key sends message

## 2.2 Indicator System (Conversation Bar)

### C° (Concierge) Indicator
- [ ] Visible on Mira message header
- [ ] Shows OFF state when no activity (dimmed)
- [ ] Shows ON state when threads exist
- [ ] Shows PULSE state when unread replies (animated glow)
- [ ] Click navigates to CONCIERGE tab (NOT modal)
- [ ] Badge count shows unread replies

### PICKS Indicator
- [ ] Visible on Mira message header
- [ ] Shows OFF state when no picks (dimmed)
- [ ] Shows ON state when picks exist
- [ ] Shows PULSE state when NEW picks (animated glow)
- [ ] Click navigates to PICKS tab (NOT modal)
- [ ] Badge count shows picks count
- [ ] Pet photo overlay shows

## 2.3 Panels & Modals

### PICKS Panel
- [ ] Opens when PICKS tab clicked
- [ ] Header: "Picks for [Pet]"
- [ ] Subheader: "Mira knows [Pet]"
- [ ] Left column: "MIRA'S PICKS FOR [PET]"
- [ ] Right column: "CONCIERGE ARRANGES FOR [PET]"
- [ ] Pillar filter chips work (Celebrate, Dine, Travel, etc.)
- [ ] Product cards show images
- [ ] "Curated for [Pet]" labels present
- [ ] Close button works

### LEARN Panel
- [ ] Opens when LEARN tab clicked
- [ ] Header: "For [Pet]"
- [ ] Topic chips: Grooming, Health, Food, Behaviour, Travel, etc.
- [ ] Content cards show "Relevant" badge
- [ ] YouTube videos embedded safely
- [ ] Search bar works
- [ ] Close button works

### SERVICES Panel
- [ ] Opens when SERVICES tab clicked
- [ ] Shows active tickets
- [ ] Ticket IDs in TCK-YYYY-NNNNNN format
- [ ] Status badges (pending, in_progress, resolved)
- [ ] Reply functionality works
- [ ] Close button works

### TODAY Panel
- [ ] Shows "For [Pet]" header
- [ ] Soul score percentage displayed
- [ ] Personality traits shown
- [ ] Daily greeting personalized
- [ ] Upcoming events/reminders shown

## 2.4 Loading States

- [ ] "⚡ Finding that for [Pet]..." (instant mode)
- [ ] "🧡 Mira is getting her thoughts together for [Pet]..." (thinking mode)
- [ ] Loading spinners display correctly
- [ ] No blank screens during loading

## 2.5 Error States

- [ ] Network error shows friendly message
- [ ] API timeout shows retry option
- [ ] Empty states have helpful text
- [ ] 404 pages styled correctly

---

# 3. INTELLIGENCE & PERSONALIZATION AUDIT

## 3.1 Pet First, Breed Second Doctrine

| Test | Expected | Pass/Fail |
|------|----------|-----------|
| Ask about food | Uses pet's specific allergies/preferences first | |
| Ask about grooming | References pet's coat type, not breed generalization | |
| Ask about exercise | Uses pet's energy level, not breed stereotype | |
| Ask about health | Mentions pet's specific conditions first | |
| Ask about treats | Lists pet's favorites, avoids allergens | |

### Test Prompts:
```
"What food is good for [Pet]?"
Expected: "[Pet] has [specific allergies], so avoid... Their favorites are..."
NOT: "Golden Retrievers typically like..."
```

## 3.2 Profile Data Usage

- [ ] Pet name used consistently
- [ ] Pet pronouns correct (he/she/they)
- [ ] Allergies referenced when suggesting food
- [ ] Birthday/age used for age-appropriate suggestions
- [ ] Temperament used for activity suggestions
- [ ] Energy level used for exercise recommendations
- [ ] Grooming tolerance considered
- [ ] Car comfort mentioned for travel
- [ ] Vet information stored and used

## 3.3 Conversation Context

- [ ] Mira remembers previous messages in session
- [ ] Follow-up questions have context
- [ ] Topic shifts acknowledged
- [ ] "I recall what [Pet] enjoys" banner appears when relevant

## 3.4 Clarification Flow

| Scenario | Expected Behavior | Pass/Fail |
|----------|------------------|-----------|
| Vague request | Ask ONE clarifying question | |
| Location needed | "Which area?" or "Use current location?" | |
| Missing details | Ask specific, not generic questions | |
| Overwhelm detected | Simplify to 3 options | |

---

# 4. UNIFIED SERVICE FLOW (SPINE) AUDIT

## 4.1 Ticket Creation

- [ ] All service requests create TCK-YYYY-NNNNNN ticket
- [ ] Ticket ID visible to user
- [ ] "Reply in Services" nudge appears
- [ ] Ticket status tracked (pending → in_progress → resolved)
- [ ] Pet ID attached to ticket
- [ ] User ID attached to ticket
- [ ] Channel recorded (web/whatsapp/app)

## 4.2 Ticket Flow

```
User Request → Mira Chat → TCK Created → Services Panel → Concierge Reply → User Notified
```

Test each step:
- [ ] Request creates ticket
- [ ] Ticket appears in Services
- [ ] Concierge can reply
- [ ] User sees reply
- [ ] Notification generated

## 4.3 Cross-Channel Consistency

| Channel | Ticket Created | Same TCK ID | Reply Works | Pass/Fail |
|---------|---------------|-------------|-------------|-----------|
| Web Chat | | | | |
| WhatsApp | | | | |
| Mobile App | | | | |

## 4.4 Handoff Rules

- [ ] `handoff_to_spine()` called for all execution requests
- [ ] Parent ticket ID passed when follow-up
- [ ] New canonical ticket created when no parent
- [ ] Thread consistency maintained

---

# 5. PILLAR-BY-PILLAR AUDIT

## 5.1 CELEBRATE Pillar

- [ ] Birthday planning engaged (not immediate handoff)
- [ ] Gotcha day recognized
- [ ] Party options personalized to pet
- [ ] Cake suggestions avoid allergens
- [ ] Concierge Arranges shown for execution

### Test: "Plan [Pet]'s birthday"
- [ ] Joy + specifics in response
- [ ] Asks about gathering size, location, preferences
- [ ] Shows PICKS for products
- [ ] Shows Concierge Arranges for services

## 5.2 DINE Pillar

- [ ] Food recommendations use pet profile
- [ ] Allergies prominently mentioned
- [ ] Treats personalized
- [ ] Meal plans available
- [ ] Fresh food options shown

### Test: "What treats are safe for [Pet]?"
- [ ] Lists allergens to avoid
- [ ] Suggests favorites
- [ ] Shows product picks

## 5.3 STAY Pillar

- [ ] Boarding options personalized
- [ ] Separation anxiety considered
- [ ] Home vs kennel preference asked
- [ ] Pet sitter options shown

## 5.4 TRAVEL Pillar

- [ ] Pet-friendly places suggested
- [ ] Car comfort considered
- [ ] Travel checklist offered
- [ ] Documents reminder (vaccination)

## 5.5 CARE Pillar

- [ ] Symptoms triaged safely
- [ ] Vet recommendations when needed
- [ ] Health-first safety rule followed
- [ ] No medical diagnoses given

## 5.6 ENJOY Pillar

- [ ] Activities match energy level
- [ ] Toys match play style
- [ ] Enrichment ideas personalized

## 5.7 FIT Pillar

- [ ] Exercise recommendations appropriate
- [ ] Weight considered
- [ ] Age-appropriate activities

## 5.8 LEARN Pillar

- [ ] Content tagged as "Relevant"
- [ ] Topics match pet's needs
- [ ] YouTube videos safe/appropriate
- [ ] Mira frame around content

## 5.9 ADVISORY Pillar

- [ ] Expert consultation offered
- [ ] Trainer recommendations
- [ ] Behaviorist referrals

## 5.10 SERVICES Pillar

- [ ] All tickets visible
- [ ] Status tracking works
- [ ] Reply functionality works
- [ ] History accessible

## 5.11 FAREWELL Pillar

- [ ] Grief detected correctly
- [ ] COMFORT mode activated
- [ ] No questions asked
- [ ] Presence-only response
- [ ] Memorial options (when ready)

## 5.12 EMERGENCY Pillar

### Triage First (No Red Flags)
- [ ] Calm, structured questions
- [ ] "What did [Pet] eat?"
- [ ] "How long ago?"
- [ ] "Any symptoms now?"

### Go Now (Red Flags)
- [ ] Known toxin → immediate emergency
- [ ] Physical distress → immediate emergency
- [ ] Short, directive sentences
- [ ] Emergency contacts shown

---

# 6. ICON STATE SYSTEM AUDIT

## 6.1 State Definitions

| Icon | OFF | ON | PULSE |
|------|-----|-----|-------|
| MOJO | No profile data | Profile exists | Critical missing |
| TODAY | No tasks | Tasks exist | New since last view |
| SERVICES | No tickets | Tickets exist | Unread replies |
| PICKS | No picks | Picks exist | New picks |
| LEARN | No content | Content exists | New insights |
| CONCIERGE | No threads | Threads exist | Unread replies |

## 6.2 API Endpoint Test

```bash
GET /api/os/icon-state?user_email={email}&pet_id={pet_id}&active_tab={tab}
```

Response should include:
- [ ] `counts.today` object
- [ ] `counts.services` object
- [ ] `counts.picks` object
- [ ] `counts.learn` object
- [ ] `counts.concierge` object
- [ ] `counts.mojo` object

## 6.3 State Transitions

- [ ] OFF → ON when items added
- [ ] ON → PULSE when NEW items added
- [ ] PULSE → ON when user views tab
- [ ] ON → OFF when items reach zero

---

# 7. EMERGENCY & SAFETY AUDIT

## 7.1 Triage Keywords (TRIAGE_FIRST)

- [ ] "ate something" → triage questions
- [ ] "swallowed" → triage questions
- [ ] "ingested" → triage questions
- [ ] "got into" → triage questions
- [ ] "chewed on" → triage questions

## 7.2 Red Flag Keywords (GO_NOW)

- [ ] "not breathing" → immediate emergency
- [ ] "collapsed" → immediate emergency
- [ ] "seizure" → immediate emergency
- [ ] "chocolate" → immediate emergency
- [ ] "xylitol" → immediate emergency
- [ ] "rat poison" → immediate emergency
- [ ] "antifreeze" → immediate emergency
- [ ] "pale gums" → immediate emergency
- [ ] "vomiting blood" → immediate emergency

## 7.3 Safety Response Audit

- [ ] No medical diagnoses given
- [ ] "Consult vet" for medical questions
- [ ] Emergency contacts shown when needed
- [ ] WhatsApp emergency link works
- [ ] Call button works

---

# 8. ADMIN & BACKEND AUDIT

## 8.1 Kit Admin Panel

- [ ] Login works
- [ ] Dashboard loads
- [ ] User management accessible
- [ ] Content management works
- [ ] Ticket management works
- [ ] Analytics displayed

## 8.2 API Endpoints Health

| Endpoint | Method | Expected Status | Pass/Fail |
|----------|--------|-----------------|-----------|
| `/api/health` | GET | 200 | |
| `/api/mira/chat` | POST | 200 | |
| `/api/os/icon-state` | GET | 200 | |
| `/api/os/learn/home` | GET | 200 | |
| `/api/member/notifications/inbox/{email}` | GET | 200 | |

## 8.3 Database Collections

- [ ] `users` - User profiles
- [ ] `mira_tickets` - Service tickets
- [ ] `tickets` - Legacy tickets
- [ ] `learn_content` - Educational content
- [ ] `member_notifications` - Notifications
- [ ] `picks_catalogue` - Product picks

## 8.4 Background Jobs

- [ ] Notification dispatch working
- [ ] Email sending working
- [ ] WhatsApp integration working

---

# 9. INTEGRATION AUDIT

## 9.1 Google Places

- [ ] Location consent required
- [ ] Results personalized to area
- [ ] Pet-friendly filter applied
- [ ] Rating displayed
- [ ] Open hours shown

## 9.2 YouTube (LEARN)

- [ ] Videos embedded safely
- [ ] Mira frame present
- [ ] No autoplay
- [ ] Content appropriate

## 9.3 WhatsApp (Gupshup)

- [ ] Messages received
- [ ] Replies sent
- [ ] Media handling works
- [ ] Idempotency check working

## 9.4 Email (Resend)

- [ ] Notifications sent
- [ ] Templates rendering
- [ ] Unsubscribe works

## 9.5 Firebase

- [ ] Auth working
- [ ] Push notifications working

---

# 10. MOBILE & RESPONSIVENESS AUDIT

## 10.1 Viewport Tests

| Viewport | Width | Test Areas | Pass/Fail |
|----------|-------|------------|-----------|
| Mobile S | 320px | All panels fit, readable | |
| Mobile M | 375px | All panels fit, readable | |
| Mobile L | 425px | All panels fit, readable | |
| Tablet | 768px | Layout adapts | |
| Desktop | 1024px+ | Full layout | |

## 10.2 Touch Interactions

- [ ] Buttons have adequate tap targets (44px min)
- [ ] Swipe gestures work
- [ ] Pull to refresh works
- [ ] Scroll smooth

## 10.3 iOS Specific

- [ ] Safe area insets respected
- [ ] Keyboard doesn't cover input
- [ ] Status bar handled

## 10.4 Android Specific

- [ ] Back button behavior correct
- [ ] Keyboard handling correct

---

# 11. PERFORMANCE & RELIABILITY AUDIT

## 11.1 Load Times

| Action | Expected Time | Actual | Pass/Fail |
|--------|--------------|--------|-----------|
| Initial page load | < 3s | | |
| Chat response | < 5s | | |
| Panel open | < 1s | | |
| Search results | < 3s | | |

## 11.2 Error Handling

- [ ] API errors show friendly messages
- [ ] Network failures gracefully handled
- [ ] Retry mechanisms work
- [ ] No infinite loops

## 11.3 Concurrent Users

- [ ] Multiple users can chat simultaneously
- [ ] No ticket collision
- [ ] Session isolation works

---

# 12. SECURITY & COMPLIANCE AUDIT

## 12.1 Authentication

- [ ] Login required for /mira-demo
- [ ] Token validation working
- [ ] Session timeout handled
- [ ] Logout clears session

## 12.2 Data Protection

- [ ] User data encrypted at rest
- [ ] API calls over HTTPS
- [ ] No PII in logs
- [ ] MongoDB _id excluded from responses

## 12.3 Input Validation

- [ ] XSS prevention
- [ ] SQL injection prevention
- [ ] File upload validation

---

# 13. DATA INTEGRITY AUDIT

## 13.1 Pet Data

- [ ] Pet profile complete
- [ ] Allergies stored correctly
- [ ] Preferences saved
- [ ] History maintained

## 13.2 Ticket Data

- [ ] TCK IDs unique
- [ ] Status transitions logged
- [ ] Messages stored
- [ ] Timestamps accurate

## 13.3 Notification Data

- [ ] Per-pet filtering works
- [ ] Read status tracked
- [ ] Timestamps accurate

---

# 14. REGRESSION TEST SUITE

## 14.1 Critical Path Tests

Run these after ANY code change:

```bash
# 1. Login
curl -X POST /api/auth/login

# 2. Chat
curl -X POST /api/mira/chat -d '{"message":"Hello"}'

# 3. Icon State
curl -X GET /api/os/icon-state

# 4. LEARN Home
curl -X GET /api/os/learn/home

# 5. Notifications
curl -X GET /api/member/notifications/inbox/{email}
```

## 14.2 Voice Regression Tests

Run these to catch tone regressions:

| Prompt | Check First Words | Check Personalization |
|--------|-------------------|----------------------|
| "What treats?" | Not "Great idea" | Uses pet allergies |
| "Find vet" | Not "That sounds lovely" | Asks for location |
| "I'm scared" | Not panic | Calm triage |
| "Plan birthday" | Not generic | Uses pet name |

## 14.3 Flow Regression Tests

| Flow | Steps | Expected | Pass/Fail |
|------|-------|----------|-----------|
| Booking | Chat → Request → Ticket → Services | TCK created | |
| Places | Chat → Clarify → Location → Results | Location asked first | |
| Emergency | Chat → Red flag → GO_NOW | Immediate escalation | |
| Triage | Chat → Uncertain ingestion → Questions | Calm triage | |

---

# HOW TO USE THIS FRAMEWORK

## For Handover:
1. New agent runs through ALL sections
2. Documents any failures
3. Fixes issues before proceeding
4. Re-runs failed tests

## For QA:
1. Run regression suite after each change
2. Run full audit weekly
3. Document new edge cases
4. Update framework as needed

## For Production Deploy:
1. Run critical path tests
2. Run voice regression tests
3. Run flow regression tests
4. Green light only if all pass

---

# AUDIT EXECUTION LOG

| Date | Auditor | Sections Tested | Issues Found | Status |
|------|---------|-----------------|--------------|--------|
| | | | | |

---

*This framework is a living document. Update as the system evolves.*
*Last major update: February 17, 2026*

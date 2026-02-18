# QUICK REPLIES AUDIT FRAMEWORK
## Comprehensive Test Protocol for Conversation Contract Compliance

**Purpose:** This document provides exhaustive test cases for validating Quick Replies behavior against Section 11.2 and 11.3 of the PET_OS_BEHAVIOR_BIBLE.

**Last Updated:** February 18, 2026
**Test URL:** `/mira-demo?debug=1`
**Credentials:** `dipali@clubconcierge.in` / `test123`

---

# ⚠️ MANDATORY PRE-AUDIT CHECKLIST

Before running ANY test, confirm:

- [ ] Read `/app/memory/PET_OS_BEHAVIOR_BIBLE.md` (ALL sections)
- [ ] Read `/app/memory/MIRA_OS_COMPREHENSIVE_AUDIT_FRAMEWORK.md`
- [ ] Understand the PET FIRST DOCTRINE (Section 0.01)
- [ ] Understand the VOICE & TONE CONTRACT (Section 0.05)
- [ ] Have access to test credentials
- [ ] Debug panel visible (`?debug=1`)

---

# SECTION 1: CONTRACT STRUCTURE VALIDATION

## 1.1 Every Response Must Have `conversation_contract`

**Test:** Send ANY message to Mira

**Expected Response Structure:**
```json
{
  "response": "...",
  "pillar": "...",
  "conversation_contract": {
    "mode": "answer | clarify | places | learn | ticket | handoff",
    "assistant_message_id": "MSG-YYYYMMDD-NNNNN",
    "quick_replies": [...],
    "actions": [...]
  }
}
```

**Pass Criteria:**
- [ ] `conversation_contract` key exists
- [ ] `mode` is one of: `answer`, `clarify`, `places`, `learn`, `ticket`, `handoff`
- [ ] `quick_replies` is an array (can be empty)
- [ ] `actions` is an array (can be empty)

**Fail if:**
- Missing `conversation_contract` entirely
- `mode` is an unexpected value
- `quick_replies` is null instead of empty array

---

## 1.2 Quick Reply Object Validation

**For each chip in `quick_replies[]`, verify:**

| Field | Required | Validation |
|-------|----------|------------|
| `id` | Yes | Non-empty string, unique within response |
| `label` | Yes | 1-4 words |
| `payload_text` | Yes | Complete sentence, ends in punctuation |
| `intent_type` | Yes | From allowed enum (see Section 11.2.4) |
| `action` | Yes | From allowed enum: `none`, `send_message`, `set_state`, `open_layer`, `create_ticket` |
| `action_args` | Yes | Object (can be empty `{}`) |
| `analytics_tag` | Yes | Format: `qr.{domain}.{verb}.{object}` |
| `safety` | Optional | If present, has `requires_consent` boolean |

---

# SECTION 2: MODE-SPECIFIC CHIP COUNT TESTS

## 2.1 `clarify` Mode Requirements

**Test prompts that should trigger `clarify`:**

| Prompt | Expected |
|--------|----------|
| "Find a vet nearby" | 3-6 chips including area/consent options |
| "Book grooming" | 3-6 chips with timing options |
| "Plan a party" | 3-6 chips with location/size options |

**Pass Criteria:**
- [ ] Exactly 3-6 chips returned
- [ ] At least 2 meaningful choices
- [ ] At least 1 "cancel / not now" option
- [ ] Only ONE question asked per turn

**Fail if:**
- Less than 3 chips
- More than 6 chips
- No cancel/defer option
- Multiple questions in same response

---

## 2.2 `places` Mode Requirements

**Test prompts that should trigger `places`:**
(Note: Only AFTER location consent or area provided)

| Prompt | Expected |
|--------|----------|
| "Show pet cafes in Koramangala" | 3-6 chips with refine options |
| "Use my current location" (after consent) | 3-6 chips with refine options |

**Pass Criteria:**
- [ ] At least 1 "refine" chip (e.g., "Open now", "Top rated")
- [ ] At least 1 "change area" chip
- [ ] Places API was called with explicit area OR consent

**Fail if:**
- Places shown without prior consent/area
- No refine options
- No way to change area

---

## 2.3 `ticket` / `handoff` Mode Requirements

**Test prompts that should trigger `ticket`:**

| Prompt | Expected |
|--------|----------|
| "Book grooming tomorrow morning" | Chips including "Open request", "View in Services" |
| "I want a birthday photographer" | Chips including "Open request" |

**Pass Criteria:**
- [ ] "Open request" chip present with `action: "create_ticket"`
- [ ] "View in Services" chip present with `action: "open_layer"`
- [ ] At least 1 "add detail" option

**Fail if:**
- No execution chip
- Ticket created without `create_ticket` action
- Missing Services navigation

---

# SECTION 3: LOCATION CONSENT GATE (CRITICAL)

## 3.1 "Near Me" Without Consent

**Test Prompt:** "Pet cafe near me"
**Precondition:** No location permission granted

**Expected Response:**
```json
{
  "conversation_contract": {
    "mode": "clarify",
    "quick_replies": [
      {
        "label": "Use current location",
        "intent_type": "consent_location",
        "action": "set_state",
        "action_args": { "key": "request_geo_permission", "value": true },
        "safety": { "requires_consent": true, "consent_key": "geo_location" }
      },
      {
        "label": "Type an area",
        "intent_type": "location_area",
        "action": "none"
      }
    ]
  }
}
```

**Pass Criteria:**
- [ ] Mode is `clarify`, NOT `places`
- [ ] NO places results returned
- [ ] "Use current location" chip has `safety.requires_consent: true`
- [ ] "Type an area" chip has `safety.requires_consent: false`

**FAIL if:**
- Places API called before consent
- Mode is `places` without prior consent
- Missing consent chip

---

## 3.2 "Near Me" After Consent Granted

**Test Flow:**
1. Send "Pet cafe near me"
2. Click "Use current location" chip
3. Verify location permission requested
4. Grant permission

**Expected Response After Consent:**
```json
{
  "conversation_contract": {
    "mode": "places",
    "quick_replies": [
      { "label": "Open now", ... },
      { "label": "Top rated", ... },
      { "label": "Change area", ... }
    ]
  },
  "places_results": [...]
}
```

**Pass Criteria:**
- [ ] Mode is `places`
- [ ] `places_results` array populated
- [ ] Refine chips available

---

# SECTION 4: PILLAR-SPECIFIC CHIP TESTS

## 4.1 CELEBRATE Pillar

### Test A: Birthday Planning Start
**Prompt:** "Plan Lola's birthday"

**Expected First Response:**
- Mode: `clarify`
- Chips: Location options (At home, Pet café, Garden, Hotel, Not sure)
- Voice: Joyful opener ("Oh, a birthday for Lola...")

**Expected Second Response (after location):**
- Mode: `clarify`
- Chips: Size options (Just us, Small, Medium, Big party, Not sure)

**Expected Third Response (after size):**
- Mode: `ticket` or `handoff`
- Chips: Execution options (Custom cake, Photographer, Open request)

### Test B: Gotcha Day
**Prompt:** "It's Lola's gotcha day"

**Expected:** Same flow as birthday with appropriate voice adjustment

---

## 4.2 CARE Pillar

### Test A: Grooming Booking
**Prompt:** "Book grooming for Lola"

**Expected Flow:**
1. First: Timing chips (Tomorrow, This weekend, Pick a date)
2. Second: Time of day chips (Morning, Evening)
3. Third: Confirmation + Open request chip

### Test B: Find Vet
**Prompt:** "Find me a vet nearby"

**Expected:**
1. First: Consent/area chips (if no location)
2. Second: Vet type chips (General, Emergency, Dermatology, Dental)
3. Third: Places results with refine chips

### Test C: Boarding
**Prompt:** "I need boarding for Lola"

**Expected:**
1. First: Type chips (Home boarding, Kennel, Pet sitter, Day care)
2. Second: Timing chips
3. Third: Open request chip

---

## 4.3 EMERGENCY Pillar

### Test A: Triage First (No Red Flags)
**Prompt:** "I'm scared. Lola ate something weird from the floor"

**Expected:**
- Mode: `clarify`
- Voice: Calm ("I've got you. Two quick checks...")
- Chips: "What" question (Chocolate, Medicine, Plant, Not sure)
- MUST include "Go to vet now" chip

### Test B: Red Flag Detected
**Prompt:** "Lola ate chocolate"

**Expected:**
- Mode: `emergency` or immediate escalation
- Voice: Urgent but steady
- Chips: Emergency action chips
- Emergency contact information displayed

### Test C: Symptoms Check
**Prompt:** (After what/when triage) "She seems normal now"

**Expected:**
- Mode: `clarify`
- Chips: Symptoms (Vomiting, Diarrhoea, Lethargic, Normal, Breathing issue)
- "Breathing issue" MUST route to GO_NOW

---

## 4.4 TRAVEL Pillar

### Test A: Trip Planning
**Prompt:** "I'm planning a trip to Goa with Lola"

**Expected:**
- Mode: `clarify`
- Chips: Trip type (Car, Flight, Train, Staycation)
- Voice: NOT café/restaurant related (this was a P1 bug)

### Test B: When
**Prompt:** (After trip type) "By car"

**Expected:**
- Mode: `clarify`
- Chips: Timing (Today, Tomorrow, This weekend, Pick a date)

---

## 4.5 LEARN Pillar

### Test A: Training Request
**Prompt:** "How do I train Lola to come when called?"

**Expected:**
- Mode: `learn`
- Content: Training information
- Chips: "Show 3 more", "Make a 7-day plan", "Ask Concierge", "Save this"

### Test B: Trainer Handoff
**Prompt:** "I want to book a trainer"

**Expected:**
- Mode: `ticket`
- Chips: "Book a trainer", "In-home", "Group class", "View in Services"

---

# SECTION 5: VOICE & TONE COMPLIANCE

## 5.1 Banned Opener Check

**For EVERY response, verify first word/phrase is NOT:**
- [ ] "Great idea"
- [ ] "Great question"
- [ ] "That sounds"
- [ ] "I'd be happy to"
- [ ] "Absolutely"
- [ ] "Sure"
- [ ] "Of course"
- [ ] "No problem"
- [ ] "Certainly"
- [ ] "How exciting"

**If ANY banned opener appears, mark as REGRESSION.**

---

## 5.2 Pet First Doctrine Check

**For EVERY response mentioning pet characteristics:**
- [ ] Uses pet's NAME (not just "your dog")
- [ ] References pet's INDIVIDUAL traits (not breed generalizations)
- [ ] Mentions pet's SPECIFIC preferences/allergies from profile

**Fail if:**
- Generic breed statements ("Shih Tzus typically...")
- Missing personalization
- Wrong breed mentioned (this was a P1 bug)

---

# SECTION 6: SPINE INTEGRATION

## 6.1 `create_ticket` Action Validation

**When a chip has `action: "create_ticket"`:**

1. Click the chip
2. Verify response includes:
   - `ticket_id` in format `TCK-YYYY-NNNNNN`
   - Ticket appears in Services inbox
   - Icon state updates

**Pass Criteria:**
- [ ] Canonical ticket ID returned
- [ ] Ticket visible in `/api/os/services/inbox`
- [ ] Icon state `services.active_tickets` incremented

**Fail if:**
- Non-canonical ticket ID (SVC-*, CNC-*)
- Ticket not in inbox
- Icon state not updated

---

## 6.2 `open_layer` Action Validation

**When a chip has `action: "open_layer"`:**

1. Click the chip
2. Verify correct panel opens:
   - `services` → Services panel
   - `picks` → Picks panel
   - `today` → Today panel
   - `learn` → Learn panel

**Pass Criteria:**
- [ ] Correct panel opens
- [ ] No modal/popup (panel should open)
- [ ] Navigation state correct

---

# SECTION 7: REGRESSION TEST SUITE

## 7.1 Critical Path Tests (Run After ANY Change)

| # | Test | Expected |
|---|------|----------|
| 1 | "Pet cafe near me" | Consent chips first, NO places |
| 2 | "Book grooming tomorrow" | Time chips + Open request |
| 3 | "Plan Lola's birthday" | Location chips first, joyful voice |
| 4 | "Find me a vet nearby" | Consent/area chips first |
| 5 | "I'm scared, Lola ate something" | Triage chips (what + when) |
| 6 | "Trip to Goa with Lola" | Travel chips, NOT café/dine |
| 7 | "How to train recall" | Learn chips + "Show 3 more" |

---

## 7.2 Voice Regression Tests

| # | Prompt | Check First Words |
|---|--------|-------------------|
| 1 | "What treats?" | NOT "Great idea" |
| 2 | "Find vet" | NOT "That sounds lovely" |
| 3 | "I'm scared" | NOT panic, calm triage |
| 4 | "Plan birthday" | Joyful, uses pet name |
| 5 | "Book grooming" | Confident execution voice |

---

# SECTION 8: ANALYTICS VALIDATION

## 8.1 Tag Format Check

Every `analytics_tag` must match: `qr.{domain}.{verb}.{object}`

**Valid Examples:**
- `qr.location.use_current`
- `qr.ticket.open_request`
- `qr.nav.services`

**Invalid:**
- `location_use_current` (wrong format)
- `qr.location` (incomplete)
- `button_click` (wrong prefix)

---

# AUDIT EXECUTION LOG

| Date | Auditor | Tests Run | Issues Found | Status |
|------|---------|-----------|--------------|--------|
| | | | | |

---

# REFERENCE DOCUMENTS

**Always read before auditing:**

1. `/app/memory/PET_OS_BEHAVIOR_BIBLE.md` - Complete system contract
2. `/app/memory/MIRA_OS_COMPREHENSIVE_AUDIT_FRAMEWORK.md` - Full audit protocol
3. `/app/memory/PRD.md` - Product requirements
4. `/app/memory/LEARN_BIBLE.md` - LEARN pillar specifics

**Test Credentials:**
- User: `dipali@clubconcierge.in` / `test123`
- Test URL: `/mira-demo?debug=1`
- Pets: Lola, Mystique

---

*This framework is law. Every agent must follow it.*
*Last Updated: February 18, 2026*

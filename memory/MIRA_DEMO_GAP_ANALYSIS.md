# MIRA DEMO - BIBLE COMPLIANCE GAP ANALYSIS
## Audit Date: February 21, 2026
## Against: PET_OS_BEHAVIOR_BIBLE, QUICK_REPLIES_AUDIT_FRAMEWORK, MIRA_CONVERSATION_RULES

---

# CRITICAL GAPS IDENTIFIED

## GAP 1: Quick Replies Missing Full Schema ❌

**BIBLE Requirement (Section 11.2):**
Each quick reply MUST include:
- `id` - Unique identifier (e.g., "QR-LOC-01")
- `label` - Short display text (1-4 words)
- `payload_text` - Complete sentence with punctuation
- `intent_type` - From enum: continue, refine, execute, consent_location, etc.
- `action` - From enum: none, send_message, set_state, open_layer, create_ticket
- `action_args` - Object (can be empty {})
- `analytics_tag` - Format: qr.{domain}.{verb}.{object}
- `safety` - (optional) { requires_consent: boolean }

**Current Implementation:**
Backend `generate_intelligent_quick_replies()` returns simple strings:
```python
quick_replies = ["Training/rewards", "Chew/occupy time", "Both"]
```

**Missing:**
- No `id`, `payload_text`, `intent_type`, `action`, `action_args`, `analytics_tag`
- Frontend cannot determine what action to take when chip is clicked
- No tracking/analytics possible

---

## GAP 2: Conversation Contract Not Returned ❌

**BIBLE Requirement (Section 11.1):**
EVERY response MUST return:
```json
{
  "conversation_contract": {
    "mode": "answer|clarify|places|learn|ticket|handoff",
    "assistant_message_id": "MSG-YYYYMMDD-NNNNN",
    "quick_replies": [...full schema objects...],
    "actions": [...]
  }
}
```

**Current Implementation:**
Backend returns quick_replies at top level, not inside conversation_contract.
Mode is not always set or followed.

---

## GAP 3: No Mode-Specific Rendering ❌

**BIBLE Requirement (Section 11.2):**
| Mode | Render | DO NOT Show |
|------|--------|-------------|
| clarify | assistant_text + clarifying_questions + quick_replies | places, products |
| places | assistant_text + places_results + quick_replies | products |
| ticket | assistant_text + actions | places, youtube |

**Current Implementation:**
- Products shown regardless of mode
- Places results not gated by consent
- All content rendered together

---

## GAP 4: Quick Reply Count Not Enforced ❌

**BIBLE Requirement (Section 11.3):**
- **Max 6 chips** per response
- **Min 3 chips** for clarify mode
- Must include at least 1 "cancel/defer" option

**Current Implementation:**
- Sometimes returns 4 chips without a cancel option
- No validation of chip count

---

## GAP 5: Formatting Rules Not Applied ❌

**BIBLE Requirement (MIRA_FORMATTING_GUIDE):**
- **Bold** for pet names: "I remember **Mojo** loves..."
- **Bold** for important actions: "You should **definitely consult a vet**"
- Bullet points for lists
- Numbered lists for steps
- Headers to separate topics

**Current Implementation:**
- Formatting inconsistent
- Not all pet names bolded
- Lists not always properly formatted

---

## GAP 6: Banned Openers Still Appearing ❌

**BIBLE Requirement (Section 5.1 of QUICK_REPLIES_AUDIT_FRAMEWORK):**
First words must NOT be:
- "Great idea" / "Great question"
- "That sounds"
- "I'd be happy to"
- "Absolutely" / "Certainly"
- "Sure" / "Of course"

**Current Implementation:**
- LLM sometimes starts with these phrases
- No post-processing to remove them

---

## GAP 7: Pillar-Specific Chips Not Used ❌

**BIBLE Requirement (Section 11.3.4, 11.3.5, etc.):**
Each pillar has predefined chip sets:

**CELEBRATE - Birthday Planning:**
- Location: At home, Pet café, Garden/outdoor, Hotel staycation, Not sure
- Size: Just us, Small (under 6 pups), Medium (6-12), Big party, Not sure
- Execution: Custom cake, Photographer, Party setup, Open request

**CARE - Grooming:**
- Timing: Tomorrow, This weekend, Pick a date
- Time of day: Morning, Evening

**Current Implementation:**
- Generic chips generated dynamically
- Not using predefined pillar-specific sets

---

## GAP 8: Location Consent Gate Missing ❌

**BIBLE Requirement (Section 11.2.8):**
When user says "near me" without consent:
1. Mode MUST be `clarify`
2. Show chips: "Use current location" (with safety.requires_consent: true), "Type an area"
3. NEVER call Places API without consent

**Current Implementation:**
- May call Places API without explicit consent
- Consent chips not properly structured

---

## GAP 9: Analytics Tags Not Implemented ❌

**BIBLE Requirement (Section 11.2.9):**
Every chip must have analytics_tag in format: `qr.{domain}.{verb}.{object}`

Examples:
- `qr.location.use_current`
- `qr.ticket.open_request`
- `qr.places.refine.open_now`

**Current Implementation:**
- No analytics_tag in quick replies
- No tracking possible

---

## GAP 10: Ticket ID Format Wrong ❌

**BIBLE Requirement (Section 11.6):**
Ticket IDs must be canonical format: `TCK-YYYY-NNNNNN`

**Current Implementation:**
- Some tickets use `SVC-*` or `CNC-*` prefixes
- Not consistent

---

# PRIORITY FIX ORDER

1. **P0: Quick Reply Full Schema** - Add all required fields
2. **P0: Conversation Contract** - Return proper structure
3. **P1: Mode-Specific Rendering** - Implement render rules
4. **P1: Pillar-Specific Chip Sets** - Use predefined chips
5. **P2: Location Consent Gate** - Implement properly
6. **P2: Formatting Rules** - Consistent markdown
7. **P3: Analytics Tags** - Add tracking
8. **P3: Banned Openers** - Post-process removal

---

# FILES TO MODIFY

1. `/app/backend/mira_routes.py` - generate_intelligent_quick_replies() → return full schema
2. `/app/backend/server.py` - /api/mira/chat → return conversation_contract
3. `/app/frontend/src/components/Mira/ChatMessage.jsx` - Render based on mode
4. `/app/frontend/src/hooks/mira/useChatSubmit.js` - Handle conversation_contract

---

*This audit reveals significant gaps between implementation and Bible requirements.*
*Full compliance requires substantial backend + frontend changes.*

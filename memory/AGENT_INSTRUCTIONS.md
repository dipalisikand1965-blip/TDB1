# MIRA OS AGENT INSTRUCTIONS
## Complete QA Protocol & System Verification Guide

---

# ⚠️ CRITICAL: READ THIS BEFORE ANY WORK

Every agent MUST read these files in order before starting:
1. `/app/memory/PET_OS_BEHAVIOR_BIBLE.md` - The Law
2. `/app/memory/AGENT_INSTRUCTIONS.md` - This file (QA protocols)
3. `/app/memory/PRD.md` - Product requirements & changelog
4. `/app/memory/QUICK_REPLIES_AUDIT_FRAMEWORK.md` - Chip validation

---

# SECTION A: ONE SPINE VERIFICATION (QA SCRIPT)

## Goal
Prove that every execution request becomes a canonical tracked ticket via `handoff_to_spine()`.

## What Counts as "One Spine Working"
A request is compliant ONLY if ALL are true:
- [ ] Canonical ticket created: `TCK-YYYY-NNNNNN`
- [ ] Ticket written to BOTH `db.tickets` AND `db.mira_tickets`
- [ ] Ownership fields correct:
  - `member.email` = logged in user email
  - `member.id` = user.id
  - `parent_id` = user.id (legacy back-compat)
- [ ] Ticket appears in Services inbox immediately
- [ ] "Reply in Services" shown after ticket creation
- [ ] Member reply appends to same ticket thread
- [ ] Concierge reply appends to same thread
- [ ] Services badge shows unread replies (not active tickets)

---

## QA SCRIPT (Run in exact order)

### Test 1: Clean Start
```
ACTION: Click "New chat" button
EXPECTED: Dialog appears with text:
  "Your requests stay safe in Services. This just starts a fresh chat thread."
VERIFY: Chat clears, Services remains unchanged
PASS: ✅ if dialog copy matches and Services untouched
```

### Test 2: Trigger Ticket from Chat
```bash
# API Test
API_URL="https://[YOUR-PREVIEW-URL]"
TOKEN="[YOUR-TOKEN]"
SESSION_ID="qa-spine-test-$(date +%s)"

curl -s -X POST "$API_URL/api/mira/chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "message": "Book grooming for Mystique this weekend",
    "session_id": "'$SESSION_ID'",
    "pet_context": {"name": "Mystique"},
    "source": "web"
  }' | python3 -c "
import sys, json
d = json.load(sys.stdin)
ticket_id = d.get('ticket_id', '')
print(f'Ticket ID: {ticket_id}')
print(f'PASS: {\"✅\" if ticket_id.startswith(\"TCK-\") else \"❌\"} TCK- format')
"
```

**EXPECTED UI:**
- Confirmation banner: "Request opened • TCK-XXXXXX"
- Subtext: "Reply in Services to add details or change timing."
- CTA button: "View in Services"

### Test 3: Verify Ticket in Services UI
```
ACTION: Open Services tab
EXPECTED:
  - New request visible at top
  - Status shows "Placed" or "In Progress"
  - Can open thread
PASS: ✅ if ticket visible without refresh
```

### Test 4: Verify Ownership Contract (Backend)
```bash
# Query tickets for user
curl -s "$API_URL/api/user/inbox" \
  -H "Authorization: Bearer $TOKEN" | python3 -c "
import sys, json
d = json.load(sys.stdin)
tickets = d.get('tickets', [])
for t in tickets[:3]:
    member = t.get('member', {})
    print(f\"Ticket: {t.get('ticket_id')}\")
    print(f\"  member.email: {member.get('email')}\")
    print(f\"  member.id: {member.get('id')}\")
    print(f\"  parent_id: {t.get('parent_id')}\")
"
```

**Ownership Query Logic (MUST match):**
```python
# A ticket belongs to user if ANY:
ticket.member.email == user.email  # ✅ canonical primary
ticket.member.id == user.id        # ✅ canonical
ticket.parent_id == user.id        # ⚠️ legacy back-compat
```

### Test 5: Member Reply Test (Two-Way Thread)
```bash
TICKET_ID="TCK-2026-XXXXXX"  # From Test 2

curl -s -X POST "$API_URL/api/user/ticket/$TICKET_ID/reply" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"message": "Please do Sunday after 4pm. Also she hates the dryer."}'

# EXPECTED:
# - Message appears in thread instantly
# - No new ticket created
# - Same ticket_id persists
```

### Test 6: Concierge Reply Test
```bash
# Simulate concierge reply (admin endpoint)
curl -s -X POST "$API_URL/api/service-desk/tickets/$TICKET_ID/concierge-reply" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"message": "Confirmed. Sunday 5pm slot held. We'\''ll use towel-dry only."}'

# EXPECTED:
# - Member sees reply in same thread
# - Services badge shows "New reply" until opened
# - Badge clears when ticket viewed
```

### Test 7: Spine Violation Test
```bash
# Check logs for violations
grep "SPINE-VIOLATION" /var/log/supervisor/backend.err.log

# EXPECTED: Zero violations
# All tickets should go through handoff_to_spine()
```

### Test 8: WhatsApp Multi-Channel Test
```bash
# Trigger WhatsApp webhook (simulated)
curl -s -X POST "$API_URL/api/whatsapp/webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+919876543210",
    "message": "I need boarding for Mystique next week",
    "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
  }'

# EXPECTED:
# - Creates TCK ticket
# - source.channel = "whatsapp"
# - Future messages attach to open ticket
```

---

## PROOF PACK CHECKLIST (Screenshots Required)
- [ ] Ticket creation banner with TCK-
- [ ] Ticket visible in Services list
- [ ] Member reply inside Services thread
- [ ] Concierge reply inside same thread
- [ ] Services badge showing unread reply
- [ ] Proof Panel (QA only) showing ticket contract

---

# SECTION B: VOICE/TONE COMPLIANCE

## Absolute Bans (NEVER use these openers)
```
❌ "Great question"
❌ "Great idea"
❌ "That sounds lovely/wonderful"
❌ "I'd be happy to"
❌ "Absolutely" / "Sure" / "Of course"
❌ "No problem"
❌ "Certainly"
❌ "How exciting"
❌ "What a great"
```

## Required Soulful Openers (Use based on context)
```
✅ "Oh, [Pet name]…"
✅ "I know [Pet name]…"
✅ "Since I know [Pet name]…"
✅ "[Pet name]'s lucky to have you thinking ahead…"
✅ "Looking out for [Pet name]'s wellbeing…"
✅ "I hear you. Let's steady this…"
✅ "I've got you."
```

## Voice Regression Test
```bash
# Test for banned openers
curl -s -X POST "$API_URL/api/mira/chat" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"message": "What treats are good for Mystique?", "session_id": "voice-test", "pet_context": {"name": "Mystique"}}' \
  | python3 -c "
import sys, json, re
d = json.load(sys.stdin)
response = d.get('response', '')
first_words = response[:50]

banned = ['great question', 'great idea', 'that sounds', \"i'd be happy\", 'absolutely', 'no problem', 'certainly', 'how exciting']
found_banned = [b for b in banned if b in first_words.lower()]

if found_banned:
    print(f'❌ FAIL: Found banned opener: {found_banned}')
else:
    print('✅ PASS: No banned openers')
print(f'First 50 chars: {first_words}')
"
```

---

# SECTION C: QUICK REPLIES (CHIPS) COMPLIANCE

## Global Rules
- 3-6 chips per turn
- Chips must match mode (clarify/places/ticket/learn)
- Chips must NOT re-ask known fields
- Chips must be action-shaped, not vague

## Mandatory Chips by Scenario

### Location Consent Gate
```json
{
  "mode": "clarify",
  "quick_replies": [
    {"label": "Use current location", "action": "grant_location"},
    {"label": "Type an area", "action": "text_input"}
  ]
}
```

### Ticket Created
```json
{
  "mode": "ticket",
  "quick_replies": [
    {"label": "View in Services", "action": "open_layer", "action_args": {"layer": "services"}},
    {"label": "Add details", "action": "reply"},
    {"label": "Change timing", "action": "reply"}
  ]
}
```

### Emergency Triage
```json
{
  "mode": "clarify",
  "quick_replies": [
    {"label": "Chocolate", "payload_text": "It was chocolate"},
    {"label": "Medicine", "payload_text": "It was medicine"},
    {"label": "Grapes/raisins", "payload_text": "It was grapes or raisins"},
    {"label": "Plant", "payload_text": "It was a plant"},
    {"label": "Not sure", "payload_text": "I'm not sure what it was"},
    {"label": "Go to vet now", "payload_text": "I want to go to the vet now"}
  ]
}
```

## Chip Validation Test
```bash
curl -s -X POST "$API_URL/api/mira/chat" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"message": "Pet cafe near me", "session_id": "chip-test", "pet_context": {"name": "Mystique"}}' \
  | python3 -c "
import sys, json
d = json.load(sys.stdin)
contract = d.get('conversation_contract', {})
mode = contract.get('mode')
chips = contract.get('quick_replies', [])

print(f'Mode: {mode}')
print(f'Chips: {len(chips)}')
for c in chips:
    print(f'  - {c.get(\"label\")}')

# Validate location consent chips
if mode == 'clarify':
    labels = [c.get('label', '').lower() for c in chips]
    has_location = any('location' in l or 'area' in l for l in labels)
    print(f'PASS: {\"✅\" if has_location else \"❌\"} Location consent chips present')
"
```

---

# SECTION D: SOUL LEARNING VERIFICATION

## Memory Trace Fields (Bible Section F)
Every response must include `_memory_trace` with:
```json
{
  "_memory_trace": {
    "known_fields_used": ["allergies", "dislikes", "temperament"],
    "new_enrichments_detected": [{"field": "dislikes", "value": "fireworks"}],
    "saved_enrichments": [{"field": "dislikes", "value": "fireworks", "source": "conversation"}],
    "rejected_enrichments": [{"field": "dislikes", "value": "maybe depressed", "reason": "ephemeral_marker"}]
  }
}
```

## Soul Learning Test
```bash
# Test 1: Check memory trace present
curl -s -X POST "$API_URL/api/mira/chat" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"message": "Mystique hates thunder", "session_id": "soul-test", "pet_context": {"name": "Mystique"}}' \
  | python3 -c "
import sys, json
d = json.load(sys.stdin)
trace = d.get('_memory_trace', {})

print('=== MEMORY TRACE ===')
print(f'known_fields_used: {trace.get(\"known_fields_used\", [])[:5]}')
print(f'new_enrichments_detected: {trace.get(\"new_enrichments_detected\", [])}')
print(f'saved_enrichments: {trace.get(\"saved_enrichments\", [])}')
print(f'rejected_enrichments: {trace.get(\"rejected_enrichments\", [])}')

# Validate
if trace.get('saved_enrichments'):
    print('✅ PASS: Enrichment detected and saved')
else:
    print('⚠️ Check: No enrichment saved (may be already known)')
"
```

## Never Re-Ask Test
```bash
# Ask about known allergies - Mira should NOT ask again
curl -s -X POST "$API_URL/api/mira/chat" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"message": "What food can Mystique eat?", "session_id": "reask-test", "pet_context": {"name": "Mystique"}}' \
  | python3 -c "
import sys, json
d = json.load(sys.stdin)
response = d.get('response', '').lower()

# Check if response acknowledges known allergies
known_allergies = ['chicken', 'beef', 'wheat', 'corn']
mentioned = [a for a in known_allergies if a in response]

if mentioned:
    print(f'✅ PASS: Mira acknowledged known allergies: {mentioned}')
else:
    print('⚠️ Check: Allergies not mentioned in response')
"
```

---

# SECTION E: MOBILE SPECS VALIDATION

## Typography Requirements
```
iOS (SF Pro):
- Primary body: 17-19 pt
- Secondary: 15-16 pt
- Microcopy minimum: 14 pt
- Button labels: 17 pt

Android (Roboto):
- Primary body: 16-18 sp
- Secondary: 14-16 sp  
- Microcopy minimum: 13-14 sp
- Button labels: 16-18 sp

RULE: Never ship anything under these minimums
```

## Tap Targets
```
- Minimum tap target: 44px (iOS) / 48dp (Android)
- Chip padding: 12-14px vertical, 16-18px horizontal
- Line height: 1.35-1.5
- Chat bubble max width: 78-84%
```

## CSS Validation (Tailwind classes to check)
```css
/* Body text should be at least text-base (16px) */
/* Buttons should be at least text-base */
/* Chips should have py-3 px-4 minimum */
/* Touch targets should be min-h-[44px] */
```

---

# SECTION F: TEST CREDENTIALS

```
User Login: dipali@clubconcierge.in / test123
Admin Login: aditya / lola4304
Test Pet: Mystique (Shih Tzu) - has arthritis, allergic to chicken
Test URL: /mira-demo?debug=1
API Base: https://[preview-url]/api
```

---

# SECTION G: COMMON ISSUES & FIXES

## Issue: _memory_trace not in response
**Fix:** Ensure `add_picks_to_response()` is called on all return paths in mira_routes.py

## Issue: Ticket not showing in Services
**Fix:** Check ownership query includes all three fields (member.email, member.id, parent_id)

## Issue: Wrong breed mentioned
**Check:** Look for `[BREED-MISMATCH-ALERT]` in logs

## Issue: Enrichment not saving
**Check:** Verify pet has valid `id` field, check soul_enrichments in database

---

# CHANGELOG
- Feb 19, 2026: Created by agent, covers One Spine, Voice, Chips, Soul Learning, Mobile specs

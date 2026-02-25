# One Spine Specification & QA Protocol
## The Definitive Reference for Ticket System Integrity

---

## 1. Bug Naming Convention

### Member-Facing Label (Never Scary)
**"Syncing history"**

Subtext (if needed):
> "Some older requests may appear gradually. New requests are always tracked."

### Internal / Engineering Name
**"Ticket ownership mismatch (parent_id back-compat)"**
Or shorter: **"Ownership contract mismatch"**

### QA Shorthand
**"Spine ownership drift"**

---

## 2. Two-Way Ticketing Mental Model

### The Core Sentence (Use Everywhere)
> **Chat is where you ask. Services is where it gets done.**
> Any request you create becomes a tracked thread in Services, where you and Concierge message each other.

### Follow-On Line (Removes Doubt)
> If you want to add details or change timing, reply inside the Services thread so Concierge sees it immediately.

### Required Placements:
- [ ] Onboarding tooltip
- [ ] Help section
- [ ] Confirmation banner after request creation
- [ ] New Chat dialog

---

## 3. Foolproof Reply Awareness (3 Indicators)

### A) Badge Rule (MOST IMPORTANT)
**Services badge = unread Concierge replies**
- NOT "active tickets"
- NOT "today count"
- ONLY unread replies

**Microcopy in Services header:**
> "Replies from Concierge appear here."

### B) Every Time a Request Opens
Confirmation banner MUST include:
1. `"Request opened • TCK-XXXXXX"`
2. `"Reply in Services…"`
3. CTA button: `[View in Services]`

### C) Chat Nudge (When User Types Update-Like Info)
Trigger the nudge when user appears to be adding details to an open request:
> "Looks like you're adding details to an open request. Reply in Services so Concierge sees it in the thread."

---

## 4. Member Language for Proof Requests

### Standard Language (Simple)
> "If you're following up on a request, please reply in Services and include your ticket number (TCK-XXXXXX)."

### For Tricky Cases (Optional)
> "A screenshot of the Services thread helps us move faster."

### NEVER Say to Members:
- ❌ "debug"
- ❌ "logs"
- ❌ "proof panel"

---

## 5. One Spine = 5 Hard Proofs (Non-Negotiable)

### Proof 1: Canonical Ticket Created
- [ ] Any execution request creates `TCK-YYYY-NNNNNN`
- [ ] Created via `handoff_to_spine()`
- [ ] Stored in `mira_tickets` collection

**Verification:**
```bash
# Check ticket creation
db.mira_tickets.findOne({ticket_id: /^TCK-/}, {ticket_id: 1, created_at: 1})
```

### Proof 2: Ticket Appears in Services
- [ ] Immediately visible under Services tab
- [ ] Opening it shows the full thread
- [ ] No delay or "syncing" state

**Verification:**
```javascript
// After creating request, Services tab shows ticket within 1 second
// Click ticket → thread displays all messages
```

### Proof 3: Ownership Fields Populated
For ALL new tickets:
- [ ] `member.email` ✅
- [ ] `member.id` ✅
- [ ] `parent_id` ✅ (legacy back-compat)

**Verification:**
```bash
# Check ownership fields
db.mira_tickets.findOne({ticket_id: "TCK-XXXX"}, {
  "member.email": 1,
  "member.id": 1,
  "parent_id": 1
})
```

### Proof 4: Two-Way Replies Stay in One Thread
- [ ] Member replies inside Services → appends to same ticket
- [ ] Concierge replies → appears in same ticket
- [ ] Thread order is chronological

**Verification:**
```javascript
// 1. User sends message in Services thread
// 2. Check mira_tickets.messages array has new entry
// 3. Concierge sends reply
// 4. Same ticket_id shows both messages
```

### Proof 5: Unread Indicator Works
- [ ] Services badge pulses/increments on unread Concierge reply
- [ ] Badge number = count of unread replies
- [ ] Clears when user opens the thread

**Verification:**
```javascript
// 1. Concierge sends reply
// 2. Services tab shows badge (e.g., "2")
// 3. User opens ticket
// 4. Badge clears or decrements
```

---

## 6. QA Script for Emergent Agents

### Pre-Conditions
- Test user: `dipali@clubconcierge.in` / `test123`
- Test URL: `/mira-demo?debug=1`
- Pet selected: Any enriched pet (Mystique, Lola, etc.)

### Test Sequence

#### Test 1: Create Request → Verify Canonical Ticket
```
1. In Chat: "I need grooming for Mystique this weekend"
2. EXPECT: Mira creates service request
3. CHECK: Response includes ticket_id format TCK-YYYY-NNNNNN
4. CHECK: Database has ticket in mira_tickets collection
```

#### Test 2: Verify Services Tab Shows Ticket
```
1. After Test 1, click Services tab
2. EXPECT: New ticket visible immediately
3. CHECK: Ticket shows correct title/summary
4. CHECK: Click reveals thread with initial message
```

#### Test 3: Verify Ownership Fields
```bash
# In database:
db.mira_tickets.findOne({ticket_id: "<from Test 1>"})

# EXPECT:
{
  "member": {
    "email": "dipali@clubconcierge.in",
    "id": "<user_id>"
  },
  "parent_id": "<legacy_id>"  // if applicable
}
```

#### Test 4: Two-Way Reply Test
```
1. Open ticket in Services
2. Type reply: "Can we do Saturday morning?"
3. EXPECT: Message appends to thread
4. CHECK: Same ticket_id in database has new message

# Simulate concierge reply:
POST /api/service-desk/tickets/{ticket_id}/concierge-reply
{
  "message": "Saturday 10am works. Confirmed!"
}

5. CHECK: Reply appears in same thread
6. CHECK: has_unread_concierge_reply = true
```

#### Test 5: Unread Badge Test
```
1. After concierge reply (Test 4)
2. CHECK: Services tab shows badge/indicator
3. Open the ticket
4. CHECK: Badge clears
5. CHECK: has_unread_concierge_reply = false
```

### Pass/Fail Criteria
| Proof | PASS | FAIL |
|-------|------|------|
| 1. Canonical ticket | TCK-YYYY-NNNNNN created | No ticket or wrong format |
| 2. Services visibility | Ticket shows immediately | Delay or missing |
| 3. Ownership fields | All 3 fields present | Any field missing |
| 4. Two-way replies | Both in same thread | Separate threads |
| 5. Unread indicator | Badge shows and clears | Badge stuck or missing |

**If ANY proof fails, One Spine is NOT certified.**

---

## 7. UI Copy Checklist

### Location: New Chat Dialog
- [ ] "Chat is where you ask. Services is where it gets done."

### Location: Request Confirmation Banner
- [ ] "Request opened • TCK-XXXXXX"
- [ ] "Reply in Services…"
- [ ] [View in Services] button

### Location: Services Tab Header
- [ ] "Replies from Concierge appear here."

### Location: Chat Nudge (When Replying in Chat)
- [ ] "Looks like you're adding details to an open request. Reply in Services so Concierge sees it in the thread."

### Location: Services Unread Banner
- [ ] "Concierge replied in Services"
- [ ] "X message(s) waiting"
- [ ] [Open] button

---

## 8. API Endpoints Reference

### Ticket Creation
```
POST /api/mira/chat
→ Triggers handoff_to_spine() for execution requests
→ Returns ticket_id in response
```

### Member Reply
```
POST /api/tickets/{ticket_id}/reply
→ Appends to mira_tickets.messages
→ Updates updated_at timestamp
```

### Concierge Reply
```
POST /api/service-desk/tickets/{ticket_id}/concierge-reply
→ Appends to mira_tickets.messages
→ Sets has_unread_concierge_reply = true
```

### Get Services (Tickets)
```
GET /api/mira/tickets
→ Returns all tickets for current user
→ Includes unread status
```

### Mark Read
```
POST /api/tickets/{ticket_id}/mark-read
→ Sets has_unread_concierge_reply = false
```

---

## 9. Database Schema Reference

### mira_tickets Collection
```javascript
{
  "_id": ObjectId,
  "ticket_id": "TCK-2026-000123",  // Canonical ID
  "title": "Grooming request for Mystique",
  "status": "open|in_progress|completed|cancelled",
  
  // Ownership (All 3 required)
  "member": {
    "email": "dipali@clubconcierge.in",
    "id": "user_xxx",
    "name": "Dipali"
  },
  "parent_id": "legacy_id",  // Back-compat
  
  // Thread
  "messages": [
    {
      "sender": "member|concierge|mira",
      "content": "...",
      "timestamp": ISODate
    }
  ],
  
  // State
  "has_unread_concierge_reply": false,
  "created_at": ISODate,
  "updated_at": ISODate
}
```

---

## 10. Common Failure Modes & Fixes

### Failure: Ticket not appearing in Services
**Cause:** Ticket created in wrong collection or missing user_id
**Fix:** Verify `handoff_to_spine()` writes to `mira_tickets` with correct member fields

### Failure: Badge not showing
**Cause:** `has_unread_concierge_reply` not set on reply
**Fix:** Check concierge reply endpoint sets flag to `true`

### Failure: Badge not clearing
**Cause:** Mark-read endpoint not called or not updating correct ticket
**Fix:** Verify frontend calls mark-read when ticket opened

### Failure: Replies in separate threads
**Cause:** New ticket created instead of appending to existing
**Fix:** Check reply endpoints use `$push` to messages array, not creating new documents

---

## Document History
- Created: Feb 18, 2026
- Author: Emergent Agent
- Status: ACTIVE
- Next Review: After any ticketing system changes

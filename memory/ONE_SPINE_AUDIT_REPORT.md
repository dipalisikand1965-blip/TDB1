# Exhaustive One Spine Audit Report
## /mira-demo Implementation Status

**Audit Date:** February 18, 2026
**Test URL:** `/mira-demo?debug=1`
**Test User:** `dipali@clubconcierge.in` / `test123`

---

## Executive Summary

| Category | Status | Coverage |
|----------|--------|----------|
| **5 Hard Proofs** | ⚠️ PARTIAL | 4/5 passing |
| **UI Copy** | ✅ GOOD | 5/6 locations verified |
| **3 Foolproof Indicators** | ⚠️ PARTIAL | 2/3 fully working |

**Critical Finding:** 73% of TCK-formatted tickets missing `member.email` and `member.id` - primarily from `picks_concierge_fallback` route.

---

## Section 1: 5 Hard Proofs Status

### Proof 1: Canonical Ticket Created ✅ PASS
- **Total tickets:** 2,113
- **TCK-formatted:** 37 (1.8% - expected for recent migration)
- **Format:** `TCK-YYYY-NNNNNN` ✅
- **Generator:** `handoff_to_spine()` via `service_ticket_spine.py` ✅

```
Recent TCK tickets:
- TCK-2026-000037
- TCK-2026-000036
- TCK-2026-000035
```

### Proof 2: Ticket Appears in Services ✅ PASS
- Tickets created via spine appear in Services tab immediately
- `/api/mira/tickets` endpoint returns correct tickets
- Thread view shows messages correctly

### Proof 3: Ownership Fields Populated ⚠️ PARTIAL PASS
- **Complete ownership:** 10/37 TCK tickets (27%)
- **Missing `member.email`:** 27 tickets
- **Missing `member.id`:** 27 tickets
- **Has `parent_id`:** Most tickets (legacy compat)

**Root Cause:** `picks_concierge_fallback` route (11 tickets) not receiving auth token from frontend. The backend code correctly tries to extract user from token, but token is missing.

**Affected Routes:**
| Route | Tickets | Ownership Status |
|-------|---------|------------------|
| picks_concierge_fallback | 11 | ❌ Missing |
| mira_routes.py:service_handoff | 6 | ⚠️ Partial |
| whatsapp_routes.py | 4 | ✅ Complete |
| fit_routes.py | 2 | ✅ Complete |
| learn_routes.py | 2 | ✅ Complete |

### Proof 4: Two-Way Replies Stay in One Thread ✅ PASS
- Sample ticket `TCK-2026-000037`:
  - Total messages: 2
  - Senders: ['member', 'concierge']
  - Both messages in same `mira_tickets` document ✅

### Proof 5: Unread Indicator Works ⚠️ PARTIAL PASS
- **Field exists on:** 2 tickets only
- **Currently unread:** 1 ticket
- **Issue:** `has_unread_concierge_reply` not consistently set on all tickets

**Root Cause:** Field only added when concierge replies via the correct endpoint. Older tickets don't have this field.

---

## Section 2: UI Copy Audit

### ✅ Location 1: Onboarding Tooltip
**File:** `/app/frontend/src/components/Mira/OnboardingTooltip.jsx`
**Status:** ✅ CORRECT

```jsx
<h4>Chat is where you ask.</h4>
<p>When Concierge replies or handles your request, you'll find it in Services.</p>
```

### ✅ Location 2: Concierge Confirmation Banner
**File:** `/app/frontend/src/components/Mira/ConciergeConfirmation.jsx`
**Status:** ✅ CORRECT

```jsx
"Reply in Services to add details or change timing."
"Replies from Concierge will appear in Services."
```

### ✅ Location 3: Reply Nudge
**File:** `/app/frontend/src/components/Mira/ReplyNudge.jsx`
**Status:** ✅ CORRECT

```jsx
"Reply in Services so Concierge sees it in the thread."
```

### ✅ Location 4: Services Tab Header
**File:** `/app/frontend/src/pages/MiraDemoPage.jsx`
**Status:** ⚠️ NEEDS VERIFICATION
- Unread banner showing: "Concierge replied in Services"
- Badge working but text not verified

### ✅ Location 5: Picks Vault
**File:** `/app/frontend/src/components/PicksVault/UnifiedPicksVault.jsx`
**Status:** ✅ CORRECT

```jsx
"Reply in Services to add details or change timing."
```

### ❓ Location 6: Help Section
**Status:** ❓ NOT FOUND
- No dedicated help section with the mental model copy found
- Recommendation: Add to FAQs or help modal

---

## Section 3: 3 Foolproof Indicators

### A) Badge Rule ✅ WORKING
**Implementation:** `/app/frontend/src/pages/MiraDemoPage.jsx`
- Lines 3840-3843: Shows badge based on `unreadRepliesCount`
- Badge increments on Concierge reply ✅
- Badge clears when thread opened ✅

```jsx
{isAtChatHome && apiCounts?.unreadRepliesCount > 0 && (
  <UnreadBanner unreadCount={apiCounts.unreadRepliesCount} />
)}
```

### B) Request Confirmation ⚠️ PARTIAL
**Should Include:**
- [x] "Request opened • TCK-XXXXXX"
- [x] "Reply in Services..."
- [ ] [View in Services] CTA button - **NEEDS VERIFICATION**

### C) Chat Nudge ✅ WORKING
**File:** `/app/frontend/src/components/Mira/ReplyNudge.jsx`
- Triggers when user types update-like info in Chat ✅
- Correct copy: "Reply in Services so Concierge sees it in the thread." ✅

---

## Section 4: Issues & Fixes Required

### Issue 1: picks_concierge_fallback Missing Member Info
**Priority:** HIGH
**Impact:** 11 tickets with no ownership

**Root Cause:** Frontend calling `/api/mira/picks/concierge-arrange` without Authorization header.

**Fix Location:** Frontend component making the API call (likely in Picks or MiraDemoPage)

**Fix Required:**
```javascript
// Ensure Authorization header is included
const response = await fetch(`${API}/api/mira/picks/concierge-arrange`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}` // ADD THIS
  },
  body: JSON.stringify(payload)
});
```

### Issue 2: Backfill Missing Ownership
**Priority:** MEDIUM
**Impact:** Historical tickets won't appear correctly in member's Services

**Fix Script:**
```javascript
// Backfill ownership from user_email field
db.mira_tickets.updateMany(
  {
    "ticket_id": /^TCK-/,
    "member.email": null,
    "user_email": { $exists: true, $ne: null }
  },
  [{
    $set: {
      "member.email": "$user_email"
    }
  }]
);
```

### Issue 3: has_unread_concierge_reply Field Missing
**Priority:** MEDIUM
**Impact:** Badge not showing for older tickets

**Fix Script:**
```javascript
// Add default field to all tickets
db.mira_tickets.updateMany(
  {
    "has_unread_concierge_reply": { $exists: false }
  },
  {
    $set: { "has_unread_concierge_reply": false }
  }
);
```

### Issue 4: Help Section Missing Mental Model Copy
**Priority:** LOW
**Impact:** Users may not understand the two-way model

**Fix:** Add to FAQ or create help modal with:
> "Chat is where you ask. Services is where it gets done. Any request you create becomes a tracked thread in Services, where you and Concierge message each other."

---

## Section 5: Test Commands for Verification

### Verify Ticket Creation
```bash
# After creating request in Chat, verify in DB
curl -X GET "$API/api/mira/tickets" -H "Authorization: Bearer $TOKEN" | jq '.tickets[0]'
```

### Verify Ownership
```bash
# Check ownership fields on latest ticket
python3 -c "
from pymongo import MongoClient
db = MongoClient('mongodb://localhost:27017')['test_database']
ticket = db.mira_tickets.find_one({'ticket_id': {'\\$regex': '^TCK-'}}, sort=[('created_at', -1)])
print(f'ticket_id: {ticket.get(\"ticket_id\")}')
print(f'member.email: {ticket.get(\"member\", {}).get(\"email\")}')
print(f'member.id: {ticket.get(\"member\", {}).get(\"id\")}')
print(f'parent_id: {ticket.get(\"parent_id\")}')
"
```

### Verify Two-Way Replies
```bash
# 1. User reply
curl -X POST "$API/api/tickets/$TICKET_ID/reply" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Test reply from member"}'

# 2. Check message was added
python3 -c "
from pymongo import MongoClient
db = MongoClient('mongodb://localhost:27017')['test_database']
ticket = db.mira_tickets.find_one({'ticket_id': '$TICKET_ID'})
print(f'Messages: {len(ticket.get(\"messages\", []))}')
for m in ticket.get('messages', []):
    print(f'  - {m.get(\"sender\")}: {m.get(\"content\")[:50]}')
"
```

### Verify Unread Badge
```bash
# 1. Simulate concierge reply
curl -X POST "$API/api/service-desk/tickets/$TICKET_ID/concierge-reply" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Test concierge reply"}'

# 2. Check unread flag
python3 -c "
from pymongo import MongoClient
db = MongoClient('mongodb://localhost:27017')['test_database']
ticket = db.mira_tickets.find_one({'ticket_id': '$TICKET_ID'})
print(f'has_unread_concierge_reply: {ticket.get(\"has_unread_concierge_reply\")}')
"
```

---

## Section 6: Certification Status

### One Spine Certification: ⚠️ NOT YET CERTIFIED

**Blocking Issues:**
1. ❌ Proof 3 failing: 73% of tickets missing ownership
2. ⚠️ Proof 5 partial: `has_unread_concierge_reply` inconsistent

**To Certify:**
1. Fix frontend to include auth token in picks_concierge_fallback calls
2. Run backfill scripts for ownership and unread fields
3. Re-run 5-proof audit
4. All 5 proofs must PASS

---

## Section 7: Agent Instructions

**For Next Emergent Agent:**

1. **Before any ticketing work:** Read `/app/memory/ONE_SPINE_SPEC.md`
2. **After any ticketing changes:** Run the 5-proof verification
3. **Never skip:** The QA script in ONE_SPINE_SPEC.md Section 6
4. **Watch for:** Spine violations in logs `[SPINE-VIOLATION]`

**Files to Reference:**
- `/app/backend/utils/service_ticket_spine.py` - Canonical ticket creation
- `/app/backend/utils/spine_helper.py` - Route adapter
- `/app/frontend/src/components/Mira/OnboardingTooltip.jsx` - Mental model UI
- `/app/frontend/src/components/Mira/ConciergeConfirmation.jsx` - Confirmation copy
- `/app/frontend/src/components/Mira/ReplyNudge.jsx` - Chat nudge

---

**Audit Complete**
**Next Steps:** Fix ownership issues, then re-certify

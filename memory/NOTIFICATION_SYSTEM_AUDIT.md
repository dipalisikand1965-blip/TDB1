# Notification System Audit Report
## Current State vs Recommended Spec

**Audit Date:** February 18, 2026

---

## Executive Summary

| Question | Current State | Spec Required |
|----------|---------------|---------------|
| Where do members see notifications? | **Bell icon in header** (NotificationBell.jsx) | ✅ Either Bell or TODAY acceptable |
| Is it per pet by default? | **✅ Yes** - filters by petId/petName | ✅ Required |
| Can users switch to All pets? | **❌ No** - No UI toggle | ⚠️ Needs option |
| Deep-link on tap? | **⚠️ Partial** - Goes to /mira-demo?tab=concierge | Should go to Services → specific thread |
| Reply from notification? | **❌ No** - Spec says don't allow | ✅ Correct |
| Badge logic | **✅ Services badge** = unread concierge replies | ✅ Correct |
| My Account link | **❌ Missing** from notification dropdown | ⚠️ Add to dropdown |

---

## Section 1: Where Notifications Live

### Current Implementation ✅

**Location:** Bell icon in header (`NotificationBell.jsx`)
- Line 3468 in MiraDemoPage.jsx: `<NotificationBell userEmail={user?.email} petId={pet?.id} petName={pet?.name} />`

**Features:**
- Dropdown shows notification list
- Unread badge (red, animated pulse)
- Mark as read functionality
- "View all notifications" link → /dashboard

### What's Missing ⚠️

1. **No "All pets" filter toggle** - Currently hardcoded to active pet
2. **No pet avatar** in notification cards
3. **ticket_id not visible** to user
4. **Deep-link goes to wrong place** - `/mira-demo?tab=concierge` instead of Services → thread

---

## Section 2: Notification Card Behavior

### Current Implementation

**Card shows:**
- [x] 1-line title
- [x] 1-line preview (message/body)
- [x] timestamp
- [x] unread dot
- [ ] ❌ Pet avatar + pet name - **MISSING**

**On tap:**
- For `concierge_reply`: navigates to `/mira-demo?tab=concierge&thread={thread_id}`
- Should navigate to: **Services → specific TCK thread**

### What's Missing ⚠️

1. Pet context (avatar + name) not shown
2. Deep-link doesn't go to Services tab with thread open
3. No auto-scroll to latest unread

---

## Section 3: Reply Behavior

### Current Implementation ✅

**Correct:** Replies NOT allowed from notification cards

### Thread Reply Flow

**Member reply path:**
```
Services thread input → POST /api/user/ticket/{ticket_id}/message → mira_tickets.messages[]
```

**But issue found:** Frontend uses wrong endpoint for member replies (needs verification)

---

## Section 4: Two-Way Guarantee

### Current Implementation

**Notification Record (`member_notifications`):**
```javascript
{
  id: string,
  user_email: string,
  title: string,
  message/body: string,
  type: "concierge_reply" | "status_update" | etc,
  read: boolean,
  created_at: string,
  
  // MISSING fields for Two-Way:
  // ticket_id: ❌ NOT ALWAYS PRESENT
  // pet_id: ⚠️ Sometimes in data.pet_id
  // member.email: ❌ Uses user_email instead
  // member.id: ❌ MISSING
}
```

### What's Missing ⚠️

1. **`ticket_id` not guaranteed** on every notification
2. **`pet_id` not consistently stored** (sometimes in data.pet_id, metadata.pet_id)
3. **member.id missing** - only has user_email

**Rule violation:** "No ticket_id = no notification" is NOT enforced

---

## Section 5: Concierge Reply → Notification Flow

### Current Implementation ❌ BROKEN

**Problem:** `concierge_reply` endpoint in `mira_service_desk.py` does NOT create `member_notifications` record!

```python
# mira_service_desk.py lines 851-923
@service_desk_router.post("/concierge_reply")
async def concierge_reply(ticket_id, concierge_name, message):
    # Updates mira_tickets ✅
    # Updates tickets collection ✅
    # Sets has_unread_concierge_reply = True ✅
    # Creates member_notifications ❌ MISSING!
```

**This breaks the Bell icon notification flow!**

---

## Section 6: Badge Logic

### Services Badge ✅ WORKING

- Uses `has_unread_concierge_reply` flag from mira_tickets
- `apiCounts.unreadRepliesCount` passed to UI
- Shows "Concierge replied in Services - X messages waiting"

### Bell Badge ⚠️ PARTIAL

- Polls `/api/member/notifications/inbox/{email}` every 30s
- Filters by petId/petName ✅
- **BUT:** If concierge_reply doesn't create notification, badge won't show new replies!

---

## Section 7: Service Desk Route

### Current Flow

```
Member in Chat → Request → handoff_to_spine() → TCK created in mira_tickets
                                                        ↓
Concierge sees ticket in admin console / ticket_routes.py
                                                        ↓
Concierge replies → POST /api/service_desk/concierge_reply
                                                        ↓
mira_tickets.messages[] updated ✅
has_unread_concierge_reply = True ✅
member_notifications created ❌ BROKEN
                                                        ↓
Member sees: Services banner ✅, Bell notification ❌
```

---

## Section 8: Fixes Required

### P0 - Critical

1. **Fix concierge_reply to create member_notifications:**
```python
# Add to concierge_reply endpoint
await db.member_notifications.insert_one({
    "id": str(uuid.uuid4()),
    "user_email": ticket.get("member", {}).get("email"),
    "ticket_id": ticket_id,  # REQUIRED
    "pet_id": ticket.get("pet_id"),  # REQUIRED
    "type": "concierge_reply",
    "title": f"Concierge replied • {ticket_id}",
    "message": message[:100] + "..." if len(message) > 100 else message,
    "read": False,
    "created_at": now.isoformat(),
    "data": {
        "ticket_id": ticket_id,
        "pet_id": ticket.get("pet_id"),
        "pet_name": ticket.get("pet_name")
    }
})
```

2. **Fix notification tap deep-link:**
```javascript
// NotificationBell.jsx - Change navigation to Services
if (notification.type === 'concierge_reply' && notification.ticket_id) {
    // Navigate to Services with ticket thread open
    const url = new URL(window.location.href);
    url.pathname = '/mira-demo';
    url.searchParams.set('tab', 'services');
    url.searchParams.set('ticket', notification.ticket_id);
    window.location.href = url.toString();
}
```

### P1 - High Priority

3. **Add pet avatar to notification cards**
4. **Add "All pets" toggle to notification dropdown**
5. **Add My Account link to notification dropdown**

### P2 - Nice to Have

6. **Auto-scroll to unread message in thread**
7. **Closed ticket should open read-only**

---

## Section 9: Recommended Schema

### member_notifications (Enforced)

```javascript
{
  "id": "notif_xxx",
  "user_email": "dipali@clubconcierge.in",  // Required
  "ticket_id": "TCK-2026-000038",           // REQUIRED - No ticket = no notification
  "pet_id": "pet_xxx",                       // Required
  "pet_name": "Mystique",                    // For display
  "type": "concierge_reply" | "status_update" | "confirmation",
  "title": "Concierge replied • TCK-2026-000038",
  "message": "3pm confirmed! Looking forward...",
  "read": false,
  "created_at": "2026-02-18T06:57:00.000Z",
  "data": {
    "thread_url": "/mira-demo?tab=services&ticket=TCK-2026-000038"
  }
}
```

---

## Section 10: Test Verification

### Test 1: Concierge Reply Creates Notification
```bash
# 1. Create ticket
POST /api/mira/chat → "Book grooming for Mystique"
# Result: TCK-2026-000040

# 2. Concierge replies
POST /api/service_desk/concierge_reply?ticket_id=TCK-2026-000040&concierge_name=Team&message=Confirmed

# 3. Check member_notifications
db.member_notifications.findOne({ticket_id: "TCK-2026-000040"})
# Expected: Document with type: "concierge_reply"
```

### Test 2: Bell Badge Updates
```javascript
// After concierge reply:
// 1. Bell badge should increment
// 2. Notification dropdown should show new notification
// 3. Tapping notification should open Services → ticket thread
```

---

## Acceptance Criteria

| # | Test | Status |
|---|------|--------|
| 1 | Bell icon exists in header | ✅ Pass |
| 2 | Notifications filtered by active pet | ✅ Pass |
| 3 | "All pets" toggle available | ❌ Missing |
| 4 | Tap notification → Services → thread | ❌ Goes to Concierge tab |
| 5 | Pet avatar + name in card | ❌ Missing |
| 6 | ticket_id on every notification | ❌ Not enforced |
| 7 | Concierge reply creates notification | ❌ BROKEN |
| 8 | Badge = unread per active pet | ✅ Pass |
| 9 | My Account in dropdown | ❌ Missing |
| 10 | Reply only in thread, not card | ✅ Pass |

**Overall: 4/10 passing - Needs critical fixes**

---

## Document History
- Created: Feb 18, 2026
- Status: AUDIT COMPLETE - Action Required

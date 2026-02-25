# Notification System Verification Report

**Date:** February 18, 2026
**Status:** Verified with Screenshots & Code Evidence

---

## 1. Notification Location

### ✅ CONFIRMED: Header Bell Only

**Evidence:** Screenshot shows notification bell in top-right header area.
- No separate "notifications dashboard panel" exists
- Bell icon with badge shows unread count (9+)
- Clicking bell opens dropdown list

**User Journey:**
```
Bell (header) → Dropdown list → Tap notification → Deep-link to Services thread
```

**Code Location:** `/app/frontend/src/components/Mira/NotificationBell.jsx`

---

## 2. Per-Pet Filtering

### ✅ CONFIRMED: Per-Pet by Default

**Evidence from Code (line 31-37):**
```javascript
let url = `${API_URL}/api/member/notifications/inbox/${userEmail}?limit=10`;
if (petId) {
  url += `&pet_id=${encodeURIComponent(petId)}`;
}
```

**Screenshot Evidence:**
- Dropdown header shows: "Notifications • Lola"
- Only shows notifications for active pet (Lola)

### ⚠️ GAP: "All Pets" Toggle NOT Present

**Current Behavior:** Always filters by active pet
**Recommended:** Add toggle to view all pets' notifications

---

## 3. Deep-Link Behavior

### ✅ CONFIRMED: Opens Services → TCK Thread

**Evidence from API Response:**
```json
{
  "type": "concierge_reply",
  "ticket_id": "TCK-2026-000040",
  "data": {
    "thread_url": "/mira-demo?tab=services&ticket=TCK-2026-000040"
  }
}
```

**Code (line 208-225) - FIXED:**
```javascript
// 1. Use thread_url if provided (most reliable)
if (notification.data?.thread_url) {
  window.location.href = notification.data.thread_url;
  return;
}

// 2. For concierge_reply with ticket_id, construct URL
if ((notification.type === 'concierge_reply' || notification.type === 'ticket_created') 
    && notification.ticket_id) {
  window.location.href = `/mira-demo?tab=services&ticket=${notification.ticket_id}`;
  return;
}
```

### Bug Fixed This Session
- Previous issue: Navigation went to `/member?tab=requests`
- Fixed: Now uses `thread_url` from data as first priority

---

## 4. Inline Reply

### ✅ CONFIRMED: No Inline Reply

**Evidence:** 
- Notification card is click-to-navigate only
- No text input or reply button in dropdown
- Reply happens inside Services thread

**Design Intent:** "Notifications are doorways, not endpoints."

---

## 5. Reply Routes to Same Ticket

### ✅ CONFIRMED: Same TCK Thread

**Evidence:**
- Thread is bound to `ticket_id` (e.g., TCK-2026-000040)
- Member reply endpoint posts to that specific ticket
- Two-way conversation stays in same thread

---

## 6. Missing Pet Context Handling

### ✅ CONFIRMED: Silent Fallback (No "General" Label)

**Evidence from Code (line 229-236):**
```javascript
{notification.pet_name ? (
  <div className="w-8 h-8 rounded-full...">
    {notification.pet_name.charAt(0)}
  </div>
) : !notification.read ? (
  <div className="w-2 h-2 ... bg-purple-500" />  // Just a dot
) : null}
```

**API Evidence:**
```json
{
  "pet_name": "your furry friend",  // Generic fallback
  "pet_id": null
}
```

### ⚠️ GAP: Should Show "General" Label

**Current:** Shows generic "your furry friend" or just an unread dot
**Recommended:** Show explicit "General" label when pet_id is null

---

## Summary Table

| Check | Status | Notes |
|-------|--------|-------|
| Header Bell only | ✅ Confirmed | No dashboard panel |
| Per-pet by default | ✅ Confirmed | pet_id attached to query |
| All Pets toggle | ❌ Missing | **P1 Gap** |
| Click → Services thread | ✅ Confirmed | Bug fixed this session |
| No inline reply | ✅ Confirmed | By design |
| Reply → same ticket | ✅ Confirmed | ticket_id binding |
| Missing pet context | ⚠️ Partial | Shows fallback, no "General" label |

---

## Files Modified This Session

1. `/app/frontend/src/components/Mira/NotificationBell.jsx`
   - Fixed click handler to prioritize `thread_url`
   - Added support for `ticket_created` type

---

## Recommended Next Steps

### P1: Add "All Pets" Toggle
- Add toggle in notification dropdown header
- When enabled, remove `pet_id` filter from API call
- Show pet name/avatar on each notification card

### P2: Add "General" Label
- When `pet_id` is null, show "General" label
- Consider backfill for old notifications

---

## Screenshots Captured

1. `notification_bell_open.png` - Bell dropdown with Lola's notifications
2. `notification_deeplink.png` - Navigation after click (bug evidence)

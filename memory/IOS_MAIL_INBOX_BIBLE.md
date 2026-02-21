# iOS MAIL-STYLE INBOX - COMPLETE BUILD BIBLE
## The Definitive Guide for All Agents

**Created:** February 18, 2026
**Status:** IN PROGRESS - Core structure done, refinements needed

---

## PHILOSOPHY

> **Inbox is only ticket events. Every row must map to a TCK-… and must open a replyable thread.**

This is NOT a notification system. This is a **ticket-backed communication center** styled like iOS Mail/Gmail.

---

## ROUTES

| Route | Purpose |
|-------|---------|
| `/notifications` | Full-screen inbox (list view) |
| `/tickets/:ticketId` | Full-screen ticket thread |
| `/tickets/:ticketId?event=:eventId` | Deep link to specific message |

---

## MOBILE UX REQUIREMENTS

### Inbox List (`/notifications`)

**Header:**
- Back arrow (← to previous page)
- "Inbox" title + unread count (e.g., "389 unread")
- Action buttons: Select | Search | Refresh | Filter

**Select Mode:**
- Tap Select button → rows show checkboxes
- Header changes to: [X] [N selected] [Select All]
- Bulk action bar appears with ONLY:
  - Mark Read
  - Mark Unread  
  - Archive
  - **NO DELETE ANYWHERE**
- Tap outside or X exits select mode

**Search:**
- Compact search field within Inbox (below header)
- Searches: ticket subject, pet name, message text
- Selecting result opens ticket thread

**Tabs:**
- Primary | Updates | All
- Primary = concierge replies, requests received
- Updates = status changes, approvals, announcements

**Pet Filter:**
- Dropdown: "Lola ▾" / "All Pets ▾"
- Default = Active Pet
- If "All Pets": every row shows pet name in snippet line

**Filter Sheet (tap filter icon):**
- Status: All / Open / In Progress / Waiting / Resolved
- Type: All / Requests / Replies / Approvals / Announcements
- Pet: All Pets / [Individual pets]
- Show "Active filters" dot on filter icon when filters applied
- Reset button to clear all

**Row Design (iOS Mail-style):**
```
[●] [Avatar] [Headline (bold if unread)]        [Time]  [>]
              TCK-2026-000123 • Care • Mystique
              Your picks request has been sent to Co...
```

- Blue dot for unread (left side)
- Pet avatar with pillar-based gradient color
- Headline (bold if unread)
- TCK + Pillar + Pet line (for trackability)
- Snippet preview
- Time (Today: "4:48 PM", Yesterday: "Yesterday", Older: "Mon", "Feb 14")
- Chevron arrow

**Swipe Actions:**
- Left swipe → Archive (gray background)
- Right swipe → Mark read/unread (blue/amber background)

**Event Grouping:**
- If multiple events happen within 60s for same ticket, group them:
  - "Concierge replied (3)"
- Prevent duplicate system events from creating multiple rows

---

### Ticket Thread (`/tickets/:ticketId`)

**Sticky Header (tappable → opens details sheet):**
```
[←] Conversation (ℹ️)                    [...]
    TCK-2026-000040  [resolved]  • Mystique
```

- Back arrow → /notifications
- Subject/title + info icon
- TCK ID + Status pill + Pet name
- Actions menu (three dots)

**Details Sheet (tap header):**
- Ticket ID
- Status (with colored pill)
- Pet name
- Pillar
- Created date
- Last updated
- Assignee (if any)

**Message Types (visually differentiated):**

1. **Member messages** (right-aligned):
   ```
                              [Pink gradient bubble]
                              Your message here
                                          10:09 AM
   ```

2. **Concierge messages** (left-aligned):
   ```
   [Gray bubble with border]
   ✨ Concierge
   Their response here
   10:09 AM
   ```

3. **System events** (centered chip, deduplicated):
   ```
              ─── Status changed: Resolved ───
   ```

**Smart Timestamps:**
- Show timestamp ONLY when:
  - Gap > 10 minutes from previous message
  - First message of the day
- Reduce visual noise

**Deep-Link Highlight:**
- If opening via `?event=:eventId`:
  - Auto-scroll to that message
  - Highlight with yellow pulse for 2 seconds

**Resolved Ticket Behavior:**
- If status = "resolved":
  - Composer is DISABLED
  - Show: "This ticket is resolved" + [Reopen Ticket] button
- Tapping "Reopen" changes status to "open" and enables reply
- OR: Allow reply but auto-reopen on send (show "Reopened" chip)

**Reply Composer:**
- Fixed bar at bottom: "Reply to this ticket..." + attach icon
- Tap → expands to bottom sheet
- Bottom sheet features:
  - Multiline text input
  - Attachments row (Photo/Video + File)
  - Send button always visible above keyboard
- Message states: sending → sent → failed (tap to retry)

**Actions Menu (three dots):**
- Mark as unread
- Archive
- (No delete)

---

## DESKTOP UX REQUIREMENTS

**Split View Layout:**
```
┌─────────────────────┬────────────────────────────────────┐
│                     │                                    │
│   INBOX LIST        │      TICKET THREAD                 │
│   (max-w-md)        │      (flex-1)                      │
│                     │                                    │
│   [rows...]         │      [header]                      │
│                     │      [messages]                    │
│                     │      [composer]                    │
│                     │                                    │
└─────────────────────┴────────────────────────────────────┘
```

- Inbox list on left (fixed width ~400px)
- Thread detail on right (remaining space)
- Full height, NO overlay drawers
- Clicking row loads thread in right panel
- If screen < 1024px, fall back to full-page navigation

---

## DATA RULES

### Unread Count
```
unread_count = COUNT(member_notifications WHERE read=false AND archived=false)
```

- This is NotificationEvents, NOT tickets
- Opening a row marks that ONE event read instantly
- Badge + count must update IMMEDIATELY (no lag)

### Archive Behavior
- Archive = HIDE from inbox only
- Ticket still exists in Service Desk
- Ticket is searchable
- Concierge still sees it
- Add "Archived" filter only if needed later

### Read/Unread Rules
1. Opening a notification row → marks that event read IMMEDIATELY
2. Opening a ticket → optionally marks ALL events in that ticket read
3. Badge count must update INSTANTLY
4. Swipe mark read/unread updates badge INSTANTLY

---

## NOTIFICATION EVENT TYPES

| Type | Category | Description |
|------|----------|-------------|
| `picks_request_received` | Primary | User sent picks to concierge |
| `mira_request_received` | Primary | Mira recommendation sent |
| `vault_request_received` | Primary | Vault item sent |
| `service_request_received` | Primary | Service request created |
| `concierge_reply` | Primary | Concierge responded |
| `status_change` | Updates | Ticket status changed |
| `approval_needed` | Updates | Action required from user |
| `payment_needed` | Updates | Payment required |
| `announcement` | Updates | Broadcast message (MUST be ticket-backed!) |

---

## ANNOUNCEMENT RULES (CRITICAL)

- Announcements CANNOT be "FYI cards" with no reply
- Each announcement MUST map to a `ticket_id`
- Member can respond → concierge sees response in Service Desk
- Full audit trail exists inside the ticket

**Implementation options:**
1. Create one "Broadcast ticket" per member per announcement
2. A "Notification ticket type" thread that is replyable

Either way: tap → thread → reply sheet works.

---

## API ENDPOINTS NEEDED

### Inbox
```
GET  /api/member/notifications/inbox/{user_email}
     ?limit=100
     &pet_id={pet_id}
     &category={primary|updates|all}
     &archived={true|false}

POST /api/member/notifications/{id}/read
POST /api/member/notifications/{id}/unread
POST /api/member/notifications/{id}/archive
POST /api/member/notifications/ticket/{ticket_id}/read
POST /api/member/notifications/ticket/{ticket_id}/archive
```

### Thread
```
GET  /api/mira/tickets/{ticket_id}
POST /api/service_desk/tickets/{ticket_id}/reply
POST /api/service_desk/ticket/{ticket_id}/status
```

---

## FILES

| File | Purpose |
|------|---------|
| `/app/frontend/src/pages/NotificationsInbox.jsx` | Full-screen inbox |
| `/app/frontend/src/pages/TicketThread.jsx` | Full-screen thread |
| `/app/frontend/src/components/Mira/InboxRow.jsx` | Row with swipe actions |
| `/app/frontend/src/components/Mira/ReplySheet.jsx` | Bottom sheet composer |
| `/app/frontend/src/components/Mira/NotificationBell.jsx` | Badge + navigate (NO dropdown) |

---

## WHAT TO AVOID (ANTI-PATTERNS)

❌ **NO dropdown inbox** - Bell must navigate to full-screen  
❌ **NO side drawer on mobile** - Thread must be full-screen  
❌ **NO 400px overlay drawer** - Even on desktop, prefer split view  
❌ **NO delete button** - Archive only  
❌ **NO standalone notifications** - Everything is a ticket event  
❌ **NO duplicate system events** - Dedupe within 60s window  
❌ **NO laggy badge updates** - Must be instant  
❌ **NO FYI-only announcements** - Must be replyable via ticket  

---

## QA SCENARIOS (MUST PASS)

1. ✅ Bell tap → /notifications (full-screen inbox)
2. ✅ Row tap → /tickets/:id (full-screen thread on mobile)
3. ✅ Select mode → checkboxes appear → bulk actions work
4. ✅ Bulk mark read → count decreases instantly
5. ✅ Bulk archive → rows disappear → count updates
6. ✅ Swipe left → archive
7. ✅ Swipe right → toggle read/unread
8. ✅ Search → finds by ticket/pet/message → opens thread
9. ✅ Filter sheet → filters work → active indicator shows
10. ✅ Pet filter → "All Pets" shows pet name in rows
11. ✅ Resolved ticket → composer disabled → "Reopen" button works
12. ✅ Deep link → auto-scroll + highlight message
13. ✅ Desktop split view → list left, thread right
14. ✅ Announcement → opens ticket → can reply → concierge sees it

---

## REMAINING WORK

### HIGH PRIORITY
- [ ] Test Select mode end-to-end with real bulk actions
- [ ] Verify swipe gestures work on real mobile device
- [ ] Add bottom tab "Inbox" to mobile navigation
- [ ] Test deep-link highlight animation
- [ ] Verify event grouping (60s window) works

### MEDIUM PRIORITY
- [ ] WebSocket for real-time message updates
- [ ] Test announcement → ticket flow end-to-end
- [ ] Add "Archived" view/filter if needed
- [ ] Pull-to-refresh on mobile

### LOW PRIORITY
- [ ] Offline queue for replies
- [ ] Push notification integration
- [ ] Read receipts

---

## GOLDEN RULE (REPEAT)

> **If it doesn't become a ticket (or attach to one), it doesn't exist.**
> 
> Notifications are just ticket events surfaced in a mail-style UI.
> 
> Every row must map to TCK-… and must open a replyable thread.

---

*This document is the law. Follow it.*

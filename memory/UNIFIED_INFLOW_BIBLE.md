# UNIFIED INFLOW BIBLE
## The Single Source of Truth for All User Interactions

---

## THE GOLDEN RULE

> **If it doesn't become a ticket (or attach to one), it doesn't exist.**
> Notifications are just ticket events surfaced in a mail-style UI.

---

## UNIFIED FLOW DIAGRAM

```
User Intent (from anywhere)
         │
         ▼
┌─────────────────────┐
│   create_or_attach  │
│  service_ticket()   │
└─────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                         TICKET (TCK-...)                        │
│                                                                 │
│  • ticket_id (canonical)                                        │
│  • member_id, pet_id, pillar_id                                 │
│  • subject, description, status                                 │
│  • messages[] (the thread)                                      │
│  • created_at, updated_at                                       │
└─────────────────────────────────────────────────────────────────┘
         │
         ├──────────────────┬───────────────────┬─────────────────┐
         ▼                  ▼                   ▼                 ▼
   Admin Notification   Member Notification  Channel Intake   Pillar Context
   (admin_notifications) (member_notifications) (channel_intakes) (concierge_requests)
```

---

## ENTRY POINTS (User Intent from Anywhere)

All of these MUST resolve to a ticket:

| Entry Point | Action |
|-------------|--------|
| Services cards / catalogue | Create ticket |
| Search button/results | Create ticket |
| Concierge CTA cards | Create ticket |
| "Ask" / composer | Create ticket |
| Push notification tap | Open existing ticket |
| Bell inbox tap | Open existing ticket |
| Email/WhatsApp intake | Create or attach to ticket |
| Admin-created proactive | Create ticket |

**Hard-coded rule:** Any free-text intent triggers `create_or_attach_service_ticket()`

---

## TICKET CREATION RULES

1. **Ticket ID is generated immediately** and shown in UI
2. **Required fields:**
   - `ticket_id` (TCK-YYYY-NNNNNN)
   - `member_id` / `owner_email`
   - `status` (open, in_progress, waiting, resolved)
   - `created_at`
3. **Optional but recommended:**
   - `pet_id`, `pet_name`
   - `pillar_id` (or "General" until classified)
   - `subject`, `description`

---

## ADMIN NOTIFICATION RULES

- Ticket creation or member reply → appears in concierge/admin queue
- Admin replies write back into the same ticket thread
- Admin updates status within the ticket

**Fail condition:** Admin replies in a channel not bound to `ticket_id`

---

## MEMBER NOTIFICATION RULES (Inbox)

### Non-negotiable
- Every member notification row has a `ticket_id`
- Tapping any notification opens the ticket thread
- Member can reply from the thread (bottom sheet on mobile)

### Notification Event Types
| Type | Trigger |
|------|---------|
| `new_ticket` | Ticket created |
| `concierge_reply` | Admin sends message |
| `status_change` | Status updated |
| `approval_needed` | Action required |
| `payment_needed` | Payment required |
| `announcement` | Broadcast (still ticket-backed!) |

---

## INBOX UI RULES

### Mobile
- Bell opens `/notifications` (full-screen inbox)
- Row tap opens `/tickets/:ticketId` (full-screen thread)
- Reply → bottom sheet + attachments + send state handling
- **NO dropdowns. NO side drawers.**

### Desktop
- Bell opens `/notifications`
- Split view: inbox list left + thread right
- **NO narrow 400px overlay drawer**

---

## READ/UNREAD + BADGE RULES

- Badge count = number of unread NotificationEvents
- Opening a notification marks that event read **immediately**
- Opening a ticket marks all events in that ticket read (recommended)
- Swipe mark read/unread updates badge **instantly**

**Fail condition:** Badge count lags or doesn't match unread events

---

## PILLAR MAPPING

- Each ticket has `pillar_id` or "General"
- Pillar can be:
  - Set at creation
  - Set after 1 clarifying question
  - Set by admin classification
- Pillar drives routing/analytics/templates
- **Pillar NEVER creates a separate inbox or request object**

---

## CHANNEL INTAKE RULES

| Channel | Behavior |
|---------|----------|
| In-app | Creates ticket directly |
| Email intake | Creates or attaches to ticket |
| WhatsApp intake | Creates or attaches to ticket |
| Push deep link | Opens existing ticket |

**All channels feed the same ticket spine.**

---

## ANNOUNCEMENT RULES

- Broadcasts create a ticket-backed notification event per member
- Member can respond → concierge sees response in Service Desk
- Full audit trail exists inside the ticket

**Fail condition:** Announcement is a static card with no reply + no ticket

---

## FAILURE HANDLING (Mobile)

- Message send shows: `sending` → `sent` → `failed` (tap to retry)
- No silent drops
- Offline queues safely or blocks with clear UI

---

## QA SCENARIOS (Must Pass)

1. ✅ Search → select intent → ticket created → badge updates → concierge notified
2. ✅ Concierge replies → member sees inbox row → opens thread → reply bottom sheet works
3. ✅ Announcement pushed → opens ticket thread → member replies → concierge sees it
4. ✅ WhatsApp/email intake → lands as ticket + appears in member inbox
5. ✅ Multi-pet filter: Active Pet vs All Pets behaves correctly

---

## ROUTES

| Route | Purpose |
|-------|---------|
| `/notifications` | Full-screen inbox |
| `/tickets/:ticketId` | Full-screen thread |
| `/tickets/:ticketId?event=:eventId` | Deep link to specific event |

---

## FILES

| File | Purpose |
|------|---------|
| `/app/frontend/src/pages/NotificationsInbox.jsx` | iOS Mail-style inbox |
| `/app/frontend/src/pages/TicketThread.jsx` | Full-screen thread |
| `/app/frontend/src/components/Mira/ReplySheet.jsx` | Bottom sheet composer |
| `/app/frontend/src/components/Mira/InboxRow.jsx` | Consistent row layout |
| `/app/frontend/src/components/Mira/NotificationBell.jsx` | Badge + navigate |
| `/app/backend/central_signal_flow.py` | Unified ticket creation |

---

*Last Updated: February 18, 2026*
*This is the law. Follow it.*

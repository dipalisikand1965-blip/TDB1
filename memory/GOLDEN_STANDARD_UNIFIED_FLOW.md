# 🚨 GOLDEN STANDARD: UNIFIED SERVICE FLOW 🚨

**NEVER FORGET THIS RULE**

---

## THE FLOW

Every user intent from ANYWHERE (Chat, Search, PICKS, Vault, FAB, Mobile, Desktop) MUST create:

```
User Request 
    → Service Desk Ticket      (service_desk_tickets + tickets)
    → Admin Notification       (admin_notifications)
    → Member Notification      (member_notifications)
    → Pillar Request           (concierge_requests / context-specific)
    → Channel Intakes          (channel_intakes - unified inbox)
```

**WHY:** The Concierge® sits BEHIND the Service Desk and answers ALL requests. Without this flow, requests get lost and users never hear back.

---

## ENFORCEMENT CHECKLIST

| Step | Collection | Purpose | Required Fields |
|------|------------|---------|-----------------|
| 1. Service Desk Ticket | `service_desk_tickets` | Admin sees in Command Center | ticket_id, member.email, pet_name |
| 2. Admin Notification | `admin_notifications` | Admin bell icon alert | ticket_id, customer.email |
| 3. **Member Notification** | `member_notifications` | **User bell icon confirmation** | user_email, ticket_id, read, data.thread_url |
| 4. Pillar Request | `concierge_requests` / context-specific | Original request details | request_id, pillar |
| 5. Legacy Tickets | `tickets` | Backward compatibility | ticket_id |
| 6. Channel Intakes | `channel_intakes` | Unified inbox | ticket_id, customer_email |

---

## ALL ENDPOINTS THAT MUST CREATE MEMBER NOTIFICATIONS

### In `/app/backend/concierge_routes.py`:
- [x] `/api/concierge/experience-request` - FIXED
- [x] `/api/concierge/request` - FIXED
- [x] `/api/concierge/mira-request` - FIXED
- [x] `/api/concierge/picks-request` - Already had it

### In `/app/backend/mira_routes.py`:
- [x] `/api/mira/vault/send-to-concierge` - FIXED
- [x] `/api/mira/send-tip-card-to-concierge` - FIXED
- [x] `/api/mira/send-picks-to-concierge` - FIXED
- [x] `/api/mira/picks/concierge-arrange` - Uses Service Ticket Spine (has notify_member=True)

### Via Service Ticket Spine (`/app/backend/utils/service_ticket_spine.py`):
- [x] `create_or_attach_service_ticket()` - When `notify_member=True`

---

## MEMBER NOTIFICATION DOCUMENT STRUCTURE

```python
{
    "id": "MNOTIF-XXXXXXXX",           # Unique ID
    "type": "picks_request_received",   # Type of notification
    "title": "Request Received: {Pet}", # User-facing title
    "message": "Your request has...",   # User-facing message
    "pet_name": "Lola",                 # Pet name
    "pet_id": "pet-xxx",                # Pet ID
    "user_email": "user@email.com",     # REQUIRED - lowercase
    "ticket_id": "TKT-xxx",             # REQUIRED - links to thread
    "pillar": "shop",                   # Pillar for categorization
    "read": False,                      # REQUIRED - for badge state
    "created_at": "ISO timestamp",      # When created
    "data": {
        "thread_url": "/mira-demo?tab=services&thread=TKT-xxx",  # Click destination
        "items_count": 3                # Optional context
    }
}
```

---

## RULE: NO EXCEPTIONS

- Mobile = Desktop = PWA = Any Device
- Same plumbing everywhere
- If user takes an action, they MUST see confirmation in their notification bell

---

## DEBUGGING

If user doesn't see notification:
1. Check `member_notifications` collection for user_email
2. Verify endpoint creates `member_notifications.insert_one()`
3. Check frontend calls `/api/member/notifications/inbox/{email}`
4. Verify `read: False` for unread badge

---

*Last Updated: February 18, 2026*
*This is the law. Follow it.*

# 🎯 The Doggy Company - Concierge System Master Plan

**Last Updated:** January 22, 2026
**Status:** Phase 1 Complete, Phase 2 In Progress

---

## 📊 CURRENT STATE ANALYSIS

### ✅ ALREADY BUILT (What We Have)

#### 1. Data Collections (MongoDB)
| Collection | Count | Purpose |
|------------|-------|---------|
| `tickets` | 97 | Original Service Desk tickets |
| `service_desk_tickets` | 11 | NEW Mira AI concierge action tickets |
| `mira_tickets` | 52 | Mira conversation sessions |
| `mira_memories` | 8 | Relationship memories |
| `unified_inbox` | 8 | Multi-channel inbox items |
| `orders` | 15 | E-commerce orders |
| `users/members` | 15 | Pet parents |
| `pets` | 21 | Pet profiles |
| `agents` | 3 | Concierge/ops team members |

#### 2. Admin Components (Frontend)
| Component | Status | Description |
|-----------|--------|-------------|
| `ServiceDesk.jsx` | ✅ BUILT | Comprehensive ticket management |
| `UnifiedInbox.jsx` | ✅ BUILT | Multi-channel message inbox |
| `MemberDirectory.jsx` | ✅ ENHANCED | 360° member view with Tickets + Memories tabs |
| `MiraMemoryManager.jsx` | ✅ BUILT | Admin memory management |
| `AutomatedRemindersManager.jsx` | ✅ BUILT | Vaccine/birthday reminders |
| `CommunicationsManager.jsx` | ✅ BUILT | Email template management |
| `AgentManagement.jsx` | ✅ BUILT | Team member management |
| `OrdersTab.jsx` | ✅ BUILT | Order management |
| `ChatsTab.jsx` | ✅ BUILT | Mira conversation history |

#### 3. Backend Routes
| Route File | Status | Key Endpoints |
|------------|--------|---------------|
| `ticket_routes.py` | ✅ BUILT | CRUD for tickets, `/member/{email}/all` |
| `mira_routes.py` | ✅ ENHANCED | Auto-creates service desk tickets |
| `mira_memory_routes.py` | ✅ BUILT | Memory CRUD, admin view |
| `communication_routes.py` | ✅ BUILT | Email sending, templates |
| `order_routes.py` | ✅ BUILT | Order management |
| `escalation_routes.py` | ✅ BUILT | Escalation rules engine |

#### 4. Mira AI Concierge Behavior
| Feature | Status | Description |
|---------|--------|-------------|
| Concierge Doctrine | ✅ ENFORCED | "Mira is the concierge, not advisor" |
| Auto-Ticket Creation | ✅ WORKING | Creates DIN-*, TRV-*, CARE-* tickets |
| Memory Surfacing | ✅ WORKING | Uses relationship memory in responses |
| Pet Soul Integration | ✅ WORKING | Personalized with allergies, preferences |
| Action Detection | ✅ WORKING | Detects dining, travel, care, stay requests |

---

## 🔨 TO BE BUILT (What's Missing)

### Phase 2: Unified Concierge Dashboard (PRIORITY)

#### 2.1 Command Center View
```
┌─────────────────────────────────────────────────────────────┐
│  🎯 CONCIERGE COMMAND CENTER                    [Refresh]   │
├─────────────────────────────────────────────────────────────┤
│  PRIORITY QUEUE                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🔴 URGENT (0)  🟠 HIGH (2)  🟡 MEDIUM (5)  🟢 LOW (3) │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─ FILTERS ─────────────────────────────────────────────┐ │
│  │ Source: [All▾] Type: [All▾] Status: [Pending▾]        │ │
│  │ Assigned: [Unassigned▾] Search: [____________]        │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─ QUEUE ───────────────────────────────────────────────┐ │
│  │ 🍽️ DIN-20260122-0002 | Dipali | MindEscapes Ooty     │ │
│  │    🐾 3 pets | ⏱️ 2h ago | [Claim] [View]            │ │
│  │ ─────────────────────────────────────────────────────│ │
│  │ ✈️ TRV-20260122-0001 | Rahul | Pet relocation        │ │
│  │    🐾 1 pet | ⏱️ 4h ago | [Claim] [View]             │ │
│  │ ─────────────────────────────────────────────────────│ │
│  │ 📦 ORD-12345 | New Order | ₹2,500                    │ │
│  │    Pending fulfillment | ⏱️ 1h ago | [Process]       │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Components Needed:**
- [ ] `ConciergeDashboard.jsx` - Main command center
- [ ] `PriorityQueue.jsx` - Visual priority buckets
- [ ] `ActionCard.jsx` - Individual action item card
- [ ] `ClaimModal.jsx` - Ticket claim workflow

**Backend Needed:**
- [ ] `GET /api/concierge/queue` - Combined priority queue
- [ ] `POST /api/concierge/claim/{ticket_id}` - Claim ticket
- [ ] `POST /api/concierge/resolve/{ticket_id}` - Resolve with notes

#### 2.2 Ticket Resolution Workflow
```
[PENDING] → [CLAIMED] → [IN_PROGRESS] → [RESOLVED] → [CLOSED]
              ↓              ↓
         Assigned to     Add notes,
         concierge       call venue,
                        update member
```

**Features Needed:**
- [ ] Claim/unclaim ticket
- [ ] Add resolution notes
- [ ] Update status with audit trail
- [ ] Notify member on resolution
- [ ] Link to Mira conversation thread

#### 2.3 Member Notification on Resolution
When concierge resolves a ticket:
1. Update ticket status
2. Send notification via:
   - [ ] Mira conversation thread (continue conversation)
   - [ ] Email notification
   - [ ] WhatsApp (future)
3. Store in member's timeline

---

### Phase 3: Source Integration (Unified Queue)

#### 3.1 Sources to Merge into Queue
| Source | Collection | Ticket Type | Priority Logic |
|--------|------------|-------------|----------------|
| Mira AI Actions | `service_desk_tickets` | DIN-*, TRV-*, CARE-*, HTL-*, VER-* | By request type |
| Service Desk | `tickets` | TKT-*, ADV-* | By urgency field |
| Orders | `orders` | ORD-* | Payment status |
| New Members | `users` | MEM-* | Onboarding incomplete |
| Health Alerts | `pet_vaccines` | HEALTH-* | Days overdue |
| Escalations | `escalation_log` | ESC-* | Auto-escalation rules |

#### 3.2 Priority Calculation
```javascript
function calculatePriority(item) {
  let score = 0;
  
  // Base priority by type
  if (item.type === 'emergency') score += 100;
  if (item.type === 'health') score += 80;
  if (item.type === 'travel') score += 60;
  if (item.type === 'care') score += 50;
  if (item.type === 'dining' || item.type === 'stay') score += 40;
  if (item.type === 'order') score += 30;
  
  // Time sensitivity
  const hoursOld = (now - item.created_at) / 3600000;
  if (hoursOld > 24) score += 20;
  if (hoursOld > 48) score += 30;
  
  // Member tier bonus
  if (item.member?.tier === 'annual') score += 10;
  if (item.member?.tier === 'lifetime') score += 20;
  
  // Escalation
  if (item.escalated) score += 50;
  
  return score;
}
```

---

### Phase 4: Advanced Features

#### 4.1 Auto-Assignment
- [ ] Round-robin assignment to available concierge
- [ ] Skill-based routing (travel expert, dining specialist)
- [ ] Load balancing based on current workload
- [ ] Availability schedule integration

#### 4.2 SLA Tracking
| Priority | Response SLA | Resolution SLA |
|----------|--------------|----------------|
| URGENT | 15 min | 1 hour |
| HIGH | 1 hour | 4 hours |
| MEDIUM | 4 hours | 24 hours |
| LOW | 24 hours | 72 hours |

- [ ] SLA countdown timer on tickets
- [ ] Escalation on SLA breach
- [ ] SLA performance reports

#### 4.3 Resolution Templates
Pre-built responses for common resolutions:
- [ ] "Reservation confirmed at [venue] for [date/time]"
- [ ] "Pet policy verified - [details]"
- [ ] "Appointment booked with [provider]"
- [ ] "Unable to accommodate - [alternative offered]"

#### 4.4 WhatsApp Business Integration
- [ ] Send resolution notification via WhatsApp
- [ ] Two-way conversation from admin panel
- [ ] Template messages for common updates

---

## 📋 IMPLEMENTATION PRIORITY

### Immediate (This Week)
1. ✅ ~~Mira Concierge Doctrine~~ DONE
2. ✅ ~~Auto-ticket creation~~ DONE
3. ✅ ~~Member 360° view with Tickets~~ DONE
4. 🔄 **Concierge Dashboard** - IN PROGRESS

### Short Term (Next 2 Weeks)
5. [ ] Ticket claim/resolve workflow
6. [ ] Member notification on resolution
7. [ ] Unified queue with all sources
8. [ ] Priority calculation engine

### Medium Term (Next Month)
9. [ ] Auto-assignment
10. [ ] SLA tracking
11. [ ] Resolution templates
12. [ ] WhatsApp integration

---

## 🗄️ DATABASE SCHEMA

### service_desk_tickets (NEW - Mira Actions)
```javascript
{
  ticket_id: "DIN-20260122-0001",
  mira_session_id: "session_xxx",
  ticket_type: "concierge_action",
  action_type: "dining_reservation", // dining_reservation, hotel_booking, travel_arrangement, care_appointment, venue_verification
  category: "dine",
  pillar: "dine",
  priority: "medium", // high, medium, low
  status: "pending", // pending, claimed, in_progress, resolved, closed
  
  original_request: "I want to have lunch at MindEscapes...",
  trigger_keyword: "lunch",
  
  member: {
    id: "mem_xxx",
    name: "Dipali",
    email: "dipali@clubconcierge.in",
    phone: "+91...",
    membership_tier: "free"
  },
  
  pets: [
    { id: "pet_xxx", name: "Mojo", breed: "Golden Retriever", allergies: [] }
  ],
  pet_count: 3,
  
  assigned_to: null, // concierge agent id
  assigned_at: null,
  
  resolution_summary: null,
  resolved_at: null,
  
  concierge_notes: [],
  audit_trail: [],
  
  visible_in_inbox: true,
  visible_in_service_desk: true,
  visible_in_mira_folder: true,
  requires_human_action: true,
  
  created_at: "2026-01-22T...",
  updated_at: "2026-01-22T..."
}
```

---

## 🎯 SUCCESS METRICS

| Metric | Target | Current |
|--------|--------|---------|
| Ticket auto-creation | 100% | ✅ 100% |
| Mira concierge responses | 100% | ✅ 100% |
| Member 360° view | Complete | ✅ Complete |
| Avg resolution time | < 4 hours | 📊 Not tracked yet |
| Member satisfaction | > 90% | 📊 Not tracked yet |
| Concierge efficiency | > 20 tickets/day | 📊 Not tracked yet |

---

## 🔗 RELATED DOCUMENTATION

- `/app/memory/PRD.md` - Product Requirements
- `/app/backend/mira_routes.py` - Mira AI logic
- `/app/backend/ticket_routes.py` - Ticket management
- `/app/frontend/src/components/admin/ServiceDesk.jsx` - Current Service Desk UI

---

*This document will be updated as features are completed.*

# UNIFIED SERVICE FLOW - Documentation

## Overview
Every service request in the Pet Life Operating System follows this unified flow, ensuring all stakeholders are notified and all systems are updated in real-time.

## Flow Diagram

```
USER ACTION (Mobile/Desktop)
        ↓
┌─────────────────────────────────────────────────────────────┐
│                    API ENDPOINT                              │
│  POST /api/service-requests  OR  POST /api/mira/quick-book   │
└─────────────────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────────────────┐
│               STEP 1: SERVICE DESK TICKET                    │
│  Collection: service_desk_tickets                            │
│  ID: TKT-XXXXXXXX                                            │
│  - Customer info, service type, pillar, status              │
└─────────────────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────────────────┐
│               STEP 2: ADMIN NOTIFICATION                     │
│  Collection: admin_notifications                             │
│  ID: NOTIF-XXXXXXXX                                          │
│  - Shows in Admin Dashboard → Notifications tab              │
└─────────────────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────────────────┐
│               STEP 3: MEMBER NOTIFICATION                    │
│  Collection: member_notifications                            │
│  ID: MNOTIF-XXXXXXXX                                         │
│  - Shows in Member Dashboard → Notifications                 │
│  - API: GET /api/member/notifications                        │
└─────────────────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────────────────┐
│               STEP 4: PILLAR BOX REQUEST                     │
│  Collection: pillar_requests                                 │
│  ID: PR-XXXXXXXX                                             │
│  - Tracks requests by pillar (care, dine, travel, etc.)     │
│  - Powers pillar-specific analytics                          │
└─────────────────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────────────────┐
│               STEP 5: TICKETS COLLECTION                     │
│  Collection: tickets                                         │
│  - Universal ticket store for unified tracking              │
│  - API: GET /api/tickets                                     │
└─────────────────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────────────────┐
│               STEP 6: CHANNEL INTAKES                        │
│  Collection: channel_intakes                                 │
│  - Tracks request source (web, mira, whatsapp, etc.)        │
└─────────────────────────────────────────────────────────────┘

```

## API Endpoints

### For Members
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/member/notifications` | GET | Get member's notifications (unread count, etc.) |
| `/api/member/notifications/{id}/read` | PUT | Mark notification as read |
| `/api/member/requests` | GET | Get all member's service requests across pillars |

### For Admin
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/notifications` | GET | Get admin notifications |
| `/api/admin/service-desk/tickets` | GET | Get service desk tickets |
| `/api/tickets` | GET | Get all tickets |

### For Creating Requests
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/service-requests` | POST | Create generic service request |
| `/api/mira/quick-book` | POST | Create quick booking via Mira |

## Collections Updated

1. **service_desk_tickets** - Primary ticket store
2. **admin_notifications** - Admin dashboard alerts
3. **member_notifications** - User-facing notifications
4. **pillar_requests** - Pillar-specific tracking
5. **tickets** - Universal ticket collection
6. **channel_intakes** - Source tracking
7. **quick_bookings** - Quick book specific data
8. **service_requests** - Generic request tracking

## What Member Sees

1. **Dashboard → Notifications**: List of notifications with unread count
2. **Dashboard → Requests**: All their service requests with status
3. **Toast notification**: Immediate feedback after submitting

## What Admin Sees

1. **Admin → Notifications tab**: All incoming requests
2. **Admin → Service Desk**: Full ticket management
3. **Admin → Analytics**: Pillar-wise request tracking

## Pillar Mapping

| Pillar | Service Types |
|--------|---------------|
| care | grooming, vet, vaccination, health_checkup |
| dine | restaurant, fresh_meals, meal_plan |
| travel | flight, road_trip, relocation, pet_taxi |
| stay | boarding, hotel, daycare |
| celebrate | birthday, party, photoshoot |
| learn | training, behavior, obedience |
| fit | fitness, swimming, spa |

## Testing the Flow

```bash
# 1. Submit a request
curl -X POST "API_URL/api/service-requests" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"type":"grooming_request","pillar":"care",...}'

# 2. Check member notifications
curl "API_URL/api/member/notifications" -H "Authorization: Bearer TOKEN"

# 3. Check member requests
curl "API_URL/api/member/requests" -H "Authorization: Bearer TOKEN"

# 4. Check admin notifications
curl "API_URL/api/admin/notifications" -u "admin:password"

# 5. Check service desk tickets
curl "API_URL/api/tickets"
```

## Real-time Updates (Future Enhancement)

Currently using polling. Can be upgraded to WebSocket/SSE for:
- Instant notification popup
- Live ticket status updates
- Real-time dashboard refresh

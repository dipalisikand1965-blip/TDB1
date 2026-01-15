# Backend Architecture - The Doggy Company

## Directory Structure

```
/app/backend/
├── server.py              # Main FastAPI app entry point + remaining routes
├── auth_routes.py         # ✅ Authentication (login, register, Google OAuth)
├── admin_routes.py        # ✅ Admin reports & fulfilment APIs
├── status_engine.py       # ✅ Order status flow (pillar-agnostic)
├── feedback_engine.py     # ✅ Post-completion feedback (pillar-agnostic)
├── birthday_engine.py     # ✅ Pet birthday promotions (pillar-agnostic)
├── concierge_engine.py    # ✅ Internal notes system (pillar-agnostic)
├── email_reports_engine.py # ✅ Daily email reports (pillar-agnostic)
├── search_service.py      # ✅ Meilisearch integration
└── requirements.txt       # Python dependencies
```

## Modular Routers

| Module | Prefix | Description | Lines |
|--------|--------|-------------|-------|
| `auth_routes.py` | `/api/auth` | User auth, JWT, Google OAuth | ~416 |
| `admin_routes.py` | `/api/admin` | Reports, fulfilment, analytics | ~1000+ |
| `status_engine.py` | `/api/status-engine` | Order status flows per pillar | ~600 |
| `feedback_engine.py` | `/api/feedback-engine` | Post-delivery feedback | ~450 |
| `birthday_engine.py` | `/api/birthday-engine` | Pet celebrations & promos | ~500 |
| `concierge_engine.py` | `/api/concierge` | Internal notes | ~350 |
| `email_reports_engine.py` | `/api/email-reports` | Daily reports & subscriptions | ~400 |
| `search_service.py` | `/api/search` | Product/collection search | ~200 |

## Routes Still in server.py (To Refactor Later)

### Product Routes (`/api/products/*`)
- GET /api/products - List products
- GET /api/products/{id} - Get product
- GET /api/products/{id}/related - Related products
- GET /api/products/{id}/reviews - Product reviews
- POST /api/reviews - Submit review

### Order Routes (`/api/orders/*`, `/api/cart/*`, `/api/checkout/*`)
- POST /api/cart - Add to cart
- GET /api/orders - List orders
- POST /api/orders - Create order
- GET /api/orders/{id} - Get order

### User Routes (`/api/user/*`, `/api/pets/*`)
- GET /api/user/dashboard - User dashboard
- GET /api/pets - List pets
- POST /api/pets - Add pet
- PUT /api/pets/{id} - Update pet

### Admin Routes (`/api/admin/*`)
- GET /api/admin/orders - Admin orders
- GET /api/admin/members - Admin members
- etc.

### Shopify Sync
- POST /api/cron/sync-products - Sync from Shopify

### Mira Chat
- POST /api/chat/mira - Chat with Mira

## Pillar-Agnostic Engines

All 5 engines are designed to work across ALL pillars:

1. **Status Engine** - Each pillar has its own status flow config
2. **Feedback Engine** - Triggers based on pillar's completion status
3. **Birthday Engine** - Works for any pet celebrations
4. **Concierge Engine** - Notes visible across all pillars
5. **Email Reports** - Can filter by pillar

## Future Refactoring Phases

### Phase 1 (Current) ✅
- Extract auth_routes.py
- Document architecture

### Phase 2 (Next)
- Extract product_routes.py
- Extract order_routes.py
- Extract user_routes.py

### Phase 3
- Extract notification_routes.py (email, WhatsApp)
- Extract mira_routes.py (chat)

### Phase 4
- Extract shopify_sync.py
- Create shared utilities module

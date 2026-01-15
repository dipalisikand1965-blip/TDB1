# Backend Architecture - The Doggy Company

## Current Status: Phase 2 Complete

The backend has been modularized with the following route modules:

## Directory Structure

```
/app/backend/
├── server.py                  # Main FastAPI app entry + legacy routes (being deprecated)
├── auth_routes.py             # ✅ Authentication (login, register, Google OAuth)
├── product_routes.py          # ✅ Products, search, collections, reviews (public)
├── order_routes.py            # ✅ Orders, cart, autoship basics
├── user_routes.py             # ✅ Pet profiles, celebrations, personas
├── admin_routes.py            # ✅ Admin reports & fulfilment APIs
├── status_engine.py           # ✅ Order status flow (pillar-agnostic)
├── feedback_engine.py         # ✅ Post-completion feedback (pillar-agnostic)
├── birthday_engine.py         # ✅ Pet birthday promotions (pillar-agnostic)
├── concierge_engine.py        # ✅ Internal notes system (pillar-agnostic)
├── email_reports_engine.py    # ✅ Daily email reports (pillar-agnostic)
├── search_service.py          # ✅ Meilisearch integration
└── requirements.txt           # Python dependencies
```

## Modular Routers

| Module | Prefix | Description | Status |
|--------|--------|-------------|--------|
| `auth_routes.py` | `/api/auth` | User auth, JWT, Google OAuth | ✅ Active |
| `product_routes.py` | `/api` | Products, search, collections, reviews | ✅ Active |
| `order_routes.py` | `/api` | Orders, cart, autoship | ✅ Active |
| `user_routes.py` | `/api` | Pets, celebrations | ✅ Active |
| `admin_routes.py` | `/api/admin/fulfilment`, `/api/admin/reports` | Admin dashboards | ✅ Active |
| `status_engine.py` | `/api/status-engine` | Order status flows | ✅ Active |
| `feedback_engine.py` | `/api/feedback-engine` | Post-delivery feedback | ✅ Active |
| `birthday_engine.py` | `/api/birthday-engine` | Pet celebrations & promos | ✅ Active |
| `concierge_engine.py` | `/api/concierge` | Internal notes | ✅ Active |
| `email_reports_engine.py` | `/api/email-reports` | Daily reports | ✅ Active |

## Routes in Modular Files

### product_routes.py
- `GET /api/products` - List products
- `GET /api/products/{product_id}/related` - Related products
- `GET /api/products/{product_id}/reviews` - Product reviews
- `GET /api/search` - Smart search
- `GET /api/search/typeahead` - Autocomplete
- `GET /api/search/stats` - Search statistics
- `POST /api/search/reindex` - Reindex products (admin)
- `GET /api/collections` - List collections
- `GET /api/collections/{collection_id}` - Get collection with products
- `POST /api/reviews` - Submit review

### order_routes.py
- `GET /api/orders/my-orders` - User's orders
- `POST /api/orders` - Create order
- `GET /api/orders/{order_id}` - Get order
- `POST /api/cart/snapshot` - Save cart
- `POST /api/cart/capture-email` - Capture email for abandoned cart
- `POST /api/cart/convert/{session_id}` - Mark cart converted

### user_routes.py
- `GET /api/pets/personas` - Dog persona types
- `GET /api/pets/occasions` - Celebration occasions
- `POST /api/pets` - Create pet profile
- `GET /api/pets/{pet_id}` - Get pet
- `PUT /api/pets/{pet_id}` - Update pet
- `DELETE /api/pets/{pet_id}` - Delete pet
- `POST /api/pets/{pet_id}/celebrations` - Add celebration
- `DELETE /api/pets/{pet_id}/celebrations/{occasion}` - Remove celebration
- `GET /api/pets/{pet_id}/upcoming-celebrations` - Upcoming celebrations
- `POST /api/pets/{pet_id}/achievements` - Add achievement

### auth_routes.py
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/google/session` - Google OAuth
- `POST /api/auth/logout` - Logout

## Routes Still in server.py (Legacy - To Be Migrated)

The following routes remain in server.py but have duplicates in modular files:
- Admin CRUD routes for products, orders, customers
- Mira chat endpoint
- Shopify sync endpoints
- Content management (FAQ, testimonials, blog)
- Loyalty points system
- Discount codes
- Franchise inquiries
- Streaties charity stats

## Pillar-Agnostic Engines

All 5 engines are designed to work across ALL pillars:

1. **Status Engine** - Each pillar has its own status flow config
2. **Feedback Engine** - Triggers based on pillar's completion status
3. **Birthday Engine** - Works for any pet celebrations
4. **Concierge Engine** - Notes visible across all pillars
5. **Email Reports** - Can filter by pillar

## Integration Pattern

Each module follows this pattern:
```python
# Create router
router = APIRouter(prefix="/api/...", tags=["..."])

# Database reference
db = None

def set_database(database):
    global db
    db = database

# Routes...
```

In server.py:
```python
from module import router, set_database

# At startup
set_database(db)

# Include router
app.include_router(router)
```

## Next Steps (Phase 3)

1. **Remove Legacy Routes** - Safely remove duplicate routes from server.py
2. **Admin Routes Consolidation** - Move remaining admin routes to admin_routes.py
3. **Mira Chat Extraction** - Create mira_routes.py for chat functionality
4. **Notification Service** - Create notification_service.py for email/WhatsApp
5. **Shopify Sync Module** - Create shopify_sync.py for sync functionality

## Testing

After each module extraction:
1. Run curl tests on all extracted endpoints
2. Verify admin functionality still works
3. Check frontend integration
4. Run testing_agent_v3_fork for regression testing

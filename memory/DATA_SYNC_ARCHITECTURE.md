# MIRA OS - Data Sync Architecture

## How Products & Services Flow to Mira

```
┌─────────────────────────────────────────────────────────────────┐
│                    ADMIN PANEL (Production)                      │
│                 thedoggycompany.in/admin                         │
├─────────────────────────────────────────────────────────────────┤
│  Add Product  │  Edit Price  │  Delete Item  │  Add Service     │
└───────┬───────┴───────┬──────┴───────┬───────┴────────┬─────────┘
        │               │              │                │
        ▼               ▼              ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      MONGODB DATABASE                            │
│                                                                  │
│  ┌──────────────────┐    ┌──────────────────┐                   │
│  │ products_master  │    │ services_master  │                   │
│  │ (695 products)   │    │ (services)       │                   │
│  └────────┬─────────┘    └────────┬─────────┘                   │
│           │                       │                              │
│           │    PRICING_SYNC_SERVICE                              │
│           │    (Automatic 2-way sync)                            │
│           │                       │                              │
│           ▼                       ▼                              │
│  ┌─────────────────────────────────────────────┐                │
│  │         UNIFIED DATA LAYER                   │                │
│  │  - Products with prices                      │                │
│  │  - Services with base_price                  │                │
│  │  - Categories & Pillars                      │                │
│  └─────────────────────┬───────────────────────┘                │
└─────────────────────────┼───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                        MIRA OS                                   │
│              /api/mira/os/understand-with-products               │
├─────────────────────────────────────────────────────────────────┤
│  1. User Query: "I need grooming for Buddy"                      │
│                                                                  │
│  2. search_real_products() → Query products_master               │
│     - Seasonal filtering (E001)                                  │
│     - Allergy filtering (E011)                                   │
│     - Category filtering                                         │
│                                                                  │
│  3. search_services_from_db() → Query services (E014)            │
│     - Category matching                                          │
│     - Price information                                          │
│                                                                  │
│  4. Response includes:                                           │
│     - products: [] (from DB)                                     │
│     - services: [] (from DB)                                     │
│     - remembered_providers: [] (E013)                            │
└─────────────────────────────────────────────────────────────────┘
```

## Sync Flow

### When Admin Adds/Edits Product:
1. Admin panel calls `POST /api/products`
2. Product saved to `products_master` collection
3. `sync_product_to_service()` creates/updates entry in `services_master`
4. Both collections now have synchronized data
5. Mira immediately sees new product on next query

### When Admin Adds/Edits Service:
1. Admin panel calls `POST /api/services`
2. Service saved to `services_master` collection
3. `sync_service_to_product()` creates/updates entry in `products_master`
4. Both collections now have synchronized data
5. Mira immediately sees new service on next query

### Auto-Sync Schedule:
- Background task runs every 24 hours (midnight IST)
- Syncs from Shopify if connected
- Full sync can be triggered manually via admin

## Key Files

| File | Purpose |
|------|---------|
| `/app/backend/pricing_sync_service.py` | 2-way sync logic |
| `/app/backend/mira_routes.py` | `search_real_products()`, `search_services_from_db()` |
| `/app/backend/server.py` | Auto-sync scheduler setup |

## Database Collections

| Collection | Contents | Used By |
|------------|----------|---------|
| `products_master` | All products with prices | Mira product search |
| `services_master` | All services with pricing | Mira service search (E014) |
| `service_desk_tickets` | Completed requests | Remembered providers (E013) |
| `pets` | Pet profiles | Soul score, allergies |

## How Mira Stays Fresh

1. **No Cache**: Mira queries MongoDB directly on every request
2. **Real-time**: Any admin change is immediately reflected
3. **Pillar-aware**: Products/services tagged by pillar (Celebrate, Care, etc.)
4. **Seasonal-aware**: E001 filters out-of-season items automatically

## MasterSync (Future Enhancement)

The user mentioned "MasterSync" from admin - this would be a one-click feature to:
1. Pull all products from Shopify/external source
2. Update prices across all collections
3. Ensure Mira has latest catalog

**Status**: Framework exists (`pricing_sync_service.py`), needs admin UI trigger

---

*Mira reads directly from the database. No manual sync needed - changes are instant.*

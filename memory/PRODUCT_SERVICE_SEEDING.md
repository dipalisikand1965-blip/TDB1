# PRODUCT & SERVICE SEEDING FLOW - Complete Documentation

## Overview
This document explains how to add new products and services to the Pet Life Operating System, ensuring they are properly indexed, tagged, and available across mobile and desktop.

---

## PART 1: PRODUCT SEEDING FLOW

### Required Fields for Products

```javascript
{
  // REQUIRED FIELDS
  "id": "product-unique-id",           // Unique identifier (auto-generated if not provided)
  "name": "Product Name",               // Display name
  "description": "Product description", // Detailed description
  "price": 999,                         // Price in INR (integer, no decimals)
  "pillar": "dine",                     // Which pillar: dine, care, celebrate, travel, stay, fit, learn, etc.
  "category": "fresh-meals",            // Product category
  "available": true,                    // Is it in stock?
  
  // RECOMMENDED FIELDS
  "original_price": 1299,               // Original price (for showing discount)
  "image": "https://...",               // Primary image URL
  "images": ["url1", "url2"],           // Gallery images
  "tags": ["fresh", "chicken"],         // Basic searchable tags
  
  // INTELLIGENT TAGS (for AI recommendations)
  "intelligent_tags": [
    "high_protein", "fresh_cooked", "adult", "all_breeds", 
    "non_veg", "grain_inclusive", "daily_meal"
  ],
  "breed_tags": ["all_breeds", "labrador", "indie"],
  "health_tags": ["muscle_building", "coat_health", "digestive_friendly"],
  "lifestage_tags": ["adult", "senior", "puppy"],
  "diet_tags": ["non_veg", "chicken", "grain_free", "vegetarian"],
  "size_tags": ["small_breed", "medium_breed", "large_breed"],
  "occasion_tags": ["daily_meal", "birthday", "celebration"],
  
  // CROSS-SELL FIELDS (for upselling)
  "cross_sell_products": ["product-id-1", "product-id-2"],
  "frequently_bought_together": ["product-id-3"],
  "allergy_warnings": ["Contains chicken"],
  "suitable_for_breeds": ["All breeds"],
  "not_suitable_for": ["Chicken allergic dogs"],
  
  // SHIPPING & INVENTORY
  "is_pan_india_shippable": true,
  "fresh_delivery_cities": ["bangalore", "mumbai", "delhi ncr"],
  "gst_rate": 5,
  "shipping_weight": 500,               // in grams
  
  // TIMESTAMPS
  "created_at": "2026-02-02T10:00:00Z"
}
```

### Backend API Endpoints for Products

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/products` | GET | List all products | Public |
| `/api/products/{id}` | GET | Get single product | Public |
| `/api/admin/products` | POST | Create new product | Admin |
| `/api/admin/products/{id}` | PUT | Update product | Admin |
| `/api/admin/products/{id}` | DELETE | Delete product | Admin |
| `/api/admin/products/seed-meal-products` | POST | Bulk seed meal products | Admin |
| `/api/admin/products/seed-travel-products` | POST | Bulk seed travel products | Admin |
| `/api/admin/products/enhance-all-tags` | POST | Auto-enhance tags for all products | Admin |
| `/api/admin/export/products-csv` | GET | Export all products as CSV | Admin |
| `/api/admin/products/import-csv` | POST | Import products from CSV | Admin |

### How to Seed Products

#### Option 1: Via Admin API
```bash
curl -X POST "API_URL/api/admin/products" \
  -u "admin:password" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Chicken & Rice Bowl",
    "price": 349,
    "pillar": "dine",
    "category": "fresh-meals",
    ...
  }'
```

#### Option 2: Via Bulk Seed Endpoint
```bash
curl -X POST "API_URL/api/admin/products/seed-meal-products" \
  -u "admin:password"
```

#### Option 3: Via CSV Import
1. Export existing: `GET /api/admin/export/products-csv`
2. Edit CSV with new products
3. Import: `POST /api/admin/products/import-csv`

#### Option 4: Via Admin UI
1. Go to Admin Panel → Products tab
2. Click "Add Product"
3. Fill in the form
4. Click Save

### After Seeding - What Happens

```
NEW PRODUCT CREATED
        ↓
┌─────────────────────────────────────────┐
│  1. products collection updated         │
│  2. Product indexed for search          │
│  3. Pillar resolver cache updated       │
│  4. Available on mobile & desktop       │
└─────────────────────────────────────────┘
```

### Frontend Display Locations

Products appear in:
- **Pillar Pages**: `/dine`, `/care`, `/travel`, etc.
- **Search Results**: `/search?q=...`
- **Product Cards**: `<ProductCard />` component
- **Product Detail Modal**: `<ProductDetailModal />`
- **Mira Recommendations**: AI-powered suggestions
- **Cross-sell Sections**: Related products

---

## PART 2: SERVICE SEEDING FLOW

### Required Fields for Services

```javascript
{
  // REQUIRED FIELDS
  "id": "service-unique-id",
  "type": "svc-groom-full",             // Service type code
  "name": "Full Grooming Session",
  "description": "Complete grooming service",
  "pillar": "care",
  "category": "grooming",
  
  // PRICING
  "base_price": 799,
  "prices": {
    "small_breed": 799,
    "medium_breed": 999,
    "large_breed": 1299
  },
  
  // OPTIONS
  "options": [
    {
      "id": "spa-addon",
      "name": "Spa Treatment",
      "price": 299
    }
  ],
  
  // AVAILABILITY
  "available": true,
  "cities": ["bangalore", "mumbai"],
  "duration": "60-90 mins",
  
  // TAGS
  "tags": ["grooming", "spa", "hygiene"],
  "intelligent_tags": ["all_breeds", "coat_care"]
}
```

### Backend API Endpoints for Services

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/services` | GET | List services by pillar | Public |
| `/api/service-catalog/services` | GET | Get services with pricing | Public |
| `/api/admin/services` | POST | Create new service | Admin |
| `/api/admin/services/{id}` | PUT | Update service | Admin |

### How to Seed Services

```bash
curl -X POST "API_URL/api/admin/services" \
  -u "admin:password" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "svc-groom-full",
    "name": "Full Grooming Session",
    "pillar": "care",
    "base_price": 799,
    ...
  }'
```

---

## PART 3: UNIFIED INTENT FLOW (Complete)

### All Entry Points → Unified Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER ENTRY POINTS                            │
├─────────────────────────────────────────────────────────────────────┤
│  📱 MOBILE                        │  🖥️ DESKTOP                      │
│  ─────────────────────────────────│───────────────────────────────── │
│  • Navbar Search                  │  • Navbar Search                 │
│  • Mira Chat Widget               │  • Mira Chat Widget              │
│  • Service Catalog Cards          │  • Service Catalog Cards         │
│  • Ask Concierge Buttons          │  • Ask Concierge Buttons         │
│  • Product Add to Cart            │  • Product Add to Cart           │
│  • Bundle View/Purchase           │  • Bundle View/Purchase          │
│  • Quick Book Forms               │  • Quick Book Forms              │
│  • Contact Forms                  │  • Contact Forms                 │
│  • Callback Request               │  • Callback Request              │
└─────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│                         API ENDPOINTS                                │
├─────────────────────────────────────────────────────────────────────┤
│  POST /api/service-requests      → Generic service requests          │
│  POST /api/mira/quick-book       → Mira quick bookings               │
│  GET  /api/search/universal      → Search with intent detection      │
│  POST /api/services/unified-book → Service catalog bookings          │
│  POST /api/contact               → Contact form submissions          │
└─────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    UNIFIED FLOW - ALL 6 STEPS                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  STEP 1: SERVICE DESK TICKET                                         │
│  ├── Collection: service_desk_tickets                                │
│  ├── ID: TKT-XXXXXXXX                                                │
│  └── Purpose: Primary ticket for tracking & resolution               │
│                                                                      │
│  STEP 2: ADMIN NOTIFICATION                                          │
│  ├── Collection: admin_notifications                                 │
│  ├── ID: NOTIF-XXXXXXXX                                              │
│  └── Purpose: Alert admins in dashboard                              │
│                                                                      │
│  STEP 3: MEMBER NOTIFICATION                                         │
│  ├── Collection: member_notifications                                │
│  ├── ID: MNOTIF-XXXXXXXX                                             │
│  └── Purpose: User sees in their dashboard                           │
│                                                                      │
│  STEP 4: PILLAR REQUEST                                              │
│  ├── Collection: pillar_requests                                     │
│  ├── ID: PR-XXXXXXXX                                                 │
│  └── Purpose: Track by pillar for analytics                          │
│                                                                      │
│  STEP 5: TICKETS COLLECTION                                          │
│  ├── Collection: tickets                                             │
│  ├── ID: QBK-XXXXXXXX / TKT-XXXXXXXX                                 │
│  └── Purpose: Universal ticket store                                 │
│                                                                      │
│  STEP 6: CHANNEL INTAKES                                             │
│  ├── Collection: channel_intakes                                     │
│  ├── ID: INB-XXXXXXXX                                                │
│  └── Purpose: Track source channel (web, mira, whatsapp)             │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Intent Detection Types

| Intent | Triggers | Action |
|--------|----------|--------|
| `booking_intent` | "book", "appointment", "schedule" | Show booking form |
| `order_intent` | "buy", "order", "purchase" | Show products |
| `support_intent` | "help", "issue", "problem" | Open support |
| `question_intent` | "what", "how", "why" | Show Mira AI |
| `discovery_intent` | General browsing | Show results |

### Collections Summary

| Collection | Purpose | Key Fields |
|------------|---------|------------|
| `service_desk_tickets` | Primary tickets | ticket_id, status, priority |
| `admin_notifications` | Admin alerts | type, read, priority |
| `member_notifications` | User notifications | user_email, read, link |
| `pillar_requests` | Pillar tracking | pillar, type, status |
| `tickets` | Universal store | All ticket types |
| `channel_intakes` | Source tracking | channel, source |
| `quick_bookings` | Quick book data | serviceType, date, time |
| `service_requests` | Generic requests | type, pillar, details |
| `products` | Product catalog | name, price, tags |
| `services` | Service catalog | type, pillar, pricing |

---

## PART 4: FRONTEND COMPONENTS

### Product Display Components

```
ProductCard.jsx         → Card display with image, price, actions
ProductDetailModal.jsx  → Full product view with booking
CrossSellSection.jsx    → Related products after action
ServiceCatalogSection.jsx → Service cards with booking
```

### Service Request Components

```
ServiceBookingModal.jsx → Booking form modal
ConciergeExperienceCard.jsx → Concierge service cards
DiningConciergePicker.jsx → Restaurant booking
MiraChatWidget.jsx → AI assistant with quick book
CallbackRequestModal.jsx → Request callback form
```

### Mobile vs Desktop

Both use the SAME components with responsive classes:
- Mobile: `sm:hidden`, `md:hidden`
- Desktop: `hidden sm:block`, `hidden md:block`

---

## QUICK REFERENCE

### Add New Product
```bash
POST /api/admin/products -d '{"name":"...", "price":999, "pillar":"dine", ...}'
```

### Add New Service
```bash
POST /api/admin/services -d '{"type":"svc-...", "name":"...", "pillar":"care", ...}'
```

### Bulk Enhance Tags
```bash
POST /api/admin/products/enhance-all-tags
```

### Export Products
```bash
GET /api/admin/export/products-csv
```

### Check Member Notifications
```bash
GET /api/member/notifications -H "Authorization: Bearer TOKEN"
```

### Check Member Requests
```bash
GET /api/member/requests -H "Authorization: Bearer TOKEN"
```

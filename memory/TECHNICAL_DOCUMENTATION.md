# 🛠️ THE DOGGY COMPANY - TECHNICAL DOCUMENTATION

## System Architecture Overview

**Stack**: React (Frontend) + FastAPI (Backend) + MongoDB (Database)
**Deployment**: Kubernetes on Cloud

---

## 📁 CODEBASE STRUCTURE

```
/app
├── frontend/                      # React Application
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/               # Shadcn UI Components
│   │   │   ├── admin/            # Admin Panel Components
│   │   │   │   ├── DashboardTab.jsx
│   │   │   │   ├── DineManager.jsx
│   │   │   │   ├── TravelManager.jsx
│   │   │   │   ├── ServiceDesk.jsx
│   │   │   │   ├── MembershipManager.jsx  # NEW
│   │   │   │   └── ...
│   │   │   ├── Navbar.jsx
│   │   │   ├── ProductManager.jsx
│   │   │   ├── StayManager.jsx
│   │   │   └── PetSoulEnhanced.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Admin.jsx
│   │   │   ├── Checkout.jsx
│   │   │   ├── MemberDashboard.jsx
│   │   │   ├── TravelPage.jsx
│   │   │   ├── StayPage.jsx
│   │   │   ├── DinePage.jsx
│   │   │   ├── MembershipPage.jsx        # NEW
│   │   │   ├── MembershipCheckout.jsx    # NEW
│   │   │   └── ...
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   └── CartContext.jsx
│   │   ├── hooks/
│   │   │   └── use-toast.jsx
│   │   └── utils/
│   │       └── api.js
│   └── package.json
│
├── backend/                       # FastAPI Application
│   ├── server.py                 # Main server (needs refactoring)
│   ├── travel_routes.py          # Travel pillar routes
│   ├── stay_routes.py            # Stay pillar routes
│   ├── stay_social_routes.py     # Stay social features
│   ├── ticket_routes.py          # Service desk routes
│   ├── channel_intake.py         # Unified inbox routes
│   ├── membership_routes.py      # NEW - Membership routes
│   ├── rewards_routes.py         # NEW - Paw rewards routes
│   └── requirements.txt
│
└── memory/                        # Documentation
    ├── PRD.md
    ├── MEMBERSHIP_ARCHITECTURE.md
    └── TECHNICAL_DOCUMENTATION.md
```

---

## 🗄️ DATABASE SCHEMA

### Core Collections

#### 1. `users` (Pet Parents / Customers)
```javascript
{
  "_id": ObjectId,
  "id": "user-uuid",
  "name": "Aditya Sharma",
  "email": "aditya@example.com",
  "phone": "+919876543210",
  "password_hash": "...",
  "role": "customer",  // customer, admin, agent
  
  // Membership
  "membership": {
    "status": "active",  // none, active, expired, cancelled
    "plan": "family",    // family, family_plus, family_elite
    "started_at": ISODate,
    "expires_at": ISODate,
    "auto_renew": true,
    "payment_method": "razorpay",
    "subscription_id": "sub_xyz",
    "discount_code_used": "CORP-BULK-TATA100"
  },
  
  // Paw Rewards
  "paw_points": {
    "balance": 1250,
    "lifetime_earned": 5000,
    "lifetime_redeemed": 3750,
    "tier": "gold"  // bronze, silver, gold, platinum
  },
  
  // Profile
  "city": "Mumbai",
  "addresses": [...],
  "preferences": {
    "notifications": { "email": true, "whatsapp": true, "sms": false },
    "marketing": true
  },
  
  "created_at": ISODate,
  "updated_at": ISODate,
  "last_login": ISODate
}
```

#### 2. `pets` (Pet Soul)
```javascript
{
  "_id": ObjectId,
  "id": "pet-uuid",
  "owner_id": "user-uuid",
  "owner_email": "aditya@example.com",
  
  // Basic Info
  "name": "Miracle",
  "breed": "Golden Retriever",
  "breed_id": "golden-retriever",
  "birth_date": ISODate("2022-03-15"),
  "gender": "female",
  "size": "large",
  "weight": 28.5,
  "photo_url": "https://...",
  
  // Soul Profile (Gamification)
  "soul_points": 450,
  "soul_level": "Explorer",  // Newcomer, Explorer, Adventurer, Champion
  "badges": ["First-Timer", "Social Butterfly", "Foodie"],
  
  // Personality & Preferences
  "personality_traits": ["Playful", "Friendly", "Energetic"],
  "food_preferences": ["Chicken", "Rice"],
  "allergies": ["Dairy"],
  "fears": ["Thunderstorms"],
  "favorite_activities": ["Swimming", "Fetch"],
  
  // Health
  "health_notes": "Hip dysplasia - mild",
  "vaccinations": [...],
  "vet_info": {
    "name": "Dr. Sharma",
    "clinic": "PetCare Clinic",
    "phone": "+91..."
  },
  
  // Travel Profile
  "travel": {
    "crate_trained": true,
    "travel_anxiety": "low",
    "car_sickness": false,
    "flight_experience": true
  },
  
  // Activity Log
  "activities": [
    { "type": "purchase", "pillar": "celebrate", "date": ISODate, "details": {...} },
    { "type": "dining", "pillar": "dine", "date": ISODate, "details": {...} }
  ],
  
  "created_at": ISODate,
  "updated_at": ISODate
}
```

#### 3. `memberships` (Membership Records)
```javascript
{
  "_id": ObjectId,
  "id": "membership-uuid",
  "user_id": "user-uuid",
  "user_email": "aditya@example.com",
  
  "plan": "family",
  "price_paid": 999,
  "currency": "INR",
  "discount_code": "CORP-BULK-TATA100",
  "discount_amount": 200,
  
  "status": "active",  // pending, active, expired, cancelled, refunded
  "started_at": ISODate,
  "expires_at": ISODate,
  "cancelled_at": null,
  "cancellation_reason": null,
  
  // Payment
  "payment": {
    "provider": "razorpay",
    "payment_id": "pay_xyz",
    "order_id": "order_xyz",
    "subscription_id": "sub_xyz",
    "method": "upi"
  },
  
  // B2B/Corporate
  "corporate": {
    "is_corporate": false,
    "company_id": null,
    "company_name": null,
    "purchased_by": null
  },
  
  // Benefits Used
  "benefits_used": {
    "free_shipping_count": 5,
    "birthday_perks_claimed": 1,
    "priority_support_count": 2
  },
  
  "created_at": ISODate,
  "updated_at": ISODate
}
```

#### 4. `discount_codes`
```javascript
{
  "_id": ObjectId,
  "id": "code-uuid",
  "code": "CORP-BULK-TATA100",
  "type": "bulk_membership",  // bulk_membership, wholesale, referral, promo, birthday
  
  "discount": {
    "type": "percent",  // percent, fixed
    "value": 20,        // 20% off or ₹200 off
    "max_discount": 500 // Cap for percentage discounts
  },
  
  "validity": {
    "valid_from": ISODate,
    "valid_until": ISODate,
    "max_uses": 100,
    "used_count": 45,
    "per_user_limit": 1
  },
  
  "conditions": {
    "min_quantity": 10,      // For bulk memberships
    "min_order_value": 0,
    "applies_to": ["membership"],  // membership, products, all
    "excluded_categories": [],
    "first_purchase_only": false
  },
  
  // Partner/Corporate
  "partner": {
    "partner_id": "partner-tata",
    "partner_name": "Tata Group",
    "commission_percent": 10
  },
  
  "created_by": "admin-uuid",
  "created_at": ISODate,
  "updated_at": ISODate,
  "is_active": true
}
```

#### 5. `paw_transactions` (Points History)
```javascript
{
  "_id": ObjectId,
  "id": "txn-uuid",
  "user_id": "user-uuid",
  "pet_id": "pet-uuid",  // Optional, if points are pet-specific
  
  "type": "earn",  // earn, redeem, expire, adjust, bonus
  "points": 100,
  "balance_after": 1350,
  
  "source": {
    "type": "purchase",  // purchase, signup, review, referral, birthday, admin
    "reference_id": "order-xyz",
    "pillar": "celebrate",
    "description": "Purchase: Birthday Cake - Medium"
  },
  
  // For redemptions
  "redemption": {
    "order_id": "order-abc",
    "discount_applied": 10  // ₹10 discount for 1000 points
  },
  
  "multiplier": 2,  // Member bonus (2x points)
  "expires_at": ISODate,  // 12 months from earning
  
  "created_at": ISODate
}
```

#### 6. `products` (Unified Products Collection)
```javascript
{
  "_id": ObjectId,
  "id": "product-uuid",
  "name": "Birthday Cake - Medium",
  "slug": "birthday-cake-medium",
  "description": "...",
  
  // Categorization
  "pillar": "celebrate",  // celebrate, dine, stay, travel, care
  "category": "cakes",
  "subcategory": "birthday",
  "tags": ["birthday", "party", "celebration"],
  
  // Pricing
  "price": 1499,
  "compare_price": 1799,
  "member_price": 1349,     // NEW: Member-only pricing
  "member_only": false,     // NEW: Exclusive to members
  
  // Rewards & Perks
  "paw_reward_points": 15,  // Points earned per purchase
  "is_birthday_perk": true,
  "birthday_discount_percent": 20,
  "birthday_free_add_on": "birthday-bandana",  // Free item during birthday
  
  // Inventory
  "in_stock": true,
  "stock_quantity": 50,
  "sku": "CAKE-MED-001",
  
  // Media
  "images": ["url1", "url2"],
  "image": "primary-url",
  
  // For specific pillars
  "pet_sizes": ["small", "medium", "large"],
  "travel_type": null,  // For travel products: cab, train, flight, relocation
  
  // Shopify sync (if applicable)
  "shopify_id": "123456",
  "shopify_variant_id": "789",
  
  "created_at": ISODate,
  "updated_at": ISODate,
  "is_active": true
}
```

#### 7. `orders` (Unified Orders)
```javascript
{
  "_id": ObjectId,
  "order_id": "ORD-20260119-ABC123",
  "user_id": "user-uuid",
  "user_email": "aditya@example.com",
  
  // Order Type
  "type": "product",  // product, membership, service, booking
  "pillar": "celebrate",  // Primary pillar
  
  // Items
  "items": [
    {
      "product_id": "product-uuid",
      "name": "Birthday Cake - Medium",
      "price": 1349,  // Member price applied
      "original_price": 1499,
      "quantity": 1,
      "pillar": "celebrate",
      "paw_points_earned": 30  // 15 x 2 (member bonus)
    }
  ],
  
  // Pricing
  "subtotal": 1349,
  "discount": 100,
  "discount_code": "BIRTHDAY15",
  "paw_points_redeemed": 500,
  "paw_points_discount": 5,
  "shipping": 0,  // Free for members
  "total": 1244,
  
  // Rewards
  "paw_points_earned": 30,
  "is_birthday_order": true,
  
  // Delivery
  "shipping_address": {...},
  "delivery_date": ISODate,
  "delivery_slot": "10AM-2PM",
  
  // Status
  "status": "confirmed",  // pending, confirmed, processing, shipped, delivered, cancelled
  "payment_status": "paid",
  "payment": {
    "provider": "razorpay",
    "payment_id": "pay_xyz",
    "method": "upi"
  },
  
  // Pet Info (for personalization)
  "pet_id": "pet-uuid",
  "pet_name": "Miracle",
  
  // Tracking
  "timeline": [
    { "status": "created", "at": ISODate, "by": "system" },
    { "status": "confirmed", "at": ISODate, "by": "system" }
  ],
  
  // Integration
  "ticket_id": "TKT-xyz",
  "intake_id": "INT-xyz",
  
  "created_at": ISODate,
  "updated_at": ISODate
}
```

#### 8. `tickets` (Service Desk)
```javascript
{
  "_id": ObjectId,
  "ticket_id": "TKT-20260119-XYZ",
  "source": "order",  // order, travel_request, stay_booking, dine_reservation, inquiry
  "pillar": "celebrate",
  
  "customer": {
    "user_id": "user-uuid",
    "name": "Aditya Sharma",
    "email": "aditya@example.com",
    "phone": "+91...",
    "is_member": true  // Priority routing
  },
  
  "pet_context": {
    "pet_id": "pet-uuid",
    "pet_name": "Miracle"
  },
  
  "subject": "Order ORD-20260119-ABC123 - Birthday Cake",
  "category": "order_support",
  "priority": "medium",  // low, medium, high, urgent
  "status": "open",  // open, assigned, in_progress, resolved, closed
  
  // Assignment
  "assigned_to": "agent-uuid",
  "assigned_at": ISODate,
  "sla_deadline": ISODate,  // Members get faster SLA
  
  // Reference
  "reference": {
    "type": "order",
    "id": "order-uuid",
    "order_id": "ORD-20260119-ABC123"
  },
  
  // Communication
  "messages": [...],
  "internal_notes": [...],
  
  "timeline": [...],
  "created_at": ISODate,
  "updated_at": ISODate,
  "resolved_at": null
}
```

#### 9. `channel_intakes` (Unified Inbox)
```javascript
{
  "_id": ObjectId,
  "request_id": "INT-20260119-XYZ",
  "pillar": "travel",
  "request_type": "travel_request",
  "source": "website",  // website, whatsapp, email, phone, app
  
  "customer": {
    "user_id": "user-uuid",
    "name": "Aditya Sharma",
    "email": "aditya@example.com",
    "is_member": true
  },
  
  "pet": {
    "pet_id": "pet-uuid",
    "pet_name": "Miracle"
  },
  
  "details": {...},  // Pillar-specific request details
  
  "status": "pending",  // pending, processing, assigned, completed
  "priority": "normal",
  "ticket_id": "TKT-xyz",
  
  "created_at": ISODate,
  "updated_at": ISODate
}
```

#### 10. `app_settings` (Global Configuration)
```javascript
{
  "_id": ObjectId,
  "key": "membership_config",
  "value": {
    "plans": {
      "family": {
        "name": "Family Member",
        "price_yearly": 999,
        "price_monthly": 99,
        "max_pets": 2,
        "paw_points_multiplier": 2,
        "free_shipping_threshold": 500,
        "priority_support_hours": 24,
        "member_discount_percent": 10
      },
      "family_plus": {...},
      "family_elite": {...}
    },
    "paw_rewards": {
      "points_per_100_rupees": 10,
      "member_multiplier": 2,
      "redemption_rate": 100,  // 100 points = ₹1
      "min_redemption": 500,
      "max_redemption_percent": 20,
      "expiry_months": 12
    },
    "birthday_perks": {
      "enabled": true,
      "discount_percent": 15,
      "window_days_before": 7,
      "window_days_after": 7,
      "double_points": true
    }
  },
  "updated_at": ISODate,
  "updated_by": "admin-uuid"
}
```

---

## 🔌 API ENDPOINTS

### Membership APIs (`/api/membership`)

```
POST   /api/membership/purchase          # Purchase membership
POST   /api/membership/verify-payment    # Verify Razorpay payment
GET    /api/membership/status            # Get user's membership status
POST   /api/membership/cancel            # Cancel membership
POST   /api/membership/renew             # Renew membership

# Discount Codes
POST   /api/membership/validate-code     # Validate discount code
GET    /api/admin/discount-codes         # List all codes
POST   /api/admin/discount-codes         # Create code
PUT    /api/admin/discount-codes/:id     # Update code
DELETE /api/admin/discount-codes/:id     # Delete code

# B2B/Bulk
POST   /api/membership/bulk-purchase     # Corporate bulk purchase
GET    /api/admin/corporate-accounts     # List corporate accounts
```

### Paw Rewards APIs (`/api/rewards`)

```
GET    /api/rewards/balance              # Get user's points balance
GET    /api/rewards/history              # Get transaction history
POST   /api/rewards/redeem               # Redeem points at checkout
GET    /api/rewards/available            # Get redeemable amount

# Admin
GET    /api/admin/rewards/stats          # Rewards program stats
POST   /api/admin/rewards/adjust         # Manual point adjustment
GET    /api/admin/rewards/expiring       # Points expiring soon
```

### Pet Soul APIs (`/api/pets`)

```
GET    /api/pets                         # List user's pets
GET    /api/pets/:id                     # Get pet details
POST   /api/pets                         # Create pet profile
PUT    /api/pets/:id                     # Update pet profile
DELETE /api/pets/:id                     # Delete pet

GET    /api/pets/:id/soul                # Get Pet Soul profile (gamification)
POST   /api/pets/:id/activities          # Log activity
GET    /api/pets/:id/recommendations     # Get personalized recommendations
```

### Unified Order APIs (`/api/orders`)

```
POST   /api/orders                       # Create order
GET    /api/orders                       # List user's orders
GET    /api/orders/:id                   # Get order details
PUT    /api/orders/:id/status            # Update status (admin)

# With pillar context
GET    /api/orders?pillar=travel         # Filter by pillar
```

### Common Admin APIs

```
# Dashboard
GET    /api/admin/dashboard              # Combined stats
GET    /api/admin/dashboard/revenue      # Revenue by pillar
GET    /api/admin/dashboard/members      # Member growth

# Unified Inbox
GET    /api/channels/intakes             # All requests
GET    /api/channels/intakes?pillar=x    # Filter by pillar

# Service Desk
GET    /api/tickets                      # All tickets
PUT    /api/tickets/:id                  # Update ticket

# Members
GET    /api/admin/members                # All members
GET    /api/admin/members/:id            # Member details
PUT    /api/admin/members/:id            # Update member
```

---

## 🔄 EVENT-DRIVEN ARCHITECTURE

### Events & Triggers

```python
# When membership is purchased
async def on_membership_purchased(user_id, membership_id):
    # 1. Update user membership status
    # 2. Award welcome bonus points
    # 3. Send welcome email
    # 4. Create service desk ticket for onboarding
    # 5. Trigger Pet Soul creation flow
    # 6. Log to analytics

# When order is placed
async def on_order_placed(order_id):
    # 1. Calculate paw points (with member multiplier)
    # 2. Create service desk ticket
    # 3. Create unified inbox entry
    # 4. Send confirmation notification
    # 5. Update Pet Soul activity
    # 6. Check birthday perks eligibility

# When pet birthday approaches
async def on_birthday_approaching(pet_id, days_until):
    # 1. Unlock birthday perks
    # 2. Send birthday notification
    # 3. Apply auto-discount to cart
    # 4. Generate personalized recommendations
```

---

## 🎨 FRONTEND COMPONENTS

### New Components Needed

```
MembershipPage.jsx          # Public membership info page
MembershipCheckout.jsx      # Purchase flow
MembershipSuccess.jsx       # Post-purchase + Pet Soul creation
MembershipBenefits.jsx      # Benefits display component
MembershipBadge.jsx         # Member badge in navbar
PawRewardsWidget.jsx        # Points balance display
BirthdayPerksBar.jsx        # Birthday notification banner
MemberPricing.jsx           # Price display with member pricing
```

### Component Updates Needed

```
Navbar.jsx                  # Add membership badge, points display
Checkout.jsx                # Add member pricing, paw points redemption
ProductCard.jsx             # Show member price, paw points
MemberDashboard.jsx         # Add membership tab, rewards tab
Admin.jsx                   # Reorganize tabs per architecture
```

---

## 📊 REPORTING & ANALYTICS

### Key Metrics Dashboard

```
MEMBERSHIP
├── Total Members (active)
├── New Members (this month)
├── Renewal Rate
├── Churn Rate
├── Revenue (MRR/ARR)
├── B2B vs B2C split
└── Discount Code Usage

PAW REWARDS
├── Total Points Issued
├── Total Points Redeemed
├── Points Liability (₹ value)
├── Redemption Rate
├── Points Expiring (30 days)
└── Member vs Guest earning

BIRTHDAY PERKS
├── Birthdays This Month
├── Perks Claimed
├── Revenue from Birthday Orders
└── Conversion Rate

PER PILLAR
├── Revenue
├── Orders
├── Avg Order Value
├── Member vs Guest orders
└── Top Products
```

---

## 🔐 SECURITY CONSIDERATIONS

1. **Payment Security**: Razorpay handles all card data
2. **Member Data**: Encrypted at rest, HTTPS in transit
3. **API Authentication**: JWT tokens with expiry
4. **Admin Access**: Role-based (admin, agent)
5. **Rate Limiting**: Prevent abuse on signup/purchase
6. **Discount Code**: Single-use, expiry, usage limits

---

## 📱 MOBILE RESPONSIVENESS

All components must be mobile-first:
- Membership purchase flow optimized for mobile
- Pet Soul creation wizard works on small screens
- Paw Rewards widget collapsible
- Admin panel has mobile-friendly tables

---

*Document Version: 1.0*
*Created: January 19, 2026*

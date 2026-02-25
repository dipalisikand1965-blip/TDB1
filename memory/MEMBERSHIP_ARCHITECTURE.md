# 🐾 THE DOGGY COMPANY - MEMBERSHIP ARCHITECTURE

## Executive Summary
**One Engine. One Membership. Multiple Pillars.**

A single membership unlocks the entire Pet Life Operating System across ALL pillars (Celebrate, Dine, Stay, Travel, Care). Every interaction enriches the Pet Soul, every purchase earns Paw Rewards, and every pet gets Birthday Perks.

---

## 🎯 CORE PHILOSOPHY

### Single Engine Architecture
```
┌─────────────────────────────────────────────────────────────────────┐
│                        THE DOGGY COMPANY ENGINE                      │
├─────────────────────────────────────────────────────────────────────┤
│  COMMON SERVICES (Shared Across All Pillars)                        │
│  ├── 👤 Customer/Member Management                                   │
│  ├── 🐕 Pet Soul (Pet Profiles)                                      │
│  ├── 🎁 Paw Rewards System                                           │
│  ├── 🎂 Birthday Perks Engine                                        │
│  ├── 📬 Unified Inbox                                                │
│  ├── 🎫 Service Desk (Tickets)                                       │
│  ├── 🔔 Notification Engine (Email/WhatsApp/SMS)                     │
│  ├── 🛒 Orders & Cart System                                         │
│  └── 📊 Reporting & Analytics                                        │
├─────────────────────────────────────────────────────────────────────┤
│  PILLARS (Each Uses Common Services)                                │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐        │
│  │🎂CELEBRATE│ │🍽️ DINE  │ │🏨 STAY  │ │✈️TRAVEL │ │💊 CARE  │        │
│  │Products │ │Products │ │Products │ │Products │ │Products │        │
│  │Services │ │Services │ │Services │ │Services │ │Services │        │
│  │Experien.│ │Experien.│ │Experien.│ │Experien.│ │Experien.│        │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘        │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🎫 MEMBERSHIP STRUCTURE

### Single Membership Model (V1)
**"The Doggy Company Family Membership"**

| Feature | FREE (Guest) | MEMBER (₹999/year) |
|---------|--------------|---------------------|
| Pet Soul Profile | Basic | Full + Gamification |
| Paw Rewards | 1x points | 2x points |
| Birthday Perks | No | Yes (15% off + Free Gift) |
| Member Pricing | No | Yes (10-15% off) |
| Priority Support | No | Yes (24hr response) |
| Free Shipping | No | Yes (orders ₹500+) |
| Exclusive Products | No | Yes |
| Early Access | No | Yes (new collections) |
| Concierge Services | Standard | Premium |
| Multi-Pet Support | 1 pet | Unlimited pets |

### Future Tiers (V2)
- **Family Member**: ₹999/year (1-2 pets)
- **Family Plus**: ₹1,499/year (3-5 pets)  
- **Family Elite**: ₹2,499/year (Unlimited + VIP)

---

## 🚀 MEMBERSHIP ONBOARDING FLOW

### Step-by-Step Journey

```
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 1: DISCOVERY                                                    │
│ ├── User lands on website/app                                        │
│ ├── Sees membership benefits banner                                  │
│ └── Clicks "Join the Family" or "Become a Member"                   │
└─────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 2: PET PARENT DETAILS (Creates Customer Profile)               │
│ ├── Full Name *                                                      │
│ ├── Email * (becomes login)                                         │
│ ├── Phone * (for WhatsApp notifications)                            │
│ ├── City *                                                          │
│ ├── Address (optional, can add later)                               │
│ └── How did you hear about us?                                      │
└─────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 3: PAYMENT                                                      │
│ ├── Show membership benefits summary                                 │
│ ├── ₹999/year (or monthly option ₹99/month)                         │
│ ├── Apply discount code (for B2B/wholesale)                         │
│ └── Payment via Razorpay/UPI/Card                                   │
└─────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 4: PAYMENT SUCCESS → PET SOUL CREATION                         │
│ ├── "Welcome to the Family! 🎉"                                      │
│ ├── "Now let's create [Pet Name]'s Soul Profile"                    │
│ └── Redirect to Pet Soul onboarding                                 │
└─────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 5: PET SOUL PROFILE (First Pet)                                │
│ ├── Pet Name *                                                       │
│ ├── Breed * (with search/autocomplete)                              │
│ ├── Date of Birth * (for birthday perks!)                           │
│ ├── Gender                                                          │
│ ├── Size (Small/Medium/Large/Giant)                                 │
│ ├── Weight                                                          │
│ ├── Photo (upload)                                                  │
│ ├── Personality Traits (multi-select)                               │
│ ├── Health Notes (allergies, conditions)                            │
│ ├── Vet Details (optional)                                          │
│ └── Preferences (food, activities, fears)                           │
└─────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 6: WELCOME DASHBOARD                                            │
│ ├── "Welcome to the Family, [Pet Name]! 🎉"                         │
│ ├── Show Pet Soul card with personality badge                       │
│ ├── Display Paw Points balance (100 welcome bonus)                  │
│ ├── Show next birthday countdown                                    │
│ ├── Quick links: Shop, Dine, Stay, Travel                          │
│ └── "+ Add Another Pet" button                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🎁 PAW REWARDS SYSTEM

### Earning Points (Member gets 2x)

| Action | Guest | Member |
|--------|-------|--------|
| Sign up | 0 | 100 welcome bonus |
| Per ₹100 spent | 10 pts | 20 pts |
| Complete Pet Soul | 0 | 50 pts |
| Add pet birthday | 0 | 25 pts |
| Write a review | 5 pts | 10 pts |
| Refer a friend | 50 pts | 100 pts |
| Social share | 5 pts | 10 pts |
| Book dining reservation | 10 pts | 20 pts |
| Book stay | 20 pts | 40 pts |
| Travel request | 25 pts | 50 pts |

### Redeeming Points
- 100 points = ₹1 discount
- Minimum redemption: 500 points (₹5)
- Maximum per order: 20% of order value
- Points expire: 12 months from earning

### Product-Level Paw Rewards
Every product/service has `paw_reward_points` field:
```json
{
  "id": "travel-crate-medium",
  "name": "IATA Travel Crate - Medium",
  "price": 4999,
  "paw_reward_points": 50,  // Earns 50 pts (100 for members)
  "is_birthday_perk": true,
  "birthday_discount_percent": 15
}
```

---

## 🎂 BIRTHDAY PERKS ENGINE

### How It Works
1. **30 days before**: Email "Birthday Month is Coming!"
2. **7 days before**: Unlock birthday perks, send notification
3. **On birthday**: Special message + Free gift unlocked
4. **7 days after**: Perks remain active

### Birthday Benefits (Members Only)
- **15% off** entire order during birthday window
- **Free Birthday Gift** (selected product, e.g., birthday bandana)
- **Double Paw Points** during birthday month
- **Priority concierge** for birthday celebrations

### Product Birthday Perks
```json
{
  "id": "birthday-cake-small",
  "is_birthday_perk": true,
  "birthday_discount_percent": 20,
  "birthday_free_add_on": "birthday-bandana"  // Free with birthday orders
}
```

---

## 💼 B2B / WHOLESALE / CORPORATE

### Bulk Membership Sales
Companies can purchase memberships in bulk for:
- Pet-friendly offices
- Employee benefits programs
- Corporate gifting
- Vet clinic partnerships
- Pet store partnerships

### Discount Code System
```
Structure: [PREFIX]-[TYPE]-[CODE]
Examples:
- CORP-BULK-TATA100  (100 memberships for Tata)
- WHL-PART-VETCARE50 (50 memberships for VetCare clinic)
- REF-USER-JOHN20    (20% off referral code)
```

### Discount Code Features
| Field | Description |
|-------|-------------|
| code | Unique code (auto-generated or custom) |
| type | bulk_membership, wholesale, referral, promo |
| discount_percent | Percentage off |
| discount_amount | Fixed amount off |
| max_uses | Total times code can be used |
| used_count | Times used so far |
| valid_from | Start date |
| valid_until | Expiry date |
| min_quantity | Minimum memberships to purchase |
| applies_to | membership, products, all |
| created_by | Admin who created |
| partner_id | For wholesale partners |

---

## 📊 UNIFIED DATA FLOW

### Every Transaction Creates:

```
┌─────────────────────────────────────────────────────────────────────┐
│ USER ACTION (Purchase, Booking, Request)                            │
└─────────────────────────────────────────────────────────────────────┘
                                    ↓
         ┌──────────────────────────┼──────────────────────────┐
         ↓                          ↓                          ↓
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ 📦 ORDER        │    │ 🎫 SERVICE DESK │    │ 📬 UNIFIED INBOX│
│ - order_id      │    │ - ticket_id     │    │ - intake_id     │
│ - items         │    │ - pillar        │    │ - pillar        │
│ - status        │    │ - priority      │    │ - source        │
│ - paw_points    │    │ - status        │    │ - status        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         ↓                          ↓                          ↓
         └──────────────────────────┼──────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 🔔 NOTIFICATION ENGINE                                               │
│ - Email confirmation                                                 │
│ - WhatsApp update                                                   │
│ - Push notification                                                 │
└─────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 🐕 PET SOUL UPDATE                                                   │
│ - Activity logged                                                   │
│ - Preferences learned                                               │
│ - Soul points updated                                               │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔧 ADMIN PANEL ORGANIZATION

### Section 1: COMMON (Applies to ALL Pillars)
```
📊 DASHBOARD
├── Revenue Overview (all pillars combined)
├── Member Growth
├── Paw Points Issued/Redeemed
└── Active Tickets Summary

👥 MEMBERS
├── All Members
├── Membership Sales
├── B2B/Corporate Accounts
├── Discount Codes
└── Referral Program

🐕 PET SOUL
├── All Pets
├── Breed Management
├── Birthday Calendar
└── Pet Tags

🎁 REWARDS & PERKS
├── Paw Rewards Settings
├── Birthday Perks Config
├── Member-only Products
└── Points Expiry Management

📬 UNIFIED INBOX
├── All Requests
├── By Pillar Filter
├── Unassigned
└── Escalated

🎫 SERVICE DESK
├── All Tickets
├── SLA Management
├── Agent Assignment
└── Resolution Analytics

🔔 NOTIFICATIONS
├── Email Templates
├── WhatsApp Templates
├── Scheduled Messages
└── Abandoned Cart Settings
```

### Section 2: PILLAR-SPECIFIC
```
🎂 CELEBRATE (Pillar)
├── Products
├── Collections
├── Custom Cake Requests
├── Bundles
└── Pillar Settings

🍽️ DINE (Pillar)
├── Products
├── Restaurants
├── Reservations
├── Menu Items
└── Pillar Settings

🏨 STAY (Pillar)
├── Products
├── Properties
├── Bookings
├── Partners
└── Pillar Settings

✈️ TRAVEL (Pillar)
├── Products
├── Bundles
├── Requests
├── Partners
└── Pillar Settings

💊 CARE (Pillar)
├── Products
├── Services
├── Appointments
├── Providers
└── Pillar Settings
```

---

## 📝 NEXT STEPS

### Phase 1: Membership Foundation (This Sprint)
1. [ ] Create Membership model & database schema
2. [ ] Build membership purchase flow (Razorpay)
3. [ ] Integrate Pet Soul into onboarding
4. [ ] Add discount code system
5. [ ] Update all products with paw_reward_points
6. [ ] Member pricing logic in cart

### Phase 2: Benefits & Perks
1. [ ] Birthday perks engine
2. [ ] Member-only products
3. [ ] Priority support routing
4. [ ] Free shipping logic

### Phase 3: B2B & Growth
1. [ ] Corporate bulk purchase portal
2. [ ] Wholesale partner management
3. [ ] Referral program
4. [ ] Analytics dashboard

---

*Document Version: 1.0*
*Created: January 19, 2026*
*Author: The Doggy Company Tech Team*

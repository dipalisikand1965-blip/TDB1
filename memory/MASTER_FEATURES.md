# 🐕 The Doggy Company - Pet Life Operating System
## B2B2C Platform Architecture Document

*Last Updated: January 2025*

---

# 🎯 STRATEGIC VISION: B2B2C PET OPERATING SYSTEM

## What We're Building

A **white-label Pet Life Operating System** that businesses (B2B) can use to serve their pet-owning customers (B2C). Think of it as "Zoho for Pet Businesses" or "Salesforce for Vets".

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PET LIFE OPERATING SYSTEM                        │
│                    (Multi-Tenant SaaS Platform)                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐            │
│   │  VET CLINIC │    │    BANK     │    │  LIFESTYLE  │            │
│   │  INSTANCE   │    │  INSTANCE   │    │   BRAND     │            │
│   │             │    │             │    │  INSTANCE   │            │
│   │ • Pet Health│    │ • Pet       │    │ • Pet       │            │
│   │ • Care      │    │   Insurance │    │   Products  │            │
│   │ • Emergency │    │ • Loans     │    │ • Services  │            │
│   │ • Vaccines  │    │ • Rewards   │    │ • Lifestyle │            │
│   └──────┬──────┘    └──────┬──────┘    └──────┬──────┘            │
│          │                  │                  │                    │
│          └──────────────────┼──────────────────┘                    │
│                             │                                       │
│                    ┌────────▼────────┐                              │
│                    │   SHARED CORE   │                              │
│                    │   PLATFORM      │                              │
│                    │                 │                              │
│                    │ • Pet Database  │                              │
│                    │ • Service Desk  │                              │
│                    │ • Mira AI       │                              │
│                    │ • 14 Pillars    │                              │
│                    │ • Payments      │                              │
│                    │ • Analytics     │                              │
│                    └─────────────────┘                              │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🏢 TARGET B2B CUSTOMERS

### Tier 1: Primary Targets
| Business Type | Why They Need Us | Key Pillars |
|---------------|------------------|-------------|
| **Vet Clinics/Hospitals** | Patient management, appointments, follow-ups | Care, Emergency, Advisory |
| **Pet Insurance Companies** | Claims, wellness tracking, risk assessment | Insure, Care, Health |
| **Banks & Credit Cards** | Pet rewards programs, lifestyle benefits | All Pillars (Rewards focus) |
| **Pet Food Brands** | D2C + subscription management | Dine, Feed, Shop |
| **Pet Retail Chains** | Omnichannel retail + services | Shop, Care, Groom |

### Tier 2: Secondary Targets
| Business Type | Why They Need Us | Key Pillars |
|---------------|------------------|-------------|
| **Boarding/Daycare** | Booking, customer management | Stay, Care |
| **Groomers** | Appointments, loyalty | Groom, Shop |
| **Trainers** | Course management, progress tracking | Learn, Train |
| **Breeders** | Puppy management, new parent education | Adopt, Care |
| **Pet-Friendly Hotels** | Pet amenities, concierge | Stay, Travel |
| **Pet Photographers** | Booking, galleries | Celebrate, Enjoy |

---

## 🏗️ MULTI-TENANT ARCHITECTURE

### Tenant Configuration Model

```python
class TenantConfig:
    # Identity
    tenant_id: str              # "apollo_vets", "hdfc_pets", etc.
    tenant_name: str            # "Apollo Veterinary Clinics"
    tenant_type: str            # "vet_clinic", "bank", "retail", "brand"
    
    # Branding
    branding:
        logo_url: str
        primary_color: str      # Hex code
        secondary_color: str
        font_family: str
        custom_domain: str      # "pets.apolloclinic.com"
    
    # Feature Flags (Which pillars are enabled)
    enabled_pillars: [
        "care",      # Always on for vets
        "emergency", # Always on for vets
        "shop",      # Optional add-on
        # ... etc
    ]
    
    # Pricing Tier
    subscription_tier: str      # "starter", "professional", "enterprise"
    
    # Integration Keys
    integrations:
        payment_gateway: str    # "razorpay", "stripe"
        sms_provider: str       # "twilio", "msg91"
        email_provider: str     # "resend", "sendgrid"
    
    # Custom Fields
    custom_pet_fields: []       # Tenant-specific pet data fields
    custom_service_types: []    # Tenant-specific services
```

### Database Strategy

```
MongoDB Collections (Multi-Tenant):

├── tenants                    # Tenant configurations
├── tenant_users               # Staff/admin per tenant
├── pets                       # All pets (tenant_id field)
├── pet_parents               # All pet parents (tenant_id field)
├── tickets                   # Service desk (tenant_id field)
├── products                  # Products catalog (tenant_id field)
├── services                  # Services (tenant_id field)
├── bookings                  # Appointments (tenant_id field)
├── orders                    # Orders (tenant_id field)
├── mira_conversations        # AI chat history (tenant_id field)
└── analytics                 # Aggregated metrics (tenant_id field)
```

---

## 🔌 PILLAR-AS-MODULE ARCHITECTURE

Each pillar becomes a **toggleable module** that tenants can enable/disable:

### Core Pillars (Always Available)
| Pillar | Module ID | Default | Description |
|--------|-----------|---------|-------------|
| **Care** | `care` | ON | Health services, vet visits |
| **Shop** | `shop` | ON | Product catalog & orders |
| **Service Desk** | `desk` | ON | Ticket management |
| **Mira AI** | `mira` | ON | AI assistant |

### Optional Pillars
| Pillar | Module ID | Price | Best For |
|--------|-----------|-------|----------|
| **Emergency** | `emergency` | ₹5K/mo | Vet Clinics |
| **Stay** | `stay` | ₹3K/mo | Boarding facilities |
| **Dine** | `dine` | ₹2K/mo | Pet cafes, food brands |
| **Celebrate** | `celebrate` | ₹2K/mo | Bakeries, gift shops |
| **Travel** | `travel` | ₹3K/mo | Relocation services |
| **Fit** | `fitness` | ₹2K/mo | Trainers, gyms |
| **Learn** | `learn` | ₹2K/mo | Training academies |
| **Groom** | `groom` | ₹2K/mo | Grooming salons |
| **Adopt** | `adopt` | ₹1K/mo | Shelters, NGOs |
| **Farewell** | `farewell` | ₹1K/mo | Pet cremation |
| **Paperwork** | `paperwork` | ₹1K/mo | Documentation |
| **Advisory** | `advisory` | ₹2K/mo | Consultancies |
| **Insure** | `insure` | ₹5K/mo | Insurance companies |

---

## 💰 B2B PRICING MODEL

### Subscription Tiers

```
┌────────────────────────────────────────────────────────────────┐
│                        PRICING TIERS                           │
├──────────────┬──────────────┬──────────────┬──────────────────┤
│   STARTER    │ PROFESSIONAL │  ENTERPRISE  │   CUSTOM         │
│   ₹9,999/mo  │  ₹24,999/mo  │  ₹49,999/mo  │   Contact Us     │
├──────────────┼──────────────┼──────────────┼──────────────────┤
│ 3 Pillars    │ 7 Pillars    │ All Pillars  │ All + Custom     │
│ 1,000 Pets   │ 10,000 Pets  │ Unlimited    │ Unlimited        │
│ 3 Staff      │ 15 Staff     │ Unlimited    │ Unlimited        │
│ Basic Mira   │ Full Mira    │ Custom Mira  │ Trained Mira     │
│ Email Support│ Phone Support│ Dedicated AM │ Dedicated Team   │
│              │ API Access   │ White Label  │ On-Premise       │
└──────────────┴──────────────┴──────────────┴──────────────────┘
```

### Add-On Pricing
- **Per SMS**: ₹0.25
- **Per Email**: ₹0.10
- **Per WhatsApp**: ₹0.50
- **Mira AI Queries**: ₹0.05 per query (after 10K free)
- **Storage**: ₹100/GB after 5GB free
- **Custom Integration**: One-time ₹25K-100K

---

## 🤖 MIRA AI - TENANT-AWARE

### How Mira Works Per Tenant

```python
def get_mira_context(tenant_id: str, user_id: str) -> dict:
    """
    Mira's context changes based on tenant configuration
    """
    tenant = get_tenant_config(tenant_id)
    
    return {
        "tenant_name": tenant.name,                    # "Apollo Vets"
        "tenant_type": tenant.type,                    # "vet_clinic"
        "enabled_pillars": tenant.enabled_pillars,    # ["care", "emergency"]
        "brand_voice": tenant.ai_config.voice,        # "professional", "friendly"
        "products": get_tenant_products(tenant_id),   # Only show their products
        "services": get_tenant_services(tenant_id),   # Only their services
        "faq": tenant.ai_config.custom_faq,          # Tenant-specific FAQs
        "escalation_flow": tenant.escalation_config   # How to escalate
    }
```

### Example: Same User, Different Experience

**At Apollo Vets (Vet Clinic):**
> "Hi! I'm Mira, Apollo Vets' assistant. I can help you book a consultation, check vaccination schedules, or arrange emergency care for your pet."

**At HDFC Pet Rewards (Bank):**
> "Hi! I'm Mira, your HDFC Pet Rewards concierge. I can help you redeem your pet rewards points, find participating stores, or explore exclusive member benefits."

---

## 📊 ANALYTICS DASHBOARD

### Per-Tenant Metrics

| Metric | Description | Value For |
|--------|-------------|-----------|
| **Active Pets** | Registered pets | All tenants |
| **Monthly Bookings** | Appointments/orders | All tenants |
| **Revenue** | GMV through platform | All tenants |
| **Ticket Volume** | Service desk load | All tenants |
| **Mira Conversations** | AI assistant usage | All tenants |
| **NPS Score** | Customer satisfaction | All tenants |

### Platform-Wide Metrics (Our Internal)

| Metric | Description |
|--------|-------------|
| **Total Tenants** | Active B2B customers |
| **MRR** | Monthly recurring revenue |
| **Tenant Churn** | % tenants leaving |
| **Pet Database Size** | Total pets across all tenants |
| **API Calls** | Platform usage |
| **Uptime** | SLA compliance |

---

## 🛠️ IMPLEMENTATION ROADMAP

### Phase 1: Platform Foundation (Current State)
- [x] 14 Pillar architecture
- [x] Service Desk with templates
- [x] Mira AI assistant
- [x] Product catalog (600+ products)
- [x] Pet profiles with Soul Score
- [x] Member authentication

### Phase 2: Multi-Tenancy Core (Next)
- [ ] Tenant configuration model
- [ ] Tenant-scoped data access
- [ ] Custom domain support
- [ ] White-label branding
- [ ] Tenant admin portal

### Phase 3: Pillar Modularization
- [ ] Pillar toggle system
- [ ] Per-pillar pricing
- [ ] Feature flags per tenant
- [ ] Module marketplace

### Phase 4: B2B Sales Infrastructure
- [ ] Self-service signup
- [ ] Tenant billing (Stripe/Razorpay)
- [ ] Usage metering
- [ ] Trial management
- [ ] Partner portal

### Phase 5: Enterprise Features
- [ ] SSO integration
- [ ] API rate limiting
- [ ] Custom Mira training
- [ ] On-premise deployment
- [ ] Data export/import

---

## 🎯 GO-TO-MARKET STRATEGY

### Launch Partners (Target 5 for Beta)

1. **1 Vet Clinic Chain** - Validate Care pillar
2. **1 Pet Food Brand** - Validate Shop + Dine
3. **1 Boarding Facility** - Validate Stay pillar
4. **1 Insurance Company** - Validate Insure + Care
5. **1 Bank/Credit Card** - Validate Rewards + All Pillars

### Positioning

> "Give your customers the world's best pet experience without building it yourself."

### Key Selling Points

1. **Speed**: Launch pet services in weeks, not months
2. **Complete**: 14 pillars covering entire pet lifecycle
3. **AI-Powered**: Mira handles customer queries 24/7
4. **Proven**: Running our own B2C for 2+ years
5. **Flexible**: Enable only what you need

---

# 📋 FEATURE CHECKLIST BY TENANT TYPE

## For Vet Clinics

### Must Have
- [x] Patient (pet) registration
- [x] Appointment booking
- [x] Service desk for follow-ups
- [x] Health records storage
- [ ] **Vaccination reminders** (automated)
- [ ] **Prescription management**
- [ ] **Lab results integration**
- [ ] **Emergency triage**

### Nice to Have
- [ ] Telemedicine (video calls)
- [ ] E-commerce for pet products
- [ ] Loyalty program
- [ ] Referral tracking

---

## For Banks/Credit Cards

### Must Have
- [ ] **Pet rewards program**
- [ ] **Points redemption catalog**
- [x] Partner network (service providers)
- [ ] **Member tiers** (Silver/Gold/Platinum)
- [ ] **Exclusive offers**

### Nice to Have
- [ ] Pet insurance marketplace
- [ ] Pet loan calculator
- [ ] Emergency fund management
- [ ] Co-branded pet pass card

---

## For Pet Food Brands

### Must Have
- [ ] **Subscription management**
- [x] Product catalog
- [x] Order management
- [ ] **Auto-ship scheduling**
- [ ] **Nutrition tracking**

### Nice to Have
- [ ] Recipe recommendations
- [ ] Portion calculator
- [ ] Allergy management
- [ ] Community forums

---

## For Boarding/Daycare

### Must Have
- [x] Booking system
- [ ] **Check-in/Check-out**
- [ ] **Daily report cards**
- [ ] **Live camera feeds**
- [x] Service desk

### Nice to Have
- [ ] Pickup/drop scheduling
- [ ] Emergency contacts
- [ ] Feeding schedules
- [ ] Medication tracking

---

# 🔧 TECHNICAL SPECIFICATIONS

## API Design for Multi-Tenancy

### Authentication Header
```
Authorization: Bearer {token}
X-Tenant-ID: {tenant_id}
```

### Endpoint Structure
```
# Tenant-specific endpoints
GET /api/v1/{tenant_id}/pets
GET /api/v1/{tenant_id}/bookings
GET /api/v1/{tenant_id}/products

# Cross-tenant admin (platform admin only)
GET /api/admin/tenants
POST /api/admin/tenants
GET /api/admin/analytics/platform
```

### Data Isolation
```python
# Every query must be scoped to tenant
def get_pets(tenant_id: str, user_id: str):
    return db.pets.find({
        "tenant_id": tenant_id,  # MANDATORY
        "owner_id": user_id
    })
```

---

## Infrastructure Requirements

| Component | Current | B2B Scale |
|-----------|---------|-----------|
| **Database** | MongoDB (single) | MongoDB Atlas (sharded) |
| **Hosting** | Single cluster | Multi-region |
| **CDN** | Cloudflare | Cloudflare Enterprise |
| **Storage** | Local | S3 + CloudFront |
| **Search** | MongoDB text | Elasticsearch |
| **Queue** | None | Redis + Bull |
| **Monitoring** | Basic | DataDog/New Relic |

---

# 📞 IMMEDIATE BUGS TO FIX

## From User Report (Jan 2025)

| Issue | Priority | Status |
|-------|----------|--------|
| Floating button hiding Mira | P0 | ✅ FIXED |
| Voice Order not auto-populating name | P1 | 🔄 IN PROGRESS |
| Member form auto-population | P1 | 🔄 IN PROGRESS |
| Product box image not saving | P1 | TO DO |
| Mira Memories not storing | P1 | TO DO |
| Pet Profile error on personality tab | P1 | TO DO |
| App company name missing | P2 | TO DO |
| Notification expansion needed | P2 | TO DO |

---

*Document: /app/memory/MASTER_FEATURES.md*
*Version: 2.0 - B2B2C Architecture*
*Last Updated: January 2025*

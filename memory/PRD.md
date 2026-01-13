# The Doggy Bakery - Product Requirements Document

## Project Overview
World-class e-commerce website for The Doggy Bakery. Target domain: **thedoggycompany.in**

## Complete Features Status

### 1. Product Catalog ✅
- **556+ products** synced from thedoggybakery.com
- Auto-sync from Shopify via `/api/admin/sync/shopify`
- 16 categories with dynamic pricing
- CSV import/export for bulk updates

### 2. Mira AI Concierge ✅
- Full LLM integration with 9-step flow
- **Membership-gated access**:
  - Free: 3 chats/day
  - Pawsome: 10 chats/day
  - Premium: Unlimited
  - VIP: Priority + Unlimited
- All conversations stored in MongoDB
- Email + WhatsApp notifications

### 3. Admin Panel ✅
**URL**: `/admin` | **Login**: aditya / lola4304

| Tab | Features |
|-----|----------|
| **Dashboard** | Stats, city breakdown, recent chats |
| **Orders** | View all orders, status updates (Pending/Confirmed/Delivered), customer details, pet info, special instructions |
| **Mira Chats** | View conversations, filter by city/status, send notifications |
| **Members** | View registered users, tier stats, upgrade members manually |
| **Products** | Full CRUD, Shopify auto-sync, CSV import/export |
| **Videos** | Edit homepage videos |
| **Custom Cakes** | View custom cake requests |

### 4. Enhanced Checkout ✅
**All fields included:**
- Pet Parent: Name*, Email, Phone*, WhatsApp*
- Pet Details: **Pet Name*** (mandatory for cakes - goes on cake!), Breed, Age
- Delivery: Address*, Landmark, City*, Pincode*
- Preferences: Delivery Date, Time Slot
- **Special Instructions** field
- Gift option with message
- Membership promotion banner
- Quick add-ons
- Comprehensive WhatsApp order message

### 5. Order Management ✅
- All orders stored in MongoDB
- Full order details: items, customer, pet, delivery, instructions
- Admin can update status: Pending → Confirmed → Preparing → Delivered
- Filter by status

### 6. Membership System ✅
| Tier | Price | Daily Chats |
|------|-------|-------------|
| Free | ₹0 | 3 |
| Pawsome | ₹199/mo | 10 |
| Premium | ₹499/mo | Unlimited |
| VIP | ₹999/mo | Unlimited + Priority |

- User registration/login
- Admin can manually upgrade tiers

### 7. Auto-Sync from thedoggybakery.com ✅
**Manual**: Admin → Products → "Sync Now"
**Scheduled**: Set up cron job to call:
```bash
# Midnight daily sync
0 0 * * * curl -X POST "https://thedoggycompany.in/api/cron/sync-products?secret=midnight-sync-tdb-2025"
```

### 8. SEO ✅
- 31 meta tags
- JSON-LD structured data
- Open Graph + Twitter Cards

### 9. Homepage Features ✅ (Updated Jan 13, 2025)
- **MobiKwik Offers Banner** - ₹75 cashback + ₹100 scratch card
- **Pawsome Panel** - 12 VIP loyal customer dogs showcase
- **Testimonials** - 6 customer reviews
- **FAQ Section** - 6 common questions
- **Behind the Scenes Video** - YouTube integration
- **Instagram Feed** - Social proof
- **45K+ Happy Customers** stats

### 10. Policy Pages ✅
- Refund Policy
- Privacy Policy
- Terms of Service
- Shipping Policy

## API Endpoints Summary

### Public
```
GET  /api/products              - Product list
POST /api/orders                - Create order
POST /api/mira/chat             - Chat with Mira (rate limited)
GET  /api/mira/access           - Check access limits
POST /api/auth/register         - User registration
POST /api/auth/login            - User login
POST /api/membership/upgrade    - Upgrade tier
POST /api/cron/sync-products    - Scheduled sync (needs secret)
```

### Admin (Basic Auth)
```
GET/POST/PUT/DELETE /api/admin/products/*
POST /api/admin/sync/shopify
POST /api/admin/products/import-csv
GET  /api/admin/products/export-csv
GET/PUT /api/admin/orders/*
GET/PUT /api/admin/members/*
GET  /api/admin/chats
POST /api/admin/send-notification/{id}
```

## Database Collections
- `products` - 556+ products
- `orders` - All orders with full details
- `users` - Members with tiers
- `mira_chats` - Chat history
- `site_content` - Videos, settings
- `sync_logs` - Sync history
- `anonymous_usage` - Rate limiting

## Deployment Checklist
- [ ] Use Emergent "Deploy" feature to get DNS records
- [ ] Point thedoggycompany.in to server
- [ ] Verify Resend domain for emails (add DNS records)
- [ ] Set up external cron for midnight sync

## Environment Variables (backend/.env)
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=test_database
CORS_ORIGINS=*
EMERGENT_LLM_KEY=sk-emergent-***
RESEND_API_KEY=re_***
SENDER_EMAIL=onboarding@resend.dev
CRON_SECRET=midnight-sync-tdb-2025
NOTIFICATION_EMAIL=woof@thedoggybakery.com
WHATSAPP_NUMBER=919663185747
ADMIN_USERNAME=aditya
ADMIN_PASSWORD=lola4304
```

## Contact
- **Email**: woof@thedoggybakery.com
- **WhatsApp**: +91 96631 85747

---
Last Updated: January 13, 2025

## Changelog
- Jan 13, 2025: Added MobiKwik Offers Banner, Pawsome Panel section, fixed deployment blockers
- Jan 12, 2025: Added Policy pages, SEO optimization, membership gating
- Jan 11, 2025: Admin panel, product sync, order management

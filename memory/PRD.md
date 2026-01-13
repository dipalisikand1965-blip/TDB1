# The Doggy Bakery - Product Requirements Document

## Project Overview
World-class e-commerce website for The Doggy Bakery. Target domain: **thedoggycompany.in**

---

## Complete Features Status (Updated Jan 13, 2025)

### 1. Navigation & Footer ✅
**Navbar** (matching live site):
- Cakes | Custom Cake | Pupcakes | Treats | Pan India | Fresh Meals | More ▼ | **Mira AI**
- More dropdown: Breed Cakes, Desi Treats, Frozen Treats, Accessories & Toys, Merchandise, Membership

**Footer Links**:
- Quick Links: About Us, FAQs, TDB Insights, Streaties, Own A Bakery, Contact Us
- Policies: Shipping Policy, Refund Policy, Privacy Policy, Terms of Service, Membership
- Contact: Phone numbers, Email, Locations, WhatsApp

### 2. Product Catalog ✅
- **556+ products** synced from thedoggybakery.com
- Auto-sync from Shopify via `/api/admin/sync/shopify`
- 16 categories with dynamic pricing
- CSV import/export for bulk updates

### 3. Mira AI Concierge ✅
- Full LLM integration with 9-step flow
- **Membership-gated access**:
  - Free: 3 chats/day
  - Pawsome: 10 chats/day
  - Premium: Unlimited
  - VIP: Priority + Unlimited
- All conversations stored in MongoDB
- Email + WhatsApp notifications

### 4. Admin Panel ✅ (12 Tabs)
**URL**: `/admin` | **Login**: aditya / lola4304

| Tab | Features |
|-----|----------|
| **Dashboard** | Stats, city breakdown, recent chats |
| **Orders** | View all orders, status updates, customer details |
| **Mira Chats** | AI conversation logs |
| **Members** | User membership management |
| **Products** | Full CRUD, Shopify sync, CSV import/export |
| **Videos** | Homepage video management |
| **Testimonials** | Customer reviews management |
| **Insights/Blog** | Blog post management |
| **FAQs** | FAQ categories and questions |
| **Streaties** | Street treats inventory |
| **Franchise** | Franchise inquiries (3 New badge) |
| **Custom Cakes** | Custom cake requests |

### 5. New Pages Added ✅
| Page | URL | Description |
|------|-----|-------------|
| FAQs | `/faqs` | Searchable FAQ with categories |
| TDB Insights | `/insights` | Blog/news with featured posts |
| Streaties | `/streaties` | Street treats collection page |
| Own A Bakery | `/franchise` | Franchise inquiry form |
| Contact Us | `/contact` | Contact form + info cards |

### 6. Enhanced Checkout ✅
- Pet Parent: Name, Email, Phone, WhatsApp
- Pet Details: Pet Name (mandatory), Breed, Age
- Delivery: Address, Landmark, City, Pincode
- Special Instructions field
- Gift option with message

### 7. Membership System ✅
| Tier | Price | Daily Chats |
|------|-------|-------------|
| Free | ₹0 | 3 |
| Pawsome | ₹199/mo | 10 |
| Premium | ₹499/mo | Unlimited |
| VIP | ₹999/mo | Unlimited + Priority |

### 8. Homepage Features ✅
- MobiKwik Offers Banner (₹75 cashback + ₹100 scratch card)
- Pawsome Panel (12 VIP dogs showcase)
- Testimonials (6 customer reviews)
- FAQ Section
- Behind the Scenes Video
- Instagram Feed
- 45K+ Happy Customers stats

### 9. SEO ✅
- 31 meta tags
- JSON-LD structured data
- Open Graph + Twitter Cards

### 10. Policy Pages ✅
- Refund Policy, Privacy Policy, Terms of Service, Shipping Policy

---

## API Endpoints

### Public
```
GET  /api/products              - Product list
POST /api/orders                - Create order
POST /api/mira/chat             - Chat with Mira
GET  /api/mira/access           - Check access limits
POST /api/auth/register         - User registration
POST /api/auth/login            - User login
POST /api/membership/upgrade    - Upgrade tier
POST /api/cron/sync-products    - Scheduled sync
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

---

## Database Collections
- `products` - 556+ products
- `orders` - All orders with full details
- `users` - Members with tiers
- `mira_chats` - Chat history
- `site_content` - Videos, settings
- `sync_logs` - Sync history
- `anonymous_usage` - Rate limiting

---

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

---

## Deployment Checklist
- [ ] Use Emergent "Deploy" feature to get DNS records
- [ ] Point thedoggycompany.in to server
- [ ] Verify Resend domain for emails (add DNS records)
- [ ] Set up external cron for midnight sync

---

## Contact
- **Email**: woof@thedoggybakery.com
- **WhatsApp**: +91 96631 85747

---

## Changelog

### Jan 13, 2025 (Session 3)
- ✅ Fixed Hampers category page - now shows "Gift Hampers & Party Boxes 🎁" with 13 products
- ✅ **CRITICAL: Cleaned up 164 mock products** with wrong data - now only real Shopify data
- ✅ Product variants and prices now match original thedoggybakery.com (e.g., Chicken Jerky: 150g/300g not 100g/200g)
- ✅ Fixed Insights page - "Read More" now opens full articles with complete content
- ✅ Added admin endpoint `/api/admin/cleanup-mock-products` for database cleanup
- ✅ All 392 products correctly synced from Shopify
- ✅ Verified Mira AI close button works (X button in chat widget header)
- ✅ All frontend tests passed (11/11) including mobile viewport

### Jan 13, 2025 (Session 2)
- ✅ Updated Navbar to match live site design
- ✅ Updated Footer with all requested links
- ✅ Added FAQs page (`/faqs`) with searchable categories
- ✅ Added TDB Insights page (`/insights`) with blog posts
- ✅ Added Streaties page (`/streaties`) with product showcase
- ✅ Added Own A Bakery page (`/franchise`) with inquiry form
- ✅ Added Contact Us page (`/contact`) with form + info cards
- ✅ Updated Admin panel with 12 tabs (added FAQs, Streaties, Franchise)

### Jan 13, 2025 (Session 1)
- ✅ Added MobiKwik Offers Banner
- ✅ Added Pawsome Panel section
- ✅ Fixed deployment blockers (moved credentials to .env)

### Jan 12, 2025
- ✅ Added Policy pages
- ✅ SEO optimization
- ✅ Membership gating

### Jan 11, 2025
- ✅ Admin panel
- ✅ Product sync from Shopify
- ✅ Order management

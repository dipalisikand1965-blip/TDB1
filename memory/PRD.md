# The Doggy Bakery - Product Requirements Document

## Project Overview
Rebuild of thedoggybakery.com into a world-class, professional e-commerce website for a birthday demo on **January 15th, 2025**.

## Core Features Status

### 1. Product Catalog ✅ COMPLETE
- **556 products** in MongoDB (164 original + 392 from Shopify sync)
- **Auto-sync** from thedoggybakery.com Shopify store
- 16 categories with dynamic pricing (sizes, flavors)
- Admin editable via /admin panel

### 2. Mira AI Concierge ✅ COMPLETE
- Full LLM integration with Emergent integrations
- 9-step conversational flow
- **Membership-gated access**:
  - Free: 3 chats/day
  - Pawsome: 10 chats/day
  - Premium: Unlimited
  - VIP: Priority + Unlimited
- All conversations stored in MongoDB
- Email + WhatsApp notifications

### 3. Admin Panel ✅ COMPLETE
**Login**: aditya / lola4304 | **URL**: /admin

| Tab | Features |
|-----|----------|
| Dashboard | Stats, city breakdown, recent chats |
| Mira Chats | View all conversations, filter, send notifications |
| Products | Full CRUD, **Shopify auto-sync**, CSV import/export |
| Videos & Content | Edit homepage videos, banner text |
| Custom Cakes | View custom cake requests |

### 4. Shopify Auto-Sync ✅ COMPLETE
- Syncs from `thedoggybakery.com/products.json`
- One-click sync from admin panel
- Extracts: name, price, sizes, flavors, images, categories
- Upserts to avoid duplicates
- Sync logs stored for audit

### 5. CSV Import/Export ✅ COMPLETE
- **Import**: Upload CSV to bulk add/update products
- **Export**: Download all products as CSV
- Columns: name, category, price, originalPrice, description, image, sizes (JSON), flavors (JSON)

### 6. Membership System ✅ COMPLETE
| Tier | Price | Daily Chats | Features |
|------|-------|-------------|----------|
| Free | ₹0 | 3 | Basic Mira access |
| Pawsome | ₹199/mo | 10 | Extended access |
| Premium | ₹499/mo | Unlimited | Full concierge |
| VIP | ₹999/mo | Unlimited | Priority queue |

**User Auth**: Registration, login, membership upgrade endpoints

### 7. SEO Optimization ✅ COMPLETE
- 31 meta tags
- JSON-LD structured data
- Rich snippets for Google

### 8. WhatsApp Integration ✅ COMPLETE
- Order notifications to +91 96631 85747
- Chat notifications from admin

## API Endpoints

### Public
```
GET  /api/products              - List products
GET  /api/content/videos        - Homepage videos
POST /api/mira/chat             - Chat with Mira (rate limited)
GET  /api/mira/access           - Check access limits
POST /api/auth/register         - User registration
POST /api/auth/login            - User login
POST /api/membership/upgrade    - Upgrade tier
```

### Admin (Basic Auth: aditya/lola4304)
```
GET/POST/PUT/DELETE /api/admin/products/*    - Product CRUD
POST /api/admin/products/import-csv          - CSV import
GET  /api/admin/products/export-csv          - CSV export
POST /api/admin/sync/shopify                 - Sync from Shopify
GET  /api/admin/sync/status                  - Sync status
GET/PUT /api/admin/site-content              - Site content
GET  /api/admin/chats                        - View chats
POST /api/admin/send-notification/{id}       - Send notification
```

## Database Collections
- `products` - 556 products
- `users` - Registered users with membership
- `mira_chats` - Chat history
- `site_content` - Videos, hero slides
- `sync_logs` - Shopify sync history
- `anonymous_usage` - Rate limiting for anonymous users

## How Auto-Sync Works
1. Go to Admin → Products tab
2. Click "Sync Now"
3. System fetches `https://thedoggybakery.com/products.json`
4. Transforms Shopify products to our format
5. Upserts into MongoDB (updates existing, adds new)
6. Products immediately available on frontend

**For automatic scheduled sync**: Set up a cron job to call `/api/admin/sync/shopify`

## Deployment Notes
- **Domain**: thedoggycompany.in (DNS pending)
- **Email**: Requires domain verification on Resend
- **WhatsApp**: Working immediately

## Upcoming Tasks
- [ ] DNS setup for thedoggycompany.in
- [ ] Verify Resend domain for emails
- [ ] Set up automated daily sync (cron)

## Contact
- **Email**: woof@thedoggybakery.com
- **WhatsApp**: +91 96631 85747

---
Last Updated: January 13, 2025

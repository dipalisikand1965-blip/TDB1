# The Doggy Bakery - Product Requirements Document

## Project Overview
Rebuild of thedoggybakery.com into a world-class, professional e-commerce website for a birthday demo on **January 15th, 2025**.

## User
- Client's son's 30th birthday celebration
- The Doggy Bakery - Premium pet bakery business
- Target domain: **thedoggycompany.in**

## Core Requirements

### 1. Product Catalog ✅ COMPLETED
- **164 products** in MongoDB database
- 16 Categories: cakes, breed-cakes, treats, dognuts, pizzas-burgers, fresh-meals, frozen-treats, accessories, cat-treats, gift-cards, merchandise, mini-cakes, desi-treats, nut-butters, cake-mix, pan-india
- Dynamic pricing with size/flavor variants
- **Admin editable** via /admin panel

### 2. Mira AI Concierge ✅ COMPLETED
- Full-stack implementation with FastAPI backend + Emergent LLM integration
- 9-step conversational flow for celebration planning
- All conversations stored in MongoDB
- Email + WhatsApp notifications for important chats
- Chat history viewable in admin panel

### 3. Admin Panel ✅ COMPLETED (Jan 13, 2025)
- **Login**: aditya / lola4304
- **Dashboard**: Stats, city breakdown, recent chats
- **Mira Chats**: View all conversations, filter by city/status, send notifications
- **Products**: Full CRUD - Add, Edit, Delete products with sizes/flavors/pricing
- **Videos & Content**: Edit homepage videos, banner text, WhatsApp number
- **Custom Requests**: View custom cake requests with images

### 4. WhatsApp Integration ✅ COMPLETED
- Click-to-chat with **+91 96631 85747**
- Order confirmation with detailed WhatsApp message
- Admin notification via WhatsApp for Mira chats

### 5. SEO Optimization ✅ COMPLETED (Jan 13, 2025)
- 31 meta tags (title, description, keywords, OG, Twitter)
- JSON-LD structured data (Bakery schema, FAQ schema)
- Geo tags for Mumbai, Bangalore, Gurgaon

### 6. Membership Page ✅ COMPLETED (Jan 13, 2025)
- Three tiers: Pawsome (₹199/mo), Premium (₹499/mo), VIP (₹999/mo)
- **Note**: Membership is UI-only marketing page, no actual gating implemented

### 7. Personalization & Checkout ✅ COMPLETED
- Pet's Name, Age, Delivery Date on product cards
- Add-on suggestions in checkout
- Comprehensive WhatsApp message generation

### 8. Custom Cake Designer ✅ COMPLETED
- Image upload feature for cake design ideas
- Requests viewable in admin panel

## Technical Architecture

```
/app
├── backend/
│   ├── server.py              # FastAPI with all endpoints
│   │   ├── /api/mira/chat     # AI chat with storage
│   │   ├── /api/products      # Public products API
│   │   ├── /api/content/videos # Public videos API
│   │   ├── /api/admin/*       # Admin CRUD endpoints
│   │   └── /api/custom-cakes  # File upload
│   ├── requirements.txt
│   └── uploads/
└── frontend/
    ├── public/
    │   └── index.html         # SEO meta tags
    └── src/
        ├── components/
        │   ├── VideoSection.jsx  # Fetches from backend
        │   └── ...
        ├── pages/
        │   ├── Admin.jsx        # Full admin panel
        │   ├── Membership.jsx   # Membership tiers
        │   └── ...
        └── mockData.js         # Legacy (data now in MongoDB)
```

## Database Collections (MongoDB)
- `products` - 164 products with variants
- `mira_chats` - All Mira AI conversations
- `site_content` - Videos, hero slides, banner text
- `custom_cake_requests` - Custom cake form submissions

## API Endpoints
### Public
- `GET /api/products` - Get all products
- `GET /api/content/videos` - Get homepage videos
- `POST /api/mira/chat` - Chat with Mira AI
- `POST /api/custom-cakes/request` - Submit custom cake request

### Admin (Basic Auth: aditya/lola4304)
- `GET/POST/PUT/DELETE /api/admin/products/*` - Product CRUD
- `GET/PUT /api/admin/site-content` - Site content management
- `PUT /api/admin/site-content/videos` - Update videos
- `GET /api/admin/chats` - View Mira conversations
- `POST /api/admin/send-notification/{session_id}` - Send notifications

## Upcoming Tasks

### P0 - Before Birthday Demo (Jan 15)
- [ ] DNS setup instructions for thedoggycompany.in

### P1 - Nice to Have
- [ ] Sync products with latest from live site (some new products added)
- [ ] Verify all prices match live site exactly

### P2 - Post Demo
- [ ] Shopify Headless Integration
- [ ] Implement actual membership gating for Mira AI
- [ ] Payment gateway integration

## Important Notes
- **Gurgaon = Gurugram** (same city, normalized in code)
- **Products are now in MongoDB**, not just mockData.js
- **Membership page is UI-only** - no payment integration yet
- **Email notifications require domain verification** on Resend to work

## Contact Information
- **Email**: woof@thedoggybakery.com
- **WhatsApp**: +91 96631 85747
- **Instagram**: @the_doggy_bakery

---
Last Updated: January 13, 2025

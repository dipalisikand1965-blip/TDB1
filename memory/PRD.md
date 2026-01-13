# The Doggy Bakery - Product Requirements Document

## Project Overview
Rebuild of thedoggybakery.com into a world-class, professional e-commerce website for a birthday demo on **January 15th, 2025**.

## User
- Client's son's 30th birthday celebration
- The Doggy Bakery - Premium pet bakery business
- Target domain: **thedoggycompany.in**

## Core Requirements

### 1. Product Catalog ✅ COMPLETED (Jan 12, 2025)
- **200+ products** scraped from live thedoggybakery.com
- Categories:
  - Birthday Cakes (36 products)
  - Breed-Specific Cakes (27 products)
  - Treats & Biscuits (17 products)
  - Dognuts (6 products)
  - Pizzas & Burgers (6 products)
  - Fresh Meals (4 products)
  - Frozen Treats (10 products)
  - Dog Accessories (15 products)
  - Cat Treats (4 products)
  - Gift Cards (1 product)
  - New Merchandise Concepts (8 products) - hampers, subscription boxes, party kits, apparel
- Dynamic pricing with size/flavor variants

### 2. Mira AI Concierge ✅ COMPLETED (Jan 12, 2025)
- Full-stack implementation with FastAPI backend + Emergent LLM integration
- 9-step conversational flow for celebration planning
- Services flow with **working city selection** (Bangalore, Mumbai, Gurgaon, Delhi)
- Referrals to vets, groomers, boarding, training
- Persona: sophisticated, warm, knowledgeable "private office" concierge

### 3. WhatsApp Integration ✅ COMPLETED (Jan 12, 2025)
- Click-to-chat with **+91 96631 85747**
- Floating WhatsApp button (bottom left)
- Footer WhatsApp button
- Order confirmation with WhatsApp CTA
- Pre-filled order message with full order details

### 4. Personalization & Checkout ✅ COMPLETED (Jan 12, 2025)
- Pet's Name, Age, Delivery Date on product cards
- Personalization details carry through to cart and checkout
- Add-on suggestions in checkout
- Comprehensive WhatsApp message generation with GST note

### 5. Custom Cake Designer ✅ COMPLETED (Jan 12, 2025)
- Image upload feature for cake design ideas
- Form submission to backend

### 6. SEO Optimization ✅ COMPLETED (Jan 13, 2025)
- Comprehensive meta tags matching thedoggybakery.com
- Keywords: dog cakes, dog birthday cake, dog treats, pet bakery, etc.
- Open Graph tags for social sharing
- Twitter Card meta tags
- JSON-LD structured data:
  - Bakery schema with rating (4.8/5, 45000 reviews)
  - FAQ schema for common questions
  - GeoCoordinates for Mumbai, Bangalore, Gurgaon
- Canonical URL set to thedoggycompany.in
- Mobile app meta tags

### 7. Membership Page ✅ COMPLETED (Jan 13, 2025)
- Three tiers: Pawsome, Premium, VIP
- Pricing:
  - Pawsome: ₹199/month (₹1999/year)
  - Premium: ₹499/month (₹4999/year) - Most Popular
  - VIP: ₹999/month (₹9999/year)
- Features per tier:
  - Pawsome: 5% discount, basic Mira AI, monthly treats
  - Premium: 12% discount, full Mira AI, party planning
  - VIP: 20% discount, VIP Mira AI priority, personal coordinator, complimentary annual cake
- Monthly/Yearly billing toggle
- Testimonials section
- FAQ section
- Navigation link added

### 8. UI/UX Design ✅ COMPLETED
- Premium, world-class design
- Official TDB logo and favicon
- Instagram Feed section
- Video Section
- Animated counters for stats
- Modern product cards with size/flavor selection

## Upcoming Tasks

### P0 - Before Birthday Demo (Jan 15)
- [ ] DNS setup instructions for thedoggycompany.in (A/CNAME records) - **PENDING**

### P1 - Nice to Have
- [ ] Full product data & pricing audit against live site
- [ ] Add more merchandise UI sections

### P2 - Post Demo (Future)
- [ ] Full Shopify Headless Integration (when API credentials provided)
- [ ] Mira AI with live web search for referrals
- [ ] Advanced review system with photos/videos
- [ ] Payment gateway integration

## Technical Architecture

```
/app
├── backend/
│   ├── server.py              # FastAPI with Mira AI chat + file upload
│   ├── requirements.txt
│   └── uploads/               # Custom cake images
└── frontend/
    ├── public/
    │   └── index.html         # SEO meta tags, JSON-LD structured data
    └── src/
        ├── components/
        │   ├── Navbar.jsx      # With Membership link
        │   ├── Footer.jsx      # WhatsApp integration
        │   ├── MiraAI.jsx      # AI Concierge (backend integration)
        │   ├── ProductCard.jsx # Variants + Personalization
        │   └── CartSidebar.jsx
        ├── pages/
        │   ├── Home.jsx
        │   ├── ProductListing.jsx
        │   ├── Checkout.jsx    # WhatsApp order confirmation
        │   ├── CustomCakeDesigner.jsx
        │   ├── MiraConcierge.jsx
        │   └── Membership.jsx  # NEW - 3 tier membership
        ├── context/
        │   └── CartContext.js
        └── mockData.js         # 200+ products
```

## API Endpoints
- `POST /api/mira/chat` - Mira AI conversation
- `POST /api/custom-cakes/request` - Custom cake image upload

## Key Contact Information
- **Email**: woof@thedoggybakery.com
- **WhatsApp**: +91 96631 85747
- **Phone**: 9739982582, 9663185747
- **Instagram**: @the_doggy_bakery
- **Cities**: Bengaluru, Mumbai, Gurgaon

## Notes
- **ALL PRODUCT DATA IS MOCKED** in mockData.js (no backend/Shopify database)
- This is a demo site for birthday celebration
- Real Shopify integration planned post-demo
- Membership page is UI-only (no payment integration yet)

---
Last Updated: January 13, 2025

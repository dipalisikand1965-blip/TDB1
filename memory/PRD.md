# The Doggy Bakery - Product Requirements Document

## Project Overview
Rebuild of thedoggybakery.com into a world-class, professional e-commerce website for a birthday demo on **January 15th, 2025**.

## User
- Client's son's 30th birthday celebration
- The Doggy Bakery - Premium pet bakery business

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

### 2. Mira AI Concierge ✅ COMPLETED (Jan 12, 2025)
- 9-step conversational flow for celebration planning
- Services flow with **working city selection** (Bangalore, Mumbai, Gurgaon, Delhi)
- Referrals to vets, groomers, boarding, training
- Persona: sophisticated, warm, knowledgeable

### 3. WhatsApp Integration ✅ COMPLETED (Jan 12, 2025)
- Click-to-chat with **+91 96631 85747**
- Floating WhatsApp button (bottom left)
- Footer WhatsApp button
- Order confirmation with WhatsApp CTA
- Pre-filled order message for demo orders

### 4. UI/UX Design ✅ COMPLETED
- Premium, world-class design
- Official TDB logo and favicon
- Instagram Feed section
- Video Section
- Animated counters for stats
- Modern product cards with size/flavor selection

## Upcoming Tasks

### P0 - Before Birthday Demo
- [ ] DNS setup instructions for thedoggycompany.in (A/CNAME records)

### P1 - Nice to Have
- [ ] Re-implement Custom Cake Designer tool (lost during UI redesign)
- [ ] Add more merchandise UI sections

### P2 - Post Demo (Future)
- [ ] Full Shopify Headless Integration (when API credentials provided)
- [ ] Mira AI with live web search for referrals
- [ ] Advanced review system with photos/videos

## Technical Architecture

```
/app/frontend/
├── src/
│   ├── components/
│   │   ├── Header.jsx
│   │   ├── Footer.jsx (WhatsApp integration)
│   │   ├── MiraAI.jsx (AI Concierge)
│   │   ├── ProductCard.jsx
│   │   ├── InstagramFeed.jsx
│   │   └── VideoSection.jsx
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── ProductListing.jsx
│   │   └── Checkout.jsx (WhatsApp order confirmation)
│   ├── services/
│   │   └── shopify.js (placeholder)
│   └── mockData.js (200+ products)
```

## Key Contact Information
- **Email**: woof@thedoggybakery.com
- **WhatsApp**: +91 96631 85747
- **Phone**: 9739982582, 9663185747
- **Instagram**: @the_doggy_bakery
- **Cities**: Bengaluru, Mumbai, Gurgaon

## Notes
- **ALL PRODUCT DATA IS MOCKED** in mockData.js (no backend/Shopify)
- This is a demo site for birthday celebration
- Real Shopify integration planned post-demo

---
Last Updated: January 12, 2025

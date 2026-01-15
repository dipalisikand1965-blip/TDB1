# The Doggy Bakery - Product Requirements Document

## Project Overview
World-class e-commerce website for The Doggy Bakery. Target domain: **thedoggycompany.in**

---

## Complete Features Status (Updated Jan 14, 2025)

### 1. Navigation & Footer ✅
**Navbar** (matching live site):
- Cakes | Custom Cake | Bowto Cakes | Treats | Pan India | Fresh Meals | **🐾 Pet Soul** | More ▼ | **Mira AI**
- More dropdown: Breed Cakes, Desi Treats, Frozen Treats, Accessories & Toys, Merchandise, Membership
- **Pet Soul** button with gradient pink/purple styling - links to /my-pets

**Footer Links**:
- Quick Links: About Us, FAQs, TDB Insights, Streaties, Own A Bakery, Contact Us
- Policies: Shipping Policy, Refund Policy, Privacy Policy, Terms of Service, Membership
- Contact: Phone numbers, Email, Locations, WhatsApp

### 2. Product Catalog ✅
- **393+ products** synced from thedoggybakery.com
- Auto-sync from Shopify via `/api/admin/sync/shopify`
- 15 categories with dynamic pricing
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

### 4. Admin Panel ✅ (12 Tabs) - **OVERHAULED Jan 14, 2025**
**URL**: `/admin` | **Login**: aditya / lola4304

| Tab | Features |
|-----|----------|
| **Dashboard** | Stats, city breakdown, recent chats |
| **Orders** | View all orders, status updates, customer details |
| **Mira Chats** | AI conversation logs |
| **Members** | User membership management |
| **Products** | **NEW: Shopify-like ProductManager** - Full CRUD, search, filters, pagination, grid/list view, variant editing (sizes/flavors/prices), image management, Shopify sync |
| **Videos** | Homepage video management |
| **Testimonials** | **FUNCTIONAL CRUD** - Add/Edit/Delete reviews with ratings, featured flag |
| **Insights/Blog** | **FUNCTIONAL CRUD** - Create/Edit/Delete posts with status (draft/published), views tracking |
| **FAQs** | **FUNCTIONAL CRUD** - Add/Edit/Delete FAQs with categories |
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
POST /api/auth/login            - User login (returns JWT access_token)
GET  /api/auth/me               - Get current user info (requires Bearer token)
POST /api/auth/google/session   - Google OAuth session exchange
POST /api/auth/logout           - Logout and invalidate session
POST /api/membership/upgrade    - Upgrade tier
POST /api/cron/sync-products    - Scheduled sync
GET  /api/orders/my-orders      - User's order history (requires Bearer token)
GET  /api/pets/my-pets          - User's pet profiles (requires Bearer token)
GET  /api/search?q=query        - Smart search with filters (Meilisearch)
GET  /api/search/typeahead?q=query - Fast typeahead autocomplete
GET  /api/search/stats          - Search index statistics
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
POST /api/search/reindex        - Reindex all products in Meilisearch
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

### Jan 15, 2025 (Session 2) - Smart Search Feature
- ✅ **SMART SEARCH IMPLEMENTATION (Meilisearch)**
  - **Technology**: Meilisearch v1.11.0 local binary running on port 7700
  - **Backend Service**: `search_service.py` with async Meilisearch SDK
  - **Auto-Indexing**: 392 products + 22 collections indexed on startup
  - **Typo Tolerance**: Enabled (1 typo for 4+ chars, 2 typos for 8+ chars)
  - **Synonyms**: dog/doggy/pup, cake/birthday cake, treat/snack, labrador/lab, birthday/bday
- ✅ **Search API Endpoints**:
  - `GET /api/search?q=query` - Full search with filters (category, min_price, max_price, pan_india, autoship, sort)
  - `GET /api/search/typeahead?q=query` - Fast autocomplete (returns products + collections)
  - `GET /api/search/stats` - Index statistics (products indexed, indexing status)
  - `POST /api/search/reindex` - Admin endpoint to reindex all products (Basic Auth required)
- ✅ **Global Search Bar** (`SearchBar.jsx`):
  - Persistent search icon in Navbar opens search overlay
  - Live typeahead with 300ms debounce
  - Shows products (8 max) and collections (4 max) in dropdown
  - Product results show image, name, category, price
  - Collection results as clickable tags
  - "View all results" button navigates to search page
- ✅ **Search Results Page** (`SearchResults.jsx`):
  - Full-page search with filter panel
  - Category dropdown (12 categories)
  - Sort options: Relevance, Price asc/desc, Name asc/desc
  - Price range filter (Min/Max)
  - Checkboxes: Pan India Shipping, Autoship Available
  - Grid/List view toggle
  - Load More pagination
  - Empty state with browse suggestions
- ✅ **Testing**: 18/18 backend tests passed, all frontend tests passed

### Jan 15, 2025 (Session 1) - Auth & Product Parity + Google Login + Autoship
- ✅ **CRITICAL BUG FIX: Customer Authentication Persistence**
  - **Root Cause**: `AuthContext.jsx` was calling `/api/auth/me` with email as query param instead of Bearer token in Authorization header
  - **Fix**: Updated `fetchUser()` to properly send JWT token in headers: `Authorization: Bearer ${token}`
  - **Fix**: Added `{"_id": 0}` projection in `get_current_user()` backend function to avoid MongoDB ObjectId serialization issues
  - Users now stay logged in after page refresh/navigation
- ✅ **CRITICAL BUG FIX: Product Detail Modal Crash**
  - **Root Cause**: `reviews` state declarations were incorrectly nested inside `fetchRelated` callback, causing `ReferenceError: reviews is not defined`
  - **Fix**: Moved `useState` hooks for reviews to component level (Line 136-140 in ProductCard.jsx)
  - Product modal now opens correctly with size/flavor selection, personalization fields, and reviews section
- ✅ **Google Login Integration (Emergent OAuth)**
  - Added "Continue with Google" button on Login page
  - Added "Sign up with Google" button on Register page
  - Backend endpoint `POST /api/auth/google/session` exchanges Emergent Auth session_id for user data
  - Automatically creates new user or updates existing user on Google login
  - User sessions stored in `user_sessions` collection with 7-day expiry
  - `AuthCallback.jsx` component handles OAuth redirect and session processing
- ✅ **Product Variant Parity Fixed**
  - Dynamic option extraction from `product.options` (Base, Flavour, Weight)
  - Fixed "Rag" → "Ragi" and "Oat" → "Oats" data issues
  - Admin product editor now has Options & Variants editor
- ✅ **Collections System Fixed**
  - Created 22 collections (Cakes, Breed Cakes, Treats, etc.)
  - Linked 263 products to collections
  - Fixed CollectionManager auth header issue
  - Collections tab now works in admin
- ✅ **My Pets Data Isolation Fixed**
  - Users only see their own pets
  - Added `/api/celebrations/my-upcoming` endpoint
- ✅ **AUTOSHIP FEATURE IMPLEMENTED**
  - **Product Page**: Autoship option with frequency selector (2/4/6 weeks)
  - **Savings Display**: 25% off 1st order, 40% off 4th-5th, 50% off 6th-7th
  - **Autoship Info Page** (`/autoship`): Full FAQ and benefits page
  - **My Account Tab**: Autoship section to manage subscriptions
  - **Admin Dashboard**: Full autoship management with stats, search, status control
  - **Backend APIs**: Create, pause, resume, cancel, skip, update subscriptions
  - **Discount Logic**: Automatic discount calculation based on order count
  - 53 products enabled for Autoship (treats, biscuits, jerky, nut-butters, desi-treats)

### Jan 14, 2025 (Session 2)
- ✅ **Discount Code at Checkout (P1)**
  - Added discount code input field in checkout sidebar
  - Validates codes via `POST /api/discount-codes/validate`
  - Shows applied discount in Order Summary with code name and amount
  - X button to remove applied discount
  - Available codes: COMEBACK10 (10% off, min ₹500), WELCOME15 (15% off, min ₹799), BIRTHDAY20 (20% off, min ₹999)
  - Case-insensitive input (comeback10 → COMEBACK10)
- ✅ **Loyalty Points at Checkout (P1)**
  - Fetches user's Pawsome Points when email is entered
  - Displays available points with "Worth up to ₹X in savings" message
  - Input field to enter points to redeem
  - "Use All" button to redeem all available points
  - Shows redeemed points in Order Summary
  - 1 point = ₹0.50, minimum 100 points to redeem
- ✅ **Combined Discounts**
  - Order total correctly calculates with both discount code AND loyalty points
  - WhatsApp order message includes discount/loyalty details
  - Order confirmation screen shows savings breakdown
- ✅ **Email Configuration Updated**
  - Changed sender email from `onboarding@resend.dev` to `woof@thedoggycompany.in`
- ✅ **Testing**: 100% pass rate (12/12 backend tests, all frontend tests passed)

### Jan 14, 2025 (Session 1)
- ✅ **CRITICAL FIX: Cart persistence bug** - Cart was emptying when navigating between pages
  - Root cause: Race condition - cart state initialized with `[]`, then useEffect would overwrite localStorage before loading
  - Solution: Initialize cart state synchronously from localStorage using lazy initializer with `useRef` to skip initial mount
- ✅ **Pet Soul Tab** - Added prominent "🐾 Pet Soul" button to main navbar with gradient pink/purple styling
  - Links to `/my-pets` page where users can manage their pet profiles
- ✅ **Admin Panel Overhaul - Shopify-like ProductManager**
  - Replaced basic product table with comprehensive ProductManager component
  - **Stats Cards**: Total Products, Active, No Image, Categories count
  - **Search & Filters**: Search by name/description, category filter, status filter, sort options
  - **View Modes**: Grid/List toggle with pagination (24 items per page)
  - **Edit Modal**: Full product editing with variant management (sizes/flavors with prices)
  - **Create Product**: New "Add New Product" button with complete creation form
  - **Actions**: Refresh, Sync from Shopify, Delete product
  - All CRUD operations working with real backend APIs
- ✅ **Pet Celebration Reminders (P1)**
  - Backend scheduler runs daily at 9:00 AM IST
  - Checks all pets for upcoming birthdays, gotcha days, and custom celebrations
  - Sends personalized email reminders at 7 days and 1 day before
  - Generates WhatsApp click-to-chat links for reminders
  - Admin endpoints: `/api/admin/celebrations/trigger-check`, `/api/admin/celebrations/reminders-log`
- ✅ **Abandoned Cart Recovery (P1)**
  - Cart snapshots automatically saved to backend on changes (debounced 2s)
  - Email capture on checkout page for recovery emails
  - Backend scheduler runs every 30 minutes to check abandoned carts
  - 3-stage email sequence: 1hr, 24hr, 72hr (with 10% discount on final)
  - Admin endpoints: `/api/admin/abandoned-carts`, `/api/admin/abandoned-carts/trigger-check`
- ✅ **Testing**: All features verified via testing agent (93% backend, 100% frontend)

### Jan 13, 2025 (Session 3)
- ✅ **Pet Profile System (Phase 1)**
  - Backend: Created models and REST APIs for full CRUD of pet profiles
  - Frontend: Built multi-step form (`PetProfile.jsx`) with pet details, personas, "soul" questions, celebration calendar
  - Multi-Pet Support: Created "My Pets" page (`MyPets.jsx`) for managing multiple pets
- ✅ **Checkout & Pricing Overhaul**
  - Variant Pricing: Frontend correctly displays different prices for product variants
  - Shipping Logic: ₹150 flat fee, free over ₹3000
  - WhatsApp Flow: Improved order confirmation with payment link messaging
- ✅ **CRITICAL FIX: Product modal overlay** - Modal was displaying inline instead of as popup overlay
  - Root cause: CSS `transform` on parent container created new stacking context, breaking `fixed` positioning
  - Solution: Used React Portal (`createPortal`) to render modal in `document.body`
- ✅ Fixed Hampers category page - now shows "Gift Hampers & Party Boxes 🎁" with 16 products
- ✅ Added "Gift Hampers" to navigation menu (under "More" dropdown)
- ✅ **Added Load More pagination** - Shows 20 products at a time with "Load More" button
- ✅ **CRITICAL: Cleaned up 164 mock products** with wrong data - now only real Shopify data
- ✅ Product variants and prices now match original thedoggybakery.com
- ✅ Fixed Insights page - "Read More" now opens full articles with complete content
- ✅ Home page now fetches featured products from API (not mock data)
- ✅ Pan India "Complete the Celebration" now shows pan-india compatible products
- ✅ **Improved product categorization** - Added comprehensive breed list (40 breed cakes now)
- ✅ Added admin endpoint `/api/admin/cleanup-mock-products` for database cleanup
- ✅ All 392 products correctly synced from Shopify

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

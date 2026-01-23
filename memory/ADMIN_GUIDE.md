# 🐕 The Doggy Company - Admin Panel Complete Guide
## "Dummy's Guide" to Every Admin Feature

**Last Updated**: January 23, 2026
**Version**: 1.0

---

# Table of Contents

1. [CORE TOOLS](#core-tools)
   - [Dashboard](#1-dashboard)
   - [Unified Inbox](#2-unified-inbox)
   - [Communications](#3-communications)
   - [Reminders](#4-reminders)
   - [Mira Memory](#5-mira-memory)
   - [Live MIS](#6-live-mis)
   - [Orders](#7-orders)
   - [Fulfilment](#8-fulfilment)
   - [Command Center](#9-command-center-)
   - [Pet Parent Directory](#10-pet-parent-directory)
   - [Membership](#11-membership)
   - [Customers](#12-customers)
   - [Pet Profiles](#13-pet-profiles)
   - [Celebrations](#14-celebrations)
   - [Service Desk](#15-service-desk)
   - [Agents](#16-agents)
   - [Loyalty](#17-loyalty-paw-rewards)
   - [Reports](#18-reports)
   - [Mira Chats](#19-mira-chats)
   - [Reviews](#20-reviews)

2. [PILLAR TOOLS](#pillar-tools)
   - [Seed All](#21-seed-all)
   - [Celebrate](#22-celebrate)
   - [Collections](#23-collections)
   - [Custom Cakes](#24-custom-cakes)
   - [Dine](#25-dine)
   - [Stay](#26-stay)
   - [Travel](#27-travel)
   - [Care](#28-care)
   - [Enjoy](#29-enjoy)
   - [Fit](#30-fit)
   - [Advisory](#31-advisory)
   - [Paperwork](#32-paperwork)
   - [Emergency](#33-emergency)
   - [Blog](#34-blog)
   - [Testimonials](#35-testimonials)
   - [FAQs](#36-faqs)
   - [About Page](#37-about-page)
   - [Page CMS](#38-page-cms)

3. [OPERATIONS](#operations)
   - [Product Tags](#39-product-tags)
   - [Breed Tags](#40-breed-tags)
   - [Discounts](#41-discounts)
   - [Abandoned](#42-abandoned-carts)
   - [Autoship](#43-autoship)
   - [Streaties](#44-streaties)
   - [Franchise](#45-franchise)

4. [CONFIG](#config)
   - [Pillars](#46-pillars-config)
   - [Campaigns](#47-campaigns)
   - [Partners](#48-partners)
   - [Pricing Hub](#49-pricing-hub)
   - [Data Migration](#50-data-migration)

---

# CORE TOOLS

## 1. Dashboard
**Tab ID**: `dashboard`
**File Location**: `/app/frontend/src/components/admin/DashboardTab.jsx`

### What It Contains
- Overview statistics (total members, orders, revenue)
- Quick action cards
- Recent activity feed
- Key metrics at a glance

### Purpose
Central hub showing business health and quick access to important actions.

### Data Sources
- `GET /api/admin/stats` - Overall statistics
- `GET /api/admin/recent-activity` - Recent events

### Rules & Logic
- Stats refresh every 60 seconds
- Shows today's orders, pending fulfillments
- Revenue calculated from completed orders only

### What Can Be Done
- View real-time business metrics
- Quick navigation to urgent items
- Export daily summary

### To Modify
- Edit `DashboardTab.jsx` for UI changes
- Edit `/app/backend/server.py` `get_admin_stats()` for stat calculations

---

## 2. Unified Inbox
**Tab ID**: `unified-inbox`
**File Location**: `/app/frontend/src/components/admin/UnifiedInbox.jsx`

### What It Contains
- All incoming messages from multiple channels
- WhatsApp messages
- Email inquiries
- Mira chat conversations
- Form submissions

### Purpose
Single place to see and respond to all customer communications.

### Data Sources
- `GET /api/admin/inbox` - All messages
- `GET /api/admin/inbox/whatsapp` - WhatsApp messages
- `GET /api/admin/inbox/email` - Email messages

### Rules & Logic
- Messages sorted by timestamp (newest first)
- Unread messages highlighted
- Auto-assigns to available agent if enabled

### What Can Be Done
- Reply to messages
- Mark as read/unread
- Assign to specific agent
- Archive conversations

### To Modify
- Edit `UnifiedInbox.jsx` for UI
- Add new channel in `/app/backend/inbox_routes.py`

---

## 3. Communications
**Tab ID**: `communications`
**File Location**: `/app/frontend/src/pages/Admin.jsx` (embedded)

### What It Contains
- Email templates
- WhatsApp templates
- SMS templates
- Notification settings

### Purpose
Manage all outbound communication templates and settings.

### Data Sources
- `GET /api/admin/email-templates`
- `GET /api/admin/whatsapp-templates`

### Rules & Logic
- Templates support variables: `{{name}}`, `{{pet_name}}`, `{{order_id}}`
- WhatsApp requires pre-approved templates
- Email uses Resend API

### What Can Be Done
- Create/edit email templates
- Preview messages with test data
- Send test messages
- Enable/disable notifications

### To Modify
- Templates stored in MongoDB `email_templates` collection
- Edit send logic in `/app/backend/server.py`

---

## 4. Reminders
**Tab ID**: `reminders`
**File Location**: `/app/frontend/src/pages/Admin.jsx`

### What It Contains
- Birthday reminders for pets
- Gotcha day reminders
- Vaccination due reminders
- Membership renewal reminders

### Purpose
Automated and manual reminder management for important dates.

### Data Sources
- `GET /api/admin/reminders/upcoming`
- `GET /api/celebrations/upcoming`

### Rules & Logic
- Reminders sent 7, 3, 1 days before event
- Birthday reminders include product suggestions
- Respects user notification preferences

### What Can Be Done
- View upcoming reminders
- Manually trigger reminder
- Edit reminder templates
- Set reminder timing

### To Modify
- Logic in `/app/backend/birthday_engine.py`
- Edit timing in `REMINDER_DAYS` constant

---

## 5. Mira Memory
**Tab ID**: `mira-memory`
**File Location**: `/app/frontend/src/components/admin/MiraMemory.jsx`

### What It Contains
- All memories Mira has stored about customers
- Preferences, allergies, past interactions
- Pet Soul™ insights
- Conversation history

### Purpose
View and manage what Mira "remembers" about each customer for personalization.

### Data Sources
- `GET /api/admin/mira-memories`
- MongoDB collection: `mira_memories`

### Rules & Logic
- Memories auto-extracted from conversations
- Categorized: preferences, restrictions, favorites
- Privacy: members can request memory deletion

### What Can Be Done
- View all memories per customer
- Delete specific memories
- Export memory data
- Search across memories

### To Modify
- Memory extraction in `/app/backend/mira_routes.py`
- Edit categories in `MEMORY_CATEGORIES`

---

## 6. Live MIS
**Tab ID**: `live-mis`
**File Location**: `/app/frontend/src/components/admin/LiveMIS.jsx`

### What It Contains
- Real-time Management Information System
- Live order tracking
- Revenue by pillar
- Conversion funnels
- Agent performance

### Purpose
Live business analytics and operational monitoring.

### Data Sources
- `GET /api/admin/mis/live`
- `GET /api/admin/mis/revenue-by-pillar`
- `GET /api/admin/mis/conversion`

### Rules & Logic
- Updates every 30 seconds
- Revenue in INR
- Conversion = orders / visitors

### What Can Be Done
- View real-time metrics
- Filter by date range
- Export reports
- Set alerts

### To Modify
- Edit `/app/backend/admin_routes.py` for calculations
- Add new metrics in `get_mis_data()`

---

## 7. Orders
**Tab ID**: `orders`
**File Location**: `/app/frontend/src/components/admin/OrdersTab.jsx`

### What It Contains
- All orders (pending, processing, fulfilled, cancelled)
- Order details with line items
- Customer info
- Payment status
- Delivery tracking

### Purpose
Manage the complete order lifecycle.

### Data Sources
- `GET /api/admin/orders` - All orders
- `GET /api/admin/orders/{order_id}` - Single order
- MongoDB collection: `orders`

### Rules & Logic
- Order statuses: `pending` → `processing` → `fulfilled` → `delivered`
- Auto-notification on status change
- Payment via Razorpay (test mode)
- Creates Command Center ticket on new order

### What Can Be Done
- View order details
- Update order status
- Add tracking info
- Issue refunds
- Print invoice
- Contact customer

### To Modify
- Status flow in `/app/backend/server.py` `update_order_status()`
- Add new status in `ORDER_STATUSES`

---

## 8. Fulfilment
**Tab ID**: `fulfilment`
**File Location**: `/app/frontend/src/pages/Admin.jsx`

### What It Contains
- Orders ready for fulfillment
- Packing lists
- Shipping labels
- Delivery partner assignment

### Purpose
Warehouse and logistics management.

### Data Sources
- `GET /api/admin/orders?status=processing`
- `GET /api/admin/fulfillment/queue`

### Rules & Logic
- Only `processing` orders shown
- Priority: same-day > next-day > standard
- Auto-generates packing slip

### What Can Be Done
- Mark as packed
- Generate shipping label
- Assign delivery partner
- Print packing list
- Bulk fulfill

### To Modify
- Edit fulfillment logic in `/app/backend/server.py`

---

## 9. Command Center ⭐
**Tab ID**: `command-center`
**File Location**: `/app/frontend/src/components/admin/ConciergeCommandCenter.jsx`
**Backend**: `/app/backend/concierge_routes.py`

### What It Contains
- **Unified Queue**: ALL tickets from all sources in one place
- **Real-time Event Stream**: Live business activity feed
- **360° Member Profile**: Complete customer view (clickable)
- **Mira's Intelligence**: AI-powered insights per ticket
- **Omni-Channel Reply**: Respond via Mira, Email, WhatsApp

### Purpose
THE central hub for concierge operations - the "All-Seeing Eye" of the business.

### Data Sources
- `GET /api/concierge/queue` - Main ticket queue
- `GET /api/concierge/item/{ticket_id}` - Ticket details with member snapshot
- `GET /api/concierge/event-stream` - Live activity feed
- `GET /api/concierge/member-profile/{email}` - Full 360° profile

### Ticket Sources
1. **Mira Requests** (`service_desk_tickets`) - AI concierge requests
2. **Manual Tickets** (`tickets`) - Staff-created tickets
3. **Orders** (`orders`) - Pending/processing orders
4. **Stay Bookings** (`stay_requests`) - Boarding/hotel requests
5. **Travel Requests** (`travel_requests`)
6. **Care Requests** (`care_requests`)
7. **Celebrations** (`celebrations`) - Upcoming birthdays

### Rules & Logic
- **SLA Timers**: 
  - Urgent: 2 hours
  - High: 4 hours
  - Medium: 24 hours
  - Low: 48 hours
- **Priority Score**: Calculated based on SLA, membership tier, order value
- **Auto-ticket Creation**: New orders, memberships, Pet Soul updates auto-create tickets
- **Pillar Filtering**: Filter by Celebrate, Dine, Stay, Travel, Care, etc.

### What Can Be Done
- View all tickets from all sources
- Click member to see full 360° profile
- See pet info with Pet Pass Numbers
- Claim/assign tickets
- Resolve with Mira/Email/WhatsApp
- Bulk actions (assign, close, escalate)
- Export to CSV
- Create manual tickets

### Key Features
| Feature | Description |
|---------|-------------|
| Member Snapshot | Click to open 360° profile in new tab |
| Pet Pass Display | Shows TDC-XXXXXX for each pet |
| SLA Timer | Real-time countdown, red when breached |
| Mira Intelligence | Past orders, memories, Pet Soul insights |
| Generate AI Draft | Auto-generate response using GPT |
| Event Stream | Slide-out panel with live activity |

### To Modify
- UI: Edit `ConciergeCommandCenter.jsx`
- Queue logic: Edit `concierge_routes.py` → `get_command_center_queue()`
- Add new source: Add to `get_command_center_queue()` aggregation
- SLA times: Edit `SLA_HOURS` constant
- Priority calc: Edit `calculate_priority_score()`

---

## 10. Pet Parent Directory
**Tab ID**: `member-directory`
**File Location**: `/app/frontend/src/components/admin/MemberDirectory.jsx`
**Backend**: `/app/backend/concierge_routes.py`

### What It Contains
- **Complete Member List**: All registered pet parents
- **360° Profile View**: Full customer profile with tabs
- **Pet Soul Journey**: Pet personality insights with scores
- **Tabs**: Overview, Tickets, Orders, Paw Rewards, Health Vault, Pet Soul Q&A

### Purpose
Comprehensive CRM view of every customer - like Zoho/Salesforce but pet-centric.

### Data Sources
- `GET /api/admin/members/directory` - Member list
- `GET /api/concierge/member-profile/{email}` - Full 360° profile

### Profile Tabs
1. **Overview**: Contact info, membership, quick stats
2. **Tickets**: All support tickets for this member
3. **Orders**: Complete order history
4. **Paw Rewards**: Loyalty points earned/redeemed
5. **Health Vault**: Pet health records (placeholder)
6. **Pet Soul Q&A**: All Pet Soul questionnaire answers

### Rules & Logic
- Members can have multiple pets
- Pet Soul Score calculated from answered questions
- Filters: status, source, tier, city
- Search by name, email, or Pet Pass Number

### What Can Be Done
- View complete customer profile
- See all pets with Pet Pass Numbers
- Review ticket/order history
- Check loyalty balance
- Edit member details
- Add notes

### To Modify
- UI: Edit `MemberDirectory.jsx`
- Profile aggregation: Edit `get_member_profile()` in `concierge_routes.py`

---

## 11. Membership
**Tab ID**: `membership`
**File Location**: `/app/frontend/src/components/admin/MembershipManager.jsx`
**Backend**: `/app/backend/membership_routes.py`

### What It Contains
- Membership tier management
- Pricing configuration
- Benefits per tier
- Upgrade/downgrade rules

### Purpose
Configure and manage membership plans.

### Tiers
| Tier | Price | Key Benefits |
|------|-------|--------------|
| Free | ₹0 | Basic access, limited Mira chats |
| Monthly | ₹99/mo | Full Mira access, 5% rewards |
| Annual | ₹999/yr | Priority support, 10% rewards |
| Family | ₹1,499/yr | Multiple pets, 15% rewards |

### Rules & Logic
- Free tier: 3 Mira chats/day
- Paid tiers: Unlimited Mira
- Auto-renewal via Razorpay
- Grace period: 7 days after expiry

### To Modify
- Pricing: Edit `MEMBERSHIP_TIERS` in `membership_routes.py`
- Benefits: Edit tier config

---

## 12. Customers
**Tab ID**: `members`
**File Location**: `/app/frontend/src/components/admin/MembersTab.jsx`

### What It Contains
- Basic customer list (legacy view)
- Quick stats
- Tier distribution

### Purpose
Simple customer management (use Pet Parent Directory for full view).

### Note
This is a simpler view. For full 360° profiles, use **Pet Parent Directory**.

---

## 13. Pet Profiles
**Tab ID**: `pet-profiles`
**File Location**: `/app/frontend/src/pages/Admin.jsx`

### What It Contains
- All registered pets
- Pet details (name, breed, gender, DOB)
- **Pet Pass Number** (TDC-XXXXXX)
- Pet parent info
- Pet Soul status

### Purpose
Manage pet database and track Pet Soul completion.

### Data Sources
- `GET /api/admin/pets` - All pets
- MongoDB collection: `pets`

### Pet Pass Number
- Format: `TDC-XXXXXX` (6 alphanumeric)
- Auto-generated on pet creation
- Unique identifier for each pet
- Searchable across system

### Rules & Logic
- Each pet belongs to one owner
- Pet Pass auto-generated, never changes
- Pet Soul score = % of questions answered
- Allergies flagged prominently

### What Can Be Done
- View all pets
- Edit pet details
- See Pet Pass Number
- Check Pet Soul completion
- View pet's owner

### To Modify
- Pet Pass generation: `generate_pet_pass_number()` in `server.py`
- Pet schema: Edit pet creation endpoints

---

## 14. Celebrations
**Tab ID**: `celebrations`
**File Location**: `/app/frontend/src/pages/Admin.jsx`

### What It Contains
- Upcoming pet birthdays
- Gotcha day anniversaries
- Custom celebrations
- Reminder schedule

### Purpose
Track and celebrate pet milestones.

### Data Sources
- `GET /api/celebrations/upcoming`
- `GET /api/admin/celebrations`

### Rules & Logic
- Birthdays: 7, 3, 1 day reminders
- Auto-creates Command Center ticket
- Suggests celebration products

### What Can Be Done
- View upcoming celebrations
- Send early wishes
- Assign celebration orders
- Add custom celebrations

---

## 15. Service Desk
**Tab ID**: `service-desk`
**File Location**: `/app/frontend/src/components/admin/ServiceDesk.jsx`

### What It Contains
- Mira AI action requests
- Customer inquiries requiring human action
- Ticket management

### Purpose
Handle requests that Mira escalated to human agents.

### Note
**Most functionality moved to Command Center.** Service Desk now focuses only on Mira escalations.

### Data Sources
- `GET /api/service-desk/tickets`
- MongoDB collection: `service_desk_tickets`

---

## 16. Agents
**Tab ID**: `agents`
**File Location**: `/app/frontend/src/pages/Admin.jsx`

### What It Contains
- Concierge agent list
- Agent performance metrics
- Availability status
- Ticket assignments

### Purpose
Manage concierge team.

### Data Sources
- `GET /api/concierge/agents`
- MongoDB collection: `concierge_agents`

### Rules & Logic
- Agents can be active/inactive
- Round-robin assignment optional
- Performance = tickets resolved / SLA breaches

---

## 17. Loyalty (Paw Rewards)
**Tab ID**: `loyalty`
**File Location**: `/app/frontend/src/pages/Admin.jsx`
**Backend**: `/app/backend/paw_rewards_routes.py`

### What It Contains
- Paw Rewards configuration
- Points earning rules
- Redemption catalog
- Member balances

### Purpose
Manage loyalty program.

### Earning Rules
| Action | Points |
|--------|--------|
| Order ₹100 | 10 points |
| Birthday order | 2x points |
| Referral | 100 points |
| Pet Soul completion | 50 points |

### Redemption
- 100 points = ₹10 discount
- Minimum redemption: 50 points

### To Modify
- Edit `PAW_REWARDS_CONFIG` in `paw_rewards_routes.py`

---

## 18. Reports
**Tab ID**: `reports`
**File Location**: `/app/frontend/src/pages/Admin.jsx`

### What It Contains
- Sales reports
- Member reports
- Order reports
- Custom date range analysis

### Purpose
Business analytics and reporting.

### Available Reports
- Daily/Weekly/Monthly sales
- Revenue by pillar
- Top products
- Member acquisition
- Repeat purchase rate

---

## 19. Mira Chats
**Tab ID**: `mira-chats`
**File Location**: `/app/frontend/src/pages/Admin.jsx`

### What It Contains
- All Mira AI conversations
- Chat history per user
- Action detection log

### Purpose
Review and monitor Mira conversations.

### Rules & Logic
- Mira detects actions: book, order, inquire
- Actions auto-create Service Desk tickets
- Chat history retained for 90 days

---

## 20. Reviews
**Tab ID**: `reviews`
**File Location**: `/app/frontend/src/pages/Admin.jsx`

### What It Contains
- Customer reviews
- Product ratings
- Review moderation

### Purpose
Manage customer feedback.

---

# PILLAR TOOLS

## 21. Seed All
**Tab ID**: N/A (button)
**Purpose**: One-click seeding of sample data for all pillars.

### What It Does
- Creates sample products per pillar
- Seeds test data for development
- Populates empty collections

### API
`POST /api/admin/seed-all`

---

## 21b. Seed Production Data 🆕
**Tab ID**: N/A (button - purple gradient)
**Purpose**: One-click seeding of essential data for production environments.

### What It Does
- **Seeds 8 FAQs** across categories: Delivery, Products, Orders, Membership, Payment, Pet Soul, Mira AI
- **Seeds 4 Collections**: Valentine's Day, Birthday Celebration, Healthy Bites, Diwali Special
- **Seeds 5 Sample Tickets** for Command Center testing (editable, marked with `is_sample: true`)

### When To Use
- **After deploying to a new environment** (production, staging)
- **When database is empty** (FAQs/Collections not showing)
- **Testing Command Center** with realistic sample tickets

### API
`POST /api/admin/seed-production-data`

### Response Example
```json
{
  "success": true,
  "message": "Production data seeded successfully!",
  "results": {
    "faqs": 8,
    "collections": 4,
    "tickets": 5
  },
  "note": "This data is editable - feel free to modify it as needed"
}
```

### Important Notes
- Uses **UPSERT** - safe to run multiple times without duplicates
- All seeded data is **fully editable** via admin panel
- Sample tickets are marked with `is_sample: true` for identification
- Does NOT overwrite existing data

### Location in Admin Panel
- Found under **PILLAR TOOLS** section
- Purple/pink gradient button labeled "Seed Production"

---

## 22. Celebrate
**Tab ID**: `celebrate`
**File Location**: `/app/frontend/src/components/admin/CelebrateManager.jsx`

### What It Contains
- Celebration packages
- Cake designs
- Party supplies
- Photoshoot packages

### Purpose
Manage celebration pillar products and services.

### Product Types
- Birthday cakes
- Party boxes
- Customizable treats
- Event packages

---

## 23. Collections
**Tab ID**: `collections`
**File Location**: `/app/frontend/src/components/admin/CollectionManager.jsx`
**Backend**: `/app/backend/collection_routes.py`

### What It Contains
- Curated product collections
- Campaign pages (Valentine's, Diwali, etc.)
- Custom sections with products

### Purpose
Create marketing campaigns and themed collections.

### Current Collections
- Valentine's Day 2026 (slug: `valentines-2025`)

### Collection Structure
```json
{
  "name": "Valentine's Day 2026",
  "slug": "valentines-2025",
  "sections": [
    {
      "title": "Valentine's Specials",
      "layout": "featured|grid|carousel",
      "items": [product_ids]
    }
  ],
  "visibility": {
    "is_published": true,
    "start_date": null,
    "end_date": "2026-02-15"
  }
}
```

### Rules & Logic
- Can show in navbar if `display_locations.show_in_navbar: true`
- Auto-expires based on `end_date`
- Items enriched with real product data

### API Endpoints
- Public: `GET /api/campaign/collections`
- Admin: `GET /api/admin/enhanced-collections`

---

## 24. Custom Cakes
**Tab ID**: `custom-cakes`

### What It Contains
- Custom cake order requests
- Design specifications
- Pricing calculator
- Order management

---

## 25. Dine
**Tab ID**: `dine`
**File Location**: `/app/frontend/src/components/admin/DineManager.jsx`
**Backend**: `/app/backend/dine_routes.py`

### What It Contains
- Pet-friendly restaurant database
- Reservation system
- Restaurant partnerships
- Dine requests

### Purpose
Manage pet-friendly dining pillar.

### Rules & Logic
- Restaurants must be verified pet-friendly
- Reservations include pet count
- Partner restaurants get priority listing

---

## 26. Stay
**Tab ID**: `stay`
**File Location**: `/app/frontend/src/components/admin/StayManager.jsx`
**Backend**: `/app/backend/stay_routes.py`

### What It Contains
- Pet hotels
- Home boarding hosts
- Day care centers
- Booking management

### Purpose
Manage pet accommodation services.

### Booking Flow
1. Request submitted
2. Availability checked
3. Booking confirmed
4. Pre-stay checklist
5. Check-in
6. Stay updates
7. Check-out

---

## 27. Travel
**Tab ID**: `travel`
**File Location**: `/app/frontend/src/pages/TravelPage.jsx`
**Backend**: `/app/backend/travel_routes.py`

### What It Contains
- Pet travel services
- Airline coordination
- Pet taxi booking
- Travel documentation

### Purpose
Manage pet travel services.

### Travel Types
- Cab/Road Travel
- Train/Bus
- Domestic Flight
- International (Pet Relocation)

### Rules
- Page accessible without login
- Booking requires login
- Creates Command Center ticket

---

## 28. Care
**Tab ID**: `care`
**File Location**: `/app/frontend/src/pages/CarePage.jsx`
**Backend**: `/app/backend/care_routes.py`

### What It Contains
- Vet coordination
- Grooming services
- Medication reminders
- Health Vault (upcoming)

### Purpose
Manage pet healthcare services.

### Service Types
- Vet visit coordination
- Grooming appointment
- Vaccination reminder
- Health record management

### Rules
- Page accessible without login
- Service booking requires login

---

## 29-33. Other Pillars
Similar structure for:
- **Enjoy**: Pet events & experiences
- **Fit**: Pet fitness & wellness
- **Advisory**: Expert consultations
- **Paperwork**: Pet documentation
- **Emergency**: Emergency services

---

## 34. Blog
**Tab ID**: `blog`

### What It Contains
- Blog posts management
- Categories
- SEO settings

---

## 35. Testimonials
**Tab ID**: `testimonials`

### What It Contains
- Customer testimonials
- Photo/video reviews
- Display settings

---

## 36. FAQs
**Tab ID**: `faqs`
**File Location**: `/app/frontend/src/pages/Admin.jsx`

### What It Contains
- FAQ management
- Categories (multi-pillar)
- Featured FAQs

### Purpose
Manage help center content.

### Categories
- Concierge & Mira AI
- Membership & Club
- Celebrate
- Dine
- Stay
- Care
- Orders & Delivery
- Payments & Refunds
- Emergency Support

### API
- `GET /api/admin/faqs`
- `POST /api/admin/faqs`
- `PUT /api/admin/faqs/{id}`
- `DELETE /api/admin/faqs/{id}`

---

## 37. About Page
**Tab ID**: `about`

### What It Contains
- About page content editor
- Team members
- Company story

---

## 38. Page CMS
**Tab ID**: `page-cms`

### What It Contains
- Static page management
- Landing pages
- Custom content pages

---

# OPERATIONS

## 39. Product Tags
**Tab ID**: `product-tags`
**File Location**: `/app/frontend/src/components/admin/ProductTagsManager.jsx`

### What It Contains
- Product categorization tags
- Tag groups
- Auto-tagging rules

### Purpose
Organize products for filtering and search.

---

## 40. Breed Tags
**Tab ID**: `breed-tags`

### What It Contains
- Dog breed database
- Breed-specific product recommendations
- Size categories

---

## 41. Discounts
**Tab ID**: `discounts`

### What It Contains
- Coupon codes
- Automatic discounts
- Bundle deals
- Multi-pet discounts

---

## 42. Abandoned Carts
**Tab ID**: `abandoned`

### What It Contains
- Abandoned cart tracking
- Recovery emails
- Conversion analytics

---

## 43. Autoship
**Tab ID**: `autoship`

### What It Contains
- Subscription management
- Recurring order setup
- Schedule configuration

---

## 44. Streaties
**Tab ID**: `streaties`

### What It Contains
- Street dog/stray programs
- Donation campaigns
- NGO partnerships

---

## 45. Franchise
**Tab ID**: `franchise`

### What It Contains
- Franchise applications
- Partner locations
- Territory management

---

# CONFIG

## 46. Pillars Config
**Tab ID**: `pillars`

### What It Contains
- Pillar enable/disable
- Pillar ordering
- Pillar icons & colors

---

## 47. Campaigns
**Tab ID**: `campaigns`

### What It Contains
- Marketing campaign management
- Scheduled promotions
- Campaign analytics

---

## 48. Partners
**Tab ID**: `partners`

### What It Contains
- B2B partner management
- Partner tiers
- Commission settings

---

## 49. Pricing Hub
**Tab ID**: `pricing-hub`

### What It Contains
- Global pricing rules
- City-based pricing
- Dynamic pricing config

---

## 50. Data Migration
**Tab ID**: `data-migration`

### What It Contains
- Import/export tools
- Shopify sync
- CSV import
- Data cleanup

### Shopify Sync
- Syncs products from Shopify store
- **Known Issue**: Some products import as "Untitled" (workaround in place)

---

# Quick Reference

## Key Files
| Area | Frontend | Backend |
|------|----------|---------|
| Command Center | `ConciergeCommandCenter.jsx` | `concierge_routes.py` |
| Member Directory | `MemberDirectory.jsx` | `concierge_routes.py` |
| Orders | `OrdersTab.jsx` | `server.py` |
| Membership | `MembershipManager.jsx` | `membership_routes.py` |
| Collections | `CollectionManager.jsx` | `collection_routes.py` |
| Stay | `StayManager.jsx` | `stay_routes.py` |
| Dine | `DineManager.jsx` | `dine_routes.py` |

## Key Collections (MongoDB)
| Collection | Purpose |
|------------|---------|
| `users` | Member/customer data |
| `pets` | Pet profiles with Pet Pass |
| `orders` | All orders |
| `tickets` | Manual tickets |
| `service_desk_tickets` | Mira action requests |
| `mira_memories` | AI memory storage |
| `paw_rewards_earned` | Loyalty points |
| `enhanced_collections` | Campaign collections |
| `faqs` | Help center content |

## Important Constants
```javascript
// SLA Hours (Command Center)
SLA_HOURS = { urgent: 2, high: 4, medium: 24, low: 48 }

// Pet Pass Format
PET_PASS_FORMAT = "TDC-XXXXXX"

// Membership Tiers
TIERS = ['free', 'monthly', 'annual', 'family']
```

---

# Change Log

## January 23, 2026
- Added Pet Pass Number system (TDC-XXXXXX)
- Made Command Center member snapshot clickable
- Fixed ticket search to include all member fields
- Restored Travel & Care pages without ProtectedRoute
- Restored FAQs and Valentine's Collection

---

*This document should be updated whenever significant changes are made to the admin panel.*

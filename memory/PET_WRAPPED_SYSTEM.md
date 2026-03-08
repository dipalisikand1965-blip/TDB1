# Pet Wrapped - System Documentation
*Last Updated: March 8, 2026*

## Overview
Pet Wrapped is the viral acquisition engine - "Spotify Wrapped for Pets". It generates beautiful, shareable summaries of a pet's journey on the platform.

---

## Wrapped Types

| Type | Trigger | Status |
|------|---------|--------|
| **Welcome Wrapped** | Soul Profile completion (≥10%) | ✅ LIVE |
| **Birthday Wrapped** | Pet's birthday (7 days before) | ✅ AUTOMATED (cron daily 9 AM IST) |
| **Annual Wrapped** | December/Year-end | ✅ AUTOMATED (Dec 10, 10 AM IST) |
| **Gotcha Day** | Adoption anniversary | ✅ LIVE (on request) |
| **Rainbow Bridge** | Pet memorial | ✅ LIVE (on request) |

---

## Delivery Channels

### ✅ ALL WORKING (March 8, 2026)

| Channel | Integration | Status |
|---------|-------------|--------|
| **In-App Modal** | WelcomeWrappedModal.jsx | ✅ Immediate |
| **Email** | Resend API | ✅ Sending from woof@thedoggycompany.com |
| **WhatsApp** | Gupshup API | ✅ WORKING (Fixed API endpoint + app name) |
| **Instagram Stories** | Story card + sharing guide | ✅ NEW - Added March 8 |
| **Service Desk** | service_desk_tickets collection | ✅ Auto-ticket created |
| **Admin Notification** | admin_notifications collection | ✅ Real-time alert |
| **Member Inbox** | member_notifications collection | ✅ Action link to Pet Home |

---

## API Endpoints

### Generate Wrapped Data
```
GET /api/wrapped/generate/{pet_id}
```
Returns JSON with all card data for rendering.

### Download HTML
```
GET /api/wrapped/download/{pet_id}
```
Returns complete HTML file for download/sharing.

### Trigger Welcome Wrapped
```
POST /api/wrapped/trigger-welcome/{pet_id}
```
Triggers all 3 delivery channels + universal service flow:
- In-App Modal (immediate)
- WhatsApp (background) 
- Email (background)
- Service Desk Ticket (tracking)
- Admin Notification (real-time)
- Member Inbox (action link)

### Trigger Birthday Wrapped
```
POST /api/wrapped/trigger-birthday/{pet_id}
```
Called by automated cron job for birthday deliveries.

### Trigger Annual Wrapped
```
POST /api/wrapped/trigger-annual/{pet_id}
```
Called by December batch job for year-end Wrapped.

### Instagram Story Card
```
GET /api/wrapped/instagram-story/{pet_id}
```
Returns optimized 1080x1920 HTML card for Instagram Stories.

### Share Assets
```
GET /api/wrapped/share-assets/{pet_id}
```
Returns all shareable URLs and instructions for different platforms.

### Log Share
```
POST /api/wrapped/log-share/{pet_id}?platform=instagram
```
Tracks viral coefficient by logging share actions.

---

## Automated Triggers (NEW)

### Birthday Wrapped (Daily Cron)
- **Schedule:** Daily at 9 AM IST (3:30 AM UTC)
- **Logic:** Finds pets with birthdays in next 7 days
- **Delivery:** WhatsApp + Email
- **Deduplication:** Won't send twice in same year

### Annual Wrapped (December Batch)
- **Schedule:** December 10th at 10 AM IST
- **Logic:** Generates year-end Wrapped for ALL active pets
- **Delivery:** WhatsApp + Email
- **Window:** Only runs Dec 1-20

---

## Universal Service Flow Integration

When Pet Wrapped triggers, it creates:

1. **Service Desk Ticket**
   - Type: `pet_wrapped`
   - Status: `completed`
   - Auto-generated tracking

2. **Admin Notification**
   - Real-time alert in admin panel
   - Shows pet name, soul score, channels used

3. **Member Inbox**
   - Notification in user's inbox
   - "View Pet Wrapped" action button
   - Links to Pet Home page

---

## Instagram Stories Integration (NEW)

### How It Works
1. User clicks "IG Story" button in the Welcome Wrapped modal
2. Opens Instagram-optimized story card (1080x1920) in new tab
3. Shows step-by-step guide for sharing to Instagram Story
4. Share action is logged for viral tracking

### Story Card Features
- 1080x1920 resolution (perfect for Instagram)
- Pet avatar, name, breed
- Soul Score prominently displayed
- Mira chat count stats
- Beautiful gradient background
- "CREATE YOURS FREE →" CTA

---

## Soul Profile → Pet Wrapped Flow

```
User completes Soul Profile question
        ↓
SoulBuilder.jsx detects score ≥ 10%
        ↓
WelcomeWrappedModal opens
        ↓
Modal calls: POST /api/wrapped/trigger-welcome/{pet_id}
        ↓
Backend triggers ALL channels simultaneously:
  ├── Returns data for Modal (immediate)
  ├── Sends WhatsApp via Gupshup (background)
  ├── Sends Email via Resend (background)
  ├── Creates Service Desk ticket
  ├── Creates Admin notification
  └── Creates Member inbox notification
        ↓
User can share via:
  ├── Native share (mobile)
  ├── WhatsApp
  ├── Instagram Stories (NEW)
  └── Download card
```

---

## Environment Variables Required

```env
# Resend (Email)
RESEND_API_KEY=re_XXXXX

# Gupshup (WhatsApp) - NEEDS VALID KEY
GUPSHUP_API_KEY=sk_XXXXX
GUPSHUP_APP_NAME=The Doggy Company
GUPSHUP_SOURCE_NUMBER=918971702582

# MongoDB
MONGO_URL=mongodb+srv://...
DB_NAME=pet-os-live-test_database
```

---

## Database Collections

| Collection | Purpose |
|------------|---------|
| `wrapped_deliveries` | Log of all wrapped triggers |
| `wrapped_shares` | Share tracking (viral coefficient) |
| `pet_wrapped_memories` | AI-generated pet memories |
| `service_desk_tickets` | Tracking tickets |
| `admin_notifications` | Admin alerts |
| `member_notifications` | User inbox items |

---

## Files Reference

### Backend
```
/app/backend/routes/wrapped/
├── __init__.py           # Route package (includes cron imports)
├── soul_history.py       # Soul score tracking over time
├── generate.py           # Main 6-card generation
├── ai_memory.py          # Mira's AI-generated memory
├── share.py              # Single shareable card
├── welcome.py            # Welcome wrapped (instant share)
├── delivery.py           # WhatsApp/Email/Modal delivery + birthday/annual triggers
├── instagram.py          # Instagram Stories share endpoints
└── cron_triggers.py      # Automated birthday & annual batch jobs
```

### Frontend
```
/app/frontend/src/components/wrapped/
├── WrappedCards.jsx          # All 6 card React components
└── WelcomeWrappedModal.jsx   # Celebration popup with Instagram share
```

---

## Scheduler Jobs (server.py)

| Job ID | Schedule | Function |
|--------|----------|----------|
| `pet_wrapped_birthday` | Daily 9 AM IST | `check_birthday_wrappeds()` |
| `pet_wrapped_annual` | Dec 10, 10 AM IST | `generate_annual_wrappeds()` |

---

*Pet Wrapped is the viral growth engine - every share creates a potential new customer.*

# Pet Wrapped - System Documentation
*Last Updated: March 8, 2026*

## Overview
Pet Wrapped is the viral acquisition engine - "Spotify Wrapped for Pets". It generates beautiful, shareable summaries of a pet's journey on the platform.

---

## Wrapped Types

| Type | Trigger | Status |
|------|---------|--------|
| **Welcome Wrapped** | Soul Profile completion (≥10%) | ✅ LIVE |
| **Birthday Wrapped** | Pet's birthday | ⏳ Manual (cron needed) |
| **Annual Wrapped** | December/Year-end | ⏳ Manual (batch needed) |
| **Gotcha Day** | Adoption anniversary | ⏳ Manual |
| **Rainbow Bridge** | Pet memorial | ✅ LIVE (on request) |

---

## Delivery Channels

### ✅ ALL WORKING (March 8, 2026)

| Channel | Integration | Status |
|---------|-------------|--------|
| **In-App Modal** | WelcomeWrappedModal.jsx | ✅ Immediate |
| **Email** | Resend API | ✅ Sending from woof@thedoggycompany.com |
| **WhatsApp** | Gupshup API | ✅ WORKING (Fixed API endpoint + app name) |
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

## NOT YET IMPLEMENTED

### 1. Automated Birthday Triggers
- **Requirement**: Cron job to check pet birthdays daily
- **Action**: Auto-trigger Birthday Wrapped 7 days before
- **Files needed**: `/app/backend/cron/birthday_wrapped.py`

### 2. December Annual Wrapped (Batch)
- **Requirement**: Scheduled batch job for year-end
- **Action**: Generate Annual Wrapped for ALL active pets
- **Timing**: December 1-15
- **Files needed**: `/app/backend/cron/annual_wrapped.py`

### 3. Instagram Stories Direct Share
- **Requirement**: Meta/Instagram Graph API integration
- **Action**: One-click share to IG Stories
- **Files needed**: `/app/backend/routes/wrapped/instagram.py`

---

## Database Collections

| Collection | Purpose |
|------------|---------|
| `wrapped_deliveries` | Log of all wrapped triggers |
| `pet_wrapped_memories` | AI-generated pet memories |
| `service_desk_tickets` | Tracking tickets |
| `admin_notifications` | Admin alerts |
| `member_notifications` | User inbox items |

---

*Pet Wrapped is the viral growth engine - every share creates a potential new customer.*

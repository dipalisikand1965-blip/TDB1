# The Doggy Company - Pet Pass Onboarding Flow

## FRONTEND ONBOARDING FLOW (4 Steps)

### Step 1: Pet Parent Details (CRM Capture)
- Pet Parent Name *
- Email Address *
- Address * (House/Flat No., Street, Landmark)
- City * (Autocomplete from Indian cities)
- Pincode *
- Create Password *
- Confirm Password *
- Phone Number *
- WhatsApp Number * (with "Same as phone" option)
- Preferred Contact Method * (WhatsApp / Phone Call / Email)
- Notification Preferences:
  - 📦 Order & Delivery Updates
  - 💊 Pet Care Reminders
  - 🎁 Offers & Promotions
  - 📰 Monthly Newsletter
  - 💬 Soul Whispers (Weekly WhatsApp - Recommended)
- Terms & Conditions checkbox *
- Privacy Policy checkbox *

### Step 2: Pet Details (Multi-Dog Support)
- Dog's Name *
- Breed * (Autocomplete)
- Gender (Male/Female)
- Birth Date
- Gotcha Day
- Weight (Optional)
- Neutered/Spayed? (Yes/No/Not sure)
- Photo upload
- **"Add Another Dog" always visible** - supporting 1-15+ pets

### Step 3: Celebrations Selection
For each pet, select which celebrations to track:
- 🎂 Birthday
- 💝 Gotcha Day
- 💉 Vaccination Day
- ✂️ Grooming Day
- 🎓 Training Milestones
- 🏠 Adoption Anniversary
- 🎉 Festival Celebrations
- 🌟 First Year Milestones

### Step 4: Review & Pay
- Summary of Parent details
- Summary of Pet(s) details
- Selected celebrations
- Pricing breakdown:
  - Base plan price
  - Additional pets pricing
  - GST (18%)
  - Total
- Payment via Razorpay

---

## MEMBERSHIP PLANS

| Plan | Price | Validity | Payment | Auto-Action |
|------|-------|----------|---------|-------------|
| 7-Day Explorer | FREE | 7 days | None | Auto-deactivate after 7 days |
| Pet Pass Trial | ₹499 + GST | 30 days | Razorpay | Reminder at day 25, deactivate if not renewed |
| Pet Pass Founder | ₹4,999 + GST | 365 days | Razorpay | Reminder at day 350, deactivate if not renewed |

**Note:** One membership covers ALL dogs in the family (no extra charge per dog)

---

## BACKEND FLOW

### On Successful Onboarding:

```
User Completes Onboarding
        │
        ▼
┌─────────────────────────────────────────┐
│ 1. CREATE USER ACCOUNT                  │
│    - Store parent details               │
│    - Create user in auth system         │
│    - Store notification preferences     │
│    - Store preferred contact method     │
└─────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────┐
│ 2. CREATE PET PROFILE(S)                │
│    - Create pet records for each dog    │
│    - Link to user account               │
│    - Store celebrations preferences     │
│    - Upload photos if provided          │
└─────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────┐
│ 3. CREATE MEMBERSHIP RECORD             │
│    - Plan type (explorer/trial/founder) │
│    - Start date                         │
│    - Expiry date (calculated)           │
│    - Payment status                     │
│    - Razorpay order ID (if paid)        │
│    - Status: active/pending/expired     │
└─────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────┐
│ 4. ADMIN NOTIFICATION                   │
│    - Email to admin                     │
│    - Entry in admin dashboard           │
│    - Service desk ticket created        │
└─────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────┐
│ 5. MEMBER NOTIFICATION                  │
│    - Welcome email                      │
│    - WhatsApp welcome message           │
│    - Pet Pass number assigned           │
└─────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────┐
│ 6. DASHBOARD CREATION                   │
│    - Pet Soul™ profile ready            │
│    - Personalized pillars based on      │
│      celebration interests              │
│    - Mira AI ready                      │
└─────────────────────────────────────────┘
```

---

## SERVICE REQUEST FLOW (When member uses a pillar)

```
Member clicks a Pillar (e.g., "Groom", "Dine")
        │
        ▼
┌─────────────────────────────────────────┐
│ 1. PILLAR REQUEST CREATED               │
│    - Service type selected              │
│    - Pet details attached               │
│    - Member preferences stored          │
│    - Request ID generated               │
└─────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────┐
│ 2. SERVICE DESK TICKET                  │
│    - Ticket ID generated                │
│    - Status: Open                       │
│    - Priority assigned                  │
│    - Assigned to relevant channel       │
└─────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────┐
│ 3. CHANNEL INTAKE                       │
│    - Routes to appropriate vendor/      │
│      service provider                   │
│    - Groomer, Vet, Trainer, etc.        │
│    - Vendor notification                │
└─────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────┐
│ 4. NOTIFICATIONS                        │
│    - Admin notified                     │
│    - Member notified (status update)    │
│    - Service provider notified          │
│    - Ticket tracked until resolution    │
└─────────────────────────────────────────┘
```

---

## MEMBERSHIP VALIDITY LOGIC

### Cron Jobs Required:
1. **Daily Membership Check** (midnight)
   - Find memberships expiring in 5 days → Send reminder
   - Find memberships expiring in 1 day → Send final reminder
   - Find expired memberships → Deactivate

2. **Explorer Auto-Deactivation**
   - After 7 days → Mark as expired
   - Send "Upgrade to continue" message

### Status Transitions:
- `pending_payment` → `active` (after payment confirmation)
- `active` → `expiring_soon` (5 days before expiry)
- `expiring_soon` → `expired` (after expiry date)
- `expired` → `active` (after renewal payment)

---

## DATABASE MODELS

### User (Pet Parent)
```json
{
  "_id": "ObjectId",
  "name": "string",
  "email": "string",
  "phone": "string",
  "whatsapp": "string",
  "address": "string",
  "city": "string",
  "pincode": "string",
  "password_hash": "string",
  "preferred_contact": "whatsapp|phone|email",
  "notifications": {
    "order_updates": true,
    "pet_reminders": true,
    "promotions": true,
    "newsletter": false,
    "soul_whispers": true
  },
  "accepted_terms": true,
  "accepted_privacy": true,
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### Pet
```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId",
  "name": "string",
  "breed": "string",
  "gender": "male|female",
  "birth_date": "date",
  "gotcha_date": "date",
  "weight": "number",
  "weight_unit": "kg|lbs",
  "is_neutered": "boolean|null",
  "photo_url": "string",
  "celebrations": ["birthday", "gotcha_day", "vaccination", ...],
  "pet_pass_number": "string",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### Membership
```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId",
  "plan": "explorer|trial|founder",
  "plan_name": "string",
  "price": "number",
  "gst": "number",
  "total_paid": "number",
  "validity_days": "number",
  "start_date": "datetime",
  "expiry_date": "datetime",
  "status": "pending_payment|active|expiring_soon|expired",
  "razorpay_order_id": "string",
  "razorpay_payment_id": "string",
  "reminder_sent_5d": false,
  "reminder_sent_1d": false,
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### ServiceTicket
```json
{
  "_id": "ObjectId",
  "ticket_id": "TDC-2025-001234",
  "user_id": "ObjectId",
  "pet_id": "ObjectId",
  "type": "onboarding|pillar_request|support|celebration",
  "pillar": "dine|groom|heal|learn|play|stay|celebrate|shop|...",
  "status": "open|in_progress|pending_vendor|resolved|closed",
  "priority": "low|medium|high|urgent",
  "subject": "string",
  "description": "string",
  "assigned_to": "string",
  "channel": "string",
  "notes": [
    { "author": "string", "text": "string", "created_at": "datetime" }
  ],
  "created_at": "datetime",
  "updated_at": "datetime",
  "resolved_at": "datetime"
}
```

---

## API ENDPOINTS TO BUILD

### Onboarding
- `POST /api/membership/onboard` - Complete onboarding (existing, enhance)
- `POST /api/membership/payment/create` - Create Razorpay order
- `POST /api/membership/payment/verify` - Verify payment callback

### Membership Management
- `GET /api/membership/status` - Get current membership status
- `POST /api/membership/renew` - Initiate renewal
- `GET /api/membership/history` - Get payment history

### Service Tickets
- `POST /api/tickets/create` - Create new ticket
- `GET /api/tickets` - List user's tickets
- `GET /api/tickets/{id}` - Get ticket details
- `PUT /api/tickets/{id}/status` - Update ticket status

### Admin
- `GET /api/admin/memberships` - List all memberships
- `GET /api/admin/tickets` - List all tickets
- `POST /api/admin/membership/{id}/extend` - Extend membership
- `POST /api/admin/membership/{id}/deactivate` - Deactivate membership

### Cron/Background Jobs
- `POST /api/cron/membership-check` - Daily membership validity check
- `POST /api/cron/send-reminders` - Send expiry reminders

---

## NEXT STEPS

1. ✅ Frontend form is ready (MembershipOnboarding.jsx)
2. ⏳ Enhance UI/UX for better readability and mobile
3. ⏳ Build backend API for onboarding with all fields
4. ⏳ Integrate Razorpay for payments
5. ⏳ Build service ticket system
6. ⏳ Build cron jobs for membership validity
7. ⏳ Admin dashboard for membership management
8. ⏳ Notifications (Email + WhatsApp)

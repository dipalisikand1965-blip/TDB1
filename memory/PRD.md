# Pet Life Operating System - The Doggy Company
## Product Requirements Document

**Last Updated:** March 7, 2026  
**Version:** 3.1.0  
**Status:** Production Ready with Live Integrations

---

## 1. EXECUTIVE SUMMARY

The Doggy Company is a "Pet Life Operating System" - a comprehensive platform that serves as the central hub for all pet parent needs. Built with love, honoring the memory of **Kouros** (black Newfoundland) and **Mystique** (Shih Tzu).

**Core Philosophy:**
> "A dog is not in your life. You are in theirs."
> "To be known. To be seen. To be loved. With accuracy."

**URLs:**
- **Production:** https://thedoggycompany.com
- **Preview:** https://doggy-handover.preview.emergentagent.com

---

## 2. CREDENTIALS

### Test User Account
```
Email: dipali@clubconcierge.in
Password: test123
```

### Admin Panel Access
```
URL: /admin
Username: aditya
Password: lola4304
```
**Note:** Admin requires TWO-STEP login

---

## 3. ENVIRONMENT KEYS (/app/backend/.env)

### Payment & Messaging (LIVE)
```env
RAZORPAY_KEY_ID=rzp_live_<REDACTED_ROTATED>
RAZORPAY_KEY_SECRET=wNWqcJvv5K6b39kmMzOKVsQ3

GUPSHUP_API_KEY=sk_2609497ce757467f87a955015da8854d
GUPSHUP_APP_NAME="The Doggy Company"
GUPSHUP_SOURCE_NUMBER=918971702582
GUPSHUP_API_URL=https://api.gupshup.io/wa/api/v1

RESEND_API_KEY=re_fi1hZ47r_PRTTcKUpDsZSScn3fdRWKHPt
SENDER_EMAIL=woof@thedoggycompany.com
WHATSAPP_NUMBER=918971702582
```

### AI & External Services
```env
EMERGENT_LLM_KEY=sk-emergent-cEb0eF956Fa6741A31
ELEVENLABS_API_KEY=2738ad21884d7bf3ff2ddee5fbac5e2efc8a02ab4ca3cd36bdef82b83d9628bc
GOOGLE_PLACES_API_KEY=AIzaSy<REDACTED_ROTATED>
YOUTUBE_API_KEY=AIzaSyCEqC2I04NYLTvJmPNU7sWsrfcKLIwOWpU
```

### Database & Core
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=pet-os-live-test_database
JWT_SECRET=tdb_super_secret_key_2025_woof
SHOPIFY_PRODUCTS_URL=https://thedoggybakery.com/products.json
SITE_URL=https://thedoggycompany.com
```

---

## 4. INTEGRATIONS STATUS (March 7, 2026)

| Integration | Status | Details |
|-------------|--------|---------|
| **Razorpay** | ✅ LIVE | Orders creating successfully |
| **Gupshup WhatsApp** | ✅ LIVE | `918971702582` with Mira AI auto-reply |
| **Resend Email** | ✅ LIVE | `woof@thedoggycompany.com` verified |
| **OpenAI GPT** | ✅ WORKING | Via Emergent LLM Key |
| **MongoDB** | ✅ WORKING | Local + Atlas ready |
| **Shopify** | ✅ WORKING | 2,197 products synced |
| **ElevenLabs** | ✅ WORKING | British voice (Lily) |
| **Google Places** | ✅ WORKING | Pet-friendly locations |
| **YouTube** | ✅ WORKING | Video content |

---

## 5. MEMBERSHIP MODEL (3-TIER SYSTEM)

| Tier | Yearly | Monthly | Key Features |
|------|--------|---------|--------------|
| **Free** | ₹0 | - | Pet Soul profile, unlimited pets, Mira basic, browse pillars, book services |
| **Essential** | ₹2,499 (+GST) | ₹249 | + Mira full access, Mira OS, Concierge chat, Health Vault, Paw Points 2x |
| **Premium** | ₹9,999 (+GST) | ₹999 | + Dedicated Pet Manager, White-glove, 24/7 VIP, Exclusive events, Birthday gift |

**All tiers:** Unlimited pets, All 14 pillars, Book services, Upgrade anytime

---

## 6. MULTI-CHANNEL NOTIFICATION SYSTEM

### Triggers
| Event | WhatsApp | Email | In-App |
|-------|----------|-------|--------|
| New registration | ✅ | - | - |
| Payment received | ✅ | ✅ | ✅ |
| Membership activated | ✅ | ✅ | ✅ |
| Service booked | ✅ | ✅ | ✅ |
| Concierge reply | ✅ | ✅ | ✅ |
| Pet birthday | ✅ | ✅ | - |
| Order shipped | ✅ | ✅ | - |
| Incoming WhatsApp | ✅ Mira AI | - | Ticket |

### Mira AI WhatsApp Auto-Response
When users message `918971702582`:
1. Gupshup webhook receives message
2. Ticket created in Service Desk
3. **Mira AI (GPT-4o-mini)** generates intelligent response
4. Auto-reply sent via Gupshup
5. Admin notified for follow-up

---

## 7. THE 14 PILLARS

| Pillar | Route | Status |
|--------|-------|--------|
| Celebrate | /celebrate | ✅ Complete |
| Dine | /dine | ✅ Complete |
| Stay | /stay | ✅ Complete |
| Travel | /travel | ✅ Complete |
| Care | /care | ✅ Complete |
| Enjoy | /enjoy | ✅ Complete |
| Play | /play | ✅ Complete |
| Fit | /fit | ✅ Complete |
| Learn | /learn | ⚠️ API ready, frontend pending |
| Paperwork | /paperwork | ✅ Complete |
| Advisory | /advisory | ✅ Complete |
| Emergency | /emergency | ✅ Complete |
| Farewell | /farewell | ✅ Complete |
| Adopt | /adopt | ✅ Complete |

---

## 8. KEY API ENDPOINTS

### Membership & Payments
```
GET  /api/membership/plans
POST /api/membership/create-order
POST /api/membership/payment/verify
GET  /api/membership/status?email={email}
```

### Services (Unified - uses services_master)
```
GET  /api/service-box/services
GET  /api/service-box/services?pillar={name}
PUT  /api/service-box/services/{id}
```

### WhatsApp (Gupshup)
```
GET  /api/whatsapp/status
POST /api/whatsapp/webhook
POST /api/whatsapp/gupshup/send
POST /api/whatsapp/test-notification
POST /api/whatsapp/mira-reply
```

### Multi-Channel
```
POST /api/tickets/messaging/reply/multi-channel
  Body: { ticket_id, message, channels: ["in_app", "whatsapp", "email"] }
```

---

## 9. DATABASE COLLECTIONS

| Collection | Purpose |
|------------|---------|
| `services_master` | **PRIMARY** - All services (1,115+) |
| `products_master` | Shopify products (2,197+) |
| `users` | User accounts |
| `pets` | Pet profiles |
| `tickets` | Service desk tickets |
| `memberships` | Membership orders |

⚠️ **Do NOT use** `service_catalog` (deprecated)

---

## 10. COMPLETED WORK (March 7, 2026)

### Integrations
- ✅ Razorpay LIVE - Payment orders working
- ✅ Gupshup WhatsApp LIVE - Notifications + Mira AI auto-reply
- ✅ Resend Email LIVE - `woof@thedoggycompany.com`
- ✅ All .in URLs updated to .com

### Features
- ✅ 3-tier membership model (Free/Essential/Premium)
- ✅ Multi-channel notifications (WhatsApp + Email + In-App)
- ✅ Mira AI WhatsApp auto-response (GPT-4o-mini)
- ✅ Service Desk omnichannel replies
- ✅ C® button with WhatsApp option

### Bug Fixes
- ✅ Fixed Gupshup HTTP 202 detection
- ✅ Fixed app name with spaces
- ✅ Unified service data source

---

## 11. PENDING TASKS

### P1 - High Priority
1. Update `LearnPage.jsx` for learn guides/videos
2. Add Bundles/Experiences tabs to admin managers (Dine, Enjoy, Farewell, Adopt, Shop)
3. Complete British English audit

### P2 - Medium Priority
4. End-to-end service flow audit
5. Mobile Golden Experience audit
6. MongoDB Atlas IP whitelist

### P3 - Future/Backlog
7. Code refactoring (Admin.jsx, DoggyServiceDesk.jsx)
8. Secure admin authentication
9. E-commerce expansion (HUFT)

---

## 12. DEPLOYMENT CHECKLIST

1. ☐ Login to Admin (`/admin`)
2. ☐ Click **MASTER SYNC**
3. ☐ Verify products appear
4. ☐ Test Razorpay payment
5. ☐ Set Gupshup webhook: `https://thedoggycompany.com/api/whatsapp/webhook`
6. ☐ Test WhatsApp messaging
7. ☐ Whitelist MongoDB Atlas IPs

---

## 13. KEY FILES

```
/app/backend/
├── server.py                 # Main FastAPI
├── membership_routes.py      # Razorpay
├── whatsapp_routes.py        # Gupshup + Mira AI
├── whatsapp_notifications.py # Templates
├── mira_service_desk.py      # Service desk
├── ticket_messaging.py       # Multi-channel
└── .env                      # All keys

/app/frontend/src/
├── pages/MembershipPage.jsx  # 3-tier pricing
└── components/Mira/ConciergeButton.jsx # C® + WhatsApp
```

---

*Built with love for Kouros & Mystique* 🐾

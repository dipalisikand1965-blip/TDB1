# The Doggy Company — Ubuntu Deployment Migration Package
Generated: 2026-03-26

---

## 1. System Requirements

| Component | Version | Notes |
|-----------|---------|-------|
| Python | 3.11.x | Tested on 3.11.15 |
| Node.js | 20.x (LTS) | Tested on v20.20.1 |
| npm / yarn | yarn 1.22+ | Use yarn for frontend |
| MongoDB | 7.x | Atlas or self-hosted |
| OS | Ubuntu 22.04 LTS | Recommended |
| RAM | 4 GB minimum | 8 GB recommended |
| CPU | 2 vCPU minimum | 4 vCPU recommended |
| Disk | 20 GB SSD | For app + logs + MongoDB |

---

## 2. Environment Variables (backend/.env)

All keys below are required. Replace `<VALUE>` with actual credentials.

```bash
# ── Database ──────────────────────────────────────────────────────────────────
MONGO_URL=mongodb://localhost:27017       # Or Atlas connection string
DB_NAME=thedoggycompany

# ── Authentication ────────────────────────────────────────────────────────────
JWT_SECRET=<STRONG_RANDOM_SECRET_64_CHARS>
ADMIN_EMAIL=<ADMIN_EMAIL>
ADMIN_PASSWORD=<ADMIN_PASSWORD>
ADMIN_USERNAME=<ADMIN_USERNAME>

# ── AI / LLM ──────────────────────────────────────────────────────────────────
EMERGENT_LLM_KEY=<EMERGENT_KEY>           # Powers Mira AI (OpenAI via Emergent)
MIRA_STRUCTURED_ENGINE=gpt-4o-mini       # Default Mira engine

# ── WhatsApp (Gupshup) ────────────────────────────────────────────────────────
GUPSHUP_API_KEY=<GUPSHUP_KEY>
GUPSHUP_APP_NAME=<GUPSHUP_APP>
GUPSHUP_SOURCE_NUMBER=<+91XXXXXXXXXX>    # Must match approved WhatsApp number
GUPSHUP_API_URL=https://api.gupshup.io/wa/api/v1
WHATSAPP_NUMBER=<+91XXXXXXXXXX>          # Same as source, used in fallback messages
WHATSAPP_TEMPLATES_APPROVED=true         # Set to 'true' once templates are approved

# ── Email (Resend) ────────────────────────────────────────────────────────────
RESEND_API_KEY=re_<KEY>
SENDER_EMAIL=hello@thedoggycompany.com
NOTIFICATION_EMAIL=alerts@thedoggycompany.com

# ── Payments (Razorpay) ───────────────────────────────────────────────────────
RAZORPAY_KEY_ID=rzp_live_<KEY>
RAZORPAY_KEY_SECRET=<SECRET>

# ── Image Storage (Cloudinary) ────────────────────────────────────────────────
CLOUDINARY_CLOUD_NAME=<CLOUD_NAME>
CLOUDINARY_API_KEY=<API_KEY>
CLOUDINARY_API_SECRET=<API_SECRET>

# ── Google APIs ───────────────────────────────────────────────────────────────
GOOGLE_PLACES_API_KEY=<KEY>              # For "Near Me" features
GOOGLE_VISION_API_KEY=<KEY>             # For image analysis
GOOGLE_CALENDAR_API_KEY=<KEY>           # Optional: calendar integrations

# ── Location & Events ─────────────────────────────────────────────────────────
FOURSQUARE_API_KEY=<KEY>
FOURSQUARE_LEGACY_API_KEY=<KEY>
EVENTBRITE_API_KEY=<KEY>
EVENTBRITE_PRIVATE_TOKEN=<TOKEN>
AMADEUS_API_KEY=<KEY>
AMADEUS_API_SECRET=<SECRET>

# ── Other ─────────────────────────────────────────────────────────────────────
OPENWEATHER_API_KEY=<KEY>
YOUTUBE_API_KEY=<KEY>
CHATBASE_API_KEY=<KEY>
CHATBASE_CHATBOT_ID=<ID>
ELEVENLABS_API_KEY=<KEY>
VIATOR_API_KEY=<KEY>
SITE_URL=https://thedoggycompany.com
CORS_ORIGINS=https://thedoggycompany.com,https://www.thedoggycompany.com
TEST_MOBILE_NUMBER=<+91XXXXXXXXXX>
CRON_SECRET=<STRONG_SECRET>
ENABLE_HEALTH_CHECK=true

# ── Production DB (Separate) ──────────────────────────────────────────────────
PRODUCTION_MONGO_URL=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/
SHOPIFY_PRODUCTS_URL=<URL>              # If Shopify sync is enabled
BUSINESS_NAME=The Doggy Company
```

---

## 3. Frontend Environment (frontend/.env)

```bash
REACT_APP_BACKEND_URL=https://api.thedoggycompany.com  # Backend public URL
```

---

## 4. Application Architecture

```
Ubuntu Server (22.04 LTS)
├── /app/backend/           FastAPI server (Python 3.11, Uvicorn)
│   ├── server.py           Main FastAPI app (~24,500 lines — refactor priority)
│   ├── auth_routes.py      JWT auth, registration, trial status
│   ├── scheduled_automations.py  APScheduler cron jobs
│   ├── services/
│   │   ├── whatsapp_service.py   Gupshup WhatsApp integration
│   │   └── email_service.py     Resend email integration
│   └── [20+ route files]   Modular route handlers
│
├── /app/frontend/          React 19 app (Craco build)
│   ├── src/pages/          Page components (~45 pages)
│   ├── src/components/     Reusable components (~100+)
│   └── build/              Production build output
│
└── MongoDB                 Database (local or Atlas)
    ├── users               Member accounts + trial data
    ├── pets                Pet profiles + soul profiles
    ├── orders              Order history
    ├── products_master     Product catalog
    ├── breed_products      Breed-specific soul-made products
    ├── services_master     Service catalog
    └── [30+ collections]   Full data model
```

---

## 5. Cron Jobs (APScheduler — runs embedded in FastAPI process)

All jobs defined in `/app/backend/scheduled_automations.py`:

| Job ID | Schedule | Function | Purpose |
|--------|----------|----------|---------|
| `daily_digest` | 8:00 AM IST | `run_daily_digest` | Morning WhatsApp digest to all members |
| `birthday_reminders` | 7:00 AM IST | `run_birthday_reminders` | 7-day advance birthday warnings |
| `medication_reminders` | 9:00 AM IST | `run_medication_reminders` | Upcoming medication due alerts |
| `trial_status_check` | 10:00 AM IST | `run_trial_status_check` | Trial lifecycle Day 25/30/37/44 notifications |

**Note:** APScheduler runs in-process (no separate cron daemon required). Jobs survive server restarts via MongoDB-backed state.

---

## 6. External Services & Dependencies

| Service | Provider | Purpose | Required? |
|---------|----------|---------|-----------|
| WhatsApp Notifications | Gupshup | Daily digest, trial alerts, orders | Yes |
| Email Notifications | Resend | Welcome, order confirmation, alerts | Yes |
| AI / LLM | Emergent (OpenAI via proxy) | Mira AI chat, product filtering | Yes |
| Payments | Razorpay | Membership payments | Yes |
| Image Hosting | Cloudinary | Product images, pet photos | Yes |
| Location | Google Places + Foursquare | Near-me vets/groomers/parks | Optional |
| Database | MongoDB Atlas | Primary data store | Yes |
| Image Analysis | Google Vision | AI product image generation | Optional |

---

## 7. Ubuntu Installation Steps

### 7.1 System Setup
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3.11 python3.11-pip python3.11-venv
sudo apt install -y nodejs npm
npm install -g yarn
```

### 7.2 MongoDB (self-hosted option)
```bash
# Import MongoDB 7.x key
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update && sudo apt install -y mongodb-org
sudo systemctl enable mongod && sudo systemctl start mongod
```

### 7.3 Backend Setup
```bash
cd /app/backend
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
# Copy .env with all keys filled in
cp .env.example .env && nano .env
```

### 7.4 Frontend Build
```bash
cd /app/frontend
yarn install
yarn build    # Produces /app/frontend/build/
```

### 7.5 Nginx (Reverse Proxy + Static Files)
```nginx
server {
    listen 443 ssl;
    server_name thedoggycompany.com;

    # Serve React build
    location / {
        root /app/frontend/build;
        try_files $uri /index.html;
    }

    # Proxy API to FastAPI
    location /api/ {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 7.6 Systemd Service for Backend
```ini
# /etc/systemd/system/tdc-backend.service
[Unit]
Description=The Doggy Company — FastAPI Backend
After=network.target mongod.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/app/backend
EnvironmentFile=/app/backend/.env
ExecStart=/app/backend/venv/bin/uvicorn server:app --host 0.0.0.0 --port 8001 --workers 2
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable tdc-backend
sudo systemctl start tdc-backend
```

---

## 8. WhatsApp Templates (Gupshup) — Required Approvals

The following templates must be approved on Gupshup before going live:

| Template Name | Trigger | Day/Event |
|--------------|---------|-----------|
| `tdc_welcome_new_member` | New registration | Day 0 |
| `tdc_order_confirmed` | Order placed | On order |
| `tdc_concierge_request` | Mira ticket submitted | On submit |
| `tdc_daily_digest` | Morning digest | 8 AM daily |
| `tdc_birthday_reminder_7days` | Pet birthday | 7 days before |
| `tdc_birthday_today` | Pet birthday | On the day |
| `tdc_trial_ending_5days` | Trial expiry | Day 25 |
| `tdc_trial_expired` | Trial ended | Day 30 |
| `tdc_grace_period_warning` | Account pause imminent | Day 37 |
| `tdc_account_paused` | Account paused | Day 44 |

---

## 9. MongoDB Collections Reference

| Collection | Purpose | Key Fields |
|-----------|---------|-----------|
| `users` | Member accounts | `id`, `email`, `account_tier`, `trial_start_date` |
| `pets` | Pet profiles | `id`, `owner_id`, `breed`, `soul_profile` |
| `orders` | Order history | `id`, `email`, `total`, `status` |
| `products_master` | Product catalog | `id`, `name`, `category`, `pillar`, `visibility.status` |
| `breed_products` | Soul-made breed products | `id`, `breed`, `name`, `image_url` |
| `services_master` | Service catalog | `id`, `name`, `pillar`, `is_active` |
| `pet_health_vault` | Health records | `pet_id`, `vaccines`, `medications` |
| `soul_profiles` | Pet soul answers | `pet_id`, `answers`, `completed_at` |
| `member_notifications` | Notification inbox | `id`, `email`, `type`, `read` |
| `whatsapp_logs` | WhatsApp send history | `id`, `phone`, `template_name`, `sent_at` |
| `email_logs` | Email send history | `id`, `to`, `template`, `sent_at` |
| `concierge_tickets` | Mira AI requests | `id`, `email`, `status`, `pet_id` |

---

## 10. Account Tier States (Free Trial System)

```
New Registration → account_tier = "trial" (Day 0)
                              ↓
               Day 25: account_tier = "trial_ending" + WhatsApp warning
                              ↓
               Day 30: account_tier = "grace_period" + trial expired notice
                              ↓
               Day 37: grace period warning (7 days to pause)
                              ↓
               Day 44: account_tier = "paused", account_status = "paused"
                       → Full-screen overlay on login, data preserved
                              ↓
               After payment: account_tier = "active", account_status = "active"
```

**IMPORTANT: Data is NEVER deleted at any stage. Paused accounts retain full pet history.**

---

## 11. Known Production Blockers

1. **MongoDB Atlas Network Access** — The Atlas cluster currently blocks this preview environment's IP. Add the production server IP to the Atlas IP whitelist before go-live.
2. **WhatsApp Template Approvals** — Templates must be approved by Gupshup/Meta before they fire in production. In development, they fall back to free-form messages.
3. **Razorpay Live Keys** — Switch from test keys (`rzp_test_*`) to live keys (`rzp_live_*`) before launch.

---

*Report generated from live codebase on 2026-03-26. Last agent: E1.*

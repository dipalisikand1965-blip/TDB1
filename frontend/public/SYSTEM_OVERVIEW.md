# 🐾 The Doggy Company — Complete System Overview
## For Claude & Future Agents — Paste this at the start of any new conversation

**Last Updated**: Mar 2026 | **Version**: Session 83w

---

## WHAT THIS IS
The Doggy Company's Pet Life Operating System (PLOS) — a pillar-based concierge platform where every experience is personalised to a named dog by Mira, the AI concierge. Built by Aditya Nair with 200+ days of vision. Products from **thedoggybakery.com** (Shopify). Architecture: React 18 + FastAPI + MongoDB + Cloudinary.

**Preview URL**: https://pet-soul-audit.preview.emergentagent.com  
**Test login**: dipali@clubconcierge.in / test123 | Admin: aditya / lola4304

---

## PLATFORM ARCHITECTURE

### Tech Stack
- **Frontend**: React 18, Tailwind, Lucide-React, Shadcn/UI
- **Backend**: FastAPI (Python), MongoDB (`pet-os-live-test_database`)
- **AI**: Claude Sonnet via Emergent LLM Key (text), GPT Image 1 (images), Gemini (nano banana)
- **Storage**: Cloudinary (all images — watercolour illustrations, product photos, Mira Imagines)
- **Messaging**: WhatsApp (Meta + GupShup providers), Email
- **Products**: thedoggybakery.com via Shopify JSON sync

### Key Backend Files
```
server.py              — Main FastAPI + all route imports
mira_service_desk.py   — Ticket/inbox/concierge system
whatsapp_routes.py     — WhatsApp webhook (Meta + GupShup)
soul_intelligence.py   — Soul score calculation
pet_score_logic.py     — Overall score algorithm
ai_image_service.py    — Cloudinary image pipeline
shopify_sync_routes.py — thedoggybakery.com product sync
mira_routes.py         — Mira AI + claude-picks scoring
```

---

## 🐕 PET ONBOARDING FLOW

### Step 1: Account Creation
- User signs up → JWT token issued → stored in `users` collection
- Fields: email, name, phone, city, role

### Step 2: Add a Pet
- `POST /api/pets` → creates pet in `pets` collection
- Required: name, breed, date_of_birth, species
- Optional: photo_url, avatar, city, health conditions

### Step 3: Soul Profile Questions (The Heart of the Platform)
- Triggered immediately after pet creation
- 40+ questions across 8 chapters (displayed progressively in modals on each pillar page)
- Each answer saved via: `POST /api/pet-soul/profile/{pet_id}/answer`
  - Body: `{ question_id: string, answer: string[] }`
  - Response: `{ message, scores: { overall, identity, health, behaviour, nutrition, social, training } }`
- Answers stored in `pets.doggy_soul_answers` (flat dict on the pet document)
- Soul score recalculated on EVERY answer using `pet_score_logic.calculate_pet_soul_score()`

### Step 4: Soul Score Calculation
```
CHAPTER WEIGHTS (total = 100%):
  Identity & Safety    20 pts  — microchip, tags, registration
  Health & Wellness    20 pts  — vaccination, vet history, allergies
  Behaviour & Training 15 pts  — training level, anxiety triggers
  Nutrition & Diet     15 pts  — food preferences, allergies, portion
  Social & Lifestyle   10 pts  — energy, other pets, lifestyle
  Travel & Adventure   10 pts  — travel comfort, passport
  Learning & Growth    10 pts  —  training classes, enrichment

SCORING:
  overall_score = weighted sum of all answered questions
  Stored as: pets.overall_score (0-100)
  Also stored: pets.soul_score (legacy — use overall_score)
  
RULE: All pillars MUST use overall_score || soul_score || 0
```

### Step 5: Mira Intelligence Build-up
After onboarding, Mira reads from:
- `doggy_soul_answers` — behaviour, allergies, breed traits
- `overall_score` — completeness of soul profile  
- `orders` — purchase history
- `mira_product_scores` — pre-computed AI picks per pet per pillar
- `conversation_memories` — what Mira has learned in chat
- `mira_memories` — explicit memory tags ("Mojo loves liver treats")

---

## 📱 COMMUNICATION SYSTEM

### 1. WhatsApp (Primary Channel)
**Providers**: Meta (direct) + GupShup (fallback)  
**Webhook**: `POST /api/whatsapp/webhook`

**Inbound flow**:
```
Parent sends WhatsApp message
→ Webhook receives (Meta or GupShup format normalised)
→ Intent classified (classify_intent()) → pillar + intent_primary + life_state
→ attach_or_create_ticket() → creates/finds ticket in service_desk_tickets
→ Message appended to ticket thread
→ If Mira can answer → auto-reply sent
→ If complex → ticket status = "awaiting_concierge"
→ Concierge sees in inbox → replies → WhatsApp sent back
```

**Outbound**:
- `POST /api/whatsapp/send` — send message to parent
- `POST /api/whatsapp/send-template` — send template message
- Reminders triggered by cron → WhatsApp link generated per pet

### 2. Service Desk Inbox (The Nerve Centre)
**Collection**: `service_desk_tickets`

**Ticket structure**:
```json
{
  "ticket_id": "TKT-XXXXX",
  "parent_id": "user-email-or-id",
  "pet_id": "pet-xxx",
  "pillar": "care|dine|learn|...",
  "intent_primary": "service_booking|product_inquiry|mira_imagines_request|...",
  "intent_secondary": ["grooming", "custom_care_product"],
  "channel": "whatsapp|learn_book_tab|care_concierge_modal|...",
  "status": "open|awaiting_concierge|in_progress|resolved|closed",
  "life_state": "care|go|celebrate|...",
  "thread": [
    { "sender": "parent|mira|concierge", "text": "...", "timestamp": "..." }
  ],
  "created_at": "ISO timestamp",
  "assigned_to": "concierge-name"
}
```

**Key endpoints**:
```
POST /api/service_desk/attach_or_create_ticket   ← MOST USED — called from every "Book →" button
POST /api/service_desk/append_message            ← Add message to thread
POST /api/service_desk/handoff_to_concierge      ← Escalate from Mira to human
GET  /api/service_desk/tickets                   ← All tickets (admin)
GET  /api/service_desk/tickets/{ticket_id}       ← Single ticket
```

**How every "Book →" / "Reach out →" / "Tap — Concierge →" button works**:
```js
// Called from every concierge modal across all pillars
fetch(`/api/service_desk/attach_or_create_ticket`, {
  method: "POST",
  body: JSON.stringify({
    parent_id: user.id,          // who's booking
    pet_id: pet.id,              // which pet
    pillar: "learn",             // which pillar
    intent_primary: "service_booking",
    channel: "learn_book_a_session",
    initial_message: { sender: "parent", text: "I'd like to book..." }
  })
})
// Returns: { ticket_id, thread_id, status }
```

### 3. Admin Concierge Dashboard
**Route**: `/admin` → Concierge tab  
**File**: `AdminConciergeDashboard.jsx`  
**What it shows**:
- All open tickets sorted by pillar + urgency
- Thread view (WhatsApp-style chat UI)
- Quick reply templates
- Pet context sidebar (soul score, breed, last order)
- Status management (open → in_progress → resolved)

### 4. Email
- Triggered for: booking confirmations, document uploads, care reminders
- Provider: configured in `.env`
- Templates stored in `email_templates` collection

### 5. Push Notifications / In-App
- Inbox notifications via `mira_notifications.py`
- Stored in `notifications` collection
- Read by frontend via `GET /api/notifications/unread`

---

## 🧠 MIRA INTELLIGENCE LAYERS

```
Layer 1: Soul Answers (doggy_soul_answers)
  → allergies, breed, energy, training level, health conditions
  → Read by: every pillar page, product recommendations, service matching

Layer 2: AI Scoring (mira_product_scores)  
  → claude-picks: scored products per pet per pillar
  → Triggered: POST /api/mira/score-for-pet {pet_id, pillar}
  → Returns via: GET /api/mira/claude-picks/{pet_id}?pillar=X&min_score=60

Layer 3: Interaction Memory (conversation_memories, mira_memories)
  → What Mira has learned from conversations
  → Explicit tags: "likes liver", "anxious in car", "prefers dry food"

Layer 4: Order History (orders)
  → purchase_date, items, pillar, total
  → Used in: MiraPicksSection subtitle, recommendations

Layer 5: Behaviour (mira_product_scores.mira_reason)
  → Why Mira scored a product for this specific pet
  → Shown on product cards as italic explanation
```

---

## 🏛️ PILLAR ARCHITECTURE (All 14 Pillars)

| Pillar | Route | Status | Products | Services |
|--------|-------|--------|---------|---------|
| Celebrate | /celebrate | ✅ Old page + Shopify | 2,058 | 32 |
| Care | /care | ✅ Full | 364 | 27 |
| Dine | /dine | ✅ Full | 433 | 22 |
| Go | /go | ✅ Full | 50 | 22 |
| Play | /play | ✅ Full | 171 | 28 |
| Learn | /learn | ✅ Full | 274 | 33 |
| Paperwork | /paperwork + /advisory | ✅ Full | 235 | 35 |
| Emergency | /emergency | ✅ Full | 279 | 27 |
| Adopt | /adopt | ✅ Full | 147 | 23 |
| Farewell | /farewell | ✅ Full | 275 | 22 |
| Shop | /shop | 🔴 Stub | 3,027 | 424 |
| Stay | /stay | 🔴 Stub | 4,700 | 14 |
| Services | /services | 🔴 Stub | — | — |
| Love | Future | 🔴 Not built | — | — |

### Every pillar MUST have (Architecture Standard):
1. Centered hero: pet avatar + % badge + h1 `clamp(1.875rem,4vw,2.5rem)` + chips + Mira quote + chevron
2. Category strip: 82×72px icon+label pills → ContentModal with products
3. Tab bar: `[Pillar] & Products | Book a Session | Find [Pillar]`
4. Soul Profile: collapsed bar → dark modal, ✕ close, questions, +pts save
5. MiraPicksSection: 3 MiraImaginesCard (instant) + AI scored picks (async)
6. Breed filter: `filterBreedProducts()` on ALL API picks
7. Mira Intelligence: `useMiraIntelligence` hook in MiraPicksSection
8. Concierge Modal: chip selector + date + notes + "✦ Send to Concierge"
9. Guided Paths: 3-col PathCard grid → step modal → Concierge ticket
10. ConciergeToast: pillar colour registered

---

## 🖼️ CLOUDINARY IMAGE SYSTEM

```
Rule: ALL images → Cloudinary. Never store Emergent CDN URLs long-term.

Pipelines (POST endpoints):
  /api/ai-images/pipeline/migrate          — Migrate existing non-Cloudinary images
  /api/ai-images/pipeline/services-master  — Generate watercolour per service
  /api/ai-images/pipeline/bundles          — Generate watercolour per bundle
  /api/ai-images/pipeline/mira-imagines    — Generate watercolour per pillar×breed
  GET /api/ai-images/pipeline/mira-imagines/{pillar}/{breed} — Get cached URL

Image types:
  Products  → Realistic contextual photos (DALL-E / GPT Image 1)
  Services  → Watercolour illustrations (Gemini Nano Banana)
  Bundles   → Watercolour illustrations
  Imagines  → Breed-specific watercolours (per pillar × breed)

Cloudinary folder structure:
  tdc/products/{pillar}/{product_id}
  tdc/services-master/{pillar}/{service_id}
  tdc/bundles/{pillar}/{bundle_id}
  tdc/mira-imagines/{pillar}/{breed}
```

---

## 📊 DATABASE COLLECTIONS (MongoDB: pet-os-live-test_database)

| Collection | Count | Purpose |
|------------|-------|---------|
| pets | ~20 | Pet profiles + soul answers + overall_score |
| users | ~10 | User accounts + auth |
| products_master | 12,986 | All products (all pillars) |
| services_master | 1,025 | All services (all pillars) |
| care_bundles | 27 | All bundles (all pillars) |
| service_desk_tickets | 455 | Concierge inbox |
| mira_product_scores | 7,470+ | AI scores per pet per pillar |
| mira_imagines_cache | 5+ | Cloudinary watercolour URLs |
| orders | 11 | Purchase history |
| conversation_memories | 5 | Mira learned memories |
| mira_memories | 24 | Explicit pet memory tags |

---

## 🔑 API QUICK REFERENCE

```
Auth:    POST /api/auth/login    { email, password } → { access_token }
Pets:    GET  /api/pets/my-pets  → [ pet objects ]
Soul:    POST /api/pet-soul/profile/{id}/answer { question_id, answer[] }
Picks:   GET  /api/mira/claude-picks/{id}?pillar=X&min_score=60
Score:   POST /api/mira/score-for-pet { pet_id, pillar }
Tickets: POST /api/service_desk/attach_or_create_ticket
Places:  GET  /api/places/care-providers?query=X&type=Y
Images:  POST /api/ai-images/pipeline/mira-imagines?pillar=X&breed=Y
```

---

## HOW TO SHARE THIS WITH CLAUDE

**Option A (Best)**: Paste the contents of this file at the start of any Claude conversation.

**Option B**: Share the URL:
`https://pet-soul-audit.preview.emergentagent.com/SYSTEM_OVERVIEW.md`  
(Copy this file to `/app/frontend/public/SYSTEM_OVERVIEW.md`)

**Option C**: For complex questions, share specific files:
- `/app/memory/PRD.md` — product requirements
- `/app/memory/CHANGELOG.md` — what was built when
- `/app/memory/PILLAR_ARCHITECTURE_STANDARD.md` — the 13-point pillar checklist

**Why the HTML won't work**: `complete-documentation.html` is 91,159 lines — too large for any LLM context window. These markdown files are designed to be LLM-readable at ~5,000 tokens each.

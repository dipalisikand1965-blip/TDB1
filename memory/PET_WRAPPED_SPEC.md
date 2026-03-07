# Pet Wrapped — Product Launch Spec

**Launch Date:** 20th May 2026 (Mystique's Birthday)
**Countdown:** ~53 days from today
**Status:** DESIGN COMPLETE → BUILD PHASE

---

## THE HEADLINE

> "The world's first Pet Wrapped goes live on 20th May 2026 — for Mystique."

This is not a feature. This is a product launch. Every share is an ad you didn't pay for.

---

## STRATEGIC FRAMEWORK

### When Does Pet Wrapped Trigger?

| Trigger | Type | Timing |
|---------|------|--------|
| **Annual (December)** | Spotify moment | Everyone shares at the same time, creates a wave |
| **Birthday** | Personal & emotional | Sacred. Dipali knows this. |
| **Gotcha Day** | Adoption anniversary | For rescue parents |
| **Rainbow Bridge Anniversary** | In memory | Gentle, optional |

### MVP Scope (Phase 1 — Before May 20)

| Card | Content | Data Source |
|------|---------|-------------|
| **1. Cover** | Pet name, breed, year, emotional tagline | `pets` collection |
| **2. Soul Score** | Current score + journey (start → mid → now) | `pets.soul_score`, historical snapshots |
| **3. Mira Moments** | Conversations count, questions answered, pillars explored, AI-generated memory | `mira_conversations`, `pets.soul_data` |
| **4. Legacy (optional)** | Relationships, family, pet friends | `pets.relationships` |
| **5. Pillars & Treats** | Top pillars used, Doggy Bakery orders | `service_desk_tickets`, `orders` |
| **6. Closing** | Philosophy quote, CTA to create Soul Profile | Static + dynamic pet name |

### Format

- **Vertical story cards** (390×844px — iPhone Pro ratio)
- **Instagram & WhatsApp optimized** — where Indian pet parents live
- **Beautiful enough to screenshot without thinking**

### Pricing

- **FREE** — completely free
- **Not behind login wall** for shared version
- The card carries The Doggy Company brand
- **Every share = free advertising**
- Soul Profile link = conversion point

---

## TECHNICAL ARCHITECTURE

### Data Already Available

```
pets collection:
├── name, breed, gender, birthday, gotcha_day
├── soul_score (0-100)
├── soul_data (51 questions answered)
├── relationships (family, pet_friends, humans)
├── rainbow_bridge (boolean)
└── personality traits

mira_conversations collection:
├── pet_id
├── messages[]
├── timestamp
└── pillar_context

service_desk_tickets collection:
├── pet_id
├── pillar
├── service_type
└── created_at

orders collection (when connected):
├── user_id / pet_id
├── products[]
└── order_date
```

### New Components Needed

```
/app/frontend/src/pages/PetWrapped/
├── PetWrappedPage.jsx        # Main container
├── WrappedCard.jsx           # Base card component
├── cards/
│   ├── CoverCard.jsx
│   ├── SoulScoreCard.jsx
│   ├── MiraMomentsCard.jsx
│   ├── LegacyCard.jsx
│   ├── PillarsCard.jsx
│   └── ClosingCard.jsx
├── WrappedGenerator.jsx      # Orchestrates data → cards
└── ShareButton.jsx           # Native share / download

/app/backend/routes/wrapped/
├── __init__.py
├── generate.py               # GET /api/wrapped/{pet_id}
├── share.py                  # GET /api/wrapped/{pet_id}/share
└── ai_memory.py              # Generate Mira's favorite memory
```

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/wrapped/{pet_id}` | GET | Generate wrapped data for a pet |
| `/api/wrapped/{pet_id}/cards` | GET | Get pre-rendered card images |
| `/api/wrapped/{pet_id}/share` | GET | Public shareable link (no auth) |
| `/api/wrapped/preview` | POST | Preview before publishing |

### AI Memory Generation

```python
# Mira generates one personalized memory per pet
prompt = f"""
You are Mira, the soul-aware AI companion for {pet_name}.
Based on their Soul Profile and conversation history, write ONE 
beautiful, specific memory about this pet in 2-3 sentences.

Soul Profile highlights:
- What brings them joy: {joy_answer}
- What they've forgiven: {forgiveness_answer}
- Their personality: {traits}

Conversation themes: {top_topics}

Write something that would make their parent cry happy tears.
"""
```

---

## 53-DAY BUILD PLAN

### Week 1-2: Backend Foundation
- [ ] Create `/api/wrapped/` route structure
- [ ] Build data aggregation service (pull from all collections)
- [ ] Implement Soul Score history tracking (if not exists)
- [ ] AI memory generation endpoint

### Week 3-4: Frontend Cards
- [ ] Port design HTML to React components
- [ ] Dynamic data binding
- [ ] Card-to-image export (html2canvas or similar)
- [ ] Mobile-responsive card viewer

### Week 5: Sharing & Distribution
- [ ] WhatsApp share integration
- [ ] Instagram story export (correct dimensions)
- [ ] Public shareable URL (no login required to view)
- [ ] Download as images

### Week 6: Polish & Test
- [ ] Mystique's data verification
- [ ] Load testing
- [ ] Cross-device testing
- [ ] Soft launch to 10 Doggy Bakery customers

### Week 7 (May 13-19): Final Prep
- [ ] Mystique's Pet Wrapped finalized
- [ ] Social media posts drafted
- [ ] Email to first 100 customers queued

### May 20, 2026: LAUNCH
- [ ] Mystique's Pet Wrapped goes live
- [ ] Dipali shares publicly
- [ ] CTA: "Create your dog's Soul Profile"

---

## SUCCESS METRICS

| Metric | Target (Launch Week) |
|--------|---------------------|
| Mystique's Wrapped shared | ✓ (by Dipali) |
| Soul Profile sign-ups from shares | 100+ |
| Social media reach | 10,000+ |
| Media pickup | 1-2 articles |

---

## THE MOAT

> "You cannot copy a grieving founder sharing her dog's Pet Wrapped on the dog's birthday. That is not a feature. That is a story."

The first Pet Wrapped ever made, for the dog who inspired the entire platform, released on her birthday. No competitor can manufacture that origin story.

---

## FILES

- **Design Template:** `/app/frontend/public/pet-wrapped-mystique.html`
- **Investor Deck:** `/app/frontend/public/investor-deck.html`
- **PRD:** `/app/memory/PRD.md`

---

*Built in memory of Mystique. Launching May 20, 2026.*

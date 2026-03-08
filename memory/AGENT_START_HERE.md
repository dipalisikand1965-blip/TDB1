# MIRA OS - AGENT START HERE (MANDATORY READ)
## The Doggy Company - Pet Life Operating System

> **STOP. READ THIS ENTIRE FILE BEFORE DOING ANYTHING.**
> This is the single source of truth for all agents working on MIRA OS.

---

## WHAT IS MIRA OS?

**MIRA is a MOBILE-FIRST PET LIFE OPERATING SYSTEM.**

It is:
- An intelligent OS that runs a pet's entire life
- Memory-driven, context-aware, proactive
- Built for iOS and Android mobile devices FIRST

It is NOT:
- An e-commerce platform
- A chatbot
- A web-first application
- A content feed or social network

---

## GOLDEN RULES FOR UI/UX (NON-NEGOTIABLE)

### Mobile-First Design Requirements

ALL UI/UX work MUST be 100% compliant with these rules for best rendering on iOS and Android across ALL devices without exception:

| Rule | Requirement |
|------|-------------|
| **Touch Targets** | Minimum 44x44px (iOS) / 48x48dp (Android) |
| **Safe Areas** | Respect iOS notch, Android gesture nav |
| **Font Scaling** | Support dynamic type / font scaling |
| **Contrast** | WCAG AA minimum (4.5:1 for text) |
| **Loading States** | Skeleton screens, not spinners |
| **Haptic Feedback** | Implement for all confirmations |
| **Gestures** | Support swipe, pull-to-refresh, long-press |
| **Offline** | Graceful degradation, queue actions |
| **Performance** | First paint < 1.5s, interactive < 3s |
| **Viewport** | Never break on any screen width 320px-428px |

### Typography Scale (Mobile)
```
H1: text-2xl (24px) - Page titles only
H2: text-xl (20px) - Section headers
H3: text-lg (18px) - Card titles
Body: text-base (16px) - Default
Small: text-sm (14px) - Secondary info
Caption: text-xs (12px) - Timestamps, labels
```

### Spacing System
```
xs: 4px  - Tight groupings
sm: 8px  - Related elements
md: 16px - Standard spacing
lg: 24px - Section separation
xl: 32px - Major divisions
```

---

## TEST CREDENTIALS (USE THESE)

| Role | Email/Username | Password |
|------|----------------|----------|
| **Test User** | dipali@clubconcierge.in | test123 |
| **Admin** | aditya | lola4304 |

**Preview URL:** https://pet-wrapped.preview.emergentagent.com

---

## THE 14 PILLARS (LIFE DOMAINS)

These are how a pet LIVES across its lifetime:

| # | Pillar | Purpose |
|---|--------|---------|
| 1 | **CARE** | Physical wellbeing, grooming, hygiene |
| 2 | **DINE** | Nutrition, feeding, diet |
| 3 | **STAY** | Boarding, daycare, home setup |
| 4 | **TRAVEL** | Transport, trips, relocation |
| 5 | **ENJOY** | Play, enrichment, social |
| 6 | **FIT** | Exercise, mobility, fitness |
| 7 | **LEARN** | Training, behavior, education |
| 8 | **CELEBRATE** | Birthdays, milestones, memories |
| 9 | **ADOPT** | Adoption, integration, new pets |
| 10 | **ADVISORY** | Professional guidance, consults |
| 11 | **PAPERWORK** | Documents, licenses, records |
| 12 | **EMERGENCY** | Urgent care, crisis response |
| 13 | **FAREWELL** | End-of-life, memorial |
| 14 | **SERVICES** | Execution layer (NOT a pillar!) |

**CRITICAL:** SERVICES is the "hands" that execute actions. It is NOT a life domain pillar.

---

## MIRA OS LIFE MODEL

| Layer | Purpose | Status |
|-------|---------|--------|
| **SOUL/MOJO** | Who the pet is | Implemented |
| **TODAY** | What matters now | Partial |
| **PICKS** | What should happen | Basic |
| **SERVICES** | What gets done | Working |
| **INSIGHTS** | What patterns exist | Planned |
| **LEARN** | What parent understands | Basic |
| **CONCIERGE** | When humans step in | Working |

---

## CORE DOCTRINES (NEVER VIOLATE)

### 1. Profile-First Doctrine
- Always use specific pet profile data
- NEVER assume based on breed alone
- ASK for missing information, don't guess

### 2. Remember → Ask → Confirm → Act
- REMEMBER: What you know about the pet
- ASK: Clarifying questions first
- CONFIRM: Align before acting
- ACT: Execute only after alignment

### 3. Concierge® Branding
- Always write "Concierge®" with trademark symbol
- Never say "support" or "escalation"
- Frame as premium burden relief

### 4. Products After Alignment
- Never show products on first message
- Products are optional suggestions
- Service intents = NO products by default

---

## CRITICAL FILES TO READ

| Priority | File | Purpose |
|----------|------|---------|
| P0 | `/app/memory/MIRA_OS_14_PILLARS_BIBLE.md` | Definitive pillar reference |
| P0 | `/app/memory/PICKS_ENGINE_SPEC_v1.md` | **PICKS ENGINE COMPLETE SPEC (FINAL)** |
| P0 | `/app/memory/PRD.md` | Product requirements |
| P0 | `/app/memory/MOBILE_FIRST_GOLDEN_RULES.md` | UI/UX compliance rules |
| P1 | `/app/memory/MIRA_OS_ROADMAP.md` | Enhancement roadmap |
| P1 | `/app/memory/MIRA_OS_AUDIT.md` | Current system audit |
| P1 | `/app/memory/seeds/CANONICAL_TAGS_SEED.md` | Canonical tags data |
| P1 | `/app/memory/seeds/TAG_SYNONYMS_SEED.md` | Tag synonyms mapping |
| P1 | `/app/memory/seeds/SERVICE_TYPES_SPEC.md` | Service types spec |
| P2 | `/app/memory/PICKS_ENGINE_SPEC_v1_ORIGINAL_DISCUSSION.md` | Original v1 spec for reference |
| P2 | `/app/backend/server.py` | Core backend logic |
| P2 | `/app/backend/mira_routes.py` | Chat & pillar detection |

---

## KEY TECHNICAL INFO

### Backend
- **Framework:** FastAPI (Python)
- **Database:** MongoDB (motor async)
- **LLM:** Claude/GPT via emergentintegrations

### Frontend
- **Framework:** React 18
- **UI:** Tailwind CSS + Shadcn/UI
- **State:** React hooks (custom hooks in `/hooks/mira/`)

### API Base
- All API routes prefixed with `/api`
- Backend runs on port 8001 internally
- Use `REACT_APP_BACKEND_URL` from frontend `.env`

---

## WHAT'S WORKING (Feb 2026)

| Feature | Status | Notes |
|---------|--------|-------|
| User Auth | Working | JWT-based |
| Pet Profiles | Working | Soul data integrated |
| Chat (Mira) | Working | 14 pillars detection |
| Intelligence Score | Working | Multi-source aggregation |
| Memory System | Working | Conversation extraction |
| YouTube (LEARN) | Working | API integrated |
| Service Desk | Working | Ticket creation |
| Concierge Handoff | Working | Inline cards |
| Products to Avoid | Working | Feedback loop |

---

## WHAT'S NOT COMPLETE

| Feature | Status | Blocker |
|---------|--------|---------|
| Picks Engine | Basic | Needs re-ranking logic |
| Today Surface | Planned | UI not built |
| Insights | Planned | Analytics not built |
| Full Services UI | Partial | Task tracking UI needed |
| Offline Mode | Not started | PWA setup needed |

---

## CURRENT AUDIT SCORE

**Overall: 68/100**

| Domain | Score | Priority |
|--------|-------|----------|
| Memory System | 60/100 | P1 |
| Soul Intelligence | 75/100 | P2 |
| Conversational Context | 75/100 | P2 |
| Picks Engine | 35/100 | P0 |
| Services Execution | 50/100 | P1 |
| Proactive System | 40/100 | P1 |
| 14 Pillars Coverage | 55/100 | P2 |
| UI/UX Mobile | 80/100 | P1 |
| Infrastructure | 95/100 | - |

---

## ENHANCEMENT ROADMAP LOCATION

See `/app/memory/MIRA_OS_ROADMAP.md` for full roadmap with:
- P0 Critical (This Sprint)
- P1 High Priority (Next Sprint)
- P2 Medium Priority (Backlog)
- P3 Future (Wishlist)

---

*Last Updated: February 12, 2026*
*Status: PRODUCTION (Core) | Mobile-First Target: 100%*

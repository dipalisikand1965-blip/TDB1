# The Doggy Company - Product Requirements Document

## Original Problem Statement
Building **The Doggy Company**, a "Pet Life Operating System" designed as a pet-first platform. Core vision: "vision-first, commerce-later" approach, centered around "Pet Soul™" and "Mira® AI" concierge.

---

## Pet Pass System

### Plans
1. **Pet Pass — Trial** (1 month): ₹499 + GST
2. **Pet Pass — Foundation** (12 months): ₹4,999 + GST
3. **Additional pets**: ₹2,499/year or ₹249/trial + GST

### Member Tiers
| Tier | Emoji | Criteria |
|------|-------|----------|
| Curious Pup | 🐕 | New members |
| Loyal Companion | 🦮 | 2+ pillars OR 3+ months |
| Trusted Guardian | 🛡️ | 5+ pillars OR 6+ months |
| Pack Leader | 👑 | 8+ pillars OR 12+ months |

---

## What's Been Implemented (January 2026)

### Session 6: Major UX Improvements (January 25, 2026) ✅

**Logo & Branding:**
- NEW custom AI-generated logo with concierge bell + colorful paw
- Location: `/app/frontend/public/logo-new.png`

**Pet Soul Navigation (FIXED):**
- ✅ Pet Soul folder cards are now clickable - expand to show details
- ✅ "Fill More Questions" button added - navigates to `/pet-soul-journey/{petId}?section={pillar}`
- ✅ "View Full Soul" link fixed - navigates to `/pet-soul-journey/{petId}`
- ✅ All 14 Life Pillars added to My Account dashboard page

**Sign-Up Links for Non-Logged Users:**
- ✅ MiraContextPanel: "Join Pet Pass" + "Already a member? Sign in" buttons
- ✅ MiraPage sidebar: Same sign-up CTA buttons
- ✅ MiraAI welcome message: Clickable markdown links to /membership and /login

**Customer Name Capture for Tickets (FIXED):**
- ✅ Added `extract_contact_info()` function in `mira_routes.py`
- ✅ Extracts name, email, phone from user messages
- ✅ Updates ticket member info when detected
- ✅ Non-logged users now labeled "Website Visitor" (was "Guest")

**Admin Docs Updated:**
- ✅ Pet Pass section rewritten with new pricing, tiers, password reset flow

### Previous Sessions
- Session 1-5: Core Pet Pass Flow, My Pets Overhaul, Soul Score Consistency, Critical Bug Fixes (see previous entries)

---

## Navigation Architecture

See `/app/memory/NAVIGATION_ARCHITECTURE.md` for detailed flow diagrams.

### Key User Flows

```
Homepage → Login → Homepage (logged in)
                     ↓
              My Account (/dashboard)
                     ↓
              My Pets (/my-pets)
                     ↓
         Pet Soul Journey (/pet-soul-journey/{petId})
```

### Key Pages
| Page | Route | Purpose |
|------|-------|---------|
| Homepage | `/` | Landing, pillar navigation |
| Login | `/login` | Authentication |
| Membership | `/membership` | Pet Pass plans, Pet Soul summary |
| My Account | `/dashboard` | Dashboard, 14 pillars, activity |
| My Pets | `/my-pets` | Pet list |
| Pet Soul Journey | `/pet-soul-journey/{petId}` | Questionnaire |

---

## 14 Life Pillars
| Pillar | Icon | Path |
|--------|------|------|
| Feed | 🍖 | /feed |
| Celebrate | 🎂 | /celebrate |
| Dine | 🍽️ | /dine |
| Stay | 🏨 | /stay |
| Travel | ✈️ | /travel |
| Care | 🩺 | /care |
| Groom | ✂️ | /groom |
| Play | 🎾 | /play |
| Train | 🎓 | /train |
| Insure | 🛡️ | /insure |
| Adopt | 🐕 | /adopt |
| Farewell | 🌈 | /farewell |
| Shop | 🛒 | /products |
| Community | 👥 | /community |

---

## 8 Pet Soul Pillars (Questionnaire Categories)

| Pillar | Key | Questions About |
|--------|-----|-----------------|
| Identity & Temperament | identity_temperament | Personality, nature |
| Family & Pack | family_pack | Family members, other pets |
| Rhythm & Routine | rhythm_routine | Daily schedule |
| Home Comforts | home_comforts | Sleep, favorite spots |
| Travel Style | travel_style | Car rides, carriers |
| Taste & Treat | taste_treat | Food preferences |
| Training & Behaviour | training_behaviour | Commands, training |
| Long Horizon | long_horizon | Health, vet visits |

---

## Prioritized Backlog

### P0 - Critical (Completed ✅)
- ~~Session Persistence~~ ✅
- ~~Soul Score Consistency~~ ✅
- ~~Logo redesign~~ ✅
- ~~Pet Soul folders clickable~~ ✅
- ~~Sign-up links in Mira~~ ✅
- ~~Customer name capture~~ ✅

### P1 - High Priority
1. Complete 'Adopt' Pillar registration
2. Pet Pass Renewal Reminders integration (email scheduling)
3. Service Desk - ensure customer name always visible

### P2 - Medium Priority
1. "Untitled" Products from Shopify Sync
2. Build 'Farewell' and 'Shop' Pillars
3. Member Tier Graduation logic

### P3 - Lower Priority
1. WhatsApp Business API integration
2. Complete backend refactoring

---

## Test Credentials
- **Test User Email**: dipali@clubconcierge.in
- **Test User Password**: lola4304
- **Admin Username**: aditya
- **Admin Password**: lola4304

---

*Last updated: January 25, 2026*

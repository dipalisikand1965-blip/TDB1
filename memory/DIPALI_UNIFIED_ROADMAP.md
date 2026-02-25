# THE DOGGY COMPANY - UNIFIED ROADMAP
## Two Journeys, One Soul Foundation
## For: Dipali (Founder)
## Created: February 19, 2026

---

# THE VISION

> "Every pet gets a soul in the digital world. Free users get a beautiful OS. 
> Paid users get a brilliant, memory-driven companion who never forgets."

---

# PHASE 0: THE FOUNDATION (Both Journeys Share This)

## The Soul Capture Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SOUL FOUNDATION                                     │
│                    (Every user starts here)                                  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 1: DISCOVERY                                                          │
│  "Let Me Know Your Pet"                                                     │
│  ─────────────────────────────────────────────────────────────────────────  │
│  • Pet name                                                                 │
│  • Pet photo (optional but encouraged)                                      │
│  • Species (dog/cat)                                                        │
│  • Breed (autocomplete from 64 breeds)                                      │
│  • Age / Birthday                                                           │
│  • Gender / Neutered status                                                 │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 2: PERSONALITY (Soul Questions - Light Version)                       │
│  "Tell me about their personality"                                          │
│  ─────────────────────────────────────────────────────────────────────────  │
│  • Energy level (Low / Medium / High)                                       │
│  • Temperament (Calm / Playful / Anxious)                                   │
│  • Social with other dogs? (Yes / No / Sometimes)                           │
│  • Any health conditions? (Free text)                                       │
│  • Any allergies? (Common allergens checklist)                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 3: CONTACT & ACCOUNT                                                  │
│  "Let's create your Pet OS"                                                 │
│  ─────────────────────────────────────────────────────────────────────────  │
│  • Email                                                                    │
│  • Phone (for WhatsApp updates)                                             │
│  • Password                                                                 │
│  • Location (city) for local recommendations                                │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 4: WELCOME TO PET OS                                                  │
│  "Your Pet Soul is now {X}% complete!"                                      │
│  ─────────────────────────────────────────────────────────────────────────  │
│  • Show Soul Score (gamification!)                                          │
│  • Show what's unlocked                                                     │
│  • Offer: "Complete more to unlock premium features"                        │
│  • CTA: "Explore Pillars" or "Upgrade to Mira OS"                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
                    ▼                               ▼
            FREEMIUM PATH                     PAID PATH
```

---

# JOURNEY 1: FREEMIUM (Pet OS / POS)

## What Free Users Get

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FREEMIUM FEATURES                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  ✅ Pet Profile & Records                                                   │
│  ✅ Basic Soul Score                                                        │
│  ✅ Access to ALL 14 Pillar Pages                                           │
│  ✅ Mira FAB (MiraOSTrigger) on each pillar                                │
│  ✅ Product browsing & ordering                                             │
│  ✅ Service browsing & requesting                                           │
│  ✅ Basic Concierge support (ticket creation)                               │
│  ✅ Order tracking                                                          │
│  ✅ Notifications                                                           │
│  ✅ Member Dashboard                                                        │
│  ─────────────────────────────────────────────────────────────────────────  │
│  ❌ NO: Deep personalized picks                                             │
│  ❌ NO: Full memory (Mira asks again)                                       │
│  ❌ NO: Today alerts                                                        │
│  ❌ NO: Premium Concierge (C° hands)                                        │
│  ❌ NO: Learn recommendations                                               │
│  ❌ NO: Insights & patterns                                                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Freemium User Flow

```
    After Soul Foundation...
           │
           ▼
┌─────────────────────────────┐
│   MEMBER DASHBOARD          │
│   /dashboard                │
│   ─────────────────────     │
│   • Pet selector            │
│   • Soul score visible      │
│   • Quick links to pillars  │
│   • Upgrade CTA             │
└─────────────────────────────┘
           │
           │ User explores...
           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           14 PILLAR PAGES                                    │
│   /celebrate, /dine, /stay, /travel, /care, /enjoy, /fit, /learn,          │
│   /paperwork, /advisory, /emergency, /farewell, /adopt, /shop              │
├─────────────────────────────────────────────────────────────────────────────┤
│   Each pillar has:                                                          │
│   • PillarPageLayout (soulful hero with pet photo)                         │
│   • MiraOSTrigger (Mira FAB button)                                        │
│   • Products section                                                        │
│   • Services section                                                        │
│   • Concierge Experiences                                                   │
└─────────────────────────────────────────────────────────────────────────────┘
           │
           │ User clicks Mira FAB...
           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MIRA OS MODAL                                        │
│   (The good Mira - MiraOSModal.jsx)                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│   • Chat interface                                                          │
│   • Pet context aware                                                       │
│   • Quick replies                                                           │
│   • Can create service requests                                             │
│   • Basic concierge handoff                                                 │
└─────────────────────────────────────────────────────────────────────────────┘
           │
           │ User requests something...
           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    UNIFIED SERVICE FLOW                                      │
│   (The Spine - service_desk_tickets)                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│   1. User Request → Service Desk Ticket (TCK-YYYY-NNNNNN)                   │
│   2. Admin Notification → Admin sees in /admin                              │
│   3. Member Notification → User sees in /notifications                      │
│   4. Pillar Request → Routed to correct pillar queue                        │
│   5. Agent handles → Updates ticket                                         │
│   6. User notified → Can reply in /tickets/:ticketId                        │
└─────────────────────────────────────────────────────────────────────────────┘
           │
           │ Throughout journey...
           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      UPGRADE PROMPTS                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│   "Complete your Soul to unlock personalized picks"                         │
│   "Upgrade to Mira OS for a memory-driven experience"                       │
│   "Members get priority Concierge support"                                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# JOURNEY 2: PAID (Mira OS / Mojo OS)

## What Paid Users Get (Everything Free + More)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PAID FEATURES                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  ✅ Everything in Freemium PLUS:                                            │
│  ─────────────────────────────────────────────────────────────────────────  │
│  ✅ Full Mira OS (/mira-demo)                                               │
│  ✅ Deep Soul (55+ questions)                                               │
│  ✅ Memory-driven experience (Mira never asks twice)                        │
│  ✅ Personalized Picks (refreshes every turn)                               │
│  ✅ Today Layer (time-sensitive alerts)                                     │
│  ✅ Services Layer (task tracking)                                          │
│  ✅ Learn Layer (personalized education)                                    │
│  ✅ Insights Layer (patterns over time)                                     │
│  ✅ Full Concierge with C° button                                           │
│  ✅ Priority support                                                        │
│  ✅ Paw Points rewards                                                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Paid User Flow

```
    After Soul Foundation + Payment...
           │
           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MIRA OS (/mira-demo)                                 │
│                    "The Brilliant Pet Life OS"                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                        HEADER SHELL                                 │   │
│   │   Pet Avatar (soul rings) │ Search │ Notifications │ Settings      │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                         TAB BAR                                     │   │
│   │   Today │ Picks │ Services │ Learn │ C°                            │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│   ┌──────────────────────────────────┬──────────────────────────────────┐   │
│   │         CHAT CANVAS              │         PICKS PANEL              │   │
│   │   (Always present underneath)    │   (Refreshes every turn)         │   │
│   │                                  │                                  │   │
│   │   - Apple iMessage style         │   - Personalized to pet          │   │
│   │   - Voice input                  │   - Catalogue + Concierge picks  │   │
│   │   - Quick replies                │   - Service cards                │   │
│   │   - Memory-aware responses       │   - "Why this?" explanations     │   │
│   │                                  │                                  │   │
│   └──────────────────────────────────┴──────────────────────────────────┘   │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                      LAYERS (Overlay)                               │   │
│   │   Today: Urgent/due items        Services: Active tasks             │   │
│   │   Learn: Education               C°: Human concierge threads        │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# THE ROADMAP: ONE THING AT A TIME

## PRIORITY ORDER (As Per Dipali's Request)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  🟢 PHASE 1: FINISH FREEMIUM ONBOARDING                                     │
│  (Current Focus)                                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Task 1.1: Fix the Onboarding Flow                                          │
│  ───────────────────────────────────────────────────────────────────────    │
│  • Current: /join, /pet-soul-onboard (MembershipOnboarding.jsx)             │
│  • Problem: Goes straight to dashboard, soul capture incomplete             │
│  • Solution: Gamify onboarding, capture soul BEFORE dashboard               │
│  • Files: MembershipOnboarding.jsx, AuthContext.jsx, Login.jsx              │
│                                                                             │
│  Task 1.2: Create "Pet OS Home" after onboarding                            │
│  ───────────────────────────────────────────────────────────────────────    │
│  • New landing for logged-in users                                          │
│  • Show pet profile prominently                                             │
│  • Show soul score with "complete more" CTA                                 │
│  • Quick access to all 14 pillars                                           │
│  • Mira available but not overwhelming                                      │
│                                                                             │
│  Task 1.3: Ensure all Pillar Pages are "Magical"                            │
│  ───────────────────────────────────────────────────────────────────────    │
│  • Use /celebrate-new as template                                           │
│  • All 14 pillars should have:                                              │
│    - PillarPageLayout with soulful hero                                     │
│    - MiraOSTrigger (Mira FAB)                                               │
│    - Concierge button positioned correctly                                  │
│    - No duplicate Mira buttons                                              │
│                                                                             │
│  Task 1.4: Verify Unified Service Flow                                      │
│  ───────────────────────────────────────────────────────────────────────    │
│  • Every request → Service Desk Ticket                                      │
│  • Admin sees in /admin Service Desk                                        │
│  • User sees in /notifications                                              │
│  • Reply flow works end-to-end                                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  🟡 PHASE 2: MAKE PAID BRILLIANT                                            │
│  (After Freemium is solid)                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Task 2.1: Rebuild MiraDemoPage with MiraOSModal                            │
│  ───────────────────────────────────────────────────────────────────────    │
│  • Current: 198KB monolith                                                  │
│  • Solution: Extract components, use MiraOSModal as base                    │
│  • Keep: Today, Picks, Services, Learn, Concierge layers                    │
│  • Add: Deep personalization, memory-driven responses                       │
│                                                                             │
│  Task 2.2: Fix Memory/Intent Persistence                                    │
│  ───────────────────────────────────────────────────────────────────────    │
│  • Bug: user_learn_intents not persisting (only 6 docs!)                    │
│  • Fix: Debug upsert logic in mira_routes.py                                │
│  • Test: Verify soul answers persist across sessions                        │
│                                                                             │
│  Task 2.3: Implement Full Picks Engine                                      │
│  ───────────────────────────────────────────────────────────────────────    │
│  • Picks refresh every chat turn                                            │
│  • Use Pet Context Pack                                                     │
│  • Catalogue-first, Concierge-always                                        │
│                                                                             │
│  Task 2.4: Polish Today Layer                                               │
│  ───────────────────────────────────────────────────────────────────────    │
│  • Time-sensitive alerts                                                    │
│  • Due items                                                                │
│  • Proactive suggestions                                                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  🔴 PHASE 3: UNIFICATION & CLEANUP                                          │
│  (Technical debt)                                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Task 3.1: Remove MiraChatWidget from entire codebase                       │
│  ───────────────────────────────────────────────────────────────────────    │
│  • Files still using it: MealsPage, PetSoulPage, ProductDetailPage,         │
│    ProductListing, ServiceDetailPage, ServicesPage, ShopPage                │
│  • Replace with MiraOSTrigger                                               │
│                                                                             │
│  Task 3.2: Break up server.py monolith                                      │
│  ───────────────────────────────────────────────────────────────────────    │
│  • Current: Single massive file                                             │
│  • Solution: Domain-specific route files                                    │
│                                                                             │
│  Task 3.3: Clean up duplicate pages                                         │
│  ───────────────────────────────────────────────────────────────────────    │
│  • CelebratePage vs CelebrateNewPage                                        │
│  • MiraDemoPage vs MiraDemoOriginalPage vs MiraDemoBackupPage               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# IMMEDIATE NEXT STEPS (Today)

## Step 1: Understand Current Onboarding
- [ ] Review `/join` and `/pet-soul-onboard` routes
- [ ] Review `MembershipOnboarding.jsx`
- [ ] Document what's missing

## Step 2: Design Gamified Onboarding
- [ ] Map the ideal 4-step flow
- [ ] Identify which soul questions to ask upfront
- [ ] Design soul score visibility

## Step 3: Implement Changes
- [ ] Update onboarding flow
- [ ] Create "Pet OS Home" after login
- [ ] Test end-to-end

---

# SUCCESS METRICS

## Freemium Success
| Metric | Target |
|--------|--------|
| Onboarding completion | 80%+ |
| Soul score at signup | 30%+ |
| Pillar page engagement | 3+ pillars visited |
| Service request created | 50%+ of users |

## Paid Success
| Metric | Target |
|--------|--------|
| Soul score | 60%+ |
| Mira memory usage | Never asks known data |
| Picks relevance | 90%+ relevant |
| User satisfaction | 4.8/5 |

---

*This roadmap is your north star. One phase at a time.*
*Last Updated: February 19, 2026*

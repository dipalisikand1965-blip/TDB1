# Advisory & Learn Pillar Audit
**Date:** March 10, 2026
**Status:** Audit Complete - Redesign Required

---

## CURRENT STATE AUDIT

### Learn Page - Current Structure
| Section | What Exists | Status |
|---------|-------------|--------|
| Hero | "Learning with Your Pet" + tabs | ✅ Good |
| Ask Mira | "Have a question about your pet?" + AI Assistant | ✅ Excellent |
| Quick Topics | Puppy biting, Leash pulling, Separation anxiety, House training, Barking | ✅ Good |
| Categories | All Learn, Training Aids, Puzzles, Books | ⚠️ Product-focused, not guidance-focused |
| Concierge Experiences | Behavior Architect, Puppy Foundations, Advanced Skills, Rescue Rehabilitation | ✅ Good |

**Learn Page Assessment:** 7/10 - Has good "Ask Mira" functionality but could use more guided paths

### Advisory Page - Current Structure
| Section | What Exists | Status |
|---------|-------------|--------|
| Hero | "Guidance for Your Pet - When clarity helps before deciding" | ⚠️ Generic |
| Categories | All Advisory, Nutrition, Behavior, Health | ⚠️ Limited scope |
| Intent Tiles | Behaviour, Nutrition, Senior, New, Health, Training | ✅ Good start |
| Featured Experts | Advisors ready to help | ✅ Service-focused |
| Products & Bundles | Consultation Bundles | ✅ Okay |

**Advisory Page Assessment:** 5/10 - Too consultant/booking focused, not decision-support focused

---

## GAP ANALYSIS: Advisory vs Vision

### What We Have (Current)
1. Generic service booking interface
2. Advisor listings with consultation fees
3. Basic category filters (Behaviour, Nutrition, Senior, New, Health, Training)
4. Products shown without personalization context
5. No "Ask Advisory" AI decision engine
6. No "My Dog Advisory" personalized section
7. No guided decision paths (Puppy, Adoption, Senior, Travel, etc.)
8. No Near Me services
9. No seasonal/moment-based advice

### What We Need (Vision)
1. **Ask Advisory** - AI decision-support hero section
2. **My Dog Advisory** - Personalized recommendations based on Soul profile
3. **Intent Tiles** - Expanded from 6 to 12+ real-life needs
4. **Guided Paths** - Step-by-step decision journeys
5. **5 Zones Architecture:**
   - Zone 1: Guidance (educational, practical)
   - Zone 2: Concierge (help me decide, escalation)
   - Zone 3: Location (Google Places nearby services)
   - Zone 4: Products (advisory-style, not salesy)
   - Zone 5: Services (consultation, expert access)

---

## PROPOSED ADVISORY PAGE ARCHITECTURE

### Zone 1: HERO - Ask Advisory
```
┌─────────────────────────────────────────────────────────────────┐
│  What would you like help deciding for your dog?                │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ [AI Search Box] "Best food for my Shih Tzu puppy"           ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  Examples: Best food for my senior Lab | What bed should I buy  │
│           | My dog gets anxious in cars | What to buy for       │
│           | a rescue Indie                                      │
└─────────────────────────────────────────────────────────────────┘
```

### Zone 2: MY DOG ADVISORY (Personalized)
```
┌─────────────────────────────────────────────────────────────────┐
│  🐕 Advice for [Pet Name] Today                                 │
│  ─────────────────────────────────────────────────────────────  │
│  Based on: [Breed] • [Age] • [Size] • [Season: Summer]          │
│                                                                 │
│  [Senior comfort suggestions]  [Summer heat care for Labs]      │
│  [Joint-care essentials]       [Recommended products]           │
│  [Travel prep for next month]  [Services you might need]        │
└─────────────────────────────────────────────────────────────────┘
```

### Zone 3: INTENT TILES (12 Categories)
```
┌────────────────────────────────────────────────────────────────┐
│  Food & Nutrition     │  Puppy Guidance      │  Breed Guidance │
│  Grooming & Coat Care │  Behaviour & Training│  Travel Ready   │
│  Senior Dog Care      │  Home Setup          │  New Adoption   │
│  Product Advice       │  Recovery & Care     │  Speak to       │
│                       │                      │  Concierge      │
└────────────────────────────────────────────────────────────────┘
```

### Zone 4: GUIDED PATHS
```
┌───────────────────────────────────────────────────────────────┐
│  NEW PUPPY PATH                                               │
│  ─────────────────                                            │
│  ○ What to buy first → ○ What to feed → ○ First grooming     │
│  ○ Vaccine tracker → ○ Toilet training → ○ First bed/bowls   │
│                                                               │
│  SENIOR DOG PATH                                              │
│  ───────────────                                              │
│  ○ Mobility → ○ Comfort → ○ Diet → ○ Sleep → ○ Recovery     │
│                                                               │
│  TRAVEL READY PATH                                            │
│  ─────────────────                                            │
│  ○ Is my dog fit? → ○ Documents → ○ Harness/Crate →          │
│  ○ Food/Hydration → ○ Local vet support while away           │
└───────────────────────────────────────────────────────────────┘
```

### Zone 5: PRODUCTS BY CONTEXT
```
┌─────────────────────────────────────────────────────────────┐
│  Products for [Pet Name]'s Needs                            │
│  (Not "all products" - only relevant to the dog's situation)│
│                                                             │
│  Categories:                                                │
│  • Food & Feeding (slow feeders, raised bowls)              │
│  • Grooming (breed-specific brushes, shampoos)              │
│  • Home & Comfort (orthopedic beds, cooling mats)           │
│  • Behaviour & Enrichment (puzzle toys, lick mats)          │
│  • Travel (harnesses, carriers, cooling gear)               │
│  • Puppy/Adoption (starter kits, first essentials)          │
│  • Senior Care (ramps, support harness, soft blankets)      │
└─────────────────────────────────────────────────────────────┘
```

### Zone 6: SERVICES & EXPERT ACCESS
```
┌─────────────────────────────────────────────────────────────┐
│  Services We Recommend                                       │
│  • Grooming consultation                                     │
│  • Trainer consultation                                      │
│  • Nutrition guidance                                        │
│  • Behaviour support                                         │
│  • Puppy prep support                                        │
│  • Adoption onboarding support                               │
│  • Travel prep support                                       │
│  • Senior care setup                                         │
│  • Pet parent coaching                                       │
│  • Concierge help with sourcing                              │
└─────────────────────────────────────────────────────────────┘
```

### Zone 7: NEAR ME (Google API)
```
┌─────────────────────────────────────────────────────────────┐
│  Nearby Services for [Pet Name]                             │
│  [Use current location] [Search any city]                   │
│                                                             │
│  Filters: Nearest | Highest rated | Open now | Home service │
│                                                             │
│  Categories:                                                │
│  • Groomers                                                 │
│  • Trainers                                                 │
│  • Pet stores                                               │
│  • Specialist vets                                          │
│  • Boarding/Daycare                                         │
│  • Physiotherapy/Hydrotherapy                               │
│  • Pet taxis                                                │
└─────────────────────────────────────────────────────────────┘
```

### Zone 8: CONCIERGE ESCALATION
```
┌─────────────────────────────────────────────────────────────┐
│  Need help deciding?                                        │
│  Our Concierge can:                                         │
│  ✓ Shortlist the right products                             │
│  ✓ Help choose between options                              │
│  ✓ Find expert services                                     │
│  ✓ Compare trainers/groomers/boarders                       │
│  ✓ Create a puppy starter list                              │
│  ✓ Plan a travel kit                                        │
│  ✓ Build a senior care setup                                │
│  ✓ Source harder-to-find items                              │
│                                                             │
│  [Talk to Concierge®]                                       │
└─────────────────────────────────────────────────────────────┘
```

---

## PERSONALIZATION LOGIC

Advisory recommendations should adapt by:
- **Breed** - Flat-face heat caution, double-coat shedding, etc.
- **Age** - Puppy, adult, senior
- **Size** - Small, medium, large products
- **Coat type** - Grooming frequency, tools
- **Energy level** - Activity recommendations
- **Temperament** - Anxiety, confidence training
- **Travel comfort** - Car sickness, crate training
- **Health flags** - Allergies, joint issues, recovery
- **City/Climate** - Summer heat, monsoon care
- **Life stage** - New adoption, first heat, neutering, old age
- **Past orders** - What they already have
- **Upcoming events** - Birthdays, travel planned

---

## IMPLEMENTATION PRIORITY

| Phase | What to Build | Priority |
|-------|---------------|----------|
| 1 | Ask Advisory AI Hero | P0 |
| 2 | My Dog Advisory (Personalized) | P0 |
| 3 | 12 Intent Tiles | P0 |
| 4 | Guided Paths (Puppy, Senior, Travel, Adoption) | P1 |
| 5 | Products by Context | P1 |
| 6 | Services & Expert Access | P1 |
| 7 | Near Me (Google API) | P2 |
| 8 | Concierge Escalation | P1 |
| 9 | Seasonal/Moment-based advice | P2 |

---

## KEY DIFFERENCE FROM CURRENT

| Aspect | Current | New Vision |
|--------|---------|------------|
| Primary Purpose | Book consultants | Help decide |
| Content Focus | Services listing | Decision support |
| Products | Generic display | Context-aware recommendations |
| Personalization | None | Deep Soul-based |
| User Journey | Browse → Book | Ask → Guide → Decide → Act |
| AI Role | None | Central to experience |

---

## THE ONE SENTENCE THAT DEFINES ADVISORY

> **Advisory is the place where a pet parent comes when they don't just want to buy something, they want to make the right decision for their dog.**

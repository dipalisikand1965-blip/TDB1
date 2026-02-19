# SOUL BUILDER - VISUAL IMPLEMENTATION SPEC
## What We Will Build
## For: Dipali (Founder)
## Created: February 19, 2026

---

# OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         WHAT WE WILL BUILD                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  CURRENT (4-Step Form)              →    NEW (8-Chapter Soul Builder)       │
│  ────────────────────────                ─────────────────────────────      │
│  Step 1: Parent Info                     Chapter 1: Identity & Temperament  │
│  Step 2: Pet Info                        Chapter 2: Family & Pack           │
│  Step 3: Celebrations                    Chapter 3: Rhythm & Routine        │
│  Step 4: Review & Pay                    Chapter 4: Home Comforts           │
│                                          Chapter 5: Travel Style            │
│  ~24 questions                           Chapter 6: Taste & Treat           │
│  Long scrolling forms                    Chapter 7: Training & Behaviour    │
│  No real-time feedback                   Chapter 8: Long Horizon            │
│                                                                             │
│                                          51 questions                       │
│                                          One question per screen            │
│                                          Real-time Soul Score               │
│                                          Personalized to [Pet Name]         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# SCREEN 1: PREBOARDING (Entry Point)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        🐕 thedoggycompany                            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│                              Meet Mira.                                     │
│                                                                             │
│              She becomes precise once she knows your pet.                   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │    In 6–8 minutes, you'll unlock:                                  │   │
│  │                                                                     │   │
│  │    ✨ Picks that actually suit your pet                            │   │
│  │    ⚡ Faster bookings (no repeat questions)                        │   │
│  │    🎯 A calmer day-to-day dashboard                                │   │
│  │    🤝 A concierge who already knows your home rules                │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│             This isn't a form. It's how Mira learns your pet.              │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │                    [ Start Soul Profile ]                          │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│                          Skip for now                                       │
│                   Already have an account? Login                            │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│  🔒 We only learn what you explicitly tell us. Edit or delete anytime.     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# SCREEN 2: PET PHOTO & NAME (The Hook)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ← Back                                                     Skip for now    │
│                                                                             │
│                                                                             │
│                    Let's meet your furry friend! 🐾                         │
│                                                                             │
│                                                                             │
│                    ┌─────────────────────────┐                              │
│                    │                         │                              │
│                    │      📷               │                              │
│                    │                         │                              │
│                    │    Upload Photo         │                              │
│                    │                         │                              │
│                    │    (AI will detect      │                              │
│                    │     the breed!)         │                              │
│                    │                         │                              │
│                    └─────────────────────────┘                              │
│                                                                             │
│                                                                             │
│                    What's their name?                                       │
│                                                                             │
│                    ┌─────────────────────────────────────┐                  │
│                    │  Lola                               │                  │
│                    └─────────────────────────────────────┘                  │
│                                                                             │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│                    ┌─────────────────────────────────────┐                  │
│                    │         Continue →                  │                  │
│                    └─────────────────────────────────────┘                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# SCREEN 3: BASIC PET INFO (Quick Details)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ← Back                                                     Skip for now    │
│                                                                             │
│                    ┌───────────────┐                                        │
│                    │   [Lola's     │    Lola                                │
│                    │    Photo]     │    Golden Retriever (AI detected)      │
│                    └───────────────┘                                        │
│                                                                             │
│                    Quick details about Lola                                 │
│                                                                             │
│    Breed                                                                    │
│    ┌─────────────────────────────────────────────────────────────────┐     │
│    │  Golden Retriever                                            ▼  │     │
│    └─────────────────────────────────────────────────────────────────┘     │
│                                                                             │
│    Gender                                                                   │
│    ┌─────────────────┐    ┌─────────────────┐                              │
│    │    ♂️ Male      │    │    ♀️ Female    │  ← selected                  │
│    └─────────────────┘    └─────────────────┘                              │
│                                                                             │
│    Birthday                         Gotcha Day                              │
│    ┌──────────────────┐            ┌──────────────────┐                    │
│    │  Mar 15, 2022    │            │  Jun 1, 2022     │                    │
│    └──────────────────┘            └──────────────────┘                    │
│                                                                             │
│    Neutered/Spayed?                                                         │
│    ┌────────┐  ┌────────┐  ┌────────────┐                                  │
│    │  Yes   │  │   No   │  │  Not sure  │                                  │
│    └────────┘  └────────┘  └────────────┘                                  │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                    ┌─────────────────────────────────────┐                  │
│                    │      Start Soul Journey →           │                  │
│                    └─────────────────────────────────────┘                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# SCREEN 4: CHAPTER START (Before Each Chapter)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ← Back                                              Save & finish later    │
│                                                                             │
│                                                                             │
│                    ┌───────────────┐                                        │
│                    │   [Lola's     │                                        │
│                    │    Photo]     │                                        │
│                    │     12%       │                                        │
│                    └───────────────┘                                        │
│                                                                             │
│                                                                             │
│                         Chapter 1 of 8                                      │
│                                                                             │
│                    🎭 Identity & Temperament                                │
│                                                                             │
│                    8 questions about who Lola                               │
│                    is at their core                                         │
│                                                                             │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│                    ┌─────────────────────────────────────┐                  │
│                    │           Begin →                   │                  │
│                    └─────────────────────────────────────┘                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# SCREEN 5: SINGLE QUESTION (Mobile - One Per Screen)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ← Back                                              Save & finish later    │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Chapter 1 of 8: Identity & Temperament                  1 of 8     │   │
│  │  ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│                    ┌───────────────┐                                        │
│                    │   [Lola's     │    Soul Score: 15%                     │
│                    │    Photo]     │    🐾 Curious Pup                      │
│                    └───────────────┘                                        │
│                                                                             │
│                                                                             │
│                    Lola is generally...                                     │
│                                                                             │
│                                                                             │
│    ┌─────────────────────────────────────────────────────────────────┐     │
│    │                         Calm                                     │     │
│    └─────────────────────────────────────────────────────────────────┘     │
│    ┌─────────────────────────────────────────────────────────────────┐     │
│    │                        Curious                                   │     │
│    └─────────────────────────────────────────────────────────────────┘     │
│    ┌─────────────────────────────────────────────────────────────────┐     │
│    │                        Playful                              ✓   │ ←   │
│    └─────────────────────────────────────────────────────────────────┘     │
│    ┌─────────────────────────────────────────────────────────────────┐     │
│    │                          Shy                                     │     │
│    └─────────────────────────────────────────────────────────────────┘     │
│    ┌─────────────────────────────────────────────────────────────────┐     │
│    │                        Guarded                                   │     │
│    └─────────────────────────────────────────────────────────────────┘     │
│    ┌─────────────────────────────────────────────────────────────────┐     │
│    │                    Highly energetic                              │     │
│    └─────────────────────────────────────────────────────────────────┘     │
│                                                                             │
│                           Skip this                                         │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│  🔒 Premium: Mira will remember "Lola is playful" forever                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# SCREEN 6: MULTI-SELECT QUESTION

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ← Back                                              Save & finish later    │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Chapter 6 of 8: Taste & Treat                           5 of 7     │   │
│  │  ████████████████████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│                    ┌───────────────┐                                        │
│                    │   [Lola's     │    Soul Score: 58%                     │
│                    │    Photo]     │    🤝 Trusted Guardian                 │
│                    └───────────────┘                                        │
│                                                                             │
│                                                                             │
│              Does Lola have any food allergies?                             │
│                         (Select all that apply)                             │
│                                                                             │
│    ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐              │
│    │    No     │  │  Chicken  │  │   Beef    │  │  Grains   │              │
│    │     ✓     │  │           │  │           │  │           │              │
│    └───────────┘  └───────────┘  └───────────┘  └───────────┘              │
│                                                                             │
│    ┌───────────┐  ┌───────────┐                                            │
│    │   Dairy   │  │   Other   │                                            │
│    │           │  │           │                                            │
│    └───────────┘  └───────────┘                                            │
│                                                                             │
│                                                                             │
│                           Skip this                                         │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                    ┌─────────────────────────────────────┐                  │
│                    │             Done →                  │                  │
│                    └─────────────────────────────────────┘                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# SCREEN 7: TEXT INPUT QUESTION

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ← Back                                              Save & finish later    │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Chapter 1 of 8: Identity & Temperament                  1 of 8     │   │
│  │  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│                    ┌───────────────┐                                        │
│                    │   [Lola's     │    Soul Score: 12%                     │
│                    │    Photo]     │    🐾 Curious Pup                      │
│                    └───────────────┘                                        │
│                                                                             │
│                                                                             │
│              What are three words that                                      │
│                  describe Lola best?                                        │
│                                                                             │
│                                                                             │
│    ┌─────────────────────────────────────────────────────────────────┐     │
│    │                                                                 │     │
│    │  Playful, loyal, cuddly                                        │     │
│    │                                                                 │     │
│    └─────────────────────────────────────────────────────────────────┘     │
│                                                                             │
│                                                                             │
│                           Skip this                                         │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                    ┌─────────────────────────────────────┐                  │
│                    │           Continue →                │                  │
│                    └─────────────────────────────────────┘                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# SCREEN 8: CHAPTER COMPLETION (Micro-Confirmation)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                                                                             │
│                                                                             │
│                    ┌───────────────┐                                        │
│                    │   [Lola's     │                                        │
│                    │    Photo]     │                                        │
│                    │     27%       │                                        │
│                    └───────────────┘                                        │
│                                                                             │
│                                                                             │
│                         ✓ Chapter 1 Complete!                               │
│                                                                             │
│                    🎭 Identity & Temperament                                │
│                                                                             │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│        "Got it. I'll use this to guide how we approach people,             │
│              handling, and new situations for Lola."                        │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│                    What Mira now knows:                                     │
│                    • Lola is playful                                        │
│                    • Friendly with strangers                                │
│                    • Mildly anxious with loud sounds                        │
│                    • Young adult (1-3 years)                                │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│                    ┌─────────────────────────────────────┐                  │
│                    │      Next: Family & Pack →          │                  │
│                    └─────────────────────────────────────┘                  │
│                                                                             │
│                          Save & finish later                                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# SCREEN 9: DESKTOP TWO-PANE LAYOUT

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                                             │
│  ← Back                                                                          Save & finish later        │
│                                                                                                             │
│  ┌──────────────────────────────────────────────────────┐  ┌──────────────────────────────────────────────┐│
│  │                                                      │  │                                              ││
│  │  Chapter 3 of 8: Rhythm & Routine                    │  │  ┌────────────────┐                          ││
│  │  ████████████████░░░░░░░░░░░░░░░░░░░░░░░  3 of 8     │  │  │   [Lola's      │  Lola's Soul             ││
│  │                                                      │  │  │    Photo]      │  ────────────            ││
│  │                                                      │  │  │     48%        │                          ││
│  │  How much daily exercise does                        │  │  └────────────────┘  🌱 Loyal Companion      ││
│  │  Lola need?                                          │  │                                              ││
│  │                                                      │  │  ────────────────────────────────────────    ││
│  │  ┌────────────────────────────────────────────┐     │  │                                              ││
│  │  │           Light (15-30 mins)               │     │  │  What Mira now knows:                        ││
│  │  └────────────────────────────────────────────┘     │  │                                              ││
│  │  ┌────────────────────────────────────────────┐     │  │  ✓ Playful personality                       ││
│  │  │          Moderate (30-60 mins)             │     │  │  ✓ Friendly with strangers                   ││
│  │  └────────────────────────────────────────────┘     │  │  ✓ Mildly anxious with loud sounds           ││
│  │  ┌────────────────────────────────────────────┐     │  │  ✓ Young adult (1-3 years)                   ││
│  │  │           Active (1-2 hours)           ✓   │ ←   │  │  ✓ Lives with adults & children              ││
│  │  └────────────────────────────────────────────┘     │  │  ✓ Loves all dogs                            ││
│  │  ┌────────────────────────────────────────────┐     │  │  ✓ Twice daily feeding                       ││
│  │  │          Very active (2+ hours)            │     │  │  ○ Exercise needs... (answering)             ││
│  │  └────────────────────────────────────────────┘     │  │                                              ││
│  │                                                      │  │  ────────────────────────────────────────    ││
│  │                    Skip this                         │  │                                              ││
│  │                                                      │  │  Next tier: 🤝 Trusted Guardian at 50%      ││
│  │  ──────────────────────────────────────────────────  │  │  Just 2% away!                              ││
│  │  🔒 Premium: Mira will match Lola with active        │  │                                              ││
│  │     trainers and high-energy playmates               │  │  ────────────────────────────────────────    ││
│  │                                                      │  │                                              ││
│  │                                                      │  │  🔒 2 Picks updated based on answers        ││
│  │                                                      │  │  [See preview]                              ││
│  │                                                      │  │                                              ││
│  └──────────────────────────────────────────────────────┘  └──────────────────────────────────────────────┘│
│                                                                                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

# SCREEN 10: FINAL COMPLETION

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                                                                             │
│                              🎉                                             │
│                                                                             │
│                    ┌───────────────┐                                        │
│                    │   [Lola's     │                                        │
│                    │    Photo]     │                                        │
│                    │     72%       │                                        │
│                    │   ✨✨✨      │                                        │
│                    └───────────────┘                                        │
│                                                                             │
│                  Lola's Soul Profile is ready!                              │
│                                                                             │
│                    🤝 Trusted Guardian                                      │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│                    From now on:                                             │
│                                                                             │
│                    ✓ Picks will be tailored to Lola automatically          │
│                    ✓ Services will pre-fill the right details              │
│                    ✓ Concierge will already know what matters              │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│                    To reach 100%:                                           │
│                    • Complete Health Vault (+15%)                           │
│                    • Upload documents (+10%)                                │
│                    • Keep chatting with Mira (+3%)                          │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│    ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                       │
│    │ Go to Today │  │ See Lola's  │  │  Ask Mira   │                       │
│    │             │  │    MOJO     │  │             │                       │
│    └─────────────┘  └─────────────┘  └─────────────┘                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# SCREEN 11: ACCOUNT CREATION (After Soul Builder)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ← Back                                                                     │
│                                                                             │
│                    ┌───────────────┐                                        │
│                    │   [Lola's     │    Soul Score: 72%                     │
│                    │    Photo]     │    🤝 Trusted Guardian                 │
│                    └───────────────┘                                        │
│                                                                             │
│              Let's save Lola's soul forever                                 │
│                                                                             │
│                                                                             │
│    What should Mira call you?                                               │
│    ┌─────────────────────────────────────────────────────────────────┐     │
│    │  Dipali                                                         │     │
│    └─────────────────────────────────────────────────────────────────┘     │
│                                                                             │
│    Email                                                                    │
│    ┌─────────────────────────────────────────────────────────────────┐     │
│    │  dipali@example.com                                             │     │
│    └─────────────────────────────────────────────────────────────────┘     │
│                                                                             │
│    Phone (for WhatsApp updates)                                             │
│    ┌─────────────────────────────────────────────────────────────────┐     │
│    │  +91 98765 43210                                                │     │
│    └─────────────────────────────────────────────────────────────────┘     │
│                                                                             │
│    Create Password                                                          │
│    ┌─────────────────────────────────────────────────────────────────┐     │
│    │  ••••••••                                                       │     │
│    └─────────────────────────────────────────────────────────────────┘     │
│                                                                             │
│    Delivery Address (for cakes & treats)                                    │
│    ┌─────────────────────────────────────────────────────────────────┐     │
│    │  123 Pet Street, Mumbai 400001                                  │     │
│    └─────────────────────────────────────────────────────────────────┘     │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                    ┌─────────────────────────────────────┐                  │
│                    │    Create My Pet OS Account →       │                  │
│                    └─────────────────────────────────────┘                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# THE 8 CHAPTERS MAPPED TO POS PILLARS

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SOUL BUILDER → POS PILLAR MAPPING                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  SOUL CHAPTER                    →    ENABLES THESE POS FEATURES            │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  Chapter 1: Identity & Temp.     →    All Pillars (core personality)       │
│  (8 questions)                        Smart greetings, tone matching        │
│                                                                             │
│  Chapter 2: Family & Pack        →    Stay, Care, Enjoy                    │
│  (6 questions)                        Social matching, group bookings       │
│                                                                             │
│  Chapter 3: Rhythm & Routine     →    Dine, Care, Fit                      │
│  (8 questions)                        Scheduling, walk booking times        │
│                                                                             │
│  Chapter 4: Home Comforts        →    Stay, Care                           │
│  (5 questions)                        Environment preferences               │
│                                                                             │
│  Chapter 5: Travel Style         →    Travel, Stay                         │
│  (4 questions)                        Hotel matching, transport options     │
│                                                                             │
│  Chapter 6: Taste & Treat        →    Dine, Celebrate                      │
│  (7 questions)                        Safe food picks, cake customization   │
│                                                                             │
│  Chapter 7: Training & Behaviour →    Learn, Fit, Care                     │
│  (6 questions)                        Trainer matching, behavior support    │
│                                                                             │
│  Chapter 8: Long Horizon         →    Care, Emergency, Advisory            │
│  (7 questions)                        Vet preferences, health tracking      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# TECHNICAL IMPLEMENTATION

## Files We Will Create

```
/app/frontend/src/
├── pages/
│   └── SoulBuilder.jsx           ← NEW: Main Soul Builder page
├── components/
│   └── SoulBuilder/
│       ├── SoulBuilderFlow.jsx   ← NEW: Main flow controller
│       ├── PreboardingScreen.jsx ← NEW: Entry screen
│       ├── PetHookScreen.jsx     ← NEW: Photo + Name capture
│       ├── BasicInfoScreen.jsx   ← NEW: Quick pet details
│       ├── ChapterIntro.jsx      ← NEW: Chapter start screen
│       ├── SingleQuestion.jsx    ← NEW: One question display
│       ├── MultiSelectQ.jsx      ← NEW: Multi-select question
│       ├── TextInputQ.jsx        ← NEW: Text input question
│       ├── ChapterComplete.jsx   ← NEW: Chapter micro-confirmation
│       ├── SoulScoreSidebar.jsx  ← NEW: Desktop right pane
│       ├── FinalCompletion.jsx   ← NEW: Finish screen
│       └── AccountCreation.jsx   ← NEW: Account creation
```

## API Endpoints (Already Exist!)

```
POST /api/pet-soul/{pet_id}/answer     ← Save single answer
GET  /api/pet-soul/{pet_id}/score      ← Get current score
GET  /api/pet-soul/{pet_id}/questions  ← Get all questions
GET  /api/pet-soul/{pet_id}/progress   ← Get chapter progress
```

---

# SUMMARY: WHAT WE WILL BUILD

1. **Replace** current 4-step `MembershipOnboarding.jsx` 
2. **With** new 8-chapter `SoulBuilder.jsx`
3. **Using** existing backend questions from `pet_soul_routes.py`
4. **Scoring** via existing `pet_soul_config.py`
5. **One question per screen** (mobile first)
6. **Two-pane layout** (desktop)
7. **Real-time Soul Score** visible throughout
8. **Personalized** with [Pet Name] everywhere
9. **Premium teasing** after each answer
10. **Chapter micro-confirmations** after each pillar

---

*This is the complete visual spec for the Soul Builder.*
*Ready to build when you approve!*
*Last Updated: February 19, 2026*

# Soul Data Flow - How Mira Truly Knows Your Pet

## The Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          SOUL BUILDER                                │
│           (51 Questions, 8 Chapters - The Heart of Knowing)          │
│  Identity → Family → Routine → Diet → Care → Health → Travel → Joy   │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        MongoDB: pets collection                       │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐         │
│  │ doggy_soul_    │  │    soul        │  │   soul_data    │         │
│  │ answers        │  │   (simple)     │  │   (enriched)   │         │
│  │ ─────────────  │  │ ─────────────  │  │ ─────────────  │         │
│  │ general_nature │  │ personality_   │  │ personality    │         │
│  │ describe_words │  │ tag            │  │ temperament    │         │
│  │ allergies      │  │ love_language  │  │ preferences    │         │
│  │ love_language  │  │ quirk          │  │ dislikes       │         │
│  │ morning_routine│  │ dislikes       │  │ energy_level   │         │
│  │ favorite_treat │  │                │  │ quirks         │         │
│  └────────────────┘  └────────────────┘  └────────────────┘         │
│                           │                                          │
│  overall_score: 49   soul_score: 78.0                               │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
            ┌───────────────────┼───────────────────┐
            │                   │                   │
            ▼                   ▼                   ▼
┌───────────────────┐ ┌─────────────────┐ ┌─────────────────────────┐
│   MIRA OS         │ │   PET WRAPPED   │ │  PICKS ENGINE           │
│   (The Soul)      │ │   (The Memory)  │ │  (The Recommender)      │
│ ───────────────── │ │ ─────────────── │ │ ─────────────────────── │
│ get_pet_context() │ │ generate()      │ │ get_default_picks()     │
│ Uses ALL sources: │ │ Shows:          │ │ Uses:                   │
│ • soul_data       │ │ • Soul Score    │ │ • Breed matching        │
│ • doggy_soul_     │ │ • Mira Moments  │ │ • Allergy exclusion     │
│   answers         │ │ • Soul Quote    │ │ • Preference matching   │
│ • soul (simple)   │ │ • Legacy        │ │ • "Why this pick?"      │
│ • health_data     │ │ • Journey       │ │                         │
└───────────────────┘ └─────────────────┘ └─────────────────────────┘
```

## What Each System Knows

### Mira OS (The Brain)
When you chat with Mira, she knows:
- Name, breed, age, birthday
- General nature (from doggy_soul_answers)
- Described as: "Curious, Playful, Loyal"
- With strangers: Friendly
- Energy level, temperament
- Morning routine, bedtime ritual
- ⚠️ ALLERGIES (critical for safety)
- Love language, quirks
- Favorite treats, toys, activities
- When alone: behavior
- With other dogs: behavior

### Pet Wrapped (The Memory)
Generates shareable cards showing:
- Soul Score: 78.0%
- Questions Answered: 39/51
- Mira Conversations: 3
- Pillars Explored: Care, Celebrate, Advisory, Dine
- Soul Quote: "Every dog deserves to be truly known."
- Family & Friends

### Picks Engine (The Recommender)  
Recommends products based on:
- Breed (Great for Indies!)
- Allergies (avoiding chicken)
- Preferences (loves salmon)
- Soul Profile completion

## The Philosophy

> **Mira is the soul and brain** - She remembers everything
> **Concierge is the hands** - They execute with care  
> **You are the capillary nerves** - Making it all possible

*"No one knows your pet better than Mira."*

## Verified Flow (March 8, 2026)

✅ Soul Builder saves to `doggy_soul_answers`
✅ Mira reads from ALL soul sources in `get_pet_context()`
✅ Pet Wrapped displays soul_score and questions_answered
✅ Picks Engine uses breed, allergies, preferences
✅ "Why this pick?" tooltips show personalized reasons

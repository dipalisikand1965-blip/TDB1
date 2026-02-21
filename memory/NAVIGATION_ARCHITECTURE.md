# The Doggy Company - Navigation Architecture

## Current User Flow (Simplified)

```
                    ┌─────────────────┐
                    │   Homepage (/)   │
                    │   (Public)       │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
       ┌──────────┐   ┌──────────┐   ┌──────────┐
       │ Sign In  │   │ Join Now │   │  Browse  │
       │ /login   │   │/membership│   │ Pillars │
       └────┬─────┘   └────┬─────┘   └──────────┘
            │              │
            │              │ (New User)
            ▼              ▼
     ┌─────────────────────────┐
     │     After Login         │
     │   Redirects to → /      │
     └───────────┬─────────────┘
                 │
    ┌────────────┼────────────┐
    │            │            │
    ▼            ▼            ▼
┌─────────┐ ┌─────────┐ ┌─────────┐
│My Account│ │ My Pets │ │Membership│
│/dashboard│ │/my-pets │ │/membership│
└─────────┘ └─────────┘ └────┬────┘
                              │
                              ▼
                     ┌─────────────────┐
                     │ Pet Soul Journey │
                     │/pet-soul-journey│
                     │   /{petId}      │
                     └─────────────────┘
```

## Key Pages Explained

### 1. **Homepage** (`/`)
- Landing page for all users
- Shows pillar navigation
- Logged-in users see personalized content

### 2. **Login** (`/login`)
- Email/password authentication
- Google OAuth option
- Links to "Join Now" for new users
- Links to "Forgot Password"
- **After login → Redirects to `/` (homepage)**

### 3. **Membership** (`/membership`)
- **For non-logged users**: Shows Pet Pass plans and pricing
- **For logged-in users**: Shows their Pet Pass status + Pet Soul Journey summary
- Contains the "What We Know About [Pet]" section

### 4. **My Account / Dashboard** (`/dashboard`)
- Personal dashboard for logged-in users
- Shows: Pet Pass status, loyalty points, orders, pets count
- Quick actions: My Pets, Celebrate, Shop, Ask Mira
- **All 14 Life Pillars** grid
- Recent activity

### 5. **My Pets** (`/my-pets`)
- List of all user's pets
- Pet cards with basic info
- Links to add new pet

### 6. **Pet Soul Journey** (`/pet-soul-journey/{petId}`)
- **THE MAIN QUESTIONNAIRE PAGE**
- Where users answer the 24 Pet Soul questions
- Shows progress per pillar
- Updates score in real-time as questions are answered

---

## Pet Soul Navigation Flow

```
┌────────────────────────────────┐
│  "What We Know About [Pet]"    │
│  (on /membership page)         │
│                                │
│  ┌──────────────────────────┐  │
│  │ Identity & Temperament   │──┼──► Click → Expands details
│  │ 80% complete             │  │     Shows "Fill More Questions" button
│  └──────────────────────────┘  │           │
│                                │           │
│  ┌──────────────────────────┐  │           ▼
│  │ Family & Pack            │  │     ┌─────────────────────────┐
│  │ 60% complete             │  │     │ /pet-soul-journey/{id}  │
│  └──────────────────────────┘  │     │ ?section=identity_...   │
│                                │     │                         │
│  "View Full Soul →"  ──────────┼────►│ Full questionnaire      │
│                                │     │ All 8 pillars           │
└────────────────────────────────┘     │ Real-time score update  │
                                       └─────────────────────────┘
```

## The 8 Pet Soul Pillars

| Pillar | Key | Questions About |
|--------|-----|-----------------|
| Identity & Temperament | identity_temperament | Personality, nature, reactions |
| Family & Pack | family_pack | Family members, other pets |
| Rhythm & Routine | rhythm_routine | Daily schedule, habits |
| Home Comforts | home_comforts | Sleep, spaces, favorites |
| Travel Style | travel_style | Car rides, carriers, journeys |
| Taste & Treat | taste_treat | Food preferences, treats |
| Training & Behaviour | training_behaviour | Commands, training history |
| Long Horizon | long_horizon | Health, vet, special needs |

---

## Component Mapping

| Component | Location | Purpose |
|-----------|----------|---------|
| `PetSoulJourney` | `/components/PetSoulJourney.jsx` | Shows "What We Know" folders on membership page |
| `PetSoulJourneyPage` | `/pages/PetSoulJourneyPage.jsx` | Full questionnaire page |
| `PetSoulAnswers` | `/components/PetSoulAnswers.jsx` | Displays answered questions |
| `MemberDashboard` | `/pages/MemberDashboard.jsx` | My Account page |
| `MyPets` | `/pages/MyPets.jsx` | Pet list with all 14 life pillars |
| `MembershipPage` | `/pages/MembershipPage.jsx` | Pet Pass plans + Pet Soul summary |

---

## Clickable Elements (Fixed)

✅ **Pet Soul Folder Cards** - Click to expand and see details
✅ **"Fill More Questions"** - Goes to `/pet-soul-journey/{petId}?section={pillar}`
✅ **"View Full Soul"** - Goes to `/pet-soul-journey/{petId}`
✅ **"Answer X Questions"** - Goes to questionnaire
✅ **All 14 Life Pillars** on My Account - Goes to respective pillar pages

---

*Last updated: January 25, 2026*

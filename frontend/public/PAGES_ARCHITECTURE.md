# TDC Key Pages — Architecture for Claude
## For JSX reference + redesign instructions
## Generated: Mar 2026

---

## 1. LOGIN PAGE — `/login`
**File**: `/app/frontend/src/pages/Login.jsx` (343 lines)

```
Flow:
  Email + password → POST /api/auth/login → JWT stored as 'tdb_auth_token'
  Google Auth → Emergent-managed Google OAuth
  Redirect → previous page OR /dashboard

Key components:
  - Email input + Password input + Submit button
  - "Continue with Google" button (Emergent OAuth)
  - "Create account" link → /register
  - Forgot password flow

State:
  - isLogin (bool) — login vs register toggle
  - email, password, name (string)
  - loading, error (bool/string)

API calls:
  POST /api/auth/login { email, password } → { access_token, user }
  POST /api/auth/register { email, password, name }

Design: Dark gradient bg (#0F0A1E → #1A1363), logo centred, card style form
```

---

## 2. ABOUT PAGE — `/about`
**File**: `/app/frontend/src/pages/AboutPage.jsx` (614 lines)

```
Sections (in order):
  1. Hero — "Your Pet's Life, Thoughtfully Orchestrated"
  2. Mission statement — "We built this for Mystique..."
  3. The 14 Pillars grid — visual overview of all pillars
  4. How It Works — 3 steps: Soul Profile → Mira Scores → Concierge Arranges
  5. The Team / Founders section
  6. Testimonials
  7. CTA — "Start your pet's journey"

Key state:
  - No complex state — mostly static content
```

---

## 3. PET HOME PAGE — `/pet-home` or `/dashboard`
**File**: `/app/frontend/src/pages/PetHomePage.jsx` (848 lines)

```
Layout:
  1. Pet switcher (Mojo | Mystique | Lola | Bruno + Add Pet)
  2. Active pet hero: photo, name, breed, Soul Score %
  3. "What would you like to do?" — 13-pillar grid (3 cols):
     Celebrate, Care, Dine, Go, Play, Learn, Shop,
     Adopt, Paperwork, Advisory, Emergency, Farewell, Services
  4. Quick actions bar: Book Concierge, Mira Chat, Pet Vault
  5. Recent activity feed (last orders/bookings)
  6. Soul score progress bar

PILLARS array (13):
  celebrate(🎂) care(🌿) dine(🍽️) go(✈️) play(🎾) learn(🎓)
  shop(🛒) adopt(🐾) paperwork(📄) advisory(💡→paperwork)
  emergency(🚨) farewell(🌷) services(🤝)

Key props: currentPet (from PillarContext)
```

---

## 4. PET SOUL PAGE — `/pet-soul/:petId`
**File**: `/app/frontend/src/pages/PetSoulPage.jsx` (555 lines)

```
SOUL_PILLARS — 14 pillars each showing:
  - Pillar icon + name + colour
  - Mira's personalised score for this pillar
  - Link to the pillar page

Layout:
  1. Pet header: photo, name, breed, overall_score%
  2. Soul score donut/ring (overall_score 0-100)
  3. "Your soul chapters" — 8 chapter scores (identity/health/behaviour etc.)
  4. "How Mira knows {petName}" — 3 top memory tags
  5. Edit soul answers → links back to PetSoulOnboarding
  6. 14 pillar cards (mini versions showing pillar score)

API:
  GET /api/pets/{petId} → pet data including overall_score, doggy_soul_answers
  GET /api/pet-soul/profile/{petId} → full soul profile + questions
```

---

## 5. PET SOUL ONBOARDING — `/onboarding` or `/soul-builder`
**Files**: 
  - `/app/frontend/src/pages/PetSoulOnboarding.jsx` (404 lines)
  - `/app/frontend/src/pages/SoulBuilder.jsx`

```
ONBOARDING STEPS (10 questions, shown as cards):

  Step 1: welcome    — Welcome screen, pet name, breed, photo upload
  Step 2: photo      — Upload pet photo (stored via Cloudinary)
  Step 3: age        — Age/DOB (puppy/adult/senior determines stage)
  Step 4: personality — Energy level, personality type chips
  Step 5: health     — Existing conditions, allergies (multi-select chips)
  Step 6: social     — Other pets at home, socialization level
  Step 7: comfort    — Favourite activities, comfort items
  Step 8: food       — Diet type, allergies, preferences, portion
  Step 9: training   — Training level, current skills
  Step 10: home      — Living situation, access to outdoor space

Each step:
  - Progress bar (1-10)
  - Card with question + chips/input
  - "Next →" button
  - Skip option (adds to incomplete)
  - Save: POST /api/pet-soul/profile/{petId}/answer { question_id, answer[] }

Post-onboarding:
  - Soul score calculated automatically
  - Redirected to /pet-home
  - Mira scoring triggered in background

UX NOTES:
  - Never feels like a form — always feels like a conversation
  - Chips > dropdowns > free text (in that order of preference)
  - Progress shown as "Mira is learning about {petName}" not "Step X of Y"
  - Each answer triggers instant soul score update (shows +pts earned)
  - Photo upload: drag and drop OR camera capture on mobile
  - Breed selector: search-as-you-type with breed images
```

---

## 6. PET VAULT — `/pet-vault`
```
Shows all pet documents, records, saved items
Tabs: Documents | Health Records | Saved Picks | Order History
Links to Paperwork pillar for document management
```

---

## CSV DOWNLOADS (no login required)

Products without pricing (5,246 products + 1,025 services + 27 bundles):
→ POST /api/public/inventory-csv (or download via admin)

System overview for Claude:
→ GET /api/public/system-overview

Mira OS architecture:
→ /MIRA_OS_ARCHITECTURE.md (in /app/frontend/public/)

---

## SOUL SCORE FORMULA

```
Chapter weights:
  identity_score     × 0.20 = up to 20pts
  health_score       × 0.20 = up to 20pts  
  behaviour_score    × 0.15 = up to 15pts
  nutrition_score    × 0.15 = up to 15pts
  social_score       × 0.10 = up to 10pts
  travel_score       × 0.10 = up to 10pts
  learning_score     × 0.10 = up to 10pts
                     TOTAL  = 100pts = overall_score

Rule: ALWAYS use pet.overall_score || pet.soul_score || 0
```

---

## ONBOARDING QUESTIONS — FULL LIST

```
Question ID        Chapter         Type      pts
welcome            Identity        text      0   (pet name, breed, DOB)
photo              Identity        upload    15  (photo adds identity pts)
age                Identity        single    5   (puppy/adult/senior)
personality        Behaviour       multi     15  (energy, temperament)
health             Health          multi     20  (conditions, allergies)
social             Social          single    10  (other pets, socialization)
comfort            Behaviour       multi     10  (activities, fears)
food               Nutrition       multi     15  (diet, allergies, portions)
training           Learning        single    10  (level, commands known)
home               Identity        single    5   (house/apartment, outdoor)

Plus per-pillar questions (asked on pillar pages):
  care: vaccinated, microchipped, grooming_comfort, dental_health, coat_type
  dine: food_allergies, favourite_treats, dietary_restrictions
  learn: learn_level, training_goals, enrichment_preference
  go: travel_comfort, passport, travel_docs
  emergency: has_medical_tag, emergency_vet_saved, first_aid_kit
  paperwork: insurance, registered, emergency_plan, vet_history
```

---

## TECH NOTES FOR JSX REDESIGN

```
Authentication:
  - JWT stored as: localStorage.getItem('tdb_auth_token')
  - User object: localStorage.getItem('user') → JSON.parse
  - Auth context: import { useAuth } from '../context/AuthContext'
  - { user, token, isAuthenticated, logout } = useAuth()

Pet context:
  - import { usePillarContext } from '../context/PillarContext'
  - { currentPet, setCurrentPet, pets } = usePillarContext()
  - currentPet has: id, name, breed, photo_url, overall_score, doggy_soul_answers

Routing:
  - /login, /register → no auth required
  - /pet-home, /dashboard → ProtectedRoute
  - /[pillar] → ProtectedRoute → *SoulPage.jsx

Shared components:
  - PillarPageLayout (wraps all pillar pages)
  - MiraImaginesBreed (breed-intelligent fallback)
  - MiraImaginesCard (generic watercolour card)
  - ConciergeToast (booking confirmation)
  - useMiraIntelligence hook (order + memory signals)
```

# THE DOGGY COMPANY - MIRA OS
## Complete System Bible & Architecture Documentation
### Generated: February 2026

---

## TABLE OF CONTENTS

1. [EXECUTIVE SUMMARY](#1-executive-summary)
2. [ONBOARDING FLOW](#2-onboarding-flow)
3. [DASHBOARD ARCHITECTURE](#3-dashboard-architecture)
4. [PET PROFILE & PET SOUL](#4-pet-profile--pet-soul)
5. [THE 8 SOUL PILLARS (QUESTIONS)](#5-the-8-soul-pillars-questions)
6. [PAW POINTS & REWARDS](#6-paw-points--rewards)
7. [SOUL SCORE & BADGES](#7-soul-score--badges)
8. [14 LIFE PILLARS (OS SECTIONS)](#8-14-life-pillars-os-sections)
9. [MIRA AI - MEMORY & INTELLIGENCE](#9-mira-ai---memory--intelligence)
10. [DATA FLOW VERIFICATION](#10-data-flow-verification)
11. [API ENDPOINTS REFERENCE](#11-api-endpoints-reference)
12. [DATABASE SCHEMA](#12-database-schema)

---

## 1. EXECUTIVE SUMMARY

**MIRA OS** is a Mobile-First Pet Life Operating System that:
- Manages a pet's entire life across 14 pillars
- Uses Pet Soul™ to personalize every interaction
- Has intelligent memory that never forgets
- Operates with a "Profile-First Doctrine" - pet data always comes before generic advice

### Key Numbers
| Metric | Count |
|--------|-------|
| Total Users | 51 |
| Total Pets | 58 |
| Total Products | 2,214 |
| Total Services | 2,406 |
| Service Desk Tickets | 3,077 |
| Mira Memories | 159 |
| Conversation Memories | 20 |
| Soul Answers Versioned | 168 |
| Picks Catalogue | 110 |

### Test Credentials
| Role | Email | Password |
|------|-------|----------|
| Test User | dipali@clubconcierge.in | test123 |
| Admin | aditya | lola4304 |

---

## 2. ONBOARDING FLOW

### 2.1 Frontend Steps (4-Step Wizard)

#### STEP 1: Pet Parent Details
| Field | Required | Where Stored |
|-------|----------|--------------|
| Pet Parent Name | YES | `users.name` |
| Email Address | YES | `users.email` |
| Address (House, Street, Landmark) | YES | `users.address` |
| City | YES | `users.city` |
| Pincode | YES | `users.pincode` |
| Password | YES | `users.password_hash` |
| Phone Number | YES | `users.phone` |
| WhatsApp Number | YES | `users.whatsapp` |
| Preferred Contact Method | YES | `users.preferred_contact` |

**Notification Preferences** (stored in `users.communication_preferences`):
- Order & Delivery Updates
- Pet Care Reminders
- Offers & Promotions
- Monthly Newsletter
- Soul Whispers (Weekly WhatsApp)

#### STEP 2: Pet Details
| Field | Required | Where Stored |
|-------|----------|--------------|
| Dog's Name | YES | `pets.name` |
| Breed | YES | `pets.breed` |
| Species | NO (default: dog) | `pets.species` |
| Gender | NO | `pets.gender` |
| Birth Date | NO | `pets.birth_date` |
| Gotcha Day | NO | `pets.gotcha_date` |
| Weight | NO | `pets.weight_kg` |
| Neutered/Spayed | NO | `pets.health.spayed_neutered` |
| Photo | NO | `pets.photo_url` or `pets.photo_base64` |

**Multi-Pet Support**: Users can add 1-15+ pets

#### STEP 3: Celebrations Selection
| Celebration Type | Stored In |
|------------------|-----------|
| Birthday | `pets.celebrations[]` |
| Gotcha Day | `pets.celebrations[]` |
| Vaccination Day | `pets.celebrations[]` |
| Grooming Day | `pets.celebrations[]` |
| Training Milestones | `pets.celebrations[]` |
| Adoption Anniversary | `pets.celebrations[]` |
| Festival Celebrations | `pets.celebrations[]` |
| First Year Milestones | `pets.celebrations[]` |

#### STEP 4: Review & Pay
- Summary of all details
- Pricing breakdown with GST (18%)
- Payment via Razorpay

### 2.2 Backend Flow

```
User Completes Onboarding
        │
        ▼
┌─────────────────────────────────────────┐
│ 1. CREATE USER ACCOUNT                  │
│    - users collection                   │
│    - password_hash via bcrypt           │
│    - notification preferences           │
└─────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────┐
│ 2. CREATE PET PROFILE(S)                │
│    - pets collection                    │
│    - Generate pet_pass_number           │
│    - Link via user_id/owner_email       │
│    - Initialize soul object             │
└─────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────┐
│ 3. CREATE MEMBERSHIP RECORD             │
│    - membership_orders collection       │
│    - Plan type & validity               │
│    - Razorpay integration               │
└─────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────┐
│ 4. NOTIFICATIONS SENT                   │
│    - Admin notification                 │
│    - Service desk ticket created        │
│    - Welcome email via Resend           │
│    - WhatsApp message via Gupshup       │
└─────────────────────────────────────────┘
```

### 2.3 Membership Plans
| Plan | Price | Validity |
|------|-------|----------|
| 7-Day Explorer | FREE | 7 days |
| Pet Pass Trial | ₹499 + GST | 30 days |
| Pet Pass Founder | ₹4,999 + GST | 365 days |

---

## 3. DASHBOARD ARCHITECTURE

### 3.1 Dashboard Location
- **File**: `/app/frontend/src/pages/MemberDashboard.jsx`
- **URL**: `/dashboard`

### 3.2 Dashboard Tabs (18 Total)

| Tab | File | Purpose |
|-----|------|---------|
| Home | `OverviewTab.jsx` | Main dashboard overview |
| Services | `ServicesTab.jsx` | All service requests |
| Paw Points | `RewardsTab.jsx` | Points & rewards |
| Mira AI | `MiraTab.jsx` | Chat with Mira |
| Picks | `PicksHistoryTab.jsx` | AI recommendations history |
| Bookings | `RequestsTab.jsx` | Service bookings |
| Orders | `OrdersTab.jsx` | Product orders |
| Quotes | `QuotesTab.jsx` | Service quotes |
| Documents | `DocumentsTab.jsx` | Pet documents |
| Autoship | `AutoshipTab.jsx` | Recurring orders |
| Reviews | `ReviewsTab.jsx` | Reviews given |
| Pets | `PetsTab.jsx` | Pet management |
| Addresses | `AddressesTab.jsx` | Delivery addresses |
| Settings | `SettingsTab.jsx` | Account settings |
| Plan | `MembershipTab.jsx` | Membership details |
| Dine | `DiningTab.jsx` | Dining history |
| Stay | `StayTab.jsx` | Stay bookings |
| Travel | `TravelTab.jsx` | Travel history |
| Celebrations | `CelebrationsTab.jsx` | Celebration orders |

### 3.3 Dashboard Data Sources

```javascript
// Dashboard fetches from these endpoints:
GET /api/user/dashboard           // Complete dashboard data
GET /api/pets/my-pets             // User's pets
GET /api/orders?user_email=       // User's orders
GET /api/pillar-requests?email=   // Service requests
GET /api/user-tickets             // Support tickets
GET /api/quotes                   // Quotes received
```

### 3.4 Pet Selector (Top of Dashboard)
- Shows all user's pets as clickable cards
- Active pet highlighted with gradient border
- "Go to Soul Journey" link to Pet Soul page
- Switching pets updates all dashboard data

---

## 4. PET PROFILE & PET SOUL

### 4.1 Pet Profile Page
- **File**: `/app/frontend/src/pages/PetProfile.jsx`
- **URL**: `/pet/:petId` (e.g., `/pet/pet-e6348b13c975`)

### 4.2 What Happens on Pet Profile Page

The page is a **multi-step wizard** that collects:

#### Step 1: Basic Info
```javascript
{
  name: 'Mojo',
  breed: 'Indie',
  species: 'dog',
  gender: 'male',
  photo_url: 'https://...',
  birth_date: '2020-03-15',
  gotcha_date: '2020-05-01'
}
```

#### Step 2: Soul & Personality
```javascript
{
  soul: {
    persona: 'mischief_maker',  // From 8 options
    special_move: '',
    human_job: '',
    security_blanket: '',
    love_language: '',
    personality_tag: ''
  }
}
```

**Available Personas**:
| Key | Name | Icon |
|-----|------|------|
| royal | Royal | Crown |
| shadow | Shadow | Moon |
| adventurer | Adventurer | Mountain |
| couch_potato | Couch Potato | Sofa |
| social_butterfly | Social Butterfly | Users |
| foodie | Foodie | Utensils |
| athlete | Athlete | Zap |
| mischief_maker | Mischief Maker | Smile |

#### Step 3: Celebrations
- Select which occasions to celebrate
- Stored in `pets.celebrations[]` array

#### Step 4: Preferences
```javascript
{
  preferences: {
    favorite_flavors: [],
    allergies: [],
    texture_preference: '',
    treat_size: ''
  }
}
```

#### Step 5: Health Information
```javascript
{
  health: {
    vet_name: '',
    vet_clinic: '',
    vet_phone: '',
    medical_conditions: '',
    current_medications: '',
    dietary_restrictions: '',
    spayed_neutered: '',
    microchipped: false,
    microchip_number: '',
    insurance_provider: '',
    emergency_contact_name: '',
    emergency_contact_phone: ''
  }
}
```

### 4.3 Pet Soul Page
- **File**: `/app/frontend/src/pages/PetSoulPage.jsx`
- **URL**: `/pet-soul` or `/pet-soul/:petId`

This is the **marketing/explanation page** for Pet Soul concept.

### 4.4 Where Pet Data is Stored

| Data Type | Collection | Field Path |
|-----------|------------|------------|
| Basic Info | `pets` | Root level |
| Soul Questions | `pets` | `doggy_soul_answers` |
| Folder Scores | `pets` | `folder_scores` |
| Overall Score | `pets` | `overall_score` |
| Soul Tier | `pets` | `score_tier` |
| Health | `pets` | `health` |
| Preferences | `pets` | `preferences` |
| Persona | `pets` | `soul.persona` |
| Care History | `pets` | `soul.care_history` |
| Celebrate History | `pets` | `soul.celebrate_history` |
| Versioned Answers | `soul_answers_versioned` | Separate collection |

---

## 5. THE 8 SOUL PILLARS (QUESTIONS)

### 5.1 Overview

Pet Soul uses **8 question folders** with weighted scoring:

| Folder | Name | Icon | Total Points | Questions |
|--------|------|------|--------------|-----------|
| 1 | Identity & Temperament | 🧬 | 10 | 2 |
| 2 | Family & Pack | 👨‍👩‍👧‍👦 | 15 | 5 |
| 3 | Rhythm & Routine | ⏰ | 12 | 3 |
| 4 | Home Comforts | 🏡 | 14 | 4 |
| 5 | Travel Style | 🚗 | 8 | 2 |
| 6 | Taste & Treat | 🍽 | 14 | 4 |
| 7 | Training & Behaviour | 🎓 | 12 | 3 |
| 8 | Long Horizon (Health) | 🩺 | 15 | 4 |

**Total: 100 points, 27 questions**

### 5.2 Detailed Question Bank

#### Folder 1: Identity & Temperament (10 pts)
| Question ID | Label | Points | Type |
|-------------|-------|--------|------|
| temperament | Temperament | 5 | select |
| energy_level | Energy Level | 5 | select |

**Options for temperament**: Calm, Curious, Playful, Shy, Guarded, Fearful, Highly energetic

**Options for energy_level**: Low energy, Moderate energy, High energy

#### Folder 2: Family & Pack (15 pts)
| Question ID | Label | Points | Type |
|-------------|-------|--------|------|
| social_with_dogs | Social with Dogs | 3 | select |
| social_with_people | Social with People | 3 | select |
| primary_bond | Most Attached To | 3 | select |
| other_pets | Other Pets | 3 | select |
| kids_at_home | Kids at Home | 3 | select |

#### Folder 3: Rhythm & Routine (12 pts)
| Question ID | Label | Points | Type |
|-------------|-------|--------|------|
| morning_routine | Morning Routine | 4 | select |
| feeding_times | Feeding Schedule | 4 | select |
| exercise_needs | Exercise Needs | 4 | select |

#### Folder 4: Home Comforts (14 pts)
| Question ID | Label | Points | Type |
|-------------|-------|--------|------|
| favorite_spot | Favorite Spot | 3 | select |
| alone_time_comfort | Alone Time | 4 | select |
| noise_sensitivity | Noise Sensitivity | 4 | select |
| favorite_toy_type | Favorite Toys | 3 | select |

#### Folder 5: Travel Style (8 pts)
| Question ID | Label | Points | Type |
|-------------|-------|--------|------|
| car_comfort | Car Rides | 4 | select |
| travel_readiness | Travel Readiness | 4 | select |

#### Folder 6: Taste & Treat (14 pts)
| Question ID | Label | Points | Type |
|-------------|-------|--------|------|
| food_motivation | Food Motivation | 3 | select |
| favorite_protein | Favorite Protein | 3 | select |
| treat_preference | Treat Preference | 3 | select |
| food_allergies | Food Allergies | 5 | multi_select |

**Note**: Food allergies weighted highest (5 pts) - safety critical

#### Folder 7: Training & Behaviour (12 pts)
| Question ID | Label | Points | Type |
|-------------|-------|--------|------|
| training_level | Training Level | 4 | select |
| motivation_type | Training Motivation | 4 | select |
| behavior_issues | Behavior Issues | 4 | select |

#### Folder 8: Long Horizon/Health (15 pts)
| Question ID | Label | Points | Type |
|-------------|-------|--------|------|
| health_conditions | Health Conditions | 5 | multi_select |
| vet_comfort | Vet Comfort | 4 | select |
| grooming_tolerance | Grooming Tolerance | 3 | select |
| life_stage | Life Stage | 3 | select |

### 5.3 How Questions Are Saved

**Backend File**: `/app/backend/pet_soul_routes.py`

```python
# API Endpoint
POST /api/pet-soul/{pet_id}/answer
{
  "question_id": "temperament",
  "answer": "Playful"
}

# What Happens:
1. Answer saved to pets.doggy_soul_answers[question_id]
2. Versioned copy saved to soul_answers_versioned collection
3. Folder scores recalculated
4. Overall score updated
5. Tier assigned based on score
```

### 5.4 Score Calculation Logic

**Backend File**: `/app/backend/pet_soul_config.py`

```python
def calculate_score_state(pet_answers: dict):
    # For each question:
    # - If answered (not empty/null/Unknown): earn points
    # - If not answered: add to missing_questions
    
    # Calculate section percentages
    # Calculate overall percentage
    # Determine tier
    # Return complete score state
```

---

## 6. PAW POINTS & REWARDS

### 6.1 Paw Points System

**Backend File**: `/app/backend/paw_points_routes.py`

#### How Points Are Earned
| Action | Points | Collection |
|--------|--------|------------|
| First Order | 100 | paw_points_ledger |
| Product Purchase | 5% of order value | paw_points_ledger |
| Service Booking | 50-200 | paw_points_ledger |
| Soul Question Answered | 10 | paw_points_ledger |
| Referral | 500 | paw_points_ledger |
| Review Submitted | 25 | paw_points_ledger |

#### Where Points Are Stored
```javascript
// users collection
{
  loyalty_points: 1670,
  lifetime_points_earned: 1170
}

// paw_points_ledger collection (transaction log)
{
  user_id: "...",
  action: "order_placed",
  points: 100,
  order_id: "ORD-123",
  timestamp: "2026-02-01T..."
}
```

### 6.2 Paw Rewards by Pillar

**Backend File**: `/app/backend/paw_rewards.py`

| Pillar | Reward Type | Reward Name | Max Value |
|--------|-------------|-------------|-----------|
| CELEBRATE | free_product | Free Birthday Treat | ₹300 |
| DINE | free_product | Birthday Cake Reward | ₹500 |
| STAY | free_product | Paw Reward | ₹600 |
| TRAVEL | freebie | Pet Travel Kit | ₹400 |
| CARE | discount | First Visit Discount | ₹200 |

---

## 7. SOUL SCORE & BADGES

### 7.1 Soul Score Tiers

**Backend File**: `/app/backend/pet_soul_config.py`

| Tier Key | Name | Emoji | Min % | Max % |
|----------|------|-------|-------|-------|
| curious_pup | Curious Pup | 🐾 | 0 | 24 |
| loyal_companion | Loyal Companion | 🌱 | 25 | 49 |
| trusted_guardian | Trusted Guardian | 🤝 | 50 | 74 |
| pack_leader | Pack Leader | 🐕‍🦺 | 75 | 100 |

### 7.2 Achievement Badges

**Frontend File**: `/app/frontend/src/components/dashboard/AchievementSystem.js`

| Badge Key | Name | Points | Requirement |
|-----------|------|--------|-------------|
| soul_starter | Soul Starter | 50 | Complete 5 questions |
| soul_seeker | Soul Seeker | 100 | Complete 10 questions |
| soul_explorer | Soul Explorer | 150 | Complete 15 questions |
| soul_guardian | Soul Guardian | 200 | Complete 20 questions |
| photo_uploaded | Photo Star | 25 | Upload pet photo |
| multi_pet | Pack Leader | 100 | Register 2+ pets |
| first_order | First Order | 50 | Place first order |
| celebration_planned | Party Planner | 75 | Book celebration |

### 7.3 Where Badges Are Stored
```javascript
// users collection
{
  credited_achievements: [
    'soul_starter',
    'soul_seeker', 
    'soul_explorer',
    'photo_uploaded',
    'multi_pet',
    'soul_guardian'
  ]
}
```

---

## 8. 14 LIFE PILLARS (OS SECTIONS)

### 8.1 All 14 Pillars

| # | Pillar | Icon | URL | Purpose |
|---|--------|------|-----|---------|
| 1 | CELEBRATE | 🎂 | /celebrate | Birthday parties, cakes, occasions |
| 2 | DINE | 🍽️ | /dine | Pet-friendly restaurants |
| 3 | STAY | 🏨 | /stay | Boarding, daycare, pet hotels |
| 4 | TRAVEL | ✈️ | /travel | Pet relocation, documentation |
| 5 | CARE | 💊 | /care | Veterinary, grooming, health |
| 6 | ENJOY | 🎾 | /enjoy | Toys, accessories, enrichment |
| 7 | FIT | 🏃 | /fit | Exercise, swimming, training |
| 8 | LEARN | 🎓 | /learn | Training courses, behavior |
| 9 | PAPERWORK | 📄 | /paperwork | Registration, licenses |
| 10 | ADVISORY | 📋 | /advisory | Legal advice, insurance |
| 11 | EMERGENCY | 🚨 | /emergency | 24/7 emergency care |
| 12 | FAREWELL | 🌈 | /farewell | End-of-life care, memorials |
| 13 | ADOPT | 🐾 | /adopt | Adoption, foster, rescue |
| 14 | SHOP | 🛒 | /shop | Pet supplies, food, treats |

### 8.2 Pillar Request Flow

```
User clicks pillar action
        │
        ▼
┌─────────────────────────────────────────┐
│ 1. PILLAR REQUEST CREATED               │
│    Collection: pillar_requests          │
│    Fields: pillar, type, pet_id,        │
│            status: 'submitted'          │
└─────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────┐
│ 2. SERVICE DESK TICKET                  │
│    Collection: service_desk_tickets     │
│    Auto-linked to pillar request        │
│    Status tracking begins               │
└─────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────┐
│ 3. CHANNEL INTAKE                       │
│    Collection: channel_intakes          │
│    Routes to appropriate vendor         │
│    Admin gets notification              │
└─────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────┐
│ 4. PET SOUL UPDATED                     │
│    pets.soul.{pillar}_history[]         │
│    Example: soul.care_history.grooming  │
└─────────────────────────────────────────┘
```

### 8.3 Where Pillar Data is Written

| Pillar | Pet Soul Field | Collection |
|--------|----------------|------------|
| CELEBRATE | `soul.celebrate_history[]` | celebrate_requests |
| DINE | `soul.dine_history[]` | dine_requests |
| STAY | `soul.stay_history[]` | stay_requests |
| TRAVEL | `soul.travel_history[]` | travel_requests |
| CARE | `soul.care_history` | care_requests |
| ADVISORY | `soul.advisory_history[]` | advisory_requests |
| FIT | `soul.fit_history[]` | fit_requests |
| LEARN | `soul.learn_history[]` | learn_requests |
| EMERGENCY | `soul.emergency_history[]` | emergency_requests |

---

## 9. MIRA AI - MEMORY & INTELLIGENCE

### 9.1 How Mira Remembers

**Backend Files**:
- `/app/backend/mira_memory.py` - Memory storage
- `/app/backend/soul_first_logic.py` - Soul context building
- `/app/backend/mira_routes.py` - Chat endpoint

#### Memory Types
| Type | Icon | Description | Decay |
|------|------|-------------|-------|
| event | 🗓️ | Birthdays, trips, milestones | Never |
| health | 🏥 | Symptoms, conditions, vet visits | Never |
| shopping | 🛒 | Product interests, preferences | Recency-weighted |
| general | 💬 | Life context, lifestyle | Never |

### 9.2 Memory Collections

**mira_memories** (159 docs):
```javascript
{
  memory_id: "mem-046630591fb9",
  member_id: "dipali@clubconcierge.in",
  pet_id: null,
  pet_name: "Luna",
  memory_type: "event",
  content: "Planning a trip to Goa next month with Luna",
  source: "concierge-noted",
  surface_count: 206,
  is_active: true
}
```

**conversation_memories** (20 docs):
```javascript
{
  pet_id: "pet-3661ae55d2e2",
  category: "allergy",
  signal_type: "positive",
  value: "wheat",
  raw_text: "Mystique is allergic to wheat",
  source: "conversation"
}
```

### 9.3 Soul-First Logic

**The Core Doctrine**: Mira speaks from Pet Soul first, breed only as fallback.

```python
# soul_first_logic.py - How it works

def build_soul_context_summary(pet: Dict) -> SoulContextSummary:
    """
    Extracts from pet profile:
    - Coat type, grooming history
    - Anxiety triggers, noise sensitivity
    - Health conditions, allergies
    - Size, weight, breed, age
    
    Returns summary for LLM context
    """
```

### 9.4 Data Capture from Conversations

When users chat with Mira, data is extracted and saved:

| Extracted Data | Where Saved |
|----------------|-------------|
| Allergies (chicken, wheat, beef) | `pets.doggy_soul_answers.food_allergies` |
| Diet preferences | `pets.doggy_soul_answers.diet_type` |
| Favorite treats | `pets.doggy_soul_answers.favorite_treats` |
| Health conditions | `pets.doggy_soul_answers.health_conditions` |
| Behavioral traits | `pets.doggy_soul_answers.temperament` |
| Location | `pets.doggy_soul_answers.city` |

### 9.5 Verification: Is Data Flowing?

**Current State (Verified)**:
| Pet | Soul Score | Answers | Key Data |
|-----|------------|---------|----------|
| Mojo | 64.7% | 46 | allergies: chicken, temperament: friendly |
| Mystique | 78% | 22 | allergies: wheat, health: arthritis |
| Lola | 20.4% | 9 | - |
| Lennu | 9.2% | 5 | energy_level: Moderate |

**Data IS flowing correctly from conversations to Pet Soul.**

---

## 10. DATA FLOW VERIFICATION

### 10.1 Complete Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     USER INTERACTION                         │
│  (Onboarding / Dashboard / Pet Profile / Mira Chat)         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      BACKEND API                             │
│  /api/pets, /api/pet-soul, /api/mira/chat, etc.            │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│     USERS       │  │      PETS       │  │  MIRA_MEMORIES  │
│  (51 docs)      │  │   (58 docs)     │  │   (159 docs)    │
│                 │  │                 │  │                 │
│ - profile       │  │ - basic info    │  │ - event         │
│ - membership    │  │ - soul          │  │ - health        │
│ - points        │  │ - doggy_soul_   │  │ - shopping      │
│ - achievements  │  │   answers       │  │ - general       │
│ - pet_ids       │  │ - health        │  │                 │
└─────────────────┘  │ - preferences   │  └─────────────────┘
                     │ - pillar        │
                     │   interactions  │
                     └─────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│PILLAR_REQUESTS  │  │SERVICE_DESK_   │  │CONVERSATION_    │
│  (537 docs)     │  │TICKETS (3077)  │  │MEMORIES (20)    │
│                 │  │                │  │                 │
│ - celebrate     │  │ - status       │  │ - allergies     │
│ - dine          │  │ - assigned_to  │  │ - preferences   │
│ - stay          │  │ - resolution   │  │ - health        │
│ - travel        │  │                │  │                 │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

### 10.2 Key Verification Points

✅ **Onboarding → User Created** (users collection)
✅ **Onboarding → Pet Created** (pets collection)
✅ **Soul Questions → doggy_soul_answers saved**
✅ **Soul Answers → Versioned backup** (soul_answers_versioned)
✅ **Chat → Mira Memories** (mira_memories)
✅ **Chat → Conversation Memories** (conversation_memories)
✅ **Chat → Pet Soul Updated** (pets.doggy_soul_answers)
✅ **Pillar Actions → Pillar Requests** (pillar_requests)
✅ **Pillar Actions → Pet Soul History** (pets.soul.*_history)

---

## 11. API ENDPOINTS REFERENCE

### 11.1 Authentication
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | /api/auth/register | Create account |
| POST | /api/auth/login | Login |
| POST | /api/auth/forgot-password | Password reset |

### 11.2 Users
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | /api/user/dashboard | Dashboard data |
| GET | /api/user/profile | User profile |
| PUT | /api/user/profile | Update profile |

### 11.3 Pets
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | /api/pets/my-pets | User's pets |
| POST | /api/pets | Create pet |
| GET | /api/pets/:id | Get pet |
| PUT | /api/pets/:id | Update pet |

### 11.4 Pet Soul
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | /api/pet-soul/:pet_id/questions | Get questions |
| POST | /api/pet-soul/:pet_id/answer | Submit answer |
| GET | /api/pet-soul/:pet_id/score | Get score |
| GET | /api/pet-soul/:pet_id/next-question | Get next question |

### 11.5 Mira AI
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | /api/mira/chat | Chat with Mira |
| GET | /api/mira/memories/:member_id | Get memories |
| POST | /api/mira/memories | Store memory |
| GET | /api/mira/sessions | Chat sessions |

### 11.6 Orders & Services
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | /api/orders | User's orders |
| GET | /api/pillar-requests | Service requests |
| POST | /api/pillar-requests | Create request |
| GET | /api/service-desk-tickets | Support tickets |

---

## 12. DATABASE SCHEMA

### 12.1 users Collection
```javascript
{
  id: "uuid",
  email: "string",
  password_hash: "string",
  name: "string",
  phone: "string",
  membership_tier: "explorer|trial|founder|pawsome",
  membership_expires: "datetime",
  pet_ids: ["pet-id-1", "pet-id-2"],
  communication_preferences: {
    email: true,
    whatsapp: true,
    sms: false
  },
  loyalty_points: 1670,
  lifetime_points_earned: 1170,
  credited_achievements: ["badge1", "badge2"],
  created_at: "datetime"
}
```

### 12.2 pets Collection
```javascript
{
  id: "pet-uuid",
  user_id: "user-uuid",
  owner_email: "string",
  name: "string",
  breed: "string",
  species: "dog",
  gender: "male|female",
  birth_date: "string",
  gotcha_date: "string",
  weight_kg: number,
  photo_url: "string",
  
  // Soul data
  soul: {
    persona: "string",
    documents: [],
    advisory_history: [],
    care_history: {},
    celebrate_history: []
  },
  
  // Questions answered
  doggy_soul_answers: {
    temperament: "friendly",
    energy_level: "High energy",
    food_allergies: "chicken",
    // ... all answered questions
  },
  
  // Scores
  folder_scores: {},
  overall_score: 64.7,
  score_tier: "trusted_guardian",
  
  // Health
  health: {},
  health_vault: {},
  vaccinations: [],
  
  // Preferences
  preferences: {},
  celebrations: []
}
```

### 12.3 mira_memories Collection
```javascript
{
  memory_id: "mem-uuid",
  member_id: "email",
  pet_id: "pet-id|null",
  pet_name: "string",
  memory_type: "event|health|shopping|general",
  content: "string",
  source: "conversation|concierge-noted|system",
  confidence: "high|medium|low",
  surface_count: number,
  is_active: true,
  created_at: "datetime"
}
```

### 12.4 pillar_requests Collection
```javascript
{
  request_id: "PILLAR-uuid",
  user_id: "user-uuid",
  user_email: "email",
  pet_id: "pet-id",
  pet_name: "string",
  pillar: "celebrate|dine|stay|travel|care|...",
  request_type: "string",
  status: "submitted|in_progress|completed|cancelled",
  details: {},
  created_at: "datetime"
}
```

---

## VERIFICATION CHECKLIST

| Item | Status | Notes |
|------|--------|-------|
| Users storing correctly | ✅ | 51 users |
| Pets storing correctly | ✅ | 58 pets |
| Soul questions saving | ✅ | via doggy_soul_answers |
| Soul score calculating | ✅ | Mojo: 64.7%, Mystique: 78% |
| Mira memories storing | ✅ | 159 memories |
| Conversation data extracted | ✅ | allergies, health captured |
| Pillar requests tracking | ✅ | 537 requests |
| Service desk tickets | ✅ | 3,077 tickets |
| Paw points ledger | ✅ | 22 transactions |
| Achievement badges | ✅ | 6 badges credited |

---

## NEXT STEPS TO VERIFY

1. **Manual Test**: Go through onboarding flow → verify all fields saved
2. **Chat Test**: Ask Mira about allergies → verify extraction
3. **Soul Test**: Answer questions → verify score updates
4. **Pillar Test**: Make a CARE request → verify pet soul updated
5. **Memory Test**: Check if Mira remembers past conversations

---

*Document generated by MIRA OS Agent*
*Last Updated: February 2026*

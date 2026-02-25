# The Doggy Company - Pet Soul, Gamification & Pet Vault

## Complete Technical Documentation

---

## 1. PET SOUL SYSTEM

### 1.1 The 8 Core Folders

The Pet Soul is structured into **8 folders**, each with weighted questions that contribute to the overall score.

#### Folder 1: Identity & Temperament 🎭
| Question ID | Question | Type | Options | Weight |
|------------|----------|------|---------|--------|
| `describe_3_words` | How would you describe your dog in three words? | text | - | 3 |
| `general_nature` | Is your dog generally: | select | Calm, Curious, Playful, Shy, Guarded, Fearful, Highly energetic | 4 |
| `stranger_reaction` | How does your dog usually react to strangers? | select | Friendly, Cautious, Indifferent, Nervous, Protective | 3 |
| `loud_sounds` | How does your dog react to loud sounds (thunder, fireworks, traffic)? | select | Completely fine, Mildly anxious, Very anxious, Needs comfort | 4 |
| `social_preference` | Does your dog prefer: | select | Being around people, Being around other dogs, Being mostly with you, Being mostly independent | 3 |
| `handling_comfort` | Is your dog comfortable being handled (paws, ears, mouth)? | select | Very comfortable, Sometimes uncomfortable, Highly sensitive | 3 |

#### Folder 2: Family & Pack 👨‍👩‍👧‍👦
| Question ID | Question | Type | Options | Weight |
|------------|----------|------|---------|--------|
| `lives_with` | Does your dog live with: | multi_select | Adults only, Children, Other dogs, Other pets (cats, birds, etc.) | 3 |
| `behavior_with_dogs` | How does your dog behave with other dogs? | select | Loves all dogs, Selective friends, Nervous, Reactive | 4 |
| `most_attached_to` | Who is your dog most attached to in the family? | select | Me, Partner, Children, Everyone equally | 2 |
| `attention_seeking` | Does your dog like being the centre of attention? | select | Yes, Sometimes, No | 2 |

#### Folder 3: Rhythm & Routine ⏰
| Question ID | Question | Type | Options | Weight |
|------------|----------|------|---------|--------|
| `walks_per_day` | How many walks does your dog need per day? | select | 1, 2, 3+ | 3 |
| `energetic_time` | What time of day is your dog most energetic? | select | Morning, Afternoon, Evening, Night | 2 |
| `sleep_location` | Where does your dog usually sleep? | select | Your bed, Their own bed, Crate, Sofa / floor | 2 |
| `alone_comfort` | Is your dog used to being left alone? | select | Yes, comfortably, Sometimes anxious, Not at all | 4 |
| `separation_anxiety` | Does your dog have separation anxiety? | select | No, Mild, Moderate, Severe | 5 |

#### Folder 4: Home Comforts 🏠
| Question ID | Question | Type | Options | Weight |
|------------|----------|------|---------|--------|
| `favorite_item` | Does your dog have a favourite item? | select | Toy, Blanket, Bed, None | 2 |
| `space_preference` | Does your dog prefer: | select | Quiet spaces, Busy spaces, Outdoor time, Indoor time | 3 |
| `crate_trained` | Is your dog crate-trained? | select | Yes, No, In training | 4 |
| `car_rides` | Does your dog like car rides? | select | Loves them, Neutral, Anxious, Gets motion sickness | 4 |

#### Folder 5: Travel Style ✈️
| Question ID | Question | Type | Options | Weight |
|------------|----------|------|---------|--------|
| `usual_travel` | How does your dog usually travel? | select | Car, Train, Flight (occasionally), Never travels | 3 |
| `hotel_experience` | Has your dog ever stayed in a hotel before? | select | Yes, loved it, Yes, but was anxious, No | 3 |
| `stay_preference` | What kind of stay suits your dog best? | select | Quiet, nature hotel, Pet-friendly resort, City hotel, Homestay / villa | 3 |
| `travel_social` | During stays, does your dog prefer: | select | Private spaces, Social pet areas | 2 |

#### Folder 6: Taste & Treat World 🍖
| Question ID | Question | Type | Options | Weight |
|------------|----------|------|---------|--------|
| `diet_type` | Is your dog's diet: | select | Vegetarian, Non-vegetarian, Mixed | 4 |
| `food_allergies` | Does your dog have any food allergies? | multi_select | No, Chicken, Beef, Grains, Dairy, Other | 5 |
| `favorite_treats` | What treats does your dog love most? | multi_select | Biscuits, Jerky, Cakes, Homemade food, Fresh fruits | 3 |
| `sensitive_stomach` | Does your dog have a sensitive stomach? | select | Yes, No, Sometimes | 4 |

#### Folder 7: Training & Behaviour 🎓
| Question ID | Question | Type | Options | Weight |
|------------|----------|------|---------|--------|
| `training_level` | Is your dog trained? | select | Fully trained, Partially trained, Not trained | 3 |
| `training_response` | How does your dog respond best to training? | select | Treats, Praise, Toys, Play | 3 |
| `leash_behavior` | Does your dog pull on the leash? | select | Always, Sometimes, Rarely | 2 |
| `barking` | Does your dog bark often? | select | Yes, Occasionally, Rarely | 2 |

#### Folder 8: Long Horizon 🌅
| Question ID | Question | Type | Options | Weight |
|------------|----------|------|---------|--------|
| `main_wish` | What do you want most for your dog? | multi_select | Good health, More training, More travel experiences, More social time with other dogs | 2 |
| `help_needed` | Would you like help with: | multi_select | Behaviour training, Travel planning, Grooming routines, Diet planning | 2 |
| `dream_life` | In one sentence, what kind of life do you want your dog to have? | text | - | 3 |
| `celebration_preferences` | Which celebrations would you like to celebrate with your pet? | multi_select | Birthday, Gotcha Day (Adoption Anniversary), Diwali, Holi, Christmas, New Year, Valentine's Day, Raksha Bandhan, Independence Day, Easter, Eid | 3 |

### 1.2 Score Calculation

```python
def calculate_folder_score(answers: Dict, folder_key: str) -> float:
    """
    Each folder has questions with weights.
    Score = (answered_weight / total_weight) * 100
    """
    folder = DOGGY_SOUL_QUESTIONS.get(folder_key, {})
    questions = folder.get("questions", [])
    
    total_weight = sum(q["weight"] for q in questions)
    answered_weight = sum(q["weight"] for q in questions 
                         if q["id"] in answers and answers[q["id"]])
    
    return (answered_weight / total_weight) * 100 if total_weight > 0 else 0

def calculate_overall_score(answers: Dict) -> float:
    """
    Overall Score = Average of all 8 folder scores
    """
    folder_scores = [calculate_folder_score(answers, fk) for fk in FOLDER_KEYS]
    return sum(folder_scores) / len(folder_scores)
```

### 1.3 Data Storage Location

```
MongoDB Collection: pets

Document Structure:
{
  "id": "pet-99a708f1722a",
  "name": "Mojo",
  "breed": "Indie",
  "species": "dog",
  "gender": "male",
  
  // IDENTITY
  "identity": {
    "name": "Mojo",
    "breed": "Indie",
    "birth_date": "2026-01-29",
    "weight": 15.5,
    "size": "M"
  },
  
  // PET SOUL ANSWERS - All 34 questions stored here
  "doggy_soul_answers": {
    "describe_3_words": "Playful, Loyal, Energetic",
    "general_nature": "Curious",
    "stranger_reaction": "Friendly",
    "food_allergies": ["wheat", "chicken"],
    "separation_anxiety": "Moderate",
    ...
  },
  
  // CALCULATED SCORES
  "overall_score": 56.8,
  "folder_scores": {
    "identity_temperament": 100.0,
    "family_pack": 100.0,
    "rhythm_routine": 100.0,
    "home_comforts": 100.0,
    "travel_style": 54.5,
    "taste_treat": 0.0,
    "training_behaviour": 0.0,
    "long_horizon": 0.0
  },
  
  // AI-GENERATED INSIGHTS
  "insights": {
    "overall_summary": "Mojo is an Indie who is generally curious.",
    "folder_summaries": {...},
    "key_flags": {
      "has_allergies": true,
      "allergy_list": ["wheat", "chicken"],
      "anxiety_level": "high",
      "is_reactive": false,
      "is_crate_trained": true,
      "has_motion_sickness": false,
      "separation_anxiety": "moderate"
    },
    "recommendations": [
      "Consider calming treats and quieter stay options"
    ]
  },
  
  // PILLAR INTERACTION HISTORY
  "pillar_history": [
    {
      "pillar": "celebrate",
      "captured_at": "2026-01-19T00:46:50.514384+00:00",
      "fields_captured": ["favorite_treats", "food_allergies"],
      "request_type": "order"
    }
  ],
  
  // CELEBRATIONS
  "celebrations": [
    {"occasion": "birthday", "date": "2026-01-29", "is_recurring": true},
    {"occasion": "gotcha_day", "date": "2026-01-31", "is_recurring": true},
    {"occasion": "diwali", "date": "11-01", "is_recurring": true}
  ],
  
  // PET VAULT (Health Records) - See Section 3
  "vault": {...},
  
  // ACHIEVEMENTS
  "achievements": []
}
```

---

## 2. GAMIFICATION SYSTEM

### 2.1 Pet Soul Score Display (MiraContextPanel)

**File**: `/app/frontend/src/components/MiraContextPanel.jsx`

The Pet Soul Score is displayed in the Mira Context Panel on every pillar page with:

```jsx
{/* Score Display */}
<div className="flex items-center justify-between mb-2">
  <p className="text-xs font-medium text-gray-700">
    {pet.name}'s Soul Score
  </p>
  <span className="text-lg font-bold text-purple-600">
    {pet.soul_score || 0}%
  </span>
</div>

{/* Progress Bar */}
<div className="w-full bg-purple-100 rounded-full h-2.5">
  <div 
    className="bg-gradient-to-r from-purple-500 to-pink-500 h-2.5 rounded-full"
    style={{ width: `${pet.soul_score || 0}%` }}
  />
</div>

{/* Rewards Message */}
{soul_score < 100 && (
  <div className="text-xs text-amber-700">
    <Sparkles /> Complete to unlock {100 - soul_score}% rewards!
  </div>
)}
```

### 2.2 Quick Win Badges

**Concept**: Show clickable badges that encourage users to complete their profile.

```jsx
{/* Quick Wins Section */}
<div className="bg-amber-50 p-2 rounded-lg">
  <p className="text-xs font-semibold text-amber-800">
    Quick wins to boost your score:
  </p>
  <div className="flex flex-wrap gap-1">
    {!pet.identity?.weight && (
      <Badge>+5% Add weight</Badge>
    )}
    {!pet.identity?.microchip && (
      <Badge>+5% Add microchip</Badge>
    )}
    {!pet.health?.allergies?.length && (
      <Badge>+10% Add allergies</Badge>
    )}
    {!pet.personality?.traits?.length && (
      <Badge>+10% Add personality</Badge>
    )}
  </div>
</div>
```

### 2.3 Completion Celebration

```jsx
{/* 100% Complete Message */}
{soul_score >= 100 && (
  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-2 rounded-lg">
    <p className="text-xs font-bold text-green-700">
      🎉 Soul Complete! You know {pet.name} inside out!
    </p>
  </div>
)}
```

### 2.4 Pet Achievements System

**File**: `/app/backend/user_routes.py`

```python
@user_router.post("/pets/{pet_id}/achievements")
async def add_pet_achievement(pet_id: str, achievement: dict):
    """Add an achievement to a pet's profile"""
    
    # Structure:
    achievement = {
        "id": "ach-abc12345",
        "name": "First Pawcation",
        "description": "Completed first stay booking",
        "icon": "🏨",
        "category": "stay",
        "earned_at": "2026-01-21T15:00:00Z"
    }
    
    await db.pets.update_one(
        {"id": pet_id},
        {"$push": {"achievements": achievement}}
    )
```

**Storage**: `pets.achievements[]` array in MongoDB

---

## 3. PAW REWARDS SYSTEM

### 3.1 Universal Rewards Configuration

**File**: `/app/backend/paw_rewards.py`

| Pillar | Reward Type | Reward Name | Max Value | Trigger |
|--------|------------|-------------|-----------|---------|
| Celebrate | Free Product | Free Birthday Treat | ₹300 | order |
| Dine | Free Product | Birthday Cake Reward | ₹500 | birthday |
| Stay | Free Product | Paw Reward | ₹600 | booking |
| Travel | Freebie | Pet Travel Kit | ₹400 | booking |
| Care | Discount | First Visit Discount (15%) | ₹500 | first_visit |

### 3.2 Reward Data Models

```python
class PawRewardConfig(BaseModel):
    pillar: str                    # celebrate, dine, stay, travel, care
    enabled: bool = True
    reward_type: str               # free_product, discount, freebie, bundle
    reward_name: str
    reward_description: str
    reward_icon: str = "🎁"
    product_id: Optional[str]      # Linked product
    product_category: Optional[str] # e.g., "treats", "cakes"
    max_value: float = 600
    trigger_condition: str         # booking, order, birthday, first_visit
    badge_text: str = "🎁 Paw Reward"
    badge_color: str = "amber"

class PawRewardInstance(BaseModel):
    reward_id: str
    pillar: str
    customer_email: str
    pet_name: Optional[str]
    trigger_type: str              # order, booking, reservation
    trigger_id: str                # Order ID, Booking ID
    reward_value: float
    status: str = "earned"         # earned, claimed, expired
    earned_at: str
    claimed_at: Optional[str]
    expires_at: Optional[str]
```

### 3.3 Reward API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/rewards/config` | GET | Get all pillar reward configs |
| `/api/rewards/config/{pillar}` | GET | Get specific pillar config |
| `/api/rewards/config/{pillar}` | PUT | Update pillar config (admin) |
| `/api/rewards/eligible-products/{pillar}` | GET | Get products eligible as rewards |
| `/api/rewards/earn` | POST | Record a reward earned |
| `/api/rewards/customer/{email}` | GET | Get customer's earned rewards |
| `/api/rewards/claim` | POST | Mark a reward as claimed |

### 3.4 Storage Location

```
MongoDB Collections:
- paw_reward_configs   → Pillar reward configurations
- paw_rewards_earned   → Individual earned rewards
```

---

## 4. PET VAULT (Health Records)

### 4.1 Complete Feature List

**File**: `/app/backend/pet_vault_routes.py`

#### A. Vaccines
- Add/View/Delete vaccine records
- Track vaccine name, date given, next due date
- Automatic overdue/upcoming alerts
- Reminder creation with due dates

```python
class VaccineRecord(BaseModel):
    id: Optional[str]
    vaccine_name: str
    date_given: str               # ISO date
    next_due_date: Optional[str]
    vet_name: Optional[str]
    batch_number: Optional[str]
    notes: Optional[str]
    reminder_enabled: bool = True
```

#### B. Medications
- Track active/past medications
- Dosage, frequency, refill reminders
- Start/end date tracking

```python
class MedicationRecord(BaseModel):
    id: Optional[str]
    medication_name: str
    dosage: str                   # e.g., "68mg"
    frequency: str                # e.g., "twice daily", "once weekly"
    start_date: str
    end_date: Optional[str]
    prescribing_vet: Optional[str]
    reason: Optional[str]
    refill_reminder_enabled: bool = True
```

#### C. Vet Visits
- Complete visit history
- Diagnosis, treatment, follow-up tracking
- Cost tracking
- Document attachments

```python
class VetVisit(BaseModel):
    id: Optional[str]
    visit_date: str
    vet_name: str
    clinic_name: Optional[str]
    reason: str
    diagnosis: Optional[str]
    treatment: Optional[str]
    follow_up_date: Optional[str]
    cost: Optional[float]
    documents: List[str] = []     # Document URLs
```

#### D. Vet Directory
- Save multiple vets
- Mark primary vet
- Contact details and specializations

```python
class VetInfo(BaseModel):
    id: Optional[str]
    name: str
    clinic_name: Optional[str]
    phone: Optional[str]
    email: Optional[str]
    address: Optional[str]
    specialization: Optional[str]
    is_primary: bool = False
```

#### E. Health Documents
- Store prescriptions, lab reports, X-rays
- Document type categorization
- Link to vet visits

```python
class HealthDocument(BaseModel):
    id: Optional[str]
    name: str
    document_type: str            # prescription, lab_report, xray, certificate
    file_url: str
    related_visit_id: Optional[str]
```

#### F. Weight Tracking
- Historical weight records
- Automatic current weight updates
- Trend visualization support

```python
class WeightRecord(BaseModel):
    date: str
    weight_kg: float
    notes: Optional[str]
```

### 4.2 Pet Vault API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/pet-vault/{pet_id}/vaccines` | GET | Get all vaccines |
| `/api/pet-vault/{pet_id}/vaccines` | POST | Add vaccine |
| `/api/pet-vault/{pet_id}/vaccines/{id}` | DELETE | Delete vaccine |
| `/api/pet-vault/{pet_id}/medications` | GET | Get medications |
| `/api/pet-vault/{pet_id}/medications` | POST | Add medication |
| `/api/pet-vault/{pet_id}/medications/{id}` | PUT | Update medication |
| `/api/pet-vault/{pet_id}/visits` | GET | Get vet visits |
| `/api/pet-vault/{pet_id}/visits` | POST | Add vet visit |
| `/api/pet-vault/{pet_id}/vets` | GET | Get saved vets |
| `/api/pet-vault/{pet_id}/vets` | POST | Add vet |
| `/api/pet-vault/{pet_id}/weight-history` | GET | Get weight history |
| `/api/pet-vault/{pet_id}/weight` | POST | Add weight record |
| `/api/pet-vault/{pet_id}/documents` | GET | Get documents |
| `/api/pet-vault/{pet_id}/documents` | POST | Add document |
| `/api/pet-vault/{pet_id}/summary` | GET | Get complete health summary |

### 4.3 Health Summary Response

```json
{
  "pet_id": "pet-99a708f1722a",
  "pet_name": "Mojo",
  "current_weight_kg": 15.5,
  "summary": {
    "total_vaccines": 2,
    "total_medications": 1,
    "active_medications": 1,
    "total_vet_visits": 1,
    "total_documents": 3,
    "saved_vets": 1
  },
  "alerts": [
    {
      "type": "overdue_vaccine",
      "severity": "high",
      "message": "DHPP is overdue by 5 days",
      "item_id": "vax-2daa8b77"
    },
    {
      "type": "upcoming_vaccine",
      "severity": "medium",
      "message": "Rabies due in 14 days",
      "item_id": "vax-05f1df44"
    }
  ],
  "active_medications": [...],
  "upcoming_followups": [...],
  "primary_vet": {...},
  "last_visit": {...}
}
```

### 4.4 Vault Storage Location

```
MongoDB Collection: pets

Document Structure:
{
  "id": "pet-99a708f1722a",
  "vault": {
    "vaccines": [
      {
        "id": "vax-05f1df44",
        "vaccine_name": "Rabies",
        "date_given": "2025-06-15",
        "next_due_date": "2026-06-15",
        "vet_name": "Dr. Sharma",
        "reminder_enabled": true,
        "created_at": "2026-01-19T08:01:57Z"
      }
    ],
    "medications": [
      {
        "id": "med-a17f9883",
        "medication_name": "Nexgard",
        "dosage": "68mg",
        "frequency": "once monthly",
        "start_date": "2026-01-01",
        "reason": "Flea and tick prevention",
        "refill_reminder_enabled": true
      }
    ],
    "vet_visits": [
      {
        "id": "visit-2fc4a2b7",
        "visit_date": "2026-01-15",
        "vet_name": "Dr. Sharma",
        "clinic_name": "Happy Paws Veterinary Clinic",
        "reason": "Annual checkup",
        "diagnosis": "Healthy overall",
        "cost": 2500.0,
        "follow_up_date": "2026-02-15"
      }
    ],
    "vets": [
      {
        "id": "vet-40246902",
        "name": "Dr. Sharma",
        "clinic_name": "Happy Paws Veterinary Clinic",
        "phone": "9876543210",
        "is_primary": true
      }
    ],
    "documents": [],
    "weight_history": []
  }
}
```

---

## 5. AUTO-POPULATION FROM PILLAR INTERACTIONS

### 5.1 How It Works

When a user interacts with any pillar (e.g., makes a booking, places an order), relevant data is automatically captured and stored in the Pet Soul:

**Endpoint**: `POST /api/pet-soul/profile/{pet_id}/pillar-capture`

**Field Mappings**:
```python
field_mappings = {
    "allergies": "food_allergies",
    "crate_trained": "crate_trained",
    "anxiety_level": "separation_anxiety",
    "sensitive_stomach": "sensitive_stomach",
    "diet_type": "diet_type",
    "travel_preference": "stay_preference"
}
```

**Example**: When ordering from Celebrate pillar:
```python
# System auto-learns:
{
    "favorite_treats": ["Peanut Butter Treats"],
    "prefers_grain_free": true,
    "loves_celebrations": true,
    "taste_banana": true,
    "food_allergies": ["wheat", "chicken"]
}
```

---

## 6. AI INSIGHTS GENERATION

### 6.1 Key Flags Extracted

```python
key_flags = {
    "has_allergies": bool,        # From food_allergies
    "allergy_list": list,         # Actual allergens
    "anxiety_level": str,         # none, mild, high
    "is_reactive": bool,          # From behavior_with_dogs
    "is_crate_trained": bool,     # From crate_trained
    "has_motion_sickness": bool,  # From car_rides
    "has_sensitive_stomach": bool, # From sensitive_stomach
    "separation_anxiety": str,    # none, mild, moderate, severe
    "is_trained": bool            # From training_level
}
```

### 6.2 Auto-Generated Recommendations

```python
recommendations = []

if anxiety_level in ["mild", "high"]:
    recommendations.append("Consider calming treats and quieter stay options")

if not is_crate_trained:
    recommendations.append("May need crate training before flights")

if has_allergies:
    recommendations.append(f"Avoid products containing {', '.join(allergy_list)}")
```

---

## 7. FRONTEND DISPLAY COMPONENTS

### 7.1 Key Files

| File | Purpose |
|------|---------|
| `/app/frontend/src/components/MiraContextPanel.jsx` | Soul Score display + gamification |
| `/app/frontend/src/pages/PetProfile.jsx` | Full pet profile page |
| `/app/frontend/src/components/admin/ServiceDesk.jsx` | Soul score in admin view |

### 7.2 Soul Score in Admin Service Desk

```jsx
{/* In ticket view */}
<span className="text-xs font-medium text-gray-600">Soul Score</span>
<div className="w-full bg-purple-100 rounded-full h-1.5">
  <div 
    className="bg-purple-500 h-1.5 rounded-full"
    style={{ width: `${soulScore}%` }}
  />
</div>
```

---

## 8. SUMMARY

| System | Storage Location | Key Features |
|--------|-----------------|--------------|
| Pet Soul | `pets.doggy_soul_answers` | 34 questions across 8 folders |
| Soul Scores | `pets.folder_scores`, `pets.overall_score` | Weighted calculation |
| Pet Vault | `pets.vault` | Vaccines, meds, visits, vets, docs |
| Paw Rewards | `paw_reward_configs`, `paw_rewards_earned` | Per-pillar reward system |
| Achievements | `pets.achievements` | User achievements array |
| AI Insights | `pets.insights` | Auto-generated from answers |

---

*Last Updated: January 21, 2026*

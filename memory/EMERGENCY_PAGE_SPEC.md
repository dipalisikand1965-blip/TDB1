# Emergency Page - Complete Specification
**Created:** March 10, 2026
**Status:** TO BE IMPLEMENTED

---

## Page Architecture (5 Layers)

### Layer 1: Immediate Action
### Layer 2: Google Nearby Help
### Layer 3: Concierge Support
### Layer 4: Pet-Specific Records & Recommendations
### Layer 5: Emergency Products & Recovery

---

## 9 Sections Breakdown

### 1. URGENT HELP (Top of Page - Panic Mode)
**Purpose:** No scrolling, no thinking. Immediate action buttons.

**Include:**
- Call emergency vet
- Find nearest open clinic
- Poison help
- Ambulance / transport
- Open my pet file

**UI:** Large, tappable buttons. Red/Orange urgent colors.

---

### 2. NEARBY HELP (Google API Section)
**Purpose:** Help near me right now.

**Include:**
- Nearby emergency vet clinics
- 24/7 hospitals
- Nearest pet pharmacies
- Pet ambulance / transport
- Directions + Call button
- "Open now" indicator
- Distance from user

**Filters:**
- Open now
- Within 5 km / 10 km
- 24/7 only
- Highest rated
- Home visit available

**Technical:** Use existing `google_places_service.py` + `NearbyPlacesCarousel.jsx`

---

### 3. CONCIERGE HELP (Human Support Layer)
**Purpose:** We can help coordinate things for you right now.

**Services:**
- Call the clinic for you
- Help find fastest available vet
- Arrange transport
- Send pet's file to clinic
- Help source urgent medication
- Help locate blood donor / specialist
- Help if pet is ill while travelling
- Help contact sitter / second caregiver
- Help in lost-pet situations

**CTA Buttons:**
- Talk to Concierge now (WhatsApp)
- Request urgent callback
- Ask us to coordinate
- Share my pet file with clinic

**Technical:** Use existing `ServiceCatalogSection` with `hidePrice={true}`

---

### 4. MY PET EMERGENCY FILE (Auto-loaded for logged-in user)
**Purpose:** Saves precious time in emergencies.

**Display:**
- Pet name
- Age
- Breed
- Weight
- Allergies
- Ongoing medications
- Prior conditions
- Surgeries
- Vaccinations
- Regular vet
- Emergency contact
- Insurance (if any)

**Actions:**
- Share with clinic (WhatsApp/Email)
- Download PDF
- Edit info

**Technical:** Fetch from existing pet profile API

---

### 5. SITUATION GUIDES (Content Section)
**Purpose:** Actionable emergency guides.

**Main Cards:**
1. My dog ate something toxic
2. My pet is vomiting
3. My dog is bleeding
4. My pet is struggling to breathe
5. My dog is having a seizure
6. My pet is limping
7. Heatstroke
8. Choking
9. My pet is missing
10. My pet is unresponsive

**Each Card Contains:**
- What to do NOW
- What NOT to do
- When to leave immediately
- When to call concierge
- Related products
- Nearby help button

---

### 6. EMERGENCY PRODUCTS (Commerce Layer)
**Purpose:** Useful, not salesy. Only relevant emergency/recovery products.

**Products:**
- First-aid kit
- Sterile gauze
- Bandage wrap
- Cone / e-collar
- Recovery collar
- Thermometer
- Saline wipes
- Tick remover
- Car restraint
- Travel water bowl
- Emergency blanket
- Puppy feeding syringes
- Recovery food
- Calming wraps
- Pee pads
- Medication organiser

---

### 7. SMART PICKS FOR MY DOG (Personalization)
**Purpose:** Emergency essentials for [Pet Name], not generic.

**Logic uses:**
- Breed
- Size
- Coat
- Age
- Life stage
- Health flags
- Anxiety level
- Travel profile
- Home type

**Examples:**

**Labrador:**
- Larger cone
- Bigger first-aid wrap
- Joint support recovery bed
- Heat protection items

**Shih Tzu:**
- Eye-care wipes
- Cooling mat
- Soft recovery cone
- Flat-face breathing caution card

**Senior Indie:**
- Orthopedic rest mat
- Recovery blanket
- Joint-safe mobility harness

**Technical:** Use existing `BreedSmartRecommendations` + `ArchetypeProducts`

---

### 8. SPECIAL EMERGENCY PATHS (Mini-Sections)

**A. Lost Pet**
- Report missing
- Upload photo
- Last seen location
- Notify nearby users / team
- Printable poster
- Alert clinics and shelters
- Concierge help

**B. Travel Emergency**
- Nearest clinic in new city
- Medicine refill while away
- Emergency hotel / boarding fallback
- Transport support
- Shared medical file

**C. Puppy Emergency**
- Feeding issues
- Diarrhea
- Vaccination questions
- Weakness / low energy
- Special products

**D. Senior Emergency**
- Mobility collapse
- Breathing fatigue
- Appetite drop
- Joint pain support
- Post-vet recovery

---

### 9. FOLLOW-UP & RECOVERY
**Purpose:** Makes the page feel complete.

**Include:**
- Discharge checklist
- Medication reminders
- What to feed after illness
- Rest and recovery products
- Follow-up visit help
- Concierge coordination
- "Check in on my pet tomorrow"

---

## Sub-Navigation Menu

| Tab | Type |
|-----|------|
| Urgent Help | Action |
| Near Me Now | Google API |
| Ask Concierge | Concierge |
| My Pet File | Profile |
| Emergency Guides | Content |
| Emergency Essentials | Products |
| Picked for My Dog | Breed/profile logic |
| Lost Pet | Special flow |
| Travel Emergency | Special flow |
| Recovery | Follow-up |

---

## Personalization Logic

**Show to Everyone:**
- Urgent buttons
- Nearby help
- General emergency guides

**Show Based on Pet Profile:**
- Emergency product picks
- Size-based items
- Breed-specific cautions
- Age-specific recovery products
- Travel-related emergency support
- Senior / puppy emergency suggestions

---

## Technical Implementation

### Existing Components to Use:
1. `google_places_service.py` - Google Places API
2. `NearbyPlacesCarousel.jsx` - Nearby places display
3. `LocalPlacesSection.jsx` - Local places section
4. `ServiceCatalogSection.jsx` - Concierge services (hidePrice mode)
5. `BreedSmartRecommendations.jsx` - Breed-based picks
6. `ArchetypeProducts.jsx` - Personality-based picks
7. Pet profile API - For emergency file

### New Components Needed:
1. `UrgentHelpButtons.jsx` - Top action buttons
2. `PetEmergencyFile.jsx` - Pet medical info card
3. `EmergencyGuideCard.jsx` - Expandable situation guide
4. `SpecialEmergencyPath.jsx` - Lost Pet, Travel, Puppy, Senior flows
5. `RecoverySection.jsx` - Follow-up & recovery

### API Endpoints Available:
- `GET /api/emergency/vets` - Emergency vet partners
- `GET /api/places/nearby` - Google Places nearby search
- `GET /api/pets/{pet_id}` - Pet profile data
- `GET /api/products?pillar=emergency` - Emergency products
- `POST /api/service-box/services/{id}/generate-image` - AI service images

---

## Example Page Feel

```
╔════════════════════════════════════════════╗
║           EMERGENCY                        ║
║     Need help right now?                   ║
╠════════════════════════════════════════════╣
║  [URGENT HELP]                             ║
║  🚨 Call Vet | 🏥 Find Clinic | ☠️ Poison  ║
║  🚑 Ambulance | 📋 Open Pet File           ║
╠════════════════════════════════════════════╣
║  [NEAR ME NOW]                             ║
║  Nearest open emergency clinics            ║
║  📍 Happy Paws Vet - 1.2km - Open 24/7    ║
║  📍 Pet Care Hospital - 2.5km - Closes 10pm║
║  [Filters: Open Now | 5km | 24/7 | Rated]  ║
╠════════════════════════════════════════════╣
║  [ASK CONCIERGE]                           ║
║  Need us to coordinate?                    ║
║  [WhatsApp Us] [Request Callback]          ║
╠════════════════════════════════════════════╣
║  [BRUNO'S EMERGENCY FILE]                  ║
║  Age 8 • Labrador • 34kg                   ║
║  Allergies: Chicken                        ║
║  Medications: Joint supplement             ║
║  [Share with Clinic] [Download]            ║
╠════════════════════════════════════════════╣
║  [EMERGENCY GUIDES]                        ║
║  🩸 Bleeding | ☠️ Poisoning | 😮‍💨 Breathing ║
║  🤮 Vomiting | 🦴 Limping | 🌡️ Heatstroke  ║
╠════════════════════════════════════════════╣
║  [EMERGENCY ESSENTIALS FOR BRUNO]          ║
║  Large recovery cone | Cooling mat         ║
║  Joint-support bed | First-aid kit         ║
╚════════════════════════════════════════════╝
```

---

## Implementation Priority

**Phase 1 (Immediate):**
1. Urgent Help buttons
2. Near Me Now (Google Places)
3. Pet Emergency File
4. Expand Emergency Guides

**Phase 2:**
1. Emergency Products section
2. Smart Picks integration
3. Better Concierge CTAs

**Phase 3:**
1. Special Emergency Paths (Lost Pet, Travel, Puppy, Senior)
2. Recovery section
3. Sub-navigation menu

# ONBOARDING REDESIGN - Single Source of Truth (SSOT)

## THE FOUNDING PHILOSOPHY

**Read /app/memory/SOUL_PHILOSOPHY_SSOT.md first.**

This onboarding is not a funnel. It is the first moment a pet parent is asked to truly see their dog.

> "Dogs are not pets first. They are beings first."

---

## Overview
Redesign the `/join` onboarding flow to support multiple pets efficiently without user fatigue.

**Current Problem:** 4 pets × (Photo + Gender + Name + Birthday + 13 Soul Questions) = 70+ interactions = User abandonment

**New Solution:** 5 screens total, all pets on same screens, 5 key pillar questions instead of 13

---

## SCREEN SPECIFICATIONS

### SCREEN 1: Pet Count
**Route:** `/join` (initial screen for non-logged-in users)
**Purpose:** Ask how many pets user has

**UI Elements:**
- Mira logo
- Heading: "How many furry friends do you have?"
- Subheading: "We'll get to know each one personally"
- Quick select buttons: 1, 2, 3, 4, 5, 6, 7, 8
- Custom input: "or enter: [___] pets" (max 50)
- Dog emoji animation
- "Let's Go!" button (pink gradient)

**State:**
```javascript
const [totalPetCount, setTotalPetCount] = useState(1);
const [customPetCount, setCustomPetCount] = useState('');
```

**On Continue:** Go to Screen 2 (Meet Your Pack)

---

### SCREEN 2: Meet Your Pack
**Purpose:** Collect basic info for ALL pets on ONE screen

**UI Elements:**
- Heading: "Let's meet your babies!"
- Scrollable list of pet cards (one per pet based on totalPetCount)

**Each Pet Card Contains:**
```
┌─────────────────────────────────────────────────┐
│ Pet [N] of [Total]                              │
│                                                 │
│ Name: [____________]                            │
│                                                 │
│ Avatar/Photo:                                   │
│ [Grid of 33 breed avatars] [📷 Upload Photo]   │
│                                                 │
│ Gender: [Boy] [Girl]                           │
│                                                 │
│ Birthday:                                       │
│ ○ I know the date: [Date Picker]              │
│ ○ It's their Gotcha day: [Date Picker]        │
│ ○ Approximately: [Dropdown: ~1yr to ~15yrs]   │
└─────────────────────────────────────────────────┘
```

**State:**
```javascript
const [petsBasicInfo, setPetsBasicInfo] = useState([]);
// Each pet object:
// {
//   name: '',
//   avatar: null,        // { emoji, color, breed } or null
//   photo: null,         // File object or null
//   photoPreview: null,  // Base64 string or null
//   gender: '',          // 'boy' or 'girl'
//   birthdayType: '',    // 'exact', 'gotcha', 'approximate'
//   birthday: '',        // Date string
//   approximateAge: ''   // '~1 year', '~2 years', etc.
// }
```

**Validation:**
- All pets must have: name, avatar OR photo, gender, birthday info
- Name: required, min 1 char
- Avatar/Photo: one required
- Gender: required
- Birthday: at least approximate age required

**On Continue:** Go to Screen 3 (Quick Soul Snapshot)

---

### SCREEN 3: Quick Soul Snapshot
**Purpose:** Collect 5 KEY pillar questions for ALL pets on ONE screen

**UI Elements:**
- Heading: "A few quick questions to get started"
- Subheading: "So I can help from day one 💜"
- Scrollable list of pet sections

**Each Pet Section Contains:**
```
┌─────────────────────────────────────────────────┐
│ [Avatar/Photo] Pet Name                         │
│                                                 │
│ 💊 Any allergies?                              │
│    ○ None known                                │
│    ○ Yes: [text input for allergies]          │
│                                                 │
│ 🏥 Any health conditions?                      │
│    ○ None known                                │
│    ○ Yes: [text input for conditions]         │
│                                                 │
│ 🍖 Food preference?                            │
│    Favorite protein: [Chicken ▼]              │
│    Eating style: [Not picky ▼]                │
│                                                 │
│ 🚗 How do they feel about car rides?          │
│    [😰 Anxious] [😐 Okay] [🥰 Loves it!]      │
│                                                 │
│ 🏃 Activity level?                             │
│    [🛋 Couch Potato] [🚶 Moderate] [⚡ Very Active] │
│                                                 │
└─────────────────────────────────────────────────┘
```

**State:**
```javascript
const [petsSoulSnapshot, setPetsSoulSnapshot] = useState([]);
// Each pet object:
// {
//   petIndex: 0,
//   allergies: { hasAllergies: false, details: '' },
//   healthConditions: { hasConditions: false, details: '' },
//   foodPreference: { protein: '', eatingStyle: '' },
//   carRides: '',      // 'anxious', 'okay', 'loves'
//   activityLevel: ''  // 'low', 'moderate', 'high'
// }
```

**Dropdown Options:**
```javascript
const PROTEIN_OPTIONS = ['Chicken', 'Lamb', 'Fish', 'Beef', 'Vegetarian', 'No preference'];
const EATING_STYLE_OPTIONS = ['Very picky', 'Somewhat picky', 'Not picky', 'Eats anything'];
```

**On Continue:** Go to Screen 4 (About You)

---

### SCREEN 4: About You (Parent Details)
**Purpose:** Collect parent/account information

**UI Elements:**
```
┌─────────────────────────────────────────────────┐
│ "Now, a little about you!"                      │
│                                                 │
│ Your Name: [________________________]          │
│                                                 │
│ Email: [________________________]              │
│                                                 │
│ Phone: [________________________]              │
│                                                 │
│ WhatsApp: [________________________] (optional)│
│                                                 │
│ City: [Dropdown with Indian cities]            │
│                                                 │
│ Password: [________________________]           │
│                                                 │
│ ☑ Send me updates about my pets on WhatsApp   │
│                                                 │
│ [Create Account →]                             │
└─────────────────────────────────────────────────┘
```

**State:**
```javascript
const [parentData, setParentData] = useState({
  name: '',
  email: '',
  phone: '',
  whatsapp: '',
  city: '',
  password: '',
  whatsappOptIn: true
});
```

**Validation:**
- Name: required
- Email: required, valid format
- Phone: required, 10 digits
- City: required
- Password: required, min 6 chars

**On Submit:** Call API to create account + all pets, then go to Screen 5

---

### SCREEN 5: Welcome
**Purpose:** Confirm account creation, invite to dashboard

**UI Elements:**
```
┌─────────────────────────────────────────────────┐
│ 🎉 Welcome to the family!                       │
│                                                 │
│ [Display all pet avatars/photos in a row]      │
│                                                 │
│ "I know enough about [Pet Names] to help you   │
│  right away! You can always tell me more to    │
│  unlock deeper personalization."                │
│                                                 │
│ [→ Go to Dashboard]                            │
│                                                 │
│ 💡 Tip: Complete full Soul Profiles to unlock  │
│    premium personalized picks!                  │
└─────────────────────────────────────────────────┘
```

**On Continue:** Navigate to `/mira-demo` (dashboard)

---

## API CHANGES

### Existing Endpoint to Use:
`POST /api/onboarding/membership`

### Request Payload Structure:
```javascript
{
  "parent": {
    "name": "Parent Name",
    "email": "email@example.com",
    "phone": "9876543210",
    "whatsapp": "9876543210",
    "city": "Mumbai",
    "password": "password123",
    "whatsapp_opt_in": true
  },
  "pets": [
    {
      "name": "Mojo",
      "gender": "boy",
      "breed": "Labrador",           // From avatar selection or photo detection
      "species": "dog",
      "photo": "base64string",       // Optional if avatar used
      "avatar": {                    // Optional if photo used
        "emoji": "🦮",
        "color": "from-amber-400 to-orange-500",
        "breed": "Labrador"
      },
      "birthday": "2022-05-15",      // Or null if approximate
      "birthday_type": "exact",      // 'exact', 'gotcha', 'approximate'
      "approximate_age": null,       // Or "~2 years"
      "soul_snapshot": {
        "allergies": [],
        "health_conditions": [],
        "food_preference": {
          "protein": "Chicken",
          "eating_style": "Not picky"
        },
        "car_rides": "loves",
        "activity_level": "high"
      }
    },
    // ... more pets
  ]
}
```

### Backend Changes Needed:
1. Update `/api/onboarding/membership` to accept `soul_snapshot` field
2. Store soul_snapshot data in pet document
3. Use soul_snapshot for initial Mira personalization

---

## COMPONENT STRUCTURE

```
/app/frontend/src/pages/MiraMeetsYourPet.jsx (REWRITE)

Main Component: MiraMeetsYourPet
├── State Management (all screens)
├── Screen Router (switch based on currentScreen)
│
├── PetCountScreen (Screen 1)
│   └── NumberSelector, CustomInput, ContinueButton
│
├── MeetYourPackScreen (Screen 2)
│   └── PetBasicInfoCard (repeated for each pet)
│       ├── NameInput
│       ├── AvatarGrid
│       ├── PhotoUpload
│       ├── GenderSelector
│       └── BirthdaySelector
│
├── SoulSnapshotScreen (Screen 3)
│   └── PetSoulCard (repeated for each pet)
│       ├── AllergiesInput
│       ├── HealthConditionsInput
│       ├── FoodPreferenceSelector
│       ├── CarRidesSelector
│       └── ActivityLevelSelector
│
├── ParentInfoScreen (Screen 4)
│   └── ParentForm
│       ├── NameInput, EmailInput, PhoneInput
│       ├── WhatsAppInput, CitySelector
│       ├── PasswordInput
│       └── OptInCheckbox
│
└── WelcomeScreen (Screen 5)
    └── SuccessAnimation, PetAvatars, DashboardButton
```

---

## AVATAR OPTIONS (33 breeds)

```javascript
const BREED_AVATARS = [
  // Indian Breeds
  { breed: 'Indie', emoji: '🐕', color: 'from-amber-400 to-orange-500' },
  { breed: 'Rajapalayam', emoji: '🦮', color: 'from-gray-100 to-gray-300' },
  { breed: 'Mudhol Hound', emoji: '🐕', color: 'from-amber-600 to-amber-800' },
  { breed: 'Chippiparai', emoji: '🦮', color: 'from-amber-200 to-amber-400' },
  
  // Popular International
  { breed: 'Labrador', emoji: '🦮', color: 'from-yellow-400 to-amber-500' },
  { breed: 'Golden Retriever', emoji: '🐕', color: 'from-yellow-300 to-amber-400' },
  { breed: 'German Shepherd', emoji: '🐕‍🦺', color: 'from-amber-700 to-stone-800' },
  { breed: 'Beagle', emoji: '🐕', color: 'from-amber-200 to-white' },
  { breed: 'Poodle', emoji: '🐩', color: 'from-gray-200 to-white' },
  { breed: 'Bulldog', emoji: '🐕', color: 'from-amber-100 to-amber-300' },
  { breed: 'Rottweiler', emoji: '🐕', color: 'from-stone-800 to-amber-700' },
  { breed: 'Boxer', emoji: '🐕', color: 'from-amber-500 to-amber-700' },
  { breed: 'Dachshund', emoji: '🐕', color: 'from-amber-600 to-amber-800' },
  { breed: 'Shih Tzu', emoji: '🐕', color: 'from-amber-100 to-white' },
  { breed: 'Pomeranian', emoji: '🐕', color: 'from-orange-300 to-amber-500' },
  { breed: 'Husky', emoji: '🐺', color: 'from-gray-400 to-white' },
  { breed: 'Doberman', emoji: '🐕', color: 'from-stone-900 to-amber-700' },
  { breed: 'Great Dane', emoji: '🦮', color: 'from-gray-600 to-gray-800' },
  { breed: 'Pug', emoji: '🐕', color: 'from-amber-200 to-amber-400' },
  { breed: 'Cocker Spaniel', emoji: '🐕', color: 'from-amber-400 to-amber-600' },
  { breed: 'Border Collie', emoji: '🐕', color: 'from-stone-900 to-white' },
  { breed: 'Australian Shepherd', emoji: '🐕', color: 'from-gray-600 to-amber-400' },
  { breed: 'Maltese', emoji: '🐕', color: 'from-white to-gray-100' },
  { breed: 'Yorkshire Terrier', emoji: '🐕', color: 'from-amber-500 to-gray-600' },
  { breed: 'Chihuahua', emoji: '🐕', color: 'from-amber-300 to-amber-500' },
  { breed: 'French Bulldog', emoji: '🐕', color: 'from-gray-400 to-amber-200' },
  { breed: 'Lhasa Apso', emoji: '🐕', color: 'from-amber-200 to-white' },
  { breed: 'Saint Bernard', emoji: '🐕', color: 'from-amber-600 to-white' },
  { breed: 'Dalmatian', emoji: '🐕', color: 'from-white to-gray-900' },
  { breed: 'Pit Bull', emoji: '🐕', color: 'from-gray-500 to-amber-400' },
  { breed: 'Corgi', emoji: '🐕', color: 'from-amber-400 to-white' },
  { breed: 'Akita', emoji: '🐕', color: 'from-amber-500 to-white' },
  { breed: 'Mixed Breed', emoji: '🐕', color: 'from-purple-400 to-pink-400' },
];
```

---

## IMPLEMENTATION STEPS

### Phase 1: Setup & Screen 1
1. Backup current MiraMeetsYourPet.jsx
2. Create new component structure
3. Implement Screen 1 (Pet Count) - already partially exists
4. Test Screen 1

### Phase 2: Screen 2 (Meet Your Pack)
1. Create PetBasicInfoCard component
2. Implement multi-pet state management
3. Add avatar grid with 33 breeds
4. Add photo upload option
5. Add gender selector
6. Add birthday selector with 3 options
7. Test with 1, 2, 4 pets

### Phase 3: Screen 3 (Soul Snapshot)
1. Create PetSoulCard component
2. Implement 5 pillar questions UI
3. Add dropdown selectors
4. Test validation

### Phase 4: Screen 4 (Parent Info)
1. Implement parent form (mostly exists)
2. Add validation
3. Test form submission

### Phase 5: Screen 5 & API Integration
1. Implement welcome screen
2. Connect to /api/onboarding/membership
3. Update backend to accept soul_snapshot
4. Test full flow end-to-end

### Phase 6: Testing & Polish
1. Test with 1 pet
2. Test with 4 pets
3. Test with 12 pets (user's case)
4. Mobile responsiveness
5. Error handling
6. Loading states

---

## FILES TO MODIFY

1. **Frontend:**
   - `/app/frontend/src/pages/MiraMeetsYourPet.jsx` - FULL REWRITE
   
2. **Backend:**
   - `/app/backend/auth_routes.py` - Update membership endpoint to accept soul_snapshot

3. **Memory:**
   - `/app/memory/PRD.md` - Update with new onboarding flow

---

## TESTING CHECKLIST

- [ ] Screen 1: Pet count selection (1-8 buttons work)
- [ ] Screen 1: Custom pet count input works (up to 50)
- [ ] Screen 2: Pet card renders for each pet
- [ ] Screen 2: Avatar selection works
- [ ] Screen 2: Photo upload works
- [ ] Screen 2: Gender selection works
- [ ] Screen 2: Birthday selection (all 3 types) works
- [ ] Screen 2: Validation prevents continue without required fields
- [ ] Screen 3: Soul questions render for each pet
- [ ] Screen 3: All dropdowns/selectors work
- [ ] Screen 4: Parent form validates correctly
- [ ] Screen 4: Submit creates account + all pets
- [ ] Screen 5: Welcome shows all pets
- [ ] Screen 5: Navigate to dashboard works
- [ ] Full flow: 1 pet end-to-end
- [ ] Full flow: 4 pets end-to-end
- [ ] Mobile: All screens responsive

---

## CREDENTIALS FOR TESTING

- Test User: `dipali@clubconcierge.in` / `test123`
- Admin: `aditya` / `lola4304`
- Preview URL: `https://soul-ranked-preview.preview.emergentagent.com`
- Production URL: `https://thedoggycompany.com`

---

## NOTES FOR NEXT AGENT

1. This is a FULL REWRITE of MiraMeetsYourPet.jsx
2. The current file is 2000+ lines - new version should be cleaner
3. Key focus: Multi-pet on SAME screens, not one-pet-at-a-time
4. Soul questions reduced from 13 to 5 key pillar questions
5. Parent info is CRITICAL - don't skip any fields
6. Birthday is CRITICAL for Celebrate pillar
7. User has 12 pets - test with high numbers
8. Backend endpoint `/api/onboarding/membership` exists, may need soul_snapshot field added

---

**Document Created:** March 3, 2026
**Last Updated:** March 3, 2026
**Status:** READY FOR IMPLEMENTATION

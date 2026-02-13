# The Doggy Company - Product Requirements Document

## Original Problem Statement
Build a comprehensive Pet Life Operating System platform for The Doggy Company, featuring AI-powered pet care assistant (Mira), gamification elements, and a modern 7-tab header navigation system.

**Philosophy:**
- **MOJO** = The Pet's Passport / DNA - Single source of truth about the pet
- **Mira** = The Pet's Soul - AI intelligence that knows the pet
- **Concierge®** = The Pet's Hands - Human execution layer

## Core Requirements

### P0 - Critical (ALL COMPLETED ✅)
- [x] **Production Deployment Fix** - Service worker disabled, ErrorBoundary handles chunk errors
- [x] **CSS Chunk Loading Fix (2026-02-13)** - Removed `ios-premium.css` import causing chunk failures
- [x] **MOJO Profile Modal - Phase 1** - Pet Identity Layer with 11 sections
- [x] **Pet OS Navigation Bar** - 7-Layer OS Navigation with beautiful pet avatar
- [x] **Multi-Pet Switching** - Tested - switching pets updates entire OS

### P1 - High Priority (NEXT AGENT TASK)
- [x] **✅ COMPLETED: Connect ALL MOJO Data (2026-02-13)** - Pet data now fully integrated:
  - Fetches from `/api/member/profile?user_email=X` for membership, loyalty_points, badges
  - Fetches from `/api/pets/{pet_id}` for complete pet data including doggy_soul_answers
  - Fetches from `/api/mira/personalization-stats/{pet_id}` for soul scores
  - All 11 MOJO sections display real data with calculated completion percentages
  - Multi-pet switching tested and working
- [ ] **Port Missing Features from Backup Page** (`MiraDemoBackupPage.jsx`):
  - Weather Card integration
  - Health Vault Progress indicator  
  - "Why for {Pet}" badges on recommendations
  - Concierge® Whisper on products
- [ ] **MOJO Modal Phase 2** - Edit functionality for each section (drill-in editing)

### P2 - Medium Priority
- [ ] Render API data in new tabs (picks[], concierge{}, safety_override{})
- [ ] Mobile UX verification (iOS Safari, Android Chrome)

---

## 🎯 SESSION WORK COMPLETED (2026-02-13)

### 1. CSS Chunk Loading Fix ✅
**Problem:** `/mira-demo` page broken on production with "CSS chunk failed to load" error
**Root Cause:** `ios-premium.css` imported non-existent Google Fonts (SF Pro - Apple proprietary)
**Solution:** Removed `ios-premium.css` import from `MiraDemoPage.jsx` and `MiraOSPage.jsx`
**Files Modified:**
- `/app/frontend/src/pages/MiraDemoPage.jsx` (line 112)
- `/app/frontend/src/pages/MiraOSPage.jsx` (line 91)

### 2. Pet OS Navigation Bar ✅
**Created:** `/app/frontend/src/components/Mira/PetOSNavigation.jsx` (500+ lines)

**7 OS Layers Implemented:**
```
[ 🐕 Lola 15% ] | TODAY | PICKS | SERVICES | INSIGHTS | LEARN | CONCIERGE®
   (MOJO)
```

**Pet Avatar Design Features:**
- Beautiful circular design with concentric purple rings
- Health indicator badge (red heart - top left)
- Soul score badge (orange - bottom) showing X% SOUL
- Multi-pet dropdown for switching between pets
- Click opens MOJO Profile Modal

**Multi-Pet Switching Tested:**
- Switched from Lola → Luna
- Entire OS updated: reminders, chat context, "For Luna" section
- **"MOJO feeds all other layers"** - confirmed working

### 3. MOJO Profile Modal ✅
**Created:** `/app/frontend/src/components/Mira/MojoProfileModal.jsx` (1800+ lines)

**Data Integration Completed (2026-02-13):**
- Parallel API fetches from 3 endpoints: `/api/pets/{pet_id}`, `/api/mira/personalization-stats/{pet_id}`, `/api/member/profile`
- Soul score displays from real `overall_score` data
- All 11 sections populated with real `doggy_soul_answers` data
- Section completion percentages calculated dynamically from actual data fields
- Membership tier and loyalty points display correctly
- Bug fixed: `scrollIntoView` null reference error in setTimeout callback

**Entry Points:**
1. Click pet avatar in OS navigation → Opens MOJO modal
2. Click "78% SOUL" badge in ticker → Opens MOJO modal (deep-links to Soul section)

**11 Sections (Accordion Layout):**
| Section | Default State | Purpose |
|---------|--------------|---------|
| Pet Snapshot | Always Visible | Photo, name, breed, age, soul ring, membership |
| Soul Profile | Expanded | 55-question personality vault |
| Health Profile | Collapsed | Allergies, weight, vaccinations |
| Diet & Food | Collapsed | Diet type, feeding schedule |
| Behaviour & Training | Collapsed | Training level, commands |
| Grooming & Care | Collapsed | Coat type, grooming schedule |
| Routine Tracker | Collapsed | Walk frequency, sleep pattern |
| Documents Vault | Collapsed | Certificates, insurance |
| Life Timeline | Collapsed | Milestones, events |
| Preferences & Constraints | Collapsed | Likes, dislikes, fear triggers |
| Membership & Rewards | Bottom | Tier, paw points, badges |

**Files Modified:**
- `/app/frontend/src/pages/MiraDemoPage.jsx` - Integration, state management
- `/app/frontend/src/components/Mira/SoulKnowledgeTicker.jsx` - Added `onSoulBadgeClick` prop
- `/app/frontend/src/components/Mira/PetSelector.jsx` - Added `onPetNameClick` prop

---

## 🔴 CRITICAL: NEXT AGENT INSTRUCTIONS

### Task: Connect ALL MOJO Data to the Pet Identity Layer

**The user's vision:**
> "MOJO is the pet's passport - their whole DNA. Mira is his soul, Concierge® is his hands."

**Data Sources to Connect:**

1. **Pet Profile Data** - `/api/pets/{pet_id}` or `/api/pets/my-pets`
```json
{
  "id": "pet-99a708f1722a",
  "name": "Lola",
  "breed": "Maltese",
  "photo_url": "/api/pet-photo/pet-xxx",
  "overall_score": 34.0,
  "doggy_soul_answers": {
    "temperament": "playful",
    "energy_level": "high",
    "food_allergies": ["chicken"],
    ...
  }
}
```

2. **Member Profile** - `/api/member/profile?user_email=dipali@clubconcierge.in`
```json
{
  "id": "xxx",
  "email": "dipali@clubconcierge.in",
  "membership_tier": "Gold",
  "paw_points": 1670,
  "badges": [...],
  "pets": [...]
}
```

3. **Pet Soul Details** - Study `/pet/{pet_id}` page structure at `https://thedoggycompany.in/pet/pet-99a708f1722a`

4. **Dashboard Data** - Study `https://thedoggycompany.in/dashboard` for:
   - Membership card design
   - Paw points display
   - Badges earned
   - Soul Journey progress

**What MOJO Must Show:**
- REAL pet photos (handle `/api/pet-photo/pet-xxx` URLs)
- REAL soul scores (from `overall_score`)
- REAL membership tier (Gold, Silver, Platinum)
- REAL paw points balance
- REAL badges earned
- REAL soul answers (temperament, energy, allergies, etc.)
- Health vault completion %
- Documents uploaded
- Life timeline events

**Study These Files:**
- `/app/frontend/src/pages/MemberDashboard.jsx` - How dashboard fetches member data
- `/app/frontend/src/pages/MiraDemoBackupPage.jsx` - Missing personalization features to port
- `/app/backend/member_rewards_routes.py` - Rewards/badges endpoints
- `/app/backend/mira_memory_routes.py` - Pet knowledge endpoints

**MOJO Modal Component to Update:**
`/app/frontend/src/components/Mira/MojoProfileModal.jsx`
- Currently uses placeholder/calculated data
- Needs to fetch REAL data from APIs
- Pass `apiUrl` and `token` properly

---

## API Endpoints Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/login` | POST | Login, returns `access_token` |
| `/api/pets/my-pets` | GET | List all user's pets with soul scores |
| `/api/pets/{pet_id}` | GET | Single pet full profile |
| `/api/member/profile?user_email=X` | GET | Membership, paw points, badges |
| `/api/mira/pet/{pet_id}/what-mira-knows` | GET | Soul knowledge items |
| `/api/mira/personalization-stats/{pet_id}` | GET | Soul score details |
| `/api/pet-photo/{pet_id}` | GET | Pet photo (returns image) |

---

## Test Credentials
- **User:** `dipali@clubconcierge.in` / `test123`
- **Admin:** `aditya` / `lola4304`
- **Test Pets:** Lola (34%), Mystique (72%), Bruno (29%), Luna (88%), Buddy (0%), Meister (23%), TestScoring (100%)

---

## Architecture

### Frontend Files (Key)
```
/app/frontend/src/
├── components/Mira/
│   ├── PetOSNavigation.jsx     # NEW: 7-layer OS navigation bar
│   ├── MojoProfileModal.jsx    # NEW: Pet Identity Layer modal
│   ├── SoulKnowledgeTicker.jsx # Modified: onSoulBadgeClick prop
│   ├── PetSelector.jsx         # Modified: onPetNameClick prop
│   └── MiraChatWidget.jsx      # Chat widget with service handoff
├── pages/
│   ├── MiraDemoPage.jsx        # Main demo page with OS navigation
│   ├── MiraDemoBackupPage.jsx  # BACKUP - has missing features to port
│   └── MemberDashboard.jsx     # Reference for member data fetching
```

### Backend Files (Key)
```
/app/backend/
├── mira_routes.py              # Main Mira chat API (20,000+ lines)
├── mira_memory_routes.py       # Pet knowledge, what-mira-knows
├── member_rewards_routes.py    # Membership, paw points, badges
├── adopt_routes.py             # Pet CRUD operations
└── auth_routes.py              # Authentication, user data
```

---

## Missing Features to Port from Backup Page

From `/app/frontend/src/pages/MiraDemoBackupPage.jsx`:

1. **Weather Card** - Shows current weather + "Is it safe to walk {Pet}?"
2. **MIRA Features Grid** - "What can Mira help with?" feature showcase
3. **Health Vault Progress** - "Complete {Pet}'s Health Vault - X% complete"
4. **Vaccine/Vet Reminders** - Inline alerts for overdue items
5. **Daily Digest** - Daily summary of pet info
6. **Milestones** - Pet achievement milestones
7. **Memory Lane** - Historical pet memories
8. **Reorder Suggestions** - "Time to reorder X?" prompts
9. **"Why for {Pet}" Badge** - Per-product personalization on tiles
10. **Concierge® Whisper** - Curator notes on products

---

## Known Issues
- Pet photos may use relative URLs (`/api/pet-photo/pet-xxx`) - need to prepend base URL
- Some pets have no photo - fallback to dicebear avatar
- Membership data requires `user_email` query param

---

## Preview URL
**Working:** https://pet-identity-layer.preview.emergentagent.com/mira-demo

---

## User's Key Quote
> "MOJO = Identity Layer. Mira is his soul, Concierge® is his hands. MOJO feeds all other layers. The pet's whole DNA is there."

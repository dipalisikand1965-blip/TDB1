# Pet Parent Customer Experience (CX) Journey Gap Analysis

## Date: March 8, 2026 (Updated)

## Journey Overview
New Visitor → Awareness → Signup → Add Pet → Browse → Purchase → Return Visit

---

## ✅ RESOLVED GAPS (March 8, 2026)

### Gap: Personality Traits Same for All Pets - ✅ FIXED
**Fix Applied**: Updated WelcomeHero.jsx and MiraDemoBackupPage.jsx
- Now dynamically generates traits from `soul.personality_tag`, `doggy_soul_answers.general_nature`, `soul.love_language`, `doggy_soul_answers.describe_3_words`, and `soul.energy_level`
- Falls back to "Unique soul" only if no data available
- No more hardcoded "Glamorous soul, Elegant paws, Devoted friend"

### Gap: Soul Knowledge Ticker Not Visible - ✅ FIXED
**Fix Applied**: Added `<SoulKnowledgeTicker>` component to MiraDemoPage.jsx
- Shows pet's soul knowledge at top of chat area
- Displays personality, favorites, allergies, traits
- Clickable to open full MOJO profile modal
- Links to Soul Builder for incomplete profiles

### Gap: Voice Auto-Plays Without Consent - ✅ ALREADY FIXED
**Status**: Voice defaults to OFF in useVoice.js and useMiraShell.js
- User must explicitly enable voice
- Preference persists in localStorage

### Gap 1: "Add Your Pet" Button - ✅ FIXED
**Fix Applied**: Created `/add-pet` page (AddPetPage.jsx)
- 3-step flow: Name/Photo → Basic Info → Soul Snapshot
- Works for logged-in users
- All "Add Pet" buttons updated to use `/add-pet`

### Gap 2: No Direct Pet Registration for Existing Users - ✅ FIXED
**Fix Applied**: AddPetPage.jsx handles this case

### Gap 3: Signup Doesn't Collect Pet Info - ✅ ALREADY WORKING
**Status**: The `/join` flow (MiraMeetsYourPet.jsx) includes pet info collection

### Gap 5: Dashboard Missing "Complete Your Pet Soul" CTA - ✅ FIXED
**Fix Applied**: 
- Shows for ALL pets with Soul Score < 80%
- Prominent gradient button for scores < 50%
- Subtle button for scores 50-80%

### Gap 6: No Upcoming Event Alerts - ✅ FIXED
**Fix Applied**: Added to PetHomePage.jsx
- Birthday alerts (within 30 days)
- Gotcha Day / Adoption Anniversary
- Vaccination due reminders
- Sorted by priority

### Gap 10: Checkout Missing Pet Selection - ✅ FIXED
**Fix Applied**: UnifiedCheckout.jsx
- Shows user's pets as selectable cards
- Auto-selects first pet
- "Other Pet" option for manual entry

---

## ⚠️ REMAINING GAPS

### Gap 4: Pet Soul Score Shows 0% for Non-Logged Users
**Status**: ⚠️ Low priority - edge case

### Gap 6: No Upcoming Events/Reminders on Dashboard
**Location**: `/dashboard` page
**Issue**: No birthdays, vaccinations, or other upcoming events shown
**Impact**: Misses opportunity for engagement and care reminders
**Fix**: Add "Upcoming Events" card showing next birthday, vaccination due, etc.

### Gap 7: Checkout Pet Details Pre-fill Issue
**Location**: `/checkout` page
**Issue**: User reported email showing as pet name
**Root Cause**: Likely localStorage corruption or wrong field mapping
**Fix**: Already added "Clear saved details" button, but need to verify mapping

---

## 🟡 MEDIUM PRIORITY GAPS (UX Improvements)

### Gap 8: Login Page Says "Welcome Back" to New Users
**Location**: `/login` page
**Issue**: Text assumes returning user even for new visitors coming from "Join" link
**Fix**: Dynamic text based on referral source

### Gap 9: Multiple Conflicting CTAs on Pet Soul Page
**Location**: `/pet-soul` page
**Issue**: "Become a Member" vs "+ Add Your Pet" - unclear which to click
**Fix**: Consolidate to single clear CTA

### Gap 10: No "Quick Add Pet" for Repeat Purchases
**Location**: `/checkout` page
**Issue**: When ordering for a different pet, user must manually clear and re-enter
**Fix**: Add pet selector dropdown for logged-in users with registered pets

### Gap 11: Post-Purchase Follow-up Missing
**Location**: Order confirmation
**Issue**: After order, no clear "What's Next" guidance
**Fix**: Add order tracking, care tips, or related product suggestions

---

## 🟢 NICE TO HAVE (Enhancement Opportunities)

### Gap 12: No Onboarding Wizard
**Issue**: New users figure out the platform themselves
**Fix**: Step-by-step wizard: Add Pet → Set Preferences → First Order

### Gap 13: Missing "Pet Birthday Coming Up" Alerts
**Issue**: No proactive alerts about upcoming pet birthdays
**Fix**: Add to dashboard + email/WhatsApp notification

### Gap 14: No Multi-Pet Quick Switch in Header
**Issue**: Users with multiple pets can't quickly switch context
**Fix**: Add pet selector dropdown in header

---

## Priority Fix Order

1. **Gap 1**: Fix "Add Your Pet" button - CRITICAL
2. **Gap 3**: Post-signup redirect to pet addition
3. **Gap 5**: Add "Complete Pet Soul" CTA on dashboard
4. **Gap 2**: Create AddPet flow for existing users
5. **Gap 6**: Add upcoming events to dashboard
6. **Gap 10**: Pet selector in checkout for logged-in users

---

## Files to Modify

- `/app/frontend/src/App.js` - Add `/pets/add` route
- `/app/frontend/src/components/MiraContextPanel.jsx` - Fix button redirect
- `/app/frontend/src/pages/Register.jsx` - Add post-signup redirect
- `/app/frontend/src/pages/MemberDashboard.jsx` - Add Pet Soul CTA + Events
- `/app/frontend/src/pages/Checkout.jsx` - Add pet selector
- `/app/frontend/src/pages/MyPets.jsx` - Fix "Add Pet" functionality

---

## Recommended New Components

1. **AddPetModal.jsx** - Quick pet addition modal for existing users
2. **PetSoulCompletionCTA.jsx** - Dashboard widget to encourage profile completion
3. **UpcomingEventsCard.jsx** - Dashboard widget showing birthdays, vaccinations
4. **PetQuickSelector.jsx** - Header/checkout dropdown to switch between pets

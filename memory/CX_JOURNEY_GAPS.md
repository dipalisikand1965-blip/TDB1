# Pet Parent Customer Experience (CX) Journey Gap Analysis

## Date: January 24, 2026

## Journey Overview
New Visitor → Awareness → Signup → Add Pet → Browse → Purchase → Return Visit

---

## 🔴 CRITICAL GAPS (Blocking Conversion)

### Gap 1: "Add Your Pet" Button Goes Nowhere
**Location**: `/pet-soul` page, `MiraContextPanel.jsx`
**Issue**: Button points to `/pets/add` which doesn't exist as a route
**Impact**: User clicks but nothing happens - dead end
**Fix**: 
- Create AddPet flow OR 
- Redirect to `/pet-soul-onboard` (membership onboarding which includes pet registration)

### Gap 2: No Direct Pet Registration for Existing Users
**Location**: App routing
**Issue**: Logged-in users who want to add another pet have no clear path
**Current Options**: 
- `/my-pets` shows existing pets but "Add Pet" doesn't work
- `/pet-soul-onboard` is designed for new membership, not existing users
**Fix**: Create a simple "Add Pet" modal or page for existing users

### Gap 3: Signup Doesn't Collect Pet Info
**Location**: `/register` page
**Issue**: User signs up without adding pet - then has no clear path to add one
**Impact**: Users get stuck after signup
**Fix**: Either:
- Add pet info to signup flow OR
- Auto-redirect to "Add Pet" after signup

---

## 🟠 HIGH PRIORITY GAPS (Friction Points)

### Gap 4: Pet Soul Score Shows 0% for Non-Logged Users
**Location**: `/pet-soul` page
**Issue**: Confusing to show 0% when user isn't logged in
**Fix**: Show "Sign up to track your score" instead

### Gap 5: Dashboard Missing "Complete Your Pet Soul" CTA
**Location**: `/dashboard` page
**Issue**: User with 18% Pet Soul score sees no prominent call to action
**Impact**: Users don't know they should complete their profile
**Fix**: Add prominent "Complete Your Pet Soul - 82% remaining" card with one-click start

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

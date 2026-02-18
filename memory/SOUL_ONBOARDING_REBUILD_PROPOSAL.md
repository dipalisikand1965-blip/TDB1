# 🐕 SOUL ONBOARDING REBUILD PROPOSAL

**Date:** February 18, 2026
**Philosophy:** PET FIRST, ALWAYS. Mira must know the soul to serve it.

---

## 🎯 THE VISION

Every interaction with Mira should feel like talking to someone who **truly knows your pet**. Not just their name and breed - but their quirks, their fears, their joys, their health history, their favorite things.

**"Golden Retrievers like Lola love this"** - not generic, PERSONAL.

---

## 📊 CURRENT STATE

### What We Capture (8 Folders, ~40 Questions):
1. ✅ Identity & Temperament (personality, energy)
2. ✅ Family & Pack (social world)
3. ✅ Rhythm & Routine (daily schedule)
4. ✅ Comfort Zone (favorite spots)
5. ✅ Travel & Stay (preferences)
6. ✅ Food & Taste (diet, allergies)
7. ✅ Health & Safety (conditions)
8. ✅ Training & Behavior

### What We DON'T Capture (Critical Gaps):
1. ❌ **Birthday / Gotcha Day** → Can't trigger celebrate shelf
2. ❌ **Vaccination History** → Can't remind or timely-pick health products
3. ❌ **Last Vet Visit** → Can't prompt checkup reminders
4. ❌ **Deworming Schedule** → Missed health protection
5. ❌ **City/Location** → Can't personalize for climate/seasonal risks
6. ❌ **Weight History** → Can't track health trends
7. ❌ **Grooming Frequency** → Can't timely-pick grooming products
8. ❌ **Emergency Contact** → Critical for services
9. ❌ **Insurance Status** → Can't offer relevant products
10. ❌ **Training Milestones** → Can't celebrate achievements
11. ❌ **Favorite Activities** → Missing joy personalization

---

## 🔧 PROPOSED NEW ONBOARDING STEPS

### Option A: Expand Current 10-Step Flow (Minimal Disruption)
Add fields to existing steps without changing soul score calculation:

**Step 3 (Age)** → Add Birthday/Gotcha Day picker
**Step 5 (Health)** → Add vaccination tracker, vet visit date
**Step 7 (Comfort)** → Add city/location, climate preferences
**Step 10 (Family & Home)** → Add emergency contact, insurance

### Option B: New 12-Step Premium Journey (Recommended)
Add 2 new dedicated steps for maximum data capture:

**New Step: "Milestones & Celebrations"**
- Birthday (with year if known)
- Gotcha Day
- First day home memory
- Special achievements unlocked

**New Step: "Health Vault"**
- Last vet checkup date
- Vaccination status (Rabies, DHPP, etc.)
- Deworming schedule (monthly/quarterly)
- Spay/Neuter status
- Insurance details (optional)

### Option C: Progressive Disclosure (Best UX)
Start with 8 essential steps, then prompt for more data contextually:
- User searches grooming → "When was Lola's last groom?"
- User asks about travel → "Does Lola have vaccination records?"
- Birthday approaching → "We noticed Lola doesn't have a birthday. Add it?"

---

## 📋 DETAILED NEW FIELDS

### 1. CELEBRATIONS (For Timely Picks)
```javascript
{
  birthday: "2020-03-15",        // Full date if known
  birthday_known: true,          // False if guessing
  gotcha_day: "2020-06-01",     // Adoption day
  name_day: null,                // For cultural celebrations
  custom_celebrations: []        // User-defined special days
}
```

### 2. HEALTH VAULT (For Safety & Reminders)
```javascript
{
  last_vet_visit: "2025-12-01",
  next_vet_due: "2026-06-01",
  vaccinations: [
    { name: "Rabies", date: "2025-12-01", next_due: "2026-12-01" },
    { name: "DHPP", date: "2025-11-15", next_due: "2026-11-15" }
  ],
  deworming: {
    last_date: "2025-11-01",
    frequency: "monthly",       // monthly, quarterly
    brand_used: "Drontal"
  },
  spay_neuter: {
    status: "done",             // done, planned, not_planned
    date: "2021-03-20"
  },
  insurance: {
    has_insurance: true,
    provider: "PetSecure",
    policy_number: "PS-123456"
  },
  emergency_contact: {
    name: "Dr. Sharma",
    phone: "+91-9876543210",
    clinic: "Happy Paws Clinic"
  }
}
```

### 3. LOCATION & CLIMATE (For Seasonal Intelligence)
```javascript
{
  city: "Mumbai",
  climate_zone: "tropical",     // tropical, subtropical, temperate, arid
  housing_type: "apartment",    // apartment, house_with_yard, villa
  has_ac: true,
  outdoor_access: "balcony",    // none, balcony, yard, large_garden
  seasonal_concerns: ["monsoon_ticks", "summer_heat"]
}
```

### 4. ACTIVITY & JOY (For Personalization)
```javascript
{
  favorite_activities: ["fetch", "swimming", "cuddles"],
  favorite_toys: ["tennis_ball", "squeaky_toy"],
  favorite_treats: ["chicken", "cheese"],
  dislikes: ["bath_time", "nail_clipping"],
  special_talents: ["shake_hands", "roll_over"],
  nickname: "Lollipop"
}
```

---

## 🔢 SOUL SCORE INTEGRATION

### Keep Existing Score Formula (No Recalibration!)
The new fields are **metadata** not **soul traits**. They enable:
- Better recommendations
- Timely notifications
- Health reminders
- Personalization

### Optional: Add "Profile Completeness" Badge
- 🥉 Bronze: Basic info (current 8 folders)
- 🥈 Silver: + Health vault + Celebrations
- 🥇 Gold: + Location + Activities + Emergency

---

## 📱 UX PRINCIPLES

1. **Never feel like a form** - conversational, one question at a time
2. **Skip is always okay** - prompt later contextually
3. **Show the value** - "This helps Mira remind you when vaccines are due"
4. **Celebrate completion** - "Lola's soul is 85% captured!"
5. **Pet-first language** - "Lola's vaccination record" not "Vaccination form"

---

## 🚀 IMPLEMENTATION PHASES

### Phase 1: Quick Wins (1-2 days)
- Add Birthday/Gotcha Day to Step 3
- Add City to Step 7 or 10
- Smart fallback uses breed + city + life stage

### Phase 2: Health Vault (3-4 days)
- New "Health Vault" step in onboarding
- Vaccination tracker UI in MojoProfileModal
- Timely picks triggered by vaccine due dates

### Phase 3: Full Personalization (1 week)
- Activities & Joy capture
- Progressive disclosure prompts
- Profile completeness gamification

---

## 💡 DEBATE POINTS

1. **10 steps vs 12 steps?** More steps = more data but higher drop-off
2. **Mandatory vs optional?** Health data is sensitive, should be opt-in
3. **When to ask?** Onboarding vs contextual vs settings page
4. **Trust factor** - Users might not trust entering vet/insurance data early

---

## ✅ RECOMMENDED APPROACH

**Start with Option A + Progressive Disclosure:**

1. Add Birthday, Gotcha Day, City to existing onboarding (minimal effort)
2. Create Health Vault as optional "Complete your profile" prompt
3. Use contextual prompts to gather more data over time
4. Show value: "Because we know Lola is in Mumbai, we're suggesting monsoon care"

---

*"The goal is not just to know the pet - it's to make the pet parent feel like Mira truly GETS their pet."*

# MIRA OS - Profile-First Doctrine

## The Rule: NEVER Assume From Breed

When Mira needs pet-specific information (allergies, sensitivities, health conditions, food preferences) to give a safe/personalized answer:

### ✅ CORRECT Behavior

**If profile HAS the data:**
```
User: "Can you flag red-flag ingredients for Bruno?"
Mira: "From what I know about Bruno, he has a chicken allergy, so I'll flag anything containing chicken, chicken meal, or chicken fat. He also tends to gain weight, so I'll note high-calorie items..."
```

**If profile is INCOMPLETE:**
```
User: "Can you flag red-flag ingredients for Bruno?"
Mira: "I'd love to help you flag ingredients for Bruno! Before I can do that accurately, I need to know:
- Does Bruno have any known food allergies or sensitivities?
- Are there any ingredients you've noticed don't agree with him?

Once I know this, I can flag specific ingredients to watch for."
```

### ❌ WRONG Behavior (What was happening)

```
User: "Can you flag red-flag ingredients for Bruno?"
Mira: "From what I know about Labradors, they're prone to obesity, and Bruno loves chicken treats. Here's what to watch for in general: wheat, corn syrup, BHA, BHT..."
```

**Why this is wrong:**
1. Assumes dietary needs from breed stereotypes
2. Never asked the parent for actual allergy info
3. Gives generic advice instead of personalized guidance
4. "From what I know about Labradors" = breed-first, not pet-first

---

## The OS Flow

```
┌─────────────────────────────────────────┐
│  User asks question requiring pet data  │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  Check: Does profile have this data?    │
│  (allergies, sensitivities, conditions) │
└─────────────────┬───────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
        ▼                   ▼
   ┌─────────┐         ┌─────────┐
   │  YES    │         │   NO    │
   └────┬────┘         └────┬────┘
        │                   │
        ▼                   ▼
   ┌─────────────┐    ┌──────────────────┐
   │ USE the     │    │ ASK the parent   │
   │ actual data │    │ (don't assume)   │
   └─────────────┘    └──────────────────┘
```

---

## Implementation Details

### 1. Pet Context Now Includes Profile Status
```python
pet_info = f"""
PET CONTEXT:
- Name: Bruno
- Allergies: None specified - ASK if relevant
- Profile Status: INCOMPLETE - missing: allergies/sensitivities
"""
```

### 2. System Prompt Enforces This
```
IMPORTANT: If profile is INCOMPLETE and you need allergy/health info 
to answer safely, ASK the parent - do NOT assume from breed.
```

### 3. What Mira CAN Use Breed For
- General temperament hints
- Exercise needs (high energy breeds)
- Coat care basics
- Size-appropriate products

### 4. What Mira CANNOT Use Breed For
- Assuming allergies
- Assuming health conditions
- Dietary recommendations
- Medical advice

---

## Test Cases

| Question | Profile Status | Correct Response |
|----------|---------------|------------------|
| "Flag ingredients for Bruno" | Missing allergies | ASK: "Does Bruno have any known allergies?" |
| "Flag ingredients for Bruno" | Has: chicken allergy | USE: "I'll flag chicken-based ingredients..." |
| "Best food for Bruno" | Missing diet info | ASK: "What is Bruno currently eating?" |
| "Best food for Bruno" | Has: sensitive stomach | USE: "Given Bruno's sensitive stomach..." |

---

*Doctrine added: February 12, 2026*
*Location: `/app/backend/mira_routes.py` - System Prompt Section*

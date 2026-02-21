# THE DOGGY COMPANY - BRAND STANDARD & PERSONALIZATION SPEC

## CRITICAL UNDERSTANDING

This document captures the ACTUAL brand standard from the live site at thedoggycompany.in.
Any AI/agent working on Mira or the Pet OS MUST follow these standards.

---

## 1. PILLAR PAGE TITLES - THE GOLD STANDARD

Every pillar page personalizes with the pet's name:

| Pillar | Title Format |
|--------|--------------|
| Celebrate | "Celebrations for {name}" |
| Dine | "Food & Treats for {name}" |
| Care | "Everyday Care for {name}" |
| Travel | "Travel with {name}" |
| Stay | "Places {name} Feels at Home" |
| Enjoy | "Joyful Experiences for {name}" |
| Fit | "Movement & Energy for {name}" |
| Learn | "Learning with {name}" |
| Advisory | "Guidance for {name}" |
| Emergency | "If Something Feels Urgent" |
| Paperwork | "Paperwork for {name}" |
| Farewell | "Honouring {name}" |
| Adopt | "Finding the Right Companion" |

**Source:** `/app/frontend/src/components/UnifiedHero.jsx` lines 67-86

---

## 2. SUBHEADLINE - THE EMOTIONAL HOOK

Each pillar has a subheading that speaks to the FEELING:

| Pillar | Subheadline |
|--------|-------------|
| Travel | "Thought through so the journey feels easy" |
| Celebrate | "Mark the moments that matter to Your Pet" |
| Care | [needs to be confirmed from live site] |

These are NOT generic. They speak to:
- The emotion of the moment
- The worry/joy the pet parent feels
- The outcome they desire

---

## 3. MIRA'S PERSONALIZATION STANDARD

When Mira speaks, she must:

### A. Know the Pet's Soul
```
From what I know about Buddy:
- He comes alive with play and interaction
- We'll keep his sensitivities in mind so he's comfortable
```

### B. Reference Specific Traits
- Chicken allergy (sensitivities)
- Tendency to gain weight (health concerns)
- Love for tennis balls (favorites)
- Peanut butter treats (preferences)

### C. Speak to the Parent's Emotion
"That sounds like a lot to hold, making sure Buddy is well taken care of..."

### D. Ask Clarifying Questions (Not Dump Products)
"Would you like this to be something active and playful for him, or a simpler, cosy celebration this year?"

---

## 4. THE MULTI-PET SYSTEM (ALREADY BUILT!)

### A. Components Already Existing:
1. **MultiPetSelector.jsx** - `/app/frontend/src/components/MultiPetSelector.jsx`
   - Multi-pet selection for services
   - Select one, multiple, or all pets
   - Pillar-specific color theming

2. **PillarContext.jsx** - `/app/frontend/src/context/PillarContext.jsx`
   - Global pet state management
   - `currentPet`, `setCurrentPet`
   - Pet switching across pages

3. **PillarPageLayout.jsx** - `/app/frontend/src/components/PillarPageLayout.jsx`
   - Unified hero with pet photo
   - Soul score arc
   - Mira's message

4. **UnifiedHero.jsx** - `/app/frontend/src/components/UnifiedHero.jsx`
   - Personalized hero making pet the HERO
   - Pillar-specific gradients (Dog Soul Colors)
   - Breed-specific trait pools

### B. How Pet Switching Works:
```javascript
// From PillarPageLayout.jsx
const { currentPet, setCurrentPet, pets: contextPets } = usePillarContext();
```

The system already has:
- Global pet state via PillarContext
- Pet selector on pillar pages
- Personalized content per pet

---

## 5. MIRA CHAT WIDGET (ALREADY BUILT!)

**Location:** `/app/frontend/src/components/MiraChatWidget.jsx`

Features:
- Floating chat widget (MakeMyTrip-style)
- Opens as clean chat modal
- Non-blocking, minimizable
- Works on all pillar pages
- Session persistence per pillar

---

## 6. CONCIERGE EXPERIENCES - THE ELEVATED TIER

Each pillar has "Concierge Experiences" - these are NOT products/services, they are:
- Full-service coordination
- White-glove handling
- Named experiences with ®

Examples from Travel:
- Luxe Air Concierge®
- Road Trip Architect®
- Relocation Navigator®
- Vet Visit Valet®

---

## 7. THE REMEMBER → ASK → CONFIRM → ACT FLOW

For complex requests (PLAN intent):

1. **REMEMBER**: "From what I know about Buddy..."
2. **ASK**: Clarifying questions in amber strip
3. **CONFIRM**: Validate understanding
4. **ACT**: Show relevant products/book service

**NEVER** show products before completing REMEMBER and ASK phases.

---

## 8. DOG SOUL COLORS - EMOTIONAL GRADIENTS

Each pillar has a specific color gradient that reflects the dog's emotional state:

| Pillar | Gradient | Emotion |
|--------|----------|---------|
| Celebrate | Pink → Purple | Pure joy, party excitement |
| Dine | Amber → Brown | Satisfied belly, comfort |
| Care | Rose → Purple | Gentle touch, feeling loved |
| Travel | Teal → Blue | Adventure, new smells |
| Enjoy | Blue → Cyan | Playful energy, happiness |
| Stay | Green → Earthy | Safe, cozy, belonging |
| Emergency | Red → Dark | Alert but cared for |

**Source:** `UnifiedHero.jsx` lines 17-65

---

## 9. FILES OF REFERENCE

### Core Components:
- `/app/frontend/src/components/UnifiedHero.jsx` - Personalized hero
- `/app/frontend/src/components/PillarPageLayout.jsx` - Pillar page wrapper
- `/app/frontend/src/components/MultiPetSelector.jsx` - Multi-pet selection
- `/app/frontend/src/components/MiraChatWidget.jsx` - Floating chat widget
- `/app/frontend/src/components/MiraOrb.jsx` - The visual orb
- `/app/frontend/src/components/MiraLoveNote.jsx` - Mira's personalized messages
- `/app/frontend/src/components/ConciergeExperienceCard.jsx` - Elevated experiences

### Context/State:
- `/app/frontend/src/context/PillarContext.jsx` - Global pet state

### Pillar Pages (examples):
- `/app/frontend/src/pages/TravelPage.jsx`
- `/app/frontend/src/pages/CelebratePage.jsx`
- `/app/frontend/src/pages/CarePage.jsx`

---

## 10. WHAT MIRA DEMO PAGE NEEDS TO MATCH

The current MiraDemoPage.jsx does NOT match the brand standard because:

1. ❌ Generic "How can I help with Buddy today?" vs ✅ "{Pillar} for Buddy"
2. ❌ No emotional subheadline
3. ❌ Products shown before proper conversation
4. ❌ Not using UnifiedHero or PillarPageLayout
5. ❌ Not using the Dog Soul Colors

### The Fix:
MiraDemoPage should either:
A. Use PillarPageLayout wrapper, OR
B. Replicate the same personalization patterns

---

## 11. TONE & VOICE

### Mira's Voice:
- Thoughtful, not transactional
- Knows the pet's soul
- Speaks to emotions first
- Never dumps products
- Always asks before acting
- References specific pet details

### Example Good Response:
```
That's a lovely thought. Birthdays don't have to be big to be special — 
they just need to feel right for Buddy and for you. From what I know 
about Buddy, he comes alive with play and interaction, and we'll keep 
his sensitivities in mind so he's comfortable the whole time.

Would you like this to be something active and playful for him, 
or a simpler, cosy celebration this year?
```

### Example Bad Response:
```
Here are some birthday products for your dog!
[Products dumped immediately]
```

---

## LAST UPDATED
February 7, 2026

## CREATED BY
Analysis of live site thedoggycompany.in and codebase audit

# MIRA OS - Single Source of Truth (SSOT)
## The Doggy Company Pet Operating System
**Last Updated:** December 2025 (Session 4)  
**Live Site:** https://thedoggycompany.com  
**Preview:** https://mira-sandbox-1.preview.emergentagent.com

---

## Quick Links
| Document | Purpose |
|----------|---------|
| [MASTER_INDEX.md](./MASTER_INDEX.md) | Complete system directory |
| [MIRA_BIBLE.md](./MIRA_BIBLE.md) | AI personality & behavior |
| [ONE_SPINE_SPEC.md](./ONE_SPINE_SPEC.md) | Architecture spec |
| [PRD.md](./PRD.md) | Product requirements |

---

## 🚀 SESSION 4 PRIORITY: "MIRA MEETS YOUR PET" ONBOARDING

### The Vision
World-class, never-done-before pet onboarding that feels like **magic, not forms**.
- Under 3 minutes to Pet Home with ~30-35% soul score
- One question per screen (tap game, not questionnaire)
- Instant "Mira now knows..." feedback after every answer
- Soul ring grows in real-time
- Stop anytime, continue later

### The Flow
```
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 1: PHOTO HOOK (30 sec)                                            │
│  ─────────────────────────────────────────────────────────────────────  │
│  • Upload pet photo                                                     │
│  • AI breed detection: "Mira thinks Golden Retriever" [Confirm][Change] │
│  • "What's their name?" → Mystique                                      │
│  • "Do you have a pet name for them?" → Misty                          │
├─────────────────────────────────────────────────────────────────────────┤
│  STEP 2: PARENT INFO (60 sec)                                           │
│  ─────────────────────────────────────────────────────────────────────  │
│  One clean screen (not multi-step form):                                │
│  • Name, Email, Phone, WhatsApp                                         │
│  • City (for shipping/services)                                         │
│  • Password                                                             │
│  • Notification preferences (quick toggles)                             │
│  • Terms & Privacy (one checkbox)                                       │
├─────────────────────────────────────────────────────────────────────────┤
│  STEP 3: SOUL GAME (2-3 min)                                            │
│  ─────────────────────────────────────────────────────────────────────  │
│  15 core questions, one per screen, tap chips:                          │
│  1. Gender (Male/Female)                                                │
│  2. Birthday or Gotcha Day (date picker)                                │
│  3. Life stage (Puppy/Adult/Senior)                                     │
│  4. General nature (Playful/Calm/Curious/Shy)                           │
│  5. Stranger reaction (Friendly/Cautious/Nervous)                       │
│  6. Food allergies (None/Chicken/Grains/etc.)                           │
│  7. Favorite protein (Chicken/Lamb/Fish/etc.)                           │
│  8. Exercise needs (Low/Medium/High)                                    │
│  9. Health conditions (None/Allergies/Arthritis/etc.)                   │
│  10. Grooming tolerance (Loves it/Tolerates/Hates it)                   │
│  11. Separation anxiety (Yes/No/Sometimes)                              │
│  12. Lives with (Just me/Family/Roommates)                              │
│  13. Other pets (None/Dogs/Cats/Both)                                   │
│  14. Spayed/Neutered (Yes/No/Not sure)                                  │
│  15. What do you want most for {Pet}? (Free text)                       │
│                                                                         │
│  After each answer: "✨ Mira now knows: {one fact}"                     │
│  Progress: Soul ring grows from 0% → ~35%                               │
├─────────────────────────────────────────────────────────────────────────┤
│  STEP 4: PAYOFF REVEAL (10 sec)                                         │
│  ─────────────────────────────────────────────────────────────────────  │
│  • Soul ring glowing at 35%                                             │
│  • "Here's what Mira knows about Misty:" (5 bullets)                    │
│  • [See Misty's Home →] [Keep Teaching Mira]                            │
├─────────────────────────────────────────────────────────────────────────┤
│  STEP 5: PET HOME (Default Landing)                                     │
│  ─────────────────────────────────────────────────────────────────────  │
│  A) Pet Hero: Avatar + Name + Breed + Soul Ring + 3 Traits              │
│  B) "What would you like to do for Misty?" → Pillar shortcuts           │
│  C) Picks button (sticky top): "Picks for Misty (3)"                    │
│  D) Proactive alerts: Birthday/Vaccine/Grooming                         │
│  E) Open Requests strip: "You have X open requests"                     │
│  F) Talk to Mira CTA (fixed bottom)                                     │
└─────────────────────────────────────────────────────────────────────────┘
```

### Entry Points
| Entry | Flow |
|-------|------|
| New user | Login/Signup → Mira Meets Your Pet |
| Existing user adding pet | Pet switcher → "Add pet" → Mira Meets Your Pet |

### UI Rules
- **One question per screen** - Never show a long form
- **Tap to answer** - 3-6 chips per question
- **Always visible**: Soul ring %, "Mira knows {Pet}", Skip button
- **Microfeedback**: "Mira now knows: {fact}" after every answer
- **Stop anytime**: Exit returns to Pet Home; continue later via "Grow Soul"

### Breed Detection Rules
```javascript
{
  breed_detected: "Golden Retriever",
  breed_confirmed: false,        // Always false until user confirms
  confidence_score: 0.87         // 0-1 scale
}
```
- Confidence >0.7: "Mira thinks {Breed}" + [Confirm][Change]
- Confidence <0.7: "Looks like {Breed} — confirm?" + [Confirm][Change]
- Never hard-lock breed without confirm

### Medical Boundaries
If user selects serious conditions (Diabetes, Heart, Seizures):
```
"This is important. Would you like Mira to flag this for 
your next vet visit or connect you to emergency care?"
[Note for Vet Visit] [Emergency Help] [Continue]
```

### Data Flow (Everything Has a Place)
| Data | Where Asked | Where Used |
|------|-------------|-----------|
| Photo | Step 1 | Everywhere (avatar) |
| Name + Nickname | Step 1 | Everywhere (formal + casual) |
| Breed | Step 1 (AI detected) | Breed-specific tips, products |
| Temperament | Soul Game | Service matching, care notes |
| Food allergies | Soul Game | Dine filtering, alerts |
| Health conditions | Soul Game | Care reminders, vet alerts |
| Exercise needs | Soul Game | Activity recommendations |
| Grooming tolerance | Soul Game | Service booking prep |

### Pet Home as Default Landing
| Trigger | Destination |
|---------|-------------|
| After onboarding | Pet Home |
| After login | Pet Home |
| After pillar visit | Back to Pet Home |
| Multiple pets | Pet Home with last active pet |

### Living Home Refresh
| Trigger | What Refreshes |
|---------|---------------|
| Soul answer saved | Traits + Picks |
| Order completed | Alerts |
| Ticket resolved | Open Requests |
| Login | Light refresh (alerts check) |

When something changes: "✨ Mira learned something new about {Pet}"

---

## 🐛 KNOWN BUGS (Priority Order)

### P0 - Critical (Fix This Session)
| Bug | Status | Details |
|-----|--------|---------|
| Old onboarding flow | 🔴 REPLACE | 4-step form is tedious, duplicate questions |
| Soul Builder duplicates | 🔴 FIX | Same questions in onboarding AND Soul Builder |
| After onboarding → wrong page | ✅ FIXED | Now auto-logins and redirects to Soul Builder |
| User sees other user's data | ✅ FIXED | "Skip Demo" now creates account + auto-login |

### P1 - Important
| Bug | Status | Details |
|-----|--------|---------|
| MiraDemoPage header not sticky | ✅ FIXED | Header now sticks to top in modal |
| Chat input not visible in modal | ✅ FIXED | Composer fixed to bottom |
| Card layout overlap on pillars | 🟡 PARTIAL | Fixed on StayPage, need to apply to all |

### P2 - Nice to Have
| Bug | Status | Details |
|-----|--------|---------|
| Platform media limit | BLOCKED | Screenshot tool unusable |
| Razorpay checkout | BLOCKED | Awaiting API keys |
| ElevenLabs quota | FALLBACK | Using OpenAI TTS |

---

## Session 3 Summary (Feb 21, 2026)

### Critical Fixes Applied:

| Issue | Status | Details |
|-------|--------|---------|
| ObjectId Serialization | ✅ Fixed | `/api/pets/my-pets` and `/api/pets/{id}` now sanitize MongoDB ObjectIds |
| Soul Learning | ✅ Fixed | Conversations now write to `learned_facts` array |
| Join Form Stuck | ✅ Fixed | Validation logic + toast notifications + error indicators |
| Mira FAB iOS Scroll | ✅ Fixed | Safe area support + webkit scroll fix |
| Products Always Showing | ✅ Fixed | Products only appear when user explicitly asks |
| Voice (British English) | ✅ Fixed | Changed to Charlotte voice (XB0fDUnXU5powFXDhCwa) |

### New Features:

| Feature | Location | Status |
|---------|----------|--------|
| DineNewPage (Experimental) | `/dine-new` | ✅ Created |
| Catalogue vs Concierge Architecture | DineNewPage | ✅ Implemented |
| Post-Deploy Seeding API | `/api/admin/seed-mystique` | ✅ Ready |

---

## Architecture: Catalogue vs Concierge

### The Principle:
Every pillar page has TWO sections:
1. **Catalogue (Self-Serve)** - User browses, adds to cart, buys
2. **Concierge Arranges (Ticket-Based)** - Creates ticket for coordination

### One Spine Rule:
Every action that's NOT pure self-serve becomes a ticket, tagged with the pillar.

```
USER ACTION
     │
     ├── Self-Serve? → DO IT NOW (no ticket)
     │
     └── Needs Coordination? → CREATE TICKET
                                 ├── pillar: "dine"
                                 ├── type: "meal_plan_request"
                                 └── status: "open"
```

### Applied to Pillars:

| Pillar | Self-Serve Examples | Concierge Examples |
|--------|--------------------|--------------------|
| DINE | Browse treats, Buy kibble | Meal plan, Nutrition consult |
| CARE | View grooming products | Book grooming appointment |
| CELEBRATE | Buy party supplies | Plan birthday party |
| STAY | View boarding options | Book boarding |
| TRAVEL | Buy travel accessories | Arrange pet transport |

---

## Mira Components

### 1. MiraAI (`MiraAI.jsx`)
- **Location**: Global (non-pillar pages)
- **Purpose**: Floating orb, general chat
- **Conversation Flow**: Session persistence, pet context, personalized welcome

### 2. MiraChatWidget (`MiraChatWidget.jsx`)
- **Location**: Pillar pages (via PillarPageLayout)
- **Purpose**: Embedded pillar-specific chat
- **Conversation Flow**: 
  - ✅ Products ONLY when explicitly requested
  - ✅ Creates tickets for concierge services
  - ✅ Pillar-aware quick actions

### 3. MiraFloatingButton (`MiraFloatingButton.jsx`)
- **Status**: Imported but not actively used
- **Purpose**: Legacy floating button

---

## Conversation Flow Fix

### Before:
"Mystique loves treats" → 6 products shown ❌

### After:
"Mystique loves treats" → 0 products, natural conversation ✅
"Show me treat products" → 6 products ✅

### Keywords That Trigger Products:
```
EXPLICIT requests only:
- "show me products", "recommend products"
- "buy", "purchase", "order"
- "shopping", "shop for"
- "what can I get", "what should I buy"
- "kit", "bundle", "hamper"
```

---

## Database Schema Updates

### Pet Document - New Fields:
```javascript
{
  "learned_facts": [
    {
      "id": "fact-xxx",
      "category": "preferences|loves|health",
      "content": "Loves chicken jerky",
      "source": "mira_conversation",
      "confidence": 85,
      "created_at": "2026-02-21T..."
    }
  ],
  "doggy_soul_answers": {
    "coat_type": "long",
    "grooming_preference": "salon",
    // ... 50+ fields
  },
  "doggy_soul_meta": {
    "coat_type": { "source": "mira_conversation", "confidence": 90 }
  }
}
```

---

## API Endpoints - Key Updates

### Soul Learning:
```
POST /api/mira/os/understand-with-products
- Now extracts soul data from EVERY message
- Writes to doggy_soul_answers + learned_facts
- Returns: { soul_updated: true, soul_update_categories: [...] }
```

### Post-Deploy Seeding:
```
GET /api/admin/seed-mystique
- Seeds: 5 learned facts, 3 vaccines, 2 meds, 5 timeline events
- Browser-accessible (no auth required)
```

### Service Desk Tickets:
```
POST /api/service-desk/tickets
Body: {
  pillar: "dine",
  type: "meal_plan_request",
  title: "Custom Meal Plan",
  pet_id: "pet-xxx"
}
```

---

## Voice Configuration

### Current Voice: Charlotte (British English)
```python
# tts_routes.py
MIRA_VOICE_ID = "XB0fDUnXU5powFXDhCwa"  # Charlotte - British female
```

### Voice Personalities:
- default: Warm, caring
- celebration: Excited, joyful
- health: Calm, reassuring
- comfort: Soft, empathetic
- urgent: Clear, attention-grabbing

---

## Testing Credentials

| Type | Email/Username | Password |
|------|----------------|----------|
| Member | dipali@clubconcierge.in | test123 |
| Admin | aditya | lola4304 |

---

## Files Modified This Session

### Backend:
- `server.py` - ObjectId sanitization, seed-mystique endpoint
- `mira_routes.py` - Product intent detection, soul learning
- `soul_first_logic.py` - learned_facts population
- `tts_routes.py` - British voice (Charlotte)

### Frontend:
- `MembershipOnboarding.jsx` - Form validation + toast
- `MiraChatWidget.jsx` - iOS scroll fix, safe area
- `MemberDashboard.jsx` - Grid responsive fix
- `index.css` - Mobile font scaling
- `DineNewPage.jsx` - NEW experimental page

---

## Experimental: DineNewPage

### Location: `/dine-new`
### Architecture:
```
┌─────────────────────────────────────────────┐
│  DINE HERO - "What's Mystique craving?"     │
├─────────────────────────────────────────────┤
│  QUICK ACTIONS                              │
│  [Meal Plan*] [Fresh Food] [Treats] [Ask*]  │
│  (* = creates ticket)                       │
├─────────────────────────────────────────────┤
│  📦 SHOP NOW (Self-Serve)                   │
│  - Fresh Picks for Mystique                 │
│  - Training Treats                          │
│  - Smart Tools (calculators, checkers)      │
├─────────────────────────────────────────────┤
│  ✨ CONCIERGE ARRANGES (Creates Tickets)    │
│  - Custom Meal Plan                         │
│  - Nutrition Consultation                   │
│  - Allergy & Special Diet                   │
│  - Fresh Food Subscription                  │
├─────────────────────────────────────────────┤
│  📦 PANTRY TRACKER                          │
│  🍽️ DINING OUT                             │
└─────────────────────────────────────────────┘
```

---

## Post-Deployment Checklist

### After deploying to production:

1. **Seed Mystique's data:**
   ```
   https://thedoggycompany.com/api/admin/seed-mystique
   ```

2. **Verify Soul Learning:**
   - Go to `/mira-demo`
   - Chat: "Mystique loves salmon treats"
   - Check MOJO tab → "What Mira Learned"

3. **Test Conversation Flow:**
   - Chat: "Hi Mira" → Should NOT show products
   - Chat: "Show me treat products" → Should show products

4. **Test Join Form:**
   - Go to `/join`
   - Fill page 2
   - Should show errors if fields missing
   - Button should work when all filled

---

## Known Issues

| Issue | Status | Notes |
|-------|--------|-------|
| Screenshot tool | BLOCKED | Platform media limit |
| Razorpay | BLOCKED | Awaiting API keys |
| WhatsApp | BLOCKED | Awaiting API keys |
| ElevenLabs | FALLBACK | Using OpenAI TTS (quota exceeded) |
| Production MongoDB | BLOCKED | IP whitelist (works in prod) |

---

## Upcoming Work

### Priority 1: Pillar Page Redesign
- Validate `/dine-new` experimental page
- If approved, apply pattern to all pillars
- Implement Catalogue vs Concierge consistently

### Priority 2: Mobile Polish
- Care page mobile layout
- Stay page product alignment
- Font size consistency

### Priority 3: Feature Activation
- WhatsApp (needs keys)
- Razorpay checkout (needs keys)
- Automated vaccination reminders

---

## Document History

| Date | Session | Changes |
|------|---------|---------|
| 2026-02-21 | 1 | Initial SSOT creation |
| 2026-02-21 | 2 | Hidden features verified, ObjectId fixes |
| 2026-02-21 | 3 | Soul learning, conversation flow, iOS fixes, DineNewPage |

---

**This is the Single Source of Truth. Update after every significant change.**

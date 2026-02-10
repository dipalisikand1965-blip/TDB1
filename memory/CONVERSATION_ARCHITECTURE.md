# MIRA OS - CONVERSATION ARCHITECTURE
## "Like talking to a thoughtful friend who helps and then hands off"

---

# 🎯 THE CORE PRINCIPLE

```
USER ←→ MIRA (Brain) ←→ CONCIERGE® (Hands)
         ↓
    Silent Processing
         ↓
    Suggest & Confirm
         ↓
    Action & Summary
         ↓
    Handoff (if needed)
```

---

# 📊 CONVERSATION STATES

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CONVERSATION STATE MACHINE                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   [IDLE] ──── User speaks ────► [LISTENING]                         │
│                                      │                               │
│                              Silent processing                       │
│                                      ▼                               │
│                              [UNDERSTANDING]                         │
│                                      │                               │
│                    ┌─────────────────┼─────────────────┐            │
│                    ▼                 ▼                 ▼            │
│              [CLARIFYING]    [ADVISING]        [ACTIONING]          │
│                    │                 │                 │            │
│              Need more info    Has advice       Has task            │
│                    │                 │                 │            │
│                    ▼                 ▼                 ▼            │
│              Ask question     Present info     Execute/Show         │
│                    │                 │                 │            │
│                    └─────────────────┼─────────────────┘            │
│                                      ▼                               │
│                              [CONFIRMING]                            │
│                         "Is this what you want?"                     │
│                                      │                               │
│                    ┌─────────────────┼─────────────────┐            │
│                    ▼                 ▼                 ▼            │
│                 [REFINE]      [CONCLUDE]         [ABANDON]          │
│               "Adjust..."   "Yes, proceed"    "Never mind"          │
│                    │                 │                 │            │
│                    │                 ▼                 │            │
│                    │          [SUMMARIZING]           │            │
│                    │        "Here's what we did"      │            │
│                    │                 │                 │            │
│                    │                 ▼                 │            │
│                    │          [HANDOFF?]              │            │
│                    │     Needs Concierge help?        │            │
│                    │          │         │             │            │
│                    │        YES         NO            │            │
│                    │          │         │             │            │
│                    │          ▼         │             │            │
│                    │    [HANDING OFF]   │             │            │
│                    │    Create ticket   │             │            │
│                    │    Show summary    │             │            │
│                    │          │         │             │            │
│                    └──────────┴─────────┴─────────────┘            │
│                                      │                               │
│                                      ▼                               │
│                              [COMPLETE]                              │
│                         Archive to past chats                        │
│                                      │                               │
│                                      ▼                               │
│                                [IDLE]                                │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

# 🛤️ CONVERSATION PATHS

## PATH A: Information Only (No Handoff)
```
User: "What food is good for Shih Tzus?"
      ↓
Mira: [UNDERSTANDING] → Dine pillar, info request
      ↓
Mira: [ADVISING] "Shih Tzus do well with small kibble, 
      avoid chicken if sensitive skin..."
      ↓
Mira: [CONFIRMING] "Would you like me to suggest some 
      specific food brands, or is this helpful enough?"
      ↓
User: "This is helpful, thanks!"
      ↓
Mira: [SUMMARIZING] "Great! Remember: small kibble, 
      avoid common allergens. I've saved this to 
      Mystique's food preferences."
      ↓
[COMPLETE] → Archive
```

## PATH B: Products/Picks (Optional Handoff)
```
User: "I need a birthday cake for Mojo"
      ↓
Mira: [UNDERSTANDING] → Celebrate pillar, product request
      ↓
Mira: [CLARIFYING] "How exciting! 🎂 Is this for a party 
      with other dogs, or a family celebration?"
      ↓
User: "Just family"
      ↓
Mira: [ACTIONING] Silent curation in background...
      🎁 Yellow gift icon appears (3 cakes found)
      ↓
Mira: [ADVISING] "I've found some lovely options! 
      Tap the gift icon when you're ready to see them."
      ↓
User: *taps gift icon*
      ↓
Mira: [SHOWING PICKS] Display 3-4 cakes in vault
      ↓
User: *selects "Mynx Shih Tzu Cake"*
      ↓
Mira: [CONFIRMING] "Great choice! The Mynx cake is 
      perfect for small breeds. Would you like me to:
      
      [📤 Send to Concierge® to order]
      [📝 Save for later]
      [🔍 See more options]"
      ↓
User: "Send to Concierge"
      ↓
Mira: [SUMMARIZING] "Done! Here's what I'm sending:
      
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━
      🎂 Birthday Cake Order for Mojo
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━
      • Cake: Mynx Shih Tzu Cake
      • Pet: Mojo (Indie)
      • Occasion: Birthday - Family celebration
      • Notes: Small breed friendly
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━
      
      Your Pet Concierge® will confirm availability 
      and delivery options shortly."
      ↓
[HANDOFF] → Ticket created, banner shown
      ↓
[COMPLETE] → Archive
```

## PATH C: Service Request (Always Handoff)
```
User: "I need a dog walker for next week"
      ↓
Mira: [UNDERSTANDING] → Care pillar, service request
      ↓
Mira: [CLARIFYING] "Of course! A few quick questions:
      • Which days do you need the walker?
      • Preferred time - morning or evening?
      • Any specific requirements for Mojo?"
      ↓
User: "Monday to Friday, mornings"
      ↓
Mira: [CONFIRMING] "Perfect! So:
      • 5 days: Mon-Fri
      • Morning walks
      • For Mojo (Indie, energetic)
      
      Should I send this to your Concierge® to 
      find the best dog walkers in your area?"
      ↓
User: "Yes please"
      ↓
Mira: [SUMMARIZING] "On it! Here's what I'm sending:
      
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━
      🚶 Dog Walking Request
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━
      • Pet: Mojo (Indie, needs active walks)
      • Schedule: Mon-Fri mornings
      • Duration: Next week
      • Area: [User's location]
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━
      
      Your Concierge® will share 2-3 verified 
      walkers with you within 4 hours."
      ↓
[HANDOFF] → Ticket created, banner shown
      ↓
[COMPLETE] → Archive
```

## PATH D: Dining/Travel (Real Data + Handoff)
```
User: "I want to take Mojo to a pet-friendly cafe"
      ↓
Mira: [UNDERSTANDING] → Dine pillar, location request
      ↓
Mira: [CLARIFYING] "Lovely! Which area works best for you?
      • Near home?
      • Specific neighborhood?
      • Or should I check places near you now?"
      ↓
User: "Indiranagar area"
      ↓
Mira: [ACTIONING] Query /dine/restaurants?city=Bengaluru&area=Indiranagar
      ↓
      IF real places found:
        Mira: [ADVISING] "I found these verified pet-friendly spots:
              🎁 Tap to see your options"
              *shows real restaurant cards from database*
      ↓
      IF no places found:
        Mira: [ADVISING] "I don't have verified places in 
              Indiranagar yet. Want me to ask your Concierge® 
              to find and verify some for you?"
      ↓
User: *selects "Café Terra"*
      ↓
Mira: [CONFIRMING] "Café Terra is great for Indies like Mojo!
      They have outdoor seating and are known for being 
      patient with energetic dogs.
      
      [📞 Book a table via Concierge®]
      [📍 Get directions]
      [💾 Save for later]"
      ↓
User: "Book a table"
      ↓
Mira: [SUMMARIZING] "Perfect! Here's your reservation request:
      
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━
      🍽️ Pet-Friendly Dining Request
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━
      • Restaurant: Café Terra, Indiranagar
      • Pet: Mojo (Indie)
      • Seating: Outdoor preferred
      • Party size: [Ask or default to 2]
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━
      
      Your Concierge® will confirm the booking 
      and send you the details."
      ↓
[HANDOFF] → Ticket created
      ↓
[COMPLETE] → Archive
```

## PATH E: Advice/Tip Cards (No Product, Optional Handoff)
```
User: "Can you create a meal plan for Mystique?"
      ↓
Mira: [UNDERSTANDING] → Dine pillar, advice request
      ↓
Mira: [CLARIFYING] "I'd love to help! A few questions:
      • Any allergies or sensitivities?
      • Prefer home-cooked or commercial food?
      • Any weight goals?"
      ↓
User: "She has chicken allergy, home-cooked preferred"
      ↓
Mira: [ADVISING] Creates TIP CARD:
      
      ┌─────────────────────────────────────┐
      │ 🍽️ MYSTIQUE'S MEAL PLAN             │
      │                                      │
      │ BREAKFAST (7 AM)                    │
      │ • Scrambled egg (1) + rice (¼ cup) │
      │ • Steamed carrots (2 tbsp)          │
      │                                      │
      │ DINNER (6 PM)                       │
      │ • Fish/lamb (50g) + sweet potato    │
      │ • Green beans (2 tbsp)              │
      │                                      │
      │ AVOID: Chicken, wheat, corn         │
      │                                      │
      │ [📤 Send to Concierge®]             │
      │ [✏️ Adjust plan]                    │
      │ [💾 Save to Health Vault]           │
      └─────────────────────────────────────┘
      ↓
User: "This looks good! Send to Concierge"
      ↓
Mira: [SUMMARIZING] "Wonderful! I'm sending this plan 
      to your Concierge®. They can:
      • Create a formal nutrition document
      • Source ingredients for you
      • Set up meal prep reminders
      
      I've also saved this to Mystique's Health Vault."
      ↓
[HANDOFF] → Ticket with tip_card attached
      ↓
[COMPLETE] → Archive
```

---

# 🔄 STATE TRANSITIONS

## Trigger Words/Actions for Each State

| Current State | Trigger | Next State |
|--------------|---------|------------|
| IDLE | User sends message | LISTENING |
| LISTENING | Message received | UNDERSTANDING |
| UNDERSTANDING | Need more info | CLARIFYING |
| UNDERSTANDING | Has enough info | ADVISING or ACTIONING |
| CLARIFYING | User answers | UNDERSTANDING (re-evaluate) |
| ADVISING | User satisfied | CONFIRMING |
| ADVISING | User wants more | CLARIFYING |
| ACTIONING | Products found | Show 🎁 indicator |
| ACTIONING | Service request | Create silent ticket |
| CONFIRMING | "Yes", "proceed", "send" | SUMMARIZING |
| CONFIRMING | "No", "change", "adjust" | REFINE → CLARIFYING |
| CONFIRMING | "Cancel", "never mind" | ABANDON → IDLE |
| SUMMARIZING | Needs Concierge | HANDOFF |
| SUMMARIZING | Self-contained | COMPLETE |
| HANDOFF | Ticket created | Show banner → COMPLETE |
| COMPLETE | Inactivity 5 min | Archive → IDLE |

---

# 🎁 PICKS BEHAVIOR

## When to Show Picks (Yellow Gift Icon)
```
✅ Show when:
- Products found that match request
- Services available for pillar
- User explicitly asks "show me options"

❌ Don't show when:
- User is still clarifying
- Conversation is just informational
- User said "not now" or "maybe later"
```

## Picks Flow
```
1. Products curated silently
2. 🎁 icon appears (non-intrusive)
3. User taps when THEY want
4. Vault opens with picks
5. User selects (or dismisses)
6. If selected → CONFIRMING state
7. If dismissed → Continue conversation
```

---

# 📤 HANDOFF TRIGGERS

## Always Handoff (Service Requests)
- Dog walking, pet sitting
- Grooming appointments
- Vet appointments
- Boarding/daycare
- Travel bookings
- Restaurant reservations

## Optional Handoff (User Chooses)
- Product orders
- Advice/meal plans
- Information requests
- Celebrating milestones

## Never Handoff (Self-Contained)
- General information
- Breed facts
- Weather checks
- Simple Q&A

---

# 📋 HANDOFF TICKET STRUCTURE

```json
{
  "ticket_id": "CNC-20260210-0001",
  "created_at": "2026-02-10T10:30:00Z",
  
  "pet": {
    "id": "pet_123",
    "name": "Mojo",
    "breed": "Indie",
    "relevant_info": "Energetic, needs long walks"
  },
  
  "member": {
    "name": "Dipali",
    "email": "dipali@clubconcierge.in"
  },
  
  "request": {
    "pillar": "care",
    "type": "dog_walking",
    "summary": "Daily dog walking, Mon-Fri mornings",
    "details": {
      "schedule": "Monday to Friday",
      "time": "Mornings",
      "duration": "Next week"
    }
  },
  
  "conversation_context": {
    "key_points": [
      "User needs dog walker for work days",
      "Mojo is energetic, needs active walks",
      "Morning walks preferred"
    ],
    "user_preferences": ["Active walker", "Morning slot"]
  },
  
  "picks_vault": {
    "products": [],
    "services": [],
    "tip_cards": []
  },
  
  "mira_summary": "User requested daily dog walking for Mojo (Indie) for next week, Monday to Friday mornings. Mojo is energetic and needs active walks.",
  
  "status": "new",
  "priority": "normal"
}
```

---

# 🖥️ UI ELEMENTS BY STATE

| State | UI Elements |
|-------|-------------|
| LISTENING | Typing indicator |
| UNDERSTANDING | "Mira is thinking..." |
| CLARIFYING | Message + Quick replies |
| ADVISING | Message + (🎁 if picks available) |
| ACTIONING | "Mira is curating..." + 🎁 appears |
| CONFIRMING | Message + [Action buttons] |
| SUMMARIZING | Summary card + Handoff preview |
| HANDOFF | ✅ Banner: "Request sent to Concierge®" |
| COMPLETE | Auto-archive after 5 min |

---

# ✅ IMPLEMENTATION CHECKLIST

## Backend Changes
- [ ] Add `conversation_state` to response
- [ ] Add `handoff_summary` generator
- [ ] Add `confirmation_required` flag
- [ ] Add `tip_card` generator for advice

## Frontend Changes
- [ ] State machine implementation
- [ ] Summary card component
- [ ] Handoff preview component
- [ ] Confirmation buttons (standardized)
- [ ] Tip card display

## States to Track
- [ ] Current conversation state
- [ ] Pending confirmation items
- [ ] Curated picks (not yet shown)
- [ ] Handoff decision (yes/no/pending)

---

*This architecture ensures every conversation has a clear path to completion,
with the user always in control of when to proceed or hand off to Concierge®.*

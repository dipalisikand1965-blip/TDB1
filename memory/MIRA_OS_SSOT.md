# MIRA OS - Single Source of Truth (SSOT)
## The Doggy Company Pet Operating System
**Last Updated:** February 21, 2026 (Session 3)  
**Live Site:** https://thedoggycompany.com  
**Preview:** https://pet-concierge-v2.preview.emergentagent.com

---

## Quick Links
| Document | Purpose |
|----------|---------|
| [MASTER_INDEX.md](./MASTER_INDEX.md) | Complete system directory |
| [MIRA_BIBLE.md](./MIRA_BIBLE.md) | AI personality & behavior |
| [ONE_SPINE_SPEC.md](./ONE_SPINE_SPEC.md) | Architecture spec |
| [PRD.md](./PRD.md) | Product requirements |

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

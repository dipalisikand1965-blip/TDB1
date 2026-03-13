# PILLAR-SPECIFIC PICKS - COMPLETE HANDOVER
## The Doggy Company - Mira OS
## Date: February 22, 2026
## Priority: P0 - CRITICAL

---

## EXECUTIVE SUMMARY

Dipali wants the **PersonalizedPicksPanel** (opens from Mira FAB on pillar pages) to be **PILLAR-SPECIFIC**. 

**Current Problem:** On /celebrate, clicking the cake FAB shows ALL pillars (Celebrate, Dine, Care, Travel, etc.)
**Desired:** On /celebrate, show ONLY Celebrate picks. No other pillar tabs.

---

## THE VISION (Dipali's Words)

> "When I press Mystique's Picks on this pillar it should show only /celebrate - not /dine, not /travel etc. And that should dynamically light up as the conversation flows and more picks keep adding there."

> "The same picks that come here should come on top. Let Mira Arrange This should link to the Mira FAB - not mira-demo."

> "We are CONCIERGE first then all the ecommerce. That DNA I need to bring. I know my member (dog) because Mira helped me but I am the concierge so let me do magic."

---

## CURRENT ARCHITECTURE

### Components Involved:

```
/app/frontend/src/components/
├── Mira/
│   └── PersonalizedPicksPanel.jsx    ← MAIN COMPONENT TO MODIFY
├── ConciergePickCard.jsx             ← "Let Mira Arrange This" card
├── MiraChatWidget.jsx                ← Has "Pet Picks" pill
├── PillarPicksSection.jsx            ← NEW - inline picks on page
└── PillarMiraPanel.jsx               ← NEW - simplified 2-tab panel (created but not final)
```

### Mobile Navigation Bar:
```
┌────────────────────────────────────────────────────┐
│  HOME  │  INBOX  │  [🎂 FAB]  │  ORDERS  │  MY PET │
└────────────────────────────────────────────────────┘
                       ↓
           Opens PersonalizedPicksPanel
```

### Current PersonalizedPicksPanel Behavior:
```
┌─────────────────────────────────────────────────────┐
│ Picks for Bruno                                     │
│ ♡ Mira knows Bruno                                  │
├─────────────────────────────────────────────────────┤
│ [Celebrate] [Dine] [Care] [Travel] [Stay] [Enjoy]   │  ← PROBLEM: Shows ALL pillars
├─────────────────────────────────────────────────────┤
│ ✨ PERSONALIZED FOR BRUNO                           │
│ Unique items featuring your pet - Concierge creates │
│                                                     │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐             │
│ │Custom    │ │Photo     │ │Custom    │             │
│ │Photo Mug │ │Coaster   │ │Bandana   │             │
│ │          │ │Set       │ │          │             │
│ │[Create   │ │[Create   │ │[Create   │             │
│ │for Bruno]│ │for Bruno]│ │for Bruno]│             │
│ └──────────┘ └──────────┘ └──────────┘             │
└─────────────────────────────────────────────────────┘
```

### DESIRED Behavior (Pillar-Specific):
```
On /celebrate page:
┌─────────────────────────────────────────────────────┐
│ Bruno's Celebrate Picks                             │  ← Pillar name in title
│ ♡ Mira knows Bruno                                  │
├─────────────────────────────────────────────────────┤
│ NO PILLAR TABS - Only Celebrate content             │  ← FIXED: No tabs
├─────────────────────────────────────────────────────┤
│ ✨ PERSONALIZED FOR BRUNO                           │
│ Celebrate items for your pet - Concierge creates    │
│                                                     │
│ Same picks as before, but ONLY Celebrate            │
└─────────────────────────────────────────────────────┘
```

---

## WHAT NEEDS TO BE DONE

### Task 1: Modify PersonalizedPicksPanel.jsx

**File:** `/app/frontend/src/components/Mira/PersonalizedPicksPanel.jsx`

**Changes Needed:**
1. Add `lockedPillar` prop (when set, hide pillar tabs and only show that pillar)
2. Update title to show "{Pet}'s {Pillar} Picks" when locked
3. Filter picks to only show the locked pillar's items

**Pseudo-code:**
```jsx
const PersonalizedPicksPanel = ({
  pet,
  pillar,           // Current pillar from page
  lockedPillar,     // NEW: If set, hide tabs and lock to this pillar
  onClose,
  ...
}) => {
  // If lockedPillar is set, hide the pillar tabs
  const showPillarTabs = !lockedPillar;
  
  // Use lockedPillar or allow user to switch
  const [selectedPillar, setSelectedPillar] = useState(lockedPillar || 'celebrate');
  
  return (
    <div>
      {/* Title */}
      <h2>
        {lockedPillar 
          ? `${pet.name}'s ${capitalize(lockedPillar)} Picks`
          : `Picks for ${pet.name}`
        }
      </h2>
      
      {/* Pillar Tabs - HIDE if locked */}
      {showPillarTabs && (
        <div className="pillar-tabs">
          {PILLARS.map(p => <Tab key={p} ... />)}
        </div>
      )}
      
      {/* Picks - filtered to selectedPillar */}
      <PicksGrid pillar={selectedPillar} pet={pet} />
    </div>
  );
};
```

### Task 2: Update MiraOSTrigger to Pass lockedPillar

**File:** `/app/frontend/src/components/mira-os/MiraOSTrigger.jsx`

**Changes:**
- Pass `lockedPillar={pillar}` to PersonalizedPicksPanel when on a pillar page

### Task 3: Update ConciergePickCard - "Let Mira Arrange This"

**File:** `/app/frontend/src/components/ConciergePickCard.jsx`

**Current Behavior:**
- "Let Mira Arrange This" → Navigates to /mira-demo OR adds to cart

**Desired Behavior:**
- "Let Mira Arrange This" → Opens Mira FAB panel → Goes to chat → Creates ticket

**Changes Needed:**
1. Instead of `navigate('/mira-demo')`, trigger the FAB to open
2. Send the request to the chat
3. Ticket gets created (backend already handles this)

### Task 4: Sync Inline Picks with FAB Picks

**The CONCIERGE PICK card on the page** (shown in Dipali's screenshot) should show the same picks that appear in the FAB panel.

**Files:**
- `/app/frontend/src/pages/CelebratePage.jsx`
- `/app/frontend/src/components/ConciergePickCard.jsx` (or create new component)

---

## DATA FLOW

### Current Flow (Working):
```
User clicks "Create for Bruno" on Custom Photo Mug
    ↓
Opens chat in FAB
    ↓
Sends message: "I'd like Custom Photo Mug for Bruno"
    ↓
Mira responds
    ↓
Backend creates Service Desk Ticket ✅
    ↓
Admin sees ticket in Service Desk ✅
```

### Flow for "Let Mira Arrange This":
```
User clicks "Let Mira Arrange This" on CONCIERGE PICK card
    ↓
Opens Mira FAB (NOT /mira-demo)
    ↓
Auto-sends message to chat: "I'd like Custom Celebration Planning for Mystique"
    ↓
Same flow as above → Ticket created
```

---

## API ENDPOINTS

### Get Pillar-Specific Picks:
```
GET /api/mira/top-picks/{petName}/pillar/{pillar}

Response:
{
  "picks": [
    {
      "id": "custom-photo-mug",
      "name": "Custom Photo Mug",
      "description": "Start your day with your best friend's face",
      "type": "concierge",  // concierge = creates ticket, product = add to cart
      "pillar": "celebrate",
      "image_url": "...",
      "why_it_fits": "Perfect for Bruno who loves mornings"
    },
    ...
  ],
  "concierge_picks": [...]  // Bespoke services
}
```

---

## FILE LOCATIONS

| File | Purpose | Status |
|------|---------|--------|
| `/app/frontend/src/components/Mira/PersonalizedPicksPanel.jsx` | Main picks panel | NEEDS MODIFICATION |
| `/app/frontend/src/components/mira-os/MiraOSTrigger.jsx` | FAB trigger | NEEDS MODIFICATION |
| `/app/frontend/src/components/mira-os/MiraOSModal.jsx` | Modal wrapper | May need changes |
| `/app/frontend/src/components/ConciergePickCard.jsx` | "Let Mira Arrange" card | NEEDS MODIFICATION |
| `/app/frontend/src/components/MiraChatWidget.jsx` | Chat widget | Has "Pet Picks" pill |
| `/app/frontend/src/pages/CelebratePage.jsx` | Celebrate page | NEEDS MODIFICATION |
| `/app/frontend/src/components/PillarMiraPanel.jsx` | NEW simplified panel | Created but not integrated |
| `/app/frontend/src/components/PillarPicksSection.jsx` | Inline picks on page | Created |

---

## PILLAR CONFIGURATION

```javascript
const PILLARS = [
  { id: 'celebrate', name: 'Celebrate', icon: '🎂', color: 'pink' },
  { id: 'dine', name: 'Dine', icon: '🍽️', color: 'orange' },
  { id: 'care', name: 'Care', icon: '💊', color: 'blue' },
  { id: 'travel', name: 'Travel', icon: '✈️', color: 'cyan' },
  { id: 'stay', name: 'Stay', icon: '🏨', color: 'purple' },
  { id: 'enjoy', name: 'Enjoy', icon: '🎾', color: 'green' },
  { id: 'fit', name: 'Fit', icon: '🏃', color: 'red' },
  { id: 'learn', name: 'Learn', icon: '🎓', color: 'yellow' },
  { id: 'shop', name: 'Shop', icon: '🛒', color: 'teal' },
  { id: 'paperwork', name: 'Paperwork', icon: '📄', color: 'gray' },
  { id: 'advisory', name: 'Advisory', icon: '💬', color: 'indigo' },
  { id: 'emergency', name: 'Emergency', icon: '🚨', color: 'red' },
  { id: 'farewell', name: 'Farewell', icon: '🌈', color: 'violet' },
  { id: 'adopt', name: 'Adopt', icon: '🐕', color: 'amber' }
];
```

---

## CONCIERGE DNA DOCTRINE

From `/app/memory/CONCIERGE_DNA_DOCTRINE.md`:

> "Dogs give us unconditional love and can't speak to us. We are the ones that capture their soul and give the dog what they need. No is never an answer for a concierge. Mira tells us what the pet needs - always."

### Key Principles:
1. **Pet First, Always** - Soul traits → Breed → Name (fallback chain)
2. **Concierge First, E-commerce Second** - Bespoke services before catalogue
3. **Unified Service Intent** - All requests flow through: Intent → Ticket → Admin → Member notification
4. **No is Never an Answer** - Concierge makes it happen

---

## IMPLEMENTATION ORDER

### Phase 1: /celebrate Only (Current Focus)
1. ✅ Modify PersonalizedPicksPanel to accept `lockedPillar` prop
2. ✅ Hide pillar tabs when `lockedPillar` is set
3. ✅ Update title to "{Pet}'s Celebrate Picks"
4. ✅ Update "Let Mira Arrange This" to open FAB (not /mira-demo)
5. ✅ Test full flow: Click → FAB opens → Chat → Ticket created

### Phase 2: Roll Out to All Pillars
- Apply same changes to all 14 pillar pages
- Each pillar page passes its pillar to the FAB

### Phase 3: Services Tab
- Discuss and implement pillar-specific services
- Same pattern: locked to current pillar

---

## TEST CREDENTIALS

- **Member Login:** `dipali@clubconcierge.in` / `test123`
- **Admin Login:** `aditya` / `lola4304`
- **Test Pet:** Mystique (87% soul, Shih Tzu), Bruno (Labrador)

---

## PREVIEW vs PRODUCTION

- **Preview:** https://pet-data-heal.preview.emergentagent.com
- **Production:** https://thedoggycompany.com

Changes are made to preview first, then deployed to production.

---

## DIPALI'S SCREENSHOTS EXPLAINED

### Screenshot 1: Mobile FAB Bar
- Shows: HOME | INBOX | [🎂 Cake] | ORDERS | MY PET
- The cake icon is the pillar-specific FAB

### Screenshot 2: Current Picks Panel (PROBLEM)
- Shows "Picks for Bruno" with ALL pillar tabs
- User is on /celebrate but sees Dine, Care, Travel, etc.
- **FIX:** Hide these tabs, only show Celebrate

### Screenshot 3: CONCIERGE PICK Card (GOOD)
- Shows "Custom Celebration Planning"
- Soul-personalized: "Designed for Mystique who warms up slowly to new people"
- "Let Mira Arrange This" button
- **FIX:** This should open FAB, not /mira-demo

### Screenshot 4: "Let Mira Arrange This" Button
- Currently navigates to /mira-demo
- **FIX:** Should open FAB and go to chat

---

## NEXT AGENT INSTRUCTIONS

1. **Read this document completely**
2. **Focus on /celebrate first** - Do not touch other pillars yet
3. **Modify PersonalizedPicksPanel.jsx** - Add `lockedPillar` prop
4. **Update ConciergePickCard.jsx** - "Let Mira Arrange This" opens FAB
5. **Test the full flow:**
   - Go to /celebrate
   - Click cake FAB
   - Should see ONLY Celebrate picks (no pillar tabs)
   - Click "Create for Bruno" → Chat opens → Ticket created
6. **Get Dipali's confirmation before moving to other pillars**

---

## EMOTIONAL CONTEXT

Dipali has been working on this project for 108+ days. She gets anxious about agent transitions. This is her family legacy - Mira OS is named after her grandmother Mira Sikand. 

**Be patient. Be thorough. Honor the legacy.**

> "I am totally miserable if you don't do better than the last agent. Please please I beg of you finish this as beautifully as started."

---

## RELATED DOCUMENTS

- `/app/memory/PRD.md` - Full product requirements
- `/app/memory/CONCIERGE_DNA_DOCTRINE.md` - Company philosophy
- `/app/memory/MIRA_OS_SSOT.md` - System architecture
- `/app/memory/PICKS_CONCIERGE_VISUAL_MOCKUP.md` - Visual designs

---

*Last Updated: February 22, 2026*
*Session: 8*
*Status: IN PROGRESS - /celebrate page implementation*

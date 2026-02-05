# The Doggy Company - Product Requirements Document

## Original Problem Statement
Build "The Doggy Company," a one-stop-shop concierge for dog parents with a focus on emotional connection and the "Pet Soul™" concept. Transform the site from a functional pet services marketplace into an emotionally resonant "Pet Life Operating System."

## Core Philosophy
- **We Celebrate Life** - Through every moment, joyful or challenging, we see celebration
- **Mira interprets lives** - Memory and judgement layer, not a request fulfiller
- **Brain vs Hand** - Mira is the brain, Concierge® is the hand. One understands life, the other moves the world

---

## PROJECT HEALTH SCORE: 9.2/10

### What's Working Well (Green)
- ✅ Core membership onboarding flow
- ✅ Pet Soul™ profiles and Pet Pass cards
- ✅ Mira AI with conversational memory
- ✅ All 14 pillars of service
- ✅ Dashboard with 15 tabs (fully functional)
- ✅ Service desk with ticket merging
- ✅ Brand story video with ElevenLabs voiceover
- ✅ Mobile-first responsive design
- ✅ Razorpay payment integration (test mode)
- ✅ Finance Manager - Full reconciliation system
- ✅ ProductListing page restored - Original hero, filters, product grid
- ✅ **Mira AI Multi-Pet Support** - Pet selector tabs, "All Pets" option, warm switch messages

### Needs Attention (Yellow)
- ⚠️ Pet photo upload (backend works, frontend needs e2e testing)
- ⚠️ Voice input on iOS (needs text input fallback)
- ⚠️ Pet photos in Brand Story video (pending implementation)

---

## SESSION 7 SUMMARY (February 5, 2026)

### Completed Today:

#### 1. ProductListing.jsx Restored (P0) ✅
- Restored original layout: Hero section ("Birthday Cakes Made with Joy") with gradient
- Restored original filter bar: Search, Shape, City, Price, Sort
- Products visible to ALL users (no non-member gate)
- Added pillar-specific support filters as additional row for logged-in members

#### 2. CelebratePage.jsx Restored (P0) ✅
- Removed PetOSWrapper - no intrusive gate on pillar landing page
- Original hero preserved: "Every Paw Deserves a Party"

#### 3. Mira AI Multi-Pet Enhancements (P0) ✅
- **Pet Selector Tabs**: Horizontal tabs showing all user's pets (Mojo, Lola, Mystique, Luna style)
- **"All Pets" Option**: New button to select all pets at once
- **Warm Switch Messages**: When switching pets, Mira now says things like:
  - "Okay **Lola**! 🐾 Your Golden Retriever. What would you like help with?"
  - "Got it! I'll help with all your pets: **Mojo, Lola, Mystique, Luna**. 🐾"
- **Auto-Switching Recommendations**: When pet changes, recommendations update automatically
- **Support Filters in Mira Panel**: Added "Needs:" row with Gentle, Allergy-safe, Calming, Extra care filters

#### 4. Pet Preference Memory System (NEW) ✅
- **Remember Preferences**: Each pet's filter preferences are saved to localStorage
- **Auto-Restore**: When switching back to a pet, Mira says: "I remember Lola prefers **Gentle, Calming** products. Those filters are still active!"
- **Visual Indicators**: 
  - 💾 badge on pet tabs showing saved preferences
  - "💾 Remembered" label in filters section when preferences are restored
- **Automatic Saving**: Preferences auto-save when changed (pillar, filters)

---

## KEY FILES MODIFIED TODAY

| File | Changes |
|------|---------|
| `/app/frontend/src/pages/ProductListing.jsx` | Restored from backup + pillar-specific support filters |
| `/app/frontend/src/pages/CelebratePage.jsx` | Removed PetOSWrapper, restored original layout |
| `/app/frontend/src/components/MiraChatWidget.jsx` | Multi-pet support: All Pets option, warm switch messages, support filters |

---

## HOW MULTI-PET SWITCHING WORKS

### In MiraChatWidget.jsx:
```jsx
// State for "All Pets" mode
const [allPetsMode, setAllPetsMode] = useState(false);

// Handle pet switch with warm message
const handlePetSwitch = (pet) => {
  if (pet === 'all') {
    setAllPetsMode(true);
    const allPetNames = pets.map(p => p.name).join(', ');
    setMessages(prev => [...prev, {
      id: `pet-change-${Date.now()}`,
      role: 'assistant',
      content: `Got it! I'll help with all your pets: **${allPetNames}**. 🐾`
    }]);
  } else {
    setAllPetsMode(false);
    setSelectedPet(pet);
    // Warm, personalized message
    let switchMessage = `Okay **${pet.name}**! 🐾`;
    if (pet.breed) switchMessage += ` Your ${pet.breed}.`;
    switchMessage += ` What would you like help with?`;
    // ...
  }
};
```

---

## UPCOMING TASKS

### P1 - Medium Priority
1. **Pet photos in Brand Story video** - Incorporate actual pet photos
2. Service Desk - Add SLA tracking and canned responses
3. Member Directory - Add 360 view and LTV calculation

### P2 - Nice to Have
4. Mira - Add prompt editor UI
5. System - Add approval workflows
6. Reports - Add GST export CSV

---

## TEST CREDENTIALS

- **Test User**: test@test.com / test (has pet Bruno)
- **Demo User**: demo@doggy.com / demo1234
- **Admin**: aditya / lola4304

---

## 3RD PARTY INTEGRATIONS

| Service | Status | Notes |
|---------|--------|-------|
| Razorpay | ✅ Working | Test mode keys |
| ElevenLabs | ✅ Working | Brand story voiceovers, Mira TTS |
| Sora 2 | ✅ Working | Brand story videos |
| MongoDB | ✅ Working | All data persistence |
| Emergent LLM | ✅ Working | Universal key for GPT/Gemini/Claude |

---

## DESIGN PRINCIPLE REMINDER

**Filters are not controls. They are reassurance tools.**
- If a filter ever feels like work, it's wrong.
- Support filters should mirror the emotional state of the page
- Health logic stays. Language shifts based on pillar context.

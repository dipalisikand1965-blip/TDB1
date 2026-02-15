# MIRA OS vs MIRA FAB - Full Feature Audit
## February 2026

---

## CRITICAL ISSUE: Pet Context Not Passed to Chat

**Problem:** When Bruno is selected in Mira OS, Mira asks "who are we celebrating?" - she doesn't know Bruno is selected!

**Root Cause:** The `selected_pet_id` is being sent to the API, but the pet's FULL CONTEXT (name, breed, allergies, birthday, preferences) is NOT being included in the chat request.

**Mira FAB does this correctly** - it passes full pet context including:
- Pet name, breed, age
- Birthday date
- Allergies & sensitivities
- Food preferences
- Behavioral traits

---

## FEATURE COMPARISON TABLE

| Feature | Mira FAB (Existing) | Mira OS (New) | Status |
|---------|---------------------|---------------|--------|
| **PET CONTEXT** |
| Knows selected pet | ✅ Yes | ❌ NO - Asks "who?" | **BROKEN** |
| Pet birthday | ✅ "31 January 2024" | ❌ Not passed | **MISSING** |
| Pet allergies | ✅ "dairy-sensitive" | ❌ Not passed | **MISSING** |
| Pet preferences | ✅ "loves chicken" | ❌ Not passed | **MISSING** |
| Pet personality | ✅ "anxious with loud sounds" | ❌ Not passed | **MISSING** |
| **VOICE** |
| ElevenLabs TTS | ✅ Working | ❌ Not implemented | **MISSING** |
| Voice toggle | ✅ Working | ⚠️ Button exists, no function | **BROKEN** |
| **PICKS/RECOMMENDATIONS** |
| Curated product cards | ✅ Shows actual products | ❌ "Preparing picks..." | **MISSING** |
| Concierge Cards | ✅ Working | ❌ Not implemented | **MISSING** |
| Quick tiles | ✅ Dynamic based on pet | ❌ Static/hardcoded | **MISSING** |
| **CHAT** |
| Markdown rendering | ✅ Bold renders properly | ❌ Shows `**text**` raw | **BROKEN** |
| Ticket creation | ✅ Auto-creates tickets | ⚠️ Partial | **INCOMPLETE** |
| Pet-aware responses | ✅ Full context | ❌ Generic responses | **BROKEN** |
| **UI/UX** |
| Full-page mobile | ⚠️ 85vh | ✅ 100dvh | **IMPROVED** |
| Pet switcher | ✅ Working | ✅ Working | **OK** |
| Swipe to dismiss | ❌ Not implemented | ✅ Working | **IMPROVED** |
| Tab navigation | ❌ Single view | ✅ Picks/Chat/Services | **IMPROVED** |
| Concierge icon (🤲) | ❌ Not visible | ✅ In header | **IMPROVED** |
| **FOOTER** |
| Unnecessary footer | N/A | ❌ Shows copyright | **BUG** |

---

## FIXES REQUIRED FOR MIRA OS

### P0 - Critical (Must Fix)

1. **Pass Full Pet Context to Chat API**
   - Include: name, breed, age, birthday, allergies, preferences, personality
   - File: `MiraOSModal.jsx` → `sendMessage()` function

2. **Fix Markdown Rendering**
   - `**bold**` showing as raw text instead of rendered
   - Need to add ReactMarkdown or similar

3. **Implement Voice (ElevenLabs)**
   - Copy voice logic from MiraChatWidget.jsx
   - Connect to `/api/tts/generate` endpoint

### P1 - Important

4. **Load Real Curated Picks**
   - Currently shows "Preparing picks..."
   - Need to call `/api/mira/picks` or `/api/products` with pet filters

5. **Dynamic Quick Actions**
   - Currently hardcoded: "Celebrate | Birthday | Quick Book"
   - Should be pet-specific based on context

6. **Remove Footer**
   - Footer appearing at bottom of modal

### P2 - Nice to Have

7. **Concierge Cards Integration**
   - Parse Mira's recommendations into actionable cards
   - Copy `parseMiraRecommendations` from MiraConciergeCard.jsx

---

## CODE CHANGES NEEDED

### 1. Fix Pet Context in Chat (MiraOSModal.jsx)

```jsx
// CURRENT (broken):
body: JSON.stringify({
  message: text.trim(),
  session_id: `mira-os-${Date.now()}`,
  source: 'mira_os',
  current_pillar: pillar,
  selected_pet_id: selectedPet?.id  // Only ID!
})

// FIXED (with full context):
body: JSON.stringify({
  message: text.trim(),
  session_id: `mira-os-${Date.now()}`,
  source: 'mira_os',
  current_pillar: pillar,
  selected_pet_id: selectedPet?.id,
  pet_context: selectedPet ? {
    name: selectedPet.name,
    breed: selectedPet.breed,
    age: selectedPet.age,
    birthday: selectedPet.birthday,
    allergies: selectedPet.allergies,
    preferences: selectedPet.preferences,
    personality: selectedPet.personality,
    weight: selectedPet.weight
  } : null
})
```

### 2. Add Markdown Rendering

```jsx
import ReactMarkdown from 'react-markdown';

// In chat message render:
<ReactMarkdown>{msg.content}</ReactMarkdown>
```

### 3. Add ElevenLabs Voice

Copy from MiraChatWidget.jsx:
- `speakWithElevenLabs()` function
- `speakText()` function
- Audio playback logic

---

## WHAT MIRA FAB DOES RIGHT

The existing Mira FAB has **trained intelligence**:

1. **Full Pet Soul Integration**
   - Loads complete pet profile on mount
   - Passes to every API call
   - Mira's responses reference specific pet details

2. **Concierge Cards**
   - Parses Mira's text for recommendations
   - Shows actionable cards with "Request via Concierge" button
   - Triggers Unified Service Flow

3. **Voice**
   - ElevenLabs premium voice
   - Fallback to Web Speech API
   - British female voice (Mira persona)

4. **Ticket Auto-Creation**
   - Creates service desk tickets automatically
   - Shows ticket ID in chat: "📋 Request #REQ-20260215-0017 created!"

---

## RECOMMENDATION

**DO NOT replace Mira FAB with Mira OS yet.**

Mira OS needs these fixes first:
1. Pet context in chat ← CRITICAL
2. Markdown rendering ← CRITICAL
3. Voice integration ← IMPORTANT
4. Real picks loading ← IMPORTANT

Once fixed, Mira OS will be superior because:
- Full-page mobile experience
- Tab-based navigation
- Swipe to dismiss
- Visible concierge indicator

---

*Audit completed: February 15, 2026*

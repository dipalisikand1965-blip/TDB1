# MIRA ADVISOR INTEGRATION GUIDE
## CRITICAL: Read this before touching ANY pillar page

**Last Updated:** March 11, 2026
**Author:** Emergent Agent Session 8.5

---

## 🎯 THE PATTERN: "Ask Mira" Advisor on Every Pillar

### What It Does
Every pillar page has an "Ask Mira" input box that:
1. Takes user's question
2. Opens the FULL Mira chat widget (not a separate API call)
3. Pre-fills the question with pillar context
4. Mira then responds with full intelligence (pet context, history, two-way chat)

### Why This Matters
This is THE DOGGY COMPANY's key differentiator:
- **MIRA AI** = Intelligent assistant that knows context
- **Soul** = Pet profile system that personalizes everything
- **Concierge** = Human touch when needed
- **System** = Everything working together

---

## 🔧 IMPLEMENTATION PATTERN

### Step 1: Add State for Query
```jsx
const [advisorQuery, setAdvisorQuery] = useState('');
```

### Step 2: Add Handler Function
```jsx
// Opens Mira with pillar-specific context
const handleAskMira = () => {
  if (!advisorQuery.trim()) return;
  
  window.dispatchEvent(new CustomEvent('openMiraAI', {
    detail: {
      message: advisorQuery,
      initialQuery: advisorQuery,
      context: 'pillar_name_here',  // e.g., 'celebrate', 'dine', 'stay'
      pillar: 'pillar_name_here',
      pet_name: activePet?.name,    // From usePillarContext() or useAuth()
      pet_breed: activePet?.breed
    }
  }));
  
  setAdvisorQuery('');
};
```

### Step 3: Add UI Component
```jsx
<Card className="p-6 border-2 border-{PILLAR_COLOR}-200 bg-white shadow-lg">
  <div className="flex items-center gap-3 mb-4">
    <div className="p-3 bg-{PILLAR_COLOR}-100 rounded-full">
      <MessageCircle className="w-6 h-6 text-{PILLAR_COLOR}-600" />
    </div>
    <div>
      <h3 className="font-bold text-gray-900 text-lg">{ADVISOR_NAME}</h3>
      <p className="text-gray-600 text-sm">{ADVISOR_SUBTITLE}</p>
    </div>
  </div>
  
  <div className="flex gap-2">
    <Input
      placeholder="{PLACEHOLDER_QUESTION}"
      value={advisorQuery}
      onChange={(e) => setAdvisorQuery(e.target.value)}
      onKeyPress={(e) => e.key === 'Enter' && handleAskMira()}
      className="flex-1"
      data-testid="{pillar}-advisor-input"
    />
    <Button 
      onClick={handleAskMira}
      disabled={!advisorQuery.trim()}
      className="bg-{PILLAR_COLOR}-600 hover:bg-{PILLAR_COLOR}-700"
    >
      <Sparkles className="w-4 h-4 mr-1" />
      Ask Mira
    </Button>
  </div>
  
  <p className="text-xs text-gray-500 mt-2 text-center">
    Powered by Mira AI - your personal pet advisor
  </p>
</Card>
```

---

## 📋 PILLAR-SPECIFIC CONFIGURATION

| Pillar | Color | Advisor Name | Placeholder Question |
|--------|-------|--------------|---------------------|
| celebrate | pink | Party Planner | "What cake is best for my dog's birthday?" |
| dine | orange | Nutrition Advisor | "What food is best for my dog's allergies?" |
| stay | blue | Boarding Guide | "How do I prepare my dog for boarding?" |
| travel | sky | Travel Companion | "What do I need to fly with my dog?" |
| care | teal | Wellness Expert | "How often should I groom my dog?" |
| enjoy | purple | Activity Buddy | "Best activities for a senior dog?" |
| fit | green | Fitness Coach | "Exercise plan for my overweight dog?" |
| learn | indigo | Training Mentor | "How to stop my puppy from biting?" |
| emergency | red | Emergency Triage | "My dog ate chocolate, what do I do?" |
| advisory | violet | Life Advisor | "How do I manage multiple dogs?" |
| farewell | rose | Compassion Guide | "How do I know when it's time?" |
| adopt | green | Adoption Advisor | "How to help a rescue dog settle in?" |

---

## ⚠️ CRITICAL: DO NOT DO THESE THINGS

1. **DO NOT** create separate AI API calls - USE Mira via `openMiraAI` event
2. **DO NOT** show AI response inline - Mira chat handles the response
3. **DO NOT** remove the `data-testid` attributes - needed for testing
4. **DO NOT** forget to import `Sparkles` from lucide-react
5. **DO NOT** forget to get `activePet` from context for personalization

---

## ✅ PAGES WITH MIRA ADVISOR (Implemented)

- [x] AdoptPage.jsx - "Adoption Advisor" (March 11, 2026)
- [x] AdvisoryPage.jsx - "Life Advisor" (March 11, 2026)
- [x] EmergencyPage.jsx - "Emergency Triage" (March 11, 2026)
- [ ] FarewellPage.jsx - "Compassion Guide"
- [ ] CelebratePage.jsx - "Party Planner"
- [ ] DinePage.jsx - "Nutrition Advisor"
- [ ] StayPage.jsx - "Boarding Guide"
- [ ] TravelPage.jsx - "Travel Companion"
- [ ] CarePage.jsx - "Wellness Expert"
- [ ] EnjoyPage.jsx - "Activity Buddy"
- [ ] FitPage.jsx - "Fitness Coach"
- [ ] LearnPage.jsx - "Training Mentor"

---

## 🔍 HOW MIRA RECEIVES THE MESSAGE

The `MiraChatWidget.jsx` component listens for the `openMiraAI` event:

```jsx
// In MiraChatWidget.jsx (around line 1220-1250)
useEffect(() => {
  const handleOpenMira = (event) => {
    setIsOpen(true);
    if (event.detail?.message || event.detail?.initialQuery) {
      setInputMessage(event.detail.message || event.detail.initialQuery);
      // Context is used for personalized responses
    }
  };
  
  window.addEventListener('openMiraAI', handleOpenMira);
  return () => window.removeEventListener('openMiraAI', handleOpenMira);
}, []);
```

---

## 📁 FILE LOCATIONS

- **MiraChatWidget**: `/app/frontend/src/components/MiraChatWidget.jsx`
- **Pillar Pages**: `/app/frontend/src/pages/{PillarName}Page.jsx`
- **This Documentation**: `/app/memory/MIRA_ADVISOR_GUIDE.md`

---

## 🧪 TESTING CHECKLIST

For each pillar page with Mira Advisor:
1. [ ] Type a question in the input
2. [ ] Press Enter OR click "Ask Mira"
3. [ ] Verify Mira chat opens on the right
4. [ ] Verify question is pre-filled in Mira's input
5. [ ] Verify Mira responds with context-aware answer
6. [ ] Verify pet name is mentioned if user has a pet profile

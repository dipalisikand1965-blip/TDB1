# MIRA OS GOLDEN STANDARD DOCTRINE
## The World's First Pet Life Operating System

*"Mira doesn't just help you shop. Mira knows your pet's soul."*

---

## CORE PHILOSOPHY

### 1. THE PET IS THE HERO
Every screen, every interaction, every recommendation centers on the pet - not the product, not the service, not the transaction. The pet's photo, soul score, personality traits, and name should be visible wherever personalization matters.

**Implementation:**
- Pet photo with Soul Score arc appears in every pillar hero
- Pet name replaces generic text: "Celebrations for Lola" not "Pet Celebrations"
- Mira's quotes reference the specific pet: "Mira knows Lola"
- Traits derived from Doggy Soul answers display contextually

### 2. MIRA IS SILENT INTELLIGENCE
Mira is NOT a chatbot UI element. Mira is the invisible brain that powers every personalized experience. Users should feel Mira's presence through smart recommendations, contextual content, and anticipatory service - not through explicit "AI Assistant" interfaces.

**What Mira IS:**
- The intelligence behind product sorting (Lola's breed-appropriate cakes first)
- The context engine that knows it's Lola's birthday next month
- The personalization layer that remembers Lola is allergic to chicken
- The taste engine that learns from every interaction

**What Mira is NOT:**
- A visible search bar that says "Ask Mira"
- A chatbot popup on every page
- An assistant that interrupts the flow

**The ONE Exception:** The Floating Action Button (FAB)
- Mira FAB appears subtly in the corner
- It's an opt-in conversation, not a forced interaction
- When opened, Mira has FULL context (current pillar, pet profile, browsing history)

### 3. PILLAR-BASED LIFE ORGANIZATION
A pet's life is organized into 14 pillars - not categories, not departments. Each pillar represents a dimension of the pet-parent journey:

| Pillar | Soul Color | Emotional Essence |
|--------|------------|-------------------|
| Celebrate | Pink-Purple | Pure joy, tail wagging |
| Dine | Amber-Brown | Satisfied belly, comfort |
| Care | Rose-Purple | Gentle touch, being loved |
| Enjoy | Blue-Cyan | Playful energy, happiness |
| Travel | Teal-Blue | Adventure, new smells |
| Stay | Green-Earth | Safe, cozy, home |
| Fit | Green-Lime | Active, alive, running free |
| Learn | Blue-Green | Focused, curious |
| Advisory | Indigo-Purple | Trust, wisdom, guidance |
| Emergency | Red-Calm | Alert but cared for |
| Paperwork | Slate-Neutral | Handled, simple |
| Farewell | Violet-Twilight | Gentle, peaceful |
| Adopt | Orange-Gold | Hope, new beginnings |

**Each pillar page follows the same structure:**
1. UnifiedHero (pet photo, soul score, pillar-specific gradient & messaging)
2. Subcategory navigation (pillar-specific)
3. Personalized picks (Mira's choices for this pet)
4. Content grid (products/services)
5. Mira FAB (pillar-aware conversation)

### 4. SOUL SCORE AS RELATIONSHIP DEPTH
The Soul Score (0-100%) represents how well Mira knows the pet. It's NOT a gamification gimmick - it's a genuine measure of personalization depth.

**Soul Score Powers:**
- 0-25%: Generic recommendations
- 25-50%: Breed-aware suggestions
- 50-75%: Personality-aware curation
- 75-100%: True personalization (allergies, preferences, schedule)

**Soul Score Unlocks:**
- Higher scores = more accurate Mira quotes
- Higher scores = better product matching
- Higher scores = proactive alerts (birthday reminders, health tips)

### 5. CONTEXTUAL CONVERSATION, NOT GLOBAL SEARCH
When a user opens Mira (via FAB), the conversation is PILLAR-AWARE:

**On /celebrate:** 
- "What kind of celebration are you planning for Lola?"
- Mira can access: Lola's birthday, past orders, breed preferences

**On /dine:**
- "How's Lola's appetite been lately?"
- Mira can access: Lola's dietary restrictions, favorite treats, feeding schedule

**On /care:**
- "When was Lola's last grooming?"
- Mira can access: Health records, grooming history, allergies

### 6. SILENT PERSONALIZATION PATTERNS

#### Product Grid Sorting (Invisible Mira)
Products appear in this priority order:
1. Previously purchased by this pet parent
2. Matching pet's breed/size/age
3. Matching pet's known preferences (from Soul answers)
4. Bestsellers for this pillar
5. New arrivals

#### Smart Filters (Mira-Enhanced)
Filters should feel intelligent:
- "Allergy Safe" knows Lola's specific allergies
- "By Breed" auto-selects Lola's breed
- "Same Day" considers user's location

#### Recommendations (Mira's Picks)
- PersonalizedPicks component shows "For Lola" section
- Products are chosen based on Soul Score depth
- Reason is shown: "Popular with Shih Tzus" or "Matches Lola's taste"

### 7. THE CONCIERGE PROMISE
Mira OS is a "Pet Concierge" - not a marketplace. The difference:

**Marketplace:**
- Here are products. Buy them.
- Self-service. Figure it out.
- Transaction-focused.

**Concierge:**
- "Lola's birthday is in 3 weeks. Shall I plan something special?"
- "Based on Lola's breed, I'd recommend..."
- Relationship-focused.

---

## UI/UX GOLDEN RULES

### Rule 1: ONE of Everything
- ONE search bar per page (in the hero)
- ONE navigation row (pillar subcategories)
- ONE way to talk to Mira (the FAB)
- ONE pet context (active pet clearly shown)

### Rule 2: Progressive Disclosure
- Don't show everything at once
- Smart Discovery filters > Advanced filters modal
- Product tiles > Product detail modal
- Quick info > Deep dive

### Rule 3: Mobile-First, Always
- 2x2 product grid on mobile
- Swipable tabs, not cramped buttons
- Touch-friendly tap targets (48px minimum)
- Bottom-anchored actions

### Rule 4: Emotional Color Language
- Pink/Purple = Celebration, Joy, Love
- Amber/Orange = Warmth, Food, Comfort
- Green = Health, Nature, Activity
- Blue = Trust, Travel, Learning
- Red (sparingly) = Urgency, Emergency

### Rule 5: The Mira Voice
Mira speaks in:
- First person: "I know Lola loves..."
- Warm but not saccharine
- Knowledgeable but not condescending
- Brief but not curt

Examples:
- "Mira plans this the way Lola would enjoy it"
- "Perfect for a Shih Tzu who loves cuddles"
- "Based on Lola's soul, this seems right"

---

## ARCHITECTURAL STANDARDS

### Component Hierarchy
```
App
├── Navbar (global - pillar navigation, global search, user menu)
├── PillarPageLayout (wrapper for all pillar pages)
│   ├── UnifiedHero (pet-centric hero with soul score)
│   ├── Subcategory Navigation (pillar-specific tabs)
│   ├── [Page Content] (products, services, etc.)
│   └── MiraChatWidget (FAB)
└── Footer
```

### State Flow
```
PillarContext (global)
├── currentPet (the active pet)
├── pets[] (all user's pets)
├── soulData (current pet's soul answers)
└── pillar (current pillar)

↓ Flows down to:
- UnifiedHero (pet photo, name, score)
- PersonalizedPicks (Mira's recommendations)
- ProductCard (breed-specific badges)
- MiraChatWidget (conversation context)
```

### API Patterns
- Products: `/api/products?category={subcategory}&pillar={pillar}`
- Personalization: `/api/personalized-picks/{petId}?pillar={pillar}`
- Soul Data: `/api/soul-drip/completeness/{petId}`
- Mira Chat: `/api/mira/chat` (with full context payload)

---

## WHAT MIRA OS IS NOT

1. **Not a chatbot platform** - Conversation is opt-in via FAB
2. **Not a search engine** - Search exists but Mira curates proactively
3. **Not a marketplace** - It's a concierge relationship
4. **Not a pet social network** - Focus is on the pet-parent-Mira triangle
5. **Not an AI demo** - The AI should be invisible, the experience should feel magical

---

## SUCCESS METRICS

### User Experience
- Time to first meaningful interaction: < 10 seconds
- Personalization depth perception: "Mira really knows my pet"
- Navigation clarity: Users find what they need in ≤ 3 taps

### Business
- Conversion lift from personalization: Track A/B
- Soul Score completion rate: Higher = better retention
- Mira FAB engagement: Quality over quantity

### Technical
- Page load: < 2 seconds
- Personalization latency: < 500ms
- Mobile performance: 90+ Lighthouse score

---

## THE GOLDEN STANDARD CHECKLIST

For any new feature or page, ask:

- [ ] Does it put the pet first?
- [ ] Is Mira's intelligence silent or explicit? (Should be silent)
- [ ] Does it fit within the pillar structure?
- [ ] Is there only ONE way to do this action?
- [ ] Does it work beautifully on mobile?
- [ ] Would a concierge at a luxury hotel do this?
- [ ] Does the color/tone match the pillar's emotion?
- [ ] Is the Mira voice warm and knowledgeable?

---

## PILLAR PAGE TEMPLATE

Every pillar page should follow this structure:

```jsx
<PillarPageLayout
  pillar="celebrate"  // or dine, care, enjoy, etc.
  title="Celebrations for Your Pet"
  description="Mark the moments that matter"
  showSubcategories={true}
  useTabNavigation={true}
  onSubcategoryChange={handleSubcategoryChange}
>
  {/* Content area - NO duplicate heroes, NO duplicate tabs */}
  <PersonalizedPicks pillar="celebrate" />
  <ProductGrid />
  <ServiceSection />
</PillarPageLayout>
```

---

## THE MIRA CONVERSATION MODEL

When user opens Mira FAB, the conversation model:

### Context Injection
```json
{
  "pet": {
    "name": "Lola",
    "breed": "Shih Tzu",
    "age": "3 years",
    "soul_score": 63,
    "allergies": ["chicken"],
    "birthday": "2022-03-15"
  },
  "pillar": "celebrate",
  "page": "/celebrate-new",
  "recent_views": ["breed-cakes", "hampers"],
  "cart": [...]
}
```

### Mira's Opening (Pillar-Aware)
- **Celebrate**: "Planning something special for Lola? I can help with cakes, parties, or gifts!"
- **Dine**: "What's Lola in the mood for today? Fresh meals, treats, or something special?"
- **Care**: "How can I help take care of Lola today?"

### Response Style
- Acknowledge the pet by name
- Reference relevant context (breed, preferences)
- Suggest specific products/services
- Keep it conversational, not transactional

---

*This doctrine represents the accumulated wisdom from building The Doggy Company's Pet Operating System. It should guide all future development decisions.*

**Version:** 2.0  
**Last Updated:** December 2025  
**Author:** Mira OS Team

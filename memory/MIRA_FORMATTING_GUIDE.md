# MIRA FORMATTING GUIDE
## High-Class Conversation Rendering for iOS, Android & Desktop
## Last Updated: December 2025

---

## FORMATTING PRINCIPLES

### 1. Bold for Emphasis
Use **bold** for:
- Pet names: "I remember **Mojo** loves..."
- Important actions: "You should **definitely consult a vet**"
- Key product features: "This treat is **grain-free** and **chicken-free**"
- Questions that need attention: "**Would you like me to help with this?**"

### 2. Bullet Points for Lists
When showing options or steps, use proper bullets:
```
Here are some options for Mojo:
- **Soft treats** - easy on sensitive teeth
- **Training treats** - small and quick to eat
- **Dental chews** - helps keep teeth clean
```

### 3. Numbered Lists for Steps
Use numbered lists for sequential actions:
```
Here's how we can help with Mojo's birthday:
1. Choose a cake style (classic or custom)
2. Pick a date and time
3. Let us handle the rest!
```

### 4. Headers for Sections
Use headers to separate topics:
```
### About Mojo's Breed
Golden Retrievers are known for their friendly nature...

### What I Remember
Mojo prefers soft treats and is sensitive to chicken...
```

---

## CONVERSATION TONE

### Warm & Personal
- ✅ "I love that you're thinking about Mojo's birthday!"
- ❌ "Birthday party options are available."

### Action-Oriented
- ✅ "Shall I show you some cakes, or would you prefer a party kit?"
- ❌ "There are cakes and party kits available."

### Never Generic
- ✅ "For **Mojo** specifically, I'd suggest soft textures given his age."
- ❌ "Generally, older dogs prefer softer treats."

---

## PRODUCT DISPLAY RULES

### Show as Catalog, Not List
Products should display as:
- 2x2 grid on mobile
- 4-column grid on desktop
- Each with image, name, price
- "Why for [Pet]" personalized reason
- "See More" link to pillar page

### Pillar Badge
Show pillar context:
- 🎂 Celebrate
- 🍽️ Dine
- 🏨 Stay
- ✈️ Travel
- 💊 Care
- 🎾 Enjoy

### Match Badges
Show why product was selected:
- 🐕 Breed match (e.g., "Golden Retriever match")
- ✨ Context match (pillar-relevant)
- ✓ For [Pet] (general personalization)

---

## VOICE SYNC RULES

### When Voice Plays
- ✅ User types message and sends → Voice plays
- ❌ User clicks tile/suggestion → Voice does NOT play
- ⏹️ User acts while voice playing → Voice STOPS immediately

### Voice Personality
| Context | Voice Style |
|---------|-------------|
| Celebration | Happy, excited, joyful |
| Comfort/Grief | Soft, slow, empathetic |
| Health | Calm, reassuring, clear |
| Travel | Upbeat, helpful |
| Grooming | Warm, professional |

---

## CONVERSATION LIFECYCLE

### Auto-Archive After:
1. **10 minutes of inactivity** → Archive to history, start new chat
2. **Complete flow** → Mira provided assistance, user acknowledged (thanks/ok)

### Complete Flow Detection:
- Mira showed products/services/action
- User responded with acknowledgment ("thank you", "ok", "great")
- Banner shows: "Mira has helped with this request"
- Options: Continue Chat | New Chat

---

## MOBILE-FIRST RULES

### Touch Targets
- Minimum 44x44px for buttons
- 48px+ for primary actions

### Font Sizes
- Body text: 15-17px (prevents iOS zoom)
- Buttons: 13-14px
- Small text: 11-12px

### Safe Areas
- Respect notch on iPhone X+
- Bottom padding for home indicator

---

## CONCIERGE HANDOFF RULES

### Auto-Handoff When:
1. Product not in catalog → "Let me connect you with Concierge®"
2. Medical advice → "This needs a vet's eyes. Shall I help find one?"
3. Bespoke request → "Your pet Concierge® can help plan this"
4. Complex booking → "I'll have our team handle this end-to-end"

### Never Say:
- ❌ "I can't help with that"
- ❌ "Contact support"
- ❌ "That's not available"

### Always Say:
- ✅ "Let me connect you with..."
- ✅ "Your pet Concierge® can..."
- ✅ "I'll have our team..."

---

## RESPONSIVE BREAKPOINTS

```css
/* Mobile (default) */
.mp-products-grid { grid-template-columns: repeat(2, 1fr); }

/* Tablet (768px+) */
@media (min-width: 768px) {
  .mp-products-grid { grid-template-columns: repeat(3, 1fr); }
}

/* Desktop (1024px+) */
@media (min-width: 1024px) {
  .mp-products-grid { grid-template-columns: repeat(4, 1fr); }
}
```

---

## PILLAR INTEGRATION

### When User Asks About Pillar Topic:
1. **Ask clarifying questions** (when, how many, preferences)
2. **Show relevant results** (Google Places, products, services)
3. **Add "Explore More" button** → Links to pillar page

### Example Flow:
```
User: "Looking for a pet-friendly restaurant in Ooty"

Mira: "I can help you find a great spot for you and Mojo in Ooty! 🍽️

A few quick questions:
- **When** are you planning to visit?
- **Party size** - just you two, or with friends?

Once I know this, I'll show you the best options from our network!"

[After user answers]

Mira: "Here are 3 pet-friendly restaurants in Ooty:
[Google Places cards with rating, phone, directions]

**Explore more on our Dine page →**"
```

---

*This guide ensures consistent, high-class formatting across all devices.*

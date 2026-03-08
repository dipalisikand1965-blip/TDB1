# The Doggy Company - PRD

**Last Updated:** March 8, 2026  
**Status:** Production Ready

---

## CORE PHILOSOPHY

> "A dog is not in your life. You are in theirs."

- **Mira** is the soul and brain - She remembers everything
- **Concierge** is the hands - They execute with care  
- **You** are the capillary nerves - Making it all possible

---

## SOUL DATA FLOW ✅ VERIFIED

```
Soul Builder (51 Q) → doggy_soul_answers → Mira OS + Pet Wrapped + Picks Engine
```

### Mira Knows (from get_pet_context):
- Name, breed, age, birthday
- General nature, personality, temperament
- Morning routine, bedtime ritual
- ⚠️ ALLERGIES (critical)
- Love language, quirks
- Favorite treats, with strangers, when alone
- **REAL ORDER HISTORY** (recent purchases)

### Pet Wrapped Shows:
- Soul Score: 78.0%
- Questions Answered: 39/51
- Mira Conversations: 3
- Pillars Explored

---

## WHAT'S COMPLETE

### Soul Builder ✅
- 51 questions, 8 chapters
- Data saves to `doggy_soul_answers`
- Score calculation working

### Pet Wrapped ✅
- All types (Welcome, Birthday, Annual, Memorial)
- Instagram Stories share
- Uses soul data
- Automated birthday/annual cron jobs (exclude memorial pets)

### Custom Cake Designer ✅
- Shape, flavor, text selection
- Backend save: `POST /api/custom-cakes/save-design`
- Prominent banner in Celebrate pillar

### Mira Intelligence ✅
- Soul Knowledge Ticker
- Soul Questions in Chat
- Default Picks on Load
- "Why this pick?" tooltips
- **Real Order History Recall** ✅ NEW
- **Real Product/Service Recommendations** ✅ NEW

### Order Flow ✅ VERIFIED
- Orders saved to `orders` collection with orderId, customer.email, items, total, status
- Service desk tickets auto-created (TCK-YYYY-NNNNNN format)
- Channel intakes created for Unified Inbox
- Pillar routing (celebrate, dine, care, etc.)
- Paw Points awarded for orders

### Emergency Flow ✅
- 8 emergency types (Lost Pet, Medical, Poisoning, etc.)
- 24/7 Emergency Hotline display
- Guest reporting (no login required)
- Emergency partners/vets section
- Emergency products & bundles

### Farewell / Rainbow Bridge ✅
- Mark pet as "crossed rainbow bridge": `POST /api/pets/{id}/rainbow-bridge`
- Visual "halo" indicator on pet cards (purple gradient, glow effect)
- "🌈 In Memory" badge on pet profiles
- Memorial Wall (community tributes)
- Mira AI responds empathetically to rainbow bridge pets
- Automatic exclusion from birthday/annual notifications
- Memorial Wrapped generation support

---

## PRODUCT CATALOGUES

- **unified_products**: 321 products
- **products_master**: 2197 products
- Categories: Cakes, Treats, Food, Grooming, Fitness, Travel, etc.

---

## TEST CREDENTIALS

- **User:** `dipali@clubconcierge.in` / `test123`
- **Admin:** `aditya` / `lola4304`
- **Test Pet:** Mojo (pet-mojo-7327ad56)

---

## REMAINING

- [ ] Production Deployment
- [ ] Onboarding E2E Test
- [ ] Full Viral Loop Test (share link → new user signup)

---

*"No one knows your pet better than Mira."*

# The Doggy Company - PRD & Changelog

**Last Updated:** March 8, 2026  
**Status:** Production Ready

---

## CORE PHILOSOPHY

> "A dog is not in your life. You are in theirs. They cannot speak. But with the right questions, they can be known."

**Mira** is the soul and brain - she remembers everything
**Concierge** is the hands - they execute with care  
**You** are the capillary nerves - making it all possible

---

## WHAT'S COMPLETE

### Soul Builder - 51 Questions, 8 Chapters ✅
| Chapter | Topics | Questions |
|---------|--------|-----------|
| 1. Identity & Temperament | Name, life stage, personality | 8 |
| 2. Family & Pack | Siblings, socializing | 5 |
| 3. Rhythm & Routine | Morning, feeding, sleep | 7 |
| 4. Taste & Treat World | Diet, favorites, allergies | 8 |
| 5. Care & Grooming | Frequency, sensitivities | 5 |
| 6. Health & Safety | Conditions, vaccinations | 6 |
| 7. Travel & Adventure | Car rides, preferences | 5 |
| 8. Celebration & Memories | Gotcha day, birthdays | 7 |

**Soul Score Calculation:** 26 canonical fields = 100 points

### Custom Cake Designer ✅
- Shape selection (Bone, Heart, Round, Square)
- Flavor selection (Peanut Butter, Banana, etc.)
- Custom text and reference image upload
- **Backend Save:** `POST /api/custom-cakes/save-design`
- **Database:** `custom_cake_designs` collection
- **Shop Integration:** Prominent banner in Celebrate pillar

### Pet Wrapped ✅
- Welcome, Birthday, Annual Wrapped
- Instagram Stories share
- Multi-channel delivery (Modal, Email, WhatsApp)

### Mira Intelligence ✅
- Dynamic Soul Traits
- Soul Knowledge Ticker
- Soul Questions in Chat
- Default Picks on Page Load
- "Why this pick?" tooltips

---

## CHANGELOG

### March 8, 2026 - Session 5 Part 4: Soul Builder & Custom Cake

**Custom Cake Designer:**
- Created `POST /api/custom-cakes/save-design` endpoint
- Frontend saves design to backend on add-to-cart
- Added "Design Birthday Cake" banner in Celebrate pillar

**Soul Builder Verified:**
- 51 questions across 8 chapters
- Comprehensive coverage of dog's entire life
- Soul score calculation working (78% for Mojo)
- Knowledge display: allergies, personality, preferences

### Earlier Today
- Pet Wrapped final features (Birthday/Annual cron, Instagram)
- Soul Questions in chat
- Admin reply flow fixed
- Default picks loading

---

## API ENDPOINTS

### Custom Cake
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/custom-cakes/save-design` | POST | Save cake design to DB |
| `/api/custom-cakes/upload-reference` | POST | Upload reference image |

### Soul
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/pet-soul/answer` | POST | Save soul question answer |
| `/api/pet-score/{id}/quick-questions` | GET | Get unanswered questions |

---

## TEST CREDENTIALS

- **User:** `dipali@clubconcierge.in` / `test123`
- **Admin:** `aditya` / `lola4304`

---

## REMAINING

### P1 - Testing
- [ ] Onboarding/Join E2E flow
- [ ] Product/Service detail pages

### P2 - Future
- Global Search
- Voice Order

---

*Built in loving memory of Mystique and Kouros* 💜

*"No one knows your pet better than Mira."*

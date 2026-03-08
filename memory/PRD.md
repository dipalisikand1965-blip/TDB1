# The Doggy Company - PRD & Changelog

**Last Updated:** March 8, 2026  
**Status:** Production Ready

---

## WHAT'S COMPLETE (March 8, 2026)

### Pet Wrapped - FEATURE COMPLETE ✅
- Welcome Wrapped ✅
- Birthday Wrapped (daily cron) ✅
- Annual Wrapped (Dec 10 batch) ✅
- Instagram Stories share ✅

### Mira Intelligence - FIXED ✅
- Dynamic Soul Traits ✅
- Soul Knowledge Ticker ✅
- Voice Default OFF ✅
- Proactive Alerts ✅
- Default Picks on Load ✅
- **Soul Questions in Chat ✅ NEW**

### Admin & Notifications - FIXED ✅
- Admin Reply → Member Inbox ✅
- Primary Notifications Tab ✅
- Category Filtering ✅

### CX Journey - FIXED ✅
- Add Pet for existing users ✅
- Complete Soul Profile CTA ✅
- Pet Photos (breed defaults) ✅
- Emergency Pillar ✅
- "Why this pick?" tooltips ✅

---

## CHANGELOG

### March 8, 2026 - Session 5 Part 3: Soul Questions

**Soul Questions During Conversation:**
- Created `SoulQuestionPrompts.jsx` component
- Shows 3 quick questions in chat area before conversation starts
- Categories: Identity, Rhythm & Routine, Taste & Treat World
- Multiple choice options with inline selection
- Created `POST /api/pet-soul/answer` endpoint
- Earns 10 Paw Points per answer
- Updates soul score in real-time

**Picks "Why this pick?" Tooltips:**
- Updated default picks endpoint with `why_reason` field
- Added `badges` for visual indicators (curated, breed_match, trending)
- Personalized reasons based on pet's breed, allergies, preferences

### March 8, 2026 - Session 5 Part 2: Critical Fixes

- Admin reply flow verified
- Notifications API fixed
- Default picks loading on page load

### March 8, 2026 - Session 5 Part 1: Pet Wrapped

- Birthday/Annual cron jobs
- Instagram Stories share

---

## API ENDPOINTS

### New Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/pet-soul/answer` | POST | Save soul question answer |
| `/api/mira/picks/default/{pet_id}` | GET | Personalized default picks |

---

## TEST CREDENTIALS

- **User:** `dipali@clubconcierge.in` / `test123`
- **Admin:** `aditya` / `lola4304`

---

## WHAT'S REMAINING

### P1 - Testing Needed
- [ ] Onboarding/Join Flow E2E
- [ ] Product/Service Detail Pages
- [ ] Soul Builder full test

### P2 - Nice to Have
- [ ] Global Search testing
- [ ] Custom Cake Designer
- [ ] Voice Order testing

---

*Built in loving memory of Mystique and Kouros* 💜

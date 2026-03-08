# The Doggy Company - PRD & Changelog

**Last Updated:** March 8, 2026  
**Status:** Production Ready

---

## EXECUTIVE SUMMARY

The Doggy Company is a Pet Life Operating System - the world's first platform that treats dogs as souls to be known.

---

## WHAT'S COMPLETE (March 8, 2026)

### Pet Wrapped - FEATURE COMPLETE ✅
| Feature | Status |
|---------|--------|
| Welcome Wrapped | ✅ LIVE |
| Birthday Wrapped | ✅ AUTOMATED (daily cron) |
| Annual Wrapped | ✅ AUTOMATED (Dec 10 batch) |
| Instagram Stories | ✅ Share button + story card |

### Mira Intelligence - FIXED ✅
| Feature | Status |
|---------|--------|
| Dynamic Soul Traits | ✅ No hardcoded traits |
| Soul Knowledge Ticker | ✅ Added to chat area |
| Voice Default | ✅ OFF by default |
| Proactive Alerts | ✅ Working in TODAY tab |
| Default Picks on Load | ✅ NEW - Picks tab never empty |

### Admin & Notifications - FIXED ✅
| Feature | Status |
|---------|--------|
| Admin Reply → Member Inbox | ✅ Working |
| Primary Notifications Tab | ✅ Shows concierge replies |
| Category Filtering | ✅ primary/updates/all |

### CX Journey - FIXED ✅
| Feature | Status |
|---------|--------|
| Add Pet for existing users | ✅ |
| Complete Soul Profile CTA | ✅ |
| Upcoming Events | ✅ |
| Pet Selector in Checkout | ✅ |
| Pet Edit Modal | ✅ |
| Pet Photos (breed defaults) | ✅ Already working |
| Emergency Pillar | ✅ Already working |

---

## CHANGELOG

### March 8, 2026 (Session 5) - Part 2: Critical & High Priority Fixes

**Admin Reply Flow:**
- Fixed notifications endpoint to use `member_notifications` collection
- Added category filter support (primary, updates, all)
- Verified end-to-end: Admin reply creates member notification

**Picks Tab Default Load:**
- Created `GET /api/mira/picks/default/{pet_id}` endpoint
- Returns 6-10 personalized picks based on pet's profile
- Frontend now fetches picks on page load
- Picks show immediately in PICKS tab

**Notifications API:**
- Updated `/api/notifications` to query correct collections
- Fixed Primary tab to show concierge replies

### March 8, 2026 (Session 5) - Part 1: Pet Wrapped Complete

**Pet Wrapped Final Features:**
- Automated Birthday Wrapped (daily 9 AM IST cron)
- December Annual Wrapped (Dec 10 batch job)
- Instagram Stories share button + 1080x1920 story card

**Mira Intelligence Fixes:**
- Dynamic soul traits in WelcomeHero.jsx
- SoulKnowledgeTicker added to MiraDemoPage.jsx
- Voice defaults to OFF

---

## API ENDPOINTS

### New Endpoints (March 8, 2026)
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/mira/picks/default/{pet_id}` | GET | Default picks for pet |
| `/api/wrapped/instagram-story/{pet_id}` | GET | 1080x1920 story card |
| `/api/wrapped/log-share/{pet_id}` | POST | Track shares |

### Notifications
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/member/notifications/inbox/{email}` | GET | User notifications with category filter |
| `/api/notifications` | GET | Alt notifications endpoint (fixed) |

---

## WHAT'S REMAINING

### P0 - Before Launch
- [ ] Production deployment + MASTER SYNC

### P1 - Testing Needed
- [ ] Soul Questions During Conversation
- [ ] Full Onboarding/Join Flow E2E
- [ ] Product/Service Detail Pages

### P2 - Nice to Have
- [ ] Soul Builder full testing
- [ ] Global Search testing
- [ ] Custom Cake Designer testing
- [ ] Voice Order testing

---

## TEST CREDENTIALS

- **User:** `dipali@clubconcierge.in` / `test123`
- **Admin:** `aditya` / `lola4304`

---

*Built in loving memory of Mystique and Kouros* 💜

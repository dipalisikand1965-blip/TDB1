# Mira OS - Product Requirements Document

## Original Problem Statement
Mira OS is a pet concierge application that provides personalized pet care recommendations, services, and products. The app features conversational AI (Mira) that understands pet context, handles various pillars (Celebrate, Care, Learn, etc.), and integrates with Shopify for product recommendations.

## Core Architecture
- **Frontend**: React.js with premium UI (MiraDemoPage.jsx)
- **Backend**: FastAPI/Flask Python backend
- **Database**: MongoDB with products_master, pets, users collections
- **External APIs**: Google Places, Shopify (thedoggybakery.com), OpenAI
- **CSS**: `/app/frontend/src/styles/mira-prod.css` (MAIN CSS FILE)

---

## Session Feb 9, 2025 - Completed Work

### 1. Shopify Product Sync ✅
- Synced **392 products** from thedoggybakery.com
- Categories: cakes (106), breed-cakes (69), mini-cakes (48), hampers (39), accessories
- All products have beautiful Shopify CDN images

### 2. Bug Fixes ✅
- **"Friend's dog" Context Bug FIXED** - Mira no longer uses user's pet context when asking about someone else's pet
- **Barking Misclassification FIXED** - Behavior questions get training advice, not overwhelm responses
- **Spell Correction FIXED** - Disabled fuzzy matching that was changing "cake" to "cat"

### 3. UI Repositioning ✅ (IN PROGRESS)
**GOAL**: Move all action elements to TOP BAR of Mira message card

**Current Header Bar Layout**:
```
[Mira Icon] [Mira] [Quick Reply Tiles...] [C° Need help?] [Insight Icon]
```

**What was REMOVED from message body**:
- Quick reply tiles (moved to header)
- Insight hint button (now icon in header)
- Duplicate "C° Talk to someone who understands" (removed)

**"Ready for Mojo" + "Concierge®"** - Stays in separate bottom area (NOT in header)

### 4. Day 1 Original Reference ✅
- Created `/mira-demo-original` route with original 494-line clean code
- Original file saved at `/app/memory/DAY1_ORIGINAL_MiraDemoPage.jsx`

---

## KEY FILES

| File | Purpose |
|------|---------|
| `/app/frontend/src/pages/MiraDemoPage.jsx` | Main chat UI (~5900 lines) |
| `/app/frontend/src/styles/mira-prod.css` | **MAIN CSS** - All styles here |
| `/app/frontend/src/styles/mira-premium.css` | Legacy CSS (NOT USED by MiraDemoPage) |
| `/app/backend/mira_routes.py` | Main API routes |
| `/app/memory/MIRA_DOCTRINE.md` | THE BIBLE - Core rules |

---

## CRITICAL RULES FOR NEXT AGENT

### 1. CSS File
**USE ONLY `/app/frontend/src/styles/mira-prod.css`**
The page imports `mira-prod.css` at line 167. Any CSS in `mira-premium.css` will NOT apply.

### 2. Header Bar Classes
```css
.mp-card-header - Main header container (flex, wrap)
.mp-header-tiles - Container for quick reply tiles
.mp-header-tile - Individual tile button (purple pill)
.mp-header-help - "C° Need help?" button (green)
.mp-header-insight-icon - Circular insight icon with badge
```

### 3. NO Elements Between Conversation
- All action elements go in `.mp-card-header` ONLY
- `.mp-card-body` should contain ONLY: text, products, places
- No buttons/tiles/hints in the body

### 4. Mobile Responsive
CSS has breakpoints at:
- `@media (max-width: 768px)` - Tablet
- `@media (max-width: 480px)` - Mobile

### 5. Spell Correction
File: `/app/frontend/src/utils/spellCorrect.js`
- Fuzzy matching is DISABLED (was changing valid words)
- Only direct dictionary matches are applied

---

## PENDING TASKS

### P0 - Immediate
1. **Verify header bar alignment** on mobile/iOS
2. **Test all tile interactions** work correctly
3. **Ensure "Ready for Mojo" button** appears in bottom area correctly

### P1 - Next Session
1. **Product/Service Recommendation Architecture** - Smart Suggestion Cards
2. **Refactor MiraDemoPage.jsx** - Break into smaller components
3. **Long-term memory** - Store pet preferences in DB

### P2 - Backlog
1. Proactive intelligence (smart reminders)
2. Multi-modal understanding (image uploads)

---

## TEST CHECKLIST

Before finishing any session:
1. [ ] Type "I want a cake for Mojo" - Should NOT change to "cat"
2. [ ] Confetti should trigger on celebrate keywords
3. [ ] Quick reply tiles appear in header bar (not body)
4. [ ] "C° Need help?" button works
5. [ ] No duplicate buttons in message body
6. [ ] Mobile responsive - elements wrap correctly
7. [ ] "Ready for Mojo" button visible at bottom

---

## MEMORY FILES

| File | Purpose |
|------|---------|
| `/app/memory/MIRA_DOCTRINE.md` | Core rules - READ FIRST |
| `/app/memory/MIRA_HAPTIC_SYSTEM.md` | Haptic feedback protocol |
| `/app/memory/MIRA_UNIVERSAL_RULES.md` | Conversation rules |
| `/app/memory/ROADMAP_TO_100.md` | Full roadmap |
| `/app/memory/DAY1_ORIGINAL_MiraDemoPage.jsx` | Original clean 494-line code |

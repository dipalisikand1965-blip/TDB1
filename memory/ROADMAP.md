# ROADMAP - The Doggy Company / Mira OS
## Prioritized Feature Backlog
### Last Updated: February 15, 2026

---

## ✅ COMPLETED

### Feb 15, 2026
- [x] Fix `/celebrate-new` array error
- [x] Unify 8 Golden Pillars scoring system
- [x] Create `/api/pet-soul/profile/{pet_id}/8-pillars` endpoint
- [x] Create comprehensive handover documentation

### Feb 14, 2026
- [x] Concierge® rebrand
- [x] Backend-driven intelligent quick replies
- [x] Inline conversational UI

### Feb 13, 2026
- [x] Mira OS Modal (BETA)
- [x] Multi-pet switching in modal

---

## 🔴 P0 - Critical (Do This Week)

### 1. ElevenLabs Voice Testing
**Status:** Code exists, UNTESTED
**Files:** `MiraOSModal.jsx`
**Task:** 
- Test voice playback in Mira OS
- Fix any audio issues
- Verify voice works on mobile

### 2. Quick Questions in Concierge®
**Status:** Not started
**Task:**
- Mira should proactively ask Quick Questions during chat
- When pillar gaps detected, weave in relevant questions
- Save answers from chat to pet soul

### 3. /mira-demo 8-Pillar Visual
**Status:** Not started
**Task:**
- Update MiraDemoPage to show 8-pillar breakdown
- Use new `/8-pillars` endpoint
- Show radar chart of pillar completion

---

## 🟡 P1 - Important (Next 2 Weeks)

### 4. Concierge Indicator States
**Task:**
- Connect 🤲 icon in navbar to unified flow
- States: idle, active, pulsing
- Show when concierge action needed

### 5. Proactive Mira Intelligence
**Task:**
- Mira detects pillar gaps automatically
- Suggests completing low-score pillars
- "I notice we haven't talked about X..."

### 6. Soul Score Display Everywhere
**Task:**
- Show tier badge on pet cards
- Progress bar to next tier
- Pillar breakdown on hover

---

## 🟢 P2 - Nice to Have (This Month)

### 7. Gate Mira OS for Paid Members
**Task:**
- Check membership status before showing OS
- Show upgrade prompt for free users
- Premium experience differentiation

### 8. Original FAB Fixes
**Task:**
- Fix multi-pet switching in old FAB
- Fix voice in old FAB
- (Lower priority since Mira OS is replacing it)

---

## 🔵 P3 - Future (Backlog)

### 9. Phase Out Old FAB
- Remove MiraChatWidget from codebase
- Make MiraOSModal the only Mira experience
- Update all pages to use new modal

### 10. Replace /celebrate with /celebrate-new
- Make /celebrate-new the canonical URL
- Redirect old URL
- Update all internal links

### 11. Backend Refactoring
- Split server.py into modular routers
- Separate concerns: auth, pets, products, mira
- Improve maintainability

### 12. WebSocket Notifications
- Real-time updates for orders
- Live Mira typing indicator
- Push notifications

---

## 📊 Success Metrics

### Mira Intelligence Score Target
- Current (Mojo): 89% Pack Leader
- Target: 95% Soul Master for engaged users

### Pillar Completion Targets
| Pillar | Current | Target |
|--------|---------|--------|
| Identity | 100% | 100% |
| Family | 100% | 100% |
| Rhythm | 100% | 100% |
| Home | 100% | 80%+ |
| Travel | 100% | 60%+ |
| Taste | 100% | 90%+ |
| Training | 100% | 70%+ |
| Health | 82% | 90%+ |

---

## 🚫 NOT DOING

1. **Redesigning 14 pillar pages** - Current design is acceptable
2. **New onboarding flow** - Current flow works
3. **Mobile app** - Web-first approach continues

---

*Update this roadmap as priorities change.*

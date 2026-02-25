# MIRA OS - ENHANCEMENT ROADMAP
## February 2026 Onwards

> This is the living roadmap for MIRA OS enhancements.
> Agents should pick tasks from here and mark them complete.

---

## CURRENT STATE SUMMARY

**Overall Score:** 68/100
**Target Score:** 90/100
**Timeline:** Q1-Q2 2026

---

## P0 - CRITICAL (THIS SPRINT)

### P0.1 Picks Engine Re-ranking
**Priority:** CRITICAL | **Effort:** Medium | **Impact:** High

**Current State:** Basic picks shown, no personalization
**Target State:** Dynamic picks based on conversation context

**Tasks:**
- [ ] Implement pick scoring algorithm
- [ ] Add conversation context weighting
- [ ] Implement "catalogue-first, concierge-always" principle
- [ ] Add pillar-aware suggestions
- [ ] Test with 10+ scenarios

**Files:**
- `/app/backend/mira_routes.py` - Picks logic
- `/app/frontend/src/pages/MiraDemoPage.jsx` - Picks UI

---

### P0.2 Mobile Touch Targets
**Priority:** CRITICAL | **Effort:** Low | **Impact:** High

**Current State:** Some buttons < 44px
**Target State:** All interactive elements >= 44px

**Tasks:**
- [ ] Audit all buttons in MiraDemoPage
- [ ] Update CSS for minimum touch targets
- [ ] Test on iPhone SE (smallest viewport)
- [ ] Test on Android small devices

**Files:**
- `/app/frontend/src/pages/MiraDemoPage.jsx`
- `/app/frontend/src/components/Mira/*.jsx`

---

### P0.3 Safe Area Insets
**Priority:** CRITICAL | **Effort:** Low | **Impact:** High

**Current State:** Partial safe area support
**Target State:** Full safe-area-inset on all screens

**Tasks:**
- [ ] Add `env(safe-area-inset-*)` to layouts
- [ ] Test on iPhone 14 Pro (notch)
- [ ] Test on Android with gesture nav
- [ ] Update Tailwind config if needed

**Files:**
- `/app/frontend/src/index.css`
- `/app/frontend/src/pages/MiraDemoPage.jsx`

---

## P1 - HIGH PRIORITY (NEXT SPRINT)

### P1.1 TODAY Surface UI
**Priority:** HIGH | **Effort:** High | **Impact:** High

**Current State:** Not built
**Target State:** Time-aware alerts and tasks view

**Tasks:**
- [ ] Design TODAY surface wireframe
- [ ] Create TodaySurface component
- [ ] Implement time-bound alerts
- [ ] Add morning/evening routines
- [ ] Connect to proactive system
- [ ] Add reminders integration

**Components to Create:**
- `TodaySurface.jsx`
- `TodayCard.jsx`
- `TimelineView.jsx`

---

### P1.2 Services Task Tracking UI
**Priority:** HIGH | **Effort:** High | **Impact:** High

**Current State:** Basic ticket list
**Target State:** Full task lifecycle UI

**Tasks:**
- [ ] Design task detail view
- [ ] Add task status updates
- [ ] Add task communication history
- [ ] Add task assignment UI
- [ ] Add task completion flow
- [ ] Connect to service_desk_tickets

**Files:**
- `/app/frontend/src/pages/ServiceDesk.jsx`
- New: `TaskDetail.jsx`, `TaskTimeline.jsx`

---

### P1.3 Proactive Alerts System
**Priority:** HIGH | **Effort:** Medium | **Impact:** Medium

**Current State:** Basic reminders
**Target State:** Smart, contextual alerts

**Tasks:**
- [ ] Implement alert priority scoring
- [ ] Add weather-based alerts
- [ ] Add health reminder alerts
- [ ] Add celebration alerts (birthday)
- [ ] Add vaccination due alerts
- [ ] Implement alert dismissal tracking

**Files:**
- `/app/backend/mira_proactive.py`
- `/app/frontend/src/components/Mira/ProactiveAlert.jsx`

---

### P1.4 PWA Offline Support
**Priority:** HIGH | **Effort:** High | **Impact:** Medium

**Current State:** None
**Target State:** Graceful offline mode

**Tasks:**
- [ ] Create service worker
- [ ] Implement offline queue
- [ ] Add sync when online
- [ ] Cache critical assets
- [ ] Add offline indicators
- [ ] Test offline scenarios

**Files:**
- New: `/app/frontend/public/sw.js`
- `/app/frontend/src/index.js`

---

## P2 - MEDIUM PRIORITY (BACKLOG)

### P2.1 INSIGHTS Analytics Dashboard
**Priority:** MEDIUM | **Effort:** High | **Impact:** Medium

**Tasks:**
- [ ] Design insights wireframe
- [ ] Create InsightsDashboard component
- [ ] Add behavior pattern detection
- [ ] Add health trend charts
- [ ] Add expense tracking
- [ ] Add comparison benchmarks

---

### P2.2 Complete ADOPT Pillar
**Priority:** MEDIUM | **Effort:** Medium | **Impact:** Low

**Tasks:**
- [ ] Build adoption readiness quiz
- [ ] Add shelter/rescue search
- [ ] Add temperament matching
- [ ] Add adoption application flow
- [ ] Connect to existing adopt_* collections

---

### P2.3 Complete PAPERWORK Pillar
**Priority:** MEDIUM | **Effort:** Medium | **Impact:** Low

**Tasks:**
- [ ] Build document vault UI
- [ ] Add vaccination record tracking
- [ ] Add license renewal reminders
- [ ] Add microchip registration
- [ ] Add travel document checklist

---

### P2.4 Complete FAREWELL Pillar
**Priority:** MEDIUM | **Effort:** Medium | **Impact:** Low

**Tasks:**
- [ ] Build memorial page
- [ ] Add grief support resources
- [ ] Add memory preservation
- [ ] Add cremation/burial options
- [ ] Handle with extreme sensitivity

---

### P2.5 MiraDemoPage Refactoring
**Priority:** MEDIUM | **Effort:** Medium | **Impact:** Medium

**Current State:** 3,447 lines
**Target State:** < 1,000 lines + hooks

**Tasks:**
- [x] Phase 1: Extract useChatSubmit (DONE)
- [ ] Phase 2: Extract useConversation
- [ ] Phase 3: Extract useMiraUI
- [ ] Phase 4: Extract useProactiveAlerts
- [ ] Phase 5: Extract useServiceDesk

---

## P3 - FUTURE (WISHLIST)

### P3.1 Multi-Pet Switching
- Quick switch between pets
- Per-pet context preservation
- Household view

### P3.2 Wearable Integration
- Activity tracking
- Health monitoring
- GPS location

### P3.3 AR Features
- Product visualization
- Training guides overlay
- Pet identification

### P3.4 Voice Interface
- Voice commands
- Audio responses
- Hands-free mode

### P3.5 Community Features
- Playdate matching
- Local pet parent groups
- Expert Q&A

---

## COMPLETION TRACKING

| Phase | Tasks | Complete | Score Target |
|-------|-------|----------|--------------|
| P0 | 3 | 0 | 75/100 |
| P1 | 4 | 0 | 85/100 |
| P2 | 5 | 1 (partial) | 90/100 |
| P3 | 5 | 0 | 95/100 |

---

## HOW TO USE THIS ROADMAP

1. **Pick a task** from P0 first (highest priority)
2. **Mark it in-progress** by adding your agent ID
3. **Complete all subtasks** in order
4. **Test thoroughly** before marking complete
5. **Update this file** with completion date
6. **Move to next task**

**Format for completion:**
```
- [x] Task name (DONE - Feb 12, 2026 - Agent-XYZ)
```

---

*Created: February 12, 2026*
*Last Updated: February 12, 2026*
*Owner: MIRA OS Team*

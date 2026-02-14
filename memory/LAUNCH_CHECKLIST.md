# PRODUCTION READINESS CHECKLIST
## The Doggy Company - Launch Tracker
### Last Updated: February 14, 2026

---

## INSTRUCTIONS FOR AGENTS
> **Every agent must update this file after completing any task.**
> Mark items with ✅ when done, add date and notes.
> This is the SINGLE SOURCE OF TRUTH for launch readiness.

---

## PHASE 1: CRITICAL BUG FIXES (Days 1-3)

### Day 1: Auth & Session Fixes
| Task | Status | Date | Agent | Notes |
|------|--------|------|-------|-------|
| Fix `/dashboard` redirect to login issue | ✅ DONE | Feb 14 | E1 | Wrapped in ProtectedRoute in App.js |
| Debug AuthContext state persistence | ✅ DONE | Feb 14 | E1 | Already working correctly |
| Test login → navigate → refresh flow | ⏳ TESTING | Feb 14 | E1 | Testing now |
| Fix session token refresh logic | 🔲 TODO | | | |
| Verify logout clears all state | 🔲 TODO | | | |

**Day 1 Tests:**
- [ ] Login with test user
- [ ] Navigate to /dashboard - should NOT redirect
- [ ] Refresh page - should stay logged in
- [ ] Navigate across pillars - session persists
- [ ] Logout and verify protected routes blocked

---

### Day 2: Pet State & Race Conditions
| Task | Status | Date | Agent | Notes |
|------|--------|------|-------|-------|
| Add loading state to MiraDemoPage | 🔲 TODO | | | |
| Prevent API calls before pet loaded | 🔲 TODO | | | |
| Remove hardcoded `demo-pet` fallbacks | 🔲 TODO | | | |
| Add error boundaries for pet loading | 🔲 TODO | | | |
| Test multi-pet switching | 🔲 TODO | | | |

**Day 2 Tests:**
- [ ] Fresh login - no console errors about demo-pet
- [ ] Pet profile loads before API calls
- [ ] Switch pets - data updates correctly
- [ ] Slow network - loading states appear

---

### Day 3: Service Flow Verification
| Task | Status | Date | Agent | Notes |
|------|--------|------|-------|-------|
| Test Celebrate → Ticket | 🔲 TODO | | | |
| Test Travel → Ticket | 🔲 TODO | | | |
| Test Care → Ticket | 🔲 TODO | | | |
| Test Emergency → Ticket | 🔲 TODO | | | |
| Test all 14 pillar entry points | 🔲 TODO | | | |
| Fix any broken flows | 🔲 TODO | | | |

**Day 3 Tests:**
- [ ] Each pillar creates service desk ticket
- [ ] Tickets appear in admin service desk
- [ ] Ticket contains correct pet/user info

---

## PHASE 2: REAL-TIME NOTIFICATIONS (Days 4-6)

### Day 4: WebSocket Backend
| Task | Status | Date | Agent | Notes |
|------|--------|------|-------|-------|
| Install websockets library | 🔲 TODO | | | |
| Create WebSocket endpoint | 🔲 TODO | | | |
| Implement user channels | 🔲 TODO | | | |
| Add connection manager | 🔲 TODO | | | |
| Test from Postman/curl | 🔲 TODO | | | |

---

### Day 5: WebSocket + Tickets
| Task | Status | Date | Agent | Notes |
|------|--------|------|-------|-------|
| Integrate WS in ticket reply | 🔲 TODO | | | |
| Send notification on admin reply | 🔲 TODO | | | |
| Add reconnection logic | 🔲 TODO | | | |
| Handle offline users | 🔲 TODO | | | |
| End-to-end test | 🔲 TODO | | | |

---

### Day 6: Frontend WebSocket
| Task | Status | Date | Agent | Notes |
|------|--------|------|-------|-------|
| Create useWebSocket hook | 🔲 TODO | | | |
| Integrate with NotificationBell | 🔲 TODO | | | |
| Update count in real-time | 🔲 TODO | | | |
| Show toast on new notification | 🔲 TODO | | | |
| Update ConciergeThreadPanel | 🔲 TODO | | | |

**Phase 2 Tests:**
- [ ] User on /mira-demo
- [ ] Admin sends reply
- [ ] User sees notification instantly (<1 sec)
- [ ] No refresh needed

---

## PHASE 3: CORE FLOW TESTING (Days 7-9)

### Day 7: Onboarding Flow
| Task | Status | Date | Agent | Notes |
|------|--------|------|-------|-------|
| Test /join Step 1 | 🔲 TODO | | | |
| Test /join Step 2 | 🔲 TODO | | | |
| Test /join Step 3 | 🔲 TODO | | | |
| Test /join Step 4 | 🔲 TODO | | | |
| Fix form validations | 🔲 TODO | | | |
| Verify pet in Mira OS | 🔲 TODO | | | |

---

### Day 8: E-Commerce Flow
| Task | Status | Date | Agent | Notes |
|------|--------|------|-------|-------|
| Test product listing | 🔲 TODO | | | |
| Test add to cart | 🔲 TODO | | | |
| Test cart persistence | 🔲 TODO | | | |
| Test checkout flow | 🔲 TODO | | | |
| Test Razorpay (test mode) | 🔲 TODO | | | |

---

### Day 9: Mira Conversation
| Task | Status | Date | Agent | Notes |
|------|--------|------|-------|-------|
| Test Quick Questions | 🔲 TODO | | | |
| Test voice input | 🔲 TODO | | | |
| Test TTS sync | 🔲 TODO | | | |
| Test conversation memory | 🔲 TODO | | | |
| Test service from chat | 🔲 TODO | | | |

---

## PHASE 4: MOBILE & POLISH (Days 10-12)

### Day 10: Mobile Critical
| Task | Status | Date | Agent | Notes |
|------|--------|------|-------|-------|
| Home page mobile | 🔲 TODO | | | |
| Login/Join mobile | 🔲 TODO | | | |
| Mira OS mobile | 🔲 TODO | | | |
| 14 pillar pages mobile | 🔲 TODO | | | |
| Fix responsive issues | 🔲 TODO | | | |

---

### Day 11: Mobile Complete
| Task | Status | Date | Agent | Notes |
|------|--------|------|-------|-------|
| Checkout mobile | 🔲 TODO | | | |
| Cart mobile | 🔲 TODO | | | |
| FAQs mobile | 🔲 TODO | | | |
| Contact mobile | 🔲 TODO | | | |
| About mobile | 🔲 TODO | | | |

---

### Day 12: UI Polish
| Task | Status | Date | Agent | Notes |
|------|--------|------|-------|-------|
| Font sizes audit | 🔲 TODO | | | |
| Button styles audit | 🔲 TODO | | | |
| Spacing/padding audit | 🔲 TODO | | | |
| Loading states | 🔲 TODO | | | |
| Error states | 🔲 TODO | | | |

---

## PHASE 5: FINAL QA (Days 13-14)

### Day 13: End-to-End QA
| Task | Status | Date | Agent | Notes |
|------|--------|------|-------|-------|
| Journey 1: Signup → Service | 🔲 TODO | | | |
| Journey 2: Login → Checkout | 🔲 TODO | | | |
| Journey 3: Emergency flow | 🔲 TODO | | | |
| Journey 4: Admin workflow | 🔲 TODO | | | |

---

### Day 14: Launch Prep
| Task | Status | Date | Agent | Notes |
|------|--------|------|-------|-------|
| Review env variables | 🔲 TODO | | | |
| Verify API keys | 🔲 TODO | | | |
| Test production DB | 🔲 TODO | | | |
| Admin sync products | 🔲 TODO | | | |
| Backup database | 🔲 TODO | | | |
| Rollback plan ready | 🔲 TODO | | | |

---

## LAUNCH CHECKLIST

| Requirement | Status | Verified By |
|-------------|--------|-------------|
| All P0 bugs fixed | 🔲 | |
| WebSocket notifications | 🔲 | |
| Mobile tested | 🔲 | |
| E-commerce working | 🔲 | |
| Admin can manage | 🔲 | |
| Data synced | 🔲 | |
| API keys production | 🔲 | |
| Database backed up | 🔲 | |

---

## BUGS FOUND & FIXED LOG

| Date | Bug Description | Fix Applied | Fixed By |
|------|-----------------|-------------|----------|
| | | | |

---

## KNOWN ISSUES (Accepted for Launch)

| Issue | Impact | Workaround | Will Fix Post-Launch |
|-------|--------|------------|---------------------|
| | | | |

---

*Checklist created: February 14, 2026*
*Target Launch: February 28, 2026*

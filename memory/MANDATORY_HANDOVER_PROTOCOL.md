# MANDATORY AGENT HANDOVER PROTOCOL
## Zero Drift Policy - Every Agent Must Follow This

---

# ⛔ STOP - YOU CANNOT START WORK UNTIL YOU COMPLETE THIS

This protocol is **NON-NEGOTIABLE**. Every agent session must:
1. Read the required files (in order)
2. Paste the STATE SNAPSHOT
3. Confirm NON-NEGOTIABLES
4. Provide PROOFS for any work done
5. End with single NEXT AGENT TASK

**If you skip any step, you will break the system.**

---

# 1. REQUIRED READING (In This Order)

Every new agent must open and read these files BEFORE any work:

| Order | File | Purpose |
|-------|------|---------|
| 1 | `/app/memory/PET_OS_BEHAVIOR_BIBLE.md` | Voice, tone, quick replies, safety |
| 2 | `/app/memory/ONE_SPINE_SPEC.md` | Ticket rules + proof requirements |
| 3 | `/app/memory/AGENT_MASTER_PROTOCOL.md` | Complete system protocol |
| 4 | `/app/memory/EXHAUSTIVE_AUDIT_FRAMEWORK.md` | QA checklist + regression prompts |
| 5 | `/app/memory/PRD.md` | Current product decisions |
| 6 | Latest `/app/test_reports/iteration_*.json` | Last test results |

**If you cannot access a file, you MUST say:**
> "Blocked: cannot access [filename], proceeding with [list what you can access] only."

---

# 2. STATE SNAPSHOT (Paste This at Start of Every Session)

Copy this template and fill it in at the START of every agent session:

```
═══════════════════════════════════════════════════════════════
STATE SNAPSHOT
═══════════════════════════════════════════════════════════════

Date/Time: [YYYY-MM-DD HH:MM UTC]
Environment: staging / prod / local
Branch/Commit: [if known]
Feature flags: debug=1, ICON_STATE_API_ENABLED=?

CERTIFICATION STATUS:
┌─────────────────────────────┬────────┐
│ System                      │ Status │
├─────────────────────────────┼────────┤
│ One Spine (TCK-* tickets)   │ ✅/⚠️/❌ │
│ Notifications per pet       │ ✅/⚠️/❌ │
│ Quick replies contract      │ ✅/⚠️/❌ │
│ Voice contract              │ ✅/⚠️/❌ │
│ Places consent gate         │ ✅/⚠️/❌ │
│ Pet context on tickets      │ ✅/⚠️/❌ │
└─────────────────────────────┴────────┘

KNOWN OPEN BUGS (Top 5):
1. [bug description]
2. [bug description]
3. [bug description]
4. [bug description]
5. [bug description]

WHAT I CHANGED THIS SESSION:
- file1.py: [reason]
- file2.jsx: [reason]

WHAT I PROVED (attach proof):
- curl: [command]
- ticket_id: [TCK-YYYY-NNNNNN]
- screenshot: [if UI]
- logs: "0 SPINE-VIOLATION"

NEXT ACTION (one thing only):
[single task]

═══════════════════════════════════════════════════════════════
```

---

# 3. NON-NEGOTIABLES GUARDRAIL LIST

Every agent must explicitly confirm they will NOT break these:

```
═══════════════════════════════════════════════════════════════
NON-NEGOTIABLES CONFIRMATION
═══════════════════════════════════════════════════════════════

I confirm I will NOT break:

☐ ONE SPINE: Any execution request → handoff_to_spine() → TCK-YYYY-NNNNNN

☐ TWO-WAY MESSAGING: Chat asks; Services executes & replies
   - Replies do NOT happen in Chat
   - Replies do NOT happen in notification cards
   - Replies ONLY happen in Services thread

☐ LOCATION CONSENT GATE: "near me" → clarify + consent chip BEFORE geolocation

☐ VOICE CONTRACT: 
   - No banned openers (no "Certainly!", "Of course!", "Absolutely!")
   - Mode-specific emotional register
   - Health-First Safety Rule

☐ QUICK REPLIES CONTRACT:
   - 3–6 chips maximum
   - Deterministic (backend controls, not LLM)
   - Consent chips when needed

☐ OWNERSHIP CONTRACT:
   - Ticket belongs to member if: member.email OR member.id OR parent_id
   - Every ticket MUST have pet_id and pet_name

☐ NOTIFICATION CONTRACT:
   - Every notification MUST have ticket_id
   - Every notification MUST have pet_id
   - Tap → Services → specific thread (NOT Concierge tab)

If ANY change touches these, I MUST run the regression suite FIRST.

═══════════════════════════════════════════════════════════════
```

---

# 4. PROOF STANDARD (No "Done" Without Proof)

## For Ticket Changes

**Required proof:**
```bash
# 1. curl request that creates/modifies ticket
curl -X POST "$API/api/mira/chat" -H "Authorization: Bearer $TOKEN" \
  -d '{"message": "...", "pet_context": {...}}'

# 2. Returned TCK-* ID
{"ticket_id": "TCK-2026-000042", ...}

# 3. Verify pillar + category
db.mira_tickets.findOne({ticket_id: "TCK-2026-000042"}, {pillar: 1, category: 1})

# 4. Confirm appears in Services
GET /api/mira/tickets → contains ticket_id

# 5. Zero SPINE-VIOLATION logs
grep "SPINE-VIOLATION" /var/log/supervisor/backend.err.log
# Expected: (empty)
```

## For Notification Changes

**Required proof:**
```bash
# 1. member_notifications record created
db.member_notifications.findOne({ticket_id: "TCK-..."})
# Must have: ticket_id, pet_id, user_email, read

# 2. Bell badge increments
GET /api/member/notifications/inbox/{email}
# Returns: unread > 0

# 3. Tap notification deep-links correctly
# Notification click → /mira-demo?tab=services&ticket=TCK-...
```

## For UI Changes

**Required proof:**
- Screenshot showing the change
- Console logs (no errors)
- Specific element visible with correct copy

---

# 5. NEXT AGENT TASK (Single Focus)

At the END of every session, paste this:

```
═══════════════════════════════════════════════════════════════
NEXT AGENT TASK (Single Focus)
═══════════════════════════════════════════════════════════════

GOAL: [One sentence describing the task]

EXACT FILE(S):
- /app/backend/xxx.py
- /app/frontend/src/xxx.jsx

EXACT ENDPOINT(S) / UI PATH:
- POST /api/xxx
- /mira-demo → Tab → Component

HOW TO TEST:
```bash
curl -X POST "$API/api/xxx" ...
# Expected: {"ticket_id": "TCK-..."}
```

WHAT NOT TO CHANGE:
- Do NOT modify handoff_to_spine()
- Do NOT change notification deep-link behavior
- Do NOT remove pet_id from tickets

═══════════════════════════════════════════════════════════════
```

**Rule: No multiple priorities. One baton.**

---

# 6. MID-TASK HANDOVER (If Agent Switch Happens)

If you are switched out mid-task, immediately leave this block:

```
═══════════════════════════════════════════════════════════════
MID-TASK HANDOVER
═══════════════════════════════════════════════════════════════

I WAS IN THE MIDDLE OF:
[Describe the task]

LAST COMMAND RUN:
[Exact command or code change]

CURRENT ERROR / BLOCKER:
[Error message or issue]

HYPOTHESIS:
[What you think is wrong]

NEXT STEP:
[What should be done next]

FILES MODIFIED (uncommitted):
- /app/backend/xxx.py - [what was changed]

═══════════════════════════════════════════════════════════════
```

---

# 7. REGRESSION SUITE (Run Before Touching Non-Negotiables)

If your change touches ANY non-negotiable, run this:

```bash
# 1. One Spine Check
curl -X POST "$API/api/mira/chat" -H "..." -d '{"message": "Book grooming", "pet_context": {...}}'
# Verify: TCK-* returned, pet_id present, member fields present

# 2. Notification Check
curl -X POST "$API/api/service_desk/concierge_reply" -d '{"ticket_id": "TCK-...", ...}'
# Verify: member_notifications created, bell badge increments

# 3. Services Visibility Check
# Open /mira-demo → Services tab → ticket visible → thread opens

# 4. Quick Replies Check
# Chat → trigger service flow → verify 3-6 chips returned

# 5. Zero Violations
grep -E "SPINE-VIOLATION|PET-CONTEXT-MISSING" /var/log/supervisor/backend.err.log
# Expected: (empty or 0 matches)
```

---

# 8. FILE LOCATIONS QUICK REFERENCE

| Purpose | File |
|---------|------|
| Ticket creation | `/app/backend/utils/service_ticket_spine.py` |
| Spine helper | `/app/backend/utils/spine_helper.py` |
| Concierge reply | `/app/backend/mira_service_desk.py` |
| Notifications | `/app/frontend/src/components/Mira/NotificationBell.jsx` |
| Services panel | `/app/frontend/src/components/Mira/ServicesPanel.jsx` |
| Main UI | `/app/frontend/src/pages/MiraDemoPage.jsx` |
| Help FAQs | `/app/frontend/src/components/Mira/HelpModal.jsx` |
| Onboarding | `/app/frontend/src/components/Mira/OnboardingTooltip.jsx` |

---

# 9. TEST CREDENTIALS

```
Email: dipali@clubconcierge.in
Password: test123
URL: /mira-demo?debug=1

Enriched Pets: Mystique, Lola, Meister, Bruno, Luna
```

---

# 10. THE ANCHOR (Memorize This)

> **Chat is where you ask. Services is where it gets done. Notifications simply bring you back to the thread.**

**If you break One Spine, you break the entire user experience.**

---

# DOCUMENT VERSION

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Feb 18, 2026 | Initial protocol |

---

# END OF PROTOCOL

**Every agent must follow this. No exceptions.**

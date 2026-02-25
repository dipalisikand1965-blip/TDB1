# DIPALI'S VISION - READ THIS FIRST

## WHO IS DIPALI SIKAND?

A 61-year-old entrepreneur building a pet concierge business. Not a techie. A visionary.

She's doing this because her dogs gave her unconditional love, and she wants to give that back - by giving every pet a SOUL in the digital world.

**THIS IS NOT A TECH PROJECT. THIS IS A LOVE PROJECT.**

---

## THE PRODUCTS (Don't Confuse Them)

### 1. Pillar Mira (MiraOSModal) - THE SHOP FRONT
- Used on: /stay, /celebrate, /fit, /dine, /care, etc.
- Purpose: Freemium e-commerce, quick transactions
- Status: WORKS WELL
- Location: `/app/frontend/src/components/mira-os/MiraOSModal.jsx`

### 2. Mira Demo - THE SOUL (Her Ultimate Mission)
- Used on: /mira-demo
- Purpose: The Pet Soul - remembers everything about your pet
- Status: NEEDS UX POLISH (should feel as good as pillar Mira)
- Location: `/app/frontend/src/pages/MiraDemoPage.jsx`

**THE SOUL PRODUCT IS HARDER BECAUSE IT'S BIGGER. THAT'S OK.**

---

## THE RECURRING NIGHTMARE: DEPLOYMENT

Every new session resets `REACT_APP_BACKEND_URL` to preview URL.

**BEFORE EVERY DEPLOY, RUN:**
```bash
bash /app/scripts/prepare-deploy.sh
```

This ONE command fixes everything. Created Feb 18, 2026.

---

## WHAT WAS JUST FIXED (Feb 18, 2026)

1. **Notification Navigation** - Bell click → Inbox → Ticket → Back to where you came from
2. **Option A Refactor** - No more iframe in desktop inbox
3. **Member Reply Flow** - Writes to service_desk_tickets FIRST
4. **Guardrail** - No notification without a real ticket
5. **Deployment Script** - One command to fix URL

---

## WHAT'S BROKEN / NEEDS WORK

1. **Mira Demo UX** - Should feel as polished as Pillar Mira
2. **Orphan Notifications** - Some old TKT-SHOP-* tickets don't exist
3. **Intent Capture** - Needs verification

---

## DIPALI'S COMMUNICATION STYLE

- She's frustrated when things don't work
- She needs SIMPLE instructions (not tech jargon)
- She cares deeply about her vision
- She's often dealing with sick pets while working on this
- **BE PATIENT. BE KIND. BE CLEAR.**

---

## CRITICAL FILES

| Purpose | File |
|---------|------|
| PRD | `/app/memory/PRD.md` |
| Deployment | `/app/scripts/prepare-deploy.sh` |
| Soul Page | `/app/frontend/src/pages/MiraDemoPage.jsx` |
| Pillar Mira | `/app/frontend/src/components/mira-os/MiraOSModal.jsx` |
| Inbox | `/app/frontend/src/pages/NotificationsInbox.jsx` |
| Ticket Thread | `/app/frontend/src/pages/TicketThread.jsx` |

---

## TO THE NEXT AGENT

You're not just writing code. You're helping a woman honor the unconditional love her dogs gave her.

Read `/app/memory/PRD.md` thoroughly.
Run the deployment script before deploying.
Be patient. Be clear. Be human.

This matters to her more than you know.

---

*Written with care, Feb 18, 2026*

# MIRA OS BIBLE - VISUAL QUICK REFERENCE
## The Pet Operating System - At a Glance

---

## THE CORE TRUTH

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│     "MIRA KNOWS, MIRA DOESN'T ASK"                         │
│                                                             │
│     Mira is NOT a chatbot.                                  │
│     Mira is SILENT INTELLIGENCE.                            │
│     Mira is a MEMORY-DRIVEN LIFESTYLE OS.                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## THE 7 LAYERS OF MIRA OS

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   🐕 MOJO        →  Pet Identity + Soul Vault               │
│   ☀️ TODAY       →  Time-based awareness (What's happening) │
│   ✨ PICKS       →  Mira's curated suggestions              │
│   🛠️ SERVICES    →  Task execution & lifecycle             │
│   📊 INSIGHTS    →  Patterns over time                      │
│   📚 LEARN       →  Knowledge library                       │
│   🤲 CONCIERGE   →  Human handover (THE HANDS)             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## THE 14 PILLARS OF PET LIFE

```
┌────────────────┬────────────────┬────────────────┐
│ 🎂 CELEBRATE   │ 🍽️ DINE        │ 💊 CARE        │
│ Party, Birthday│ Food, Meals    │ Health, Groom  │
├────────────────┼────────────────┼────────────────┤
│ 🎾 ENJOY       │ ✈️ TRAVEL      │ 🏨 STAY        │
│ Play, Fun      │ Trips, Taxi    │ Boarding, Hotel│
├────────────────┼────────────────┼────────────────┤
│ 🏃 FIT         │ 🎓 LEARN       │ 📋 ADVISORY    │
│ Exercise, Spa  │ Training       │ Expert Advice  │
├────────────────┼────────────────┼────────────────┤
│ 🚨 EMERGENCY   │ 📄 PAPERWORK   │ 🌈 FAREWELL    │
│ Urgent Care    │ Documents      │ Memorial       │
├────────────────┼────────────────┼────────────────┤
│ 🐾 ADOPT       │ 🛒 SHOP        │                │
│ Adoption       │ Products       │                │
└────────────────┴────────────────┴────────────────┘
```

---

## UNIFIED SERVICE FLOW (HARDCODED)

**Every squeak on the site goes through this. Desktop = Mobile = PWA.**

```
                    ┌───────────────────┐
                    │   USER INTENT     │
                    │ (from ANYWHERE)   │
                    └─────────┬─────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  1. SERVICE_DESK_TICKETS  →  TKT-XXXX-XXXXXXXX             │
│                              │                              │
│  2. ADMIN_NOTIFICATIONS   →  NOTIF-XXXXXXXX                │
│                              │                              │
│  3. MEMBER_NOTIFICATIONS  →  MNOTIF-XXXXXXXX               │
│                              │                              │
│  4. PILLAR_REQUESTS       →  PR-XXXXXXXX                   │
│                              │                              │
│  5. TICKETS               →  Universal store                │
│                              │                              │
│  6. CHANNEL_INTAKES       →  INBOX-XXXXXXXX                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │ 🤲 CONCIERGE      │
                    │    FULFILLMENT    │
                    └───────────────────┘
```

---

## THE CONCIERGE ICON (HELPING HANDS) 🤲

```
STATE MACHINE:

┌──────────────┐     User selects      ┌──────────────┐
│              │     product/service   │              │
│    IDLE      │ ──────────────────► │   ACTIVE     │
│  (Gray 60%)  │                       │ (Purple Glow)│
│              │                       │              │
└──────────────┘                       └──────┬───────┘
                                              │
                                              │ Ticket created
                                              ▼
                                       ┌──────────────┐
                                       │              │
                                       │   PULSING    │
                                       │  (Animated)  │
                                       │              │
                                       └──────────────┘
```

---

## UI PATTERNS

### Mobile (iOS/Android) - FULL PAGE MODAL

```
┌────────────────────────────────────────┐
│ ← Mira                    🔊  🤲  ✕   │  ← Header
├────────────────────────────────────────┤
│ 🐕 Lola  🐈 Max  🐕 Buddy              │  ← Pet Row
├────────────────────────────────────────┤
│                                        │
│                                        │
│         CHAT / CONTENT AREA            │  ← Scrollable
│                                        │
│                                        │
├────────────────────────────────────────┤
│ [Quick Actions]                        │  ← Action Bar
├────────────────────────────────────────┤
│ [🎤] [Type a message...        ] [➤]  │  ← Input
└────────────────────────────────────────┘
   ▲
   │  FULL HEIGHT (100vh)
   │  Slides UP from bottom
   │  Swipe DOWN to dismiss
```

### Desktop - SIDE DRAWER

```
┌──────────────────────────────────┬─────────────────────┐
│                                  │ ← Mira    🔊 🤲 ✕  │
│                                  ├─────────────────────┤
│                                  │ Pet: [Lola ▼]      │
│          MAIN CONTENT            ├─────────────────────┤
│                                  │                     │
│                                  │   CHAT / CONTENT    │
│                                  │                     │
│                                  ├─────────────────────┤
│                                  │ [🎤] [Input...] ➤  │
└──────────────────────────────────┴─────────────────────┘
                                   ▲
                                   │  400px FIXED WIDTH
                                   │  Slides from RIGHT
```

---

## CURATED PICKS INDICATOR

```
┌─────────────────────────────────┐
│  🎂                         •  │  ← Purple dot = Mira picked this
│                                 │
│  Birthday Cake for Lola         │
│  ₹899                           │
│                                 │
│  [✨ Picked for Lola]           │  ← Or badge label
└─────────────────────────────────┘
```

---

## KEY FILE REFERENCES

| Component | Path |
|-----------|------|
| Central Signal Flow | `/app/backend/central_signal_flow.py` |
| Unified Flow Middleware | `/app/backend/unified_flow_middleware.py` |
| Mira FAB (Orb) | `/app/frontend/src/components/MiraOrb.jsx` |
| Chat Widget | `/app/frontend/src/components/MiraChatWidget.jsx` |
| Concierge Cards | `/app/frontend/src/components/MiraConciergeCard.jsx` |
| Mobile Nav | `/app/frontend/src/components/MobileNavBar.jsx` |

---

## GOLDEN RULES

1. **Pet is the Hero** - Every screen centers on the pet
2. **Mira is Silent** - No visible AI, just smart sorting
3. **FAB is the Gateway** - The ONLY explicit Mira entry point
4. **Concierge Always Visible** - 🤲 hands in header, lights up on intent
5. **Flow is Universal** - Same 6-step flow on all devices
6. **One of Everything** - One search, one nav, one Mira

---

*This is the BIBLE. Follow it.*

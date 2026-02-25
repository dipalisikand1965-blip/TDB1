# MIRA DOCTRINE INDEX
## Complete Documentation for MIRA OS

---

## 📚 DOCTRINE FILES

| File | Purpose | Priority |
|------|---------|----------|
| **MIRA_DOCTRINE.md** | Core philosophy, voice, principles | P0 - Must Read |
| **MIRA_MODE_SYSTEM.md** | 9 conversation modes (PLAN, BOOK, EXPLORE, etc.) | P0 - Must Read |
| **MIRA_SPEED_DOCTRINE.md** | Typing speed, voice speed, sync rules | P0 - Must Read |
| **MIRA_UNIVERSAL_RULES.md** | 5-step flow, never-do list | P1 - Important |
| **MIRA_ENHANCEMENTS.md** | 40+ feature roadmap | P1 - Reference |
| **MOBILE_SPECS.md** | Responsive design specs | P2 - Implementation |
| **DATA_SYNC_ARCHITECTURE.md** | Admin → Mira sync | P2 - Technical |

---

## 🎯 QUICK REFERENCE

### The 5-Step Flow
1. **LISTEN** - Detect intent, entities, emotion
2. **ACKNOWLEDGE** - Reflect back, use pet's name
3. **CLARIFY** - Ask 1-2 questions (if needed)
4. **RECOMMEND** - Show picks (only after alignment)
5. **OFFER PATH** - Always provide next steps

### The 9 Modes
| Category | Modes | Behavior |
|----------|-------|----------|
| 🔨 DOING | PLAN, BOOK, EXECUTE | Clarify-first |
| 🧠 THINKING | EXPLORE, FIND, ADVISE, REMEMBER | Answer-first |
| 💜 EMOTIONAL | COMFORT, EMERGENCY | Presence-first |

### Speed Specs
| Mode | Typing | Voice |
|------|--------|-------|
| Normal | 30-45 chars/sec | 160-180 wpm |
| Comfort | 15-25 chars/sec | 130-150 wpm |
| Emergency | 25-35 chars/sec | 150-165 wpm |

---

## 🚫 ABSOLUTE RULES (Never Violate)

1. **PLAN/BOOK/EXECUTE** → Clarify-first, NO products in first turn
2. **COMFORT** → NO products, NO fixing, pure presence
3. **EMERGENCY** → Vet-first, NO shopping
4. **Voice ON** → Auto-speak unless muted
5. **First response** → < 800ms or show loader

---

## 📁 FILE LOCATIONS

```
/app/memory/
├── MIRA_DOCTRINE.md           # Core philosophy
├── MIRA_MODE_SYSTEM.md        # 9 modes
├── MIRA_SPEED_DOCTRINE.md     # Timing & speed
├── MIRA_UNIVERSAL_RULES.md    # Flow rules
├── MIRA_ENHANCEMENTS.md       # Feature roadmap
├── MOBILE_SPECS.md            # Responsive specs
├── DATA_SYNC_ARCHITECTURE.md  # Sync architecture
├── PRD.md                     # Product requirements
├── ROADMAP.md                 # Implementation roadmap
└── UNIFIED_SERVICE_FLOW.md    # Ticket flow
```

---

## 🔄 HANDOVER CHECKLIST

When handing over to a new agent:

- [ ] Read MIRA_DOCTRINE.md first
- [ ] Understand 9 modes in MIRA_MODE_SYSTEM.md
- [ ] Review speed specs in MIRA_SPEED_DOCTRINE.md
- [ ] Check current roadmap in ROADMAP.md
- [ ] Review test credentials in PRD.md

---

## 🚀 DEPLOYMENT CHECKLIST

Before deploying:

- [ ] All 9 modes implemented in backend
- [ ] `clarify_only` flag working
- [ ] Voice personalities configured (8 emotions)
- [ ] Typing animation speed per mode
- [ ] First response < 800ms verified
- [ ] Loader shows after 2s verified
- [ ] Comfort mode has NO products
- [ ] Emergency mode goes vet-first

---

*Last Updated: February 8, 2026*

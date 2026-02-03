# The Doggy Company - Product Requirements Document

## Original Problem Statement
Build "The Doggy Company," a one-stop-shop concierge for dog parents. This involves fixing numerous UI/UX bugs, restoring major features that were lost in a regression, and implementing a suite of new features.

## Core Requirements

### 1. Unified Flow Architecture
All user actions (service requests, onboarding, etc.) must adhere to a unified flow:
`User Request → Service Desk Ticket → Admin Notification → Member Notification`

### 2. Member Dashboard
- Gamified Soul Score with badges and points
- Multi-pet selector
- Quick-action question widgets
- Responsive design for all devices

### 3. Celebrate Pillar
- Party Planning Wizard (6-step flow)
- Custom cake requests
- Birthday/Gotcha Day celebrations

## What's Been Implemented

### February 2026 - Latest Session
- ✅ iOS Voice Fix: Implemented audio context priming for ElevenLabs "Elise" voice on iOS Safari
- ✅ Care Page UI/UX Overhaul: Added staggered entrance animations to match 10/10 standard
  - Transformation Stories cards: animate-fade-in-up with stagger
  - Quick Book service buttons: animate-scale-in with stagger
  - How It Works steps: animate-fade-in-up with stagger
  - Concierge Experience cards: animate-fade-in-up with stagger
- ✅ Mobile responsiveness verified for Care page

### December 2025
- ✅ Member Dashboard restoration (multi-pet Soul Score grid)
- ✅ Soul Score calculation bug fix (alias system)
- ✅ Responsive UI/UX overhaul for Dashboard
- ✅ Unified flow for onboarding and payment verification
- ✅ Party Planning Wizard connected to CelebrateConcierePicker
- ✅ Unified flow audit verified for all key endpoints
- ✅ Celebrate, Dine, Stay, Travel pages polished to 10/10

### Key Endpoints with Unified Flow
- `/api/celebrate/party-request` - Party planning
- `/api/service-requests` - Generic service requests
- `/api/services/book` - Service booking
- `/api/custom-cakes/request` - Custom cake orders

## Page Scoring (Current State)

| Page | Score | Status |
|------|-------|--------|
| Celebrate | 9/10 | ✅ Polished |
| Dine | 9/10 | ✅ Polished |
| Stay | 9/10 | ✅ Polished |
| Travel | 9/10 | ✅ Polished |
| Care | 9/10 | ✅ Polished |
| Enjoy | TBD | Next in queue |
| Learn | TBD | Backlog |
| Fit | TBD | Backlog |

## Prioritized Backlog

### P0 - Critical
- [x] ~~Fix quick action cards in `ConversationalEntry.jsx` (should trigger service requests, not Mira AI)~~ ✅ FIXED
- [x] ~~Party Planning Wizard not appearing on Celebrate page~~ ✅ FIXED
- [x] ~~iOS voice issue for guest users~~ ✅ FIXED

### P1 - High Priority (Upcoming)
- [ ] UI/UX overhaul for Enjoy pillar page
- [ ] UI/UX overhaul for Learn pillar page
- [ ] UI/UX overhaul for Fit pillar page

### P2 - Medium Priority (Future)
- [ ] Mira Multi-Pet AI Personalization
- [ ] Membership tiers implementation
- [ ] "Pet Parent Magnet" marketing feature
- [ ] WhatsApp Notifications (blocked on Meta approval)

## Technical Architecture

```
/app
├── backend
│   ├── server.py                   # Main API server with unified flow
│   ├── pet_score_logic.py          # Soul score calculation
│   └── soul_intelligence.py        # Pet soul intelligence
└── frontend
    ├── src
    │   ├── pages
    │   │   ├── MemberDashboard.jsx # Gamified dashboard
    │   │   ├── CelebratePage.jsx   # Celebrate pillar
    │   │   ├── CarePage.jsx        # Care pillar (enhanced with animations)
    │   │   └── UnifiedPetPage.jsx  # Pet profile
    │   ├── components
    │   │   ├── MiraAI.jsx          # AI assistant with iOS voice fix
    │   │   ├── PartyPlanningWizard.jsx   # 6-step wizard
    │   │   ├── CelebrateConcierePicker.jsx # Quick planner
    │   │   └── SoulScoreArc.jsx          # Score display
```

## 3rd Party Integrations
- **OpenAI GPT-4o**: Mira AI (Emergent LLM Key)
- **ElevenLabs TTS**: Voice synthesis ("Elise" voice - EST9Ui6982FZPSi7gCHi)
- **Razorpay**: Payments
- **Resend**: Transactional emails
- **WhatsApp**: Notifications (pending Meta approval)

## Test Credentials
- Admin: `aditya` / `lola4304`
- Test User: `dipali@clubconcierge.in` / `lola4304`

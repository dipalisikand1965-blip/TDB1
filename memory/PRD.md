# Mira Pet OS - Product Requirements Document (SSOT)
## Single Source of Truth - Last Updated: February 23, 2026

---

## ORIGINAL PROBLEM STATEMENT

**Mira** is a "pet operating system" centered around **Soul Intelligence** (a pet personality system) and an AI concierge. The goal is to move beyond standard e-commerce and create a high-touch, personalized experience where curated recommendations for products and services are dynamically generated based on a pet's unique soul profile.

**Core Vision**: "Mira is the Soul, the Concierge controls the experience, and the System is the capillary enabler."

**Key Principle**: Every concierge action must create a service desk ticket and trigger real-time notifications, capturing user intent and enabling a premium, consultative service model.

**Voice Configuration**: ElevenLabs Eloise (British English) with OpenAI TTS backup

---

## ✅ WHAT'S ALREADY BUILT

### CORE PLATFORM
| Feature | Status | Files |
|---------|--------|-------|
| Soul Intelligence System | ✅ COMPLETE | `canonical_answers.py`, `pet_score_logic.py` |
| Soul Score Engine (0-100%) | ✅ COMPLETE | `soul_first_logic.py` |
| Cross-pillar Memory | ✅ COMPLETE | `MiraChatWidget.jsx` |
| Multi-Pet Support | ✅ COMPLETE | `server.py` |

### MIRA AI ASSISTANT
| Feature | Status | Files |
|---------|--------|-------|
| Mira Chat Widget | ✅ COMPLETE | `MiraChatWidget.jsx` |
| Mira = Soul Mate Identity | ✅ COMPLETE | `MiraChatWidget.jsx` |
| Voice Input (ElevenLabs) | ✅ COMPLETE | `mira_voice.py` |
| Voice Output (TTS) | ✅ COMPLETE | `tts_routes.py` |
| Picks → Chat Flow | ✅ COMPLETE | `PersonalizedPicksPanel.jsx` |
| Soul-First Intelligence | ✅ COMPLETE | `mira_intelligence.py` |
| Quick Actions | ✅ COMPLETE | `MiraChatWidget.jsx` |

### REMINDER & NOTIFICATION SYSTEM
| Feature | Status | Files |
|---------|--------|-------|
| **Birthday Engine** | ✅ COMPLETE | `birthday_engine.py` |
| **Celebration Reminders** | ✅ COMPLETE | `server.py` (line 376+) |
| **Pet Pass Renewal Reminders** | ✅ COMPLETE | `renewal_reminders.py` |
| **Abandoned Cart Reminders** | ✅ COMPLETE | `cart_routes.py` |
| **Proactive Notifications** | ✅ COMPLETE | `proactive_notifications.py`, `mira_proactive.py` |
| **Push Notifications** | ✅ COMPLETE | `push_notification_routes.py` |
| **Notification Engine** | ✅ COMPLETE | `notification_engine.py` |
| **Realtime Notifications** | ✅ COMPLETE | `realtime_notifications.py` |
| **Mira Notifications** | ✅ COMPLETE | `mira_notifications.py` |

### SERVICE DESK & TICKETS
| Feature | Status | Files |
|---------|--------|-------|
| Universal Service Command | ✅ COMPLETE | `useUniversalServiceCommand.js` |
| Ticket Creation API | ✅ COMPLETE | `ticket_routes.py` |
| Ticket Intelligence | ✅ COMPLETE | `ticket_intelligence.py` |
| Admin Ticket Management | ✅ COMPLETE | Admin Dashboard |

### 13 PILLARS
| Pillar | Status | Route File |
|--------|--------|------------|
| Dine | ✅ GOLD STANDARD | `dine_routes.py` |
| Celebrate | ✅ GOLD STANDARD | `celebrate_routes.py` |
| Care | ✅ BUILT | `care_routes.py` |
| Stay | ✅ BUILT | `stay_routes.py` |
| Travel | ✅ BUILT | `travel_routes.py` |
| Learn | ✅ BUILT | `learn_os_routes.py` |
| Shop | ✅ BUILT | `shop_routes.py` |
| Play | ✅ BUILT | Backend |
| Adopt | ✅ BUILT | `adopt_routes.py` |
| Fit | ✅ BUILT | `fit_routes.py` |
| Enjoy | ✅ BUILT | `enjoy_routes.py` |
| Farewell | ✅ BUILT | `farewell_routes.py` |
| Emergency | ✅ BUILT | `emergency_routes.py` |

### ADMIN SYSTEM
| Feature | Status | Location |
|---------|--------|----------|
| Dashboard | ✅ COMPLETE | `/admin` |
| Members & Pets | ✅ COMPLETE | Admin |
| Reminders Management | ✅ COMPLETE | Admin > Mira & AI > Reminders |
| Communications | ✅ COMPLETE | Admin > Mira & AI > Communications |
| Proactive Campaigns | ✅ COMPLETE | Admin > Marketing > Proactive |
| Push Notifications | ✅ COMPLETE | Admin > Marketing > Push |

### UI/UX
| Feature | Status | Files |
|---------|--------|-------|
| Gold Standard Design | ✅ COMPLETE | `gold-standard.css` |
| Glassmorphism | ✅ COMPLETE | CSS |
| Bento Grid | ✅ COMPLETE | CSS |
| Haptic Feedback | ✅ COMPLETE | JS |

---

## CURRENT SESSION WORK (Feb 23, 2026)

### COMPLETED TODAY
| Task | Status |
|------|--------|
| /join Onboarding Bug | ✅ FIXED |
| Duplicate Soul Questions | ✅ FIXED |
| Picks → Chat Flow | ✅ FIXED |
| Mira = Soul Mate Identity | ✅ FIXED |
| Cross-Pillar Memory | ✅ DONE |
| Error Messages | ✅ FIXED |
| Backend pet_age Bug | ✅ FIXED |
| Comprehensive Audit | ✅ DONE |
| Full Roadmap | ✅ DONE |

---

## 🔴 P0 - NEXT PRIORITIES

| Task | Description | Already Have |
|------|-------------|--------------|
| Birthday Countdown on Dashboard | Show countdown widget | `birthday_engine.py` ready |
| Allergy Filter on Dine | Auto-filter by soul allergies | Soul data available |
| Connect Birthday Engine to UI | Surface existing backend to frontend | API exists |

---

## 🟠 P1 - IMPORTANT

| Task | Description |
|------|-------------|
| YouTube Videos (Celebrate/Dine) | Training/celebration content |
| Surface Reminders to Dashboard | Show upcoming reminders from backend |
| Grooming Scheduling UI | Connect to Care pillar |

---

## 🟡 P2 - ENHANCEMENT

| Task | Description |
|------|-------------|
| User-facing Analytics | "Mystique's favorites" |
| Activity Timeline | Pet activity log |
| Food Diary | Meal tracking |

---

## 🔵 P3 - BACKLOG

| Task | Description |
|------|-------------|
| Razorpay Checkout | Payment integration |
| Voice Commands | "Hey Mira" wake word |
| Calendar Sync | Google/Apple |

---

## INTEGRATIONS

### Active ✅
- OpenAI GPT (Mira AI)
- Google Places API (Restaurants)
- MongoDB (Database)
- Cloudinary (Images)
- ElevenLabs (Voice TTS)
- OpenAI TTS (Backup)

### Pending Config ⚠️
- Resend (Domain verification needed)
- Gupshup (WhatsApp config needed)

### Planned 📋
- Razorpay
- YouTube API
- Google Calendar

---

## KEY API ENDPOINTS

### Birthday/Reminders
```
GET  /api/birthday-engine/upcoming     - Get upcoming celebrations
GET  /api/birthday-engine/stats        - Birthday statistics
POST /api/birthday-engine/send-promotion/{pet_id}
POST /api/birthday-engine/send-bulk
```

### Proactive Notifications
```
GET  /api/mira/proactive/triggers
POST /api/mira/proactive/send
```

### Service Desk
```
POST /api/service-requests             - Create ticket
GET  /api/service-requests             - List tickets
```

---

## TEST CREDENTIALS

- **Member**: dipali@clubconcierge.in / test123
- **Admin**: aditya / lola4304

---

## DOCUMENTS

- `/app/memory/PRD.md` - This file (SSOT)
- `/app/memory/ROADMAP.md` - Full roadmap
- `/app/memory/AUDIT.md` - Feature audit
- `/app/memory/GAPS_AUDIT.md` - Gap analysis

---

*Mira is the Soul. The pet's soul grows with every interaction.* 🐾

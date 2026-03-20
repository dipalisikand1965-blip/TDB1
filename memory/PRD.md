# The Doggy Company® — Pet Life Operating System
## Product Requirements Document — MASTER
## Last Updated: Mar 20, 2026 (Session 85 — Universal Concierge Flow Complete, Daily Digest, Soul Chapter Pills, ₹2,999 Membership)

---

## PRODUCT VISION
The Doggy Company's Pet Life Operating System (PLOS) is a pillar-based platform where each of 12 pillars (DINE, CARE, GO, CELEBRATE, LEARN, SHOP, SERVICES, PAPERWORK, EMERGENCY, ADOPT, FAREWELL, PLAY) is a fully personalised experience for a named dog, powered by Mira — the AI concierge who knows every dog by name, breed, size, health and soul. Every product recommendation, every guided path, every service booking is filtered through Mira's knowledge of the pet.

**Core Philosophy**: PET FIRST, BREED NEXT. The soul profile is the dog's operating system. Every pillar reads from it and personalises everything.

**Canonical Rule**: Every user intent → enriched service desk ticket → admin bell notification → member /my-requests inbox. No exceptions.

---

## APPLICATION ARCHITECTURE

### Tech Stack
- **Frontend**: React 18, Tailwind CSS, Framer Motion, Lucide-React icons, Shadcn/UI components
- **Backend**: FastAPI (Python), MongoDB, LiteLLM (Claude Sonnet via Emergent LLM Key)
- **Services**: Google Places API, OpenAI DALL-E (Emergent LLM Key), Razorpay, Cloudinary, WhatsApp Business API
- **Hosting**: Kubernetes container (Emergent platform)

### URL Structure
- Frontend: `https://intent-ticket-flow.preview.emergentagent.com`
- Backend: Port 8001, all API routes prefixed with `/api`

### Credentials
- **User test**: `dipali@clubconcierge.in` / `test123`
- **Admin**: `aditya` / `lola4304`

---

## COMPLETED FEATURES (as of Mar 20, 2026)

### Platform Architecture
- ✅ 12 pillar pages live: Care, Dine, Go, Play, Learn, Shop, Services, Paperwork, Emergency, Adopt, Farewell, Celebrate
- ✅ Multi-pet onboarding: MiraMeetsYourPet.jsx + PetSoulOnboarding.jsx (10-step soul builder)
- ✅ PetHomePage.jsx — soul ring, score display, 6 clickable chapter pills
- ✅ Smart breed search with fuzzy matching in onboarding
- ✅ `/soul` endpoint: `GET /api/pets/{pet_id}/soul` — returns overall_score, answered_count, chapters
- ✅ Navbar: consistent across all pillar pages, pillar links centered, cart/user on right

### Universal Intent-to-Ticket Flow (THE CANONICAL RULE)
- ✅ `tdc_intent.js` — single utility: tdc.book(), tdc.view(), tdc.chat(), tdc.urgent(), tdc.imagine(), tdc.nearme(), tdc.request(), tdc.visit(), tdc.cart(), tdc.order(), tdc.track()
- ✅ `MiraCardActions.js` — bookViaConcierge() + guidedPathComplete() canonical functions
- ✅ ALL 12 pillar pages wired with usePlatformTracking (visit tracking)
- ✅ ALL 6 pillar concierge modals fixed: CareConciergeModal, DineConciergeModal, DineConciergeIntakeModal, PlayConciergeModal, GoConciergeModal, CelebrateIntakeModal
- ✅ ALL guided path completions wired: Play, Learn, Go, Celebrate, Dine/Nutrition, Adopt, Farewell, Paperwork, Emergency, Care
- ✅ ProductModal.jsx — tdc.book() on every booking CTA
- ✅ MiraImaginesBreed.jsx — tdc.imagine() on "Source this for me"
- ✅ MiraChatWidget.jsx — tdc.chat() after every assistant reply
- ✅ CartSidebar — tdc.cart() on "Add" recommendations
- ✅ UnifiedCheckout — tdc.order() on payment success
- ✅ GuidedCarePaths, GuidedPlayPaths, GuidedGoPaths, GuidedLearnPaths, GuidedCelebrationPaths, GuidedNutritionPaths, GuidedAdoptPaths, GuidedFarewellPaths, GuidedPaperworkPaths, GuidedEmergencyPaths — all wired

### Admin Inbox
- ✅ Every ticket has Mira's enriched briefing (pet soul data)
- ✅ Ticket subjects: "{ServiceName} for {PetName}" — no more "Request received"
- ✅ Urgency levels: emergency=🚨, high=🟠, medium=🟡, low=⚪
- ✅ Admin notifications bell
- ✅ `POST /api/admin/send-digest` — manual trigger for morning digest
- ✅ `POST /api/admin/send-digest/preview` — preview without sending
- ✅ Daily digest auto-runs at 8am IST (APScheduler, CronTrigger)

### Mira Intelligence
- ✅ Context retention rule in system prompt — holds intent across messages
- ✅ Farewell escalation rule — grief keywords trigger gentle handoff + concierge notification
- ✅ Grief keyword detection in MiraChatWidget.jsx + MiraDemoPage.jsx — fires tdc.track("farewell_detected") before Mira responds
- ✅ CartSidebar smart recommendations — breed-safe + allergen-filtered from /api/mira/claude-picks/{petId}
- ✅ ProductModal shows AI-scored products per pet

### Membership & Pricing
- ✅ Annual membership: ₹2,999/year (corrected from ₹2,499)
- ✅ Monthly: ₹250/month
- ✅ Razorpay amounts updated: 299900 paise (₹2,999) annual, 25000 paise (₹250) monthly
- ✅ MEMBERSHIP_PLANS in server.py updated
- ✅ membership_routes.py updated

### Bug Fixes
- ✅ Celebrate category modal — createPortal fix (no more grey overlay)
- ✅ /api/concierge/*-intake 404 — replaced with canonical attach_or_create_ticket
- ✅ /api/concierge/*-booking 404 — 6 PlaySoulPage + 8 GoSoulPage inline forms fixed
- ✅ life_state validation — all tdc calls include "PLAN" field
- ✅ Urgency propagation — emergency tickets show as URGENT in admin
- ✅ pet prop drilling in GuidedCarePaths

---

## P1 — Next Sprint
- **Update Static Pages**: Apply new standard Navbar to `/about`, `/membership`, `/faqs` (files attached by user — deploy when ready)
- **FAQs**: Remove "Stay" category
- **SMTP setup**: Set SMTP_USER + SMTP_PASS in backend/.env to enable actual email delivery for daily digest
- **Razorpay webhook → ticket**: Wire payment success webhook to create `order_placed` ticket
- **Card → Modal wiring**: MODAL_INSTRUCTIONS.md — every product card tap opens ProductModal
- **Mira Streaming**: Switch MiraChatWidget to use `/api/mira/os/stream` for token-by-token

## P2 — Future
- **Love pillar** — /love route
- **Mira DemoPage refactor** (5,400+ lines)
- **Performance** — loading skeletons, pagination (PERFORMANCE_INSTRUCTIONS.md)
- **Dine MiraImaginesCard** — switch to shared MiraImaginesBreed component

---

## KEY ENDPOINTS (Reference)

| Endpoint | Method | Purpose |
|---|---|---|
| /api/auth/login | POST | Member login |
| /api/admin/login | POST | Admin login |
| /api/pets/my-pets | GET | Get user's pets |
| /api/pets/{pet_id}/soul | GET | Soul score + chapters |
| /api/mira/claude-picks/{pet_id} | GET | AI-scored product picks |
| /api/service_desk/attach_or_create_ticket | POST | Create intent ticket |
| /api/membership/plans | GET | Get membership plans |
| /api/admin/send-digest | POST | Trigger morning digest |
| /api/admin/send-digest/preview | POST | Preview digest (dry-run) |

## KEY DATA MODELS

### service_desk_tickets
```
ticket_id, parent_id, pet_id, pillar, intent_primary, channel,
life_state, urgency, status, subject, initial_message,
mira_briefing, created_at, updated_at
```

### pets
```
id, name, breed, weight, age, overall_score, doggy_soul_answers,
doggy_soul_meta, photo_url
```

### membership_plans (hardcoded in membership_routes.py)
```
essential: ₹2,999/year | essential_monthly: ₹250/month
```

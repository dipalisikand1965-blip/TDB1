# The Doggy Company - Product Requirements Document

## Original Problem Statement
Build "The Doggy Company," a one-stop-shop concierge for dog parents with a focus on emotional connection and the "Pet Soul™" concept. Transform the site from a functional pet services marketplace into an emotionally resonant "Pet Life Operating System."

## Core Philosophy
- **We Celebrate Life** - Through every moment, joyful or challenging, we see celebration
- **Mira interprets lives** - Memory and judgement layer, not a request fulfiller
- **Brain vs Hand** - Mira is the brain, Concierge® is the hand. One understands life, the other moves the world

---

## PROJECT HEALTH SCORE: 9.0/10

### What's Working Well (Green)
- ✅ Core membership onboarding flow
- ✅ Pet Soul™ profiles and Pet Pass cards
- ✅ Mira AI with conversational memory
- ✅ All 14 pillars of service
- ✅ Dashboard with 15 tabs (fully functional)
- ✅ Service desk with ticket merging
- ✅ Brand story video with ElevenLabs voiceover
- ✅ Mobile-first responsive design
- ✅ Razorpay payment integration (test mode)
- ✅ **Finance Manager** - Full reconciliation system
- ✅ **Product Box** - Enhanced with stats, filters, testids
- ✅ **Service Box** - Enhanced with views, provider tracking

### Needs Attention (Yellow)
- ⚠️ Pet photo upload (backend works, frontend needs e2e testing)
- ⚠️ Voice input on iOS (needs text input fallback)
- ⚠️ Pet photos in Brand Story video (pending implementation)

### Known Issues (Red)
- 🔴 None currently blocking

---

## SESSION 6 SUMMARY (February 5, 2026)

### Completed Today - Pet Operating System Non-Member Landing Page:

#### 1. Non-Member Landing Page Copy Rewrite (10/10)
- ✅ **Headline**: Changed from "Members-Only Experience" to "Personalised for Your Pet"
- ✅ **Micro-line**: Added "No spam. No upselling. Just thoughtful care."
- ✅ **Supporting line**: Now explains WHY Mira needs context, not just THAT access is gated
- ✅ **Primary CTA**: Changed "Join Pet Pass" to "Set up your pet with Mira" with "Takes about 2 minutes. You can change this anytime." subtext
- ✅ **Secondary CTA**: Changed "Sign In" to "Continue with your pet profile"
- ✅ **Benefits heading**: Changed from "What Pet Pass members get:" to "Once Mira knows your pet, you'll notice:"
- ✅ **Benefits bullets**: Rewritten as outcomes, not perks (sensitivities, life stage, memory, human help)
- ✅ **Grounding line**: Added "You can explore freely — Mira simply helps make things easier."
- ✅ **Privacy line**: Added "Your pet's information is used only to improve care. Never shared."

#### 2. Micro-Copy Refinements (Precision Polish)
- ✅ "past care" → "care history" (more considered)
- ✅ "right" → "appropriate" (safer, more responsible)
- ✅ Added comma in "Quiet access to human help, when you need it" (softer)
- ✅ "most pet parents" → "many pet parents" (avoids social pressure)
- ✅ Removed arrow from "Let Mira handle the arrangements" (suggestion, not conversion action)
- ✅ Softened Mira's note visual contrast (whisper, not callout)

#### 3. Member Experience UX Enhancements
- ✅ Added "✓ Applied for Bruno" indicator above filters
- ✅ Added info tooltip on results line: "Based on Bruno's profile and this occasion"
- ✅ Added tooltip on green checkmark: "Recommended for Bruno"
- ✅ Added Mira nudge popup after 2+ items: "You've picked some lovely things for Bruno. Would you like me to coordinate delivery timing?"

#### 4. Pillar-Specific Support Filters (Experience Orchestration)
- ✅ **Rule implemented**: Support filters must mirror the emotional state of the page
- ✅ **Birthday/Celebrate filters**: Celebration-safe, Birthday treats, Breed-appropriate, Allergy-aware, Calm moments, Extra care
- ✅ **Travel filters**: Travel-friendly, Journey calm, Safe snacking, Hydration help, Easy to pack
- ✅ **Care filters**: Full health catalogue (Sensitive tummy, Skin & coat, Weight, Joints, Dental, Calming, Recovery, Allergy-friendly)
- ✅ **Dine filters**: Gentle meals, Portion perfect, Limited ingredient, Nourishing, Senior-friendly
- ✅ **Fit filters**: Energy boost, Joint support, Lean & fit, Post-activity, Hydration
- ✅ **Emergency filters**: Recovery support, Easy digest, Stress relief, Hydration
- ✅ **Farewell filters**: Comfort care, Easy on tummy, Peaceful, Favorite treats
- ✅ **Stay filters**: Settling in, Routine-friendly, Safe options, Home comforts
- ✅ **Auto-applied filters**: Mira intelligently applies filters based on pet profile (allergies → Allergy-aware, anxiety → Calm moments, etc.)
- ✅ **Visual indicators**: "Auto" badge on auto-applied filters, green highlight for Mira-applied filters

#### 5. Complete Filter UI/UX Redesign (Mobile + Desktop)

**Mobile (Bottom Sheet)**
- ✅ Full-width stacked cards (not 2-column grid)
- ✅ Minimum 64px height touch targets
- ✅ Bottom sheet opens at 70% height
- ✅ Swipe-down handle to dismiss
- ✅ "Apply" and "Reset to Bruno" footer actions
- ✅ Inline auto-applied badges: "applied for Bruno"
- ✅ Active scale animation on tap (0.98)
- ✅ Summary chips in trigger bar showing applied filters

**Desktop**
- ✅ Single column vertical stack (not grid)
- ✅ Hover reveal for subtext
- ✅ Sticky filter bar after first scroll
- ✅ Clickable chip row for applied filters with X to remove
- ✅ "Reset to Bruno" clear action

**Unified Shop Behavior**
- ✅ Health/sensitivity filters persist across pillars (sensitive-stomach, allergy-friendly, calming, recovery)
- ✅ Occasion-specific filters reset when leaving pillar
- ✅ Soft transition toast: "Switching to [pillar] mode for Bruno. Adjusting recommendations."
- ✅ Toast shows once per session (ref-tracked)

**Internal Rule Implemented:**
> Filters are not controls. They are reassurance tools.
> If a filter ever feels like work, it's wrong.

#### 6. Navigation Update
- ✅ Changed "SERVICES" to "CARE" in bottom mobile navigation bar to align with Pet OS philosophy

#### 5. Test User & Pet Created
- ✅ Created test@test.com/test user account
- ✅ Created Bruno (Golden Retriever, 3yo, 25kg) pet profile

---

## SESSION 5 SUMMARY (February 5, 2026)

### Completed (Part 2 - Bug Fixes):

#### 4. Footer Services Section Added
- ✅ Added "SERVICES" column to desktop footer (Grooming, Training, Boarding, Daycare, Vet Care, Dog Walking, Pet Photography)
- ✅ Added collapsible "Services" section to mobile footer

#### 5. Occasion Box Birthday Page Verified
- ✅ Images ARE seeded correctly - 78 products (cake: 20, accessories: 20, treats: 20, toys: 18)
- ✅ Products display with images on /occasion-box/birthday

#### 6. Finance Manager Verified
- ✅ Works correctly in preview environment
- ✅ Stats cards, date filters, Record Payment, Import CSV all functional
- Production "Oops" may need cache clear after deployment

#### 7. Service Box Mobile/Desktop UI Verified
- ✅ Desktop: Clean stats cards, pillar filters, view toggles
- ✅ Mobile: Responsive layout, dropdown navigation works

### Completed Today (Part 1):

#### 1. Finance Manager Bug Fixes (Testing Agent)
- ✅ Fixed critical JS error: `dateFilteredPayments` not initialized
- ✅ Added missing Record Payment button with modal
- ✅ Added missing Import CSV button with file input
- ✅ All 14 backend API tests passed
- ✅ Full frontend UI verification via Playwright

#### 2. Product Box Enhancement (10/10)
- ✅ Enhanced stats cards with icons (8 cards: Total, Active, Rewards, Mira, Suggest, Draft, Low Stock, Sold)
- ✅ Added pillar quick filter buttons
- ✅ Added Stock column with low stock indicators
- ✅ Added all data-testids for testing
- ✅ Improved button styling and responsiveness

#### 3. Service Box Enhancement (10/10) 
- ✅ Complete rewrite with improved architecture
- ✅ Added view toggles: List / Grid / Calendar
- ✅ Enhanced stats cards with icons (8 cards: Total, Active, Bookable, Free, Consult, 24x7, Bookings, Providers)
- ✅ Added all 14 pillar quick filter buttons
- ✅ Added Provider column in table
- ✅ Enhanced editor with 4 tabs: Basic Info, Pricing, Provider, Availability
- ✅ Added service provider tracking fields (name, phone, email)
- ✅ Added service analytics display (bookings, rating, completion rate)
- ✅ Grid view with service cards
- ✅ All data-testids for testing

---

## ADMIN PANEL AUDIT STATUS

| Component | Score | Status |
|-----------|-------|--------|
| Finance Manager | 9/10 | ✅ Enhanced with full reconciliation |
| Product Box | 9/10 | ✅ Enhanced with stats, filters |
| Service Box | 9/10 | ✅ Enhanced with views, provider tracking |
| Service Desk | 7.5/10 | Pending - Needs SLA, canned responses |
| Member Directory | 7/10 | Pending - Needs 360 view, LTV |
| Mira Prompts | 8.5/10 | Pending - Needs prompt editor UI |

---

## UPCOMING TASKS

### P0 - High Priority
1. ~~Finance Manager testing~~ ✅ DONE
2. ~~Product Box enhancement~~ ✅ DONE
3. ~~Service Box enhancement~~ ✅ DONE
4. ~~Non-member landing page copy rewrite~~ ✅ DONE
5. **Incorporate pet photos in Brand Story video**

### P1 - Medium Priority
6. Apply Pet OS philosophy to Pillar pages (Celebrate, Dine, Stay, etc.)
7. Deepen service intertwining with "Handled by Mira" badge
8. Service Desk - Add SLA tracking
9. Service Desk - Add canned responses
10. Member Directory - Add 360 view
11. Member Directory - Add LTV calculation

### P2 - Nice to Have
12. Mira - Add prompt editor UI
13. System - Add approval workflows
14. Reports - Add GST export CSV

---

## KEY FILES MODIFIED TODAY

| File | Changes |
|------|---------|
| `/app/frontend/src/pages/ProductListing.jsx` | Complete rewrite of non-member landing copy for Pet OS |
| `/app/frontend/src/components/MobileNavBar.jsx` | Changed "Services" to "Care" in bottom nav |
| `/app/frontend/src/components/MemberMobileNav.jsx` | Changed "Services" to "Care" in member nav |

---

## 3RD PARTY INTEGRATIONS

| Service | Status | Notes |
|---------|--------|-------|
| Razorpay | ✅ Working | Test mode keys |
| ElevenLabs | ✅ Working | Brand story voiceovers |
| Sora 2 | ✅ Working | Brand story videos |
| MongoDB | ✅ Working | All data persistence |
| Emergent LLM | ✅ Working | Universal key for GPT/Gemini/Claude |

---

## TEST CREDENTIALS

- **Test User**: test@test.com / test (has pet Bruno)
- **Demo User**: demo@doggy.com / demo1234
- **Admin**: aditya / lola4304
- **Test Pet ID**: pet-e3cd94659908
- **Test Pet**: Bruno (Golden Retriever, 3yo, 25kg)

---

## CODE ARCHITECTURE

```
/app
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── admin/
│   │   │   │   ├── FinanceManager.jsx   (1492 lines - needs refactor)
│   │   │   │   ├── UnifiedProductBox.jsx (2300+ lines - enhanced)
│   │   │   │   ├── ServiceBox.jsx        (1100 lines - rewritten)
│   │   │   │   └── ... (50+ admin components)
│   │   ├── pages/
│   │   │   ├── Admin.jsx                 (2000+ lines - main container)
│   │   │   └── ... (60+ pages)
├── backend/
│   ├── server.py                         (main FastAPI app)
│   ├── finance_routes.py                 (Finance API)
│   ├── unified_product_box.py            (Product Box API)
│   ├── service_box_routes.py             (Service Box API)
│   └── ... (100+ route files)
```

---

## TECHNICAL NOTES

- **Admin Authentication**: HTTP Basic Auth (not JWT)
- **MongoDB**: All collections exclude `_id` in responses
- **Hot Reload**: Enabled for both frontend and backend
- **Testing**: Use `testing_agent_v3_fork` for comprehensive tests

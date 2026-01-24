# The Doggy Company - Product Requirements Document

## Original Problem Statement
Building **The Doggy Company**, a "Pet Life Operating System" designed as a pet-first platform. The core vision is a "vision-first, commerce-later" approach, centered around a "Pet Soul™" for each pet and an intelligent concierge, "Mira® AI".

## Pet Pass System (Core Identity)

### What Pet Pass IS
- A personal concierge for your dog
- A system that understands your pet first
- A living relationship between you, your pet, and our care system
- Memory that grows smarter over time

### What Pet Pass is NOT
- ❌ A shopping membership
- ❌ A discount program
- ❌ A subscription box
- ❌ A product bundle

### Pet Pass Plans
1. **Pet Pass — Trial** (1 month): ₹499 + GST
   - Introduction to the concierge experience
   - Clearly labeled as "TRIAL", not "Monthly"

2. **Pet Pass — Foundation** (12 months): ₹4,999 + GST
   - Full concierge relationship
   - Recommended plan

### Multi-Pet Pricing
- Additional pets: ₹2,499/year or ₹249/trial + GST
- Each pet gets their own unique Pet Pass number

### Navigation Rules (CRITICAL)
- **Not signed in**: Show "Sign in" | "Join now" 
- **Signed in**: Show "My Account" (never "Dashboard")
- "Join now" routes to: `/pet-soul-onboard`
- No pricing/checkout without account context

### Language Guidelines
- ✅ "Join now" (not "Subscribe")
- ✅ "My Account" (not "Dashboard")
- ✅ "Activate Pet Pass" (not "Buy")
- ✅ "Complete setup" (not "Finish checkout")
- ✅ "Trial" (not "Monthly")

---

## What's Been Implemented (January 2026)

### Phase 1: Pet Pass CX Flow ✅
- [x] Updated MembershipPage.jsx with Pet Pass branding and messaging
- [x] Changed "Monthly" label to "Trial" with clear badge
- [x] Added "What is Pet Pass?" section (IS vs IS NOT)
- [x] Added "How Pet Pass Works" (Understand → Guide → Support → Remember)
- [x] Updated Navbar for "Sign in | Join now" (logged out) vs "My Account" (logged in)
- [x] Updated Mobile Menu with same auth-aware navigation
- [x] Updated MembershipOnboarding with Pet Pass language
- [x] Created PetPassCard.jsx digital identity card component
- [x] Updated MyPets.jsx to show Pet Pass card for each pet
- [x] Updated MemberDashboard header to "My Account"
- [x] Updated Login page with "Join now" link
- [x] Backend: Updated pricing calculation to handle "trial" plan type
- [x] Backend: Enhanced verify_payment to update pet's Pet Pass status

### Previous Work Completed
- Production deployment issue resolved (incorrect REACT_APP_BACKEND_URL)
- Service Desk ticket bug fixed (correct collection name)
- Full CX Journey audit completed (documented in CX_JOURNEY_GAPS.md)
- Pet Soul UX flow mode implemented
- Personalized Mira AI welcome card
- Dashboard CTA for Pet Soul completion
- Header pet photo enhancement
- Checkout pet selector for logged-in users

---

## Prioritized Backlog

### P0 - Critical
1. **Unified Inbox Customer Name Recognition** - Service Desk doesn't display customer names
2. **Session Persistence** - Users getting logged out unexpectedly during navigation

### P1 - High Priority
1. **Production Login Flow** - No "Forgot Password" for production database
2. Complete 'Adopt' Pillar - Scaffolding exists, needs registration in app files
3. Complete CX Journey Gap fixes from audit

### P2 - Medium Priority
1. **Checkout Cart Pet Details Bug** - Email appearing as pet name
2. **"Untitled" Products from Shopify Sync** - Recurring issue (10+ times)
3. Build 'Farewell' Pillar
4. Build 'Shop' Pillar
5. Continue backend refactoring (server.py modularization)

### P3 - Lower Priority
1. **Mobile Cart View Redesign**
2. WhatsApp Business API Integration

---

## Architecture

### Backend Routes
- `/api/membership/onboard` - New member onboarding with Pet Pass number generation
- `/api/payments/verify` - Payment verification + Pet Pass activation

### Key Frontend Components
- `MembershipPage.jsx` - Pet Pass landing page
- `MembershipOnboarding.jsx` - Multi-step onboarding flow
- `Navbar.jsx` - Auth-aware navigation
- `PetPassCard.jsx` - Digital Pet Pass identity card (NEW)
- `MyPets.jsx` - Shows Pet Pass cards per pet
- `MemberDashboard.jsx` - "My Account" page

### Pet Pass Data Model
```
{
  pet_pass_number: "TDC-XXXXXX",
  pet_pass_status: "pending" | "active" | "expired",
  pet_pass_plan: "trial" | "foundation",
  pet_pass_activated_at: ISO datetime,
  pet_pass_expires: ISO datetime
}
```

---

## Known Issues
- Session persistence is flaky (users logged out unexpectedly)
- Production database separate from preview (changes don't sync)
- WhatsApp integration is MOCKED (click-to-chat only)

---

## 3rd Party Integrations
- **OpenAI**: Powers Mira AI (via litellm + Emergent LLM Key)
- **Resend**: Transactional emails
- **Razorpay**: Payment gateway
- **Shopify**: Product sync (known "Untitled" bug)
- **ReportLab**: PDF generation

---

*Last updated: January 24, 2026*

# The Doggy Company — Pet Life Operating System

## Original Problem Statement
Build a production-ready pet life management platform with 12 core pillars, AI concierge (Mira), e-commerce, and admin service desk. Platform must be mobile-first (100% iOS/Android user base) for soft launch with 100 founding members.

## Architecture
- **Frontend:** React (CRA) + Tailwind + Framer Motion + Shadcn/UI
- **Backend:** FastAPI + MongoDB (local preview, Atlas production)
- **Integrations:** OpenAI/Claude (Emergent LLM Key), Razorpay, Cloudinary, Google Places, Resend, Gupshup, ElevenLabs

## Core Routes
| Route | Component | Description |
|-------|-----------|-------------|
| /pet-home | PetHomePage | Pet parent dashboard (inside MainLayout) |
| /mira-os | MiraDemoPage | Mira AI interface |
| /soul-builder | SoulBuilder | 51-question soul profile builder |
| /onboarding | PetSoulOnboarding | 10-step pet onboarding wizard |
| /care, /dine, /go, /play, /learn, /celebrate, /shop, /paperwork, /emergency, /adopt, /farewell, /services, /advisory | *SoulPage | 13 Life Pillar pages |
| /admin | Admin Portal | Service desk, product management |

## What's Been Implemented

### Session Feb 2026 — Mobile Navigation & UX Overhaul
- **MobileMenu portal fix:** Rendered via `createPortal` to `document.body` (z-99999/100000) for proper overlay stacking
- **X close button:** Replaced glass orb in menu header with circular close button
- **3-column pillar grid:** Changed from 4 columns to prevent text cutoff ("Paperwork", "Services")
- **Removed duplicate navigation:** PetHomePage no longer imports its own Navbar, TabNavigation, or Mira FAB
- **Moved /pet-home into MainLayout:** Gets shared Navbar + MobileNavBar automatically
- **Removed PillarPageLayout duplicate header:** No more second hamburger (☰) on right side of pillar pages
- **Hidden UniversalServiceButton:** Removed orange globe from /pet-home, /my-requests, /my-pets, /dashboard
- **ProductDetailModal z-index fix:** z-50000 (was z-9999), now renders above LearnContentModal (z-11000)
- **Soul Growth Card gamification:** New dark card with glowing SVG soul ring, animated score, Mira quotes, de-emphasized skip button

### Previously Completed
- Universal Intent-to-Ticket flow (tdc_intent.js + useConcierge.js)
- Performance: score-for-pet bulk queries (3min → 45ms)
- Admin Panel redesign (white UI, TDC amber)
- Two-Way Inbox (Admin ↔ Member via WhatsApp/Gupshup)
- Mobile UX: rebuilt hamburger menu, sendBeacon for mobile network safety
- Google Places NearMe across 6 pillars
- Mira streaming (simulated word-by-word)
- 3-Layer Mira Picks (Breed Soul → Services → AI Scored)
- Product catalog cleanup (237 dupes deleted, 5,074 mapped to Cloudinary)
- Static pages (Landing, About, FAQs, Membership)
- Membership pricing: ₹2,999/year

## Prioritized Backlog

### P0 — Production Deployment
- [ ] User deploys via Emergent platform
- [ ] Run pillar name migration on production Atlas DB
- [ ] Full E2E mobile test on real device

### P1 — Service Flow Audit
- [ ] Audit useConcierge.js integration across all pillar pages
- [ ] Verify every "Book via Concierge" action creates admin ticket
- [ ] Soul Product AI image generation (background jobs in progress)

### P2 — UX Polish
- [ ] Backend pagination for Mira Picks
- [ ] Production .env (SMTP/Resend credentials)
- [ ] Pet Parent Dashboard mobile-first UX deep audit
- [ ] Onboarding flow full mobile audit (Registration → Soul Builder → Pet Home)
- [ ] Update complete-documentation.html

### P3 — Future
- [ ] Build Love pillar
- [ ] Refactor MiraDemoPage.jsx (5,400+ lines → modules)
- [ ] Remove "Skip Payment" from onboarding (post soft-launch)

## Key DB Collections
- `service_desk_tickets`: ticket_id, parent_id, status, intent_primary, thread, messages, mira_briefing
- `products_master`: id, pillar, category, price, cloudinary_image_url, active
- `mira_product_scores`: pet_id, entity_id, score, scored_at
- `breed_products`: product_type, breed_name, mockup_url
- `pets`: health_vault, doggy_soul_answers (79+ keys for complete profiles)

## Test Credentials
- User: dipali@clubconcierge.in / test123
- Admin: aditya / lola4304

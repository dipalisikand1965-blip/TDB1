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
| /onboarding | PetSoulOnboarding | 45-question soul builder (8 chapters) |
| /soul-builder | PetSoulOnboarding | Same soul builder (alternate URL) |
| /join | Join flow | New user pet creation |
| /care..advisory | *SoulPage | 13 Life Pillar pages |
| /admin | Admin Portal | Service desk, product management |

## What's Been Implemented

### Session Feb 2026 — Soul Builder Rewrite
- **45-question Soul Builder** across 8 chapters: Identity, Family, Routine, Home, Travel, Food, Training, Horizon
- **3 screens:** Intro (pet photo + soul ring + chapter preview) → Questions (chapter dots, live score ring, Mira messages, option cards) → Celebration (final score, Mira summary)
- **Gamification:** +pts popup on each answer, soul ring animates and grows, Mira messages change per question
- **Pet photo** in intro screen (golden-bordered circle) and celebration screen
- **No pets redirect:** `/join` if user has no pets
- **API fix:** `question_id` field matches backend expectation
- **Skip chapter + Save & finish later** options (skip de-emphasized)

### Session Feb 2026 — Mobile Navigation Overhaul
- MobileMenu via `createPortal` to body (z-99999/100000), X close button, 3-column pillar grid
- Removed duplicate Navbar/tabs from PetHomePage, moved /pet-home into MainLayout
- Removed PillarPageLayout duplicate header (no more ☰ on right)
- Hidden UniversalServiceButton (orange globe) on logged-in pages
- ProductDetailModal z-index: 50000 (above LearnContentModal's 11000)

### Previously Completed
- Universal Intent-to-Ticket flow (tdc_intent.js + useConcierge.js)
- Performance: score-for-pet bulk queries (3min → 45ms)
- Admin Panel redesign, Two-Way Inbox (WhatsApp/Gupshup)
- Google Places NearMe, Mira streaming, 3-Layer Mira Picks
- Product catalog cleanup, Static pages, Membership ₹2,999/year

## Soul Scoring System
- **Backend:** `calculate_pet_soul_score()` in `pet_score_logic.py`
- **Canonical mapping:** `canonical_answers.py` maps UI field names to scoring fields
- **Weighted scoring:** Total possible = 100 (fixed), categories: personality, safety, nutrition, etc.
- **Tiers:** Based on percentage: Seedling → Sprout → Bloom → Soul Master
- **Storage:** `doggy_soul_answers` dict on pet document, `overall_score` float

### Session Mar 2026 — 5-Bug Fix + PillarSoulProfile Rebuild
- **BUG 1 FIXED**: "What Mira Knows" tiles now use correct DB keys (age_stage, food_allergies, diet_type, etc.)
- **BUG 2 FIXED**: Questions load from `/api/pet-soul/profile/{id}/quick-questions` API
- **BUG 3 FIXED**: "Profile complete" only shows when score >= 80% AND all questions answered
- **BUG 4 FIXED**: Score uses `Math.max(prev, newScore)` — never decreases on answer
- **BUG 5 FIXED**: Pet switch closes modal + key prop forces remount with new pet data
- **Concierge crash FIXED**: `petData` → `pet` in GoSoulPage MiraPicksSection, `generate_ticket_id()` + null check in mira_service_desk.py
- **PillarSoulProfile rebuilt** with 3 sections: What Mira Knows (per-pillar tile maps), Breed tags, Questions from API
- **SoulChapterModal rebuilt** with correct CHAPTER_QUESTIONS keys matching actual DB fields
- Components: `/app/frontend/src/components/SoulChapterModal.jsx`, `/app/frontend/src/components/PillarSoulProfile.jsx`

## Prioritized Backlog

### P0 — Production Deployment
- [ ] User deploys via Emergent platform
- [ ] Re-enable master sync for production (with asyncio.to_thread for AI steps)
- [ ] Full E2E mobile test on real device

### P1 — Pending Issues
- [ ] Database pillar name migration & dynamic sub-categories (BLOCKED: awaiting user backup)
- [ ] AI Soul Products integration into product catalog
- [ ] Add quick-questions API to Adopt/Emergency/Farewell/Learn profile drawers

### P2 — UX Polish
- [ ] Backend pagination for Mira Picks
- [ ] Production .env (SMTP/Resend credentials)
- [ ] Add more questions to reach 51+ in Soul Builder

### P3 — Future
- [ ] Build Love pillar
- [ ] Refactor MiraDemoPage.jsx (5,400+ lines → modules)
- [ ] Remove "Skip Payment" from onboarding (post soft-launch)

## Test Credentials
- User: dipali@clubconcierge.in / test123
- Admin: aditya / lola4304

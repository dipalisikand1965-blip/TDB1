# The Doggy Company - Product Requirements Document

## Original Problem Statement
Building **The Doggy Company**, a "Pet Life Operating System" designed as a pet-first platform. Core vision: "vision-first, commerce-later" approach, centered around "Pet Soul™" and "Mira® AI" concierge.

---

## Session 8: Server-Side Pet Soul Score System (January 25, 2026) ✅

### BLANK HEALTH TAB BUG FIX ✅
**Problem**: Clicking on a pillar (e.g., Health) from MiraContextPanel navigated to a blank page
**Solution**: Created `UnifiedPetPage.jsx` to handle `/pet/:petId?tab=xxx` routes

### SERVER-SIDE PET SOUL SCORE SYSTEM ✅ (P0 - MAJOR FEATURE)

Created `/app/backend/pet_score_logic.py` - The SINGLE SOURCE OF TRUTH for Pet Soul Score:

#### Weighted Question Configuration
- **Safety & Health** (35 points): food_allergies (10), health_conditions (8), vet_comfort (5), life_stage (5), grooming_tolerance (4), noise_sensitivity (3)
- **Personality** (25 points): temperament (8), energy_level (6), social_with_dogs (4), social_with_people (4), behavior_issues (3)
- **Lifestyle** (20 points): alone_time_comfort (5), car_comfort (4), travel_readiness (3), favorite_spot (2), morning_routine (2), exercise_needs (2), feeding_times (2)
- **Nutrition** (10 points): favorite_protein (3), food_motivation (3), treat_preference (2)
- **Training** (5 points): training_level (3), motivation_type (2)
- **Relationships** (5 points): primary_bond (2), other_pets (2), kids_at_home (1)

#### Tier System
| Tier | Score Range | Benefits |
|------|-------------|----------|
| 🌱 Newcomer | 0-24% | Basic Mira AI, Product browsing |
| 🔍 Soul Seeker | 25-49% | Personalized suggestions, Health reminders |
| 🗺️ Soul Explorer | 50-74% | Safety alerts, Pillar recommendations, Priority Mira |
| ✨ Soul Master | 75-100% | AI insights, Proactive recommendations, VIP concierge |

#### New API Endpoints
- `GET /api/pet-score/{pet_id}/score_state` - Complete score state (single source of truth)
- `GET /api/pet-score/{pet_id}/quick-questions` - High-impact questions to boost score
- `GET /api/pet-score/tiers` - All tier definitions
- `GET /api/pet-score/config` - Full scoring configuration
- `POST /api/pet-score/{pet_id}/recalculate` - Force score recalculation

### NEW FRONTEND COMPONENTS ✅
- `/app/frontend/src/utils/petScore.js` - `usePetScore` hook for server-side data
- `/app/frontend/src/components/PetScoreCard.jsx` - Beautiful tier-aware score display

### ALL 14 PILLAR ROUTES ADDED ✅
Added routes for: `/feed`, `/groom`, `/play`, `/train`, `/insure`, `/adopt`, `/farewell`, `/community`

---

## Core Principles (from User Doctrine)

### Pet Soul Score vs Paw Rewards
| Aspect | Pet Soul Score | Paw Rewards |
|--------|---------------|-------------|
| Purpose | Profile completeness & care context | Loyalty rewards |
| Calculation | Server-side weighted questions | Transaction-based |
| Benefits | Personalization unlock | Monetary discounts |
| Never Mixes | ✓ | ✓ |

---

## Key Files

| Component | File | Purpose |
|-----------|------|---------|
| Pet Score Logic | `/backend/pet_score_logic.py` | NEW - Server-side scoring |
| Pet Score Hook | `/utils/petScore.js` | NEW - Frontend hook |
| Pet Score Card | `/components/PetScoreCard.jsx` | NEW - Tier-aware display |
| Unified Pet Page | `/pages/UnifiedPetPage.jsx` | Tab-based pet view |
| App Routes | `App.js` | All pillar routes |

---

## Prioritized Backlog

### P0 - Critical (All Completed ✅)
- ~~Session Persistence~~ ✅
- ~~Pet Photo Consistency~~ ✅ 
- ~~Logo Redesign~~ ✅
- ~~Centralized Avatar System~~ ✅
- ~~Blank Health Tab Bug~~ ✅
- ~~Missing Pillar Routes~~ ✅
- ~~Server-Side Pet Soul Score~~ ✅

### P1 - High Priority (In Progress)
1. Complete Universal Pet Avatar integration across all components
2. Consolidate remaining pet-related pages
3. Store and display Mira conversation history

### P2 - Medium Priority
1. "Untitled" Products from Shopify Sync
2. Service Desk Missing Customer Name verification
3. Mobile Cart View redesign
4. Implement "Soft Gating" in Shopping Flow

### P3 - Future
- Build remaining pillar pages (Adopt, Farewell, etc.)
- Paw Rewards ledger system (separate from Pet Soul Score)
- Concierge Command Center Phase 3

---

## Test Credentials
- **Test User**: dipali@clubconcierge.in / lola4304
- **Admin**: aditya / lola4304
- **Test Pet ID**: pet-99a708f1722a (Mojo)

---

*Last updated: January 25, 2026*

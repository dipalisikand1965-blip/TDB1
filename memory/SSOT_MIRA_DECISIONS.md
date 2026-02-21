# MIRA SINGLE SOURCE OF TRUTH (SSOT)
## Decision Log & Non-Negotiable Rules
### Last Updated: February 21, 2026

---

## PURPOSE
This document is the CANONICAL source of truth for all Mira decisions, guardrails, and hardcoded rules. 
**ANY NEW AGENT MUST READ THIS BEFORE TOUCHING PROMPTS OR LOGIC.**

---

## SECTION 1: NON-NEGOTIABLE BIBLE RULES

### 1.1 Food Safety Gate (CRITICAL)
**Doctrine**: "Memory is only real if it changes behaviour immediately."

| Rule | Implementation | File:Line |
|------|----------------|-----------|
| NEVER ask "any allergies?" if pet has allergies on file | `get_pet_allergies()` canonical function | `mira_routes.py:162-230` |
| Allergies merge from ALL 8 sources | `preferences.allergies`, `doggy_soul_answers.allergies`, `doggy_soul_answers.food_allergies`, `known_allergies`, `health_vault.allergies`, `allergies` root, `insights.key_flags.allergy_list` | `mira_routes.py:180-215` |
| Intercept unsafe ingredient requests | `allergen_intercept` intent returns safe alternatives | `mira_routes.py:12437-12534` |
| LLM prompt injection | `build_allergy_context_injection()` injects STRICT_AVOID into every food prompt | `mira_routes.py:250-280` |

### 1.2 Places API Guardrails (CRITICAL)
| Rule | Implementation | File:Line |
|------|----------------|-----------|
| NEVER auto-trigger Places without user asking | `NON_LOCATION_INTENTS` blocklist | `mira_routes.py:5726-5735` |
| NEVER default to Mumbai | Skip Places if no `user_city`, set mode='clarify' | `mira_routes.py:5803-5825` |
| Health checkup, reminders, schedules = NOT location queries | `NON_LOCATION_INTENTS = ["reminder", "checkup", "schedule", ...]` | `mira_routes.py:5726` |

### 1.3 Quick Replies (Bible Section 11.2.3)
| Rule | Implementation | File:Line |
|------|----------------|-----------|
| Full object schema required | `id`, `label`, `payload_text`, `intent_type`, `action`, `action_args`, `analytics_tag` | `mira_routes.py:11159-11350` |
| No allergy QRs if NOT asking about allergies | Pattern excludes "I know", "has allergies to" | `mira_routes.py:11435-11455` |
| No duplicate QRs (top and bottom) | Frontend checks `hasInlineQRs` before rendering bottom section | `MiraDemoPage.jsx:4207-4238` |

### 1.4 Picks Panel (Bible Section 2.3)
| Rule | Implementation | File:Line |
|------|----------------|-----------|
| Pillar tab = show pillar products | Hide `timely_picks` when specific pillar selected | `PersonalizedPicksPanel.jsx:1280` |
| Celebrate = celebration products | Go Bananas Box, Custom Cakes, Party items NOT training treats | Backend returns correct pillar data |
| Auto-switch pillar on conversation context | `pillar` field in chat response updates `activePillar` | `useChatSubmit.js:954` |

### 1.5 Icon State System (Bible Section 2.2)
| State | Definition | Implementation |
|-------|------------|----------------|
| OFF | Zero alerts, zero due items | `useIconState.js` |
| ON | Active items exist | Lit icon |
| PULSE | New message OR "Awaiting you" | Animated + badge |

---

## SECTION 2: ENDPOINT REFERENCE

| Endpoint | Purpose | Created |
|----------|---------|---------|
| `/api/mira/today/{pet_id}` | Urgency dashboard (urgent, due_today, awaiting) | Feb 21, 2026 |
| `/api/mira/notifications` | User notifications | Feb 21, 2026 |
| `/api/mira/top-picks/{pet_id}` | Personalized picks by pillar | Existing |
| `/api/mira/chat` | Main chat endpoint | Existing |
| `/api/mira/tickets` | Service desk tickets | Existing |

---

## SECTION 3: KNOWN REGRESSIONS & FIXES

### 3.1 Quick Replies Regression (Feb 2026)
- **Issue**: Generic allergy chips appearing for non-allergy conversations
- **Root Cause**: Pattern `"allergies" in response AND "?" in last 100 chars` too broad
- **Fix**: Added exclusions for "I know", "has allergies to" patterns
- **Status**: FIXED

### 3.2 Picks Panel Regression (Feb 2026)
- **Issue**: Celebrate tab showing Training Treats
- **Root Cause**: `timely_picks` section rendered regardless of pillar tab
- **Fix**: Condition `(!activePillar || activePillar === 'all')` before timely_picks
- **Status**: FIXED

### 3.3 Places Mumbai Default (Feb 2026)
- **Issue**: Places showing Mumbai results for all users
- **Root Cause**: `city_for_search = user_city or "Mumbai"` fallback
- **Fix**: Skip Places if no city, set mode='clarify'
- **Status**: FIXED

---

## SECTION 4: DECISION LOG

| Date | Decision | Rationale | Owner |
|------|----------|-----------|-------|
| Feb 21, 2026 | Allergy merge from 8 sources | Users have allergies in multiple places | E1 |
| Feb 21, 2026 | Never ask allergies if known | Trust breaks if system "forgets" | E1 |
| Feb 21, 2026 | Places requires explicit location query | Avoid wrong location results | E1 |
| Feb 21, 2026 | TODAY endpoint created | Core dashboard feature | E1 |
| Feb 21, 2026 | Timely picks hidden on pillar tabs | User clicked pillar = show pillar items | E1 |

---

## SECTION 5: QA CHECKLIST (Run Before Deploy)

### Backend
- [ ] `"Health checkup reminder"` → 0 Places results
- [ ] `"chicken treats for Lola"` → allergen_intercept intent
- [ ] `"Find vets near me"` → mode='clarify' (asks for location)
- [ ] `/api/mira/today/{pet_id}` returns items with badges

### Frontend
- [ ] Celebrate tab shows celebration products (not training treats)
- [ ] No duplicate quick replies (top AND bottom)
- [ ] Dietary context chip appears in food flows

---

## SECTION 6: FILE REFERENCE

### Critical Backend Files
- `/app/backend/mira_routes.py` - Main chat logic (21000+ lines)
- `/app/backend/app/api/top_picks_routes.py` - Picks engine
- `/app/backend/picks_engine.py` - Picks algorithm

### Critical Frontend Files
- `/app/frontend/src/pages/MiraDemoPage.jsx` - Main chat UI
- `/app/frontend/src/components/Mira/PersonalizedPicksPanel.jsx` - Picks panel
- `/app/frontend/src/components/Mira/ChatMessage.jsx` - Message rendering
- `/app/frontend/src/hooks/mira/useChatSubmit.js` - Chat submission logic
- `/app/frontend/src/hooks/mira/useIconState.js` - Icon state management

### Bible Documents
- `/app/memory/PET_OS_BEHAVIOR_BIBLE.md` - Primary behavior rules
- `/app/memory/MIRA_FORMATTING_GUIDE.md` - Text formatting rules

---

## ONBOARDING CHECKLIST FOR NEW AGENTS

1. [ ] Read this SSOT document completely
2. [ ] Read `/app/memory/PET_OS_BEHAVIOR_BIBLE.md` 
3. [ ] Read `/app/memory/PRD.md` for current state
4. [ ] Review `/app/test_reports/` for recent test results
5. [ ] Run QA checklist before making changes
6. [ ] Update this SSOT after any guardrail/rule changes

---

*This document must be updated whenever a guardrail, decision, or hardcoded rule changes.*
*Version: 1.0 | Created: Feb 21, 2026*

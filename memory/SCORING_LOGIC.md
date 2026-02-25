# Pet Soul Score & Paw Points - Complete Documentation

## Overview

This document explains the complete scoring system used in The Doggy Company platform, including:
1. **Pet Soul Score** - Profile completeness (0-100%)
2. **Paw Points** - Rewards and loyalty system
3. **Tier System** - Membership tiers based on Soul Score
4. **Achievements/Badges** - Gamification rewards

---

## 1. Pet Soul Score (0-100%)

### What is Pet Soul Score?
Pet Soul Score measures how completely you've filled out your pet's profile. It's **NOT a reward system** - it unlocks **personalization features** based on how well we understand your pet.

### Calculation Method
The score is calculated using **weighted questions**. Different questions have different point values based on their importance for personalization.

**Total possible points: 100**
- Questions with higher weights are more important for safety and personalization
- Score = (Total points earned / 100) × 100%

### Question Categories & Weights

#### A. Safety & Health (35 points total) - MOST IMPORTANT
| Question | Weight | Why Important |
|----------|--------|---------------|
| Food Allergies | 10 pts | Critical for safe product recommendations |
| Health Conditions | 8 pts | Ensures appropriate service recommendations |
| Vet Comfort Level | 5 pts | Helps prepare for care appointments |
| Life Stage | 5 pts | Age-appropriate recommendations |
| Grooming Tolerance | 4 pts | Better grooming experiences |
| Noise Sensitivity | 3 pts | Important for stay & travel planning |

#### B. Personality & Temperament (25 points total)
| Question | Weight | Why Important |
|----------|--------|---------------|
| Temperament | 8 pts | Core personality understanding |
| Energy Level | 6 pts | Activity and product matching |
| Social with Dogs | 4 pts | Important for daycare and play dates |
| Social with People | 4 pts | Service provider preparation |
| Behavior Issues | 3 pts | Helps match with right trainers |

#### C. Lifestyle & Preferences (20 points total)
| Question | Weight | Why Important |
|----------|--------|---------------|
| Alone Time Comfort | 5 pts | Stay and boarding planning |
| Car Ride Comfort | 4 pts | Travel service planning |
| Travel Readiness | 3 pts | Adventure planning |
| Exercise Needs | 2 pts | Activity planning |
| Favorite Spot | 2 pts | Comfort understanding |
| Morning Routine | 2 pts | Scheduling optimization |
| Feeding Schedule | 2 pts | Stay planning |

#### D. Food & Nutrition (10 points total)
| Question | Weight | Why Important |
|----------|--------|---------------|
| Favorite Protein | 3 pts | Food personalization |
| Food Motivation | 3 pts | Training approach |
| Treat Preference | 2 pts | Treat selection |
| (2 pts remaining distributed across other nutrition questions) |

#### E. Training & Development (5 points total)
| Question | Weight | Why Important |
|----------|--------|---------------|
| Training Level | 3 pts | Service matching |
| Training Motivation | 2 pts | Training effectiveness |

#### F. Relationships (5 points total)
| Question | Weight | Why Important |
|----------|--------|---------------|
| Primary Bond | 2 pts | Family understanding |
| Other Pets | 2 pts | Household dynamics |
| Kids at Home | 1 pt | Safety considerations |

### Important Notes
- **Basic profile info (name, breed, birthday) does NOT count toward Soul Score**
- Only the 26 weighted "soul questions" affect the score
- Questions marked with ★ on the UI are soul-score questions
- A question is "answered" if it has a non-empty value

---

## 2. Tier System (Based on Soul Score)

### Tiers & Benefits

| Tier | Score Range | Benefits |
|------|-------------|----------|
| 🌱 **Newcomer** | 0-24% | Basic Mira AI assistance, Product browsing |
| 🔍 **Soul Seeker** | 25-49% | Personalized product suggestions, Basic health reminders, Mira remembers preferences |
| 🗺️ **Soul Explorer** | 50-74% | Smart safety alerts, Pillar-specific recommendations, Priority Mira responses, Celebration reminders |
| ✨ **Soul Master** | 75-100% | AI-powered care insights, Proactive health recommendations, VIP concierge experience, Cross-pillar intelligence |

---

## 3. Paw Points (Rewards System)

### What are Paw Points?
Paw Points is the **loyalty rewards system** - separate from Pet Soul Score. You earn points through activities and achievements.

### How to Earn Paw Points

| Action | Points | Notes |
|--------|--------|-------|
| **Achievements** | | |
| Start Soul Journey (answer 1 question) | 25 pts | One-time |
| Reach Soul Seeker (25% score) | 100 pts | One-time |
| Reach Soul Explorer (50% score) | 250 pts | One-time |
| Reach Soul Guardian (75% score) | 500 pts | One-time |
| Reach Soul Master (100% score) | 1,000 pts | One-time |
| **Orders & Activity** | | |
| First Order | 100 pts | One-time |
| Each Order | ~1% of order value | Ongoing |
| Product Reviews | 10-50 pts | Per review |
| NPS Survey (Pawmoter Score) | 10 pts | Max 1 per 30 days |
| Social Share (approved) | 20 pts | Requires approval |
| Referrals | 100-500 pts | When friend joins |

### Paw Points Expiry
- Points expire **12 months** after earning
- Check `/api/rewards/loyalty/expiring` for expiring points

---

## 4. Achievements/Badges

### Available Achievements
| Badge | Icon | Requirement | Reward |
|-------|------|-------------|--------|
| Soul Starter | 🌱 | Answer first soul question | 25 pts |
| Soul Seeker | 🔍 | 25% Soul Score | 100 pts |
| Soul Explorer | 🧭 | 50% Soul Score | 250 pts |
| Soul Guardian | 🛡️ | 75% Soul Score | 500 pts |
| Soul Master | 👑 | 100% Soul Score | 1,000 pts |
| First Order | 🛒 | Complete first purchase | 100 pts |
| Pet Parent Pro | 🏆 | Answer 10+ questions | 50 pts |
| Health Hero | ❤️ | Complete health profile | 75 pts |

---

## 5. API Endpoints

### Soul Score APIs
- `GET /api/pet-score/{pet_id}/score_state` - Get complete score state (SINGLE SOURCE OF TRUTH)
- `GET /api/pet-score/config` - Get all scoring configuration
- `GET /api/pet-score/{pet_id}/quick-questions` - Get high-impact unanswered questions
- `POST /api/pet-score/{pet_id}/recalculate` - Force recalculate score

### Paw Points APIs
- `GET /api/rewards/loyalty/transactions` - Get user's point history
- `GET /api/rewards/loyalty/expiring` - Get points expiring soon
- `GET /api/rewards/nps/check` - Check if user can submit NPS
- `POST /api/rewards/nps/submit` - Submit NPS score

### Admin APIs
- `POST /api/admin/pets/recalculate-all-scores` - Fix all pet scores in database

---

## 6. Common Issues & Fixes

### Score showing > 100% (e.g., 560%)
**Cause**: Legacy score stored in database from old calculation method
**Fix**: Run the recalculate endpoint: `POST /api/admin/pets/recalculate-all-scores`

### Score not updating
**Cause**: Frontend caching or API returning stale data
**Fix**: The `/api/pets/my-pets` endpoint now recalculates scores on every request using `calculate_pet_soul_score()`

### Different scores on different pages
**Cause**: Old code used simple count (answers/26), new code uses weighted scoring
**Fix**: All endpoints now use the same `calculate_pet_soul_score()` function from `pet_score_logic.py`

---

## 7. Source Code Reference

- **Backend Scoring Logic**: `/app/backend/pet_score_logic.py`
- **Score Display (Dashboard)**: `/app/frontend/src/pages/MemberDashboard.jsx`
- **Score Display (My Pets)**: `/app/frontend/src/pages/MyPets.jsx`
- **Gamification Banner**: `/app/frontend/src/components/dashboard/GamificationBanner.jsx`
- **Achievement System**: `/app/frontend/src/components/dashboard/AchievementSystem.js`

---

*Last Updated: January 28, 2025*

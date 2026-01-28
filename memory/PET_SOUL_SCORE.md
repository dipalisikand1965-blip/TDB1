# Pet Soul Score™ - Complete Criteria

## Overview
Pet Soul Score™ measures **how well we know your pet** - it's a 100-point profile completeness system that powers personalization across the platform.

**Key Principle:** Pet Soul Score is NOT a reward system (that's Paw Points). It unlocks **personalization features**, not discounts.

---

## 📊 SCORE CATEGORIES (100 Points Total)

| Category | Points | Icon | Purpose |
|----------|--------|------|---------|
| **Safety & Health** | 35 pts | 🛡️ | Critical for safe recommendations |
| **Personality** | 25 pts | 🎭 | Understanding character |
| **Lifestyle** | 20 pts | 🏠 | Daily routines & preferences |
| **Nutrition** | 10 pts | 🍖 | Food preferences & needs |
| **Training** | 5 pts | 🎓 | Learning style |
| **Relationships** | 5 pts | ❤️ | Family & social connections |

---

## 🛡️ SAFETY & HEALTH (35 Points)

| Question | Weight | Icon | Why Important |
|----------|--------|------|---------------|
| Food Allergies | 10 pts | 🍖 | Critical for safe product recommendations |
| Health Conditions | 8 pts | 💊 | Ensures appropriate service recommendations |
| Vet Comfort Level | 5 pts | 🏥 | Helps prepare for care appointments |
| Life Stage | 5 pts | 📅 | Age-appropriate recommendations |
| Grooming Tolerance | 4 pts | ✂️ | Better grooming experiences |
| Noise Sensitivity | 3 pts | 🔊 | Important for stay & travel planning |

---

## 🎭 PERSONALITY (25 Points)

| Question | Weight | Icon | Why Important |
|----------|--------|------|---------------|
| Basic Temperament | 8 pts | 🎭 | Core personality understanding |
| Energy Level | 6 pts | ⚡ | Activity and product matching |
| Social with Dogs | 4 pts | 🐕 | Important for daycare and play dates |
| Social with People | 4 pts | 👥 | Service provider preparation |
| Behavior Issues | 3 pts | ⚠️ | Helps match with right trainers |

---

## 🏠 LIFESTYLE (20 Points)

| Question | Weight | Icon | Why Important |
|----------|--------|------|---------------|
| Alone Time Comfort | 5 pts | 🏠 | Stay and boarding planning |
| Car Ride Comfort | 4 pts | 🚗 | Travel service planning |
| Travel Readiness | 3 pts | ✈️ | Adventure planning |
| Favorite Spot | 2 pts | 🛋️ | Comfort understanding |
| Morning Routine | 2 pts | 🌅 | Scheduling optimization |
| Exercise Needs | 2 pts | 🏃 | Activity planning |
| Feeding Schedule | 2 pts | 🕐 | Stay planning |

---

## 🍖 NUTRITION (10 Points)

| Question | Weight | Icon | Why Important |
|----------|--------|------|---------------|
| Favorite Protein | 3 pts | 🥩 | Food personalization |
| Food Motivation | 3 pts | 🎯 | Training approach |
| Treat Preference | 2 pts | 🦴 | Treat selection |
| Diet Type | 2 pts | 🥗 | Meal planning |

---

## 🎓 TRAINING (5 Points)

| Question | Weight | Icon | Why Important |
|----------|--------|------|---------------|
| Training Level | 3 pts | 🎓 | Service matching |
| Training Motivation | 2 pts | 🏆 | Training effectiveness |

---

## ❤️ RELATIONSHIPS (5 Points)

| Question | Weight | Icon | Why Important |
|----------|--------|------|---------------|
| Primary Bond | 2 pts | ❤️ | Family understanding |
| Other Pets | 2 pts | 🐾 | Household dynamics |
| Kids at Home | 1 pt | 👶 | Safety considerations |

---

## 🎮 TIER SYSTEM

| Tier | Score Range | Emoji | Benefits Unlocked |
|------|-------------|-------|-------------------|
| **Newcomer** | 0-24% | 🌱 | Basic Mira AI assistance, Product browsing |
| **Soul Seeker** | 25-49% | 🔍 | Personalized suggestions, Health reminders, Mira remembers preferences |
| **Soul Explorer** | 50-74% | 🗺️ | Smart safety alerts, Pillar-specific recommendations, Priority Mira responses |
| **Soul Master** | 75-100% | ✨ | AI care insights, VIP Concierge®, Cross-pillar intelligence, Predictive suggestions |

---

## 🔓 QUESTION UNLOCK REQUIREMENTS

Some questions unlock at higher tiers:

| Tier Required | Questions |
|---------------|-----------|
| **None (Always)** | Food Allergies, Health Conditions, Vet Comfort, Life Stage, Grooming Tolerance, Temperament, Energy Level, Alone Time, Favorite Protein, Training Level |
| **Soul Seeker (25%+)** | Noise Sensitivity, Social with Dogs, Social with People, Behavior Issues, Car Comfort, Exercise Needs, Food Motivation, Treat Preference, Training Motivation |
| **Soul Explorer (50%+)** | Travel Readiness, Favorite Spot, Morning Routine, Feeding Schedule, Primary Bond, Other Pets, Kids at Home, Favorite Toys |

---

## 🎯 HIGH IMPACT QUESTIONS

These questions contribute the most to your score:

1. **Food Allergies** - 10 pts (Safety)
2. **Temperament** - 8 pts (Personality)
3. **Health Conditions** - 8 pts (Safety)
4. **Energy Level** - 6 pts (Personality)
5. **Vet Comfort Level** - 5 pts (Safety)
6. **Life Stage** - 5 pts (Safety)
7. **Alone Time Comfort** - 5 pts (Lifestyle)

**Pro Tip:** Completing just these 7 questions = 47 points (almost Soul Explorer!)

---

## 📈 SCORE CALCULATION

```
Total Score = Sum of (answered_question_weight) / 100 × 100%

Category Score = Sum of (answered_in_category) / category_max_points × 100%
```

**Example:**
- Answer 5 questions worth 30 points total
- Score = 30/100 = 30% (Soul Seeker tier)

---

## 🔌 API ENDPOINTS

| Endpoint | Method | Returns |
|----------|--------|---------|
| `/api/pet/{id}/score_state` | GET | Complete score state with tier info |
| `/api/pet/{id}/score_state/categories` | GET | Category breakdown only |
| `/api/pet-score/tiers` | GET | Tier definitions |
| `/api/pet/{id}/score_state/quick-questions?limit=N` | GET | Recommended unanswered questions |

---

## 🎨 DISPLAY COLORS

| Category | Color |
|----------|-------|
| Safety | Red |
| Personality | Purple |
| Lifestyle | Blue |
| Nutrition | Orange |
| Training | Green |
| Relationships | Pink |

---

## ⚡ QUICK PATHS TO EACH TIER

### Soul Seeker (25+ points)
Answer these 5 questions:
- Food Allergies (10) + Temperament (8) + Health Conditions (8) = 26 pts ✓

### Soul Explorer (50+ points)
Add to Soul Seeker:
- Energy Level (6) + Vet Comfort (5) + Life Stage (5) + Alone Time (5) + Grooming (4) = 25 more pts
- Total: 51 pts ✓

### Soul Master (75+ points)
Add to Soul Explorer:
- Social Dogs (4) + Social People (4) + Car Comfort (4) + Noise (3) + Behavior (3) + Travel (3) + Protein (3) + Food Motivation (3) = 27 more pts
- Total: 78 pts ✓

---

*Last Updated: January 28, 2025*

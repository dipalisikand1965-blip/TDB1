# The Doggy Company - Membership & Rewards System

## Overview
The Pet Pass membership program includes a gamified rewards system with badges, milestones, and Paw Points that members can earn and redeem.

---

## 🏅 ACHIEVEMENT BADGES (10 Total)

### Soul Journey Milestones (5 Badges)
Complete your pet's Soul Questionnaire to unlock these badges:

| Badge | Name | Criteria | Paw Points | Tier |
|-------|------|----------|------------|------|
| 🌱 | Soul Starter | Answer 1+ soul question | 50 | Bronze |
| 🔍 | Soul Seeker | Reach 25% soul completion | 100 | Bronze |
| 🧭 | Soul Explorer | Reach 50% soul completion | 250 | Silver |
| 🛡️ | Soul Guardian | Reach 75% soul completion | 500 | Gold |
| 👑 | Soul Master | Complete 100% soul journey | 1,000 | Platinum |

### Engagement Badges (5 Badges)
Unlock through platform activities:

| Badge | Name | Criteria | Paw Points | Tier |
|-------|------|----------|------------|------|
| 🛒 | First Paw-chase | Place your first order | 100 | Bronze |
| 📸 | Picture Paw-fect | Upload your pet's photo | 50 | Bronze |
| 🎉 | Party Planner | Plan a celebration | 150 | Silver |
| 🐾 | Pack Leader | Add 2+ pets to family | 200 | Silver |
| 💬 | Mira's Friend | Chat with Mira AI | 75 | Bronze |

**Total Potential Badge Points: 2,475 Paw Points**

---

## 🎯 SOUL JOURNEY MILESTONES

Progress through the Pet Soul™ questionnaire unlocks rewards:

| Threshold | Milestone Name | Icon | Paw Points Reward |
|-----------|---------------|------|-------------------|
| 25% | Soul Seeker | 🔍 | 100 |
| 50% | Soul Explorer | 🧭 | 250 |
| 75% | Soul Guardian | 🛡️ | 500 |
| 100% | Soul Master | 👑 | 1,000 |

**Total Questions: 59** across 14 pillars

---

## 🎁 PAW POINTS SYSTEM

### Earning Paw Points

| Activity | Points Earned |
|----------|---------------|
| Soul question answered | Variable (based on milestone) |
| Place order | 1 point per ₹10 spent |
| Achievement unlocked | Badge-specific (50-1,000) |
| Referral bonus | 500 points |
| Birthday bonus | 100 points |
| Review submitted | 25 points |

### Point Value
- **1 Paw Point = ₹0.50** redemption value

### Member Tiers (Based on Lifetime Points)

| Tier | Points Required | Benefits |
|------|-----------------|----------|
| Bronze | 0 | Basic rewards access |
| Silver | 500+ | Silver-tier rewards + priority booking |
| Gold | 1,500+ | Gold-tier rewards + early access |
| Platinum | 5,000+ | All rewards + personal concierge |

---

## 🏷️ REWARD CATALOG

### Discount Rewards
| Reward | Points | Min Order | Tier |
|--------|--------|-----------|------|
| ₹50 Off | 100 | ₹500 | Bronze |
| ₹100 Off | 200 | ₹1,000 | Silver |
| ₹250 Off | 500 | ₹2,000 | Gold |
| 10% Off (max ₹500) | 400 | Any | Gold |

### Free Items
| Reward | Points | Value | Tier |
|--------|--------|-------|------|
| Free Treat Box | 150 | ₹299 | Bronze |
| Free Birthday Cake | 350 | ₹599 | Silver |
| Free Basic Grooming | 500 | ₹799 | Gold |

### Experience Rewards
| Reward | Points | Duration | Tier |
|--------|--------|----------|------|
| Priority Mira Support | 200 | 30 days | Silver |
| VIP Restaurant Booking | 300 | - | Silver |
| Personal Concierge® Session | 750 | 30 min | Platinum |

### Exclusive Rewards
| Reward | Points | Duration | Tier |
|--------|--------|----------|------|
| Early Access Pass | 400 | 60 days | Gold |
| Double Points Week | 600 | 7 days | Gold |

---

## 💎 BADGE TIER COLORS

| Tier | Gradient Colors |
|------|----------------|
| Bronze | Amber 600 → Amber 400 |
| Silver | Gray 400 → Gray 300 |
| Gold | Yellow 500 → Yellow 300 |
| Platinum | Purple 600 → Pink 500 |

---

## 🎊 CELEBRATION TRIGGERS

The system triggers confetti celebrations when:
1. New milestone reached (Soul Seeker, Explorer, Guardian, Master)
2. Badge unlocked
3. Reward redeemed
4. Points milestone hit (1000, 2500, 5000)

---

## 📊 DASHBOARD DISPLAY

### Member Dashboard Shows:
- Current Pet Soul™ percentage
- Number of badges unlocked (X of 10)
- Total Paw Points balance
- Next milestone progress bar
- Questions answered (X of 59)
- Point value in ₹

### Quick Stats Card:
- Soul Score: X%
- Badges: X/10
- Points: XXXX
- Next Milestone: Name + reward

---

## API ENDPOINTS

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/paw-points/balance` | GET | Get user's point balance |
| `/api/paw-points/rewards` | GET | Get reward catalog |
| `/api/paw-points/redeem` | POST | Redeem a reward |
| `/api/paw-points/history` | GET | Get point transaction history |
| `/api/paw-points/sync-achievements` | POST | Sync and credit achievement points |
| `/api/loyalty/leaderboard` | GET | Get points leaderboard |

---

*Last Updated: January 28, 2025*

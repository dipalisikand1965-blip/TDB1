# The Doggy Company - Business Logic Documentation
## Complete Reference for Soul Score, Badges, Membership, Points & More

*Last Updated: March 7, 2026*

---

## 1. SOUL SCORE SYSTEM

### Overview
The Pet Soul Score (0-100%) measures **profile completeness and care context**. It is NOT a reward/discount system - that's Paw Rewards. The Soul Score unlocks **personalization**, not monetary benefits.

### Score Categories (Total: 100 points)

| Category | Max Points | Description |
|----------|------------|-------------|
| **Safety & Health** | 36 | Critical for safe product recommendations |
| **Personality** | 25 | Understanding their unique character |
| **Lifestyle** | 20 | Daily routines and preferences |
| **Nutrition** | 9 | Food preferences and needs |
| **Training** | 5 | Learning style and capabilities |
| **Relationships** | 5 | Family and social connections |

### Question Weights (Safety & Health - 36 pts)
- `food_allergies` - 10 pts (Critical for safe product recommendations)
- `health_conditions` - 8 pts (Ensures appropriate service recommendations)
- `vet_comfort` - 5 pts (Helps prepare for care appointments)
- `life_stage` - 5 pts (Age-appropriate recommendations)
- `grooming_tolerance` - 4 pts (Better grooming experiences)
- `noise_sensitivity` - 4 pts (Important for stay & travel planning)

### Question Weights (Personality - 25 pts)
- `temperament` - 8 pts (Core personality understanding)
- `energy_level` - 6 pts (Activity and product matching)
- `social_with_dogs` - 4 pts (Important for daycare and play dates)
- `social_with_people` - 4 pts (Service provider preparation)
- `behavior_issues` - 3 pts (Helps match with right trainers)

### Question Weights (Lifestyle - 20 pts)
- `alone_time_comfort` - 5 pts (Stay and boarding planning)
- `car_comfort` - 4 pts (Travel service planning)
- `travel_readiness` - 3 pts (Adventure planning)
- `favorite_spot` - 2 pts (Comfort understanding)
- `morning_routine` - 2 pts (Scheduling optimization)
- `exercise_needs` - 2 pts (Activity planning)
- `feeding_times` - 2 pts (Stay planning)

### Question Weights (Nutrition - 9 pts)
- `favorite_protein` - 3 pts (Food personalization)
- `food_motivation` - 3 pts (Training approach)
- `treat_preference` - 3 pts (Treat selection)

### Question Weights (Training - 5 pts)
- `training_level` - 3 pts (Service matching)
- `motivation_type` - 2 pts (Training effectiveness)

### Question Weights (Relationships - 5 pts)
- `primary_bond` - 2 pts (Family understanding)
- `other_pets` - 2 pts (Household dynamics)
- `kids_at_home` - 1 pt (Safety considerations)

---

## 2. SOUL SCORE TIERS

### Tier Definitions

| Tier | Score Range | Emoji | Benefits |
|------|-------------|-------|----------|
| **Newcomer** | 0-24% | 🌱 | Basic Mira AI assistance, Product browsing |
| **Soul Seeker** | 25-49% | 🔍 | Personalized product suggestions, Basic health reminders, Mira remembers preferences |
| **Soul Explorer** | 50-74% | 🗺️ | Smart safety alerts during checkout, Pillar-specific recommendations, Priority Mira responses, Personalized celebration reminders |
| **Soul Master** | 75-100% | ✨ | AI-powered care insights, Proactive health recommendations, VIP concierge experience, Cross-pillar intelligence, Predictive needs suggestions |

### Tier Unlock Messages
- **Newcomer**: "Just getting started!"
- **Soul Seeker**: "Now I'm getting to know your pet!"
- **Soul Explorer**: "We understand your pet's world!"
- **Soul Master**: "You've unlocked the deepest level of pet understanding!"

---

## 3. MEMBERSHIP TIERS

### Overview
Membership tiers control **daily chat limits** with Mira AI and priority access.

| Tier | Daily Chats | Priority | Price |
|------|-------------|----------|-------|
| **Free** | 3 | ❌ | ₹0 |
| **Soul** | 999 (unlimited) | ✅ | ₹999/year |
| **Heart** | 999 (unlimited) | ✅ | ₹2,999/year |
| **Family** | 999 (unlimited) | ✅ | ₹9,999/year |

### Membership Benefits by Tier

#### Free Tier (₹0)
- 3 Mira AI chats per day
- Basic product browsing
- Access to Learn content
- Limited Soul Profile

#### Soul Tier (₹999/year)
- Unlimited Mira AI chats
- Priority responses
- Full Soul Profile access
- Birthday reminders
- Basic concierge requests

#### Heart Tier (₹2,999/year)
- Everything in Soul
- Priority concierge queue
- 10% discount on orders
- Exclusive product access
- Pet Wrapped premium cards

#### Family Tier (₹9,999/year)
- Everything in Heart
- 15% discount on orders
- Personal concierge
- Multi-pet management
- VIP experiences
- Priority customer support

---

## 4. PAW POINTS & REWARDS SYSTEM

### Overview
Paw Points is the **loyalty and discount system** (separate from Soul Score).
Users earn points for purchases and activities, then redeem for rewards.

### Earning Points

| Activity | Points Earned |
|----------|---------------|
| Order (per ₹100 spent) | 10 points |
| Activity logging (30+ min) | 5 points |
| Activity logging (<30 min) | 2 points |
| Referral (friend signs up) | 100 points |
| Profile completion | 50 points |
| First order | 50 bonus points |

### Reward Catalog

| Reward | Points Required | Value |
|--------|-----------------|-------|
| ₹50 Off Order | 100 points | Min order ₹500 |
| ₹100 Off Order | 200 points | Min order ₹1000 |
| ₹250 Off Order | 500 points | Min order ₹2000 |
| 10% Off Order | 400 points | Max ₹500 discount |
| Free Treat Box | 150 points | Worth ₹299 |
| Free Basic Grooming | 300 points | Worth ₹599 |
| VIP Celebration Package | 500 points | Worth ₹999 |
| Personal Concierge Session | 750 points | 30-min 1-on-1 |
| Early Access Pass | 400 points | 60 days |
| Double Points Week | 600 points | 7 days |

### Loyalty Tiers (Based on Lifetime Points)

| Tier | Threshold | Icon |
|------|-----------|------|
| **Bronze** | 0+ | 🥉 |
| **Silver** | 500+ | 🥈 |
| **Gold** | 1,500+ | 🥇 |
| **Platinum** | 5,000+ | 💎 |

---

## 5. PAWMETER RATING SYSTEM

### Overview
PawMeter is a **universal 1-10 paw rating** for products (replaces traditional star reviews).

### How It Works
- Users rate products on a 1-10 scale (paws)
- Each product displays average paw score
- Higher paws = better product
- Ratings can include optional feedback

### Rating Scale
| Paws | Meaning |
|------|---------|
| 1-3 | Not recommended |
| 4-5 | Below average |
| 6-7 | Good |
| 8-9 | Very good |
| 10 | Excellent/Perfect |

---

## 6. BADGES & ACHIEVEMENTS

### Overview
Badges are earned through platform engagement and milestones.

### Available Badges

| Badge | How to Earn |
|-------|-------------|
| **First Paw** | Complete first Soul Profile question |
| **Soul Seeker** | Reach 25% Soul Score |
| **Soul Explorer** | Reach 50% Soul Score |
| **Soul Master** | Reach 75% Soul Score |
| **First Order** | Complete first purchase |
| **Pillar Pioneer** | Explore all 14 pillars |
| **Mira's Friend** | Have 10+ conversations with Mira |
| **Celebration Champion** | Book a celebration event |
| **Health Hero** | Log first vet visit |
| **Adventure Buddy** | Complete travel preparation |

### Badge Storage
Badges are stored in the `achievements` array on the pet document:
```json
{
  "achievements": [
    {
      "badge_id": "soul_seeker",
      "badge_name": "Soul Seeker",
      "earned_at": "2026-03-07T10:00:00Z",
      "icon": "🔍"
    }
  ]
}
```

---

## 7. 14 LIFE PILLARS

### Complete Pillar List

| # | Pillar | Icon | Description |
|---|--------|------|-------------|
| 1 | **Celebrate** | 🎉 | Birthdays, Gotcha Days, special occasions |
| 2 | **Dine** | 🍽️ | Pet-friendly restaurants and cafes |
| 3 | **Stay** | 🏠 | Boarding, pet hotels, home stays |
| 4 | **Travel** | ✈️ | Pet travel planning and documentation |
| 5 | **Care** | 💊 | Vets, grooming, health services |
| 6 | **Enjoy** | 🎮 | Play dates, experiences, activities |
| 7 | **Fit** | 🏃 | Fitness tracking, exercise plans |
| 8 | **Learn** | 📚 | Training resources, pet education |
| 9 | **Paperwork** | 📋 | Documentation, insurance, licenses |
| 10 | **Advisory** | 👨‍⚕️ | Expert consultations |
| 11 | **Emergency** | 🚨 | Emergency contacts, 24/7 support |
| 12 | **Farewell** | 🌈 | End-of-life care, Rainbow Bridge memorial |
| 13 | **Adopt** | 🐾 | Adoption resources, rescue connections |
| 14 | **Shop** | 🛒 | Curated products with Mira recommendations |

---

## 8. INTEGRATIONS STATUS

### ✅ LIVE Integrations

| Service | Purpose | Status |
|---------|---------|--------|
| **OpenAI GPT** | Mira AI conversations | ✅ Live |
| **MongoDB Atlas** | Database | ✅ Live |
| **Shopify** | Product catalog sync | ✅ Live |
| **Razorpay** | Payment processing | ✅ Live |
| **Gupshup** | WhatsApp delivery (Pet Wrapped) | ✅ Live |
| **Resend** | Email delivery (Pet Wrapped) | ✅ Live |
| **YouTube** | Video content in Learn | ✅ Live |
| **Google Places** | Location search for services | ✅ Live |
| **ElevenLabs** | Voice synthesis (optional) | ✅ Live |

### Integration Credentials (Backend .env)
- `OPENAI_API_KEY` - OpenAI for Mira AI
- `MONGO_URL` - MongoDB connection
- `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` - Payments
- `GUPSHUP_API_KEY` / `GUPSHUP_APP_NAME` - WhatsApp
- `RESEND_API_KEY` - Email delivery
- `YOUTUBE_API_KEY` - Video content
- `GOOGLE_PLACES_API_KEY` - Location services

---

## 9. KEY API ENDPOINTS

### Authentication
- `POST /api/auth/register` - New user registration
- `POST /api/auth/login` - User login (returns JWT)
- `GET /api/auth/me` - Get current user

### Pets
- `POST /api/pets` - Create new pet
- `GET /api/pets` - Get user's pets
- `GET /api/pets/{id}` - Get specific pet
- `PUT /api/pets/{id}` - Update pet

### Soul Score
- `GET /api/pet-score/{id}/score_state` - Get detailed score breakdown
- `POST /api/soul/save` - Save soul answer

### Paw Points
- `GET /api/paw-points/balance` - Get current balance
- `GET /api/paw-points/catalog` - Get available rewards
- `POST /api/paw-points/redeem` - Redeem a reward
- `GET /api/paw-points/history` - Get transaction history

### Pet Wrapped
- `GET /api/wrapped/generate/{pet_id}` - Generate wrapped data
- `GET /api/wrapped/download/{pet_id}` - Download wrapped HTML
- `POST /api/wrapped/trigger-welcome/{pet_id}` - Send welcome wrapped

### Mira AI
- `POST /api/mira/chat` - Send message to Mira
- `GET /api/mira/pet/{pet_id}/memory` - Get Mira's memory of pet

---

## 10. DATABASE COLLECTIONS

### Core Collections

| Collection | Purpose |
|------------|---------|
| `users` | User accounts and membership |
| `pets` | Pet profiles and soul data |
| `doggy_soul_answers` | Soul Profile responses |
| `conversation_memories` | Mira AI conversation history |
| `orders` | Order history |
| `products_master` | Product catalog |
| `paw_points_ledger` | Points transactions |
| `paw_ratings` | PawMeter ratings |
| `tickets` | Concierge tickets |
| `learn_content` | Educational content |

---

*This document is the Single Source of Truth for all business logic in The Doggy Company platform.*

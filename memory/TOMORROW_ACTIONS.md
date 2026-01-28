# 🐾 The Doggy Company - Tomorrow's Action Items (Jan 29, 2025)

## 🔴 CRITICAL BUGS TO FIX

### 1. Soul Questions Not Saving (P0)
**Problem**: Frontend calls `/api/pet-soul/profile/{pet_id}/answer` but backend has `/api/pets/{pet_id}/soul-answer`
**Location**: 
- Frontend: `/app/frontend/src/components/PetSoulEnhanced.jsx` line 682
- Backend: `/app/backend/server.py` line 7568
**Fix**: Either update frontend to use correct endpoint OR create alias endpoint in backend

### 2. Wishlist Not Saving (P0)
**Problem**: Wishlist toggle not persisting to database
**Location**: 
- Frontend: `/app/frontend/src/pages/ProductDetailPage.jsx` lines 402-424
- Backend: `/app/backend/server.py` line 5498
**Debug**: Check API response, verify token is being sent, check DB write

### 3. Checkout Add Items Not Working (P0)
**Problem**: Add-on items in checkout not adding to cart
**Location**: `/app/frontend/src/pages/Checkout.jsx` lines 574-580, 2129
**Debug**: Verify `addToCart` function in CartContext, check if item ID is correct

### 4. Remove "Collect from Store" Option (P1)
**Problem**: User wants to hide store pickup option from checkout
**Location**: `/app/frontend/src/pages/Checkout.jsx` - look for `deliveryMethod`, `pickup`, `store_locations`
**Fix**: Remove pickup option from delivery method selection UI

---

## 🟡 FEATURES TO ADD

### 5. Mira-Powered Auto Picks (P1)
**Current**: MiraPicksCard shows recommendations but doesn't emphasize Mira
**Location**: `/app/frontend/src/components/MiraPicksCard.jsx`
**Enhancement**: 
- Add "🐕‍🦺 Mira says:" prefix to recommendations
- Add explanation like "Based on Bruno's love for chicken treats..."
- Add personalization reason to each pick

### 6. Admin Docs Section (P2)
**Request**: Add all documentation to `/admin/docs`
**Location**: Need to create `/app/frontend/src/pages/AdminDocs.jsx` or enhance existing
**Content**:
- Pet Soul scoring logic (`/app/memory/SCORING_LOGIC.md`)
- PRD document
- API documentation
- Integration guides

### 7. Service Desk Intelligent Search (P2)
**Current**: Basic search functionality
**Location**: `/app/frontend/src/components/admin/DoggyServiceDesk.jsx`
**Enhancement**: 
- Search by pet parent name
- Search by ticket number
- Search by pet name
- Search by phone number
- Fuzzy matching
- Highlight matched terms

---

## 🔵 DEEP FEATURES (BACKLOG)

### 8. Pet Memory Timeline ("On This Day")
- Auto-generates memories from past orders, photos, milestones
- "1 year ago, Bruno had his first birthday cake from us!"
- Beautiful timeline visualization
- Shareable cards for social media

### 9. Pet Parent Leaderboard & Community
- Rankings among pet parents in city
- Weekly challenges with Paw Points rewards
- "Top 10 Most Active Pet Parents in Mumbai"
- Share achievements

### 10. Pet Health Dashboard with AI Insights
- Weight tracking with visual graphs
- AI-powered diet recommendations
- Automated reminders based on health patterns
- Sync with vet records

### 11. Paw Pals - Pet Social Network
- Find playmates nearby
- Arrange dog meetups
- Matching by size, energy level, temperament
- "Bruno matched with Max - both energetic Golden Retrievers!"

### 12. AI Photo Studio
- Upload photo → AI creates fun versions
- Birthday cards, holiday greetings
- "Superhero" pet versions
- Professional, shareable images

### 13. Gamified Training Progress
- Track milestones like video game
- "Bruno learned SIT! +50 XP"
- Skill trees (Basic → Advanced)
- Video tutorials integrated

---

## ⚠️ BLOCKED ITEMS

### Razorpay Payments
- **Status**: Waiting for production API keys
- **Impact**: All payment flows are broken

### WhatsApp Auto-Reply
- **Status**: Mira AI code ready, needs API credentials
- **Config needed**: `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN`

---

## ✅ COMPLETED TODAY (Jan 28)

1. ✅ Pet Soul Score 560% bug fixed
2. ✅ Celebrations selection in onboarding (4-step flow)
3. ✅ Navbar "Hello Dipali / Account" confusion fixed
4. ✅ Mira Guidance System with contextual tips
5. ✅ My Celebrations dashboard widget
6. ✅ Enhanced badge tooltips with explanations
7. ✅ First Visit Tour (7-step onboarding)
8. ✅ Mira Voice/Chat Assistant with speech recognition
9. ✅ Mira's Daily Tips (50+ rotating tips)
10. ✅ WhatsApp Mira AI (pattern matching ready)
11. ✅ Pet Soul video content audited
12. ✅ Deployment health check passed

---

## 📋 PRIORITY ORDER FOR TOMORROW

1. 🔴 Fix Soul Questions saving (critical for core feature)
2. 🔴 Fix Wishlist saving
3. 🔴 Fix Checkout add items
4. 🟡 Remove "Collect from Store"
5. 🟡 Mira-powered auto picks
6. 🔵 Service Desk intelligent search
7. 🔵 Admin docs section

---

*Generated: Jan 28, 2025 at end of session*

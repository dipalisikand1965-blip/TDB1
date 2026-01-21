# 🐕 The Doggy Company - Tomorrow's Tasks
**Created: January 21, 2026**

---

## 🔴 HIGH PRIORITY (P0)

### 1. Voice Order Fix
- **Issue**: Voice Order feature broken - "Connection failed" error, name capture not working
- **Location**: `/app/frontend/src/pages/VoiceOrder.jsx`, `/app/backend/channel_intake.py`
- **Debug Steps**:
  1. Trace `customerName` capture in `submitVoiceOrder` function
  2. Check backend endpoint processing
  3. Test WebSocket/speech connection

### 2. Checkout Form Validation
- **Issue**: "Please fill required fields" error shows without specifying which fields
- **Location**: `/app/frontend/src/pages/Checkout.jsx`
- **Fix**: Toast should list exact missing fields

### 3. Shopify Sync "Untitled" Products
- **Issue**: Products syncing with blank titles (RECURRING - 9+ times)
- **Location**: `transform_shopify_product` function in `/app/backend/server.py`
- **Debug Steps**:
  1. Add defensive logging for raw Shopify payload
  2. Check when product title is missing
  3. Add fallback handling

---

## 🟠 MEDIUM PRIORITY (P1)

### 4. Mira Conversation Tracking per Pet Parent
- **Goal**: Like Chatbase sync view - show conversations grouped by pet parent
- **Needs**:
  - API endpoint to get all Mira conversations for a user
  - UI component showing conversation history
  - Link to pet profile from conversation view
- **Reference**: User shared Chatbase screenshot showing pet parent conversations

### 5. Commerce Filtering Based on Pet Soul
- **Goal**: Filter products based on pet's allergies, age, sensitivities
- **Location**: `/app/frontend/src/pages/ProductListing.jsx`
- **Implementation**:
  1. Fetch pet soul data (allergies, age)
  2. Filter product list before rendering
  3. Show "Not suitable for [Pet]" badge on filtered items

### 6. Consolidate Duplicate Membership Pages
- **Issue**: Two separate pages (`Membership.jsx` and `MembershipPage.jsx`) with duplicate routing
- **Fix**: Merge into single dynamic component

---

## 🟡 LOWER PRIORITY (P2)

### 7. Multi-Pet Household Special States
- **Cases to handle**:
  - Shared phone numbers across pets
  - Pet Soul switching in conversations
  - "Grief state" when a pet passes away

### 8. WhatsApp Soul Drip Automation
- **Goal**: Weekly questions via WhatsApp to enrich Pet Soul
- **Location**: `/app/backend/pet_gate_routes.py` (drip-question endpoint exists)
- **Needs**: WhatsApp Business API integration, cron job

### 9. Mira AI → Soul Write-Back
- **Goal**: Parse Mira conversations and update Pet Soul automatically
- **Location**: `/app/backend/soul_intelligence.py`, `/app/backend/mira_routes.py`
- **Implementation**: Enhance `extract_enrichments` function

### 10. Behavioral Inference Engine
- **Goal**: Learn from purchases, returns, repeat buys
- **Example**: "User bought grain-free 3x → infer preference"

---

## 🔧 REFACTORING TASKS

### 11. Linting Cleanup
- **Files with errors**:
  - `/app/frontend/src/pages/Home.jsx`
  - `/app/frontend/src/pages/Membership.jsx`
  - `/app/frontend/src/pages/MembershipPage.jsx`
- **Issue**: Unescaped apostrophes, unused variables

### 12. Backend File Structure
- Move routes to `/app/backend/routes/`
- Models to `/app/backend/models/`
- Tests to `/app/backend/tests/`
- Break down `server.py` (currently very large)

### 13. Re-enable ProtectedRoute.jsx
- **Note**: Authentication gating disabled for development
- **Action**: Re-enable before go-live

---

## ✅ COMPLETED TODAY (January 21, 2026)

1. ✅ Service Desk AI Chat fixed (NoneType error)
2. ✅ Ticket click handler added
3. ✅ Pet Soul Journey redesigned (Living Portrait spec)
4. ✅ Functional Gentle Next Step (saves to Pet Soul)
5. ✅ Clickable Pillar Cards (detailed preferences view)
6. ✅ Pet Parent Directory (renamed from Member Directory)
7. ✅ FAQs now fetch from backend API with categories
8. ✅ Pillar Preferences API created
9. ✅ Journey Answer API created

---

## 📝 NOTES

### Test Credentials
- **Admin**: `aditya` / `lola4304`
- **Test User**: `dipali@clubconcierge.in` / `lola4304`

### Key Files
- Pet Soul Core: `/app/backend/soul_intelligence.py`
- Pet Gate: `/app/backend/pet_gate_routes.py`
- Mira AI: `/app/backend/mira_routes.py`
- Pet Soul Journey: `/app/frontend/src/components/PetSoulJourney.jsx`

### Known Integrations (MOCKED)
- Razorpay: Using test keys

---

*Last Updated: January 21, 2026*

# The Doggy Company - Platform Integrity Audit
## "One Engine, 12 Pillars, Mira AI-Driven, Pet Soul-Based"

**Audit Date**: January 20, 2026

---

## Executive Summary

| Component | Status | Completeness |
|-----------|--------|--------------|
| 12 Pillars Built | ✅ | 100% |
| Pet Soul Integration | ⚠️ PARTIAL | 60% |
| Mira AI Integration | ⚠️ PARTIAL | 40% |
| Service Desk Integration | ⚠️ PARTIAL | 70% |
| Unified Inbox | ⚠️ PARTIAL | 50% |
| Data Flywheel | ❌ INCOMPLETE | 30% |

---

## 1. THE 12 PILLARS - Status

### ✅ COMPLETE (Have dedicated pages & backend)

| # | Pillar | Frontend Page | Backend Routes | Admin Manager | Theme |
|---|--------|--------------|----------------|---------------|-------|
| 1 | **Celebrate** | ProductListing.jsx | server.py (products) | ProductManager | Pink/Purple |
| 2 | **Dine** | DinePage.jsx | dine_routes.py | DineManager | Orange/Red |
| 3 | **Stay** | StayPage.jsx | stay_routes.py | StayManager | Green/Teal |
| 4 | **Travel** | TravelPage.jsx | travel_routes.py | TravelManager | Blue/Indigo |
| 5 | **Care** | CarePage.jsx | care_routes.py | CareManager | Red/Pink |
| 6 | **Enjoy** | EnjoyPage.jsx | enjoy_routes.py | EnjoyManager | Amber/Orange |
| 7 | **Fit** | FitPage.jsx | fit_routes.py | FitManager | Teal/Emerald |
| 8 | **Advisory** | AdvisoryPage.jsx | advisory_routes.py | AdvisoryManager | Violet/Purple |
| 9 | **Paperwork** | PaperworkPage.jsx | paperwork_routes.py | PaperworkManager | Blue/Indigo |
| 10 | **Emergency** | EmergencyPage.jsx | emergency_routes.py | EmergencyManager | Red/Urgent |
| 11 | **Shop Assist** | (Integrated via Mira) | server.py | (Mira handles) | N/A |
| 12 | **Club/Membership** | Membership.jsx | membership_routes.py | (WIP) | Gold/Premium |

---

## 2. PET SOUL INTEGRATION - Detailed Audit

### ✅ PILLARS WITH PET SOUL INTEGRATION

| Pillar | Fetches User Pets | Pet Selection UI | Writes to Pet Soul | Reads Pet Profile |
|--------|-------------------|------------------|--------------------|--------------------|
| **Travel** | ✅ Yes | ✅ Yes | ✅ Yes (pillar_history) | ⚠️ Partial |
| **Care** | ✅ Yes | ✅ Yes | ✅ Yes (soul.services) | ⚠️ Partial |
| **Emergency** | ✅ Yes | ✅ Yes | ✅ Yes (soul.emergencies) | ❌ No |
| **Paperwork** | ✅ Yes | ✅ Yes | ✅ Yes (soul.documents) | ❌ No |
| **Dine** | ✅ Yes | ✅ Yes | ❌ No | ❌ No |
| **Enjoy** | ✅ Yes | ✅ Yes | ✅ Yes (soul.experiences) | ❌ No |
| **Fit** | ✅ Yes | ✅ Yes | ❌ No | ❌ No |
| **Advisory** | ✅ Yes | ✅ Yes | ❌ No | ❌ No |

### ❌ PILLARS MISSING PET SOUL INTEGRATION

| Pillar | Issue |
|--------|-------|
| **Celebrate** | Uses ProductListing.jsx - NO pet selection, NO soul writing |
| **Stay** | Has booking but NO pet selection from user's pets, NO soul writing |
| **Shop Assist** | Handled by Mira - NO direct pet soul connection |
| **Club/Membership** | WIP - Not yet implemented |

### 🔴 CRITICAL GAPS

1. **No Pet Profile Pre-fetch**: Pillars don't call `/api/profile/{pet_id}/for-pillar/{pillar}` to get relevant pet data
2. **No Missing Field Prompts**: When pet soul has gaps, pillars don't prompt users to fill them
3. **Celebrate Pillar**: The flagship product (cakes) has ZERO pet soul integration
4. **Stay Pillar**: Doesn't use pet selection or capture travel preferences

---

## 3. MIRA AI INTEGRATION - Detailed Audit

### Current State
- **Mira Widget**: Present on all pages (except /admin, /agent, /login)
- **Mira Concierge Page**: `/concierge` - Full page chat experience
- **Backend**: `server.py` `/api/mira/chat` endpoint using GPT-4o

### ❌ MIRA AI GAPS

| Gap | Description | Impact |
|-----|-------------|--------|
| **No Pet Soul Fetch** | Mira doesn't fetch user's pet profiles | Can't personalize recommendations |
| **No Pillar-Aware Context** | Mira doesn't know which pillar user is browsing | Generic responses |
| **No Proactive Suggestions** | Mira doesn't suggest based on Pet Soul data | Missing "flywheel" benefit |
| **No Order History** | Mira doesn't see past orders/bookings | Can't build relationship |
| **Manual Data Collection** | Mira asks for pet info every time | Frustrating for returning users |

### What Mira DOES Have
- ✅ Web search (DuckDuckGo) for venue info
- ✅ Conversation history within session
- ✅ 9-step concierge flow
- ✅ Service Desk ticket creation on "I confirm"

### What Mira NEEDS

```
1. On chat start: Fetch user's pets from /api/pets/my-pets
2. Pass pet profiles to LLM context
3. Pass current page URL to know pillar context
4. Suggest based on Pet Soul missing fields
5. Cross-sell based on pillar history
```

---

## 4. SERVICE DESK INTEGRATION - Audit

### ✅ PILLARS CREATING TICKETS

| Pillar | Creates Ticket | Ticket Category | Priority Setting |
|--------|----------------|-----------------|------------------|
| Travel | ✅ Yes | travel | Based on request |
| Care | ✅ Yes | care | Based on urgency |
| Emergency | ✅ Yes | emergency | CRITICAL auto |
| Enjoy | ✅ Yes | enjoy | normal |
| Fit | ✅ Yes | fit | normal |
| Advisory | ✅ Yes | advisory | Based on type |
| Paperwork | ✅ Yes | paperwork | normal |
| Stay | ✅ Yes | stay | Based on booking |
| Membership | ✅ Yes | membership | Based on type |

### ❌ PILLARS NOT CREATING TICKETS

| Pillar | Issue |
|--------|-------|
| Celebrate | Uses standard checkout - no service desk integration |
| Dine | Restaurant discovery only - no booking tickets |
| Shop Assist | Handled by Mira |

---

## 5. UNIFIED INBOX INTEGRATION - Audit

### ✅ PILLARS ADDING TO UNIFIED INBOX

| Pillar | Adds to Inbox | inbox_item.type |
|--------|---------------|-----------------|
| Advisory | ✅ Yes | advisory_request |
| Emergency | ✅ Yes | emergency_request |
| Fit | ✅ Yes | fit_request |
| Paperwork | ✅ Yes | paperwork_request |

### ❌ PILLARS NOT ADDING TO UNIFIED INBOX

| Pillar | Should Add? |
|--------|-------------|
| Travel | YES - missing |
| Care | YES - missing |
| Stay | YES - missing |
| Enjoy | YES - missing |
| Dine | YES - missing |
| Celebrate | YES - missing |

---

## 6. DATA FLYWHEEL - Current State

### What SHOULD Happen (Vision)
```
User browses DINE → Pet Soul learns food preferences
User books STAY → Pet Soul learns travel habits
User orders CELEBRATE cake → Pet Soul learns treat preferences
Mira uses Pet Soul → Proactive recommendations
All interactions → Richer Pet Soul → Smarter Mira
```

### What ACTUALLY Happens
```
User browses DINE → Nothing saved
User books STAY → Nothing saved
User orders CELEBRATE → Order saved, minimal pet learning
Mira → Asks for pet info every time
Most interactions → Lost data → Dumb Mira
```

---

## 7. ACTION ITEMS - Priority Order

### 🔴 P0 - CRITICAL (Do First)

1. **Mira + Pet Soul Connection**
   - Fetch user's pets on chat start
   - Include pet profiles in LLM context
   - Stop asking for info we already have

2. **Celebrate Pillar Upgrade**
   - Add pet selection to cake ordering
   - Write order data to Pet Soul
   - Show personalized cake recommendations

3. **Stay Pillar Upgrade**
   - Add pet selection UI
   - Write booking data to Pet Soul
   - Read travel preferences from Soul

### 🟡 P1 - IMPORTANT (Do Second)

4. **Unified Inbox Completion**
   - Add to Travel, Care, Stay, Enjoy, Dine requests

5. **Pet Soul Read for Personalization**
   - Each pillar should read `/api/profile/{pet_id}/for-pillar/{pillar}`
   - Show "Complete your pet's profile" prompts for missing data

6. **Dine Pillar Upgrade**
   - Write restaurant visits to Pet Soul
   - Read food allergies/preferences

### 🟢 P2 - ENHANCEMENT (Do Third)

7. **Cross-Pillar Recommendations**
   - "Based on your Stay booking, here are travel products"
   - "Your pet had grooming at Care, try our Fit plans"

8. **Mira Proactive Mode**
   - "I see Max's vaccination is due - want me to book Care?"
   - "Bruno's birthday is coming - shall I show cakes?"

---

## 8. TECHNICAL IMPLEMENTATION NOTES

### Adding Pet Soul to a Pillar Page (Frontend Pattern)

```javascript
// 1. Fetch user's pets
const fetchUserPets = async () => {
  const response = await fetch(`${API_URL}/api/pets/my-pets`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  setUserPets(data.pets || []);
};

// 2. Fetch pet profile for this pillar
const fetchPetProfileForPillar = async (petId) => {
  const response = await fetch(`${API_URL}/api/profile/${petId}/for-pillar/dine`);
  const data = await response.json();
  // data.known_fields - what we know
  // data.missing_fields - what to ask
};

// 3. On request submit, capture to Pet Soul
const captureToSoul = async (petId, capturedData) => {
  await fetch(`${API_URL}/api/profile/${petId}/capture-from-pillar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pillar: 'dine',
      fields: capturedData,
      request_id: requestId
    })
  });
};
```

### Adding Mira Pet Context (Backend Pattern)

```python
# In /api/mira/chat
# 1. Check if user is logged in (from session or token)
# 2. Fetch their pets
# 3. Include in system prompt

user_pets = await db.pets.find({"user_id": user_id}, {"_id": 0}).to_list(10)
pet_context = f"USER'S PETS:\n{json.dumps(user_pets, default=str)}\n"
# Add to system_prompt
```

---

## 9. FILES TO MODIFY

### High Priority Modifications

| File | Changes Needed |
|------|----------------|
| `/app/backend/server.py` | Add pet context to Mira chat |
| `/app/frontend/src/components/MiraAI.jsx` | Pass user token, page URL |
| `/app/frontend/src/pages/StayPage.jsx` | Add pet selection, Soul integration |
| `/app/frontend/src/pages/ProductListing.jsx` | Add pet selection for Celebrate |
| `/app/backend/dine_routes.py` | Add Soul capture on restaurant visit |
| `/app/backend/stay_routes.py` | Add Soul capture on booking |

### Medium Priority Modifications

| File | Changes Needed |
|------|----------------|
| `/app/backend/travel_routes.py` | Add unified_inbox entry |
| `/app/backend/care_routes.py` | Add unified_inbox entry |
| `/app/backend/enjoy_routes.py` | Add unified_inbox entry |
| `/app/frontend/src/pages/DinePage.jsx` | Add Soul read for food preferences |

---

## 10. SUCCESS METRICS

After completing all fixes, we should see:

1. **Mira knows pets**: First message should greet by pet name
2. **Personalized recommendations**: "Based on Bruno's love for chicken..."
3. **No repeat questions**: Mira never asks breed/age if Soul has it
4. **Cross-pillar intelligence**: Enjoy page shows events based on Stay location
5. **Unified Inbox coverage**: All 12 pillars feed into single inbox
6. **Pet Soul completeness**: Each interaction adds data

---

**Next Step**: Choose which P0 item to tackle first. Recommend starting with **Mira + Pet Soul Connection** as it has the highest user impact.

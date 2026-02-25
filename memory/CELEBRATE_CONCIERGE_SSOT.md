# MIRA OS - SINGLE SOURCE OF TRUTH (SSOT)
## CELEBRATE CONCIERGE® LAYER - COMPLETE SPECIFICATION
### Last Updated: February 23, 2026

---

## ⚠️ CRITICAL: READ THIS ENTIRE DOCUMENT BEFORE MAKING ANY CHANGES

This document is the ONLY source of truth for the Celebrate Concierge® layer.
Do NOT deviate from these specifications.

---

## 1. UNIFIED SERVICE FLOW (NON-NEGOTIABLE)

```
User Intent (from anywhere: search, FAB, pillar page, chat)
    ↓
Service Desk Ticket Created
    ↓
Admin Notification (email + in-app)
    ↓
Member Notification (email + in-app)
    ↓
Ticket appears in:
    - Member: Dashboard → Inbox → Services
    - Admin: Admin Panel → Tickets
    ↓
Ticket thread for Q&A (questions asked HERE, not on card)
```

### Ticket Creation Payload (EXACT):
```json
{
  "type": "concierge_product" | "concierge_service",
  "pillar": "celebrate",
  "source": "curated_picks",
  "title": "{card.name} for {pet.name}",
  "pet_id": "{pet.id}",
  "card_id": "{card.id}",
  "ticket_category": "{card.ticket_category}",
  "status": "new",
  "priority": "normal",
  "details": {
    "card_name": "{card.name}",
    "pet_name": "{pet.name}",
    "pet_breed": "{pet.breed}",
    "why_for_pet": "{card.why_for_pet}"
  },
  "notifications": {
    "admin": true,
    "member": true
  }
}
```

### After Ticket Creation:
1. Show toast: "Request received! Check your Inbox."
2. Member sees ticket in Dashboard → Inbox immediately
3. Admin gets notification
4. Questions from `card.ticket_questions` are asked IN THE TICKET THREAD

---

## 2. THE 10-CARD CELEBRATE LIBRARY (HARDCODED)

### CONCIERGE® PRODUCTS (5 cards - Bespoke Deliverables)
CTA: "Create for {pet_name}" → Creates Ticket

#### Card 1: celebrate_custom_cake_design
```
ID: celebrate_custom_cake_design
Type: concierge_product
Name: Custom Celebration Cake Design
Description: A cake designed around {pet_name} - theme, portion, food rules, timed delivery.
Icon: Cake (Lucide)
Fallback Icon: Package (Lucide)
Why Concierge: Custom constraints + coordination
CTA Text: Create for {pet_name}
CTA Action: create_ticket
Ticket Category: celebrate_cake
Default Score: 70

Persona Affinity:
  - elegant: 0.9
  - photo_ready: 0.8
  - pampered: 0.85
  - foodie: 0.7
  - playful: 0.5
  - anxious: 0.4

Size Affinity:
  - small: 0.9
  - medium: 0.8
  - large: 0.7

Ticket Questions (asked in ticket thread):
  1. "What's the occasion + date/time?" (text)
  2. "Any food rules (allergies/sensitive tummy) and preferred protein?" (text)
  3. "Portion size based on pet size + guests?" (choice: Small, Medium, Large)
  4. "Theme vibe: playful or elegant?" (choice: Playful, Elegant)
```

#### Card 2: celebrate_bespoke_box
```
ID: celebrate_bespoke_box
Type: concierge_product
Name: Bespoke Celebration Box for {pet_name}
Description: A personalised box built around {pet_name}'s persona - treats, props, accessories.
Icon: Gift (Lucide)
Fallback Icon: Package (Lucide)
Why Concierge: Curated to pet personality
CTA Text: Create for {pet_name}
CTA Action: create_ticket
Ticket Category: celebrate_box
Default Score: 65

Persona Affinity:
  - elegant: 0.85
  - pampered: 0.9
  - photo_ready: 0.75
  - playful: 0.6
  - social: 0.5

Size Affinity:
  - small: 0.85
  - medium: 0.8
  - large: 0.75

Ticket Questions:
  1. "Playful or elegant vibe?" (choice: Playful, Elegant)
  2. "Any food rules/allergies?" (text)
  3. "Delivery date/time + city/area?" (text)
  4. "Any add-on: keepsake / outfit / photo props?" (multi_choice: Keepsake, Outfit, Photo props, None)
```

#### Card 3: celebrate_outdoor_pack
```
ID: celebrate_outdoor_pack
Type: concierge_product
Name: Outdoor Party Pack Built for Chaos
Description: Durable, safe, outdoor-ready celebration kit + cleanup essentials for active celebrations.
Icon: PartyPopper (Lucide)
Fallback Icon: Package (Lucide)
Why Concierge: Curated for outdoor durability + safety
CTA Text: Create for {pet_name}
CTA Action: create_ticket
Ticket Category: celebrate_outdoor
Default Score: 50 (ONLY for active dogs)

Persona Affinity:
  - playful: 0.95
  - energetic: 0.95
  - social: 0.9
  - adventurous: 0.85
  - elegant: 0.2 (NOT a fit)
  - anxious: 0.15 (NOT recommended)

Size Affinity:
  - small: 0.5
  - medium: 0.85
  - large: 0.95

Breed Affinity: labrador, golden retriever, beagle, border collie, australian shepherd

Ticket Questions:
  1. "Outdoor location (home terrace/park/café) and date/time?" (text)
  2. "How many humans + dogs?" (text)
  3. "Any triggers to avoid (noise, balloons, crowd)?" (text)
  4. "Any food rules/allergies?" (text)
```

#### Card 4: celebrate_photo_kit
```
ID: celebrate_photo_kit
Type: concierge_product
Name: Styled Photo Moment Kit
Description: Theme-matched backdrop + props + simple setup guide, all pet-safe.
Icon: Camera (Lucide)
Fallback Icon: Package (Lucide)
Why Concierge: Curated for aesthetic + pet comfort
CTA Text: Create for {pet_name}
CTA Action: create_ticket
Ticket Category: celebrate_photo_kit
Default Score: 60

Persona Affinity:
  - photo_ready: 0.95
  - elegant: 0.9
  - pampered: 0.85
  - calm: 0.7
  - playful: 0.6
  - anxious: 0.3 (minimal props version)

Size Affinity:
  - small: 0.9
  - medium: 0.8
  - large: 0.7

Ticket Questions:
  1. "Indoor or outdoor photos?" (choice: Indoor, Outdoor, Both)
  2. "Style: glam/elegant vs fun/playful?" (choice: Glam/Elegant, Fun/Playful)
  3. "Pet comfort: ok with props or prefers minimal?" (choice: Ok with props, Prefers minimal)
  4. "Delivery date/time?" (text)
```

#### Card 5: celebrate_keepsake_set
```
ID: celebrate_keepsake_set
Type: concierge_product
Name: Keepsake Memory Set
Description: Pawprint + name charm + memory note/box concept, curated for {pet_name}.
Icon: Sparkles (Lucide)
Fallback Icon: Package (Lucide)
Why Concierge: Personalized keepsake creation
CTA Text: Create for {pet_name}
CTA Action: create_ticket
Ticket Category: celebrate_keepsake
Default Score: 55

Persona Affinity:
  - pampered: 0.85
  - elegant: 0.8
  - senior: 0.9 (especially meaningful)
  - calm: 0.6
  - playful: 0.5

Size Affinity:
  - small: 0.85
  - medium: 0.8
  - large: 0.8

Ticket Questions:
  1. "Keepsake type?" (choice: Pawprint, Charm, Memory Box, All)
  2. "Name/engraving text (if any)?" (text)
  3. "Occasion/date (for inscription)?" (text)
  4. "Delivery address + timeline?" (text)
```

---

### CONCIERGE® SERVICES (5 cards - Arrangements Mira Executes)
CTA: "Request" → Creates Ticket

#### Card 6: celebrate_end_to_end
```
ID: celebrate_end_to_end
Type: concierge_service
Name: Plan the Celebration End-to-End
Description: Full plan: theme, cake, moments, schedule, add-ons, all coordination handled.
Icon: PartyPopper (Lucide)
Fallback Icon: Calendar (Lucide)
Why Concierge: Complete celebration orchestration
CTA Text: Request
CTA Action: create_ticket
Ticket Category: celebrate_planning
Default Score: 75 (HIGH value service)

Persona Affinity:
  - social: 0.9
  - playful: 0.85
  - energetic: 0.8
  - pampered: 0.85
  - elegant: 0.8
  - anxious: 0.4 (can adapt to quiet version)
  - senior: 0.6 (shorter, comfort-first version)

Size Affinity:
  - small: 0.8
  - medium: 0.85
  - large: 0.9

Ticket Questions:
  1. "Playful party or elegant party?" (choice: Playful, Elegant, Mix of both)
  2. "Date/time + city/area?" (text)
  3. "At home or venue?" (choice: At home, Venue, Not sure yet)
  4. "How many humans + dogs (if any)?" (text)
```

#### Card 7: celebrate_home_setup
```
ID: celebrate_home_setup
Type: concierge_service
Name: At-Home Setup + Safe Zones + Run-of-Show
Description: Calm, safe setup with a simple schedule and pet comfort plan.
Icon: Home (Lucide)
Fallback Icon: Calendar (Lucide)
Why Concierge: Pet-safe environment planning
CTA Text: Request
CTA Action: create_ticket
Ticket Category: celebrate_home_setup
Default Score: 60

Persona Affinity:
  - anxious: 0.9 (PERFECT for anxious pets)
  - calm: 0.85
  - elegant: 0.8
  - warms_up_slowly: 0.9
  - senior: 0.85
  - playful: 0.5
  - social: 0.4

Size Affinity:
  - small: 0.9
  - medium: 0.8
  - large: 0.7

Ticket Questions:
  1. "Indoor/outdoor + approximate space size?" (text)
  2. "Pet comfort: anxious/ok with guests?" (choice: Anxious - needs calm setup, Ok with guests, Warms up slowly)
  3. "Time window?" (choice: 30 mins, 1 hour, 2 hours)
  4. "Any must-haves: photo corner / cake moment / surprise?" (text)
```

#### Card 8: celebrate_photographer
```
ID: celebrate_photographer
Type: concierge_service
Name: Photographer Booking + Shoot Plan
Description: Book photographer + plan the session around {pet_name}'s temperament.
Icon: Camera (Lucide)
Fallback Icon: Calendar (Lucide)
Why Concierge: Pet-aware photography coordination
CTA Text: Request
CTA Action: create_ticket
Ticket Category: celebrate_photography
Default Score: 65

Persona Affinity:
  - photo_ready: 0.95
  - elegant: 0.85
  - playful: 0.8 (action shots)
  - energetic: 0.75 (action shots)
  - calm: 0.7
  - anxious: 0.4 (short session, familiar location)
  - senior: 0.6 (seated portraits)

Size Affinity:
  - small: 0.85
  - medium: 0.85
  - large: 0.85

Ticket Questions:
  1. "Home or outdoor location + city/area?" (text)
  2. "Pet style: action shots vs posed portraits?" (choice: Action shots, Posed portraits, Mix of both)
  3. "Any sensitivities (shy around strangers/flash/noise)?" (text)
  4. "Preferred time window?" (choice: Morning, Golden hour, Evening, Flexible)
```

#### Card 9: celebrate_venue
```
ID: celebrate_venue
Type: concierge_service
Name: Pet-Friendly Venue Reservation + Coordination
Description: Reserve the right table and prep staff for {pet_name}'s celebration.
Icon: Calendar (Lucide)
Fallback Icon: Calendar (Lucide)
Why Concierge: Venue vetting + pet-specific prep
CTA Text: Request
CTA Action: create_ticket
Ticket Category: celebrate_venue
Default Score: 55

Persona Affinity:
  - social: 0.9
  - adventurous: 0.85
  - playful: 0.8
  - calm: 0.6
  - anxious: 0.2 (NOT recommended)
  - senior: 0.4 (prefer home)

Size Affinity:
  - small: 0.9
  - medium: 0.8
  - large: 0.6 (harder to accommodate)

Ticket Questions:
  1. "City/area + preferred time/date?" (text)
  2. "Number of humans + pets?" (text)
  3. "Quiet corner vs lively vibe?" (choice: Quiet corner, Lively vibe, No preference)
  4. "Any special asks: water bowl, pet menu, cake permission?" (text)
```

#### Card 10: celebrate_quiet_plan
```
ID: celebrate_quiet_plan
Type: concierge_service
Name: Quiet Celebration Plan
Description: Low-stimulation plan: calm treats, gentle enrichment, controlled guest flow for {pet_name}.
Icon: Home (Lucide) 
Fallback Icon: Calendar (Lucide)
Why Concierge: Anxiety-aware celebration design
CTA Text: Request
CTA Action: create_ticket
Ticket Category: celebrate_quiet
Default Score: 40 (ONLY shown when traits match)

Persona Affinity:
  - anxious: 0.98 (PRIMARY fit)
  - warms_up_slowly: 0.95
  - noise_sensitive: 0.95
  - calm: 0.8
  - senior: 0.85
  - playful: 0.2 (NOT a fit)
  - social: 0.15 (NOT a fit)

Size Affinity:
  - small: 0.9
  - medium: 0.85
  - large: 0.8

Ticket Questions:
  1. "Known triggers (doorbell, strangers, balloons, loud music)?" (text)
  2. "Preferred celebration style?" (choice: Solo moment, 1-2 close guests, Small gathering 3-5)
  3. "Best time of day for your pet (post-walk/after nap)?" (text)
  4. "Any food rules/sensitive tummy?" (text)
```

---

## 3. MICRO-QUESTIONS (For Thin Profiles)

### Question 1: party_style
```
ID: party_style
Question: What style celebration would {pet_name} love?
Options:
  - "Playful & colorful" → maps to: [playful, social, energetic]
  - "Elegant & minimal" → maps to: [elegant, calm, photo_ready]
  - "Outdoor adventure" → maps to: [adventurous, playful, energetic]
  - "Quiet & cozy" → maps to: [calm, anxious, warms_up_slowly]
Icon: 🎉 (or PartyPopper Lucide)
```

### Question 2: guest_comfort
```
ID: guest_comfort
Question: How does {pet_name} feel about new people?
Options:
  - "Loves everyone!" → maps to: [social, friendly]
  - "Takes time to warm up" → maps to: [warms_up_slowly, cautious]
  - "Prefers familiar faces only" → maps to: [anxious, selective]
Icon: 👋 (or Users Lucide)
```

### Question 3: activity_level
```
ID: activity_level
Question: What's {pet_name}'s energy like during special moments?
Options:
  - "Bouncing off walls!" → maps to: [energetic, playful]
  - "Calm and composed" → maps to: [calm, elegant]
  - "Depends on the day" → maps to: [] (no strong signal)
Icon: ⚡ (or Zap Lucide)
```

---

## 4. SCORING LOGIC (HARDCODED)

### Base Score Calculation:
```
score = card.default_score (40-75)
```

### Soul Trait Affinity (+/- 30 max):
```
for each trait in pet.soul_traits:
    if trait in card.persona_affinity:
        weight = card.persona_affinity[trait]
        score += (weight - 0.5) * 40
        
score = min(score, base + 30)  # Cap at +30 from traits
```

### Size Affinity (+/- 10):
```
if pet.size in card.size_affinity:
    weight = card.size_affinity[pet.size]
    score += (weight - 0.5) * 20
```

### Breed Affinity (+10 if match):
```
if pet.breed in card.breed_affinity:
    score += 10
```

### Senior Comfort Modifier:
```
if pet.age_band == "senior":
    # BOOST comfort cards
    if card.id in ["celebrate_home_setup", "celebrate_quiet_plan", 
                   "celebrate_keepsake_set", "celebrate_custom_cake_design"]:
        score += 15
    
    # PENALIZE high-stimulation cards
    if card.id in ["celebrate_outdoor_pack", "celebrate_venue"]:
        if pet.is_still_active:  # has social/energetic traits
            score -= 5
        else:
            score -= 20
```

### Event Context Boost:
```
if event_type == "birthday" and "cake" in card.id:
    score += 10

if days_until_event <= 7:
    score += 5  # Urgency boost
```

### Final Score:
```
score = max(0, min(100, score))
```

---

## 5. "WHY FOR PET" GENERATION (HARDCODED)

### Trait → Explanation Mapping:
```python
TRAIT_EXPLANATIONS = {
    # Anxious/calm traits
    "anxious": "calm and gentle approach",
    "warms_up_slowly": "quiet-and-cozy style",
    "noise_sensitive": "low-stimulation preference",
    "calm": "peaceful celebration style",
    
    # Active/social traits
    "playful": "playful energy",
    "energetic": "high-energy spirit",
    "social": "love for socializing",
    "adventurous": "adventurous nature",
    
    # Elegant/pampered traits
    "elegant": "elegant taste",
    "pampered": "pampered lifestyle",
    "photo_ready": "photo-ready personality",
    
    # Comfort traits
    "senior": "comfort-first needs",
    "gentle": "gentle nature",
    
    # Food traits
    "foodie": "love of treats",
    "treats_motivated": "treat motivation",
}
```

### Generation Rules:
1. Use MATCHED traits first (traits that specifically matched this card)
2. If no match, use pet's actual SOUL TRAITS
3. NEVER hallucinate traits the pet doesn't have
4. NEVER default to "elegant" for anxious dogs like Lola

### Example Outputs:
```
Lola (anxious, warms_up_slowly):
  ✅ "Designed for Lola's quiet-and-cozy style"
  ✅ "Tailored for Lola's calm and gentle approach"
  ❌ "Perfect for Lola's elegant personality" (WRONG - Lola is NOT elegant)

Mystique (elegant, photo_ready):
  ✅ "Designed for Mystique's elegant taste"
  ✅ "Tailored for Mystique's photo-ready personality"

Buddy (playful, energetic):
  ✅ "Designed for Buddy's playful energy"
  ✅ "Tailored for Buddy's high-energy spirit"
```

---

## 6. API ENDPOINTS (EXACT SPEC)

### GET /api/mira/curated-set/{pet_id}/{pillar}

**Request:**
```
Headers:
  Authorization: Bearer {token}

Query Params:
  force_refresh: boolean (default: false)
  intent: string (optional)
  event_type: string (optional: "birthday", "gotcha_day")
```

**Response (EXACT SHAPE):**
```json
{
  "concierge_products": [
    {
      "id": "celebrate_custom_cake_design",
      "type": "concierge_product",
      "name": "Custom Celebration Cake Design",
      "description": "A cake designed around Lola - theme, portion, food rules, timed delivery.",
      "icon": "cake",
      "why_concierge": "Custom constraints + coordination",
      "cta_text": "Create for Lola",
      "cta_action": "create_ticket",
      "ticket_category": "celebrate_cake",
      "ticket_questions": [...],
      "_score": 78,
      "why_for_pet": "Designed for Lola's quiet-and-cozy style"
    }
  ],
  "concierge_services": [
    {
      "id": "celebrate_quiet_plan",
      "type": "concierge_service",
      "name": "Quiet Celebration Plan",
      "description": "Low-stimulation plan for Lola.",
      "icon": "home",
      "why_concierge": "Anxiety-aware celebration design",
      "cta_text": "Request",
      "cta_action": "create_ticket",
      "ticket_category": "celebrate_quiet",
      "ticket_questions": [...],
      "_score": 92,
      "why_for_pet": "Tailored for Lola's calm and gentle approach"
    }
  ],
  "question_card": {
    "type": "question_card",
    "id": "party_style",
    "question": "What style celebration would Lola love?",
    "options": ["Playful & colorful", "Elegant & minimal", "Outdoor adventure", "Quiet & cozy"],
    "icon": "party_popper",
    "cta_text": "Help Mira know better",
    "helper_text": "This will refine Lola's picks."
  },
  "meta": {
    "generated_at": "2026-02-23T12:00:00Z",
    "cache_expires_at": "2026-02-23T12:30:00Z",
    "pet_id": "pet-123",
    "pillar": "celebrate",
    "personalization_summary": "Personalized by soul traits: anxious, warms_up_slowly; breed: Maltese; size: small",
    "total_cards": 5
  }
}
```

### POST /api/mira/curated-set/answer

**Request:**
```json
{
  "pet_id": "pet-123",
  "question_id": "party_style",
  "answer": "Quiet & cozy"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Answer saved! Mira will use this to personalize your picks.",
  "mapped_traits": ["calm", "anxious", "warms_up_slowly"]
}
```

**Backend Logic:**
1. Look up question in CELEBRATE_MICRO_QUESTIONS
2. Get `maps_to_traits` for the selected answer
3. Add traits to pet.soul_traits
4. Add question_id to pet.answered_questions
5. Invalidate curated_picks_cache for this pet
6. Return mapped_traits (for frontend to know what changed)

---

## 7. FRONTEND RENDERING RULES (EXACT)

### Card Order (NO REORDERING):
```
1. question_card (if present) - ALWAYS FIRST
2. concierge_products (server order)
3. concierge_services (server order)
```

### Total Cards: 3-5 (NEVER EMPTY)
```
Minimum: 2 products + 1 service = 3 cards
Maximum: 3 products + 2 services = 5 cards
Plus: 0-1 question card (doesn't count toward limit)
```

### Labels (EXACT):
```
Products: "Concierge® Product"
Services: "Concierge® Service"
Question: "Mira asks"

Note: Always use ® after Concierge
```

### Card Component Structure:
```jsx
<Card>
  {/* Header */}
  <div className="flex items-start gap-3">
    <Icon />  {/* Lucide icon, NOT emoji */}
    <div>
      <Label>Concierge® Product</Label>  {/* or "Concierge® Service" */}
      <Title>{card.name}</Title>
    </div>
  </div>
  
  {/* Description */}
  <p>{card.description}</p>
  
  {/* Why for pet - MUST be truthful */}
  <p className="text-xs italic">{card.why_for_pet}</p>
  
  {/* CTA */}
  <Button onClick={createTicket}>
    {card.cta_text}  {/* "Create for Lola" or "Request" */}
  </Button>
</Card>
```

### Question Card Behavior:
```
1. User taps option
2. IMMEDIATELY:
   - Highlight selected option
   - Disable other options
   - Show "Saved" state
3. POST /api/mira/curated-set/answer
4. On success:
   - Show toast "Saved! Updating picks..."
   - Re-fetch curated set
   - Render new cards (user sees change)
5. On failure:
   - Show "Couldn't save. Tap to retry."
   - Keep old cards
```

### Question Card Helper Text:
```
Below the options, show:
"This will refine {pet_name}'s picks."
```

### Loading State:
```
Show 3-5 skeleton cards (pulse animation)
Match card heights
Keep header visible
```

### Error State:
```
Message: "Mira couldn't load picks right now."
Button: "Retry"
DO NOT show: "500 error" or technical messages
```

### Never Empty Rule:
```
If total_cards === 0 or arrays empty:
  Show 2 fallback cards (hardcoded)
  + Retry button
```

### Updated Microcopy:
```
At bottom of section:
"Updated {time_ago}"

Examples:
- "Updated just now"
- "Updated a moment ago"
- "Updated 5 min ago"
```

---

## 8. TICKET CREATION FLOW (EXACT)

### Frontend → Backend:
```javascript
const createTicket = async (card) => {
  const response = await fetch(`${API_URL}/api/service-requests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      type: card.type,  // "concierge_product" or "concierge_service"
      pillar: 'celebrate',
      source: 'curated_picks',
      title: `${card.name} for ${pet.name}`,
      pet_id: pet.id,
      card_id: card.id,
      ticket_category: card.ticket_category,
      details: {
        card_name: card.name,
        pet_name: pet.name,
        pet_breed: pet.breed,
        why_for_pet: card.why_for_pet,
        ticket_questions: card.ticket_questions
      },
      priority: 'normal',
      notifications: {
        admin: true,
        member: true
      }
    })
  });
  
  if (response.ok) {
    toast.success('Request received! Check your Inbox.');
  }
};
```

### Backend Service Request Handler:
```python
@router.post("/api/service-requests")
async def create_service_request(request: dict, db=Depends(get_db)):
    # 1. Create ticket
    ticket = {
        "type": request["type"],
        "pillar": request["pillar"],
        "source": request["source"],
        "title": request["title"],
        "pet_id": request["pet_id"],
        "card_id": request.get("card_id"),
        "ticket_category": request.get("ticket_category"),
        "details": request.get("details", {}),
        "status": "new",
        "priority": request.get("priority", "normal"),
        "created_at": datetime.now(timezone.utc),
        "member_id": current_user.id
    }
    
    result = await db.service_requests.insert_one(ticket)
    ticket_id = str(result.inserted_id)
    
    # 2. Send admin notification
    if request.get("notifications", {}).get("admin"):
        await send_admin_notification(
            type="new_service_request",
            title=f"New {request['type']}: {request['title']}",
            ticket_id=ticket_id
        )
    
    # 3. Send member notification
    if request.get("notifications", {}).get("member"):
        await send_member_notification(
            member_id=current_user.id,
            type="ticket_created",
            title=f"Request received: {request['title']}",
            message="We've received your request. Check your Inbox for updates.",
            ticket_id=ticket_id
        )
    
    return {"success": True, "ticket_id": ticket_id}
```

---

## 9. FILES TO MODIFY/CREATE

### Backend:
```
/app/backend/app/data/celebrate_concierge_cards.py - 10-card library + scoring
/app/backend/app/intelligence_layer.py - Curated set generation
/app/backend/mira_routes.py - API endpoints
```

### Frontend:
```
/app/frontend/src/components/Mira/CuratedConciergeSection.jsx - Main component
/app/frontend/src/pages/CelebratePage.jsx - Integration
/app/frontend/src/components/Mira/PersonalizedPicksPanel.jsx - FAB panel integration
```

---

## 10. ACCEPTANCE CRITERIA CHECKLIST

- [ ] Mystique vs Buddy shows different cards (NOT the same)
- [ ] Lola gets "quiet-and-cozy" or "calm" why_for_pet (NOT "elegant")
- [ ] 3-5 cards total (2-3 products + 1-2 services)
- [ ] Question card at TOP
- [ ] Question card is single-tap + locks + shows "Saved"
- [ ] After question answer, cards refresh immediately
- [ ] "Concierge® Product" and "Concierge® Service" labels (with ®)
- [ ] All CTAs create tickets
- [ ] Member gets notification after ticket creation
- [ ] Admin gets notification after ticket creation
- [ ] Ticket appears in member's Inbox
- [ ] "This will refine {pet}'s picks" helper text on question card
- [ ] "Updated a moment ago" footer
- [ ] Loading shows skeleton cards
- [ ] Error shows retry button
- [ ] Never shows empty state

---

## END OF SSOT - DO NOT DEVIATE FROM THIS SPECIFICATION

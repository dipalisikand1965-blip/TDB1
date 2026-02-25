# THE DOGGY COMPANY - DATA ARCHITECTURE
## Pet Life Operating System

---

## 🗄️ DATABASE: MongoDB (`doggy_company`)

### Core Collections

| Collection | Purpose | Key Fields |
|------------|---------|------------|
| `users` | Member accounts | email, name, phone, password_hash, is_member, loyalty_points, membership, credited_achievements |
| `pets` | Pet profiles & Soul data | id, name, breed, species, gender, owner_email, doggy_soul_answers, overall_score, pet_pass_number |
| `products` | Shop inventory | id, name, price, category, description, images, stock |
| `services` | Concierge services | name, pillar, base_price, category, concierge_service |

---

## 📊 DATA RELATIONSHIPS

```
┌─────────────┐       ┌─────────────┐
│   USERS     │──1:N──│    PETS     │
│  (members)  │       │ (profiles)  │
└─────────────┘       └─────────────┘
      │                      │
      │                      │
      ▼                      ▼
┌─────────────┐       ┌─────────────┐
│   ORDERS    │       │ SOUL DATA   │
│ (purchases) │       │ (answers)   │
└─────────────┘       └─────────────┘
```

---

## 🏛️ THE 14 PILLARS - Data Storage

| Pillar | Collection | Description |
|--------|------------|-------------|
| **Celebrate** | `celebrate_bundles` | Birthday parties, cakes |
| **Dine** | `dine_properties`, `dine_bundles` | Pet-friendly restaurants |
| **Stay** | `stay_properties` | Boarding, daycare, hotels |
| **Travel** | `services` (pillar=travel) | Pet travel services |
| **Care** | `services` (pillar=care) | Vet, grooming, health |
| **Enjoy** | `services` (pillar=enjoy) | Parks, activities |
| **Fit** | `services` (pillar=fit) | Training, walking |
| **Learn** | `services` (pillar=learn) | Puppy school |
| **Paperwork** | `services` (pillar=paperwork) | Licenses, certificates |
| **Advisory** | `services` (pillar=advisory) | Expert consultation |
| **Emergency** | `services` (pillar=emergency) | 24/7 emergency |
| **Farewell** | `services` (pillar=farewell) | End-of-life care |
| **Adopt** | `adopt_shelters`, `adoption_events` | Adoption services |
| **Shop** | `products`, `unified_products` | Pet products |

---

## 🧠 MIRA & PULSE DATA

### Where Conversations Are Stored

| Data Type | Collection | Purpose |
|-----------|------------|---------|
| Chat History | `mira_tickets` | Conversation threads |
| Memories | `mira_memories` | Relationship memories (preferences, past interactions) |
| Tickets | `concierge_queue` | Escalated requests |
| Intent Logs | `mira_intent_logs` | Pulse → Mira handoffs |

### Mira Memory Structure
```javascript
{
  member_id: "user-123",
  pet_id: "pet-456",
  pet_name: "Mojo",
  memory_type: "preference", // or "interaction", "note"
  content: "Mojo loves chicken treats but is allergic to beef",
  created_at: ISODate()
}
```

---

## 🐕 PET SOUL DATA (`doggy_soul_answers`)

Stored inside each pet document:

```javascript
// Inside pets collection
{
  id: "pet-123",
  name: "Mojo",
  breed: "Indie",
  owner_email: "dipali@clubconcierge.in",
  overall_score: 37.8,  // Soul Score percentage
  
  doggy_soul_answers: {
    // Basic Info
    "name": "Mojo",
    "breed": "Indie Dog",
    "gender": "male",
    "dob": "2020-03-15",
    
    // Personality
    "temperament": "Playful and energetic",
    "social_with_dogs": "Very friendly",
    "social_with_humans": "Loves everyone",
    
    // Health
    "allergies": "chicken",
    "medications": "none",
    "vet_comfort": "Calm and relaxed",
    
    // Preferences
    "favorite_treat": "Peanut butter biscuits",
    "favorite_toy": "Squeaky ball",
    "sleep_spot": "On the bed"
    // ... 50+ possible fields
  }
}
```

---

## 💰 ORDERS & TRANSACTIONS

| Collection | Purpose |
|------------|---------|
| `orders` | Purchase orders (when created) |
| `concierge_orders` | Service bookings |
| `cart` | Shopping cart items |

---

## 🔐 ADMIN DATA

| Collection | Purpose |
|------------|---------|
| `admin_credentials` | Admin login |
| `admin_config` | System settings |
| `service_desk_settings` | Ticket queue config |

---

## 📍 CURRENT DATABASE STATUS

```
Collections: 15
Total Documents: ~100
Primary User: dipali@clubconcierge.in
Pets Registered: 6
Products: 26
Services: 8
Stay Properties: 32
```

---

## 🔄 DATA FLOW

```
User Action → Frontend → API → MongoDB → Response
     │
     ├── Order → orders collection
     ├── Chat → mira_tickets / mira_memories
     ├── Pet Update → pets.doggy_soul_answers
     └── Service Book → concierge_orders
```

---

## 📝 NOTES

1. **Pet Soul Answers** are embedded in the `pets` document (not separate collection)
2. **Tickets** are created on-demand (orders, chats, escalations)
3. **Mira Memories** persist across sessions for personalization
4. **Pulse** captures voice intent → structures it → hands to Mira

# MIRA OS - Product/Service Recommendation Architecture

**Purpose:** Define the intelligent flow for product and service recommendations
**Status:** 🔴 IN DESIGN
**Last Updated:** February 9, 2026

---

## Current Architecture (Problem)

```
User Query → Mira Response → Random Products from DB → Display
```

**Issues:**
1. Products not linked to user intent/pillar
2. Services from generic database, not contextual
3. If product not in catalog, no fallback
4. No smooth Concierge handoff

---

## New Architecture (Solution)

```
User Query 
    ↓
Intent Detection (What does user want?)
    ↓
Pillar Mapping (Which pillar handles this?)
    ↓
Catalog Lookup (Do we have this product/service?)
    ├── YES → Show from Catalog with "Add to Cart" / "Request Concierge"
    └── NO → Generate Smart Suggestion Card → Concierge Request on Click
```

---

## Detailed Flow

### 1. Intent Detection
```javascript
// Detect what the user is looking for
const intents = {
  BUY_PRODUCT: ['buy', 'get', 'order', 'purchase', 'need', 'want', 'looking for'],
  BOOK_SERVICE: ['book', 'schedule', 'appointment', 'arrange', 'find a'],
  LEARN: ['how to', 'what is', 'tell me about', 'explain'],
  COMPARE: ['which is better', 'compare', 'difference between'],
  RECOMMEND: ['suggest', 'recommend', 'best for', 'good for']
};
```

### 2. Pillar Mapping
```javascript
const PILLAR_PRODUCTS_SERVICES = {
  celebrate: {
    products: ['birthday cakes', 'party hats', 'bandanas', 'treats', 'toys'],
    services: ['pet photography', 'party planning', 'venue booking']
  },
  dine: {
    products: ['dog food', 'treats', 'supplements', 'bowls', 'feeders'],
    services: ['nutrition consultation', 'diet planning']
  },
  care: {
    products: ['medicines', 'supplements', 'first aid', 'tick/flea treatment'],
    services: ['vet consultation', 'checkup', 'vaccination']
  },
  grooming: {
    products: ['shampoo', 'brush', 'nail clipper', 'ear cleaner'],
    services: ['grooming appointment', 'spa session']
  },
  travel: {
    products: ['carrier', 'harness', 'travel bowl', 'seat cover'],
    services: ['pet taxi', 'hotel booking', 'boarding']
  },
  enjoy: {
    products: ['toys', 'puzzle feeders', 'balls', 'frisbees'],
    services: ['dog walking', 'daycare', 'playdate arrangement']
  },
  training: {
    products: ['training treats', 'clicker', 'leash'],
    services: ['trainer booking', 'behavior consultation']
  },
  stay: {
    products: ['bed', 'crate', 'calming aids'],
    services: ['separation anxiety consultation']
  }
};
```

### 3. Catalog Lookup
```javascript
// Check if product/service exists in our database
const lookupCatalog = async (pillar, itemType, searchTerm) => {
  const db = getDb();
  
  if (itemType === 'product') {
    const products = await db.products.find({
      $or: [
        { name: { $regex: searchTerm, $options: 'i' } },
        { category: pillar },
        { tags: { $in: PILLAR_PRODUCTS_SERVICES[pillar].products } }
      ]
    }).limit(4).toArray();
    
    return { found: products.length > 0, items: products };
  }
  
  if (itemType === 'service') {
    const services = await db.services.find({
      pillar: pillar
    }).limit(4).toArray();
    
    return { found: services.length > 0, items: services };
  }
};
```

### 4. Smart Suggestion Card (Fallback)
When product/service not in catalog, generate intelligent suggestion:

```javascript
const generateSmartSuggestion = (userQuery, pillar, context) => {
  return {
    type: 'smart_suggestion',
    title: extractProductName(userQuery), // "Premium Dog Food"
    description: generateDescription(userQuery, context), // "Based on Buddy's needs..."
    icon: getPillarIcon(pillar), // 🍖 for food
    pillar: pillar,
    action: 'concierge_request',
    request_template: {
      type: 'product_sourcing',
      item: extractProductName(userQuery),
      pet_context: context.pet,
      user_notes: userQuery,
      urgency: 'normal'
    },
    card_style: {
      gradient: getPillarGradient(pillar),
      showConfirmation: true
    }
  };
};
```

### 5. UI Display

#### A. Product Found in Catalog
```jsx
<ProductCard>
  <ProductImage />
  <ProductName />
  <ProductPrice />
  <Button>Add to Cart</Button>
  <Button variant="outline">Ask Concierge</Button>
</ProductCard>
```

#### B. Service Found in Catalog
```jsx
<ServiceCard>
  <ServiceIcon />
  <ServiceName />
  <ServicePrice range />
  <Button>Request Booking</Button>
</ServiceCard>
```

#### C. Smart Suggestion (Not in Catalog)
```jsx
<SmartSuggestionCard gradient={pillar}>
  <Icon>{pillar_icon}</Icon>
  <Title>"Looking for {item}?"</Title>
  <Description>"We don't have this in our catalog yet, but our Concierge can source it for you!"</Description>
  <Button onClick={confirmAndSendToConcierge}>
    Let Concierge Handle This
  </Button>
</SmartSuggestionCard>
```

---

## Concierge Request Flow

When user clicks "Let Concierge Handle This":

1. **Show Confirmation Modal**
```jsx
<ConfirmationModal>
  <Title>Confirm Request</Title>
  <Summary>
    Item: {item_name}
    For: {pet.name}
    Any specific requirements? [optional text field]
  </Summary>
  <Button onClick={sendToConcierge}>Send to Concierge</Button>
  <Button variant="ghost">Cancel</Button>
</ConfirmationModal>
```

2. **Create Ticket in Backend**
```javascript
{
  type: 'concierge',
  subtype: 'product_sourcing',
  status: 'open',
  pet_id: pet.id,
  user_id: user.id,
  request: {
    item: 'Premium Organic Dog Food',
    pillar: 'dine',
    user_notes: 'Looking for grain-free options',
    budget: null, // Can add budget field
    urgency: 'normal'
  },
  created_at: new Date()
}
```

3. **Show Success Message**
```jsx
<SuccessToast>
  Your request has been sent to your Concierge! 
  They'll reach out within 24 hours.
</SuccessToast>
```

---

## Implementation Checklist

### Backend
- [ ] Add `detect_product_service_intent()` function
- [ ] Create `lookup_catalog()` endpoint
- [ ] Add `generate_smart_suggestion()` function
- [ ] Create `create_concierge_sourcing_request()` endpoint

### Frontend
- [ ] Create `<SmartSuggestionCard />` component
- [ ] Create `<ConciergeConfirmModal />` component
- [ ] Update product display logic to use new flow
- [ ] Add pillar-based styling for suggestion cards

### Database
- [ ] Add `pillar` field to products collection
- [ ] Add `tags` field for better search
- [ ] Create index on product categories

---

## Pillar Icons & Gradients

| Pillar | Icon | Gradient |
|--------|------|----------|
| celebrate | 🎂 | pink-500 to rose-500 |
| dine | 🍖 | amber-500 to orange-500 |
| care | 🏥 | violet-500 to purple-500 |
| grooming | ✂️ | cyan-500 to teal-500 |
| travel | ✈️ | blue-500 to indigo-500 |
| enjoy | 🎾 | green-500 to emerald-500 |
| training | 🎓 | yellow-500 to amber-500 |
| stay | 🏠 | slate-500 to gray-500 |

---

*This architecture ensures users always get a path forward, even when products aren't in our catalog.*

# UNIVERSAL PILLAR PROTOCOL
## The Doggy Company - Pet Life Operating System

**Last Updated**: January 27, 2025

---

## 🎯 Purpose

This document defines the standard protocol to ensure ALL 14 PILLARS are consistently represented across the entire system. Run these checks and seeds after every deployment.

---

## 📋 THE 14 PILLARS

| # | Pillar | Description | Product Types |
|---|--------|-------------|---------------|
| 1 | **Celebrate** | Cakes, treats, party planning | Products + Services |
| 2 | **Stay** | Hotels, boarding, daycare | Products + Services |
| 3 | **Travel** | Pet transport, relocation | Products + Services |
| 4 | **Feed** | Fresh meals, nutrition | Products + Services |
| 5 | **Care** | Grooming, walking, sitting | Products + Services |
| 6 | **Fit** | Fitness, weight management | Products + Services |
| 7 | **Learn** | Training, behavior | Products + Services |
| 8 | **Enjoy** | Parks, cafes, adventures | Products + Services |
| 9 | **Groom** | Professional grooming | Products + Services |
| 10 | **Adopt** | Adoption services | Products + Services |
| 11 | **Farewell** | End of life services | Products + Services |
| 12 | **Dine** | Pet-friendly restaurants | Products + Services |
| 13 | **Insure** | Pet insurance | Services |
| 14 | **Shop** | General pet products | Products |

---

## ✅ UNIVERSAL SEED CHECKLIST

Every deployment MUST ensure:

### 1. **Products Collection** (`products`)
- [ ] All 14 pillars have at least 3 products each
- [ ] Products have: `id`, `name`, `description`, `price`, `pillar`, `category`, `tags`, `in_stock`

### 2. **Services Collection** (`services`)
- [ ] All 14 pillars have at least 2 concierge services
- [ ] Services have: `id`, `name`, `description`, `price`, `pillar`, `duration`, `features`, `is_active`

### 3. **Unified Product Box** (`unified_products`)
- [ ] All products migrated with `primary_pillar` assigned
- [ ] Product types correctly set (physical, digital, service)

### 4. **Pricing Tiers** (`pricing_tiers`)
- [ ] At least 4 tiers: Basic, Member, Premium, VIP
- [ ] Each tier applies to all 14 pillars

### 5. **Shipping Rules** (`shipping_rules`)
- [ ] Standard, Express, Same Day delivery options
- [ ] Service/Digital delivery for non-physical products

### 6. **Stay Properties Sync**
- [ ] `stay_properties` synced to `products` collection
- [ ] `stay_boarding_facilities` synced to `products` collection

---

## 🚀 DEPLOYMENT SEED COMMANDS

### Option 1: API Endpoint (Recommended)
```bash
# Universal seed - all pillars, products, services
curl -X POST https://YOUR_DOMAIN/api/admin/universal-seed

# Force seed credentials (if login issues)
curl -X POST https://YOUR_DOMAIN/api/admin/force-seed-credentials
```

### Option 2: Admin Dashboard
1. Go to Admin → Product Box
2. Click **"Seed All"** button
3. Wait for confirmation toast

### Option 3: Script (Backend)
```bash
cd /app/backend
python3 scripts/universal_pillar_protocol.py
```

---

## 🔄 DATA FLOW VERIFICATION

After seeding, verify these flows work:

### Products → Shop Pages
- `/shop?pillar=stay` shows Stay products
- `/shop?pillar=travel` shows Travel products
- All 14 pillar pages accessible via `/shop?pillar={pillar}`

### Products → Product Box Admin
- Admin → Product Box shows all products
- Stats at top refresh correctly
- Pillar filters work

### Products → Pricing Hub
- Admin → Pricing Hub shows pricing tiers
- All pillars have pricing rules applied

### Services → Concierge Pickers
- Each pillar page shows Concierge Picker
- Service cards display correctly
- Booking creates Service Desk ticket

### Orders → Command Center
- Orders appear in Order Manager
- Orders appear in Service Desk
- Orders appear in Member History
- Orders linked to Pet Profile

---

## 🛠️ TROUBLESHOOTING

### Products Not Showing
1. Check `pillar` field is set correctly
2. Run: `curl https://YOUR_DOMAIN/api/products?pillar=stay`
3. If empty, run universal-seed

### Product Box Empty
1. Run migration: `curl -X POST https://YOUR_DOMAIN/api/product-box/migrate-from-products`
2. Check `unified_products` collection

### Services Not Loading
1. Check `services` collection has data
2. Run: `curl https://YOUR_DOMAIN/api/services?pillar=celebrate`
3. If empty, run universal-seed

### Stay Page Empty
1. Check `stay_properties` collection
2. Run stay sync: `curl -X POST https://YOUR_DOMAIN/api/admin/stay/sync-to-products`

---

## 📊 MONITORING SCRIPT

Run this to check system health:

```python
# /app/backend/scripts/health_check.py
ALL_PILLARS = ['celebrate', 'stay', 'travel', 'feed', 'care', 'fit', 
               'learn', 'enjoy', 'groom', 'adopt', 'farewell', 'dine', 
               'insure', 'shop']

for pillar in ALL_PILLARS:
    products = await db.products.count_documents({'pillar': pillar})
    services = await db.services.count_documents({'pillar': pillar})
    status = '✅' if products > 0 and services > 0 else '❌'
    print(f'{status} {pillar}: {products} products, {services} services')
```

---

## 📝 ADDING NEW PILLAR (Future)

1. Add to `ALL_PILLARS` list in `universal_pillar_protocol.py`
2. Add default products and services
3. Create pillar page component
4. Add route in `App.js`
5. Add to navigation menu
6. Add Concierge Picker
7. Run universal-seed
8. Test full flow

---

## 📞 CONTACTS

- **Data Issues**: Check `/app/backend/scripts/universal_pillar_protocol.py`
- **UI Issues**: Check `/app/frontend/src/components/`
- **API Issues**: Check `/app/backend/server.py`

---

*This protocol ensures The Doggy Company's Pet Life Operating System maintains data integrity across all 14 pillars.*

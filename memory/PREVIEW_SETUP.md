# 🚀 Preview Environment Setup Checklist

**IMPORTANT: Run this checklist EVERY TIME you start a new session on this project!**

The preview environment uses a LOCAL MongoDB that starts empty. You MUST sync data from production to work properly.

---

## Step-by-Step Setup

### 1️⃣ Login to Admin
- Go to: `https://[preview-url]/admin`
- Login with: `aditya` / `lola4304` (twice - route guard + admin panel)

### 2️⃣ Master Sync (Products & Services)
- In Admin Panel, find **"Master Sync"** toggle/button
- Enable it for **Products** and **Services**
- Wait for sync to complete (~30 seconds)

### 3️⃣ Seed Pillar Pages
Go to each pillar page in admin and click "Seed Defaults":
- [ ] Celebrate
- [ ] Dine  
- [ ] Stay
- [ ] Travel
- [ ] Care
- [ ] Enjoy
- [ ] Fit
- [ ] Learn
- [ ] Paperwork
- [ ] Advisory
- [ ] Emergency
- [ ] Farewell
- [ ] Adopt
- [ ] Shop

### 4️⃣ Seed Service Box
- Go to Admin → **Service Box**
- Click **"Seed All"** or **"Sync Services"**

### 5️⃣ Seed Concierge Experiences
- Go to Admin → **Concierge / Experiences**
- Click **"Seed Experiences"** or similar

---

## Quick Verification

After setup, verify data exists:
```bash
# Check products count
curl -s "$REACT_APP_BACKEND_URL/api/product-box/stats" | python3 -c "import sys,json; print('Products:', json.load(sys.stdin).get('total_products', 0))"

# Check services count  
curl -s "$REACT_APP_BACKEND_URL/api/service-box/stats" | python3 -c "import sys,json; print('Services:', json.load(sys.stdin).get('total', 0))"
```

Expected: ~2000+ products, ~1000+ services

---

## Why This Is Needed

1. **Preview uses LOCAL MongoDB** - Starts empty each session
2. **Production data is on MongoDB Atlas** - Preview can't connect (IP whitelist)
3. **Master Sync** pulls data from Shopify + seeds from production exports
4. **Without this setup**, admin panels show empty lists and features won't work

---

## Credentials Reference

| System | Username | Password |
|--------|----------|----------|
| Admin Route Guard | aditya | lola4304 |
| Admin Panel | aditya | lola4304 |
| Test User | dipali@clubconcierge.in | test123 |

---

*Last updated: March 2026*

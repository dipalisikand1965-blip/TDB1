# 🚀 DEPLOY CHECKLIST - February 18, 2026

## ⚠️ CRITICAL: Before EVERY Deploy

```bash
# 1. Check and fix frontend URL
cat /app/frontend/.env | grep REACT_APP_BACKEND_URL
# Should show: REACT_APP_BACKEND_URL=https://thedoggycompany.in

# 2. If it shows preview URL, FIX IT:
sed -i 's|REACT_APP_BACKEND_URL=.*|REACT_APP_BACKEND_URL=https://thedoggycompany.in|' /app/frontend/.env

# 3. Restart frontend
sudo supervisorctl restart frontend

# 4. Click DEPLOY in Emergent UI
```

---

## ✅ WHAT'S READY TO DEPLOY

### 1. PICKS Panel Dynamic Shelves
- [x] Intent-Driven shelf ("Lola needs this for {intent}")
- [x] Personalized shelf ("✨ Personalized for Lola")
- [x] Celebrate shelf (birthday items)
- [x] Smart fallback picks (breed + seasonal intelligence)

### 2. MOJO Bible P1 Fields
- [x] Weight History API (`/api/pet-soul/profile/{pet_id}/weight-history`)
- [x] Training Progress API (`/api/pet-soul/profile/{pet_id}/training-history`)
- [x] Environment/Climate API (`/api/pet-soul/profile/{pet_id}/environment`)

### 3. Pet-First Language
- [x] "Golden Retrievers like Lola love this" (not generic)
- [x] Seasonal intelligence (monsoon prep, summer heat)
- [x] Life stage awareness (puppy/adult/senior)

---

## ⚠️ KNOWN ISSUES (Post-Deploy Debug)

### Intent Capture Not Working
- `user_learn_intents` collection is EMPTY
- Chat messages not storing intents
- Needs: Debug `learn_intent_bridge.py` integration

### City Not Persisted
- Mumbai shows from browser geolocation
- Pet profile has `city: null`
- Needs: Add city field to onboarding

---

## 📋 POST-DEPLOY VERIFICATION

```bash
# 1. Test PICKS API
curl -s "https://thedoggycompany.in/api/mira/top-picks/Lola" | python3 -c "
import sys,json; d=json.load(sys.stdin)
print('Timely picks:', len(d.get('timely_picks',[])))
print('Personalized:', d.get('personalized',{}).get('has_products'))
"

# 2. Test Login
curl -s -X POST "https://thedoggycompany.in/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"dipali@clubconcierge.in","password":"test123"}' | python3 -c "
import sys,json; print('Login:', 'OK' if json.load(sys.stdin).get('token') else 'FAIL')
"

# 3. Visual check
# Go to thedoggycompany.in/mira-demo
# Login → Click PICKS → Should see:
#   - "Lola might need this" (timely/smart fallback)
#   - "Personalized for Lola" (custom products)
#   - Pillar-specific picks
```

---

## 🎯 SUCCESS CRITERIA

After deploy, PICKS panel should show:
1. ✅ Personalized products shelf (mugs, coasters, etc.)
2. ✅ Smart fallback picks (based on breed/season)
3. ✅ Mira's Picks + Concierge Arranges (pillar-based)

---

## 📞 IF SOMETHING BREAKS

1. **Blank page**: Check `REACT_APP_BACKEND_URL` - probably reset to preview
2. **API errors**: Check backend logs: `tail -100 /var/log/supervisor/backend.err.log`
3. **Missing shelves**: Verify API returns data: `curl .../api/mira/top-picks/Lola`

---

*Last Updated: February 18, 2026*

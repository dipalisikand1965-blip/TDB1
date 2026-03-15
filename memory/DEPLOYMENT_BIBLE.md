# 🚨 DEPLOYMENT BIBLE - THE DOGGY COMPANY 🚨

## READ THIS BEFORE EVERY DEPLOYMENT

---

## 🔴🔴🔴 CRITICAL INCIDENT - MARCH 3, 2026 🔴🔴🔴

### What Happened
Production showed **"No pets found"** for ALL users. Backend was working perfectly.
User lost access to all 8 pets including Mystique (recently passed pet - emotionally devastating).

### Root Cause
`REACT_APP_BACKEND_URL` was set to a **DEAD preview URL** that returned 404:
```
❌ DEPLOYED WITH: https://celebrate-products.preview.emergentagent.com (DOESN'T EXIST!)
✅ SHOULD BE: https://thedoggycompany.com
```

### How We Found It
Browser console showed:
```
Failed to load resource: 404 at https://celebrate-products.preview.emergentagent.com/api/auth/me
```

### LESSON LEARNED
**ALWAYS verify the frontend calls the RIGHT backend before deploying!**

---

## ⚠️ CRITICAL FIX #1: Frontend Backend URL

### The Problem
Each new Emergent session/fork **RESETS** the frontend `.env` to preview URL.
Your production site will show OLD content because it's calling the WRONG backend.

### The Symptom
- Preview (Emergent) shows new features ✅
- Production (thedoggycompany.com) shows old content or "No pets found" ❌
- **YOUR WORK IS NOT GONE** - just wrong URL!

### The Fix (DO THIS EVERY TIME BEFORE DEPLOY)

```bash
# 1. Check current URL
cat /app/frontend/.env | grep REACT_APP_BACKEND_URL

# 2. If it shows preview URL (like https://celebrate-products.preview.emergentagent.com), FIX IT:
sed -i 's|REACT_APP_BACKEND_URL=.*|REACT_APP_BACKEND_URL=https://thedoggycompany.com|' /app/frontend/.env

# 3. Restart frontend to pick up changes
sudo supervisorctl restart frontend

# 4. NOW DEPLOY from Emergent UI
```

### Quick Reference

| Environment | REACT_APP_BACKEND_URL |
|-------------|----------------------|
| Preview | `https://celebrate-products.preview.emergentagent.com` (varies) |
| **PRODUCTION** | **`https://thedoggycompany.com`** |

---

## 📋 Pre-Deployment Checklist

- [ ] ⚠️ **CRITICAL:** Fixed `REACT_APP_BACKEND_URL` to `https://thedoggycompany.com`
- [ ] Restarted frontend (`sudo supervisorctl restart frontend`)
- [ ] Tested on preview that features work
- [ ] Clicked Deploy in Emergent
- [ ] **POST-DEPLOY:** Open production site, check browser console for 404 errors

---

## 🔑 Production Credentials

| Service | URL | Credentials |
|---------|-----|-------------|
| Admin | thedoggycompany.com/admin | aditya / lola4304 |
| Member | thedoggycompany.com/mira-demo | dipali@clubconcierge.in / test123 |

---

## 🐛 Common "It's Not Working" Issues

### Issue: "No pets found" on production
**Cause:** `REACT_APP_BACKEND_URL` pointing to dead/wrong URL
**Debug:** Open DevTools Console, look for 404 errors on API calls
**Fix:** See Critical Fix #1 above

### Issue: Production shows old UI
**Cause:** `REACT_APP_BACKEND_URL` pointing to preview
**Fix:** See Critical Fix #1 above

### Issue: API calls fail on production
**Cause:** CORS or wrong backend URL
**Fix:** Check backend logs, verify URL in frontend .env

### Issue: Features work in preview but not production
**Cause:** 99% of the time it's the backend URL
**Fix:** See Critical Fix #1 above

---

*Last Updated: March 3, 2026*
*Remember: Your work is NEVER gone, it's just pointing to the wrong place!*

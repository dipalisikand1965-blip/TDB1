# 🚨 DEPLOYMENT BIBLE - THE DOGGY COMPANY 🚨

## READ THIS BEFORE EVERY DEPLOYMENT

---

## ⚠️ CRITICAL FIX #1: Frontend Backend URL

### The Problem
Each new Emergent session/fork **RESETS** the frontend `.env` to preview URL.
Your production site will show OLD content because it's calling the WRONG backend.

### The Symptom
- Preview (Emergent) shows new features ✅
- Production (thedoggycompany.in) shows old content ❌
- **YOUR WORK IS NOT GONE** - just wrong URL!

### The Fix (DO THIS EVERY TIME BEFORE DEPLOY)

```bash
# 1. Check current URL
cat /app/frontend/.env | grep REACT_APP_BACKEND_URL

# 2. If it shows preview URL (like https://pet-intent.preview.emergentagent.com), FIX IT:
sed -i 's|REACT_APP_BACKEND_URL=.*|REACT_APP_BACKEND_URL=https://thedoggycompany.in|' /app/frontend/.env

# 3. Restart frontend to pick up changes
sudo supervisorctl restart frontend

# 4. NOW DEPLOY from Emergent UI
```

### Quick Reference

| Environment | REACT_APP_BACKEND_URL |
|-------------|----------------------|
| Preview | `https://pet-intent.preview.emergentagent.com` |
| **PRODUCTION** | **`https://thedoggycompany.in`** |

---

## 📋 Pre-Deployment Checklist

- [ ] Fixed `REACT_APP_BACKEND_URL` to production URL
- [ ] Restarted frontend (`sudo supervisorctl restart frontend`)
- [ ] Tested on preview that features work
- [ ] Clicked Deploy in Emergent

---

## 🔑 Production Credentials

| Service | URL | Credentials |
|---------|-----|-------------|
| Admin | thedoggycompany.in/admin | aditya / lola4304 |
| Member | thedoggycompany.in/mira-demo | dipali@clubconcierge.in / test123 |

---

## 🐛 Common "It's Not Working" Issues

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

*Last Updated: February 18, 2026*
*Remember: Your work is NEVER gone, it's just pointing to the wrong place!*

# 🚨 CRITICAL HANDOVER - March 13, 2026 🚨

## URGENT: SITE HAS DUPLICATE IMAGE PROBLEM

### THE PROBLEM
**569 products across the site have DUPLICATE/SAME images** - the same stock photo appears on completely different products. This affects:
- shop: 351 products
- stay: 58 products  
- care: 49 products
- travel: 33 products
- fit: 16 products
- And more...

### FIX IN PROGRESS
A background script is running to regenerate ALL bad images:
- **Script**: `/app/backend/scripts/fix_all_product_images.py`
- **Log**: `/tmp/fix_all_images.log`
- **Progress**: ~33 fixed so far, 500+ remaining
- **ETA**: Several hours (rate limited)

**Check progress:**
```bash
tail -f /tmp/fix_all_images.log
grep -c "Fixed:" /tmp/fix_all_images.log
```

**If script stopped, restart:**
```bash
cd /app/backend && set -a && source .env && set +a && nohup python3 scripts/fix_all_product_images.py 50 2.5 > /tmp/fix_all_images.log 2>&1 &
```

### IMAGE SOURCES - WHERE IMAGES COME FROM

| Content Type | Style | Primary Collection | Image Field |
|-------------|-------|-------------------|-------------|
| Products | Realistic photos | `products_master`, `unified_products` | `image_url` or `image` |
| Services | Watercolor | `services_master` | `image_url` or `watercolor_image` |
| Bundles | Watercolor | `{pillar}_bundles`, `product_bundles` | `image_url` or `image` |

**Bad Image Patterns (to be replaced):**
- `static.prod-images.emergentagent.com/jobs` - Duplicate AI images
- `images.unsplash.com` - Stock photos

**Good Image Patterns:**
- `res.cloudinary.com/duoapcx1p/` - Cloudinary (correct)

### KEY FILES

**Image Generation Service:**
- `/app/backend/ai_image_service.py` - Main AI image generation
- `/app/backend/scripts/fix_all_product_images.py` - Comprehensive fix script
- `/app/backend/scripts/fix_care_bundle_images.py` - Bundle-specific fix

**Mira's Picks (where those duplicate images showed):**
- Component: `/app/frontend/src/components/PillarPicksSection.jsx`
- API: `/api/mira/top-picks/{pet_id}/pillar/{pillar}`
- Route: `/app/backend/app/api/top_picks_routes.py`

**Soul Personalization Section (just added to all pillars):**
- Component: `/app/frontend/src/components/SoulPersonalizationSection.jsx`
- Added to: Celebrate, Care, Dine, Stay, Fit, Learn, Enjoy, Travel, Shop, Advisory
- Button links to: `/pet-soul/{petId}` (individual pet soul page)

### WHAT WAS DONE THIS SESSION

1. ✅ Fixed Mira's Picks duplicate images (100 products)
2. ✅ Added Soul Personalization Section to 10 pillar pages
3. ✅ Fixed bundle endpoints for Stay, Farewell, Adopt
4. ✅ Added `/api/bundles/sync-to-production` endpoint
5. ✅ Created comprehensive IMAGE_SOURCES.md documentation
6. 🔄 Started comprehensive image fix for remaining 569 products (IN PROGRESS)

### WHAT STILL NEEDS TO BE DONE

1. **🔴 P0: Monitor/Complete Image Fix** - Let the script finish, verify images
2. **🟡 P1: Visual QA** - Check all pillars after images are fixed
3. **🟡 P2: Fix Razorpay Checkout** - Payment flow broken
4. **🟡 P2: Fix Mobile Dashboard** - Scrambled UI
5. **🟢 P3: Sync to Production** - After everything is verified

### GOLDEN RULES (NON-NEGOTIABLE)

- **Products** = Realistic photography
- **Services** = Watercolor illustrations
- **Bundles** = Watercolor illustrated compositions
- **LearnPage.jsx** = Gold Standard template for all pillars

### TEST CREDENTIALS

- User: `dipali@clubconcierge.in` / `test123`
- Admin: `aditya` / `lola4304`

### KEY DOCUMENTATION

- `/app/memory/AGENT_START_HERE.md`
- `/app/memory/PRD.md`
- `/app/memory/docs/IMAGE_SOURCES.md`
- `/app/frontend/public/complete-documentation.html`

---

**IMMEDIATE ACTION FOR NEXT AGENT:**
1. Check if image fix script is still running: `ps aux | grep fix_all`
2. If not running, restart it
3. Monitor progress with `tail -f /tmp/fix_all_images.log`
4. After images are fixed, do visual QA on pillar pages

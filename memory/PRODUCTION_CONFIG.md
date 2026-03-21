# PRODUCTION DATABASE CONFIGURATION
# Use these values in the PRODUCTION backend .env (NOT preview)
#
# When deploying to thedoggycompany.com, set:
#
# MONGO_URL=mongodb+srv://pet-os-live:<REDACTED_ROTATED>@customer-apps.yrmj3k.mongodb.net/?appName=mobile-drawer-fix&maxPoolSize=5&retryWrites=true&timeoutMS=10000&w=majority
# DB_NAME=mira_pet_os
#
# Atlas cluster: customer-apps.yrmj3k.mongodb.net
# App name: mobile-drawer-fix
# Database: mira_pet_os (34 collections — production data)
#
# ⚠️ DO NOT use this URL in the preview environment
# The preview pod cannot reach Atlas (network restriction)
# Preview uses: MONGO_URL=mongodb://localhost:27017 / DB_NAME=pet-os-live-test_database
#
# MYSTIQUE CLOUDINARY:
# https://res.cloudinary.com/duoapcx1p/image/upload/v1774079033/tdc_pets/mystique_profile.jpg
#
# PRODUCTION CHECKLIST BEFORE GO-LIVE:
# 1. Set MONGO_URL to Atlas URL above
# 2. Set DB_NAME=mira_pet_os
# 3. Set RESEND_API_KEY (already in preview .env)
# 4. Set SMTP credentials for digest email
# 5. Confirm RAZORPAY_KEY_ID is live key (not test)
# 6. Run pillar name migration on production DB:
#    db.products_master.update_many({"pillar":"travel"}, {"$set":{"pillar":"go"}})
#    db.products_master.update_many({"pillar":"enjoy"}, {"$set":{"pillar":"play"}})
#    db.products_master.update_many({"pillar":"fit"}, {"$set":{"pillar":"services"}})

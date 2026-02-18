#!/bin/bash
# ===========================================
# PREPARE FOR DEPLOYMENT - ONE COMMAND FIX
# ===========================================
# Run this BEFORE clicking Deploy in Emergent:
#   bash /app/scripts/prepare-deploy.sh
# ===========================================

set -e

PRODUCTION_URL="https://thedoggycompany.in"
FRONTEND_ENV="/app/frontend/.env"

echo ""
echo "🚀 DEPLOYMENT PREPARATION SCRIPT"
echo "================================="
echo ""

# Step 1: Check current URL
CURRENT_URL=$(grep "REACT_APP_BACKEND_URL=" "$FRONTEND_ENV" | cut -d'=' -f2)
echo "📍 Current URL: $CURRENT_URL"
echo "🎯 Target URL:  $PRODUCTION_URL"
echo ""

if [ "$CURRENT_URL" = "$PRODUCTION_URL" ]; then
    echo "✅ URL already set to production!"
else
    echo "🔧 Fixing URL to production..."
    sed -i "s|REACT_APP_BACKEND_URL=.*|REACT_APP_BACKEND_URL=$PRODUCTION_URL|" "$FRONTEND_ENV"
    echo "✅ URL updated!"
fi

# Step 2: Restart frontend
echo ""
echo "🔄 Restarting frontend..."
sudo supervisorctl restart frontend
sleep 3

# Step 3: Verify
echo ""
echo "📋 Verification:"
NEW_URL=$(grep "REACT_APP_BACKEND_URL=" "$FRONTEND_ENV" | cut -d'=' -f2)
echo "   REACT_APP_BACKEND_URL = $NEW_URL"

if [ "$NEW_URL" = "$PRODUCTION_URL" ]; then
    echo ""
    echo "✅ ✅ ✅ READY TO DEPLOY ✅ ✅ ✅"
    echo ""
    echo "Now click DEPLOY in Emergent UI"
    echo ""
else
    echo ""
    echo "❌ ERROR: URL not set correctly!"
    echo "   Expected: $PRODUCTION_URL"
    echo "   Got:      $NEW_URL"
    exit 1
fi

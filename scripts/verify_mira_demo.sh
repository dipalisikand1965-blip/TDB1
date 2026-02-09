#!/bin/bash
# MiraDemoPage Verification Script
# Run this before and after refactoring to ensure nothing is lost

API_URL=$(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d '=' -f2)

echo "=============================================="
echo "MIRA DEMO PAGE VERIFICATION SCRIPT"
echo "API URL: $API_URL"
echo "=============================================="
echo ""

# Test 1: Mira Chat API
echo "TEST 1: Mira Chat API"
CHAT_RESPONSE=$(curl -s -X POST "$API_URL/api/mira/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "show me birthday cakes",
    "session_id": "verify-test-001",
    "pet_context": {"name": "TestPet", "breed": "Indie", "id": "test-pet"},
    "current_pillar": "celebrate"
  }')

if echo "$CHAT_RESPONSE" | grep -q "products"; then
  echo "  ✅ Chat API returns products"
else
  echo "  ❌ Chat API NOT returning products"
fi

if echo "$CHAT_RESPONSE" | grep -q "picks_vault"; then
  echo "  ✅ Picks vault data present"
else
  echo "  ❌ Picks vault data MISSING"
fi
echo ""

# Test 2: Session Create
echo "TEST 2: Session Create API"
SESSION_RESPONSE=$(curl -s -X POST "$API_URL/api/mira/session/create" \
  -H "Content-Type: application/json" \
  -d '{
    "pet_id": "test-pet",
    "pet_name": "TestPet",
    "member_id": "test-member",
    "source": "verification"
  }')

if echo "$SESSION_RESPONSE" | grep -q "session_id"; then
  echo "  ✅ Session created successfully"
else
  echo "  ❌ Session creation FAILED"
fi
echo ""

# Test 3: Vault Send to Concierge
echo "TEST 3: Vault Send to Concierge API"
VAULT_RESPONSE=$(curl -s -X POST "$API_URL/api/mira/vault/send-to-concierge" \
  -H "Content-Type: application/json" \
  -d '{
    "vault_type": "picks",
    "session_id": "verify-test-001",
    "pet": {"name": "TestPet", "id": "test-pet"},
    "pillar": "celebrate",
    "data": {"picked_items": [{"name": "Test Cake"}]}
  }')

if echo "$VAULT_RESPONSE" | grep -q "success.*true"; then
  echo "  ✅ Vault send to concierge works"
else
  echo "  ❌ Vault send to concierge FAILED"
fi
echo ""

# Test 4: Refresh Picks
echo "TEST 4: Refresh Picks API"
REFRESH_RESPONSE=$(curl -s -X POST "$API_URL/api/mira/refresh-picks" \
  -H "Content-Type: application/json" \
  -d '{
    "pillar": "celebrate",
    "pet_context": {"name": "TestPet"},
    "exclude_ids": []
  }')

if echo "$REFRESH_RESPONSE" | grep -q "picks"; then
  echo "  ✅ Refresh picks works"
else
  echo "  ❌ Refresh picks FAILED"
fi
echo ""

# Test 5: Frontend Build
echo "TEST 5: Frontend Build Check"
cd /app/frontend
BUILD_OUTPUT=$(yarn build 2>&1)

if echo "$BUILD_OUTPUT" | grep -q "Done"; then
  echo "  ✅ Frontend builds successfully"
else
  echo "  ❌ Frontend build FAILED"
fi
echo ""

# Test 6: Check for lint errors
echo "TEST 6: Lint Check (MiraDemoPage)"
LINT_OUTPUT=$(npx eslint src/pages/MiraDemoPage.jsx 2>&1)
ERROR_COUNT=$(echo "$LINT_OUTPUT" | grep -c "error")

if [ "$ERROR_COUNT" -eq "0" ]; then
  echo "  ✅ No lint errors"
else
  echo "  ⚠️  $ERROR_COUNT lint errors found"
fi
echo ""

echo "=============================================="
echo "VERIFICATION COMPLETE"
echo "=============================================="

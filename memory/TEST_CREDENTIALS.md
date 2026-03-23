# Standardized Test Credentials

**Last Updated:** February 18, 2026

---

## Primary Test Account

| Field | Value |
|-------|-------|
| **Email** | `dipali@clubconcierge.in` |
| **Password** | `test123` |
| **Name** | Dipali Sikand |
| **Membership** | Pawsome (Free Tier) |
| **Test URL** | `/mira-demo?debug=1` |

---

## Test Pets (7 Total)

| Pet Name | Breed | Soul Score | Pet ID | Notes |
|----------|-------|------------|--------|-------|
| **Mystique** | Shihtzu | 66% | `pet-3661ae55d2e2` | Senior, arthritis, chicken/wheat allergy |
| **Lola** | Maltese | 56% | `pet-e6348b13c975` | Young, energetic, beef/corn allergy |
| **Meister** | Shih Tzu | 56% | `pet-e007f9317276` | Senior, heart condition, severe anxiety |
| **Bruno** | Labrador | 48% | `pet-69be90540895` | Young, high energy, loves swimming |
| **Luna** | Golden Retriever | 56% | `pet-ea500853b9f7` | Hip dysplasia, grain allergy |
| **Buddy** | Golden Retriever | 41% | `pet-b3b1ba73f848` | Basic profile |
| **TestScoring** | Labrador Retriever | 100% | `pet-a8e7844178d9` | Full soul score test pet |

---

## Recommended Test Pet

**Use Mystique** for most testing scenarios:
- Has rich soul data (66% score)
- Has health conditions (arthritis)
- Has allergies (chicken, wheat)
- Senior pet with specific needs

---

## API Testing

```bash
# Login and get token
TOKEN=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"dipali@clubconcierge.in","password":"test123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

# Get pets
curl -s "$API_URL/api/pets" -H "Authorization: Bearer $TOKEN"

# Get tickets for pet
curl -s "$API_URL/api/mira/tickets?pet_id=pet-3661ae55d2e2" -H "Authorization: Bearer $TOKEN"
```

---

## Preview vs Production URLs

| Environment | URL |
|-------------|-----|
| **Emergent Preview** | `https://concierge-wiring.preview.emergentagent.com` |
| **Production** | `https://thedoggycompany.in` |

---

## Notes

- Same credentials work on both preview and production
- Pet data may differ between environments (production has real user data)
- Use `?debug=1` query param to enable debug features

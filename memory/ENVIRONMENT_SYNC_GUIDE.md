# Environment Sync Guide

**CRITICAL: READ THIS BEFORE ANY DATA OPERATIONS**

---

## Environment Architecture

| Environment | URL | Database |
|-------------|-----|----------|
| **Preview** | `mira-ticketing.preview.emergentagent.com` | Emergent Staging DB |
| **Production** | `thedoggycompany.in` | Production DB |

**⚠️ These are SEPARATE DATABASES - changes in one do NOT automatically appear in the other.**

---

## Admin Sync API

An API exists to sync pet data between environments.

### Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/env-sync/status` | GET | Check sync API status |
| `/api/admin/env-sync/fetch-from-source` | POST | Fetch pets from source env |
| `/api/admin/env-sync/apply-to-target` | POST | Apply pet data to current DB |
| `/api/admin/env-sync/full-sync` | POST | Complete sync in one call |

### Authentication

All sync endpoints require a token parameter:
```
?token=sync-preview-to-prod-2026
```

### Example: Sync Preview → Production

```bash
# Full sync from Preview to Production
curl -X POST "https://thedoggycompany.in/api/admin/env-sync/full-sync?token=sync-preview-to-prod-2026&overwrite=true" \
  -u "aditya:lola4304" \
  -H "Content-Type: application/json" \
  -d '{
    "source_url": "https://intent-ticket-flow.preview.emergentagent.com",
    "user_email": "dipali@clubconcierge.in",
    "user_password": "test123",
    "sync_soul_data": true
  }'
```

### Example: Sync Production → Preview

```bash
# Full sync from Production to Preview
curl -X POST "https://intent-ticket-flow.preview.emergentagent.com/api/admin/env-sync/full-sync?token=sync-preview-to-prod-2026&overwrite=true" \
  -u "aditya:lola4304" \
  -H "Content-Type: application/json" \
  -d '{
    "source_url": "https://thedoggycompany.in",
    "user_email": "dipali@clubconcierge.in",
    "user_password": "test123",
    "sync_soul_data": true
  }'
```

---

## Test User Data

| Field | Value |
|-------|-------|
| **Email** | `dipali@clubconcierge.in` |
| **Password** | `test123` |

### Preview Pets (Test Data)
- Lola (Maltese) - 56%
- Mystique (Shihtzu) - 66%
- Bruno (Labrador) - 48%
- Luna (Golden Retriever) - 56%
- Buddy (Golden Retriever) - 41%
- Meister (Shih Tzu) - 56%
- TestScoring (Labrador) - 100%

### Production Pets (Real Data)
- Mystique (Shihtzu) - 87%
- Buddy (Golden Retriever) - 10%
- Mojo (Indie) - 78%
- Lola (Maltese) - 9%
- Luna (Golden Retriever) - 88%

---

## When to Sync

| Scenario | Direction | Command |
|----------|-----------|---------|
| Testing new features with rich data | Production → Preview | Sync real data to test env |
| Deploying tested data to production | Preview → Production | Sync test data to live |
| After major soul score algorithm changes | Recalculate in both | Don't sync, regenerate |

---

## Agent Instructions

1. **Always verify which environment you're working on**
2. **Never assume Preview = Production data**
3. **Use the sync API when data must match**
4. **Document any sync operations in PRD.md**

---

## Files Related to Sync

- `/app/backend/admin_sync_routes.py` - Sync API implementation
- `/app/memory/ENVIRONMENT_SYNC_GUIDE.md` - This document
- `/app/memory/TEST_CREDENTIALS.md` - Test user credentials

---

## Troubleshooting

**Q: Why do I see different pets in Preview vs Production?**
A: They use separate databases. Use the sync API to align them.

**Q: Why did my changes disappear after deployment?**
A: Code deploys, but database data persists separately. Sync if needed.

**Q: How do I know which database I'm connected to?**
A: Check the API response - pet data will differ between environments.

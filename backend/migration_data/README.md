# TDC Migration Data

Pre-exported MongoDB collections for fresh deployments.
Generated: 2026-04-06

## How to restore after deployment

**Option 1 — curl (one command):**
```bash
curl -X POST https://thedoggycompany.com/api/admin/db/restore \
  -u "aditya:lola4304"
```

**Option 2 — Admin panel:**
Go to `/admin` → Settings → "Restore Database from Backup"

## What's included (16,631 docs total)

| Collection | Docs | What it is |
|---|---|---|
| products_master | 9,353 | All 9k+ products (soul + Shopify) |
| breed_products | 4,941 | Soul Generator source |
| services_master | 1,040 | All services |
| pets | 32 | All registered pet profiles |
| users | 20 | All member accounts |
| service_catalog | 97 | Service categories |
| bundles | 96 | Product bundles |
| service_desk_tickets | 79 | Support tickets |
| mira_conversations | 785 | Mira chat history |
| guided_paths | 26 | App guided paths |
| learn_guides | 36 | Learn pillar guides |
| product_bundles | 25 | Product bundle configs |
| product_soul_tiers | 101 | Soul tier definitions |

## To regenerate (when data changes significantly)

Run on preview server:
```bash
python3 /app/backend/scripts/export_migration_data.py
```

Or manually:
```bash
cd /app/backend/migration_data
for col in products_master breed_products services_master users pets; do
  mongoexport --host localhost:27017 --db pet-os-live-test_database \
    --collection $col --out ${col}.json --quiet
  gzip -f ${col}.json
done
```

## Restore options

- `POST /api/admin/db/restore` — upsert mode (safe to re-run, won't duplicate)
- `POST /api/admin/db/restore?drop_existing=true` — full clean restore (drops first)
- `GET /api/admin/db/restore-status` — check what files are ready (no auth needed)

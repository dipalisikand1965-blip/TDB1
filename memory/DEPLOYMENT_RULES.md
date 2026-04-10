# TDC Deployment Rules — MANDATORY FOR ALL AGENTS
## Last Updated: April 10, 2026

---

# ⚠️ READ THIS FIRST — EVERY AGENT EVERY SESSION

## The "Restore Database" Button Does EVERYTHING:
1. Restores ALL 150 collections (89,878 docs)
2. Auto-fixes "Website Visitor" tickets → real owner names
3. Runs soul archetype inference → all pets get `primary_archetype`
4. Toast confirms: "✅ Database restored · X tickets patched · Y archetypes live"

## YOU NEVER NEED TO:
- Run `infer_archetype.py` manually ❌
- Run curl commands after restore ❌
- Export `unified_products` separately ❌ (it's in migration now)
- Fix visitor tickets manually ❌

## The Button Does It All. Always Press It After Every Redeploy.

## The Only Manual Step:
Re-export migration files when DATA changes in preview.
See table below for what triggers a re-export.

---

## THE GOLDEN RULE
Any data change in preview must be exported to migration files 
BEFORE deploying. Otherwise Restore Database loads OLD data.

## Migration Coverage (as of April 11, 2026 — Post-Audit)
**150 collections | 89,878 docs | restored on every "Restore Database"**

Full coverage after April 11 gap audit. ALL state data is covered:
- Core: users (21), pets (33), products_master (9,358), services_master (1,040), breed_products (4,941)
- Mira AI: mira_product_scores (44,891), mira_signals (12,240), mira_conversations (785), mira_memories (170)
- Notifications: admin_notifications (2,270), member_notifications (1,374), email_logs (574)
- WhatsApp: whatsapp_logs, whatsapp_digest_log, live_conversation_threads (267)
- Tickets: service_desk_tickets (124), tickets (238), unified_inbox (134), channel_intakes (741)
- Orders: orders (15), birthday_box_orders (41), membership_orders (9), cake_orders (7)
- Content: blog_posts, faqs, learn_* (10 cols), team_members, testimonials, stay_*, restaurants
- Config: app_settings, settings, escalation_rules, ticket_templates, pricing_tiers
- Intentionally excluded (correct): *_backup_* collections, curated_picks_cache, mira_imagines_cache, user_sessions, sync_logs, notification_logs, health_reminder_logs

## What triggers a re-export?

| Change made | Files to re-export |
|---|---|
| Product edits (name, price, image) | products_master.json.gz |
| New soul products generated | breed_products.json.gz |
| Pet archetype updated | pets.json.gz |
| New services added | services_master.json.gz |
| Any pet profile change | pets.json.gz |
| New member registered | users.json.gz |
| Guided paths changed | guided_paths.json.gz |
| Ticket status changed | service_desk_tickets.json.gz |
| New WhatsApp tickets created | service_desk_tickets.json.gz, whatsapp_logs.json.gz |
| WhatsApp conversation history | live_conversation_threads.json.gz |
| Mira memory updated | mira_memories.json.gz |
| Orders placed | orders.json.gz |
| Any DB data change | Run full export script below |

## How to re-export a single collection:
```python
python3 -c "
import asyncio, gzip, json, os
from motor.motor_asyncio import AsyncIOMotorClient
from pathlib import Path

async def export(collection_name):
    db = AsyncIOMotorClient(os.environ.get('MONGO_URL','mongodb://localhost:27017'))['pet-os-live-test_database']
    docs = await db[collection_name].find({}).to_list(None)
    path = f'/app/backend/migration_data/{collection_name}.json.gz'
    with gzip.open(path, 'wt') as f:
        for d in docs:
            d.pop('_id', None)
            f.write(json.dumps(d, default=str) + '\n')
    print(f'Exported {len(docs)} docs to {path}')

asyncio.run(export('pets'))  # Change collection name as needed
"
```

## How to re-export MULTIPLE collections at once:
```python
python3 -c "
import asyncio, gzip, json, os
from motor.motor_asyncio import AsyncIOMotorClient

async def export_all():
    db = AsyncIOMotorClient(os.environ.get('MONGO_URL','mongodb://localhost:27017'))['pet-os-live-test_database']
    collections = ['pets', 'users', 'service_desk_tickets']  # add as needed
    for name in collections:
        docs = await db[name].find({}).to_list(None)
        path = f'/app/backend/migration_data/{name}.json.gz'
        with gzip.open(path, 'wt') as f:
            for d in docs:
                d.pop('_id', None)
                f.write(json.dumps(d, default=str) + '\n')
        print(f'Exported {len(docs)} docs → {path}')

asyncio.run(export_all())
"
```

## Check which files are stale:
```bash
ls -la /app/backend/migration_data/*.json.gz | sort -k6,7
```
Any file older than your last data change needs re-exporting.

## The Full Deploy Sequence — NEVER SKIP STEPS:
1. Make code changes in preview
2. Re-export any changed collections (see table above)
3. Save to GitHub (Emergent chat input button)
4. Emergent creates conflict branch → Dipali merges PR on GitHub into main
5. Redeploy triggers automatically (or press Redeploy in Emergent — wait 10-15 mins)
6. Go to thedoggycompany.com/admin → Guide & Backup
7. Click green "Restore Database" button
8. Wait for toast: "X docs restored"
9. Test on production — not preview!

## Common Mistakes That Break Production:
❌ Making DB changes and NOT re-exporting migration files
❌ Testing on preview and assuming production works the same
❌ Pressing Redeploy but forgetting Restore Database
❌ Merging wrong branch (always merge INTO main)
❌ Adding env vars in .env file only — must add to Emergent dashboard too
❌ Using `if collection:` in PyMongo — always use `if collection is not None:`
❌ Returning MongoDB documents without removing `_id` (causes JSON serialization errors)

## Environment Variables — Two Places:
- Preview: /app/backend/.env and /app/frontend/.env
- Production: Emergent dashboard → Environment Variables
BOTH must be updated. Adding to .env only does NOT affect production.

## WhatsApp / Gupshup Notes:
- Gupshup webhook points to PRODUCTION URL — not preview
- Changes to whatsapp_routes.py require a full redeploy to take effect
- Testing WhatsApp on preview is NOT possible — always test on production after deploy
- If WhatsApp goes silent after deploy: check production server didn't crash (check Emergent logs)

## Migration Files Reference — Current State (Apr 9, 2026):

| File | Last Exported | Contents |
|---|---|---|
| pets.json.gz | Apr 9 12:49 | 33 pets (Dipali's 10 + others) |
| users.json.gz | Apr 9 16:24 | 21 members |
| service_desk_tickets.json.gz | Apr 9 16:24 | 124 tickets (mahi resolved) |
| products_master.json.gz | Apr 8 16:25 | 9,358 products |
| services_master.json.gz | Apr 8 15:46 | 1,040 services |
| breed_products.json.gz | Apr 6 10:38 | 4,941 soul products |
| guided_paths.json.gz | Apr 6 11:58 | 44 guided paths |
| bundles.json.gz | Apr 6 10:38 | bundles |
| care_bundles.json.gz | Apr 6 11:58 | care bundles |
| learn_guides.json.gz | Apr 6 10:38 | learn guides |
| mira_conversations.json.gz | Apr 6 10:38 | conversations |
| product_bundles.json.gz | Apr 6 10:38 | product bundles |
| product_soul_tiers.json.gz | Apr 6 10:38 | soul tiers |
| service_catalog.json.gz | Apr 6 10:38 | service catalog |

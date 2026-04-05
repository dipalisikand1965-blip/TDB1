#!/usr/bin/env python3
"""
Polls every 2 minutes. When ALL generation tasks finish:
  1. Triggers birthday_cake_topper batch for all 54 breeds
  2. Waits for that to finish
  3. Runs the complete soul product audit → /app/memory/SOUL_AUDIT_FINAL.md
"""
import time
import requests
from datetime import datetime
from pymongo import MongoClient
from collections import defaultdict

DB_URL  = "mongodb://localhost:27017"
DB_NAME = "pet-os-live-test_database"
API     = "https://pet-soul-ranking.preview.emergentagent.com"

PILLARS = ['dine','care','play','go','learn','celebrate','shop','paperwork','emergency','farewell','adopt']

GENERATION_CHECKS = [
    {"label": "adopt",        "q": {"pillar": "adopt"}},
    {"label": "farewell",     "q": {"pillar": "farewell"}},
    {"label": "corgi",        "q": {"breed": "corgi"}},
    {"label": "basenji",      "q": {"breed": "basenji"}},
    {"label": "bichon_frise", "q": {"breed": "bichon_frise"}},
    {"label": "saint_bernard","q": {"breed": "saint_bernard"}},
]

def log(msg):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}", flush=True)


def check_generation(db):
    """Check using mockup_url presence — the correct completion metric."""
    results = []
    all_done = True
    for item in GENERATION_CHECKS:
        q = item["q"]
        total = db.breed_products.count_documents(q)
        # pending = has prompt but no url yet
        pending_q = {"$and": [
            q,
            {"is_active": True},
            {"mockup_prompt": {"$exists": True, "$ne": ""}},
            {"$or": [{"mockup_url": {"$in": [None, ""]}}, {"mockup_url": {"$exists": False}}]}
        ]}
        pending = db.breed_products.count_documents(pending_q)
        done = total - pending
        pct  = int(done / total * 100) if total else 100
        results.append(f"  {item['label']:<15}: {done:>3}/{total:<3} ({pct}%) — {pending} pending")
        if pending > 0:
            all_done = False
    return all_done, "\n".join(results)


def topper_pending(db):
    return db.breed_products.count_documents({
        "product_type": "birthday_cake_topper",
        "is_active": True,
        "$or": [{"mockup_url": {"$in": [None, ""]}}, {"mockup_url": {"$exists": False}}]
    })


def topper_done(db):
    return db.breed_products.count_documents({
        "product_type": "birthday_cake_topper",
        "mockup_url": {"$nin": [None, ""], "$exists": True}
    })


def trigger_topper_batch():
    try:
        r = requests.post(
            f"{API}/api/mockups/generate-batch",
            json={"product_type_filter": "birthday_cake_topper", "limit": 100},
            timeout=30
        )
        return r.json()
    except Exception as e:
        return {"error": str(e)}


def is_api_running():
    try:
        r = requests.get(f"{API}/api/mockups/status", timeout=10)
        return r.json().get("running", False)
    except Exception:
        return True   # if timeout, assume running


def run_audit(db):
    all_products = list(db.products_master.find(
        {'soul_made': True, 'visibility.status': 'active', 'is_active': True},
        {'_id': 0, 'name': 1, 'pillar': 1, 'product_type': 1, 'breed_tags': 1}
    ))

    audit = defaultdict(lambda: defaultdict(set))
    for p in all_products:
        tags = p.get('breed_tags') or []
        if isinstance(tags, str): tags = [tags]
        pillar = p.get('pillar', 'unknown') or 'unknown'
        ptype = p.get('product_type') or p.get('name', '?')
        for tag in tags:
            if tag:
                audit[tag][pillar].add(ptype)

    lines = []
    lines.append(f"# Soul Product Audit — Generated {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    lines.append(f"**Total active soul products:** {len(all_products)}")
    lines.append(f"**Total breeds:** {len(audit)}")
    lines.append("")

    header = f"{'BREED':<28} {'TOT':>4}  " + "  ".join([f"{p[:4].upper():>4}" for p in PILLARS])
    lines.append("## Summary Table")
    lines.append("```")
    lines.append(header)
    lines.append("-" * 110)

    GHOST = {'all_breeds', 'shiba_inu', 'spitz'}
    REAL_BREEDS = sorted([b for b in audit.keys() if b not in GHOST])

    for breed in REAL_BREEDS:
        total = sum(len(v) for v in audit[breed].values())
        marks = []
        for p in PILLARS:
            c = audit[breed].get(p, set())
            real = len([x for x in c if x != 'soul_made'])
            if real == 0 and len(c) == 0:   marks.append('  NO')
            elif real == 0 and len(c) >= 1: marks.append('  s?')
            else:                           marks.append(f'{len(c):>4}')
        lines.append(f"{breed:<28} {total:>4}  " + "  ".join(marks))

    lines.append("```")
    lines.append("")
    lines.append("Legend: number=real products | s?=only sentinel | NO=completely absent")
    lines.append("")

    lines.append("## Detailed Breakdown")
    lines.append("")
    for breed in REAL_BREEDS:
        total = sum(len(v) for v in audit[breed].values())
        lines.append(f"### {breed.upper()}  (total active: {total})")
        for pillar in PILLARS:
            products = sorted([x for x in audit[breed].get(pillar, set()) if x != 'soul_made'])
            sentinel = 'soul_made' in audit[breed].get(pillar, set())
            if products:
                extra = " + sentinel" if sentinel else ""
                lines.append(f"- **{pillar}** ({len(audit[breed][pillar])}): {', '.join(products)}{extra}")
            elif sentinel:
                lines.append(f"- **{pillar}**: *sentinel only*")
            else:
                lines.append(f"- **{pillar}**: ~~MISSING~~")
        lines.append("")

    return "\n".join(lines)


def main():
    client = MongoClient(DB_URL)
    db = client[DB_NAME]

    log("=== Audit Watcher v2 Started ===")
    log("Phase 1: Wait for adopt/farewell/corgi/basenji/bichon/saint_bernard to finish")

    # ── Phase 1: Wait for main generation batch ────────────────────────────
    while True:
        all_done, progress = check_generation(db)
        log(f"Main generation progress:\n{progress}")
        if all_done:
            log("✅ Phase 1 complete — main generation done!")
            break
        log("Still generating. Next check in 2 min...\n")
        time.sleep(120)

    # ── Phase 2: Trigger cake topper batch ─────────────────────────────────
    log("\n=== Phase 2: Birthday Cake Topper generation ===")
    pending = topper_pending(db)
    log(f"  Cake toppers pending: {pending}")

    if pending > 0:
        # Wait for API to be free
        log("  Waiting for API to be free...")
        while is_api_running():
            log("  API busy. Waiting 30s...")
            time.sleep(30)

        log("  Triggering cake topper batch...")
        result = trigger_topper_batch()
        log(f"  Response: {result}")

        # Monitor until done
        while True:
            time.sleep(60)
            pending_now = topper_pending(db)
            done_now    = topper_done(db)
            log(f"  Cake toppers: {done_now} done, {pending_now} pending")
            if pending_now == 0:
                log("  ✅ All cake toppers generated!")
                break
            if not is_api_running():
                log("  API stopped but pending remain. Re-triggering...")
                trigger_topper_batch()
    else:
        log("  No pending cake toppers (already done or none seeded).")

    # ── Phase 3: Run full audit ────────────────────────────────────────────
    log("\n=== Phase 3: Running full audit ===")
    audit_md = run_audit(db)

    out_path = "/app/memory/SOUL_AUDIT_FINAL.md"
    with open(out_path, "w") as f:
        f.write(audit_md)

    log(f"✅ Audit saved → {out_path}")
    log("")
    log("=" * 60)
    print(audit_md)


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Polls every 2 minutes. When ALL generation tasks finish,
prints the complete soul product audit and saves to /app/memory/SOUL_AUDIT_FINAL.md
"""
import time
from datetime import datetime
from pymongo import MongoClient
from collections import defaultdict

DB_URL = "mongodb://localhost:27017"
DB_NAME = "pet-os-live-test_database"

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
    results = []
    all_done = True
    for item in GENERATION_CHECKS:
        total = db.breed_products.count_documents(item["q"])
        done  = db.breed_products.count_documents({**item["q"], "is_mockup": True})
        pct   = int(done/total*100) if total else 100
        results.append(f"  {item['label']:<15}: {done:>3}/{total:<3} ({pct}%)")
        if done < total:
            all_done = False
    return all_done, "\n".join(results)

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

    # Summary table
    header = f"{'BREED':<28} {'TOT':>4}  " + "  ".join([f"{p[:4].upper():>4}" for p in PILLARS])
    lines.append("## Summary Table")
    lines.append("```")
    lines.append(header)
    lines.append("-" * 110)

    REAL_BREEDS = sorted([b for b in audit.keys() if b not in ('all_breeds','shiba_inu','spitz')])

    for breed in REAL_BREEDS:
        total = sum(len(v) for v in audit[breed].values())
        marks = []
        for p in PILLARS:
            c = audit[breed].get(p, set())
            real = len([x for x in c if x != 'soul_made'])
            if real == 0 and len(c) == 0:     marks.append('  NO')
            elif real == 0 and len(c) >= 1:   marks.append('  s?')
            else:                              marks.append(f'{len(c):>4}')
        lines.append(f"{breed:<28} {total:>4}  " + "  ".join(marks))

    lines.append("```")
    lines.append("")
    lines.append("Legend: number=real products | s?=only sentinel | NO=completely absent")
    lines.append("")

    # Detailed per-breed breakdown
    lines.append("## Detailed Breakdown — Every Breed, Every Pillar")
    lines.append("")
    for breed in REAL_BREEDS:
        total = sum(len(v) for v in audit[breed].values())
        lines.append(f"### {breed.upper()}  (total: {total})")
        for pillar in PILLARS:
            products = sorted([x for x in audit[breed].get(pillar, set()) if x != 'soul_made'])
            sentinel = 'soul_made' in audit[breed].get(pillar, set())
            if products:
                lines.append(f"- **{pillar}** ({len(audit[breed][pillar])}): {', '.join(products)}" + (" + soul_made sentinel" if sentinel else ""))
            elif sentinel:
                lines.append(f"- **{pillar}**: *sentinel only — generation pending*")
            else:
                lines.append(f"- **{pillar}**: ~~MISSING~~")
        lines.append("")

    return "\n".join(lines)

def main():
    client = MongoClient(DB_URL)
    db = client[DB_NAME]

    log("=== Audit Watcher Started ===")
    log("Will poll every 2 minutes until all generation tasks complete.")

    while True:
        all_done, progress = check_generation(db)
        log(f"Progress:\n{progress}")

        if all_done:
            log("✅ ALL GENERATION COMPLETE — Running full audit...")
            audit_md = run_audit(db)

            out_path = "/app/memory/SOUL_AUDIT_FINAL.md"
            with open(out_path, "w") as f:
                f.write(audit_md)

            log(f"✅ Audit saved to {out_path}")
            log("")
            log("=== AUDIT COMPLETE — PRINTING ===")
            print(audit_md)
            break

        log(f"Still generating. Next check in 2 minutes...\n")
        time.sleep(120)

if __name__ == "__main__":
    main()

"""
Architecture Auditor — ScaleBoard Bug F Pattern
=================================================
Scans the live system and updates marker-bounded sections of
`/app/memory/DOGGYCOMPANY_COMPLETE_ARCHITECTURE.md` nightly.

Also writes a snapshot to `architecture_snapshots` collection so each run
can be diffed against the previous to surface "what changed".

Called by:
  1. Nightly cron at 4:00 AM IST (registered in server.py lifespan)
  2. Admin-triggered POST /api/admin/architecture/refresh

What it scans:
  - Live DB collections + doc counts
  - Backend route counts per file
  - Frontend route count
  - APScheduler registered jobs
  - Env var names (from .env, not values)
  - Cron + integration health

Sections refreshed (bounded by <!-- AUDIT:X:START --> / END markers):
  DATABASE, API, FRONTEND, CRON, BUGS
"""
import os
import re
import json
import glob
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Any

logger = logging.getLogger(__name__)

ARCHITECTURE_DOC = Path("/app/memory/DOGGYCOMPANY_COMPLETE_ARCHITECTURE.md")
BACKEND_DIR = Path("/app/backend")
FRONTEND_APP_JS = Path("/app/frontend/src/App.js")

# Injected from server.py
db = None


def set_deps(database):
    global db
    db = database


async def _scan_database() -> Dict[str, Any]:
    """Live DB stats — collection names + doc counts."""
    if db is None:
        return {"total_collections": 0, "total_docs": 0, "top40": [], "empty": []}
    names = sorted(await db.list_collection_names())
    rows = []
    total = 0
    for n in names:
        try:
            c = await db[n].count_documents({})
        except Exception:
            c = 0
        total += c
        rows.append((n, c))
    rows.sort(key=lambda x: -x[1])
    top40 = [{"name": n, "count": c} for n, c in rows[:40]]
    empty = [{"name": n, "count": c} for n, c in rows if c <= 3]
    return {
        "total_collections": len(names),
        "total_docs": total,
        "top40": top40,
        "empty": empty,
    }


def _scan_backend_routes() -> Dict[str, Any]:
    """Count routes per file via regex on decorators."""
    pattern = re.compile(r'^@(?:api_router|router|app|ai_image_router|pillar_products_router)\.(get|post|put|patch|delete)\b', re.M)
    per_file = {}
    total = 0
    for f in BACKEND_DIR.glob("*.py"):
        try:
            src = f.read_text(errors="ignore")
        except Exception:
            continue
        n = len(pattern.findall(src))
        if n > 0:
            per_file[f.name] = n
            total += n
    # Sort by count desc
    sorted_files = sorted(per_file.items(), key=lambda x: -x[1])
    return {
        "total": total,
        "per_file": [{"file": k, "count": v} for k, v in sorted_files[:20]],
    }


def _scan_frontend_routes() -> Dict[str, Any]:
    try:
        src = FRONTEND_APP_JS.read_text()
    except Exception:
        return {"total": 0, "samples": []}
    matches = re.findall(r'path="([^"]+)"', src)
    unique = sorted(set(matches))
    return {"total": len(unique), "samples": unique[:30]}


def _scan_env_vars() -> Dict[str, Any]:
    """Env var NAMES only — never values."""
    def _read_names(path: Path):
        if not path.exists():
            return []
        try:
            return sorted({m.group(1) for m in re.finditer(r'^([A-Z_][A-Z0-9_]*)=', path.read_text(), re.M)})
        except Exception:
            return []
    return {
        "backend":  _read_names(Path("/app/backend/.env")),
        "frontend": _read_names(Path("/app/frontend/.env")),
    }


def _scan_crons() -> List[Dict[str, Any]]:
    """Extract `scheduler.add_job(...)` invocations and their id/schedule."""
    try:
        src = (BACKEND_DIR / "server.py").read_text()
    except Exception:
        return []
    pattern = re.compile(
        r'scheduler\.add_job\s*\(\s*([^,]+),\s*(CronTrigger\([^)]*\)|IntervalTrigger\([^)]*\))[^,]*,\s*id\s*=\s*"([^"]+)"',
        re.S,
    )
    jobs = []
    for m in pattern.finditer(src):
        jobs.append({
            "function": m.group(1).strip(),
            "trigger":  m.group(2).strip(),
            "id":       m.group(3),
        })
    return jobs


async def run_audit_scan() -> Dict[str, Any]:
    """Run the full scan. Returns a snapshot dict."""
    snapshot = {
        "scanned_at": datetime.now(timezone.utc).isoformat(),
        "database":   await _scan_database(),
        "backend":    _scan_backend_routes(),
        "frontend":   _scan_frontend_routes(),
        "env":        _scan_env_vars(),
        "crons":      _scan_crons(),
    }
    # Persist snapshot for diffing
    if db is not None:
        try:
            await db.architecture_snapshots.insert_one({
                "_id": snapshot["scanned_at"],
                **snapshot,
            })
        except Exception as e:
            logger.warning(f"[ARCH-AUDIT] Failed to persist snapshot: {e}")
    return snapshot


def _render_database_section(db_data: Dict[str, Any]) -> str:
    lines = [
        f"### Live stats (as of {datetime.now(timezone.utc).isoformat()})",
        f"- **Total collections**: {db_data['total_collections']}",
        f"- **Total documents**: {db_data['total_docs']:,}",
        "",
        "### Top 20 collections by doc count",
        "| Docs | Collection |",
        "|-----:|------------|",
    ]
    for row in db_data["top40"][:20]:
        lines.append(f"| {row['count']:,} | `{row['name']}` |")
    return "\n".join(lines)


def _render_api_section(api_data: Dict[str, Any]) -> str:
    lines = [
        f"**Total endpoints**: {api_data['total']}",
        "",
        "### Top files by route count",
        "| Routes | File |",
        "|-------:|------|",
    ]
    for row in api_data["per_file"]:
        lines.append(f"| {row['count']} | `{row['file']}` |")
    return "\n".join(lines)


def _render_frontend_section(fe_data: Dict[str, Any]) -> str:
    return f"**Total frontend routes**: {fe_data['total']}\n\nSample routes:\n" + \
           "\n".join(f"- `{p}`" for p in fe_data["samples"][:20])


def _render_cron_section(crons: List[Dict[str, Any]]) -> str:
    lines = [
        f"**Registered APScheduler jobs**: {len(crons)}",
        "",
        "| Job ID | Trigger | Function |",
        "|--------|---------|----------|",
    ]
    for c in crons:
        trigger = c["trigger"].replace("|", "\\|")
        lines.append(f"| `{c['id']}` | `{trigger}` | `{c['function']}` |")
    return "\n".join(lines)


def _replace_section(full_md: str, section: str, new_content: str) -> str:
    """Replace text between <!-- AUDIT:{section}:START --> and END markers."""
    pattern = re.compile(
        r'(<!-- AUDIT:' + section + r':START -->)(.*?)(<!-- AUDIT:' + section + r':END -->)',
        re.S,
    )
    if not pattern.search(full_md):
        return full_md  # marker not present — leave alone
    return pattern.sub(r'\1\n\n' + new_content + r'\n\n\3', full_md)


async def refresh_architecture_doc() -> Dict[str, Any]:
    """Run the scan + rewrite marker-bounded sections of the doc."""
    snapshot = await run_audit_scan()

    if not ARCHITECTURE_DOC.exists():
        logger.warning(f"[ARCH-AUDIT] Doc missing at {ARCHITECTURE_DOC} — skipping refresh")
        return {"refreshed": False, "reason": "doc_missing", "snapshot": snapshot}

    md = ARCHITECTURE_DOC.read_text()
    md = _replace_section(md, "DATABASE", _render_database_section(snapshot["database"]))
    md = _replace_section(md, "API",      _render_api_section(snapshot["backend"]))
    md = _replace_section(md, "FRONTEND", _render_frontend_section(snapshot["frontend"]))
    md = _replace_section(md, "CRON",     _render_cron_section(snapshot["crons"]))

    # Stamp last-updated at top (idempotent)
    md = re.sub(
        r"\*\*Generated\*\*:.*",
        f"**Generated**: {datetime.now(timezone.utc).isoformat()} (auto-refresh)",
        md, count=1,
    )

    ARCHITECTURE_DOC.write_text(md)
    logger.info("[ARCH-AUDIT] Architecture doc refreshed")
    return {"refreshed": True, "snapshot_at": snapshot["scanned_at"]}


async def diff_latest_snapshots() -> Dict[str, Any]:
    """Return {added, removed, delta} comparing the 2 most recent snapshots."""
    if db is None:
        return {}
    snaps = await db.architecture_snapshots.find({}, {"_id": 1, "database": 1}).sort("_id", -1).limit(2).to_list(2)
    if len(snaps) < 2:
        return {"status": "insufficient_snapshots"}

    curr = {x["name"]: x["count"] for x in snaps[0].get("database", {}).get("top40", [])}
    prev = {x["name"]: x["count"] for x in snaps[1].get("database", {}).get("top40", [])}

    added = [n for n in curr if n not in prev]
    removed = [n for n in prev if n not in curr]
    delta = {
        n: curr[n] - prev.get(n, 0)
        for n in curr
        if n in prev and curr[n] != prev[n]
    }
    return {
        "status": "ok",
        "added_collections": added,
        "removed_collections": removed,
        "doc_count_delta": delta,
        "compared_at": [snaps[0]["_id"], snaps[1]["_id"]],
    }

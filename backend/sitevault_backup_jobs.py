"""
SiteVault Backup Jobs
========================
All backup task implementations:
  - dump_mongodb()            → gzipped mongodump archive
  - tar_source_code()         → backend + frontend/src tarball (excludes junk)
  - tar_memory_files()        → /app/memory/*
  - tar_frontend_public()     → /app/frontend/public/
  - collect_supervisor_logs() → last 7 days of /var/log/supervisor/*.log
  - build_cloudinary_manifest()  → JSON of every image URL + public_id
  - download_all_cloudinary()    → streams every image to tar.gz (heavy)
  - build_env_template()      → redacted .env with keys visible, values blanked
  - export_admin_reports_csv()→ tickets, orders, users
  - build_shopify_sync_state()→ JSON of local↔Shopify ID mappings
  - run_daily_backup()        → orchestrator for 3am daily job
  - run_weekly_backup()       → orchestrator for Monday 3am job
  - run_retention_cleaner()   → delete old snapshots per policy

All outputs land in a temp workdir, get uploaded, then workdir is cleaned.
"""
import os
import io
import csv
import json
import gzip
import shutil
import asyncio
import tarfile
import logging
import subprocess
import tempfile
import hashlib
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
from urllib.parse import urlparse

import httpx

import sitevault_drive_client as drive

logger = logging.getLogger(__name__)

# Injected by routes / server.py
_db = None
def set_db(database):
    global _db
    _db = database


# ─────────────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────────────
def _timestamp() -> str:
    """UTC timestamp suitable for filenames."""
    return datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")


def _run(cmd: List[str], cwd: Optional[str] = None, timeout: int = 600) -> Tuple[int, str]:
    """Blocking subprocess helper. Returns (returncode, combined_output)."""
    result = subprocess.run(
        cmd,
        cwd=cwd,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        timeout=timeout,
    )
    return result.returncode, result.stdout or ""


# ─────────────────────────────────────────────────────────────────────
# 1. MONGO DUMP
# ─────────────────────────────────────────────────────────────────────
def dump_mongodb(workdir: str) -> str:
    """
    Runs mongodump for the entire DB_NAME, gzipped into a single archive.
    Returns path to the .gz archive.
    """
    mongo_url = os.environ["MONGO_URL"]
    db_name = os.environ["DB_NAME"]
    archive = os.path.join(workdir, f"mongo-{db_name}-{_timestamp()}.archive.gz")

    cmd = [
        "mongodump",
        f"--uri={mongo_url}",
        f"--db={db_name}",
        f"--archive={archive}",
        "--gzip",
    ]
    rc, out = _run(cmd, timeout=1800)
    if rc != 0:
        raise RuntimeError(f"mongodump failed (rc={rc}): {out[-2000:]}")
    logger.info(f"[SITEVAULT] mongodump OK → {archive} ({os.path.getsize(archive) / 1024 / 1024:.1f} MB)")
    return archive


# ─────────────────────────────────────────────────────────────────────
# 2. SOURCE CODE TARBALL
# ─────────────────────────────────────────────────────────────────────
EXCLUDES = [
    "node_modules", ".git", "__pycache__", ".next", "build", "dist",
    ".venv", "venv", ".pytest_cache", ".ruff_cache", "*.pyc", ".DS_Store",
    "frontend/public/cloudinary-cache",  # if we ever cache images
]


def tar_source_code(workdir: str) -> str:
    """
    Creates a .tar.gz of /app/backend + /app/frontend (minus junk).
    Uses `tar` CLI for speed + reliable exclude handling.
    """
    archive = os.path.join(workdir, f"source-code-{_timestamp()}.tar.gz")
    exclude_args = [f"--exclude={p}" for p in EXCLUDES]
    cmd = (
        ["tar", "-czf", archive]
        + exclude_args
        + [
            "-C", "/app",
            "backend",
            "frontend/src",
            "frontend/package.json",
            "frontend/yarn.lock",
            "frontend/tailwind.config.js",
            "frontend/craco.config.js",
        ]
    )
    rc, out = _run(cmd, timeout=600)
    # tar returns 1 for "some files changed during read" but still produces archive
    if rc not in (0, 1) or not os.path.exists(archive):
        raise RuntimeError(f"source tar failed (rc={rc}): {out[-2000:]}")
    logger.info(f"[SITEVAULT] source-code tar OK → {archive} ({os.path.getsize(archive) / 1024 / 1024:.1f} MB)")
    return archive


# ─────────────────────────────────────────────────────────────────────
# 3. MEMORY FILES
# ─────────────────────────────────────────────────────────────────────
def tar_memory_files(workdir: str) -> str:
    archive = os.path.join(workdir, f"memory-{_timestamp()}.tar.gz")
    paths_to_include = []
    if os.path.isdir("/app/memory"):
        paths_to_include.append(("-C", "/app", "memory"))
    # Also pull all top-level *.md in /app/backend
    md_files = list(Path("/app/backend").glob("*.md"))
    if md_files:
        # Write to a temp list file for tar -T
        list_file = os.path.join(workdir, "_memory_files.txt")
        with open(list_file, "w") as f:
            for p in md_files:
                f.write(f"{p.relative_to('/app')}\n")
        # We'll tar these separately below
    # Use a flat approach: tar memory + *.md with relative paths rooted at /app
    cmd = ["tar", "-czf", archive, "-C", "/app"]
    if os.path.isdir("/app/memory"):
        cmd.append("memory")
    for p in md_files:
        cmd.append(str(p.relative_to("/app")))
    if len(cmd) <= 5:  # nothing to tar
        return ""
    rc, out = _run(cmd, timeout=120)
    if rc not in (0, 1) or not os.path.exists(archive):
        raise RuntimeError(f"memory tar failed (rc={rc}): {out[-2000:]}")
    logger.info(f"[SITEVAULT] memory tar OK → {archive}")
    return archive


# ─────────────────────────────────────────────────────────────────────
# 4. FRONTEND PUBLIC
# ─────────────────────────────────────────────────────────────────────
def tar_frontend_public(workdir: str) -> str:
    if not os.path.isdir("/app/frontend/public"):
        return ""
    archive = os.path.join(workdir, f"frontend-public-{_timestamp()}.tar.gz")
    cmd = ["tar", "-czf", archive, "-C", "/app/frontend", "public"]
    rc, out = _run(cmd, timeout=300)
    if rc not in (0, 1) or not os.path.exists(archive):
        raise RuntimeError(f"frontend-public tar failed (rc={rc}): {out[-2000:]}")
    logger.info(f"[SITEVAULT] frontend/public tar OK → {archive}")
    return archive


# ─────────────────────────────────────────────────────────────────────
# 5. SUPERVISOR LOGS (last 7 days)
# ─────────────────────────────────────────────────────────────────────
def collect_supervisor_logs(workdir: str) -> str:
    log_dir = "/var/log/supervisor"
    if not os.path.isdir(log_dir):
        return ""
    archive = os.path.join(workdir, f"supervisor-logs-{_timestamp()}.tar.gz")
    cutoff = datetime.now().timestamp() - 7 * 86400

    collected = []
    for name in os.listdir(log_dir):
        full = os.path.join(log_dir, name)
        try:
            if os.path.isfile(full) and os.path.getmtime(full) > cutoff:
                collected.append(name)
        except OSError:
            continue

    if not collected:
        return ""

    cmd = ["tar", "-czf", archive, "-C", log_dir] + collected
    rc, out = _run(cmd, timeout=300)
    if rc not in (0, 1) or not os.path.exists(archive):
        raise RuntimeError(f"supervisor-logs tar failed (rc={rc}): {out[-2000:]}")
    logger.info(f"[SITEVAULT] supervisor-logs tar OK → {archive}")
    return archive


# ─────────────────────────────────────────────────────────────────────
# 6. .env TEMPLATE (redacted)
# ─────────────────────────────────────────────────────────────────────
def build_env_template(workdir: str) -> str:
    out_path = os.path.join(workdir, f"env-template-{_timestamp()}.txt")
    lines_out = ["# .env TEMPLATE (values redacted — keys preserved)",
                 f"# generated {datetime.now(timezone.utc).isoformat()}",
                 ""]
    for env_file in ["/app/backend/.env", "/app/frontend/.env"]:
        if not os.path.exists(env_file):
            continue
        lines_out.append(f"# === {env_file} ===")
        with open(env_file) as f:
            for line in f:
                line = line.rstrip("\n")
                if not line or line.startswith("#"):
                    lines_out.append(line)
                    continue
                if "=" not in line:
                    lines_out.append(line)
                    continue
                key, _ = line.split("=", 1)
                key = key.strip()
                # Keys that are "safe" to preserve literal value (URLs, names, flags)
                safe_prefixes = ("REACT_APP_BACKEND_URL", "GUPSHUP_APP_NAME",
                                 "GUPSHUP_SOURCE_NUMBER", "ZOHO_DC", "ZOHO_ENABLED",
                                 "SITEVAULT_ENABLED", "SITEVAULT_TZ", "DB_NAME",
                                 "WHATSAPP_NUMBER", "SENDER_EMAIL")
                if key.startswith(safe_prefixes):
                    lines_out.append(line)
                else:
                    lines_out.append(f"{key}=<REDACTED>")
        lines_out.append("")
    with open(out_path, "w") as f:
        f.write("\n".join(lines_out))
    logger.info(f"[SITEVAULT] .env template → {out_path}")
    return out_path


# ─────────────────────────────────────────────────────────────────────
# 7. CLOUDINARY MANIFEST
# ─────────────────────────────────────────────────────────────────────
async def build_cloudinary_manifest(workdir: str) -> str:
    """
    Crawl DB for every image URL + public_id across:
      products_master, services_master, pets, care_bundles, occasion_boxes,
      users (avatars), mira_conversations (message images), service_desk_tickets
    """
    if _db is None:
        raise RuntimeError("DB not initialised")

    manifest = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "collections": {},
    }

    async def _harvest(coll: str, url_fields: List[str], id_field: str = "id"):
        bucket = []
        try:
            cursor = _db[coll].find({}, {**{f: 1 for f in url_fields}, id_field: 1, "_id": 0})
            async for doc in cursor:
                entry = {id_field: doc.get(id_field)}
                found = False
                for f in url_fields:
                    v = doc.get(f)
                    if isinstance(v, str) and v.startswith("http"):
                        entry[f] = v
                        found = True
                    elif isinstance(v, list):
                        urls = [u for u in v if isinstance(u, str) and u.startswith("http")]
                        if urls:
                            entry[f] = urls
                            found = True
                if found:
                    bucket.append(entry)
        except Exception as e:
            logger.warning(f"[SITEVAULT] harvest {coll} failed: {e}")
        manifest["collections"][coll] = bucket
        logger.info(f"[SITEVAULT] manifest: {coll} → {len(bucket)} items with URLs")

    await _harvest("products_master", ["image_url", "images", "thumbnail_url"])
    await _harvest("services_master", ["image_url", "images", "thumbnail_url"])
    await _harvest("pets", ["photo_url", "image_url", "avatar_url"])
    await _harvest("care_bundles", ["image_url", "hero_image"])
    await _harvest("occasion_boxes", ["image_url", "hero_image"])
    await _harvest("users", ["avatar_url", "profile_image"])
    await _harvest("service_desk_tickets", ["photo_url", "soul_made_photo"], id_field="ticket_id")

    out_path = os.path.join(workdir, f"cloudinary-manifest-{_timestamp()}.json")
    with open(out_path, "w") as f:
        json.dump(manifest, f, indent=2, default=str)
    total = sum(len(v) for v in manifest["collections"].values())
    logger.info(f"[SITEVAULT] cloudinary manifest → {total} docs with URLs")
    return out_path


# ─────────────────────────────────────────────────────────────────────
# 8. CLOUDINARY FULL DOWNLOAD (heavy — weekly only)
# ─────────────────────────────────────────────────────────────────────
async def download_all_cloudinary(workdir: str, max_concurrent: int = 8) -> str:
    """
    Extract every URL from the manifest, download each image in parallel batches,
    tar.gz them keyed by collection/public_id. This is the expensive one.
    """
    manifest_path = await build_cloudinary_manifest(workdir)
    with open(manifest_path) as f:
        manifest = json.load(f)

    images_dir = os.path.join(workdir, "cloudinary-images")
    os.makedirs(images_dir, exist_ok=True)

    # Flatten all URLs
    all_urls: List[Tuple[str, str, str]] = []  # (collection, item_id, url)
    for coll, items in manifest["collections"].items():
        for item in items:
            item_id = item.get("id") or item.get("ticket_id") or "unknown"
            for key, val in item.items():
                if key in ("id", "ticket_id"):
                    continue
                if isinstance(val, str) and val.startswith("http"):
                    all_urls.append((coll, str(item_id), val))
                elif isinstance(val, list):
                    for u in val:
                        if isinstance(u, str) and u.startswith("http"):
                            all_urls.append((coll, str(item_id), u))

    logger.info(f"[SITEVAULT] Cloudinary full download: {len(all_urls)} images to fetch")

    sem = asyncio.Semaphore(max_concurrent)
    stats = {"ok": 0, "fail": 0, "bytes": 0}

    async def fetch_one(client: httpx.AsyncClient, coll: str, item_id: str, url: str):
        async with sem:
            try:
                resp = await client.get(url, timeout=60.0, follow_redirects=True)
                if resp.status_code != 200:
                    stats["fail"] += 1
                    return
                # Build deterministic filename: collection/item_id/sha1-of-url.ext
                parsed = urlparse(url)
                ext = os.path.splitext(parsed.path)[1] or ".jpg"
                if len(ext) > 6:
                    ext = ".jpg"
                url_hash = hashlib.sha1(url.encode()).hexdigest()[:16]
                dest_dir = os.path.join(images_dir, coll, item_id)
                os.makedirs(dest_dir, exist_ok=True)
                dest_path = os.path.join(dest_dir, f"{url_hash}{ext}")
                with open(dest_path, "wb") as fp:
                    fp.write(resp.content)
                stats["ok"] += 1
                stats["bytes"] += len(resp.content)
            except Exception as e:
                stats["fail"] += 1
                logger.debug(f"[SITEVAULT] image fetch {url} failed: {e}")

    async with httpx.AsyncClient() as client:
        tasks = [fetch_one(client, c, i, u) for (c, i, u) in all_urls]
        # Process in chunks so we can log progress
        chunk = 200
        for i in range(0, len(tasks), chunk):
            await asyncio.gather(*tasks[i:i + chunk])
            logger.info(f"[SITEVAULT] Cloudinary progress: {min(i + chunk, len(tasks))}/{len(tasks)}"
                        f" (ok={stats['ok']} fail={stats['fail']} "
                        f"{stats['bytes'] / 1024 / 1024:.1f} MB)")

    # Write stats file
    with open(os.path.join(images_dir, "_download_stats.json"), "w") as f:
        json.dump({"stats": stats, "total_urls": len(all_urls),
                   "generated_at": datetime.now(timezone.utc).isoformat()}, f, indent=2)

    # Tar the whole directory
    archive = os.path.join(workdir, f"cloudinary-full-{_timestamp()}.tar.gz")
    cmd = ["tar", "-czf", archive, "-C", workdir, "cloudinary-images"]
    rc, out = _run(cmd, timeout=3600)
    if rc not in (0, 1) or not os.path.exists(archive):
        raise RuntimeError(f"cloudinary tar failed (rc={rc}): {out[-2000:]}")

    # Free disk — remove raw files
    shutil.rmtree(images_dir, ignore_errors=True)

    logger.info(f"[SITEVAULT] cloudinary full → {archive} "
                f"({os.path.getsize(archive) / 1024 / 1024:.1f} MB, "
                f"ok={stats['ok']} fail={stats['fail']})")
    return archive


# ─────────────────────────────────────────────────────────────────────
# 9. ADMIN REPORTS CSV
# ─────────────────────────────────────────────────────────────────────
async def export_admin_reports_csv(workdir: str) -> List[str]:
    """Export tickets, orders, users as CSVs."""
    if _db is None:
        raise RuntimeError("DB not initialised")
    out_paths = []
    ts = _timestamp()

    exports = {
        "tickets": ("service_desk_tickets",
                    ["ticket_id", "subject", "status", "priority", "pillar",
                     "user_name", "user_email", "user_phone", "pet_name",
                     "created_at", "updated_at", "zoho_ticket_id"]),
        "orders":  ("orders",
                    ["order_id", "user_email", "total_amount", "status",
                     "items_count", "created_at", "payment_status"]),
        "users":   ("users",
                    ["email", "name", "phone", "created_at", "pet_count"]),
    }

    for label, (coll, cols) in exports.items():
        path = os.path.join(workdir, f"admin-{label}-{ts}.csv")
        rows = 0
        with open(path, "w", newline="") as f:
            w = csv.DictWriter(f, fieldnames=cols, extrasaction="ignore")
            w.writeheader()
            try:
                cursor = _db[coll].find({}, {**{c: 1 for c in cols}, "_id": 0})
                async for doc in cursor:
                    # Flatten any nested structures to strings
                    clean = {c: ("" if doc.get(c) is None else
                                 json.dumps(doc.get(c), default=str) if isinstance(doc.get(c), (dict, list))
                                 else str(doc.get(c))) for c in cols}
                    w.writerow(clean)
                    rows += 1
            except Exception as e:
                logger.warning(f"[SITEVAULT] CSV export {coll} failed partway: {e}")
        logger.info(f"[SITEVAULT] CSV {label} → {rows} rows")
        out_paths.append(path)

    return out_paths


# ─────────────────────────────────────────────────────────────────────
# 10. SHOPIFY SYNC STATE
# ─────────────────────────────────────────────────────────────────────
async def build_shopify_sync_state(workdir: str) -> str:
    """Export mapping of local product_id → shopify_id (if any)."""
    if _db is None:
        return ""
    path = os.path.join(workdir, f"shopify-sync-state-{_timestamp()}.json")
    mappings = []
    try:
        cursor = _db.products_master.find(
            {"$or": [{"shopify_id": {"$exists": True}}, {"shopify_product_id": {"$exists": True}}]},
            {"_id": 0, "id": 1, "name": 1, "shopify_id": 1, "shopify_product_id": 1,
             "shopify_variant_id": 1, "sku": 1},
        )
        async for doc in cursor:
            mappings.append(doc)
    except Exception as e:
        logger.warning(f"[SITEVAULT] shopify sync state failed: {e}")

    with open(path, "w") as f:
        json.dump({"generated_at": datetime.now(timezone.utc).isoformat(),
                   "count": len(mappings),
                   "mappings": mappings}, f, indent=2, default=str)
    logger.info(f"[SITEVAULT] shopify sync state → {len(mappings)} products")
    return path


# ─────────────────────────────────────────────────────────────────────
# 11. ORCHESTRATORS
# ─────────────────────────────────────────────────────────────────────
async def run_daily_backup() -> Dict[str, Any]:
    """Nightly 3am: Mongo dump + memory + supervisor logs + cloudinary manifest."""
    if not drive.is_enabled():
        return {"skipped": True, "reason": "SITEVAULT_ENABLED=false"}

    run_id = _timestamp()
    report = {"run_id": run_id, "type": "daily", "started_at": datetime.now(timezone.utc).isoformat(),
              "uploads": [], "errors": []}

    workdir = tempfile.mkdtemp(prefix=f"sitevault-daily-{run_id}-")
    try:
        folders = drive.ensure_folder_tree()

        # 1. Mongo dump
        try:
            mongo_file = dump_mongodb(workdir)
            res = drive.upload_file(mongo_file, folders["Daily-DB-Snapshots"],
                                    description=f"daily_db_{run_id}")
            report["uploads"].append({"name": os.path.basename(mongo_file), "drive_id": res["id"]})
        except Exception as e:
            report["errors"].append(f"mongodump: {e}")
            logger.exception("[SITEVAULT] daily mongo dump failed")

        # 2. Memory files
        try:
            mem = tar_memory_files(workdir)
            if mem:
                res = drive.upload_file(mem, folders["Documents"], description=f"daily_memory_{run_id}")
                report["uploads"].append({"name": os.path.basename(mem), "drive_id": res["id"]})
        except Exception as e:
            report["errors"].append(f"memory: {e}")

        # 3. Supervisor logs
        try:
            logs = collect_supervisor_logs(workdir)
            if logs:
                res = drive.upload_file(logs, folders["Logs"], description=f"daily_logs_{run_id}")
                report["uploads"].append({"name": os.path.basename(logs), "drive_id": res["id"]})
        except Exception as e:
            report["errors"].append(f"logs: {e}")

        # 4. Cloudinary MANIFEST (lightweight — full download is weekly)
        try:
            mani = await build_cloudinary_manifest(workdir)
            res = drive.upload_file(mani, folders["Documents"],
                                    description=f"daily_cloudinary_manifest_{run_id}")
            report["uploads"].append({"name": os.path.basename(mani), "drive_id": res["id"]})
        except Exception as e:
            report["errors"].append(f"cloudinary_manifest: {e}")

    finally:
        shutil.rmtree(workdir, ignore_errors=True)

    report["completed_at"] = datetime.now(timezone.utc).isoformat()
    await _persist_report(report)
    return report


async def run_weekly_backup() -> Dict[str, Any]:
    """Monday 3am: EVERYTHING (including Cloudinary full download + gold master)."""
    if not drive.is_enabled():
        return {"skipped": True, "reason": "SITEVAULT_ENABLED=false"}

    run_id = _timestamp()
    report = {"run_id": run_id, "type": "weekly", "started_at": datetime.now(timezone.utc).isoformat(),
              "uploads": [], "errors": []}

    workdir = tempfile.mkdtemp(prefix=f"sitevault-weekly-{run_id}-")
    try:
        folders = drive.ensure_folder_tree()

        # 1. Mongo dump (goes to Gold Masters)
        try:
            mongo_file = dump_mongodb(workdir)
            res = drive.upload_file(mongo_file, folders["Weekly-Gold-Masters"],
                                    description=f"weekly_db_{run_id}")
            report["uploads"].append({"name": os.path.basename(mongo_file), "drive_id": res["id"]})
        except Exception as e:
            report["errors"].append(f"mongodump: {e}")

        # 2. Source code tar
        try:
            src = tar_source_code(workdir)
            res = drive.upload_file(src, folders["Source-Code-Archive"], description=f"weekly_src_{run_id}")
            report["uploads"].append({"name": os.path.basename(src), "drive_id": res["id"]})
        except Exception as e:
            report["errors"].append(f"source: {e}")

        # 3. Frontend public
        try:
            pub = tar_frontend_public(workdir)
            if pub:
                res = drive.upload_file(pub, folders["Source-Code-Archive"],
                                        description=f"weekly_frontend_public_{run_id}")
                report["uploads"].append({"name": os.path.basename(pub), "drive_id": res["id"]})
        except Exception as e:
            report["errors"].append(f"frontend_public: {e}")

        # 4. Memory
        try:
            mem = tar_memory_files(workdir)
            if mem:
                res = drive.upload_file(mem, folders["Documents"], description=f"weekly_memory_{run_id}")
                report["uploads"].append({"name": os.path.basename(mem), "drive_id": res["id"]})
        except Exception as e:
            report["errors"].append(f"memory: {e}")

        # 5. Supervisor logs
        try:
            logs = collect_supervisor_logs(workdir)
            if logs:
                res = drive.upload_file(logs, folders["Logs"], description=f"weekly_logs_{run_id}")
                report["uploads"].append({"name": os.path.basename(logs), "drive_id": res["id"]})
        except Exception as e:
            report["errors"].append(f"logs: {e}")

        # 6. .env template
        try:
            env_t = build_env_template(workdir)
            res = drive.upload_file(env_t, folders["Documents"], description=f"weekly_env_template_{run_id}")
            report["uploads"].append({"name": os.path.basename(env_t), "drive_id": res["id"]})
        except Exception as e:
            report["errors"].append(f"env_template: {e}")

        # 7. Admin reports CSV
        try:
            csvs = await export_admin_reports_csv(workdir)
            for c in csvs:
                res = drive.upload_file(c, folders["Admin-Reports"],
                                        description=f"weekly_report_{run_id}")
                report["uploads"].append({"name": os.path.basename(c), "drive_id": res["id"]})
        except Exception as e:
            report["errors"].append(f"admin_reports: {e}")

        # 8. Shopify sync state
        try:
            shop = await build_shopify_sync_state(workdir)
            if shop:
                res = drive.upload_file(shop, folders["Documents"], description=f"weekly_shopify_{run_id}")
                report["uploads"].append({"name": os.path.basename(shop), "drive_id": res["id"]})
        except Exception as e:
            report["errors"].append(f"shopify: {e}")

        # 9. Cloudinary FULL (heavy — gated by env)
        do_cloudinary = os.environ.get("SITEVAULT_CLOUDINARY_BACKUP", "true").lower() == "true"
        if do_cloudinary:
            try:
                cl = await download_all_cloudinary(workdir)
                res = drive.upload_file(cl, folders["Cloudinary-Images"],
                                        description=f"weekly_cloudinary_full_{run_id}")
                report["uploads"].append({"name": os.path.basename(cl), "drive_id": res["id"]})
            except Exception as e:
                report["errors"].append(f"cloudinary_full: {e}")
                logger.exception("[SITEVAULT] cloudinary full download failed")

    finally:
        shutil.rmtree(workdir, ignore_errors=True)

    report["completed_at"] = datetime.now(timezone.utc).isoformat()
    await _persist_report(report)

    # After weekly, run retention cleaner
    try:
        cleaned = run_retention_cleaner()
        report["retention_cleanup"] = cleaned
    except Exception as e:
        report["errors"].append(f"retention: {e}")
    return report


# ─────────────────────────────────────────────────────────────────────
# 12. RETENTION CLEANER
# ─────────────────────────────────────────────────────────────────────
def run_retention_cleaner() -> Dict[str, Any]:
    """
    Enforce:
      - Daily-DB-Snapshots: keep 30 days
      - Logs: keep 30 days
      - Documents (daily only): keep 30 days
      - Weekly-Gold-Masters: keep 12 weeks (84 days) UNLESS pinned
      - Source-Code-Archive: keep 12 weeks
      - Cloudinary-Images: keep 12 weeks
      - Admin-Reports: keep 12 weeks
    Files with description='gold_master_pinned' are NEVER deleted.
    """
    if not drive.is_enabled():
        return {"skipped": True}

    folders = drive.ensure_folder_tree()
    daily_cutoff = datetime.now(timezone.utc) - timedelta(days=int(os.environ.get("SITEVAULT_DAILY_RETENTION_DAYS", "30")))
    weekly_cutoff = datetime.now(timezone.utc) - timedelta(weeks=int(os.environ.get("SITEVAULT_WEEKLY_RETENTION_WEEKS", "12")))

    folder_cutoff_map = {
        "Daily-DB-Snapshots": daily_cutoff,
        "Logs": daily_cutoff,
        "Documents": daily_cutoff,           # weekly docs also captured as "weekly_*"; pinned survives
        "Weekly-Gold-Masters": weekly_cutoff,
        "Source-Code-Archive": weekly_cutoff,
        "Cloudinary-Images": weekly_cutoff,
        "Admin-Reports": weekly_cutoff,
    }

    deleted = []
    skipped_pinned = []
    for folder_name, cutoff in folder_cutoff_map.items():
        fid = folders.get(folder_name)
        if not fid:
            continue
        files = drive.list_files(fid, limit=2000)
        for f in files:
            if drive.is_pinned(f):
                skipped_pinned.append({"folder": folder_name, "name": f["name"]})
                continue
            # Parse createdTime
            ct = f.get("createdTime")
            if not ct:
                continue
            try:
                created = datetime.fromisoformat(ct.replace("Z", "+00:00"))
            except Exception:
                continue
            if created < cutoff:
                try:
                    drive.delete_file(f["id"])
                    deleted.append({"folder": folder_name, "name": f["name"], "created": ct})
                except Exception as e:
                    logger.warning(f"[SITEVAULT] retention delete failed for {f['name']}: {e}")

    logger.info(f"[SITEVAULT] Retention: deleted {len(deleted)}, pinned {len(skipped_pinned)}")
    return {"deleted_count": len(deleted), "deleted": deleted[:50],
            "pinned_kept": len(skipped_pinned)}


# ─────────────────────────────────────────────────────────────────────
# REPORT PERSISTENCE
# ─────────────────────────────────────────────────────────────────────
async def _persist_report(report: Dict[str, Any]):
    if _db is None:
        return
    try:
        await _db.sitevault_runs.insert_one({**report, "_id": report["run_id"]})
    except Exception as e:
        logger.warning(f"[SITEVAULT] persist report failed: {e}")

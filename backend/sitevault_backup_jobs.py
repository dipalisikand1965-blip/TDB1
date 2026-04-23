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
# 2b. FULL PROJECT TARBALL (Gold Master — EVERYTHING except junk)
# ─────────────────────────────────────────────────────────────────────
# These are the ONLY things we exclude. Everything else — every .md,
# .html, .css, .xlsx, .csv, .py, .js, .json, .env.template, uploaded
# files, seed scripts, notes — gets archived.
FULL_PROJECT_EXCLUDES = [
    "node_modules",
    ".git",
    "__pycache__",
    ".next",
    "build",
    "dist",
    ".venv", "venv",
    ".pytest_cache",
    ".ruff_cache",
    "*.pyc",
    ".DS_Store",
    # Our own backup's temp workdirs (if archived run overlaps)
    "sitevault-daily-*",
    "sitevault-weekly-*",
    # secrets folder — contains Google SA key; NEVER goes into the archive
    "secrets",
    # raw .env files — redacted template goes separately
    ".env",
]


def tar_full_project(workdir: str) -> str:
    """
    Creates a single tar.gz of the ENTIRE /app directory tree minus
    FULL_PROJECT_EXCLUDES. This is the weekly 'Gold Master' — every
    .md doc, .html page, .css file, config, seed script, user upload,
    EVERYTHING, in one restore-ready archive.
    """
    archive = os.path.join(workdir, f"full-project-{_timestamp()}.tar.gz")
    exclude_args = [f"--exclude={p}" for p in FULL_PROJECT_EXCLUDES]
    # -C / means we start from filesystem root, and 'app' is relative —
    # this lets us restore with `tar -xzf archive.tar.gz -C /` to put
    # files exactly back where they were.
    cmd = ["tar", "-czf", archive] + exclude_args + ["-C", "/", "app"]

    rc, out = _run(cmd, timeout=1800)  # allow 30 min for huge projects
    if rc not in (0, 1) or not os.path.exists(archive):
        raise RuntimeError(f"full-project tar failed (rc={rc}): {out[-2000:]}")
    size_mb = os.path.getsize(archive) / 1024 / 1024
    logger.info(f"[SITEVAULT] full-project tar OK → {archive} ({size_mb:.1f} MB)")
    return archive


# ─────────────────────────────────────────────────────────────────────
# 2c. DOCUMENTS MIRROR (.md + .html + .css + .txt + .xlsx + .csv)
# ─────────────────────────────────────────────────────────────────────
DOCS_PATTERNS = ["*.md", "*.html", "*.css", "*.txt", "*.xlsx", "*.csv", "*.json"]
DOCS_SEARCH_ROOTS = [
    "/app",
    "/app/memory",
    "/app/backend",
    "/app/frontend",
    "/app/frontend/public",
    "/app/frontend/src",
]
DOCS_EXCLUDE_DIRS = [
    "node_modules", ".git", "__pycache__", "build", "dist",
    ".next", ".venv", "venv", ".pytest_cache", ".ruff_cache",
    "secrets",
]


def mirror_documents(workdir: str) -> str:
    """
    Collect EVERY .md, .html, .css, .txt, .xlsx, .csv, .json across the
    project (excluding noise dirs) into a single tarball preserving
    relative paths under /app/.

    Specifically includes:
      - PetWrapped intro pages (investor.html, pet-wrapped-mystique.html, etc.)
      - All roadmaps / architecture docs (SYSTEM_OVERVIEW.md, MIRA_OS_ARCHITECTURE.md, etc.)
      - Design tokens (tdc-design-tokens.css, index.css, all CSS)
      - Seed data (Celebrate_ProductCatalogue_SEED.xlsx, bundles_catalog.csv, etc.)
      - Any session summary / handover / status .md files
    """
    archive = os.path.join(workdir, f"documents-mirror-{_timestamp()}.tar.gz")

    # Build a file list using `find` — fast, correct, handles exclusions.
    # One find per search root, patterns OR'd together.
    candidates: set = set()
    for root in DOCS_SEARCH_ROOTS:
        if not os.path.isdir(root):
            continue
        for pattern in DOCS_PATTERNS:
            # Build `find ROOT -type f -name pattern` while pruning noise
            prune_args = []
            for ex in DOCS_EXCLUDE_DIRS:
                prune_args.extend(["-name", ex, "-prune", "-o"])
            cmd = ["find", root] + prune_args + [
                "-type", "f", "-name", pattern, "-print"
            ]
            rc, out = _run(cmd, timeout=60)
            if rc == 0:
                for line in out.splitlines():
                    p = line.strip()
                    if p and os.path.isfile(p):
                        candidates.add(p)

    # Convert to relative paths for tar -T
    rel_paths = []
    for p in sorted(candidates):
        if p.startswith("/app/"):
            rel_paths.append(p[len("/"):])  # strip leading "/" → "app/..."
    if not rel_paths:
        logger.warning("[SITEVAULT] documents mirror: no files found")
        return ""

    # Use tar -T with a list file (handles thousands of paths safely)
    list_file = os.path.join(workdir, "_docs_list.txt")
    with open(list_file, "w") as f:
        f.write("\n".join(rel_paths))

    cmd = ["tar", "-czf", archive, "-C", "/", "-T", list_file]
    rc, out = _run(cmd, timeout=300)
    if rc not in (0, 1) or not os.path.exists(archive):
        raise RuntimeError(f"documents mirror tar failed (rc={rc}): {out[-2000:]}")

    # Clean up list file
    try:
        os.unlink(list_file)
    except OSError:
        pass

    size_mb = os.path.getsize(archive) / 1024 / 1024
    logger.info(f"[SITEVAULT] documents mirror OK → {len(rel_paths)} files, {size_mb:.1f} MB")
    return archive


# ─────────────────────────────────────────────────────────────────────
# 2d. USER UPLOADS (everything users + admins have uploaded)
# ─────────────────────────────────────────────────────────────────────
UPLOAD_DIRS = [
    "/app/uploads",
    "/app/backend/uploads",
    "/app/backend/static/uploads",
    "/mnt/user-data/uploads",  # agent-uploaded artifacts (may not exist)
]


def tar_user_uploads(workdir: str) -> str:
    """
    Tarball every user/admin-uploaded file across all known upload dirs.
    Ignores dirs that don't exist.
    """
    archive = os.path.join(workdir, f"user-uploads-{_timestamp()}.tar.gz")
    existing = [d for d in UPLOAD_DIRS if os.path.isdir(d) and os.listdir(d)]
    if not existing:
        logger.info("[SITEVAULT] user-uploads: no upload dirs found, skipping")
        return ""

    # tar each existing dir into the archive, preserving absolute-ish paths
    # (we use `-C /` and strip leading slash from each arg)
    rel_dirs = [d[len("/"):] for d in existing]
    cmd = ["tar", "-czf", archive, "-C", "/"] + rel_dirs
    rc, out = _run(cmd, timeout=600)
    if rc not in (0, 1) or not os.path.exists(archive):
        raise RuntimeError(f"user-uploads tar failed (rc={rc}): {out[-2000:]}")
    size_mb = os.path.getsize(archive) / 1024 / 1024
    logger.info(f"[SITEVAULT] user-uploads tar OK → {len(existing)} dirs, {size_mb:.1f} MB")
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
# 8. CLOUDINARY FULL DOWNLOAD (heavy — weekly only, streaming + chunked)
# ─────────────────────────────────────────────────────────────────────
async def download_all_cloudinary(workdir: str, max_concurrent: int = 8,
                                   shard_size: int = 2000,
                                   drive_folder_id: Optional[str] = None) -> List[str]:
    """
    Interruption-resilient Cloudinary full backup.

    Strategy:
      - Chunk all URLs into shards of `shard_size` each (default 2000 ≈ 600 MB)
      - For each shard:
          (a) Open a streaming tar.gz writer
          (b) Download images in parallel, add each directly to the tar as bytes
              via tarfile.addfile() — no temp image files on disk
          (c) Close tar → upload to Drive → unlink local tar → next shard
      - If process crashes mid-shard, only that shard is lost; all previous
        shards are safely in Drive.

    Returns a list of local tarball paths (already deleted after upload).
    """
    manifest_path = await build_cloudinary_manifest(workdir)
    with open(manifest_path) as f:
        manifest = json.load(f)

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

    total = len(all_urls)
    shard_count = (total + shard_size - 1) // shard_size
    logger.info(f"[SITEVAULT] Cloudinary full: {total} images → {shard_count} shards "
                f"of {shard_size} each (max {shard_size * 600 // 1024} MB per shard)")

    # Import here to avoid issues with module reload
    import sitevault_drive_client as _drive

    uploaded_tars: List[str] = []
    overall_stats = {"ok": 0, "fail": 0, "bytes": 0, "shards_uploaded": 0}
    ts = _timestamp()

    for shard_idx in range(shard_count):
        start = shard_idx * shard_size
        end = min(start + shard_size, total)
        shard_urls = all_urls[start:end]

        shard_path = os.path.join(workdir, f"cloudinary-{ts}-shard{shard_idx + 1:03d}-of-{shard_count:03d}.tar.gz")
        shard_stats = {"ok": 0, "fail": 0, "bytes": 0}

        logger.info(f"[SITEVAULT] Shard {shard_idx + 1}/{shard_count}: downloading {len(shard_urls)} images → {os.path.basename(shard_path)}")

        # Open streaming tar (gzip). `w:gz` = block-based, seekable;
        # OK since our tar is file-backed (not a pipe). Use `w|gz` if truly streaming.
        tar = tarfile.open(shard_path, "w:gz", compresslevel=6)
        tar_lock = asyncio.Lock()  # tar is NOT thread-safe

        sem = asyncio.Semaphore(max_concurrent)

        async def fetch_into_tar(client: httpx.AsyncClient, coll: str, item_id: str, url: str):
            async with sem:
                try:
                    resp = await client.get(url, timeout=60.0, follow_redirects=True)
                    if resp.status_code != 200:
                        shard_stats["fail"] += 1
                        return
                    data = resp.content
                    # Deterministic name: collection/item_id/hash.ext
                    parsed = urlparse(url)
                    ext = os.path.splitext(parsed.path)[1] or ".jpg"
                    if len(ext) > 6 or not ext.startswith("."):
                        ext = ".jpg"
                    url_hash = hashlib.sha1(url.encode()).hexdigest()[:16]
                    arcname = f"cloudinary-images/{coll}/{item_id}/{url_hash}{ext}"

                    info = tarfile.TarInfo(name=arcname)
                    info.size = len(data)
                    info.mtime = int(datetime.now(timezone.utc).timestamp())

                    async with tar_lock:
                        tar.addfile(info, io.BytesIO(data))
                    shard_stats["ok"] += 1
                    shard_stats["bytes"] += len(data)
                except Exception as e:
                    shard_stats["fail"] += 1
                    logger.debug(f"[SITEVAULT] image fetch {url} failed: {e}")

        try:
            async with httpx.AsyncClient() as client:
                tasks = [fetch_into_tar(client, c, i, u) for (c, i, u) in shard_urls]
                # Process in mini-batches of 200 so we can log progress
                progress_step = 200
                for i in range(0, len(tasks), progress_step):
                    await asyncio.gather(*tasks[i:i + progress_step])
                    done = min(i + progress_step, len(tasks))
                    logger.info(f"[SITEVAULT] Shard {shard_idx + 1}/{shard_count} progress: "
                                f"{done}/{len(tasks)} "
                                f"(ok={shard_stats['ok']} fail={shard_stats['fail']} "
                                f"{shard_stats['bytes'] / 1024 / 1024:.1f} MB)")

            # Add a per-shard stats file
            stats_json = json.dumps({
                "shard": shard_idx + 1,
                "of_shards": shard_count,
                "url_range": [start, end],
                "stats": shard_stats,
                "generated_at": datetime.now(timezone.utc).isoformat(),
            }, indent=2).encode()
            info = tarfile.TarInfo(name=f"cloudinary-images/_shard_{shard_idx + 1:03d}_stats.json")
            info.size = len(stats_json)
            info.mtime = int(datetime.now(timezone.utc).timestamp())
            async with tar_lock:
                tar.addfile(info, io.BytesIO(stats_json))
        finally:
            tar.close()

        shard_mb = os.path.getsize(shard_path) / 1024 / 1024
        logger.info(f"[SITEVAULT] Shard {shard_idx + 1}/{shard_count} closed: "
                    f"{shard_mb:.1f} MB, ok={shard_stats['ok']} fail={shard_stats['fail']}")

        # Upload immediately
        if drive_folder_id:
            try:
                res = _drive.upload_file(
                    shard_path, drive_folder_id,
                    description=f"weekly_cloudinary_shard_{shard_idx + 1}_of_{shard_count}_{ts}",
                )
                logger.info(f"[SITEVAULT] Shard uploaded → drive id={res.get('id')}")
                uploaded_tars.append(shard_path)
                overall_stats["shards_uploaded"] += 1
            except Exception as e:
                logger.error(f"[SITEVAULT] Shard {shard_idx + 1} upload failed: {e}")

        # Free disk immediately
        try:
            os.unlink(shard_path)
        except OSError:
            pass

        overall_stats["ok"] += shard_stats["ok"]
        overall_stats["fail"] += shard_stats["fail"]
        overall_stats["bytes"] += shard_stats["bytes"]

    logger.info(f"[SITEVAULT] Cloudinary full complete: "
                f"{overall_stats['shards_uploaded']}/{shard_count} shards uploaded, "
                f"{overall_stats['ok']} ok / {overall_stats['fail']} fail, "
                f"{overall_stats['bytes'] / 1024 / 1024 / 1024:.2f} GB total")
    return uploaded_tars


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
    """Nightly 3am: Mongo dump + memory + supervisor logs + cloudinary manifest.

    HARDENED (Apr 2026, ScaleBoard Bug E pattern):
    - Pre-registers run record with status="running" so watchdog can detect
      crashes between start and terminal status write
    - try/finally guarantees a terminal status ("success" | "failed" | "skipped")
      is written even if the body crashes unexpectedly
    """
    if not drive.is_enabled():
        return {"skipped": True, "reason": "SITEVAULT_ENABLED=false"}

    run_id = _timestamp()
    report = {"run_id": run_id, "type": "daily", "started_at": datetime.now(timezone.utc).isoformat(),
              "uploads": [], "errors": [], "status": "running"}

    # Pre-register so watchdog can flip crashed runs to status="failed"
    await _pre_register_run(report)

    workdir = tempfile.mkdtemp(prefix=f"sitevault-daily-{run_id}-")
    crashed = False
    try:
        folders = drive.ensure_folder_tree()

        # 1. Mongo dump
        try:
            mongo_file = dump_mongodb(workdir)
            res = drive.upload_file(mongo_file, folders["Daily-DB-Snapshots"],
                                    description=f"daily_db_{run_id}")
            report["uploads"].append({"name": os.path.basename(mongo_file), "drive_id": res["id"], "size_bytes": res.get("size_bytes", 0)})
        except Exception as e:
            report["errors"].append(f"mongodump: {e}")
            logger.exception("[SITEVAULT] daily mongo dump failed")

        # 2. Memory files
        try:
            mem = tar_memory_files(workdir)
            if mem:
                res = drive.upload_file(mem, folders["Documents"], description=f"daily_memory_{run_id}")
                report["uploads"].append({"name": os.path.basename(mem), "drive_id": res["id"], "size_bytes": res.get("size_bytes", 0)})
        except Exception as e:
            report["errors"].append(f"memory: {e}")

        # 3. Supervisor logs
        try:
            logs = collect_supervisor_logs(workdir)
            if logs:
                res = drive.upload_file(logs, folders["Logs"], description=f"daily_logs_{run_id}")
                report["uploads"].append({"name": os.path.basename(logs), "drive_id": res["id"], "size_bytes": res.get("size_bytes", 0)})
        except Exception as e:
            report["errors"].append(f"logs: {e}")

        # 4. Cloudinary MANIFEST (lightweight — full download is weekly)
        try:
            mani = await build_cloudinary_manifest(workdir)
            res = drive.upload_file(mani, folders["Documents"],
                                    description=f"daily_cloudinary_manifest_{run_id}")
            report["uploads"].append({"name": os.path.basename(mani), "drive_id": res["id"], "size_bytes": res.get("size_bytes", 0)})
        except Exception as e:
            report["errors"].append(f"cloudinary_manifest: {e}")

        # 5. Documents mirror (.md / .html / .css / .txt / .xlsx / .csv)
        # Daily so we always have up-to-date docs even if weekly job hasn't run yet
        try:
            docs = mirror_documents(workdir)
            if docs:
                res = drive.upload_file(docs, folders["Documents"],
                                        description=f"daily_documents_mirror_{run_id}")
                report["uploads"].append({"name": os.path.basename(docs), "drive_id": res["id"], "size_bytes": res.get("size_bytes", 0)})
        except Exception as e:
            report["errors"].append(f"documents_mirror: {e}")

    except Exception as e:
        # Catch-all for unexpected failures (e.g. drive auth, workdir permissions)
        report["errors"].append(f"fatal: {e}")
        logger.exception("[SITEVAULT] daily backup crashed unexpectedly")
        crashed = True
    finally:
        shutil.rmtree(workdir, ignore_errors=True)
        # Always write terminal status — crash or not
        report["completed_at"] = datetime.now(timezone.utc).isoformat()
        if crashed:
            report["status"] = "failed"
        # _persist_report summarises and upserts — safe to call after crash
        try:
            await _persist_report(report)
        except Exception as _pe:
            logger.exception(f"[SITEVAULT] persist_report failed in finally: {_pe}")

    return report


async def run_weekly_backup() -> Dict[str, Any]:
    """Monday 3am: EVERYTHING (including Cloudinary full download + gold master).

    HARDENED (Apr 2026, ScaleBoard Bug E pattern):
    - Pre-registers run record with status="running"
    - try/finally guarantees terminal status on crash
    """
    if not drive.is_enabled():
        return {"skipped": True, "reason": "SITEVAULT_ENABLED=false"}

    run_id = _timestamp()
    report = {"run_id": run_id, "type": "weekly", "started_at": datetime.now(timezone.utc).isoformat(),
              "uploads": [], "errors": [], "status": "running"}

    # Pre-register so watchdog can detect crashes
    await _pre_register_run(report)

    workdir = tempfile.mkdtemp(prefix=f"sitevault-weekly-{run_id}-")
    crashed = False
    try:
        folders = drive.ensure_folder_tree()

        # 1. Mongo dump (goes to Gold Masters)
        try:
            mongo_file = dump_mongodb(workdir)
            res = drive.upload_file(mongo_file, folders["Weekly-Gold-Masters"],
                                    description=f"weekly_db_{run_id}")
            report["uploads"].append({"name": os.path.basename(mongo_file), "drive_id": res["id"], "size_bytes": res.get("size_bytes", 0)})
        except Exception as e:
            report["errors"].append(f"mongodump: {e}")

        # 2. Source code tar
        try:
            src = tar_source_code(workdir)
            res = drive.upload_file(src, folders["Source-Code-Archive"], description=f"weekly_src_{run_id}")
            report["uploads"].append({"name": os.path.basename(src), "drive_id": res["id"], "size_bytes": res.get("size_bytes", 0)})
        except Exception as e:
            report["errors"].append(f"source: {e}")

        # 2b. FULL PROJECT GOLD MASTER tarball — EVERYTHING in /app
        #     (minus node_modules / .git / __pycache__ / secrets / .env)
        try:
            full = tar_full_project(workdir)
            res = drive.upload_file(full, folders["Weekly-Gold-Masters"],
                                    description=f"weekly_full_project_gold_master_{run_id}")
            report["uploads"].append({"name": os.path.basename(full), "drive_id": res["id"], "size_bytes": res.get("size_bytes", 0)})
        except Exception as e:
            report["errors"].append(f"full_project: {e}")
            logger.exception("[SITEVAULT] full-project tar failed")

        # 2c. Documents mirror (.md / .html / .css / .txt / .xlsx / .csv)
        try:
            docs = mirror_documents(workdir)
            if docs:
                res = drive.upload_file(docs, folders["Documents"],
                                        description=f"weekly_documents_mirror_{run_id}")
                report["uploads"].append({"name": os.path.basename(docs), "drive_id": res["id"], "size_bytes": res.get("size_bytes", 0)})
        except Exception as e:
            report["errors"].append(f"documents_mirror: {e}")

        # 2d. User uploads (all upload dirs)
        try:
            uploads = tar_user_uploads(workdir)
            if uploads:
                res = drive.upload_file(uploads, folders["Documents"],
                                        description=f"weekly_user_uploads_{run_id}")
                report["uploads"].append({"name": os.path.basename(uploads), "drive_id": res["id"], "size_bytes": res.get("size_bytes", 0)})
        except Exception as e:
            report["errors"].append(f"user_uploads: {e}")

        # 3. Frontend public
        try:
            pub = tar_frontend_public(workdir)
            if pub:
                res = drive.upload_file(pub, folders["Source-Code-Archive"],
                                        description=f"weekly_frontend_public_{run_id}")
                report["uploads"].append({"name": os.path.basename(pub), "drive_id": res["id"], "size_bytes": res.get("size_bytes", 0)})
        except Exception as e:
            report["errors"].append(f"frontend_public: {e}")

        # 4. Memory
        try:
            mem = tar_memory_files(workdir)
            if mem:
                res = drive.upload_file(mem, folders["Documents"], description=f"weekly_memory_{run_id}")
                report["uploads"].append({"name": os.path.basename(mem), "drive_id": res["id"], "size_bytes": res.get("size_bytes", 0)})
        except Exception as e:
            report["errors"].append(f"memory: {e}")

        # 5. Supervisor logs
        try:
            logs = collect_supervisor_logs(workdir)
            if logs:
                res = drive.upload_file(logs, folders["Logs"], description=f"weekly_logs_{run_id}")
                report["uploads"].append({"name": os.path.basename(logs), "drive_id": res["id"], "size_bytes": res.get("size_bytes", 0)})
        except Exception as e:
            report["errors"].append(f"logs: {e}")

        # 6. .env template
        try:
            env_t = build_env_template(workdir)
            res = drive.upload_file(env_t, folders["Documents"], description=f"weekly_env_template_{run_id}")
            report["uploads"].append({"name": os.path.basename(env_t), "drive_id": res["id"], "size_bytes": res.get("size_bytes", 0)})
        except Exception as e:
            report["errors"].append(f"env_template: {e}")

        # 7. Admin reports CSV
        try:
            csvs = await export_admin_reports_csv(workdir)
            for c in csvs:
                res = drive.upload_file(c, folders["Admin-Reports"],
                                        description=f"weekly_report_{run_id}")
                report["uploads"].append({"name": os.path.basename(c), "drive_id": res["id"], "size_bytes": res.get("size_bytes", 0)})
        except Exception as e:
            report["errors"].append(f"admin_reports: {e}")

        # 8. Shopify sync state
        try:
            shop = await build_shopify_sync_state(workdir)
            if shop:
                res = drive.upload_file(shop, folders["Documents"], description=f"weekly_shopify_{run_id}")
                report["uploads"].append({"name": os.path.basename(shop), "drive_id": res["id"], "size_bytes": res.get("size_bytes", 0)})
        except Exception as e:
            report["errors"].append(f"shopify: {e}")

        # 9. Cloudinary FULL (heavy — gated by env)
        # New streaming-chunked approach: uploads each ~2000-image shard
        # as it's built, so a crash mid-way doesn't lose all progress.
        do_cloudinary = os.environ.get("SITEVAULT_CLOUDINARY_BACKUP", "true").lower() == "true"
        if do_cloudinary:
            try:
                shard_size = int(os.environ.get("SITEVAULT_CLOUDINARY_SHARD_SIZE", "2000"))
                uploaded = await download_all_cloudinary(
                    workdir,
                    shard_size=shard_size,
                    drive_folder_id=folders["Cloudinary-Images"],
                )
                for path in uploaded:
                    report["uploads"].append({
                        "name": os.path.basename(path),
                        "drive_folder": "Cloudinary-Images",
                    })
            except Exception as e:
                report["errors"].append(f"cloudinary_full: {e}")
                logger.exception("[SITEVAULT] cloudinary full download failed")

        # 10. Fort Knox (c) — Monthly Frozen Snapshot.
        # Check: does a `FROZEN_YYYY_MM_*` already exist in Monthly-Frozen-Snapshots?
        # If not, copy today's DB dump there. This pattern is resilient — if the
        # first-of-month weekly job fails, the next weekly job still creates the
        # monthly frozen. Matches ScaleBoard's reference implementation.
        # Monthly-Frozen-Snapshots folder is excluded from retention cleaner → forever.
        try:
            from datetime import datetime as _dt
            now_utc = _dt.now(timezone.utc)
            month_tag = now_utc.strftime("%Y_%m")
            frozen_folder_id = folders.get("Monthly-Frozen-Snapshots")
            if not frozen_folder_id:
                raise RuntimeError("Monthly-Frozen-Snapshots folder id missing")

            # Check existence via Drive list (name prefix FROZEN_<month_tag>_)
            from sitevault_drive_client import list_files as _list_files
            existing_frozen = _list_files(frozen_folder_id, limit=50)
            already_frozen = any(
                f.get("name", "").startswith(f"FROZEN_{month_tag}_")
                for f in existing_frozen
            )

            if already_frozen:
                logger.info(f"[SITEVAULT] Monthly frozen for {month_tag} already exists — skipping")
            else:
                # Find the DB snapshot file from this run and clone it into frozen folder
                db_upload = next(
                    (u for u in report["uploads"]
                     if "db_" in u.get("name", "").lower()),
                    None,
                )
                if db_upload and db_upload.get("drive_id"):
                    from sitevault_drive_client import _get_service
                    svc = _get_service()
                    frozen_name = f"FROZEN_{month_tag}_{db_upload['name']}"
                    copied = svc.files().copy(
                        fileId=db_upload["drive_id"],
                        body={
                            "name": frozen_name,
                            "parents": [frozen_folder_id],
                            "description": f"frozen_monthly_{month_tag} — NEVER AUTO-DELETE",
                            "keepRevisionForever": True,
                        },
                        supportsAllDrives=True,
                        fields="id,name,size",
                    ).execute()
                    report["uploads"].append({
                        "name": frozen_name,
                        "drive_id": copied.get("id"),
                        "drive_folder": "Monthly-Frozen-Snapshots",
                        "size_bytes": int(copied.get("size") or 0),
                        "frozen": True,
                    })
                    logger.info(f"[SITEVAULT] Fort Knox — frozen monthly snapshot created: {frozen_name}")
                else:
                    logger.warning(f"[SITEVAULT] No DB upload found this run to freeze for {month_tag}")
        except Exception as e:
            report["errors"].append(f"monthly_frozen: {e}")
            logger.exception("[SITEVAULT] monthly frozen snapshot failed")

    except Exception as e:
        report["errors"].append(f"fatal: {e}")
        logger.exception("[SITEVAULT] weekly backup crashed unexpectedly")
        crashed = True
    finally:
        shutil.rmtree(workdir, ignore_errors=True)
        report["completed_at"] = datetime.now(timezone.utc).isoformat()
        if crashed:
            report["status"] = "failed"
        try:
            await _persist_report(report)
        except Exception as _pe:
            logger.exception(f"[SITEVAULT] persist_report failed in finally: {_pe}")

    # After weekly, run retention cleaner (outside the main try so it runs even
    # if the body partially succeeded — _persist_report already captured status)
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
      - Weekly-Gold-Masters: keep 52 weeks (Fort Knox — was 12) UNLESS pinned
      - Monthly-Frozen-Snapshots: NEVER deleted (Fort Knox — kept forever)
      - Source-Code-Archive: keep 12 weeks
      - Cloudinary-Images: keep 12 weeks
      - Admin-Reports: keep 12 weeks
    Files with description='gold_master_pinned' are NEVER deleted.
    Monthly-Frozen-Snapshots folder is explicitly EXCLUDED from retention.
    """
    if not drive.is_enabled():
        return {"skipped": True}

    folders = drive.ensure_folder_tree()
    daily_cutoff = datetime.now(timezone.utc) - timedelta(days=int(os.environ.get("SITEVAULT_DAILY_RETENTION_DAYS", "30")))
    # Gold Masters: Fort Knox upgrade to 52 weeks. Override via env if needed.
    weekly_gold_cutoff = datetime.now(timezone.utc) - timedelta(weeks=int(os.environ.get("SITEVAULT_GOLD_RETENTION_WEEKS", "52")))
    weekly_cutoff = datetime.now(timezone.utc) - timedelta(weeks=int(os.environ.get("SITEVAULT_WEEKLY_RETENTION_WEEKS", "12")))

    folder_cutoff_map = {
        "Daily-DB-Snapshots": daily_cutoff,
        "Logs": daily_cutoff,
        "Documents": daily_cutoff,           # weekly docs also captured as "weekly_*"; pinned survives
        "Weekly-Gold-Masters": weekly_gold_cutoff,  # 52 weeks (Fort Knox)
        "Source-Code-Archive": weekly_cutoff,
        "Cloudinary-Images": weekly_cutoff,
        "Admin-Reports": weekly_cutoff,
        # Monthly-Frozen-Snapshots is intentionally OMITTED — kept forever.
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
                    # ScaleBoard hardening: delete_file now returns
                    # {"action": "deleted"|"trashed"|"failed", "error": ...}
                    # Trash fallback happens automatically if SA lacks canDelete.
                    result = drive.delete_file(f["id"])
                    action = (result or {}).get("action", "unknown")
                    if action in ("deleted", "trashed"):
                        deleted.append({"folder": folder_name, "name": f["name"], "created": ct, "action": action})
                    else:
                        logger.warning(f"[SITEVAULT] retention cleanup couldn't remove {f['name']}: {result}")
                except Exception as e:
                    logger.warning(f"[SITEVAULT] retention delete failed for {f['name']}: {e}")

    logger.info(f"[SITEVAULT] Retention: deleted {len(deleted)}, pinned {len(skipped_pinned)}")
    return {"deleted_count": len(deleted), "deleted": deleted[:50],
            "pinned_kept": len(skipped_pinned)}


# ─────────────────────────────────────────────────────────────────────
# REPORT PERSISTENCE
# ─────────────────────────────────────────────────────────────────────
def _summarize_report(report: Dict[str, Any]) -> Dict[str, Any]:
    """
    Compute derived fields (status, files_uploaded, bytes_uploaded) from raw uploads/errors.
    Mutates report in place AND returns it.
    """
    uploads = report.get("uploads") or []
    errors = report.get("errors") or []
    files_uploaded = len(uploads)
    # Prefer our own size_bytes (int), fall back to Drive's str "size" field.
    bytes_uploaded = 0
    for u in uploads:
        sz = u.get("size_bytes")
        if sz is None:
            try:
                sz = int(u.get("size") or 0)
            except (TypeError, ValueError):
                sz = 0
        bytes_uploaded += sz or 0

    if errors and files_uploaded == 0:
        status = "failed"
    elif errors:
        status = "partial"
    elif files_uploaded > 0:
        status = "success"
    else:
        status = "empty"  # no files, no errors — probably skipped

    report["status"] = status
    report["files_uploaded"] = files_uploaded
    report["bytes_uploaded"] = bytes_uploaded
    report["error_count"] = len(errors)
    return report


async def _pre_register_run(report: Dict[str, Any]):
    """Insert a run record with status='running' at the start of a backup job.
    Ensures the watchdog can detect crashes between start and completion.
    Idempotent via upsert on _id.
    """
    if _db is None:
        return
    try:
        await _db.sitevault_runs.update_one(
            {"_id": report["run_id"]},
            {"$setOnInsert": {**report, "_id": report["run_id"]}},
            upsert=True,
        )
    except Exception as e:
        logger.warning(f"[SITEVAULT] pre_register failed: {e}")


async def watchdog_stuck_runs(stuck_after_minutes: int = 30) -> Dict[str, Any]:
    """Find sitevault_runs that started >N min ago but never wrote terminal
    status. Stamp them as status='failed' with reason='watchdog_timeout'.
    Also backfills legacy records (no status field at all) as 'unknown_legacy_crash'.

    Called by the 15-minute watchdog cron registered in server.py lifespan.
    """
    if _db is None:
        return {"scanned": 0, "flagged": 0, "backfilled": 0}

    from datetime import timedelta
    now = datetime.now(timezone.utc)
    cutoff = (now - timedelta(minutes=stuck_after_minutes)).isoformat()

    flagged = 0
    backfilled = 0

    # Pattern 1: running/missing status + started before cutoff → mark failed
    cursor = _db.sitevault_runs.find({
        "started_at": {"$lt": cutoff},
        "$or": [
            {"status": {"$exists": False}},
            {"status": "running"},
        ],
    })
    async for doc in cursor:
        is_legacy = "status" not in doc
        new_status = "unknown_legacy_crash" if is_legacy else "failed"
        reason = "pre-hardening record, no try/finally" if is_legacy else "watchdog_timeout"
        await _db.sitevault_runs.update_one(
            {"_id": doc["_id"]},
            {"$set": {
                "status": new_status,
                "watchdog_flagged_at": now.isoformat(),
                "watchdog_reason": reason,
            }}
        )
        if is_legacy:
            backfilled += 1
        else:
            flagged += 1

    if flagged or backfilled:
        logger.warning(
            f"[SITEVAULT] Watchdog: flagged {flagged} stuck run(s) as failed, "
            f"backfilled {backfilled} legacy record(s)"
        )
    return {"flagged": flagged, "backfilled": backfilled, "cutoff": cutoff}


async def _persist_report(report: Dict[str, Any]):
    if _db is None:
        return
    try:
        _summarize_report(report)
        # Upsert so we overwrite the pre-register record with the full report.
        # Use update_one+upsert (not insert_one) because the pre-register
        # path has already created a partial doc.
        await _db.sitevault_runs.update_one(
            {"_id": report["run_id"]},
            {"$set": {**report, "_id": report["run_id"]}},
            upsert=True,
        )
        logger.info(
            f"[SITEVAULT] Run {report['run_id']} persisted: status={report['status']} "
            f"files={report['files_uploaded']} bytes={report['bytes_uploaded']:,} errors={report['error_count']}"
        )
    except Exception as e:
        logger.warning(f"[SITEVAULT] persist report failed: {e}")

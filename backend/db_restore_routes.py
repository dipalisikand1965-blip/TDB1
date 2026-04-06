"""
DB Restore Route — TDC Migration Tool
======================================
Reads the pre-exported .json.gz files from /migration_data/ and
bulk-upserts them into the target MongoDB.

Endpoint:  POST /api/admin/db/restore
Auth:      Admin Basic Auth (same as other admin endpoints)
Use-case:  After fresh deployment, hit this once to populate the DB.
"""

import gzip
import json
import os
import logging
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBasic, HTTPBasicCredentials
import secrets

logger = logging.getLogger(__name__)

restore_router = APIRouter(prefix="/api/admin/db", tags=["db-restore"])

security = HTTPBasic()

ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "aditya")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "lola4304")

MIGRATION_DIR = Path(__file__).parent / "migration_data"

# Collections to restore and the field to upsert on (our own id, not Mongo _id)
COLLECTIONS_CONFIG = [
    # (file_stem, collection_name, upsert_key)
    ("users",              "users",              "email"),
    ("pets",               "pets",               "id"),
    ("products_master",    "products_master",    "id"),
    ("breed_products",     "breed_products",     "id"),
    ("services_master",    "services_master",    "id"),
    ("service_catalog",    "service_catalog",    "id"),
    ("bundles",            "bundles",            "id"),
    ("product_bundles",    "product_bundles",    "id"),
    ("product_soul_tiers", "product_soul_tiers", "id"),
    ("guided_paths",       "guided_paths",       "id"),
    ("learn_guides",       "learn_guides",       "id"),
    ("care_bundles",       "care_bundles",       "id"),
    ("service_desk_tickets","service_desk_tickets","ticket_id"),
    ("mira_conversations", "mira_conversations", "id"),
]


def verify_admin(credentials: HTTPBasicCredentials = Depends(security)):
    ok_user = secrets.compare_digest(credentials.username, ADMIN_USERNAME)
    ok_pass = secrets.compare_digest(credentials.password, ADMIN_PASSWORD)
    if not (ok_user and ok_pass):
        raise HTTPException(status_code=401, detail="Unauthorized")
    return credentials.username


def _clean_doc(doc: dict) -> dict:
    """Remove MongoDB-specific _id so a fresh DB generates its own."""
    doc.pop("_id", None)
    return doc


def _load_jsonl_gz(path: Path) -> list[dict]:
    """Read a gzipped JSONL file exported by mongoexport."""
    docs = []
    with gzip.open(path, "rt", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                doc = json.loads(line)
                docs.append(_clean_doc(doc))
            except json.JSONDecodeError:
                pass
    return docs


@restore_router.get("/restore-status")
async def restore_status():
    """
    Quick check: which migration files are present and how many docs each has.
    No auth needed — just tells you what's available.
    """
    status = {}
    for file_stem, collection, _ in COLLECTIONS_CONFIG:
        gz_path = MIGRATION_DIR / f"{file_stem}.json.gz"
        json_path = MIGRATION_DIR / f"{file_stem}.json"

        if gz_path.exists():
            # Count lines quickly
            with gzip.open(gz_path, "rt") as f:
                count = sum(1 for line in f if line.strip())
            status[collection] = {"file": f"{file_stem}.json.gz", "docs": count, "ready": True}
        elif json_path.exists():
            with open(json_path) as f:
                count = sum(1 for line in f if line.strip())
            status[collection] = {"file": f"{file_stem}.json", "docs": count, "ready": True}
        else:
            status[collection] = {"file": None, "docs": 0, "ready": False}

    return {
        "migration_dir": str(MIGRATION_DIR),
        "collections": status,
        "total_ready": sum(1 for v in status.values() if v["ready"]),
    }


@restore_router.post("/restore")
async def restore_database(
    drop_existing: bool = False,
    admin: str = Depends(verify_admin),
):
    """
    Restore all collections from the migration_data/*.json.gz files.

    - drop_existing=false (default): UPSERT — safe to re-run, skips existing docs
    - drop_existing=true: DROPS each collection first — full clean restore

    Returns a summary of what was inserted/updated per collection.
    """
    from motor.motor_asyncio import AsyncIOMotorClient

    mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
    db_name = os.environ.get("DB_NAME", "pet-os-live-test_database")
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]

    started_at = datetime.now(timezone.utc)
    results = {}
    errors = []

    logger.info(f"[DB-RESTORE] Starting restore | drop_existing={drop_existing} | admin={admin}")

    for file_stem, collection_name, upsert_key in COLLECTIONS_CONFIG:
        gz_path = MIGRATION_DIR / f"{file_stem}.json.gz"
        json_path = MIGRATION_DIR / f"{file_stem}.json"

        # Find the file
        if gz_path.exists():
            path = gz_path
            use_gz = True
        elif json_path.exists():
            path = json_path
            use_gz = False
        else:
            results[collection_name] = {"status": "skipped", "reason": "no file found"}
            continue

        try:
            # Load docs
            if use_gz:
                docs = _load_jsonl_gz(path)
            else:
                docs = []
                with open(path, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line:
                            try:
                                docs.append(_clean_doc(json.loads(line)))
                            except json.JSONDecodeError:
                                pass

            if not docs:
                results[collection_name] = {"status": "skipped", "reason": "empty file"}
                continue

            collection = db[collection_name]

            if drop_existing:
                await collection.drop()
                logger.info(f"[DB-RESTORE] Dropped collection: {collection_name}")

            # Bulk upsert by upsert_key
            inserted = 0
            updated = 0
            skipped = 0

            for doc in docs:
                key_val = doc.get(upsert_key)
                if key_val is None:
                    # No key to upsert on — just insert
                    try:
                        await collection.insert_one(doc)
                        inserted += 1
                    except Exception:
                        skipped += 1
                    continue

                existing = await collection.find_one({upsert_key: key_val}, {"_id": 1})
                if existing:
                    await collection.update_one(
                        {upsert_key: key_val},
                        {"$set": doc}
                    )
                    updated += 1
                else:
                    await collection.insert_one(doc)
                    inserted += 1

            results[collection_name] = {
                "status": "ok",
                "total": len(docs),
                "inserted": inserted,
                "updated": updated,
                "skipped": skipped,
            }
            logger.info(f"[DB-RESTORE] {collection_name}: {inserted} inserted, {updated} updated")

        except Exception as e:
            logger.error(f"[DB-RESTORE] Error restoring {collection_name}: {e}")
            errors.append({"collection": collection_name, "error": str(e)})
            results[collection_name] = {"status": "error", "error": str(e)}

    finished_at = datetime.now(timezone.utc)
    duration_s = (finished_at - started_at).total_seconds()

    total_docs = sum(r.get("total", 0) for r in results.values() if isinstance(r, dict))

    logger.info(f"[DB-RESTORE] Complete in {duration_s:.1f}s — {total_docs} total docs processed")

    return {
        "status": "complete" if not errors else "complete_with_errors",
        "duration_seconds": round(duration_s, 1),
        "total_docs_processed": total_docs,
        "collections": results,
        "errors": errors,
        "started_at": started_at.isoformat(),
        "finished_at": finished_at.isoformat(),
    }

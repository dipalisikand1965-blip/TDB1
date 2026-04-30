"""
Admin Snapshot Pin Routes
─────────────────────────
POST /api/admin/snapshot/pin    — copy a daily snapshot to Weekly-Gold-Masters
                                   with a stable label, and pin it forever
                                   (auditable, reusable for future imports)

POST /api/admin/snapshot/freeze — copy a daily snapshot to a sub-folder of
                                   Monthly-Frozen-Snapshots (forever-retention)

Auth: x-admin-secret header (same as sitevault routes).
"""
import os
import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel

import sitevault_drive_client as drive

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/admin/snapshot", tags=["admin-snapshot"])

_db = None


def set_db(database):
    global _db
    _db = database


def _require_admin(x_admin_secret: Optional[str]):
    expected = os.environ.get("ADMIN_PASSWORD") or os.environ.get("SITEVAULT_ADMIN_SECRET")
    if not expected:
        return
    if x_admin_secret != expected:
        raise HTTPException(status_code=401, detail="Admin secret required")


# ─────────────────────────────────────────────────────────────────
# helpers
# ─────────────────────────────────────────────────────────────────
def _copy_drive_file(file_id: str, target_parent_id: str, new_name: str) -> dict:
    """Copies a file in Drive to a target folder under a new name."""
    svc = drive._get_service()
    body = {
        'name': new_name,
        'parents': [target_parent_id],
        'description': f'Copied for snapshot pin/freeze on {datetime.now(timezone.utc).isoformat()}',
    }
    result = svc.files().copy(
        fileId=file_id,
        body=body,
        supportsAllDrives=True,
        fields='id, name, size, parents'
    ).execute()
    # Fort Knox: keep revision forever
    try:
        svc.files().update(
            fileId=result['id'],
            body={'keepRevisionForever': True},
            supportsAllDrives=True,
            fields='id'
        ).execute()
    except Exception as e:
        logger.warning(f"[snapshot] could not set keepRevisionForever on {result['id']}: {e}")
    return result


def _ensure_subfolder_under(parent_id: str, name: str) -> str:
    """Find-or-create a child folder under parent_id."""
    return drive.ensure_subfolder(name, parent_id=parent_id)


# ─────────────────────────────────────────────────────────────────
# models
# ─────────────────────────────────────────────────────────────────
class PinRequest(BaseModel):
    label: str
    snapshot_source: str  # Drive file_id of source (typically MongoDB archive from Daily-DB-Snapshots)


class FreezeRequest(BaseModel):
    folder_name: str       # e.g. "2026-05-founding-members"
    snapshot_source: str   # Drive file_id of source


# ─────────────────────────────────────────────────────────────────
# POST /pin — pin as Gold Master
# ─────────────────────────────────────────────────────────────────
@router.post("/pin")
async def pin_snapshot(req: PinRequest, x_admin_secret: Optional[str] = Header(None)):
    _require_admin(x_admin_secret)
    if not drive.is_enabled():
        raise HTTPException(status_code=400, detail="SiteVault disabled")

    try:
        # Resolve source file
        svc = drive._get_service()
        src = svc.files().get(
            fileId=req.snapshot_source,
            fields='id, name, size, parents',
            supportsAllDrives=True
        ).execute()

        # Target = Weekly-Gold-Masters folder
        gold_folder_id = drive.ensure_subfolder("Weekly-Gold-Masters")

        # Copy with label-prefix in the name for searchability
        # e.g. "founding-members-import-may2026__mongo-...20260430-061835.archive.gz"
        new_name = f"{req.label}__{src['name']}"
        copied = _copy_drive_file(req.snapshot_source, gold_folder_id, new_name)

        # Pin (set description to gold_master_pinned)
        drive.pin_gold_master(copied['id'])

        # Audit log to Mongo
        record = {
            'action': 'pin_gold_master',
            'label': req.label,
            'source_file_id': src['id'],
            'source_name': src['name'],
            'source_size_bytes': int(src.get('size') or 0),
            'pinned_file_id': copied['id'],
            'pinned_name': copied['name'],
            'pinned_folder_id': gold_folder_id,
            'pinned_folder_name': 'Weekly-Gold-Masters',
            'pinned_at': datetime.now(timezone.utc).isoformat(),
        }
        if _db is not None:
            await _db.snapshot_pins.insert_one({**record})

        logger.info(f"[snapshot] pinned '{req.label}' → file_id={copied['id']}")
        return {
            'success': True,
            'label': req.label,
            'pinned_file_id': copied['id'],
            'pinned_name': copied['name'],
            'pinned_folder': 'Weekly-Gold-Masters',
            'drive_url': f"https://drive.google.com/file/d/{copied['id']}/view",
        }
    except Exception as e:
        logger.exception(f"[snapshot] pin failed: {e}")
        raise HTTPException(status_code=500, detail=str(e)[:400])


# ─────────────────────────────────────────────────────────────────
# POST /freeze — copy to Monthly-Frozen-Snapshots/<folder_name>/
# ─────────────────────────────────────────────────────────────────
@router.post("/freeze")
async def freeze_snapshot(req: FreezeRequest, x_admin_secret: Optional[str] = Header(None)):
    _require_admin(x_admin_secret)
    if not drive.is_enabled():
        raise HTTPException(status_code=400, detail="SiteVault disabled")

    try:
        svc = drive._get_service()
        src = svc.files().get(
            fileId=req.snapshot_source,
            fields='id, name, size',
            supportsAllDrives=True
        ).execute()

        # Resolve Monthly-Frozen-Snapshots → child folder named req.folder_name
        frozen_root = drive.ensure_subfolder("Monthly-Frozen-Snapshots")
        target = _ensure_subfolder_under(frozen_root, req.folder_name)

        copied = _copy_drive_file(req.snapshot_source, target, src['name'])

        record = {
            'action': 'freeze_monthly',
            'folder_name': req.folder_name,
            'source_file_id': src['id'],
            'source_name': src['name'],
            'source_size_bytes': int(src.get('size') or 0),
            'frozen_file_id': copied['id'],
            'frozen_folder_id': target,
            'frozen_at': datetime.now(timezone.utc).isoformat(),
        }
        if _db is not None:
            await _db.snapshot_freezes.insert_one({**record})

        logger.info(f"[snapshot] frozen '{src['name']}' → Monthly-Frozen-Snapshots/{req.folder_name}/")
        return {
            'success': True,
            'folder_name': req.folder_name,
            'frozen_file_id': copied['id'],
            'frozen_name': copied['name'],
            'frozen_folder_id': target,
            'drive_url': f"https://drive.google.com/file/d/{copied['id']}/view",
            'parent_folder_url': f"https://drive.google.com/drive/folders/{target}",
        }
    except Exception as e:
        logger.exception(f"[snapshot] freeze failed: {e}")
        raise HTTPException(status_code=500, detail=str(e)[:400])

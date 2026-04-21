"""
SiteVault Google Drive Client — Server-to-Server (Refresh Token Flow)
=======================================================================
Single source of truth for all Google Drive HTTP operations.
Uses a long-lived OAuth refresh token (works with personal Gmail, survives
restarts, no user interaction ever needed).

Capabilities:
  - Ensure sub-folder tree exists (auto-creates on first run)
  - Upload files (resumable for >5MB)
  - List files in a folder (for retention cleaner)
  - Delete files (retention cleaner)
  - Detect files pinned as Gold Master (by description="gold_master_pinned")
  - Report storage quota

Never raises at module-import time (creds may be absent) — only fails at
call time if ENABLED=false or credentials missing.
"""
import os
import io
import logging
import mimetypes
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List

from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request as GoogleRequest
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload, MediaIoBaseUpload
from googleapiclient.errors import HttpError

logger = logging.getLogger(__name__)

DRIVE_SCOPES = ["https://www.googleapis.com/auth/drive"]

# Cached, lazy-initialised service instance (per-process).
_service = None
_creds: Optional[Credentials] = None

# Folder-ID cache (name → drive folder id) to avoid re-listing on every call
_folder_cache: Dict[str, str] = {}


# ─────────────────────────────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────────────────────────────
def is_enabled() -> bool:
    return os.environ.get("SITEVAULT_ENABLED", "false").lower() == "true"


def is_configured() -> bool:
    required = [
        "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET",
        "GOOGLE_REFRESH_TOKEN", "GDRIVE_TDC_FOLDER_ID",
    ]
    return all(os.environ.get(k) for k in required)


def config_status() -> Dict[str, Any]:
    return {
        "enabled": is_enabled(),
        "configured": is_configured(),
        "has_client_id": bool(os.environ.get("GOOGLE_CLIENT_ID")),
        "has_client_secret": bool(os.environ.get("GOOGLE_CLIENT_SECRET")),
        "has_refresh_token": bool(os.environ.get("GOOGLE_REFRESH_TOKEN")),
        "has_root_folder_id": bool(os.environ.get("GDRIVE_TDC_FOLDER_ID")),
        "timezone": os.environ.get("SITEVAULT_TZ", "Asia/Kolkata"),
        "daily_retention_days": int(os.environ.get("SITEVAULT_DAILY_RETENTION_DAYS", "30")),
        "weekly_retention_weeks": int(os.environ.get("SITEVAULT_WEEKLY_RETENTION_WEEKS", "12")),
        "cloudinary_full_backup": os.environ.get("SITEVAULT_CLOUDINARY_BACKUP", "true").lower() == "true",
    }


# ─────────────────────────────────────────────────────────────────────
# CREDENTIAL MANAGEMENT
# ─────────────────────────────────────────────────────────────────────
def _build_creds() -> Credentials:
    """Build Credentials object from env vars. Refreshes if needed."""
    global _creds
    if _creds is None:
        if not is_configured():
            raise RuntimeError("SiteVault not configured — set GOOGLE_* + GDRIVE_TDC_FOLDER_ID")
        _creds = Credentials(
            token=None,  # access_token — will be auto-fetched by .refresh()
            refresh_token=os.environ["GOOGLE_REFRESH_TOKEN"],
            token_uri="https://oauth2.googleapis.com/token",
            client_id=os.environ["GOOGLE_CLIENT_ID"],
            client_secret=os.environ["GOOGLE_CLIENT_SECRET"],
            scopes=DRIVE_SCOPES,
        )
    if not _creds.token or _creds.expired:
        logger.info("[SITEVAULT] Refreshing Google Drive access token")
        _creds.refresh(GoogleRequest())
    return _creds


def _get_service():
    """Lazy-build the Drive API client."""
    global _service
    creds = _build_creds()  # ensures token is fresh
    if _service is None:
        _service = build("drive", "v3", credentials=creds, cache_discovery=False)
    return _service


def reset_client():
    """Drop cached service/creds — used by tests or after key rotation."""
    global _service, _creds, _folder_cache
    _service = None
    _creds = None
    _folder_cache = {}


# ─────────────────────────────────────────────────────────────────────
# FOLDER MANAGEMENT
# ─────────────────────────────────────────────────────────────────────
MIME_FOLDER = "application/vnd.google-apps.folder"

# Canonical sub-folder layout inside GDRIVE_TDC_FOLDER_ID
SUBFOLDERS = [
    "Weekly-Gold-Masters",
    "Daily-DB-Snapshots",
    "Source-Code-Archive",
    "Documents",
    "Cloudinary-Images",
    "Admin-Reports",
    "Logs",
]


def ensure_subfolder(name: str, parent_id: Optional[str] = None) -> str:
    """
    Find or create a sub-folder named `name` under `parent_id`.
    Returns the Drive folder ID. Cached per-process.
    """
    parent = parent_id or os.environ["GDRIVE_TDC_FOLDER_ID"]
    cache_key = f"{parent}::{name}"
    if cache_key in _folder_cache:
        return _folder_cache[cache_key]

    svc = _get_service()
    # Search for existing folder
    q = (
        f"name = '{name}' and "
        f"mimeType = '{MIME_FOLDER}' and "
        f"'{parent}' in parents and "
        f"trashed = false"
    )
    result = svc.files().list(
        q=q, spaces="drive", fields="files(id,name)", pageSize=5
    ).execute()
    items = result.get("files", [])
    if items:
        fid = items[0]["id"]
    else:
        # Create
        meta = {"name": name, "mimeType": MIME_FOLDER, "parents": [parent]}
        created = svc.files().create(body=meta, fields="id").execute()
        fid = created["id"]
        logger.info(f"[SITEVAULT] Created Drive folder '{name}' (id={fid}) under {parent}")
    _folder_cache[cache_key] = fid
    return fid


def ensure_folder_tree() -> Dict[str, str]:
    """Idempotently create all sub-folders. Returns {name: id} map."""
    result = {}
    for name in SUBFOLDERS:
        result[name] = ensure_subfolder(name)
    return result


# ─────────────────────────────────────────────────────────────────────
# UPLOADS
# ─────────────────────────────────────────────────────────────────────
def upload_file(
    local_path: str,
    drive_folder_id: str,
    drive_name: Optional[str] = None,
    description: Optional[str] = None,
    mimetype: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Upload a local file to the given Drive folder.
    Auto-uses resumable upload for files > 5MB.
    Returns {id, name, size} from Drive.
    """
    if not os.path.exists(local_path):
        raise FileNotFoundError(local_path)

    svc = _get_service()
    size = os.path.getsize(local_path)
    name = drive_name or os.path.basename(local_path)
    mime = mimetype or mimetypes.guess_type(local_path)[0] or "application/octet-stream"
    resumable = size > 5 * 1024 * 1024

    media = MediaFileUpload(local_path, mimetype=mime, resumable=resumable, chunksize=50 * 1024 * 1024)
    meta = {"name": name, "parents": [drive_folder_id]}
    if description:
        meta["description"] = description

    request = svc.files().create(body=meta, media_body=media, fields="id, name, size")
    if resumable:
        response = None
        while response is None:
            status, response = request.next_chunk()
            if status:
                logger.info(f"[SITEVAULT] Uploading {name}: {int(status.progress() * 100)}%")
        result = response
    else:
        result = request.execute()

    logger.info(f"[SITEVAULT] Uploaded {name} ({size / 1024 / 1024:.1f} MB) → Drive id={result.get('id')}")
    return result


# ─────────────────────────────────────────────────────────────────────
# LISTING + DELETION (for retention cleaner)
# ─────────────────────────────────────────────────────────────────────
def list_files(drive_folder_id: str, limit: int = 1000) -> List[Dict[str, Any]]:
    svc = _get_service()
    files = []
    page_token = None
    while True:
        resp = svc.files().list(
            q=f"'{drive_folder_id}' in parents and trashed = false",
            fields="nextPageToken, files(id, name, size, createdTime, modifiedTime, description)",
            pageSize=min(1000, limit - len(files)),
            pageToken=page_token,
        ).execute()
        files.extend(resp.get("files", []))
        page_token = resp.get("nextPageToken")
        if not page_token or len(files) >= limit:
            break
    return files


def delete_file(file_id: str):
    svc = _get_service()
    svc.files().delete(fileId=file_id).execute()
    logger.info(f"[SITEVAULT] Deleted Drive file {file_id}")


def pin_gold_master(file_id: str):
    """Mark a file as a pinned Gold Master — retention cleaner will skip it."""
    svc = _get_service()
    svc.files().update(
        fileId=file_id,
        body={"description": "gold_master_pinned"},
    ).execute()


def is_pinned(file: Dict[str, Any]) -> bool:
    return (file.get("description") or "").strip().lower() == "gold_master_pinned"


# ─────────────────────────────────────────────────────────────────────
# STORAGE QUOTA
# ─────────────────────────────────────────────────────────────────────
def storage_quota() -> Dict[str, Any]:
    """Returns Drive quota usage + limit (bytes). None if unlimited."""
    svc = _get_service()
    about = svc.about().get(fields="storageQuota,user(emailAddress)").execute()
    q = about.get("storageQuota", {})
    return {
        "email": about.get("user", {}).get("emailAddress"),
        "limit_bytes": int(q["limit"]) if q.get("limit") else None,
        "usage_bytes": int(q.get("usage", 0)),
        "usage_in_drive_bytes": int(q.get("usageInDrive", 0)),
        "usage_in_drive_trash_bytes": int(q.get("usageInDriveTrash", 0)),
    }

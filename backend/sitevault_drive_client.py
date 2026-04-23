"""
SiteVault Google Drive Client — SERVICE ACCOUNT + SHARED DRIVE flow
=====================================================================
Single source of truth for all Google Drive HTTP operations.

Auth model: Google Service Account JSON key file. Works headless forever —
no refresh tokens, no expiry, no OAuth dance. Required because we target a
Google Workspace **Shared Drive** (IDs starting with `0A...`), where the
service account is added as a member and inherits the drive's quota.

Every Drive API call includes `supportsAllDrives=True` + `includeItemsFromAllDrives=True`
so Shared Drives work correctly.

Capabilities:
  - Ensure sub-folder tree exists (auto-creates on first run)
  - Upload files (resumable for >5MB, chunked for huge ones)
  - List files in a folder (for retention cleaner)
  - Delete files (retention cleaner)
  - Pin files as Gold Master (description="gold_master_pinned")
  - Report quota / Shared Drive info
"""
import os
import io
import json
import logging
import mimetypes
from typing import Optional, Dict, Any, List

from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
from googleapiclient.errors import HttpError

logger = logging.getLogger(__name__)

DRIVE_SCOPES = ["https://www.googleapis.com/auth/drive"]

# Cached service & creds
_service = None
_creds: Optional[service_account.Credentials] = None

# Folder-ID cache (name → drive folder id)
_folder_cache: Dict[str, str] = {}


# ─────────────────────────────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────────────────────────────
def is_enabled() -> bool:
    return os.environ.get("SITEVAULT_ENABLED", "false").lower() == "true"


def _sa_file_path() -> Optional[str]:
    """Resolve the service-account JSON file path from env."""
    path = os.environ.get("GOOGLE_SERVICE_ACCOUNT_FILE")
    if path and os.path.exists(path):
        return path
    # Sensible default location
    default = "/app/backend/secrets/sitevault-sa.json"
    if os.path.exists(default):
        return default
    return None


def _sa_json_from_env() -> Optional[Dict[str, Any]]:
    """
    Read service-account JSON directly from an env var.
    Used on production where we can't ship secret files.
    Accepts either raw JSON or base64-encoded JSON.
    """
    raw = os.environ.get("GOOGLE_SERVICE_ACCOUNT_JSON")
    if not raw:
        return None
    raw = raw.strip()
    # Try raw JSON first
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        pass
    # Try base64
    try:
        import base64
        decoded = base64.b64decode(raw).decode("utf-8")
        return json.loads(decoded)
    except Exception:
        return None


def is_configured() -> bool:
    """SA creds present (file OR json env) AND root folder/drive ID set."""
    has_creds = bool(_sa_file_path()) or bool(_sa_json_from_env())
    return has_creds and bool(os.environ.get("GDRIVE_TDC_FOLDER_ID"))


def config_status() -> Dict[str, Any]:
    sa_path = _sa_file_path()
    sa_json_env = _sa_json_from_env()
    sa_email = None
    project_id = None
    sa_source = None
    if sa_path:
        sa_source = "file"
        try:
            with open(sa_path) as f:
                data = json.load(f)
                sa_email = data.get("client_email")
                project_id = data.get("project_id")
        except Exception:
            pass
    elif sa_json_env:
        sa_source = "env_var"
        sa_email = sa_json_env.get("client_email")
        project_id = sa_json_env.get("project_id")
    root_id = os.environ.get("GDRIVE_TDC_FOLDER_ID", "")
    return {
        "enabled": is_enabled(),
        "configured": is_configured(),
        "auth_mode": "service_account",
        "sa_source": sa_source,
        "sa_email": sa_email,
        "project_id": project_id,
        "sa_file_present": bool(sa_path),
        "sa_env_present": bool(sa_json_env),
        "root_id_present": bool(root_id),
        "root_id_type": _detect_root_type(root_id),
        "timezone": os.environ.get("SITEVAULT_TZ", "Asia/Kolkata"),
        "daily_retention_days": int(os.environ.get("SITEVAULT_DAILY_RETENTION_DAYS", "30")),
        "weekly_retention_weeks": int(os.environ.get("SITEVAULT_WEEKLY_RETENTION_WEEKS", "12")),
        "cloudinary_full_backup": os.environ.get("SITEVAULT_CLOUDINARY_BACKUP", "true").lower() == "true",
    }


def _detect_root_type(root_id: str) -> str:
    """Shared-Drive IDs start with `0A`; regular folder IDs typically start with `1`."""
    if not root_id:
        return "unset"
    if root_id.startswith("0A"):
        return "shared_drive"
    return "folder"


# ─────────────────────────────────────────────────────────────────────
# CREDENTIALS + SERVICE
# ─────────────────────────────────────────────────────────────────────
def _build_creds() -> service_account.Credentials:
    global _creds
    if _creds is None:
        sa_path = _sa_file_path()
        if sa_path:
            _creds = service_account.Credentials.from_service_account_file(
                sa_path, scopes=DRIVE_SCOPES,
            )
        else:
            sa_info = _sa_json_from_env()
            if not sa_info:
                raise RuntimeError(
                    "SiteVault not configured — service-account creds missing. "
                    "Set either GOOGLE_SERVICE_ACCOUNT_JSON env var (full JSON as string) "
                    "or GOOGLE_SERVICE_ACCOUNT_FILE path pointing to a valid JSON key file."
                )
            _creds = service_account.Credentials.from_service_account_info(
                sa_info, scopes=DRIVE_SCOPES,
            )
    return _creds


def _get_service():
    global _service
    if _service is None:
        creds = _build_creds()
        _service = build("drive", "v3", credentials=creds, cache_discovery=False)
    return _service


def reset_client():
    global _service, _creds, _folder_cache
    _service = None
    _creds = None
    _folder_cache = {}


# ─────────────────────────────────────────────────────────────────────
# SHARED-DRIVE HELPER ARGS — applied to every list/get/update/delete call
# ─────────────────────────────────────────────────────────────────────
def _shared_drive_args() -> Dict[str, Any]:
    """Extra kwargs required for Shared Drive compatibility."""
    return {
        "supportsAllDrives": True,
        "includeItemsFromAllDrives": True,
    }


def _root_id() -> str:
    return os.environ["GDRIVE_TDC_FOLDER_ID"]


def _is_shared_drive_root() -> bool:
    return _detect_root_type(_root_id()) == "shared_drive"


# ─────────────────────────────────────────────────────────────────────
# FOLDER MANAGEMENT
# ─────────────────────────────────────────────────────────────────────
MIME_FOLDER = "application/vnd.google-apps.folder"

SUBFOLDERS = [
    "Weekly-Gold-Masters",     # keep 52 weeks (1 year) — Fort Knox upgrade
    "Monthly-Frozen-Snapshots",# NEW — kept forever (never deleted by retention cleaner)
    "Daily-DB-Snapshots",
    "Source-Code-Archive",
    "Documents",
    "Cloudinary-Images",
    "Admin-Reports",
    "Logs",
]


def _escape(v: str) -> str:
    return v.replace("\\", "\\\\").replace("'", "\\'")


def ensure_subfolder(name: str, parent_id: Optional[str] = None) -> str:
    """Find or create a sub-folder under `parent_id` (defaults to GDRIVE_TDC_FOLDER_ID)."""
    parent = parent_id or _root_id()
    cache_key = f"{parent}::{name}"
    if cache_key in _folder_cache:
        return _folder_cache[cache_key]

    svc = _get_service()
    q = (
        f"name = '{_escape(name)}' and "
        f"mimeType = '{MIME_FOLDER}' and "
        f"'{parent}' in parents and "
        f"trashed = false"
    )

    list_kwargs = {
        "q": q,
        "spaces": "drive",
        "fields": "files(id,name)",
        "pageSize": 1000,   # Fort Knox hardening: was 5, expanded to full page
        **_shared_drive_args(),
    }
    # If parent is a Shared Drive root, restrict search to that drive
    if _is_shared_drive_root():
        list_kwargs["corpora"] = "drive"
        list_kwargs["driveId"] = _root_id()

    result = svc.files().list(**list_kwargs).execute()
    items = result.get("files", [])
    if items:
        fid = items[0]["id"]
    else:
        meta = {"name": name, "mimeType": MIME_FOLDER, "parents": [parent]}
        created = svc.files().create(
            body=meta, fields="id", supportsAllDrives=True,
        ).execute()
        fid = created["id"]
        logger.info(f"[SITEVAULT] Created Drive folder '{name}' id={fid} under {parent}")
    _folder_cache[cache_key] = fid
    return fid


def ensure_folder_tree() -> Dict[str, str]:
    """Idempotently create all sub-folders. Returns {name: id}."""
    out = {}
    for name in SUBFOLDERS:
        out[name] = ensure_subfolder(name)
    return out


# ─────────────────────────────────────────────────────────────────────
# UPLOAD
# ─────────────────────────────────────────────────────────────────────
def upload_file(
    local_path: str,
    drive_folder_id: str,
    drive_name: Optional[str] = None,
    description: Optional[str] = None,
    mimetype: Optional[str] = None,
) -> Dict[str, Any]:
    if not os.path.exists(local_path):
        raise FileNotFoundError(local_path)

    svc = _get_service()
    size = os.path.getsize(local_path)
    name = drive_name or os.path.basename(local_path)
    mime = mimetype or mimetypes.guess_type(local_path)[0] or "application/octet-stream"
    resumable = size > 5 * 1024 * 1024

    media = MediaFileUpload(
        local_path, mimetype=mime, resumable=resumable, chunksize=50 * 1024 * 1024,
    )
    meta = {"name": name, "parents": [drive_folder_id]}
    if description:
        meta["description"] = description
    # Fort Knox (a) — keep ALL prior Drive revisions forever.
    # Without this, Drive prunes old versions of the same filename after 30 days.
    # Since backup filenames timestamp themselves the collision case is rare, but
    # enabling this means even an accidental overwrite has full recoverable history.
    meta["keepRevisionForever"] = True

    request = svc.files().create(
        body=meta,
        media_body=media,
        fields="id, name, size",
        supportsAllDrives=True,
    )
    if resumable:
        response = None
        while response is None:
            status, response = request.next_chunk()
            if status:
                logger.info(f"[SITEVAULT] Uploading {name}: {int(status.progress() * 100)}%")
        result = response
    else:
        result = request.execute()

    logger.info(
        f"[SITEVAULT] Uploaded {name} ({size / 1024 / 1024:.1f} MB) "
        f"→ id={result.get('id')}"
    )
    # Ensure `size_bytes` is always an int even if Drive returned a string.
    try:
        result["size_bytes"] = int(result.get("size") or size or 0)
    except (TypeError, ValueError):
        result["size_bytes"] = size
    return result


# ─────────────────────────────────────────────────────────────────────
# LIST + DELETE
# ─────────────────────────────────────────────────────────────────────
def list_files(drive_folder_id: str, limit: int = 1000) -> List[Dict[str, Any]]:
    svc = _get_service()
    files: List[Dict[str, Any]] = []
    page_token = None
    while True:
        kwargs = {
            "q": f"'{drive_folder_id}' in parents and trashed = false",
            "fields": "nextPageToken, files(id, name, size, createdTime, modifiedTime, description)",
            "pageSize": min(1000, max(1, limit - len(files))),
            "pageToken": page_token,
            **_shared_drive_args(),
        }
        if _is_shared_drive_root():
            kwargs["corpora"] = "drive"
            kwargs["driveId"] = _root_id()
        resp = svc.files().list(**kwargs).execute()
        files.extend(resp.get("files", []))
        page_token = resp.get("nextPageToken")
        if not page_token or len(files) >= limit:
            break
    return files


def delete_file(file_id: str) -> Dict[str, Any]:
    """Delete a Drive file. Tries hard-delete first; if the service account
    role lacks `canDelete` (common on Shared Drives where SA is `fileOrganizer`
    or `Content Manager`), falls back to trashing the file.

    ScaleBoard Fort Knox hardening (Apr 2026): before this, a 403/404 from
    files().delete() would propagate and break the retention cleaner loop.
    Now we try/except + trash-fallback so cleanup always succeeds.

    Returns {"file_id": str, "action": "deleted" | "trashed" | "failed", "error": str|None}
    """
    svc = _get_service()
    try:
        svc.files().delete(fileId=file_id, supportsAllDrives=True).execute()
        logger.info(f"[SITEVAULT] Hard-deleted Drive file {file_id}")
        return {"file_id": file_id, "action": "deleted", "error": None}
    except Exception as e:
        # Fall back to trash — recoverable within Drive's 30-day window
        try:
            svc.files().update(
                fileId=file_id,
                body={"trashed": True},
                supportsAllDrives=True,
            ).execute()
            logger.info(f"[SITEVAULT] Trashed Drive file {file_id} (hard-delete unavailable: {e})")
            return {"file_id": file_id, "action": "trashed", "error": str(e)}
        except Exception as te:
            logger.warning(f"[SITEVAULT] Both hard-delete AND trash failed for {file_id}: {te}")
            return {"file_id": file_id, "action": "failed", "error": f"delete={e}; trash={te}"}


def trash_file(file_id: str) -> Dict[str, Any]:
    """Explicitly trash (soft-delete) a Drive file without attempting hard-delete.
    Useful for dedupe paths where we always want recoverability.
    """
    svc = _get_service()
    try:
        svc.files().update(
            fileId=file_id,
            body={"trashed": True},
            supportsAllDrives=True,
        ).execute()
        return {"file_id": file_id, "action": "trashed", "error": None}
    except Exception as te:
        return {"file_id": file_id, "action": "failed", "error": str(te)}


def inspect_file_permissions(file_id: Optional[str] = None) -> Dict[str, Any]:
    """Query the service account's capabilities on a sample Drive file.
    If `file_id` is None, pick the first file in the SiteVault root folder.

    Returns service account email + file capabilities (canDelete, canTrash,
    canDownload, canEdit, canShare, canRemoveChildren, etc.).

    ScaleBoard Fort Knox hardening: without this endpoint, diagnosing
    "silently failing deletes" requires guesswork about the SA's Drive role.
    """
    svc = _get_service()

    # Service account email from the credentials JSON
    sa_email = None
    try:
        import json
        sa_json = os.environ.get("GOOGLE_SERVICE_ACCOUNT_JSON")
        if sa_json:
            sa_email = json.loads(sa_json).get("client_email")
        else:
            sa_path = os.environ.get("GOOGLE_SERVICE_ACCOUNT_FILE")
            if sa_path and os.path.exists(sa_path):
                with open(sa_path) as _f:
                    sa_email = json.load(_f).get("client_email")
    except Exception as _e:
        logger.warning(f"[SITEVAULT] Could not read SA email: {_e}")

    # Pick a sample file if none given
    if not file_id:
        root = _root_id()
        # Try a known subfolder first
        try:
            folders = ensure_folder_tree()
            target_folder = folders.get("Daily-DB-Snapshots") or root
            sample_files = list_files(target_folder, limit=1)
            if sample_files:
                file_id = sample_files[0]["id"]
        except Exception:
            pass

    if not file_id:
        return {
            "service_account_email": sa_email,
            "file_id": None,
            "note": "No sample file found — upload at least one backup first",
        }

    # Fetch capabilities
    try:
        meta = svc.files().get(
            fileId=file_id,
            fields="id, name, capabilities, driveId, parents",
            supportsAllDrives=True,
        ).execute()
    except Exception as e:
        return {
            "service_account_email": sa_email,
            "file_id": file_id,
            "error": f"Failed to fetch capabilities: {e}",
        }

    caps = meta.get("capabilities", {})
    # Infer role from capabilities matrix
    if caps.get("canDelete") and caps.get("canShare"):
        inferred_role = "Manager (or Owner)"
    elif caps.get("canDelete"):
        inferred_role = "Content Manager"
    elif caps.get("canEdit") and caps.get("canTrash"):
        inferred_role = "Content Manager OR fileOrganizer"
    elif caps.get("canEdit"):
        inferred_role = "Writer / Contributor"
    elif caps.get("canDownload"):
        inferred_role = "Reader / Viewer"
    else:
        inferred_role = "Unknown"

    return {
        "service_account_email": sa_email,
        "sample_file_id": meta.get("id"),
        "sample_file_name": meta.get("name"),
        "drive_id": meta.get("driveId"),
        "capabilities": caps,
        "inferred_role": inferred_role,
        "recommendation": (
            "Service account has full delete powers — current role is fine."
            if caps.get("canDelete") and caps.get("canTrash")
            else "Service account can TRASH but not hard-DELETE. Retention cleaner will auto-fallback to trash (recoverable for 30 days). Consider upgrading to Content Manager if you need permanent deletion."
            if caps.get("canTrash")
            else "Service account cannot trash OR delete. Retention cleanup will fail. Upgrade SA to at least fileOrganizer or Content Manager."
        ),
    }


def dedupe_folder(drive_folder_id: str, dry_run: bool = True) -> Dict[str, Any]:
    """Group files by NAME within a folder, keep the NEWEST of each group,
    trash (soft-delete) the rest. Returns per-group stats.

    ScaleBoard Fort Knox pattern: duplicate-file cleanup after a bug shipped
    20 duplicate backups. TDC uses timestamped filenames so duplicates are
    rare, but this still runs as a safety net.

    - dry_run=True  → report duplicates without touching anything
    - dry_run=False → trash all but the newest of each name group
    """
    files = list_files(drive_folder_id, limit=10000)

    by_name: Dict[str, List[Dict[str, Any]]] = {}
    for f in files:
        by_name.setdefault(f.get("name", ""), []).append(f)

    groups_with_dupes = {n: fs for n, fs in by_name.items() if len(fs) > 1}
    actions: List[Dict[str, Any]] = []
    trashed = 0
    kept = 0

    for name, dupes in groups_with_dupes.items():
        # Sort by modifiedTime desc; keep [0], trash the rest
        dupes.sort(key=lambda f: f.get("modifiedTime") or f.get("createdTime") or "", reverse=True)
        newest = dupes[0]
        to_remove = dupes[1:]
        kept += 1

        for victim in to_remove:
            if not dry_run:
                res = trash_file(victim["id"])
                if res["action"] == "trashed":
                    trashed += 1
            actions.append({
                "name": name,
                "kept_id": newest["id"],
                "kept_modified": newest.get("modifiedTime"),
                "trashed_id": victim["id"],
                "trashed_modified": victim.get("modifiedTime"),
                "dry_run": dry_run,
            })

    return {
        "folder_id": drive_folder_id,
        "total_files": len(files),
        "unique_names": len(by_name),
        "duplicate_groups": len(groups_with_dupes),
        "would_trash": sum(len(fs) - 1 for fs in groups_with_dupes.values()),
        "actually_trashed": trashed if not dry_run else 0,
        "kept_per_group": kept,
        "dry_run": dry_run,
        "actions": actions,
    }


def pin_gold_master(file_id: str):
    svc = _get_service()
    svc.files().update(
        fileId=file_id,
        body={"description": "gold_master_pinned"},
        supportsAllDrives=True,
    ).execute()


def is_pinned(file: Dict[str, Any]) -> bool:
    return (file.get("description") or "").strip().lower() == "gold_master_pinned"


# ─────────────────────────────────────────────────────────────────────
# QUOTA / DRIVE INFO
# ─────────────────────────────────────────────────────────────────────
def storage_quota() -> Dict[str, Any]:
    """
    For Shared Drives, quota is managed at the Workspace level — `about.get`
    returns SA's own 0-byte quota which is irrelevant. We instead fetch
    the Shared Drive's metadata (if root is a Shared Drive).
    """
    svc = _get_service()
    result: Dict[str, Any] = {"auth_mode": "service_account"}

    # SA metadata
    try:
        about = svc.about().get(fields="user(emailAddress,displayName)").execute()
        result["sa_email"] = about.get("user", {}).get("emailAddress")
    except Exception as e:
        result["about_error"] = str(e)[:200]

    # If rooted on a Shared Drive, fetch its info
    if _is_shared_drive_root():
        try:
            drive_info = svc.drives().get(
                driveId=_root_id(),
                fields="id,name,createdTime,capabilities,restrictions",
            ).execute()
            result["shared_drive"] = {
                "id": drive_info.get("id"),
                "name": drive_info.get("name"),
                "created_time": drive_info.get("createdTime"),
                "can_add_children": drive_info.get("capabilities", {}).get("canAddChildren"),
                "can_manage_members": drive_info.get("capabilities", {}).get("canManageMembers"),
            }
        except HttpError as e:
            result["shared_drive_error"] = str(e)[:300]
    else:
        # Regular folder — fetch folder metadata
        try:
            folder = svc.files().get(
                fileId=_root_id(),
                fields="id,name,mimeType,owners(emailAddress)",
                supportsAllDrives=True,
            ).execute()
            result["folder"] = folder
        except HttpError as e:
            result["folder_error"] = str(e)[:300]

    return result

"""
STEP 9 + 10 — Pin Gold Master + Frozen Snapshot
Uses sitevault_drive_client directly from pod (same SA credentials).
"""
import sys, os, asyncio
from datetime import datetime, timezone
sys.path.insert(0, '/app/backend')

# Load env
from pathlib import Path
for line in Path('/app/backend/.env').read_text().splitlines():
    if '=' in line and not line.startswith('#'):
        k, v = line.split('=', 1)
        os.environ.setdefault(k.strip(), v.strip())

import sitevault_drive_client as drive
from pymongo import MongoClient

PROD_URL = os.environ['PRODUCTION_MONGO_URL']
db_sync = MongoClient(PROD_URL)['pet-os-live-test_database']

# Source = the post-import mongo archive from STEP 8
SOURCE_FILE_ID = "15cx_YDNqqL4MwxV9shGL_JKwNAlIm5Q8"
SOURCE_NAME = "mongo-pet-soul-ranking-pet-os-live-test_database-20260430-073644.archive.gz"

LABEL = "founding-members-import-may2026"
FROZEN_FOLDER = "2026-05-founding-members"


def log(m):
    print(f"[{datetime.now(timezone.utc).strftime('%H:%M:%S')}] {m}", flush=True)


def copy_file(file_id, target_parent_id, new_name):
    svc = drive._get_service()
    body = {
        'name': new_name,
        'parents': [target_parent_id],
        'description': f'Copied for snapshot pin/freeze on {datetime.now(timezone.utc).isoformat()}',
    }
    result = svc.files().copy(
        fileId=file_id, body=body, supportsAllDrives=True,
        fields='id, name, size, parents'
    ).execute()
    try:
        svc.files().update(
            fileId=result['id'], body={'keepRevisionForever': True},
            supportsAllDrives=True, fields='id'
        ).execute()
    except Exception as e:
        log(f"   warn keepRevisionForever: {e}")
    return result


print("=" * 78)
print("STEP 9 — PIN AS GOLD MASTER")
print("=" * 78)

gold_folder_id = drive.ensure_subfolder("Weekly-Gold-Masters")
log(f"Weekly-Gold-Masters folder: {gold_folder_id}")

new_name = f"{LABEL}__{SOURCE_NAME}"
log(f"Copying {SOURCE_NAME} → Weekly-Gold-Masters/{new_name}")
copied = copy_file(SOURCE_FILE_ID, gold_folder_id, new_name)
log(f"   ✅ Copied: file_id={copied['id']}")

drive.pin_gold_master(copied['id'])
log(f"   ✅ Pinned as Gold Master")

# Audit log
db_sync.snapshot_pins.insert_one({
    'action': 'pin_gold_master',
    'label': LABEL,
    'source_file_id': SOURCE_FILE_ID,
    'source_name': SOURCE_NAME,
    'pinned_file_id': copied['id'],
    'pinned_name': copied['name'],
    'pinned_folder_id': gold_folder_id,
    'pinned_folder_name': 'Weekly-Gold-Masters',
    'pinned_at': datetime.now(timezone.utc).isoformat(),
})
gold_url = f"https://drive.google.com/file/d/{copied['id']}/view"
gold_file_id = copied['id']

print()
print("=" * 78)
print("STEP 10 — MONTHLY FROZEN SNAPSHOT")
print("=" * 78)

frozen_root = drive.ensure_subfolder("Monthly-Frozen-Snapshots")
log(f"Monthly-Frozen-Snapshots: {frozen_root}")
target = drive.ensure_subfolder(FROZEN_FOLDER, parent_id=frozen_root)
log(f"Sub-folder Monthly-Frozen-Snapshots/{FROZEN_FOLDER}: {target}")

log(f"Copying {SOURCE_NAME} → Monthly-Frozen-Snapshots/{FROZEN_FOLDER}/")
frozen = copy_file(SOURCE_FILE_ID, target, SOURCE_NAME)
log(f"   ✅ Copied: file_id={frozen['id']}")

# Verify physically present
files_in_folder = drive.list_files(target, limit=10)
log(f"   Files in Monthly-Frozen-Snapshots/{FROZEN_FOLDER}/:")
for f in files_in_folder:
    log(f"     • {f.get('name')} (id={f.get('id')})")

# Audit
db_sync.snapshot_freezes.insert_one({
    'action': 'freeze_monthly',
    'folder_name': FROZEN_FOLDER,
    'source_file_id': SOURCE_FILE_ID,
    'source_name': SOURCE_NAME,
    'frozen_file_id': frozen['id'],
    'frozen_folder_id': target,
    'frozen_at': datetime.now(timezone.utc).isoformat(),
})
frozen_url = f"https://drive.google.com/file/d/{frozen['id']}/view"
frozen_folder_url = f"https://drive.google.com/drive/folders/{target}"

# Save for STEP 11
import json
with open('/app/data/tdb_import/_step9_10_results.json', 'w') as f:
    json.dump({
        'gold_master': {
            'label': LABEL,
            'file_id': gold_file_id,
            'name': new_name,
            'folder': 'Weekly-Gold-Masters',
            'url': gold_url,
        },
        'frozen': {
            'folder_name': FROZEN_FOLDER,
            'file_id': frozen['id'],
            'name': SOURCE_NAME,
            'parent_folder_id': target,
            'url': frozen_url,
            'parent_url': frozen_folder_url,
        },
        'source': {'file_id': SOURCE_FILE_ID, 'name': SOURCE_NAME},
    }, f, indent=2)

log("")
log("✅ STEP 9 + STEP 10 COMPLETE")
print(json.dumps({
    'pinned_gold_master': gold_url,
    'frozen_in': frozen_folder_url,
}, indent=2))

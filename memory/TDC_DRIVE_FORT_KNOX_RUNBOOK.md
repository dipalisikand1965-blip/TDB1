# 🏰 Fort Knox — Google Drive Hardening Runbook

**Purpose**: Protect TDC's SiteVault backups from accidental deletion, ransomware, or a compromised service account.
**Executed by**: Dipali (Google Workspace admin)
**Date to execute**: Before next production deploy

This runbook covers the four Fort Knox items. Items (a), (b), (c) are **enabled automatically by code** (shipped Apr 23, 2026 in this hardening bundle). Item (d) requires a manual Google Workspace action.

---

## ✅ (a) Drive Version History — ENABLED IN CODE

**What it does**: Google Drive keeps all prior versions of a file forever, instead of auto-pruning after 30 days (default).

**Code change**: Every upload via `sitevault_drive_client.upload_file()` now sets `keepRevisionForever: True` on the file metadata.

**Verify**:
```bash
# After next nightly backup, inspect a backup file in Drive UI:
# Right-click → File information → Details → "Keep forever" checkbox should be ☑
```

**Nothing for you to do.** Already active.

---

## ✅ (b) Gold Master 52-week retention — ENABLED IN CODE

**What it does**: `Weekly-Gold-Masters` folder retention extended from 12 weeks → **52 weeks** (1 year rolling history).

**Code change**: `SITEVAULT_GOLD_RETENTION_WEEKS` env var (default `52`) controls this independently from other folders.

**Verify**:
```bash
# 52+ weeks after the first weekly backup:
# Weekly-Gold-Masters/ should contain 52 weekly archives
# Older than 52 weeks get cleaned automatically
```

**Pinned gold masters** (description = `gold_master_pinned`) are NEVER deleted even beyond 52 weeks. Pin a gold master via:
```py
sitevault_drive_client.pin_gold_master(file_id)
```

---

## ✅ (c) Monthly Frozen Snapshot — ENABLED IN CODE

**What it does**: On the first Monday of each month, a copy of that week's DB snapshot is placed in a new folder `Monthly-Frozen-Snapshots/` that **retention cleaner NEVER touches**. Each frozen file also has `keepRevisionForever: True`.

**Naming convention**:
```
Monthly-Frozen-Snapshots/
  ├── FROZEN_2026_04_db_20260406_030000.tar.gz
  ├── FROZEN_2026_05_db_20260504_030000.tar.gz
  └── FROZEN_2026_06_db_20260601_030000.tar.gz
```

**Verification on first run** (first Monday of next month):
```bash
# Check that after the weekly job runs on the first Mon of May:
curl https://pet-soul-ranking.preview.emergentagent.com/api/admin/backup-health
# → sitevault rail should show last_run_status: "success"
# → Drive UI: new folder "Monthly-Frozen-Snapshots" created with one FROZEN_2026_05_* file
```

**Nothing for you to do.** Already active.

---

## 🛠️ (d) Shared Drive with Content Manager restriction — MANUAL ACTION REQUIRED

**What it does**: Protects against the service account being able to *permanently delete* files. Even if the service-account JSON key is leaked, the attacker cannot wipe backups.

### Why this matters
Currently the service account `sitevault-sa.json` has `Manager` role on the Shared Drive (can delete, share outside, change permissions). If that JSON leaks:
- Attacker downloads it
- Runs `svc.files().delete(fileId="...")` in a loop
- All your backups gone in 60 seconds

With **Content Manager** (downgrade from Manager), the service account can:
- ✅ Add new files (required for daily/weekly backups)
- ✅ Read existing files (required for retention cleaner to list)
- ✅ Delete files **it uploaded itself** (required for retention cleaner)
- ❌ Delete files uploaded by OTHER users (e.g. gold masters Dipali uploads manually)
- ❌ Change drive permissions
- ❌ Move files outside the drive
- ❌ Trash the drive itself

### Step-by-step execution

1. **Open Google Drive** → left sidebar → "Shared drives" → open the **TDC Backups** Shared Drive (ID starts with `0A...`).

2. **Manage members** (top-right → ⋮ → "Manage members" OR the 👥 icon).

3. Find the service account member. It'll look like:
   ```
   sitevault-sa@your-project.iam.gserviceaccount.com
   ```

4. Click the role dropdown next to it. Currently says **"Manager"**. Change to **"Content Manager"**.

5. Click **Save**. You'll see a confirmation dialog — click **OK**.

6. **Verify via code**:
   ```bash
   curl -s "https://pet-soul-ranking.preview.emergentagent.com/api/admin/backup-health"
   # sitevault rail should still be "green" after next backup run
   ```

7. **Secondary human member** — verify YOUR account (Dipali, or a dedicated admin Gmail) is on the Shared Drive with role **Manager**. This ensures YOU still have full control even if the service account is locked out.

### 🚨 Emergency-recovery procedure if the service-account key is ever rotated or leaked

1. Go to **Google Cloud Console** → IAM → Service Accounts → find `sitevault-sa`.
2. Click "Keys" → "Disable all keys" (this instantly revokes access).
3. Create a NEW JSON key → download it.
4. Replace `/app/backend/secrets/sitevault-sa.json` on preview.
5. Redeploy backend.
6. Run `POST /api/admin/architecture/refresh` to verify access is restored.

---

## 🗂️ Final expected Drive folder structure after Fort Knox

```
📁 TDC Backups (Shared Drive — Dipali: Manager, sitevault-sa: Content Manager)
├── 📁 Daily-DB-Snapshots          (retention: 30 days)
├── 📁 Weekly-Gold-Masters          (retention: 52 weeks — Fort Knox upgrade)
├── 📁 Monthly-Frozen-Snapshots     (retention: FOREVER — Fort Knox new folder)
├── 📁 Source-Code-Archive          (retention: 12 weeks)
├── 📁 Documents                    (retention: 30 days for daily, 12 wks for weekly)
├── 📁 Cloudinary-Images            (retention: 12 weeks — sharded)
├── 📁 Admin-Reports                (retention: 12 weeks)
└── 📁 Logs                         (retention: 30 days)

All files in all folders:
  - keepRevisionForever: true  (Fort Knox a)
```

---

## ✅ Verification checklist (run after code deploys)

- [ ] Trigger a manual daily backup from admin panel
- [ ] Verify `GET /api/admin/backup-health` returns `sitevault.status: "green"`
- [ ] Check Drive UI — `Monthly-Frozen-Snapshots` folder exists and is empty (will populate first Mon)
- [ ] Check a recent file → "File information" → "Keep forever" is ✓
- [ ] Verify Dipali has `Manager` role on Shared Drive
- [ ] Execute step (d) — change service-account role to `Content Manager`
- [ ] Re-run manual backup; verify `sitevault.status: "green"` still
- [ ] Add `TDC_DRIVE_FORT_KNOX_RUNBOOK.md` to `/app/memory/` index

---

**Maintainer**: E1 | **Last reviewed**: Apr 23, 2026

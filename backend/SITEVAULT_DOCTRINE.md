# SiteVault — Google Drive Backup Doctrine (TDC)

> **SCOPE:** Single source of truth for the TDC nightly-backup pipeline to Google Drive.
> Identical structure to ScaleBoard's SiteVault. If any future agent touches backup code,
> read this first. Do NOT re-implement OAuth, upload logic, or the scheduler anywhere else.

---

## 1. What Gets Backed Up

| # | What | Source | Frequency | Drive Sub-folder |
|---|---|---|---|---|
| 1 | **MongoDB dump** (ALL collections) | `mongodump --gzip` | Daily 3:00 AM IST | `Daily-DB-Snapshots/` |
| 2 | **Weekly Gold Master DB dump** | `mongodump --gzip` | Monday 3:00 AM IST | `Weekly-Gold-Masters/` |
| 3 | **🟢 FULL PROJECT Gold Master tarball** (entire `/app` tree minus `node_modules`, `.git`, `__pycache__`, `secrets`, `.env`) — restore-ready | tar.gz | Weekly | `Weekly-Gold-Masters/` |
| 4 | **Documents mirror** — every `.md`, `.html`, `.css`, `.txt`, `.xlsx`, `.csv`, `.json` across the whole project (PetWrapped pages, roadmaps, architecture docs, design tokens, seed XLSX files) | tar.gz | **Daily + Weekly** | `Documents/` |
| 5 | **User / admin uploads** (`/app/uploads`, `/app/backend/uploads`, `/app/backend/static/uploads`) | tar.gz | Weekly | `Documents/` |
| 6 | **Memory files** (`/app/memory/*` + backend `*.md`) | tar.gz | Daily + Weekly | `Documents/` |
| 7 | **Supervisor logs** (last 7 days) | tar.gz | Daily + Weekly | `Logs/` |
| 8 | **Cloudinary manifest** (URLs + public_ids, lightweight JSON) | JSON | Daily | `Documents/` |
| 9 | **Source code** tarball (`backend/` + `frontend/src/`) — redundant with full-project but useful for quick code restore | tar.gz | Weekly | `Source-Code-Archive/` |
| 10 | **Frontend public assets** (`/app/frontend/public/`) | tar.gz | Weekly | `Source-Code-Archive/` |
| 11 | **`.env` template** (keys only, values redacted) | .txt | Weekly | `Documents/` |
| 12 | **Admin reports CSV** (tickets, orders, users) | .csv | Weekly | `Admin-Reports/` |
| 13 | **Shopify sync state** (local↔Shopify ID map) | JSON | Weekly | `Documents/` |
| 14 | **Cloudinary full image download** (EVERY image across 21,000+ URLs, in 11 crash-resilient shards) | tar.gz (~6 GB) | Weekly | `Cloudinary-Images/` |

**The rule:** every `.md`, `.html`, `.css`, seed script, uploaded document, and configuration file exists in at least TWO places in the backup:
- Inside the `full-project` Gold Master tarball (weekly)
- Inside the `documents-mirror` tarball (daily + weekly)

---

## 2. Retention Policy

| Folder | Retention | Cleaner runs |
|---|---|---|
| `Daily-DB-Snapshots` | **30 days** | after every weekly backup |
| `Logs` | 30 days | ditto |
| `Documents` | 30 days | ditto |
| `Weekly-Gold-Masters` | **12 weeks** (unless pinned) | ditto |
| `Source-Code-Archive` | 12 weeks | ditto |
| `Cloudinary-Images` | 12 weeks | ditto |
| `Admin-Reports` | 12 weeks | ditto |

**Pinned files** (description = `gold_master_pinned`) are **NEVER** deleted by the cleaner.
Pin via `POST /api/sitevault/pin-gold-master/{file_id}` or manually set the file description in Google Drive UI.

---

## 3. File Map

| File | Responsibility |
|---|---|
| `/app/backend/sitevault_drive_client.py` | Google Drive HTTP client — OAuth token lifecycle, upload/list/delete, folder-tree management, quota check |
| `/app/backend/sitevault_backup_jobs.py` | All backup logic: mongodump, tar source, memory, logs, CSV exports, manifest, Cloudinary full download, orchestrators, retention cleaner |
| `/app/backend/sitevault_routes.py` | FastAPI routes (`/api/sitevault/*`) |
| `/app/backend/server.py` | Registers router + APScheduler cron jobs (daily 3 AM IST, Monday 3 AM IST) |
| `/app/backend/SITEVAULT_DOCTRINE.md` | This doc |

---

## 4. Environment Variables

```bash
# Master kill-switch
SITEVAULT_ENABLED=false              # flip to "true" when creds are in + tested

# Google OAuth (refresh-token flow — NOT service account)
GOOGLE_CLIENT_ID=                    # from GCP Console Desktop OAuth client JSON
GOOGLE_CLIENT_SECRET=
GOOGLE_REFRESH_TOKEN=                # from OAuth Playground one-shot exchange
GDRIVE_TDC_FOLDER_ID=                # Drive folder you created — share with NOBODY else needed for OAuth flow

# Tuning
SITEVAULT_TZ=Asia/Kolkata
SITEVAULT_CLOUDINARY_BACKUP=true     # false = skip the heavy image download
SITEVAULT_DAILY_RETENTION_DAYS=30
SITEVAULT_WEEKLY_RETENTION_WEEKS=12
```

### Why OAuth refresh-token, NOT service account?

Service accounts on personal Gmail return `storageQuotaExceeded` even if the user has 15GB+ free, because the service account itself has 0 bytes of quota and cannot "upload to your Drive on your behalf" without a paid Google Workspace Shared Drive.

The **refresh-token flow** solves this:
- User authorizes once via OAuth Playground (5 min)
- We store the refresh_token — valid forever unless revoked
- Every upload uses a freshly minted access_token from that refresh_token
- Files are owned by the user's real Google account — normal quota applies

---

## 5. Credential Generation Steps (user-facing)

1. **GCP project** → https://console.cloud.google.com/ → New Project → `TDC SiteVault` (or reuse)
2. **Enable Drive API** → APIs & Services → Library → "Google Drive API" → Enable
3. **OAuth consent screen** → External → fill app name + emails → **Publish App** (if kept in Testing, refresh tokens expire in 7 days)
4. **OAuth Client** → Credentials → Create Credentials → OAuth client ID → **Desktop app** → Create → download JSON
5. **Refresh token** via OAuth Playground:
   - https://developers.google.com/oauthplayground/ → ⚙️ → "Use your own OAuth credentials" → paste Client ID + Secret
   - Step 1 → select scope `https://www.googleapis.com/auth/drive` → Authorize APIs → consent
   - Step 2 → Exchange authorization code for tokens → copy `refresh_token` (starts with `1//`)
6. **Drive folder** → drive.google.com → New Folder → `TDC Archive` → copy folder ID from URL
7. Fill the 4 env vars + `SITEVAULT_ENABLED=true` → restart backend

---

## 6. API Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/sitevault/health` | public | Config + quota snapshot |
| POST | `/api/sitevault/test-connection` | `X-Admin-Secret` | Verify creds live, auto-create folder tree |
| POST | `/api/sitevault/run-daily-now` | `X-Admin-Secret` | Trigger daily backup immediately |
| POST | `/api/sitevault/run-weekly-now` | `X-Admin-Secret` | Trigger weekly backup immediately (heavy) |
| POST | `/api/sitevault/cleanup-now` | `X-Admin-Secret` | Run retention cleaner |
| GET | `/api/sitevault/runs?limit=20` | `X-Admin-Secret` | List past backup runs |
| GET | `/api/sitevault/list/{folder}` | `X-Admin-Secret` | List files in a sub-folder |
| POST | `/api/sitevault/pin-gold-master/{file_id}` | `X-Admin-Secret` | Pin file forever |

Admin secret = `ADMIN_PASSWORD` env var (or `SITEVAULT_ADMIN_SECRET`).

---

## 7. Schedulers

Both registered in `server.py` inside the main `AsyncIOScheduler`:

| Job ID | Cron | Wrapper |
|---|---|---|
| `sitevault_daily` | `0 3 * * *` (3:00 AM IST, **skipped Mondays** — weekly takes over) | `run_daily_backup()` |
| `sitevault_weekly` | `0 3 * * 1` (Monday 3:00 AM IST) | `run_weekly_backup()` + retention cleanup |

Timezone: `SITEVAULT_TZ` env var (default `Asia/Kolkata`).

Both wrappers are no-ops if `SITEVAULT_ENABLED=false` — safe to leave registered even before creds arrive.

---

## 8. Data Model

### New collections
| Collection | Purpose |
|---|---|
| `sitevault_runs` | Every backup run: `run_id, type (daily/weekly), started_at, completed_at, uploads[], errors[], retention_cleanup` |

### Existing collections touched
- All of them (read-only for dump + manifest + CSV export)

---

## 9. Operational Playbook

### Verify first backup works (after credentials)
```bash
API=$(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d '=' -f2)
ADMIN=$(grep ^ADMIN_PASSWORD /app/backend/.env | cut -d '=' -f2)

# 1) Health
curl -s "$API/api/sitevault/health" | python3 -m json.tool

# 2) Live connection (creates folder tree)
curl -s -X POST "$API/api/sitevault/test-connection" \
  -H "X-Admin-Secret: $ADMIN" | python3 -m json.tool

# 3) Fire a daily backup now (takes 1-5 min)
curl -s -X POST "$API/api/sitevault/run-daily-now" \
  -H "X-Admin-Secret: $ADMIN"

# 4) Watch progress (poll)
curl -s "$API/api/sitevault/runs?limit=3" \
  -H "X-Admin-Secret: $ADMIN" | python3 -m json.tool

# 5) See files that landed in Drive
curl -s "$API/api/sitevault/list/Daily-DB-Snapshots" \
  -H "X-Admin-Secret: $ADMIN" | python3 -m json.tool
```

### Restore a MongoDB snapshot
```bash
# Download the .archive.gz from Drive, then:
mongorestore --uri="$MONGO_URL" --archive=mongo-xxx.archive.gz --gzip --drop
```

### Pin a Gold Master forever
```bash
curl -X POST "$API/api/sitevault/pin-gold-master/{DRIVE_FILE_ID}" \
  -H "X-Admin-Secret: $ADMIN"
```

### Emergency rollback
```bash
# /app/backend/.env
SITEVAULT_ENABLED=false
sudo supervisorctl restart backend
# All jobs now no-op. Nothing else changes.
```

---

## 10. Common Pitfalls

1. **OAuth consent screen in Testing mode** → refresh tokens expire in 7 days. **Always Publish.**
2. **Wrong OAuth client type** (Web instead of Desktop) → requires a redirect URI; Playground setup fails. Use **Desktop**.
3. **Scope too narrow** → `drive.file` only sees files your app created; `drive` = full access (what we use).
4. **Drive quota full** → uploads fail with `storageQuotaExceeded`. Upgrade Google One or set `SITEVAULT_CLOUDINARY_BACKUP=false`.
5. **mongodump not in container** → already verified present (`/usr/bin/mongodump`). If ever missing, add to Dockerfile.
6. **Cloudinary download 404s** → some products have stale URLs; cleaner logs `fail` count in `_download_stats.json` inside the tarball.
7. **Timezone drift** — ALWAYS use `SITEVAULT_TZ` env var. Never hardcode hours.
8. **Long-running weekly job** — Cloudinary full download can take 30-60 min on 5k+ images. The async-scheduler handles it; supervisor timeout is NOT triggered (APScheduler runs in-process).

---

## 11. Future Hardening (Open TODOs)

- [ ] Email/WhatsApp notify on backup failure (currently logged only)
- [ ] Frontend admin page showing run history + quota usage
- [ ] Restore endpoint (`POST /api/sitevault/restore`) pulling a specific snapshot + re-applying
- [ ] Deduplicate Cloudinary downloads by content hash (skip re-downloading unchanged images)
- [ ] Optional encryption-at-rest for sensitive exports (CSV of user emails)
- [ ] Support secondary backup target (e.g. AWS S3) for disaster recovery

---

**Last updated:** 2026-04-21 — initial implementation.
**Owner:** Emergent E1 agent / Pet Life OS.

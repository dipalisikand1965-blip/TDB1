# 🔐 GitHub Secrets Recovery Doctrine — TDC / thedoggycompany.com

> **AUDIENCE:** Every Emergent E1 agent (and human dev) working on this codebase.
> **STATUS:** Battle-tested on 2026-04-21. This procedure recovered a production deployment that was blocked by GitHub Push Protection flagging 6 leaked secrets across 2,890 commits of history.
> **RULE #1:** If you read one thing before touching this repo, read this doc.

---

## Table of Contents

1. [What Happened (The Incident)](#1-what-happened)
2. [Root Causes — Why This Happened](#2-root-causes)
3. [The Fix That Worked](#3-the-fix-that-worked)
4. [NEVER-DO Rules for All Agents](#4-never-do-rules)
5. [Before You Commit — Checklist](#5-before-you-commit-checklist)
6. [If Secrets Leak Again — Recovery Playbook](#6-recovery-playbook)
7. [Key Rotation Protocol](#7-key-rotation-protocol)
8. [Files Currently Protected](#8-files-currently-protected)

---

## 1. What Happened

On 2026-04-21 during a large deploy (Zoho Desk + SiteVault integrations), "Save to GitHub" failed with:

```
GH013: Repository rule violations found for refs/heads/main
- Push cannot contain secrets
  - SendGrid API Key (5 commits)
  - Google SA Private Key (1 commit — THIS SESSION)
  - Razorpay Live Key (in HANDOVER_DOCUMENTATION.md)
  - MongoDB Atlas Password (in multiple .md files)
  - Google Places API Key (hardcoded in PetFriendlySpots.jsx)
```

### Secrets Found in Git History

| # | Secret | Where It Leaked | Session Origin |
|---|---|---|---|
| 1 | SendGrid API key | `backend/.env` committed 5 times | Older agent sessions (weeks ago) |
| 2 | Razorpay live key `rzp_live_S6mTSKS8qWOi42` | `HANDOVER_DOCUMENTATION.md` | Agent writing handover doc |
| 3 | MongoDB Atlas password `d6ct8sslqs2c739ser0g` | `memory/PRODUCTION_CONFIG.md` + HTMLs | Agent auto-generated config doc |
| 4 | Google Places API key `AIzaSyA...ny4` | Hardcoded in `PetFriendlySpots.jsx` + `.md` docs | Older agent didn't use env var |
| 5 | Google Service Account private key | `frontend/public/_sitevault_sa_temp.txt` | **THIS SESSION** — I (E1) created temp file to hand JSON to user |
| 6 | Partial MongoDB URL | `COMPLETE_DOCUMENTATION.md` | Auto-generated doc |

---

## 2. Root Causes

### Why This Happens Repeatedly

1. **Emergent auto-commits every file in the working tree** every few minutes, including files the agent creates temporarily
2. **Agents write handover/architecture docs** and naively include real credentials for "reference"
3. **Agents create temp files in `/app/frontend/public/`** to expose data to the user — that folder is PUBLICLY servable AND gets committed
4. **`.env` files were not in `.gitignore`** for long enough that they got committed multiple times
5. **No pre-commit secret scanner** on this repo — GitHub's scanner only runs on push, too late

### The Design Mistake

Emergent's auto-commit is convenient but unforgiving: if an agent writes a secret to disk for even 30 seconds, it's in git history forever unless manually scrubbed.

---

## 3. The Fix That Worked

Exact commands run on 2026-04-21 that successfully cleaned the repo:

### Step 3a — Install git-filter-repo
```bash
pip install git-filter-repo --quiet
# Binary lands at /root/.venv/bin/git-filter-repo
```

### Step 3b — Purge sensitive files from ALL history
```bash
cd /app

cat > /tmp/paths_to_purge.txt << 'EOF'
frontend/public/_sitevault_sa_temp.txt
backend/.env
frontend/.env
backend/secrets/sitevault-sa.json
EOF

git-filter-repo --force --invert-paths --paths-from-file /tmp/paths_to_purge.txt
```

### Step 3c — Replace leaked strings inside remaining files
```bash
cat > /tmp/secret_replacements.txt << 'EOF'
rzp_live_S6mTSKS8qWOi42==>rzp_live_<REDACTED_ROTATED>
d6ct8sslqs2c739ser0g==><REDACTED_ROTATED>
AIzaSyAGhWgj4SqpXMqJWLh6SH3rHjxIYoecny4==>AIzaSy<REDACTED_ROTATED>
EOF

git-filter-repo --force --replace-text /tmp/secret_replacements.txt
```

### Step 3d — Restore remote (git-filter-repo wipes it)
```bash
git remote add origin https://github.com/dipalisikand1965-blip/TDB1.git
```

### Step 3e — Force push from Emergent UI
Click **"Save to GitHub"** → if blocked by GitHub scanner, click **"Force Push"** option.

### Step 3f — Resolve merge conflict with `main`
Because history was rewritten, `main` and the pushed branch diverged by 2,890 commits. Fix:

**Option A (used on 2026-04-21):** In GitHub Settings → Branches → change default branch to the new clean branch (`conflict_090426_0800`). Old `main` becomes orphaned but preserved as safety net.

**Option B:** `git push --force origin HEAD:main` — but this requires admin rights Emergent doesn't give agents. Use Option A via GitHub UI.

### Step 3g — Rotate ALL leaked keys
See [Section 7](#7-key-rotation-protocol).

---

## 4. NEVER-DO Rules (Applies to EVERY Agent)

### 🔴 NEVER write a real secret into these locations

| Location | Reason |
|---|---|
| `/app/frontend/public/*` | Public HTTP-servable + auto-committed |
| Any `.md`, `.html`, `.txt` file in `/app/memory/` | Auto-committed on every edit |
| `HANDOVER_DOCUMENTATION.md`, `COMPLETE_DOCUMENTATION.md`, `URGENT_HANDOVER.md`, `SESSION_SUMMARY_*.md` | Auto-committed + historically leaked |
| Any hardcoded string in `.py` or `.jsx` files | Instead use `os.environ.get()` / `process.env.*` |
| Any `.env.example` file | Use placeholder values only |

### 🔴 NEVER hand a secret to the user by:

| Bad method | Why | Good alternative |
|---|---|---|
| Creating `/app/frontend/public/_temp.txt` with the secret | Auto-commits + publicly served | Paste the secret value inline in chat (`curl -d "client_secret=XXX"`) — ephemeral, never on disk |
| Writing it to `/app/memory/NOTES.md` | Auto-committed, in git forever | Tell user to save it in their password manager |
| Echoing it in a bash command output that gets captured | May appear in session logs | Use `python3 -c "import os;print(os.environ['X'][-6:])"` to show only last 6 chars |

### 🔴 NEVER do these git operations

| Bad | Reason |
|---|---|
| `git add .env` or `git add secrets/` | Bypasses `.gitignore` |
| `git commit -am "..."` without checking what's staged | Picks up temp files |
| `git push --force` on `main` without informing user | Nukes deployment history |
| Edit `.gitignore` to ALLOW `.env` | Malpractice |

---

## 5. Before You Commit — Pre-Flight Checklist

Run this quick scan before any "Save to GitHub":

```bash
cd /app && python3 << 'EOF'
import re, os, subprocess

PATTERNS = {
    "OpenAI key":       r"sk-[a-zA-Z0-9_-]{40,}",
    "OpenAI proj key":  r"sk-proj-[a-zA-Z0-9_-]{40,}",
    "Anthropic key":    r"sk-ant-[a-zA-Z0-9_-]{40,}",
    "SendGrid key":     r"SG\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{40,}",
    "Razorpay live":    r"rzp_live_[A-Za-z0-9]{10,}",
    "Google API key":   r"AIza[A-Za-z0-9_-]{35,}",
    "AWS access key":   r"AKIA[A-Z0-9]{16}",
    "GitHub PAT":       r"ghp_[A-Za-z0-9]{36,}",
    "Private key":      r"-----BEGIN.*PRIVATE.*KEY-----",
    "MongoDB w/ pwd":   r"mongodb\+srv://[^:<\s]+:[a-zA-Z0-9]{8,}@",
    "Zoho refresh":     r"1000\.[a-f0-9]{32}\.[a-f0-9]{32}",
    "Bearer JWT":       r"eyJ[A-Za-z0-9_-]{30,}\.eyJ[A-Za-z0-9_-]{30,}",
}

# Get list of files staged for commit (from working tree, excluding .env and gitignored)
staged = subprocess.run(
    ["git", "ls-files", "--cached", "--others", "--exclude-standard"],
    capture_output=True, text=True, cwd="/app"
).stdout.splitlines()

hits = []
for path in staged:
    full = f"/app/{path}"
    if not os.path.isfile(full):
        continue
    if full.endswith(('.pyc', '.png', '.jpg', '.jpeg', '.gif', '.woff', '.woff2', '.ttf')):
        continue
    try:
        with open(full, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
    except (UnicodeDecodeError, PermissionError):
        continue
    for label, pat in PATTERNS.items():
        for m in re.finditer(pat, content):
            hits.append((path, label, m.group(0)[:40] + '...'))

if hits:
    print(f"❌ BLOCKED — {len(hits)} potential secret(s) found:")
    for h in hits[:20]:
        print(f"  {h[0]:60} {h[1]:20} {h[2]}")
    print("\nRemediate before pushing. See doctrine Section 4.")
else:
    print("✅ Pre-commit secret scan PASSED. Safe to push.")
EOF
```

**Run this before every "Save to GitHub"**. Takes 3 seconds. Zero exceptions.

---

## 6. Recovery Playbook — If Secrets Leak Again

### Symptom: GitHub blocks push with "Push cannot contain secrets"

### Remedy — 10 Minutes, Scripted

```bash
cd /app

# 1. List the offending paths/strings from the GitHub error message
# Example: if GitHub flags "SendGrid key in backend/.env:3 (5 commits)"
#   you have 2 choices: purge file OR replace strings

# 2a. PURGE whole files from history
cat > /tmp/paths_to_purge.txt << 'EOF'
# paste offending file paths, one per line
backend/.env
secret_notes.txt
frontend/public/_tempfile.txt
EOF
pip install git-filter-repo --quiet
git-filter-repo --force --invert-paths --paths-from-file /tmp/paths_to_purge.txt

# 2b. REPLACE secret strings in files that must survive
cat > /tmp/secret_replacements.txt << 'EOF'
SG.actual_sendgrid_key==>SG.<REDACTED_ROTATED>
rzp_live_actualkey==>rzp_live_<REDACTED_ROTATED>
EOF
git-filter-repo --force --replace-text /tmp/secret_replacements.txt

# 3. Restore remote
git remote add origin https://github.com/dipalisikand1965-blip/TDB1.git

# 4. Tell user to click "Force Push" in Emergent's "Save to GitHub" dialog

# 5. After force push lands, user fixes merge conflict by
#    changing default branch in GitHub Settings → Branches

# 6. Rotate EVERY leaked key — see Section 7
```

### After Force Push — Verify Clean
```bash
cd /app && for sec in "rzp_live_S6mT" "d6ct8sslqs2c" "AIzaSyAGhWgj4"; do
  echo "--- searching '$sec' ---"
  git log --all -p -S "$sec" 2>/dev/null | head -3
done
# (empty output = secret fully purged from history)
```

---

## 7. Key Rotation Protocol

**A key that appeared in git history is COMPROMISED forever.** Even after history rewrite, assume anyone who cloned the repo at any time has a copy. Rotate it.

### Priority Order

| Priority | Key | Why |
|---|---|---|
| 🔴 P0 (immediate) | MongoDB Atlas password | Full read/write to production DB |
| 🔴 P0 (immediate) | Razorpay live key | Payment fraud potential |
| 🟠 P1 (same day) | Google Service Account | Full Drive/GCP access |
| 🟡 P2 (within week) | Google Places API | Billing abuse |
| 🟡 P2 (within week) | SendGrid | Reputation / spam from your domain |
| 🟢 P3 (when convenient) | Anthropic/OpenAI (Emergent LLM) | Usually tied to account, low abuse risk |

### Rotation Procedure Per Key

#### MongoDB Atlas
1. https://cloud.mongodb.com/ → your cluster → **Database Access**
2. Edit `pet-os-live` user → **Edit Password** → generate strong new password
3. Update Emergent Secrets: `MONGO_URL`, `PRODUCTION_MONGO_URL`
4. Re-deploy within 10 min (old password stops working once saved)

#### Razorpay
1. https://dashboard.razorpay.com/app/keys → **Regenerate** on live key
2. Copy new `Key ID` + `Key Secret`
3. Update Emergent Secrets: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`
4. Re-deploy

#### Google Service Account (SiteVault)
1. https://console.cloud.google.com/iam-admin/serviceaccounts?project=tdc-sitevault
2. Click `tdc-sitevault@...` → **Keys** tab → delete old key
3. **Add Key** → JSON → download new file
4. Encode to one-line: `python3 -c "import json;print(json.dumps(json.load(open('sa.json')),separators=(',',':')))"`
5. Update Emergent Secrets: `GOOGLE_SERVICE_ACCOUNT_JSON` (one-liner)
6. Re-deploy

#### Google Places API
1. https://console.cloud.google.com/apis/credentials → delete old key
2. Create new key → **Restrict**: HTTP referrers `https://thedoggycompany.com/*`, allow only Places/Geocoding/Maps JS APIs
3. Update Emergent Secrets: `GOOGLE_PLACES_API_KEY` AND `REACT_APP_GOOGLE_PLACES_API_KEY`
4. Re-deploy

#### SendGrid
1. https://app.sendgrid.com/settings/api_keys → delete old, create new (Mail Send full access)
2. Update Emergent Secrets: `SENDGRID_API_KEY`
3. Re-deploy

---

## 8. Files Currently Protected (as of 2026-04-21)

### In `.gitignore` (never committable)

```
# From /app/.gitignore (top level)
.env
*.env
*.env.*
node_modules/
__pycache__/
.git/
build/
dist/

# From /app/backend/.gitignore
secrets/
.env

# From /app/frontend/.gitignore
.env
.env.local
node_modules/
build/
```

### Files that CONTAIN secrets on disk but are gitignored (runtime only)

| File | Purpose | NEVER commit |
|---|---|---|
| `/app/backend/.env` | All backend env vars (MONGO_URL, ZOHO_*, RAZORPAY_*, etc.) | ❌ |
| `/app/frontend/.env` | `REACT_APP_BACKEND_URL`, `REACT_APP_GOOGLE_PLACES_API_KEY` | ❌ |
| `/app/backend/secrets/sitevault-sa.json` | Google SA private key file | ❌ |

### If you MUST share a secret with the user

1. **Paste it inline in chat** (e.g., as part of a curl command). Ephemeral.
2. **Tell user where to find it in Emergent Secrets panel** — they click 👁 eye icon.
3. **Ask user to paste it into Emergent Secrets panel** (never a file).

**NEVER** create a file at `/app/frontend/public/_anything.txt` or `/app/memory/*.md` with a real secret. That was the exact mistake on 2026-04-21.

---

## 9. What "Good Hygiene" Looks Like (Enforced From Today)

| Rule | Enforcement |
|---|---|
| `.env` is in `.gitignore` at every level | ✅ Verified |
| Every secret comes from `os.environ.get()` / `process.env.*` | Agents must refactor any hardcoded string |
| Docs (`.md`, `.html`) contain ONLY placeholder values like `<YOUR_API_KEY>` | Code review |
| Pre-commit scanner runs before every "Save to GitHub" | See Section 5 |
| After rotation, old keys are revoked (not just removed from .env) | Verified in service dashboard |
| Emergent Secrets is the ONLY source of truth for prod env values | No `.env.example` with real values |

---

**Last updated:** 2026-04-21 by E1 agent after recovering from a 6-secret git history leak.
**If this doctrine saved your deploy, please don't modify without adding a changelog entry below.**

### Changelog
- **2026-04-21 (Dipali/E1):** Doctrine created after first major incident. 2,890 commits scrubbed, 3 secret-string replacements, 4 files purged from history. Force push succeeded. Keys pending rotation.

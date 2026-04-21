# Zoho Desk — Two-Way Integration Doctrine

> **SCOPE:** This document is the **single source of truth** for the Zoho Desk ↔ Pet Life OS integration. If any future agent (human or AI) touches Zoho code, they MUST read this first. Do NOT re-implement OAuth, webhook handling, or sync logic anywhere else.

---

## 1. Architecture at a Glance

```
┌──────────────────────┐       ┌──────────────────────┐       ┌─────────────────┐
│ Pet Life OS          │       │  Zoho Desk           │       │  Customer       │
│  (FastAPI + Mongo)   │       │  (desk.zoho.in)      │       │  (WhatsApp)     │
└──────────┬───────────┘       └──────────┬───────────┘       └────────┬────────┘
           │                              │                             │
           │  (1) PUSH ticket             │                             │
           │  POST /tickets               │                             │
           │─────────────────────────────>│                             │
           │                              │  Agent replies in Zoho UI   │
           │                              │  (2) Comment_Add webhook    │
           │<─────────────────────────────│                             │
           │  POST /api/zoho/webhook      │                             │
           │                              │                             │
           │  (3) Forward to WhatsApp     │                             │
           │  via Gupshup                 │                             │
           │─────────────────────────────────────────────────────────>  │
```

**Direction 1 — Outbound (Local → Zoho):** Every ticket created in `service_desk_tickets` is fire-and-forget pushed to Zoho. The Zoho ticket ID is written back into the local document (`zoho_ticket_id`).

**Direction 2 — Inbound (Zoho → Local):** When a Zoho agent adds a comment or changes status, Zoho fires a webhook to `/api/zoho/webhook?token=...`. We update the local ticket and forward the agent's reply to the user via WhatsApp + email.

---

## 2. File Map — What Lives Where

| File | Responsibility | DO NOT |
|---|---|---|
| `/app/backend/zoho_desk_client.py` | OAuth lifecycle, HTTP client, ticket/comment CRUD, mapping `service_desk_tickets` → Zoho payload, `push_ticket_to_zoho()`, `push_comment_to_zoho()`, `fire_and_forget_push()`. | Put HTTP or OAuth code anywhere else. |
| `/app/backend/zoho_desk_routes.py` | FastAPI routes: `/health`, `/test-connection`, `/sync-ticket/{id}`, `/bulk-sync`, `/webhook`, `/sync-log`, `/webhook-events`, `/add-comment`. | Import from anywhere except `server.py` or tests. |
| `/app/backend/mira_service_desk.py` | Hook-point: after `service_desk_tickets.insert_one()` we schedule `fire_and_forget_push()` as an asyncio task. | Call any other Zoho helper. Only `fire_and_forget_push()`. |
| `/app/backend/.env` | All 8 Zoho env vars live here. | Commit to git. |
| `/app/backend/ZOHO_DESK_INTEGRATION.md` | This doc. | Let it drift. Update on every change. |

---

## 3. Environment Variables (ALL 8)

```bash
ZOHO_ENABLED=false                  # master kill-switch — "true" to activate
ZOHO_DC=in                          # "com" | "in" | "eu"
ZOHO_CLIENT_ID=1000.H84W...         # from api-console.zoho.in → Self Client
ZOHO_CLIENT_SECRET=6270e50e...      # ditto
ZOHO_REFRESH_TOKEN=                 # must be generated with scope Desk.tickets.ALL,Desk.basic.READ,Desk.contacts.READ,Desk.settings.READ
ZOHO_ORG_ID=60034630220             # Setup → Developer Space → API → ZSC Key
ZOHO_DEPARTMENT_ID=                 # Setup → General → Departments → URL contains ID
ZOHO_WEBHOOK_TOKEN=petlifeos_...    # shared-secret, appears as ?token=... on webhook URL
```

**Flip `ZOHO_ENABLED=true` ONLY after all 8 are filled.** The code's `is_configured()` check blocks all live API calls until then.

### 3a. Generating the Refresh Token (for the ops person)

1. https://api-console.zoho.in/ → open the "Concierge" Self Client.
2. **Generate Code** tab → Scope field (exact, comma-separated, no spaces):
   ```
   Desk.tickets.ALL,Desk.basic.READ,Desk.contacts.READ,Desk.settings.READ
   ```
3. Time Duration: **10 minutes**. Description: `PetLifeOS sync`.
4. Click **Create** → copy the grant code (`1000.xxx.yyy`). **The code expires in 3 minutes.**
5. Immediately run in a terminal (substituting the grant code):
   ```bash
   curl -X POST "https://accounts.zoho.in/oauth/v2/token" \
     -d "grant_type=authorization_code" \
     -d "client_id=1000.H84W0G4DUYG1L3MMFLJXMVPGWPCW6P" \
     -d "client_secret=6270e50e63c02149b4cee1c17d5cae1639c36075eb" \
     -d "code=PASTE_GRANT_CODE"
   ```
6. The JSON response contains `refresh_token` (permanent — paste into `.env`).
   The `access_token` from this response is **ignored** — our code generates its own.

### 3b. Finding the Department ID

1. Zoho Desk → gear icon (top-right) → **Setup** → **General** → **Departments**.
2. Click the target department → the URL contains the ID:
   `https://desk.zoho.in/agent/<org>/setup/departments/<ID>/edit`
3. Paste into `ZOHO_DEPARTMENT_ID`.

---

## 4. OAuth Lifecycle

`zoho_desk_client.get_access_token()` implements:
- **Cached in Mongo** (`zoho_token_cache` collection, 1 doc, `type="access_token"`).
- **5-minute safety buffer** — refreshes when `expires_at - now < 300s`.
- **asyncio lock** — prevents "thundering herd" refresh when N coroutines hit an expired cache simultaneously.
- **Automatic retry on 401** — in `_request()`, if the API returns `INVALID_OAUTHTOKEN`, we force-refresh and retry once.

**Refresh token is permanent** — never expires unless manually revoked or user hits the 20-token cap.

**Access token lifetime:** 1 hour. Max 15 simultaneously-valid per refresh token. Max 5 refresh calls/min.

---

## 5. Data Model Additions

### 5a. `service_desk_tickets` — new fields
| Field | Type | When written |
|---|---|---|
| `zoho_ticket_id` | string | After successful push |
| `zoho_ticket_number` | string (human-readable like `T-101`) | After successful push |
| `zoho_synced_at` | ISO string | After successful push |
| `zoho_sync_error` | string \| null | On failed push |

### 5b. New collections
| Collection | Purpose |
|---|---|
| `zoho_token_cache` | 1 doc — access token + expires_at |
| `zoho_sync_log` | Audit trail: every push attempt |
| `zoho_webhook_events` | Audit trail: every inbound webhook payload |

---

## 6. API Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/zoho/health` | public | Config snapshot (no secrets) |
| POST | `/api/zoho/test-connection` | `X-Admin-Secret` | Live ping — fetches org info |
| POST | `/api/zoho/sync-ticket/{id}` | `X-Admin-Secret` | Push 1 local ticket to Zoho |
| POST | `/api/zoho/bulk-sync?limit=50` | `X-Admin-Secret` | Backfill all unsynced tickets |
| POST | `/api/zoho/add-comment` | `X-Admin-Secret` | Local reply → Zoho comment |
| GET | `/api/zoho/sync-log?limit=50` | `X-Admin-Secret` | Audit log |
| GET | `/api/zoho/webhook-events?limit=50` | `X-Admin-Secret` | Inbound webhook audit |
| POST | `/api/zoho/webhook?token=...` | shared secret | **Zoho calls this** |

**Webhook URL to register in Zoho:**
```
https://<YOUR_BACKEND_HOST>/api/zoho/webhook?token=<ZOHO_WEBHOOK_TOKEN>
```

---

## 7. Webhook Registration in Zoho (One-Time Setup)

1. Zoho Desk → **Setup** → **Developer Space** → **Webhooks** → **New Webhook**.
2. **Name:** `PetLifeOS Inbound`
3. **URL to Notify:** the public HTTPS URL above (copy from `.env` `REACT_APP_BACKEND_URL`).
4. **Description:** `Forwards Zoho agent replies to Pet Life OS → WhatsApp`
5. **Source ID:** generate a UUID (`python -c "import uuid; print(uuid.uuid4())"`)
6. **Events to subscribe to:**
   - ✅ Ticket Comment Add
   - ✅ Ticket Update
   - ✅ Ticket Status Update (Enterprise edition only)
7. Click **Test Run** — expect HTTP 200.
8. **Save.**

> ⚠️ Webhooks only work on Zoho Desk **Professional** (max 5) or **Enterprise** (max 10). Free/Standard do not support webhooks — use polling instead.

---

## 8. Outbound Push — Trigger Points

Currently hooked at **one** place:
- `mira_service_desk.py::attach_or_create_ticket()` — after `service_desk_tickets.insert_one()`.

If you add a new ticket-creation code-path, add:
```python
import asyncio
import zoho_desk_client as _zoho
if _zoho.is_enabled():
    asyncio.create_task(_zoho.fire_and_forget_push(ticket_id))
```

`fire_and_forget_push()` is **idempotent** (checks `zoho_ticket_id` before pushing) and **never raises** (wraps everything in try/except).

---

## 9. Inbound Webhook — Event Handling

`zoho_desk_routes._process_webhook_event()` routes by event type:

| Event (case-insensitive match) | Handler | Side-effects |
|---|---|---|
| contains `comment` or has `content` | `_handle_comment_event` | Appends to local `conversation`, mirrors into `mira_conversations`, sends WhatsApp via Gupshup, sends email via Resend (if configured) |
| contains `status` or has `status` | `_handle_status_event` | Updates local `status`, appends to `activity_log` |
| anything else | logged only | no-op |

### Priority Mapping (Local → Zoho)
| Local urgency | Zoho priority |
|---|---|
| emergency, urgent, high | High |
| normal, medium | Medium |
| low | Low |

### Status Mapping (Zoho → Local)
| Zoho | Local |
|---|---|
| Open | open |
| On Hold | pending |
| Escalated | escalated |
| Closed, Resolved | resolved |

---

## 10. Security

- **Webhook:** shared-secret query param `?token=<ZOHO_WEBHOOK_TOKEN>`. Mismatch = HTTP 401.
- **Admin endpoints:** `X-Admin-Secret` header must match `ADMIN_PASSWORD` (or `ZOHO_ADMIN_SECRET`) env var.
- **Secrets:** never hardcoded. All in `.env` (gitignored).
- **API calls:** always over HTTPS (Zoho rejects HTTP).

---

## 11. Testing & Validation Checklist

After paste-in of `ZOHO_REFRESH_TOKEN` + `ZOHO_DEPARTMENT_ID` + flipping `ZOHO_ENABLED=true`:

```bash
API_URL=$(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d '=' -f2)
ADMIN=$(grep ^ADMIN_PASSWORD /app/backend/.env | cut -d '=' -f2)

# 1) Config visible?
curl -s "$API_URL/api/zoho/health" | python3 -m json.tool
# Expect: enabled=true, configured=true, ok=true

# 2) Live credential test (hits Zoho)
curl -s -X POST "$API_URL/api/zoho/test-connection" \
  -H "X-Admin-Secret: $ADMIN" | python3 -m json.tool
# Expect: success=true, organizations_count >= 1, first_org_name set

# 3) Push a real ticket
TID=$(curl -s "$API_URL/api/admin/service-desk-tickets?limit=1" | python3 -c "import sys,json;print(json.load(sys.stdin)[0]['ticket_id'])")
curl -s -X POST "$API_URL/api/zoho/sync-ticket/$TID" \
  -H "X-Admin-Secret: $ADMIN" | python3 -m json.tool
# Expect: success=true, zoho_ticket_id set

# 4) Audit
curl -s "$API_URL/api/zoho/sync-log?limit=5" \
  -H "X-Admin-Secret: $ADMIN" | python3 -m json.tool
```

---

## 12. Common Pitfalls (Learned from Playbook)

1. **DC mismatch** — using `.com` URL against `.in` account = `INVALID_OAUTHTOKEN`. Our code derives all URLs from `ZOHO_DC`.
2. **Insufficient scopes** — refresh token created with only `Desk.settings.READ` cannot create tickets. Always use the full 4-scope list.
3. **Token cap** — max 20 refresh tokens per account. If exceeded, oldest is auto-deleted. Consolidate.
4. **Webhook 5-second SLA** — we return `{ok: true}` IMMEDIATELY and defer processing to a `BackgroundTask`.
5. **Duplicate webhooks** — Zoho may re-fire. Our mirroring uses `$push` (idempotent-ish) — for true idempotency, check `latestComment.id` before appending. (TODO: hard guard once we see real payloads.)
6. **Public/Private comments** — private agent notes (`isPublic=false`) are NOT forwarded to the customer. Respect this.

---

## 13. Rollback Procedure

To disable the integration at any time:
```bash
# Set in /app/backend/.env
ZOHO_ENABLED=false
sudo supervisorctl restart backend
```
All push and webhook actions become no-ops. No other code changes needed.

---

## 14. Open TODOs (Future Hardening)

- [ ] JWT signature verification on webhook (Zoho signs with RS256)
- [ ] Idempotency guard on comment webhook (check latest comment ID)
- [ ] Rate-limiting on `/bulk-sync` (Zoho hard cap: 25 concurrent/edition)
- [ ] Contact de-duplication — currently we let Zoho auto-match by email
- [ ] Custom field mapping (breed, pillar, soul_score) as Zoho `cf` entries
- [ ] Admin UI page showing sync status per ticket

---

**Last updated:** 2026-04-21 — initial implementation.
**Owner:** Emergent E1 agent / Pet Life OS.

"""
Weekly Architecture Diff Email — ScaleBoard pattern
====================================================
Every Monday morning at 8 AM IST, pulls the last 2 architecture snapshots,
computes a human-readable diff, and sends a Resend email to Aditya.

Contents:
  - Collections added / removed
  - Doc count deltas (top changes)
  - New API routes (via route count delta per file)
  - New cron jobs
  - Backup health traffic light

Triggered by:
  1. Cron job `weekly_arch_diff_email` in server.py lifespan (Mon 8 AM IST)
  2. Admin-triggered POST /api/admin/architecture/email-diff (for testing)
"""
from __future__ import annotations
import os
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List

logger = logging.getLogger(__name__)

# Injected from server.py
db = None


def set_deps(database):
    global db
    db = database


def _build_diff(snapshots: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Compute diff between the two snapshot dicts. Newest first."""
    if len(snapshots) < 2:
        return {"insufficient_snapshots": True}
    curr, prev = snapshots[0], snapshots[1]

    curr_colls = {x["name"]: x["count"] for x in curr.get("database", {}).get("top40", [])}
    prev_colls = {x["name"]: x["count"] for x in prev.get("database", {}).get("top40", [])}

    curr_routes = {x["file"]: x["count"] for x in curr.get("backend", {}).get("per_file", [])}
    prev_routes = {x["file"]: x["count"] for x in prev.get("backend", {}).get("per_file", [])}

    curr_crons = {c["id"] for c in curr.get("crons", [])}
    prev_crons = {c["id"] for c in prev.get("crons", [])}

    curr_env = set(curr.get("env", {}).get("backend", []))
    prev_env = set(prev.get("env", {}).get("backend", []))

    # Collection deltas — sorted by absolute change, top 15
    all_coll_deltas = []
    for n, c in curr_colls.items():
        prev_c = prev_colls.get(n, 0)
        if c != prev_c:
            all_coll_deltas.append({"name": n, "delta": c - prev_c, "now": c, "was": prev_c})
    all_coll_deltas.sort(key=lambda x: -abs(x["delta"]))

    # Route deltas
    route_deltas = []
    for f, c in curr_routes.items():
        prev_c = prev_routes.get(f, 0)
        if c != prev_c:
            route_deltas.append({"file": f, "delta": c - prev_c, "now": c})

    # Frontend route count delta
    fe_curr = curr.get("frontend", {}).get("total", 0)
    fe_prev = prev.get("frontend", {}).get("total", 0)

    return {
        "compared_at": [curr.get("scanned_at"), prev.get("scanned_at")],
        "collections_added":   sorted(set(curr_colls) - set(prev_colls)),
        "collections_removed": sorted(set(prev_colls) - set(curr_colls)),
        "doc_count_changes":   all_coll_deltas[:15],
        "route_changes":       route_deltas,
        "crons_added":   sorted(curr_crons - prev_crons),
        "crons_removed": sorted(prev_crons - curr_crons),
        "env_vars_added":   sorted(curr_env - prev_env),
        "env_vars_removed": sorted(prev_env - curr_env),
        "frontend_routes_total":  fe_curr,
        "frontend_routes_delta":  fe_curr - fe_prev,
        "backend_routes_total":   sum(curr_routes.values()),
        "backend_routes_delta":   sum(curr_routes.values()) - sum(prev_routes.values()),
        "total_collections_curr": curr.get("database", {}).get("total_collections", 0),
        "total_docs_curr":        curr.get("database", {}).get("total_docs", 0),
        "total_docs_delta":       curr.get("database", {}).get("total_docs", 0) - prev.get("database", {}).get("total_docs", 0),
    }


async def _get_backup_health_snapshot() -> Dict[str, Any]:
    """Reuse the backup_health_routes logic to get a current health snapshot."""
    try:
        import backup_health_routes as bhr
        bhr.set_deps(db)
        return await bhr.backup_health()
    except Exception as e:
        logger.warning(f"[ARCH-EMAIL] Could not fetch backup health: {e}")
        return {"overall": "unknown", "rails": {}}


def _render_email_html(diff: Dict[str, Any], health: Dict[str, Any]) -> str:
    """Render a friendly HTML email body."""
    def _rail_badge(rail_data: Dict[str, Any]) -> str:
        s = rail_data.get("status", "unknown")
        colour = {"green": "#2ECC71", "amber": "#F39C12", "red": "#E74C3C"}.get(s, "#999")
        return f"<span style='display:inline-block;padding:2px 10px;border-radius:12px;background:{colour};color:#fff;font-size:11px;font-weight:700;'>{s.upper()}</span>"

    rails = health.get("rails", {})
    overall = health.get("overall", "unknown")

    def _fmt_delta(n: int) -> str:
        if n > 0:
            return f"<span style='color:#2ECC71;font-weight:700'>+{n:,}</span>"
        if n < 0:
            return f"<span style='color:#E74C3C;font-weight:700'>{n:,}</span>"
        return "<span style='color:#999'>0</span>"

    added_list = "".join(f"<li><code>{n}</code></li>" for n in diff.get("collections_added", [])) or "<li><em>none</em></li>"
    removed_list = "".join(f"<li><code>{n}</code></li>" for n in diff.get("collections_removed", [])) or "<li><em>none</em></li>"

    doc_rows = ""
    for c in diff.get("doc_count_changes", []):
        doc_rows += f"<tr><td><code>{c['name']}</code></td><td align='right'>{c['was']:,}</td><td align='right'>{c['now']:,}</td><td align='right'>{_fmt_delta(c['delta'])}</td></tr>"
    if not doc_rows:
        doc_rows = "<tr><td colspan='4'><em>no collection-level changes</em></td></tr>"

    route_rows = ""
    for r in diff.get("route_changes", [])[:20]:
        route_rows += f"<tr><td><code>{r['file']}</code></td><td align='right'>{_fmt_delta(r['delta'])}</td><td align='right'>{r['now']}</td></tr>"
    if not route_rows:
        route_rows = "<tr><td colspan='3'><em>no route changes</em></td></tr>"

    crons_added = ", ".join(f"<code>{c}</code>" for c in diff.get("crons_added", [])) or "<em>none</em>"
    crons_removed = ", ".join(f"<code>{c}</code>" for c in diff.get("crons_removed", [])) or "<em>none</em>"
    env_added = ", ".join(f"<code>{e}</code>" for e in diff.get("env_vars_added", [])) or "<em>none</em>"
    env_removed = ", ".join(f"<code>{e}</code>" for e in diff.get("env_vars_removed", [])) or "<em>none</em>"

    return f"""<!DOCTYPE html>
<html><body style="font-family:system-ui,Segoe UI,Roboto,sans-serif;max-width:720px;margin:0 auto;padding:24px;color:#1a1a2e;">
<div style="background:linear-gradient(135deg,#1a1a2e,#16213e);color:#fff;padding:22px 24px;border-radius:14px;margin-bottom:20px;">
  <div style="font-size:11px;letter-spacing:.14em;opacity:.75;font-weight:700;">✦ TDC WEEKLY ARCHITECTURE DIFF</div>
  <div style="font-size:22px;font-weight:800;margin-top:4px;">{datetime.now(timezone.utc).strftime('%b %d, %Y')} — Monday brief</div>
  <div style="opacity:.8;font-size:13px;margin-top:6px;">Total: {diff.get('total_collections_curr',0)} collections · {diff.get('total_docs_curr',0):,} docs · {diff.get('backend_routes_total',0)} API endpoints · {diff.get('frontend_routes_total',0)} frontend routes</div>
</div>

<h3 style="border-bottom:2px solid #E91E8C;padding-bottom:6px;">🚦 Backup Health — overall: {_rail_badge({'status': overall})}</h3>
<table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
  <tr><td style="padding:6px 0;"><b>SiteVault (Google Drive)</b></td><td align="right">{_rail_badge(rails.get('sitevault', {}))} — last success {(rails.get('sitevault', {}) or {}).get('hours_since_success','?')}h ago</td></tr>
  <tr><td style="padding:6px 0;"><b>Atlas Sync (MongoDB cloud)</b></td><td align="right">{_rail_badge(rails.get('atlas_sync', {}))} — last success {(rails.get('atlas_sync', {}) or {}).get('hours_since_success','?')}h ago</td></tr>
  <tr><td style="padding:6px 0;"><b>Migration Export (git)</b></td><td align="right">{_rail_badge(rails.get('migration_export', {}))} — last success {(rails.get('migration_export', {}) or {}).get('hours_since_latest','?')}h ago</td></tr>
</table>

<h3 style="border-bottom:2px solid #E91E8C;padding-bottom:6px;">📊 What changed this week</h3>
<p><b>Total docs delta</b>: {_fmt_delta(diff.get('total_docs_delta',0))} · <b>Backend routes</b>: {_fmt_delta(diff.get('backend_routes_delta',0))} · <b>Frontend routes</b>: {_fmt_delta(diff.get('frontend_routes_delta',0))}</p>

<h4>🆕 Collections added</h4>
<ul>{added_list}</ul>

<h4>🗑️ Collections removed</h4>
<ul>{removed_list}</ul>

<h4>📈 Top doc-count movers</h4>
<table style="width:100%;border-collapse:collapse;font-size:13px;">
  <tr style="background:#f6f6f6;"><th align="left">Collection</th><th align="right">Was</th><th align="right">Now</th><th align="right">Δ</th></tr>
  {doc_rows}
</table>

<h4 style="margin-top:24px;">🔌 Backend route changes (per file)</h4>
<table style="width:100%;border-collapse:collapse;font-size:13px;">
  <tr style="background:#f6f6f6;"><th align="left">File</th><th align="right">Δ</th><th align="right">Now</th></tr>
  {route_rows}
</table>

<h4 style="margin-top:24px;">⏰ Crons</h4>
<p>Added: {crons_added}<br/>Removed: {crons_removed}</p>

<h4>🔐 Env vars</h4>
<p>Added: {env_added}<br/>Removed: {env_removed}</p>

<div style="margin-top:30px;padding-top:14px;border-top:1px solid #ddd;font-size:11px;color:#777;">
  Auto-generated by <code>architecture_weekly_email.py</code> — Monday 8 AM IST · Comparing snapshots from {diff.get('compared_at',['?','?'])[1]} → {diff.get('compared_at',['?','?'])[0]}
</div>
</body></html>"""


async def send_weekly_diff_email(
    to: str | None = None,
    from_email: str | None = None,
) -> Dict[str, Any]:
    """Build the diff + email it via Resend."""
    if db is None:
        return {"sent": False, "reason": "db_not_set"}

    to = to or os.environ.get("ARCH_DIFF_EMAIL_TO") or os.environ.get("NOTIFICATION_EMAIL")
    from_email = from_email or os.environ.get("SENDER_EMAIL") or "mira@thedoggycompany.com"
    if not to:
        return {"sent": False, "reason": "no_recipient_configured"}

    resend_key = os.environ.get("RESEND_API_KEY")
    if not resend_key:
        return {"sent": False, "reason": "resend_key_not_set"}

    # Fetch last two snapshots (newest first)
    snaps = await db.architecture_snapshots.find({}, {"_id": 0}).sort("scanned_at", -1).limit(2).to_list(2)
    if len(snaps) < 2:
        html = """<p>TDC weekly architecture email — first snapshot captured, no comparison available yet.</p>
<p>Next Monday will include the first week-over-week diff.</p>"""
        # Insert current snapshot info if we have it
        if snaps:
            curr = snaps[0]
            total_colls = curr.get('database', {}).get('total_collections', 'unknown')
            total_docs = curr.get('database', {}).get('total_docs', 'unknown')
            html = f"""<p>TDC weekly architecture email — first snapshot captured.</p>
<p>Collections: {total_colls}, Docs: {total_docs}</p>
<p>Next Monday will include the first week-over-week diff.</p>"""
        subject = "TDC Weekly · Architecture — first snapshot captured"
    else:
        diff = _build_diff(snaps)
        health = await _get_backup_health_snapshot()
        html = _render_email_html(diff, health)
        rail_emoji = {"green": "🟢", "amber": "🟡", "red": "🔴"}.get(health.get("overall", "unknown"), "⚪")
        subject = f"TDC Weekly · {rail_emoji} Architecture diff — {datetime.now(timezone.utc).strftime('%b %d')}"

    try:
        import resend
        resend.api_key = resend_key
        result = resend.Emails.send({
            "from": from_email,
            "to": [to],
            "subject": subject,
            "html": html,
        })
        logger.info(f"[ARCH-EMAIL] Weekly diff sent to {to} — id={result.get('id')}")
        return {"sent": True, "to": to, "resend_id": result.get("id"), "subject": subject}
    except Exception as e:
        logger.exception(f"[ARCH-EMAIL] Send failed: {e}")
        return {"sent": False, "reason": str(e)}

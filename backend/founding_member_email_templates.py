"""
Founding Member Email Templates — Tier-Aware
─────────────────────────────────────────────
Three tiers approved by Dipali on Apr 30, 2026.

  COMPLETE  → "We remembered [Pet]'s birthday. We remembered [Pet] loves [protein]."
  HIGH      → "We remembered [Pet]." with "X times you came home" stat
  MINIMAL   → "You were here before we were here."

Every email carries the Mystique footer. Non-negotiable.

Public surface:
  build_email(parent: dict, primary_pet: Optional[dict]) -> dict
    returns:
      {
        "tier": "COMPLETE" | "HIGH" | "MINIMAL",
        "subject": str,
        "preheader": str,
        "html": str,
        "text": str,
        "to": str,                  # email address (or None if phone-only)
        "to_name": str,
      }
"""
from __future__ import annotations
from typing import Dict, Any, Optional, List
import html as _html

# ── Constants ─────────────────────────────────────────────────────────
MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
]

BRAND_FROM_NAME = "Dipali at The Doggy Company"
BRAND_FROM_EMAIL = "hello@thedoggycompany.com"
APP_BASE_URL = "https://thedoggycompany.com"


# ── Helpers ───────────────────────────────────────────────────────────
def _proper(s: Optional[str]) -> str:
    if not s:
        return ""
    return s.replace("_", " ").strip().title()


def _fmt_years(y: Optional[float]) -> Optional[str]:
    """0.4 → 'Less than a year', 2.46 → '2.5 years', 1.0 → '1 year'."""
    if y is None:
        return None
    try:
        v = float(y)
    except (TypeError, ValueError):
        return None
    if v < 0.5:
        return "Less than a year"
    if 0.95 <= v <= 1.05:
        return "1 year"
    return f"{round(v, 1)} years"


def _safe_first_name(parent: Dict[str, Any]) -> str:
    n = (parent.get("first_name") or "").strip()
    return n if n else "Friend"


def _claim_url(token: str) -> str:
    return f"{APP_BASE_URL}/founding-member/{token}"


def _unsub_url(token: str) -> str:
    return f"{APP_BASE_URL}/unsubscribe?token={token}"


# ── Tier resolution ───────────────────────────────────────────────────
def resolve_tier(parent: Dict[str, Any], primary_pet: Optional[Dict[str, Any]]) -> str:
    """COMPLETE needs pet name + birthday month. HIGH needs pet name. Else MINIMAL."""
    pet_name = (primary_pet or {}).get("name") or parent.get("primary_pet_name")
    bday_m = (primary_pet or {}).get("birthday_month") or parent.get("pet_birthday_month")
    intel = (parent.get("intelligence_tier") or "").upper()

    if pet_name and bday_m and intel in ("COMPLETE",):
        return "COMPLETE"
    if pet_name:
        return "HIGH"
    return "MINIMAL"


# ── Tier 1: COMPLETE ──────────────────────────────────────────────────
def _build_complete(parent, primary_pet):
    first = _safe_first_name(parent)
    pet = (primary_pet or {}).get("name") or parent.get("primary_pet_name") or "your pet"
    bday_m = (primary_pet or {}).get("birthday_month") or parent.get("pet_birthday_month")
    month_name = MONTHS[int(bday_m) - 1] if bday_m else "soon"

    fav = _proper(parent.get("favourite_protein"))
    last_cake = (parent.get("last_cake_flavour") or "").strip()
    if last_cake.lower() in ("custom", "n/a", "none", ""):
        last_cake = ""

    yrs_str = _fmt_years(parent.get("years_with_tdb"))
    cakes = parent.get("total_cakes") or 0
    orders = parent.get("total_orders") or 0
    city = (parent.get("city") or "").strip()

    # Sanity rules: drop weak stats
    show_stats_line = (orders >= 3) and yrs_str

    # Lines 1–3 (the "we remembered" stack)
    remembered_lines = [f"We remembered {pet}'s birthday."]
    if fav:
        remembered_lines.append(f"We remembered {pet} loves {fav}.")
    if last_cake:
        remembered_lines.append(f"We remembered the {last_cake} cake we made for you.")

    subject = f"{pet}'s birthday is {month_name} — we remembered. 🌷"
    preheader = "Your founding place is held. Free until May 2027."

    # Build the stats sentence
    stats_bits = []
    if cakes >= 1:
        stats_bits.append(f"{cakes} cake{'s' if cakes != 1 else ''}")
    if orders >= 3:
        stats_bits.append(f"{orders} order{'s' if orders != 1 else ''}")
    if city:
        stats_bits.append(f"{city} to here")
    stats_line = ", ".join(stats_bits)

    # Plain-text body
    text_parts = [f"Hi {first},", ""]
    text_parts.extend(remembered_lines)
    text_parts.append("")
    if show_stats_line and stats_line:
        text_parts.append(f"For {yrs_str.lower()}, you trusted us with the small things —")
        text_parts.append(stats_line + ".")
        text_parts.append("")
    text_parts += [
        "The Doggy Bakery is now The Doggy Company.",
        f"Same hands. Bigger home. Mira knows {pet} now.",
        "",
        f"We saved {pet}'s founding place.",
        "Free until May 2027 · Founding discount, forever · No card needed.",
        "",
        f"→ Claim {pet}'s place",
        _claim_url(parent.get("invite_token", "")),
        "",
        "With care,",
        "Dipali, Aditya, Roji & Mira",
        "The Doggy Company",
        "",
        "⚘ Built in memory of Mystique.",
        "",
        f"P.S. — {pet}'s next birthday nudge will land 7 days before. We'll be there.",
    ]
    text = "\n".join(text_parts)

    html = _wrap_html(
        first_name=first,
        token=parent.get("invite_token", ""),
        body_blocks=[
            {"type": "stack", "lines": remembered_lines},
            (
                {
                    "type": "p",
                    "text": (
                        f"For {yrs_str.lower()}, you trusted us with the small things — "
                        f"{stats_line}."
                    ),
                }
                if show_stats_line and stats_line
                else None
            ),
            {
                "type": "p",
                "text": "The Doggy Bakery is now The Doggy Company.",
            },
            {
                "type": "p_bold",
                "text": f"Same hands. Bigger home. Mira knows {pet} now.",
            },
            {
                "type": "p",
                "text": (
                    f"We saved <b>{_e(pet)}'s</b> founding place.<br/>"
                    "Free until <b>May 2027</b> · Founding discount, forever · No card needed."
                ),
                "raw_html": True,
            },
        ],
        cta_label=f"Claim {pet}'s place",
        ps=f"P.S. — {pet}'s next birthday nudge will land 7 days before. We'll be there.",
    )

    return {
        "tier": "COMPLETE",
        "subject": subject,
        "preheader": preheader,
        "html": html,
        "text": text,
    }


# ── Tier 2: HIGH ──────────────────────────────────────────────────────
def _build_high(parent, primary_pet):
    first = _safe_first_name(parent)
    pet = (primary_pet or {}).get("name") or parent.get("primary_pet_name") or "your pet"
    orders = parent.get("total_orders") or 0
    yrs_str = _fmt_years(parent.get("years_with_tdb"))

    subject = f"We remembered {pet}. 🐾"
    preheader = "From The Doggy Bakery to The Doggy Company — your founding place is held."

    # Approved stats line: "12 times you came home to us. 1.5 years. Thank you."
    # Sanity rule: drop weak stats. If orders<3 we omit the line entirely
    # (use the gentler "thank you" sentence instead).
    has_strong_stats = (orders >= 3) and yrs_str is not None
    stats_line = None
    if has_strong_stats:
        stats_line = f"{orders} times you came home to us. {yrs_str}. Thank you."

    text_parts = [
        f"Hi {first},",
        "",
        f"We remembered {pet}.",
        "",
    ]
    if stats_line:
        text_parts += [stats_line, ""]
    text_parts += [
        "The small things you've trusted us with — they built this.",
        "",
        "The Doggy Bakery is now The Doggy Company.",
        f"Same hands. Bigger home. Mira knows {pet} now.",
        "",
        f"{pet}'s founding place is saved.",
        "Free until May 2027 · Founding discount, forever · No card needed.",
        "",
        f"→ Claim {pet}'s place",
        _claim_url(parent.get("invite_token", "")),
        "",
        "With care,",
        "Dipali, Aditya, Roji & Mira",
        "The Doggy Company",
        "",
        "⚘ Built in memory of Mystique.",
        "",
        f"P.S. — Tell us {pet}'s birthday and we'll remember it forever.",
    ]
    text = "\n".join(text_parts)

    body_blocks = [
        {"type": "h_remembered", "text": f"We remembered {pet}."},
    ]
    if stats_line:
        body_blocks.append({"type": "p", "text": stats_line})
    body_blocks += [
        {"type": "p", "text": "The small things you've trusted us with — they built this."},
        {"type": "p", "text": "The Doggy Bakery is now The Doggy Company."},
        {"type": "p_bold", "text": f"Same hands. Bigger home. Mira knows {pet} now."},
        {
            "type": "p",
            "text": (
                f"<b>{_e(pet)}'s</b> founding place is saved.<br/>"
                "Free until <b>May 2027</b> · Founding discount, forever · No card needed."
            ),
            "raw_html": True,
        },
    ]

    html = _wrap_html(
        first_name=first,
        token=parent.get("invite_token", ""),
        body_blocks=body_blocks,
        cta_label=f"Claim {pet}'s place",
        ps=f"P.S. — Tell us {pet}'s birthday and we'll remember it forever.",
    )

    return {
        "tier": "HIGH",
        "subject": subject,
        "preheader": preheader,
        "html": html,
        "text": text,
    }


# ── Tier 3: MINIMAL ───────────────────────────────────────────────────
def _build_minimal(parent, primary_pet):
    first = _safe_first_name(parent)

    subject = "From The Doggy Bakery to The Doggy Company — your founding place. 🌷"
    preheader = "You were here before we were here. We saved you a place."

    text_parts = [
        f"Hi {first},",
        "",
        "You were here before we were here.",
        "",
        "The Doggy Bakery — Bangalore, 2023 to today —",
        "is now The Doggy Company.",
        "Same hands. Bigger home.",
        "A Pet Life OS for the way you actually live with your dog.",
        "",
        "Your founding place is held.",
        "Free until May 2027 · Founding discount, forever · No card needed.",
        "",
        "→ Claim your founding place",
        _claim_url(parent.get("invite_token", "")),
        "",
        "If your pet's name is missing here,",
        "we'll get to know them when you arrive.",
        "That's the whole idea.",
        "",
        "With care,",
        "Dipali, Aditya, Roji & Mira",
        "The Doggy Company",
        "",
        "⚘ Built in memory of Mystique.",
        "",
        "P.S. — When you claim your place, we start listening. That's the only difference.",
    ]
    text = "\n".join(text_parts)

    html = _wrap_html(
        first_name=first,
        token=parent.get("invite_token", ""),
        body_blocks=[
            {"type": "h_remembered", "text": "You were here before we were here."},
            {
                "type": "p",
                "text": (
                    "The Doggy Bakery — Bangalore, 2023 to today —<br/>"
                    "is now <b>The Doggy Company</b>.<br/>"
                    "Same hands. Bigger home.<br/>"
                    "A Pet Life OS for the way you actually live with your dog."
                ),
                "raw_html": True,
            },
            {
                "type": "p",
                "text": (
                    "Your founding place is held.<br/>"
                    "Free until <b>May 2027</b> · Founding discount, forever · No card needed."
                ),
                "raw_html": True,
            },
            {
                "type": "p_italic",
                "text": (
                    "If your pet's name is missing here, "
                    "we'll get to know them when you arrive. "
                    "That's the whole idea."
                ),
            },
        ],
        cta_label="Claim your founding place",
        ps="P.S. — When you claim your place, we start listening. That's the only difference.",
    )

    return {
        "tier": "MINIMAL",
        "subject": subject,
        "preheader": preheader,
        "html": html,
        "text": text,
    }


# ── HTML wrapper (single source of truth) ─────────────────────────────
def _e(s: Any) -> str:
    """Escape user-controlled content for HTML."""
    return _html.escape(str(s or ""))


def _render_blocks(blocks: List[Optional[Dict[str, Any]]]) -> str:
    """Render typed body blocks into safe HTML."""
    out = []
    for blk in blocks:
        if blk is None:
            continue
        t = blk.get("type")
        text = blk.get("text", "")
        raw = blk.get("raw_html", False)
        safe = text if raw else _e(text)
        if t == "stack":
            for line in blk.get("lines", []):
                out.append(
                    f'<p style="margin:0 0 8px;font:400 17px/1.6 Georgia,serif;color:#3D2C1E">{_e(line)}</p>'
                )
            out.append('<div style="height:14px"></div>')
        elif t == "h_remembered":
            out.append(
                f'<p style="margin:0 0 18px;font:400 22px/1.45 Georgia,serif;color:#3D2C1E">{safe}</p>'
            )
        elif t == "p":
            out.append(
                f'<p style="margin:0 0 16px;font:400 16px/1.7 Georgia,serif;color:#3D2C1E">{safe}</p>'
            )
        elif t == "p_bold":
            out.append(
                f'<p style="margin:0 0 16px;font:600 17px/1.6 Georgia,serif;color:#3D2C1E">{safe}</p>'
            )
        elif t == "p_italic":
            out.append(
                f'<p style="margin:0 0 16px;font:400 italic 15px/1.7 Georgia,serif;color:#6B5945">{safe}</p>'
            )
    return "\n".join(out)


def _wrap_html(*, first_name: str, token: str, body_blocks: List[Dict[str, Any]],
               cta_label: str, ps: str) -> str:
    cta_url = _claim_url(token)
    unsub = _unsub_url(token)
    body_html = _render_blocks(body_blocks)
    safe_first = _e(first_name)
    safe_cta = _e(cta_label)
    safe_ps = _e(ps)

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>The Doggy Company</title>
</head>
<body style="margin:0;padding:0;background:#FAF7F2;color:#3D2C1E;font-family:Georgia,serif">
<!-- preheader (hidden) -->
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;color:#FAF7F2">{_e(_PREHEADERS.get(cta_label, ''))}</div>

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#FAF7F2">
  <tr><td align="center" style="padding:32px 16px">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px;width:100%">

      <!-- Header -->
      <tr><td align="center" style="padding:8px 0 32px">
        <div style="font:400 13px/1.4 Georgia,serif;color:#8B6F47;letter-spacing:0.18em;text-transform:uppercase">
          The Doggy Company
        </div>
        <div style="margin-top:10px;font-size:34px">🌷</div>
      </td></tr>

      <!-- Card -->
      <tr><td style="background:#ffffff;border:1px solid #E8D7BD;border-radius:24px;padding:40px 36px">

        <p style="margin:0 0 20px;font:400 16px/1.6 Georgia,serif;color:#3D2C1E">
          Hi {safe_first},
        </p>

        {body_html}

        <!-- CTA -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:28px 0 8px">
          <tr><td align="center">
            <a href="{cta_url}" style="display:inline-block;padding:16px 36px;background:#3D2C1E;color:#FAF7F2;text-decoration:none;border-radius:999px;font:600 15px/1 Georgia,serif;letter-spacing:0.02em">
              → {safe_cta}
            </a>
          </td></tr>
        </table>

        <p style="margin:24px 0 0;font:400 15px/1.7 Georgia,serif;color:#3D2C1E">
          With care,<br/>
          Dipali, Aditya, Roji &amp; Mira<br/>
          <span style="color:#8B6F47">The Doggy Company</span>
        </p>

      </td></tr>

      <!-- Mystique footer (every email — non-negotiable) -->
      <tr><td align="center" style="padding:28px 0 16px">
        <p style="margin:0;font:400 italic 13px/1.6 Georgia,serif;color:#8B6F47">
          ⚘ Built in memory of Mystique.
        </p>
      </td></tr>

      <!-- P.S. -->
      <tr><td style="padding:0 8px">
        <p style="margin:0 0 24px;font:400 italic 14px/1.7 Georgia,serif;color:#6B5945;text-align:center">
          {safe_ps}
        </p>
      </td></tr>

      <!-- Legal footer -->
      <tr><td align="center" style="padding:8px 16px 16px">
        <p style="margin:0;font:400 11px/1.6 Arial,sans-serif;color:#A89685">
          You're receiving this because you ordered from The Doggy Bakery, now The Doggy Company.<br/>
          <a href="{unsub}" style="color:#A89685;text-decoration:underline">Unsubscribe</a>
          &nbsp;·&nbsp; <a href="mailto:hello@thedoggycompany.com" style="color:#A89685;text-decoration:underline">Reply to talk to us</a>
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>"""


_PREHEADERS = {}  # populated below for safety even though preheader is also returned in the dict


# ── Public entrypoint ─────────────────────────────────────────────────
def build_email(parent: Dict[str, Any],
                primary_pet: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Resolve tier, return a dict with subject/preheader/html/text/to."""
    tier = resolve_tier(parent, primary_pet)
    if tier == "COMPLETE":
        out = _build_complete(parent, primary_pet)
    elif tier == "HIGH":
        out = _build_high(parent, primary_pet)
    else:
        out = _build_minimal(parent, primary_pet)

    out["to"] = (parent.get("email") or "").strip().lower() or None
    out["to_name"] = (parent.get("first_name") or "").strip() or None
    out["from_name"] = BRAND_FROM_NAME
    out["from_email"] = BRAND_FROM_EMAIL
    return out

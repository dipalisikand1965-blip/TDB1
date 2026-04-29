"""
Partner Demo Routes — AI-Powered B2B Proposal Generator
─────────────────────────────────────────────────────────
Generates partner-specific demo pages at /proposal/{slug}.

Admin types in: partner_name, industry, target_audience, logo, contact_email
Claude Sonnet 4.5 generates: hero copy, stats, demo scenarios, demo pet, pitch
Result is saved to `partner_demos` collection and rendered by PartnerDemoPage.jsx.

Soft-gated: viewers enter their email before seeing the proposal. Each open
triggers a Resend lead-tracking alert to Dipali.
"""

import os
import re
import json
import logging
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel, Field, EmailStr
from motor.motor_asyncio import AsyncIOMotorDatabase

from emergentintegrations.llm.chat import LlmChat, UserMessage
import resend

from admin_routes import verify_admin

logger = logging.getLogger(__name__)

partner_demo_router = APIRouter(tags=["Partner Demos"])

# Database reference (set from server.py)
db: AsyncIOMotorDatabase = None


def set_database(database: AsyncIOMotorDatabase):
    global db
    db = database


# ═══════════════════════════════════════════════════════════════════
# CONFIG
# ═══════════════════════════════════════════════════════════════════

CLAUDE_MODEL = "claude-sonnet-4-5-20250929"  # Sonnet 4.5
LEAD_ALERT_TO = os.environ.get("PARTNER_LEAD_ALERT_EMAIL", "dipali@clubconcierge.in")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")
RESEND_API_KEY = os.environ.get("RESEND_API_KEY")
EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY")

VALID_INDUSTRIES = {
    "bank", "insurance", "pet_store", "grooming",
    "vet_hospital", "corporate", "hotel", "airline", "other"
}


# ═══════════════════════════════════════════════════════════════════
# MODELS
# ═══════════════════════════════════════════════════════════════════

class GenerateDemoRequest(BaseModel):
    partner_name: str = Field(..., min_length=2, max_length=120)
    industry: str = Field(..., description="One of VALID_INDUSTRIES")
    target_audience: str = Field(..., min_length=3, max_length=200)
    partner_logo: Optional[str] = None  # URL
    contact_email: Optional[str] = None


class UpdateDemoRequest(BaseModel):
    partner_name: Optional[str] = None
    industry: Optional[str] = None
    target_audience: Optional[str] = None
    partner_logo: Optional[str] = None
    contact_email: Optional[str] = None
    generated: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None


class GateUnlockRequest(BaseModel):
    viewer_email: EmailStr
    viewer_name: Optional[str] = None


# ═══════════════════════════════════════════════════════════════════
# HELPERS
# ═══════════════════════════════════════════════════════════════════

def slugify(name: str) -> str:
    """HDFC Bank → 'hdfc-bank'"""
    s = re.sub(r"[^a-zA-Z0-9]+", "-", name.lower()).strip("-")
    return s[:60] or "partner"


async def _unique_slug(base: str) -> str:
    """Ensure slug is unique in collection."""
    slug = base
    n = 2
    while await db.partner_demos.find_one({"slug": slug}):
        slug = f"{base}-{n}"
        n += 1
    return slug


def _strip_id(doc: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if not doc:
        return None
    doc.pop("_id", None)
    return doc


# ═══════════════════════════════════════════════════════════════════
# CLAUDE GENERATION
# ═══════════════════════════════════════════════════════════════════

SYSTEM_PROMPT = """You are a B2B sales copywriter for The Doggy Company — India's first Pet Life Operating System powered by Mira AI. The Doggy Company combines 30 years of concierge heritage (LesConcierges → Club Concierge → The Doggy Bakery) with cutting-edge AI to deliver pet care across 12 life pillars: Dine, Care, Go, Play, Learn, Services, Shop, Celebrate, Emergency, Adopt, Farewell, Paperwork.

Your job: Generate compelling, partner-specific demo page content that will be presented to a decision-maker at the partner organization. The tone should be confident, data-driven, slightly poetic, never desperate.

Indian context — use Indian rupees (₹), Indian breeds where natural, and Indian market data.

Return ONLY valid JSON. No prose, no markdown, no code fences. The JSON must match this exact schema:

{
  "hero_headline": "string, max 8 words, punchy, addressed to the partner",
  "hero_subtext": "string, max 24 words, value proposition for their audience",
  "stats": [
    {"value": "string e.g. '38%'", "label": "string e.g. 'cardholders own pets'"},
    {"value": "string", "label": "string"},
    {"value": "string", "label": "string"},
    {"value": "string", "label": "string"}
  ],
  "demo_scenarios": [
    {"emoji": "single emoji", "text": "string max 60 chars - what user asks Mira", "intent": "string max 40 chars"},
    {"emoji": "...", "text": "...", "intent": "..."},
    {"emoji": "...", "text": "...", "intent": "..."},
    {"emoji": "...", "text": "...", "intent": "..."},
    {"emoji": "...", "text": "...", "intent": "..."},
    {"emoji": "...", "text": "...", "intent": "..."},
    {"emoji": "...", "text": "...", "intent": "..."},
    {"emoji": "...", "text": "...", "intent": "..."}
  ],
  "demo_pet": {
    "name": "string - a memorable pet name fitting the partner's brand",
    "breed": "string - real breed",
    "age_years": 2,
    "allergy": "string e.g. 'Chicken' or 'None'",
    "soul_score": 78,
    "personality": ["string", "string", "string"],
    "favorite_treat": "string"
  },
  "pitch_copy": "string - 3 paragraphs separated by \\n\\n. First paragraph hooks with their pain. Second introduces Mira OS as the solution. Third closes with the unique partnership value.",
  "partnership_angle": "string - one sentence describing the specific commercial angle for this partner"
}

Rules:
- Stats must include ONE numeric percentage, ONE rupee figure, ONE multiplier (e.g. '2.3x'), ONE absolute number — all relevant to the partner's industry.
- Demo scenarios must include at least one EMERGENCY (vomiting, injury), one MULTI-INTENT (two requests in one), and one tailored to the partner's industry.
- Demo pet's name should subtly nod to the partner's brand (e.g. 'Goldie' for a gold credit card, 'Penny' for a payments company) without being on-the-nose.
- All copy must be in English. Avoid clichés like 'revolutionary', 'cutting-edge', 'game-changer'.

CRITICAL — COMMERCIAL MODEL (NEVER GET THIS WRONG):
The Doggy Company sells **Pet Pass memberships** to partners on a flat **per-member annual fee** basis. The partner sponsors the membership for their customers as a tier benefit. There is NO revenue share, NO transaction fee, NO commission on services. NEVER write "revenue share", "transaction-based revenue", "commission on services", "rev split", or any equivalent — these are factually wrong.

The model is simple: Partner pays TDC `₹X per sponsored member per year` × number of customers they want covered. Members get unlimited Concierge® access. The partner's cost is predictable, their members get a premium benefit, and TDC handles all execution.

In `pitch_copy` and `partnership_angle`, the commercial angle MUST emphasise:
- **Predictable per-member pricing** (not unpredictable rev-share)
- **No transaction overhead** for the partner — they sponsor, we deliver
- **Member loyalty win** — daily, recurring touchpoints with the partner's brand
- **Quick deployment** — co-branded white-label in weeks, not months

Make the per-member model sound exciting: it's predictable ARR for the partner, deep loyalty for their members, and zero operational complexity."""


async def generate_with_claude(req: GenerateDemoRequest) -> Dict[str, Any]:
    """Call Claude Sonnet 4.5 via emergentintegrations and return parsed JSON."""
    if not EMERGENT_LLM_KEY:
        raise HTTPException(500, "EMERGENT_LLM_KEY not configured")

    user_prompt = f"""Partner: {req.partner_name}
Industry: {req.industry}
Target audience: {req.target_audience}

Generate the JSON now."""

    session_id = f"partner-demo-{slugify(req.partner_name)}-{int(datetime.now(timezone.utc).timestamp())}"

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=session_id,
        system_message=SYSTEM_PROMPT,
    ).with_model("anthropic", CLAUDE_MODEL)

    try:
        raw = await chat.send_message(UserMessage(text=user_prompt))
    except Exception as e:
        logger.exception("Claude generation failed")
        raise HTTPException(502, f"Claude generation failed: {e}")

    # Strip code fences if Claude added them despite instructions
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```\s*$", "", cleaned)

    try:
        parsed = json.loads(cleaned)
    except json.JSONDecodeError:
        logger.error("Claude returned non-JSON: %s", raw[:500])
        raise HTTPException(502, "Claude returned malformed JSON")

    # Sanity check required keys
    required = {"hero_headline", "hero_subtext", "stats", "demo_scenarios", "demo_pet", "pitch_copy", "partnership_angle"}
    missing = required - set(parsed.keys())
    if missing:
        raise HTTPException(502, f"Claude response missing keys: {missing}")

    return parsed


# ═══════════════════════════════════════════════════════════════════
# LEAD-TRACKING EMAIL
# ═══════════════════════════════════════════════════════════════════

def _send_lead_alert(partner_name: str, slug: str, viewer_email: str, viewer_name: Optional[str], page_url: str):
    """Fire a Resend email to Dipali whenever a viewer unlocks a proposal."""
    if not RESEND_API_KEY:
        logger.warning("RESEND_API_KEY not set, skipping lead alert")
        return
    try:
        resend.api_key = RESEND_API_KEY
        ts = datetime.now(timezone.utc).strftime("%d %b %Y, %H:%M UTC")
        viewer_display = f"{viewer_name} ({viewer_email})" if viewer_name else viewer_email

        html = f"""
        <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; background: #0a0a1a; color: #fff;">
          <div style="background: linear-gradient(135deg, #7c3aed 0%, #ec4899 100%); padding: 24px; border-radius: 16px; text-align: center; margin-bottom: 20px;">
            <div style="font-size: 28px; margin-bottom: 8px;">🎯</div>
            <h1 style="margin: 0; font-size: 22px; font-weight: 700;">New Proposal View</h1>
            <p style="margin: 8px 0 0; opacity: 0.9; font-size: 14px;">Lead-tracking alert</p>
          </div>

          <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 20px; margin-bottom: 16px;">
            <p style="margin: 0 0 12px; font-size: 15px; line-height: 1.6;">
              <strong style="color: #ec4899;">{viewer_display}</strong> just opened your
              <strong style="color: #fbbf24;">{partner_name}</strong> proposal.
            </p>
            <table style="width: 100%; font-size: 14px; color: rgba(255,255,255,0.75);">
              <tr><td style="padding: 4px 0; opacity: 0.6;">Partner</td><td style="padding: 4px 0;"><strong style="color:#fff;">{partner_name}</strong></td></tr>
              <tr><td style="padding: 4px 0; opacity: 0.6;">Viewer</td><td style="padding: 4px 0;">{viewer_email}</td></tr>
              <tr><td style="padding: 4px 0; opacity: 0.6;">Time</td><td style="padding: 4px 0;">{ts}</td></tr>
              <tr><td style="padding: 4px 0; opacity: 0.6;">Page</td><td style="padding: 4px 0;"><a href="{page_url}" style="color:#a78bfa; text-decoration:none;">{page_url}</a></td></tr>
            </table>
          </div>

          <div style="background: rgba(251,191,36,0.1); border: 1px solid rgba(251,191,36,0.3); border-radius: 12px; padding: 16px; text-align: center;">
            <p style="margin: 0; font-size: 13px; color: #fbbf24;">
              💡 Hot tip: Follow up within 30 minutes for 9× higher response rate.
            </p>
          </div>

          <p style="text-align: center; margin-top: 20px; font-size: 12px; opacity: 0.4;">
            The Doggy Company · Partner Proposals
          </p>
        </div>
        """

        resend.Emails.send({
            "from": SENDER_EMAIL,
            "to": [LEAD_ALERT_TO],
            "subject": f"🎯 {viewer_email} opened your {partner_name} proposal",
            "html": html,
            "reply_to": viewer_email,
        })
    except Exception:
        logger.exception("Failed to send lead alert email")


# ═══════════════════════════════════════════════════════════════════
# ADMIN ENDPOINTS
# ═══════════════════════════════════════════════════════════════════

@partner_demo_router.post("/api/admin/partner-demos/generate")
async def generate_partner_demo(
    req: GenerateDemoRequest,
    username: str = Depends(verify_admin),
):
    if req.industry not in VALID_INDUSTRIES:
        raise HTTPException(400, f"Industry must be one of {sorted(VALID_INDUSTRIES)}")

    generated = await generate_with_claude(req)

    base_slug = slugify(req.partner_name)
    slug = await _unique_slug(base_slug)

    doc = {
        "slug": slug,
        "partner_name": req.partner_name,
        "industry": req.industry,
        "target_audience": req.target_audience,
        "partner_logo": req.partner_logo,
        "contact_email": req.contact_email,
        "generated": generated,
        "is_active": True,
        "view_count": 0,
        "viewers": [],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "created_by": username,
    }
    await db.partner_demos.insert_one(doc)

    return {
        "ok": True,
        "slug": slug,
        "preview_url": f"/proposal/{slug}",
        "demo": _strip_id(doc),
    }


@partner_demo_router.get("/api/admin/partner-demos")
async def list_partner_demos(username: str = Depends(verify_admin)):
    cursor = db.partner_demos.find({}, {"_id": 0}).sort("created_at", -1)
    demos = await cursor.to_list(length=500)
    return {"ok": True, "demos": demos, "count": len(demos)}


@partner_demo_router.get("/api/admin/partner-demos/{slug}")
async def get_partner_demo_admin(slug: str, username: str = Depends(verify_admin)):
    doc = await db.partner_demos.find_one({"slug": slug}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Demo not found")
    return {"ok": True, "demo": doc}


@partner_demo_router.put("/api/admin/partner-demos/{slug}")
async def update_partner_demo(
    slug: str,
    req: UpdateDemoRequest,
    username: str = Depends(verify_admin),
):
    doc = await db.partner_demos.find_one({"slug": slug})
    if not doc:
        raise HTTPException(404, "Demo not found")

    update = {k: v for k, v in req.model_dump(exclude_unset=True).items() if v is not None}
    if "industry" in update and update["industry"] not in VALID_INDUSTRIES:
        raise HTTPException(400, f"Industry must be one of {sorted(VALID_INDUSTRIES)}")
    update["updated_at"] = datetime.now(timezone.utc).isoformat()

    await db.partner_demos.update_one({"slug": slug}, {"$set": update})
    fresh = await db.partner_demos.find_one({"slug": slug}, {"_id": 0})
    return {"ok": True, "demo": fresh}


@partner_demo_router.delete("/api/admin/partner-demos/{slug}")
async def delete_partner_demo(slug: str, username: str = Depends(verify_admin)):
    res = await db.partner_demos.update_one(
        {"slug": slug},
        {"$set": {"is_active": False, "updated_at": datetime.now(timezone.utc).isoformat()}},
    )
    if res.matched_count == 0:
        raise HTTPException(404, "Demo not found")
    return {"ok": True, "soft_deleted": slug}


@partner_demo_router.post("/api/admin/partner-demos/{slug}/regenerate-section")
async def regenerate_section(
    slug: str,
    section: str,
    username: str = Depends(verify_admin),
):
    """Regenerate one specific section: 'stats' | 'demo_scenarios' | 'demo_pet' | 'pitch_copy' | 'hero'"""
    allowed = {"stats", "demo_scenarios", "demo_pet", "pitch_copy", "hero", "all"}
    if section not in allowed:
        raise HTTPException(400, f"section must be one of {sorted(allowed)}")

    doc = await db.partner_demos.find_one({"slug": slug})
    if not doc:
        raise HTTPException(404, "Demo not found")

    req = GenerateDemoRequest(
        partner_name=doc["partner_name"],
        industry=doc["industry"],
        target_audience=doc["target_audience"],
        partner_logo=doc.get("partner_logo"),
        contact_email=doc.get("contact_email"),
    )
    new_full = await generate_with_claude(req)

    if section == "all":
        merged = new_full
    else:
        merged = dict(doc.get("generated", {}))
        if section == "hero":
            merged["hero_headline"] = new_full["hero_headline"]
            merged["hero_subtext"] = new_full["hero_subtext"]
        else:
            merged[section] = new_full[section]

    await db.partner_demos.update_one(
        {"slug": slug},
        {"$set": {"generated": merged, "updated_at": datetime.now(timezone.utc).isoformat()}},
    )
    fresh = await db.partner_demos.find_one({"slug": slug}, {"_id": 0})
    return {"ok": True, "demo": fresh}


# ═══════════════════════════════════════════════════════════════════
# PUBLIC ENDPOINTS
# ═══════════════════════════════════════════════════════════════════

@partner_demo_router.get("/api/partner-demos/{slug}/meta")
async def get_partner_demo_meta(slug: str):
    """Pre-gate metadata: just enough to render the email-gate screen."""
    doc = await db.partner_demos.find_one(
        {"slug": slug, "is_active": True},
        {"_id": 0, "partner_name": 1, "partner_logo": 1, "industry": 1, "slug": 1},
    )
    if not doc:
        raise HTTPException(404, "Proposal not found")
    return {"ok": True, "meta": doc}


@partner_demo_router.post("/api/partner-demos/{slug}/unlock")
async def unlock_partner_demo(slug: str, body: GateUnlockRequest, request: Request):
    """Viewer enters email → record lead, fire alert email, return full demo."""
    doc = await db.partner_demos.find_one({"slug": slug, "is_active": True})
    if not doc:
        raise HTTPException(404, "Proposal not found")

    viewer_entry = {
        "email": body.viewer_email,
        "name": body.viewer_name,
        "ip": (request.headers.get("X-Forwarded-For", "").split(",")[0].strip()
               or (request.client.host if request.client else "unknown")),
        "user_agent": request.headers.get("User-Agent", "")[:200],
        "at": datetime.now(timezone.utc).isoformat(),
    }

    await db.partner_demos.update_one(
        {"slug": slug},
        {
            "$inc": {"view_count": 1},
            "$push": {"viewers": viewer_entry},
            "$set": {"last_viewed_at": viewer_entry["at"]},
        },
    )

    # Fire lead alert (best-effort; never block the response)
    try:
        scheme = request.headers.get("X-Forwarded-Proto", "https")
        host = request.headers.get("X-Forwarded-Host") or request.headers.get("Host", "thedoggycompany.com")
        page_url = f"{scheme}://{host}/proposal/{slug}"
        _send_lead_alert(
            partner_name=doc["partner_name"],
            slug=slug,
            viewer_email=body.viewer_email,
            viewer_name=body.viewer_name,
            page_url=page_url,
        )
    except Exception:
        logger.exception("Lead alert failed (non-fatal)")

    fresh = await db.partner_demos.find_one({"slug": slug}, {"_id": 0, "viewers": 0})
    return {"ok": True, "demo": fresh}

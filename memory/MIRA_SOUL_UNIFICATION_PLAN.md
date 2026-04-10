# Mira Soul Unification Plan
## One Brain. One Voice. WhatsApp + Widget.

**Date:** April 2026  
**Status:** APPROVED — implement after Save to GitHub  
**Rule #1: DO NOT TOUCH widget, MiraChatWidget.jsx, mira_routes.py, or server.py**

---

## The Problem

Mira has two personalities today:

| | Widget | WhatsApp |
|--|--|--|
| Voice | Soul guardian, warm, adventurous | Generic chatbot |
| Competitor rule | Never mention Rover/Supertails | Missing |
| Chatbot phrases | Blocked ("Happy to help!") | Not blocked |
| Context retention | Holds intent across messages | Missing |
| Grief/farewell | Full escalation protocol | Missing |
| Service flows | Ask before showing products | Missing |
| Governing principles | 7 principles, always active | Missing |
| Pet-first doctrine | Enforced | Partial |
| Archetype tone | Full dict, injected | Full dict, injected ✅ |
| Allergen block | Enforced | Enforced ✅ |
| gpt-4o | Yes | Yes (just fixed) ✅ |

**Root cause:** The soul lives in `mira_routes.py` as `MIRA_OS_SYSTEM_PROMPT`.  
WhatsApp rebuilt its own shorter prompt from scratch, missing 80% of the identity.

---

## The Fix — One Source of Truth

### New file: `/app/backend/mira_soul.py`
Contains `MIRA_CORE_SOUL` — the identity, voice, rules, and principles  
that are **channel-agnostic** (same for Widget AND WhatsApp).

### Nothing changes in:
- `mira_routes.py` (Widget brain — LOCKED)
- `MiraChatWidget.jsx` (Widget UI — LOCKED)
- `server.py` (LOCKED)
- Any frontend file (LOCKED)

### Only changes in:
- **`whatsapp_routes.py`** — `get_mira_ai_response()` system prompt  
  replaces current short prompt with: `MIRA_CORE_SOUL` + WhatsApp-specific format rules

---

## What Goes Into MIRA_CORE_SOUL

Extracted verbatim from `mira_routes.py` lines 1503–1730:

```
1. COMPETITOR RULE (absolute — Rover, Supertails, HUFT, etc.)
2. SOULFUL VOICE (never chatbot phrases, always soul guardian)
3. CONTEXT-ADAPTIVE VOICE (treats vs health vs booking vs grief)
4. GOLDEN DOCTRINE — Pet First (name before breed, always)
5. ABSOLUTE RULES (products after alignment, not on first message)
6. GOVERNING PRINCIPLES 1–7 (Presence→Performance, Remember→Ask→Confirm→Act, etc.)
7. CONTEXT RETENTION RULE (hold the intent, zero exceptions)
8. FAREWELL & GRIEF ESCALATION RULE (full protocol)
9. SERVICE FLOWS (grooming, boarding, trainer — ask first)
```

---

## What Stays WhatsApp-Only (in whatsapp_routes.py)

```
1. Format: 4–6 sentences max (WhatsApp is not a web app)
2. Format: No markdown — no **bold**, no ### headers
3. Product format: "Name — ₹X → link" (WhatsApp-friendly)
4. Banned words list (current list — good)
5. ALLERGEN ALERT block (dynamic, from pet profile)
6. CONDITION RULE block (dynamic, from pet profile)  
7. ARCHETYPE TONES dict + injection (already WhatsApp-specific)
8. ACTIVE PET LOCK (already in WhatsApp prompt)
9. CATALOG block / MIRA IMAGINES protocol (already in WhatsApp prompt)
10. RESPONSE STRUCTURE template (Hey [Name]! format)
11. MEMBER PROFILE context block (allergies, favourites, archetype)
```

---

## Implementation — 3 Steps, No Widget Risk

### Step 1: Create `/app/backend/mira_soul.py`
```python
MIRA_CORE_SOUL = """[verbatim copy of sections 1–9 from mira_routes.py]"""
```

### Step 2: In `whatsapp_routes.py`, import and prepend
```python
from mira_soul import MIRA_CORE_SOUL

system_prompt = f"""{MIRA_CORE_SOUL}

═══════════════════════════════════════════════════════
📱 WHATSAPP FORMAT RULES (channel-specific)
═══════════════════════════════════════════════════════
...existing WhatsApp-specific rules...
{allergen_rule}{condition_rule}{catalog_instruction}...
"""
```

### Step 3: Verify `mira_routes.py` unchanged
```bash
git diff mira_routes.py  # must show 0 changes
```

---

## Before / After (Mojo treats example)

**Before (gpt-4o-mini, short prompt):**
> "Sure! Here are some great treats for Mojo. Since he has allergies to chicken and beef,
> I recommend salmon treats. Happy to help!"

**After (gpt-4o, full soul):**
> "Mojo's been on my mind — you know how a Wild Explorer is always ready for the next trail?
> Salmon is basically his trail fuel. Since chicken and beef are off the table:
> 
> - Salmon Training Bites — ₹299 → thedoggycompany.com/dine
>   ✦ Why: Salmon (Mojo's favourite), zero allergens, perfect for high-energy adventures
> 
> What are you two planning next? 🐾"

---

## Risk Assessment

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Widget breaks | Zero | We only touch whatsapp_routes.py |
| WhatsApp longer responses | Low | Format rules cap at 4–6 sentences |
| mira_soul.py import error | Very low | Syntax-checked before deploy |
| Tone too long for WhatsApp | Low | Format rules enforce brevity |

---

## Files Touched
- `NEW: /app/backend/mira_soul.py`
- `EDIT: /app/backend/whatsapp_routes.py` (system_prompt only, ~40 lines)
- `NO CHANGE: mira_routes.py`
- `NO CHANGE: MiraChatWidget.jsx`
- `NO CHANGE: server.py`
- `NO CHANGE: Any frontend file`

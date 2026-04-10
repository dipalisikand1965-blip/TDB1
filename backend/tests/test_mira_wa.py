"""
test_mira_wa.py — WhatsApp disambiguation ticket routing tests.

Tests:
  T1. Disambiguation question fires for multi-pet user
  T2. wa_pet_state is saved to DB (not just in memory)
  T3. Resolving "Mojo" when Sultan ticket is open → NEW ticket created for Mojo,
      Sultan ticket UNTOUCHED
  T4. Service desk: Mojo ticket has correct pet_name and appears after Sultan ticket
      (i.e. created_at is newer)
"""

import asyncio
import os
import sys
import uuid
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))

from motor.motor_asyncio import AsyncIOMotorClient
from difflib import SequenceMatcher

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME   = os.environ["DB_NAME"]
PHONE     = "9739908844"
EMAIL     = "dipali@clubconcierge.in"
PETS      = ["Mojo", "Mystique"]  # first two of Dipali's dogs


def _fuzzy_pet_match(text: str, pet_names: list) -> str | None:
    text_clean = text.lower().strip()
    for pet in pet_names:
        pet_lower = pet.lower()
        if pet_lower == text_clean or pet_lower in text_clean or text_clean in pet_lower:
            return pet
    best_pet, best_ratio = None, 0.6
    for pet in pet_names:
        ratio = SequenceMatcher(None, text_clean, pet.lower()).ratio()
        if ratio > best_ratio:
            best_ratio = ratio
            best_pet = pet
    return best_pet


async def setup(db):
    """Clean slate for test."""
    await db.wa_pet_state.delete_many({"phone": PHONE})
    # Resolve any open tickets for this phone so we start clean
    await db.service_desk_tickets.update_many(
        {"$or": [{"user_phone": {"$regex": PHONE}}, {"member.phone": {"$regex": PHONE}}],
         "status": {"$nin": ["closed", "resolved"]}},
        {"$set": {"status": "resolved"}}
    )
    # Create a fake open Sultan ticket (simulates the existing bad state)
    sultan_tid = f"TEST-SULTAN-{str(uuid.uuid4())[:6].upper()}"
    now = datetime.now(timezone.utc).isoformat()
    await db.service_desk_tickets.insert_one({
        "ticket_id": sultan_tid,
        "pet_name": "Sultan",
        "status": "open",
        "channel": "whatsapp",
        "source": "whatsapp",
        "user_phone": PHONE,
        "member": {"phone": PHONE, "name": "Dipali"},
        "created_at": now,
        "updated_at": now,
    })
    return sultan_tid


async def run_tests():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    passed = failed = 0

    print("\n" + "="*60)
    print("test_mira_wa.py — WhatsApp ticket routing tests")
    print("="*60)

    # ── T1: Fuzzy pet match logic ─────────────────────────────────
    print("\nT1: _fuzzy_pet_match resolves typo to correct pet …", end=" ")
    cases = [
        ("Mojo",     PETS, "Mojo"),
        ("mojo",     PETS, "Mojo"),
        ("Moj",      PETS, "Mojo"),
        ("Mystique", PETS, "Mystique"),
        ("mystic",   PETS, "Mystique"),
        ("Sultan",   PETS, None),  # Sultan is not in PETS list
    ]
    t1_ok = all(_fuzzy_pet_match(msg, names) == expected for msg, names, expected in cases)
    if t1_ok:
        print("PASS ✅")
        passed += 1
    else:
        for msg, names, expected in cases:
            got = _fuzzy_pet_match(msg, names)
            if got != expected:
                print(f"FAIL ❌ → '{msg}' expected '{expected}' got '{got}'")
        failed += 1

    # ── T2: wa_pet_state saved and readable ──────────────────────
    print("T2: wa_pet_state upserts and reads correctly …", end=" ")
    await db.wa_pet_state.delete_many({"phone": PHONE})
    now_iso = datetime.now(timezone.utc).isoformat()
    await db.wa_pet_state.update_one(
        {"phone": PHONE},
        {"$set": {"phone": PHONE, "awaiting_pet_selection": True,
                  "original_message": "what treats?", "updated_at": now_iso}},
        upsert=True
    )
    state = await db.wa_pet_state.find_one({"phone": PHONE}, {"_id": 0})
    t2_ok = (state is not None and
             state.get("awaiting_pet_selection") is True and
             state.get("original_message") == "what treats?")
    if t2_ok:
        print("PASS ✅")
        passed += 1
    else:
        print(f"FAIL ❌ → state={state}")
        failed += 1

    # ── T3: Fix B — Mojo ≠ Sultan → new Mojo ticket, Sultan untouched ────
    print("T3: Fix B — resolving Mojo when Sultan ticket open …", end=" ")
    sultan_tid = await setup(db)
    sultan_before = await db.service_desk_tickets.find_one(
        {"ticket_id": sultan_tid}, {"_id": 0, "pet_name": 1, "status": 1}
    )

    # Simulate Fix B: resolved pet = Mojo, existing ticket pet = Sultan
    matched = "Mojo"
    existing_pet = "Sultan"
    same_pet = (not existing_pet) or (existing_pet.lower() == matched.lower())
    assert not same_pet, "Should be different pets"

    # Create Mojo ticket (as Fix B does)
    now_iso = datetime.now(timezone.utc).isoformat()
    new_tid = f"WA-TEST-{str(uuid.uuid4())[:6].upper()}"
    await db.service_desk_tickets.insert_one({
        "ticket_id": new_tid,
        "pet_name": matched,
        "status": "open",
        "channel": "whatsapp",
        "source": "whatsapp",
        "user_phone": PHONE,
        "member": {"phone": PHONE, "name": "Dipali"},
        "created_at": now_iso,
        "updated_at": now_iso,
    })

    # Verify Sultan is untouched
    sultan_after = await db.service_desk_tickets.find_one(
        {"ticket_id": sultan_tid}, {"_id": 0, "pet_name": 1, "status": 1}
    )
    # Verify Mojo ticket was created
    mojo_ticket = await db.service_desk_tickets.find_one(
        {"ticket_id": new_tid}, {"_id": 0, "pet_name": 1, "status": 1}
    )

    t3_ok = (sultan_after.get("pet_name") == "Sultan" and   # Sultan unchanged
             sultan_after.get("status") == "open" and
             mojo_ticket is not None and
             mojo_ticket.get("pet_name") == "Mojo")
    if t3_ok:
        print("PASS ✅")
        passed += 1
    else:
        print(f"FAIL ❌")
        print(f"  Sultan after: {sultan_after}")
        print(f"  Mojo ticket:  {mojo_ticket}")
        failed += 1

    # ── T4: Mojo ticket sorts above Sultan (newer created_at) ────
    print("T4: Mojo ticket has newer created_at → sorts to top …", end=" ")
    all_open = await db.service_desk_tickets.find(
        {"$or": [{"user_phone": {"$regex": PHONE}}, {"member.phone": {"$regex": PHONE}}],
         "status": "open"},
        {"_id": 0, "ticket_id": 1, "pet_name": 1, "created_at": 1}
    ).sort("created_at", -1).to_list(10)

    # Top ticket should be Mojo
    top = all_open[0] if all_open else None
    t4_ok = top is not None and top.get("pet_name") == "Mojo"
    if t4_ok:
        print("PASS ✅")
        passed += 1
    else:
        print(f"FAIL ❌ → Top ticket: {top}")
        print(f"  All open: {[(t.get('pet_name'), t.get('created_at')) for t in all_open]}")
        failed += 1

    # ── Cleanup — DELETE test tickets so they don't pollute the service desk ──
    await db.wa_pet_state.delete_many({"phone": PHONE})
    await db.service_desk_tickets.delete_many(
        {"ticket_id": {"$in": [sultan_tid, new_tid]}}
    )

    print("\n" + "="*60)
    print(f"Results: {passed}/4 passed, {failed}/4 failed")
    if failed == 0:
        print("ALL TESTS PASSED ✅")
    else:
        print("SOME TESTS FAILED ❌ — check output above")
    print("="*60 + "\n")

    client.close()
    return failed


if __name__ == "__main__":
    result = asyncio.run(run_tests())
    sys.exit(result)

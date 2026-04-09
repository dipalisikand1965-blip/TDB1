"""Debug test — see exactly what context and system prompt get_mira_ai_response builds for Test 4."""
import asyncio
import os
from dotenv import load_dotenv
load_dotenv("/app/backend/.env")

import uuid
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone

async def main():
    client = AsyncIOMotorClient(os.environ.get("MONGO_URL"))
    db = client[os.environ.get("DB_NAME")]

    phone = "09739908844"
    phone_10 = "9739908844"

    # Insert fake open ticket for Badmash
    fake_id = f"DBG-{uuid.uuid4().hex[:6].upper()}"
    await db.service_desk_tickets.insert_one({
        "ticket_id": fake_id,
        "status": "open",
        "pet_name": "Badmash",
        "user_phone": phone_10,
        "member": {"phone": phone_10},
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "_test_marker": True
    })
    print(f"Inserted fake ticket {fake_id} for Badmash")

    # Now manually run the context-building logic from get_mira_ai_response
    context_parts = []
    all_pet_names  = []
    all_allergies  = []
    ticket_pet_name = None

    phone_clean = ''.join(filter(str.isdigit, str(phone)))
    if len(phone_clean) == 12 and phone_clean.startswith('91'):
        phone_clean = phone_clean[2:]

    open_ticket = await db.service_desk_tickets.find_one(
        {
            "$or": [
                {"user_phone": {"$regex": phone_clean}},
                {"member.phone": {"$regex": phone_clean}},
                {"member.whatsapp": {"$regex": phone_clean}},
            ],
            "status": {"$nin": ["closed", "resolved"]},
        },
        sort=[("updated_at", -1)],
    )
    if open_ticket:
        ticket_pet_name = open_ticket.get("pet_name")
        print(f"✅ Open ticket found: pet_name = '{ticket_pet_name}'")

    user = await db.users.find_one({
        "$or": [
            {"phone": {"$regex": phone_clean}},
            {"whatsapp": {"$regex": phone_clean}},
        ]
    }, {"_id": 0, "email": 1, "name": 1})

    if user:
        print(f"✅ User: {user}")
        pets = await db.pets.find(
            {"owner_email": user["email"]},
            {"_id": 0, "name": 1, "breed": 1}
        ).to_list(10)
        print(f"✅ All pets for user: {[p['name'] for p in pets]}")

        if ticket_pet_name:
            pets.sort(key=lambda p: 0 if p.get("name","").lower() == ticket_pet_name.lower() else 1)

        pet_lines = [f"{p['name']} ({p.get('breed','')})" for p in pets]

        if ticket_pet_name:
            active_lines = [l for l in pet_lines if ticket_pet_name.lower() in l.lower()]
            context_parts.append(f"Dog in this conversation: {active_lines[0] if active_lines else pet_lines[0]}")
            context_parts.append(f"RULE: This conversation is ONLY about {ticket_pet_name}. Never name or reference any other dog.")
        else:
            context_parts.append(f"Dogs: {' | '.join(pet_lines)}")

    print("\n=== CONTEXT PARTS GOING INTO SYSTEM PROMPT ===")
    for i, c in enumerate(context_parts):
        print(f"  [{i}] {c}")

    print(f"\n=== SESSION ID ===")
    print(f"  wa-{phone_clean}-{ticket_pet_name.lower() if ticket_pet_name else 'all'}")

    # Cleanup
    await db.service_desk_tickets.delete_one({"ticket_id": fake_id})
    print(f"\nCleaned up {fake_id}")
    client.close()

asyncio.run(main())

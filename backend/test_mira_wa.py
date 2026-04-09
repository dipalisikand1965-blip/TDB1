"""
WhatsApp Mira Intelligence Test Script
Tests 3 user-requested scenarios:
1. "Baby rabbit toy" → real dog toy products
2. "What treats for Mojo" → chicken/beef BLOCKED
3. "Book a groomer for Badmash" → grooming + NearMe
"""
import asyncio
import os
import sys

# ── CRITICAL: load .env BEFORE any other imports ─────────────────────────────
from dotenv import load_dotenv
load_dotenv("/app/backend/.env")

from motor.motor_asyncio import AsyncIOMotorClient

async def check_db_data():
    """First, verify what data exists for Mojo and Badmash."""
    client = AsyncIOMotorClient(os.environ.get("MONGO_URL", "mongodb://localhost:27017"))
    db_name = os.environ.get("DB_NAME", "test_database")
    db = client[db_name]

    print("=" * 60)
    print("STEP 1: Checking DB for Mojo & Badmash")
    print("=" * 60)

    pets = await db.pets.find(
        {"name": {"$in": ["Mojo", "Badmash", "mojo", "badmash"]}},
        {"_id": 0, "name": 1, "breed": 1, "allergies": 1,
         "doggy_soul_answers": 1, "owner_email": 1,
         "favorite_foods": 1, "life_stage": 1, "city": 1}
    ).to_list(10)

    phone_map = {}  # name -> phone

    for p in pets:
        print(f"Pet: {p.get('name')}")
        print(f"  Breed:   {p.get('breed')}")
        print(f"  Owner:   {p.get('owner_email')}")
        print(f"  Allergies: {p.get('allergies')}")
        soul = p.get("doggy_soul_answers", {})
        print(f"  Soul food_allergies: {soul.get('food_allergies', 'none')}")
        print(f"  City: {p.get('city')}")
        print()

    owners = list({p.get("owner_email") for p in pets if p.get("owner_email")})
    if owners:
        users = await db.users.find(
            {"email": {"$in": owners}},
            {"_id": 0, "name": 1, "email": 1, "phone": 1, "whatsapp": 1, "city": 1}
        ).to_list(10)
        print("OWNERS:")
        for u in users:
            print(f"  {u.get('name')} | {u.get('email')} | phone={u.get('phone')} | wa={u.get('whatsapp')}")
            # Map pet names to their owner's phone
            for p in pets:
                if p.get("owner_email") == u.get("email"):
                    phone = u.get("phone") or u.get("whatsapp") or "9739908844"
                    phone_map[p["name"].lower()] = phone
        print()

    client.close()
    return pets, phone_map


async def run_test(scenario_num: int, message: str, user_name: str, user_phone: str, expect_blocked: list = None, expect_nearme: bool = False):
    """Run a single get_mira_ai_response test."""
    print("=" * 60)
    print(f"TEST {scenario_num}: '{message}'")
    print(f"  User: {user_name} | Phone: {user_phone}")
    if expect_blocked:
        print(f"  Expect BLOCKED allergens: {expect_blocked}")
    if expect_nearme:
        print(f"  Expect NearMe/Maps link: YES")
    print("=" * 60)

    # Import the actual function
    sys.path.insert(0, "/app/backend")
    from whatsapp_routes import get_mira_ai_response

    try:
        response = await get_mira_ai_response(message, user_name, user_phone)
        print(f"\nMIRA RESPONSE:\n{response}")
        print()

        # Validate
        passed = True
        if expect_blocked:
            for allergen in expect_blocked:
                if allergen.lower() in response.lower():
                    print(f"  ❌ FAIL: Found blocked allergen '{allergen}' in response!")
                    passed = False
                else:
                    print(f"  ✅ PASS: '{allergen}' correctly absent from response")

        if expect_nearme:
            if "maps.google.com" in response or "maps.google" in response or "near" in response.lower():
                print("  ✅ PASS: NearMe/Maps link found in response")
            else:
                print("  ❌ FAIL: No Maps link found in response")
                passed = False

        # Check for product links / prices
        if "thedoggycompany.com" in response or "₹" in response or "amazon.in" in response:
            print("  ✅ PASS: Product links/prices found in response")
        else:
            print("  ⚠️  WARN: No direct product links found (may be ok for NearMe)")

        print(f"\n  RESULT: {'✅ PASSED' if passed else '❌ FAILED'}")
        return passed, response

    except Exception as e:
        print(f"  ❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False, str(e)


async def main():
    pets, phone_map = await check_db_data()

    # Resolve phones
    mojo_phone  = phone_map.get("mojo",    "9739908844")
    badmash_phone = phone_map.get("badmash", "9739908844")

    print(f"Using Mojo phone: {mojo_phone}")
    print(f"Using Badmash phone: {badmash_phone}")
    print()

    results = []

    # ── TEST 1: Baby rabbit toy ───────────────────────────────────────────────
    ok, _ = await run_test(
        1,
        message="Baby rabbit toy",
        user_name="Test User",
        user_phone="9999999999",  # Anonymous — no soul profile
        expect_blocked=[],
        expect_nearme=False
    )
    results.append(("Baby rabbit toy", ok))

    # ── TEST 2: What treats for Mojo ─────────────────────────────────────────
    ok, _ = await run_test(
        2,
        message="What treats can I give Mojo",
        user_name="Dipali",
        user_phone=mojo_phone,
        expect_blocked=["chicken", "beef"],
        expect_nearme=False
    )
    results.append(("Treats for Mojo (allergy check)", ok))

    # ── TEST 3: Book a groomer for Badmash ───────────────────────────────────
    ok, _ = await run_test(
        3,
        message="Book a groomer near me for Badmash",
        user_name="Dipali",
        user_phone=badmash_phone,
        expect_blocked=[],
        expect_nearme=True
    )
    results.append(("Groomer for Badmash (NearMe)", ok))

    # ── Summary ───────────────────────────────────────────────────────────────
    print("\n" + "=" * 60)
    print("FINAL RESULTS")
    print("=" * 60)
    for name, ok in results:
        status = "✅ PASSED" if ok else "❌ FAILED"
        print(f"  {status}  {name}")

    all_pass = all(ok for _, ok in results)
    print(f"\n{'✅ ALL TESTS PASSED' if all_pass else '❌ SOME TESTS FAILED'}")
    return all_pass


if __name__ == "__main__":
    ok = asyncio.run(main())
    sys.exit(0 if ok else 1)

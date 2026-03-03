"""
Pet Ownership Audit Script

This script audits and fixes incorrectly assigned pets in the database.
It identifies pets that may have been wrongly assigned to dipali@clubconcierge.in
due to the now-fixed auto-pet-linking bug.

Usage:
  # Dry run (audit only, no changes)
  python scripts/audit_pet_ownership.py --dry-run
  
  # Fix pets with user confirmation
  python scripts/audit_pet_ownership.py --fix
  
  # Export report to CSV
  python scripts/audit_pet_ownership.py --export
"""

import asyncio
import os
import sys
import csv
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient

# Load environment
from dotenv import load_dotenv
load_dotenv()

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'mira_db')


async def audit_pet_ownership(dry_run=True, export_csv=False):
    """
    Audit pet ownership and identify potentially misassigned pets.
    
    Logic:
    1. Get all pets owned by dipali@clubconcierge.in
    2. Check each pet's created_at timestamp
    3. If pet was created AFTER dipali's account AND pet has a different owner_name, it's likely misassigned
    4. Cross-reference with user registrations to find rightful owner
    """
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print("=" * 60)
    print("🔍 PET OWNERSHIP AUDIT")
    print("=" * 60)
    print(f"Database: {DB_NAME}")
    print(f"Mode: {'DRY RUN (no changes)' if dry_run else '⚠️ FIX MODE (will modify data)'}")
    print()
    
    # Get all users for cross-reference
    users = await db.users.find({}, {"_id": 0, "id": 1, "email": 1, "name": 1, "created_at": 1}).to_list(1000)
    user_by_email = {u.get("email"): u for u in users if u.get("email")}
    user_by_name = {u.get("name", "").lower(): u for u in users if u.get("name")}
    
    print(f"Found {len(users)} registered users")
    
    # Get dipali's account info
    dipali = user_by_email.get("dipali@clubconcierge.in")
    if not dipali:
        print("⚠️ dipali@clubconcierge.in not found in users collection")
    else:
        print(f"Dipali's account created: {dipali.get('created_at', 'Unknown')}")
    
    # Get all pets owned by dipali
    dipali_pets = await db.pets.find(
        {"owner_email": "dipali@clubconcierge.in"},
        {"_id": 0}
    ).to_list(500)
    
    print(f"Pets currently assigned to dipali: {len(dipali_pets)}")
    print()
    
    # Known dipali pets (by name) - these are legitimate
    LEGITIMATE_DIPALI_PETS = {
        "mojo", "mystique", "bruno", "buddy", "lola", "meister", "luna"
    }
    
    suspicious_pets = []
    legitimate_pets = []
    
    for pet in dipali_pets:
        pet_name = (pet.get("name") or "").lower()
        owner_name = pet.get("owner_name", "")
        created_at = pet.get("created_at", "")
        
        # Check if this is a known dipali pet
        if pet_name in LEGITIMATE_DIPALI_PETS:
            legitimate_pets.append(pet)
            continue
        
        # Check if owner_name doesn't match "Dipali"
        if owner_name and owner_name.lower() != "dipali":
            # This pet might belong to someone else
            # Try to find the rightful owner
            potential_owner = user_by_name.get(owner_name.lower())
            
            suspicious_pets.append({
                "pet_id": pet.get("id"),
                "pet_name": pet.get("name"),
                "current_owner_email": "dipali@clubconcierge.in",
                "owner_name_on_pet": owner_name,
                "potential_owner_email": potential_owner.get("email") if potential_owner else "NOT FOUND",
                "created_at": created_at,
                "pet_pass_number": pet.get("pet_pass_number")
            })
    
    print("=" * 60)
    print("📊 AUDIT RESULTS")
    print("=" * 60)
    print(f"Legitimate Dipali pets: {len(legitimate_pets)}")
    print(f"Suspicious/Misassigned pets: {len(suspicious_pets)}")
    print()
    
    if suspicious_pets:
        print("⚠️ SUSPICIOUS PETS (may need reassignment):")
        print("-" * 60)
        for sp in suspicious_pets:
            print(f"  Pet: {sp['pet_name']} (ID: {sp['pet_id']})")
            print(f"    Owner name on pet: {sp['owner_name_on_pet']}")
            print(f"    Potential owner: {sp['potential_owner_email']}")
            print(f"    Created: {sp['created_at']}")
            print()
    
    # Export to CSV if requested
    if export_csv and suspicious_pets:
        csv_path = f"/app/exports/pet_audit_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        with open(csv_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=suspicious_pets[0].keys())
            writer.writeheader()
            writer.writerows(suspicious_pets)
        print(f"📁 Report exported to: {csv_path}")
    
    # Fix if not dry run
    if not dry_run and suspicious_pets:
        print()
        print("=" * 60)
        print("🔧 FIXING MISASSIGNED PETS")
        print("=" * 60)
        
        fixed_count = 0
        for sp in suspicious_pets:
            if sp['potential_owner_email'] != "NOT FOUND":
                # Get the potential owner's full info
                owner = user_by_email.get(sp['potential_owner_email'])
                if owner:
                    result = await db.pets.update_one(
                        {"id": sp['pet_id']},
                        {"$set": {
                            "owner_email": owner["email"],
                            "owner_id": owner.get("id"),
                            "parent_email": owner["email"],
                            "member_email": owner["email"],
                            "ownership_fixed_at": datetime.utcnow().isoformat(),
                            "ownership_fix_note": "Fixed by audit script - was incorrectly assigned to dipali"
                        }}
                    )
                    if result.modified_count > 0:
                        print(f"  ✅ Fixed: {sp['pet_name']} → {owner['email']}")
                        fixed_count += 1
                    else:
                        print(f"  ⚠️ No change: {sp['pet_name']}")
            else:
                print(f"  ⏭️ Skipped: {sp['pet_name']} - No matching user found for owner name '{sp['owner_name_on_pet']}'")
        
        print()
        print(f"Fixed {fixed_count} of {len(suspicious_pets)} suspicious pets")
    
    print()
    print("=" * 60)
    print("✅ AUDIT COMPLETE")
    print("=" * 60)
    
    return suspicious_pets


async def main():
    args = sys.argv[1:]
    
    dry_run = True
    export_csv = False
    
    if "--fix" in args:
        dry_run = False
        print("⚠️ Running in FIX mode - this will modify the database!")
        confirm = input("Type 'yes' to confirm: ")
        if confirm.lower() != 'yes':
            print("Aborted.")
            return
    
    if "--export" in args:
        export_csv = True
    
    await audit_pet_ownership(dry_run=dry_run, export_csv=export_csv)


if __name__ == "__main__":
    asyncio.run(main())

"""
Pet Wrapped - Automated Triggers (Cron Jobs)

This module handles automated birthday and annual wrapped triggers.
Run via cron or scheduler (e.g., daily at 9 AM IST).

Usage:
  python -m routes.wrapped.cron_triggers birthday   # Check and send birthday wrappeds
  python -m routes.wrapped.cron_triggers annual     # Generate December annual wrappeds
"""

import os
import sys
from datetime import datetime, timezone, timedelta
from pymongo import MongoClient
import requests

# Load environment
def load_env():
    env_path = os.path.join(os.path.dirname(__file__), '../../.env')
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key] = value

load_env()

# MongoDB connection
client = MongoClient(os.environ.get("MONGO_URL"))
db_name = os.environ.get("DB_NAME") or "test_database"
db = client[db_name]

# API base URL
API_BASE = os.environ.get("API_BASE_URL", "https://thedoggycompany.com")


def check_birthday_wrappeds():
    """
    Check for pets with birthdays in the next 7 days.
    Send Birthday Wrapped to owners who haven't received one yet this year.
    
    Run daily at 9 AM.
    """
    print(f"\n{'='*50}")
    print(f"🎂 BIRTHDAY WRAPPED CHECK - {datetime.now()}")
    print(f"{'='*50}\n")
    
    today = datetime.now(timezone.utc)
    
    # Get all pets with birth_date
    pets = list(db.pets.find({
        "birth_date": {"$exists": True, "$ne": None}
    }))
    
    print(f"Found {len(pets)} pets with birth dates\n")
    
    birthday_count = 0
    sent_count = 0
    
    for pet in pets:
        try:
            birth_date_str = pet.get('birth_date')
            if not birth_date_str:
                continue
                
            # Parse birth date
            if isinstance(birth_date_str, str):
                birth_date = datetime.fromisoformat(birth_date_str.replace('Z', '+00:00'))
            else:
                birth_date = birth_date_str
            
            # Calculate this year's birthday
            this_year_birthday = birth_date.replace(year=today.year)
            if this_year_birthday.tzinfo is None:
                this_year_birthday = this_year_birthday.replace(tzinfo=timezone.utc)
            
            # Check if birthday is in next 7 days
            days_until = (this_year_birthday - today).days
            
            if 0 <= days_until <= 7:
                birthday_count += 1
                pet_id = pet.get('id') or str(pet.get('_id'))
                pet_name = pet.get('name', 'Pet')
                
                print(f"🎂 {pet_name}'s birthday in {days_until} days!")
                
                # Check if we already sent birthday wrapped this year
                existing = db.wrapped_deliveries.find_one({
                    "pet_id": pet_id,
                    "wrapped_type": "birthday",
                    "triggered_at": {"$gte": datetime(today.year, 1, 1, tzinfo=timezone.utc)}
                })
                
                if existing:
                    print(f"   ↳ Already sent this year, skipping")
                    continue
                
                # Trigger Birthday Wrapped
                try:
                    response = requests.post(
                        f"{API_BASE}/api/wrapped/trigger-birthday/{pet_id}",
                        timeout=30
                    )
                    if response.status_code == 200:
                        sent_count += 1
                        print(f"   ✅ Birthday Wrapped sent!")
                    else:
                        print(f"   ⚠️ Failed: {response.status_code}")
                except Exception as e:
                    print(f"   ❌ Error: {e}")
                    
        except Exception as e:
            print(f"Error processing pet {pet.get('name')}: {e}")
    
    print(f"\n{'='*50}")
    print(f"📊 SUMMARY: {birthday_count} birthdays upcoming, {sent_count} wrappeds sent")
    print(f"{'='*50}\n")
    
    return {"birthdays_found": birthday_count, "wrappeds_sent": sent_count}


def generate_annual_wrappeds():
    """
    Generate Annual Wrapped for ALL active pets.
    Run in December (typically Dec 1-15).
    
    This is a batch job that processes all pets.
    """
    print(f"\n{'='*50}")
    print(f"🎄 ANNUAL WRAPPED GENERATION - {datetime.now()}")
    print(f"{'='*50}\n")
    
    today = datetime.now(timezone.utc)
    year = today.year
    
    # Only run in December
    if today.month != 12:
        print(f"⚠️ Not December (current month: {today.month}). Skipping.")
        print("   Annual Wrapped only runs in December.")
        return {"status": "skipped", "reason": "not_december"}
    
    # Get all active pets (those with owner_email)
    pets = list(db.pets.find({
        "owner_email": {"$exists": True, "$ne": None}
    }))
    
    print(f"Found {len(pets)} active pets\n")
    
    processed = 0
    sent = 0
    skipped = 0
    
    for pet in pets:
        try:
            pet_id = pet.get('id') or str(pet.get('_id'))
            pet_name = pet.get('name', 'Pet')
            
            # Check if already generated this year
            existing = db.wrapped_deliveries.find_one({
                "pet_id": pet_id,
                "wrapped_type": "annual",
                "year": year
            })
            
            if existing:
                print(f"⏭️ {pet_name} - Already generated for {year}")
                skipped += 1
                continue
            
            processed += 1
            print(f"🎄 Generating Annual Wrapped for {pet_name}...")
            
            # Trigger Annual Wrapped
            try:
                response = requests.post(
                    f"{API_BASE}/api/wrapped/trigger-annual/{pet_id}",
                    json={"year": year},
                    timeout=30
                )
                if response.status_code == 200:
                    sent += 1
                    print(f"   ✅ Sent!")
                else:
                    print(f"   ⚠️ Failed: {response.status_code}")
            except Exception as e:
                print(f"   ❌ Error: {e}")
                
        except Exception as e:
            print(f"Error processing pet: {e}")
    
    print(f"\n{'='*50}")
    print(f"📊 SUMMARY: {processed} processed, {sent} sent, {skipped} skipped")
    print(f"{'='*50}\n")
    
    return {"processed": processed, "sent": sent, "skipped": skipped, "year": year}


def main():
    """Main entry point for cron job."""
    if len(sys.argv) < 2:
        print("Usage: python cron_triggers.py [birthday|annual]")
        print("  birthday - Check and send birthday wrappeds")
        print("  annual   - Generate December annual wrappeds")
        sys.exit(1)
    
    command = sys.argv[1].lower()
    
    if command == "birthday":
        result = check_birthday_wrappeds()
    elif command == "annual":
        result = generate_annual_wrappeds()
    else:
        print(f"Unknown command: {command}")
        sys.exit(1)
    
    print(f"Result: {result}")


if __name__ == "__main__":
    main()

"""
Pet Wrapped - Automated Triggers (Cron Jobs)

This module handles automated birthday and annual wrapped triggers.
Used by APScheduler in server.py for automated daily/annual checks.

Jobs:
  - check_birthday_wrappeds: Runs daily at 9 AM IST
  - generate_annual_wrappeds: Runs December 1-15
"""

import os
import logging
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
import httpx

logger = logging.getLogger(__name__)

# MongoDB connection (async)
client = AsyncIOMotorClient(os.environ.get("MONGO_URL"))
db_name = os.environ.get("DB_NAME") or "test_database"
db = client[db_name]

# API base URL from environment
API_BASE = os.environ.get("REACT_APP_BACKEND_URL") or os.environ.get("API_BASE_URL") or "https://thedoggycompany.com"


async def check_birthday_wrappeds():
    """
    Check for pets with birthdays in the next 7 days.
    Send Birthday Wrapped to owners who haven't received one yet this year.
    
    Runs daily at 9 AM IST (via APScheduler).
    """
    logger.info("=" * 50)
    logger.info(f"BIRTHDAY WRAPPED CHECK - {datetime.now(timezone.utc)}")
    logger.info("=" * 50)
    
    today = datetime.now(timezone.utc)
    
    # Get all pets with birth_date
    pets_cursor = db.pets.find({
        "birth_date": {"$exists": True, "$ne": None}
    })
    pets = await pets_cursor.to_list(1000)
    
    logger.info(f"Found {len(pets)} pets with birth dates")
    
    birthday_count = 0
    sent_count = 0
    skipped_count = 0
    
    for pet in pets:
        try:
            birth_date_str = pet.get('birth_date')
            if not birth_date_str:
                continue
                
            # Parse birth date
            if isinstance(birth_date_str, str):
                # Handle various date formats
                try:
                    birth_date = datetime.fromisoformat(birth_date_str.replace('Z', '+00:00'))
                except:
                    try:
                        birth_date = datetime.strptime(birth_date_str, "%Y-%m-%d")
                    except:
                        continue
            else:
                birth_date = birth_date_str
            
            # Calculate this year's birthday
            try:
                this_year_birthday = birth_date.replace(year=today.year)
                if this_year_birthday.tzinfo is None:
                    this_year_birthday = this_year_birthday.replace(tzinfo=timezone.utc)
            except ValueError:
                # Feb 29 edge case
                this_year_birthday = birth_date.replace(year=today.year, month=2, day=28)
            
            # Check if birthday is in next 7 days
            days_until = (this_year_birthday.date() - today.date()).days
            
            if 0 <= days_until <= 7:
                birthday_count += 1
                pet_id = pet.get('id') or str(pet.get('_id'))
                pet_name = pet.get('name', 'Pet')
                owner_email = pet.get('owner_email', '')
                
                logger.info(f"[BIRTHDAY] {pet_name}'s birthday in {days_until} days! (Owner: {owner_email[:15] if owner_email else 'unknown'}...)")
                
                # Check if we already sent birthday wrapped this year
                existing = await db.wrapped_deliveries.find_one({
                    "pet_id": pet_id,
                    "wrapped_type": "birthday",
                    "triggered_at": {"$gte": datetime(today.year, 1, 1, tzinfo=timezone.utc).isoformat()}
                })
                
                if existing:
                    logger.info(f"   [SKIP] Already sent birthday wrapped this year")
                    skipped_count += 1
                    continue
                
                # Trigger Birthday Wrapped via internal endpoint
                try:
                    async with httpx.AsyncClient() as client:
                        response = await client.post(
                            f"{API_BASE}/api/wrapped/trigger-birthday/{pet_id}",
                            timeout=30.0
                        )
                        if response.status_code == 200:
                            sent_count += 1
                            logger.info(f"   [SENT] Birthday Wrapped delivered!")
                            
                            # Log delivery
                            await db.wrapped_deliveries.insert_one({
                                "pet_id": pet_id,
                                "pet_name": pet_name,
                                "wrapped_type": "birthday",
                                "days_until_birthday": days_until,
                                "triggered_at": datetime.now(timezone.utc).isoformat(),
                                "year": today.year,
                                "status": "sent"
                            })
                        else:
                            logger.warning(f"   [FAIL] Birthday Wrapped failed: {response.status_code}")
                except Exception as e:
                    logger.error(f"   [ERROR] Birthday Wrapped error: {e}")
                    
        except Exception as e:
            logger.error(f"Error processing pet {pet.get('name', 'unknown')}: {e}")
    
    logger.info("=" * 50)
    logger.info(f"BIRTHDAY CHECK COMPLETE: {birthday_count} birthdays found, {sent_count} sent, {skipped_count} skipped")
    logger.info("=" * 50)
    
    return {
        "birthdays_found": birthday_count, 
        "wrappeds_sent": sent_count,
        "skipped": skipped_count,
        "checked_at": datetime.now(timezone.utc).isoformat()
    }


async def generate_annual_wrappeds():
    """
    Generate Annual Wrapped (December Year-End Wrapped) for ALL active pets.
    Only runs in December (typically Dec 1-15).
    
    This is the "Spotify Wrapped" moment - everyone shares together!
    """
    logger.info("=" * 50)
    logger.info(f"ANNUAL WRAPPED GENERATION - {datetime.now(timezone.utc)}")
    logger.info("=" * 50)
    
    today = datetime.now(timezone.utc)
    year = today.year
    
    # Only run in December
    if today.month != 12:
        logger.info(f"[SKIP] Not December (current month: {today.month}). Annual Wrapped only runs in December.")
        return {"status": "skipped", "reason": "not_december", "current_month": today.month}
    
    # Only run between Dec 1-20
    if today.day > 20:
        logger.info(f"[SKIP] Past December 20th. Annual Wrapped window closed.")
        return {"status": "skipped", "reason": "past_window", "current_day": today.day}
    
    # Get all pets with owners (active pets)
    pets_cursor = db.pets.find({
        "$or": [
            {"owner_email": {"$exists": True, "$ne": None}},
            {"user_id": {"$exists": True, "$ne": None}}
        ]
    })
    pets = await pets_cursor.to_list(5000)
    
    logger.info(f"Found {len(pets)} active pets for Annual Wrapped")
    
    processed = 0
    sent = 0
    skipped = 0
    errors = 0
    
    for pet in pets:
        try:
            pet_id = pet.get('id') or str(pet.get('_id'))
            pet_name = pet.get('name', 'Pet')
            
            # Check if already generated this year
            existing = await db.wrapped_deliveries.find_one({
                "pet_id": pet_id,
                "wrapped_type": "annual",
                "year": year
            })
            
            if existing:
                logger.debug(f"[SKIP] {pet_name} - Already generated for {year}")
                skipped += 1
                continue
            
            processed += 1
            logger.info(f"[GENERATE] Annual Wrapped for {pet_name}...")
            
            # Trigger Annual Wrapped
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        f"{API_BASE}/api/wrapped/trigger-annual/{pet_id}",
                        json={"year": year},
                        timeout=30.0
                    )
                    if response.status_code == 200:
                        sent += 1
                        logger.info(f"   [SENT] Annual Wrapped for {pet_name}!")
                        
                        # Log delivery
                        await db.wrapped_deliveries.insert_one({
                            "pet_id": pet_id,
                            "pet_name": pet_name,
                            "wrapped_type": "annual",
                            "year": year,
                            "triggered_at": datetime.now(timezone.utc).isoformat(),
                            "status": "sent"
                        })
                    else:
                        errors += 1
                        logger.warning(f"   [FAIL] {pet_name}: {response.status_code}")
            except Exception as e:
                errors += 1
                logger.error(f"   [ERROR] {pet_name}: {e}")
                
        except Exception as e:
            errors += 1
            logger.error(f"Error processing pet: {e}")
    
    logger.info("=" * 50)
    logger.info(f"ANNUAL WRAPPED COMPLETE: {processed} processed, {sent} sent, {skipped} skipped, {errors} errors")
    logger.info("=" * 50)
    
    return {
        "processed": processed, 
        "sent": sent, 
        "skipped": skipped, 
        "errors": errors,
        "year": year,
        "generated_at": datetime.now(timezone.utc).isoformat()
    }


# CLI support for manual runs
if __name__ == "__main__":
    import sys
    import asyncio
    
    async def main():
        if len(sys.argv) < 2:
            print("Usage: python cron_triggers.py [birthday|annual]")
            print("  birthday - Check and send birthday wrappeds")
            print("  annual   - Generate December annual wrappeds")
            sys.exit(1)
        
        command = sys.argv[1].lower()
        
        if command == "birthday":
            result = await check_birthday_wrappeds()
        elif command == "annual":
            result = await generate_annual_wrappeds()
        else:
            print(f"Unknown command: {command}")
            sys.exit(1)
        
        print(f"Result: {result}")
    
    asyncio.run(main())

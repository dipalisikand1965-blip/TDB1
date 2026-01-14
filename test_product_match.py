
import asyncio
import os
import sys
from datetime import datetime, timezone
import logging

# Setup mocking for Resend BEFORE importing server
import unittest.mock as mock

# Mock resend to avoid actual emails and just verify call
mock_resend = mock.MagicMock()
sys.modules["resend"] = mock_resend

# Import server components
# We need to set env vars first if they aren't set
os.environ["MONGO_URL"] = "mongodb://localhost:27017"
os.environ["DB_NAME"] = "test_database"

from backend.server import db, check_product_matches, PetProfileCreate, create_pet_profile

# Configure logging to stdout
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_product_match():
    print("--- Starting Product Match Test ---")
    
    # 1. Create a Test Pet
    test_email = f"test_match_{int(datetime.now().timestamp())}@example.com"
    pet_data = PetProfileCreate(
        name="MatchTester",
        species="dog",
        breed="TestBreed",
        owner_email=test_email,
        email_reminders=True,
        preferences={
            "favorite_flavors": ["Pumpkin", "Blueberry"],
            "allergies": []
        }
    )
    
    # Use the API function directly to create pet
    print(f"Creating pet for {test_email}...")
    result = await create_pet_profile(pet_data)
    pet_id = result["pet"]["id"]
    print(f"Pet created: {pet_id}")
    
    # 2. Simulate New Product Sync
    new_product = {
        "id": "shopify-12345",
        "name": "Blueberry Blast Treat",
        "description": "Delicious blueberry treats",
        "flavors": [{"name": "Blueberry", "price": 0}],
        "image": "http://example.com/image.png",
        "shopify_handle": "blueberry-blast"
    }
    
    print("Simulating product sync with matching flavor 'Blueberry'...")
    
    # Mock the email sending function inside server.py if needed, 
    # but since we mocked resend module, the original function should run and call mock_resend.Emails.send
    
    await check_product_matches([new_product])
    
    # 3. Verify Email Sent
    # We check if resend.Emails.send was called
    if mock_resend.Emails.send.called:
        call_args = mock_resend.Emails.send.call_args[0][0]
        print("\nSUCCESS: Email trigger detected!")
        print(f"To: {call_args['to']}")
        print(f"Subject: {call_args['subject']}")
        print("Html content length:", len(call_args['html']))
    else:
        print("\nFAILURE: Resend.Emails.send was NOT called.")

    # Cleanup
    await db.pets.delete_one({"id": pet_id})
    print("Test pet deleted.")

if __name__ == "__main__":
    asyncio.run(test_product_match())

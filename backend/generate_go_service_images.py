#!/usr/bin/env python3
"""
Generate watercolour images for 8 Go services in services_master.
Run: python3 generate_go_service_images.py
"""
import os, sys, asyncio
sys.path.insert(0, '/app/backend')
from dotenv import load_dotenv
load_dotenv('/app/backend/.env')
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URL = os.environ['MONGO_URL']
DB_NAME = os.environ.get('DB_NAME', 'pet_life_os')

# Import generate function from ai_image_service
from ai_image_service import generate_ai_image, get_service_image_prompt

async def main():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # Get go services without images
    services = await db.services_master.find(
        {'pillar': 'go', '$or': [{'image_url': None}, {'image_url': {'$exists': False}}, {'image_url': ''}]},
        {'_id': 1, 'id': 1, 'name': 1, 'pillar': 1, 'category': 1}
    ).to_list(length=20)
    
    print(f"Found {len(services)} go services needing images")
    
    for svc in services:
        name = svc.get('name', 'Unknown')
        svc_id = svc.get('id')
        
        # Build watercolour prompt
        service_type = svc.get('category', 'travel')
        if service_type == 'stay':
            prompt = f"Soft watercolour illustration of a happy dog in a cosy pet boarding home, warm sage tones, {name}, artistic brushstrokes, minimal background"
        else:
            prompt = f"Soft watercolour illustration of a dog on an adventure journey, {name}, travel vibes, blues and sage, artistic brushstrokes, minimal background"
        
        print(f"  Generating: {name}...")
        try:
            url = await generate_ai_image(prompt)
            if url:
                await db.services_master.update_one(
                    {'_id': svc['_id']},
                    {'$set': {'image_url': url, 'watercolor_image': url, 'ai_generated_image': True}}
                )
                print(f"  ✓ {name}: {url[:60]}...")
            else:
                print(f"  ✗ {name}: no URL returned")
        except Exception as e:
            print(f"  ✗ {name}: error: {e}")
        
        await asyncio.sleep(2)  # Rate limit
    
    print("\nDone! All go services processed.")
    client.close()

if __name__ == "__main__":
    asyncio.run(main())

import asyncio
import sys
import os
sys.path.insert(0, '/app/frontend/src')

from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import uuid
import json
import re

# Read mockData.js and extract products
def parse_mockdata():
    with open('/app/frontend/src/mockData.js', 'r') as f:
        content = f.read()
    
    products = []
    
    # Find all product arrays
    arrays = [
        'birthdayCakes', 'breedCakes', 'treats', 'dognuts', 'pizzasBurgers',
        'freshMeals', 'frozenTreats', 'accessories', 'catTreats', 'giftCards',
        'merchandise', 'miniCakes', 'desiTreats', 'nutButters', 'cakeMix', 'panIndiaCakes'
    ]
    
    for arr_name in arrays:
        # Find the array content
        pattern = rf'export const {arr_name} = \[(.*?)\];'
        match = re.search(pattern, content, re.DOTALL)
        if match:
            arr_content = match.group(1)
            # Extract individual objects
            obj_pattern = r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}'
            objects = re.findall(obj_pattern, arr_content)
            
            for obj_str in objects:
                try:
                    # Clean up the JS object to make it JSON-parseable
                    # Replace single quotes with double quotes
                    obj_str = re.sub(r"'([^']*)'", r'"\1"', obj_str)
                    # Add quotes around keys
                    obj_str = re.sub(r'(\w+):', r'"\1":', obj_str)
                    # Remove trailing commas
                    obj_str = re.sub(r',\s*([}\]])', r'\1', obj_str)
                    # Fix boolean values
                    obj_str = obj_str.replace('true', 'true').replace('false', 'false')
                    
                    # Try to parse
                    product = json.loads(obj_str)
                    if 'name' in product and 'price' in product:
                        products.append(product)
                except:
                    pass
    
    return products

async def import_to_mongo():
    client = AsyncIOMotorClient(os.environ.get('MONGO_URL', 'mongodb://localhost:27017'))
    db = client[os.environ.get('DB_NAME', 'test_database')]
    
    products = parse_mockdata()
    print(f"Parsed {len(products)} products from mockData.js")
    
    # Clear existing products
    await db.products_master.delete_many({})
    
    # Add timestamps
    for p in products:
        if 'id' not in p:
            p['id'] = str(uuid.uuid4())
        p['created_at'] = datetime.now(timezone.utc).isoformat()
        p['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    if products:
        await db.products_master.insert_many(products)
        print(f"Imported {len(products)} products to MongoDB")
    
    client.close()

if __name__ == '__main__':
    asyncio.run(import_to_mongo())

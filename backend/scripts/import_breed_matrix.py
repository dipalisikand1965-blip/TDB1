"""
Import Breed Matrix CSV into MongoDB
Creates the breed_matrix collection with breed-specific recommendations for each pillar.
"""

import asyncio
import csv
import os
from motor.motor_asyncio import AsyncIOMotorClient

# Pillar mapping from CSV columns
PILLAR_COLUMNS = {
    'celebrate': 'Celebrate',
    'dine': 'Dine', 
    'stay': 'Stay',
    'travel': 'Travel',
    'care': 'Care',
    'enjoy': 'Enjoy',
    'fit': 'Fit',
    'learn': 'Learn',
    'emergency': 'Emergency',
    'farewell': 'Farewell / Adopt'
}

def parse_recommendations(text):
    """Parse semicolon/comma separated recommendations into list of items."""
    if not text or text.strip() == '':
        return []
    
    # Split by semicolons first (major items), then by + (bundled items)
    items = []
    for part in text.split(';'):
        part = part.strip()
        if part:
            # Each part might have multiple items joined by +
            sub_items = [s.strip() for s in part.split('+')]
            for item in sub_items:
                if item:
                    items.append({
                        'name': item,
                        'display_name': item.replace('/', ' or ').title(),
                        'original': part
                    })
    return items

def normalize_breed_key(breed):
    """Convert breed name to a normalized key."""
    return breed.lower().replace(' ', '_').replace('-', '_')

async def import_breed_matrix(csv_path: str):
    """Import breed matrix from CSV into MongoDB."""
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'pet-os-live-test_database')
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print(f"Connected to database: {db_name}")
    
    # Clear existing data
    await db.breed_matrix.delete_many({})
    print("Cleared existing breed_matrix collection")
    
    breeds_imported = 0
    
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        
        for row in reader:
            breed_name = row.get('Breed', '').strip()
            if not breed_name:
                continue
            
            breed_key = normalize_breed_key(breed_name)
            breed_logic = row.get('Breed Logic', '')
            
            # Parse traits from breed logic
            traits = [t.strip() for t in breed_logic.split(',') if t.strip()]
            
            # Build recommendations for each pillar
            recommendations = {}
            for pillar_key, csv_column in PILLAR_COLUMNS.items():
                text = row.get(csv_column, '')
                items = parse_recommendations(text)
                if items:
                    recommendations[pillar_key] = {
                        'items': items,
                        'raw_text': text
                    }
            
            # Create breed document
            breed_doc = {
                'breed': breed_name,
                'breed_key': breed_key,
                'traits': traits,
                'trait_text': breed_logic,
                'recommendations': recommendations,
                'pillar_count': len(recommendations)
            }
            
            await db.breed_matrix.insert_one(breed_doc)
            breeds_imported += 1
            print(f"  Imported: {breed_name} ({len(recommendations)} pillars)")
    
    # Create indexes
    await db.breed_matrix.create_index('breed_key')
    await db.breed_matrix.create_index('breed')
    
    print(f"\n✅ Imported {breeds_imported} breeds into breed_matrix collection")
    
    # Show sample
    sample = await db.breed_matrix.find_one({'breed_key': 'shih_tzu'})
    if sample:
        print(f"\nSample - Shih Tzu recommendations:")
        for pillar, data in sample.get('recommendations', {}).items():
            items = [i['name'] for i in data.get('items', [])][:3]
            print(f"  {pillar}: {', '.join(items)}")

if __name__ == '__main__':
    import sys
    csv_path = sys.argv[1] if len(sys.argv) > 1 else '/tmp/breed_matrix.csv'
    asyncio.run(import_breed_matrix(csv_path))

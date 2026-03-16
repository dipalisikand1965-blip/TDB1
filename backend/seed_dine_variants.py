"""
seed_dine_variants.py
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Adds Shopify-style options + variants to dine products
so ProductDetailModal shows "Select Protein" + "Select Portion Size"
exactly like Celebrate cakes show "Select Base" + "Select Flavour".

Run once:
  cd /app/backend && python3 seed_dine_variants.py
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""
import asyncio, os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()

# ── Variant templates per dine category ────────────────────────────────────
CATEGORY_VARIANTS = {
    'Daily Meals': {
        'options': [
            {'name': 'Protein', 'values': ['Salmon', 'Lamb', 'Peanut Butter']},
            {'name': 'Portion Size', 'values': ['250g', '500g', '1kg']},
        ],
        'price_map': {'250g': 0, '500g': 150, '1kg': 350},
    },
    'Treats & Rewards': {
        'options': [
            {'name': 'Flavour', 'values': ['Salmon', 'Peanut Butter', 'Lamb']},
            {'name': 'Pack Size', 'values': ['100g', '250g', '500g']},
        ],
        'price_map': {'100g': 0, '250g': 100, '500g': 220},
    },
    'Supplements': {
        'options': [
            {'name': 'Format', 'values': ['Powder', 'Chewable Tablet', 'Liquid']},
            {'name': 'Supply', 'values': ['30 Days', '60 Days', '90 Days']},
        ],
        'price_map': {'30 Days': 0, '60 Days': 180, '90 Days': 320},
    },
    'Frozen & Fresh': {
        'options': [
            {'name': 'Protein', 'values': ['Salmon', 'Lamb', 'Vegetables']},
            {'name': 'Pack', 'values': ['4 Patties', '8 Patties', '16 Patties']},
        ],
        'price_map': {'4 Patties': 0, '8 Patties': 200, '16 Patties': 450},
    },
    'Homemade & Recipes': {
        'options': [
            {'name': 'Recipe Type', 'values': ['Quick (20 min)', 'Weekend Cook', 'Special Occasion']},
            {'name': 'Format', 'values': ['Digital PDF', 'Ingredient Kit', 'Full Kit + Tools']},
        ],
        'price_map': {'Digital PDF': 0, 'Ingredient Kit': 200, 'Full Kit + Tools': 500},
    },
}

def build_variants(base_price, category_config):
    opts = category_config['options']
    price_map = category_config['price_map']
    variants = []
    vid = 1
    for v1 in opts[0]['values']:
        for v2 in opts[1]['values']:
            addon = price_map.get(v2, 0)
            variants.append({
                'id': f'v{vid}',
                'title': f'{v1} / {v2}',
                'option1': v1,
                'option2': v2,
                'price': max(0, (base_price or 299) + addon),
                'available': True,
            })
            vid += 1
    return variants

async def main():
    client = AsyncIOMotorClient(os.environ['MONGO_URL'])
    db = client[os.environ['DB_NAME']]

    updated = 0
    for cat, config in CATEGORY_VARIANTS.items():
        products = await db.products_master.find(
            {'pillar': 'dine', 'category': cat},
            {'_id': 0, 'id': 1, 'name': 1, 'price': 1, 'options': 1}
        ).to_list(200)

        for p in products:
            # Skip if already has options
            if p.get('options'):
                continue
            base_price = int(p.get('price') or 299)
            variants = build_variants(base_price, config)
            await db.products_master.update_one(
                {'id': p['id']},
                {'$set': {
                    'options': config['options'],
                    'variants': variants,
                }}
            )
            updated += 1

    print(f'[DineVariants] Updated {updated} dine products with options + variants')
    await client.close()

if __name__ == '__main__':
    asyncio.run(main())

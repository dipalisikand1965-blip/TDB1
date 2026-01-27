"""
UNIVERSAL PILLAR PROTOCOL
The Doggy Company - Pet Life Operating System

This script ensures ALL 14 pillars have proper:
1. Products in `products` collection
2. Products in `unified_products` (Product Box)
3. Services in `services` collection
4. Pricing in `pricing_tiers`
5. Shipping in `shipping_rules`

Run on every deployment to ensure data integrity.
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============================================
# ALL 14 PILLARS - MASTER LIST
# ============================================
ALL_PILLARS = [
    'celebrate',  # Cakes, treats, party planning
    'stay',       # Hotels, boarding, daycare
    'travel',     # Pet transport, relocation
    'feed',       # Fresh meals, nutrition
    'care',       # Grooming, walking, sitting
    'fit',        # Fitness, weight management
    'learn',      # Training, behavior
    'enjoy',      # Parks, cafes, adventures
    'groom',      # Professional grooming
    'adopt',      # Adoption services
    'farewell',   # End of life services
    'dine',       # Pet-friendly restaurants
    'insure',     # Pet insurance
    'shop'        # General pet products
]

# ============================================
# DEFAULT PRODUCTS PER PILLAR
# ============================================
def get_pillar_products():
    """Get default products for each pillar"""
    return {
        'celebrate': [
            {'id': 'celebrate-cake-1', 'name': 'Classic Birthday Cake', 'description': 'Delicious wheat-free birthday cake', 'price': 899, 'category': 'cakes'},
            {'id': 'celebrate-party-svc', 'name': 'Birthday Party Planning', 'description': 'Complete party coordination service', 'price': 4999, 'category': 'service', 'product_type': 'service'},
            {'id': 'celebrate-photoshoot', 'name': 'Pet Photoshoot Package', 'description': 'Professional pet photography', 'price': 3499, 'category': 'service', 'product_type': 'service'},
        ],
        'stay': [
            {'id': 'stay-hotel-1', 'name': 'Pet-Friendly Hotel Stay', 'description': 'Luxury hotel with pet amenities', 'price': 5000, 'category': 'hotel'},
            {'id': 'stay-boarding-1', 'name': 'Premium Pet Boarding', 'description': '24/7 care boarding facility', 'price': 1500, 'category': 'boarding'},
            {'id': 'stay-daycare-1', 'name': 'Pet Daycare - Full Day', 'description': 'Supervised daycare with activities', 'price': 600, 'category': 'daycare'},
            {'id': 'stay-resort-1', 'name': 'Pet Resort Getaway', 'description': 'Luxury resort for pets', 'price': 8000, 'category': 'resort'},
            {'id': 'stay-essentials-1', 'name': 'Stay Essentials Kit', 'description': 'Travel bed, bowl, and comfort items', 'price': 2499, 'category': 'essentials'},
        ],
        'travel': [
            {'id': 'travel-cab-1', 'name': 'Pet-Friendly Cab Service', 'description': 'AC cab rides for pets', 'price': 1500, 'category': 'cab'},
            {'id': 'travel-flight-1', 'name': 'Domestic Flight Coordination', 'description': 'Complete flight travel support', 'price': 15000, 'category': 'flight'},
            {'id': 'travel-relocation-1', 'name': 'Pet Relocation Service', 'description': 'Door-to-door pet relocation', 'price': 50000, 'category': 'relocation'},
        ],
        'feed': [
            {'id': 'feed-fresh-1', 'name': 'Fresh Meal Plan - Weekly', 'description': 'Fresh cooked meals delivered weekly', 'price': 2499, 'category': 'fresh-meals'},
            {'id': 'feed-nutrition-1', 'name': 'Nutrition Consultation', 'description': 'Expert diet planning', 'price': 999, 'category': 'consultation', 'product_type': 'service'},
            {'id': 'feed-supplement-1', 'name': 'Vitamin Supplement Pack', 'description': 'Essential vitamins for dogs', 'price': 799, 'category': 'supplements'},
        ],
        'care': [
            {'id': 'care-grooming-1', 'name': 'Full Grooming Package', 'description': 'Bath, haircut, nail trim', 'price': 1500, 'category': 'grooming'},
            {'id': 'care-walking-1', 'name': 'Daily Dog Walking', 'description': '30-minute daily walks', 'price': 500, 'category': 'walking'},
            {'id': 'care-sitting-1', 'name': 'Pet Sitting (8 hours)', 'description': 'In-home pet sitting', 'price': 1200, 'category': 'sitting'},
        ],
        'fit': [
            {'id': 'fit-assessment-1', 'name': 'Fitness Assessment', 'description': 'Comprehensive fitness evaluation', 'price': 1500, 'category': 'assessment', 'product_type': 'service'},
            {'id': 'fit-weight-1', 'name': 'Weight Management Program', 'description': '8-week weight management', 'price': 5000, 'category': 'program', 'product_type': 'service'},
            {'id': 'fit-swim-1', 'name': 'Hydrotherapy Session', 'description': 'Low-impact swimming therapy', 'price': 800, 'category': 'therapy'},
        ],
        'learn': [
            {'id': 'learn-puppy-1', 'name': 'Puppy Training Course', 'description': '8-week foundation training', 'price': 8000, 'category': 'training', 'product_type': 'service'},
            {'id': 'learn-behavior-1', 'name': 'Behavior Modification', 'description': 'Address behavioral issues', 'price': 6000, 'category': 'behavior', 'product_type': 'service'},
            {'id': 'learn-tricks-1', 'name': 'Fun Tricks Workshop', 'description': 'Learn cool tricks', 'price': 2000, 'category': 'workshop'},
        ],
        'enjoy': [
            {'id': 'enjoy-park-1', 'name': 'Dog Park Day Pass', 'description': 'Full day park access', 'price': 500, 'category': 'park'},
            {'id': 'enjoy-cafe-1', 'name': 'Pet Cafe Voucher', 'description': 'Pet-friendly cafe experience', 'price': 800, 'category': 'cafe'},
            {'id': 'enjoy-adventure-1', 'name': 'Pet Adventure Day', 'description': 'Guided outdoor adventure', 'price': 2500, 'category': 'adventure'},
        ],
        'groom': [
            {'id': 'groom-spa-1', 'name': 'Premium Spa Package', 'description': 'Full spa treatment', 'price': 2500, 'category': 'spa'},
            {'id': 'groom-basic-1', 'name': 'Basic Grooming', 'description': 'Bath and brush', 'price': 600, 'category': 'basic'},
            {'id': 'groom-nail-1', 'name': 'Nail Trim & Filing', 'description': 'Professional nail care', 'price': 300, 'category': 'nail'},
        ],
        'adopt': [
            {'id': 'adopt-consult-1', 'name': 'Adoption Consultation', 'description': 'Find your perfect match', 'price': 500, 'category': 'consultation', 'product_type': 'service'},
            {'id': 'adopt-kit-1', 'name': 'New Pet Starter Kit', 'description': 'Everything for your new pet', 'price': 3999, 'category': 'kit'},
            {'id': 'adopt-support-1', 'name': 'Post-Adoption Support', 'description': '30-day support package', 'price': 1999, 'category': 'support', 'product_type': 'service'},
        ],
        'farewell': [
            {'id': 'farewell-memorial-1', 'name': 'Memorial Service', 'description': 'Dignified memorial ceremony', 'price': 5000, 'category': 'memorial', 'product_type': 'service'},
            {'id': 'farewell-cremation-1', 'name': 'Private Cremation', 'description': 'Private cremation service', 'price': 8000, 'category': 'cremation', 'product_type': 'service'},
            {'id': 'farewell-keepsake-1', 'name': 'Memory Keepsake Box', 'description': 'Custom memory preservation', 'price': 2500, 'category': 'keepsake'},
        ],
        'dine': [
            {'id': 'dine-voucher-1', 'name': 'Restaurant Voucher - ₹500', 'description': 'Pet-friendly restaurant credit', 'price': 500, 'category': 'voucher'},
            {'id': 'dine-reservation-1', 'name': 'Premium Reservation Service', 'description': 'Guaranteed pet-friendly seating', 'price': 299, 'category': 'service', 'product_type': 'service'},
            {'id': 'dine-picnic-1', 'name': 'Gourmet Picnic Kit', 'description': 'Pet-friendly picnic set', 'price': 1999, 'category': 'kit'},
        ],
        'insure': [
            {'id': 'insure-basic-1', 'name': 'Basic Health Coverage', 'description': 'Essential health insurance', 'price': 3999, 'category': 'insurance', 'product_type': 'service'},
            {'id': 'insure-premium-1', 'name': 'Premium Coverage Plan', 'description': 'Comprehensive insurance', 'price': 7999, 'category': 'insurance', 'product_type': 'service'},
            {'id': 'insure-accident-1', 'name': 'Accident Only Plan', 'description': 'Accident coverage', 'price': 1999, 'category': 'insurance', 'product_type': 'service'},
        ],
        'shop': [
            {'id': 'shop-toy-1', 'name': 'Interactive Toy Bundle', 'description': 'Set of engaging toys', 'price': 999, 'category': 'toys'},
            {'id': 'shop-bed-1', 'name': 'Orthopedic Pet Bed', 'description': 'Premium memory foam bed', 'price': 3499, 'category': 'beds'},
            {'id': 'shop-bowl-1', 'name': 'Smart Feeding Bowl', 'description': 'Portion-controlled feeding', 'price': 1499, 'category': 'accessories'},
        ],
    }

# ============================================
# DEFAULT SERVICES PER PILLAR
# ============================================
def get_pillar_services():
    """Get concierge services for each pillar"""
    return {
        'celebrate': [
            {'id': 'svc-celebrate-party', 'name': 'Birthday Party Planning', 'description': 'Complete party coordination', 'price': 4999, 'duration': 'Full Day', 'features': ['Venue', 'Cake', 'Decorations', 'Invitations']},
            {'id': 'svc-celebrate-photoshoot', 'name': 'Professional Pet Photoshoot', 'description': 'Studio/outdoor photoshoot', 'price': 3499, 'duration': '2 hours', 'features': ['Photographer', '20 Photos', 'Props']},
            {'id': 'svc-celebrate-pawty', 'name': 'Pawty Package', 'description': 'Full celebration package', 'price': 9999, 'duration': 'Full Day', 'features': ['Cake', 'Photoshoot', 'Decor', 'Coordination']},
        ],
        'stay': [
            {'id': 'svc-stay-concierge', 'name': 'Stay Concierge', 'description': 'Find perfect pet-friendly accommodation', 'price': 499, 'duration': 'Booking', 'features': ['Search', 'Booking', 'Support']},
            {'id': 'svc-stay-premium', 'name': 'Premium Boarding Setup', 'description': 'Custom boarding arrangement', 'price': 999, 'duration': 'Setup', 'features': ['Facility Visit', 'Custom Menu', 'Webcam Access']},
        ],
        'travel': [
            {'id': 'svc-travel-planning', 'name': 'Travel Planning', 'description': 'Complete travel coordination', 'price': 1999, 'duration': 'Per Trip', 'features': ['Route Planning', 'Documentation', 'Carrier Booking']},
            {'id': 'svc-travel-relocation', 'name': 'Relocation Concierge', 'description': 'Full relocation support', 'price': 9999, 'duration': 'Per Move', 'features': ['Documentation', 'Transport', 'Quarantine Support']},
        ],
        'feed': [
            {'id': 'svc-feed-nutrition', 'name': 'Nutrition Consultation', 'description': 'Expert diet planning', 'price': 999, 'duration': '1 hour', 'features': ['Assessment', 'Diet Plan', 'Follow-up']},
            {'id': 'svc-feed-meal-plan', 'name': 'Custom Meal Planning', 'description': 'Personalized meal plans', 'price': 1499, 'duration': 'Monthly', 'features': ['Analysis', 'Recipes', 'Shopping List']},
        ],
        'care': [
            {'id': 'svc-care-premium', 'name': 'Premium Care Package', 'description': 'Comprehensive care service', 'price': 2999, 'duration': 'Monthly', 'features': ['Grooming', 'Walking', 'Sitting']},
            {'id': 'svc-care-emergency', 'name': 'Emergency Care Coordination', 'description': '24/7 emergency support', 'price': 499, 'duration': 'Per Incident', 'features': ['Vet Coordination', 'Transport', 'Support']},
        ],
        'fit': [
            {'id': 'svc-fit-assessment', 'name': 'Fitness Assessment', 'description': 'Complete fitness evaluation', 'price': 1500, 'duration': '90 min', 'features': ['Health Check', 'Fitness Plan', 'Goals']},
            {'id': 'svc-fit-program', 'name': 'Personal Training Program', 'description': '8-week fitness journey', 'price': 12000, 'duration': '8 weeks', 'features': ['Trainer', 'Sessions', 'Nutrition']},
        ],
        'learn': [
            {'id': 'svc-learn-puppy', 'name': 'Puppy Training Package', 'description': 'Foundation training', 'price': 8000, 'duration': '8 weeks', 'features': ['8 Sessions', 'Materials', 'Support']},
            {'id': 'svc-learn-behavior', 'name': 'Behavior Consultation', 'description': 'Address specific issues', 'price': 2500, 'duration': '2 hours', 'features': ['Assessment', 'Plan', 'Follow-up']},
        ],
        'enjoy': [
            {'id': 'svc-enjoy-adventure', 'name': 'Adventure Day Planning', 'description': 'Custom adventure experience', 'price': 1999, 'duration': 'Full Day', 'features': ['Planning', 'Transport', 'Guide']},
            {'id': 'svc-enjoy-playdate', 'name': 'Playdate Coordination', 'description': 'Group play sessions', 'price': 499, 'duration': '2 hours', 'features': ['Venue', 'Supervision', 'Snacks']},
        ],
        'groom': [
            {'id': 'svc-groom-spa', 'name': 'Spa Day Package', 'description': 'Full spa treatment', 'price': 3500, 'duration': '3 hours', 'features': ['Bath', 'Massage', 'Grooming', 'Nail Art']},
            {'id': 'svc-groom-mobile', 'name': 'Mobile Grooming', 'description': 'Grooming at your doorstep', 'price': 2000, 'duration': '2 hours', 'features': ['Home Visit', 'Full Grooming', 'Supplies']},
        ],
        'adopt': [
            {'id': 'svc-adopt-match', 'name': 'Pet Matching Service', 'description': 'Find your perfect pet', 'price': 999, 'duration': 'Process', 'features': ['Assessment', 'Matching', 'Introduction']},
            {'id': 'svc-adopt-support', 'name': 'New Pet Support', 'description': '30-day transition support', 'price': 2999, 'duration': '30 days', 'features': ['Training', 'Supplies', 'Vet Visit']},
        ],
        'farewell': [
            {'id': 'svc-farewell-memorial', 'name': 'Memorial Planning', 'description': 'Dignified farewell service', 'price': 4999, 'duration': 'Service', 'features': ['Planning', 'Ceremony', 'Keepsake']},
            {'id': 'svc-farewell-grief', 'name': 'Grief Support', 'description': 'Counseling and support', 'price': 1999, 'duration': '3 sessions', 'features': ['Counseling', 'Resources', 'Community']},
        ],
        'dine': [
            {'id': 'svc-dine-reservation', 'name': 'VIP Reservation Service', 'description': 'Premium restaurant booking', 'price': 499, 'duration': 'Booking', 'features': ['Search', 'Booking', 'Special Requests']},
            {'id': 'svc-dine-picnic', 'name': 'Gourmet Picnic Setup', 'description': 'Complete picnic arrangement', 'price': 2999, 'duration': 'Setup', 'features': ['Food', 'Setup', 'Cleanup']},
        ],
        'insure': [
            {'id': 'svc-insure-consult', 'name': 'Insurance Consultation', 'description': 'Find the right coverage', 'price': 0, 'duration': '30 min', 'features': ['Assessment', 'Comparison', 'Recommendation']},
            {'id': 'svc-insure-claims', 'name': 'Claims Assistance', 'description': 'Help with insurance claims', 'price': 499, 'duration': 'Per Claim', 'features': ['Documentation', 'Submission', 'Follow-up']},
        ],
        'shop': [
            {'id': 'svc-shop-styling', 'name': 'Pet Styling Consultation', 'description': 'Product recommendations', 'price': 299, 'duration': '30 min', 'features': ['Assessment', 'Recommendations', 'Samples']},
            {'id': 'svc-shop-subscription', 'name': 'Surprise Box Subscription', 'description': 'Monthly curated products', 'price': 1499, 'duration': 'Monthly', 'features': ['Products', 'Treats', 'Toys']},
        ],
    }

# ============================================
# MAIN SEEDING FUNCTION
# ============================================
async def universal_seed(db):
    """
    Universal seeding function that ensures all pillars have data.
    Call this on startup or via API endpoint.
    """
    results = {
        'products': {'created': 0, 'updated': 0},
        'services': {'created': 0, 'updated': 0},
        'unified': {'migrated': 0},
        'pricing': {'seeded': 0},
        'shipping': {'seeded': 0}
    }
    
    now = datetime.now(timezone.utc).isoformat()
    
    # ========== 1. SEED PRODUCTS ==========
    logger.info("Seeding products for all pillars...")
    pillar_products = get_pillar_products()
    
    for pillar, products in pillar_products.items():
        for product in products:
            product['pillar'] = pillar
            product['created_at'] = product.get('created_at', now)
            product['in_stock'] = True
            product['tags'] = product.get('tags', [pillar.capitalize()])
            product['image'] = product.get('image', f'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800')
            
            result = await db.products.update_one(
                {'id': product['id']},
                {'$set': product},
                upsert=True
            )
            if result.upserted_id:
                results['products']['created'] += 1
            elif result.modified_count:
                results['products']['updated'] += 1
    
    # ========== 2. SEED SERVICES ==========
    logger.info("Seeding services for all pillars...")
    pillar_services = get_pillar_services()
    
    for pillar, services in pillar_services.items():
        for service in services:
            service['pillar'] = pillar
            service['is_active'] = True
            service['created_at'] = service.get('created_at', now)
            service['image'] = service.get('image', f'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800')
            
            result = await db.services.update_one(
                {'id': service['id']},
                {'$set': service},
                upsert=True
            )
            if result.upserted_id:
                results['services']['created'] += 1
            elif result.modified_count:
                results['services']['updated'] += 1
    
    # ========== 3. MIGRATE TO UNIFIED PRODUCTS ==========
    logger.info("Migrating products to unified_products...")
    products = await db.products.find({}).to_list(length=5000)
    
    for product in products:
        unified = {
            'product_id': str(product.get('_id', product.get('id'))),
            'name': product.get('name') or product.get('title'),
            'description': product.get('description', ''),
            'base_price': product.get('price', 0),
            'primary_pillar': product.get('pillar', 'shop'),
            'secondary_pillars': [],
            'category': product.get('category', 'general'),
            'product_type': product.get('product_type', 'physical'),
            'dietary_flags': product.get('dietary_flags', []),
            'image_url': product.get('image') or product.get('images', [None])[0] if isinstance(product.get('images'), list) else product.get('image'),
            'tags': product.get('tags', []),
            'is_active': product.get('in_stock', True),
            'created_at': now
        }
        
        await db.unified_products.update_one(
            {'product_id': unified['product_id']},
            {'$set': unified},
            upsert=True
        )
        results['unified']['migrated'] += 1
    
    # ========== 4. SEED PRICING TIERS ==========
    logger.info("Seeding pricing tiers...")
    pricing_tiers = [
        {'id': 'tier-basic', 'name': 'Basic', 'discount_percent': 0, 'min_order': 0, 'pillars': ALL_PILLARS},
        {'id': 'tier-member', 'name': 'Member', 'discount_percent': 5, 'min_order': 500, 'pillars': ALL_PILLARS},
        {'id': 'tier-premium', 'name': 'Premium', 'discount_percent': 10, 'min_order': 2000, 'pillars': ALL_PILLARS},
        {'id': 'tier-vip', 'name': 'VIP', 'discount_percent': 15, 'min_order': 5000, 'pillars': ALL_PILLARS},
    ]
    
    for tier in pricing_tiers:
        await db.pricing_tiers.update_one({'id': tier['id']}, {'$set': tier}, upsert=True)
        results['pricing']['seeded'] += 1
    
    # ========== 5. SEED SHIPPING RULES ==========
    logger.info("Seeding shipping rules...")
    shipping_rules = [
        {'id': 'ship-standard', 'name': 'Standard Delivery', 'base_cost': 99, 'free_above': 999, 'days': '3-5', 'pillars': ALL_PILLARS},
        {'id': 'ship-express', 'name': 'Express Delivery', 'base_cost': 199, 'free_above': 2999, 'days': '1-2', 'pillars': ALL_PILLARS},
        {'id': 'ship-same-day', 'name': 'Same Day Delivery', 'base_cost': 299, 'free_above': 4999, 'days': 'Same Day', 'pillars': ['celebrate', 'feed', 'shop']},
        {'id': 'ship-service', 'name': 'Service Booking', 'base_cost': 0, 'free_above': 0, 'days': 'N/A', 'pillars': ['stay', 'travel', 'care', 'fit', 'learn', 'enjoy', 'groom', 'farewell']},
        {'id': 'ship-digital', 'name': 'Digital Delivery', 'base_cost': 0, 'free_above': 0, 'days': 'Instant', 'pillars': ['insure']},
    ]
    
    for rule in shipping_rules:
        await db.shipping_rules.update_one({'id': rule['id']}, {'$set': rule}, upsert=True)
        results['shipping']['seeded'] += 1
    
    # ========== 6. SYNC STAY PROPERTIES ==========
    logger.info("Syncing stay_properties to products...")
    stay_synced = 0
    properties = await db.stay_properties.find({}).to_list(length=500)
    
    for prop in properties:
        product_id = f"stay-{str(prop.get('_id'))}"
        product = {
            'id': product_id,
            'name': prop.get('name', 'Pet-Friendly Stay'),
            'description': prop.get('description', ''),
            'price': prop.get('price_per_night', 5000),
            'pillar': 'stay',
            'category': 'hotel',
            'tags': ['Stay', prop.get('city', ''), prop.get('property_type', '')],
            'image': prop.get('images', [None])[0] if isinstance(prop.get('images'), list) else prop.get('image'),
            'in_stock': True,
            'source': 'stay_properties'
        }
        await db.products.update_one({'id': product_id}, {'$set': product}, upsert=True)
        stay_synced += 1
    
    results['stay_synced'] = stay_synced
    
    # ========== 7. SEED BOARDING FACILITIES ==========
    logger.info("Seeding boarding facilities...")
    boarding_facilities = [
        {
            'id': 'board-bangalore-1',
            'name': 'Happy Tails Boarding',
            'city': 'Bangalore',
            'state': 'Karnataka',
            'boarding_type': 'Home-style',
            'description': 'Loving home environment for your pet while you\'re away. 24/7 supervision and care.',
            'price_range': '₹800-1,200/night',
            'paw_score': 4.8,
            'phone': '+91-9876543210',
            'amenities': ['AC Rooms', 'Garden', 'CCTV', 'Daily Updates'],
            'image': 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800'
        },
        {
            'id': 'board-bangalore-2',
            'name': 'Pawsome Pet Resort',
            'city': 'Bangalore',
            'state': 'Karnataka',
            'boarding_type': 'Premium',
            'description': 'Premium boarding with grooming, training, and swimming pool access.',
            'price_range': '₹1,500-2,500/night',
            'paw_score': 4.9,
            'phone': '+91-9876543211',
            'amenities': ['Swimming Pool', 'Grooming', 'Training', 'Vet on Call'],
            'image': 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800'
        },
        {
            'id': 'board-mumbai-1',
            'name': 'Canine Castle Mumbai',
            'city': 'Mumbai',
            'state': 'Maharashtra',
            'boarding_type': 'Luxury',
            'description': 'Five-star luxury boarding experience with individual suites and spa services.',
            'price_range': '₹2,500-4,000/night',
            'paw_score': 5.0,
            'phone': '+91-9876543212',
            'amenities': ['Private Suites', 'Spa', 'Gourmet Meals', 'Live Webcam'],
            'image': 'https://images.unsplash.com/photo-1601758125946-6ec2ef64daf8?w=800'
        },
        {
            'id': 'board-delhi-1',
            'name': 'Paws & Play Delhi',
            'city': 'Delhi',
            'state': 'Delhi',
            'boarding_type': 'Home-style',
            'description': 'Cozy home boarding with experienced pet parents. Perfect for anxious pets.',
            'price_range': '₹700-1,000/night',
            'paw_score': 4.7,
            'phone': '+91-9876543213',
            'amenities': ['Home Environment', 'One-on-One Care', 'Daily Walks'],
            'image': 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800'
        },
        {
            'id': 'board-gurgaon-1',
            'name': 'The Dog Lodge Gurgaon',
            'city': 'Gurgaon',
            'state': 'Haryana',
            'boarding_type': 'Premium',
            'description': 'Modern facility with climate-controlled rooms and play areas.',
            'price_range': '₹1,200-1,800/night',
            'paw_score': 4.6,
            'phone': '+91-9876543214',
            'amenities': ['AC Rooms', 'Play Area', 'Webcam Access', 'Pickup Available'],
            'image': 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800'
        },
        {
            'id': 'board-pune-1',
            'name': 'Furry Friends Pune',
            'city': 'Pune',
            'state': 'Maharashtra',
            'boarding_type': 'Home-style',
            'description': 'Family-run boarding with lots of love and attention for each pet.',
            'price_range': '₹600-900/night',
            'paw_score': 4.5,
            'phone': '+91-9876543215',
            'amenities': ['Garden', 'Home Cooked Meals', 'Daily Updates'],
            'image': 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800'
        },
        {
            'id': 'board-hyderabad-1',
            'name': 'Wagging Tails Hyderabad',
            'city': 'Hyderabad',
            'state': 'Telangana',
            'boarding_type': 'Premium',
            'description': 'Spacious facility with indoor and outdoor play areas.',
            'price_range': '₹1,000-1,500/night',
            'paw_score': 4.7,
            'phone': '+91-9876543216',
            'amenities': ['Large Play Area', 'Training', 'Grooming', 'Vet Visits'],
            'image': 'https://images.unsplash.com/photo-1601758125946-6ec2ef64daf8?w=800'
        },
        {
            'id': 'board-chennai-1',
            'name': 'Pet Paradise Chennai',
            'city': 'Chennai',
            'state': 'Tamil Nadu',
            'boarding_type': 'Private',
            'description': 'Private boarding in a peaceful farm setting. Ideal for dogs who need space.',
            'price_range': '₹1,500-2,000/night',
            'paw_score': 4.8,
            'phone': '+91-9876543217',
            'amenities': ['Farm Setting', 'Swimming', 'Large Grounds', 'Individual Care'],
            'image': 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800'
        }
    ]
    
    boarding_seeded = 0
    for facility in boarding_facilities:
        facility['created_at'] = now
        result = await db.stay_boarding_facilities.update_one(
            {'id': facility['id']},
            {'$set': facility},
            upsert=True
        )
        if result.upserted_id or result.modified_count:
            boarding_seeded += 1
    
    results['boarding_seeded'] = boarding_seeded
    
    logger.info(f"Universal seed complete: {results}")
    return results


# ============================================
# RUN STANDALONE
# ============================================
if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()
    
    async def main():
        client = AsyncIOMotorClient(os.environ.get('MONGO_URL'))
        db = client[os.environ.get('DB_NAME', 'doggy_company')]
        
        results = await universal_seed(db)
        print("\n" + "=" * 60)
        print("UNIVERSAL SEED COMPLETE")
        print("=" * 60)
        print(f"Products: Created {results['products']['created']}, Updated {results['products']['updated']}")
        print(f"Services: Created {results['services']['created']}, Updated {results['services']['updated']}")
        print(f"Unified Products: Migrated {results['unified']['migrated']}")
        print(f"Pricing Tiers: {results['pricing']['seeded']}")
        print(f"Shipping Rules: {results['shipping']['seeded']}")
        print(f"Stay Properties Synced: {results.get('stay_synced', 0)}")
        
        client.close()
    
    asyncio.run(main())

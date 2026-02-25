"""
Care Products Seeder - 10 Broad-Breed Friendly Products
========================================================
Products mapped by size, coat type, and life stage (not exact breeds).
All copy is support/comfort/coordination-led (no medical claims).
"""

CARE_PRODUCTS_V2 = [
    # 1. Gentle Grooming Brush Kit
    {
        "id": "care-grooming-brush-kit",
        "name": "Gentle Grooming Brush Kit",
        "description": "Everyday brushing kit for coat comfort and low-stress grooming at home. Includes pin brush, slicker brush, and detangling comb.",
        "price": 1299,
        "compare_price": 1799,
        "image": "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=600&h=600&fit=crop&q=80",
        "category": "care",
        "care_type": "grooming",
        "subcategory": "brush_kit",
        "tags": ["grooming", "brush", "coat care", "deshedding", "all-size essentials"],
        "pet_sizes": ["small", "medium", "large"],
        "coat_types": ["long-coat", "double-coat", "short-coat"],
        "life_stages": ["puppy", "adult", "senior"],
        "good_for": ["Small Breed", "Medium Breed", "Large Breed", "Long Coat", "Double Coat", "Shedding-prone pets"],
        "mira_note": "Mira can help choose the right brush type for your pet's coat.",
        "in_stock": True,
        "paw_reward_points": 13,
        "is_birthday_perk": False
    },
    
    # 2. Bath & Coat Care Kit
    {
        "id": "care-bath-coat-kit",
        "name": "Bath & Coat Care Kit",
        "description": "Bath-time essentials for regular hygiene and coat upkeep. Includes shampoo, conditioner, and microfiber towel.",
        "price": 1499,
        "compare_price": 1999,
        "image": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&h=600&fit=crop&q=80",
        "category": "care",
        "care_type": "grooming",
        "subcategory": "bath_kit",
        "tags": ["grooming", "bath", "shampoo", "coat care", "all-size essentials"],
        "pet_sizes": ["small", "medium", "large"],
        "coat_types": ["long-coat", "short-coat", "curly-coat"],
        "life_stages": ["puppy", "adult", "senior"],
        "good_for": ["All Sizes", "Short Coat", "Long Coat", "Sensitive Skin"],
        "mira_note": "Ask Mira to add this to a grooming request.",
        "in_stock": True,
        "paw_reward_points": 15,
        "is_birthday_perk": True,
        "birthday_discount_percent": 15
    },
    
    # 3. Paw Care Kit
    {
        "id": "care-paw-kit",
        "name": "Paw Care Kit",
        "description": "Paw cleaning and comfort support for daily outings. Includes paw balm, cleaning wipes, and nail file.",
        "price": 899,
        "compare_price": 1299,
        "image": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=600&fit=crop&q=80",
        "category": "care",
        "care_type": "grooming",
        "subcategory": "paw_care",
        "tags": ["paw care", "grooming", "walks", "comfort", "all-size essentials"],
        "pet_sizes": ["small", "medium", "large"],
        "coat_types": ["all"],
        "life_stages": ["puppy", "adult", "senior"],
        "good_for": ["All Sizes", "City Walkers", "Large Breed", "Senior"],
        "mira_note": "Useful for pets with frequent walks or outdoor play.",
        "in_stock": True,
        "paw_reward_points": 9,
        "is_birthday_perk": False
    },
    
    # 4. Ear & Eye Cleaning Essentials
    {
        "id": "care-ear-eye-kit",
        "name": "Ear & Eye Cleaning Essentials",
        "description": "Routine hygiene support for ears and eye area. Includes gentle ear cleaner, eye wipes, and applicators.",
        "price": 799,
        "compare_price": 1099,
        "image": "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=600&h=600&fit=crop&q=80",
        "category": "care",
        "care_type": "grooming",
        "subcategory": "ear_eye_care",
        "tags": ["ear care", "eye care", "grooming", "hygiene", "all-size essentials"],
        "pet_sizes": ["small", "medium", "large"],
        "coat_types": ["long-coat", "flat-faced"],
        "life_stages": ["puppy", "adult", "senior"],
        "good_for": ["Long-Eared Breeds", "Flat-Faced Breeds", "Long Coat", "All Sizes"],
        "mira_note": "Mira can guide what's suitable for your pet's grooming routine.",
        "in_stock": True,
        "paw_reward_points": 8,
        "is_birthday_perk": False
    },
    
    # 5. Dental Care Starter Kit
    {
        "id": "care-dental-starter-kit",
        "name": "Dental Care Starter Kit",
        "description": "Home dental hygiene essentials for routine care. Includes finger brush, toothpaste, and dental chews sampler.",
        "price": 699,
        "compare_price": 999,
        "image": "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=600&h=600&fit=crop&q=80",
        "category": "care",
        "care_type": "grooming",
        "subcategory": "dental_care",
        "tags": ["dental care", "grooming", "hygiene", "health support"],
        "pet_sizes": ["small", "medium", "large"],
        "coat_types": ["all"],
        "life_stages": ["puppy", "adult", "senior"],
        "good_for": ["Small Breed", "Medium Breed", "Large Breed", "Puppy", "Senior"],
        "mira_note": "Ask Mira to add a dental routine setup to your care request.",
        "in_stock": True,
        "paw_reward_points": 7,
        "is_birthday_perk": False
    },
    
    # 6. Preventive Care Routine Kit
    {
        "id": "care-preventive-routine-kit",
        "name": "Preventive Care Routine Kit",
        "description": "At-home preventive care support tools and routine checklist. Includes tick comb, coat check tools, and care tracker.",
        "price": 1199,
        "compare_price": 1599,
        "image": "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600&h=600&fit=crop&q=80",
        "category": "care",
        "care_type": "vet_clinic_booking",
        "subcategory": "preventive_care",
        "tags": ["preventive care", "health support", "routine", "all-size essentials"],
        "pet_sizes": ["small", "medium", "large"],
        "coat_types": ["long-coat", "double-coat", "short-coat"],
        "life_stages": ["puppy", "adult", "senior"],
        "good_for": ["All Sizes", "Outdoor-Active Pets", "Long Coat", "Double Coat"],
        "mira_note": "Mira can coordinate preventive appointments separately.",
        "in_stock": True,
        "paw_reward_points": 12,
        "is_birthday_perk": False
    },
    
    # 7. Recovery Comfort Kit
    {
        "id": "care-recovery-comfort-kit",
        "name": "Recovery Comfort Kit",
        "description": "Comfort-first support bundle for post-procedure or rest periods. Includes soft bedding pad, calming spray, and gentle care tools.",
        "price": 1799,
        "compare_price": 2499,
        "image": "https://images.unsplash.com/photo-1610661152225-10b323d1b855?w=600&h=600&fit=crop&q=80",
        "category": "care",
        "care_type": "senior_special_needs_support",
        "subcategory": "recovery_support",
        "tags": ["recovery support", "comfort", "post-procedure", "special needs"],
        "pet_sizes": ["small", "medium", "large"],
        "coat_types": ["all"],
        "life_stages": ["adult", "senior"],
        "good_for": ["All Sizes", "Senior", "Recovery Support", "Special Needs"],
        "mira_note": "Mira can help coordinate follow-up appointments and recovery support.",
        "in_stock": True,
        "paw_reward_points": 18,
        "is_birthday_perk": False
    },
    
    # 8. Medication Support Kit
    {
        "id": "care-medication-support-kit",
        "name": "Medication Support Kit",
        "description": "Tools for organizing care routines and follow-through at home. Includes pill organizer, schedule tracker, and treat dispensers.",
        "price": 599,
        "compare_price": 849,
        "image": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&h=600&fit=crop&q=80",
        "category": "care",
        "care_type": "senior_special_needs_support",
        "subcategory": "medication_support",
        "tags": ["medication support", "organization", "care routine", "special needs"],
        "pet_sizes": ["small", "medium", "large"],
        "coat_types": ["all"],
        "life_stages": ["adult", "senior"],
        "good_for": ["Senior", "Multi-Pet Homes", "Recovery Support", "Special Needs"],
        "mira_note": "No medical advice — this supports organization and follow-through.",
        "in_stock": True,
        "paw_reward_points": 6,
        "is_birthday_perk": False
    },
    
    # 9. Senior Comfort Support Kit
    {
        "id": "care-senior-comfort-kit",
        "name": "Senior Comfort Support Kit",
        "description": "Everyday comfort aids for older pets and special handling routines. Includes orthopedic mat, joint support wrap, and grooming tools for sensitive skin.",
        "price": 2199,
        "compare_price": 2999,
        "image": "https://images.unsplash.com/photo-1619590694371-7eed5838e880?w=600&h=600&fit=crop&q=80",
        "category": "care",
        "care_type": "senior_special_needs_support",
        "subcategory": "senior_support",
        "tags": ["senior-friendly", "comfort", "mobility support", "special needs"],
        "pet_sizes": ["small", "medium", "large"],
        "coat_types": ["all"],
        "life_stages": ["senior"],
        "good_for": ["Senior Small Breed", "Senior Medium Breed", "Senior Large Breed", "Mobility-Sensitive"],
        "mira_note": "Mira can help pair this with senior support services.",
        "in_stock": True,
        "paw_reward_points": 22,
        "is_birthday_perk": True,
        "birthday_discount_percent": 20
    },
    
    # 10. Clinic Visit Calm Kit
    {
        "id": "care-clinic-calm-kit",
        "name": "Clinic Visit Calm Kit",
        "description": "A prep-and-comfort bundle for smoother clinic visits and transitions. Includes calming treats, carrier liner, and comfort toy.",
        "price": 999,
        "compare_price": 1399,
        "image": "https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?w=600&h=600&fit=crop&q=80",
        "category": "care",
        "care_type": "behavior_anxiety_support",
        "subcategory": "clinic_visit_support",
        "tags": ["clinic-visit support", "anxiety-prone", "comfort", "travel prep"],
        "pet_sizes": ["small", "medium", "large"],
        "coat_types": ["all"],
        "life_stages": ["puppy", "adult", "senior"],
        "good_for": ["Anxiety-Prone", "Puppy", "Small Breed", "Senior"],
        "mira_note": "Ask Mira to include this with a vet booking request.",
        "in_stock": True,
        "paw_reward_points": 10,
        "is_birthday_perk": False
    }
]

# Care Bundles (Essentials Bundles)
CARE_BUNDLES_V2 = [
    {
        "id": "bundle-grooming-essentials",
        "name": "Complete Grooming Essentials Bundle",
        "description": "Everything you need for at-home grooming. Includes brush kit, bath kit, and paw care kit.",
        "price": 2999,
        "original_price": 3697,
        "image": "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=600&h=600&fit=crop&q=80",
        "care_type": "grooming",
        "items": ["Gentle Grooming Brush Kit", "Bath & Coat Care Kit", "Paw Care Kit"],
        "product_ids": ["care-grooming-brush-kit", "care-bath-coat-kit", "care-paw-kit"],
        "savings_percent": 19,
        "is_recommended": True,
        "good_for": ["All Sizes", "Long Coat", "Double Coat"],
        "paw_reward_points": 30
    },
    {
        "id": "bundle-senior-care-complete",
        "name": "Senior Care Complete Bundle",
        "description": "Comprehensive comfort bundle for senior pets. Includes senior comfort kit, recovery kit, and medication support.",
        "price": 3999,
        "original_price": 4597,
        "image": "https://images.unsplash.com/photo-1619590694371-7eed5838e880?w=600&h=600&fit=crop&q=80",
        "care_type": "senior_special_needs_support",
        "items": ["Senior Comfort Support Kit", "Recovery Comfort Kit", "Medication Support Kit"],
        "product_ids": ["care-senior-comfort-kit", "care-recovery-comfort-kit", "care-medication-support-kit"],
        "savings_percent": 13,
        "is_recommended": True,
        "good_for": ["Senior", "Special Needs", "Recovery Support"],
        "paw_reward_points": 40
    },
    {
        "id": "bundle-new-pet-parent",
        "name": "New Pet Parent Starter Bundle",
        "description": "Essential care products for new pet parents. Perfect for puppies and first-time owners.",
        "price": 2499,
        "original_price": 2997,
        "image": "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=600&h=600&fit=crop&q=80",
        "care_type": "grooming",
        "items": ["Gentle Grooming Brush Kit", "Dental Care Starter Kit", "Clinic Visit Calm Kit"],
        "product_ids": ["care-grooming-brush-kit", "care-dental-starter-kit", "care-clinic-calm-kit"],
        "savings_percent": 17,
        "is_recommended": True,
        "good_for": ["Puppy", "First-Time Owner", "All Sizes"],
        "paw_reward_points": 25
    }
]

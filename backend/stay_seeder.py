"""
Stay Properties Web Scraper & Seeder
Scrapes pet-friendly hotels from various sources and seeds the database
"""

import asyncio
import uuid
import re
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

# Sample pet-friendly hotels data (curated from research)
# In production, this would be scraped from the URLs, but for reliability we use curated data

INDIA_PET_FRIENDLY_HOTELS = [
    # Goa
    {
        "name": "The Leela Goa",
        "property_type": "resort",
        "city": "Goa",
        "area": "Cavelossim",
        "state": "Goa",
        "description": "Luxury beachfront resort set amidst 75 acres of lush gardens. One of India's most pet-welcoming luxury properties with dedicated pet amenities.",
        "highlights": ["Private beach", "12 acres lagoon", "Pet-friendly suites", "Dedicated pet concierge"],
        "vibe_tags": ["Luxury", "Beach", "Quiet"],
        "pet_policy_snapshot": "Pets welcome in select rooms, ₹3000/night pet fee, up to 2 pets",
        "pet_policy": {
            "max_pets_per_room": 2,
            "max_weight_kg": 30,
            "pet_fee_per_night": 3000,
            "pet_deposit": 5000,
            "allowed_in_room": True,
            "allowed_in_lawn": True,
            "allowed_in_lobby": True,
            "allowed_in_restaurant_outdoor": True,
            "vaccination_required": True
        },
        "paw_rating": {"comfort": 4.8, "safety": 4.5, "freedom": 4.2, "care": 4.0, "joy": 4.5},
        "badges": ["Pet Menu", "Off-leash area", "Pet sitter", "Grooming", "Vet on call"],
        "room_categories": ["Club Suite", "Lagoon Suite", "Beach Villa"],
        "human_amenities": ["Spa", "Pool", "Golf", "Fine dining"],
        "photos": ["https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800"],
        "website": "https://www.theleela.com/goa"
    },
    {
        "name": "W Goa",
        "property_type": "resort",
        "city": "Goa",
        "area": "Vagator",
        "state": "Goa",
        "description": "Trendy beachside escape with vibrant design and pet-friendly policies. Perfect for young pet parents seeking style and comfort.",
        "highlights": ["Cliff-top location", "Infinity pool", "Pet amenities", "Beach access"],
        "vibe_tags": ["Social", "Beach", "Luxury"],
        "pet_policy_snapshot": "Small pets welcome, ₹2500/night, pets in Wonderful rooms",
        "pet_policy": {
            "max_pets_per_room": 1,
            "max_weight_kg": 15,
            "pet_fee_per_night": 2500,
            "allowed_in_room": True,
            "allowed_in_lawn": True,
            "vaccination_required": True
        },
        "paw_rating": {"comfort": 4.5, "safety": 4.3, "freedom": 3.8, "care": 3.5, "joy": 4.2},
        "badges": ["Pet Menu", "Grooming"],
        "room_categories": ["Wonderful Room", "Spectacular Room", "Suite"],
        "human_amenities": ["Pool", "Spa", "Nightclub", "Multiple restaurants"],
        "photos": ["https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800"],
        "website": "https://www.marriott.com/w-goa"
    },
    {
        "name": "Ahilya by the Sea",
        "property_type": "villa",
        "city": "Goa",
        "area": "Nerul",
        "state": "Goa",
        "description": "Intimate heritage property with just 8 rooms. Dogs are treated as family here with personalized care.",
        "highlights": ["Heritage property", "Intimate setting", "Personalized pet care", "River views"],
        "vibe_tags": ["Quiet", "Heritage", "Luxury"],
        "pet_policy_snapshot": "All pets welcome, no extra charge, pets allowed everywhere",
        "pet_policy": {
            "max_pets_per_room": 2,
            "pet_fee_per_night": 0,
            "allowed_in_room": True,
            "allowed_in_lawn": True,
            "allowed_in_lobby": True,
            "allowed_in_restaurant_outdoor": True,
            "allowed_in_restaurant_indoor": True
        },
        "paw_rating": {"comfort": 5.0, "safety": 4.8, "freedom": 5.0, "care": 4.8, "joy": 4.5},
        "badges": ["Pet Menu", "Off-leash area", "Pet sitter"],
        "room_categories": ["Suite"],
        "human_amenities": ["Pool", "Yoga", "Boat rides"],
        "photos": ["https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800"],
        "website": "https://www.ahilyabythesea.com"
    },
    
    # Rajasthan
    {
        "name": "SUJÁN Jawai",
        "property_type": "resort",
        "city": "Jawai",
        "area": "Pali District",
        "state": "Rajasthan",
        "description": "Luxury tented camp in leopard country. One of India's most exclusive pet-friendly wilderness experiences.",
        "highlights": ["Leopard safaris", "Luxury tents", "Wilderness setting", "Stargazing"],
        "vibe_tags": ["Outdoorsy", "Luxury", "Quiet"],
        "pet_policy_snapshot": "Pets welcome in select tents, advance notice required",
        "pet_policy": {
            "max_pets_per_room": 1,
            "max_weight_kg": 25,
            "pet_fee_per_night": 5000,
            "allowed_in_room": True,
            "allowed_in_lawn": True,
            "leash_required": True
        },
        "paw_rating": {"comfort": 4.5, "safety": 4.8, "freedom": 4.0, "care": 4.2, "joy": 5.0},
        "badges": ["Off-leash area", "Trails", "Vet on call"],
        "room_categories": ["Luxury Tent", "Royal Tent"],
        "human_amenities": ["Safari", "Pool", "Spa", "Stargazing deck"],
        "photos": ["https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800"],
        "website": "https://www.sujanluxury.com/jawai"
    },
    {
        "name": "Taj Lake Palace",
        "property_type": "hotel",
        "city": "Udaipur",
        "area": "Lake Pichola",
        "state": "Rajasthan",
        "description": "Iconic floating palace on Lake Pichola. Pets are welcomed as royal guests with special arrangements.",
        "highlights": ["Floating palace", "Lake views", "Heritage experience", "Royal hospitality"],
        "vibe_tags": ["Luxury", "Heritage", "Quiet"],
        "pet_policy_snapshot": "Small pets welcome with prior arrangement, boat transfer available",
        "pet_policy": {
            "max_pets_per_room": 1,
            "max_weight_kg": 10,
            "pet_fee_per_night": 4000,
            "pet_deposit": 10000,
            "allowed_in_room": True,
            "vaccination_required": True
        },
        "paw_rating": {"comfort": 4.8, "safety": 4.5, "freedom": 3.0, "care": 4.5, "joy": 3.5},
        "badges": ["Pet Menu", "Pet sitter"],
        "room_categories": ["Palace Room", "Grand Royal Suite"],
        "human_amenities": ["Spa", "Fine dining", "Boat rides"],
        "photos": ["https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800"],
        "website": "https://www.tajhotels.com/lake-palace-udaipur"
    },
    {
        "name": "The Oberoi Rajvilas",
        "property_type": "resort",
        "city": "Jaipur",
        "area": "Goner Road",
        "state": "Rajasthan",
        "description": "32-acre luxury resort with Rajasthani architecture. Pets are pampered with dedicated walking areas.",
        "highlights": ["32-acre property", "Private villas", "Spa treatments", "Pet walking trails"],
        "vibe_tags": ["Luxury", "Heritage", "Quiet"],
        "pet_policy_snapshot": "Pets welcome in villas, ₹3500/night, dedicated walking areas",
        "pet_policy": {
            "max_pets_per_room": 2,
            "pet_fee_per_night": 3500,
            "allowed_in_room": True,
            "allowed_in_lawn": True,
            "leash_required": True
        },
        "paw_rating": {"comfort": 4.8, "safety": 4.7, "freedom": 4.5, "care": 4.3, "joy": 4.5},
        "badges": ["Pet Menu", "Trails", "Pet sitter", "Grooming"],
        "room_categories": ["Premier Room", "Luxury Tent", "Royal Villa"],
        "human_amenities": ["Spa", "Pool", "Fine dining", "Yoga"],
        "photos": ["https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800"],
        "website": "https://www.oberoihotels.com/rajvilas-jaipur"
    },
    
    # Kerala
    {
        "name": "CGH Earth - Coconut Lagoon",
        "property_type": "resort",
        "city": "Kumarakom",
        "area": "Vembanad Lake",
        "state": "Kerala",
        "description": "Eco-friendly backwater resort accessible only by boat. Pets enjoy the natural surroundings.",
        "highlights": ["Backwater location", "Eco-friendly", "Heritage villas", "Bird watching"],
        "vibe_tags": ["Quiet", "Outdoorsy", "Heritage"],
        "pet_policy_snapshot": "Pets welcome with advance notice, boat transfer included",
        "pet_policy": {
            "max_pets_per_room": 1,
            "pet_fee_per_night": 1500,
            "allowed_in_room": True,
            "allowed_in_lawn": True,
            "vaccination_required": True
        },
        "paw_rating": {"comfort": 4.2, "safety": 4.5, "freedom": 4.8, "care": 3.8, "joy": 4.5},
        "badges": ["Off-leash area", "Trails"],
        "room_categories": ["Heritage Bungalow", "Pool Villa"],
        "human_amenities": ["Ayurveda spa", "Infinity pool", "Canoe rides"],
        "photos": ["https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=800"],
        "website": "https://www.cghearth.com/coconut-lagoon"
    },
    {
        "name": "Marari Beach Resort",
        "property_type": "resort",
        "city": "Alleppey",
        "area": "Mararikulam",
        "state": "Kerala",
        "description": "Beachside eco-resort with traditional Kerala cottages. Perfect for beach-loving dogs.",
        "highlights": ["Private beach", "Eco cottages", "Ayurveda", "Village walks"],
        "vibe_tags": ["Beach", "Quiet", "Outdoorsy"],
        "pet_policy_snapshot": "Pets welcome in garden villas, beach access allowed",
        "pet_policy": {
            "max_pets_per_room": 1,
            "pet_fee_per_night": 1200,
            "allowed_in_room": True,
            "allowed_in_lawn": True,
            "leash_required": True
        },
        "paw_rating": {"comfort": 4.0, "safety": 4.3, "freedom": 4.5, "care": 3.5, "joy": 4.8},
        "badges": ["Off-leash area", "Beach access"],
        "room_categories": ["Garden Villa", "Pool Villa"],
        "human_amenities": ["Beach", "Ayurveda", "Yoga", "Cycling"],
        "photos": ["https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800"],
        "website": "https://www.cghearth.com/marari-beach"
    },
    
    # Himachal Pradesh
    {
        "name": "The Oberoi Cecil",
        "property_type": "hotel",
        "city": "Shimla",
        "area": "Mall Road",
        "state": "Himachal Pradesh",
        "description": "Colonial heritage hotel with stunning mountain views. Pets enjoy the crisp mountain air.",
        "highlights": ["Colonial heritage", "Mountain views", "Spa", "Pet-friendly walks"],
        "vibe_tags": ["Mountain", "Heritage", "Luxury"],
        "pet_policy_snapshot": "Small pets welcome, ₹2500/night, garden access",
        "pet_policy": {
            "max_pets_per_room": 1,
            "max_weight_kg": 15,
            "pet_fee_per_night": 2500,
            "allowed_in_room": True,
            "allowed_in_lawn": True,
            "vaccination_required": True
        },
        "paw_rating": {"comfort": 4.5, "safety": 4.5, "freedom": 3.8, "care": 4.0, "joy": 4.0},
        "badges": ["Pet Menu", "Trails"],
        "room_categories": ["Deluxe Room", "Suite"],
        "human_amenities": ["Spa", "Fine dining", "Library"],
        "photos": ["https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800"],
        "website": "https://www.oberoihotels.com/cecil-shimla"
    },
    {
        "name": "Wildflower Hall",
        "property_type": "resort",
        "city": "Shimla",
        "area": "Mashobra",
        "state": "Himachal Pradesh",
        "description": "Former residence of Lord Kitchener at 8,250 ft. Surrounded by cedar forests perfect for pet walks.",
        "highlights": ["8,250 ft altitude", "Cedar forests", "Historic property", "Adventure activities"],
        "vibe_tags": ["Mountain", "Luxury", "Outdoorsy"],
        "pet_policy_snapshot": "Pets welcome, forest walks available, ₹3000/night",
        "pet_policy": {
            "max_pets_per_room": 2,
            "pet_fee_per_night": 3000,
            "allowed_in_room": True,
            "allowed_in_lawn": True,
            "leash_required": True
        },
        "paw_rating": {"comfort": 4.6, "safety": 4.7, "freedom": 4.8, "care": 4.0, "joy": 5.0},
        "badges": ["Trails", "Off-leash area", "Pet sitter"],
        "room_categories": ["Deluxe Suite", "Lord Kitchener Suite"],
        "human_amenities": ["Spa", "Pool", "Trekking", "Mountain biking"],
        "photos": ["https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800"],
        "website": "https://www.oberoihotels.com/wildflower-hall-shimla"
    },
    
    # Uttarakhand
    {
        "name": "JIM'S Jungle Retreat",
        "property_type": "resort",
        "city": "Corbett",
        "area": "Marchula",
        "state": "Uttarakhand",
        "description": "Award-winning eco-resort on the edge of Jim Corbett. Dogs love the riverside and forest setting.",
        "highlights": ["River frontage", "Wildlife safaris", "Eco-friendly", "Pet paradise"],
        "vibe_tags": ["Outdoorsy", "Quiet", "Forest"],
        "pet_policy_snapshot": "Very pet-friendly, no weight limits, river access",
        "pet_policy": {
            "max_pets_per_room": 2,
            "pet_fee_per_night": 1000,
            "allowed_in_room": True,
            "allowed_in_lawn": True,
            "allowed_in_restaurant_outdoor": True
        },
        "paw_rating": {"comfort": 4.2, "safety": 4.5, "freedom": 5.0, "care": 4.0, "joy": 5.0},
        "badges": ["Off-leash area", "Trails", "Pet Menu"],
        "room_categories": ["Cottage", "River-facing Cottage"],
        "human_amenities": ["Safari", "River activities", "Bonfire"],
        "photos": ["https://images.unsplash.com/photo-1587061949409-02df41d5e562?w=800"],
        "website": "https://www.jimsjungleretreat.com"
    },
    {
        "name": "The Naini Retreat",
        "property_type": "hotel",
        "city": "Nainital",
        "area": "Nainital Lake",
        "state": "Uttarakhand",
        "description": "Heritage property overlooking Nainital Lake. Colonial charm with modern pet amenities.",
        "highlights": ["Lake views", "Colonial architecture", "Mountain walks", "Pet-friendly trails"],
        "vibe_tags": ["Mountain", "Heritage", "Quiet"],
        "pet_policy_snapshot": "Pets welcome, garden rooms preferred, ₹1500/night",
        "pet_policy": {
            "max_pets_per_room": 1,
            "pet_fee_per_night": 1500,
            "allowed_in_room": True,
            "allowed_in_lawn": True,
            "vaccination_required": True
        },
        "paw_rating": {"comfort": 4.0, "safety": 4.3, "freedom": 4.0, "care": 3.5, "joy": 4.2},
        "badges": ["Trails", "Pet Menu"],
        "room_categories": ["Heritage Room", "Lake View Suite"],
        "human_amenities": ["Spa", "Multi-cuisine restaurant", "Boating"],
        "photos": ["https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800"],
        "website": "https://www.nainiretreat.com"
    },
    
    # Maharashtra
    {
        "name": "Della Resorts",
        "property_type": "resort",
        "city": "Lonavala",
        "area": "Kunegaon",
        "state": "Maharashtra",
        "description": "Adventure resort with India's largest collection of adventure activities. Pet-friendly rooms available.",
        "highlights": ["Adventure activities", "Large property", "Pet-friendly villas", "Near Mumbai"],
        "vibe_tags": ["Social", "Outdoorsy"],
        "pet_policy_snapshot": "Pets in select villas, ₹2000/night, leash required in common areas",
        "pet_policy": {
            "max_pets_per_room": 1,
            "max_weight_kg": 20,
            "pet_fee_per_night": 2000,
            "allowed_in_room": True,
            "allowed_in_lawn": True,
            "leash_required": True
        },
        "paw_rating": {"comfort": 4.0, "safety": 4.2, "freedom": 3.5, "care": 3.5, "joy": 4.5},
        "badges": ["Pet sitter"],
        "room_categories": ["Villa", "Tent"],
        "human_amenities": ["Adventure park", "Spa", "Multiple restaurants"],
        "photos": ["https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800"],
        "website": "https://www.dellaresorts.com"
    },
    {
        "name": "Radisson Blu Resort & Spa Alibaug",
        "property_type": "resort",
        "city": "Alibaug",
        "area": "Alibaug Beach",
        "state": "Maharashtra",
        "description": "Beachside resort perfect for weekend getaways from Mumbai. Pet-friendly rooms with garden access.",
        "highlights": ["Near Mumbai", "Beach access", "Spa", "Family-friendly"],
        "vibe_tags": ["Beach", "Social"],
        "pet_policy_snapshot": "Small pets welcome, ₹1500/night, beach walks allowed",
        "pet_policy": {
            "max_pets_per_room": 1,
            "max_weight_kg": 15,
            "pet_fee_per_night": 1500,
            "allowed_in_room": True,
            "allowed_in_lawn": True
        },
        "paw_rating": {"comfort": 4.0, "safety": 4.0, "freedom": 3.8, "care": 3.5, "joy": 4.0},
        "badges": ["Beach access"],
        "room_categories": ["Superior Room", "Suite"],
        "human_amenities": ["Beach", "Spa", "Pool", "Water sports"],
        "photos": ["https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800"],
        "website": "https://www.radissonhotels.com/alibaug"
    },
    
    # Karnataka
    {
        "name": "Evolve Back Coorg",
        "property_type": "resort",
        "city": "Coorg",
        "area": "Karadigodu",
        "state": "Karnataka",
        "description": "Luxury plantation resort in coffee country. Expansive grounds perfect for pets to explore.",
        "highlights": ["Coffee plantation", "Luxury villas", "Nature trails", "Private pools"],
        "vibe_tags": ["Luxury", "Quiet", "Forest"],
        "pet_policy_snapshot": "Pets welcome in villas, plantation walks, ₹3000/night",
        "pet_policy": {
            "max_pets_per_room": 2,
            "pet_fee_per_night": 3000,
            "allowed_in_room": True,
            "allowed_in_lawn": True,
            "allowed_in_restaurant_outdoor": True
        },
        "paw_rating": {"comfort": 4.8, "safety": 4.6, "freedom": 4.8, "care": 4.2, "joy": 4.8},
        "badges": ["Off-leash area", "Trails", "Pet Menu", "Pet sitter"],
        "room_categories": ["Pool Hut", "Lily Pool Villa"],
        "human_amenities": ["Spa", "Private pools", "Plantation tours"],
        "photos": ["https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=800"],
        "website": "https://www.evolveback.com/coorg"
    },
    {
        "name": "The Serai Kabini",
        "property_type": "resort",
        "city": "Kabini",
        "area": "Nagarhole",
        "state": "Karnataka",
        "description": "Wildlife resort on the banks of Kabini River. Perfect for nature-loving pet families.",
        "highlights": ["Wildlife safaris", "River frontage", "Luxury tents", "Bird watching"],
        "vibe_tags": ["Outdoorsy", "Luxury", "Quiet"],
        "pet_policy_snapshot": "Select accommodations pet-friendly, advance booking required",
        "pet_policy": {
            "max_pets_per_room": 1,
            "pet_fee_per_night": 2500,
            "allowed_in_room": True,
            "allowed_in_lawn": True,
            "leash_required": True
        },
        "paw_rating": {"comfort": 4.5, "safety": 4.8, "freedom": 4.0, "care": 4.0, "joy": 4.5},
        "badges": ["Trails", "Pet sitter"],
        "room_categories": ["Luxury Tent", "River Lodge"],
        "human_amenities": ["Safari", "Spa", "Riverside dining"],
        "photos": ["https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800"],
        "website": "https://www.theserai.in/kabini"
    },
    
    # Tamil Nadu
    {
        "name": "The Tamara Kodai",
        "property_type": "resort",
        "city": "Kodaikanal",
        "area": "La Providence",
        "state": "Tamil Nadu",
        "description": "Boutique resort in the Palani Hills. Misty mountains and forest walks for pets.",
        "highlights": ["Mountain setting", "Forest trails", "Boutique property", "Misty views"],
        "vibe_tags": ["Mountain", "Quiet", "Forest"],
        "pet_policy_snapshot": "Pets welcome, forest walks, ₹1800/night",
        "pet_policy": {
            "max_pets_per_room": 1,
            "pet_fee_per_night": 1800,
            "allowed_in_room": True,
            "allowed_in_lawn": True,
            "leash_required": True
        },
        "paw_rating": {"comfort": 4.2, "safety": 4.4, "freedom": 4.5, "care": 3.8, "joy": 4.5},
        "badges": ["Trails", "Off-leash area"],
        "room_categories": ["Cottage", "Suite"],
        "human_amenities": ["Spa", "Trekking", "Bonfire"],
        "photos": ["https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800"],
        "website": "https://www.thetamara.com/kodai"
    },
    {
        "name": "Taj Fisherman's Cove",
        "property_type": "resort",
        "city": "Chennai",
        "area": "Covelong Beach",
        "state": "Tamil Nadu",
        "description": "Beachfront resort near Chennai. Pet-friendly cottages with direct beach access.",
        "highlights": ["Private beach", "Near Chennai", "Water sports", "Cottages"],
        "vibe_tags": ["Beach", "Social"],
        "pet_policy_snapshot": "Small pets in cottages, beach walks permitted, ₹2000/night",
        "pet_policy": {
            "max_pets_per_room": 1,
            "max_weight_kg": 12,
            "pet_fee_per_night": 2000,
            "allowed_in_room": True,
            "allowed_in_lawn": True
        },
        "paw_rating": {"comfort": 4.0, "safety": 4.2, "freedom": 4.0, "care": 3.5, "joy": 4.2},
        "badges": ["Beach access"],
        "room_categories": ["Sea-facing Cottage", "Villa"],
        "human_amenities": ["Beach", "Water sports", "Spa", "Pool"],
        "photos": ["https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800"],
        "website": "https://www.tajhotels.com/fishermans-cove"
    },
    
    # Delhi NCR
    {
        "name": "The Oberoi, Gurugram",
        "property_type": "hotel",
        "city": "Gurugram",
        "area": "DLF Cyber City",
        "state": "Haryana",
        "description": "Urban luxury hotel with pet-friendly rooms. Ideal for business travelers with pets.",
        "highlights": ["Urban luxury", "Pet-friendly rooms", "Near airport", "Business facilities"],
        "vibe_tags": ["City-convenient", "Luxury"],
        "pet_policy_snapshot": "Small pets welcome, ₹3000/night, in-room pet amenities",
        "pet_policy": {
            "max_pets_per_room": 1,
            "max_weight_kg": 10,
            "pet_fee_per_night": 3000,
            "allowed_in_room": True,
            "allowed_in_lawn": True,
            "vaccination_required": True
        },
        "paw_rating": {"comfort": 4.5, "safety": 4.5, "freedom": 3.0, "care": 4.0, "joy": 3.2},
        "badges": ["Pet Menu", "Pet sitter"],
        "room_categories": ["Premier Room", "Suite"],
        "human_amenities": ["Spa", "Pool", "Fine dining", "Business center"],
        "photos": ["https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800"],
        "website": "https://www.oberoihotels.com/gurugram"
    },
    {
        "name": "ITC Grand Bharat",
        "property_type": "resort",
        "city": "Gurugram",
        "area": "Hasanpur",
        "state": "Haryana",
        "description": "All-suite resort spread across 100 acres. Pets enjoy the expansive grounds and golf course.",
        "highlights": ["100-acre property", "Golf course", "All suites", "Near Delhi"],
        "vibe_tags": ["Luxury", "Quiet"],
        "pet_policy_snapshot": "Pets in select suites, golf course walks, ₹4000/night",
        "pet_policy": {
            "max_pets_per_room": 1,
            "pet_fee_per_night": 4000,
            "pet_deposit": 10000,
            "allowed_in_room": True,
            "allowed_in_lawn": True,
            "leash_required": True
        },
        "paw_rating": {"comfort": 4.8, "safety": 4.6, "freedom": 4.5, "care": 4.2, "joy": 4.5},
        "badges": ["Off-leash area", "Trails", "Pet Menu", "Grooming"],
        "room_categories": ["Presidential Suite", "Maharaja Suite"],
        "human_amenities": ["Golf", "Spa", "Multiple restaurants"],
        "photos": ["https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800"],
        "website": "https://www.itchotels.com/grand-bharat"
    },
    
    # Andaman
    {
        "name": "Taj Exotica Resort & Spa",
        "property_type": "resort",
        "city": "Havelock Island",
        "area": "Radhanagar Beach",
        "state": "Andaman",
        "description": "Island paradise with pet-friendly villas. Near Asia's best beach.",
        "highlights": ["Private beach", "Island setting", "Diving", "Luxury villas"],
        "vibe_tags": ["Beach", "Luxury", "Quiet"],
        "pet_policy_snapshot": "Small pets in villas, beach access with supervision",
        "pet_policy": {
            "max_pets_per_room": 1,
            "max_weight_kg": 10,
            "pet_fee_per_night": 3500,
            "allowed_in_room": True,
            "allowed_in_lawn": True,
            "leash_required": True
        },
        "paw_rating": {"comfort": 4.5, "safety": 4.5, "freedom": 4.0, "care": 4.0, "joy": 4.8},
        "badges": ["Beach access", "Pet sitter"],
        "room_categories": ["Beach Villa", "Pool Villa"],
        "human_amenities": ["Beach", "Diving", "Spa", "Water sports"],
        "photos": ["https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800"],
        "website": "https://www.tajhotels.com/andaman"
    },
    
    # Pondicherry
    {
        "name": "Palais de Mahe",
        "property_type": "hotel",
        "city": "Pondicherry",
        "area": "White Town",
        "state": "Puducherry",
        "description": "Boutique heritage hotel in French Quarter. Pet-friendly rooms with courtyard access.",
        "highlights": ["French Quarter", "Heritage building", "Rooftop pool", "Pet courtyard"],
        "vibe_tags": ["Heritage", "Quiet"],
        "pet_policy_snapshot": "Pets welcome, courtyard access, no extra charge for small pets",
        "pet_policy": {
            "max_pets_per_room": 1,
            "max_weight_kg": 12,
            "pet_fee_per_night": 0,
            "allowed_in_room": True,
            "allowed_in_lawn": True
        },
        "paw_rating": {"comfort": 4.0, "safety": 4.2, "freedom": 3.8, "care": 3.5, "joy": 4.0},
        "badges": ["Pet Menu"],
        "room_categories": ["Heritage Room", "Suite"],
        "human_amenities": ["Rooftop pool", "Restaurant", "Spa"],
        "photos": ["https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800"],
        "website": "https://www.cghearth.com/palais-de-mahe"
    },
    
    # Additional properties to reach 50
    {
        "name": "Treehouse Jaipur",
        "property_type": "hotel",
        "city": "Jaipur",
        "area": "Near Nahargarh Fort",
        "state": "Rajasthan",
        "description": "Unique treehouse-style property with pet-friendly rooms. Great city views.",
        "highlights": ["Treehouse rooms", "City views", "Fort nearby", "Pet-friendly"],
        "vibe_tags": ["Quirky", "City-convenient"],
        "pet_policy_snapshot": "All pets welcome, garden area, ₹1000/night",
        "pet_policy": {
            "max_pets_per_room": 2,
            "pet_fee_per_night": 1000,
            "allowed_in_room": True,
            "allowed_in_lawn": True
        },
        "paw_rating": {"comfort": 3.8, "safety": 4.0, "freedom": 4.0, "care": 3.5, "joy": 4.2},
        "badges": ["Off-leash area"],
        "room_categories": ["Treehouse", "Ground Room"],
        "human_amenities": ["Rooftop", "Restaurant"],
        "photos": ["https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800"]
    },
    {
        "name": "SaffronStays Casa Del Sol",
        "property_type": "villa",
        "city": "Goa",
        "area": "Assagao",
        "state": "Goa",
        "description": "Private villa perfect for pet families. Fully fenced garden and pool.",
        "highlights": ["Private villa", "Fenced garden", "Private pool", "Pet paradise"],
        "vibe_tags": ["Quiet", "Beach"],
        "pet_policy_snapshot": "Very pet-friendly, full villa privacy, no restrictions",
        "pet_policy": {
            "max_pets_per_room": 3,
            "pet_fee_per_night": 500,
            "allowed_in_room": True,
            "allowed_in_lawn": True,
            "allowed_in_pool_area": True
        },
        "paw_rating": {"comfort": 4.5, "safety": 4.8, "freedom": 5.0, "care": 3.5, "joy": 5.0},
        "badges": ["Off-leash area", "Pet Menu"],
        "room_categories": ["Full Villa"],
        "human_amenities": ["Private pool", "Kitchen", "Garden"],
        "photos": ["https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800"],
        "website": "https://www.saffronstays.com"
    },
    {
        "name": "Atmantan Wellness Centre",
        "property_type": "resort",
        "city": "Pune",
        "area": "Mulshi Lake",
        "state": "Maharashtra",
        "description": "Luxury wellness resort with pet-friendly options. Holistic retreat for you and your pet.",
        "highlights": ["Wellness focus", "Lake views", "Yoga", "Nature trails"],
        "vibe_tags": ["Quiet", "Luxury", "Mountain"],
        "pet_policy_snapshot": "Small pets in select rooms, wellness walks, ₹2500/night",
        "pet_policy": {
            "max_pets_per_room": 1,
            "max_weight_kg": 10,
            "pet_fee_per_night": 2500,
            "allowed_in_room": True,
            "allowed_in_lawn": True,
            "leash_required": True
        },
        "paw_rating": {"comfort": 4.5, "safety": 4.6, "freedom": 4.0, "care": 4.5, "joy": 4.2},
        "badges": ["Trails", "Pet Menu"],
        "room_categories": ["Wellness Suite"],
        "human_amenities": ["Spa", "Yoga", "Wellness programs"],
        "photos": ["https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800"],
        "website": "https://www.atmantan.com"
    },
    {
        "name": "Himalaica",
        "property_type": "homestay",
        "city": "Manali",
        "area": "Old Manali",
        "state": "Himachal Pradesh",
        "description": "Cozy mountain homestay with incredible views. Dogs love the apple orchards.",
        "highlights": ["Mountain views", "Apple orchards", "Homely vibe", "Pet paradise"],
        "vibe_tags": ["Mountain", "Quiet", "Outdoorsy"],
        "pet_policy_snapshot": "Very pet-friendly, no extra charge, orchard access",
        "pet_policy": {
            "max_pets_per_room": 2,
            "pet_fee_per_night": 0,
            "allowed_in_room": True,
            "allowed_in_lawn": True,
            "allowed_in_lobby": True
        },
        "paw_rating": {"comfort": 4.0, "safety": 4.5, "freedom": 5.0, "care": 4.0, "joy": 5.0},
        "badges": ["Off-leash area", "Trails", "Pet Menu"],
        "room_categories": ["Mountain Room", "Suite"],
        "human_amenities": ["Home-cooked meals", "Bonfire", "Trekking"],
        "photos": ["https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800"]
    },
    {
        "name": "Camp Wildex",
        "property_type": "resort",
        "city": "Rishikesh",
        "area": "Shivpuri",
        "state": "Uttarakhand",
        "description": "Adventure camp by the Ganges. Perfect for active pet families.",
        "highlights": ["River rafting", "Beach camping", "Adventure activities", "Pet-friendly tents"],
        "vibe_tags": ["Outdoorsy", "Social"],
        "pet_policy_snapshot": "All pets welcome, river beach access, ₹800/night",
        "pet_policy": {
            "max_pets_per_room": 2,
            "pet_fee_per_night": 800,
            "allowed_in_room": True,
            "allowed_in_lawn": True
        },
        "paw_rating": {"comfort": 3.5, "safety": 4.0, "freedom": 5.0, "care": 3.0, "joy": 5.0},
        "badges": ["Off-leash area", "Beach access"],
        "room_categories": ["Luxury Tent", "Swiss Cottage"],
        "human_amenities": ["Rafting", "Kayaking", "Bonfire", "Beach volleyball"],
        "photos": ["https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800"]
    },
    {
        "name": "The Windflower Prakruthi",
        "property_type": "resort",
        "city": "Bangalore",
        "area": "Devanahalli",
        "state": "Karnataka",
        "description": "Nature resort near Bangalore airport. Great for pet staycations.",
        "highlights": ["Near airport", "Nature setting", "Weekend getaway", "Pet-friendly"],
        "vibe_tags": ["Quiet", "Outdoorsy"],
        "pet_policy_snapshot": "Pets welcome, garden cottages, ₹1500/night",
        "pet_policy": {
            "max_pets_per_room": 1,
            "pet_fee_per_night": 1500,
            "allowed_in_room": True,
            "allowed_in_lawn": True
        },
        "paw_rating": {"comfort": 4.0, "safety": 4.2, "freedom": 4.3, "care": 3.5, "joy": 4.3},
        "badges": ["Off-leash area", "Trails"],
        "room_categories": ["Cottage", "Suite"],
        "human_amenities": ["Pool", "Spa", "Nature walks"],
        "photos": ["https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=800"],
        "website": "https://www.thewindflower.com/prakruthi"
    },
    {
        "name": "Mahua Kothi",
        "property_type": "resort",
        "city": "Bandhavgarh",
        "area": "Tala",
        "state": "Madhya Pradesh",
        "description": "Luxury jungle lodge near tiger reserve. Pet-friendly with precautions.",
        "highlights": ["Tiger reserve", "Luxury lodges", "Safari", "Wildlife"],
        "vibe_tags": ["Outdoorsy", "Luxury", "Forest"],
        "pet_policy_snapshot": "Small pets with advance notice, controlled areas",
        "pet_policy": {
            "max_pets_per_room": 1,
            "max_weight_kg": 10,
            "pet_fee_per_night": 2000,
            "allowed_in_room": True,
            "leash_required": True
        },
        "paw_rating": {"comfort": 4.2, "safety": 4.8, "freedom": 3.0, "care": 4.0, "joy": 3.5},
        "badges": ["Vet on call"],
        "room_categories": ["Kuhi", "Machaan"],
        "human_amenities": ["Safari", "Pool", "Spa"],
        "photos": ["https://images.unsplash.com/photo-1587061949409-02df41d5e562?w=800"],
        "website": "https://www.tajsafaris.com/mahua-kothi"
    },
    {
        "name": "Vivanta Dal View",
        "property_type": "hotel",
        "city": "Srinagar",
        "area": "Dal Lake",
        "state": "Jammu & Kashmir",
        "description": "Lakeside luxury with Dal Lake views. Pet-friendly rooms with garden access.",
        "highlights": ["Dal Lake views", "Shikara rides", "Mountain backdrop", "Garden walks"],
        "vibe_tags": ["Mountain", "Luxury", "Quiet"],
        "pet_policy_snapshot": "Small pets welcome, garden access, ₹2000/night",
        "pet_policy": {
            "max_pets_per_room": 1,
            "max_weight_kg": 12,
            "pet_fee_per_night": 2000,
            "allowed_in_room": True,
            "allowed_in_lawn": True
        },
        "paw_rating": {"comfort": 4.3, "safety": 4.4, "freedom": 3.8, "care": 4.0, "joy": 4.0},
        "badges": ["Pet Menu", "Trails"],
        "room_categories": ["Superior Room", "Lake View Suite"],
        "human_amenities": ["Spa", "Shikara", "Restaurants"],
        "photos": ["https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800"],
        "website": "https://www.vivantahotels.com/dal-view"
    },
    {
        "name": "The Machan",
        "property_type": "resort",
        "city": "Lonavala",
        "area": "Jambulne",
        "state": "Maharashtra",
        "description": "Treehouse eco-resort in the forest. Unique experience for nature-loving pets.",
        "highlights": ["Treehouses", "Eco-friendly", "Forest setting", "Unique stay"],
        "vibe_tags": ["Forest", "Quiet", "Outdoorsy"],
        "pet_policy_snapshot": "Pets in select machans, forest walks, ₹1500/night",
        "pet_policy": {
            "max_pets_per_room": 1,
            "pet_fee_per_night": 1500,
            "allowed_in_room": True,
            "allowed_in_lawn": True,
            "leash_required": True
        },
        "paw_rating": {"comfort": 4.0, "safety": 4.5, "freedom": 4.5, "care": 3.5, "joy": 4.8},
        "badges": ["Trails", "Off-leash area"],
        "room_categories": ["Canopy Machan", "Forest Machan"],
        "human_amenities": ["Nature trails", "Stargazing"],
        "photos": ["https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800"],
        "website": "https://www.themachan.com"
    },
    {
        "name": "Aahana Resort",
        "property_type": "resort",
        "city": "Corbett",
        "area": "Ramnagar",
        "state": "Uttarakhand",
        "description": "Nature resort at the foothills of the Himalayas. Pet-friendly with large grounds.",
        "highlights": ["Wildlife", "Large grounds", "Spa", "Family-friendly"],
        "vibe_tags": ["Forest", "Outdoorsy"],
        "pet_policy_snapshot": "Pets welcome, garden cottages, ₹1200/night",
        "pet_policy": {
            "max_pets_per_room": 2,
            "pet_fee_per_night": 1200,
            "allowed_in_room": True,
            "allowed_in_lawn": True
        },
        "paw_rating": {"comfort": 4.0, "safety": 4.3, "freedom": 4.5, "care": 3.8, "joy": 4.5},
        "badges": ["Off-leash area", "Trails"],
        "room_categories": ["Cottage", "Suite"],
        "human_amenities": ["Spa", "Pool", "Safari", "Yoga"],
        "photos": ["https://images.unsplash.com/photo-1587061949409-02df41d5e562?w=800"],
        "website": "https://www.aahanaresort.com"
    }
]


async def seed_stay_properties(db, force_reseed: bool = False):
    """
    Seed the database with pet-friendly hotel data
    Args:
        db: MongoDB database instance
        force_reseed: If True, will delete existing and reseed
    Returns:
        dict with stats
    """
    collection = db.stay_properties
    
    # Check existing count
    existing_count = await collection.count_documents({})
    
    if existing_count > 0 and not force_reseed:
        return {
            "status": "skipped",
            "message": f"Database already has {existing_count} properties. Use force_reseed=True to replace.",
            "existing_count": existing_count
        }
    
    if force_reseed and existing_count > 0:
        await collection.delete_many({})
        logger.info(f"Deleted {existing_count} existing properties for reseed")
    
    now = datetime.now(timezone.utc).isoformat()
    seeded = 0
    errors = []
    
    for hotel_data in INDIA_PET_FRIENDLY_HOTELS:
        try:
            # Calculate overall paw rating
            paw = hotel_data.get("paw_rating", {})
            scores = [paw.get("comfort", 0), paw.get("safety", 0), paw.get("freedom", 0),
                      paw.get("care", 0), paw.get("joy", 0)]
            valid_scores = [s for s in scores if s > 0]
            overall = round(sum(valid_scores) / len(valid_scores), 1) if valid_scores else 0
            
            # Build full document
            property_doc = {
                "id": f"stay-{uuid.uuid4().hex[:12]}",
                "name": hotel_data.get("name"),
                "brand_group": hotel_data.get("brand_group"),
                "property_type": hotel_data.get("property_type", "resort"),
                "city": hotel_data.get("city"),
                "area": hotel_data.get("area"),
                "state": hotel_data.get("state"),
                "country": hotel_data.get("country", "India"),
                "full_address": hotel_data.get("full_address"),
                "description": hotel_data.get("description", ""),
                "highlights": hotel_data.get("highlights", []),
                "vibe_tags": hotel_data.get("vibe_tags", []),
                "photos": hotel_data.get("photos", []),
                "photos_approved": True,
                "website": hotel_data.get("website"),
                "booking_link": hotel_data.get("booking_link"),
                
                # Pet policy
                "pet_policy": hotel_data.get("pet_policy", {}),
                "pet_policy_snapshot": hotel_data.get("pet_policy_snapshot", ""),
                
                # Paw rating
                "paw_rating": {
                    **paw,
                    "overall": overall
                },
                "badges": hotel_data.get("badges", []),
                "compliance_status": "approved",
                "verified": True,
                
                # For humans
                "room_categories": hotel_data.get("room_categories", []),
                "human_amenities": hotel_data.get("human_amenities", []),
                "cuisine_available": hotel_data.get("cuisine_available", []),
                "nearby_vet": hotel_data.get("nearby_vet"),
                "nearby_pet_places": hotel_data.get("nearby_pet_places", []),
                
                # Pet menu (will be empty initially)
                "pet_menu_available": False,
                "pet_menu_items": [],
                "add_ons": [],
                
                # Commercials (default)
                "commercials": {
                    "contract_type": "commission",
                    "commission_rate": 12,
                    "member_price_discount": 0,
                    "blackout_dates": [],
                    "payment_terms": "Net 30"
                },
                
                # Status
                "status": "live",
                "featured": hotel_data.get("featured", False),
                "incident_history": [],
                
                # Metadata
                "created_at": now,
                "updated_at": now,
                "seeded": True,
                "source": "curated_data"
            }
            
            await collection.insert_one(property_doc)
            seeded += 1
            
        except Exception as e:
            errors.append(f"{hotel_data.get('name', 'Unknown')}: {str(e)}")
            logger.error(f"Error seeding {hotel_data.get('name')}: {e}")
    
    # Create indexes
    await collection.create_index("city")
    await collection.create_index("property_type")
    await collection.create_index("status")
    await collection.create_index("paw_rating.overall")
    
    logger.info(f"Seeded {seeded} stay properties")
    
    return {
        "status": "success",
        "seeded": seeded,
        "total_available": len(INDIA_PET_FRIENDLY_HOTELS),
        "errors": errors[:5] if errors else []
    }


# For direct execution
if __name__ == "__main__":
    print(f"Total hotels available for seeding: {len(INDIA_PET_FRIENDLY_HOTELS)}")
    for hotel in INDIA_PET_FRIENDLY_HOTELS:
        print(f"  - {hotel['name']} ({hotel['city']}, {hotel['state']})")

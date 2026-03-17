#!/usr/bin/env python3
"""
Seed 8 canonical Go services into services_master collection
"""
import os, sys, uuid
sys.path.insert(0, '/app/backend')
from dotenv import load_dotenv
load_dotenv('/app/backend/.env')
from pymongo import MongoClient
from datetime import datetime, timezone

client = MongoClient(os.environ['MONGO_URL'])
db = client[os.environ.get('DB_NAME', 'pet_life_os')]

GO_SERVICES = [
    {
        "id": "GO-SVC-001",
        "name": "Flight Coordination",
        "pillar": "go",
        "pillar_name": "Go",
        "pillar_icon": "✈️",
        "category": "travel",
        "sub_pillar": "travel",
        "icon": "✈️",
        "tagline": "Cabin policy, docs & airport coordination",
        "description": "We handle airline policy, documentation, and airport coordination for your dog's flight. From cabin vs cargo decisions to health certificates.",
        "short_description": "Airline policy, documentation & airport coordination",
        "steps": 5,
        "accent_colour": "#1565C0",
        "api_endpoint": "POST /api/concierge/go-booking",
        "service_type": "flight",
        "watercolour_prompt": "Watercolour: dog in airline carrier at airport departure gate, travel blues and sage, 16:9",
        "booking_flow": "FlightFlow",
        "is_bookable": True,
        "is_active": True,
        "base_price": 500,
        "image_url": None,
        "watercolor_image": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": "GO-SVC-002",
        "name": "Road & Train Travel",
        "pillar": "go",
        "pillar_name": "Go",
        "pillar_icon": "🚗",
        "category": "travel",
        "sub_pillar": "travel",
        "icon": "🚗",
        "tagline": "Route planning, safety kit & rest stops",
        "description": "Complete road or train journey planning — route, safety kit, rest stops, vet locations en route, and personalised preparation for your dog.",
        "short_description": "Route planning, safety kit & rest stops",
        "steps": 4,
        "accent_colour": "#2E7D32",
        "api_endpoint": "POST /api/concierge/go-booking",
        "service_type": "roadtrip",
        "watercolour_prompt": "Watercolour: happy dog out of car window on scenic road through India, amber and green, 16:9",
        "booking_flow": "RoadTripFlow",
        "is_bookable": True,
        "is_active": True,
        "base_price": 0,
        "image_url": None,
        "watercolor_image": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": "GO-SVC-003",
        "name": "Boarding & Daycare",
        "pillar": "go",
        "pillar_name": "Go",
        "pillar_icon": "🏡",
        "category": "stay",
        "sub_pillar": "stay",
        "icon": "🏡",
        "tagline": "When you travel — we find the best stay",
        "description": "We find and book the right boarding facility or daycare for your dog while you're away. Vetted, safe, and matched to your dog's personality.",
        "short_description": "Find & book the right boarding or daycare",
        "steps": 4,
        "accent_colour": "#2D6A4F",
        "api_endpoint": "POST /api/concierge/go-booking",
        "service_type": "boarding",
        "watercolour_prompt": "Watercolour: dog happily settled in cosy boarding room with soft bed, warm sage tones, 16:9",
        "booking_flow": "BoardingFlow",
        "is_bookable": True,
        "is_active": True,
        "base_price": 999,
        "image_url": None,
        "watercolor_image": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": "GO-SVC-004",
        "name": "Pet Sitting",
        "pillar": "go",
        "pillar_name": "Go",
        "pillar_icon": "🏠",
        "category": "stay",
        "sub_pillar": "stay",
        "icon": "🏠",
        "tagline": "Sitter comes home — your dog never leaves",
        "description": "A trusted, vetted sitter comes to your dog's home. Your dog stays comfortable in familiar surroundings while you travel.",
        "short_description": "Trusted sitter at your home — zero disruption",
        "steps": 4,
        "accent_colour": "#E65100",
        "api_endpoint": "POST /api/concierge/go-booking",
        "service_type": "sitting",
        "watercolour_prompt": "Watercolour: caring pet sitter playing with dog in sunny living room, warm amber tones, 16:9",
        "booking_flow": "SittingFlow",
        "is_bookable": True,
        "is_active": True,
        "base_price": 1499,
        "image_url": None,
        "watercolor_image": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": "GO-SVC-005",
        "name": "Relocation",
        "pillar": "go",
        "pillar_name": "Go",
        "pillar_icon": "📦",
        "category": "travel",
        "sub_pillar": "travel",
        "icon": "📦",
        "tagline": "Complete domestic or international move",
        "description": "Complete relocation coordination — documentation, transport, and new home settling for your dog. Domestic or international.",
        "short_description": "Domestic or international move, fully managed",
        "steps": 5,
        "accent_colour": "#6A1B9A",
        "api_endpoint": "POST /api/concierge/go-booking",
        "service_type": "relocation",
        "watercolour_prompt": "Watercolour: family with dog during hopeful house move, warm purple and cream, 16:9",
        "booking_flow": "RelocationFlow",
        "is_bookable": True,
        "is_active": True,
        "base_price": 0,
        "image_url": None,
        "watercolor_image": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": "GO-SVC-006",
        "name": "Pet Taxi",
        "pillar": "go",
        "pillar_name": "Go",
        "pillar_icon": "🚕",
        "category": "travel",
        "sub_pillar": "travel",
        "icon": "🚕",
        "tagline": "Safe city transport to vet, airport or groomer",
        "description": "Trusted pet taxi for vet visits, grooming appointments, or airport transfers. Safe, stress-free city transport.",
        "short_description": "Safe city transport — vet, airport, groomer",
        "steps": 3,
        "accent_colour": "#C9973A",
        "api_endpoint": "POST /api/concierge/go-booking",
        "service_type": "taxi",
        "watercolour_prompt": "Watercolour: dog in pet-only taxi with seatbelt, city street background, gold tones, 16:9",
        "booking_flow": "TaxiFlow",
        "is_bookable": True,
        "is_active": True,
        "base_price": 0,
        "image_url": None,
        "watercolor_image": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": "GO-SVC-007",
        "name": "Travel Planning",
        "pillar": "go",
        "pillar_name": "Go",
        "pillar_icon": "🗺️",
        "category": "travel",
        "sub_pillar": "travel",
        "icon": "🗺️",
        "tagline": "Complete trip coordination — all arranged",
        "description": "We plan the entire trip — hotel, transport, documentation, and a vet-checked kit. You focus on the adventure.",
        "short_description": "End-to-end trip coordination for you & your dog",
        "steps": 4,
        "accent_colour": "#00695C",
        "api_endpoint": "POST /api/concierge/go-booking",
        "service_type": "planning",
        "watercolour_prompt": "Watercolour: dog with travel map and adventure gear, sage and amber, 16:9",
        "booking_flow": "TravelPlanningFlow",
        "is_bookable": True,
        "is_active": True,
        "base_price": 0,
        "image_url": None,
        "watercolor_image": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": "GO-SVC-008",
        "name": "Emergency Travel",
        "pillar": "go",
        "pillar_name": "Go",
        "pillar_icon": "🚨",
        "category": "travel",
        "sub_pillar": "travel",
        "icon": "🚨",
        "tagline": "Urgent — lost pet, missed flight, emergency vet",
        "description": "Lost pet, missed flight, or emergency vet abroad. We handle it immediately. Our Concierge team calls you within 5 minutes.",
        "short_description": "Urgent travel help — we respond in 5 minutes",
        "steps": 2,
        "accent_colour": "#C62828",
        "api_endpoint": "POST /api/concierge/go-booking",
        "service_type": "emergency",
        "watercolour_prompt": "Watercolour: reassuring concierge helping worried pet parent at airport, calm tones, 16:9",
        "booking_flow": "EmergencyTravelFlow",
        "is_bookable": True,
        "is_active": True,
        "base_price": 0,
        "image_url": None,
        "watercolor_image": None,
        "urgent": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    },
]

inserted = 0
skipped = 0
for svc in GO_SERVICES:
    existing = db.services_master.find_one({"id": svc["id"]})
    if existing:
        skipped += 1
        print(f"  SKIP (exists): {svc['id']}")
    else:
        db.services_master.insert_one(svc)
        inserted += 1
        print(f"  ADD: {svc['id']} — {svc['name']}")

print(f"\nDone: {inserted} inserted, {skipped} skipped")
print(f"Total go services: {db.services_master.count_documents({'pillar': 'go'})}")

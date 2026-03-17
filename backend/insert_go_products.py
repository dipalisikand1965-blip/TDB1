"""
Insert 31 NEW Go pillar products from TDC_Go_Pillar_Database.xlsx
"NEW Products to Add" sheet — exact data from the Excel
"""
from dotenv import load_dotenv
load_dotenv('/app/backend/.env')
import os, asyncio, uuid
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URL = os.environ.get('MONGO_URL')
DB_NAME   = os.environ.get('DB_NAME')
now = datetime.now(timezone.utc)

NEW_GO_PRODUCTS = [
    # GO Essentials — Safety
    {"id":"GO-SAF-001","dimension":"Go Essentials","sub_category":"Safety","name":"Crash-Tested Car Safety Harness","short_description":"FMVSS-certified, dual-clip, all breeds","price":1499,"mira_pick":True,"breed_tags":["all"],"ai_image_prompt":"Realistic product photo of a crash-tested dog car harness with dual clips and chest pad, white background"},
    {"id":"GO-SAF-002","dimension":"Go Essentials","sub_category":"Safety","name":"GPS Pet Tracker Collar","short_description":"Real-time location, 7-day battery, India coverage","price":2499,"mira_pick":True,"breed_tags":["all"],"ai_image_prompt":"Realistic product photo of a GPS tracker collar with charging cable, white background"},
    {"id":"GO-SAF-003","dimension":"Go Essentials","sub_category":"Safety","name":"Elevated Pet Car Seat","short_description":"Booster seat for small dogs — keeps them safe and window-ready","price":1999,"mira_pick":False,"breed_tags":["small"],"ai_image_prompt":"Realistic product photo of an elevated pet car booster seat with safety tether, white background"},
    {"id":"GO-SAF-004","dimension":"Go Essentials","sub_category":"Safety","name":"Car Barrier / Seat Divider","short_description":"Keeps large dogs safely in the back seat","price":1299,"mira_pick":False,"breed_tags":["large"],"ai_image_prompt":"Realistic product photo of a car seat divider barrier for large dogs, white background"},
    # GO Essentials — Calming
    {"id":"GO-CAL-001","dimension":"Go Essentials","sub_category":"Calming","name":"Calming Pheromone Spray","short_description":"DAP formula, use 15 min before journey","price":599,"mira_pick":True,"breed_tags":["all"],"ai_image_prompt":"Realistic product photo of a pheromone calming spray bottle with dog on label, white background"},
    {"id":"GO-CAL-002","dimension":"Go Essentials","sub_category":"Calming","name":"Travel Calming Chews","short_description":"L-Theanine + Valerian, non-sedating, chicken-free","price":399,"mira_pick":True,"breed_tags":["all"],"ai_image_prompt":"Realistic product photo of a travel calming chews bag with paw design, white background"},
    {"id":"GO-CAL-003","dimension":"Go Essentials","sub_category":"Calming","name":"Travel Anxiety Relief Kit","short_description":"Spray + chews + compression wrap — complete kit","price":999,"mira_pick":True,"breed_tags":["all"],"ai_image_prompt":"Realistic product photo of a travel anxiety relief kit with three items arranged neatly, white background"},
    # GO Essentials — Carriers
    {"id":"GO-CAR-001","dimension":"Go Essentials","sub_category":"Carriers","name":"Airline-Approved Pet Carrier","short_description":"IATA compliant, cabin-ready, padded","price":4999,"mira_pick":True,"breed_tags":["small"],"ai_image_prompt":"Realistic product photo of an airline-approved soft pet carrier with mesh panels, white background"},
    {"id":"GO-CAR-002","dimension":"Go Essentials","sub_category":"Carriers","name":"Ventilated Pet Backpack","short_description":"Hands-free travel, mesh panels, 8kg max","price":2499,"mira_pick":True,"breed_tags":["small","medium"],"ai_image_prompt":"Realistic product photo of a ventilated pet backpack carrier, white background"},
    {"id":"GO-CAR-003","dimension":"Go Essentials","sub_category":"Carriers","name":"Wheeled Pet Carrier Trolley","short_description":"Airport-ready, extendable handle, IATA approved","price":3499,"mira_pick":False,"breed_tags":["small"],"ai_image_prompt":"Realistic product photo of a wheeled pet trolley carrier with handle extended, white background"},
    {"id":"GO-CAR-004","dimension":"Go Essentials","sub_category":"Carriers","name":"IATA Crate — Small","short_description":"Approved for cargo hold, ventilated","price":2999,"mira_pick":False,"breed_tags":["small"],"ai_image_prompt":"Realistic product photo of an IATA-approved plastic dog travel crate small size, white background"},
    {"id":"GO-CAR-005","dimension":"Go Essentials","sub_category":"Carriers","name":"IATA Crate — Medium","short_description":"Approved for cargo hold, ventilated","price":3999,"mira_pick":False,"breed_tags":["medium"],"ai_image_prompt":"Realistic product photo of an IATA-approved plastic dog travel crate medium size, white background"},
    {"id":"GO-CAR-006","dimension":"Go Essentials","sub_category":"Carriers","name":"IATA Crate — Large","short_description":"Approved for cargo hold, ventilated","price":5499,"mira_pick":False,"breed_tags":["large"],"ai_image_prompt":"Realistic product photo of an IATA-approved plastic dog travel crate large size, white background"},
    # GO Essentials — Comfort
    {"id":"GO-COM-001","dimension":"Go Essentials","sub_category":"Comfort","name":"Portable Memory Foam Travel Bed","short_description":"Sets up in 30 sec, waterproof base, rolls compact","price":1299,"mira_pick":True,"breed_tags":["all"],"ai_image_prompt":"Realistic product photo of a rolled portable memory foam pet travel bed, white background"},
    {"id":"GO-COM-002","dimension":"Go Essentials","sub_category":"Comfort","name":"Waterproof Travel Blanket","short_description":"Machine washable, fits car seat or hotel bed","price":699,"mira_pick":False,"breed_tags":["all"],"ai_image_prompt":"Realistic product photo of a folded waterproof travel blanket in navy blue, white background"},
    {"id":"GO-COM-003","dimension":"Go Essentials","sub_category":"Comfort","name":"Pressure-Activated Cooling Mat","short_description":"No electricity, gel-filled, summer essential","price":899,"mira_pick":True,"breed_tags":["all"],"ai_image_prompt":"Realistic product photo of a blue pressure-activated cooling gel mat for dogs, white background"},
    # GO Essentials — Feeding
    {"id":"GO-FED-001","dimension":"Go Essentials","sub_category":"Feeding","name":"Collapsible Silicone Bowl Set","short_description":"2-bowl set, carabiner clip, dishwasher safe","price":349,"mira_pick":True,"breed_tags":["all"],"ai_image_prompt":"Realistic product photo of collapsed silicone travel bowls clipped together, white background"},
    {"id":"GO-FED-002","dimension":"Go Essentials","sub_category":"Feeding","name":"2-in-1 Water Bottle & Bowl","short_description":"Press-release water flow, 500ml, leak-proof","price":499,"mira_pick":True,"breed_tags":["all"],"ai_image_prompt":"Realistic product photo of a 2-in-1 dog water bottle with flip bowl attachment, white background"},
    {"id":"GO-FED-003","dimension":"Go Essentials","sub_category":"Feeding","name":"Airtight Travel Food Container","short_description":"3-day portion, spill-proof, stackable","price":449,"mira_pick":False,"breed_tags":["all"],"ai_image_prompt":"Realistic product photo of an airtight pet food travel container with scoop, white background"},
    # GO Essentials — Documents & ID
    {"id":"GO-DOC-001","dimension":"Go Essentials","sub_category":"Documents & ID","name":"Pet Travel Document Organizer","short_description":"Waterproof, fits vaccination records, passport, health cert","price":699,"mira_pick":True,"breed_tags":["all"],"ai_image_prompt":"Realistic product photo of a waterproof pet document organizer with zipper, white background"},
    {"id":"GO-DOC-002","dimension":"Go Essentials","sub_category":"Documents & ID","name":"Engraved Travel ID Tag Set","short_description":"2 tags — home number + travel contact number","price":599,"mira_pick":True,"breed_tags":["all"],"ai_image_prompt":"Realistic product photo of two stainless steel engraved dog ID tags, white background"},
    # GO Essentials — Health & First Aid
    {"id":"GO-HLT-001","dimension":"Go Essentials","sub_category":"Health & First Aid","name":"Pet Travel First Aid Kit","short_description":"Antiseptic, bandage, tick remover, emergency guide","price":899,"mira_pick":True,"breed_tags":["all"],"ai_image_prompt":"Realistic product photo of a compact pet travel first aid kit case with contents visible, white background"},
    {"id":"GO-HLT-002","dimension":"Go Essentials","sub_category":"Health & First Aid","name":"Motion Sickness Relief Tablets","short_description":"Vet-approved, anti-nausea, safe for frequent use","price":449,"mira_pick":True,"breed_tags":["all"],"ai_image_prompt":"Realistic product photo of motion sickness pet tablets in a small blister pack, white background"},
    # Stay & Board
    {"id":"GO-STY-001","dimension":"Stay & Board","sub_category":"Boarding","name":"Standard Boarding — 1 Night","short_description":"Comfortable overnight with meals and walks","price":999,"mira_pick":False,"breed_tags":["all"],"ai_image_prompt":"Watercolour illustration: a cosy dog boarding space with a happy dog in a comfortable bed, sage and warm tones"},
    {"id":"GO-STY-002","dimension":"Stay & Board","sub_category":"Boarding","name":"Luxury Suite Boarding — 1 Night","short_description":"Private suite, premium care, daily updates","price":1999,"mira_pick":False,"breed_tags":["all"],"ai_image_prompt":"Watercolour illustration: a luxury pet boarding suite with plush bed and personal attendant, warm gold tones"},
    {"id":"GO-STY-003","dimension":"Stay & Board","sub_category":"Daycare","name":"Daycare — Full Day","short_description":"Supervised play, meals, socialisation","price":599,"mira_pick":True,"breed_tags":["all"],"ai_image_prompt":"Watercolour illustration: dogs playing happily in a bright daycare space, vibrant colours"},
    {"id":"GO-STY-004","dimension":"Stay & Board","sub_category":"Daycare","name":"Daycare 10-Day Pass","short_description":"10 days + 2 bonus days","price":4999,"mira_pick":False,"breed_tags":["all"],"ai_image_prompt":"Watercolour illustration: daycare pass card with playful dogs illustration, bright fun tones"},
    {"id":"GO-STY-005","dimension":"Stay & Board","sub_category":"Pet Sitting","name":"In-Home Pet Sitting — Full Day","short_description":"Sitter comes to your home, 8 hours","price":1499,"mira_pick":True,"breed_tags":["all"],"ai_image_prompt":"Watercolour illustration: a caring pet sitter playing with a dog at home, warm domestic tones"},
    {"id":"GO-STY-006","dimension":"Stay & Board","sub_category":"Pet Sitting","name":"Overnight Pet Nanny","short_description":"24-hour in-home care — your dog never leaves home","price":2499,"mira_pick":True,"breed_tags":["all"],"ai_image_prompt":"Watercolour illustration: a dog sleeping peacefully at home with an overnight carer nearby, night sky tones"},
    {"id":"GO-STY-007","dimension":"Stay & Board","sub_category":"Hotel Discovery","name":"Pet-Friendly Hotel Stay","short_description":"Concierge finds and books the right hotel","price":5000,"mira_pick":False,"breed_tags":["all"],"ai_image_prompt":"Watercolour illustration: a dog relaxing on a luxury hotel room bed, travel adventure mood"},
    {"id":"GO-STY-008","dimension":"Stay & Board","sub_category":"Hotel Discovery","name":"Stay Essentials Kit","short_description":"Everything needed for a boarding or hotel stay","price":2499,"mira_pick":False,"breed_tags":["all"],"ai_image_prompt":"Realistic product photo: stay essentials kit with travel bowl, blanket, treats and comfort toy, white background"},
]

async def main():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    col = db["products_master"]

    inserted = 0
    skipped  = 0
    to_insert = []

    for p in NEW_GO_PRODUCTS:
        existing = await col.find_one({"id": p["id"]})
        if existing:
            skipped += 1
            print(f"  SKIP: {p['name']}")
            continue
        doc = {
            "id":               p["id"],
            "name":             p["name"],
            "title":            p["name"],
            "short_description": p["short_description"],
            "description":      p["short_description"],
            "pillar":           "go",
            "pillars":          ["go", "travel", "shop"],
            "dimension":        p["dimension"],
            "sub_category":     p["sub_category"],
            "category":         p["sub_category"].lower().replace(" & ", "_").replace(" ", "_"),
            "price":            p["price"],
            "compare_at_price": round(p["price"] * 1.20, 2),
            "gst_rate":         18.0,
            "vendor":           "TDC Concierge",
            "vendor_type":      "tdc_curated",
            "breed_tags":       p["breed_tags"],
            "size_tags":        p["breed_tags"],
            "in_stock":         True,
            "is_active":        True,
            "active":           True,
            "mira_pick":        p["mira_pick"],
            "mira_can_reference": True,
            "mira_can_suggest": True,
            "ai_image_prompt":  p["ai_image_prompt"],
            "ai_image_generated": False,
            "source":           "go_pillar_excel_v1",
            "tags":             ["go", "travel", p["sub_category"].lower()],
            "created_at":       now,
            "updated_at":       now,
        }
        to_insert.append(doc)
        print(f"  QUEUE: {p['name']} — ₹{p['price']}")

    if to_insert:
        result = await col.insert_many(to_insert)
        inserted = len(result.inserted_ids)
        print(f"\n✅ Inserted {inserted} new Go products")
        print(f"   Skipped {skipped} (already existed)")
    else:
        print(f"\nAll {skipped} products already exist.")

    # Also update prices on existing travel products (stay-prod-* IDs)
    price_updates = {
        "stay-prod-gps-tracker":   2499,
        "stay-prod-calming-spra":   599,
        "stay-prod-car-seat":      1999,
        "stay-prod-car-harness":   1499,
        "stay-prod-cooling-mat":    899,
        "stay-prod-blanket-trav":   699,
        "stay-prod-bed-portable":  1299,
        "stay-prod-travel-food-":   449,
        "stay-prod-carrier-whee":  3499,
        "stay-prod-carrier-back":  2499,
        "stay-prod-anxiety-kit":    999,
        "stay-prod-bowl-collaps":   349,
        "stay-prod-motion-sickn":   449,
        "stay-prod-firstaid-kit":   899,
        "stay-prod-calming-trea":   399,
        "stay-prod-id-tags":        599,
        "stay-prod-pet-passport":   699,
        "stay-prod-waterbottle":    499,
        "stay-prod-carrier-airl":  4999,
    }
    price_updated = 0
    for prod_id, price in price_updates.items():
        r = await col.update_one(
            {"id": {"$regex": f"^{prod_id}"}},
            {"$set": {"price": price, "compare_at_price": round(price * 1.20, 2),
                      "pillars": ["go","travel","shop"], "updated_at": now}}
        )
        if r.modified_count:
            price_updated += 1

    print(f"✅ Updated prices on {price_updated}/19 existing travel products")

    client.close()

if __name__ == "__main__":
    asyncio.run(main())

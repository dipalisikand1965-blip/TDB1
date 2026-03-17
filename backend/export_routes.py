"""
Product Tags Export API
Provides downloadable CSV/JSON export of all products with their tags
"""

from fastapi import APIRouter, Response
from fastapi.responses import StreamingResponse
from datetime import datetime
import io
import csv
import json

router = APIRouter(prefix="/api/admin/export", tags=["export"])

# Database reference
db = None

def set_db(database):
    global db
    db = database

@router.get("/products-with-tags")
async def export_products_with_tags(format: str = "csv"):
    """
    Export all products with their tags.
    Supports CSV and JSON formats.
    """
    if db is None:
        return {"error": "Database not connected"}
    
    # Fetch all products with tags
    products = await db.products_master.find(
        {},
        {
            "_id": 0,
            "id": 1,
            "title": 1,
            "price": 1,
            "tags": 1,
            "collections": 1,
            "product_type": 1,
            "vendor": 1,
            "status": 1,
            "pillar": 1,
            "category": 1
        }
    ).to_list(10000)
    
    if format == "json":
        return {
            "generated_at": datetime.now().isoformat(),
            "total_products": len(products),
            "products": products
        }
    
    # CSV format
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow([
        "ID", "Title", "Price", "Tags", "Collections", 
        "Product Type", "Vendor", "Status", "Pillar", "Category"
    ])
    
    # Data
    for p in products:
        writer.writerow([
            p.get("id", ""),
            p.get("title", ""),
            p.get("price", ""),
            ", ".join(p.get("tags", [])) if p.get("tags") else "",
            ", ".join(p.get("collections", [])) if p.get("collections") else "",
            p.get("product_type", ""),
            p.get("vendor", ""),
            p.get("status", ""),
            p.get("pillar", ""),
            p.get("category", "")
        ])
    
    output.seek(0)
    csv_content = output.getvalue()
    
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=products_with_tags_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv",
            "Content-Type": "text/csv; charset=utf-8"
        }
    )


@router.get("/products-download")
async def products_download_page():
    """
    HTML page with download links for exports
    """
    html = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>TDB Export Downloads</title>
        <style>
            body { font-family: system-ui; padding: 40px; max-width: 600px; margin: 0 auto; }
            h1 { color: #6B21A8; }
            .btn { 
                display: inline-block; 
                padding: 12px 24px; 
                background: #6B21A8; 
                color: white; 
                text-decoration: none; 
                border-radius: 8px; 
                margin: 10px 5px;
            }
            .btn:hover { background: #581C87; }
            .btn-outline { 
                background: white; 
                border: 2px solid #6B21A8; 
                color: #6B21A8;
            }
        </style>
    </head>
    <body>
        <h1>🐕 TDB Export Downloads</h1>
        <p>Click the buttons below to download product and service data:</p>
        
        <h2>Products</h2>
        <a href="/api/admin/export/products-with-tags?format=csv" class="btn" download>📥 Download Products CSV</a>
        <a href="/api/admin/export/products-with-tags?format=json" class="btn btn-outline">📄 View Products JSON</a>
        
        <h2>Services</h2>
        <a href="/api/admin/export/services-with-tags?format=csv" class="btn" download>📥 Download Services CSV</a>
        <a href="/api/admin/export/services-with-tags?format=json" class="btn btn-outline">📄 View Services JSON</a>
        
        <p style="margin-top: 40px; color: #666;">
            Generated: """ + datetime.now().strftime('%Y-%m-%d %H:%M:%S') + """
        </p>
    </body>
    </html>
    """
    return Response(content=html, media_type="text/html")


@router.get("/services-with-tags")
async def export_services_with_tags(format: str = "csv"):
    """
    Export all services with their tags and pillar info.
    """
    if db is None:
        return {"error": "Database not connected"}
    
    # Fetch all services
    services = await db.service_catalog.find(
        {},
        {
            "_id": 0,
            "id": 1,
            "name": 1,
            "pillar": 1,
            "base_price": 1,
            "category": 1,
            "tags": 1,
            "is_bookable": 1,
            "is_free": 1,
            "status": 1
        }
    ).to_list(1000)
    
    if format == "json":
        return {
            "generated_at": datetime.now().isoformat(),
            "total_services": len(services),
            "services": services
        }
    
    # CSV format
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow([
        "ID", "Name", "Pillar", "Base Price", "Category", 
        "Tags", "Is Bookable", "Is Free", "Status"
    ])
    
    # Data
    for s in services:
        writer.writerow([
            s.get("id", ""),
            s.get("name", ""),
            s.get("pillar", ""),
            s.get("base_price", ""),
            s.get("category", ""),
            ", ".join(s.get("tags", [])) if s.get("tags") else "",
            s.get("is_bookable", ""),
            s.get("is_free", ""),
            s.get("status", "")
        ])
    
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=services_with_tags_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        }
    )


# ==================== CARE DATA EXPORTS ====================

@router.get("/care-products")
async def export_care_products():
    """Export all care products as CSV"""
    if db is None:
        return {"error": "Database not connected"}

    products = await db.products_master.find(
        {"pillar": "care"},
        {"_id": 0, "id": 1, "name": 1, "category": 1, "description": 1,
         "short_description": 1, "price": 1, "base_price": 1, "in_stock": 1,
         "pillar": 1, "pillars": 1, "image_url": 1, "breed_tags": 1,
         "age_groups": 1, "life_stages": 1, "dietary_flags": 1, "sensitivities": 1,
         "mira_hint": 1, "mira_can_reference": 1, "source": 1,
         "shopify_id": 1, "tags": 1, "ai_image_generated": 1, "ai_generated_image": 1}
    ).to_list(length=5000)

    output = io.StringIO()
    fields = ["id", "name", "category", "short_description", "description",
              "price", "base_price", "in_stock", "pillar", "pillars",
              "image_url", "image_type", "breed_tags", "age_groups",
              "life_stages", "dietary_flags", "sensitivities", "mira_hint",
              "mira_can_reference", "source", "shopify_id", "tags", "has_ai_image"]
    writer = csv.DictWriter(output, fieldnames=fields, extrasaction="ignore")
    writer.writeheader()
    for p in products:
        img = p.get("image_url", "")
        if "cloudinary" in img:        img_type = "cloudinary"
        elif "static.prod-images" in img: img_type = "dead_session_url"
        elif "unsplash" in img:          img_type = "unsplash"
        elif "shopify" in img:           img_type = "shopify_cdn"
        elif img:                        img_type = "other"
        else:                            img_type = "none"
        writer.writerow({
            "id": p.get("id", ""), "name": p.get("name", ""),
            "category": p.get("category", ""),
            "short_description": p.get("short_description", ""),
            "description": (p.get("description", "") or "")[:200],
            "price": p.get("price", 0), "base_price": p.get("base_price", 0),
            "in_stock": p.get("in_stock", True),
            "pillar": p.get("pillar", ""),
            "pillars": "|".join(p.get("pillars", []) or []),
            "image_url": img, "image_type": img_type,
            "breed_tags": "|".join(p.get("breed_tags", []) or []),
            "age_groups": "|".join(p.get("age_groups", []) or []),
            "life_stages": "|".join(p.get("life_stages", []) or []),
            "dietary_flags": "|".join(p.get("dietary_flags", []) or []),
            "sensitivities": "|".join(p.get("sensitivities", []) or []),
            "mira_hint": p.get("mira_hint", ""),
            "mira_can_reference": p.get("mira_can_reference", ""),
            "source": p.get("source", ""), "shopify_id": p.get("shopify_id", ""),
            "tags": "|".join(p.get("tags", []) or []) if isinstance(p.get("tags"), list) else str(p.get("tags", "")),
            "has_ai_image": p.get("ai_generated_image", p.get("ai_image_generated", False)),
        })
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]), media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=care_products_{datetime.now().strftime('%Y%m%d')}.csv"}
    )


@router.get("/care-services")
async def export_care_services():
    """Export all care services as CSV"""
    if db is None:
        return {"error": "Database not connected"}

    services = await db.services_master.find(
        {"pillar": "care"}, {"_id": 0}
    ).to_list(length=500)

    if not services:
        return {"error": "No care services found"}

    all_keys = set()
    for s in services:
        all_keys.update(s.keys())

    priority = ["id", "name", "tagline", "description", "pillar", "service_type",
                "price", "is_active", "is_free", "is_urgent",
                "image", "image_url", "watercolor_image",
                "steps", "accent_color", "soul_profile_prefills",
                "category", "sub_category", "features", "includes"]
    extra = sorted(all_keys - set(priority))
    fields = [f for f in priority if f in all_keys] + [f for f in extra if f not in priority]

    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=fields, extrasaction="ignore")
    writer.writeheader()
    for s in services:
        row = {}
        for k in fields:
            val = s.get(k, "")
            if isinstance(val, list):  val = "|".join(str(v) for v in val)
            elif isinstance(val, dict): val = str(val)[:200]
            row[k] = val
        writer.writerow(row)
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]), media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=care_services_{datetime.now().strftime('%Y%m%d')}.csv"}
    )


@router.get("/care-bundles")
async def export_care_bundles():
    """Export all care bundles (from care_bundles, product_bundles, bundles collections) as CSV"""
    if db is None:
        return {"error": "Database not connected"}

    all_bundles = []
    for col_name in ["care_bundles", "product_bundles", "bundles"]:
        col = db[col_name]
        docs = await col.find({"pillar": "care"}, {"_id": 0}).to_list(length=200)
        for d in docs:
            d["_source_collection"] = col_name
        all_bundles.extend(docs)

    if not all_bundles:
        return {"error": "No care bundles found"}

    all_keys = set()
    for b in all_bundles:
        all_keys.update(b.keys())

    priority = ["_source_collection", "id", "name", "pillar", "description",
                "price", "bundle_price", "individual_total", "saving",
                "product_ids", "items", "mira_pick", "image_url",
                "watercolor_image", "active", "is_active"]
    extra = sorted(all_keys - set(priority))
    fields = [f for f in priority if f in all_keys] + [f for f in extra if f not in priority]

    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=fields, extrasaction="ignore")
    writer.writeheader()
    for b in all_bundles:
        row = {}
        for k in fields:
            val = b.get(k, "")
            if isinstance(val, list):  val = "|".join(str(v) for v in val)
            elif isinstance(val, dict): val = str(val)[:300]
            row[k] = val
        writer.writerow(row)
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]), media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=care_bundles_{datetime.now().strftime('%Y%m%d')}.csv"}
    )

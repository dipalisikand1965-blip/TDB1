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
    products = await db.products.find(
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
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=products_with_tags_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        }
    )


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

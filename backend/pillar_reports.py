"""
Pillar Reports Routes
Revenue, commission, and performance reports broken down by pillar
"""

from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone, timedelta
from typing import Optional
import calendar

# Database reference
db = None
verify_admin = None

def set_pillar_reports_db(database):
    global db
    db = database

def set_pillar_reports_admin_verify(verify_func):
    global verify_admin
    verify_admin = verify_func

router = APIRouter(prefix="/api/admin/reports/pillars", tags=["Pillar Reports"])

# Helper functions
def get_date_range(period: str, start_date: str = None, end_date: str = None):
    """Get start and end dates based on period or custom dates"""
    now = datetime.now(timezone.utc)
    
    # Custom date range takes priority
    if start_date and end_date:
        try:
            start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            if not start.tzinfo:
                start = start.replace(tzinfo=timezone.utc)
            if not end.tzinfo:
                end = end.replace(tzinfo=timezone.utc)
            # Set end to end of day
            end = end.replace(hour=23, minute=59, second=59)
            return start.isoformat(), end.isoformat()
        except:
            pass  # Fall through to period-based logic
    
    if period == "today":
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        end = now
    elif period == "yesterday":
        start = (now - timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
        end = start.replace(hour=23, minute=59, second=59)
    elif period == "this_week":
        start = now - timedelta(days=now.weekday())
        start = start.replace(hour=0, minute=0, second=0, microsecond=0)
        end = now
    elif period == "last_week":
        start = now - timedelta(days=now.weekday() + 7)
        start = start.replace(hour=0, minute=0, second=0, microsecond=0)
        end = start + timedelta(days=6, hours=23, minutes=59, seconds=59)
    elif period == "this_month":
        start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        end = now
    elif period == "last_month":
        first_of_month = now.replace(day=1)
        last_month_end = first_of_month - timedelta(days=1)
        start = last_month_end.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        end = last_month_end.replace(hour=23, minute=59, second=59)
    elif period == "this_quarter":
        quarter = (now.month - 1) // 3
        start = now.replace(month=quarter * 3 + 1, day=1, hour=0, minute=0, second=0, microsecond=0)
        end = now
    elif period == "ytd" or period == "this_year":
        start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        end = now
    elif period == "last_30_days":
        start = now - timedelta(days=30)
        end = now
    elif period == "last_90_days":
        start = now - timedelta(days=90)
        end = now
    else:
        start = now - timedelta(days=30)
        end = now
    
    return start.isoformat(), end.isoformat()


@router.get("/summary")
async def get_pillar_summary(period: str = "this_month", start_date: str = None, end_date: str = None):
    """Get summary metrics for all pillars"""
    date_start, date_end = get_date_range(period, start_date, end_date)
    
    # Celebrate Pillar - Product Sales
    orders_query = {"created_at": {"$gte": date_start, "$lte": date_end}}
    orders = await db.orders.find(orders_query).to_list(10000)
    
    celebrate_revenue = sum(o.get("total", 0) for o in orders)
    celebrate_orders = len(orders)
    celebrate_items = sum(len(o.get("items", [])) for o in orders)
    
    # Calculate margin (estimated based on avg margin)
    pricing_data = await db.product_pricing.find({}).to_list(1000)
    avg_margin = sum(p.get("margin_percent", 100) for p in pricing_data) / len(pricing_data) if pricing_data else 100
    celebrate_profit = celebrate_revenue * (avg_margin / (100 + avg_margin))  # Approximate profit
    
    # Dine Pillar - Reservations
    reservations_query = {"created_at": {"$gte": date_start, "$lte": date_end}}
    reservations = await db.reservations.find(reservations_query).to_list(10000)
    visits = await db.buddy_visits.find(reservations_query).to_list(10000)
    
    dine_bookings = len(reservations) + len(visits)
    # Estimate commission (10% default)
    dine_commission = dine_bookings * 500  # Avg ₹500 commission per booking estimate
    
    # Get restaurant stats
    restaurants = await db.restaurants.find({}).to_list(500)
    active_restaurants = len([r for r in restaurants if r.get("is_active", True)])
    
    # Stay Pillar - Properties and Bookings
    stay_properties = await db.stay_properties.find({"status": "live"}).to_list(500) if "stay_properties" in await db.list_collection_names() else []
    stay_bookings_query = {"created_at": {"$gte": date_start, "$lte": date_end}}
    stay_bookings = await db.stay_bookings.find(stay_bookings_query).to_list(1000) if "stay_bookings" in await db.list_collection_names() else []
    
    stay_count = len(stay_bookings)
    stay_revenue = sum(b.get("total", 0) for b in stay_bookings)
    stay_commission = stay_revenue * 0.12  # 12% commission
    
    # Care Pillar - Vet/Grooming appointments
    care_appointments = await db.care_appointments.find({"created_at": {"$gte": date_start, "$lte": date_end}}).to_list(1000) if "care_appointments" in await db.list_collection_names() else []
    care_services = len(care_appointments)
    care_revenue = sum(a.get("total", 0) for a in care_appointments)
    care_commission = care_revenue * 0.10  # 10% commission
    
    # Travel Pillar - Pet travel requests
    travel_requests = await db.travel_requests.find({"created_at": {"$gte": date_start, "$lte": date_end}}).to_list(1000) if "travel_requests" in await db.list_collection_names() else []
    travel_bookings = len(travel_requests)
    travel_revenue = sum(t.get("estimated_cost", 0) for t in travel_requests)
    travel_commission = travel_revenue * 0.15  # 15% commission
    
    # Shop Pillar - E-commerce (same as celebrate for now)
    shop_orders = await db.orders.find({
        "created_at": {"$gte": date_start, "$lte": date_end},
        "category": {"$ne": "bakery"}  # Non-bakery orders
    }).to_list(1000)
    shop_revenue = sum(o.get("total", 0) for o in shop_orders)
    shop_orders_count = len(shop_orders)
    
    # Enjoy Pillar - Activities/Events
    activities = await db.activity_bookings.find({"created_at": {"$gte": date_start, "$lte": date_end}}).to_list(1000) if "activity_bookings" in await db.list_collection_names() else []
    enjoy_bookings = len(activities)
    enjoy_revenue = sum(a.get("total", 0) for a in activities)
    
    # Club Pillar - Community/Memberships
    memberships = await db.memberships.find({"created_at": {"$gte": date_start, "$lte": date_end}}).to_list(1000) if "memberships" in await db.list_collection_names() else []
    club_members = len(memberships)
    club_revenue = sum(m.get("amount", 0) for m in memberships)
    
    # Learn Pillar - Training/Courses
    enrollments = await db.enrollments.find({"created_at": {"$gte": date_start, "$lte": date_end}}).to_list(1000) if "enrollments" in await db.list_collection_names() else []
    learn_enrollments = len(enrollments)
    learn_revenue = sum(e.get("fee", 0) for e in enrollments)
    
    # Adopt Pillar - Adoption services
    adoptions = await db.adoptions.find({"created_at": {"$gte": date_start, "$lte": date_end}}).to_list(1000) if "adoptions" in await db.list_collection_names() else []
    adopt_count = len(adoptions)
    adopt_fees = sum(a.get("adoption_fee", 0) for a in adoptions)
    
    # Insure Pillar - Pet insurance
    policies = await db.insurance_policies.find({"created_at": {"$gte": date_start, "$lte": date_end}}).to_list(1000) if "insurance_policies" in await db.list_collection_names() else []
    insure_policies = len(policies)
    insure_revenue = sum(p.get("premium", 0) for p in policies)
    insure_commission = insure_revenue * 0.20  # 20% commission
    
    # Farewell Pillar - End of life services
    farewells = await db.farewell_services.find({"created_at": {"$gte": date_start, "$lte": date_end}}).to_list(1000) if "farewell_services" in await db.list_collection_names() else []
    farewell_services = len(farewells)
    farewell_revenue = sum(f.get("total", 0) for f in farewells)
    care_commission = 0
    
    return {
        "period": period,
        "date_range": {"start": start_date, "end": end_date},
        "pillars": {
            "celebrate": {
                "name": "Celebrate",
                "icon": "🎂",
                "revenue": round(celebrate_revenue, 2),
                "orders": celebrate_orders,
                "items_sold": celebrate_items,
                "estimated_profit": round(celebrate_profit, 2),
                "avg_margin": round(avg_margin, 1),
                "products_count": await db.products_master.count_documents({})
            },
            "dine": {
                "name": "Dine",
                "icon": "🍽️",
                "bookings": dine_bookings,
                "reservations": len(reservations),
                "buddy_visits": len(visits),
                "estimated_commission": round(dine_commission, 2),
                "active_restaurants": active_restaurants,
                "total_restaurants": len(restaurants)
            },
            "stay": {
                "name": "Stay",
                "icon": "🏨",
                "bookings": stay_count,
                "revenue": round(stay_revenue, 2),
                "estimated_commission": round(stay_commission, 2),
                "properties_count": len(stay_properties),
                "live_properties": len(stay_properties),
                "status": "active" if stay_properties else "coming_soon"
            },
            "travel": {
                "name": "Travel",
                "icon": "✈️",
                "bookings": travel_bookings,
                "commission": travel_commission,
                "status": "coming_soon"
            },
            "care": {
                "name": "Care",
                "icon": "💊",
                "services": care_services,
                "revenue": round(care_revenue, 2),
                "commission": round(care_commission, 2),
                "status": "active" if care_services > 0 else "coming_soon"
            },
            "shop": {
                "name": "Shop",
                "icon": "🛍️",
                "orders": shop_orders_count,
                "revenue": round(shop_revenue, 2),
                "status": "active" if shop_orders_count > 0 else "coming_soon"
            },
            "enjoy": {
                "name": "Enjoy",
                "icon": "🎉",
                "bookings": enjoy_bookings,
                "revenue": round(enjoy_revenue, 2),
                "status": "active" if enjoy_bookings > 0 else "coming_soon"
            },
            "club": {
                "name": "Club",
                "icon": "🤝",
                "members": club_members,
                "revenue": round(club_revenue, 2),
                "status": "active" if club_members > 0 else "coming_soon"
            },
            "learn": {
                "name": "Learn",
                "icon": "📚",
                "enrollments": learn_enrollments,
                "revenue": round(learn_revenue, 2),
                "status": "active" if learn_enrollments > 0 else "coming_soon"
            },
            "adopt": {
                "name": "Adopt",
                "icon": "🐕",
                "adoptions": adopt_count,
                "fees": round(adopt_fees, 2),
                "status": "active" if adopt_count > 0 else "coming_soon"
            },
            "insure": {
                "name": "Insure",
                "icon": "🛡️",
                "policies": insure_policies,
                "revenue": round(insure_revenue, 2),
                "commission": round(insure_commission, 2),
                "status": "active" if insure_policies > 0 else "coming_soon"
            },
            "farewell": {
                "name": "Farewell",
                "icon": "🌈",
                "services": farewell_services,
                "revenue": round(farewell_revenue, 2),
                "status": "active" if farewell_services > 0 else "coming_soon"
            }
        },
        "totals": {
            "total_revenue": round(celebrate_revenue + stay_revenue + care_revenue + travel_revenue + shop_revenue + enjoy_revenue + club_revenue + learn_revenue + adopt_fees + insure_revenue + farewell_revenue, 2),
            "total_commission": round(dine_commission + stay_commission + travel_commission + care_commission + insure_commission, 2),
            "total_bookings": celebrate_orders + dine_bookings + stay_count + travel_bookings + care_services + enjoy_bookings + learn_enrollments + adopt_count + farewell_services,
            "estimated_profit": round(celebrate_profit + dine_commission + stay_commission + care_commission + insure_commission, 2)
        }
    }


@router.get("/celebrate")
async def get_celebrate_report(period: str = "this_month"):
    """Detailed report for Celebrate pillar (products)"""
    start_date, end_date = get_date_range(period)
    
    # Get orders
    orders = await db.orders.find({
        "created_at": {"$gte": start_date, "$lte": end_date}
    }).to_list(10000)
    
    # Revenue metrics
    total_revenue = sum(o.get("total", 0) for o in orders)
    total_orders = len(orders)
    avg_order_value = total_revenue / total_orders if total_orders > 0 else 0
    
    # Product breakdown
    product_sales = {}
    category_sales = {}
    
    for order in orders:
        for item in order.get("items", []):
            pid = item.get("product_id", item.get("id", "unknown"))
            pname = item.get("name", "Unknown")
            category = item.get("category", "Other")
            qty = item.get("quantity", 1)
            price = item.get("price", 0) * qty
            
            if pid not in product_sales:
                product_sales[pid] = {"name": pname, "quantity": 0, "revenue": 0}
            product_sales[pid]["quantity"] += qty
            product_sales[pid]["revenue"] += price
            
            if category not in category_sales:
                category_sales[category] = {"quantity": 0, "revenue": 0}
            category_sales[category]["quantity"] += qty
            category_sales[category]["revenue"] += price
    
    # Top products
    top_products = sorted(product_sales.values(), key=lambda x: x["revenue"], reverse=True)[:10]
    
    # Category breakdown
    category_breakdown = [{"category": k, **v} for k, v in category_sales.items()]
    category_breakdown.sort(key=lambda x: x["revenue"], reverse=True)
    
    # GST collected (estimate at 5% avg)
    gst_collected = total_revenue * 0.05
    
    # Daily trend
    daily_revenue = {}
    for order in orders:
        date = order.get("created_at", "")[:10]
        if date:
            daily_revenue[date] = daily_revenue.get(date, 0) + order.get("total", 0)
    
    daily_trend = [{"date": k, "revenue": round(v, 2)} for k, v in sorted(daily_revenue.items())]
    
    # City breakdown
    city_revenue = {}
    for order in orders:
        city = order.get("shipping_address", {}).get("city", "Unknown")
        city_revenue[city] = city_revenue.get(city, 0) + order.get("total", 0)
    
    city_breakdown = [{"city": k, "revenue": round(v, 2)} for k, v in sorted(city_revenue.items(), key=lambda x: x[1], reverse=True)]
    
    return {
        "pillar": "celebrate",
        "period": period,
        "metrics": {
            "total_revenue": round(total_revenue, 2),
            "total_orders": total_orders,
            "avg_order_value": round(avg_order_value, 2),
            "items_sold": sum(p["quantity"] for p in product_sales.values()),
            "gst_collected": round(gst_collected, 2)
        },
        "top_products": top_products,
        "category_breakdown": category_breakdown[:10],
        "city_breakdown": city_breakdown[:10],
        "daily_trend": daily_trend[-30:]  # Last 30 days
    }


@router.get("/dine")
async def get_dine_report(period: str = "this_month"):
    """Detailed report for Dine pillar (restaurants)"""
    start_date, end_date = get_date_range(period)
    
    # Get reservations
    reservations = await db.reservations.find({
        "created_at": {"$gte": start_date, "$lte": end_date}
    }).to_list(10000)
    
    # Get buddy visits
    visits = await db.buddy_visits.find({
        "created_at": {"$gte": start_date, "$lte": end_date}
    }).to_list(10000)
    
    # Get all restaurants
    restaurants = await db.restaurants.find({}).to_list(500)
    restaurant_map = {r["id"]: r for r in restaurants}
    
    # Restaurant performance
    restaurant_bookings = {}
    for res in reservations:
        rid = res.get("restaurant_id", "unknown")
        if rid not in restaurant_bookings:
            restaurant_bookings[rid] = {"reservations": 0, "visits": 0, "guests": 0}
        restaurant_bookings[rid]["reservations"] += 1
        restaurant_bookings[rid]["guests"] += res.get("party_size", 2)
    
    for visit in visits:
        rid = visit.get("restaurant_id", "unknown")
        if rid not in restaurant_bookings:
            restaurant_bookings[rid] = {"reservations": 0, "visits": 0, "guests": 0}
        restaurant_bookings[rid]["visits"] += 1
    
    # Top restaurants
    top_restaurants = []
    for rid, stats in restaurant_bookings.items():
        restaurant = restaurant_map.get(rid, {})
        commission_type = restaurant.get("commission_type", "percentage")
        commission_value = restaurant.get("commission_value", 10)
        
        total_bookings = stats["reservations"] + stats["visits"]
        # Estimate commission
        if commission_type == "fixed":
            commission = total_bookings * commission_value
        else:
            commission = total_bookings * 500 * (commission_value / 100)  # Avg ₹500 bill
        
        top_restaurants.append({
            "id": rid,
            "name": restaurant.get("name", "Unknown"),
            "city": restaurant.get("city", "Unknown"),
            "reservations": stats["reservations"],
            "buddy_visits": stats["visits"],
            "total_bookings": total_bookings,
            "guests": stats["guests"],
            "estimated_commission": round(commission, 2)
        })
    
    top_restaurants.sort(key=lambda x: x["total_bookings"], reverse=True)
    
    # City breakdown
    city_bookings = {}
    for res in reservations:
        rid = res.get("restaurant_id")
        restaurant = restaurant_map.get(rid, {})
        city = restaurant.get("city", "Unknown")
        city_bookings[city] = city_bookings.get(city, 0) + 1
    
    city_breakdown = [{"city": k, "bookings": v} for k, v in sorted(city_bookings.items(), key=lambda x: x[1], reverse=True)]
    
    # Daily trend
    daily_bookings = {}
    for res in reservations:
        date = res.get("created_at", "")[:10]
        if date:
            daily_bookings[date] = daily_bookings.get(date, 0) + 1
    for visit in visits:
        date = visit.get("created_at", "")[:10]
        if date:
            daily_bookings[date] = daily_bookings.get(date, 0) + 1
    
    daily_trend = [{"date": k, "bookings": v} for k, v in sorted(daily_bookings.items())]
    
    # Total commission estimate
    total_commission = sum(r["estimated_commission"] for r in top_restaurants)
    
    return {
        "pillar": "dine",
        "period": period,
        "metrics": {
            "total_reservations": len(reservations),
            "total_buddy_visits": len(visits),
            "total_bookings": len(reservations) + len(visits),
            "total_guests": sum(r.get("party_size", 2) for r in reservations),
            "estimated_commission": round(total_commission, 2),
            "active_restaurants": len([r for r in restaurants if r.get("is_active", True)]),
            "total_restaurants": len(restaurants)
        },
        "top_restaurants": top_restaurants[:10],
        "city_breakdown": city_breakdown[:10],
        "daily_trend": daily_trend[-30:]
    }


@router.get("/stay")
async def get_stay_report(period: str = "this_month"):
    """Detailed report for Stay pillar (hotels/boarding)"""
    start_date, end_date = get_date_range(period)
    
    # Check if stay_properties collection exists
    collections = await db.list_collection_names()
    
    # Get stay properties
    stay_properties = await db.stay_properties.find({"status": "live"}).to_list(500) if "stay_properties" in collections else []
    
    if not stay_properties:
        return {
            "pillar": "stay",
            "period": period,
            "status": "no_properties",
            "message": "No live Stay properties yet. Seed properties via Admin → Stay → Seed Data.",
            "metrics": {
                "total_bookings": 0,
                "total_revenue": 0,
                "estimated_commission": 0,
                "properties_count": 0
            }
        }
    
    # Get bookings
    bookings = await db.stay_bookings.find({
        "created_at": {"$gte": start_date, "$lte": end_date}
    }).to_list(10000) if "stay_bookings" in collections else []
    
    property_map = {p["id"]: p for p in stay_properties}
    
    # Property performance
    property_bookings = {}
    for booking in bookings:
        pid = booking.get("property_id", "unknown")
        if pid not in property_bookings:
            property_bookings[pid] = {"bookings": 0, "revenue": 0, "nights": 0, "confirmed": 0, "pending": 0}
        property_bookings[pid]["bookings"] += 1
        property_bookings[pid]["revenue"] += booking.get("total", 0)
        # Calculate nights from dates
        try:
            check_in = booking.get("check_in_date", "")
            check_out = booking.get("check_out_date", "")
            if check_in and check_out:
                from datetime import datetime
                ci = datetime.strptime(check_in, "%Y-%m-%d")
                co = datetime.strptime(check_out, "%Y-%m-%d")
                nights = (co - ci).days
                property_bookings[pid]["nights"] += max(1, nights)
        except:
            property_bookings[pid]["nights"] += 1
        
        if booking.get("status") == "confirmed":
            property_bookings[pid]["confirmed"] += 1
        elif booking.get("status") == "pending":
            property_bookings[pid]["pending"] += 1
    
    # Top properties by bookings
    top_properties = []
    total_commission = 0
    for pid, stats in property_bookings.items():
        prop = property_map.get(pid, {})
        commercials = prop.get("commercials", {})
        commission_rate = commercials.get("commission_rate", 12)
        
        commission = stats["revenue"] * (commission_rate / 100)
        total_commission += commission
        
        top_properties.append({
            "id": pid,
            "name": prop.get("name", "Unknown"),
            "city": prop.get("city", "Unknown"),
            "property_type": prop.get("property_type", "Unknown"),
            "paw_rating": prop.get("paw_rating", {}).get("overall", 0),
            "bookings": stats["bookings"],
            "confirmed": stats["confirmed"],
            "pending": stats["pending"],
            "nights": stats["nights"],
            "revenue": round(stats["revenue"], 2),
            "estimated_commission": round(commission, 2)
        })
    
    top_properties.sort(key=lambda x: x["bookings"], reverse=True)
    
    # By property type
    by_type = {}
    for prop in stay_properties:
        ptype = prop.get("property_type", "other")
        if ptype not in by_type:
            by_type[ptype] = {"count": 0, "bookings": 0}
        by_type[ptype]["count"] += 1
        by_type[ptype]["bookings"] += property_bookings.get(prop["id"], {}).get("bookings", 0)
    
    # By city
    by_city = {}
    for prop in stay_properties:
        city = prop.get("city", "Unknown")
        if city not in by_city:
            by_city[city] = {"count": 0, "bookings": 0}
        by_city[city]["count"] += 1
        by_city[city]["bookings"] += property_bookings.get(prop["id"], {}).get("bookings", 0)
    
    # Booking status breakdown
    status_breakdown = {
        "pending": len([b for b in bookings if b.get("status") == "pending"]),
        "contacted": len([b for b in bookings if b.get("status") == "contacted"]),
        "confirmed": len([b for b in bookings if b.get("status") == "confirmed"]),
        "cancelled": len([b for b in bookings if b.get("status") == "cancelled"]),
        "completed": len([b for b in bookings if b.get("status") == "completed"])
    }
    
    # Get mismatch reports count
    mismatch_count = await db.policy_mismatch_reports.count_documents({"status": "open"}) if "policy_mismatch_reports" in collections else 0
    
    return {
        "pillar": "stay",
        "period": period,
        "date_range": {"start": start_date, "end": end_date},
        "status": "active",
        "metrics": {
            "total_properties": len(stay_properties),
            "live_properties": len([p for p in stay_properties if p.get("status") == "live"]),
            "with_pet_menu": len([p for p in stay_properties if p.get("pet_menu_available")]),
            "verified": len([p for p in stay_properties if p.get("verified")]),
            "total_bookings": len(bookings),
            "total_revenue": round(sum(b.get("total", 0) for b in bookings), 2),
            "estimated_commission": round(total_commission, 2),
            "avg_paw_rating": round(sum(p.get("paw_rating", {}).get("overall", 0) for p in stay_properties) / len(stay_properties), 2) if stay_properties else 0,
            "open_mismatch_reports": mismatch_count
        },
        "booking_status": status_breakdown,
        "top_properties": top_properties[:10],
        "by_property_type": [{"type": k, **v} for k, v in sorted(by_type.items(), key=lambda x: x[1]["bookings"], reverse=True)],
        "by_city": [{"city": k, **v} for k, v in sorted(by_city.items(), key=lambda x: x[1]["bookings"], reverse=True)][:10]
    }


@router.get("/comparison")
async def get_pillar_comparison(period: str = "this_month"):
    """Compare performance across all pillars"""
    summary = await get_pillar_summary(period)
    
    pillars = summary["pillars"]
    
    # Revenue comparison (for pillars with revenue)
    revenue_data = [
        {"pillar": "Celebrate", "value": pillars["celebrate"]["revenue"], "type": "Products"},
        {"pillar": "Stay", "value": pillars["stay"]["revenue"], "type": "Bookings"},
    ]
    
    # Commission comparison
    commission_data = [
        {"pillar": "Celebrate", "value": pillars["celebrate"]["estimated_profit"], "label": "Margin Profit"},
        {"pillar": "Dine", "value": pillars["dine"]["estimated_commission"], "label": "Commission"},
        {"pillar": "Stay", "value": pillars["stay"]["estimated_commission"], "label": "Commission"},
    ]
    
    # Bookings/Orders comparison
    activity_data = [
        {"pillar": "Celebrate", "value": pillars["celebrate"]["orders"], "label": "Orders"},
        {"pillar": "Dine", "value": pillars["dine"]["bookings"], "label": "Bookings"},
        {"pillar": "Stay", "value": pillars["stay"]["bookings"], "label": "Bookings"},
    ]
    
    # Calculate percentages
    total_profit = summary["totals"]["estimated_profit"]
    if total_profit > 0:
        for item in commission_data:
            item["percentage"] = round((item["value"] / total_profit) * 100, 1)
    
    return {
        "period": period,
        "revenue_comparison": revenue_data,
        "profit_comparison": commission_data,
        "activity_comparison": activity_data,
        "totals": summary["totals"],
        "insights": [
            f"Celebrate pillar generated ₹{pillars['celebrate']['revenue']:,.0f} in revenue",
            f"Dine pillar had {pillars['dine']['bookings']} bookings",
            f"Total estimated profit: ₹{total_profit:,.0f}"
        ]
    }


# ==================== PARTNER REPORTS ====================

@router.get("/partners")
async def get_partner_report(period: str = "this_month"):
    """Get partner application and performance report"""
    start_date, end_date = get_date_range(period)
    
    # Get all partner applications
    all_applications = await db.partner_applications.find({}).to_list(1000)
    
    # Filter by date range for new applications
    date_query = {"created_at": {"$gte": start_date, "$lte": end_date}}
    period_applications = await db.partner_applications.find(date_query).to_list(1000)
    
    # Status breakdown
    status_counts = {"pending": 0, "approved": 0, "rejected": 0, "under_review": 0}
    for app in all_applications:
        status = app.get("status", "pending").lower()
        if status in status_counts:
            status_counts[status] += 1
        else:
            status_counts["pending"] += 1
    
    # Category breakdown
    category_counts = {}
    for app in all_applications:
        category = app.get("business_category") or app.get("business_type") or "Other"
        category_counts[category] = category_counts.get(category, 0) + 1
    
    category_breakdown = [
        {"category": k, "count": v} 
        for k, v in sorted(category_counts.items(), key=lambda x: x[1], reverse=True)
    ]
    
    # City breakdown
    city_counts = {}
    for app in all_applications:
        city = app.get("city", "Unknown")
        city_counts[city] = city_counts.get(city, 0) + 1
    
    city_breakdown = [
        {"city": k, "count": v}
        for k, v in sorted(city_counts.items(), key=lambda x: x[1], reverse=True)
    ][:10]
    
    # Recent applications (last 10)
    recent_applications = sorted(
        all_applications, 
        key=lambda x: x.get("created_at", ""), 
        reverse=True
    )[:10]
    
    recent_list = []
    for app in recent_applications:
        recent_list.append({
            "id": app.get("id", str(app.get("_id", ""))),
            "business_name": app.get("business_name", "Unknown"),
            "category": app.get("business_category") or app.get("business_type") or "Other",
            "city": app.get("city", "Unknown"),
            "status": app.get("status", "pending"),
            "created_at": app.get("created_at", "")
        })
    
    # Get partner commissions earned (from restaurants)
    restaurants = await db.restaurants.find({"partner_id": {"$exists": True}}).to_list(500)
    reservations = await db.reservations.find(date_query).to_list(10000)
    
    partner_revenue = {}
    for res in reservations:
        partner_id = res.get("partner_id")
        if partner_id:
            est_commission = res.get("estimated_commission", 50)
            partner_revenue[partner_id] = partner_revenue.get(partner_id, 0) + est_commission
    
    total_commission = sum(partner_revenue.values())
    
    # Daily trend
    daily_apps = {}
    for app in period_applications:
        date = app.get("created_at", "")[:10]
        if date:
            daily_apps[date] = daily_apps.get(date, 0) + 1
    
    daily_trend = [{"date": k, "applications": v} for k, v in sorted(daily_apps.items())]
    
    return {
        "period": period,
        "metrics": {
            "total_applications": len(all_applications),
            "new_this_period": len(period_applications),
            "pending": status_counts["pending"],
            "approved": status_counts["approved"],
            "rejected": status_counts["rejected"],
            "under_review": status_counts["under_review"],
            "approval_rate": round(
                (status_counts["approved"] / len(all_applications) * 100) if all_applications else 0, 1
            ),
            "total_commission_earned": round(total_commission, 2)
        },
        "status_breakdown": [
            {"status": "Pending", "count": status_counts["pending"], "color": "#f59e0b"},
            {"status": "Under Review", "count": status_counts["under_review"], "color": "#3b82f6"},
            {"status": "Approved", "count": status_counts["approved"], "color": "#22c55e"},
            {"status": "Rejected", "count": status_counts["rejected"], "color": "#ef4444"}
        ],
        "category_breakdown": category_breakdown[:8],
        "city_breakdown": city_breakdown,
        "recent_applications": recent_list,
        "daily_trend": daily_trend[-30:]
    }


# ==================== MIRA AI REPORTS ====================

@router.get("/mira")
async def get_mira_report(period: str = "this_month"):
    """Get Mira AI chat analytics report"""
    start_date, end_date = get_date_range(period)
    
    # Get all chats
    all_chats = await db.mira_chats.find({}).to_list(10000)
    
    # Filter by date range
    date_query = {"created_at": {"$gte": start_date, "$lte": end_date}}
    period_chats = await db.mira_chats.find(date_query).to_list(10000)
    
    # If no date filtering works, use all chats
    if not period_chats:
        period_chats = all_chats
    
    # Calculate total messages
    total_messages = 0
    user_messages = 0
    ai_messages = 0
    
    for chat in all_chats:
        messages = chat.get("messages", [])
        total_messages += len(messages)
        for msg in messages:
            role = msg.get("role", "")
            if role == "user":
                user_messages += 1
            elif role == "assistant":
                ai_messages += 1
    
    # Service type breakdown
    service_counts = {}
    for chat in all_chats:
        service = chat.get("service_type", "General")
        service_counts[service] = service_counts.get(service, 0) + 1
    
    service_breakdown = [
        {"service": k, "count": v, "percentage": round(v / len(all_chats) * 100, 1) if all_chats else 0}
        for k, v in sorted(service_counts.items(), key=lambda x: x[1], reverse=True)
    ]
    
    # City breakdown
    city_counts = {}
    for chat in all_chats:
        city = chat.get("city", "Unknown")
        city_counts[city] = city_counts.get(city, 0) + 1
    
    city_breakdown = [
        {"city": k, "count": v}
        for k, v in sorted(city_counts.items(), key=lambda x: x[1], reverse=True)
    ][:10]
    
    # Status breakdown
    status_counts = {"active": 0, "resolved": 0, "converted": 0, "abandoned": 0}
    for chat in all_chats:
        status = chat.get("status", "active").lower()
        if status in status_counts:
            status_counts[status] += 1
        else:
            status_counts["active"] += 1
    
    # Pet info stats
    has_pet_info = sum(1 for c in all_chats if c.get("pet_name"))
    
    # Daily trend
    daily_chats = {}
    for chat in all_chats:
        date = chat.get("created_at", "")[:10]
        if date:
            daily_chats[date] = daily_chats.get(date, 0) + 1
    
    daily_trend = [{"date": k, "chats": v} for k, v in sorted(daily_chats.items())]
    
    # Average messages per chat
    avg_messages = total_messages / len(all_chats) if all_chats else 0
    
    # Calculate response rate (chats with AI responses / total chats)
    chats_with_response = sum(1 for c in all_chats if any(
        m.get("role") == "assistant" for m in c.get("messages", [])
    ))
    response_rate = (chats_with_response / len(all_chats) * 100) if all_chats else 0
    
    # Recent chats
    recent_chats = sorted(all_chats, key=lambda x: x.get("created_at", ""), reverse=True)[:10]
    recent_list = []
    for chat in recent_chats:
        messages = chat.get("messages", [])
        first_user_msg = next((m.get("content", "")[:100] for m in messages if m.get("role") == "user"), "No message")
        recent_list.append({
            "id": chat.get("id", str(chat.get("_id", ""))),
            "session_id": chat.get("session_id", "Unknown")[:20],
            "pet_name": chat.get("pet_name", "-"),
            "city": chat.get("city", "Unknown"),
            "service_type": chat.get("service_type", "General"),
            "messages_count": len(messages),
            "status": chat.get("status", "active"),
            "preview": first_user_msg,
            "created_at": chat.get("created_at", "")
        })
    
    # === CONVERSION TRACKING ===
    # Get orders within date range
    orders = await db.orders.find(date_query).to_list(10000)
    
    # Track conversions - chats that have linked orders or user emails matching order emails
    chat_emails = set()
    for chat in all_chats:
        email = chat.get("user_email") or chat.get("email")
        if email:
            chat_emails.add(email.lower())
    
    order_emails = set()
    for order in orders:
        email = order.get("email") or order.get("customer_email")
        if email:
            order_emails.add(email.lower())
    
    # Count chats with 'converted' status
    converted_count = status_counts.get("converted", 0)
    
    # Also count chats where user went on to place an order
    email_conversions = len(chat_emails & order_emails)
    
    # Total conversions (unique count)
    total_conversions = max(converted_count, email_conversions)
    
    # Calculate conversion rate
    conversion_rate = (total_conversions / len(all_chats) * 100) if all_chats else 0
    
    # Calculate revenue from converted chats
    converted_revenue = 0
    for order in orders:
        email = (order.get("email") or order.get("customer_email") or "").lower()
        if email in chat_emails:
            converted_revenue += order.get("total", 0) or order.get("amount", 0) or 0
    
    # Conversion by service type
    service_conversions = {}
    for chat in all_chats:
        if chat.get("status") == "converted":
            service = chat.get("service_type", "General")
            service_conversions[service] = service_conversions.get(service, 0) + 1
    
    conversion_by_service = [
        {"service": k, "conversions": v, "rate": round(v / service_counts.get(k, 1) * 100, 1)}
        for k, v in sorted(service_conversions.items(), key=lambda x: x[1], reverse=True)
    ]
    
    return {
        "period": period,
        "metrics": {
            "total_conversations": len(all_chats),
            "conversations_this_period": len(period_chats),
            "total_messages": total_messages,
            "user_messages": user_messages,
            "ai_responses": ai_messages,
            "avg_messages_per_chat": round(avg_messages, 1),
            "response_rate": round(response_rate, 1),
            "chats_with_pet_info": has_pet_info,
            "active_chats": status_counts["active"],
            "resolved_chats": status_counts["resolved"],
            "converted_chats": total_conversions,
            "conversion_rate": round(conversion_rate, 1),
            "converted_revenue": round(converted_revenue, 2)
        },
        "service_breakdown": service_breakdown[:8],
        "city_breakdown": city_breakdown,
        "status_breakdown": [
            {"status": "Active", "count": status_counts["active"], "color": "#22c55e"},
            {"status": "Resolved", "count": status_counts["resolved"], "color": "#3b82f6"},
            {"status": "Converted", "count": total_conversions, "color": "#9333ea"},
            {"status": "Abandoned", "count": status_counts["abandoned"], "color": "#6b7280"}
        ],
        "conversion_tracking": {
            "total_conversions": total_conversions,
            "conversion_rate": round(conversion_rate, 1),
            "converted_revenue": round(converted_revenue, 2),
            "by_service": conversion_by_service[:5]
        },
        "daily_trend": daily_trend[-30:],
        "recent_conversations": recent_list,
        "insights": [
            f"Total of {len(all_chats)} conversations with {total_messages} messages",
            f"Average {round(avg_messages, 1)} messages per conversation",
            f"Conversion rate: {round(conversion_rate, 1)}% ({total_conversions} orders)",
            f"Revenue from Mira chats: ₹{converted_revenue:,.0f}",
            f"{has_pet_info} conversations include pet information",
            f"Most popular service: {service_breakdown[0]['service'] if service_breakdown else 'N/A'}"
        ]
    }

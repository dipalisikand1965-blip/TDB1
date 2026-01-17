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
def get_date_range(period: str):
    """Get start and end dates based on period"""
    now = datetime.now(timezone.utc)
    
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
    elif period == "last_30_days":
        start = now - timedelta(days=30)
        end = now
    elif period == "last_90_days":
        start = now - timedelta(days=90)
        end = now
    elif period == "this_year":
        start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        end = now
    else:
        start = now - timedelta(days=30)
        end = now
    
    return start.isoformat(), end.isoformat()


@router.get("/summary")
async def get_pillar_summary(period: str = "this_month"):
    """Get summary metrics for all pillars"""
    start_date, end_date = get_date_range(period)
    
    # Celebrate Pillar - Product Sales
    orders_query = {"created_at": {"$gte": start_date, "$lte": end_date}}
    orders = await db.orders.find(orders_query).to_list(10000)
    
    celebrate_revenue = sum(o.get("total", 0) for o in orders)
    celebrate_orders = len(orders)
    celebrate_items = sum(len(o.get("items", [])) for o in orders)
    
    # Calculate margin (estimated based on avg margin)
    pricing_data = await db.product_pricing.find({}).to_list(1000)
    avg_margin = sum(p.get("margin_percent", 100) for p in pricing_data) / len(pricing_data) if pricing_data else 100
    celebrate_profit = celebrate_revenue * (avg_margin / (100 + avg_margin))  # Approximate profit
    
    # Dine Pillar - Reservations
    reservations_query = {"created_at": {"$gte": start_date, "$lte": end_date}}
    reservations = await db.reservations.find(reservations_query).to_list(10000)
    visits = await db.buddy_visits.find(reservations_query).to_list(10000)
    
    dine_bookings = len(reservations) + len(visits)
    # Estimate commission (10% default)
    dine_commission = dine_bookings * 500  # Avg ₹500 commission per booking estimate
    
    # Get restaurant stats
    restaurants = await db.restaurants.find({}).to_list(500)
    active_restaurants = len([r for r in restaurants if r.get("is_active", True)])
    
    # Stay Pillar - Bookings (if exists)
    stay_bookings_query = {"created_at": {"$gte": start_date, "$lte": end_date}}
    stay_bookings = await db.stay_bookings.find(stay_bookings_query).to_list(1000) if "stay_bookings" in await db.list_collection_names() else []
    
    stay_count = len(stay_bookings)
    stay_revenue = sum(b.get("total", 0) for b in stay_bookings)
    stay_commission = stay_revenue * 0.12  # 12% commission
    
    stays = await db.stays.find({}).to_list(500) if "stays" in await db.list_collection_names() else []
    
    # Travel & Care (placeholder - not yet built)
    travel_bookings = 0
    travel_commission = 0
    care_services = 0
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
                "products_count": await db.products.count_documents({})
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
                "properties_count": len(stays),
                "status": "active" if stays else "coming_soon"
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
                "commission": care_commission,
                "status": "coming_soon"
            }
        },
        "totals": {
            "total_revenue": round(celebrate_revenue + stay_revenue, 2),
            "total_commission": round(dine_commission + stay_commission + travel_commission + care_commission, 2),
            "total_bookings": celebrate_orders + dine_bookings + stay_count + travel_bookings,
            "estimated_profit": round(celebrate_profit + dine_commission + stay_commission, 2)
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
    
    # Check if stays collection exists
    collections = await db.list_collection_names()
    
    if "stays" not in collections:
        return {
            "pillar": "stay",
            "period": period,
            "status": "coming_soon",
            "message": "Stay pillar is not yet built. Coming soon!",
            "metrics": {
                "total_bookings": 0,
                "total_revenue": 0,
                "estimated_commission": 0,
                "properties_count": 0
            }
        }
    
    # Get stays
    stays = await db.stays.find({}).to_list(500)
    
    # Get bookings
    bookings = await db.stay_bookings.find({
        "created_at": {"$gte": start_date, "$lte": end_date}
    }).to_list(10000) if "stay_bookings" in collections else []
    
    stay_map = {s["id"]: s for s in stays}
    
    # Property performance
    property_bookings = {}
    for booking in bookings:
        sid = booking.get("stay_id", "unknown")
        if sid not in property_bookings:
            property_bookings[sid] = {"bookings": 0, "revenue": 0, "nights": 0}
        property_bookings[sid]["bookings"] += 1
        property_bookings[sid]["revenue"] += booking.get("total", 0)
        property_bookings[sid]["nights"] += booking.get("nights", 1)
    
    # Top properties
    top_properties = []
    for sid, stats in property_bookings.items():
        stay = stay_map.get(sid, {})
        commission_type = stay.get("commission_type", "percentage")
        commission_value = stay.get("commission_value", 12)
        
        if commission_type == "fixed":
            commission = stats["bookings"] * commission_value
        else:
            commission = stats["revenue"] * (commission_value / 100)
        
        top_properties.append({
            "id": sid,
            "name": stay.get("name", "Unknown"),
            "city": stay.get("city", "Unknown"),
            "bookings": stats["bookings"],
            "nights": stats["nights"],
            "revenue": round(stats["revenue"], 2),
            "estimated_commission": round(commission, 2)
        })
    
    top_properties.sort(key=lambda x: x["revenue"], reverse=True)
    
    total_revenue = sum(b.get("total", 0) for b in bookings)
    total_commission = sum(p["estimated_commission"] for p in top_properties)
    
    return {
        "pillar": "stay",
        "period": period,
        "status": "active" if stays else "coming_soon",
        "metrics": {
            "total_bookings": len(bookings),
            "total_revenue": round(total_revenue, 2),
            "total_nights": sum(b.get("nights", 1) for b in bookings),
            "estimated_commission": round(total_commission, 2),
            "properties_count": len(stays),
            "avg_booking_value": round(total_revenue / len(bookings), 2) if bookings else 0
        },
        "top_properties": top_properties[:10],
        "daily_trend": []  # Add if needed
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

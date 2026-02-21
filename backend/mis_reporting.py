"""
Real-Time MIS & Reporting Engine for The Doggy Company
Live dashboards and analytics across all pillars

Provides instant metrics for:
- Revenue & Sales
- Channel Performance
- Conversion Tracking
- Pillar-wise Analytics
- Service Desk Performance
"""

import os
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any, Literal
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)

# Create router
mis_router = APIRouter(prefix="/api/mis", tags=["MIS & Reporting"])

# Database reference
db: AsyncIOMotorDatabase = None

def set_database(database: AsyncIOMotorDatabase):
    global db
    db = database


# ==================== MODELS ====================

class DateRange(BaseModel):
    start: datetime
    end: datetime

class RevenueMetrics(BaseModel):
    total_revenue: float
    order_count: int
    average_order_value: float
    period: str

class ChannelMetrics(BaseModel):
    channel: str
    requests: int
    conversions: int
    conversion_rate: float
    revenue: float


# ==================== HELPER FUNCTIONS ====================

def get_date_range(period: str) -> tuple:
    """Get date range for period"""
    now = datetime.now(timezone.utc)
    
    if period == "today":
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == "yesterday":
        start = (now - timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
        now = start + timedelta(days=1)
    elif period == "week":
        start = now - timedelta(days=7)
    elif period == "month":
        start = now - timedelta(days=30)
    elif period == "quarter":
        start = now - timedelta(days=90)
    elif period == "year":
        start = now - timedelta(days=365)
    else:
        start = now - timedelta(days=7)
    
    return start.isoformat(), now.isoformat()


# ==================== REVENUE ENDPOINTS ====================

@mis_router.get("/revenue/summary")
async def get_revenue_summary(period: str = "week"):
    """Get revenue summary for period"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    start_date, end_date = get_date_range(period)
    
    # Get orders in period
    pipeline = [
        {"$match": {
            "created_at": {"$gte": start_date, "$lte": end_date},
            "status": {"$nin": ["cancelled", "refunded"]}
        }},
        {"$group": {
            "_id": None,
            "total_revenue": {"$sum": "$total"},
            "order_count": {"$sum": 1},
            "items_sold": {"$sum": {"$size": {"$ifNull": ["$items", []]}}}
        }}
    ]
    
    result = await db.orders.aggregate(pipeline).to_list(1)
    
    if not result:
        return {
            "period": period,
            "total_revenue": 0,
            "order_count": 0,
            "average_order_value": 0,
            "items_sold": 0
        }
    
    data = result[0]
    avg_value = data["total_revenue"] / data["order_count"] if data["order_count"] > 0 else 0
    
    return {
        "period": period,
        "total_revenue": round(data["total_revenue"], 2),
        "order_count": data["order_count"],
        "average_order_value": round(avg_value, 2),
        "items_sold": data.get("items_sold", 0)
    }


@mis_router.get("/revenue/by-day")
async def get_revenue_by_day(days: int = 7):
    """Get daily revenue breakdown"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    start_date = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    
    pipeline = [
        {"$match": {
            "created_at": {"$gte": start_date},
            "status": {"$nin": ["cancelled", "refunded"]}
        }},
        {"$addFields": {
            "date": {"$substr": ["$created_at", 0, 10]}
        }},
        {"$group": {
            "_id": "$date",
            "revenue": {"$sum": "$total"},
            "orders": {"$sum": 1}
        }},
        {"$sort": {"_id": 1}}
    ]
    
    results = await db.orders.aggregate(pipeline).to_list(100)
    
    return {
        "days": days,
        "data": [{"date": r["_id"], "revenue": r["revenue"], "orders": r["orders"]} for r in results]
    }


@mis_router.get("/revenue/by-category")
async def get_revenue_by_category(period: str = "month"):
    """Get revenue breakdown by product category"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    start_date, end_date = get_date_range(period)
    
    pipeline = [
        {"$match": {
            "created_at": {"$gte": start_date, "$lte": end_date},
            "status": {"$nin": ["cancelled", "refunded"]}
        }},
        {"$unwind": "$items"},
        {"$group": {
            "_id": {"$ifNull": ["$items.category", "uncategorized"]},
            "revenue": {"$sum": {"$multiply": [
                {"$ifNull": ["$items.price", 0]},
                {"$ifNull": ["$items.quantity", 1]}
            ]}},
            "quantity": {"$sum": {"$ifNull": ["$items.quantity", 1]}}
        }},
        {"$sort": {"revenue": -1}}
    ]
    
    results = await db.orders.aggregate(pipeline).to_list(100)
    
    return {
        "period": period,
        "categories": [
            {"category": r["_id"], "revenue": round(r["revenue"], 2), "quantity": r["quantity"]}
            for r in results
        ]
    }


# ==================== CHANNEL PERFORMANCE ====================

@mis_router.get("/channels/performance")
async def get_channel_performance(period: str = "week"):
    """Get performance metrics by channel"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    start_date, end_date = get_date_range(period)
    
    # Get intake stats
    intake_pipeline = [
        {"$match": {"created_at": {"$gte": start_date, "$lte": end_date}}},
        {"$group": {
            "_id": "$channel",
            "requests": {"$sum": 1},
            "converted": {"$sum": {"$cond": [{"$eq": ["$status", "converted"]}, 1, 0]}}
        }}
    ]
    
    intake_stats = await db.channel_intakes.aggregate(intake_pipeline).to_list(100)
    
    # Get order stats by source
    order_pipeline = [
        {"$match": {"created_at": {"$gte": start_date, "$lte": end_date}}},
        {"$group": {
            "_id": {"$ifNull": ["$source", "web"]},
            "orders": {"$sum": 1},
            "revenue": {"$sum": "$total"}
        }}
    ]
    
    order_stats = await db.orders.aggregate(order_pipeline).to_list(100)
    order_by_source = {s["_id"]: s for s in order_stats}
    
    # Combine stats
    channels = {}
    for intake in intake_stats:
        ch = intake["_id"]
        order_data = order_by_source.get(ch, {"orders": 0, "revenue": 0})
        
        channels[ch] = {
            "channel": ch,
            "requests": intake["requests"],
            "conversions": order_data["orders"],
            "conversion_rate": round(order_data["orders"] / intake["requests"] * 100, 1) if intake["requests"] > 0 else 0,
            "revenue": round(order_data["revenue"], 2)
        }
    
    # Add channels with orders but no intakes
    for source, data in order_by_source.items():
        if source not in channels:
            channels[source] = {
                "channel": source,
                "requests": data["orders"],
                "conversions": data["orders"],
                "conversion_rate": 100.0,
                "revenue": round(data["revenue"], 2)
            }
    
    return {
        "period": period,
        "channels": list(channels.values())
    }


# ==================== PILLAR ANALYTICS ====================

@mis_router.get("/pillars/summary")
async def get_pillar_summary(period: str = "month"):
    """Get summary metrics for each pillar"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    start_date, end_date = get_date_range(period)
    
    pillars = {
        "celebrate": {"name": "Celebrate (Bakery)", "revenue": 0, "orders": 0, "bookings": 0},
        "dine": {"name": "Dine", "revenue": 0, "orders": 0, "bookings": 0},
        "stay": {"name": "Stay (Pawcation)", "revenue": 0, "orders": 0, "bookings": 0},
        "travel": {"name": "Travel", "revenue": 0, "orders": 0, "bookings": 0},
        "care": {"name": "Care", "revenue": 0, "orders": 0, "bookings": 0}
    }
    
    # Get order revenue (Celebrate pillar)
    order_pipeline = [
        {"$match": {
            "created_at": {"$gte": start_date, "$lte": end_date},
            "status": {"$nin": ["cancelled", "refunded"]}
        }},
        {"$group": {
            "_id": None,
            "revenue": {"$sum": "$total"},
            "count": {"$sum": 1}
        }}
    ]
    
    order_result = await db.orders.aggregate(order_pipeline).to_list(1)
    if order_result:
        pillars["celebrate"]["revenue"] = round(order_result[0]["revenue"], 2)
        pillars["celebrate"]["orders"] = order_result[0]["count"]
    
    # Get Stay bookings
    stay_pipeline = [
        {"$match": {"created_at": {"$gte": start_date, "$lte": end_date}}},
        {"$group": {"_id": None, "count": {"$sum": 1}}}
    ]
    
    stay_result = await db.stay_bookings.aggregate(stay_pipeline).to_list(1)
    if stay_result:
        pillars["stay"]["bookings"] = stay_result[0]["count"]
    
    # Get Dine reservations
    dine_result = await db.dine_reservations.aggregate(stay_pipeline).to_list(1)
    if dine_result:
        pillars["dine"]["bookings"] = dine_result[0]["count"]
    
    return {
        "period": period,
        "pillars": pillars
    }


# ==================== SERVICE DESK METRICS ====================

@mis_router.get("/service-desk/metrics")
async def get_service_desk_metrics(period: str = "week"):
    """Get service desk performance metrics"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    start_date, end_date = get_date_range(period)
    
    # Ticket stats
    ticket_pipeline = [
        {"$match": {"created_at": {"$gte": start_date, "$lte": end_date}}},
        {"$group": {
            "_id": "$status",
            "count": {"$sum": 1}
        }}
    ]
    
    ticket_stats = await db.tickets.aggregate(ticket_pipeline).to_list(100)
    status_counts = {s["_id"]: s["count"] for s in ticket_stats}
    
    total_tickets = sum(status_counts.values())
    resolved = status_counts.get("resolved", 0) + status_counts.get("closed", 0)
    
    # By category
    category_pipeline = [
        {"$match": {"created_at": {"$gte": start_date, "$lte": end_date}}},
        {"$group": {"_id": "$category", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    
    category_stats = await db.tickets.aggregate(category_pipeline).to_list(100)
    
    # By priority
    priority_pipeline = [
        {"$match": {"created_at": {"$gte": start_date, "$lte": end_date}}},
        {"$group": {"_id": "$priority", "count": {"$sum": 1}}}
    ]
    
    priority_stats = await db.tickets.aggregate(priority_pipeline).to_list(100)
    
    return {
        "period": period,
        "total_tickets": total_tickets,
        "resolved": resolved,
        "resolution_rate": round(resolved / total_tickets * 100, 1) if total_tickets > 0 else 0,
        "by_status": status_counts,
        "by_category": [{"category": s["_id"], "count": s["count"]} for s in category_stats],
        "by_priority": {s["_id"]: s["count"] for s in priority_stats}
    }


# ==================== CONVERSION TRACKING ====================

@mis_router.get("/conversions/funnel")
async def get_conversion_funnel(period: str = "week"):
    """Get conversion funnel metrics"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    start_date, end_date = get_date_range(period)
    
    # Website visits (from analytics if available)
    visits = await db.analytics_events.count_documents({
        "event": "page_view",
        "timestamp": {"$gte": start_date, "$lte": end_date}
    }) if await db.list_collection_names().__contains__("analytics_events") else 0
    
    # Product views
    product_views = await db.analytics_events.count_documents({
        "event": "product_view",
        "timestamp": {"$gte": start_date, "$lte": end_date}
    }) if await db.list_collection_names().__contains__("analytics_events") else 0
    
    # Add to cart
    cart_adds = await db.analytics_events.count_documents({
        "event": "add_to_cart",
        "timestamp": {"$gte": start_date, "$lte": end_date}
    }) if await db.list_collection_names().__contains__("analytics_events") else 0
    
    # Checkout started
    checkouts = await db.analytics_events.count_documents({
        "event": "checkout_start",
        "timestamp": {"$gte": start_date, "$lte": end_date}
    }) if await db.list_collection_names().__contains__("analytics_events") else 0
    
    # Orders completed
    orders = await db.orders.count_documents({
        "created_at": {"$gte": start_date, "$lte": end_date}
    })
    
    return {
        "period": period,
        "funnel": [
            {"stage": "Site Visits", "count": visits or orders * 50},  # Estimate if no analytics
            {"stage": "Product Views", "count": product_views or orders * 20},
            {"stage": "Add to Cart", "count": cart_adds or orders * 5},
            {"stage": "Checkout Started", "count": checkouts or orders * 2},
            {"stage": "Orders Completed", "count": orders}
        ],
        "overall_conversion": round(orders / (visits or orders * 50) * 100, 2) if visits or orders else 0
    }


# ==================== REAL-TIME DASHBOARD ====================

@mis_router.get("/dashboard")
async def get_dashboard():
    """Get real-time dashboard with all key metrics"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    week_start = (now - timedelta(days=7)).isoformat()
    month_start = (now - timedelta(days=30)).isoformat()
    
    # Today's metrics
    today_orders = await db.orders.count_documents({"created_at": {"$gte": today_start}})
    today_revenue_result = await db.orders.aggregate([
        {"$match": {"created_at": {"$gte": today_start}}},
        {"$group": {"_id": None, "total": {"$sum": "$total"}}}
    ]).to_list(1)
    today_revenue = today_revenue_result[0]["total"] if today_revenue_result else 0
    
    # Week's metrics
    week_orders = await db.orders.count_documents({"created_at": {"$gte": week_start}})
    week_revenue_result = await db.orders.aggregate([
        {"$match": {"created_at": {"$gte": week_start}}},
        {"$group": {"_id": None, "total": {"$sum": "$total"}}}
    ]).to_list(1)
    week_revenue = week_revenue_result[0]["total"] if week_revenue_result else 0
    
    # Pending tickets
    pending_tickets = await db.tickets.count_documents({"status": {"$in": ["open", "pending", "in_progress"]}})
    
    # Recent intakes
    recent_intakes = await db.channel_intakes.count_documents({"created_at": {"$gte": today_start}})
    
    # Active stay bookings
    active_bookings = await db.stay_bookings.count_documents({"status": {"$in": ["confirmed", "pending"]}})
    
    return {
        "timestamp": now.isoformat(),
        "today": {
            "orders": today_orders,
            "revenue": round(today_revenue, 2)
        },
        "week": {
            "orders": week_orders,
            "revenue": round(week_revenue, 2)
        },
        "active": {
            "pending_tickets": pending_tickets,
            "channel_intakes": recent_intakes,
            "stay_bookings": active_bookings
        },
        "quick_stats": {
            "total_products": await db.products_master.count_documents({}),
            "total_customers": await db.users.count_documents({}),
            "total_orders_all_time": await db.orders.count_documents({})
        }
    }


@mis_router.get("/export/{report_type}")
async def export_report(
    report_type: str,
    period: str = "month",
    format: str = "json"
):
    """Export report data"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    start_date, end_date = get_date_range(period)
    
    if report_type == "orders":
        data = await db.orders.find(
            {"created_at": {"$gte": start_date, "$lte": end_date}},
            {"_id": 0}
        ).to_list(10000)
    elif report_type == "tickets":
        data = await db.tickets.find(
            {"created_at": {"$gte": start_date, "$lte": end_date}},
            {"_id": 0}
        ).to_list(10000)
    elif report_type == "intakes":
        data = await db.channel_intakes.find(
            {"created_at": {"$gte": start_date, "$lte": end_date}},
            {"_id": 0}
        ).to_list(10000)
    else:
        raise HTTPException(status_code=400, detail=f"Unknown report type: {report_type}")
    
    return {
        "report_type": report_type,
        "period": period,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "record_count": len(data),
        "data": data
    }

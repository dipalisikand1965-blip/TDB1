"""
Daily Email Reports Engine for The Doggy Company
Automated daily reports - works across all pillars
"""

import os
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorDatabase
import resend

logger = logging.getLogger(__name__)

# Initialize Resend
RESEND_API_KEY = os.environ.get("RESEND_API_KEY")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "woof@thedoggycompany.in")
if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY

# Security
security = HTTPBasic()
ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "woof2025")

def verify_admin(credentials: HTTPBasicCredentials = Depends(security)):
    if credentials.username != ADMIN_USERNAME or credentials.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return credentials.username

# Create router
reports_email_router = APIRouter(prefix="/api/email-reports", tags=["Email Reports"])

# Database reference
db: AsyncIOMotorDatabase = None

def set_database(database: AsyncIOMotorDatabase):
    global db
    db = database


# ==================== MODELS ====================

class ReportSubscription(BaseModel):
    """Email report subscription"""
    email: str
    name: str = ""
    report_types: List[str] = ["daily_summary"]  # daily_summary, weekly_digest, pillar_specific
    pillars: List[str] = ["all"]  # all, celebrate, dine, stay, travel, care
    frequency: str = "daily"  # daily, weekly
    enabled: bool = True


# ==================== REPORT TYPES ====================

REPORT_TYPES = {
    "daily_summary": {
        "label": "Daily Sales Summary",
        "description": "Orders, revenue, and key metrics from yesterday"
    },
    "weekly_digest": {
        "label": "Weekly Digest",
        "description": "Week-over-week comparison and trends"
    },
    "operations": {
        "label": "Operations Report",
        "description": "Pending orders, fulfilment status, alerts"
    },
    "customer_insights": {
        "label": "Customer Insights",
        "description": "New customers, reviews, feedback summary"
    },
    "birthday_alerts": {
        "label": "Birthday Alerts",
        "description": "Upcoming pet celebrations this week"
    }
}


# ==================== CORE FUNCTIONS ====================

async def generate_daily_report(
    report_date: Optional[datetime] = None,
    pillar: str = "all"
) -> Dict[str, Any]:
    """Generate daily report data"""
    
    if not report_date:
        report_date = datetime.now(timezone.utc) - timedelta(days=1)
    
    start_of_day = report_date.replace(hour=0, minute=0, second=0, microsecond=0)
    end_of_day = start_of_day + timedelta(days=1)
    
    # Query filter for orders
    order_query = {
        "created_at": {
            "$gte": start_of_day.isoformat(),
            "$lt": end_of_day.isoformat()
        }
    }
    
    if pillar != "all":
        order_query["pillar"] = pillar
    
    # Get orders
    orders = await db.orders.find(order_query, {"_id": 0}).to_list(1000)
    
    # Calculate metrics
    total_orders = len(orders)
    total_revenue = sum(float(o.get("total", 0) or 0) for o in orders)
    
    # By status
    status_counts = {}
    for order in orders:
        status = order.get("status", "unknown")
        status_counts[status] = status_counts.get(status, 0) + 1
    
    # By city
    city_revenue = {}
    for order in orders:
        city = order.get("customer", {}).get("city", "Unknown")
        city_revenue[city] = city_revenue.get(city, 0) + float(order.get("total", 0) or 0)
    
    # Autoship orders
    autoship_orders = [o for o in orders if o.get("is_autoship")]
    autoship_revenue = sum(float(o.get("total", 0) or 0) for o in autoship_orders)
    
    # Average order value
    aov = total_revenue / total_orders if total_orders > 0 else 0
    
    # New customers (orders from users who ordered for first time)
    new_customers = 0
    for order in orders:
        user_id = order.get("user_id")
        if user_id:
            # Check if this is their first order
            first_order = await db.orders.find_one({
                "user_id": user_id,
                "created_at": {"$lt": order.get("created_at")}
            })
            if not first_order:
                new_customers += 1
    
    # Top products
    product_sales = {}
    for order in orders:
        for item in order.get("items", []):
            product_name = item.get("title") or item.get("name", "Unknown")
            qty = item.get("quantity", 1)
            revenue = float(item.get("price", 0)) * qty
            if product_name not in product_sales:
                product_sales[product_name] = {"quantity": 0, "revenue": 0}
            product_sales[product_name]["quantity"] += qty
            product_sales[product_name]["revenue"] += revenue
    
    top_products = sorted(
        [{"name": k, **v} for k, v in product_sales.items()],
        key=lambda x: x["revenue"],
        reverse=True
    )[:5]
    
    # Compare with previous day
    prev_start = start_of_day - timedelta(days=1)
    prev_end = start_of_day
    prev_query = {
        "created_at": {
            "$gte": prev_start.isoformat(),
            "$lt": prev_end.isoformat()
        }
    }
    if pillar != "all":
        prev_query["pillar"] = pillar
    
    prev_orders = await db.orders.find(prev_query, {"_id": 0}).to_list(1000)
    prev_revenue = sum(float(o.get("total", 0) or 0) for o in prev_orders)
    
    revenue_change = ((total_revenue - prev_revenue) / prev_revenue * 100) if prev_revenue > 0 else 0
    orders_change = ((total_orders - len(prev_orders)) / len(prev_orders) * 100) if prev_orders else 0
    
    return {
        "report_date": report_date.strftime("%Y-%m-%d"),
        "pillar": pillar,
        "summary": {
            "total_orders": total_orders,
            "total_revenue": total_revenue,
            "average_order_value": round(aov, 2),
            "new_customers": new_customers,
            "autoship_orders": len(autoship_orders),
            "autoship_revenue": autoship_revenue
        },
        "comparison": {
            "revenue_change_percent": round(revenue_change, 1),
            "orders_change_percent": round(orders_change, 1),
            "previous_day_revenue": prev_revenue,
            "previous_day_orders": len(prev_orders)
        },
        "by_status": status_counts,
        "by_city": city_revenue,
        "top_products": top_products
    }


async def generate_operations_report() -> Dict[str, Any]:
    """Generate operations report - pending orders, alerts"""
    
    today = datetime.now(timezone.utc).date()
    tomorrow = today + timedelta(days=1)
    
    # Pending orders
    pending_orders = await db.orders.count_documents({
        "status": {"$in": ["pending", "confirmed"]}
    })
    
    # Orders for today's delivery
    today_deliveries = await db.orders.count_documents({
        "delivery_date": today.isoformat(),
        "status": {"$nin": ["delivered", "cancelled"]}
    })
    
    # Orders for tomorrow's delivery
    tomorrow_deliveries = await db.orders.count_documents({
        "delivery_date": tomorrow.isoformat()
    })
    
    # Overdue orders (past delivery date, not delivered)
    overdue_orders = await db.orders.find({
        "delivery_date": {"$lt": today.isoformat()},
        "status": {"$nin": ["delivered", "cancelled"]}
    }, {"_id": 0, "orderId": 1, "customer": 1, "delivery_date": 1}).to_list(50)
    
    # Urgent concierge notes
    urgent_notes = await db.concierge_notes.count_documents({
        "priority": "urgent",
        "is_resolved": {"$ne": True}
    })
    
    # Pending reviews
    pending_reviews = await db.reviews.count_documents({
        "status": "pending"
    })
    
    # Abandoned carts (last 24h)
    yesterday = datetime.now(timezone.utc) - timedelta(days=1)
    abandoned_carts = await db.abandoned_carts.count_documents({
        "created_at": {"$gte": yesterday.isoformat()},
        "recovered": {"$ne": True}
    })
    
    return {
        "report_date": today.isoformat(),
        "pending_orders": pending_orders,
        "today_deliveries": today_deliveries,
        "tomorrow_deliveries": tomorrow_deliveries,
        "overdue_orders": len(overdue_orders),
        "overdue_details": overdue_orders[:10],
        "urgent_notes": urgent_notes,
        "pending_reviews": pending_reviews,
        "abandoned_carts_24h": abandoned_carts
    }


async def generate_birthday_report() -> Dict[str, Any]:
    """Generate upcoming birthdays report"""
    from birthday_engine import get_upcoming_celebrations
    
    celebrations = await get_upcoming_celebrations(days_ahead=7)
    
    return {
        "report_date": datetime.now(timezone.utc).date().isoformat(),
        "upcoming_7_days": len(celebrations),
        "celebrations": celebrations,
        "promotions_pending": len([c for c in celebrations if not c.get("promotion_sent")])
    }


def format_currency(amount: float) -> str:
    """Format amount as Indian currency"""
    return f"₹{amount:,.0f}"


async def send_daily_report_email(
    recipient_email: str,
    recipient_name: str = "",
    report_types: List[str] = ["daily_summary"],
    pillar: str = "all"
) -> Dict[str, Any]:
    """Send daily report email"""
    
    if not RESEND_API_KEY:
        return {"success": False, "error": "Email not configured"}
    
    # Generate reports
    reports_html = []
    
    if "daily_summary" in report_types:
        daily_data = await generate_daily_report(pillar=pillar)
        summary = daily_data["summary"]
        comparison = daily_data["comparison"]
        
        # Trend arrows
        revenue_arrow = "📈" if comparison["revenue_change_percent"] > 0 else "📉" if comparison["revenue_change_percent"] < 0 else "➡️"
        
        daily_html = f"""
        <div style="background: #fdf4ff; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
            <h2 style="color: #9333ea; margin-top: 0;">📊 Daily Sales Summary</h2>
            <p style="color: #666; font-size: 14px;">Report for {daily_data['report_date']} | {pillar.title() if pillar != 'all' else 'All Pillars'}</p>
            
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 20px 0;">
                <div style="background: white; padding: 15px; border-radius: 8px; text-align: center;">
                    <p style="margin: 0; color: #666; font-size: 12px;">Total Revenue</p>
                    <p style="margin: 5px 0; font-size: 24px; font-weight: bold; color: #9333ea;">{format_currency(summary['total_revenue'])}</p>
                    <p style="margin: 0; font-size: 12px; color: {'green' if comparison['revenue_change_percent'] > 0 else 'red'};">
                        {revenue_arrow} {comparison['revenue_change_percent']:+.1f}% vs prev day
                    </p>
                </div>
                <div style="background: white; padding: 15px; border-radius: 8px; text-align: center;">
                    <p style="margin: 0; color: #666; font-size: 12px;">Total Orders</p>
                    <p style="margin: 5px 0; font-size: 24px; font-weight: bold; color: #333;">{summary['total_orders']}</p>
                    <p style="margin: 0; font-size: 12px; color: #666;">AOV: {format_currency(summary['average_order_value'])}</p>
                </div>
                <div style="background: white; padding: 15px; border-radius: 8px; text-align: center;">
                    <p style="margin: 0; color: #666; font-size: 12px;">New Customers</p>
                    <p style="margin: 5px 0; font-size: 24px; font-weight: bold; color: #22c55e;">{summary['new_customers']}</p>
                    <p style="margin: 0; font-size: 12px; color: #666;">Autoship: {summary['autoship_orders']}</p>
                </div>
            </div>
            
            <h3 style="color: #333; margin-top: 20px;">🏆 Top Products</h3>
            <table style="width: 100%; border-collapse: collapse;">
                {''.join(f'<tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 8px 0;">{p["name"][:40]}</td><td style="text-align: right; padding: 8px 0;">{format_currency(p["revenue"])}</td></tr>' for p in daily_data['top_products'][:5])}
            </table>
            
            <h3 style="color: #333; margin-top: 20px;">🗺️ Revenue by City</h3>
            <table style="width: 100%; border-collapse: collapse;">
                {''.join(f'<tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 8px 0;">{city}</td><td style="text-align: right; padding: 8px 0;">{format_currency(rev)}</td></tr>' for city, rev in sorted(daily_data['by_city'].items(), key=lambda x: x[1], reverse=True)[:5])}
            </table>
        </div>
        """
        reports_html.append(daily_html)
    
    if "operations" in report_types:
        ops_data = await generate_operations_report()
        
        ops_html = f"""
        <div style="background: #fef3c7; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
            <h2 style="color: #d97706; margin-top: 0;">⚙️ Operations Summary</h2>
            
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 15px 0;">
                <div style="background: white; padding: 12px; border-radius: 8px; text-align: center;">
                    <p style="margin: 0; font-size: 11px; color: #666;">Pending</p>
                    <p style="margin: 5px 0; font-size: 20px; font-weight: bold;">{ops_data['pending_orders']}</p>
                </div>
                <div style="background: white; padding: 12px; border-radius: 8px; text-align: center;">
                    <p style="margin: 0; font-size: 11px; color: #666;">Today's Delivery</p>
                    <p style="margin: 5px 0; font-size: 20px; font-weight: bold; color: #2563eb;">{ops_data['today_deliveries']}</p>
                </div>
                <div style="background: white; padding: 12px; border-radius: 8px; text-align: center;">
                    <p style="margin: 0; font-size: 11px; color: #666;">Tomorrow</p>
                    <p style="margin: 5px 0; font-size: 20px; font-weight: bold;">{ops_data['tomorrow_deliveries']}</p>
                </div>
                <div style="background: {'#fee2e2' if ops_data['overdue_orders'] > 0 else 'white'}; padding: 12px; border-radius: 8px; text-align: center;">
                    <p style="margin: 0; font-size: 11px; color: #666;">Overdue</p>
                    <p style="margin: 5px 0; font-size: 20px; font-weight: bold; color: {'#dc2626' if ops_data['overdue_orders'] > 0 else '#333'};">{ops_data['overdue_orders']}</p>
                </div>
            </div>
            
            {'<p style="color: #dc2626; font-weight: bold;">⚠️ ' + str(ops_data["urgent_notes"]) + ' urgent concierge notes need attention!</p>' if ops_data['urgent_notes'] > 0 else ''}
        </div>
        """
        reports_html.append(ops_html)
    
    if "birthday_alerts" in report_types:
        bday_data = await generate_birthday_report()
        
        # Build celebration table rows
        bday_rows = ""
        for c in bday_data["celebrations"][:5]:
            bday_rows += f'<tr style="border-bottom: 1px solid #f9a8d4;"><td style="padding: 8px 0;">{c["emoji"]} {c["pet_name"]}</td><td>{c["celebration_label"]}</td><td style="text-align: right;">{c["display_date"]} ({c["days_until"]}d)</td></tr>'
        
        bday_html = f"""
        <div style="background: #fce7f3; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
            <h2 style="color: #db2777; margin-top: 0;">🎂 Birthday Alerts</h2>
            <p><strong>{bday_data['upcoming_7_days']}</strong> pet celebrations in the next 7 days</p>
            <p><strong>{bday_data['promotions_pending']}</strong> promotions waiting to be sent</p>
            
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                {bday_rows}
            </table>
        </div>
        """
        reports_html.append(bday_html)
    
    # Compose email
    report_date = datetime.now(timezone.utc).strftime("%B %d, %Y")
    
    email_html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #9333ea, #ec4899); padding: 25px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">📈 Daily Business Report</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 14px;">{report_date}</p>
        </div>
        
        <div style="padding: 25px; background: white;">
            <p>Hi {recipient_name or 'there'}!</p>
            <p>Here's your daily business update from The Doggy Company:</p>
            
            {''.join(reports_html)}
            
            <div style="text-align: center; margin-top: 25px;">
                <a href="https://thedoggycompany.in/admin" style="display: inline-block; background: #9333ea; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                    Open Admin Dashboard →
                </a>
            </div>
        </div>
        
        <div style="text-align: center; padding: 15px; color: #666; font-size: 11px; background: #f9fafb; border-radius: 0 0 12px 12px;">
            <p style="margin: 0;">The Doggy Company - Pet Life Operating System</p>
            <p style="margin: 5px 0 0;">You're receiving this because you're subscribed to daily reports.</p>
        </div>
    </div>
    """
    
    try:
        resend.Emails.send({
            "from": f"The Doggy Company Reports <{SENDER_EMAIL}>",
            "to": [recipient_email],
            "subject": f"📈 Daily Report - {report_date}",
            "html": email_html
        })
        
        # Log the sent report
        await db.email_reports_log.insert_one({
            "recipient_email": recipient_email,
            "report_types": report_types,
            "pillar": pillar,
            "sent_at": datetime.now(timezone.utc).isoformat(),
            "success": True
        })
        
        logger.info(f"Daily report sent to {recipient_email}")
        return {"success": True, "recipient": recipient_email}
        
    except Exception as e:
        logger.error(f"Failed to send daily report: {e}")
        return {"success": False, "error": str(e)}


async def process_daily_reports():
    """Process and send all scheduled daily reports"""
    
    # Get all active subscriptions
    subscriptions = await db.report_subscriptions.find({
        "enabled": True,
        "frequency": "daily"
    }).to_list(100)
    
    results = []
    for sub in subscriptions:
        result = await send_daily_report_email(
            recipient_email=sub["email"],
            recipient_name=sub.get("name", ""),
            report_types=sub.get("report_types", ["daily_summary"]),
            pillar=sub.get("pillars", ["all"])[0]  # For now, use first pillar
        )
        results.append({
            "email": sub["email"],
            **result
        })
    
    return results


# ==================== API ENDPOINTS ====================

@reports_email_router.get("/types")
async def get_report_types():
    """Get available report types"""
    return {"report_types": REPORT_TYPES}


@reports_email_router.get("/preview/daily")
async def preview_daily_report(
    pillar: str = Query("all"),
    username: str = Depends(verify_admin)
):
    """Preview daily report data"""
    data = await generate_daily_report(pillar=pillar)
    return data


@reports_email_router.get("/preview/operations")
async def preview_operations_report(username: str = Depends(verify_admin)):
    """Preview operations report data"""
    data = await generate_operations_report()
    return data


@reports_email_router.post("/send")
async def send_report_now(
    email: str = Query(...),
    name: str = Query(""),
    report_types: str = Query("daily_summary,operations"),
    pillar: str = Query("all"),
    username: str = Depends(verify_admin)
):
    """Send report immediately to specified email"""
    types_list = [t.strip() for t in report_types.split(",")]
    
    result = await send_daily_report_email(
        recipient_email=email,
        recipient_name=name,
        report_types=types_list,
        pillar=pillar
    )
    return result


@reports_email_router.get("/subscriptions")
async def get_subscriptions(username: str = Depends(verify_admin)):
    """Get all report subscriptions"""
    subs = await db.report_subscriptions.find({}, {"_id": 0}).to_list(100)
    return {"subscriptions": subs, "count": len(subs)}


@reports_email_router.post("/subscriptions")
async def create_subscription(
    sub: ReportSubscription,
    username: str = Depends(verify_admin)
):
    """Create or update a report subscription"""
    sub_data = sub.model_dump()
    sub_data["created_at"] = datetime.now(timezone.utc).isoformat()
    sub_data["created_by"] = username
    
    # Upsert by email
    await db.report_subscriptions.update_one(
        {"email": sub.email},
        {"$set": sub_data},
        upsert=True
    )
    
    return {"message": "Subscription saved", "subscription": sub_data}


@reports_email_router.delete("/subscriptions/{email}")
async def delete_subscription(email: str, username: str = Depends(verify_admin)):
    """Delete a report subscription"""
    result = await db.report_subscriptions.delete_one({"email": email})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    return {"message": "Subscription deleted", "email": email}


@reports_email_router.post("/process")
async def trigger_process_reports(username: str = Depends(verify_admin)):
    """Manually trigger processing of all daily reports"""
    results = await process_daily_reports()
    return {
        "message": f"Processed {len(results)} reports",
        "results": results
    }


@reports_email_router.get("/log")
async def get_reports_log(
    limit: int = Query(50),
    username: str = Depends(verify_admin)
):
    """Get log of sent reports"""
    logs = await db.email_reports_log.find({}, {"_id": 0}).sort("sent_at", -1).limit(limit).to_list(limit)
    return {"logs": logs, "count": len(logs)}

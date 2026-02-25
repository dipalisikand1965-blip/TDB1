"""
Advanced Analytics Routes for The Doggy Company
Revenue, Ticket, Agent Performance, and NPS Analytics
"""

from fastapi import APIRouter
from datetime import datetime, timezone, timedelta

router = APIRouter(prefix="/analytics", tags=["Analytics"])

# Database reference (set from server.py)
db = None

def set_database(database):
    global db
    db = database


@router.get("/revenue")
async def get_revenue_analytics(days: int = 30):
    """Get revenue analytics for the specified period"""
    from_date = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    
    # Get orders in period
    orders = await db.orders.find({
        "created_at": {"$gte": from_date}
    }).to_list(10000)
    
    total_revenue = sum(o.get("total", 0) for o in orders)
    order_count = len(orders)
    avg_order = int(total_revenue / order_count) if order_count > 0 else 0
    
    # Get unique customers
    customer_emails = set(o.get("customer", {}).get("email") or o.get("customer_email") for o in orders)
    customer_emails.discard(None)
    
    # Calculate revenue by pillar
    pillar_revenue = {}
    for order in orders:
        pillar = order.get("pillar", "shop")
        pillar_revenue[pillar] = pillar_revenue.get(pillar, 0) + order.get("total", 0)
    
    # Get previous period for trend comparison
    prev_from = (datetime.now(timezone.utc) - timedelta(days=days*2)).isoformat()
    prev_to = from_date
    prev_orders = await db.orders.find({
        "created_at": {"$gte": prev_from, "$lt": prev_to}
    }).to_list(10000)
    prev_revenue = sum(o.get("total", 0) for o in prev_orders)
    
    trend = 0
    if prev_revenue > 0:
        trend = int(((total_revenue - prev_revenue) / prev_revenue) * 100)
    
    return {
        "total": total_revenue,
        "orders": order_count,
        "customers": len(customer_emails),
        "average": avg_order,
        "trend": trend,
        "by_pillar": [
            {"id": k, "revenue": v, "percentage": int((v/total_revenue)*100) if total_revenue > 0 else 0}
            for k, v in sorted(pillar_revenue.items(), key=lambda x: x[1], reverse=True)
        ]
    }


@router.get("/tickets")
async def get_ticket_analytics(days: int = 30):
    """Get ticket/service analytics for the specified period"""
    from_date = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    
    # Get all tickets in period
    tickets = await db.service_desk_tickets.find({
        "created_at": {"$gte": from_date}
    }).to_list(10000)
    
    total_tickets = len(tickets)
    resolved = sum(1 for t in tickets if t.get("status") == "resolved")
    open_tickets = sum(1 for t in tickets if t.get("status") in ["pending", "in_progress", "open"])
    escalated = sum(1 for t in tickets if t.get("escalated"))
    
    # Calculate SLA metrics
    sla_met = 0
    sla_breaches = 0
    total_resolution_hours = 0
    resolved_count = 0
    
    for ticket in tickets:
        if ticket.get("status") == "resolved":
            resolved_count += 1
            # Calculate resolution time
            created = ticket.get("created_at")
            resolved_at = ticket.get("resolved_at")
            if created and resolved_at:
                try:
                    created_dt = datetime.fromisoformat(created.replace('Z', '+00:00'))
                    resolved_dt = datetime.fromisoformat(resolved_at.replace('Z', '+00:00'))
                    hours = (resolved_dt - created_dt).total_seconds() / 3600
                    total_resolution_hours += hours
                    
                    # Check SLA (assume 24h for now)
                    sla_target = 24
                    priority = ticket.get("priority_bucket", "medium")
                    if priority == "urgent":
                        sla_target = 4
                    elif priority == "high":
                        sla_target = 8
                    elif priority == "medium":
                        sla_target = 24
                    else:
                        sla_target = 48
                    
                    if hours <= sla_target:
                        sla_met += 1
                    else:
                        sla_breaches += 1
                except:
                    pass
    
    avg_resolution = round(total_resolution_hours / resolved_count, 1) if resolved_count > 0 else 0
    sla_compliance = round((sla_met / (sla_met + sla_breaches)) * 100) if (sla_met + sla_breaches) > 0 else 100
    
    # Tickets by pillar
    by_pillar = {}
    for ticket in tickets:
        pillar = ticket.get("pillar", "general")
        by_pillar[pillar] = by_pillar.get(pillar, 0) + 1
    
    # Tickets by priority
    by_priority = {}
    for ticket in tickets:
        priority = ticket.get("priority_bucket", "medium")
        by_priority[priority] = by_priority.get(priority, 0) + 1
    
    return {
        "total": total_tickets,
        "resolved": resolved,
        "open": open_tickets,
        "escalated": escalated,
        "avg_resolution": avg_resolution,
        "sla": {
            "compliance_rate": sla_compliance,
            "met": sla_met,
            "breaches": sla_breaches,
            "at_risk": open_tickets,
            "by_priority": {
                p: {"compliance": round((by_priority.get(p, 0) / total_tickets) * 100) if total_tickets > 0 else 0}
                for p in ["urgent", "high", "medium", "low"]
            }
        },
        "by_pillar": [
            {"id": k, "tickets": v, "percentage": int((v/total_tickets)*100) if total_tickets > 0 else 0}
            for k, v in sorted(by_pillar.items(), key=lambda x: x[1], reverse=True)
        ],
        "by_priority": by_priority
    }


@router.get("/agents")
async def get_agent_analytics(days: int = 30):
    """Get agent performance analytics"""
    from_date = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    
    # Get resolved tickets with agent info
    tickets = await db.service_desk_tickets.find({
        "created_at": {"$gte": from_date},
        "status": "resolved",
        "assigned_to": {"$exists": True, "$ne": None}
    }).to_list(10000)
    
    # Aggregate by agent
    agent_stats = {}
    for ticket in tickets:
        agent_id = ticket.get("assigned_to")
        agent_name = ticket.get("assigned_name", "Unknown Agent")
        
        if agent_id not in agent_stats:
            agent_stats[agent_id] = {
                "id": agent_id,
                "name": agent_name,
                "tickets_resolved": 0,
                "total_hours": 0,
                "sla_met": 0,
                "sla_breached": 0
            }
        
        agent_stats[agent_id]["tickets_resolved"] += 1
        
        # Calculate resolution time
        created = ticket.get("created_at")
        resolved_at = ticket.get("resolved_at")
        if created and resolved_at:
            try:
                created_dt = datetime.fromisoformat(created.replace('Z', '+00:00'))
                resolved_dt = datetime.fromisoformat(resolved_at.replace('Z', '+00:00'))
                hours = (resolved_dt - created_dt).total_seconds() / 3600
                agent_stats[agent_id]["total_hours"] += hours
                
                # Check SLA
                priority = ticket.get("priority_bucket", "medium")
                sla_targets = {"urgent": 4, "high": 8, "medium": 24, "low": 48}
                sla_target = sla_targets.get(priority, 24)
                
                if hours <= sla_target:
                    agent_stats[agent_id]["sla_met"] += 1
                else:
                    agent_stats[agent_id]["sla_breached"] += 1
            except:
                pass
    
    # Calculate averages and compliance
    agents = []
    for agent_id, stats in agent_stats.items():
        resolved = stats["tickets_resolved"]
        total_sla = stats["sla_met"] + stats["sla_breached"]
        
        agents.append({
            "id": agent_id,
            "name": stats["name"],
            "tickets_resolved": resolved,
            "avg_resolution_time": round(stats["total_hours"] / resolved, 1) if resolved > 0 else 0,
            "sla_compliance": round((stats["sla_met"] / total_sla) * 100) if total_sla > 0 else 100,
            "nps_score": None  # Would need to link to NPS data
        })
    
    # Sort by tickets resolved (descending)
    agents.sort(key=lambda x: x["tickets_resolved"], reverse=True)
    
    return {"agents": agents}


@router.get("/nps/stats")
async def get_nps_stats(days: int = 30):
    """Get NPS statistics"""
    from_date = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    
    # Get NPS responses
    responses = await db.nps_responses.find({
        "created_at": {"$gte": from_date}
    }).to_list(10000)
    
    total = len(responses)
    if total == 0:
        return {
            "nps_score": None,
            "total_responses": 0,
            "promoters": 0,
            "passives": 0,
            "detractors": 0,
            "promoters_percent": 0,
            "passives_percent": 0,
            "detractors_percent": 0,
            "average_score": None,
            "response_rate": 0
        }
    
    # Calculate NPS
    promoters = sum(1 for r in responses if r.get("score", 0) >= 9)
    passives = sum(1 for r in responses if 7 <= r.get("score", 0) <= 8)
    detractors = sum(1 for r in responses if r.get("score", 0) <= 6)
    
    promoters_pct = round((promoters / total) * 100)
    passives_pct = round((passives / total) * 100)
    detractors_pct = round((detractors / total) * 100)
    
    nps_score = promoters_pct - detractors_pct
    
    avg_score = round(sum(r.get("score", 0) for r in responses) / total, 1)
    
    # Get total resolved tickets in period to calculate response rate
    resolved_tickets = await db.service_desk_tickets.count_documents({
        "created_at": {"$gte": from_date},
        "status": "resolved"
    })
    response_rate = round((total / resolved_tickets) * 100) if resolved_tickets > 0 else 0
    
    return {
        "nps_score": nps_score,
        "total_responses": total,
        "promoters": promoters,
        "passives": passives,
        "detractors": detractors,
        "promoters_percent": promoters_pct,
        "passives_percent": passives_pct,
        "detractors_percent": detractors_pct,
        "average_score": avg_score,
        "response_rate": response_rate
    }
